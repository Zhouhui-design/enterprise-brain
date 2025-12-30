const express = require('express');
const router = express.Router();
const { pool, executeTransaction, logCustomerOperation, backupCustomerData } = require('../config/database');

// ==================== 客户管理API ====================

/**
 * 获取所有客户列表
 * GET /api/customers
 */
router.get('/', async (req, res) => {
  let connection;
  try {
    console.log('=== 获取客户列表 ===');

    const { page = 1, pageSize = 20, customerType, status, region, search } = req.query;

    // 构建查询条件
    let whereClause = [];
    const params = [];

    if (customerType) {
      whereClause.push('customer_type = ?');
      params.push(customerType);
    }

    if (status) {
      whereClause.push('status = ?');
      params.push(status);
    }

    if (region) {
      whereClause.push('region = ?');
      params.push(region);
    }

    if (search) {
      whereClause.push('(customer_name LIKE ? OR customer_code LIKE ? OR contact_person LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';

    connection = await pool.getConnection();

    // 获取总数
    const countSQL = `SELECT COUNT(*) as total FROM customers ${whereSQL}`;
    const [countResult] = await connection.execute(countSQL, params);
    const total = countResult[0].total;

    // 获取分页数据
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limitPageSize = parseInt(pageSize);
    const dataSQL = `
      SELECT * FROM customers 
      ${whereSQL}
      ORDER BY created_at DESC 
      LIMIT ${limitPageSize} OFFSET ${offset}
    `;
    const [customers] = await connection.execute(dataSQL, params);

    console.log(`✅ 查询成功，共 ${total} 条记录，当前页 ${customers.length} 条`);

    res.json({
      success: true,
      data: {
        list: customers,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    console.error('❌ 获取客户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取客户列表失败',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 根据ID获取客户详情
 * GET /api/customers/:id
 */
router.get('/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    console.log('=== 获取客户详情 ===', id);

    connection = await pool.getConnection();
    const [customers] = await connection.execute('SELECT * FROM customers WHERE id = ?', [id]);
    const customer = customers[0];

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '客户不存在',
      });
    }

    console.log('✅ 获取成功');
    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('❌ 获取客户详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取客户详情失败',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 创建新客户
 * POST /api/customers
router.post('/', async (req, res) => {
  let connection;
  try {
    console.log('=== 创建客户 ===');
    console.log('请求数据:', req.body);

    const {
      customerCode,
      customerName,
      customerType = 'regular',
      status = 'active',
      contactPerson,
      contactPhone,
      contactEmail,
      contactAddress,
      company,
      industry,
      region,
      taxNumber,
      creditLimit = 0,
      salesPerson,
      remark,
      createdBy = 'admin',
    } = req.body;

    // 验证必填字段
    if (!customerName) {
      return res.status(400).json({
        success: false,
        message: '客户名称为必填项',
      });
    }

    // 使用事务确保数据一致性
    const result = await executeTransaction(async (connection) => {
      // 自动生成客户编号（如果没有提供）
      let finalCustomerCode = customerCode;
      if (!finalCustomerCode) {
        const year = new Date().getFullYear();
        const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM customers');
        const count = countResult[0].count;
        finalCustomerCode = `C${year}${String(count + 1).padStart(4, '0')}`;
        console.log('自动生成客户编号:', finalCustomerCode);
      }

      // 检查客户编号是否已存在
      const [existing] = await connection.execute('SELECT id FROM customers WHERE customer_code = ?', [
        finalCustomerCode,
      ]);
      if (existing && existing.length > 0) {
        throw new Error('客户编号已存在');
      }

      // 插入数据
      await connection.execute(
        `
        INSERT INTO customers (
          customer_code, customer_name, customer_type, status,
          contact_person, contact_phone, contact_email, contact_address,
          company, industry, region, tax_number,
          credit_limit, sales_person, remark, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          finalCustomerCode,
          customerName,
          customerType,
          status,
          contactPerson || null,
          contactPhone || null,
          contactEmail || null,
          contactAddress || null,
          company || null,
          industry || null,
          region || null,
          taxNumber || null,
          creditLimit,
          salesPerson || null,
          remark || null,
          createdBy,
        ],
      );

      // 获取创建的客户
      const [newCustomers] = await connection.execute('SELECT * FROM customers WHERE customer_code = ?', [
        finalCustomerCode,
      ]);
      const newCustomer = newCustomers[0];

      // 记录操作日志
      await logCustomerOperation(
        newCustomer.id,
        'CREATE',
        {
          customer_code: newCustomer.customer_code,
          customer_name: newCustomer.customer_name,
          operation: 'create',
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          request_data: req.body
        },
        createdBy
      );

      return newCustomer;
    });

    console.log('✅ 创建成功，ID:', result.id);

    res.json({
      success: true,
      message: '创建客户成功',
      data: result,
    });
  } catch (error) {
    console.error('❌ 创建客户失败:', error);
    res.status(500).json({
      success: false,
      message: '创建客户失败',
      error: error.message,
    });
  }
});

/**
 * 更新客户信息
 * PUT /api/customers/:id
 */
router.put('/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    console.log('=== 更新客户 ===', id);
    console.log('请求数据:', req.body);

    connection = await pool.getConnection();

    // 检查客户是否存在
    const [existing] = await connection.execute('SELECT id FROM customers WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '客户不存在',
      });
    }

    const {
      customerCode,
      customerName,
      customerType,
      status,
      contactPerson,
      contactPhone,
      contactEmail,
      contactAddress,
      company,
      companyAddress,
      industry,
      region,
      taxNumber,
      creditLevel,
      creditLimit,
      salesPerson,
      source,
      tags,
      remark,
      updatedBy = 'admin',
    } = req.body;

    // 如果修改了客户编号，检查是否重复
    if (customerCode) {
      const [duplicate] = await connection.execute('SELECT id FROM customers WHERE customer_code = ? AND id != ?', [
        customerCode,
        id,
      ]);
      if (duplicate && duplicate.length > 0) {
        return res.status(400).json({
          success: false,
          message: '客户编号已存在',
        });
      }
    }

    // 更新数据 - MySQL语法
    await connection.execute(
      `
      UPDATE customers SET
        customer_code = COALESCE(?, customer_code),
        customer_name = COALESCE(?, customer_name),
        customer_type = COALESCE(?, customer_type),
        status = COALESCE(?, status),
        contact_person = ?,
        contact_phone = ?,
        contact_email = ?,
        contact_address = ?,
        company = ?,
        company_address = ?,
        industry = ?,
        region = ?,
        tax_number = ?,
        credit_level = ?,
        credit_limit = ?,
        sales_person = ?,
        source = ?,
        tags = ?,
        remark = ?,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [
        customerCode,
        customerName,
        customerType,
        status,
        contactPerson,
        contactPhone,
        contactEmail,
        contactAddress,
        company,
        companyAddress,
        industry,
        region,
        taxNumber,
        creditLevel,
        creditLimit,
        salesPerson,
        source,
        tags ? JSON.stringify(tags) : null,
        remark,
        updatedBy,
        id,
      ],
    );

    // 获取更新后的客户
    const [updatedCustomers] = await connection.execute('SELECT * FROM customers WHERE id = ?', [id]);
    const updatedCustomer = updatedCustomers[0];

    console.log('✅ 更新成功');

    res.json({
      success: true,
      message: '更新客户成功',
      data: updatedCustomer,
    });
  } catch (error) {
    console.error('❌ 更新客户失败:', error);
    res.status(500).json({
      success: false,
      message: '更新客户失败',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 删除客户
 * DELETE /api/customers/:id
 */
router.delete('/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    console.log('=== 删除客户 ===', id);

    connection = await pool.getConnection();

    // 检查客户是否存在
    const [existing] = await connection.execute('SELECT id FROM customers WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '客户不存在',
      });
    }

    // TODO: 检查是否有关联的订单，如果有则不允许删除

    // 删除客户
    await connection.execute('DELETE FROM customers WHERE id = ?', [id]);

    console.log('✅ 删除成功');

    res.json({
      success: true,
      message: '删除客户成功',
    });
  } catch (error) {
    console.error('❌ 删除客户失败:', error);
    res.status(500).json({
      success: false,
      message: '删除客户失败',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 批量删除客户
 * POST /api/customers/batch-delete
 */
router.post('/batch-delete', async (req, res) => {
  let connection;
  try {
    const { ids } = req.body;
    console.log('=== 批量删除客户 ===', ids);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的客户ID列表',
      });
    }

    connection = await pool.getConnection();

    const placeholders = ids.map(() => '?').join(',');
    const [result] = await connection.execute(`DELETE FROM customers WHERE id IN (${placeholders})`, ids);

    console.log('✅ 批量删除成功，删除数量:', result.affectedRows);

    res.json({
      success: true,
      message: `成功删除 ${result.affectedRows} 个客户`,
      data: {
        deletedCount: result.affectedRows,
      },
    });
  } catch (error) {
    console.error('❌ 批量删除客户失败:', error);
    res.status(500).json({
      success: false,
      message: '批量删除客户失败',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 获取客户统计信息
 * GET /api/customers/stats
 */
router.get('/statistics/overview', async (req, res) => {
  let connection;
  try {
    console.log('=== 获取客户统计信息 ===');

    connection = await pool.getConnection();

    // 获取各项统计
    const [totalResult] = await connection.execute('SELECT COUNT(*) as count FROM customers');
    const [vipResult] = await connection.execute("SELECT COUNT(*) as count FROM customers WHERE customer_type = 'vip'");
    const [activeResult] = await connection.execute("SELECT COUNT(*) as count FROM customers WHERE status = 'active'");
    const [revenueResult] = await connection.execute('SELECT SUM(credit_limit) as total FROM customers');

    const stats = {
      total: totalResult[0].count,
      vip: vipResult[0].count,
      active: activeResult[0].count,
      totalRevenue: revenueResult[0].total || 0,
    };

    console.log('✅ 统计成功:', stats);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('❌ 获取统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 获取客户数据备份列表
 * GET /api/customers/backups
 */
router.get('/backups', async (req, res) => {
  try {
    console.log('=== 获取客户数据备份列表 ===');
    
    const backups = await getCustomerBackupList();
    
    console.log('✅ 获取备份列表成功，共', backups.length, '个备份点');
    
    res.json({
      success: true,
      data: backups,
    });
  } catch (error) {
    console.error('❌ 获取备份列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取备份列表失败',
      error: error.message,
    });
  }
});

/**
 * 从备份恢复客户数据
 * POST /api/customers/restore
 */
router.post('/restore', async (req, res) => {
  try {
    console.log('=== 从备份恢复客户数据 ===');
    
    const { backupId, targetTable = 'customers' } = req.body;
    
    if (!backupId) {
      return res.status(400).json({
        success: false,
        message: '请提供备份ID',
      });
    }
    
    // 先创建当前数据的备份
    const currentBackupId = await backupCustomerData();
    console.log('✅ 当前数据已备份:', currentBackupId);
    
    // 执行恢复操作
    const success = await restoreCustomerData(backupId, targetTable);
    
    if (success) {
      console.log('✅ 数据恢复成功');
      
      res.json({
        success: true,
        message: `成功从备份 ${backupId} 恢复客户数据`,
        data: {
          backupId,
          targetTable,
          preRestoreBackup: currentBackupId
        }
      });
    } else {
      throw new Error('恢复操作失败');
    }
  } catch (error) {
    console.error('❌ 数据恢复失败:', error);
    res.status(500).json({
      success: false,
      message: '数据恢复失败',
      error: error.message,
    });
  }
});

/**
 * 手动触发备份
 * POST /api/customers/backup
 */
router.post('/backup', async (req, res) => {
  try {
    console.log('=== 手动触发客户数据备份 ===');
    
    const backupId = await triggerImmediateBackup();
    
    console.log('✅ 手动备份成功:', backupId);
    
    res.json({
      success: true,
      message: '客户数据备份成功',
      data: {
        backupId,
        backupTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ 手动备份失败:', error);
    res.status(500).json({
      success: false,
      message: '手动备份失败',
      error: error.message,
    });
  }
});

/**
 * 数据一致性检查
 * GET /api/customers/health-check
 */
router.get('/health-check', async (req, res) => {
  try {
    console.log('=== 客户数据一致性检查 ===');
    
    const healthCheck = {
      databaseConnection: true, // 如果能到这里，说明数据库连接正常
      totalCustomers: 0,
      dataIntegrity: {
        duplicateCodes: 0,
        nullNames: 0,
        invalidStatus: 0
      },
      lastBackup: null,
      systemStatus: 'healthy'
    };
    
    // 检查总客户数
    const connection = await pool.getConnection();
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM customers');
    healthCheck.totalCustomers = countResult[0].count;
    
    // 检查数据完整性
    const [duplicateCheck] = await connection.execute(`
      SELECT customer_code, COUNT(*) as count 
      FROM customers 
      GROUP BY customer_code 
      HAVING count > 1
    `);
    healthCheck.dataIntegrity.duplicateCodes = duplicateCheck.length;
    
    const [nullNameCheck] = await connection.execute(`
      SELECT COUNT(*) as count FROM customers WHERE customer_name IS NULL OR customer_name = ''
    `);
    healthCheck.dataIntegrity.nullNames = nullNameCheck[0].count;
    
    const [invalidStatusCheck] = await connection.execute(`
      SELECT COUNT(*) as count FROM customers 
      WHERE status NOT IN ('active', 'inactive', 'lost', 'frozen')
    `);
    healthCheck.dataIntegrity.invalidStatus = invalidStatusCheck[0].count;
    
    // 获取最新备份信息
    const [backupLogs] = await connection.execute(`
      SELECT backup_time, record_count 
      FROM backup_logs 
      WHERE table_name = 'customers' 
      ORDER BY backup_time DESC 
      LIMIT 1
    `);
    
    if (backupLogs.length > 0) {
      healthCheck.lastBackup = {
        backupTime: backupLogs[0].backup_time,
        recordCount: backupLogs[0].record_count
      };
    }
    
    // 评估系统状态
    const issues = Object.values(healthCheck.dataIntegrity).reduce((sum, val) => sum + val, 0);
    if (issues > 0) {
      healthCheck.systemStatus = 'warning';
    }
    
    connection.release();
    
    console.log('✅ 健康检查完成:', healthCheck);
    
    res.json({
      success: true,
      data: healthCheck,
    });
  } catch (error) {
    console.error('❌ 健康检查失败:', error);
    res.status(500).json({
      success: false,
      message: '健康检查失败',
      error: error.message,
    });
  }
});

module.exports = router;
