<template>
  <div class="shipping-application">
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>首页</el-breadcrumb-item>
        <el-breadcrumb-item>发货管理</el-breadcrumb-item>
        <el-breadcrumb-item>申请发货</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="header-actions">
        <h1>申请发货</h1>
        <el-button type="primary" @click="createApplication" size="large">
          <el-icon><Plus /></el-icon>
          新建发货申请
        </el-button>
      </div>
    </div>
    
    <el-card shadow="never">
      <div class="search-section">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="申请编号">
            <el-input
              v-model="searchForm.applicatNumber"
              placeholder="请输入申请编号"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="客户名称">
            <el-input
              v-model="searchForm.customerName"
              placeholder="请输入客户名称"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="订单编号">
            <el-input
              v-model="searchForm.orderNumber"
              placeholder="请输入订单编号"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="申请状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择状态"
              clearable
            >
              <el-option
                v-for="status in applicationStatuses"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="申请日期">
            <el-date-picker
              v-model="searchForm.applyDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-form>
        
        <div class="search-actions">
          <el-button @click="handleSearch" type="primary">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button @click="exportData">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>
      </div>
      
      <div class="table-section">
        <div class="table-header" v-if="total > 0">
          <span>共 {{ total }} 条数据</span>
          <el-dropdown @command="handleBatchCommand">
            <el-button>
              批量操作
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="batchApprove">批量审批</el-dropdown-item>
                <el-dropdown-item command="batchReject">批量驳回</el-dropdown-item>
                <el-dropdown-item command="batchDelete">批量删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        
        <el-table
          v-loading="loading"
          :data="applications"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="applicatNumber" label="申请编号" width="180" />
          <el-table-column prop="orderNumber" label="订单编号" width="180" />
          <el-table-column prop="customerName" label="客户名称" width="180" />
          <el-table-column prop="applyDate" label="申请日期" width="150" />
          <el-table-column prop="applyBy" label="申请人" width="120" />
          <el-table-column prop="totalAmount" label="申请金额" width="120">
            <template #default="{ row }">
              ¥ {{ row.totalAmount.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag
                :type="getStatusTagType(row.status)"
                size="small"
              >
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="approvalBy" label="审批人" width="120" />
          <el-table-column prop="approvalDate" label="审批日期" width="150" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'DRAFT'"
                type="primary"
                size="small"
                @click="editApplication(row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="row.status === 'DRAFT'"
                size="small"
                @click="submitApplication(row)"
              >
                提交
              </el-button>
              <el-button
                v-if="row.status === 'SUBMITTED'"
                size="small"
                @click="approveApplication(row)"
              >
                审批
              </el-button>
              <el-button
                v-if="row.status === 'APPROVED'"
                size="small"
                @click="generatePlan(row)"
              >
                生成计划
              </el-button>
              <el-button
                size="small"
                @click="viewApplicationDetail(row)"
              >
                查看详情
              </el-button>
              <el-dropdown trigger="click">
                <el-button size="small">
                  更多
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-if="row.status === 'DRAFT'"
                      @click="deleteApplication(row)"
                    >
                      删除
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.status === 'SUBMITTED'"
                      @click="rejectApplication(row)"
                    >
                      驳回
                    </el-dropdown-item>
                    <el-dropdown-item @click="printApplication(row)">
                      打印
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-section">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>
    
    <!-- 新建/编辑发货申请对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="90%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form
        ref="applicationForm"
        :model="applicationForm"
        :rules="applicationRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="申请编号" prop="applicatNumber">
              <el-input
                v-model="applicationForm.applicatNumber"
                placeholder="系统自动生成"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单编号" prop="orderNumber">
              <el-input
                v-model="applicationForm.orderNumber"
                placeholder="请输入订单编号"
                @focus="showOrderSelector"
                readonly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customerName">
              <el-input
                v-model="applicationForm.customerName"
                placeholder="请输入客户名称"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请日期" prop="applyDate">
              <el-date-picker
                v-model="applicationForm.applyDate"
                type="date"
                placeholder="请选择申请日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请人" prop="applyBy">
              <el-input
                v-model="applicationForm.applyBy"
                placeholder="请输入申请人"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input
                v-model="applicationForm.contactPhone"
                placeholder="请输入联系电话"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计发货日期" prop="expectedShipDate">
              <el-date-picker
                v-model="applicationForm.expectedShipDate"
                type="date"
                placeholder="请选择预计发货日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="紧急程度" prop="urgencyLevel">
              <el-select
                v-model="applicationForm.urgencyLevel"
                placeholder="请选择紧急程度"
              >
                <el-option label="普通" value="NORMAL" />
                <el-option label="加急" value="URGENT" />
                <el-option label="特急" value="CRITICAL" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="发货地址" prop="shipToAddress">
              <el-input
                v-model="applicationForm.shipToAddress"
                type="textarea"
                rows="2"
                placeholder="请输入详细发货地址"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="申请原因" prop="reason">
              <el-input
                v-model="applicationForm.reason"
                type="textarea"
                rows="3"
                placeholder="请输入申请原因"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <div class="application-items-section">
        <h3>申请明细</h3>
        <el-table
          v-loading="itemsLoading"
          :data="applicationForm.items"
          style="width: 100%"
          border
        >
          <el-table-column prop="productCode" label="产品编码" width="150" />
          <el-table-column prop="productName" label="产品名称" min-width="180" />
          <el-table-column prop="productSpec" label="规格型号" width="150" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="orderQuantity" label="订单数量" width="120" />
          <el-table-column prop="applyQuantity" label="申请数量" width="120">
            <template #default="{ row, $index }">
              <el-input-number
                v-model="applicationForm.items[$index].applyQuantity"
                :min="1"
                :max="row.orderQuantity"
                :step="1"
                @change="updateTotalAmount"
              />
            </template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="单价" width="120">
            <template #default="{ row }">
              ¥ {{ row.unitPrice.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="{ row, $index }">
              ¥ {{ (applicationForm.items[$index].applyQuantity * row.unitPrice).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="150">
            <template #default="{ row, $index }">
              <el-input
                v-model="applicationForm.items[$index].remark"
                placeholder="请输入备注"
              />
            </template>
          </el-table-column>
        </el-table>
        
        <div class="total-amount">
          <span>总金额：</span>
          <span class="amount-value">¥ {{ applicationForm.totalAmount.toFixed(2) }}</span>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelDialog">取消</el-button>
          <el-button type="primary" @click="saveApplication">保存</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 订单选择器 -->
    <el-dialog
      v-model="orderSelectorVisible"
      title="选择销售订单"
      width="80%"
      :close-on-click-modal="false"
    >
      <div class="order-search">
        <el-form :inline="true" :model="orderSearchForm" class="search-form">
          <el-form-item label="订单编号">
            <el-input
              v-model="orderSearchForm.orderNumber"
              placeholder="请输入订单编号"
              clearable
              @keyup.enter="searchOrders"
            />
          </el-form-item>
          <el-form-item label="客户名称">
            <el-input
              v-model="orderSearchForm.customerName"
              placeholder="请输入客户名称"
              clearable
              @keyup.enter="searchOrders"
            />
          </el-form-item>
          <el-form-item label="订单状态">
            <el-select
              v-model="orderSearchForm.status"
              placeholder="请选择订单状态"
              clearable
            >
              <el-option label="已确认" value="CONFIRMED" />
              <el-option label="部分发货" value="PARTIALLY_SHIPPED" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="searchOrders" type="primary">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table
        v-loading="ordersLoading"
        :data="availableOrders"
        style="width: 100%"
        @row-click="selectOrder"
      >
        <el-table-column prop="orderNumber" label="订单编号" width="180" />
        <el-table-column prop="customerName" label="客户名称" width="180" />
        <el-table-column prop="orderDate" label="下单日期" width="150" />
        <el-table-column prop="totalAmount" label="订单金额" width="120">
          <template #default="{ row }">
            ¥ {{ row.totalAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getOrderStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" />
      </el-table>
      
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="orderPagination.currentPage"
          v-model:page-size="orderPagination.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="ordersTotal"
          @size-change="handleOrderSizeChange"
          @current-change="handleOrderCurrentChange"
        />
      </div>
    </el-dialog>
    
    <!-- 审批对话框 -->
    <el-dialog
      v-model="approvalVisible"
      title="审批发货申请"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="approvalForm" label-width="100px">
        <el-form-item label="申请编号">
          <el-input v-model="approvalForm.applicatNumber" disabled />
        </el-form-item>
        <el-form-item label="审批结果" prop="result">
          <el-radio-group v-model="approvalForm.result">
            <el-radio label="APPROVED">同意</el-radio>
            <el-radio label="REJECTED">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见" prop="comment">
          <el-input
            v-model="approvalForm.comment"
            type="textarea"
            rows="4"
            placeholder="请输入审批意见"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="approvalVisible = false">取消</el-button>
          <el-button type="primary" @click="submitApproval">提交审批</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="发货申请详情"
      width="80%"
      :close-on-click-modal="false"
    >
      <!-- 详情内容会根据选中的申请动态显示 -->
      <div v-if="selectedApplication" class="application-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申请编号">{{ selectedApplication.applicatNumber }}</el-descriptions-item>
          <el-descriptions-item label="订单编号">{{ selectedApplication.orderNumber }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ selectedApplication.customerName }}</el-descriptions-item>
          <el-descriptions-item label="申请日期">{{ selectedApplication.applyDate }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ selectedApplication.applyBy }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ selectedApplication.contactPhone }}</el-descriptions-item>
          <el-descriptions-item label="预计发货日期">{{ selectedApplication.expectedShipDate }}</el-descriptions-item>
          <el-descriptions-item label="紧急程度">{{ getUrgencyLevelLabel(selectedApplication.urgencyLevel) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="getStatusTagType(selectedApplication.status)"
            >
              {{ getStatusLabel(selectedApplication.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审批人">{{ selectedApplication.approvalBy || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审批日期">{{ selectedApplication.approvalDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审批意见">{{ selectedApplication.approvalComment || '-' }}</el-descriptions-item>
          <el-descriptions-item label="发货地址" :span="2">{{ selectedApplication.shipToAddress }}</el-descriptions-item>
          <el-descriptions-item label="申请原因" :span="2">{{ selectedApplication.reason || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <h3>申请明细</h3>
        <el-table
          :data="selectedApplication.items"
          style="width: 100%"
          border
        >
          <el-table-column prop="productCode" label="产品编码" width="150" />
          <el-table-column prop="productName" label="产品名称" min-width="180" />
          <el-table-column prop="productSpec" label="规格型号" width="150" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="orderQuantity" label="订单数量" width="120" />
          <el-table-column prop="applyQuantity" label="申请数量" width="120" />
          <el-table-column prop="unitPrice" label="单价" width="120">
            <template #default="{ row }">
              ¥ {{ row.unitPrice.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="{ row }">
              ¥ {{ row.amount.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="150" />
        </el-table>
        
        <div class="total-amount">
          <span>总金额：</span>
          <span class="amount-value">¥ {{ selectedApplication.totalAmount.toFixed(2) }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Plus,
  Search,
  Download,
  ArrowDown,
  Edit,
  View,
  Delete,
  Check,
  Close,
  Printer
} from '@element-plus/icons-vue';

export default {
  name: 'ShippingApplication',
  components: {
    Plus,
    Search,
    Download,
    ArrowDown,
    Edit,
    View,
    Delete,
    Check,
    Close,
    Printer
  },
  setup() {
    // 状态管理
    const loading = ref(false);
    const itemsLoading = ref(false);
    const applications = ref([]);
    const total = ref(0);
    const selectedRows = ref([]);
    
    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20
    });
    
    // 搜索表单
    const searchForm = reactive({
      applicatNumber: '',
      customerName: '',
      orderNumber: '',
      status: '',
      applyDateRange: []
    });
    
    // 申请状态选项
    const applicationStatuses = [
      { label: '草稿', value: 'DRAFT' },
      { label: '已提交', value: 'SUBMITTED' },
      { label: '已审批', value: 'APPROVED' },
      { label: '已驳回', value: 'REJECTED' }
    ];
    
    // 对话框状态
    const dialogVisible = ref(false);
    const dialogTitle = ref('');
    const detailVisible = ref(false);
    const approvalVisible = ref(false);
    const selectedApplication = ref(null);
    const currentApprovalId = ref('');
    
    // 订单选择器
    const orderSelectorVisible = ref(false);
    const orderSearchForm = reactive({
      orderNumber: '',
      customerName: '',
      status: ''
    });
    const availableOrders = ref([]);
    const ordersLoading = ref(false);
    const ordersTotal = ref(0);
    const orderPagination = reactive({
      currentPage: 1,
      pageSize: 10
    });
    
    // 表单数据
    const applicationForm = reactive({
      id: '',
      applicatNumber: '',
      orderNumber: '',
      customerName: '',
      applyDate: '',
      applyBy: '当前用户',
      contactPhone: '',
      shipToAddress: '',
      expectedShipDate: '',
      urgencyLevel: 'NORMAL',
      status: 'DRAFT',
      totalAmount: 0,
      reason: '',
      approvalBy: '',
      approvalDate: '',
      approvalComment: '',
      items: []
    });
    
    // 审批表单
    const approvalForm = reactive({
      applicatNumber: '',
      result: 'APPROVED',
      comment: ''
    });
    
    // 表单验证规则
    const applicationRules = {
      orderNumber: [
        { required: true, message: '请选择销售订单', trigger: 'blur' }
      ],
      applyDate: [
        { required: true, message: '请选择申请日期', trigger: 'change' }
      ],
      contactPhone: [
        { required: true, message: '请输入联系电话', trigger: 'blur' }
      ],
      expectedShipDate: [
        { required: true, message: '请选择预计发货日期', trigger: 'change' }
      ],
      urgencyLevel: [
        { required: true, message: '请选择紧急程度', trigger: 'change' }
      ],
      reason: [
        { required: true, message: '请输入申请原因', trigger: 'blur' }
      ]
    };
    
    // 方法
    const getApplications = async () => {
      loading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 模拟数据
        const mockData = {
          total: 45,
          data: Array.from({ length: 20 }, (_, index) => ({
            id: index + 1,
            applicatNumber: `SA${2024}${String(index + 1).padStart(4, '0')}`,
            orderNumber: `SO${2024}${String(index + 50).padStart(4, '0')}`,
            customerName: `客户${String(index + 1).padStart(3, '0')}`,
            applyDate: `2024-0${Math.floor(index / 5) + 1}-${String(index % 28 + 1).padStart(2, '0')}`,
            applyBy: `申请人${index % 5 + 1}`,
            contactPhone: `1380013800${index}`,
            shipToAddress: `上海市浦东新区张江高科技园区${index + 100}号`,
            expectedShipDate: `2024-0${Math.floor(index / 5) + 1}-${String(index % 28 + 5).padStart(2, '0')}`,
            urgencyLevel: ['NORMAL', 'URGENT', 'CRITICAL'][index % 3],
            status: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'][index % 4],
            totalAmount: Math.random() * 15000 + 2000,
            reason: `申请发货原因${index + 1}`,
            approvalBy: index % 2 === 0 ? `审批人${index % 3 + 1}` : '',
            approvalDate: index % 2 === 0 ? `2024-0${Math.floor(index / 5) + 1}-${String(index % 28 + 3).padStart(2, '0')}` : '',
            approvalComment: index % 2 === 0 ? `审批意见${index + 1}` : '',
            items: Array.from({ length: 2 }, (_, itemIndex) => ({
              productCode: `PROD${String(itemIndex + 200).padStart(4, '0')}`,
              productName: `产品${itemIndex + 200}`,
              productSpec: `规格${itemIndex + 1}`,
              unit: ['个', '件', '箱'][itemIndex % 3],
              orderQuantity: Math.floor(Math.random() * 100) + 50,
              applyQuantity: Math.floor(Math.random() * 50) + 20,
              unitPrice: Math.random() * 1500 + 300,
              amount: Math.random() * 10000 + 2000,
              remark: `明细备注${itemIndex + 1}`
            }))
          }))
        };
        
        applications.value = mockData.data;
        total.value = mockData.total;
      } catch (error) {
        ElMessage.error('获取发货申请列表失败');
        console.error('获取发货申请列表失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const handleSearch = () => {
      pagination.currentPage = 1;
      getApplications();
    };
    
    const resetSearch = () => {
      Object.assign(searchForm, {
        applicatNumber: '',
        customerName: '',
        orderNumber: '',
        status: '',
        applyDateRange: []
      });
      handleSearch();
    };
    
    const handleSelectionChange = (val) => {
      selectedRows.value = val;
    };
    
    const handleBatchCommand = (command) => {
      if (selectedRows.value.length === 0) {
        ElMessage.warning('请先选择要操作的数据');
        return;
      }
      
      switch (command) {
        case 'batchApprove':
          batchApprove();
          break;
        case 'batchReject':
          batchReject();
          break;
        case 'batchDelete':
          batchDelete();
          break;
      }
    };
    
    const batchApprove = async () => {
      ElMessageBox.confirm(
        `确定要审批选中的 ${selectedRows.value.length} 条发货申请吗？`,
        '确认审批',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        loading.value = true;
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 500));
          ElMessage.success('批量审批成功');
          getApplications();
        } catch (error) {
          ElMessage.error('批量审批失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const batchReject = async () => {
      ElMessageBox.confirm(
        `确定要驳回选中的 ${selectedRows.value.length} 条发货申请吗？`,
        '确认驳回',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        loading.value = true;
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 500));
          ElMessage.success('批量驳回成功');
          getApplications();
        } catch (error) {
          ElMessage.error('批量驳回失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const batchDelete = async () => {
      ElMessageBox.confirm(
        `确定要删除选中的 ${selectedRows.value.length} 条发货申请吗？`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'error'
        }
      ).then(async () => {
        loading.value = true;
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 500));
          ElMessage.success('批量删除成功');
          getApplications();
        } catch (error) {
          ElMessage.error('批量删除失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
      getApplications();
    };
    
    const handleCurrentChange = (current) => {
      pagination.currentPage = current;
      getApplications();
    };
    
    const exportData = () => {
      ElMessage.info('导出功能开发中');
    };
    
    const createApplication = () => {
      dialogTitle.value = '新建发货申请';
      resetApplicationForm();
      applicationForm.applicatNumber = `SA${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      applicationForm.applyDate = new Date().toISOString().split('T')[0];
      dialogVisible.value = true;
    };
    
    const editApplication = (row) => {
      dialogTitle.value = '编辑发货申请';
      // 深拷贝行数据到表单
      Object.assign(applicationForm, JSON.parse(JSON.stringify(row)));
      dialogVisible.value = true;
    };
    
    const saveApplication = async () => {
      // 验证表单
      if (!applicationForm.orderNumber) {
        ElMessage.warning('请先选择销售订单');
        return;
      }
      
      if (!applicationForm.applyDate) {
        ElMessage.warning('请选择申请日期');
        return;
      }
      
      if (!applicationForm.contactPhone) {
        ElMessage.warning('请输入联系电话');
        return;
      }
      
      if (!applicationForm.expectedShipDate) {
        ElMessage.warning('请选择预计发货日期');
        return;
      }
      
      if (!applicationForm.reason) {
        ElMessage.warning('请输入申请原因');
        return;
      }
      
      loading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        ElMessage.success('保存成功');
        dialogVisible.value = false;
        getApplications();
      } catch (error) {
        ElMessage.error('保存失败');
      } finally {
        loading.value = false;
      }
    };
    
    const cancelDialog = () => {
      dialogVisible.value = false;
      orderSelectorVisible.value = false;
    };
    
    const resetApplicationForm = () => {
      Object.assign(applicationForm, {
        id: '',
        applicatNumber: '',
        orderNumber: '',
        customerName: '',
        applyDate: new Date().toISOString().split('T')[0],
        applyBy: '当前用户',
        contactPhone: '',
        shipToAddress: '',
        expectedShipDate: '',
        urgencyLevel: 'NORMAL',
        status: 'DRAFT',
        totalAmount: 0,
        reason: '',
        approvalBy: '',
        approvalDate: '',
        approvalComment: '',
        items: []
      });
    };
    
    const submitApplication = async (row) => {
      ElMessageBox.confirm(
        `确定要提交发货申请 ${row.applicatNumber} 吗？`,
        '确认提交',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(async () => {
        loading.value = true;
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 500));
          ElMessage.success('提交成功');
          getApplications();
        } catch (error) {
          ElMessage.error('提交失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const approveApplication = (row) => {
      currentApprovalId.value = row.id;
      approvalForm.applicatNumber = row.applicatNumber;
      approvalForm.result = 'APPROVED';
      approvalForm.comment = '';
      approvalVisible.value = true;
    };
    
    const rejectApplication = (row) => {
      ElMessageBox.prompt(
        `请输入驳回理由`,
        `驳回发货申请 ${row.applicatNumber}`,
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputType: 'textarea'
        }
      ).then(async ({ value }) => {
        if (!value) {
          ElMessage.warning('请输入驳回理由');
          return;
        }
        
        loading.value = true;
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 500));
          ElMessage.success('驳回成功');
          getApplications();
        } catch (error) {
          ElMessage.error('驳回失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const submitApproval = async () => {
      if (approvalForm.result === 'REJECTED' && !approvalForm.comment) {
        ElMessage.warning('请输入审批意见');
        return;
      }
      
      loading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        ElMessage.success('审批成功');
        approvalVisible.value = false;
        getApplications();
      } catch (error) {
        ElMessage.error('审批失败');
      } finally {
        loading.value = false;
      }
    };
    
    const generatePlan = async (row) => {
      ElMessageBox.confirm(
        `确定要根据发货申请 ${row.applicatNumber} 生成发货计划吗？`,
        '确认生成',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(async () => {
        loading.value = true;
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 500));
          ElMessage.success('发货计划生成成功');
          getApplications();
        } catch (error) {
          ElMessage.error('发货计划生成失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const viewApplicationDetail = (row) => {
      selectedApplication.value = JSON.parse(JSON.stringify(row));
      detailVisible.value = true;
    };
    
    const deleteApplication = async (row) => {
      ElMessageBox.confirm(
        `确定要删除发货申请 ${row.applicatNumber} 吗？`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'error'
        }
      ).then(async () => {
        loading.value = true;
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 500));
          ElMessage.success('删除成功');
          getApplications();
        } catch (error) {
          ElMessage.error('删除失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const printApplication = (row) => {
      ElMessage.info('打印功能开发中');
    };
    
    const showOrderSelector = () => {
      searchOrders();
      orderSelectorVisible.value = true;
    };
    
    const searchOrders = async () => {
      ordersLoading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 模拟数据
        const mockOrders = {
          total: 35,
          data: Array.from({ length: 10 }, (_, index) => ({
            id: index + 1,
            orderNumber: `SO${2024}${String(index + 150).padStart(4, '0')}`,
            customerName: `客户${String(index + 50).padStart(3, '0')}`,
            orderDate: `2024-0${Math.floor(index / 2) + 1}-${String(index % 28 + 1).padStart(2, '0')}`,
            totalAmount: Math.random() * 25000 + 8000,
            status: ['CONFIRMED', 'PARTIALLY_SHIPPED'][index % 2],
            remark: `订单备注${index + 1}`
          }))
        };
        
        availableOrders.value = mockOrders.data;
        ordersTotal.value = mockOrders.total;
      } catch (error) {
        ElMessage.error('获取订单列表失败');
      } finally {
        ordersLoading.value = false;
      }
    };
    
    const selectOrder = async (order) => {
      itemsLoading.value = true;
      try {
        // 模拟获取订单详情和明细
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 模拟订单详情
        const orderDetail = {
          ...order,
          shipToAddress: `上海市静安区南京西路${order.id * 20}号`,
          items: Array.from({ length: 3 }, (_, itemIndex) => ({
            productCode: `PROD${String(itemIndex + 300).padStart(4, '0')}`,
            productName: `产品${itemIndex + 300}`,
            productSpec: `规格${itemIndex + 1}`,
            unit: ['个', '件', '箱'][itemIndex % 3],
            orderQuantity: Math.floor(Math.random() * 100) + 50,
            applyQuantity: Math.floor(Math.random() * 50) + 20,
            unitPrice: Math.random() * 1500 + 300,
            amount: 0,
            remark: ''
          }))
        };
        
        // 填充表单
        applicationForm.orderNumber = orderDetail.orderNumber;
        applicationForm.customerName = orderDetail.customerName;
        applicationForm.shipToAddress = orderDetail.shipToAddress;
        applicationForm.items = orderDetail.items;
        
        updateTotalAmount();
        orderSelectorVisible.value = false;
      } catch (error) {
        ElMessage.error('获取订单详情失败');
      } finally {
        itemsLoading.value = false;
      }
    };
    
    const updateTotalAmount = () => {
      let total = 0;
      applicationForm.items.forEach(item => {
        item.amount = item.applyQuantity * item.unitPrice;
        total += item.amount;
      });
      applicationForm.totalAmount = total;
    };
    
    const handleOrderSizeChange = (size) => {
      orderPagination.pageSize = size;
      searchOrders();
    };
    
    const handleOrderCurrentChange = (current) => {
      orderPagination.currentPage = current;
      searchOrders();
    };
    
    const getStatusLabel = (status) => {
      const statusMap = applicationStatuses.reduce((map, item) => {
        map[item.value] = item.label;
        return map;
      }, {});
      return statusMap[status] || status;
    };
    
    const getStatusTagType = (status) => {
      const typeMap = {
        DRAFT: 'info',
        SUBMITTED: 'warning',
        APPROVED: 'success',
        REJECTED: 'danger'
      };
      return typeMap[status] || 'info';
    };
    
    const getUrgencyLevelLabel = (level) => {
      const levelMap = {
        NORMAL: '普通',
        URGENT: '加急',
        CRITICAL: '特急'
      };
      return levelMap[level] || level;
    };
    
    const getOrderStatusLabel = (status) => {
      const statusMap = {
        CONFIRMED: '已确认',
        PARTIALLY_SHIPPED: '部分发货'
      };
      return statusMap[status] || status;
    };
    
    // 初始化
    onMounted(() => {
      getApplications();
    });
    
    return {
      loading,
      itemsLoading,
      applications,
      total,
      selectedRows,
      pagination,
      searchForm,
      applicationStatuses,
      dialogVisible,
      dialogTitle,
      detailVisible,
      approvalVisible,
      selectedApplication,
      orderSelectorVisible,
      orderSearchForm,
      availableOrders,
      ordersLoading,
      ordersTotal,
      orderPagination,
      applicationForm,
      approvalForm,
      applicationRules,
      handleSearch,
      resetSearch,
      handleSelectionChange,
      handleBatchCommand,
      handleSizeChange,
      handleCurrentChange,
      exportData,
      createApplication,
      editApplication,
      saveApplication,
      cancelDialog,
      submitApplication,
      approveApplication,
      rejectApplication,
      submitApproval,
      generatePlan,
      viewApplicationDetail,
      deleteApplication,
      printApplication,
      showOrderSelector,
      searchOrders,
      selectOrder,
      updateTotalAmount,
      handleOrderSizeChange,
      handleOrderCurrentChange,
      getStatusLabel,
      getStatusTagType,
      getUrgencyLevelLabel,
      getOrderStatusLabel
    };
  }
};
</script>

<style scoped>
.shipping-application {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.header-actions h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.search-section {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 15px;
}

.search-actions {
  display: flex;
  gap: 10px;
}

.table-section {
  margin-top: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.application-items-section {
  margin-top: 30px;
}

.application-items-section h3 {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 500;
}

.total-amount {
  margin-top: 15px;
  text-align: right;
  font-size: 16px;
}

.amount-value {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}

.application-detail {
  padding: 10px;
}

.application-detail h3 {
  margin: 20px 0 10px 0;
  font-size: 16px;
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>