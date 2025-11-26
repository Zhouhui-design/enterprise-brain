<template>
  <div class="operation-standard">
    <div class="page-header">
      <div class="header-left">
        <h1>作业标准</h1>
        <p>标准化作业流程与规范管理</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleCreateStandard">
          <el-icon><Plus /></el-icon>
          新建标准
        </el-button>
        <el-button @click="handleImportStandards">
          <el-icon><Upload /></el-icon>
          导入标准
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon blue">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalStandards }}</div>
              <div class="stat-label">作业标准总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon green">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.activeStandards }}</div>
              <div class="stat-label">生效标准</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon orange">
              <el-icon><Refresh /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.reviewingStandards }}</div>
              <div class="stat-label">审核中标准</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon purple">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.expiredSoonStandards }}</div>
              <div class="stat-label">即将到期标准</div>
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
            placeholder="搜索标准名称、编号"
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
            <el-option label="操作规范" value="operation" />
            <el-option label="安全规范" value="safety" />
            <el-option label="质量标准" value="quality" />
            <el-option label="设备操作" value="equipment" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="选择状态" clearable style="width: 120px">
            <el-option label="生效中" value="active" />
            <el-option label="草稿" value="draft" />
            <el-option label="审核中" value="reviewing" />
            <el-option label="已过期" value="expired" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 标准列表 -->
    <div class="table-section">
      <el-table
        :data="filteredStandards"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="标准编号" width="140" fixed="left">
          <template #default="{ row }">
            <el-link type="primary" @click="handleViewStandard(row)">
              {{ row.code }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="标准名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="effectiveDate" label="生效日期" width="120" />
        <el-table-column prop="expiryDate" label="到期日期" width="120" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewStandard(row)">查看</el-button>
            <el-button link type="primary" @click="handleEditStandard(row)">编辑</el-button>
            <el-dropdown @command="(command) => handleCommand(command, row)">
              <el-button link type="info">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="version">版本历史</el-dropdown-item>
                  <el-dropdown-item command="copy">复制标准</el-dropdown-item>
                  <el-dropdown-item command="export">导出</el-dropdown-item>
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

    <!-- 新建/编辑标准对话框 -->
    <el-dialog
      v-model="standardDialog.visible"
      :title="standardDialog.title"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="standardFormRef"
        :model="standardForm"
        :rules="standardRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标准编号" prop="code">
              <el-input v-model="standardForm.code" placeholder="STD-XX-001" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="版本" prop="version">
              <el-input v-model="standardForm.version" placeholder="V1.0" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="标准名称" prop="name">
          <el-input v-model="standardForm.name" placeholder="请输入标准名称" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select v-model="standardForm.type" placeholder="选择类型" style="width: 100%">
                <el-option label="操作规范" value="operation" />
                <el-option label="安全规范" value="safety" />
                <el-option label="质量标准" value="quality" />
                <el-option label="设备操作" value="equipment" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生效日期" prop="effectiveDate">
              <el-date-picker
                v-model="standardForm.effectiveDate"
                type="date"
                placeholder="选择生效日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="到期日期">
          <el-date-picker
            v-model="standardForm.expiryDate"
            type="date"
            placeholder="选择到期日期（可选）"
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="标准描述">
          <el-input
            v-model="standardForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入标准描述"
          />
        </el-form-item>
        
        <el-form-item label="附件">
          <el-upload
            v-model:file-list="standardForm.attachments"
            :action="uploadUrl"
            multiple
            :limit="5"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemoveFile"
          >
            <el-button>上传附件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持pdf/doc/docx/xls/xlsx格式，单个文件不超过10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="standardDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveStandard">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  Plus,
  Upload,
  Document,
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
  page: 1,
  pageSize: 20,
  total: 0
})

const stats = reactive({
  totalStandards: 156,
  activeStandards: 98,
  reviewingStandards: 23,
  expiredSoonStandards: 12
})

const standards = ref([
  {
    id: 1,
    code: 'STD-OP-001',
    name: '装配线标准作业指导书',
    type: 'operation',
    version: 'V2.1',
    status: 'active',
    effectiveDate: '2024-01-15',
    expiryDate: '2025-01-15',
    creator: '张三',
    createTime: '2024-01-10 09:00:00',
    updateTime: '2024-03-20 14:30:00',
    description: '装配线标准作业流程和操作要求'
  },
  {
    id: 2,
    code: 'STD-SF-002',
    name: '安全生产操作规程',
    type: 'safety',
    version: 'V3.0',
    status: 'active',
    effectiveDate: '2024-02-01',
    expiryDate: '2025-02-01',
    creator: '李四',
    createTime: '2024-01-25 10:15:00',
    updateTime: '2024-03-15 16:20:00',
    description: '车间安全生产操作规范和应急预案'
  },
  {
    id: 3,
    code: 'STD-QL-003',
    name: '产品质量检验标准',
    type: 'quality',
    version: 'V1.5',
    status: 'reviewing',
    effectiveDate: '2024-03-01',
    expiryDate: '2025-03-01',
    creator: '王五',
    createTime: '2024-02-20 11:30:00',
    updateTime: '2024-03-25 09:45:00',
    description: '产品质量检验的标准程序和要求'
  }
])

const standardDialog = reactive({
  visible: false,
  title: '新建标准',
  mode: 'create' // create | edit
})

const standardForm = reactive({
  id: null,
  code: '',
  name: '',
  version: '',
  type: '',
  effectiveDate: '',
  expiryDate: '',
  description: '',
  attachments: []
})

const standardRules = {
  code: [
    { required: true, message: '请输入标准编号', trigger: 'blur' },
    { pattern: /^STD-[A-Z]{2}-\d{3}$/, message: '编号格式：STD-XX-001', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入标准名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  version: [
    { required: true, message: '请输入版本号', trigger: 'blur' },
    { pattern: /^V\d+\.\d+$/, message: '版本格式：V1.0', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择标准类型', trigger: 'change' }
  ],
  effectiveDate: [
    { required: true, message: '请选择生效日期', trigger: 'change' }
  ]
}

const uploadUrl = '/api/upload'

// 表单引用
const standardFormRef = ref<FormInstance>()

// 计算属性
const filteredStandards = computed(() => {
  let filtered = standards.value

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

  return filtered
})

// 方法
const getTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    operation: '操作规范',
    safety: '安全规范',
    quality: '质量标准',
    equipment: '设备操作'
  }
  return typeMap[type] || type
}

const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    operation: 'primary',
    safety: 'danger',
    quality: 'success',
    equipment: 'warning'
  }
  return typeMap[type] || 'info'
}

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    active: '生效中',
    draft: '草稿',
    reviewing: '审核中',
    expired: '已过期'
  }
  return statusMap[status] || status
}

const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    active: 'success',
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
    page: 1,
    pageSize: 20,
    total: 0
  })
  ElMessage.success('重置成功')
}

const handleSelectionChange = (selection: any[]) => {
  console.log('选择的标准：', selection)
}

const handleCreateStandard = () => {
  standardDialog.title = '新建标准'
  standardDialog.mode = 'create'
  standardDialog.visible = true
  resetStandardForm()
}

const handleEditStandard = (row: any) => {
  standardDialog.title = '编辑标准'
  standardDialog.mode = 'edit'
  standardDialog.visible = true
  Object.assign(standardForm, row)
}

const handleViewStandard = (row: any) => {
  ElMessage.info(`查看标准：${row.name}`)
}

const handleSaveStandard = async () => {
  if (!standardFormRef.value) return

  await standardFormRef.value.validate((valid) => {
    if (valid) {
      // 这里添加保存逻辑
      ElMessage.success('标准保存成功')
      standardDialog.visible = false
      resetStandardForm()
    }
  })
}

const handleCommand = (command: string, row: any) => {
  switch (command) {
    case 'version':
      ElMessage.info(`查看${row.name}的版本历史`)
      break
    case 'copy':
      ElMessage.info(`复制标准：${row.name}`)
      break
    case 'export':
      ElMessage.info(`导出标准：${row.name}`)
      break
    case 'delete':
      handleDeleteStandard(row)
      break
  }
}

const handleDeleteStandard = (row: any) => {
  ElMessageBox.confirm(
    `确定要删除标准"${row.name}"吗？此操作不可恢复。`,
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

const handleImportStandards = () => {
  ElMessage.info('导入标准功能')
}

const handleUploadSuccess = (response: any, file: any) => {
  ElMessage.success('上传成功')
}

const handleRemoveFile = (file: any) => {
  ElMessage.info('移除文件')
}

const resetStandardForm = () => {
  Object.assign(standardForm, {
    id: null,
    code: '',
    name: '',
    version: '',
    type: '',
    effectiveDate: '',
    expiryDate: '',
    description: '',
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
.operation-standard {
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
</style>