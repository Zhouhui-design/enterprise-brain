<template>
  <div class="schedule-list">
    <div class="page-header">
      <h1>生产排程列表</h1>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon> 新建排程
      </el-button>
    </div>
    
    <!-- 搜索筛选区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" v-model="searchForm" class="search-form">
        <el-form-item label="排程编号">
          <el-input v-model="searchForm.scheduleCode" placeholder="请输入排程编号"></el-input>
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.productName" placeholder="请输入产品名称"></el-input>
        </el-form-item>
        <el-form-item label="计划周期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="排程状态">
          <el-select v-model="searchForm.status" placeholder="请选择排程状态">
            <el-option label="全部" value=""></el-option>
            <el-option label="未开始" value="not_started"></el-option>
            <el-option label="进行中" value="in_progress"></el-option>
            <el-option label="已完成" value="completed"></el-option>
            <el-option label="已暂停" value="paused"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 数据表格 -->
    <el-card shadow="never" class="data-card">
      <div class="table-actions">
        <el-button type="danger" size="small" @click="handleBatchDelete" :disabled="selectedRows.length === 0">
          <el-icon><Delete /></el-icon> 批量删除
        </el-button>
        <el-button type="info" size="small" @click="handleExport">
          <el-icon><Download /></el-icon> 导出数据
        </el-button>
      </div>
      
      <el-table 
        v-loading="loading" 
        :data="schedulesData" 
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="scheduleCode" label="排程编号" width="180"></el-table-column>
        <el-table-column prop="productName" label="产品名称" width="150"></el-table-column>
        <el-table-column prop="quantity" label="计划数量" width="100" align="right"></el-table-column>
        <el-table-column prop="startDate" label="开始日期" width="120"></el-table-column>
        <el-table-column prop="endDate" label="结束日期" width="120"></el-table-column>
        <el-table-column prop="status" label="排程状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="完成进度" width="150">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :format="percentageFormat"></el-progress>
          </template>
        </el-table-column>
        <el-table-column prop="createdBy" label="创建人" width="100"></el-table-column>
        <el-table-column prop="createdTime" label="创建时间" width="150"></el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          background
          layout="prev, pager, next, jumper, ->, total"
          :total="total"
          v-model:page-size="pageSize"
          v-model:current-page="currentPage"
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Delete, Download } from '@element-plus/icons-vue'

// 定义排程数据类型
interface Schedule {
  id: number
  scheduleCode: string
  productName: string
  quantity: number
  startDate: string
  endDate: string
  status: string
  progress: number
  createdBy: string
  createdTime: string
}

// 定义搜索表单类型
interface SearchForm {
  scheduleCode: string
  productName: string
  dateRange: string[]
  status: string
}

// 响应式数据
const searchForm = reactive<SearchForm>({
  scheduleCode: '',
  productName: '',
  dateRange: [],
  status: ''
})

const schedulesData = ref<Schedule[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedRows = ref<Schedule[]>([])
const loading = ref(false)

// 路由
const router = useRouter()

// 组件挂载时加载数据
onMounted(() => {
  loadData()
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    const mockData = getMockData()
    
    // 应用搜索筛选
    let filteredData = [...mockData]
    
    if (searchForm.scheduleCode) {
      filteredData = filteredData.filter(item => 
        item.scheduleCode.toLowerCase().includes(searchForm.scheduleCode.toLowerCase())
      )
    }
    
    if (searchForm.productName) {
      filteredData = filteredData.filter(item => 
        item.productName.toLowerCase().includes(searchForm.productName.toLowerCase())
      )
    }
    
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      filteredData = filteredData.filter(item => {
        const itemStartDate = new Date(item.startDate)
        const itemEndDate = new Date(item.endDate)
        const searchStartDate = new Date(searchForm.dateRange[0])
        const searchEndDate = new Date(searchForm.dateRange[1])
        
        // 检查日期范围是否有重叠
        return !(itemEndDate < searchStartDate || itemStartDate > searchEndDate)
      })
    }
    
    if (searchForm.status) {
      filteredData = filteredData.filter(item => item.status === searchForm.status)
    }
    
    // 应用分页
    total.value = filteredData.length
    const startIndex = (currentPage.value - 1) * pageSize.value
    const endIndex = startIndex + pageSize.value
    schedulesData.value = filteredData.slice(startIndex, endIndex)
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error('加载排程数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取模拟数据
const getMockData = (): Schedule[] => {
  return [
    {
      id: 1,
      scheduleCode: 'SC2023001',
      productName: '产品A',
      quantity: 500,
      startDate: '2023-07-15',
      endDate: '2023-07-25',
      status: 'in_progress',
      progress: 60,
      createdBy: '张三',
      createdTime: '2023-07-10 10:30:00'
    },
    {
      id: 2,
      scheduleCode: 'SC2023002',
      productName: '产品B',
      quantity: 300,
      startDate: '2023-07-18',
      endDate: '2023-07-28',
      status: 'in_progress',
      progress: 40,
      createdBy: '李四',
      createdTime: '2023-07-12 14:20:00'
    },
    {
      id: 3,
      scheduleCode: 'SC2023003',
      productName: '产品C',
      quantity: 200,
      startDate: '2023-07-01',
      endDate: '2023-07-10',
      status: 'completed',
      progress: 100,
      createdBy: '王五',
      createdTime: '2023-06-28 09:15:00'
    },
    {
      id: 4,
      scheduleCode: 'SC2023004',
      productName: '产品D',
      quantity: 400,
      startDate: '2023-07-20',
      endDate: '2023-07-30',
      status: 'not_started',
      progress: 0,
      createdBy: '赵六',
      createdTime: '2023-07-14 16:45:00'
    },
    {
      id: 5,
      scheduleCode: 'SC2023005',
      productName: '产品E',
      quantity: 150,
      startDate: '2023-07-12',
      endDate: '2023-07-22',
      status: 'paused',
      progress: 30,
      createdBy: '钱七',
      createdTime: '2023-07-08 11:20:00'
    },
    {
      id: 6,
      scheduleCode: 'SC2023006',
      productName: '产品F',
      quantity: 600,
      startDate: '2023-07-25',
      endDate: '2023-08-05',
      status: 'not_started',
      progress: 0,
      createdBy: '孙八',
      createdTime: '2023-07-16 13:50:00'
    },
    {
      id: 7,
      scheduleCode: 'SC2023007',
      productName: '产品G',
      quantity: 250,
      startDate: '2023-07-05',
      endDate: '2023-07-15',
      status: 'completed',
      progress: 100,
      createdBy: '周九',
      createdTime: '2023-07-01 09:30:00'
    }
  ]
}

// 查询
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.scheduleCode = ''
  searchForm.productName = ''
  searchForm.dateRange = []
  searchForm.status = ''
  currentPage.value = 1
  loadData()
}

// 创建排程
const handleCreate = () => {
  router.push('/scheduling/create')
}

// 查看排程
const handleView = (row: Schedule) => {
  router.push(`/scheduling/board?id=${row.id}`)
}

// 编辑排程
const handleEdit = (row: Schedule) => {
  router.push(`/scheduling/create?id=${row.id}`)
}

// 删除排程
const handleDelete = async (row: Schedule) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除排程「${row.scheduleCode}」吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟删除操作
    ElMessage.success('删除成功')
    await loadData()
  } catch (error) {
    // 取消删除，不需要处理
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的排程')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条排程吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟批量删除操作
    ElMessage.success('删除成功')
    await loadData()
    selectedRows.value = []
  } catch (error) {
    // 取消删除，不需要处理
  }
}

// 导出数据
const handleExport = () => {
  ElMessage.success('数据导出成功')
  // 实际应用中应该调用API导出数据
}

// 处理选择变化
const handleSelectionChange = (selection: Schedule[]) => {
  selectedRows.value = selection
}

// 处理页码变化
const handleCurrentChange = () => {
  loadData()
}

// 处理每页条数变化
const handleSizeChange = () => {
  currentPage.value = 1
  loadData()
}

// 获取状态文本
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'not_started': '未开始',
    'in_progress': '进行中',
    'completed': '已完成',
    'paused': '已暂停'
  }
  return statusMap[status] || status
}

// 获取状态标签类型
const getStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    'not_started': 'info',
    'in_progress': 'success',
    'completed': 'primary',
    'paused': 'warning'
  }
  return typeMap[status] || 'default'
}

// 百分比格式化
const percentageFormat = (percentage: number): string => {
  return `${percentage}%`
}
</script>

<style scoped>
.schedule-list {
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
  font-size: 20px;
  color: #303133;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 0;
}

.data-card {
  overflow: hidden;
}

.table-actions {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
  gap: 10px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.el-progress {
  margin-top: 5px;
}
</style>