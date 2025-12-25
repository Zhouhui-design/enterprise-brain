const express = require('express');
const router = express.Router();
const MaterialService = require('../services/materialService');

/**
 * @swagger
 * /api/materials/list:
 *   get:
 *     summary: 获取所有物料
 *     tags: [Materials]
 *     responses:
 *       200:
 *         description: 成功获取物料列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: 'integer', example: 200 }
 *                 data: { type: 'array', items: { $ref: '#/components/schemas/Material' } }
 *                 message: { type: 'string', example: '获取物料列表成功' }
 *       500:
 *         $ref: '#/components/responses/500'
 */
router.get('/list', async (req, res) => {
  try {
    const materials = await MaterialService.getAllMaterials();
    res.json({
      code: 200,
      data: materials,
      message: '获取物料列表成功',
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/materials/create:
 *   post:
 *     summary: 创建新物料
 *     tags: [Materials]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Material' }
 *     responses:
 *       200:
 *         description: 成功创建物料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: 'integer', example: 200 }
 *                 data: { type: 'object', properties: { id: { type: 'integer' } } }
 *                 message: { type: 'string', example: '创建物料成功' }
 *       500:
 *         $ref: '#/components/responses/500'
 */
router.post('/create', async (req, res) => {
  try {
    const materialData = req.body;
    const result = await MaterialService.createMaterial(materialData);
    res.json({
      code: 200,
      data: result,
      message: '创建物料成功',
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/materials/batch-create:
 *   post:
 *     summary: 批量创建物料
 *     tags: [Materials]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items: { $ref: '#/components/schemas/Material' }
 *     responses:
 *       200:
 *         description: 成功批量创建物料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: 'integer', example: 200 }
 *                 data: { type: 'object', properties: { successCount: { type: 'integer' }, errorCount: { type: 'integer' }, errors: { type: 'array' } } }
 *                 message: { type: 'string', example: '批量创建物料成功' }
 *       500:
 *         $ref: '#/components/responses/500'
 */
router.post('/batch-create', async (req, res) => {
  try {
    const materialsData = req.body;
    console.log(`收到批量创建请求，数据条数: ${materialsData.length}`);
    console.log('第一条数据示例:', JSON.stringify(materialsData[0], null, 2));

    const result = await MaterialService.createMaterials(materialsData);
    console.log('批量创建结果:', result);

    res.json({
      code: 200,
      data: result,
      message: '批量创建物料成功',
    });
  } catch (error) {
    console.error('批量创建失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/materials/update/{id}:
 *   put:
 *     summary: 更新物料信息
 *     tags: [Materials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *         description: 物料ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Material' }
 *     responses:
 *       200:
 *         description: 成功更新物料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: 'integer', example: 200 }
 *                 data: { type: 'object', properties: { id: { type: 'integer' } } }
 *                 message: { type: 'string', example: '更新物料成功' }
 *       500:
 *         $ref: '#/components/responses/500'
 */
router.put('/update/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const materialData = req.body;
    const result = await MaterialService.updateMaterial(id, materialData);
    res.json({
      code: 200,
      data: result,
      message: '更新物料成功',
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/materials/delete/{id}:
 *   delete:
 *     summary: 删除物料
 *     tags: [Materials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *         description: 物料ID
 *     responses:
 *       200:
 *         description: 成功删除物料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: 'integer', example: 200 }
 *                 data: { type: 'object', properties: { success: { type: 'boolean' } } }
 *                 message: { type: 'string', example: '删除物料成功' }
 *       500:
 *         $ref: '#/components/responses/500'
 */
router.delete('/delete/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await MaterialService.deleteMaterial(id);
    res.json({
      code: 200,
      data: result,
      message: '删除物料成功',
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/materials/batch-delete:
 *   delete:
 *     summary: 批量删除物料
 *     tags: [Materials]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids: { type: 'array', items: { type: 'integer' } }
 *     responses:
 *       200:
 *         description: 成功批量删除物料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: 'integer', example: 200 }
 *                 data: { type: 'object', properties: { successCount: { type: 'integer' }, totalCount: { type: 'integer' } } }
 *                 message: { type: 'string', example: '批量删除物料成功' }
 *       500:
 *         $ref: '#/components/responses/500'
 */
router.delete('/batch-delete', async (req, res) => {
  try {
    const ids = req.body.ids;
    const result = await MaterialService.deleteMaterials(ids);
    res.json({
      code: 200,
      data: result,
      message: '批量删除物料成功',
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/materials/search:
 *   get:
 *     summary: 搜索物料
 *     tags: [Materials]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema: { type: 'string' }
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 成功搜索物料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: 'integer', example: 200 }
 *                 data: { type: 'array', items: { $ref: '#/components/schemas/Material' } }
 *                 message: { type: 'string', example: '搜索物料成功' }
 *       500:
 *         $ref: '#/components/responses/500'
 */
router.get('/search', async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const materials = await MaterialService.searchMaterials(keyword);
    res.json({
      code: 200,
      data: materials,
      message: '搜索物料成功',
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/materials/by-code/{materialCode}:
 *   get:
 *     summary: 根据物料编码获取物料
 *     tags: [Materials]
 *     parameters:
 *       - in: path
 *         name: materialCode
 *         required: true
 *         schema: { type: 'string' }
 *         description: 物料编码
 *     responses:
 *       200:
 *         description: 成功获取物料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: 'integer', example: 200 }
 *                 data: { $ref: '#/components/schemas/Material' }
 *                 message: { type: 'string', example: '获取物料成功' }
 *       404:
 *         description: 未找到物料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: 'integer', example: 404 }
 *                 message: { type: 'string' }
 *       500:
 *         $ref: '#/components/responses/500'
 */
router.get('/by-code/:materialCode', async (req, res) => {
  try {
    const materialCode = req.params.materialCode;
    const material = await MaterialService.getMaterialByCode(materialCode);

    if (!material) {
      return res.status(404).json({
        code: 404,
        message: `未找到物料编码: ${materialCode}`,
      });
    }

    res.json({
      code: 200,
      data: material,
      message: '获取物料成功',
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/materials:
 *   get:
 *     summary: 物料API根路由
 *     tags: [Materials]
 *     responses:
 *       200:
 *         description: Materials API 工作正常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: 'integer', example: 200 }
 *                 message: { type: 'string', example: 'Materials API is working' }
 *                 routes: { type: 'array', items: { type: 'string' } }
 */
router.get('/', (req, res) => {
  res.json({
    code: 200,
    message: 'Materials API is working',
    routes: ['/list', '/by-code/:materialCode', '/create', '/update/:id', '/delete/:id'],
  });
});

module.exports = router;
