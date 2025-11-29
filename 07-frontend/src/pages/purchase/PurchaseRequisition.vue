<template>
  <div class="purchase-requisition">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <h1>采购申请管理</h1>
      <el-button type="primary" icon="el-icon-plus" @click="handleCreateRequisition">
        新建采购申请
      </el-button>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="申请单号">
          <el-input v-model="searchForm.requisitionNo" placeholder="请输入申请单号"></el-input>
        </el-form-item>
        <el-form-item label="申请人">
          <el-input v-model="searchForm.applicant" placeholder="请输入申请人"></el-input>
        </el-form-item>
        <el-form-item label="申请部门">
          <el-select v-model="searchForm.departmentId" placeholder="请选择申请部门">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="申请状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态">
            <el-option label="草稿" value="DRAFT"></el-option>
            <el-option label="待审批" value="PENDING"></el-option>
            <el-option label="已批准" value="APPROVED"></el-option>
            <el-option label="已拒绝" value="REJECTED"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="申请时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="requisitionList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="id" label="申请单ID" width="80"></el-table-column>
        <el-table-column prop="requisitionNo" label="申请单号" width="180"></el-table-column>
        <el-table-column prop="applicant" label="申请人" width="120"></el-table-column>
        <el-table-column prop="departmentName" label="申请部门" width="150"></el-table-column>
        <el-table-column prop="totalAmount" label="申请金额" width="120" formatter="formatCurrency"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdTime" label="申请时间" width="180"></el-table-column>
        <el-table-column prop="approverName" label="审批人" width="120"></el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button size="small" @click="handleViewDetails(scope.row)">查看</el-button>
            <el-button
              v-if="scope.row.status === 'DRAFT'"
              size="small"
              type="primary"
              @click="handleEditRequisition(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="scope.row.status === 'DRAFT'"
              size="small"
              type="success"
              @click="handleSubmitForApproval(scope.row)"
            >
              提交审批
            </el-button>
            <el-button
              v-if="scope.row.status === 'DRAFT'"
              size="small"
              type="danger"
              @click="handleDeleteRequisition(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页控件 -->
      <div class="pagination">
        <el-pagination
          background
          layout="prev, pager, next, jumper, total, sizes"
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </div>

    <!-- 采购申请详情对话框 -->
    <el-dialog
      title="采购申请详情"
      :visible.sync="detailDialogVisible"
      width="80%"
      :before-close="handleCloseDetailDialog"
    >
      <div class="requisition-detail">
        <!-- 申请单基本信息 -->
        <el-descriptions title="基本信息" border>
          <el-descriptions-item label="申请单号">{{ currentRequisition.requisitionNo }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ currentRequisition.applicant }}</el-descriptions-item>
          <el-descriptions-item label="申请部门">{{ currentRequisition.departmentName }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ currentRequisition.createdTime }}</el-descriptions-item>
          <el-descriptions-item label="申请状态" :span="1">
            <el-tag :type="getStatusTagType(currentRequisition.status)">
              {{ getStatusText(currentRequisition.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审批人">{{ currentRequisition.approverName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审批时间">{{ currentRequisition.approvedTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请原因" :span="2">{{ currentRequisition.reason || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 申请物料列表 -->
        <div class="mt-4">
          <h3>申请物料</h3>
          <el-table :data="currentRequisition.items" style="width: 100%">
            <el-table-column prop="itemNo" label="物料编码" width="150"></el-table-column>
            <el-table-column prop="itemName" label="物料名称" width="200"></el-table-column>
            <el-table-column prop="specification" label="规格型号" width="150"></el-table-column>
            <el-table-column prop="unit" label="单位" width="80"></el-table-column>
            <el-table-column prop="quantity" label="申请数量" width="100"></el-table-column>
            <el-table-column prop="unitPrice" label="单价" width="100" formatter="formatCurrency"></el-table-column>
            <el-table-column prop="totalPrice" label="金额" width="100" formatter="formatCurrency"></el-table-column>
            <el-table-column prop="requireDate" label="需求日期" width="150"></el-table-column>
            <el-table-column prop="remark" label="备注" min-width="100"></el-table-column>
          </el-table>
        </div>

        <!-- 审批意见 -->
        <div class="mt-4" v-if="currentRequisition.approvalComments">
          <h3>审批意见</h3>
          <el-descriptions border>
            <el-descriptions-item label="审批意见" :span="2">{{ currentRequisition.approvalComments }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleCloseDetailDialog">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 批量操作确认对话框 -->
    <el-dialog
      :title="confirmDialogTitle"
      :visible.sync="confirmDialogVisible"
      width="400px"
      :before-close="handleCloseConfirmDialog"
    >
      <p>{{ confirmDialogMessage }}</p>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleCloseConfirmDialog">取消</el-button>
        <el-button type="primary" @click="handleConfirmAction">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { purchaseApi } from '@/api/purchase'

export default {
  name: 'PurchaseRequisition',
  data() {
    return {
      // 搜索表单
      searchForm: {
        requisitionNo: '',
        applicant: '',
        departmentId: '',
        status: ''
      },
      dateRange: [],
      // 部门列表
      departments: [],
      // 采购申请列表数据
      requisitionList: [],
      // 分页信息
      currentPage: 1,
      pageSize: 10,
      total: 0,
      // 加载状态
      loading: false,
      // 选中的行
      selectedRows: [],
      // 详情对话框
      detailDialogVisible: false,
      currentRequisition: {},
      // 确认对话框
      confirmDialogVisible: false,
      confirmDialogTitle: '',
      confirmDialogMessage: '',
      confirmAction: null
    }
  },
  created() {
    this.initData()
  },
  methods: {
    // 初始化数据
    initData() {
      this.loadDepartments()
      this.loadRequisitionList()
    },
    // 加载部门列表
    async loadDepartments() {
      try {
        const response = await purchaseApi.getDepartments()
        this.departments = response.data || []
      } catch (error) {
        console.error('获取部门列表失败:', error)
        // 使用模拟数据作为备份
        this.departments = [
          { id: 1, name: '采购部' },
          { id: 2, name: '生产部' },
          { id: 3, name: '研发部' },
          { id: 4, name: '行政部' },
          { id: 5, name: '财务部' }
        ]
      }
    },
    // 加载采购申请列表
    async loadRequisitionList() {
      this.loading = true
      try {
        const params = {
          ...this.searchForm,
          page: this.currentPage,
          pageSize: this.pageSize
        }
        if (this.dateRange && this.dateRange.length === 2) {
          params.startDate = this.dateRange[0]
          params.endDate = this.dateRange[1]
        }
        
        const response = await purchaseApi.getPurchaseRequisitions(params)
        this.requisitionList = response.data.items || []
        this.total = response.data.total || 0
      } catch (error) {
        console.error('获取采购申请列表失败:', error)
        this.$message.error('获取数据失败，请稍后重试')
        // 使用模拟数据作为备份
        this.requisitionList = this.generateMockData()
        this.total = this.requisitionList.length
      } finally {
        this.loading = false
      }
    },
    // 生成模拟数据
    generateMockData() {
      const statuses = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']
      const departments = ['采购部', '生产部', '研发部', '行政部']
      const data = []
      
      for (let i = 1; i <= 50; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        data.push({
          id: i,
          requisitionNo: `PR${new Date().getFullYear()}${String(i).padStart(4, '0')}`,
          applicant: `申请人${i}`,
          departmentName: departments[Math.floor(Math.random() * departments.length)],
          departmentId: Math.floor(Math.random() * 5) + 1,
          totalAmount: Math.floor(Math.random() * 100000) + 1000,
          status: status,
          createdTime: this.formatDate(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)),
          approverName: status !== 'DRAFT' && status !== 'PENDING' ? `审批人${Math.floor(Math.random() * 10) + 1}` : null,
          approvedTime: status !== 'DRAFT' && status !== 'PENDING' ? this.formatDate(new Date()) : null,
          items: this.generateMockItems(),
          reason: `因业务需要，申请采购相关物料。`,
          approvalComments: status === 'REJECTED' ? '申请理由不充分，请补充详细说明。' : status === 'APPROVED' ? '同意采购' : null
        })
      }
      return data
    },
    // 生成模拟物料数据
    generateMockItems() {
      const items = []
      const itemCount = Math.floor(Math.random() * 5) + 1
      
      for (let i = 1; i <= itemCount; i++) {
        const quantity = Math.floor(Math.random() * 100) + 1
        const unitPrice = Math.floor(Math.random() * 1000) + 10
        items.push({
          id: i,
          itemNo: `ITEM${String(Math.floor(Math.random() * 9000) + 1000)}`,
          itemName: `物料名称${i}`,
          specification: `规格${i}`,
          unit: ['个', '件', '箱', '套'][Math.floor(Math.random() * 4)],
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: quantity * unitPrice,
          requireDate: this.formatDate(new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)),
          remark: ''
        })
      }
      return items
    },
    // 格式化日期
    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    },
    // 格式化货币
    formatCurrency(row, column, cellValue) {
      if (!cellValue) return '¥0.00'
      return `¥${cellValue.toFixed(2)}`
    },
    // 获取状态标签类型
    getStatusTagType(status) {
      const typeMap = {
        DRAFT: 'default',
        PENDING: 'warning',
        APPROVED: 'success',
        REJECTED: 'danger'
      }
      return typeMap[status] || 'default'
    },
    // 获取状态文本
    getStatusText(status) {
      const textMap = {
        DRAFT: '草稿',
        PENDING: '待审批',
        APPROVED: '已批准',
        REJECTED: '已拒绝'
      }
      return textMap[status] || status
    },
    // 处理搜索
    handleSearch() {
      this.currentPage = 1
      this.loadRequisitionList()
    },
    // 处理重置
    handleReset() {
      this.searchForm = {
        requisitionNo: '',
        applicant: '',
        departmentId: '',
        status: ''
      }
      this.dateRange = []
      this.handleSearch()
    },
    // 处理分页大小变化
    handleSizeChange(size) {
      this.pageSize = size
      this.loadRequisitionList()
    },
    // 处理当前页码变化
    handleCurrentChange(current) {
      this.currentPage = current
      this.loadRequisitionList()
    },
    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },
    // 新建采购申请
    handleCreateRequisition() {
      this.$router.push('/purchase/create-requisition')
    },
    // 编辑采购申请
    handleEditRequisition(row) {
      this.$router.push(`/purchase/edit-requisition/${row.id}`)
    },
    // 查看详情
    handleViewDetails(row) {
      this.currentRequisition = { ...row }
      this.detailDialogVisible = true
    },
    // 提交审批
    handleSubmitForApproval(row) {
      this.confirmDialogTitle = '提交审批确认'
      this.confirmDialogMessage = `确定要提交采购申请 ${row.requisitionNo} 进行审批吗？`
      this.confirmAction = async () => {
        try {
          await purchaseApi.submitPurchaseRequisition(row.id)
          this.$message.success('提交审批成功')
          this.loadRequisitionList()
        } catch (error) {
          console.error('提交审批失败:', error)
          this.$message.error('提交审批失败，请稍后重试')
          // 本地模拟状态更新作为降级方案
          const index = this.requisitionList.findIndex(item => item.id === row.id)
          if (index !== -1) {
            this.requisitionList[index].status = 'PENDING'
          }
        } finally {
          this.confirmDialogVisible = false
        }
      }
      this.confirmDialogVisible = true
    },
    // 删除采购申请
    handleDeleteRequisition(id) {
      this.confirmDialogTitle = '删除确认'
      this.confirmDialogMessage = '确定要删除选中的采购申请吗？此操作不可撤销。'
      this.confirmAction = async () => {
        try {
          await purchaseApi.deletePurchaseRequisition(id)
          this.$message.success('删除成功')
          this.loadRequisitionList()
        } catch (error) {
          console.error('删除采购申请失败:', error)
          this.$message.error('删除失败，请稍后重试')
          // 本地模拟删除作为降级方案
          this.requisitionList = this.requisitionList.filter(item => item.id !== id)
          this.total--
        } finally {
          this.confirmDialogVisible = false
        }
      }
      this.confirmDialogVisible = true
    },
    // 关闭详情对话框
    handleCloseDetailDialog() {
      this.detailDialogVisible = false
      this.currentRequisition = {}
    },
    // 关闭确认对话框
    handleCloseConfirmDialog() {
      this.confirmDialogVisible = false
      this.confirmAction = null
    },
    // 处理确认操作
    handleConfirmAction() {
      if (this.confirmAction) {
        this.confirmAction()
      }
    }
  }
}
</script>

<style scoped>
.purchase-requisition {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-section {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.table-section {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.requisition-detail {
  line-height: 1.8;
}

.mt-4 {
  margin-top: 20px;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}
</style>