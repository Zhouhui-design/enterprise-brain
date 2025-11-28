<template>
  <div class="document-management">
    <div class="page-header">
      <h1>文档管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateDocument">
          <el-icon><Plus /></el-icon>
          新建文档
        </el-button>
        <el-button type="success" @click="handleBatchUpload">
          <el-icon><Upload /></el-icon>
          批量上传
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 文档统计卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(stat, index) in documentStats" :key="index">
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

    <!-- 文档搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="文档标题">
          <el-input v-model="searchForm.title" placeholder="请输入文档标题" clearable />
        </el-form-item>
        <el-form-item label="文档类型">
          <el-select v-model="searchForm.documentType" placeholder="请选择文档类型" clearable>
            <el-option label="技术文档" value="technical" />
            <el-option label="设计文档" value="design" />
            <el-option label="测试文档" value="test" />
            <el-option label="用户手册" value="manual" />
            <el-option label="会议纪要" value="meeting" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="审核中" value="reviewing" />
            <el-option label="已发布" value="published" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建人">
          <el-input v-model="searchForm.creator" placeholder="请输入创建人" clearable />
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 文档列表 -->
    <el-card class="table-card">
      <div class="table-header">
        <div class="table-title">
          <span>文档列表</span>
          <el-tag v-if="selectedDocuments.length > 0" type="info">
            已选择 {{ selectedDocuments.length }} 项
          </el-tag>
        </div>
        <div class="table-actions" v-if="selectedDocuments.length > 0">
          <el-button type="danger" size="small" @click="handleBatchDelete">
            批量删除
          </el-button>
          <el-button type="primary" size="small" @click="handleBatchDownload">
            批量下载
          </el-button>
        </div>
      </div>

      <el-table
        :data="documentList"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="docCode" label="文档编号" width="120" />
        <el-table-column prop="title" label="文档标题" min-width="250" show-overflow-tooltip />
        <el-table-column prop="documentType" label="文档类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getDocumentTypeColor(row.documentType)">
              {{ getDocumentTypeText(row.documentType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fileType" label="文件格式" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ row.fileType.toUpperCase() }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column prop="fileSize" label="文件大小" width="100">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="createDate" label="创建日期" width="110" />
        <el-table-column prop="updateDate" label="更新日期" width="110" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handlePreview(row)">预览</el-button>
            <el-button type="success" size="small" @click="handleDownload(row)">下载</el-button>
            <el-button type="warning" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="info" size="small" @click="handleVersion(row)">版本</el-button>
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

    <!-- 新建/编辑文档对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="documentFormRef"
        :model="documentForm"
        :rules="documentRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="文档编号" prop="docCode">
              <el-input v-model="documentForm.docCode" placeholder="自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文档标题" prop="title">
              <el-input v-model="documentForm.title" placeholder="请输入文档标题" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="文档类型" prop="documentType">
              <el-select v-model="documentForm.documentType" placeholder="请选择文档类型">
                <el-option label="技术文档" value="technical" />
                <el-option label="设计文档" value="design" />
                <el-option label="测试文档" value="test" />
                <el-option label="用户手册" value="manual" />
                <el-option label="会议纪要" value="meeting" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="documentForm.status" placeholder="请选择状态">
                <el-option label="草稿" value="draft" />
                <el-option label="审核中" value="reviewing" />
                <el-option label="已发布" value="published" />
                <el-option label="已归档" value="archived" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="文档描述">
          <el-input
            v-model="documentForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入文档描述"
          />
        </el-form-item>
        <el-form-item label="文档文件" prop="file" v-if="!documentForm.id">
          <el-upload
            class="upload-demo"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            :file-list="fileList"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 doc, docx, pdf, xls, xlsx, ppt, pptx, txt 等格式，单个文件不超过 100MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="关联项目">
          <el-select
            v-model="documentForm.relatedProjects"
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
        <el-form-item label="标签">
          <el-select
            v-model="documentForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入或选择标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in tagList"
              :key="tag"
              :label="tag"
              :value="tag"
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

    <!-- 文档预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="文档预览"
      width="90%"
      @close="handlePreviewClose"
    >
      <div v-if="previewDocument" class="preview-content">
        <div class="preview-header">
          <h3>{{ previewDocument.title }}</h3>
          <div class="preview-info">
            <span>创建人: {{ previewDocument.creator }}</span>
            <span>创建时间: {{ previewDocument.createDate }}</span>
            <span>文件大小: {{ formatFileSize(previewDocument.fileSize) }}</span>
          </div>
        </div>
        <div class="preview-body">
          <iframe
            v-if="isPdfFile(previewDocument.fileType)"
            :src="previewDocument.url"
            width="100%"
            height="600px"
            frameborder="0"
          ></iframe>
          <div v-else class="no-preview">
            <el-icon size="64" color="#909399"><Document /></el-icon>
            <p>该文件类型不支持在线预览</p>
            <el-button type="primary" @click="handleDownload(previewDocument)">
              下载查看
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 版本历史对话框 -->
    <el-dialog
      v-model="versionVisible"
      title="版本历史"
      width="800px"
    >
      <el-timeline>
        <el-timeline-item
          v-for="(version, index) in versionList"
          :key="index"
          :timestamp="version.createTime"
          :type="getVersionType(index)"
        >
          <el-card>
            <div class="version-item">
              <div class="version-header">
                <h4>版本 {{ version.version }}</h4>
                <el-tag :type="getStatusType(version.status)">
                  {{ getStatusText(version.status) }}
                </el-tag>
              </div>
              <p><strong>更新人:</strong> {{ version.updater }}</p>
              <p><strong>更新说明:</strong> {{ version.description }}</p>
              <div class="version-actions">
                <el-button size="small" @click="handleDownloadVersion(version)">
                  下载此版本
                </el-button>
                <el-button size="small" type="primary" @click="handleRestoreVersion(version)">
                  恢复此版本
                </el-button>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>

    <!-- 批量上传对话框 -->
    <el-dialog
      v-model="batchUploadVisible"
      title="批量上传文档"
      width="800px"
    >
      <el-upload
        class="batch-upload"
        drag
        action="#"
        multiple
        :auto-upload="false"
        :on-change="handleBatchFileChange"
        :file-list="batchFileList"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持批量上传，每次最多上传20个文件，单个文件不超过100MB
          </div>
        </template>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchUploadVisible = false">取消</el-button>
          <el-button type="primary" @click="handleBatchUploadSubmit">开始上传</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Timer, User, Warning, Check, Upload, UploadFilled, Document } from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const previewVisible = ref(false)
const versionVisible = ref(false)
const batchUploadVisible = ref(false)
const dialogTitle = ref('新建文档')
const previewDocument = ref(null)
const selectedDocuments = ref([])
const activeTab = ref('preview')
const documentFormRef = ref()
const fileList = ref([])
const batchFileList = ref([])

// 文档统计数据
const documentStats = ref([
  {
    label: '总文档数',
    value: '486',
    icon: Timer,
    color: '#409EFF'
  },
  {
    label: '已发布',
    value: '312',
    icon: Check,
    color: '#67C23A'
  },
  {
    label: '审核中',
    value: '45',
    icon: Warning,
    color: '#E6A23C'
  },
  {
    label: '今日上传',
    value: '18',
    icon: User,
    color: '#909399'
  }
])

// 搜索表单
const searchForm = reactive({
  title: '',
  documentType: '',
  status: '',
  creator: '',
  dateRange: []
})

// 文档表单
const documentForm = reactive({
  docCode: '',
  title: '',
  documentType: '',
  description: '',
  status: 'draft',
  relatedProjects: [],
  tags: []
})

// 表单验证规则
const documentRules = {
  title: [
    { required: true, message: '请输入文档标题', trigger: 'blur' }
  ],
  documentType: [
    { required: true, message: '请选择文档类型', trigger: 'change' }
  ]
}

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 文档列表数据
const documentList = ref([
  {
    id: 1,
    docCode: 'DOC001',
    title: '智能仓储系统需求规格说明书',
    documentType: 'technical',
    fileType: 'pdf',
    status: 'published',
    creator: '张三',
    fileSize: 2048576,
    createDate: '2024-01-15',
    updateDate: '2024-02-20',
    description: '智能仓储系统的详细需求规格说明',
    url: 'https://example.com/doc1.pdf'
  },
  {
    id: 2,
    docCode: 'DOC002',
    title: '机械臂结构设计图纸',
    documentType: 'design',
    fileType: 'dwg',
    status: 'reviewing',
    creator: '李四',
    fileSize: 5242880,
    createDate: '2024-02-01',
    updateDate: '2024-03-10',
    description: '工业机器人机械臂的结构设计图',
    url: 'https://example.com/doc2.dwg'
  },
  {
    id: 3,
    docCode: 'DOC003',
    title: '系统测试报告',
    documentType: 'test',
    fileType: 'docx',
    status: 'draft',
    creator: '王五',
    fileSize: 1048576,
    createDate: '2024-03-05',
    updateDate: '2024-03-15',
    description: '智能仓储系统测试结果报告',
    url: 'https://example.com/doc3.docx'
  }
])

// 项目列表
const projectList = ref([
  { id: 1, name: '智能仓储系统' },
  { id: 2, name: '生产流程优化' },
  { id: 3, name: '质量管理系统' }
])

// 标签列表
const tagList = ref(['技术文档', '设计图纸', '测试报告', '用户手册', '会议纪要', '项目文档'])

// 版本列表
const versionList = ref([
  {
    version: '1.0',
    status: 'published',
    updater: '张三',
    createTime: '2024-01-15 10:30:00',
    description: '初始版本创建'
  },
  {
    version: '1.1',
    status: 'published',
    updater: '李四',
    createTime: '2024-02-01 14:20:00',
    description: '更新了第3章节内容'
  },
  {
    version: '1.2',
    status: 'reviewing',
    updater: '王五',
    createTime: '2024-03-10 16:45:00',
    description: '添加了测试用例和验收标准'
  }
])

// 状态类型映射
const getStatusType = (status) => {
  const typeMap = {
    draft: 'info',
    reviewing: 'warning',
    published: 'success',
    archived: 'danger'
  }
  return typeMap[status] || 'info'
}

// 状态文本映射
const getStatusText = (status) => {
  const textMap = {
    draft: '草稿',
    reviewing: '审核中',
    published: '已发布',
    archived: '已归档'
  }
  return textMap[status] || status
}

// 文档类型颜色映射
const getDocumentTypeColor = (type) => {
  const colorMap = {
    technical: 'primary',
    design: 'success',
    test: 'warning',
    manual: 'info',
    meeting: 'danger',
    other: ''
  }
  return colorMap[type] || ''
}

// 文档类型文本映射
const getDocumentTypeText = (type) => {
  const textMap = {
    technical: '技术文档',
    design: '设计文档',
    test: '测试文档',
    manual: '用户手册',
    meeting: '会议纪要',
    other: '其他'
  }
  return textMap[type] || type
}

// 文件大小格式化
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 判断是否为PDF文件
const isPdfFile = (fileType) => {
  return fileType.toLowerCase() === 'pdf'
}

// 获取版本类型
const getVersionType = (index) => {
  return index === 0 ? 'primary' : index === versionList.value.length - 1 ? 'success' : 'info'
}

// 事件处理函数
const handleCreateDocument = () => {
  dialogTitle.value = '新建文档'
  documentForm.docCode = 'DOC' + String(Date.now()).slice(-3)
  dialogVisible.value = true
}

const handleBatchUpload = () => {
  batchUploadVisible.value = true
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
    if (key === 'dateRange') {
      searchForm[key] = []
    } else {
      searchForm[key] = ''
    }
  })
  ElMessage.success('重置成功')
}

const handleSelectionChange = (selection) => {
  selectedDocuments.value = selection
}

const handlePreview = (row) => {
  previewDocument.value = row
  previewVisible.value = true
}

const handleDownload = (row) => {
  ElMessage.success(`开始下载: ${row.title}`)
  // 这里应该调用下载API
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑文档'
  Object.keys(documentForm).forEach(key => {
    documentForm[key] = row[key] || []
  })
  dialogVisible.value = true
}

const handleVersion = (row) => {
  previewDocument.value = row
  versionVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除文档"${row.title}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定删除选中的 ${selectedDocuments.value.length} 个文档吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('批量删除成功')
    selectedDocuments.value = []
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleBatchDownload = () => {
  ElMessage.success(`开始下载选中的 ${selectedDocuments.value.length} 个文档`)
}

const handleSubmit = () => {
  documentFormRef.value.validate((valid) => {
    if (valid) {
      dialogVisible.value = false
      ElMessage.success('保存成功')
      handleReset()
    }
  })
}

const handleDialogClose = () => {
  documentFormRef.value?.resetFields()
  handleReset()
  fileList.value = []
}

const handlePreviewClose = () => {
  previewDocument.value = null
}

const handleFileChange = (file, fileList) => {
  console.log('文件变化:', file, fileList)
}

const handleBatchFileChange = (file, fileList) => {
  console.log('批量文件变化:', file, fileList)
}

const handleBatchUploadSubmit = () => {
  if (batchFileList.value.length === 0) {
    ElMessage.warning('请选择要上传的文件')
    return
  }
  ElMessage.success(`开始上传 ${batchFileList.value.length} 个文件`)
  batchUploadVisible.value = false
  batchFileList.value = []
}

const handleDownloadVersion = (version) => {
  ElMessage.success(`开始下载版本 ${version.version}`)
}

const handleRestoreVersion = (version) => {
  ElMessageBox.confirm(`确定恢复到版本 ${version.version} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('版本恢复成功')
    versionVisible.value = false
  }).catch(() => {
    ElMessage.info('已取消恢复')
  })
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
}

onMounted(() => {
  pagination.total = documentList.value.length
})
</script>

<style scoped>
.document-management {
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

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
  color: #1d2129;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.preview-content {
  height: 70vh;
  overflow: auto;
}

.preview-header {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 20px;
}

.preview-header h3 {
  margin: 0 0 10px 0;
  color: #1d2129;
}

.preview-info {
  display: flex;
  gap: 20px;
  color: #86909c;
  font-size: 14px;
}

.preview-body {
  padding: 0 20px;
}

.no-preview {
  text-align: center;
  padding: 60px 0;
  color: #86909c;
}

.no-preview p {
  margin: 20px 0;
  font-size: 16px;
}

.version-item {
  padding: 10px 0;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.version-header h4 {
  margin: 0;
  color: #1d2129;
}

.version-item p {
  margin: 5px 0;
  color: #606266;
}

.version-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}

.upload-demo,
.batch-upload {
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
  
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .preview-info {
    flex-direction: column;
    gap: 5px;
  }
}
</style>