<template>
  <div class="supplier-evaluation-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>供应商评价管理</h2>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增评价
        </el-button>
        <el-button size="small" @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
        <el-button size="small" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button size="small" @click="handleBatchDelete" :disabled="!hasSelection">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-button size="small" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" size="small">
        <el-form-item label="评价编号">
          <el-input v-model="searchForm.evaluationNo" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="供应商名称">
          <el-input v-model="searchForm.supplierName" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="评价日期">
          <el-date-picker
            v-model="searchForm.evaluationDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="评价等级">
          <el-select v-model="searchForm.evaluationLevel" placeholder="请选择" clearable style="width: 120px">
            <el-option
              v-for="level in EVALUATION_LEVELS"
              :key="level.value"
              :label="level.label"
              :value="level.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleResetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <EnhancedTable
        ref="tableRef"
        :data="tableData"
        :columns="columns"
        :show-filter="true"
        :show-pagination="false"
        :loading="loading"
        :stripe="true"
        :border="true"
        height="calc(100vh - 320px)"
        @selection-change="handleSelectionChange"
      >
        <!-- 评价等级列 -->
        <template #evaluationLevel="{ row }">
          <el-tag :type="LEVEL_TAG_COLORS[row.evaluationLevel]">
            {{ row.evaluationLevel }}级
          </el-tag>
        </template>

        <!-- 操作列 -->
        <template #operation="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </EnhancedTable>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="70%"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="140px"
        size="small"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="评价编号" prop="evaluationNo">
              <el-input v-model="formData.evaluationNo" placeholder="系统自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商编码" prop="supplierCode">
              <el-input v-model="formData.supplierCode" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商名称" prop="supplierName">
              <el-input v-model="formData.supplierName" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="评价日期" prop="evaluationDate">
              <el-date-picker v-model="formData.evaluationDate" type="date" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contactPerson">
              <el-input v-model="formData.contactPerson" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="formData.contactPhone" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="评价人" prop="evaluator">
              <el-input v-model="formData.evaluator" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider>评分项（满分100分）</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="质量得分" prop="qualityScore">
              <el-input-number v-model="formData.qualityScore" :min="0" :max="100" :precision="1" style="width: 100%" @change="handleScoreChange" />
              <span class="score-hint">权重: 30%</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交期得分" prop="deliveryScore">
              <el-input-number v-model="formData.deliveryScore" :min="0" :max="100" :precision="1" style="width: 100%" @change="handleScoreChange" />
              <span class="score-hint">权重: 30%</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="价格得分" prop="priceScore">
              <el-input-number v-model="formData.priceScore" :min="0" :max="100" :precision="1" style="width: 100%" @change="handleScoreChange" />
              <span class="score-hint">权重: 20%</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="服务得分" prop="serviceScore">
              <el-input-number v-model="formData.serviceScore" :min="0" :max="100" :precision="1" style="width: 100%" @change="handleScoreChange" />
              <span class="score-hint">权重: 20%</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider>评价结果</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="总得分">
              <el-input-number v-model="formData.totalScore" :precision="2" disabled style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="评价等级">
              <el-tag :type="LEVEL_TAG_COLORS[formData.evaluationLevel]" size="large">
                {{ formData.evaluationLevel }}级
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注" prop="remarks">
              <el-input v-model="formData.remarks" type="textarea" :rows="3" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="processing">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Upload, Download, Delete, Refresh } from '@element-plus/icons-vue'
import EnhancedTable from '@/components/common/EnhancedTable.vue'
import { 
  useSupplierEvaluationList,
  useSupplierEvaluationActions,
  EVALUATION_LEVELS,
  LEVEL_TAG_COLORS,
  type SupplierEvaluation
} from '@/features/supplier-evaluation'
import type { FormInstance, FormRules } from 'element-plus'

// 列表管理
const {
  loading,
  tableData,
  selectedRows,
  pagination,
  searchForm,
  hasSelection,
  loadData,
  handleSearch,
  handleResetSearch,
  handleRefresh,
  handlePageChange,
  handlePageSizeChange,
  handleSelectionChange
} = useSupplierEvaluationList()

// 操作管理
const {
  processing,
  generateEvaluationNo,
  calculateTotalScore,
  calculateEvaluationLevel,
  create,
  update,
  deleteOne,
  batchDelete
} = useSupplierEvaluationActions(loadData)

// 表格列定义
const columns = ref([
  { prop: 'evaluationNo', label: '评价编号', width: 180, sortable: true, visible: true },
  { prop: 'supplierCode', label: '供应商编码', width: 150, sortable: true, visible: true },
  { prop: 'supplierName', label: '供应商名称', width: 200, sortable: true, visible: true },
  { prop: 'contactPerson', label: '联系人', width: 120, visible: true },
  { prop: 'contactPhone', label: '联系电话', width: 150, visible: true },
  { prop: 'evaluationDate', label: '评价日期', width: 120, sortable: true, visible: true },
  { prop: 'evaluator', label: '评价人', width: 120, visible: true },
  { prop: 'qualityScore', label: '质量得分', width: 100, sortable: true, visible: true },
  { prop: 'deliveryScore', label: '交期得分', width: 100, sortable: true, visible: true },
  { prop: 'priceScore', label: '价格得分', width: 100, sortable: true, visible: true },
  { prop: 'serviceScore', label: '服务得分', width: 100, sortable: true, visible: true },
  { prop: 'totalScore', label: '总得分', width: 100, sortable: true, visible: true },
  { prop: 'evaluationLevel', label: '评价等级', width: 120, slot: 'evaluationLevel', visible: true },
  { prop: 'remarks', label: '备注', width: 200, visible: true },
  { prop: 'operation', label: '操作', width: 160, fixed: 'right', slot: 'operation', visible: true }
])

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = computed(() => (formData.id ? '编辑供应商评价' : '新增供应商评价'))
const formRef = ref<FormInstance>()

// 表单数据
const defaultFormData: SupplierEvaluation = {
  evaluationNo: '',
  supplierCode: '',
  supplierName: '',
  contactPerson: '',
  contactPhone: '',
  evaluationDate: '',
  evaluator: '',
  qualityScore: 0,
  deliveryScore: 0,
  priceScore: 0,
  serviceScore: 0,
  totalScore: 0,
  evaluationLevel: 'D',
  remarks: ''
}

const formData = reactive<SupplierEvaluation>({ ...defaultFormData })

// 表单验证规则
const formRules: FormRules = {
  supplierCode: [{ required: true, message: '请输入供应商编码', trigger: 'blur' }],
  supplierName: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  evaluationDate: [{ required: true, message: '请选择评价日期', trigger: 'change' }],
  evaluator: [{ required: true, message: '请输入评价人', trigger: 'blur' }],
  qualityScore: [{ required: true, message: '请输入质量得分', trigger: 'blur' }],
  deliveryScore: [{ required: true, message: '请输入交期得分', trigger: 'blur' }],
  priceScore: [{ required: true, message: '请输入价格得分', trigger: 'blur' }],
  serviceScore: [{ required: true, message: '请输入服务得分', trigger: 'blur' }]
}

// 评分变化时自动计算总分和等级
const handleScoreChange = () => {
  formData.totalScore = calculateTotalScore(formData)
  formData.evaluationLevel = calculateEvaluationLevel(formData.totalScore)
}

// 新增
const handleAdd = () => {
  Object.assign(formData, { ...defaultFormData })
  formData.evaluationNo = generateEvaluationNo()
  formData.evaluationDate = new Date().toISOString().split('T')[0]
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: SupplierEvaluation) => {
  Object.assign(formData, { ...row })
  dialogVisible.value = true
}

// 删除
const handleDelete = (row: SupplierEvaluation) => {
  deleteOne(row)
}

// 批量删除
const handleBatchDelete = () => {
  batchDelete(selectedRows.value)
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      const success = formData.id
        ? await update(formData.id, formData)
        : await create(formData)
      
      if (success) {
        dialogVisible.value = false
      }
    }
  })
}

// 对话框关闭
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 导入
const handleImport = () => {
  console.log('导入功能开发中')
}

// 导出
const handleExport = () => {
  console.log('导出功能开发中')
}

// 页面加载时获取数据
onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.supplier-evaluation-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: #303133;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.search-bar {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-container {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .pagination-container {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}

.score-hint {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

:deep(.el-divider__text) {
  font-weight: 500;
  color: #409EFF;
}
</style>
