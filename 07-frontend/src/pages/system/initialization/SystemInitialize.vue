<template>
  <div class="system-initialize-container">
    <el-page-header content="系统初始化" @back="$router.back()"></el-page-header>
    
    <el-card class="main-card" shadow="hover">
      <!-- 初始化状态显示 -->
      <el-alert
        v-if="initStatus.initialized"
        title="系统已初始化"
        type="success"
        :closable="false"
        show-icon
        class="status-alert"
      >
        <template #default>
          <p>初始化时间：{{ initStatus.initTime }}</p>
          <p>初始化人：{{ initStatus.initUser }}</p>
        </template>
      </el-alert>

      <el-alert
        v-else
        title="系统未初始化"
        type="warning"
        :closable="false"
        show-icon
        class="status-alert"
      >
        请按照以下步骤完成系统初始化
      </el-alert>

      <!-- 初始化步骤 -->
      <el-steps :active="activeStep" finish-status="success" class="init-steps">
        <el-step title="环境检查" icon="CircleCheck"></el-step>
        <el-step title="配置确认" icon="Setting"></el-step>
        <el-step title="数据初始化" icon="Loading"></el-step>
        <el-step title="完成" icon="Select"></el-step>
      </el-steps>

      <!-- 步骤内容 -->
      <div class="step-content">
        <!-- 步骤1：环境检查 -->
        <div v-show="activeStep === 0" class="step-panel">
          <h3>环境检查</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="数据库连接">
              <el-tag :type="envCheck.database ? 'success' : 'danger'">
                {{ envCheck.database ? '正常' : '异常' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Redis连接">
              <el-tag :type="envCheck.redis ? 'success' : 'danger'">
                {{ envCheck.redis ? '正常' : '异常' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="文件存储">
              <el-tag :type="envCheck.storage ? 'success' : 'danger'">
                {{ envCheck.storage ? '正常' : '异常' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="网络连接">
              <el-tag :type="envCheck.network ? 'success' : 'danger'">
                {{ envCheck.network ? '正常' : '异常' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
          
          <div class="step-actions">
            <el-button type="primary" @click="validateEnvironment" :loading="checkingEnv">
              重新检查
            </el-button>
            <el-button type="success" @click="activeStep = 1" :disabled="!canProceed">
              下一步
            </el-button>
          </div>
        </div>

        <!-- 步骤2：配置确认 -->
        <div v-show="activeStep === 1" class="step-panel">
          <h3>初始化配置</h3>
          <el-form :model="initForm" :rules="rules" ref="initFormRef" label-width="120px">
            <el-form-item label="企业名称" prop="companyName">
              <el-input v-model="initForm.companyName" placeholder="请输入企业名称"></el-input>
            </el-form-item>
            
            <el-form-item label="管理员账号" prop="adminUsername">
              <el-input v-model="initForm.adminUsername" placeholder="请输入管理员账号"></el-input>
            </el-form-item>
            
            <el-form-item label="管理员密码" prop="adminPassword">
              <el-input 
                v-model="initForm.adminPassword" 
                type="password" 
                placeholder="请输入管理员密码"
                show-password
              ></el-input>
            </el-form-item>
            
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input 
                v-model="initForm.confirmPassword" 
                type="password" 
                placeholder="请再次输入密码"
                show-password
              ></el-input>
            </el-form-item>

            <el-form-item label="系统模块" prop="modules">
              <el-checkbox-group v-model="initForm.modules">
                <el-checkbox label="user">用户管理</el-checkbox>
                <el-checkbox label="role">角色管理</el-checkbox>
                <el-checkbox label="permission">权限管理</el-checkbox>
                <el-checkbox label="department">部门管理</el-checkbox>
                <el-checkbox label="menu">菜单管理</el-checkbox>
                <el-checkbox label="dict">字典管理</el-checkbox>
                <el-checkbox label="config">系统配置</el-checkbox>
                <el-checkbox label="log">日志审计</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="初始化数据" prop="initData">
              <el-checkbox-group v-model="initForm.initData">
                <el-checkbox label="demo">演示数据</el-checkbox>
                <el-checkbox label="basic">基础数据</el-checkbox>
                <el-checkbox label="sample">示例数据</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-form>

          <div class="step-actions">
            <el-button @click="activeStep = 0">上一步</el-button>
            <el-button type="primary" @click="confirmConfig">确认配置</el-button>
          </div>
        </div>

        <!-- 步骤3：数据初始化 -->
        <div v-show="activeStep === 2" class="step-panel">
          <h3>正在初始化系统</h3>
          
          <el-progress 
            :percentage="initProgress" 
            :status="initStatus.status"
            :stroke-width="20"
          ></el-progress>

          <div class="init-log">
            <h4>初始化日志</h4>
            <div class="log-content">
              <p v-for="(log, index) in initLogs" :key="index" :class="log.type">
                <el-icon><CircleCheck v-if="log.type === 'success'" /><CircleClose v-else-if="log.type === 'error'" /><Loading v-else /></el-icon>
                {{ log.message }}
              </p>
            </div>
          </div>

          <div class="step-actions">
            <el-button v-if="initProgress === 100" type="success" @click="activeStep = 3">
              完成
            </el-button>
          </div>
        </div>

        <!-- 步骤4：完成 -->
        <div v-show="activeStep === 3" class="step-panel">
          <el-result
            icon="success"
            title="系统初始化成功"
            sub-title="您可以开始使用系统了"
          >
            <template #extra>
              <el-button type="primary" @click="goToHome">进入系统</el-button>
              <el-button @click="viewInitReport">查看初始化报告</el-button>
            </template>
          </el-result>
        </div>
      </div>
    </el-card>

    <!-- 初始化报告对话框 -->
    <el-dialog v-model="showReport" title="初始化报告" width="800px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="初始化时间">{{ reportData.initTime }}</el-descriptions-item>
        <el-descriptions-item label="初始化人">{{ reportData.initUser }}</el-descriptions-item>
        <el-descriptions-item label="企业名称">{{ reportData.companyName }}</el-descriptions-item>
        <el-descriptions-item label="初始化模块">{{ reportData.modules?.join(', ') }}</el-descriptions-item>
        <el-descriptions-item label="数据库版本">{{ reportData.dbVersion }}</el-descriptions-item>
        <el-descriptions-item label="应用版本">{{ reportData.appVersion }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>初始化详情</el-divider>
      
      <el-table :data="reportData.details" border>
        <el-table-column prop="module" label="模块" width="150"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
              {{ scope.row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="说明"></el-table-column>
      </el-table>

      <template #footer>
        <el-button type="primary" @click="downloadReport">下载报告</el-button>
        <el-button @click="showReport = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheck, CircleClose, Loading } from '@element-plus/icons-vue'
import { systemInitApi } from '@/api/system/initialization'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const activeStep = ref(0)
const checkingEnv = ref(false)
const initProgress = ref(0)
const showReport = ref(false)

const envCheck = reactive({
  database: false,
  redis: false,
  storage: false,
  network: false
})

const initStatus = reactive({
  initialized: false,
  initTime: '',
  initUser: '',
  status: ''
})

const initForm = reactive({
  companyName: '',
  adminUsername: 'admin',
  adminPassword: '',
  confirmPassword: '',
  modules: ['user', 'role', 'permission', 'menu'],
  initData: ['basic']
})

const initLogs = ref([])
const reportData = ref({})
const initFormRef = ref(null)

// 表单验证规则
const rules = {
  companyName: [
    { required: true, message: '请输入企业名称', trigger: 'blur' }
  ],
  adminUsername: [
    { required: true, message: '请输入管理员账号', trigger: 'blur' },
    { min: 4, max: 20, message: '长度在 4 到 20 个字符', trigger: 'blur' }
  ],
  adminPassword: [
    { required: true, message: '请输入管理员密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== initForm.adminPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ]
}

// 计算属性
const canProceed = computed(() => {
  return envCheck.database && envCheck.redis && envCheck.storage && envCheck.network
})

// 方法
const checkInitStatus = async () => {
  try {
    const res = await systemInitApi.checkInitStatus()
    Object.assign(initStatus, res.data)
  } catch (error) {
    console.error('检查初始化状态失败:', error)
  }
}

const validateEnvironment = async () => {
  checkingEnv.value = true
  try {
    const res = await systemInitApi.validateEnvironment()
    Object.assign(envCheck, res.data)
    
    if (canProceed.value) {
      ElMessage.success('环境检查通过')
    } else {
      ElMessage.error('环境检查未通过，请修复错误后重试')
    }
  } catch (error) {
    ElMessage.error('环境检查失败')
    console.error('环境验证失败:', error)
  } finally {
    checkingEnv.value = false
  }
}

const confirmConfig = async () => {
  try {
    await initFormRef.value.validate()
    
    ElMessageBox.confirm(
      '确认要使用此配置初始化系统吗？此操作不可逆。',
      '确认初始化',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      activeStep.value = 2
      executeInit()
    }).catch(() => {
      ElMessage.info('已取消初始化')
    })
  } catch (error) {
    ElMessage.error('请填写完整的配置信息')
  }
}

const executeInit = async () => {
  initLogs.value = []
  initProgress.value = 0

  try {
    // 模拟初始化过程
    addLog('开始初始化系统...', 'info')
    initProgress.value = 10

    // 调用初始化API
    const res = await systemInitApi.executeInit(initForm)
    
    // 模拟进度更新
    const steps = [
      { progress: 20, message: '正在创建数据库表结构...' },
      { progress: 40, message: '正在初始化基础数据...' },
      { progress: 60, message: '正在创建管理员账号...' },
      { progress: 80, message: '正在初始化系统模块...' },
      { progress: 90, message: '正在配置系统参数...' },
      { progress: 100, message: '系统初始化完成！' }
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      initProgress.value = step.progress
      addLog(step.message, step.progress === 100 ? 'success' : 'info')
    }

    reportData.value = res.data || {}
    ElMessage.success('系统初始化成功')
  } catch (error) {
    addLog('初始化失败：' + (error.message || '未知错误'), 'error')
    initStatus.status = 'exception'
    ElMessage.error('系统初始化失败')
    console.error('初始化失败:', error)
  }
}

const addLog = (message, type = 'info') => {
  initLogs.value.push({
    message,
    type,
    time: new Date().toLocaleTimeString()
  })
}

const goToHome = () => {
  router.push('/')
}

const viewInitReport = () => {
  showReport.value = true
}

const downloadReport = () => {
  const reportText = JSON.stringify(reportData.value, null, 2)
  const blob = new Blob([reportText], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `init-report-${new Date().getTime()}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('报告已下载')
}

onMounted(() => {
  checkInitStatus()
  validateEnvironment()
})
</script>

<style scoped>
.system-initialize-container {
  padding: 20px;
}

.main-card {
  margin-top: 20px;
}

.status-alert {
  margin-bottom: 20px;
}

.init-steps {
  margin: 30px 0;
}

.step-content {
  min-height: 400px;
  padding: 20px;
}

.step-panel h3 {
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: bold;
}

.step-actions {
  margin-top: 30px;
  text-align: center;
}

.init-log {
  margin-top: 30px;
}

.init-log h4 {
  margin-bottom: 10px;
}

.log-content {
  max-height: 300px;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  font-family: monospace;
}

.log-content p {
  margin: 5px 0;
  display: flex;
  align-items: center;
  gap: 8px;
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
