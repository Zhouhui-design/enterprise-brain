<template>
  <div class="product-manual-edit">
    <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="基本信息" name="basic">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="产品编号" prop="productCode">
                <el-input 
                  v-model="formData.productCode" 
                  placeholder="请输入产品编号" 
                  @blur="handleProductCodeChange"
                />
              </el-form-item>
              <el-form-item label="产品名称" prop="productName">
                <el-input v-model="formData.productName" placeholder="请输入产品名称" />
              </el-form-item>
              <el-form-item label="产品分类" prop="category">
                <el-input v-model="formData.category" placeholder="如：电子元件、机械配件" />
              </el-form-item>
              <el-form-item label="产品子类">
                <el-input v-model="formData.subCategory" placeholder="请输入产品子类" />
              </el-form-item>
              <el-form-item label="规格型号" prop="specification">
                <el-input v-model="formData.specification" placeholder="请输入规格型号" />
              </el-form-item>
              <el-form-item label="单位">
                <el-input v-model="formData.unit" placeholder="如：个、台、套" />
              </el-form-item>
              <el-form-item label="产品状态">
                <el-input v-model="formData.status" placeholder="如：在售、停产、研发中" />
              </el-form-item>
              <el-form-item label="来源">
                <el-select 
                  v-model="formData.source" 
                  multiple 
                  placeholder="请选择来源" 
                  style="width: 100%;"
                >
                  <el-option label="自制" value="自制" />
                  <el-option label="客供" value="客供" />
                  <el-option label="外购" value="外购" />
                  <el-option label="外协" value="外协" />
                </el-select>
              </el-form-item>
              <el-form-item label="产出工序名称">
                <el-input 
                  v-model="formData.outputProcessName" 
                  placeholder="从产品物料库自动获取" 
                  disabled
                  style="background-color: #f5f7fa;"
                />
                <div v-if="lookupLoading" style="margin-top: 5px; color: #409eff; font-size: 12px;">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  正在查询产出工序...
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="主要材质">
                <el-input v-model="formData.material" placeholder="请输入主要材质" />
              </el-form-item>
              <el-form-item label="颜色">
                <el-input v-model="formData.color" placeholder="请输入颜色" />
              </el-form-item>
              <el-form-item label="重量(kg)">
                <el-input-number v-model="formData.weight" :precision="2" :min="0" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="尺寸">
                <el-input v-model="formData.size" placeholder="如：长x宽x高" />
              </el-form-item>
              <el-form-item label="产品图片">
                <el-upload
                  class="avatar-uploader"
                  action="#"
                  :show-file-list="false"
                  :auto-upload="false"
                  :on-change="handleImageChange"
                  accept="image/*"
                >
                  <img v-if="formData.productImage" :src="formData.productImage" class="avatar" />
                  <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
                </el-upload>
                <div v-if="formData.productImage" style="margin-top: 10px;">
                  <el-button size="small" type="danger" @click="handleRemoveImage">删除图片</el-button>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="价格库存" name="price">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="销售单价">
                <el-input-number v-model="formData.salePrice" :precision="2" :min="0" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="成本单价">
                <el-input-number v-model="formData.costPrice" :precision="2" :min="0" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="当前库存">
                <el-input-number v-model="formData.stock" :min="0" style="width: 100%;" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最小库存">
                <el-input-number v-model="formData.minStock" :min="0" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="生产周期(天)">
                <el-input-number v-model="formData.leadTime" :min="0" style="width: 100%;" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="供应商信息" name="supplier">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="主供应商">
                <el-input v-model="formData.supplier" placeholder="请输入主供应商" />
              </el-form-item>
              <el-form-item label="质量标准">
                <el-input v-model="formData.qualityStandard" placeholder="如：ISO9001" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="认证证书">
                <el-input v-model="formData.certification" placeholder="如：CE, RoHS" />
              </el-form-item>
              <el-form-item label="产品经理">
                <el-input v-model="formData.productManager" placeholder="请输入产品经理" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="其他信息" name="other">
          <el-form-item label="备注">
            <el-input 
              v-model="formData.remark" 
              type="textarea" 
              :rows="5" 
              placeholder="请输入备注信息" 
            />
          </el-form-item>
        </el-tab-pane>
      </el-tabs>
    </el-form>

    <div class="footer-buttons">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Loading } from '@element-plus/icons-vue'
import materialApiService from '@/services/api/materialApiService'

const props = defineProps({
  productData: {
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['success', 'cancel'])

const formRef = ref(null)
const activeTab = ref('basic')
const lookupLoading = ref(false)

const formData = reactive({
  productCode: '',
  productName: '',
  category: '',
  subCategory: '',
  specification: '',
  unit: '个',
  status: '在售',
  source: [], // 来源（多选）
  outputProcessName: '', // 产出工序名称
  material: '',
  color: '',
  weight: 0,
  size: '',
  productImage: '',
  salePrice: 0,
  costPrice: 0,
  stock: 0,
  minStock: 0,
  leadTime: 0,
  supplier: '',
  qualityStandard: '',
  certification: '',
  productManager: '',
  remark: ''
})

const rules = {
  productCode: [
    { required: true, message: '请输入产品编号', trigger: 'blur' }
  ],
  productName: [
    { required: true, message: '请输入产品名称', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请输入产品分类', trigger: 'blur' }
  ],
  specification: [
    { required: true, message: '请输入规格型号', trigger: 'blur' }
  ]
}

/**
 * 处理产品编号变化 - 执行lookup
 */
const handleProductCodeChange = async () => {
  const productCode = formData.productCode?.trim()
  
  // 产品编号为空时，清空产出工序名称
  if (!productCode) {
    formData.outputProcessName = ''
    return
  }
  
  try {
    lookupLoading.value = true
    console.log('🔍 开始查询产出工序:', productCode)
    
    // 从materials表查询产出工序名称
    const materials = await materialApiService.getAllMaterials()
    const foundMaterial = materials.find(m => m.materialCode === productCode)
    
    if (foundMaterial && foundMaterial.processName) {
      formData.outputProcessName = foundMaterial.processName
      console.log('✅ 查询到产出工序:', foundMaterial.processName)
      ElMessage.success(`已自动获取产出工序: ${foundMaterial.processName}`)
    } else {
      formData.outputProcessName = ''
      console.log('⚠️ 未找到对应的产出工序')
      ElMessage.warning(`产品编号 ${productCode} 在产品物料库中未找到对应的产出工序`)
    }
  } catch (error) {
    console.error('❌ 查询产出工序失败:', error)
    ElMessage.error('查询产出工序失败')
    formData.outputProcessName = ''
  } finally {
    lookupLoading.value = false
  }
}

// 监听 props 变化
watch(() => props.productData, (newVal) => {
  if (newVal) {
    Object.assign(formData, newVal)
  }
}, { immediate: true })

// 处理图片上传
const handleImageChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    formData.productImage = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

// 删除图片
const handleRemoveImage = () => {
  formData.productImage = ''
}

const handleCancel = () => {
  emit('cancel')
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    emit('success', { ...formData })
  } catch {
    ElMessage.warning('请填写必填项')
  }
}
</script>

<style scoped>
.product-manual-edit {
  padding: 20px;
}

.footer-buttons {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #dcdfe6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
}

.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
  line-height: 178px;
}
</style>
