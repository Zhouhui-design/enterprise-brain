/**
 * 物料供货商信息服务
 * 处理物料供货商信息的数据库操作
 */
const { pool } = require('../config/database')

class MaterialSupplierService {
  /**
   * 根据物料编码获取供货商信息列表
   * @param {string} materialCode - 物料编码
   */
  async getByMaterialCode(materialCode) {
    const connection = await pool.getConnection()
    try {
      const [records] = await connection.execute(
        'SELECT * FROM material_suppliers WHERE material_code = ? ORDER BY sequence ASC',
        [materialCode]
      )
      
      return records.map(record => ({
        id: record.id,
        materialCode: record.material_code,
        supplierName: record.supplier_name,
        minimumOrderQuantity: record.minimum_order_quantity,
        tierRange: record.tier_range,
        tierUnitPrice: record.tier_unit_price,
        taxRate: record.tax_rate,
        standardPackagingQuantity: record.standard_packaging_quantity,
        orderingRule: record.ordering_rule,
        sequence: record.sequence,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }))
    } finally {
      connection.release()
    }
  }

  /**
   * 批量创建物料供货商信息
   * @param {Array} suppliers - 供货商信息数组
   */
  async createBatch(suppliers) {
    if (!suppliers || suppliers.length === 0) return []
    
    const connection = await pool.getConnection()
    try {
      const sql = `
        INSERT INTO material_suppliers (
          material_code, supplier_name, minimum_order_quantity,
          tier_range, tier_unit_price, tax_rate,
          standard_packaging_quantity, ordering_rule, sequence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      const results = []
      for (const supplier of suppliers) {
        const [result] = await connection.execute(sql, [
          supplier.materialCode,
          supplier.supplierName,
          supplier.minimumOrderQuantity || 0,
          supplier.tierRange || null,
          supplier.tierUnitPrice || 0,
          supplier.taxRate || 13,
          supplier.standardPackagingQuantity || 0,
          supplier.orderingRule || '默认',
          supplier.sequence || 0
        ])
        results.push({ id: result.insertId, ...supplier })
      }
      
      return results
    } finally {
      connection.release()
    }
  }

  /**
   * 根据物料编码删除供货商信息
   * @param {string} materialCode - 物料编码
   */
  async deleteByMaterialCode(materialCode) {
    const connection = await pool.getConnection()
    try {
      await connection.execute(
        'DELETE FROM material_suppliers WHERE material_code = ?',
        [materialCode]
      )
      return { success: true }
    } finally {
      connection.release()
    }
  }

  /**
   * 批量更新物料供货商信息
   * @param {string} materialCode - 物料编码
   * @param {Array} suppliers - 供货商信息数组
   */
  async updateBatch(materialCode, suppliers) {
    const connection = await pool.getConnection()
    try {
      // 先删除原有的供货商信息
      await this.deleteByMaterialCode(materialCode)
      
      // 再批量创建新的供货商信息
      if (suppliers && suppliers.length > 0) {
        return await this.createBatch(suppliers)
      }
      
      return []
    } finally {
      connection.release()
    }
  }
}

module.exports = new MaterialSupplierService()