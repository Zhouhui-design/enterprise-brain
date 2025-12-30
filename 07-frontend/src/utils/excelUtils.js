/**
 * Excel工具类
 * 提供Excel文件导出和导入功能
 */

/**
 * 导出BOM数据到Excel
 * @param {Array} bomList BOM数据列表
 * @param {Object} options 导出选项
 */
export function exportBOMToExcel(bomList, options = {}) {
  if (!bomList || bomList.length === 0) {
    throw new Error('没有数据可导出')
  }

  // 动态导入XLSX库
  return import('xlsx').then(XLSX => {
    // 创建工作簿
    const workbook = XLSX.utils.book_new()

    // 1. 创建BOM主表数据
    const mainData = bomList.map(bom => ({
      'BOM编号': bom.bomCode || '',
      'BOM名称': bom.bomName || '',
      '产品编码': bom.productCode || '',
      '产品名称': bom.productName || '',
      '版本号': bom.version || '',
      '状态': getStatusText(bom.status) || '',
      '设计人员': bom.designer || '',
      '审核人员': bom.reviewer || '',
      '物料数量': bom.itemCount || 0,
      '生效日期': bom.effectiveDate || '',
      '总人工费用': bom.totalLabor || 0,
      '总材料费用': bom.totalMaterial || 0,
      '是否推送手册': bom.isPushedToManual ? '已推送' : '未推送',
      '创建时间': bom.createTime || '',
      '更新时间': bom.updateTime || '',
      '备注': bom.remark || ''
    }))

    const mainSheet = XLSX.utils.json_to_sheet(mainData)
    XLSX.utils.book_append_sheet(workbook, mainSheet, 'BOM主表')

    // 2. 如果包含子件，创建子件表
    if (options.includeChildren) {
      const childrenData = []
      
      bomList.forEach((bom, bomIndex) => {
        if (bom.childItems && bom.childItems.length > 0) {
          bom.childItems.forEach(child => {
            childrenData.push({
              'BOM编号': bom.bomCode || '',
              'BOM名称': bom.bomName || '',
              '序号': child.sequence || 0,
              '层阶': child.level || 1,
              '层阶地址': child.levelPath || '',
              '子件编码': child.childCode || '',
              '子件名称': child.childName || '',
              '标准用量': child.standardQty || 0,
              '0层阶标准用量': child.level0Qty || 0,
              '产出工序': child.outputProcess || '',
              '子件来源': child.source || '',
              '工序工资': child.processWage || 0,
              '材料损耗(%)': child.materialLoss || 0,
              '材料单价': child.materialPrice || 0,
              '材料费用': child.materialCost || 0,
              '0阶人工': child.level0Labor || 0,
              // 后道工序字段
              '后道产品来源': child.nextProductSource || '',
              '后道工序名称': child.nextProcessName || '',
              '后道工序产品编号': child.nextProductCode || '',
              '后道工序产品名称': child.nextProductName || '',
              '后道0阶标准用量': child.nextStandardQty || 1,
              '后道产品层阶地址': child.nextLevelAddress || ''
            })
          })
        }
      })

      if (childrenData.length > 0) {
        const childrenSheet = XLSX.utils.json_to_sheet(childrenData)
        XLSX.utils.book_append_sheet(workbook, childrenSheet, 'BOM子件')
      }
    }

    // 3. 如果有模板数据，创建模板工作表
    if (options.includeTemplate) {
      const templateData = createBOMTemplate()
      const templateSheet = XLSX.utils.json_to_sheet(templateData)
      XLSX.utils.book_append_sheet(workbook, templateSheet, '导入模板')
    }

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `生产BOM导出_${timestamp}.xlsx`

    // 导出文件
    XLSX.writeFile(workbook, filename)
    
    return filename
  })
}

/**
 * 从Excel导入BOM数据
 * @param {File} file Excel文件
 * @returns {Object} 导入结果
 */
export async function importBOMFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        // 动态导入XLSX库
        const XLSX = await import('xlsx')
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        
        const result = {
          success: false,
          data: [],
          errors: [],
          warnings: [],
          summary: {
            total: 0,
            success: 0,
            error: 0,
            warning: 0
          }
        }

        // 获取第一个工作表
        const firstSheetName = workbook.SheetNames[0]
        if (!firstSheetName) {
          throw new Error('Excel文件中没有工作表')
        }

        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        if (!jsonData || jsonData.length === 0) {
          throw new Error('工作表中没有数据')
        }

        // 解析数据
        const parsedData = parseImportData(jsonData)
        
        // 验证数据
        const validationResult = validateImportData(parsedData)
        
        result.data = validationResult.validData
        result.errors = validationResult.errors
        result.warnings = validationResult.warnings
        result.summary.total = parsedData.length
        result.summary.success = validationResult.validData.length
        result.summary.error = validationResult.errors.length
        result.summary.warning = validationResult.warnings.length
        result.success = validationResult.errors.length === 0

        resolve(result)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 创建BOM导入模板
 */
export function createBOMTemplate() {
  const template = [
    {
      'BOM编号': 'PBOM-2024-001',
      'BOM名称': '示例产品BOM',
      '产品编码': 'P001',
      '产品名称': '示例产品',
      '版本号': 'V1.0',
      '状态': 'draft',
      '设计人员': '张三',
      '审核人员': '李四',
      '物料数量': 1,
      '生效日期': '2024-01-01',
      '总人工费用': 100,
      '总材料费用': 500,
      '备注': '这是一个示例BOM'
    }
  ]

  return template
}

/**
 * 解析导入数据
 */
function parseImportData(jsonData) {
  return jsonData.map((row, index) => {
    return {
      rowNumber: index + 2, // Excel行号（从2开始，第1行是标题）
      bomCode: row['BOM编号'] || '',
      bomName: row['BOM名称'] || '',
      productCode: row['产品编码'] || '',
      productName: row['产品名称'] || '',
      version: row['版本号'] || 'V1.0',
      status: parseStatus(row['状态'] || 'draft'),
      designer: row['设计人员'] || '',
      reviewer: row['审核人员'] || '',
      itemCount: parseInt(row['物料数量']) || 0,
      effectiveDate: row['生效日期'] || '',
      totalLabor: parseFloat(row['总人工费用']) || 0,
      totalMaterial: parseFloat(row['总材料费用']) || 0,
      remark: row['备注'] || '',
      childItems: [] // 子件数据需要从其他工作表读取
    }
  })
}

/**
 * 验证导入数据
 */
function validateImportData(data) {
  const result = {
    validData: [],
    errors: [],
    warnings: []
  }

  data.forEach((item, index) => {
    const rowErrors = []
    const rowWarnings = []

    // 必填字段验证
    if (!item.bomCode) {
      rowErrors.push(`第${item.rowNumber}行：BOM编号不能为空`)
    }
    if (!item.bomName) {
      rowErrors.push(`第${item.rowNumber}行：BOM名称不能为空`)
    }
    if (!item.productCode) {
      rowErrors.push(`第${item.rowNumber}行：产品编码不能为空`)
    }
    if (!item.productName) {
      rowErrors.push(`第${item.rowNumber}行：产品名称不能为空`)
    }

    // 数据格式验证
    if (item.totalLabor < 0) {
      rowErrors.push(`第${item.rowNumber}行：总人工费用不能为负数`)
    }
    if (item.totalMaterial < 0) {
      rowErrors.push(`第${item.rowNumber}行：总材料费用不能为负数`)
    }
    if (item.itemCount < 0) {
      rowErrors.push(`第${item.rowNumber}行：物料数量不能为负数`)
    }

    // BOM编号唯一性检查
    const duplicateCount = data.filter(d => d.bomCode === item.bomCode).length
    if (duplicateCount > 1) {
      rowWarnings.push(`第${item.rowNumber}行：BOM编号"${item.bomCode}"重复，将覆盖现有数据`)
    }

    // 日期格式验证
    if (item.effectiveDate && !isValidDate(item.effectiveDate)) {
      rowWarnings.push(`第${item.rowNumber}行：生效日期格式不正确，应为YYYY-MM-DD格式`)
    }

    // 收集结果
    if (rowErrors.length > 0) {
      result.errors.push(...rowErrors)
    }
    if (rowWarnings.length > 0) {
      result.warnings.push(...rowWarnings)
    }
    if (rowErrors.length === 0) {
      result.validData.push(item)
    }
  })

  return result
}

/**
 * 解析状态值
 */
function parseStatus(statusText) {
  const statusMap = {
    '草稿': 'draft',
    'draft': 'draft',
    '审核中': 'reviewing',
    'reviewing': 'reviewing',
    '已批准': 'approved',
    'approved': 'approved',
    '已废弃': 'obsolete',
    'obsolete': 'obsolete'
  }
  
  return statusMap[statusText] || 'draft'
}

/**
 * 获取状态文本
 */
function getStatusText(status) {
  const statusMap = {
    'draft': '草稿',
    'reviewing': '审核中',
    'approved': '已批准',
    'obsolete': '已废弃'
  }
  
  return statusMap[status] || status
}

/**
 * 验证日期格式
 */
function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) {
    return false
  }
  
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date)
}

/**
 * 生成导入报告
 */
export function generateImportReport(result) {
  const report = {
    title: 'BOM导入报告',
    timestamp: new Date().toLocaleString('zh-CN'),
    summary: result.summary,
    errors: result.errors,
    warnings: result.warnings,
    successCount: result.summary.success,
    errorCount: result.summary.error,
    warningCount: result.summary.warning
  }
  
  return report
}