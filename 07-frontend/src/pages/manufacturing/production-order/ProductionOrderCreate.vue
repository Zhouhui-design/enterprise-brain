<template>
  <div class="production-order-create">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
<<<<<<< HEAD
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
=======
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
>>>>>>> origin/develop
      </el-form>
    </el-card>

    <!-- BOM选择器对话框 -->
<<<<<<< HEAD
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
=======
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
>>>>>>> origin/develop
  productId: '',
  productCode: '',
  productName: '',
  quantity: 1,
  unit: '',
<<<<<<< HEAD
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

=======
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
>>>>>>> origin/develop
</style>