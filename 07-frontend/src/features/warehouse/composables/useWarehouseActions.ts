/**
 * 仓库管理操作Composable
 * 负责创建、更新、删除等操作逻辑
 */
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { warehouseApi } from '@/api/warehouse'

// 真实API接口
const api = warehouseApi

// 编号生成器
const codeGenerator = {
  generateWarehouseCode() {
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `WH${dateStr}${random}`
  }
}

export function useWarehouseActions(refreshCallback) {
  // ========== 响应式数据 ==========
  const processing = ref(false)
  const dialogVisible = ref(false)
  const detailVisible = ref(false)
  const isEdit = ref(false)
  
  const formData = ref({
    code: '',
    name: '',
    type: 'raw_material',
    status: 'enabled',
    capacity: 0,
    locations: 0,
    region: '',
    manager: '',
    contactPhone: '',
    address: '',
    description: ''
  })
  
  const selectedWarehouse = ref({})
  
  // ========== 表单验证规则 ==========
  const formRules = {
    code: [
      { required: true, message: '请输入仓库编码', trigger: 'blur' },
      { min: 3, max: 20, message: '编码长度在 3 到 20 个字符', trigger: 'blur' }
    ],
    name: [
      { required: true, message: '请输入仓库名称', trigger: 'blur' },
      { min: 2, max: 50, message: '名称长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    type: [
      { required: true, message: '请选择仓库类型', trigger: 'change' }
    ],
    capacity: [
      { required: true, message: '请输入仓库容量', trigger: 'blur' },
      { type: 'number', min: 0, message: '容量必须大于等于0', trigger: 'blur' }
    ],
    locations: [
      { required: true, message: '请输入储位数量', trigger: 'blur' },
      { type: 'number', min: 0, message: '储位数量必须大于等于0', trigger: 'blur' }
    ],
    region: [
      { required: true, message: '请选择所属区域', trigger: 'change' }
    ],
    manager: [
      { required: true, message: '请输入负责人', trigger: 'blur' }
    ],
    contactPhone: [
      { required: true, message: '请输入联系电话', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
    ],
    address: [
      { required: true, message: '请输入详细地址', trigger: 'blur' },
      { min: 5, message: '地址长度不能少于5个字符', trigger: 'blur' }
    ]
  }
  
  // ========== CRUD 操作方法 ==========
  
  // 创建仓库
  const create = async (data) => {
    processing.value = true
    try {
      const response = await api.createWarehouse(data)
      if (response.success) {
        ElMessage.success('仓库创建成功')
        if (refreshCallback) {
          refreshCallback()
        }
        return true
      }
      return false
    } catch (error) {
      console.error('❌ 创建仓库失败:', error)
      ElMessage.error('创建失败，请重试')
      return false
    } finally {
      processing.value = false
    }
  }
  
  // 更新仓库
  const update = async (id, data) => {
    processing.value = true
    try {
      const response = await api.updateWarehouse(id, data)
      if (response.success) {
        ElMessage.success('仓库更新成功')
        if (refreshCallback) {
          refreshCallback()
        }
        return true
      }
      return false
    } catch (error) {
      console.error('❌ 更新仓库失败:', error)
      ElMessage.error('更新失败，请重试')
      return false
    } finally {
      processing.value = false
    }
  }
  
  // 删除单个仓库
  const deleteOne = async (row) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除仓库「${row.name}」吗？此操作不可恢复。`,
        '删除确认',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      processing.value = true
      const response = await api.deleteWarehouse(row.id)
      if (response.success) {
        ElMessage.success('删除成功')
        if (refreshCallback) {
          refreshCallback()
        }
        return true
      }
      return false
    } catch (error) {
      if (error === 'cancel') {
        return false
      }
      console.error('❌ 删除仓库失败:', error)
      ElMessage.error('删除失败，请重试')
      return false
    } finally {
      processing.value = false
    }
  }
  
  // 批量删除仓库
  const batchDelete = async (rows) => {
    try {
      const names = rows.map(row => row.name).join('、')
      await ElMessageBox.confirm(
        `确定要删除以下 ${rows.length} 个仓库吗？<br><br>${names}<br><br>此操作不可恢复。`,
        '批量删除确认',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
          dangerouslyUseHTMLString: true
        }
      )
      
      processing.value = true
      const ids = rows.map(row => row.id)
      const response = await api.batchDeleteWarehouses(ids)
      if (response.success) {
        ElMessage.success(`成功删除 ${response.deleted} 个仓库`)
        if (refreshCallback) {
          refreshCallback()
        }
        return true
      }
      return false
    } catch (error) {
      if (error === 'cancel') {
        return false
      }
      console.error('❌ 批量删除仓库失败:', error)
      ElMessage.error('批量删除失败，请重试')
      return false
    } finally {
      processing.value = false
    }
  }
  
  // ========== UI 操作方法 ==========
  
  // 打开新增对话框
  const handleAdd = () => {
    isEdit.value = false
    formData.value = {
      code: codeGenerator.generateWarehouseCode(),
      name: '',
      type: 'raw_material',
      status: 'enabled',
      capacity: 0,
      locations: 0,
      region: '',
      manager: '',
      contactPhone: '',
      address: '',
      description: ''
    }
    dialogVisible.value = true
  }
  
  // 打开编辑对话框
  const handleEdit = (row) => {
    isEdit.value = true
    formData.value = { ...row }
    dialogVisible.value = true
  }
  
  // 打开详情对话框
  const handleView = async (row) => {
    try {
      const response = await api.getWarehouseDetail(row.id)
      if (response.success) {
        selectedWarehouse.value = response.data
        detailVisible.value = true
      }
    } catch (error) {
      console.error('❌ 获取仓库详情失败:', error)
      ElMessage.error('获取详情失败')
    }
  }
  
  // 保存表单
  const handleSave = async (formRef) => {
    try {
      // 表单验证
      if (formRef) {
        await formRef.validate()
      }
      
      const success = isEdit.value
        ? await update(formData.value.id, formData.value)
        : await create(formData.value)
      
      if (success) {
        dialogVisible.value = false
      }
    } catch (error) {
      // 表单验证失败或其他错误
      if (error !== false) {
        ElMessage.error('操作失败，请重试')
      }
    }
  }
  
  // 状态切换
  const handleStatusChange = async (row) => {
    try {
      const statusText = row.status === 'enabled' ? '禁用' : '启用'
      await ElMessageBox.confirm(
        `确定要${statusText}仓库「${row.name}」吗？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: row.status === 'enabled' ? 'warning' : 'info'
        }
      )
      
      const newStatus = row.status === 'enabled' ? 'disabled' : 'enabled'
      const response = await api.updateWarehouse(row.id, { 
        ...row, 
        status: newStatus
      })
      
      if (response.success) {
        ElMessage.success(`仓库${statusText}成功`)
        if (refreshCallback) {
          refreshCallback()
        }
      }
    } catch (error) {
      if (error === 'cancel') {
        return
      }
      console.error('❌ 状态切换失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  }
  
  // 关闭对话框
  const handleCloseDialog = (formRef) => {
    dialogVisible.value = false
    // 重置表单验证
    if (formRef) {
      formRef.resetFields()
    }
  }
  
  const handleCloseDetail = () => {
    detailVisible.value = false
  }
  
  return {
    // 响应式数据
    processing,
    dialogVisible,
    detailVisible,
    isEdit,
    formData,
    selectedWarehouse,
    formRules,
    
    // CRUD 操作
    create,
    update,
    deleteOne,
    batchDelete,
    
    // UI 操作
    handleAdd,
    handleEdit,
    handleView,
    handleSave,
    handleStatusChange,
    handleCloseDialog,
    handleCloseDetail
  }
}