<template>
  <div class="production-planning">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="handleBack" type="text">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1>生产计划管理</h1>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreatePlan">
          <el-icon><Plus /></el-icon>
          新建计划
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出计划
        <h2>生产计划</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>生产管理</el-breadcrumb-item>
          <el-breadcrumb-item>生产计划</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleCreatePlan" :icon="Plus">
          新建计划
        </el-button>
        <el-button @click="handleExport" :icon="Download">
          导出
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" label-width="100px">
        <el-form-item label="计划编号">
          <el-input v-model="searchForm.planCode" placeholder="请输入计划编号" />
        </el-form-item>
        <el-form-item label="计划名称">
          <el-input v-model="searchForm.planName" placeholder="请输入计划名称" />
        </el-form-item>
        <el-form-item label="计划状态">
          <el-select v-model="searchForm.status" placeholder="请选择计划状态">
            <el-option label="全部" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="执行中" value="executing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划周期">
          <el-date-picker
            v-model="searchForm.planPeriod"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 计划列表 -->
    <el-card class="data-card">
      <div class="table-actions">
        <el-button type="danger" @click="handleBatchDelete" :disabled="selectedPlanIds.length === 0">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-button @click="handleBatchPublish" :disabled="selectedPlanIds.length === 0">
          <el-icon><Send /></el-icon>
          批量发布
        </el-button>
      </div>
      
      <el-table
        v-loading="loading"
        :data="planList"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="planCode" label="计划编号" width="180" />
        <el-table-column prop="planName" label="计划名称" width="200" />
        <el-table-column label="计划状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startDate" label="开始日期" width="150" />
        <el-table-column prop="endDate" label="结束日期" width="150" />
        <el-table-column prop="totalOrders" label="订单数量" width="100" align="right" />
        <el-table-column prop="totalQuantity" label="总数量" width="100" align="right" />
        <el-table-column prop="creator" label="创建人" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text @click="handleViewPlan(row)">查看详情</el-button>
            <el-button text @click="handleEditPlan(row)" v-if="row.status === 'draft'">编辑</el-button>
            <el-button text @click="handlePublishPlan(row)" v-if="row.status === 'draft'">发布</el-button>
            <el-button text @click="handleExecutePlan(row)" v-if="row.status === 'published'">执行</el-button>
            <el-button type="danger" text @click="handleDeletePlan(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 计划详情对话框 -->
    <el-dialog
      v-model="planDialogVisible"
      :title="planDialogTitle"
      width="900px"
      @close="handlePlanDialogClose"
    >
      <div v-if="currentPlan" class="plan-detail">
        <!-- 计划基本信息 -->
        <el-descriptions :column="1" border>
          <el-descriptions-item label="计划编号">{{ currentPlan.planCode }}</el-descriptions-item>
          <el-descriptions-item label="计划名称">{{ currentPlan.planName }}</el-descriptions-item>
          <el-descriptions-item label="计划状态"><el-tag :type="getStatusTagType(currentPlan.status)">{{ getStatusText(currentPlan.status) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="计划周期">{{ currentPlan.startDate }} 至 {{ currentPlan.endDate }}</el-descriptions-item>
          <el-descriptions-item label="计划说明">{{ currentPlan.description || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 计划包含的订单 -->
        <div class="plan-orders">
          <h3>计划包含的订单</h3>
          <el-table :data="currentPlan.orders" stripe size="small">
            <el-table-column prop="orderCode" label="订单编号" width="150" />
            <el-table-column prop="productName" label="产品名称" width="150" />
            <el-table-column prop="quantity" label="数量" width="100" align="right" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column label="订单状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getOrderStatusTagType(row.orderStatus)">{{ getOrderStatusText(row.orderStatus) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="completionRate" label="完成率" width="120">
              <template #default="{ row }">
                <div class="completion-rate">
                  <el-progress :percentage="row.completionRate" :show-text="false" />
                  <span class="rate-text">{{ row.completionRate }}%</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button @click="planDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ArrowLeft, Plus, Refresh, Download, Delete, Send } from '@element-plus/icons-vue'

// 生产计划类型定义
interface ProductionPlan {
  id: string
  planCode: string
  planName: string
  status: string
  startDate: string
  endDate: string
  totalOrders: number
  totalQuantity: number
  description?: string
  creator: string
  createTime: string
  orders?: PlanOrder[]
}

// 计划包含的订单类型定义
interface PlanOrder {
  orderCode: string
  productName: string
  quantity: number
  unit: string
  orderStatus: string
  completionRate: number
}

// 响应式数据
const loading = ref(false)
const planList = ref<ProductionPlan[]>([])
const selectedPlanIds = ref<string[]>([])
const planDialogVisible = ref(false)
const planDialogTitle = ref('')
const currentPlan = ref<ProductionPlan | null>(null)

// 搜索表单
const searchForm = reactive({
  planCode: '',
  planName: '',
  status: '',
  planPeriod: null as [string, string] | null
})

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 获取计划列表
const getPlanList = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    const mockData: ProductionPlan[] = [
      {
        id: '1',
        planCode: 'PP2024001',
        planName: 'Q1智能控制器生产计划',
        status: 'executing',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        totalOrders: 5,
        totalQuantity: 3500,
        creator: '张三',
        createTime: '2023-12-25 10:30:00'
      },
      {
        id: '2',
        planCode: 'PP2024002',
        planName: '传感器模组加急计划',
        status: 'published',
        startDate: '2024-01-10',
        endDate: '2024-01-20',
        totalOrders: 3,
        totalQuantity: 1500,
        creator: '李四',
        createTime: '2024-01-05 14:20:00'
      },
      {
        id: '3',
        planCode: 'PP2024003',
        planName: '2月电源模块生产计划',
        status: 'draft',
        startDate: '2024-02-01',
        endDate: '2024-02-29',
        totalOrders: 4,
        totalQuantity: 2000,
        description: '春节期间生产计划调整',
        creator: '王五',
        createTime: '2024-01-15 09:15:00'
      },
      {
        id: '4',
        planCode: 'PP2023015',
        planName: '2023年终收尾计划',
        status: 'completed',
        startDate: '2023-12-15',
        endDate: '2023-12-31',
        totalOrders: 2,
        totalQuantity: 800,
        creator: '赵六',
        createTime: '2023-12-10 16:45:00'
      }
    ]
    
    // 过滤数据
    let filteredData = [...mockData]
    if (searchForm.planCode) {
      filteredData = filteredData.filter(plan => 
        plan.planCode.includes(searchForm.planCode)
      )
    }
    if (searchForm.planName) {
      filteredData = filteredData.filter(plan => 
        plan.planName.includes(searchForm.planName)
      )
    }
    if (searchForm.status) {
      filteredData = filteredData.filter(plan => 
        plan.status === searchForm.status
      )
    }
    
    // 更新分页数据
    pagination.total = filteredData.length
    planList.value = filteredData.slice(
      (pagination.currentPage - 1) * pagination.pageSize,
      pagination.currentPage * pagination.pageSize
    )
  } catch (error) {
    console.error('获取计划列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取计划详情
const getPlanDetail = async (planId: string) => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 模拟计划详情数据
    const planDetail: ProductionPlan = {
      id: planId,
      planCode: 'PP2024001',
      planName: 'Q1智能控制器生产计划',
      status: 'executing',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      totalOrders: 5,
      totalQuantity: 3500,
      description: '2024年第一季度智能控制器的生产计划安排',
      creator: '张三',
      createTime: '2023-12-25 10:30:00',
      orders: [
        {
          orderCode: 'PO2024001',
          productName: '智能控制器A型',
          quantity: 1000,
          unit: '台',
          orderStatus: 'in_progress',
          completionRate: 65
        },
        {
          orderCode: 'PO2024002',
          productName: '智能控制器B型',
          quantity: 800,
          unit: '台',
          orderStatus: 'in_progress',
          completionRate: 45
        },
        {
          orderCode: 'PO2024003',
          productName: '智能控制器C型',
          quantity: 700,
          unit: '台',
          orderStatus: 'not_started',
          completionRate: 0
        },
        {
          orderCode: 'PO2024004',
          productName: '智能控制器A型',
          quantity: 500,
          unit: '台',
          orderStatus: 'completed',
          completionRate: 100
        },
        {
          orderCode: 'PO2024005',
          productName: '智能控制器B型',
          quantity: 500,
          unit: '台',
          orderStatus: 'in_progress',
          completionRate: 30
        }
      ]
    }
    
    return planDetail
  } catch (error) {
    console.error('获取计划详情失败:', error)
    throw error
  }
}

// 获取计划状态文本
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    executing: '执行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

// 获取计划状态标签类型
const getStatusTagType = (status: string): string => {
  const typeMap: Record<string, string> = {
    draft: 'info',
    published: 'primary',
    executing: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取订单状态文本
const getOrderStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    not_started: '未开始',
    in_progress: '进行中',
    completed: '已完成',
    paused: '已暂停',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

// 获取订单状态标签类型
const getOrderStatusTagType = (status: string): string => {
  const typeMap: Record<string, string> = {
    not_started: 'info',
    in_progress: 'primary',
    completed: 'success',
    paused: 'warning',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1
  getPlanList()
}

// 处理重置
const handleReset = () => {
  Object.assign(searchForm, {
    planCode: '',
    planName: '',
    status: '',
    planPeriod: null
  })
  pagination.currentPage = 1
  getPlanList()
}

// 处理刷新
const handleRefresh = () => {
  getPlanList()
}

// 处理创建计划
const handleCreatePlan = () => {
  // 跳转到创建计划页面
  ElMessage.info('跳转到创建计划页面')
}

// 处理查看计划
const handleViewPlan = async (plan: ProductionPlan) => {
  planDialogTitle.value = '计划详情'
  loading.value = true
  try {
    currentPlan.value = await getPlanDetail(plan.id)
    planDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取计划详情失败')
  } finally {
    loading.value = false
  }
}

// 处理编辑计划
const handleEditPlan = (plan: ProductionPlan) => {
  ElMessage.info(`编辑计划 ${plan.planCode}`)
}

// 处理发布计划
const handlePublishPlan = (plan: ProductionPlan) => {
  ElMessageBox.confirm(`确定要发布计划 ${plan.planCode} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟发布操作
    plan.status = 'published'
    ElMessage.success('计划发布成功')
  }).catch(() => {
    // 取消发布
  })
}

// 处理执行计划
const handleExecutePlan = (plan: ProductionPlan) => {
  ElMessageBox.confirm(`确定要执行计划 ${plan.planCode} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟执行操作
    plan.status = 'executing'
    ElMessage.success('计划开始执行')
  }).catch(() => {
    // 取消执行
  })
}

// 处理删除计划
const handleDeletePlan = (id: string) => {
  ElMessageBox.confirm('确定要删除这条计划吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟删除操作
    planList.value = planList.value.filter(plan => plan.id !== id)
    ElMessage.success('删除成功')
  }).catch(() => {
    // 取消删除
  })
}

// 处理批量删除
const handleBatchDelete = () => {
  if (selectedPlanIds.value.length === 0) {
    ElMessage.warning('请选择要删除的计划')
    return
  }
  
  ElMessageBox.confirm(`确定要删除选中的 ${selectedPlanIds.value.length} 条计划吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟批量删除操作
    planList.value = planList.value.filter(
      plan => !selectedPlanIds.value.includes(plan.id)
    )
    selectedPlanIds.value = []
    ElMessage.success('批量删除成功')
  }).catch(() => {
    // 取消删除
  })
}

// 处理批量发布
const handleBatchPublish = () => {
  if (selectedPlanIds.value.length === 0) {
    ElMessage.warning('请选择要发布的计划')
    return
  }
  
  ElMessageBox.confirm(`确定要发布选中的 ${selectedPlanIds.value.length} 条计划吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟批量发布操作
    planList.value.forEach(plan => {
      if (selectedPlanIds.value.includes(plan.id) && plan.status === 'draft') {
        plan.status = 'published'
      }
    })
    selectedPlanIds.value = []
    ElMessage.success('批量发布成功')
  }).catch(() => {
    // 取消发布
  })
}

// 处理导出
const handleExport = () => {
  // 模拟导出操作
  ElMessage.success('计划导出成功')
}

// 处理选择变化
const handleSelectionChange = (selection: ProductionPlan[]) => {
  selectedPlanIds.value = selection.map(plan => plan.id)
}

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  getPlanList()
}

// 处理页码变化
const handleCurrentChange = (current: number) => {
  pagination.currentPage = current
  getPlanList()
}

// 处理计划对话框关闭
const handlePlanDialogClose = () => {
  currentPlan.value = null
}

// 处理返回
const handleBack = () => {
  window.location.href = '/#/manufacturing/production-order/list'
}

// 组件挂载时获取数据
onMounted(() => {
  getPlanList()
})
</script>

<style scoped>
.production-planning {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-card {
  margin-bottom: 20px;
}

.data-card {
  margin-bottom: 20px;
}

.table-actions {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.plan-detail {
  padding: 10px;
}

.plan-orders {
  margin-top: 20px;
}

.plan-orders h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
}

.completion-rate {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rate-text {
  font-size: 12px;
  min-width: 35px;
  text-align: right;
    <!-- 筛选和统计 -->
    <div class="filter-stats-section">
      <el-card class="filter-card" shadow="never">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="计划周期">
            <el-select v-model="filterForm.period" @change="handlePeriodChange">
              <el-option label="日计划" value="daily" />
              <el-option label="周计划" value="weekly" />
              <el-option label="月计划" value="monthly" />
              <el-option label="季度计划" value="quarterly" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="部门">
            <el-select v-model="filterForm.department" placeholder="请选择部门">
              <el-option label="全部" value="" />
              <el-option label="生产一部" value="dept1" />
              <el-option label="生产二部" value="dept2" />
              <el-option label="生产三部" value="dept3" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleFilter" :icon="Search">查询</el-button>
            <el-button @click="handleReset" :icon="Refresh">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <el-icon><Calendar /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.totalPlans }}</div>
                <div class="stat-label">计划总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.inProgress }}</div>
                <div class="stat-label">执行中</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.completionRate }}%</div>
                <div class="stat-label">完成率</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                <el-icon><Box /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.totalOutput }}</div>
                <div class="stat-label">计划产量</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-row :gutter="20">
        <!-- 计划列表 -->
        <el-col :span="12">
          <el-card class="plan-list-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>生产计划列表</span>
                <el-tag type="info">{{ planList.length }} 个</el-tag>
              </div>
            </template>
            
            <el-table
              :data="planList"
              height="600"
              @row-click="handlePlanSelect"
              highlight-current-row
            >
              <el-table-column type="index" width="50" />
              <el-table-column prop="planNumber" label="计划编号" width="120" />
              <el-table-column prop="planName" label="计划名称" min-width="150" />
              <el-table-column prop="period" label="计划周期" width="100">
                <template #default="{ row }">
                  <el-tag size="small">{{ getPeriodLabel(row.period) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)" size="small">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="startDate" label="开始日期" width="110">
                <template #default="{ row }">
                  {{ formatDate(row.startDate) }}
                </template>
              </el-table-column>
              <el-table-column prop="progress" label="进度" width="80">
                <template #default="{ row }">
                  {{ row.progress }}%
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <!-- 计划详情 -->
        <el-col :span="12">
          <el-card class="plan-detail-card" shadow="never" v-if="selectedPlan">
            <template #header>
              <div class="card-header">
                <span>计划详情</span>
                <div class="header-actions">
                  <el-button size="small" @click="handleEditPlan" :icon="Edit">编辑</el-button>
                  <el-button size="small" type="success" @click="handleExecutePlan" :icon="VideoPlay">执行</el-button>
                </div>
              </div>
            </template>

            <div class="plan-detail-content">
              <!-- 基本信息 -->
              <div class="detail-section">
                <h4>基本信息</h4>
                <el-descriptions :column="2" size="small">
                  <el-descriptions-item label="计划编号">{{ selectedPlan.planNumber }}</el-descriptions-item>
                  <el-descriptions-item label="计划名称">{{ selectedPlan.planName }}</el-descriptions-item>
                  <el-descriptions-item label="计划周期">{{ getPeriodLabel(selectedPlan.period) }}</el-descriptions-item>
                  <el-descriptions-item label="状态">
                    <el-tag :type="getStatusTagType(selectedPlan.status)">
                      {{ getStatusLabel(selectedPlan.status) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="开始时间">{{ formatDate(selectedPlan.startDate) }}</el-descriptions-item>
                  <el-descriptions-item label="结束时间">{{ formatDate(selectedPlan.endDate) }}</el-descriptions-item>
                </el-descriptions>
              </div>

              <!-- 生产目标 -->
              <div class="detail-section">
                <h4>生产目标</h4>
                <el-descriptions :column="2" size="small">
                  <el-descriptions-item label="计划产量">{{ selectedPlan.targetOutput }}</el-descriptions-item>
                  <el-descriptions-item label="已完成产量">{{ selectedPlan.completedOutput }}</el-descriptions-item>
                  <el-descriptions-item label="完成进度">{{ selectedPlan.progress }}%</el-descriptions-item>
                  <el-descriptions-item label="目标产值">¥{{ formatNumber(selectedPlan.targetValue) }}</el-descriptions-item>
                </el-descriptions>
                <div class="progress-section">
                  <span>完成进度</span>
                  <el-progress
                    :percentage="selectedPlan.progress"
                    :color="getProgressColor(selectedPlan.progress)"
                    :stroke-width="8"
                  />
                </div>
              </div>

              <!-- 包含的订单 -->
              <div class="detail-section">
                <h4>包含的订单</h4>
                <el-table :data="selectedPlan.orders" size="small" max-height="200">
                  <el-table-column prop="orderNumber" label="订单号" width="120" />
                  <el-table-column prop="productName" label="产品名称" min-width="120" />
                  <el-table-column prop="quantity" label="数量" width="80" />
                  <el-table-column prop="status" label="状态" width="100">
                    <template #default="{ row }">
                      <el-tag :type="getStatusTagType(row.status)" size="small">
                        {{ getStatusLabel(row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-card>

          <!-- 空状态 -->
          <el-card class="empty-card" shadow="never" v-else>
            <el-empty description="请选择一个计划查看详情" />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 计划甘特图 -->
    <el-card class="gantt-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>计划甘特图</span>
          <el-button-group>
            <el-button size="small" @click="handleZoomIn" :icon="ZoomIn">放大</el-button>
            <el-button size="small" @click="handleZoomOut" :icon="ZoomOut">缩小</el-button>
            <el-button size="small" @click="handleFitScreen" :icon="FullScreen">适应</el-button>
          </el-button-group>
        </div>
      </template>
      
      <div ref="ganttChartRef" class="gantt-container"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Plus, Download, Search, Refresh, Calendar, Timer, TrendCharts, Box,
  Edit, VideoPlay, ZoomIn, ZoomOut, FullScreen
} from '@element-plus/icons-vue'

const router = useRouter()

// 响应式数据
const filterForm = reactive({
  period: 'weekly',
  dateRange: [],
  department: ''
})

const statistics = reactive({
  totalPlans: 0,
  inProgress: 0,
  completionRate: 0,
  totalOutput: 0
})

const planList = ref([])
const selectedPlan = ref(null)
const ganttChartRef = ref()

// 方法
const handleCreatePlan = () => {
  router.push('/manufacturing/production-plan/create')
}

const handleExport = () => {
  ElMessage.success('导出功能开发中...')
}

const handlePeriodChange = () => {
  handleFilter()
}

const handleFilter = () => {
  loadPlanList()
}

const handleReset = () => {
  Object.assign(filterForm, {
    period: 'weekly',
    dateRange: [],
    department: ''
  })
  handleFilter()
}

const handlePlanSelect = (row) => {
  selectedPlan.value = row
}

const handleEditPlan = () => {
  if (!selectedPlan.value) return
  router.push(`/manufacturing/production-plan/edit/${selectedPlan.value.id}`)
}

const handleExecutePlan = async () => {
  if (!selectedPlan.value) return
  
  try {
    // 这里调用执行计划API
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('计划执行成功')
    loadPlanList()
  } catch (error) {
    ElMessage.error('计划执行失败')
  }
}

const handleZoomIn = () => {
  // 甘特图放大
}

const handleZoomOut = () => {
  // 甘特图缩小
}

const handleFitScreen = () => {
  // 甘特图适应屏幕
}

// 工具方法
const getPeriodLabel = (period) => {
  const map = {
    daily: '日计划',
    weekly: '周计划',
    monthly: '月计划',
    quarterly: '季度计划'
  }
  return map[period] || period
}

const getStatusTagType = (status) => {
  const map = {
    draft: 'info',
    pending: 'warning',
    approved: 'primary',
    in_progress: 'success',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = {
    draft: '草稿',
    pending: '待审批',
    approved: '已审批',
    in_progress: '执行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getProgressColor = (progress) => {
  if (progress >= 90) return '#67c23a'
  if (progress >= 70) return '#409eff'
  if (progress >= 50) return '#e6a23c'
  return '#f56c6c'
}

const formatNumber = (num) => {
  return Number(num).toLocaleString()
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

// 加载数据
const loadPlanList = async () => {
  try {
    // 这里调用API获取计划列表
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    planList.value = [
      {
        id: 1,
        planNumber: 'PP202401001',
        planName: '一月生产计划',
        period: 'monthly',
        status: 'in_progress',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        progress: 65,
        targetOutput: 10000,
        completedOutput: 6500,
        targetValue: 5000000,
        orders: [
          {
            orderNumber: 'PO000001',
            productName: '产品A',
            quantity: 5000,
            status: 'in_progress'
          },
          {
            orderNumber: 'PO000002',
            productName: '产品B',
            quantity: 5000,
            status: 'pending'
          }
        ]
      },
      {
        id: 2,
        planNumber: 'PP202401002',
        planName: '第二周生产计划',
        period: 'weekly',
        status: 'approved',
        startDate: '2024-01-08',
        endDate: '2024-01-14',
        progress: 30,
        targetOutput: 3000,
        completedOutput: 900,
        targetValue: 1500000,
        orders: [
          {
            orderNumber: 'PO000003',
            productName: '产品C',
            quantity: 2000,
            status: 'in_progress'
          },
          {
            orderNumber: 'PO000004',
            productName: '产品D',
            quantity: 1000,
            status: 'pending'
          }
        ]
      }
    ]
    
    // 更新统计数据
    statistics.totalPlans = planList.value.length
    statistics.inProgress = planList.value.filter(plan => plan.status === 'in_progress').length
    statistics.totalOutput = planList.value.reduce((sum, plan) => sum + plan.targetOutput, 0)
    
    const totalProgress = planList.value.reduce((sum, plan) => sum + plan.progress, 0)
    statistics.completionRate = Math.round(totalProgress / planList.value.length)
    
    if (planList.value.length > 0) {
      selectedPlan.value = planList.value[0]
    }
  } catch (error) {
    ElMessage.error('获取计划列表失败')
  }
}

// 初始化甘特图
const initGanttChart = () => {
  if (!ganttChartRef.value) return
  
  // 这里应该使用甘特图库
  // 为了示例，创建一个简单的甘特图
  ganttChartRef.value.innerHTML = `
    <div class="gantt-placeholder">
      <div class="placeholder-content">
        <el-icon size="48" color="#c0c4cc"><Calendar /></el-icon>
        <p>甘特图组件</p>
        <p class="placeholder-text">需要集成甘特图库来显示生产计划时间轴</p>
      </div>
    </div>
  `
}

onMounted(() => {
  loadPlanList()
  nextTick(() => {
    initGanttChart()
  })
})
</script>

<style scoped lang="scss">
.production-planning {
  padding: 20px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .header-left {
      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        color: #303133;
      }
    }
    
    .header-right {
      display: flex;
      gap: 12px;
    }
  }
  
  .filter-stats-section {
    .filter-card {
      margin-bottom: 20px;
    }
    
    .stats-row {
      margin-bottom: 20px;
      
      .stat-card {
        .stat-content {
          display: flex;
          align-items: center;
          gap: 16px;
          
          .stat-icon {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
          }
          
          .stat-info {
            flex: 1;
            
            .stat-value {
              font-size: 28px;
              font-weight: bold;
              color: #303133;
              line-height: 1;
            }
            
            .stat-label {
              font-size: 14px;
              color: #909399;
              margin-top: 4px;
            }
          }
        }
      }
    }
  }
  
  .main-content {
    margin-bottom: 20px;
    
    .plan-list-card, .plan-detail-card, .empty-card {
      height: 600px;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .header-actions {
          display: flex;
          gap: 8px;
        }
      }
    }
    
    .plan-detail-card {
      .plan-detail-content {
        height: 520px;
        overflow-y: auto;
        
        .detail-section {
          margin-bottom: 24px;
          
          h4 {
            margin: 0 0 12px 0;
            color: #303133;
            border-bottom: 1px solid #e4e7ed;
            padding-bottom: 8px;
          }
          
          .progress-section {
            margin-top: 12px;
            
            span {
              display: block;
              margin-bottom: 8px;
              font-size: 14px;
              color: #606266;
            }
          }
        }
      }
    }
  }
  
  .gantt-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .gantt-container {
      height: 400px;
      border: 1px dashed #dcdfe6;
      border-radius: 4px;
      
      .gantt-placeholder {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .placeholder-content {
          text-align: center;
          
          p {
            margin: 8px 0;
            color: #606266;
          }
          
          .placeholder-text {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
}
</style>