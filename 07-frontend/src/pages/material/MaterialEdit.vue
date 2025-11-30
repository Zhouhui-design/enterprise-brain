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
                <el-input v-model="formData.processName" placeholder="请输入产出工序名称" />
              </el-form-item>
              <el-form-item label="定时工额">
                <el-input-number v-model="formData.standardTime" :precision="2" :min="0" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="定额工时">
                <el-input-number v-model="formData.quotaTime" :precision="2" :min="0" style="width: 100%;" />
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
            </el-col>
            <el-col :span="12">
              <el-form-item label="采购转化率">
                <el-input-number v-model="formData.purchaseConversionRate" :precision="2" :min="0" placeholder="请输入采购转化率" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="采购单价">
                <el-input-number v-model="formData.purchasePrice" :precision="2" :min="0" style="width: 100%;" />
              </el-form-item>
            </el-col>
          </el-row>
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
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const props = defineProps({
  materialData: {
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['success', 'cancel'])

const activeTab = ref('basic')

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
  processPrice: 0,
  purchaseCycle: '',
  purchasePrice: 0
})

// 监听 props 变化
watch(() => props.materialData, (newVal) => {
  if (newVal && props.isEdit) {
    Object.assign(formData, newVal)
  }
}, { immediate: true })

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

const handleSubmit = () => {
  if (!formData.materialName) {
    ElMessage.warning('请输入物料名称')
    activeTab.value = 'basic'
    return
  }
  
  emit('success', { ...formData })
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
  justify-content: flex-end;
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
