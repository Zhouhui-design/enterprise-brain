const express = require('express')
const router = express.Router()
const multer = require('multer')
const XLSX = require('xlsx')
const BOMImportService = require('../services/bomImportService')
const BOMService = require('../services/bomService')

// 配置文件上传
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许Excel文件
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true)
    } else {
      cb(new Error('只支持Excel文件格式(.xlsx, .xls)'))
    }
  }
})

/**
 * 获取导入模板
 */
router.get('/template', (req, res) => {
  try {
    const template = BOMImportService.getImportTemplate()
    res.json({
      code: 200,
      data: template,
      message: '获取导入模板成功'
    })
  } catch (error) {
    console.error('获取导入模板失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message
    })
  }
})

/**
 * 预览导入数据
 */
router.post('/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请上传Excel文件'
      })
    }

    console.log('📁 收到文件:', req.file.originalname)
    console.log('📊 文件大小:', (req.file.size / 1024).toFixed(2), 'KB')

    // 读取Excel文件
    const workbook = XLSX.readFile(req.file.path)
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    console.log('📋 解析数据行数:', jsonData.length)

    if (jsonData.length === 0) {
      return res.status(400).json({
        code: 400,
        message: 'Excel文件中没有数据'
      })
    }

    // 预览数据
    const preview = await BOMImportService.previewImport(jsonData)
    
    console.log('✅ 预览完成:', {
      total: preview.totalCount,
      valid: preview.validCount,
      errors: preview.errors.length,
      warnings: preview.warnings.length
    })

    // 删除临时文件
    require('fs').unlinkSync(req.file.path)

    res.json({
      code: 200,
      data: preview,
      message: '预览成功'
    })
  } catch (error) {
    console.error('预览导入失败:', error)
    
    // 删除临时文件
    if (req.file && require('fs').existsSync(req.file.path)) {
      require('fs').unlinkSync(req.file.path)
    }

    res.status(500).json({
      code: 500,
      message: error.message
    })
  }
})

/**
 * 执行导入
 */
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请上传Excel文件'
      })
    }

    const options = {
      skipDuplicates: req.body.skipDuplicates === 'true'
    }

    console.log('📁 开始导入:', req.file.originalname)
    console.log('🔧 导入选项:', options)

    // 读取Excel文件
    const workbook = XLSX.readFile(req.file.path)
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    console.log('📋 解析数据行数:', jsonData.length)

    if (jsonData.length === 0) {
      return res.status(400).json({
        code: 400,
        message: 'Excel文件中没有数据'
      })
    }

    // 执行导入
    const result = await BOMImportService.batchImportBOMs(jsonData, options)
    
    console.log('✅ 导入完成:', result)

    // 删除临时文件
    require('fs').unlinkSync(req.file.path)

    res.json({
      code: 200,
      data: result,
      message: '导入完成'
    })
  } catch (error) {
    console.error('导入失败:', error)
    
    // 删除临时文件
    if (req.file && require('fs').existsSync(req.file.path)) {
      require('fs').unlinkSync(req.file.path)
    }

    res.status(500).json({
      code: 500,
      message: error.message
    })
  }
})

/**
 * 导出BOM数据
 */
router.post('/export', async (req, res) => {
  try {
    const { bomIds, includeChildren, includeTemplate } = req.body
    console.log('📤 开始导出BOM:', { bomIds, includeChildren, includeTemplate })

    let bomList
    
    if (bomIds && bomIds.length > 0) {
      // 导出选定的BOM
      bomList = []
      for (const id of bomIds) {
        const bom = await BOMService.getBOMById(id)
        if (bom) {
          bomList.push(bom)
        }
      }
    } else {
      // 导出所有BOM
      bomList = await BOMService.getAllProductionBOMs()
    }

    if (!bomList || bomList.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '没有数据可导出'
      })
    }

    const options = {
      includeChildren: includeChildren === 'true',
      includeTemplate: includeTemplate === 'true'
    }

    const exportResult = await BOMImportService.exportToExcel(bomList, options)
    
    console.log('✅ 导出完成:', exportResult)

    res.json({
      code: 200,
      data: exportResult,
      message: '导出成功'
    })
  } catch (error) {
    console.error('导出失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message
    })
  }
})

/**
 * 下载导出文件
 */
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename
    const filePath = `./${filename}`
    
    // 检查文件是否存在
    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json({
        code: 404,
        message: '文件不存在'
      })
    }

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    
    // 发送文件
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('文件下载失败:', err)
        res.status(500).json({
          code: 500,
          message: '文件下载失败'
        })
      } else {
        // 下载完成后删除文件
        setTimeout(() => {
          require('fs').unlinkSync(filePath)
        }, 5000)
      }
    })
  } catch (error) {
    console.error('下载文件失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message
    })
  }
})

module.exports = router
