<template>
  <div class="material-return-container">
    <!-- 页面标题 -->
    <el-page-header
      @back="handleBack"
      content="按单退料"
      class="page-header"
    />

    <!-- 工具栏 -->
    <el-card class="toolbar-card">
      <div class="search-bar">
        <el-row :gutter="20" align="middle">
          <el-col :span="5">
            <el-select v-model="searchForm.returnType" placeholder="退料类型" class="w-full">
              <el-option label="生产剩余" value="production_surplus" />
              <el-option label="质量问题" value="quality_issue" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-col>
          <el-col :span="5">
            <el-input
              v-model="searchForm.returnCode"
              placeholder="退料单号/物料编码"
              clearable
            >
              <template #prepend>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="5">
            <el-select v-model="searchForm.workshop" placeholder="所属车间" class="w-full">
              <el-option label="全部" value="" />
              <el-option label="机械加工车间" value="mechanical" />
              <el-option label="装配车间" value="assembly" />
              <el-option label="焊接车间" value="welding" />
            </el-select>
          </el-col>
          <el-col :span="5">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              class="w-full"
            />
          </el-col>
          <el-col :span="4" class="text-right">
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 退料单列表 -->
    <el-card class="mt-4">
      <div class="list-header">
        <span class="title">退料单列表</span>
        <el-button type="primary" @click="handleCreateReturn">
          <el-icon><Plus /></el-icon>
          新建退料单
        </el-button>
      </div>
      
      <el-table
        v-loading="loading"
        :data="returnList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="returnCode" label="退料单号" width="180" />
        <el-table-column prop="orderCode" label="关联订单" width="180" />
        <el-table-column prop="returnTypeText" label="退料类型" width="120" />
        <el-table-column prop="materialCount" label="物料种类" width="100" align="center" />
        <el-table-column prop="returnAmount" label="退料数量" width="100" align="right" />
        <el-table-column prop="reason" label="退料原因" width="180" />
        <el-table-column prop="workshopText" label="所属车间" width="120" />
        <el-table-column prop="returner" label="退料人" width="100" />
        <el-table-column prop="returnTime" label="退料时间" width="180" format-show="datetime" />
        <el-table-column prop="handler" label="处理人" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.statusText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleViewReturn(scope.row)">查看</el-button>
            <el-button
              v-if="scope.row.status === 'draft'"
              type="primary"
              size="small"
              @click="handleEditReturn(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="scope.row.status === 'draft' || scope.row.status === 'submitted'"
              type="danger"
              size="small"
              @click="handleCancelReturn(scope.row)"
            >
              取消
            </el-button>
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
    </el-card>

    <!-- 统计卡片 -->
    <el-card class="mt-4">
      <div class="stats-container">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalReturns }}</div>
              <div class="stat-label">本月退料单</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalMaterials }}</div>
              <div class="stat-label">本月退料物料种类</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalQuantity }}</div>
              <div class="stat-label">本月退料总数量</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ stats.pendingProcessing }}</div>
              <div class="stat-label">待处理退料单</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 退料单创建/编辑对话框 -->
    <el-dialog
      v-model="returnDialogVisible"
      :title="isEditMode ? '编辑退料单' : '新建退料单'"
      width="80%"
      @close="handleReturnDialogClose"
    >
      <div class="return-form">
        <el-form :model="returnForm" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="关联订单" required>
                <el-input
                  v-model="returnForm.orderCode"
                  placeholder="请输入订单编号"
                  @focus="showOrderSelector = true"
                  readonly
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="退料类型" required>
                <el-select v-model="returnForm.returnType" placeholder="请选择退料类型" class="w-full">
                  <el-option label="生产剩余" value="production_surplus" />
                  <el-option label="质量问题" value="quality_issue" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="退料人" required>
                <el-input v-model="returnForm.returner" placeholder="退料人" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="所属车间" required>
                <el-select v-model="returnForm.workshop" placeholder="请选择车间" class="w-full">
                  <el-option label="机械加工车间" value="mechanical" />
                  <el-option label="装配车间" value="assembly" />
                  <el-option label="焊接车间" value="welding" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="退料原因" required>
                <el-input
                  v-model="returnForm.reason"
                  type="textarea"
                  :rows="3"
                  placeholder="请详细描述退料原因"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="备注">
                <el-input
                  v-model="returnForm.remark"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入备注信息"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <!-- 物料明细 -->
        <div class="mt-4">
          <div class="section-header">
            <h4>物料明细</h4>
            <el-button
              type="primary"
              size="small"
              @click="handleAddMaterial"
            >
              <el-icon><Plus /></el-icon>
              添加物料
            </el-button>
          </div>
          
          <el-table
            v-loading="returnItemsLoading"
            :data="returnItems"
            style="width: 100%"
            @selection-change="handleItemSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="materialCode" label="物料编码" width="160" />
            <el-table-column prop="materialName" label="物料名称" width="180" />
            <el-table-column prop="specification" label="规格型号" width="150" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="returnQuantity" label="退料数量" width="120" align="right">
              <template #default="scope">
                <el-input-number
                  v-model="scope.row.returnQuantity"
                  :min="0"
                  size="small"
                  @change="handleReturnQuantityChange(scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="batchNo" label="批次号" width="120">
              <template #default="scope">
                <el-select v-model="scope.row.batchNo" placeholder="选择批次" size="small">
                  <el-option
                    v-for="batch in getMaterialBatches(scope.row.materialId)"
                    :key="batch.batchNo"
                    :label="batch.batchNo"
                    :value="batch.batchNo"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="qualityStatus" label="质量状态" width="100">
              <template #default="scope">
                <el-select v-model="scope.row.qualityStatus" placeholder="质量状态" size="small">
                  <el-option label="完好" value="good" />
                  <el-option label="轻微损坏" value="slight_damage" />
                  <el-option label="严重损坏" value="severe_damage" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="退料说明" width="150">
              <template #default="scope">
                <el-input
                  v-model="scope.row.remark"
                  placeholder="说明"
                  size="small"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="scope">
                <el-button
                  type="danger"
                  size="small"
                  @click="handleDeleteItem(scope.$index)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="returnDialogVisible = false">取消</el-button>
          <el-button @click="handleSaveDraft">保存草稿</el-button>
          <el-button type="primary" @click="handleSubmitReturn">提交</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 退料单详情对话框 -->
    <el-dialog
      v-model="returnDetailVisible"
      title="退料单详情"
      width="80%"
      @close="handleReturnDetailClose"
    >
      <div v-if="currentReturn" class="return-detail">
        <div class="detail-header">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="退料单号">{{ currentReturn.returnCode }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(currentReturn.status)">
                {{ currentReturn.statusText }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="关联订单">{{ currentReturn.orderCode }}</el-descriptions-item>
            <el-descriptions-item label="退料类型">{{ currentReturn.returnTypeText }}</el-descriptions-item>
            <el-descriptions-item label="退料人">{{ currentReturn.returner }}</el-descriptions-item>
            <el-descriptions-item label="所属车间">{{ currentReturn.workshopText }}</el-descriptions-item>
            <el-descriptions-item label="退料时间">{{ formatDateTime(currentReturn.returnTime) }}</el-descriptions-item>
            <el-descriptions-item label="处理人">{{ currentReturn.handler || '-' }}</el-descriptions-item>
            <el-descriptions-item label="退料原因" :span="2">{{ currentReturn.reason }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ currentReturn.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section mt-4">
          <h4>物料明细</h4>
          <el-table
            :data="currentReturn.items"
            style="width: 100%"
            height="400"
          >
            <el-table-column prop="materialCode" label="物料编码" width="160" />
            <el-table-column prop="materialName" label="物料名称" width="180" />
            <el-table-column prop="specification" label="规格型号" width="150" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="returnQuantity" label="退料数量" width="100" align="right" />
            <el-table-column prop="actualQuantity" label="实收数量" width="100" align="right" />
            <el-table-column prop="batchNo" label="批次号" width="120" />
            <el-table-column prop="qualityStatus" label="质量状态" width="100">
              <template #default="scope">
                <el-tag :type="getQualityStatusType(scope.row.qualityStatus)">
                  {{ scope.row.qualityStatusText }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="storageLocation" label="入库库位" width="100" />
            <el-table-column prop="handler" label="处理人" width="100" />
            <el-table-column prop="handleTime" label="处理时间" width="180" format-show="datetime" />
            <el-table-column prop="remark" label="退料说明" width="150" />
          </el-table>
        </div>

        <div v-if="currentReturn.operationLogs && currentReturn.operationLogs.length > 0" class="detail-section mt-4">
          <h4>操作日志</h4>
          <el-timeline>
            <el-timeline-item
              v-for="log in currentReturn.operationLogs"
              :key="log.id"
              :timestamp="formatDateTime(log.operationTime)"
            >
              <div>{{ log.operator }} - {{ log.operationTypeText }}</div>
              <div v-if="log.remark" class="text-gray-500">{{ log.remark }}</div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="returnDetailVisible = false">关闭</el-button>
          <el-button
            v-if="currentReturn && currentReturn.status === 'submitted'"
            type="primary"
            @click="handleProcessReturn"
          >
            处理退料
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 物料选择对话框 -->
    <el-dialog
      v-model="materialSelectorVisible"
      title="选择物料"
      width="80%"
      @close="handleMaterialSelectorClose"
    >
      <div class="material-selector">
        <el-input
          v-model="materialSearchKeyword"
          placeholder="搜索物料编码/名称/规格"
          clearable
          class="mb-4"
          @input="handleMaterialSearch"
        >
          <template #prepend>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-table
          v-loading="materialsLoading"
          :data="filteredMaterials"
          style="width: 100%"
          height="400"
          @selection-change="handleMaterialSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="code" label="物料编码" width="160" />
          <el-table-column prop="name" label="物料名称" width="180" />
          <el-table-column prop="specification" label="规格型号" width="150" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="category" label="物料类别" width="120" />
          <el-table-column prop="stockQuantity" label="库存数量" width="100" align="right" />
          <el-table-column prop="location" label="当前库位" width="100" />
        </el-table>
        
        <div class="dialog-footer">
          <el-button @click="materialSelectorVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmMaterials">确认选择</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 订单选择对话框 -->
    <el-dialog
      v-model="orderSelectorVisible"
      title="选择订单"
      width="80%"
      @close="handleOrderSelectorClose"
    >
      <div class="order-selector">
        <el-input
          v-model="orderSearchKeyword"
          placeholder="搜索订单编号/产品名称"
          clearable
          class="mb-4"
          @input="handleOrderSearch"
        >
          <template #prepend>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-table
          v-loading="ordersLoading"
          :data="filteredOrders"
          style="width: 100%"
          height="400"
          @row-click="handleOrderRowClick"
          row-key="id"
          highlight-current-row
        >
          <el-table-column prop="orderCode" label="订单编号" width="180" />
          <el-table-column prop="orderTypeText" label="订单类型" width="120" />
          <el-table-column prop="productName" label="产品名称" width="200" />
          <el-table-column prop="productCode" label="产品编码" width="180" />
          <el-table-column prop="quantity" label="订单数量" width="100" align="right" />
          <el-table-column prop="workshopText" label="所属车间" width="120" />
          <el-table-column prop="issuedQuantity" label="已领数量" width="100" align="right" />
          <el-table-column prop="returnableQuantity" label="可退数量" width="100" align="right" />
        </el-table>
        
        <div class="dialog-footer">
          <el-button @click="orderSelectorVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmOrder">确认选择</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 退料处理对话框 -->
    <el-dialog
      v-model="processReturnDialogVisible"
      title="处理退料"
      width="70%"
      @close="handleProcessReturnDialogClose"
    >
      <div v-if="processReturnForm" class="process-return-form">
        <el-form :model="processReturnForm" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="退料单号">
                <el-input v-model="processReturnForm.returnCode" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="处理时间">
                <el-date-picker
                  v-model="processReturnForm.handleTime"
                  type="datetime"
                  placeholder="选择处理时间"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="处理人" required>
                <el-input v-model="processReturnForm.handler" placeholder="处理人" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="处理结果" required>
                <el-radio-group v-model="processReturnForm.processResult">
                  <el-radio :label="'accepted'">接受退料</el-radio>
                  <el-radio :label="'rejected'">拒绝退料</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="处理说明">
                <el-input
                  v-model="processReturnForm.processRemark"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入处理说明"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <div class="mt-4">
          <h4>物料明细</h4>
          <el-table
            :data="processReturnForm.items"
            style="width: 100%"
            height="300"
          >
            <el-table-column prop="materialCode" label="物料编码" width="160" />
            <el-table-column prop="materialName" label="物料名称" width="180" />
            <el-table-column prop="specification" label="规格型号" width="150" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="returnQuantity" label="退料数量" width="100" align="right" />
            <el-table-column prop="actualQuantity" label="实收数量" width="100" align="right">
              <template #default="scope">
                <el-input-number
                  v-model="scope.row.actualQuantity"
                  :min="0"
                  :max="scope.row.returnQuantity"
                  size="small"
                />
              </template>
            </el-table-column>
            <el-table-column prop="storageLocation" label="入库库位" width="100">
              <template #default="scope">
                <el-select v-model="scope.row.storageLocation" placeholder="选择库位" size="small">
                  <el-option
                    v-for="location in storageLocations"
                    :key="location"
                    :label="location"
                    :value="location"
                  />
                </el-select>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="processReturnDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmProcess">确认处理</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus, Delete } from '@element-plus/icons-vue';

// 搜索表单
const searchForm = reactive({
  returnType: '',
  returnCode: '',
  workshop: '',
  dateRange: []
});

// 退料单列表数据
const returnList = ref([]);
const loading = ref(false);
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 统计数据
const stats = reactive({
  totalReturns: 0,
  totalMaterials: 0,
  totalQuantity: 0,
  pendingProcessing: 0
});

// 选中的退料单
const selectedReturns = ref([]);
// 选中的物料项
const selectedItems = ref([]);

// 对话框状态
const returnDialogVisible = ref(false);
const returnDetailVisible = ref(false);
const materialSelectorVisible = ref(false);
const orderSelectorVisible = ref(false);
const processReturnDialogVisible = ref(false);

// 当前操作的退料单
const currentReturn = ref(null);
const isEditMode = ref(false);

// 退料单表单
const returnForm = reactive({
  id: '',
  returnCode: '',
  orderCode: '',
  returnType: '',
  returner: '',
  workshop: '',
  reason: '',
  remark: ''
});

// 退料单物料明细
const returnItems = ref([]);
const returnItemsLoading = ref(false);

// 物料选择相关
const materials = ref([]);
const materialsLoading = ref(false);
const materialSearchKeyword = ref('');
const selectedMaterials = ref([]);

// 订单选择相关
const orders = ref([]);
const ordersLoading = ref(false);
const orderSearchKeyword = ref('');
const selectedOrder = ref(null);

// 退料处理表单
const processReturnForm = ref(null);

// 模拟数据 - 物料批次信息
const materialBatches = {
  'M001': [{ batchNo: 'B20240101', quantity: 500 }, { batchNo: 'B20240201', quantity: 300 }],
  'M002': [{ batchNo: 'B20240102', quantity: 200 }, { batchNo: 'B20240202', quantity: 400 }],
  'M003': [{ batchNo: 'B20240103', quantity: 150 }],
  'M004': [{ batchNo: 'B20240104', quantity: 100 }, { batchNo: 'B20240204', quantity: 200 }],
  'M005': [{ batchNo: 'B20240105', quantity: 80 }]
};

// 模拟数据 - 库位信息
const storageLocations = ['A01', 'A02', 'B01', 'B02', 'C01', 'C02', 'D01', 'D02'];

// 获取物料批次列表
const getMaterialBatches = (materialId) => {
  return materialBatches[materialId] || [];
};

// 获取状态对应的标签类型
const getStatusType = (status) => {
  const typeMap = {
    'draft': 'info',
    'submitted': 'primary',
    'processing': 'warning',
    'completed': 'success',
    'rejected': 'danger',
    'cancelled': 'danger'
  };
  return typeMap[status] || 'default';
};

// 获取质量状态对应的标签类型
const getQualityStatusType = (status) => {
  const typeMap = {
    'good': 'success',
    'slight_damage': 'warning',
    'severe_damage': 'danger'
  };
  return typeMap[status] || 'default';
};

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
  const dateStr = formatDate(d);
  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  return `${dateStr} ${timeStr}`;
};

// 过滤后的物料列表
const filteredMaterials = computed(() => {
  if (!materialSearchKeyword.value) return materials.value;
  const keyword = materialSearchKeyword.value.toLowerCase();
  return materials.value.filter(material => 
    material.code.toLowerCase().includes(keyword) ||
    material.name.toLowerCase().includes(keyword) ||
    material.specification.toLowerCase().includes(keyword)
  );
});

// 过滤后的订单列表
const filteredOrders = computed(() => {
  if (!orderSearchKeyword.value) return orders.value;
  const keyword = orderSearchKeyword.value.toLowerCase();
  return orders.value.filter(order => 
    order.orderCode.toLowerCase().includes(keyword) ||
    order.productName.toLowerCase().includes(keyword)
  );
});

// 模拟生成退料单数据
const generateMockReturnData = () => {
  const returnTypes = ['production_surplus', 'quality_issue', 'other'];
  const returnTypeTexts = ['生产剩余', '质量问题', '其他'];
  const workshops = ['mechanical', 'assembly', 'welding'];
  const workshopTexts = ['机械加工车间', '装配车间', '焊接车间'];
  const statuses = ['draft', 'submitted', 'processing', 'completed', 'rejected', 'cancelled'];
  const statusTexts = ['草稿', '已提交', '处理中', '已完成', '已拒绝', '已取消'];
  const qualityStatuses = ['good', 'slight_damage', 'severe_damage'];
  const qualityStatusTexts = ['完好', '轻微损坏', '严重损坏'];
  
  const returns = [];
  const materials = [
    { id: 'M001', code: 'M001', name: '轴承', spec: '6205', unit: '个' },
    { id: 'M002', code: 'M002', name: '齿轮', spec: 'G301', unit: '个' },
    { id: 'M003', code: 'M003', name: '电机', spec: 'Y100L', unit: '台' },
    { id: 'M004', code: 'M004', name: '传送带', spec: 'B500', unit: '米' },
    { id: 'M005', code: 'M005', name: '控制面板', spec: 'P001', unit: '块' }
  ];
  
  for (let i = 1; i <= 50; i++) {
    const returnTypeIndex = Math.floor(Math.random() * returnTypes.length);
    const workshopIndex = Math.floor(Math.random() * workshops.length);
    const statusIndex = Math.floor(Math.random() * statuses.length);
    const returnCode = `MR${String(i).padStart(4, '0')}`;
    const orderCode = `SO${String(i).padStart(4, '0')}`;
    const materialCount = Math.floor(Math.random() * 4) + 1;
    const returnAmount = Math.floor(Math.random() * 200) + 10;
    const reasons = [
      '生产计划变更，物料剩余',
      '质量不达标，需要更换',
      '发料错误，型号不符',
      '项目取消，物料退回',
      '其他原因'
    ];
    const reason = reasons[Math.floor(Math.random() * reasons.length)];
    const returnTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    // 模拟操作日志
    const operationLogs = [
      {
        id: String(i * 10 + 1),
        operator: `用户${Math.floor(Math.random() * 10) + 1}`,
        operationType: 'create',
        operationTypeText: '创建退料单',
        operationTime: returnTime
      }
    ];
    
    if (statusIndex >= 1) {
      const submitTime = new Date(returnTime);
      submitTime.setHours(submitTime.getHours() + Math.floor(Math.random() * 24));
      operationLogs.push({
        id: String(i * 10 + 2),
        operator: `用户${Math.floor(Math.random() * 10) + 1}`,
        operationType: 'submit',
        operationTypeText: '提交退料单',
        operationTime: submitTime
      });
    }
    
    if (statusIndex >= 3 || statusIndex === 4) {
      const processTime = new Date(returnTime);
      processTime.setHours(processTime.getHours() + Math.floor(Math.random() * 48) + 24);
      operationLogs.push({
        id: String(i * 10 + 3),
        operator: `仓库员${Math.floor(Math.random() * 5) + 1}`,
        operationType: statusIndex === 4 ? 'reject' : 'complete',
        operationTypeText: statusIndex === 4 ? '拒绝退料' : '完成退料处理',
        operationTime: processTime,
        remark: statusIndex === 4 ? '退料原因不充分' : ''
      });
    }
    
    if (statusIndex === 5) {
      const cancelTime = new Date(returnTime);
      cancelTime.setHours(cancelTime.getHours() + Math.floor(Math.random() * 24));
      operationLogs.push({
        id: String(i * 10 + 5),
        operator: `用户${Math.floor(Math.random() * 10) + 1}`,
        operationType: 'cancel',
        operationTypeText: '取消退料单',
        operationTime: cancelTime,
        remark: '退料需求取消'
      });
    }
    
    // 按时间排序日志
    operationLogs.sort((a, b) => new Date(a.operationTime) - new Date(b.operationTime));
    
    // 模拟物料明细
    const items = [];
    const shuffledMaterials = [...materials].sort(() => 0.5 - Math.random());
    
    for (let j = 0; j < materialCount; j++) {
      const material = shuffledMaterials[j];
      const qualityStatusIndex = Math.floor(Math.random() * qualityStatuses.length);
      const returnQuantity = Math.floor(Math.random() * 50) + 1;
      const actualQuantity = statusIndex >= 3 ? (statusIndex === 4 ? 0 : returnQuantity) : 0;
      
      items.push({
        materialId: material.id,
        materialCode: material.code,
        materialName: material.name,
        specification: material.spec,
        unit: material.unit,
        returnQuantity,
        actualQuantity,
        batchNo: Math.random() > 0.2 ? `B${String(Math.floor(Math.random() * 10000)).padStart(8, '0')}` : '',
        qualityStatus: qualityStatuses[qualityStatusIndex],
        qualityStatusText: qualityStatusTexts[qualityStatusIndex],
        storageLocation: statusIndex >= 3 && statusIndex !== 4 ? storageLocations[Math.floor(Math.random() * storageLocations.length)] : '',
        handler: statusIndex >= 3 && statusIndex !== 4 ? `仓库员${Math.floor(Math.random() * 5) + 1}` : '',
        handleTime: statusIndex >= 3 && statusIndex !== 4 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        remark: ''
      });
    }
    
    returns.push({
      id: String(i),
      returnCode,
      orderCode,
      returnType: returnTypes[returnTypeIndex],
      returnTypeText: returnTypeTexts[returnTypeIndex],
      materialCount,
      returnAmount,
      reason,
      workshop: workshops[workshopIndex],
      workshopText: workshopTexts[workshopIndex],
      returner: `退料人${Math.floor(Math.random() * 10) + 1}`,
      returnTime,
      handler: statusIndex >= 3 && statusIndex !== 4 ? `仓库员${Math.floor(Math.random() * 5) + 1}` : '',
      status: statuses[statusIndex],
      statusText: statusTexts[statusIndex],
      remark: Math.random() > 0.5 ? '无特殊说明' : '',
      items,
      operationLogs
    });
  }
  
  return returns;
};

// 模拟生成物料数据
const generateMockMaterials = () => {
  const materials = [];
  const categories = ['原材料', '半成品', '成品', '辅助材料'];
  
  for (let i = 1; i <= 100; i++) {
    materials.push({
      id: `M${String(i).padStart(3, '0')}`,
      code: `M${String(i).padStart(3, '0')}`,
      name: `物料${String(i).padStart(3, '0')}`,
      specification: `规格${String(i).padStart(2, '0')}`,
      unit: ['个', '台', '米', '千克', '件'][Math.floor(Math.random() * 5)],
      category: categories[Math.floor(Math.random() * categories.length)],
      stockQuantity: Math.floor(Math.random() * 1000) + 100,
      location: storageLocations[Math.floor(Math.random() * storageLocations.length)]
    });
  }
  
  return materials;
};

// 模拟生成订单数据
const generateMockOrders = () => {
  const orders = [];
  const orderTypes = ['production', 'sales'];
  const orderTypeTexts = ['生产工单', '销售订单'];
  const workshops = ['mechanical', 'assembly', 'welding'];
  const workshopTexts = ['机械加工车间', '装配车间', '焊接车间'];
  
  for (let i = 1; i <= 50; i++) {
    const orderTypeIndex = Math.floor(Math.random() * orderTypes.length);
    const workshopIndex = Math.floor(Math.random() * workshops.length);
    const orderCode = `${orderTypeTexts[orderTypeIndex].charAt(0)}${String(i).padStart(4, '0')}`;
    const quantity = Math.floor(Math.random() * 100) + 50;
    const issuedQuantity = Math.floor(quantity * (Math.random() * 0.8 + 0.2)); // 20%-100%已领用
    const returnableQuantity = Math.floor(issuedQuantity * 0.5); // 假设最多可退50%
    
    orders.push({
      id: String(i),
      orderCode,
      orderType: orderTypes[orderTypeIndex],
      orderTypeText: orderTypeTexts[orderTypeIndex],
      productName: `产品${String(i).padStart(3, '0')}`,
      productCode: `P${String(i).padStart(4, '0')}`,
      quantity,
      workshop: workshops[workshopIndex],
      workshopText: workshopTexts[workshopIndex],
      issuedQuantity,
      returnableQuantity
    });
  }
  
  return orders;
};

// 获取退料单列表
const getReturnList = () => {
  loading.value = true;
  
  // 模拟API调用延迟
  setTimeout(() => {
    const mockData = generateMockReturnData();
    
    // 根据搜索条件过滤
    let filteredData = mockData;
    if (searchForm.returnType) {
      filteredData = filteredData.filter(item => item.returnType === searchForm.returnType);
    }
    if (searchForm.returnCode) {
      const keyword = searchForm.returnCode.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.returnCode.toLowerCase().includes(keyword) ||
        item.items.some(item => item.materialCode.toLowerCase().includes(keyword))
      );
    }
    if (searchForm.workshop) {
      filteredData = filteredData.filter(item => item.workshop === searchForm.workshop);
    }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      filteredData = filteredData.filter(item => {
        const returnTime = new Date(item.returnTime);
        return returnTime >= new Date(searchForm.dateRange[0]) && returnTime <= new Date(searchForm.dateRange[1]);
      });
    }
    
    // 分页
    pagination.total = filteredData.length;
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    returnList.value = filteredData.slice(startIndex, endIndex);
    
    // 更新统计数据
    updateStats(filteredData);
    
    loading.value = false;
  }, 500);
};

// 更新统计数据
const updateStats = (data) => {
  // 获取本月数据
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  const monthData = data.filter(item => {
    const returnTime = new Date(item.returnTime);
    return returnTime >= monthStart && returnTime <= monthEnd;
  });
  
  // 统计数据
  stats.totalReturns = monthData.length;
  
  // 计算物料种类数
  const materialCodes = new Set();
  monthData.forEach(item => {
    item.items.forEach(material => {
      materialCodes.add(material.materialCode);
    });
  });
  stats.totalMaterials = materialCodes.size;
  
  // 计算总数量
  stats.totalQuantity = monthData.reduce((sum, item) => sum + item.returnAmount, 0);
  
  // 计算待处理数量
  stats.pendingProcessing = data.filter(item => item.status === 'submitted').length;
};

// 获取物料列表
const getMaterials = () => {
  materialsLoading.value = true;
  
  // 模拟API调用延迟
  setTimeout(() => {
    materials.value = generateMockMaterials();
    materialsLoading.value = false;
  }, 300);
};

// 获取订单列表
const getOrders = () => {
  ordersLoading.value = true;
  
  // 模拟API调用延迟
  setTimeout(() => {
    orders.value = generateMockOrders();
    ordersLoading.value = false;
  }, 300);
};

// 获取退料单详情
const getReturnDetail = (returnId) => {
  // 模拟API调用延迟
  setTimeout(() => {
    const mockData = generateMockReturnData();
    currentReturn.value = mockData.find(ret => ret.id === returnId);
    returnDetailVisible.value = true;
  }, 300);
};

// 搜索退料单
const handleSearch = () => {
  pagination.currentPage = 1;
  getReturnList();
};

// 重置搜索条件
const handleReset = () => {
  searchForm.returnType = '';
  searchForm.returnCode = '';
  searchForm.workshop = '';
  searchForm.dateRange = [];
  pagination.currentPage = 1;
  getReturnList();
};

// 分页处理
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  getReturnList();
};

const handleCurrentChange = (current) => {
  pagination.currentPage = current;
  getReturnList();
};

// 选择退料单
const handleSelectionChange = (selection) => {
  selectedReturns.value = selection;
};

// 选择物料项
const handleItemSelectionChange = (selection) => {
  selectedItems.value = selection;
};

// 查看退料单
const handleViewReturn = (row) => {
  getReturnDetail(row.id);
};

// 编辑退料单
const handleEditReturn = (row) => {
  isEditMode.value = true;
  returnForm.id = row.id;
  returnForm.returnCode = row.returnCode;
  returnForm.orderCode = row.orderCode;
  returnForm.returnType = row.returnType;
  returnForm.returner = row.returner;
  returnForm.workshop = row.workshop;
  returnForm.reason = row.reason;
  returnForm.remark = row.remark || '';
  
  // 设置物料项
  returnItems.value = row.items.map(item => ({
    materialId: item.materialId,
    materialCode: item.materialCode,
    materialName: item.materialName,
    specification: item.specification,
    unit: item.unit,
    returnQuantity: item.returnQuantity,
    batchNo: item.batchNo || '',
    qualityStatus: item.qualityStatus,
    remark: item.remark || ''
  }));
  
  returnDialogVisible.value = true;
};

// 取消退料单
const handleCancelReturn = (row) => {
  ElMessageBox.confirm(
    `确定要取消退料单 ${row.returnCode} 吗？`,
    '取消确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      // 模拟API调用
      setTimeout(() => {
        ElMessage.success('取消成功');
        getReturnList();
      }, 300);
    })
    .catch(() => {
      // 取消操作
    });
};

// 新建退料单
const handleCreateReturn = () => {
  isEditMode.value = false;
  Object.assign(returnForm, {
    id: '',
    returnCode: '',
    orderCode: '',
    returnType: '',
    returner: `当前用户`,
    workshop: '',
    reason: '',
    remark: ''
  });
  returnItems.value = [];
  returnDialogVisible.value = true;
};

// 添加物料
const handleAddMaterial = () => {
  selectedMaterials.value = [];
  materialSearchKeyword.value = '';
  if (materials.value.length === 0) {
    getMaterials();
  }
  materialSelectorVisible.value = true;
};

// 删除物料项
const handleDeleteItem = (index) => {
  returnItems.value.splice(index, 1);
};

// 处理退料数量变化
const handleReturnQuantityChange = (row) => {
  if (row.returnQuantity < 0) {
    row.returnQuantity = 0;
    ElMessage.warning('退料数量不能为负数');
  }
};

// 保存草稿
const handleSaveDraft = () => {
  // 验证表单
  if (!returnForm.orderCode) {
    ElMessage.warning('请选择关联订单');
    return;
  }
  if (!returnForm.returnType) {
    ElMessage.warning('请选择退料类型');
    return;
  }
  if (!returnForm.returner) {
    ElMessage.warning('请输入退料人');
    return;
  }
  if (!returnForm.workshop) {
    ElMessage.warning('请选择所属车间');
    return;
  }
  if (!returnForm.reason) {
    ElMessage.warning('请输入退料原因');
    return;
  }
  
  // 验证物料项
  if (returnItems.value.length === 0) {
    ElMessage.warning('请至少添加一种物料');
    return;
  }
  
  const invalidItems = returnItems.value.filter(item => item.returnQuantity <= 0);
  if (invalidItems.length > 0) {
    ElMessage.warning('请确保所有物料的退料数量大于0');
    return;
  }
  
  // 模拟API调用
  setTimeout(() => {
    ElMessage.success('草稿保存成功');
    returnDialogVisible.value = false;
    getReturnList();
  }, 300);
};

// 提交退料单
const handleSubmitReturn = () => {
  // 验证表单
  if (!returnForm.orderCode) {
    ElMessage.warning('请选择关联订单');
    return;
  }
  if (!returnForm.returnType) {
    ElMessage.warning('请选择退料类型');
    return;
  }
  if (!returnForm.returner) {
    ElMessage.warning('请输入退料人');
    return;
  }
  if (!returnForm.workshop) {
    ElMessage.warning('请选择所属车间');
    return;
  }
  if (!returnForm.reason) {
    ElMessage.warning('请输入退料原因');
    return;
  }
  
  // 验证物料项
  if (returnItems.value.length === 0) {
    ElMessage.warning('请至少添加一种物料');
    return;
  }
  
  const invalidItems = returnItems.value.filter(item => item.returnQuantity <= 0);
  if (invalidItems.length > 0) {
    ElMessage.warning('请确保所有物料的退料数量大于0');
    return;
  }
  
  // 模拟API调用
  setTimeout(() => {
    ElMessage.success('退料单提交成功');
    returnDialogVisible.value = false;
    getReturnList();
  }, 500);
};

// 处理退料
const handleProcessReturn = () => {
  if (currentReturn.value) {
    // 准备处理表单
    processReturnForm.value = {
      id: currentReturn.value.id,
      returnCode: currentReturn.value.returnCode,
      handleTime: new Date(),
      handler: '',
      processResult: 'accepted',
      processRemark: '',
      items: currentReturn.value.items.map(item => ({
        materialId: item.materialId,
        materialCode: item.materialCode,
        materialName: item.materialName,
        specification: item.specification,
        unit: item.unit,
        returnQuantity: item.returnQuantity,
        actualQuantity: item.returnQuantity,
        storageLocation: ''
      }))
    };
    
    processReturnDialogVisible.value = true;
  }
};

// 确认处理
const handleConfirmProcess = () => {
  if (!processReturnForm.value.handler) {
    ElMessage.warning('请输入处理人');
    return;
  }
  
  if (processReturnForm.value.processResult === 'accepted') {
    const incompleteItems = processReturnForm.value.items.filter(item => !item.storageLocation || item.actualQuantity <= 0);
    if (incompleteItems.length > 0) {
      ElMessage.warning('请为所有物料指定入库库位并填写实收数量');
      return;
    }
  }
  
  // 模拟API调用
  setTimeout(() => {
    ElMessage.success('退料处理完成');
    processReturnDialogVisible.value = false;
    returnDetailVisible.value = false;
    getReturnList();
  }, 500);
};

// 物料搜索
const handleMaterialSearch = () => {
  // 搜索已在计算属性中处理
};

// 选择物料
const handleMaterialSelectionChange = (selection) => {
  selectedMaterials.value = selection;
};

// 确认选择物料
const handleConfirmMaterials = () => {
  if (selectedMaterials.value.length === 0) {
    ElMessage.warning('请至少选择一种物料');
    return;
  }
  
  // 添加选中的物料到退料单
  selectedMaterials.value.forEach(material => {
    // 检查是否已添加
    const exists = returnItems.value.some(item => item.materialId === material.id);
    if (!exists) {
      returnItems.value.push({
        materialId: material.id,
        materialCode: material.code,
        materialName: material.name,
        specification: material.specification,
        unit: material.unit,
        returnQuantity: 0,
        batchNo: '',
        qualityStatus: 'good',
        remark: ''
      });
    }
  });
  
  materialSelectorVisible.value = false;
};

// 订单搜索
const handleOrderSearch = () => {
  // 搜索已在计算属性中处理
};

// 点击订单行
const handleOrderRowClick = (row) => {
  selectedOrder.value = row;
};

// 确认选择订单
const handleConfirmOrder = () => {
  if (!selectedOrder.value) {
    ElMessage.warning('请选择订单');
    return;
  }
  
  returnForm.orderCode = selectedOrder.value.orderCode;
  orderSelectorVisible.value = false;
};

// 显示订单选择器
const showOrderSelector = computed({
  get: () => false,
  set: (value) => {
    if (value) {
      selectedOrder.value = null;
      orderSearchKeyword.value = '';
      if (orders.value.length === 0) {
        getOrders();
      }
      orderSelectorVisible.value = true;
    }
  }
});

// 返回
const handleBack = () => {
  // 实际应使用路由返回
  ElMessage.info('返回上一页');
};

// 关闭对话框
const handleReturnDialogClose = () => {
  // 清空表单
};

const handleReturnDetailClose = () => {
  currentReturn.value = null;
};

const handleMaterialSelectorClose = () => {
  selectedMaterials.value = [];
};

const handleOrderSelectorClose = () => {
  selectedOrder.value = null;
};

const handleProcessReturnDialogClose = () => {
  processReturnForm.value = null;
};

// 组件挂载时获取数据
onMounted(() => {
  getReturnList();
});
</script>

<style scoped>
.material-return-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.search-bar {
  padding: 10px 0;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-header .title {
  font-size: 16px;
  font-weight: 500;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.stats-container {
  padding: 10px 0;
}

.stat-card {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 6px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.return-form,
.return-detail,
.material-selector,
.order-selector,
.process-return-form {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-header {
  margin-bottom: 20px;
}

.detail-section h4,
.section-header h4 {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 500;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.text-gray-500 {
  color: #909399;
}
</style>