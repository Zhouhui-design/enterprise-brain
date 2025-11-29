<template>
  <div class="delivery-schedule">
    <!-- 交付计划头部 -->
    <div class="schedule-header">
      <h3>交付计划</h3>
      <div class="header-actions">
        <el-button @click="useTemplate" size="small">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M14 2v6h6" stroke="currentColor" stroke-width="2"/>
          </svg>
          使用模板
        </el-button>
        <el-button @click="saveAsTemplate" size="small">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path d="M8 3a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2V5a2 2 0 00-2-2H8z" stroke="currentColor" stroke-width="2"/>
            <path d="M8 13a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2H8z" stroke="currentColor" stroke-width="2"/>
          </svg>
          保存模板
        </el-button>
      </div>
    </div>

    <!-- 交付类型选择 -->
    <div class="delivery-type-section">
      <h4>交付方式</h4>
      <el-radio-group v-model="scheduleData.deliveryType" @change="handleDeliveryTypeChange">
        <el-radio-button label="once">一次性交付</el-radio-button>
        <el-radio-button label="multiple">分批交付</el-radio-button>
        <el-radio-button label="continuous">连续交付</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 基本交付信息 -->
    <div class="basic-delivery-info">
      <div class="form-grid">
        <el-form-item label="收货地址">
          <el-select v-model="scheduleData.deliveryAddress" placeholder="选择或输入收货地址">
            <el-option
              v-for="address in customerAddresses"
              :key="address.id"
              :label="address.fullAddress"
              :value="address.id"
            >
              <div class="address-option">
                <div class="address-name">{{ address.name }}</div>
                <div class="address-detail">{{ address.fullAddress }}</div>
                <div class="address-contact">{{ address.contact }} {{ address.phone }}</div>
              </div>
            </el-option>
            <template #empty>
              <div class="new-address-btn">
                <el-button @click="addNewAddress" type="primary" text>
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" fill="none"/>
                  </svg>
                  添加新地址
                </el-button>
              </div>
            </template>
          </el-select>
        </el-form-item>
        
        <el-form-item label="预计交付日期">
          <el-date-picker
            v-model="scheduleData.deliveryDate"
            type="date"
            placeholder="选择交付日期"
            :disabled-days="disabledDateRange"
            @change="handleDateChange"
          />
        </el-form-item>
        
        <el-form-item label="配送方式">
          <el-select v-model="scheduleData.shippingMethod" @change="handleShippingMethodChange">
            <el-option
              v-for="method in shippingMethods"
              :key="method.value"
              :label="method.label"
              :value="method.value"
            >
              <div class="shipping-option">
                <span class="method-name">{{ method.label }}</span>
                <span class="method-info">{{ method.description }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="配送时效">
          <el-input v-model="scheduleData.deliveryTime" placeholder="如：3-5个工作日" />
        </el-form-item>
      </div>
    </div>

    <!-- 一次性交付 -->
    <div v-if="scheduleData.deliveryType === 'once'" class="once-delivery">
      <div class="form-grid">
        <el-form-item label="交付日期">
          <el-date-picker
            v-model="scheduleData.onceDelivery.date"
            type="date"
            placeholder="选择交付日期"
          />
        </el-form-item>
        
        <el-form-item label="交付时间段">
          <el-time-select
            v-model="scheduleData.onceDelivery.timeSlot"
            start="08:00"
            step="00:30"
            end="18:00"
            placeholder="选择时间段"
          />
        </el-form-item>
        
        <el-form-item label="是否需要安装">
          <el-radio-group v-model="scheduleData.onceDelivery.needsInstallation">
            <el-radio-button :label="false">不需要</el-radio-button>
            <el-radio-button :label="true">需要</el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item v-if="scheduleData.onceDelivery.needsInstallation" label="安装时间">
          <el-time-select
            v-model="scheduleData.onceDelivery.installationTime"
            start="08:00"
            step="00:30"
            end="18:00"
            placeholder="选择安装时间"
          />
        </el-form-item>
      </div>
    </div>

    <!-- 分批交付 -->
    <div v-if="scheduleData.deliveryType === 'multiple'" class="multiple-delivery">
      <div class="batch-header">
        <h4>分批交付计划</h4>
        <el-button @click="addBatch" type="primary" size="small">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          添加批次
        </el-button>
      </div>
      
      <div class="batches-list">
        <div v-for="(batch, index) in scheduleData.batches" :key="index" class="batch-item">
          <div class="batch-header-info">
            <h5>第 {{ index + 1 }} 批</h5>
            <el-button @click="removeBatch(index)" type="danger" size="small" text>
              删除
            </el-button>
          </div>
          
          <div class="batch-form">
            <el-form-item label="批次名称">
              <el-input v-model="batch.name" placeholder="如：首批交付" />
            </el-form-item>
            
            <el-form-item label="交付日期">
              <el-date-picker
                v-model="batch.deliveryDate"
                type="date"
                placeholder="选择交付日期"
              />
            </el-form-item>
            
            <el-form-item label="产品清单">
              <el-transfer
                v-model="batch.selectedProducts"
                :data="availableProducts"
                :titles="['可选产品', '本次交付']"
                :props="{ key: 'id', label: 'name' }"
              />
            </el-form-item>
            
            <el-form-item label="特殊说明">
              <el-input
                v-model="batch.notes"
                type="textarea"
                :rows="2"
                placeholder="批次特殊说明..."
              />
            </el-form-item>
          </div>
        </div>
      </div>
    </div>

    <!-- 连续交付 -->
    <div v-if="scheduleData.deliveryType === 'continuous'" class="continuous-delivery">
      <div class="form-grid">
        <el-form-item label="开始日期">
          <el-date-picker
            v-model="scheduleData.continuous.startDate"
            type="date"
            placeholder="选择开始日期"
          />
        </el-form-item>
        
        <el-form-item label="结束日期">
          <el-date-picker
            v-model="scheduleData.continuous.endDate"
            type="date"
            placeholder="选择结束日期"
          />
        </el-form-item>
        
        <el-form-item label="交付频率">
          <el-select v-model="scheduleData.continuous.frequency">
            <el-option label="每日" value="daily" />
            <el-option label="每周" value="weekly" />
            <el-option label="每两周" value="biweekly" />
            <el-option label="每月" value="monthly" />
            <el-option label="每季度" value="quarterly" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="每次交付量">
          <el-input-number v-model="scheduleData.continuous.quantity" :min="1" />
        </el-form-item>
        
        <el-form-item label="固定交付日" v-if="scheduleData.continuous.frequency === 'weekly'">
          <el-checkbox-group v-model="scheduleData.continuous.deliveryDays">
            <el-checkbox label="monday">周一</el-checkbox>
            <el-checkbox label="tuesday">周二</el-checkbox>
            <el-checkbox label="wednesday">周三</el-checkbox>
            <el-checkbox label="thursday">周四</el-checkbox>
            <el-checkbox label="friday">周五</el-checkbox>
            <el-checkbox label="saturday">周六</el-checkbox>
            <el-checkbox label="sunday">周日</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </div>
    </div>

    <!-- 交付要求 -->
    <div class="delivery-requirements">
      <h4>交付要求</h4>
      <div class="requirements-grid">
        <el-form-item label="包装要求">
          <el-checkbox-group v-model="scheduleData.requirements.packaging">
            <el-checkbox label="standard">标准包装</el-checkbox>
            <el-checkbox label="waterproof">防潮包装</el-checkbox>
            <el-checkbox label="shockproof">防震包装</el-checkbox>
            <el-checkbox label="custom">定制包装</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="运输要求">
          <el-checkbox-group v-model="scheduleData.requirements.transportation">
            <el-checkbox label="express">快递</el-checkbox>
            <el-checkbox label="logistics">物流</el-checkbox>
            <el-checkbox label="refrigerated">冷链运输</el-checkbox>
            <el-checkbox label="dangerous">危险品运输</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="签收要求">
          <el-checkbox-group v-model="scheduleData.requirements.receiving">
            <el-checkbox label="signature">本人签收</el-checkbox>
            <el-checkbox label="id">身份证验证</el-checkbox>
            <el-checkbox label="photo">拍照签收</el-checkbox>
            <el-checkbox label="unbox">开箱验货</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </div>
    </div>

    <!-- 备注信息 -->
    <div class="delivery-notes">
      <h4>备注信息</h4>
      <el-form-item label="交付备注">
        <el-input
          v-model="scheduleData.notes"
          type="textarea"
          :rows="3"
          placeholder="请输入交付相关的特殊要求或备注..."
        />
      </el-form-item>
      
      <el-form-item label="联系人信息">
        <div class="contact-info">
          <el-input v-model="scheduleData.contactPerson" placeholder="联系人姓名" />
          <el-input v-model="scheduleData.contactPhone" placeholder="联系电话" />
          <el-input v-model="scheduleData.contactEmail" placeholder="邮箱地址" />
        </div>
      </el-form-item>
    </div>

    <!-- 交付预览 -->
    <div class="delivery-preview">
      <h4>交付预览</h4>
      <div class="preview-content">
        <div class="preview-item">
          <span class="label">交付方式：</span>
          <span class="value">{{ getDeliveryTypeLabel(scheduleData.deliveryType) }}</span>
        </div>
        <div class="preview-item">
          <span class="label">预计交付：</span>
          <span class="value">{{ formatDate(scheduleData.deliveryDate) }}</span>
        </div>
        <div class="preview-item">
          <span class="label">配送方式：</span>
          <span class="value">{{ getShippingMethodLabel(scheduleData.shippingMethod) }}</span>
        </div>
        <div v-if="scheduleData.deliveryType === 'multiple'" class="preview-item">
          <span class="label">分批次数：</span>
          <span class="value">{{ scheduleData.batches.length }} 次</span>
        </div>
      </div>
    </div>

    <!-- 模板选择弹窗 -->
    <el-dialog v-model="templateVisible" title="选择交付模板" width="600px">
      <div class="template-list">
        <div
          v-for="template in deliveryTemplates"
          :key="template.id"
          class="template-item"
          @click="selectTemplate(template)"
        >
          <div class="template-header">
            <h5>{{ template.name }}</h5>
            <el-tag :type="template.type === 'standard' ? 'primary' : 'success'" size="small">
              {{ template.type === 'standard' ? '标准' : '自定义' }}
            </el-tag>
          </div>
          <div class="template-content">
            <p>{{ template.description }}</p>
            <div class="template-meta">
              <span>创建时间：{{ formatDate(template.createdAt) }}</span>
              <span>使用次数：{{ template.usageCount }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="templateVisible = false">取消</el-button>
        <el-button @click="createNewTemplate" type="primary">创建新模板</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

// 接口定义
interface DeliverySchedule {
  deliveryType: 'once' | 'multiple' | 'continuous'
  deliveryAddress: string
  deliveryDate: Date | null
  shippingMethod: string
  deliveryTime: string
  onceDelivery: {
    date: Date | null
    timeSlot: string
    needsInstallation: boolean
    installationTime: string
  }
  batches: BatchItem[]
  continuous: {
    startDate: Date | null
    endDate: Date | null
    frequency: string
    quantity: number
    deliveryDays: string[]
  }
  requirements: {
    packaging: string[]
    transportation: string[]
    receiving: string[]
  }
  notes: string
  contactPerson: string
  contactPhone: string
  contactEmail: string
}

interface BatchItem {
  id: string
  name: string
  deliveryDate: Date | null
  selectedProducts: string[]
  notes: string
}

interface Address {
  id: string
  name: string
  fullAddress: string
  contact: string
  phone: string
  isDefault: boolean
}

interface ShippingMethod {
  value: string
  label: string
  description: string
}

interface DeliveryTemplate {
  id: string
  name: string
  type: 'standard' | 'custom'
  description: string
  template: DeliverySchedule
  createdAt: Date
  usageCount: number
}

// Props & Emits
const props = defineProps<{
  schedule?: DeliverySchedule
}>()

const emit = defineEmits<{
  'update:schedule': [schedule: DeliverySchedule]
  'schedule-updated': [schedule: DeliverySchedule]
}>()

// 响应式数据
const scheduleData = reactive<DeliverySchedule>({
  deliveryType: 'once',
  deliveryAddress: '',
  deliveryDate: null,
  shippingMethod: 'standard',
  deliveryTime: '',
  onceDelivery: {
    date: null,
    timeSlot: '',
    needsInstallation: false,
    installationTime: ''
  },
  batches: [],
  continuous: {
    startDate: null,
    endDate: null,
    frequency: 'weekly',
    quantity: 1,
    deliveryDays: []
  },
  requirements: {
    packaging: ['standard'],
    transportation: ['express'],
    receiving: ['signature']
  },
  notes: '',
  contactPerson: '',
  contactPhone: '',
  contactEmail: ''
})

const templateVisible = ref(false)

const customerAddresses = ref<Address[]>([
  {
    id: '1',
    name: '总部办公室',
    fullAddress: '北京市朝阳区建国路88号SOHO现代城A座2801',
    contact: '张经理',
    phone: '13800138001',
    isDefault: true
  },
  {
    id: '2',
    name: '生产基地',
    fullAddress: '北京市大兴区经济开发区科创街88号',
    contact: '李主管',
    phone: '13800138002',
    isDefault: false
  }
])

const shippingMethods = ref<ShippingMethod[]>([
  {
    value: 'standard',
    label: '标准配送',
    description: '3-5个工作日'
  },
  {
    value: 'express',
    label: '快速配送',
    description: '1-2个工作日'
  },
  {
    value: 'economy',
    label: '经济配送',
    description: '7-10个工作日'
  },
  {
    value: 'self',
    label: '自提',
    description: '客户自行提货'
  }
])

const deliveryTemplates = ref<DeliveryTemplate[]>([
  {
    id: '1',
    name: '标准交付模板',
    type: 'standard',
    description: '适用于标准产品的一次性交付模板',
    template: {} as DeliverySchedule,
    createdAt: new Date('2024-01-01'),
    usageCount: 156
  },
  {
    id: '2',
    name: '分期交付模板',
    type: 'custom',
    description: '适用于大型设备或大宗商品的分期交付',
    template: {} as DeliverySchedule,
    createdAt: new Date('2024-02-01'),
    usageCount: 42
  }
])

const availableProducts = ref([
  { id: '1', name: '产品A' },
  { id: '2', name: '产品B' },
  { id: '3', name: '产品C' }
])

// 方法
const getDeliveryTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    once: '一次性交付',
    multiple: '分批交付',
    continuous: '连续交付'
  }
  return labels[type] || type
}

const getShippingMethodLabel = (method: string): string => {
  const methodObj = shippingMethods.value.find(m => m.value === method)
  return methodObj?.label || method
}

const formatDate = (date: Date | null): string => {
  if (!date) return '未设置'
  return date.toLocaleDateString('zh-CN')
}

const disabledDateRange = (time: Date) => {
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000
}

// 事件处理
const handleDeliveryTypeChange = (type: string) => {
  if (type === 'multiple' && scheduleData.batches.length === 0) {
    addBatch()
  }
}

const handleShippingMethodChange = (method: string) => {
  const methodObj = shippingMethods.value.find(m => m.value === method)
  if (methodObj) {
    scheduleData.deliveryTime = methodObj.description
  }
}

const handleDateChange = (date: Date) => {
  if (scheduleData.deliveryType === 'once') {
    scheduleData.onceDelivery.date = date
  }
}

const addBatch = () => {
  const newBatch: BatchItem = {
    id: Date.now().toString(),
    name: `第${scheduleData.batches.length + 1}批`,
    deliveryDate: null,
    selectedProducts: [],
    notes: ''
  }
  scheduleData.batches.push(newBatch)
  emitUpdate()
}

const removeBatch = (index: number) => {
  scheduleData.batches.splice(index, 1)
  emitUpdate()
}

const addNewAddress = () => {
  ElMessage.info('添加新地址功能开发中...')
}

const useTemplate = () => {
  templateVisible.value = true
}

const selectTemplate = (template: DeliveryTemplate) => {
  // 应用模板
  Object.assign(scheduleData, template.template)
  templateVisible.value = false
  emitUpdate()
  ElMessage.success(`已应用模板：${template.name}`)
}

const saveAsTemplate = () => {
  ElMessage.success('模板保存成功')
}

const createNewTemplate = () => {
  templateVisible.value = false
  ElMessage.info('创建新模板功能开发中...')
}

const emitUpdate = () => {
  emit('update:schedule', { ...scheduleData })
  emit('schedule-updated', { ...scheduleData })
}

// 监听数据变化
watch(() => props.schedule, (newSchedule) => {
  if (newSchedule) {
    Object.assign(scheduleData, newSchedule)
  }
}, { deep: true, immediate: true })

watch(scheduleData, () => {
  emitUpdate()
}, { deep: true })
</script>

<style scoped>
.delivery-schedule {
  background: var(--surface-color);
  border-radius: 12px;
  padding: 1.5rem;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.schedule-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.delivery-type-section {
  margin-bottom: 1.5rem;
}

.delivery-type-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.basic-delivery-info,
.once-delivery,
.multiple-delivery,
.continuous-delivery,
.delivery-requirements,
.delivery-notes,
.delivery-preview {
  margin-bottom: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.address-option {
  display: flex;
  flex-direction: column;
}

.address-name {
  font-weight: 600;
  color: var(--text-primary);
}

.address-detail {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.address-contact {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.new-address-btn {
  text-align: center;
  padding: 1rem;
}

.shipping-option {
  display: flex;
  flex-direction: column;
}

.method-name {
  font-weight: 600;
  color: var(--text-primary);
}

.method-info {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.batch-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.batches-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.batch-item {
  background: var(--background-color);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid var(--border-color);
}

.batch-header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.batch-header-info h5 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.batch-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.requirements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.requirements-grid h4 {
  grid-column: 1 / -1;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.contact-info {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.preview-content {
  background: var(--background-color);
  border-radius: 8px;
  padding: 1rem;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.preview-item:last-child {
  border-bottom: none;
}

.preview-item .label {
  font-weight: 500;
  color: var(--text-secondary);
}

.preview-item .value {
  font-weight: 600;
  color: var(--text-primary);
}

.template-list {
  max-height: 400px;
  overflow-y: auto;
}

.template-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.template-item:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.template-header h5 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.template-content p {
  margin: 0.5rem 0;
  color: var(--text-secondary);
}

.template-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .delivery-schedule {
    padding: 1rem;
  }
  
  .schedule-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .batch-form {
    grid-template-columns: 1fr;
  }
  
  .requirements-grid {
    grid-template-columns: 1fr;
  }
  
  .contact-info {
    flex-direction: column;
  }
  
  .template-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .template-meta {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>