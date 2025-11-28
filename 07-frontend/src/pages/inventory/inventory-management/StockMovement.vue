<template>
  <div class="stock-movement-container">
    <el-page-header content="库存流水" @back="$router.back()" />
    
    <el-card class="main-card" shadow="hover">
      <!-- 搜索栏 -->
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="流水号">
          <el-input v-model="searchForm.movementNo" placeholder="请输入流水号" clearable />
        </el-form-item>
        <el-form-item label="产品">
          <el-input v-model="searchForm.productName" placeholder="请输入产品名称" clearable />
        </el-form-item>
        <el-form-item label="业务类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable>
            <el-option label="入库" value="in" />
            <el-option label="出库" value="out" />
            <el-option label="调拨" value="transfer" />
            <el-option label="调整" value="adjust" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 流水列表 -->
      <el-table :data="movementList" border v-loading="loading">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="movementNo" label="流水号" width="180" />
        <el-table-column label="业务类型" width="100">
          <template #default="scope">
            <el-tag :type="getTypeTag(scope.row.type)">
              {{ getTypeText(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="productCode" label="产品编码" width="150" />
        <el-table-column prop="productName" label="产品名称" width="200" />
        <el-table-column label="数量变化" width="150">
          <template #default="scope">
            <span :style="{ color: scope.row.quantity > 0 ? '#67c23a' : '#f56c6c', fontWeight: 'bold' }">
              {{ scope.row.quantity > 0 ? '+' : '' }}{{ scope.row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="beforeQuantity" label="变化前" width="100" />
        <el-table-column prop="afterQuantity" label="变化后" width="100" />
        <el-table-column prop="warehouseName" label="仓库" width="120" />
        <el-table-column prop="operator" label="操作人" width="100" />
        <el-table-column prop="operateTime" label="操作时间" width="180" />
        <el-table-column label="操作" fixed="right" width="120">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="viewDetail(scope.row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadMovementList"
        @current-change="loadMovementList"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="showDetail" title="流水详情" width="700px">
      <el-descriptions :column="2" border v-if="currentMovement">
        <el-descriptions-item label="流水号" :span="2">{{ currentMovement.movementNo }}</el-descriptions-item>
        <el-descriptions-item label="业务类型">
          <el-tag :type="getTypeTag(currentMovement.type)">
            {{ getTypeText(currentMovement.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="单据号">{{ currentMovement.documentNo }}</el-descriptions-item>
        <el-descriptions-item label="产品编码">{{ currentMovement.productCode }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ currentMovement.productName }}</el-descriptions-item>
        <el-descriptions-item label="数量变化">
          <span :style="{ color: currentMovement.quantity > 0 ? '#67c23a' : '#f56c6c', fontWeight: 'bold' }">
            {{ currentMovement.quantity > 0 ? '+' : '' }}{{ currentMovement.quantity }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="单位">{{ currentMovement.unit }}</el-descriptions-item>
        <el-descriptions-item label="变化前数量">{{ currentMovement.beforeQuantity }}</el-descriptions-item>
        <el-descriptions-item label="变化后数量">{{ currentMovement.afterQuantity }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ currentMovement.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="库位">{{ currentMovement.locationName }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentMovement.operator }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ currentMovement.operateTime }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentMovement.remark || '无' }}</el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button type="primary" @click="showDetail = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { stockMovementApi } from '@/api/inventory'

const route = useRoute()

// 响应式数据
const loading = ref(false)
const showDetail = ref(false)
const movementList = ref([])
const currentMovement = ref(null)
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

const searchForm = reactive({
  movementNo: '',
  productName: '',
  type: '',
  dateRange: []
})

// 方法
const loadMovementList = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      productId: route.query.productId,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
    const res = await stockMovementApi.getMovementList(params)
    movementList.value = res.data?.records || mockMovementData()
    total.value = res.data?.total || 100
  } catch (error) {
    console.error('加载流水列表失败:', error)
    movementList.value = mockMovementData()
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  loadMovementList()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    movementNo: '',
    productName: '',
    type: '',
    dateRange: []
  })
  handleSearch()
}

const viewDetail = async (row) => {
  try {
    const res = await stockMovementApi.getMovementDetail(row.id)
    currentMovement.value = res.data || { ...row, documentNo: 'DOC20240115001', unit: '件', locationName: 'A-1-01', remark: '' }
    showDetail.value = true
  } catch (error) {
    console.error('加载流水详情失败:', error)
    currentMovement.value = { ...row, documentNo: 'DOC20240115001', unit: '件', locationName: 'A-1-01', remark: '' }
    showDetail.value = true
  }
}

const getTypeTag = (type) => {
  const tagMap = {
    in: 'success',
    out: 'danger',
    transfer: 'warning',
    adjust: 'info'
  }
  return tagMap[type] || ''
}

const getTypeText = (type) => {
  const textMap = {
    in: '入库',
    out: '出库',
    transfer: '调拨',
    adjust: '调整'
  }
  return textMap[type] || '未知'
}

const mockMovementData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    movementNo: `M${String(Date.now() + i).slice(-10)}`,
    type: ['in', 'out', 'transfer', 'adjust'][i % 4],
    productCode: `P${String(i + 1001).padStart(6, '0')}`,
    productName: `产品${i + 1}`,
    quantity: i % 2 === 0 ? Math.floor(Math.random() * 100) + 10 : -(Math.floor(Math.random() * 100) + 10),
    beforeQuantity: Math.floor(Math.random() * 500) + 200,
    afterQuantity: Math.floor(Math.random() * 500) + 200,
    warehouseName: '主仓库',
    operator: '张三',
    operateTime: '2024-01-15 10:30:00'
  }))
}

onMounted(() => {
  loadMovementList()
})
</script>

<style scoped>
.stock-movement-container {
  padding: 20px;
}

.main-card {
  margin-top: 20px;
}
</style>
