const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// 生成BOM树结构数据
router.post('/generate', (req, res) => {
  try {
    const { bomData } = req.body;

    if (!bomData || !bomData.bomCode) {
      return res.status(400).json({
        success: false,
        message: 'BOM数据不完整',
      });
    }

    // 构建树结构数据
    const treeData = buildBomTreeData(bomData);

    // 检查是否已存在
    const existing = pool.prepare('SELECT id FROM bom_tree_structures WHERE bom_code = ?').get(bomData.bomCode);

    if (existing) {
      // 更新现有记录
      const stmt = pool.prepare(`
        UPDATE bom_tree_structures
        SET bom_name = ?,
            product_code = ?,
            product_name = ?,
            version = ?,
            status = ?,
            max_level = ?,
            tree_data = ?,
            update_time = CURRENT_TIMESTAMP
        WHERE bom_code = ?
      `);

      stmt.run(
        bomData.bomName,
        bomData.productCode,
        bomData.productName,
        bomData.version,
        bomData.status,
        treeData.maxLevel,
        JSON.stringify(treeData),
        bomData.bomCode,
      );

      return res.json({
        success: true,
        message: 'BOM树结构更新成功',
        data: { id: existing.id, ...treeData },
      });
    } else {
      // 创建新记录
      const id = uuidv4();
      const stmt = pool.prepare(`
        INSERT INTO bom_tree_structures (
          id, bom_code, bom_name, product_code, product_name,
          version, status, max_level, tree_data, create_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        bomData.bomCode,
        bomData.bomName,
        bomData.productCode,
        bomData.productName,
        bomData.version,
        bomData.status,
        treeData.maxLevel,
        JSON.stringify(treeData),
        'admin',
      );

      return res.json({
        success: true,
        message: 'BOM树结构生成成功',
        data: { id, ...treeData },
      });
    }
  } catch (error) {
    console.error('生成BOM树结构失败:', error);
    res.status(500).json({
      success: false,
      message: '生成BOM树结构失败: ' + error.message,
    });
  }
});

// 获取BOM树结构
router.get('/:bomCode', (req, res) => {
  try {
    const { bomCode } = req.params;

    const stmt = pool.prepare('SELECT * FROM bom_tree_structures WHERE bom_code = ?');
    const record = stmt.get(bomCode);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'BOM树结构不存在',
      });
    }

    // 解析tree_data
    const treeData = JSON.parse(record.tree_data);

    res.json({
      success: true,
      data: {
        id: record.id,
        bomCode: record.bom_code,
        bomName: record.bom_name,
        productCode: record.product_code,
        productName: record.product_name,
        version: record.version,
        status: record.status,
        maxLevel: record.max_level,
        treeData: treeData,
        createTime: record.create_time,
        updateTime: record.update_time,
      },
    });
  } catch (error) {
    console.error('获取BOM树结构失败:', error);
    res.status(500).json({
      success: false,
      message: '获取BOM树结构失败: ' + error.message,
    });
  }
});

// 获取所有BOM树结构列表
router.get('/', (req, res) => {
  try {
    const stmt = pool.prepare('SELECT * FROM bom_tree_structures ORDER BY create_time DESC');
    const records = stmt.all();

    const list = records.map(record => ({
      id: record.id,
      bomCode: record.bom_code,
      bomName: record.bom_name,
      productCode: record.product_code,
      productName: record.product_name,
      version: record.version,
      status: record.status,
      maxLevel: record.max_level,
      createTime: record.create_time,
      updateTime: record.update_time,
    }));

    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error('获取BOM树结构列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取BOM树结构列表失败: ' + error.message,
    });
  }
});

// 删除BOM树结构
router.delete('/:bomCode', (req, res) => {
  try {
    const { bomCode } = req.params;

    const stmt = pool.prepare('DELETE FROM bom_tree_structures WHERE bom_code = ?');
    const result = stmt.run(bomCode);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'BOM树结构不存在',
      });
    }

    res.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除BOM树结构失败:', error);
    res.status(500).json({
      success: false,
      message: '删除失败: ' + error.message,
    });
  }
});

// 构建BOM树结构数据
function buildBomTreeData(bomData) {
  const { productCode, productName, itemCount, childItems = [] } = bomData;

  // 计算最大层级
  let maxLevel = 0;
  if (childItems.length > 0) {
    maxLevel = Math.max(...childItems.map(item => parseInt(item.level) || 0));
  }

  // 按层级分组子件
  const levelMap = {};
  for (let i = 0; i <= maxLevel; i++) {
    levelMap[`L${i}`] = [];
  }

  // L0是产品本身
  levelMap.L0 = [
    {
      code: productCode,
      name: productName,
      quantity: itemCount || 1,
      processName: '',
    },
  ];

  // 分组子件到各层级
  childItems.forEach(item => {
    const level = parseInt(item.level) || 1;
    const levelKey = `L${level}`;

    if (!levelMap[levelKey]) {
      levelMap[levelKey] = [];
    }

    levelMap[levelKey].push({
      code: item.childCode,
      name: item.childName,
      quantity: item.standardQty || 0,
      processName: item.outputProcess || '',
    });
  });

  return {
    maxLevel,
    levels: levelMap,
  };
}

module.exports = router;
