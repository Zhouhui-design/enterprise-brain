<template>
  <div class="supplier-management-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>供应商管理</h2>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增
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
        <el-form-item label="供应商编码">
          <el-input v-model="searchForm.supplierCode" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="供应商名称">
          <el-input v-model="searchForm.supplierName" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="供应商类型">
          <el-select v-model="searchForm.supplierType" placeholder="请选择" clearable style="width: 150px">
            <el-option v-for="item in SUPPLIER_TYPES" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 120px">
            <el-option v-for="item in SUPPLIER_STATUS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="信用等级">
          <el-select v-model="searchForm.creditRating" placeholder="请选择" clearable style="width: 120px">
            <el-option v-for="item in CREDIT_RATINGS" :key="item.value" :label="item.label" :value="item.value" />
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
        :columns="visibleColumns"
        :show-filter="true"
        :show-pagination="false"
        :loading="loading"
        :stripe="true"
        :border="true"
        height="calc(100vh - 300px)"
        @selection-change="handleSelectionChange"
      >
        <!-- 供应商类型列 -->
        <template #supplierType="{ row }">
          <el-tag :type="TYPE_TAG_COLORS[row.supplierType] || 'info'" size="small">
            {{ getSupplierTypeLabel(row.supplierType) }}
          </el-tag>
        </template>

        <!-- 状态列 -->
        <template #status="{ row }">
          <el-tag :type="STATUS_TAG_COLORS[row.status] || 'info'" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>

        <!-- 信用等级列 -->
        <template #creditRating="{ row }">
          <el-tag v-if="row.creditRating" :color="getCreditRatingColor(row.creditRating)" size="small">
            {{ row.creditRating }}级
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
        label-width="120px"
        size="small"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商编码" prop="supplierCode">
              <el-input v-model="formData.supplierCode" placeholder="系统自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商名称" prop="supplierName">
              <el-input v-model="formData.supplierName" placeholder="请输入供应商名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商类型" prop="supplierType">
              <el-select v-model="formData.supplierType" placeholder="请选择" style="width: 100%">
                <el-option v-for="item in SUPPLIER_TYPES" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择" style="width: 100%">
                <el-option v-for="item in SUPPLIER_STATUS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contactPerson">
              <el-input v-model="formData.contactPerson" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系邮箱" prop="contactEmail">
              <el-input v-model="formData.contactEmail" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="信用等级" prop="creditRating">
              <el-select v-model="formData.creditRating" placeholder="请选择" style="width: 100%">
                <el-option v-for="item in CREDIT_RATINGS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="地址" prop="address">
              <el-input v-model="formData.address" placeholder="请输入地址" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="税号" prop="taxNo">
              <el-input v-model="formData.taxNo" placeholder="请输入税号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开户银行" prop="bankName">
              <el-input v-model="formData.bankName" placeholder="请输入开户银行" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="银行账号" prop="bankAccount">
              <el-input v-model="formData.bankAccount" placeholder="请输入银行账号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="付款条款" prop="paymentTerms">
              <el-select v-model="formData.paymentTerms" placeholder="请选择" style="width: 100%">
                <el-option v-for="item in PAYMENT_TERMS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
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

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入供应商" width="600px">
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :limit="1"
        accept=".xlsx,.xls"
        drag
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传 xlsx/xls 文件，且不超过 10MB
          </div>
        </template>
      </el-upload>

      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportSubmit" :loading="processing">开始导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Upload, Download, Delete, Refresh, UploadFilled } from '@element-plus/icons-vue'
import EnhancedTable from '@/components/common/EnhancedTable.vue'
import {
  useSupplierList,
  useSupplierActions,
  SUPPLIER_TYPES,
  SUPPLIER_STATUS,
  CREDIT_RATINGS,
  STATUS_TAG_COLORS,
  TYPE_TAG_COLORS,
  PAYMENT_TERMS,
  type Supplier
} from '@/features/supplier-management'

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
} = useSupplierList()

// 操作管理
const {
  processing,
  generateSupplierCode,
  create,
  update,
  deleteOne,
  batchDelete,
  exportData,
  importData
} = useSupplierActions(loadData)

// 表格列配置
const defaultColumns = [
  { prop: 'supplierCode', label: '供应商编码', width: 140, filterable: true, visible: true },
  { prop: 'supplierName', label: '供应商名称', width: 180, filterable: true, visible: true },
  { prop: 'supplierType', label: '供应商类型', width: 140, filterable: true, visible: true },
  { prop: 'contactPerson', label: '联系人', width: 100, filterable: true, visible: true },
  { prop: 'contactPhone', label: '联系电话', width: 130, filterable: true, visible: true },
  { prop: 'contactEmail', label: '联系邮箱', width: 180, filterable: true, visible: true },
  { prop: 'address', label: '地址', width: 200, filterable: true, visible: true },
  { prop: 'taxNo', label: '税号', width: 180, filterable: true, visible: true },
  { prop: 'bankName', label: '开户银行', width: 150, filterable: true, visible: true },
  { prop: 'bankAccount', label: '银行账号', width: 180, filterable: true, visible: true },
  { prop: 'paymentTerms', label: '付款条款', width: 120, filterable: true, visible: true },
  { prop: 'creditRating', label: '信用等级', width: 100, filterable: true, visible: true },
  { prop: 'evaluationScore', label: '评分', width: 80, filterable: false, visible: true },
  { prop: 'status', label: '状态', width: 100, filterable: true, visible: true },
  { prop: 'cooperationStartDate', label: '合作开始日期', width: 140, filterable: true, visible: true },
  { prop: 'remarks', label: '备注', width: 200, filterable: true, visible: true },
  { prop: 'createdAt', label: '创建时间', width: 160, filterable: true, visible: true },
  { prop: 'updatedAt', label: '更新时间', width: 160, filterable: true, visible: true }
]

const visibleColumns = computed(() => defaultColumns.filter(col => col.visible))

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新增供应商')
const formRef = ref()
const importDialogVisible = ref(false)
const uploadRef = ref()

// 表单数据
const formData = reactive<Supplier>({
  supplierCode: '',
  supplierName: '',
  supplierType: '',
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  address: '',
  taxNo: '',
  bankName: '',
  bankAccount: '',
  paymentTerms: '',
  creditRating: '',
  evaluationScore: 0,
  status: 'active',
  cooperationStartDate: '',
  businessLicense: '',
  qualificationCert: '',
  remarks: ''
})

// 表单验证规则
const formRules = {
  supplierName: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  supplierType: [{ required: true, message: '请选择供应商类型', trigger: 'change' }],
  contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 工具方法
const getSupplierTypeLabel = (value: string) => {
  const item = SUPPLIER_TYPES.find(t => t.value === value)
  return item?.label || value
}

const getStatusLabel = (value: string) => {
  const item = SUPPLIER_STATUS.find(s => s.value === value)
  return item?.label || value
}

const getCreditRatingColor = (value: string) => {
  const item = CREDIT_RATINGS.find(r => r.value === value)
  return item?.color || '#909399'
}

// 事件处理
const handleAdd = () => {
  dialogTitle.value = '新增供应商'
  Object.assign(formData, {
    id: undefined,
    supplierCode: generateSupplierCode(),
    supplierName: '',
    supplierType: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    taxNo: '',
    bankName: '',
    bankAccount: '',
    paymentTerms: '',
    creditRating: '',
    evaluationScore: 0,
    status: 'active',
    cooperationStartDate: '',
    businessLicense: '',
    qualificationCert: '',
    remarks: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row: Supplier) => {
  dialogTitle.value = '编辑供应商'
  Object.assign(formData, { ...row })
  dialogVisible.value = true
}

const handleDelete = (row: Supplier) => {
  deleteOne(row)
}

const handleBatchDelete = () => {
  batchDelete(selectedRows.value)
}

const handleExport = () => {
  exportData({
    page: pagination.page,
    pageSize: pagination.pageSize,
    ...searchForm
  })
}

const handleImport = () => {
  importDialogVisible.value = true
}

const handleImportSubmit = async () => {
  const files = uploadRef.value?.uploadFiles
  if (!files || files.length === 0) {
    return
  }
  
  const success = await importData(files[0].raw)
  if (success) {
    importDialogVisible.value = false
    uploadRef.value?.clearFiles()
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    
    let success = false
    if (formData.id) {
      success = await update(formData.id, formData)
    } else {
      success = await create(formData)
    }
    
    if (success) {
      dialogVisible.value = false
    }
  })
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 初始化
onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.supplier-management-container {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .search-bar {
    margin-bottom: 20px;
    padding: 16px;
    background: #fff;
    border-radius: 4px;
  }

  .table-container {
    background: #fff;
    border-radius: 4px;
    padding: 16px;

    .pagination-container {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }
  }
}
</style>
