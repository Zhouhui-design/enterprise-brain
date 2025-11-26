<template>
  <div class="standard-operation">
    <div class="page-header">
      <h1>标准作业</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateStandard">
          <el-icon><Plus /></el-icon>
          新建标准
        </el-button>
        <el-button type="success" @click="handleImportStandard">
          <el-icon><Upload /></el-icon>
          导入标准
        </el-button>
        <el-button type="warning" @click="handleApproval">
          <el-icon><Check /></el-icon>
          审批管理
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 标准作业统计卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(stat, index) in standardStats" :key="index">
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

    <!-- 标准作业搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="标准编号">
          <el-input v-model="searchForm.standardCode" placeholder="请输入标准编号" clearable />
        </el-form-item>
        <el-form-item label="标准名称">
          <el-input v-model="searchForm.standardName" placeholder="请输入标准名称" clearable />
        </el-form-item>
        <el-form-item label="作业类型">
          <el-select v-model="searchForm.operationType" placeholder="请选择作业类型" clearable>
            <el-option label="装配作业" value="assembly" />
            <el-option label="加工作业" value="machining" />
            <el-option label="检验作业" value="inspection" />
            <el-option label="包装作业" value="packaging" />
            <el-option label="维修作业" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item label="标准状态">
          <el-select v-model="searchForm.status" placeholder="请选择标准状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="审核中" value="reviewing" />
            <el-option label="已批准" value="approved" />
            <el-option label="已发布" value="published" />
            <el-option label="已失效" value="obsolete" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建部门">
          <el-select v-model="searchForm.department" placeholder="请选择创建部门" clearable>
            <el-option label="生产部" value="production" />
            <el-option label="质量部" value="quality" />
            <el-option label="工程部" value="engineering" />
            <el-option label="设备部" value="equipment" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 标准作业列表 -->
    <el-card class="table-card">
      <div class="table-header">
        <div class="table-title">
          <span>标准作业列表</span>
          <el-tag v-if="selectedStandards.length > 0" type="info">
            已选择 {{ selectedStandards.length }} 项
          </el-tag>
        </div>
        <div class="table-actions" v-if="selectedStandards.length > 0">
          <el-button type="success" size="small" @click="handleBatchPublish">
            批量发布
          </el-button>
          <el-button type="danger" size="small" @click="handleBatchDelete">
            批量删除
          </el-button>
        </div>
      </div>

      <el-table
        :data="standardList"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="standardCode" label="标准编号" width="120" />
        <el-table-column prop="standardName" label="标准名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="operationType" label="作业类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getOperationTypeColor(row.operationType)">
              {{ getOperationTypeText(row.operationType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="标准状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="department" label="创建部门" width="100" />
        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column prop="approvalStatus" label="审批状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getApprovalStatusType(row.approvalStatus)">
              {{ getApprovalStatusText(row.approvalStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="effectiveDate" label="生效日期" width="110" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button type="success" size="small" @click="handleStandardDetail(row)">详情</el-button>
            <el-button type="warning" size="small" @click="handleEdit(row)" v-if="row.status !== 'published'">编辑</el-button>
            <el-button type="info" size="small" @click="handleVersion(row)">版本</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)" v-if="row.status !== 'published'">删除</el-button>
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

    <!-- 新建/编辑标准作业对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="1000px"
      @close="handleDialogClose"
    >
      <el-form
        ref="standardFormRef"
        :model="standardForm"
        :rules="standardRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标准编号" prop="standardCode">
              <el-input v-model="standardForm.standardCode" placeholder="自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标准名称" prop="standardName">
              <el-input v-model="standardForm.standardName" placeholder="请输入标准名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="作业类型" prop="operationType">
              <el-select v-model="standardForm.operationType" placeholder="请选择作业类型">
                <el-option label="装配作业" value="assembly" />
                <el-option label="加工作业" value="machining" />
                <el-option label="检验作业" value="inspection" />
                <el-option label="包装作业" value="packaging" />
                <el-option label="维修作业" value="maintenance" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="适用产品">
              <el-select v-model="standardForm.applicableProducts" multiple placeholder="请选择适用产品">
                <el-option
                  v-for="product in productList"
                  :key="product.id"
                  :label="product.name"
                  :value="product.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="作业范围">
          <el-input
            v-model="standardForm.scope"
            type="textarea"
            :rows="2"
            placeholder="请描述适用范围"
          />
        </el-form-item>
        <el-form-item label="作业目的">
          <el-input
            v-model="standardForm.purpose"
            type="textarea"
            :rows="2"
            placeholder="请描述作业目的"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="预计时间" prop="estimatedTime">
              <el-input-number
                v-model="standardForm.estimatedTime"
                :min="0"
                :precision="2"
                placeholder="请输入预计时间"
                style="width: 100%"
              >
                <template #append>分钟</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="难度等级" prop="difficultyLevel">
              <el-select v-model="standardForm.difficultyLevel" placeholder="请选择难度等级">
                <el-option label="简单" value="easy" />
                <el-option label="中等" value="medium" />
                <el-option label="困难" value="hard" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="创建部门" prop="department">
              <el-select v-model="standardForm.department" placeholder="请选择创建部门">
                <el-option label="生产部" value="production" />
                <el-option label="质量部" value="quality" />
                <el-option label="工程部" value="engineering" />
                <el-option label="设备部" value="equipment" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 作业步骤 -->
        <el-form-item label="作业步骤">
          <div class="operation-steps">
            <el-button type="primary" size="small" @click="handleAddStep">
              <el-icon><Plus /></el-icon>
              添加步骤
            </el-button>
            <el-table :data="standardForm.steps" size="small" style="margin-top: 10px;">
              <el-table-column type="index" label="序号" width="80" />
              <el-table-column prop="stepName" label="步骤名称" width="200">
                <template #default="{ row, $index }">
                  <el-input v-model="row.stepName" placeholder="请输入步骤名称" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="description" label="操作说明" min-width="250">
                <template #default="{ row, $index }">
                  <el-input v-model="row.description" type="textarea" :rows="2" placeholder="请输入操作说明" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="timeLimit" label="时间限制" width="120">
                <template #default="{ row, $index }">
                  <el-input-number v-model="row.timeLimit" :min="0" size="small" style="width: 100%">
                    <template #append>分钟</template>
                  </el-input-number>
                </template>
              </el-table-column>
              <el-table-column prop="keyPoints" label="关键要点" width="150">
                <template #default="{ row, $index }">
                  <el-input v-model="row.keyPoints" placeholder="关键要点" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ row, $index }">
                  <el-button type="danger" size="small" @click="handleDeleteStep($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>

        <!-- 安全要求 -->
        <el-form-item label="安全要求">
          <div class="safety-requirements">
            <el-button type="warning" size="small" @click="handleAddSafety">
              <el-icon><Plus /></el-icon>
              添加安全要求
            </el-button>
            <el-table :data="standardForm.safetyRequirements" size="small" style="margin-top: 10px;">
              <el-table-column type="index" label="序号" width="80" />
              <el-table-column prop="requirement" label="安全要求" min-width="200">
                <template #default="{ row, $index }">
                  <el-input v-model="row.requirement" placeholder="请输入安全要求" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="riskLevel" label="风险等级" width="120">
                <template #default="{ row, $index }">
                  <el-select v-model="row.riskLevel" size="small">
                    <el-option label="低" value="low" />
                    <el-option label="中" value="medium" />
                    <el-option label="高" value="high" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ row, $index }">
                  <el-button type="danger" size="small" @click="handleDeleteSafety($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>

        <!-- 质量要求 -->
        <el-form-item label="质量要求">
          <el-input
            v-model="standardForm.qualityRequirements"
            type="textarea"
            :rows="3"
            placeholder="请输入质量要求"
          />
        </el-form-item>

        <!-- 所需工具和设备 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所需工具">
              <el-select
                v-model="standardForm.requiredTools"
                multiple
                placeholder="请选择所需工具"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="tool in toolList"
                  :key="tool.id"
                  :label="tool.name"
                  :value="tool.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所需设备">
              <el-select
                v-model="standardForm.requiredEquipment"
                multiple
                placeholder="请选择所需设备"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="equipment in equipmentList"
                  :key="equipment.id"
                  :label="equipment.name"
                  :value="equipment.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 相关文档 -->
        <el-form-item label="相关文档">
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
                支持 doc, docx, pdf, jpg, png 等格式，单个文件不超过 50MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitDraft">保存草稿</el-button>
          <el-button type="success" @click="handleSubmit">提交审批</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 标准作业详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="标准作业详情" size="70%">
      <div v-if="currentStandard" class="standard-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="标准编号">{{ currentStandard.standardCode }}</el-descriptions-item>
          <el-descriptions-item label="标准名称">{{ currentStandard.standardName }}</el-descriptions-item>
          <el-descriptions-item label="作业类型">
            <el-tag :type="getOperationTypeColor(currentStandard.operationType)">
              {{ getOperationTypeText(currentStandard.operationType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="标准状态">
            <el-tag :type="getStatusType(currentStandard.status)">
              {{ getStatusText(currentStandard.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建部门">{{ currentStandard.department }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ currentStandard.creator }}</el-descriptions-item>
          <el-descriptions-item label="版本">v{{ currentStandard.version }}</el-descriptions-item>
          <el-descriptions-item label="审批状态">
            <el-tag :type="getApprovalStatusType(currentStandard.approvalStatus)">
              {{ getApprovalStatusText(currentStandard.approvalStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预计时间">{{ currentStandard.estimatedTime }} 分钟</el-descriptions-item>
          <el-descriptions-item label="难度等级">
            <el-tag :type="getDifficultyTypeColor(currentStandard.difficultyLevel)">
              {{ getDifficultyText(currentStandard.difficultyLevel) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="生效日期">{{ currentStandard.effectiveDate }}</el-descriptions-item>
          <el-descriptions-item label="失效日期">{{ currentStandard.expiryDate || '长期有效' }}</el-descriptions-item>
          <el-descriptions-item label="作业范围" span="2">{{ currentStandard.scope }}</el-descriptions-item>
          <el-descriptions-item label="作业目的" span="2">{{ currentStandard.purpose }}</el-descriptions-item>
          <el-descriptions-item label="质量要求" span="2">{{ currentStandard.qualityRequirements }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-tabs">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="作业步骤" name="steps">
              <div class="steps-content">
                <el-steps direction="vertical" :active="currentStandard.steps?.length">
                  <el-step
                    v-for="(step, index) in currentStandard.steps"
                    :key="index"
                    :title="`步骤 ${index + 1}: ${step.stepName}`"
                    :description="step.description"
                  >
                    <template #icon>
                      <div class="step-icon">{{ index + 1 }}</div>
                    </template>
                    <div class="step-details">
                      <p><strong>时间限制:</strong> {{ step.timeLimit }} 分钟</p>
                      <p><strong>关键要点:</strong> {{ step.keyPoints }}</p>
                    </div>
                  </el-step>
                </el-steps>
              </div>
            </el-tab-pane>
            <el-tab-pane label="安全要求" name="safety">
              <div class="safety-content">
                <el-alert
                  v-for="(safety, index) in currentStandard.safetyRequirements"
                  :key="index"
                  :title="safety.requirement"
                  :type="getRiskTypeColor(safety.riskLevel)"
                  :closable="false"
                  style="margin-bottom: 10px;"
                >
                  <template #default>
                    <p><strong>风险等级:</strong> 
                      <el-tag :type="getRiskTypeColor(safety.riskLevel)" size="small">
                        {{ getRiskText(safety.riskLevel) }}
                      </el-tag>
                    </p>
                  </template>
                </el-alert>
              </div>
            </el-tab-pane>
            <el-tab-pane label="工具设备" name="tools">
              <div class="tools-content">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-card title="所需工具">
                      <el-tag
                        v-for="tool in currentStandard.requiredToolsList"
                        :key="tool.id"
                        style="margin-right: 8px; margin-bottom: 8px;"
                      >
                        {{ tool.name }}
                      </el-tag>
                    </el-card>
                  </el-col>
                  <el-col :span="12">
                    <el-card title="所需设备">
                      <el-tag
                        v-for="equipment in currentStandard.requiredEquipmentList"
                        :key="equipment.id"
                        type="success"
                        style="margin-right: 8px; margin-bottom: 8px;"
                      >
                        {{ equipment.name }}
                      </el-tag>
                    </el-card>
                  </el-col>
                </el-row>
              </div>
            </el-tab-pane>
            <el-tab-pane label="相关文档" name="documents">
              <div class="documents-content">
                <el-table :data="currentStandard.documents" stripe>
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
            <el-tab-pane label="审批记录" name="approval">
              <div class="approval-content">
                <el-timeline>
                  <el-timeline-item
                    v-for="(record, index) in currentStandard.approvalRecords"
                    :key="index"
                    :timestamp="record.timestamp"
                    :type="getApprovalTypeColor(record.action)"
                  >
                    <el-card>
                      <h4>{{ record.approver }} - {{ getApprovalActionText(record.action) }}</h4>
                      <p>{{ record.comment }}</p>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Upload, Check, UploadFilled } from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const drawerVisible = ref(false)
const dialogTitle = ref('新建标准作业')
const currentStandard = ref(null)
const selectedStandards = ref([])
const activeTab = ref('steps')
const standardFormRef = ref()
const fileList = ref([])

// 标准作业统计数据
const standardStats = ref([
  {
    label: '总标准数',
    value: '234',
    icon: Document,
    color: '#409EFF'
  },
  {
    label: '已发布',
    value: '156',
    icon: Check,
    color: '#67C23A'
  },
  {
    label: '审核中',
    value: '32',
    icon: Timer,
    color: '#E6A23C'
  },
  {
    label: '待更新',
    value: '18',
    icon: Warning,
    color: '#F56C6C'
  }
])

// 搜索表单
const searchForm = reactive({
  standardCode: '',
  standardName: '',
  operationType: '',
  status: '',
  department: ''
})

// 标准作业表单
const standardForm = reactive({
  standardCode: '',
  standardName: '',
  operationType: '',
  scope: '',
  purpose: '',
  estimatedTime: 0,
  difficultyLevel: '',
  department: '',
  applicableProducts: [],
  steps: [],
  safetyRequirements: [],
  qualityRequirements: '',
  requiredTools: [],
  requiredEquipment: []
})

// 表单验证规则
const standardRules = {
  standardName: [
    { required: true, message: '请输入标准名称', trigger: 'blur' }
  ],
  operationType: [
    { required: true, message: '请选择作业类型', trigger: 'change' }
  ],
  estimatedTime: [
    { required: true, message: '请输入预计时间', trigger: 'blur' }
  ],
  difficultyLevel: [
    { required: true, message: '请选择难度等级', trigger: 'change' }
  ],
  department: [
    { required: true, message: '请选择创建部门', trigger: 'change' }
  ]
}

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 标准作业列表数据
const standardList = ref([
  {
    id: 1,
    standardCode: 'SOP001',
    standardName: '机械臂装配标准作业',
    operationType: 'assembly',
    status: 'published',
    version: '2.1',
    department: 'production',
    creator: '张工',
    approvalStatus: 'approved',
    effectiveDate: '2024-01-15',
    expiryDate: '2025-01-14',
    estimatedTime: 45,
    difficultyLevel: 'medium',
    scope: '适用于工业机器人机械臂的装配作业',
    purpose: '确保装配质量，提高装配效率，保证操作安全',
    steps: [
      {
        stepName: '准备工作',
        description: '检查装配工具和零部件，确保完整性和清洁度',
        timeLimit: 5,
        keyPoints: '检查工具齐全性，确认零部件规格'
      },
      {
        stepName: '基座安装',
        description: '将机械臂基座固定在工作台上，确保水平度和稳定性',
        timeLimit: 10,
        keyPoints: '水平度误差不超过0.5mm，紧固扭矩符合要求'
      },
      {
        stepName: '臂杆组装',
        description: '按照装配顺序组装各段臂杆，确保连接牢固',
        timeLimit: 20,
        keyPoints: '连接间隙均匀，转动灵活无异常'
      },
      {
        stepName: '电气连接',
        description: '连接电机、传感器和控制系统电缆',
        timeLimit: 8,
        keyPoints: '接线正确，绝缘良好，线束整理整齐'
      },
      {
        stepName: '功能测试',
        description: '进行机械臂功能测试，验证各项性能指标',
        timeLimit: 2,
        keyPoints: '运动范围准确，负载能力达标'
      }
    ],
    safetyRequirements: [
      {
        requirement: '佩戴防护手套和安全帽',
        riskLevel: 'medium'
      },
      {
        requirement: '使用合适的起重设备',
        riskLevel: 'high'
      },
      {
        requirement: '确保工作区域清洁干燥',
        riskLevel: 'low'
      }
    ],
    qualityRequirements: '装配精度符合技术要求，运动部件转动灵活，电气连接可靠，整体外观良好',
    requiredToolsList: [
      { id: 1, name: '扭矩扳手' },
      { id: 2, name: '水平仪' },
      { id: 3, name: '压线钳' }
    ],
    requiredEquipmentList: [
      { id: 1, name: '工作台' },
      { id: 2, name: '起重设备' }
    ],
    documents: [
      {
        name: '装配作业指导书.pdf',
        type: 'PDF',
        size: '2.1MB',
        uploadTime: '2024-01-15'
      },
      {
        name: '安全操作手册.docx',
        type: 'DOCX',
        size: '1.5MB',
        uploadTime: '2024-01-15'
      }
    ],
    approvalRecords: [
      {
        approver: '李主管',
        action: 'submit',
        comment: '提交审批',
        timestamp: '2024-01-10 09:00:00'
      },
      {
        approver: '王经理',
        action: 'approve',
        comment: '审核通过，同意发布',
        timestamp: '2024-01-12 14:30:00'
      }
    ]
  },
  {
    id: 2,
    standardCode: 'SOP002',
    standardName: 'PCB焊接标准作业',
    operationType: 'assembly',
    status: 'reviewing',
    version: '1.3',
    department: 'production',
    creator: '李工',
    approvalStatus: 'reviewing',
    effectiveDate: '2024-03-01',
    estimatedTime: 25,
    difficultyLevel: 'easy'
  },
  {
    id: 3,
    standardCode: 'SOP003',
    standardName: '产品检验标准作业',
    operationType: 'inspection',
    status: 'published',
    version: '3.0',
    department: 'quality',
    creator: '王工',
    approvalStatus: 'approved',
    effectiveDate: '2024-02-01',
    estimatedTime: 15,
    difficultyLevel: 'easy'
  }
])

// 产品列表
const productList = ref([
  { id: 1, name: '机械臂A型' },
  { id: 2, name: '机械臂B型' },
  { id: 3, name: 'PCB控制板' },
  { id: 4, name: '传感器模块' }
])

// 工具列表
const toolList = ref([
  { id: 1, name: '扭矩扳手' },
  { id: 2, name: '水平仪' },
  { id: 3, name: '压线钳' },
  { id: 4, name: '万用表' },
  { id: 5, name: '卡尺' }
])

// 设备列表
const equipmentList = ref([
  { id: 1, name: '工作台' },
  { id: 2, name: '起重设备' },
  { id: 3, name: '回流焊炉' },
  { id: 4, name: '检测设备' }
])

// 类型映射函数
const getOperationTypeColor = (type) => {
  const colorMap = {
    assembly: 'primary',
    machining: 'success',
    inspection: 'warning',
    packaging: 'info',
    maintenance: 'danger'
  }
  return colorMap[type] || 'info'
}

const getOperationTypeText = (type) => {
  const textMap = {
    assembly: '装配作业',
    machining: '加工作业',
    inspection: '检验作业',
    packaging: '包装作业',
    maintenance: '维修作业'
  }
  return textMap[type] || type
}

const getStatusType = (status) => {
  const typeMap = {
    draft: 'info',
    reviewing: 'warning',
    approved: 'success',
    published: 'primary',
    obsolete: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    draft: '草稿',
    reviewing: '审核中',
    approved: '已批准',
    published: '已发布',
    obsolete: '已失效'
  }
  return textMap[status] || status
}

const getApprovalStatusType = (status) => {
  const typeMap = {
    pending: 'info',
    reviewing: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || 'info'
}

const getApprovalStatusText = (status) => {
  const textMap = {
    pending: '待审批',
    reviewing: '审核中',
    approved: '已批准',
    rejected: '已拒绝'
  }
  return textMap[status] || status
}

const getDifficultyTypeColor = (level) => {
  const colorMap = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger'
  }
  return colorMap[level] || 'info'
}

const getDifficultyText = (level) => {
  const textMap = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return textMap[level] || level
}

const getRiskTypeColor = (level) => {
  const colorMap = {
    low: 'success',
    medium: 'warning',
    high: 'danger'
  }
  return colorMap[level] || 'info'
}

const getRiskText = (level) => {
  const textMap = {
    low: '低风险',
    medium: '中风险',
    high: '高风险'
  }
  return textMap[level] || level
}

const getApprovalTypeColor = (action) => {
  const colorMap = {
    submit: 'primary',
    review: 'warning',
    approve: 'success',
    reject: 'danger'
  }
  return colorMap[action] || 'info'
}

const getApprovalActionText = (action) => {
  const textMap = {
    submit: '提交审批',
    review: '审核中',
    approve: '批准',
    reject: '拒绝'
  }
  return textMap[action] || action
}

// 事件处理函数
const handleCreateStandard = () => {
  dialogTitle.value = '新建标准作业'
  standardForm.standardCode = 'SOP' + String(Date.now()).slice(-3)
  standardForm.steps = []
  standardForm.safetyRequirements = []
  dialogVisible.value = true
}

const handleImportStandard = () => {
  ElMessage.info('导入标准功能开发中...')
}

const handleApproval = () => {
  ElMessage.info('审批管理功能开发中...')
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

const handleSelectionChange = (selection) => {
  selectedStandards.value = selection
}

const handleView = (row) => {
  currentStandard.value = row
  drawerVisible.value = true
}

const handleStandardDetail = (row) => {
  currentStandard.value = row
  activeTab.value = 'steps'
  drawerVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑标准作业'
  Object.keys(standardForm).forEach(key => {
    standardForm[key] = row[key] || []
  })
  dialogVisible.value = true
}

const handleVersion = (row) => {
  ElMessage.info(`查看标准 ${row.standardName} 的版本历史`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除标准作业"${row.standardName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleBatchPublish = () => {
  ElMessageBox.confirm(`确定发布选中的 ${selectedStandards.value.length} 个标准吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('批量发布成功')
    selectedStandards.value = []
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定删除选中的 ${selectedStandards.value.length} 个标准吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('批量删除成功')
    selectedStandards.value = []
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

const handleAddStep = () => {
  standardForm.steps.push({
    stepName: '',
    description: '',
    timeLimit: 0,
    keyPoints: ''
  })
}

const handleDeleteStep = (index) => {
  standardForm.steps.splice(index, 1)
}

const handleAddSafety = () => {
  standardForm.safetyRequirements.push({
    requirement: '',
    riskLevel: 'medium'
  })
}

const handleDeleteSafety = (index) => {
  standardForm.safetyRequirements.splice(index, 1)
}

const handleSubmitDraft = () => {
  standardFormRef.value.validate((valid) => {
    if (valid) {
      dialogVisible.value = false
      ElMessage.success('草稿保存成功')
      // 重置表单
      Object.keys(standardForm).forEach(key => {
        if (Array.isArray(standardForm[key])) {
          standardForm[key] = []
        } else {
          standardForm[key] = ''
        }
      })
    }
  })
}

const handleSubmit = () => {
  standardFormRef.value.validate((valid) => {
    if (valid) {
      dialogVisible.value = false
      ElMessage.success('提交审批成功')
      // 重置表单
      Object.keys(standardForm).forEach(key => {
        if (Array.isArray(standardForm[key])) {
          standardForm[key] = []
        } else {
          standardForm[key] = ''
        }
      })
    }
  })
}

const handleDialogClose = () => {
  standardFormRef.value?.resetFields()
  // 重置表单
  Object.keys(standardForm).forEach(key => {
    if (Array.isArray(standardForm[key])) {
      standardForm[key] = []
    } else {
      standardForm[key] = ''
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
  pagination.total = standardList.value.length
})
</script>

<style scoped>
.standard-operation {
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

.operation-steps,
.safety-requirements {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
}

.standard-detail {
  padding: 20px;
}

.detail-tabs {
  margin-top: 30px;
}

.steps-content {
  padding: 20px 0;
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #409EFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.step-details {
  margin-top: 10px;
  padding-left: 20px;
  border-left: 2px solid #e4e7ed;
}

.step-details p {
  margin: 5px 0;
  color: #606266;
}

.safety-content {
  padding: 20px 0;
}

.tools-content,
.documents-content,
.approval-content {
  padding: 20px 0;
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
  
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>