<template>
  <div class="stock-transfer-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>库存转移管理</h2>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" icon="el-icon-plus" @click="showCreateForm = true">
        新建转移单
      </el-button>
      <el-button type="info" icon="el-icon-printer" @click="handlePrint">
        打印
      </el-button>
      <el-button type="info" icon="el-icon-download" @click="handleExport">
        导出
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-area">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="转移单号">
          <el-input v-model="searchForm.transferCode" placeholder="请输入转移单号" clearable></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待审核" value="pending"></el-option>
            <el-option label="审核中" value="reviewing"></el-option>
            <el-option label="已审核" value="approved"></el-option>
            <el-option label="已完成" value="completed"></el-option>
            <el-option label="已取消" value="cancelled"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="转出仓库">
          <el-select v-model="searchForm.fromWarehouseId" placeholder="请选择转出仓库" clearable>
            <el-option v-for="warehouse in warehouses" :key="warehouse.id" :label="warehouse.name" :value="warehouse.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="转入仓库">
          <el-select v-model="searchForm.toWarehouseId" placeholder="请选择转入仓库" clearable>
            <el-option v-for="warehouse in warehouses" :key="warehouse.id" :label="warehouse.name" :value="warehouse.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="转移日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 转移单列表 -->
    <div class="table-area">
      <el-table :data="transferListData" style="width: 100%" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="transferCode" label="转移单号" width="180"></el-table-column>
        <el-table-column prop="fromWarehouseName" label="转出仓库" width="150"></el-table-column>
        <el-table-column prop="toWarehouseName" label="转入仓库" width="150"></el-table-column>
        <el-table-column prop="transferDate" label="转移日期" width="120"></el-table-column>
        <el-table-column prop="totalItems" label="总项数" width="80"></el-table-column>
        <el-table-column prop="totalQuantity" label="总数量" width="80"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdBy" label="制单人" width="100"></el-table-column>
        <el-table-column prop="createdTime" label="制单时间" width="180"></el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button v-if="['pending', 'reviewing'].includes(scope.row.status)" type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button v-if="['pending'].includes(scope.row.status)" type="text" size="small" @click="handleCancel(scope.row)" style="color: #f56c6c">取消</el-button>
            <el-button v-if="['pending'].includes(scope.row.status)" type="text" size="small" @click="handleSubmit(scope.row)" style="color: #409eff">提交</el-button>
            <el-button v-if="['reviewing'].includes(scope.row.status)" type="text" size="small" @click="handleApprove(scope.row)" style="color: #67c23a">审核</el-button>
            <el-button v-if="['approved'].includes(scope.row.status)" type="text" size="small" @click="handleComplete(scope.row)" style="color: #67c23a">完成</el-button>
            <el-button type="text" size="small" @click="handleView(scope.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
        ></el-pagination>
      </div>
    </div>

    <!-- 创建/编辑转移单对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="showCreateForm"
      width="80%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form :model="transferForm" ref="transferFormRef" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="转移单号" prop="transferCode">
              <el-input v-model="transferForm.transferCode" :disabled="true" placeholder="系统自动生成"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="转移日期" prop="transferDate">
              <el-date-picker v-model="transferForm.transferDate" type="date" placeholder="选择日期" style="width: 100%" value-format="yyyy-MM-dd"></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="转出仓库" prop="fromWarehouseId">
              <el-select v-model="transferForm.fromWarehouseId" placeholder="请选择转出仓库" @change="onFromWarehouseChange">
                <el-option v-for="warehouse in warehouses" :key="warehouse.id" :label="warehouse.name" :value="warehouse.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="转入仓库" prop="toWarehouseId">
              <el-select v-model="transferForm.toWarehouseId" placeholder="请选择转入仓库" @change="onToWarehouseChange">
                <el-option v-for="warehouse in warehouses" :key="warehouse.id" :label="warehouse.name" :value="warehouse.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="转移原因" prop="reason">
              <el-input v-model="transferForm.reason" type="textarea" rows="3" placeholder="请输入转移原因"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 转移明细 -->
        <div class="transfer-items-section">
          <div class="section-header">
            <h3>转移明细</h3>
            <el-button type="primary" size="small" @click="showAddItemDialog = true">
              添加明细
            </el-button>
            <el-button type="info" size="small" @click="importFromInventory">
              从库存导入
            </el-button>
          </div>

          <el-table :data="transferItems" style="width: 100%" stripe @selection-change="handleItemSelectionChange">
            <el-table-column type="selection" width="55"></el-table-column>
            <el-table-column prop="productCode" label="产品编码" width="120"></el-table-column>
            <el-table-column prop="productName" label="产品名称" width="180"></el-table-column>
            <el-table-column prop="specification" label="规格" width="150"></el-table-column>
            <el-table-column prop="unit" label="单位" width="80"></el-table-column>
            <el-table-column prop="batchNo" label="批次号" width="150"></el-table-column>
            <el-table-column prop="expiryDate" label="有效期" width="120"></el-table-column>
            <el-table-column prop="fromLocation" label="转出位置" width="100">
              <template #default="scope">
                <el-select v-model="scope.row.fromLocation" placeholder="请选择">
                  <el-option v-for="loc in fromLocations" :key="loc.code" :label="loc.code" :value="loc.code"></el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="toLocation" label="转入位置" width="100">
              <template #default="scope">
                <el-select v-model="scope.row.toLocation" placeholder="请选择">
                  <el-option v-for="loc in toLocations" :key="loc.code" :label="loc.code" :value="loc.code"></el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="availableQuantity" label="可用库存" width="100"></el-table-column>
            <el-table-column prop="quantity" label="转移数量" width="100">
              <template #default="scope">
                <el-input-number
                  v-model="scope.row.quantity"
                  :min="1"
                  :max="scope.row.availableQuantity"
                  @change="updateTotal"
                ></el-input-number>
              </template>
            </el-table-column>
            <el-table-column prop="unitCost" label="单位成本" width="100"></el-table-column>
            <el-table-column prop="subtotal" label="小计" width="100" :formatter="formatCurrency"></el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button type="text" size="small" @click="handleEditItem(scope.row)">编辑</el-button>
                <el-button type="text" size="small" @click="handleDeleteItem(scope.row)" style="color: #f56c6c">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 批量删除按钮 -->
          <div v-if="selectedItems.length > 0" class="batch-operations">
            <el-button type="danger" size="small" @click="handleBatchDelete">
              批量删除 ({{ selectedItems.length }})
            </el-button>
          </div>

          <!-- 汇总信息 -->
          <div class="summary-info">
            <span>总项数: {{ transferItems.length }}</span>
            <span>总数量: {{ totalQuantity }}</span>
            <span>总金额: {{ formatCurrency(totalAmount) }}</span>
          </div>
        </div>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveTransferForm">保存</el-button>
      </div>
    </el-dialog>

    <!-- 添加/编辑明细项对话框 -->
    <el-dialog
      :title="itemDialogTitle"
      :visible.sync="showAddItemDialog"
      width="60%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form :model="itemForm" ref="itemFormRef" :rules="itemFormRules" label-width="120px">
        <el-form-item label="产品" prop="productId">
          <el-select v-model="itemForm.productId" placeholder="请选择产品" filterable @change="onProductChange">
            <el-option v-for="product in availableProducts" :key="product.id" :label="`${product.code} - ${product.name} (${product.specification})`" :value="product.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="批次号" prop="batchNo">
          <el-select v-model="itemForm.batchNo" placeholder="请选择批次" @change="onBatchChange">
            <el-option v-for="batch in productBatches" :key="batch.batchNo" :label="batch.batchNo" :value="batch.batchNo"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="有效期" prop="expiryDate">
          <el-date-picker v-model="itemForm.expiryDate" type="date" placeholder="选择日期" style="width: 100%" value-format="yyyy-MM-dd"></el-date-picker>
        </el-form-item>
        <el-form-item label="转出位置" prop="fromLocation">
          <el-select v-model="itemForm.fromLocation" placeholder="请选择转出位置">
            <el-option v-for="loc in fromLocations" :key="loc.code" :label="loc.code" :value="loc.code"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="转入位置" prop="toLocation">
          <el-select v-model="itemForm.toLocation" placeholder="请选择转入位置">
            <el-option v-for="loc in toLocations" :key="loc.code" :label="loc.code" :value="loc.code"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="可用库存" prop="availableQuantity">
          <el-input v-model="itemForm.availableQuantity" :disabled="true" placeholder="0"></el-input>
        </el-form-item>
        <el-form-item label="转移数量" prop="quantity">
          <el-input-number
            v-model="itemForm.quantity"
            :min="1"
            :max="itemForm.availableQuantity"
            placeholder="请输入转移数量"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="单位成本" prop="unitCost">
          <el-input v-model.number="itemForm.unitCost" type="number" step="0.01" placeholder="请输入单位成本"></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="itemForm.remark" type="textarea" rows="3" placeholder="请输入备注信息"></el-input>
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="showAddItemDialog = false">取消</el-button>
        <el-button type="primary" @click="saveItem">保存</el-button>
      </div>
    </el-dialog>

    <!-- 从库存导入对话框 -->
    <el-dialog
      title="从库存导入"
      :visible.sync="showImportDialog"
      width="80%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="import-dialog-content">
        <el-form :inline="true" :model="inventorySearchForm" class="search-form">
          <el-form-item label="产品编码/名称">
            <el-input v-model="inventorySearchForm.keyword" placeholder="请输入产品编码或名称" clearable></el-input>
          </el-form-item>
          <el-form-item label="批次号">
            <el-input v-model="inventorySearchForm.batchNo" placeholder="请输入批次号" clearable></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="searchInventory">查询</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="inventoryList" style="width: 100%" stripe @selection-change="handleInventorySelectionChange">
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="productCode" label="产品编码" width="120"></el-table-column>
          <el-table-column prop="productName" label="产品名称" width="180"></el-table-column>
          <el-table-column prop="specification" label="规格" width="150"></el-table-column>
          <el-table-column prop="unit" label="单位" width="80"></el-table-column>
          <el-table-column prop="batchNo" label="批次号" width="150"></el-table-column>
          <el-table-column prop="expiryDate" label="有效期" width="120"></el-table-column>
          <el-table-column prop="location" label="存放位置" width="100"></el-table-column>
          <el-table-column prop="quantity" label="库存数量" width="100"></el-table-column>
          <el-table-column prop="unitCost" label="单位成本" width="100"></el-table-column>
          <el-table-column label="导入数量" width="120">
            <template #default="scope">
              <el-input-number
                v-model="scope.row.importQuantity"
                :min="1"
                :max="scope.row.quantity"
                size="small"
              ></el-input-number>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmImport" :disabled="selectedInventoryItems.length === 0">
          确认导入 ({{ selectedInventoryItems.length }})
        </el-button>
      </div>
    </el-dialog>

    <!-- 确认对话框 -->
    <el-dialog
      :title="confirmDialog.title"
      :visible.sync="confirmDialog.visible"
      width="40%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="confirm-content">
        <p>{{ confirmDialog.content }}</p>
        <el-form v-if="confirmDialog.showReason" :model="confirmDialog" label-width="80px">
          <el-form-item label="原因">
            <el-input v-model="confirmDialog.reason" type="textarea" rows="3" placeholder="请输入原因"></el-input>
          </el-form-item>
        </el-form>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="confirmDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmAction">{{ confirmDialog.confirmText }}</el-button>
      </div>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      title="转移单详情"
      :visible.sync="showDetailDialog"
      width="80%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="转移单号">{{ currentTransfer.transferCode }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="getStatusType(currentTransfer.status)">{{ getStatusText(currentTransfer.status) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="转移日期">{{ currentTransfer.transferDate }}</el-descriptions-item>
          <el-descriptions-item label="转出仓库">{{ currentTransfer.fromWarehouseName }}</el-descriptions-item>
          <el-descriptions-item label="转入仓库">{{ currentTransfer.toWarehouseName }}</el-descriptions-item>
          <el-descriptions-item label="转移原因">{{ currentTransfer.reason }}</el-descriptions-item>
          <el-descriptions-item label="制单人">{{ currentTransfer.createdBy }}</el-descriptions-item>
          <el-descriptions-item label="制单时间">{{ currentTransfer.createdTime }}</el-descriptions-item>
          <el-descriptions-item label="审核人" :span="1">{{ currentTransfer.approvedBy || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ currentTransfer.approvedTime || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <h3>转移明细</h3>
          <el-table :data="currentTransfer.items || []" style="width: 100%" stripe>
            <el-table-column prop="productCode" label="产品编码" width="120"></el-table-column>
            <el-table-column prop="productName" label="产品名称" width="180"></el-table-column>
            <el-table-column prop="specification" label="规格" width="150"></el-table-column>
            <el-table-column prop="unit" label="单位" width="80"></el-table-column>
            <el-table-column prop="batchNo" label="批次号" width="150"></el-table-column>
            <el-table-column prop="expiryDate" label="有效期" width="120"></el-table-column>
            <el-table-column prop="fromLocation" label="转出位置" width="100"></el-table-column>
            <el-table-column prop="toLocation" label="转入位置" width="100"></el-table-column>
            <el-table-column prop="quantity" label="转移数量" width="100"></el-table-column>
            <el-table-column prop="unitCost" label="单位成本" width="100"></el-table-column>
            <el-table-column prop="subtotal" label="小计" width="100" :formatter="formatCurrency"></el-table-column>
          </el-table>
        </div>

        <div class="detail-summary">
          <span>总项数: {{ (currentTransfer.items || []).length }}</span>
          <span>总数量: {{ currentTransfer.totalQuantity || 0 }}</span>
          <span>总金额: {{ formatCurrency(currentTransfer.totalAmount || 0) }}</span>
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'StockTransfer',
  data() {
    return {
      // 搜索表单
      searchForm: {
        transferCode: '',
        status: '',
        fromWarehouseId: '',
        toWarehouseId: '',
        dateRange: []
      },
      // 分页信息
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      // 转移单列表
      transferList: [],
      // 仓库列表
      warehouses: [
        { id: 1, name: '主仓库' },
        { id: 2, name: '原料仓库' },
        { id: 3, name: '成品仓库' },
        { id: 4, name: '备件仓库' }
      ],
      // 选中的转移单
      selectedRows: [],
      // 对话框显示状态
      showCreateForm: false,
      showAddItemDialog: false,
      showImportDialog: false,
      confirmDialog: {
        visible: false,
        title: '',
        content: '',
        confirmText: '',
        showReason: false,
        reason: '',
        callback: null
      },
      showDetailDialog: false,
      // 当前编辑的转移单
      currentTransfer: {},
      // 转移单表单
      transferForm: {
        id: '',
        transferCode: '',
        transferDate: '',
        fromWarehouseId: '',
        toWarehouseId: '',
        reason: '',
        items: []
      },
      // 转移明细列表
      transferItems: [],
      // 选中的明细项
      selectedItems: [],
      // 明细项表单
      itemForm: {
        id: '',
        productId: '',
        productCode: '',
        productName: '',
        specification: '',
        unit: '',
        batchNo: '',
        expiryDate: '',
        fromLocation: '',
        toLocation: '',
        availableQuantity: 0,
        quantity: 1,
        unitCost: 0,
        remark: ''
      },
      // 可用产品列表
      availableProducts: [
        { id: 1, code: 'P001', name: 'A材料', specification: '规格A', unit: 'kg' },
        { id: 2, code: 'P002', name: 'B材料', specification: '规格B', unit: 'kg' },
        { id: 3, code: 'P003', name: 'C材料', specification: '规格C', unit: 'kg' },
        { id: 4, code: 'P004', name: 'D材料', specification: '规格D', unit: 'kg' }
      ],
      // 产品批次列表
      productBatches: [],
      // 转出位置列表
      fromLocations: [],
      // 转入位置列表
      toLocations: [],
      // 库存搜索表单
      inventorySearchForm: {
        keyword: '',
        batchNo: ''
      },
      // 库存列表
      inventoryList: [],
      // 选中的库存项
      selectedInventoryItems: []
    }
  },
  computed: {
    // 转移单列表数据
    transferListData() {
      return this.transferList
    },
    // 对话框标题
    dialogTitle() {
      return this.transferForm.id ? '编辑转移单' : '新建转移单'
    },
    // 明细项对话框标题
    itemDialogTitle() {
      return this.itemForm.id ? '编辑明细项' : '添加明细项'
    },
    // 总数量
    totalQuantity() {
      return this.transferItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
    },
    // 总金额
    totalAmount() {
      return this.transferItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitCost || 0)), 0)
    }
  },
  watch: {
    // 监听转移单状态变化
    showCreateForm(val) {
      if (val) {
        this.resetTransferForm()
      }
    },
    showAddItemDialog(val) {
      if (val && !this.itemForm.id) {
        this.resetItemForm()
      }
    }
  },
  created() {
    this.initData()
  },
  methods: {
    // 初始化数据
    initData() {
      this.loadTransferList()
      this.loadLocations()
    },
    // 加载转移单列表
    loadTransferList() {
      // 模拟数据
      this.transferList = [
        {
          id: 1,
          transferCode: 'ZYD20240101001',
          transferDate: '2024-01-01',
          fromWarehouseId: 1,
          fromWarehouseName: '主仓库',
          toWarehouseId: 2,
          toWarehouseName: '原料仓库',
          reason: '调整库存分布',
          totalItems: 2,
          totalQuantity: 150,
          totalAmount: 15000,
          status: 'pending',
          createdBy: '张三',
          createdTime: '2024-01-01 09:00:00',
          items: [
            { productCode: 'P001', productName: 'A材料', specification: '规格A', unit: 'kg', batchNo: 'B20240101', expiryDate: '2025-01-01', fromLocation: 'A1-1', toLocation: 'B1-1', quantity: 100, unitCost: 100, subtotal: 10000 },
            { productCode: 'P002', productName: 'B材料', specification: '规格B', unit: 'kg', batchNo: 'B20240102', expiryDate: '2025-02-01', fromLocation: 'A1-2', toLocation: 'B1-2', quantity: 50, unitCost: 100, subtotal: 5000 }
          ]
        },
        {
          id: 2,
          transferCode: 'ZYD20240102001',
          transferDate: '2024-01-02',
          fromWarehouseId: 2,
          fromWarehouseName: '原料仓库',
          toWarehouseId: 3,
          toWarehouseName: '成品仓库',
          reason: '生产需要',
          totalItems: 1,
          totalQuantity: 200,
          totalAmount: 20000,
          status: 'approved',
          createdBy: '李四',
          createdTime: '2024-01-02 10:00:00',
          approvedBy: '王五',
          approvedTime: '2024-01-02 11:00:00',
          items: [
            { productCode: 'P003', productName: 'C材料', specification: '规格C', unit: 'kg', batchNo: 'B20240103', expiryDate: '2025-03-01', fromLocation: 'B1-3', toLocation: 'C1-1', quantity: 200, unitCost: 100, subtotal: 20000 }
          ]
        }
      ]
      this.pagination.total = this.transferList.length
    },
    // 加载库位信息
    loadLocations() {
      this.fromLocations = [
        { code: 'A1-1', name: 'A区1排1号' },
        { code: 'A1-2', name: 'A区1排2号' },
        { code: 'A1-3', name: 'A区1排3号' }
      ]
      this.toLocations = [
        { code: 'B1-1', name: 'B区1排1号' },
        { code: 'B1-2', name: 'B区1排2号' },
        { code: 'B1-3', name: 'B区1排3号' }
      ]
    },
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        pending: '待审核',
        reviewing: '审核中',
        approved: '已审核',
        completed: '已完成',
        cancelled: '已取消'
      }
      return statusMap[status] || status
    },
    // 获取状态类型
    getStatusType(status) {
      const typeMap = {
        pending: 'warning',
        reviewing: 'info',
        approved: 'success',
        completed: 'success',
        cancelled: 'danger'
      }
      return typeMap[status] || 'default'
    },
    // 格式化货币
    formatCurrency(value) {
      return `¥${(value || 0).toFixed(2)}`
    },
    // 重置转移单表单
    resetTransferForm() {
      this.transferForm = {
        id: '',
        transferCode: this.generateTransferCode(),
        transferDate: this.formatDate(new Date()),
        fromWarehouseId: '',
        toWarehouseId: '',
        reason: '',
        items: []
      }
      this.transferItems = []
    },
    // 重置明细项表单
    resetItemForm() {
      this.itemForm = {
        id: '',
        productId: '',
        productCode: '',
        productName: '',
        specification: '',
        unit: '',
        batchNo: '',
        expiryDate: '',
        fromLocation: this.fromLocations.length > 0 ? this.fromLocations[0].code : '',
        toLocation: this.toLocations.length > 0 ? this.toLocations[0].code : '',
        availableQuantity: 0,
        quantity: 1,
        unitCost: 0,
        remark: ''
      }
      this.productBatches = []
    },
    // 生成转移单号
    generateTransferCode() {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
      return `ZYD${year}${month}${day}${random}`
    },
    // 格式化日期
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    // 查询
    handleSearch() {
      // 模拟搜索
      this.pagination.currentPage = 1
      this.loadTransferList()
    },
    // 重置搜索
    resetSearch() {
      this.searchForm = {
        transferCode: '',
        status: '',
        fromWarehouseId: '',
        toWarehouseId: '',
        dateRange: []
      }
      this.handleSearch()
    },
    // 分页大小变化
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.loadTransferList()
    },
    // 当前页码变化
    handleCurrentChange(current) {
      this.pagination.currentPage = current
      this.loadTransferList()
    },
    // 选择行变化
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },
    // 选择明细项变化
    handleItemSelectionChange(selection) {
      this.selectedItems = selection
    },
    // 选择库存项变化
    handleInventorySelectionChange(selection) {
      this.selectedInventoryItems = selection
    },
    // 关闭对话框
    closeDialog() {
      this.showCreateForm = false
      this.showAddItemDialog = false
      this.showImportDialog = false
    },
    // 编辑转移单
    handleEdit(row) {
      this.currentTransfer = { ...row }
      this.transferForm = {
        id: row.id,
        transferCode: row.transferCode,
        transferDate: row.transferDate,
        fromWarehouseId: row.fromWarehouseId,
        toWarehouseId: row.toWarehouseId,
        reason: row.reason,
        items: row.items || []
      }
      this.transferItems = JSON.parse(JSON.stringify(row.items || []))
      this.onFromWarehouseChange(row.fromWarehouseId)
      this.onToWarehouseChange(row.toWarehouseId)
      this.showCreateForm = true
    },
    // 查看转移单
    handleView(row) {
      this.currentTransfer = { ...row }
      this.showDetailDialog = true
    },
    // 取消转移单
    handleCancel(row) {
      this.confirmDialog = {
        visible: true,
        title: '取消转移单',
        content: `确定要取消转移单「${row.transferCode}」吗？`,
        confirmText: '确定取消',
        showReason: true,
        reason: '',
        callback: () => {
          this.doCancel(row)
        }
      }
    },
    // 提交转移单
    handleSubmit(row) {
      this.confirmDialog = {
        visible: true,
        title: '提交转移单',
        content: `确定要提交转移单「${row.transferCode}」进行审核吗？`,
        confirmText: '确定提交',
        showReason: false,
        reason: '',
        callback: () => {
          this.doSubmit(row)
        }
      }
    },
    // 审核转移单
    handleApprove(row) {
      this.confirmDialog = {
        visible: true,
        title: '审核转移单',
        content: `确定要审核通过转移单「${row.transferCode}」吗？`,
        confirmText: '审核通过',
        showReason: true,
        reason: '',
        callback: () => {
          this.doApprove(row)
        }
      }
    },
    // 完成转移单
    handleComplete(row) {
      this.confirmDialog = {
        visible: true,
        title: '完成转移单',
        content: `确定要标记转移单「${row.transferCode}」为已完成吗？`,
        confirmText: '确定完成',
        showReason: false,
        reason: '',
        callback: () => {
          this.doComplete(row)
        }
      }
    },
    // 确认操作
    confirmAction() {
      if (this.confirmDialog.callback) {
        this.confirmDialog.callback()
      }
      this.confirmDialog.visible = false
    },
    // 执行取消
    doCancel(row) {
      // 模拟取消操作
      const index = this.transferList.findIndex(item => item.id === row.id)
      if (index !== -1) {
        this.transferList[index].status = 'cancelled'
        this.$message.success('转移单已取消')
      }
    },
    // 执行提交
    doSubmit(row) {
      // 模拟提交操作
      const index = this.transferList.findIndex(item => item.id === row.id)
      if (index !== -1) {
        this.transferList[index].status = 'reviewing'
        this.$message.success('转移单已提交')
      }
    },
    // 执行审核
    doApprove(row) {
      // 模拟审核操作
      const index = this.transferList.findIndex(item => item.id === row.id)
      if (index !== -1) {
        this.transferList[index].status = 'approved'
        this.transferList[index].approvedBy = '当前用户'
        this.transferList[index].approvedTime = new Date().toLocaleString()
        this.$message.success('转移单已审核通过')
      }
    },
    // 执行完成
    doComplete(row) {
      // 模拟完成操作
      const index = this.transferList.findIndex(item => item.id === row.id)
      if (index !== -1) {
        this.transferList[index].status = 'completed'
        this.$message.success('转移单已完成')
      }
    },
    // 保存转移单
    saveTransferForm() {
      // 验证表单
      if (!this.transferForm.fromWarehouseId) {
        this.$message.error('请选择转出仓库')
        return
      }
      if (!this.transferForm.toWarehouseId) {
        this.$message.error('请选择转入仓库')
        return
      }
      if (this.transferForm.fromWarehouseId === this.transferForm.toWarehouseId) {
        this.$message.error('转出仓库和转入仓库不能相同')
        return
      }
      if (this.transferItems.length === 0) {
        this.$message.error('请至少添加一条明细')
        return
      }

      // 保存明细到表单
      this.transferForm.items = JSON.parse(JSON.stringify(this.transferItems))

      // 模拟保存操作
      if (this.transferForm.id) {
        // 编辑
        const index = this.transferList.findIndex(item => item.id === this.transferForm.id)
        if (index !== -1) {
          this.transferList[index] = {
            ...this.transferList[index],
            ...this.transferForm,
            totalItems: this.transferItems.length,
            totalQuantity: this.totalQuantity,
            totalAmount: this.totalAmount
          }
          this.$message.success('转移单已更新')
        }
      } else {
        // 新增
        const newTransfer = {
          ...this.transferForm,
          id: Date.now(),
          fromWarehouseName: this.warehouses.find(w => w.id === this.transferForm.fromWarehouseId)?.name || '',
          toWarehouseName: this.warehouses.find(w => w.id === this.transferForm.toWarehouseId)?.name || '',
          totalItems: this.transferItems.length,
          totalQuantity: this.totalQuantity,
          totalAmount: this.totalAmount,
          status: 'pending',
          createdBy: '当前用户',
          createdTime: new Date().toLocaleString(),
          items: this.transferForm.items
        }
        this.transferList.unshift(newTransfer)
        this.pagination.total = this.transferList.length
        this.$message.success('转移单已创建')
      }

      this.closeDialog()
    },
    // 编辑明细项
    handleEditItem(row) {
      this.itemForm = { ...row }
      this.showAddItemDialog = true
    },
    // 删除明细项
    handleDeleteItem(row) {
      const index = this.transferItems.findIndex(item => item.id === row.id)
      if (index !== -1) {
        this.transferItems.splice(index, 1)
        this.$message.success('明细项已删除')
      }
    },
    // 批量删除明细项
    handleBatchDelete() {
      this.confirmDialog = {
        visible: true,
        title: '批量删除',
        content: `确定要删除选中的 ${this.selectedItems.length} 条明细项吗？`,
        confirmText: '确定删除',
        showReason: false,
        reason: '',
        callback: () => {
          const idsToDelete = this.selectedItems.map(item => item.id)
          this.transferItems = this.transferItems.filter(item => !idsToDelete.includes(item.id))
          this.selectedItems = []
          this.$message.success(`已删除 ${idsToDelete.length} 条明细项`)
        }
      }
    },
    // 保存明细项
    saveItem() {
      // 验证表单
      if (!this.itemForm.productId) {
        this.$message.error('请选择产品')
        return
      }
      if (!this.itemForm.quantity || this.itemForm.quantity <= 0) {
        this.$message.error('请输入有效的转移数量')
        return
      }
      if (this.itemForm.quantity > this.itemForm.availableQuantity) {
        this.$message.error('转移数量不能超过可用库存')
        return
      }

      // 计算小计
      const subtotal = this.itemForm.quantity * this.itemForm.unitCost

      // 保存
      if (this.itemForm.id) {
        // 编辑
        const index = this.transferItems.findIndex(item => item.id === this.itemForm.id)
        if (index !== -1) {
          this.transferItems[index] = {
            ...this.itemForm,
            subtotal
          }
          this.$message.success('明细项已更新')
        }
      } else {
        // 新增
        const newItem = {
          ...this.itemForm,
          id: Date.now(),
          subtotal
        }
        this.transferItems.push(newItem)
        this.$message.success('明细项已添加')
      }

      this.showAddItemDialog = false
      this.updateTotal()
    },
    // 更新汇总信息
    updateTotal() {
      // 重新计算每个明细项的小计
      this.transferItems.forEach(item => {
        item.subtotal = (item.quantity || 0) * (item.unitCost || 0)
      })
    },
    // 从库存导入
    importFromInventory() {
      if (!this.transferForm.fromWarehouseId) {
        this.$message.error('请先选择转出仓库')
        return
      }
      this.searchInventory()
      this.showImportDialog = true
    },
    // 搜索库存
    searchInventory() {
      // 模拟库存数据
      this.inventoryList = [
        {
          id: 1,
          productCode: 'P001',
          productName: 'A材料',
          specification: '规格A',
          unit: 'kg',
          batchNo: 'B20240101',
          expiryDate: '2025-01-01',
          location: 'A1-1',
          quantity: 500,
          unitCost: 100,
          importQuantity: 1
        },
        {
          id: 2,
          productCode: 'P002',
          productName: 'B材料',
          specification: '规格B',
          unit: 'kg',
          batchNo: 'B20240102',
          expiryDate: '2025-02-01',
          location: 'A1-2',
          quantity: 300,
          unitCost: 100,
          importQuantity: 1
        },
        {
          id: 3,
          productCode: 'P003',
          productName: 'C材料',
          specification: '规格C',
          unit: 'kg',
          batchNo: 'B20240103',
          expiryDate: '2025-03-01',
          location: 'A1-3',
          quantity: 200,
          unitCost: 100,
          importQuantity: 1
        }
      ]
    },
    // 确认导入
    confirmImport() {
      // 导入选中的库存项
      this.selectedInventoryItems.forEach(inventory => {
        if (inventory.importQuantity && inventory.importQuantity > 0) {
          const newItem = {
            id: Date.now() + Math.random(),
            productCode: inventory.productCode,
            productName: inventory.productName,
            specification: inventory.specification,
            unit: inventory.unit,
            batchNo: inventory.batchNo,
            expiryDate: inventory.expiryDate,
            fromLocation: inventory.location,
            toLocation: this.toLocations.length > 0 ? this.toLocations[0].code : '',
            availableQuantity: inventory.quantity,
            quantity: inventory.importQuantity,
            unitCost: inventory.unitCost,
            subtotal: inventory.importQuantity * inventory.unitCost
          }
          this.transferItems.push(newItem)
        }
      })
      
      this.$message.success(`成功导入 ${this.selectedInventoryItems.length} 条库存记录`)
      this.showImportDialog = false
      this.selectedInventoryItems = []
    },
    // 转出仓库变化
    onFromWarehouseChange(warehouseId) {
      // 模拟根据仓库加载库位
      if (warehouseId === 1) {
        this.fromLocations = [
          { code: 'A1-1', name: 'A区1排1号' },
          { code: 'A1-2', name: 'A区1排2号' },
          { code: 'A1-3', name: 'A区1排3号' }
        ]
      } else if (warehouseId === 2) {
        this.fromLocations = [
          { code: 'B1-1', name: 'B区1排1号' },
          { code: 'B1-2', name: 'B区1排2号' },
          { code: 'B1-3', name: 'B区1排3号' }
        ]
      }
    },
    // 转入仓库变化
    onToWarehouseChange(warehouseId) {
      // 模拟根据仓库加载库位
      if (warehouseId === 2) {
        this.toLocations = [
          { code: 'B1-1', name: 'B区1排1号' },
          { code: 'B1-2', name: 'B区1排2号' },
          { code: 'B1-3', name: 'B区1排3号' }
        ]
      } else if (warehouseId === 3) {
        this.toLocations = [
          { code: 'C1-1', name: 'C区1排1号' },
          { code: 'C1-2', name: 'C区1排2号' },
          { code: 'C1-3', name: 'C区1排3号' }
        ]
      }
    },
    // 产品变化
    onProductChange(productId) {
      const product = this.availableProducts.find(p => p.id === productId)
      if (product) {
        this.itemForm.productCode = product.code
        this.itemForm.productName = product.name
        this.itemForm.specification = product.specification
        this.itemForm.unit = product.unit
        // 模拟加载产品批次
        this.productBatches = [
          { batchNo: `B${product.code}001`, expiryDate: '2025-01-01' },
          { batchNo: `B${product.code}002`, expiryDate: '2025-02-01' }
        ]
        // 模拟可用库存
        this.itemForm.availableQuantity = 100
      }
    },
    // 批次变化
    onBatchChange(batchNo) {
      const batch = this.productBatches.find(b => b.batchNo === batchNo)
      if (batch) {
        this.itemForm.expiryDate = batch.expiryDate
      }
    },
    // 打印
    handlePrint() {
      if (this.selectedRows.length === 0) {
        this.$message.error('请先选择要打印的转移单')
        return
      }
      this.$message.success('打印功能待实现')
    },
    // 导出
    handleExport() {
      this.$message.success('导出功能待实现')
    }
  }
}
</script>

<style scoped>
.stock-transfer-container {
  padding: 20px;
  background-color: #f5f7fa;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
  font-size: 18px;
}

.toolbar {
  margin-bottom: 20px;
}

.toolbar .el-button + .el-button {
  margin-left: 10px;
}

.search-area {
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.search-form .el-form-item {
  margin-right: 15px;
  margin-bottom: 15px;
}

.table-area {
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.transfer-items-section {
  margin-top: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.section-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.section-header .el-button + .el-button {
  margin-left: 10px;
}

.batch-operations {
  margin-top: 10px;
  display: flex;
  justify-content: flex-start;
}

.summary-info {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
  font-weight: bold;
  color: #303133;
}

.summary-info span {
  margin-left: 20px;
}

.import-dialog-content {
  max-height: 500px;
  overflow-y: auto;
}

.detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.detail-section {
  margin-top: 20px;
}

.detail-section h3 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.detail-summary {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
  font-weight: bold;
  color: #303133;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
}

.detail-summary span {
  margin-left: 20px;
}

.confirm-content {
  padding: 10px 0;
}

.confirm-content p {
  margin: 0 0 15px 0;
  color: #606266;
  line-height: 1.8;
}
</style>