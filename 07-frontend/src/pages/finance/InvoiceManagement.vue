<template>
  <div class="invoice-management">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>财务管理</el-breadcrumb-item>
      <el-breadcrumb-item>发票管理</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="content-container">
      <div class="header">
        <h1>发票管理</h1>
        <div class="header-actions">
          <el-button type="primary" @click="addInvoice">新增发票</el-button>
          <el-button type="success" @click="batchSend" :disabled="selectedRows.length === 0">批量发送</el-button>
          <el-button @click="exportData">导出数据</el-button>
          <el-button @click="printSelected" :disabled="selectedRows.length === 0">打印选中</el-button>
        </div>
      </div>

      <!-- 搜索筛选区域 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.customerName" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="发票编号">
          <el-input v-model="searchForm.invoiceNumber" placeholder="请输入发票编号" />
        </el-form-item>
        <el-form-item label="关联订单">
          <el-input v-model="searchForm.orderNumber" placeholder="请输入订单编号" />
        </el-form-item>
        <el-form-item label="发票状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态">
            <el-option label="全部" value="" />
            <el-option label="未开具" value="draft" />
            <el-option label="已开具" value="issued" />
            <el-option label="已发送" value="sent" />
            <el-option label="已签收" value="received" />
            <el-option label="已红冲" value="red" />
          </el-select>
        </el-form-item>
        <el-form-item label="发票类型">
          <el-select v-model="searchForm.invoiceType" placeholder="请选择发票类型">
            <el-option label="全部" value="" />
            <el-option label="增值税专用发票" value="special" />
            <el-option label="增值税普通发票" value="general" />
            <el-option label="电子发票" value="electronic" />
          </el-select>
        </el-form-item>
        <el-form-item label="开票日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据统计 -->
      <div class="stats-container">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-label">本月开票金额</div>
                <div class="stat-value primary">{{ monthlyInvoiceAmount.toFixed(2) }} 元</div>
                <div class="stat-desc">较上月 <span class="text-success">+8.3%</span></div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-label">待开具发票</div>
                <div class="stat-value warning">{{ pendingInvoiceAmount.toFixed(2) }} 元</div>
                <div class="stat-desc">{{ pendingCount }} 张</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-label">年度开票总额</div>
                <div class="stat-value info">{{ yearInvoiceTotal.toFixed(2) }} 元</div>
                <div class="stat-desc">{{ yearInvoiceCount }} 张</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-label">未签收发票</div>
                <div class="stat-value danger">{{ unsentInvoiceAmount.toFixed(2) }} 元</div>
                <div class="stat-desc">{{ unsentCount }} 张</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 发票列表 -->
      <el-table
        v-loading="loading"
        :data="invoiceList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="invoiceNumber" label="发票编号" width="180">
          <template #default="{ row }">
            <a href="#" @click.stop="viewInvoiceDetails(row)">{{ row.invoiceNumber }}</a>
          </template>
        </el-table-column>
        <el-table-column prop="invoiceType" label="发票类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getInvoiceTypeTag(row.invoiceType)">{{ getInvoiceTypeText(row.invoiceType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户名称" width="180" />
        <el-table-column prop="orderNumber" label="关联订单" width="150">
          <template #default="{ row }">
            <a href="#" @click.stop="viewOrderDetails(row)">{{ row.orderNumber }}</a>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="发票金额" width="120" align="right">
          <template #default="{ row }">
            <span class="font-bold text-primary">{{ row.amount.toFixed(2) }} 元</span>
          </template>
        </el-table-column>
        <el-table-column prop="taxAmount" label="税额" width="100" align="right">
          <template #default="{ row }">
            {{ row.taxAmount.toFixed(2) }} 元
          </template>
        </el-table-column>
        <el-table-column prop="invoiceDate" label="开票日期" width="130">
          <template #default="{ row }">
            {{ formatDate(row.invoiceDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="到期日期" width="130">
          <template #default="{ row }">
            <span :class="{ 'text-danger': isOverdue(row.dueDate) }">
              {{ formatDate(row.dueDate) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'draft'"
              type="primary"
              size="small"
              @click="issueInvoice(row)"
            >
              开具发票
            </el-button>
            <el-button
              v-if="row.status === 'issued'"
              type="success"
              size="small"
              @click="sendInvoice(row)"
            >
              发送发票
            </el-button>
            <el-button
              v-if="row.status === 'issued' || row.status === 'sent'"
              size="small"
              @click="editInvoice(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.status !== 'red'"
              type="danger"
              size="small"
              @click="redInvoice(row)"
            >
              红冲
            </el-button>
            <el-button size="small" @click="viewInvoiceDetails(row)">详情</el-button>
            <el-button size="small" @click="printInvoice(row)">打印</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑发票对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增发票' : dialogType === 'edit' ? '编辑发票' : '开具发票'"
      width="800px"
      @close="resetForm"
    >
      <el-form
        ref="invoiceFormRef"
        :model="invoiceForm"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="客户名称" prop="customerId">
          <el-select
            v-model="invoiceForm.customerId"
            placeholder="请选择客户"
            filterable
            @change="onCustomerChange"
          >
            <el-option
              v-for="customer in customerList"
              :key="customer.id"
              :label="customer.name"
              :value="customer.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关联订单" prop="orderId">
          <el-select
            v-model="invoiceForm.orderId"
            placeholder="请选择订单"
            filterable
            @change="onOrderChange"
          >
            <el-option
              v-for="order in availableOrders"
              :key="order.id"
              :label="`${order.orderNumber} - ${order.totalAmount.toFixed(2)}元`"
              :value="order.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="发票类型" prop="invoiceType">
          <el-radio-group v-model="invoiceForm.invoiceType">
            <el-radio label="special">增值税专用发票</el-radio>
            <el-radio label="general">增值税普通发票</el-radio>
            <el-radio label="electronic">电子发票</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="发票金额" prop="amount">
          <el-input
            v-model.number="invoiceForm.amount"
            type="number"
            placeholder="请输入发票金额"
            min="0"
            step="0.01"
          />
          <div class="form-hint">
            订单金额: {{ remainingOrderAmount.toFixed(2) }} 元
          </div>
        </el-form-item>
        <el-form-item label="税率" prop="taxRate">
          <el-input
            v-model.number="invoiceForm.taxRate"
            type="number"
            placeholder="请输入税率"
            min="0"
            max="100"
            step="0.01"
          />
          <span slot="suffix" class="suffix-text">%</span>
        </el-form-item>
        <el-form-item label="税额" prop="taxAmount">
          <el-input
            v-model.number="invoiceForm.taxAmount"
            type="number"
            placeholder="税额(自动计算)"
            min="0"
            step="0.01"
            :readonly="true"
          />
        </el-form-item>
        <el-form-item label="开票日期" prop="invoiceDate">
          <el-date-picker
            v-model="invoiceForm.invoiceDate"
            type="date"
            placeholder="请选择开票日期"
          />
        </el-form-item>
        <el-form-item label="到期日期" prop="dueDate">
          <el-date-picker
            v-model="invoiceForm.dueDate"
            type="date"
            placeholder="请选择到期日期"
          />
        </el-form-item>
        <el-form-item label="发票抬头" prop="invoiceTitle">
          <el-input v-model="invoiceForm.invoiceTitle" placeholder="请输入发票抬头" />
        </el-form-item>
        <el-form-item label="税号" prop="taxId">
          <el-input v-model="invoiceForm.taxId" placeholder="请输入税号" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="invoiceForm.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="invoiceForm.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="开户行" prop="bankName">
          <el-input v-model="invoiceForm.bankName" placeholder="请输入开户行" />
        </el-form-item>
        <el-form-item label="账号" prop="accountNumber">
          <el-input v-model="invoiceForm.accountNumber" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="发票项目" prop="invoiceItems">
          <el-table
            :data="invoiceForm.invoiceItems"
            style="width: 100%"
            border
          >
            <el-table-column prop="itemName" label="项目名称" min-width="150">
              <template #default="{ row }">
                <el-input v-model="row.itemName" placeholder="项目名称" />
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80">
              <template #default="{ row }">
                <el-input v-model.number="row.quantity" type="number" min="0" />
              </template>
            </el-table-column>
            <el-table-column prop="unitPrice" label="单价" width="100" align="right">
              <template #default="{ row }">
                <el-input v-model.number="row.unitPrice" type="number" min="0" step="0.01" />
              </template>
            </el-table-column>
            <el-table-column prop="itemAmount" label="金额" width="100" align="right">
              <template #default="{ row }">
                <el-input v-model.number="row.itemAmount" type="number" min="0" step="0.01" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button
                  size="small"
                  type="danger"
                  @click="removeInvoiceItem($index)"
                  :disabled="invoiceForm.invoiceItems.length <= 1"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button
            type="dashed"
            style="width: 100%; margin-top: 10px"
            @click="addInvoiceItem"
          >
            添加项目
          </el-button>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="invoiceForm.remark"
            type="textarea"
            placeholder="请输入备注信息"
            rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 发票详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="发票详情"
      width="900px"
    >
      <div v-if="currentInvoice" class="detail-content">
        <el-descriptions border :column="3" :title="'发票 - ' + currentInvoice.invoiceNumber">
          <el-descriptions-item label="发票类型" :span="3">{{ getInvoiceTypeText(currentInvoice.invoiceType) }}</el-descriptions-item>
          <el-descriptions-item label="发票金额" :span="3" class="font-bold text-primary">{{ currentInvoice.amount.toFixed(2) }} 元</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ currentInvoice.customerName }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ currentInvoice.contactPerson || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentInvoice.contactPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="关联订单">{{ currentInvoice.orderNumber }}</el-descriptions-item>
          <el-descriptions-item label="开票日期">{{ formatDate(currentInvoice.invoiceDate) }}</el-descriptions-item>
          <el-descriptions-item label="到期日期">{{ formatDate(currentInvoice.dueDate) }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusText(currentInvoice.status) }}</el-descriptions-item>
          <el-descriptions-item label="税率">{{ currentInvoice.taxRate || 0 }}%</el-descriptions-item>
          <el-descriptions-item label="税额">{{ currentInvoice.taxAmount.toFixed(2) }} 元</el-descriptions-item>
          <el-descriptions-item label="开票人">{{ currentInvoice.createdBy || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="invoice-info" v-if="currentInvoice.invoiceDetails">
          <h3>发票信息</h3>
          <el-descriptions border :column="2">
            <el-descriptions-item label="发票抬头">{{ currentInvoice.invoiceDetails.invoiceTitle }}</el-descriptions-item>
            <el-descriptions-item label="税号">{{ currentInvoice.invoiceDetails.taxId }}</el-descriptions-item>
            <el-descriptions-item label="地址">{{ currentInvoice.invoiceDetails.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="电话">{{ currentInvoice.invoiceDetails.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="开户行">{{ currentInvoice.invoiceDetails.bankName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="账号">{{ currentInvoice.invoiceDetails.accountNumber || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="invoice-items" v-if="currentInvoice.invoiceItems && currentInvoice.invoiceItems.length > 0">
          <h3>发票项目</h3>
          <el-table :data="currentInvoice.invoiceItems" border style="width: 100%">
            <el-table-column prop="itemName" label="项目名称" min-width="200" />
            <el-table-column prop="quantity" label="数量" width="100" />
            <el-table-column prop="unitPrice" label="单价" width="120" align="right" :formatter="formatCurrency" />
            <el-table-column prop="itemAmount" label="金额" width="120" align="right" :formatter="formatCurrency" />
          </el-table>
        </div>

        <div v-if="currentInvoice.orderDetails" class="order-details">
          <h3>订单详情</h3>
          <el-table :data="[currentInvoice.orderDetails]" border style="width: 100%">
            <el-table-column prop="orderNumber" label="订单编号" />
            <el-table-column prop="orderDate" label="订单日期" :formatter="formatDate" />
            <el-table-column prop="totalAmount" label="订单总额" :formatter="formatCurrency" />
            <el-table-column prop="invoicedAmount" label="已开票金额" :formatter="formatCurrency" />
            <el-table-column prop="uninvoicedAmount" label="未开票金额" :formatter="formatCurrency" />
            <el-table-column prop="status" label="订单状态" />
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 发送发票对话框 -->
    <el-dialog
      v-model="sendDialogVisible"
      title="发送发票"
      width="600px"
      @close="resetSendForm"
    >
      <el-form
        ref="sendFormRef"
        :model="sendForm"
        :rules="sendRules"
        label-width="120px"
      >
        <el-form-item label="发送方式" prop="sendMethod">
          <el-radio-group v-model="sendForm.sendMethod">
            <el-radio label="email">邮件</el-radio>
            <el-radio label="sms">短信</el-radio>
            <el-radio label="system">系统通知</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="收件邮箱" prop="email" v-if="sendForm.sendMethod === 'email'">
          <el-input v-model="sendForm.email" placeholder="请输入收件邮箱" />
        </el-form-item>
        <el-form-item label="手机号码" prop="phone" v-if="sendForm.sendMethod === 'sms'">
          <el-input v-model="sendForm.phone" placeholder="请输入手机号码" />
        </el-form-item>
        <el-form-item label="发送内容" prop="content">
          <el-input
            v-model="sendForm.content"
            type="textarea"
            placeholder="请输入发送内容"
            rows="4"
          />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload
            class="upload-demo"
            drag
            action=""
            multiple
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="3"
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <div class="el-upload__tip" slot="tip">最多上传3个文件</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="sendDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSend">发送</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'InvoiceManagement',
  setup() {
    // 状态管理
    const loading = ref(false);
    const invoiceList = ref([]);
    const selectedRows = ref([]);
    const dialogVisible = ref(false);
    const detailDialogVisible = ref(false);
    const sendDialogVisible = ref(false);
    const dialogType = ref('add');
    const currentInvoice = ref(null);
    const invoiceFormRef = ref(null);
    const sendFormRef = ref(null);
    const uploadFiles = ref([]);

    // 搜索表单
    const searchForm = reactive({
      customerName: '',
      invoiceNumber: '',
      orderNumber: '',
      status: '',
      invoiceType: '',
      dateRange: null
    });

    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    });

    // 发票表单
    const invoiceForm = reactive({
      id: '',
      customerId: '',
      customerName: '',
      orderId: '',
      orderNumber: '',
      invoiceType: 'general',
      amount: 0,
      taxRate: 13,
      taxAmount: 0,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
      invoiceTitle: '',
      taxId: '',
      address: '',
      phone: '',
      bankName: '',
      accountNumber: '',
      remark: '',
      invoiceItems: [
        {
          itemName: '',
          quantity: 1,
          unitPrice: 0,
          itemAmount: 0
        }
      ]
    });

    // 发送表单
    const sendForm = reactive({
      sendMethod: 'email',
      email: '',
      phone: '',
      content: ''
    });

    // 表单验证规则
    const rules = {
      customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
      orderId: [{ required: true, message: '请选择关联订单', trigger: 'change' }],
      invoiceType: [{ required: true, message: '请选择发票类型', trigger: 'change' }],
      amount: [
        { required: true, message: '请输入发票金额', trigger: 'blur' },
        { type: 'number', min: 0.01, message: '发票金额必须大于0', trigger: 'blur' }
      ],
      taxRate: [
        { required: true, message: '请输入税率', trigger: 'blur' },
        { type: 'number', min: 0, max: 100, message: '税率必须在0-100之间', trigger: 'blur' }
      ],
      invoiceDate: [{ required: true, message: '请选择开票日期', trigger: 'change' }],
      dueDate: [{ required: true, message: '请选择到期日期', trigger: 'change' }],
      invoiceTitle: [{ required: true, message: '请输入发票抬头', trigger: 'blur' }],
      taxId: [{ required: true, message: '请输入税号', trigger: 'blur' }]
    };

    // 发送验证规则
    const sendRules = {
      sendMethod: [{ required: true, message: '请选择发送方式', trigger: 'change' }],
      email: [
        { required: (rule, value) => sendForm.sendMethod === 'email', message: '请输入收件邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur', required: false }
      ],
      phone: [
        { required: (rule, value) => sendForm.sendMethod === 'sms', message: '请输入手机号码', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur', required: false }
      ],
      content: [{ required: true, message: '请输入发送内容', trigger: 'blur' }]
    };

    // 模拟数据
    const customerList = ref([
      { id: '1', name: '北京科技有限公司' },
      { id: '2', name: '上海贸易公司' },
      { id: '3', name: '广州制造有限公司' },
      { id: '4', name: '深圳科技集团' },
      { id: '5', name: '杭州电子有限公司' }
    ]);

    const orderList = ref([
      { id: '1', orderNumber: 'SO20240001', customerId: '1', totalAmount: 250000.00, invoicedAmount: 150000.00 },
      { id: '2', orderNumber: 'SO20240002', customerId: '2', totalAmount: 180000.00, invoicedAmount: 90000.00 },
      { id: '3', orderNumber: 'SO20240003', customerId: '3', totalAmount: 320000.00, invoicedAmount: 0 },
      { id: '4', orderNumber: 'SO20240004', customerId: '1', totalAmount: 450000.00, invoicedAmount: 450000.00 },
      { id: '5', orderNumber: 'SO20240005', customerId: '4', totalAmount: 280000.00, invoicedAmount: 140000.00 }
    ]);

    // 计算属性
    const availableOrders = computed(() => {
      if (!invoiceForm.customerId) return [];
      return orderList.value.filter(order => order.customerId === invoiceForm.customerId);
    });

    const remainingOrderAmount = computed(() => {
      const order = orderList.value.find(o => o.id === invoiceForm.orderId);
      return order ? order.totalAmount - order.invoicedAmount : 0;
    });

    const monthlyInvoiceAmount = computed(() => {
      const now = new Date();
      const currentMonth = now.getMonth();
      return invoiceList.value
        .filter(item => item.invoiceDate && new Date(item.invoiceDate).getMonth() === currentMonth)
        .reduce((sum, item) => sum + item.amount, 0);
    });

    const pendingInvoiceAmount = computed(() => {
      return invoiceList.value
        .filter(item => item.status === 'draft')
        .reduce((sum, item) => sum + item.amount, 0);
    });

    const pendingCount = computed(() => {
      return invoiceList.value.filter(item => item.status === 'draft').length;
    });

    const yearInvoiceTotal = ref(1850000.00);
    const yearInvoiceCount = ref(45);
    const unsentInvoiceAmount = computed(() => {
      return invoiceList.value
        .filter(item => item.status === 'issued')
        .reduce((sum, item) => sum + item.amount, 0);
    });

    const unsentCount = computed(() => {
      return invoiceList.value.filter(item => item.status === 'issued').length;
    });

    // 监听金额和税率变化，自动计算税额
    watch(
      () => [invoiceForm.amount, invoiceForm.taxRate],
      () => {
        if (invoiceForm.amount > 0 && invoiceForm.taxRate > 0) {
          invoiceForm.taxAmount = (invoiceForm.amount * invoiceForm.taxRate / 100).toFixed(2);
        } else {
          invoiceForm.taxAmount = 0;
        }
      },
      { immediate: true }
    );

    // 格式化日期
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // 格式化日期时间
    const formatDateTime = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${formatDate(date)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    // 格式化货币
    const formatCurrency = (row, column, cellValue) => {
      return `${cellValue.toFixed(2)} 元`;
    };

    // 判断是否逾期
    const isOverdue = (dueDate) => {
      if (!dueDate) return false;
      const now = new Date();
      const due = new Date(dueDate);
      return due < now;
    };

    // 获取状态类型
    const getStatusType = (status) => {
      switch (status) {
        case 'issued': return 'primary';
        case 'sent': return 'success';
        case 'received': return 'info';
        case 'draft': return 'warning';
        case 'red': return 'danger';
        default: return 'default';
      }
    };

    // 获取状态文本
    const getStatusText = (status) => {
      switch (status) {
        case 'issued': return '已开具';
        case 'sent': return '已发送';
        case 'received': return '已签收';
        case 'draft': return '未开具';
        case 'red': return '已红冲';
        default: return '未知';
      }
    };

    // 获取发票类型标签颜色
    const getInvoiceTypeTag = (type) => {
      switch (type) {
        case 'special': return 'primary';
        case 'general': return 'info';
        case 'electronic': return 'success';
        default: return 'default';
      }
    };

    // 获取发票类型文本
    const getInvoiceTypeText = (type) => {
      switch (type) {
        case 'special': return '增值税专用发票';
        case 'general': return '增值税普通发票';
        case 'electronic': return '电子发票';
        default: return '未知';
      }
    };

    // 客户选择变化
    const onCustomerChange = () => {
      const customer = customerList.value.find(c => c.id === invoiceForm.customerId);
      if (customer) {
        invoiceForm.customerName = customer.name;
      }
      // 重置订单选择
      invoiceForm.orderId = '';
      invoiceForm.orderNumber = '';
    };

    // 订单选择变化
    const onOrderChange = () => {
      const order = orderList.value.find(o => o.id === invoiceForm.orderId);
      if (order) {
        invoiceForm.orderNumber = order.orderNumber;
        // 可以根据订单设置默认金额
        invoiceForm.amount = order.totalAmount - order.invoicedAmount;
      }
    };

    // 添加发票项目
    const addInvoiceItem = () => {
      invoiceForm.invoiceItems.push({
        itemName: '',
        quantity: 1,
        unitPrice: 0,
        itemAmount: 0
      });
    };

    // 移除发票项目
    const removeInvoiceItem = (index) => {
      invoiceForm.invoiceItems.splice(index, 1);
    };

    // 处理文件变化
    const handleFileChange = (file, fileList) => {
      uploadFiles.value = fileList;
    };

    // 处理选择变化
    const handleSelectionChange = (val) => {
      selectedRows.value = val;
    };

    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
      loadData();
    };

    const handleCurrentChange = (current) => {
      pagination.currentPage = current;
      loadData();
    };

    // 搜索
    const search = () => {
      pagination.currentPage = 1;
      loadData();
    };

    // 重置搜索
    const resetSearch = () => {
      Object.keys(searchForm).forEach(key => {
        if (key === 'dateRange') {
          searchForm[key] = null;
        } else {
          searchForm[key] = '';
        }
      });
      pagination.currentPage = 1;
      loadData();
    };

    // 重置表单
    const resetForm = () => {
      if (invoiceFormRef.value) {
        invoiceFormRef.value.resetFields();
      }
      Object.assign(invoiceForm, {
        id: '',
        customerId: '',
        customerName: '',
        orderId: '',
        orderNumber: '',
        invoiceType: 'general',
        amount: 0,
        taxRate: 13,
        taxAmount: 0,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        invoiceTitle: '',
        taxId: '',
        address: '',
        phone: '',
        bankName: '',
        accountNumber: '',
        remark: '',
        invoiceItems: [
          {
            itemName: '',
            quantity: 1,
            unitPrice: 0,
            itemAmount: 0
          }
        ]
      });
    };

    // 重置发送表单
    const resetSendForm = () => {
      if (sendFormRef.value) {
        sendFormRef.value.resetFields();
      }
      Object.assign(sendForm, {
        sendMethod: 'email',
        email: '',
        phone: '',
        content: ''
      });
      uploadFiles.value = [];
    };

    // 新增发票
    const addInvoice = () => {
      dialogType.value = 'add';
      resetForm();
      dialogVisible.value = true;
    };

    // 编辑发票
    const editInvoice = (row) => {
      dialogType.value = 'edit';
      invoiceForm.id = row.id;
      invoiceForm.customerId = row.customerId || '';
      invoiceForm.customerName = row.customerName;
      invoiceForm.orderId = row.orderId || '';
      invoiceForm.orderNumber = row.orderNumber;
      invoiceForm.invoiceType = row.invoiceType;
      invoiceForm.amount = row.amount;
      invoiceForm.taxRate = row.taxRate || 13;
      invoiceForm.taxAmount = row.taxAmount;
      invoiceForm.invoiceDate = new Date(row.invoiceDate);
      invoiceForm.dueDate = new Date(row.dueDate);
      invoiceForm.invoiceTitle = row.invoiceTitle || '';
      invoiceForm.taxId = row.taxId || '';
      invoiceForm.address = row.address || '';
      invoiceForm.phone = row.phone || '';
      invoiceForm.bankName = row.bankName || '';
      invoiceForm.accountNumber = row.accountNumber || '';
      invoiceForm.remark = row.remark || '';
      invoiceForm.invoiceItems = row.invoiceItems || [
        {
          itemName: '',
          quantity: 1,
          unitPrice: 0,
          itemAmount: 0
        }
      ];
      dialogVisible.value = true;
    };

    // 开具发票
    const issueInvoice = (row) => {
      dialogType.value = 'issue';
      editInvoice(row);
    };

    // 提交表单
    const submitForm = () => {
      invoiceFormRef.value.validate((valid) => {
        if (valid) {
          // 模拟提交
          setTimeout(() => {
            ElMessage.success(
              dialogType.value === 'add' ? '新增成功' : 
              dialogType.value === 'edit' ? '编辑成功' : '开具成功'
            );
            dialogVisible.value = false;
            loadData();
          }, 500);
        }
      });
    };

    // 发送发票
    const sendInvoice = (row) => {
      currentInvoice.value = { ...row };
      // 设置默认发送信息
      if (row.contactEmail) {
        sendForm.email = row.contactEmail;
      }
      if (row.contactPhone) {
        sendForm.phone = row.contactPhone;
      }
      sendForm.content = `尊敬的${row.customerName}，您的发票（编号：${row.invoiceNumber}，金额：${row.amount.toFixed(2)}元）已开具，请查收。`;
      sendDialogVisible.value = true;
    };

    // 确认发送
    const confirmSend = () => {
      sendFormRef.value.validate((valid) => {
        if (valid) {
          // 模拟发送
          setTimeout(() => {
            ElMessage.success('发票发送成功');
            sendDialogVisible.value = false;
            loadData();
          }, 500);
        }
      });
    };

    // 批量发送
    const batchSend = () => {
      ElMessageBox.confirm(`确定要批量发送选中的 ${selectedRows.value.length} 张发票吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟批量发送
        setTimeout(() => {
          ElMessage.success('批量发送成功');
          selectedRows.value = [];
          loadData();
        }, 500);
      }).catch(() => {});
    };

    // 红冲发票
    const redInvoice = (row) => {
      ElMessageBox.confirm('确定要红冲此发票吗？此操作不可撤销！', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(() => {
        // 模拟红冲
        setTimeout(() => {
          ElMessage.success('发票已红冲');
          loadData();
        }, 500);
      }).catch(() => {});
    };

    // 导出数据
    const exportData = () => {
      ElMessage.success('数据导出成功');
    };

    // 打印发票
    const printInvoice = (row) => {
      ElMessage.info(`正在打印发票 ${row.invoiceNumber}`);
    };

    // 打印选中发票
    const printSelected = () => {
      ElMessage.info(`正在打印选中的 ${selectedRows.value.length} 张发票`);
    };

    // 查看订单详情
    const viewOrderDetails = (row) => {
      ElMessage.info('查看订单详情功能待实现');
    };

    // 查看发票详情
    const viewInvoiceDetails = (row) => {
      currentInvoice.value = { ...row };
      // 模拟加载订单详情
      if (row.orderNumber) {
        const order = orderList.value.find(o => o.orderNumber === row.orderNumber);
        if (order) {
          currentInvoice.value.orderDetails = {
            ...order,
            orderDate: '2024-01-01',
            status: '已发货',
            uninvoicedAmount: order.totalAmount - order.invoicedAmount
          };
        }
      }
      detailDialogVisible.value = true;
    };

    // 加载数据
    const loadData = () => {
      loading.value = true;
      // 模拟API调用延迟
      setTimeout(() => {
        // 模拟数据
        const mockData = [
          {
            id: '1',
            invoiceNumber: 'FP20240001',
            invoiceType: 'special',
            customerId: '1',
            customerName: '北京科技有限公司',
            orderId: '1',
            orderNumber: 'SO20240001',
            amount: 150000.00,
            taxRate: 13,
            taxAmount: 17256.64,
            invoiceDate: '2024-01-20',
            dueDate: '2024-02-20',
            status: 'sent',
            remark: '正常开票',
            createdBy: '张三',
            createdAt: '2024-01-20 10:30:00',
            updatedBy: '李四',
            updatedAt: '2024-01-20 14:00:00',
            contactPerson: '王经理',
            contactPhone: '13800138001',
            contactEmail: 'wang@example.com',
            invoiceDetails: {
              invoiceTitle: '北京科技有限公司',
              taxId: '91110105MA12345678',
              address: '北京市朝阳区建国路88号',
              phone: '010-12345678',
              bankName: '工商银行北京分行',
              accountNumber: '6222021001012345678'
            },
            invoiceItems: [
              {
                itemName: '产品A',
                quantity: 10,
                unitPrice: 10000,
                itemAmount: 100000
              },
              {
                itemName: '产品B',
                quantity: 5,
                unitPrice: 10000,
                itemAmount: 50000
              }
            ]
          },
          {
            id: '2',
            invoiceNumber: 'FP20240002',
            invoiceType: 'general',
            customerId: '2',
            customerName: '上海贸易公司',
            orderId: '2',
            orderNumber: 'SO20240002',
            amount: 90000.00,
            taxRate: 6,
            taxAmount: 5094.34,
            invoiceDate: '2024-01-22',
            dueDate: '2024-02-22',
            status: 'issued',
            remark: '待发送',
            createdBy: '李四',
            createdAt: '2024-01-22 09:15:00',
            contactPerson: '李总',
            contactPhone: '13900139002',
            contactEmail: 'li@example.com',
            invoiceDetails: {
              invoiceTitle: '上海贸易公司',
              taxId: '91310115MA87654321',
              address: '上海市浦东新区张江高科技园区',
              phone: '021-87654321',
              bankName: '建设银行上海分行',
              accountNumber: '6227002001023456789'
            },
            invoiceItems: [
              {
                itemName: '产品C',
                quantity: 6,
                unitPrice: 15000,
                itemAmount: 90000
              }
            ]
          },
          {
            id: '3',
            invoiceNumber: 'FP20240003',
            invoiceType: 'electronic',
            customerId: '3',
            customerName: '广州制造有限公司',
            orderId: '3',
            orderNumber: 'SO20240003',
            amount: 320000.00,
            taxRate: 13,
            taxAmount: 36637.17,
            invoiceDate: null,
            dueDate: null,
            status: 'draft',
            remark: '准备开票',
            createdBy: '王五',
            createdAt: '2024-01-25 16:45:00',
            contactPerson: '张经理',
            contactPhone: '13700137003',
            contactEmail: 'zhang@example.com',
            invoiceDetails: {
              invoiceTitle: '广州制造有限公司',
              taxId: '91440105MA13579246',
              address: '广州市天河区天河路385号',
              phone: '020-56781234',
              bankName: '农业银行广州分行',
              accountNumber: '6228004401034567890'
            },
            invoiceItems: [
              {
                itemName: '产品A',
                quantity: 16,
                unitPrice: 10000,
                itemAmount: 160000
              },
              {
                itemName: '产品D',
                quantity: 8,
                unitPrice: 20000,
                itemAmount: 160000
              }
            ]
          },
          {
            id: '4',
            invoiceNumber: 'FP20240004',
            invoiceType: 'special',
            customerId: '1',
            customerName: '北京科技有限公司',
            orderId: '4',
            orderNumber: 'SO20240004',
            amount: 450000.00,
            taxRate: 13,
            taxAmount: 51150.44,
            invoiceDate: '2024-01-15',
            dueDate: '2024-02-15',
            status: 'received',
            remark: '客户已签收',
            createdBy: '张三',
            createdAt: '2024-01-15 11:20:00',
            updatedBy: '李四',
            updatedAt: '2024-01-20 10:00:00',
            contactPerson: '王经理',
            contactPhone: '13800138001',
            contactEmail: 'wang@example.com',
            invoiceDetails: {
              invoiceTitle: '北京科技有限公司',
              taxId: '91110105MA12345678',
              address: '北京市朝阳区建国路88号',
              phone: '010-12345678',
              bankName: '工商银行北京分行',
              accountNumber: '6222021001012345678'
            },
            invoiceItems: [
              {
                itemName: '产品B',
                quantity: 20,
                unitPrice: 15000,
                itemAmount: 300000
              },
              {
                itemName: '产品C',
                quantity: 10,
                unitPrice: 15000,
                itemAmount: 150000
              }
            ]
          },
          {
            id: '5',
            invoiceNumber: 'FP20240005',
            invoiceType: 'general',
            customerId: '4',
            customerName: '深圳科技集团',
            orderId: '5',
            orderNumber: 'SO20240005',
            amount: 140000.00,
            taxRate: 13,
            taxAmount: 16106.19,
            invoiceDate: '2024-01-18',
            dueDate: '2024-02-18',
            status: 'red',
            remark: '订单取消，已红冲',
            createdBy: '赵六',
            createdAt: '2024-01-18 09:30:00',
            updatedBy: '张三',
            updatedAt: '2024-01-22 14:00:00',
            contactPerson: '刘总',
            contactPhone: '13600136004',
            contactEmail: 'liu@example.com',
            invoiceDetails: {
              invoiceTitle: '深圳科技集团',
              taxId: '91440300MA98765432',
              address: '深圳市南山区科技园',
              phone: '0755-87654321',
              bankName: '招商银行深圳分行',
              accountNumber: '6225005801045678901'
            },
            invoiceItems: [
              {
                itemName: '产品D',
                quantity: 7,
                unitPrice: 20000,
                itemAmount: 140000
              }
            ]
          }
        ];

        // 应用搜索过滤
        let filteredData = [...mockData];
        if (searchForm.customerName) {
          filteredData = filteredData.filter(item => 
            item.customerName.includes(searchForm.customerName)
          );
        }
        if (searchForm.invoiceNumber) {
          filteredData = filteredData.filter(item => 
            item.invoiceNumber.includes(searchForm.invoiceNumber)
          );
        }
        if (searchForm.orderNumber) {
          filteredData = filteredData.filter(item => 
            item.orderNumber.includes(searchForm.orderNumber)
          );
        }
        if (searchForm.status) {
          filteredData = filteredData.filter(item => 
            item.status === searchForm.status
          );
        }
        if (searchForm.invoiceType) {
          filteredData = filteredData.filter(item => 
            item.invoiceType === searchForm.invoiceType
          );
        }
        if (searchForm.dateRange && searchForm.dateRange.length === 2) {
          const startDate = new Date(searchForm.dateRange[0]);
          const endDate = new Date(searchForm.dateRange[1]);
          filteredData = filteredData.filter(item => {
            if (!item.invoiceDate) return false;
            const invoiceDate = new Date(item.invoiceDate);
            return invoiceDate >= startDate && invoiceDate <= endDate;
          });
        }

        // 分页处理
        const start = (pagination.currentPage - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        invoiceList.value = filteredData.slice(start, end);
        pagination.total = filteredData.length;
        
        loading.value = false;
      }, 500);
    };

    // 生命周期
    onMounted(() => {
      loadData();
    });

    return {
      loading,
      invoiceList,
      selectedRows,
      searchForm,
      pagination,
      dialogVisible,
      detailDialogVisible,
      sendDialogVisible,
      dialogType,
      currentInvoice,
      invoiceForm,
      invoiceFormRef,
      sendForm,
      sendFormRef,
      rules,
      sendRules,
      customerList,
      availableOrders,
      remainingOrderAmount,
      monthlyInvoiceAmount,
      pendingInvoiceAmount,
      pendingCount,
      yearInvoiceTotal,
      yearInvoiceCount,
      unsentInvoiceAmount,
      unsentCount,
      formatDate,
      formatDateTime,
      formatCurrency,
      isOverdue,
      getStatusType,
      getStatusText,
      getInvoiceTypeTag,
      getInvoiceTypeText,
      onCustomerChange,
      onOrderChange,
      addInvoiceItem,
      removeInvoiceItem,
      handleFileChange,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      search,
      resetSearch,
      resetForm,
      resetSendForm,
      addInvoice,
      editInvoice,
      issueInvoice,
      submitForm,
      sendInvoice,
      confirmSend,
      batchSend,
      redInvoice,
      exportData,
      printInvoice,
      printSelected,
      viewOrderDetails,
      viewInvoiceDetails
    };
  }
};
</script>

<style scoped>
.invoice-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.content-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.search-form {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.stats-container {
  margin-bottom: 20px;
}

.stat-card {
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-content {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-value.primary {
  color: #409eff;
}

.stat-value.warning {
  color: #e6a23c;
}

.stat-value.info {
  color: #909399;
}

.stat-value.danger {
  color: #f56c6c;
}

.stat-desc {
  font-size: 12px;
  color: #909399;
}

.text-success {
  color: #67c23a;
}

.text-primary {
  color: #409eff;
}

.text-danger {
  color: #f56c6c;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.font-bold {
  font-weight: bold;
}

.form-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.invoice-info,
.invoice-items,
.order-details {
  margin-top: 30px;
}

.invoice-info h3,
.invoice-items h3,
.order-details h3 {
  margin-bottom: 15px;
  color: #303133;
}

.suffix-text {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #909399;
}

.upload-demo {
  margin-bottom: 10px;
}
</style>