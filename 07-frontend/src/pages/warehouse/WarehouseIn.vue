<template>
  <div class="warehouse-in-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>采购入库管理</span>
        <el-button type="primary" size="small" @click="showCreateForm" style="float: right;">
          新建入库单
        </el-button>
      </div>

      <!-- 搜索筛选区域 -->
      <el-form :inline="true" :model="searchForm" class="demo-form-inline" size="small">
        <el-form-item label="入库单号">
          <el-input v-model="searchForm.receiptNo" placeholder="请输入入库单号"></el-input>
        </el-form-item>
        <el-form-item label="采购订单号">
          <el-input v-model="searchForm.purchaseOrderNo" placeholder="请输入采购订单号"></el-input>
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="searchForm.supplierId" placeholder="请选择供应商" clearable>
            <el-option v-for="supplier in suppliers" :key="supplier.id" :label="supplier.name" :value="supplier.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="入库状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待入库" value="pending"></el-option>
            <el-option label="部分入库" value="partial"></el-option>
            <el-option label="已完成" value="completed"></el-option>
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

      <!-- 入库单列表 -->
      <el-table
        :data="warehouseInList"
        style="width: 100%"
        stripe
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="receiptNo" label="入库单号" min-width="180"></el-table-column>
        <el-table-column prop="purchaseOrderNo" label="采购订单号" min-width="180"></el-table-column>
        <el-table-column prop="supplierName" label="供应商" min-width="150"></el-table-column>
        <el-table-column prop="totalAmount" label="入库金额" align="right" min-width="120">
          <template #default="scope">
            ¥{{ scope.row.totalAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalQuantity" label="入库数量" align="right" min-width="100"></el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="scope">
            <el-tag :type="statusTypeMap[scope.row.status]">
              {{ statusTextMap[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" min-width="120"></el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="180"></el-table-column>
        <el-table-column prop="confirmTime" label="确认时间" min-width="180"></el-table-column>
        <el-table-column label="操作" min-width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewDetail(scope.row)">查看</el-button>
            <template v-if="['pending', 'partial'].includes(scope.row.status)">
              <el-button type="primary" size="small" @click="editReceipt(scope.row)">编辑</el-button>
              <el-button type="danger" size="small" @click="deleteReceipt(scope.row)">取消</el-button>
              <el-button type="success" size="small" @click="confirmReceipt(scope.row)">确认入库</el-button>
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

    <!-- 创建/编辑入库单对话框 -->
    <el-dialog title="入库单信息" :visible.sync="dialogVisible" width="90%" :close-on-click-modal="false">
      <el-form :model="warehouseInForm" :rules="warehouseInRules" ref="warehouseInFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="入库单号" prop="receiptNo">
              <el-input v-model="warehouseInForm.receiptNo" :disabled="true"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联采购订单" prop="purchaseOrderId">
              <el-select v-model="warehouseInForm.purchaseOrderId" placeholder="请选择采购订单" @change="onPurchaseOrderChange">
                <el-option v-for="order in purchaseOrders" :key="order.id" :label="order.orderNo" :value="order.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入库类型" prop="type">
              <el-select v-model="warehouseInForm.type" placeholder="请选择入库类型">
                <el-option label="普通采购" value="normal"></el-option>
                <el-option label="退货入库" value="return"></el-option>
                <el-option label="样品入库" value="sample"></el-option>
                <el-option label="其他入库" value="other"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入库仓库" prop="warehouseId">
              <el-select v-model="warehouseInForm.warehouseId" placeholder="请选择仓库">
                <el-option v-for="warehouse in warehouses" :key="warehouse.id" :label="warehouse.name" :value="warehouse.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplierId">
              <el-select v-model="warehouseInForm.supplierId" placeholder="请选择供应商">
                <el-option v-for="supplier in suppliers" :key="supplier.id" :label="supplier.name" :value="supplier.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计到货日期" prop="expectedDate">
              <el-date-picker v-model="warehouseInForm.expectedDate" type="date" placeholder="请选择日期"></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="warehouseInForm.remark" type="textarea" :rows="2" placeholder="请输入备注信息"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 入库明细 -->
        <el-divider>入库明细</el-divider>
        <el-button type="primary" size="small" @click="addItem" style="margin-bottom: 10px;">添加明细</el-button>
        <el-table
          :data="warehouseInForm.items"
          style="width: 100%"
          stripe
          border
          @selection-change="handleItemSelectionChange"
        >
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="productCode" label="产品编码" min-width="120"></el-table-column>
          <el-table-column prop="productName" label="产品名称" min-width="180"></el-table-column>
          <el-table-column prop="specification" label="规格型号" min-width="150"></el-table-column>
          <el-table-column prop="unit" label="单位" min-width="80"></el-table-column>
          <el-table-column prop="purchaseQuantity" label="采购数量" min-width="100" align="right"></el-table-column>
          <el-table-column prop="inQuantity" label="入库数量" min-width="100" align="right">
            <template #default="scope">
              <el-input-number
                v-model="scope.row.inQuantity"
                :min="0"
                :max="scope.row.purchaseQuantity || 9999"
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
              ¥{{ (scope.row.inQuantity * scope.row.unitPrice).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="batchNo" label="批次号" min-width="150"></el-table-column>
          <el-table-column prop="expiryDate" label="有效期" min-width="120">
            <template #default="scope">
              <el-date-picker
                v-model="scope.row.expiryDate"
                type="date"
                placeholder="请选择日期"
                size="small"
              ></el-date-picker>
            </template>
          </el-table-column>
          <el-table-column prop="locationCode" label="存放库位" min-width="120">
            <template #default="scope">
              <el-select v-model="scope.row.locationCode" placeholder="请选择库位" size="small">
                <el-option v-for="location in locations" :key="location.code" :label="location.code" :value="location.code"></el-option>
              </el-select>
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
            <span>总项数：{{ warehouseInForm.items.length }}</span>
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
      </div>
    </el-dialog>

    <!-- 入库单详情对话框 -->
    <el-dialog title="入库单详情" :visible.sync="detailVisible" width="90%" :close-on-click-modal="false">
      <!-- 详情内容，与编辑表单类似但为只读 -->
      <!-- 这里省略详细的详情展示代码，与编辑表单结构类似但使用展示组件 -->
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
  name: 'WarehouseIn',
  data() {
    return {
      // 搜索表单
      searchForm: {
        receiptNo: '',
        purchaseOrderNo: '',
        supplierId: '',
        status: '',
        createDateRange: []
      },
      // 入库单列表数据
      warehouseInList: [],
      // 分页信息
      currentPage: 1,
      pageSize: 20,
      total: 0,
      // 状态映射
      statusTextMap: {
        pending: '待入库',
        partial: '部分入库',
        completed: '已完成',
        cancelled: '已取消'
      },
      statusTypeMap: {
        pending: 'warning',
        partial: 'info',
        completed: 'success',
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
      // 入库单表单数据
      warehouseInForm: {
        id: '',
        receiptNo: '',
        purchaseOrderId: '',
        purchaseOrderNo: '',
        type: 'normal',
        warehouseId: '',
        supplierId: '',
        supplierName: '',
        expectedDate: '',
        remark: '',
        items: []
      },
      // 表单验证规则
      warehouseInRules: {
        purchaseOrderId: [
          { required: true, message: '请选择采购订单', trigger: 'blur' }
        ],
        warehouseId: [
          { required: true, message: '请选择入库仓库', trigger: 'blur' }
        ],
        supplierId: [
          { required: true, message: '请选择供应商', trigger: 'blur' }
        ]
      },
      // 供应商列表
      suppliers: [],
      // 采购订单列表
      purchaseOrders: [],
      // 仓库列表
      warehouses: [],
      // 库位列表
      locations: [],
      // 详情数据
      detailData: null
    }
  },
  computed: {
    // 计算总数量
    totalQuantity() {
      return this.warehouseInForm.items.reduce((sum, item) => sum + (item.inQuantity || 0), 0)
    },
    // 计算总金额
    totalAmount() {
      return this.warehouseInForm.items.reduce((sum, item) => sum + ((item.inQuantity || 0) * (item.unitPrice || 0)), 0)
    }
  },
  mounted() {
    this.initData()
    this.loadWarehouseInList()
  },
  methods: {
    // 初始化数据
    async initData() {
      // 模拟加载基础数据
      this.suppliers = this.getMockSuppliers()
      this.purchaseOrders = this.getMockPurchaseOrders()
      this.warehouses = this.getMockWarehouses()
      this.locations = this.getMockLocations()
    },
    // 加载入库单列表
    async loadWarehouseInList() {
      // 模拟加载数据
      this.warehouseInList = this.getMockWarehouseInList()
      this.total = this.warehouseInList.length
    },
    // 搜索
    handleSearch() {
      this.currentPage = 1
      this.loadWarehouseInList()
    },
    // 重置搜索
    resetSearch() {
      this.searchForm = {
        receiptNo: '',
        purchaseOrderNo: '',
        supplierId: '',
        status: '',
        createDateRange: []
      }
      this.loadWarehouseInList()
    },
    // 分页处理
    handleSizeChange(size) {
      this.pageSize = size
      this.loadWarehouseInList()
    },
    handleCurrentChange(current) {
      this.currentPage = current
      this.loadWarehouseInList()
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
      this.warehouseInForm = {
        id: '',
        receiptNo: this.generateReceiptNo(),
        purchaseOrderId: '',
        purchaseOrderNo: '',
        type: 'normal',
        warehouseId: '',
        supplierId: '',
        supplierName: '',
        expectedDate: '',
        remark: '',
        items: []
      }
      this.dialogVisible = true
    },
    // 编辑入库单
    editReceipt(row) {
      // 深拷贝数据
      this.warehouseInForm = JSON.parse(JSON.stringify(row))
      this.dialogVisible = true
    },
    // 查看详情
    viewDetail(row) {
      this.detailData = row
      this.detailVisible = true
    },
    // 删除/取消入库单
    deleteReceipt(row) {
      this.confirmDialogContent = `确定要取消入库单 ${row.receiptNo} 吗？`
      this.confirmActionType = 'delete'
      this.confirmData = row
      this.confirmDialogVisible = true
    },
    // 确认入库
    confirmReceipt(row) {
      this.confirmDialogContent = `确定要确认入库单 ${row.receiptNo} 吗？`
      this.confirmActionType = 'confirm'
      this.confirmData = row
      this.confirmDialogVisible = true
    },
    // 确认操作
    async confirmAction() {
      if (this.confirmActionType === 'delete') {
        // 模拟删除操作
        const index = this.warehouseInList.findIndex(item => item.id === this.confirmData.id)
        if (index > -1) {
          this.warehouseInList[index].status = 'cancelled'
          this.$message.success('取消成功')
        }
      } else if (this.confirmActionType === 'confirm') {
        // 模拟确认入库操作
        const index = this.warehouseInList.findIndex(item => item.id === this.confirmData.id)
        if (index > -1) {
          this.warehouseInList[index].status = 'completed'
          this.warehouseInList[index].confirmTime = this.formatDate(new Date())
          this.$message.success('确认入库成功')
        }
      }
      this.confirmDialogVisible = false
    },
    // 打印入库单
    printReceipt(row) {
      this.$message.info('打印功能开发中...')
    },
    // 导出数据
    exportData() {
      this.$message.info('导出功能开发中...')
    },
    // 采购订单变化处理
    onPurchaseOrderChange(val) {
      if (val) {
        const order = this.purchaseOrders.find(o => o.id === val)
        if (order) {
          this.warehouseInForm.purchaseOrderNo = order.orderNo
          // 根据采购订单生成入库明细
          this.warehouseInForm.items = order.items.map(item => ({
            productId: item.productId,
            productCode: item.productCode,
            productName: item.productName,
            specification: item.specification,
            unit: item.unit,
            purchaseQuantity: item.quantity,
            inQuantity: item.quantity,
            unitPrice: item.unitPrice,
            batchNo: '',
            expiryDate: '',
            locationCode: ''
          }))
          this.calculateTotals()
        }
      }
    },
    // 添加明细项
    addItem() {
      this.warehouseInForm.items.push({
        productId: '',
        productCode: '',
        productName: '',
        specification: '',
        unit: '',
        purchaseQuantity: 0,
        inQuantity: 0,
        unitPrice: 0,
        batchNo: '',
        expiryDate: '',
        locationCode: ''
      })
    },
    // 编辑明细项
    editItem(item) {
      // 可以打开一个编辑明细的对话框
      this.$message.info('编辑明细功能开发中...')
    },
    // 删除明细项
    deleteItem(index) {
      this.warehouseInForm.items.splice(index, 1)
      this.calculateTotals()
    },
    // 计算汇总数据
    calculateTotals() {
      // 汇总数据会通过计算属性自动更新
    },
    // 提交表单
    submitForm() {
      this.$refs.warehouseInFormRef.validate((valid) => {
        if (valid) {
          if (this.warehouseInForm.items.length === 0) {
            this.$message.error('请添加入库明细')
            return
          }
          
          // 验证所有明细项
          const hasError = this.warehouseInForm.items.some(item => {
            return !item.productName || !item.inQuantity || !item.unitPrice
          })
          
          if (hasError) {
            this.$message.error('请填写完整的明细信息')
            return
          }
          
          // 模拟提交数据
          if (this.warehouseInForm.id) {
            // 更新
            const index = this.warehouseInList.findIndex(item => item.id === this.warehouseInForm.id)
            if (index > -1) {
              this.warehouseInList.splice(index, 1, JSON.parse(JSON.stringify(this.warehouseInForm)))
            }
          } else {
            // 添加
            const newItem = JSON.parse(JSON.stringify(this.warehouseInForm))
            newItem.id = Date.now().toString()
            newItem.status = 'pending'
            newItem.createTime = this.formatDate(new Date())
            newItem.operatorName = '当前用户'
            newItem.supplierName = this.suppliers.find(s => s.id === newItem.supplierId)?.name || ''
            this.warehouseInList.unshift(newItem)
            this.total++
          }
          
          this.$message.success('保存成功')
          this.dialogVisible = false
        }
      })
    },
    // 生成入库单号
    generateReceiptNo() {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const timestamp = String(date.getTime()).slice(-6)
      return `RK${year}${month}${day}${timestamp}`
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
    // 模拟数据
    getMockSuppliers() {
      return [
        { id: '1', name: '供应商A', contact: '张三', phone: '13800138001' },
        { id: '2', name: '供应商B', contact: '李四', phone: '13800138002' },
        { id: '3', name: '供应商C', contact: '王五', phone: '13800138003' }
      ]
    },
    getMockPurchaseOrders() {
      return [
        {
          id: '1',
          orderNo: 'PO20240101001',
          supplierId: '1',
          supplierName: '供应商A',
          items: [
            {
              productId: '101',
              productCode: 'PRD001',
              productName: '产品A',
              specification: '规格A',
              unit: '个',
              quantity: 100,
              unitPrice: 100.00
            },
            {
              productId: '102',
              productCode: 'PRD002',
              productName: '产品B',
              specification: '规格B',
              unit: '箱',
              quantity: 50,
              unitPrice: 200.00
            }
          ]
        },
        {
          id: '2',
          orderNo: 'PO20240101002',
          supplierId: '2',
          supplierName: '供应商B',
          items: [
            {
              productId: '103',
              productCode: 'PRD003',
              productName: '产品C',
              specification: '规格C',
              unit: '个',
              quantity: 200,
              unitPrice: 50.00
            }
          ]
        }
      ]
    },
    getMockWarehouses() {
      return [
        { id: '1', name: '主仓库' },
        { id: '2', name: '备用仓库' },
        { id: '3', name: '成品仓库' }
      ]
    },
    getMockLocations() {
      return [
        { code: 'A-01-01', name: 'A区-01排-01列' },
        { code: 'A-01-02', name: 'A区-01排-02列' },
        { code: 'B-02-01', name: 'B区-02排-01列' },
        { code: 'B-02-02', name: 'B区-02排-02列' }
      ]
    },
    getMockWarehouseInList() {
      return [
        {
          id: '1',
          receiptNo: 'RK20240101001',
          purchaseOrderNo: 'PO20240101001',
          purchaseOrderId: '1',
          supplierId: '1',
          supplierName: '供应商A',
          warehouseId: '1',
          warehouseName: '主仓库',
          type: 'normal',
          status: 'completed',
          totalAmount: 20000,
          totalQuantity: 150,
          operatorName: '张三',
          createTime: '2024-01-01 10:00:00',
          confirmTime: '2024-01-01 14:00:00',
          remark: '正常入库',
          items: [
            {
              productCode: 'PRD001',
              productName: '产品A',
              specification: '规格A',
              unit: '个',
              purchaseQuantity: 100,
              inQuantity: 100,
              unitPrice: 100.00,
              batchNo: 'BATCH001',
              expiryDate: '2025-01-01',
              locationCode: 'A-01-01'
            },
            {
              productCode: 'PRD002',
              productName: '产品B',
              specification: '规格B',
              unit: '箱',
              purchaseQuantity: 50,
              inQuantity: 50,
              unitPrice: 200.00,
              batchNo: 'BATCH002',
              expiryDate: '2025-01-01',
              locationCode: 'A-01-02'
            }
          ]
        },
        {
          id: '2',
          receiptNo: 'RK20240102001',
          purchaseOrderNo: 'PO20240101002',
          purchaseOrderId: '2',
          supplierId: '2',
          supplierName: '供应商B',
          warehouseId: '1',
          warehouseName: '主仓库',
          type: 'normal',
          status: 'pending',
          totalAmount: 10000,
          totalQuantity: 200,
          operatorName: '李四',
          createTime: '2024-01-02 09:00:00',
          confirmTime: '',
          remark: '待入库',
          items: [
            {
              productCode: 'PRD003',
              productName: '产品C',
              specification: '规格C',
              unit: '个',
              purchaseQuantity: 200,
              inQuantity: 200,
              unitPrice: 50.00,
              batchNo: '',
              expiryDate: '',
              locationCode: ''
            }
          ]
        }
      ]
    }
  }
}
</script>

<style scoped>
.warehouse-in-container {
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
</style>