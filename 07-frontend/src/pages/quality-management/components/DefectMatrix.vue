<template>
  <div class="defect-matrix">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ title || '缺陷矩阵分析' }}</span>
          <div class="matrix-actions">
            <el-button size="small" @click="handleRefresh">刷新</el-button>
            <el-button size="small" @click="handleExport">导出</el-button>
            <el-button size="small" @click="handleSettings">设置</el-button>
          </div>
        </div>
      </template>
      
      <!-- 筛选条件 -->
      <div class="matrix-filters" v-if="showFilters">
        <el-form :inline="true" :model="filterForm" label-width="80px" size="small">
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :default-time="['00:00:00', '23:59:59']"
              clearable
            />
          </el-form-item>
          <el-form-item label="缺陷类型">
            <el-select v-model="filterForm.defectType" multiple placeholder="选择缺陷类型" clearable>
              <el-option
                v-for="type in defectTypes"
                :key="type.value"
                :label="type.label"
                :value="type.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="工序">
            <el-select v-model="filterForm.process" multiple placeholder="选择工序" clearable>
              <el-option
                v-for="process in processes"
                :key="process.value"
                :label="process.label"
                :value="process.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="handleFilter">查询</el-button>
            <el-button size="small" @click="handleResetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 缺陷矩阵表格 -->
      <div class="matrix-content">
        <div class="matrix-table-wrapper">
          <table class="matrix-table">
            <thead>
              <tr>
                <th class="row-header">缺陷类型</th>
                <th
                  v-for="process in displayProcesses"
                  :key="process.value"
                  class="col-header"
                >
                  {{ process.label }}
                </th>
                <th class="total-column">合计</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="defect in displayDefectTypes" :key="defect.value">
                <td class="row-header">{{ defect.label }}</td>
                <td
                  v-for="process in displayProcesses"
                  :key="process.value"
                  class="matrix-cell"
                  :class="getCellClass(defect.value, process.value)"
                  @click="handleCellClick(defect.value, process.value)"
                >
                  <div class="cell-content">
                    <div class="defect-count">{{ getDefectCount(defect.value, process.value) }}</div>
                    <div class="defect-percentage" v-if="totalDefects > 0">
                      {{ getDefectPercentage(defect.value, process.value) }}%
                    </div>
                  </div>
                </td>
                <td class="row-total">
                  <div class="row-total-count">{{ getDefectTypeTotal(defect.value) }}</div>
                  <div class="row-total-percentage" v-if="totalDefects > 0">
                    {{ getDefectTypePercentage(defect.value) }}%
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="row-header">合计</td>
                <td
                  v-for="process in displayProcesses"
                  :key="process.value"
                  class="column-total"
                >
                  <div class="column-total-count">{{ getProcessTotal(process.value) }}</div>
                  <div class="column-total-percentage" v-if="totalDefects > 0">
                    {{ getProcessPercentage(process.value) }}%
                  </div>
                </td>
                <td class="grand-total">{{ totalDefects }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      <!-- 统计分析卡片 -->
      <div class="stats-cards" v-if="showStatsCards">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-card class="stat-card total-defects">
              <div class="stat-content">
                <div class="stat-number">{{ totalDefects }}</div>
                <div class="stat-label">缺陷总数</div>
                <div class="stat-change" :class="totalChangeType">
                  <span>{{ totalChange > 0 ? '+' : '' }}{{ totalChange }}%</span>
                  <span class="change-label">较上期</span>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-card class="stat-card top-defect">
              <div class="stat-content">
                <div class="stat-number">{{ topDefectType?.label || '-' }}</div>
                <div class="stat-label">主要缺陷类型</div>
                <div class="stat-detail">{{ topDefectCount }}个 ({{ topDefectPercentage }}%)</div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-card class="stat-card top-process">
              <div class="stat-content">
                <div class="stat-number">{{ topProcess?.label || '-' }}</div>
                <div class="stat-label">问题工序</div>
                <div class="stat-detail">{{ topProcessCount }}个 ({{ topProcessPercentage }}%)</div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-card class="stat-card defect-rate">
              <div class="stat-content">
                <div class="stat-number">{{ defectRate.toFixed(2) }}%</div>
                <div class="stat-label">缺陷率</div>
                <div class="stat-change" :class="rateChangeType">
                  <span>{{ rateChange > 0 ? '+' : '' }}{{ rateChange.toFixed(2) }}%</span>
                  <span class="change-label">较上期</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 矩阵设置对话框 -->
      <el-dialog v-model="settingsVisible" title="矩阵设置" width="600px">
        <el-form :model="settings" :rules="settingsRules" ref="settingsRef" label-width="120px">
          <el-form-item label="显示模式" prop="displayMode">
            <el-radio-group v-model="settings.displayMode">
              <el-radio value="count">数量</el-radio>
              <el-radio value="percentage">百分比</el-radio>
              <el-radio value="both">数量+百分比</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="颜色深浅基于" prop="colorBased">
            <el-radio-group v-model="settings.colorBased">
              <el-radio value="count">缺陷数量</el-radio>
              <el-radio value="percentage">占比</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="颜色方案" prop="colorScheme">
            <el-select v-model="settings.colorScheme" placeholder="选择颜色方案">
              <el-option label="红黄绿色谱" value="red-yellow-green" />
              <el-option label="热力图" value="heatmap" />
              <el-option label="蓝紫色谱" value="blue-purple" />
            </el-select>
          </el-form-item>
          <el-form-item label="显示缺陷类型">
            <el-checkbox-group v-model="settings.selectedDefectTypes">
              <el-checkbox
                v-for="type in defectTypes"
                :key="type.value"
                :label="type.value"
                style="display: block; margin-bottom: 8px;"
              >
                {{ type.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="显示工序">
            <el-checkbox-group v-model="settings.selectedProcesses">
              <el-checkbox
                v-for="process in processes"
                :key="process.value"
                :label="process.value"
                style="display: block; margin-bottom: 8px;"
              >
                {{ process.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="settingsVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveSettings">保存</el-button>
        </template>
      </el-dialog>
      
      <!-- 缺陷详情对话框 -->
      <el-dialog v-model="detailVisible" :title="detailTitle" width="800px">
        <el-table :data="detailData" style="width: 100%" border>
          <el-table-column prop="defectCode" label="缺陷编码" width="120" />
          <el-table-column prop="defectName" label="缺陷名称" width="180" />
          <el-table-column prop="defectType" label="缺陷类型" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ getDefectTypeLabel(row.defectType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="process" label="发生工序" width="120" />
          <el-table-column prop="occurTime" label="发生时间" width="150" :formatter="formatDateTime" />
          <el-table-column prop="operator" label="操作人员" width="120" />
          <el-table-column prop="status" label="处理状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
        </el-table>
        <div class="dialog-footer" style="margin-top: 16px;">
          <el-pagination
            v-model:current-page="detailPagination.currentPage"
            v-model:page-size="detailPagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="detailTotal"
          />
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'DefectMatrix',
  props: {
    // 矩阵标题
    title: {
      type: String,
      default: '缺陷矩阵分析'
    },
    // 是否显示筛选条件
    showFilters: {
      type: Boolean,
      default: true
    },
    // 是否显示统计卡片
    showStatsCards: {
      type: Boolean,
      default: true
    },
    // 矩阵数据
    matrixData: {
      type: Array,
      default: () => []
    },
    // 缺陷类型配置
    defectTypes: {
      type: Array,
      default: () => []
    },
    // 工序配置
    processes: {
      type: Array,
      default: () => []
    }
  },
  emits: ['cell-click', 'filter-change', 'refresh', 'export', 'settings-change'],
  setup(props, { emit }) {
    // 筛选表单
    const filterForm = reactive({
      dateRange: null,
      defectType: [],
      process: []
    });
    
    // 设置对话框
    const settingsVisible = ref(false);
    const settingsRef = ref(null);
    
    // 详情对话框
    const detailVisible = ref(false);
    const detailTitle = ref('');
    const detailData = ref([]);
    const detailTotal = ref(0);
    const detailPagination = reactive({
      currentPage: 1,
      pageSize: 20
    });
    
    // 矩阵数据
    const matrix = reactive({});
    
    // 设置
    const settings = reactive({
      displayMode: 'both', // count, percentage, both
      colorBased: 'count', // count, percentage
      colorScheme: 'red-yellow-green',
      selectedDefectTypes: [],
      selectedProcesses: []
    });
    
    // 设置验证规则
    const settingsRules = {
      displayMode: [
        { required: true, message: '请选择显示模式', trigger: 'change' }
      ],
      colorBased: [
        { required: true, message: '请选择颜色深浅依据', trigger: 'change' }
      ],
      colorScheme: [
        { required: true, message: '请选择颜色方案', trigger: 'change' }
      ],
      selectedDefectTypes: [
        { required: true, message: '请至少选择一种缺陷类型', trigger: 'change' }
      ],
      selectedProcesses: [
        { required: true, message: '请至少选择一种工序', trigger: 'change' }
      ]
    };
    
    // 显示的缺陷类型
    const displayDefectTypes = computed(() => {
      if (!settings.selectedDefectTypes.length) {
        return props.defectTypes;
      }
      return props.defectTypes.filter(type => settings.selectedDefectTypes.includes(type.value));
    });
    
    // 显示的工序
    const displayProcesses = computed(() => {
      if (!settings.selectedProcesses.length) {
        return props.processes;
      }
      return props.processes.filter(process => settings.selectedProcesses.includes(process.value));
    });
    
    // 计算总缺陷数
    const totalDefects = computed(() => {
      let total = 0;
      for (const defectType of Object.keys(matrix)) {
        for (const process of Object.keys(matrix[defectType])) {
          total += matrix[defectType][process] || 0;
        }
      }
      return total;
    });
    
    // 获取指定缺陷类型和工序的缺陷数
    const getDefectCount = (defectType, process) => {
      return matrix[defectType]?.[process] || 0;
    };
    
    // 获取指定缺陷类型和工序的缺陷占比
    const getDefectPercentage = (defectType, process) => {
      const count = getDefectCount(defectType, process);
      if (totalDefects.value === 0) return 0;
      return (count / totalDefects.value * 100).toFixed(1);
    };
    
    // 获取指定缺陷类型的总数
    const getDefectTypeTotal = (defectType) => {
      let total = 0;
      if (matrix[defectType]) {
        for (const process of Object.keys(matrix[defectType])) {
          total += matrix[defectType][process] || 0;
        }
      }
      return total;
    };
    
    // 获取指定缺陷类型的占比
    const getDefectTypePercentage = (defectType) => {
      const total = getDefectTypeTotal(defectType);
      if (totalDefects.value === 0) return 0;
      return (total / totalDefects.value * 100).toFixed(1);
    };
    
    // 获取指定工序的总数
    const getProcessTotal = (process) => {
      let total = 0;
      for (const defectType of Object.keys(matrix)) {
        total += matrix[defectType]?.[process] || 0;
      }
      return total;
    };
    
    // 获取指定工序的占比
    const getProcessPercentage = (process) => {
      const total = getProcessTotal(process);
      if (totalDefects.value === 0) return 0;
      return (total / totalDefects.value * 100).toFixed(1);
    };
    
    // 获取单元格样式类
    const getCellClass = (defectType, process) => {
      const count = getDefectCount(defectType, process);
      const percentage = getDefectPercentage(defectType, process);
      const value = settings.colorBased === 'count' ? count : percentage;
      
      // 根据数值确定颜色深浅
      if (value === 0) return 'cell-empty';
      
      // 计算最大值用于归一化
      let maxValue = 0;
      for (const dt of Object.keys(matrix)) {
        for (const p of Object.keys(matrix[dt])) {
          const v = settings.colorBased === 'count' 
            ? (matrix[dt][p] || 0) 
            : (matrix[dt][p] || 0) / totalDefects.value * 100;
          maxValue = Math.max(maxValue, v);
        }
      }
      
      if (maxValue === 0) return 'cell-low';
      
      // 归一化后的值 (0-1)
      const normalizedValue = Math.min(value / maxValue, 1);
      
      // 根据归一化值确定颜色级别
      if (normalizedValue < 0.33) return 'cell-low';
      if (normalizedValue < 0.66) return 'cell-medium';
      return 'cell-high';
    };
    
    // 主要缺陷类型
    const topDefectType = computed(() => {
      let maxCount = 0;
      let topType = null;
      
      for (const defectType of props.defectTypes) {
        const count = getDefectTypeTotal(defectType.value);
        if (count > maxCount) {
          maxCount = count;
          topType = defectType;
        }
      }
      
      return topType;
    });
    
    // 主要缺陷数量
    const topDefectCount = computed(() => {
      if (!topDefectType.value) return 0;
      return getDefectTypeTotal(topDefectType.value.value);
    });
    
    // 主要缺陷占比
    const topDefectPercentage = computed(() => {
      if (totalDefects.value === 0) return 0;
      return (topDefectCount.value / totalDefects.value * 100).toFixed(1);
    });
    
    // 问题工序
    const topProcess = computed(() => {
      let maxCount = 0;
      let topProc = null;
      
      for (const process of props.processes) {
        const count = getProcessTotal(process.value);
        if (count > maxCount) {
          maxCount = count;
          topProc = process;
        }
      }
      
      return topProc;
    });
    
    // 问题工序数量
    const topProcessCount = computed(() => {
      if (!topProcess.value) return 0;
      return getProcessTotal(topProcess.value.value);
    });
    
    // 问题工序占比
    const topProcessPercentage = computed(() => {
      if (totalDefects.value === 0) return 0;
      return (topProcessCount.value / totalDefects.value * 100).toFixed(1);
    });
    
    // 缺陷率（假设总生产数量为1000）
    const defectRate = computed(() => {
      const totalProduction = 1000; // 实际应从props获取
      return totalProduction > 0 ? (totalDefects.value / totalProduction * 100) : 0;
    });
    
    // 模拟数据变化
    const totalChange = ref(-5.2);
    const rateChange = ref(-0.3);
    
    // 变化类型
    const totalChangeType = computed(() => {
      if (totalChange.value > 0) return 'change-increase';
      if (totalChange.value < 0) return 'change-decrease';
      return 'change-neutral';
    });
    
    const rateChangeType = computed(() => {
      if (rateChange.value > 0) return 'change-increase';
      if (rateChange.value < 0) return 'change-decrease';
      return 'change-neutral';
    });
    
    // 初始化数据
    const initData = () => {
      // 如果有传入数据，使用传入的数据
      if (props.matrixData && props.matrixData.length > 0) {
        props.matrixData.forEach(item => {
          if (!matrix[item.defectType]) {
            matrix[item.defectType] = {};
          }
          matrix[item.defectType][item.process] = item.count || 0;
        });
      } else {
        // 生成模拟数据
        generateMockData();
      }
      
      // 初始化设置
      if (!settings.selectedDefectTypes.length && props.defectTypes.length > 0) {
        settings.selectedDefectTypes = props.defectTypes.map(type => type.value);
      }
      if (!settings.selectedProcesses.length && props.processes.length > 0) {
        settings.selectedProcesses = props.processes.map(process => process.value);
      }
    };
    
    // 生成模拟数据
    const generateMockData = () => {
      // 如果没有传入缺陷类型和工序，使用默认值
      const defaultDefectTypes = props.defectTypes.length > 0 ? props.defectTypes : [
        { value: 'surface', label: '表面缺陷' },
        { value: 'dimension', label: '尺寸超差' },
        { value: 'structure', label: '结构缺陷' },
        { value: 'performance', label: '性能不良' },
        { value: 'assembly', label: '装配问题' }
      ];
      
      const defaultProcesses = props.processes.length > 0 ? props.processes : [
        { value: 'casting', label: '铸造' },
        { value: 'forging', label: '锻造' },
        { value: 'machining', label: '机加工' },
        { value: 'heatTreatment', label: '热处理' },
        { value: 'surfaceTreatment', label: '表面处理' },
        { value: 'assembly', label: '装配' }
      ];
      
      // 生成随机数据
      defaultDefectTypes.forEach(defect => {
        matrix[defect.value] = {};
        defaultProcesses.forEach(process => {
          // 部分位置设置0，模拟实际情况
          const shouldHaveDefect = Math.random() > 0.3;
          matrix[defect.value][process.value] = shouldHaveDefect ? Math.floor(Math.random() * 20) + 1 : 0;
        });
      });
    };
    
    // 处理单元格点击
    const handleCellClick = (defectType, process) => {
      const count = getDefectCount(defectType, process);
      if (count > 0) {
        // 显示缺陷详情
        showDefectDetail(defectType, process);
      }
      emit('cell-click', { defectType, process, count });
    };
    
    // 显示缺陷详情
    const showDefectDetail = (defectType, process) => {
      // 设置标题
      const defectLabel = props.defectTypes.find(d => d.value === defectType)?.label || defectType;
      const processLabel = props.processes.find(p => p.value === process)?.label || process;
      detailTitle.value = `${defectLabel} - ${processLabel} (${getDefectCount(defectType, process)}个缺陷)`;
      
      // 生成模拟详情数据
      generateMockDetailData(defectType, process);
      
      // 打开对话框
      detailVisible.value = true;
      detailPagination.currentPage = 1;
    };
    
    // 生成模拟详情数据
    const generateMockDetailData = (defectType, process) => {
      const count = getDefectCount(defectType, process);
      const defectLabel = props.defectTypes.find(d => d.value === defectType)?.label || defectType;
      const processLabel = props.processes.find(p => p.value === process)?.label || process;
      
      // 生成模拟缺陷数据
      detailData.value = Array.from({ length: Math.min(count, 50) }, (_, index) => {
        const statuses = ['待处理', '处理中', '已解决', '已关闭'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        return {
          id: index + 1,
          defectCode: `DEF${String(index + 1).padStart(4, '0')}`,
          defectName: `${defectLabel}-${index + 1}`,
          defectType: defectLabel,
          process: processLabel,
          occurTime: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
          operator: `操作员${Math.floor(Math.random() * 100)}`,
          status,
          description: `在${processLabel}工序发现的${defectLabel}缺陷，需要及时处理。`
        };
      });
      
      detailTotal.value = count;
    };
    
    // 获取缺陷类型标签
    const getDefectTypeLabel = (typeValue) => {
      const type = props.defectTypes.find(t => t.value === typeValue);
      return type ? type.label : typeValue;
    };
    
    // 获取状态类型
    const getStatusType = (status) => {
      const statusMap = {
        '待处理': 'warning',
        '处理中': 'info',
        '已解决': 'success',
        '已关闭': 'success'
      };
      return statusMap[status] || 'default';
    };
    
    // 格式化日期时间
    const formatDateTime = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    
    // 处理筛选
    const handleFilter = () => {
      emit('filter-change', { ...filterForm });
      ElMessage.success('筛选条件已应用');
    };
    
    // 重置筛选
    const handleResetFilter = () => {
      Object.assign(filterForm, {
        dateRange: null,
        defectType: [],
        process: []
      });
    };
    
    // 刷新数据
    const handleRefresh = () => {
      // 模拟刷新数据
      generateMockData();
      emit('refresh');
      ElMessage.success('数据已刷新');
    };
    
    // 导出数据
    const handleExport = () => {
      emit('export');
      ElMessage.success('导出功能待实现');
    };
    
    // 打开设置
    const handleSettings = () => {
      settingsVisible.value = true;
    };
    
    // 保存设置
    const handleSaveSettings = () => {
      settingsRef.value?.validate((valid) => {
        if (valid) {
          emit('settings-change', { ...settings });
          settingsVisible.value = false;
          ElMessage.success('设置已保存');
        }
      });
    };
    
    // 组件挂载时初始化
    onMounted(() => {
      nextTick(() => {
        initData();
      });
    });
    
    return {
      filterForm,
      settingsVisible,
      settingsRef,
      settings,
      settingsRules,
      detailVisible,
      detailTitle,
      detailData,
      detailTotal,
      detailPagination,
      displayDefectTypes,
      displayProcesses,
      totalDefects,
      topDefectType,
      topDefectCount,
      topDefectPercentage,
      topProcess,
      topProcessCount,
      topProcessPercentage,
      defectRate,
      totalChange,
      rateChange,
      totalChangeType,
      rateChangeType,
      
      getDefectCount,
      getDefectPercentage,
      getDefectTypeTotal,
      getDefectTypePercentage,
      getProcessTotal,
      getProcessPercentage,
      getCellClass,
      getDefectTypeLabel,
      getStatusType,
      formatDateTime,
      
      handleCellClick,
      handleFilter,
      handleResetFilter,
      handleRefresh,
      handleExport,
      handleSettings,
      handleSaveSettings
    };
  }
};
</script>

<style scoped>
.defect-matrix {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.matrix-actions {
  display: flex;
  gap: 8px;
}

.matrix-filters {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.matrix-content {
  margin-bottom: 20px;
  overflow-x: auto;
}

.matrix-table-wrapper {
  min-width: 600px;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.matrix-table th,
.matrix-table td {
  border: 1px solid #ebeef5;
  padding: 8px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-header {
  background-color: #f5f7fa;
  font-weight: bold;
  min-width: 120px;
  position: sticky;
  left: 0;
  z-index: 1;
}

.col-header {
  background-color: #f5f7fa;
  font-weight: bold;
  min-width: 100px;
}

.matrix-cell {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.matrix-cell:hover {
  background-color: #ecf5ff;
}

.cell-empty {
  background-color: #ffffff;
}

.cell-low {
  background-color: #e1f3d8;
}

.cell-medium {
  background-color: #fdf6ec;
}

.cell-high {
  background-color: #fef0f0;
}

.cell-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.defect-count {
  font-weight: bold;
  font-size: 16px;
}

.defect-percentage {
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
}

.total-column {
  background-color: #f5f7fa;
  font-weight: bold;
  min-width: 100px;
  position: sticky;
  right: 0;
  z-index: 1;
}

.row-total,
.column-total {
  background-color: #ecf5ff;
  font-weight: bold;
}

.row-total {
  position: sticky;
  right: 0;
  z-index: 1;
}

.row-total-count,
.column-total-count {
  font-size: 16px;
}

.row-total-percentage,
.column-total-percentage {
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
}

.grand-total {
  background-color: #dcdfe6;
  font-weight: bold;
  font-size: 18px;
  position: sticky;
  right: 0;
  z-index: 2;
}

.stats-cards {
  margin-top: 20px;
}

.stat-card {
  height: 100px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 2px;
}

.stat-detail {
  font-size: 12px;
  color: #909399;
}

.stat-change {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.change-increase {
  color: #f56c6c;
}

.change-decrease {
  color: #67c23a;
}

.change-neutral {
  color: #909399;
}

.change-label {
  color: #909399;
}

.dialog-footer {
  text-align: right;
}

.out-of-control-tag {
  cursor: pointer;
}
</style>