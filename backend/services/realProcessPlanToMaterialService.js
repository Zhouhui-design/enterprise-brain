/**
 * 真工序计划到备料计划数据流服务
 * 触发时机：真工序计划创建成功且计划排程数量>0
 */

const { pool } = require('../config/database');

class RealProcessPlanToMaterialService {
  /**
   * 推送真工序计划数据到备料计划
   * @param {Object} realProcessPlan - 真工序计划数据
   * @param {Array} processIntervalSettings - 工序间隔设置数据
   * @returns {Promise<Object>} 推送结果
   */
  async pushToMaterialPreparation(realProcessPlan, processIntervalSettings = []) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      console.log('📤 开始推送真工序计划到备料计划...');
      console.log('📊 真工序计划数据:', realProcessPlan);
      
      // 1. 校验前置条件
      if (!realProcessPlan.schedule_quantity || parseFloat(realProcessPlan.schedule_quantity) <= 0) {
        console.log('⚠️ 计划排程数量<=0，跳过推送');
        await connection.rollback();
        return { code: 400, message: '计划排程数量必须大于0' };
      }
      
      // 2. ✅ 查询真工序计划的BOM详情（通过bom_no字段关联列表式BOM）
      const bomNo = realProcessPlan.bom_no;
      const productCode = realProcessPlan.product_code;
      
      if (!productCode) {
        console.log('⚠️ 生产产品编号为空，跳过推送');
        await connection.rollback();
        return { code: 400, message: '生产产品编号为空' };
      }
      
      // ✅ 优先使用bom_no查询，如果没有bom_no则使用product_code查询默认BOM
      let bomChildren = [];
      
      if (bomNo) {
        console.log(`🔍 使用BOM编号查询: ${bomNo}`);
        const [rows] = await connection.execute(`
          SELECT 
            parent.id as parent_id,
            parent.parent_code,
            parent.parent_name,
            children.child_code,
            children.child_name,
            children.output_process,
            children.component_source,
            children.standard_usage
          FROM list_style_production_boms parent
          LEFT JOIN list_style_bom_children children ON parent.id = children.parent_id
          WHERE parent.bom_code = ?
          ORDER BY children.child_sequence
        `, [bomNo]);
        bomChildren = rows;
      } else {
        console.log(`🔍 使用产品编号查询默认BOM: ${productCode}`);
        const [rows] = await connection.execute(`
          SELECT 
            parent.id as parent_id,
            parent.parent_code,
            parent.parent_name,
            children.child_code,
            children.child_name,
            children.output_process,
            children.component_source,
            children.standard_usage
          FROM list_style_production_boms parent
          LEFT JOIN list_style_bom_children children ON parent.id = children.parent_id
          WHERE parent.parent_code = ?
            AND parent.is_default = '是'
          ORDER BY children.child_sequence
        `, [productCode]);
        bomChildren = rows;
      }
      
      if (!bomChildren || bomChildren.length === 0) {
        console.log(`⚠️ 未找到BOM子件数据 (bomNo=${bomNo}, productCode=${productCode})`);
        console.log(`ℹ️ 跳过推送，因为没有需要备料的子件`);
        await connection.commit();
        return { code: 200, message: '真工序计划无BOM子件，跳过推送', data: { count: 0, records: [] } };
      }
      
      console.log(`✅ 找到 ${bomChildren.length} 个BOM子件`);
      
      // 3. 加载工序间隔设置数据（从前端传递）
      const processIntervalMap = this.buildProcessIntervalMap(processIntervalSettings);
      
      // 4. 为每个BOM子件创建备料计划记录
      const createdRecords = [];
      const scheduleQuantity = parseFloat(realProcessPlan.schedule_quantity);
      const scheduleDate = realProcessPlan.schedule_date;
      const parentProcessName = realProcessPlan.process_name;
      
     for (const bomChild of bomChildren) {
        // 计算需领用数量 = 计划排程数量 × 标准用量
        const demandQuantity = scheduleQuantity * parseFloat(bomChild.standard_usage || 0);
        
        // ✅ Lookup工序间隔（增强空值处理）
        const outputProcess = bomChild.output_process || '';
        let intervalHours = null;
        let intervalUnit = null;
        let demandDate = null;
        
        // ✅ 修正计算时机：备料计划insert成功（自动创建），且"父件工序名称"不为空，且"来源工序"不为空
        // 判断是否需要查询工序间隔
        const shouldLookupInterval = (
          parentProcessName &&                    // 父件工序名称不为空（计算完成）
          outputProcess &&                        // 来源工序不为空（计算完成）
          outputProcess !== '采购'                // 来源工序不是"采购"
        );
        
        if (shouldLookupInterval) {
          // 执行lookup查询
          const intervalKey = `${parentProcessName}__${outputProcess}`;
          const interval = processIntervalMap[intervalKey];
          
          if (interval) {
            // ✅ 找到工序间隔配置
            intervalHours = parseFloat(interval.hours || 0);
            intervalUnit = interval.unit || '小时';
            
            // 计算需求日期 = 工序计划排程日期 - 工序间隔工时
            if (scheduleDate && intervalHours > 0) {
              const scheduleDateTime = new Date(scheduleDate);
              if (intervalUnit === '小时') {
                scheduleDateTime.setHours(scheduleDateTime.getHours() - intervalHours);
              } else if (intervalUnit === '天') {
                scheduleDateTime.setDate(scheduleDateTime.getDate() - intervalHours);
              }
              // ✅ 关键修复：使用本地时间格式化，避免UTC时区转换
              const year = scheduleDateTime.getFullYear();
              const month = String(scheduleDateTime.getMonth() + 1).padStart(2, '0');
              const day = String(scheduleDateTime.getDate()).padStart(2, '0');
              demandDate = `${year}-${month}-${day}`;
            } else {
              demandDate = scheduleDate; // 间隔为0，需求日期=排程日期
            }
          } else {
            // ⚠️ 未找到工序间隔配置，使用默认逻辑
            console.log(`⚠️ 未找到工序间隔配置: ${parentProcessName} → ${outputProcess}，工序间隔为空`);
            intervalHours = null;
            intervalUnit = null;
            demandDate = scheduleDate; // 需求日期=排程日期
          }
        } else {
          // ✅ 不需要工序间隔（父件工序为空 or 来源工序=采购）
          console.log(`ℹ️ 跳过工序间隔查询: 父件工序=${parentProcessName}, 来源工序=${outputProcess}`);
          intervalHours = null;
          intervalUnit = null;
          demandDate = scheduleDate; // 需求日期=排程日期
        }
        
        // 生成备料计划编号
        const planNo = this.generatePlanNo();
        
        // ✅ 格式化工序计划排程日期为YYYY-MM-DD（避免时区问题）
        let formattedScheduleDate = null;
        if (scheduleDate) {
          // ✅ 关键：scheduleDate可能是Date对象或字符串，统一处理
          let dateObj;
          if (scheduleDate instanceof Date) {
            dateObj = scheduleDate;
          } else {
            // 字符串格式，可能是 YYYY-MM-DD 或 ISO格式
            dateObj = new Date(scheduleDate);
          }
          
          // ✅ 使用本地时间获取年月日，避免UTC时区转换导致日期减1
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          formattedScheduleDate = `${year}-${month}-${day}`;
        }
        
        // ✅ 插入备料计划记录（优化空值处理 + 新增6个字段）
        const [result] = await connection.execute(`
          INSERT INTO material_preparation_plans (
            plan_no,
            source_plan_no,
            source_process_plan_no,
            parent_code,
            parent_name,
            parent_schedule_quantity,
            material_code,
            material_name,
            material_source,
            material_unit,
            demand_quantity,
            need_mrp,
            realtime_stock,
            projected_balance,
            available_stock,
            replenishment_quantity,
            source_process,
            workshop_name,
            parent_process_name,
            process_interval_hours,
            process_interval_unit,
            process_schedule_date,
            demand_date,
            sales_order_no,
            customer_order_no,
            main_plan_product_code,
            main_plan_product_name,
            main_plan_quantity,
            promise_delivery_date,
            customer_name,
            created_by,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          planNo,
          realProcessPlan.master_plan_no || '',
          realProcessPlan.plan_no || '',
          productCode,
          realProcessPlan.product_name || '',
          scheduleQuantity,
          bomChild.child_code,
          bomChild.child_name,
          bomChild.component_source || '/',
          '/', // 物料单位暂时默认
          demandQuantity,
          0, // 是否需要MRP运算
          0, // 实时库存，暂时默认0
          0, // 预计结存，暂时默认0
          0, // 有效库存，暂时默认0
          demandQuantity - 0, // 需补货数量 = 需求数量 - 有效库存
          outputProcess, // ✅ 使用已处理的outputProcess变量
          '/', // 车间名称
          parentProcessName || null, // ✅ 父件工序名称，空值存null
          intervalHours, // ✅ 工序间隔工时（null 或 数值）
          intervalUnit, // ✅ 工序间隔单位（null 或 '小时'/'天'）
          formattedScheduleDate, // ✅ 工序计划排程日期（YYYY-MM-DD格式，中国时区）
          demandDate,
          realProcessPlan.sales_order_no || null, // ✅ 新增：销售订单编号
          realProcessPlan.customer_order_no || null, // ✅ 新增：客户订单编号
          realProcessPlan.main_plan_product_code || null, // ✅ 新增：主计划产品编号
          realProcessPlan.main_plan_product_name || null, // ✅ 新增：主计划产品名称
          realProcessPlan.level0_demand || 0, // ✅ 新增：主计划排程数量（真工序计划的0阶需求数量）
          realProcessPlan.promise_delivery_date || null, // ✅ 新增：订单承诺交期
          realProcessPlan.customer_name || null, // ✅ 新增：客户名称
          'system' // ✅ created_by（新增第31个参数）
        ]);
        
        createdRecords.push({
          id: result.insertId,
          planNo: planNo,
          materialCode: bomChild.child_code,
          materialName: bomChild.child_name
        });
      }
      
      await connection.commit();
      
      console.log(`✅ 成功推送 ${createdRecords.length} 条备料计划记录`);
      
      // ✅ 关键修复：在commit成功后立即触发备料计划推送到真工序计划的规则
      if (createdRecords.length > 0) {
        console.log(`\n🔄 [数据闭环] 备料计划INSERT成功，触发推送到真工序计划规则...`);
        console.log(`   本次INSERT了 ${createdRecords.length} 条备料计划`);
        
        try {
          const MaterialPreparationPlanService = require('./materialPreparationPlanService');
          const { pool: dbPool } = require('../config/database');
          
          // 遍历刚刚插入的备料计划
          for (const record of createdRecords) {
            const materialPlanNo = record.planNo;
            console.log(`\n   🔍 处理备料计划: ${materialPlanNo}`);
            
            // 查询备料计划完整详情（此时已经commit，可以查到）
            const [materialPlanRows] = await dbPool.execute(`
              SELECT 
                id, plan_no, source_plan_no, material_code, material_name,
                material_source, material_unit, demand_quantity, available_stock,
                replenishment_quantity, source_process, demand_date,
                sales_order_no, customer_order_no, main_plan_product_code,
                main_plan_product_name, main_plan_quantity, promise_delivery_date,
                customer_name, created_by
              FROM material_preparation_plans
              WHERE plan_no = ?
              LIMIT 1
            `, [materialPlanNo]);
            
            if (materialPlanRows.length === 0) {
              console.log(`   ⚠️ 未找到备料计划: ${materialPlanNo}（可能事务未提交）`);
              continue;
            }
            
            const materialPlan = materialPlanRows[0];
            const replenishmentQty = parseFloat(materialPlan.replenishment_quantity || 0);
            
            console.log(`   📊 备料计划详情:`);
            console.log(`      物料编号: ${materialPlan.material_code}`);
            console.log(`      物料名称: ${materialPlan.material_name}`);
            console.log(`      物料来源: ${materialPlan.material_source}`);
            console.log(`      需补货数量: ${replenishmentQty}`);
            console.log(`      来源工序: ${materialPlan.source_process}`);
            
            // 检查推送条件（与备料计划推送规则一致）
            if (materialPlan.material_source !== '自制') {
              console.log(`   ⏭️ 物料来源非"自制"(${materialPlan.material_source})，跳过推送`);
              continue;
            }
            
            if (replenishmentQty <= 0) {
              console.log(`   ⏭️ 需补货数量≤0(${replenishmentQty})，跳过推送`);
              continue;
            }
            
            // ✅ 防重复推送检查
            const [existingPlans] = await dbPool.execute(`
              SELECT id, plan_no FROM real_process_plans
              WHERE source_no = ? AND product_code = ?
              LIMIT 1
            `, [materialPlan.plan_no, materialPlan.material_code]);
            
            if (existingPlans.length > 0) {
              console.log(`   ⏭️ 检测到重复推送，跳过: ${materialPlan.plan_no} → ${existingPlans[0].plan_no} (已存在)`);
              continue;
            }
            
            console.log(`   ✅ 满足推送条件，开始推送到真工序计划...`);
            
            // 转换数据格式（与MaterialPreparationPlanService.autoTriggerPush保持一致）
            const planData = {
              planNo: materialPlan.plan_no,
              sourcePlanNo: materialPlan.source_plan_no,
              materialCode: materialPlan.material_code,
              materialName: materialPlan.material_name,
              materialSource: materialPlan.material_source,
              materialUnit: materialPlan.material_unit,
              demandQuantity: materialPlan.demand_quantity,
              availableStock: materialPlan.available_stock,
              replenishmentQuantity: materialPlan.replenishment_quantity,
              sourceProcess: materialPlan.source_process,
              demandDate: materialPlan.demand_date,
              salesOrderNo: materialPlan.sales_order_no,
              customerOrderNo: materialPlan.customer_order_no,
              mainPlanProductCode: materialPlan.main_plan_product_code,
              mainPlanProductName: materialPlan.main_plan_product_name,
              mainPlanQuantity: materialPlan.main_plan_quantity,
              promiseDeliveryDate: materialPlan.promise_delivery_date,
              customerName: materialPlan.customer_name,
              createdBy: materialPlan.created_by
            };
            
            // 调用备料计划推送逻辑
            await MaterialPreparationPlanService.pushMaterialPlanToRealProcessPlan(planData);
            
            console.log(`   ✅ 备料计划 ${materialPlanNo} 推送到真工序计划成功`);
          }
          
          console.log(`\n✅ [数据闭环] 备料计划推送规则触发完成`);
        } catch (loopError) {
          console.error(`\n⚠️ [数据闭环] 触发备料计划推送规则时出错:`, loopError.message);
          console.error(loopError.stack);
          // 不阻塞主流程，继续返回成功
        }
      }
      
      return {
        code: 200,
        message: '推送成功',
        data: {
          count: createdRecords.length,
          records: createdRecords
        }
      };
      
    } catch (error) {
      await connection.rollback();
      console.error('❌ 推送备料计划失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * 构建工序间隔设置map
   * @param {Array} settings - 工序间隔设置数据
   * @returns {Object} map对象
   */
  buildProcessIntervalMap(settings) {
    const map = {};
    if (Array.isArray(settings)) {
      settings.forEach(item => {
        const key = `${item.previousProcess}__${item.nextProcess}`;
        map[key] = {
          hours: parseFloat(item.intervalValue || 0),
          unit: item.intervalUnit || '小时'
        };
      });
    }
    return map;
  }
  
  /**
   * 加载工序间隔设置
   * 注意：目前工序间隔设置存储在localStorage，这里返回空Map
   * 实际使用时需要从前端传递或创建数据库表
   */
  async loadProcessIntervalSettings() {
    // TODO: 从数据库表或前端传递获取工序间隔设置
    // 返回格式: { "上道工序__下道工序": { hours: 数值, unit: 单位 } }
    return {};
  }
  
  /**
   * 生成备料计划编号
   * 格式：MPP + 年月日 + 毫秒级时间戳
   */
  generatePlanNo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString(); // 使用完整毫秒时间戳
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 添加随机数
    return `MPP${year}${month}${day}${timestamp}${random}`;
  }
}

module.exports = new RealProcessPlanToMaterialService();
