<template>
  <div class="tooling-spec">
    <div class="page-header">
      <div class="header-left">
        <h1>工装规范</h1>
        <p>工装夹具设计规范与技术标准管理</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleCreateSpec">
          <el-icon><Plus /></el-icon>
          新建规范
        </el-button>
        <el-button @click="handleImportSpec">
          <el-icon><Upload /></el-icon>
          导入规范
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon blue">
              <el-icon><Tools /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalSpecs }}</div>
              <div class="stat-label">工装规范总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon green">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.approvedSpecs }}</div>
              <div class="stat-label">已审批规范</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon orange">
              <el-icon><Refresh /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.reviewingSpecs }}</div>
              <div class="stat-label">审核中规范</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon purple">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.updatedThisMonth }}</div>
              <div class="stat-label">本月更新</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-section">
      <el-form :model="filterForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索规范名称、编号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filterForm.type" placeholder="选择类型" clearable style="width: 150px">
            <el-option label="夹具规范" value="fixture" />
            <el-option label="模具规范" value="mold" />
            <el-option label="刀具规范" value="cutter" />
            <el-option label="量具规范" value="gauge" />
            <el-option label="检具规范" value="checking" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="选择状态" clearable style="width: 120px">
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
            <el-option label="审核中" value="reviewing" />
            <el-option label="已过期" value="expired" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用产品">
          <el-select v-model="filterForm.product" placeholder="选择产品" clearable style="width: 150px">
            <el-option label="发动机总成" value="engine" />
            <el-option label="变速箱总成" value="transmission" />
            <el-option label="底盘系统" value="chassis" />
            <el-option label="车身总成" value="body" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 规范列表 -->
    <div class="table-section">
      <el-table
        :data="filteredSpecs"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="规范编号" width="140" fixed="left">
          <template #default="{ row }">
            <el-link type="primary" @click="handleViewSpec(row)">
              {{ row.code }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="规范名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="product" label="适用产品" width="120" />
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="publisher" label="发布人" width="100" />
        <el-table-column prop="publishDate" label="发布日期" width="120" />
        <el-table-column prop="updateTime" label="更新时间" width="160" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewSpec(row)">查看</el-button>
            <el-button link type="primary" @click="handleEditSpec(row)">编辑</el-button>
            <el-button link type="success" @click="handleApproveSpec(row)" v-if="row.status === 'reviewing'">审批</el-button>
            <el-dropdown @command="(command) => handleCommand(command, row)">
              <el-button link type="info">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="version">版本历史</el-dropdown-item>
                  <el-dropdown-item command="copy">复制规范</el-dropdown-item>
                  <el-dropdown-item command="export">导出PDF</el-dropdown-item>
                  <el-dropdown-item command="preview">预览</el-dropdown-item>
                  <el-dropdown-item command="publish" v-if="row.status !== 'published'">发布</el-dropdown-item>
                  <el-dropdown-item command="archive" v-if="row.status === 'published'">归档</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="filterForm.page"
          v-model:page-size="filterForm.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filterForm.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新建/编辑规范对话框 -->
    <el-dialog
      v-model="specDialog.visible"
      :title="specDialog.title"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="specFormRef"
        :model="specForm"
        :rules="specRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规范编号" prop="code">
              <el-input v-model="specForm.code" placeholder="TLS-XX-001" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="版本" prop="version">
              <el-input v-model="specForm.version" placeholder="V1.0" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="规范名称" prop="name">
          <el-input v-model="specForm.name" placeholder="请输入规范名称" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select v-model="specForm.type" placeholder="选择类型" style="width: 100%">
                <el-option label="夹具规范" value="fixture" />
                <el-option label="模具规范" value="mold" />
                <el-option label="刀具规范" value="cutter" />
                <el-option label="量具规范" value="gauge" />
                <el-option label="检具规范" value="checking" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="适用产品" prop="product">
              <el-select v-model="specForm.product" placeholder="选择产品" style="width: 100%">
                <el-option label="发动机总成" value="engine" />
                <el-option label="变速箱总成" value="transmission" />
                <el-option label="底盘系统" value="chassis" />
                <el-option label="车身总成" value="body" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发布人">
              <el-input v-model="specForm.publisher" placeholder="请输入发布人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发布日期">
              <el-date-picker
                v-model="specForm.publishDate"
                type="date"
                placeholder="选择发布日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="技术要求">
          <el-input
            v-model="specForm.technicalRequirements"
            type="textarea"
            :rows="4"
            placeholder="请输入技术要求和规范"
          />
        </el-form-item>
        
        <el-form-item label="检验标准">
          <el-input
            v-model="specForm.inspectionStandard"
            type="textarea"
            :rows="3"
            placeholder="请输入检验标准和要求"
          />
        </el-form-item>
        
        <el-form-item label="附件资料">
          <el-upload
            v-model:file-list="specForm.attachments"
            :action="uploadUrl"
            multiple
            :limit="10"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemoveFile"
          >
            <el-button>上传附件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持pdf/doc/docx/dwg/dxf格式，单个文件不超过20MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="specDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveSpec">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewDialog.visible"
      title="规范预览"
      width="80%"
      :close-on-click-modal="false"
    >
      <div class="preview-content">
        <div class="preview-header">
          <h2>{{ previewSpec.name }}</h2>
          <div class="spec-info">
            <p><strong>规范编号：</strong>{{ previewSpec.code }}</p>
            <p><strong>版本：</strong>{{ previewSpec.version }}</p>
            <p><strong>类型：</strong>{{ getTypeLabel(previewSpec.type) }}</p>
            <p><strong>适用产品：</strong>{{ previewSpec.product }}</p>
          </div>
        </div>
        <div class="preview-body">
          <h3>技术要求</h3>
          <div class="content-text">{{ previewSpec.technicalRequirements }}</div>
          
          <h3>检验标准</h3>
          <div class="content-text">{{ previewSpec.inspectionStandard }}</div>
          
          <h3>附件资料</h3>
          <div class="attachment-list">
            <el-tag v-for="file in previewSpec.attachments" :key="file.name" style="margin: 2px;">
              {{ file.name }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  Plus,
  Upload,
  Tools,
  CircleCheck,
  Refresh,
  Clock,
  Search,
  ArrowDown
} from '@element-plus/icons-vue'

// 响应式数据
const filterForm = reactive({
  keyword: '',
  type: '',
  status: '',
  product: '',
  page: 1,
  pageSize: 20,
  total: 0
})

const stats = reactive({
  totalSpecs: 89,
  approvedSpecs: 67,
  reviewingSpecs: 15,
  updatedThisMonth: 8
})

const specs = ref([
  {
    id: 1,
    code: 'TLS-FX-001',
    name: '发动机缸体夹具设计规范',
    type: 'fixture',
    product: '发动机总成',
    version: 'V2.3',
    status: 'published',
    publisher: '赵工',
    publishDate: '2024-02-15',
    updateTime: '2024-03-18 10:30:00',
    technicalRequirements: '夹具设计应保证定位精度0.05mm，重复定位精度0.02mm...',
    inspectionStandard: '按照GB/T 1804-2000标准进行检验，关键尺寸需三坐标测量...',
    attachments: []
  },
  {
    id: 2,
    code: 'TLS-MD-002',
    name: '变速箱外壳注塑模具规范',
    type: 'mold',
    product: '变速箱总成',
    version: 'V1.8',
    status: 'reviewing',
    publisher: '钱工',
    publishDate: '2024-01-20',
    updateTime: '2024-03-22 14:15:00',
    technicalRequirements: '模具材料选用P20钢材，热处理硬度HRC48-52...',
    inspectionStandard: '模具型腔表面粗糙度Ra0.8，配合间隙0.02-0.05mm...',
    attachments: []
  },
  {
    id: 3,
    code: 'TLS-CT-003',
    name: '曲轴加工刀具技术规范',
    type: 'cutter',
    product: '发动机总成',
    version: 'V3.1',
    status: 'published',
    publisher: '孙工',
    publishDate: '2024-03-01',
    updateTime: '2024-03-25 09:45:00',
    technicalRequirements: '刀具材料采用硬质合金YG8，涂层TiN处理...',
    inspectionStandard: '刀具直径公差±0.01mm，跳动量不超过0.005mm...',
    attachments: []
  }
])

const specDialog = reactive({
  visible: false,
  title: '新建规范',
  mode: 'create' // create | edit
})

const specForm = reactive({
  id: null,
  code: '',
  name: '',
  version: '',
  type: '',
  product: '',
  publisher: '',
  publishDate: '',
  technicalRequirements: '',
  inspectionStandard: '',
  attachments: []
})

const specRules = {
  code: [
    { required: true, message: '请输入规范编号', trigger: 'blur' },
    { pattern: /^TLS-[A-Z]{2}-\d{3}$/, message: '编号格式：TLS-XX-001', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入规范名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  version: [
    { required: true, message: '请输入版本号', trigger: 'blur' },
    { pattern: /^V\d+\.\d+$/, message: '版本格式：V1.0', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择规范类型', trigger: 'change' }
  ],
  product: [
    { required: true, message: '请选择适用产品', trigger: 'change' }
  ]
}

const previewDialog = reactive({
  visible: false
})

const previewSpec = ref({
  name: '',
  code: '',
  version: '',
  type: '',
  product: '',
  technicalRequirements: '',
  inspectionStandard: '',
  attachments: []
})

const uploadUrl = '/api/upload'

// 表单引用
const specFormRef = ref<FormInstance>()

// 计算属性
const filteredSpecs = computed(() => {
  let filtered = specs.value

  if (filterForm.keyword) {
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(filterForm.keyword.toLowerCase()) ||
      item.code.toLowerCase().includes(filterForm.keyword.toLowerCase())
    )
  }

  if (filterForm.type) {
    filtered = filtered.filter(item => item.type === filterForm.type)
  }

  if (filterForm.status) {
    filtered = filtered.filter(item => item.status === filterForm.status)
  }

  if (filterForm.product) {
    filtered = filtered.filter(item => item.product === filterForm.product)
  }

  return filtered
})

// 方法
const getTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    fixture: '夹具规范',
    mold: '模具规范',
    cutter: '刀具规范',
    gauge: '量具规范',
    checking: '检具规范'
  }
  return typeMap[type] || type
}

const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    fixture: 'primary',
    mold: 'success',
    cutter: 'warning',
    gauge: 'info',
    checking: 'danger'
  }
  return typeMap[type] || 'info'
}

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    published: '已发布',
    draft: '草稿',
    reviewing: '审核中',
    expired: '已过期'
  }
  return statusMap[status] || status
}

const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    published: 'success',
    draft: 'info',
    reviewing: 'warning',
    expired: 'danger'
  }
  return statusMap[status] || 'info'
}

const handleSearch = () => {
  filterForm.page = 1
  ElMessage.success('搜索完成')
}

const handleReset = () => {
  Object.assign(filterForm, {
    keyword: '',
    type: '',
    status: '',
    product: '',
    page: 1,
    pageSize: 20,
    total: 0
  })
  ElMessage.success('重置成功')
}

const handleSelectionChange = (selection: any[]) => {
  console.log('选择的规范：', selection)
}

const handleCreateSpec = () => {
  specDialog.title = '新建规范'
  specDialog.mode = 'create'
  specDialog.visible = true
  resetSpecForm()
}

const handleEditSpec = (row: any) => {
  specDialog.title = '编辑规范'
  specDialog.mode = 'edit'
  specDialog.visible = true
  Object.assign(specForm, row)
}

const handleViewSpec = (row: any) => {
  Object.assign(previewSpec.value, row)
  previewDialog.visible = true
}

const handleSaveSpec = async () => {
  if (!specFormRef.value) return

  await specFormRef.value.validate((valid) => {
    if (valid) {
      // 这里添加保存逻辑
      ElMessage.success('规范保存成功')
      specDialog.visible = false
      resetSpecForm()
    }
  })
}

const handleApproveSpec = (row: any) => {
  ElMessageBox.confirm(
    `确定要审批通过规范"${row.name}"吗？`,
    '审批确认',
    {
      confirmButtonText: '通过',
      cancelButtonText: '拒绝',
      type: 'warning'
    }
  ).then(() => {
    // 审批通过逻辑
    ElMessage.success('审批通过')
  }).catch(() => {
    ElMessage.info('已取消审批')
  })
}

const handleCommand = (command: string, row: any) => {
  switch (command) {
    case 'version':
      ElMessage.info(`查看${row.name}的版本历史`)
      break
    case 'copy':
      ElMessage.info(`复制规范：${row.name}`)
      break
    case 'export':
      ElMessage.info(`导出规范：${row.name}`)
      break
    case 'preview':
      Object.assign(previewSpec.value, row)
      previewDialog.visible = true
      break
    case 'publish':
      ElMessage.success(`发布规范：${row.name}`)
      break
    case 'archive':
      ElMessage.info(`归档规范：${row.name}`)
      break
    case 'delete':
      handleDeleteSpec(row)
      break
  }
}

const handleDeleteSpec = (row: any) => {
  ElMessageBox.confirm(
    `确定要删除规范"${row.name}"吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里添加删除逻辑
    ElMessage.success('删除成功')
  })
}

const handleImportSpec = () => {
  ElMessage.info('导入规范功能')
}

const handleUploadSuccess = (response: any, file: any) => {
  ElMessage.success('上传成功')
}

const handleRemoveFile = (file: any) => {
  ElMessage.info('移除文件')
}

const resetSpecForm = () => {
  Object.assign(specForm, {
    id: null,
    code: '',
    name: '',
    version: '',
    type: '',
    product: '',
    publisher: '',
    publishDate: '',
    technicalRequirements: '',
    inspectionStandard: '',
    attachments: []
  })
}

const handleSizeChange = (val: number) => {
  filterForm.pageSize = val
  // 这里添加分页逻辑
}

const handleCurrentChange = (val: number) => {
  filterForm.page = val
  // 这里添加分页逻辑
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.tooling-spec {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.header-left p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 20px;
  color: white;
}

.stat-icon.blue { background: #409EFF; }
.stat-icon.green { background: #67C23A; }
.stat-icon.orange { background: #E6A23C; }
.stat-icon.purple { background: #909399; }

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.filter-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.table-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.dialog-footer {
  text-align: right;
}

.el-upload__tip {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}

.preview-content {
  max-height: 70vh;
  overflow-y: auto;
}

.preview-header {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.preview-header h2 {
  margin: 0 0 15px 0;
  color: #303133;
}

.spec-info p {
  margin: 5px 0;
  color: #606266;
}

.preview-body h3 {
  color: #303133;
  margin: 20px 0 10px 0;
  font-size: 16px;
}

.content-text {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 15px;
}

.attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
</style>