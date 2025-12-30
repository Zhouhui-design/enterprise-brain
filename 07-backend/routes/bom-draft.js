const express = require('express');
const router = express.Router();

// 获取BOM草稿列表
router.get('/list', (req, res) => {
  try {
    // 模拟数据
    const mockDrafts = [
      {
        id: 1,
        bom_number: 'BOM-DRAFT-001',
        product_name: '测试产品A',
        version: 'v1.0',
        status: '草稿',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        bom_number: 'BOM-DRAFT-002',
        product_name: '测试产品B',
        version: 'v2.0',
        status: '草稿',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    res.json({
      code: 200,
      message: '获取BOM草稿列表成功',
      data: mockDrafts
    });
  } catch (error) {
    console.error('获取BOM草稿列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取BOM草稿列表失败',
      error: error.message
    });
  }
});

// 根据ID获取BOM草稿
router.get('/detail/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // 模拟数据
    const mockDraft = {
      id: parseInt(id),
      bom_number: `BOM-DRAFT-${String(id).padStart(3, '0')}`,
      product_name: `测试产品${String.fromCharCode(64 + parseInt(id))}`,
      version: 'v1.0',
      status: '草稿',
      materials: [
        {
          material_name: '物料A',
          quantity: 10,
          unit: '个'
        },
        {
          material_name: '物料B',
          quantity: 5,
          unit: '套'
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.json({
      code: 200,
      message: '获取BOM草稿详情成功',
      data: mockDraft
    });
  } catch (error) {
    console.error('获取BOM草稿详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取BOM草稿详情失败',
      error: error.message
    });
  }
});

// 创建BOM草稿
router.post('/create', (req, res) => {
  try {
    const { bom_number, product_name, version, materials } = req.body;
    
    const newDraft = {
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
      message: '创建BOM草稿成功',
      data: newDraft
    });
  } catch (error) {
    console.error('创建BOM草稿失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建BOM草稿失败',
      error: error.message
    });
  }
});

// 更新BOM草稿
router.put('/update/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { bom_number, product_name, version, materials, status } = req.body;
    
    const updatedDraft = {
      id: parseInt(id),
      bom_number,
      product_name,
      version: version || 'v1.0',
      status: status || '草稿',
      materials: materials || [],
      updated_at: new Date().toISOString()
    };
    
    res.json({
      code: 200,
      message: '更新BOM草稿成功',
      data: updatedDraft
    });
  } catch (error) {
    console.error('更新BOM草稿失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新BOM草稿失败',
      error: error.message
    });
  }
});

// 删除BOM草稿
router.delete('/delete/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      code: 200,
      message: '删除BOM草稿成功'
    });
  } catch (error) {
    console.error('删除BOM草稿失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除BOM草稿失败',
      error: error.message
    });
  }
});

module.exports = router;