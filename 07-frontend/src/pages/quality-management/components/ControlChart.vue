<template>
  <div class="control-chart">
    <el-card class="chart-card">
      <template #header>
        <div class="chart-header">
          <span>{{ chartTitle || '控制图' }}</span>
          <div class="chart-actions">
            <el-button size="small" @click="handleZoomIn">放大</el-button>
            <el-button size="small" @click="handleZoomOut">缩小</el-button>
            <el-button size="small" @click="handleResetZoom">重置视图</el-button>
          </div>
        </div>
      </template>
      
      <!-- 图表容器 -->
      <div :id="chartId || 'controlChart'" :style="{ height: chartHeight || '400px' }" ref="chartContainer"></div>
      
      <!-- 统计信息 -->
      <div class="stats-section" v-if="showStats">
        <el-descriptions :column="5" size="small">
          <el-descriptions-item label="均值" v-if="stats.mean">{{ stats.mean }}</el-descriptions-item>
          <el-descriptions-item label="标准差" v-if="stats.stdDev">{{ stats.stdDev }}</el-descriptions-item>
          <el-descriptions-item label="CP" v-if="stats.cp">{{ stats.cp }}</el-descriptions-item>
          <el-descriptions-item label="CPK" v-if="stats.cpk">{{ stats.cpk }}</el-descriptions-item>
          <el-descriptions-item label="状态" v-if="stats.status">
            <el-tag :type="getStatusType(stats.status)">{{ getStatusText(stats.status) }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <!-- 异常点提示 -->
      <div class="out-of-control" v-if="outOfControlPoints.length > 0">
        <el-alert
          title="发现异常点"
          type="warning"
          :description="`共发现 ${outOfControlPoints.length} 个点超出控制界限`"
          show-icon
        >
          <template #default>
            <div class="out-of-control-list">
              <el-tag
                v-for="point in outOfControlPoints.slice(0, 5)"
                :key="point.id"
                type="danger"
                size="small"
                class="out-of-control-tag"
              >
                第{{ point.sampleNumber }}点
              </el-tag>
              <el-tag v-if="outOfControlPoints.length > 5" type="info" size="small" class="out-of-control-tag">
                等{{ outOfControlPoints.length }}个点
              </el-tag>
            </div>
          </template>
        </el-alert>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';

// 这里暂时使用模拟实现，实际项目中应引入ECharts或其他图表库
export default {
  name: 'ControlChart',
  props: {
    // 图表类型: xR(均值-极差图), xS(均值-标准差图), p(不良率图), c(缺陷数图), u(单位缺陷数图)
    chartType: {
      type: String,
      default: 'xR'
    },
    // 图表数据
    chartData: {
      type: Array,
      default: () => []
    },
    // 控制限
    controlLimits: {
      type: Object,
      default: () => ({
        ucl: 0,
        cl: 0,
        lcl: 0
      })
    },
    // 规格限
    specLimits: {
      type: Object,
      default: () => ({
        usl: 0,
        target: 0,
        lsl: 0
      })
    },
    // 样本量
    sampleSize: {
      type: Number,
      default: 5
    },
    // 图表标题
    chartTitle: {
      type: String,
      default: ''
    },
    // 图表高度
    chartHeight: {
      type: String,
      default: '400px'
    },
    // 自定义图表ID
    chartId: {
      type: String,
      default: ''
    },
    // 是否显示统计信息
    showStats: {
      type: Boolean,
      default: true
    },
    // 是否显示异常点提示
    showOutOfControl: {
      type: Boolean,
      default: true
    },
    // 统计信息
    stats: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['chart-ready', 'data-point-click', 'chart-zoom', 'out-of-control'],
  setup(props, { emit }) {
    const chartContainer = ref(null);
    const chartInstance = ref(null);
    const zoomLevel = ref(1);
    const outOfControlPoints = ref([]);
    
    // 计算异常点
    const calculateOutOfControlPoints = () => {
      const { chartData, controlLimits } = props;
      if (!chartData || chartData.length === 0) {
        outOfControlPoints.value = [];
        return;
      }
      
      const points = [];
      const { ucl, lcl } = controlLimits;
      
      chartData.forEach((point, index) => {
        // 根据不同图表类型判断是否超出控制限
        let value;
        switch (props.chartType) {
          case 'xR':
          case 'xS':
            value = point.sampleMean;
            break;
          case 'p':
            value = point.pValue;
            break;
          case 'c':
            value = point.cValue;
            break;
          case 'u':
            value = point.uValue;
            break;
          default:
            value = point.value;
        }
        
        // 检查是否超出控制限
        if ((lcl !== null && lcl !== undefined && value < lcl) || 
            (ucl !== null && ucl !== undefined && value > ucl)) {
          points.push({
            id: point.id || index + 1,
            sampleNumber: point.sampleNumber || index + 1,
            value,
            pointData: point,
            reason: value < lcl ? '低于下控制限' : '高于上控制限'
          });
        }
      });
      
      outOfControlPoints.value = points;
      
      // 触发异常点事件
      if (points.length > 0) {
        emit('out-of-control', points);
      }
    };
    
    // 初始化图表
    const initChart = () => {
      if (!chartContainer.value) return;
      
      // 模拟实现，实际项目中应使用ECharts等图表库
      console.log('初始化控制图', {
        chartType: props.chartType,
        chartData: props.chartData.length,
        controlLimits: props.controlLimits,
        specLimits: props.specLimits
      });
      
      // 这里简单地在容器中绘制一些文本作为模拟
      chartContainer.value.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; font-family: Arial, sans-serif;">
          <div style="font-size: 18px; margin-bottom: 20px;">${props.chartTitle || '控制图'}</div>
          <div style="font-size: 14px; color: #606266; margin-bottom: 10px;">图表类型: ${getChartTypeText(props.chartType)}</div>
          <div style="font-size: 14px; color: #606266;">数据点数量: ${props.chartData.length}</div>
          <div style="position: absolute; bottom: 20px; right: 20px; font-size: 12px; color: #909399;">
            实际项目中应使用图表库绘制完整控制图
          </div>
        </div>
      `;
      
      // 模拟图表实例
      chartInstance.value = { zoom: 1 };
      
      emit('chart-ready', chartInstance.value);
    };
    
    // 渲染图表
    const renderChart = () => {
      if (!chartInstance.value) {
        initChart();
        return;
      }
      
      // 更新图表数据，实际项目中应调用图表库的更新方法
      console.log('更新控制图数据', {
        chartType: props.chartType,
        chartData: props.chartData.length,
        controlLimits: props.controlLimits,
        specLimits: props.specLimits
      });
      
      // 重新计算异常点
      calculateOutOfControlPoints();
    };
    
    // 放大图表
    const handleZoomIn = () => {
      zoomLevel.value += 0.1;
      chartInstance.value.zoom = zoomLevel.value;
      emit('chart-zoom', zoomLevel.value);
      
      // 实际项目中应调用图表库的缩放方法
      if (chartContainer.value) {
        chartContainer.value.style.transform = `scale(${zoomLevel.value})`;
        chartContainer.value.style.transformOrigin = 'center center';
      }
    };
    
    // 缩小图表
    const handleZoomOut = () => {
      if (zoomLevel.value > 0.2) {
        zoomLevel.value -= 0.1;
        chartInstance.value.zoom = zoomLevel.value;
        emit('chart-zoom', zoomLevel.value);
        
        // 实际项目中应调用图表库的缩放方法
        if (chartContainer.value) {
          chartContainer.value.style.transform = `scale(${zoomLevel.value})`;
          chartContainer.value.style.transformOrigin = 'center center';
        }
      } else {
        ElMessage.warning('已缩小到最小比例');
      }
    };
    
    // 重置视图
    const handleResetZoom = () => {
      zoomLevel.value = 1;
      chartInstance.value.zoom = zoomLevel.value;
      emit('chart-zoom', zoomLevel.value);
      
      // 实际项目中应调用图表库的重置方法
      if (chartContainer.value) {
        chartContainer.value.style.transform = 'scale(1)';
        chartContainer.value.style.transformOrigin = 'center center';
      }
    };
    
    // 获取图表类型文本
    const getChartTypeText = (type) => {
      const typeMap = {
        xR: 'X-R图(均值-极差图)',
        xS: 'X-S图(均值-标准差图)',
        p: 'P图(不良率图)',
        c: 'C图(缺陷数图)',
        u: 'U图(单位缺陷数图)'
      };
      return typeMap[type] || '未知类型';
    };
    
    // 获取状态类型
    const getStatusType = (status) => {
      const statusMap = {
        stable: 'success',
        unstable: 'danger',
        warning: 'warning',
        excellent: 'success',
        adequate: 'warning',
        poor: 'danger'
      };
      return statusMap[status] || 'default';
    };
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        stable: '稳定',
        unstable: '不稳定',
        warning: '警告',
        excellent: '优',
        adequate: '合格',
        poor: '不足'
      };
      return statusMap[status] || '未知状态';
    };
    
    // 监听数据变化
    watch(() => props.chartData, () => {
      nextTick(() => {
        renderChart();
      });
    }, { deep: true });
    
    watch(() => props.controlLimits, () => {
      nextTick(() => {
        renderChart();
      });
    }, { deep: true });
    
    watch(() => props.chartType, () => {
      nextTick(() => {
        renderChart();
      });
    });
    
    // 组件挂载时初始化图表
    onMounted(() => {
      nextTick(() => {
        initChart();
        calculateOutOfControlPoints();
      });
    });
    
    // 组件销毁时清理图表实例
    onUnmounted(() => {
      if (chartInstance.value) {
        // 实际项目中应调用图表库的销毁方法
        chartInstance.value = null;
      }
    });
    
    return {
      chartContainer,
      outOfControlPoints,
      handleZoomIn,
      handleZoomOut,
      handleResetZoom,
      getStatusType,
      getStatusText
    };
  }
};
</script>

<style scoped>
.control-chart {
  width: 100%;
}

.chart-card {
  width: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-actions {
  display: flex;
  gap: 8px;
}

#controlChart {
  position: relative;
  width: 100%;
  min-height: 400px;
  background-color: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.stats-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.out-of-control {
  margin-top: 16px;
}

.out-of-control-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.out-of-control-tag {
  cursor: pointer;
}

.out-of-control-tag:hover {
  opacity: 0.8;
}
</style>