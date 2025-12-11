<template>
  <StandardTablePage
    page-title="工序计划列表"
    settings-key="processPlanListV2"
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
        <el-form-item label="工序计划编号">
          <el-input 
            ref="searchInputRef"
            v-model="searchForm.planNo" 
            placeholder="请输入" 
            clearable 
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="主生产计划编号">
          <el-input v-model="searchForm.masterPlanNo" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="工序名称">
          <el-input v-model="searchForm.processName" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="计划排程日期">
          <el-date-picker
            v-model="searchForm.scheduleDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            clearable
          />
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

    <!-- ✅ 进度状态列 -->
    <template #column-progressStatus="{ row }">
      <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
        <template v-if="row.unscheduledQty && row.unscheduledQty !== '' && row.unscheduledQty !== null && parseFloat(row.scheduledWorkHours || 0) > 0">
          <!-- 未排数量不为空 AND 计划排程工时>0：排程完毕 -->
          <el-icon :size="16" color="#67C23A">
            <CircleCheck />
          </el-icon>
          <span style="color: #67C23A; font-weight: 500;">排程完毕</span>
        </template>
        <template v-else-if="parseFloat(row.scheduledWorkHours || 0) === 0">
          <!-- 计划排程工时=0：排程中 -->
          <el-icon :size="16" color="#E6A23C" style="animation: rotate 2s linear infinite;">
            <Loading />
          </el-icon>
          <span style="color: #E6A23C; font-weight: 500;">排程中</span>
        </template>
        <template v-else>
          <!-- 其他情况默认显示排程中 -->
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
    :title="isEdit ? '编辑工序计划' : '新增工序计划'"
    width="80%"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="140px">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="工序计划编号" prop="planNo">
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
            <el-date-picker v-model="formData.scheduleDate" type="date" placeholder="选择日期" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="计划排程数量" prop="scheduleQuantity">
            <el-input-number v-model="formData.scheduleQuantity" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="计划完工日期" prop="completionDate">
            <el-date-picker v-model="formData.completionDate" type="date" placeholder="选择日期" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="计划开始日期" prop="planStartDate">
            <el-date-picker v-model="formData.planStartDate" type="date" placeholder="选择日期" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="计划结束日期" prop="planEndDate">
            <el-date-picker v-model="formData.planEndDate" type="date" placeholder="选择日期" disabled style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="生产产品编号" prop="productCode">
            <el-input v-model="formData.productCode" placeholder="请输入" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="生产产品名称" prop="productName">
            <el-input v-model="formData.productName" placeholder="请输入" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工序负责人" prop="processManager">
            <el-input v-model="formData.processManager" placeholder="请输入" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="车间名称" prop="workshopName">
            <el-input v-model="formData.workshopName" placeholder="请输入" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="定额工时" prop="standardWorkHours">
            <el-input-number v-model="formData.standardWorkHours" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="计划排程工时" prop="scheduledWorkHours">
            <el-input-number v-model="formData.scheduledWorkHours" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="需补货数量" prop="replenishmentQty">
            <el-input-number v-model="formData.replenishmentQty" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="定时工额" prop="standardWorkQuota">
            <el-input-number v-model="formData.standardWorkQuota" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="需求工时" prop="requiredWorkHours">
            <el-input-number v-model="formData.requiredWorkHours" :min="0" :precision="2" disabled style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>

  <!-- 导入对话框 -->
  <el-dialog v-model="importDialogVisible" title="导入工序计划" width="500px">
    <el-upload
      drag
      :auto-upload="false"
      :on-change="handleFileChange"
      accept=".xlsx,.xls"
    >
      <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip">只支持 xlsx/xls 格式文件</div>
      </template>
    </el-upload>
    <template #footer>
      <el-button @click="importDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmImport">确定导入</el-button>
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
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Loading, CircleCheck } from '@element-plus/icons-vue'
import StandardTablePage from '@/components/common/layout/StandardTablePage.vue'
import ProcessIntervalSettings from './ProcessIntervalSettings.vue'  // ✅ 导入工序间隔设置组件
import BomDetailDialog from './BomDetailDialog.vue'  // ✅ 导入BOM详情弹窗
import * as XLSX from 'xlsx'
import api from '@/api/processPlan'
import capacityLoadApi from '@/api/capacityLoad'  // ✅ 导入工序能力负荷API
import materialApiService from '@/services/api/materialApiService'  // ✅ 导入产品物料库API
import dateUtils from '@/services/utils/date-utils'  // ✅ 导入日期工具

// ✅ 日期格式化函数：年-月-日
const formatDateYMD = (date) => {
  if (!date) return ''
  return dateUtils.format(date, 'YYYY-MM-DD')
}

/**
 * 工序计划列表页面 v2.0
 * 使用 StandardTablePage v2.1 统一组件
 * 
 * 功能特点：
 * 1. ✅ 面包屑导航
 * 2. ✅ 响应式断点系统
 * 3. ✅ 键盘导航（ESC/Ctrl+F/Ctrl+N）
 * 4. ✅ 点击外部关闭
 * 5. ✅ 列拖拽（通过PageSettings组件）
 * 6. ✅ 表头筛选、排序
 * 7. ✅ 增删改查、导入导出、打印
 * 8. ✅ 页面设置（业务变量、字段管理）
 * 
 * 更新记录：
 * - v2.0 (2025-12-08): 迁移到 StandardTablePage v2.1 统一组件
 * - v1.0: 初始版本
 */

// ========== 数据状态 ==========
const tableData = ref([])
const selectedRows = ref([])
const loading = ref(false)

// ✅ 业务变量当前配置
const currentBusinessVars = ref({
  defaultMergeRule: 'masterPlanNo',
  minRemainingHours: 0.5
})

// ========== 面包屑导航 ==========
const breadcrumbItems = [
  { label: '生产管理', path: '/production' },
  { label: '计划管理', path: '/production/planning' },
  { label: '工序计划' }
]

// ========== 搜索表单 ==========
const searchForm = reactive({
  planNo: '',
  masterPlanNo: '',
  processName: '',
  scheduleDateRange: []
})

const searchInputRef = ref(null)

// ========== 分页 ==========
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// ========== 对话框 ==========
const dialogVisible = ref(false)
const importDialogVisible = ref(false)
const isEdit = ref(false)

// ========== 表单数据 ==========
const formData = ref({})
const formRef = ref(null)

// ========== 表单验证规则 ==========
const formRules = {
  processName: [{ required: true, message: '请输入工序名称', trigger: 'blur' }],
  scheduleQuantity: [{ required: true, message: '请输入计划排程数量', trigger: 'blur' }]
}

// ========== BOM详情弹窗 ==========
const bomDetailDialogRef = ref(null)

// 打开BOM详情
const handleShowBomDetail = (row) => {
  bomDetailDialogRef.value.open(row)
}

// ========== 工序间隔设置弹窗 ==========
const processIntervalDialogVisible = ref(false)

// 打开工序间隔设置
const openProcessIntervalSettings = () => {
  processIntervalDialogVisible.value = true
}

// ========== 业务变量配置 ==========
// 业务变量 - 按钮配置
const businessVarButtons = [
  {
    label: '工序间隔设置',
    value: 'processIntervalSettings',
    onClick: openProcessIntervalSettings
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
      <div style="margin-bottom: 4px;">• <strong>按"销售订单"合并</strong>：备料计划推送数据到工序计划时，相同"销售订单编号"且相同"计划物料编号"合并一起排程</div>
      <div style="margin-bottom: 4px;">• <strong>按"来源主计划编号"合并</strong>：备料计划推送数据到工序计划时，相同"来源主计划编号"且相同"计划物料编号"合并一起排程</div>
      <div style="margin-bottom: 4px;">• <strong>按相同"备料计划编号"合并</strong>：备料计划推送数据到工序计划时，相同"备料计划编号"且相同"计划物料编号"合并一起排程</div>
      <div style="margin-bottom: 4px;">• <strong>按相同"需求日期"合并</strong>：备料计划推送数据到工序计划时，相同"需求日期"且相同"计划物料编号"合并一起排程</div>
      <div style="margin-bottom: 4px;">• <strong>按相同"计划物料编号"</strong>：备料计划推送数据到工序计划时，相同"计划物料编号"合并一起排程</div>
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
  exportFilePrefix: '工序计划',
  codePrefix: 'PP',
  defaultMergeRule: 'masterPlanNo',  // 默认按"来源主计划编号"合并
  minRemainingHours: 0.5  // ✅ 默认剩余工时门槛值：0.5小时
}

// ✅ 所有列定义
const allColumns = ref([
  // ✅ selection列由StandardTablePage的:show-selection="true"自动处理，不需要在columns中定义
  { prop: 'rowIndex', label: '序号', width: 80, sortable: false, filterable: false, visible: true,
    formatter: (row, column, cellValue, index) => index + 1 },  // ✅ 需求 2：序号（行位置）
  { prop: 'scheduleDate', label: '计划排程日期', width: 120, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.scheduleDate) },  // ✅ 需求 4：计划排程日期 = 真计划开始日期
  { prop: 'salesOrderNo', label: '销售订单编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'masterPlanNo', label: '主生产计划编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'shippingPlanNo', label: '发货计划编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'productCode', label: '生产产品编号', width: 140, sortable: true, filterable: true, visible: true },
  { prop: 'productName', label: '生产产品名称', width: 180, sortable: true, filterable: true, visible: true },
  { prop: 'productImage', label: '产品图片', width: 100, slot: 'productImage', visible: true },
  { prop: 'processManager', label: '工序负责人', width: 120, filterable: true, visible: true },
  { prop: 'processName', label: '工序名称', width: 140, sortable: true, filterable: true, visible: true },
  { prop: 'planNo', label: '工序计划编号', width: 160, sortable: true, filterable: true, fixed: 'left', visible: true },
  { prop: 'dailyTotalHours', label: '当天总工时', width: 120, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.dailyTotalHours !== undefined ? parseFloat(row.dailyTotalHours).toFixed(2) : '0.00' },  // ✅ 需求1：2位小数
  { prop: 'dailyScheduledHours', label: '当天已排程工时', width: 150, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.dailyScheduledHours !== undefined ? parseFloat(row.dailyScheduledHours).toFixed(2) : '0.00' },  // ✅ 需求1：2位小数
  { prop: 'dailyAvailableHours', label: '工序当天可用工时', width: 160, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.dailyAvailableHours !== undefined ? parseFloat(row.dailyAvailableHours).toFixed(2) : '0.00' },  // ✅ 需求1：2位小数
  { prop: 'scheduleQuantity', label: '计划排程数量', width: 130, sortable: true, align: 'right', visible: true },  // ✅ 需求 9
  { prop: 'scheduledWorkHours', label: '计划排程工时', width: 130, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.scheduledWorkHours !== undefined ? parseFloat(row.scheduledWorkHours).toFixed(2) : '0.00' },  // ✅ 需求1：2位小数
  { prop: 'productUnit', label: '产品单位', width: 100, visible: true },
  { prop: 'level0Demand', label: '0阶需求数量', width: 130, sortable: true, align: 'right', visible: true },
  { prop: 'completionDate', label: '计划完工日期', width: 120, sortable: true, visible: true,
    formatter: (row) => formatDateYMD(row.completionDate) },  // ✅ 添加日期格式化
  { prop: 'planStartDate', label: '计划开始日期', width: 120, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.planStartDate) },  // ✅ 新增：计划开始日期
  { prop: 'realPlanStartDate', label: '真计划开始日期', width: 130, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.realPlanStartDate)
  },  // ✅ 新增：真计划开始日期 = 计划开始日期 + 1天(已在数据计算时处理)
  { prop: 'planEndDate', label: '计划结束日期', width: 120, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.planEndDate) },  // ✅ 新增：计划结束日期
  { prop: 'workshopName', label: '车间名称', width: 120, filterable: true, visible: true },
  { prop: 'nextScheduleDate', label: '下一个排程日期', width: 140, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.nextScheduleDate) },  // ✅ 需求1：还需排程工时改为下一个排程日期
  { prop: 'scheduleCount', label: '排程次数', width: 100, sortable: true, align: 'right', visible: true },
  { prop: 'standardWorkQuota', label: '定时工额', width: 100, sortable: true, align: 'right', visible: true },  // ✅ 修改：定额工时改为定时工额
  { prop: 'standardWorkHours', label: '定额工时', width: 100, sortable: true, align: 'right', visible: true },  // ✅ 修改：定时工额改为定额工时
  { prop: 'requiredWorkHours', label: '需求工时', width: 100, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.requiredWorkHours !== undefined ? parseFloat(row.requiredWorkHours).toFixed(2) : '0.00' },  // ✅ 需求1：2位小数
  { prop: 'remainingRequiredHours', label: '剩余需求工时', width: 120, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.remainingRequiredHours !== undefined ? parseFloat(row.remainingRequiredHours).toFixed(2) : '0.00' },  // ✅ 需求2：剩余需求工时
  { prop: 'cumulativeScheduleQty', label: '累积排程数量', width: 130, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.cumulativeScheduleQty !== undefined ? parseFloat(row.cumulativeScheduleQty).toFixed(2) : '0.00' },  // ✅ 需求3：已排工时改为累积排程数量
  { prop: 'unscheduledQty', label: '未排数量', width: 100, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.unscheduledQty !== undefined ? parseFloat(row.unscheduledQty).toFixed(2) : '0.00' },  // ✅ 需求4：未排工时改为未排数量
  { prop: 'progressStatus', label: '进度状态', width: 140, sortable: true, filterable: true, align: 'center', visible: true, slot: 'progressStatus' },  // ✅ 新增：进度状态(使用插槽)
  { prop: 'replenishmentQty', label: '需补货数量', width: 120, sortable: true, align: 'right', visible: true },
  { prop: 'sourcePageName', label: '来源页面名称', width: 130, filterable: true, visible: false },
  { prop: 'sourceNo', label: '来源编号', width: 160, filterable: true, visible: true },  // ✅ 需求1：来源编号默认显示
  { prop: 'previousScheduleNo', label: '上一个排程单号', width: 160, filterable: true, visible: false },
  { prop: 'customerName', label: '客户名称', width: 150, filterable: true, visible: true },
  { prop: 'level0ProductName', label: '0阶产品名称', width: 150, filterable: true, visible: false },
  { prop: 'level0ProductCode', label: '0阶产品编号', width: 140, filterable: true, visible: false },
  { prop: 'level0ProductionQty', label: '0阶主计划生产数量', width: 160, sortable: true, align: 'right', visible: false },
  { prop: 'productSource', label: '产品来源', width: 120, filterable: true, visible: false },
  { prop: 'bomNo', label: '生产BOM编号', width: 160, filterable: true, sortable: true, visible: true },  // ✅ 显示BOM编号
  { prop: 'hierarchyAddress', label: '层阶地址', width: 120, filterable: true, visible: true },  // ✅ 新增层阶地址
  { prop: 'bomDetail', label: 'BOM详情', width: 100, slot: 'bomDetail', align: 'center', visible: true },  // ✅ 新增BOM详情列
  { prop: 'submittedBy', label: '提交人', width: 100, filterable: true, visible: true },
  { prop: 'submittedAt', label: '提交时间', width: 160, sortable: true, visible: true }
  // ✅ actions操作列由StandardTablePage的插槽#column-actions自动处理，不需要在columns中定义
])

// ✅ 加载数据 - 仅加载已保存的数据，不重新计算
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      planNo: searchForm.planNo,
      masterPlanNo: searchForm.masterPlanNo,
      processName: searchForm.processName
    }
    
    // 添加日期范围
    if (searchForm.scheduleDateRange && searchForm.scheduleDateRange.length === 2) {
      params.scheduleDateStart = searchForm.scheduleDateRange[0]
      params.scheduleDateEnd = searchForm.scheduleDateRange[1]
    }
    
    console.log('🔄 开始加载工序计划数据...')
    const data = await api.getList(params)
    tableData.value = data.records || []
    pagination.total = data.total || 0
    
    console.log(`✅ 数据加载完成，共 ${tableData.value.length} 条记录`)
    console.log('📊 加载的数据已包含所有计算字段，无需重复计算')
    
    // ⚠️ 关键修复：删除所有重新计算逻辑
    // 数据库中已经存储了所有计算好的字段，直接使用即可
    // 重新计算会导致：
    // 1. 重复推送已占用工时到工序能力负荷表(累加错误)
    // 2. 重复生成自增记录(数据重复)
    // 3. 性能严重下降(每次刷新都调用大量 API)
    
    ElMessage.success('数据加载成功')
  } catch (error) {
    console.error('❌ 加载数据失败:', error)
    ElMessage.error('加载数据失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.planNo = ''
  searchForm.masterPlanNo = ''
  searchForm.processName = ''
  searchForm.scheduleDateRange = []
  pagination.page = 1
  loadData()
}

// ========== 数据加载（刷新时只加载数据，不重新计算） ==========
const _loadDataWithCalculation = async () => {
  // 以下代码段是之前刷新时会重新计算的逻辑，现已移至handleSave创建模式
  // 保留此处仅作为文档说明，实际不执行
  if (false) {
    // 步骤2：查询计划日期
    const planDatePromises = tableData.value.map(async (row) => {
      if (!row.processName || !row.completionDate) {
        row.planEndDate = null
        row.planStartDate = null
        row.realPlanStartDate = null
        row.scheduleDate = null
        return row
      }
      
      try {
        // 此处为占位代码，实际不执行
        return null
      } catch (error) {
        return null
      }
    })
  }
}

// ========== 字段计算逻辑 ==========

/**
 * 计算需求工时和真需求工时
 * 规则：需求工时 = 需补货数量(replenishmentQty) / 定时工额(standardWorkQuota)
 * 精度：保留2位小数
 * 计算时机：需补货数量>0 且 定时工额>0
 * 注意：同时更新废弃的requiredWorkHours和新的actualRequiredWorkHours
 */
const calculateRequiredWorkHours = () => {
  const replenishmentQty = parseFloat(formData.value.replenishmentQty) || 0
  const standardWorkQuota = parseFloat(formData.value.standardWorkQuota) || 0
  
  console.log('🔢 计算需求工时:', { replenishmentQty, standardWorkQuota })
  
  if (replenishmentQty > 0 && standardWorkQuota > 0) {
    const calculated = replenishmentQty / standardWorkQuota
    const result = parseFloat(calculated.toFixed(2))
    // ⚠️ 同时更新两个字段：废弃的requiredWorkHours用于界面显示，actualRequiredWorkHours用于业务逻辑
    formData.value.requiredWorkHours = result
    formData.value.actualRequiredWorkHours = result
    console.log(`✅ 需求工时计算结果: ${replenishmentQty} / ${standardWorkQuota} = ${result}`)
    console.log(`✅ 真需求工时已同步更新: ${result}`)
    return result
  } else {
    formData.value.requiredWorkHours = 0
    formData.value.actualRequiredWorkHours = 0
    console.log('⚠️ 需求工时计算条件不满足，设为0')
    return 0
  }
}

/**
 * 查询计划结束日期
 * 规则：跨表查询工序能力负荷表，使用MAXIFS规则
 * 前置条件：真需求工时(actualRequiredWorkHours) > 0
 * 查询条件：
 *   - 工序名称 = 本行工序名称
 *   - 日期 <= 计划完工日期
 *   - 剩余工时 >= 业务变量中的门槛值(minRemainingHours)
 * 结果：返回符合条件的最大日期
 */
const queryPlanEndDate = async () => {
  // ✅ 使用真需求工时（actualRequiredWorkHours）而非废弃的需求工时
  const actualRequiredWorkHours = parseFloat(formData.value.actualRequiredWorkHours) || 0
  const processName = formData.value.processName
  const completionDate = formData.value.completionDate
  const minRemainingHours = currentBusinessVars.value.minRemainingHours || 0.5
  
  console.log('🔍 查询计划结束日期:', { actualRequiredWorkHours, processName, completionDate, minRemainingHours })
  
  // 前置条件：真需求工时 > 0
  if (actualRequiredWorkHours <= 0) {
    console.log('⚠️ 真需求工时<=0，跳过查询计划结束日期')
    formData.value.planEndDate = null
    return null
  }
  
  if (!processName || !completionDate) {
    console.log('⚠️ 缺少必要参数：工序名称或计划完工日期')
    formData.value.planEndDate = null
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
      return response.data.planEndDate
    } else {
      formData.value.planEndDate = null
      console.log('⚠️ 未找到符合条件的计划结束日期')
      return null
    }
  } catch (error) {
    console.error('❌ 查询计划结束日期失败:', error)
    formData.value.planEndDate = null
    return null
  }
}

// ✅ 监听需补货数量和定时工额变化，自动计算需求工时
watch(
  () => [
    parseFloat(formData.value.replenishmentQty) || 0,
    parseFloat(formData.value.standardWorkQuota) || 0
  ],
  () => {
    console.log('🔄 需补货数量或定时工额发生变化，重新计算需求工时')
    calculateRequiredWorkHours()
  },
  { deep: true, immediate: false }  // ✅ 不使用immediate，避免初始化时重复计算
)

// ✅ 监听真需求工时、工序名称、计划完工日期变化，自动查询计划结束日期
watch(
  () => [
    parseFloat(formData.value.actualRequiredWorkHours) || 0,
    formData.value.processName,
    formData.value.completionDate
  ],
  () => {
    console.log('🔄 真需求工时、工序名称或计划完工日期发生变化，重新查询计划结束日期')
    // 使用nextTick确保数据已更新
    nextTick(() => {
      queryPlanEndDate()
    })
  },
  { deep: true, immediate: false }  // ✅ 不使用immediate，避免初始化时重复计算
)

// 新增
const handleAdd = () => {
  console.log('=== handleAdd 被调用 ===')
  
  isEdit.value = false
  formData.value = {
    planNo: generatePlanNo(),
    scheduleDate: new Date(),
    scheduleQuantity: 0,
    scheduledWorkHours: 0,  // ✅ 改名：计划排程工时
    standardWorkHours: 0,
    replenishmentQty: 0,  // ✅ 默认为0，用户需手动输入
    standardWorkQuota: 0,   // ✅ 默认为0，用户需手动输入
    requiredWorkHours: 0,   // ⚠️ 需求工时（废弃字段，保留兼容）
    actualRequiredWorkHours: 0,   // ✅ 真需求工时初始化为0
    planEndDate: null       // ✅ 计划结束日期初始化为null
  }
  
  console.log('设置后的 formData:', JSON.parse(JSON.stringify(formData.value)))
  dialogVisible.value = true
  
  // ✅ 等待对话框打开后，初始化计算
  nextTick(() => {
    calculateRequiredWorkHours()
  })
}

// 编辑
const handleEdit = (row) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
  
  // ✅ 等待对话框打开后，重新计算
  nextTick(() => {
    calculateRequiredWorkHours()
    queryPlanEndDate()
  })
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除工序计划“${row.planNo}”吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // ✅ 步骤1：记录删除前的关键信息（用于释放已占用工时）
    const deletedInfo = {
      planNo: row.planNo,
      processName: row.processName,
      scheduleDate: row.scheduleDate,
      scheduledWorkHours: parseFloat(row.scheduledWorkHours || 0)
    }
    
    console.log(`🗑️ 删除工序计划:`, deletedInfo)
    
    // ✅ 步骤2：执行删除
    await api.deleteById(row.id)
    console.log(`✅ 工序计划删除成功`)
    
    // ✅ 步骤3：如果有计划排程工时，释放工序能力负荷表的已占用工时（减法逻辑）
    if (deletedInfo.scheduledWorkHours > 0 && deletedInfo.processName && deletedInfo.scheduleDate) {
      try {
        const scheduleDateFormatted = formatDateYMD(deletedInfo.scheduleDate)
        console.log(`🔄 开始释放已占用工时: 工序=${deletedInfo.processName}, 日期=${scheduleDateFormatted}, 工时=${deletedInfo.scheduledWorkHours}`)
        
        const releaseResponse = await capacityLoadApi.releaseOccupiedHours(
          deletedInfo.processName,
          scheduleDateFormatted,
          deletedInfo.scheduledWorkHours
        )
        
        if (releaseResponse?.updated) {
          console.log(`✅ 已占用工时释放成功: ${releaseResponse.previousOccupiedHours} - ${releaseResponse.releasedHours} = ${releaseResponse.newOccupiedHours}`)
        } else {
          console.log(`⚠️ 未找到匹配记录，跳过释放: ${releaseResponse?.reason || '未知原因'}`)
        }
      } catch (error) {
        console.error(`❗ 释放已占用工时失败:`, error)
        // 不阻塞主流程
      }
    } else {
      console.log(`⏭️ 跳过释放: 计划排程工时=${deletedInfo.scheduledWorkHours}, 工序=${deletedInfo.processName}, 日期=${deletedInfo.scheduleDate}`)
    }
    
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ 删除失败:', error)
      ElMessage.error('删除失败: ' + (error.message || '未知错误'))
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的记录')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条记录吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // ✅ 步骤1：记录所有删除记录的关键信息
    const deletedRecordsInfo = selectedRows.value
      .filter(row => row.scheduledWorkHours && parseFloat(row.scheduledWorkHours) > 0)
      .map(row => ({
        processName: row.processName,
        scheduleDate: row.scheduleDate,
        scheduledWorkHours: parseFloat(row.scheduledWorkHours || 0),
        planNo: row.planNo
      }))
    
    console.log(`🗑️ 批量删除 ${selectedRows.value.length} 条记录，其中 ${deletedRecordsInfo.length} 条需要释放已占用工时`)
    
    // ✅ 步骤2：执行批量删除
    const ids = selectedRows.value.map(row => row.id)
    await api.batchDelete(ids)
    console.log(`✅ 批量删除成功`)
    
    // ✅ 步骤3：合并同一工序+同一日期的工时，避免竞态条件
    if (deletedRecordsInfo.length > 0) {
      console.log(`🔄 开始释放 ${deletedRecordsInfo.length} 条记录的已占用工时`)
      
      // ✨ 关键优化：按工序+日期合并工时
      const mergedMap = new Map()
      
      deletedRecordsInfo.forEach(info => {
        const scheduleDateFormatted = formatDateYMD(info.scheduleDate)
        const key = `${info.processName}__${scheduleDateFormatted}` // 工序+日期作为唯一key
        
        if (mergedMap.has(key)) {
          // 已存在，累加工时
          const existing = mergedMap.get(key)
          existing.totalHours += info.scheduledWorkHours
          existing.planNos.push(info.planNo)
        } else {
          // 新增
          mergedMap.set(key, {
            processName: info.processName,
            scheduleDate: scheduleDateFormatted,
            totalHours: info.scheduledWorkHours,
            planNos: [info.planNo]
          })
        }
      })
      
      console.log(`📊 合并后需要释放 ${mergedMap.size} 个工序-日期组合`)
      
      // ✅ 顺序执行释放（避免并发竞态）
      for (const [key, merged] of mergedMap.entries()) {
        try {
          console.log(`🔄 [工序=${merged.processName}, 日期=${merged.scheduleDate}] 释放总工时=${merged.totalHours.toFixed(2)}, 涉及计划: ${merged.planNos.join(', ')}`)
          
          const releaseResponse = await capacityLoadApi.releaseOccupiedHours(
            merged.processName,
            merged.scheduleDate,
            merged.totalHours
          )
          
          if (releaseResponse?.updated) {
            console.log(`✅ [工序=${merged.processName}, 日期=${merged.scheduleDate}] 释放成功: ${releaseResponse.previousOccupiedHours} - ${releaseResponse.releasedHours} = ${releaseResponse.newOccupiedHours}`)
          } else {
            console.log(`⚠️ [工序=${merged.processName}, 日期=${merged.scheduleDate}] 未找到匹配记录: ${releaseResponse?.reason || '未知原因'}`)
          }
        } catch (error) {
          console.error(`❗ [工序=${merged.processName}, 日期=${merged.scheduleDate}] 释放失败:`, error)
          // 不阻塞其他记录
        }
      }
      
      console.log(`✅ 所有已占用工时释放完成`)
    }
    
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ 批量删除失败:', error)
      ElMessage.error('批量删除失败: ' + (error.message || '未知错误'))
    }
  }
}

// 保存
const handleSave = async () => {
  try {
    // ✅ 保存前先计算需求工时和计划结束日期
    calculateRequiredWorkHours()
    await queryPlanEndDate()
    
    await formRef.value.validate()
    
    console.log('💾 保存的数据:', {
      replenishmentQty: formData.value.replenishmentQty,
      standardWorkQuota: formData.value.standardWorkQuota,
      requiredWorkHours: formData.value.requiredWorkHours,
      planEndDate: formData.value.planEndDate
    })
    
    if (isEdit.value) {
      await api.update(formData.value.id, formData.value)
      ElMessage.success('更新成功')
    } else {
      await api.create(formData.value)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('❌ 保存失败:', error)
    if (error !== false) {
      ElMessage.error('保存失败: ' + (error.message || '未知错误'))
    }
  }
}

// 生成计划编号
const generatePlanNo = () => {
  const year = new Date().getFullYear()
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `PP${year}${timestamp}${random}`
}

// 导入
const handleImport = () => {
  importDialogVisible.value = true
}

let importFile = null

const handleFileChange = (file) => {
  importFile = file.raw
}

const confirmImport = () => {
  if (!importFile) {
    ElMessage.warning('请选择文件')
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const workbook = XLSX.read(e.target.result, { type: 'binary' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      // TODO: 数据映射和导入逻辑
      ElMessage.success(`成功导入 ${jsonData.length} 条数据`)
      importDialogVisible.value = false
      loadData()
    } catch (error) {
      console.error('❌ 导入失败:', error)
      ElMessage.error('导入失败')
    }
  }
  reader.readAsBinaryString(importFile)
}

// 导出
const handleExport = () => {
  const exportData = tableData.value.map(row => ({
    '工序计划编号': row.planNo,
    '计划排程日期': row.scheduleDate,
    '主生产计划编号': row.masterPlanNo,
    '工序名称': row.processName,
    '计划排程数量': row.scheduleQuantity,
    '工序负责人': row.processManager,
    '车间名称': row.workshopName,
    '计划完工日期': row.completionDate
  }))
  
  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '工序计划')
  XLSX.writeFile(workbook, `工序计划_${new Date().getTime()}.xlsx`)
  
  ElMessage.success('导出成功')
}

// 分页变化
const handlePageChange = (page) => {
  pagination.page = page
  loadData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 页面设置保存
const handleSavePageSettings = (settings) => {
  console.log('=== 页面设置保存调试信息 ===')
  console.log('settings 对象:', settings)
  console.log('settings.fields:', settings.fields)
  console.log('当前 allColumns 数量:', allColumns.value.length)
  
  // ✅ 保存业务变量配置
  if (settings.businessVars) {
    console.log('✅ 保存业务变量配置:', settings.businessVars)
    currentBusinessVars.value = {
      ...currentBusinessVars.value,
      ...settings.businessVars
    }
    console.log('✅ 当前业务变量:', currentBusinessVars.value)
  }
  
  // ✅ 应用列顺序和可见性（支持拖拽）
  if (settings.fields && Array.isArray(settings.fields)) {
    console.log('✅ 收到字段设置，数量:', settings.fields.length)
    
    // 根据 settings.fields 更新 allColumns 的顺序和可见性
    const fieldMap = new Map(settings.fields.map(f => [f.prop, f]))
    
    // 重新排序 allColumns
    const newColumns = []
    settings.fields.forEach(field => {
      const col = allColumns.value.find(c => c.prop === field.prop)
      if (col) {
        // ✅ 保持所有原有属性，只更新可见性
        const newCol = {
          ...col,
          visible: field.visible !== false
        }
        newColumns.push(newCol)
        console.log(`✅ 添加列: ${field.label}, visible: ${field.visible}, fixed: ${col.fixed || 'none'}`)
      }
    })
    
    // 添加未在 settings.fields 中的列（保持原顺序）
    allColumns.value.forEach(col => {
      if (!fieldMap.has(col.prop)) {
        newColumns.push({ ...col })
      }
    })
    
    // ✅ 关键：替换整个数组引用
    allColumns.value = newColumns
    
    console.log('✅ 列顺序已更新:')
    console.log('新顺序:', newColumns.map(c => c.label).join(', '))
    console.log('可见列:', newColumns.filter(c => c.visible).map(c => c.label).join(', '))
    
    // ✅ 添加延迟，确保渲染完成
    setTimeout(() => {
      console.log('✅ 列更新完成')
    }, 100)
    
  } else if (settings.visibleFields) {
    // 向后兼容：只有可见性，没有顺序
    allColumns.value.forEach(col => {
      col.visible = settings.visibleFields.includes(col.prop)
    })
    console.log('✅ 应用可见性设置（旧格式）')
  }
  
  ElMessage.success('设置已应用')
}

// ========== 初始化 ==========
onMounted(() => {
  loadData()
  
  // ✅ 添加调试信息
  console.log('=== 工序计划页面初始化 ===')
  console.log('allColumns 数量:', allColumns.value.length)
  console.log('StandardTablePage 版本: v2.1')
  console.log('列配置:', allColumns.value.map(c => `${c.label}(${c.prop})`).join(', '))
  console.log('页面加载完成')
})
</script>

<style scoped lang="scss">
// StandardTablePage v2.1 已包含所有响应式样式，无需额外样式

// ✅ 进度状态旋转动画
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
