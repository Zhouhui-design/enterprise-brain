<template>
  <div class="smart-select-demo-container">
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>智能下拉组件演示</h2>
      </div>
    </div>

    <el-card class="demo-card">
      <template #header>
        <div class="card-header">
          <span>基础用法</span>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form label-width="120px">
            <el-form-item label="基础下拉框">
              <SmartSelect
                v-model="basicValue"
                :options="basicOptions"
                label-field="name"
                value-field="id"
                placeholder="请选择"
              />
            </el-form-item>
            
            <el-form-item label="带描述信息">
              <SmartSelect
                v-model="descValue"
                :options="materialOptions"
                label-field="name"
                value-field="code"
                description-field="spec"
                :show-description="true"
                placeholder="请选择物料"
              />
            </el-form-item>
          </el-form>
        </el-col>
        
        <el-col :span="12">
          <div class="result-panel">
            <h4>选择结果：</h4>
            <p>基础下拉框值：{{ basicValue }}</p>
            <p>带描述下拉框值：{{ descValue }}</p>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <div class="card-header">
          <span>筛选功能</span>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form label-width="120px">
            <el-form-item label="本地筛选">
              <SmartSelect
                v-model="filterValue"
                :options="largeOptions"
                label-field="name"
                value-field="id"
                filterable
                placeholder="输入关键词筛选（如：产品50）"
              />
            </el-form-item>
            
            <el-form-item label="远程搜索">
              <SmartSelect
                v-model="remoteValue"
                :options="remoteOptions"
                label-field="name"
                value-field="id"
                :remote="true"
                :remote-method="handleRemoteSearch"
                :loading="remoteLoading"
                filterable
                placeholder="输入关键词远程搜索"
              />
            </el-form-item>
          </el-form>
        </el-col>
        
        <el-col :span="12">
          <div class="result-panel">
            <h4>筛选结果：</h4>
            <p>本地筛选值：{{ filterValue }}</p>
            <p>远程搜索值：{{ remoteValue }}</p>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <div class="card-header">
          <span>BOM场景应用</span>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form label-width="120px">
            <el-form-item label="产品编码">
              <SmartSelect
                v-model="bomProductCode"
                :options="bomMaterialList"
                label-field="materialCode"
                value-field="materialCode"
                description-field="materialName"
                :show-description="true"
                filterable
                placeholder="请选择产品编码"
                @change="handleProductCodeChange"
              />
            </el-form-item>
            
            <el-form-item label="产品名称">
              <SmartSelect
                v-model="bomProductName"
                :options="bomMaterialList"
                label-field="materialName"
                value-field="materialName"
                description-field="materialCode"
                :show-description="true"
                filterable
                placeholder="请选择产品名称"
                @change="handleProductNameChange"
              />
            </el-form-item>
            
            <el-form-item label="子件编码">
              <SmartSelect
                v-model="childCode"
                :options="filteredChildMaterials"
                label-field="materialCode"
                value-field="materialCode"
                description-field="materialName"
                :show-description="true"
                filterable
                placeholder="请选择子件编码"
              />
            </el-form-item>
          </el-form>
        </el-col>
        
        <el-col :span="12">
          <div class="result-panel">
            <h4>BOM场景结果：</h4>
            <p>产品编码：{{ bomProductCode }}</p>
            <p>产品名称：{{ bomProductName }}</p>
            <p>子件编码：{{ childCode }}</p>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import SmartSelect from '@/components/SmartSelect.vue'

// 基础数据
const basicValue = ref('')
const basicOptions = ref([
  { id: 1, name: '选项1' },
  { id: 2, name: '选项2' },
  { id: 3, name: '选项3' }
])

// 带描述信息的数据
const descValue = ref('')
const materialOptions = ref([
  { code: 'M001', name: '不锈钢螺丝', spec: 'M6x20mm' },
  { code: 'M002', name: '铜螺母', spec: 'M6' },
  { code: 'M003', name: '垫片', spec: '6mm' }
])

// 大量数据用于筛选演示
const filterValue = ref('')
const largeOptions = ref(
  Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    name: `产品${i + 1}`
  }))
)

// 远程搜索演示
const remoteValue = ref('')
const remoteOptions = ref([])
const remoteLoading = ref(false)

const handleRemoteSearch = async (query) => {
  remoteLoading.value = true
  try {
    // 模拟远程搜索，实际项目中这里应该是API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (!query) {
      remoteOptions.value = []
      return
    }
    
    // 模拟搜索结果
    const results = Array.from({ length: 10 }, (_, i) => ({
      id: `${query}_${i + 1}`,
      name: `${query}搜索结果${i + 1}`
    }))
    
    remoteOptions.value = results
  } finally {
    remoteLoading.value = false
  }
}

// BOM场景数据
const bomProductCode = ref('')
const bomProductName = ref('')
const childCode = ref('')

// 模拟物料库数据
const bomMaterialList = ref([
  { materialCode: 'P2025001', materialName: '高精度传感器A1', spec: '测量范围0-100mm' },
  { materialCode: 'P2025002', materialName: '工业控制器B2', spec: '支持Modbus协议' },
  { materialCode: 'P2025003', materialName: '智能阀门C3', spec: 'DN50 PN16' },
  { materialCode: 'M001', materialName: '不锈钢螺丝M6x20', spec: '304不锈钢' },
  { materialCode: 'M002', materialName: '铜螺母M6', spec: 'H62黄铜' },
  { materialCode: 'M003', materialName: '橡胶密封圈', spec: 'Φ50mm' }
])

// 过滤后的子件物料列表（排除当前产品）
const filteredChildMaterials = computed(() => {
  if (!bomProductCode.value) {
    return bomMaterialList.value
  }
  return bomMaterialList.value.filter(
    m => m.materialCode !== bomProductCode.value
  )
})

// 产品编码变化时的处理
const handleProductCodeChange = (value) => {
  if (!value) {
    bomProductName.value = ''
    return
  }
  
  const material = bomMaterialList.value.find(m => m.materialCode === value)
  if (material) {
    bomProductName.value = material.materialName
    ElMessage.success('已自动填充产品名称')
  }
}

// 产品名称变化时的处理
const handleProductNameChange = (value) => {
  if (!value) {
    bomProductCode.value = ''
    return
  }
  
  const material = bomMaterialList.value.find(m => m.materialName === value)
  if (material) {
    bomProductCode.value = material.materialCode
    ElMessage.success('已自动填充产品编码')
  }
}
</script>

<style scoped>
.smart-select-demo-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.toolbar-left h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.demo-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: bold;
  font-size: 16px;
}

.result-panel {
  background: #f0f2f5;
  padding: 15px;
  border-radius: 4px;
  min-height: 200px;
}

.result-panel h4 {
  margin-top: 0;
  color: #303133;
}

.result-panel p {
  margin: 10px 0;
  color: #606266;
}
</style>