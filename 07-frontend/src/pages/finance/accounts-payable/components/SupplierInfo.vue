<template>
  <div class="supplier-info">
    <el-dialog
      v-model="visible"
      :title="title"
      width="800px"
      @close="handleClose"
    >
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-form
            ref="basicFormRef"
            :model="basicInfo"
            :rules="basicRules"
            label-width="120px"
          >
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="供应商名称" prop="name">
                  <el-input v-model="basicInfo.name" placeholder="请输入供应商名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="供应商编码" prop="code">
                  <el-input v-model="basicInfo.code" placeholder="请输入供应商编码" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="联系人" prop="contactPerson">
                  <el-input v-model="basicInfo.contactPerson" placeholder="请输入联系人" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系电话" prop="phone">
                  <el-input v-model="basicInfo.phone" placeholder="请输入联系电话" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="basicInfo.email" placeholder="请输入邮箱" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="供应商类型" prop="type">
                  <el-select v-model="basicInfo.type" placeholder="请选择供应商类型" style="width: 100%">
                    <el-option label="直销供应商" value="direct" />
                    <el-option label="经销供应商" value="distributor" />
                    <el-option label="零售供应商" value="retail" />
                    <el-option label="重要供应商" value="vip" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="地址" prop="address">
              <el-input v-model="basicInfo.address" placeholder="请输入详细地址" />
            </el-form-item>
            
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="basicInfo.remark"
                type="textarea"
                placeholder="请输入备注信息"
                rows="3"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="财务信息" name="finance">
          <el-form
            ref="financeFormRef"
            :model="financeInfo"
            :rules="financeRules"
            label-width="120px"
          >
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="信用额度" prop="creditLimit">
                  <el-input-number
                    v-model="financeInfo.creditLimit"
                    :min="0"
                    :precision="2"
                    placeholder="请输入信用额度"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="信用等级" prop="creditLevel">
                  <el-select v-model="financeInfo.creditLevel" placeholder="请选择信用等级" style="width: 100%">
                    <el-option label="AAA级" value="AAA" />
                    <el-option label="AA级" value="AA" />
                    <el-option label="A级" value="A" />
                    <el-option label="BBB级" value="BBB" />
                    <el-option label="BB级" value="BB" />
                    <el-option label="B级" value="B" />
                    <el-option label="C级" value="C" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="付款条件" prop="paymentTerms">
                  <el-select v-model="financeInfo.paymentTerms" placeholder="请选择付款条件" style="width: 100%">
                    <el-option label="货到付款" value="cod" />
                    <el-option label="30天付款" value="30days" />
                    <el-option label="60天付款" value="60days" />
                    <el-option label="90天付款" value="90days" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="税务登记号" prop="taxNumber">
                  <el-input v-model="financeInfo.taxNumber" placeholder="请输入税务登记号" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="开户银行" prop="bankName">
                  <el-input v-model="financeInfo.bankName" placeholder="请输入开户银行" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="银行账号" prop="bankAccount">
                  <el-input v-model="financeInfo.bankAccount" placeholder="请输入银行账号" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="发票抬头" prop="invoiceTitle">
              <el-input v-model="financeInfo.invoiceTitle" placeholder="请输入发票抬头" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="合同信息" name="contract">
          <el-form
            ref="contractFormRef"
            :model="contractInfo"
            :rules="contractRules"
            label-width="120px"
          >
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="合同编号" prop="contractNumber">
                  <el-input v-model="contractInfo.contractNumber" placeholder="请输入合同编号" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="合同有效期" prop="contractPeriod">
                  <el-date-picker
                    v-model="contractInfo.contractPeriod"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="合同附件">
              <el-upload
                class="upload-demo"
                action="/api/upload"
                :file-list="contractFiles"
                :on-preview="handlePreview"
                :on-remove="handleRemove"
                :before-remove="beforeRemove"
                multiple
                :limit="5"
                :on-exceed="handleExceed"
              >
                <el-button size="small" type="primary">点击上传</el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    只能上传pdf/doc文件，且不超过10MB
                  </div>
                </template>
              </el-upload>
            </el-form-item>
            
            <el-form-item label="合同条款" prop="contractTerms">
              <el-input
                v-model="contractInfo.contractTerms"
                type="textarea"
                placeholder="请输入合同条款"
                rows="4"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleSubmit">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'SupplierInfo',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '供应商信息'
    },
    data: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue', 'submit'],
  setup(props, { emit }) {
    const basicFormRef = ref(null)
    const financeFormRef = ref(null)
    const contractFormRef = ref(null)
    const activeTab = ref('basic')
    const contractFiles = ref([])
    
    // 基本信息
    const basicInfo = reactive({
      name: '',
      code: '',
      contactPerson: '',
      phone: '',
      email: '',
      type: '',
      address: '',
      remark: ''
    })
    
    // 财务信息
    const financeInfo = reactive({
      creditLimit: 0,
      creditLevel: '',
      paymentTerms: '',
      taxNumber: '',
      bankName: '',
      bankAccount: '',
      invoiceTitle: ''
    })
    
    // 合同信息
    const contractInfo = reactive({
      contractNumber: '',
      contractPeriod: [],
      contractTerms: ''
    })
    
    // 表单验证规则
    const basicRules = {
      name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
      code: [{ required: true, message: '请输入供应商编码', trigger: 'blur' }],
      type: [{ required: true, message: '请选择供应商类型', trigger: 'change' }]
    }
    
    const financeRules = {
      creditLimit: [{ required: true, message: '请输入信用额度', trigger: 'blur' }],
      creditLevel: [{ required: true, message: '请选择信用等级', trigger: 'change' }],
      paymentTerms: [{ required: true, message: '请选择付款条件', trigger: 'change' }]
    }
    
    const contractRules = {
      contractNumber: [{ required: true, message: '请输入合同编号', trigger: 'blur' }]
    }
    
    // 控制对话框显示
    const visible = computed({
      get: () => props.modelValue,
      set: (val) => emit('update:modelValue', val)
    })
    
    // 监听传入数据变化
    watch(() => props.data, (newVal) => {
      if (newVal) {
        // 基本信息
        Object.assign(basicInfo, newVal.basicInfo || {})
        // 财务信息
        Object.assign(financeInfo, newVal.financeInfo || {})
        // 合同信息
        Object.assign(contractInfo, newVal.contractInfo || {})
      }
    }, { immediate: true })
    
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
      ElMessage.warning(`当前限制选择 5 个文件，本次选择了 ${files.length} 个文件，共选择了 ${files.length + fileList.length} 个文件`)
    }
    
    // 关闭对话框
    const handleClose = () => {
      visible.value = false
      // 重置表单
      if (basicFormRef.value) {
        basicFormRef.value.resetFields()
      }
      if (financeFormRef.value) {
        financeFormRef.value.resetFields()
      }
      if (contractFormRef.value) {
        contractFormRef.value.resetFields()
      }
      // 重置tab
      activeTab.value = 'basic'
    }
    
    // 提交表单
    const handleSubmit = () => {
      // 验证所有表单
      Promise.all([
        new Promise(resolve => basicFormRef.value?.validate?.(resolve)),
        new Promise(resolve => financeFormRef.value?.validate?.(resolve)),
        new Promise(resolve => contractFormRef.value?.validate?.(resolve))
      ]).then(() => {
        // 触发提交事件
        emit('submit', {
          basicInfo: { ...basicInfo },
          financeInfo: { ...financeInfo },
          contractInfo: { ...contractInfo }
        })
        ElMessage.success('供应商信息保存成功')
        handleClose()
      }).catch(() => {
        ElMessage.error('请完善所有必填信息')
      })
    }
    
    return {
      basicFormRef,
      financeFormRef,
      contractFormRef,
      activeTab,
      contractFiles,
      basicInfo,
      financeInfo,
      contractInfo,
      basicRules,
      financeRules,
      contractRules,
      visible,
      handlePreview,
      handleRemove,
      beforeRemove,
      handleExceed,
      handleClose,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.supplier-info {
  display: inline-block;
}

.dialog-footer {
  text-align: right;
}
</style>