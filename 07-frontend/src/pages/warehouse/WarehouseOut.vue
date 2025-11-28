<template>
  <div class="warehouse-out-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>生产领料出库管理</span>
        <el-button type="primary" size="small" @click="showCreateForm" style="float: right;">
          新建出库单
        </el-button>
      </div>

      <!-- 搜索筛选区域 -->
      <el-form :inline="true" :model="searchForm" class="demo-form-inline" size="small">
        <el-form-item label="出库单号">
          <el-input v-model="searchForm.issueNo" placeholder="请输入出库单号"></el-input>
        </el-form-item>
        <el-form-item label="生产工单">
          <el-input v-model="searchForm.workOrderNo" placeholder="请输入生产工单号"></el-input>
        </el-form-item>
        <el-form-item label="领用部门">
          <el-select v-model="searchForm.departmentId" placeholder="请选择部门" clearable>
            <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="出库状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待审批" value="pending"></el-option>
            <el-option label="已审批" value="approved"></el-option>
            <el-option label="已出库" value="issued"></el-option>
            <el-option label="已取消" value="cancelled"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="创建日期">
          <el-date-picker
            v-model="searchForm.createDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button @click="exportData">导出</el-button>
        </el-form-item>
      </el-form>

      <!-- 出库单列表 -->
      <el-table
        :data="warehouseOutList"
        style="width: 100%"
        stripe
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="issueNo" label="出库单号" min-width="180"></el-table-column>
        <el-table-column prop="workOrderNo" label="生产工单" min-width="180"></el-table-column>
        <el-table-column prop="departmentName" label="领用部门" min-width="150"></el-table-column>
        <el-table-column prop="applicantName" label="申请人" min-width="120"></el-table-column>
        <el-table-column prop="totalAmount" label="出库金额" align="right" min-width="120">
          <template #default="scope">
            ¥{{ scope.row.totalAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalQuantity" label="出库数量" align="right" min-width="100"></el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="scope">
            <el-tag :type="statusTypeMap[scope.row.status]">
              {{ statusTextMap[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" min-width="120"></el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="180"></el-table-column>
        <el-table-column prop="issueTime" label="出库时间" min-width="180"></el-table-column>
        <el-table-column label="操作" min-width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewDetail(scope.row)">查看</el-button>
            <template v-if="scope.row.status === 'pending'">
              <el-button type="primary" size="small" @click="editReceipt(scope.row)">编辑</el-button>
              <el-button type="danger" size="small" @click="deleteReceipt(scope.row)">取消</el-button>
            </template>
            <template v-if="scope.row.status === 'approved'">
              <el-button type="success" size="small" @click="confirmIssue(scope.row)">确认出库</el-button>
            </template>
            <el-button size="small" @click="printReceipt(scope.row)">打印</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next, jumper, sizes, total"
          :total="total"
          :page-size.sync="pageSize"
          :current-page.sync="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </el-card>

    <!-- 创建/编辑出库单对话框 -->
    <el-dialog title="出库单信息" :visible.sync="dialogVisible" width="90%" :close-on-click-modal="false">
      <el-form :model="warehouseOutForm" :rules="warehouseOutRules" ref="warehouseOutFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出库单号" prop="issueNo">
              <el-input v-model="warehouseOutForm.issueNo" :disabled="true"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联生产工单" prop="workOrderId">
              <el-select v-model="warehouseOutForm.workOrderId" placeholder="请选择生产工单" @change="onWorkOrderChange">
                <el-option v-for="order in workOrders" :key="order.id" :label="order.orderNo" :value="order.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出库类型" prop="type">
              <el-select v-model="warehouseOutForm.type" placeholder="请选择出库类型">
                <el-option label="生产领料" value="production"></el-option>
                <el-option label="销售发货" value="sales"></el-option>
                <el-option label="样品出库" value="sample"></el-option>
                <el-option label="其他出库" value="other"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出库仓库" prop="warehouseId">
              <el-select v-model="warehouseOutForm.warehouseId" placeholder="请选择仓库">
                <el-option v-for="warehouse in warehouses" :key="warehouse.id" :label="warehouse.name" :value="warehouse.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="领用部门" prop="departmentId">
              <el-select v-model="warehouseOutForm.departmentId" placeholder="请选择领用部门">
                <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请人" prop="applicantId">
              <el-select v-model="warehouseOutForm.applicantId" placeholder="请选择申请人">
                <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计出库日期" prop="expectedDate">
              <el-date-picker v-model="warehouseOutForm.expectedDate" type="date" placeholder="请选择日期"></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="审批人" prop="approverId">
              <el-select v-model="warehouseOutForm.approverId" placeholder="请选择审批人">
                <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="领用原因" prop="reason">
              <el-input v-model="warehouseOutForm.reason" type="textarea" :rows="2" placeholder="请输入领用原因"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 出库明细 -->
        <el-divider>出库明细</el-divider>
        <el-button type="primary" size="small" @click="addItem" style="margin-bottom: 10px;">添加物料</el-button>
        <el-table
          :data="warehouseOutForm.items"
          style="width: 100%"
          stripe
          border
          @selection-change="handleItemSelectionChange"
        >
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="productCode" label="物料编码" min-width="120"></el-table-column>
          <el-table-column prop="productName" label="物料名称" min-width="180"></el-table-column>
          <el-table-column prop="specification" label="规格型号" min-width="150"></el-table-column>
          <el-table-column prop="unit" label="单位" min-width="80"></el-table-column>
          <el-table-column prop="stockQuantity" label="库存数量" min-width="100" align="right"></el-table-column>
          <el-table-column prop="issueQuantity" label="出库数量" min-width="100" align="right">
            <template #default="scope">
              <el-input-number
                v-model="scope.row.issueQuantity"
                :min="1"
                :max="scope.row.stockQuantity || 9999"
                size="small"
                @change="calculateTotals"
              ></el-input-number>
            </template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="单价" min-width="100" align="right">
            <template #default="scope">
              <el-input-number
                v-model="scope.row.unitPrice"
                :min="0"
                :precision="2"
                size="small"
                @change="calculateTotals"
              ></el-input-number>
            </template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计" min-width="120" align="right">
            <template #default="scope">
              ¥{{ (scope.row.issueQuantity * scope.row.unitPrice).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="batchNo" label="批次号" min-width="150"></el-table-column>
          <el-table-column prop="locationCode" label="存放库位" min-width="120">
            <template #default="scope">
              <el-select v-model="scope.row.locationCode" placeholder="请选择库位" size="small">
                <el-option v-for="location in locations" :key="location.code" :label="location.code" :value="location.code"></el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="usage" label="用途" min-width="150">
            <template #default="scope">
              <el-input v-model="scope.row.usage" size="small" placeholder="请输入用途"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="80" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="editItem(scope.row)">编辑</el-button>
              <el-button type="danger" size="small" @click="deleteItem(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 汇总信息 -->
        <div class="summary-info">
          <div class="summary-item">
            <span>总项数：{{ warehouseOutForm.items.length }}</span>
          </div>
          <div class="summary-item">
            <span>总数量：{{ totalQuantity }}</span>
          </div>
          <div class="summary-item">
            <span>总金额：¥{{ totalAmount.toFixed(2) }}</span>
          </div>
        </div>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
        <el-button type="success" @click="submitForApproval">提交审批</el-button>
      </div>
    </el-dialog>

    <!-- 出库单详情对话框 -->
    <el-dialog title="出库单详情" :visible.sync="detailVisible" width="90%" :close-on-click-modal="false">
      <!-- 详情内容，与编辑表单类似但为只读 -->
      <!-- 这里省略详细的详情展示代码，与编辑表单结构类似但使用展示组件 -->
      
      <!-- 审批流程 -->
      <el-divider v-if="detailData && detailData.approvals && detailData.approvals.length > 0">审批流程</el-divider>
      <el-timeline v-if="detailData && detailData.approvals && detailData.approvals.length > 0">
        <el-timeline-item
          v-for="(approval, index) in detailData.approvals"
          :key="index"
          :timestamp="approval.approveTime"
          :type="approval.result === 'approve' ? 'success' : (approval.result === 'reject' ? 'danger' : 'primary')"
        >
          <div>
            <h4>{{ approval.approverName }}</h4>
            <p>{{ approval.result === 'approve' ? '同意' : (approval.result === 'reject' ? '拒绝' : '待审批') }}</p>
            <p v-if="approval.comment">{{ approval.comment }}</p>
          </div>
        </el-timeline-item>
      </el-timeline>
      
      <!-- 审批操作 -->
      <div v-if="detailData && detailData.status === 'pending' && canApprove" class="approval-section">
        <el-divider>审批操作</el-divider>
        <el-form :model="approvalForm" :rules="approvalRules" ref="approvalFormRef">
          <el-form-item label="审批意见">
            <el-input v-model="approvalForm.comment" type="textarea" :rows="3" placeholder="请输入审批意见"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="success" @click="approveReceipt">同意</el-button>
            <el-button type="danger" @click="rejectReceipt">拒绝</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="printReceipt(detailData)">打印</el-button>
      </div>
    </el-dialog>

    <!-- 确认对话框 -->
    <el-dialog title="确认操作" :visible.sync="confirmDialogVisible" width="400px">
      <p>{{ confirmDialogContent }}</p>
      <div slot="footer" class="dialog-footer">
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAction">确认</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'WarehouseOut',
  data() {
    return {
      // 搜索表单
      searchForm: {
        issueNo: '',
        workOrderNo: '',
        departmentId: '',
        status: '',
        createDateRange: []
      },
      // 出库单列表数据
      warehouseOutList: [],
      // 分页信息
      currentPage: 1,
      pageSize: 20,
      total: 0,
      // 状态映射
      statusTextMap: {
        pending: '待审批',
        approved: '已审批',
        issued: '已出库',
        cancelled: '已取消'
      },
      statusTypeMap: {
        pending: 'warning',
        approved: 'info',
        issued: 'success',
        cancelled: 'danger'
      },
      // 对话框状态
      dialogVisible: false,
      detailVisible: false,
      confirmDialogVisible: false,
      confirmDialogContent: '',
      confirmActionType: '',
      confirmData: null,
      // 选中的记录
      selectedRows: [],
      selectedItems: [],
      // 出库单表单数据
      warehouseOutForm: {
        id: '',
        issueNo: '',
        workOrderId: '',
        workOrderNo: '',
        type: 'production',
        warehouseId: '',
        warehouseName: '',
        departmentId: '',
        departmentName: '',
        applicantId: '',
        applicantName: '',
        approverId: '',
        approverName: '',
        expectedDate: '',
        reason: '',
        remark: '',
        items: [],
        approvals: []
      },
      // 审批表单
      approvalForm: {
        comment: ''
      },
      // 表单验证规则
      warehouseOutRules: {
        workOrderId: [
          { required: true, message: '请选择生产工单', trigger: 'blur' }
        ],
        warehouseId: [
          { required: true, message: '请选择出库仓库', trigger: 'blur' }
        ],
        departmentId: [
          { required: true, message: '请选择领用部门', trigger: 'blur' }
        ],
        applicantId: [
          { required: true, message: '请选择申请人', trigger: 'blur' }
        ],
        approverId: [
          { required: true, message: '请选择审批人', trigger: 'blur' }
        ]
      },
      approvalRules: {
        comment: [
          { required: true, message: '请输入审批意见', trigger: 'blur' }
        ]
      },
      // 部门列表
      departments: [],
      // 用户列表
      users: [],
      // 生产工单列表
      workOrders: [],
      // 仓库列表
      warehouses: [],
      // 库位列表
      locations: [],
      // 详情数据
      detailData: null,
      // 当前用户是否可以审批
      canApprove: false
    }
  },
  computed: {
    // 计算总数量
    totalQuantity() {
      return this.warehouseOutForm.items.reduce((sum, item) => sum + (item.issueQuantity || 0), 0)
    },
    // 计算总金额
    totalAmount() {
      return this.warehouseOutForm.items.reduce((sum, item) => sum + ((item.issueQuantity || 0) * (item.unitPrice || 0)), 0)
    }
  },
  mounted() {
    this.initData()
    this.loadWarehouseOutList()
  },
  methods: {
    // 初始化数据
    async initData() {
      // 模拟加载基础数据
      this.departments = this.getMockDepartments()
      this.users = this.getMockUsers()
      this.workOrders = this.getMockWorkOrders()
      this.warehouses = this.getMockWarehouses()
      this.locations = this.getMockLocations()
      // 模拟当前用户ID
      this.currentUserId = '1'
    },
    // 加载出库单列表
    async loadWarehouseOutList() {
      // 模拟加载数据
      this.warehouseOutList = this.getMockWarehouseOutList()
      this.total = this.warehouseOutList.length
    },
    // 搜索
    handleSearch() {
      this.currentPage = 1
      this.loadWarehouseOutList()
    },
    // 重置搜索
    resetSearch() {
      this.searchForm = {
        issueNo: '',
        workOrderNo: '',
        departmentId: '',
        status: '',
        createDateRange: []
      }
      this.loadWarehouseOutList()
    },
    // 分页处理
    handleSizeChange(size) {
      this.pageSize = size
      this.loadWarehouseOutList()
    },
    handleCurrentChange(current) {
      this.currentPage = current
      this.loadWarehouseOutList()
    },
    // 选择变化
    handleSelectionChange(rows) {
      this.selectedRows = rows
    },
    handleItemSelectionChange(rows) {
      this.selectedItems = rows
    },
    // 显示创建表单
    showCreateForm() {
      this.warehouseOutForm = {
        id: '',
        issueNo: this.generateIssueNo(),
        workOrderId: '',
        workOrderNo: '',
        type: 'production',
        warehouseId: '',
        warehouseName: '',
        departmentId: '',
        departmentName: '',
        applicantId: this.currentUserId, // 默认当前用户
        applicantName: this.users.find(u => u.id === this.currentUserId)?.name || '',
        approverId: '',
        approverName: '',
        expectedDate: '',
        reason: '',
        remark: '',
        items: [],
        approvals: []
      }
      this.dialogVisible = true
    },
    // 编辑出库单
    editReceipt(row) {
      // 深拷贝数据
      this.warehouseOutForm = JSON.parse(JSON.stringify(row))
      this.dialogVisible = true
    },
    // 查看详情
    viewDetail(row) {
      this.detailData = row
      // 判断当前用户是否可以审批
      this.canApprove = row.status === 'pending' && row.approverId === this.currentUserId
      this.detailVisible = true
    },
    // 删除/取消出库单
    deleteReceipt(row) {
      this.confirmDialogContent = `确定要取消出库单 ${row.issueNo} 吗？`
      this.confirmActionType = 'delete'
      this.confirmData = row
      this.confirmDialogVisible = true
    },
    // 确认出库
    confirmIssue(row) {
      this.confirmDialogContent = `确定要确认出库单 ${row.issueNo} 吗？`
      this.confirmActionType = 'issue'
      this.confirmData = row
      this.confirmDialogVisible = true
    },
    // 确认操作
    async confirmAction() {
      if (this.confirmActionType === 'delete') {
        // 模拟删除操作
        const index = this.warehouseOutList.findIndex(item => item.id === this.confirmData.id)
        if (index > -1) {
          this.warehouseOutList[index].status = 'cancelled'
          this.$message.success('取消成功')
        }
      } else if (this.confirmActionType === 'issue') {
        // 模拟确认出库操作
        const index = this.warehouseOutList.findIndex(item => item.id === this.confirmData.id)
        if (index > -1) {
          this.warehouseOutList[index].status = 'issued'
          this.warehouseOutList[index].issueTime = this.formatDate(new Date())
          this.$message.success('确认出库成功')
        }
      }
      this.confirmDialogVisible = false
    },
    // 打印出库单
    printReceipt(row) {
      this.$message.info('打印功能开发中...')
    },
    // 导出数据
    exportData() {
      this.$message.info('导出功能开发中...')
    },
    // 生产工单变化处理
    onWorkOrderChange(val) {
      if (val) {
        const order = this.workOrders.find(o => o.id === val)
        if (order) {
          this.warehouseOutForm.workOrderNo = order.orderNo
          // 根据生产工单生成出库明细
          this.warehouseOutForm.items = order.requiredMaterials.map(item => ({
            productId: item.productId,
            productCode: item.productCode,
            productName: item.productName,
            specification: item.specification,
            unit: item.unit,
            stockQuantity: this.getMockStockQuantity(item.productId), // 模拟库存数量
            issueQuantity: item.quantity,
            unitPrice: item.unitPrice,
            batchNo: '',
            locationCode: '',
            usage: '生产用料'
          }))
          this.calculateTotals()
        }
      }
    },
    // 添加明细项
    addItem() {
      this.warehouseOutForm.items.push({
        productId: '',
        productCode: '',
        productName: '',
        specification: '',
        unit: '',
        stockQuantity: 0,
        issueQuantity: 1,
        unitPrice: 0,
        batchNo: '',
        locationCode: '',
        usage: ''
      })
    },
    // 编辑明细项
    editItem(item) {
      // 可以打开一个编辑明细的对话框
      this.$message.info('编辑明细功能开发中...')
    },
    // 删除明细项
    deleteItem(index) {
      this.warehouseOutForm.items.splice(index, 1)
      this.calculateTotals()
    },
    // 计算汇总数据
    calculateTotals() {
      // 汇总数据会通过计算属性自动更新
    },
    // 提交表单
    submitForm() {
      this.$refs.warehouseOutFormRef.validate((valid) => {
        if (valid) {
          if (this.warehouseOutForm.items.length === 0) {
            this.$message.error('请添加出库明细')
            return
          }
          
          // 验证所有明细项
          const hasError = this.warehouseOutForm.items.some(item => {
            return !item.productName || !item.issueQuantity || !item.unitPrice
          })
          
          if (hasError) {
            this.$message.error('请填写完整的明细信息')
            return
          }
          
          // 验证库存是否足够
          const insufficientStock = this.warehouseOutForm.items.some(item => {
            return (item.issueQuantity || 0) > (item.stockQuantity || 0)
          })
          
          if (insufficientStock) {
            this.$message.error('部分物料库存不足，请调整出库数量')
            return
          }
          
          // 模拟提交数据
          if (this.warehouseOutForm.id) {
            // 更新
            const index = this.warehouseOutList.findIndex(item => item.id === this.warehouseOutForm.id)
            if (index > -1) {
              this.warehouseOutList.splice(index, 1, JSON.parse(JSON.stringify(this.warehouseOutForm)))
            }
          } else {
            // 添加
            const newItem = JSON.parse(JSON.stringify(this.warehouseOutForm))
            newItem.id = Date.now().toString()
            newItem.status = 'pending'
            newItem.createTime = this.formatDate(new Date())
            newItem.operatorName = '当前用户'
            newItem.departmentName = this.departments.find(d => d.id === newItem.departmentId)?.name || ''
            newItem.warehouseName = this.warehouses.find(w => w.id === newItem.warehouseId)?.name || ''
            this.warehouseOutList.unshift(newItem)
            this.total++
          }
          
          this.$message.success('保存成功')
          this.dialogVisible = false
        }
      })
    },
    // 提交审批
    submitForApproval() {
      this.$refs.warehouseOutFormRef.validate((valid) => {
        if (valid) {
          // 提交审批逻辑，与保存类似，但更新状态
          if (this.warehouseOutForm.id) {
            const index = this.warehouseOutList.findIndex(item => item.id === this.warehouseOutForm.id)
            if (index > -1) {
              this.warehouseOutList[index].status = 'pending'
              this.warehouseOutList[index].submitTime = this.formatDate(new Date())
            }
          } else {
            const newItem = JSON.parse(JSON.stringify(this.warehouseOutForm))
            newItem.id = Date.now().toString()
            newItem.status = 'pending'
            newItem.createTime = this.formatDate(new Date())
            newItem.submitTime = this.formatDate(new Date())
            newItem.operatorName = '当前用户'
            newItem.departmentName = this.departments.find(d => d.id === newItem.departmentId)?.name || ''
            newItem.warehouseName = this.warehouses.find(w => w.id === newItem.warehouseId)?.name || ''
            this.warehouseOutList.unshift(newItem)
            this.total++
          }
          
          this.$message.success('提交审批成功')
          this.dialogVisible = false
        }
      })
    },
    // 审批通过
    approveReceipt() {
      this.$refs.approvalFormRef.validate((valid) => {
        if (valid) {
          // 模拟审批通过
          const approvalRecord = {
            approverId: this.currentUserId,
            approverName: this.users.find(u => u.id === this.currentUserId)?.name || '当前用户',
            approveTime: this.formatDate(new Date()),
            result: 'approve',
            comment: this.approvalForm.comment
          }
          
          if (!this.detailData.approvals) {
            this.detailData.approvals = []
          }
          this.detailData.approvals.push(approvalRecord)
          this.detailData.status = 'approved'
          
          // 更新列表中的状态
          const index = this.warehouseOutList.findIndex(item => item.id === this.detailData.id)
          if (index > -1) {
            this.warehouseOutList[index].status = 'approved'
            this.warehouseOutList[index].approvals = this.detailData.approvals
          }
          
          this.$message.success('审批通过成功')
          this.detailVisible = false
          this.approvalForm.comment = ''
        }
      })
    },
    // 审批拒绝
    rejectReceipt() {
      this.$refs.approvalFormRef.validate((valid) => {
        if (valid) {
          // 模拟审批拒绝
          const approvalRecord = {
            approverId: this.currentUserId,
            approverName: this.users.find(u => u.id === this.currentUserId)?.name || '当前用户',
            approveTime: this.formatDate(new Date()),
            result: 'reject',
            comment: this.approvalForm.comment
          }
          
          if (!this.detailData.approvals) {
            this.detailData.approvals = []
          }
          this.detailData.approvals.push(approvalRecord)
          this.detailData.status = 'cancelled'
          
          // 更新列表中的状态
          const index = this.warehouseOutList.findIndex(item => item.id === this.detailData.id)
          if (index > -1) {
            this.warehouseOutList[index].status = 'cancelled'
            this.warehouseOutList[index].approvals = this.detailData.approvals
          }
          
          this.$message.success('已拒绝该出库单')
          this.detailVisible = false
          this.approvalForm.comment = ''
        }
      })
    },
    // 生成出库单号
    generateIssueNo() {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const timestamp = String(date.getTime()).slice(-6)
      return `CK${year}${month}${day}${timestamp}`
    },
    // 格式化日期
    formatDate(date) {
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      const seconds = String(d.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    // 模拟库存数量
    getMockStockQuantity(productId) {
      const stockMap = {
        '101': 500,
        '102': 300,
        '103': 200,
        '104': 150,
        '105': 100
      }
      return stockMap[productId] || Math.floor(Math.random() * 1000)
    },
    // 模拟数据
    getMockDepartments() {
      return [
        { id: '1', name: '生产部' },
        { id: '2', name: '研发部' },
        { id: '3', name: '销售部' },
        { id: '4', name: '采购部' },
        { id: '5', name: '仓储部' }
      ]
    },
    getMockUsers() {
      return [
        { id: '1', name: '张三', departmentId: '1' },
        { id: '2', name: '李四', departmentId: '1' },
        { id: '3', name: '王五', departmentId: '2' },
        { id: '4', name: '赵六', departmentId: '5' },
        { id: '5', name: '钱七', departmentId: '5' }
      ]
    },
    getMockWorkOrders() {
      return [
        {
          id: '1',
          orderNo: 'WO20240101001',
          productName: '产品A',
          quantity: 100,
          status: 'in_progress',
          requiredMaterials: [
            {
              productId: '101',
              productCode: 'MAT001',
              productName: '原材料A',
              specification: '规格A',
              unit: 'kg',
              quantity: 200,
              unitPrice: 50.00
            },
            {
              productId: '102',
              productCode: 'MAT002',
              productName: '原材料B',
              specification: '规格B',
              unit: '个',
              quantity: 100,
              unitPrice: 30.00
            }
          ]
        },
        {
          id: '2',
          orderNo: 'WO20240101002',
          productName: '产品B',
          quantity: 50,
          status: 'planned',
          requiredMaterials: [
            {
              productId: '103',
              productCode: 'MAT003',
              productName: '原材料C',
              specification: '规格C',
              unit: 'kg',
              quantity: 150,
              unitPrice: 40.00
            },
            {
              productId: '104',
              productCode: 'MAT004',
              productName: '原材料D',
              specification: '规格D',
              unit: '个',
              quantity: 200,
              unitPrice: 20.00
            }
          ]
        }
      ]
    },
    getMockWarehouses() {
      return [
        { id: '1', name: '原材料仓库' },
        { id: '2', name: '半成品仓库' },
        { id: '3', name: '成品仓库' }
      ]
    },
    getMockLocations() {
      return [
        { code: 'RM-A-01', name: '原材料区-A-01' },
        { code: 'RM-A-02', name: '原材料区-A-02' },
        { code: 'RM-B-01', name: '原材料区-B-01' },
        { code: 'RM-B-02', name: '原材料区-B-02' }
      ]
    },
    getMockWarehouseOutList() {
      return [
        {
          id: '1',
          issueNo: 'CK20240101001',
          workOrderNo: 'WO20240101001',
          workOrderId: '1',
          departmentId: '1',
          departmentName: '生产部',
          warehouseId: '1',
          warehouseName: '原材料仓库',
          applicantId: '1',
          applicantName: '张三',
          approverId: '4',
          approverName: '赵六',
          type: 'production',
          status: 'issued',
          totalAmount: 13000,
          totalQuantity: 300,
          operatorName: '钱七',
          createTime: '2024-01-01 09:00:00',
          submitTime: '2024-01-01 09:30:00',
          issueTime: '2024-01-01 11:00:00',
          reason: '生产用料',
          items: [
            {
              productCode: 'MAT001',
              productName: '原材料A',
              specification: '规格A',
              unit: 'kg',
              stockQuantity: 500,
              issueQuantity: 200,
              unitPrice: 50.00,
              batchNo: 'BATCH001',
              locationCode: 'RM-A-01',
              usage: '生产产品A'
            },
            {
              productCode: 'MAT002',
              productName: '原材料B',
              specification: '规格B',
              unit: '个',
              stockQuantity: 300,
              issueQuantity: 100,
              unitPrice: 30.00,
              batchNo: 'BATCH002',
              locationCode: 'RM-A-02',
              usage: '生产产品A'
            }
          ],
          approvals: [
            {
              approverId: '4',
              approverName: '赵六',
              approveTime: '2024-01-01 10:00:00',
              result: 'approve',
              comment: '同意出库'
            }
          ]
        },
        {
          id: '2',
          issueNo: 'CK20240102001',
          workOrderNo: 'WO20240101002',
          workOrderId: '2',
          departmentId: '1',
          departmentName: '生产部',
          warehouseId: '1',
          warehouseName: '原材料仓库',
          applicantId: '2',
          applicantName: '李四',
          approverId: '4',
          approverName: '赵六',
          type: 'production',
          status: 'pending',
          totalAmount: 11000,
          totalQuantity: 350,
          operatorName: '李四',
          createTime: '2024-01-02 09:00:00',
          submitTime: '2024-01-02 09:30:00',
          issueTime: '',
          reason: '生产用料',
          items: [
            {
              productCode: 'MAT003',
              productName: '原材料C',
              specification: '规格C',
              unit: 'kg',
              stockQuantity: 200,
              issueQuantity: 150,
              unitPrice: 40.00,
              batchNo: '',
              locationCode: '',
              usage: '生产产品B'
            },
            {
              productCode: 'MAT004',
              productName: '原材料D',
              specification: '规格D',
              unit: '个',
              stockQuantity: 150,
              issueQuantity: 200,
              unitPrice: 20.00,
              batchNo: '',
              locationCode: '',
              usage: '生产产品B'
            }
          ],
          approvals: []
        }
      ]
    }
  }
}
</script>

<style scoped>
.warehouse-out-container {
  padding: 20px;
}
.pagination-container {
  margin-top: 20px;
  text-align: right;
}
.summary-info {
  margin-top: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  justify-content: flex-end;
}
.summary-item {
  margin-left: 30px;
  font-weight: bold;
}
.approval-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style>