const express = require('express');
const XLSX = require('xlsx');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const bomImportService = require('../services/bomImportService');

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, `${timestamp}-${originalName}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // 只允许Excel文件
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('只支持Excel文件（.xlsx, .xls）'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  }
});

/**
 * BOM数据导入
 * POST /api/bom-import/import
 */
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请选择要导入的文件'
      });
    }

    const skipDuplicates = req.body.skipDuplicates === 'true';
    const filePath = req.file.path;

    // 读取Excel文件
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // 调用服务处理导入
    const result = await bomImportService.importBOMData(jsonData, {
      skipDuplicates,
      userId: req.user?.id || 'system'
    });

    // 清理临时文件
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('清理临时文件失败:', error.message);
    }

    res.json({
      code: 200,
      message: '导入成功',
      data: result
    });

  } catch (error) {
    console.error('BOM导入失败:', error);
    
    // 清理临时文件
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('清理临时文件失败:', cleanupError.message);
      }
    }

    res.status(500).json({
      code: 500,
      message: error.message || '导入失败'
    });
  }
});

/**
 * BOM数据导出
 * GET /api/bom-import/export
 */
router.get('/export', async (req, res) => {
  try {
    const { bomIds, format = 'excel' } = req.query;

    // 调用服务处理导出
    const result = await bomImportService.exportBOMData(bomIds ? bomIds.split(',') : null);

    if (format === 'excel') {
      // 创建Excel工作簿
      const wb = XLSX.utils.book_new();
      
      // 创建BOM主表
      const bomSheet = XLSX.utils.json_to_sheet(result.bomData);
      XLSX.utils.book_append_sheet(wb, bomSheet, 'BOM主表');

      // 如果有子件数据，创建子件表
      if (result.childrenData && result.childrenData.length > 0) {
        const childrenSheet = XLSX.utils.json_to_sheet(result.childrenData);
        XLSX.utils.book_append_sheet(wb, childrenSheet, 'BOM子件');
      }

      // 生成Excel文件
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      const filename = `生产BOM导出_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.send(excelBuffer);
    } else {
      // JSON格式导出
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent('生产BOM导出.json')}"`);
      res.json(result);
    }

  } catch (error) {
    console.error('BOM导出失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '导出失败'
    });
  }
});

/**
 * 导入模板下载
 * GET /api/bom-import/template
 */
router.get('/template', async (req, res) => {
  try {
    const templateData = await bomImportService.generateImportTemplate();
    
    // 创建Excel工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'BOM导入模板');

    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `BOM导入模板_${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(excelBuffer);

  } catch (error) {
    console.error('生成导入模板失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '生成模板失败'
    });
  }
});

/**
 * 导入数据预览
 * POST /api/bom-import/preview
 */
router.post('/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请选择要预览的文件'
      });
    }

    const filePath = req.file.path;

    // 读取Excel文件
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // 调用服务进行预览分析
    const preview = await bomImportService.previewImportData(jsonData);

    // 清理临时文件
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('清理临时文件失败:', error.message);
    }

    res.json({
      code: 200,
      message: '预览成功',
      data: preview
    });

  } catch (error) {
    console.error('导入预览失败:', error);
    
    // 清理临时文件
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('清理临时文件失败:', cleanupError.message);
      }
    }

    res.status(500).json({
      code: 500,
      message: error.message || '预览失败'
    });
  }
});

/**
 * 验证导入数据
 * POST /api/bom-import/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!Array.isArray(data)) {
      return res.status(400).json({
        code: 400,
        message: '数据格式不正确'
      });
    }

    const validation = await bomImportService.validateImportData(data);

    res.json({
      code: 200,
      message: '验证完成',
      data: validation
    });

  } catch (error) {
    console.error('数据验证失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '验证失败'
    });
  }
});

module.exports = router;
