<template>
  <div class="payable-approve">
    <div class="header">
      <h2>应付账款审批</h2>
      <div class="header-actions">
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>

    <el-card class="detail-card">
      <template #header>
        <div class="card-header">
          <span>应付账款详情</span>
        </div>
      </template>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="供应商名称">{{ payableDetail.supplierName }}</el-descriptions-item>
        <el-descriptions-item label="发票编号">{{ payableDetail.invoiceNumber }}</el-descriptions-item>
        <el-descriptions-item label="采购订单号">{{ payableDetail.poNumber }}</el-descriptions-item>
        <el-descriptions-item label="发票日期">{{ formatDate(payableDetail.invoiceDate) }}</el-descriptions-item>
        <el-descriptions-item label="到期日期">{{ formatDate(payableDetail.dueDate) }}</el-descriptions-item>
        <el-descriptions-item label="付款条件">{{ getPaymentTermsText(payableDetail.paymentTerms) }}</el-descriptions-item>
        <el-descriptions-item label="应付金额">{{ formatCurrency(payableDetail.totalAmount) }}</el-descriptions-item>
        <el-descriptions-item label="已付金额">{{ formatCurrency(payableDetail.paidAmount) }}</el-descriptions-item>
        <el-descriptions-item label="未付金额">{{ formatCurrency(payableDetail.outstandingAmount) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getStatusText(payableDetail.status) }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ payableDetail.createdBy }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(payableDetail.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="摘要" :span="2">{{ payableDetail.summary }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="approval-card">
      <template #header>
        <div class="card-header">
          <span>审批信息</span>
        </div>
      </template>
      
      <el-form
        ref="approvalFormRef"
        :model="approvalForm"
        :rules="approvalRules"
        label-width="120px"
      >
        <el-form-item label="审批结果" prop="result">
          <el-radio-group v-model="approvalForm.result">
            <el-radio label="approved">同意</el-radio>
            <el-radio label="rejected">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="审批意见" prop="comment">
          <el-input
            v-model="approvalForm.comment"
            type="textarea"
            placeholder="请输入审批意见"
            rows="4"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="submitApproval"
            :loading="approvalLoading"
          >
            提交审批
          </el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="history-card">
      <template #header>
        <div class="card-header">
          <span>审批历史</span>
        </div>
      </template>
      
      <el-table :data="approvalHistory" style="width: 100%" border>
        <el-table-column prop="approver" label="审批人" width="120" />
        <el-table-column prop="result" label="审批结果" width="100">
          <template #default="{ row }">
            <el-tag :type="getResultType(row.result)">{{ getResultText(row.result) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="comment" label="审批意见" min-width="200" />
        <el-table-column prop="approveTime" label="审批时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.approveTime) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

export default {
  name: 'PayableApprove',
  setup() {
    const router = useRouter()
    const approvalFormRef = ref(null)
    const approvalLoading = ref(false)

    // 应付账款详情
    const payableDetail = ref({
      id: 1,
      supplierName: '北京科技有限公司',
      invoiceNumber: 'INV20240001',
      poNumber: 'PO20240001',
      invoiceDate: '2024-01-15',
      dueDate: '2024-02-15',
      paymentTerms: '30days',
      totalAmount: 50000.00,
      paidAmount: 0,
      outstandingAmount: 50000.00,
      status: 'pending',
      createdBy: '张三',
      createTime: '2024-01-15 10:30:00',
      summary: '采购服务器设备'
    })

    // 审批表单
    const approvalForm = reactive({
      result: 'approved',
      comment: ''
    })

    // 审批历史
    const approvalHistory = ref([
      {
        approver: '李四',
        result: 'submitted',
        comment: '提交审批',
        approveTime: '2024-01-15 10:30:00'
      }
    ])

    // 表单验证规则
    const approvalRules = {
      result: [{ required: true, message: '请选择审批结果', trigger: 'change' }],
      comment: [{ required: true, message: '请输入审批意见', trigger: 'blur' }]
    }

    // 格式化日期
    const formatDate = (date) => {
      if (!date) return ''
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }

    // 格式化货币
    const formatCurrency = (value) => {
      if (value === null || value === undefined) return '0.00'
      return value.toFixed(2)
    }

    // 获取付款条件文本
    const getPaymentTermsText = (terms) => {
      switch (terms) {
        case 'cod': return '货到付款'
        case '30days': return '30天付款'
        case '60days': return '60天付款'
        case '90days': return '90天付款'
        default: return '未知'
      }
    }

    // 获取状态文本
    const getStatusText = (status) => {
      switch (status) {
        case 'pending': return '待审批'
        case 'approved': return '已批准'
        case 'rejected': return '已拒绝'
        case 'paid': return '已付款'
        default: return '未知'
      }
    }

    // 获取审批结果类型
    const getResultType = (result) => {
      switch (result) {
        case 'approved': return 'success'
        case 'rejected': return 'danger'
        case 'submitted': return 'info'
        default: return 'default'
      }
    }

    // 获取审批结果文本
    const getResultText = (result) => {
      switch (result) {
        case 'approved': return '同意'
        case 'rejected': return '拒绝'
        case 'submitted': return '提交'
        default: return '未知'
      }
    }

    // 提交审批
    const submitApproval = () => {
      approvalFormRef.value.validate((valid) => {
        if (valid) {
          ElMessageBox.confirm('确定要提交审批吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            approvalLoading.value = true
            // 模拟审批提交
            setTimeout(() => {
              ElMessage.success('审批提交成功')
              approvalLoading.value = false
              // 添加审批历史
              approvalHistory.value.push({
                approver: '当前用户',
                result: approvalForm.result,
                comment: approvalForm.comment,
                approveTime: new Date().toISOString()
              })
              // 更新状态
              payableDetail.value.status = approvalForm.result
            }, 1000)
          }).catch(() => {})
        }
      })
    }

    // 返回上一页
    const goBack = () => {
      router.back()
    }

    return {
      payableDetail,
      approvalForm,
      approvalHistory,
      approvalFormRef,
      approvalRules,
      approvalLoading,
      formatDate,
      formatCurrency,
      getPaymentTermsText,
      getStatusText,
      getResultType,
      getResultText,
      submitApproval,
      goBack
    }
  }
}
</script>

<style scoped>
.payable-approve {
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

.card-header {
  font-weight: bold;
  color: #303133;
}

.detail-card,
.approval-card,
.history-card {
  margin-bottom: 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
</style>