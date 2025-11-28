<template>
  <div class="production-order-list">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>生产订单管理</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>生产管理</el-breadcrumb-item>
          <el-breadcrumb-item>生产订单</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleCreate" :icon="Plus">
          新建生产订单
        </el-button>
        <el-button type="success" @click="handleImport" :icon="Upload">
          批量导入
        </el-button>
        <el-button type="warning" @click="handleExport" :icon="Download">
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card" shadow="never">
      <el-form 
        :model="searchForm" 
        :inline="true" 
        @submit.prevent="handleSearch"
      >
        <el-form-item label="生产订单号">
          <el-input
            v-model="searchForm.orderNumber"
            placeholder="请输入生产订单号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input
            v-model="searchForm.productName"
            placeholder="请输入产品名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending" />
            <el-option label="已审核" value="approved" />
            <el-option label="生产中" value="in_production" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select
            v-model="searchForm.priority"
            placeholder="请选择优先级"
            clearable
            style="width: 120px"
          >
            <el-option label="紧急" value="urgent" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划日期">
          <el-date-picker
            v-model="searchForm.planDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">
            搜索
          </el-button>
          <el-button @click="handleReset" :icon="Refresh">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <el-icon><List /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.total }}</div>
                <div class="stat-label">总订单数</div>
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
                <div class="stat-label">生产中</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.completed }}</div>
                <div class="stat-label">已完成</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.urgent }}</div>
                <div class="stat-label">紧急订单</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <div class="table-header">
        <div class="table-title">
          <span>生产订单列表</span>
          <el-tag type="info">共 {{ pagination.total }} 条记录</el-tag>
        </div>
        <div class="table-actions">
          <el-button-group>
            <el-button 
              :type="viewMode === 'table' ? 'primary' : ''"
              @click="viewMode = 'table'"
              size="small"
            >
              <el-icon><Grid /></el-icon>
            </el-button>
            <el-button 
              :type="viewMode === 'card' ? 'primary' : ''"
              @click="viewMode = 'card'"
              size="small"
            >
              <el-icon><List /></el-icon>
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 表格视图 -->
      <el-table 
        v-if="viewMode === 'table'"
        :data="tableData" 
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" width="60" label="序号" />
        <el-table-column prop="orderNumber" label="生产订单号" width="140" fixed="left">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">
              {{ row.orderNumber }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="产品名称" min-width="180">
          <template #default="{ row }">
            <div class="product-info">
              <el-avatar :size="30" :src="row.productImage">
                {{ row.productName.charAt(0) }}
              </el-avatar>
              <div>
                <div class="product-name">{{ row.productName }}</div>
                <div class="product-code">{{ row.productCode }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="计划数量" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.quantity) }} {{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column prop="completedQuantity" label="完成数量" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.completedQuantity) }} {{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="完成进度" width="150">
          <template #default="{ row }">
            <el-progress
              :percentage="row.progress"
              :color="getProgressColor(row.progress)"
              :show-text="true"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityTagType(row.priority)" size="small">
              {{ getPriorityLabel(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="planStartDate" label="计划开始" width="120">
          <template #default="{ row }">
            {{ formatDate(row.planStartDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="planEndDate" label="计划完成" width="120">
          <template #default="{ row }">
            {{ formatDate(row.planEndDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="workCenter" label="工作中心" width="120" />
        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button 
                type="primary" 
                size="small"
                @click="handleView(row)"
                :icon="View"
              >
                查看
              </el-button>
              <el-button 
                v-if="canEdit(row)"
                type="warning" 
                size="small"
                @click="handleEdit(row)"
                :icon="Edit"
              >
                编辑
              </el-button>
              <el-dropdown @command="(command) => handleDropdownCommand(command, row)">
                <el-button type="info" size="small" :icon="More" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="schedule">
                      <el-icon><Clock /></el-icon>
                      排程
                    </el-dropdown-item>
                    <el-dropdown-item command="progress">
                      <el-icon><TrendCharts /></el-icon>
                      进度
                    </el-dropdown-item>
                    <el-dropdown-item command="bom">
                      <el-icon><Document /></el-icon>
                      BOM
                    </el-dropdown-item>
                    <el-dropdown-item command="material">
                      <el-icon><Box /></el-icon>
                      物料
                    </el-dropdown-item>
                    <el-dropdown-item command="quality" v-if="row.status === 'in_production'">
                      <el-icon><Star /></el-icon>
                      质检
                    </el-dropdown-item>
                    <el-dropdown-item command="approve" v-if="row.status === 'pending'">
                      <el-icon><Check /></el-icon>
                      审核
                    </el-dropdown-item>
                    <el-dropdown-item command="cancel" v-if="canCancel(row)" divided>
                      <el-icon><Close /></el-icon>
                      取消
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" v-if="canDelete(row)">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 卡片视图 -->
      <div v-else class="card-view">
        <el-row :gutter="20">
          <el-col 
            v-for="item in tableData" 
            :key="item.id" 
            :span="8"
            class="order-card-col"
          >
            <el-card class="order-card" shadow="hover" @click="handleView(item)">
              <template #header>
                <div class="card-header">
                  <div class="card-title">
                    <span class="order-number">{{ item.orderNumber }}</span>
                    <el-tag :type="getStatusTagType(item.status)" size="small">
                      {{ getStatusLabel(item.status) }}
                    </el-tag>
                  </div>
                  <el-tag :type="getPriorityTagType(item.priority)" size="small">
                    {{ getPriorityLabel(item.priority) }}
                  </el-tag>
                </div>
              </template>
              
              <div class="card-content">
                <div class="product-info">
                  <el-avatar :size="40" :src="item.productImage">
                    {{ item.productName.charAt(0) }}
                  </el-avatar>
                  <div class="product-details">
                    <div class="product-name">{{ item.productName }}</div>
                    <div class="product-code">{{ item.productCode }}</div>
                  </div>
                </div>
                
                <div class="progress-section">
                  <div class="progress-info">
                    <span>进度: {{ item.completedQuantity }}/{{ item.quantity }}</span>
                    <span>{{ item.progress }}%</span>
                  </div>
                  <el-progress
                    :percentage="item.progress"
                    :color="getProgressColor(item.progress)"
                    :show-text="false"
                    :stroke-width="8"
                  />
                </div>
                
                <div class="order-info">
                  <div class="info-item">
                    <span class="label">工作中心:</span>
                    <span>{{ item.workCenter }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">计划日期:</span>
                    <span>{{ formatDate(item.planStartDate) }} - {{ formatDate(item.planEndDate) }}</span>
                  </div>
                </div>
              </div>
              
              <div class="card-footer">
                <el-button size="small" @click.stop="handleView(item)">查看</el-button>
                <el-button v-if="canEdit(item)" size="small" type="warning" @click.stop="handleEdit(item)">编辑</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 导入对话框 -->
    <el-dialog 
      v-model="importDialogVisible" 
      title="批量导入生产订单" 
      width="600px"
    >
      <div class="import-content">
        <el-alert
          title="请按照模板格式准备Excel文件"
          type="info"
          :closable="false"
        />
        <div class="upload-area">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            @change="handleFileChange"
            drag
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传 xlsx/xls 文件，且不超过 10MB
              </div>
            </template>
          </el-upload>
        </div>
        <div class="template-download">
          <el-link type="primary" @click="downloadTemplate">
            <el-icon><Download /></el-icon>
            下载导入模板
          </el-link>
        </div>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportSubmit" :loading="importing">
          开始导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Upload, Download, Search, Refresh, Grid, List, View, Edit, More,
  Timer, Check, Warning, Clock, TrendCharts, Document, Box, Star, Close, Delete,
  UploadFilled
} from '@element-plus/icons-vue'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const viewMode = ref('table')
const tableData = ref([])
const selectedRows = ref([])
const importDialogVisible = ref(false)
const importing = ref(false)
const uploadRef = ref()

// 搜索表单
const searchForm = reactive({
  orderNumber: '',
  productName: '',
  status: '',
  priority: '',
  planDateRange: []
})

// 分页
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
})

// 统计数据
const statistics = reactive({
  total: 0,
  inProgress: 0,
  completed: 0,
  urgent: 0
})

// 方法
const handleSearch = () => {
  pagination.current = 1
  fetchData()
}

const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = key === 'planDateRange' ? [] : ''
  })
  handleSearch()
}

const handleCreate = () => {
  router.push('/manufacturing/production-order/create')
}

const handleView = (row) => {
  router.push(`/manufacturing/production-order/view/${row.id}`)
}

const handleEdit = (row) => {
  router.push(`/manufacturing/production-order/edit/${row.id}`)
}

const handleRowClick = (row) => {
  handleView(row)
}

const handleImport = () => {
  importDialogVisible.value = true
}

const handleExport = () => {
  ElMessage.success('导出功能开发中...')
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleDropdownCommand = async (command, row) => {
  switch (command) {
    case 'schedule':
      router.push(`/manufacturing/production-order/schedule/${row.id}`)
      break
    case 'progress':
      router.push(`/manufacturing/production-order/progress/${row.id}`)
      break
    case 'bom':
      router.push(`/manufacturing/production-order/bom/${row.id}`)
      break
    case 'material':
      router.push(`/manufacturing/production-order/material/${row.id}`)
      break
    case 'quality':
      router.push(`/manufacturing/quality/inspection/create?orderId=${row.id}`)
      break
    case 'approve':
      await approveOrder(row)
      break
    case 'cancel':
      await cancelOrder(row)
      break
    case 'delete':
      await deleteOrder(row)
      break
  }
}

const approveOrder = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要审核通过生产订单"${row.orderNumber}"吗？`,
      '确认审核',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里调用审核API
    ElMessage.success('审核成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('审核失败')
    }
  }
}

const cancelOrder = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消生产订单"${row.orderNumber}"吗？`,
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里调用取消API
    ElMessage.success('取消成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

const deleteOrder = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除生产订单"${row.orderNumber}"吗？此操作不可恢复！`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里调用删除API
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleFileChange = (file) => {
  // 处理文件选择
}

const handleImportSubmit = async () => {
  if (!uploadRef.value.uploadFiles.length) {
    ElMessage.warning('请选择要导入的文件')
    return
  }
  
  importing.value = true
  try {
    // 这里调用导入API
    await new Promise(resolve => setTimeout(resolve, 2000))
    ElMessage.success('导入成功')
    importDialogVisible.value = false
    fetchData()
  } catch (error) {
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

const downloadTemplate = () => {
  ElMessage.success('模板下载功能开发中...')
}

const handleSizeChange = (val) => {
  pagination.size = val
  fetchData()
}

const handleCurrentChange = (val) => {
  pagination.current = val
  fetchData()
}

// 权限判断
const canEdit = (row) => {
  return ['draft', 'pending', 'approved'].includes(row.status)
}

const canCancel = (row) => {
  return !['completed', 'cancelled'].includes(row.status)
}

const canDelete = (row) => {
  return ['draft'].includes(row.status)
}

// 工具方法
const getStatusTagType = (status) => {
  const map = {
    draft: 'info',
    pending: 'warning',
    approved: 'primary',
    in_production: 'success',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = {
    draft: '草稿',
    pending: '待审核',
    approved: '已审核',
    in_production: '生产中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getPriorityTagType = (priority) => {
  const map = {
    urgent: 'danger',
    high: 'warning',
    medium: 'primary',
    low: 'info'
  }
  return map[priority] || 'info'
}

const getPriorityLabel = (priority) => {
  const map = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[priority] || priority
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

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    // 这里调用API获取数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟数据
    tableData.value = Array.from({ length: 20 }, (_, index) => ({
      id: index + 1,
      orderNumber: `PO${String(index + 1).padStart(6, '0')}`,
      productName: `产品${index + 1}`,
      productCode: `P${String(index + 1).padStart(4, '0')}`,
      productImage: '',
      quantity: Math.floor(Math.random() * 1000) + 100,
      completedQuantity: Math.floor(Math.random() * 800),
      unit: '件',
      progress: Math.floor(Math.random() * 100),
      status: ['draft', 'pending', 'approved', 'in_production', 'completed', 'cancelled'][index % 6],
      priority: ['urgent', 'high', 'medium', 'low'][index % 4],
      planStartDate: new Date().toISOString(),
      planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      workCenter: `工作中心${(index % 5) + 1}`,
      creator: `用户${(index % 5) + 1}`,
      createdAt: new Date().toISOString()
    }))
    
    pagination.total = 200
    
    // 更新统计数据
    statistics.total = 200
    statistics.inProgress = 85
    statistics.completed = 95
    statistics.urgent = 12
  } catch (error) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.production-order-list {
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
  
  .search-card {
    margin-bottom: 20px;
  }
  
  .stats-cards {
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
  
  .table-card {
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      .table-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: bold;
      }
    }
    
    .product-info {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .product-name {
        font-weight: bold;
        color: #303133;
      }
      
      .product-code {
        font-size: 12px;
        color: #909399;
      }
    }
    
    .card-view {
      .order-card-col {
        margin-bottom: 20px;
      }
      
      .order-card {
        cursor: pointer;
        transition: all 0.3s;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .card-title {
            display: flex;
            align-items: center;
            gap: 8px;
            
            .order-number {
              font-weight: bold;
              color: #303133;
            }
          }
        }
        
        .card-content {
          .product-info {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
            
            .product-details {
              .product-name {
                font-weight: bold;
                color: #303133;
                margin-bottom: 4px;
              }
              
              .product-code {
                font-size: 12px;
                color: #909399;
              }
            }
          }
          
          .progress-section {
            margin-bottom: 16px;
            
            .progress-info {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
              font-size: 14px;
              color: #606266;
            }
          }
          
          .order-info {
            .info-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
              font-size: 14px;
              
              .label {
                color: #909399;
              }
            }
          }
        }
        
        .card-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e4e7ed;
        }
      }
    }
  }
  
  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}

.import-content {
  .upload-area {
    margin: 20px 0;
  }
  
  .template-download {
    text-align: center;
    margin-top: 16px;
  }
}
</style>