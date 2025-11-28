<template>
  <div class="receipt-items-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>收货明细管理</span>
        <el-button type="primary" size="small" @click="handleRefresh" style="float: right;">
          刷新
        </el-button>
      </div>

      <!-- 搜索筛选区域 -->
      <el-form :inline="true" :model="searchForm" class="search-form" size="small">
        <el-form-item label="收货单号">
          <el-input v-model="searchForm.receiptNo" placeholder="请输入收货单号" clearable></el-input>
        </el-form-item>
        <el-form-item label="物料编码">
          <el-input v-model="searchForm.materialCode" placeholder="请输入物料编码" clearable></el-input>
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="searchForm.materialName" placeholder="请输入物料名称" clearable></el-input>
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="searchForm.supplierId" placeholder="请选择供应商" clearable>
            <el-option v-for="supplier in suppliers" :key="supplier.id" :label="supplier.name" :value="supplier.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="收货日期">
          <el-date-picker
            v-model="searchForm.dateRange"
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

      <!-- 收货明细列表 -->
      <el-table
        :data="receiptItemsList"
        style="width: 100%"
        stripe
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="receiptNo" label="收货单号" min-width="180"></el-table-column>
        <el-table-column prop="materialCode" label="物料编码" min-width="120"></el-table-column>
        <el-table-column prop="materialName" label="物料名称" min-width="180"></el-table-column>
        <el-table-column prop="specification" label="规格型号" min-width="150"></el-table-column>
        <el-table-column prop="unit" label="单位" min-width="80"></el-table-column>
        <el-table-column prop="receivedQuantity" label="收货数量" align="right" min-width="100"></el-table-column>
        <el-table-column prop="unitPrice" label="单价" align="right" min-width="100">
          <template #default="scope">
            ¥{{ scope.row.unitPrice.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="总金额" align="right" min-width="120">
          <template #default="scope">
            ¥{{ scope.row.totalAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="batchNo" label="批次号" min-width="150"></el-table-column>
        <el-table-column prop="supplierName" label="供应商" min-width="150"></el-table-column>
        <el-table-column prop="receiptDate" label="收货日期" min-width="120"></el-table-column>
        <el-table-column prop="qualityStatus" label="质检状态" min-width="100">
          <template #default="scope">
            <el-tag :type="qualityStatusTypeMap[scope.row.qualityStatus]">
              {{ qualityStatusTextMap[scope.row.qualityStatus] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewDetail(scope.row)">查看</el-button>
            <el-button v-if="scope.row.qualityStatus === 'pending'" type="primary" size="small" @click="performQualityCheck(scope.row)">
              质检
            </el-button>
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

    <!-- 明细详情对话框 -->
    <el-dialog title="收货明细详情" :visible.sync="detailDialogVisible" width="70%">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="收货单号">{{ currentItem.receiptNo }}</el-descriptions-item>
        <el-descriptions-item label="物料编码">{{ currentItem.materialCode }}</el-descriptions-item>
        <el-descriptions-item label="物料名称">{{ currentItem.materialName }}</el-descriptions-item>
        <el-descriptions-item label="规格型号">{{ currentItem.specification }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ currentItem.unit }}</el-descriptions-item>
        <el-descriptions-item label="收货数量">{{ currentItem.receivedQuantity }}</el-descriptions-item>
        <el-descriptions-item label="单价">¥{{ (currentItem.unitPrice || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="总金额">¥{{ (currentItem.totalAmount || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="批次号">{{ currentItem.batchNo }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ currentItem.supplierName }}</el-descriptions-item>
        <el-descriptions-item label="收货日期">{{ currentItem.receiptDate }}</el-descriptions-item>
        <el-descriptions-item label="质检状态">
          <el-tag :type="qualityStatusTypeMap[currentItem.qualityStatus]">
            {{ qualityStatusTextMap[currentItem.qualityStatus] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="质检人">{{ currentItem.qualityInspector || '-' }}</el-descriptions-item>
        <el-descriptions-item label="质检日期">{{ currentItem.qualityDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentItem.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'ReceiptItems',
  data() {
    return {
      searchForm: {
        receiptNo: '',
        materialCode: '',
        materialName: '',
        supplierId: '',
        dateRange: []
      },
      receiptItemsList: [],
      suppliers: [
        { id: 1, name: '供应商A' },
        { id: 2, name: '供应商B' },
        { id: 3, name: '供应商C' }
      ],
      total: 0,
      pageSize: 20,
      currentPage: 1,
      selectedRows: [],
      detailDialogVisible: false,
      currentItem: {},
      qualityStatusTypeMap: {
        pending: 'info',
        qualified: 'success',
        unqualified: 'danger',
        inspecting: 'warning'
      },
      qualityStatusTextMap: {
        pending: '待质检',
        qualified: '合格',
        unqualified: '不合格',
        inspecting: '质检中'
      }
    }
  },
  mounted() {
    this.loadReceiptItems()
  },
  methods: {
    loadReceiptItems() {
      // 模拟数据
      this.receiptItemsList = [
        {
          id: 1,
          receiptNo: 'RC202311280001',
          materialCode: 'MAT001',
          materialName: '原材料A',
          specification: '规格A',
          unit: 'kg',
          receivedQuantity: 1000,
          unitPrice: 15.5,
          totalAmount: 15500,
          batchNo: 'BATCH20231128001',
          supplierName: '供应商A',
          receiptDate: '2023-11-28',
          qualityStatus: 'pending',
          qualityInspector: '',
          qualityDate: '',
          remark: ''
        },
        {
          id: 2,
          receiptNo: 'RC202311280002',
          materialCode: 'MAT002',
          materialName: '原材料B',
          specification: '规格B',
          unit: 'kg',
          receivedQuantity: 500,
          unitPrice: 22.8,
          totalAmount: 11400,
          batchNo: 'BATCH20231128002',
          supplierName: '供应商B',
          receiptDate: '2023-11-28',
          qualityStatus: 'qualified',
          qualityInspector: '张三',
          qualityDate: '2023-11-28',
          remark: '质检合格'
        }
      ]
      this.total = this.receiptItemsList.length
    },
    handleSearch() {
      this.currentPage = 1
      this.loadReceiptItems()
    },
    resetSearch() {
      this.searchForm = {
        receiptNo: '',
        materialCode: '',
        materialName: '',
        supplierId: '',
        dateRange: []
      }
      this.loadReceiptItems()
    },
    handleRefresh() {
      this.loadReceiptItems()
      this.$message.success('刷新成功')
    },
    handleSelectionChange(val) {
      this.selectedRows = val
    },
    handleSizeChange(val) {
      this.pageSize = val
      this.loadReceiptItems()
    },
    handleCurrentChange(val) {
      this.currentPage = val
      this.loadReceiptItems()
    },
    viewDetail(row) {
      this.currentItem = { ...row }
      this.detailDialogVisible = true
    },
    performQualityCheck(row) {
      this.$router.push({
        name: 'QualityCheck',
        query: { itemId: row.id }
      })
    },
    exportData() {
      this.$message.info('导出功能开发中...')
    }
  }
}
</script>

<style scoped>
.receipt-items-container {
  padding: 20px;
}

.box-card {
  margin-bottom: 20px;
}

.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}

.clearfix:after {
  clear: both;
}

.search-form {
  margin-top: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>
