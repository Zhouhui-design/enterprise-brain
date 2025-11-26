<template>
  <div class="version-history">
    <div class="history-header">
      <div class="header-left">
        <h3>版本历史</h3>
        <el-tag v-if="designName" type="primary">{{ designName }}</el-tag>
      </div>
      <div class="header-right">
        <el-button-group>
          <el-button size="small" @click="toggleView" :type="viewMode === 'timeline' ? 'primary' : ''">
            <el-icon><Timer /></el-icon>
            时间线
          </el-button>
          <el-button size="small" @click="toggleView" :type="viewMode === 'list' ? 'primary' : ''">
            <el-icon><List /></el-icon>
            列表
          </el-button>
        </el-button-group>
        <el-button size="small" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计信息 -->
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

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="版本号">
          <el-input v-model="filterForm.version" placeholder="请输入版本号" clearable style="width: 150px;" />
        </el-form-item>
        <el-form-item label="版本类型">
          <el-select v-model="filterForm.type" placeholder="请选择版本类型" clearable style="width: 120px;">
            <el-option label="主版本" value="major" />
            <el-option label="次版本" value="minor" />
            <el-option label="修订版本" value="patch" />
            <el-option label="预发布" value="prerelease" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable style="width: 120px;">
            <el-option label="草稿" value="draft" />
            <el-option label="发布" value="released" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建人">
          <el-input v-model="filterForm.creator" placeholder="请输入创建人" clearable style="width: 120px;" />
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 200px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">筛选</el-button>
          <el-button @click="handleResetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 时间线视图 -->
    <div v-if="viewMode === 'timeline'" class="timeline-view">
      <el-timeline>
        <el-timeline-item
          v-for="(version, index) in filteredVersions"
          :key="version.id"
          :timestamp="version.createTime"
          :type="getTimelineType(version.type)"
          :icon="getTimelineIcon(version.type)"
          :size="version.type === 'major' ? 'large' : 'normal'"
        >
          <el-card class="version-card">
            <div class="version-header">
              <div class="version-info">
                <h4>
                  <el-tag :type="getVersionTypeColor(version.type)" size="small">
                    {{ version.version }}
                  </el-tag>
                  <span class="version-title">{{ version.title }}</span>
                </h4>
                <div class="version-meta">
                  <el-tag :type="getStatusType(version.status)" size="small">
                    {{ getStatusText(version.status) }}
                  </el-tag>
                  <span class="creator">{{ version.creator }}</span>
                  <span class="create-time">{{ formatTime(version.createTime) }}</span>
                </div>
              </div>
              <div class="version-actions">
                <el-dropdown @command="handleCommand">
                  <el-button type="text">
                    操作 <el-icon><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :command="`view-${version.id}`">查看详情</el-dropdown-item>
                      <el-dropdown-item :command="`download-${version.id}`">下载版本</el-dropdown-item>
                      <el-dropdown-item :command="`compare-${version.id}`" :disabled="!canCompare">对比版本</el-dropdown-item>
                      <el-dropdown-item :command="`restore-${version.id}`" :disabled="!canRestore">恢复到此版本</el-dropdown-item>
                      <el-dropdown-item :command="`tag-${version.id}`">创建标签</el-dropdown-item>
                      <el-dropdown-item :command="`archive-${version.id}`" divided :disabled="version.status === 'archived'">归档</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            
            <div class="version-content">
              <p class="description">{{ version.description }}</p>
              
              <!-- 变更统计 -->
              <div class="change-stats">
                <el-row :gutter="15">
                  <el-col :span="6">
                    <div class="stat-item">
                      <el-icon color="#67C23A"><Plus /></el-icon>
                      <span>新增 {{ version.changes.additions }} 个</span>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="stat-item">
                      <el-icon color="#E6A23C"><Edit /></el-icon>
                      <span>修改 {{ version.changes.modifications }} 个</span>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="stat-item">
                      <el-icon color="#F56C6C"><Delete /></el-icon>
                      <span>删除 {{ version.changes.deletions }} 个</span>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="stat-item">
                      <el-icon color="#409EFF"><Files /></el-icon>
                      <span>总计 {{ version.changes.total }} 个文件</span>
                    </div>
                  </el-col>
                </el-row>
              </div>
              
              <!-- 变更文件列表 -->
              <el-collapse v-model="activeCollapse">
                <el-collapse-item :name="`files-${version.id}`">
                  <template #title>
                    <span>变更文件 ({{ version.changeFiles.length }})</span>
                  </template>
                  <el-table :data="version.changeFiles" size="small" max-height="300">
                    <el-table-column prop="filename" label="文件名" show-overflow-tooltip />
                    <el-table-column prop="type" label="变更类型" width="100">
                      <template #default="{ row }">
                        <el-tag :type="getChangeTypeColor(row.type)" size="small">
                          {{ getChangeTypeText(row.type) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="additions" label="新增" width="80" />
                    <el-table-column prop="deletions" label="删除" width="80" />
                    <el-table-column label="操作" width="120">
                      <template #default="{ row }">
                        <el-button type="text" size="small" @click="handleViewDiff(row)">查看差异</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-collapse-item>
              </el-collapse>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>

    <!-- 列表视图 -->
    <div v-else class="list-view">
      <el-table :data="filteredVersions" stripe>
        <el-table-column prop="version" label="版本号" width="120">
          <template #default="{ row }">
            <el-tag :type="getVersionTypeColor(row.type)">{{ row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="版本标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="版本类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getVersionTypeColor(row.type)" size="small">
              {{ getVersionTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column prop="changes.total" label="变更文件" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleViewVersion(row)">查看</el-button>
            <el-button type="success" size="small" @click="handleDownloadVersion(row)">下载</el-button>
            <el-button type="warning" size="small" @click="handleCompareVersion(row)" :disabled="!canCompare">对比</el-button>
            <el-dropdown @command="handleMoreCommand">
              <el-button type="text" size="small">
                更多 <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="`tag-${row.id}`">创建标签</el-dropdown-item>
                  <el-dropdown-item :command="`restore-${row.id}`" :disabled="!canRestore">恢复版本</el-dropdown-item>
                  <el-dropdown-item :command="`archive-${row.id}`" :disabled="row.status === 'archived'">归档</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 版本对比对话框 -->
    <el-dialog
      v-model="compareDialogVisible"
      title="版本对比"
      width="90%"
      top="5vh"
    >
      <div class="compare-container">
        <el-row :gutter="20">
          <el-col :span="11">
            <el-card>
              <template #header>
                <div class="compare-header">
                  <span>源版本</span>
                  <el-select v-model="compareForm.sourceVersion" placeholder="请选择版本" @change="handleSourceVersionChange">
                    <el-option
                      v-for="version in versionList"
                      :key="version.id"
                      :label="version.version"
                      :value="version.id"
                    />
                  </el-select>
                </div>
              </template>
              <div class="version-detail">
                <h4>{{ sourceVersion?.title }}</h4>
                <p><strong>版本:</strong> {{ sourceVersion?.version }}</p>
                <p><strong>创建人:</strong> {{ sourceVersion?.creator }}</p>
                <p><strong>创建时间:</strong> {{ formatTime(sourceVersion?.createTime) }}</p>
                <p><strong>描述:</strong> {{ sourceVersion?.description }}</p>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="2" class="compare-arrow">
            <el-icon size="32" color="#409EFF"><Right /></el-icon>
          </el-col>
          
          <el-col :span="11">
            <el-card>
              <template #header>
                <div class="compare-header">
                  <span>目标版本</span>
                  <el-select v-model="compareForm.targetVersion" placeholder="请选择版本" @change="handleTargetVersionChange">
                    <el-option
                      v-for="version in versionList"
                      :key="version.id"
                      :label="version.version"
                      :value="version.id"
                    />
                  </el-select>
                </div>
              </template>
              <div class="version-detail">
                <h4>{{ targetVersion?.title }}</h4>
                <p><strong>版本:</strong> {{ targetVersion?.version }}</p>
                <p><strong>创建人:</strong> {{ targetVersion?.creator }}</p>
                <p><strong>创建时间:</strong> {{ formatTime(targetVersion?.createTime) }}</p>
                <p><strong>描述:</strong> {{ targetVersion?.description }}</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <!-- 对比结果 -->
        <el-divider>对比结果</el-divider>
        <div class="compare-result">
          <el-tabs v-model="compareTab">
            <el-tab-pane label="文件差异" name="files">
              <el-table :data="compareResult.files" stripe>
                <el-table-column prop="filename" label="文件名" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getDiffStatusColor(row.status)" size="small">
                      {{ getDiffStatusText(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="additions" label="新增" width="80" />
                <el-table-column prop="deletions" label="删除" width="80" />
                <el-table-column label="操作" width="100">
                  <template #default="{ row }">
                    <el-button type="text" size="small" @click="handleViewFileDiff(row)">查看</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="统计信息" name="stats">
              <div class="diff-stats">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-statistic title="新增文件" :value="compareResult.stats.addedFiles" />
                  </el-col>
                  <el-col :span="8">
                    <el-statistic title="修改文件" :value="compareResult.stats.modifiedFiles" />
                  </el-col>
                  <el-col :span="8">
                    <el-statistic title="删除文件" :value="compareResult.stats.deletedFiles" />
                  </el-col>
                </el-row>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="compareDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleGenerateDiffReport">生成差异报告</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 版本详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="版本详情"
      width="800px"
    >
      <div v-if="selectedVersion" class="version-detail-full">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="版本号">{{ selectedVersion.version }}</el-descriptions-item>
          <el-descriptions-item label="版本标题">{{ selectedVersion.title }}</el-descriptions-item>
          <el-descriptions-item label="版本类型">
            <el-tag :type="getVersionTypeColor(selectedVersion.type)">
              {{ getVersionTypeText(selectedVersion.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedVersion.status)">
              {{ getStatusText(selectedVersion.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建人">{{ selectedVersion.creator }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(selectedVersion.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="标签" span="2">
            <el-tag
              v-for="tag in selectedVersion.tags"
              :key="tag"
              style="margin-right: 8px;"
            >
              {{ tag }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="描述" span="2">{{ selectedVersion.description }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="success" @click="handleDownloadVersion(selectedVersion)">下载</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Timer,
  List,
  Refresh,
  ArrowDown,
  Plus,
  Edit,
  Delete,
  Files,
  Right
} from '@element-plus/icons-vue'

const props = defineProps({
  designId: {
    type: [String, Number],
    required: true
  },
  designName: {
    type: String,
    default: ''
  }
})

// 响应式数据
const viewMode = ref('timeline')
const compareDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const activeCollapse = ref([])
const compareTab = ref('files')
const selectedVersion = ref(null)

// 筛选表单
const filterForm = reactive({
  version: '',
  type: '',
  status: '',
  creator: '',
  dateRange: []
})

// 对比表单
const compareForm = reactive({
  sourceVersion: '',
  targetVersion: ''
})

// 版本统计
const versionStats = ref([
  {
    label: '总版本数',
    value: '42',
    icon: Timer,
    color: '#409EFF'
  },
  {
    label: '已发布',
    value: '28',
    icon: Plus,
    color: '#67C23A'
  },
  {
    label: '草稿版本',
    value: '8',
    icon: Edit,
    color: '#E6A23C'
  },
  {
    label: '已归档',
    value: '6',
    icon: Files,
    color: '#909399'
  }
])

// 版本列表
const versionList = ref([
  {
    id: 1,
    version: 'v2.1.0',
    title: '机械臂结构优化版本',
    type: 'minor',
    status: 'released',
    creator: '张三',
    createTime: '2024-03-15 14:30:00',
    description: '优化了机械臂的结构设计，提高了负载能力和运动精度',
    tags: ['release', 'stable'],
    changes: {
      additions: 15,
      modifications: 8,
      deletions: 3,
      total: 26
    },
    changeFiles: [
      {
        filename: 'assembly/main.dwg',
        type: 'modified',
        additions: 120,
        deletions: 45
      },
      {
        filename: 'parts/arm_component.dwg',
        type: 'added',
        additions: 200,
        deletions: 0
      },
      {
        filename: 'docs/design_spec.pdf',
        type: 'modified',
        additions: 50,
        deletions: 10
      }
    ]
  },
  {
    id: 2,
    version: 'v2.0.1',
    title: '修复连接件尺寸问题',
    type: 'patch',
    status: 'released',
    creator: '李四',
    createTime: '2024-03-10 10:15:00',
    description: '修复了连接件尺寸标注错误的问题',
    tags: ['hotfix'],
    changes: {
      additions: 5,
      modifications: 3,
      deletions: 1,
      total: 9
    },
    changeFiles: [
      {
        filename: 'parts/connector.dwg',
        type: 'modified',
        additions: 30,
        deletions: 5
      }
    ]
  },
  {
    id: 3,
    version: 'v2.0.0',
    title: '全新机械臂设计',
    type: 'major',
    status: 'released',
    creator: '王五',
    createTime: '2024-02-28 16:45:00',
    description: '全新设计的机械臂系统，采用模块化设计理念',
    tags: ['major', 'milestone'],
    changes: {
      additions: 120,
      modifications: 20,
      deletions: 50,
      total: 190
    },
    changeFiles: [
      {
        filename: 'assembly/robot_arm_v2.dwg',
        type: 'added',
        additions: 500,
        deletions: 0
      },
      {
        filename: 'docs/manual_v2.pdf',
        type: 'added',
        additions: 100,
        deletions: 0
      }
    ]
  },
  {
    id: 4,
    version: 'v2.1.0-alpha',
    title: '预发布版本',
    type: 'prerelease',
    status: 'draft',
    creator: '赵六',
    createTime: '2024-03-18 09:30:00',
    description: '预发布版本，包含新的结构优化',
    tags: ['alpha', 'testing'],
    changes: {
      additions: 25,
      modifications: 10,
      deletions: 5,
      total: 40
    },
    changeFiles: [
      {
        filename: 'assembly/prototype.dwg',
        type: 'added',
        additions: 300,
        deletions: 0
      }
    ]
  }
])

// 权限控制
const canCompare = ref(true)
const canRestore = ref(true)

// 过滤后的版本列表
const filteredVersions = computed(() => {
  let filtered = versionList.value

  if (filterForm.version) {
    filtered = filtered.filter(v => 
      v.version.toLowerCase().includes(filterForm.version.toLowerCase())
    )
  }

  if (filterForm.type) {
    filtered = filtered.filter(v => v.type === filterForm.type)
  }

  if (filterForm.status) {
    filtered = filtered.filter(v => v.status === filterForm.status)
  }

  if (filterForm.creator) {
    filtered = filtered.filter(v => 
      v.creator.includes(filterForm.creator)
    )
  }

  if (filterForm.dateRange && filterForm.dateRange.length === 2) {
    const [startDate, endDate] = filterForm.dateRange
    filtered = filtered.filter(v => {
      const versionDate = v.createTime.split(' ')[0]
      return versionDate >= startDate && versionDate <= endDate
    })
  }

  return filtered.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
})

// 对比相关计算属性
const sourceVersion = computed(() => 
  versionList.value.find(v => v.id === compareForm.sourceVersion)
)

const targetVersion = computed(() => 
  versionList.value.find(v => v.id === compareForm.targetVersion)
)

// 模拟对比结果
const compareResult = reactive({
  files: [
    {
      filename: 'assembly/main.dwg',
      status: 'modified',
      additions: 120,
      deletions: 45
    },
    {
      filename: 'parts/new_component.dwg',
      status: 'added',
      additions: 200,
      deletions: 0
    },
    {
      filename: 'docs/old_manual.pdf',
      status: 'deleted',
      additions: 0,
      deletions: 100
    }
  ],
  stats: {
    addedFiles: 1,
    modifiedFiles: 1,
    deletedFiles: 1
  }
})

// 工具方法
const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

// 类型映射方法
const getTimelineType = (type) => {
  const typeMap = {
    major: 'danger',
    minor: 'primary',
    patch: 'success',
    prerelease: 'warning'
  }
  return typeMap[type] || 'info'
}

const getTimelineIcon = (type) => {
  const iconMap = {
    major: Timer,
    minor: Plus,
    patch: Edit,
    prerelease: Files
  }
  return iconMap[type] || Files
}

const getVersionTypeColor = (type) => {
  const colorMap = {
    major: 'danger',
    minor: 'primary',
    patch: 'success',
    prerelease: 'warning'
  }
  return colorMap[type] || 'info'
}

const getVersionTypeText = (type) => {
  const textMap = {
    major: '主版本',
    minor: '次版本',
    patch: '修订版本',
    prerelease: '预发布'
  }
  return textMap[type] || type
}

const getStatusType = (status) => {
  const typeMap = {
    draft: 'warning',
    released: 'success',
    archived: 'info'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    draft: '草稿',
    released: '已发布',
    archived: '已归档'
  }
  return textMap[status] || status
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

const getDiffStatusColor = (status) => {
  const colorMap = {
    added: 'success',
    modified: 'primary',
    deleted: 'danger',
    renamed: 'warning'
  }
  return colorMap[status] || 'info'
}

const getDiffStatusText = (status) => {
  const textMap = {
    added: '新增',
    modified: '修改',
    deleted: '删除',
    renamed: '重命名'
  }
  return textMap[status] || status
}

// 事件处理函数
const toggleView = () => {
  viewMode.value = viewMode.value === 'timeline' ? 'list' : 'timeline'
}

const handleRefresh = () => {
  ElMessage.success('刷新成功')
}

const handleFilter = () => {
  ElMessage.success('筛选完成')
}

const handleResetFilter = () => {
  Object.keys(filterForm).forEach(key => {
    if (key === 'dateRange') {
      filterForm[key] = []
    } else {
      filterForm[key] = ''
    }
  })
  ElMessage.success('重置成功')
}

const handleCommand = (command) => {
  const [action, id] = command.split('-')
  const version = versionList.value.find(v => v.id === parseInt(id))
  
  switch (action) {
    case 'view':
      handleViewVersion(version)
      break
    case 'download':
      handleDownloadVersion(version)
      break
    case 'compare':
      handleCompareVersion(version)
      break
    case 'restore':
      handleRestoreVersion(version)
      break
    case 'tag':
      handleCreateTag(version)
      break
    case 'archive':
      handleArchiveVersion(version)
      break
  }
}

const handleMoreCommand = (command) => {
  handleCommand(command)
}

const handleViewVersion = (version) => {
  selectedVersion.value = version
  detailDialogVisible.value = true
}

const handleDownloadVersion = (version) => {
  ElMessage.success(`开始下载版本 ${version.version}`)
}

const handleCompareVersion = (version) => {
  compareForm.sourceVersion = version.id
  compareDialogVisible.value = true
}

const handleRestoreVersion = (version) => {
  ElMessageBox.confirm(`确定恢复到版本 ${version.version} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('版本恢复成功')
  }).catch(() => {
    ElMessage.info('已取消恢复')
  })
}

const handleCreateTag = (version) => {
  ElMessage.info(`为版本 ${version.version} 创建标签功能开发中...`)
}

const handleArchiveVersion = (version) => {
  ElMessageBox.confirm(`确定归档版本 ${version.version} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    version.status = 'archived'
    ElMessage.success('版本归档成功')
  }).catch(() => {
    ElMessage.info('已取消归档')
  })
}

const handleViewDiff = (file) => {
  ElMessage.info(`查看文件 ${file.filename} 的差异`)
}

const handleSourceVersionChange = () => {
  // 可以在这里加载源版本的详细信息
}

const handleTargetVersionChange = () => {
  // 可以在这里加载目标版本的详细信息
  // 并生成对比结果
  generateCompareResult()
}

const generateCompareResult = () => {
  // 模拟生成对比结果
  ElMessage.success('版本对比完成')
}

const handleViewFileDiff = (file) => {
  ElMessage.info(`查看文件 ${file.filename} 的详细差异`)
}

const handleGenerateDiffReport = () => {
  ElMessage.success('差异报告生成中...')
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.version-history {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background-color: white;
  border-radius: 4px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left h3 {
  margin: 0;
  color: #1d2129;
}

.header-right {
  display: flex;
  align-items: center;
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

.filter-card {
  margin-bottom: 20px;
}

.timeline-view {
  flex: 1;
  overflow-y: auto;
  padding: 0 15px;
}

.version-card {
  margin-bottom: 15px;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.version-info {
  flex: 1;
}

.version-info h4 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 10px 0;
  color: #1d2129;
}

.version-title {
  font-weight: normal;
}

.version-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 13px;
  color: #606266;
}

.version-actions {
  margin-left: 15px;
}

.version-content {
  color: #606266;
}

.description {
  margin: 0 0 15px 0;
  line-height: 1.5;
}

.change-stats {
  margin-bottom: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.list-view {
  flex: 1;
  padding: 0 15px;
  overflow-y: auto;
}

.compare-container {
  max-height: 70vh;
  overflow-y: auto;
}

.compare-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.compare-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 40px;
}

.version-detail {
  line-height: 1.8;
}

.version-detail h4 {
  margin: 0 0 15px 0;
  color: #1d2129;
}

.compare-result {
  margin-top: 20px;
}

.diff-stats {
  text-align: center;
  padding: 30px 0;
}

.version-detail-full {
  max-height: 60vh;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .history-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
  
  .stats-container .el-col {
    margin-bottom: 15px;
  }
  
  .filter-card .el-form {
    display: block;
  }
  
  .filter-card .el-form-item {
    margin-bottom: 15px;
    margin-right: 0;
  }
  
  .version-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .version-meta {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .compare-container .el-row {
    flex-direction: column;
  }
  
  .compare-arrow {
    padding: 20px 0;
    transform: rotate(90deg);
  }
}
</style>