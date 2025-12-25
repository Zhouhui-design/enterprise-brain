/**
 * 测试仓库API路由
 */

const express = require('express');
const router = express.Router();

// 简单的测试路由
router.get('/', (req, res) => {
  console.log('🏭 仓库测试API被调用');
  res.json({
    success: true,
    message: '仓库API测试成功',
    data: [{ id: 1, code: 'WH001', name: '测试仓库' }],
  });
});

module.exports = router;
