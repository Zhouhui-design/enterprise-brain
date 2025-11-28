<template>
  <div class="production-progress">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="handleBack" type="text">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1>生产进度管理</h1>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleReportProgress">
          <el-icon><EditPen /></el-icon>
          上报进度
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" label-width="100px">
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderCode" placeholder="请输入订单编号" />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.productName" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择订单状态">
            <el-option label="全部" value="" />
            <el-option label="未开始" value="not_started" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已暂停" value="paused" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.timeRange"
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

    <!-- 进度概览卡片 -->
    <div class="overview-cards">
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-number">{{ overview.totalOrders }}</div>
          <div class="overview-label">监控订单数</div>
        </div>
        <el-icon class="overview-icon"><Document /></el-icon>
      </el-card>
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-number">{{ overview.inProgressOrders }}</div>
          <div class="overview-label">进行中订单</div>
        </div>
        <el-icon class="overview-icon"><Timer /></el-icon>
      </el-card>
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-number">{{ overview.completedOrders }}</div>
          <div class="overview-label">今日完成</div>
        </div>
        <el-icon class="overview-icon"><Check /></el-icon>
      </el-card>
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-number">{{ overview.avgCompletionRate }}%</div>
          <div class="overview-label">平均完成率</div>
        </div>
        <el-icon class="overview-icon"><TrendCharts /></el-icon>
      </el-card>
    </div>

    <!-- 订单进度列表 -->
    <el-card class="data-card">
      <el-table
        v-loading="loading"
        :data="orderProgressList"
        stripe
      >
        <el-table-column prop="orderCode" label="订单编号" width="180" />
        <el-table-column prop="productName" label="产品名称" width="180" />
        <el-table-column prop="totalQuantity" label="订单数量" width="100" align="right" />
        <el-table-column prop="completedQuantity" label="已完成" width="100" align="right" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="完成率" width="180">
          <template #default="{ row }">
            <div class="completion-rate">
              <el-progress :percentage="row.completionRate" :color="getCompletionColor(row.completionRate)" />
              <span class="rate-text">{{ row.completionRate }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="plannedEndDate" label="计划完成日期" width="150" />
        <el-table-column prop="remainingDays" label="剩余天数" width="100" align="right">
          <template #default="{ row }">
            <span :class="{ 'overdue': row.remainingDays < 0 }">
              {{ row.remainingDays < 0 ? '已逾期' : `${row.remainingDays}天` }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="workshopName" label="生产车间" width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text @click="handleViewDetail(row)">查看详情</el-button>
            <el-button text @click="handleUpdateProgress(row)" v-if="row.status === 'in_progress'">更新</el-button>
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

    <!-- 订单进度详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="detailDialogTitle"
      width="900px"
      @close="handleDetailDialogClose"
    >
      <div v-if="currentOrderProgress" class="progress-detail">
        <!-- 订单基本信息 -->
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单编号">{{ currentOrderProgress.orderCode }}</el-descriptions-item>
          <el-descriptions-item label="产品信息">{{ currentOrderProgress.productName }} ({{ currentOrderProgress.productCode }})</el-descriptions-item>
          <el-descriptions-item label="订单数量">{{ currentOrderProgress.totalQuantity }} {{ currentOrderProgress.unit }}</el-descriptions-item>
          <el-descriptions-item label="已完成数量">{{ currentOrderProgress.completedQuantity }} {{ currentOrderProgress.unit }}</el-descriptions-item>
          <el-descriptions-item label="完成率">
            <el-progress :percentage="currentOrderProgress.completionRate" :color="getCompletionColor(currentOrderProgress.completionRate)" />
          </el-descriptions-item>
          <el-descriptions-item label="订单状态"><el-tag :type="getStatusTagType(currentOrderProgress.status)">{{ getStatusText(currentOrderProgress.status) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="计划时间">{{ currentOrderProgress.plannedStartDate }} 至 {{ currentOrderProgress.plannedEndDate }}</el-descriptions-item>
          <el-descriptions-item label="实际开始日期" v-if="currentOrderProgress.actualStartDate">{{ currentOrderProgress.actualStartDate }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentOrderProgress.responsiblePerson }}</el-descriptions-item>
        </el-descriptions>

        <!-- 工序进度列表 -->
        <div class="process-progress">
          <h3>工序进度明细</h3>
          <el-table :data="currentOrderProgress.processes" stripe size="small">
            <el-table-column prop="processCode" label="工序编码" width="120" />
            <el-table-column prop="processName" label="工序名称" width="150" />
            <el-table-column prop="totalQuantity" label="计划数量" width="100" align="right" />
            <el-table-column prop="completedQuantity" label="完成数量" width="100" align="right" />
            <el-table-column label="工序状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="startDate" label="开始日期" width="120" />
            <el-table-column prop="endDate" label="结束日期" width="120" />
            <el-table-column prop="workCenterName" label="工作中心" width="120" />
          </el-table>
        </div>

        <!-- 近期进度记录 -->
        <div class="progress-records">
          <h3>近期进度记录</h3>
          <el-table :data="currentOrderProgress.records" stripe size="small">
            <el-table-column prop="recordTime" label="记录时间" width="180" />
            <el-table-column prop="reportedQuantity" label="上报数量" width="100" align="right" />
            <el-table-column prop="totalCompleted" label="累计完成" width="100" align="right" />
            <el-table-column prop="completionRate" label="完成率" width="80" align="right">
              <template #default="{ row }">
                <span>{{ row.completionRate }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="reporter" label="上报人" width="100" />
            <el-table-column prop="remark" label="备注" />
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 进度上报对话框 -->
    <el-dialog
      v-model="progressDialogVisible"
      :title="progressDialogTitle"
      width="600px"
      @close="handleProgressDialogClose"
    >
      <el-form
        ref="progressFormRef"
        :model="progressForm"
        :rules="progressRules"
        label-width="120px"
      >
        <el-form-item label="订单编号">
          <el-input v-model="progressForm.orderCode" disabled />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="progressForm.productName" disabled />
        </el-form-item>
        <el-form-item label="上报数量" prop="reportedQuantity">
          <el-input-number
            v-model="progressForm.reportedQuantity"
            :min="1"
            :max="progressForm.remainingQuantity"
            :precision="0"
            style="width: 100%"
            placeholder="请输入本次完成数量"
          />
          <div class="form-hint">剩余可上报数量: {{ progressForm.remainingQuantity }} {{ progressForm.unit }}</div>
        </el-form-item>
        <el-form-item label="完成工序" prop="completedProcessId">
          <el-select
            v-model="progressForm.completedProcessId"
            placeholder="请选择完成的工序"
            filterable
          >
            <el-option
              v-for="process in progressForm.processOptions"
              :key="process.id"
              :label="process.name"
              :value="process.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="质量情况">
          <el-radio-group v-model="progressForm.qualityStatus">
            <el-radio :label="'qualified'">合格</el-radio>
            <el-radio :label="'partial_qualified'">部分合格</el-radio>
            <el-radio :label="'unqualified'">不合格</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="progressForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入进度备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="progressDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitProgress">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ArrowLeft, EditPen, Refresh, Download, Document, Timer, Check, TrendCharts } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'

// 订单进度类型定义
interface OrderProgress {
  id: string
  orderCode: string
  productCode: string
  productName: string
  totalQuantity: number
  completedQuantity: number
  completionRate: number
  unit: string
  status: string
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  remainingDays: number
  workshopName: string
  responsiblePerson: string
  processes?: ProcessProgress[]
  records?: ProgressRecord[]
}

// 工序进度类型定义
interface ProcessProgress {
  processCode: string
  processName: string
  totalQuantity: number
  completedQuantity: number
  status: string
  startDate: string
  endDate: string
  workCenterName: string
}

// 进度记录类型定义
interface ProgressRecord {
  recordTime: string
  reportedQuantity: number
  totalCompleted: number
  completionRate: number
  reporter: string
  remark?: string
}

// 进度表单类型定义
interface ProgressForm {
  orderCode: string
  productName: string
  unit: string
  reportedQuantity: number
  remainingQuantity: number
  completedProcessId: string
  qualityStatus: string
  remark: string
  processOptions: Array<{id: string, name: string}>
}

// 响应式数据
const loading = ref(false)
const orderProgressList = ref<OrderProgress[]>([])
const detailDialogVisible = ref(false)
const detailDialogTitle = ref('')
const currentOrderProgress = ref<OrderProgress | null>(null)
const progressDialogVisible = ref(false)
const progressDialogTitle = ref('')
const progressFormRef = ref<FormInstance>()

// 搜索表单
const searchForm = reactive({
  orderCode: '',
  productName: '',
  status: '',
  timeRange: null as [string, string] | null
})

// 进度表单
const progressForm = reactive<ProgressForm>({
  orderCode: '',
  productName: '',
  unit: '',
  reportedQuantity: 0,
  remainingQuantity: 0,
  completedProcessId: '',
  qualityStatus: 'qualified',
  remark: '',
  processOptions: []
})

// 进度表单验证规则
const progressRules = {
  reportedQuantity: [
    { required: true, message: '请输入上报数量', trigger: 'blur' },
    { min: 1, message: '上报数量必须大于0', trigger: 'blur' }
  ],
  completedProcessId: [{ required: true, message: '请选择完成的工序', trigger: 'change' }]
}

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 概览数据
const overview = reactive({
  totalOrders: 0,
  inProgressOrders: 0,
  completedOrders: 0,
  avgCompletionRate: 0
})

// 获取订单进度列表
const getOrderProgressList = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    const mockData: OrderProgress[] = [
      {
        id: '1',
        orderCode: 'PO2024001',
        productCode: 'PROD001',
        productName: '智能控制器',
        totalQuantity: 1000,
        completedQuantity: 650,
        completionRate: 65,
        unit: '台',
        status: 'in_progress',
        plannedStartDate: '2024-01-01',
        plannedEndDate: '2024-01-15',
        actualStartDate: '2024-01-01',
        remainingDays: 5,
        workshopName: '装配车间',
        responsiblePerson: '张三'
      },
      {
        id: '2',
        orderCode: 'PO2024002',
        productCode: 'PROD002',
        productName: '传感器模组',
        totalQuantity: 500,
        completedQuantity: 450,
        completionRate: 90,
        unit: '套',
        status: 'in_progress',
        plannedStartDate: '2024-01-05',
        plannedEndDate: '2024-01-20',
        actualStartDate: '2024-01-05',
        remainingDays: 10,
        workshopName: '测试车间',
        responsiblePerson: '李四'
      },
      {
        id: '3',
        orderCode: 'PO2024003',
        productCode: 'PROD003',
        productName: '电源模块',
        totalQuantity: 800,
        completedQuantity: 0,
        completionRate: 0,
        unit: '个',
        status: 'not_started',
        plannedStartDate: '2024-01-20',
        plannedEndDate: '2024-02-05',
        remainingDays: 15,
        workshopName: '电子车间',
        responsiblePerson: '王五'
      },
      {
        id: '4',
        orderCode: 'PO2024004',
        productCode: 'PROD004',
        productName: '控制面板',
        totalQuantity: 1200,
        completedQuantity: 360,
        completionRate: 30,
        unit: '件',
        status: 'in_progress',
        plannedStartDate: '2024-01-10',
        plannedEndDate: '2024-01-25',
        actualStartDate: '2024-01-10',
        remainingDays: 15,
        workshopName: '组装车间',
        responsiblePerson: '赵六'
      },
      {
        id: '5',
        orderCode: 'PO2024005',
        productCode: 'PROD005',
        productName: '连接线束',
        totalQuantity: 2000,
        completedQuantity: 2000,
        completionRate: 100,
        unit: '条',
        status: 'completed',
        plannedStartDate: '2024-01-01',
        plannedEndDate: '2024-01-10',
        actualStartDate: '2024-01-01',
        remainingDays: -5,
        workshopName: '线缆车间',
        responsiblePerson: '孙七'
      }
    ]
    
    // 过滤数据
    let filteredData = [...mockData]
    if (searchForm.orderCode) {
      filteredData = filteredData.filter(order => 
        order.orderCode.includes(searchForm.orderCode)
      )
    }
    if (searchForm.productName) {
      filteredData = filteredData.filter(order => 
        order.productName.includes(searchForm.productName)
      )
    }
    if (searchForm.status) {
      filteredData = filteredData.filter(order => 
        order.status === searchForm.status
      )
    }
    
    // 更新分页数据
    pagination.total = filteredData.length
    orderProgressList.value = filteredData.slice(
      (pagination.currentPage - 1) * pagination.pageSize,
      pagination.currentPage * pagination.pageSize
    )
    
    // 更新概览数据
    overview.totalOrders = mockData.length
    overview.inProgressOrders = mockData.filter(o => o.status === 'in_progress').length
    overview.completedOrders = mockData.filter(o => o.status === 'completed' && new Date(o.actualStartDate || '') >= new Date(Date.now() - 24 * 60 * 60 * 1000)).length
    overview.avgCompletionRate = Math.round(
      mockData.reduce((sum, order) => sum + order.completionRate, 0) / mockData.length
    )
  } catch (error) {
    console.error('获取订单进度列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取订单进度详情
const getOrderProgressDetail = async (orderId: string) => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 模拟详情数据
    const detailData: OrderProgress = {
      id: orderId,
      orderCode: 'PO2024001',
      productCode: 'PROD001',
      productName: '智能控制器',
      totalQuantity: 1000,
      completedQuantity: 650,
      completionRate: 65,
      unit: '台',
      status: 'in_progress',
      plannedStartDate: '2024-01-01',
      plannedEndDate: '2024-01-15',
      actualStartDate: '2024-01-01',
      remainingDays: 5,
      workshopName: '装配车间',
      responsiblePerson: '张三',
      processes: [
        {
          processCode: 'PROC001',
          processName: 'PCB贴片',
          totalQuantity: 1000,
          completedQuantity: 1000,
          status: 'completed',
          startDate: '2024-01-01',
          endDate: '2024-01-03',
          workCenterName: 'SMT生产线'
        },
        {
          processCode: 'PROC002',
          processName: '插件装配',
          totalQuantity: 1000,
          completedQuantity: 800,
          status: 'in_progress',
          startDate: '2024-01-03',
          endDate: '2024-01-07',
          workCenterName: '插件线'
        },
        {
          processCode: 'PROC003',
          processName: '功能测试',
          totalQuantity: 1000,
          completedQuantity: 650,
          status: 'in_progress',
          startDate: '2024-01-06',
          endDate: '2024-01-12',
          workCenterName: '测试线'
        },
        {
          processCode: 'PROC004',
          processName: '包装入库',
          totalQuantity: 1000,
          completedQuantity: 0,
          status: 'not_started',
          startDate: '2024-01-10',
          endDate: '2024-01-15',
          workCenterName: '包装线'
        }
      ],
      records: [
        {
          recordTime: '2024-01-10 18:00:00',
          reportedQuantity: 100,
          totalCompleted: 650,
          completionRate: 65,
          reporter: '张三',
          remark: '今日完成100台'
        },
        {
          recordTime: '2024-01-09 18:00:00',
          reportedQuantity: 120,
          totalCompleted: 550,
          completionRate: 55,
          reporter: '张三'
        },
        {
          recordTime: '2024-01-08 18:00:00',
          reportedQuantity: 130,
          totalCompleted: 430,
          completionRate: 43,
          reporter: '李四',
          remark: '生产顺利，略有提前'
        }
      ]
    }
    
    return detailData
  } catch (error) {
    console.error('获取订单进度详情失败:', error)
    throw error
  }
}

// 获取状态文本
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    not_started: '未开始',
    in_progress: '进行中',
    completed: '已完成',
    paused: '已暂停'
  }
  return statusMap[status] || status
}

// 获取状态标签类型
const getStatusTagType = (status: string): string => {
  const typeMap: Record<string, string> = {
    not_started: 'info',
    in_progress: 'primary',
    completed: 'success',
    paused: 'warning'
  }
  return typeMap[status] || 'info'
}

// 获取完成率颜色
const getCompletionColor = (rate: number): string => {
  if (rate >= 80) return '#67c23a'
  if (rate >= 50) return '#e6a23c'
  return '#f56c6c'
}

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1
  getOrderProgressList()
}

// 处理重置
const handleReset = () => {
  Object.assign(searchForm, {
    orderCode: '',
    productName: '',
    status: '',
    timeRange: null
  })
  pagination.currentPage = 1
  getOrderProgressList()
}

// 处理刷新
const handleRefresh = () => {
  getOrderProgressList()
}

// 处理查看详情
const handleViewDetail = async (order: OrderProgress) => {
  detailDialogTitle.value = '订单进度详情'
  loading.value = true
  try {
    currentOrderProgress.value = await getOrderProgressDetail(order.id)
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取订单进度详情失败')
  } finally {
    loading.value = false
  }
}

// 处理更新进度
const handleUpdateProgress = (order: OrderProgress) => {
  progressDialogTitle.value = '更新生产进度'
  Object.assign(progressForm, {
    orderCode: order.orderCode,
    productName: order.productName,
    unit: order.unit,
    reportedQuantity: 0,
    remainingQuantity: order.totalQuantity - order.completedQuantity,
    completedProcessId: '',
    qualityStatus: 'qualified',
    remark: '',
    processOptions: [
      { id: 'proc1', name: 'PCB贴片' },
      { id: 'proc2', name: '插件装配' },
      { id: 'proc3', name: '功能测试' },
      { id: 'proc4', name: '包装入库' }
    ]
  })
  progressDialogVisible.value = true
}

// 处理报表进度
const handleReportProgress = () => {
  // 这里可以跳转到通用的进度上报页面
  ElMessage.info('打开进度上报页面')
}

// 处理提交进度
const handleSubmitProgress = async () => {
  if (!progressFormRef.value) return
  
  try {
    await progressFormRef.value.validate()
    
    // 模拟提交数据
    await new Promise(resolve => setTimeout(resolve, 500))
    
    ElMessage.success('进度上报成功')
    progressDialogVisible.value = false
    getOrderProgressList()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 处理导出
const handleExport = () => {
  // 模拟导出操作
  ElMessage.success('报表导出成功')
}

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  getOrderProgressList()
}

// 处理页码变化
const handleCurrentChange = (current: number) => {
  pagination.currentPage = current
  getOrderProgressList()
}

// 处理详情对话框关闭
const handleDetailDialogClose = () => {
  currentOrderProgress.value = null
}

// 处理进度对话框关闭
const handleProgressDialogClose = () => {
  if (progressFormRef.value) {
    progressFormRef.value.resetFields()
  }
}

// 处理返回
const handleBack = () => {
  window.location.href = '/#/manufacturing/production-order/list'
}

// 组件挂载时获取数据
onMounted(() => {
  getOrderProgressList()
})
</script>

<style scoped>
.production-progress {
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

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.overview-card {
  position: relative;
  overflow: hidden;
}

.overview-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.overview-number {
  font-size: 32px;
  font-weight: 700;
  color: #1989fa;
}

.overview-label {
  font-size: 14px;
  color: #606266;
}

.overview-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 48px;
  color: rgba(25, 137, 250, 0.1);
}

.data-card {
  margin-bottom: 20px;
}

.completion-rate {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rate-text {
  font-size: 14px;
  font-weight: 500;
  min-width: 40px;
  text-align: right;
}

.overdue {
  color: #f56c6c;
  font-weight: 500;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.progress-detail {
  padding: 10px;
}

.process-progress,
.progress-records {
  margin-top: 20px;
}

.process-progress h3,
.progress-records h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
}

.form-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}
</style>