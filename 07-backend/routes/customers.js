const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { 
  Customer, 
  CustomerContact,
  CustomerAddress,
  CustomerOrderHistory
} = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 获取客户列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      type,
      level,
      region,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const whereClause = {};
    
    // 状态筛选
    if (status) {
      whereClause.status = status;
    } else {
      whereClause.status = 'active'; // 默认只显示激活的客户
    }
    
    // 客户类型筛选
    if (type) {
      whereClause.type = type;
    }
    
    // 客户等级筛选
    if (level) {
      whereClause.level = level;
    }
    
    // 地区筛选
    if (region) {
      whereClause.region = region;
    }
    
    // 搜索筛选
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { contactPerson: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    // 构建查询
    const query = {
      where: whereClause,
      include: [
        {
          model: CustomerContact,
          as: 'contacts',
          attributes: ['id', 'name', 'position', 'phone', 'email', 'isPrimary']
        },
        {
          model: CustomerAddress,
          as: 'addresses',
          attributes: ['id', 'type', 'address', 'isDefault']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    };

    const { count, rows } = await Customer.findAndCountAll(query);

    res.json({
      success: true,
      data: {
        customers: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(count / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取客户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取客户列表失败',
      error: error.message
    });
  }
});

// 获取客户详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id, {
      include: [
        {
          model: CustomerContact,
          as: 'contacts'
        },
        {
          model: CustomerAddress,
          as: 'addresses'
        },
        {
          model: CustomerOrderHistory,
          as: 'orderHistory',
          order: [['orderDate', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    // 获取客户统计信息
    const stats = await getCustomerStats(id);

    res.json({
      success: true,
      data: {
        ...customer.toJSON(),
        stats
      }
    });
  } catch (error) {
    console.error('获取客户详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取客户详情失败',
      error: error.message
    });
  }
});

// 创建客户
router.post('/', authenticateToken, requireRole(['sales', 'admin']), async (req, res) => {
  try {
    const {
      name,
      type,
      level,
      industry,
      region,
      contactPerson,
      phone,
      email,
      website,
      description,
      taxNumber,
      bankName,
      bankAccount,
      creditLimit = 0,
      paymentTerms,
      contacts,
      addresses
    } = req.body;

    // 生成客户编号
    const customerCode = generateCustomerCode();

    // 创建客户
    const customer = await Customer.create({
      code: customerCode,
      name,
      type,
      level,
      industry,
      region,
      contactPerson,
      phone,
      email,
      website,
      description,
      taxNumber,
      bankName,
      bankAccount,
      creditLimit,
      paymentTerms,
      status: 'active',
      createdBy: req.user.id
    });

    // 创建联系人
    if (contacts && contacts.length > 0) {
      const customerContacts = contacts.map(contact => ({
        customerId: customer.id,
        name: contact.name,
        position: contact.position,
        phone: contact.phone,
        email: contact.email,
        department: contact.department || '',
        isPrimary: contact.isPrimary || false
      }));

      await CustomerContact.bulkCreate(customerContacts);
    }

    // 创建地址
    if (addresses && addresses.length > 0) {
      const customerAddresses = addresses.map(address => ({
        customerId: customer.id,
        type: address.type,
        address: address.address,
        postalCode: address.postalCode || '',
        contactPerson: address.contactPerson || '',
        phone: address.phone || '',
        isDefault: address.isDefault || false
      }));

      await CustomerAddress.bulkCreate(customerAddresses);
    }

    // 获取完整的客户信息
    const completeCustomer = await Customer.findByPk(customer.id, {
      include: [
        { model: CustomerContact, as: 'contacts' },
        { model: CustomerAddress, as: 'addresses' }
      ]
    });

    res.status(201).json({
      success: true,
      data: completeCustomer,
      message: '客户创建成功'
    });
  } catch (error) {
    console.error('创建客户失败:', error);
    res.status(500).json({
      success: false,
      message: '创建客户失败',
      error: error.message
    });
  }
});

// 更新客户
router.put('/:id', authenticateToken, requireRole(['sales', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    // 更新客户信息
    await customer.update({
      ...updateData,
      updatedBy: req.user.id,
      updatedAt: new Date()
    });

    // 更新联系人信息
    if (updateData.contacts) {
      await CustomerContact.destroy({ where: { customerId: id } });
      
      const customerContacts = updateData.contacts.map(contact => ({
        customerId: id,
        name: contact.name,
        position: contact.position,
        phone: contact.phone,
        email: contact.email,
        department: contact.department || '',
        isPrimary: contact.isPrimary || false
      }));

      await CustomerContact.bulkCreate(customerContacts);
    }

    // 更新地址信息
    if (updateData.addresses) {
      await CustomerAddress.destroy({ where: { customerId: id } });
      
      const customerAddresses = updateData.addresses.map(address => ({
        customerId: id,
        type: address.type,
        address: address.address,
        postalCode: address.postalCode || '',
        contactPerson: address.contactPerson || '',
        phone: address.phone || '',
        isDefault: address.isDefault || false
      }));

      await CustomerAddress.bulkCreate(customerAddresses);
    }

    // 获取更新后的客户信息
    const updatedCustomer = await Customer.findByPk(id, {
      include: [
        { model: CustomerContact, as: 'contacts' },
        { model: CustomerAddress, as: 'addresses' }
      ]
    });

    res.json({
      success: true,
      data: updatedCustomer,
      message: '客户信息更新成功'
    });
  } catch (error) {
    console.error('更新客户失败:', error);
    res.status(500).json({
      success: false,
      message: '更新客户失败',
      error: error.message
    });
  }
});

// 删除客户
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    // 检查客户是否有关联订单
    const { SalesOrder } = require('../models');
    const orderCount = await SalesOrder.count({
      where: { customerId: id }
    });

    if (orderCount > 0) {
      // 如果客户有订单，只是标记为不活跃而不是删除
      await customer.update({
        status: 'inactive',
        updatedBy: req.user.id,
        updatedAt: new Date()
      });

      return res.json({
        success: true,
        message: '客户已被停用（因为存在关联订单）'
      });
    }

    // 删除相关数据
    await CustomerContact.destroy({ where: { customerId: id } });
    await CustomerAddress.destroy({ where: { customerId: id } });
    await CustomerOrderHistory.destroy({ where: { customerId: id } });
    await Customer.destroy({ where: { id } });

    res.json({
      success: true,
      message: '客户删除成功'
    });
  } catch (error) {
    console.error('删除客户失败:', error);
    res.status(500).json({
      success: false,
      message: '删除客户失败',
      error: error.message
    });
  }
});

// 获取客户统计信息
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };
    }

    // 获取各类型客户数量
    const typeStats = await Customer.findAll({
      attributes: [
        'type',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: { ...dateFilter, status: 'active' },
      group: ['type'],
      raw: true
    });

    // 获取各等级客户数量
    const levelStats = await Customer.findAll({
      attributes: [
        'level',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: { ...dateFilter, status: 'active' },
      group: ['level'],
      raw: true
    });

    // 获取地区分布
    const regionStats = await Customer.findAll({
      attributes: [
        'region',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: { ...dateFilter, status: 'active' },
      group: ['region'],
      raw: true
    });

    // 获取总客户数
    const totalCustomers = await Customer.count({
      where: { ...dateFilter, status: 'active' }
    });

    res.json({
      success: true,
      data: {
        typeStats,
        levelStats,
        regionStats,
        totalCustomers,
        period: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      }
    });
  } catch (error) {
    console.error('获取客户统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取客户统计失败',
      error: error.message
    });
  }
});

// 获取客户订单历史
router.get('/:id/order-history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10, status } = req.query;

    const whereClause = { customerId: id };
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await CustomerOrderHistory.findAndCountAll({
      where: whereClause,
      order: [['orderDate', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    res.json({
      success: true,
      data: {
        orders: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(count / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取客户订单历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取客户订单历史失败',
      error: error.message
    });
  }
});

// 添加联系人
router.post('/:id/contacts', authenticateToken, requireRole(['sales', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const contactData = req.body;

    // 如果设置为主要联系人，先将其他联系人设为非主要
    if (contactData.isPrimary) {
      await CustomerContact.update(
        { isPrimary: false },
        { where: { customerId: id } }
      );
    }

    const contact = await CustomerContact.create({
      customerId: id,
      ...contactData,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: contact,
      message: '联系人添加成功'
    });
  } catch (error) {
    console.error('添加联系人失败:', error);
    res.status(500).json({
      success: false,
      message: '添加联系人失败',
      error: error.message
    });
  }
});

// 更新联系人
router.put('/:id/contacts/:contactId', authenticateToken, requireRole(['sales', 'admin']), async (req, res) => {
  try {
    const { id, contactId } = req.params;
    const updateData = req.body;

    const contact = await CustomerContact.findOne({
      where: { id: contactId, customerId: id }
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: '联系人不存在'
      });
    }

    // 如果设置为主要联系人，先将其他联系人设为非主要
    if (updateData.isPrimary) {
      await CustomerContact.update(
        { isPrimary: false },
        { where: { customerId: id, id: { [Op.ne]: contactId } } }
      );
    }

    await contact.update({
      ...updateData,
      updatedBy: req.user.id,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      data: contact,
      message: '联系人更新成功'
    });
  } catch (error) {
    console.error('更新联系人失败:', error);
    res.status(500).json({
      success: false,
      message: '更新联系人失败',
      error: error.message
    });
  }
});

// 删除联系人
router.delete('/:id/contacts/:contactId', authenticateToken, requireRole(['sales', 'admin']), async (req, res) => {
  try {
    const { id, contactId } = req.params;

    const contact = await CustomerContact.findOne({
      where: { id: contactId, customerId: id }
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: '联系人不存在'
      });
    }

    await contact.destroy();

    res.json({
      success: true,
      message: '联系人删除成功'
    });
  } catch (error) {
    console.error('删除联系人失败:', error);
    res.status(500).json({
      success: false,
      message: '删除联系人失败',
      error: error.message
    });
  }
});

// 导出客户列表
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const {
      format = 'excel',
      type,
      level,
      region,
      status
    } = req.query;

    const whereClause = {};
    
    if (type) {
      whereClause.type = type;
    }
    
    if (level) {
      whereClause.level = level;
    }
    
    if (region) {
      whereClause.region = region;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const customers = await Customer.findAll({
      where: whereClause,
      include: [
        {
          model: CustomerContact,
          as: 'contacts',
          where: { isPrimary: true },
          required: false
        },
        {
          model: CustomerAddress,
          as: 'addresses',
          where: { isDefault: true },
          required: false
        }
      ],
      order: [['code', 'ASC']]
    });

    // 这里应该根据format参数生成对应的文件
    // 暂时返回JSON格式的数据
    res.json({
      success: true,
      data: {
        customers,
        exportFormat: format,
        exportedAt: new Date(),
        totalRecords: customers.length
      },
      message: '客户数据导出成功'
    });
  } catch (error) {
    console.error('导出客户失败:', error);
    res.status(500).json({
      success: false,
      message: '导出客户失败',
      error: error.message
    });
  }
});

// 获取客户统计信息的辅助函数
async function getCustomerStats(customerId) {
  const { SalesOrder } = require('../models');
  
  const orderStats = await SalesOrder.findAll({
    attributes: [
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalOrders'],
      [require('sequelize').fn('SUM', require('sequelize').col('totalAmount')), 'totalAmount'],
      [require('sequelize').fn('AVG', require('sequelize').col('totalAmount')), 'avgOrderValue']
    ],
    where: { customerId },
    raw: true
  });

  const recentOrders = await SalesOrder.count({
    where: {
      customerId,
      orderDate: {
        [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 最近90天
      }
    }
  });

  return {
    totalOrders: orderStats[0]?.totalOrders || 0,
    totalAmount: orderStats[0]?.totalAmount || 0,
    avgOrderValue: orderStats[0]?.avgOrderValue || 0,
    recentOrders
  };
}

// 生成客户编号的辅助函数
function generateCustomerCode() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CUS${year}${month}${day}${random}`;
}

module.exports = router;