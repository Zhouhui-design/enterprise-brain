const { pool } = require('../config/database');
const { getProcessConfig } = require('../config/processTypes');

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
      
      // 确保页码和每页数量是有效数字
      const pageNum = Math.max(1, parseInt(page) || 1);
      const size = Math.max(1, Math.min(200, parseInt(pageSize) || 20));
      
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
      
      // 使用参数化查询的正确方式
      const offset = (pageNum - 1) * size;
      
      // 获取总数
      const countSql = `SELECT COUNT(*) as total FROM material_preparation_plans ${whereClauseStr}`;
      const [countResult] = await pool.query(countSql, queryParams);
      const total = countResult[0].total;
      
      // 获取分页数据
      const dataSql = `
        SELECT 
          id,
          plan_no as planNo,
          source_plan_no as sourcePlanNo,
          material_code as materialCode,
          material_name as materialName,
          material_source as materialSource,
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
          main_plan_quantity as mainPlanScheduleQuantity,
          promise_delivery_date as promiseDeliveryDate,
          customer_name as customerName,
          created_at as createdAt,
          updated_at as updatedAt
        FROM material_preparation_plans 
        ${whereClauseStr}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      // 执行查询
      const [data] = await pool.query(dataSql, [...queryParams, size, offset]);
      
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
      
      // ✅ 严格按照数据库表结构的40个字段构造INSERT语句（不含自增id字段）
      const sql = `
        INSERT INTO material_preparation_plans (
          plan_no, source_plan_no, source_process_plan_no, parent_code, parent_name,
          parent_schedule_quantity, material_code, material_name, material_source, material_unit,
          demand_quantity, need_mrp, realtime_stock, projected_balance, available_stock,
          replenishment_quantity, source_process, workshop_name, parent_process_name,
          process_interval_hours, process_interval_unit, process_schedule_date, demand_date,
          push_to_purchase, push_to_process, sales_order_no, customer_order_no,
          main_plan_product_code, main_plan_product_name, main_plan_quantity,
          promise_delivery_date, customer_name, product_image, submitter, submit_time,
          remark, created_by, updated_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      // 计算需补货数量
      const demandQuantity = parseFloat(data.demandQuantity || 0);
      const availableStock = parseFloat(data.availableStock || 0);
      const replenishmentQuantity = demandQuantity - availableStock;
      
      const values = [
        data.planNo,                         // plan_no (1)
        data.sourcePlanNo || null,           // source_plan_no (2)
        data.sourceProcessPlanNo || null,    // source_process_plan_no (3)
        data.parentCode || null,             // parent_code (4)
        data.parentName || null,             // parent_name (5)
        data.parentScheduleQuantity || null, // parent_schedule_quantity (6)
        data.materialCode,                   // material_code (7)
        data.materialName,                   // material_name (8)
        data.materialSource || null,         // material_source (9)
        data.materialUnit || null,           // material_unit (10)
        demandQuantity,                      // demand_quantity (11)
        data.needMrp ? 1 : 0,                // need_mrp (12)
        data.realtimeStock || 0,             // realtime_stock (13)
        data.projectedBalance || 0,          // projected_balance (14)
        availableStock,                      // available_stock (15)
        replenishmentQuantity,               // replenishment_quantity (16)
        data.sourceProcess || null,          // source_process (17)
        data.workshopName || null,           // workshop_name (18)
        data.parentProcessName || null,      // parent_process_name (19)
        data.processIntervalHours || null,   // process_interval_hours (20)
        data.processIntervalUnit || null,    // process_interval_unit (21)
        data.processScheduleDate || null,    // process_schedule_date (22)
        data.demandDate || null,             // demand_date (23)
        data.pushToPurchase ? 1 : 0,         // push_to_purchase (24)
        data.pushToProcess ? 1 : 0,          // push_to_process (25)
        data.salesOrderNo || null,           // sales_order_no (26)
        data.customerOrderNo || null,        // customer_order_no (27)
        data.mainPlanProductCode || null,    // main_plan_product_code (28)
        data.mainPlanProductName || null,    // main_plan_product_name (29)
        data.mainPlanQuantity || 0,          // main_plan_quantity (30)
        data.promiseDeliveryDate || null,    // promise_delivery_date (31)
        data.customerName || null,           // customer_name (32)
        data.productImage || null,           // product_image (33)
        data.submitter || null,              // submitter (34)
        new Date(),                          // submit_time (35)
        data.remark || null,                 // remark (36)
        data.submitter || 'admin',           // created_by (37)
        data.updatedBy || null,              // updated_by (38)
        new Date(),                          // created_at (39)
        new Date()                           // updated_at (40)
      ];
      
      const [result] = await connection.execute(sql, values);
      
      const insertedId = result.insertId;
      console.log(`备料计划创建成功, ID: ${insertedId}, 编号: ${data.planNo}`);
      
      await connection.commit();
      
      const replenishmentQty = parseFloat(replenishmentQuantity || 0);
      let processPlanNo = null;
      
      // ✅ 自动推送规则：需补货数量>0
      if (data.planNo && replenishmentQty > 0) {
        const fullData = {
          ...data,
          id: insertedId,
          replenishmentQuantity: replenishmentQty
        };
        
        // 规则1：来源工序=采购 → 推送到采购计划
        if (data.sourceProcess === '采购') {
          console.log('🛒 来源工序=采购，需补货数量>0，推送到采购计划...');
          try {
            const pushResult = await this.pushToProcurementPlan(fullData);
            if (pushResult && pushResult.success) {
              console.log(`✅ 推送采购计划成功: ${data.planNo} → ${pushResult.procurementPlanNo}`);
              await pool.execute(
                'UPDATE material_preparation_plans SET push_to_purchase = ? WHERE plan_no = ?',
                [1, data.planNo]
              );
            }
          } catch (pushError) {
            console.error(`❌ 推送采购计划失败:`, pushError.message);
          }
        }
        // 规则2：来源工序≠采购 → 推送到对应工序计划
        else if (data.sourceProcess && data.sourceProcess !== '采购') {
          console.log(`⚙️ 来源工序=${data.sourceProcess}，需补货数量>0，推送到工序计划...`);
          try {
            const pushResult = await this.pushToProcessPlanBySource(fullData);
            if (pushResult && pushResult.success) {
              console.log(`✅ 推送工序计划成功: ${data.planNo} → ${pushResult.processPlanNo}`);
              processPlanNo = pushResult.processPlanNo;
              await pool.execute(
                'UPDATE material_preparation_plans SET push_to_process = ? WHERE plan_no = ?',
                [1, data.planNo]
              );
            }
          } catch (pushError) {
            console.error(`❌ 推送工序计划失败:`, pushError.message);
          }
        }
      }
      
      // 返回创建结果
      return { 
        id: insertedId,
        processPlanNo
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
   * 推送备料计划到工序计划
   */
  static async pushToProcessPlan(materialPlanId, processType) {
    try {
      // 获取备料计划信息
      const materialPlan = await this.getById(materialPlanId);
      if (!materialPlan) {
        throw new Error('备料计划不存在');
      }

      // 准备推送数据
      const pushData = {
        planNo: materialPlan.plan_no,
        materialCode: materialPlan.material_code,
        materialName: materialPlan.material_name,
        materialUnit: materialPlan.material_unit,
        replenishmentQuantity: materialPlan.replenishment_quantity,
        materialSource: materialPlan.material_source,
        sourceProcess: processType || materialPlan.source_process,
        demandDate: materialPlan.demand_date,
        salesOrderNo: materialPlan.sales_order_no,
        mainPlanProductCode: materialPlan.main_plan_product_code,
        mainPlanProductName: materialPlan.main_plan_product_name,
        promiseDeliveryDate: materialPlan.promise_delivery_date
      };

      // 调用统一的推送方法
      const pushResult = await this.pushToProcessPlanBySource(pushData);

      if (pushResult && pushResult.success) {
        // 更新备料计划状态
        await this.update(materialPlanId, {
          push_to_process: 1,
          status: 'pushed_to_process'
        });

        return {
          success: true,
          message: '备料计划已推送到工序计划',
          processPlanId: pushResult.insertId
        };
      } else {
        throw new Error(pushResult.reason || '推送失败');
      }
    } catch (error) {
      console.error('推送备料计划到工序计划失败:', error);
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
   * 推送备料计划到真工序计划
   * @param {*} materialPlanData 备料计划数据
   */
  static async pushToRealProcessPlan(materialPlanData) {
    try {
      console.log('\n🔄 开始推送备料计划到工序计划...');
      console.log('   备料计划数据:', {
        planNo: materialPlanData.planNo,
        materialSource: materialPlanData.materialSource,
        sourceProcess: materialPlanData.sourceProcess,
        replenishmentQuantity: materialPlanData.replenishmentQuantity
      });

      // 检查推送条件
      if (!materialPlanData.planNo) {
        return { success: false, reason: '备料计划编号为空' };
      }

      if (materialPlanData.materialSource !== '自制') {
        return { success: false, reason: '物料来源非自制' };
      }

      const replenishmentQty = parseFloat(materialPlanData.replenishmentQuantity || materialPlanData.demandQuantity - materialPlanData.availableStock || 0);
      if (replenishmentQty <= 0) {
        return { success: false, reason: '需补货数量<=0' };
      }

      if (!materialPlanData.sourceProcess) {
        return { success: false, reason: '来源工序为空' };
      }

      // 根据sourceProcess路由到不同的工序计划服务
      const processMapping = {
        '打包': {
          service: require('./packingProcessPlanService'),
          serviceName: '打包工序计划服务',
          tableName: 'packing_process_plans'
        },
        '组装': {
          service: require('./assemblyProcessPlanService'),
          serviceName: '组装工序计划服务',
          tableName: 'assembly_process_plans'
        },
        '喷塑': {
          service: require('./packingProcessPlanService'), // 注意：这里使用的是packingProcessPlanService，因为历史原因
          serviceName: '喷塑工序计划服务',
          tableName: 'packing_process_plans' // 注意：这里也是packing_process_plans，因为历史原因
        },
        '缝纫': {
          service: require('./sewingProcessPlanService'),
          serviceName: '缝纫工序计划服务',
          tableName: 'sewing_process_plans'
        },
        '抛丸': {
          service: require('./shotBlastingProcessPlanService'),
          serviceName: '抛丸工序计划服务',
          tableName: 'shot_blasting_process_plans'
        },
        '人工焊接': {
          service: require('./manualWeldingProcessPlanService'),
          serviceName: '人工焊接工序计划服务',
          tableName: 'manual_welding_process_plans'
        },
        '弯管': {
          service: require('./tubeBendingProcessPlanService'),
          serviceName: '弯管工序计划服务',
          tableName: 'tube_bending_process_plans'
        },
        '激光切管': {
          service: require('./laserTubeCuttingProcessPlanService'),
          serviceName: '激光切管工序计划服务',
          tableName: 'laser_tube_cutting_process_plans'
        },
        '激光下料': {
          service: require('./laserCuttingProcessPlanService'),
          serviceName: '激光下料工序计划服务',
          tableName: 'laser_cutting_process_plans'
        },
        '折弯': {
          service: require('./bendingProcessPlanService'),
          serviceName: '折弯工序计划服务',
          tableName: 'bending_process_plans'
        },
        '打孔': {
          service: require('./drillingProcessPlanService'),
          serviceName: '打孔工序计划服务',
          tableName: 'drilling_process_plans'
        },
        '冲床': {
          service: require('./punchingProcessPlanService'),
          serviceName: '冲床工序计划服务',
          tableName: 'punching_process_plans'
        },
        '人工下料': {
          service: require('./manualCuttingProcessPlanService'),
          serviceName: '人工下料工序计划服务',
          tableName: 'manual_cutting_process_plans'
        },
        '机器打磨': {
          service: require('./machineGrindingProcessPlanService'),
          serviceName: '机器打磨工序计划服务',
          tableName: 'machine_grinding_process_plans'
        },
        '裁剪': {
          service: require('./cuttingProcessPlanService'),
          serviceName: '裁剪工序计划服务',
          tableName: 'cutting_process_plans'
        }
      };

      const processInfo = processMapping[materialPlanData.sourceProcess];
      if (!processInfo) {
        console.log(`   ⚠️ 不支持的工序类型: ${materialPlanData.sourceProcess}`);
        return { success: false, reason: `不支持的工序类型: ${materialPlanData.sourceProcess}` };
      }

      console.log(`   🎯 路由到: ${processInfo.serviceName}`);

      // 准备工序计划数据
      const processPlanData = {
        // 基础信息
        planNo: `RPP${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        scheduleDate: materialPlanData.demandDate || materialPlanData.demand_date || new Date(),
        salesOrderNo: materialPlanData.salesOrderNo || materialPlanData.sales_order_no || null,
        customerOrderNo: materialPlanData.customerOrderNo || materialPlanData.customer_order_no || null,
        masterPlanNo: materialPlanData.sourcePlanNo || materialPlanData.source_plan_no || null,
        // ✅ 修复主计划产品编号/名称 - 兼容snake_case和camelCase
        masterPlanProductCode: materialPlanData.mainPlanProductCode || materialPlanData.main_plan_product_code || null,
        masterPlanProductName: materialPlanData.mainPlanProductName || materialPlanData.main_plan_product_name || null,
        productCode: materialPlanData.materialCode || materialPlanData.material_code || null,
        productName: materialPlanData.materialName || materialPlanData.material_name || null,
        productImage: materialPlanData.productImage || materialPlanData.product_image || null,
        processManager: null, // 可从系统配置中获取
        processName: materialPlanData.sourceProcess || materialPlanData.source_process,
        // 计划排程数量 = 需补货数量
        scheduleQuantity: replenishmentQty,
        productUnit: materialPlanData.materialUnit || materialPlanData.material_unit || null,
        // ✅ 修复0阶需求数量 - 使用父件排程数量或需补货数量
        level0Demand: materialPlanData.parentScheduleQuantity || materialPlanData.parent_schedule_quantity || replenishmentQty,
        completionDate: materialPlanData.demandDate || materialPlanData.demand_date || null,
        // ✅ 修复订单承诺交期 - 兼容两种命名格式
        orderPromiseDeliveryDate: materialPlanData.promiseDeliveryDate || materialPlanData.promise_delivery_date || null,
        
        // 工序相关信息
        // ✅ 修复计划开始日期 - 新增行使用需求日期
        planStartDate: materialPlanData.demandDate || materialPlanData.demand_date || null,
        realPlanStartDate: null,
        planEndDate: materialPlanData.demandDate || materialPlanData.demand_date || null,
        workshopName: null,
        dailyAvailableHours: 0,
        remainingRequiredHours: 0,
        scheduleCount: 1,
        standardWorkHours: 0,
        standardWorkQuota: 0,
        // ✅ 不设置累积排程数量，由前端统一计算
        cumulativeScheduleQty: 0,
        unscheduledQty: 0,
        sourcePageName: '备料计划',
        sourceNo: materialPlanData.planNo, // 关键：关联备料计划编号
        rowIndex: 1, // 初始序号设为1
        previousScheduleNo: null,
        customerName: materialPlanData.customerName || null,
        level0ProductName: null,
        level0ProductCode: null,
        level0ProductionQty: 0,
        productSource: materialPlanData.materialSource || null,
        bomNo: null,
        submittedBy: materialPlanData.submitter || 'system',
        submittedAt: new Date(),
        replenishmentQty: replenishmentQty,
        requiredWorkHours: 0,
        dailyTotalHours: 0,
        dailyScheduledHours: 0,
        scheduledWorkHours: 0,
        nextScheduleDate: null
      };

      console.log('   工序计划数据准备完成:', processPlanData);

      // 创建工序计划
      console.log('   调用工序计划服务创建方法...');
      const createResult = await processInfo.service.create(processPlanData);
      
      if (!createResult || !createResult.insertId) {
        throw new Error('工序计划创建失败');
      }

      console.log(`   ✅ 工序计划创建成功，ID: ${createResult.insertId}`);
      
      return {
        success: true,
        insertId: createResult.insertId,
        planNo: processPlanData.planNo,
        service: processInfo.service,
        serviceName: processInfo.serviceName,
        tableName: processInfo.tableName
      };
    } catch (error) {
      console.error('❌ 推送备料计划到工序计划失败:', error);
      throw error;
    }
  }

  /**
   * 推送到工序计划（根据来源工序自动路由）
   */
  static async pushToProcessPlanBySource(materialPlanData) {
    return await this.pushToRealProcessPlan(materialPlanData);
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