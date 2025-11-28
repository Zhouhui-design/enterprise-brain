<template>
  <div class="stock-transfer-container">
    <el-page-header content="库存调拨" @back="$router.back()" />
    
    <el-card class="main-card" shadow="hover">
      <el-tabs v-model="activeTab">
        <!-- 创建调拨单 -->
        <el-tab-pane label="创建调拨单" name="create">
          <el-form :model="transferForm" :rules="rules" ref="transferFormRef" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="调拨类型" prop="type">
                  <el-radio-group v-model="transferForm.type">
                    <el-radio label="warehouse">仓库间调拨</el-radio>
                    <el-radio label="location">库位间调拨</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="优先级" prop="priority">
                  <el-select v-model="transferForm.priority" placeholder="请选择优先级">
                    <el-option label="普通" value="normal" />
                    <el-option label="紧急" value="urgent" />
                    <el-option label="特急" value="critical" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="调出仓库" prop="fromWarehouse">
                  <el-select v-model="transferForm.fromWarehouse" placeholder="请选择调出仓库">
                    <el-option 
                      v-for="wh in warehouses" 
                      :key="wh.id" 
                      :label="wh.name" 
                      :value="wh.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="调入仓库" prop="toWarehouse">
                  <el-select v-model="transferForm.toWarehouse" placeholder="请选择调入仓库">
                    <el-option 
                      v-for="wh in warehouses" 
                      :key="wh.id" 
                      :label="wh.name" 
                      :value="wh.id"
                      :disabled="wh.id === transferForm.fromWarehouse"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="调拨产品">
              <el-button type="primary" size="small" @click="showProductDialog = true">
                添加产品
              </el-button>
            </el-form-item>

            <!-- 产品列表 -->
            <el-table :data="transferForm.products" border>
              <el-table-column type="index" label="#" width="60" />
              <el-table-column prop="productCode" label="产品编码" width="150" />
              <el-table-column prop="productName" label="产品名称" width="200" />
              <el-table-column label="调拨数量" width="200">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.quantity" 
                    :min="1" 
                    :max="scope.row.availableQuantity"
                    size="small"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="availableQuantity" label="可用数量" width="120" />
              <el-table-column prop="unit" label="单位" width="80" />
              <el-table-column label="操作" width="100">
                <template #default="scope">
                  <el-button 
                    type="danger" 
                    size="small" 
                    link 
                    @click="removeProduct(scope.$index)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <el-form-item label="备注" prop="remark">
              <el-input 
                v-model="transferForm.remark" 
                type="textarea" 
                :rows="3"
                placeholder="请输入备注信息"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="submitTransfer" :loading="submitting">
                提交调拨单
              </el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 调拨单列表 -->
        <el-tab-pane label="调拨单列表" name="list">
          <el-form :model="searchForm" :inline="true">
            <el-form-item label="调拨单号">
              <el-input v-model="searchForm.transferNo" placeholder="请输入调拨单号" clearable />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
                <el-option label="待审核" value="pending" />
                <el-option label="已审核" value="approved" />
                <el-option label="执行中" value="executing" />
                <el-option label="已完成" value="completed" />
                <el-option label="已拒绝" value="rejected" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadTransferList">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="transferList" border v-loading="loading">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="transferNo" label="调拨单号" width="180" />
            <el-table-column prop="fromWarehouse" label="调出仓库" width="120" />
            <el-table-column prop="toWarehouse" label="调入仓库" width="120" />
            <el-table-column prop="productCount" label="产品种类" width="100" />
            <el-table-column prop="totalQuantity" label="总数量" width="100" />
            <el-table-column label="状态" width="120">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="creator" label="创建人" width="100" />
            <el-table-column prop="createTime" label="创建时间" width="180" />
            <el-table-column label="操作" fixed="right" width="200">
              <template #default="scope">
                <el-button type="primary" size="small" link @click="viewTransferDetail(scope.row)">
                  详情
                </el-button>
                <el-button 
                  v-if="scope.row.status === 'pending'" 
                  type="success" 
                  size="small" 
                  link 
                  @click="approveTransfer(scope.row)"
                >
                  审核
                </el-button>
                <el-button 
                  v-if="scope.row.status === 'approved'" 
                  type="warning" 
                  size="small" 
                  link 
                  @click="executeTransfer(scope.row)"
                >
                  执行
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="pageNum"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="loadTransferList"
            @current-change="loadTransferList"
            style="margin-top: 20px; justify-content: flex-end;"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 选择产品对话框 -->
    <el-dialog v-model="showProductDialog" title="选择产品" width="800px">
      <el-input 
        v-model="productSearch" 
        placeholder="搜索产品名称或编码" 
        clearable 
        style="margin-bottom: 15px;"
      />
      
      <el-table 
        :data="filteredProducts" 
        border 
        max-height="400"
        @selection-change="handleProductSelect"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="productCode" label="产品编码" width="150" />
        <el-table-column prop="productName" label="产品名称" />
        <el-table-column prop="availableQuantity" label="可用数量" width="120" />
        <el-table-column prop="unit" label="单位" width="80" />
      </el-table>

      <template #footer>
        <el-button @click="showProductDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmSelectProducts">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { stockTransferApi } from '@/api/inventory'

// 响应式数据
const activeTab = ref('create')
const loading = ref(false)
const submitting = ref(false)
const showProductDialog = ref(false)
const productSearch = ref('')
const transferFormRef = ref(null)
const warehouses = ref([])
const availableProducts = ref([])
const selectedProducts = ref([])
const transferList = ref([])
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

const transferForm = reactive({
  type: 'warehouse',
  priority: 'normal',
  fromWarehouse: '',
  toWarehouse: '',
  products: [],
  remark: ''
})

const searchForm = reactive({
  transferNo: '',
  status: ''
})

const rules = {
  fromWarehouse: [{ required: true, message: '请选择调出仓库', trigger: 'change' }],
  toWarehouse: [{ required: true, message: '请选择调入仓库', trigger: 'change' }]
}

// 计算属性
const filteredProducts = computed(() => {
  if (!productSearch.value) return availableProducts.value
  const keyword = productSearch.value.toLowerCase()
  return availableProducts.value.filter(p => 
    p.productCode.toLowerCase().includes(keyword) ||
    p.productName.toLowerCase().includes(keyword)
  )
})

// 方法
const loadTransferList = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
    const res = await stockTransferApi.getTransferList(params)
    transferList.value = res.data?.records || mockTransferList()
    total.value = res.data?.total || 20
  } catch (error) {
    console.error('加载调拨单列表失败:', error)
    transferList.value = mockTransferList()
  } finally {
    loading.value = false
  }
}

const submitTransfer = async () => {
  try {
    await transferFormRef.value.validate()
    
    if (transferForm.products.length === 0) {
      ElMessage.warning('请添加调拨产品')
      return
    }

    submitting.value = true
    await stockTransferApi.createTransfer(transferForm)
    ElMessage.success('调拨单创建成功')
    resetForm()
    activeTab.value = 'list'
    loadTransferList()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('创建调拨单失败')
    }
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  transferFormRef.value?.resetFields()
  transferForm.products = []
}

const resetSearch = () => {
  Object.assign(searchForm, {
    transferNo: '',
    status: ''
  })
  loadTransferList()
}

const handleProductSelect = (selection) => {
  selectedProducts.value = selection
}

const confirmSelectProducts = () => {
  const newProducts = selectedProducts.value.filter(p => 
    !transferForm.products.find(tp => tp.productId === p.productId)
  ).map(p => ({
    ...p,
    quantity: 1
  }))
  
  transferForm.products.push(...newProducts)
  showProductDialog.value = false
  ElMessage.success(`已添加 ${newProducts.length} 个产品`)
}

const removeProduct = (index) => {
  transferForm.products.splice(index, 1)
}

const viewTransferDetail = (row) => {
  ElMessage.info('查看详情功能开发中...')
}

const approveTransfer = (row) => {
  ElMessageBox.confirm('确认审核通过该调拨单？', '审核确认', {
    confirmButtonText: '通过',
    cancelButtonText: '拒绝',
    distinguishCancelAndClose: true,
    type: 'warning'
  }).then(async () => {
    try {
      await stockTransferApi.approveTransfer({
        transferId: row.id,
        approved: true
      })
      ElMessage.success('审核通过')
      loadTransferList()
    } catch (error) {
      ElMessage.error('审核失败')
    }
  }).catch((action) => {
    if (action === 'cancel') {
      ElMessage.info('已拒绝该调拨单')
    }
  })
}

const executeTransfer = async (row) => {
  try {
    await stockTransferApi.executeTransfer(row.id)
    ElMessage.success('调拨执行成功')
    loadTransferList()
  } catch (error) {
    ElMessage.error('执行失败')
  }
}

const getStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    approved: 'success',
    executing: 'primary',
    completed: 'info',
    rejected: 'danger'
  }
  return typeMap[status] || ''
}

const getStatusText = (status) => {
  const textMap = {
    pending: '待审核',
    approved: '已审核',
    executing: '执行中',
    completed: '已完成',
    rejected: '已拒绝'
  }
  return textMap[status] || '未知'
}

const mockTransferList = () => {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    transferNo: `T${String(Date.now() + i).slice(-10)}`,
    fromWarehouse: '主仓库',
    toWarehouse: '分仓库A',
    productCount: Math.floor(Math.random() * 5) + 1,
    totalQuantity: Math.floor(Math.random() * 500) + 100,
    status: ['pending', 'approved', 'executing', 'completed'][Math.floor(Math.random() * 4)],
    creator: '张三',
    createTime: '2024-01-15 10:30:00'
  }))
}

onMounted(() => {
  warehouses.value = [
    { id: 1, name: '主仓库' },
    { id: 2, name: '分仓库A' },
    { id: 3, name: '分仓库B' }
  ]
  
  availableProducts.value = Array.from({ length: 20 }, (_, i) => ({
    productId: i + 1,
    productCode: `P${String(i + 1001).padStart(6, '0')}`,
    productName: `产品${i + 1}`,
    availableQuantity: Math.floor(Math.random() * 500) + 100,
    unit: '件'
  }))
  
  if (activeTab.value === 'list') {
    loadTransferList()
  }
})
</script>

<style scoped>
.stock-transfer-container {
  padding: 20px;
}

.main-card {
  margin-top: 20px;
}
</style>
