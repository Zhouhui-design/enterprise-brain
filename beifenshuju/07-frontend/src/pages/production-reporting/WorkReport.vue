<template>
  <div class="work-report-container">
    <el-page-header
      :title="'报工管理'"
      :subtitle="'生产任务报工记录管理'"
      @back="goBack"
    />
    
    <el-card class="mt-4">
      <!-- 搜索筛选区 -->
      <el-form
        :model="searchForm"
        :inline="true"
        label-position="right"
        class="mb-4"
      >
        <el-form-item label="任务单号">
          <el-input
            v-model="searchForm.taskNo"
            placeholder="请输入任务单号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="产品名称">
          <el-input
            v-model="searchForm.productName"
            placeholder="请输入产品名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="车间">
          <el-select
            v-model="searchForm.workshop"
            placeholder="请选择车间"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="workshop in workshops"
              :key="workshop.value"
              :label="workshop.label"
              :value="workshop.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="报工状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择报工状态"
            clearable
            style="width: 200px"
          >
            <el-option label="未报工" value="0" />
            <el-option label="部分报工" value="1" />
            <el-option label="已报工" value="2" />
            <el-option label="已审核" value="3" />
            <el-option label="已驳回" value="4" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="报工日期">
          <el-date-picker
            v-model="searchForm.reportDate"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 320px"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button type="success" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-form-item>
      </el-form>
      
      <!-- 数据统计卡片 -->
      <div class="stats-cards mb-4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ totalTasks }}</div>
            <div class="stat-label">总任务数</div>
          </div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ unreportedTasks }}</div>
            <div class="stat-label">待报工</div>
          </div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ reportedTasks }}</div>
            <div class="stat-label">已报工</div>
          </div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ approvedTasks }}</div>
            <div class="stat-label">已审核</div>
          </div>
        </el-card>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons mb-4">
        <el-button type="primary" @click="handleCreateReport">
          <el-icon><Plus /></el-icon>
          新增报工
        </el-button>
        <el-button type="danger" @click="handleBatchDelete" :disabled="selectedRows.length === 0">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-button type="warning" @click="handleBatchAudit" :disabled="selectedRows.length === 0">
          <el-icon><Check /></el-icon>
          批量审核
        </el-button>
      </div>
      
      <!-- 报工列表 -->
      <el-table
        v-loading="loading"
        :data="workReportsData"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @row-dblclick="handleRowDblclick"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="reportNo" label="报工单号" min-width="150" />
        <el-table-column prop="taskNo" label="任务单号" min-width="150" />
        <el-table-column prop="productName" label="产品名称" min-width="180" />
        <el-table-column prop="workshopName" label="车间" min-width="100" />
        <el-table-column prop="processName" label="工序" min-width="120" />
        <el-table-column prop="reportQuantity" label="报工数量" min-width="100" />
        <el-table-column prop="defectQuantity" label="不良数量" min-width="100" />
        <el-table-column prop="reportDate" label="报工日期" min-width="120" />
        <el-table-column prop="reporter" label="报工人" min-width="100" />
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="scope">
            <el-tag
              :type="getStatusType(scope.row.status)"
              effect="light"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="150" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="handleViewReport(scope.row)"
              v-if="['1', '2'].includes(scope.row.status)"
            >
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="handleAudit(scope.row)"
              v-if="['1', '2'].includes(scope.row.status)"
            >
              <el-icon><Check /></el-icon>
              审核
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(scope.row)"
              v-if="['1', '4'].includes(scope.row.status)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
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
    
    <!-- 报工详情对话框 -->
    <el-dialog
      v-model="reportDetailVisible"
      :title="'报工详情 - ' + (currentReport?.reportNo || '')"
      width="80%"
      destroy-on-close
    >
      <div class="report-detail">
        <el-descriptions border :column="1" class="mb-4">
          <el-descriptions-item label="报工单号">{{ currentReport?.reportNo }}</el-descriptions-item>
          <el-descriptions-item label="任务单号">{{ currentReport?.taskNo }}</el-descriptions-item>
          <el-descriptions-item label="产品编码">{{ currentReport?.productCode }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ currentReport?.productName }}</el-descriptions-item>
          <el-descriptions-item label="规格型号">{{ currentReport?.specification }}</el-descriptions-item>
          <el-descriptions-item label="计划数量">{{ currentReport?.plannedQuantity }}</el-descriptions-item>
          <el-descriptions-item label="报工数量">{{ currentReport?.reportQuantity }}</el-descriptions-item>
          <el-descriptions-item label="不良数量">{{ currentReport?.defectQuantity }}</el-descriptions-item>
          <el-descriptions-item label="良品数量">{{ currentReport?.goodQuantity }}</el-descriptions-item>
          <el-descriptions-item label="报工日期">{{ currentReport?.reportDate }}</el-descriptions-item>
          <el-descriptions-item label="报工人">{{ currentReport?.reporter }}</el-descriptions-item>
          <el-descriptions-item label="车间">{{ currentReport?.workshopName }}</el-descriptions-item>
          <el-descriptions-item label="工序">{{ currentReport?.processName }}</el-descriptions-item>
          <el-descriptions-item label="班次">{{ currentReport?.shift }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentReport?.remark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentReport?.status)">
              {{ getStatusText(currentReport?.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 不良明细 -->
        <div v-if="currentReport?.defectItems && currentReport.defectItems.length > 0" class="mb-4">
          <h3 class="section-title">不良明细</h3>
          <el-table :data="currentReport.defectItems" style="width: 100%">
            <el-table-column prop="defectType" label="不良类型" min-width="120" />
            <el-table-column prop="defectReason" label="不良原因" min-width="200" />
            <el-table-column prop="quantity" label="数量" min-width="80" />
            <el-table-column prop="remark" label="备注" min-width="200" />
          </el-table>
        </div>
        
        <!-- 操作日志 -->
        <div class="mb-4">
          <h3 class="section-title">操作日志</h3>
          <el-timeline>
            <el-timeline-item
              v-for="(log, index) in currentReport?.operationLogs"
              :key="index"
              :timestamp="log.time"
              placement="top"
            >
              <div class="log-content">
                <div class="log-actor">{{ log.actor }}：</div>
                <div class="log-action">{{ log.action }}</div>
                <div class="log-details" v-if="log.details">{{ log.details }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reportDetailVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 新增/编辑报工对话框 -->
    <el-dialog
      v-model="createReportVisible"
      :title="isEdit ? '编辑报工' : '新增报工'"
      width="70%"
      destroy-on-close
    >
      <el-form
        ref="reportFormRef"
        :model="reportForm"
        :rules="reportFormRules"
        label-position="right"
        label-width="120px"
        class="report-form"
      >
        <el-form-item label="任务单号" prop="taskNo">
          <el-input v-model="reportForm.taskNo" placeholder="请输入任务单号" />
        </el-form-item>
        
        <el-form-item label="产品信息" prop="productId">
          <el-select
            v-model="reportForm.productId"
            placeholder="请选择产品"
            filterable
            clearable
            @change="handleProductChange"
          >
            <el-option
              v-for="product in products"
              :key="product.id"
              :label="product.name + ' (' + product.specification + ')'"
              :value="product.id"
              :disabled="!product.available"
            />
          </el-select>
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报工数量" prop="reportQuantity">
              <el-input
                v-model.number="reportForm.reportQuantity"
                type="number"
                :min="0"
                placeholder="请输入报工数量"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="不良数量" prop="defectQuantity">
              <el-input
                v-model.number="reportForm.defectQuantity"
                type="number"
                :min="0"
                placeholder="请输入不良数量"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车间" prop="workshop">
              <el-select
                v-model="reportForm.workshop"
                placeholder="请选择车间"
              >
                <el-option
                  v-for="workshop in workshops"
                  :key="workshop.value"
                  :label="workshop.label"
                  :value="workshop.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工序" prop="process">
              <el-select
                v-model="reportForm.process"
                placeholder="请选择工序"
              >
                <el-option
                  v-for="process in processes"
                  :key="process.value"
                  :label="process.label"
                  :value="process.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="班次" prop="shift">
              <el-select
                v-model="reportForm.shift"
                placeholder="请选择班次"
              >
                <el-option label="早班" value="早班" />
                <el-option label="中班" value="中班" />
                <el-option label="晚班" value="晚班" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报工日期" prop="reportDate">
              <el-date-picker
                v-model="reportForm.reportDate"
                type="date"
                placeholder="请选择报工日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="不良明细">
          <el-button type="primary" size="small" @click="addDefectItem">
            <el-icon><Plus /></el-icon>
            添加不良
          </el-button>
          <el-table
            v-if="reportForm.defectItems && reportForm.defectItems.length > 0"
            :data="reportForm.defectItems"
            style="width: 100%"
            border
            class="mt-2"
          >
            <el-table-column prop="defectType" label="不良类型" min-width="150">
              <template #default="scope">
                <el-input v-model="scope.row.defectType" placeholder="请输入不良类型" />
              </template>
            </el-table-column>
            <el-table-column prop="defectReason" label="不良原因" min-width="200">
              <template #default="scope">
                <el-input v-model="scope.row.defectReason" placeholder="请输入不良原因" />
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" min-width="100">
              <template #default="scope">
                <el-input
                  v-model.number="scope.row.quantity"
                  type="number"
                  :min="0"
                  placeholder="数量"
                />
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="200">
              <template #default="scope">
                <el-input v-model="scope.row.remark" placeholder="备注" />
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="80">
              <template #default="scope">
                <el-button
                  type="danger"
                  size="small"
                  @click="removeDefectItem(scope.$index)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input
            v-model="reportForm.remark"
            type="textarea"
            placeholder="请输入备注信息"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createReportVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitReport">提交</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 审核对话框 -->
    <el-dialog
      v-model="auditDialogVisible"
      title="报工审核"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="auditFormRef"
        :model="auditForm"
        :rules="auditFormRules"
        label-position="right"
        label-width="80px"
      >
        <el-form-item label="审核结果" prop="auditResult">
          <el-radio-group v-model="auditForm.auditResult">
            <el-radio :label="1">审核通过</el-radio>
            <el-radio :label="0">审核驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见" prop="auditComment">
          <el-input
            v-model="auditForm.auditComment"
            type="textarea"
            placeholder="请输入审核意见"
            :rows="4"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="auditDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitAudit">确认审核</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download, Plus, Delete, Check, View } from '@element-plus/icons-vue'

export default {
  name: 'WorkReport',
  components: {
    Search,
    Refresh,
    Download,
    Plus,
    Delete,
    Check,
    View
  },
  setup() {
    // 搜索表单
    const searchForm = reactive({
      taskNo: '',
      productName: '',
      workshop: '',
      status: '',
      reportDate: null
    })
    
    // 报工表单
    const reportForm = reactive({
      id: '',
      reportNo: '',
      taskNo: '',
      productId: '',
      productCode: '',
      productName: '',
      specification: '',
      reportQuantity: 0,
      defectQuantity: 0,
      workshop: '',
      process: '',
      shift: '',
      reportDate: '',
      remark: '',
      defectItems: []
    })
    
    // 审核表单
    const auditForm = reactive({
      auditResult: 1,
      auditComment: ''
    })
    
    // 表单验证规则
    const reportFormRules = {
      taskNo: [{ required: true, message: '请输入任务单号', trigger: 'blur' }],
      productId: [{ required: true, message: '请选择产品', trigger: 'blur' }],
      reportQuantity: [
        { required: true, message: '请输入报工数量', trigger: 'blur' },
        { type: 'number', min: 1, message: '报工数量必须大于0', trigger: 'blur' }
      ],
      defectQuantity: [
        { type: 'number', min: 0, message: '不良数量不能小于0', trigger: 'blur' }
      ],
      workshop: [{ required: true, message: '请选择车间', trigger: 'blur' }],
      process: [{ required: true, message: '请选择工序', trigger: 'blur' }],
      shift: [{ required: true, message: '请选择班次', trigger: 'blur' }],
      reportDate: [{ required: true, message: '请选择报工日期', trigger: 'blur' }]
    }
    
    const auditFormRules = {
      auditResult: [{ required: true, message: '请选择审核结果', trigger: 'change' }],
      auditComment: [{ required: true, message: '请输入审核意见', trigger: 'blur' }]
    }
    
    // 响应式数据
    const loading = ref(false)
    const reportDetailVisible = ref(false)
    const createReportVisible = ref(false)
    const auditDialogVisible = ref(false)
    const isEdit = ref(false)
    const currentReport = ref(null)
    const selectedRows = ref([])
    
    // 分页相关
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10,
      total: 0
    })
    
    // 车间数据
    const workshops = ref([
      { label: '冲压车间', value: '冲压车间' },
      { label: '焊接车间', value: '焊接车间' },
      { label: '喷涂车间', value: '喷涂车间' },
      { label: '装配车间', value: '装配车间' },
      { label: '包装车间', value: '包装车间' }
    ])
    
    // 工序数据
    const processes = ref([
      { label: '下料', value: '下料' },
      { label: '冲压', value: '冲压' },
      { label: '焊接', value: '焊接' },
      { label: '打磨', value: '打磨' },
      { label: '喷涂', value: '喷涂' },
      { label: '装配', value: '装配' },
      { label: '包装', value: '包装' }
    ])
    
    // 产品数据
    const products = ref([
      { id: 1, code: 'P001', name: '汽车座椅', specification: '标准版', available: true },
      { id: 2, code: 'P002', name: '汽车仪表盘', specification: '高配版', available: true },
      { id: 3, code: 'P003', name: '汽车方向盘', specification: '真皮版', available: true },
      { id: 4, code: 'P004', name: '汽车音响', specification: '8扬声器', available: true },
      { id: 5, code: 'P005', name: '汽车空调', specification: '自动版', available: true }
    ])
    
    // 模拟报工数据
    const workReports = ref([])
    
    // 计算属性 - 显示的报工数据
    const workReportsData = computed(() => {
      const startIndex = (pagination.currentPage - 1) * pagination.pageSize
      const endIndex = startIndex + pagination.pageSize
      return workReports.value.slice(startIndex, endIndex)
    })
    
    // 计算统计数据
    const totalTasks = computed(() => workReports.value.length)
    const unreportedTasks = computed(() => workReports.value.filter(item => item.status === '0').length)
    const reportedTasks = computed(() => workReports.value.filter(item => ['1', '2'].includes(item.status)).length)
    const approvedTasks = computed(() => workReports.value.filter(item => item.status === '3').length)
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        '0': '未报工',
        '1': '部分报工',
        '2': '已报工',
        '3': '已审核',
        '4': '已驳回'
      }
      return statusMap[status] || '未知'
    }
    
    // 获取状态标签类型
    const getStatusType = (status) => {
      const typeMap = {
        '0': 'info',
        '1': 'warning',
        '2': 'primary',
        '3': 'success',
        '4': 'danger'
      }
      return typeMap[status] || 'info'
    }
    
    // 生成模拟数据
    const generateMockData = () => {
      const mockData = []
      const statuses = ['0', '1', '2', '3', '4']
      const workshops = ['冲压车间', '焊接车间', '喷涂车间', '装配车间', '包装车间']
      const processes = ['下料', '冲压', '焊接', '打磨', '喷涂', '装配', '包装']
      const products = [
        { code: 'P001', name: '汽车座椅', specification: '标准版' },
        { code: 'P002', name: '汽车仪表盘', specification: '高配版' },
        { code: 'P003', name: '汽车方向盘', specification: '真皮版' },
        { code: 'P004', name: '汽车音响', specification: '8扬声器' },
        { code: 'P005', name: '汽车空调', specification: '自动版' }
      ]
      
      for (let i = 1; i <= 50; i++) {
        const product = products[Math.floor(Math.random() * products.length)]
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const plannedQuantity = Math.floor(Math.random() * 500) + 100
        const reportQuantity = status === '0' ? 0 : Math.floor(Math.random() * plannedQuantity) + (status === '2' ? plannedQuantity - Math.floor(Math.random() * plannedQuantity) : 0)
        const defectQuantity = status === '0' ? 0 : Math.floor(Math.random() * Math.min(50, reportQuantity))
        
        const report = {
          id: i,
          reportNo: 'BG' + new Date().getFullYear() + (String(i).padStart(6, '0')),
          taskNo: 'WO' + new Date().getFullYear() + (String(Math.floor(Math.random() * 1000) + 1).padStart(4, '0')),
          productCode: product.code,
          productName: product.name,
          specification: product.specification,
          plannedQuantity: plannedQuantity,
          reportQuantity: reportQuantity,
          defectQuantity: defectQuantity,
          goodQuantity: reportQuantity - defectQuantity,
          workshopName: workshops[Math.floor(Math.random() * workshops.length)],
          processName: processes[Math.floor(Math.random() * processes.length)],
          shift: ['早班', '中班', '晚班'][Math.floor(Math.random() * 3)],
          reportDate: status === '0' ? '' : new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reporter: ['张三', '李四', '王五', '赵六', '钱七'][Math.floor(Math.random() * 5)],
          status: status,
          remark: Math.random() > 0.7 ? '正常生产' : '',
          defectItems: status === '0' || defectQuantity === 0 ? [] : [
            {
              defectType: ['表面划伤', '尺寸超差', '装配不良', '功能失效'][Math.floor(Math.random() * 4)],
              defectReason: ['操作失误', '设备故障', '材料问题', '环境因素'][Math.floor(Math.random() * 4)],
              quantity: defectQuantity,
              remark: ''
            }
          ],
          operationLogs: [
            {
              time: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
              actor: ['张三', '李四', '王五', '赵六', '钱七'][Math.floor(Math.random() * 5)],
              action: status === '0' ? '创建任务' : status === '3' ? '审核通过' : status === '4' ? '审核驳回' : '提交报工',
              details: ''
            }
          ]
        }
        mockData.push(report)
      }
      
      workReports.value = mockData
      pagination.total = mockData.length
    }
    
    // 搜索
    const handleSearch = () => {
      loading.value = true
      // 模拟搜索延迟
      setTimeout(() => {
        // 这里应该根据搜索条件过滤数据
        // 由于是模拟数据，直接使用当前数据
        pagination.currentPage = 1
        loading.value = false
        ElMessage.success('搜索成功')
      }, 500)
    }
    
    // 重置
    const handleReset = () => {
      Object.keys(searchForm).forEach(key => {
        searchForm[key] = ''
      })
      searchForm.reportDate = null
      pagination.currentPage = 1
    }
    
    // 导出
    const handleExport = () => {
      ElMessage.success('导出成功')
    }
    
    // 新增报工
    const handleCreateReport = () => {
      isEdit.value = false
      // 重置表单
      Object.keys(reportForm).forEach(key => {
        reportForm[key] = ''
      })
      reportForm.reportQuantity = 0
      reportForm.defectQuantity = 0
      reportForm.defectItems = []
      reportForm.reportDate = new Date().toISOString().split('T')[0]
      
      createReportVisible.value = true
    }
    
    // 查看报工详情
    const handleViewReport = (row) => {
      currentReport.value = { ...row }
      reportDetailVisible.value = true
    }
    
    // 审核报工
    const handleAudit = (row) => {
      currentReport.value = { ...row }
      auditForm.auditResult = 1
      auditForm.auditComment = ''
      auditDialogVisible.value = true
    }
    
    // 删除报工
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        `确定要删除报工单号为【${row.reportNo}】的记录吗？`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        const index = workReports.value.findIndex(item => item.id === row.id)
        if (index > -1) {
          workReports.value.splice(index, 1)
          pagination.total = workReports.value.length
          ElMessage.success('删除成功')
        }
      }).catch(() => {})
    }
    
    // 批量删除
    const handleBatchDelete = () => {
      ElMessageBox.confirm(
        `确定要删除选中的${selectedRows.value.length}条记录吗？`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        const ids = selectedRows.value.map(row => row.id)
        workReports.value = workReports.value.filter(item => !ids.includes(item.id))
        pagination.total = workReports.value.length
        selectedRows.value = []
        ElMessage.success('批量删除成功')
      }).catch(() => {})
    }
    
    // 批量审核
    const handleBatchAudit = () => {
      // 这里简化处理，实际应该打开审核对话框
      ElMessage.success(`已批量审核${selectedRows.value.length}条记录`)
      selectedRows.value = []
    }
    
    // 提交报工
    const handleSubmitReport = () => {
      // 这里应该进行表单验证
      ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
      createReportVisible.value = false
      
      if (!isEdit.value) {
        // 模拟添加新数据
        const newReport = {
          id: workReports.value.length + 1,
          reportNo: 'BG' + new Date().getFullYear() + (String(workReports.value.length + 1).padStart(6, '0')),
          taskNo: reportForm.taskNo,
          productCode: reportForm.productCode,
          productName: reportForm.productName,
          specification: reportForm.specification,
          plannedQuantity: 500, // 模拟计划数量
          reportQuantity: reportForm.reportQuantity,
          defectQuantity: reportForm.defectQuantity,
          goodQuantity: reportForm.reportQuantity - reportForm.defectQuantity,
          workshopName: reportForm.workshop,
          processName: reportForm.process,
          shift: reportForm.shift,
          reportDate: reportForm.reportDate,
          reporter: '当前用户',
          status: '2',
          remark: reportForm.remark,
          defectItems: reportForm.defectItems,
          operationLogs: [
            {
              time: new Date().toISOString().replace('T', ' ').substring(0, 19),
              actor: '当前用户',
              action: '提交报工',
              details: ''
            }
          ]
        }
        workReports.value.unshift(newReport)
        pagination.total = workReports.value.length
      }
    }
    
    // 提交审核
    const handleSubmitAudit = () => {
      // 这里应该进行表单验证
      const auditResult = auditForm.auditResult === 1 ? '3' : '4'
      const auditAction = auditForm.auditResult === 1 ? '审核通过' : '审核驳回'
      
      // 更新状态和操作日志
      const index = workReports.value.findIndex(item => item.id === currentReport.value.id)
      if (index > -1) {
        workReports.value[index].status = auditResult
        workReports.value[index].operationLogs.push({
          time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          actor: '当前用户',
          action: auditAction,
          details: auditForm.auditComment
        })
      }
      
      ElMessage.success('审核成功')
      auditDialogVisible.value = false
    }
    
    // 产品选择变化
    const handleProductChange = (productId) => {
      const product = products.value.find(p => p.id === productId)
      if (product) {
        reportForm.productCode = product.code
        reportForm.productName = product.name
        reportForm.specification = product.specification
      } else {
        reportForm.productCode = ''
        reportForm.productName = ''
        reportForm.specification = ''
      }
    }
    
    // 添加不良项
    const addDefectItem = () => {
      reportForm.defectItems.push({
        defectType: '',
        defectReason: '',
        quantity: 0,
        remark: ''
      })
    }
    
    // 删除不良项
    const removeDefectItem = (index) => {
      reportForm.defectItems.splice(index, 1)
    }
    
    // 行双击事件
    const handleRowDblclick = (row) => {
      handleViewReport(row)
    }
    
    // 选择变化
    const handleSelectionChange = (rows) => {
      selectedRows.value = rows
    }
    
    // 分页大小变化
    const handleSizeChange = (size) => {
      pagination.pageSize = size
    }
    
    // 页码变化
    const handleCurrentChange = (current) => {
      pagination.currentPage = current
    }
    
    // 返回
    const goBack = () => {
      // 实际项目中应该使用路由返回
      ElMessage.info('返回上一页')
    }
    
    // 初始化
    onMounted(() => {
      generateMockData()
    })
    
    return {
      searchForm,
      reportForm,
      auditForm,
      reportFormRules,
      auditFormRules,
      loading,
      reportDetailVisible,
      createReportVisible,
      auditDialogVisible,
      isEdit,
      currentReport,
      selectedRows,
      pagination,
      workshops,
      processes,
      products,
      workReportsData,
      totalTasks,
      unreportedTasks,
      reportedTasks,
      approvedTasks,
      getStatusText,
      getStatusType,
      handleSearch,
      handleReset,
      handleExport,
      handleCreateReport,
      handleViewReport,
      handleAudit,
      handleDelete,
      handleBatchDelete,
      handleBatchAudit,
      handleSubmitReport,
      handleSubmitAudit,
      handleProductChange,
      addDefectItem,
      removeDefectItem,
      handleRowDblclick,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      goBack
    }
  }
}
</script>

<style scoped>
.work-report-container {
  padding: 20px;
}

.stats-cards {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 200px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #1890ff;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 10px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}

.log-content {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.log-actor {
  font-weight: bold;
  color: #1890ff;
}

.log-action {
  margin-top: 5px;
  color: #333;
}

.log-details {
  margin-top: 5px;
  color: #666;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.report-form {
  max-height: 60vh;
  overflow-y: auto;
}
</style>