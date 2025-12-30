const { pool } = require('../config/database')
const BOMService = require('./bomService')

/**
 * BOM导入服务类
 */
class BOMImportService {
  /**
   * 批量导入BOM数据
   * @param {Array} bomList BOM数据列表
   * @param {Object} options 导入选项
   */
  static async batchImportBOMs(bomList, options = {}) {
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()
      
      const results = {
        total: bomList.length,
        success: 0,
        error: 0,
        errors: [],
        importedBOMs: []
      }

      for (let i = 0; i < bomList.length; i++) {
        try {
          const bomData = bomList[i]
          
          // 检查是否已存在
          if (options.skipDuplicates) {
            const existing = await this.checkBOMExists(bomData.bomCode)
            if (existing) {
              results.warnings = results.warnings || []
              results.warnings.push(`BOM编号"${bomData.bomCode}"已存在，已跳过`)
              continue
            }
          }
          
          // 导入BOM
          const importedBOM = await BOMService.createProductionBOM(bomData)
          results.importedBOMs.push(importedBOM)
          results.success++
          
          console.log(`✅ 第${i + 1}个BOM导入成功: ${bomData.bomCode}`)
        } catch (error) {
          results.error++
          results.errors.push({
            row: i + 1,
            bomCode: bomList[i]?.bomCode || '未知',
            error: error.message
          })
          
          console.error(`❌ 第${i + 1}个BOM导入失败:`, error.message)
        }
      }

      if (results.success > 0) {
        await connection.commit()
        console.log(`✅ 批量导入完成: 成功${results.success}个，失败${results.error}个`)
      } else {
        await connection.rollback()
        console.log('⚠️ 所有BOM导入失败，已回滚')
      }

      return results
    } catch (error) {
      await connection.rollback()
      console.error('批量导入BOM失败:', error)
      throw error
    } finally {
      connection.release()
    }
  }

  /**
   * 检查BOM是否已存在
   * @param {string} bomCode BOM编号
   */
  static async checkBOMExists(bomCode) {
    try {
      const [rows] = await pool.execute(
        'SELECT id FROM production_boms WHERE bom_code = ?',
        [bomCode]
      )
      return rows.length > 0
    } catch (error) {
      console.error('检查BOM是否存在失败:', error)
      throw error
    }
  }

  /**
   * 验证BOM数据
   * @param {Array} bomList BOM数据列表
   */
  static validateBOMData(bomList) {
    const errors = []
    const warnings = []

    bomList.forEach((bom, index) => {
      const rowNumber = index + 1
      const rowErrors = []

      // 必填字段检查
      if (!bom.bomCode) {
        rowErrors.push(`第${rowNumber}行：BOM编号不能为空`)
      }
      if (!bom.bomName) {
        rowErrors.push(`第${rowNumber}行：BOM名称不能为空`)
      }
      if (!bom.productCode) {
        rowErrors.push(`第${rowNumber}行：产品编码不能为空`)
      }
      if (!bom.productName) {
        rowErrors.push(`第${rowNumber}行：产品名称不能为空`)
      }

      // 数据类型检查
      if (bom.itemCount && (isNaN(bom.itemCount) || bom.itemCount < 0)) {
        rowErrors.push(`第${rowNumber}行：物料数量必须是非负数`)
      }
      if (bom.totalLabor && (isNaN(bom.totalLabor) || bom.totalLabor < 0)) {
        rowErrors.push(`第${rowNumber}行：总人工费用必须是非负数`)
      }
      if (bom.totalMaterial && (isNaN(bom.totalMaterial) || bom.totalMaterial < 0)) {
        rowErrors.push(`第${rowNumber}行：总材料费用必须是非负数`)
      }

      // 日期格式检查
      if (bom.effectiveDate && !this.isValidDate(bom.effectiveDate)) {
        warnings.push(`第${rowNumber}行：生效日期格式不正确，应为YYYY-MM-DD格式`)
      }

      // BOM编号唯一性检查
      const duplicates = bomList.filter((b, i) => i !== index && b.bomCode === bom.bomCode)
      if (duplicates.length > 0) {
        warnings.push(`第${rowNumber}行：BOM编号"${bom.bomCode}"重复`)
      }

      // 收集错误
      if (rowErrors.length > 0) {
        errors.push(...rowErrors)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证日期格式
   * @param {string} dateString 日期字符串
   */
  static isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(dateString)) {
      return false
    }
    
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date)
  }

  /**
   * 预览导入数据（不实际导入）
   * @param {Array} bomList BOM数据列表
   */
  static async previewImport(bomList) {
    try {
      const validation = this.validateBOMData(bomList)
      
      // 检查数据库中的重复项
      const duplicateChecks = []
      for (const bom of bomList) {
        if (bom.bomCode) {
          const exists = await this.checkBOMExists(bom.bomCode)
          if (exists) {
            duplicateChecks.push({
              bomCode: bom.bomCode,
              bomName: bom.bomName,
              exists: true
            })
          }
        }
      }

      return {
        totalCount: bomList.length,
        validCount: validation.isValid ? bomList.length : bomList.length - validation.errors.length,
        errors: validation.errors,
        warnings: [...validation.warnings, ...duplicateChecks.map(d => `BOM编号"${d.bomCode}"在数据库中已存在`)],
        duplicates: duplicateChecks,
        canImport: validation.errors.length === 0
      }
    } catch (error) {
      console.error('预览导入失败:', error)
      throw error
    }
  }

  /**
   * 获取导入模板
   */
  static getImportTemplate() {
    return {
      headers: [
        'BOM编号', 'BOM名称', '产品编码', '产品名称', '版本号', 
        '状态', '设计人员', '审核人员', '物料数量', '生效日期',
        '总人工费用', '总材料费用', '备注'
      ],
      example: {
        'BOM编号': 'PBOM-2024-001',
        'BOM名称': '示例产品BOM',
        '产品编码': 'P001',
        '产品名称': '示例产品',
        '版本号': 'V1.0',
        '状态': 'draft',
        '设计人员': '张三',
        '审核人员': '李四',
        '物料数量': 5,
        '生效日期': '2024-01-01',
        '总人工费用': 100,
        '总材料费用': 500,
        '备注': '这是一个示例BOM'
      },
      statusOptions: ['draft', 'reviewing', 'approved', 'obsolete'],
      statusTextMap: {
        'draft': '草稿',
        'reviewing': '审核中',
        'approved': '已批准',
        'obsolete': '已废弃'
      }
    }
  }

  /**
   * 导出BOM数据为Excel格式
   * @param {Array} bomList BOM数据列表
   * @param {Object} options 导出选项
   */
  static async exportToExcel(bomList, options = {}) {
    try {
      // 这里需要安装xlsx包：npm install xlsx
      const XLSX = require('xlsx')
      
      // 创建工作簿
      const workbook = XLSX.utils.book_new()

      // 1. 主表数据
      const mainData = bomList.map(bom => ({
        'BOM编号': bom.bomCode || '',
        'BOM名称': bom.bomName || '',
        '产品编码': bom.productCode || '',
        '产品名称': bom.productName || '',
        '版本号': bom.version || '',
        '状态': this.getStatusText(bom.status) || '',
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
        
        for (const bom of bomList) {
          if (bom.id) {
            // 获取子件数据
            const bomDetail = await BOMService.getBOMById(bom.id)
            if (bomDetail && bomDetail.childItems) {
              bomDetail.childItems.forEach(child => {
                childrenData.push({
                  'BOM编号': bom.bomCode || '',
                  'BOM名称': bom.bomName || '',
                  '序号': child.sequence || 0,
                  '层阶': child.level || 1,
                  '层阶地址': child.levelPath || '',
                  '子件编码': child.component_code || '',
                  '子件名称': child.component_name || '',
                  '标准用量': child.quantity || 0,
                  '产出工序': child.output_process || '',
                  '子件来源': child.component_source || '',
                  '工序工资': child.process_wage || 0,
                  '材料损耗(%)': child.material_loss || 0,
                  '材料单价': child.material_price || 0,
                  '材料费用': child.material_cost || 0
                })
              })
            }
          }
        }

        if (childrenData.length > 0) {
          const childrenSheet = XLSX.utils.json_to_sheet(childrenData)
          XLSX.utils.book_append_sheet(workbook, childrenSheet, 'BOM子件')
        }
      }

      // 3. 导入模板
      if (options.includeTemplate) {
        const template = this.getImportTemplate()
        const templateData = [template.example]
        const templateSheet = XLSX.utils.json_to_sheet(templateData)
        XLSX.utils.book_append_sheet(workbook, templateSheet, '导入模板')
      }

      // 生成文件
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const filename = `生产BOM导出_${timestamp}.xlsx`
      
      // 保存到临时目录或返回文件内容
      // 这里可以根据实际需求调整
      XLSX.writeFile(workbook, filename)
      
      return {
        filename,
        path: filename,
        count: bomList.length,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('导出Excel失败:', error)
      throw error
    }
  }

  /**
   * 获取状态文本
   */
  static getStatusText(status) {
    const statusMap = {
      'draft': '草稿',
      'reviewing': '审核中',
      'approved': '已批准',
      'obsolete': '已废弃'
    }
    
    return statusMap[status] || status
  }
}

module.exports = BOMImportService
