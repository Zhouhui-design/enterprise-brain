<template>
  <div class="projected-balance-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>首页</el-breadcrumb-item>
        <el-breadcrumb-item>库存管理</el-breadcrumb-item>
        <el-breadcrumb-item>预计结存</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="header-actions">
        <h1>预计结存</h1>
        <el-button type="primary" @click="handleAdd" size="large">
          <el-icon><Plus /></el-icon>
          新增预计结存
        </el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="销售订单编号">
          <el-input v-model="searchForm.salesOrderNo" placeholder="请输入订单编号" clearable />
        </el-form-item>
        <el-form-item label="产品编码">
          <el-input v-model="searchForm.productCode" placeholder="请输入产品编码" clearable />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.productName" placeholder="请输入产品名称" clearable />
        </el-form-item>
        <el-form-item label="预计发生日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 工具栏 -->
    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button @click="handleBatchDelete" :disabled="selectedRows.length === 0">
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
          <el-button @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
          <el-button @click="handleImport">
            <el-icon><Upload /></el-icon>
            导入
          </el-button>
          <el-button @click="handlePrint">
            <el-icon><Printer /></el-icon>
            打印
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-button @click="columnControlVisible = true">
            <el-icon><Setting /></el-icon>
            列设置
          </el-button>
          <el-button @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never" class="table-card">
      <el-table
        v-loading="loading"
        :data="tableData"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" fixed="left" />
        <el-table-column
          v-for="column in visibleColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :sortable="column.sortable ? 'custom' : false"
          :fixed="column.fixed"
        >
          <template #header v-if="column.filterable">
            <div class="filter-header">
              <span>{{ column.label }}</span>
              <el-icon class="filter-icon" @click="showFilterDialog(column)">
                <Filter />
              </el-icon>
            </div>
          </template>
          <template #default="{ row, $index }" v-if="column.prop === 'index'">
            {{ $index + 1 + (currentPage - 1) * pageSize }}
          </template>
          <template #default="{ row }" v-else-if="column.prop === 'projectedBalance'">
            <span :class="getBalanceClass(row.projectedBalance)">
              {{ row.projectedBalance }}
            </span>
          </template>
          <template #default="{ row }" v-else-if="column.prop === 'availableInventory'">
            <span :class="getBalanceClass(row.availableInventory)">
              {{ row.availableInventory }}
            </span>
          </template>
          <template #default="{ row }" v-else-if="column.prop === 'actions'">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="140px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预计发生日期" prop="projectedDate">
              <el-date-picker
                v-model="formData.projectedDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="销售订单编号" prop="salesOrderNo">
              <el-input v-model="formData.salesOrderNo" placeholder="请输入销售订单编号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品编码" prop="productCode">
              <el-input v-model="formData.productCode" placeholder="请输入产品编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品名称" prop="productName">
              <el-input v-model="formData.productName" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预计发生编号" prop="transactionNo">
              <el-input v-model="formData.transactionNo" placeholder="自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计发生数量" prop="quantity">
              <el-input-number
                v-model="formData.quantity"
                :min="0"
                placeholder="请输入数量"
                style="width: 100%"
                @change="calculateBalance"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="基础单位" prop="baseUnit">
              <el-input v-model="formData.baseUnit" placeholder="请输入单位" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实时库存">
              <el-input-number
                v-model="formData.currentInventory"
                :min="0"
                placeholder="实时库存"
                style="width: 100%"
                @change="calculateBalance"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预计结存">
              <el-input v-model="formData.projectedBalance" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发生前可用库存">
              <el-input v-model="formData.availableInventory" disabled />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 列控制对话框 -->
    <el-dialog v-model="columnControlVisible" title="列设置" width="500px">
      <el-checkbox-group v-model="selectedColumnProps">
        <div v-for="column in allColumns" :key="column.prop" class="column-item">
          <el-checkbox :label="column.prop">{{ column.label }}</el-checkbox>
        </div>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="columnControlVisible = false">取消</el-button>
        <el-button type="primary" @click="applyColumnSettings">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Search, Delete, Download, Upload, Printer, Setting, Refresh, Filter
} from '@element-plus/icons-vue'
import { projectedBalanceApi } from '@/api/projectedBalance'

// 数据
const loading = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// 搜索表单
const searchForm = ref({
  salesOrderNo: '',
  productCode: '',
  productName: '',
  dateRange: []
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = computed(() => formData.value.id ? '编辑预计结存' : '新增预计结存')
const submitting = ref(false)
const formRef = ref(null)

// 表单数据
const formData = ref({
  id: null,
  projectedDate: '',
  salesOrderNo: '',
  productCode: '',
  productName: '',
  transactionNo: '',
  quantity: 0,
  baseUnit: '个',
  currentInventory: 0,
  projectedBalance: 0,
  availableInventory: 0
})

// 表单验证规则
const formRules = {
  projectedDate: [{ required: true, message: '请选择预计发生日期', trigger: 'change' }],
  salesOrderNo: [{ required: true, message: '请输入销售订单编号', trigger: 'blur' }],
  productCode: [{ required: true, message: '请输入产品编码', trigger: 'blur' }],
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入预计发生数量', trigger: 'blur' }]
}

// 列配置
const allColumns = ref([
  { prop: 'index', label: '序号', width: 80, fixed: 'left' },
  { prop: 'submitTime', label: '提交时间', width: 180, sortable: true, filterable: true },
  { prop: 'projectedDate', label: '预计发生日期', width: 150, sortable: true, filterable: true },
  { prop: 'salesOrderNo', label: '销售订单编号', width: 180, filterable: true },
  { prop: 'productCode', label: '产品(物料)编码', width: 150, filterable: true },
  { prop: 'productName', label: '产品(物料)名称', width: 180, filterable: true },
  { prop: 'transactionNo', label: '预计发生编号', width: 180, filterable: true },
  { prop: 'quantity', label: '预计发生数量', width: 120, sortable: true },
  { prop: 'baseUnit', label: '基础单位', width: 100 },
  { prop: 'currentInventory', label: '实时库存', width: 120, sortable: true },
  { prop: 'projectedBalance', label: '预计结存', width: 120, sortable: true },
  { prop: 'availableInventory', label: '发生前可用库存', width: 150, sortable: true },
  { prop: 'actions', label: '操作', width: 180, fixed: 'right' }
])

const columnControlVisible = ref(false)
const selectedColumnProps = ref([])

// 可见列
const visibleColumns = computed(() => {
  return allColumns.value.filter(col => selectedColumnProps.value.includes(col.prop))
})

// 方法
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

const resetSearch = () => {
  searchForm.value = {
    salesOrderNo: '',
    productCode: '',
    productName: '',
    dateRange: []
  }
  loadData()
}

const handleAdd = () => {
  formData.value = {
    id: null,
    projectedDate: '',
    salesOrderNo: '',
    productCode: '',
    productName: '',
    transactionNo: `TXN${Date.now()}`,
    quantity: 0,
    baseUnit: '个',
    currentInventory: 0,
    projectedBalance: 0,
    availableInventory: 0
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await projectedBalanceApi.deleteProjectedBalance(row.id)
    if (response.data.success) {
      ElMessage.success('删除成功')
      loadData()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error.response?.data?.message || error.message))
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条记录吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const ids = selectedRows.value.map(row => row.id)
    const response = await projectedBalanceApi.batchDeleteProjectedBalances(ids)
    if (response.data.success) {
      ElMessage.success('批量删除成功')
      selectedRows.value = []
      loadData()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败：' + (error.response?.data?.message || error.message))
    }
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const submitData = {
      projectedDate: formData.value.projectedDate,
      salesOrderNo: formData.value.salesOrderNo,
      productCode: formData.value.productCode,
      productName: formData.value.productName,
      quantity: formData.value.quantity,
      baseUnit: formData.value.baseUnit,
      currentInventory: formData.value.currentInventory
    }
    
    if (formData.value.id) {
      // 编辑
      const response = await projectedBalanceApi.updateProjectedBalance(formData.value.id, submitData)
      if (response.data.success) {
        ElMessage.success('编辑成功')
        dialogVisible.value = false
        loadData()
      }
    } else {
      // 新增
      const response = await projectedBalanceApi.createProjectedBalance(submitData)
      if (response.data.success) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        loadData()
      }
    }
  } catch (error) {
    if (error.response) {
      ElMessage.error(error.response.data.message || '操作失败')
    } else {
      console.error('表单验证失败:', error)
    }
  } finally {
    submitting.value = false
  }
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

const calculateBalance = () => {
  // 预计结存 = 实时库存 - 预计发生数量
  formData.value.projectedBalance = formData.value.currentInventory - formData.value.quantity
  // 发生前可用库存 = 实时库存
  formData.value.availableInventory = formData.value.currentInventory
}

const handleExport = () => {
  ElMessage.success('导出功能开发中')
}

const handleImport = () => {
  ElMessage.success('导入功能开发中')
}

const handlePrint = () => {
  window.print()
}

const handleRefresh = () => {
  loadData()
  ElMessage.success('刷新成功')
}

const handleSortChange = ({ prop, order }) => {
  console.log('排序:', prop, order)
  // TODO: 实现排序逻辑
}

const showFilterDialog = (column) => {
  console.log('筛选列:', column)
  // TODO: 实现筛选逻辑
}

const applyColumnSettings = () => {
  columnControlVisible.value = false
  ElMessage.success('列设置已应用')
}

const handleSizeChange = (size) => {
  pageSize.value = size
  loadData()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  loadData()
}

const getBalanceClass = (value) => {
  if (value < 0) return 'text-danger'
  if (value < 10) return 'text-warning'
  return 'text-success'
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      salesOrderNo: searchForm.value.salesOrderNo,
      productCode: searchForm.value.productCode,
      productName: searchForm.value.productName
    }
    
    if (searchForm.value.dateRange && searchForm.value.dateRange.length === 2) {
      params.startDate = searchForm.value.dateRange[0]
      params.endDate = searchForm.value.dateRange[1]
    }
    
    const response = await projectedBalanceApi.getProjectedBalances(params)
    
    if (response.data.success) {
      const balances = response.data.data.list
      tableData.value = balances.map(b => ({
        id: b.id,
        submitTime: b.submit_time,
        projectedDate: b.projected_date,
        salesOrderNo: b.sales_order_no,
        productCode: b.product_code,
        productName: b.product_name,
        transactionNo: b.transaction_no,
        quantity: b.quantity,
        baseUnit: b.base_unit,
        currentInventory: b.current_inventory,
        projectedBalance: b.projected_balance,
        availableInventory: b.available_inventory
      }))
      total.value = response.data.data.total
      console.log('✅ 从后端加载', tableData.value.length, '条数据')
    }
  } catch (error) {
    console.error('❌ 加载失败:', error)
    ElMessage.error('加载数据失败：' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  // 初始化所有列为可见
  selectedColumnProps.value = allColumns.value.map(col => col.prop)
  loadData()
})
</script>

<style scoped>
.projected-balance-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.header-actions h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.search-card,
.toolbar-card,
.table-card {
  margin-bottom: 16px;
}

.search-form {
  margin-bottom: -18px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 8px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-icon {
  margin-left: 4px;
  cursor: pointer;
}

.filter-icon:hover {
  color: var(--el-color-primary);
}

.column-item {
  padding: 8px 0;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}

.text-warning {
  color: #e6a23c;
  font-weight: bold;
}

.text-success {
  color: #67c23a;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 打印样式 */
@media print {
  .page-header,
  .search-card,
  .toolbar-card,
  .pagination {
    display: none !important;
  }
  
  .table-card {
    box-shadow: none !important;
  }
}
</style>
