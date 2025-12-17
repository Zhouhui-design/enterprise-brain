const express = require('express');
const router = express.Router();

// 简单的测试路由
router.get('/', (req, res) => {
  console.log('测试仓库路由被调用');
  res.json({
    success: true,
    message: '仓库列表',
    data: [
      { id: 1, name: '测试仓库', code: 'TEST001' }
    ]
  });
});

module.exports = router;