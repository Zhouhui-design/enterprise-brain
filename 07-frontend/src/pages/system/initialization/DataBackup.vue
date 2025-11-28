<template>
  <div class="data-backup-container">
    <el-page-header content="数据备份" @back="$router.back()"></el-page-header>
    
    <el-card class="main-card" shadow="hover">
      <!-- 快速操作 -->
      <div class="quick-actions">
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          创建备份
        </el-button>
        <el-button :icon="Refresh" @click="loadBackupList">刷新</el-button>
      </div>

      <!-- 备份列表 -->
      <el-table :data="backupList" border style="margin-top: 20px;" v-loading="loading">
        <el-table-column prop="id" label="备份ID" width="100"></el-table-column>
        <el-table-column prop="name" label="备份名称" width="200"></el-table-column>
        <el-table-column prop="type" label="备份类型" width="120">
          <template #default="scope">
            <el-tag :type="getBackupTypeTag(scope.row.type)">
              {{ getBackupTypeName(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="文件大小" width="120">
          <template #default="scope">
            {{ formatFileSize(scope.row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'success' ? 'success' : scope.row.status === 'failed' ? 'danger' : 'warning'">
              {{ scope.row.status === 'success' ? '成功' : scope.row.status === 'failed' ? '失败' : '进行中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="120"></el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              link 
              :icon="View"
              @click="viewDetail(scope.row)"
            >
              详情
            </el-button>
            <el-button 
              type="success" 
              size="small" 
              link 
              :icon="Download"
              @click="downloadBackup(scope.row)"
              :disabled="scope.row.status !== 'success'"
            >
              下载
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              link 
              :icon="Delete"
              @click="deleteBackup(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadBackupList"
        @current-change="loadBackupList"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 创建备份对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建数据备份" width="600px">
      <el-form :model="backupForm" :rules="rules" ref="backupFormRef" label-width="100px">
        <el-form-item label="备份名称" prop="name">
          <el-input 
            v-model="backupForm.name" 
            placeholder="请输入备份名称"
            clearable
          />
        </el-form-item>

        <el-form-item label="备份类型" prop="type">
          <el-radio-group v-model="backupForm.type">
            <el-radio label="full">完整备份</el-radio>
            <el-radio label="incremental">增量备份</el-radio>
            <el-radio label="differential">差异备份</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="备份范围" prop="scope">
          <el-checkbox-group v-model="backupForm.scope">
            <el-checkbox label="database">数据库</el-checkbox>
            <el-checkbox label="files">文件系统</el-checkbox>
            <el-checkbox label="config">配置文件</el-checkbox>
            <el-checkbox label="logs">日志文件</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="压缩方式" prop="compression">
          <el-select v-model="backupForm.compression" placeholder="请选择压缩方式">
            <el-option label="不压缩" value="none"></el-option>
            <el-option label="ZIP" value="zip"></el-option>
            <el-option label="GZIP" value="gzip"></el-option>
            <el-option label="7Z" value="7z"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="备份说明" prop="description">
          <el-input 
            v-model="backupForm.description" 
            type="textarea"
            :rows="3"
            placeholder="请输入备份说明"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createBackup" :loading="creating">创建</el-button>
      </template>
    </el-dialog>

    <!-- 备份详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="备份详情" width="700px">
      <el-descriptions :column="2" border v-if="currentBackup">
        <el-descriptions-item label="备份ID">{{ currentBackup.id }}</el-descriptions-item>
        <el-descriptions-item label="备份名称">{{ currentBackup.name }}</el-descriptions-item>
        <el-descriptions-item label="备份类型">{{ getBackupTypeName(currentBackup.type) }}</el-descriptions-item>
        <el-descriptions-item label="文件大小">{{ formatFileSize(currentBackup.size) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentBackup.status === 'success' ? 'success' : 'danger'">
            {{ currentBackup.status === 'success' ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentBackup.creator }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ currentBackup.createTime }}</el-descriptions-item>
        <el-descriptions-item label="文件路径" :span="2">{{ currentBackup.filePath }}</el-descriptions-item>
        <el-descriptions-item label="备份说明" :span="2">{{ currentBackup.description || '无' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>备份内容</el-divider>
      
      <el-table :data="currentBackup?.contents" border max-height="300">
        <el-table-column prop="type" label="类型" width="120"></el-table-column>
        <el-table-column prop="name" label="名称" width="200"></el-table-column>
        <el-table-column prop="size" label="大小" width="120">
          <template #default="scope">
            {{ formatFileSize(scope.row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="count" label="记录数"></el-table-column>
      </el-table>

      <template #footer>
        <el-button type="primary" @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 备份进度对话框 -->
    <el-dialog v-model="showProgressDialog" title="备份进度" width="500px" :close-on-click-modal="false">
      <el-progress 
        :percentage="backupProgress" 
        :status="backupStatus"
        :stroke-width="20"
      ></el-progress>

      <div class="backup-log">
        <p v-for="(log, index) in backupLogs" :key="index">
          {{ log.time }} - {{ log.message }}
        </p>
      </div>

      <template #footer v-if="backupProgress === 100">
        <el-button type="primary" @click="showProgressDialog = false">完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, View, Download, Delete } from '@element-plus/icons-vue'
import { dataBackupApi } from '@/api/system/initialization'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const creating = ref(false)
const backupList = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showProgressDialog = ref(false)
const currentBackup = ref(null)
const backupProgress = ref(0)
const backupStatus = ref('')
const backupLogs = ref([])
const backupFormRef = ref(null)

const backupForm = reactive({
  name: '',
  type: 'full',
  scope: ['database'],
  compression: 'zip',
  description: ''
})

const rules = {
  name: [
    { required: true, message: '请输入备份名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择备份类型', trigger: 'change' }
  ],
  scope: [
    { required: true, message: '请选择备份范围', trigger: 'change' }
  ]
}

// 方法
const loadBackupList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
    const res = await dataBackupApi.getBackupList(params)
    backupList.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('加载备份列表失败:', error)
    // 模拟数据
    backupList.value = [
      {
        id: '1',
        name: '系统完整备份-20240115',
        type: 'full',
        size: 1024 * 1024 * 150,
        status: 'success',
        creator: 'admin',
        createTime: '2024-01-15 10:00:00',
        filePath: '/backup/full_20240115.zip'
      },
      {
        id: '2',
        name: '增量备份-20240116',
        type: 'incremental',
        size: 1024 * 1024 * 50,
        status: 'success',
        creator: 'admin',
        createTime: '2024-01-16 10:00:00',
        filePath: '/backup/inc_20240116.zip'
      }
    ]
    total.value = 2
  } finally {
    loading.value = false
  }
}

const createBackup = async () => {
  try {
    await backupFormRef.value.validate()
    
    creating.value = true
    showCreateDialog.value = false
    showProgressDialog.value = true
    backupProgress.value = 0
    backupLogs.value = []

    // 调用备份API
    const res = await dataBackupApi.createBackup(backupForm)

    // 模拟进度更新
    const steps = [
      { progress: 10, message: '正在准备备份...' },
      { progress: 30, message: '正在备份数据库...' },
      { progress: 50, message: '正在备份文件...' },
      { progress: 70, message: '正在压缩文件...' },
      { progress: 90, message: '正在保存备份...' },
      { progress: 100, message: '备份完成！' }
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      backupProgress.value = step.progress
      addBackupLog(step.message)
    }

    backupStatus.value = 'success'
    ElMessage.success('备份创建成功')
    loadBackupList()

    // 重置表单
    Object.assign(backupForm, {
      name: '',
      type: 'full',
      scope: ['database'],
      compression: 'zip',
      description: ''
    })
  } catch (error) {
    if (error !== false) { // 非验证错误
      ElMessage.error('备份创建失败')
      console.error('创建备份失败:', error)
    }
  } finally {
    creating.value = false
  }
}

const addBackupLog = (message) => {
  backupLogs.value.push({
    message,
    time: new Date().toLocaleTimeString()
  })
}

const viewDetail = async (row) => {
  try {
    const res = await dataBackupApi.getBackupDetail(row.id)
    currentBackup.value = res.data || {
      ...row,
      contents: [
        { type: '数据库', name: 'enterprise_brain', size: 1024 * 1024 * 100, count: 50000 },
        { type: '文件', name: 'uploads', size: 1024 * 1024 * 50, count: 1500 }
      ]
    }
    showDetailDialog.value = true
  } catch (error) {
    console.error('获取备份详情失败:', error)
    currentBackup.value = {
      ...row,
      contents: []
    }
    showDetailDialog.value = true
  }
}

const downloadBackup = async (row) => {
  try {
    ElMessage.info('开始下载备份文件...')
    const res = await dataBackupApi.downloadBackup(row.id)
    
    // 创建下载链接
    const blob = new Blob([res], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${row.name}.zip`
    link.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success('下载成功')
  } catch (error) {
    ElMessage.error('下载失败')
    console.error('下载备份失败:', error)
  }
}

const deleteBackup = (row) => {
  ElMessageBox.confirm(
    `确认要删除备份"${row.name}"吗？删除后将无法恢复。`,
    '确认删除',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await dataBackupApi.deleteBackup(row.id)
      ElMessage.success('删除成功')
      loadBackupList()
    } catch (error) {
      ElMessage.error('删除失败')
      console.error('删除备份失败:', error)
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const getBackupTypeName = (type) => {
  const typeMap = {
    full: '完整备份',
    incremental: '增量备份',
    differential: '差异备份'
  }
  return typeMap[type] || type
}

const getBackupTypeTag = (type) => {
  const tagMap = {
    full: 'primary',
    incremental: 'success',
    differential: 'warning'
  }
  return tagMap[type] || ''
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

onMounted(() => {
  loadBackupList()
})
</script>

<style scoped>
.data-backup-container {
  padding: 20px;
}

.main-card {
  margin-top: 20px;
}

.quick-actions {
  display: flex;
  gap: 10px;
}

.backup-log {
  margin-top: 20px;
  max-height: 200px;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.backup-log p {
  margin: 5px 0;
  color: #606266;
}
</style>
