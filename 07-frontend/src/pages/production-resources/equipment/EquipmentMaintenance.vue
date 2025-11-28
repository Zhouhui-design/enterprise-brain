<template>
  <div class="equipment-maintenance">
    <div class="header">
      <div class="header-left">
          <h1>设备保养管理</h1>
          <div class="stats-cards">
            <div class="stat-card">
              <div class="stat-icon primary">
                <Calendar />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ monthlyPlans }}</div>
                <div class="stat-label">本月计划</div>
                <div class="stat-unit">次</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon success">
                <Check />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ completedMaintenances }}</div>
                <div class="stat-label">已完成保养</div>
                <div class="stat-unit">次</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon warning">
                <Clock />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ pendingMaintenances }}</div>
                <div class="stat-label">待处理保养</div>
                <div class="stat-unit">次</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon success">
                <TrendCharts />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ timelyRate.toFixed(1) }}</div>
                <div class="stat-label">保养及时率</div>
                <div class="stat-unit">%</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon warning">
                <CircleDollarSign />
              </div>
              <div class="stat-info">
                <div class="stat-value">¥{{ totalCost }}</div>
                <div class="stat-label">本月保养费用</div>
                <div class="stat-unit">元</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon danger">
                <Warning />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ abnormalDevices }}</div>
                <div class="stat-label">异常设备</div>
                <div class="stat-unit">台</div>
              </div>
            </div>
          </div>
        </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreatePlan">
            <template #icon><Plus /></template>
            创建保养计划
          </el-button>
          <el-dropdown @command="handleExportData">
            <el-button>
              <template #icon><Download /></template>
              导出数据
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="excel">Excel格式</el-dropdown-item>
                <el-dropdown-item command="pdf">PDF格式</el-dropdown-item>
                <el-dropdown-item command="print">打印</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
      </div>
    </div>

    <el-tabs v-model="activeTab" @tab-click="handleTabChange" class="maintenance-tabs">
      <el-tab-pane label="保养计划" name="plans">
        <div class="tab-content">
          <!-- 保养计划工具栏 -->
          <div class="toolbar">
            <el-input v-model="planSearchKeyword" placeholder="搜索计划名称/设备/负责人" style="width: 250px">
              <template #append>
                <el-button :icon="Search" @click="handlePlanSearch" />
              </template>
            </el-input>
            <el-select v-model="planStatusFilter" placeholder="计划状态" @change="handlePlanSearch">
              <el-option label="全部" value="" />
              <el-option label="待执行" value="pending" />
              <el-option label="执行中" value="in_progress" />
              <el-option label="已完成" value="completed" />
              <el-option label="已逾期" value="overdue" />
            </el-select>
            <el-select v-model="planEquipmentTypeFilter" placeholder="设备类型" @change="handlePlanSearch">
              <el-option label="全部" value="" />
              <el-option label="注塑机" value="注塑机" />
              <el-option label="CNC机床" value="CNC机床" />
              <el-option label="机器人" value="机器人" />
              <el-option label="测量设备" value="测量设备" />
              <el-option label="切割设备" value="切割设备" />
            </el-select>
            <el-date-picker
              v-model="planDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="handlePlanSearch"
              style="width: 300px"
            />
            <el-dropdown @command="handleBatchOperation" v-if="selectedPlans.length > 0">
            <el-button type="success">
              <template #icon><Operation /></template>
              批量操作({{ selectedPlans.length }})
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="execute">批量执行</el-dropdown-item>
                <el-dropdown-item command="complete">批量完成</el-dropdown-item>
                <el-dropdown-item command="delete" divided>批量删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="success" v-else @click="handleBatchExecute">
            <template #icon><Operation /></template>
            批量执行
          </el-button>
          </div>

          <!-- 保养计划列表 -->
          <el-table 
            :data="filteredPlans" 
            style="width: 100%" 
            @selection-change="handlePlanSelectionChange"
            border
            stripe
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="id" label="计划编号" width="120" />
            <el-table-column prop="name" label="计划名称" />
            <el-table-column prop="equipmentName" label="设备名称" width="180" />
            <el-table-column prop="equipmentCode" label="设备编号" width="120" />
            <el-table-column prop="type" label="保养类型" width="100">
              <template #default="scope">
                <el-tag :type="getPlanTypeColor(scope.row.type)">
                  {{ scope.row.type === 'preventive' ? '预防性' : '日常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="scheduledDate" label="计划日期" width="150" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getPlanStatusColor(scope.row.status)">
                  {{ getPlanStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="assignee" label="负责人" width="120" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <el-button 
                  size="small" 
                  type="primary" 
                  @click="handleExecutePlan(scope.row)"
                  v-if="scope.row.status === 'pending'"
                >
                  执行
                </el-button>
                <el-button 
                  size="small" 
                  type="info" 
                  @click="handleViewPlan(scope.row)"
                >
                  详情
                </el-button>
                <el-button 
                  size="small" 
                  type="warning" 
                  @click="handleEditPlan(scope.row)"
                  v-if="scope.row.status === 'pending'"
                >
                  编辑
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="handleDeletePlan(scope.row)"
                  v-if="scope.row.status === 'pending'"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredPlans.length"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="保养记录" name="records">
        <div class="tab-content">
          <!-- 保养记录工具栏 -->
          <div class="toolbar">
            <el-input v-model="recordSearchKeyword" placeholder="搜索记录/设备" style="width: 250px">
              <template #append>
                <el-button :icon="Search" @click="handleRecordSearch" />
              </template>
            </el-input>
            <el-select v-model="recordTypeFilter" placeholder="保养类型" @change="handleRecordSearch">
              <el-option label="全部" value="" />
              <el-option label="预防性保养" value="preventive" />
              <el-option label="日常保养" value="daily" />
              <el-option label="故障修复" value="repair" />
            </el-select>
            <el-date-picker
              v-model="recordDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="handleRecordSearch"
              style="width: 300px"
            />
            <el-button type="primary" @click="handleCreateRecord">创建记录</el-button>
          </div>

          <!-- 保养记录列表 -->
          <el-table 
            :data="filteredRecords" 
            style="width: 100%" 
            border
            stripe
          >
            <el-table-column prop="id" label="记录编号" width="120" />
            <el-table-column prop="equipmentName" label="设备名称" width="180" />
            <el-table-column prop="equipmentCode" label="设备编号" width="120" />
            <el-table-column prop="type" label="保养类型" width="100">
              <template #default="scope">
                <el-tag :type="getRecordTypeColor(scope.row.type)">
                  {{ getRecordTypeText(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="executor" label="执行人" width="120" />
            <el-table-column prop="executionDate" label="执行日期" width="150" />
            <el-table-column prop="duration" label="耗时(h)" width="100" />
            <el-table-column prop="cost" label="费用(元)" width="100">
              <template #default="scope">
                ¥{{ scope.row.cost }}
              </template>
            </el-table-column>
            <el-table-column prop="efficiency" label="设备效率" width="120" v-if="scope.row.status === 'normal'">
              <template #default="scope">
                <el-progress 
                  :percentage="scope.row.efficiency || 0" 
                  :show-text="false"
                  :color="scope.row.efficiency >= 90 ? '#67C23A' : scope.row.efficiency >= 70 ? '#E6A23C' : '#F56C6C'"
                  class="mini-progress"
                />
                <span style="margin-left: 5px;">{{ scope.row.efficiency || 0 }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="结果" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'normal' ? 'success' : 'danger'">
                  {{ scope.row.status === 'normal' ? '正常' : '异常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <el-button 
                  size="small" 
                  type="primary" 
                  @click="handleViewRecord(scope.row)"
                >
                  详情
                </el-button>
                <el-button 
                  size="small" 
                  type="warning" 
                  @click="handleEditRecord(scope.row)"
                >
                  编辑
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="handleDeleteRecord(scope.row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentRecordPage"
              v-model:page-size="recordPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredRecords.length"
              @size-change="handleRecordSizeChange"
              @current-change="handleRecordCurrentChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="保养标准" name="standards">
        <div class="tab-content">
          <!-- 保养标准工具栏 -->
          <div class="toolbar">
            <el-input v-model="standardSearchKeyword" placeholder="搜索标准名称/设备" style="width: 250px">
              <template #append>
                <el-button :icon="Search" @click="handleStandardSearch" />
              </template>
            </el-input>
            <el-select v-model="standardTypeFilter" placeholder="标准类型" @change="handleStandardSearch">
              <el-option label="全部" value="" />
              <el-option label="一级保养" value="level1" />
              <el-option label="二级保养" value="level2" />
              <el-option label="三级保养" value="level3" />
            </el-select>
            <el-button type="primary" @click="handleCreateStandard">创建标准</el-button>
          </div>

          <!-- 保养标准列表 -->
          <el-table 
            :data="filteredStandards" 
            style="width: 100%" 
            border
            stripe
          >
            <el-table-column prop="id" label="标准编号" width="120" />
            <el-table-column prop="name" label="标准名称" />
            <el-table-column prop="equipmentType" label="适用设备类型" width="150" />
            <el-table-column prop="type" label="标准级别" width="100">
              <template #default="scope">
                <el-tag :type="getStandardTypeColor(scope.row.type)">
                  {{ getStandardTypeText(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="cycle" label="保养周期(天)" width="120" />
            <el-table-column prop="duration" label="标准工时(h)" width="120" />
            <el-table-column prop="lastUpdated" label="最后更新" width="150" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <el-button 
                  size="small" 
                  type="primary" 
                  @click="handleViewStandard(scope.row)"
                >
                  详情
                </el-button>
                <el-button 
                  size="small" 
                  type="warning" 
                  @click="handleEditStandard(scope.row)"
                >
                  编辑
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="handleDeleteStandard(scope.row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentStandardPage"
              v-model:page-size="standardPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredStandards.length"
              @size-change="handleStandardSizeChange"
              @current-change="handleStandardCurrentChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="统计分析" name="statistics">
        <div class="tab-content">
          <!-- 统计图表 -->
          <div class="chart-row">
            <div class="chart-item">
              <h3>保养类型分布</h3>
              <div ref="maintenanceTypeChartRef" style="height: 300px;"></div>
            </div>
            <div class="chart-item">
              <h3>月度保养趋势</h3>
              <div ref="monthlyTrendChartRef" style="height: 300px;"></div>
            </div>
          </div>
          <div class="chart-row">
            <div class="chart-item">
              <h3>设备保养费用统计</h3>
              <div ref="maintenanceCostChartRef" style="height: 300px;"></div>
            </div>
            <div class="chart-item">
              <h3>保养及时率统计</h3>
              <div ref="timelyRateChartRef" style="height: 300px;"></div>
            </div>
          </div>

          <!-- 统计表格 -->
          <div class="statistics-table">
            <h3>设备保养绩效</h3>
            <el-table :data="equipmentPerformance" style="width: 100%" border stripe>
              <el-table-column prop="equipmentName" label="设备名称" width="180" />
              <el-table-column prop="plannedCount" label="计划次数" width="100" />
              <el-table-column prop="completedCount" label="完成次数" width="100" />
              <el-table-column prop="completionRate" label="完成率" width="120">
                <template #default="scope">
                  <el-progress 
                    :percentage="scope.row.completionRate" 
                    :format-tooltip="() => `${scope.row.completionRate}%`"
                    :color="getCompletionRateColor(scope.row.completionRate)"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="timelyRate" label="及时率" width="120">
                <template #default="scope">
                  <el-progress 
                    :percentage="scope.row.timelyRate" 
                    :format-tooltip="() => `${scope.row.timelyRate}%`"
                    :color="getCompletionRateColor(scope.row.timelyRate)"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="totalCost" label="总费用(元)" width="120">
                <template #default="scope">
                  ¥{{ scope.row.totalCost.toFixed(2) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 创建/编辑保养计划对话框 -->
    <el-dialog v-model="planDialogVisible" :title="planDialogTitle" width="700px">
      <el-form :model="planForm" :rules="planRules" ref="planFormRef" label-width="120px">
        <el-form-item label="计划名称" prop="name">
          <el-input v-model="planForm.name" placeholder="请输入计划名称" />
        </el-form-item>
        <el-form-item label="设备" prop="equipmentId">
          <el-select v-model="planForm.equipmentId" placeholder="请选择设备">
            <el-option 
              v-for="equipment in equipments" 
              :key="equipment.id" 
              :label="`${equipment.name}(${equipment.code})`" 
              :value="equipment.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="保养类型" prop="type">
          <el-radio-group v-model="planForm.type">
            <el-radio label="preventive">预防性保养</el-radio>
            <el-radio label="daily">日常保养</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="计划日期" prop="scheduledDate">
          <el-date-picker v-model="planForm.scheduledDate" type="date" placeholder="请选择计划日期" />
        </el-form-item>
        <el-form-item label="负责人" prop="assignee">
          <el-input v-model="planForm.assignee" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="预计工时(h)" prop="estimatedHours">
          <el-input-number v-model="planForm.estimatedHours" :min="0.5" :step="0.5" />
        </el-form-item>
        <el-form-item label="保养内容" prop="content">
          <el-input v-model="planForm.content" type="textarea" rows="4" placeholder="请输入保养内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="planDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSavePlan">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 保养计划详情对话框 -->
    <el-dialog v-model="planDetailDialogVisible" title="保养计划详情" width="800px">
      <el-descriptions :column="1" border :data="selectedPlan">
        <el-descriptions-item label="计划编号">{{ selectedPlan.id }}</el-descriptions-item>
        <el-descriptions-item label="计划名称">{{ selectedPlan.name }}</el-descriptions-item>
        <el-descriptions-item label="设备信息">{{ selectedPlan.equipmentName }}({{ selectedPlan.equipmentCode }})</el-descriptions-item>
        <el-descriptions-item label="保养类型">{{ selectedPlan.type === 'preventive' ? '预防性保养' : '日常保养' }}</el-descriptions-item>
        <el-descriptions-item label="计划日期">{{ selectedPlan.scheduledDate }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getPlanStatusColor(selectedPlan.status)">
            {{ getPlanStatusText(selectedPlan.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="负责人">{{ selectedPlan.assignee }}</el-descriptions-item>
        <el-descriptions-item label="预计工时">{{ selectedPlan.estimatedHours }}小时</el-descriptions-item>
        <el-descriptions-item label="创建日期">{{ selectedPlan.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="保养内容" :span="2">{{ selectedPlan.content }}</el-descriptions-item>
        <el-descriptions-item label="备注" v-if="selectedPlan.remark" :span="2">{{ selectedPlan.remark }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, reactive } from 'vue'
import { Search, Download, File, FileText, BarChart, Settings, Clock, Refresh, Filter, Plus, ArrowDown, Calendar, Check, TrendCharts, CircleDollarSign, Warning, Operation } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'

// 响应式数据
const activeTab = ref('plans')
const monthlyPlans = ref(25)
const completedMaintenances = ref(18)
const pendingMaintenances = ref(7)
const timelyRate = ref(92.5)
const totalCost = ref(24100)
const abnormalDevices = ref(2)

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)
const currentRecordPage = ref(1)
const recordPageSize = ref(10)
const currentStandardPage = ref(1)
const standardPageSize = ref(10)

// 搜索筛选数据
const planSearchKeyword = ref('')
const planStatusFilter = ref('')
const planEquipmentTypeFilter = ref('')
const planDateRange = ref([])
const recordSearchKeyword = ref('')
const recordTypeFilter = ref('')
const recordDateRange = ref([])
const standardSearchKeyword = ref('')
const standardTypeFilter = ref('')

// 对话框数据
const planDialogVisible = ref(false)
const planDialogTitle = ref('创建保养计划')
const planFormRef = ref()
const planForm = reactive({
  id: '',
  name: '',
  equipmentId: '',
  type: 'preventive',
  scheduledDate: '',
  assignee: '',
  estimatedHours: 1,
  content: ''
})
const planRules = {
  name: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
  equipmentId: [{ required: true, message: '请选择设备', trigger: 'change' }],
  scheduledDate: [{ required: true, message: '请选择计划日期', trigger: 'change' }],
  assignee: [{ required: true, message: '请输入负责人', trigger: 'blur' }],
  content: [{ required: true, message: '请输入保养内容', trigger: 'blur' }]
}
const planDetailDialogVisible = ref(false)
const selectedPlan = ref({})
const selectedPlans = ref([])

// 图表引用
const maintenanceTypeChartRef = ref(null)
const monthlyTrendChartRef = ref(null)
const maintenanceCostChartRef = ref(null)
const timelyRateChartRef = ref(null)
let maintenanceTypeChart = null
let monthlyTrendChart = null
let maintenanceCostChart = null
let timelyRateChart = null

// 模拟数据
const equipments = ref([
  { id: 1, name: '注塑机', code: 'EQ001' },
  { id: 2, name: 'CNC机床', code: 'EQ002' },
  { id: 3, name: '装配机器人', code: 'EQ003' },
  { id: 4, name: '激光切割机', code: 'EQ004' },
  { id: 5, name: '三坐标测量机', code: 'EQ005' },
  { id: 6, name: '冲床', code: 'EQ006' }
])

const maintenancePlans = ref([
  {
    id: 'MP20240115001',
    name: '注塑机月度预防性保养',
    equipmentId: 1,
    equipmentName: '注塑机',
    equipmentCode: 'EQ001',
    type: 'preventive',
    scheduledDate: '2024-01-20',
    status: 'pending',
    assignee: '张三',
    estimatedHours: 4,
    content: '1. 清洁设备外部及内部\n2. 检查液压系统\n3. 更换润滑油\n4. 检查电气系统\n5. 校准温控系统',
    createdAt: '2024-01-15',
    remark: ''
  },
  {
    id: 'MP20240115002',
    name: 'CNC机床日常保养',
    equipmentId: 2,
    equipmentName: 'CNC机床',
    equipmentCode: 'EQ002',
    type: 'daily',
    scheduledDate: '2024-01-16',
    status: 'in_progress',
    assignee: '李四',
    estimatedHours: 2,
    content: '1. 清洁工作台\n2. 检查刀具\n3. 润滑导轨\n4. 检查冷却系统',
    createdAt: '2024-01-15',
    remark: ''
  },
  {
    id: 'MP20240115003',
    name: '装配机器人季度保养',
    equipmentId: 3,
    equipmentName: '装配机器人',
    equipmentCode: 'EQ003',
    type: 'preventive',
    scheduledDate: '2024-01-25',
    status: 'pending',
    assignee: '王五',
    estimatedHours: 6,
    content: '1. 全面清洁机器人本体\n2. 检查各轴关节\n3. 更换减速器润滑油\n4. 校准TCP\n5. 测试各轴运动范围',
    createdAt: '2024-01-15',
    remark: '需要专业工程师参与'
  },
  {
    id: 'MP20240114001',
    name: '激光切割机维护保养',
    equipmentId: 4,
    equipmentName: '激光切割机',
    equipmentCode: 'EQ004',
    type: 'preventive',
    scheduledDate: '2024-01-14',
    status: 'completed',
    assignee: '赵六',
    estimatedHours: 3,
    content: '1. 清洁激光头\n2. 检查聚焦镜\n3. 清洁导轨\n4. 检查切割气体\n5. 校准切割精度',
    createdAt: '2024-01-14',
    remark: ''
  },
  {
    id: 'MP20240113001',
    name: '三坐标测量机日常维护',
    equipmentId: 5,
    equipmentName: '三坐标测量机',
    equipmentCode: 'EQ005',
    type: 'daily',
    scheduledDate: '2024-01-13',
    status: 'overdue',
    assignee: '钱七',
    estimatedHours: 1,
    content: '1. 清洁测量平台\n2. 检查探针\n3. 校准测量系统\n4. 检查环境温度',
    createdAt: '2024-01-13',
    remark: '因其他任务延期'
  }
])

const maintenanceRecords = ref([
  {
    id: 'MR20240115001',
    planId: 'MP20240114001',
    equipmentId: 4,
    equipmentName: '激光切割机',
    equipmentCode: 'EQ004',
    type: 'preventive',
    executor: '赵六',
    executionDate: '2024-01-14',
    duration: 3.5,
    cost: 1200,
    status: 'normal',
    efficiency: 95,
    content: '已完成所有保养项目，设备运行正常',
    issues: '',
    solutions: '',
    nextMaintenanceDate: '2024-04-14'
  },
  {
    id: 'MR20240113001',
    planId: 'MP20240113001',
    equipmentId: 1,
    equipmentName: '注塑机',
    equipmentCode: 'EQ001',
    type: 'daily',
    executor: '张三',
    executionDate: '2024-01-13',
    duration: 1.5,
    cost: 300,
    status: 'normal',
    efficiency: 88,
    content: '日常保养完成，设备状态良好',
    issues: '',
    solutions: '',
    nextMaintenanceDate: '2024-01-20'
  },
  {
    id: 'MR20240112001',
    planId: '',
    equipmentId: 2,
    equipmentName: 'CNC机床',
    equipmentCode: 'EQ002',
    type: 'repair',
    executor: '李四',
    executionDate: '2024-01-12',
    duration: 4,
    cost: 2500,
    status: 'abnormal',
    efficiency: 65,
    content: '主轴异常噪音修复',
    issues: '主轴轴承磨损导致异常噪音',
    solutions: '更换主轴轴承，重新校准主轴',
    nextMaintenanceDate: '2024-02-12'
  }
])

const maintenanceStandards = ref([
  {
    id: 'MS001',
    name: '注塑机一级保养标准',
    equipmentType: '注塑机',
    type: 'level1',
    cycle: 30,
    duration: 4,
    content: '1. 清洁设备外部及内部\n2. 检查液压系统压力\n3. 检查润滑系统\n4. 清洁冷却系统\n5. 检查电气系统接线',
    responsibleRole: '设备操作员',
    lastUpdated: '2024-01-01'
  },
  {
    id: 'MS002',
    name: 'CNC机床二级保养标准',
    equipmentType: 'CNC机床',
    type: 'level2',
    cycle: 90,
    duration: 8,
    content: '1. 执行一级保养所有项目\n2. 检查并调整各轴间隙\n3. 检查并更换液压油\n4. 检查并调整主轴精度\n5. 全面检查电气控制系统',
    responsibleRole: '设备技术员',
    lastUpdated: '2024-01-05'
  },
  {
    id: 'MS003',
    name: '装配机器人三级保养标准',
    equipmentType: '工业机器人',
    type: 'level3',
    cycle: 365,
    duration: 24,
    content: '1. 执行二级保养所有项目\n2. 更换全部润滑油\n3. 检查并更换磨损部件\n4. 全面校准机器人\n5. 进行负载测试\n6. 更新控制系统固件',
    responsibleRole: '专业工程师',
    lastUpdated: '2023-12-20'
  }
])

const equipmentPerformance = ref([
  { equipmentName: '注塑机', plannedCount: 12, completedCount: 11, completionRate: 91.7, timelyRate: 83.3, totalCost: 5600 },
  { equipmentName: 'CNC机床', plannedCount: 10, completedCount: 10, completionRate: 100, timelyRate: 90, totalCost: 8200 },
  { equipmentName: '装配机器人', plannedCount: 8, completedCount: 8, completionRate: 100, timelyRate: 100, totalCost: 3400 },
  { equipmentName: '激光切割机', plannedCount: 6, completedCount: 5, completionRate: 83.3, timelyRate: 83.3, totalCost: 4100 },
  { equipmentName: '三坐标测量机', plannedCount: 4, completedCount: 4, completionRate: 100, timelyRate: 75, totalCost: 2800 }
])

// 计算属性 - 筛选后的计划列表
const filteredPlans = computed(() => {
  let filtered = [...maintenancePlans.value]
  
  if (planSearchKeyword.value) {
    const keyword = planSearchKeyword.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(keyword) ||
      item.equipmentName.toLowerCase().includes(keyword) ||
      item.equipmentCode.toLowerCase().includes(keyword) ||
      item.assignee.toLowerCase().includes(keyword)
    )
  }
  
  if (planStatusFilter.value) {
    filtered = filtered.filter(item => item.status === planStatusFilter.value)
  }
  
  if (planEquipmentTypeFilter.value) {
    filtered = filtered.filter(item => 
      item.equipmentName.includes(planEquipmentTypeFilter.value)
    )
  }
  
  if (planDateRange.value && planDateRange.value.length === 2) {
    filtered = filtered.filter(item => {
      const planDate = new Date(item.scheduledDate)
      return planDate >= planDateRange.value[0] && planDate <= planDateRange.value[1]
    })
  }
  
  return filtered
})

// 计算属性 - 筛选后的记录列表
const filteredRecords = computed(() => {
  let filtered = [...maintenanceRecords.value]
  
  if (recordSearchKeyword.value) {
    const keyword = recordSearchKeyword.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.id.toLowerCase().includes(keyword) ||
      item.equipmentName.toLowerCase().includes(keyword) ||
      item.equipmentCode.toLowerCase().includes(keyword)
    )
  }
  
  if (recordTypeFilter.value) {
    filtered = filtered.filter(item => item.type === recordTypeFilter.value)
  }
  
  if (recordDateRange.value && recordDateRange.value.length === 2) {
    filtered = filtered.filter(item => {
      const recordDate = new Date(item.executionDate)
      return recordDate >= recordDateRange.value[0] && recordDate <= recordDateRange.value[1]
    })
  }
  
  return filtered
})

// 计算属性 - 筛选后的标准列表
const filteredStandards = computed(() => {
  let filtered = [...maintenanceStandards.value]
  
  if (standardSearchKeyword.value) {
    const keyword = standardSearchKeyword.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(keyword) ||
      item.equipmentType.toLowerCase().includes(keyword)
    )
  }
  
  if (standardTypeFilter.value) {
    filtered = filtered.filter(item => item.type === standardTypeFilter.value)
  }
  
  return filtered
})

// 生命周期钩子
onMounted(async () => {
  await nextTick()
})

// 标签切换处理
const handleTabChange = async () => {
  if (activeTab.value === 'statistics') {
    await nextTick()
    initStatisticsCharts()
  }
}

// 初始化统计图表
const initStatisticsCharts = () => {
  // 保养类型分布图
  if (maintenanceTypeChartRef.value) {
    maintenanceTypeChart = echarts.init(maintenanceTypeChartRef.value)
    updateMaintenanceTypeChart()
  }
  
  // 月度保养趋势图
  if (monthlyTrendChartRef.value) {
    monthlyTrendChart = echarts.init(monthlyTrendChartRef.value)
    updateMonthlyTrendChart()
  }
  
  // 保养费用统计图
  if (maintenanceCostChartRef.value) {
    maintenanceCostChart = echarts.init(maintenanceCostChartRef.value)
    updateMaintenanceCostChart()
  }
  
  // 及时率统计图
  if (timelyRateChartRef.value) {
    timelyRateChart = echarts.init(timelyRateChartRef.value)
    updateTimelyRateChart()
  }
}

// 更新保养类型分布图
const updateMaintenanceTypeChart = () => {
  if (!maintenanceTypeChart) return
  
  const preventiveCount = maintenanceRecords.value.filter(r => r.type === 'preventive').length
  const dailyCount = maintenanceRecords.value.filter(r => r.type === 'daily').length
  const repairCount = maintenanceRecords.value.filter(r => r.type === 'repair').length
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: ['预防性保养', '日常保养', '故障修复']
    },
    series: [
      {
        name: '保养类型',
        type: 'pie',
        radius: '55%',
        center: ['50%', '60%'],
        data: [
          { value: preventiveCount, name: '预防性保养', itemStyle: { color: '#67C23A' } },
          { value: dailyCount, name: '日常保养', itemStyle: { color: '#409EFF' } },
          { value: repairCount, name: '故障修复', itemStyle: { color: '#F56C6C' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  maintenanceTypeChart.setOption(option)
}

// 更新月度保养趋势图
const updateMonthlyTrendChart = () => {
  if (!monthlyTrendChart) return
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['计划数', '完成数']
    },
    xAxis: {
      type: 'category',
      data: ['8月', '9月', '10月', '11月', '12月', '1月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '计划数',
        type: 'line',
        data: [20, 22, 25, 23, 21, 25],
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '完成数',
        type: 'line',
        data: [18, 20, 23, 21, 19, 18],
        itemStyle: { color: '#67C23A' }
      }
    ]
  }
  
  monthlyTrendChart.setOption(option)
}

// 更新保养费用统计图
const updateMaintenanceCostChart = () => {
  if (!maintenanceCostChart) return
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '费用(元)'
    },
    yAxis: {
      type: 'category',
      data: equipmentPerformance.value.map(e => e.equipmentName)
    },
    series: [
      {
        type: 'bar',
        data: equipmentPerformance.value.map(e => e.totalCost),
        itemStyle: {
          color: '#E6A23C'
        }
      }
    ]
  }
  
  maintenanceCostChart.setOption(option)
}

// 更新及时率统计图
const updateTimelyRateChart = () => {
  if (!timelyRateChart) return
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: equipmentPerformance.value.map(e => e.equipmentName)
    },
    yAxis: {
      type: 'value',
      name: '及时率(%)',
      min: 0,
      max: 100
    },
    series: [
      {
        type: 'bar',
        data: equipmentPerformance.value.map(e => e.timelyRate),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#67C23A' },
            { offset: 1, color: '#E6A23C' }
          ])
        }
      }
    ]
  }
  
  timelyRateChart.setOption(option)
}

// 获取计划类型颜色
const getPlanTypeColor = (type) => {
  return type === 'preventive' ? 'success' : 'primary'
}

// 获取计划状态颜色
const getPlanStatusColor = (status) => {
  const colors = {
    pending: 'info',
    in_progress: 'warning',
    completed: 'success',
    overdue: 'danger'
  }
  return colors[status] || 'default'
}

// 获取计划状态文本
const getPlanStatusText = (status) => {
  const texts = {
    pending: '待执行',
    in_progress: '执行中',
    completed: '已完成',
    overdue: '已逾期'
  }
  return texts[status] || '未知'
}

// 获取记录类型颜色
const getRecordTypeColor = (type) => {
  const colors = {
    preventive: 'success',
    daily: 'primary',
    repair: 'danger'
  }
  return colors[type] || 'default'
}

// 获取记录类型文本
const getRecordTypeText = (type) => {
  const texts = {
    preventive: '预防性',
    daily: '日常',
    repair: '故障修复'
  }
  return texts[type] || '未知'
}

// 获取标准类型颜色
const getStandardTypeColor = (type) => {
  const colors = {
    level1: 'primary',
    level2: 'success',
    level3: 'warning'
  }
  return colors[type] || 'default'
}

// 获取标准类型文本
const getStandardTypeText = (type) => {
  const texts = {
    level1: '一级',
    level2: '二级',
    level3: '三级'
  }
  return texts[type] || '未知'
}

// 获取完成率颜色
const getCompletionRateColor = (rate) => {
  if (rate >= 90) return '#67C23A'
  if (rate >= 70) return '#E6A23C'
  return '#F56C6C'
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (current) => {
  currentPage.value = current
}

const handleRecordSizeChange = (size) => {
  recordPageSize.value = size
  currentRecordPage.value = 1
}

const handleRecordCurrentChange = (current) => {
  currentRecordPage.value = current
}

const handleStandardSizeChange = (size) => {
  standardPageSize.value = size
  currentStandardPage.value = 1
}

const handleStandardCurrentChange = (current) => {
  currentStandardPage.value = current
}

// 搜索处理
const handlePlanSearch = () => {
  currentPage.value = 1
}

const handleRecordSearch = () => {
  currentRecordPage.value = 1
}

const handleStandardSearch = () => {
  currentStandardPage.value = 1
}

// 选择计划处理
const handlePlanSelectionChange = (selection) => {
  selectedPlans.value = selection
}

// 创建保养计划
const handleCreatePlan = () => {
  planForm.id = ''
  planForm.name = ''
  planForm.equipmentId = ''
  planForm.type = 'preventive'
  planForm.scheduledDate = ''
  planForm.assignee = ''
  planForm.estimatedHours = 1
  planForm.content = ''
  
  planDialogTitle.value = '创建保养计划'
  planDialogVisible.value = true
}

// 编辑保养计划
const handleEditPlan = (plan) => {
  Object.assign(planForm, plan)
  planDialogTitle.value = '编辑保养计划'
  planDialogVisible.value = true
}

// 保存保养计划
const handleSavePlan = () => {
  planFormRef.value.validate((valid) => {
    if (valid) {
      if (planForm.id) {
        // 编辑现有计划
        const index = maintenancePlans.value.findIndex(p => p.id === planForm.id)
        if (index > -1) {
          maintenancePlans.value[index] = { ...planForm }
        }
        ElMessage.success('保养计划已更新')
      } else {
        // 创建新计划
        const newPlan = {
          ...planForm,
          id: `MP${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(maintenancePlans.value.length + 1).padStart(3, '0')}`,
          status: 'pending',
          createdAt: new Date().toISOString().split('T')[0],
          equipmentName: equipments.value.find(e => e.id === planForm.equipmentId)?.name || '',
          equipmentCode: equipments.value.find(e => e.id === planForm.equipmentId)?.code || ''
        }
        maintenancePlans.value.unshift(newPlan)
        ElMessage.success('保养计划已创建')
      }
      planDialogVisible.value = false
    }
  })
}

// 执行保养计划
const handleExecutePlan = (plan) => {
  ElMessageBox.confirm(
    `确定要开始执行计划「${plan.name}」吗？`,
    '确认操作',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    plan.status = 'in_progress'
    ElMessage.success('保养计划已开始执行')
  })
}

// 批量操作处理
const handleBatchOperation = (command) => {
  if (selectedPlans.value.length === 0) {
    ElMessage.warning('请选择要操作的计划')
    return
  }
  
  let confirmText = ''
  let successText = ''
  let type = 'info'
  
  switch (command) {
    case 'execute':
      confirmText = `确定要批量开始执行选中的 ${selectedPlans.value.length} 个计划吗？`
      successText = `已批量开始执行 ${selectedPlans.value.length} 个计划`
      break
    case 'complete':
      confirmText = `确定要批量完成选中的 ${selectedPlans.value.length} 个计划吗？`
      successText = `已批量完成 ${selectedPlans.value.length} 个计划`
      break
    case 'delete':
      confirmText = `确定要批量删除选中的 ${selectedPlans.value.length} 个计划吗？此操作不可撤销！`
      successText = `已批量删除 ${selectedPlans.value.length} 个计划`
      type = 'danger'
      break
    default:
      return
  }
  
  ElMessageBox.confirm(
    confirmText,
    '批量操作确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: type
    }
  ).then(() => {
    switch (command) {
      case 'execute':
        selectedPlans.value.forEach(plan => {
          if (plan.status === 'pending' || plan.status === 'overdue') {
            plan.status = 'in_progress'
          }
        })
        break
      case 'complete':
        selectedPlans.value.forEach(plan => {
          if (plan.status === 'in_progress') {
            plan.status = 'completed'
          }
        })
        break
      case 'delete':
        selectedPlans.value.forEach(plan => {
          const index = maintenancePlans.value.findIndex(p => p.id === plan.id)
          if (index > -1) {
            maintenancePlans.value.splice(index, 1)
          }
        })
        break
    }
    ElMessage.success(successText)
    selectedPlans.value = []
  })
}

// 批量执行（兼容旧方法）
const handleBatchExecute = () => {
  if (selectedPlans.value.length === 0) {
    ElMessage.warning('请选择要执行的计划')
    return
  }
  
  ElMessageBox.confirm(
    `确定要批量开始执行选中的 ${selectedPlans.value.length} 个计划吗？`,
    '批量操作确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    selectedPlans.value.forEach(plan => {
      plan.status = 'in_progress'
    })
    ElMessage.success(`已批量开始执行 ${selectedPlans.value.length} 个计划`)
    selectedPlans.value = []
  })
}

// 查看计划详情
const handleViewPlan = (plan) => {
  selectedPlan.value = { ...plan }
  planDetailDialogVisible.value = true
}

// 删除计划
const handleDeletePlan = (plan) => {
  ElMessageBox.confirm(
    `确定要删除计划「${plan.name}」吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(() => {
    const index = maintenancePlans.value.findIndex(p => p.id === plan.id)
    if (index > -1) {
      maintenancePlans.value.splice(index, 1)
    }
    ElMessage.success('保养计划已删除')
  })
}

// 创建保养记录
const handleCreateRecord = () => {
  ElMessage.info('创建保养记录功能待实现')
}

// 查看保养记录
const handleViewRecord = (record) => {
  ElMessage.info('查看保养记录功能待实现')
}

// 编辑保养记录
const handleEditRecord = (record) => {
  ElMessage.info('编辑保养记录功能待实现')
}

// 删除保养记录
const handleDeleteRecord = (record) => {
  ElMessageBox.confirm(
    `确定要删除记录「${record.id}」吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(() => {
    const index = maintenanceRecords.value.findIndex(r => r.id === record.id)
    if (index > -1) {
      maintenanceRecords.value.splice(index, 1)
    }
    ElMessage.success('保养记录已删除')
  })
}

// 创建保养标准
const handleCreateStandard = () => {
  ElMessage.info('创建保养标准功能待实现')
}

// 查看保养标准
const handleViewStandard = (standard) => {
  ElMessage.info('查看保养标准功能待实现')
}

// 编辑保养标准
const handleEditStandard = (standard) => {
  ElMessage.info('编辑保养标准功能待实现')
}

// 删除保养标准
const handleDeleteStandard = (standard) => {
  ElMessageBox.confirm(
    `确定要删除标准「${standard.name}」吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(() => {
    const index = maintenanceStandards.value.findIndex(s => s.id === standard.id)
    if (index > -1) {
      maintenanceStandards.value.splice(index, 1)
    }
    ElMessage.success('保养标准已删除')
  })
}

// 导出数据
const handleExportData = (format = 'excel') => {
  const currentTab = activeTab.value
  let dataCount = 0
  let exportType = ''
  
  switch (currentTab) {
    case 'plans':
      dataCount = filteredPlans.value.length
      exportType = '保养计划'
      break
    case 'records':
      dataCount = filteredRecords.value.length
      exportType = '保养记录'
      break
    case 'standards':
      dataCount = filteredStandards.value.length
      exportType = '保养标准'
      break
    default:
      ElMessage.warning('请切换到具体的数据标签页进行导出')
      return
  }
  
  if (dataCount === 0) {
    ElMessage.warning('当前没有数据可导出')
    return
  }
  
  // 模拟导出功能
  let message = ''
  switch (format) {
    case 'excel':
      message = `成功导出 ${dataCount} 条${exportType}数据为Excel格式`
      break
    case 'pdf':
      message = `成功导出 ${dataCount} 条${exportType}数据为PDF格式`
      break
    case 'print':
      message = `已准备好打印 ${dataCount} 条${exportType}数据`
      break
  }
  
  ElMessage.success(message)
}
</script>

<style scoped>
.equipment-maintenance {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 24px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 15px;
  width: 100%;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 24px;
  margin-right: 15px;
  color: white;
}

.stat-icon.primary {
  background-color: #409EFF;
}

.stat-icon.success {
  background-color: #67C23A;
}

.stat-icon.warning {
  background-color: #E6A23C;
}

.stat-icon.danger {
  background-color: #F56C6C;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  display: flex;
  align-items: baseline;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stat-unit {
  font-size: 14px;
  color: #909399;
  margin-left: 5px;
  font-weight: normal;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.maintenance-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tab-content {
  padding: 20px;
}

.toolbar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-item {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.chart-item h3 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.statistics-table {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

.statistics-table h3 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.dialog-footer {
  text-align: right;
}

@media (max-width: 1200px) {
  .header {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .chart-row {
    grid-template-columns: 1fr;
  }
  
  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

.mini-progress {
  display: inline-block;
  width: 80px;
  vertical-align: middle;
  margin-right: 5px;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .tab-content {
    padding: 10px;
  }
}
</style>