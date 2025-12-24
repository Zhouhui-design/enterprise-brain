import { ref, reactive } from 'vue'

// 销售订单创建组合式函数
export const useSalesOrderCreate = () => {
  // 表单数据
  const formData = reactive({
    orderNo: '',
    customerId: '',
    customerName: '',
    orderDate: '',
    deliveryDate: '',
    status: 'draft',
    priority: 'medium',
    remark: '',
    items: []
  })
  
  // 表单验证规则
  const rules = {
    orderNo: [
      { required: true, message: '请输入订单编号', trigger: 'blur' }
    ],
    customerId: [
      { required: true, message: '请选择客户', trigger: 'blur' }
    ],
    orderDate: [
      { required: true, message: '请选择订单日期', trigger: 'change' }
    ],
    deliveryDate: [
      { required: true, message: '请选择交货日期', trigger: 'change' }
    ]
  }
  
  // 保存订单
  const saveOrder = async () => {
    try {
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 800))
      
      return true
    } catch (error) {
      console.error('保存订单失败:', error)
      return false
    }
  }
  
  return {
    formData,
    rules,
    saveOrder
  }
}
