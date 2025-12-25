const express = require('express');
const router = express.Router();
const productManualService = require('../services/productManualService');

/**
 * 获取所有产品手册
 */
router.get('/', async (req, res) => {
  try {
    // 禁用缓存，确保每次都获取最新数据
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
      Expires: '0',
    });

    const products = await productManualService.getAll();

    // 解析source字段（JSON字符串转数组）
    const processedProducts = products.map(product => ({
      ...product,
      source: typeof product.source === 'string' ? JSON.parse(product.source) : product.source,
      isEnabled: Boolean(product.isEnabled),
    }));

    res.json({
      code: 200,
      data: processedProducts,
      message: '获取成功',
    });
  } catch (error) {
    console.error('获取产品手册列表失败:', error);
    res.status(500).json({
      code: 500,
      message: `获取失败: ${error.message}`,
    });
  }
});

/**
 * 根据ID获取产品手册
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productManualService.getById(id);

    if (!product) {
      return res.status(404).json({
        code: 404,
        message: '产品手册不存在',
      });
    }

    // 解析source字段
    if (typeof product.source === 'string') {
      product.source = JSON.parse(product.source);
    }
    product.isEnabled = Boolean(product.isEnabled);

    res.json({
      code: 200,
      data: product,
      message: '获取成功',
    });
  } catch (error) {
    console.error('获取产品手册详情失败:', error);
    res.status(500).json({
      code: 500,
      message: `获取失败: ${error.message}`,
    });
  }
});

/**
 * 创建产品手册
 */
router.post('/', async (req, res) => {
  try {
    const productData = req.body;

    console.log('📝 创建产品手册请求:', {
      productCode: productData.productCode,
      productName: productData.productName,
    });

    // 检查产品编号是否已存在
    const existing = await productManualService.getByProductCode(productData.productCode);

    if (existing) {
      console.log('⚠️ 产品编号已存在:', {
        productCode: productData.productCode,
        existingId: existing.id,
        existingName: existing.productName,
      });

      return res.status(400).json({
        code: 400,
        message: `产品编号 ${productData.productCode} 已存在（ID: ${existing.id}, 名称: ${existing.productName}）`,
        data: {
          existingProduct: {
            id: existing.id,
            productCode: existing.productCode,
            productName: existing.productName,
          },
        },
      });
    }

    console.log('✅ 产品编号不存在，开始创建...');
    const insertId = await productManualService.create(productData);

    console.log('✅ 产品手册创建成功:', { id: insertId, productCode: productData.productCode });

    // 获取刚创建的产品完整数据
    const createdProduct = await productManualService.getById(insertId);

    // 解析source字段
    if (createdProduct && typeof createdProduct.source === 'string') {
      createdProduct.source = JSON.parse(createdProduct.source);
    }

    res.json({
      code: 200,
      data: createdProduct, // 返回完整产品数据
      message: '创建成功',
    });
  } catch (error) {
    console.error('❌ 创建产品手册失败:', error);
    res.status(500).json({
      code: 500,
      message: `创建失败: ${error.message}`,
    });
  }
});

/**
 * 更新产品手册
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;

    const success = await productManualService.update(id, productData);

    if (!success) {
      return res.status(404).json({
        code: 404,
        message: '产品手册不存在',
      });
    }

    res.json({
      code: 200,
      data: null,
      message: '更新成功',
    });
  } catch (error) {
    console.error('更新产品手册失败:', error);
    res.status(500).json({
      code: 500,
      message: `更新失败: ${error.message}`,
    });
  }
});

/**
 * 删除产品手册
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const success = await productManualService.delete(id);

    if (!success) {
      return res.status(404).json({
        code: 404,
        message: '产品手册不存在',
      });
    }

    res.json({
      code: 200,
      data: null,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除产品手册失败:', error);
    res.status(500).json({
      code: 500,
      message: `删除失败: ${error.message}`,
    });
  }
});

/**
 * 批量删除产品手册
 */
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供要删除的ID列表',
      });
    }

    const affectedRows = await productManualService.batchDelete(ids);

    res.json({
      code: 200,
      data: { deletedCount: affectedRows },
      message: `成功删除${affectedRows}条记录`,
    });
  } catch (error) {
    console.error('批量删除产品手册失败:', error);
    res.status(500).json({
      code: 500,
      message: `批量删除失败: ${error.message}`,
    });
  }
});

module.exports = router;
