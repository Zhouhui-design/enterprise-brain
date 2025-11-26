<template>
  <div class="design-management">
    <div class="page-header">
      <h1>设计管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateDesign">
          <el-icon><Plus /></el-icon>
          新建设计
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 设计统计卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(stat, index) in designStats" :key="index">
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

    <!-- 设计搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="设计名称">
          <el-input v-model="searchForm.designName" placeholder="请输入设计名称" clearable />
        </el-form-item>
        <el-form-item label="设计类型">
          <el-select v-model="searchForm.designType" placeholder="请选择设计类型" clearable>
            <el-option label="机械设计" value="mechanical" />
            <el-option label="电气设计" value="electrical" />
            <el-option label="软件设计" value="software" />
            <el-option label="结构设计" value="structural" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="审核中" value="reviewing" />
            <el-option label="已批准" value="approved" />
            <el-option label="已发布" value="published" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="设计师">
          <el-input v-model="searchForm.designer" placeholder="请输入设计师" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 设计列表 -->
    <el-card class="table-card">
      <el-table :data="designList" v-loading="loading" stripe>
        <el-table-column prop="designCode" label="设计编号" width="120" />
        <el-table-column prop="designName" label="设计名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="designType" label="设计类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getDesignTypeColor(row.designType)">{{ getDesignTypeText(row.designType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="designer" label="设计师" width="120" />
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="createDate" label="创建日期" width="110" />
        <el-table-column prop="updateDate" label="更新日期" width="110" />
        <el-table-column prop="progress" label="完成度" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :color="getProgressColor(row.progress)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button type="success" size="small" @click="handlePreview(row)">预览</el-button>
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

    <!-- 新建/编辑设计对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="designFormRef"
        :model="designForm"
        :rules="designRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设计编号" prop="designCode">
              <el-input v-model="designForm.designCode" placeholder="自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设计名称" prop="designName">
              <el-input v-model="designForm.designName" placeholder="请输入设计名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设计类型" prop="designType">
              <el-select v-model="designForm.designType" placeholder="请选择设计类型">
                <el-option label="机械设计" value="mechanical" />
                <el-option label="电气设计" value="electrical" />
                <el-option label="软件设计" value="software" />
                <el-option label="结构设计" value="structural" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设计师" prop="designer">
              <el-select v-model="designForm.designer" placeholder="请选择设计师" filterable>
                <el-option
                  v-for="user in designerList"
                  :key="user.id"
                  :label="user.name"
                  :value="user.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="设计描述">
          <el-input
            v-model="designForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入设计描述"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="designForm.priority" placeholder="请选择优先级">
                <el-option label="高" value="高" />
                <el-option label="中" value="中" />
                <el-option label="低" value="低" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="designForm.status" placeholder="请选择状态">
                <el-option label="草稿" value="draft" />
                <el-option label="审核中" value="reviewing" />
                <el-option label="已批准" value="approved" />
                <el-option label="已发布" value="published" />
                <el-option label="已归档" value="archived" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="设计文件">
          <el-upload
            class="upload-demo"
            drag
            action="#"
            multiple
            :auto-upload="false"
            :on-change="handleFileChange"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 dwg, pdf, jpg, png 等格式，单个文件不超过 50MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="关联项目">
          <el-select
            v-model="designForm.relatedProjects"
            multiple
            placeholder="请选择关联项目"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="project in projectList"
              :key="project.id"
              :label="project.name"
              :value="project.id"
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

    <!-- 设计详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="设计详情" size="60%">
      <div v-if="currentDesign" class="design-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设计编号">{{ currentDesign.designCode }}</el-descriptions-item>
          <el-descriptions-item label="设计名称">{{ currentDesign.designName }}</el-descriptions-item>
          <el-descriptions-item label="设计类型">
            <el-tag :type="getDesignTypeColor(currentDesign.designType)">
              {{ getDesignTypeText(currentDesign.designType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentDesign.status)">{{ getStatusText(currentDesign.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="设计师">{{ currentDesign.designer }}</el-descriptions-item>
          <el-descriptions-item label="版本">v{{ currentDesign.version }}</el-descriptions-item>
          <el-descriptions-item label="创建日期">{{ currentDesign.createDate }}</el-descriptions-item>
          <el-descriptions-item label="更新日期">{{ currentDesign.updateDate }}</el-descriptions-item>
          <el-descriptions-item label="完成度" span="2">
            <el-progress :percentage="currentDesign.progress" :color="getProgressColor(currentDesign.progress)" />
          </el-descriptions-item>
          <el-descriptions-item label="设计描述" span="2">{{ currentDesign.description }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-tabs">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="设计预览" name="preview">
              <DesignViewer :design-id="currentDesign.id" />
            </el-tab-pane>
            <el-tab-pane label="版本历史" name="versions">
              <VersionHistory :design-id="currentDesign.id" />
            </el-tab-pane>
            <el-tab-pane label="设计评审" name="review">
              <DesignReview :design-id="currentDesign.id" />
            </el-tab-pane>
            <el-tab-pane label="相关文档" name="documents">
              <div class="documents">
                <p>相关文档功能开发中...</p>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-drawer>

    <!-- 设计预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="设计预览"
      width="90%"
      @close="handlePreviewClose"
    >
      <div v-if="previewDesign" class="preview-content">
        <DesignViewer :design-id="previewDesign.id" mode="full" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Timer, User, Warning, Check, UploadFilled } from '@element-plus/icons-vue'
import DesignViewer from './components/DesignViewer.vue'
import VersionHistory from './components/VersionHistory.vue'
import DesignReview from './components/DesignReview.vue'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const drawerVisible = ref(false)
const previewVisible = ref(false)
const dialogTitle = ref('新建设计')
const currentDesign = ref(null)
const previewDesign = ref(null)
const activeTab = ref('preview')
const designFormRef = ref()

// 设计统计数据
const designStats = ref([
  {
    label: '总设计数',
    value: '156',
    icon: Timer,
    color: '#409EFF'
  },
  {
    label: '审核中',
    value: '23',
    icon: Warning,
    color: '#E6A23C'
  },
  {
    label: '已发布',
    value: '89',
    icon: Check,
    color: '#67C23A'
  },
  {
    label: '设计师',
    value: '12',
    icon: User,
    color: '#909399'
  }
])

// 搜索表单
const searchForm = reactive({
  designName: '',
  designType: '',
  status: '',
  designer: ''
})

// 设计表单
const designForm = reactive({
  designCode: '',
  designName: '',
  designType: '',
  description: '',
  priority: '',
  status: 'draft',
  designer: '',
  relatedProjects: []
})

// 表单验证规则
const designRules = {
  designName: [
    { required: true, message: '请输入设计名称', trigger: 'blur' }
  ],
  designType: [
    { required: true, message: '请选择设计类型', trigger: 'change' }
  ],
  designer: [
    { required: true, message: '请选择设计师', trigger: 'change' }
  ]
}

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 设计列表数据
const designList = ref([
  {
    id: 1,
    designCode: 'D001',
    designName: '机械臂结构设计',
    designType: 'mechanical',
    status: 'approved',
    designer: '张工',
    version: '2.1',
    createDate: '2024-01-15',
    updateDate: '2024-02-20',
    progress: 85,
    description: '工业机器人机械臂的结构设计，包含所有零部件的详细设计图'
  },
  {
    id: 2,
    designCode: 'D002',
    designName: '控制系统电路图',
    designType: 'electrical',
    status: 'reviewing',
    designer: '李工',
    version: '1.5',
    createDate: '2024-02-01',
    updateDate: '2024-03-10',
    progress: 60,
    description: '自动化设备控制系统的电路原理图设计'
  },
  {
    id: 3,
    designCode: 'D003',
    designName: '生产管理软件界面',
    designType: 'software',
    status: 'published',
    designer: '王工',
    version: '3.0',
    createDate: '2023-11-01',
    updateDate: '2024-01-15',
    progress: 100,
    description: '生产管理系统用户界面设计'
  }
])

// 设计师列表
const designerList = ref([
  { id: 1, name: '张工' },
  { id: 2, name: '李工' },
  { id: 3, name: '王工' },
  { id: 4, name: '赵工' },
  { id: 5, name: '钱工' },
  { id: 6, name: '孙工' }
])

// 项目列表
const projectList = ref([
  { id: 1, name: '智能仓储系统' },
  { id: 2, name: '生产流程优化' },
  { id: 3, name: '质量管理系统' }
])

// 状态类型映射
const getStatusType = (status) => {
  const typeMap = {
    draft: 'info',
    reviewing: 'warning',
    approved: 'success',
    published: 'primary',
    archived: 'danger'
  }
  return typeMap[status] || 'info'
}

// 状态文本映射
const getStatusText = (status) => {
  const textMap = {
    draft: '草稿',
    reviewing: '审核中',
    approved: '已批准',
    published: '已发布',
    archived: '已归档'
  }
  return textMap[status] || status
}

// 设计类型颜色映射
const getDesignTypeColor = (type) => {
  const colorMap = {
    mechanical: 'primary',
    electrical: 'success',
    software: 'warning',
    structural: 'info'
  }
  return colorMap[type] || 'info'
}

// 设计类型文本映射
const getDesignTypeText = (type) => {
  const textMap = {
    mechanical: '机械设计',
    electrical: '电气设计',
    software: '软件设计',
    structural: '结构设计'
  }
  return textMap[type] || type
}

// 进度颜色
const getProgressColor = (progress) => {
  if (progress < 30) return '#F56C6C'
  if (progress < 70) return '#E6A23C'
  return '#67C23A'
}

// 事件处理函数
const handleCreateDesign = () => {
  dialogTitle.value = '新建设计'
  designForm.designCode = 'D' + String(Date.now()).slice(-3)
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
  ElMessage.success('搜索完成')
}

const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  ElMessage.success('重置成功')
}

const handleView = (row) => {
  currentDesign.value = row
  drawerVisible.value = true
}

const handlePreview = (row) => {
  previewDesign.value = row
  previewVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑设计'
  Object.keys(designForm).forEach(key => {
    designForm[key] = row[key] || ''
  })
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除设计"${row.designName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleSubmit = () => {
  designFormRef.value.validate((valid) => {
    if (valid) {
      dialogVisible.value = false
      ElMessage.success('保存成功')
      handleReset()
    }
  })
}

const handleDialogClose = () => {
  designFormRef.value?.resetFields()
  handleReset()
}

const handlePreviewClose = () => {
  previewDesign.value = null
}

const handleFileChange = (file, fileList) => {
  console.log('文件变化:', file, fileList)
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
}

onMounted(() => {
  pagination.total = designList.value.length
})
</script>

<style scoped>
.design-management {
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

.design-detail {
  padding: 20px;
}

.detail-tabs {
  margin-top: 30px;
}

.documents {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #86909c;
}

.preview-content {
  height: 70vh;
  overflow: auto;
}

.upload-demo {
  width: 100%;
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