<template>
  <div class="payment-plan">
    <el-dialog
      v-model="visible"
      :title="title"
      width="600px"
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="供应商" prop="supplierName">
          <el-input v-model="formData.supplierName" disabled />
        </el-form-item>
        
        <el-form-item label="发票编号" prop="invoiceNumber">
          <el-input v-model="formData.invoiceNumber" disabled />
        </el-form-item>
        
        <el-form-item label="应付金额" prop="totalAmount">
          <el-input v-model="formData.totalAmount" disabled />
        </el-form-item>
        
        <el-form-item label="已付金额" prop="paidAmount">
          <el-input v-model="formData.paidAmount" disabled />
        </el-form-item>
        
        <el-form-item label="未付金额" prop="outstandingAmount">
          <el-input v-model="formData.outstandingAmount" disabled />
        </el-form-item>
        
        <el-form-item label="计划付款日期" prop="plannedDate">
          <el-date-picker
            v-model="formData.plannedDate"
            type="date"
            placeholder="请选择计划付款日期"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="计划付款金额" prop="plannedAmount">
          <el-input-number
            v-model="formData.plannedAmount"
            :min="0"
            :max="formData.outstandingAmount"
            :precision="2"
            placeholder="请输入计划付款金额"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="付款方式" prop="paymentMethod">
          <el-select v-model="formData.paymentMethod" placeholder="请选择付款方式" style="width: 100%">
            <el-option label="银行转账" value="bankTransfer" />
            <el-option label="支票" value="check" />
            <el-option label="网银" value="onlineBanking" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信" value="wechat" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formData.remark"
            type="textarea"
            placeholder="请输入备注信息"
            rows="3"
          />
        </el-form-item>
      </el-form>
      
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
import { ElMessage } from 'element-plus'

export default {
  name: 'PaymentPlan',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '付款计划'
    },
    data: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue', 'submit'],
  setup(props, { emit }) {
    const formRef = ref(null)
    
    // 表单数据
    const formData = reactive({
      supplierName: '',
      invoiceNumber: '',
      totalAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
      plannedDate: '',
      plannedAmount: 0,
      paymentMethod: 'bankTransfer',
      remark: ''
    })
    
    // 表单验证规则
    const rules = {
      plannedDate: [{ required: true, message: '请选择计划付款日期', trigger: 'change' }],
      plannedAmount: [
        { required: true, message: '请输入计划付款金额', trigger: 'blur' },
        { 
          validator: (rule, value, callback) => {
            if (value > formData.outstandingAmount) {
              callback(new Error('计划付款金额不能超过未付金额'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ],
      paymentMethod: [{ required: true, message: '请选择付款方式', trigger: 'change' }]
    }
    
    // 控制对话框显示
    const visible = computed({
      get: () => props.modelValue,
      set: (val) => emit('update:modelValue', val)
    })
    
    // 监听传入数据变化
    watch(() => props.data, (newVal) => {
      if (newVal) {
        Object.assign(formData, newVal)
        // 默认计划付款金额为未付金额
        if (!formData.plannedAmount) {
          formData.plannedAmount = formData.outstandingAmount
        }
      }
    }, { immediate: true })
    
    // 关闭对话框
    const handleClose = () => {
      visible.value = false
      // 重置表单
      if (formRef.value) {
        formRef.value.resetFields()
      }
    }
    
    // 提交表单
    const handleSubmit = () => {
      formRef.value.validate((valid) => {
        if (valid) {
          // 触发提交事件
          emit('submit', { ...formData })
          ElMessage.success('付款计划保存成功')
          handleClose()
        }
      })
    }
    
    return {
      formRef,
      formData,
      rules,
      visible,
      handleClose,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.payment-plan {
  display: inline-block;
}

.dialog-footer {
  text-align: right;
}
</style>