/**
 * 供应商管理 Service 层
 * 处理业务逻辑和数据库操作
 */
const pool = require('../config/database')

class SupplierManagementService {
  /**
   * 获取供应商列表（分页+筛选）
   */
  async getList(params) {
    const {
      page = 1,
      pageSize = 20,
      supplierCode,
      supplierName,
      supplierType,
      status,
      creditRating,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params

    const connection = await pool.getConnection()
    try {
      // 构建 WHERE 条件
      const conditions = []
      const queryParams = []

      if (supplierCode) {
        conditions.push('supplier_code LIKE ?')
        queryParams.push(`%${supplierCode}%`)
      }

      if (supplierName) {
        conditions.push('supplier_name LIKE ?')
        queryParams.push(`%${supplierName}%`)
      }

      if (supplierType) {
        conditions.push('supplier_type = ?')
        queryParams.push(supplierType)
      }

      if (status) {
        conditions.push('status = ?')
        queryParams.push(status)
      }

      if (creditRating) {
        conditions.push('credit_rating = ?')
        queryParams.push(creditRating)
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      // 查询总数
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as total FROM supplier_management ${whereClause}`,
        queryParams
      )
      const total = countResult[0].total

      // 查询数据
      const offset = (page - 1) * pageSize
      const orderClause = `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`
      
      const [records] = await connection.execute(
        `SELECT * FROM supplier_management ${whereClause} ${orderClause} LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(pageSize), parseInt(offset)]
      )

      // ✅ 字段映射：数据库下划线格式 → 前端驼峰格式
      const formattedRecords = records.map(record => ({
        id: record.id,
        supplierCode: record.supplier_code,
        supplierName: record.supplier_name,
        supplierType: record.supplier_type,
        contactPerson: record.contact_person,
        contactPhone: record.contact_phone,
        contactEmail: record.contact_email,
        address: record.address,
        taxNo: record.tax_no,
        bankName: record.bank_name,
        bankAccount: record.bank_account,
        paymentTerms: record.payment_terms,
        creditRating: record.credit_rating,
        evaluationScore: record.evaluation_score,
        status: record.status,
        supplierCategory: record.supplier_category,
        cooperationStartDate: record.cooperation_start_date,
        businessLicense: record.business_license,
        qualificationCert: record.qualification_cert,
        remarks: record.remarks,
        creator: record.creator,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }))

      return {
        records: formattedRecords,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    } finally {
      connection.release()
    }
  }

  /**
   * 根据ID获取供应商详情
   */
  async getById(id) {
    const connection = await pool.getConnection()
    try {
      const [records] = await connection.execute(
        'SELECT * FROM supplier_management WHERE id = ?',
        [id]
      )

      if (records.length === 0) {
        throw new Error('供应商不存在')
      }

      const record = records[0]
      return {
        id: record.id,
        supplierCode: record.supplier_code,
        supplierName: record.supplier_name,
        supplierType: record.supplier_type,
        contactPerson: record.contact_person,
        contactPhone: record.contact_phone,
        contactEmail: record.contact_email,
        address: record.address,
        taxNo: record.tax_no,
        bankName: record.bank_name,
        bankAccount: record.bank_account,
        paymentTerms: record.payment_terms,
        creditRating: record.credit_rating,
        evaluationScore: record.evaluation_score,
        status: record.status,
        supplierCategory: record.supplier_category,
        cooperationStartDate: record.cooperation_start_date,
        businessLicense: record.business_license,
        qualificationCert: record.qualification_cert,
        remarks: record.remarks,
        creator: record.creator,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }
    } finally {
      connection.release()
    }
  }

  /**
   * 创建供应商
   */
  async create(data) {
    const connection = await pool.getConnection()
    try {
      const sql = `
        INSERT INTO supplier_management (
          supplier_code, supplier_name, supplier_type,
          contact_person, contact_phone, contact_email,
          address, tax_no, bank_name, bank_account,
          payment_terms, credit_rating, evaluation_score,
          status, supplier_category, cooperation_start_date,
          business_license, qualification_cert, remarks, creator
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      const [result] = await connection.execute(sql, [
        data.supplierCode,
        data.supplierName,
        data.supplierType,
        data.contactPerson,
        data.contactPhone,
        data.contactEmail || null,
        data.address || null,
        data.taxNo || null,
        data.bankName || null,
        data.bankAccount || null,
        data.paymentTerms || null,
        data.creditRating || null,
        data.evaluationScore || 0,
        data.status || 'active',
        data.supplierCategory || null,
        data.cooperationStartDate || null,
        data.businessLicense || null,
        data.qualificationCert || null,
        data.remarks || null,
        data.creator || 'system'
      ])

      return { id: result.insertId, ...data }
    } finally {
      connection.release()
    }
  }

  /**
   * 更新供应商
   */
  async update(id, data) {
    const connection = await pool.getConnection()
    try {
      const sql = `
        UPDATE supplier_management SET
          supplier_name = ?, supplier_type = ?,
          contact_person = ?, contact_phone = ?, contact_email = ?,
          address = ?, tax_no = ?, bank_name = ?, bank_account = ?,
          payment_terms = ?, credit_rating = ?, evaluation_score = ?,
          status = ?, supplier_category = ?, cooperation_start_date = ?,
          business_license = ?, qualification_cert = ?, remarks = ?,
          updated_at = NOW()
        WHERE id = ?
      `

      await connection.execute(sql, [
        data.supplierName,
        data.supplierType,
        data.contactPerson,
        data.contactPhone,
        data.contactEmail || null,
        data.address || null,
        data.taxNo || null,
        data.bankName || null,
        data.bankAccount || null,
        data.paymentTerms || null,
        data.creditRating || null,
        data.evaluationScore || 0,
        data.status || 'active',
        data.supplierCategory || null,
        data.cooperationStartDate || null,
        data.businessLicense || null,
        data.qualificationCert || null,
        data.remarks || null,
        id
      ])

      return { id, ...data }
    } finally {
      connection.release()
    }
  }

  /**
   * 删除供应商
   */
  async deleteById(id) {
    const connection = await pool.getConnection()
    try {
      await connection.execute(
        'DELETE FROM supplier_management WHERE id = ?',
        [id]
      )
      return { success: true }
    } finally {
      connection.release()
    }
  }

  /**
   * 批量删除供应商
   */
  async batchDelete(ids) {
    const connection = await pool.getConnection()
    try {
      const placeholders = ids.map(() => '?').join(',')
      await connection.execute(
        `DELETE FROM supplier_management WHERE id IN (${placeholders})`,
        ids
      )
      return { success: true, count: ids.length }
    } finally {
      connection.release()
    }
  }

  /**
   * 获取统计数据
   */
  async getStatistics() {
    const connection = await pool.getConnection()
    try {
      const [stats] = await connection.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeCount,
          SUM(CASE WHEN credit_rating IN ('A', 'B') THEN 1 ELSE 0 END) as highRatingCount,
          SUM(CASE WHEN DATE(created_at) >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as newCount
        FROM supplier_management
      `)

      return {
        total: stats[0].total || 0,
        activeCount: stats[0].activeCount || 0,
        highRatingCount: stats[0].highRatingCount || 0,
        newCount: stats[0].newCount || 0
      }
    } finally {
      connection.release()
    }
  }
}

module.exports = new SupplierManagementService()
