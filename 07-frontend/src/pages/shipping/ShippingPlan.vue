<template>
  <div class="shipping-plan">
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>首页</el-breadcrumb-item>
        <el-breadcrumb-item>发货管理</el-breadcrumb-item>
        <el-breadcrumb-item>发货计划</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="header-actions">
        <h1>发货计划</h1>
        <el-button type="primary" @click="createPlan" size="large">
          <el-icon><Plus /></el-icon>
          新建发货计划
        </el-button>
      </div>
    </div>
    
    <el-card shadow="never">
      <div class="search-section">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="计划编号">
            <el-input
              v-model="searchForm.planNumber"
              placeholder="请输入计划编号"
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
          <el-form-item label="计划状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择状态"
              clearable
            >
              <el-option
                v-for="status in planStatuses"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="计划发货日期">
            <el-date-picker
              v-model="searchForm.planDateRange"
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
                <el-dropdown-item command="batchCancel">批量取消</el-dropdown-item>
                <el-dropdown-item command="batchDelete">批量删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        
        <el-table
          v-loading="loading"
          :data="shippingPlans"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="planNumber" label="计划编号" width="180" />
          <el-table-column prop="orderNumber" label="订单编号" width="180" />
          <el-table-column prop="customerName" label="客户名称" width="180" />
          <el-table-column prop="customerContact" label="联系人" width="120" />
          <el-table-column prop="customerPhone" label="联系电话" width="150" />
          <el-table-column prop="shipToAddress" label="发货地址" min-width="200">
            <template #default="{ row }">
              <div class="text-ellipsis" :title="row.shipToAddress">
                {{ row.shipToAddress }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="planShipDate" label="计划发货日期" width="150" />
          <el-table-column prop="actualShipDate" label="实际发货日期" width="150" />
          <el-table-column prop="totalAmount" label="总金额" width="120">
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
          <el-table-column prop="createBy" label="创建人" width="120" />
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'DRAFT'"
                type="primary"
                size="small"
                @click="editPlan(row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="row.status === 'DRAFT'"
                size="small"
                @click="submitApproval(row)"
              >
                提交审批
              </el-button>
              <el-button
                v-if="row.status === 'APPROVED'"
                size="small"
                @click="generateDeliveryNote(row)"
              >
                生成发货单
              </el-button>
              <el-button
                size="small"
                @click="viewPlanDetail(row)"
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
                      @click="deletePlan(row)"
                    >
                      删除
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.status === 'APPROVED'"
                      @click="cancelPlan(row)"
                    >
                      取消计划
                    </el-dropdown-item>
                    <el-dropdown-item @click="printPlan(row)">
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
    
    <!-- 新建/编辑发货计划对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="90%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form
        ref="planForm"
        :model="planForm"
        :rules="planRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计划编号" prop="planNumber">
              <el-input
                v-model="planForm.planNumber"
                placeholder="系统自动生成"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单编号" prop="orderNumber">
              <el-input
                v-model="planForm.orderNumber"
                placeholder="请输入订单编号"
                @focus="showOrderSelector"
                readonly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customerName">
              <el-input
                v-model="planForm.customerName"
                placeholder="请输入客户名称"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户联系人" prop="customerContact">
              <el-input
                v-model="planForm.customerContact"
                placeholder="请输入联系人"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="customerPhone">
              <el-input
                v-model="planForm.customerPhone"
                placeholder="请输入联系电话"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划发货日期" prop="planShipDate">
              <el-date-picker
                v-model="planForm.planShipDate"
                type="date"
                placeholder="请选择计划发货日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发货方式" prop="shipMethod">
              <el-select
                v-model="planForm.shipMethod"
                placeholder="请选择发货方式"
              >
                <el-option label="快递" value="EXPRESS" />
                <el-option label="物流" value="LOGISTICS" />
                <el-option label="自提" value="SELF_PICKUP" />
                <el-option label="其他" value="OTHER" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="运输方式" prop="transportType">
              <el-select
                v-model="planForm.transportType"
                placeholder="请选择运输方式"
              >
                <el-option label="公路运输" value="ROAD" />
                <el-option label="铁路运输" value="RAILWAY" />
                <el-option label="航空运输" value="AIR" />
                <el-option label="水路运输" value="SEA" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="发货地址" prop="shipToAddress">
              <el-input
                v-model="planForm.shipToAddress"
                type="textarea"
                rows="2"
                placeholder="请输入详细发货地址"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="planForm.remark"
                type="textarea"
                rows="3"
                placeholder="请输入备注信息"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <div class="plan-items-section">
        <h3>发货计划明细</h3>
        <el-table
          v-loading="itemsLoading"
          :data="planForm.items"
          style="width: 100%"
          border
        >
          <el-table-column prop="productCode" label="产品编码" width="150" />
          <el-table-column prop="productName" label="产品名称" min-width="180" />
          <el-table-column prop="productSpec" label="规格型号" width="150" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="quantity" label="发货数量" width="120">
            <template #default="{ row, $index }">
              <el-input-number
                v-model="planForm.items[$index].quantity"
                :min="0"
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
              ¥ {{ (planForm.items[$index].quantity * row.unitPrice).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="150">
            <template #default="{ row, $index }">
              <el-input
                v-model="planForm.items[$index].remark"
                placeholder="请输入备注"
              />
            </template>
          </el-table-column>
        </el-table>
        
        <div class="total-amount">
          <span>总金额：</span>
          <span class="amount-value">¥ {{ planForm.totalAmount.toFixed(2) }}</span>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelDialog">取消</el-button>
          <el-button type="primary" @click="savePlan">保存</el-button>
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
            <el-tag size="small">{{ getStatusLabel(row.status) }}</el-tag>
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
    
    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="发货计划详情"
      width="80%"
      :close-on-click-modal="false"
    >
      <!-- 详情内容会根据选中的计划动态显示 -->
      <div v-if="selectedPlan" class="plan-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="计划编号">{{ selectedPlan.planNumber }}</el-descriptions-item>
          <el-descriptions-item label="订单编号">{{ selectedPlan.orderNumber }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ selectedPlan.customerName }}</el-descriptions-item>
          <el-descriptions-item label="客户联系人">{{ selectedPlan.customerContact }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ selectedPlan.customerPhone }}</el-descriptions-item>
          <el-descriptions-item label="计划发货日期">{{ selectedPlan.planShipDate }}</el-descriptions-item>
          <el-descriptions-item label="实际发货日期">{{ selectedPlan.actualShipDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="发货方式">{{ getShipMethodLabel(selectedPlan.shipMethod) }}</el-descriptions-item>
          <el-descriptions-item label="运输方式">{{ getTransportTypeLabel(selectedPlan.transportType) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="getStatusTagType(selectedPlan.status)"
            >
              {{ getStatusLabel(selectedPlan.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建人">{{ selectedPlan.createBy }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedPlan.createTime }}</el-descriptions-item>
          <el-descriptions-item label="发货地址" :span="2">{{ selectedPlan.shipToAddress }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedPlan.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <h3>发货明细</h3>
        <el-table
          :data="selectedPlan.items"
          style="width: 100%"
          border
        >
          <el-table-column prop="productCode" label="产品编码" width="150" />
          <el-table-column prop="productName" label="产品名称" min-width="180" />
          <el-table-column prop="productSpec" label="规格型号" width="150" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="quantity" label="发货数量" width="120" />
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
          <span class="amount-value">¥ {{ selectedPlan.totalAmount.toFixed(2) }}</span>
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
  name: 'ShippingPlan',
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
    const shippingPlans = ref([]);
    const total = ref(0);
    const selectedRows = ref([]);
    
    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20
    });
    
    // 搜索表单
    const searchForm = reactive({
      planNumber: '',
      customerName: '',
      orderNumber: '',
      status: '',
      planDateRange: []
    });
    
    // 计划状态选项
    const planStatuses = [
      { label: '草稿', value: 'DRAFT' },
      { label: '已提交', value: 'SUBMITTED' },
      { label: '已审批', value: 'APPROVED' },
      { label: '已取消', value: 'CANCELED' },
      { label: '已完成', value: 'COMPLETED' }
    ];
    
    // 对话框状态
    const dialogVisible = ref(false);
    const dialogTitle = ref('');
    const detailVisible = ref(false);
    const selectedPlan = ref(null);
    
    // 订单选择器
    const orderSelectorVisible = ref(false);
    const orderSearchForm = reactive({
      orderNumber: '',
      customerName: ''
    });
    const availableOrders = ref([]);
    const ordersLoading = ref(false);
    const ordersTotal = ref(0);
    const orderPagination = reactive({
      currentPage: 1,
      pageSize: 10
    });
    
    // 表单数据
    const planForm = reactive({
      id: '',
      planNumber: '',
      orderNumber: '',
      customerName: '',
      customerContact: '',
      customerPhone: '',
      shipToAddress: '',
      planShipDate: '',
      actualShipDate: '',
      shipMethod: '',
      transportType: '',
      status: 'DRAFT',
      totalAmount: 0,
      remark: '',
      items: []
    });
    
    // 表单验证规则
    const planRules = {
      orderNumber: [
        { required: true, message: '请选择销售订单', trigger: 'blur' }
      ],
      planShipDate: [
        { required: true, message: '请选择计划发货日期', trigger: 'change' }
      ],
      shipMethod: [
        { required: true, message: '请选择发货方式', trigger: 'change' }
      ],
      transportType: [
        { required: true, message: '请选择运输方式', trigger: 'change' }
      ]
    };
    
    // 表单引用
    const planFormRef = ref(null);
    
    // 方法
    const getShippingPlans = async () => {
      loading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 模拟数据
        const mockData = {
          total: 50,
          data: Array.from({ length: 20 }, (_, index) => ({
            id: index + 1,
            planNumber: `SP${2024}${String(index + 1).padStart(4, '0')}`,
            orderNumber: `SO${2024}${String(index + 10).padStart(4, '0')}`,
            customerName: `客户${String(index + 1).padStart(3, '0')}`,
            customerContact: `联系人${index + 1}`,
            customerPhone: `1380013800${index}`,
            shipToAddress: `北京市朝阳区建国路${index + 100}号`,
            planShipDate: `2024-0${Math.floor(index / 3) + 1}-${String(index % 28 + 1).padStart(2, '0')}`,
            actualShipDate: index % 5 === 0 ? `2024-0${Math.floor(index / 3) + 1}-${String(index % 28 + 1).padStart(2, '0')}` : '',
            shipMethod: ['EXPRESS', 'LOGISTICS', 'SELF_PICKUP'][index % 3],
            transportType: ['ROAD', 'RAILWAY', 'AIR', 'SEA'][index % 4],
            status: ['DRAFT', 'SUBMITTED', 'APPROVED', 'COMPLETED', 'CANCELED'][index % 5],
            totalAmount: Math.random() * 10000 + 1000,
            createBy: `用户${index % 3 + 1}`,
            createTime: `2024-0${Math.floor(index / 6) + 1}-${String(index % 28 + 1).padStart(2, '0')} 10:${String(index % 60).padStart(2, '0')}:${String(index % 60).padStart(2, '0')}`,
            remark: `备注信息${index + 1}`,
            items: Array.from({ length: 3 }, (_, itemIndex) => ({
              productCode: `PROD${String(itemIndex + 1).padStart(4, '0')}`,
              productName: `产品${itemIndex + 1}`,
              productSpec: `规格${itemIndex + 1}`,
              unit: ['个', '件', '箱'][itemIndex % 3],
              quantity: Math.floor(Math.random() * 100) + 1,
              unitPrice: Math.random() * 1000 + 100,
              amount: Math.random() * 10000 + 1000,
              remark: `明细备注${itemIndex + 1}`
            }))
          }))
        };
        
        shippingPlans.value = mockData.data;
        total.value = mockData.total;
      } catch (error) {
        ElMessage.error('获取发货计划列表失败');
        console.error('获取发货计划列表失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const handleSearch = () => {
      pagination.currentPage = 1;
      getShippingPlans();
    };
    
    const resetSearch = () => {
      Object.assign(searchForm, {
        planNumber: '',
        customerName: '',
        orderNumber: '',
        status: '',
        planDateRange: []
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
        case 'batchCancel':
          batchCancel();
          break;
        case 'batchDelete':
          batchDelete();
          break;
      }
    };
    
    const batchApprove = async () => {
      ElMessageBox.confirm(
        `确定要审批选中的 ${selectedRows.value.length} 条发货计划吗？`,
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
          getShippingPlans();
        } catch (error) {
          ElMessage.error('批量审批失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const batchCancel = async () => {
      ElMessageBox.confirm(
        `确定要取消选中的 ${selectedRows.value.length} 条发货计划吗？`,
        '确认取消',
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
          ElMessage.success('批量取消成功');
          getShippingPlans();
        } catch (error) {
          ElMessage.error('批量取消失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const batchDelete = async () => {
      ElMessageBox.confirm(
        `确定要删除选中的 ${selectedRows.value.length} 条发货计划吗？`,
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
          getShippingPlans();
        } catch (error) {
          ElMessage.error('批量删除失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
      getShippingPlans();
    };
    
    const handleCurrentChange = (current) => {
      pagination.currentPage = current;
      getShippingPlans();
    };
    
    const exportData = () => {
      ElMessage.info('导出功能开发中');
    };
    
    const createPlan = () => {
      dialogTitle.value = '新建发货计划';
      resetPlanForm();
      planForm.planNumber = `SP${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      dialogVisible.value = true;
    };
    
    const editPlan = (row) => {
      dialogTitle.value = '编辑发货计划';
      // 深拷贝行数据到表单
      Object.assign(planForm, JSON.parse(JSON.stringify(row)));
      dialogVisible.value = true;
    };
    
    const savePlan = async () => {
      // 验证表单
      if (!planForm.orderNumber) {
        ElMessage.warning('请先选择销售订单');
        return;
      }
      
      if (!planForm.planShipDate) {
        ElMessage.warning('请选择计划发货日期');
        return;
      }
      
      if (!planForm.shipMethod) {
        ElMessage.warning('请选择发货方式');
        return;
      }
      
      if (!planForm.transportType) {
        ElMessage.warning('请选择运输方式');
        return;
      }
      
      loading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        ElMessage.success('保存成功');
        dialogVisible.value = false;
        getShippingPlans();
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
    
    const resetPlanForm = () => {
      Object.assign(planForm, {
        id: '',
        planNumber: '',
        orderNumber: '',
        customerName: '',
        customerContact: '',
        customerPhone: '',
        shipToAddress: '',
        planShipDate: '',
        actualShipDate: '',
        shipMethod: '',
        transportType: '',
        status: 'DRAFT',
        totalAmount: 0,
        remark: '',
        items: []
      });
    };
    
    const submitApproval = async (row) => {
      ElMessageBox.confirm(
        `确定要提交审批发货计划 ${row.planNumber} 吗？`,
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
          ElMessage.success('提交审批成功');
          getShippingPlans();
        } catch (error) {
          ElMessage.error('提交审批失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const generateDeliveryNote = async (row) => {
      loading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        ElMessage.success('发货单生成成功');
        getShippingPlans();
      } catch (error) {
        ElMessage.error('发货单生成失败');
      } finally {
        loading.value = false;
      }
    };
    
    const viewPlanDetail = (row) => {
      selectedPlan.value = JSON.parse(JSON.stringify(row));
      detailVisible.value = true;
    };
    
    const deletePlan = async (row) => {
      ElMessageBox.confirm(
        `确定要删除发货计划 ${row.planNumber} 吗？`,
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
          getShippingPlans();
        } catch (error) {
          ElMessage.error('删除失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const cancelPlan = async (row) => {
      ElMessageBox.confirm(
        `确定要取消发货计划 ${row.planNumber} 吗？`,
        '确认取消',
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
          ElMessage.success('取消成功');
          getShippingPlans();
        } catch (error) {
          ElMessage.error('取消失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const printPlan = (row) => {
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
          total: 30,
          data: Array.from({ length: 10 }, (_, index) => ({
            id: index + 1,
            orderNumber: `SO${2024}${String(index + 100).padStart(4, '0')}`,
            customerName: `客户${String(index + 10).padStart(3, '0')}`,
            orderDate: `2024-0${Math.floor(index / 2) + 1}-${String(index % 28 + 1).padStart(2, '0')}`,
            totalAmount: Math.random() * 20000 + 5000,
            status: 'CONFIRMED',
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
          customerContact: `${order.customerName}联系人`,
          customerPhone: '13800138000',
          shipToAddress: `北京市海淀区中关村南大街${order.id * 10}号`,
          items: Array.from({ length: 3 }, (_, itemIndex) => ({
            productCode: `PROD${String(itemIndex + 100).padStart(4, '0')}`,
            productName: `产品${itemIndex + 100}`,
            productSpec: `规格${itemIndex + 1}`,
            unit: ['个', '件', '箱'][itemIndex % 3],
            quantity: Math.floor(Math.random() * 50) + 10,
            unitPrice: Math.random() * 1000 + 200,
            amount: 0,
            remark: ''
          }))
        };
        
        // 填充表单
        planForm.orderNumber = orderDetail.orderNumber;
        planForm.customerName = orderDetail.customerName;
        planForm.customerContact = orderDetail.customerContact;
        planForm.customerPhone = orderDetail.customerPhone;
        planForm.shipToAddress = orderDetail.shipToAddress;
        planForm.items = orderDetail.items;
        
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
      planForm.items.forEach(item => {
        item.amount = item.quantity * item.unitPrice;
        total += item.amount;
      });
      planForm.totalAmount = total;
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
      const statusMap = planStatuses.reduce((map, item) => {
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
        COMPLETED: 'primary',
        CANCELED: 'danger'
      };
      return typeMap[status] || 'info';
    };
    
    const getShipMethodLabel = (method) => {
      const methodMap = {
        EXPRESS: '快递',
        LOGISTICS: '物流',
        SELF_PICKUP: '自提',
        OTHER: '其他'
      };
      return methodMap[method] || method;
    };
    
    const getTransportTypeLabel = (type) => {
      const typeMap = {
        ROAD: '公路运输',
        RAILWAY: '铁路运输',
        AIR: '航空运输',
        SEA: '水路运输'
      };
      return typeMap[type] || type;
    };
    
    // 初始化
    onMounted(() => {
      getShippingPlans();
    });
    
    return {
      loading,
      itemsLoading,
      shippingPlans,
      total,
      selectedRows,
      pagination,
      searchForm,
      planStatuses,
      dialogVisible,
      dialogTitle,
      detailVisible,
      selectedPlan,
      orderSelectorVisible,
      orderSearchForm,
      availableOrders,
      ordersLoading,
      ordersTotal,
      orderPagination,
      planForm,
      planRules,
      planFormRef,
      handleSearch,
      resetSearch,
      handleSelectionChange,
      handleBatchCommand,
      handleSizeChange,
      handleCurrentChange,
      exportData,
      createPlan,
      editPlan,
      savePlan,
      cancelDialog,
      submitApproval,
      generateDeliveryNote,
      viewPlanDetail,
      deletePlan,
      cancelPlan,
      printPlan,
      showOrderSelector,
      searchOrders,
      selectOrder,
      updateTotalAmount,
      handleOrderSizeChange,
      handleOrderCurrentChange,
      getStatusLabel,
      getStatusTagType,
      getShipMethodLabel,
      getTransportTypeLabel
    };
  }
};
</script>

<style scoped>
.shipping-plan {
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

.plan-items-section {
  margin-top: 30px;
}

.plan-items-section h3 {
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

.plan-detail {
  padding: 10px;
}

.plan-detail h3 {
  margin: 20px 0 10px 0;
  font-size: 16px;
  font-weight: 500;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>