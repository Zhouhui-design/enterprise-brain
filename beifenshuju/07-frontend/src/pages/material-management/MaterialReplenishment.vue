<template>
  <div class="material-replenishment-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>增补领料</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新增增补单
        </el-button>
        <el-button @click="exportData">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 数据统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ totalReplenishments }}</div>
          <div class="stat-label">本月增补单</div>
        </div>
        <div class="stat-icon">
          <el-icon class="icon-large"><Document /></el-icon>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ pendingReplenishments }}</div>
          <div class="stat-label">待审批</div>
        </div>
        <div class="stat-icon">
          <el-icon class="icon-large"><Timer /></el-icon>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ approvedReplenishments }}</div>
          <div class="stat-label">已审批</div>
        </div>
        <div class="stat-icon">
          <el-icon class="icon-large"><Check /></el-icon>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ rejectedReplenishments }}</div>
          <div class="stat-label">已拒绝</div>
        </div>
        <div class="stat-icon">
          <el-icon class="icon-large"><Close /></el-icon>
        </div>
      </el-card>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="增补单号">
          <el-input v-model="searchForm.replenishmentNo" placeholder="请输入增补单号" clearable />
        </el-form-item>
        <el-form-item label="申请部门">
          <el-select v-model="searchForm.departmentId" placeholder="请选择申请部门" clearable>
            <el-option 
              v-for="dept in departments" 
              :key="dept.id" 
              :label="dept.name" 
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="申请人">
          <el-input v-model="searchForm.applicant" placeholder="请输入申请人" clearable />
        </el-form-item>
        <el-form-item label="申请日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待审批" value="pending" />
            <el-option label="已审批" value="approved" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 增补单列表 -->
    <el-card class="data-card">
      <div class="table-header">
        <span class="title">增补单列表</span>
        <el-button type="danger" :disabled="selectedReplenishments.length === 0" @click="batchDelete">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>
      
      <el-table
        v-loading="loading"
        :data="replenishmentList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        row-key="id"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="replenishmentNo" label="增补单号" min-width="180" />
        <el-table-column prop="originalOrderNo" label="原单据号" min-width="180" />
        <el-table-column prop="reason" label="增补原因" min-width="200" />
        <el-table-column prop="departmentName" label="申请部门" min-width="120" />
        <el-table-column prop="applicant" label="申请人" min-width="100" />
        <el-table-column prop="applyDate" label="申请日期" min-width="120" />
        <el-table-column prop="materialCount" label="物料种类" width="100" align="center" />
        <el-table-column prop="totalAmount" label="总金额" width="120" align="right">
          <template #default="scope">
            ¥{{ scope.row.totalAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag 
              :type="getStatusType(scope.row.status)"
              effect="light"
            >
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewReplenishment(scope.row)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button 
              v-if="scope.row.status === 'pending'"
              size="small" 
              @click="editReplenishment(scope.row)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button 
              v-if="scope.row.status === 'pending'"
              size="small" 
              type="danger"
              @click="deleteReplenishment(scope.row.id)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
            <el-button 
              v-if="scope.row.status === 'approved'"
              size="small" 
              type="primary"
              @click="generatePickingList(scope.row)"
            >
              <el-icon><Share /></el-icon>
              生成领料单
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑增补单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="70%"
      :close-on-click-modal="false"
    >
      <el-form
        ref="replenishmentFormRef"
        :model="replenishmentForm"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="原单据号" prop="originalOrderNo">
              <el-input v-model="replenishmentForm.originalOrderNo" placeholder="请输入原单据号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请日期" prop="applyDate">
              <el-date-picker
                v-model="replenishmentForm.applyDate"
                type="date"
                placeholder="选择申请日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="申请部门" prop="departmentId">
              <el-select v-model="replenishmentForm.departmentId" placeholder="请选择申请部门" filterable>
                <el-option 
                  v-for="dept in departments" 
                  :key="dept.id" 
                  :label="dept.name" 
                  :value="dept.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请人" prop="applicant">
              <el-input v-model="replenishmentForm.applicant" placeholder="请输入申请人" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="增补原因" prop="reason">
          <el-input
            v-model="replenishmentForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请详细说明增补原因"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="replenishmentForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息（选填）"
          />
        </el-form-item>

        <!-- 物料明细表格 -->
        <el-form-item>
          <div class="material-items-header">
            <span>物料明细</span>
            <el-button type="primary" size="small" @click="showAddMaterialDialog">
              <el-icon><Plus /></el-icon>
              添加物料
            </el-button>
          </div>
          
          <el-table
            v-if="replenishmentForm.items.length > 0"
            :data="replenishmentForm.items"
            style="width: 100%"
            border
          >
            <el-table-column prop="materialCode" label="物料编码" min-width="150" />
            <el-table-column prop="materialName" label="物料名称" min-width="180" />
            <el-table-column prop="specification" label="规格型号" min-width="150" />
            <el-table-column prop="unit" label="单位" width="100" />
            <el-table-column prop="requestQuantity" label="申请数量" width="120" align="right">
              <template #default="scope">
                <el-input-number
                  v-model="scope.row.requestQuantity"
                  :min="0"
                  :precision="2"
                  size="small"
                  @change="updateTotalAmount"
                />
              </template>
            </el-table-column>
            <el-table-column prop="unitPrice" label="单价" width="120" align="right">
              <template #default="scope">
                <el-input-number
                  v-model="scope.row.unitPrice"
                  :min="0"
                  :precision="2"
                  size="small"
                  @change="updateTotalAmount"
                />
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120" align="right">
              <template #default="scope">
                ¥{{ (scope.row.requestQuantity * scope.row.unitPrice).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="usage" label="用途" min-width="150">
              <template #default="scope">
                <el-input
                  v-model="scope.row.usage"
                  placeholder="请输入用途"
                  size="small"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="scope">
                <el-button
                  type="danger"
                  size="small"
                  @click="removeMaterial(scope.row)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div v-else class="empty-items">
            <el-empty description="暂无物料，请点击添加物料按钮" />
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="submitForm">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加物料对话框 -->
    <el-dialog
      v-model="addMaterialDialogVisible"
      title="选择物料"
      width="80%"
      :close-on-click-modal="false"
    >
      <el-card>
        <el-form :inline="true" :model="materialSearchForm" class="search-form">
          <el-form-item label="物料编码">
            <el-input v-model="materialSearchForm.materialCode" placeholder="请输入物料编码" clearable />
          </el-form-item>
          <el-form-item label="物料名称">
            <el-input v-model="materialSearchForm.materialName" placeholder="请输入物料名称" clearable />
          </el-form-item>
          <el-form-item label="物料类型">
            <el-select v-model="materialSearchForm.categoryId" placeholder="请选择物料类型" clearable>
              <el-option 
                v-for="cat in materialCategories" 
                :key="cat.id" 
                :label="cat.name" 
                :value="cat.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="searchMaterials">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="resetMaterialSearch">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-table
        v-loading="materialsLoading"
        :data="materialList"
        style="width: 100%"
        @selection-change="handleMaterialSelectionChange"
        row-key="id"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="物料编码" min-width="150" />
        <el-table-column prop="name" label="物料名称" min-width="180" />
        <el-table-column prop="specification" label="规格型号" min-width="150" />
        <el-table-column prop="unit" label="单位" width="100" />
        <el-table-column prop="categoryName" label="物料类型" min-width="120" />
        <el-table-column prop="stockQuantity" label="库存数量" width="120" align="right" />
        <el-table-column prop="unitPrice" label="单价" width="120" align="right">
          <template #default="scope">
            ¥{{ scope.row.unitPrice.toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="materialPagination.currentPage"
          v-model:page-size="materialPagination.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="materialPagination.total"
          @size-change="handleMaterialSizeChange"
          @current-change="handleMaterialCurrentChange"
        />
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addMaterialDialogVisible = false">取消</el-button>
          <el-button type="primary" :disabled="selectedMaterials.length === 0" @click="confirmAddMaterials">
            确认添加
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 查看增补单详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="增补单详情"
      width="70%"
      :close-on-click-modal="false"
    >
      <el-card v-for="(item, index) in detailSections" :key="index">
        <template #header>
          <div class="card-header">
            <span>{{ item.title }}</span>
          </div>
        </template>
        
        <template v-if="item.type === 'info'">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="增补单号">{{ detailInfo.replenishmentNo }}</el-descriptions-item>
            <el-descriptions-item label="原单据号">{{ detailInfo.originalOrderNo }}</el-descriptions-item>
            <el-descriptions-item label="申请部门">{{ detailInfo.departmentName }}</el-descriptions-item>
            <el-descriptions-item label="申请人">{{ detailInfo.applicant }}</el-descriptions-item>
            <el-descriptions-item label="申请日期">{{ detailInfo.applyDate }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ getStatusLabel(detailInfo.status) }}</el-descriptions-item>
            <el-descriptions-item label="增补原因">{{ detailInfo.reason }}</el-descriptions-item>
            <el-descriptions-item label="物料种类">{{ detailInfo.materialCount }}</el-descriptions-item>
            <el-descriptions-item label="总金额" :span="2">
              <span class="total-amount">¥{{ detailInfo.totalAmount.toFixed(2) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ detailInfo.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </template>

        <template v-if="item.type === 'items'">
          <el-table
            :data="detailInfo.items"
            style="width: 100%"
            border
          >
            <el-table-column prop="materialCode" label="物料编码" min-width="150" />
            <el-table-column prop="materialName" label="物料名称" min-width="180" />
            <el-table-column prop="specification" label="规格型号" min-width="150" />
            <el-table-column prop="unit" label="单位" width="100" />
            <el-table-column prop="requestQuantity" label="申请数量" width="120" align="right" />
            <el-table-column prop="unitPrice" label="单价" width="120" align="right">
              <template #default="scope">
                ¥{{ scope.row.unitPrice.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120" align="right">
              <template #default="scope">
                ¥{{ scope.row.amount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="usage" label="用途" min-width="150" />
          </el-table>
        </template>

        <template v-if="item.type === 'approval'">
          <el-timeline>
            <el-timeline-item
              v-for="(timelineItem, timelineIndex) in detailInfo.approvalHistory"
              :key="timelineIndex"
              :timestamp="timelineItem.time"
              :type="getTimelineType(timelineItem.action)"
            >
              <div>
                <p>{{ timelineItem.actionText }}</p>
                <p v-if="timelineItem.comment" class="timeline-comment">{{ timelineItem.comment }}</p>
                <p class="timeline-operator">{{ timelineItem.operator }}</p>
              </div>
            </el-timeline-item>
          </el-timeline>
        </template>
      </el-card>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Download, Search, Refresh, Document, Timer, Check, Close, 
  View, Edit, Delete as DeleteIcon, Share
} from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive({
  replenishmentNo: '',
  departmentId: '',
  applicant: '',
  dateRange: null,
  status: ''
})

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 加载状态
const loading = ref(false)

// 增补单列表
const replenishmentList = ref([])

// 选中的增补单
const selectedReplenishments = ref([])

// 对话框状态
const dialogVisible = ref(false)
const addMaterialDialogVisible = ref(false)
const viewDialogVisible = ref(false)

// 对话框标题
const dialogTitle = ref('')

// 表单引用
const replenishmentFormRef = ref()

// 增补单表单
const replenishmentForm = reactive({
  id: null,
  replenishmentNo: '',
  originalOrderNo: '',
  departmentId: '',
  departmentName: '',
  applicant: '',
  applyDate: '',
  reason: '',
  remark: '',
  totalAmount: 0,
  items: []
})

// 表单验证规则
const formRules = {
  originalOrderNo: [
    { required: true, message: '请输入原单据号', trigger: 'blur' }
  ],
  departmentId: [
    { required: true, message: '请选择申请部门', trigger: 'change' }
  ],
  applicant: [
    { required: true, message: '请输入申请人', trigger: 'blur' }
  ],
  applyDate: [
    { required: true, message: '请选择申请日期', trigger: 'change' }
  ],
  reason: [
    { required: true, message: '请输入增补原因', trigger: 'blur' },
    { min: 5, message: '增补原因至少5个字符', trigger: 'blur' }
  ]
}

// 物料搜索表单
const materialSearchForm = reactive({
  materialCode: '',
  materialName: '',
  categoryId: ''
})

// 物料分页信息
const materialPagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 物料加载状态
const materialsLoading = ref(false)

// 物料列表
const materialList = ref([])

// 选中的物料
const selectedMaterials = ref([])

// 详情信息
const detailInfo = reactive({})

// 详情页签
const detailSections = ref([
  { title: '基本信息', type: 'info' },
  { title: '物料明细', type: 'items' },
  { title: '审批记录', type: 'approval' }
])

// 统计数据
const totalReplenishments = ref(0)
const pendingReplenishments = ref(0)
const approvedReplenishments = ref(0)
const rejectedReplenishments = ref(0)

// 部门列表
const departments = ref([
  { id: 1, name: '生产部' },
  { id: 2, name: '质检部' },
  { id: 3, name: '研发部' },
  { id: 4, name: '采购部' },
  { id: 5, name: '行政部' }
])

// 物料类型
const materialCategories = ref([
  { id: 1, name: '原材料' },
  { id: 2, name: '半成品' },
  { id: 3, name: '成品' },
  { id: 4, name: '辅料' },
  { id: 5, name: '包装材料' }
])

// 初始化数据
onMounted(() => {
  loadReplenishmentList()
  loadStatistics()
  loadMaterialList()
})

// 加载增补单列表
const loadReplenishmentList = async () => {
  loading.value = true
  try {
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    const mockData = generateMockReplenishmentData()
    
    // 模拟分页
    const start = (pagination.currentPage - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    replenishmentList.value = mockData.slice(start, end)
    pagination.total = mockData.length
  } catch (error) {
    ElMessage.error('加载增补单列表失败')
    console.error('加载增补单列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 模拟统计数据
    totalReplenishments.value = 45
    pendingReplenishments.value = 12
    approvedReplenishments.value = 28
    rejectedReplenishments.value = 5
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载物料列表
const loadMaterialList = async () => {
  materialsLoading.value = true
  try {
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    const mockData = generateMockMaterialData()
    
    // 模拟分页
    const start = (materialPagination.currentPage - 1) * materialPagination.pageSize
    const end = start + materialPagination.pageSize
    materialList.value = mockData.slice(start, end)
    materialPagination.total = mockData.length
  } catch (error) {
    ElMessage.error('加载物料列表失败')
    console.error('加载物料列表失败:', error)
  } finally {
    materialsLoading.value = false
  }
}

// 搜索
const search = () => {
  pagination.currentPage = 1
  loadReplenishmentList()
}

// 重置搜索
const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  searchForm.dateRange = null
  search()
}

// 物料搜索
const searchMaterials = () => {
  materialPagination.currentPage = 1
  loadMaterialList()
}

// 重置物料搜索
const resetMaterialSearch = () => {
  Object.keys(materialSearchForm).forEach(key => {
    materialSearchForm[key] = ''
  })
  searchMaterials()
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadReplenishmentList()
}

// 当前页变化
const handleCurrentChange = (current) => {
  pagination.currentPage = current
  loadReplenishmentList()
}

// 物料分页大小变化
const handleMaterialSizeChange = (size) => {
  materialPagination.pageSize = size
  loadMaterialList()
}

// 物料当前页变化
const handleMaterialCurrentChange = (current) => {
  materialPagination.currentPage = current
  loadMaterialList()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedReplenishments.value = selection
}

// 物料选择变化
const handleMaterialSelectionChange = (selection) => {
  selectedMaterials.value = selection
}

// 显示创建对话框
const showCreateDialog = () => {
  dialogTitle.value = '新增增补单'
  resetForm()
  dialogVisible.value = true
  nextTick(() => {
    replenishmentForm.applyDate = new Date().toISOString().split('T')[0]
    replenishmentForm.replenishmentNo = generateReplenishmentNo()
  })
}

// 显示编辑对话框
const editReplenishment = (row) => {
  dialogTitle.value = '编辑增补单'
  resetForm()
  
  // 深拷贝选中行数据
  Object.assign(replenishmentForm, JSON.parse(JSON.stringify(row)))
  
  dialogVisible.value = true
}

// 查看增补单
const viewReplenishment = async (row) => {
  try {
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟详情数据
    const mockDetail = generateMockDetailData(row.id)
    Object.assign(detailInfo, mockDetail)
    
    viewDialogVisible.value = true
  } catch (error) {
    ElMessage.error('加载增补单详情失败')
    console.error('加载增补单详情失败:', error)
  }
}

// 删除增补单
const deleteReplenishment = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该增补单吗？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 从列表中移除
    const index = replenishmentList.value.findIndex(item => item.id === id)
    if (index > -1) {
      replenishmentList.value.splice(index, 1)
      pagination.total--
    }
    
    ElMessage.success('删除成功')
    loadStatistics()
  } catch (error) {
    // 用户取消删除
  }
}

// 批量删除
const batchDelete = async () => {
  if (selectedReplenishments.value.length === 0) {
    ElMessage.warning('请选择要删除的增补单')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedReplenishments.value.length} 个增补单吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 从列表中移除选中项
    const idsToDelete = selectedReplenishments.value.map(item => item.id)
    replenishmentList.value = replenishmentList.value.filter(item => !idsToDelete.includes(item.id))
    pagination.total -= selectedReplenishments.value.length
    selectedReplenishments.value = []
    
    ElMessage.success(`成功删除 ${idsToDelete.length} 个增补单`)
    loadStatistics()
  } catch (error) {
    // 用户取消删除
  }
}

// 生成领料单
const generatePickingList = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要为增补单 ${row.replenishmentNo} 生成领料单吗？`,
      '生成领料单确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success(`已成功生成领料单，单号：PK${Date.now()}`)
  } catch (error) {
    // 用户取消操作
  }
}

// 保存表单
const submitForm = async () => {
  try {
    await replenishmentFormRef.value.validate()
    
    if (replenishmentForm.items.length === 0) {
      ElMessage.warning('请至少添加一种物料')
      return
    }
    
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadReplenishmentList()
    loadStatistics()
  } catch (error) {
    // 表单验证失败或保存失败
  }
}

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false
  addMaterialDialogVisible.value = false
}

// 重置表单
const resetForm = () => {
  if (replenishmentFormRef.value) {
    replenishmentFormRef.value.resetFields()
  }
  
  Object.assign(replenishmentForm, {
    id: null,
    replenishmentNo: '',
    originalOrderNo: '',
    departmentId: '',
    departmentName: '',
    applicant: '',
    applyDate: '',
    reason: '',
    remark: '',
    totalAmount: 0,
    items: []
  })
}

// 显示添加物料对话框
const showAddMaterialDialog = () => {
  selectedMaterials.value = []
  addMaterialDialogVisible.value = true
}

// 确认添加物料
const confirmAddMaterials = () => {
  if (selectedMaterials.value.length === 0) {
    ElMessage.warning('请选择要添加的物料')
    return
  }
  
  // 检查是否已存在相同物料
  selectedMaterials.value.forEach(material => {
    const existingItem = replenishmentForm.items.find(item => item.materialId === material.id)
    if (!existingItem) {
      replenishmentForm.items.push({
        id: null,
        materialId: material.id,
        materialCode: material.code,
        materialName: material.name,
        specification: material.specification,
        unit: material.unit,
        requestQuantity: 1,
        unitPrice: material.unitPrice,
        amount: material.unitPrice,
        usage: ''
      })
    }
  })
  
  updateTotalAmount()
  addMaterialDialogVisible.value = false
  ElMessage.success(`成功添加 ${selectedMaterials.value.length} 种物料`)
}

// 移除物料
const removeMaterial = (row) => {
  const index = replenishmentForm.items.findIndex(item => item.materialId === row.materialId)
  if (index > -1) {
    replenishmentForm.items.splice(index, 1)
    updateTotalAmount()
  }
}

// 更新总金额
const updateTotalAmount = () => {
  let total = 0
  replenishmentForm.items.forEach(item => {
    item.amount = item.requestQuantity * item.unitPrice
    total += item.amount
  })
  replenishmentForm.totalAmount = total
}

// 导出数据
const exportData = () => {
  ElMessage.success('导出成功')
}

// 获取状态标签
const getStatusLabel = (status) => {
  const statusMap = {
    pending: '待审批',
    approved: '已审批',
    rejected: '已拒绝',
    completed: '已完成'
  }
  return statusMap[status] || status
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    completed: 'info'
  }
  return typeMap[status] || 'default'
}

// 获取时间线类型
const getTimelineType = (action) => {
  const typeMap = {
    create: 'primary',
    approve: 'success',
    reject: 'danger',
    complete: 'info'
  }
  return typeMap[action] || 'default'
}

// 生成增补单号
const generateReplenishmentNo = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const timestamp = String(date.getTime()).slice(-6)
  return `REP${year}${month}${day}${timestamp}`
}

// 生成模拟增补单数据
function generateMockReplenishmentData() {
  const data = []
  const statuses = ['pending', 'approved', 'rejected', 'completed']
  const reasons = ['生产计划变更', '损耗超标', '质量问题', '客户需求变更', '设计变更']
  const departments = ['生产部', '研发部', '质检部', '采购部']
  
  for (let i = 1; i <= 50; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const reason = reasons[Math.floor(Math.random() * reasons.length)]
    const dept = departments[Math.floor(Math.random() * departments.length)]
    const materialCount = Math.floor(Math.random() * 10) + 1
    const totalAmount = Math.random() * 10000 + 1000
    
    data.push({
      id: i,
      replenishmentNo: `REP202401${String(i).padStart(4, '0')}`,
      originalOrderNo: `PO202401${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      reason: reason,
      departmentName: dept,
      departmentId: departments.indexOf(dept) + 1,
      applicant: `申请人${i}`,
      applyDate: `2024-01-${String(Math.floor(Math.random() * 31) + 1).padStart(2, '0')}`,
      materialCount: materialCount,
      totalAmount: totalAmount,
      status: status,
      items: []
    })
  }
  
  return data
}

// 生成模拟物料数据
function generateMockMaterialData() {
  const data = []
  const units = ['个', '件', '箱', '千克', '米', '平方米']
  const categories = ['原材料', '半成品', '成品', '辅料', '包装材料']
  
  for (let i = 1; i <= 30; i++) {
    const unit = units[Math.floor(Math.random() * units.length)]
    const category = categories[Math.floor(Math.random() * categories.length)]
    
    data.push({
      id: i,
      code: `MAT${String(i).padStart(6, '0')}`,
      name: `物料${i}`,
      specification: `规格${i}-${Math.floor(Math.random() * 100)}`,
      unit: unit,
      categoryName: category,
      categoryId: categories.indexOf(category) + 1,
      stockQuantity: Math.floor(Math.random() * 1000) + 100,
      unitPrice: Math.random() * 1000 + 100
    })
  }
  
  return data
}

// 生成模拟详情数据
function generateMockDetailData(id) {
  const statuses = ['pending', 'approved', 'rejected', 'completed']
  const status = statuses[Math.floor(Math.random() * statuses.length)]
  const reason = ['生产计划变更', '损耗超标', '质量问题', '客户需求变更', '设计变更'][Math.floor(Math.random() * 5)]
  
  // 生成审批历史
  const approvalHistory = [
    {
      time: '2024-01-15 09:30:00',
      action: 'create',
      actionText: '创建增补单',
      comment: '',
      operator: '张三'
    }
  ]
  
  if (status !== 'pending') {
    approvalHistory.push({
      time: '2024-01-15 14:20:00',
      action: status === 'approved' ? 'approve' : 'reject',
      actionText: status === 'approved' ? '审批通过' : '审批拒绝',
      comment: status === 'approved' ? '同意增补' : '不符合增补条件，需重新提交申请',
      operator: '李四'
    })
    
    if (status === 'completed') {
      approvalHistory.push({
        time: '2024-01-16 10:00:00',
        action: 'complete',
        actionText: '增补单完成',
        comment: '',
        operator: '王五'
      })
    }
  }
  
  // 生成物料明细
  const items = []
  const materialCount = Math.floor(Math.random() * 10) + 1
  for (let i = 1; i <= materialCount; i++) {
    const unitPrice = Math.random() * 1000 + 100
    const quantity = Math.random() * 100 + 10
    
    items.push({
      id: i,
      materialCode: `MAT${String(i).padStart(6, '0')}`,
      materialName: `物料${i}`,
      specification: `规格${i}-${Math.floor(Math.random() * 100)}`,
      unit: ['个', '件', '箱', '千克', '米'][Math.floor(Math.random() * 5)],
      requestQuantity: quantity,
      unitPrice: unitPrice,
      amount: quantity * unitPrice,
      usage: `生产使用${i}`
    })
  }
  
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
  
  return {
    id: id,
    replenishmentNo: `REP202401${String(id).padStart(4, '0')}`,
    originalOrderNo: `PO202401${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    reason: reason,
    departmentName: ['生产部', '研发部', '质检部', '采购部'][Math.floor(Math.random() * 4)],
    departmentId: Math.floor(Math.random() * 5) + 1,
    applicant: `申请人${id}`,
    applyDate: `2024-01-${String(Math.floor(Math.random() * 31) + 1).padStart(2, '0')}`,
    materialCount: materialCount,
    totalAmount: totalAmount,
    status: status,
    remark: '加急处理',
    items: items,
    approvalHistory: approvalHistory
  }
}
</script>

<style scoped>
.material-replenishment-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.stat-icon {
  margin-left: 20px;
}

.icon-large {
  font-size: 40px;
  color: #409eff;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.data-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-header .title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.material-items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.material-items-header span {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.empty-items {
  padding: 40px 0;
  text-align: center;
}

.total-amount {
  font-size: 20px;
  font-weight: 600;
  color: #f56c6c;
}

.timeline-comment {
  color: #606266;
  margin: 5px 0;
  font-size: 14px;
}

.timeline-operator {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header span {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .search-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .header-actions .el-button {
    flex: 1;
  }
}
</style>