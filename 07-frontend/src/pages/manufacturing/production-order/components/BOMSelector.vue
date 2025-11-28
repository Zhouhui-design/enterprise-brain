<template>
  <el-dialog
    v-model="visible"
    title="BOM选择器"
    width="900px"
    :close-on-click-modal="false"
    @open="handleOpen"
  >
    <div class="bom-selector">
      <!-- 搜索区域 -->
      <div class="search-section">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="BOM版本">
            <el-input
              v-model="searchForm.version"
              placeholder="请输入BOM版本"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择状态"
              clearable
              style="width: 120px"
            >
              <el-option label="已激活" value="active" />
              <el-option label="草稿" value="draft" />
              <el-option label="已停用" value="inactive" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
            <el-button @click="handleReset" :icon="Refresh">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- BOM列表 -->
      <div class="bom-list">
        <el-table
          :data="bomList"
          v-loading="loading"
          @row-click="handleRowClick"
          highlight-current-row
          height="300"
        >
          <el-table-column type="radio" width="50" />
          <el-table-column type="index" width="60" label="序号" />
          <el-table-column prop="version" label="BOM版本" width="120" />
          <el-table-column prop="productName" label="产品名称" min-width="150" />
          <el-table-column prop="productCode" label="产品编码" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="materialCount" label="物料数量" width="100" />
          <el-table-column prop="createdBy" label="创建人" width="100" />
          <el-table-column prop="createdAt" label="创建时间" width="160">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- BOM详情 -->
      <div class="bom-detail" v-if="selectedBOM">
        <h4>BOM物料清单</h4>
        <el-table
          :data="selectedBOM.materials"
          border
          size="small"
          max-height="200"
        >
          <el-table-column type="index" width="50" label="序号" />
          <el-table-column prop="materialCode" label="物料编码" width="120" />
          <el-table-column prop="materialName" label="物料名称" min-width="150" />
          <el-table-column prop="specification" label="规格型号" width="120" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="quantity" label="单耗" width="80" />
          <el-table-column prop="stock" label="库存数量" width="100" />
          <el-table-column label="库存状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStockStatusType(row.stock, row.quantity)" size="small">
                {{ getStockStatus(row.stock, row.quantity) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="!selectedBOM">
          确认选择
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  productId: {
    type: [String, Number],
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

// 响应式数据
const visible = ref(false)
const loading = ref(false)
const bomList = ref([])
const selectedBOM = ref(null)

// 搜索表单
const searchForm = reactive({
  version: '',
  status: 'active'
})

// 监听显示状态
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 方法
const handleOpen = () => {
  loadBOMList()
}

const handleSearch = () => {
  loadBOMList()
}

const handleReset = () => {
  Object.assign(searchForm, {
    version: '',
    status: 'active'
  })
  handleSearch()
}

const handleRowClick = (row) => {
  selectedBOM.value = row
}

const handleCancel = () => {
  visible.value = false
  selectedBOM.value = null
}

const handleConfirm = () => {
  if (!selectedBOM.value) {
    ElMessage.warning('请选择一个BOM')
    return
  }
  
  emit('select', selectedBOM.value)
  visible.value = false
  selectedBOM.value = null
}

// 工具方法
const getStatusTagType = (status) => {
  const map = {
    active: 'success',
    draft: 'warning',
    inactive: 'danger'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = {
    active: '已激活',
    draft: '草稿',
    inactive: '已停用'
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

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

// 加载数据
const loadBOMList = async () => {
  loading.value = true
  try {
    // 这里调用API获取BOM列表
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    bomList.value = [
      {
        id: 1,
        version: 'V1.0',
        productName: '产品A',
        productCode: 'P001',
        status: 'active',
        materialCount: 5,
        createdBy: '张三',
        createdAt: '2024-01-01',
        materials: [
          {
            materialCode: 'M001',
            materialName: '物料A',
            specification: '规格A',
            unit: '个',
            quantity: 2,
            stock: 1000
          },
          {
            materialCode: 'M002',
            materialName: '物料B',
            specification: '规格B',
            unit: 'kg',
            quantity: 1.5,
            stock: 500
          },
          {
            materialCode: 'M003',
            materialName: '物料C',
            specification: '规格C',
            unit: '套',
            quantity: 1,
            stock: 50
          }
        ]
      },
      {
        id: 2,
        version: 'V2.0',
        productName: '产品A',
        productCode: 'P001',
        status: 'active',
        materialCount: 4,
        createdBy: '李四',
        createdAt: '2024-01-15',
        materials: [
          {
            materialCode: 'M001',
            materialName: '物料A',
            specification: '规格A',
            unit: '个',
            quantity: 2,
            stock: 1000
          },
          {
            materialCode: 'M002',
            materialName: '物料B',
            specification: '规格B',
            unit: 'kg',
            quantity: 1.2,
            stock: 500
          },
          {
            materialCode: 'M004',
            materialName: '物料D',
            specification: '规格D',
            unit: '件',
            quantity: 1,
            stock: 200
          }
        ]
      }
    ].filter(bom => {
      if (props.productId && bom.productCode !== `P${String(props.productId).padStart(3, '0')}`) {
        return false
      }
      if (searchForm.version && !bom.version.toLowerCase().includes(searchForm.version.toLowerCase())) {
        return false
      }
      if (searchForm.status && bom.status !== searchForm.status) {
        return false
      }
      return true
    })
  } catch (error) {
    ElMessage.error('获取BOM列表失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.bom-selector {
  .search-section {
    margin-bottom: 20px;
  }
  
  .bom-list {
    margin-bottom: 20px;
  }
  
  .bom-detail {
    h4 {
      margin: 0 0 12px 0;
      color: #303133;
      border-bottom: 1px solid #e4e7ed;
      padding-bottom: 8px;
    }
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}
</style>