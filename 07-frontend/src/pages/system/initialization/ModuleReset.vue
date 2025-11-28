<template>
  <div class="module-reset-container">
    <el-page-header content="模块重置" @back="$router.back()"></el-page-header>
    
    <el-card class="main-card" shadow="hover">
      <el-alert
        title="模块重置说明"
        type="warning"
        :closable="false"
        show-icon
        class="warning-alert"
      >
        <p>模块重置将清除指定模块的配置和数据，恢复到初始状态。</p>
        <p>请注意模块间的依赖关系，避免因重置导致系统异常。</p>
      </el-alert>

      <!-- 模块列表 -->
      <el-card shadow="never" class="module-list-card">
        <template #header>
          <div class="card-header">
            <span>系统模块列表</span>
            <div>
              <el-button :icon="Refresh" size="small" @click="loadModules">刷新</el-button>
              <el-button type="primary" size="small" @click="showBatchReset = true">批量重置</el-button>
            </div>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="6" v-for="module in modules" :key="module.code">
            <el-card shadow="hover" class="module-card" :class="{ selected: selectedModules.includes(module.code) }">
              <div class="module-header">
                <el-checkbox 
                  v-model="selectedModules" 
                  :label="module.code"
                  @change="handleModuleSelect"
                >
                  <h4>{{ module.name }}</h4>
                </el-checkbox>
                <el-tag :type="getModuleStatusType(module.status)">
                  {{ module.status }}
                </el-tag>
              </div>

              <div class="module-info">
                <p class="module-desc">{{ module.description }}</p>
                <el-divider />
                
                <el-descriptions :column="1" size="small">
                  <el-descriptions-item label="版本">{{ module.version }}</el-descriptions-item>
                  <el-descriptions-item label="数据量">{{ module.dataCount || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="最后重置">
                    {{ module.lastResetTime || '从未' }}
                  </el-descriptions-item>
                </el-descriptions>

                <div class="module-dependencies" v-if="module.dependencies && module.dependencies.length > 0">
                  <el-divider />
                  <p class="dep-label">依赖模块:</p>
                  <el-tag 
                    v-for="dep in module.dependencies" 
                    :key="dep" 
                    size="small"
                    style="margin: 2px;"
                  >
                    {{ dep }}
                  </el-tag>
                </div>
              </div>

              <div class="module-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="viewModuleDetail(module)"
                >
                  详情
                </el-button>
                <el-button 
                  type="warning" 
                  size="small" 
                  @click="resetSingleModule(module)"
                  :disabled="module.status === 'disabled'"
                >
                  重置
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-card>

      <!-- 依赖关系图 -->
      <el-card shadow="never" class="dependency-card">
        <template #header>
          <span>模块依赖关系</span>
        </template>
        
        <div class="dependency-graph">
          <el-alert type="info" :closable="false">
            <p>模块间存在依赖关系，重置时请注意：</p>
            <ul>
              <li>被依赖的模块重置后，依赖它的模块可能会受到影响</li>
              <li>建议按照依赖顺序从上到下进行重置</li>
              <li>核心模块（如用户、角色、权限）请谨慎重置</li>
            </ul>
          </el-alert>

          <div class="graph-content" v-if="dependencyGraph">
            <pre>{{ dependencyGraph }}</pre>
          </div>
        </div>
      </el-card>
    </el-card>

    <!-- 批量重置对话框 -->
    <el-dialog v-model="showBatchReset" title="批量重置模块" width="600px">
      <el-alert type="warning" :closable="false" style="margin-bottom: 20px;">
        已选择 {{ selectedModules.length }} 个模块进行重置
      </el-alert>

      <el-table :data="getSelectedModulesInfo()" border max-height="300">
        <el-table-column prop="name" label="模块名称" width="150"></el-table-column>
        <el-table-column prop="dataCount" label="数据量" width="100"></el-table-column>
        <el-table-column prop="dependencies" label="依赖" min-width="200">
          <template #default="scope">
            <el-tag 
              v-for="dep in scope.row.dependencies" 
              :key="dep" 
              size="small"
              style="margin: 2px;"
            >
              {{ dep }}
            </el-tag>
            <span v-if="!scope.row.dependencies || scope.row.dependencies.length === 0">无</span>
          </template>
        </el-table-column>
      </el-table>

      <el-form :model="batchResetForm" label-width="100px" style="margin-top: 20px;">
        <el-form-item label="重置选项">
          <el-checkbox v-model="batchResetForm.resetData">清空数据</el-checkbox>
          <el-checkbox v-model="batchResetForm.resetConfig">重置配置</el-checkbox>
          <el-checkbox v-model="batchResetForm.backup">重置前备份</el-checkbox>
        </el-form-item>

        <el-form-item label="验证码">
          <el-input 
            v-model="batchResetForm.verifyCode" 
            placeholder="请输入 RESET 确认重置"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showBatchReset = false">取消</el-button>
        <el-button 
          type="danger" 
          @click="executeBatchReset"
          :disabled="batchResetForm.verifyCode !== 'RESET' || selectedModules.length === 0"
          :loading="resetting"
        >
          确认重置
        </el-button>
      </template>
    </el-dialog>

    <!-- 模块详情对话框 -->
    <el-dialog v-model="showDetail" title="模块详情" width="700px">
      <el-descriptions :column="2" border v-if="currentModule">
        <el-descriptions-item label="模块编码">{{ currentModule.code }}</el-descriptions-item>
        <el-descriptions-item label="模块名称">{{ currentModule.name }}</el-descriptions-item>
        <el-descriptions-item label="版本">{{ currentModule.version }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getModuleStatusType(currentModule.status)">
            {{ currentModule.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="数据量">{{ currentModule.dataCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="最后重置">{{ currentModule.lastResetTime || '从未' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentModule.description }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>重置历史</el-divider>

      <el-table :data="moduleResetHistory" border max-height="300">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="operator" label="操作人" width="120"></el-table-column>
        <el-table-column prop="time" label="重置时间" width="180"></el-table-column>
        <el-table-column prop="result" label="结果" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.result === 'success' ? 'success' : 'danger'">
              {{ scope.row.result === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注"></el-table-column>
      </el-table>

      <template #footer>
        <el-button type="primary" @click="showDetail = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 重置进度对话框 -->
    <el-dialog v-model="showProgress" title="模块重置进度" width="600px" :close-on-click-modal="false">
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
        <el-button type="primary" @click="finishReset">完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { moduleResetApi } from '@/api/system/initialization'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const modules = ref([])
const selectedModules = ref([])
const showBatchReset = ref(false)
const showDetail = ref(false)
const showProgress = ref(false)
const resetting = ref(false)
const currentModule = ref(null)
const moduleResetHistory = ref([])
const resetProgress = ref(0)
const resetStatus = ref('')
const resetLogs = ref([])
const dependencyGraph = ref('')

const batchResetForm = reactive({
  resetData: true,
  resetConfig: true,
  backup: true,
  verifyCode: ''
})

// 方法
const loadModules = async () => {
  try {
    const res = await moduleResetApi.getAllModules()
    modules.value = res.data || [
      {
        code: 'user',
        name: '用户管理',
        description: '用户账号、个人信息管理',
        version: '1.0.0',
        status: 'active',
        dataCount: 150,
        lastResetTime: null,
        dependencies: []
      },
      {
        code: 'role',
        name: '角色管理',
        description: '角色定义、权限分配',
        version: '1.0.0',
        status: 'active',
        dataCount: 20,
        lastResetTime: null,
        dependencies: ['user']
      },
      {
        code: 'permission',
        name: '权限管理',
        description: '权限定义、资源管理',
        version: '1.0.0',
        status: 'active',
        dataCount: 100,
        lastResetTime: null,
        dependencies: ['role']
      },
      {
        code: 'menu',
        name: '菜单管理',
        description: '系统菜单、导航配置',
        version: '1.0.0',
        status: 'active',
        dataCount: 50,
        lastResetTime: null,
        dependencies: ['permission']
      },
      {
        code: 'dict',
        name: '字典管理',
        description: '数据字典、枚举值管理',
        version: '1.0.0',
        status: 'active',
        dataCount: 200,
        lastResetTime: null,
        dependencies: []
      },
      {
        code: 'config',
        name: '系统配置',
        description: '系统参数、配置项管理',
        version: '1.0.0',
        status: 'active',
        dataCount: 80,
        lastResetTime: null,
        dependencies: []
      },
      {
        code: 'log',
        name: '日志审计',
        description: '操作日志、审计记录',
        version: '1.0.0',
        status: 'active',
        dataCount: 10000,
        lastResetTime: null,
        dependencies: ['user']
      },
      {
        code: 'workflow',
        name: '工作流',
        description: '流程定义、流程引擎',
        version: '1.0.0',
        status: 'active',
        dataCount: 30,
        lastResetTime: null,
        dependencies: ['user', 'role']
      }
    ]

    // 生成依赖关系图
    generateDependencyGraph()
  } catch (error) {
    console.error('加载模块列表失败:', error)
  }
}

const generateDependencyGraph = () => {
  let graph = '模块依赖关系:\n\n'
  modules.value.forEach(module => {
    graph += `${module.name} (${module.code})\n`
    if (module.dependencies && module.dependencies.length > 0) {
      graph += `  └─ 依赖: ${module.dependencies.join(', ')}\n`
    } else {
      graph += `  └─ 无依赖\n`
    }
    graph += '\n'
  })
  dependencyGraph.value = graph
}

const handleModuleSelect = () => {
  // 模块选择处理
}

const getSelectedModulesInfo = () => {
  return modules.value.filter(m => selectedModules.value.includes(m.code))
}

const resetSingleModule = (module) => {
  ElMessageBox.confirm(
    `确认要重置模块"${module.name}"吗？此操作将清除该模块的配置和数据。`,
    '确认重置',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    executeModuleReset([module.code])
  }).catch(() => {
    ElMessage.info('已取消重置')
  })
}

const executeBatchReset = () => {
  showBatchReset.value = false
  executeModuleReset(selectedModules.value)
}

const executeModuleReset = async (moduleCodes) => {
  showProgress.value = true
  resetting.value = true
  resetProgress.value = 0
  resetLogs.value = []
  resetStatus.value = ''

  try {
    addResetLog('开始重置模块...', 'info')
    
    const params = {
      modules: moduleCodes,
      resetData: batchResetForm.resetData,
      resetConfig: batchResetForm.resetConfig,
      backup: batchResetForm.backup
    }

    // 调用重置API
    const res = await moduleResetApi.batchResetModules(params)

    // 模拟进度更新
    const totalSteps = moduleCodes.length
    let currentStep = 0

    for (const moduleCode of moduleCodes) {
      currentStep++
      const module = modules.value.find(m => m.code === moduleCode)
      
      addResetLog(`正在重置模块: ${module?.name || moduleCode}...`, 'info')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      resetProgress.value = Math.floor((currentStep / totalSteps) * 90)
      addResetLog(`模块 ${module?.name || moduleCode} 重置完成`, 'success')
    }

    addResetLog('正在更新系统配置...', 'info')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    resetProgress.value = 100
    addResetLog('模块重置完成！', 'success')
    resetStatus.value = 'success'
    
    ElMessage.success('模块重置成功')
    loadModules()
  } catch (error) {
    resetStatus.value = 'exception'
    addResetLog('重置失败：' + (error.message || '未知错误'), 'error')
    ElMessage.error('模块重置失败')
    console.error('模块重置失败:', error)
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

const finishReset = () => {
  showProgress.value = false
  selectedModules.value = []
  batchResetForm.verifyCode = ''
}

const viewModuleDetail = async (module) => {
  currentModule.value = module
  
  try {
    const res = await moduleResetApi.getModuleResetHistory(module.code)
    moduleResetHistory.value = res.data || []
  } catch (error) {
    console.error('获取模块重置历史失败:', error)
    moduleResetHistory.value = []
  }
  
  showDetail.value = true
}

const getModuleStatusType = (status) => {
  const typeMap = {
    active: 'success',
    disabled: 'info',
    error: 'danger'
  }
  return typeMap[status] || ''
}

onMounted(() => {
  loadModules()
})
</script>

<style scoped>
.module-reset-container {
  padding: 20px;
}

.main-card {
  margin-top: 20px;
}

.warning-alert {
  margin-bottom: 20px;
}

.module-list-card,
.dependency-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.module-card {
  margin-bottom: 20px;
  transition: all 0.3s;
  height: 100%;
}

.module-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.module-card.selected {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.module-header h4 {
  margin: 0;
  font-size: 16px;
}

.module-info {
  margin: 15px 0;
}

.module-desc {
  color: #606266;
  font-size: 13px;
  margin: 10px 0;
  min-height: 40px;
}

.module-dependencies {
  margin-top: 10px;
}

.dep-label {
  font-size: 12px;
  color: #909399;
  margin: 5px 0;
}

.module-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}

.dependency-graph {
  padding: 15px;
}

.graph-content {
  margin-top: 20px;
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.graph-content pre {
  margin: 0;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.8;
  color: #303133;
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
