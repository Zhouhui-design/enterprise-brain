const { pool } = require('../config/database');

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
      
      // 分页查询
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const limit = parseInt(pageSize);
      const dataSQL = `
        SELECT * FROM material_preparation_plans 
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
        materialCode: row.material_code,
        materialName: row.material_name,
        materialSource: row.material_source,
        materialUnit: row.material_unit,
        demandQuantity: row.demand_quantity,
        needMrp: row.need_mrp,
        realtimeStock: row.realtime_stock,
        projectedBalance: row.projected_balance,
        availableStock: row.available_stock,
        sourceProcess: row.source_process,
        workshopName: row.workshop_name,
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
   * 根据ID获取备料计划
   */
  static async getById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM material_preparation_plans WHERE id = ?', [id]);
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
    try {
      const sql = `
        INSERT INTO material_preparation_plans (
          plan_no, source_plan_no, source_process_plan_no, material_code, material_name,
          material_source, material_unit, demand_quantity, need_mrp, realtime_stock,
          projected_balance, available_stock, source_process, workshop_name, demand_date,
          push_to_purchase, push_to_process, sales_order_no, customer_order_no,
          main_plan_product_code, main_plan_product_name, main_plan_quantity,
          promise_delivery_date, remark, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await pool.execute(sql, [
        data.planNo,
        data.sourcePlanNo || null,
        data.sourceProcessPlanNo || null,
        data.materialCode,
        data.materialName,
        data.materialSource || null,
        data.materialUnit || null,
        data.demandQuantity || 0,
        data.needMrp ? 1 : 0,
        data.realtimeStock || 0,
        data.projectedBalance || 0,
        data.availableStock || 0,
        data.sourceProcess || null,
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
        data.createdBy || null
      ]);
      
      console.log(`备料计划创建成功, ID: ${result.insertId}, 编号: ${data.planNo}`);
      return { id: result.insertId };
    } catch (error) {
      console.error('创建备料计划失败:', error);
      throw error;
    }
  }

  /**
   * 更新备料计划
   */
  static async update(id, data) {
    try {
      const sql = `
        UPDATE material_preparation_plans SET
          source_plan_no = ?, source_process_plan_no = ?, material_code = ?, material_name = ?,
          material_source = ?, material_unit = ?, demand_quantity = ?, need_mrp = ?,
          realtime_stock = ?, projected_balance = ?, available_stock = ?, source_process = ?,
          workshop_name = ?, demand_date = ?, push_to_purchase = ?, push_to_process = ?,
          sales_order_no = ?, customer_order_no = ?, main_plan_product_code = ?,
          main_plan_product_name = ?, main_plan_quantity = ?, promise_delivery_date = ?,
          remark = ?, updated_by = ?
        WHERE id = ?
      `;
      
      const [result] = await pool.execute(sql, [
        data.sourcePlanNo || null,
        data.sourceProcessPlanNo || null,
        data.materialCode,
        data.materialName,
        data.materialSource || null,
        data.materialUnit || null,
        data.demandQuantity || 0,
        data.needMrp ? 1 : 0,
        data.realtimeStock || 0,
        data.projectedBalance || 0,
        data.availableStock || 0,
        data.sourceProcess || null,
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
        data.updatedBy || null,
        id
      ]);
      
      if (result.affectedRows === 0) {
        throw new Error('备料计划不存在或未更新');
      }
      
      console.log(`备料计划更新成功, ID: ${id}`);
      return { id };
    } catch (error) {
      console.error('更新备料计划失败:', error);
      throw error;
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
}

module.exports = MaterialPreparationPlanService;
