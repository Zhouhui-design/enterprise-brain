cat > mold/MoldMaintenance.vue <<'EOF'
<template>
  <div class="mold-maintenance">
    <div class="header">
      <h1>模具保养管理</h1>
      <div class="actions">
        <el-button type="primary" @click="handleCreatePlan" :disabled="activeTab !== 'plan'">
          <el-icon><Plus /></el-icon> 创建保养计划
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon> 导出数据
        </el-button>
      </div>
    </div>

    <!-- 标签页导航 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabChange" class="maintenance-tabs">
      <!-- 保养计划标签页 -->
      <el-tab-pane label="保养计划" name="plan">
        <!-- 计划搜索筛选 -->
        <div class="filter-bar">
          <el-form :model="planSearchForm" inline>
            <el-form-item label="模具编号/名称">
              <el-input 
                v-model="planSearchForm.keyword" 
                placeholder="请输入模具信息" 
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="计划状态">
              <el-select v-model="planSearchForm.status" placeholder="全部状态" clearable>
                <el-option label="待执行" value="pending" />
                <el-option label="执行中" value="in_progress" />
                <el-option label="已完成" value="completed" />
                <el-option label="已逾期" value="overdue" />
              </el-select>
            </el-form-item>
            <el-form-item label="计划日期">
              <el-date-picker
                v-model="planSearchForm.planDate"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handlePlanSearch">查询</el-button>
              <el-button @click="handlePlanReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 计划列表 -->
        <el-card class="table-card">
          <el-table 
            :data="paginatedPlans" 
            style="width: 100%"
            v-loading="planLoading"
            @sort-change="handlePlanSort"
          >
            <el-table-column prop="id" label="计划ID" width="80" sortable />
            <el-table-column prop="moldCode" label="模具编号" width="100" />
            <el-table-column prop="moldName" label="模具名称" width="150" />
            <el-table-column prop="maintenanceType" label="保养类型" width="100">
              <template #default="scope">
                <el-tag :type="getMaintenanceTypeTag(scope.row.maintenanceType)">
                  {{ scope.row.maintenanceType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="planDate" label="计划日期" width="120" sortable />
            <el-table-column prop="estimatedDuration" label="预计时长(小时)" width="120" />
            <el-table-column prop="responsiblePerson" label="负责人" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusTag(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remarks" label="备注" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button link type="primary" @click="handleViewPlan(scope.row)">查看</el-button>
                <el-button link type="primary" @click="handleEditPlan(scope.row)" 
                  :disabled="scope.row.status === 'completed' || scope.row.status === 'overdue'">
                  编辑
                </el-button>
                <el-button 
                  link 
                  :type="scope.row.status === 'pending' ? 'success' : 'danger'" 
                  @click="handlePlanAction(scope.row)"
                >
                  {{ scope.row.status === 'pending' ? '开始' : '删除' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 计划分页 -->
          <div class="pagination">
            <el-pagination
              v-model:current-page="planCurrentPage"
              v-model:page-size="planPageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="filteredPlans.length"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handlePlanSizeChange"
              @current-change="handlePlanCurrentChange"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 保养记录标签页 -->
      <el-tab-pane label="保养记录" name="record">
        <!-- 记录搜索筛选 -->
        <div class="filter-bar">
          <el-form :model="recordSearchForm" inline>
            <el-form-item label="模具编号/名称">
              <el-input 
                v-model="recordSearchForm.keyword" 
                placeholder="请输入模具信息" 
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="保养人员">
              <el-input 
                v-model="recordSearchForm.maintenancePerson" 
                placeholder="请输入保养人员" 
                clearable
                style="width: 150px"
              />
            </el-form-item>
            <el-form-item label="执行日期">
              <el-date-picker
                v-model="recordSearchForm.executionDate"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleRecordSearch">查询</el-button>
              <el-button @click="handleRecordReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 记录列表 -->
        <el-card class="table-card">
          <el-table 
            :data="paginatedRecords" 
            style="width: 100%"
            v-loading="recordLoading"
            @sort-change="handleRecordSort"
          >
            <el-table-column prop="id" label="记录ID" width="80" sortable />
            <el-table-column prop="moldCode" label="模具编号" width="100" />
            <el-table-column prop="moldName" label="模具名称" width="150" />
            <el-table-column prop="maintenanceType" label="保养类型" width="100">
              <template #default="scope">
                <el-tag :type="getMaintenanceTypeTag(scope.row.maintenanceType)">
                  {{ scope.row.maintenanceType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="executionDate" label="执行日期" width="120" sortable />
            <el-table-column prop="startShots" label="起始模次" width="100" />
            <el-table-column prop="endShots" label="结束模次" width="100" />
            <el-table-column prop="maintenancePerson" label="保养人员" width="100" />
            <el-table-column prop="result" label="保养结果" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.result === 'pass' ? 'success' : 'warning'">
                  {{ scope.row.result === 'pass' ? '合格' : '不合格' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <el-button link type="primary" @click="handleViewRecord(scope.row)">查看</el-button>
                <el-button link type="danger" @click="handleDeleteRecord(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 记录分页 -->
          <div class="pagination">
            <el-pagination
              v-model:current-page="recordCurrentPage"
              v-model:page-size="recordPageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="filteredRecords.length"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleRecordSizeChange"
              @current-change="handleRecordCurrentChange"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 保养标准标签页 -->
      <el-tab-pane label="保养标准" name="standard">
        <!-- 标准搜索筛选 -->
        <div class="filter-bar">
          <el-form :model="standardSearchForm" inline>
            <el-form-item label="标准名称">
              <el-input 
                v-model="standardSearchForm.keyword" 
                placeholder="请输入标准名称" 
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="适用模具类型">
              <el-select v-model="standardSearchForm.moldType" placeholder="全部类型" clearable>
                <el-option v-for="type in moldTypes" :key="type" :label="type" :value="type" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleStandardSearch">查询</el-button>
              <el-button @click="handleStandardReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 标准列表 -->
        <el-card class="table-card">
          <div class="standard-header">
            <el-button type="primary" size="small" @click="handleCreateStandard">
              <el-icon><Plus /></el-icon> 新增标准
            </el-button>
          </div>
          <el-table 
            :data="paginatedStandards" 
            style="width: 100%"
            v-loading="standardLoading"
          >
            <el-table-column prop="id" label="标准ID" width="80" />
            <el-table-column prop="name" label="标准名称" width="200" />
            <el-table-column prop="moldType" label="适用模具类型" width="120" />
            <el-table-column prop="maintenanceCycle" label="保养周期(模次)" width="120" />
            <el-table-column prop="frequency" label="保养频率" width="100">
              <template #default="scope">
                {{ scope.row.frequency || '按模次' }}
              </template>
            </el-table-column>
            <el-table-column prop="version" label="版本号" width="80" />
            <el-table-column prop="createdBy" label="创建人" width="100" />
            <el-table-column prop="createdAt" label="创建日期" width="120" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button link type="primary" @click="handleViewStandard(scope.row)">查看详情</el-button>
                <el-button link type="primary" @click="handleEditStandard(scope.row)">编辑</el-button>
                <el-button link type="danger" @click="handleDeleteStandard(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 标准分页 -->
          <div class="pagination">
            <el-pagination
              v-model:current-page="standardCurrentPage"
              v-model:page-size="standardPageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="filteredStandards.length"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleStandardSizeChange"
              @current-change="handleStandardCurrentChange"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 统计分析标签页 -->
      <el-tab-pane label="统计分析" name="statistics">
        <!-- 统计卡片 -->
        <div class="stats-cards">
          <el-card class="stat-card">
            <template #header>
              <span>本月保养计划</span>
            </template>
            <div class="card-content">
              <el-statistic :value="monthlyPlans" suffix="个" />
            </div>
          </el-card>
          <el-card class="stat-card">
            <template #header>
              <span>本月已完成</span>
            </template>
            <div class="card-content">
              <el-statistic :value="monthlyCompleted" suffix="个" :value-style="{ color: '#67c23a' }" />
            </div>
          </el-card>
          <el-card class="stat-card">
            <template #header>
              <span>逾期未保养</span>
            </template>
            <div class="card-content">
              <el-statistic :value="overdueCount" suffix="个" :value-style="{ color: '#f56c6c' }" />
            </div>
          </el-card>
          <el-card class="stat-card">
            <template #header>
              <span>平均保养时长</span>
            </template>
            <div class="card-content">
              <el-statistic :value="averageDuration" suffix="小时" />
            </div>
          </el-card>
        </div>

        <!-- 图表区域 -->
        <div class="charts-container">
          <el-card class="chart-card">
            <template #header>
              <span>保养计划执行趋势</span>
            </template>
            <div id="planTrendChart" class="chart"></div>
          </el-card>
          <el-card class="chart-card">
            <template #header>
              <span>模具保养状态分布</span>
            </template>
            <div id="moldStatusChart" class="chart"></div>
          </el-card>
          <el-card class="chart-card">
            <template #header>
              <span>保养类型统计</span>
            </template>
            <div id="maintenanceTypeChart" class="chart"></div>
          </el-card>
          <el-card class="chart-card">
            <template #header>
              <span>保养人员工作量统计</span>
            </template>
            <div id="personnelWorkloadChart" class="chart"></div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 创建/编辑计划对话框 -->
    <el-dialog
      v-model="planDialogVisible"
      :title="planDialogMode === 'create' ? '创建保养计划' : '编辑保养计划'"
      width="600px"
    >
      <el-form
        ref="planFormRef"
        :model="planFormData"
        :rules="planFormRules"
        label-width="120px"
      >
        <el-form-item label="模具编号" prop="moldId">
          <el-select v-model="planFormData.moldId" placeholder="请选择模具" filterable>
            <el-option
              v-for="mold in moldList"
              :key="mold.id"
              :label="`${mold.code} - ${mold.name}`"
              :value="mold.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="保养类型" prop="maintenanceType">
          <el-select v-model="planFormData.maintenanceType" placeholder="请选择保养类型">
            <el-option label="日常保养" value="日常保养" />
            <el-option label="定期保养" value="定期保养" />
            <el-option label="专项保养" value="专项保养" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划日期" prop="planDate">
          <el-date-picker v-model="planFormData.planDate" type="date" placeholder="请选择日期" />
        </el-form-item>
        <el-form-item label="预计时长" prop="estimatedDuration">
          <el-input-number v-model="planFormData.estimatedDuration" :min="0.5" :step="0.5" placeholder="请输入小时数" />
        </el-form-item>
        <el-form-item label="负责人" prop="responsiblePerson">
          <el-input v-model="planFormData.responsiblePerson" placeholder="请输入负责人姓名" />
        </el-form-item>
        <el-form-item label="保养标准" prop="standardId">
          <el-select v-model="planFormData.standardId" placeholder="请选择保养标准">
            <el-option
              v-for="standard in maintenanceStandards"
              :key="standard.id"
              :label="standard.name"
              :value="standard.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注信息" prop="remarks">
          <el-input v-model="planFormData.remarks" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitPlan">确定</el-button>
      </template>
    </el-dialog>

    <!-- 计划详情对话框 -->
    <el-dialog
      v-model="planDetailVisible"
      :title="`计划详情 - ${selectedPlan?.id || ''}`"
      width="700px"
    >
      <div v-if="selectedPlan" class="plan-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="计划ID">{{ selectedPlan.id }}</el-descriptions-item>
          <el-descriptions-item label="模具信息">{{ selectedPlan.moldCode }} - {{ selectedPlan.moldName }}</el-descriptions-item>
          <el-descriptions-item label="保养类型">{{ selectedPlan.maintenanceType }}</el-descriptions-item>
          <el-descriptions-item label="计划日期">{{ selectedPlan.planDate }}</el-descriptions-item>
          <el-descriptions-item label="实际执行日期">{{ selectedPlan.actualDate || '未执行' }}</el-descriptions-item>
          <el-descriptions-item label="预计时长">{{ selectedPlan.estimatedDuration }}小时</el-descriptions-item>
          <el-descriptions-item label="实际时长">{{ selectedPlan.actualDuration || '-' }}小时</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ selectedPlan.responsiblePerson }}</el-descriptions-item>
          <el-descriptions-item label="执行人员">{{ selectedPlan.executionPerson || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTag(selectedPlan.status)">{{ getStatusText(selectedPlan.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="保养标准">{{ selectedPlan.standardName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="起始模次">{{ selectedPlan.startShots || '-' }}</el-descriptions-item>
          <el-descriptions-item label="结束模次">{{ selectedPlan.endShots || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注信息">{{ selectedPlan.remarks || '无' }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedPlan.checkItems && selectedPlan.checkItems.length > 0" class="check-items">
          <h3>检查项目</h3>
          <el-table :data="selectedPlan.checkItems" border>
            <el-table-column prop="name" label="检查项" width="200" />
            <el-table-column prop="standard" label="标准" />
            <el-table-column prop="result" label="检查结果" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.result === 'pass' ? 'success' : 'danger'">
                  {{ scope.row.result === 'pass' ? '合格' : '不合格' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" />
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button @click="planDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 创建/编辑标准对话框 -->
    <el-dialog
      v-model="standardDialogVisible"
      :title="standardDialogMode === 'create' ? '创建保养标准' : '编辑保养标准'"
      width="600px"
    >
      <el-form
        ref="standardFormRef"
        :model="standardFormData"
        :rules="standardFormRules"
        label-width="120px"
      >
        <el-form-item label="标准名称" prop="name">
          <el-input v-model="standardFormData.name" placeholder="请输入标准名称" />
        </el-form-item>
        <el-form-item label="适用模具类型" prop="moldType">
          <el-select v-model="standardFormData.moldType" placeholder="请选择模具类型">
            <el-option v-for="type in moldTypes" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>
        <el-form-item label="保养周期(模次)" prop="maintenanceCycle">
          <el-input-number v-model="standardFormData.maintenanceCycle" :min="1" placeholder="请输入保养周期" />
        </el-form-item>
        <el-form-item label="保养频率" prop="frequency">
          <el-select v-model="standardFormData.frequency" placeholder="请选择保养频率">
            <el-option label="按模次" value="按模次" />
            <el-option label="每周" value="每周" />
            <el-option label="每月" value="每月" />
            <el-option label="每季度" value="每季度" />
          </el-select>
        </el-form-item>
        <el-form-item label="标准内容" prop="content">
          <el-input v-model="standardFormData.content" type="textarea" :rows="4" placeholder="请输入标准内容" />
        </el-form-item>
        <el-form-item label="注意事项" prop="notes">
          <el-input v-model="standardFormData.notes" type="textarea" :rows="3" placeholder="请输入注意事项" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="standardDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitStandard">确定</el-button>
      </template>
    </el-dialog>

    <!-- 确认对话框 -->
    <el-dialog
      v-model="confirmVisible"
      :title="confirmTitle"
      width="30%"
    >
      <span>{{ confirmMessage }}</span>
      <template #footer>
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button type="danger" @click="handleConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download } from '@element-plus/icons-vue'

// 响应式数据
const activeTab = ref('plan')

// 模具列表
const moldList = ref([
  { id: 1, code: 'M001', name: '产品A上模' },
  { id: 2, code: 'M002', name: '产品B下模' },
  { id: 3, code: 'M003', name: '产品C侧模' },
  { id: 4, code: 'M004', name: '产品A下模' },
  { id: 5, code: 'M005', name: '产品D前模' }
])

// 模具类型
const moldTypes = ['注塑模', '冲压模', '压铸模', '锻造模', '其他']

// 保养计划相关
const maintenancePlans = ref([])
const planLoading = ref(false)
const planSearchForm = reactive({
  keyword: '',
  status: '',
  planDate: []
})
const planCurrentPage = ref(1)
const planPageSize = ref(20)
const planDialogVisible = ref(false)
const planDialogMode = ref('create')
const planFormRef = ref(null)
const planFormData = reactive({
  id: '',
  moldId: '',
  moldCode: '',
  moldName: '',
  maintenanceType: '',
  planDate: '',
  estimatedDuration: 2,
  responsiblePerson: '',
  standardId: '',
  standardName: '',
  remarks: ''
})
const planFormRules = {
  moldId: [
    { required: true, message: '请选择模具', trigger: 'change' }
  ],
  maintenanceType: [
    { required: true, message: '请选择保养类型', trigger: 'change' }
  ],
  planDate: [
    { required: true, message: '请选择计划日期', trigger: 'change' }
  ],
  estimatedDuration: [
    { required: true, message: '请输入预计时长', trigger: 'blur' },
    { type: 'number', min: 0.5, message: '预计时长不能小于0.5小时', trigger: 'blur' }
  ],
  responsiblePerson: [
    { required: true, message: '请输入负责人', trigger: 'blur' }
  ]
}
const selectedPlan = ref(null)
const planDetailVisible = ref(false)

// 保养记录相关
const maintenanceRecords = ref([])
const recordLoading = ref(false)
const recordSearchForm = reactive({
  keyword: '',
  maintenancePerson: '',
  executionDate: []
})
const recordCurrentPage = ref(1)
const recordPageSize = ref(20)

// 保养标准相关
const maintenanceStandards = ref([])
const standardLoading = ref(false)
const standardSearchForm = reactive({
  keyword: '',
  moldType: ''
})
const standardCurrentPage = ref(1)
const standardPageSize = ref(20)
const standardDialogVisible = ref(false)
const standardDialogMode = ref('create')
const standardFormRef = ref(null)
const standardFormData = reactive({
  id: '',
  name: '',
  moldType: '',
  maintenanceCycle: 5000,
  frequency: '按模次',
  content: '',
  notes: '',
  version: '1.0',
  createdBy: '系统管理员',
  createdAt: ''
})
const standardFormRules = {
  name: [
    { required: true, message: '请输入标准名称', trigger: 'blur' }
  ],
  moldType: [
    { required: true, message: '请选择模具类型', trigger: 'change' }
  ],
  maintenanceCycle: [
    { required: true, message: '请输入保养周期', trigger: 'blur' },
    { type: 'number', min: 1, message: '保养周期必须大于0', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入标准内容', trigger: 'blur' }
  ]
}

// 确认对话框
const confirmVisible = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref('')
const confirmData = ref(null)

// 计算属性 - 计划筛选和分页
const filteredPlans = computed(() => {
  return maintenancePlans.value.filter(plan => {
    // 关键词搜索
    if (planSearchForm.keyword) {
      const keyword = planSearchForm.keyword.toLowerCase()
      if (!plan.moldCode.toLowerCase().includes(keyword) && 
          !plan.moldName.toLowerCase().includes(keyword)) {
        return false
      }
    }
    
    // 状态筛选
    if (planSearchForm.status && plan.status !== planSearchForm.status) {
      return false
    }
    
    // 日期范围筛选
    if (planSearchForm.planDate && planSearchForm.planDate.length === 2) {
      const [startDate, endDate] = planSearchForm.planDate
      if (plan.planDate < startDate || plan.planDate > endDate) {
        return false
      }
    }
    
    return true
  })
})

const paginatedPlans = computed(() => {
  const startIndex = (planCurrentPage.value - 1) * planPageSize.value
  const endIndex = startIndex + planPageSize.value
  return filteredPlans.value.slice(startIndex, endIndex)
})

// 计算属性 - 记录筛选和分页
const filteredRecords = computed(() => {
  return maintenanceRecords.value.filter(record => {
    // 关键词搜索
    if (recordSearchForm.keyword) {
      const keyword = recordSearchForm.keyword.toLowerCase()
      if (!record.moldCode.toLowerCase().includes(keyword) && 
          !record.moldName.toLowerCase().includes(keyword)) {
        return false
      }
    }
    
    // 保养人员筛选
    if (recordSearchForm.maintenancePerson && 
        !record.maintenancePerson.toLowerCase().includes(recordSearchForm.maintenancePerson.toLowerCase())) {
      return false
    }
    
    // 日期范围筛选
    if (recordSearchForm.executionDate && recordSearchForm.executionDate.length === 2) {
      const [startDate, endDate] = recordSearchForm.executionDate
      if (record.executionDate < startDate || record.executionDate > endDate) {
        return false
      }
    }
    
    return true
  })
})

const paginatedRecords = computed(() => {
  const startIndex = (recordCurrentPage.value - 1) * recordPageSize.value
  const endIndex = startIndex + recordPageSize.value
  return filteredRecords.value.slice(startIndex, endIndex)
})

// 计算属性 - 标准筛选和分页
const filteredStandards = computed(() => {
  return maintenanceStandards.value.filter(standard => {
    // 关键词搜索
    if (standardSearchForm.keyword && 
        !standard.name.toLowerCase().includes(standardSearchForm.keyword.toLowerCase())) {
      return false
    }
    
    // 模具类型筛选
    if (standardSearchForm.moldType && standard.moldType !== standardSearchForm.moldType) {
      return false
    }
    
    return true
  })
})

const paginatedStandards = computed(() => {
  const startIndex = (standardCurrentPage.value - 1) * standardPageSize.value
  const endIndex = startIndex + standardPageSize.value
  return filteredStandards.value.slice(startIndex, endIndex)
})

// 统计数据
const monthlyPlans = computed(() => {
  const now = new Date()
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return maintenancePlans.value.filter(plan => plan.planDate.startsWith(yearMonth)).length
})

const monthlyCompleted = computed(() => {
  const now = new Date()
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return maintenancePlans.value.filter(plan => 
    plan.planDate.startsWith(yearMonth) && plan.status === 'completed'
  ).length
})

const overdueCount = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return maintenancePlans.value.filter(plan => 
    plan.planDate < today && plan.status === 'pending'
  ).length
})

const averageDuration = computed(() => {
  const completedPlans = maintenancePlans.value.filter(plan => 
    plan.status === 'completed' && plan.actualDuration
  )
  if (completedPlans.length === 0) return 0
  
  const totalDuration = completedPlans.reduce((sum, plan) => sum + plan.actualDuration, 0)
  return (totalDuration / completedPlans.length).toFixed(1)
})

// 生命周期钩子
onMounted(() => {
  loadData()
})

// 方法
const loadData = () => {
  loadMaintenancePlans()
  loadMaintenanceRecords()
  loadMaintenanceStandards()
}

const loadMaintenancePlans = () => {
  planLoading.value = true
  
  // 模拟异步加载
  setTimeout(() => {
    maintenancePlans.value = [
      {
        id: 'MP20240110001',
        moldId: 1,
        moldCode: 'M001',
        moldName: '产品A上模',
        maintenanceType: '日常保养',
        planDate: '2024-01-20',
        estimatedDuration: 2,
        actualDuration: null,
        actualDate: null,
        responsiblePerson: '张师傅',
        executionPerson: null,
        standardId: 1,
        standardName: '注塑模日常保养标准',
        status: 'pending',
        startShots: null,
        endShots: null,
        remarks: '定期保养计划',
        checkItems: []
      },
      {
        id: 'MP20240110002',
        moldId: 2,
        moldCode: 'M002',
        moldName: '产品B下模',
        maintenanceType: '定期保养',
        planDate: '2024-01-15',
        estimatedDuration: 4,
        actualDuration: 4.5,
        actualDate: '2024-01-15',
        responsiblePerson: '李师傅',
        executionPerson: '李师傅',
        standardId: 2,
        standardName: '注塑模定期保养标准',
        status: 'completed',
        startShots: 12000,
        endShots: 12000,
        remarks: '已完成保养',
        checkItems: [
          { name: '模具外观清洁', standard: '无油污、无杂物', result: 'pass', remark: '' },
          { name: '顶针磨损检查', standard: '磨损量<0.1mm', result: 'pass', remark: '' },
          { name: '冷却系统检查', standard: '无堵塞、无泄漏', result: 'pass', remark: '正常' },
          { name: '模仁磨损检查', standard: '无明显磨损', result: 'pass', remark: '轻微磨损，可继续使用' }
        ]
      },
      {
        id: 'MP20240110003',
        moldId: 3,
        moldCode: 'M003',
        moldName: '产品C侧模',
        maintenanceType: '专项保养',
        planDate: '2024-01-10',
        estimatedDuration: 8,
        actualDuration: null,
        actualDate: null,
        responsiblePerson: '王师傅',
        executionPerson: null,
        standardId: 3,
        standardName: '侧抽芯模具专项保养标准',
        status: 'overdue',
        startShots: null,
        endShots: null,
        remarks: '需要更换部分零件',
        checkItems: []
      }
    ]
    planLoading.value = false
  }, 500)
}

const loadMaintenanceRecords = () => {
  recordLoading.value = true
  
  // 模拟异步加载
  setTimeout(() => {
    maintenanceRecords.value = [
      {
        id: 'MR20240115001',
        planId: 'MP20240110002',
        moldId: 2,
        moldCode: 'M002',
        moldName: '产品B下模',
        maintenanceType: '定期保养',
        executionDate: '2024-01-15',
        startShots: 12000,
        endShots: 12000,
        maintenancePerson: '李师傅',
        assistantPerson: '王师傅',
        result: 'pass',
        description: '完成全部保养项目，模具状态良好',
        recommendations: '继续按计划保养',
        attachments: []
      },
      {
        id: 'MR20240108001',
        planId: 'MP20240105001',
        moldId: 1,
        moldCode: 'M001',
        moldName: '产品A上模',
        maintenanceType: '日常保养',
        executionDate: '2024-01-08',
        startShots: 14500,
        endShots: 14500,
        maintenancePerson: '张师傅',
        assistantPerson: '',
        result: 'pass',
        description: '清洁模具，检查各部件正常',
        recommendations: '',
        attachments: []
      }
    ]
    recordLoading.value = false
  }, 500)
}

const loadMaintenanceStandards = () => {
  standardLoading.value = true
  
  // 模拟异步加载
  setTimeout(() => {
    maintenanceStandards.value = [
      {
        id: 1,
        name: '注塑模日常保养标准',
        moldType: '注塑模',
        maintenanceCycle: 1000,
        frequency: '按模次',
        content: '1. 清洁模具表面油污和杂物\n2. 检查顶针运动是否顺畅\n3. 检查冷却系统是否正常\n4. 检查模具紧固螺丝是否松动',
        notes: '日常保养由操作人员负责，保养后需填写记录',
        version: '1.0',
        createdBy: '技术部',
        createdAt: '2023-12-01'
      },
      {
        id: 2,
        name: '注塑模定期保养标准',
        moldType: '注塑模',
        maintenanceCycle: 5000,
        frequency: '按模次',
        content: '1. 全面清洁模具\n2. 检查所有顶针、滑块磨损情况\n3. 检查模具表面硬度\n4. 更换磨损严重的零件\n5. 重新润滑所有运动部件',
        notes: '定期保养由专业维修人员负责，需在设备停机时进行',
        version: '1.2',
        createdBy: '技术部',
        createdAt: '2023-11-15'
      },
      {
        id: 3,
        name: '侧抽芯模具专项保养标准',
        moldType: '注塑模',
        maintenanceCycle: 8000,
        frequency: '按模次',
        content: '1. 检查侧抽芯机构运动是否顺畅\n2. 检查斜导柱磨损情况\n3. 检查滑块定位是否准确\n4. 更换磨损的滑块耐磨板\n5. 重新调整侧抽芯行程',
        notes: '专项保养需由经验丰富的模具技师操作',
        version: '1.0',
        createdBy: '技术部',
        createdAt: '2023-10-20'
      }
    ]
    standardLoading.value = false
  }, 500)
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '待执行',
    in_progress: '执行中',
    completed: '已完成',
    overdue: '已逾期'
  }
  return statusMap[status] || '未知'
}

const getStatusTag = (status) => {
  const tagMap = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
    overdue: 'danger'
  }
  return tagMap[status] || 'info'
}

const getMaintenanceTypeTag = (type) => {
  const typeMap = {
    '日常保养': 'primary',
    '定期保养': 'success',
    '专项保养': 'warning'
  }
  return typeMap[type] || 'info'
}

// 计划相关方法
const resetPlanForm = () => {
  Object.assign(planFormData, {
    id: '',
    moldId: '',
    moldCode: '',
    moldName: '',
    maintenanceType: '',
    planDate: '',
    estimatedDuration: 2,
    responsiblePerson: '',
    standardId: '',
    standardName: '',
    remarks: ''
  })
  if (planFormRef.value) {
    planFormRef.value.resetFields()
  }
}

const handleCreatePlan = () => {
  planDialogMode.value = 'create'
  resetPlanForm()
  planDialogVisible.value = true
}

const handleEditPlan = (plan) => {
  planDialogMode.value = 'edit'
  Object.assign(planFormData, { ...plan })
  planDialogVisible.value = true
}

const handleViewPlan = (plan) => {
  selectedPlan.value = { ...plan }
  planDetailVisible.value = true
}

const handleSubmitPlan = () => {
  planFormRef.value.validate((valid) => {
    if (!valid) return
    
    // 获取模具信息
    const selectedMold = moldList.value.find(m => m.id === planFormData.moldId)
    if (selectedMold) {
      planFormData.moldCode = selectedMold.code
      planFormData.moldName = selectedMold.name
    }
    
    // 获取标准信息
    const selectedStandard = maintenanceStandards.value.find(s => s.id === planFormData.standardId)
    if (selectedStandard) {
      planFormData.standardName = selectedStandard.name
    }
    
    planLoading.value = true
    
    // 模拟保存操作
    setTimeout(() => {
      if (planDialogMode.value === 'create') {
        // 新增计划
        const newPlan = { ...planFormData, id: `MP${Date.now()}`, status: 'pending' }
        maintenancePlans.value.unshift(newPlan)
        ElMessage.success('保养计划创建成功')
      } else {
        // 编辑计划
        const index = maintenancePlans.value.findIndex(p => p.id === planFormData.id)
        if (index > -1) {
          maintenancePlans.value[index] = { ...planFormData }
          ElMessage.success('保养计划更新成功')
        }
      }
      
      planDialogVisible.value = false
      planLoading.value = false
    }, 500)
  })
}

const handlePlanAction = (plan) => {
  if (plan.status === 'pending') {
    // 开始执行计划
    confirmTitle.value = '确认开始'
    confirmMessage.value = `确定要开始执行保养计划 ${plan.id} 吗？`
    confirmAction.value = 'start_plan'
    confirmData.value = plan
    confirmVisible.value = true
  } else {
    // 删除计划
    handleDeletePlan(plan)
  }
}

const handleDeletePlan = (plan) => {
  confirmTitle.value = '确认删除'
  confirmMessage.value = `确定要删除保养计划 ${plan.id} 吗？`
  confirmAction.value = 'delete_plan'
  confirmData.value = plan
  confirmVisible.value = true
}

const handlePlanSearch = () => {
  planCurrentPage.value = 1
}

const handlePlanReset = () => {
  Object.assign(planSearchForm, {
    keyword: '',
    status: '',
    planDate: []
  })
  planCurrentPage.value = 1
}

const handlePlanSort = (column) => {
  const { prop, order } = column
  filteredPlans.value.sort((a, b) => {
    if (order === 'ascending') {
      return a[prop] > b[prop] ? 1 : -1
    } else {
      return a[prop] < b[prop] ? 1 : -1
    }
  })
}

const handlePlanSizeChange = (size) => {
  planPageSize.value = size
  planCurrentPage.value = 1
}

const handlePlanCurrentChange = (current) => {
  planCurrentPage.value = current
}

// 记录相关方法
const handleViewRecord = (record) => {
  // 在实际项目中，这里可以打开记录详情对话框
  ElMessage.info('记录详情功能开发中...')
}

const handleDeleteRecord = (record) => {
  confirmTitle.value = '确认删除'
  confirmMessage.value = `确定要删除保养记录 ${record.id} 吗？`
  confirmAction.value = 'delete_record'
  confirmData.value = record
  confirmVisible.value = true
}

const handleRecordSearch = () => {
  recordCurrentPage.value = 1
}

const handleRecordReset = () => {
  Object.assign(recordSearchForm, {
    keyword: '',
    maintenancePerson: '',
    executionDate: []
  })
  recordCurrentPage.value = 1
}

const handleRecordSort = (column) => {
  const { prop, order } = column
  filteredRecords.value.sort((a, b) => {
    if (order === 'ascending') {
      return a[prop] > b[prop] ? 1 : -1
    } else {
      return a[prop] < b[prop] ? 1 : -1
    }
  })
}

const handleRecordSizeChange = (size) => {
  recordPageSize.value = size
  recordCurrentPage.value = 1
}

const handleRecordCurrentChange = (current) => {
  recordCurrentPage.value = current
}

// 标准相关方法
const resetStandardForm = () => {
  Object.assign(standardFormData, {
    id: '',
    name: '',
    moldType: '',
    maintenanceCycle: 5000,
    frequency: '按模次',
    content: '',
    notes: '',
    version: '1.0',
    createdBy: '系统管理员',
    createdAt: ''
  })
  if (standardFormRef.value) {
    standardFormRef.value.resetFields()
  }
}

const handleCreateStandard = () => {
  standardDialogMode.value = 'create'
  resetStandardForm()
  standardDialogVisible.value = true
}

const handleEditStandard = (standard) => {
  standardDialogMode.value = 'edit'
  Object.assign(standardFormData, { ...standard })
  standardDialogVisible.value = true
}

const handleViewStandard = (standard) => {
  // 在实际项目中，这里可以打开标准详情对话框
  ElMessage.info('标准详情功能开发中...')
}

const handleDeleteStandard = (standard) => {
  confirmTitle.value = '确认删除'
  confirmMessage.value = `确定要删除保养标准 ${standard.name} 吗？`
  confirmAction.value = 'delete_standard'
  confirmData.value = standard
  confirmVisible.value = true
}

const handleSubmitStandard = () => {
  standardFormRef.value.validate((valid) => {
    if (!valid) return
    
    standardLoading.value = true
    
    // 模拟保存操作
    setTimeout(() => {
      if (standardDialogMode.value === 'create') {
        // 新增标准
        const newStandard = { 
          ...standardFormData, 
          id: Date.now(),
          createdAt: new Date().toISOString().split('T')[0]
        }
        maintenanceStandards.value.push(newStandard)
        ElMessage.success('保养标准创建成功')
      } else {
        // 编辑标准
        const index = maintenanceStandards.value.findIndex(s => s.id === standardFormData.id)
        if (index > -1) {
          maintenanceStandards.value[index] = { ...standardFormData }
          ElMessage.success('保养标准更新成功')
        }
      }
      
      standardDialogVisible.value = false
      standardLoading.value = false
    }, 500)
  })
}

const handleStandardSearch = () => {
  standardCurrentPage.value = 1
}

const handleStandardReset = () => {
  Object.assign(standardSearchForm, {
    keyword: '',
    moldType: ''
  })
  standardCurrentPage.value = 1
}

const handleStandardSizeChange = (size) => {
  standardPageSize.value = size
  standardCurrentPage.value = 1
}

const handleStandardCurrentChange = (current) => {
  standardCurrentPage.value = current
}

// 确认操作
const handleConfirm = () => {
  switch (confirmAction.value) {
    case 'start_plan':
      startPlanExecution()
      break
    case 'delete_plan':
      deletePlan()
      break
    case 'delete_record':
      deleteRecord()
      break
    case 'delete_standard':
      deleteStandard()
      break
  }
}

const startPlanExecution = () => {
  planLoading.value = true
  setTimeout(() => {
    const index = maintenancePlans.value.findIndex(p => p.id === confirmData.value.id)
    if (index > -1) {
      maintenancePlans.value[index].status = 'in_progress'
      maintenancePlans.value[index].actualDate = new Date().toISOString().split('T')[0]
      maintenancePlans.value[index].executionPerson = maintenancePlans.value[index].responsiblePerson
    }
    confirmVisible.value = false
    planLoading.value = false
    ElMessage.success('开始执行保养计划')
  }, 500)
}

const deletePlan = () => {
  planLoading.value = true
  setTimeout(() => {
    const index = maintenancePlans.value.findIndex(p => p.id === confirmData.value.id)
    if (index > -1) {
      maintenancePlans.value.splice(index, 1)
    }
    confirmVisible.value = false
    planLoading.value = false
    ElMessage.success('保养计划删除成功')
  }, 500)
}

const deleteRecord = () => {
  recordLoading.value = true
  setTimeout(() => {
    const index = maintenanceRecords.value.findIndex(r => r.id === confirmData.value.id)
    if (index > -1) {
      maintenanceRecords.value.splice(index, 1)
    }
    confirmVisible.value = false
    recordLoading.value = false
    ElMessage.success('保养记录删除成功')
  }, 500)
}

const deleteStandard = () => {
  standardLoading.value = true
  setTimeout(() => {
    const index = maintenanceStandards.value.findIndex(s => s.id === confirmData.value.id)
    if (index > -1) {
      maintenanceStandards.value.splice(index, 1)
    }
    confirmVisible.value = false
    standardLoading.value = false
    ElMessage.success('保养标准删除成功')
  }, 500)
}

// 标签页切换
const handleTabChange = () => {
  // 标签页切换时可以进行相应的初始化操作
  if (activeTab.value === 'statistics') {
    // 统计页切换时，这里可以初始化图表
    nextTick(() => {
      // 这里应该初始化ECharts图表
      // initCharts()
    })
  }
}

// 导出功能
const handleExport = () => {
  let dataToExport = []
  let fileName = ''
  
  switch (activeTab.value) {
    case 'plan':
      dataToExport = filteredPlans.value
      fileName = `模具保养计划_${new Date().toISOString().split('T')[0]}`
      break
    case 'record':
      dataToExport = filteredRecords.value
      fileName = `模具保养记录_${new Date().toISOString().split('T')[0]}`
      break
    case 'standard':
      dataToExport = filteredStandards.value
      fileName = `模具保养标准_${new Date().toISOString().split('T')[0]}`
      break
    default:
      ElMessage.warning('暂不支持该类型数据导出')
      return
  }
  
  if (dataToExport.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  
  ElMessage.success('数据导出功能开发中...')
  // 实际项目中可以使用如 xlsx 等库实现Excel导出
}
</script>

<style scoped>
.mold-maintenance {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.maintenance-tabs {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-bar {
  background: white;
  padding: 20px;
  margin-bottom: 0;
  border-bottom: 1px solid #ebeef5;
}

.table-card {
  background: white;
  margin-bottom: 0;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 20px;
  background: white;
  border-top: 1px solid #ebeef5;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px;
  margin-bottom: 20px;
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.card-content {
  text-align: center;
  padding: 10px 0;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  padding: 0 20px 20px;
}

.chart-card {
  height: 300px;
}

.chart {
  height: 240px;
  width: 100%;
}

.plan-detail {
  padding: 10px 0;
}

.check-items {
  margin-top: 30px;
}

.check-items h3 {
  font-size: 16px;
  margin-bottom: 15px;
  color: #303133;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.standard-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .filter-bar .el-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .pagination {
    justify-content: center;
  }
}
</style>
EOF