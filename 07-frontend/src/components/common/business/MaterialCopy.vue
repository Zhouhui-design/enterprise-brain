<template>
  <div class="material-copy">
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
      title="复制物料"
      width="650px"
      :before-close="handleDialogClose"
    >
      <!-- 原物料信息 -->
      <div v-if="originalMaterial" class="original-material-info">
        <h3>原物料信息</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="物料编码">{{ originalMaterial.materialCode }}</el-descriptions-item>
          <el-descriptions-item label="物料名称">{{ originalMaterial.materialName }}</el-descriptions-item>
          <el-descriptions-item label="物料类型">{{ getMaterialTypeText(originalMaterial.materialType) }}</el-descriptions-item>
          <el-descriptions-item label="规格型号">{{ originalMaterial.specification || '-' }}</el-descriptions-item>
          <el-descriptions-item label="单位">{{ originalMaterial.unit }}</el-descriptions-item>
          <el-descriptions-item label="创建日期">{{ formatDate(originalMaterial.createDate) }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 复制配置 -->
      <div class="copy-config">
        <h3>复制配置</h3>
        <el-form label-position="top" :model="copyForm" :rules="copyRules" ref="copyFormRef">
          <!-- 物料基本信息 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="新物料编码" prop="newMaterialCode">
                <el-input v-model="copyForm.newMaterialCode" placeholder="自动生成或手动输入" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="新物料名称" prop="newMaterialName">
                <el-input v-model="copyForm.newMaterialName" placeholder="自动基于原物料名称生成" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="规格型号" prop="specification">
            <el-input v-model="copyForm.specification" placeholder="可修改新物料的规格型号" />
          </el-form-item>

          <!-- 复制选项 -->
          <el-form-item label="复制内容">
            <el-checkbox-group v-model="copyForm.copyOptions" :disabled="disabled">
              <el-checkbox value="basicInfo" :disabled="disabled">基本信息</el-checkbox>
              <el-checkbox value="inventoryInfo" :disabled="disabled">库存信息</el-checkbox>
              <el-checkbox value="costInfo" :disabled="disabled">成本信息</el-checkbox>
              <el-checkbox value="supplierInfo" :disabled="disabled">供应商信息</el-checkbox>
              <el-checkbox value="qualityInfo" :disabled="disabled">质量信息</el-checkbox>
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
              v-model="copyForm.resetInventory"
              active-text="重置库存数量为0"
              inactive-text="复制原库存信息"
              :disabled="disabled"
            />
          </el-form-item>

          <el-form-item>
            <el-switch
              v-model="copyForm.generateNewBarcode"
              active-text="生成新条码"
              inactive-text="复制原条码"
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

// 物料数据类型
interface Material {
  id: string
  materialCode: string
  materialName: string
  materialType: string
  specification?: string
  unit: string
  createDate: string
  status?: string
  [key: string]: any
}

// Props 定义
interface Props {
  materialId?: string
  material?: Material
  triggerType?: 'button' | 'table-action'
  buttonText?: string
  disabled?: boolean
  showMaterialInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  materialId: '',
  triggerType: 'button',
  buttonText: '复制物料',
  disabled: false,
  showMaterialInfo: true
})

// Emits 定义
const emit = defineEmits<{
  'success': [newMaterialId: string, newMaterial: Material]
  'cancel': []
  'error': [error: Error]
}>()

// 响应式数据
const showDialog = ref(false)
const originalMaterial = ref<Material | null>(null)
const copying = ref(false)
const copyProgress = ref(0)
const copyProgressText = ref('')
const copyStatus = ref<'success' | 'exception' | 'warning' | 'info'>('info')
const copyFormRef = ref()

// 复制表单数据
const copyForm = reactive({
  newMaterialCode: '',
  newMaterialName: '',
  specification: '',
  copyOptions: ['basicInfo', 'inventoryInfo', 'costInfo'],
  resetStatus: true,
  resetInventory: true,
  generateNewBarcode: true
})

// 表单验证规则
const copyRules = {
  newMaterialCode: [
    {
      validator: (rule: any, value: string, callback: any) => {
        if (!value || value.trim()) {
          callback()
        } else {
          callback(new Error('物料编码不能为空'))
        }
      },
      trigger: 'blur'
    }
  ],
  newMaterialName: [
    {
      required: true,
      message: '请输入物料名称',
      trigger: 'blur'
    }
  ]
}

// 格式化日期
const formatDate = (date: string): string => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

// 获取物料类型文本
const getMaterialTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    'raw': '原材料',
    'semi': '半成品',
    'finished': '成品',
    'consumable': '消耗品',
    'tool': '工具',
    'equipment': '设备',
    'service': '服务'
  }
  return typeMap[type] || type
}

// 加载物料信息
const loadMaterialInfo = async (materialId: string): Promise<Material | null> => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟物料数据
    const mockMaterial: Material = {
      id: materialId,
      materialCode: `MAT${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      materialName: '示例原材料组件',
      materialType: 'raw',
      specification: '规格 A-123',
      unit: '个',
      createDate: new Date().toISOString(),
      status: 'active',
      description: '标准原材料',
      barcode: 'BAR' + Math.random().toString(36).substring(2, 12).toUpperCase()
    }
    
    return mockMaterial
  } catch (error) {
    console.error('加载物料信息失败:', error)
    ElMessage.error('加载物料信息失败')
    return null
  }
}

// 生成新物料编码
const generateMaterialCode = (): string => {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `MAT${timestamp}${random}`
}

// 处理复制操作（表格行操作）
const handleCopy = async () => {
  if (!props.materialId && !props.material) {
    ElMessage.warning('请提供物料信息')
    return
  }
  
  await openDialog()
}

// 打开对话框
const openDialog = async () => {
  try {
    // 加载物料信息
    if (props.material) {
      originalMaterial.value = { ...props.material }
    } else if (props.materialId) {
      originalMaterial.value = await loadMaterialInfo(props.materialId)
    }
    
    if (!originalMaterial.value) {
      ElMessage.error('物料信息不存在')
      return
    }
    
    // 重置表单
    resetForm()
    
    // 自动填充新物料名称
    if (originalMaterial.value.materialName) {
      copyForm.newMaterialName = `${originalMaterial.value.materialName}_副本`
    }
    
    // 保留原规格型号
    if (originalMaterial.value.specification) {
      copyForm.specification = originalMaterial.value.specification
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
  copyForm.newMaterialCode = '' // 清空，准备自动生成
  copyForm.newMaterialName = ''
  copyForm.specification = ''
  copyForm.copyOptions = ['basicInfo', 'inventoryInfo', 'costInfo']
  copyForm.resetStatus = true
  copyForm.resetInventory = true
  copyForm.generateNewBarcode = true
  
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
    { progress: 25, text: '复制物料基本信息...' },
    { progress: 40, text: '复制库存信息...' },
    { progress: 55, text: '复制成本信息...' },
    { progress: 70, text: '处理供应商信息...' },
    { progress: 85, text: '生成新物料...' },
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
    
    // 如果未填写新物料编码，自动生成
    if (!copyForm.newMaterialCode.trim()) {
      copyForm.newMaterialCode = generateMaterialCode()
    }
    
    // 确认对话框
    await ElMessageBox.confirm(
      `确定要复制物料 ${originalMaterial.value?.materialCode} (${originalMaterial.value?.materialName}) 吗？\n新物料编码: ${copyForm.newMaterialCode}\n新物料名称: ${copyForm.newMaterialName}`,
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
      
      // 模拟创建新物料
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 创建新物料数据
      const newMaterial: Material = {
        id: `NEW_${Date.now()}`,
        materialCode: copyForm.newMaterialCode,
        materialName: copyForm.newMaterialName,
        materialType: originalMaterial.value?.materialType || 'raw',
        specification: copyForm.specification,
        unit: originalMaterial.value?.unit || '个',
        createDate: new Date().toISOString(),
        status: copyForm.resetStatus ? 'draft' : (originalMaterial.value?.status || 'active')
      }
      
      // 复制成功
      copyStatus.value = 'success'
      ElMessage.success('物料复制成功')
      
      // 通知成功
      emit('success', newMaterial.id, newMaterial)
      
      // 关闭对话框
      setTimeout(() => {
        showDialog.value = false
        resetForm()
      }, 1000)
    } catch (error) {
      console.error('复制物料失败:', error)
      copyStatus.value = 'exception'
      copyProgressText.value = '复制失败'
      ElMessage.error('物料复制失败')
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

// 监听materialId变化
if (props.triggerType === 'button' && props.materialId) {
  openDialog()
}
</script>

<style scoped>
.material-copy {
  display: inline-block;
}

.original-material-info,
.copy-config {
  margin-bottom: 24px;
}

.original-material-info h3,
.copy-config h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
  border-left: 4px solid #1890ff;
  padding-left: 12px;
}

.original-material-info :deep(.el-descriptions) {
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

/* 响应式设计 */
@media (max-width: 768px) {
  .material-copy :deep(.el-dialog) {
    width: 90% !important;
    margin: 10px;
  }
  
  .original-material-info h3,
  .copy-config h3 {
    font-size: 14px;
    padding-left: 8px;
  }
  
  .original-material-info :deep(.el-descriptions__label),
  .original-material-info :deep(.el-descriptions__content) {
    font-size: 12px;
    padding: 8px;
  }
  
  .copy-config :deep(.el-form-item__label) {
    font-size: 13px;
  }
}
</style>