const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { 
  Product, 
  ProductCategory, 
  ProductStock,
  ProductPriceHistory
} = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 获取产品列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      category,
      status,
      search,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const whereClause = {};
    
    // 状态筛选
    if (status) {
      whereClause.status = status;
    } else {
      whereClause.status = 'active'; // 默认只显示激活的产品
    }
    
    // 分类筛选
    if (category) {
      whereClause.categoryId = category;
    }
    
    // 搜索筛选
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // 价格范围筛选
    if (minPrice && maxPrice) {
      whereClause.unitPrice = {
        [Op.between]: [parseFloat(minPrice), parseFloat(maxPrice)]
      };
    } else if (minPrice) {
      whereClause.unitPrice = { [Op.gte]: parseFloat(minPrice) };
    } else if (maxPrice) {
      whereClause.unitPrice = { [Op.lte]: parseFloat(maxPrice) };
    }
    
    // 库存筛选
    if (inStock === 'true') {
      whereClause.stockQuantity = { [Op.gt]: 0 };
    } else if (inStock === 'false') {
      whereClause.stockQuantity = { [Op.lte]: 0 };
    }

    // 构建查询
    const query = {
      where: whereClause,
      include: [
        {
          model: ProductCategory,
          as: 'category',
          attributes: ['id', 'name', 'description']
        },
        {
          model: ProductStock,
          as: 'stock',
          attributes: ['quantity', 'reservedQuantity', 'availableQuantity', 'warehouse']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    };

    const { count, rows } = await Product.findAndCountAll(query);

    res.json({
      success: true,
      data: {
        products: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(count / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取产品列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取产品列表失败',
      error: error.message
    });
  }
});

// 获取产品详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: ProductCategory,
          as: 'category'
        },
        {
          model: ProductStock,
          as: 'stock'
        },
        {
          model: ProductPriceHistory,
          as: 'priceHistory',
          order: [['effectiveDate', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('获取产品详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取产品详情失败',
      error: error.message
    });
  }
});

// 创建产品
router.post('/', authenticateToken, requireRole(['product', 'admin']), async (req, res) => {
  try {
    const {
      name,
      code,
      categoryId,
      description,
      specifications,
      unit,
      unitPrice,
      costPrice,
      weight,
      dimensions,
      barcode,
      images,
      status = 'active',
      tags,
      stockQuantity = 0,
      warehouse = 'main'
    } = req.body;

    // 生成产品编号
    const productCode = code || generateProductCode();

    // 创建产品
    const product = await Product.create({
      code: productCode,
      name,
      categoryId,
      description,
      specifications,
      unit,
      unitPrice,
      costPrice,
      weight,
      dimensions,
      barcode,
      images,
      status,
      tags,
      createdBy: req.user.id
    });

    // 创建库存记录
    await ProductStock.create({
      productId: product.id,
      quantity: stockQuantity,
      reservedQuantity: 0,
      availableQuantity: stockQuantity,
      warehouse,
      lastUpdated: new Date(),
      updatedBy: req.user.id
    });

    // 创建价格历史记录
    await ProductPriceHistory.create({
      productId: product.id,
      price: unitPrice,
      type: 'selling',
      effectiveDate: new Date(),
      reason: '产品创建',
      updatedBy: req.user.id
    });

    if (costPrice && costPrice > 0) {
      await ProductPriceHistory.create({
        productId: product.id,
        price: costPrice,
        type: 'cost',
        effectiveDate: new Date(),
        reason: '产品创建',
        updatedBy: req.user.id
      });
    }

    // 获取完整的产品信息
    const completeProduct = await Product.findByPk(product.id, {
      include: [
        { model: ProductCategory, as: 'category' },
        { model: ProductStock, as: 'stock' }
      ]
    });

    res.status(201).json({
      success: true,
      data: completeProduct,
      message: '产品创建成功'
    });
  } catch (error) {
    console.error('创建产品失败:', error);
    res.status(500).json({
      success: false,
      message: '创建产品失败',
      error: error.message
    });
  }
});

// 更新产品
router.put('/:id', authenticateToken, requireRole(['product', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    const oldUnitPrice = product.unitPrice;
    const oldCostPrice = product.costPrice;

    // 更新产品信息
    await product.update({
      ...updateData,
      updatedBy: req.user.id,
      updatedAt: new Date()
    });

    // 如果价格发生变化，记录价格历史
    if (updateData.unitPrice && updateData.unitPrice !== oldUnitPrice) {
      await ProductPriceHistory.create({
        productId: id,
        price: updateData.unitPrice,
        type: 'selling',
        effectiveDate: new Date(),
        reason: '价格更新',
        updatedBy: req.user.id
      });
    }

    if (updateData.costPrice && updateData.costPrice !== oldCostPrice) {
      await ProductPriceHistory.create({
        productId: id,
        price: updateData.costPrice,
        type: 'cost',
        effectiveDate: new Date(),
        reason: '成本价格更新',
        updatedBy: req.user.id
      });
    }

    // 更新库存
    if (updateData.stockQuantity !== undefined) {
      await ProductStock.update({
        quantity: updateData.stockQuantity,
        availableQuantity: updateData.stockQuantity,
        lastUpdated: new Date(),
        updatedBy: req.user.id
      }, {
        where: { productId: id }
      });
    }

    // 获取更新后的产品信息
    const updatedProduct = await Product.findByPk(id, {
      include: [
        { model: ProductCategory, as: 'category' },
        { model: ProductStock, as: 'stock' }
      ]
    });

    res.json({
      success: true,
      data: updatedProduct,
      message: '产品更新成功'
    });
  } catch (error) {
    console.error('更新产品失败:', error);
    res.status(500).json({
      success: false,
      message: '更新产品失败',
      error: error.message
    });
  }
});

// 删除产品
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    // 检查产品是否被使用
    const { SalesOrderItem } = require('../models');
    const orderItemsCount = await SalesOrderItem.count({
      where: { productId: id }
    });

    if (orderItemsCount > 0) {
      // 如果产品被使用，只是标记为不活跃而不是删除
      await product.update({
        status: 'inactive',
        updatedBy: req.user.id,
        updatedAt: new Date()
      });

      return res.json({
        success: true,
        message: '产品已被停用（因为有订单使用该产品）'
      });
    }

    // 删除相关数据
    await ProductStock.destroy({ where: { productId: id } });
    await ProductPriceHistory.destroy({ where: { productId: id } });
    await Product.destroy({ where: { id } });

    res.json({
      success: true,
      message: '产品删除成功'
    });
  } catch (error) {
    console.error('删除产品失败:', error);
    res.status(500).json({
      success: false,
      message: '删除产品失败',
      error: error.message
    });
  }
});

// 获取产品分类列表
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await ProductCategory.findAll({
      include: [{
        model: Product,
        as: 'products',
        attributes: ['id'],
        required: false
      }],
      order: [['name', 'ASC']]
    });

    // 为每个分类添加产品数量
    const categoriesWithCount = categories.map(category => {
      return {
        ...category.toJSON(),
        productCount: category.products ? category.products.length : 0
      };
    });

    res.json({
      success: true,
      data: categoriesWithCount
    });
  } catch (error) {
    console.error('获取产品分类失败:', error);
    res.status(500).json({
      success: false,
      message: '获取产品分类失败',
      error: error.message
    });
  }
});

// 创建产品分类
router.post('/categories', authenticateToken, requireRole(['product', 'admin']), async (req, res) => {
  try {
    const { name, description, parentId } = req.body;

    const category = await ProductCategory.create({
      name,
      description,
      parentId,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: category,
      message: '产品分类创建成功'
    });
  } catch (error) {
    console.error('创建产品分类失败:', error);
    res.status(500).json({
      success: false,
      message: '创建产品分类失败',
      error: error.message
    });
  }
});

// 获取库存信息
router.get('/stock/info', authenticateToken, async (req, res) => {
  try {
    const {
      productId,
      warehouse,
      lowStock,
      search
    } = req.query;

    const whereClause = {};
    
    if (productId) {
      whereClause.productId = productId;
    }
    
    if (warehouse) {
      whereClause.warehouse = warehouse;
    }
    
    // 低库存筛选
    if (lowStock === 'true') {
      whereClause[Op.and] = [
        { quantity: { [Op.lte]: 10 } },
        { quantity: { [Op.gt]: 0 } }
      ];
    }

    const query = {
      where: whereClause,
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'code', 'unit'],
        where: search ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { code: { [Op.like]: `%${search}%` } }
          ]
        } : undefined
      }],
      order: [['warehouse', 'ASC'], ['quantity', 'ASC']]
    };

    const stocks = await ProductStock.findAll(query);

    res.json({
      success: true,
      data: stocks
    });
  } catch (error) {
    console.error('获取库存信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取库存信息失败',
      error: error.message
    });
  }
});

// 更新库存
router.put('/stock/:productId', authenticateToken, requireRole(['warehouse', 'admin']), async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, operation, warehouse, reason } = req.body;

    const stock = await ProductStock.findOne({
      where: { 
        productId,
        warehouse: warehouse || 'main'
      }
    });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: '库存记录不存在'
      });
    }

    let newQuantity = stock.quantity;
    
    switch (operation) {
      case 'add':
        newQuantity = stock.quantity + quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, stock.quantity - quantity);
        break;
      case 'set':
        newQuantity = quantity;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '无效的操作类型'
        });
    }

    const availableQuantity = newQuantity - stock.reservedQuantity;

    await stock.update({
      quantity: newQuantity,
      availableQuantity,
      lastUpdated: new Date(),
      updatedBy: req.user.id
    });

    // 记录库存变动日志（这里可以扩展为单独的库存日志表）
    console.log(`库存变动: 产品${productId}, 仓库${warehouse}, 操作${operation}, 数量${quantity}, 原因${reason}, 操作人${req.user.id}`);

    res.json({
      success: true,
      data: stock,
      message: '库存更新成功'
    });
  } catch (error) {
    console.error('更新库存失败:', error);
    res.status(500).json({
      success: false,
      message: '更新库存失败',
      error: error.message
    });
  }
});

// 获取产品价格历史
router.get('/:id/price-history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, limit = 50 } = req.query;

    const whereClause = { productId: id };
    if (type) {
      whereClause.type = type;
    }

    const priceHistory = await ProductPriceHistory.findAll({
      where: whereClause,
      order: [['effectiveDate', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: priceHistory
    });
  } catch (error) {
    console.error('获取价格历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取价格历史失败',
      error: error.message
    });
  }
});

// 导出产品列表
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const {
      format = 'excel',
      category,
      status,
      minPrice,
      maxPrice
    } = req.query;

    const whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (category) {
      whereClause.categoryId = category;
    }
    
    if (minPrice && maxPrice) {
      whereClause.unitPrice = {
        [Op.between]: [parseFloat(minPrice), parseFloat(maxPrice)]
      };
    }

    const products = await Product.findAll({
      where: whereClause,
      include: [
        {
          model: ProductCategory,
          as: 'category',
          attributes: ['name']
        },
        {
          model: ProductStock,
          as: 'stock',
          attributes: ['quantity', 'availableQuantity', 'warehouse']
        }
      ],
      order: [['code', 'ASC']]
    });

    // 这里应该根据format参数生成对应的文件
    // 暂时返回JSON格式的数据
    res.json({
      success: true,
      data: {
        products,
        exportFormat: format,
        exportedAt: new Date(),
        totalRecords: products.length
      },
      message: '产品数据导出成功'
    });
  } catch (error) {
    console.error('导出产品失败:', error);
    res.status(500).json({
      success: false,
      message: '导出产品失败',
      error: error.message
    });
  }
});

// 生成产品编号的辅助函数
function generateProductCode() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PRD${year}${month}${day}${random}`;
}

module.exports = router;