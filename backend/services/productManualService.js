const db = require('../config/database');

/**
 * 产品手册服务
 */
class ProductManualService {
  /**
   * 获取所有产品手册
   */
  async getAll() {
    const query = 'SELECT * FROM product_manual ORDER BY createTime DESC';
    return await db.query(query);
  }

  /**
   * 根据ID获取产品手册
   */
  async getById(id) {
    const query = 'SELECT * FROM product_manual WHERE id = ?';
    const results = await db.query(query, [id]);
    return results[0];
  }

  /**
   * 根据产品编号获取产品手册
   */
  async getByProductCode(productCode) {
    const query = 'SELECT * FROM product_manual WHERE productCode = ?';
    const results = await db.query(query, [productCode]);
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

    const query = `
      INSERT INTO product_manual (
        productCode, productName, productImage, source, category,
        specification, unit, status, productStatus, version,
        isEnabled, designer, bomMaintainer, remark, createTime, updateTime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const sourceStr = Array.isArray(source) ? JSON.stringify(source) : source;

    const result = await db.query(query, [
      productCode,
      productName,
      productImage || '',
      sourceStr,
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

    const query = `
      UPDATE product_manual SET
        productCode = ?,
        productName = ?,
        productImage = ?,
        source = ?,
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

    const result = await db.query(query, [
      productCode,
      productName,
      productImage || '',
      sourceStr,
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
    const query = 'DELETE FROM product_manual WHERE id = ?';
    const result = await db.query(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * 批量删除产品手册
   */
  async batchDelete(ids) {
    const placeholders = ids.map(() => '?').join(',');
    const query = `DELETE FROM product_manual WHERE id IN (${placeholders})`;
    const result = await db.query(query, ids);
    return result.affectedRows;
  }
}

module.exports = new ProductManualService();
