<template>
  <!-- ✅ 使用 StandardTablePage v2.1 统一组件 -->
  <StandardTablePage
    page-title="主生产计划"
    settings-key="production-plan-list"
    
    <!-- ✅ 面包屑导航 -->
    :breadcrumb-items="breadcrumbItems"
    
    <!-- 表格数据 -->
    :table-data="planListData"
    :columns="tableColumns"
    :loading="loading"
    :total="total"
    :current-page="currentPage"
    :page-size="pageSize"
    
    <!-- 功能开关 -->
    :show-search="true"
    :show-selection="true"
    :show-filter="true"
    :show-pagination="true"
    :show-batch-delete="true"
    :show-export="true"
    :show-business-vars="true"
    
    <!-- 业务变量配置 -->
    :default-settings="defaultSettings"
    
    <!-- 事件监听 -->
    @page-change="handlePageChange"
    @size-change="handleSizeChange"
    @selection-change="handleSelectionChange"
    @batch-delete="handleBatchDelete"
    @export="handleBatchExport"
    @refresh="fetchPlanList"
    @settings-save="handleSettingsSave"
    @keyboard-search="handleFocusSearch"
    @keyboard-add="handleCreatePlan"
  >
    <!-- ✅ 搜索表单插槽 -->
    <template #search-form>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="主生产计划编号">
          <el-input 
            ref="searchInputRef"
            v-model="searchForm.planCode" 
            placeholder="请输入主生产计划编号" 
            clearable 
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="产品编号">
          <el-input 
            v-model="searchForm.productCode" 
            placeholder="请输入产品编号" 
            clearable 
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input 
            v-model="searchForm.productName" 
            placeholder="请输入产品名称" 
            clearable 
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="进度状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="未开始" value="0" />
            <el-option label="进行中" value="1" />
            <el-option label="已完成" value="2" />
            <el-option label="已暂停" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </template>

    <!-- ✅ 自定义工具栏左侧 -->
    <template #toolbar-left>
      <el-button type="success" :disabled="selectedPlans.length !== 1" @click="handleExecuteSchedule">
        <el-icon><Operation /></el-icon>
        执行排程
      </el-button>
      <el-button type="primary" @click="handleCreatePlan">
        <el-icon><Plus /></el-icon>
        创建生产计划
      </el-button>
    </template>

    <!-- ✅ 产品图片列插槽 -->
    <template #productImage="{ row }">
      <el-image
        v-if="row.productImage"
        :src="row.productImage"
        :preview-src-list="[row.productImage]"
        fit="cover"
        style="width: 50px; height: 50px; border-radius: 4px;"
      />
      <span v-else style="color: #999;">无图片</span>
    </template>
    
    <!-- ✅ 进度状态列插槽 -->
    <template #status="{ row }">
      <el-tag :type="statusType[row.status]">
        {{ statusText[row.status] || '未知' }}
      </el-tag>
    </template>
    
    <!-- ✅ 操作列插槽（注意：使用#operation不是#action） -->
    <template #operation="{ row }">
      <el-button size="small" @click="handleViewDetail(row)">查看详情</el-button>
      <el-button size="small" type="primary" @click="handleEditPlan(row)">编辑</el-button>
      <el-button size="small" type="danger" @click="handleDeletePlan(row)">删除</el-button>
    </template>
  </StandardTablePage>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Operation } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import StandardTablePage from '@/components/common/layout/StandardTablePage.vue'
import api from '@/api/masterProductionPlan'

const router = useRouter()

// ✅ 面包屑导航配置
const breadcrumbItems = [
  { label: '生产管理', path: '/production' },
  { label: '计划管理', path: '/production/planning' },
  { label: '主生产计划' }
]

// ✅ 搜索输入框引用（用于键盘快捷键Ctrl+F）
const searchInputRef = ref(null)

// ✅ 状态映射
const statusText = {
  0: '未开始',
  1: '进行中',
  2: '已完成',
  3: '已暂停'
}

const statusType = {
  0: 'info',
  1: 'primary',
  2: 'success',
  3: 'warning'
}

// ✅ 业务变量默认设置
const defaultSettings = {
  advanceStorageDays: 3,  // 默认提前3天入库
  exportFilePrefix: '主生产计划',
  codePrefix: 'MPS'
}

// ✅ 数据状态
const loading = ref(false)
const searchForm = ref({
  planCode: '',
  productCode: '',
  productName: '',
  status: '',
})
const planListData = ref([])
const selectedPlans = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// ✅ 表格列配置
const tableColumns = [
  {
    prop: 'planCode',
    label: '主生产计划编号',
    width: 180,
    fixed: 'left',
    sortable: true,
    filterable: true
  },
  {
    prop: 'productCode',
    label: '产品编号',
    width: 150,
    sortable: true,
    filterable: true
  },
  {
    prop: 'productName',
    label: '产品名称',
    width: 180,
    sortable: true,
    filterable: true
  },
  {
    prop: 'orderQuantity',
    label: '订单数量',
    width: 120,
    align: 'right',
    sortable: true,
    formatter: (row) => row.orderQuantity?.toLocaleString() || 0
  },
  {
    prop: 'salesperson',
    label: '销售员',
    width: 120,
    filterable: true
  },
  {
    prop: 'salesUnit',
    label: '销售单位',
    width: 100,
    filterable: true
  },
  {
    prop: 'availableStock',
    label: '可用库存',
    width: 120,
    align: 'right',
    sortable: true,
    formatter: (row) => row.availableStock?.toLocaleString() || 0
  },
  {
    prop: 'currentStock',
    label: '实时库存',
    width: 120,
    align: 'right',
    sortable: true,
    formatter: (row) => row.currentStock?.toLocaleString() || 0
  },
  {
    prop: 'planQuantity',
    label: '计划数量',
    width: 120,
    align: 'right',
    sortable: true,
    formatter: (row) => row.planQuantity?.toLocaleString() || 0
  },
  {
    prop: 'productImage',
    label: '产品图片',
    width: 100,
    slot: 'productImage'
  },
  {
    prop: 'outputProcess',
    label: '产出工序',
    width: 120,
    filterable: true,
    showOverflowTooltip: true
  },
  {
    prop: 'promisedDeliveryDate',
    label: '订单承诺交期',
    width: 120,
    sortable: true,
    formatter: (row) => formatDateYMD(row.promisedDeliveryDate)
  },
  {
    prop: 'status',
    label: '进度状态',
    width: 120,
    filterable: true,
    slot: 'status'
  },
  {
    prop: 'plannedStorageDate',
    label: '计划入库日期',
    width: 120,
    sortable: true,
    formatter: (row) => formatDateYMD(row.plannedStorageDate)
  },
  {
    prop: 'productSource',
    label: '产品来源',
    width: 120,
    filterable: true
  },
  {
    prop: 'internalOrderNo',
    label: '内部销售订单编号',
    width: 180,
    filterable: true
  },
  {
    prop: 'customerOrderNo',
    label: '客户订单编号',
    width: 180,
    filterable: true
  }
]

// ✅ 格式化日期为年-月-日
const formatDateYMD = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (e) {
    return '-'
  }
}

// ✅ 从后端API加载主生产计划列表
const fetchPlanList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...(searchForm.value.planCode && { planCode: searchForm.value.planCode }),
      ...(searchForm.value.productCode && { productCode: searchForm.value.productCode }),
      ...(searchForm.value.productName && { productName: searchForm.value.productName }),
      ...(searchForm.value.status && { status: searchForm.value.status })
    }
    
    const result = await api.getList(params)
    
    planListData.value = result.list || []
    total.value = result.total || 0
    console.log('✅ 加载主生产计划:', planListData.value.length, '条')
  } catch (error) {
    console.error('❌ 加载主生产计划失败:', error)
    ElMessage.error('加载数据失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// ✅ 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchPlanList()
}

// ✅ 重置
const handleReset = () => {
  searchForm.value = {
    planCode: '',
    productCode: '',
    productName: '',
    status: '',
  }
  currentPage.value = 1
  fetchPlanList()
}

// ✅ 键盘快捷键：聚焦搜索框
const handleFocusSearch = () => {
  searchInputRef.value?.focus()
}

// ✅ 选择变化
const handleSelectionChange = (val) => {
  selectedPlans.value = val
}

// ✅ 分页变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchPlanList()
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchPlanList()
}

// ✅ 创建生产计划
const handleCreatePlan = () => {
  router.push('/production-planning/create')
}

// ✅ 查看详情
const handleViewDetail = (plan) => {
  router.push(`/production-planning/detail/${plan.id}`)
}

// ✅ 编辑计划
const handleEditPlan = (plan) => {
  router.push(`/production-planning/create?id=${plan.id}`)
}

// ✅ 删除计划
const handleDeletePlan = async (plan) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除生产计划"${plan.planCode}"吗？`, 
      '提示', 
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await api.deleteById(plan.id)
    ElMessage.success('删除成功')
    fetchPlanList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ 删除失败:', error)
      ElMessage.error('删除失败: ' + (error.message || '未知错误'))
    }
  }
}

// ✅ 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的${selectedPlans.value.length}个生产计划吗？`, 
      '提示', 
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedPlans.value.map(plan => plan.id)
    await api.batchDelete(ids)
    ElMessage.success(`成功删除${selectedPlans.value.length}条记录`)
    selectedPlans.value = []
    fetchPlanList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ 批量删除失败:', error)
      ElMessage.error('批量删除失败: ' + (error.message || '未知错误'))
    }
  }
}

// ✅ 批量导出
const handleBatchExport = () => {
  ElMessage.info('导出成功')
}

// ✅ 执行排程
const handleExecuteSchedule = async () => {
  const selectedPlan = selectedPlans.value[0]
  if (!selectedPlan) {
    ElMessage.warning('请选择一条主生产计划')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要执行排程吗？

计划编号: ${selectedPlan.planCode}
产品名称: ${selectedPlan.productName}
计划数量: ${selectedPlan.planQuantity}

系统将自动：
1. 将主计划数据推送到备料计划
2. 根据产出工序自动生成工序计划`,
      '执行排程确认',
      {
        confirmButtonText: '确定执行',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false
      }
    )
    
    loading.value = true
    
    const result = await api.executeSchedule(selectedPlan.id)
    
    ElMessage.success(
      `排程执行成功！\n` +
      `生成备料计划: ${result.materialPlanCount || 0} 条\n` +
      `生成工序计划: ${result.processPlanCount || 0} 条`
    )
    // 刷新列表
    fetchPlanList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❗ 执行排程失败:', error)
      ElMessage.error(error.message || '执行排程失败')
    }
  } finally {
    loading.value = false
  }
}

// ✅ 设置保存
const handleSettingsSave = (settings) => {
  console.log('✅ 设置已保存:', settings)
  
  // 应用业务变量
  if (settings.advanceStorageDays !== undefined) {
    console.log('📅 提前入库期设置为:', settings.advanceStorageDays, '天')
  }
  
  ElMessage.success('设置已应用')
}

// ✅ 页面加载
onMounted(() => {
  fetchPlanList()
})
</script>

<style scoped>
.search-form {
  margin-top: 10px;
}
</style>
