const express = require('express');
const router = express.Router();
const MaterialService = require('../services/materialService');

// 获取所有物料
router.get('/list', async (req, res) => {
  try {
    const materials = await MaterialService.getAllMaterials();
    res.json({
      code: 200,
      data: materials,
      message: '获取物料列表成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 创建物料
router.post('/create', async (req, res) => {
  try {
    const materialData = req.body;
    const result = await MaterialService.createMaterial(materialData);
    res.json({
      code: 200,
      data: result,
      message: '创建物料成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 批量创建物料
router.post('/batch-create', async (req, res) => {
  try {
    const materialsData = req.body;
    console.log(`收到批量创建请求，数据条数: ${materialsData.length}`);
    console.log('第一条数据示例:', JSON.stringify(materialsData[0], null, 2));
    
    const result = await MaterialService.createMaterials(materialsData);
    console.log('批量创建结果:', result);
    
    res.json({
      code: 200,
      data: result,
      message: '批量创建物料成功'
    });
  } catch (error) {
    console.error('批量创建失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 更新物料
router.put('/update/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const materialData = req.body;
    const result = await MaterialService.updateMaterial(id, materialData);
    res.json({
      code: 200,
      data: result,
      message: '更新物料成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 删除物料
router.delete('/delete/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await MaterialService.deleteMaterial(id);
    res.json({
      code: 200,
      data: result,
      message: '删除物料成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 批量删除物料
router.delete('/batch-delete', async (req, res) => {
  try {
    const ids = req.body.ids;
    const result = await MaterialService.deleteMaterials(ids);
    res.json({
      code: 200,
      data: result,
      message: '批量删除物料成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 搜索物料
router.get('/search', async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const materials = await MaterialService.searchMaterials(keyword);
    res.json({
      code: 200,
      data: materials,
      message: '搜索物料成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 根据物料编码获取物料
router.get('/by-code/:materialCode', async (req, res) => {
  try {
    const materialCode = req.params.materialCode;
    const material = await MaterialService.getMaterialByCode(materialCode);
    
    if (!material) {
      return res.status(404).json({
        code: 404,
        message: `未找到物料编码: ${materialCode}`
      });
    }
    
    res.json({
      code: 200,
      data: material,
      message: '获取物料成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 测试根路由
router.get('/', (req, res) => {
  res.json({
    code: 200,
    message: 'Materials API is working',
    routes: [
      '/list',
      '/by-code/:materialCode',
      '/create',
      '/update/:id',
      '/delete/:id'
    ]
  });
});

module.exports = router;