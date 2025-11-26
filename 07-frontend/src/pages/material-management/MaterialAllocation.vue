<template>
  <div class="material-allocation">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>物料分配管理</h2>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入分配单号或物料编码"
            prefix-icon="Search"
            clearable
          />
        </el-col>
        <el-col :span="8">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
          >
            <el-option label="待审核" value="pending" />
            <el-option label="已审核" value="approved" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top: 15px;">
        <el-col :span="8">
          <el-select
            v-model="searchForm.fromWarehouse"
            placeholder="请选择调出仓库"
            clearable
          >
            <el-option
              v-for="warehouse in warehouses"
              :key="warehouse.id"
              :label="warehouse.name"
              :value="warehouse.id"
            />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-select
            v-model="searchForm.toWarehouse"
            placeholder="请选择调入仓库"
            clearable
          >
            <el-option
              v-for="warehouse in warehouses"
              :key="warehouse.id"
              :label="warehouse.name"
              :value="warehouse.id"
            />
          </el-select>
        </el-col>
        <el-col :span="8" class="toolbar-actions">
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleCreate">新增分配单</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <div class="stat-card">
            <div class="stat-icon allocation">
              <el-icon><Management /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalAllocations }}</div>
              <div class="stat-label">本月分配单</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <div class="stat-card">
            <div class="stat-icon pending">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.pendingAllocations }}</div>
              <div class="stat-label">待审核</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <div class="stat-card">
            <div class="stat-icon approved">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.approvedAllocations }}</div>
              <div class="stat-label">已审核</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <div class="stat-card">
            <div class="stat-icon completed">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.completedAllocations }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 分配单列表 -->
    <div class="allocation-list">
      <div class="list-header">
        <h3>分配单列表</h3>
        <div class="list-actions">
          <el-button @click="handleBatchDelete" :disabled="selectedRows.length === 0">批量删除</el-button>
          <el-button @click="handleExport">导出数据</el-button>
        </div>
      </div>
      <el-table
        v-loading="loading"
        :data="filteredAllocations"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="allocationCode" label="分配单号" width="180" sortable />
        <el-table-column prop="allocationDate" label="分配日期" width="120" sortable />
        <el-table-column label="调出仓库" width="120">
          <template #default="scope">
            {{ getWarehouseName(scope.row.fromWarehouseId) }}
          </template>
        </el-table-column>
        <el-table-column label="调入仓库" width="120">
          <template #default="scope">
            {{ getWarehouseName(scope.row.toWarehouseId) }}
          </template>
        </el-table-column>
        <el-table-column label="分配原因" width="180">
          <template #default="scope">
            <el-tooltip :content="scope.row.reason" placement="top">
              <span class="ellipsis">{{ scope.row.reason }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="物料种类" width="100" align="center">
          <template #default="scope">
            {{ scope.row.items.length }}
          </template>
        </el-table-column>
        <el-table-column label="总数量" width="100" align="right">
          <template #default="scope">
            {{ calculateTotalQuantity(scope.row.items) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag
              :type="getStatusType(scope.row.status)"
              effect="light"
            >
              {{ getStatusName(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作人" width="120" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="handleView(scope.row)"
            >
              查看
            </el-button>
            <el-button
              v-if="scope.row.status === 'pending'"
              size="small"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="scope.row.status === 'pending'"
              type="danger"
              size="small"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
            <el-button
              v-if="scope.row.status === 'approved'"
              type="success"
              size="small"
              @click="handleComplete(scope.row)"
            >
              完成分配
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredAllocations.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 创建/编辑分配单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增分配单' : '编辑分配单'"
      width="80%"
      :before-close="handleDialogClose"
    >
      <el-form
        ref="allocationFormRef"
        :model="allocationForm"
        :rules="allocationRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="调出仓库" prop="fromWarehouseId">
              <el-select
                v-model="allocationForm.fromWarehouseId"
                placeholder="请选择调出仓库"
              >
                <el-option
                  v-for="warehouse in warehouses"
                  :key="warehouse.id"
                  :label="warehouse.name"
                  :value="warehouse.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="调入仓库" prop="toWarehouseId">
              <el-select
                v-model="allocationForm.toWarehouseId"
                placeholder="请选择调入仓库"
              >
                <el-option
                  v-for="warehouse in warehouses"
                  :key="warehouse.id"
                  :label="warehouse.name"
                  :value="warehouse.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分配日期" prop="allocationDate">
              <el-date-picker
                v-model="allocationForm.allocationDate"
                type="date"
                placeholder="请选择分配日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分配单号" prop="allocationCode" v-if="dialogType === 'edit'">
              <el-input v-model="allocationForm.allocationCode" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="分配原因" prop="reason">
          <el-input
            v-model="allocationForm.reason"
            type="textarea"
            placeholder="请输入分配原因"
            :rows="3"
          />
        </el-form-item>

        <!-- 物料明细 -->
        <el-form-item>
          <div class="items-header">
            <h4>物料明细</h4>
            <el-button type="primary" @click="handleAddItem">添加物料</el-button>
          </div>
          <el-table
            :data="allocationForm.items"
            style="width: 100%"
            @selection-change="handleItemSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="materialCode" label="物料编码" width="150" />
            <el-table-column prop="materialName" label="物料名称" width="200" />
            <el-table-column prop="spec" label="规格型号" width="150" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column label="当前库存" width="100" align="right">
              <template #default="scope">
                {{ scope.row.currentStock }}
              </template>
            </el-table-column>
            <el-table-column label="分配数量" width="120" align="right">
              <template #default="scope">
                <el-input-number
                  v-model="scope.row.quantity"
                  :min="1"
                  :max="scope.row.currentStock"
                  placeholder="请输入分配数量"
                  @change="handleQuantityChange"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button
                  type="danger"
                  size="small"
                  @click="handleRemoveItem(scope.$index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="items-footer">
            <el-button @click="handleBatchRemoveItems" :disabled="selectedItems.length === 0">
              批量删除
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 查看分配单对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="分配单详情"
      width="80%"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="分配单号">{{ viewAllocation.allocationCode }}</el-descriptions-item>
        <el-descriptions-item label="分配日期">{{ viewAllocation.allocationDate }}</el-descriptions-item>
        <el-descriptions-item label="调出仓库">{{ getWarehouseName(viewAllocation.fromWarehouseId) }}</el-descriptions-item>
        <el-descriptions-item label="调入仓库">{{ getWarehouseName(viewAllocation.toWarehouseId) }}</el-descriptions-item>
        <el-descriptions-item label="分配原因" :span="2">{{ viewAllocation.reason }}</el-descriptions-item>
        <el-descriptions-item label="状态" :span="2">
          <el-tag
            :type="getStatusType(viewAllocation.status)"
            effect="light"
          >
            {{ getStatusName(viewAllocation.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">{{ viewAllocation.createdBy }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ viewAllocation.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="审核人" v-if="viewAllocation.approvedBy">{{ viewAllocation.approvedBy }}</el-descriptions-item>
        <el-descriptions-item label="审核时间" v-if="viewAllocation.approvedAt">{{ viewAllocation.approvedAt }}</el-descriptions-item>
        <el-descriptions-item label="审核意见" v-if="viewAllocation.approvalComment" :span="2">{{ viewAllocation.approvalComment }}</el-descriptions-item>
      </el-descriptions>

      <!-- 物料明细 -->
      <div class="view-items">
        <h4>物料明细</h4>
        <el-table
          :data="viewAllocation.items"
          style="width: 100%"
          border
        >
          <el-table-column prop="materialCode" label="物料编码" width="150" />
          <el-table-column prop="materialName" label="物料名称" width="200" />
          <el-table-column prop="spec" label="规格型号" width="150" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="quantity" label="分配数量" width="120" align="right" />
          <el-table-column prop="remark" label="备注" width="200">
            <template #default="scope">
              <el-tooltip :content="scope.row.remark || '无'" placement="top">
                <span class="ellipsis">{{ scope.row.remark || '无' }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 操作日志 -->
      <div class="operation-logs">
        <h4>操作日志</h4>
        <el-timeline>
          <el-timeline-item
            v-for="(log, index) in viewAllocation.operationLogs"
            :key="index"
            :timestamp="log.time"
          >
            <el-card>
              <div class="log-content">
                <span class="log-action">{{ log.action }}</span>
                <span class="log-user">{{ log.user }}</span>
                <span v-if="log.comment" class="log-comment">{{ log.comment }}</span>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 审核操作 -->
      <div class="approval-actions" v-if="viewAllocation.status === 'pending'">
        <el-divider>审核操作</el-divider>
        <el-form :model="approvalForm" label-width="80px">
          <el-form-item label="审核意见">
            <el-input
              v-model="approvalForm.comment"
              type="textarea"
              placeholder="请输入审核意见"
              :rows="3"
            />
          </el-form-item>
          <div class="approval-buttons">
            <el-button @click="handleApprove('approve')" type="success">同意</el-button>
            <el-button @click="handleApprove('reject')" type="danger">拒绝</el-button>
          </div>
        </el-form>
      </div>
    </el-dialog>

    <!-- 添加物料对话框 -->
    <el-dialog
      v-model="materialDialogVisible"
      title="选择物料"
      width="70%"
    >
      <div class="material-search">
        <el-input
          v-model="materialSearch.keyword"
          placeholder="请输入物料编码或名称"
          prefix-icon="Search"
          clearable
          @input="handleMaterialSearch"
        />
        <el-select
          v-model="materialSearch.categoryId"
          placeholder="请选择物料类别"
          clearable
          @change="handleMaterialSearch"
        >
          <el-option
            v-for="category in materialCategories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          />
        </el-select>
      </div>
      <el-table
        :data="filteredMaterials"
        style="width: 100%"
        @selection-change="handleMaterialSelectionChange"
        height="400px"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="物料编码" width="150" />
        <el-table-column prop="name" label="物料名称" width="200" />
        <el-table-column prop="spec" label="规格型号" width="150" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="当前库存" width="120" align="right">
          <template #default="scope">
            {{ scope.row.stockQuantity }}
          </template>
        </el-table-column>
        <el-table-column prop="category" label="物料类别" width="120" />
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="materialDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmMaterials">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Management,
  Clock,
  Check,
  CircleCheck,
  Search
} from '@element-plus/icons-vue'

export default {
  name: 'MaterialAllocation',
  components: {
    Management,
    Clock,
    Check,
    CircleCheck,
    Search
  },
  setup() {
    // 状态管理
    const loading = ref(false)
    const allocations = ref([])
    const warehouses = ref([])
    const materialCategories = ref([])
    const materials = ref([])
    const selectedRows = ref([])
    const selectedItems = ref([])
    const selectedMaterials = ref([])
    const allocationFormRef = ref()

    // 搜索表单
    const searchForm = reactive({
      keyword: '',
      status: '',
      dateRange: null,
      fromWarehouse: '',
      toWarehouse: ''
    })

    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10
    })

    // 统计数据
    const stats = reactive({
      totalAllocations: 0,
      pendingAllocations: 0,
      approvedAllocations: 0,
      completedAllocations: 0
    })

    // 对话框状态
    const dialogVisible = ref(false)
    const viewDialogVisible = ref(false)
    const materialDialogVisible = ref(false)
    const dialogType = ref('create')

    // 分配单表单
    const allocationForm = reactive({
      id: '',
      allocationCode: '',
      allocationDate: '',
      fromWarehouseId: '',
      toWarehouseId: '',
      reason: '',
      items: []
    })

    // 查看的分配单
    const viewAllocation = reactive({
      id: '',
      allocationCode: '',
      allocationDate: '',
      fromWarehouseId: '',
      toWarehouseId: '',
      reason: '',
      status: '',
      createdBy: '',
      createdAt: '',
      approvedBy: '',
      approvedAt: '',
      approvalComment: '',
      items: [],
      operationLogs: []
    })

    // 审核表单
    const approvalForm = reactive({
      comment: ''
    })

    // 物料搜索
    const materialSearch = reactive({
      keyword: '',
      categoryId: ''
    })

    // 表单验证规则
    const allocationRules = {
      fromWarehouseId: [
        { required: true, message: '请选择调出仓库', trigger: 'blur' }
      ],
      toWarehouseId: [
        { required: true, message: '请选择调入仓库', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value === allocationForm.fromWarehouseId) {
              callback(new Error('调出仓库和调入仓库不能相同'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ],
      allocationDate: [
        { required: true, message: '请选择分配日期', trigger: 'change' }
      ],
      reason: [
        { required: true, message: '请输入分配原因', trigger: 'blur' },
        { min: 5, max: 200, message: '分配原因长度在 5 到 200 个字符', trigger: 'blur' }
      ]
    }

    // 计算属性
    const filteredAllocations = computed(() => {
      let result = [...allocations.value]

      // 关键词搜索
      if (searchForm.keyword) {
        const keyword = searchForm.keyword.toLowerCase()
        result = result.filter(allocation =>
          allocation.allocationCode.toLowerCase().includes(keyword) ||
          allocation.items.some(item =>
            item.materialCode.toLowerCase().includes(keyword) ||
            item.materialName.toLowerCase().includes(keyword)
          )
        )
      }

      // 状态筛选
      if (searchForm.status) {
        result = result.filter(allocation => allocation.status === searchForm.status)
      }

      // 日期范围筛选
      if (searchForm.dateRange && searchForm.dateRange.length === 2) {
        const [start, end] = searchForm.dateRange
        result = result.filter(allocation => {
          const allocationDate = new Date(allocation.allocationDate)
          return allocationDate >= new Date(start) && allocationDate <= new Date(end)
        })
      }

      // 调出仓库筛选
      if (searchForm.fromWarehouse) {
        result = result.filter(allocation => allocation.fromWarehouseId === searchForm.fromWarehouse)
      }

      // 调入仓库筛选
      if (searchForm.toWarehouse) {
        result = result.filter(allocation => allocation.toWarehouseId === searchForm.toWarehouse)
      }

      return result
    })

    // 筛选后的物料列表
    const filteredMaterials = computed(() => {
      let result = [...materials.value]

      // 关键词搜索
      if (materialSearch.keyword) {
        const keyword = materialSearch.keyword.toLowerCase()
        result = result.filter(material =>
          material.code.toLowerCase().includes(keyword) ||
          material.name.toLowerCase().includes(keyword)
        )
      }

      // 类别筛选
      if (materialSearch.categoryId) {
        result = result.filter(material => material.categoryId === materialSearch.categoryId)
      }

      // 排除已选择的物料
      const selectedMaterialIds = allocationForm.items.map(item => item.materialId)
      result = result.filter(material => !selectedMaterialIds.includes(material.id))

      return result
    })

    // 分页后的分配单列表
    const paginatedAllocations = computed(() => {
      const start = (pagination.currentPage - 1) * pagination.pageSize
      const end = start + pagination.pageSize
      return filteredAllocations.value.slice(start, end)
    })

    // 方法
    const initData = () => {
      loading.value = true
      
      // 模拟加载数据
      setTimeout(() => {
        warehouses.value = generateWarehouses()
        materialCategories.value = generateMaterialCategories()
        materials.value = generateMaterials()
        allocations.value = generateAllocations()
        updateStats()
        loading.value = false
      }, 500)
    }

    const updateStats = () => {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      // 过滤本月的分配单
      const currentMonthAllocations = allocations.value.filter(allocation => {
        const allocationDate = new Date(allocation.allocationDate)
        return allocationDate.getMonth() === currentMonth && 
               allocationDate.getFullYear() === currentYear
      })

      stats.totalAllocations = currentMonthAllocations.length
      stats.pendingAllocations = currentMonthAllocations.filter(a => a.status === 'pending').length
      stats.approvedAllocations = currentMonthAllocations.filter(a => a.status === 'approved').length
      stats.completedAllocations = currentMonthAllocations.filter(a => a.status === 'completed').length
    }

    const handleSearch = () => {
      pagination.currentPage = 1
    }

    const handleReset = () => {
      Object.keys(searchForm).forEach(key => {
        searchForm[key] = key === 'dateRange' ? null : ''
      })
      pagination.currentPage = 1
    }

    const handleSizeChange = (size) => {
      pagination.pageSize = size
      pagination.currentPage = 1
    }

    const handleCurrentChange = (current) => {
      pagination.currentPage = current
    }

    const handleSelectionChange = (rows) => {
      selectedRows.value = rows
    }

    const handleItemSelectionChange = (items) => {
      selectedItems.value = items
    }

    const handleMaterialSelectionChange = (materials) => {
      selectedMaterials.value = materials
    }

    const handleCreate = () => {
      dialogType.value = 'create'
      resetForm()
      allocationForm.allocationDate = new Date().toISOString().split('T')[0]
      dialogVisible.value = true
    }

    const handleEdit = (row) => {
      dialogType.value = 'edit'
      // 深拷贝，避免直接修改原数据
      allocationForm.id = row.id
      allocationForm.allocationCode = row.allocationCode
      allocationForm.allocationDate = row.allocationDate
      allocationForm.fromWarehouseId = row.fromWarehouseId
      allocationForm.toWarehouseId = row.toWarehouseId
      allocationForm.reason = row.reason
      allocationForm.items = JSON.parse(JSON.stringify(row.items))
      dialogVisible.value = true
    }

    const handleView = (row) => {
      // 深拷贝，避免直接修改原数据
      Object.assign(viewAllocation, JSON.parse(JSON.stringify(row)))
      // 清空审核表单
      approvalForm.comment = ''
      viewDialogVisible.value = true
    }

    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除分配单 ${row.allocationCode} 吗？`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        const index = allocations.value.findIndex(a => a.id === row.id)
        if (index > -1) {
          allocations.value.splice(index, 1)
          updateStats()
          ElMessage.success('删除成功')
        }
      } catch (error) {
        // 用户取消删除
      }
    }

    const handleBatchDelete = async () => {
      if (selectedRows.value.length === 0) {
        ElMessage.warning('请先选择要删除的分配单')
        return
      }

      try {
        await ElMessageBox.confirm(
          `确定要删除选中的 ${selectedRows.value.length} 个分配单吗？`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        const ids = selectedRows.value.map(row => row.id)
        allocations.value = allocations.value.filter(allocation => !ids.includes(allocation.id))
        updateStats()
        selectedRows.value = []
        ElMessage.success('批量删除成功')
      } catch (error) {
        // 用户取消删除
      }
    }

    const handleSave = async () => {
      if (!allocationFormRef.value) return
      
      try {
        await allocationFormRef.value.validate()
        
        if (allocationForm.items.length === 0) {
          ElMessage.warning('请至少添加一个物料')
          return
        }

        if (dialogType.value === 'create') {
          // 创建新分配单
          const newAllocation = {
            id: Date.now().toString(),
            allocationCode: generateAllocationCode(),
            allocationDate: allocationForm.allocationDate,
            fromWarehouseId: allocationForm.fromWarehouseId,
            toWarehouseId: allocationForm.toWarehouseId,
            reason: allocationForm.reason,
            status: 'pending',
            createdBy: '当前用户',
            createdAt: new Date().toLocaleString(),
            items: JSON.parse(JSON.stringify(allocationForm.items)),
            operationLogs: [{
              time: new Date().toLocaleString(),
              user: '当前用户',
              action: '创建分配单'
            }]
          }
          allocations.value.unshift(newAllocation)
        } else {
          // 更新分配单
          const index = allocations.value.findIndex(a => a.id === allocationForm.id)
          if (index > -1) {
            allocations.value[index] = {
              ...allocations.value[index],
              allocationDate: allocationForm.allocationDate,
              fromWarehouseId: allocationForm.fromWarehouseId,
              toWarehouseId: allocationForm.toWarehouseId,
              reason: allocationForm.reason,
              items: JSON.parse(JSON.stringify(allocationForm.items))
            }
            // 添加操作日志
            allocations.value[index].operationLogs.push({
              time: new Date().toLocaleString(),
              user: '当前用户',
              action: '更新分配单'
            })
          }
        }

        updateStats()
        dialogVisible.value = false
        ElMessage.success(dialogType.value === 'create' ? '创建成功' : '更新成功')
      } catch (error) {
        // 表单验证失败
      }
    }

    const handleDialogClose = () => {
      dialogVisible.value = false
      resetForm()
    }

    const resetForm = () => {
      if (allocationFormRef.value) {
        allocationFormRef.value.resetFields()
      }
      allocationForm.id = ''
      allocationForm.allocationCode = ''
      allocationForm.allocationDate = ''
      allocationForm.fromWarehouseId = ''
      allocationForm.toWarehouseId = ''
      allocationForm.reason = ''
      allocationForm.items = []
    }

    const handleAddItem = () => {
      if (!allocationForm.fromWarehouseId) {
        ElMessage.warning('请先选择调出仓库')
        return
      }
      materialDialogVisible.value = true
    }

    const handleConfirmMaterials = () => {
      if (selectedMaterials.value.length === 0) {
        ElMessage.warning('请选择要添加的物料')
        return
      }

      selectedMaterials.value.forEach(material => {
        allocationForm.items.push({
          materialId: material.id,
          materialCode: material.code,
          materialName: material.name,
          spec: material.spec,
          unit: material.unit,
          currentStock: material.stockQuantity,
          quantity: 1,
          remark: ''
        })
      })

      selectedMaterials.value = []
      materialDialogVisible.value = false
    }

    const handleRemoveItem = (index) => {
      allocationForm.items.splice(index, 1)
    }

    const handleBatchRemoveItems = () => {
      if (selectedItems.value.length === 0) {
        ElMessage.warning('请先选择要删除的物料')
        return
      }

      const indices = selectedItems.value.map(item => {
        return allocationForm.items.findIndex(i => i.materialId === item.materialId)
      }).filter(index => index > -1).sort((a, b) => b - a)

      indices.forEach(index => {
        allocationForm.items.splice(index, 1)
      })

      selectedItems.value = []
      ElMessage.success('批量删除成功')
    }

    const handleQuantityChange = () => {
      // 数量变化时的处理逻辑
    }

    const handleMaterialSearch = () => {
      // 物料搜索逻辑
    }

    const handleApprove = async (action) => {
      try {
        await ElMessageBox.confirm(
          action === 'approve' ? '确定要审核通过该分配单吗？' : '确定要拒绝该分配单吗？',
          '确认操作',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: action === 'approve' ? 'success' : 'warning'
          }
        )

        const index = allocations.value.findIndex(a => a.id === viewAllocation.id)
        if (index > -1) {
          allocations.value[index].status = action === 'approve' ? 'approved' : 'rejected'
          allocations.value[index].approvedBy = '当前用户'
          allocations.value[index].approvedAt = new Date().toLocaleString()
          allocations.value[index].approvalComment = approvalForm.comment
          
          // 添加操作日志
          allocations.value[index].operationLogs.push({
            time: new Date().toLocaleString(),
            user: '当前用户',
            action: action === 'approve' ? '审核通过' : '审核拒绝',
            comment: approvalForm.comment
          })

          // 更新查看的分配单
          Object.assign(viewAllocation, allocations.value[index])
          updateStats()
          ElMessage.success(action === 'approve' ? '审核通过成功' : '审核拒绝成功')
        }
      } catch (error) {
        // 用户取消操作
      }
    }

    const handleComplete = async (row) => {
      try {
        await ElMessageBox.confirm(
          '确定要完成该分配单吗？完成后将无法修改。',
          '确认完成',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'success'
          }
        )

        const index = allocations.value.findIndex(a => a.id === row.id)
        if (index > -1) {
          allocations.value[index].status = 'completed'
          
          // 添加操作日志
          allocations.value[index].operationLogs.push({
            time: new Date().toLocaleString(),
            user: '当前用户',
            action: '完成分配'
          })

          updateStats()
          ElMessage.success('分配单已完成')
        }
      } catch (error) {
        // 用户取消操作
      }
    }

    const handleExport = () => {
      // 模拟导出功能
      ElMessage.success('导出成功')
    }

    const generateAllocationCode = () => {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
      return `FA${year}${month}${day}${random}`
    }

    const getWarehouseName = (warehouseId) => {
      const warehouse = warehouses.value.find(w => w.id === warehouseId)
      return warehouse ? warehouse.name : ''
    }

    const getStatusName = (status) => {
      const statusMap = {
        pending: '待审核',
        approved: '已审核',
        rejected: '已拒绝',
        completed: '已完成'
      }
      return statusMap[status] || status
    }

    const getStatusType = (status) => {
      const typeMap = {
        pending: 'warning',
        approved: 'primary',
        rejected: 'danger',
        completed: 'success'
      }
      return typeMap[status] || 'info'
    }

    const calculateTotalQuantity = (items) => {
      return items.reduce((total, item) => total + (item.quantity || 0), 0)
    }

    // 模拟数据生成函数
    const generateWarehouses = () => {
      return [
        { id: '1', name: '原材料仓库' },
        { id: '2', name: '成品仓库' },
        { id: '3', name: '半成品仓库' },
        { id: '4', name: '五金配件仓库' },
        { id: '5', name: '电子元件仓库' }
      ]
    }

    const generateMaterialCategories = () => {
      return [
        { id: '1', name: '原材料' },
        { id: '2', name: '半成品' },
        { id: '3', name: '成品' },
        { id: '4', name: '配件' },
        { id: '5', name: '工具' }
      ]
    }

    const generateMaterials = () => {
      const materials = []
      const categoryNames = ['原材料', '半成品', '成品', '配件', '工具']
      const units = ['个', '件', '箱', '袋', '千克']
      
      for (let i = 1; i <= 30; i++) {
        const categoryId = String((i % 5) + 1)
        materials.push({
          id: String(i),
          code: `MAT${String(i).padStart(4, '0')}`,
          name: `物料名称${i}`,
          spec: `规格型号${i}`,
          unit: units[i % units.length],
          stockQuantity: Math.floor(Math.random() * 1000) + 100,
          categoryId,
          category: categoryNames[i % categoryNames.length]
        })
      }
      
      return materials
    }

    const generateAllocations = () => {
      const allocations = []
      const statuses = ['pending', 'approved', 'completed', 'rejected']
      const reasons = ['生产需求', '库存调整', '质量问题', '紧急调拨', '其他原因']
      const warehouses = ['1', '2', '3', '4', '5']
      const now = new Date()
      
      for (let i = 1; i <= 50; i++) {
        const fromWarehouseId = warehouses[Math.floor(Math.random() * warehouses.length)]
        let toWarehouseId = warehouses[Math.floor(Math.random() * warehouses.length)]
        while (toWarehouseId === fromWarehouseId) {
          toWarehouseId = warehouses[Math.floor(Math.random() * warehouses.length)]
        }
        
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const allocationDate = new Date(now)
        allocationDate.setDate(now.getDate() - Math.floor(Math.random() * 30))
        
        // 生成物料项
        const items = []
        const itemCount = Math.floor(Math.random() * 5) + 1
        const usedMaterialIds = new Set()
        
        for (let j = 0; j < itemCount; j++) {
          let materialId
          do {
            materialId = String(Math.floor(Math.random() * 30) + 1)
          } while (usedMaterialIds.has(materialId))
          usedMaterialIds.add(materialId)
          
          const currentStock = Math.floor(Math.random() * 1000) + 100
          const quantity = Math.floor(Math.random() * currentStock) + 1
          
          items.push({
            materialId,
            materialCode: `MAT${materialId.padStart(4, '0')}`,
            materialName: `物料名称${materialId}`,
            spec: `规格型号${materialId}`,
            unit: ['个', '件', '箱', '袋', '千克'][Math.floor(Math.random() * 5)],
            currentStock,
            quantity,
            remark: j % 3 === 0 ? '紧急需求' : ''
          })
        }
        
        // 生成操作日志
        const logs = [{
          time: allocationDate.toLocaleString(),
          user: `用户${Math.floor(Math.random() * 10) + 1}`,
          action: '创建分配单'
        }]
        
        if (status !== 'pending') {
          const approveDate = new Date(allocationDate)
          approveDate.setDate(allocationDate.getDate() + Math.floor(Math.random() * 3) + 1)
          logs.push({
            time: approveDate.toLocaleString(),
            user: `审批人${Math.floor(Math.random() * 5) + 1}`,
            action: status === 'approved' ? '审核通过' : '审核拒绝',
            comment: status === 'approved' ? '同意分配' : '库存不足，拒绝分配'
          })
          
          if (status === 'completed') {
            const completeDate = new Date(approveDate)
            completeDate.setDate(approveDate.getDate() + Math.floor(Math.random() * 5) + 1)
            logs.push({
              time: completeDate.toLocaleString(),
              user: `库管${Math.floor(Math.random() * 3) + 1}`,
              action: '完成分配'
            })
          }
        }
        
        allocations.push({
          id: String(i),
          allocationCode: `FA${allocationDate.getFullYear()}${String(allocationDate.getMonth() + 1).padStart(2, '0')}${String(allocationDate.getDate()).padStart(2, '0')}${String(i).padStart(4, '0')}`,
          allocationDate: allocationDate.toISOString().split('T')[0],
          fromWarehouseId,
          toWarehouseId,
          reason: reasons[Math.floor(Math.random() * reasons.length)],
          status,
          createdBy: `用户${Math.floor(Math.random() * 10) + 1}`,
          createdAt: allocationDate.toLocaleString(),
          approvedBy: status !== 'pending' ? `审批人${Math.floor(Math.random() * 5) + 1}` : '',
          approvedAt: status !== 'pending' ? logs[1].time : '',
          approvalComment: status !== 'pending' ? logs[1].comment : '',
          items,
          operationLogs: logs
        })
      }
      
      // 按创建时间倒序排序
      return allocations.sort((a, b) => new Date(b.allocationDate) - new Date(a.allocationDate))
    }

    // 生命周期
    onMounted(() => {
      initData()
    })

    return {
      loading,
      allocations,
      warehouses,
      materialCategories,
      materials,
      selectedRows,
      selectedItems,
      selectedMaterials,
      allocationFormRef,
      searchForm,
      pagination,
      stats,
      dialogVisible,
      viewDialogVisible,
      materialDialogVisible,
      dialogType,
      allocationForm,
      viewAllocation,
      approvalForm,
      materialSearch,
      allocationRules,
      filteredAllocations,
      filteredMaterials,
      paginatedAllocations,
      handleSearch,
      handleReset,
      handleSizeChange,
      handleCurrentChange,
      handleSelectionChange,
      handleItemSelectionChange,
      handleMaterialSelectionChange,
      handleCreate,
      handleEdit,
      handleView,
      handleDelete,
      handleBatchDelete,
      handleSave,
      handleDialogClose,
      resetForm,
      handleAddItem,
      handleConfirmMaterials,
      handleRemoveItem,
      handleBatchRemoveItems,
      handleQuantityChange,
      handleMaterialSearch,
      handleApprove,
      handleComplete,
      handleExport,
      getWarehouseName,
      getStatusName,
      getStatusType,
      calculateTotalQuantity
    }
  }
}
</script>

<style lang="scss" scoped>
.material-allocation {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;

  .page-header {
    margin-bottom: 20px;
    h2 {
      margin: 0;
      color: #303133;
      font-size: 18px;
    }
  }

  .toolbar {
    background-color: #fff;
    padding: 20px;
    border-radius: 4px;
    margin-bottom: 20px;

    .toolbar-actions {
      display: flex;
      gap: 10px;

      .el-button {
        flex: 1;
      }
    }
  }

  .stats-cards {
    margin-bottom: 20px;

    .stat-card {
      background-color: #fff;
      padding: 20px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      }

      .stat-icon {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin-right: 15px;

        &.allocation {
          background-color: #ecf5ff;
          color: #409eff;
        }

        &.pending {
          background-color: #fdf6ec;
          color: #e6a23c;
        }

        &.approved {
          background-color: #f0f9eb;
          color: #67c23a;
        }

        &.completed {
          background-color: #f0f9eb;
          color: #67c23a;
        }
      }

      .stat-content {
        flex: 1;

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }

  .allocation-list {
    background-color: #fff;
    padding: 20px;
    border-radius: 4px;

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h3 {
        margin: 0;
        color: #303133;
        font-size: 16px;
      }

      .list-actions {
        display: flex;
        gap: 10px;
      }
    }

    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
    max-width: 100%;
  }

  .items-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    h4 {
      margin: 0;
      color: #303133;
      font-size: 14px;
    }
  }

  .items-footer {
    margin-top: 10px;
    display: flex;
    justify-content: flex-end;
  }

  .material-search {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;

    .el-input {
      flex: 1;
    }

    .el-select {
      width: 200px;
    }
  }

  .view-items {
    margin-top: 20px;

    h4 {
      margin: 0 0 10px 0;
      color: #303133;
      font-size: 14px;
    }
  }

  .operation-logs {
    margin-top: 20px;

    h4 {
      margin: 0 0 10px 0;
      color: #303133;
      font-size: 14px;
    }

    .log-content {
      .log-action {
        font-weight: bold;
        margin-right: 10px;
      }

      .log-user {
        color: #606266;
        margin-right: 10px;
      }

      .log-comment {
        color: #909399;
        font-style: italic;
      }
    }
  }

  .approval-actions {
    margin-top: 20px;

    .approval-buttons {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 10px;
    }
  }
}
</style>