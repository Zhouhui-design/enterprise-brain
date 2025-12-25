const express = require('express');
const router = express.Router();
const MRPDemandService = require('../services/mrpDemandService');

/**
 * 保存产品需求数据
 */
router.post('/product-demands', async (req, res) => {
  try {
    const { demands } = req.body;

    if (!demands || !Array.isArray(demands)) {
      return res.status(400).json({
        code: 400,
        message: '请求参数错误：demands必须是数组',
      });
    }

    const results = await MRPDemandService.saveProductDemands(demands);

    res.json({
      code: 200,
      data: results,
      message: `成功保存${results.length}条产品需求数据`,
    });
  } catch (error) {
    console.error('保存产品需求失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * 获取所有产品需求数据
 */
router.get('/product-demands', async (req, res) => {
  try {
    const demands = await MRPDemandService.getProductDemands();

    res.json({
      code: 200,
      data: demands,
      message: '获取产品需求成功',
    });
  } catch (error) {
    console.error('获取产品需求失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * 保存物料需求数据
 */
router.post('/material-demands', async (req, res) => {
  try {
    const { demands } = req.body;

    console.log('📥 收到物料需求保存请求:', {
      demandsCount: demands?.length,
      firstItem: demands?.[0],
    });

    if (!demands || !Array.isArray(demands)) {
      return res.status(400).json({
        code: 400,
        message: '请求参数错误：demands必须是数组',
      });
    }

    const results = await MRPDemandService.saveMaterialDemands(demands);

    res.json({
      code: 200,
      data: results,
      message: `成功保存${results.length}条物料需求数据`,
    });
  } catch (error) {
    console.error('❌ 保存物料需求失败:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql,
    });
    res.status(500).json({
      code: 500,
      message: error.message,
      details: error.sql || error.stack,
    });
  }
});

/**
 * 获取所有物料需求数据
 */
router.get('/material-demands', async (req, res) => {
  try {
    const demands = await MRPDemandService.getMaterialDemands();

    res.json({
      code: 200,
      data: demands,
      message: '获取物料需求成功',
    });
  } catch (error) {
    console.error('获取物料需求失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * 删除产品需求
 */
router.delete('/product-demands/:mrpCode', async (req, res) => {
  try {
    const { mrpCode } = req.params;

    await MRPDemandService.deleteProductDemand(mrpCode);

    res.json({
      code: 200,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除产品需求失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * 删除物料需求
 */
router.delete('/material-demands/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await MRPDemandService.deleteMaterialDemand(id);

    res.json({
      code: 200,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除物料需求失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

module.exports = router;
