const express = require('express');
const router = express.Router();

// 模拟产品数据
let products = [
  {
    id: 1,
    name: '传感器A1',
    code: 'PRD20251230001',
    categoryId: 1,
    categoryName: '传感器类',
    description: '高精度压力传感器',
    specifications: '精度:±0.1%FSO',
    unit: '个',
    unitPrice: 150.00,
    costPrice: 80.00,
    weight: 0.5,
    dimensions: '100*50*20mm',
    barcode: '6901234567890123',
    images: ['/images/sensor1.jpg'],
    status: 'active',
    tags: ['工业', '自动化'],
    stockQuantity: 100,
    reservedQuantity: 10,
    availableQuantity: 90,
    warehouse: '主仓库',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: '电机B2',
    code: 'PRD20251230002',
    categoryId: 2,
    categoryName: '电机类',
    description: '高扭矩步进电机',
    specifications: '步距:1.8°, 扭矩:4.2N·m',
    unit: '台',
    unitPrice: 320.00,
    costPrice: 180.00,
    weight: 2.5,
    dimensions: 'φ60*80mm',
    barcode: '6901234567890124',
    images: ['/images/motor1.jpg'],
    status: 'active',
    tags: ['精密', '定位'],
    stockQuantity: 50,
    reservedQuantity: 5,
    availableQuantity: 45,
    warehouse: '主仓库',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    name: '外壳C3',
    code: 'PRD20251230003',
    categoryId: 3,
    categoryName: '结构件类',
    description: 'ABS塑料防护外壳',
    specifications: 'IP65防护等级',
    unit: '个',
    unitPrice: 45.00,
    costPrice: 25.00,
    weight: 0.8,
    dimensions: '200*150*100mm',
    barcode: '6901234567890125',
    images: ['/images/shell1.jpg'],
    status: 'active',
    tags: ['防护', '结构件'],
    stockQuantity: 200,
    reservedQuantity: 20,
    availableQuantity: 180,
    warehouse: '主仓库',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// 模拟产品分类
let categories = [
  {
    id: 1,
    name: '传感器类',
    description: '各类传感器产品',
    parentId: null,
    productCount: 1
  },
  {
    id: 2,
    name: '电机类',
    description: '各类电机产品',
    parentId: null,
    productCount: 1
  },
  {
    id: 3,
    name: '结构件类',
    description: '各类结构件产品',
    parentId: null,
    productCount: 1
  }
];

// 获取产品列表
router.get('/', (req, res) => {
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

    let filteredProducts = [...products];
    
    // 状态筛选
    if (status) {
      filteredProducts = filteredProducts.filter(product => product.status === status);
    }
    
    // 分类筛选
    if (category) {
      filteredProducts = filteredProducts.filter(product => product.categoryId == category);
    }
    
    // 搜索筛选
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.code.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
      );
    }
    
    // 价格范围筛选
    if (minPrice) {
      filteredProducts = filteredProducts.filter(product => product.unitPrice >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filteredProducts = filteredProducts.filter(product => product.unitPrice <= parseFloat(maxPrice));
    }
    
    // 库存筛选
    if (inStock === 'true') {
      filteredProducts = filteredProducts.filter(product => product.availableQuantity > 0);
    }

    // 排序
    filteredProducts.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const order = sortOrder.toUpperCase() === 'ASC' ? 1 : -1;
      
      if (aValue < bValue) return -1 * order;
      if (aValue > bValue) return 1 * order;
      return 0;
    });

    // 分页
    const total = filteredProducts.length;
    const startIndex = (parseInt(page) - 1) * parseInt(pageSize);
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        products: paginatedProducts,
        pagination: {
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / pageSize)
        }
      },
      message: '获取产品列表成功'
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
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const product = products.find(p => p.id == id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    res.json({
      success: true,
      data: product,
      message: '获取产品详情成功'
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
router.post('/', (req, res) => {
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
      warehouse = '主仓库'
    } = req.body;

    const newProduct = {
      id: Date.now(),
      code: code || `PRD${Date.now()}`,
      name,
      categoryId,
      categoryName: categories.find(c => c.id == categoryId)?.name || '',
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
      stockQuantity,
      reservedQuantity: 0,
      availableQuantity: stockQuantity,
      warehouse,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    products.push(newProduct);

    res.status(201).json({
      success: true,
      data: newProduct,
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
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const index = products.findIndex(p => p.id == id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    // 更新产品信息
    products[index] = {
      ...products[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    // 如果分类发生变化，更新分类名称
    if (updateData.categoryId) {
      products[index].categoryName = categories.find(c => c.id == updateData.categoryId)?.name || '';
    }

    res.json({
      success: true,
      data: products[index],
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
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = products.findIndex(p => p.id == id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    // 如果产品有库存，只是停用而不删除
    if (products[index].availableQuantity > 0) {
      products[index].status = 'inactive';
      products[index].updatedAt = new Date().toISOString();
      
      return res.json({
        success: true,
        message: '产品已停用（因为有库存）'
      });
    }

    // 删除产品
    products.splice(index, 1);

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
router.get('/categories', (req, res) => {
  try {
    res.json({
      success: true,
      data: categories,
      message: '获取产品分类成功'
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
router.post('/categories', (req, res) => {
  try {
    const { name, description, parentId } = req.body;

    const newCategory = {
      id: Date.now(),
      name,
      description,
      parentId,
      productCount: 0,
      createdAt: new Date().toISOString()
    };

    categories.push(newCategory);

    res.status(201).json({
      success: true,
      data: newCategory,
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

module.exports = router;