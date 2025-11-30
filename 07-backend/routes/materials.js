const express = require('express');
const router = express.Router();
const MaterialService = require('../../backend/services/materialService');

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
    const result = await MaterialService.createMaterials(materialsData);
    res.json({
      code: 200,
      data: result,
      message: '批量创建物料成功'
    });
  } catch (error) {
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

module.exports = router;