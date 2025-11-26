<template>
  <div class="material-picking-container">
    <!-- 页面标题 -->
    <el-page-header
      @back="handleBack"
      content="按单领料"
      class="page-header"
    />

    <!-- 工具栏 -->
    <el-card class="toolbar-card">
      <div class="search-bar">
        <el-row :gutter="20" align="middle">
          <el-col :span="6">
            <el-select v-model="searchForm.orderType" placeholder="订单类型" class="w-full">
              <el-option label="生产工单" value="production" />
              <el-option label="销售订单" value="sales" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-input
              v-model="searchForm.orderCode"
              placeholder="订单编号/产品名称"
              clearable
            >
              <template #prepend>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="6">
            <el-select v-model="searchForm.workshop" placeholder="所属车间" class="w-full">
              <el-option label="全部" value="" />
              <el-option label="机械加工车间" value="mechanical" />
              <el-option label="装配车间" value="assembly" />
              <el-option label="焊接车间" value="welding" />
            </el-select>
          </el-col>
          <el-col :span="6" class="text-right">
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 订单列表 -->
    <el-card class="mt-4">
      <div class="order-list-header">
        <span class="title">可领料订单</span>
        <el-button type="primary" @click="handleCreatePicking">
          <el-icon><Plus /></el-icon>
          新建领料单
        </el-button>
      </div>
      
      <el-table
        v-loading="loading"
        :data="orderList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="orderCode" label="订单编号" width="180" />
        <el-table-column prop="orderTypeText" label="订单类型" width="120" />
        <el-table-column prop="productName" label="产品名称" width="200" />
        <el-table-column prop="productCode" label="产品编码" width="180" />
        <el-table-column prop="quantity" label="订单数量" width="100" align="right" />
        <el-table-column prop="workshopText" label="所属车间" width="120" />
        <el-table-column prop="requiredDate" label="需求日期" width="140" format-show="date" />
        <el-table-column prop="materialStatus" label="物料状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.materialStatus)">
              {{ scope.row.materialStatusText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdBy" label="创建人" width="100" />
        <el-table-column prop="createdTime" label="创建时间" width="180" format-show="datetime" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleViewOrder(scope.row)">查看</el-button>
            <el-button type="primary" size="small" @click="handlePickingOrder(scope.row)">
              申请领料
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

    <!-- 我的领料单 -->
    <el-card class="mt-4">
      <div class="order-list-header">
        <span class="title">我的领料申请</span>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
      
      <el-table
        v-loading="pickingLoading"
        :data="pickingList"
        style="width: 100%"
        @selection-change="handlePickingSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="pickingCode" label="领料单号" width="180" />
        <el-table-column prop="orderCode" label="关联订单" width="180" />
        <el-table-column prop="productName" label="产品名称" width="200" />
        <el-table-column prop="materialCount" label="物料种类" width="100" align="center" />
        <el-table-column prop="requestAmount" label="申请数量" width="100" align="right" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getPickingStatusType(scope.row.status)">
              {{ scope.row.statusText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-tag
          v-if="scope.row.isUrgent"
          type="danger"
          size="small"
          effect="dark"
          class="ml-2"
        >
          加急
        </el-tag>
        <el-table-column prop="applicant" label="申请人" width="100" />
        <el-table-column prop="applyTime" label="申请时间" width="180" format-show="datetime" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleViewPicking(scope.row)">查看</el-button>
            <el-button
              v-if="scope.row.status === 'draft'"
              type="primary"
              size="small"
              @click="handleEditPicking(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="scope.row.status === 'draft' || scope.row.status === 'submitted'"
              type="danger"
              size="small"
              @click="handleCancelPicking(scope.row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pickingPagination.currentPage"
          v-model:page-size="pickingPagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pickingPagination.total"
          @size-change="handlePickingSizeChange"
          @current-change="handlePickingCurrentChange"
        />
      </div>
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="订单详情"
      width="70%"
      @close="handleDialogClose"
    >
      <div v-if="currentOrder" class="order-detail">
        <div class="detail-header">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单编号">{{ currentOrder.orderCode }}</el-descriptions-item>
            <el-descriptions-item label="订单类型">{{ currentOrder.orderTypeText }}</el-descriptions-item>
            <el-descriptions-item label="产品名称">{{ currentOrder.productName }}</el-descriptions-item>
            <el-descriptions-item label="产品编码">{{ currentOrder.productCode }}</el-descriptions-item>
            <el-descriptions-item label="订单数量" :span="2">{{ currentOrder.quantity }}</el-descriptions-item>
            <el-descriptions-item label="所属车间">{{ currentOrder.workshopText }}</el-descriptions-item>
            <el-descriptions-item label="需求日期">{{ formatDate(currentOrder.requiredDate) }}</el-descriptions-item>
            <el-descriptions-item label="物料状态">{{ currentOrder.materialStatusText }}</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ currentOrder.createdBy }}</el-descriptions-item>
            <el-descriptions-item label="创建时间" :span="2">{{ formatDateTime(currentOrder.createdTime) }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-section mt-4">
          <h4>物料清单</h4>
          <el-table
            :data="currentOrder.materialList"
            style="width: 100%"
            height="400"
          >
            <el-table-column prop="materialCode" label="物料编码" width="160" />
            <el-table-column prop="materialName" label="物料名称" width="180" />
            <el-table-column prop="specification" label="规格型号" width="150" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="requiredQuantity" label="需求数量" width="100" align="right" />
            <el-table-column prop="issuedQuantity" label="已发数量" width="100" align="right" />
            <el-table-column prop="availableQuantity" label="可领数量" width="100" align="right" />
            <el-table-column prop="stockQuantity" label="库存数量" width="100" align="right" />
            <el-table-column prop="stockStatus" label="库存状态" width="100">
              <template #default="scope">
                <el-tag :type="getStockStatusType(scope.row.stockStatus)">
                  {{ scope.row.stockStatusText }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handlePickingCurrentOrder">申请领料</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 领料单申请对话框 -->
    <el-dialog
      v-model="pickingDialogVisible"
      :title="isEditMode ? '编辑领料单' : '新建领料单'"
      width="80%"
      @close="handlePickingDialogClose"
    >
      <div class="picking-form">
        <el-form :model="pickingForm" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="关联订单" required>
                <el-input
                  v-model="pickingForm.orderCode"
                  placeholder="请输入订单编号"
                  :disabled="isEditMode"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="产品信息" required>
                <el-input
                  v-model="pickingForm.productInfo"
                  placeholder="产品名称/编码"
                  :disabled="true"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="申请人">
                <el-input v-model="pickingForm.applicant" placeholder="申请人" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="申请部门">
                <el-input v-model="pickingForm.department" placeholder="申请部门" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预计领用日期">
                <el-date-picker
                  v-model="pickingForm.expectedDate"
                  type="date"
                  placeholder="选择日期"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="紧急程度">
                <el-radio-group v-model="pickingForm.isUrgent">
                  <el-radio :label="false">普通</el-radio>
                  <el-radio :label="true">加急</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="备注">
                <el-input
                  v-model="pickingForm.remark"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入备注信息"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <div class="mt-4">
          <h4>物料明细</h4>
          <el-table
            v-loading="pickingItemsLoading"
            :data="pickingItems"
            style="width: 100%"
            @selection-change="handleItemSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="materialCode" label="物料编码" width="160" />
            <el-table-column prop="materialName" label="物料名称" width="180" />
            <el-table-column prop="specification" label="规格型号" width="150" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="requiredQuantity" label="需求数量" width="100" align="right" />
            <el-table-column prop="availableQuantity" label="可领数量" width="100" align="right" />
            <el-table-column prop="requestQuantity" label="本次申请数量" width="120" align="right">
              <template #default="scope">
                <el-input-number
                  v-model="scope.row.requestQuantity"
                  :min="0"
                  :max="scope.row.availableQuantity"
                  size="small"
                  @change="handleRequestQuantityChange(scope.row)"
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
            <el-table-column prop="location" label="库位" width="100">
              <template #default="scope">
                <el-select v-model="scope.row.location" placeholder="选择库位" size="small">
                  <el-option
                    v-for="location in getMaterialLocations(scope.row.materialId)"
                    :key="location"
                    :label="location"
                    :value="location"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="备注" width="150">
              <template #default="scope">
                <el-input
                  v-model="scope.row.remark"
                  placeholder="备注"
                  size="small"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="pickingDialogVisible = false">取消</el-button>
          <el-button @click="handleSaveDraft">保存草稿</el-button>
          <el-button type="primary" @click="handleSubmitPicking">提交</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 领料单详情对话框 -->
    <el-dialog
      v-model="pickingDetailVisible"
      title="领料单详情"
      width="80%"
      @close="handlePickingDetailClose"
    >
      <div v-if="currentPicking" class="picking-detail">
        <div class="detail-header">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="领料单号">{{ currentPicking.pickingCode }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getPickingStatusType(currentPicking.status)">
                {{ currentPicking.statusText }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="关联订单">{{ currentPicking.orderCode }}</el-descriptions-item>
            <el-descriptions-item label="产品名称">{{ currentPicking.productName }}</el-descriptions-item>
            <el-descriptions-item label="申请人">{{ currentPicking.applicant }}</el-descriptions-item>
            <el-descriptions-item label="申请部门">{{ currentPicking.department }}</el-descriptions-item>
            <el-descriptions-item label="申请时间">{{ formatDateTime(currentPicking.applyTime) }}</el-descriptions-item>
            <el-descriptions-item label="预计领用日期">{{ formatDate(currentPicking.expectedDate) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ currentPicking.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section mt-4">
          <h4>物料明细</h4>
          <el-table
            :data="currentPicking.items"
            style="width: 100%"
            height="400"
          >
            <el-table-column prop="materialCode" label="物料编码" width="160" />
            <el-table-column prop="materialName" label="物料名称" width="180" />
            <el-table-column prop="specification" label="规格型号" width="150" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="requestQuantity" label="申请数量" width="100" align="right" />
            <el-table-column prop="actualQuantity" label="实发数量" width="100" align="right" />
            <el-table-column prop="batchNo" label="批次号" width="120" />
            <el-table-column prop="location" label="库位" width="100" />
            <el-table-column prop="issuer" label="发料人" width="100" />
            <el-table-column prop="issueTime" label="发料时间" width="180" format-show="datetime" />
            <el-table-column prop="remark" label="备注" width="150" />
          </el-table>
        </div>

        <div v-if="currentPicking.operationLogs && currentPicking.operationLogs.length > 0" class="detail-section mt-4">
          <h4>操作日志</h4>
          <el-timeline>
            <el-timeline-item
              v-for="log in currentPicking.operationLogs"
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
          <el-button @click="pickingDetailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus, Download } from '@element-plus/icons-vue';

// 搜索表单
const searchForm = reactive({
  orderType: '',
  orderCode: '',
  workshop: ''
});

// 订单列表数据
const orderList = ref([]);
const loading = ref(false);
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 领料单列表数据
const pickingList = ref([]);
const pickingLoading = ref(false);
const pickingPagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 选中的订单
const selectedOrders = ref([]);
// 选中的领料单
const selectedPickings = ref([]);
// 选中的物料项
const selectedItems = ref([]);

// 对话框状态
const dialogVisible = ref(false);
const pickingDialogVisible = ref(false);
const pickingDetailVisible = ref(false);

// 当前操作的订单和领料单
const currentOrder = ref(null);
const currentPicking = ref(null);
const isEditMode = ref(false);

// 领料单表单
const pickingForm = reactive({
  id: '',
  pickingCode: '',
  orderCode: '',
  productInfo: '',
  applicant: '',
  department: '',
  expectedDate: '',
  isUrgent: false,
  remark: ''
});

// 领料单物料明细
const pickingItems = ref([]);
const pickingItemsLoading = ref(false);

// 模拟数据 - 物料批次和库位信息
const materialBatches = {
  'M001': [{ batchNo: 'B20240101', quantity: 500 }, { batchNo: 'B20240201', quantity: 300 }],
  'M002': [{ batchNo: 'B20240102', quantity: 200 }, { batchNo: 'B20240202', quantity: 400 }],
  'M003': [{ batchNo: 'B20240103', quantity: 150 }],
  'M004': [{ batchNo: 'B20240104', quantity: 100 }, { batchNo: 'B20240204', quantity: 200 }],
  'M005': [{ batchNo: 'B20240105', quantity: 80 }]
};

const materialLocations = {
  'M001': ['A01', 'A02'],
  'M002': ['B01', 'B02', 'B03'],
  'M003': ['C01'],
  'M004': ['D01', 'D02'],
  'M005': ['E01']
};

// 获取物料批次列表
const getMaterialBatches = (materialId) => {
  return materialBatches[materialId] || [];
};

// 获取物料库位列表
const getMaterialLocations = (materialId) => {
  return materialLocations[materialId] || [];
};

// 获取状态对应的标签类型
const getStatusType = (status) => {
  const typeMap = {
    'pending': 'info',
    'partial': 'warning',
    'completed': 'success',
    'shortage': 'danger'
  };
  return typeMap[status] || 'default';
};

// 获取库存状态对应的标签类型
const getStockStatusType = (status) => {
  const typeMap = {
    'sufficient': 'success',
    'partial': 'warning',
    'shortage': 'danger'
  };
  return typeMap[status] || 'default';
};

// 获取领料单状态对应的标签类型
const getPickingStatusType = (status) => {
  const typeMap = {
    'draft': 'info',
    'submitted': 'primary',
    'approved': 'success',
    'rejected': 'danger',
    'part_issued': 'warning',
    'fully_issued': 'success',
    'cancelled': 'danger'
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

// 模拟生成订单数据
const generateMockOrderData = () => {
  const orderTypes = ['production', 'sales', 'other'];
  const orderTypeTexts = ['生产工单', '销售订单', '其他'];
  const workshops = ['mechanical', 'assembly', 'welding'];
  const workshopTexts = ['机械加工车间', '装配车间', '焊接车间'];
  const materialStatuses = ['pending', 'partial', 'completed', 'shortage'];
  const materialStatusTexts = ['待领料', '部分领料', '已完成', '物料短缺'];
  const stockStatuses = ['sufficient', 'partial', 'shortage'];
  const stockStatusTexts = ['充足', '不足', '短缺'];
  
  const orders = [];
  const materials = [
    { id: 'M001', code: 'M001', name: '轴承', spec: '6205', unit: '个', stockQuantity: 450 },
    { id: 'M002', code: 'M002', name: '齿轮', spec: 'G301', unit: '个', stockQuantity: 320 },
    { id: 'M003', code: 'M003', name: '电机', spec: 'Y100L', unit: '台', stockQuantity: 80 },
    { id: 'M004', code: 'M004', name: '传送带', spec: 'B500', unit: '米', stockQuantity: 200 },
    { id: 'M005', code: 'M005', name: '控制面板', spec: 'P001', unit: '块', stockQuantity: 120 }
  ];
  
  for (let i = 1; i <= 50; i++) {
    const orderTypeIndex = Math.floor(Math.random() * orderTypes.length);
    const workshopIndex = Math.floor(Math.random() * workshops.length);
    const materialStatusIndex = Math.floor(Math.random() * materialStatuses.length);
    const orderCode = `${orderTypeTexts[orderTypeIndex].charAt(0)}${String(i).padStart(4, '0')}`;
    const productName = `产品${String(i).padStart(3, '0')}`;
    const productCode = `P${String(i).padStart(4, '0')}`;
    const quantity = Math.floor(Math.random() * 50) + 10;
    const requiredDate = new Date();
    requiredDate.setDate(requiredDate.getDate() + Math.floor(Math.random() * 30) + 1);
    
    // 为订单生成物料列表
    const materialList = [];
    const materialCount = Math.floor(Math.random() * 4) + 1;
    const shuffledMaterials = [...materials].sort(() => 0.5 - Math.random());
    
    for (let j = 0; j < materialCount; j++) {
      const material = shuffledMaterials[j];
      const requiredQuantity = Math.floor(Math.random() * 100) + 10;
      const issuedQuantity = materialStatusIndex > 0 ? Math.floor(Math.random() * requiredQuantity) : 0;
      const availableQuantity = Math.min(material.stockQuantity, requiredQuantity - issuedQuantity);
      const stockStatusIndex = availableQuantity >= requiredQuantity - issuedQuantity ? 0 : 
                              availableQuantity > 0 ? 1 : 2;
      
      materialList.push({
        materialId: material.id,
        materialCode: material.code,
        materialName: material.name,
        specification: material.spec,
        unit: material.unit,
        requiredQuantity,
        issuedQuantity,
        availableQuantity,
        stockQuantity: material.stockQuantity,
        stockStatus: stockStatuses[stockStatusIndex],
        stockStatusText: stockStatusTexts[stockStatusIndex]
      });
    }
    
    orders.push({
      id: String(i),
      orderCode,
      orderType: orderTypes[orderTypeIndex],
      orderTypeText: orderTypeTexts[orderTypeIndex],
      productName,
      productCode,
      quantity,
      workshop: workshops[workshopIndex],
      workshopText: workshopTexts[workshopIndex],
      requiredDate,
      materialStatus: materialStatuses[materialStatusIndex],
      materialStatusText: materialStatusTexts[materialStatusIndex],
      createdBy: `用户${Math.floor(Math.random() * 10) + 1}`,
      createdTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      materialList
    });
  }
  
  return orders;
};

// 模拟生成领料单数据
const generateMockPickingData = () => {
  const statuses = ['draft', 'submitted', 'approved', 'rejected', 'part_issued', 'fully_issued', 'cancelled'];
  const statusTexts = ['草稿', '已提交', '已批准', '已拒绝', '部分发料', '全部发料', '已取消'];
  
  const pickings = [];
  
  for (let i = 1; i <= 30; i++) {
    const statusIndex = Math.floor(Math.random() * statuses.length);
    const pickingCode = `MC${String(i).padStart(4, '0')}`;
    const orderCode = `${i % 2 === 0 ? '生' : '销'}${String(i).padStart(4, '0')}`;
    const productName = `产品${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`;
    const materialCount = Math.floor(Math.random() * 4) + 1;
    const requestAmount = Math.floor(Math.random() * 500) + 100;
    const isUrgent = Math.random() > 0.8;
    const applyTime = new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000);
    
    // 模拟操作日志
    const operationLogs = [
      {
        id: String(i * 10 + 1),
        operator: `管理员${Math.floor(Math.random() * 5) + 1}`,
        operationType: 'create',
        operationTypeText: '创建领料单',
        operationTime: applyTime
      }
    ];
    
    if (statusIndex >= 1) {
      const submitTime = new Date(applyTime);
      submitTime.setHours(submitTime.getHours() + Math.floor(Math.random() * 24));
      operationLogs.push({
        id: String(i * 10 + 2),
        operator: `用户${Math.floor(Math.random() * 10) + 1}`,
        operationType: 'submit',
        operationTypeText: '提交领料单',
        operationTime: submitTime
      });
    }
    
    if (statusIndex >= 2 || statusIndex === 3) {
      const reviewTime = new Date(applyTime);
      reviewTime.setHours(reviewTime.getHours() + Math.floor(Math.random() * 48) + 24);
      operationLogs.push({
        id: String(i * 10 + 3),
        operator: `审批人${Math.floor(Math.random() * 3) + 1}`,
        operationType: statusIndex === 3 ? 'reject' : 'approve',
        operationTypeText: statusIndex === 3 ? '拒绝领料单' : '批准领料单',
        operationTime: reviewTime,
        remark: statusIndex === 3 ? '物料库存不足，暂不批准' : ''
      });
    }
    
    if (statusIndex >= 4) {
      const issueTime = new Date(applyTime);
      issueTime.setHours(issueTime.getHours() + Math.floor(Math.random() * 72) + 48);
      operationLogs.push({
        id: String(i * 10 + 4),
        operator: `仓库员${Math.floor(Math.random() * 5) + 1}`,
        operationType: 'issue',
        operationTypeText: statusIndex === 4 ? '部分发料' : '全部发料',
        operationTime: issueTime
      });
    }
    
    if (statusIndex === 6) {
      const cancelTime = new Date(applyTime);
      cancelTime.setHours(cancelTime.getHours() + Math.floor(Math.random() * 24));
      operationLogs.push({
        id: String(i * 10 + 5),
        operator: `用户${Math.floor(Math.random() * 10) + 1}`,
        operationType: 'cancel',
        operationTypeText: '取消领料单',
        operationTime: cancelTime,
        remark: '生产计划变更'
      });
    }
    
    // 按时间排序日志
    operationLogs.sort((a, b) => new Date(a.operationTime) - new Date(b.operationTime));
    
    // 模拟物料明细
    const materials = [
      { id: 'M001', code: 'M001', name: '轴承', spec: '6205', unit: '个' },
      { id: 'M002', code: 'M002', name: '齿轮', spec: 'G301', unit: '个' },
      { id: 'M003', code: 'M003', name: '电机', spec: 'Y100L', unit: '台' },
      { id: 'M004', code: 'M004', name: '传送带', spec: 'B500', unit: '米' },
      { id: 'M005', code: 'M005', name: '控制面板', spec: 'P001', unit: '块' }
    ];
    
    const items = [];
    const shuffledMaterials = [...materials].sort(() => 0.5 - Math.random());
    
    for (let j = 0; j < materialCount; j++) {
      const material = shuffledMaterials[j];
      const requestQuantity = Math.floor(Math.random() * 100) + 10;
      const actualQuantity = statusIndex >= 4 ? (statusIndex === 4 ? Math.floor(requestQuantity * 0.7) : requestQuantity) : 0;
      
      items.push({
        materialId: material.id,
        materialCode: material.code,
        materialName: material.name,
        specification: material.spec,
        unit: material.unit,
        requestQuantity,
        actualQuantity,
        batchNo: statusIndex >= 4 ? `B${String(Math.floor(Math.random() * 10000)).padStart(8, '0')}` : '',
        location: statusIndex >= 4 ? `${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${String(Math.floor(Math.random() * 10)).padStart(2, '0')}` : '',
        issuer: statusIndex >= 4 ? `仓库员${Math.floor(Math.random() * 5) + 1}` : '',
        issueTime: statusIndex >= 4 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        remark: ''
      });
    }
    
    pickings.push({
      id: String(i),
      pickingCode,
      orderCode,
      productName,
      materialCount,
      requestAmount,
      status: statuses[statusIndex],
      statusText: statusTexts[statusIndex],
      isUrgent,
      applicant: `申请人${Math.floor(Math.random() * 10) + 1}`,
      department: `部门${Math.floor(Math.random() * 5) + 1}`,
      applyTime,
      expectedDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
      remark: Math.random() > 0.5 ? '正常领料' : '',
      items,
      operationLogs
    });
  }
  
  return pickings;
};

// 获取订单列表
const getOrderList = () => {
  loading.value = true;
  
  // 模拟API调用延迟
  setTimeout(() => {
    const mockData = generateMockOrderData();
    
    // 根据搜索条件过滤
    let filteredData = mockData;
    if (searchForm.orderType) {
      filteredData = filteredData.filter(item => item.orderType === searchForm.orderType);
    }
    if (searchForm.orderCode) {
      const keyword = searchForm.orderCode.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.orderCode.toLowerCase().includes(keyword) ||
        item.productName.toLowerCase().includes(keyword)
      );
    }
    if (searchForm.workshop) {
      filteredData = filteredData.filter(item => item.workshop === searchForm.workshop);
    }
    
    // 分页
    pagination.total = filteredData.length;
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    orderList.value = filteredData.slice(startIndex, endIndex);
    
    loading.value = false;
  }, 500);
};

// 获取领料单列表
const getPickingList = () => {
  pickingLoading.value = true;
  
  // 模拟API调用延迟
  setTimeout(() => {
    const mockData = generateMockPickingData();
    
    // 分页
    pickingPagination.total = mockData.length;
    const startIndex = (pickingPagination.currentPage - 1) * pickingPagination.pageSize;
    const endIndex = startIndex + pickingPagination.pageSize;
    pickingList.value = mockData.slice(startIndex, endIndex);
    
    pickingLoading.value = false;
  }, 500);
};

// 获取订单物料明细
const getOrderMaterials = (orderId) => {
  pickingItemsLoading.value = true;
  
  // 模拟API调用延迟
  setTimeout(() => {
    const mockOrder = generateMockOrderData().find(order => order.id === orderId);
    if (mockOrder) {
      // 转换物料列表为领料单物料项
      pickingItems.value = mockOrder.materialList.map(material => ({
        materialId: material.materialId,
        materialCode: material.materialCode,
        materialName: material.materialName,
        specification: material.specification,
        unit: material.unit,
        requiredQuantity: material.requiredQuantity,
        availableQuantity: material.availableQuantity,
        requestQuantity: material.availableQuantity,
        batchNo: '',
        location: '',
        remark: ''
      }));
    }
    
    pickingItemsLoading.value = false;
  }, 300);
};

// 获取领料单详情
const getPickingDetail = (pickingId) => {
  // 模拟API调用延迟
  setTimeout(() => {
    const mockData = generateMockPickingData();
    currentPicking.value = mockData.find(picking => picking.id === pickingId);
    pickingDetailVisible.value = true;
  }, 300);
};

// 搜索订单
const handleSearch = () => {
  pagination.currentPage = 1;
  getOrderList();
};

// 重置搜索条件
const handleReset = () => {
  searchForm.orderType = '';
  searchForm.orderCode = '';
  searchForm.workshop = '';
  pagination.currentPage = 1;
  getOrderList();
};

// 分页处理
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  getOrderList();
};

const handleCurrentChange = (current) => {
  pagination.currentPage = current;
  getOrderList();
};

const handlePickingSizeChange = (size) => {
  pickingPagination.pageSize = size;
  getPickingList();
};

const handlePickingCurrentChange = (current) => {
  pickingPagination.currentPage = current;
  getPickingList();
};

// 选择订单
const handleSelectionChange = (selection) => {
  selectedOrders.value = selection;
};

// 选择领料单
const handlePickingSelectionChange = (selection) => {
  selectedPickings.value = selection;
};

// 选择物料项
const handleItemSelectionChange = (selection) => {
  selectedItems.value = selection;
};

// 查看订单详情
const handleViewOrder = (row) => {
  currentOrder.value = { ...row };
  dialogVisible.value = true;
};

// 为订单申请领料
const handlePickingOrder = (row) => {
  preparePickingForm(row);
  getOrderMaterials(row.id);
  pickingDialogVisible.value = true;
};

// 为当前订单申请领料
const handlePickingCurrentOrder = () => {
  if (currentOrder.value) {
    preparePickingForm(currentOrder.value);
    getOrderMaterials(currentOrder.value.id);
    dialogVisible.value = false;
    pickingDialogVisible.value = true;
  }
};

// 准备领料单表单
const preparePickingForm = (order) => {
  isEditMode.value = false;
  pickingForm.id = '';
  pickingForm.pickingCode = '';
  pickingForm.orderCode = order.orderCode;
  pickingForm.productInfo = `${order.productName} (${order.productCode})`;
  pickingForm.applicant = `当前用户`; // 实际应从登录信息获取
  pickingForm.department = `生产部门`;
  pickingForm.expectedDate = '';
  pickingForm.isUrgent = false;
  pickingForm.remark = '';
};

// 新建领料单
const handleCreatePicking = () => {
  isEditMode.value = false;
  Object.assign(pickingForm, {
    id: '',
    pickingCode: '',
    orderCode: '',
    productInfo: '',
    applicant: `当前用户`,
    department: `生产部门`,
    expectedDate: '',
    isUrgent: false,
    remark: ''
  });
  pickingItems.value = [];
  pickingDialogVisible.value = true;
};

// 查看领料单
const handleViewPicking = (row) => {
  getPickingDetail(row.id);
};

// 编辑领料单
const handleEditPicking = (row) => {
  isEditMode.value = true;
  pickingForm.id = row.id;
  pickingForm.pickingCode = row.pickingCode;
  pickingForm.orderCode = row.orderCode;
  pickingForm.productInfo = `${row.productName}`;
  pickingForm.applicant = row.applicant;
  pickingForm.department = row.department;
  pickingForm.expectedDate = row.expectedDate;
  pickingForm.isUrgent = row.isUrgent;
  pickingForm.remark = row.remark || '';
  
  // 设置物料项
  pickingItems.value = row.items.map(item => ({
    materialId: item.materialId,
    materialCode: item.materialCode,
    materialName: item.materialName,
    specification: item.specification,
    unit: item.unit,
    requiredQuantity: item.requestQuantity,
    availableQuantity: item.requestQuantity - item.actualQuantity,
    requestQuantity: item.requestQuantity - item.actualQuantity,
    batchNo: item.batchNo || '',
    location: item.location || '',
    remark: item.remark || ''
  }));
  
  pickingDialogVisible.value = true;
};

// 取消领料单
const handleCancelPicking = (row) => {
  ElMessageBox.confirm(
    `确定要取消领料单 ${row.pickingCode} 吗？`,
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
        getPickingList();
      }, 300);
    })
    .catch(() => {
      // 取消操作
    });
};

// 保存草稿
const handleSaveDraft = () => {
  // 验证表单
  if (!pickingForm.orderCode) {
    ElMessage.warning('请输入订单编号');
    return;
  }
  
  // 验证物料项
  const validItems = pickingItems.value.filter(item => item.requestQuantity > 0);
  if (validItems.length === 0) {
    ElMessage.warning('请至少选择一种物料并填写申请数量');
    return;
  }
  
  // 模拟API调用
  setTimeout(() => {
    ElMessage.success('草稿保存成功');
    pickingDialogVisible.value = false;
    getPickingList();
  }, 300);
};

// 提交领料单
const handleSubmitPicking = () => {
  // 验证表单
  if (!pickingForm.orderCode) {
    ElMessage.warning('请输入订单编号');
    return;
  }
  if (!pickingForm.applicant) {
    ElMessage.warning('请输入申请人');
    return;
  }
  if (!pickingForm.department) {
    ElMessage.warning('请输入申请部门');
    return;
  }
  
  // 验证物料项
  const validItems = pickingItems.value.filter(item => item.requestQuantity > 0);
  if (validItems.length === 0) {
    ElMessage.warning('请至少选择一种物料并填写申请数量');
    return;
  }
  
  // 检查是否都填写了批次和库位
  const incompleteItems = validItems.filter(item => !item.batchNo || !item.location);
  if (incompleteItems.length > 0) {
    ElMessageBox.confirm(
      '部分物料未选择批次和库位，是否继续提交？',
      '提示',
      {
        confirmButtonText: '继续提交',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
      .then(() => {
        submitPicking();
      })
      .catch(() => {
        // 取消操作
      });
  } else {
    submitPicking();
  }
};

// 执行提交
const submitPicking = () => {
  // 模拟API调用
  setTimeout(() => {
    ElMessage.success('领料单提交成功');
    pickingDialogVisible.value = false;
    getPickingList();
  }, 500);
};

// 导出领料单
const handleExport = () => {
  if (selectedPickings.value.length > 0) {
    // 导出选中的领料单
    setTimeout(() => {
      ElMessage.success(`已导出 ${selectedPickings.value.length} 个领料单`);
    }, 500);
  } else {
    // 导出当前页的领料单
    setTimeout(() => {
      ElMessage.success(`已导出 ${pickingList.value.length} 个领料单`);
    }, 500);
  }
};

// 返回
const handleBack = () => {
  // 实际应使用路由返回
  ElMessage.info('返回上一页');
};

// 处理申请数量变化
const handleRequestQuantityChange = (row) => {
  if (row.requestQuantity > row.availableQuantity) {
    row.requestQuantity = row.availableQuantity;
    ElMessage.warning(`申请数量不能超过可领数量 ${row.availableQuantity}`);
  }
};

// 关闭对话框
const handleDialogClose = () => {
  currentOrder.value = null;
};

const handlePickingDialogClose = () => {
  // 清空表单
};

const handlePickingDetailClose = () => {
  currentPicking.value = null;
};

// 组件挂载时获取数据
onMounted(() => {
  getOrderList();
  getPickingList();
});
</script>

<style scoped>
.material-picking-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.search-bar {
  padding: 10px 0;
}

.order-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.order-list-header .title {
  font-size: 16px;
  font-weight: 500;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.order-detail,
.picking-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-header {
  margin-bottom: 20px;
}

.detail-section h4 {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 500;
}

.picking-form {
  max-height: 70vh;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table__row .el-tag + .el-tag) {
  margin-left: 5px;
}
</style>