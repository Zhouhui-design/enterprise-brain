<template>
  <div class="supplier-create">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>新增供应商</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>采购管理</el-breadcrumb-item>
          <el-breadcrumb-item>供应商管理</el-breadcrumb-item>
          <el-breadcrumb-item>新增供应商</el-breadcrumb-item>
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
        label-width="120px"
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
              <el-form-item label="供应商名称" prop="supplierName">
                <el-input
                  v-model="formData.supplierName"
                  placeholder="请输入供应商名称"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="供应商编码" prop="supplierCode">
                <el-input
                  v-model="formData.supplierCode"
                  placeholder="请输入供应商编码"
                  clearable
                >
                  <template #append>
                    <el-button @click="generateCode">自动生成</el-button>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="供应商类型" prop="type">
                <el-select
                  v-model="formData.type"
                  placeholder="请选择供应商类型"
                  style="width: 100%"
                >
                  <el-option label="原材料" value="raw_material" />
                  <el-option label="设备" value="equipment" />
                  <el-option label="服务" value="service" />
                  <el-option label="办公用品" value="office" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="供应商等级" prop="level">
                <el-select
                  v-model="formData.level"
                  placeholder="请选择供应商等级"
                  style="width: 100%"
                >
                  <el-option label="A级" value="A" />
                  <el-option label="B级" value="B" />
                  <el-option label="C级" value="C" />
                  <el-option label="D级" value="D" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="所属行业" prop="industry">
                <el-select
                  v-model="formData.industry"
                  placeholder="请选择所属行业"
                  style="width: 100%"
                  filterable
                >
                  <el-option label="制造业" value="manufacturing" />
                  <el-option label="信息技术" value="technology" />
                  <el-option label="金融服务" value="finance" />
                  <el-option label="医疗健康" value="healthcare" />
                  <el-option label="教育培训" value="education" />
                  <el-option label="零售贸易" value="retail" />
                  <el-option label="建筑工程" value="construction" />
                  <el-option label="物流运输" value="logistics" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="企业规模" prop="scale">
                <el-select
                  v-model="formData.scale"
                  placeholder="请选择企业规模"
                  style="width: 100%"
                >
                  <el-option label="大型企业" value="large" />
                  <el-option label="中型企业" value="medium" />
                  <el-option label="小型企业" value="small" />
                  <el-option label="微型企业" value="micro" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 联系信息 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon><Phone /></el-icon>
            <span>联系信息</span>
          </div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="联系人" prop="contactPerson">
                <el-input
                  v-model="formData.contactPerson"
                  placeholder="请输入联系人姓名"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系人职务" prop="contactTitle">
                <el-input
                  v-model="formData.contactTitle"
                  placeholder="请输入联系人职务"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="手机号码" prop="phone">
                <el-input
                  v-model="formData.phone"
                  placeholder="请输入手机号码"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="固定电话" prop="landline">
                <el-input
                  v-model="formData.landline"
                  placeholder="请输入固定电话"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="邮箱地址" prop="email">
                <el-input
                  v-model="formData.email"
                  placeholder="请输入邮箱地址"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="传真号码" prop="fax">
                <el-input
                  v-model="formData.fax"
                  placeholder="请输入传真号码"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 地址信息 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon><Location /></el-icon>
            <span>地址信息</span>
          </div>
          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item label="所在省份" prop="province">
                <el-select
                  v-model="formData.province"
                  placeholder="请选择省份"
                  style="width: 100%"
                  @change="handleProvinceChange"
                >
                  <el-option
                    v-for="province in provinces"
                    :key="province.value"
                    :label="province.label"
                    :value="province.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="所在城市" prop="city">
                <el-select
                  v-model="formData.city"
                  placeholder="请选择城市"
                  style="width: 100%"
                  :disabled="!formData.province"
                  @change="handleCityChange"
                >
                  <el-option
                    v-for="city in cities"
                    :key="city.value"
                    :label="city.label"
                    :value="city.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="所在区县" prop="district">
                <el-select
                  v-model="formData.district"
                  placeholder="请选择区县"
                  style="width: 100%"
                  :disabled="!formData.city"
                >
                  <el-option
                    v-for="district in districts"
                    :key="district.value"
                    :label="district.label"
                    :value="district.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="24">
              <el-form-item label="详细地址" prop="address">
                <el-input
                  v-model="formData.address"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入详细地址"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="邮政编码" prop="zipCode">
                <el-input
                  v-model="formData.zipCode"
                  placeholder="请输入邮政编码"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="公司网址" prop="website">
                <el-input
                  v-model="formData.website"
                  placeholder="请输入公司网址"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 财务信息 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon><Money /></el-icon>
            <span>财务信息</span>
          </div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="开户银行" prop="bankName">
                <el-input
                  v-model="formData.bankName"
                  placeholder="请输入开户银行"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="银行账号" prop="bankAccount">
                <el-input
                  v-model="formData.bankAccount"
                  placeholder="请输入银行账号"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="纳税人识别号" prop="taxNumber">
                <el-input
                  v-model="formData.taxNumber"
                  placeholder="请输入纳税人识别号"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="结算方式" prop="paymentMethod">
                <el-select
                  v-model="formData.paymentMethod"
                  placeholder="请选择结算方式"
                  style="width: 100%"
                >
                  <el-option label="月结" value="monthly" />
                  <el-option label="季度结" value="quarterly" />
                  <el-option label="现结" value="immediate" />
                  <el-option label="账期结算" value="credit" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="信用额度" prop="creditLimit">
                <el-input-number
                  v-model="formData.creditLimit"
                  :min="0"
                  :step="1000"
                  style="width: 100%"
                  placeholder="请输入信用额度"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="账期天数" prop="creditDays">
                <el-input-number
                  v-model="formData.creditDays"
                  :min="0"
                  :max="365"
                  style="width: 100%"
                  placeholder="请输入账期天数"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 资质信息 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon><Document /></el-icon>
            <span>资质信息</span>
          </div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="营业执照" prop="businessLicense">
                <el-upload
                  class="upload-demo"
                  :action="uploadUrl"
                  :on-success="handleLicenseUpload"
                  :before-upload="beforeUpload"
                  :file-list="licenseFiles"
                  list-type="picture-card"
                >
                  <el-icon><Plus /></el-icon>
                </el-upload>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="资质证书" prop="qualificationCert">
                <el-upload
                  class="upload-demo"
                  :action="uploadUrl"
                  :on-success="handleQualificationUpload"
                  :before-upload="beforeUpload"
                  :file-list="qualificationFiles"
                  multiple
                  list-type="picture-card"
                >
                  <el-icon><Plus /></el-icon>
                </el-upload>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="24">
              <el-form-item label="主营产品" prop="mainProducts">
                <el-input
                  v-model="formData.mainProducts"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入主营产品，多个产品用逗号分隔"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="24">
              <el-form-item label="备注信息" prop="remarks">
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  ArrowLeft, InfoFilled, Phone, Location, Money, Document, Plus
} from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref()
const saving = ref(false)
const submitting = ref(false)
const uploadUrl = '/api/upload'

// 表单数据
const formData = reactive({
  // 基本信息
  supplierName: '',
  supplierCode: '',
  type: '',
  level: '',
  industry: '',
  scale: '',
  
  // 联系信息
  contactPerson: '',
  contactTitle: '',
  phone: '',
  landline: '',
  email: '',
  fax: '',
  
  // 地址信息
  province: '',
  city: '',
  district: '',
  address: '',
  zipCode: '',
  website: '',
  
  // 财务信息
  bankName: '',
  bankAccount: '',
  taxNumber: '',
  paymentMethod: '',
  creditLimit: 0,
  creditDays: 0,
  
  // 资质信息
  businessLicense: '',
  qualificationCert: '',
  mainProducts: '',
  remarks: '',
  
  status: 'draft'
})

// 文件列表
const licenseFiles = ref([])
const qualificationFiles = ref([])

// 省市区数据
const provinces = ref([])
const cities = ref([])
const districts = ref([])

// 表单验证规则
const formRules = {
  supplierName: [
    { required: true, message: '请输入供应商名称', trigger: 'blur' }
  ],
  supplierCode: [
    { required: true, message: '请输入供应商编码', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择供应商类型', trigger: 'change' }
  ],
  level: [
    { required: true, message: '请选择供应商等级', trigger: 'change' }
  ],
  contactPerson: [
    { required: true, message: '请输入联系人', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  province: [
    { required: true, message: '请选择省份', trigger: 'change' }
  ],
  city: [
    { required: true, message: '请选择城市', trigger: 'change' }
  ],
  district: [
    { required: true, message: '请选择区县', trigger: 'change' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ],
  bankName: [
    { required: true, message: '请输入开户银行', trigger: 'blur' }
  ],
  bankAccount: [
    { required: true, message: '请输入银行账号', trigger: 'blur' }
  ]
}

// 方法
const generateCode = () => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  formData.supplierCode = `SUP${timestamp.toString().slice(-6)}${random.toString().padStart(3, '0')}`
}

const handleProvinceChange = (value) => {
  formData.city = ''
  formData.district = ''
  loadCities(value)
}

const handleCityChange = (value) => {
  formData.district = ''
  loadDistricts(value)
}

const handleLicenseUpload = (response, file) => {
  formData.businessLicense = response.url
}

const handleQualificationUpload = (response, file) => {
  // 处理多文件上传
}

const beforeUpload = (file) => {
  const isValidType = ['image/jpeg', 'image/png', 'image/gif'].includes(file.type)
  const isLtSize = file.size / 1024 / 1024 < 5

  if (!isValidType) {
    ElMessage.error('只能上传 JPG/PNG/GIF 格式的图片!')
    return false
  }
  if (!isLtSize) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

const handleBack = () => {
  router.push('/purchase/suppliers/list')
}

const handleSaveDraft = async () => {
  saving.value = true
  try {
    // 这里调用保存草稿API
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('草稿保存成功')
    router.push('/purchase/suppliers/list')
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
    router.push('/purchase/suppliers/list')
  } catch (error) {
    if (error !== false) {
      ElMessage.error('提交失败')
    }
  } finally {
    submitting.value = false
  }
}

const loadProvinces = async () => {
  // 模拟省份数据
  provinces.value = [
    { label: '北京市', value: 'beijing' },
    { label: '上海市', value: 'shanghai' },
    { label: '广东省', value: 'guangdong' },
    { label: '浙江省', value: 'zhejiang' },
    { label: '江苏省', value: 'jiangsu' }
  ]
}

const loadCities = async (province) => {
  // 模拟城市数据
  const cityMap = {
    beijing: [
      { label: '北京市', value: 'beijing' }
    ],
    guangdong: [
      { label: '广州市', value: 'guangzhou' },
      { label: '深圳市', value: 'shenzhen' },
      { label: '珠海市', value: 'zhuhai' }
    ]
  }
  cities.value = cityMap[province] || []
}

const loadDistricts = async (city) => {
  // 模拟区县数据
  const districtMap = {
    beijing: [
      { label: '朝阳区', value: 'chaoyang' },
      { label: '海淀区', value: 'haidian' },
      { label: '东城区', value: 'dongcheng' }
    ],
    guangzhou: [
      { label: '天河区', value: 'tianhe' },
      { label: '越秀区', value: 'yuexiu' },
      { label: '海珠区', value: 'haizhu' }
    ]
  }
  districts.value = districtMap[city] || []
}

onMounted(() => {
  loadProvinces()
  generateCode()
})
</script>

<style scoped lang="scss">
.supplier-create {
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
  
  .upload-demo {
    :deep(.el-upload--picture-card) {
      width: 100px;
      height: 100px;
      line-height: 100px;
    }
  }
}
</style>