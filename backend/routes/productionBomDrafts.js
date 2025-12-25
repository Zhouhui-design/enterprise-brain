const express = require('express');
const router = express.Router();
const BOMDraftService = require('../services/bomDraftService');

// 获取所有草稿
router.get('/list', async (req, res) => {
  try {
    const drafts = await BOMDraftService.getAllDrafts();
    res.json({
      code: 200,
      data: drafts,
      message: '获取草稿列表成功',
    });
  } catch (error) {
    console.error('获取草稿列表失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

// 获取单个草稿（包含子件）
router.get('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const draft = await BOMDraftService.getDraftById(id);

    if (!draft) {
      return res.status(404).json({
        code: 404,
        message: '草稿不存在',
      });
    }

    res.json({
      code: 200,
      data: draft,
      message: '获取草稿详情成功',
    });
  } catch (error) {
    console.error('获取草稿详情失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

// 创建草稿
router.post('/create', async (req, res) => {
  try {
    console.log('收到创建草稿请求');
    const draftData = req.body;
    const result = await BOMDraftService.createDraft(draftData);
    res.json({
      code: 200,
      data: result,
      message: '创建草稿成功',
    });
  } catch (error) {
    console.error('创建草稿失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

// 更新草稿
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('收到更新草稿请求, ID:', id);
    const draftData = req.body;
    const result = await BOMDraftService.updateDraft(id, draftData);
    res.json({
      code: 200,
      data: result,
      message: '更新草稿成功',
    });
  } catch (error) {
    console.error('更新草稿失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

// 删除草稿
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('收到删除草稿请求, ID:', id);
    const success = await BOMDraftService.deleteDraft(id);

    if (success) {
      res.json({
        code: 200,
        message: '删除草稿成功',
      });
    } else {
      res.status(404).json({
        code: 404,
        message: '草稿不存在',
      });
    }
  } catch (error) {
    console.error('删除草稿失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

// 批量删除草稿
router.delete('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    console.log('收到批量删除草稿请求, IDs:', ids);
    const result = await BOMDraftService.batchDeleteDrafts(ids);
    res.json({
      code: 200,
      data: result,
      message: '批量删除草稿成功',
    });
  } catch (error) {
    console.error('批量删除草稿失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

module.exports = router;
