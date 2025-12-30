const express = require('express');
const router = express.Router();

// 获取列表式生产BOM
router.get('/list', (req, res) => {
  try {
    // 模拟数据
    const mockBomList = [
      {
        id: 1,
        bom_number: 'BOM001',
        product_name: '产品A',
        version: 'v1.0',
        status: '已发布',
        materials_count: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        bom_number: 'BOM002',
        product_name: '产品B',
        version: 'v1.0',
        status: '草稿',
        materials_count: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    res.json({
      code: 200,
      message: '获取列表式生产BOM成功',
      data: mockBomList
    });
  } catch (error) {
    console.error('获取列表式生产BOM失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取列表式生产BOM失败',
      error: error.message
    });
  }
});

// 根据ID获取详情
router.get('/detail/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // 模拟数据
    const mockBomDetail = {
      id: parseInt(id),
      bom_number: `BOM${String(id).padStart(3, '0')}`,
      product_name: `产品${String.fromCharCode(64 + parseInt(id))}`,
      version: 'v1.0',
      status: '已发布',
      materials: [
        {
          id: 1,
          material_name: '物料A',
          quantity: 10,
          unit: '个',
          position: 1
        },
        {
          id: 2,
          material_name: '物料B',
          quantity: 5,
          unit: '套',
          position: 2
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.json({
      code: 200,
      message: '获取BOM详情成功',
      data: mockBomDetail
    });
  } catch (error) {
    console.error('获取BOM详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取BOM详情失败',
      error: error.message
    });
  }
});

// 创建列表式生产BOM
router.post('/create', (req, res) => {
  try {
    const { bom_number, product_name, version, materials } = req.body;
    
    const newBom = {
      id: Date.now(),
      bom_number,
      product_name,
      version: version || 'v1.0',
      status: '草稿',
      materials: materials || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.json({
      code: 200,
      message: '创建列表式生产BOM成功',
      data: newBom
    });
  } catch (error) {
    console.error('创建列表式生产BOM失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建列表式生产BOM失败',
      error: error.message
    });
  }
});

module.exports = router;
