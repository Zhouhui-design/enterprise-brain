const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { 
  SalesOrder, 
  Customer, 
  Product, 
  SalesOrderItem,
  DeliverySchedule,
  PaymentTerm,
  User
} = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 获取销售订单列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      status,
      customerType,
      customerName,
      orderNumber,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const whereClause = {};
    
    // 状态筛选
    if (status) {
      whereClause.status = status;
    }
    
    // 订单编号筛选
    if (orderNumber) {
      whereClause.orderNumber = { [Op.like]: `%${orderNumber}%` };
    }
    
    // 日期范围筛选
    if (startDate && endDate) {
      whereClause.orderDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // 构建查询
    const query = {
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'type', 'level', 'contactPerson', 'phone'],
          where: customerType ? { type: customerType } : undefined
        },
        {
          model: User,
          as: 'salesPerson',
          attributes: ['id', 'name', 'department']
        },
        {
          model: SalesOrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'spec', 'category']
          }]
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    };

    // 客户名称搜索
    if (customerName) {
      if (!query.include[0].where) {
        query.include[0].where = {};
      }
      query.include[0].where.name = { [Op.like]: `%${customerName}%` };
    }

    const { count, rows } = await SalesOrder.findAndCountAll(query);

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
    console.error('获取销售订单列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取销售订单列表失败',
      error: error.message
    });
  }
});

// 获取销售订单详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await SalesOrder.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: User,
          as: 'salesPerson'
        },
        {
          model: SalesOrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product'
          }]
        },
        {
          model: DeliverySchedule,
          as: 'deliverySchedule'
        },
        {
          model: PaymentTerm,
          as: 'paymentTerms'
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '销售订单不存在'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('获取销售订单详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取销售订单详情失败',
      error: error.message
    });
  }
});

// 创建销售订单
router.post('/', authenticateToken, requireRole(['sales', 'admin']), async (req, res) => {
  try {
    const {
      orderType,
      priority,
      customerId,
      salesPersonId,
      items,
      deliverySchedule,
      paymentTerms,
      internalNotes,
      customerNotes,
      specialRequirements,
      attachments
    } = req.body;

    // 生成订单编号
    const orderNumber = generateOrderNumber();

    // 创建销售订单
    const order = await SalesOrder.create({
      orderNumber,
      orderType,
      priority,
      customerId,
      salesPersonId,
      status: 'pending',
      orderDate: new Date(),
      internalNotes,
      customerNotes,
      specialRequirements,
      createdBy: req.user.id
    });

    // 创建订单项目
    if (items && items.length > 0) {
      const orderItems = items.map(item => ({
        salesOrderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        notes: item.notes || '',
        subtotal: item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100)
      }));

      await SalesOrderItem.bulkCreate(orderItems);
    }

    // 创建交付计划
    if (deliverySchedule) {
      await DeliverySchedule.create({
        salesOrderId: order.id,
        deliveryType: deliverySchedule.deliveryType,
        deliveryAddress: deliverySchedule.deliveryAddress,
        deliveryDate: deliverySchedule.deliveryDate,
        shippingMethod: deliverySchedule.shippingMethod,
        deliveryTime: deliverySchedule.deliveryTime,
        scheduleDetails: deliverySchedule,
        requirements: deliverySchedule.requirements,
        notes: deliverySchedule.notes
      });
    }

    // 创建付款条款
    if (paymentTerms) {
      await PaymentTerm.create({
        salesOrderId: order.id,
        paymentMethod: paymentTerms.paymentMethod,
        currency: paymentTerms.currency,
        settlementMethod: paymentTerms.settlementMethod,
        invoiceType: paymentTerms.invoiceType,
        taxRate: paymentTerms.taxRate,
        termsDetails: paymentTerms,
        accountInfo: {
          accountType: paymentTerms.accountType,
          bankName: paymentTerms.bankName,
          accountName: paymentTerms.accountName,
          accountNumber: paymentTerms.accountNumber
        }
      });
    }

    // 获取完整的订单信息
    const completeOrder = await SalesOrder.findByPk(order.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'salesPerson' },
        { model: SalesOrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });

    res.status(201).json({
      success: true,
      data: completeOrder,
      message: '销售订单创建成功'
    });
  } catch (error) {
    console.error('创建销售订单失败:', error);
    res.status(500).json({
      success: false,
      message: '创建销售订单失败',
      error: error.message
    });
  }
});

// 更新销售订单
router.put('/:id', authenticateToken, requireRole(['sales', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const order = await SalesOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '销售订单不存在'
      });
    }

    // 检查订单状态是否允许编辑
    if (['production', 'delivering', 'completed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: '当前状态不允许编辑订单'
      });
    }

    // 更新订单信息
    await order.update({
      ...updateData,
      updatedBy: req.user.id,
      updatedAt: new Date()
    });

    // 如果包含订单项目，先删除旧的，再创建新的
    if (updateData.items) {
      await SalesOrderItem.destroy({ where: { salesOrderId: id } });
      
      const orderItems = updateData.items.map(item => ({
        salesOrderId: id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        notes: item.notes || '',
        subtotal: item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100)
      }));

      await SalesOrderItem.bulkCreate(orderItems);
    }

    // 更新交付计划
    if (updateData.deliverySchedule) {
      await DeliverySchedule.destroy({ where: { salesOrderId: id } });
      await DeliverySchedule.create({
        salesOrderId: id,
        deliveryType: updateData.deliverySchedule.deliveryType,
        deliveryAddress: updateData.deliverySchedule.deliveryAddress,
        deliveryDate: updateData.deliverySchedule.deliveryDate,
        shippingMethod: updateData.deliverySchedule.shippingMethod,
        deliveryTime: updateData.deliverySchedule.deliveryTime,
        scheduleDetails: updateData.deliverySchedule,
        requirements: updateData.deliverySchedule.requirements,
        notes: updateData.deliverySchedule.notes
      });
    }

    // 更新付款条款
    if (updateData.paymentTerms) {
      await PaymentTerm.destroy({ where: { salesOrderId: id } });
      await PaymentTerm.create({
        salesOrderId: id,
        paymentMethod: updateData.paymentTerms.paymentMethod,
        currency: updateData.paymentTerms.currency,
        settlementMethod: updateData.paymentTerms.settlementMethod,
        invoiceType: updateData.paymentTerms.invoiceType,
        taxRate: updateData.paymentTerms.taxRate,
        termsDetails: updateData.paymentTerms,
        accountInfo: {
          accountType: updateData.paymentTerms.accountType,
          bankName: updateData.paymentTerms.bankName,
          accountName: updateData.paymentTerms.accountName,
          accountNumber: updateData.paymentTerms.accountNumber
        }
      });
    }

    // 获取更新后的订单信息
    const updatedOrder = await SalesOrder.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'salesPerson' },
        { model: SalesOrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });

    res.json({
      success: true,
      data: updatedOrder,
      message: '销售订单更新成功'
    });
  } catch (error) {
    console.error('更新销售订单失败:', error);
    res.status(500).json({
      success: false,
      message: '更新销售订单失败',
      error: error.message
    });
  }
});

// 删除销售订单
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const order = await SalesOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '销售订单不存在'
      });
    }

    // 检查订单状态是否允许删除
    if (['production', 'delivering', 'completed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: '当前状态不允许删除订单'
      });
    }

    // 删除相关数据
    await SalesOrderItem.destroy({ where: { salesOrderId: id } });
    await DeliverySchedule.destroy({ where: { salesOrderId: id } });
    await PaymentTerm.destroy({ where: { salesOrderId: id } });
    await SalesOrder.destroy({ where: { id } });

    res.json({
      success: true,
      message: '销售订单删除成功'
    });
  } catch (error) {
    console.error('删除销售订单失败:', error);
    res.status(500).json({
      success: false,
      message: '删除销售订单失败',
      error: error.message
    });
  }
});

// 审批销售订单
router.post('/:id/approve', authenticateToken, requireRole(['manager', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, notes } = req.body;

    const order = await SalesOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '销售订单不存在'
      });
    }

    // 检查订单状态
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '只有待处理的订单才能审批'
      });
    }

    const newStatus = approved ? 'approved' : 'rejected';
    const updatedBy = req.user.id;

    await order.update({
      status: newStatus,
      approvedBy: updatedBy,
      approvedAt: new Date(),
      approvalNotes: notes,
      updatedBy,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      data: order,
      message: `订单${approved ? '审批通过' : '已拒绝'}`
    });
  } catch (error) {
    console.error('审批销售订单失败:', error);
    res.status(500).json({
      success: false,
      message: '审批销售订单失败',
      error: error.message
    });
  }
});

// 批量审批销售订单
router.post('/batch-approve', authenticateToken, requireRole(['manager', 'admin']), async (req, res) => {
  try {
    const { orderIds, approved, notes } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的订单ID列表'
      });
    }

    const newStatus = approved ? 'approved' : 'rejected';
    const updatedBy = req.user.id;

    // 批量更新订单状态
    const [updatedCount] = await SalesOrder.update(
      {
        status: newStatus,
        approvedBy: updatedBy,
        approvedAt: new Date(),
        approvalNotes: notes,
        updatedBy,
        updatedAt: new Date()
      },
      {
        where: {
          id: { [Op.in]: orderIds },
          status: 'pending'
        }
      }
    );

    res.json({
      success: true,
      data: {
        updatedCount,
        totalRequested: orderIds.length
      },
      message: `成功批量处理 ${updatedCount} 个订单`
    });
  } catch (error) {
    console.error('批量审批销售订单失败:', error);
    res.status(500).json({
      success: false,
      message: '批量审批销售订单失败',
      error: error.message
    });
  }
});

// 导出销售订单
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const {
      format = 'excel',
      status,
      startDate,
      endDate,
      orderIds
    } = req.query;

    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (startDate && endDate) {
      whereClause.orderDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    if (orderIds) {
      const ids = Array.isArray(orderIds) ? orderIds : [orderIds];
      whereClause.id = { [Op.in]: ids };
    }

    const orders = await SalesOrder.findAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['name', 'type', 'level', 'contactPerson', 'phone', 'address']
        },
        {
          model: User,
          as: 'salesPerson',
          attributes: ['name', 'department']
        },
        {
          model: SalesOrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['name', 'spec', 'category']
          }]
        }
      ],
      order: [['orderNumber', 'ASC']]
    });

    // 这里应该根据format参数生成对应的文件
    // 暂时返回JSON格式的数据
    res.json({
      success: true,
      data: {
        orders,
        exportFormat: format,
        exportedAt: new Date(),
        totalRecords: orders.length
      },
      message: '订单数据导出成功'
    });
  } catch (error) {
    console.error('导出销售订单失败:', error);
    res.status(500).json({
      success: false,
      message: '导出销售订单失败',
      error: error.message
    });
  }
});

// 获取销售订单统计信息
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        orderDate: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };
    }

    // 获取各状态订单数量
    const statusStats = await SalesOrder.findAll({
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: dateFilter,
      group: ['status'],
      raw: true
    });

    // 获取总订单数和总金额
    const totalStats = await SalesOrder.findOne({
      attributes: [
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalOrders'],
        [require('sequelize').fn('SUM', require('sequelize').col('totalAmount')), 'totalAmount']
      ],
      where: dateFilter,
      include: [{
        model: SalesOrderItem,
        as: 'items',
        attributes: []
      }],
      raw: true
    });

    // 获取客户类型统计
    const customerTypeStats = await SalesOrder.findAll({
      attributes: [],
      where: dateFilter,
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['type'],
        required: true
      }],
      group: ['customer.type'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        statusStats,
        totalStats,
        customerTypeStats,
        period: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      }
    });
  } catch (error) {
    console.error('获取销售订单统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取销售订单统计失败',
      error: error.message
    });
  }
});

// 生成订单编号的辅助函数
function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SO${year}${month}${day}${random}`;
}

module.exports = router;