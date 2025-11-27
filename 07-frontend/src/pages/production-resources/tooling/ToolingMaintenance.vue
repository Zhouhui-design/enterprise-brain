<template>
  <div class="tooling-maintenance">
    <div class="page-header">
      <h1>工装保养管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateMaintenance">创建保养计划</el-button>
        <el-button @click="handleBatchMaintenance">批量维护</el-button>
        <el-button @click="handleExport">导出记录</el-button>
      </div>
    </div>

    <!-- 搜索筛选栏 -->
    <div class="search-filter">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input v-model="searchForm.toolingCode" placeholder="工装编号" clearable></el-input>
        </el-col>
        <el-col :span="6">
          <el-input v-model="searchForm.toolingName" placeholder="工装名称" clearable></el-input>
        </el-col>
        <el-col :span="6">
          <el-select v-model="searchForm.maintenanceType" placeholder="保养类型" clearable>
            <el-option v-for="type in maintenanceTypes" :key="type.value" :label="type.label" :value="type.value"></el-option>
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="searchForm.status" placeholder="保养状态" clearable>
            <el-option v-for="stat in statusOptions" :key="stat.value" :label="stat.label" :value="stat.value"></el-option>
          </el-select>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top: 15px;">
        <el-col :span="6">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          ></el-date-picker>
        </el-col>
        <el-col :span="6">
          <el-input v-model="searchForm.maintenancePerson" placeholder="维护人员" clearable></el-input>
        </el-col>
      </el-row>
      <div class="search-actions">
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ totalMaintenances }}</div>
            <div class="stat-label">保养总数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card warning">
            <div class="stat-number">{{ overdueMaintenances }}</div>
            <div class="stat-label">逾期未保养</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card success">
            <div class="stat-number">{{ completedMaintenances }}</div>
            <div class="stat-label">已完成保养</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card info">
            <div class="stat-number">{{ upcomingMaintenances }}</div>
            <div class="stat-label">待保养</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 保养统计图表 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="chart-container">
            <h3>保养类型分布</h3>
            <canvas ref="maintenanceTypeChart"></canvas>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-container">
            <h3>保养完成趋势</h3>
            <canvas ref="maintenanceTrendChart"></canvas>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 预警列表 -->
    <div class="warning-section">
      <div class="section-header">
        <h3>保养预警</h3>
        <el-button type="text" @click="showAllWarnings = !showAllWarnings">
          {{ showAllWarnings ? '收起' : '查看全部' }}
        </el-button>
      </div>
      <el-table
        v-if="warnings.length > 0"
        :data="showAllWarnings ? warnings : warnings.slice(0, 5)"
        style="width: 100%"
        border
        stripe
      >
        <el-table-column prop="toolingCode" label="工装编号" width="120"></el-table-column>
        <el-table-column prop="toolingName" label="工装名称"></el-table-column>
        <el-table-column prop="warningType" label="预警类型" width="120">
          <template #default="scope">
            <el-tag type="warning">{{ scope.row.warningType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="到期日期" width="140"></el-table-column>
        <el-table-column prop="overdueDays" label="逾期天数" width="100">
          <template #default="scope">
            <span v-if="scope.row.overdueDays > 0" class="overdue-days">{{ scope.row.overdueDays }}天</span>
            <span v-else-if="scope.row.overdueDays === 0" class="due-today">今天到期</span>
            <span v-else class="upcoming-days">{{ Math.abs(scope.row.overdueDays) }}天后到期</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="handleMaintenanceNow(scope.row)">立即保养</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="no-data">
        <el-empty description="暂无预警信息"></el-empty>
      </div>
    </div>

    <!-- 保养记录列表 -->
    <div class="maintenance-list">
      <div class="list-header">
        <h3>保养记录列表</h3>
        <div class="view-switch">
          <el-radio-group v-model="viewMode">
            <el-radio-button label="table">表格</el-radio-button>
            <el-radio-button label="card">卡片</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 表格视图 -->
      <el-table
        v-if="viewMode === 'table'"
        :data="maintenanceRecords"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="id" label="记录ID" width="80"></el-table-column>
        <el-table-column prop="toolingCode" label="工装编号" width="120"></el-table-column>
        <el-table-column prop="toolingName" label="工装名称"></el-table-column>
        <el-table-column prop="maintenanceType" label="保养类型" width="120">
          <template #default="scope">
            {{ getMaintenanceTypeLabel(scope.row.maintenanceType) }}
          </template>
        </el-table-column>
        <el-table-column prop="scheduledDate" label="计划日期" width="120"></el-table-column>
        <el-table-column prop="actualDate" label="实际日期" width="120"></el-table-column>
        <el-table-column prop="maintenancePerson" label="维护人员" width="100"></el-table-column>
        <el-table-column prop="maintenanceCost" label="维护费用" width="100"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ getStatusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleViewMaintenanceDetail(scope.row)">查看详情</el-button>
            <el-button
              v-if="scope.row.status === 'scheduled' || scope.row.status === 'overdue'"
              size="small"
              type="primary"
              @click="handlePerformMaintenance(scope.row)"
            >
              执行保养
            </el-button>
            <el-button
              v-if="scope.row.status !== 'completed'"
              size="small"
              type="danger"
              @click="handleCancelMaintenance(scope.row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 卡片视图 -->
      <div v-else-if="viewMode === 'card'" class="card-view">
        <el-row :gutter="20">
          <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4" v-for="record in maintenanceRecords" :key="record.id">
            <el-card class="maintenance-card" shadow="hover">
              <div class="card-header">
                <div class="maintenance-id">ID: {{ record.id }}</div>
                <el-tag :type="getStatusType(record.status)">{{ getStatusLabel(record.status) }}</el-tag>
              </div>
              <div class="card-body">
                <h4>{{ record.toolingName }}</h4>
                <div class="card-info">
                  <p><span>工装编号:</span> {{ record.toolingCode }}</p>
                  <p><span>保养类型:</span> {{ getMaintenanceTypeLabel(record.maintenanceType) }}</p>
                  <p><span>计划日期:</span> {{ record.scheduledDate }}</p>
                  <p v-if="record.actualDate"><span>实际日期:</span> {{ record.actualDate }}</p>
                  <p><span>维护人员:</span> {{ record.maintenancePerson || '待分配' }}</p>
                </div>
              </div>
              <div class="card-footer">
                <el-button size="small" @click="handleViewMaintenanceDetail(record)">查看详情</el-button>
                <el-button
                  v-if="record.status === 'scheduled' || record.status === 'overdue'"
                  size="small"
                  type="primary"
                  @click="handlePerformMaintenance(record)"
                >
                  执行保养
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

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
        ></el-pagination>
      </div>
    </div>

    <!-- 保养详情对话框 -->
    <el-dialog v-model="detailVisible" title="保养详情" width="700px">
      <div v-if="selectedMaintenance" class="maintenance-detail">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-descriptions border :column="1">
              <el-descriptions-item label="记录ID">{{ selectedMaintenance.id }}</el-descriptions-item>
              <el-descriptions-item label="工装编号">{{ selectedMaintenance.toolingCode }}</el-descriptions-item>
              <el-descriptions-item label="工装名称">{{ selectedMaintenance.toolingName }}</el-descriptions-item>
              <el-descriptions-item label="保养类型">{{ getMaintenanceTypeLabel(selectedMaintenance.maintenanceType) }}</el-descriptions-item>
              <el-descriptions-item label="计划日期">{{ selectedMaintenance.scheduledDate }}</el-descriptions-item>
              <el-descriptions-item label="实际日期">{{ selectedMaintenance.actualDate || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-col>
          <el-col :span="12">
            <el-descriptions border :column="1">
              <el-descriptions-item label="维护人员">{{ selectedMaintenance.maintenancePerson || '-' }}</el-descriptions-item>
              <el-descriptions-item label="维护费用">{{ selectedMaintenance.maintenanceCost || 0 }} 元</el-descriptions-item>
              <el-descriptions-item label="工时">{{ selectedMaintenance.workHours || 0 }} 小时</el-descriptions-item>
              <el-descriptions-item label="状态">{{ getStatusLabel(selectedMaintenance.status) }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ selectedMaintenance.createTime }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ selectedMaintenance.updateTime || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
        <div class="detail-section">
          <h4>保养内容</h4>
          <p>{{ selectedMaintenance.maintenanceContent || '无' }}</p>
        </div>
        <div class="detail-section">
          <h4>更换部件</h4>
          <el-table v-if="selectedMaintenance.replacedParts && selectedMaintenance.replacedParts.length > 0" :data="selectedMaintenance.replacedParts" border style="width: 100%">
            <el-table-column prop="partName" label="部件名称"></el-table-column>
            <el-table-column prop="partNumber" label="部件编号"></el-table-column>
            <el-table-column prop="quantity" label="数量"></el-table-column>
            <el-table-column prop="unitPrice" label="单价"></el-table-column>
          </el-table>
          <div v-else class="no-data">无更换部件记录</div>
        </div>
        <div class="detail-section">
          <h4>备注</h4>
          <p>{{ selectedMaintenance.remark || '无' }}</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 创建/编辑保养计划对话框 -->
    <el-dialog v-model="formVisible" :title="isEdit ? '编辑保养计划' : '创建保养计划'" width="600px">
      <el-form ref="maintenanceForm" :model="maintenanceForm" :rules="maintenanceRules" label-width="100px">
        <el-form-item label="工装编号" prop="toolingCode">
          <el-input v-model="maintenanceForm.toolingCode" placeholder="请输入工装编号"></el-input>
        </el-form-item>
        <el-form-item label="工装名称" prop="toolingName">
          <el-input v-model="maintenanceForm.toolingName" placeholder="请输入工装名称"></el-input>
        </el-form-item>
        <el-form-item label="保养类型" prop="maintenanceType">
          <el-select v-model="maintenanceForm.maintenanceType" placeholder="请选择保养类型">
            <el-option v-for="type in maintenanceTypes" :key="type.value" :label="type.label" :value="type.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="计划日期" prop="scheduledDate">
          <el-date-picker v-model="maintenanceForm.scheduledDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD"></el-date-picker>
        </el-form-item>
        <el-form-item label="维护人员" prop="maintenancePerson">
          <el-input v-model="maintenanceForm.maintenancePerson" placeholder="请输入维护人员"></el-input>
        </el-form-item>
        <el-form-item label="保养内容" prop="maintenanceContent">
          <el-input type="textarea" v-model="maintenanceForm.maintenanceContent" placeholder="请输入保养内容" :rows="3"></el-input>
        </el-form-item>
        <el-form-item label="预计工时" prop="workHours">
          <el-input-number v-model="maintenanceForm.workHours" :min="0" :step="0.5" placeholder="请输入预计工时"></el-input-number>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input type="textarea" v-model="maintenanceForm.remark" placeholder="请输入备注信息" :rows="2"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="formVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 执行保养对话框 -->
    <el-dialog v-model="performVisible" title="执行保养" width="600px">
      <el-form ref="performForm" :model="performForm" :rules="performRules" label-width="100px">
        <el-form-item label="实际日期" prop="actualDate">
          <el-date-picker v-model="performForm.actualDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD"></el-date-picker>
        </el-form-item>
        <el-form-item label="维护人员" prop="maintenancePerson">
          <el-input v-model="performForm.maintenancePerson" placeholder="请输入维护人员"></el-input>
        </el-form-item>
        <el-form-item label="维护费用" prop="maintenanceCost">
          <el-input-number v-model="performForm.maintenanceCost" :min="0" :step="0.01" placeholder="请输入维护费用"></el-input-number>
        </el-form-item>
        <el-form-item label="实际工时" prop="workHours">
          <el-input-number v-model="performForm.workHours" :min="0" :step="0.5" placeholder="请输入实际工时"></el-input-number>
        </el-form-item>
        <el-form-item label="保养内容" prop="maintenanceContent">
          <el-input type="textarea" v-model="performForm.maintenanceContent" placeholder="请输入保养内容" :rows="3"></el-input>
        </el-form-item>
        <el-form-item label="保养结果" prop="result">
          <el-radio-group v-model="performForm.result">
            <el-radio :label="'success'">成功</el-radio>
            <el-radio :label="'partial'">部分成功</el-radio>
            <el-radio :label="'failed'">失败</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input type="textarea" v-model="performForm.remark" placeholder="请输入备注信息" :rows="2"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="performVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitPerform">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Chart from 'chart.js/auto'

// 响应式数据
const viewMode = ref('table')
const searchForm = reactive({
  toolingCode: '',
  toolingName: '',
  maintenanceType: '',
  status: '',
  maintenancePerson: ''
})

const dateRange = ref([])
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const detailVisible = ref(false)
const formVisible = ref(false)
const performVisible = ref(false)
const isEdit = ref(false)
const showAllWarnings = ref(false)
const selectedMaintenance = ref(null)
const selectedMaintenanceForPerform = ref(null)
const maintenanceTypeChart = ref(null)
const maintenanceTrendChart = ref(null)
let typeChartInstance = null
let trendChartInstance = null
const selectedRows = ref([])

// 表单数据
const maintenanceForm = reactive({
  id: '',
  toolingCode: '',
  toolingName: '',
  maintenanceType: '',
  scheduledDate: '',
  actualDate: '',
  maintenancePerson: '',
  maintenanceCost: 0,
  workHours: 0,
  maintenanceContent: '',
  replacedParts: [],
  result: '',
  status: 'scheduled',
  remark: '',
  createTime: '',
  updateTime: ''
})

const performForm = reactive({
  actualDate: '',
  maintenancePerson: '',
  maintenanceCost: 0,
  workHours: 0,
  maintenanceContent: '',
  result: 'success',
  remark: ''
})

// 表单验证规则
const maintenanceRules = {
  toolingCode: [
    { required: true, message: '请输入工装编号', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  toolingName: [
    { required: true, message: '请输入工装名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  maintenanceType: [
    { required: true, message: '请选择保养类型', trigger: 'change' }
  ],
  scheduledDate: [
    { required: true, message: '请选择计划日期', trigger: 'change' }
  ]
}

const performRules = {
  actualDate: [
    { required: true, message: '请选择实际日期', trigger: 'change' }
  ],
  maintenancePerson: [
    { required: true, message: '请输入维护人员', trigger: 'blur' }
  ],
  maintenanceContent: [
    { required: true, message: '请输入保养内容', trigger: 'blur' }
  ],
  result: [
    { required: true, message: '请选择保养结果', trigger: 'change' }
  ]
}

// 常量数据
const maintenanceTypes = [
  { label: '日常保养', value: 'daily' },
  { label: '定期保养', value: 'regular' },
  { label: '故障维修', value: 'repair' },
  { label: '预防性维护', value: 'preventive' },
  { label: '其他', value: 'other' }
]

const statusOptions = [
  { label: '已计划', value: 'scheduled' },
  { label: '逾期', value: 'overdue' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
]

// 模拟数据
const maintenanceRecords = ref([
  {
    id: '1',
    toolingCode: 'TOOL-001',
    toolingName: 'CNC铣刀',
    maintenanceType: 'daily',
    scheduledDate: '2023-11-25',
    actualDate: '2023-11-25',
    maintenancePerson: '张三',
    maintenanceCost: 0,
    workHours: 1,
    maintenanceContent: '清洁刀具表面，检查刀刃磨损情况，涂抹防锈油',
    replacedParts: [],
    result: 'success',
    status: 'completed',
    remark: '常规保养，刀具状态良好',
    createTime: '2023-11-20',
    updateTime: '2023-11-25'
  },
  {
    id: '2',
    toolingCode: 'FIXT-001',
    toolingName: '通用夹具',
    maintenanceType: 'regular',
    scheduledDate: '2023-12-05',
    actualDate: '',
    maintenancePerson: '李四',
    maintenanceCost: 0,
    workHours: 2,
    maintenanceContent: '检查夹具紧固情况，调整定位精度，润滑活动部件',
    replacedParts: [],
    result: '',
    status: 'scheduled',
    remark: '',
    createTime: '2023-11-20',
    updateTime: ''
  },
  {
    id: '3',
    toolingCode: 'MOLD-001',
    toolingName: '塑料模具',
    maintenanceType: 'repair',
    scheduledDate: '2023-11-15',
    actualDate: '2023-11-16',
    maintenancePerson: '王五',
    maintenanceCost: 2500,
    workHours: 8,
    maintenanceContent: '修复模具型腔磨损，更换导向柱，调整合模间隙',
    replacedParts: [
      { partName: '导向柱', partNumber: 'GP-001', quantity: 2, unitPrice: 500 },
      { partName: '耐磨块', partNumber: 'WB-001', quantity: 4, unitPrice: 300 }
    ],
    result: 'success',
    status: 'completed',
    remark: '模具磨损严重，建议下次生产前再次检查',
    createTime: '2023-11-14',
    updateTime: '2023-11-16'
  },
  {
    id: '4',
    toolingCode: 'GAUGE-001',
    toolingName: '游标卡尺',
    maintenanceType: 'preventive',
    scheduledDate: '2023-11-20',
    actualDate: '',
    maintenancePerson: '赵六',
    maintenanceCost: 0,
    workHours: 1,
    maintenanceContent: '校准测量精度，清洁内部机构，检查刻度清晰度',
    replacedParts: [],
    result: '',
    status: 'overdue',
    remark: '',
    createTime: '2023-11-10',
    updateTime: ''
  },
  {
    id: '5',
    toolingCode: 'TOOL-002',
    toolingName: '钻头套装',
    maintenanceType: 'daily',
    scheduledDate: '2023-11-26',
    actualDate: '',
    maintenancePerson: '张三',
    maintenanceCost: 0,
    workHours: 1,
    maintenanceContent: '检查钻头磨损情况，清洁表面，整理存放',
    replacedParts: [],
    result: '',
    status: 'scheduled',
    remark: '',
    createTime: '2023-11-20',
    updateTime: ''
  },
  {
    id: '6',
    toolingCode: 'FIXT-002',
    toolingName: '专用夹具',
    maintenanceType: 'regular',
    scheduledDate: '2023-11-30',
    actualDate: '',
    maintenancePerson: '李四',
    maintenanceCost: 0,
    workHours: 3,
    maintenanceContent: '全面检查夹具精度，更换易损件，重新标定',
    replacedParts: [],
    result: '',
    status: 'scheduled',
    remark: '',
    createTime: '2023-11-20',
    updateTime: ''
  },
  {
    id: '7',
    toolingCode: 'MOLD-002',
    toolingName: '冲压模具',
    maintenanceType: 'repair',
    scheduledDate: '2023-11-10',
    actualDate: '2023-11-12',
    maintenancePerson: '王五',
    maintenanceCost: 5000,
    workHours: 16,
    maintenanceContent: '更换冲头，修复凹模，调整间隙，测试冲压效果',
    replacedParts: [
      { partName: '冲头', partNumber: 'PH-001', quantity: 1, unitPrice: 3000 },
      { partName: '凹模', partNumber: 'DB-001', quantity: 1, unitPrice: 1500 },
      { partName: '弹簧', partNumber: 'SP-001', quantity: 4, unitPrice: 100 }
    ],
    result: 'success',
    status: 'completed',
    remark: '模具已修复，测试效果良好',
    createTime: '2023-11-09',
    updateTime: '2023-11-12'
  },
  {
    id: '8',
    toolingCode: 'TOOL-003',
    toolingName: '丝锥套装',
    maintenanceType: 'preventive',
    scheduledDate: '2023-12-10',
    actualDate: '',
    maintenancePerson: '张三',
    maintenanceCost: 0,
    workHours: 2,
    maintenanceContent: '检查丝锥磨损，修复损坏的丝锥，涂抹切削油',
    replacedParts: [],
    result: '',
    status: 'scheduled',
    remark: '',
    createTime: '2023-11-20',
    updateTime: ''
  }
])

// 计算属性
const filteredRecords = computed(() => {
  return maintenanceRecords.value.filter(record => {
    const matchCode = !searchForm.toolingCode || record.toolingCode.toLowerCase().includes(searchForm.toolingCode.toLowerCase())
    const matchName = !searchForm.toolingName || record.toolingName.toLowerCase().includes(searchForm.toolingName.toLowerCase())
    const matchType = !searchForm.maintenanceType || record.maintenanceType === searchForm.maintenanceType
    const matchStatus = !searchForm.status || record.status === searchForm.status
    const matchPerson = !searchForm.maintenancePerson || record.maintenancePerson?.toLowerCase().includes(searchForm.maintenancePerson.toLowerCase())
    
    let dateMatch = true
    if (dateRange.value && dateRange.value.length === 2) {
      const recordDate = record.scheduledDate || record.actualDate
      if (recordDate) {
        dateMatch = recordDate >= dateRange.value[0] && recordDate <= dateRange.value[1]
      } else {
        dateMatch = false
      }
    }
    
    return matchCode && matchName && matchType && matchStatus && matchPerson && dateMatch
  })
})

const totalMaintenances = computed(() => {
  return filteredRecords.value.length
})

const overdueMaintenances = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return filteredRecords.value.filter(record => 
    record.status === 'overdue' || 
    (record.status === 'scheduled' && record.scheduledDate < today)
  ).length
})

const completedMaintenances = computed(() => {
  return filteredRecords.value.filter(record => record.status === 'completed').length
})

const upcomingMaintenances = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return filteredRecords.value.filter(record => 
    record.status === 'scheduled' && record.scheduledDate >= today
  ).length
})

const warnings = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const warningList = []
  
  maintenanceRecords.value.forEach(record => {
    if (record.status === 'scheduled' || record.status === 'overdue') {
      const scheduledDate = new Date(record.scheduledDate)
      const currentDate = new Date(today)
      const diffTime = scheduledDate - currentDate
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays <= 7 && diffDays >= -30) { // 未来7天和过去30天内的保养
        warningList.push({
          ...record,
          warningType: diffDays < 0 ? '逾期未保养' : '即将到期',
          overdueDays: diffDays
        })
      }
    }
  })
  
  // 按逾期天数排序（逾期最久的在前，然后是即将到期的）
  return warningList.sort((a, b) => a.overdueDays - b.overdueDays)
})

// 方法
const getMaintenanceTypeLabel = (value) => {
  const type = maintenanceTypes.find(t => t.value === value)
  return type ? type.label : value
}

const getStatusLabel = (value) => {
  const status = statusOptions.find(s => s.value === value)
  return status ? status.label : value
}

const getStatusType = (value) => {
  const typeMap = {
    'scheduled': 'info',
    'overdue': 'danger',
    'in_progress': 'warning',
    'completed': 'success',
    'cancelled': 'danger'
  }
  return typeMap[value] || 'info'
}

const handleSearch = () => {
  pagination.currentPage = 1
  // 在实际应用中，这里应该调用API获取数据
  ElMessage.success('查询成功')
}

const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  dateRange.value = []
  pagination.currentPage = 1
  // 在实际应用中，这里应该调用API获取数据
  ElMessage.success('重置成功')
}

const handleViewMaintenanceDetail = (record) => {
  selectedMaintenance.value = { ...record }
  detailVisible.value = true
}

const handleCreateMaintenance = () => {
  isEdit.value = false
  // 重置表单
  Object.keys(maintenanceForm).forEach(key => {
    maintenanceForm[key] = key === 'maintenanceCost' || key === 'workHours' ? 0 : ''
  })
  maintenanceForm.status = 'scheduled'
  formVisible.value = true
}

const handleSubmitForm = () => {
  // 在实际应用中，这里应该调用API保存数据
  if (isEdit.value) {
    const index = maintenanceRecords.value.findIndex(item => item.id === maintenanceForm.id)
    if (index > -1) {
      maintenanceRecords.value[index] = { ...maintenanceForm, updateTime: new Date().toISOString().split('T')[0] }
    }
  } else {
    const newRecord = { 
      ...maintenanceForm, 
      id: Date.now().toString(), 
      createTime: new Date().toISOString().split('T')[0],
      replacedParts: []
    }
    maintenanceRecords.value.unshift(newRecord)
  }
  ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
  formVisible.value = false
  updateOverdueStatus()
}

const handlePerformMaintenance = (record) => {
  selectedMaintenanceForPerform.value = record
  Object.assign(performForm, {
    actualDate: new Date().toISOString().split('T')[0],
    maintenancePerson: record.maintenancePerson || '',
    maintenanceCost: 0,
    workHours: record.workHours || 0,
    maintenanceContent: record.maintenanceContent || '',
    result: 'success',
    remark: ''
  })
  performVisible.value = true
}

const handleSubmitPerform = () => {
  // 在实际应用中，这里应该调用API保存数据
  const index = maintenanceRecords.value.findIndex(item => item.id === selectedMaintenanceForPerform.value.id)
  if (index > -1) {
    maintenanceRecords.value[index] = {
      ...maintenanceRecords.value[index],
      ...performForm,
      status: 'completed',
      updateTime: new Date().toISOString().split('T')[0]
    }
  }
  ElMessage.success('保养执行成功')
  performVisible.value = false
}

const handleCancelMaintenance = (record) => {
  ElMessageBox.confirm(
    `确定要取消保养计划「${record.toolingName}」吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 在实际应用中，这里应该调用API更新数据
    const index = maintenanceRecords.value.findIndex(item => item.id === record.id)
    if (index > -1) {
      maintenanceRecords.value[index].status = 'cancelled'
      maintenanceRecords.value[index].updateTime = new Date().toISOString().split('T')[0]
    }
    ElMessage.success('取消成功')
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

const handleMaintenanceNow = (warning) => {
  const record = maintenanceRecords.value.find(r => r.id === warning.id)
  if (record) {
    handlePerformMaintenance(record)
  }
}

const handleBatchMaintenance = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要批量维护的记录')
    return
  }
  
  ElMessageBox.confirm(
    `确定要对选中的 ${selectedRows.value.length} 条记录进行批量维护吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 在实际应用中，这里应该调用API批量更新数据
    selectedRows.value.forEach(row => {
      const index = maintenanceRecords.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        maintenanceRecords.value[index].status = 'in_progress'
        maintenanceRecords.value[index].updateTime = new Date().toISOString().split('T')[0]
      }
    })
    selectedRows.value = []
    ElMessage.success('批量维护成功')
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

const handleExport = () => {
  // 在实际应用中，这里应该调用API导出数据
  ElMessage.success('导出成功')
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  // 在实际应用中，这里应该调用API获取数据
}

const handleCurrentChange = (current) => {
  pagination.currentPage = current
  // 在实际应用中，这里应该调用API获取数据
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

const updateOverdueStatus = () => {
  const today = new Date().toISOString().split('T')[0]
  maintenanceRecords.value.forEach(record => {
    if (record.status === 'scheduled' && record.scheduledDate < today) {
      record.status = 'overdue'
    }
  })
}

const initCharts = () => {
  // 销毁现有图表实例
  if (typeChartInstance) typeChartInstance.destroy()
  if (trendChartInstance) trendChartInstance.destroy()
  
  // 保养类型分布图表
  const typeCtx = maintenanceTypeChart.value.getContext('2d')
  typeChartInstance = new Chart(typeCtx, {
    type: 'pie',
    data: {
      labels: ['日常保养', '定期保养', '故障维修', '预防性维护', '其他'],
      datasets: [{
        data: [25, 30, 20, 15, 10],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  })
  
  // 保养完成趋势图表
  const trendCtx = maintenanceTrendChart.value.getContext('2d')
  trendChartInstance = new Chart(trendCtx, {
    type: 'bar',
    data: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      datasets: [{
        label: '计划保养',
        data: [15, 18, 20, 16, 17, 22, 20, 18, 25, 23, 28, 26],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1
      }, {
        label: '实际完成',
        data: [14, 16, 19, 16, 15, 20, 18, 18, 23, 21, 25, 20],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  })
}

// 生命周期
onMounted(() => {
  pagination.total = maintenanceRecords.value.length
  updateOverdueStatus()
  nextTick(() => {
    if (maintenanceTypeChart.value && maintenanceTrendChart.value) {
      initCharts()
    }
  })
})
</script>

<style scoped>
.tooling-maintenance {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.search-filter {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.search-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
  gap: 10px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-card.success {
  border-left: 4px solid #67c23a;
}

.stat-card.warning {
  border-left: 4px solid #e6a23c;
}

.stat-card.info {
  border-left: 4px solid #909399;
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 16px;
  color: #606266;
}

.charts-section {
  margin-bottom: 20px;
}

.chart-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  height: 300px;
}

.chart-container h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #303133;
  text-align: center;
}

.warning-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.overdue-days {
  color: #f56c6c;
  font-weight: bold;
}

.due-today {
  color: #e6a23c;
  font-weight: bold;
}

.upcoming-days {
  color: #67c23a;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #909399;
}

.maintenance-list {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.card-view {
  margin-top: 20px;
}

.maintenance-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.maintenance-id {
  font-weight: bold;
  color: #303133;
}

.card-body {
  flex: 1;
}

.card-body h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
}

.card-info p {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
}

.card-info p span {
  color: #909399;
  margin-right: 8px;
}

.card-footer {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.maintenance-detail {
  padding: 10px;
}

.detail-section {
  margin-top: 20px;
}

.detail-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tooling-maintenance {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .page-header .header-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .search-filter {
    padding: 15px;
  }
  
  .search-actions {
    flex-direction: column;
  }
  
  .stat-card {
    margin-bottom: 15px;
  }
  
  .chart-container {
    height: 250px;
    margin-bottom: 15px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .card-footer {
    flex-direction: column;
    gap: 10px;
  }
  
  .pagination {
    justify-content: center;
  }
}
</style>