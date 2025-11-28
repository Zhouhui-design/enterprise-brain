<template>
  <div class="production-order-create">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>新建生产订单</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>生产管理</el-breadcrumb-item>
          <el-breadcrumb-item>生产订单</el-breadcrumb-item>
          <el-breadcrumb-item>新建生产订单</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-right">
        <el-button @click="handleBack" :icon="ArrowLeft">
          返回列表
        </el-button>
      </div>
    </div>

    <!-- 表单内容 -->
    <el-card class="form-card" shadow="never">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="140px"
        size="default"
      >
        <!-- 基本信息 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon><InfoFilled /></el-icon>
            <span>基本信息</span>
          </div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="生产订单号" prop="orderNumber">
                <el-input
                  v-model="formData.orderNumber"
                  placeholder="请输入生产订单号"
                  clearable
                >
                  <template #append>
                    <el-button @click="generateOrderNumber">自动生成</el-button>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="订单类型" prop="orderType">
                <el-select
                  v-model="formData.orderType"
                  placeholder="请选择订单类型"
                  style="width: 100%"
                >
                  <el-option label="正常生产" value="normal" />
                  <el-option label="紧急生产" value="urgent" />
                  <el-option label="试生产" value="trial" />
                  <el-option label="返工生产" value="rework" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="优先级" prop="priority">
                <el-select
                  v-model="formData.priority"
                  placeholder="请选择优先级"
                  style="width: 100%"
                >
                  <el-option label="紧急" value="urgent" />
                  <el-option label="高" value="high" />
                  <el-option label="中" value="medium" />
                  <el-option label="低" value="low" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="销售订单号" prop="salesOrderNumber">
                <el-input
                  v-model="formData.salesOrderNumber"
                  placeholder="请输入关联的销售订单号"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 产品信息 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon><Box /></el-icon>
            <span>产品信息</span>
          </div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="产品选择" prop="productId">
                <el-select
                  v-model="formData.productId"
                  placeholder="请选择产品"
                  style="width: 100%"
                  filterable
                  remote
                  :remote-method="searchProducts"
                  :loading="productSearchLoading"
                  @change="handleProductChange"
                >
                  <el-option
                    v-for="product in productOptions"
                    :key="product.id"
                    :label="product.name"
                    :value="product.id"
                  >
                    <div class="product-option">
                      <span>{{ product.name }}</span>
                      <span class="product-code">({{ product.code }})</span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="产品编码" prop="productCode">
                <el-input
                  v-model="formData.productCode"
                  placeholder="产品编码"
                  readonly
                  disabled
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item label="生产数量" prop="quantity">
                <el-input-number
                  v-model="formData.quantity"
                  :min="1"
                  :step="1"
                  style="width: 100%"
                  placeholder="请输入生产数量"
                  @change="calculateMaterials"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="单位" prop="unit">
                <el-input
                  v-model="formData.unit"
                  placeholder="单位"
                  readonly
                  disabled
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="单位工时" prop="unitHours">
                <el-input-number
                  v-model="formData.unitHours"
                  :min="0"
                  :step="0.1"
                  style="width: 100%"
                  placeholder="单位工时"
                  readonly
                  disabled
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="24">
              <el-form-item label="产品规格">
                <el-input
                  v-model="formData.productSpecs"
                  type="textarea"
                  :rows="2"
                  placeholder="产品规格说明"
                  readonly
                  disabled
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- BOM信息 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon><Document /></el-icon>
            <span>BOM信息</span>
            <el-button type="text" @click="openBOMSelector" :icon="Search">
              选择BOM
            </el-button>
          </div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="BOM版本" prop="bomVersion">
                <el-select
                  v-model="formData.bomVersion"
                  placeholder="请选择BOM版本"
                  style="width: 100%"
                  @change="handleBOMChange"
                >
                  <el-option
                    v-for="bom in bomOptions"
                    :key="bom.id"
                    :label="bom.version"
                    :value="bom.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="BOM状态">
                <el-tag :type="getBOMStatusTagType(formData.bomStatus)">
                  {{ getBOMStatusLabel(formData.bomStatus) }}
                </el-tag>
              </el-form-item>
            </el-col>
          </el-row>
          
          <!-- BOM物料清单 -->
          <div v-if="bomMaterials.length > 0" class="bom-materials">
            <el-table :data="bomMaterials" border style="width: 100%">
              <el-table-column type="index" width="60" label="序号" />
              <el-table-column prop="materialCode" label="物料编码" width="120" />
              <el-table-column prop="materialName" label="物料名称" min-width="150" />
              <el-table-column prop="specification" label="规格型号" width="120" />
              <el-table-column prop="unit" label="单位" width="80" />
              <el-table-column prop="quantity" label="单耗" width="100" />
              <el-table-column label="总需求数量" width="120">
                <template #default="{ row }">
                  {{ (row.quantity * formData.quantity).toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column prop="stock" label="库存数量" width="120" />
              <el-table-column label="库存状态" width="100">
                <template #default="{ row }">
                  <el-tag
                    :type="getStockStatusType(row.stock, row.quantity * formData.quantity)"
                    size="small"
                  >
                    {{ getStockStatus(row.stock, row.quantity * formData.quantity) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 生产计划 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon><Calendar /></el-icon>
            <span>生产计划</span>
          </div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="计划开始日期" prop="planStartDate">
                <el-date-picker
                  v-model="formData.planStartDate"
                  type="datetime"
                  placeholder="选择计划开始日期"
                  format="YYYY-MM-DD HH:mm"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="计划完成日期" prop="planEndDate">
                <el-date-picker
                  v-model="formData.planEndDate"
                  type="datetime"
                  placeholder="选择计划完成日期"
                  format="YYYY-MM-DD HH:mm"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="工作中心" prop="workCenterId">
                <el-select
                  v-model="formData.workCenterId"
                  placeholder="请选择工作中心"
                  style="width: 100%"
                  filterable
                >
                  <el-option
                    v-for="center in workCenterOptions"
                    :key="center.id"
                    :label="center.name"
                    :value="center.id"
                  >
                    <div class="work-center-option">
                      <span>{{ center.name }}</span>
                      <span class="center-code">({{ center.code }})</span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="生产线" prop="productionLine">
                <el-select
                  v-model="formData.productionLine"
                  placeholder="请选择生产线"
                  style="width: 100%"
                >
                  <el-option
                    v-for="line in productionLineOptions"
                    :key="line.id"
                    :label="line.name"
                    :value="line.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 工艺信息 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon><Setting /></el-icon>
            <span>工艺信息</span>
          </div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="工艺路线" prop="processRoute">
                <el-select
                  v-model="formData.processRoute"
                  placeholder="请选择工艺路线"
                  style="width: 100%"
                >
                  <el-option
                    v-for="route in processRouteOptions"
                    :key="route.id"
                    :label="route.name"
                    :value="route.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="标准工时" prop="standardHours">
                <el-input-number
                  v-model="formData.standardHours"
                  :min="0"
                  :step="0.1"
                  style="width: 100%"
                  placeholder="标准工时"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="24">
              <el-form-item label="工艺说明">
                <el-input
                  v-model="formData.processDescription"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入工艺说明"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 质量要求 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon><Star /></el-icon>
            <span>质量要求</span>
          </div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="质量标准" prop="qualityStandard">
                <el-select
                  v-model="formData.qualityStandard"
                  placeholder="请选择质量标准"
                  style="width: 100%"
                >
                  <el-option label="国标" value="national" />
                  <el-option label="行标" value="industry" />
                  <el-option label="企标" value="enterprise" />
                  <el-option label="客户标准" value="customer" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="检验要求" prop="inspectionRequirement">
                <el-select
                  v-model="formData.inspectionRequirement"
                  placeholder="请选择检验要求"
                  style="width: 100%"
                >
                  <el-option label="全检" value="full" />
                  <el-option label="抽检" value="sample" />
                  <el-option label="免检" value="exempt" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="24">
              <el-form-item label="质量要求说明">
                <el-input
                  v-model="formData.qualityDescription"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入质量要求说明"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 备注信息 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon><ChatDotRound /></el-icon>
            <span>备注信息</span>
          </div>
          <el-row :gutter="24">
            <el-col :span="24">
              <el-form-item label="备注" prop="remarks">
                <el-input
                  v-model="formData.remarks"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入备注信息"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <el-button size="large" @click="handleBack">取消</el-button>
          <el-button size="large" @click="handleSaveDraft" :loading="saving">
            保存草稿
          </el-button>
          <el-button type="primary" size="large" @click="handleSubmit" :loading="submitting">
            提交审核
          </el-button>
        </div>
      </el-form>
    </el-card>

    <!-- BOM选择器对话框 -->
    <BOMSelector
      v-model="bomSelectorVisible"
      :product-id="formData.productId"
      @select="handleBOMSelect"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  ArrowLeft, InfoFilled, Box, Document, Calendar, Setting, Star, ChatDotRound, Search
} from '@element-plus/icons-vue'
import BOMSelector from './components/BOMSelector.vue'

const router = useRouter()
const formRef = ref()
const bomSelectorVisible = ref(false)
const saving = ref(false)
const submitting = ref(false)
const productSearchLoading = ref(false)

// 表单数据
const formData = reactive({
  // 基本信息
  orderNumber: '',
  orderType: 'normal',
  priority: 'medium',
  salesOrderNumber: '',
  
  // 产品信息
  productId: '',
  productCode: '',
  productName: '',
  quantity: 1,
  unit: '',
  unitHours: 0,
  productSpecs: '',
  
  // BOM信息
  bomVersion: '',
  bomStatus: '',
  
  // 生产计划
  planStartDate: '',
  planEndDate: '',
  workCenterId: '',
  productionLine: '',
  
  // 工艺信息
  processRoute: '',
  standardHours: 0,
  processDescription: '',
  
  // 质量要求
  qualityStandard: '',
  inspectionRequirement: '',
  qualityDescription: '',
  
  // 备注信息
  remarks: '',
  
  status: 'draft'
})

// 选项数据
const productOptions = ref([])
const bomOptions = ref([])
const workCenterOptions = ref([])
const productionLineOptions = ref([])
const processRouteOptions = ref([])
const bomMaterials = ref([])

// 表单验证规则
const formRules = {
  orderNumber: [
    { required: true, message: '请输入生产订单号', trigger: 'blur' }
  ],
  orderType: [
    { required: true, message: '请选择订单类型', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  productId: [
    { required: true, message: '请选择产品', trigger: 'change' }
  ],
  quantity: [
    { required: true, message: '请输入生产数量', trigger: 'blur' }
  ],
  planStartDate: [
    { required: true, message: '请选择计划开始日期', trigger: 'change' }
  ],
  planEndDate: [
    { required: true, message: '请选择计划完成日期', trigger: 'change' }
  ],
  workCenterId: [
    { required: true, message: '请选择工作中心', trigger: 'change' }
  ]
}

// 方法
const generateOrderNumber = () => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  formData.orderNumber = `PO${timestamp.toString().slice(-8)}${random.toString().padStart(3, '0')}`
}

const searchProducts = async (query) => {
  if (query !== '') {
    productSearchLoading.value = true
    try {
      // 这里调用API搜索产品
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟数据
      productOptions.value = [
        { id: 1, name: '产品A', code: 'P001' },
        { id: 2, name: '产品B', code: 'P002' },
        { id: 3, name: '产品C', code: 'P003' }
      ].filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.code.toLowerCase().includes(query.toLowerCase())
      )
    } catch (error) {
      ElMessage.error('搜索产品失败')
    } finally {
      productSearchLoading.value = false
    }
  } else {
    productOptions.value = []
  }
}

const handleProductChange = (productId) => {
  const product = productOptions.value.find(p => p.id === productId)
  if (product) {
    formData.productCode = product.code
    formData.productName = product.name
    loadProductDetails(productId)
  }
}

const loadProductDetails = async (productId) => {
  try {
    // 这里调用API获取产品详情
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    formData.unit = '件'
    formData.unitHours = 2.5
    formData.productSpecs = '规格说明示例'
    
    // 加载BOM选项
    loadBOMOptions(productId)
  } catch (error) {
    ElMessage.error('获取产品详情失败')
  }
}

const loadBOMOptions = async (productId) => {
  try {
    // 这里调用API获取BOM选项
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    bomOptions.value = [
      { id: 1, version: 'V1.0', status: 'active' },
      { id: 2, version: 'V2.0', status: 'active' }
    ]
  } catch (error) {
    ElMessage.error('获取BOM选项失败')
  }
}

const handleBOMChange = (bomId) => {
  const bom = bomOptions.value.find(b => b.id === bomId)
  if (bom) {
    formData.bomStatus = bom.status
    loadBOMMaterials(bomId)
  }
}

const loadBOMMaterials = async (bomId) => {
  try {
    // 这里调用API获取BOM物料清单
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    bomMaterials.value = [
      { materialCode: 'M001', materialName: '物料A', specification: '规格A', unit: '个', quantity: 2, stock: 500 },
      { materialCode: 'M002', materialName: '物料B', specification: '规格B', unit: 'kg', quantity: 1.5, stock: 200 },
      { materialCode: 'M003', materialName: '物料C', specification: '规格C', unit: '套', quantity: 1, stock: 50 }
    ]
  } catch (error) {
    ElMessage.error('获取BOM物料清单失败')
  }
}

const openBOMSelector = () => {
  if (!formData.productId) {
    ElMessage.warning('请先选择产品')
    return
  }
  bomSelectorVisible.value = true
}

const handleBOMSelect = (bom) => {
  formData.bomVersion = bom.id
  formData.bomStatus = bom.status
  loadBOMMaterials(bom.id)
}

const calculateMaterials = () => {
  // 重新计算物料需求
  if (bomMaterials.value.length > 0) {
    // 这里可以添加计算逻辑
  }
}

const handleBack = () => {
  router.push('/manufacturing/production-order/list')
}

const handleSaveDraft = async () => {
  saving.value = true
  try {
    // 这里调用保存草稿API
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('草稿保存成功')
    router.push('/manufacturing/production-order/list')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    submitting.value = true
    // 这里调用提交API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('提交成功，等待审核')
    router.push('/manufacturing/production-order/list')
  } catch (error) {
    if (error !== false) {
      ElMessage.error('提交失败')
    }
  } finally {
    submitting.value = false
  }
}

// 工具方法
const getBOMStatusTagType = (status) => {
  const map = {
    active: 'success',
    inactive: 'danger',
    draft: 'warning'
  }
  return map[status] || 'info'
}

const getBOMStatusLabel = (status) => {
  const map = {
    active: '已激活',
    inactive: '未激活',
    draft: '草稿'
  }
  return map[status] || status
}

const getStockStatusType = (stock, required) => {
  if (stock >= required) return 'success'
  if (stock > 0) return 'warning'
  return 'danger'
}

const getStockStatus = (stock, required) => {
  if (stock >= required) return '充足'
  if (stock > 0) return '不足'
  return '缺料'
}

const loadWorkCenters = async () => {
  try {
    // 这里调用API获取工作中心列表
    await new Promise(resolve => setTimeout(resolve, 500))
    
    workCenterOptions.value = [
      { id: 1, name: '装配车间', code: 'WC001' },
      { id: 2, name: '机加工车间', code: 'WC002' },
      { id: 3, name: '焊接车间', code: 'WC003' }
    ]
  } catch (error) {
    ElMessage.error('获取工作中心列表失败')
  }
}

const loadProductionLines = async () => {
  try {
    // 这里调用API获取生产线列表
    await new Promise(resolve => setTimeout(resolve, 500))
    
    productionLineOptions.value = [
      { id: 1, name: '生产线A' },
      { id: 2, name: '生产线B' },
      { id: 3, name: '生产线C' }
    ]
  } catch (error) {
    ElMessage.error('获取生产线列表失败')
  }
}

const loadProcessRoutes = async () => {
  try {
    // 这里调用API获取工艺路线列表
    await new Promise(resolve => setTimeout(resolve, 500))
    
    processRouteOptions.value = [
      { id: 1, name: '标准工艺路线' },
      { id: 2, name: '快速工艺路线' },
      { id: 3, name: '精密工艺路线' }
    ]
  } catch (error) {
    ElMessage.error('获取工艺路线列表失败')
  }
}

onMounted(() => {
  generateOrderNumber()
  loadWorkCenters()
  loadProductionLines()
  loadProcessRoutes()
})
</script>

<style scoped lang="scss">
.production-order-create {
  padding: 20px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .header-left {
      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        color: #303133;
      }
    }
  }
  
  .form-card {
    .form-section {
      margin-bottom: 32px;
      
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #e4e7ed;
        font-size: 16px;
        font-weight: bold;
        color: #303133;
        
        .el-icon {
          color: #409eff;
        }
      }
      
      .bom-materials {
        margin-top: 20px;
      }
    }
    
    .form-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e4e7ed;
    }
  }
  
  .product-option {
    .product-code {
      color: #909399;
      font-size: 12px;
      margin-left: 8px;
    }
  }
  
  .work-center-option {
    .center-code {
      color: #909399;
      font-size: 12px;
      margin-left: 8px;
    }
  }
}
</style>