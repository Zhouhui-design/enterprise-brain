<template>
  <div class="inventory-list">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>库存管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog = true">
          <i class="fas fa-plus"></i> 添加商品
        </el-button>
        <el-button @click="importInventory">
          <i class="fas fa-upload"></i> 导入库存
        </el-button>
        <el-button @click="exportInventory">
          <i class="fas fa-download"></i> 导出库存
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(stat, index) in statsData" :key="index">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" :style="{ backgroundColor: stat.color }">
                <i :class="stat.icon"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
                <div class="stat-trend" :class="stat.trend">
                  <i :class="stat.trend === 'up' ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
                  {{ stat.change }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索筛选 -->
    <div class="filter-section">
      <el-card>
        <el-form :model="searchForm" inline>
          <el-form-item label="商品编号">
            <el-input v-model="searchForm.productCode" placeholder="请输入商品编号" clearable />
          </el-form-item>
          <el-form-item label="商品名称">
            <el-input v-model="searchForm.productName" placeholder="请输入商品名称" clearable />
          </el-form-item>
          <el-form-item label="分类">
            <el-select v-model="searchForm.category" placeholder="请选择分类" clearable>
              <el-option label="电子产品" value="electronics" />
              <el-option label="服装" value="clothing" />
              <el-option label="食品" value="food" />
              <el-option label="家居" value="home" />
            </el-select>
          </el-form-item>
          <el-form-item label="库存状态">
            <el-select v-model="searchForm.stockStatus" placeholder="请选择库存状态" clearable>
              <el-option label="充足" value="sufficient" />
              <el-option label="正常" value="normal" />
              <el-option label="低库存" value="low" />
              <el-option label="缺货" value="out" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 库存列表 -->
    <div class="inventory-table">
      <el-card>
        <template #header>
          <div class="table-header">
            <span>库存列表</span>
            <div class="table-actions">
              <el-button size="small" @click="refreshData" :loading="refreshing">
                <i class="fas fa-sync"></i> 刷新
              </el-button>
              <el-button size="small" @click="showBatchDialog = true" :disabled="selectedItems.length === 0">
                批量操作
              </el-button>
            </div>
          </div>
        </template>
        
        <el-table 
          :data="filteredInventory" 
          v-loading="loading" 
          stripe
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="productImage" label="图片" width="80">
            <template #default="{ row }">
              <el-image
                :src="row.productImage"
                :preview-src-list="[row.productImage]"
                fit="cover"
                style="width: 40px; height: 40px; border-radius: 4px;"
                lazy
              >
                <template #error>
                  <div class="image-placeholder">
                    <i class="fas fa-image"></i>
                  </div>
                </template>
              </el-image>
            </template>
          </el-table-column>
          <el-table-column prop="productCode" label="商品编号" width="120" />
          <el-table-column prop="productName" label="商品名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="category" label="分类" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ getCategoryLabel(row.category) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="stock" label="库存数量" width="100">
            <template #default="{ row }">
              <span :class="getStockClass(row.stock, row.minStock)">
                {{ row.stock }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="minStock" label="最低库存" width="100" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="unitPrice" label="单价" width="100">
            <template #default="{ row }">
              ¥{{ row.unitPrice.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="totalValue" label="库存总值" width="120">
            <template #default="{ row }">
              ¥{{ (row.stock * row.unitPrice).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="location" label="仓库位置" width="120" />
          <el-table-column prop="lastUpdated" label="更新时间" width="140" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewDetail(row)">详情</el-button>
              <el-button size="small" type="primary" @click="adjustStock(row)">调整</el-button>
              <el-dropdown @command="handleMoreAction" trigger="click">
                <el-button size="small">
                  更多<i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ action: 'history', row }">操作记录</el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'move', row }">移库</el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'alert', row }">库存预警</el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'delete', row }">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 库存详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="库存详情" width="800px">
      <div class="inventory-detail" v-if="selectedItem">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="商品编号">{{ selectedItem.productCode }}</el-descriptions-item>
          <el-descriptions-item label="商品名称">{{ selectedItem.productName }}</el-descriptions-item>
          <el-descriptions-item label="分类">
            <el-tag>{{ getCategoryLabel(selectedItem.category) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="品牌">{{ selectedItem.brand }}</el-descriptions-item>
          <el-descriptions-item label="规格">{{ selectedItem.specification }}</el-descriptions-item>
          <el-descriptions-item label="当前库存">{{ selectedItem.stock }} {{ selectedItem.unit }}</el-descriptions-item>
          <el-descriptions-item label="最低库存">{{ selectedItem.minStock }} {{ selectedItem.unit }}</el-descriptions-item>
          <el-descriptions-item label="安全库存">{{ selectedItem.safeStock }} {{ selectedItem.unit }}</el-descriptions-item>
          <el-descriptions-item label="单价">¥{{ selectedItem.unitPrice.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="库存总值">¥{{ (selectedItem.stock * selectedItem.unitPrice).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="仓库位置">{{ selectedItem.location }}</el-descriptions-item>
          <el-descriptions-item label="最后更新">{{ selectedItem.lastUpdated }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedItem.remarks || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 库存调整对话框 -->
    <el-dialog v-model="showAdjustDialog" title="库存调整" width="500px">
      <el-form :model="adjustForm" :rules="adjustRules" ref="adjustFormRef" label-width="100px">
        <el-form-item label="调整类型" prop="adjustType">
          <el-radio-group v-model="adjustForm.adjustType">
            <el-radio label="in">入库</el-radio>
            <el-radio label="out">出库</el-radio>
            <el-radio label="adjust">盘点调整</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="调整数量" prop="adjustQuantity">
          <el-input-number
            v-model="adjustForm.adjustQuantity"
            :min="1"
            :max="adjustForm.adjustType === 'out' ? (adjustingItem?.stock || 0) : 99999"
            placeholder="请输入调整数量"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="调整原因" prop="reason">
          <el-select v-model="adjustForm.reason" placeholder="请选择调整原因" style="width: 100%">
            <el-option label="采购入库" value="purchase" v-if="adjustForm.adjustType === 'in'" />
            <el-option label="生产入库" value="production" v-if="adjustForm.adjustType === 'in'" />
            <el-option label="退货入库" value="return" v-if="adjustForm.adjustType === 'in'" />
            <el-option label="销售出库" value="sale" v-if="adjustForm.adjustType === 'out'" />
            <el-option label="领用出库" value="usage" v-if="adjustForm.adjustType === 'out'" />
            <el-option label="损耗出库" value="loss" v-if="adjustForm.adjustType === 'out'" />
            <el-option label="盘点增加" value="count_plus" v-if="adjustForm.adjustType === 'adjust'" />
            <el-option label="盘亏减少" value="count_minus" v-if="adjustForm.adjustType === 'adjust'" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="adjustForm.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAdjustDialog = false">取消</el-button>
          <el-button type="primary" @click="submitAdjust" :loading="adjusting">
            确认调整
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加商品对话框 -->
    <el-dialog v-model="showAddDialog" title="添加商品" width="600px">
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品编号" prop="productCode">
              <el-input v-model="addForm.productCode" placeholder="请输入商品编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品名称" prop="productName">
              <el-input v-model="addForm.productName" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="addForm.category" placeholder="请选择分类" style="width: 100%">
                <el-option label="电子产品" value="electronics" />
                <el-option label="服装" value="clothing" />
                <el-option label="食品" value="food" />
                <el-option label="家居" value="home" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品牌" prop="brand">
              <el-input v-model="addForm.brand" placeholder="请输入品牌" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="当前库存" prop="stock">
              <el-input-number
                v-model="addForm.stock"
                :min="0"
                placeholder="库存数量"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最低库存" prop="minStock">
              <el-input-number
                v-model="addForm.minStock"
                :min="0"
                placeholder="最低库存"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="addForm.unit" placeholder="单位" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="单价" prop="unitPrice">
              <el-input-number
                v-model="addForm.unitPrice"
                :min="0"
                :precision="2"
                placeholder="单价"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仓库位置" prop="location">
              <el-input v-model="addForm.location" placeholder="请输入仓库位置" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="规格">
          <el-input v-model="addForm.specification" placeholder="请输入商品规格" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="saveProduct" :loading="saving">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface InventoryItem {
  id: string
  productCode: string
  productName: string
  category: string
  brand: string
  specification: string
  stock: number
  minStock: number
  safeStock: number
  unit: string
  unitPrice: number
  location: string
  lastUpdated: string
  remarks?: string
  productImage?: string
}

const loading = ref(false)
const refreshing = ref(false)
const saving = ref(false)
const adjusting = ref(false)
const showDetailDialog = ref(false)
const showAdjustDialog = ref(false)
const showAddDialog = ref(false)
const showBatchDialog = ref(false)
const selectedItem = ref<InventoryItem | null>(null)
const adjustingItem = ref<InventoryItem | null>(null)
const selectedItems = ref<InventoryItem[]>([])

const searchForm = reactive({
  productCode: '',
  productName: '',
  category: '',
  stockStatus: ''
})

const adjustForm = reactive({
  adjustType: 'in',
  adjustQuantity: null,
  reason: '',
  remarks: ''
})

const addForm = reactive({
  productCode: '',
  productName: '',
  category: '',
  brand: '',
  specification: '',
  stock: 0,
  minStock: 10,
  safeStock: 5,
  unit: '个',
  unitPrice: 0,
  location: ''
})

const adjustRules = {
  adjustType: [
    { required: true, message: '请选择调整类型', trigger: 'change' }
  ],
  adjustQuantity: [
    { required: true, message: '请输入调整数量', trigger: 'blur' }
  ],
  reason: [
    { required: true, message: '请选择调整原因', trigger: 'change' }
  ]
}

const addRules = {
  productCode: [
    { required: true, message: '请输入商品编号', trigger: 'blur' }
  ],
  productName: [
    { required: true, message: '请输入商品名称', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  stock: [
    { required: true, message: '请输入当前库存', trigger: 'blur' }
  ],
  minStock: [
    { required: true, message: '请输入最低库存', trigger: 'blur' }
  ],
  unitPrice: [
    { required: true, message: '请输入单价', trigger: 'blur' }
  ],
  location: [
    { required: true, message: '请输入仓库位置', trigger: 'blur' }
  ]
}

const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

const statsData = reactive([
  { label: '商品总数', value: '1,234', icon: 'fas fa-boxes', color: '#409EFF', trend: 'up', change: '8%' },
  { label: '库存总值', value: '¥2.5M', icon: 'fas fa-chart-line', color: '#67C23A', trend: 'up', change: '12%' },
  { label: '低库存预警', value: '23', icon: 'fas fa-exclamation-triangle', color: '#E6A23C', trend: 'down', change: '5' },
  { label: '缺货商品', value: '8', icon: 'fas fa-times-circle', color: '#F56C6C', trend: 'down', change: '3' }
])

const inventoryList = ref<InventoryItem[]>([
  {
    id: '1',
    productCode: 'PRD001',
    productName: '智能手机X1',
    category: 'electronics',
    brand: 'TechBrand',
    specification: '6.1寸 128GB',
    stock: 150,
    minStock: 50,
    safeStock: 30,
    unit: '台',
    unitPrice: 2999.00,
    location: 'A区-1-1',
    lastUpdated: '2024-01-15 10:30:00',
    productImage: 'https://via.placeholder.com/100x100/409eff/ffffff?text=PRD001'
  },
  {
    id: '2',
    productCode: 'PRD002',
    productName: '纯棉T恤',
    category: 'clothing',
    brand: 'FashionBrand',
    specification: 'L码 白色',
    stock: 25,
    minStock: 30,
    safeStock: 20,
    unit: '件',
    unitPrice: 99.00,
    location: 'B区-2-3',
    lastUpdated: '2024-01-14 15:20:00'
  }
])

const filteredInventory = computed(() => {
  let result = inventoryList.value
  
  if (searchForm.productCode) {
    result = result.filter(item => item.productCode.toLowerCase().includes(searchForm.productCode.toLowerCase()))
  }
  
  if (searchForm.productName) {
    result = result.filter(item => item.productName.toLowerCase().includes(searchForm.productName.toLowerCase()))
  }
  
  if (searchForm.category) {
    result = result.filter(item => item.category === searchForm.category)
  }
  
  if (searchForm.stockStatus) {
    result = result.filter(item => {
      const ratio = item.stock / item.minStock
      switch (searchForm.stockStatus) {
        case 'sufficient': return ratio >= 2
        case 'normal': return ratio >= 1 && ratio < 2
        case 'low': return ratio < 1 && ratio > 0
        case 'out': return item.stock === 0
        default: return true
      }
    })
  }
  
  pagination.total = result.length
  return result
})

const getCategoryLabel = (category: string) => {
  const categoryMap: Record<string, string> = {
    electronics: '电子产品',
    clothing: '服装',
    food: '食品',
    home: '家居'
  }
  return categoryMap[category] || category
}

const getStockClass = (stock: number, minStock: number) => {
  const ratio = stock / minStock
  if (stock === 0) return 'stock-out'
  if (ratio < 1) return 'stock-low'
  if (ratio < 2) return 'stock-normal'
  return 'stock-sufficient'
}

const handleSearch = () => {
  pagination.currentPage = 1
}

const resetSearch = () => {
  Object.assign(searchForm, {
    productCode: '',
    productName: '',
    category: '',
    stockStatus: ''
  })
  handleSearch()
}

const handleSelectionChange = (selection: InventoryItem[]) => {
  selectedItems.value = selection
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
}

const refreshData = async () => {
  refreshing.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('数据已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

const viewDetail = (item: InventoryItem) => {
  selectedItem.value = item
  showDetailDialog.value = true
}

const adjustStock = (item: InventoryItem) => {
  adjustingItem.value = item
  Object.assign(adjustForm, {
    adjustType: 'in',
    adjustQuantity: null,
    reason: '',
    remarks: ''
  })
  showAdjustDialog.value = true
}

const handleMoreAction = ({ action, row }: { action: string; row: InventoryItem }) => {
  const actionMessages: Record<string, string> = {
    history: `查看操作记录: ${row.productName}`,
    move: `移库操作: ${row.productName}`,
    alert: `设置库存预警: ${row.productName}`,
    delete: `删除商品: ${row.productName}`
  }
  
  if (action === 'delete') {
    ElMessageBox.confirm(`确认删除商品 "${row.productName}"？`, '确认删除', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      ElMessage.success('商品已删除')
    })
  } else {
    ElMessage.info(actionMessages[action] || '功能开发中')
  }
}

const submitAdjust = async () => {
  const formRef = ref()
  try {
    await formRef.value.validate()
    adjusting.value = true
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新库存
    if (adjustingItem.value) {
      const item = inventoryList.value.find(i => i.id === adjustingItem.value!.id)
      if (item) {
        if (adjustForm.adjustType === 'in' || adjustForm.adjustType === 'adjust') {
          item.stock += adjustForm.adjustQuantity!
        } else if (adjustForm.adjustType === 'out') {
          item.stock -= adjustForm.adjustQuantity!
        }
        item.lastUpdated = new Date().toLocaleString()
      }
    }
    
    ElMessage.success('库存调整成功')
    showAdjustDialog.value = false
  } catch (error) {
    ElMessage.error('调整失败')
  } finally {
    adjusting.value = false
  }
}

const saveProduct = async () => {
  const formRef = ref()
  try {
    await formRef.value.validate()
    saving.value = true
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    inventoryList.value.push({
      id: String(inventoryList.value.length + 1),
      ...addForm,
      safeStock: Math.floor(addForm.minStock * 0.5),
      lastUpdated: new Date().toLocaleString()
    })
    
    ElMessage.success('商品添加成功')
    showAddDialog.value = false
    Object.assign(addForm, {
      productCode: '',
      productName: '',
      category: '',
      brand: '',
      specification: '',
      stock: 0,
      minStock: 10,
      safeStock: 5,
      unit: '个',
      unitPrice: 0,
      location: ''
    })
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const importInventory = () => {
  ElMessage.success('导入功能开发中')
}

const exportInventory = () => {
  ElMessage.success('导出功能开发中')
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.inventory-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-overview {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 15px 0;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 16px;
}

.stat-icon i {
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stat-trend {
  font-size: 12px;
  margin-top: 3px;
}

.stat-trend.up {
  color: #67C23A;
}

.stat-trend.down {
  color: #F56C6C;
}

.filter-section {
  margin-bottom: 20px;
}

.inventory-table {
  background: white;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.stock-sufficient {
  color: #67C23A;
  font-weight: 500;
}

.stock-normal {
  color: #409EFF;
  font-weight: 500;
}

.stock-low {
  color: #E6A23C;
  font-weight: 500;
}

.stock-out {
  color: #F56C6C;
  font-weight: 500;
}

.image-placeholder {
  width: 40px;
  height: 40px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 16px;
}

.inventory-detail {
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .el-col-6 {
    margin-bottom: 15px;
  }
}
</style>