<template>
  <div class="shipping-execution">
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>首页</el-breadcrumb-item>
        <el-breadcrumb-item>发货管理</el-breadcrumb-item>
        <el-breadcrumb-item>发货执行</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="header-actions">
        <h1>发货执行</h1>
        <el-button type="primary" @click="createExecution" size="large">
          <el-icon><Plus /></el-icon>
          新建发货执行
        </el-button>
      </div>
    </div>
    
    <el-card shadow="never">
      <div class="search-section">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="执行单号">
            <el-input
              v-model="searchForm.executionNumber"
              placeholder="请输入执行单号"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="发货计划号">
            <el-input
              v-model="searchForm.planNumber"
              placeholder="请输入发货计划号"
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
          <el-form-item label="执行状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择状态"
              clearable
            >
              <el-option
                v-for="status in executionStatuses"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="执行日期">
            <el-date-picker
              v-model="searchForm.executionDateRange"
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
                <el-dropdown-item command="batchStart">批量开始</el-dropdown-item>
                <el-dropdown-item command="batchComplete">批量完成</el-dropdown-item>
                <el-dropdown-item command="batchCancel">批量取消</el-dropdown-item>
                <el-dropdown-item command="batchDelete">批量删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        
        <el-table
          v-loading="loading"
          :data="executions"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="executionNumber" label="执行单号" width="180" />
          <el-table-column prop="planNumber" label="发货计划号" width="180" />
          <el-table-column prop="orderNumber" label="订单编号" width="180" />
          <el-table-column prop="customerName" label="客户名称" width="180" />
          <el-table-column prop="executionDate" label="执行日期" width="150" />
          <el-table-column prop="executor" label="执行人" width="120" />
          <el-table-column prop="vehicleNumber" label="车牌号" width="120" />
          <el-table-column prop="driverName" label="司机姓名" width="120" />
          <el-table-column prop="totalQuantity" label="发货数量" width="120" />
          <el-table-column prop="totalAmount" label="发货金额" width="120">
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
          <el-table-column label="操作" width="250" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'PLANNED'"
                type="primary"
                size="small"
                @click="editExecution(row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="row.status === 'PLANNED'"
                size="small"
                @click="startExecution(row)"
              >
                开始执行
              </el-button>
              <el-button
                v-if="row.status === 'IN_PROGRESS'"
                size="small"
                @click="completeExecution(row)"
              >
                完成执行
              </el-button>
              <el-button
                v-if="row.status === 'COMPLETED'"
                size="small"
                @click="generateDeliveryNote(row)"
              >
                生成发货单
              </el-button>
              <el-button
                size="small"
                @click="viewExecutionDetail(row)"
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
                      v-if="row.status === 'PLANNED' || row.status === 'IN_PROGRESS'"
                      @click="cancelExecution(row)"
                    >
                      取消
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.status === 'PLANNED'"
                      @click="deleteExecution(row)"
                    >
                      删除
                    </el-dropdown-item>
                    <el-dropdown-item @click="printExecution(row)">
                      打印
                    </el-dropdown-item>
                    <el-dropdown-item @click="addLogistics(row)">
                      录入物流信息
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
    
    <!-- 新建/编辑发货执行对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="90%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form
        ref="executionForm"
        :model="executionForm"
        :rules="executionRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="执行单号" prop="executionNumber">
              <el-input
                v-model="executionForm.executionNumber"
                placeholder="系统自动生成"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发货计划号" prop="planNumber">
              <el-input
                v-model="executionForm.planNumber"
                placeholder="请选择发货计划"
                @focus="showPlanSelector"
                readonly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单编号" prop="orderNumber">
              <el-input
                v-model="executionForm.orderNumber"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customerName">
              <el-input
                v-model="executionForm.customerName"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执行日期" prop="executionDate">
              <el-date-picker
                v-model="executionForm.executionDate"
                type="date"
                placeholder="请选择执行日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执行人" prop="executor">
              <el-input
                v-model="executionForm.executor"
                placeholder="请输入执行人"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车牌号" prop="vehicleNumber">
              <el-input
                v-model="executionForm.vehicleNumber"
                placeholder="请输入车牌号"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="司机姓名" prop="driverName">
              <el-input
                v-model="executionForm.driverName"
                placeholder="请输入司机姓名"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="司机电话" prop="driverPhone">
              <el-input
                v-model="executionForm.driverPhone"
                placeholder="请输入司机电话"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物流公司" prop="logisticsCompany">
              <el-input
                v-model="executionForm.logisticsCompany"
                placeholder="请输入物流公司"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="运输方式" prop="transportType">
              <el-select
                v-model="executionForm.transportType"
                placeholder="请选择运输方式"
              >
                <el-option label="公路运输" value="ROAD" />
                <el-option label="铁路运输" value="RAILWAY" />
                <el-option label="水路运输" value="WATER" />
                <el-option label="航空运输" value="AIR" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发货仓库" prop="warehouseName">
              <el-input
                v-model="executionForm.warehouseName"
                placeholder="请输入发货仓库"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="发货地址" prop="shipToAddress">
              <el-input
                v-model="executionForm.shipToAddress"
                type="textarea"
                rows="2"
                placeholder="请输入详细发货地址"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="执行备注" prop="remark">
              <el-input
                v-model="executionForm.remark"
                type="textarea"
                rows="3"
                placeholder="请输入执行备注"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <div class="execution-items-section">
        <h3>执行明细</h3>
        <el-table
          v-loading="itemsLoading"
          :data="executionForm.items"
          style="width: 100%"
          border
        >
          <el-table-column prop="productCode" label="产品编码" width="150" />
          <el-table-column prop="productName" label="产品名称" min-width="180" />
          <el-table-column prop="productSpec" label="规格型号" width="150" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="planQuantity" label="计划数量" width="120" />
          <el-table-column prop="execQuantity" label="执行数量" width="120">
            <template #default="{ row, $index }">
              <el-input-number
                v-model="executionForm.items[$index].execQuantity"
                :min="1"
                :max="row.planQuantity"
                :step="1"
                @change="updateTotalValues"
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
              ¥ {{ (executionForm.items[$index].execQuantity * row.unitPrice).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="batchNumber" label="批次号" width="150">
            <template #default="{ row, $index }">
              <el-input
                v-model="executionForm.items[$index].batchNumber"
                placeholder="请输入批次号"
              />
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="150">
            <template #default="{ row, $index }">
              <el-input
                v-model="executionForm.items[$index].remark"
                placeholder="请输入备注"
              />
            </template>
          </el-table-column>
        </el-table>
        
        <div class="total-info">
          <div>
            <span>总数量：</span>
            <span class="quantity-value">{{ executionForm.totalQuantity }}</span>
          </div>
          <div>
            <span>总金额：</span>
            <span class="amount-value">¥ {{ executionForm.totalAmount.toFixed(2) }}</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelDialog">取消</el-button>
          <el-button type="primary" @click="saveExecution">保存</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 发货计划选择器 -->
    <el-dialog
      v-model="planSelectorVisible"
      title="选择发货计划"
      width="80%"
      :close-on-click-modal="false"
    >
      <div class="plan-search">
        <el-form :inline="true" :model="planSearchForm" class="search-form">
          <el-form-item label="计划编号">
            <el-input
              v-model="planSearchForm.planNumber"
              placeholder="请输入计划编号"
              clearable
              @keyup.enter="searchPlans"
            />
          </el-form-item>
          <el-form-item label="客户名称">
            <el-input
              v-model="planSearchForm.customerName"
              placeholder="请输入客户名称"
              clearable
              @keyup.enter="searchPlans"
            />
          </el-form-item>
          <el-form-item label="计划状态">
            <el-select
              v-model="planSearchForm.status"
              placeholder="请选择计划状态"
              clearable
            >
              <el-option label="已审批" value="APPROVED" />
              <el-option label="部分执行" value="PARTIALLY_EXECUTED" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="searchPlans" type="primary">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table
        v-loading="plansLoading"
        :data="availablePlans"
        style="width: 100%"
        @row-click="selectPlan"
      >
        <el-table-column prop="planNumber" label="计划编号" width="180" />
        <el-table-column prop="orderNumber" label="订单编号" width="180" />
        <el-table-column prop="customerName" label="客户名称" width="180" />
        <el-table-column prop="planDate" label="计划日期" width="150" />
        <el-table-column prop="totalQuantity" label="计划数量" width="120" />
        <el-table-column prop="executedQuantity" label="已执行数量" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getPlanStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" />
      </el-table>
      
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="planPagination.currentPage"
          v-model:page-size="planPagination.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="plansTotal"
          @size-change="handlePlanSizeChange"
          @current-change="handlePlanCurrentChange"
        />
      </div>
    </el-dialog>
    
    <!-- 物流信息录入对话框 -->
    <el-dialog
      v-model="logisticsVisible"
      title="录入物流信息"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="logisticsForm" label-width="120px">
        <el-form-item label="执行单号">
          <el-input v-model="logisticsForm.executionNumber" disabled />
        </el-form-item>
        <el-form-item label="物流公司" prop="logisticsCompany">
          <el-input
            v-model="logisticsForm.logisticsCompany"
            placeholder="请输入物流公司"
          />
        </el-form-item>
        <el-form-item label="物流单号" prop="trackingNumber">
          <el-input
            v-model="logisticsForm.trackingNumber"
            placeholder="请输入物流单号"
          />
        </el-form-item>
        <el-form-item label="物流公司电话" prop="logisticsPhone">
          <el-input
            v-model="logisticsForm.logisticsPhone"
            placeholder="请输入物流公司电话"
          />
        </el-form-item>
        <el-form-item label="发货时间" prop="shipOutTime">
          <el-date-picker
            v-model="logisticsForm.shipOutTime"
            type="datetime"
            placeholder="请选择发货时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="预计到达时间" prop="estimatedArrivalTime">
          <el-date-picker
            v-model="logisticsForm.estimatedArrivalTime"
            type="datetime"
            placeholder="请选择预计到达时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="物流备注" prop="logisticsRemark">
          <el-input
            v-model="logisticsForm.logisticsRemark"
            type="textarea"
            rows="3"
            placeholder="请输入物流备注"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="logisticsVisible = false">取消</el-button>
          <el-button type="primary" @click="saveLogistics">保存</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="发货执行详情"
      width="80%"
      :close-on-click-modal="false"
    >
      <!-- 详情内容会根据选中的执行动态显示 -->
      <div v-if="selectedExecution" class="execution-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="执行单号">{{ selectedExecution.executionNumber }}</el-descriptions-item>
          <el-descriptions-item label="发货计划号">{{ selectedExecution.planNumber }}</el-descriptions-item>
          <el-descriptions-item label="订单编号">{{ selectedExecution.orderNumber }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ selectedExecution.customerName }}</el-descriptions-item>
          <el-descriptions-item label="执行日期">{{ selectedExecution.executionDate }}</el-descriptions-item>
          <el-descriptions-item label="执行人">{{ selectedExecution.executor }}</el-descriptions-item>
          <el-descriptions-item label="车牌号">{{ selectedExecution.vehicleNumber }}</el-descriptions-item>
          <el-descriptions-item label="司机姓名">{{ selectedExecution.driverName }}</el-descriptions-item>
          <el-descriptions-item label="司机电话">{{ selectedExecution.driverPhone }}</el-descriptions-item>
          <el-descriptions-item label="物流公司">{{ selectedExecution.logisticsCompany || '-' }}</el-descriptions-item>
          <el-descriptions-item label="物流单号">{{ selectedExecution.trackingNumber || '-' }}</el-descriptions-item>
          <el-descriptions-item label="运输方式">{{ getTransportTypeLabel(selectedExecution.transportType) }}</el-descriptions-item>
          <el-descriptions-item label="发货仓库">{{ selectedExecution.warehouseName }}</el-descriptions-item>
          <el-descriptions-item label="发货时间">{{ selectedExecution.shipOutTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="到达时间">{{ selectedExecution.arrivalTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="getStatusTagType(selectedExecution.status)"
            >
              {{ getStatusLabel(selectedExecution.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发货地址" :span="2">{{ selectedExecution.shipToAddress }}</el-descriptions-item>
          <el-descriptions-item label="执行备注" :span="2">{{ selectedExecution.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <h3>执行明细</h3>
        <el-table
          :data="selectedExecution.items"
          style="width: 100%"
          border
        >
          <el-table-column prop="productCode" label="产品编码" width="150" />
          <el-table-column prop="productName" label="产品名称" min-width="180" />
          <el-table-column prop="productSpec" label="规格型号" width="150" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="planQuantity" label="计划数量" width="120" />
          <el-table-column prop="execQuantity" label="执行数量" width="120" />
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
          <el-table-column prop="batchNumber" label="批次号" width="150" />
          <el-table-column prop="remark" label="备注" min-width="150" />
        </el-table>
        
        <div class="total-info">
          <div>
            <span>总数量：</span>
            <span class="quantity-value">{{ selectedExecution.totalQuantity }}</span>
          </div>
          <div>
            <span>总金额：</span>
            <span class="amount-value">¥ {{ selectedExecution.totalAmount.toFixed(2) }}</span>
          </div>
        </div>
        
        <div v-if="selectedExecution.logisticsDetails && selectedExecution.logisticsDetails.length > 0" class="logistics-section">
          <h3>物流跟踪记录</h3>
          <el-timeline>
            <el-timeline-item
              v-for="(log, index) in selectedExecution.logisticsDetails"
              :key="index"
              :timestamp="log.timestamp"
              :type="index === 0 ? 'primary' : 'normal'"
            >
              <div>
                <p><strong>{{ log.status }}</strong></p>
                <p>{{ log.location }}</p>
                <p class="log-content">{{ log.description }}</p>
              </div>
            </el-timeline-item>
          </el-timeline>
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
  Printer,
  Truck
} from '@element-plus/icons-vue';

export default {
  name: 'ShippingExecution',
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
    Printer,
    Truck
  },
  setup() {
    // 状态管理
    const loading = ref(false);
    const itemsLoading = ref(false);
    const executions = ref([]);
    const total = ref(0);
    const selectedRows = ref([]);
    
    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20
    });
    
    // 搜索表单
    const searchForm = reactive({
      executionNumber: '',
      planNumber: '',
      customerName: '',
      status: '',
      executionDateRange: []
    });
    
    // 执行状态选项
    const executionStatuses = [
      { label: '计划中', value: 'PLANNED' },
      { label: '执行中', value: 'IN_PROGRESS' },
      { label: '已完成', value: 'COMPLETED' },
      { label: '已取消', value: 'CANCELLED' }
    ];
    
    // 对话框状态
    const dialogVisible = ref(false);
    const dialogTitle = ref('');
    const detailVisible = ref(false);
    const logisticsVisible = ref(false);
    const selectedExecution = ref(null);
    const currentLogisticsId = ref('');
    
    // 计划选择器
    const planSelectorVisible = ref(false);
    const planSearchForm = reactive({
      planNumber: '',
      customerName: '',
      status: ''
    });
    const availablePlans = ref([]);
    const plansLoading = ref(false);
    const plansTotal = ref(0);
    const planPagination = reactive({
      currentPage: 1,
      pageSize: 10
    });
    
    // 表单数据
    const executionForm = reactive({
      id: '',
      executionNumber: '',
      planNumber: '',
      orderNumber: '',
      customerName: '',
      executionDate: '',
      executor: '',
      vehicleNumber: '',
      driverName: '',
      driverPhone: '',
      logisticsCompany: '',
      trackingNumber: '',
      transportType: 'ROAD',
      warehouseName: '',
      shipToAddress: '',
      status: 'PLANNED',
      totalQuantity: 0,
      totalAmount: 0,
      remark: '',
      shipOutTime: '',
      arrivalTime: '',
      items: []
    });
    
    // 物流信息表单
    const logisticsForm = reactive({
      executionNumber: '',
      logisticsCompany: '',
      trackingNumber: '',
      logisticsPhone: '',
      shipOutTime: '',
      estimatedArrivalTime: '',
      logisticsRemark: ''
    });
    
    // 表单验证规则
    const executionRules = {
      planNumber: [
        { required: true, message: '请选择发货计划', trigger: 'blur' }
      ],
      executionDate: [
        { required: true, message: '请选择执行日期', trigger: 'change' }
      ],
      executor: [
        { required: true, message: '请输入执行人', trigger: 'blur' }
      ],
      vehicleNumber: [
        { required: true, message: '请输入车牌号', trigger: 'blur' }
      ],
      driverName: [
        { required: true, message: '请输入司机姓名', trigger: 'blur' }
      ],
      driverPhone: [
        { required: true, message: '请输入司机电话', trigger: 'blur' }
      ],
      warehouseName: [
        { required: true, message: '请输入发货仓库', trigger: 'blur' }
      ]
    };
    
    // 方法
    const getExecutions = async () => {
      loading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 模拟数据
        const mockData = {
          total: 52,
          data: Array.from({ length: 20 }, (_, index) => ({
            id: index + 1,
            executionNumber: `SE${2024}${String(index + 1).padStart(4, '0')}`,
            planNumber: `SP${2024}${String(index + 30).padStart(4, '0')}`,
            orderNumber: `SO${2024}${String(index + 80).padStart(4, '0')}`,
            customerName: `客户${String(index + 1).padStart(3, '0')}`,
            executionDate: `2024-0${Math.floor(index / 5) + 1}-${String(index % 28 + 1).padStart(2, '0')}`,
            executor: `执行人${index % 5 + 1}`,
            vehicleNumber: `沪A${String(index + 100).padStart(5, '0')}`,
            driverName: `司机${index % 8 + 1}`,
            driverPhone: `1390013900${index}`,
            logisticsCompany: index % 3 === 0 ? `物流公司${index % 4 + 1}` : '',
            trackingNumber: index % 3 === 0 ? `LP${index + 1000}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}` : '',
            transportType: ['ROAD', 'RAILWAY', 'WATER', 'AIR'][index % 4],
            warehouseName: `仓库${index % 3 + 1}`,
            shipToAddress: `上海市浦东新区张江高科技园区${index + 100}号`,
            status: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'][index % 4],
            totalQuantity: Math.floor(Math.random() * 500) + 100,
            totalAmount: Math.random() * 20000 + 5000,
            remark: `执行备注${index + 1}`,
            shipOutTime: index % 2 === 0 ? `2024-0${Math.floor(index / 5) + 1}-${String(index % 28 + 2).padStart(2, '0')} ${String(index % 24).padStart(2, '0')}:00:00` : '',
            arrivalTime: index % 3 === 0 ? `2024-0${Math.floor(index / 5) + 1}-${String(index % 28 + 4).padStart(2, '0')} ${String(index % 24).padStart(2, '0')}:00:00` : '',
            items: Array.from({ length: 2 }, (_, itemIndex) => ({
              productCode: `PROD${String(itemIndex + 200).padStart(4, '0')}`,
              productName: `产品${itemIndex + 200}`,
              productSpec: `规格${itemIndex + 1}`,
              unit: ['个', '件', '箱'][itemIndex % 3],
              planQuantity: Math.floor(Math.random() * 300) + 50,
              execQuantity: Math.floor(Math.random() * 300) + 50,
              unitPrice: Math.random() * 1500 + 300,
              amount: Math.random() * 15000 + 2000,
              batchNumber: `BATCH${index + 1}${itemIndex}`,
              remark: `明细备注${itemIndex + 1}`
            })),
            logisticsDetails: index % 3 === 0 ? [
              {
                timestamp: `2024-0${Math.floor(index / 5) + 1}-${String(index % 28 + 4).padStart(2, '0')} ${String(index % 24).padStart(2, '0')}:00:00`,
                status: '已签收',
                location: '目的地',
                description: '货物已由客户签收'
              },
              {
                timestamp: `2024-0${Math.floor(index / 5) + 1}-${String(index % 28 + 3).padStart(2, '0')} ${String((index + 2) % 24).padStart(2, '0')}:00:00`,
                status: '运输中',
                location: '中转中心',
                description: '包裹正在运输途中'
              },
              {
                timestamp: `2024-0${Math.floor(index / 5) + 1}-${String(index % 28 + 2).padStart(2, '0')} ${String((index + 5) % 24).padStart(2, '0')}:00:00`,
                status: '已发货',
                location: '发货仓库',
                description: '货物已发出'
              }
            ] : []
          }))
        };
        
        executions.value = mockData.data;
        total.value = mockData.total;
      } catch (error) {
        ElMessage.error('获取发货执行列表失败');
        console.error('获取发货执行列表失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const handleSearch = () => {
      pagination.currentPage = 1;
      getExecutions();
    };
    
    const resetSearch = () => {
      Object.assign(searchForm, {
        executionNumber: '',
        planNumber: '',
        customerName: '',
        status: '',
        executionDateRange: []
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
        case 'batchStart':
          batchStart();
          break;
        case 'batchComplete':
          batchComplete();
          break;
        case 'batchCancel':
          batchCancel();
          break;
        case 'batchDelete':
          batchDelete();
          break;
      }
    };
    
    const batchStart = async () => {
      ElMessageBox.confirm(
        `确定要开始选中的 ${selectedRows.value.length} 条发货执行吗？`,
        '确认开始',
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
          ElMessage.success('批量开始成功');
          getExecutions();
        } catch (error) {
          ElMessage.error('批量开始失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const batchComplete = async () => {
      ElMessageBox.confirm(
        `确定要完成选中的 ${selectedRows.value.length} 条发货执行吗？`,
        '确认完成',
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
          ElMessage.success('批量完成成功');
          getExecutions();
        } catch (error) {
          ElMessage.error('批量完成失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const batchCancel = async () => {
      ElMessageBox.confirm(
        `确定要取消选中的 ${selectedRows.value.length} 条发货执行吗？`,
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
          getExecutions();
        } catch (error) {
          ElMessage.error('批量取消失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const batchDelete = async () => {
      ElMessageBox.confirm(
        `确定要删除选中的 ${selectedRows.value.length} 条发货执行吗？`,
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
          getExecutions();
        } catch (error) {
          ElMessage.error('批量删除失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
      getExecutions();
    };
    
    const handleCurrentChange = (current) => {
      pagination.currentPage = current;
      getExecutions();
    };
    
    const exportData = () => {
      ElMessage.info('导出功能开发中');
    };
    
    const createExecution = () => {
      dialogTitle.value = '新建发货执行';
      resetExecutionForm();
      executionForm.executionNumber = `SE${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      executionForm.executionDate = new Date().toISOString().split('T')[0];
      dialogVisible.value = true;
    };
    
    const editExecution = (row) => {
      dialogTitle.value = '编辑发货执行';
      // 深拷贝行数据到表单
      Object.assign(executionForm, JSON.parse(JSON.stringify(row)));
      dialogVisible.value = true;
    };
    
    const saveExecution = async () => {
      // 验证表单
      if (!executionForm.planNumber) {
        ElMessage.warning('请先选择发货计划');
        return;
      }
      
      if (!executionForm.executionDate) {
        ElMessage.warning('请选择执行日期');
        return;
      }
      
      if (!executionForm.executor) {
        ElMessage.warning('请输入执行人');
        return;
      }
      
      if (!executionForm.vehicleNumber) {
        ElMessage.warning('请输入车牌号');
        return;
      }
      
      if (!executionForm.driverName) {
        ElMessage.warning('请输入司机姓名');
        return;
      }
      
      if (!executionForm.driverPhone) {
        ElMessage.warning('请输入司机电话');
        return;
      }
      
      if (!executionForm.warehouseName) {
        ElMessage.warning('请输入发货仓库');
        return;
      }
      
      loading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        ElMessage.success('保存成功');
        dialogVisible.value = false;
        getExecutions();
      } catch (error) {
        ElMessage.error('保存失败');
      } finally {
        loading.value = false;
      }
    };
    
    const cancelDialog = () => {
      dialogVisible.value = false;
      planSelectorVisible.value = false;
    };
    
    const resetExecutionForm = () => {
      Object.assign(executionForm, {
        id: '',
        executionNumber: '',
        planNumber: '',
        orderNumber: '',
        customerName: '',
        executionDate: new Date().toISOString().split('T')[0],
        executor: '',
        vehicleNumber: '',
        driverName: '',
        driverPhone: '',
        logisticsCompany: '',
        trackingNumber: '',
        transportType: 'ROAD',
        warehouseName: '',
        shipToAddress: '',
        status: 'PLANNED',
        totalQuantity: 0,
        totalAmount: 0,
        remark: '',
        shipOutTime: '',
        arrivalTime: '',
        items: []
      });
    };
    
    const startExecution = async (row) => {
      ElMessageBox.confirm(
        `确定要开始执行发货单 ${row.executionNumber} 吗？`,
        '确认开始',
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
          ElMessage.success('开始执行成功');
          getExecutions();
        } catch (error) {
          ElMessage.error('开始执行失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const completeExecution = async (row) => {
      ElMessageBox.confirm(
        `确定要完成执行发货单 ${row.executionNumber} 吗？`,
        '确认完成',
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
          ElMessage.success('完成执行成功');
          getExecutions();
        } catch (error) {
          ElMessage.error('完成执行失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const cancelExecution = async (row) => {
      ElMessageBox.prompt(
        `请输入取消理由`,
        `取消发货执行 ${row.executionNumber}`,
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputType: 'textarea'
        }
      ).then(async ({ value }) => {
        if (!value) {
          ElMessage.warning('请输入取消理由');
          return;
        }
        
        loading.value = true;
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 500));
          ElMessage.success('取消成功');
          getExecutions();
        } catch (error) {
          ElMessage.error('取消失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const deleteExecution = async (row) => {
      ElMessageBox.confirm(
        `确定要删除发货执行 ${row.executionNumber} 吗？`,
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
          getExecutions();
        } catch (error) {
          ElMessage.error('删除失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const generateDeliveryNote = async (row) => {
      ElMessageBox.confirm(
        `确定要根据发货执行 ${row.executionNumber} 生成发货单吗？`,
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
          ElMessage.success('发货单生成成功');
          getExecutions();
        } catch (error) {
          ElMessage.error('发货单生成失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const viewExecutionDetail = (row) => {
      selectedExecution.value = JSON.parse(JSON.stringify(row));
      detailVisible.value = true;
    };
    
    const printExecution = (row) => {
      ElMessage.info('打印功能开发中');
    };
    
    const addLogistics = (row) => {
      currentLogisticsId.value = row.id;
      logisticsForm.executionNumber = row.executionNumber;
      logisticsForm.logisticsCompany = row.logisticsCompany || '';
      logisticsForm.trackingNumber = row.trackingNumber || '';
      logisticsForm.shipOutTime = row.shipOutTime || '';
      logisticsVisible.value = true;
    };
    
    const saveLogistics = async () => {
      if (!logisticsForm.logisticsCompany) {
        ElMessage.warning('请输入物流公司');
        return;
      }
      
      if (!logisticsForm.trackingNumber) {
        ElMessage.warning('请输入物流单号');
        return;
      }
      
      if (!logisticsForm.shipOutTime) {
        ElMessage.warning('请选择发货时间');
        return;
      }
      
      loading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        ElMessage.success('物流信息保存成功');
        logisticsVisible.value = false;
        getExecutions();
      } catch (error) {
        ElMessage.error('物流信息保存失败');
      } finally {
        loading.value = false;
      }
    };
    
    const showPlanSelector = () => {
      searchPlans();
      planSelectorVisible.value = true;
    };
    
    const searchPlans = async () => {
      plansLoading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 模拟数据
        const mockPlans = {
          total: 42,
          data: Array.from({ length: 10 }, (_, index) => ({
            id: index + 1,
            planNumber: `SP${2024}${String(index + 100).padStart(4, '0')}`,
            orderNumber: `SO${2024}${String(index + 200).padStart(4, '0')}`,
            customerName: `客户${String(index + 50).padStart(3, '0')}`,
            planDate: `2024-0${Math.floor(index / 2) + 1}-${String(index % 28 + 1).padStart(2, '0')}`,
            totalQuantity: Math.floor(Math.random() * 500) + 100,
            executedQuantity: Math.floor(Math.random() * 300) + 50,
            status: ['APPROVED', 'PARTIALLY_EXECUTED'][index % 2],
            remark: `计划备注${index + 1}`
          }))
        };
        
        availablePlans.value = mockPlans.data;
        plansTotal.value = mockPlans.total;
      } catch (error) {
        ElMessage.error('获取发货计划列表失败');
      } finally {
        plansLoading.value = false;
      }
    };
    
    const selectPlan = async (plan) => {
      itemsLoading.value = true;
      try {
        // 模拟获取计划详情和明细
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 模拟计划详情
        const planDetail = {
          ...plan,
          shipToAddress: `上海市静安区南京西路${plan.id * 20}号`,
          orderNumber: `SO${2024}${String(plan.id + 300).padStart(4, '0')}`,
          items: Array.from({ length: 3 }, (_, itemIndex) => ({
            productCode: `PROD${String(itemIndex + 300).padStart(4, '0')}`,
            productName: `产品${itemIndex + 300}`,
            productSpec: `规格${itemIndex + 1}`,
            unit: ['个', '件', '箱'][itemIndex % 3],
            planQuantity: Math.floor(Math.random() * 300) + 50,
            execQuantity: Math.floor(Math.random() * 300) + 50,
            unitPrice: Math.random() * 1500 + 300,
            amount: 0,
            batchNumber: '',
            remark: ''
          }))
        };
        
        // 填充表单
        executionForm.planNumber = planDetail.planNumber;
        executionForm.orderNumber = planDetail.orderNumber;
        executionForm.customerName = planDetail.customerName;
        executionForm.shipToAddress = planDetail.shipToAddress;
        executionForm.items = planDetail.items;
        
        updateTotalValues();
        planSelectorVisible.value = false;
      } catch (error) {
        ElMessage.error('获取计划详情失败');
      } finally {
        itemsLoading.value = false;
      }
    };
    
    const updateTotalValues = () => {
      let totalQuantity = 0;
      let totalAmount = 0;
      executionForm.items.forEach(item => {
        item.amount = item.execQuantity * item.unitPrice;
        totalQuantity += item.execQuantity;
        totalAmount += item.amount;
      });
      executionForm.totalQuantity = totalQuantity;
      executionForm.totalAmount = totalAmount;
    };
    
    const handlePlanSizeChange = (size) => {
      planPagination.pageSize = size;
      searchPlans();
    };
    
    const handlePlanCurrentChange = (current) => {
      planPagination.currentPage = current;
      searchPlans();
    };
    
    const getStatusLabel = (status) => {
      const statusMap = executionStatuses.reduce((map, item) => {
        map[item.value] = item.label;
        return map;
      }, {});
      return statusMap[status] || status;
    };
    
    const getStatusTagType = (status) => {
      const typeMap = {
        PLANNED: 'info',
        IN_PROGRESS: 'warning',
        COMPLETED: 'success',
        CANCELLED: 'danger'
      };
      return typeMap[status] || 'info';
    };
    
    const getTransportTypeLabel = (type) => {
      const typeMap = {
        ROAD: '公路运输',
        RAILWAY: '铁路运输',
        WATER: '水路运输',
        AIR: '航空运输'
      };
      return typeMap[type] || type;
    };
    
    const getPlanStatusLabel = (status) => {
      const statusMap = {
        APPROVED: '已审批',
        PARTIALLY_EXECUTED: '部分执行'
      };
      return statusMap[status] || status;
    };
    
    // 初始化
    onMounted(() => {
      getExecutions();
    });
    
    return {
      loading,
      itemsLoading,
      executions,
      total,
      selectedRows,
      pagination,
      searchForm,
      executionStatuses,
      dialogVisible,
      dialogTitle,
      detailVisible,
      logisticsVisible,
      selectedExecution,
      planSelectorVisible,
      planSearchForm,
      availablePlans,
      plansLoading,
      plansTotal,
      planPagination,
      executionForm,
      logisticsForm,
      executionRules,
      handleSearch,
      resetSearch,
      handleSelectionChange,
      handleBatchCommand,
      handleSizeChange,
      handleCurrentChange,
      exportData,
      createExecution,
      editExecution,
      saveExecution,
      cancelDialog,
      startExecution,
      completeExecution,
      cancelExecution,
      deleteExecution,
      generateDeliveryNote,
      viewExecutionDetail,
      printExecution,
      addLogistics,
      saveLogistics,
      showPlanSelector,
      searchPlans,
      selectPlan,
      updateTotalValues,
      handlePlanSizeChange,
      handlePlanCurrentChange,
      getStatusLabel,
      getStatusTagType,
      getTransportTypeLabel,
      getPlanStatusLabel
    };
  }
};
</script>

<style scoped>
.shipping-execution {
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

.execution-items-section {
  margin-top: 30px;
}

.execution-items-section h3 {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 500;
}

.total-info {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
  gap: 40px;
  font-size: 16px;
}

.quantity-value {
  font-size: 18px;
  font-weight: 600;
  color: #67c23a;
}

.amount-value {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}

.execution-detail {
  padding: 10px;
}

.execution-detail h3 {
  margin: 20px 0 10px 0;
  font-size: 16px;
  font-weight: 500;
}

.logistics-section {
  margin-top: 30px;
}

.logistics-section h3 {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 500;
}

.log-content {
  margin-top: 5px;
  color: #606266;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>