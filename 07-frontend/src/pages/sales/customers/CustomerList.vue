<template>
  <div class="customer-list-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>客户台账</h2>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增客户
        </el-button>
        <el-button type="danger" :disabled="!hasSelection" @click="handleBatchDelete">批量删除</el-button>
        <el-button type="success" @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button @click="handlePrint">
          <el-icon><Printer /></el-icon>
          打印
        </el-button>
        <el-button @click="handleRefresh">刷新</el-button>
      </div>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-area">
      <el-input 
        v-model="searchText" 
        placeholder="搜索客户名称、联系人、电话..." 
        clearable
        style="width: 300px; margin-right: 10px;"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="customerTypeFilter" placeholder="客户类型" clearable style="width: 150px; margin-right: 10px;">
        <el-option label="全部" value="" />
        <el-option label="VIP客户" value="vip" />
        <el-option label="普通客户" value="regular" />
        <el-option label="潜在客户" value="potential" />
      </el-select>
      <el-select v-model="statusFilter" placeholder="客户状态" clearable style="width: 150px;">
        <el-option label="全部" value="" />
        <el-option label="合作中" value="active" />
        <el-option label="已流失" value="lost" />
        <el-option label="已冻结" value="frozen" />
      </el-select>
    </div>

    <!-- 客户统计卡片 -->
    <div class="stats-cards">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #409EFF;">
            <el-icon :size="24"><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">客户总数</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #67C23A;">
            <el-icon :size="24"><Trophy /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.vip }}</div>
            <div class="stat-label">VIP客户</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #E6A23C;">
            <el-icon :size="24"><Connection /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.active }}</div>
            <div class="stat-label">合作中</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #F56C6C;">
            <el-icon :size="24"><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ formatCurrency(stats.totalRevenue) }}</div>
            <div class="stat-label">总交易额</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 主表格 -->
    <div class="table-container">
      <el-table
        ref="tableRef"
        :data="filteredTableData"
        stripe
        border
        :height="tableHeight"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" fixed="left" />
        <el-table-column type="index" label="序号" width="60" fixed="left" />
        <el-table-column prop="customerCode" label="客户编号" width="140" fixed="left" />
        <el-table-column prop="customerName" label="客户名称" width="180" fixed="left">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">{{ row.customerName }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="customerType" label="客户类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getCustomerTypeColor(row.customerType)">
              {{ getCustomerTypeLabel(row.customerType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="客户状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contactPerson" label="联系人" width="100" />
        <el-table-column prop="contactPhone" label="联系电话" width="130" />
        <el-table-column prop="contactEmail" label="邮箱" width="180" />
        <el-table-column prop="company" label="公司名称" width="200" />
        <el-table-column prop="industry" label="所属行业" width="120" />
        <el-table-column prop="region" label="所属区域" width="100" />
        <el-table-column prop="address" label="详细地址" width="250" show-overflow-tooltip />
        <el-table-column prop="creditLimit" label="信用额度" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.creditLimit) }}
          </template>
        </el-table-column>
        <el-table-column prop="usedCredit" label="已用额度" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.usedCredit) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalOrders" label="订单数量" width="100" align="right" />
        <el-table-column prop="totalAmount" label="累计交易额" width="140" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="lastOrderDate" label="最后下单日期" width="140" />
        <el-table-column prop="salesPerson" label="负责销售" width="100" />
        <el-table-column prop="paymentTerm" label="付款方式" width="120" />
        <el-table-column prop="taxNumber" label="税号" width="180" />
        <el-table-column prop="bankAccount" label="银行账号" width="200" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="remark" label="备注" width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleView(row)">查看</el-button>
            <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增客户对话框 -->
    <el-dialog 
      v-model="createDialogVisible" 
      title="新增客户" 
      width="90%" 
      :close-on-click-modal="false"
      destroy-on-close
    >
      <CustomerCreate @success="handleCreateSuccess" @cancel="createDialogVisible = false" />
    </el-dialog>

    <!-- 编辑客户对话框 -->
    <el-dialog 
      v-model="editDialogVisible" 
      title="编辑客户" 
      width="90%" 
      :close-on-click-modal="false"
      destroy-on-close
    >
      <CustomerCreate 
        :customer-data="currentCustomer" 
        :is-edit="true"
        @success="handleEditSuccess" 
        @cancel="editDialogVisible = false" 
      />
    </el-dialog>

    <!-- 查看客户详情对话框 -->
    <el-dialog 
      v-model="viewDialogVisible" 
      title="客户详情" 
      width="80%" 
      :close-on-click-modal="false"
    >
      <CustomerView 
        :customer-data="currentCustomer" 
        @close="viewDialogVisible = false" 
      />
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入客户数据" width="500px">
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        accept=".xlsx,.xls"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            仅支持 xlsx/xls 格式文件，大小不超过 10MB
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportConfirm">确定导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, User, Trophy, Connection, Money, Upload, Download, Printer, UploadFilled } from '@element-plus/icons-vue'
import CustomerCreate from './CustomerCreate.vue'
import CustomerView from './CustomerView.vue'

// 数据
const tableRef = ref(null)
const searchText = ref('')
const customerTypeFilter = ref('')
const statusFilter = ref('')
const selectedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)
const tableHeight = ref(600)
const createDialogVisible = ref(false)
const editDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const importDialogVisible = ref(false)
const currentCustomer = ref(null)

// 统计数据
const stats = ref({
  total: 156,
  vip: 23,
  active: 142,
  totalRevenue: 12560000
})

// 表格数据（模拟数据）
const tableData = ref([
  {
    id: 1,
    customerCode: 'C2025001',
    customerName: '上海ABC科技有限公司',
    customerType: 'vip',
    status: 'active',
    contactPerson: '张三',
    contactPhone: '13800138000',
    contactEmail: 'zhangsan@abc.com',
    company: '上海ABC科技有限公司',
    industry: '电子制造',
    region: '华东区',
    address: '上海市浦东新区张江高科技园区XX路XX号',
    creditLimit: 1000000,
    usedCredit: 650000,
    totalOrders: 48,
    totalAmount: 3560000,
    lastOrderDate: '2025-11-25',
    salesPerson: '李四',
    paymentTerm: '月结30天',
    taxNumber: '91310000MA1FL2XX42',
    bankAccount: '6222 0000 0000 0000',
    createTime: '2023-01-15 10:30:00',
    remark: 'VIP客户，优先处理'
  },
  {
    id: 2,
    customerCode: 'C2025002',
    customerName: '北京XYZ电子公司',
    customerType: 'regular',
    status: 'active',
    contactPerson: '王五',
    contactPhone: '13900139000',
    contactEmail: 'wangwu@xyz.com',
    company: '北京XYZ电子公司',
    industry: '电子元器件',
    region: '华北区',
    address: '北京市海淀区中关村XX号',
    creditLimit: 500000,
    usedCredit: 320000,
    totalOrders: 25,
    totalAmount: 1280000,
    lastOrderDate: '2025-11-20',
    salesPerson: '赵六',
    paymentTerm: '货到付款',
    taxNumber: '91110000MA1FL2XX43',
    bankAccount: '6222 0000 0000 0001',
    createTime: '2023-06-20 14:20:00',
    remark: ''
  }
])

// 下一个客户ID
const nextCustomerId = ref(3)

// 计算属性
const hasSelection = computed(() => selectedRows.value.length > 0)

const filteredTableData = computed(() => {
  let data = tableData.value
  
  // 搜索过滤
  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase()
    data = data.filter(row => 
      row.customerName.toLowerCase().includes(searchLower) ||
      row.contactPerson.includes(searchText.value) ||
      row.contactPhone.includes(searchText.value)
    )
  }
  
  // 客户类型过滤
  if (customerTypeFilter.value) {
    data = data.filter(row => row.customerType === customerTypeFilter.value)
  }
  
  // 状态过滤
  if (statusFilter.value) {
    data = data.filter(row => row.status === statusFilter.value)
  }
  
  totalCount.value = data.length
  return data.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
})

// 方法
const formatCurrency = (value) => {
  if (!value) return '¥0.00'
  return `¥${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const getCustomerTypeColor = (type) => {
  const typeMap = {
    'vip': 'danger',
    'regular': 'primary',
    'potential': 'warning'
  }
  return typeMap[type] || 'info'
}

const getCustomerTypeLabel = (type) => {
  const labelMap = {
    'vip': 'VIP客户',
    'regular': '普通客户',
    'potential': '潜在客户'
  }
  return labelMap[type] || type
}

const getStatusColor = (status) => {
  const colorMap = {
    'active': 'success',
    'lost': 'danger',
    'frozen': 'warning'
  }
  return colorMap[status] || 'info'
}

const getStatusLabel = (status) => {
  const labelMap = {
    'active': '合作中',
    'lost': '已流失',
    'frozen': '已冻结'
  }
  return labelMap[status] || status
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 操作方法
const handleCreate = () => {
  createDialogVisible.value = true
}

const handleCreateSuccess = (newCustomerData) => {
  // 生成客户编号
  const customerCode = `C${new Date().getFullYear()}${String(nextCustomerId.value).padStart(4, '0')}`
  
  // 添加新客户到表格数据
  const newCustomer = {
    id: nextCustomerId.value,
    customerCode: customerCode,
    customerName: newCustomerData.customerName,
    customerType: newCustomerData.customerType || 'regular',
    status: newCustomerData.status || 'active',
    contactPerson: newCustomerData.contactPerson,
    contactPhone: newCustomerData.contactPhone,
    contactEmail: newCustomerData.contactEmail || '',
    company: newCustomerData.company || newCustomerData.customerName,
    industry: newCustomerData.industry || '',
    region: newCustomerData.region || '',
    address: newCustomerData.address || '',
    creditLimit: newCustomerData.creditLimit || 0,
    usedCredit: newCustomerData.usedCredit || 0,
    totalOrders: newCustomerData.totalOrders || 0,
    totalAmount: newCustomerData.totalAmount || 0,
    lastOrderDate: newCustomerData.lastOrderDate || '',
    salesPerson: newCustomerData.salesPerson || '',
    paymentTerm: newCustomerData.paymentTerm || '',
    taxNumber: newCustomerData.taxNumber || '',
    bankAccount: newCustomerData.bankAccount || '',
    createTime: new Date().toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    remark: newCustomerData.remark || ''
  }
  
  // 添加到表格数据开头（最新的在前面）
  tableData.value.unshift(newCustomer)
  
  // 更新统计数据
  stats.value.total++
  if (newCustomer.customerType === 'vip') {
    stats.value.vip++
  }
  if (newCustomer.status === 'active') {
    stats.value.active++
  }
  
  // 递增下一个客户ID
  nextCustomerId.value++
  
  // 同步到localStorage
  localStorage.setItem('customerListData', JSON.stringify(tableData.value))
  
  // 关闭对话框
  createDialogVisible.value = false
  
  // 显示成功消息
  ElMessage.success(`客户"${newCustomer.customerName}"创建成功！`)
  
  // 刷新页面（回到第一页）
  currentPage.value = 1
}

const handleView = (row) => {
  currentCustomer.value = { ...row }
  viewDialogVisible.value = true
}

const handleEdit = (row) => {
  currentCustomer.value = { ...row }
  editDialogVisible.value = true
}

const handleEditSuccess = (customerData) => {
  const index = tableData.value.findIndex(c => c.id === customerData.id)
  if (index !== -1) {
    tableData.value[index] = {
      ...customerData,
      updateTime: new Date().toLocaleString('zh-CN')
    }
  }
  
  // 同步到localStorage
  localStorage.setItem('customerListData', JSON.stringify(tableData.value))
  
  editDialogVisible.value = false
  ElMessage.success('客户更新成功')
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除客户“${row.customerName}”吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 从表格数据中删除
    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      tableData.value.splice(index, 1)
      
      // 更新统计数据
      stats.value.total--
      if (row.customerType === 'vip' || row.customerType === 'VIP客户') {
        stats.value.vip--
      }
      if (row.status === 'active' || row.status === '合作中') {
        stats.value.active--
      }
      // 减去删除客户的交易额
      stats.value.totalRevenue -= (row.totalAmount || 0)
      
      ElMessage.success('删除成功')
    }
  } catch {}
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个客户吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 获取要删除的客户ID列表
    const deleteIds = selectedRows.value.map(row => row.id)
    
    // 从表格数据中删除
    tableData.value = tableData.value.filter(row => !deleteIds.includes(row.id))
    
    // 更新统计数据
    selectedRows.value.forEach(row => {
      stats.value.total--
      if (row.customerType === 'vip' || row.customerType === 'VIP客户') {
        stats.value.vip--
      }
      if (row.status === 'active' || row.status === '合作中') {
        stats.value.active--
      }
      // 减去删除客户的交易额
      stats.value.totalRevenue -= (row.totalAmount || 0)
    })
    
    // 同步到localStorage
    localStorage.setItem('customerListData', JSON.stringify(tableData.value))
    
    // 清空选中项
    selectedRows.value = []
    
    ElMessage.success('批量删除成功')
  } catch {}
}

const handleExport = () => {
  // 导出当前筛选的数据
  const dataToExport = filteredTableData.value
  
  // 模拟CSV导出
  let csvContent = '客户编号,客户名称,客户类型,客户状态,联系人,联系电话,邮箱,公司名称,所属行业,所属区域\n'
  dataToExport.forEach(row => {
    csvContent += `${row.customerCode},${row.customerName},${getCustomerTypeLabel(row.customerType)},${getStatusLabel(row.status)},${row.contactPerson},${row.contactPhone},${row.contactEmail},${row.company},${row.industry},${row.region}\n`
  })
  
  // 创建下载链接
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `客户台账_${new Date().getTime()}.csv`
  link.click()
  
  ElMessage.success(`导出成功，共 ${dataToExport.length} 条记录`)
}

const handleImport = () => {
  importDialogVisible.value = true
}

const handleFileChange = (file) => {
  console.log('选择文件:', file)
}

const handleImportConfirm = () => {
  ElMessage.success('导入成功')
  importDialogVisible.value = false
}

const handlePrint = () => {
  window.print()
}

const handleRefresh = () => {
  ElMessage.success('刷新成功')
}

// 生命周期
onMounted(() => {
  // 计算表格高度
  const updateTableHeight = () => {
    const windowHeight = window.innerHeight
    tableHeight.value = windowHeight - 450
  }
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)
  
  // 同步客户数据到localStorage，供其他页面使用
  localStorage.setItem('customerListData', JSON.stringify(tableData.value))
})
</script>

<style scoped>
.customer-list-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-left h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.search-area {
  margin-bottom: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.table-container {
  background: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 1400px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
}

/* 打印样式 */
@media print {
  .toolbar,
  .search-area,
  .stats-cards,
  .pagination-container {
    display: none;
  }
  
  .table-container {
    box-shadow: none;
  }
}
</style>
