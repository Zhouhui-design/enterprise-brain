/**
 * 采购计划Service
 */

const { query } = require('../config/database');

class ProcurementPlanService {
  /**
   * 获取采购计划列表（分页+搜索）
   */
  async getList(params) {
    const {
      page = 1,
      pageSize = 20,
      procurementPlanNo,
      purchaseOrderNo,
      procurementStatus,
      supplierName
    } = params;

    // 确保page和pageSize是整数
    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);
    const offset = (pageNum - 1) * pageSizeNum;
    let conditions = [];
    let queryParams = [];

    // 构建搜索条件
    if (procurementPlanNo) {
      conditions.push('procurement_plan_no LIKE ?');
      queryParams.push(`%${procurementPlanNo}%`);
    }
    if (purchaseOrderNo) {
      conditions.push('purchase_order_no LIKE ?');
      queryParams.push(`%${purchaseOrderNo}%`);
    }
    if (procurementStatus) {
      conditions.push('procurement_status = ?');
      queryParams.push(procurementStatus);
    }
    if (supplierName) {
      conditions.push('supplier_name LIKE ?');
      queryParams.push(`%${supplierName}%`);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // 查询总数
    let countSql = `SELECT COUNT(*) as total FROM procurement_plans`;
    let countParams = [];
    
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
      countParams = [...queryParams];
    }
    
    const countResult = await query(countSql, countParams);
    const total = countResult[0].total;

    // 查询数据
    const dataSql = `
      SELECT * FROM procurement_plans 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}
    `;
    const records = await query(dataSql, queryParams);

    // ✅ 字段映射：数据库下划线格式 → 前端驼峰格式
    const formattedRecords = records.map(record => ({
      id: record.id,
      procurementPlanNo: record.procurement_plan_no,
      purchaseOrderNo: record.purchase_order_no,
      sourceFormName: record.source_form_name,
      sourceNo: record.source_no,
      materialCode: record.material_code,
      materialName: record.material_name,
      materialImage: record.material_image,
      requiredQuantity: record.required_quantity,
      baseUnit: record.base_unit,
      salesOrderNo: record.sales_order_no,
      customerOrderNo: record.customer_order_no,
      masterPlanNo: record.master_plan_no,
      processPlanNo: record.process_plan_no,
      materialPlanNo: record.material_plan_no,
      procurementLeadTime: record.procurement_lead_time, // ✅ 新增：采购提前期
      demandDate: record.demand_date, // ✅ 新增：需求日期
      planArrivalDate: record.plan_arrival_date,
      procurementStatus: record.procurement_status,
      supplierName: record.supplier_name,
      purchaser: record.purchaser,
      inquiryDate: record.inquiry_date,
      orderDate: record.order_date,
      promisedArrivalDate: record.promised_arrival_date,
      planPurchaseQuantity: record.plan_purchase_quantity,
      conversionRate: record.conversion_rate,
      purchaseUnit: record.purchase_unit,
      planUnitPrice: record.plan_unit_price,
      planTotalAmount: record.plan_total_amount,
      actualPurchaseQuantity: record.actual_purchase_quantity,
      actualUnitPrice: record.actual_unit_price,
      actualTotalAmount: record.actual_total_amount,
      actualArrivalDate: record.actual_arrival_date,
      actualWarehouseQuantity: record.actual_warehouse_quantity,
      warehouseReceiptNo: record.warehouse_receipt_no,
      warehousePerson: record.warehouse_person,
      qualityInspector: record.quality_inspector,
      returnOrderNo: record.return_order_no,
      returnHandler: record.return_handler,
      actualWarehouseUnitPrice: record.actual_warehouse_unit_price,
      supplierDeliveryNoteNo: record.supplier_delivery_note_no,
      deliveryNoteImage: record.delivery_note_image,
      paymentMethod: record.payment_method,
      isPaid: record.is_paid,
      paymentNo: record.payment_no,
      paymentPerson: record.payment_person,
      reimbursementNo: record.reimbursement_no,
      reimbursementPerson: record.reimbursement_person,
      monthlyReconciliationDate: record.monthly_reconciliation_date,
      monthlyPaymentDate: record.monthly_payment_date,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }));

    return {
      records: formattedRecords,
      total,
      page: pageNum,
      pageSize: pageSizeNum
    };
  }

  /**
   * 根据ID获取单条记录
   */
  async getById(id) {
    const sql = 'SELECT * FROM procurement_plans WHERE id = ?';
    const result = await query(sql, [id]);
    return result[0] || null;
  }

  /**
   * 创建采购计划
   */
  async create(data) {
    const sql = `
      INSERT INTO procurement_plans (
        procurement_plan_no, purchase_order_no, source_form_name, source_no,
        material_code, material_name, material_image, required_quantity, base_unit,
        sales_order_no, customer_order_no, master_plan_no, process_plan_no, material_plan_no,
        procurement_lead_time, demand_date,
        plan_arrival_date, procurement_status, supplier_name, purchaser,
        inquiry_date, order_date, promised_arrival_date,
        plan_purchase_quantity, conversion_rate, purchase_unit, plan_unit_price, plan_total_amount,
        actual_purchase_quantity, actual_unit_price, actual_total_amount, actual_arrival_date,
        actual_warehouse_quantity, warehouse_receipt_no, warehouse_person, quality_inspector,
        return_order_no, return_handler, actual_warehouse_unit_price,
        supplier_delivery_note_no, delivery_note_image,
        payment_method, is_paid, payment_no, payment_person,
        reimbursement_no, reimbursement_person,
        monthly_reconciliation_date, monthly_payment_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.procurementPlanNo, data.purchaseOrderNo, data.sourceFormName, data.sourceNo,
      data.materialCode, data.materialName, data.materialImage, data.requiredQuantity, data.baseUnit,
      data.salesOrderNo, data.customerOrderNo, data.masterPlanNo, data.processPlanNo, data.materialPlanNo,
      data.procurementLeadTime || 3, data.demandDate || null, // ✅ 新增字段
      data.planArrivalDate, data.procurementStatus || 'PENDING_ORDER', data.supplierName, data.purchaser, // ✅ 默认状态：待下单
      data.inquiryDate, data.orderDate, data.promisedArrivalDate,
      data.planPurchaseQuantity, data.conversionRate, data.purchaseUnit, data.planUnitPrice, data.planTotalAmount,
      data.actualPurchaseQuantity, data.actualUnitPrice, data.actualTotalAmount, data.actualArrivalDate,
      data.actualWarehouseQuantity, data.warehouseReceiptNo, data.warehousePerson, data.qualityInspector,
      data.returnOrderNo, data.returnHandler, data.actualWarehouseUnitPrice,
      data.supplierDeliveryNoteNo, data.deliveryNoteImage,
      data.paymentMethod, data.isPaid, data.paymentNo, data.paymentPerson,
      data.reimbursementNo, data.reimbursementPerson,
      data.monthlyReconciliationDate, data.monthlyPaymentDate
    ];

    const result = await query(sql, params);
    return result.insertId;
  }

  /**
   * 更新采购计划
   */
  async update(id, data) {
    const sql = `
      UPDATE procurement_plans SET
        procurement_status = ?,
        supplier_name = ?,
        purchaser = ?,
        plan_arrival_date = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await query(sql, [
      data.procurementStatus,
      data.supplierName,
      data.purchaser,
      data.planArrivalDate,
      id
    ]);

    return true;
  }

  /**
   * 删除采购计划
   */
  async delete(id) {
    const sql = 'DELETE FROM procurement_plans WHERE id = ?';
    await query(sql, [id]);
    return true;
  }

  /**
   * 批量删除
   */
  async batchDelete(ids) {
    if (!ids || ids.length === 0) {
      throw new Error('删除ID列表不能为空');
    }

    const placeholders = ids.map(() => '?').join(',');
    const sql = `DELETE FROM procurement_plans WHERE id IN (${placeholders})`;
    await query(sql, ids);
    return true;
  }

  /**
   * 批量终止
   */
  async batchTerminate(ids) {
    if (!ids || ids.length === 0) {
      throw new Error('ID列表不能为空');
    }

    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE procurement_plans SET procurement_status = 'TERMINATED' WHERE id IN (${placeholders})`;
    await query(sql, ids);
    return true;
  }

  /**
   * 批量撤回
   */
  async batchRecall(ids) {
    if (!ids || ids.length === 0) {
      throw new Error('ID列表不能为空');
    }

    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE procurement_plans SET procurement_status = 'PENDING_INQUIRY' WHERE id IN (${placeholders})`;
    await query(sql, ids);
    return true;
  }

  /**
   * ✅ 新增：采购计划合并为采购订单
   * @param {Array<Number>} planIds - 采购计划ID数组
   * @param {String} mergeRule - 合并规则（sameSupplierSameDate / customRule）
   */
  async mergeToOrder(planIds, mergeRule) {
    if (!planIds || planIds.length === 0) {
      throw new Error('采购计划ID列表不能为空');
    }

    // 查询所有选中的采购计划
    const placeholders = planIds.map(() => '?').join(',');
    const selectSql = `SELECT * FROM procurement_plans WHERE id IN (${placeholders})`;
    const plans = await query(selectSql, planIds);

    if (plans.length === 0) {
      throw new Error('未找到有效的采购计划');
    }

    console.log(`📋 查询到 ${plans.length} 条采购计划，开始按规则分组...`);

    // 根据合并规则分组
    const groups = {};
    
    if (mergeRule === 'sameSupplierSameDate') {
      // 相同供应商 + 相同承诺回厂日期合并
      plans.forEach(plan => {
        const supplierName = plan.supplier_name || 'NO_SUPPLIER';
        const promisedDate = plan.promised_arrival_date || 'NO_DATE';
        const groupKey = `${supplierName}||${promisedDate}`;
        
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(plan);
      });
    } else {
      // 其他规则（默认全部合并为一个）
      groups['all'] = plans;
    }

    console.log(`📋 分组结果: ${Object.keys(groups).length} 个组`);

    // 生成采购订单编号
    const generateOrderNo = () => {
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `CGDD${year}${timestamp}${random}`;
    };

    // 为每个组生成采购订单编号
    const orders = [];
    for (const groupKey in groups) {
      const groupPlans = groups[groupKey];
      const purchaseOrderNo = generateOrderNo();
      
      console.log(`📝 生成采购订单: ${purchaseOrderNo}, 包含 ${groupPlans.length} 条采购计划`);
      
      // 更新所有属于该组的采购计划
      const planIdsInGroup = groupPlans.map(p => p.id);
      const updatePlaceholders = planIdsInGroup.map(() => '?').join(',');
      const updateSql = `
        UPDATE procurement_plans 
        SET purchase_order_no = ?, 
            procurement_status = 'ORDERED',
            updated_at = CURRENT_TIMESTAMP 
        WHERE id IN (${updatePlaceholders})
      `;
      
      await query(updateSql, [purchaseOrderNo, ...planIdsInGroup]);
      
      orders.push({
        purchaseOrderNo,
        planCount: groupPlans.length,
        supplierName: groupPlans[0].supplier_name,
        promisedArrivalDate: groupPlans[0].promised_arrival_date,
        planIds: planIdsInGroup
      });
    }

    console.log(`✅ 合并完成！生成了 ${orders.length} 个采购订单`);

    return {
      success: true,
      orderCount: orders.length,
      orders: orders
    };
  }

  /**
   * ✅ 新增：采购前询问
   * @param {Array<Number>} ids - 采购计划ID数组
   */
  async prePurchaseInquiry(ids) {
    if (!ids || ids.length === 0) {
      throw new Error('ID列表不能为空');
    }

    const placeholders = ids.map(() => '?').join(',');
    const sql = `
      UPDATE procurement_plans 
      SET procurement_status = 'INQUIRING',
          updated_at = CURRENT_TIMESTAMP 
      WHERE id IN (${placeholders})
    `;
    
    await query(sql, ids);
    
    console.log(`💬 成功将 ${ids.length} 条采购计划更新为询问中状态`);
    return true;
  }

  /**
   * ✅ 新增：立即下单
   * @param {Array<Number>} ids - 采购计划ID数组
   */
  async placeOrder(ids) {
    if (!ids || ids.length === 0) {
      throw new Error('ID列表不能为空');
    }

    // 验证：只能选择采购订单编号不为空，且状态为待下单或询问中
    const placeholders = ids.map(() => '?').join(',');
    const checkSql = `
      SELECT id, purchase_order_no, procurement_status 
      FROM procurement_plans 
      WHERE id IN (${placeholders})
    `;
    
    const plans = await query(checkSql, ids);
    
    const invalidPlans = plans.filter(plan => {
      if (!plan.purchase_order_no) return true;
      if (plan.procurement_status !== 'PENDING_ORDER' && plan.procurement_status !== 'INQUIRING') {
        return true;
      }
      return false;
    });
    
    if (invalidPlans.length > 0) {
      throw new Error('只能选择采购订单编号不为空，且采购状态为“待下单”或“询问中，待回复”的计划');
    }

    const updateSql = `
      UPDATE procurement_plans 
      SET procurement_status = 'ORDERED',
          updated_at = CURRENT_TIMESTAMP 
      WHERE id IN (${placeholders})
    `;
    
    await query(updateSql, ids);
    
    console.log(`🛍️ 成功下单 ${ids.length} 条采购计划`);
    return true;
  }

  /**
   * ✅ 新增：撤回下单
   * @param {Array<Number>} ids - 采购计划ID数组
   */
  async withdrawOrder(ids) {
    if (!ids || ids.length === 0) {
      throw new Error('ID列表不能为空');
    }

    // 验证：只能选择已下单状态
    const placeholders = ids.map(() => '?').join(',');
    const checkSql = `
      SELECT id, procurement_status 
      FROM procurement_plans 
      WHERE id IN (${placeholders})
    `;
    
    const plans = await query(checkSql, ids);
    
    const invalidPlans = plans.filter(plan => plan.procurement_status !== 'ORDERED');
    
    if (invalidPlans.length > 0) {
      throw new Error('只能选择采购状态为“已下单”的计划');
    }

    // 撤回操作：恢复为待下单，清空采购订单编号
    const updateSql = `
      UPDATE procurement_plans 
      SET procurement_status = 'PENDING_ORDER',
          purchase_order_no = NULL,
          updated_at = CURRENT_TIMESTAMP 
      WHERE id IN (${placeholders})
    `;
    
    await query(updateSql, ids);
    
    console.log(`🔙 成功撤回 ${ids.length} 条采购计划`);
    return true;
  }
}

module.exports = new ProcurementPlanService();
