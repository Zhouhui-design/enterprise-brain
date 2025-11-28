<template>
  <div class="tooling-design">
    <div class="page-header">
      <h1>工装设计</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateTooling">
          <el-icon><Plus /></el-icon>
          新建工装
        </el-button>
        <el-button type="success" @click="handleImportDesign">
          <el-icon><Upload /></el-icon>
          导入设计
        </el-button>
        <el-button type="warning" @click="handleApproval">
          <el-icon><Check /></el-icon>
          设计审批
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 工装设计统计卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(stat, index) in toolingStats" :key="index">
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

    <!-- 工装搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="工装编号">
          <el-input v-model="searchForm.toolingCode" placeholder="请输入工装编号" clearable />
        </el-form-item>
        <el-form-item label="工装名称">
          <el-input v-model="searchForm.toolingName" placeholder="请输入工装名称" clearable />
        </el-form-item>
        <el-form-item label="工装类型">
          <el-select v-model="searchForm.toolingType" placeholder="请选择工装类型" clearable>
            <el-option label="夹具" value="fixture" />
            <el-option label="模具" value="mold" />
            <el-option label="刀具" value="cutter" />
            <el-option label="量具" value="gauge" />
            <el-option label="辅助工具" value="auxiliary" />
          </el-select>
        </el-form-item>
        <el-form-item label="设计状态">
          <el-select v-model="searchForm.status" placeholder="请选择设计状态" clearable>
            <el-option label="设计中" value="designing" />
            <el-option label="审核中" value="reviewing" />
            <el-option label="已批准" value="approved" />
            <el-option label="制造中" value="manufacturing" />
            <el-option label="已交付" value="delivered" />
          </el-select>
        </el-form-item>
        <el-form-item label="设计师">
          <el-input v-model="searchForm.designer" placeholder="请输入设计师" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 工装列表 -->
    <el-card class="table-card">
      <div class="table-header">
        <div class="table-title">
          <span>工装设计列表</span>
          <el-tag v-if="selectedToolings.length > 0" type="info">
            已选择 {{ selectedToolings.length }} 项
          </el-tag>
        </div>
        <div class="table-actions" v-if="selectedToolings.length > 0">
          <el-button type="success" size="small" @click="handleBatchManufacture">
            批量制造
          </el-button>
        </div>
      </div>

      <el-table
        :data="toolingList"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="toolingCode" label="工装编号" width="120" />
        <el-table-column prop="toolingName" label="工装名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="toolingType" label="工装类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getToolingTypeColor(row.toolingType)">
              {{ getToolingTypeText(row.toolingType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="设计状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="designer" label="设计师" width="100" />
        <el-table-column prop="complexity" label="复杂度" width="100">
          <template #default="{ row }">
            <el-rate
              v-model="row.complexity"
              disabled
              show-score
              text-color="#ff9900"
              score-template="{value}"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column prop="estimatedCost" label="预估成本" width="120">
          <template #default="{ row }">
            ￥{{ row.estimatedCost?.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="deliveryDate" label="交付日期" width="110" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button type="success" size="small" @click="handleDesignDetail(row)">详情</el-button>
            <el-button type="warning" size="small" @click="handleEdit(row)" v-if="row.status !== 'manufacturing'">编辑</el-button>
            <el-button type="info" size="small" @click="handleVersion(row)">版本</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)" v-if="row.status !== 'manufacturing'">删除</el-button>
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

    <!-- 新建/编辑工装设计对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="1100px"
      @close="handleDialogClose"
    >
      <el-form
        ref="toolingFormRef"
        :model="toolingForm"
        :rules="toolingRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工装编号" prop="toolingCode">
              <el-input v-model="toolingForm.toolingCode" placeholder="自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工装名称" prop="toolingName">
              <el-input v-model="toolingForm.toolingName" placeholder="请输入工装名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工装类型" prop="toolingType">
              <el-select v-model="toolingForm.toolingType" placeholder="请选择工装类型">
                <el-option label="夹具" value="fixture" />
                <el-option label="模具" value="mold" />
                <el-option label="刀具" value="cutter" />
                <el-option label="量具" value="gauge" />
                <el-option label="辅助工具" value="auxiliary" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="适用工艺">
              <el-select v-model="toolingForm.applicableProcesses" multiple placeholder="请选择适用工艺">
                <el-option
                  v-for="process in processList"
                  :key="process.id"
                  :label="process.name"
                  :value="process.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="设计描述">
          <el-input
            v-model="toolingForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入工装设计描述"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="复杂度" prop="complexity">
              <el-rate
                v-model="toolingForm.complexity"
                :texts="['简单', '中等', '困难', '极难']"
                show-text
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="预估成本" prop="estimatedCost">
              <el-input-number
                v-model="toolingForm.estimatedCost"
                :min="0"
                :precision="2"
                placeholder="请输入预估成本"
                style="width: 100%"
              >
                <template #prepend>￥</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="设计师" prop="designer">
              <el-select v-model="toolingForm.designer" placeholder="请选择设计师" filterable>
                <el-option
                  v-for="designer in designerList"
                  :key="designer.id"
                  :label="designer.name"
                  :value="designer.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设计软件">
              <el-select v-model="toolingForm.designSoftware" placeholder="请选择设计软件">
                <el-option label="AutoCAD" value="autocad" />
                <el-option label="SolidWorks" value="solidworks" />
                <el-option label="UG/NX" value="ugnx" />
                <el-option label="Pro/E" value="proe" />
                <el-option label="CATIA" value="catia" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="制造材料">
              <el-select v-model="toolingForm.material" placeholder="请选择制造材料">
                <el-option label="45号钢" value="steel_45" />
                <el-option label="Cr12MoV" value="cr12mov" />
                <el-option label="SKD11" value="skd11" />
                <el-option label="铝合金" value="aluminum" />
                <el-option label="工程塑料" value="plastic" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 技术参数 -->
        <el-form-item label="技术参数">
          <div class="technical-params">
            <el-button type="primary" size="small" @click="handleAddParam">
              <el-icon><Plus /></el-icon>
              添加参数
            </el-button>
            <el-table :data="toolingForm.technicalParams" size="small" style="margin-top: 10px;">
              <el-table-column prop="paramName" label="参数名称" width="150">
                <template #default="{ row, $index }">
                  <el-input v-model="row.paramName" placeholder="参数名称" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="paramValue" label="参数值" width="150">
                <template #default="{ row, $index }">
                  <el-input v-model="row.paramValue" placeholder="参数值" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="unit" label="单位" width="100">
                <template #default="{ row, $index }">
                  <el-input v-model="row.unit" placeholder="单位" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="tolerance" label="公差" width="120">
                <template #default="{ row, $index }">
                  <el-input v-model="row.tolerance" placeholder="公差" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ row, $index }">
                  <el-button type="danger" size="small" @click="handleDeleteParam($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>

        <!-- 设计要求 -->
        <el-form-item label="设计要求">
          <el-input
            v-model="toolingForm.designRequirements"
            type="textarea"
            :rows="3"
            placeholder="请输入设计要求"
          />
        </el-form-item>

        <!-- 质量标准 -->
        <el-form-item label="质量标准">
          <el-input
            v-model="toolingForm.qualityStandards"
            type="textarea"
            :rows="2"
            placeholder="请输入质量标准"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="交付日期" prop="deliveryDate">
              <el-date-picker
                v-model="toolingForm.deliveryDate"
                type="date"
                placeholder="请选择交付日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="验收标准">
              <el-select v-model="toolingForm.acceptanceStandard" placeholder="请选择验收标准">
                <el-option label="国标GB" value="gb" />
                <el-option label="行标HB" value="hb" />
                <el-option label="企标QB" value="qb" />
                <el-option label="军标GJB" value="gjb" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 设计文件 -->
        <el-form-item label="设计文件">
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
                支持 dwg, dxf, step, igs, pdf 等格式，单个文件不超过 100MB
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

    <!-- 工装详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="工装设计详情" size="70%">
      <div v-if="currentTooling" class="tooling-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工装编号">{{ currentTooling.toolingCode }}</el-descriptions-item>
          <el-descriptions-item label="工装名称">{{ currentTooling.toolingName }}</el-descriptions-item>
          <el-descriptions-item label="工装类型">
            <el-tag :type="getToolingTypeColor(currentTooling.toolingType)">
              {{ getToolingTypeText(currentTooling.toolingType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="设计状态">
            <el-tag :type="getStatusType(currentTooling.status)">
              {{ getStatusText(currentTooling.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="版本">v{{ currentTooling.version }}</el-descriptions-item>
          <el-descriptions-item label="设计师">{{ currentTooling.designer }}</el-descriptions-item>
          <el-descriptions-item label="复杂度">
            <el-rate
              :model-value="currentTooling.complexity"
              disabled
              show-score
              text-color="#ff9900"
              score-template="{value}"
            />
          </el-descriptions-item>
          <el-descriptions-item label="预估成本">￥{{ currentTooling.estimatedCost?.toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="设计软件">{{ currentTooling.designSoftware }}</el-descriptions-item>
          <el-descriptions-item label="制造材料">{{ currentTooling.material }}</el-descriptions-item>
          <el-descriptions-item label="交付日期">{{ currentTooling.deliveryDate }}</el-descriptions-item>
          <el-descriptions-item label="验收标准">{{ currentTooling.acceptanceStandard }}</el-descriptions-item>
          <el-descriptions-item label="设计描述" span="2">{{ currentTooling.description }}</el-descriptions-item>
          <el-descriptions-item label="设计要求" span="2">{{ currentTooling.designRequirements }}</el-descriptions-item>
          <el-descriptions-item label="质量标准" span="2">{{ currentTooling.qualityStandards }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-tabs">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="技术参数" name="params">
              <div class="params-content">
                <el-table :data="currentTooling.technicalParams" stripe>
                  <el-table-column prop="paramName" label="参数名称" />
                  <el-table-column prop="paramValue" label="参数值" />
                  <el-table-column prop="unit" label="单位" />
                  <el-table-column prop="tolerance" label="公差" />
                </el-table>
              </div>
            </el-tab-pane>
            <el-tab-pane label="设计图纸" name="drawings">
              <div class="drawings-content">
                <el-row :gutter="20">
                  <el-col :span="8" v-for="(drawing, index) in currentTooling.drawings" :key="index">
                    <el-card class="drawing-card">
                      <img :src="drawing.thumbnail" :alt="drawing.name" class="drawing-thumbnail" />
                      <div class="drawing-info">
                        <p class="drawing-name">{{ drawing.name }}</p>
                        <p class="drawing-size">{{ drawing.size }}</p>
                        <div class="drawing-actions">
                          <el-button type="primary" size="small" @click="handleViewDrawing(drawing)">查看</el-button>
                          <el-button type="success" size="small" @click="handleDownloadDrawing(drawing)">下载</el-button>
                        </div>
                      </div>
                    </el-card>
                  </el-col>
                </el-row>
              </div>
            </el-tab-pane>
            <el-tab-pane label="3D模型" name="model">
              <div class="model-content">
                <div class="model-viewer">
                  <div class="model-placeholder">
                    <el-icon size="64" color="#909399"><View /></el-icon>
                    <p>3D模型预览区域</p>
                    <el-button type="primary" @click="handleView3DModel">查看3D模型</el-button>
                  </div>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="制造工艺" name="manufacturing">
              <div class="manufacturing-content">
                <el-timeline>
                  <el-timeline-item
                    v-for="(process, index) in currentTooling.manufacturingProcess"
                    :key="index"
                    :timestamp="process.timestamp"
                  >
                    <el-card>
                      <h4>{{ process.step }}</h4>
                      <p>{{ process.description }}</p>
                      <p><strong>负责人:</strong> {{ process.responsible }}</p>
                      <p><strong>预计工时:</strong> {{ process.estimatedHours }} 小时</p>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </el-tab-pane>
            <el-tab-pane label="版本历史" name="versions">
              <div class="versions-content">
                <el-table :data="currentTooling.versions" stripe>
                  <el-table-column prop="version" label="版本" width="100" />
                  <el-table-column prop="changeDescription" label="变更说明" />
                  <el-table-column prop="modifier" label="修改人" width="120" />
                  <el-table-column prop="modifyTime" label="修改时间" width="160" />
                  <el-table-column label="操作" width="150">
                    <template #default="{ row }">
                      <el-button type="text" size="small" @click="handleViewVersion(row)">查看</el-button>
                      <el-button type="text" size="small" @click="handleCompareVersion(row)">对比</el-button>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Upload, Check, UploadFilled, View } from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const drawerVisible = ref(false)
const dialogTitle = ref('新建工装设计')
const currentTooling = ref(null)
const selectedToolings = ref([])
const activeTab = ref('params')
const toolingFormRef = ref()
const fileList = ref([])

// 工装统计数据
const toolingStats = ref([
  {
    label: '总工装数',
    value: '186',
    icon: Tools,
    color: '#409EFF'
  },
  {
    label: '设计中',
    value: '28',
    icon: EditPen,
    color: '#E6A23C'
  },
  {
    label: '制造中',
    value: '42',
    icon: Timer,
    color: '#67C23A'
  },
  {
    label: '已交付',
    value: '116',
    icon: Check,
    color: '#909399'
  }
])

// 搜索表单
const searchForm = reactive({
  toolingCode: '',
  toolingName: '',
  toolingType: '',
  status: '',
  designer: ''
})

// 工装表单
const toolingForm = reactive({
  toolingCode: '',
  toolingName: '',
  toolingType: '',
  description: '',
  complexity: 3,
  estimatedCost: 0,
  designer: '',
  designSoftware: '',
  material: '',
  technicalParams: [],
  designRequirements: '',
  qualityStandards: '',
  deliveryDate: '',
  acceptanceStandard: '',
  applicableProcesses: []
})

// 表单验证规则
const toolingRules = {
  toolingName: [
    { required: true, message: '请输入工装名称', trigger: 'blur' }
  ],
  toolingType: [
    { required: true, message: '请选择工装类型', trigger: 'change' }
  ],
  complexity: [
    { required: true, message: '请选择复杂度', trigger: 'change' }
  ],
  estimatedCost: [
    { required: true, message: '请输入预估成本', trigger: 'blur' }
  ],
  designer: [
    { required: true, message: '请选择设计师', trigger: 'change' }
  ],
  deliveryDate: [
    { required: true, message: '请选择交付日期', trigger: 'change' }
  ]
}

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 工装列表数据
const toolingList = ref([
  {
    id: 1,
    toolingCode: 'T001',
    toolingName: '机械臂装配夹具',
    toolingType: 'fixture',
    status: 'delivered',
    version: '2.1',
    designer: '张工',
    complexity: 4,
    estimatedCost: 25000,
    deliveryDate: '2024-02-15',
    description: '用于机械臂装配的专用夹具，确保装配精度和效率',
    designSoftware: 'SolidWorks',
    material: '45号钢',
    technicalParams: [
      { paramName: '夹具尺寸', paramValue: '800×600×400', unit: 'mm', tolerance: '±0.1' },
      { paramName: '定位精度', paramValue: '0.02', unit: 'mm', tolerance: '±0.005' },
      { paramName: '夹紧力', paramValue: '500', unit: 'N', tolerance: '±50' }
    ],
    designRequirements: '确保装配精度达到±0.02mm，夹紧可靠，操作方便',
    qualityStandards: '符合GB/T 1804-2000夹具设计标准',
    acceptanceStandard: 'GB',
    drawings: [
      {
        name: '总装图.dwg',
        size: '2.5MB',
        thumbnail: '/images/drawing1.jpg'
      },
      {
        name: '零件图.dwg',
        size: '1.8MB',
        thumbnail: '/images/drawing2.jpg'
      }
    ],
    manufacturingProcess: [
      {
        step: '材料准备',
        description: '采购45号钢板，进行质量检验',
        responsible: '采购部',
        estimatedHours: 8,
        timestamp: '2024-01-20'
      },
      {
        step: '粗加工',
        description: '进行切割、钻孔等粗加工工序',
        responsible: '加工车间',
        estimatedHours: 16,
        timestamp: '2024-01-22'
      }
    ],
    versions: [
      {
        version: '2.1',
        changeDescription: '优化定位结构，提高装配效率',
        modifier: '张工',
        modifyTime: '2024-01-15'
      },
      {
        version: '2.0',
        changeDescription: '重新设计夹紧机构',
        modifier: '李工',
        modifyTime: '2023-12-20'
      }
    ]
  },
  {
    id: 2,
    toolingCode: 'T002',
    toolingName: '注塑模具',
    toolingType: 'mold',
    status: 'manufacturing',
    version: '1.3',
    designer: '李工',
    complexity: 5,
    estimatedCost: 85000,
    deliveryDate: '2024-04-30',
    description: '塑料外壳注塑模具，一模四腔结构'
  },
  {
    id: 3,
    toolingCode: 'T003',
    toolingName: '加工中心刀具组',
    toolingType: 'cutter',
    status: 'approved',
    version: '1.0',
    designer: '王工',
    complexity: 2,
    estimatedCost: 12000,
    deliveryDate: '2024-03-15',
    description: '用于铝合金零件加工的专用刀具组'
  }
])

// 工艺列表
const processList = ref([
  { id: 1, name: '机械臂装配工艺' },
  { id: 2, name: '注塑工艺' },
  { id: 3, name: '机加工工艺' },
  { id: 4, name: '检验工艺' }
])

// 设计师列表
const designerList = ref([
  { id: 1, name: '张工' },
  { id: 2, name: '李工' },
  { id: 3, name: '王工' },
  { id: 4, name: '赵工' }
])

// 类型映射函数
const getToolingTypeColor = (type) => {
  const colorMap = {
    fixture: 'primary',
    mold: 'success',
    cutter: 'warning',
    gauge: 'info',
    auxiliary: 'danger'
  }
  return colorMap[type] || 'info'
}

const getToolingTypeText = (type) => {
  const textMap = {
    fixture: '夹具',
    mold: '模具',
    cutter: '刀具',
    gauge: '量具',
    auxiliary: '辅助工具'
  }
  return textMap[type] || type
}

const getStatusType = (status) => {
  const typeMap = {
    designing: 'info',
    reviewing: 'warning',
    approved: 'success',
    manufacturing: 'primary',
    delivered: 'primary'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    designing: '设计中',
    reviewing: '审核中',
    approved: '已批准',
    manufacturing: '制造中',
    delivered: '已交付'
  }
  return textMap[status] || status
}

// 事件处理函数
const handleCreateTooling = () => {
  dialogTitle.value = '新建工装设计'
  toolingForm.toolingCode = 'T' + String(Date.now()).slice(-3)
  toolingForm.technicalParams = []
  dialogVisible.value = true
}

const handleImportDesign = () => {
  ElMessage.info('导入设计功能开发中...')
}

const handleApproval = () => {
  ElMessage.info('设计审批功能开发中...')
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
  selectedToolings.value = selection
}

const handleView = (row) => {
  currentTooling.value = row
  drawerVisible.value = true
}

const handleDesignDetail = (row) => {
  currentTooling.value = row
  activeTab.value = 'drawings'
  drawerVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑工装设计'
  Object.keys(toolingForm).forEach(key => {
    toolingForm[key] = row[key] || []
  })
  dialogVisible.value = true
}

const handleVersion = (row) => {
  ElMessage.info(`查看工装 ${row.toolingName} 的版本历史`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除工装"${row.toolingName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleBatchManufacture = () => {
  ElMessageBox.confirm(`确定制造选中的 ${selectedToolings.value.length} 个工装吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('批量制造成功')
    selectedToolings.value = []
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

const handleAddParam = () => {
  toolingForm.technicalParams.push({
    paramName: '',
    paramValue: '',
    unit: '',
    tolerance: ''
  })
}

const handleDeleteParam = (index) => {
  toolingForm.technicalParams.splice(index, 1)
}

const handleSubmitDraft = () => {
  toolingFormRef.value.validate((valid) => {
    if (valid) {
      dialogVisible.value = false
      ElMessage.success('草稿保存成功')
      // 重置表单
      Object.keys(toolingForm).forEach(key => {
        if (Array.isArray(toolingForm[key])) {
          toolingForm[key] = []
        } else {
          toolingForm[key] = ''
        }
      })
      toolingForm.complexity = 3
    }
  })
}

const handleSubmit = () => {
  toolingFormRef.value.validate((valid) => {
    if (valid) {
      dialogVisible.value = false
      ElMessage.success('提交审批成功')
      // 重置表单
      Object.keys(toolingForm).forEach(key => {
        if (Array.isArray(toolingForm[key])) {
          toolingForm[key] = []
        } else {
          toolingForm[key] = ''
        }
      })
      toolingForm.complexity = 3
    }
  })
}

const handleDialogClose = () => {
  toolingFormRef.value?.resetFields()
  // 重置表单
  Object.keys(toolingForm).forEach(key => {
    if (Array.isArray(toolingForm[key])) {
      toolingForm[key] = []
    } else {
      toolingForm[key] = ''
    }
  })
  toolingForm.complexity = 3
  fileList.value = []
}

const handleFileChange = (file, fileList) => {
  console.log('文件变化:', file, fileList)
}

const handleViewDrawing = (drawing) => {
  ElMessage.success(`查看图纸: ${drawing.name}`)
}

const handleDownloadDrawing = (drawing) => {
  ElMessage.success(`下载图纸: ${drawing.name}`)
}

const handleView3DModel = () => {
  ElMessage.success('查看3D模型')
}

const handleViewVersion = (version) => {
  ElMessage.success(`查看版本: ${version.version}`)
}

const handleCompareVersion = (version) => {
  ElMessage.success(`对比版本: ${version.version}`)
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
}

onMounted(() => {
  pagination.total = toolingList.value.length
})
</script>

<style scoped>
.tooling-design {
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

.technical-params {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
}

.tooling-detail {
  padding: 20px;
}

.detail-tabs {
  margin-top: 30px;
}

.params-content,
.versions-content {
  padding: 20px 0;
}

.drawings-content,
.model-content,
.manufacturing-content {
  padding: 20px 0;
}

.drawing-card {
  margin-bottom: 20px;
  text-align: center;
}

.drawing-thumbnail {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 10px;
}

.drawing-name {
  font-weight: bold;
  color: #1d2129;
  margin: 5px 0;
}

.drawing-size {
  color: #606266;
  font-size: 12px;
  margin-bottom: 10px;
}

.drawing-actions {
  display: flex;
  justify-content: center;
  gap: 5px;
}

.model-viewer {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.model-placeholder {
  text-align: center;
  color: #909399;
}

.model-placeholder p {
  margin: 20px 0;
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