<template>
  <div class="material-edit">
    <el-tabs v-model="activeTab" type="card">
      <!-- 基础属性 -->
      <el-tab-pane label="基础属性" name="basic">
        <el-form :model="formData" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="物料编码">
                <el-input v-model="formData.materialCode" placeholder="自动生成" disabled />
              </el-form-item>
              <el-form-item label="BOM编号">
                <el-input v-model="formData.bomNumber" placeholder="请输入BOM编号" />
              </el-form-item>
              <el-form-item label="物料名称">
                <el-input v-model="formData.materialName" placeholder="请输入物料名称" />
              </el-form-item>
              <el-form-item label="尺寸规格">
                <el-input v-model="formData.sizeSpec" placeholder="请输入尺寸规格" />
              </el-form-item>
              <el-form-item label="颜色">
                <el-input v-model="formData.color" placeholder="请输入颜色" />
              </el-form-item>
              <el-form-item label="材质">
                <el-input v-model="formData.material" placeholder="请输入材质" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="大类">
                <el-input v-model="formData.majorCategory" placeholder="请输入大类" />
              </el-form-item>
              <el-form-item label="中类">
                <el-input v-model="formData.middleCategory" placeholder="请输入中类" />
              </el-form-item>
              <el-form-item label="小类">
                <el-input v-model="formData.minorCategory" placeholder="请输入小类" />
              </el-form-item>
              <el-form-item label="型号">
                <el-input v-model="formData.model" placeholder="请输入型号" />
              </el-form-item>
              <el-form-item label="系列">
                <el-input v-model="formData.series" placeholder="请输入系列" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="来源">
                <el-select v-model="formData.source" multiple placeholder="请选择来源" style="width: 100%;">
                  <el-option label="自制" value="自制" />
                  <el-option label="客供" value="客供" />
                  <el-option label="外购" value="外购" />
                  <el-option label="外协" value="外协" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="基础单位">
                <el-input v-model="formData.baseUnit" placeholder="如：个、台、套" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="物料图片">
                <el-upload
                  class="avatar-uploader"
                  action="#"
                  :show-file-list="false"
                  :auto-upload="false"
                  :on-change="handleImageChange"
                  accept="image/*"
                >
                  <img v-if="formData.materialImage" :src="formData.materialImage" class="avatar" />
                  <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
                </el-upload>
                <div v-if="formData.materialImage" style="margin-top: 10px;">
                  <el-button size="small" type="danger" @click="handleRemoveImage">删除图片</el-button>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="物料详述">
            <el-input 
              v-model="formData.description" 
              type="textarea" 
              :rows="3" 
              placeholder="请输入物料详述" 
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 销售属性 -->
      <el-tab-pane label="销售属性" name="sales">
        <el-form :model="formData" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="销售单位">
                <el-input v-model="formData.saleUnit" placeholder="请输入销售单位" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="销售转化率">
                <el-input-number v-model="formData.saleConversionRate" :precision="2" :min="0" placeholder="请输入销售转化率" style="width: 100%;" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>

      <!-- 技术研发属性 -->
      <el-tab-pane label="技术研发属性" name="rd">
        <el-empty description="暂无技术研发属性" />
      </el-tab-pane>

      <!-- 生产属性 -->
      <el-tab-pane label="生产属性" name="production">
        <el-form :model="formData" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="产出工序名称">
                <SmartSelect
                  v-model="formData.processName"
                  :options="processList"
                  label-field="processName"
                  value-field="processName"
                  description-field="processCode"
                  placeholder="请选择或输入工序名称"
                  :filterable="true"
                  :clearable="true"
                  :show-description="true"
                  style="width: 100%;"
                />
              </el-form-item>
              <el-form-item label="定时工额">
                <el-input-number v-model="formData.standardTime" :precision="2" :min="0" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="定额工时">
                <el-input-number v-model="formData.quotaTime" :precision="2" :min="0" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="最小包装量">
                <el-input-number v-model="formData.minimumPackagingQuantity" :precision="6" :min="0" placeholder="默认值：1" style="width: 100%;" />
                <div style="font-size: 12px; color: #909399; margin-top: 4px;">
                  用于计算排程数量的最小包装单位
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="工序单价">
                <el-input-number v-model="formData.processPrice" :precision="2" :min="0" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="kg/pcs">
                <el-input-number v-model="formData.kgPerPcs" :precision="4" :min="0" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="pcs/kg">
                <el-input-number v-model="formData.pcsPerKg" :precision="4" :min="0" style="width: 100%;" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>

      <!-- 采购属性 -->
      <el-tab-pane label="采购属性" name="purchase">
        <el-form :model="formData" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="采购单位">
                <el-input v-model="formData.purchaseUnit" placeholder="请输入采购单位" />
              </el-form-item>
              <el-form-item label="采购周期">
                <el-input v-model="formData.purchaseCycle" placeholder="如：7天、15天" />
              </el-form-item>
              <el-form-item label="基础单价">
                <el-input-number 
                  :model-value="basePriceComputed" 
                  disabled
                  :precision="2" 
                  :min="0" 
                  style="width: 100%;" 
                />
                <div style="font-size: 12px; color: #909399; margin-top: 4px;">
                  计算公式：基础单价 = 采购单价 ÷ 采购转化率
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="采购转化率">
                <el-input-number 
                  v-model="formData.purchaseConversionRate" 
                  :precision="2" 
                  :min="0" 
                  placeholder="请输入采购转化率" 
                  @change="handlePurchaseDataChange"
                  style="width: 100%;" 
                />
              </el-form-item>
              <el-form-item label="采购单价">
                <el-input-number 
                  v-model="formData.purchasePrice" 
                  :precision="2" 
                  :min="0" 
                  @change="handlePurchaseDataChange"
                  style="width: 100%;" 
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- ✅ 供货商信息子表格 -->
          <el-divider content-position="left">供货商信息</el-divider>
          
          <div style="margin-bottom: 10px;">
            <el-button type="primary" size="small" @click="handleAddSupplier">
              <el-icon><Plus /></el-icon>
              添加供应商
            </el-button>
          </div>

          <el-table :data="formData.suppliers" border stripe style="width: 100%;">
            <el-table-column prop="sequence" label="序号" width="80" align="center">
              <template #default="{ $index }">
                {{ $index + 1 }}
              </template>
            </el-table-column>
            
            <el-table-column prop="supplierName" label="供应商名称" width="200">
              <template #default="{ row }">
                <el-select 
                  v-model="row.supplierName" 
                  filterable 
                  placeholder="请选择供应商"
                  style="width: 100%;"
                >
                  <el-option
                    v-for="supplier in supplierList"
                    :key="supplier.supplierName"
                    :label="supplier.supplierName"
                    :value="supplier.supplierName"
                  />
                </el-select>
              </template>
            </el-table-column>

            <el-table-column prop="minimumOrderQuantity" label="起定量" width="120">
              <template #default="{ row }">
                <el-input-number 
                  v-model="row.minimumOrderQuantity" 
                  :precision="4" 
                  :min="0"
                  size="small"
                  style="width: 100%;"
                />
              </template>
            </el-table-column>

            <el-table-column prop="tierRange" label="阶梯范围" width="150">
              <template #default="{ row }">
                <el-input 
                  v-model="row.tierRange" 
                  size="small"
                  placeholder="如1000-5000"
                />
              </template>
            </el-table-column>

            <el-table-column prop="tierUnitPrice" label="阶梯单价" width="120">
              <template #default="{ row }">
                <el-input-number 
                  v-model="row.tierUnitPrice" 
                  :precision="2" 
                  :min="0"
                  size="small"
                  style="width: 100%;"
                />
              </template>
            </el-table-column>

            <el-table-column prop="taxRate" label="税率(%)" width="100">
              <template #default="{ row }">
                <el-input-number 
                  v-model="row.taxRate" 
                  :precision="2" 
                  :min="0"
                  :max="100"
                  size="small"
                  style="width: 100%;"
                />
              </template>
            </el-table-column>

            <el-table-column prop="standardPackagingQuantity" label="标准包装数量" width="150">
              <template #default="{ row }">
                <el-input-number 
                  v-model="row.standardPackagingQuantity" 
                  :precision="4" 
                  :min="0"
                  size="small"
                  style="width: 100%;"
                />
              </template>
            </el-table-column>

            <el-table-column prop="orderingRule" label="下单规则" width="120">
              <template #default="{ row }">
                <el-select v-model="row.orderingRule" size="small" style="width: 100%;">
                  <el-option label="默认" value="默认" />
                  <el-option label="备用" value="备用" />
                </el-select>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="80" fixed="right" align="center">
              <template #default="{ $index }">
                <el-button 
                  type="danger" 
                  size="small" 
                  link
                  @click="handleDeleteSupplier($index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form>
      </el-tab-pane>

      <!-- 品质属性 -->
      <el-tab-pane label="品质属性" name="quality">
        <el-empty description="暂无品质属性" />
      </el-tab-pane>

      <!-- 财务属性 -->
      <el-tab-pane label="财务属性" name="finance">
        <el-empty description="暂无财务属性" />
      </el-tab-pane>

      <!-- 仓储属性 -->
      <el-tab-pane label="仓储属性" name="warehouse">
        <el-empty description="暂无仓储属性" />
      </el-tab-pane>
    </el-tabs>

    <div class="footer-buttons">
      <div class="nav-buttons">
        <el-button @click="handlePrevious" :disabled="!hasPrevious">
          <el-icon><ArrowLeft /></el-icon>
          上一项
        </el-button>
        <el-button @click="handleNext" :disabled="!hasNext">
          下一项
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="action-buttons">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="success" @click="handleSave">保存</el-button>
        <el-button type="primary" @click="handleSubmit">提交</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import SmartSelect from '@/components/SmartSelect.vue'
import request from '@/utils/request'

const props = defineProps({
  materialData: {
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  // 批量编辑相关
  allMaterials: {
    type: Array,
    default: () => []
  },
  currentIndex: {
    type: Number,
    default: -1
  }
})

const emit = defineEmits(['success', 'save', 'cancel', 'navigate'])

const activeTab = ref('basic')
const processList = ref([]) // 工序列表
const supplierList = ref([]) // ✅ 供应商列表

const formData = reactive({
  materialCode: '',
  bomNumber: '',
  materialName: '',
  sizeSpec: '',
  color: '',
  material: '',
  majorCategory: '',
  middleCategory: '',
  minorCategory: '',
  model: '',
  series: '',
  source: [],
  description: '',
  materialImage: '',
  baseUnit: '个',
  saleUnit: '',
  saleConversionRate: 0,
  purchaseUnit: '',
  purchaseConversionRate: 0,
  kgPerPcs: 0,
  pcsPerKg: 0,
  processName: '',
  standardTime: 0,
  quotaTime: 0,
  minimumPackagingQuantity: 1,  // ✅ 新增：最小包装量，默认值为1
  processPrice: 0,
  purchaseCycle: '',
  purchasePrice: 0,
  basePrice: 0, // 基础单价（计算字段）
  suppliers: [] // ✅ 供货商信息列表
})

// 计算属性：基础单价
const basePriceComputed = computed(() => {
  const purchasePrice = formData.purchasePrice || 0
  const purchaseConversionRate = formData.purchaseConversionRate || 1
  
  // 基础单价 = 采购单价 ÷ 采购转化率
  if (purchaseConversionRate > 0) {
    return (purchasePrice / purchaseConversionRate).toFixed(2)
  }
  return '0.00'
})

// 处理采购数据变化（重新计算基础单价）
const handlePurchaseDataChange = () => {
  const purchasePrice = formData.purchasePrice || 0
  const purchaseConversionRate = formData.purchaseConversionRate || 1
  
  // 计算并更新基础单价
  if (purchaseConversionRate > 0) {
    formData.basePrice = purchasePrice / purchaseConversionRate
  } else {
    formData.basePrice = 0
  }
}

// 监听 props 变化
watch(() => props.materialData, (newVal) => {
  if (newVal && props.isEdit) {
    Object.assign(formData, newVal)
  }
}, { immediate: true })

// 计算属性：是否有上一项
const hasPrevious = computed(() => {
  return props.currentIndex > 0
})

// 计算属性：是否有下一项
const hasNext = computed(() => {
  return props.currentIndex >= 0 && props.currentIndex < props.allMaterials.length - 1
})

// 处理图片上传
const handleImageChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    formData.materialImage = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

// 删除图片
const handleRemoveImage = () => {
  formData.materialImage = ''
}

const handleCancel = () => {
  emit('cancel')
}

// 保存（不关闭页面）
const handleSave = () => {
  if (!formData.materialName) {
    ElMessage.warning('请输入物料名称')
    activeTab.value = 'basic'
    return
  }
  
  // 发送数据到父组件
  emit('save', { ...formData })
  ElMessage.success('保存成功')
}

// 提交（关闭页面）
const handleSubmit = () => {
  if (!formData.materialName) {
    ElMessage.warning('请输入物料名称')
    activeTab.value = 'basic'
    return
  }
  
  // 发送数据到父组件
  emit('success', { ...formData })
}

// 上一项
const handlePrevious = () => {
  if (hasPrevious.value) {
    // 先保存当前数据
    if (formData.materialName) {
      emit('save', { ...formData })
    }
    // 然后切换到上一项
    emit('navigate', 'prev')
  }
}

// 下一项
const handleNext = () => {
  if (hasNext.value) {
    // 先保存当前数据
    if (formData.materialName) {
      emit('save', { ...formData })
    }
    // 然后切换到下一项
    emit('navigate', 'next')
  }
}

// 加载工序列表
onMounted(() => {
  loadProcessList()
  loadSupplierList() // ✅ 加载供应商列表
})

// 从 localStorage 加载工序数据
const loadProcessList = () => {
  try {
    const processData = localStorage.getItem('processListData')
    if (processData) {
      const data = JSON.parse(processData)
      processList.value = data || []
      console.log('加载工序数据成功:', processList.value.length, '条')
    } else {
      console.log('未找到工序数据')
    }
  } catch (error) {
    console.error('加载工序数据失败:', error)
    ElMessage.error('加载工序数据失败')
  }
}

// ✅ 加载供应商列表
const loadSupplierList = async () => {
  try {
    const response = await request.get('/supplier-management')
    if (response.code === 200 && response.data) {
      supplierList.value = response.data.records || []
      console.log('加载供应商数据成功:', supplierList.value.length, '条')
    }
  } catch (error) {
    console.error('加载供应商数据失败:', error)
    ElMessage.error('加载供应商数据失败')
  }
}

// ✅ 添加供应商
const handleAddSupplier = () => {
  formData.suppliers.push({
    supplierName: '',
    minimumOrderQuantity: 0,
    tierRange: '',
    tierUnitPrice: 0,
    taxRate: 13,
    standardPackagingQuantity: 0,
    orderingRule: '默认'
  })
}

// ✅ 删除供应商
const handleDeleteSupplier = (index) => {
  formData.suppliers.splice(index, 1)
}
</script>

<style scoped>
.material-edit {
  padding: 20px;
}

.footer-buttons {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-buttons,
.action-buttons {
  display: flex;
  gap: 10px;
}

/* 图片上传样式 */
.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.avatar-uploader:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: cover;
}
</style>
