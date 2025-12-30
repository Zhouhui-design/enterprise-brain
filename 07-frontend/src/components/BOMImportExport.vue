<template>
  <div class="bom-import-export">
    <!-- 导入按钮 -->
    <el-button type="success" @click="handleImport">
      <el-icon><Upload /></el-icon>
      导入
    </el-button>
    
    <!-- 导出按钮 -->
    <el-button type="warning" :disabled="!hasData" @click="handleExport">
      <el-icon><Download /></el-icon>
      导出
    </el-button>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入BOM数据" width="800px" :close-on-click-modal="false">
      <div class="import-dialog-content">
        <!-- 导入选项 -->
        <div class="import-options">
          <el-form :model="importOptions" label-width="120px">
            <el-form-item label="跳过重复项">
              <el-switch v-model="importOptions.skipDuplicates" />
              <span class="option-hint">勾选此项将跳过已存在的BOM编号</span>
            </el-form-item>
          </el-form>
        </div>

        <!-- 文件上传 -->
        <div class="file-upload-section">
          <el-upload
            ref="uploadRef"
            class="upload-demo"
            drag
            accept=".xlsx,.xls"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将Excel文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只支持 .xlsx/.xls 文件，文件大小不超过 10MB
              </div>
            </template>
          </el-upload>
          
          <div class="template-download">
            <el-button @click="handleDownloadTemplate" type="text">
              <el-icon><Download /></el-icon>
              下载导入模板
            </el-button>
          </div>
        </div>

        <!-- 预览结果 -->
        <div v-if="importPreview" class="preview-section">
          <h4>导入预览</h4>
          
          <!-- 统计信息 -->
          <div class="preview-stats">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-statistic title="总数" :value="importPreview.summary.total" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="成功" :value="importPreview.summary.success" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="错误" :value="importPreview.summary.error" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="警告" :value="importPreview.summary.warning" />
              </el-col>
            </el-row>
          </div>

          <!-- 错误信息 -->
          <div v-if="importPreview.errors.length > 0" class="error-section">
            <h5>错误信息</h5>
            <el-alert
              v-for="(error, index) in importPreview.errors.slice(0, 5)"
              :key="index"
              :title="error"
              type="error"
              :closable="false"
              show-icon
            />
            <div v-if="importPreview.errors.length > 5" class="more-errors">
              还有 {{ importPreview.errors.length - 5 }} 个错误...
            </div>
          </div>

          <!-- 警告信息 -->
          <div v-if="importPreview.warnings.length > 0" class="warning-section">
            <h5>警告信息</h5>
            <el-alert
              v-for="(warning, index) in importPreview.warnings.slice(0, 3)"
              :key="index"
              :title="warning"
              type="warning"
              :closable="false"
              show-icon
            />
            <div v-if="importPreview.warnings.length > 3" class="more-warnings">
              还有 {{ importPreview.warnings.length - 3 }} 个警告...
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleImportConfirm"
            :loading="importLoading"
            :disabled="!importPreview || importPreview.summary.error > 0"
          >
            确认导入
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Download, UploadFilled } from '@element-plus/icons-vue'
import { exportBOMToExcel, importBOMFromExcel, generateImportReport, createBOMTemplate } from '@/utils/excelUtils'

// Props
const props = defineProps({
  tableData: {
    type: Array,
    default: () => []
  },
  selectedRows: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['refresh'])

// 导入导出相关变量
const importDialogVisible = ref(false)
const importFile = ref(null)
const importPreview = ref(null)
const importLoading = ref(false)
const importOptions = ref({
  skipDuplicates: false
})

// 计算属性
const hasData = computed(() => {
  return props.tableData && props.tableData.length > 0
})

// 导入处理
const handleImport = () => {
  importDialogVisible.value = true
  importFile.value = null
  importPreview.value = null
}

// 文件选择处理
const handleFileChange = (file) => {
  if (file.raw) {
    importFile.value = file.raw
    // 自动预览
    handlePreviewImport()
  }
}

// 预览导入数据
const handlePreviewImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  importLoading.value = true
  try {
    console.log('🔍 开始预览导入数据...')
    
    const result = await importBOMFromExcel(importFile.value)
    importPreview.value = result
    
    console.log('✅ 预览完成:', result.summary)
    
    if (result.summary.error > 0) {
      ElMessage.warning(`预览完成，发现 ${result.summary.error} 个错误，请检查数据格式`)
    } else {
      ElMessage.success(`预览完成，可以导入 ${result.summary.success} 条数据`)
    }
  } catch (error) {
    console.error('预览失败:', error)
    ElMessage.error('预览失败: ' + error.message)
  } finally {
    importLoading.value = false
  }
}

// 确认导入
const handleImportConfirm = async () => {
  if (!importPreview.value) {
    ElMessage.warning('请先预览数据')
    return
  }

  if (importPreview.value.summary.error > 0) {
    const confirmed = await ElMessageBox.confirm(
      `发现 ${importPreview.value.summary.error} 个错误，是否继续导入正确的数据？`,
      '确认导入',
      {
        confirmButtonText: '继续导入',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    if (!confirmed) return
  }

  importLoading.value = true
  try {
    console.log('📥 开始导入BOM数据...')
    
    // 调用后端导入API
    const formData = new FormData()
    formData.append('file', importFile.value)
    formData.append('skipDuplicates', importOptions.value.skipDuplicates)

    const response = await fetch('/api/bom-import/import', {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    
    if (result.code === 200) {
      const importResult = result.data
      
      // 刷新数据
      emit('refresh')
      
      // 显示导入结果
      let message = `导入完成！\n`
      message += `成功: ${importResult.success} 条\n`
      message += `失败: ${importResult.error} 条`
      
      if (importResult.warnings && importResult.warnings.length > 0) {
        message += `\n警告: ${importResult.warnings.length} 条`
      }
      
      ElMessage.success(message)
      
      // 关闭对话框
      importDialogVisible.value = false
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败: ' + error.message)
  } finally {
    importLoading.value = false
  }
}

// 导出处理
const handleExport = async () => {
  try {
    console.log('📤 开始导出BOM数据...')
    
    const selectedIds = props.selectedRows.map(row => row.id)
    const dataToExport = selectedIds.length > 0 ? 
      props.tableData.filter(row => selectedIds.includes(row.id)) : 
      props.tableData

    if (dataToExport.length === 0) {
      ElMessage.warning('没有数据可导出')
      return
    }

    // 使用新的Excel导出功能
    exportBOMToExcel(dataToExport, {
      includeChildren: true,
      includeTemplate: true
    }).then(filename => {
      console.log(`✅ 导出成功: ${filename}`)
      ElMessage.success(`导出成功！\n文件名: ${filename}\n共 ${dataToExport.length} 条记录`)
    }).catch(error => {
      console.error('导出失败:', error)
      ElMessage.error('导出失败: ' + error.message)
    })
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + error.message)
  }
}

// 下载导入模板
const handleDownloadTemplate = async () => {
  try {
    const templateData = createBOMTemplate()
    const XLSX = await import('xlsx')
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BOM导入模板')
    
    const filename = `BOM导入模板_${new Date().toISOString().slice(0, 10)}.xlsx`
    XLSX.writeFile(workbook, filename)
    
    ElMessage.success(`模板下载成功: ${filename}`)
  } catch (error) {
    console.error('下载模板失败:', error)
    ElMessage.error('下载模板失败: ' + error.message)
  }
}
</script>

<style scoped>
.bom-import-export {
  display: inline-flex;
  gap: 8px;
}

.import-dialog-content {
  padding: 20px;
}

.import-options {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.option-hint {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.file-upload-section {
  margin-bottom: 20px;
}

.template-download {
  text-align: center;
  margin-top: 10px;
}

.preview-section {
  border-top: 1px solid #e4e7ed;
  padding-top: 20px;
}

.preview-stats {
  margin-bottom: 20px;
  padding: 15px;
  background: #ecf5ff;
  border-radius: 4px;
}

.error-section, .warning-section {
  margin-bottom: 15px;
}

.error-section h5, .warning-section h5 {
  margin-bottom: 10px;
  color: #303133;
}

.more-errors, .more-warnings {
  color: #909399;
  font-size: 12px;
  margin-top: 10px;
}

.upload-demo {
  width: 100%;
}
</style>
