const express = require('express');
const router = express.Router();

// 模拟销售订单数据
let salesOrders = [
  {
    id: 1,
    orderNumber: 'SO202512001',
    customerName: '客户A',
    contactPerson: '张经理',
    contactPhone: '13800138000',
    deliveryAddress: '北京市朝阳区XXX街道XXX号',
    deliveryDate: '2025-12-25',
    status: '已确认',
    totalAmount: 12500.00,
    paidAmount: 12500.00,
    products: [
      {
        productId: 1,
        productName: '传感器A1',
        quantity: 50,
        unitPrice: 150.00,
        totalPrice: 7500.00
      },
      {
        productId: 2,
        productName: '电机B2',
        quantity: 25,
        unitPrice: 200.00,
        totalPrice: 5000.00
      }
    ],
    createdTime: new Date().toISOString(),
    updateTime: new Date().toISOString()
  },
  {
    id: 2,
    orderNumber: 'SO202512002',
    customerName: '客户B',
    contactPerson: '李经理',
    contactPhone: '13900139000',
    deliveryAddress: '上海市浦东新区XXX路XXX号',
    deliveryDate: '2025-12-28',
    status: '生产中',
    totalAmount: 32000.00,
    paidAmount: 16000.00,
    products: [
      {
        productId: 3,
        productName: '外壳C3',
        quantity: 100,
        unitPrice: 120.00,
        totalPrice: 12000.00
      },
      {
        productId: 1,
        productName: '传感器A1',
        quantity: 30,
        unitPrice: 150.00,
        totalPrice: 4500.00
      }
    ],
    createdTime: new Date().toISOString(),
    updateTime: new Date().toISOString()
  }
];

// 获取销售订单列表
router.get('/', (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      status,
      customerName,
      orderNumber,
      startDate,
      endDate,
      sortBy = 'createdTime',
      sortOrder = 'DESC'
    } = req.query;

    let filteredOrders = [...salesOrders];
    
    // 状态筛选
    if (status) {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    // 客户名称筛选
    if (customerName) {
      const searchLower = customerName.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order.customerName.toLowerCase().includes(searchLower)
      );
    }
    
    // 订单号筛选
    if (orderNumber) {
      const searchLower = orderNumber.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order.orderNumber.toLowerCase().includes(searchLower)
      );
    }
    
    // 日期范围筛选
    if (startDate) {
      const start = new Date(startDate);
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.deliveryDate) >= start
      );
    }
    if (endDate) {
      const end = new Date(endDate);
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.deliveryDate) <= end
      );
    }

    // 排序
    filteredOrders.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const order = sortOrder.toUpperCase() === 'ASC' ? 1 : -1;
      
      if (aValue < bValue) return -1 * order;
      if (aValue > bValue) return 1 * order;
      return 0;
    });

    // 分页
    const total = filteredOrders.length;
    const startIndex = (parseInt(page) - 1) * parseInt(pageSize);
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        orders: paginatedOrders,
        pagination: {
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / pageSize)
        }
      },
      message: '获取销售订单列表成功'
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
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const order = salesOrders.find(order => order.id == id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    res.json({
      success: true,
      data: order,
      message: '获取订单详情成功'
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
router.post('/', (req, res) => {
  try {
    const {
      customerName,
      contactPerson,
      contactPhone,
      deliveryAddress,
      deliveryDate,
      products,
      status = '待确认'
    } = req.body;

    if (!customerName || !products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: '客户名称和产品列表不能为空'
      });
    }

    // 计算总金额
    let totalAmount = 0;
    products.forEach(product => {
      const totalPrice = (product.quantity || 0) * (product.unitPrice || 0);
      product.totalPrice = totalPrice;
      totalAmount += totalPrice;
    });

    const newOrder = {
      id: Date.now(),
      orderNumber: `SO${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Date.now()).slice(-3)}`,
      customerName,
      contactPerson,
      contactPhone,
      deliveryAddress,
      deliveryDate,
      totalAmount,
      paidAmount: 0,
      status,
      products,
      createdTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    };

    salesOrders.push(newOrder);

    res.status(201).json({
      success: true,
      data: newOrder,
      message: '创建销售订单成功'
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
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const index = salesOrders.findIndex(order => order.id == id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 如果更新产品，重新计算总金额
    if (updateData.products) {
      let totalAmount = 0;
      updateData.products.forEach(product => {
        const totalPrice = (product.quantity || 0) * (product.unitPrice || 0);
        product.totalPrice = totalPrice;
        totalAmount += totalPrice;
      });
      updateData.totalAmount = totalAmount;
    }

    salesOrders[index] = {
      ...salesOrders[index],
      ...updateData,
      updateTime: new Date().toISOString()
    };

    res.json({
      success: true,
      data: salesOrders[index],
      message: '更新销售订单成功'
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
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = salesOrders.findIndex(order => order.id == id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 只能删除特定状态的订单
    const order = salesOrders[index];
    if (['已确认', '生产中', '已发货'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: '只能删除待确认或已取消的订单'
      });
    }

    salesOrders.splice(index, 1);

    res.json({
      success: true,
      message: '删除销售订单成功'
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

module.exports = router;