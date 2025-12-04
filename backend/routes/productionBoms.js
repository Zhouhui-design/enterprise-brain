const express = require('express');
const router = express.Router();
const BOMService = require('../services/bomService');

// 获取所有生产BOM
router.get('/list', async (req, res) => {
  try {
    const boms = await BOMService.getAllProductionBOMs();
    res.json({
      code: 200,
      data: boms,
      message: '获取生产BOM列表成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 获取单个BOM（包含子件）
router.get('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bom = await BOMService.getBOMById(id);
    
    if (!bom) {
      return res.status(404).json({
        code: 404,
        message: 'BOM不存在'
      });
    }
    
    res.json({
      code: 200,
      data: bom,
      message: '获取BOM详情成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 创建生产BOM
router.post('/create', async (req, res) => {
  try {
    console.log('收到创建BOM请求:', JSON.stringify(req.body, null, 2));
    const bomData = req.body;
    const result = await BOMService.createProductionBOM(bomData);
    console.log('BOM创建成功:', result.id);
    res.json({
      code: 200,
      data: result,
      message: '创建生产BOM成功'
    });
  } catch (error) {
    console.error('创建BOM失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 更新生产BOM
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bomData = req.body;
    console.log(`收到更新BOM请求, ID: ${id}`);
    console.log('更新数据:', JSON.stringify(bomData, null, 2));
    const result = await BOMService.updateProductionBOM(id, bomData);
    res.json({
      code: 200,
      data: result,
      message: '更新生产BOM成功'
    });
  } catch (error) {
    console.error('更新BOM失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 删除生产BOM
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('收到删除BOM请求, ID:', id);
    const success = await BOMService.deleteProductionBOM(id);
    
    if (success) {
      console.log('BOM删除成功, ID:', id);
      res.json({
        code: 200,
        message: '删除生产BOM成功'
      });
    } else {
      console.log('BOM不存在, ID:', id);
      res.status(404).json({
        code: 404,
        message: 'BOM不存在'
      });
    }
  } catch (error) {
    console.error('删除BOM失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

// 批量删除生产BOM
router.delete('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await BOMService.batchDeleteProductionBOMs(ids);
    res.json({
      code: 200,
      data: result,
      message: '批量删除生产BOM成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

module.exports = router;
