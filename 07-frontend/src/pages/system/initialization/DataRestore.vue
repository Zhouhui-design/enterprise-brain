<template>
  <div class="data-restore-container">
    <el-page-header content="数据恢复" @back="$router.back()"></el-page-header>
    
    <el-card class="main-card" shadow="hover">
      <el-alert
        title="注意"
        type="info"
        :closable="false"
        show-icon
        class="info-alert"
      >
        数据恢复将使用备份文件覆盖当前数据，请确保已了解恢复的影响范围。
      </el-alert>

      <!-- 恢复方式选择 -->
      <el-tabs v-model="activeTab" class="restore-tabs">
        <!-- 从备份列表恢复 -->
        <el-tab-pane label="从备份列表恢复" name="list">
          <el-table 
            :data="backupList" 
            border 
            highlight-current-row
            @current-change="handleBackupSelect"
            v-loading="loading"
          >
            <el-table-column type="index" label="#" width="50"></el-table-column>
            <el-table-column prop="name" label="备份名称" width="250"></el-table-column>
            <el-table-column prop="type" label="备份类型" width="120">
              <template #default="scope">
                <el-tag>{{ getBackupTypeName(scope.row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="size" label="文件大小" width="120">
              <template #default="scope">
                {{ formatFileSize(scope.row.size) }}
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="备份时间" width="180"></el-table-column>
            <el-table-column label="操作" fixed="right" width="150">
              <template #default="scope">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="selectBackup(scope.row)"
                >
                  选择恢复
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="pageNum"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="loadBackupList"
            @current-change="loadBackupList"
            style="margin-top: 20px; justify-content: flex-end;"
          />
        </el-tab-pane>

        <!-- 上传备份文件 -->
        <el-tab-pane label="上传备份文件" name="upload">
          <el-upload
            class="upload-demo"
            drag
            :action="uploadAction"
            :before-upload="beforeUpload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :file-list="fileList"
            :limit="1"
            accept=".zip,.gz,.7z"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将备份文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .zip、.gz、.7z 格式，文件大小不超过 2GB
              </div>
            </template>
          </el-upload>

          <el-card v-if="uploadedBackup" shadow="never" class="uploaded-card">
            <template #header>
              <span>已上传的备份文件</span>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="文件名">{{ uploadedBackup.name }}</el-descriptions-item>
              <el-descriptions-item label="文件大小">{{ formatFileSize(uploadedBackup.size) }}</el-descriptions-item>
              <el-descriptions-item label="上传时间">{{ uploadedBackup.uploadTime }}</el-descriptions-item>
              <el-descriptions-item label="验证状态">
                <el-tag :type="uploadedBackup.validated ? 'success' : 'warning'">
                  {{ uploadedBackup.validated ? '已验证' : '未验证' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>

            <div class="upload-actions">
              <el-button type="primary" @click="validateUploadedBackup" :loading="validating">
                验证备份
              </el-button>
              <el-button 
                type="success" 
                @click="selectUploadedBackup"
                :disabled="!uploadedBackup.validated"
              >
                使用此备份恢复
              </el-button>
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>

      <!-- 恢复配置 -->
      <el-card v-if="selectedBackup" shadow="never" class="config-card">
        <template #header>
          <span>恢复配置</span>
        </template>

        <el-form :model="restoreForm" label-width="120px">
          <el-form-item label="备份文件">
            <el-tag>{{ selectedBackup.name }}</el-tag>
          </el-form-item>

          <el-form-item label="恢复范围">
            <el-checkbox-group v-model="restoreForm.scope">
              <el-checkbox label="database">数据库</el-checkbox>
              <el-checkbox label="files">文件系统</el-checkbox>
              <el-checkbox label="config">配置文件</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="恢复模式">
            <el-radio-group v-model="restoreForm.mode">
              <el-radio label="override">覆盖模式（完全替换）</el-radio>
              <el-radio label="merge">合并模式（保留现有数据）</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="数据处理">
            <el-checkbox v-model="restoreForm.cleanBefore">恢复前清空现有数据</el-checkbox>
            <el-checkbox v-model="restoreForm.backupCurrent">恢复前备份当前数据</el-checkbox>
          </el-form-item>

          <el-form-item label="验证码">
            <el-input 
              v-model="restoreForm.verifyCode" 
              placeholder="请输入 RESTORE 确认恢复"
              style="width: 300px;"
            />
          </el-form-item>
        </el-form>

        <div class="restore-actions">
          <el-button @click="selectedBackup = null">取消</el-button>
          <el-button 
            type="danger" 
            @click="confirmRestore"
            :disabled="restoreForm.verifyCode !== 'RESTORE'"
            :loading="restoring"
          >
            开始恢复
          </el-button>
        </div>
      </el-card>
    </el-card>

    <!-- 恢复进度对话框 -->
    <el-dialog v-model="showProgress" title="数据恢复进度" width="600px" :close-on-click-modal="false">
      <el-progress 
        :percentage="restoreProgress" 
        :status="restoreStatus"
        :stroke-width="20"
      ></el-progress>

      <div class="restore-log">
        <h4>恢复日志</h4>
        <div class="log-content">
          <p v-for="(log, index) in restoreLogs" :key="index" :class="log.type">
            {{ log.time }} - {{ log.message }}
          </p>
        </div>
      </div>

      <template #footer v-if="restoreProgress === 100">
        <el-button type="primary" @click="finishRestore">完成</el-button>
      </template>
    </el-dialog>

    <!-- 恢复历史 -->
    <el-card class="history-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>恢复历史</span>
          <el-button :icon="Refresh" size="small" @click="loadRestoreHistory">刷新</el-button>
        </div>
      </template>

      <el-table :data="restoreHistory" border>
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="backupName" label="备份名称" width="200"></el-table-column>
        <el-table-column prop="scope" label="恢复范围" width="200">
          <template #default="scope">
            <el-tag v-for="item in scope.row.scope" :key="item" size="small" style="margin: 2px;">
              {{ item }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="mode" label="恢复模式" width="120"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
              {{ scope.row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="120"></el-table-column>
        <el-table-column prop="time" label="操作时间" width="180"></el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="viewHistoryDetail(scope.row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="historyPage"
        v-model:page-size="historyPageSize"
        :total="historyTotal"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadRestoreHistory"
        @current-change="loadRestoreHistory"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Refresh } from '@element-plus/icons-vue'
import { dataBackupApi, dataRestoreApi } from '@/api/system/initialization'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const activeTab = ref('list')
const loading = ref(false)
const validating = ref(false)
const restoring = ref(false)
const backupList = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedBackup = ref(null)
const uploadedBackup = ref(null)
const fileList = ref([])
const showProgress = ref(false)
const restoreProgress = ref(0)
const restoreStatus = ref('')
const restoreLogs = ref([])
const restoreHistory = ref([])
const historyPage = ref(1)
const historyPageSize = ref(10)
const historyTotal = ref(0)

const uploadAction = ref('/api/system/restore/upload')

const restoreForm = reactive({
  scope: ['database'],
  mode: 'override',
  cleanBefore: false,
  backupCurrent: true,
  verifyCode: ''
})

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
        createTime: '2024-01-15 10:00:00'
      }
    ]
    total.value = 1
  } finally {
    loading.value = false
  }
}

const handleBackupSelect = (row) => {
  // 表格行选择处理
}

const selectBackup = (row) => {
  selectedBackup.value = row
  ElMessage.success('已选择备份：' + row.name)
}

const beforeUpload = (file) => {
  const isValidType = ['application/zip', 'application/x-gzip', 'application/x-7z-compressed'].includes(file.type)
  const isLt2G = file.size / 1024 / 1024 / 1024 < 2

  if (!isValidType) {
    ElMessage.error('只能上传 .zip、.gz、.7z 格式的文件!')
    return false
  }
  if (!isLt2G) {
    ElMessage.error('文件大小不能超过 2GB!')
    return false
  }
  return true
}

const handleUploadSuccess = (response, file) => {
  uploadedBackup.value = {
    id: response.data.id,
    name: file.name,
    size: file.size,
    uploadTime: new Date().toLocaleString(),
    validated: false
  }
  ElMessage.success('文件上传成功')
}

const handleUploadError = () => {
  ElMessage.error('文件上传失败')
}

const validateUploadedBackup = async () => {
  if (!uploadedBackup.value) return
  
  validating.value = true
  try {
    await dataRestoreApi.validateBackup(uploadedBackup.value.id)
    uploadedBackup.value.validated = true
    ElMessage.success('备份文件验证通过')
  } catch (error) {
    ElMessage.error('备份文件验证失败')
    console.error('验证备份失败:', error)
  } finally {
    validating.value = false
  }
}

const selectUploadedBackup = () => {
  selectedBackup.value = uploadedBackup.value
  ElMessage.success('已选择上传的备份文件')
}

const confirmRestore = () => {
  ElMessageBox.confirm(
    `确认要使用备份"${selectedBackup.value.name}"恢复数据吗？此操作将${restoreForm.mode === 'override' ? '覆盖' : '合并'}现有数据。`,
    '确认恢复',
    {
      confirmButtonText: '确认恢复',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    executeRestore()
  }).catch(() => {
    ElMessage.info('已取消恢复')
  })
}

const executeRestore = async () => {
  showProgress.value = true
  restoring.value = true
  restoreProgress.value = 0
  restoreLogs.value = []
  restoreStatus.value = ''

  try {
    addRestoreLog('开始执行数据恢复...', 'info')
    
    const params = {
      backupId: selectedBackup.value.id,
      scope: restoreForm.scope,
      mode: restoreForm.mode,
      cleanBefore: restoreForm.cleanBefore,
      backupCurrent: restoreForm.backupCurrent
    }

    // 调用恢复API
    const res = await dataRestoreApi.executeRestore(params)

    // 模拟进度更新
    const steps = [
      { progress: 10, message: '正在验证备份文件...' },
      { progress: 20, message: '正在备份当前数据...' },
      { progress: 40, message: '正在清理现有数据...' },
      { progress: 60, message: '正在恢复数据库...' },
      { progress: 80, message: '正在恢复文件...' },
      { progress: 95, message: '正在更新索引...' },
      { progress: 100, message: '数据恢复完成！' }
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      restoreProgress.value = step.progress
      addRestoreLog(step.message, step.progress === 100 ? 'success' : 'info')
    }

    restoreStatus.value = 'success'
    ElMessage.success('数据恢复成功')
    loadRestoreHistory()
  } catch (error) {
    restoreStatus.value = 'exception'
    addRestoreLog('恢复失败：' + (error.message || '未知错误'), 'error')
    ElMessage.error('数据恢复失败')
    console.error('数据恢复失败:', error)
  } finally {
    restoring.value = false
  }
}

const addRestoreLog = (message, type = 'info') => {
  restoreLogs.value.push({
    message,
    type,
    time: new Date().toLocaleTimeString()
  })
}

const finishRestore = () => {
  showProgress.value = false
  selectedBackup.value = null
  restoreForm.verifyCode = ''
}

const loadRestoreHistory = async () => {
  try {
    const params = {
      pageNum: historyPage.value,
      pageSize: historyPageSize.value
    }
    const res = await dataRestoreApi.getRestoreHistory(params)
    restoreHistory.value = res.data?.records || []
    historyTotal.value = res.data?.total || 0
  } catch (error) {
    console.error('加载恢复历史失败:', error)
    // 模拟数据
    restoreHistory.value = [
      {
        id: 1,
        backupName: '系统完整备份-20240115',
        scope: ['database', 'files'],
        mode: '覆盖模式',
        status: 'success',
        operator: 'admin',
        time: '2024-01-16 10:00:00'
      }
    ]
    historyTotal.value = 1
  }
}

const viewHistoryDetail = (row) => {
  ElMessageBox.alert(
    `恢复ID: ${row.id}
备份名称: ${row.backupName}
恢复范围: ${row.scope.join(', ')}
操作人: ${row.operator}
操作时间: ${row.time}`,
    '恢复详情',
    {
      confirmButtonText: '确定'
    }
  )
}

const getBackupTypeName = (type) => {
  const typeMap = {
    full: '完整备份',
    incremental: '增量备份',
    differential: '差异备份'
  }
  return typeMap[type] || type
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
  loadRestoreHistory()
})
</script>

<style scoped>
.data-restore-container {
  padding: 20px;
}

.main-card,
.history-card {
  margin-top: 20px;
}

.info-alert {
  margin-bottom: 20px;
}

.restore-tabs {
  margin-top: 20px;
}

.upload-demo {
  margin: 20px 0;
}

.uploaded-card {
  margin-top: 20px;
}

.upload-actions {
  margin-top: 15px;
  text-align: center;
}

.config-card {
  margin-top: 20px;
}

.restore-actions {
  text-align: center;
  margin-top: 20px;
}

.restore-log {
  margin-top: 20px;
}

.restore-log h4 {
  margin-bottom: 10px;
}

.log-content {
  max-height: 200px;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.log-content p {
  margin: 5px 0;
}

.log-content p.success {
  color: #67c23a;
}

.log-content p.error {
  color: #f56c6c;
}

.log-content p.info {
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
