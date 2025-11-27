cat > production-resources/equipment/RepairManagement.vue <<'EOF'
<template>
  <div class="repair-management">
    <div class="header">
      <h1>设备维修管理</h1>
      <el-button type="primary" @click="handleCreateRepair">创建维修单</el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-cards">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ statistics.total }}</div>
          <div class="stat-label">总维修单</div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card warning">
        <div class="stat-content">
          <div class="stat-number">{{ statistics.waiting }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card info">
        <div class="stat-content">
          <div class="stat-number">{{ statistics.repairing }}</div>
          <div class="stat-label">维修中</div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card success">
        <div class="stat-content">
          <div class="stat-number">{{ statistics.completed }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </el-card>
    </div>

    <!-- 筛选工具栏 -->
    <div class="toolbar">
      <el-input v-model="searchKeyword" placeholder="搜索设备/维修单号..." style="width: 300px">
        <template #append>
          <el-button :icon="Search" @click="handleSearch" />
        </template>
      </el-input>
      
      <el-select v-model="filterStatus" placeholder="维修状态" @change="handleSearch">
        <el-option label="全部" value="" />
        <el-option label="待接单" value="pending" />
        <el-option label="维修中" value="repairing" />
        <el-option label="待验收" value="waiting_accept" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>

      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        @change="handleSearch"
      />
      
      <el-select v-model="filterEquipmentType" placeholder="设备类型" @change="handleSearch">
        <el-option label="全部" value="" />
        <el-option label="注塑机" value="注塑机" />
        <el-option label="CNC机床" value="CNC机床" />
        <el-option label="装配机器人" value="装配机器人" />
        <el-option label="冲压机" value="冲压机" />
      </el-select>
    </div>

    <!-- 维修列表表格 -->
    <el-table :data="filteredRepairList" style="width: 100%" v-loading="loading">
      <el-table-column prop="repairNo" label="维修单号" width="140" />
      <el-table-column prop="equipmentName" label="设备名称" />
      <el-table-column prop="equipmentCode" label="设备编号" width="120" />
      <el-table-column prop="faultDescription" label="故障描述" />
      <el-table-column prop="reporter" label="报修人" width="100" />
      <el-table-column prop="reportTime" label="报修时间" width="160" />
      <el-table-column prop="assignee" label="维修人" width="100" />
      <el-table-column prop="priority" label="优先级" width="80">
        <template #default="scope">
          <el-tag :type="getPriorityType(scope.row.priority)">
            {{ getPriorityText(scope.row.priority) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="handleView(scope.row)">查看</el-button>
          <el-button 
            link 
            type="primary" 
            v-if="scope.row.status === 'pending'" 
            @click="handleAssign(scope.row)"
          >
            派单
          </el-button>
          <el-button 
            link 
            type="success" 
            v-if="scope.row.status === 'repairing'" 
            @click="handleComplete(scope.row)"
          >
            完成
          </el-button>
          <el-button 
            link 
            type="warning" 
            v-if="scope.row.status === 'waiting_accept'" 
            @click="handleAccept(scope.row)"
          >
            验收
          </el-button>
          <el-button 
            link 
            type="danger" 
            v-if="['pending', 'repairing'].includes(scope.row.status)" 
            @click="handleCancel(scope.row)"
          >
            取消
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredTotal"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 创建/编辑维修单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="repairFormRef"
        :model="repairForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="设备名称" prop="equipmentName">
          <el-select v-model="repairForm.equipmentName" placeholder="请选择设备">
            <el-option label="注塑机" value="注塑机" />
            <el-option label="CNC机床" value="CNC机床" />
            <el-option label="装配机器人" value="装配机器人" />
            <el-option label="冲压机" value="冲压机" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备编号" prop="equipmentCode">
          <el-input v-model="repairForm.equipmentCode" placeholder="请输入设备编号" />
        </el-form-item>
        <el-form-item label="故障类型" prop="faultType">
          <el-select v-model="repairForm.faultType" placeholder="请选择故障类型">
            <el-option label="机械故障" value="mechanical" />
            <el-option label="电气故障" value="electrical" />
            <el-option label="液压故障" value="hydraulic" />
            <el-option label="控制系统故障" value="control" />
          </el-select>
        </el-form-item>
        <el-form-item label="故障描述" prop="faultDescription">
          <el-input
            v-model="repairForm.faultDescription"
            type="textarea"
            :rows="3"
            placeholder="请详细描述故障情况"
          />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="repairForm.priority">
            <el-radio value="high">高</el-radio>
            <el-radio value="medium">中</el-radio>
            <el-radio value="low">低</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="报修人" prop="reporter">
          <el-input v-model="repairForm.reporter" placeholder="请输入报修人姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 维修单详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="维修单详情"
      width="800px"
    >
      <div v-if="currentRepair" class="repair-detail">
        <div class="detail-header">
          <div class="repair-no">{{ currentRepair.repairNo }}</div>
          <el-tag :type="getStatusType(currentRepair.status)">{{ getStatusText(currentRepair.status) }}</el-tag>
        </div>
        
        <el-descriptions column="2" :column="{ xs: 1, sm: 2 }">
          <el-descriptions-item label="设备名称">{{ currentRepair.equipmentName }}</el-descriptions-item>
          <el-descriptions-item label="设备编号">{{ currentRepair.equipmentCode }}</el-descriptions-item>
          <el-descriptions-item label="故障类型">{{ getFaultTypeText(currentRepair.faultType) }}</el-descriptions-item>
          <el-descriptions-item label="优先级">{{ getPriorityText(currentRepair.priority) }}</el-descriptions-item>
          <el-descriptions-item label="报修人">{{ currentRepair.reporter }}</el-descriptions-item>
          <el-descriptions-item label="报修时间">{{ currentRepair.reportTime }}</el-descriptions-item>
          <el-descriptions-item label="维修人" v-if="currentRepair.assignee">{{ currentRepair.assignee }}</el-descriptions-item>
          <el-descriptions-item label="维修开始时间" v-if="currentRepair.repairStartTime">{{ currentRepair.repairStartTime }}</el-descriptions-item>
          <el-descriptions-item label="维修完成时间" v-if="currentRepair.completeTime">{{ currentRepair.completeTime }}</el-descriptions-item>
          <el-descriptions-item label="验收时间" v-if="currentRepair.acceptTime">{{ currentRepair.acceptTime }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <h3>故障描述</h3>
          <div class="fault-description">{{ currentRepair.faultDescription }}</div>
        </div>

        <div class="detail-section" v-if="currentRepair.diagnosisResult">
          <h3>故障诊断</h3>
          <div class="diagnosis-result">{{ currentRepair.diagnosisResult }}</div>
        </div>

        <div class="detail-section" v-if="currentRepair.repairContent">
          <h3>维修内容</h3>
          <div class="repair-content">{{ currentRepair.repairContent }}</div>
        </div>

        <div class="detail-section" v-if="currentRepair.costs && currentRepair.costs.length > 0">
          <h3>维修成本</h3>
          <el-table :data="currentRepair.costs" style="width: 100%">
            <el-table-column prop="item" label="项目" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="unitPrice" label="单价" width="100">
              <template #default="scope">¥{{ scope.row.unitPrice.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="100" align="right">
              <template #default="scope">¥{{ scope.row.amount.toFixed(2) }}</template>
            </el-table-column>
          </el-table>
          <div class="total-cost">
            <span>总计：¥{{ calculateTotalCost(currentRepair.costs).toFixed(2) }}</span>
          </div>
        </div>

        <div class="detail-section" v-if="currentRepair.acceptanceResult">
          <h3>验收结果</h3>
          <div class="acceptance-result">{{ currentRepair.acceptanceResult }}</div>
        </div>
      </div>
    </el-dialog>

    <!-- 派单对话框 -->
    <el-dialog
      v-model="assignDialogVisible"
      title="维修派单"
      width="400px"
    >
      <el-form
        ref="assignFormRef"
        :model="assignForm"
        :rules="assignRules"
        label-width="100px"
      >
        <el-form-item label="维修人员" prop="assignee">
          <el-select v-model="assignForm.assignee" placeholder="请选择维修人员">
            <el-option label="李工" value="李工" />
            <el-option label="张工" value="张工" />
            <el-option label="王工" value="王工" />
            <el-option label="刘工" value="刘工" />
          </el-select>
        </el-form-item>
        <el-form-item label="维修开始时间">
          <el-date-picker
            v-model="assignForm.startTime"
            type="datetime"
            placeholder="请选择开始时间"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="assignForm.note"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssignSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 完成维修对话框 -->
    <el-dialog
      v-model="completeDialogVisible"
      title="完成维修"
      width="600px"
    >
      <el-form
        ref="completeFormRef"
        :model="completeForm"
        :rules="completeRules"
        label-width="100px"
      >
        <el-form-item label="故障诊断" prop="diagnosisResult">
          <el-input
            v-model="completeForm.diagnosisResult"
            type="textarea"
            :rows="3"
            placeholder="请输入故障诊断结果"
          />
        </el-form-item>
        <el-form-item label="维修内容" prop="repairContent">
          <el-input
            v-model="completeForm.repairContent"
            type="textarea"
            :rows="3"
            placeholder="请输入维修内容"
          />
        </el-form-item>
        <el-form-item label="更换部件">
          <el-button type="primary" link @click="handleAddPart">添加部件</el-button>
          <el-table v-if="completeForm.parts && completeForm.parts.length > 0" :data="completeForm.parts">
            <el-table-column prop="name" label="部件名称" />
            <el-table-column prop="quantity" label="数量" />
            <el-table-column prop="spec" label="规格型号" />
            <el-table-column label="操作" width="80">
              <template #default="scope">
                <el-button link type="danger" @click="handleRemovePart(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
        <el-form-item label="维修完成时间">
          <el-date-picker
            v-model="completeForm.completeTime"
            type="datetime"
            placeholder="请选择完成时间"
            default-value="new Date()"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCompleteSubmit">提交</el-button>
      </template>
    </el-dialog>

    <!-- 验收对话框 -->
    <el-dialog
      v-model="acceptDialogVisible"
      title="验收维修"
      width="500px"
    >
      <el-form
        ref="acceptFormRef"
        :model="acceptForm"
        :rules="acceptRules"
        label-width="100px"
      >
        <el-form-item label="验收结果" prop="acceptanceResult">
          <el-radio-group v-model="acceptForm.acceptanceResult">
            <el-radio value="passed">合格</el-radio>
            <el-radio value="failed">不合格</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="验收意见" prop="comment">
          <el-input
            v-model="acceptForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入验收意见"
          />
        </el-form-item>
        <el-form-item label="验收时间">
          <el-date-picker
            v-model="acceptForm.acceptTime"
            type="datetime"
            placeholder="请选择验收时间"
            default-value="new Date()"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="acceptDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAcceptSubmit">确认验收</el-button>
      </template>
    </el-dialog>

    <!-- 确认对话框 -->
    <el-dialog
      v-model="confirmDialogVisible"
      title="确认操作"
      width="300px"
    >
      <p>{{ confirmMessage }}</p>
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const searchKeyword = ref('')
const filterStatus = ref('')
const filterEquipmentType = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const repairList = ref([])

// 对话框状态
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const assignDialogVisible = ref(false)
const completeDialogVisible = ref(false)
const acceptDialogVisible = ref(false)
const confirmDialogVisible = ref(false)
const dialogTitle = ref('创建维修单')

// 当前操作的维修单
const currentRepair = ref(null)

// 表单数据
const repairForm = ref({
  equipmentName: '',
  equipmentCode: '',
  faultType: '',
  faultDescription: '',
  priority: 'medium',
  reporter: ''
})

const assignForm = ref({
  assignee: '',
  startTime: new Date(),
  note: ''
})

const completeForm = ref({
  diagnosisResult: '',
  repairContent: '',
  parts: [],
  completeTime: new Date()
})

const acceptForm = ref({
  acceptanceResult: 'passed',
  comment: '',
  acceptTime: new Date()
})

// 确认对话框数据
const confirmMessage = ref('')
const confirmAction = ref('')

// 表单验证规则
const formRules = ref({
  equipmentName: [{ required: true, message: '请选择设备名称', trigger: 'change' }],
  equipmentCode: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
  faultType: [{ required: true, message: '请选择故障类型', trigger: 'change' }],
  faultDescription: [{ required: true, message: '请输入故障描述', trigger: 'blur' }],
  reporter: [{ required: true, message: '请输入报修人', trigger: 'blur' }]
})

const assignRules = ref({
  assignee: [{ required: true, message: '请选择维修人员', trigger: 'change' }]
})

const completeRules = ref({
  diagnosisResult: [{ required: true, message: '请输入故障诊断结果', trigger: 'blur' }],
  repairContent: [{ required: true, message: '请输入维修内容', trigger: 'blur' }]
})

const acceptRules = ref({
  acceptanceResult: [{ required: true, message: '请选择验收结果', trigger: 'change' }],
  comment: [{ required: true, message: '请输入验收意见', trigger: 'blur' }]
})

// 表单引用
const repairFormRef = ref(null)
const assignFormRef = ref(null)
const completeFormRef = ref(null)
const acceptFormRef = ref(null)

// 统计数据
const statistics = computed(() => {
  const totalCount = repairList.value.length
  const waitingCount = repairList.value.filter(item => item.status === 'pending' || item.status === 'waiting_accept').length
  const repairingCount = repairList.value.filter(item => item.status === 'repairing').length
  const completedCount = repairList.value.filter(item => item.status === 'completed').length
  
  return {
    total: totalCount,
    waiting: waitingCount,
    repairing: repairingCount,
    completed: completedCount
  }
})

// 筛选后的维修列表
const filteredRepairList = computed(() => {
  let filtered = repairList.value.filter(item => {
    // 搜索关键词筛选
    if (searchKeyword.value && !(
      item.equipmentName.includes(searchKeyword.value) ||
      item.equipmentCode.includes(searchKeyword.value) ||
      item.repairNo.includes(searchKeyword.value)
    )) {
      return false
    }
    
    // 状态筛选
    if (filterStatus.value && item.status !== filterStatus.value) {
      return false
    }
    
    // 设备类型筛选
    if (filterEquipmentType.value && item.equipmentName !== filterEquipmentType.value) {
      return false
    }
    
    // 日期范围筛选
    if (dateRange.value && dateRange.value.length === 2) {
      const reportDate = new Date(item.reportTime.split(' ')[0])
      const startDate = new Date(dateRange.value[0])
      const endDate = new Date(dateRange.value[1])
      if (reportDate < startDate || reportDate > endDate) {
        return false
      }
    }
    
    return true
  })
  
  // 分页
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filtered.slice(startIndex, endIndex)
})

// 筛选后的总数
const filteredTotal = computed(() => {
  return repairList.value.filter(item => {
    if (searchKeyword.value && !(
      item.equipmentName.includes(searchKeyword.value) ||
      item.equipmentCode.includes(searchKeyword.value) ||
      item.repairNo.includes(searchKeyword.value)
    )) {
      return false
    }
    
    if (filterStatus.value && item.status !== filterStatus.value) {
      return false
    }
    
    if (filterEquipmentType.value && item.equipmentName !== filterEquipmentType.value) {
      return false
    }
    
    if (dateRange.value && dateRange.value.length === 2) {
      const reportDate = new Date(item.reportTime.split(' ')[0])
      const startDate = new Date(dateRange.value[0])
      const endDate = new Date(dateRange.value[1])
      if (reportDate < startDate || reportDate > endDate) {
        return false
      }
    }
    
    return true
  }).length
})

// 生命周期钩子
onMounted(() => {
  loadRepairList()
})

// 方法
const loadRepairList = () => {
  loading.value = true
  // 模拟数据加载
  setTimeout(() => {
    repairList.value = [
      {
        id: 1,
        repairNo: 'REP20240115001',
        equipmentName: '注塑机',
        equipmentCode: 'EQ001',
        faultType: 'hydraulic',
        faultDescription: '液压系统压力不足，导致无法正常工作',
        reporter: '张三',
        reportTime: '2024-01-15 09:30:00',
        assignee: '李工',
        repairStartTime: '2024-01-15 10:00:00',
        status: 'repairing',
        priority: 'high'
      },
      {
        id: 2,
        repairNo: 'REP20240114002',
        equipmentName: 'CNC机床',
        equipmentCode: 'EQ002',
        faultType: 'mechanical',
        faultDescription: '主轴异响，影响加工精度',
        reporter: '李四',
        reportTime: '2024-01-14 14:20:00',
        assignee: null,
        status: 'pending',
        priority: 'medium'
      },
      {
        id: 3,
        repairNo: 'REP20240113003',
        equipmentName: '装配机器人',
        equipmentCode: 'EQ003',
        faultType: 'control',
        faultDescription: '定位精度偏差，导致装配错误',
        reporter: '王五',
        reportTime: '2024-01-13 11:15:00',
        assignee: '张工',
        repairStartTime: '2024-01-13 13:00:00',
        completeTime: '2024-01-13 16:00:00',
        acceptTime: '2024-01-13 17:00:00',
        status: 'completed',
        priority: 'high',
        diagnosisResult: '控制系统参数漂移，需要重新校准',
        repairContent: '重新校准控制系统参数，调整机械零点',
        costs: [
          { item: '校准服务费', quantity: 1, unitPrice: 500, amount: 500 },
          { item: '工时费', quantity: 3, unitPrice: 150, amount: 450 }
        ],
        acceptanceResult: '设备运行正常，定位精度达到要求'
      },
      {
        id: 4,
        repairNo: 'REP20240112004',
        equipmentName: '冲压机',
        equipmentCode: 'EQ004',
        faultType: 'electrical',
        faultDescription: '电气控制系统故障，无法启动',
        reporter: '赵六',
        reportTime: '2024-01-12 08:45:00',
        assignee: '王工',
        repairStartTime: '2024-01-12 09:30:00',
        status: 'waiting_accept',
        priority: 'high',
        diagnosisResult: '主控板损坏，需要更换',
        repairContent: '更换主控板，重新设置参数',
        costs: [
          { item: '主控板', quantity: 1, unitPrice: 2500, amount: 2500 },
          { item: '工时费', quantity: 2, unitPrice: 150, amount: 300 }
        ]
      }
    ]
    total.value = repairList.value.length
    loading.value = false
  }, 500)
}

const getStatusType = (status) => {
  const types = {
    pending: 'info',
    repairing: 'warning',
    waiting_accept: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待接单',
    repairing: '维修中',
    waiting_accept: '待验收',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || '未知'
}

const getPriorityType = (priority) => {
  const types = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return types[priority] || 'info'
}

const getPriorityText = (priority) => {
  const texts = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return texts[priority] || '未知'
}

const getFaultTypeText = (faultType) => {
  const texts = {
    mechanical: '机械故障',
    electrical: '电气故障',
    hydraulic: '液压故障',
    control: '控制系统故障'
  }
  return texts[faultType] || '未知'
}

const calculateTotalCost = (costs) => {
  return costs.reduce((sum, cost) => sum + cost.amount, 0)
}

const resetForm = () => {
  repairForm.value = {
    equipmentName: '',
    equipmentCode: '',
    faultType: '',
    faultDescription: '',
    priority: 'medium',
    reporter: ''
  }
  if (repairFormRef.value) {
    repairFormRef.value.resetFields()
  }
}

const handleCreateRepair = () => {
  dialogTitle.value = '创建维修单'
  resetForm()
  dialogVisible.value = true
}

const handleView = (repair) => {
  currentRepair.value = { ...repair }
  detailDialogVisible.value = true
}

const handleAssign = (repair) => {
  currentRepair.value = { ...repair }
  assignForm.value = {
    assignee: '',
    startTime: new Date(),
    note: ''
  }
  if (assignFormRef.value) {
    assignFormRef.value.resetFields()
  }
  assignDialogVisible.value = true
}

const handleComplete = (repair) => {
  currentRepair.value = { ...repair }
  completeForm.value = {
    diagnosisResult: '',
    repairContent: '',
    parts: [],
    completeTime: new Date()
  }
  if (completeFormRef.value) {
    completeFormRef.value.resetFields()
  }
  completeDialogVisible.value = true
}

const handleAccept = (repair) => {
  currentRepair.value = { ...repair }
  acceptForm.value = {
    acceptanceResult: 'passed',
    comment: '',
    acceptTime: new Date()
  }
  if (acceptFormRef.value) {
    acceptFormRef.value.resetFields()
  }
  acceptDialogVisible.value = true
}

const handleCancel = (repair) => {
  currentRepair.value = { ...repair }
  confirmMessage.value = '确定要取消该维修单吗？'
  confirmAction.value = 'cancel'
  confirmDialogVisible.value = true
}

const handleAddPart = () => {
  completeForm.value.parts.push({
    name: '',
    quantity: 1,
    spec: ''
  })
}

const handleRemovePart = (index) => {
  completeForm.value.parts.splice(index, 1)
}

const handleSubmit = async () => {
  try {
    await repairFormRef.value.validate()
    
    // 模拟提交数据
    const newRepair = {
      id: repairList.value.length + 1,
      repairNo: `REP${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(repairList.value.length + 1).padStart(3, '0')}`,
      ...repairForm.value,
      reportTime: new Date().toLocaleString('zh-CN'),
      status: 'pending'
    }
    
    repairList.value.unshift(newRepair)
    dialogVisible.value = false
    ElMessage.success('维修单创建成功')
  } catch (error) {
    // 表单验证失败
  }
}

const handleAssignSubmit = async () => {
  try {
    await assignFormRef.value.validate()
    
    // 更新维修单状态
    const repairIndex = repairList.value.findIndex(item => item.id === currentRepair.value.id)
    if (repairIndex !== -1) {
      repairList.value[repairIndex].assignee = assignForm.value.assignee
      repairList.value[repairIndex].repairStartTime = assignForm.value.startTime
      repairList.value[repairIndex].status = 'repairing'
    }
    
    assignDialogVisible.value = false
    ElMessage.success('派单成功')
  } catch (error) {
    // 表单验证失败
  }
}

const handleCompleteSubmit = async () => {
  try {
    await completeFormRef.value.validate()
    
    // 更新维修单状态
    const repairIndex = repairList.value.findIndex(item => item.id === currentRepair.value.id)
    if (repairIndex !== -1) {
      repairList.value[repairIndex].diagnosisResult = completeForm.value.diagnosisResult
      repairList.value[repairIndex].repairContent = completeForm.value.repairContent
      repairList.value[repairIndex].parts = completeForm.value.parts
      repairList.value[repairIndex].completeTime = completeForm.value.completeTime
      repairList.value[repairIndex].status = 'waiting_accept'
      
      // 模拟生成维修成本
      if (completeForm.value.parts.length > 0) {
        repairList.value[repairIndex].costs = [
          ...completeForm.value.parts.map(part => ({
            item: part.name,
            quantity: part.quantity,
            unitPrice: Math.floor(Math.random() * 500) + 100,
            amount: (Math.floor(Math.random() * 500) + 100) * part.quantity
          })),
          { item: '工时费', quantity: 3, unitPrice: 150, amount: 450 }
        ]
      }
    }
    
    completeDialogVisible.value = false
    ElMessage.success('维修完成，等待验收')
  } catch (error) {
    // 表单验证失败
  }
}

const handleAcceptSubmit = async () => {
  try {
    await acceptFormRef.value.validate()
    
    // 更新维修单状态
    const repairIndex = repairList.value.findIndex(item => item.id === currentRepair.value.id)
    if (repairIndex !== -1) {
      repairList.value[repairIndex].acceptanceResult = acceptForm.value.acceptanceResult === 'passed' ? '验收合格' : '验收不合格'
      repairList.value[repairIndex].acceptComment = acceptForm.value.comment
      repairList.value[repairIndex].acceptTime = acceptForm.value.acceptTime
      repairList.value[repairIndex].status = acceptForm.value.acceptanceResult === 'passed' ? 'completed' : 'repairing'
    }
    
    acceptDialogVisible.value = false
    ElMessage.success(acceptForm.value.acceptanceResult === 'passed' ? '验收合格' : '验收不合格，设备需要重新维修')
  } catch (error) {
    // 表单验证失败
  }
}

const handleConfirm = () => {
  if (confirmAction.value === 'cancel') {
    const repairIndex = repairList.value.findIndex(item => item.id === currentRepair.value.id)
    if (repairIndex !== -1) {
      repairList.value[repairIndex].status = 'cancelled'
    }
    ElMessage.success('维修单已取消')
  }
  confirmDialogVisible.value = false
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleSizeChange = (size) => {
  pageSize.value = size
}

const handleCurrentChange = (current) => {
  currentPage.value = current
}
</script>

<style scoped>
.repair-management {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.statistics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-card.warning .stat-content {
  color: #e6a23c;
}

.stat-card.info .stat-content {
  color: #67c23a;
}

.stat-card.success .stat-content {
  color: #409eff;
}

.stat-content {
  font-size: 18px;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.repair-detail {
  padding: 10px 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.repair-no {
  font-size: 18px;
  font-weight: bold;
}

.detail-section {
  margin-top: 20px;
}

.detail-section h3 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #303133;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.fault-description,
.diagnosis-result,
.repair-content,
.acceptance-result {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  line-height: 1.6;
}

.total-cost {
  text-align: right;
  margin-top: 10px;
  font-weight: bold;
  color: #e6a23c;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
  }
  
  .toolbar .el-input,
  .toolbar .el-select,
  .toolbar .el-date-picker {
    width: 100% !important;
  }
}
</style>
EOF