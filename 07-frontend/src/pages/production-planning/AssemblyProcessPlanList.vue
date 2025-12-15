<template>
  <StandardTablePage
    page-title="组装工序计划列表"
    settings-key="assemblyProcessPlanListV1"
    :table-data="tableData"
    :columns="allColumns"
    :loading="loading"
    :total="pagination.total"
    :current-page="pagination.page"
    :page-size="pagination.pageSize"
    :show-create="true"
    :show-page-settings="true"
    :show-selection="true"
    :show-filter="true"
    :show-pagination="true"
    :show-enhanced-toolbar="true"
    :show-add="false"
    :show-batch-delete="true"
    :show-export="true"
    :show-import="true"
    :show-print="true"
    :show-breadcrumb="true"
    :breadcrumb-items="breadcrumbItems"
    :show-business-vars="true"
    :disable-column-settings="true"
    :business-var-buttons="businessVarButtons"
    :business-var-selects="businessVarSelects"
    :default-settings="defaultSettings"
    @create="handleAdd"
    @selection-change="handleSelectionChange"
    @page-change="handlePageChange"
    @size-change="handleSizeChange"
    @batch-delete="handleBatchDelete"
    @export="handleExport"
    @import="handleImport"
    @refresh="loadData"
    @settings-save="handleSavePageSettings"
  >
    <!-- 搜索表单 -->
    <template #search-form>
      <el-form :inline="true" :model="searchForm" size="small">
        <el-form-item label="组装工序计划编号">
          <el-input 
            ref="searchInputRef"
            v-model="searchForm.planNo" 
            placeholder="请输入" 
            clearable 
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="主生产计划编号">
          <el-input v-model="searchForm.masterPlanNo" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="销售订单编号">
          <el-input v-model="searchForm.salesOrderNo" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="客户订单编号">
          <el-input v-model="searchForm.customerOrderNo" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="工序名称">
          <el-input v-model="searchForm.processName" placeholder="请输入" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="生产产品编号">
          <el-input v-model="searchForm.productCode" placeholder="请输入" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="来源编号">
          <el-input v-model="searchForm.sourceNo" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="计划排程日期">
          <el-date-picker
            v-model="searchForm.scheduleDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
            clearable
          />
        </el-form-item>
        <el-form-item label="订单承诺交期">
          <el-date-picker
            v-model="searchForm.promiseDeliveryDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
            clearable
          />
        </el-form-item>
        <el-form-item label="进度状态">
          <el-select v-model="searchForm.progressStatus" placeholder="请选择" clearable style="width: 130px">
            <el-option label="排程完毕" value="completed" />
            <el-option label="排程中" value="inProgress" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </template>

    <!-- 产品图片列 -->
    <template #column-productImage="{ row }">
      <el-image
        v-if="row.productImage"
        :src="row.productImage"
        :preview-src-list="[row.productImage]"
        fit="cover"
        style="width: 50px; height: 50px; border-radius: 4px;"
      />
      <span v-else style="color: #999;">无图片</span>
    </template>

    <!-- 进度状态列 -->
    <template #column-progressStatus="{ row }">
      <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
        <template v-if="row.unscheduledQty && row.unscheduledQty !== '' && row.unscheduledQty !== null && parseFloat(row.scheduledWorkHours || 0) > 0">
          <el-icon :size="16" color="#67C23A">
            <CircleCheck />
          </el-icon>
          <span style="color: #67C23A; font-weight: 500;">排程完毕</span>
        </template>
        <template v-else-if="parseFloat(row.scheduledWorkHours || 0) === 0">
          <el-icon :size="16" color="#E6A23C" style="animation: rotate 2s linear infinite;">
            <Loading />
          </el-icon>
          <span style="color: #E6A23C; font-weight: 500;">排程中</span>
        </template>
        <template v-else>
          <el-icon :size="16" color="#E6A23C" style="animation: rotate 2s linear infinite;">
            <Loading />
          </el-icon>
          <span style="color: #E6A23C; font-weight: 500;">排程中</span>
        </template>
      </div>
    </template>

    <!-- ✅ BOM详情列 -->
    <template #column-bomDetail="{ row }">
      <el-button 
        size="small" 
        type="primary" 
        link
        @click="handleShowBomDetail(row)"
      >
        查看
      </el-button>
    </template>

    <!-- 操作列 -->
    <template #column-actions="{ row }">
      <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
      <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
    </template>
  </StandardTablePage>

  <!-- 新增/编辑对话框 -->
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑组装工序计划' : '新增组装工序计划'"
    width="80%"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="140px">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="组装工序计划编号" prop="planNo">
            <el-input v-model="formData.planNo" placeholder="自动生成" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="主生产计划编号" prop="masterPlanNo">
            <el-input v-model="formData.masterPlanNo" placeholder="请输入" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工序名称" prop="processName">
            <el-input v-model="formData.processName" placeholder="请输入" />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="计划排程日期" prop="scheduleDate">
            <el-date-picker v-model="formData.scheduleDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="计划排程数量" prop="scheduleQuantity">
            <el-input-number v-model="formData.scheduleQuantity" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="计划完工日期" prop="completionDate">
            <el-date-picker v-model="formData.completionDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="生产产品编号" prop="productCode">
            <el-input v-model="formData.productCode" placeholder="请输入" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="生产产品名称" prop="productName">
            <el-input v-model="formData.productName" placeholder="请输入" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="需补货数量" prop="replenishmentQty">
            <el-input-number v-model="formData.replenishmentQty" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="定时工额" prop="standardWorkQuota">
            <el-input-number v-model="formData.standardWorkQuota" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="需求工时" prop="requiredWorkHours">
            <el-input-number v-model="formData.requiredWorkHours" :min="0" :precision="2" style="width: 100%" disabled />
            <div style="font-size: 12px; color: #909399; margin-top: 4px;">自动计算：需补货数量 / 定时工额</div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
  <!-- ✅ 工序间隔设置弹窗 -->
  <el-dialog
    v-model="processIntervalDialogVisible"
    title="工序间隔设置"
    width="90%"
    top="5vh"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <ProcessIntervalSettings />
  </el-dialog>

  <!-- ✅ BOM详情弹窗 -->
  <BomDetailDialog ref="bomDetailDialogRef" />
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { CircleCheck, Loading } from '@element-plus/icons-vue'
import StandardTablePage from '@/components/common/layout/StandardTablePage.vue'
import ProcessIntervalSettings from './ProcessIntervalSettings.vue'  // ✅ 导入工序间隔设置组件
import BomDetailDialog from './BomDetailDialog.vue'  // ✅ 导入BOM详情弹窗
import * as api from '@/api/assemblyProcessPlan'
import capacityLoadApi from '@/api/capacityLoad'  // ✅ 导入工序能力负荷API
import dateUtils from '@/services/utils/date-utils'  // ✅ 导入日期工具

// ✅ 日期格式化函数：年-月-日
const formatDateYMD = (date) => {
  if (!date) return ''
  return dateUtils.format(date, 'YYYY-MM-DD')
}

// ✅ 业务变量当前配置
const currentBusinessVars = ref({
  defaultMergeRule: 'masterPlanNo',
  minRemainingHours: 0.5
})

// ========== 响应式数据 ==========
const tableData = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const selectedRows = ref([])
const searchInputRef = ref(null)
const bomDetailDialogRef = ref(null)  // ✅ BOM详情弹窗引用

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0
})

// 搜索表单
const searchForm = reactive({
  planNo: '',
  masterPlanNo: '',
  salesOrderNo: '',
  customerOrderNo: '',
  processName: '',
  productCode: '',
  sourceNo: '',
  scheduleDateRange: [],
  promiseDeliveryDateRange: [],
  progressStatus: ''
})

// 表单数据
const formData = ref({
  planNo: '',
  masterPlanNo: '',
  processName: '',
  scheduleDate: new Date(),
  scheduleQuantity: 0,
  completionDate: null,
  productCode: '',
  productName: '',
  replenishmentQty: 0,
  standardWorkQuota: 0,  // ✅ 新增
  requiredWorkHours: 0,  // ✅ 新增（自动计算）
  planStartDate: null,   // ✅ 新增计划开始日期
  realPlanStartDate: null, // ✅ 新增真计划开始日期
  planEndDate: null     // ✅ 新增计划结束日期
})

// 表单验证规则
const formRules = {
  processName: [{ required: true, message: '请输入工序名称', trigger: 'blur' }]
}

// 面包屑
const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '计划&物控', to: '' },
  { title: '真工序计划', to: '' }
]

// ✅ 工序间隔设置弹窗
const processIntervalDialogVisible = ref(false)

// 打开工序间隔设置
const openProcessIntervalSettings = () => {
  processIntervalDialogVisible.value = true
}

// ✅ 修复字段计算
const handleFixFieldCalculations = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要修复所有真工序计划的字段计算吗？这将重新计算所有记录的自动字段。',
      '修复字段计算',
      {
        confirmButtonText: '确定修复',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const loading = ElLoading.service({
      lock: true,
      text: '正在修复字段计算，请稍候...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    
    try {
      const response = await api.fixFieldCalculations()
      
      loading.close()
      
      if (response.code === 200) {
        ElMessage.success(`字段计算修复完成！`)
        console.log('🎉 字段修复结果:', response.data)
        
        // 重新加载数据
        loadData()
      } else {
        ElMessage.error(`修复失败: ${response.message}`)
      }
    } catch (apiError) {
      loading.close()
      throw apiError
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('修复字段计算失败:', error)
      ElMessage.error('修复字段计算失败: ' + (error.message || '未知错误'))
    }
  }
}

// ========== 业务变量配置 ==========
// 业务变量 - 按钮配置
const businessVarButtons = [
  {
    label: '工序间隔设置',
    value: 'processIntervalSettings',
    onClick: openProcessIntervalSettings
  },
  {
    label: '修复字段计算',
    value: 'fixFieldCalculations',
    onClick: handleFixFieldCalculations
  }
]

// 业务变量 - 下拉选择配置
const businessVarSelects = [
  {
    label: '默认统筹设置',
    value: 'defaultMergeRule',
    options: [
      { label: '按“销售订单”合并', value: 'salesOrder' },
      { label: '按“来源主计划编号”合并', value: 'masterPlanNo' },
      { label: '按相同“备料计划编号”合并', value: 'materialPlanNo' },
      { label: '按相同“需求日期”合并', value: 'demandDate' },
      { label: '按相同“计划物料编号”合并', value: 'materialCode' }
    ],
    defaultValue: 'masterPlanNo',
    description: `<div style="margin-top: 8px; padding: 8px; background-color: #f5f7fa; border-radius: 4px; font-size: 12px; line-height: 1.6;">
      <div style="margin-bottom: 4px;">• <strong>按“销售订单”合并</strong>：备料计划推送数据到真工序计划时，相同“销售订单编号”且相同“计划物料编号”合并一起排程</div>
      <div style="margin-bottom: 4px;">• <strong>按“来源主计划编号”合并</strong>：备料计划推送数据到真工序计划时，相同“来源主计划编号”且相同“计划物料编号”合并一起排程</div>
      <div style="margin-bottom: 4px;">• <strong>按相同“备料计划编号”合并</strong>：备料计划推送数据到真工序计划时，相同“备料计划编号”且相同“计划物料编号”合并一起排程</div>
      <div style="margin-bottom: 4px;">• <strong>按相同“需求日期”合并</strong>：备料计划推送数据到真工序计划时，相同“需求日期”且相同“计划物料编号”合并一起排程</div>
      <div style="margin-bottom: 4px;">• <strong>按相同“计划物料编号”</strong>：备料计划推送数据到真工序计划时，相同“计划物料编号”合并一起排程</div>
    </div>`,
    tip: '💡 温馨提示：如有需要自定义合并统筹规则的，请联系周辉 18627407019'
  },
  {
    label: '剩余工时小于',
    value: 'minRemainingHours',
    type: 'number',
    defaultValue: 0.5,
    unit: '小时',
    description: `<div style="margin-top: 8px; padding: 8px; background-color: #fff3cd; border-radius: 4px; font-size: 12px; line-height: 1.6;">
      <div style="margin-bottom: 4px;">• 设置计划结束日期查询的剩余工时门槛值</div>
      <div style="margin-bottom: 4px;">• 只有工序能力负荷表中“剩余工时” ≥ 该值的日期才会被选中</div>
      <div style="margin-bottom: 4px;">• 默认值：0.5小时</div>
    </div>`,
    tip: '💡 温馨提示：设置较大值可确保有足够的剩余工时进行排程'
  }
]

// ========== 默认设置 ==========
const defaultSettings = {
  exportFilePrefix: '真工序计划',
  minRemainingHours: 0.5
}

// ========== 列配置 ==========
const allColumns = ref([
  { prop: 'rowIndex', label: '序号', width: 80, sortable: false, filterable: false, visible: true,
    formatter: (row, column, cellValue, index) => index + 1 },
  { prop: 'planNo', label: '真工序计划编号', width: 160, sortable: true, filterable: true, fixed: 'left', visible: true },
  { prop: 'salesOrderNo', label: '销售订单编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'customerOrderNo', label: '客户订单编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'masterPlanNo', label: '主生产计划编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'mainPlanProductCode', label: '主计划产品编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'mainPlanProductName', label: '主计划产品名称', width: 180, sortable: true, filterable: true, visible: true },
  { prop: 'shippingPlanNo', label: '发货计划编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'productCode', label: '生产产品编号', width: 140, sortable: true, filterable: true, visible: true },
  { prop: 'productName', label: '生产产品名称', width: 180, sortable: true, filterable: true, visible: true },
  { prop: 'productImage', label: '产品图片', width: 100, slot: 'productImage', visible: true },
  { prop: 'processManager', label: '工序负责人', width: 120, filterable: true, visible: true },
  { prop: 'processName', label: '工序名称', width: 140, sortable: true, filterable: true, visible: true },
  { prop: 'scheduleDate', label: '计划排程日期', width: 120, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.scheduleDate) },
  { prop: 'dailyTotalHours', label: '当天总工时', width: 120, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.dailyTotalHours !== undefined ? parseFloat(row.dailyTotalHours).toFixed(2) : '0.00' },
  { prop: 'dailyScheduledHours', label: '当天已排程工时', width: 150, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.dailyScheduledHours !== undefined ? parseFloat(row.dailyScheduledHours).toFixed(2) : '0.00' },
  // ✅ 新增：当日计划行数 = COUNTIFS(工序名称=本行工序名称，计划排程日期=本行计划排程日期，序号<=本行序号)
  { prop: 'dailyPlanCount', label: '当日计划行数', width: 130, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.dailyPlanCount !== undefined ? row.dailyPlanCount : '0' },
  { prop: 'dailyAvailableHours', label: '工序当天可用工时', width: 160, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.dailyAvailableHours !== undefined ? parseFloat(row.dailyAvailableHours).toFixed(2) : '0.00' },
  { prop: 'scheduledWorkHours', label: '计划排程工时', width: 130, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.scheduledWorkHours !== undefined ? parseFloat(row.scheduledWorkHours).toFixed(2) : '0.00' },
  { prop: 'scheduleQuantity', label: '计划排程数量', width: 130, sortable: true, align: 'right', visible: true },
  { prop: 'productUnit', label: '产品单位', width: 100, visible: true },
  { prop: 'level0Demand', label: '0阶需求数量', width: 130, sortable: true, align: 'right', visible: true },
  { prop: 'completionDate', label: '计划完工日期', width: 120, sortable: true, visible: true,
    formatter: (row) => formatDateYMD(row.completionDate) },
  { prop: 'promiseDeliveryDate', label: '订单承诺交期', width: 120, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.promiseDeliveryDate) },
  { prop: 'planStartDate', label: '计划开始日期', width: 120, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.planStartDate) },
  { prop: 'realPlanStartDate', label: '真计划开始日期', width: 130, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.realPlanStartDate) },
  { prop: 'planEndDate', label: '计划结束日期', width: 120, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.planEndDate) },
  { prop: 'nextScheduleDate', label: '下一个排程日期', width: 140, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.nextScheduleDate) },
  { prop: 'workshopName', label: '车间名称', width: 120, filterable: true, visible: true },
  { prop: 'scheduleCount', label: '排程次数', width: 100, sortable: true, align: 'right', visible: true },
  { prop: 'standardWorkQuota', label: '定时工额', width: 100, sortable: true, align: 'right', visible: true },
  { prop: 'standardWorkHours', label: '定额工时', width: 100, sortable: true, align: 'right', visible: true },
  { prop: 'requiredWorkHours', label: '需求工时', width: 100, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.requiredWorkHours !== undefined ? parseFloat(row.requiredWorkHours).toFixed(2) : '0.00' },
  { prop: 'remainingRequiredHours', label: '剩余需求工时', width: 120, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.remainingRequiredHours !== undefined ? parseFloat(row.remainingRequiredHours).toFixed(2) : '0.00' },
  { prop: 'cumulativeScheduleQty', label: '累积排程数量', width: 130, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.cumulativeScheduleQty !== undefined ? parseFloat(row.cumulativeScheduleQty).toFixed(2) : '0.00' },
  { prop: 'unscheduledQty', label: '未排数量', width: 100, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.unscheduledQty !== undefined ? parseFloat(row.unscheduledQty).toFixed(2) : '0.00' },
  { prop: 'progressStatus', label: '进度状态', width: 140, sortable: true, filterable: true, align: 'center', visible: true, slot: 'progressStatus' },
  { prop: 'replenishmentQty', label: '需补货数量', width: 120, sortable: true, align: 'right', visible: true },
  { prop: 'sourcePageName', label: '来源页面名称', width: 130, filterable: true, visible: false },
  { prop: 'sourceNo', label: '来源编号', width: 160, filterable: true, visible: true },
  { prop: 'previousScheduleNo', label: '上一个排程单号', width: 160, filterable: true, visible: false },
  { prop: 'customerName', label: '客户名称', width: 150, filterable: true, visible: true },
  { prop: 'level0ProductName', label: '0阶产品名称', width: 150, filterable: true, visible: false },
  { prop: 'level0ProductCode', label: '0阶产品编号', width: 140, filterable: true, visible: false },
  { prop: 'level0ProductionQty', label: '0阶主计划生产数量', width: 160, sortable: true, align: 'right', visible: false },
  { prop: 'productSource', label: '产品来源', width: 120, filterable: true, visible: false },
  { prop: 'bomNo', label: '生产BOM编号', width: 160, filterable: true, sortable: true, visible: true },
  { prop: 'hierarchyAddress', label: '层阶地址', width: 120, filterable: true, visible: true },
  { prop: 'bomDetail', label: 'BOM详情', width: 100, slot: 'bomDetail', align: 'center', visible: true },
  { prop: 'submittedBy', label: '提交人', width: 100, filterable: true, visible: true },
  { prop: 'submittedAt', label: '提交时间', width: 160, sortable: true, visible: true }
])

// ========== 工具函数 ==========
const generatePlanNo = () => {
  const now = new Date()
  const year = now.getFullYear()
  const timestamp = now.getTime().toString().slice(-9)
  return `RPP${year}${timestamp}`
}

// ========== 响应式计算 ==========
// 监听需补货数量和定时工额变化，自动计算需求工时
watch(
  () => [formData.value.replenishmentQty, formData.value.standardWorkQuota],
  ([qty, quota]) => {
    if (qty > 0 && quota > 0) {
      formData.value.requiredWorkHours = parseFloat((qty / quota).toFixed(2))
    } else {
      formData.value.requiredWorkHours = 0
    }
  },
  { deep: true }
)

// ✅ 查询计划结束日期：MAXIFS(工序能力负荷表的"日期"，条件1：工序名称匹配，条件2：剩余工时≥门槛值)
const queryPlanEndDate = async () => {
  const requiredWorkHours = parseFloat(formData.value.requiredWorkHours) || 0
  const processName = formData.value.processName
  const completionDate = formData.value.completionDate
  const minRemainingHours = currentBusinessVars.value.minRemainingHours || 0.5
  
  console.log('🔍 查询计划结束日期:', { requiredWorkHours, processName, completionDate, minRemainingHours })
  
  // 前置条件：需求工时 > 0
  if (requiredWorkHours <= 0) {
    console.log('⚠️ 需求工时<=0，跳过查询计划结束日期')
    formData.value.planEndDate = null
    formData.value.planStartDate = null
    formData.value.realPlanStartDate = null  // ✅ 清空真计划开始日期
    return null
  }
  
  if (!processName || !completionDate) {
    console.log('⚠️ 缺少必要参数：工序名称或计划完工日期')
    formData.value.planEndDate = null
    formData.value.planStartDate = null
    formData.value.realPlanStartDate = null  // ✅ 清空真计划开始日期
    return null
  }
  
  try {
    const response = await capacityLoadApi.queryPlanEndDate(
      processName,
      formatDateYMD(completionDate),
      minRemainingHours
    )
    
    if (response?.data?.planEndDate) {
      formData.value.planEndDate = response.data.planEndDate
      console.log(`✅ 计划结束日期查询成功: ${response.data.planEndDate}, 剩余工时: ${response.data.remainingHours}`)
      
      // ✅ 立即查询计划开始日期
      await queryPlanStartDate()
      
      return response.data.planEndDate
    } else {
      formData.value.planEndDate = null
      formData.value.planStartDate = null
      formData.value.realPlanStartDate = null  // ✅ 清空真计划开始日期
      console.log('⚠️ 未找到符合条件的计划结束日期')
      return null
    }
  } catch (error) {
    console.error('❗ 查询计划结束日期失败:', error)
    formData.value.planEndDate = null
    formData.value.planStartDate = null
    formData.value.realPlanStartDate = null  // ✅ 清空真计划开始日期
    return null
  }
}

// ✅ 查询计划开始日期：从计划结束日期向前累加剩余工时，直到累计工时 >= 需求工时
const queryPlanStartDate = async () => {
  const requiredWorkHours = parseFloat(formData.value.requiredWorkHours) || 0
  const processName = formData.value.processName
  const planEndDate = formData.value.planEndDate
  const minRemainingHours = currentBusinessVars.value.minRemainingHours || 0.5
  
  console.log('🔍 查询计划开始日期:', { requiredWorkHours, processName, planEndDate, minRemainingHours })
  
  // 前置条件检查
  if (!processName || !planEndDate) {
    console.log('⚠️ 缺少必要参数：工序名称或计划结束日期')
    formData.value.planStartDate = null
    formData.value.realPlanStartDate = null  // ✅ 清空真计划开始日期
    formData.value.scheduleDate = null  // ✅ 计划排程日期也清空
    return null
  }
  
  if (requiredWorkHours <= 0) {
    // 需求工时为0，开始日期 = 计划结束日期
    formData.value.planStartDate = planEndDate
    
    // ✅ 计算真计划开始日期 = 计划开始日期 + 1天
    const planStart = new Date(planEndDate)
    const realPlanStart = new Date(planStart)
    realPlanStart.setDate(realPlanStart.getDate() + 1)
    formData.value.realPlanStartDate = `${realPlanStart.getFullYear()}-${String(realPlanStart.getMonth() + 1).padStart(2, '0')}-${String(realPlanStart.getDate()).padStart(2, '0')}`
    
    formData.value.scheduleDate = formData.value.realPlanStartDate  // ✅ 计划排程日期 = 真计划开始日期
    console.log('📊 需求工时为0，开始日期=计划结束日期，真计划开始日期=' + formData.value.realPlanStartDate)
    // ✅ 查询当天总工时
    await queryDailyTotalWorkHours()
    // ✅ 计算相关字段
    await calculateSchedulingFields()
    return planEndDate
  }
  
  try {
    // ✅ 使用计划结束日期作为最大日期
    const response = await capacityLoadApi.queryPlanStartDate(
      processName,
      formatDateYMD(planEndDate),  // ✅ 使用计划结束日期
      requiredWorkHours,
      minRemainingHours
    )
    
    if (response?.planStartDate) {
      formData.value.planStartDate = response.planStartDate
      
      // ✅ 计算真计划开始日期 = 计划开始日期 + 1天
      const planStart = new Date(response.planStartDate)
      const realPlanStart = new Date(planStart)
      realPlanStart.setDate(realPlanStart.getDate() + 1)
      formData.value.realPlanStartDate = `${realPlanStart.getFullYear()}-${String(realPlanStart.getMonth() + 1).padStart(2, '0')}-${String(realPlanStart.getDate()).padStart(2, '0')}`
      
      // ✅ 计划排程日期 = 真计划开始日期（仅对排程次数=1生效）
      formData.value.scheduleDate = formData.value.realPlanStartDate
      
      console.log(`✅ 计划开始日期查询成功: ${response.planStartDate}`)
      console.log(`✅ 真计划开始日期: ${formData.value.realPlanStartDate}`)
      console.log(`✅ 计划排程日期: ${formData.value.scheduleDate}, 累计工时: ${response.accumulatedHours}`)
      
      // ✅ 查询当天总工时
      await queryDailyTotalWorkHours()
      
      // ✅ 计算相关字段
      await calculateSchedulingFields()
      
      return response.planStartDate
    } else {
      formData.value.planStartDate = null
      formData.value.realPlanStartDate = null  // ✅ 清空真计划开始日期
      formData.value.scheduleDate = null  // ✅ 计划排程日期也清空
      console.log('⚠️ 未找到符合条件的计划开始日期')
      return null
    }
  } catch (error) {
    console.error('❗ 查询计划开始日期失败:', error)
    formData.value.planStartDate = null
    formData.value.realPlanStartDate = null  // ✅ 清空真计划开始日期
    formData.value.scheduleDate = null  // ✅ 计划排程日期也清空
    return null
  }
}

// ✅ 查询当天总工时：可用工位数量 * 上班时段
const queryDailyTotalWorkHours = async () => {
  const processName = formData.value.processName
  const scheduleDate = formData.value.planStartDate  // ✅ 计划排
}

// ✅ 计算排程相关字段（严格按照生成时机和条件）
const calculateSchedulingFields = async () => {
  console.log('📊 开始计算排程相关字段')
  
  // ✅ 需求1: 计划排程日期已在queryPlanStartDate中设置为真计划开始日期，无需重复赋值
  // 生成条件：计划排程日期不为空
  if (!formData.value.scheduleDate) {
    console.log('⚠️ 需求1: 计划排程日期为空，跳过计算')
    return // 前置条件不满足，终止后续计算
  }
  console.log(`✅ 需求1: 计划排程日期 = ${formData.value.scheduleDate}`)
  
  // ✅ 需求2: 当天已排程工时 (SUMIFS)
  // 生成条件：工序名称不为空 且 计划排程日期不为空
  // 注意：即使没有id也可以计算（新增记录）
  if (formData.value.processName && formData.value.scheduleDate) {
    await calculateDailyScheduledHours()
    console.log(`✅ 需求2: 当天已排程工时 = ${formData.value.dailyScheduledHours}`)
  } else {
    formData.value.dailyScheduledHours = 0
    console.log('⚠️ 需求2: 条件不足，当天已排程工时设为0')
  }
  
  // ✅ 需求3: 工序当天可用工时 = 当天总工时 - 当天已排程工时
  // 生成条件：当天总工时>0 且 当天已排程工时计算完毕
  const dailyTotal = parseFloat(formData.value.dailyTotalWorkHours) || 0
  if (dailyTotal > 0 && formData.value.dailyScheduledHours !== undefined) {
    calculateDailyAvailableHours()
    console.log(`✅ 需求3: 工序当天可用工时 = ${formData.value.dailyAvailableHours}`)
  } else {
    formData.value.dailyAvailableHours = 0
    console.log(`⚠️ 需求3: 当天总工时(${dailyTotal})不符合条件，跳过计算`)
  }
  
  // ✅ 需求4: 计划排程工时 = MIN(工序当天可用工时, 需求工时)
  // 生成条件：工序当天可用工时>0 且 需求工时>0
  const dailyAvailable = parseFloat(formData.value.dailyAvailableHours) || 0
  const required = parseFloat(formData.value.requiredWorkHours) || 0
  if (dailyAvailable > 0 && required > 0) {
    calculateScheduledWorkHours()
    console.log(`✅ 需求4: 计划排程工时 = ${formData.value.scheduledWorkHours}`)
  } else {
    formData.value.scheduledWorkHours = 0
    console.log(`⚠️ 需求4: 工序当天可用工时(${dailyAvailable})或需求工时(${required})不符合条件，跳过计算`)
  }
  
  // ✅ 需求5: 计划排程数量 = 计划排程工时 * 定时工额
  // 生成条件：计划排程工时>0 且 定时工额>0
  const scheduledHours = parseFloat(formData.value.scheduledWorkHours) || 0
  const standardQuota = parseFloat(formData.value.standardWorkQuota) || 0
  if (scheduledHours > 0 && standardQuota > 0) {
    calculateScheduleQuantity()
    console.log(`✅ 需求5: 计划排程数量 = ${formData.value.scheduleQuantity}`)
  } else {
    formData.value.scheduleQuantity = 0
    console.log(`⚠️ 需求5: 计划排程工时(${scheduledHours})或定时工额(${standardQuota})不符合条件，跳过计算`)
  }
  
  // ✅ 需求6: 查询下一个排程日期 (MINIFS)
  // 生成条件：计划排程日期不为空 且 计划结束日期不为空
  if (formData.value.scheduleDate && formData.value.planEndDate) {
    await queryNextScheduleDate()
    console.log(`✅ 需求6: 下一个排程日期 = ${formData.value.nextScheduleDate}`)
  } else {
    formData.value.nextScheduleDate = null
    console.log('⚠️ 需求6: 计划排程日期或计划结束日期为空，跳过计算')
  }
  
  console.log('✅ 所有排程字段计算完毕')
}

// ✅ 需求 6: 查询下一个排程日期 (MINIFS)
const queryNextScheduleDate = async () => {
  const processName = formData.value.processName
  const scheduleDate = formData.value.scheduleDate
  const planEndDate = formData.value.planEndDate
  const minRemainingHours = currentBusinessVars.value.minRemainingHours || 0.5
  
  console.log('🔍 查询下一个排程日期:', { processName, scheduleDate, planEndDate, minRemainingHours })
  
  // ✅ 生成条件：计划排程日期不为空 且 计划结束日期不为空
  if (!processName || !scheduleDate || !planEndDate) {
    console.log('⚠️ 缺少必要参数')
    formData.value.nextScheduleDate = null
    return null
  }
  
  try {
    const response = await capacityLoadApi.queryNextScheduleDate(
      processName,
      formatDateYMD(scheduleDate),
      formatDateYMD(planEndDate), // ✅ 添加计划结束日期参数
      minRemainingHours
    )
    
    if (response?.data?.nextScheduleDate) {
      formData.value.nextScheduleDate = response.data.nextScheduleDate
      console.log(`✅ 下一个排程日期查询成功: ${response.data.nextScheduleDate}`)
      return response.data.nextScheduleDate
    } else {
      formData.value.nextScheduleDate = null
      console.log('⚠️ 未找到符合条件的下一个排程日期')
      return null
    }
  } catch (error) {
    console.error('❗ 查询下一个排程日期失败:', error)
    formData.value.nextScheduleDate = null
    return null
  }
}

// ========== 数据操作 ==========
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      planNo: searchForm.planNo,
      masterPlanNo: searchForm.masterPlanNo,
      salesOrderNo: searchForm.salesOrderNo,
      customerOrderNo: searchForm.customerOrderNo,
      processName: '组装',  // ✅ 强制过滤：只显示组装工序
      productCode: searchForm.productCode,
      sourceNo: searchForm.sourceNo,
      progressStatus: searchForm.progressStatus
    }
    
    if (searchForm.scheduleDateRange && searchForm.scheduleDateRange.length === 2) {
      params.scheduleDateStart = searchForm.scheduleDateRange[0]
      params.scheduleDateEnd = searchForm.scheduleDateRange[1]
    }
    
    if (searchForm.promiseDeliveryDateRange && searchForm.promiseDeliveryDateRange.length === 2) {
      params.promiseDeliveryDateStart = searchForm.promiseDeliveryDateRange[0]
      params.promiseDeliveryDateEnd = searchForm.promiseDeliveryDateRange[1]
    }
    
    const data = await api.getList(params)
    tableData.value = data.records || []
    pagination.total = data.total || 0
    
    ElMessage.success('数据加载成功')
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  formData.value = {
    planNo: generatePlanNo(),
    masterPlanNo: '',
    processName: '',
    scheduleDate: new Date(),
    scheduleQuantity: 0,
    completionDate: null,
    productCode: '',
    productName: '',
    replenishmentQty: 0,
    standardWorkQuota: 0,
    requiredWorkHours: 0,
    planStartDate: null,   // ✅ 新增计划开始日期
    realPlanStartDate: null, // ✅ 新增真计划开始日期
    planEndDate: null     // ✅ 新增计划结束日期
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除组装工序计划编号为 ${row.planNo} 的记录吗？`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await api.deleteById(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败: ' + (error.message || '未知错误'))
    }
  }).catch(() => {})
}

const handleSave = () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await api.updateById(formData.value.id, formData.value)
          ElMessage.success('更新成功')
        } else {
          await api.create(formData.value)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        loadData()
      } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error('保存失败: ' + (error.message || '未知错误'))
      }
    } else {
      console.log('表单验证失败')
    }
  })
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

const handlePageChange = (page) => {
  pagination.page = page
  loadData()
}

const handleSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  loadData()
}

const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的记录')
    return
  }
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedRows.value.length} 条记录吗？`,
    '批量删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const ids = selectedRows.value.map(row => row.id)
      await api.batchDelete(ids)  // ✅ 修复：使用 batchDelete 而不是 deleteByIds
      ElMessage.success('批量删除成功')
      selectedRows.value = []  // ✅ 清空选中项
      loadData()
    } catch (error) {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败: ' + (error.message || '未知错误'))
    }
  }).catch(() => {})
}

const handleExport = () => {
  // TODO: 实现导出功能
}

const handleImport = () => {
  // TODO: 实现导入功能
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.planNo = ''
  searchForm.masterPlanNo = ''
  searchForm.salesOrderNo = ''
  searchForm.customerOrderNo = ''
  searchForm.processName = ''
  searchForm.productCode = ''
  searchForm.sourceNo = ''
  searchForm.scheduleDateRange = []
  searchForm.promiseDeliveryDateRange = []
  searchForm.progressStatus = ''
  pagination.page = 1
  loadData()
}

const handleSavePageSettings = (settings) => {
  // TODO: 实现保存页面设置功能
}

// ✅ 打开BOM详情弹窗
const handleShowBomDetail = (row) => {
  if (bomDetailDialogRef.value) {
    bomDetailDialogRef.value.open(row)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>