/**
 * 供应商评价Service层
 * 职责：供应商评价业务逻辑处理
 */

const { query, pool } = require('../config/database');

class SupplierEvaluationService {
  /**
   * 获取列表（分页+搜索）
   */
  async getList(params) {
    const {
      page = 1,
      pageSize = 20,
      evaluationNo,
      supplierName,
      evaluationDateStart,
      evaluationDateEnd,
      evaluationLevel,
    } = params;

    // 构建查询条件
    const conditions = [];
    const queryParams = [];

    if (evaluationNo) {
      conditions.push('evaluation_no LIKE ?');
      queryParams.push(`%${evaluationNo}%`);
    }

    if (supplierName) {
      conditions.push('supplier_name LIKE ?');
      queryParams.push(`%${supplierName}%`);
    }

    if (evaluationDateStart && evaluationDateEnd) {
      conditions.push('evaluation_date BETWEEN ? AND ?');
      queryParams.push(evaluationDateStart, evaluationDateEnd);
    }

    if (evaluationLevel) {
      conditions.push('evaluation_level = ?');
      queryParams.push(evaluationLevel);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM supplier_evaluations ${whereClause}`;
    const [{ total }] = await query(countSql, queryParams);

    // 查询数据
    const offset = (page - 1) * pageSize;
    const dataSql = `
      SELECT * FROM supplier_evaluations 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}
    `;
    const records = await query(dataSql, queryParams);

    // ✅ 字段映射：数据库下划线格式 → 前端驼峰格式
    const formattedRecords = records.map(record => ({
      id: record.id,
      evaluationNo: record.evaluation_no,
      supplierCode: record.supplier_code,
      supplierName: record.supplier_name,
      contactPerson: record.contact_person,
      contactPhone: record.contact_phone,
      evaluationDate: record.evaluation_date,
      evaluator: record.evaluator,
      qualityScore: record.quality_score,
      deliveryScore: record.delivery_score,
      priceScore: record.price_score,
      serviceScore: record.service_score,
      totalScore: record.total_score,
      evaluationLevel: record.evaluation_level,
      remarks: record.remarks,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));

    return {
      records: formattedRecords,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    };
  }

  /**
   * 根据ID获取详情
   */
  async getById(id) {
    const sql = 'SELECT * FROM supplier_evaluations WHERE id = ?';
    const [record] = await query(sql, [id]);

    if (!record) {
      throw new Error('记录不存在');
    }

    return {
      id: record.id,
      evaluationNo: record.evaluation_no,
      supplierCode: record.supplier_code,
      supplierName: record.supplier_name,
      contactPerson: record.contact_person,
      contactPhone: record.contact_phone,
      evaluationDate: record.evaluation_date,
      evaluator: record.evaluator,
      qualityScore: record.quality_score,
      deliveryScore: record.delivery_score,
      priceScore: record.price_score,
      serviceScore: record.service_score,
      totalScore: record.total_score,
      evaluationLevel: record.evaluation_level,
      remarks: record.remarks,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  /**
   * 创建
   */
  async create(data) {
    const sql = `
      INSERT INTO supplier_evaluations (
        evaluation_no, supplier_code, supplier_name, contact_person, contact_phone,
        evaluation_date, evaluator, quality_score, delivery_score, price_score,
        service_score, total_score, evaluation_level, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.evaluationNo,
      data.supplierCode,
      data.supplierName,
      data.contactPerson || null,
      data.contactPhone || null,
      data.evaluationDate,
      data.evaluator,
      data.qualityScore,
      data.deliveryScore,
      data.priceScore,
      data.serviceScore,
      data.totalScore,
      data.evaluationLevel,
      data.remarks || null,
    ];

    const result = await query(sql, params);
    return { id: result.insertId, ...data };
  }

  /**
   * 更新
   */
  async update(id, data) {
    const sql = `
      UPDATE supplier_evaluations SET
        supplier_code = ?,
        supplier_name = ?,
        contact_person = ?,
        contact_phone = ?,
        evaluation_date = ?,
        evaluator = ?,
        quality_score = ?,
        delivery_score = ?,
        price_score = ?,
        service_score = ?,
        total_score = ?,
        evaluation_level = ?,
        remarks = ?
      WHERE id = ?
    `;

    const params = [
      data.supplierCode,
      data.supplierName,
      data.contactPerson || null,
      data.contactPhone || null,
      data.evaluationDate,
      data.evaluator,
      data.qualityScore,
      data.deliveryScore,
      data.priceScore,
      data.serviceScore,
      data.totalScore,
      data.evaluationLevel,
      data.remarks || null,
      id,
    ];

    await query(sql, params);
    return { id, ...data };
  }

  /**
   * 删除
   */
  async deleteById(id) {
    const sql = 'DELETE FROM supplier_evaluations WHERE id = ?';
    await query(sql, [id]);
    return { success: true };
  }

  /**
   * 批量删除
   */
  async batchDelete(ids) {
    if (!ids || ids.length === 0) {
      throw new Error('删除ID列表不能为空');
    }

    const placeholders = ids.map(() => '?').join(',');
    const sql = `DELETE FROM supplier_evaluations WHERE id IN (${placeholders})`;
    await query(sql, ids);
    return { success: true };
  }
}

module.exports = new SupplierEvaluationService();
