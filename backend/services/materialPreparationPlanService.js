const { pool } = require('../config/database');
const { getProcessConfig } = require('../config/processTypes');
const RealProcessPlanService = require('./realProcessPlanService');  // ✅ 引入真工序计划Service

/**
 * 备料计划服务
 */
class MaterialPreparationPlanService {
  /**
   * 获取所有备料计划（分页）
   */
  static async getAll(params = {}) {
    try {
      const { page = 1, pageSize = 20, planNo, sourcePlanNo, materialCode, demandDateStart, demandDateEnd } = params;
      
      let whereClause = [];
      const queryParams = [];
      
      if (planNo) {
        whereClause.push('plan_no LIKE ?');
        queryParams.push(`%${planNo}%`);
      }
      
      if (sourcePlanNo) {
        whereClause.push('source_plan_no LIKE ?');
        queryParams.push(`%${sourcePlanNo}%`);
      }
      
      if (materialCode) {
        whereClause.push('material_code LIKE ?');
        queryParams.push(`%${materialCode}%`);
      }
      
      if (demandDateStart) {
        whereClause.push('demand_date >= ?');
        queryParams.push(demandDateStart);
      }
      
      if (demandDateEnd) {
        whereClause.push('demand_date <= ?');
        queryParams.push(demandDateEnd);
      }
      
      const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';
      
      // 查询总数
      const countSQL = `SELECT COUNT(*) as total FROM material_preparation_plans ${whereSQL}`;
      const [countResult] = await pool.execute(countSQL, queryParams);
      const total = countResult[0].total;
      
      // 分页查询（✅ 格式化日期字段为中国时区）
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const limit = parseInt(pageSize);
      const dataSQL = `
        SELECT 
          id, plan_no, source_plan_no, source_process_plan_no,
          parent_code, parent_name, parent_schedule_quantity,
          material_code, material_name, material_source, material_unit,
          demand_quantity, need_mrp, realtime_stock, projected_balance,
          available_stock, replenishment_quantity, source_process,
          workshop_name, parent_process_name, process_interval_hours,
          process_interval_unit,
          DATE_FORMAT(process_schedule_date, '%Y-%m-%d') as process_schedule_date,
          DATE_FORMAT(demand_date, '%Y-%m-%d') as demand_date,
          push_to_purchase, push_to_process, sales_order_no, customer_order_no,
          main_plan_product_code, main_plan_product_name, main_plan_quantity,
          DATE_FORMAT(promise_delivery_date, '%Y-%m-%d') as promise_delivery_date,
          remark, created_by, created_at, updated_by, updated_at
        FROM material_preparation_plans 
        ${whereSQL}
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
      const [rows] = await pool.execute(dataSQL, queryParams);
      
      // 转换字段名:下划线转驼峰
      const records = rows.map(row => ({
id: row.id,
        planNo: row.plan_no,
        sourcePlanNo: row.source_plan_no,
        sourceProcessPlanNo: row.source_process_plan_no,
        parentCode: row.parent_code,
        parentName: row.parent_name,
        parentScheduleQuantity: row.parent_schedule_quantity,
        materialCode: row.material_code,
        materialName: row.material_name,
        materialSource: row.material_source,
        materialUnit: row.material_unit,
        demandQuantity: row.demand_quantity,
        needMrp: row.need_mrp,
        realtimeStock: row.realtime_stock,
        projectedBalance: row.projected_balance,
        availableStock: row.available_stock,
        replenishmentQuantity: row.replenishment_quantity,  // ✅ 新增：需补货数量字段映射
        sourceProcess: row.source_process,
        workshopName: row.workshop_name,
        parentProcessName: row.parent_process_name,
        processIntervalHours: row.process_interval_hours,
        processIntervalUnit: row.process_interval_unit,
        processScheduleDate: row.process_schedule_date,
        demandDate: row.demand_date,
        pushToPurchase: row.push_to_purchase,
        pushToProcess: row.push_to_process,
        salesOrderNo: row.sales_order_no,
        customerOrderNo: row.customer_order_no,
        mainPlanProductCode: row.main_plan_product_code,
        mainPlanProductName: row.main_plan_product_name,
        mainPlanQuantity: row.main_plan_quantity,
        promiseDeliveryDate: row.promise_delivery_date,
        remark: row.remark,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedBy: row.updated_by,
        updatedAt: row.updated_at
      }));
      
      return {
        records,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };
    } catch (error) {
      console.error('获取备料计划列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取备料计划（✅ 格式化日期字段）
   */
  static async getById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          id, plan_no, source_plan_no, source_process_plan_no,
          parent_code, parent_name, parent_schedule_quantity,
          material_code, material_name, material_source, material_unit,
          demand_quantity, need_mrp, realtime_stock, projected_balance,
          available_stock, replenishment_quantity, source_process,
          workshop_name, parent_process_name, process_interval_hours,
          process_interval_unit,
          DATE_FORMAT(process_schedule_date, '%Y-%m-%d') as process_schedule_date,
          DATE_FORMAT(demand_date, '%Y-%m-%d') as demand_date,
          push_to_purchase, push_to_process, sales_order_no, customer_order_no,
          main_plan_product_code, main_plan_product_name, main_plan_quantity,
          DATE_FORMAT(promise_delivery_date, '%Y-%m-%d') as promise_delivery_date,
          remark, created_by, created_at, updated_by, updated_at
        FROM material_preparation_plans WHERE id = ?
      `, [id]);
      return rows[0];
    } catch (error) {
      console.error('获取备料计划详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建备料计划
   */
  static async create(data) {
    let connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const sql = `
        INSERT INTO material_preparation_plans (
          plan_no, source_plan_no, source_process_plan_no, 
          parent_code, parent_name, parent_schedule_quantity,
          material_code, material_name,
          material_source, material_unit, demand_quantity, need_mrp, realtime_stock,
          projected_balance, available_stock, replenishment_quantity, source_process, 
          parent_process_name, process_interval_hours, process_interval_unit,
          process_schedule_date, workshop_name,
          demand_date,
          push_to_purchase, push_to_process, sales_order_no, customer_order_no,
          main_plan_product_code, main_plan_product_name, main_plan_quantity,
          promise_delivery_date, remark, created_by, created_at, updated_by, updated_at,
          product_image, customer_name, submitter, submit_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await connection.execute(sql, [
        data.planNo,
        data.sourcePlanNo || null,
        data.sourceProcessPlanNo || null,
        data.parentCode || null,
        data.parentName || null,
        data.parentScheduleQuantity || null,
        data.materialCode,
        data.materialName,
        data.materialSource || null,
        data.materialUnit || null,
        data.demandQuantity || 0,
        data.needMrp ? 1 : 0,
        data.realtimeStock || 0,
        data.projectedBalance || 0,
        data.availableStock || 0,
        (data.demandQuantity || 0) - (data.availableStock || 0), // replenishment_quantity
        data.sourceProcess || null,
        data.parentProcessName || null,
        data.processIntervalHours || null,
        data.processIntervalUnit || null,
        data.processScheduleDate || null,
        data.workshopName || null,
        data.demandDate || null,
        data.pushToPurchase ? 1 : 0,
        data.pushToProcess ? 1 : 0,
        data.salesOrderNo || null,
        data.customerOrderNo || null,
        data.mainPlanProductCode || null,
        data.mainPlanProductName || null,
        data.mainPlanQuantity || 0,
        data.promiseDeliveryDate || null,
        data.remark || null,
        data.createdBy || null,
        new Date(),  // created_at
        data.createdBy || null,  // updated_by
        new Date(),  // updated_at
        data.productImage || null,
        data.customerName || null,
        data.submitter || null,
        new Date()   // submit_time
      ]);
      
      const insertedId = result.insertId;
      console.log(`备料计划创建成功, ID: ${insertedId}, 编号: ${data.planNo}`);
      
      await connection.commit();
      
      // ✅ 自动推送到工序计划（在事务提交后）
      if (data.planNo && data.materialSource === '自制') {
        const demandQty = parseFloat(data.demandQuantity || 0);
        const availableQty = parseFloat(data.availableStock || 0);
        const replenishmentQty = demandQty - availableQty;
        
        if (replenishmentQty > 0) {
          console.log('🔄 备料计划创建成功，开始自动推送到工序计划...');
          
          try {
            const pushResult = await this.pushToRealProcessPlan(data);
            
            if (pushResult && pushResult.success) {
              console.log(`✅ 自动推送成功: ${data.planNo} → ${pushResult.serviceName} (${pushResult.planNo})`);
              
              // 更新推送状态
              await pool.execute(
                'UPDATE material_preparation_plans SET push_to_process = ? WHERE plan_no = ?',
                [1, data.planNo]
              );
            } else {
              console.log(`⏭️ 推送跳过: ${pushResult ? pushResult.reason : '未知原因'}`);
            }
          } catch (pushError) {
            console.error(`❌ 自动推送失败:`, pushError.message);
          }
        } else {
          console.log('⏭️ 需补货数量≤0，跳过推送');
        }
      }
      
      // ✅ 新增：自动推送到采购计划（在事务提交后）
      if (data.planNo && data.sourceProcess === '采购') {
        const demandQty = parseFloat(data.demandQuantity || 0);
        const availableQty = parseFloat(data.availableStock || 0);
        const replenishmentQty = demandQty - availableQty;
        
        if (replenishmentQty > 0) {
          console.log('🛒 备料计划创建成功，来源工序=采购，开始自动推送到采购计划...');
          
          try {
            const pushResult = await this.pushToProcurementPlan(data);
            
            if (pushResult && pushResult.success) {
              console.log(`✅ 推送采购计划成功: ${data.planNo} → 采购计划 (${pushResult.procurementPlanNo})`);
              
              // 更新推送状态
              await pool.execute(
                'UPDATE material_preparation_plans SET push_to_purchase = ? WHERE plan_no = ?',
                [1, data.planNo]
              );
            } else {
              console.log(`⏭️ 推送采购计划跳过: ${pushResult ? pushResult.reason : '未知原因'}`);
            }
          } catch (pushError) {
            console.error(`❌ 推送采购计划失败:`, pushError.message);
          }
        } else {
          console.log('⏭️ 需补货数量≤0，跳过推送到采购计划');
        }
      }
      
      return { 
        id: insertedId
      };
    } catch (error) {
      await connection.rollback();
      console.error('更新备料计划失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 删除备料计划
   */
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM material_preparation_plans WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('备料计划不存在');
      }
      
      console.log(`备料计划删除成功, ID: ${id}`);
      return { success: true };
    } catch (error) {
      console.error('删除备料计划失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除备料计划
   */
  static async batchDelete(ids) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      let successCount = 0;
      for (const id of ids) {
        const [result] = await connection.execute('DELETE FROM material_preparation_plans WHERE id = ?', [id]);
        successCount += result.affectedRows;
      }
      
      await connection.commit();
      console.log(`批量删除备料计划完成: 成功${successCount}条/总共${ids.length}条`);
      return { successCount, totalCount: ids.length };
    } catch (error) {
      await connection.rollback();
      console.error('批量删除备料计划失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 自动触发推送检查 - 检查所有满足条件的备料计划并推送到真工序计划
   */
  static async autoTriggerPush() {
    console.log('🔄 开始自动触发推送检查...');
    
    try {
      // 查询所有满足推送条件的备料计划
      const [qualifyingPlans] = await pool.execute(`
        SELECT 
          id, plan_no, source_plan_no, source_process_plan_no,
          parent_code, parent_name, parent_schedule_quantity,
          material_code, material_name, material_source, material_unit,
          demand_quantity, need_mrp, realtime_stock, projected_balance,
          available_stock, replenishment_quantity, source_process,
          workshop_name, parent_process_name, process_interval_hours,
          process_interval_unit,
          DATE_FORMAT(process_schedule_date, '%Y-%m-%d') as process_schedule_date,
          DATE_FORMAT(demand_date, '%Y-%m-%d') as demand_date,
          push_to_purchase, push_to_process, sales_order_no, customer_order_no,
          main_plan_product_code, main_plan_product_name, main_plan_quantity,
          DATE_FORMAT(promise_delivery_date, '%Y-%m-%d') as promise_delivery_date,
          remark, created_by, created_at, updated_by, updated_at
        FROM material_preparation_plans 
        WHERE material_source = '自制' 
          AND CAST(demand_quantity AS DECIMAL(10,4)) - CAST(available_stock AS DECIMAL(10,4)) > 0
          AND plan_no IS NOT NULL
        ORDER BY created_at DESC
      `);

      console.log(`📊 找到 ${qualifyingPlans.length} 条满足条件的备料计划`);

      let pushCount = 0;
      
      for (const plan of qualifyingPlans) {
        console.log(`\n📤 开始推送备料计划: ${plan.plan_no} (${plan.material_code}, ${plan.material_source}, ${plan.replenishment_quantity})`);
        
        // 转换数据格式并推送到真工序计划
        const planData = {
          planNo: plan.plan_no,
          sourcePlanNo: plan.source_plan_no,
          sourceProcessPlanNo: plan.source_process_plan_no,
          parentCode: plan.parent_code,
          parentName: plan.parent_name,
          parentScheduleQuantity: plan.parent_schedule_quantity,
          materialCode: plan.material_code,
          materialName: plan.material_name,
          materialSource: plan.material_source,
          materialUnit: plan.material_unit,
          demandQuantity: plan.demand_quantity,
          needMrp: plan.need_mrp,
          realtimeStock: plan.realtime_stock,
          projectedBalance: plan.projected_balance,
          availableStock: plan.available_stock,
          replenishmentQuantity: plan.replenishment_quantity,
          sourceProcess: plan.source_process,
          workshopName: plan.workshop_name,
          parentProcessName: plan.parent_process_name,
          processIntervalHours: plan.process_interval_hours,
          processIntervalUnit: plan.process_interval_unit,
          processScheduleDate: plan.process_schedule_date,
          demandDate: plan.demand_date,
          pushToPurchase: plan.push_to_purchase,
          pushToProcess: plan.push_to_process,
          salesOrderNo: plan.sales_order_no,
          customerOrderNo: plan.customer_order_no,
          mainPlanProductCode: plan.main_plan_product_code,
          mainPlanProductName: plan.main_plan_product_name,
          mainPlanQuantity: plan.main_plan_quantity,
          promiseDeliveryDate: plan.promise_delivery_date,
          remark: plan.remark,
          createdBy: plan.created_by
        };

        // ✅ 启用：备料计划推送到工序计划（支持打包/组装工序计划）
        try {
          // 调用推送逻辑（自动路由到打包/组装工序计划）
          const pushResult = await this.pushToRealProcessPlan(planData);
          if (pushResult.success) {
            pushCount++;
            console.log(`✅ 成功推送: ${plan.planNo} → ${pushResult.serviceName} (${pushResult.planNo})`);
          } else {
            console.log(`⏭️ 跳过推送: ${plan.planNo} - 原因: ${pushResult.reason}`);
          }
        } catch (pushError) {
          console.error(`❌ 推送失败: ${plan.planNo}`, pushError.message);
        }
      }

      console.log(`\n📊 自动触发推送完成: 成功推送${pushCount}条, 总计${qualifyingPlans.length}条满足条件的备料计划`);
      
      return {
        total: qualifyingPlans.length,
        success: pushCount
      };
    } catch (error) {
      console.error('❌ 自动触发推送检查失败:', error);
      throw error;
    }
  }

  /**
   * 推送到真工序计划 - 从create方法中提取的推送逻辑
   * ✅ 防重复推送：通过source_no字段关联备料计划编号
   */
  static async pushToRealProcessPlan(data) {
    const connection = await pool.getConnection();
    
    try {
      // 检查推送条件
      const demandQty = parseFloat(data.demandQuantity || 0);
      const availableQty = parseFloat(data.availableStock || 0);
      const replenishmentQty = demandQty - availableQty;
      
      const shouldPush = (
        data.materialSource === '自制' && 
        replenishmentQty > 0
      );
      
      if (!shouldPush) {
        console.log('⚠️ 不符合推送条件');
        return;
      }

      // ✅ 根据规则文档：使用备料计划的"来源工序"(source_process)进行路由
      // 从产品物料库查询定时工额、定额工时
      let standardWorkQuota = 0;
      let standardWorkHours = 0;
      
      if (data.materialCode) {
        try {
          const [materialRows] = await connection.execute(
            'SELECT material_code, standard_time, quota_time FROM materials WHERE material_code = ? LIMIT 1',
            [data.materialCode]
          );
          
          if (materialRows.length > 0) {
            const material = materialRows[0];
            standardWorkQuota = parseFloat(material.standard_time || 0);  // 定时工额
            standardWorkHours = parseFloat(material.quota_time || 0);      // 定额工时
            console.log(`✅ 查询到物料数据: 定时工额=${standardWorkQuota}, 定额工时=${standardWorkHours}`);
          } else {
            console.warn(`⚠️ 未找到物料数据: ${data.materialCode}`);
          }
        } catch (queryError) {
          console.error(`❌ 查询物料数据失败:`, queryError.message);
        }
      }

      // ✅ 使用来源工序（而非产出工序）
      const processName = data.sourceProcess;
      
      // ✅ 检查来源工序是否为空
      if (!processName) {
        console.warn(`⚠️ 来源工序为空，无法推送: 物料编号=${data.materialCode}`);
        return { success: false, reason: 'no_source_process', materialCode: data.materialCode };
      }

      // ✅ 检查来源工序是否支持（使用配置系统判断）
      const processConfig = getProcessConfig(processName);
      if (!processConfig) {
        console.log(`⏭️ 来源工序=${processName}，不在推送范围内，跳过推送`);
        return { success: false, reason: 'unsupported_source_process', processName };
      }
      console.log(`✅ 工序配置验证成功: ${processName} → ${processConfig.displayName}`);

      // ✅ 防重复推送检查（使用配置系统确定检查表）
      const checkTable = processConfig.tableName;

      // 执行防重检查
      const [existingPlans] = await connection.execute(`
        SELECT id, plan_no FROM ${checkTable}
        WHERE source_no = ? AND product_code = ?
        LIMIT 1
      `, [data.planNo, data.materialCode]);

      if (existingPlans.length > 0) {
        console.log(`⏭️ [防重检查] 检测到重复推送，跳过: 备料计划=${data.planNo} → 工序计划=${existingPlans[0].plan_no}`);
        console.log(`   来源工序=${processName}, 目标表=${checkTable}`);
        return { success: false, reason: 'duplicate', planNo: existingPlans[0].plan_no, table: checkTable, processName };
      }

      // 生成真工序计划编号
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const realProcessPlanNo = `RPP${year}${timestamp}${random}`;

      // 计算计划完工日期 = 需求日期 - 1天
      let completionDate = null;
      if (data.demandDate) {
        const demandDate = new Date(data.demandDate);
        demandDate.setDate(demandDate.getDate() - 1);
        const year = demandDate.getFullYear();
        const month = String(demandDate.getMonth() + 1).padStart(2, '0');
        const day = String(demandDate.getDate()).padStart(2, '0');
        completionDate = `${year}-${month}-${day}`;
      }

      // 计算需求工时 = 需补货数量 / 定时工额
      let requiredWorkHours = 0;
      if (replenishmentQty > 0 && standardWorkQuota > 0) {
        requiredWorkHours = parseFloat((replenishmentQty / standardWorkQuota).toFixed(2));
      }
      console.log(`🧮 计算需求工时: ${replenishmentQty} / ${standardWorkQuota} = ${requiredWorkHours}`);

      // 查询计划结束日期
      let planEndDate = null;
      if (requiredWorkHours > 0 && processName && completionDate) {  // ✅ 使用processName
        try {
          const minRemainingHours = 0.5;
          const [capacityRows] = await connection.execute(`
            SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, remaining_hours 
            FROM process_capacity_load 
            WHERE process_name = ? 
              AND date <= ? 
              AND remaining_hours >= ? 
            ORDER BY date DESC 
            LIMIT 1
          `, [processName, completionDate, minRemainingHours]);  // ✅ 使用processName
          
          if (capacityRows.length > 0) {
            planEndDate = capacityRows[0].date;
            console.log(`✅ 计划结束日期: ${planEndDate}`);
          }
        } catch (error) {
          console.error(`❌ 查询计划结束日期失败:`, error.message);
        }
      }

      // 查询计划开始日期
      let planStartDate = null;
      if (requiredWorkHours > 0 && processName && planEndDate) {  // ✅ 使用processName
        try {
          const minRemainingHours = 0.5;
          const [validRows] = await connection.execute(`
            SELECT date, remaining_hours
            FROM process_capacity_load
            WHERE process_name = ?
              AND date <= ?
              AND remaining_hours >= ?
            ORDER BY date DESC
          `, [processName, planEndDate, minRemainingHours]);  // ✅ 使用processName
          
          let accumulated = 0;
          for (const row of validRows) {
            const dateStr = row.date instanceof Date 
              ? row.date.toISOString().split('T')[0]
              : String(row.date).split('T')[0];
            const hours = parseFloat(row.remaining_hours) || 0;
            
            accumulated += hours;
            if (accumulated >= requiredWorkHours) {
              planStartDate = dateStr;
              console.log(`✅ 计划开始日期: ${planStartDate}, 累计工时: ${accumulated.toFixed(2)}`);
              break;
            }
          }
        } catch (error) {
          console.error(`❌ 查询计划开始日期失败:`, error.message);
        }
      }

      // 计算真计划开始日期 = 计划开始日期 + 1天
      let realPlanStartDate = null;
      if (planStartDate) {
        const startDate = new Date(planStartDate);
        startDate.setDate(startDate.getDate() + 1);
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        realPlanStartDate = `${year}-${month}-${day}`;
      }

      // 计划排程日期 = 真计划开始日期
      const scheduleDate = realPlanStartDate;

      // ✅ 查询当天总工时 (从工序能力负荷表)
      let dailyTotalHours = 0;
      if (scheduleDate && processName) {  // ✅ 使用processName
        try {
          const [capacityRows] = await connection.execute(`
            SELECT work_shift, available_workstations 
            FROM process_capacity_load 
            WHERE process_name = ? AND DATE_FORMAT(date, '%Y-%m-%d') = ?
            LIMIT 1
          `, [processName, scheduleDate]);  // ✅ 使用processName
          
          if (capacityRows.length > 0) {
            const workShift = parseFloat(capacityRows[0].work_shift || 0);
            const availableWorkstations = parseFloat(capacityRows[0].available_workstations || 0);
            dailyTotalHours = parseFloat((workShift * availableWorkstations).toFixed(2));
            console.log(`✅ 查询当天总工时: 工序=${processName}, 日期=${scheduleDate}, 班次=${workShift}, 工位数=${availableWorkstations}, 总工时=${dailyTotalHours}`);
          } else {
            console.warn(`⚠️ 未查询到工序能力负荷记录: 工序=${processName}, 日期=${scheduleDate}`);
          }
        } catch (error) {
          console.error(`❌ 查询当天总工时失败:`, error.message);
        }
      }

      // ✅ 查询当天已排程工时 (累积之前所有记录的scheduled_work_hours)
      // 规则: 后生成的记录(ID大)累积前面记录(ID小)的排程工时
      let dailyScheduledHours = 0;
      if (scheduleDate && processName) {  // ✅ 使用processName
        try {
          // ✅ 根据工序类型获取配置，确定目标表名
          const processConfig = getProcessConfig(processName);
          if (!processConfig) {
            console.warn(`⚠️ 不支持的工序类型: ${processName}，已跳过推送`);
            return { success: false, reason: 'unsupported_process', processName };
          }
          
          const targetTableForQuery = processConfig.tableName;
          
          const [scheduledRows] = await connection.execute(`
            SELECT COALESCE(SUM(scheduled_work_hours), 0) as total_scheduled_hours
            FROM ${targetTableForQuery}
            WHERE process_name = ?
              AND DATE_FORMAT(schedule_date, '%Y-%m-%d') = ?
          `, [processName, scheduleDate]);  // ✅ 使用processName
          
          if (scheduledRows.length > 0) {
            dailyScheduledHours = parseFloat(scheduledRows[0].total_scheduled_hours || 0);
            console.log(`✅ 查询当天已排程工时: 工序=${processName}, 日期=${scheduleDate}, 累积已排程=${dailyScheduledHours} (表: ${targetTableForQuery})`);
          }
        } catch (error) {
          console.error(`❌ 查询当天已排程工时失败:`, error.message);
        }
      }

      // ✅ 计算当天可用工时 = 当天总工时 - 当天已排程工时
      let dailyAvailableHours = 0;
      if (dailyTotalHours > 0) {
        dailyAvailableHours = parseFloat((dailyTotalHours - dailyScheduledHours).toFixed(2));
        if (dailyAvailableHours < 0) dailyAvailableHours = 0;
        console.log(`🧠 计算当天可用工时: ${dailyTotalHours} - ${dailyScheduledHours} = ${dailyAvailableHours}`);
      }

      // ✅ 计算计划排程工时 = min(需求工时, 当天可用工时)
      let scheduledWorkHours = 0;
      if (requiredWorkHours > 0 && dailyAvailableHours >= 0) {
        scheduledWorkHours = parseFloat(Math.min(requiredWorkHours, dailyAvailableHours).toFixed(2));
        console.log(`⌛ 计算计划排程工时: min(${requiredWorkHours}, ${dailyAvailableHours}) = ${scheduledWorkHours}`);
      }

      // ✅ 计算计划排程数量 = ROUNDUP(计划排程工时 * 定时工额) - 向上取整
      let scheduleQuantity = 0;
      if (scheduledWorkHours > 0 && standardWorkQuota > 0) {
        const rawQuantity = scheduledWorkHours * standardWorkQuota;
        scheduleQuantity = Math.ceil(rawQuantity);  // ✅ 使用Math.ceil()向上取整
        console.log(`📊 计算计划排程数量: ROUNDUP(${scheduledWorkHours} * ${standardWorkQuota}) = ROUNDUP(${rawQuantity.toFixed(4)}) = ${scheduleQuantity}`);
      }

      // ✅ 计算下一个排程日期 = 计划排程日期 + 1天
      let nextScheduleDate = null;
      if (scheduleDate) {
        const nextDate = new Date(scheduleDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const year = nextDate.getFullYear();
        const month = String(nextDate.getMonth() + 1).padStart(2, '0');
        const day = String(nextDate.getDate()).padStart(2, '0');
        nextScheduleDate = `${year}-${month}-${day}`;
        console.log(`📅 计算下一个排程日期: ${scheduleDate} + 1天 = ${nextScheduleDate}`);
      }

      // 创建真工序计划数据
      // ⚠️ 注意：字段命名不一致问题
      // - 备料计划表：main_plan_product_code/main_plan_product_name
      // - 真工序计划表：main_plan_product_code/main_plan_product_name (历史遗留)
      // - 组装工序计划表：master_plan_product_code/master_plan_product_name (正确)
      // → 为了兼容，使用mainPlanProductCode字段名（与realProcessPlanService保持一致）
      const realProcessPlanData = {
        planNo: realProcessPlanNo,
        salesOrderNo: data.salesOrderNo,
        customerOrderNo: data.customerOrderNo,
        masterPlanNo: data.sourcePlanNo,
        mainPlanProductCode: data.mainPlanProductCode || data.materialCode,  // ✅ 使用mainPlanProductCode（对应数据库main_plan_product_code字段）
        mainPlanProductName: data.mainPlanProductName || data.materialName,  // ✅ 使用mainPlanProductName（对应数据库main_plan_product_name字段）
        productCode: data.materialCode,
        productName: data.materialName,
        processName: processName,  // ✅ 使用来源工序，而非sourceProcess
        productUnit: data.materialUnit,
        level0Demand: data.mainPlanQuantity,
        completionDate: completionDate,
        promiseDeliveryDate: data.promiseDeliveryDate,
        replenishmentQty: replenishmentQty,
        standardWorkQuota: standardWorkQuota,
        standardWorkHours: standardWorkHours,
        requiredWorkHours: requiredWorkHours,
        planEndDate: planEndDate,
        planStartDate: planStartDate,
        realPlanStartDate: realPlanStartDate,
        scheduleDate: scheduleDate,
        customerName: data.customerName,
        sourceNo: data.planNo,  // ✅ 关键：使用备料计划编号作为来源编号
        scheduleCount: 1,
        dailyTotalHours: dailyTotalHours,  // ✅ 新增：当天总工时
        dailyScheduledHours: dailyScheduledHours,  // ✅ 新增：当天已排程工时(累积之前记录)
        dailyAvailableHours: dailyAvailableHours,  // ✅ 新增：当天可用工时
        scheduledWorkHours: scheduledWorkHours,  // ✅ 新增：计划排程工时
        scheduleQuantity: scheduleQuantity,  // ✅ 新增：计划排程数量
        nextScheduleDate: nextScheduleDate,  // ✅ 新增：下一个排程日期
        submittedBy: data.createdBy || 'admin',
        submittedAt: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
      };

      console.log(`📦 待推送数据检查:`);
      console.log(`   销售订单编号(salesOrderNo): ${realProcessPlanData.salesOrderNo}`);
      console.log(`   客户订单编号(customerOrderNo): ${realProcessPlanData.customerOrderNo}`);
      console.log(`   主计划产品编号(mainPlanProductCode): ${realProcessPlanData.mainPlanProductCode}`);
      console.log(`   主计划产品名称(mainPlanProductName): ${realProcessPlanData.mainPlanProductName}`);
      console.log(`   来源编号(sourceNo): ${realProcessPlanData.sourceNo}`);
      console.log(`   需补货数量(replenishmentQty): ${realProcessPlanData.replenishmentQty}`);
      console.log(`   计划排程数量(scheduleQuantity): ${realProcessPlanData.scheduleQuantity}`);
      console.log(`   计划排程工时(scheduledWorkHours): ${realProcessPlanData.scheduledWorkHours}`);
      console.log(`   需求工时(requiredWorkHours): ${realProcessPlanData.requiredWorkHours}`);
      console.log(`   工序名称(processName): ${realProcessPlanData.processName}`);
      console.log(`   计划排程日期(scheduleDate): ${realProcessPlanData.scheduleDate}`);
      console.log(`   ⚠️ 字段命名说明：使用mainPlanProductCode/mainPlanProductName（对应数据库main_plan_product_code/main_plan_product_name字段）`);


      // ✅ 根据来源工序路由到不同的Service（使用配置系统）
      // processConfig 已在第478行声明，这里直接使用
      
      // 动态加载Service
      const ProcessPlanService = require(`./${processConfig.serviceName}`);
      const planNoPrefix = processConfig.planNoPrefix;
      const serviceName = processConfig.displayName;
      const targetTable = processConfig.tableName;
      
      console.log(`📍 [数据路由] 来源工序=${processName} → 推送到${serviceName} (表: ${targetTable})`);
      console.log(`   备料计划编号=${data.planNo}`);
      console.log(`   物料编号=${data.materialCode}, 物料名称=${data.materialName}`);
      console.log(`   需补货数量=${replenishmentQty}`);

      // 调用对应Service创建工序计划
      const createResult = await ProcessPlanService.create(realProcessPlanData);
      const createdPlanId = createResult.id;
      
      console.log(`✅ ${serviceName}创建成功: ${realProcessPlanNo}, ID: ${createdPlanId}`);

      // ✅ 新增：创建后立即批量更新所有同源记录的计算字段
      console.log(`\n🧮 开始批量更新同源记录的计算字段: 累积排程数量、未排数量、剩余需求工时`);
      
      try {
        // 1. 计算累积排程数量 = SUMIFS(计划排程数量, 来源编号=本行来源编号)
        const sourceNo = data.planNo; // 来源编号=备料计划编号
        const [sumRows] = await connection.execute(
          `SELECT COALESCE(SUM(schedule_quantity), 0) as cumulative_qty
           FROM ${targetTable}
           WHERE source_no = ?`,
          [sourceNo]
        );
        
        const cumulativeScheduleQty = parseFloat(sumRows[0].cumulative_qty || 0);
        console.log(`   1️⃣ 累积排程数量 = ${cumulativeScheduleQty} (来源编号=${sourceNo})`);
        
        // 2. 计算未排数量 = 需补货数量 - 累积排程数量
        const unscheduledQty = parseFloat((replenishmentQty - cumulativeScheduleQty).toFixed(4));
        console.log(`   2️⃣ 未排数量 = ${replenishmentQty} - ${cumulativeScheduleQty} = ${unscheduledQty}`);
        
        // 3. 批量更新所有同源记录的累积排程数量和未排数量
        console.log(`   📝 批量更新所有来源编号=${sourceNo}的记录...`);
        await connection.execute(
          `UPDATE ${targetTable}
           SET cumulative_schedule_qty = ?,
               unscheduled_qty = ?
           WHERE source_no = ?`,
          [cumulativeScheduleQty, unscheduledQty, sourceNo]
        );
        console.log(`   ✅ 批量更新累积排程数量和未排数量完成`);
        
        // 4. 逐行更新剩余需求工时（每行的剩余需求工时不同）
        console.log(`   📝 逐行更新剩余需求工时...`);
        const [allRecords] = await connection.execute(
          `SELECT id, required_work_hours, scheduled_work_hours FROM ${targetTable} WHERE source_no = ?`,
          [sourceNo]
        );
        
        for (const record of allRecords) {
          const recordRequiredHours = parseFloat(record.required_work_hours || 0);
          const recordScheduledHours = parseFloat(record.scheduled_work_hours || 0);
          const recordRemainingHours = parseFloat((recordRequiredHours - recordScheduledHours).toFixed(2));
          
          await connection.execute(
            `UPDATE ${targetTable} SET remaining_required_hours = ? WHERE id = ?`,
            [recordRemainingHours, record.id]
          );
        }
        console.log(`   ✅ 逐行更新剩余需求工时完成，共更新${allRecords.length}条记录`);
        
        console.log(`✅ 所有计算字段更新完成`);
      } catch (calcError) {
        console.error(`⚠️ 字段计算失败:`, calcError.message);
        // 不阻塞主流程
      }

      // 检查是否需要自增行
      const [checkRows] = await connection.execute(
        `SELECT unscheduled_qty, DATE_FORMAT(next_schedule_date, '%Y-%m-%d') as next_schedule_date FROM ${targetTable} WHERE id = ?`,
        [createdPlanId]
      );
      
      if (checkRows.length > 0) {
        const actualUnscheduledQty = parseFloat(checkRows[0].unscheduled_qty || 0);
        const actualNextScheduleDate = checkRows[0].next_schedule_date;
        
        if (actualUnscheduledQty > 0 && actualNextScheduleDate) {
          console.log(`🔁 检测到未排数量=${actualUnscheduledQty}，开始自增行递归排程...`);
          await ProcessPlanService.checkAndCreateIncremental(createdPlanId);
        }
      }

      return { success: true, planNo: realProcessPlanNo, id: createdPlanId, targetTable, serviceName, processName };  // ✅ 返回来源工序

    } catch (error) {
      console.error('❌ 推送到真工序计划失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  /**
   * ✅ 新增：备料计划推送到真工序计划 - 为realpProcessPlanService调用
   * 与 pushToRealProcessPlan 方法相同，但为了遗免循环依赖，单独定义
   */
  static async pushMaterialPlanToRealProcessPlan(data) {
    return await this.pushToRealProcessPlan(data);
  }

  /**
   * ✅ 新增：备料计划推送到采购计划（新增+更新双重规则）
   * 触发条件：备料计划编号不为空 && 来源工序="采购" && 需补货数量>0
   * 逻辑：先查询，如果存在则更新，不存在则新增
   */
  static async pushToProcurementPlan(data) {
    const ProcurementPlanService = require('./procurementPlanService');
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查推送条件
      const demandQty = parseFloat(data.demandQuantity || 0);
      const availableQty = parseFloat(data.availableStock || 0);
      const replenishmentQty = demandQty - availableQty;
      
      const shouldPush = (
        data.planNo &&
        data.sourceProcess === '采购' &&
        replenishmentQty > 0
      );
      
      if (!shouldPush) {
        console.log('⚠️ 不符合推送到采购计划的条件');
        await connection.rollback();
        return { success: false, reason: 'conditions_not_met' };
      }

      console.log('🔍 开始查询采购计划，检查是否需要更新...');
      console.log(`   销售订单编号: ${data.salesOrderNo}`);
      console.log(`   备料物料编号: ${data.materialCode}`);

      // 查询目标表格：采购计划
      const [existingPlans] = await connection.execute(`
        SELECT 
          id, procurement_plan_no, source_no, required_quantity,
          master_plan_no, process_plan_no, procurement_lead_time, demand_date,
          plan_arrival_date
        FROM procurement_plans
        WHERE sales_order_no = ? AND material_code = ?
        LIMIT 1
      `, [data.salesOrderNo, data.materialCode]);

      if (existingPlans.length > 0) {
        // ✅ 执行更新规则
        const existingPlan = existingPlans[0];
        console.log(`✅ 找到已存在的采购计划: ${existingPlan.procurement_plan_no}，执行更新规则...`);

        // 4. 来源编号 = textjoin(目标表格的"来源编号"，"-"，来源表格的"备料计划编号&":"&需补货数量")
        const existingSourceNo = existingPlan.source_no || '';
        const newSourcePart = `${data.planNo}:${replenishmentQty}`;
        const updatedSourceNo = existingSourceNo ? `${existingSourceNo}, ${newSourcePart}` : newSourcePart;

        // 17. 需补货数量 = 目标表格的需补货数量 + 来源表格的需补货数量
        const existingRequiredQty = parseFloat(existingPlan.required_quantity || 0);
        const updatedRequiredQty = existingRequiredQty + replenishmentQty;

        // 21. 主生产计划编号 = textjoin(目标表格的"主生产计划编号"，来源表格的"来源主计划编号") 字段去重复
        const existingMasterPlanNos = existingPlan.master_plan_no ? existingPlan.master_plan_no.split(',').map(s => s.trim()) : [];
        const newMasterPlanNo = data.mainPlanProductCode || data.sourcePlanNo || '';
        if (newMasterPlanNo && !existingMasterPlanNos.includes(newMasterPlanNo)) {
          existingMasterPlanNos.push(newMasterPlanNo);
        }
        const updatedMasterPlanNo = existingMasterPlanNos.filter(n => n).join(', ');

        // 22. 工序计划编号 = textjoin(目标表格的"工序计划编号"，来源表格的"来源工序计划编号") 字段去重复
        const existingProcessPlanNos = existingPlan.process_plan_no ? existingPlan.process_plan_no.split(',').map(s => s.trim()) : [];
        const newProcessPlanNo = data.sourceProcessPlanNo || '';
        if (newProcessPlanNo && !existingProcessPlanNos.includes(newProcessPlanNo)) {
          existingProcessPlanNos.push(newProcessPlanNo);
        }
        const updatedProcessPlanNo = existingProcessPlanNos.filter(n => n).join(', ');

        // 24. 计划到货日期 = min(目标表格的"计划到货日期"， 需求日期 - 采购提前期)
        let updatedPlanArrivalDate = existingPlan.plan_arrival_date;
        if (data.demandDate && existingPlan.procurement_lead_time) {
          const demandDate = new Date(data.demandDate);
          const leadTime = parseInt(existingPlan.procurement_lead_time || 3);
          demandDate.setDate(demandDate.getDate() - leadTime);
          const calculatedArrivalDate = demandDate.toISOString().split('T')[0];
          
          if (existingPlan.plan_arrival_date) {
            updatedPlanArrivalDate = new Date(existingPlan.plan_arrival_date) < new Date(calculatedArrivalDate)
              ? existingPlan.plan_arrival_date
              : calculatedArrivalDate;
          } else {
            updatedPlanArrivalDate = calculatedArrivalDate;
          }
        }

        // 执行更新
        await connection.execute(`
          UPDATE procurement_plans
          SET 
            source_no = ?,
            required_quantity = ?,
            master_plan_no = ?,
            process_plan_no = ?,
            plan_arrival_date = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [
          updatedSourceNo,
          updatedRequiredQty,
          updatedMasterPlanNo,
          updatedProcessPlanNo,
          updatedPlanArrivalDate,
          existingPlan.id
        ]);

        console.log(`✅ 采购计划更新成功: ${existingPlan.procurement_plan_no}`);
        console.log(`   来源编号: ${existingSourceNo} → ${updatedSourceNo}`);
        console.log(`   需补货数量: ${existingRequiredQty} → ${updatedRequiredQty}`);
        console.log(`   计划到货日期: ${existingPlan.plan_arrival_date} → ${updatedPlanArrivalDate}`);

        await connection.commit();
        return {
          success: true,
          action: 'update',
          procurementPlanNo: existingPlan.procurement_plan_no,
          id: existingPlan.id
        };

      } else {
        // ✅ 执行新增规则
        console.log('❌ 未找到已存在的采购计划，执行新增规则...');

        // 1. 生成采购计划编号
        const year = new Date().getFullYear();
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const procurementPlanNo = `CGGH${year}${timestamp}${random}`;

        // 24. 采购提前期 = lookup(产品物料的物料编码=采购计划的"采购物料编号")
        let procurementLeadTime = 3; // 默认值
        if (data.materialCode) {
          const [materialRows] = await connection.execute(
            'SELECT default_procurement_lead_time FROM materials WHERE material_code = ? LIMIT 1',
            [data.materialCode]
          );
          if (materialRows.length > 0 && materialRows[0].default_procurement_lead_time) {
            procurementLeadTime = parseInt(materialRows[0].default_procurement_lead_time);
          }
        }

        // 24. 计划到货日期 = 需求日期 - 采购提前期
        let planArrivalDate = null;
        if (data.demandDate && procurementLeadTime) {
          const demandDate = new Date(data.demandDate);
          demandDate.setDate(demandDate.getDate() - procurementLeadTime);
          planArrivalDate = demandDate.toISOString().split('T')[0];
        }

        // 构建采购计划数据
        const procurementPlanData = {
          procurementPlanNo: procurementPlanNo,
          purchaseOrderNo: null, // 2. 采购订单编号暂为空
          sourceFormName: '备料计划', // 3. 来源表单
          sourceNo: data.planNo, // 4. 来源编号
          materialCode: data.materialCode, // 14. 采购物料编号
          materialName: data.materialName, // 15. 采购物料名称
          materialImage: null, // 16. 图片
          requiredQuantity: replenishmentQty, // 17. 需补货数量
          baseUnit: data.materialUnit, // 18. 基本单位
          salesOrderNo: data.salesOrderNo, // 19. 销售订单编号
          customerOrderNo: data.customerOrderNo, // 20. 客户订单编号
          masterPlanNo: data.mainPlanProductCode || data.sourcePlanNo, // 21. 主生产计划编号
          processPlanNo: data.sourceProcessPlanNo, // 22. 工序计划编号
          materialPlanNo: data.planNo, // 23. 备料计划编号
          procurementLeadTime: procurementLeadTime, // 24. 采购提前期
          demandDate: data.demandDate, // 新增：需求日期
          planArrivalDate: planArrivalDate, // 24. 计划到货日期
          procurementStatus: 'PENDING_INQUIRY' // 默认状态
        };

        // 调用采购计划Service创建
        const insertId = await ProcurementPlanService.create(procurementPlanData);
        
        console.log(`✅ 采购计划创建成功: ${procurementPlanNo}, ID: ${insertId}`);
        console.log(`   采购物料: ${data.materialCode} - ${data.materialName}`);
        console.log(`   需补货数量: ${replenishmentQty}`);
        console.log(`   采购提前期: ${procurementLeadTime}天`);
        console.log(`   需求日期: ${data.demandDate}`);
        console.log(`   计划到货日期: ${planArrivalDate}`);

        await connection.commit();
        return {
          success: true,
          action: 'create',
          procurementPlanNo: procurementPlanNo,
          id: insertId
        };
      }

    } catch (error) {
      await connection.rollback();
      console.error('❌ 推送到采购计划失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = MaterialPreparationPlanService;