<template>
  <div class="worker-selector">
    <el-select
      v-model="selectedWorker"
      placeholder="请选择工人"
      filterable
      remote
      :remote-method="remoteSearch"
      :loading="loading"
      @change="onWorkerChange"
      clearable
    >
      <el-option
        v-for="worker in filteredWorkers"
        :key="worker.id"
        :label="worker.name"
        :value="worker"
      >
        <div class="worker-info">
          <div class="worker-name">{{ worker.name }}</div>
          <div class="worker-details">
            <span class="skill-level">技能等级: {{ worker.skillLevel }}</span>
            <span class="status" :class="`status-${worker.status.toLowerCase()}`">
              {{ worker.status === 'AVAILABLE' ? '可用' : '忙碌' }}
            </span>
          </div>
          <div class="worker-extra">{{ worker.workshopName }}</div>
        </div>
      </el-option>
    </el-select>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  },
  workshopId: {
    type: String,
    default: ''
  },
  skillLevel: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['update:modelValue', 'change']);

// 响应式数据
const selectedWorker = ref(props.modelValue || null);
const loading = ref(false);
const allWorkers = ref([]);
const searchQuery = ref('');

// 模拟数据：工人列表
const mockWorkers = [
  {
    id: '1',
    name: '张三',
    skillLevel: '高级',
    status: 'AVAILABLE',
    workshopId: '1',
    workshopName: '装配车间',
    department: '生产部',
    position: '高级技工',
    availableHours: 40,
    qualification: '高级技师认证'
  },
  {
    id: '2',
    name: '李四',
    skillLevel: '中级',
    status: 'AVAILABLE',
    workshopId: '1',
    workshopName: '装配车间',
    department: '生产部',
    position: '中级技工',
    availableHours: 30,
    qualification: '中级技师认证'
  },
  {
    id: '3',
    name: '王五',
    skillLevel: '高级',
    status: 'BUSY',
    workshopId: '2',
    workshopName: '机加工车间',
    department: '生产部',
    position: 'CNC操作员',
    availableHours: 10,
    qualification: '高级CNC操作认证'
  },
  {
    id: '4',
    name: '赵六',
    skillLevel: '中级',
    status: 'AVAILABLE',
    workshopId: '2',
    workshopName: '机加工车间',
    department: '生产部',
    position: 'CNC操作员',
    availableHours: 25,
    qualification: '中级CNC操作认证'
  },
  {
    id: '5',
    name: '钱七',
    skillLevel: '初级',
    status: 'AVAILABLE',
    workshopId: '3',
    workshopName: '质检车间',
    department: '质检部',
    position: '质检员',
    availableHours: 40,
    qualification: '初级质检认证'
  },
  {
    id: '6',
    name: '孙八',
    skillLevel: '中级',
    status: 'BUSY',
    workshopId: '3',
    workshopName: '质检车间',
    department: '质检部',
    position: '高级质检员',
    availableHours: 0,
    qualification: '中级质检认证'
  },
  {
    id: '7',
    name: '周九',
    skillLevel: '高级',
    status: 'AVAILABLE',
    workshopId: '4',
    workshopName: '电子车间',
    department: '电子部',
    position: '电子工程师',
    availableHours: 35,
    qualification: '高级电子工程师认证'
  },
  {
    id: '8',
    name: '吴十',
    skillLevel: '初级',
    status: 'AVAILABLE',
    workshopId: '4',
    workshopName: '电子车间',
    department: '电子部',
    position: '电子技术员',
    availableHours: 40,
    qualification: '初级电子技术员认证'
  }
];

// 计算属性：过滤后的工人列表
const filteredWorkers = computed(() => {
  let workers = [...allWorkers.value];
  
  // 按车间过滤
  if (props.workshopId) {
    workers = workers.filter(worker => worker.workshopId === props.workshopId);
  }
  
  // 按技能等级过滤
  if (props.skillLevel) {
    // 技能等级匹配规则：高级可以做中级和初级，中级可以做初级
    workers = workers.filter(worker => {
      if (props.skillLevel === '高级') {
        return worker.skillLevel === '高级';
      } else if (props.skillLevel === '中级') {
        return worker.skillLevel === '高级' || worker.skillLevel === '中级';
      } else {
        return true;
      }
    });
  }
  
  // 按搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    workers = workers.filter(worker => 
      worker.name.toLowerCase().includes(query) ||
      worker.workshopName.toLowerCase().includes(query) ||
      worker.qualification.toLowerCase().includes(query)
    );
  }
  
  return workers;
});

// 监听属性变化
watch(() => props.modelValue, (newValue) => {
  selectedWorker.value = newValue || null;
});

watch(() => props.workshopId, () => {
  // 车间变化时重新加载工人数据
  loadWorkers();
});

// 初始化加载工人数据
loadWorkers();

// 方法：加载工人数据
function loadWorkers() {
  loading.value = true;
  
  // 模拟API调用
  setTimeout(() => {
    allWorkers.value = [...mockWorkers];
    loading.value = false;
  }, 300);
}

// 方法：远程搜索
function remoteSearch(query) {
  searchQuery.value = query;
  // 实际项目中可能需要调用后端API进行搜索
}

// 方法：工人选择变化
function onWorkerChange(worker) {
  selectedWorker.value = worker;
  emit('update:modelValue', worker);
  emit('change', worker);
  
  // 提醒用户工人状态
  if (worker && worker.status === 'BUSY') {
    ElMessage.warning(`${worker.name} 当前状态为忙碌，可能无法立即开始工作`);
  }
}

// 方法：获取工人可用时间（供父组件调用）
defineExpose({
  getWorkerAvailableHours(workerId) {
    const worker = allWorkers.value.find(w => w.id === workerId);
    return worker ? worker.availableHours : 0;
  },
  refreshWorkers: loadWorkers
});
</script>

<style scoped>
.worker-selector {
  width: 100%;
}

.worker-info {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
}

.worker-name {
  font-weight: bold;
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.worker-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #606266;
  margin-bottom: 2px;
}

.skill-level {
  flex: 1;
}

.status {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.status-available {
  background-color: #f0f9eb;
  color: #67c23a;
}

.status-busy {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.worker-extra {
  font-size: 11px;
  color: #909399;
}
</style>