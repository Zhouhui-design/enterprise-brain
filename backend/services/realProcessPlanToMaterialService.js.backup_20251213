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
      
      // 2. 查询真工序计划的BOM详情（从列表式生产BOM）
      const productCode = realProcessPlan.product_code;
      if (!productCode) {
        console.log('⚠️ 生产产品编号为空，跳过推送');
        await connection.rollback();
        return { code: 400, message: '生产产品编号为空' };
      }
      
      // 查询父件对应的所有子件
      const [bomChildren] = await connection.execute(`
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
      
      if (!bomChildren || bomChildren.length === 0) {
        console.log(`⚠️ 未找到产品编号 ${productCode} 的BOM子件数据`);
        await connection.rollback();
        return { code: 404, message: `未找到产品编号 ${productCode} 的BOM子件数据` };
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
        
        // Lookup工序间隔
        const intervalKey = `${parentProcessName}__${bomChild.output_process}`;
        const interval = processIntervalMap[intervalKey] || { hours: 0, unit: '小时' };
        
        // 计算需求日期 = 工序计划排程日期 - 工序间隔工时
        let demandDate = null;
        if (scheduleDate && interval.hours > 0) {
          const scheduleDateTime = new Date(scheduleDate);
          if (interval.unit === '小时') {
            scheduleDateTime.setHours(scheduleDateTime.getHours() - interval.hours);
          } else if (interval.unit === '天') {
            scheduleDateTime.setDate(scheduleDateTime.getDate() - interval.hours);
          }
          demandDate = scheduleDateTime.toISOString().split('T')[0];
        } else {
          demandDate = scheduleDate; // 如果没有间隔，需求日期=排程日期
        }
        
        // 生成备料计划编号
        const planNo = this.generatePlanNo();
        
        // 插入备料计划记录
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
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
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
          bomChild.output_process || '',
          '/', // 车间名称
          parentProcessName,
          interval.hours,
          interval.unit,
          scheduleDate,
          demandDate
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
