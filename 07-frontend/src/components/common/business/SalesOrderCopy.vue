<template>
  <div class="sales-order-copy">
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
      title="复制销售订单"
      width="600px"
      :before-close="handleDialogClose"
    >
      <!-- 原订单信息 -->
      <div v-if="originalOrder" class="original-order-info">
        <h3>原订单信息</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单编号">{{ originalOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ originalOrder.customerName }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">{{ formatCurrency(originalOrder.totalAmount) }}</el-descriptions-item>
          <el-descriptions-item label="创建日期">{{ formatDate(originalOrder.createDate) }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">{{ getOrderStatusText(originalOrder.status) }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 复制配置 -->
      <div class="copy-config">
        <h3>复制配置</h3>
        <el-form label-position="top" :model="copyForm" :rules="copyRules" ref="copyFormRef">
          <!-- 订单基本信息 -->
          <el-form-item label="新订单编号" prop="newOrderNo">
            <el-input v-model="copyForm.newOrderNo" placeholder="自动生成或手动输入" />
          </el-form-item>

          <el-form-item label="新订单日期" prop="newOrderDate">
            <el-date-picker
              v-model="copyForm.newOrderDate"
              type="date"
              placeholder="选择订单日期"
              style="width: 100%"
              :disabled="disabled"
            />
          </el-form-item>

          <!-- 复制选项 -->
          <el-form-item label="复制内容">
            <el-checkbox-group v-model="copyForm.copyOptions" :disabled="disabled">
              <el-checkbox value="orderItems" :disabled="disabled">订单明细</el-checkbox>
              <el-checkbox value="deliveryInfo" :disabled="disabled">交货信息</el-checkbox>
              <el-checkbox value="paymentTerms" :disabled="disabled">付款条件</el-checkbox>
              <el-checkbox value="remark" :disabled="disabled">备注信息</el-checkbox>
              <el-checkbox value="attachments" :disabled="disabled">附件文件</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <!-- 其他选项 -->
          <el-form-item>
            <el-switch
              v-model="copyForm.resetStatus"
              active-text="重置订单状态为草稿"
              inactive-text="保留原订单状态"
              :disabled="disabled"
            />
          </el-form-item>

          <el-form-item>
            <el-switch
              v-model="copyForm.notifyCustomer"
              active-text="复制成功后通知客户"
              inactive-text="不通知客户"
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
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CopyDocument, Loading } from '@element-plus/icons-vue'

// 订单数据类型
interface SalesOrder {
  id: string
  orderNo: string
  customerName: string
  totalAmount: number
  createDate: string
  status: string
  [key: string]: any
}

// Props 定义
interface Props {
  orderId?: string
  order?: SalesOrder
  triggerType?: 'button' | 'table-action'
  buttonText?: string
  disabled?: boolean
  showOrderInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  orderId: '',
  triggerType: 'button',
  buttonText: '复制销售订单',
  disabled: false,
  showOrderInfo: true
})

// Emits 定义
const emit = defineEmits<{
  'success': [newOrderId: string, newOrder: SalesOrder]
  'cancel': []
  'error': [error: Error]
}>()

// 响应式数据
const showDialog = ref(false)
const originalOrder = ref<SalesOrder | null>(null)
const copying = ref(false)
const copyProgress = ref(0)
const copyProgressText = ref('')
const copyStatus = ref<'success' | 'exception' | 'warning' | 'info'>('info')
const copyFormRef = ref()

// 复制表单数据
const copyForm = reactive({
  newOrderNo: '',
  newOrderDate: new Date(),
  copyOptions: ['orderItems', 'deliveryInfo', 'paymentTerms'],
  resetStatus: true,
  notifyCustomer: false
})

// 表单验证规则
const copyRules = {
  newOrderNo: [
    {
      validator: (rule: any, value: string, callback: any) => {
        if (!value || value.trim()) {
          callback()
        } else {
          callback(new Error('订单编号不能为空'))
        }
      },
      trigger: 'blur'
    }
  ],
  newOrderDate: [
    {
      type: 'date',
      required: true,
      message: '请选择订单日期',
      trigger: 'change'
    }
  ]
}

// 格式化货币
const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number') return '¥0.00'
  return `¥${amount.toFixed(2)}`
}

// 格式化日期
const formatDate = (date: string): string => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

// 获取订单状态文本
const getOrderStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'draft': '草稿',
    'pending': '待审核',
    'approved': '已审核',
    'confirmed': '已确认',
    'processing': '处理中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

// 加载订单信息
const loadOrderInfo = async (orderId: string): Promise<SalesOrder | null> => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟订单数据
    const mockOrder: SalesOrder = {
      id: orderId,
      orderNo: `SO${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      customerName: '示例客户有限公司',
      totalAmount: 128000.00,
      createDate: new Date().toISOString(),
      status: 'confirmed',
      customerId: 'CUST001',
      contactPerson: '张三',
      contactPhone: '13800138000'
    }
    
    return mockOrder
  } catch (error) {
    console.error('加载订单信息失败:', error)
    ElMessage.error('加载订单信息失败')
    return null
  }
}

// 生成新订单编号
const generateOrderNo = (): string => {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `SO${timestamp}${random}`
}

// 处理复制操作（表格行操作）
const handleCopy = async () => {
  if (!props.orderId && !props.order) {
    ElMessage.warning('请提供订单信息')
    return
  }
  
  await openDialog()
}

// 打开对话框
const openDialog = async () => {
  try {
    // 加载订单信息
    if (props.order) {
      originalOrder.value = { ...props.order }
    } else if (props.orderId) {
      originalOrder.value = await loadOrderInfo(props.orderId)
    }
    
    if (!originalOrder.value) {
      ElMessage.error('订单信息不存在')
      return
    }
    
    // 重置表单
    resetForm()
    
    // 显示对话框
    showDialog.value = true
  } catch (error) {
    console.error('打开复制对话框失败:', error)
    ElMessage.error('操作失败')
  }
}

// 重置表单
const resetForm = () => {
  copyForm.newOrderNo = '' // 清空，准备自动生成
  copyForm.newOrderDate = new Date()
  copyForm.copyOptions = ['orderItems', 'deliveryInfo', 'paymentTerms']
  copyForm.resetStatus = true
  copyForm.notifyCustomer = false
  
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
    { progress: 30, text: '复制订单基本信息...' },
    { progress: 50, text: '复制订单明细...' },
    { progress: 70, text: '生成新订单...' },
    { progress: 90, text: '处理相关数据...' },
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
    
    // 如果未填写新订单编号，自动生成
    if (!copyForm.newOrderNo.trim()) {
      copyForm.newOrderNo = generateOrderNo()
    }
    
    // 确认对话框
    await ElMessageBox.confirm(
      `确定要复制订单 ${originalOrder.value?.orderNo} 吗？\n新订单编号: ${copyForm.newOrderNo}`,
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
      
      // 模拟创建新订单
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 创建新订单数据
      const newOrder: SalesOrder = {
        id: `NEW_${Date.now()}`,
        orderNo: copyForm.newOrderNo,
        customerName: originalOrder.value?.customerName || '',
        totalAmount: originalOrder.value?.totalAmount || 0,
        createDate: copyForm.newOrderDate.toISOString(),
        status: copyForm.resetStatus ? 'draft' : (originalOrder.value?.status || 'draft')
      }
      
      // 复制成功
      copyStatus.value = 'success'
      ElMessage.success('订单复制成功')
      
      // 通知成功
      emit('success', newOrder.id, newOrder)
      
      // 关闭对话框
      setTimeout(() => {
        showDialog.value = false
        resetForm()
      }, 1000)
    } catch (error) {
      console.error('复制订单失败:', error)
      copyStatus.value = 'exception'
      copyProgressText.value = '复制失败'
      ElMessage.error('订单复制失败')
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

// 监听orderId变化
if (props.triggerType === 'button' && props.orderId) {
  openDialog()
}
</script>

<style scoped>
.sales-order-copy {
  display: inline-block;
}

.original-order-info,
.copy-config {
  margin-bottom: 24px;
}

.original-order-info h3,
.copy-config h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
  border-left: 4px solid #1890ff;
  padding-left: 12px;
}

.original-order-info :deep(.el-descriptions) {
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
  .sales-order-copy :deep(.el-dialog) {
    width: 90% !important;
    margin: 10px;
  }
  
  .original-order-info h3,
  .copy-config h3 {
    font-size: 14px;
    padding-left: 8px;
  }
  
  .original-order-info :deep(.el-descriptions__label),
  .original-order-info :deep(.el-descriptions__content) {
    font-size: 12px;
    padding: 8px;
  }
  
  .copy-form :deep(.el-form-item__label) {
    font-size: 13px;
  }
}
</style>