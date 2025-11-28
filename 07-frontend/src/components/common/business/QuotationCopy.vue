<template>
  <div class="quotation-copy">
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
      title="复制报价单"
      width="700px"
      :before-close="handleDialogClose"
    >
      <!-- 原报价单信息 -->
      <div v-if="originalQuotation" class="original-quotation-info">
        <h3>原报价单信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="报价单号">{{ originalQuotation.quotationCode }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ originalQuotation.customerName }}</el-descriptions-item>
          <el-descriptions-item label="报价日期">{{ formatDate(originalQuotation.quotationDate) }}</el-descriptions-item>
          <el-descriptions-item label="有效期至">{{ formatDate(originalQuotation.validUntil) }}</el-descriptions-item>
          <el-descriptions-item label="报价金额">{{ formatCurrency(originalQuotation.totalAmount) }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusText(originalQuotation.status) }}</el-descriptions-item>
          <el-descriptions-item label="负责人" :span="2">{{ originalQuotation.salesPerson || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 报价产品列表预览 -->
        <div v-if="originalQuotation.products && originalQuotation.products.length > 0" class="products-preview">
          <h4>产品列表 (共{{ originalQuotation.products.length }}项)</h4>
          <el-table :data="originalQuotation.products.slice(0, 3)" border size="small" style="width: 100%">
            <el-table-column prop="productCode" label="产品编码" width="120" />
            <el-table-column prop="productName" label="产品名称" width="200" />
            <el-table-column prop="quantity" label="数量" width="80" align="right" />
            <el-table-column prop="unitPrice" label="单价" width="100" align="right" :formatter="formatCurrency" />
            <el-table-column prop="amount" label="金额" width="120" align="right" :formatter="formatCurrency" />
          </el-table>
          <p v-if="originalQuotation.products.length > 3" class="more-products">
            还有 {{ originalQuotation.products.length - 3 }} 项未显示...
          </p>
        </div>
      </div>

      <!-- 复制配置 -->
      <div class="copy-config">
        <h3>复制配置</h3>
        <el-form label-position="top" :model="copyForm" :rules="copyRules" ref="copyFormRef">
          <!-- 报价单基本信息 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="新报价单号" prop="newQuotationCode">
                <el-input v-model="copyForm.newQuotationCode" placeholder="自动生成或手动输入" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="报价日期" prop="quotationDate">
                <el-date-picker
                  v-model="copyForm.quotationDate"
                  type="date"
                  placeholder="选择报价日期"
                  style="width: 100%"
                  :disabled="disabled"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="有效期至" prop="validUntil">
                <el-date-picker
                  v-model="copyForm.validUntil"
                  type="date"
                  placeholder="选择有效期至日期"
                  style="width: 100%"
                  :disabled="disabled"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否调整价格" prop="adjustPrice">
                <el-switch
                  v-model="copyForm.adjustPrice"
                  active-text="是"
                  inactive-text="否"
                  @change="handleAdjustPriceChange"
                  :disabled="disabled"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 价格调整配置 -->
          <el-form-item v-if="copyForm.adjustPrice" label="价格调整方式" prop="priceAdjustmentMethod">
            <el-radio-group v-model="copyForm.priceAdjustmentMethod" :disabled="disabled">
              <el-radio label="percentage">百分比调整</el-radio>
              <el-radio label="fixed">固定值调整</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item
            v-if="copyForm.adjustPrice && copyForm.priceAdjustmentMethod === 'percentage'"
            label="调整百分比"
            prop="priceAdjustmentValue"
          >
            <el-input-number
              v-model="copyForm.priceAdjustmentValue"
              :min="-100"
              :max="100"
              :step="0.01"
              placeholder="输入百分比"
              :disabled="disabled"
            >
              <template #append>%</template>
            </el-input-number>
          </el-form-item>

          <el-form-item
            v-else-if="copyForm.adjustPrice && copyForm.priceAdjustmentMethod === 'fixed'"
            label="调整金额"
            prop="priceAdjustmentValue"
          >
            <el-input-number
              v-model="copyForm.priceAdjustmentValue"
              :min="-9999999"
              :max="9999999"
              :step="0.01"
              placeholder="输入金额"
              :disabled="disabled"
            >
              <template #append>¥</template>
            </el-input-number>
          </el-form-item>

          <!-- 复制选项 -->
          <el-form-item label="复制内容">
            <el-checkbox-group v-model="copyForm.copyOptions" :disabled="disabled">
              <el-checkbox value="basicInfo" :disabled="disabled">基本信息</el-checkbox>
              <el-checkbox value="products" :disabled="disabled">产品信息</el-checkbox>
              <el-checkbox value="customerInfo" :disabled="disabled">客户信息</el-checkbox>
              <el-checkbox value="terms" :disabled="disabled">付款条件</el-checkbox>
              <el-checkbox value="attachments" :disabled="disabled">附件文件</el-checkbox>
              <el-checkbox value="comments" :disabled="disabled">备注信息</el-checkbox>
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
              v-model="copyForm.copyRevisionNumber"
              active-text="保留版本号"
              inactive-text="重置版本号为1"
              :disabled="disabled"
            />
          </el-form-item>

          <el-form-item>
            <el-switch
              v-model="copyForm.generateNewNumber"
              active-text="生成新报价单号"
              inactive-text="复制原报价单号格式"
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

// 产品数据类型
interface Product {
  id: string
  productCode: string
  productName: string
  quantity: number
  unitPrice: number
  amount: number
  [key: string]: any
}

// 报价单数据类型
interface Quotation {
  id: string
  quotationCode: string
  customerName: string
  quotationDate: string
  validUntil: string
  totalAmount: number
  status: string
  salesPerson?: string
  revisionNumber?: number
  products?: Product[]
  [key: string]: any
}

// Props 定义
interface Props {
  quotationId?: string
  quotation?: Quotation
  triggerType?: 'button' | 'table-action'
  buttonText?: string
  disabled?: boolean
  showQuotationInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  quotationId: '',
  triggerType: 'button',
  buttonText: '复制报价单',
  disabled: false,
  showQuotationInfo: true
})

// Emits 定义
const emit = defineEmits<{
  'success': [newQuotationId: string, newQuotation: Quotation]
  'cancel': []
  'error': [error: Error]
}>()

// 响应式数据
const showDialog = ref(false)
const originalQuotation = ref<Quotation | null>(null)
const copying = ref(false)
const copyProgress = ref(0)
const copyProgressText = ref('')
const copyStatus = ref<'success' | 'exception' | 'warning' | 'info'>('info')
const copyFormRef = ref()

// 复制表单数据
const copyForm = reactive({
  newQuotationCode: '',
  quotationDate: new Date(),
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 默认有效期30天
  adjustPrice: false,
  priceAdjustmentMethod: 'percentage',
  priceAdjustmentValue: 0,
  copyOptions: ['basicInfo', 'products', 'customerInfo', 'terms'],
  resetStatus: true,
  copyRevisionNumber: false,
  generateNewNumber: true
})

// 表单验证规则
const copyRules = {
  newQuotationCode: [
    {
      validator: (rule: any, value: string, callback: any) => {
        if (!value || value.trim()) {
          callback()
        } else {
          callback(new Error('报价单号不能为空'))
        }
      },
      trigger: 'blur'
    }
  ],
  quotationDate: [
    {
      required: true,
      message: '请选择报价日期',
      trigger: 'change'
    }
  ],
  validUntil: [
    {
      required: true,
      message: '请选择有效期至日期',
      trigger: 'change'
    },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (value && copyForm.quotationDate && new Date(value) < new Date(copyForm.quotationDate)) {
          callback(new Error('有效期至日期不能早于报价日期'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 格式化日期
const formatDate = (date: string): string => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

// 格式化货币
const formatCurrency = (value: number): string => {
  if (value === undefined || value === null) return '¥0.00'
  return `¥${value.toFixed(2)}`
}

// 获取状态文本
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'draft': '草稿',
    'pending': '待审核',
    'approved': '已审核',
    'sent': '已发送',
    'negotiating': '协商中',
    'accepted': '已接受',
    'rejected': '已拒绝',
    'expired': '已过期'
  }
  return statusMap[status] || status
}

// 加载报价单信息
const loadQuotationInfo = async (quotationId: string): Promise<Quotation | null> => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 生成模拟产品数据
    const mockProducts: Product[] = [
      {
        id: 'p1',
        productCode: 'PROD001',
        productName: '高级商务办公椅',
        quantity: 5,
        unitPrice: 899.00,
        amount: 4495.00
      },
      {
        id: 'p2',
        productCode: 'PROD002',
        productName: '人体工学电脑桌',
        quantity: 3,
        unitPrice: 1299.00,
        amount: 3897.00
      },
      {
        id: 'p3',
        productCode: 'PROD003',
        productName: '无线键盘鼠标套装',
        quantity: 5,
        unitPrice: 199.00,
        amount: 995.00
      }
    ]
    
    // 模拟报价单数据
    const mockQuotation: Quotation = {
      id: quotationId,
      quotationCode: `QT${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      customerName: '广州科技有限公司',
      quotationDate: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: mockProducts.reduce((sum, p) => sum + p.amount, 0),
      status: 'sent',
      salesPerson: '张三',
      revisionNumber: 1,
      products: mockProducts
    }
    
    return mockQuotation
  } catch (error) {
    console.error('加载报价单信息失败:', error)
    ElMessage.error('加载报价单信息失败')
    return null
  }
}

// 生成新报价单号
const generateQuotationCode = (): string => {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `QT${new Date().getFullYear()}${timestamp}${random}`
}

// 处理价格调整变化
const handleAdjustPriceChange = () => {
  if (!copyForm.adjustPrice) {
    copyForm.priceAdjustmentValue = 0
  }
}

// 处理复制操作（表格行操作）
const handleCopy = async () => {
  if (!props.quotationId && !props.quotation) {
    ElMessage.warning('请提供报价单信息')
    return
  }
  
  await openDialog()
}

// 打开对话框
const openDialog = async () => {
  try {
    // 加载报价单信息
    if (props.quotation) {
      originalQuotation.value = { ...props.quotation }
    } else if (props.quotationId) {
      originalQuotation.value = await loadQuotationInfo(props.quotationId)
    }
    
    if (!originalQuotation.value) {
      ElMessage.error('报价单信息不存在')
      return
    }
    
    // 重置表单
    resetForm()
    
    showDialog.value = true
  } catch (error) {
    console.error('打开复制对话框失败:', error)
    ElMessage.error('操作失败')
  }
}

// 重置表单
const resetForm = () => {
  copyForm.newQuotationCode = '' // 清空，准备自动生成
  copyForm.quotationDate = new Date()
  copyForm.validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  copyForm.adjustPrice = false
  copyForm.priceAdjustmentMethod = 'percentage'
  copyForm.priceAdjustmentValue = 0
  copyForm.copyOptions = ['basicInfo', 'products', 'customerInfo', 'terms']
  copyForm.resetStatus = true
  copyForm.copyRevisionNumber = false
  copyForm.generateNewNumber = true
  
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

// 调整产品价格
const adjustProductPrices = (products: Product[]): Product[] => {
  return products.map(product => {
    const newProduct = { ...product }
    
    if (copyForm.adjustPrice) {
      if (copyForm.priceAdjustmentMethod === 'percentage') {
        // 百分比调整
        const adjustmentFactor = 1 + (copyForm.priceAdjustmentValue / 100)
        newProduct.unitPrice = Math.round(newProduct.unitPrice * adjustmentFactor * 100) / 100
      } else if (copyForm.priceAdjustmentMethod === 'fixed') {
        // 固定值调整
        newProduct.unitPrice = Math.max(0, Math.round((newProduct.unitPrice + copyForm.priceAdjustmentValue) * 100) / 100)
      }
      
      // 重新计算金额
      newProduct.amount = Math.round(newProduct.unitPrice * newProduct.quantity * 100) / 100
    }
    
    return newProduct
  })
}

// 模拟复制进度
const simulateCopyProgress = async (): Promise<void> => {
  const steps = [
    { progress: 10, text: '准备复制数据...' },
    { progress: 25, text: '复制报价单基本信息...' },
    { progress: 40, text: '复制产品信息...' },
    { progress: 55, text: '处理客户信息...' },
    { progress: 70, text: '调整价格信息...' },
    { progress: 85, text: '生成新报价单...' },
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
    
    // 如果未填写新报价单号，自动生成
    if (!copyForm.newQuotationCode.trim()) {
      copyForm.newQuotationCode = generateQuotationCode()
    }
    
    // 确认对话框
    await ElMessageBox.confirm(
      `确定要复制报价单 ${originalQuotation.value?.quotationCode} (${originalQuotation.value?.customerName}) 吗？\n新报价单号: ${copyForm.newQuotationCode}`,
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
      
      // 准备新报价单数据
      let newProducts: Product[] = []
      if (originalQuotation.value?.products && copyForm.copyOptions.includes('products')) {
        newProducts = adjustProductPrices([...originalQuotation.value.products])
      }
      
      // 计算新总价
      const newTotalAmount = newProducts.reduce((sum, p) => sum + p.amount, 0)
      
      // 创建新报价单
      const newQuotation: Quotation = {
        id: `NEW_${Date.now()}`,
        quotationCode: copyForm.newQuotationCode,
        customerName: originalQuotation.value?.customerName || '',
        quotationDate: copyForm.quotationDate.toISOString(),
        validUntil: copyForm.validUntil.toISOString(),
        totalAmount: newTotalAmount,
        status: copyForm.resetStatus ? 'draft' : (originalQuotation.value?.status || 'draft'),
        salesPerson: originalQuotation.value?.salesPerson,
        revisionNumber: copyForm.copyRevisionNumber ? (originalQuotation.value?.revisionNumber || 1) : 1,
        products: newProducts
      }
      
      // 复制成功
      copyStatus.value = 'success'
      ElMessage.success('报价单复制成功')
      
      // 通知成功
      emit('success', newQuotation.id, newQuotation)
      
      // 关闭对话框
      setTimeout(() => {
        showDialog.value = false
        resetForm()
      }, 1000)
    } catch (error) {
      console.error('复制报价单失败:', error)
      copyStatus.value = 'exception'
      copyProgressText.value = '复制失败'
      ElMessage.error('报价单复制失败')
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

// 监听quotationId变化
if (props.triggerType === 'button' && props.quotationId) {
  openDialog()
}
</script>

<style scoped>
.quotation-copy {
  display: inline-block;
}

.original-quotation-info,
.copy-config {
  margin-bottom: 24px;
}

.original-quotation-info h3,
.copy-config h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
  border-left: 4px solid #1890ff;
  padding-left: 12px;
}

.original-quotation-info h4 {
  font-size: 14px;
  font-weight: 500;
  margin: 16px 0 12px 0;
  color: #606266;
}

.original-quotation-info :deep(.el-descriptions) {
  margin-bottom: 0;
}

.products-preview :deep(.el-table) {
  margin-bottom: 8px;
}

.more-products {
  text-align: center;
  color: #909399;
  font-size: 12px;
  margin: 4px 0 0 0;
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
  .quotation-copy :deep(.el-dialog) {
    width: 95% !important;
    margin: 5px;
  }
  
  .original-quotation-info h3,
  .copy-config h3 {
    font-size: 14px;
    padding-left: 8px;
  }
  
  .original-quotation-info :deep(.el-descriptions__label),
  .original-quotation-info :deep(.el-descriptions__content) {
    font-size: 12px;
    padding: 8px;
  }
  
  .copy-config :deep(.el-form-item__label) {
    font-size: 13px;
  }
  
  .products-preview :deep(.el-table) {
    font-size: 12px;
  }
  
  .products-preview :deep(.el-table__column) {
    height: 32px;
  }
}
</style>