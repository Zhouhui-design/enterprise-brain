<template>
  <div class="payable-create">
    <div class="header">
      <h2>新增应付账款</h2>
      <div class="header-actions">
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>

    <el-card class="form-card">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplierId">
              <el-select 
                v-model="formData.supplierId" 
                placeholder="请选择供应商" 
                filterable
                @change="onSupplierChange"
              >
                <el-option
                  v-for="supplier in supplierList"
                  :key="supplier.id"
                  :label="supplier.name"
                  :value="supplier.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="采购订单" prop="poId">
              <el-select 
                v-model="formData.poId" 
                placeholder="请选择采购订单" 
                filterable
                @change="onPoChange"
              >
                <el-option
                  v-for="po in poList"
                  :key="po.id"
                  :label="`${po.number} - ${po.supplierName}`"
                  :value="po.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发票编号" prop="invoiceNumber">
              <el-input v-model="formData.invoiceNumber" placeholder="请输入发票编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发票日期" prop="invoiceDate">
              <el-date-picker
                v-model="formData.invoiceDate"
                type="date"
                placeholder="请选择发票日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="到期日期" prop="dueDate">
              <el-date-picker
                v-model="formData.dueDate"
                type="date"
                placeholder="请选择到期日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="付款条件" prop="paymentTerms">
              <el-select v-model="formData.paymentTerms" placeholder="请选择付款条件">
                <el-option label="货到付款" value="cod" />
                <el-option label="30天付款" value="30days" />
                <el-option label="60天付款" value="60days" />
                <el-option label="90天付款" value="90days" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="应付金额" prop="totalAmount">
              <el-input-number
                v-model="formData.totalAmount"
                :min="0"
                :precision="2"
                placeholder="请输入应付金额"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税率(%)" prop="taxRate">
              <el-input-number
                v-model="formData.taxRate"
                :min="0"
                :max="100"
                :precision="2"
                placeholder="请输入税率"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="摘要" prop="summary">
          <el-input
            v-model="formData.summary"
            type="textarea"
            placeholder="请输入摘要信息"
            rows="3"
          />
        </el-form-item>

        <el-form-item label="附件">
          <el-upload
            class="upload-demo"
            action="/api/upload"
            :file-list="fileList"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :before-remove="beforeRemove"
            multiple
            :limit="3"
            :on-exceed="handleExceed"
          >
            <el-button size="small" type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                只能上传jpg/png文件，且不超过500kb
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm">保存</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

export default {
  name: 'PayableCreate',
  setup() {
    const router = useRouter()
    const formRef = ref(null)
    const fileList = ref([])

    // 表单数据
    const formData = reactive({
      supplierId: '',
      supplierName: '',
      poId: '',
      poNumber: '',
      invoiceNumber: '',
      invoiceDate: '',
      dueDate: '',
      paymentTerms: '30days',
      totalAmount: 0,
      taxRate: 13,
      summary: ''
    })

    // 供应商列表
    const supplierList = ref([
      { id: 1, name: '北京科技有限公司' },
      { id: 2, name: '上海贸易公司' },
      { id: 3, name: '广州制造有限公司' },
      { id: 4, name: '深圳科技集团' }
    ])

    // 采购订单列表
    const poList = ref([
      { id: 1, number: 'PO20240001', supplierId: 1, supplierName: '北京科技有限公司', amount: 50000 },
      { id: 2, number: 'PO20240002', supplierId: 2, supplierName: '上海贸易公司', amount: 120000 },
      { id: 3, number: 'PO20240003', supplierId: 3, supplierName: '广州制造有限公司', amount: 80000 }
    ])

    // 表单验证规则
    const rules = {
      supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
      poId: [{ required: true, message: '请选择采购订单', trigger: 'change' }],
      invoiceNumber: [{ required: true, message: '请输入发票编号', trigger: 'blur' }],
      invoiceDate: [{ required: true, message: '请选择发票日期', trigger: 'change' }],
      dueDate: [{ required: true, message: '请选择到期日期', trigger: 'change' }],
      paymentTerms: [{ required: true, message: '请选择付款条件', trigger: 'change' }],
      totalAmount: [{ required: true, message: '请输入应付金额', trigger: 'blur' }]
    }

    // 供应商选择变化
    const onSupplierChange = (supplierId) => {
      const supplier = supplierList.value.find(s => s.id === supplierId)
      if (supplier) {
        formData.supplierName = supplier.name
      }
      // 过滤采购订单
      // 这里可以根据实际业务逻辑进行过滤
    }

    // 采购订单选择变化
    const onPoChange = (poId) => {
      const po = poList.value.find(p => p.id === poId)
      if (po) {
        formData.poNumber = po.number
        formData.totalAmount = po.amount
      }
    }

    // 文件上传相关方法
    const handlePreview = (file) => {
      console.log(file)
    }

    const handleRemove = (file, fileList) => {
      console.log(file, fileList)
    }

    const beforeRemove = (file, fileList) => {
      return ElMessageBox.confirm(`确定移除 ${file.name}？`)
    }

    const handleExceed = (files, fileList) => {
      ElMessage.warning(`当前限制选择 3 个文件，本次选择了 ${files.length} 个文件，共选择了 ${files.length + fileList.length} 个文件`)
    }

    // 提交表单
    const submitForm = () => {
      formRef.value.validate((valid) => {
        if (valid) {
          ElMessageBox.confirm('确定要保存这条应付账款记录吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            // 模拟保存
            setTimeout(() => {
              ElMessage.success('保存成功')
              goBack()
            }, 500)
          }).catch(() => {})
        }
      })
    }

    // 重置表单
    const resetForm = () => {
      formRef.value.resetFields()
      fileList.value = []
    }

    // 返回上一页
    const goBack = () => {
      router.back()
    }

    return {
      formRef,
      formData,
      supplierList,
      poList,
      rules,
      fileList,
      onSupplierChange,
      onPoChange,
      handlePreview,
      handleRemove,
      beforeRemove,
      handleExceed,
      submitForm,
      resetForm,
      goBack
    }
  }
}
</script>

<style scoped>
.payable-create {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.header h2 {
  margin: 0;
  color: #303133;
}

.form-card {
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
</style>