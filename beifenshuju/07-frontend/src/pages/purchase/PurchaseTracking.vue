<template>
  <div class="purchase-tracking">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>采购跟踪管理</h1>
      <el-button type="primary" icon="el-icon-refresh" @click="handleRefresh">
        刷新数据
      </el-button>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入订单编号"></el-input>
        </el-form-item>
        <el-form-item label="物料编码/名称">
          <el-input v-model="searchForm.itemKeyword" placeholder="请输入物料编码或名称"></el-input>
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="searchForm.supplierId" placeholder="请选择供应商">
            <el-option
              v-for="supplier in suppliers"
              :key="supplier.id"
              :label="supplier.name"
              :value="supplier.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="交付状态">
          <el-select v-model="searchForm.deliveryStatus" placeholder="请选择交付状态">
            <el-option label="未交付" value="NOT_DELIVERED"></el-option>
            <el-option label="部分交付" value="PARTIALLY_DELIVERED"></el-option>
            <el-option label="已交付" value="DELIVERED"></el-option>
            <el-option label="延期" value="DELAYED"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="预计交付日期">
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

    <!-- 统计卡片 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.totalOrders }}</div>
              <div class="stat-label">跟踪中订单</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card warning">
            <div class="stat-content">
              <div class="stat-number">{{ stats.delayedOrders }}</div>
              <div class="stat-label">延期订单</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card success">
            <div class="stat-content">
              <div class="stat-number">{{ stats.completedOrders }}</div>
              <div class="stat-label">已完成订单</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card info">
            <div class="stat-content">
              <div class="stat-number">{{ formatCurrency(stats.totalAmount) }}</div>
              <div class="stat-label">订单总金额</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="trackingList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="orderNo" label="订单编号" width="180"></el-table-column>
        <el-table-column prop="supplierName" label="供应商" width="150"></el-table-column>
        <el-table-column prop="itemNo" label="物料编码" width="150"></el-table-column>
        <el-table-column prop="itemName" label="物料名称" width="200"></el-table-column>
        <el-table-column prop="specification" label="规格型号" width="120"></el-table-column>
        <el-table-column prop="unit" label="单位" width="80"></el-table-column>
        <el-table-column prop="orderQuantity" label="订购数量" width="100"></el-table-column>
        <el-table-column prop="receivedQuantity" label="已收数量" width="100"></el-table-column>
        <el-table-column prop="pendingQuantity" label="待收数量" width="100"></el-table-column>
        <el-table-column prop="deliveryDate" label="约定交付日期" width="150"></el-table-column>
        <el-table-column prop="latestDeliveryDate" label="最新交付日期" width="150"></el-table-column>
        <el-table-column prop="deliveryStatus" label="交付状态" width="120">
          <template slot-scope="scope">
            <el-tag :type="getDeliveryStatusTagType(scope.row.deliveryStatus)">
              {{ getDeliveryStatusText(scope.row.deliveryStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="trackingNotes" label="跟踪记录" width="150">
          <template slot-scope="scope">
            <el-tooltip :content="scope.row.trackingNotes || '暂无跟踪记录'" placement="top">
              <span>{{ scope.row.trackingNotes ? '查看' : '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button size="small" @click="handleViewDetails(scope.row)">详情</el-button>
            <el-button size="small" type="primary" @click="handleAddTrackingNote(scope.row)">跟踪</el-button>
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

    <!-- 详情对话框 -->
    <el-dialog
      title="采购跟踪详情"
      :visible.sync="detailDialogVisible"
      width="80%"
      :before-close="handleCloseDetailDialog"
    >
      <div class="tracking-detail">
        <!-- 基本信息 -->
        <el-descriptions title="订单物料信息" border>
          <el-descriptions-item label="订单编号">{{ currentTracking.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ currentTracking.supplierName }}</el-descriptions-item>
          <el-descriptions-item label="物料编码">{{ currentTracking.itemNo }}</el-descriptions-item>
          <el-descriptions-item label="物料名称">{{ currentTracking.itemName }}</el-descriptions-item>
          <el-descriptions-item label="规格型号">{{ currentTracking.specification }}</el-descriptions-item>
          <el-descriptions-item label="单位">{{ currentTracking.unit }}</el-descriptions-item>
          <el-descriptions-item label="订购数量">{{ currentTracking.orderQuantity }}</el-descriptions-item>
          <el-descriptions-item label="已收数量">{{ currentTracking.receivedQuantity }}</el-descriptions-item>
          <el-descriptions-item label="待收数量">{{ currentTracking.pendingQuantity }}</el-descriptions-item>
          <el-descriptions-item label="约定交付日期">{{ currentTracking.deliveryDate }}</el-descriptions-item>
          <el-descriptions-item label="最新交付日期">{{ currentTracking.latestDeliveryDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="交付状态">
            <el-tag :type="getDeliveryStatusTagType(currentTracking.deliveryStatus)">
              {{ getDeliveryStatusText(currentTracking.deliveryStatus) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 跟踪记录 -->
        <div class="mt-4">
          <h3>跟踪记录</h3>
          <div v-if="currentTracking.notes && currentTracking.notes.length > 0">
            <div
              v-for="(note, index) in currentTracking.notes"
              :key="index"
              class="tracking-note-item"
            >
              <div class="note-header">
                <span class="note-operator">{{ note.operator }}</span>
                <span class="note-time">{{ note.time }}</span>
              </div>
              <div class="note-content">{{ note.content }}</div>
              <div class="note-attachment" v-if="note.attachments && note.attachments.length > 0">
                <span>附件：</span>
                <el-link
                  v-for="(attachment, idx) in note.attachments"
                  :key="idx"
                  :underline="false"
                  @click="handleDownloadAttachment(attachment)"
                >
                  {{ attachment.name }}
                </el-link>
              </div>
            </div>
          </div>
          <div v-else class="no-data">暂无跟踪记录</div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleCloseDetailDialog">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 添加跟踪记录对话框 -->
    <el-dialog
      title="添加跟踪记录"
      :visible.sync="trackingDialogVisible"
      width="600px"
      :before-close="handleCloseTrackingDialog"
    >
      <el-form :model="trackingForm" label-width="80px">
        <el-form-item label="订单编号">
          <el-input v-model="trackingForm.orderNo" disabled></el-input>
        </el-form-item>
        <el-form-item label="物料信息">
          <el-input v-model="trackingForm.itemInfo" disabled></el-input>
        </el-form-item>
        <el-form-item label="跟踪内容" prop="content" required>
          <el-input
            v-model="trackingForm.content"
            type="textarea"
            rows="4"
            placeholder="请输入跟踪内容"
          ></el-input>
        </el-form-item>
        <el-form-item label="最新交付日期">
          <el-date-picker
            v-model="trackingForm.latestDeliveryDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="附件">
          <el-upload
            class="upload-demo"
            action=""
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="trackingForm.fileList"
          >
            <el-button slot="trigger" size="small" type="primary">选择文件</el-button>
            <div slot="tip" class="el-upload__tip">最多上传3个文件，单个文件不超过10MB</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleCloseTrackingDialog">取消</el-button>
        <el-button type="primary" @click="handleSubmitTrackingNote">提交</el-button>
      </div>
    </el-dialog>

    <!-- 确认对话框 -->
    <el-dialog
      :title="confirmDialogTitle"
      :visible.sync="confirmDialogVisible"
      width="400px"
    >
      <p>{{ confirmDialogMessage }}</p>
      <div slot="footer" class="dialog-footer">
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmAction">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'PurchaseTracking',
  data() {
    return {
      // 搜索表单
      searchForm: {
        orderNo: '',
        itemKeyword: '',
        supplierId: '',
        deliveryStatus: ''
      },
      dateRange: [],
      // 供应商列表
      suppliers: [],
      // 采购跟踪列表
      trackingList: [],
      // 统计数据
      stats: {
        totalOrders: 0,
        delayedOrders: 0,
        completedOrders: 0,
        totalAmount: 0
      },
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
      currentTracking: {},
      // 跟踪记录对话框
      trackingDialogVisible: false,
      trackingForm: {
        orderId: null,
        itemId: null,
        orderNo: '',
        itemInfo: '',
        content: '',
        latestDeliveryDate: '',
        fileList: []
      },
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
      this.loadSuppliers()
      this.loadTrackingList()
    },
    // 加载供应商列表
    loadSuppliers() {
      // 模拟数据
      this.suppliers = [
        { id: 1, name: '供应商A' },
        { id: 2, name: '供应商B' },
        { id: 3, name: '供应商C' },
        { id: 4, name: '供应商D' }
      ]
    },
    // 加载采购跟踪列表
    loadTrackingList() {
      this.loading = true
      // 模拟API请求
      setTimeout(() => {
        const data = this.generateMockData()
        this.trackingList = data
        this.total = data.length
        this.calculateStats(data)
        this.loading = false
      }, 500)
    },
    // 生成模拟数据
    generateMockData() {
      const statuses = ['NOT_DELIVERED', 'PARTIALLY_DELIVERED', 'DELIVERED', 'DELAYED']
      const suppliers = ['供应商A', '供应商B', '供应商C', '供应商D']
      const data = []
      
      for (let i = 1; i <= 50; i++) {
        const orderQuantity = Math.floor(Math.random() * 100) + 1
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const receivedQuantity = status === 'DELIVERED' 
          ? orderQuantity 
          : status === 'PARTIALLY_DELIVERED' 
            ? Math.floor(orderQuantity * 0.5) 
            : 0
        
        data.push({
          id: i,
          orderId: Math.floor(i / 5) + 1,
          orderNo: `PO${new Date().getFullYear()}${String(Math.floor(i / 5) + 1).padStart(4, '0')}`,
          supplierId: Math.floor(Math.random() * 4) + 1,
          supplierName: suppliers[Math.floor(Math.random() * suppliers.length)],
          itemId: i,
          itemNo: `ITEM${String(Math.floor(Math.random() * 9000) + 1000)}`,
          itemName: `物料名称${i}`,
          specification: `规格${i}`,
          unit: ['个', '件', '箱', '套'][Math.floor(Math.random() * 4)],
          orderQuantity: orderQuantity,
          receivedQuantity: receivedQuantity,
          pendingQuantity: orderQuantity - receivedQuantity,
          deliveryDate: this.formatDate(new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)),
          latestDeliveryDate: status === 'DELAYED' ? this.formatDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)) : null,
          deliveryStatus: status,
          trackingNotes: Math.random() > 0.5 ? '已联系供应商，确认将尽快发货' : '',
          notes: this.generateMockNotes(),
          unitPrice: Math.floor(Math.random() * 1000) + 100,
          totalPrice: orderQuantity * (Math.floor(Math.random() * 1000) + 100)
        })
      }
      return data
    },
    // 生成模拟跟踪记录
    generateMockNotes() {
      if (Math.random() > 0.5) {
        return [
          {
            operator: '张三',
            time: this.formatDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
            content: '联系供应商确认订单，供应商表示会按时交货。',
            attachments: []
          },
          {
            operator: '李四',
            time: this.formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
            content: '再次跟进，供应商反馈生产顺利，准备发货。',
            attachments: [
              { id: 1, name: '生产进度报告.pdf', url: '#' }
            ]
          }
        ]
      }
      return []
    },
    // 计算统计数据
    calculateStats(data) {
      this.stats = {
        totalOrders: data.length,
        delayedOrders: data.filter(item => item.deliveryStatus === 'DELAYED').length,
        completedOrders: data.filter(item => item.deliveryStatus === 'DELIVERED').length,
        totalAmount: data.reduce((sum, item) => sum + item.totalPrice, 0)
      }
    },
    // 格式化日期
    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    },
    // 格式化货币
    formatCurrency(value) {
      if (!value) return '¥0.00'
      return `¥${Number(value).toFixed(2)}`
    },
    // 获取交付状态标签类型
    getDeliveryStatusTagType(status) {
      const typeMap = {
        NOT_DELIVERED: 'info',
        PARTIALLY_DELIVERED: 'warning',
        DELIVERED: 'success',
        DELAYED: 'danger'
      }
      return typeMap[status] || 'default'
    },
    // 获取交付状态文本
    getDeliveryStatusText(status) {
      const textMap = {
        NOT_DELIVERED: '未交付',
        PARTIALLY_DELIVERED: '部分交付',
        DELIVERED: '已交付',
        DELAYED: '延期'
      }
      return textMap[status] || status
    },
    // 处理搜索
    handleSearch() {
      this.currentPage = 1
      this.loadTrackingList()
    },
    // 处理重置
    handleReset() {
      this.searchForm = {
        orderNo: '',
        itemKeyword: '',
        supplierId: '',
        deliveryStatus: ''
      }
      this.dateRange = []
      this.handleSearch()
    },
    // 处理分页大小变化
    handleSizeChange(size) {
      this.pageSize = size
      this.loadTrackingList()
    },
    // 处理当前页码变化
    handleCurrentChange(current) {
      this.currentPage = current
      this.loadTrackingList()
    },
    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },
    // 刷新数据
    handleRefresh() {
      this.loadTrackingList()
    },
    // 查看详情
    handleViewDetails(row) {
      this.currentTracking = { ...row }
      this.detailDialogVisible = true
    },
    // 添加跟踪记录
    handleAddTrackingNote(row) {
      this.trackingForm = {
        orderId: row.orderId,
        itemId: row.itemId,
        orderNo: row.orderNo,
        itemInfo: `${row.itemNo} - ${row.itemName}`,
        content: '',
        latestDeliveryDate: '',
        fileList: []
      }
      this.trackingDialogVisible = true
    },
    // 文件变化处理
    handleFileChange(file, fileList) {
      if (fileList.length > 3) {
        this.$message.error('最多只能上传3个文件')
        return
      }
      this.trackingForm.fileList = fileList.slice(-3)
    },
    // 提交跟踪记录
    handleSubmitTrackingNote() {
      if (!this.trackingForm.content) {
        this.$message.error('请输入跟踪内容')
        return
      }
      
      // 模拟提交
      setTimeout(() => {
        this.$message.success('跟踪记录添加成功')
        this.trackingDialogVisible = false
        this.loadTrackingList()
      }, 500)
    },
    // 下载附件
    handleDownloadAttachment(attachment) {
      this.$message.info(`下载附件：${attachment.name}`)
    },
    // 关闭详情对话框
    handleCloseDetailDialog() {
      this.detailDialogVisible = false
      this.currentTracking = {}
    },
    // 关闭跟踪对话框
    handleCloseTrackingDialog() {
      this.trackingDialogVisible = false
      this.trackingForm = {
        orderId: null,
        itemId: null,
        orderNo: '',
        itemInfo: '',
        content: '',
        latestDeliveryDate: '',
        fileList: []
      }
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
.purchase-tracking {
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

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-content {
  text-align: center;
  padding: 10px 0;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-card.warning .stat-number {
  color: #e6a23c;
}

.stat-card.success .stat-number {
  color: #67c23a;
}

.stat-card.info .stat-number {
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.contact-info {
  margin-bottom: 20px;
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