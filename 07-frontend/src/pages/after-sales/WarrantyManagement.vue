<template>
  <div class="warranty-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>质保管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <i class="fas fa-plus"></i> 新建质保
        </el-button>
        <el-button @click="exportData">
          <i class="fas fa-download"></i> 导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(stat, index) in statsData" :key="index">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" :style="{ backgroundColor: stat.color }">
                <i :class="stat.icon"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
                <div class="stat-trend" :class="stat.trend">
                  <i :class="stat.trend === 'up' ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
                  {{ stat.change }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索筛选 -->
    <div class="filter-section">
      <el-card>
        <el-form :model="searchForm" inline>
          <el-form-item label="质保编号">
            <el-input v-model="searchForm.warrantyNumber" placeholder="请输入质保编号" clearable />
          </el-form-item>
          <el-form-item label="产品编号">
            <el-input v-model="searchForm.productNumber" placeholder="请输入产品编号" clearable />
          </el-form-item>
          <el-form-item label="客户名称">
            <el-input v-model="searchForm.customerName" placeholder="请输入客户名称" clearable />
          </el-form-item>
          <el-form-item label="质保类型">
            <el-select v-model="searchForm.warrantyType" placeholder="请选择质保类型" clearable>
              <el-option label="标准质保" value="standard" />
              <el-option label="延长质保" value="extended" />
              <el-option label="增值质保" value="premium" />
            </el-select>
          </el-form-item>
          <el-form-item label="质保状态">
            <el-select v-model="searchForm.status" placeholder="请选择质保状态" clearable>
              <el-option label="生效中" value="active" />
              <el-option label="即将到期" value="expiring" />
              <el-option label="已过期" value="expired" />
              <el-option label="已激活" value="activated" />
            </el-select>
          </el-form-item>
          <el-form-item label="到期时间">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 质保列表 -->
    <div class="warranty-list">
      <el-card>
        <el-table :data="warrantyList" v-loading="loading" stripe>
          <el-table-column prop="warrantyNumber" label="质保编号" width="160" />
          <el-table-column prop="productNumber" label="产品编号" width="140" />
          <el-table-column prop="productName" label="产品名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="customerName" label="客户名称" width="120" />
          <el-table-column prop="warrantyType" label="质保类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getWarrantyTypeTag(row.warrantyType)">
                {{ getWarrantyTypeLabel(row.warrantyType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="warrantyPeriod" label="质保期限" width="120" />
          <el-table-column prop="startDate" label="生效时间" width="140" />
          <el-table-column prop="endDate" label="到期时间" width="140" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remainingDays" label="剩余天数" width="100">
            <template #default="{ row }">
              <span :class="getRemainingDaysClass(row.remainingDays)">
                {{ row.remainingDays > 0 ? `${row.remainingDays}天` : '已过期' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewWarranty(row)">查看</el-button>
              <el-button size="small" type="primary" @click="editWarranty(row)">编辑</el-button>
              <el-button size="small" type="warning" @click="extendWarranty(row)" v-if="row.status !== 'expired'">
                延期
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 新建/编辑质保对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingWarranty ? '编辑质保' : '新建质保'"
      width="700px"
      @close="resetForm"
    >
      <el-form :model="warrantyForm" :rules="warrantyRules" ref="warrantyFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="质保编号" prop="warrantyNumber" v-if="editingWarranty">
              <el-input v-model="warrantyForm.warrantyNumber" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品编号" prop="productNumber">
              <el-input v-model="warrantyForm.productNumber" placeholder="请输入产品编号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品名称" prop="productName">
              <el-input v-model="warrantyForm.productName" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customerName">
              <el-input v-model="warrantyForm.customerName" placeholder="请输入客户名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="warrantyForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="质保类型" prop="warrantyType">
              <el-select v-model="warrantyForm.warrantyType" placeholder="请选择质保类型" style="width: 100%">
                <el-option label="标准质保" value="standard" />
                <el-option label="延长质保" value="extended" />
                <el-option label="增值质保" value="premium" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="质保期限" prop="warrantyPeriod">
              <el-select v-model="warrantyForm.warrantyPeriod" placeholder="请选择质保期限" style="width: 100%">
                <el-option label="6个月" value="6" />
                <el-option label="1年" value="12" />
                <el-option label="2年" value="24" />
                <el-option label="3年" value="36" />
                <el-option label="5年" value="60" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生效时间" prop="startDate">
              <el-date-picker
                v-model="warrantyForm.startDate"
                type="date"
                placeholder="选择生效时间"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="质保范围" prop="coverage">
          <el-checkbox-group v-model="warrantyForm.coverage">
            <el-checkbox label="hardware">硬件</el-checkbox>
            <el-checkbox label="software">软件</el-checkbox>
            <el-checkbox label="installation">安装</el-checkbox>
            <el-checkbox label="maintenance">维护</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input
            v-model="warrantyForm.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入备注说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="saveWarranty" :loading="saving">
            {{ editingWarranty ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 质保详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="质保详情" width="800px">
      <div class="warranty-detail" v-if="currentWarranty">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="质保编号">{{ currentWarranty.warrantyNumber }}</el-descriptions-item>
          <el-descriptions-item label="产品编号">{{ currentWarranty.productNumber }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ currentWarranty.productName }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ currentWarranty.customerName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentWarranty.phone }}</el-descriptions-item>
          <el-descriptions-item label="质保类型">
            <el-tag :type="getWarrantyTypeTag(currentWarranty.warrantyType)">
              {{ getWarrantyTypeLabel(currentWarranty.warrantyType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="质保期限">{{ currentWarranty.warrantyPeriod }}</el-descriptions-item>
          <el-descriptions-item label="生效时间">{{ currentWarranty.startDate }}</el-descriptions-item>
          <el-descriptions-item label="到期时间">{{ currentWarranty.endDate }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(currentWarranty.status)">
              {{ getStatusLabel(currentWarranty.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="剩余天数">
            <span :class="getRemainingDaysClass(currentWarranty.remainingDays)">
              {{ currentWarranty.remainingDays > 0 ? `${currentWarranty.remainingDays}天` : '已过期' }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="质保范围" :span="2">
            <el-tag v-for="item in currentWarranty.coverage" :key="item" style="margin-right: 5px">
              {{ getCoverageLabel(item) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注说明" :span="2" v-if="currentWarranty.remarks">
            {{ currentWarranty.remarks }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="warranty-history" v-if="currentWarranty.history && currentWarranty.history.length > 0">
          <h4>质保记录</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(record, index) in currentWarranty.history"
              :key="index"
              :timestamp="record.time"
              :color="record.type === 'create' ? '#67C23A' : record.type === 'extend' ? '#409EFF' : '#E6A23C'"
            >
              <div class="record-content">
                <div class="record-title">{{ record.title }}</div>
                <div class="record-desc">{{ record.description }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDetailDialog = false">关闭</el-button>
          <el-button type="primary" @click="editWarranty(currentWarranty)" v-if="currentWarranty">
            编辑
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 延期对话框 -->
    <el-dialog v-model="showExtendDialog" title="质保延期" width="500px">
      <el-form :model="extendForm" :rules="extendRules" ref="extendFormRef" label-width="100px">
        <el-form-item label="延期时长" prop="extendMonths">
          <el-select v-model="extendForm.extendMonths" placeholder="请选择延期时长" style="width: 100%">
            <el-option label="1个月" :value="1" />
            <el-option label="3个月" :value="3" />
            <el-option label="6个月" :value="6" />
            <el-option label="1年" :value="12" />
          </el-select>
        </el-form-item>
        <el-form-item label="延期原因" prop="reason">
          <el-input
            v-model="extendForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入延期原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showExtendDialog = false">取消</el-button>
          <el-button type="primary" @click="submitExtend" :loading="extending">
            确认延期
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Warranty {
  id: string
  warrantyNumber: string
  productNumber: string
  productName: string
  customerName: string
  phone: string
  warrantyType: string
  warrantyPeriod: string
  coverage: string[]
  startDate: string
  endDate: string
  status: string
  remainingDays: number
  remarks?: string
  history?: Array<{
    type: string
    title: string
    description: string
    time: string
  }>
}

const loading = ref(false)
const saving = ref(false)
const extending = ref(false)
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showExtendDialog = ref(false)
const editingWarranty = ref<Warranty | null>(null)
const currentWarranty = ref<Warranty | null>(null)

const searchForm = reactive({
  warrantyNumber: '',
  productNumber: '',
  customerName: '',
  warrantyType: '',
  status: '',
  dateRange: null as [string, string] | null
})

const warrantyForm = reactive({
  warrantyNumber: '',
  productNumber: '',
  productName: '',
  customerName: '',
  phone: '',
  warrantyType: '',
  warrantyPeriod: '',
  coverage: [],
  startDate: '',
  remarks: ''
})

const extendForm = reactive({
  extendMonths: null,
  reason: ''
})

const warrantyRules = {
  productNumber: [
    { required: true, message: '请输入产品编号', trigger: 'blur' }
  ],
  productName: [
    { required: true, message: '请输入产品名称', trigger: 'blur' }
  ],
  customerName: [
    { required: true, message: '请输入客户名称', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  warrantyType: [
    { required: true, message: '请选择质保类型', trigger: 'change' }
  ],
  warrantyPeriod: [
    { required: true, message: '请选择质保期限', trigger: 'change' }
  ],
  startDate: [
    { required: true, message: '请选择生效时间', trigger: 'change' }
  ]
}

const extendRules = {
  extendMonths: [
    { required: true, message: '请选择延期时长', trigger: 'change' }
  ],
  reason: [
    { required: true, message: '请输入延期原因', trigger: 'blur' }
  ]
}

const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

const statsData = reactive([
  { label: '总质保数', value: '1,234', icon: 'fas fa-shield-alt', color: '#409EFF', trend: 'up', change: '8%' },
  { label: '生效中', value: '856', icon: 'fas fa-check-circle', color: '#67C23A', trend: 'up', change: '5%' },
  { label: '即将到期', value: '89', icon: 'fas fa-exclamation-triangle', color: '#E6A23C', trend: 'down', change: '3%' },
  { label: '已过期', value: '289', icon: 'fas fa-times-circle', color: '#F56C6C', trend: 'up', change: '2%' }
])

const warrantyList = ref<Warranty[]>([])

const getWarrantyTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    standard: '标准质保',
    extended: '延长质保',
    premium: '增值质保'
  }
  return typeMap[type] || type
}

const getWarrantyTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    standard: '',
    extended: 'warning',
    premium: 'success'
  }
  return typeMap[type] || ''
}

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    active: '生效中',
    expiring: '即将到期',
    expired: '已过期',
    activated: '已激活'
  }
  return statusMap[status] || status
}

const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    active: 'success',
    expiring: 'warning',
    expired: 'danger',
    activated: 'info'
  }
  return statusMap[status] || ''
}

const getCoverageLabel = (coverage: string) => {
  const coverageMap: Record<string, string> = {
    hardware: '硬件',
    software: '软件',
    installation: '安装',
    maintenance: '维护'
  }
  return coverageMap[coverage] || coverage
}

const getRemainingDaysClass = (days: number) => {
  if (days <= 0) return 'expired'
  if (days <= 30) return 'warning'
  return 'normal'
}

const mockWarranties: Warranty[] = [
  {
    id: '1',
    warrantyNumber: 'WY2024010001',
    productNumber: 'PRD001',
    productName: '智能控制系统',
    customerName: '张先生',
    phone: '13800138001',
    warrantyType: 'standard',
    warrantyPeriod: '1年',
    coverage: ['hardware', 'software'],
    startDate: '2024-01-01',
    endDate: '2025-01-01',
    status: 'active',
    remainingDays: 180
  }
]

const loadWarranties = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    warrantyList.value = mockWarranties
    pagination.total = mockWarranties.length
  } catch (error) {
    ElMessage.error('加载质保列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.currentPage = 1
  loadWarranties()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    warrantyNumber: '',
    productNumber: '',
    customerName: '',
    warrantyType: '',
    status: '',
    dateRange: null
  })
  handleSearch()
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  loadWarranties()
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  loadWarranties()
}

const viewWarranty = (warranty: Warranty) => {
  currentWarranty.value = warranty
  showDetailDialog.value = true
}

const editWarranty = (warranty: Warranty) => {
  editingWarranty.value = warranty
  Object.assign(warrantyForm, {
    warrantyNumber: warranty.warrantyNumber,
    productNumber: warranty.productNumber,
    productName: warranty.productName,
    customerName: warranty.customerName,
    phone: warranty.phone,
    warrantyType: warranty.warrantyType,
    warrantyPeriod: warranty.warrantyPeriod,
    coverage: warranty.coverage,
    startDate: warranty.startDate,
    remarks: warranty.remarks || ''
  })
  showCreateDialog.value = true
}

const extendWarranty = (warranty: Warranty) => {
  currentWarranty.value = warranty
  showExtendDialog.value = true
}

const saveWarranty = async () => {
  const formRef = ref()
  try {
    await formRef.value.validate()
    saving.value = true
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success(editingWarranty.value ? '质保更新成功' : '质保创建成功')
    showCreateDialog.value = false
    loadWarranties()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const submitExtend = async () => {
  const formRef = ref()
  try {
    await formRef.value.validate()
    extending.value = true
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('质保延期成功')
    showExtendDialog.value = false
    loadWarranties()
  } catch (error) {
    ElMessage.error('延期失败')
  } finally {
    extending.value = false
  }
}

const resetForm = () => {
  editingWarranty.value = null
  Object.assign(warrantyForm, {
    warrantyNumber: '',
    productNumber: '',
    productName: '',
    customerName: '',
    phone: '',
    warrantyType: '',
    warrantyPeriod: '',
    coverage: [],
    startDate: '',
    remarks: ''
  })
}

const exportData = () => {
  ElMessage.success('导出功能开发中')
}

onMounted(() => {
  loadWarranties()
})
</script>

<style scoped>
.warranty-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-overview {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 15px 0;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 16px;
}

.stat-icon i {
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stat-trend {
  font-size: 12px;
  margin-top: 3px;
}

.stat-trend.up {
  color: #67C23A;
}

.stat-trend.down {
  color: #F56C6C;
}

.filter-section {
  margin-bottom: 20px;
}

.warranty-list {
  background: white;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.warranty-detail {
  margin-bottom: 20px;
}

.warranty-history {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.warranty-history h4 {
  margin-bottom: 15px;
  color: #303133;
}

.record-content {
  padding-left: 10px;
}

.record-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 5px;
}

.record-desc {
  color: #606266;
  font-size: 14px;
}

.normal {
  color: #67C23A;
  font-weight: 500;
}

.warning {
  color: #E6A23C;
  font-weight: 500;
}

.expired {
  color: #F56C6C;
  font-weight: 500;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .el-col-6 {
    margin-bottom: 15px;
  }
}
</style>