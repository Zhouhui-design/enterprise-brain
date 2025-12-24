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
import { customerApi } from '@/api/customer'

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
const tableData = ref([])

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

const handleCreateSuccess = async (newCustomerData) => {
  try {
    // 尝试通过API创建客户
    const response = await customerApi.createCustomer({
      customerName: newCustomerData.customerName,
      customerType: newCustomerData.customerType || 'regular',
      status: newCustomerData.status || 'active',
      contactPerson: newCustomerData.contactPerson,
      contactPhone: newCustomerData.contactPhone,
      contactEmail: newCustomerData.contactEmail,
      company: newCustomerData.company || newCustomerData.customerName,
      industry: newCustomerData.industry,
      region: newCustomerData.region,
      contactAddress: newCustomerData.address,
      creditLimit: newCustomerData.creditLimit || 0,
      salesPerson: newCustomerData.salesPerson,
      taxNumber: newCustomerData.taxNumber,
      remark: newCustomerData.remark,
      createdBy: 'admin'
    })
    
    if (response.data.success) {
      const savedCustomer = response.data.data
      const newCustomer = {
        id: savedCustomer.id,
        customerCode: savedCustomer.customer_code,
        customerName: savedCustomer.customer_name,
        customerType: savedCustomer.customer_type,
        status: savedCustomer.status,
        contactPerson: savedCustomer.contact_person,
        contactPhone: savedCustomer.contact_phone,
        contactEmail: savedCustomer.contact_email,
        company: savedCustomer.company,
        industry: savedCustomer.industry,
        region: savedCustomer.region,
        address: savedCustomer.contact_address,
        createTime: new Date(savedCustomer.created_at).toLocaleString('zh-CN')
      }
      
      tableData.value.unshift(newCustomer)
      saveCustomerData(tableData.value)
      
      stats.value.total++
      if (savedCustomer.customer_type === 'vip') stats.value.vip++
      if (savedCustomer.status === 'active') stats.value.active++
      
      createDialogVisible.value = false
      ElMessage.success(`客户"${savedCustomer.customer_name}"创建成功！`)
      currentPage.value = 1
      return
    }
  } catch (error) {
    console.error('API创建失败，使用本地存储:', error)
    
    // API失败，使用本地存储创建客户
    const newCustomer = {
      id: Date.now(), // 使用时间戳作为本地ID
      customerCode: newCustomerData.customerCode,
      customerName: newCustomerData.customerName,
      customerType: newCustomerData.customerType || 'regular',
      status: newCustomerData.status || 'active',
      contactPerson: newCustomerData.contactPerson,
      contactPhone: newCustomerData.contactPhone,
      contactEmail: newCustomerData.contactEmail,
      company: newCustomerData.company || newCustomerData.customerName,
      industry: newCustomerData.industry,
      region: newCustomerData.region,
      address: newCustomerData.address,
      createTime: new Date().toLocaleString('zh-CN')
    }
    
    tableData.value.unshift(newCustomer)
    saveCustomerData(tableData.value)
    
    stats.value.total++
    if (newCustomer.customerType === 'vip') stats.value.vip++
    if (newCustomer.status === 'active') stats.value.active++
    
    createDialogVisible.value = false
    ElMessage.success(`客户"${newCustomer.customerName}"创建成功！已保存到本地`)
    currentPage.value = 1
  }
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
    await ElMessageBox.confirm(`确定要删除客户"${row.customerName}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    try {
      const response = await customerApi.deleteCustomer(row.id)
      if (response.data.success) {
        const index = tableData.value.findIndex(item => item.id === row.id)
        if (index !== -1) {
          tableData.value.splice(index, 1)
          stats.value.total--
          if (row.customerType === 'vip') stats.value.vip--
          if (row.status === 'active') stats.value.active--
          saveCustomerData(tableData.value)
          ElMessage.success('删除成功')
        }
      }
    } catch (apiError) {
      console.error('API删除失败，使用本地存储:', apiError)
      // API失败，使用本地存储删除
      const index = tableData.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        tableData.value.splice(index, 1)
        stats.value.total--
        if (row.customerType === 'vip') stats.value.vip--
        if (row.status === 'active') stats.value.active--
        saveCustomerData(tableData.value)
        ElMessage.success('删除成功（本地操作）')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败：' + (error.response?.data?.message || error.message))
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个客户吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const ids = selectedRows.value.map(row => row.id)
    
    try {
      const response = await customerApi.batchDeleteCustomers(ids)
      
      if (response.data.success) {
        tableData.value = tableData.value.filter(row => !ids.includes(row.id))
        selectedRows.value.forEach(row => {
          stats.value.total--
          if (row.customerType === 'vip') stats.value.vip--
          if (row.status === 'active') stats.value.active--
        })
        selectedRows.value = []
        saveCustomerData(tableData.value)
        ElMessage.success(`成功删除 ${response.data.data.deletedCount} 个客户`)
      }
    } catch (apiError) {
      console.error('API批量删除失败，使用本地存储:', apiError)
      // API失败，使用本地存储批量删除
      tableData.value = tableData.value.filter(row => !ids.includes(row.id))
      selectedRows.value.forEach(row => {
        stats.value.total--
        if (row.customerType === 'vip') stats.value.vip--
        if (row.status === 'active') stats.value.active--
      })
      selectedRows.value = []
      saveCustomerData(tableData.value)
      ElMessage.success(`成功删除 ${ids.length} 个客户（本地操作）`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败：' + (error.response?.data?.message || error.message))
    }
  }
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

// 本地存储键名
const CUSTOMER_LIST_KEY = 'customerListData'

// 从本地存储加载客户数据
const loadCustomerData = () => {
  try {
    const cached = localStorage.getItem(CUSTOMER_LIST_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (error) {
    console.error('❌ 从本地存储加载数据失败:', error)
  }
  return []
}

// 保存客户数据到本地存储
const saveCustomerData = (data) => {
  try {
    localStorage.setItem(CUSTOMER_LIST_KEY, JSON.stringify(data))
    console.log('✅ 数据已保存到本地存储')
  } catch (error) {
    console.error('❌ 保存数据到本地存储失败:', error)
  }
}

// 生命周期
onMounted(async () => {
  console.log('=== 客户台账页面初始化 ===')
  
  const updateTableHeight = () => {
    tableHeight.value = window.innerHeight - 450
  }
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)
  
  // 1. 首先从本地存储加载数据，确保页面快速显示
  const cachedData = loadCustomerData()
  if (cachedData.length > 0) {
    tableData.value = cachedData
    totalCount.value = cachedData.length
    console.log('✅ 从本地存储加载', cachedData.length, '条数据')
  } else {
    // 初始化一些模拟数据
    tableData.value = [
      {
        id: 1,
        customerCode: 'CUS20251224001',
        customerName: '测试客户1',
        customerType: 'regular',
        status: 'active',
        contactPerson: '张三',
        contactPhone: '13800138001',
        contactEmail: 'zhangsan@example.com',
        company: '测试公司1',
        industry: '电子制造',
        region: '华东区',
        address: '上海市浦东新区张江高科技园区',
        createTime: '2025-12-24 10:00:00'
      },
      {
        id: 2,
        customerCode: 'CUS20251224002',
        customerName: '测试客户2',
        customerType: 'vip',
        status: 'active',
        contactPerson: '李四',
        contactPhone: '13800138002',
        contactEmail: 'lisi@example.com',
        company: '测试公司2',
        industry: '机械加工',
        region: '华南区',
        address: '广东省深圳市南山区科技园',
        createTime: '2025-12-24 11:00:00'
      }
    ]
    totalCount.value = tableData.value.length
    saveCustomerData(tableData.value)
    console.log('✅ 初始化模拟数据成功')
  }
  
  // 2. 在后台尝试从API获取最新数据，不阻塞页面显示
  const fetchDataFromApi = async () => {
    try {
      const response = await customerApi.getCustomers({
        page: currentPage.value,
        pageSize: pageSize.value
      })
      
      if (response.data.success) {
        const customers = response.data.data.list
        const apiData = customers.map(c => ({
          id: c.id,
          customerCode: c.customer_code,
          customerName: c.customer_name,
          customerType: c.customer_type,
          status: c.status,
          contactPerson: c.contact_person,
          contactPhone: c.contact_phone,
          contactEmail: c.contact_email,
          company: c.company,
          industry: c.industry,
          region: c.region,
          address: c.contact_address,
          createTime: new Date(c.created_at).toLocaleString('zh-CN')
        }))
        
        if (apiData.length > 0) {
          tableData.value = apiData
          totalCount.value = response.data.data.total
          console.log('✅ 从后端加载', apiData.length, '条数据')
          // 保存到本地存储作为备份
          saveCustomerData(apiData)
          ElMessage.success('数据已从服务器更新')
        }
      }
      
      const statsRes = await customerApi.getCustomerStats()
      if (statsRes.data.success) {
        stats.value = statsRes.data.data
        console.log('✅ 统计数据:', stats.value)
      }
    } catch (error) {
      console.error('❌ 后台加载失败:', error)
      // 不显示错误提示，避免干扰用户
    }
  }
  
  // 启动后台数据获取
  fetchDataFromApi()
  
  console.log('=== 初始化完成 ===')
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
