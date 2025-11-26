<template>
  <div class="purchase-receipt-list-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>采购回厂管理</h2>
      <el-button type="primary" @click="createReceipt">
        <i class="el-icon-plus"></i> 新增回厂单
      </el-button>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="回厂单号">
          <el-input
            v-model="searchForm.receiptNo"
            placeholder="请输入回厂单号"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="采购订单号">
          <el-input
            v-model="searchForm.purchaseOrderNo"
            placeholder="请输入采购订单号"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="供应商">
          <el-select
            v-model="searchForm.supplierId"
            placeholder="请选择供应商"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="supplier in suppliers"
              :key="supplier.id"
              :label="supplier.name"
              :value="supplier.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="待检验" value="PENDING_INSPECTION" />
            <el-option label="检验中" value="INSPECTING" />
            <el-option label="已检验" value="INSPECTED" />
            <el-option label="已审批" value="APPROVED" />
            <el-option label="需退货" value="NEED_RETURN" />
            <el-option label="已完成" value="COMPLETED" />
          </el-select>
        </el-form-item>
        <el-form-item label="回厂日期">
          <el-date-picker
            v-model="searchForm.receiptDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <i class="el-icon-search"></i> 搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据列表区域 -->
    <el-card class="data-card">
      <div class="toolbar">
        <div class="left-actions">
          <el-button type="danger" @click="batchDelete" :disabled="selectedRows.length === 0">
            <i class="el-icon-delete"></i> 批量删除
          </el-button>
          <el-button @click="exportReceipts" :disabled="receipts.length === 0">
            <i class="el-icon-download"></i> 导出数据
          </el-button>
        </div>
        <div class="right-actions">
          <el-select
            v-model="pageSize"
            placeholder="每页条数"
            style="width: 120px; margin-left: 10px"
            @change="handlePageSizeChange"
          >
            <el-option label="10条/页" value="10" />
            <el-option label="20条/页" value="20" />
            <el-option label="50条/页" value="50" />
            <el-option label="100条/页" value="100" />
          </el-select>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="paginatedReceipts"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="receiptNo" label="回厂单号" width="160" align="center">
          <template slot-scope="scope">
            <span class="receipt-no">{{ scope.row.receiptNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="purchaseOrderNo" label="采购订单号" width="160" align="center" />
        <el-table-column prop="supplierName" label="供应商" width="180">
          <template slot-scope="scope">
            <el-tooltip :content="scope.row.supplierContact || '无联系人信息'" placement="top">
              <span>{{ scope.row.supplierName }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="receiptDate" label="回厂日期" width="140" align="center" />
        <el-table-column prop="totalAmount" label="总金额" width="120" align="center">
          <template slot-scope="scope">
            <span class="amount">¥{{ scope.row.totalAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalQuantity" label="总数量" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="100" align="center" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button
              type="primary"
              size="mini"
              @click="viewReceipt(scope.row)"
              style="margin-right: 5px"
            >
              查看
            </el-button>
            <template v-if="scope.row.status === 'PENDING_INSPECTION'">
              <el-button
                type="success"
                size="mini"
                @click="inspectReceipt(scope.row)"
                style="margin-right: 5px"
              >
                检验
              </el-button>
              <el-button
                type="warning"
                size="mini"
                @click="editReceipt(scope.row)"
                style="margin-right: 5px"
              >
                编辑
              </el-button>
              <el-button
                type="danger"
                size="mini"
                @click="deleteReceipt(scope.row.id)"
              >
                删除
              </el-button>
            </template>
            <template v-else-if="scope.row.status === 'INSPECTED'">
              <el-button
                type="success"
                size="mini"
                @click="approveReceipt(scope.row)"
              >
                审批
              </el-button>
            </template>
            <template v-else-if="scope.row.status === 'NEED_RETURN'">
              <el-button
                type="primary"
                size="mini"
                @click="returnProcess(scope.row)"
              >
                退货处理
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next, jumper, sizes, total"
          :total="filteredReceipts.length"
          :page-size="pageSize"
          :current-page="currentPage"
          @size-change="handlePageSizeChange"
          @current-change="handleCurrentPageChange"
        />
      </div>
    </el-card>

    <!-- 确认删除对话框 -->
    <el-dialog
      title="确认删除"
      :visible.sync="confirmDeleteVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <p>确定要删除选中的 {{ selectedRows.length }} 条回厂单记录吗？此操作不可撤销。</p>
      <div slot="footer" class="dialog-footer">
        <el-button @click="confirmDeleteVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmBatchDelete">确认删除</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'PurchaseReceiptList',
  data() {
    return {
      loading: false,
      searchForm: {
        receiptNo: '',
        purchaseOrderNo: '',
        supplierId: '',
        status: '',
        receiptDateRange: []
      },
      currentPage: 1,
      pageSize: 10,
      selectedRows: [],
      confirmDeleteVisible: false,
      receipts: [],
      suppliers: [
        { id: 1, name: '供应商A', contact: '张三' },
        { id: 2, name: '供应商B', contact: '李四' },
        { id: 3, name: '供应商C', contact: '王五' },
        { id: 4, name: '供应商D', contact: '赵六' }
      ]
    }
  },
  computed: {
    // 过滤后的数据
    filteredReceipts() {
      let result = [...this.receipts]
      
      // 根据搜索条件过滤
      if (this.searchForm.receiptNo) {
        result = result.filter(receipt => 
          receipt.receiptNo.toLowerCase().includes(this.searchForm.receiptNo.toLowerCase())
        )
      }
      
      if (this.searchForm.purchaseOrderNo) {
        result = result.filter(receipt => 
          receipt.purchaseOrderNo.toLowerCase().includes(this.searchForm.purchaseOrderNo.toLowerCase())
        )
      }
      
      if (this.searchForm.supplierId) {
        result = result.filter(receipt => receipt.supplierId === this.searchForm.supplierId)
      }
      
      if (this.searchForm.status) {
        result = result.filter(receipt => receipt.status === this.searchForm.status)
      }
      
      if (this.searchForm.receiptDateRange && this.searchForm.receiptDateRange.length === 2) {
        const startDate = new Date(this.searchForm.receiptDateRange[0])
        const endDate = new Date(this.searchForm.receiptDateRange[1])
        result = result.filter(receipt => {
          const receiptDate = new Date(receipt.receiptDate)
          return receiptDate >= startDate && receiptDate <= endDate
        })
      }
      
      return result
    },
    
    // 分页后的数据
    paginatedReceipts() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + parseInt(this.pageSize)
      return this.filteredReceipts.slice(start, end)
    }
  },
  mounted() {
    this.loadReceipts()
  },
  methods: {
    // 加载回厂单数据
    loadReceipts() {
      this.loading = true
      // 模拟API请求
      setTimeout(() => {
        this.receipts = this.generateMockData()
        this.loading = false
      }, 500)
    },
    
    // 生成模拟数据
    generateMockData() {
      return [
        {
          id: 1,
          receiptNo: 'RC20240101001',
          purchaseOrderNo: 'PO20231225001',
          supplierId: 1,
          supplierName: '供应商A',
          supplierContact: '张三 13800138001',
          receiptDate: '2024-01-01',
          totalAmount: 15800.00,
          totalQuantity: 100,
          status: 'PENDING_INSPECTION',
          creator: 'admin',
          createTime: '2024-01-01 10:00:00',
          remark: '常规采购'
        },
        {
          id: 2,
          receiptNo: 'RC20240102001',
          purchaseOrderNo: 'PO20231226001',
          supplierId: 2,
          supplierName: '供应商B',
          supplierContact: '李四 13900139001',
          receiptDate: '2024-01-02',
          totalAmount: 8900.50,
          totalQuantity: 50,
          status: 'INSPECTING',
          creator: 'admin',
          createTime: '2024-01-02 14:30:00',
          remark: '加急采购'
        },
        {
          id: 3,
          receiptNo: 'RC20240103001',
          purchaseOrderNo: 'PO20231227001',
          supplierId: 3,
          supplierName: '供应商C',
          supplierContact: '王五 13700137001',
          receiptDate: '2024-01-03',
          totalAmount: 23400.00,
          totalQuantity: 200,
          status: 'INSPECTED',
          creator: 'admin',
          createTime: '2024-01-03 09:15:00',
          remark: '批量采购'
        },
        {
          id: 4,
          receiptNo: 'RC20240104001',
          purchaseOrderNo: 'PO20231228001',
          supplierId: 4,
          supplierName: '供应商D',
          supplierContact: '赵六 13600136001',
          receiptDate: '2024-01-04',
          totalAmount: 6750.00,
          totalQuantity: 30,
          status: 'APPROVED',
          creator: 'admin',
          createTime: '2024-01-04 11:20:00',
          remark: '补充采购'
        },
        {
          id: 5,
          receiptNo: 'RC20240105001',
          purchaseOrderNo: 'PO20231229001',
          supplierId: 1,
          supplierName: '供应商A',
          supplierContact: '张三 13800138001',
          receiptDate: '2024-01-05',
          totalAmount: 12300.00,
          totalQuantity: 80,
          status: 'NEED_RETURN',
          creator: 'admin',
          createTime: '2024-01-05 16:45:00',
          remark: '部分质量问题'
        },
        {
          id: 6,
          receiptNo: 'RC20240106001',
          purchaseOrderNo: 'PO20231230001',
          supplierId: 2,
          supplierName: '供应商B',
          supplierContact: '李四 13900139001',
          receiptDate: '2024-01-06',
          totalAmount: 18900.00,
          totalQuantity: 120,
          status: 'COMPLETED',
          creator: 'admin',
          createTime: '2024-01-06 10:30:00',
          remark: '正常完成'
        }
      ]
    },
    
    // 获取状态对应的标签类型
    getStatusType(status) {
      const typeMap = {
        'PENDING_INSPECTION': 'info',
        'INSPECTING': 'primary',
        'INSPECTED': 'success',
        'APPROVED': 'warning',
        'NEED_RETURN': 'danger',
        'COMPLETED': 'success'
      }
      return typeMap[status] || 'default'
    },
    
    // 获取状态文本
    getStatusText(status) {
      const textMap = {
        'PENDING_INSPECTION': '待检验',
        'INSPECTING': '检验中',
        'INSPECTED': '已检验',
        'APPROVED': '已审批',
        'NEED_RETURN': '需退货',
        'COMPLETED': '已完成'
      }
      return textMap[status] || status
    },
    
    // 搜索处理
    handleSearch() {
      this.currentPage = 1
    },
    
    // 重置搜索条件
    handleReset() {
      this.searchForm = {
        receiptNo: '',
        purchaseOrderNo: '',
        supplierId: '',
        status: '',
        receiptDateRange: []
      }
      this.currentPage = 1
    },
    
    // 分页处理
    handlePageSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
    },
    
    handleCurrentPageChange(current) {
      this.currentPage = current
    },
    
    // 选择行处理
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },
    
    // 新增回厂单
    createReceipt() {
      this.$router.push('/receipt/create')
    },
    
    // 查看回厂单
    viewReceipt(receipt) {
      this.$router.push({
        path: '/receipt/view',
        query: { id: receipt.id }
      })
    },
    
    // 编辑回厂单
    editReceipt(receipt) {
      this.$router.push({
        path: '/receipt/edit',
        query: { id: receipt.id }
      })
    },
    
    // 检验回厂单
    inspectReceipt(receipt) {
      this.$router.push({
        path: '/receipt/inspection',
        query: { id: receipt.id }
      })
    },
    
    // 审批回厂单
    approveReceipt(receipt) {
      this.$router.push({
        path: '/receipt/approve',
        query: { id: receipt.id }
      })
    },
    
    // 退货处理
    returnProcess(receipt) {
      this.$router.push({
        path: '/receipt/return',
        query: { id: receipt.id }
      })
    },
    
    // 删除回厂单
    deleteReceipt(id) {
      this.$confirm('确定要删除这条回厂单记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除操作
        this.receipts = this.receipts.filter(receipt => receipt.id !== id)
        this.$message.success('删除成功')
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    
    // 批量删除
    batchDelete() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请先选择要删除的记录')
        return
      }
      this.confirmDeleteVisible = true
    },
    
    // 确认批量删除
    confirmBatchDelete() {
      const ids = this.selectedRows.map(row => row.id)
      this.receipts = this.receipts.filter(receipt => !ids.includes(receipt.id))
      this.selectedRows = []
      this.confirmDeleteVisible = false
      this.$message.success('批量删除成功')
    },
    
    // 导出回厂单数据
    exportReceipts() {
      this.$message.success('导出成功')
      // 这里可以实现导出逻辑
    }
  }
}
</script>

<style scoped>
.purchase-receipt-list-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.left-actions,
.right-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.data-card {
  margin-bottom: 20px;
}

.receipt-no {
  color: #409EFF;
  font-weight: 500;
}

.amount {
  font-weight: 600;
  color: #67C23A;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.dialog-footer {
  text-align: right;
}

@media (max-width: 1200px) {
  .search-form {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .toolbar {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .left-actions,
  .right-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>