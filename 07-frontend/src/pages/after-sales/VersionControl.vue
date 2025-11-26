<template>
  <div class="version-control">
    <div class="page-header">
      <h1>版本控制</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateVersion">
          <el-icon><Plus /></el-icon>
          新建版本
        </el-button>
        <el-button type="success" @click="handleMerge">
          <el-icon><Link /></el-icon>
          合并分支
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-btn>
      </div>
    </div>

    <!-- 版本统计卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(stat, index) in versionStats" :key="index">
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

    <!-- 版库分支选择 -->
    <el-card class="repo-card">
      <div class="repo-selector">
        <el-form inline>
          <el-form-item label="代码库">
            <el-select v-model="selectedRepo" placeholder="请选择代码库" @change="handleRepoChange">
              <el-option
                v-for="repo in repoList"
                :key="repo.id"
                :label="repo.name"
                :value="repo.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="分支">
            <el-select v-model="selectedBranch" placeholder="请选择分支" @change="handleBranchChange">
              <el-option
                v-for="branch in branchList"
                :key="branch.name"
                :label="branch.name"
                :value="branch.name"
              >
                <span style="float: left">{{ branch.name }}</span>
                <span style="float: right; color: #8492a6; font-size: 13px">{{ branch.latestCommit }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSync">同步</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 版本历史时间线 -->
    <el-card class="timeline-card">
      <template #header>
        <div class="card-header">
          <span>版本历史</span>
          <div class="header-actions">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="timeline">时间线</el-radio-button>
              <el-radio-button label="list">列表</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <!-- 时间线视图 -->
      <div v-if="viewMode === 'timeline'" class="timeline-view">
        <el-timeline>
          <el-timeline-item
            v-for="(commit, index) in commitHistory"
            :key="commit.id"
            :timestamp="commit.timestamp"
            :type="getCommitType(commit.type)"
            :icon="getCommitIcon(commit.type)"
          >
            <el-card>
              <div class="commit-item">
                <div class="commit-header">
                  <h4>{{ commit.message }}</h4>
                  <div class="commit-actions">
                    <el-tag :type="getVersionType(commit.versionType)" size="small">
                      {{ commit.version }}
                    </el-tag>
                    <el-dropdown @command="handleCommand">
                      <el-button type="text" size="small">
                        操作 <el-icon><arrow-down /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item :command="`view-${commit.id}`">查看详情</el-dropdown-item>
                          <el-dropdown-item :command="`compare-${commit.id}`">对比差异</el-dropdown-item>
                          <el-dropdown-item :command="`branch-${commit.id}`">创建分支</el-dropdown-item>
                          <el-dropdown-item :command="`tag-${commit.id}`">创建标签</el-dropdown-item>
                          <el-dropdown-item :command="`rollback-${commit.id}`" divided>回滚</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>
                <div class="commit-info">
                  <p><strong>提交者:</strong> {{ commit.author }}</p>
                  <p><strong>分支:</strong> {{ commit.branch }}</p>
                  <p><strong>变更文件:</strong> {{ commit.changedFiles }} 个</p>
                  <p><strong>说明:</strong> {{ commit.description }}</p>
                </div>
                <div class="commit-files" v-if="commit.files && commit.files.length > 0">
                  <el-collapse>
                    <el-collapse-item title="变更文件列表" name="files">
                      <el-table :data="commit.files" size="small">
                        <el-table-column prop="filename" label="文件名" />
                        <el-table-column prop="type" label="变更类型" width="100">
                          <template #default="{ row }">
                            <el-tag :type="getChangeTypeColor(row.type)" size="small">
                              {{ getChangeTypeText(row.type) }}
                            </el-tag>
                          </template>
                        </el-table-column>
                        <el-table-column prop="additions" label="新增" width="80" />
                        <el-table-column prop="deletions" label="删除" width="80" />
                        <el-table-column label="操作" width="100">
                          <template #default="{ row }">
                            <el-button type="text" size="small" @click="handleViewFileDiff(row)">
                              查看差异
                            </el-button>
                          </template>
                        </el-table-column>
                      </el-table>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 列表视图 -->
      <div v-else class="list-view">
        <el-table :data="commitHistory" stripe>
          <el-table-column prop="version" label="版本" width="100">
            <template #default="{ row }">
              <el-tag :type="getVersionType(row.versionType)" size="small">
                {{ row.version }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="提交信息" min-width="250" show-overflow-tooltip />
          <el-table-column prop="author" label="提交者" width="120" />
          <el-table-column prop="branch" label="分支" width="120" />
          <el-table-column prop="changedFiles" label="变更文件" width="100" />
          <el-table-column prop="timestamp" label="提交时间" width="160" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleViewCommit(row)">查看</el-button>
              <el-button type="success" size="small" @click="handleCompare(row)">对比</el-button>
              <el-button type="warning" size="small" @click="handleBranchFromCommit(row)">分支</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 分支管理 -->
    <el-card class="branch-card">
      <template #header>
        <div class="card-header">
          <span>分支管理</span>
          <el-button type="primary" size="small" @click="handleCreateBranch">
            新建分支
          </el-button>
        </div>
      </template>
      
      <el-table :data="branchList" stripe>
        <el-table-column prop="name" label="分支名称" />
        <el-table-column prop="type" label="分支类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getBranchTypeColor(row.type)" size="small">
              {{ getBranchTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="创建者" width="120" />
        <el-table-column prop="latestCommit" label="最新提交" width="200" />
        <el-table-column prop="commits" label="提交数" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '活跃' : '已合并' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleMergeBranch(row)">合并</el-button>
            <el-button type="warning" size="small" @click="handleProtectBranch(row)">保护</el-button>
            <el-button type="danger" size="small" @click="handleDeleteBranch(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建版本对话框 -->
    <el-dialog
      v-model="versionDialogVisible"
      title="新建版本"
      width="600px"
    >
      <el-form
        ref="versionFormRef"
        :model="versionForm"
        :rules="versionRules"
        label-width="100px"
      >
        <el-form-item label="版本类型" prop="versionType">
          <el-select v-model="versionForm.versionType" placeholder="请选择版本类型">
            <el-option label="主版本" value="major" />
            <el-option label="次版本" value="minor" />
            <el-option label="修订版本" value="patch" />
            <el-option label="预发布版本" value="prerelease" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本号" prop="version">
          <el-input v-model="versionForm.version" placeholder="如: 1.0.0" />
        </el-form-item>
        <el-form-item label="标签名" prop="tagName">
          <el-input v-model="versionForm.tagName" placeholder="如: v1.0.0" />
        </el-form-item>
        <el-form-item label="分支" prop="branch">
          <el-select v-model="versionForm.branch" placeholder="请选择分支">
            <el-option
              v-for="branch in branchList"
              :key="branch.name"
              :label="branch.name"
              :value="branch.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="发布说明">
          <el-input
            v-model="versionForm.releaseNotes"
            type="textarea"
            :rows="4"
            placeholder="请输入版本发布说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="versionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCreateVersionSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 创建分支对话框 -->
    <el-dialog
      v-model="branchDialogVisible"
      title="创建分支"
      width="500px"
    >
      <el-form
        ref="branchFormRef"
        :model="branchForm"
        :rules="branchRules"
        label-width="100px"
      >
        <el-form-item label="分支名" prop="name">
          <el-input v-model="branchForm.name" placeholder="请输入分支名" />
        </el-form-item>
        <el-form-item label="基于分支" prop="baseBranch">
          <el-select v-model="branchForm.baseBranch" placeholder="请选择基础分支">
            <el-option
              v-for="branch in branchList"
              :key="branch.name"
              :label="branch.name"
              :value="branch.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分支类型" prop="type">
          <el-select v-model="branchForm.type" placeholder="请选择分支类型">
            <el-option label="功能分支" value="feature" />
            <el-option label="修复分支" value="hotfix" />
            <el-option label="发布分支" value="release" />
            <el-option label="开发分支" value="develop" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="branchDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCreateBranchSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 合并分支对话框 -->
    <el-dialog
      v-model="mergeDialogVisible"
      title="合并分支"
      width="600px"
    >
      <el-form :model="mergeForm" label-width="100px">
        <el-form-item label="源分支">
          <el-select v-model="mergeForm.sourceBranch" placeholder="请选择源分支">
            <el-option
              v-for="branch in branchList"
              :key="branch.name"
              :label="branch.name"
              :value="branch.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标分支">
          <el-select v-model="mergeForm.targetBranch" placeholder="请选择目标分支">
            <el-option
              v-for="branch in branchList"
              :key="branch.name"
              :label="branch.name"
              :value="branch.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="合并方式">
          <el-radio-group v-model="mergeForm.method">
            <el-radio label="merge">合并提交</el-radio>
            <el-radio label="rebase">变基合并</el-radio>
            <el-radio label="squash">压缩合并</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="mergeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleMergeSubmit">开始合并</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Link, ArrowDown, Timer, Check, Warning, InfoFilled } from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const versionDialogVisible = ref(false)
const branchDialogVisible = ref(false)
const mergeDialogVisible = ref(false)
const selectedRepo = ref('')
const selectedBranch = ref('')
const viewMode = ref('timeline')
const versionFormRef = ref()
const branchFormRef = ref()

// 版本统计数据
const versionStats = ref([
  {
    label: '总版本数',
    value: '86',
    icon: Timer,
    color: '#409EFF'
  },
  {
    label: '活跃分支',
    value: '12',
    icon: Link,
    color: '#67C23A'
  },
  {
    label: '待合并',
    value: '5',
    icon: Warning,
    color: '#E6A23C'
  },
  {
    label: '今日提交',
    value: '23',
    icon: Check,
    color: '#909399'
  }
])

// 代码库列表
const repoList = ref([
  { id: 1, name: '智能仓储系统' },
  { id: 2, name: '生产流程优化' },
  { id: 3, name: '质量管理系统' }
])

// 分支列表
const branchList = ref([
  {
    name: 'main',
    type: 'main',
    author: '系统',
    latestCommit: 'abc1234',
    commits: 156,
    status: 'active'
  },
  {
    name: 'develop',
    type: 'develop',
    author: '张三',
    latestCommit: 'def5678',
    commits: 89,
    status: 'active'
  },
  {
    name: 'feature/user-auth',
    type: 'feature',
    author: '李四',
    latestCommit: 'ghi9012',
    commits: 12,
    status: 'active'
  },
  {
    name: 'hotfix/login-bug',
    type: 'hotfix',
    author: '王五',
    latestCommit: 'jkl3456',
    commits: 3,
    status: 'active'
  }
])

// 提交历史
const commitHistory = ref([
  {
    id: 1,
    version: 'v1.2.0',
    versionType: 'minor',
    message: '添加用户认证功能',
    author: '张三',
    branch: 'feature/user-auth',
    changedFiles: 15,
    timestamp: '2024-03-15 14:30:00',
    type: 'feature',
    description: '实现了用户登录、注册、权限管理等功能',
    files: [
      {
        filename: 'src/components/Login.vue',
        type: 'added',
        additions: 120,
        deletions: 0
      },
      {
        filename: 'src/store/auth.js',
        type: 'added',
        additions: 85,
        deletions: 0
      },
      {
        filename: 'src/utils/request.js',
        type: 'modified',
        additions: 25,
        deletions: 15
      }
    ]
  },
  {
    id: 2,
    version: 'v1.1.1',
    versionType: 'patch',
    message: '修复登录页面样式问题',
    author: '李四',
    branch: 'hotfix/login-style',
    changedFiles: 3,
    timestamp: '2024-03-14 10:15:00',
    type: 'hotfix',
    description: '修复了移动端登录页面布局错乱的问题',
    files: [
      {
        filename: 'src/components/Login.vue',
        type: 'modified',
        additions: 15,
        deletions: 8
      },
      {
        filename: 'src/assets/css/login.css',
        type: 'modified',
        additions: 30,
        deletions: 5
      }
    ]
  },
  {
    id: 3,
    version: 'v1.1.0',
    versionType: 'minor',
    message: '新增数据导出功能',
    author: '王五',
    branch: 'feature/data-export',
    changedFiles: 8,
    timestamp: '2024-03-13 16:45:00',
    type: 'feature',
    description: '支持Excel、PDF格式的数据导出',
    files: [
      {
        filename: 'src/utils/export.js',
        type: 'added',
        additions: 200,
        deletions: 0
      }
    ]
  }
])

// 版本表单
const versionForm = reactive({
  versionType: '',
  version: '',
  tagName: '',
  branch: '',
  releaseNotes: ''
})

// 分支表单
const branchForm = reactive({
  name: '',
  baseBranch: '',
  type: ''
})

// 合并表单
const mergeForm = reactive({
  sourceBranch: '',
  targetBranch: '',
  method: 'merge'
})

// 表单验证规则
const versionRules = {
  versionType: [
    { required: true, message: '请选择版本类型', trigger: 'change' }
  ],
  version: [
    { required: true, message: '请输入版本号', trigger: 'blur' }
  ],
  tagName: [
    { required: true, message: '请输入标签名', trigger: 'blur' }
  ],
  branch: [
    { required: true, message: '请选择分支', trigger: 'change' }
  ]
}

const branchRules = {
  name: [
    { required: true, message: '请输入分支名', trigger: 'blur' }
  ],
  baseBranch: [
    { required: true, message: '请选择基础分支', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择分支类型', trigger: 'change' }
  ]
}

// 类型映射函数
const getCommitType = (type) => {
  const typeMap = {
    feature: 'primary',
    hotfix: 'danger',
    release: 'success',
    chore: 'info'
  }
  return typeMap[type] || 'info'
}

const getCommitIcon = (type) => {
  const iconMap = {
    feature: Check,
    hotfix: Warning,
    release: Timer,
    chore: InfoFilled
  }
  return iconMap[type] || InfoFilled
}

const getVersionType = (type) => {
  const typeMap = {
    major: 'danger',
    minor: 'primary',
    patch: 'success',
    prerelease: 'warning'
  }
  return typeMap[type] || 'info'
}

const getChangeTypeColor = (type) => {
  const colorMap = {
    added: 'success',
    modified: 'primary',
    deleted: 'danger',
    renamed: 'warning'
  }
  return colorMap[type] || 'info'
}

const getChangeTypeText = (type) => {
  const textMap = {
    added: '新增',
    modified: '修改',
    deleted: '删除',
    renamed: '重命名'
  }
  return textMap[type] || type
}

const getBranchTypeColor = (type) => {
  const colorMap = {
    main: 'danger',
    develop: 'primary',
    feature: 'success',
    hotfix: 'warning',
    release: 'info'
  }
  return colorMap[type] || 'info'
}

const getBranchTypeText = (type) => {
  const textMap = {
    main: '主分支',
    develop: '开发分支',
    feature: '功能分支',
    hotfix: '修复分支',
    release: '发布分支'
  }
  return textMap[type] || type
}

// 事件处理函数
const handleCreateVersion = () => {
  versionDialogVisible.value = true
}

const handleMerge = () => {
  mergeDialogVisible.value = true
}

const handleRefresh = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('刷新成功')
  }, 1000)
}

const handleRepoChange = (value) => {
  console.log('切换代码库:', value)
  // 这里应该加载对应代码库的分支和提交历史
}

const handleBranchChange = (value) => {
  console.log('切换分支:', value)
  // 这里应该加载对应分支的提交历史
}

const handleSync = () => {
  ElMessage.success('同步中...')
  // 这里应该调用同步API
}

const handleCommand = (command) => {
  const [action, id] = command.split('-')
  switch (action) {
    case 'view':
      ElMessage.success(`查看提交 ${id}`)
      break
    case 'compare':
      ElMessage.success(`对比提交 ${id}`)
      break
    case 'branch':
      ElMessage.success(`从提交 ${id} 创建分支`)
      break
    case 'tag':
      ElMessage.success(`为提交 ${id} 创建标签`)
      break
    case 'rollback':
      ElMessageBox.confirm('确定要回滚到此版本吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage.success('回滚成功')
      })
      break
  }
}

const handleViewFileDiff = (file) => {
  ElMessage.success(`查看文件 ${file.filename} 的差异`)
}

const handleViewCommit = (commit) => {
  ElMessage.success(`查看提交 ${commit.message}`)
}

const handleCompare = (commit) => {
  ElMessage.success(`对比提交 ${commit.message}`)
}

const handleBranchFromCommit = (commit) => {
  ElMessage.success(`从提交 ${commit.message} 创建分支`)
}

const handleMergeBranch = (branch) => {
  mergeForm.sourceBranch = branch.name
  mergeDialogVisible.value = true
}

const handleProtectBranch = (branch) => {
  ElMessage.success(`保护分支 ${branch.name}`)
}

const handleDeleteBranch = (branch) => {
  ElMessageBox.confirm(`确定删除分支"${branch.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleCreateBranch = () => {
  branchDialogVisible.value = true
}

const handleCreateVersionSubmit = () => {
  versionFormRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success('版本创建成功')
      versionDialogVisible.value = false
      // 重置表单
      Object.keys(versionForm).forEach(key => {
        versionForm[key] = ''
      })
    }
  })
}

const handleCreateBranchSubmit = () => {
  branchFormRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success('分支创建成功')
      branchDialogVisible.value = false
      // 重置表单
      Object.keys(branchForm).forEach(key => {
        branchForm[key] = ''
      })
    }
  })
}

const handleMergeSubmit = () => {
  if (!mergeForm.sourceBranch || !mergeForm.targetBranch) {
    ElMessage.warning('请选择源分支和目标分支')
    return
  }
  if (mergeForm.sourceBranch === mergeForm.targetBranch) {
    ElMessage.warning('源分支和目标分支不能相同')
    return
  }
  
  ElMessage.success(`开始合并 ${mergeForm.sourceBranch} 到 ${mergeForm.targetBranch}`)
  mergeDialogVisible.value = false
}

onMounted(() => {
  // 初始化选择第一个代码库
  if (repoList.value.length > 0) {
    selectedRepo.value = repoList.value[0].id
  }
  // 初始化选择主分支
  if (branchList.value.length > 0) {
    selectedBranch.value = 'main'
  }
})
</script>

<style scoped>
.version-control {
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

.repo-card {
  margin-bottom: 20px;
}

.repo-selector {
  padding: 10px 0;
}

.timeline-card,
.branch-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-view {
  max-height: 600px;
  overflow-y: auto;
}

.commit-item {
  padding: 10px 0;
}

.commit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.commit-header h4 {
  margin: 0;
  color: #1d2129;
  flex: 1;
}

.commit-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.commit-info {
  margin-bottom: 15px;
}

.commit-info p {
  margin: 5px 0;
  color: #606266;
}

.commit-files {
  margin-top: 15px;
}

.list-view {
  overflow-x: auto;
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
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .commit-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>