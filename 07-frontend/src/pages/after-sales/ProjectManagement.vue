<template>
  <div class="project-management">
    <div class="page-header">
      <h1>研发项目管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateProject">
          <el-icon><Plus /></el-icon>
          新建项目
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 项目统计卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(stat, index) in projectStats" :key="index">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" :style="{ backgroundColor: stat.color }">
                <component :is="stat.icon" />
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 项目搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="项目名称">
          <el-input v-model="searchForm.projectName" placeholder="请输入项目名称" clearable />
        </el-form-item>
        <el-form-item label="项目状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="规划中" value="planning" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已暂停" value="paused" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="searchForm.manager" placeholder="请输入负责人" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 项目列表 -->
    <el-card class="table-card">
      <el-table :data="projectList" v-loading="loading" stripe>
        <el-table-column prop="projectCode" label="项目编号" width="120" />
        <el-table-column prop="projectName" label="项目名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="description" label="项目描述" min-width="250" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="manager" label="负责人" width="120" />
        <el-table-column prop="startDate" label="开始日期" width="110" />
        <el-table-column prop="endDate" label="结束日期" width="110" />
        <el-table-column prop="progress" label="进度" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :color="getProgressColor(row.progress)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button type="warning" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
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

    <!-- 新建/编辑项目对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="projectFormRef"
        :model="projectForm"
        :rules="projectRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目编号" prop="projectCode">
              <el-input v-model="projectForm.projectCode" placeholder="自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目名称" prop="projectName">
              <el-input v-model="projectForm.projectName" placeholder="请输入项目名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="projectForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入项目描述"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="projectForm.priority" placeholder="请选择优先级">
                <el-option label="高" value="高" />
                <el-option label="中" value="中" />
                <el-option label="低" value="低" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="projectForm.status" placeholder="请选择状态">
                <el-option label="规划中" value="planning" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已完成" value="completed" />
                <el-option label="已暂停" value="paused" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="负责人" prop="manager">
              <el-select v-model="projectForm.manager" placeholder="请选择负责人" filterable>
                <el-option
                  v-for="user in userList"
                  :key="user.id"
                  :label="user.name"
                  :value="user.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预算" prop="budget">
              <el-input-number
                v-model="projectForm.budget"
                :min="0"
                :precision="2"
                placeholder="请输入预算"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker
                v-model="projectForm.startDate"
                type="date"
                placeholder="请选择开始日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期" prop="endDate">
              <el-date-picker
                v-model="projectForm.endDate"
                type="date"
                placeholder="请选择结束日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="项目成员">
          <el-select
            v-model="projectForm.members"
            multiple
            placeholder="请选择项目成员"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.name"
              :value="user.name"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 项目详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="项目详情" size="60%">
      <div v-if="currentProject" class="project-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目编号">{{ currentProject.projectCode }}</el-descriptions-item>
          <el-descriptions-item label="项目名称">{{ currentProject.projectName }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityType(currentProject.priority)">{{ currentProject.priority }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentProject.status)">{{ getStatusText(currentProject.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentProject.manager }}</el-descriptions-item>
          <el-descriptions-item label="预算">￥{{ currentProject.budget?.toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ currentProject.startDate }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ currentProject.endDate }}</el-descriptions-item>
          <el-descriptions-item label="进度" span="2">
            <el-progress :percentage="currentProject.progress" :color="getProgressColor(currentProject.progress)" />
          </el-descriptions-item>
          <el-descriptions-item label="项目描述" span="2">{{ currentProject.description }}</el-descriptions-item>
          <el-descriptions-item label="项目成员" span="2">
            <el-tag v-for="member in currentProject.members" :key="member" style="margin-right: 8px; margin-bottom: 8px;">
              {{ member }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-tabs">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="甘特图" name="gantt">
              <ProjectGantt :project-id="currentProject.id" />
            </el-tab-pane>
            <el-tab-pane label="任务列表" name="tasks">
              <div class="task-list">
                <p>任务列表功能开发中...</p>
              </div>
            </el-tab-pane>
            <el-tab-pane label="文档管理" name="documents">
              <div class="documents">
                <p>文档管理功能开发中...</p>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Timer, User, Warning, Check } from '@element-plus/icons-vue'
import ProjectGantt from './components/ProjectGantt.vue'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const drawerVisible = ref(false)
const dialogTitle = ref('新建项目')
const currentProject = ref(null)
const activeTab = ref('gantt')
const projectFormRef = ref()

// 项目统计数据
const projectStats = ref([
  {
    label: '总项目数',
    value: '24',
    icon: Timer,
    color: '#409EFF'
  },
  {
    label: '进行中',
    value: '8',
    icon: Warning,
    color: '#E6A23C'
  },
  {
    label: '已完成',
    value: '12',
    icon: Check,
    color: '#67C23A'
  },
  {
    label: '项目成员',
    value: '86',
    icon: User,
    color: '#909399'
  }
])

// 搜索表单
const searchForm = reactive({
  projectName: '',
  status: '',
  manager: ''
})

// 项目表单
const projectForm = reactive({
  projectCode: '',
  projectName: '',
  description: '',
  priority: '',
  status: 'planning',
  manager: '',
  budget: 0,
  startDate: '',
  endDate: '',
  members: []
})

// 表单验证规则
const projectRules = {
  projectName: [
    { required: true, message: '请输入项目名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入项目描述', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  manager: [
    { required: true, message: '请选择负责人', trigger: 'change' }
  ]
}

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 项目列表数据
const projectList = ref([
  {
    id: 1,
    projectCode: 'PRJ001',
    projectName: '智能仓储系统',
    description: '基于AI的智能仓储管理系统开发项目',
    status: 'in_progress',
    priority: '高',
    manager: '张三',
    budget: 500000,
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    progress: 65,
    members: ['张三', '李四', '王五']
  },
  {
    id: 2,
    projectCode: 'PRJ002',
    projectName: '生产流程优化',
    description: '制造业生产流程数字化改造项目',
    status: 'planning',
    priority: '中',
    manager: '李四',
    budget: 300000,
    startDate: '2024-03-01',
    endDate: '2024-08-31',
    progress: 15,
    members: ['李四', '赵六']
  },
  {
    id: 3,
    projectCode: 'PRJ003',
    projectName: '质量管理系统',
    description: '产品质量全生命周期管理系统',
    status: 'completed',
    priority: '高',
    manager: '王五',
    budget: 450000,
    startDate: '2023-09-01',
    endDate: '2024-01-15',
    progress: 100,
    members: ['王五', '钱七', '孙八']
  }
])

// 用户列表（模拟数据）
const userList = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' },
  { id: 4, name: '赵六' },
  { id: 5, name: '钱七' },
  { id: 6, name: '孙八' }
])

// 状态类型映射
const getStatusType = (status) => {
  const typeMap = {
    planning: 'info',
    in_progress: 'warning',
    completed: 'success',
    paused: 'danger'
  }
  return typeMap[status] || 'info'
}

// 状态文本映射
const getStatusText = (status) => {
  const textMap = {
    planning: '规划中',
    in_progress: '进行中',
    completed: '已完成',
    paused: '已暂停'
  }
  return textMap[status] || status
}

// 优先级类型映射
const getPriorityType = (priority) => {
  const typeMap = {
    '高': 'danger',
    '中': 'warning',
    '低': 'info'
  }
  return typeMap[priority] || 'info'
}

// 进度颜色
const getProgressColor = (progress) => {
  if (progress < 30) return '#F56C6C'
  if (progress < 70) return '#E6A23C'
  return '#67C23A'
}

// 事件处理函数
const handleCreateProject = () => {
  dialogTitle.value = '新建项目'
  projectForm.projectCode = 'PRJ' + String(Date.now()).slice(-3)
  dialogVisible.value = true
}

const handleRefresh = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('刷新成功')
  }, 1000)
}

const handleSearch = () => {
  console.log('搜索条件:', searchForm)
  // 这里应该调用API进行搜索
  ElMessage.success('搜索完成')
}

const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  ElMessage.success('重置成功')
}

const handleView = (row) => {
  currentProject.value = row
  drawerVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑项目'
  Object.keys(projectForm).forEach(key => {
    projectForm[key] = row[key] || ''
  })
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除项目"${row.projectName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 这里应该调用API删除项目
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleSubmit = () => {
  projectFormRef.value.validate((valid) => {
    if (valid) {
      // 这里应该调用API保存项目
      dialogVisible.value = false
      ElMessage.success('保存成功')
      handleReset()
    }
  })
}

const handleDialogClose = () => {
  projectFormRef.value?.resetFields()
  handleReset()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  // 重新加载数据
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
  // 重新加载数据
}

onMounted(() => {
  pagination.total = projectList.value.length
})
</script>

<style scoped>
.project-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  color: #1d2129;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-container {
  margin-bottom: 20px;
}

.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 15px;
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #1d2129;
  line-height: 1;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #86909c;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.project-detail {
  padding: 20px;
}

.detail-tabs {
  margin-top: 30px;
}

.task-list,
.documents {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #86909c;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .stats-container .el-col {
    margin-bottom: 15px;
  }
}
</style>