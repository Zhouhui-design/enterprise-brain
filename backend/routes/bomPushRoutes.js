const express = require('express');
const router = express.Router();
const BomSyncService = require('../services/bomSyncService');

/**
 * 同步所有生产BOM到专用数据库
 */
router.post('/sync-all', async (req, res) => {
  try {
    const result = await BomSyncService.syncAllProductionBoms();
    res.json({
      code: 200,
      data: result,
      message: '同步所有生产BOM成功'
    });
  } catch (error) {
    console.error('同步所有生产BOM失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

/**
 * 同步单个生产BOM到专用数据库
 */
router.post('/sync/:bomId', async (req, res) => {
  try {
    const { bomId } = req.params;
    const result = await BomSyncService.syncSingleBOM(parseInt(bomId));
    res.json({
      code: 200,
      data: result,
      message: '同步单个生产BOM成功'
    });
  } catch (error) {
    console.error('同步单个生产BOM失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

/**
 * 将生产BOM推送到列表式生产BOM
 */
router.post('/push-to-style/:bomId', async (req, res) => {
  try {
    const { bomId } = req.params;
    const result = await BomSyncService.pushToStyleProductionBom(parseInt(bomId));
    res.json({
      code: 200,
      data: result,
      message: '推送到列表式生产BOM成功'
    });
  } catch (error) {
    console.error('推送到列表式生产BOM失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

/**
 * 将生产BOM推送到产品手册
 */
router.post('/push-to-manual/:bomId', async (req, res) => {
  try {
    const { bomId } = req.params;
    const result = await BomSyncService.pushToProductManual(parseInt(bomId));
    res.json({
      code: 200,
      data: result,
      message: '推送到产品手册成功'
    });
  } catch (error) {
    console.error('推送到产品手册失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

/**
 * 推送所有未推送的BOM
 */
router.post('/push-all-pending', async (req, res) => {
  try {
    const result = await BomSyncService.pushAllPendingBoms();
    res.json({
      code: 200,
      data: result,
      message: '推送所有未推送BOM成功'
    });
  } catch (error) {
    console.error('推送所有未推送BOM失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

/**
 * 执行完整的BOM推送流程
 */
router.post('/execute-push/:bomId', async (req, res) => {
  try {
    const { bomId } = req.params;
    const result = await BomSyncService.executeBomPushWorkflow(parseInt(bomId));
    res.json({
      code: 200,
      data: result,
      message: '执行BOM完整推送流程成功'
    });
  } catch (error) {
    console.error('执行BOM完整推送流程失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});

module.exports = router;
