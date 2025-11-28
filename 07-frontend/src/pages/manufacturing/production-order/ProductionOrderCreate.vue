<template>
  <div class="production-order-create">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="handleBack" type="text">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1>{{ isEdit ? '编辑生产订单' : '新建生产订单' }}</h1>
      </div>
    </div>

    <!-- 表单卡片 -->
    <el-card class="form-card">
      <el-form
        ref="orderFormRef"
        :model="orderForm"
        :rules="orderRules"
        label-width="120px"
        class="create-form"
      >
        <el-divider content-position="left">基本信息</el-divider>
        
        <el-form-item label="订单编号" prop="orderCode">
          <el-input v-model="orderForm.orderCode" :disabled="isEdit" placeholder="系统自动生成" />
        </el-form-item>

        <el-form-item label="产品信息" prop="productId">
          <el-select
            v-model="orderForm.productId"
            placeholder="请选择产品"
            filterable
            :loading="productLoading"
            @change="handleProductChange"
          >
            <el-option
              v-for="product in productList"
              :key="product.id"
              :label="`${product.name} (${product.code})`"
              :value="product.id"
            >
              <div class="product-option">
                <span>{{ product.name }}</span>
                <small>{{ product.code }}</small>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="订单数量" prop="quantity">
          <el-input-number
            v-model="orderForm.quantity"
            :min="1"
            :precision="0"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="计量单位" prop="unit">
          <el-input v-model="orderForm.unit" placeholder="请输入计量单位" />
        </el-form-item>

        <el-form-item label="订单优先级" prop="priority">
          <el-radio-group v-model="orderForm.priority">
            <el-radio :label="1">低</el-radio>
            <el-radio :label="2">中</el-radio>
            <el-radio :label="3">高</el-radio>
            <el-radio :label="4">紧急</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-divider content-position="left">时间信息</el-divider>

        <el-form-item label="计划开始日期" prop="plannedStartDate">
          <el-date-picker
            v-model="orderForm.plannedStartDate"
            type="datetime"
            placeholder="请选择计划开始日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="计划完成日期" prop="plannedEndDate">
          <el-date-picker
            v-model="orderForm.plannedEndDate"
            type="datetime"
            placeholder="请选择计划完成日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="客户需求日期" prop="customerDemandDate">
          <el-date-picker
            v-model="orderForm.customerDemandDate"
            type="date"
            placeholder="请选择客户需求日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-divider content-position="left">BOM信息</el-divider>

        <el-form-item label="选择BOM" prop="bomId">
          <el-select
            v-model="orderForm.bomId"
            placeholder="请选择BOM版本"
            @change="handleBomChange"
          >
            <el-option
              v-for="bom in bomList"
              :key="bom.id"
              :label="`${bom.version} (${bom.createTime})`"
              :value="bom.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="openBomSelector">选择BOM组件</el-button>
        </el-form-item>

        <!-- BOM明细预览 -->
        <el-form-item v-if="selectedBomItems.length > 0">
          <div class="bom-preview">
            <h3>BOM明细预览</h3>
            <el-table :data="selectedBomItems" stripe size="small">
              <el-table-column prop="materialCode" label="物料编码" width="150" />
              <el-table-column prop="materialName" label="物料名称" width="200" />
              <el-table-column prop="spec" label="规格型号" width="150" />
              <el-table-column prop="quantity" label="用量" width="100" align="right" />
              <el-table-column prop="unit" label="单位" width="80" />
              <el-table-column prop="type" label="类型" width="100" />
            </el-table>
          </div>
        </el-form-item>

        <el-divider content-position="left">备注信息</el-divider>

        <el-form-item label="订单备注" prop="remark">
          <el-input
            v-model="orderForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入订单备注信息"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">提交</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="handleBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- BOM选择器对话框 -->
      <el-dialog
        v-model="bomSelectorVisible"
        title="选择BOM"
        width="80%"
        height="80vh"
        @close="handleBomSelectorClose"
      >
        <BOMSelector
          ref="bomSelectorRef"
          v-model:visible="bomSelectorVisible"
          :multiple="false"
          @confirm="confirmBomSelection"
        />
      </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import type { ElMessage } from 'element-plus'
import BOMSelector from './components/BOMSelector.vue'

// 订单表单类型定义
interface OrderForm {
  orderCode: string
  productId: string
  productCode: string
  productName: string
  quantity: number
  unit: string
  priority: number
  plannedStartDate: string
  plannedEndDate: string
  customerDemandDate: string
  bomId: string
  remark: string
}

// 产品类型定义
interface Product {
  id: string
  code: string
  name: string
  unit: string
}

// BOM类型定义
interface Bom {
  id: string
  version: string
  createTime: string
}

// BOM项目类型定义
interface BomItem {
  id: string
  materialCode: string
  materialName: string
  spec: string
  quantity: number
  adjustedQuantity?: number
  unit: string
  type: string
}

// Props和响应式数据
const orderFormRef = ref<FormInstance>()
const isEdit = computed(() => {
  const searchParams = new URLSearchParams(window.location.search)
  return searchParams.has('id')
})

const productLoading = ref(false)
const productList = ref<Product[]>([])
const bomList = ref<Bom[]>([])
const bomItemsList = ref<BomItem[]>([])
const selectedBomItems = ref<BomItem[]>([])
const bomSelectorVisible = ref(false)
const selectedBOM = ref<any>(null)
const bomSelectorRef = ref()

// 订单表单数据
const orderForm = reactive<OrderForm>({
  orderCode: isEdit.value ? '' : generateOrderCode(),
  productId: '',
  productCode: '',
  productName: '',
  quantity: 1,
  unit: '',
  priority: 2,
  plannedStartDate: '',
  plannedEndDate: '',
  customerDemandDate: '',
  bomId: '',
  remark: ''
})

// 表单验证规则
const orderRules = {
  productId: [{ required: true, message: '请选择产品', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入订单数量', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入计量单位', trigger: 'blur' }],
  plannedStartDate: [{ required: true, message: '请选择计划开始日期', trigger: 'change' }],
  plannedEndDate: [{ required: true, message: '请选择计划完成日期', trigger: 'change' }]
}

// 生成订单编号
function generateOrderCode(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  return `PO${year}${month}${day}${random}`
}

// 获取产品列表
const getProductList = async () => {
  productLoading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    productList.value = [
      { id: '1', code: 'PROD001', name: '智能控制器', unit: '台' },
      { id: '2', code: 'PROD002', name: '传感器模组', unit: '套' },
      { id: '3', code: 'PROD003', name: '电源模块', unit: '个' },
      { id: '4', code: 'PROD004', name: '控制面板', unit: '件' },
      { id: '5', code: 'PROD005', name: '连接线束', unit: '条' }
    ]
  } catch (error) {
    console.error('获取产品列表失败:', error)
  } finally {
    productLoading.value = false
  }
}

// 获取BOM列表
const getBomList = async (productId: string) => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 模拟数据
    bomList.value = [
      { id: '1', version: 'V1.0', createTime: '2023-12-01' },
      { id: '2', version: 'V1.1', createTime: '2023-12-15' },
      { id: '3', version: 'V2.0', createTime: '2024-01-05' }
    ]
  } catch (error) {
    console.error('获取BOM列表失败:', error)
  }
}

// 获取BOM项目列表
const getBomItemsList = async (bomId: string) => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 模拟数据
    bomItemsList.value = [
      { id: '1', materialCode: 'MAT001', materialName: 'PCB板', spec: 'FR4', quantity: 1, unit: '块', type: '自制' },
      { id: '2', materialCode: 'MAT002', materialName: '电阻', spec: '10KΩ', quantity: 4, unit: '个', type: '外购' },
      { id: '3', materialCode: 'MAT003', materialName: '电容', spec: '10uF', quantity: 2, unit: '个', type: '外购' },
      { id: '4', materialCode: 'MAT004', materialName: '芯片', spec: 'STM32', quantity: 1, unit: '个', type: '外购' },
      { id: '5', materialCode: 'MAT005', materialName: '外壳', spec: 'ABS', quantity: 1, unit: '套', type: '自制' }
    ].map(item => ({
      ...item,
      adjustedQuantity: item.quantity
    }))
  } catch (error) {
    console.error('获取BOM项目列表失败:', error)
  }
}

// 处理产品选择变化
const handleProductChange = (productId: string) => {
  const selectedProduct = productList.value.find(p => p.id === productId)
  if (selectedProduct) {
    orderForm.productCode = selectedProduct.code
    orderForm.productName = selectedProduct.name
    orderForm.unit = selectedProduct.unit
    getBomList(productId)
  }
}

// 处理BOM选择变化
const handleBomChange = (bomId: string) => {
  if (bomId) {
    getBomItemsList(bomId)
  }
}

// 打开BOM选择器
const openBomSelector = () => {
  bomSelectorVisible.value = true
}

// 处理BOM项目选择变化
const handleBomItemsSelectionChange = (selection: BomItem[]) => {
  // 这里可以处理选择逻辑
}

// 确认BOM选择
const confirmBomSelection = (bomList: any[]) => {
  if (bomList && bomList.length > 0) {
    const selectedBom = bomList[0]
    
    // 更新订单表单中的BOM信息
    orderForm.bomId = selectedBom.id
    
    // 转换BOM组件为我们需要的格式
    selectedBomItems.value = (selectedBom.components || []).map((comp: any) => ({
      id: comp.materialCode,
      materialCode: comp.materialCode,
      materialName: comp.materialName,
      spec: comp.specification,
      quantity: comp.usageQuantity,
      unit: comp.unit,
      type: comp.description ? '外购' : '自制' // 简单判断，实际可能需要根据数据调整
    }))
  }
  bomSelectorVisible.value = false
}

// 处理BOM选择器关闭
const handleBomSelectorClose = () => {
  bomSelectorVisible.value = false
}



// 处理表单提交
const handleSubmit = async () => {
  if (!orderFormRef.value) return
  
  try {
    await orderFormRef.value.validate()
    
    // 模拟提交数据
    await new Promise(resolve => setTimeout(resolve, 500))
    
    ElMessage.success(isEdit.value ? '订单编辑成功' : '订单创建成功')
    handleBack()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 处理重置
const handleReset = () => {
  if (orderFormRef.value) {
    orderFormRef.value.resetFields()
    if (!isEdit.value) {
      orderForm.orderCode = generateOrderCode()
    }
  }
  selectedBomItems.value = []
}

// 处理返回
const handleBack = () => {
  window.location.href = '/#/manufacturing/production-order/list'
}

// 加载编辑数据
const loadEditData = async () => {
  if (!isEdit.value) return
  
  const searchParams = new URLSearchParams(window.location.search)
  const id = searchParams.get('id')
  
  try {
    // 模拟获取编辑数据
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟编辑数据
    const editData = {
      orderCode: 'PO2024001',
      productId: '1',
      productCode: 'PROD001',
      productName: '智能控制器',
      quantity: 1000,
      unit: '台',
      priority: 3,
      plannedStartDate: '2024-01-01 08:00:00',
      plannedEndDate: '2024-01-15 18:00:00',
      customerDemandDate: '2024-01-16',
      bomId: '2',
      remark: '客户紧急订单'
    }
    
    Object.assign(orderForm, editData)
    
    // 获取对应的BOM列表和项目
    await getBomList(orderForm.productId)
    await getBomItemsList(orderForm.bomId)
    
    // 加载已选BOM项目
    selectedBomItems.value = [
      { id: '1', materialCode: 'MAT001', materialName: 'PCB板', spec: 'FR4', quantity: 1, unit: '块', type: '自制' },
      { id: '2', materialCode: 'MAT002', materialName: '电阻', spec: '10KΩ', quantity: 4, unit: '个', type: '外购' },
      { id: '3', materialCode: 'MAT003', materialName: '电容', spec: '10uF', quantity: 2, unit: '个', type: '外购' },
      { id: '4', materialCode: 'MAT004', materialName: '芯片', spec: 'STM32', quantity: 1, unit: '个', type: '外购' },
      { id: '5', materialCode: 'MAT005', materialName: '外壳', spec: 'ABS', quantity: 1, unit: '套', type: '自制' }
    ]
  } catch (error) {
    console.error('加载编辑数据失败:', error)
  }
}

// 组件挂载
onMounted(async () => {
  await getProductList()
  if (isEdit.value) {
    await loadEditData()
  }
})
</script>

<style scoped>
.production-order-create {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.form-card {
  margin-bottom: 20px;
}

.create-form {
  max-width: 800px;
}

.product-option {
  display: flex;
  flex-direction: column;
}

.product-option small {
  color: #909399;
  font-size: 12px;
}

.bom-preview {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px;
}

.bom-preview h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;

</style>