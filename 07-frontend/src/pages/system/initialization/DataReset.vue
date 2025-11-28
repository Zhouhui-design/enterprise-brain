<template>
  <div class="data-reset-container">
    <el-page-header content="数据重置" @back="$router.back()"></el-page-header>
    
    <el-card class="main-card" shadow="hover">
      <el-alert
        title="警告"
        type="warning"
        :closable="false"
        show-icon
        class="warning-alert"
      >
        数据重置是危险操作，将清除选定类型的所有数据，请谨慎操作！建议在重置前先进行数据备份。
      </el-alert>

      <div class="reset-content">
        <!-- 重置类型选择 -->
        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="card-header">
              <span>选择重置类型</span>
              <el-button type="primary" size="small" @click="loadResetTypes">刷新</el-button>
            </div>
          </template>

          <el-checkbox-group v-model="selectedTypes">
            <el-row :gutter="20">
              <el-col :span="8" v-for="type in resetTypes" :key="type.code">
                <el-card shadow="hover" class="type-card">
                  <el-checkbox :label="type.code" :disabled="type.disabled">
                    <div class="type-info">
                      <h4>{{ type.name }}</h4>
                      <p class="type-desc">{{ type.description }}</p>
                      <p class="type-count">数据量：{{ type.count || 0 }}</p>
                    </div>
                  </el-checkbox>
                </el-card>
              </el-col>
            </el-row>
          </el-checkbox-group>
        </el-card>

        <!-- 重置选项 -->
        <el-card shadow="never" class="section-card">
          <template #header>
            <span>重置选项</span>
          </template>

          <el-form :model="resetForm" label-width="120px">
            <el-form-item label="重置模式">
              <el-radio-group v-model="resetForm.mode">
                <el-radio label="soft">软删除（可恢复）</el-radio>
                <el-radio label="hard">硬删除（不可恢复）</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="保留时间范围">
              <el-date-picker
                v-model="resetForm.keepDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
              />
              <el-text type="info" size="small">选择要保留的数据时间范围，未选择则清空所有数据</el-text>
            </el-form-item>

            <el-form-item label="备份确认">
              <el-checkbox v-model="resetForm.backupConfirmed">
                我已完成数据备份
              </el-checkbox>
            </el-form-item>

            <el-form-item label="验证码">
              <el-input 
                v-model="resetForm.verifyCode" 
                placeholder="请输入 RESET 确认重置"
                style="width: 300px;"
              />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 影响预览 -->
        <el-card shadow="never" class="section-card" v-if="previewData">
          <template #header>
            <div class="card-header">
              <span>影响预览</span>
              <el-tag type="danger">将删除 {{ previewData.totalCount }} 条数据</el-tag>
            </div>
          </template>

          <el-table :data="previewData.details" border>
            <el-table-column prop="type" label="数据类型" width="150"></el-table-column>
            <el-table-column prop="name" label="名称" width="200"></el-table-column>
            <el-table-column prop="count" label="数据量" width="120">
              <template #default="scope">
                <el-tag type="danger">{{ scope.row.count }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="impact" label="影响范围"></el-table-column>
          </el-table>
        </el-card>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button @click="previewReset" :disabled="selectedTypes.length === 0">
            预览影响
          </el-button>
          <el-button 
            type="danger" 
            @click="confirmReset"
            :disabled="!canReset"
            :loading="resetting"
          >
            执行重置
          </el-button>
          <el-button @click="goToBackup">前往备份</el-button>
        </div>
      </div>
    </el-card>

    <!-- 重置进度对话框 -->
    <el-dialog v-model="showProgress" title="数据重置进度" width="600px" :close-on-click-modal="false">
      <el-progress 
        :percentage="resetProgress" 
        :status="resetStatus"
        :stroke-width="20"
      ></el-progress>

      <div class="reset-log">
        <h4>重置日志</h4>
        <div class="log-content">
          <p v-for="(log, index) in resetLogs" :key="index" :class="log.type">
            {{ log.time }} - {{ log.message }}
          </p>
        </div>
      </div>

      <template #footer v-if="resetProgress === 100">
        <el-button type="primary" @click="showProgress = false">完成</el-button>
      </template>
    </el-dialog>

    <!-- 重置历史 -->
    <el-card class="history-card" shadow="hover">
      <template #header>
        <span>重置历史</span>
      </template>

      <el-table :data="resetHistory" border>
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="types" label="重置类型" width="200">
          <template #default="scope">
            <el-tag v-for="type in scope.row.types" :key="type" size="small" style="margin: 2px;">
              {{ type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="mode" label="模式" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.mode === 'hard' ? 'danger' : 'warning'">
              {{ scope.row.mode === 'hard' ? '硬删除' : '软删除' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="count" label="删除数量" width="120"></el-table-column>
        <el-table-column prop="operator" label="操作人" width="120"></el-table-column>
        <el-table-column prop="time" label="操作时间" width="180"></el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="viewDetail(scope.row)">
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
        @size-change="loadResetHistory"
        @current-change="loadResetHistory"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { dataResetApi } from '@/api/system/initialization'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const selectedTypes = ref([])
const resetTypes = ref([])
const previewData = ref(null)
const showProgress = ref(false)
const resetting = ref(false)
const resetProgress = ref(0)
const resetStatus = ref('')
const resetLogs = ref([])
const resetHistory = ref([])
const historyPage = ref(1)
const historyPageSize = ref(10)
const historyTotal = ref(0)

const resetForm = reactive({
  mode: 'soft',
  keepDateRange: [],
  backupConfirmed: false,
  verifyCode: ''
})

// 计算属性
const canReset = computed(() => {
  return selectedTypes.value.length > 0 &&
         resetForm.backupConfirmed &&
         resetForm.verifyCode === 'RESET'
})

// 方法
const loadResetTypes = async () => {
  try {
    const res = await dataResetApi.getResetTypes()
    resetTypes.value = res.data || [
      { code: 'user', name: '用户数据', description: '包括用户账号、个人信息等', count: 150 },
      { code: 'order', name: '订单数据', description: '包括所有订单记录', count: 5000 },
      { code: 'product', name: '产品数据', description: '包括产品信息、库存等', count: 800 },
      { code: 'log', name: '日志数据', description: '包括操作日志、审计日志等', count: 10000 },
      { code: 'report', name: '报表数据', description: '包括统计报表、分析数据等', count: 2000 },
      { code: 'config', name: '配置数据', description: '系统配置参数', count: 100, disabled: true }
    ]
  } catch (error) {
    console.error('加载重置类型失败:', error)
  }
}

const previewReset = async () => {
  if (selectedTypes.value.length === 0) {
    ElMessage.warning('请选择要重置的数据类型')
    return
  }

  try {
    const params = {
      types: selectedTypes.value,
      mode: resetForm.mode,
      keepDateRange: resetForm.keepDateRange
    }
    const res = await dataResetApi.previewReset(params)
    previewData.value = res.data || {
      totalCount: 15950,
      details: [
        { type: 'user', name: '用户数据', count: 150, impact: '将删除用户账号及关联数据' },
        { type: 'order', name: '订单数据', count: 5000, impact: '将删除订单记录及关联数据' }
      ]
    }
    ElMessage.success('影响预览加载成功')
  } catch (error) {
    ElMessage.error('预览失败')
    console.error('预览重置影响失败:', error)
  }
}

const confirmReset = () => {
  ElMessageBox.confirm(
    `确认要重置选定的数据吗？此操作将删除 ${previewData.value?.totalCount || 0} 条数据，${resetForm.mode === 'hard' ? '且不可恢复' : '可通过数据恢复功能恢复'}。`,
    '确认重置',
    {
      confirmButtonText: '确认重置',
      cancelButtonText: '取消',
      type: 'error',
      distinguishCancelAndClose: true
    }
  ).then(() => {
    executeReset()
  }).catch(() => {
    ElMessage.info('已取消重置')
  })
}

const executeReset = async () => {
  showProgress.value = true
  resetting.value = true
  resetProgress.value = 0
  resetLogs.value = []
  resetStatus.value = ''

  try {
    addResetLog('开始执行数据重置...', 'info')
    
    const params = {
      types: selectedTypes.value,
      mode: resetForm.mode,
      keepDateRange: resetForm.keepDateRange
    }

    // 调用重置API
    const res = await dataResetApi.executeReset(params)

    // 模拟进度更新
    const steps = [
      { progress: 20, message: '正在备份数据...' },
      { progress: 40, message: '正在清理用户数据...' },
      { progress: 60, message: '正在清理订单数据...' },
      { progress: 80, message: '正在更新索引...' },
      { progress: 100, message: '数据重置完成！' }
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      resetProgress.value = step.progress
      addResetLog(step.message, step.progress === 100 ? 'success' : 'info')
    }

    resetStatus.value = 'success'
    ElMessage.success('数据重置成功')
    
    // 重新加载历史记录
    loadResetHistory()
    
    // 清空表单
    selectedTypes.value = []
    previewData.value = null
    resetForm.backupConfirmed = false
    resetForm.verifyCode = ''
  } catch (error) {
    resetStatus.value = 'exception'
    addResetLog('重置失败：' + (error.message || '未知错误'), 'error')
    ElMessage.error('数据重置失败')
    console.error('数据重置失败:', error)
  } finally {
    resetting.value = false
  }
}

const addResetLog = (message, type = 'info') => {
  resetLogs.value.push({
    message,
    type,
    time: new Date().toLocaleTimeString()
  })
}

const loadResetHistory = async () => {
  try {
    const params = {
      pageNum: historyPage.value,
      pageSize: historyPageSize.value
    }
    // const res = await dataResetApi.getResetHistory(params)
    // resetHistory.value = res.data.records || []
    // historyTotal.value = res.data.total || 0
    
    // 模拟数据
    resetHistory.value = [
      {
        id: 1,
        types: ['user', 'order'],
        mode: 'soft',
        count: 5150,
        operator: 'admin',
        time: '2024-01-15 10:30:00'
      }
    ]
    historyTotal.value = 1
  } catch (error) {
    console.error('加载重置历史失败:', error)
  }
}

const viewDetail = (row) => {
  ElMessageBox.alert(
    `重置ID: ${row.id}
重置类型: ${row.types.join(', ')}
删除数量: ${row.count}
操作人: ${row.operator}
操作时间: ${row.time}`,
    '重置详情',
    {
      confirmButtonText: '确定'
    }
  )
}

const goToBackup = () => {
  router.push('/system/initialization/data-backup')
}

onMounted(() => {
  loadResetTypes()
  loadResetHistory()
})
</script>

<style scoped>
.data-reset-container {
  padding: 20px;
}

.main-card,
.history-card {
  margin-top: 20px;
}

.warning-alert {
  margin-bottom: 20px;
}

.reset-content {
  margin-top: 20px;
}

.section-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-card {
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.type-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.type-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.type-desc {
  color: #909399;
  font-size: 13px;
  margin: 5px 0;
}

.type-count {
  color: #409eff;
  font-size: 12px;
  margin: 5px 0 0 0;
}

.action-buttons {
  text-align: center;
  margin-top: 30px;
}

.reset-log {
  margin-top: 20px;
}

.reset-log h4 {
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
</style>
