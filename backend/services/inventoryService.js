/**
 * 库存管理服务层
 */
const { pool } = require('../config/database');

class InventoryService {
  /**
   * 获取库存列表（支持分页、筛选、排序）
   */
  async getInventoryList(params = {}) {
    const {
      page = 1,
      pageSize = 20,
      material_code,
      material_name,
      warehouse_code,
      status,
      sortBy = 'updated_at',
      sortOrder = 'DESC'
    } = params;

    let whereClause = [];
    let queryParams = [];

    if (material_code) {
      whereClause.push('material_code LIKE ?');
      queryParams.push(`%${material_code}%`);
    }

    if (material_name) {
      whereClause.push('material_name LIKE ?');
      queryParams.push(`%${material_name}%`);
    }

    if (warehouse_code) {
      whereClause.push('warehouse_code = ?');
      queryParams.push(warehouse_code);
    }

    if (status) {
      whereClause.push('status = ?');
      queryParams.push(status);
    }

    const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';

    // 查询总数
    const countSQL = `SELECT COUNT(*) as total FROM inventory ${whereSQL}`;
    const [countResult] = await pool.query(countSQL, queryParams);
    const total = countResult[0].total;

    // 分页查询
    const offset = (page - 1) * pageSize;
    const dataSQL = `
      SELECT * FROM inventory
      ${whereSQL}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(dataSQL, [...queryParams, parseInt(pageSize), offset]);

    return {
      list: rows,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  }

  /**
   * 获取库存详情
   */
  async getInventoryById(id) {
    const query = 'SELECT * FROM inventory WHERE id = ?';
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  /**
   * 根据物料编号获取库存
   */
  async getInventoryByMaterialCode(materialCode, warehouseCode = null, batchNo = null) {
    let query = 'SELECT * FROM inventory WHERE material_code = ?';
    let params = [materialCode];

    if (warehouseCode) {
      query += ' AND warehouse_code = ?';
      params.push(warehouseCode);
    }

    if (batchNo) {
      query += ' AND batch_no = ?';
      params.push(batchNo);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * 创建库存记录
   */
  async createInventory(data) {
    const {
      material_code, material_name, warehouse_code = 'WH001', warehouse_name = '默认仓库',
      location, batch_no, quantity = 0, unit = '个', unit_price = 0,
      safety_stock = 0, max_stock = 0, min_stock = 0, supplier, remark
    } = data;

    const total_amount = quantity * unit_price;
    const available_quantity = quantity;

    // 检查是否已存在
    const existing = await this.getInventoryByMaterialCode(material_code, warehouse_code, batch_no);
    if (existing && existing.length > 0) {
      throw new Error(`该物料在仓库${warehouse_code}批次${batch_no || '默认'}已存在库存记录`);
    }

    const query = `
      INSERT INTO inventory (
        material_code, material_name, warehouse_code, warehouse_name, location, batch_no,
        quantity, available_quantity, unit, unit_price, total_amount,
        safety_stock, max_stock, min_stock, supplier, status, remark, last_in_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const status = quantity <= min_stock ? 'shortage' : (quantity <= safety_stock ? 'warning' : 'normal');

    const [result] = await pool.query(query, [
      material_code, material_name, warehouse_code, warehouse_name, location, batch_no || null,
      quantity, available_quantity, unit, unit_price, total_amount,
      safety_stock, max_stock, min_stock, supplier, status, remark
    ]);

    return result.insertId;
  }

  /**
   * 更新库存
   */
  async updateInventory(id, data) {
    const {
      location, quantity, unit_price, safety_stock, max_stock, min_stock, supplier, remark
    } = data;

    const total_amount = quantity * unit_price;
    const status = quantity <= min_stock ? 'shortage' : (quantity <= safety_stock ? 'warning' : 'normal');

    const query = `
      UPDATE inventory SET
        location = ?, quantity = ?, available_quantity = ?, unit_price = ?, total_amount = ?,
        safety_stock = ?, max_stock = ?, min_stock = ?, supplier = ?, status = ?, remark = ?
      WHERE id = ?
    `;

    await pool.query(query, [
      location, quantity, quantity, unit_price, total_amount,
      safety_stock, max_stock, min_stock, supplier, status, remark, id
    ]);

    return true;
  }

  /**
   * 删除库存记录
   */
  async deleteInventory(id) {
    const query = 'DELETE FROM inventory WHERE id = ?';
    await pool.query(query, [id]);
    return true;
  }

  /**
   * 批量删除
   */
  async batchDelete(ids) {
    const query = 'DELETE FROM inventory WHERE id IN (?)';
    await pool.query(query, [ids]);
    return true;
  }

  /**
   * 获取库存明细（流水记录）
   */
  async getInventoryDetails(params = {}) {
    const {
      page = 1,
      pageSize = 20,
      material_code,
      warehouse_code,
      transaction_type,
      startDate,
      endDate
    } = params;

    let whereClause = [];
    let queryParams = [];

    if (material_code) {
      whereClause.push('material_code LIKE ?');
      queryParams.push(`%${material_code}%`);
    }

    if (warehouse_code) {
      whereClause.push('warehouse_code = ?');
      queryParams.push(warehouse_code);
    }

    if (transaction_type) {
      whereClause.push('transaction_type = ?');
      queryParams.push(transaction_type);
    }

    if (startDate) {
      whereClause.push('operator_time >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereClause.push('operator_time <= ?');
      queryParams.push(endDate);
    }

    const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';

    // 查询总数
    const countSQL = `SELECT COUNT(*) as total FROM inventory_details ${whereSQL}`;
    const [countResult] = await pool.query(countSQL, queryParams);
    const total = countResult[0].total;

    // 分页查询
    const offset = (page - 1) * pageSize;
    const dataSQL = `
      SELECT * FROM inventory_details
      ${whereSQL}
      ORDER BY operator_time DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(dataSQL, [...queryParams, parseInt(pageSize), offset]);

    return {
      list: rows,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  }

  /**
   * 创建库存明细记录
   */
  async createInventoryDetail(data) {
    const {
      transaction_no, material_code, material_name, warehouse_code, warehouse_name,
      location, batch_no, transaction_type, quantity, unit, unit_price,
      before_quantity, after_quantity, related_order_no, operator, remark
    } = data;

    const total_amount = quantity * unit_price;

    const query = `
      INSERT INTO inventory_details (
        transaction_no, material_code, material_name, warehouse_code, warehouse_name,
        location, batch_no, transaction_type, quantity, unit, unit_price, total_amount,
        before_quantity, after_quantity, related_order_no, operator, remark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      transaction_no, material_code, material_name, warehouse_code, warehouse_name,
      location, batch_no, transaction_type, quantity, unit, unit_price, total_amount,
      before_quantity, after_quantity, related_order_no, operator, remark
    ]);

    return result.insertId;
  }

  /**
   * 获取库存报表统计
   */
  async getInventoryReport(params = {}) {
    const { warehouse_code, status } = params;

    let whereClause = [];
    let queryParams = [];

    if (warehouse_code) {
      whereClause.push('warehouse_code = ?');
      queryParams.push(warehouse_code);
    }

    if (status) {
      whereClause.push('status = ?');
      queryParams.push(status);
    }

    const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';

    // 库存汇总统计
    const summarySQL = `
      SELECT 
        COUNT(*) as total_items,
        SUM(quantity) as total_quantity,
        SUM(available_quantity) as total_available,
        SUM(frozen_quantity) as total_frozen,
        SUM(total_amount) as total_amount,
        SUM(CASE WHEN status = 'shortage' THEN 1 ELSE 0 END) as shortage_count,
        SUM(CASE WHEN status = 'warning' THEN 1 ELSE 0 END) as warning_count,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_count
      FROM inventory ${whereSQL}
    `;
    const [summary] = await pool.query(summarySQL, queryParams);

    // 按仓库统计
    const warehouseSQL = `
      SELECT 
        warehouse_code, warehouse_name,
        COUNT(*) as item_count,
        SUM(quantity) as total_quantity,
        SUM(total_amount) as total_amount
      FROM inventory ${whereSQL}
      GROUP BY warehouse_code, warehouse_name
    `;
    const [warehouses] = await pool.query(warehouseSQL, queryParams);

    // 库存预警列表
    const alertSQL = `
      SELECT * FROM inventory
      WHERE status IN ('warning', 'shortage', 'expired')
      ${warehouse_code ? 'AND warehouse_code = ?' : ''}
      ORDER BY status, material_code
      LIMIT 50
    `;
    const alertParams = warehouse_code ? [warehouse_code] : [];
    const [alerts] = await pool.query(alertSQL, alertParams);

    return {
      summary: summary[0],
      warehouses,
      alerts
    };
  }

  /**
   * 库存入库
   */
  async inventoryIn(data) {
    const {
      material_code, material_name, warehouse_code, warehouse_name,
      location, batch_no, quantity, unit, unit_price, related_order_no, operator, remark
    } = data;

    // 生成事务单号
    const transaction_no = `IN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 查找现有库存
    const existing = await this.getInventoryByMaterialCode(material_code, warehouse_code, batch_no);
    
    let before_quantity = 0;
    let after_quantity = quantity;

    if (existing && existing.length > 0) {
      // 更新库存
      const inv = existing[0];
      before_quantity = inv.quantity;
      after_quantity = parseFloat(before_quantity) + parseFloat(quantity);

      await pool.query(
        'UPDATE inventory SET quantity = ?, available_quantity = ?, last_in_date = NOW() WHERE id = ?',
        [after_quantity, after_quantity, inv.id]
      );
    } else {
      // 创建新库存
      await this.createInventory({
        material_code, material_name, warehouse_code, warehouse_name,
        location, batch_no, quantity, unit, unit_price, remark
      });
    }

    // 记录明细
    await this.createInventoryDetail({
      transaction_no, material_code, material_name, warehouse_code, warehouse_name,
      location, batch_no, transaction_type: 'in', quantity, unit, unit_price,
      before_quantity, after_quantity, related_order_no, operator, remark
    });

    return { transaction_no, before_quantity, after_quantity };
  }

  /**
   * 库存出库
   */
  async inventoryOut(data) {
    const {
      material_code, warehouse_code, batch_no, quantity, unit, related_order_no, operator, remark
    } = data;

    // 生成事务单号
    const transaction_no = `OUT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 查找现有库存
    const existing = await this.getInventoryByMaterialCode(material_code, warehouse_code, batch_no);
    
    if (!existing || existing.length === 0) {
      throw new Error('库存不足，无法出库');
    }

    const inv = existing[0];
    const before_quantity = inv.quantity;

    if (parseFloat(before_quantity) < parseFloat(quantity)) {
      throw new Error(`库存不足，当前库存: ${before_quantity}, 需求数量: ${quantity}`);
    }

    const after_quantity = parseFloat(before_quantity) - parseFloat(quantity);

    // 更新库存
    await pool.query(
      'UPDATE inventory SET quantity = ?, available_quantity = ?, last_out_date = NOW() WHERE id = ?',
      [after_quantity, after_quantity, inv.id]
    );

    // 记录明细
    await this.createInventoryDetail({
      transaction_no,
      material_code: inv.material_code,
      material_name: inv.material_name,
      warehouse_code: inv.warehouse_code,
      warehouse_name: inv.warehouse_name,
      location: inv.location,
      batch_no: inv.batch_no,
      transaction_type: 'out',
      quantity,
      unit: unit || inv.unit,
      unit_price: inv.unit_price,
      before_quantity,
      after_quantity,
      related_order_no,
      operator,
      remark
    });

    return { transaction_no, before_quantity, after_quantity };
  }

  /**
   * 导出库存数据
   */
  async exportInventory(params = {}) {
    const { material_code, material_name, warehouse_code, status } = params;

    let whereClause = [];
    let queryParams = [];

    if (material_code) {
      whereClause.push('material_code LIKE ?');
      queryParams.push(`%${material_code}%`);
    }

    if (material_name) {
      whereClause.push('material_name LIKE ?');
      queryParams.push(`%${material_name}%`);
    }

    if (warehouse_code) {
      whereClause.push('warehouse_code = ?');
      queryParams.push(warehouse_code);
    }

    if (status) {
      whereClause.push('status = ?');
      queryParams.push(status);
    }

    const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';

    const query = `
      SELECT 
        material_code, material_name, warehouse_code, warehouse_name, 
        location, batch_no, quantity, unit, unit_price, total_amount, 
        safety_stock, max_stock, min_stock, status, supplier, remark
      FROM inventory
      ${whereSQL}
      ORDER BY material_code
    `;

    const [rows] = await pool.query(query, queryParams);
    return rows;
  }

  /**
   * 导入库存数据
   */
  async importInventory(data) {
    // 开始事务
    await pool.query('START TRANSACTION');
    
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const item of data) {
        try {
          // 验证必填字段
          if (!item.material_code || !item.material_name) {
            throw new Error('物料编码和名称不能为空');
          }

          // 检查是否已存在
          const existing = await this.getInventoryByMaterialCode(
            item.material_code, 
            item.warehouse_code || 'WH001', 
            item.batch_no
          );

          if (existing && existing.length > 0) {
            // 更新现有库存
            await this.updateInventory(existing[0].id, {
              location: item.location || existing[0].location,
              quantity: item.quantity || existing[0].quantity,
              unit_price: item.unit_price || existing[0].unit_price,
              safety_stock: item.safety_stock || existing[0].safety_stock,
              max_stock: item.max_stock || existing[0].max_stock,
              min_stock: item.min_stock || existing[0].min_stock,
              supplier: item.supplier || existing[0].supplier,
              remark: item.remark || existing[0].remark
            });
          } else {
            // 创建新库存
            await this.createInventory({
              material_code: item.material_code,
              material_name: item.material_name,
              warehouse_code: item.warehouse_code || 'WH001',
              warehouse_name: item.warehouse_name || '默认仓库',
              location: item.location,
              batch_no: item.batch_no,
              quantity: item.quantity || 0,
              unit: item.unit || '个',
              unit_price: item.unit_price || 0,
              safety_stock: item.safety_stock || 0,
              max_stock: item.max_stock || 0,
              min_stock: item.min_stock || 0,
              supplier: item.supplier,
              remark: item.remark
            });
          }

          successCount++;
        } catch (error) {
          errorCount++;
          errors.push({
            index: data.indexOf(item) + 1,
            error: error.message
          });
        }
      }

      // 提交事务
      await pool.query('COMMIT');

      return {
        successCount,
        errorCount,
        errors
      };
    } catch (error) {
      // 回滚事务
      await pool.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * 清空库存列表
   */
  async clearInventory(warehouseCode = null) {
    let query = 'DELETE FROM inventory';
    let params = [];

    if (warehouseCode) {
      query += ' WHERE warehouse_code = ?';
      params.push(warehouseCode);
    }

    await pool.query(query, params);
    return true;
  }
}

module.exports = new InventoryService();