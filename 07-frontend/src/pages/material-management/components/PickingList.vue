/home/sardenesy/workspace/07-frontend/src/pages/material-management/components/PickingList.vue
<template>
  <div class="picking-list">
    <div class="picking-list-header">
      <h3>{{ title || '领料清单' }}</h3>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="handleAddItem" :disabled="disabled">
          <el-icon><Plus /></el-icon> 添加入库
        </el-button>
        <el-button type="danger" size="small" @click="handleRemoveSelected" :disabled="selectedItems.length === 0 || disabled">
          <el-icon><Delete /></el-icon> 批量删除
        </el-button>
      </div>
    </div>
    
    <div class="picking-list-content">
      <el-table 
        v-loading="loading" 
        :data="pickingItems" 
        style="width: 100%"
        @selection-change="handleSelectionChange"
        border
        height="400"
      >
        <el-table-column type="selection" width="55" fixed></el-table-column>
        
        <el-table-column prop="materialCode" label="物料编码" width="150" sortable>
          <template #default="scope">
            <div class="cell-content">
              <span class="material-code">{{ scope.row.materialCode }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="materialName" label="物料名称" min-width="200">
          <template #default="scope">
            <div class="cell-content">
              <span class="material-name">{{ scope.row.materialName }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="specification" label="规格型号" min-width="150"></el-table-column>
        
        <el-table-column prop="unit" label="单位" width="80"></el-table-column>
        
        <el-table-column prop="requestQuantity" label="申请数量" width="120" align="right">
          <template #default="scope">
            <div class="quantity-display">
              {{ scope.row.requestQuantity }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="pickedQuantity" label="已领数量" width="120" align="right">
          <template #default="scope">
            <div class="quantity-display">
              {{ scope.row.pickedQuantity || 0 }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="quantity" label="本次领用" width="120" align="right">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.quantity"
              :min="0"
              :max="scope.row.requestQuantity - (scope.row.pickedQuantity || 0)"
              :step="1"
              size="small"
              @change="handleQuantityChange(scope.row)"
              :disabled="disabled"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="warehouseLocation" label="库位" width="120">
          <template #default="scope">
            <el-input
              v-model="scope.row.warehouseLocation"
              placeholder="输入库位"
              size="small"
              :disabled="disabled"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="batchNo" label="批次号" width="150">
          <template #default="scope">
            <el-input
              v-model="scope.row.batchNo"
              placeholder="输入批次号"
              size="small"
              :disabled="disabled"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="remark" label="备注" min-width="150">
          <template #default="scope">
            <el-input
              v-model="scope.row.remark"
              placeholder="备注信息"
              size="small"
              type="textarea"
              :rows="1"
              :disabled="disabled"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="scope">
            <el-button 
              type="danger" 
              size="small" 
              icon="Delete" 
              circle 
              @click="handleRemoveItem(scope.row)"
              :disabled="disabled"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <div class="picking-list-footer" v-if="!disabled">
      <el-divider></el-divider>
      <div class="footer-actions">
        <div class="total-info">
          <span>已选择 {{ selectedItems.length }} 项</span>
          <span>总计数量: {{ totalQuantity }}</span>
        </div>
        <div class="action-buttons">
          <el-button type="primary" @click="handleSubmit">提交</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </div>
      </div>
    </div>
    
    <!-- 物料选择对话框 -->
    <el-dialog
      v-model="materialSelectVisible"
      title="选择物料"
      width="800px"
      @close="handleDialogClose"
    >
      <div class="material-search">
        <el-input
          v-model="materialSearchQuery"
          placeholder="搜索物料编码或名称"
          prefix-icon="Search"
          class="search-input"
        >
          <template #append>
            <el-button type="primary" @click="searchMaterials">搜索</el-button>
          </template>
        </el-input>
        
        <el-select v-model="materialTypeFilter" placeholder="按类型筛选" size="large" class="filter-select">
          <el-option label="全部" value=""></el-option>
          <el-option label="原材料" value="raw"></el-option>
          <el-option label="半成品" value="semi"></el-option>
          <el-option label="成品" value="finished"></el-option>
          <el-option label="辅料" value="auxiliary"></el-option>
        </el-select>
      </div>
      
      <el-table 
        :data="searchResults" 
        style="width: 100%"
        @selection-change="handleMaterialSelectionChange"
        border
        height="400"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="code" label="物料编码" width="150"></el-table-column>
        <el-table-column prop="name" label="物料名称" min-width="200"></el-table-column>
        <el-table-column prop="specification" label="规格型号" min-width="150"></el-table-column>
        <el-table-column prop="unit" label="单位" width="80"></el-table-column>
        <el-table-column prop="stockQuantity" label="库存数量" width="120" align="right"></el-table-column>
        <el-table-column prop="type" label="类型" width="100"></el-table-column>
      </el-table>
      
      <div class="dialog-footer">
        <el-button @click="materialSelectVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMaterialSelection">确认选择</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Plus, Delete, Search } from '@element-plus/icons-vue';

// Props
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: '领料清单'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['update:modelValue', 'submit', 'cancel']);

// 响应式数据
const pickingItems = ref([...props.modelValue]);
const selectedItems = ref([]);
const materialSelectVisible = ref(false);
const materialSearchQuery = ref('');
const materialTypeFilter = ref('');
const searchResults = ref([]);
const selectedMaterials = ref([]);

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  pickingItems.value = [...newValue];
}, { deep: true });

// 计算属性
const totalQuantity = computed(() => {
  return pickingItems.value.reduce((total, item) => total + (item.quantity || 0), 0);
});

// 方法
const handleSelectionChange = (val) => {
  selectedItems.value = val;
};

const handleQuantityChange = (row) => {
  // 确保数量有效
  if (row.quantity < 0) row.quantity = 0;
  if (row.quantity > row.requestQuantity - (row.pickedQuantity || 0)) {
    row.quantity = row.requestQuantity - (row.pickedQuantity || 0);
  }
  updateModelValue();
};

const handleAddItem = () => {
  // 模拟搜索结果数据
  searchResults.value = generateMockMaterials();
  materialSelectVisible.value = true;
};

const handleRemoveItem = (row) => {
  const index = pickingItems.value.findIndex(item => item === row);
  if (index > -1) {
    pickingItems.value.splice(index, 1);
    updateModelValue();
  }
};

const handleRemoveSelected = () => {
  selectedItems.value.forEach(item => {
    const index = pickingItems.value.findIndex(row => row === item);
    if (index > -1) {
      pickingItems.value.splice(index, 1);
    }
  });
  selectedItems.value = [];
  updateModelValue();
};

const handleSubmit = () => {
  // 验证数据
  const invalidItems = pickingItems.value.filter(item => 
    !item.quantity || item.quantity <= 0 || !item.warehouseLocation
  );
  
  if (invalidItems.length > 0) {
    ElMessage.warning('请完善所有物料的数量和库位信息');
    return;
  }
  
  emit('submit', [...pickingItems.value]);
};

const handleCancel = () => {
  pickingItems.value = [...props.modelValue];
  emit('cancel');
};

const searchMaterials = () => {
  // 实际项目中这里应该调用API
  let results = generateMockMaterials();
  
  // 按搜索词过滤
  if (materialSearchQuery.value) {
    const query = materialSearchQuery.value.toLowerCase();
    results = results.filter(item => 
      item.code.toLowerCase().includes(query) || 
      item.name.toLowerCase().includes(query)
    );
  }
  
  // 按类型过滤
  if (materialTypeFilter.value) {
    results = results.filter(item => item.type === materialTypeFilter.value);
  }
  
  searchResults.value = results;
};

const handleMaterialSelectionChange = (val) => {
  selectedMaterials.value = val;
};

const confirmMaterialSelection = () => {
  selectedMaterials.value.forEach(material => {
    // 检查是否已存在
    const existingItem = pickingItems.value.find(item => item.materialCode === material.code);
    if (!existingItem) {
      pickingItems.value.push({
        materialCode: material.code,
        materialName: material.name,
        specification: material.specification,
        unit: material.unit,
        requestQuantity: material.stockQuantity,
        pickedQuantity: 0,
        quantity: material.stockQuantity,
        warehouseLocation: '',
        batchNo: '',
        remark: '',
        materialType: material.type
      });
    }
  });
  
  materialSelectVisible.value = false;
  materialSearchQuery.value = '';
  materialTypeFilter.value = '';
  selectedMaterials.value = [];
  updateModelValue();
};

const handleDialogClose = () => {
  materialSearchQuery.value = '';
  materialTypeFilter.value = '';
  selectedMaterials.value = [];
};

const updateModelValue = () => {
  emit('update:modelValue', [...pickingItems.value]);
};

// 生成模拟物料数据
const generateMockMaterials = () => {
  return [
    { code: 'MAT-001', name: '优质钢材', specification: 'φ10mm', unit: 'kg', stockQuantity: 1000, type: 'raw' },
    { code: 'MAT-002', name: '铝合金板', specification: '2000×1000×2mm', unit: '张', stockQuantity: 200, type: 'raw' },
    { code: 'MAT-003', name: '轴承组件', specification: '6205ZZ', unit: '套', stockQuantity: 500, type: 'semi' },
    { code: 'MAT-004', name: '电路板', specification: 'PCB-2023-01', unit: '块', stockQuantity: 150, type: 'semi' },
    { code: 'MAT-005', name: '螺丝套件', specification: 'M6×20mm', unit: '袋', stockQuantity: 300, type: 'auxiliary' },
    { code: 'MAT-006', name: '润滑油', specification: '10W-40', unit: '桶', stockQuantity: 50, type: 'auxiliary' },
    { code: 'MAT-007', name: '电机外壳', specification: 'M-200', unit: '个', stockQuantity: 100, type: 'semi' },
    { code: 'MAT-008', name: '控制面板', specification: 'CP-3000', unit: '个', stockQuantity: 80, type: 'semi' },
    { code: 'MAT-009', name: '塑料配件', specification: 'P-100A', unit: '个', stockQuantity: 200, type: 'auxiliary' },
    { code: 'MAT-010', name: '包装材料', specification: '标准箱', unit: '箱', stockQuantity: 500, type: 'auxiliary' }
  ];
};
</script>

<style scoped>
.picking-list {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}

.picking-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.picking-list-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.picking-list-content {
  margin-bottom: 20px;
}

.cell-content {
  line-height: 1.4;
}

.material-code {
  font-weight: 600;
  color: #409eff;
}

.material-name {
  font-weight: 500;
  color: #303133;
}

.quantity-display {
  font-weight: 600;
  color: #606266;
}

.picking-list-footer {
  margin-top: 10px;
}

.footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
}

.total-info {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #606266;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.material-search {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}

.search-input {
  flex: 1;
}

.filter-select {
  width: 150px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .picking-list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .footer-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .total-info {
    justify-content: space-around;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .material-search {
    flex-direction: column;
  }
  
  .filter-select {
    width: 100%;
  }
}
</style>