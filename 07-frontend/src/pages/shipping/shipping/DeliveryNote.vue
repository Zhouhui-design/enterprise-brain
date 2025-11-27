<template>
  <div class="delivery-note">
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>首页</el-breadcrumb-item>
        <el-breadcrumb-item>发货管理</el-breadcrumb-item>
        <el-breadcrumb-item>发货单</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="header-actions">
        <h1>发货单</h1>
        <el-button type="primary" @click="createNote" size="large">
          <el-icon><Plus /></el-icon>
          新建发货单
        </el-button>
      </div>
    </div>
    
    <el-card shadow="never">
      <div class="search-section">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="发货单号">
            <el-input
              v-model="searchForm.noteNumber"
              placeholder="请输入发货单号"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="执行单号">
            <el-input
              v-model="searchForm.executionNumber"
              placeholder="请输入执行单号"
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
          <el-form-item label="客户名称">
            <el-input
              v-model="searchForm.customerName"
              placeholder="请输入客户名称"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="发货状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择发货状态"
              clearable
            >
              <el-option
                v-for="status in noteStatuses"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="发货日期">
            <el-date-picker
              v-model="searchForm.deliveryDateRange"
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
                <el-dropdown-item command="batchPrint">批量打印</el-dropdown-item>
                <el-dropdown-item command="batchDeliver">批量发货</el-dropdown-item>
                <el-dropdown-item command="batchComplete">批量完成</el-dropdown-item>
                <el-dropdown-item command="batchCancel">批量取消</el-dropdown-item>
                <el-dropdown-item command="batchDelete">批量删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        
        <el-table
          v-loading="loading"
          :data="deliveryNotes"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="noteNumber" label="发货单号" width="180" />
          <el-table-column prop="executionNumber" label="执行单号" width="180" />
          <el-table-column prop="orderNumber" label="订单编号" width="180" />
          <el-table-column prop="customerName" label="客户名称" width="180" />
          <el-table-column prop="deliveryDate" label="发货日期" width="150" />
          <el-table-column prop="logisticsCompany" label="物流公司" width="150" />
          <el-table-column prop="trackingNumber" label="物流单号" width="200" />
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
                size="small"
                @click="viewNoteDetail(row)"
              >
                查看详情
              </el-button>
              <el-button
                v-if="row.status === 'DRAFT' || row.status === 'PLANNED'"
                size="small"
                @click="editNote(row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="row.status === 'PLANNED'"
                size="small"
                @click="deliverGoods(row)"
              >
                发货
              </el-button>
              <el-dropdown trigger="click">
                <el-button size="small">
                  更多
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="printNote(row)">
                      打印
                    </el-dropdown-item>
                    <el-dropdown-item @click="generateInvoice(row)">
                      生成发票
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.status === 'PLANNED' || row.status === 'DELIVERED'"
                      @click="cancelNote(row)"
                    >
                      取消
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.status === 'DRAFT'"
                      @click="deleteNote(row)"
                    >
                      删除
                    </el-dropdown-item>
                    <el-dropdown-item @click="updateLogistics(row)">
                      更新物流
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
    
    <!-- 新建/编辑发货单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="90%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form
        ref="noteForm"
        :model="noteForm"
        :rules="noteRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发货单号" prop="noteNumber">
              <el-input
                v-model="noteForm.noteNumber"
                placeholder="系统自动生成"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执行单号" prop="executionNumber">
              <el-input
                v-model="noteForm.executionNumber"
                placeholder="请选择发货执行"
                @focus="showExecutionSelector"
                readonly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单编号" prop="orderNumber">
              <el-input
                v-model="noteForm.orderNumber"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customerName">
              <el-input
                v-model="noteForm.customerName"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发货日期" prop="deliveryDate">
              <el-date-picker
                v-model="noteForm.deliveryDate"
                type="date"
                placeholder="请选择发货日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发货人" prop="deliverer">
              <el-input
                v-model="noteForm.deliverer"
                placeholder="请输入发货人"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="收货人" prop="consignee">
              <el-input
                v-model="noteForm.consignee"
                placeholder="请输入收货人"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="收货人电话" prop="consigneePhone">
              <el-input
                v-model="noteForm.consigneePhone"
                placeholder="请输入收货人电话"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物流公司" prop="logisticsCompany">
              <el-input
                v-model="noteForm.logisticsCompany"
                placeholder="请输入物流公司"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物流单号" prop="trackingNumber">
              <el-input
                v-model="noteForm.trackingNumber"
                placeholder="请输入物流单号"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="运输方式" prop="transportType">
              <el-select
                v-model="noteForm.transportType"
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
                v-model="noteForm.warehouseName"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="发货地址" prop="shipToAddress">
              <el-input
                v-model="noteForm.shipToAddress"
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
                v-model="noteForm.remark"
                type="textarea"
                rows="3"
                placeholder="请输入备注"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <div class="note-items-section">
        <h3>发货明细</h3>
        <el-table
          v-loading="itemsLoading"
          :data="noteForm.items"
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
                v-model="noteForm.items[$index].quantity"
                :min="1"
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
              ¥ {{ (noteForm.items[$index].quantity * row.unitPrice).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="batchNumber" label="批次号" width="150">
            <template #default="{ row, $index }">
              <el-input
                v-model="noteForm.items[$index].batchNumber"
                placeholder="请输入批次号"
              />
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="150">
            <template #default="{ row, $index }">
              <el-input
                v-model="noteForm.items[$index].remark"
                placeholder="请输入备注"
              />
            </template>
          </el-table-column>
        </el-table>
        
        <div class="total-info">
          <div>
            <span>总数量：</span>
            <span class="quantity-value">{{ noteForm.totalQuantity }}</span>
          </div>
          <div>
            <span>总金额：</span>
            <span class="amount-value">¥ {{ noteForm.totalAmount.toFixed(2) }}</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelDialog">取消</el-button>
          <el-button type="primary" @click="saveNote">保存</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 发货执行选择器 -->
    <el-dialog
      v-model="executionSelectorVisible"
      title="选择发货执行"
      width="80%"
      :close-on-click-modal="false"
    >
      <div class="execution-search">
        <el-form :inline="true" :model="executionSearchForm" class="search-form">
          <el-form-item label="执行单号">
            <el-input
              v-model="executionSearchForm.executionNumber"
              placeholder="请输入执行单号"
              clearable
              @keyup.enter="searchExecutions"
            />
          </el-form-item>
          <el-form-item label="客户名称">
            <el-input
              v-model="executionSearchForm.customerName"
              placeholder="请输入客户名称"
              clearable
              @keyup.enter="searchExecutions"
            />
          </el-form-item>
          <el-form-item label="执行状态">
            <el-select
              v-model="executionSearchForm.status"
              placeholder="请选择执行状态"
              clearable
            >
              <el-option label="执行中" value="IN_PROGRESS" />
              <el-option label="已完成" value="COMPLETED" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="searchExecutions" type="primary">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table
        v-loading="executionsLoading"
        :data="availableExecutions"
        style="width: 100%"
        @row-click="selectExecution"
      >
        <el-table-column prop="executionNumber" label="执行单号" width="180" />
        <el-table-column prop="planNumber" label="计划编号" width="180" />
        <el-table-column prop="orderNumber" label="订单编号" width="180" />
        <el-table-column prop="customerName" label="客户名称" width="180" />
        <el-table-column prop="executionDate" label="执行日期" width="150" />
        <el-table-column prop="totalQuantity" label="执行数量" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getExecutionStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" />
      </el-table>
      
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="executionPagination.currentPage"
          v-model:page-size="executionPagination.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="executionsTotal"
          @size-change="handleExecutionSizeChange"
          @current-change="handleExecutionCurrentChange"
        />
      </div>
    </el-dialog>
    
    <!-- 物流信息更新对话框 -->
    <el-dialog
      v-model="logisticsVisible"
      title="更新物流信息"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="logisticsForm" label-width="120px">
        <el-form-item label="发货单号">
          <el-input v-model="logisticsForm.noteNumber" disabled />
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
        <el-form-item label="实际发货时间" prop="actualShipTime">
          <el-date-picker
            v-model="logisticsForm.actualShipTime"
            type="datetime"
            placeholder="请选择实际发货时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="实际到达时间" prop="actualArrivalTime">
          <el-date-picker
            v-model="logisticsForm.actualArrivalTime"
            type="datetime"
            placeholder="请选择实际到达时间"
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
      title="发货单详情"
      width="80%"
      :close-on-click-modal="false"
    >
      <!-- 详情内容会根据选中的发货单动态显示 -->
      <div v-if="selectedNote" class="note-detail">
        <div class="note-header">
          <div class="note-number">
            <h2>发货单：{{ selectedNote.noteNumber }}</h2>
            <el-tag
              :type="getStatusTagType(selectedNote.status)"
              size="large"
              style="margin-left: 20px"
            >
              {{ getStatusLabel(selectedNote.status) }}
            </el-tag>
          </div>
        </div>
        
        <div class="note-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="执行单号">{{ selectedNote.executionNumber }}</el-descriptions-item>
            <el-descriptions-item label="订单编号">{{ selectedNote.orderNumber }}</el-descriptions-item>
            <el-descriptions-item label="客户名称">{{ selectedNote.customerName }}</el-descriptions-item>
            <el-descriptions-item label="发货日期">{{ selectedNote.deliveryDate }}</el-descriptions-item>
            <el-descriptions-item label="发货人">{{ selectedNote.deliverer }}</el-descriptions-item>
            <el-descriptions-item label="收货人">{{ selectedNote.consignee }}</el-descriptions-item>
            <el-descriptions-item label="收货人电话">{{ selectedNote.consigneePhone }}</el-descriptions-item>
            <el-descriptions-item label="物流公司">{{ selectedNote.logisticsCompany || '-' }}</el-descriptions-item>
            <el-descriptions-item label="物流单号">{{ selectedNote.trackingNumber || '-' }}</el-descriptions-item>
            <el-descriptions-item label="运输方式">{{ getTransportTypeLabel(selectedNote.transportType) }}</el-descriptions-item>
            <el-descriptions-item label="发货仓库">{{ selectedNote.warehouseName }}</el-descriptions-item>
            <el-descriptions-item label="实际发货时间">{{ selectedNote.actualShipTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="实际到达时间">{{ selectedNote.actualArrivalTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ selectedNote.createdAt }}</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ selectedNote.createdBy }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ selectedNote.updatedAt }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="note-address">
          <h3>发货地址</h3>
          <div class="address-content">{{ selectedNote.shipToAddress }}</div>
        </div>
        
        <div class="note-items">
          <h3>发货明细</h3>
          <el-table
            :data="selectedNote.items"
            style="width: 100%"
            border
          >
            <el-table-column type="index" label="序号" width="80" />
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
            <el-table-column prop="batchNumber" label="批次号" width="150" />
            <el-table-column prop="remark" label="备注" min-width="150" />
          </el-table>
          
          <div class="total-info">
            <div class="total-item">
              <span>商品数量：</span>
              <span class="value">{{ selectedNote.totalQuantity }}</span>
            </div>
            <div class="total-item">
              <span>商品总额：</span>
              <span class="value">¥ {{ selectedNote.totalAmount.toFixed(2) }}</span>
            </div>
          </div>
        </div>
        
        <div class="note-footer">
          <div class="note-remark">
            <h3>备注</h3>
            <div class="remark-content">{{ selectedNote.remark || '-' }}</div>
          </div>
        </div>
        
        <div v-if="selectedNote.logisticsDetails && selectedNote.logisticsDetails.length > 0" class="logistics-section">
          <h3>物流跟踪记录</h3>
          <el-timeline>
            <el-timeline-item
              v-for="(log, index) in selectedNote.logisticsDetails"
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
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button @click="printNote(selectedNote)">打印发货单</el-button>
          <el-button type="primary" @click="updateLogistics(selectedNote)">更新物流信息</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
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
  Truck,
  FileText
} from '@element-plus/icons-vue';

export default {
  name: 'DeliveryNote',
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
    Truck,
    FileText
  },
  setup() {
    // 状态管理
    const loading = ref(false);
    const itemsLoading = ref(false);
    const deliveryNotes = ref([]);
    const total = ref(0);
    const selectedRows = ref([]);
    
    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20
    });
    
    // 搜索表单
    const searchForm = reactive({
      noteNumber: '',
      executionNumber: '',
      orderNumber: '',
      customerName: '',
      status: '',
      deliveryDateRange: []
    });
    
    // 发货单状态选项
    const noteStatuses = [
      { label: '草稿', value: 'DRAFT' },
      { label: '待发货', value: 'PLANNED' },
      { label: '已发货', value: 'DELIVERED' },
      { label: '已完成', value: 'COMPLETED' },
      { label: '已取消', value: 'CANCELLED' }
    ];
    
    // 对话框状态
    const dialogVisible = ref(false);
    const dialogTitle = ref('');
    const detailVisible = ref(false);
    const logisticsVisible = ref(false);
    const selectedNote = ref(null);
    
    // 发货执行选择器
    const executionSelectorVisible = ref(false);
    const executionSearchForm = reactive({
      executionNumber: '',
      customerName: '',
      status: ''
    });
    const availableExecutions = ref([]);
    const executionsLoading = ref(false);
    const executionsTotal = ref(0);
    const executionPagination = reactive({
      currentPage: 1,
      pageSize: 10
    });
    
    // 表单数据
    const noteForm = reactive({
      id: '',
      noteNumber: '',
      executionNumber: '',
      orderNumber: '',
      customerName: '',
      deliveryDate: '',
      deliverer: '',
      consignee: '',
      consigneePhone: '',
      logisticsCompany: '',
      trackingNumber: '',
      transportType: 'ROAD',
      warehouseName: '',
      shipToAddress: '',
      status: 'DRAFT',
      totalQuantity: 0,
      totalAmount: 0,
      remark: '',
      actualShipTime: '',
      actualArrivalTime: '',
      items: []
    });
    
    // 物流信息表单
    const logisticsForm = reactive({
      noteNumber: '',
      logisticsCompany: '',
      trackingNumber: '',
      logisticsPhone: '',
      actualShipTime: '',
      actualArrivalTime: '',
      logisticsRemark: ''
    });
    
    // 表单验证规则
    const noteRules = {
      executionNumber: [
        { required: true, message: '请选择发货执行', trigger: 'blur' }
      ],
      deliveryDate: [
        { required: true, message: '请选择发货日期', trigger: 'change' }
      ],
      deliverer: [
        { required: true, message: '请输入发货人', trigger: 'blur' }
      ],
      consignee: [
        { required: true, message: '请输入收货人', trigger: 'blur' }
      ],
      consigneePhone: [
        { required: true, message: '请输入收货人电话', trigger: 'blur' }
      ],
      logisticsCompany: [
        { required: true, message: '请输入物流公司', trigger: 'blur' }
      ],
      trackingNumber: [
        { required: true, message: '请输入物流单号', trigger: 'blur' }
      ]
    };
    
    // 方法
    const getDeliveryNotes = async () => {
      loading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 模拟数据
        const mockData = {
          total: 65,
          data: Array.from({ length: 20 }, (_, index) => ({
            id: index + 1,
            noteNumber: `DN${2024}${String(index + 1).padStart(5, '0')}`,
            executionNumber: `SE${2024}${String(index + 30).padStart(4, '0')}`,
            orderNumber: `SO${2024}${String(index + 80).padStart(4, '0')}`,
            customerName: `客户${String(index + 1).padStart(3, '0')}`,
            deliveryDate: `2024-0${Math.floor(index / 5) + 1}-${String(index % 28 + 1).padStart(2, '0')}`,
            deliverer: `发货人${index % 5 + 1}`,
            consignee: `收货人${index % 8 + 1}`,
            consigneePhone: `1390013900${index}`,
            logisticsCompany: `物流公司${index % 4 + 1}`,
            trackingNumber: `LP${index + 1000}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            transportType: ['ROAD', 'RAILWAY', 'WATER', 'AIR'][index % 4],
            warehouseName: `仓库${index % 3 + 1}`,
            shipToAddress: `上海市浦东新区张江高科技园区${index + 100}号`,
            status: ['DRAFT', 'PLANNED', 'DELIVERED', 'COMPLETED', 'CANCELLED'][index % 5],
            totalQuantity: Math.floor(Math.random() * 500) + 100,
            totalAmount: Math.random() * 20000 + 5000,
            remark: `发货备注${index + 1}`,
            actualShipTime: index % 3 !== 0 ? `2024-0${Math.floor(index / 5) + 1}-${String(index % 28 + 2).padStart(2, '0')} ${String(index % 24).padStart(2, '0')}:00:00` : '',
            actualArrivalTime: index % 3 === 2 ? `2024-0${Math.floor(index / 5) + 1}-${String(index % 28 + 4).padStart(2, '0')} ${String(index % 24).padStart(2, '0')}:00:00` : '',
            createdAt: `2024-0${Math.floor(index / 5) + 1}-${String(index % 28).padStart(2, '0')} 10:30:00`,
            createdBy: `用户${index % 3 + 1}`,
            updatedAt: `2024-0${Math.floor(index / 5) + 1}-${String(index % 28 + 1).padStart(2, '0')} 14:20:00`,
            items: Array.from({ length: 2 }, (_, itemIndex) => ({
              productCode: `PROD${String(itemIndex + 200).padStart(4, '0')}`,
              productName: `产品${itemIndex + 200}`,
              productSpec: `规格${itemIndex + 1}`,
              unit: ['个', '件', '箱'][itemIndex % 3],
              quantity: Math.floor(Math.random() * 300) + 50,
              unitPrice: Math.random() * 1500 + 300,
              amount: Math.random() * 15000 + 2000,
              batchNumber: `BATCH${index + 1}${itemIndex}`,
              remark: `明细备注${itemIndex + 1}`
            })),
            logisticsDetails: index % 3 !== 0 ? [
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
        
        deliveryNotes.value = mockData.data;
        total.value = mockData.total;
      } catch (error) {
        ElMessage.error('获取发货单列表失败');
        console.error('获取发货单列表失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const handleSearch = () => {
      pagination.currentPage = 1;
      getDeliveryNotes();
    };
    
    const resetSearch = () => {
      Object.assign(searchForm, {
        noteNumber: '',
        executionNumber: '',
        orderNumber: '',
        customerName: '',
        status: '',
        deliveryDateRange: []
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
        case 'batchPrint':
          batchPrint();
          break;
        case 'batchDeliver':
          batchDeliver();
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
    
    const batchPrint = () => {
      ElMessage.info(`即将打印 ${selectedRows.value.length} 份发货单`);
    };
    
    const batchDeliver = async () => {
      ElMessageBox.confirm(
        `确定要发货选中的 ${selectedRows.value.length} 份发货单吗？`,
        '确认发货',
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
          ElMessage.success('批量发货成功');
          getDeliveryNotes();
        } catch (error) {
          ElMessage.error('批量发货失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const batchComplete = async () => {
      ElMessageBox.confirm(
        `确定要完成选中的 ${selectedRows.value.length} 份发货单吗？`,
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
          getDeliveryNotes();
        } catch (error) {
          ElMessage.error('批量完成失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const batchCancel = async () => {
      ElMessageBox.confirm(
        `确定要取消选中的 ${selectedRows.value.length} 份发货单吗？`,
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
          getDeliveryNotes();
        } catch (error) {
          ElMessage.error('批量取消失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const batchDelete = async () => {
      ElMessageBox.confirm(
        `确定要删除选中的 ${selectedRows.value.length} 份发货单吗？`,
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
          getDeliveryNotes();
        } catch (error) {
          ElMessage.error('批量删除失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
      getDeliveryNotes();
    };
    
    const handleCurrentChange = (current) => {
      pagination.currentPage = current;
      getDeliveryNotes();
    };
    
    const exportData = () => {
      ElMessage.info('导出功能开发中');
    };
    
    const createNote = () => {
      dialogTitle.value = '新建发货单';
      resetNoteForm();
      noteForm.noteNumber = `DN${new Date().getFullYear()}${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
      noteForm.deliveryDate = new Date().toISOString().split('T')[0];
      dialogVisible.value = true;
    };
    
    const editNote = (row) => {
      dialogTitle.value = '编辑发货单';
      // 深拷贝行数据到表单
      Object.assign(noteForm, JSON.parse(JSON.stringify(row)));
      dialogVisible.value = true;
    };
    
    const saveNote = async () => {
      // 验证表单
      if (!noteForm.executionNumber) {
        ElMessage.warning('请先选择发货执行');
        return;
      }
      
      if (!noteForm.deliveryDate) {
        ElMessage.warning('请选择发货日期');
        return;
      }
      
      if (!noteForm.deliverer) {
        ElMessage.warning('请输入发货人');
        return;
      }
      
      if (!noteForm.consignee) {
        ElMessage.warning('请输入收货人');
        return;
      }
      
      if (!noteForm.consigneePhone) {
        ElMessage.warning('请输入收货人电话');
        return;
      }
      
      loading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        ElMessage.success('保存成功');
        dialogVisible.value = false;
        getDeliveryNotes();
      } catch (error) {
        ElMessage.error('保存失败');
      } finally {
        loading.value = false;
      }
    };
    
    const cancelDialog = () => {
      dialogVisible.value = false;
      executionSelectorVisible.value = false;
    };
    
    const resetNoteForm = () => {
      Object.assign(noteForm, {
        id: '',
        noteNumber: '',
        executionNumber: '',
        orderNumber: '',
        customerName: '',
        deliveryDate: new Date().toISOString().split('T')[0],
        deliverer: '',
        consignee: '',
        consigneePhone: '',
        logisticsCompany: '',
        trackingNumber: '',
        transportType: 'ROAD',
        warehouseName: '',
        shipToAddress: '',
        status: 'DRAFT',
        totalQuantity: 0,
        totalAmount: 0,
        remark: '',
        actualShipTime: '',
        actualArrivalTime: '',
        items: []
      });
    };
    
    const deliverGoods = async (row) => {
      ElMessageBox.confirm(
        `确定要发货 ${row.noteNumber} 吗？`,
        '确认发货',
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
          ElMessage.success('发货成功');
          getDeliveryNotes();
        } catch (error) {
          ElMessage.error('发货失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const cancelNote = async (row) => {
      ElMessageBox.prompt(
        `请输入取消理由`,
        `取消发货单 ${row.noteNumber}`,
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
          getDeliveryNotes();
        } catch (error) {
          ElMessage.error('取消失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const deleteNote = async (row) => {
      ElMessageBox.confirm(
        `确定要删除发货单 ${row.noteNumber} 吗？`,
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
          getDeliveryNotes();
        } catch (error) {
          ElMessage.error('删除失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const printNote = (row) => {
      ElMessage.info(`即将打印发货单 ${row.noteNumber}`);
    };
    
    const generateInvoice = async (row) => {
      ElMessageBox.confirm(
        `确定要根据发货单 ${row.noteNumber} 生成发票吗？`,
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
          ElMessage.success('发票生成成功');
          getDeliveryNotes();
        } catch (error) {
          ElMessage.error('发票生成失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const viewNoteDetail = (row) => {
      selectedNote.value = JSON.parse(JSON.stringify(row));
      detailVisible.value = true;
    };
    
    const updateLogistics = (row) => {
      logisticsForm.noteNumber = row.noteNumber;
      logisticsForm.logisticsCompany = row.logisticsCompany || '';
      logisticsForm.trackingNumber = row.trackingNumber || '';
      logisticsForm.actualShipTime = row.actualShipTime || '';
      logisticsForm.actualArrivalTime = row.actualArrivalTime || '';
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
      
      loading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        ElMessage.success('物流信息保存成功');
        logisticsVisible.value = false;
        getDeliveryNotes();
      } catch (error) {
        ElMessage.error('物流信息保存失败');
      } finally {
        loading.value = false;
      }
    };
    
    const showExecutionSelector = () => {
      searchExecutions();
      executionSelectorVisible.value = true;
    };
    
    const searchExecutions = async () => {
      executionsLoading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 模拟数据
        const mockExecutions = {
          total: 50,
          data: Array.from({ length: 10 }, (_, index) => ({
            id: index + 1,
            executionNumber: `SE${2024}${String(index + 100).padStart(4, '0')}`,
            planNumber: `SP${2024}${String(index + 200).padStart(4, '0')}`,
            orderNumber: `SO${2024}${String(index + 300).padStart(4, '0')}`,
            customerName: `客户${String(index + 50).padStart(3, '0')}`,
            executionDate: `2024-0${Math.floor(index / 2) + 1}-${String(index % 28 + 1).padStart(2, '0')}`,
            totalQuantity: Math.floor(Math.random() * 500) + 100,
            status: ['IN_PROGRESS', 'COMPLETED'][index % 2],
            remark: `执行备注${index + 1}`
          }))
        };
        
        availableExecutions.value = mockExecutions.data;
        executionsTotal.value = mockExecutions.total;
      } catch (error) {
        ElMessage.error('获取发货执行列表失败');
      } finally {
        executionsLoading.value = false;
      }
    };
    
    const selectExecution = async (execution) => {
      itemsLoading.value = true;
      try {
        // 模拟获取执行详情和明细
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 模拟执行详情
        const executionDetail = {
          ...execution,
          shipToAddress: `上海市静安区南京西路${execution.id * 20}号`,
          warehouseName: `仓库${execution.id % 3 + 1}`,
          items: Array.from({ length: 3 }, (_, itemIndex) => ({
            productCode: `PROD${String(itemIndex + 300).padStart(4, '0')}`,
            productName: `产品${itemIndex + 300}`,
            productSpec: `规格${itemIndex + 1}`,
            unit: ['个', '件', '箱'][itemIndex % 3],
            quantity: Math.floor(Math.random() * 300) + 50,
            unitPrice: Math.random() * 1500 + 300,
            amount: 0,
            batchNumber: '',
            remark: ''
          }))
        };
        
        // 填充表单
        noteForm.executionNumber = executionDetail.executionNumber;
        noteForm.orderNumber = executionDetail.orderNumber;
        noteForm.customerName = executionDetail.customerName;
        noteForm.shipToAddress = executionDetail.shipToAddress;
        noteForm.warehouseName = executionDetail.warehouseName;
        noteForm.items = executionDetail.items;
        
        updateTotalValues();
        executionSelectorVisible.value = false;
      } catch (error) {
        ElMessage.error('获取执行详情失败');
      } finally {
        itemsLoading.value = false;
      }
    };
    
    const updateTotalValues = () => {
      let totalQuantity = 0;
      let totalAmount = 0;
      noteForm.items.forEach(item => {
        item.amount = item.quantity * item.unitPrice;
        totalQuantity += item.quantity;
        totalAmount += item.amount;
      });
      noteForm.totalQuantity = totalQuantity;
      noteForm.totalAmount = totalAmount;
    };
    
    const handleExecutionSizeChange = (size) => {
      executionPagination.pageSize = size;
      searchExecutions();
    };
    
    const handleExecutionCurrentChange = (current) => {
      executionPagination.currentPage = current;
      searchExecutions();
    };
    
    const getStatusLabel = (status) => {
      const statusMap = noteStatuses.reduce((map, item) => {
        map[item.value] = item.label;
        return map;
      }, {});
      return statusMap[status] || status;
    };
    
    const getStatusTagType = (status) => {
      const typeMap = {
        DRAFT: 'info',
        PLANNED: 'warning',
        DELIVERED: 'primary',
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
    
    const getExecutionStatusLabel = (status) => {
      const statusMap = {
        IN_PROGRESS: '执行中',
        COMPLETED: '已完成'
      };
      return statusMap[status] || status;
    };
    
    // 初始化
    onMounted(() => {
      getDeliveryNotes();
    });
    
    return {
      loading,
      itemsLoading,
      deliveryNotes,
      total,
      selectedRows,
      pagination,
      searchForm,
      noteStatuses,
      dialogVisible,
      dialogTitle,
      detailVisible,
      logisticsVisible,
      selectedNote,
      executionSelectorVisible,
      executionSearchForm,
      availableExecutions,
      executionsLoading,
      executionsTotal,
      executionPagination,
      noteForm,
      logisticsForm,
      noteRules,
      handleSearch,
      resetSearch,
      handleSelectionChange,
      handleBatchCommand,
      handleSizeChange,
      handleCurrentChange,
      exportData,
      createNote,
      editNote,
      saveNote,
      cancelDialog,
      deliverGoods,
      cancelNote,
      deleteNote,
      printNote,
      generateInvoice,
      viewNoteDetail,
      updateLogistics,
      saveLogistics,
      showExecutionSelector,
      searchExecutions,
      selectExecution,
      updateTotalValues,
      handleExecutionSizeChange,
      handleExecutionCurrentChange,
      getStatusLabel,
      getStatusTagType,
      getTransportTypeLabel,
      getExecutionStatusLabel
    };
  }
};
</script>

<style scoped>
.delivery-note {
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

.note-items-section {
  margin-top: 30px;
}

.note-items-section h3 {
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 详情页面样式 */
.note-detail {
  padding: 10px;
}

.note-header {
  margin-bottom: 20px;
}

.note-number {
  display: flex;
  align-items: center;
}

.note-number h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.note-info {
  margin-bottom: 20px;
}

.note-address {
  margin-bottom: 20px;
}

.note-address h3,
.note-items h3,
.note-remark h3,
.logistics-section h3 {
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 500;
}

.address-content,
.remark-content {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  line-height: 1.6;
}

.note-items {
  margin-bottom: 20px;
}

.note-items .total-info {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
  gap: 40px;
  font-size: 18px;
}

.note-items .total-item .value {
  font-weight: 600;
  color: #409eff;
}

.note-footer {
  margin-bottom: 20px;
}

.logistics-section {
  margin-top: 30px;
}

.log-content {
  margin-top: 5px;
  color: #606266;
}
</style>