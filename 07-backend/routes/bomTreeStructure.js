const express = require('express');
const router = express.Router();

// 获取BOM树结构
router.get('/list', (req, res) => {
  try {
    // 模拟BOM树结构数据
    const mockTreeData = [
      {
        id: 1,
        bom_number: 'BOM001',
        product_name: '产品A',
        version: 'v1.0',
        materials: [
          {
            id: 1,
            material_name: '物料A1',
            quantity: 10,
            unit: '个',
            children: [
              {
                id: 2,
                material_name: '物料A1-1',
                quantity: 5,
                unit: '个'
              },
              {
                id: 3,
                material_name: '物料A1-2',
                quantity: 5,
                unit: '个'
              }
            ]
          },
          {
            id: 4,
            material_name: '物料A2',
            quantity: 20,
            unit: '套',
            children: []
          }
        ]
      },
      {
        id: 2,
        bom_number: 'BOM002',
        product_name: '产品B',
        version: 'v1.0',
        materials: [
          {
            id: 5,
            material_name: '物料B1',
            quantity: 15,
            unit: '个',
            children: [
              {
                id: 6,
                material_name: '物料B1-1',
                quantity: 8,
                unit: '个'
              }
            ]
          }
        ]
      }
    ];
    
    res.json({
      code: 200,
      message: '获取BOM树结构成功',
      data: mockTreeData
    });
  } catch (error) {
    console.error('获取BOM树结构失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取BOM树结构失败',
      error: error.message
    });
  }
});

// 根据BOM编号获取树结构
router.get('/detail/:bomNumber', (req, res) => {
  try {
    const { bomNumber } = req.params;
    
    // 模拟数据
    const mockDetail = {
      bom_number: bomNumber,
      product_name: `产品${bomNumber}`,
      version: 'v1.0',
      materials: [
        {
          id: 1,
          material_name: '根物料A',
          quantity: 10,
          unit: '个',
          level: 1,
          parent_id: null,
          children: [
            {
              id: 2,
              material_name: '子物料A1',
              quantity: 5,
              unit: '个',
              level: 2,
              parent_id: 1,
              children: []
            },
            {
              id: 3,
              material_name: '子物料A2',
              quantity: 5,
              unit: '个',
              level: 2,
              parent_id: 1,
              children: []
            }
          ]
        }
      ]
    };
    
    res.json({
      code: 200,
      message: '获取BOM详情成功',
      data: mockDetail
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

module.exports = router;