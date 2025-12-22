<template>
  <StandardTablePage
    page-title="打包工序计划列表"
    settings-key="packingProcessPlanListV1"
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
        <el-form-item label="打包工序计划编号">
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
    :title="isEdit ? '编辑打包工序计划' : '新增打包工序计划'"
    width="80%"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="140px">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="打包工序计划编号" prop="planNo">
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
import materialApiService from '@/services/api/materialApiService'  // ✅ 导入产品物料库API
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { CircleCheck, Loading } from '@element-plus/icons-vue'
import StandardTablePage from '@/components/common/layout/StandardTablePage.vue'
import ProcessIntervalSettings from './ProcessIntervalSettings.vue'  // ✅ 导入工序间隔设置组件
import BomDetailDialog from './BomDetailDialog.vue'  // ✅ 导入BOM详情弹窗
import * as api from '@/api/packingProcessPlan'
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
  planEndDate: null,     // ✅ 新增计划结束日期
  nextScheduleDate: null, // ✅ 新增下一个排程日期
  nextScheduleDate1: null // ✅ 新增下一个计划排程日期1
})

// 表单验证规则
const formRules = {
  processName: [{ required: true, message: '请输入工序名称', trigger: 'blur' }]
}

// 面包屑
const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '计划&物控', to: '' },
  { title: '打包工序计划', to: '' }
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
      '确定要修复所有打包工序计划的字段计算吗？这将重新计算所有记录的自动字段。',
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
      { label: '按"销售订单"合并', value: 'salesOrder' },
      { label: '按"来源主计划编号"合并', value: 'masterPlanNo' },
      { label: '按相同"备料计划编号"合并', value: 'materialPlanNo' },
      { label: '按相同"需求日期"合并', value: 'demandDate' },
      { label: '按相同"计划物料编号"合并', value: 'materialCode' }
    ],
    defaultValue: 'masterPlanNo',
    description: `<div style="margin-top: 8px; padding: 8px; background-color: #f5f7fa; border-radius: 4px; font-size: 12px; line-height: 1.6;">
      <div style="margin-bottom: 4px;">• <strong>按"销售订单"合并</strong>：备料计划推送数据到打包工序计划时，相同"销售订单编号"且相同"计划物料编号"合并一起排程</div>
      <div style="margin-bottom: 4px;">• <strong>按"来源主计划编号"合并</strong>：备料计划推送数据到打包工序计划时，相同"来源主计划编号"且相同"计划物料编号"合并一起排程</div>
      <div style="margin-bottom: 4px;">• <strong>按相同"备料计划编号"合并</strong>：备料计划推送数据到打包工序计划时，相同"备料计划编号"且相同"计划物料编号"合并一起排程</div>
      <div style="margin-bottom: 4px;">• <strong>按相同"需求日期"合并</strong>：备料计划推送数据到打包工序计划时，相同"需求日期"且相同"计划物料编号"合并一起排程</div>
      <div style="margin-bottom: 4px;">• <strong>按相同"计划物料编号"</strong>：备料计划推送数据到打包工序计划时，相同"计划物料编号"合并一起排程</div>
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
      <div style="margin-bottom: 4px;">• 只有工序能力负荷表中"剩余工时" ≥ 该值的日期才会被选中</div>
      <div style="margin-bottom: 4px;">• 默认值：0.5小时</div>
    </div>`,
    tip: '💡 温馨提示：设置较大值可确保有足够的剩余工时进行排程'
  }
]

// ========== 默认设置 ==========
const defaultSettings = {
  exportFilePrefix: '打包工序计划',
  minRemainingHours: 0.5
}

// ========== 列配置 ==========
const allColumns = ref([
  { prop: 'rowIndex', label: '序号', width: 80, sortable: false, filterable: false, visible: true,
    formatter: (row, column, cellValue, index) => index + 1 },
  { prop: 'planNo', label: '打包工序计划编号', width: 160, sortable: true, filterable: true, fixed: 'left', visible: true },
  { prop: 'salesOrderNo', label: '销售订单编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'customerOrderNo', label: '客户订单编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'masterPlanNo', label: '主生产计划编号', width: 160, sortable: true, filterable: true, visible: true },
  // ✅ 字段名匹配后端返回的 camelCase 格式（master_plan_product_code → masterPlanProductCode）
  { prop: 'masterPlanProductCode', label: '主计划产品编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'masterPlanProductName', label: '主计划产品名称', width: 180, sortable: true, filterable: true, visible: true },
  { prop: 'shippingPlanNo', label: '发货计划编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'productCode', label: '生产产品编号', width: 140, sortable: true, filterable: true, visible: true },
  { prop: 'productName', label: '生产产品名称', width: 180, sortable: true, filterable: true, visible: true },
  { prop: 'productImage', label: '产品图片', width: 100, slot: 'productImage', visible: true },
  { prop: 'processManager', label: '工序负责人', width: 120, filterable: true, visible: true },
  { prop: 'processName', label: '工序名称', width: 140, sortable: true, filterable: true, visible: true },
  { prop: 'minRemainingHours', label: '剩余工时小于', width: 120, align: 'right', visible: true,
    formatter: (row) => {
      const settings = JSON.parse(localStorage.getItem('packingProcessPlanListV1') || '{}');
      return settings.minRemainingHours || 0.5;
    }
  },
  { prop: 'scheduleDate', label: '计划排程日期', width: 120, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.scheduleDate || row.planStartDate) },  // ✅ 计划排程日期 = 计划开始日期
  { prop: 'dailyTotalHours', label: '当天总工时', width: 120, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.dailyTotalHours !== undefined ? parseFloat(row.dailyTotalHours).toFixed(2) : '0.00' },
  { prop: 'dailyScheduledHours', label: '当天已排程工时', width: 150, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.dailyScheduledHours !== undefined ? parseFloat(row.dailyScheduledHours).toFixed(2) : '0.00' },
  // ✅ 新增：当日计划行数 = COUNTIFS(工序名称=本行工序名称，计划排程日期=本行计划排程日期，序号<=本行序号)
  { prop: 'dailyPlanCount', label: '当日计划行数', width: 130, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.dailyPlanCount !== undefined ? row.dailyPlanCount : '0' },
  { prop: 'dailyAvailableHours', label: '工序当天可用工时', width: 160, sortable: true, align: 'right', visible: true,
    formatter: (row) => {
      // ✅ 工序当天可用工时 = 当天总工时 - 当天已排程工时
      const dailyTotal = parseFloat(row.dailyTotalHours) || 0
      const dailyScheduled = parseFloat(row.dailyScheduledHours) || 0
      const available = Math.max(0, dailyTotal - dailyScheduled)
      return available.toFixed(2)
    }
  },
  { prop: 'scheduledWorkHours', label: '计划排程工时', width: 130, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.scheduledWorkHours !== undefined ? parseFloat(row.scheduledWorkHours).toFixed(2) : '0.00' },
  { prop: 'scheduleQuantity', label: '计划排程数量', width: 130, sortable: true, align: 'right', visible: true },
  { prop: 'productUnit', label: '产品单位', width: 100, visible: true },
  { prop: 'level0Demand', label: '0阶需求数量', width: 130, sortable: true, align: 'right', visible: true },
  { prop: 'completionDate', label: '计划完工日期', width: 120, sortable: true, visible: true,
    formatter: (row) => formatDateYMD(row.completionDate) },
  // ✅ 字段名匹配后端返回的 camelCase 格式（order_promise_delivery_date → orderPromiseDeliveryDate）
  { prop: 'orderPromiseDeliveryDate', label: '订单承诺交期', width: 120, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.orderPromiseDeliveryDate) },
  { prop: 'planStartDate', label: '计划开始日期', width: 120, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.planStartDate) },
  { prop: 'realPlanStartDate', label: '真计划开始日期', width: 130, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.realPlanStartDate) },
  { prop: 'planEndDate', label: '计划结束日期', width: 120, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.planEndDate) },
  { prop: 'nextScheduleDate', label: '下一个排程日期', width: 140, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.nextScheduleDate) },
  { prop: 'nextScheduleDate1', label: '下一个计划排程日期1', width: 150, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.nextScheduleDate1) },
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
  return `PPP${year}${timestamp}`
}

// ========== 响应式计算 ==========
// ✅ 监听计划开始日期变化，自动更新计划排程日期
watch(
  () => formData.value.planStartDate,
  (newPlanStartDate) => {
    console.log('========================================')
    console.log('🔍 [计划排程日期监听器] 监听到计划开始日期变化！')
    console.log(`📋 [计划排程日期监听器] 新的计划开始日期: "${newPlanStartDate}"`)
    console.log('========================================')
    
    if (newPlanStartDate) {
      // ✅ 计划排程日期 = 计划开始日期
      formData.value.scheduleDate = newPlanStartDate
      console.log(`✅ [计划排程日期] 已更新为: ${formData.value.scheduleDate}`)
      
      // ✅ 触发后续计算（当天总工时、当天已排程工时、工序当天可用工时等）
      nextTick(async () => {
        if (formData.value.processName && formData.value.scheduleDate) {
          console.log('🔄 [计划排程日期监听器] 触发后续字段计算...')
          await queryDailyTotalWorkHours()
          await calculateSchedulingFields()
        }
      })
    } else {
      console.log('⚠️ [计划排程日期] 计划开始日期为空，清空计划排程日期')
      formData.value.scheduleDate = null
    }
  },
  { immediate: false }
)

// ✅ 监听下一个排程日期的相关字段变化，自动触发计算
// 规则：当工序名称、剩余工时小于、计划排程日期发生变化时，重新计算下一个排程日期
watch(
  () => [formData.value.processName, currentBusinessVars.value.minRemainingHours, formData.value.scheduleDate],
  async ([newProcessName, newMinRemainingHours, newScheduleDate]) => {
    console.log('========================================')
    console.log('🔍 [下一个排程日期监听器] 监听到相关字段变化！')
    console.log(`📋 [下一个排程日期监听器] 工序名称: "${newProcessName}"`)
    console.log(`📋 [下一个排程日期监听器] 剩余工时小于: "${newMinRemainingHours}"`)
    console.log(`📋 [下一个排程日期监听器] 计划排程日期: "${newScheduleDate}"`)
    console.log('========================================')
    
    // 前置条件：工序名称不为空 且 计划排程日期不为空
    if (newProcessName && newScheduleDate) {
      console.log('🔄 [下一个排程日期监听器] 触发下一个排程日期计算...')
      await queryNextScheduleDate()
      await queryNextScheduleDate1()
    } else {
      console.log('⚠️ [下一个排程日期监听器] 条件不满足，跳过计算')
    }
  },
  { deep: true }
)

// ✅ 监听生产产品编号变化，自动lookup定时工额
// 规则：lookup(产品物料库的"物料编号"=当前工序计划的"生产产品编号"，产品物料库的"定时工额")
// 前置条件：生产产品编号不为空
watch(
  () => formData.value.productCode,
  async (newProductCode) => {
    console.log('========================================')
    console.log('🔍 [定时工额Lookup测试] 监听器触发！')
    console.log(`📋 [定时工额Lookup测试] 新的生产产品编号: "${newProductCode}"`)
    console.log(`📋 [定时工额Lookup测试] 是否为空: ${!newProductCode}`)
    console.log('========================================')
    
    if (!newProductCode) {
      console.log('⚠️ [定时工额Lookup] 生产产品编号为空，跳过查询')
      formData.value.standardWorkQuota = 0
      return
    }
    
    try {
      console.log(`🔍 [定时工额Lookup] 开始查询产品物料库...`)
      console.log(`🔍 [定时工额Lookup] 查询参数: 物料编号="${newProductCode}"`)
      
      const response = await materialApiService.getMaterialByCode(newProductCode)
      
      console.log('========================================')
      console.log('📦 [定时工额Lookup测试] API响应完整数据:')
      console.log(JSON.stringify(response, null, 2))
      console.log('========================================')
      
      console.log(`📊 [定时工额Lookup测试] response存在: ${!!response}`)
      console.log(`📊 [定时工额Lookup测试] response.data存在: ${!!response?.data}`)
      console.log(`📊 [定时工额Lookup测试] response.data.standardTime: ${response?.data?.standardTime}`)
      console.log(`📊 [定时工额Lookup测试] response.data.quotaTime: ${response?.data?.quotaTime}`)
      
      if (response?.data?.standardTime) {
        const lookupValue = parseFloat(response.data.standardTime)
        formData.value.standardWorkQuota = lookupValue
        console.log('========================================')
        console.log(`✅ [定时工额Lookup] 找到定时工额并已设置！`)
        console.log(`✅ [定时工额Lookup] 数据库值: ${response.data.standardTime}`)
        console.log(`✅ [定时工额Lookup] 转换后的值: ${lookupValue}`)
        console.log(`✅ [定时工额Lookup] 表单字段值: ${formData.value.standardWorkQuota}`)
        console.log('========================================')
      } else {
        console.log('========================================')
        console.log(`⚠️ [定时工额Lookup] 未找到定时工额！`)
        console.log(`⚠️ [定时工额Lookup] 物料编号: ${newProductCode}`)
        console.log(`⚠️ [定时工额Lookup] response.data: ${JSON.stringify(response?.data)}`)
        console.log(`⚠️ [定时工额Lookup] 使用默认值: 0`)
        console.log('========================================')
        formData.value.standardWorkQuota = 0
      }
    } catch (error) {
      console.log('========================================')
      console.error(`❌ [定时工额Lookup] 查询失败！`)
      console.error(`❌ [定时工额Lookup] 错误信息:`, error)
      console.error(`❌ [定时工额Lookup] 错误堆栈:`, error.stack)
      console.log('========================================')
      formData.value.standardWorkQuota = 0
    }
  },
  { immediate: false }
)

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

// ✅ 监听工序当天可用工时和需求工时变化，自动计算计划排程工时
watch(
  () => [formData.value.dailyAvailableHours, formData.value.requiredWorkHours],
  ([availableHours, requiredHours]) => {
    console.log('🔍 [计划排程工时监听器] 监听到变化:', { availableHours, requiredHours })
    // 无论两个值是否都大于0，只要其中一个发生变化，就触发重新计算
    calculateScheduledWorkHours()
  },
  { deep: true }
)

// ✅ 监听计划排程工时和定时工额变化，自动计算计划排程数量
// 触发条件：计划排程工时或定时工额变化时
watch(
  () => [formData.value.scheduledWorkHours, formData.value.standardWorkQuota],
  ([scheduledHours, standardQuota]) => {
    console.log('🔍 [计划排程数量监听器] 监听到变化:', { scheduledHours, standardQuota })
    // 无论两个值是否都大于0，只要其中一个发生变化，就触发重新计算
    calculateScheduleQuantity()
  },
  { deep: true }
)

// ✅ 监听计划排程日期和计划结束日期变化，自动计算下一个排程日期
// 触发条件：计划排程日期或计划结束日期变化时
watch(
  () => [formData.value.scheduleDate, formData.value.planEndDate],
  async ([scheduleDate, planEndDate]) => {
    console.log('🔍 [下一个排程日期监听器] 监听到变化:', { scheduleDate, planEndDate })
    // 如果两个值都不为空，触发重新计算
    if (scheduleDate && planEndDate) {
      await queryNextScheduleDate()
      await queryNextScheduleDate1()
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
    
    // ✅ 修改：计划排程日期 = 计划开始日期（而不是真计划开始日期）
    formData.value.scheduleDate = formData.value.planStartDate
    console.log('📊 需求工时为0，开始日期=计划结束日期')
    console.log(`📊 计划开始日期: ${formData.value.planStartDate}`)
    console.log(`📊 真计划开始日期: ${formData.value.realPlanStartDate}`)
    console.log(`📊 计划排程日期: ${formData.value.scheduleDate}`)
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
      
      // ✅ 修改：计划排程日期 = 计划开始日期（而不是真计划开始日期）
      formData.value.scheduleDate = formData.value.planStartDate
      
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
  const scheduleDate = formData.value.scheduleDate  // ✅ 使用计划排程日期
  
  if (!processName || !scheduleDate) {
    console.log('⚠️ 查询当天总工时：缺少工序名称或排程日期')
    formData.value.dailyTotalWorkHours = 0
    return 0
  }
  
  try {
    const response = await capacityLoadApi.queryDailyTotalHours(
      processName,
      formatDateYMD(scheduleDate)
    )
    
    if (response?.data?.totalHours !== undefined) {
      formData.value.dailyTotalWorkHours = parseFloat(response.data.totalHours)
      console.log(`✅ 当天总工时查询成功: ${formData.value.dailyTotalWorkHours}`)
      return formData.value.dailyTotalWorkHours
    } else {
      formData.value.dailyTotalWorkHours = 0
      console.log('⚠️ 未查询到当天总工时')
      return 0
    }
  } catch (error) {
    console.error('❗ 查询当天总工时失败:', error)
    formData.value.dailyTotalWorkHours = 0
    return 0
  }
}

// ✅ 计算当天已排程工时：SUMIFS(计划排程工时, 工序名称=当前工序, 计划排程日期=当前日期)
const calculateDailyScheduledHours = async () => {
  const processName = formData.value.processName
  const scheduleDate = formData.value.scheduleDate
  const currentId = formData.value.id  // 排除当前记录（编辑时）
  
  if (!processName || !scheduleDate) {
    formData.value.dailyScheduledHours = 0
    return 0
  }
  
  try {
    const response = await api.queryDailyScheduledHours({
      processName,
      scheduleDate: formatDateYMD(scheduleDate),
      excludeId: currentId  // 编辑时排除自己
    })
    
    if (response?.data?.scheduledHours !== undefined) {
      formData.value.dailyScheduledHours = parseFloat(response.data.scheduledHours)
      console.log(`✅ 当天已排程工时: ${formData.value.dailyScheduledHours}`)
      return formData.value.dailyScheduledHours
    } else {
      formData.value.dailyScheduledHours = 0
      return 0
    }
  } catch (error) {
    console.error('❗ 计算当天已排程工时失败:', error)
    formData.value.dailyScheduledHours = 0
    return 0
  }
}

// ✅ 计算工序当天可用工时 = 当天总工时 - 当天已排程工时
const calculateDailyAvailableHours = () => {
  const dailyTotal = parseFloat(formData.value.dailyTotalWorkHours) || 0
  const dailyScheduled = parseFloat(formData.value.dailyScheduledHours) || 0
  
  formData.value.dailyAvailableHours = Math.max(0, dailyTotal - dailyScheduled)
  
  console.log(`✅ 工序当天可用工时 = ${dailyTotal} - ${dailyScheduled} = ${formData.value.dailyAvailableHours}`)
  
  return formData.value.dailyAvailableHours
}

// ✅ 计算计划排程工时 = MIN(工序当天可用工时, 需求工时)
const calculateScheduledWorkHours = () => {
  const dailyAvailable = parseFloat(formData.value.dailyAvailableHours) || 0
  const required = parseFloat(formData.value.requiredWorkHours) || 0
  
  formData.value.scheduledWorkHours = Math.min(dailyAvailable, required)
  
  console.log(`✅ 计划排程工时 = MIN(${dailyAvailable}, ${required}) = ${formData.value.scheduledWorkHours}`)
  
  return formData.value.scheduledWorkHours
}

// ✅ 计算计划排程数量 = ceiling(计划排程工时 * 定时工额, 1)
const calculateScheduleQuantity = () => {
  const scheduledHours = parseFloat(formData.value.scheduledWorkHours) || 0
  const standardQuota = parseFloat(formData.value.standardWorkQuota) || 0
  
  // 按照规则：计划排程数量 = ceiling(计划排程工时 * 定时工额, 1)
  const rawQuantity = scheduledHours * standardQuota
  formData.value.scheduleQuantity = Math.ceil(rawQuantity)
  
  console.log(`✅ 计划排程数量 = CEILING(${scheduledHours} * ${standardQuota}, 1) = CEILING(${rawQuantity}, 1) = ${formData.value.scheduleQuantity}`)
  
  return formData.value.scheduleQuantity
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
  // 生成条件：只要工序当天可用工时或需求工时发生变化，就触发计算
  const dailyAvailable = parseFloat(formData.value.dailyAvailableHours) || 0
  const required = parseFloat(formData.value.requiredWorkHours) || 0
  calculateScheduledWorkHours()
  console.log(`✅ 需求4: 计划排程工时 = ${formData.value.scheduledWorkHours}`)
  
  // ✅ 需求5: 计划排程数量 = ceiling(计划排程工时 * 定时工额, 1)
  // 生成条件：只要计划排程工时或定时工额变化，就触发计算
  calculateScheduleQuantity()
  console.log(`✅ 需求5: 计划排程数量 = ${formData.value.scheduleQuantity}`)
  
  // ✅ 需求6: 查询下一个排程日期 (MINIFS)
  // 生成条件：工序名称不为空 且 剩余工时小于不为空 且 计划排程日期不为空
  if (formData.value.processName && currentBusinessVars.value.minRemainingHours !== undefined && formData.value.scheduleDate) {
    await queryNextScheduleDate()
    await queryNextScheduleDate1()
    console.log(`✅ 需求6: 下一个排程日期 = ${formData.value.nextScheduleDate}`)
    console.log(`✅ 需求6: 下一个计划排程日期1 = ${formData.value.nextScheduleDate1}`)
  } else {
    formData.value.nextScheduleDate = null
    formData.value.nextScheduleDate1 = null
    console.log(`⚠️ 需求6: 条件不满足，跳过计算 - 工序名称: ${formData.value.processName}, 剩余工时小于: ${currentBusinessVars.value.minRemainingHours}, 计划排程日期: ${formData.value.scheduleDate}`)
  }
  
  console.log('✅ 所有排程字段计算完毕')
}

// ✅ 重置排程字段
const resetSchedulingFields = () => {
  formData.value.requiredWorkHours = 0
  formData.value.planStartDate = null
  formData.value.realPlanStartDate = null
  formData.value.planEndDate = null
  formData.value.nextScheduleDate = null
  formData.value.nextScheduleDate1 = null
  console.log('🔄 排程字段已重置')
}

// ✅ 需求 6: 查询下一个排程日期 (MINIFS)
const queryNextScheduleDate = async () => {
  const processName = formData.value.processName
  const scheduleDate = formData.value.scheduleDate
  const minRemainingHours = currentBusinessVars.value.minRemainingHours || 0.5
  
  console.log('🔍 查询下一个排程日期:', { processName, scheduleDate, minRemainingHours })
  
  // ✅ 生成条件：工序名称不为空 且 计划排程日期不为空
  if (!processName || !scheduleDate) {
    console.log('⚠️ 缺少必要参数：工序名称或计划排程日期')
    formData.value.nextScheduleDate = null
    return null
  }
  
  try {
    const response = await capacityLoadApi.queryNextScheduleDate(
      processName,
      formatDateYMD(scheduleDate),
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

// ✅ 查询下一个计划排程日期1 (MINIFS)
const queryNextScheduleDate1 = async () => {
  const processName = formData.value.processName
  const scheduleDate = formData.value.scheduleDate
  const minRemainingHours = 0.5 // 固定为0.5小时
  
  console.log('🔍 查询下一个计划排程日期1:', { processName, scheduleDate, minRemainingHours })
  
  // ✅ 生成条件：工序名称不为空 且 计划排程日期不为空
  if (!processName || !scheduleDate) {
    console.log('⚠️ 缺少必要参数：工序名称或计划排程日期')
    formData.value.nextScheduleDate1 = null
    return null
  }
  
  try {
    // 复用现有的queryNextScheduleDate接口，因为查询条件相同
    const response = await capacityLoadApi.queryNextScheduleDate(
      processName,
      formatDateYMD(scheduleDate),
      minRemainingHours
    )
    
    if (response?.data?.nextScheduleDate) {
      formData.value.nextScheduleDate1 = response.data.nextScheduleDate
      console.log(`✅ 下一个计划排程日期1查询成功: ${response.data.nextScheduleDate}`)
      return response.data.nextScheduleDate
    } else {
      formData.value.nextScheduleDate1 = null
      console.log('⚠️ 未找到符合条件的下一个计划排程日期1')
      return null
    }
  } catch (error) {
    console.error('❗ 查询下一个计划排程日期1失败:', error)
    formData.value.nextScheduleDate1 = null
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
      processName: '打包',  // ✅ 强制过滤：只显示打包工序
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
    
    // ✅ 修正数据：确保 计划排程日期 = 计划开始日期
    const records = (data.records || []).map(record => {
      // 如果计划开始日期存在，但计划排程日期不等于计划开始日期，则修正
      if (record.planStartDate && record.scheduleDate !== record.planStartDate) {
        console.log(`🔧 修正记录 ID=${record.id}: scheduleDate ${record.scheduleDate} → ${record.planStartDate}`)
        record.scheduleDate = record.planStartDate
      }
      
      // ✅ 重新计算工序当天可用工时（前端计算，确保实时性）
      if (record.dailyTotalHours !== undefined && record.dailyScheduledHours !== undefined) {
        const dailyTotal = parseFloat(record.dailyTotalHours) || 0
        const dailyScheduled = parseFloat(record.dailyScheduledHours) || 0
        record.dailyAvailableHours = Math.max(0, dailyTotal - dailyScheduled)
      }
      
      // ✅ 重新计算计划排程工时 = MIN(工序当天可用工时, 需求工时)
      if (record.dailyAvailableHours !== undefined && record.requiredWorkHours !== undefined) {
        const dailyAvailable = parseFloat(record.dailyAvailableHours) || 0
        const required = parseFloat(record.requiredWorkHours) || 0
        record.scheduledWorkHours = Math.min(dailyAvailable, required)
      }
      
      // ✅ 由前端计算计划排程数量
      if (record.scheduledWorkHours !== undefined && record.standardWorkQuota !== undefined) {
        const scheduledHours = parseFloat(record.scheduledWorkHours) || 0
        const standardQuota = parseFloat(record.standardWorkQuota) || 0
        // 触发条件：计划排程工时>0 且 定时工额>0
        if (scheduledHours > 0 && standardQuota > 0) {
          record.scheduleQuantity = Math.ceil(scheduledHours * standardQuota)
          console.log(`📋 [计划排程数量] 记录ID: ${record.id}, 前端计算值: ${record.scheduleQuantity}`)
        } else {
          record.scheduleQuantity = 0
          console.log(`📋 [计划排程数量] 记录ID: ${record.id}, 未满足计算条件，设置为0`)
        }
      }
      
      // ✅ 计算剩余需求工时 = 需求工时 - 计划排程工时
      if (record.requiredWorkHours !== undefined && record.scheduledWorkHours !== undefined) {
        const requiredHours = parseFloat(record.requiredWorkHours) || 0
        const scheduledHours = parseFloat(record.scheduledWorkHours) || 0
        if (requiredHours > 0 && scheduledHours > 0) {
          record.remainingRequiredHours = requiredHours - scheduledHours
        } else {
          record.remainingRequiredHours = requiredHours
        }
      }
      
      return record
    })
    
    // ✅ 为每个记录计算下一个计划排程日期1
    await Promise.all(records.map(async (record) => {
      if (record.processName && record.scheduleDate) {
        try {
          const response = await capacityLoadApi.queryNextScheduleDate(
            record.processName,
            formatDateYMD(record.scheduleDate),
            0.5 // 固定为0.5小时
          )
          
          if (response?.nextScheduleDate) {
            record.nextScheduleDate1 = response.nextScheduleDate
            console.log(`✅ 记录 ID=${record.id} 下一个计划排程日期1计算成功: ${response.nextScheduleDate}`)
          } else {
            record.nextScheduleDate1 = null
            console.log(`⚠️ 记录 ID=${record.id} 未找到符合条件的下一个计划排程日期1`)
          }
        } catch (error) {
          console.error(`❌ 记录 ID=${record.id} 下一个计划排程日期1计算失败:`, error)
          record.nextScheduleDate1 = null
        }
      } else {
        record.nextScheduleDate1 = null
      }
    }))
    
    // ✅ 计算累积排程数量
    // 按序号排序记录
    const sortedRecords = [...records].sort((a, b) => (a.rowIndex || 0) - (b.rowIndex || 0))
    
    console.log('========================================')
    console.log('🔍 [累积排程数量计算] 开始计算累积排程数量')
    console.log(`📋 [累积排程数量计算] 记录总数: ${records.length}`)
    console.log('========================================')
    
    // 为每个记录计算累积排程数量
    for (let i = 0; i < sortedRecords.length; i++) {
      const currentRecord = sortedRecords[i]
      
      console.log('----------------------------------------')
      console.log(`🔍 [累积排程数量计算] 处理记录 ${i+1}/${sortedRecords.length}`)
      console.log(`📋 [累积排程数量计算] 当前记录ID: ${currentRecord.id}`)
      console.log(`📋 [累积排程数量计算] 当前记录sourceNo: ${currentRecord.sourceNo}`)
      console.log(`📋 [累积排程数量计算] 当前记录rowIndex: ${currentRecord.rowIndex}`)
      console.log(`📋 [累积排程数量计算] 当前记录scheduleQuantity: ${currentRecord.scheduleQuantity}`)
      
      // 触发条件：来源编号不为空，序号不为空，计划排程数量>0
      if (currentRecord.sourceNo && currentRecord.rowIndex && currentRecord.scheduleQuantity > 0) {
        // 计算sumifs：当前主表格的序号<=本行的序号，当前主表格的sourceNo=本行的sourceNo，求和列：计划排程数量
        let cumulativeQty = 0
        
        // 遍历所有序号<=当前记录的记录
        for (let j = 0; j < sortedRecords.length; j++) {
          const prevRecord = sortedRecords[j]
          
          // 检查条件
          const condition1 = prevRecord.rowIndex <= currentRecord.rowIndex
          const condition2 = prevRecord.sourceNo === currentRecord.sourceNo
          const condition3 = prevRecord.scheduleQuantity > 0
          
          console.log(`   📋 [累积排程数量计算] 检查记录 ${j+1}`)
          console.log(`   📋 [累积排程数量计算] 条件1 (rowIndex <= ${currentRecord.rowIndex}): ${condition1} (${prevRecord.rowIndex})`)
          console.log(`   📋 [累积排程数量计算] 条件2 (sourceNo === ${currentRecord.sourceNo}): ${condition2} (${prevRecord.sourceNo})`)
          console.log(`   📋 [累积排程数量计算] 条件3 (scheduleQuantity > 0): ${condition3} (${prevRecord.scheduleQuantity})`)
          
          if (condition1 && condition2 && condition3) {
            cumulativeQty += prevRecord.scheduleQuantity
            console.log(`   ➕ [累积排程数量计算] 累加数量: ${prevRecord.scheduleQuantity}, 当前累积: ${cumulativeQty}`)
          }
        }
        
        currentRecord.cumulativeScheduleQty = cumulativeQty
        console.log(`✅ [累积排程数量计算] 计算结果: ${cumulativeQty}`)
      } else {
        currentRecord.cumulativeScheduleQty = 0
        console.log(`⚠️ [累积排程数量计算] 不满足触发条件，设置为0`)
      }
      
      // 更新原始records数组中的记录
      const originalRecord = records.find(record => record.id === currentRecord.id)
      if (originalRecord) {
        originalRecord.cumulativeScheduleQty = currentRecord.cumulativeScheduleQty
        console.log(`📋 [累积排程数量计算] 更新原始记录累积排程数量: ${originalRecord.cumulativeScheduleQty}`)
      }
    }
    
    // ✅ 计算未排数量 = 需补货数量 - 累积排程数量
    // 触发条件：需补货数量>0 且 累积排程数量>0
    console.log('========================================')
    console.log('🔍 [未排数量计算] 开始计算未排数量')
    console.log('========================================')
    
    for (const record of records) {
      console.log('----------------------------------------')
      console.log(`🔍 [未排数量计算] 处理记录ID: ${record.id}`)
      console.log(`📋 [未排数量计算] 当前记录sourceNo: ${record.sourceNo}`)
      
      const replenishmentQty = parseFloat(record.replenishmentQty || 0)
      const cumulativeScheduleQty = parseFloat(record.cumulativeScheduleQty || 0)
      
      console.log(`📋 [未排数量计算] 需补货数量: ${replenishmentQty}`)
      console.log(`📋 [未排数量计算] 累积排程数量: ${cumulativeScheduleQty}`)
      
      if (replenishmentQty > 0 && cumulativeScheduleQty > 0) {
        record.unscheduledQty = replenishmentQty - cumulativeScheduleQty
        console.log(`✅ [未排数量计算] 计算结果: ${record.unscheduledQty}`)
      } else {
        record.unscheduledQty = replenishmentQty
        console.log(`⚠️ [未排数量计算] 不满足触发条件，直接使用需补货数量: ${record.unscheduledQty}`)
      }
    }
    
    tableData.value = records
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
    planEndDate: null,     // ✅ 新增计划结束日期
    nextScheduleDate: null // ✅ 新增下一个排程日期
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  
  console.log('========================================')
  console.log('📝 [编辑] 开始编辑记录')
  console.log('📋 [编辑] 原始row数据:', row)
  console.log('📋 [编辑] row.standardWorkQuota:', row.standardWorkQuota)
  console.log('📋 [编辑] row.standard_work_quota:', row.standard_work_quota)
  console.log('📋 [编辑] row.scheduleQuantity:', row.scheduleQuantity)
  console.log('📋 [编辑] row.schedule_quantity:', row.schedule_quantity)
  console.log('========================================')
  
  // ✅ 修复：确保字段名正确映射，优先使用下划线格式的数据
  formData.value = {
    ...row,
    standardWorkQuota: row.standardWorkQuota || row.standard_work_quota || 0,
    requiredWorkHours: row.requiredWorkHours || row.required_work_hours || 0,
    replenishmentQty: row.replenishmentQty || row.replenishment_qty || 0,
    productCode: row.productCode || row.product_code || '',
    productName: row.productName || row.product_name || '',
    scheduleQuantity: row.scheduleQuantity || row.schedule_quantity || 0
  }
  
  console.log('========================================')
  console.log('✅ [编辑] 映射后的formData:')
  console.log('✅ [编辑] formData.standardWorkQuota:', formData.value.standardWorkQuota)
  console.log('✅ [编辑] formData.productCode:', formData.value.productCode)
  console.log('========================================')
  
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除打包工序计划编号为 ${row.planNo} 的记录吗？`,
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
        // ✅ 不传递计划排程数量和累积排程数量给后端
        // 创建一个副本，移除不需要传递给后端的字段
        const saveData = { ...formData.value }
        delete saveData.scheduleQuantity
        delete saveData.cumulativeScheduleQty
        
        console.log(`📋 [保存] 移除不需要传递的字段后的数据:`, saveData)
        
        if (isEdit.value) {
          await api.updateById(saveData.id, saveData)
          ElMessage.success('更新成功')
        } else {
          await api.create(saveData)
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