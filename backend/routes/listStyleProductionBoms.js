const express = require('express');
const router = express.Router();
const ListStyleProductionBomService = require('../services/listStyleProductionBomService');

// 获取列表式生产BOM列表
router.get('/list', async (req, res) => {
  try {
    const result = await ListStyleProductionBomService.getListStyleBomList(req.query);
    res.json({
      code: 200,
      data: result,
      message: '获取列表式生产BOM列表成功',
    });
  } catch (error) {
    console.error('获取列表式生产BOM列表失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

// 获取列表式生产BOM详情
router.get('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bom = await ListStyleProductionBomService.getListStyleBomById(id);

    if (!bom) {
      return res.status(404).json({
        code: 404,
        message: '列表式生产BOM不存在',
      });
    }

    res.json({
      code: 200,
      data: bom,
      message: '获取列表式生产BOM详情成功',
    });
  } catch (error) {
    console.error('获取列表式生产BOM详情失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

// 从生产BOM生成列表式BOM
router.post('/generate-from-production-bom/:productionBomId', async (req, res) => {
  try {
    const { productionBomId } = req.params;
    const { mode } = req.body; // 'check', 'replace', 'new'
    console.log(`🔧 收到从生产BOM ${productionBomId} 生成列表式BOM请求, 模式: ${mode || 'check'}`);

    const result = await ListStyleProductionBomService.generateFromProductionBom(productionBomId, mode || 'check');

    // 如果检测到冲突或重复，返回409状态码
    if (!result.success && (result.hasConflict || result.hasDuplicate)) {
      return res.status(409).json({
        code: 409,
        data: result,
        message: result.message,
      });
    }

    res.json({
      code: 200,
      data: result,
      message: '从生产BOM生成列表式BOM成功',
    });
  } catch (error) {
    console.error('从生产BOM生成列表式BOM失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

// 创建列表式生产BOM
router.post('/create', async (req, res) => {
  try {
    console.log('收到创建列表式生产BOM请求:', JSON.stringify(req.body, null, 2));
    const result = await ListStyleProductionBomService.createListStyleBom(req.body);
    console.log('列表式生产BOM创建成功:', result.id);
    res.json({
      code: 200,
      data: result,
      message: '创建列表式生产BOM成功',
    });
  } catch (error) {
    console.error('创建列表式生产BOM失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

// 更新列表式生产BOM
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`收到更新列表式生产BOM请求, ID: ${id}`);
    const result = await ListStyleProductionBomService.updateListStyleBom(id, req.body);
    res.json({
      code: 200,
      data: result,
      message: '更新列表式生产BOM成功',
    });
  } catch (error) {
    console.error('更新列表式生产BOM失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

// 删除列表式生产BOM
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('收到删除列表式生产BOM请求, ID:', id);
    const success = await ListStyleProductionBomService.deleteListStyleBom(id);

    if (success) {
      console.log('列表式生产BOM删除成功, ID:', id);
      res.json({
        code: 200,
        message: '删除列表式生产BOM成功',
      });
    } else {
      console.log('列表式生产BOM不存在, ID:', id);
      res.status(404).json({
        code: 404,
        message: '列表式生产BOM不存在',
      });
    }
  } catch (error) {
    console.error('删除列表式生产BOM失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

// 批量删除列表式生产BOM
router.delete('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    console.log('收到批量删除列表式生产BOM请求, IDs:', ids);
    const result = await ListStyleProductionBomService.batchDeleteListStyleBom(ids);
    console.log(`批量删除完成，影响行数: ${result}`);
    res.json({
      code: 200,
      data: { deletedCount: result },
      message: '批量删除列表式生产BOM成功',
    });
  } catch (error) {
    console.error('批量删除列表式生产BOM失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

// 修复子件来源字段
router.post('/fix-component-source', async (req, res) => {
  try {
    console.log('🔧 开始修复子件来源字段...');
    const result = await ListStyleProductionBomService.fixComponentSource();
    console.log('✅ 子件来源字段修复完成:', result);
    res.json({
      code: 200,
      data: result,
      message: '修复子件来源字段成功',
    });
  } catch (error) {
    console.error('修复子件来源字段失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

// ✅ 根据父件编号查询BOM子件
router.get('/children-by-parent', async (req, res) => {
  try {
    const { parentCode } = req.query;
    console.log('收到查询BOM子件请求, 父件编号:', parentCode);

    if (!parentCode) {
      return res.status(400).json({
        code: 400,
        message: '父件编号不能为空',
      });
    }

    const children = await ListStyleProductionBomService.getChildrenByParentCode(parentCode);

    res.json({
      code: 200,
      data: children,
      message: '查询BOM子件成功',
    });
  } catch (error) {
    console.error('查询BOM子件失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

module.exports = router;
