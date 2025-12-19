const { pool } = require('../config/database');
const { getProcessConfig } = require('../config/processTypes');
const RealProcessPlanService = require('./realProcessPlanService');

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
      
      // 确保页码和每页数量是数字类型
      const pageNum = parseInt(page);
      const size = parseInt(pageSize);
      
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
      
      const whereClauseStr = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
      
      // 简化查询，先测试基本功能
      const offset = (pageNum - 1) * size;
      
      // 获取总数（不使用条件）
      const countSql = `SELECT COUNT(*) as total FROM material_preparation_plans`;
      const [countResult] = await pool.execute(countSql);
      const total = countResult[0].total;
      
      // 获取分页数据（不使用条件）
      // 修复：直接在SQL中拼接LIMIT和OFFSET，避免参数化问题
      const dataSql = `
        SELECT 
          id,
          plan_no as planNo,
          source_plan_no as sourcePlanNo,
          material_code as materialCode,
          material_name as materialName,
          material_unit as materialUnit,
          demand_quantity as demandQuantity,
          replenishment_quantity as replenishmentQuantity,
          source_process as sourceProcess,
          demand_date as demandDate,
          push_to_purchase as pushToPurchase,
          push_to_process as pushToProcess,
          sales_order_no as salesOrderNo,
          customer_order_no as customerOrderNo,
          main_plan_product_code as mainPlanProductCode,
          main_plan_product_name as mainPlanProductName,
          promise_delivery_date as promiseDeliveryDate,
          customer_name as customerName,
          created_at as createdAt,
          updated_at as updatedAt
        FROM material_preparation_plans 
        ORDER BY created_at DESC
        LIMIT ${Math.max(0, parseInt(size))} OFFSET ${Math.max(0, parseInt(offset))}
      `;
      
      // 执行查询，无需传递LIMIT和OFFSET参数
      const [data] = await pool.execute(dataSql);
      
      return {
        list: data,
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
   * 根据ID获取备料计划详情
   */
  static async getById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT * FROM material_preparation_plans WHERE id = ?
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
      
      // ✅ 修复：使用更安全的INSERT语法，只包含核心必要字段
      const sql = `
        INSERT INTO material_preparation_plans (
          plan_no, material_code, material_name, material_unit, 
          demand_quantity, replenishment_quantity, source_process, 
          demand_date, push_to_purchase, push_to_process, 
          sales_order_no, main_plan_product_code, main_plan_product_name, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        data.planNo,
        data.materialCode,
        data.materialName,
        data.materialUnit || '个',
        data.demandQuantity || 0,
        (data.demandQuantity || 0) - (data.availableStock || 0), // replenishment_quantity
        data.sourceProcess || null,
        data.demandDate || null,
        data.pushToPurchase ? 1 : 0,
        data.pushToProcess ? 1 : 0,
        data.salesOrderNo || null,
        data.mainPlanProductCode || null,
        data.mainPlanProductName || null,
        new Date(), // created_at
        new Date()  // updated_at
      ];
      
      const [result] = await connection.execute(sql, values);
      const insertId = result.insertId;
      
      await connection.commit();
      
      return {
        id: insertId,
        planNo: data.planNo,
        message: '备料计划创建成功'
      };
    } catch (error) {
      await connection.rollback();
      console.error('创建备料计划失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 批量创建备料计划
   */
  static async batchCreate(plansData) {
    let connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const results = [];
      
      for (const planData of plansData) {
        const result = await this.create(planData);
        results.push(result);
      }
      
      await connection.commit();
      
      return {
        success: true,
        count: results.length,
        data: results
      };
    } catch (error) {
      await connection.rollback();
      console.error('批量创建备料计划失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 根据BOM生成备料计划
   */
  static async generateFromBOM(masterPlanId, bomData) {
    try {
      // 获取主生产计划信息
      const [masterPlans] = await pool.execute(`
        SELECT * FROM master_production_plans WHERE id = ?
      `, [masterPlanId]);
      
      if (masterPlans.length === 0) {
        throw new Error('主生产计划不存在');
      }
      
      const masterPlan = masterPlans[0];
      
      // 准备备料计划数据
      const materialPlans = bomData.map(item => ({
        planNo: `BL${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        sourcePlanNo: masterPlan.plan_code,
        materialCode: item.materialCode,
        materialName: item.materialName,
        materialUnit: item.unit,
        demandQuantity: item.quantity * masterPlan.plan_quantity,
        availableStock: 0, // 可以从库存系统获取
        sourceProcess: item.sourceProcess,
        demandDate: masterPlan.plan_end_date,
        pushToPurchase: item.needPurchase,
        pushToProcess: item.needProcess,
        salesOrderNo: masterPlan.sales_order_no,
        mainPlanProductCode: masterPlan.product_code,
        mainPlanProductName: masterPlan.product_name,
        promiseDeliveryDate: masterPlan.promise_delivery_date,
        customerName: masterPlan.customer_name
      }));
      
      // 批量创建备料计划
      const result = await this.batchCreate(materialPlans);
      
      return result;
    } catch (error) {
      console.error('根据BOM生成备料计划失败:', error);
      throw error;
    }
  }

  /**
   * 更新备料计划
   */
  static async update(id, data) {
    let connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const updateFields = [];
      const updateValues = [];
      
      // 构建动态更新语句
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && key !== 'id') {
          updateFields.push(`${key} = ?`);
          updateValues.push(data[key]);
        }
      });
      
      if (updateFields.length === 0) {
        throw new Error('没有要更新的字段');
      }
      
      updateFields.push('updated_at = ?');
      updateValues.push(new Date());
      updateValues.push(id);
      
      const sql = `
        UPDATE material_preparation_plans 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;
      
      const [result] = await connection.execute(sql, updateValues);
      
      await connection.commit();
      
      return {
        affectedRows: result.affectedRows,
        message: '备料计划更新成功'
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
      const [result] = await pool.execute(`
        DELETE FROM material_preparation_plans WHERE id = ?
      `, [id]);
      
      return {
        affectedRows: result.affectedRows,
        message: '备料计划删除成功'
      };
    } catch (error) {
      console.error('删除备料计划失败:', error);
      throw error;
    }
  }

  /**
   * 根据源计划编号获取备料计划
   */
  static async getBySourcePlanNo(sourcePlanNo) {
    try {
      const [rows] = await pool.execute(`
        SELECT * FROM material_preparation_plans 
        WHERE source_plan_no = ?
        ORDER BY created_at DESC
      `, [sourcePlanNo]);
      
      return rows;
    } catch (error) {
      console.error('根据源计划编号获取备料计划失败:', error);
      throw error;
    }
  }

  /**
   * 推送备料计划到真工序计划
   */
  static async pushToProcessPlan(materialPlanId, processType) {
    try {
      // 获取备料计划信息
      const materialPlan = await this.getById(materialPlanId);
      if (!materialPlan) {
        throw new Error('备料计划不存在');
      }

      // 获取工序配置
      const processConfig = getProcessConfig(processType);
      if (!processConfig) {
        throw new Error('工序配置不存在');
      }

      // 准备真工序计划数据
      const realProcessPlanData = {
        materialCode: materialPlan.material_code,
        materialName: materialPlan.material_name,
        quantity: materialPlan.replenishment_quantity,
        unit: materialPlan.material_unit,
        sourceMaterialPlanNo: materialPlan.plan_no,
        processType: processType,
        scheduledDate: materialPlan.demand_date,
        salesOrderNo: materialPlan.sales_order_no,
        mainPlanProductCode: materialPlan.main_plan_product_code
      };

      // 创建真工序计划
      const result = await RealProcessPlanService.create(realProcessPlanData);

      // 更新备料计划状态
      await this.update(materialPlanId, {
        pushToProcess: 1,
        status: 'pushed_to_process'
      });

      return {
        success: true,
        message: '备料计划已推送到工序计划',
        realProcessPlanId: result.id
      };
    } catch (error) {
      console.error('推送备料计划到真工序计划失败:', error);
      throw error;
    }
  }

  /**
   * 推送备料计划到采购计划
   */
  static async pushToProcurementPlan(materialPlanId) {
    try {
      // 获取备料计划信息
      const materialPlan = await this.getById(materialPlanId);
      if (!materialPlan) {
        throw new Error('备料计划不存在');
      }

      // 检查是否需要采购
      if (materialPlan.replenishment_quantity <= 0) {
        throw new Error('当前库存充足，无需采购');
      }

      // 准备采购计划数据
      const procurementPlanData = {
        materialCode: materialPlan.material_code,
        materialName: materialPlan.material_name,
        quantity: materialPlan.replenishment_quantity,
        unit: materialPlan.material_unit,
        sourceMaterialPlanNo: materialPlan.plan_no,
        requiredDate: materialPlan.demand_date,
        salesOrderNo: materialPlan.sales_order_no,
        mainPlanProductCode: materialPlan.main_plan_product_code
      };

      // 调用采购计划服务创建采购计划
      const ProcurementPlanService = require('./procurementPlanService');
      const result = await ProcurementPlanService.create(procurementPlanData);

      // 更新备料计划状态
      await this.update(materialPlanId, {
        pushToPurchase: 1,
        status: 'pushed_to_procurement'
      });

      return {
        success: true,
        message: '备料计划已推送到采购计划',
        procurementPlanId: result.id
      };
    } catch (error) {
      console.error('推送备料计划到采购计划失败:', error);
      throw error;
    }
  }

  /**
   * 自动推送备料计划
   * 根据物料来源自动推送到相应的工序或采购计划
   */
  static async autoPush(materialPlanId) {
    try {
      const materialPlan = await this.getById(materialPlanId);
      if (!materialPlan) {
        throw new Error('备料计划不存在');
      }

      let pushResult = null;
      
      if (materialPlan.push_to_process && materialPlan.source_process) {
        // 推送到工序计划
        pushResult = await this.pushToProcessPlan(materialPlanId, materialPlan.source_process);
      } else if (materialPlan.push_to_purchase && materialPlan.replenishment_quantity > 0) {
        // 推送到采购计划
        pushResult = await this.pushToProcurementPlan(materialPlanId);
      } else {
        throw new Error('当前备料计划无需推送');
      }

      return {
        success: true,
        message: '备料计划自动推送完成',
        pushResult
      };
    } catch (error) {
      console.error('自动推送备料计划失败:', error);
      throw error;
    }
  }

  /**
   * 获取备料计划统计信息
   */
  static async getStatistics() {
    try {
      const [totalResult] = await pool.execute(`
        SELECT COUNT(*) as total FROM material_preparation_plans
      `);
      
      const [pushedToProcessResult] = await pool.execute(`
        SELECT COUNT(*) as pushedToProcess FROM material_preparation_plans WHERE push_to_process = 1
      `);
      
      const [pushedToProcurementResult] = await pool.execute(`
        SELECT COUNT(*) as pushedToProcurement FROM material_preparation_plans WHERE push_to_purchase = 1
      `);
      
      return {
        total: totalResult[0].total,
        pushedToProcess: pushedToProcessResult[0].pushedToProcess,
        pushedToProcurement: pushedToProcurementResult[0].pushedToProcurement,
        pendingPush: totalResult[0].total - pushedToProcessResult[0].pushedToProcess - pushedToProcurementResult[0].pushedToProcurement
      };
    } catch (error) {
      console.error('获取备料计划统计信息失败:', error);
      throw error;
    }
  }
}

module.exports = MaterialPreparationPlanService;