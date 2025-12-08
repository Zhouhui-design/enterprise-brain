const { query } = require('../config/database');

/**
 * 产品手册服务
 */
class ProductManualService {
  /**
   * 获取所有产品手册
   */
  async getAll() {
    // 使用LEFT JOIN从产品物料库lookup产出工序名称
    const sql = `
      SELECT 
        pm.id,
        pm.productCode,
        pm.productName,
        pm.productImage,
        pm.source,
        pm.category,
        pm.specification,
        pm.unit,
        pm.status,
        pm.productStatus,
        pm.version,
        pm.isEnabled,
        pm.designer,
        pm.bomMaintainer,
        pm.remark,
        pm.createTime,
        pm.updateTime,
        COALESCE(m.process_name, pm.outputProcessName) as outputProcessName
      FROM product_manual pm
      LEFT JOIN materials m ON pm.productCode = m.material_code
      ORDER BY pm.createTime DESC
    `;
    return await query(sql);
  }

  /**
   * 根据ID获取产品手册
   */
  async getById(id) {
    const sql = `
      SELECT 
        pm.id,
        pm.productCode,
        pm.productName,
        pm.productImage,
        pm.source,
        pm.category,
        pm.specification,
        pm.unit,
        pm.status,
        pm.productStatus,
        pm.version,
        pm.isEnabled,
        pm.designer,
        pm.bomMaintainer,
        pm.remark,
        pm.createTime,
        pm.updateTime,
        COALESCE(m.process_name, pm.outputProcessName) as outputProcessName
      FROM product_manual pm
      LEFT JOIN materials m ON pm.productCode = m.material_code
      WHERE pm.id = ?
    `;
    const results = await query(sql, [id]);
    return results[0];
  }

  /**
   * 根据产品编号获取产品手册
   */
  async getByProductCode(productCode) {
    const sql = `
      SELECT 
        pm.id,
        pm.productCode,
        pm.productName,
        pm.productImage,
        pm.source,
        pm.category,
        pm.specification,
        pm.unit,
        pm.status,
        pm.productStatus,
        pm.version,
        pm.isEnabled,
        pm.designer,
        pm.bomMaintainer,
        pm.remark,
        pm.createTime,
        pm.updateTime,
        COALESCE(m.process_name, pm.outputProcessName) as outputProcessName
      FROM product_manual pm
      LEFT JOIN materials m ON pm.productCode = m.material_code
      WHERE pm.productCode = ?
    `;
    const results = await query(sql, [productCode]);
    
    console.log('🔍 查询产品编号:', productCode, '结果:', results.length > 0 ? {
      id: results[0]?.id,
      productCode: results[0]?.productCode,
      productName: results[0]?.productName
    } : '未找到');
    
    return results[0];
  }

  /**
   * 创建产品手册
   */
  async create(data) {
    const {
      productCode,
      productName,
      productImage,
      source,
      outputProcessName,
      category,
      specification,
      unit,
      status,
      productStatus,
      version,
      isEnabled,
      designer,
      bomMaintainer,
      remark
    } = data;

    const sql = `
      INSERT INTO product_manual (
        productCode, productName, productImage, source, outputProcessName, category,
        specification, unit, status, productStatus, version,
        isEnabled, designer, bomMaintainer, remark, createTime, updateTime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const sourceStr = Array.isArray(source) ? JSON.stringify(source) : source;

    const result = await query(sql, [
      productCode,
      productName,
      productImage || '',
      sourceStr,
      outputProcessName || '',
      category || '',
      specification || '',
      unit || '个',
      status || '在售',
      productStatus || '正常',
      version || 'V1.0',
      isEnabled !== false ? 1 : 0,
      designer || '',
      bomMaintainer || '',
      remark || ''
    ]);

    return result.insertId;
  }

  /**
   * 更新产品手册
   */
  async update(id, data) {
    const {
      productCode,
      productName,
      productImage,
      source,
      outputProcessName,
      category,
      specification,
      unit,
      status,
      productStatus,
      version,
      isEnabled,
      designer,
      bomMaintainer,
      remark
    } = data;

    const sql = `
      UPDATE product_manual SET
        productCode = ?,
        productName = ?,
        productImage = ?,
        source = ?,
        outputProcessName = ?,
        category = ?,
        specification = ?,
        unit = ?,
        status = ?,
        productStatus = ?,
        version = ?,
        isEnabled = ?,
        designer = ?,
        bomMaintainer = ?,
        remark = ?,
        updateTime = NOW()
      WHERE id = ?
    `;

    const sourceStr = Array.isArray(source) ? JSON.stringify(source) : source;

    const result = await query(sql, [
      productCode,
      productName,
      productImage || '',
      sourceStr,
      outputProcessName || '',
      category || '',
      specification || '',
      unit || '个',
      status || '在售',
      productStatus || '正常',
      version || 'V1.0',
      isEnabled !== false ? 1 : 0,
      designer || '',
      bomMaintainer || '',
      remark || '',
      id
    ]);

    return result.affectedRows > 0;
  }

  /**
   * 删除产品手册
   */
  async delete(id) {
    const sql = 'DELETE FROM product_manual WHERE id = ?';
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  }

  /**
   * 批量删除产品手册
   */
  async batchDelete(ids) {
    const placeholders = ids.map(() => '?').join(',');
    const sql = `DELETE FROM product_manual WHERE id IN (${placeholders})`;
    const result = await query(sql, ids);
    return result.affectedRows;
  }
}

module.exports = new ProductManualService();
