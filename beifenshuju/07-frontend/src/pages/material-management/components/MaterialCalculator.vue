/home/sardenesy/workspace/07-frontend/src/pages/material-management/components/MaterialCalculator.vue
<template>
  <div class="material-calculator">
    <div class="calculator-header">
      <h3>{{ title || '物料计算器' }}</h3>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="calculateMaterials" :loading="calculating">
          <el-icon><Refresh /></el-icon> 重新计算
        </el-button>
        <el-button type="info" size="small" @click="resetCalculator">
          <el-icon><Delete /></el-icon> 重置
        </el-button>
      </div>
    </div>
    
    <div class="calculator-content">
      <!-- 基本信息设置 -->
      <el-card class="setting-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>基本设置</span>
          </div>
        </template>
        
        <el-form :model="calculatorForm" label-width="120px">
          <div class="form-row">
            <el-form-item label="产品编号">
              <el-input v-model="calculatorForm.productCode" placeholder="输入产品编号" readonly />
            </el-form-item>
            
            <el-form-item label="产品名称">
              <el-input v-model="calculatorForm.productName" placeholder="输入产品名称" readonly />
            </el-form-item>
            
            <el-form-item label="生产数量">
              <el-input-number 
                v-model="calculatorForm.productionQuantity" 
                :min="1" 
                :step="1" 
                style="width: 100%"
                @change="handleProductionQuantityChange"
              />
            </el-form-item>
          </div>
          
          <div class="form-row">
            <el-form-item label="损耗率设置">
              <el-input-number 
                v-model="calculatorForm.wastageRate" 
                :min="0" 
                :max="100" 
                :step="0.1" 
                :precision="2" 
                style="width: 100%"
                @change="handleWastageRateChange"
              >
                <template #append>%</template>
              </el-input-number>
            </el-form-item>
            
            <el-form-item label="计算模式">
              <el-radio-group v-model="calculatorForm.calculationMode" @change="handleCalculationModeChange">
                <el-radio-button label="标准用量">标准用量</el-radio-button>
                <el-radio-button label="实际用量">实际用量</el-radio-button>
                <el-radio-button label="优化用量">优化用量</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </div>
        </el-form>
      </el-card>
      
      <!-- BOM结构显示 -->
      <el-card class="bom-card" shadow="hover" style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>BOM结构与计算结果</span>
            <el-button type="text" size="small" @click="toggleBomExpand">
              {{ isBomExpanded ? '收起' : '展开' }}所有层级
            </el-button>
          </div>
        </template>
        
        <el-table 
          :data="bomItemsWithCalculation" 
          style="width: 100%"
          row-key="id"
          border
          height="500"
          lazy
          :load="loadChildBomItems"
          :tree-props="{ hasChildren: 'hasChildren', children: 'children' }"
        >
          <el-table-column prop="materialCode" label="物料编码" width="150">
            <template #default="scope">
              <div class="material-info">
                <span class="code">{{ scope.row.materialCode }}</span>
                <el-tooltip v-if="scope.row.isCritical" effect="dark" content="关键物料" placement="top">
                  <el-tag size="small" type="danger" effect="plain" style="margin-left: 5px;">关键</el-tag>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="materialName" label="物料名称" min-width="200">
            <template #default="scope">
              <div class="material-name">
                <span>{{ scope.row.materialName }}</span>
                <span class="spec">({{ scope.row.specification }})</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="level" label="层级" width="80" align="center">
            <template #default="scope">
              <el-badge :value="scope.row.level" size="small" :type="getLevelBadgeType(scope.row.level)" />
            </template>
          </el-table-column>
          
          <el-table-column prop="baseQuantity" label="基础用量" width="100" align="right">
            <template #default="scope">
              <span>{{ scope.row.baseQuantity || 0 }}</span>
              <span class="unit">{{ scope.row.unit }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="calculatedQuantity" label="计算用量" width="120" align="right">
            <template #default="scope">
              <div class="quantity-info">
                <span class="quantity-value">{{ formatNumber(scope.row.calculatedQuantity) }}</span>
                <span class="unit">{{ scope.row.unit }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="unitPrice" label="单价(¥)" width="100" align="right">
            <template #default="scope">
              <span class="price">{{ formatPrice(scope.row.unitPrice) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="totalPrice" label="合计金额(¥)" width="120" align="right">
            <template #default="scope">
              <span class="total-price">{{ formatPrice(scope.row.totalPrice) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="inventoryStatus" label="库存状态" width="120">
            <template #default="scope">
              <el-tag :type="getInventoryStatusType(scope.row.inventoryStatus)" effect="light">
                {{ scope.row.inventoryStatus }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="100" align="center">
            <template #default="scope">
              <el-button 
                type="primary" 
                size="small" 
                text 
                @click="viewMaterialDetail(scope.row)"
              >
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      
      <!-- 计算汇总 -->
      <el-card class="summary-card" shadow="hover" style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>计算汇总</span>
          </div>
        </template>
        
        <div class="summary-content">
          <div class="summary-row">
            <div class="summary-item">
              <label>物料种类数:</label>
              <value>{{ totalMaterialTypes }}</value>
            </div>
            <div class="summary-item">
              <label>总物料用量:</label>
              <value>{{ formatNumber(totalQuantity) }}</value>
              <unit>单位</unit>
            </div>
            <div class="summary-item">
              <label>材料总成本:</label>
              <value class="total-cost">{{ formatPrice(totalCost) }}</value>
              <unit>元</unit>
            </div>
          </div>
          
          <div class="summary-row">
            <div class="summary-item">
              <label>单位产品材料成本:</label>
              <value class="unit-cost">{{ formatPrice(unitCost) }}</value>
              <unit>元/件</unit>
            </div>
            <div class="summary-item">
              <label>损耗预估:</label>
              <value>{{ formatNumber(totalWastage) }}</value>
              <unit>单位</unit>
            </div>
            <div class="summary-item">
              <label>需采购物料:</label>
              <value>{{ totalPurchaseNeeded }}</value>
              <unit>种</unit>
            </div>
          </div>
        </div>
        
        <el-divider></el-divider>
        
        <div class="summary-actions">
          <el-button type="primary" @click="exportCalculationResult">
            <el-icon><Download /></el-icon> 导出计算结果
          </el-button>
          <el-button @click="generateMaterialPlan">
            <el-icon><Document /></el-icon> 生成物料计划
          </el-button>
        </div>
      </el-card>
    </div>
    
    <!-- 物料详情对话框 -->
    <el-dialog
      v-model="materialDetailVisible"
      title="物料详情"
      width="700px"
      @close="handleDialogClose"
    >
      <div v-if="selectedMaterial" class="material-detail">
        <div class="detail-section">
          <h4>基本信息</h4>
          <el-descriptions :column="2" :border="true">
            <el-descriptions-item label="物料编码">{{ selectedMaterial.materialCode }}</el-descriptions-item>
            <el-descriptions-item label="物料名称">{{ selectedMaterial.materialName }}</el-descriptions-item>
            <el-descriptions-item label="规格型号">{{ selectedMaterial.specification }}</el-descriptions-item>
            <el-descriptions-item label="单位">{{ selectedMaterial.unit }}</el-descriptions-item>
            <el-descriptions-item label="物料类型">{{ selectedMaterial.materialType }}</el-descriptions-item>
            <el-descriptions-item label="品牌">{{ selectedMaterial.brand || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-section">
          <h4>库存信息</h4>
          <el-descriptions :column="2" :border="true">
            <el-descriptions-item label="当前库存">{{ selectedMaterial.currentStock || 0 }} {{ selectedMaterial.unit }}</el-descriptions-item>
            <el-descriptions-item label="安全库存">{{ selectedMaterial.safetyStock || 0 }} {{ selectedMaterial.unit }}</el-descriptions-item>
            <el-descriptions-item label="库存状态">{{ selectedMaterial.inventoryStatus }}</el-descriptions-item>
            <el-descriptions-item label="主要库位">{{ selectedMaterial.mainLocation || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-section">
          <h4>采购信息</h4>
          <el-descriptions :column="2" :border="true">
            <el-descriptions-item label="供应商">{{ selectedMaterial.supplier || '-' }}</el-descriptions-item>
            <el-descriptions-item label="采购周期">{{ selectedMaterial.leadTime || 0 }} 天</el-descriptions-item>
            <el-descriptions-item label="最小起订量">{{ selectedMaterial.minOrderQty || 0 }} {{ selectedMaterial.unit }}</el-descriptions-item>
            <el-descriptions-item label="单价">{{ formatPrice(selectedMaterial.unitPrice) }} 元/{{ selectedMaterial.unit }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="materialDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Refresh, Delete, Download, Document } from '@element-plus/icons-vue';

// Props
const props = defineProps({
  title: {
    type: String,
    default: '物料计算器'
  },
  productInfo: {
    type: Object,
    default: () => ({
      productCode: '',
      productName: '',
      bomVersion: ''
    })
  },
  initialQuantity: {
    type: Number,
    default: 1
  }
});

// Emits
const emit = defineEmits(['calculate-complete', 'export', 'generate-plan']);

// 响应式数据
const calculatorForm = ref({
  productCode: props.productInfo.productCode,
  productName: props.productInfo.productName,
  productionQuantity: props.initialQuantity,
  wastageRate: 5.0,
  calculationMode: '标准用量'
});

const bomItems = ref([]);
const bomItemsWithCalculation = ref([]);
const calculating = ref(false);
const isBomExpanded = ref(false);
const materialDetailVisible = ref(false);
const selectedMaterial = ref(null);

// 监听props变化
watch(() => props.productInfo, (newValue) => {
  calculatorForm.value.productCode = newValue.productCode;
  calculatorForm.value.productName = newValue.productName;
  if (newValue.productCode) {
    loadBomData();
  }
}, { deep: true });

watch(() => props.initialQuantity, (newValue) => {
  calculatorForm.value.productionQuantity = newValue;
});

// 加载BOM数据
const loadBomData = async () => {
  try {
    calculating.value = true;
    // 实际项目中这里应该调用API获取BOM数据
    // 这里使用模拟数据
    bomItems.value = generateMockBomData();
    calculateMaterials();
  } catch (error) {
    console.error('加载BOM数据失败:', error);
  } finally {
    calculating.value = false;
  }
};

// 计算物料用量
const calculateMaterials = () => {
  if (bomItems.value.length === 0) {
    loadBomData();
    return;
  }
  
  calculating.value = true;
  
  // 延迟模拟计算过程
  setTimeout(() => {
    const result = bomItems.value.map(item => {
      let calculatedQty = item.baseQuantity * calculatorForm.value.productionQuantity;
      
      // 根据计算模式调整用量
      switch (calculatorForm.value.calculationMode) {
        case '实际用量':
          // 实际用量可能会比标准用量多一些
          calculatedQty = calculatedQty * (1 + (Math.random() * 0.1));
          break;
        case '优化用量':
          // 优化用量会比标准用量少一些，但考虑损耗
          calculatedQty = calculatedQty * 0.95;
          break;
      }
      
      // 加上损耗
      const wastageAmount = calculatedQty * (calculatorForm.value.wastageRate / 100);
      calculatedQty += wastageAmount;
      
      // 四舍五入到合适的精度
      calculatedQty = Math.round(calculatedQty * 100) / 100;
      
      // 计算金额
      const totalPrice = calculatedQty * item.unitPrice;
      
      return {
        ...item,
        calculatedQuantity: calculatedQty,
        wastageAmount: Math.round(wastageAmount * 100) / 100,
        totalPrice: Math.round(totalPrice * 100) / 100,
        inventoryStatus: getInventoryStatus(item, calculatedQty)
      };
    });
    
    bomItemsWithCalculation.value = result;
    calculating.value = false;
    
    // 触发计算完成事件
    emit('calculate-complete', {
      totalCost: totalCost.value,
      unitCost: unitCost.value,
      totalMaterialTypes: totalMaterialTypes.value,
      calculationDetails: result
    });
  }, 300);
};

// 计算属性
const totalMaterialTypes = computed(() => {
  return bomItemsWithCalculation.value.length;
});

const totalQuantity = computed(() => {
  return bomItemsWithCalculation.value.reduce((sum, item) => sum + (item.calculatedQuantity || 0), 0);
});

const totalCost = computed(() => {
  return bomItemsWithCalculation.value.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
});

const unitCost = computed(() => {
  if (calculatorForm.value.productionQuantity <= 0) return 0;
  return totalCost.value / calculatorForm.value.productionQuantity;
});

const totalWastage = computed(() => {
  return bomItemsWithCalculation.value.reduce((sum, item) => sum + (item.wastageAmount || 0), 0);
});

const totalPurchaseNeeded = computed(() => {
  return bomItemsWithCalculation.value.filter(item => 
    item.inventoryStatus === '不足' || item.inventoryStatus === '缺货'
  ).length;
});

// 方法
const handleProductionQuantityChange = () => {
  calculateMaterials();
};

const handleWastageRateChange = () => {
  calculateMaterials();
};

const handleCalculationModeChange = () => {
  calculateMaterials();
};

const loadChildBomItems = (tree, treeNode, resolve) => {
  // 实际项目中这里应该根据父节点ID加载子节点
  // 这里使用模拟数据
  setTimeout(() => {
    const childItems = generateMockChildBomItems(tree.id);
    resolve(childItems);
  }, 500);
};

const toggleBomExpand = () => {
  isBomExpanded.value = !isBomExpanded.value;
  // 这里可以实现展开/收起所有树节点的逻辑
};

const getLevelBadgeType = (level) => {
  const types = ['primary', 'success', 'warning', 'danger', 'info'];
  return types[level % types.length];
};

const getInventoryStatusType = (status) => {
  const typeMap = {
    '充足': 'success',
    '充足': 'success',
    '预警': 'warning',
    '不足': 'danger',
    '缺货': 'danger'
  };
  return typeMap[status] || 'info';
};

const getInventoryStatus = (item, neededQty) => {
  if (item.currentStock >= neededQty) {
    return '充足';
  } else if (item.currentStock >= neededQty * 0.5) {
    return '充足';
  } else if (item.currentStock > 0) {
    return '不足';
  } else {
    return '缺货';
  }
};

const viewMaterialDetail = (material) => {
  selectedMaterial.value = { ...material };
  materialDetailVisible.value = true;
};

const handleDialogClose = () => {
  selectedMaterial.value = null;
};

const resetCalculator = () => {
  calculatorForm.value.productionQuantity = props.initialQuantity;
  calculatorForm.value.wastageRate = 5.0;
  calculatorForm.value.calculationMode = '标准用量';
  bomItemsWithCalculation.value = [];
};

const exportCalculationResult = () => {
  emit('export', {
    productInfo: props.productInfo,
    calculationParams: calculatorForm.value,
    calculationResults: bomItemsWithCalculation.value
  });
};

const generateMaterialPlan = () => {
  emit('generate-plan', {
    productInfo: props.productInfo,
    productionQuantity: calculatorForm.value.productionQuantity,
    materialRequirements: bomItemsWithCalculation.value
  });
};

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatPrice = (price) => {
  if (price === null || price === undefined) return '0.00';
  return Number(price).toLocaleString('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).replace('CN¥', '');
};

// 生成模拟BOM数据
const generateMockBomData = () => {
  return [
    {
      id: '1',
      materialCode: 'MAT-001',
      materialName: '机壳组件',
      specification: 'ABS+PC',
      unit: '套',
      baseQuantity: 1,
      unitPrice: 25.5,
      level: 1,
      hasChildren: true,
      materialType: '半成品',
      currentStock: 150,
      safetyStock: 50,
      isCritical: true
    },
    {
      id: '2',
      materialCode: 'MAT-002',
      materialName: '主控电路板',
      specification: 'PCB-2023-01',
      unit: '块',
      baseQuantity: 1,
      unitPrice: 120.0,
      level: 1,
      hasChildren: true,
      materialType: '半成品',
      currentStock: 80,
      safetyStock: 30,
      isCritical: true
    },
    {
      id: '3',
      materialCode: 'MAT-003',
      materialName: '电机',
      specification: 'DC-12V-5000RPM',
      unit: '个',
      baseQuantity: 1,
      unitPrice: 65.8,
      level: 1,
      hasChildren: false,
      materialType: '外购件',
      currentStock: 200,
      safetyStock: 50,
      isCritical: true
    },
    {
      id: '4',
      materialCode: 'MAT-004',
      materialName: '电源适配器',
      specification: 'AC220V-DC12V-2A',
      unit: '个',
      baseQuantity: 1,
      unitPrice: 35.0,
      level: 1,
      hasChildren: false,
      materialType: '外购件',
      currentStock: 300,
      safetyStock: 100,
      isCritical: false
    },
    {
      id: '5',
      materialCode: 'MAT-005',
      materialName: '显示屏',
      specification: 'LCD-2.4inch',
      unit: '个',
      baseQuantity: 1,
      unitPrice: 45.6,
      level: 1,
      hasChildren: false,
      materialType: '外购件',
      currentStock: 120,
      safetyStock: 40,
      isCritical: false
    }
  ];
};

// 生成模拟子BOM数据
const generateMockChildBomItems = (parentId) => {
  const childMap = {
    '1': [
      {
        id: '1-1',
        materialCode: 'MAT-001-01',
        materialName: '上盖',
        specification: 'ABS+PC 黑色',
        unit: '个',
        baseQuantity: 1,
        unitPrice: 8.5,
        level: 2,
        hasChildren: false,
        materialType: '自制件',
        currentStock: 500,
        safetyStock: 100
      },
      {
        id: '1-2',
        materialCode: 'MAT-001-02',
        materialName: '下盖',
        specification: 'ABS+PC 黑色',
        unit: '个',
        baseQuantity: 1,
        unitPrice: 9.2,
        level: 2,
        hasChildren: false,
        materialType: '自制件',
        currentStock: 450,
        safetyStock: 100
      }
    ],
    '2': [
      {
        id: '2-1',
        materialCode: 'MAT-002-01',
        materialName: 'PCB板',
        specification: 'FR4 2mm',
        unit: '块',
        baseQuantity: 1,
        unitPrice: 25.0,
        level: 2,
        hasChildren: false,
        materialType: '外购件',
        currentStock: 300,
        safetyStock: 50
      },
      {
        id: '2-2',
        materialCode: 'MAT-002-02',
        materialName: '主芯片',
        specification: 'STM32F407',
        unit: '个',
        baseQuantity: 1,
        unitPrice: 45.0,
        level: 2,
        hasChildren: false,
        materialType: '外购件',
        currentStock: 150,
        safetyStock: 30
      }
    ]
  };
  
  return childMap[parentId] || [];
};

// 初始化加载数据
if (props.productInfo.productCode) {
  loadBomData();
}
</script>

<style scoped>
.material-calculator {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}

.calculator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.calculator-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.calculator-content {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.setting-card,
.bom-card,
.summary-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.material-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.code {
  font-weight: 600;
  color: #409eff;
}

.material-name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.spec {
  font-size: 12px;
  color: #909399;
}

.quantity-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.quantity-value {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.unit {
  font-size: 12px;
  color: #909399;
}

.price {
  font-weight: 500;
  color: #606266;
}

.total-price {
  font-weight: 600;
  color: #f56c6c;
}

.summary-content {
  padding: 10px 0;
}

.summary-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 15px;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 10px 20px;
  background: #f5f7fa;
  border-radius: 6px;
  min-width: 150px;
}

.summary-item label {
  font-size: 13px;
  color: #606266;
}

.summary-item value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.summary-item value.total-cost,
.summary-item value.unit-cost {
  color: #f56c6c;
}

.summary-item unit {
  font-size: 12px;
  color: #909399;
}

.summary-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding-top: 10px;
}

.material-detail {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-section {
  margin-bottom: 5px;
}

.detail-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .calculator-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .form-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .summary-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .summary-item {
    min-width: auto;
  }
  
  .summary-actions {
    flex-direction: column;
    gap: 10px;
  }
}
</style>