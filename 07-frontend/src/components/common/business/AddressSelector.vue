<template>
  <div class="address-selector">
    <el-row :gutter="12" class="address-row">
      <!-- 省份选择 -->
      <el-col :span="8">
        <el-select
          v-model="provinceValue"
          placeholder="请选择省份"
          class="address-select"
          @change="handleProvinceChange"
          :disabled="disabled || loading"
        >
          <el-option
            v-for="province in provinces"
            :key="province.code"
            :label="province.name"
            :value="province.code"
          />
        </el-select>
      </el-col>

      <!-- 城市选择 -->
      <el-col :span="8">
        <el-select
          v-model="cityValue"
          placeholder="请选择城市"
          class="address-select"
          @change="handleCityChange"
          :disabled="disabled || loading || !provinceValue"
        >
          <el-option
            v-for="city in cities"
            :key="city.code"
            :label="city.name"
            :value="city.code"
          />
        </el-select>
      </el-col>

      <!-- 区县选择 -->
      <el-col :span="8">
        <el-select
          v-model="districtValue"
          placeholder="请选择区县"
          class="address-select"
          @change="handleDistrictChange"
          :disabled="disabled || loading || !cityValue"
        >
          <el-option
            v-for="district in districts"
            :key="district.code"
            :label="district.name"
            :value="district.code"
          />
        </el-select>
      </el-col>
    </el-row>

    <!-- 详细地址输入框（可选） -->
    <el-input
      v-if="showDetailAddress"
      v-model="detailAddress"
      type="textarea"
      :rows="2"
      placeholder="请输入详细地址"
      class="detail-address-input"
      :disabled="disabled || loading"
      @input="handleDetailAddressChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'

// 定义地址数据类型
interface AddressItem {
  code: string
  name: string
}

// Props 定义
interface Props {
  modelValue?: {
    province?: string
    city?: string
    district?: string
    detail?: string
  }
  showDetailAddress?: boolean
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  showDetailAddress: false,
  disabled: false,
  loading: false
})

// Emits 定义
const emit = defineEmits<{
  'update:modelValue': [value: {
    province?: string
    city?: string
    district?: string
    detail?: string
  }]
  'change': [value: {
    province?: string
    city?: string
    district?: string
    detail?: string
  }]
}>()

// 响应式数据
const provinceValue = ref<string>('')
const cityValue = ref<string>('')
const districtValue = ref<string>('')
const detailAddress = ref<string>('')

// 地址数据（实际项目中应从API获取，这里使用模拟数据）
const provinces = ref<AddressItem[]>([])
const cities = ref<AddressItem[]>([])
const districts = ref<AddressItem[]>([])

// 模拟地址数据
const mockAddressData = {
  provinces: [
    { code: '110000', name: '北京市' },
    { code: '310000', name: '上海市' },
    { code: '440000', name: '广东省' },
    { code: '330000', name: '浙江省' }
  ],
  cities: {
    '110000': [{ code: '110100', name: '北京市' }],
    '310000': [{ code: '310100', name: '上海市' }],
    '440000': [
      { code: '440100', name: '广州市' },
      { code: '440300', name: '深圳市' },
      { code: '440400', name: '珠海市' }
    ],
    '330000': [
      { code: '330100', name: '杭州市' },
      { code: '330200', name: '宁波市' },
      { code: '330300', name: '温州市' }
    ]
  },
  districts: {
    '110100': [
      { code: '110101', name: '东城区' },
      { code: '110102', name: '西城区' },
      { code: '110105', name: '朝阳区' }
    ],
    '310100': [
      { code: '310101', name: '黄浦区' },
      { code: '310104', name: '徐汇区' },
      { code: '310105', name: '长宁区' }
    ],
    '440100': [
      { code: '440103', name: '荔湾区' },
      { code: '440104', name: '越秀区' },
      { code: '440105', name: '海珠区' }
    ],
    '440300': [
      { code: '440303', name: '罗湖区' },
      { code: '440304', name: '福田区' },
      { code: '440305', name: '南山区' }
    ],
    '330100': [
      { code: '330102', name: '上城区' },
      { code: '330103', name: '下城区' },
      { code: '330104', name: '江干区' }
    ]
  }
}

// 计算当前选中的地址对象
const currentAddress = computed(() => {
  const province = provinces.value.find(p => p.code === provinceValue.value)
  const city = cities.value.find(c => c.code === cityValue.value)
  const district = districts.value.find(d => d.code === districtValue.value)

  return {
    province: province?.name || '',
    provinceCode: provinceValue.value,
    city: city?.name || '',
    cityCode: cityValue.value,
    district: district?.name || '',
    districtCode: districtValue.value,
    detail: detailAddress.value
  }
})

// 加载省份数据
const loadProvinces = async () => {
  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 100))
    provinces.value = mockAddressData.provinces
  } catch (error) {
    console.error('加载省份数据失败:', error)
  }
}

// 加载城市数据
const loadCities = async (provinceCode: string) => {
  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 100))
    cities.value = mockAddressData.cities[provinceCode] || []
    // 清空区县和城市值
    cityValue.value = ''
    districtValue.value = ''
    districts.value = []
  } catch (error) {
    console.error('加载城市数据失败:', error)
  }
}

// 加载区县数据
const loadDistricts = async (cityCode: string) => {
  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 100))
    districts.value = mockAddressData.districts[cityCode] || []
    // 清空区县值
    districtValue.value = ''
  } catch (error) {
    console.error('加载区县数据失败:', error)
  }
}

// 省份变化处理
const handleProvinceChange = (provinceCode: string) => {
  loadCities(provinceCode)
  updateModelValue()
}

// 城市变化处理
const handleCityChange = (cityCode: string) => {
  loadDistricts(cityCode)
  updateModelValue()
}

// 区县变化处理
const handleDistrictChange = () => {
  updateModelValue()
}

// 详细地址变化处理
const handleDetailAddressChange = () => {
  updateModelValue()
}

// 更新模型值
const updateModelValue = () => {
  const value = {
    province: currentAddress.value.provinceCode,
    city: currentAddress.value.cityCode,
    district: currentAddress.value.districtCode,
    detail: detailAddress.value
  }
  emit('update:modelValue', value)
  emit('change', value)
}

// 监听外部传入的modelValue变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      if (newValue.province && newValue.province !== provinceValue.value) {
        provinceValue.value = newValue.province
        if (provinces.value.length > 0) {
          loadCities(newValue.province)
          setTimeout(() => {
            if (newValue.city) {
              cityValue.value = newValue.city
              loadDistricts(newValue.city)
              setTimeout(() => {
                if (newValue.district) {
                  districtValue.value = newValue.district
                }
              }, 150)
            }
          }, 150)
        }
      }
      if (newValue.detail !== undefined) {
        detailAddress.value = newValue.detail || ''
      }
    }
  },
  { deep: true, immediate: true }
)

// 组件挂载时加载省份数据
onMounted(() => {
  loadProvinces()
})
</script>

<style scoped>
.address-selector {
  width: 100%;
}

.address-row {
  margin-bottom: 12px;
}

.address-select {
  width: 100%;
}

.detail-address-input {
  margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .address-row {
    flex-direction: column;
  }
  
  .address-row :deep(.el-col) {
    width: 100% !important;
    margin-bottom: 12px;
  }
  
  .address-row :deep(.el-col:last-child) {
    margin-bottom: 0;
  }
}
</style>