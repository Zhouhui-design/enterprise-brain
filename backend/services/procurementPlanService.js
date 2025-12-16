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
      procurementLeadTime: record.procurement_lead_time,
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.procurementPlanNo, data.purchaseOrderNo, data.sourceFormName, data.sourceNo,
      data.materialCode, data.materialName, data.materialImage, data.requiredQuantity, data.baseUnit,
      data.salesOrderNo, data.customerOrderNo, data.masterPlanNo, data.processPlanNo, data.materialPlanNo,
      data.planArrivalDate, data.procurementStatus, data.supplierName, data.purchaser,
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
}

module.exports = new ProcurementPlanService();
