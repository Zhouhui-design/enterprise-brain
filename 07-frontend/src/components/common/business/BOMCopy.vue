<template>
  <div class="bom-copy">
    <!-- 触发按钮 -->
    <el-button
      v-if="triggerType === 'button'"
      type="primary"
      @click="showDialog = true"
      :disabled="disabled"
    >
      <el-icon><CopyDocument /></el-icon>
      {{ buttonText }}
    </el-button>

    <!-- 表格行操作按钮 -->
    <el-button
      v-else-if="triggerType === 'table-action'"
      type="text"
      size="small"
      @click="handleCopy"
      :disabled="disabled"
      :title="buttonText"
    >
      <el-icon><CopyDocument /></el-icon>
    </el-button>

    <!-- 对话框 -->
    <el-dialog
      v-model="showDialog"
      title="复制材料清单"
      width="700px"
      :before-close="handleDialogClose"
    >
      <!-- 原材料清单信息 -->
      <div v-if="originalBOM" class="original-bom-info">
        <h3>原材料清单信息</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="BOM编码">{{ originalBOM.bomCode }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ originalBOM.productName }}</el-descriptions-item>
          <el-descriptions-item label="版本号">{{ originalBOM.version }}</el-descriptions-item>
          <el-descriptions-item label="物料数量">{{ originalBOM.itemCount }} 项</el-descriptions-item>
          <el-descriptions-item label="创建日期">{{ formatDate(originalBOM.createDate) }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getBOMStatusText(originalBOM.status) }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 复制配置 -->
      <div class="copy-config">
        <h3>复制配置</h3>
        <el-form label-position="top" :model="copyForm" :rules="copyRules" ref="copyFormRef">
          <!-- BOM基本信息 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="新BOM编码" prop="newBomCode">
                <el-input v-model="copyForm.newBomCode" placeholder="自动生成或手动输入" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="新版本号" prop="newVersion">
                <el-input v-model="copyForm.newVersion" placeholder="例如：V1.1" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="复制说明" prop="description">
            <el-input v-model="copyForm.description" type="textarea" :rows="2" placeholder="简要说明复制的目的或变更内容" />
          </el-form-item>

          <!-- 复制选项 -->
          <el-form-item label="复制内容">
            <el-checkbox-group v-model="copyForm.copyOptions" :disabled="disabled">
              <el-checkbox value="bomItems" :disabled="disabled">BOM组件明细</el-checkbox>
              <el-checkbox value="processRoutes" :disabled="disabled">工艺路线</el-checkbox>
              <el-checkbox value="qualityStandards" :disabled="disabled">质量标准</el-checkbox>
              <el-checkbox value="substitutes" :disabled="disabled">替代物料</el-checkbox>
              <el-checkbox value="attachments" :disabled="disabled">附件文件</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <!-- 高级选项 -->
          <el-form-item>
            <el-divider content-position="left">高级选项</el-divider>
          </el-form-item>

          <el-form-item>
            <el-switch
              v-model="copyForm.resetStatus"
              active-text="重置状态为草稿"
              inactive-text="保留原状态"
              :disabled="disabled"
            />
          </el-form-item>

          <el-form-item>
            <el-switch
              v-model="copyForm.updateMaterialQty"
              active-text="调整物料用量比例"
              inactive-text="保持原用量"
              :disabled="disabled"
            />
          </el-form-item>

          <el-form-item v-if="copyForm.updateMaterialQty" label="用量调整比例">
            <el-input-number
              v-model="copyForm.qtyRatio"
              :min="0.1"
              :max="10"
              :step="0.1"
              :precision="2"
              :disabled="disabled"
            />
            <span class="ratio-label">倍（例如：1.5表示1.5倍原用量）</span>
          </el-form-item>

          <el-form-item>
            <el-switch
              v-model="copyForm.updateCostEstimate"
              active-text="重新计算成本估算"
              inactive-text="保持原成本估算"
              :disabled="disabled"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 复制进度 -->
      <div v-if="copying" class="copy-progress">
        <el-progress :percentage="copyProgress" :status="copyStatus" />
        <p class="progress-text">{{ copyProgressText }}</p>
      </div>

      <!-- 对话框底部按钮 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose" :disabled="copying">取消</el-button>
          <el-button
            type="primary"
            @click="confirmCopy"
            :loading="copying"
            :disabled="disabled || copying"
          >
            <el-icon v-if="!copying"><CopyDocument /></el-icon>
            <el-icon v-else><Loading /></el-icon>
            {{ copying ? '复制中...' : '确认复制' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CopyDocument, Loading } from '@element-plus/icons-vue'

// BOM数据类型
interface BOM {
  id: string
  bomCode: string
  productName: string
  version: string
  itemCount: number
  createDate: string
  status: string
  [key: string]: any
}

// Props 定义
interface Props {
  bomId?: string
  bom?: BOM
  triggerType?: 'button' | 'table-action'
  buttonText?: string
  disabled?: boolean
  showBOMInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  bomId: '',
  triggerType: 'button',
  buttonText: '复制BOM',
  disabled: false,
  showBOMInfo: true
})

// Emits 定义
const emit = defineEmits<{
  'success': [newBomId: string, newBom: BOM]
  'cancel': []
  'error': [error: Error]
}>()

// 响应式数据
const showDialog = ref(false)
const originalBOM = ref<BOM | null>(null)
const copying = ref(false)
const copyProgress = ref(0)
const copyProgressText = ref('')
const copyStatus = ref<'success' | 'exception' | 'warning' | 'info'>('info')
const copyFormRef = ref()

// 复制表单数据
const copyForm = reactive({
  newBomCode: '',
  newVersion: '',
  description: '',
  copyOptions: ['bomItems', 'processRoutes', 'qualityStandards'],
  resetStatus: true,
  updateMaterialQty: false,
  qtyRatio: 1,
  updateCostEstimate: false
})

// 表单验证规则
const copyRules = {
  newBomCode: [
    {
      validator: (rule: any, value: string, callback: any) => {
        if (!value || value.trim()) {
          callback()
        } else {
          callback(new Error('BOM编码不能为空'))
        }
      },
      trigger: 'blur'
    }
  ],
  newVersion: [
    {
      required: true,
      message: '请输入版本号',
      trigger: 'blur'
    }
  ]
}

// 格式化日期
const formatDate = (date: string): string => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

// 获取BOM状态文本
const getBOMStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'draft': '草稿',
    'pending': '待审核',
    'approved': '已审核',
    'released': '已发布',
    'obsolete': '已废弃',
    '生效': '生效',
    '失效': '失效'
  }
  return statusMap[status] || status
}

// 加载BOM信息
const loadBOMInfo = async (bomId: string): Promise<BOM | null> => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟BOM数据
    const mockBOM: BOM = {
      id: bomId,
      bomCode: `BOM${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      productName: '示例产品组件',
      version: 'V1.0',
      itemCount: 25,
      createDate: new Date().toISOString(),
      status: '生效',
      productCode: 'PRD001',
      unit: '个',
      description: '标准组件BOM'
    }
    
    return mockBOM
  } catch (error) {
    console.error('加载BOM信息失败:', error)
    ElMessage.error('加载BOM信息失败')
    return null
  }
}

// 生成新BOM编码
const generateBomCode = (): string => {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `BOM${timestamp}${random}`
}

// 处理复制操作（表格行操作）
const handleCopy = async () => {
  if (!props.bomId && !props.bom) {
    ElMessage.warning('请提供BOM信息')
    return
  }
  
  await openDialog()
}

// 打开对话框
const openDialog = async () => {
  try {
    // 加载BOM信息
    if (props.bom) {
      originalBOM.value = { ...props.bom }
    } else if (props.bomId) {
      originalBOM.value = await loadBOMInfo(props.bomId)
    }
    
    if (!originalBOM.value) {
      ElMessage.error('BOM信息不存在')
      return
    }
    
    // 重置表单
    resetForm()
    
    // 自动填充新版本号
    if (originalBOM.value.version) {
      const versionMatch = originalBOM.value.version.match(/V(\d+)\.(\d+)/)
      if (versionMatch) {
        const major = parseInt(versionMatch[1], 10)
        const minor = parseInt(versionMatch[2], 10)
        copyForm.newVersion = `V${major}.${minor + 1}`
      } else {
        copyForm.newVersion = `${originalBOM.value.version}_Copy`
      }
    }
    
    // 显示对话框
    showDialog.value = true
  } catch (error) {
    console.error('打开复制对话框失败:', error)
    ElMessage.error('操作失败')
  }
}

// 重置表单
const resetForm = () => {
  copyForm.newBomCode = '' // 清空，准备自动生成
  copyForm.newVersion = ''
  copyForm.description = ''
  copyForm.copyOptions = ['bomItems', 'processRoutes', 'qualityStandards']
  copyForm.resetStatus = true
  copyForm.updateMaterialQty = false
  copyForm.qtyRatio = 1
  copyForm.updateCostEstimate = false
  
  copying.value = false
  copyProgress.value = 0
  copyProgressText.value = ''
  copyStatus.value = 'info'
}

// 处理对话框关闭
const handleDialogClose = () => {
  if (copying.value) {
    ElMessageBox.confirm('复制操作正在进行中，确定要取消吗？', '取消确认', {
      confirmButtonText: '确定取消',
      cancelButtonText: '继续复制',
      type: 'warning'
    }).then(() => {
      showDialog.value = false
      resetForm()
      emit('cancel')
    }).catch(() => {
      // 继续复制
    })
  } else {
    showDialog.value = false
    resetForm()
    emit('cancel')
  }
}

// 模拟复制进度
const simulateCopyProgress = async (): Promise<void> => {
  const steps = [
    { progress: 10, text: '准备复制数据...' },
    { progress: 25, text: '复制BOM基本信息...' },
    { progress: 40, text: '复制BOM组件明细...' },
    { progress: 55, text: '复制工艺路线...' },
    { progress: 70, text: '复制质量标准...' },
    { progress: 85, text: '生成新BOM...' },
    { progress: 100, text: '复制完成' }
  ]
  
  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 300))
    copyProgress.value = step.progress
    copyProgressText.value = step.text
  }
}

// 确认复制
const confirmCopy = async () => {
  // 验证表单
  if (!copyFormRef.value) return
  
  try {
    await copyFormRef.value.validate()
    
    // 如果未填写新BOM编码，自动生成
    if (!copyForm.newBomCode.trim()) {
      copyForm.newBomCode = generateBomCode()
    }
    
    // 确认对话框
    await ElMessageBox.confirm(
      `确定要复制BOM ${originalBOM.value?.bomCode} (${originalBOM.value?.version}) 吗？\n新BOM编码: ${copyForm.newBomCode}\n新版本号: ${copyForm.newVersion}`,
      '复制确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 开始复制
    copying.value = true
    copyProgress.value = 0
    copyProgressText.value = '开始复制...'
    
    try {
      // 模拟复制过程
      await simulateCopyProgress()
      
      // 模拟创建新BOM
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 创建新BOM数据
      const newBOM: BOM = {
        id: `NEW_${Date.now()}`,
        bomCode: copyForm.newBomCode,
        productName: originalBOM.value?.productName || '',
        version: copyForm.newVersion,
        itemCount: originalBOM.value?.itemCount || 0,
        createDate: new Date().toISOString(),
        status: copyForm.resetStatus ? '草稿' : (originalBOM.value?.status || '草稿')
      }
      
      // 复制成功
      copyStatus.value = 'success'
      ElMessage.success('BOM复制成功')
      
      // 通知成功
      emit('success', newBOM.id, newBOM)
      
      // 关闭对话框
      setTimeout(() => {
        showDialog.value = false
        resetForm()
      }, 1000)
    } catch (error) {
      console.error('复制BOM失败:', error)
      copyStatus.value = 'exception'
      copyProgressText.value = '复制失败'
      ElMessage.error('BOM复制失败')
      emit('error', error as Error)
      
      // 5秒后关闭对话框
      setTimeout(() => {
        showDialog.value = false
        resetForm()
      }, 5000)
    }
  } catch (error) {
    // 表单验证失败或用户取消
    if ((error as Error).name !== 'Cancel') {
      console.error('操作取消或验证失败:', error)
    }
  }
}

// 监听bomId变化
if (props.triggerType === 'button' && props.bomId) {
  openDialog()
}
</script>

<style scoped>
.bom-copy {
  display: inline-block;
}

.original-bom-info,
.copy-config {
  margin-bottom: 24px;
}

.original-bom-info h3,
.copy-config h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
  border-left: 4px solid #1890ff;
  padding-left: 12px;
}

.original-bom-info :deep(.el-descriptions) {
  margin-bottom: 0;
}

.copy-progress {
  margin: 20px 0;
}

.progress-text {
  text-align: center;
  margin-top: 12px;
  color: #606266;
  font-size: 14px;
}

.ratio-label {
  margin-left: 10px;
  color: #606266;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .bom-copy :deep(.el-dialog) {
    width: 90% !important;
    margin: 10px;
  }
  
  .original-bom-info h3,
  .copy-config h3 {
    font-size: 14px;
    padding-left: 8px;
  }
  
  .original-bom-info :deep(.el-descriptions__label),
  .original-bom-info :deep(.el-descriptions__content) {
    font-size: 12px;
    padding: 8px;
  }
  
  .copy-config :deep(.el-form-item__label) {
    font-size: 13px;
  }
  
  .ratio-label {
    display: block;
    margin-top: 8px;
    margin-left: 0;
  }
}
</style>