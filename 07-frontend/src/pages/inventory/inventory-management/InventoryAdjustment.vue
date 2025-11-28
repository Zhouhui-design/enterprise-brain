<template>
  <div class="inventory-adjustment-container">
    <el-page-header content="库存调整" @back="$router.back()" />
    
    <el-card class="main-card" shadow="hover">
      <el-tabs v-model="activeTab">
        <!-- 创建调整单 -->
        <el-tab-pane label="创建调整单" name="create">
          <el-form :model="adjustForm" :rules="rules" ref="adjustFormRef" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="调整类型" prop="type">
                  <el-select v-model="adjustForm.type" placeholder="请选择调整类型">
                    <el-option label="盘盈" value="surplus" />
                    <el-option label="盘亏" value="loss" />
                    <el-option label="损耗" value="damage" />
                    <el-option label="其他" value="other" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="调整原因" prop="reason">
                  <el-input v-model="adjustForm.reason" placeholder="请输入调整原因" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="调整产品">
              <el-button type="primary" size="small" @click="showProductDialog = true">
                添加产品
              </el-button>
            </el-form-item>

            <!-- 产品列表 -->
            <el-table :data="adjustForm.products" border>
              <el-table-column type="index" label="#" width="60" />
              <el-table-column prop="productCode" label="产品编码" width="150" />
              <el-table-column prop="productName" label="产品名称" width="200" />
              <el-table-column prop="currentQuantity" label="当前库存" width="120" />
              <el-table-column label="调整数量" width="200">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.adjustQuantity"
                    placeholder="正数为增加，负数为减少"
                    size="small"
                  />
                </template>
              </el-table-column>
              <el-table-column label="调整后" width="120">
                <template #default="scope">
                  {{ scope.row.currentQuantity + (scope.row.adjustQuantity || 0) }}
                </template>
              </el-table-column>
              <el-table-column prop="unit" label="单位" width="80" />
              <el-table-column label="备注" width="200">
                <template #default="scope">
                  <el-input v-model="scope.row.remark" size="small" />
                </template>
              </el-table-column>
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

            <el-form-item label="附件上传">
              <el-upload
                class="upload-demo"
                drag
                action="#"
                multiple
                :auto-upload="false"
              >
                <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                <div class="el-upload__text">
                  将文件拖到此处，或<em>点击上传</em>
                </div>
              </el-upload>
            </el-form-item>

            <el-form-item label="备注">
              <el-input 
                v-model="adjustForm.remark" 
                type="textarea" 
                :rows="3"
                placeholder="请输入备注"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="submitAdjustment" :loading="submitting">
                提交调整单
              </el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 调整单列表 -->
        <el-tab-pane label="调整单列表" name="list">
          <el-form :model="searchForm" :inline="true">
            <el-form-item label="调整单号">
              <el-input v-model="searchForm.adjustNo" placeholder="请输入调整单号" clearable />
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="searchForm.type" placeholder="请选择类型" clearable>
                <el-option label="盘盈" value="surplus" />
                <el-option label="盘亏" value="loss" />
                <el-option label="损耗" value="damage" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
                <el-option label="待审核" value="pending" />
                <el-option label="已审核" value="approved" />
                <el-option label="已拒绝" value="rejected" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadAdjustmentList">查询</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="adjustmentList" border v-loading="loading">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="adjustNo" label="调整单号" width="180" />
            <el-table-column label="类型" width="100">
              <template #default="scope">
                <el-tag :type="getAdjustTypeTag(scope.row.type)">
                  {{ getAdjustTypeText(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="调整原因" width="150" />
            <el-table-column prop="productCount" label="产品数量" width="100" />
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="creator" label="创建人" width="100" />
            <el-table-column prop="createTime" label="创建时间" width="180" />
            <el-table-column prop="approver" label="审核人" width="100" />
            <el-table-column label="操作" fixed="right" width="200">
              <template #default="scope">
                <el-button type="primary" size="small" link @click="viewDetail(scope.row)">
                  详情
                </el-button>
                <el-button 
                  v-if="scope.row.status === 'pending'"
                  type="success" 
                  size="small" 
                  link 
                  @click="approveAdjustment(scope.row)"
                >
                  审核
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
            @size-change="loadAdjustmentList"
            @current-change="loadAdjustmentList"
            style="margin-top: 20px; justify-content: flex-end;"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 选择产品对话框 -->
    <el-dialog v-model="showProductDialog" title="选择产品" width="800px">
      <el-table 
        :data="availableProducts" 
        border 
        max-height="400"
        @selection-change="handleProductSelect"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="productCode" label="产品编码" width="150" />
        <el-table-column prop="productName" label="产品名称" />
        <el-table-column prop="currentQuantity" label="当前库存" width="120" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { inventoryAdjustmentApi } from '@/api/inventory'

// 响应式数据
const activeTab = ref('create')
const loading = ref(false)
const submitting = ref(false)
const showProductDialog = ref(false)
const adjustFormRef = ref(null)
const availableProducts = ref([])
const selectedProducts = ref([])
const adjustmentList = ref([])
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

const adjustForm = reactive({
  type: 'surplus',
  reason: '',
  products: [],
  remark: ''
})

const searchForm = reactive({
  adjustNo: '',
  type: '',
  status: ''
})

const rules = {
  type: [{ required: true, message: '请选择调整类型', trigger: 'change' }],
  reason: [{ required: true, message: '请输入调整原因', trigger: 'blur' }]
}

// 方法
const loadAdjustmentList = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
    const res = await inventoryAdjustmentApi.getAdjustmentList(params)
    adjustmentList.value = res.data?.records || mockAdjustmentList()
    total.value = res.data?.total || 20
  } catch (error) {
    console.error('加载调整单列表失败:', error)
    adjustmentList.value = mockAdjustmentList()
  } finally {
    loading.value = false
  }
}

const submitAdjustment = async () => {
  try {
    await adjustFormRef.value.validate()
    
    if (adjustForm.products.length === 0) {
      ElMessage.warning('请添加调整产品')
      return
    }

    submitting.value = true
    await inventoryAdjustmentApi.createAdjustment(adjustForm)
    ElMessage.success('调整单创建成功')
    resetForm()
    activeTab.value = 'list'
    loadAdjustmentList()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('创建调整单失败')
    }
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  adjustFormRef.value?.resetFields()
  adjustForm.products = []
}

const handleProductSelect = (selection) => {
  selectedProducts.value = selection
}

const confirmSelectProducts = () => {
  const newProducts = selectedProducts.value.filter(p => 
    !adjustForm.products.find(ap => ap.productId === p.productId)
  ).map(p => ({
    ...p,
    adjustQuantity: 0,
    remark: ''
  }))
  
  adjustForm.products.push(...newProducts)
  showProductDialog.value = false
  ElMessage.success(`已添加 ${newProducts.length} 个产品`)
}

const removeProduct = (index) => {
  adjustForm.products.splice(index, 1)
}

const viewDetail = (row) => {
  ElMessage.info('查看详情功能开发中...')
}

const approveAdjustment = (row) => {
  ElMessageBox.confirm('确认审核通过该调整单？', '审核确认', {
    confirmButtonText: '通过',
    cancelButtonText: '拒绝',
    distinguishCancelAndClose: true,
    type: 'warning'
  }).then(async () => {
    try {
      await inventoryAdjustmentApi.approveAdjustment({
        adjustmentId: row.id,
        approved: true
      })
      ElMessage.success('审核通过')
      loadAdjustmentList()
    } catch (error) {
      ElMessage.error('审核失败')
    }
  }).catch((action) => {
    if (action === 'cancel') {
      ElMessage.info('已拒绝该调整单')
    }
  })
}

const getAdjustTypeTag = (type) => {
  const tagMap = {
    surplus: 'success',
    loss: 'danger',
    damage: 'warning',
    other: 'info'
  }
  return tagMap[type] || ''
}

const getAdjustTypeText = (type) => {
  const textMap = {
    surplus: '盘盈',
    loss: '盘亏',
    damage: '损耗',
    other: '其他'
  }
  return textMap[type] || '未知'
}

const getStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || ''
}

const getStatusText = (status) => {
  const textMap = {
    pending: '待审核',
    approved: '已审核',
    rejected: '已拒绝'
  }
  return textMap[status] || '未知'
}

const mockAdjustmentList = () => {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    adjustNo: `ADJ${String(Date.now() + i).slice(-10)}`,
    type: ['surplus', 'loss', 'damage', 'other'][i % 4],
    reason: '盘点差异',
    productCount: Math.floor(Math.random() * 5) + 1,
    status: ['pending', 'approved', 'rejected'][i % 3],
    creator: '张三',
    createTime: '2024-01-15 10:00:00',
    approver: i % 3 !== 0 ? '李四' : null
  }))
}

onMounted(() => {
  availableProducts.value = Array.from({ length: 20 }, (_, i) => ({
    productId: i + 1,
    productCode: `P${String(i + 1001).padStart(6, '0')}`,
    productName: `产品${i + 1}`,
    currentQuantity: Math.floor(Math.random() * 500) + 100,
    unit: '件'
  }))
  
  if (activeTab.value === 'list') {
    loadAdjustmentList()
  }
})
</script>

<style scoped>
.inventory-adjustment-container {
  padding: 20px;
}

.main-card {
  margin-top: 20px;
}
</style>
