<template>
  <div class="inventory-detail-container">
    <el-page-header content="库存详情" @back="$router.back()" />
    
    <el-card class="main-card" shadow="hover" v-loading="loading">
      <!-- 基本信息 -->
      <el-descriptions title="基本信息" :column="3" border>
        <el-descriptions-item label="产品编码">{{ detail.productCode }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ detail.productName }}</el-descriptions-item>
        <el-descriptions-item label="产品规格">{{ detail.specification }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detail.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="库位">{{ detail.locationName }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ detail.unit }}</el-descriptions-item>
      </el-descriptions>

      <!-- 库存信息 -->
      <el-descriptions title="库存信息" :column="3" border class="mt-20">
        <el-descriptions-item label="当前库存">
          <el-tag :type="getQuantityType(detail.quantity, detail.safetyStock)" size="large">
            {{ detail.quantity }} {{ detail.unit }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="可用数量">
          {{ detail.availableQuantity }} {{ detail.unit }}
        </el-descriptions-item>
        <el-descriptions-item label="锁定数量">
          {{ detail.lockedQuantity }} {{ detail.unit }}
        </el-descriptions-item>
        <el-descriptions-item label="安全库存">
          {{ detail.safetyStock }} {{ detail.unit }}
        </el-descriptions-item>
        <el-descriptions-item label="最高库存">
          {{ detail.maxStock }} {{ detail.unit }}
        </el-descriptions-item>
        <el-descriptions-item label="最低库存">
          {{ detail.minStock }} {{ detail.unit }}
        </el-descriptions-item>
        <el-descriptions-item label="库存状态">
          <el-tag :type="getStockStatusType(detail.stockStatus)">
            {{ getStockStatusText(detail.stockStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="平均成本">
          ¥{{ detail.averageCost }}
        </el-descriptions-item>
        <el-descriptions-item label="库存总值">
          ¥{{ (detail.quantity * detail.averageCost).toFixed(2) }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 批次信息 -->
      <el-divider content-position="left">批次信息</el-divider>
      <el-table :data="batchList" border>
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="batchNo" label="批次号" width="150" />
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column prop="productionDate" label="生产日期" width="150" />
        <el-table-column prop="expiryDate" label="过期日期" width="150" />
        <el-table-column label="剩余天数" width="120">
          <template #default="scope">
            <el-tag :type="getExpiryType(scope.row.expiryDate)">
              {{ getDaysRemaining(scope.row.expiryDate) }} 天
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'normal' ? 'success' : 'danger'">
              {{ scope.row.status === 'normal' ? '正常' : '过期' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" />
      </el-table>

      <!-- 最近流水 -->
      <el-divider content-position="left">最近流水（最近10条）</el-divider>
      <el-table :data="recentMovements" border>
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="movementNo" label="流水号" width="180" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="scope">
            <el-tag :type="getMovementTypeTag(scope.row.type)">
              {{ scope.row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数量变化" width="150">
          <template #default="scope">
            <span :style="{ color: scope.row.quantity > 0 ? '#67c23a' : '#f56c6c' }">
              {{ scope.row.quantity > 0 ? '+' : '' }}{{ scope.row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="beforeQuantity" label="变化前" width="100" />
        <el-table-column prop="afterQuantity" label="变化后" width="100" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="operateTime" label="操作时间" width="180" />
        <el-table-column prop="remark" label="备注" />
      </el-table>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" @click="handleAdjust">库存调整</el-button>
        <el-button type="success" @click="handleTransfer">库存调拨</el-button>
        <el-button @click="viewAllMovements">查看全部流水</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { inventoryApi, stockMovementApi } from '@/api/inventory'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const detail = ref({})
const batchList = ref([])
const recentMovements = ref([])

// 方法
const loadDetail = async () => {
  loading.value = true
  try {
    const id = route.query.id
    const res = await inventoryApi.getInventoryDetail(id)
    detail.value = res.data || mockDetailData()
  } catch (error) {
    console.error('加载库存详情失败:', error)
    detail.value = mockDetailData()
  } finally {
    loading.value = false
  }
}

const loadBatchList = () => {
  batchList.value = [
    {
      batchNo: 'B20240115001',
      quantity: 500,
      productionDate: '2024-01-15',
      expiryDate: '2025-01-15',
      status: 'normal',
      remark: '第一批次'
    },
    {
      batchNo: 'B20240110001',
      quantity: 300,
      productionDate: '2024-01-10',
      expiryDate: '2024-12-10',
      status: 'normal',
      remark: '第二批次'
    }
  ]
}

const loadRecentMovements = async () => {
  try {
    const params = {
      productId: detail.value.productId,
      pageNum: 1,
      pageSize: 10
    }
    const res = await stockMovementApi.getMovementList(params)
    recentMovements.value = res.data?.records || mockMovementData()
  } catch (error) {
    console.error('加载流水记录失败:', error)
    recentMovements.value = mockMovementData()
  }
}

const getQuantityType = (quantity, safetyStock) => {
  if (quantity <= safetyStock * 0.5) return 'danger'
  if (quantity <= safetyStock) return 'warning'
  return 'success'
}

const getStockStatusType = (status) => {
  const typeMap = {
    normal: 'success',
    warning: 'warning',
    shortage: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStockStatusText = (status) => {
  const textMap = {
    normal: '正常',
    warning: '预警',
    shortage: '缺货'
  }
  return textMap[status] || '未知'
}

const getExpiryType = (expiryDate) => {
  const days = getDaysRemaining(expiryDate)
  if (days <= 30) return 'danger'
  if (days <= 90) return 'warning'
  return 'success'
}

const getDaysRemaining = (expiryDate) => {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diff = expiry - now
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const getMovementTypeTag = (type) => {
  const tagMap = {
    '入库': 'success',
    '出库': 'danger',
    '调拨': 'warning',
    '调整': 'info'
  }
  return tagMap[type] || ''
}

const handleAdjust = () => {
  router.push({
    path: '/inventory/inventory-management/adjustment',
    query: { inventoryId: detail.value.id }
  })
}

const handleTransfer = () => {
  router.push({
    path: '/inventory/inventory-management/transfer',
    query: { inventoryId: detail.value.id }
  })
}

const viewAllMovements = () => {
  router.push({
    path: '/inventory/inventory-management/movement',
    query: { productId: detail.value.productId }
  })
}

const mockDetailData = () => {
  return {
    id: 1,
    productCode: 'P001001',
    productName: '测试产品A',
    productId: 1,
    specification: '500g/袋',
    warehouseName: '主仓库',
    locationName: 'A-1-01',
    unit: '件',
    quantity: 850,
    availableQuantity: 750,
    lockedQuantity: 100,
    safetyStock: 200,
    maxStock: 1000,
    minStock: 100,
    averageCost: 125.50,
    stockStatus: 'normal'
  }
}

const mockMovementData = () => {
  return [
    {
      movementNo: 'M20240115001',
      type: '入库',
      quantity: 100,
      beforeQuantity: 750,
      afterQuantity: 850,
      operator: '张三',
      operateTime: '2024-01-15 10:30:00',
      remark: '采购入库'
    },
    {
      movementNo: 'M20240114001',
      type: '出库',
      quantity: -50,
      beforeQuantity: 800,
      afterQuantity: 750,
      operator: '李四',
      operateTime: '2024-01-14 15:20:00',
      remark: '销售出库'
    }
  ]
}

onMounted(() => {
  loadDetail()
  loadBatchList()
  setTimeout(() => {
    loadRecentMovements()
  }, 500)
})
</script>

<style scoped>
.inventory-detail-container {
  padding: 20px;
}

.main-card {
  margin-top: 20px;
}

.mt-20 {
  margin-top: 20px;
}

.action-buttons {
  margin-top: 30px;
  text-align: center;
}
</style>
