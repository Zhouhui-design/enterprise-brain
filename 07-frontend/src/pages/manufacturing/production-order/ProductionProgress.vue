<template>
  <div class="production-progress">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>生产进度</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>生产管理</el-breadcrumb-item>
          <el-breadcrumb-item>生产进度</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleUpdateProgress" :icon="Edit">
          更新进度
        </el-button>
        <el-button @click="handleBack" :icon="ArrowLeft">
          返回
        </el-button>
      </div>
    </div>

    <!-- 订单基本信息 -->
    <el-card class="order-info-card" shadow="never">
      <template #header>
        <span>订单信息</span>
      </template>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="订单号">{{ orderInfo.orderNumber }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ orderInfo.productName }}</el-descriptions-item>
        <el-descriptions-item label="计划数量">{{ orderInfo.quantity }}</el-descriptions-item>
        <el-descriptions-item label="完成数量">{{ orderInfo.completedQuantity }}</el-descriptions-item>
        <el-descriptions-item label="计划开始">{{ formatDate(orderInfo.planStartDate) }}</el-descriptions-item>
        <el-descriptions-item label="计划完成">{{ formatDate(orderInfo.planEndDate) }}</el-descriptions-item>
        <el-descriptions-item label="实际开始">{{ formatDate(orderInfo.actualStartDate) }}</el-descriptions-item>
        <el-descriptions-item label="工作中心">{{ orderInfo.workCenter }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 进度统计 -->
    <div class="progress-stats">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="progress-card">
            <div class="progress-content">
              <div class="progress-circle">
                <el-progress
                  type="circle"
                  :percentage="overallProgress"
                  :width="120"
                  :color="getProgressColor(overallProgress)"
                >
                  <span class="progress-value">{{ overallProgress }}%</span>
                </el-progress>
              </div>
              <div class="progress-info">
                <h4>总体进度</h4>
                <p>{{ orderInfo.completedQuantity }}/{{ orderInfo.quantity }}</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="progress-card">
            <div class="progress-content">
              <div class="progress-icon">
                <el-icon size="48" color="#409eff"><Timer /></el-icon>
              </div>
              <div class="progress-info">
                <h4>预计完成</h4>
                <p>{{ formatDate(orderInfo.estimatedEndDate) }}</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="progress-card">
            <div class="progress-content">
              <div class="progress-icon">
                <el-icon size="48" color="#67c23a"><Check /></el-icon>
              </div>
              <div class="progress-info">
                <h4>合格率</h4>
                <p>{{ qualityRate }}%</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 工序进度 -->
    <el-card class="process-progress-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>工序进度</span>
          <el-button size="small" @click="handleRefreshProcesses" :icon="Refresh">刷新</el-button>
        </div>
      </template>
      
      <el-steps :active="currentProcessStep" align-center>
        <el-step
          v-for="process in processList"
          :key="process.id"
          :title="process.name"
          :description="process.description"
          :status="getProcessStatus(process)"
        />
      </el-steps>
      
      <div class="process-details">
        <el-table :data="processList" border style="width: 100%">
          <el-table-column type="index" width="60" label="序号" />
          <el-table-column prop="name" label="工序名称" width="150" />
          <el-table-column prop="workCenter" label="工作中心" width="120" />
          <el-table-column prop="plannedQuantity" label="计划数量" width="100" />
          <el-table-column prop="completedQuantity" label="完成数量" width="100" />
          <el-table-column prop="progress" label="进度" width="150">
            <template #default="{ row }">
              <el-progress
                :percentage="row.progress"
                :color="getProgressColor(row.progress)"
                :show-text="true"
                :stroke-width="8"
              />
            </template>
          </el-table-column>
          <el-table-column prop="startTime" label="开始时间" width="160">
            <template #default="{ row }">
              {{ formatDate(row.startTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="endTime" label="结束时间" width="160">
            <template #default="{ row }">
              {{ formatDate(row.endTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="handleUpdateProcessProgress(row)">
                更新
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 生产日志 -->
    <el-card class="production-log-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>生产日志</span>
          <el-button size="small" @click="handleAddLog" :icon="Plus">添加日志</el-button>
        </div>
      </template>
      
      <el-timeline>
        <el-timeline-item
          v-for="log in productionLogs"
          :key="log.id"
          :timestamp="formatDateTime(log.createdAt)"
          :type="getLogType(log.type)"
        >
          <el-card class="log-item">
            <div class="log-header">
              <span class="log-title">{{ log.title }}</span>
              <el-tag :type="getLogTagType(log.type)" size="small">
                {{ getLogTypeLabel(log.type) }}
              </el-tag>
            </div>
            <div class="log-content">{{ log.content }}</div>
            <div class="log-footer">
              <span class="operator">操作人: {{ log.operator }}</span>
              <span class="shift">班次: {{ log.shift }}</span>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 更新进度对话框 -->
    <el-dialog
      v-model="progressDialogVisible"
      title="更新生产进度"
      width="600px"
    >
      <el-form :model="progressForm" label-width="120px">
        <el-form-item label="工序名称">
          <el-input v-model="progressForm.processName" readonly />
        </el-form-item>
        <el-form-item label="完成数量">
          <el-input-number
            v-model="progressForm.completedQuantity"
            :min="0"
            :max="progressForm.plannedQuantity"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="工时消耗">
          <el-input-number
            v-model="progressForm.laborHours"
            :min="0"
            :step="0.1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="设备使用">
          <el-input-number
            v-model="progressForm.equipmentHours"
            :min="0"
            :step="0.1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="progressForm.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="progressDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProgressUpdate" :loading="updating">
          提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Edit, Timer, Check, Refresh, Plus
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 响应式数据
const progressDialogVisible = ref(false)
const updating = ref(false)
const orderInfo = ref({})
const processList = ref([])
const productionLogs = ref([])
const qualityRate = ref(0)

// 进度表单
const progressForm = reactive({
  processName: '',
  plannedQuantity: 0,
  completedQuantity: 0,
  laborHours: 0,
  equipmentHours: 0,
  remarks: ''
})

// 计算属性
const overallProgress = computed(() => {
  if (!orderInfo.value.quantity) return 0
  return Math.round((orderInfo.value.completedQuantity / orderInfo.value.quantity) * 100)
})

const currentProcessStep = computed(() => {
  let step = 0
  for (const process of processList.value) {
    if (process.status === 'completed') {
      step++
    } else if (process.status === 'in_progress') {
      return step + 1
    }
  }
  return step
})

// 方法
const handleBack = () => {
  router.push('/manufacturing/production-order/list')
}

const handleUpdateProgress = () => {
  ElMessage.info('批量更新进度功能开发中...')
}

const handleRefreshProcesses = () => {
  loadProcessList()
}

const handleUpdateProcessProgress = (process) => {
  Object.assign(progressForm, {
    processId: process.id,
    processName: process.name,
    plannedQuantity: process.plannedQuantity,
    completedQuantity: process.completedQuantity,
    laborHours: 0,
    equipmentHours: 0,
    remarks: ''
  })
  progressDialogVisible.value = true
}

const handleAddLog = () => {
  ElMessage.info('添加日志功能开发中...')
}

const submitProgressUpdate = async () => {
  updating.value = true
  try {
    // 这里调用API更新进度
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('进度更新成功')
    progressDialogVisible.value = false
    loadProcessList()
    loadOrderInfo()
  } catch (error) {
    ElMessage.error('进度更新失败')
  } finally {
    updating.value = false
  }
}

// 工具方法
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const getProgressColor = (progress) => {
  if (progress >= 90) return '#67c23a'
  if (progress >= 70) return '#409eff'
  if (progress >= 50) return '#e6a23c'
  return '#f56c6c'
}

const getStatusTagType = (status) => {
  const map = {
    pending: 'info',
    in_progress: 'primary',
    completed: 'success',
    delayed: 'warning',
    failed: 'danger'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    delayed: '已延期',
    failed: '异常'
  }
  return map[status] || status
}

const getProcessStatus = (process) => {
  if (process.status === 'completed') return 'finish'
  if (process.status === 'in_progress') return 'process'
  if (process.status === 'failed') return 'error'
  return 'wait'
}

const getLogType = (type) => {
  const map = {
    info: 'primary',
    warning: 'warning',
    error: 'danger',
    success: 'success'
  }
  return map[type] || 'primary'
}

const getLogTagType = (type) => {
  const map = {
    info: 'info',
    warning: 'warning',
    error: 'danger',
    success: 'success'
  }
  return map[type] || 'info'
}

const getLogTypeLabel = (type) => {
  const map = {
    info: '信息',
    warning: '警告',
    error: '错误',
    success: '成功'
  }
  return map[type] || type
}

// 加载数据
const loadOrderInfo = async () => {
  try {
    // 这里调用API获取订单信息
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    orderInfo.value = {
      orderNumber: 'PO000001',
      productName: '产品A',
      quantity: 1000,
      completedQuantity: 650,
      planStartDate: '2024-01-01',
      planEndDate: '2024-01-15',
      actualStartDate: '2024-01-02',
      estimatedEndDate: '2024-01-14',
      workCenter: '装配车间'
    }
  } catch (error) {
    ElMessage.error('获取订单信息失败')
  }
}

const loadProcessList = async () => {
  try {
    // 这里调用API获取工序列表
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    processList.value = [
      {
        id: 1,
        name: '下料',
        workCenter: '下料车间',
        plannedQuantity: 1000,
        completedQuantity: 1000,
        progress: 100,
        startTime: '2024-01-02 08:00',
        endTime: '2024-01-03 12:00',
        status: 'completed'
      },
      {
        id: 2,
        name: '机加工',
        workCenter: '机加工车间',
        plannedQuantity: 1000,
        completedQuantity: 650,
        progress: 65,
        startTime: '2024-01-03 13:00',
        endTime: null,
        status: 'in_progress'
      },
      {
        id: 3,
        name: '装配',
        workCenter: '装配车间',
        plannedQuantity: 1000,
        completedQuantity: 0,
        progress: 0,
        startTime: null,
        endTime: null,
        status: 'pending'
      },
      {
        id: 4,
        name: '质检',
        workCenter: '质检车间',
        plannedQuantity: 1000,
        completedQuantity: 0,
        progress: 0,
        startTime: null,
        endTime: null,
        status: 'pending'
      }
    ]
  } catch (error) {
    ElMessage.error('获取工序信息失败')
  }
}

const loadProductionLogs = async () => {
  try {
    // 这里调用API获取生产日志
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    productionLogs.value = [
      {
        id: 1,
        title: '下料工序完成',
        content: '下料工序已完成1000件，合格率99.5%',
        type: 'success',
        operator: '张三',
        shift: '白班',
        createdAt: '2024-01-03 12:30'
      },
      {
        id: 2,
        title: '机加工工序开始',
        content: '机加工工序开始，设备运行正常',
        type: 'info',
        operator: '李四',
        shift: '晚班',
        createdAt: '2024-01-03 13:00'
      },
      {
        id: 3,
        title: '设备异常报警',
        content: '加工中心01号设备出现异常，已通知维修',
        type: 'warning',
        operator: '王五',
        shift: '夜班',
        createdAt: '2024-01-04 02:15'
      }
    ]
    
    // 计算合格率
    qualityRate.value = 98.5
  } catch (error) {
    ElMessage.error('获取生产日志失败')
  }
}

onMounted(() => {
  const orderId = route.params.id
  if (orderId) {
    loadOrderInfo()
    loadProcessList()
    loadProductionLogs()
  }
})
</script>

<style scoped lang="scss">
.production-progress {
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
  
  .order-info-card {
    margin-bottom: 20px;
  }
  
  .progress-stats {
    margin-bottom: 20px;
    
    .progress-card {
      .progress-content {
        display: flex;
        align-items: center;
        gap: 20px;
        
        .progress-circle {
          .progress-value {
            font-size: 20px;
            font-weight: bold;
            color: #303133;
          }
        }
        
        .progress-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #f5f7fa;
        }
        
        .progress-info {
          flex: 1;
          
          h4 {
            margin: 0 0 8px 0;
            color: #303133;
          }
          
          p {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
            color: #409eff;
          }
        }
      }
    }
  }
  
  .process-progress-card, .production-log-card {
    margin-bottom: 20px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .process-details {
      margin-top: 24px;
    }
    
    .log-item {
      margin-bottom: 0;
      
      .log-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        .log-title {
          font-weight: bold;
          color: #303133;
        }
      }
      
      .log-content {
        color: #606266;
        margin-bottom: 8px;
        line-height: 1.5;
      }
      
      .log-footer {
        font-size: 12px;
        color: #909399;
        display: flex;
        gap: 20px;
      }
    }
  }
}
</style>