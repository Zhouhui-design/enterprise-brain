<template>
  <div class="process-optimization">
    <div class="page-header">
      <h1>工艺优化</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateOptimization">
          <el-icon><Plus /></el-icon>
          新建优化方案
        </el-button>
        <el-button type="success" @click="handleAnalyze">
          <el-icon><DataAnalysis /></el-icon>
          工艺分析
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 优化统计卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(stat, index) in optimizationStats" :key="index">
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

    <!-- 优化项目看板 -->
    <div class="kanban-container">
      <el-row :gutter="20">
        <el-col :span="6" v-for="stage in optimizationStages" :key="stage.key">
          <el-card class="kanban-column">
            <template #header>
              <div class="kanban-header">
                <span>{{ stage.title }}</span>
                <el-tag :type="stage.type">{{ stage.count }}</el-tag>
              </div>
            </template>
            
            <div class="kanban-items" @drop="handleDrop($event, stage.key)" @dragover.prevent>
              <div
                v-for="item in getStageItems(stage.key)"
                :key="item.id"
                class="kanban-item"
                draggable="true"
                @dragstart="handleDragStart($event, item)"
                @click="handleViewItem(item)"
              >
                <div class="item-header">
                  <span class="item-title">{{ item.title }}</span>
                  <el-tag :type="getPriorityType(item.priority)" size="small">
                    {{ item.priority }}
                  </el-tag>
                </div>
                <div class="item-content">
                  <p class="item-description">{{ item.description }}</p>
                  <div class="item-meta">
                    <span class="item-process">{{ item.processName }}</span>
                    <span class="item-improvement">+{{ item.improvement }}%</span>
                  </div>
                </div>
                <div class="item-footer">
                  <span class="item-assignee">{{ item.assignee }}</span>
                  <span class="item-date">{{ formatDate(item.dueDate) }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 优化搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="优化编号">
          <el-input v-model="searchForm.optimizationCode" placeholder="请输入优化编号" clearable />
        </el-form-item>
        <el-form-item label="优化标题">
          <el-input v-model="searchForm.title" placeholder="请输入优化标题" clearable />
        </el-form-item>
        <el-form-item label="工艺名称">
          <el-select v-model="searchForm.processId" placeholder="请选择工艺" clearable>
            <el-option
              v-for="process in processList"
              :key="process.id"
              :label="process.name"
              :value="process.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优化类型">
          <el-select v-model="searchForm.optimizationType" placeholder="请选择优化类型" clearable>
            <el-option label="时间优化" value="time" />
            <el-option label="质量优化" value="quality" />
            <el-option label="成本优化" value="cost" />
            <el-option label="效率优化" value="efficiency" />
            <el-option label="安全优化" value="safety" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待分析" value="pending" />
            <el-option label="分析中" value="analyzing" />
            <el-option label="实施中" value="implementing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 优化列表 -->
    <el-card class="table-card">
      <div class="table-header">
        <div class="table-title">
          <span>优化项目列表</span>
          <el-tag v-if="selectedOptimizations.length > 0" type="info">
            已选择 {{ selectedOptimizations.length }} 项
          </el-tag>
        </div>
        <div class="table-actions" v-if="selectedOptimizations.length > 0">
          <el-button type="success" size="small" @click="handleBatchImplement">
            批量实施
          </el-button>
        </div>
      </div>

      <el-table
        :data="optimizationList"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="optimizationCode" label="优化编号" width="120" />
        <el-table-column prop="title" label="优化标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="processName" label="工艺名称" width="150" />
        <el-table-column prop="optimizationType" label="优化类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getOptimizationTypeColor(row.optimizationType)">
              {{ getOptimizationTypeText(row.optimizationType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentValue" label="当前值" width="100" />
        <el-table-column prop="targetValue" label="目标值" width="100" />
        <el-table-column prop="improvement" label="改善幅度" width="100">
          <template #default="{ row }">
            <span :class="getImprovementClass(row.improvement)">
              {{ row.improvement > 0 ? '+' : '' }}{{ row.improvement }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="assignee" label="负责人" width="100" />
        <el-table-column prop="dueDate" label="截止日期" width="110" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button type="success" size="small" @click="handleImplement(row)" v-if="row.status === 'analyzing'">实施</el-button>
            <el-button type="warning" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="info" size="small" @click="handleAnalyze(row)">分析</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)" v-if="row.status !== 'implementing'">删除</el-button>
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

    <!-- 新建/编辑优化方案对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="900px"
      @close="handleDialogClose"
    >
      <el-form
        ref="optimizationFormRef"
        :model="optimizationForm"
        :rules="optimizationRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="优化编号" prop="optimizationCode">
              <el-input v-model="optimizationForm.optimizationCode" placeholder="自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优化标题" prop="title">
              <el-input v-model="optimizationForm.title" placeholder="请输入优化标题" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工艺名称" prop="processId">
              <el-select v-model="optimizationForm.processId" placeholder="请选择工艺">
                <el-option
                  v-for="process in processList"
                  :key="process.id"
                  :label="process.name"
                  :value="process.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优化类型" prop="optimizationType">
              <el-select v-model="optimizationForm.optimizationType" placeholder="请选择优化类型">
                <el-option label="时间优化" value="time" />
                <el-option label="质量优化" value="quality" />
                <el-option label="成本优化" value="cost" />
                <el-option label="效率优化" value="efficiency" />
                <el-option label="安全优化" value="safety" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="问题描述">
          <el-input
            v-model="optimizationForm.problemDescription"
            type="textarea"
            :rows="3"
            placeholder="请描述当前工艺存在的问题"
          />
        </el-form-item>
        <el-form-item label="优化方案">
          <el-input
            v-model="optimizationForm.solution"
            type="textarea"
            :rows="4"
            placeholder="请详细描述优化方案"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="当前值" prop="currentValue">
              <el-input v-model="optimizationForm.currentValue" placeholder="请输入当前值">
                <template #append>{{ getUnitByType(optimizationForm.optimizationType) }}</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="目标值" prop="targetValue">
              <el-input v-model="optimizationForm.targetValue" placeholder="请输入目标值">
                <template #append>{{ getUnitByType(optimizationForm.optimizationType) }}</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="预期改善">
              <el-input :value="calculateImprovement()" readonly>
                <template #append>%</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="optimizationForm.priority" placeholder="请选择优先级">
                <el-option label="高" value="高" />
                <el-option label="中" value="中" />
                <el-option label="低" value="低" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="负责人" prop="assignee">
              <el-select v-model="optimizationForm.assignee" placeholder="请选择负责人" filterable>
                <el-option
                  v-for="user in userList"
                  :key="user.id"
                  :label="user.name"
                  :value="user.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="截止日期" prop="dueDate">
              <el-date-picker
                v-model="optimizationForm.dueDate"
                type="date"
                placeholder="请选择截止日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="所需资源">
          <el-select
            v-model="optimizationForm.requiredResources"
            multiple
            placeholder="请选择所需资源"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="resource in resourceList"
              :key="resource.id"
              :label="resource.name"
              :value="resource.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="相关文件">
          <el-upload
            class="upload-demo"
            drag
            action="#"
            multiple
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持多种文件格式，单个文件不超过 50MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 优化详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="优化方案详情" size="60%">
      <div v-if="currentOptimization" class="optimization-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="优化编号">{{ currentOptimization.optimizationCode }}</el-descriptions-item>
          <el-descriptions-item label="优化标题">{{ currentOptimization.title }}</el-descriptions-item>
          <el-descriptions-item label="工艺名称">{{ currentOptimization.processName }}</el-descriptions-item>
          <el-descriptions-item label="优化类型">
            <el-tag :type="getOptimizationTypeColor(currentOptimization.optimizationType)">
              {{ getOptimizationTypeText(currentOptimization.optimizationType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentOptimization.status)">
              {{ getStatusText(currentOptimization.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityType(currentOptimization.priority)">
              {{ currentOptimization.priority }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentOptimization.assignee }}</el-descriptions-item>
          <el-descriptions-item label="截止日期">{{ formatDate(currentOptimization.dueDate) }}</el-descriptions-item>
          <el-descriptions-item label="当前值">{{ currentOptimization.currentValue }}</el-descriptions-item>
          <el-descriptions-item label="目标值">{{ currentOptimization.targetValue }}</el-descriptions-item>
          <el-descriptions-item label="改善幅度" span="2">
            <span :class="getImprovementClass(currentOptimization.improvement)">
              {{ currentOptimization.improvement > 0 ? '+' : '' }}{{ currentOptimization.improvement }}%
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="问题描述" span="2">{{ currentOptimization.problemDescription }}</el-descriptions-item>
          <el-descriptions-item label="优化方案" span="2">{{ currentOptimization.solution }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-tabs">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="实施进度" name="progress">
              <div class="progress-content">
                <el-steps :active="currentOptimization.progressSteps" direction="vertical">
                  <el-step
                    v-for="(step, index) in optimizationSteps"
                    :key="index"
                    :title="step.title"
                    :description="step.description"
                    :status="step.status"
                  />
                </el-steps>
              </div>
            </el-tab-pane>
            <el-tab-pane label="数据分析" name="analysis">
              <div class="analysis-content">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-card title="优化前后对比">
                      <div class="comparison-chart">
                        <!-- 这里可以集成图表库，如ECharts -->
                        <div class="chart-placeholder">
                          <el-icon size="48" color="#909399"><TrendCharts /></el-icon>
                          <p>优化前后对比图表</p>
                        </div>
                      </div>
                    </el-card>
                  </el-col>
                  <el-col :span="12">
                    <el-card title="成本效益分析">
                      <div class="cost-benefit-chart">
                        <div class="chart-placeholder">
                          <el-icon size="48" color="#909399"><DataAnalysis /></el-icon>
                          <p>成本效益分析图表</p>
                        </div>
                      </div>
                    </el-card>
                  </el-col>
                </el-row>
              </div>
            </el-tab-pane>
            <el-tab-pane label="相关文档" name="documents">
              <div class="documents-content">
                <el-table :data="currentOptimization.documents" stripe>
                  <el-table-column prop="name" label="文档名称" />
                  <el-table-column prop="type" label="文档类型" />
                  <el-table-column prop="size" label="文件大小" />
                  <el-table-column prop="uploadTime" label="上传时间" />
                  <el-table-column label="操作" width="150">
                    <template #default="{ row }">
                      <el-button type="text" size="small" @click="handleDownloadDocument(row)">
                        下载
                      </el-button>
                      <el-button type="text" size="small" @click="handlePreviewDocument(row)">
                        预览
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Refresh,
  DataAnalysis,
  UploadFilled,
  TrendCharts
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const drawerVisible = ref(false)
const dialogTitle = ref('新建优化方案')
const currentOptimization = ref(null)
const selectedOptimizations = ref([])
const activeTab = ref('progress')
const optimizationFormRef = ref()
const fileList = ref([])
const draggedItem = ref(null)

// 优化统计数据
const optimizationStats = ref([
  {
    label: '优化项目',
    value: '68',
    icon: DataAnalysis,
    color: '#409EFF'
  },
  {
    label: '实施中',
    value: '23',
    icon: Timer,
    color: '#E6A23C'
  },
  {
    label: '已完成',
    value: '35',
    icon: Check,
    color: '#67C23A'
  },
  {
    label: '平均改善',
    value: '15.8%',
    icon: TrendCharts,
    color: '#909399'
  }
])

// 看板阶段
const optimizationStages = ref([
  {
    key: 'pending',
    title: '待分析',
    type: 'info',
    count: 0
  },
  {
    key: 'analyzing',
    title: '分析中',
    type: 'warning',
    count: 0
  },
  {
    key: 'implementing',
    title: '实施中',
    type: 'primary',
    count: 0
  },
  {
    key: 'completed',
    title: '已完成',
    type: 'success',
    count: 0
  }
])

// 搜索表单
const searchForm = reactive({
  optimizationCode: '',
  title: '',
  processId: '',
  optimizationType: '',
  status: ''
})

// 优化表单
const optimizationForm = reactive({
  optimizationCode: '',
  title: '',
  processId: '',
  optimizationType: '',
  problemDescription: '',
  solution: '',
  currentValue: '',
  targetValue: '',
  priority: '',
  assignee: '',
  dueDate: '',
  requiredResources: []
})

// 表单验证规则
const optimizationRules = {
  title: [
    { required: true, message: '请输入优化标题', trigger: 'blur' }
  ],
  processId: [
    { required: true, message: '请选择工艺', trigger: 'change' }
  ],
  optimizationType: [
    { required: true, message: '请选择优化类型', trigger: 'change' }
  ],
  currentValue: [
    { required: true, message: '请输入当前值', trigger: 'blur' }
  ],
  targetValue: [
    { required: true, message: '请输入目标值', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  assignee: [
    { required: true, message: '请选择负责人', trigger: 'change' }
  ],
  dueDate: [
    { required: true, message: '请选择截止日期', trigger: 'change' }
  ]
}

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 优化列表数据
const optimizationList = ref([
  {
    id: 1,
    optimizationCode: 'OPT001',
    title: '机械臂装配时间优化',
    processName: '机械臂装配工艺',
    processId: 1,
    optimizationType: 'time',
    status: 'implementing',
    priority: '高',
    currentValue: 120,
    targetValue: 90,
    improvement: 25,
    assignee: '张工',
    dueDate: '2024-04-15',
    problemDescription: '当前装配周期时间较长，影响生产效率',
    solution: '优化装配流程，改进工装夹具，培训操作人员',
    documents: [
      {
        name: '优化方案.pdf',
        type: 'PDF',
        size: '1.5MB',
        uploadTime: '2024-03-15'
      }
    ],
    progressSteps: 1
  },
  {
    id: 2,
    optimizationCode: 'OPT002',
    title: '焊接质量提升',
    processName: 'PCB焊接工艺',
    processId: 2,
    optimizationType: 'quality',
    status: 'analyzing',
    priority: '中',
    currentValue: 92,
    targetValue: 98,
    improvement: 6.5,
    assignee: '李工',
    dueDate: '2024-04-20',
    problemDescription: '当前焊接良品率偏低，需要提升质量',
    solution: '调整焊接温度曲线，优化锡膏配比，改进设备参数',
    progressSteps: 0
  },
  {
    id: 3,
    optimizationCode: 'OPT003',
    title: '注塑成本控制',
    processName: '塑料注塑工艺',
    processId: 3,
    optimizationType: 'cost',
    status: 'completed',
    priority: '高',
    currentValue: 5.8,
    targetValue: 4.5,
    improvement: 22.4,
    assignee: '王工',
    dueDate: '2024-03-30',
    problemDescription: '注塑成本较高，需要降低材料消耗',
    solution: '优化模具设计，改进工艺参数，回收利用废料',
    progressSteps: 4
  }
])

// 工艺列表
const processList = ref([
  { id: 1, name: '机械臂装配工艺' },
  { id: 2, name: 'PCB焊接工艺' },
  { id: 3, name: '塑料注塑工艺' }
])

// 用户列表
const userList = ref([
  { id: 1, name: '张工' },
  { id: 2, name: '李工' },
  { id: 3, name: '王工' },
  { id: 4, name: '赵工' }
])

// 资源列表
const resourceList = ref([
  { id: 1, name: '技术人员' },
  { id: 2, name: '设备改造' },
  { id: 3, name: '材料采购' },
  { id: 4, name: '培训预算' }
])

// 优化步骤
const optimizationSteps = ref([
  {
    title: '问题分析',
    description: '分析当前工艺存在的问题和瓶颈',
    status: 'finish'
  },
  {
    title: '方案设计',
    description: '制定详细的优化方案和实施计划',
    status: 'process'
  },
  {
    title: '资源准备',
    description: '准备所需的人员、设备、材料等资源',
    status: 'wait'
  },
  {
    title: '方案实施',
    description: '按照计划实施优化方案',
    status: 'wait'
  },
  {
    title: '效果验证',
    description: '验证优化效果，确认改善指标',
    status: 'wait'
  }
])

// 计算属性
const getStageItems = (stageKey) => {
  return optimizationList.value.filter(item => item.status === stageKey)
}

// 更新看板计数
const updateKanbanCounts = () => {
  optimizationStages.value.forEach(stage => {
    stage.count = optimizationList.value.filter(item => item.status === stage.key).length
  })
}

// 类型映射函数
const getOptimizationTypeColor = (type) => {
  const colorMap = {
    time: 'primary',
    quality: 'success',
    cost: 'warning',
    efficiency: 'info',
    safety: 'danger'
  }
  return colorMap[type] || 'info'
}

const getOptimizationTypeText = (type) => {
  const textMap = {
    time: '时间优化',
    quality: '质量优化',
    cost: '成本优化',
    efficiency: '效率优化',
    safety: '安全优化'
  }
  return textMap[type] || type
}

const getStatusType = (status) => {
  const typeMap = {
    pending: 'info',
    analyzing: 'warning',
    implementing: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    pending: '待分析',
    analyzing: '分析中',
    implementing: '实施中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return textMap[status] || status
}

const getPriorityType = (priority) => {
  const typeMap = {
    '高': 'danger',
    '中': 'warning',
    '低': 'info'
  }
  return typeMap[priority] || 'info'
}

const getUnitByType = (type) => {
  const unitMap = {
    time: '秒',
    quality: '%',
    cost: '元',
    efficiency: '%',
    safety: '分'
  }
  return unitMap[type] || ''
}

const getImprovementClass = (improvement) => {
  if (improvement > 0) return 'improvement-positive'
  if (improvement < 0) return 'improvement-negative'
  return 'improvement-neutral'
}

const calculateImprovement = () => {
  const current = parseFloat(optimizationForm.currentValue) || 0
  const target = parseFloat(optimizationForm.targetValue) || 0
  
  if (current === 0) return 0
  
  const improvement = ((target - current) / current * 100).toFixed(1)
  return improvement
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 事件处理函数
const handleCreateOptimization = () => {
  dialogTitle.value = '新建优化方案'
  optimizationForm.optimizationCode = 'OPT' + String(Date.now()).slice(-3)
  dialogVisible.value = true
}

const handleAnalyze = () => {
  ElMessage.info('工艺分析功能开发中...')
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
    searchForm[key] = ''
  })
  ElMessage.success('重置成功')
}

// 拖拽相关函数
const handleDragStart = (event, item) => {
  draggedItem.value = item
  event.dataTransfer.effectAllowed = 'move'
}

const handleDrop = (event, targetStage) => {
  event.preventDefault()
  if (draggedItem.value) {
    const item = optimizationList.value.find(opt => opt.id === draggedItem.value.id)
    if (item) {
      item.status = targetStage
      ElMessage.success('状态更新成功')
    }
    draggedItem.value = null
  }
}

const handleSelectionChange = (selection) => {
  selectedOptimizations.value = selection
}

const handleViewItem = (item) => {
  currentOptimization.value = item
  drawerVisible.value = true
}

const handleView = (row) => {
  currentOptimization.value = row
  drawerVisible.value = true
}

const handleImplement = (row) => {
  row.status = 'implementing'
  ElMessage.success('已开始实施优化方案')
  updateKanbanCounts()
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑优化方案'
  Object.keys(optimizationForm).forEach(key => {
    optimizationForm[key] = row[key] || []
  })
  dialogVisible.value = true
}

const handleAnalyze = (row) => {
  row.status = 'analyzing'
  ElMessage.success('已开始分析优化方案')
  updateKanbanCounts()
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除优化方案"${row.title}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleBatchImplement = () => {
  selectedOptimizations.value.forEach(item => {
    if (item.status === 'analyzing') {
      item.status = 'implementing'
    }
  })
  ElMessage.success('批量实施成功')
  selectedOptimizations.value = []
  updateKanbanCounts()
}

const handleSubmit = () => {
  optimizationFormRef.value.validate((valid) => {
    if (valid) {
      dialogVisible.value = false
      ElMessage.success('保存成功')
      // 重置表单
      Object.keys(optimizationForm).forEach(key => {
        if (Array.isArray(optimizationForm[key])) {
          optimizationForm[key] = []
        } else {
          optimizationForm[key] = ''
        }
      })
    }
  })
}

const handleDialogClose = () => {
  optimizationFormRef.value?.resetFields()
  // 重置表单
  Object.keys(optimizationForm).forEach(key => {
    if (Array.isArray(optimizationForm[key])) {
      optimizationForm[key] = []
    } else {
      optimizationForm[key] = ''
    }
  })
  fileList.value = []
}

const handleFileChange = (file, fileList) => {
  console.log('文件变化:', file, fileList)
}

const handleDownloadDocument = (document) => {
  ElMessage.success(`开始下载: ${document.name}`)
}

const handlePreviewDocument = (document) => {
  ElMessage.success(`开始预览: ${document.name}`)
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
}

onMounted(() => {
  pagination.total = optimizationList.value.length
  updateKanbanCounts()
})
</script>

<style scoped>
.process-optimization {
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

.kanban-container {
  margin-bottom: 20px;
}

.kanban-column {
  min-height: 400px;
}

.kanban-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.kanban-items {
  min-height: 350px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.kanban-item {
  background-color: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.kanban-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-title {
  font-weight: bold;
  color: #1d2129;
  flex: 1;
  margin-right: 8px;
}

.item-content {
  margin-bottom: 8px;
}

.item-description {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
  margin: 0 0 8px 0;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.item-improvement {
  color: #67c23a;
  font-weight: bold;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
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

.optimization-detail {
  padding: 20px;
}

.detail-tabs {
  margin-top: 30px;
}

.progress-content {
  padding: 20px 0;
}

.analysis-content {
  padding: 20px 0;
}

.documents-content {
  padding: 20px 0;
}

.comparison-chart,
.cost-benefit-chart {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #909399;
}

.chart-placeholder p {
  margin-top: 10px;
}

.improvement-positive {
  color: #67c23a;
  font-weight: bold;
}

.improvement-negative {
  color: #f56c6c;
  font-weight: bold;
}

.improvement-neutral {
  color: #909399;
  font-weight: bold;
}

.upload-demo {
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
  
  .kanban-container .el-row {
    flex-direction: column;
  }
  
  .kanban-container .el-col {
    margin-bottom: 15px;
  }
  
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>