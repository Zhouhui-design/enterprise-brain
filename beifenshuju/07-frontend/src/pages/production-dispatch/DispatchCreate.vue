<template>
  <div class="dispatch-create">
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item><a href="/production-dispatch">生产派工管理</a></el-breadcrumb-item>
        <el-breadcrumb-item>{{ isEdit ? '编辑派工单' : '新建派工单' }}</el-breadcrumb-item>
      </el-breadcrumb>
      <h1>{{ isEdit ? '编辑派工单' : '新建派工单' }}</h1>
    </div>
    
    <el-card shadow="never">
      <el-form
        ref="dispatchFormRef"
        :model="dispatchForm"
        :rules="rules"
        label-width="120px"
        class="dispatch-form"
      >
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="派工单编号" prop="dispatchNumber">
                  <el-input v-model="dispatchForm.dispatchNumber" :disabled="isEdit" placeholder="自动生成" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="关联生产工单" prop="productionOrderId">
                  <el-select
                    v-model="dispatchForm.productionOrderId"
                    placeholder="请选择生产工单"
                    @change="onProductionOrderChange"
                  >
                    <el-option
                      v-for="order in productionOrders"
                      :key="order.id"
                      :label="`${order.orderNumber} - ${order.productName}`"
                      :value="order.id"
                    >
                      <div class="order-option">
                        <div class="order-info">{{ order.orderNumber }} - {{ order.productName }}</div>
                        <div class="order-details">数量: {{ order.quantity }} | 状态: {{ order.statusText }}</div>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="产品名称" prop="productName">
                  <el-input v-model="dispatchForm.productName" disabled placeholder="自动填充" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="派工总数" prop="totalQuantity">
                  <el-input-number
                    v-model="dispatchForm.totalQuantity"
                    :min="1"
                    :step="1"
                    placeholder="请输入派工总数"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="所属车间" prop="workshopId">
                  <el-select v-model="dispatchForm.workshopId" placeholder="请选择所属车间">
                    <el-option
                      v-for="workshop in workshops"
                      :key="workshop.id"
                      :label="workshop.name"
                      :value="workshop.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="计划开始时间" prop="plannedStartTime">
                  <el-date-picker
                    v-model="dispatchForm.plannedStartTime"
                    type="datetime"
                    placeholder="请选择计划开始时间"
                    value-format="YYYY-MM-DD HH:mm:ss"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="计划完成时间" prop="plannedEndTime">
                  <el-date-picker
                    v-model="dispatchForm.plannedEndTime"
                    type="datetime"
                    placeholder="请选择计划完成时间"
                    value-format="YYYY-MM-DD HH:mm:ss"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="优先级">
                  <el-radio-group v-model="dispatchForm.priority">
                    <el-radio :label="'HIGH'">高</el-radio>
                    <el-radio :label="'MEDIUM'">中</el-radio>
                    <el-radio :label="'LOW'">低</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="dispatchForm.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入备注信息"
              />
            </el-form-item>
          </el-tab-pane>
          
          <el-tab-pane label="工序派工" :disabled="!dispatchForm.productionOrderId">
            <div class="process-dispatch-section">
              <div class="section-header">
                <h3>工序派工明细</h3>
                <el-button type="primary" @click="addProcessAssignment" size="small">
                  <el-icon><Plus /></el-icon>
                  添加工序派工
                </el-button>
              </div>
              
              <el-table
                v-loading="processLoading"
                :data="processAssignments"
                style="width: 100%"
                border
                stripe
                :row-key="row => row.id || `temp_${row.tempId}`"
              >
                <el-table-column prop="processName" label="工序名称" min-width="150">
                  <template #default="scope">
                    <el-select
                      v-model="scope.row.processId"
                      placeholder="请选择工序"
                      @change="onProcessChange(scope.row)"
                    >
                      <el-option
                        v-for="process in availableProcesses"
                        :key="process.id"
                        :label="process.name"
                        :value="process.id"
                      />
                    </el-select>
                  </template>
                </el-table-column>
                
                <el-table-column prop="workerName" label="派工人员" min-width="120">
                  <template #default="scope">
                    <worker-selector
                      v-model="scope.row.worker"
                      :workshop-id="dispatchForm.workshopId"
                      :skill-level="scope.row.requiredSkillLevel"
                    />
                  </template>
                </el-table-column>
                
                <el-table-column prop="quantity" label="派工数量" width="100">
                  <template #default="scope">
                    <el-input-number
                      v-model="scope.row.quantity"
                      :min="1"
                      :step="1"
                      @change="calculateTotal"
                    />
                  </template>
                </el-table-column>
                
                <el-table-column prop="expectedHours" label="预计工时(小时)" width="120">
                  <template #default="scope">
                    <el-input-number
                      v-model="scope.row.expectedHours"
                      :min="0.1"
                      :step="0.1"
                      :precision="1"
                    />
                  </template>
                </el-table-column>
                
                <el-table-column prop="startTime" label="开始时间" min-width="150">
                  <template #default="scope">
                    <el-date-picker
                      v-model="scope.row.startTime"
                      type="datetime"
                      placeholder="请选择开始时间"
                      value-format="YYYY-MM-DD HH:mm:ss"
                    />
                  </template>
                </el-table-column>
                
                <el-table-column prop="endTime" label="结束时间" min-width="150">
                  <template #default="scope">
                    <el-date-picker
                      v-model="scope.row.endTime"
                      type="datetime"
                      placeholder="请选择结束时间"
                      value-format="YYYY-MM-DD HH:mm:ss"
                    />
                  </template>
                </el-table-column>
                
                <el-table-column prop="remark" label="备注" min-width="150">
                  <template #default="scope">
                    <el-input v-model="scope.row.remark" placeholder="请输入备注" />
                  </template>
                </el-table-column>
                
                <el-table-column label="操作" width="100" fixed="right">
                  <template #default="scope">
                    <el-button
                      @click="removeProcessAssignment(scope.row)"
                      size="small"
                      type="danger"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <div class="section-footer" v-if="processAssignments.length > 0">
                <div class="total-info">
                  总计：{{ totalProcessQuantity }} 件，预计总工时：{{ totalProcessHours }} 小时
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
        
        <div class="form-actions">
          <el-button @click="cancel">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            {{ isEdit ? '保存修改' : '提交' }}
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';
import WorkerSelector from './components/WorkerSelector.vue';

const router = useRouter();
const route = useRoute();

// 响应式数据
const dispatchFormRef = ref(null);
const activeTab = ref('0');
const submitting = ref(false);
const processLoading = ref(false);
const tempIdCounter = ref(1);

// 是否编辑模式
const isEdit = computed(() => {
  return route.params.id !== undefined;
});

// 派工单表单数据
const dispatchForm = reactive({
  id: '',
  dispatchNumber: '',
  productionOrderId: '',
  productName: '',
  totalQuantity: 0,
  workshopId: '',
  plannedStartTime: '',
  plannedEndTime: '',
  priority: 'MEDIUM',
  remark: ''
});

// 工序派工数据
const processAssignments = ref([]);

// 模拟数据：生产工单
const productionOrders = ref([
  {
    id: '1',
    orderNumber: 'PO202401010001',
    productName: '智能手表 Pro',
    quantity: 100,
    status: 'IN_PROGRESS',
    statusText: '进行中'
  },
  {
    id: '2',
    orderNumber: 'PO202401010002',
    productName: '智能手机 XS',
    quantity: 200,
    status: 'PENDING',
    statusText: '待生产'
  }
]);

// 模拟数据：车间
const workshops = ref([
  { id: '1', name: '装配车间' },
  { id: '2', name: '机加工车间' },
  { id: '3', name: '质检车间' },
  { id: '4', name: '电子车间' }
]);

// 模拟数据：工序
const availableProcesses = ref([
  { id: '1', name: 'CNC加工', requiredSkillLevel: '中级' },
  { id: '2', name: '表面处理', requiredSkillLevel: '高级' },
  { id: '3', name: '装配', requiredSkillLevel: '初级' },
  { id: '4', name: '测试', requiredSkillLevel: '中级' },
  { id: '5', name: '包装', requiredSkillLevel: '初级' }
]);

// 表单验证规则
const rules = {
  dispatchNumber: [{ required: true, message: '请输入派工单编号', trigger: 'blur' }],
  productionOrderId: [{ required: true, message: '请选择关联生产工单', trigger: 'change' }],
  totalQuantity: [{ required: true, message: '请输入派工总数', trigger: 'blur' }],
  workshopId: [{ required: true, message: '请选择所属车间', trigger: 'change' }],
  plannedStartTime: [{ required: true, message: '请选择计划开始时间', trigger: 'change' }],
  plannedEndTime: [{ required: true, message: '请选择计划完成时间', trigger: 'change' }]
};

// 计算属性：工序派工总数量
const totalProcessQuantity = computed(() => {
  return processAssignments.value.reduce((total, item) => total + (item.quantity || 0), 0);
});

// 计算属性：工序派工总工时
const totalProcessHours = computed(() => {
  return processAssignments.value.reduce((total, item) => total + (item.expectedHours || 0), 0);
});

// 生命周期
onMounted(() => {
  // 生成派工单编号
  if (!isEdit.value) {
    generateDispatchNumber();
  } else {
    // 编辑模式下加载数据
    loadDispatchData();
  }
});

// 方法：生成派工单编号
const generateDispatchNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  dispatchForm.dispatchNumber = `PD${year}${month}${day}${random}`;
};

// 方法：加载派工单数据（编辑模式）
const loadDispatchData = () => {
  processLoading.value = true;
  // 模拟API调用
  setTimeout(() => {
    // 模拟数据
    dispatchForm.id = route.params.id;
    dispatchForm.dispatchNumber = 'PD202401010001';
    dispatchForm.productionOrderId = '1';
    dispatchForm.productName = '智能手表 Pro';
    dispatchForm.totalQuantity = 100;
    dispatchForm.workshopId = '1';
    dispatchForm.plannedStartTime = '2024-01-01 08:00:00';
    dispatchForm.plannedEndTime = '2024-01-05 18:00:00';
    dispatchForm.priority = 'HIGH';
    dispatchForm.remark = '紧急生产任务';
    
    // 工序派工数据
    processAssignments.value = [
      {
        id: '1',
        processId: '1',
        processName: 'CNC加工',
        worker: { id: '1', name: '张三' },
        quantity: 100,
        expectedHours: 20,
        startTime: '2024-01-01 08:00:00',
        endTime: '2024-01-02 18:00:00',
        requiredSkillLevel: '中级',
        remark: ''
      },
      {
        id: '2',
        processId: '3',
        processName: '装配',
        worker: { id: '5', name: '钱七' },
        quantity: 100,
        expectedHours: 15,
        startTime: '2024-01-03 08:00:00',
        endTime: '2024-01-04 18:00:00',
        requiredSkillLevel: '初级',
        remark: ''
      }
    ];
    
    processLoading.value = false;
  }, 500);
};

// 方法：生产工单变更
const onProductionOrderChange = (orderId) => {
  const order = productionOrders.value.find(o => o.id === orderId);
  if (order) {
    dispatchForm.productName = order.productName;
    dispatchForm.totalQuantity = order.quantity;
  }
};

// 方法：工序变更
const onProcessChange = (row) => {
  const process = availableProcesses.value.find(p => p.id === row.processId);
  if (process) {
    row.processName = process.name;
    row.requiredSkillLevel = process.requiredSkillLevel;
  }
};

// 方法：添加工序派工
const addProcessAssignment = () => {
  processAssignments.value.push({
    tempId: tempIdCounter.value++,
    processId: '',
    processName: '',
    worker: null,
    quantity: 0,
    expectedHours: 0,
    startTime: '',
    endTime: '',
    requiredSkillLevel: '',
    remark: ''
  });
};

// 方法：移除工序派工
const removeProcessAssignment = (row) => {
  const index = processAssignments.value.findIndex(item => 
    item.id === row.id || item.tempId === row.tempId
  );
  if (index > -1) {
    processAssignments.value.splice(index, 1);
    calculateTotal();
  }
};

// 方法：计算总数
const calculateTotal = () => {
  dispatchForm.totalQuantity = totalProcessQuantity.value;
};

// 方法：提交表单
const submitForm = () => {
  dispatchFormRef.value.validate((valid) => {
    if (!valid) {
      return false;
    }
    
    // 验证工序派工数据
    if (processAssignments.value.length === 0) {
      ElMessage.warning('请至少添加一条工序派工记录');
      return;
    }
    
    // 验证工序派工详情
    const hasError = processAssignments.value.some(item => {
      return !item.processId || !item.worker || !item.quantity || !item.startTime || !item.endTime;
    });
    
    if (hasError) {
      ElMessage.warning('请完善所有工序派工的必填信息');
      return;
    }
    
    submitting.value = true;
    
    // 模拟提交
    setTimeout(() => {
      submitting.value = false;
      const message = isEdit.value ? '派工单更新成功' : '派工单创建成功';
      ElMessage.success(message);
      router.push('/production-dispatch');
    }, 1000);
  });
};

// 方法：取消
const cancel = () => {
  if (hasFormChanges()) {
    ElMessageBox.confirm(
      '表单内容已修改，确定要离开吗？',
      '确认离开',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      router.push('/production-dispatch');
    }).catch(() => {
      // 取消离开
    });
  } else {
    router.push('/production-dispatch');
  }
};

// 方法：检查表单是否有变更
const hasFormChanges = () => {
  // 这里简化处理，实际项目中需要根据具体情况判断
  return true;
};
</script>

<style scoped>
.dispatch-create {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  color: #303133;
  margin: 10px 0 0 0;
}

.dispatch-form {
  margin-bottom: 0;
}

.process-dispatch-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 16px;
  color: #303133;
  margin: 0;
}

.order-option {
  display: flex;
  flex-direction: column;
}

.order-info {
  font-weight: bold;
  margin-bottom: 4px;
}

.order-details {
  font-size: 12px;
  color: #909399;
}

.section-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.total-info {
  font-size: 14px;
  color: #606266;
  text-align: right;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.form-actions button {
  margin-left: 10px;
}
</style>