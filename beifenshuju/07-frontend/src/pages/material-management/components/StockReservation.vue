/home/sardenesy/workspace/07-frontend/src/pages/material-management/components/StockReservation.vue
<template>
  <div class="stock-reservation">
    <div class="reservation-header">
      <h3>{{ title || '库存预留' }}</h3>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="createReservation" :disabled="disabled">
          <el-icon><Plus /></el-icon> 创建预留
        </el-button>
        <el-button type="success" size="small" @click="confirmSelectedReservations" :disabled="selectedReservations.length === 0 || disabled">
          <el-icon><Check /></el-icon> 确认选中
        </el-button>
        <el-button type="danger" size="small" @click="cancelSelectedReservations" :disabled="selectedReservations.length === 0 || disabled">
          <el-icon><Close /></el-icon> 取消选中
        </el-button>
      </div>
    </div>
    
    <div class="reservation-content">
      <!-- 搜索和筛选区域 -->
      <el-card class="search-card" shadow="hover">
        <el-form :model="searchForm" label-width="100px" size="small">
          <div class="search-row">
            <el-form-item label="预留编号">
              <el-input v-model="searchForm.reservationCode" placeholder="输入预留编号" />
            </el-form-item>
            
            <el-form-item label="物料编码">
              <el-input v-model="searchForm.materialCode" placeholder="输入物料编码" />
            </el-form-item>
            
            <el-form-item label="预留类型">
              <el-select v-model="searchForm.reservationType" placeholder="选择预留类型">
                <el-option label="全部" value=""></el-option>
                <el-option label="生产预留" value="production"></el-option>
                <el-option label="销售预留" value="sales"></el-option>
                <el-option label="项目预留" value="project"></el-option>
                <el-option label="其他预留" value="other"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="预留状态">
              <el-select v-model="searchForm.reservationStatus" placeholder="选择预留状态">
                <el-option label="全部" value=""></el-option>
                <el-option label="已创建" value="created"></el-option>
                <el-option label="已确认" value="confirmed"></el-option>
                <el-option label="已使用" value="used"></el-option>
                <el-option label="已取消" value="cancelled"></el-option>
                <el-option label="已过期" value="expired"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="searchReservations">搜索</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </div>
        </el-form>
      </el-card>
      
      <!-- 预留列表 -->
      <el-card class="reservation-list-card" shadow="hover" style="margin-top: 20px;">
        <el-table 
          v-loading="loading" 
          :data="reservationsData" 
          style="width: 100%"
          @selection-change="handleSelectionChange"
          border
          height="500"
        >
          <el-table-column type="selection" width="55"></el-table-column>
          
          <el-table-column prop="reservationCode" label="预留编号" width="160" sortable>
            <template #default="scope">
              <el-link type="primary" :underline="false" @click="viewReservationDetail(scope.row)">
                {{ scope.row.reservationCode }}
              </el-link>
            </template>
          </el-table-column>
          
          <el-table-column prop="reservationType" label="预留类型" width="120">
            <template #default="scope">
              <el-tag :type="getReservationTypeTag(scope.row.reservationType)" effect="light">
                {{ getReservationTypeName(scope.row.reservationType) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="materialCode" label="物料编码" width="140"></el-table-column>
          
          <el-table-column prop="materialName" label="物料名称" min-width="180">
            <template #default="scope">
              <div class="material-info">
                <div class="name">{{ scope.row.materialName }}</div>
                <div class="spec">{{ scope.row.specification }}</div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="quantity" label="预留数量" width="120" align="right">
            <template #default="scope">
              <div class="quantity-info">
                <span class="quantity">{{ scope.row.quantity }}</span>
                <span class="unit">{{ scope.row.unit }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="usedQuantity" label="已用数量" width="120" align="right">
            <template #default="scope">
              <div class="quantity-info">
                <span class="quantity">{{ scope.row.usedQuantity || 0 }}</span>
                <span class="unit">{{ scope.row.unit }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="availableQuantity" label="可用数量" width="120" align="right">
            <template #default="scope">
              <div class="quantity-info">
                <span class="quantity available">{{ scope.row.availableQuantity }}</span>
                <span class="unit">{{ scope.row.unit }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="reservationStatus" label="预留状态" width="100">
            <template #default="scope">
              <el-tag :type="getReservationStatusTag(scope.row.reservationStatus)" effect="dark">
                {{ getReservationStatusName(scope.row.reservationStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="reservationDate" label="预留日期" width="150" sortable>
            <template #default="scope">
              {{ formatDate(scope.row.reservationDate) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="expiryDate" label="有效期至" width="150" sortable>
            <template #default="scope">
              <div :class="{ 'expired': isExpired(scope.row.expiryDate) }">
                {{ formatDate(scope.row.expiryDate) }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="relatedOrderCode" label="关联单据" width="160">
            <template #default="scope">
              <el-link v-if="scope.row.relatedOrderCode" type="info" :underline="false">
                {{ scope.row.relatedOrderCode }}
              </el-link>
              <span v-else>-</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="creator" label="创建人" width="100"></el-table-column>
          
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button 
                v-if="scope.row.reservationStatus === 'created'" 
                type="primary" 
                size="small" 
                text 
                @click="confirmReservation(scope.row)"
                :disabled="disabled"
              >
                确认
              </el-button>
              <el-button 
                v-if="['created', 'confirmed'].includes(scope.row.reservationStatus)" 
                type="danger" 
                size="small" 
                text 
                @click="cancelReservation(scope.row)"
                :disabled="disabled"
              >
                取消
              </el-button>
              <el-button 
                type="info" 
                size="small" 
                text 
                @click="viewReservationDetail(scope.row)"
              >
                详情
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
    </div>
    
    <!-- 创建/编辑预留对话框 -->
    <el-dialog
      v-model="reservationDialogVisible"
      :title="isEditMode ? '编辑库存预留' : '创建库存预留'"
      width="700px"
      @close="handleDialogClose"
    >
      <el-form 
        ref="reservationFormRef" 
        :model="reservationForm" 
        label-width="120px"
        :rules="reservationRules"
      >
        <div class="form-row">
          <el-form-item label="预留类型" prop="reservationType">
            <el-select v-model="reservationForm.reservationType" placeholder="选择预留类型">
              <el-option label="生产预留" value="production"></el-option>
              <el-option label="销售预留" value="sales"></el-option>
              <el-option label="项目预留" value="project"></el-option>
              <el-option label="其他预留" value="other"></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="关联单据" prop="relatedOrderCode">
            <el-input v-model="reservationForm.relatedOrderCode" placeholder="输入关联单据号" />
          </el-form-item>
        </div>
        
        <div class="form-row">
          <el-form-item label="物料选择" prop="materialId">
            <el-select 
              v-model="reservationForm.materialId" 
              placeholder="选择物料"
              filterable
              :remote="true"
              :remote-method="remoteSearchMaterials"
              :loading="materialSearchLoading"
              value-key="id"
              @change="handleMaterialChange"
            >
              <template #prefix>
                <el-icon class="el-input__icon"><Search /></el-icon>
              </template>
              <template #option="{ item }">
                <div class="material-option">
                  <div class="option-code">{{ item.code }}</div>
                  <div class="option-name">{{ item.name }} ({{ item.specification }})</div>
                  <div class="option-stock">库存: {{ item.stockQuantity }} {{ item.unit }}</div>
                </div>
              </template>
            </el-select>
          </el-form-item>
        </div>
        
        <div v-if="selectedMaterial" class="material-preview">
          <el-divider>物料信息</el-divider>
          <div class="preview-content">
            <span><strong>编码:</strong> {{ selectedMaterial.code }}</span>
            <span><strong>名称:</strong> {{ selectedMaterial.name }}</span>
            <span><strong>规格:</strong> {{ selectedMaterial.specification }}</span>
            <span><strong>单位:</strong> {{ selectedMaterial.unit }}</span>
            <span><strong>当前库存:</strong> <span class="stock">{{ selectedMaterial.stockQuantity }}</span></span>
            <span><strong>可用库存:</strong> <span class="available-stock">{{ selectedMaterial.availableStock }}</span></span>
          </div>
        </div>
        
        <div class="form-row">
          <el-form-item label="预留数量" prop="quantity">
            <el-input-number
              v-model="reservationForm.quantity"
              :min="0"
              :max="getMaxQuantity()"
              :step="1"
              placeholder="输入预留数量"
            >
              <template #append>{{ selectedMaterial?.unit || '' }}</template>
            </el-input-number>
          </el-form-item>
          
          <el-form-item label="有效期至" prop="expiryDate">
            <el-date-picker
              v-model="reservationForm.expiryDate"
              type="date"
              placeholder="选择有效期"
              :min-date="new Date()"
              style="width: 100%"
            />
          </el-form-item>
        </div>
        
        <div class="form-row">
          <el-form-item label="仓库" prop="warehouseId">
            <el-select v-model="reservationForm.warehouseId" placeholder="选择仓库">
              <el-option v-for="warehouse in warehouses" :key="warehouse.id" :label="warehouse.name" :value="warehouse.id" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="库位" prop="locationId">
            <el-select v-model="reservationForm.locationId" placeholder="选择库位">
              <el-option v-for="location in locations" :key="location.id" :label="location.code" :value="location.id" />
            </el-select>
          </el-form-item>
        </div>
        
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="reservationForm.remark"
            type="textarea"
            :rows="3"
            placeholder="输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="reservationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveReservation">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 预留详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="预留详情"
      width="700px"
      @close="handleDetailDialogClose"
    >
      <div v-if="currentReservation" class="reservation-detail">
        <div class="detail-section">
          <h4>基本信息</h4>
          <el-descriptions :column="2" :border="true">
            <el-descriptions-item label="预留编号">{{ currentReservation.reservationCode }}</el-descriptions-item>
            <el-descriptions-item label="预留类型">{{ getReservationTypeName(currentReservation.reservationType) }}</el-descriptions-item>
            <el-descriptions-item label="预留状态">{{ getReservationStatusName(currentReservation.reservationStatus) }}</el-descriptions-item>
            <el-descriptions-item label="关联单据">{{ currentReservation.relatedOrderCode || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建日期">{{ formatDateTime(currentReservation.reservationDate) }}</el-descriptions-item>
            <el-descriptions-item label="有效期至">{{ formatDate(currentReservation.expiryDate) }}</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ currentReservation.creator }}</el-descriptions-item>
            <el-descriptions-item label="确认人">{{ currentReservation.confirmer || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-section">
          <h4>物料信息</h4>
          <el-descriptions :column="2" :border="true">
            <el-descriptions-item label="物料编码">{{ currentReservation.materialCode }}</el-descriptions-item>
            <el-descriptions-item label="物料名称">{{ currentReservation.materialName }}</el-descriptions-item>
            <el-descriptions-item label="规格型号">{{ currentReservation.specification }}</el-descriptions-item>
            <el-descriptions-item label="单位">{{ currentReservation.unit }}</el-descriptions-item>
            <el-descriptions-item label="预留数量">{{ currentReservation.quantity }} {{ currentReservation.unit }}</el-descriptions-item>
            <el-descriptions-item label="已用数量">{{ currentReservation.usedQuantity || 0 }} {{ currentReservation.unit }}</el-descriptions-item>
            <el-descriptions-item label="可用数量">{{ currentReservation.availableQuantity }} {{ currentReservation.unit }}</el-descriptions-item>
            <el-descriptions-item label="仓库库位">{{ currentReservation.warehouseName }} - {{ currentReservation.locationCode }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-section">
          <h4>备注信息</h4>
          <el-descriptions :column="1" :border="true">
            <el-descriptions-item label="备注">{{ currentReservation.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-section" v-if="currentReservation.history && currentReservation.history.length > 0">
          <h4>操作历史</h4>
          <el-timeline>
            <el-timeline-item 
              v-for="(item, index) in currentReservation.history" 
              :key="index"
              :timestamp="formatDateTime(item.operateTime)"
              :type="getHistoryType(item.operateType)"
            >
              {{ item.operateDesc }} - 操作人: {{ item.operator }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { Plus, Check, Close, Search } from '@element-plus/icons-vue';

// Props
const props = defineProps({
  title: {
    type: String,
    default: '库存预留'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['create', 'update', 'confirm', 'cancel']);

// 响应式数据
const loading = ref(false);
const reservations = ref([]);
const selectedReservations = ref([]);
const reservationDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const isEditMode = ref(false);
const currentReservation = ref(null);
const selectedMaterial = ref(null);
const materialSearchLoading = ref(false);

// 搜索表单
const searchForm = reactive({
  reservationCode: '',
  materialCode: '',
  reservationType: '',
  reservationStatus: ''
});

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
});

// 预留表单
const reservationForm = reactive({
  id: '',
  reservationCode: '',
  reservationType: 'production',
  materialId: '',
  quantity: 0,
  expiryDate: '',
  warehouseId: '',
  locationId: '',
  relatedOrderCode: '',
  remark: ''
});

// 表单验证规则
const reservationRules = {
  reservationType: [{ required: true, message: '请选择预留类型', trigger: 'change' }],
  materialId: [{ required: true, message: '请选择物料', trigger: 'change' }],
  quantity: [
    { required: true, message: '请输入预留数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '预留数量必须大于0', trigger: 'blur' }
  ],
  expiryDate: [{ required: true, message: '请选择有效期', trigger: 'change' }],
  warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }]
};

// 仓库和库位数据
const warehouses = ref([
  { id: '1', name: '原材料仓' },
  { id: '2', name: '半成品仓' },
  { id: '3', name: '成品仓' },
  { id: '4', name: '辅料仓' }
]);

const locations = ref([
  { id: '1', code: 'A-01-01', warehouseId: '1' },
  { id: '2', code: 'A-01-02', warehouseId: '1' },
  { id: '3', code: 'B-01-01', warehouseId: '2' },
  { id: '4', code: 'B-01-02', warehouseId: '2' },
  { id: '5', code: 'C-01-01', warehouseId: '3' },
  { id: '6', code: 'C-01-02', warehouseId: '3' },
  { id: '7', code: 'D-01-01', warehouseId: '4' }
]);

// 计算属性 - 过滤后的库位列表
const filteredLocations = computed(() => {
  if (!reservationForm.warehouseId) return [];
  return locations.value.filter(location => location.warehouseId === reservationForm.warehouseId);
});

// 计算属性 - 分页后的数据
const reservationsData = computed(() => {
  const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  return reservations.value.slice(startIndex, endIndex);
});

// 监听仓库选择变化
watch(() => reservationForm.warehouseId, (newWarehouseId) => {
  // 当仓库改变时，重置库位选择
  if (newWarehouseId) {
    const firstLocation = filteredLocations.value[0];
    if (firstLocation) {
      reservationForm.locationId = firstLocation.id;
    } else {
      reservationForm.locationId = '';
    }
  }
});

// 方法
const handleSelectionChange = (val) => {
  selectedReservations.value = val;
};

const searchReservations = async () => {
  try {
    loading.value = true;
    // 实际项目中这里应该调用API搜索预留数据
    // 这里使用模拟数据并应用简单过滤
    let results = generateMockReservations();
    
    if (searchForm.reservationCode) {
      results = results.filter(item => item.reservationCode.includes(searchForm.reservationCode));
    }
    
    if (searchForm.materialCode) {
      results = results.filter(item => item.materialCode.includes(searchForm.materialCode));
    }
    
    if (searchForm.reservationType) {
      results = results.filter(item => item.reservationType === searchForm.reservationType);
    }
    
    if (searchForm.reservationStatus) {
      results = results.filter(item => item.reservationStatus === searchForm.reservationStatus);
    }
    
    reservations.value = results;
    pagination.total = results.length;
    pagination.currentPage = 1;
  } catch (error) {
    console.error('搜索预留失败:', error);
  } finally {
    loading.value = false;
  }
};

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = '';
  });
  searchReservations();
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
};

const handleCurrentChange = (current) => {
  pagination.currentPage = current;
};

const createReservation = () => {
  isEditMode.value = false;
  resetReservationForm();
  reservationDialogVisible.value = true;
};

const editReservation = (reservation) => {
  isEditMode.value = true;
  // 填充表单数据
  reservationForm.id = reservation.id;
  reservationForm.reservationCode = reservation.reservationCode;
  reservationForm.reservationType = reservation.reservationType;
  reservationForm.materialId = reservation.materialId;
  reservationForm.quantity = reservation.quantity;
  reservationForm.expiryDate = new Date(reservation.expiryDate);
  reservationForm.warehouseId = reservation.warehouseId;
  reservationForm.locationId = reservation.locationId;
  reservationForm.relatedOrderCode = reservation.relatedOrderCode;
  reservationForm.remark = reservation.remark;
  
  // 设置选中的物料
  selectedMaterial.value = {
    id: reservation.materialId,
    code: reservation.materialCode,
    name: reservation.materialName,
    specification: reservation.specification,
    unit: reservation.unit,
    stockQuantity: reservation.stockQuantity,
    availableStock: reservation.availableStock
  };
  
  reservationDialogVisible.value = true;
};

const saveReservation = async () => {
  // 验证表单
  const formRef = reservationFormRef.value;
  if (!formRef) return;
  
  try {
    await formRef.validate();
    
    // 准备保存数据
    const saveData = {
      ...reservationForm,
      materialCode: selectedMaterial.value.code,
      materialName: selectedMaterial.value.name,
      specification: selectedMaterial.value.specification,
      unit: selectedMaterial.value.unit
    };
    
    if (isEditMode.value) {
      // 更新预留
      emit('update', saveData);
    } else {
      // 创建预留
      emit('create', saveData);
    }
    
    reservationDialogVisible.value = false;
    searchReservations();
    ElMessage.success(isEditMode.value ? '更新成功' : '创建成功');
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error(isEditMode.value ? '更新失败' : '创建失败');
  }
};

const confirmReservation = async (reservation) => {
  try {
    // 确认预留
    emit('confirm', reservation);
    ElMessage.success('预留已确认');
    searchReservations();
  } catch (error) {
    console.error('确认失败:', error);
    ElMessage.error('确认失败');
  }
};

const cancelReservation = async (reservation) => {
  try {
    // 取消预留
    emit('cancel', reservation);
    ElMessage.success('预留已取消');
    searchReservations();
  } catch (error) {
    console.error('取消失败:', error);
    ElMessage.error('取消失败');
  }
};

const confirmSelectedReservations = () => {
  selectedReservations.value.forEach(reservation => {
    confirmReservation(reservation);
  });
};

const cancelSelectedReservations = () => {
  selectedReservations.value.forEach(reservation => {
    cancelReservation(reservation);
  });
};

const viewReservationDetail = (reservation) => {
  // 获取预留详情（包含操作历史）
  currentReservation.value = getReservationWithHistory(reservation);
  detailDialogVisible.value = true;
};

const remoteSearchMaterials = (query) => {
  materialSearchLoading.value = true;
  // 模拟搜索延迟
  setTimeout(() => {
    // 实际项目中这里应该调用API搜索物料
    materialSearchLoading.value = false;
  }, 500);
};

const handleMaterialChange = (material) => {
  if (material) {
    selectedMaterial.value = material;
  } else {
    selectedMaterial.value = null;
  }
};

const getMaxQuantity = () => {
  return selectedMaterial.value?.availableStock || 0;
};

const handleDialogClose = () => {
  resetReservationForm();
  reservationFormRef.value?.resetFields();
};

const handleDetailDialogClose = () => {
  currentReservation.value = null;
};

const resetReservationForm = () => {
  reservationForm.id = '';
  reservationForm.reservationCode = '';
  reservationForm.reservationType = 'production';
  reservationForm.materialId = '';
  reservationForm.quantity = 0;
  reservationForm.expiryDate = '';
  reservationForm.warehouseId = warehouses.value[0]?.id || '';
  reservationForm.locationId = '';
  reservationForm.relatedOrderCode = '';
  reservationForm.remark = '';
  selectedMaterial.value = null;
};

const getReservationTypeTag = (type) => {
  const tagMap = {
    production: 'primary',
    sales: 'success',
    project: 'warning',
    other: 'info'
  };
  return tagMap[type] || 'info';
};

const getReservationTypeName = (type) => {
  const nameMap = {
    production: '生产预留',
    sales: '销售预留',
    project: '项目预留',
    other: '其他预留'
  };
  return nameMap[type] || '未知类型';
};

const getReservationStatusTag = (status) => {
  const tagMap = {
    created: 'primary',
    confirmed: 'success',
    used: 'info',
    cancelled: 'danger',
    expired: 'warning'
  };
  return tagMap[status] || 'info';
};

const getReservationStatusName = (status) => {
  const nameMap = {
    created: '已创建',
    confirmed: '已确认',
    used: '已使用',
    cancelled: '已取消',
    expired: '已过期'
  };
  return nameMap[status] || '未知状态';
};

const getHistoryType = (type) => {
  const typeMap = {
    create: 'primary',
    confirm: 'success',
    use: 'info',
    cancel: 'danger',
    expire: 'warning'
  };
  return typeMap[type] || 'info';
};

const isExpired = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 生成模拟预留数据
const generateMockReservations = () => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  const lastWeek = new Date(now);
  lastWeek.setDate(now.getDate() - 7);
  
  return [
    {
      id: '1',
      reservationCode: 'RSV-20230601-001',
      reservationType: 'production',
      materialId: 'MAT-001',
      materialCode: 'MAT-001',
      materialName: '优质钢材',
      specification: 'φ10mm',
      unit: 'kg',
      quantity: 500,
      usedQuantity: 200,
      availableQuantity: 300,
      reservationStatus: 'confirmed',
      reservationDate: yesterday,
      expiryDate: nextWeek,
      warehouseId: '1',
      warehouseName: '原材料仓',
      locationId: '1',
      locationCode: 'A-01-01',
      relatedOrderCode: 'PO-20230601-001',
      creator: '张三',
      confirmer: '李四',
      remark: '生产订单所需钢材',
      stockQuantity: 1000,
      availableStock: 700
    },
    {
      id: '2',
      reservationCode: 'RSV-20230601-002',
      reservationType: 'sales',
      materialId: 'MAT-005',
      materialCode: 'MAT-005',
      materialName: '螺丝套件',
      specification: 'M6×20mm',
      unit: '袋',
      quantity: 100,
      usedQuantity: 0,
      availableQuantity: 100,
      reservationStatus: 'created',
      reservationDate: now,
      expiryDate: nextWeek,
      warehouseId: '4',
      warehouseName: '辅料仓',
      locationId: '7',
      locationCode: 'D-01-01',
      relatedOrderCode: 'SO-20230601-001',
      creator: '王五',
      confirmer: null,
      remark: '销售订单预留',
      stockQuantity: 300,
      availableStock: 200
    },
    {
      id: '3',
      reservationCode: 'RSV-20230601-003',
      reservationType: 'project',
      materialId: 'MAT-002',
      materialCode: 'MAT-002',
      materialName: '铝合金板',
      specification: '2000×1000×2mm',
      unit: '张',
      quantity: 50,
      usedQuantity: 30,
      availableQuantity: 20,
      reservationStatus: 'used',
      reservationDate: lastWeek,
      expiryDate: nextWeek,
      warehouseId: '1',
      warehouseName: '原材料仓',
      locationId: '2',
      locationCode: 'A-01-02',
      relatedOrderCode: 'PJ-20230601-001',
      creator: '赵六',
      confirmer: '孙七',
      remark: '项目X专用物料',
      stockQuantity: 200,
      availableStock: 150
    },
    {
      id: '4',
      reservationCode: 'RSV-20230601-004',
      reservationType: 'other',
      materialId: 'MAT-006',
      materialCode: 'MAT-006',
      materialName: '润滑油',
      specification: '10W-40',
      unit: '桶',
      quantity: 20,
      usedQuantity: 0,
      availableQuantity: 0,
      reservationStatus: 'cancelled',
      reservationDate: lastWeek,
      expiryDate: lastWeek,
      warehouseId: '4',
      warehouseName: '辅料仓',
      locationId: '7',
      locationCode: 'D-01-01',
      relatedOrderCode: '',
      creator: '周八',
      confirmer: '吴九',
      remark: '设备维护备用',
      stockQuantity: 50,
      availableStock: 30
    }
  ];
};

// 获取带操作历史的预留详情
const getReservationWithHistory = (reservation) => {
  const history = [
    {
      operateType: 'create',
      operateDesc: '创建预留单',
      operateTime: reservation.reservationDate,
      operator: reservation.creator
    }
  ];
  
  if (reservation.confirmer) {
    history.push({
      operateType: 'confirm',
      operateDesc: '确认预留单',
      operateTime: new Date(reservation.reservationDate.getTime() + 2 * 60 * 60 * 1000), // 假设创建后2小时确认
      operator: reservation.confirmer
    });
  }
  
  if (reservation.usedQuantity > 0) {
    history.push({
      operateType: 'use',
      operateDesc: `使用预留数量 ${reservation.usedQuantity} ${reservation.unit}`,
      operateTime: new Date(),
      operator: '系统'
    });
  }
  
  if (reservation.reservationStatus === 'cancelled') {
    history.push({
      operateType: 'cancel',
      operateDesc: '取消预留单',
      operateTime: new Date(),
      operator: '管理员'
    });
  }
  
  if (reservation.reservationStatus === 'expired') {
    history.push({
      operateType: 'expire',
      operateDesc: '预留单过期',
      operateTime: new Date(),
      operator: '系统'
    });
  }
  
  return {
    ...reservation,
    history: history.sort((a, b) => new Date(b.operateTime) - new Date(a.operateTime))
  };
};

// 表单引用
const reservationFormRef = ref(null);

// 初始化加载数据
searchReservations();
</script>

<style scoped>
.stock-reservation {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}

.reservation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.reservation-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.reservation-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-card,
.reservation-list-card {
  border-radius: 8px;
}

.search-row {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: end;
}

.search-row .el-form-item {
  margin-bottom: 0;
}

.material-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.material-info .name {
  font-weight: 500;
  color: #303133;
}

.material-info .spec {
  font-size: 12px;
  color: #909399;
}

.quantity-info {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 4px;
}

.quantity {
  font-weight: 600;
  color: #303133;
}

.quantity.available {
  color: #67c23a;
}

.unit {
  font-size: 12px;
  color: #909399;
}

.expired {
  color: #f56c6c;
  font-weight: 500;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.material-option {
  padding: 5px 0;
}

.option-code {
  font-weight: 600;
  color: #409eff;
  font-size: 13px;
}

.option-name {
  color: #303133;
  font-size: 14px;
  margin: 2px 0;
}

.option-stock {
  font-size: 12px;
  color: #909399;
}

.material-preview {
  margin: 15px 0;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.preview-content {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 10px;
}

.preview-content span {
  font-size: 13px;
  color: #606266;
}

.preview-content .stock {
  color: #67c23a;
  font-weight: 600;
}

.preview-content .available-stock {
  color: #f56c6c;
  font-weight: 600;
}

.reservation-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  margin-bottom: 10px;
}

.detail-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-row > .el-form-item {
  flex: 1;
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reservation-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .search-row {
    flex-direction: column;
  }
  
  .search-row > .el-form-item {
    width: 100%;
  }
  
  .form-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .preview-content {
    flex-direction: column;
    gap: 10px;
  }
  
  .pagination-container {
    justify-content: center;
  }
}
</style>