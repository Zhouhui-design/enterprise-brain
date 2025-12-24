<template>
  <div class="quality-dashboard">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>质量仪表板</span>
          <div class="header-actions">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :value-format="'YYYY-MM-DD'"
              @change="handleDateRangeChange"
            />
            <el-button type="primary" @click="handleRefresh">
              <el-icon><Refresh /></el-icon> 刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 统计卡片 -->
      <div class="stats-container">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-title">质量合格率</div>
                <div class="stat-value">{{ qualityPassRate }}%</div>
                <div class="stat-desc">较上期 <span class="stat-change positive">+2.5%</span></div>
              </div>
              <div class="stat-icon success">
                <el-icon><Check /></el-icon>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-title">检查任务数</div>
                <div class="stat-value">{{ inspectionTasksCount }}</div>
                <div class="stat-desc">待执行 <span class="stat-count pending">{{ pendingTasksCount }}</span></div>
              </div>
              <div class="stat-icon primary">
                <el-icon><Document /></el-icon>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-title">缺陷总数</div>
                <div class="stat-value">{{ totalDefects }}</div>
                <div class="stat-desc">待处理 <span class="stat-count warning">{{ pendingDefectsCount }}</span></div>
              </div>
              <div class="stat-icon warning">
                <el-icon><Warning /></el-icon>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-title">审核通过率</div>
                <div class="stat-value">{{ auditPassRate }}%</div>
                <div class="stat-desc">较上期 <span class="stat-change negative">-1.2%</span></div>
              </div>
              <div class="stat-icon info">
                <el-icon><Promotion /></el-icon>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 图表区域 -->
      <div class="charts-container">
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-card shadow="hover" class="chart-card">
              <template #header>
                <div class="chart-header">
                  <span>质量趋势图</span>
                  <el-select v-model="qualityChartType" placeholder="选择图表类型">
                    <el-option label="合格率趋势" value="passRate" />
                    <el-option label="缺陷数趋势" value="defectCount" />
                  </el-select>
                </div>
              </template>
              <div class="chart-wrapper">
                <el-empty v-if="loading" description="加载中..." />
                <div v-else id="qualityTrendChart" class="chart"></div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-card shadow="hover" class="chart-card">
              <template #header>
                <div class="chart-header">
                  <span>缺陷分类统计</span>
                  <el-button size="small" @click="handleDefectAnalysis">
                    缺陷分析
                  </el-button>
                </div>
              </template>
              <div class="chart-wrapper">
                <el-empty v-if="loading" description="加载中..." />
                <div v-else id="defectCategoryChart" class="chart"></div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :xs="24" :md="12">
            <el-card shadow="hover" class="chart-card">
              <template #header>
                <div class="chart-header">
                  <span>检查类型分布</span>
                  <el-select v-model="inspectionDateRange" placeholder="时间范围">
                    <el-option label="本周" value="week" />
                    <el-option label="本月" value="month" />
                    <el-option label="本季度" value="quarter" />
                    <el-option label="本年" value="year" />
                  </el-select>
                </div>
              </template>
              <div class="chart-wrapper">
                <el-empty v-if="loading" description="加载中..." />
                <div v-else id="inspectionTypeChart" class="chart"></div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-card shadow="hover" class="chart-card">
              <template #header>
                <div class="chart-header">
                  <span>过程能力指数</span>
                  <el-select v-model="spcChartProcess" placeholder="选择工序">
                    <el-option label="注塑工序" value="injection" />
                    <el-option label="装配工序" value="assembly" />
                    <el-option label="包装工序" value="packaging" />
                  </el-select>
                </div>
              </template>
              <div class="chart-wrapper">
                <el-empty v-if="loading" description="加载中..." />
                <div v-else class="spc-indicators">
                  <div class="spc-indicator">
                    <div class="spc-label">CP 值</div>
                    <div class="spc-value" :class="getCpClass(spcIndicators.cp)">{{ spcIndicators.cp }}</div>
                  </div>
                  <div class="spc-indicator">
                    <div class="spc-label">CPK 值</div>
                    <div class="spc-value" :class="getCpkClass(spcIndicators.cpk)">{{ spcIndicators.cpk }}</div>
                  </div>
                  <div class="spc-indicator">
                    <div class="spc-label">标准差</div>
                    <div class="spc-value">{{ spcIndicators.stdDev }}</div>
                  </div>
                  <div class="spc-indicator">
                    <div class="spc-label">均值</div>
                    <div class="spc-value">{{ spcIndicators.mean }}</div>
                  </div>
                </div>
                <div id="spcIndicatorChart" class="chart"></div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 最近活动 -->
      <div class="recent-activities">
        <el-card shadow="hover" class="activity-card">
          <template #header>
            <div class="chart-header">
              <span>最近质量活动</span>
              <el-button size="small" @click="handleViewAllActivities">
                查看全部
              </el-button>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in recentActivities"
              :key="index"
              :timestamp="activity.time"
              :type="getActivityType(activity.type)"
              :icon="getActivityIcon(activity.type)"
            >
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-description">{{ activity.description }}</div>
                <div class="activity-meta">
                  <span class="activity-user">{{ activity.user }}</span>
                  <span class="activity-status" :class="getActivityStatusClass(activity.status)">
                    {{ activity.status }}
                  </span>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </div>
      
      <!-- 待处理任务 -->
      <div class="pending-tasks">
        <el-card shadow="hover" class="task-card">
          <template #header>
            <div class="chart-header">
              <span>待处理任务</span>
              <el-button size="small" @click="handleViewAllTasks">
                查看全部
              </el-button>
            </div>
          </template>
          <el-table
            :data="pendingTasks"
            style="width: 100%"
            border
            size="small"
          >
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getTaskTypeTagType(row.type)">
                  {{ row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="任务名称" min-width="250">
              <template #default="{ row }">
                <a href="#" class="task-link">{{ row.title }}</a>
              </template>
            </el-table-column>
            <el-table-column prop="deadline" label="截止日期" width="120" />
            <el-table-column prop="priority" label="优先级" width="80">
              <template #default="{ row }">
                <el-tag :type="getPriorityTagType(row.priority)">
                  {{ row.priority }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="assignee" label="负责人" width="100" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="handleProcessTask(row)">
                  处理
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Check, Document, Warning, Promotion, Refresh } from '@element-plus/icons-vue';
import * as echarts from 'echarts';

export default {
  name: 'QualityDashboard',
  components: {
    Check,
    Document,
    Warning,
    Promotion,
    Refresh
  },
  setup() {
    // 加载状态
    const loading = ref(false);
    
    // 日期范围
    const dateRange = ref([]);
    
    // 图表类型
    const qualityChartType = ref('passRate');
    const inspectionDateRange = ref('month');
    const spcChartProcess = ref('injection');
    
    // 统计数据
    const qualityPassRate = ref(92.5);
    const inspectionTasksCount = ref(156);
    const pendingTasksCount = ref(12);
    const totalDefects = ref(43);
    const pendingDefectsCount = ref(8);
    const auditPassRate = ref(94.8);
    
    // SPC指标
    const spcIndicators = reactive({
      cp: 1.35,
      cpk: 1.28,
      stdDev: 0.023,
      mean: 100.05
    });
    
    // 最近活动
    const recentActivities = ref([]);
    
    // 待处理任务
    const pendingTasks = ref([]);
    
    // 图表实例
    let qualityTrendChart = null;
    let defectCategoryChart = null;
    let inspectionTypeChart = null;
    let spcIndicatorChart = null;
    
    // 初始化数据
    const initData = () => {
      loading.value = true;
      
      // 模拟API请求延迟
      setTimeout(() => {
        generateMockData();
        initCharts();
        loading.value = false;
      }, 800);
    };
    
    // 生成模拟数据
    const generateMockData = () => {
      // 生成最近活动数据
      recentActivities.value = [
        {
          id: '1',
          title: '质量计划审批完成',
          description: '产品A的月度质量计划已通过审批，计划编号：QP20230601',
          type: 'approval',
          status: '已完成',
          user: '张三',
          time: '2023-06-15 10:30'
        },
        {
          id: '2',
          title: '缺陷处理通知',
          description: '发现产品B有外观缺陷，需要进行返工处理',
          type: 'defect',
          status: '处理中',
          user: '李四',
          time: '2023-06-15 09:15'
        },
        {
          id: '3',
          title: '检验任务分配',
          description: '新分配了5个来料检验任务，请及时处理',
          type: 'inspection',
          status: '待处理',
          user: '王五',
          time: '2023-06-14 16:45'
        },
        {
          id: '4',
          title: '质量会议记录',
          description: '每周质量例会已完成，会议记录已上传',
          type: 'meeting',
          status: '已完成',
          user: '赵六',
          time: '2023-06-14 15:20'
        },
        {
          id: '5',
          title: 'SPC异常预警',
          description: '注塑工序CPK值低于1.33，需要调整工艺参数',
          type: 'alert',
          status: '处理中',
          user: '钱七',
          time: '2023-06-14 14:10'
        }
      ];
      
      // 生成待处理任务数据
      pendingTasks.value = [
        {
          id: '1',
          type: '检验',
          title: '产品C来料检验',
          deadline: '2023-06-16',
          priority: '高',
          assignee: '张三',
          status: '待处理'
        },
        {
          id: '2',
          type: '缺陷',
          title: '产品D外观缺陷返工',
          deadline: '2023-06-17',
          priority: '中',
          assignee: '李四',
          status: '待处理'
        },
        {
          id: '3',
          type: '审核',
          title: '质量手册年度审核',
          deadline: '2023-06-20',
          priority: '高',
          assignee: '王五',
          status: '待处理'
        },
        {
          id: '4',
          type: '检验',
          title: '生产线巡检',
          deadline: '2023-06-16',
          priority: '中',
          assignee: '赵六',
          status: '待处理'
        },
        {
          id: '5',
          type: '校准',
          title: '检测设备校准',
          deadline: '2023-06-25',
          priority: '低',
          assignee: '钱七',
          status: '待处理'
        }
      ];
    };
    
    // 初始化图表
    const initCharts = () => {
      // 销毁现有图表
      destroyCharts();
      
      // 初始化质量趋势图
      initQualityTrendChart();
      
      // 初始化缺陷分类图
      initDefectCategoryChart();
      
      // 初始化检查类型分布图
      initInspectionTypeChart();
    };
    
    // 初始化质量趋势图
    const initQualityTrendChart = () => {
      const chartDom = document.getElementById('qualityTrendChart');
      if (chartDom) {
        qualityTrendChart = echarts.init(chartDom);
        
        const option = {
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'cross',
              label: {
                backgroundColor: '#6a7985'
              }
            }
          },
          legend: {
            data: [qualityChartType.value === 'passRate' ? '合格率' : '缺陷数']
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: [
            {
              type: 'category',
              boundaryGap: false,
              data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
            }
          ],
          yAxis: [
            {
              type: 'value',
              name: qualityChartType.value === 'passRate' ? '合格率(%)' : '缺陷数',
              min: qualityChartType.value === 'passRate' ? 80 : 0
            }
          ],
          series: [
            {
              name: qualityChartType.value === 'passRate' ? '合格率' : '缺陷数',
              type: 'line',
              stack: 'Total',
              smooth: true,
              lineStyle: {
                width: 3
              },
              symbol: 'circle',
              symbolSize: 8,
              areaStyle: {
                opacity: 0.3
              },
              emphasis: {
                focus: 'series'
              },
              data: qualityChartType.value === 'passRate' 
                ? [89.5, 90.2, 91.8, 92.3, 91.5, 92.8, 93.1, 92.7, 93.5, 92.9, 93.2, 92.5]
                : [32, 28, 25, 22, 26, 23, 20, 21, 18, 22, 20, 23]
            }
          ],
          color: [qualityChartType.value === 'passRate' ? '#67c23a' : '#f56c6c']
        };
        
        qualityTrendChart.setOption(option);
      }
    };
    
    // 初始化缺陷分类图
    const initDefectCategoryChart = () => {
      const chartDom = document.getElementById('defectCategoryChart');
      if (chartDom) {
        defectCategoryChart = echarts.init(chartDom);
        
        const option = {
          tooltip: {
            trigger: 'item'
          },
          legend: {
            top: '5%',
            left: 'center'
          },
          series: [
            {
              name: '缺陷分类',
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: false,
                position: 'center'
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: 18,
                  fontWeight: 'bold'
                }
              },
              labelLine: {
                show: false
              },
              data: [
                { value: 15, name: '外观缺陷' },
                { value: 12, name: '尺寸超差' },
                { value: 8, name: '功能不良' },
                { value: 5, name: '材质问题' },
                { value: 3, name: '其他缺陷' }
              ]
            }
          ]
        };
        
        defectCategoryChart.setOption(option);
      }
    };
    
    // 初始化检查类型分布图
    const initInspectionTypeChart = () => {
      const chartDom = document.getElementById('inspectionTypeChart');
      if (chartDom) {
        inspectionTypeChart = echarts.init(chartDom);
        
        const option = {
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            }
          },
          legend: {
            data: ['计划数', '实际数']
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: ['来料检验', '过程检验', '成品检验', '生产线检查', '仓库检查', '巡检']
          },
          yAxis: {
            type: 'value'
          },
          series: [
            {
              name: '计划数',
              type: 'bar',
              data: [28, 42, 36, 24, 18, 32],
              itemStyle: {
                color: '#91cc75'
              }
            },
            {
              name: '实际数',
              type: 'bar',
              data: [32, 45, 38, 22, 16, 30],
              itemStyle: {
                color: '#fac858'
              }
            }
          ]
        };
        
        inspectionTypeChart.setOption(option);
      }
    };
    
    // 销毁图表
    const destroyCharts = () => {
      if (qualityTrendChart) {
        qualityTrendChart.dispose();
        qualityTrendChart = null;
      }
      if (defectCategoryChart) {
        defectCategoryChart.dispose();
        defectCategoryChart = null;
      }
      if (inspectionTypeChart) {
        inspectionTypeChart.dispose();
        inspectionTypeChart = null;
      }
      if (spcIndicatorChart) {
        spcIndicatorChart.dispose();
        spcIndicatorChart = null;
      }
    };
    
    // 获取活动类型
    const getActivityType = (type) => {
      const typeMap = {
        'approval': 'success',
        'defect': 'warning',
        'inspection': 'primary',
        'meeting': 'info',
        'alert': 'danger'
      };
      return typeMap[type] || 'info';
    };
    
    // 获取活动图标
    const getActivityIcon = (type) => {
      const iconMap = {
        'approval': 'Check',
        'defect': 'Warning',
        'inspection': 'Document',
        'meeting': 'ChatDotSquare',
        'alert': 'WarningFilled'
      };
      return iconMap[type] || 'InfoFilled';
    };
    
    // 获取活动状态样式类
    const getActivityStatusClass = (status) => {
      const statusMap = {
        '已完成': 'status-completed',
        '处理中': 'status-processing',
        '待处理': 'status-pending'
      };
      return statusMap[status] || '';
    };
    
    // 获取任务类型标签类型
    const getTaskTypeTagType = (type) => {
      const typeMap = {
        '检验': 'primary',
        '缺陷': 'warning',
        '审核': 'success',
        '校准': 'info',
        '会议': 'info',
        '培训': 'purple'
      };
      return typeMap[type] || 'info';
    };
    
    // 获取优先级标签类型
    const getPriorityTagType = (priority) => {
      const priorityMap = {
        '高': 'danger',
        '中': 'warning',
        '低': 'success'
      };
      return priorityMap[priority] || 'info';
    };
    
    // 获取CP值样式类
    const getCpClass = (cp) => {
      if (cp >= 1.67) return 'cp-excellent';
      if (cp >= 1.33) return 'cp-good';
      if (cp >= 1.0) return 'cp-fair';
      return 'cp-poor';
    };
    
    // 获取CPK值样式类
    const getCpkClass = (cpk) => {
      if (cpk >= 1.67) return 'cp-excellent';
      if (cpk >= 1.33) return 'cp-good';
      if (cpk >= 1.0) return 'cp-fair';
      return 'cp-poor';
    };
    
    // 处理日期范围变化
    const handleDateRangeChange = () => {
      ElMessage.info('日期范围已更新');
      // 这里可以根据日期范围重新加载数据
    };
    
    // 刷新数据
    const handleRefresh = () => {
      ElMessage.info('数据刷新中...');
      initData();
    };
    
    // 处理缺陷分析
    const handleDefectAnalysis = () => {
      // 跳转到缺陷分析页面
      ElMessage.info('跳转到缺陷分析页面');
    };
    
    // 查看全部活动
    const handleViewAllActivities = () => {
      ElMessage.info('查看全部活动');
    };
    
    // 查看全部任务
    const handleViewAllTasks = () => {
      ElMessage.info('查看全部任务');
    };
    
    // 处理任务
    const handleProcessTask = (row) => {
      ElMessage.info(`处理任务: ${row.title}`);
      // 这里可以跳转到任务详情或处理页面
    };
    
    // 监听图表类型变化
    watch(qualityChartType, () => {
      initQualityTrendChart();
    });
    
    // 监听检查日期范围变化
    watch(inspectionDateRange, () => {
      initInspectionTypeChart();
    });
    
    // 监听SPC工序变化
    watch(spcChartProcess, () => {
      // 根据不同工序更新SPC指标
      if (spcChartProcess.value === 'injection') {
        Object.assign(spcIndicators, {
          cp: 1.35,
          cpk: 1.28,
          stdDev: 0.023,
          mean: 100.05
        });
      } else if (spcChartProcess.value === 'assembly') {
        Object.assign(spcIndicators, {
          cp: 1.42,
          cpk: 1.35,
          stdDev: 0.018,
          mean: 50.02
        });
      } else if (spcChartProcess.value === 'packaging') {
        Object.assign(spcIndicators, {
          cp: 1.28,
          cpk: 1.15,
          stdDev: 0.031,
          mean: 200.10
        });
      }
    });
    
    // 窗口大小变化时重新调整图表大小
    const handleResize = () => {
      if (qualityTrendChart) qualityTrendChart.resize();
      if (defectCategoryChart) defectCategoryChart.resize();
      if (inspectionTypeChart) inspectionTypeChart.resize();
      if (spcIndicatorChart) spcIndicatorChart.resize();
    };
    
    // 组件挂载时初始化
    onMounted(() => {
      initData();
      window.addEventListener('resize', handleResize);
    });
    
    // 组件卸载时清理
    const onUnmounted = () => {
      destroyCharts();
      window.removeEventListener('resize', handleResize);
    };
    
    return {
      loading,
      dateRange,
      qualityChartType,
      inspectionDateRange,
      spcChartProcess,
      qualityPassRate,
      inspectionTasksCount,
      pendingTasksCount,
      totalDefects,
      pendingDefectsCount,
      auditPassRate,
      spcIndicators,
      recentActivities,
      pendingTasks,
      
      getActivityType,
      getActivityIcon,
      getActivityStatusClass,
      getTaskTypeTagType,
      getPriorityTagType,
      getCpClass,
      getCpkClass,
      
      handleDateRangeChange,
      handleRefresh,
      handleDefectAnalysis,
      handleViewAllActivities,
      handleViewAllTasks,
      handleProcessTask
    };
  }
};
</script>

<style scoped>
.quality-dashboard {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 统计卡片样式 */
.stats-container {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-content {
  padding: 16px;
}

.stat-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stat-desc {
  font-size: 12px;
  color: #909399;
}

.stat-change {
  font-weight: 500;
}

.stat-change.positive {
  color: #67c23a;
}

.stat-change.negative {
  color: #f56c6c;
}

.stat-count {
  font-weight: 500;
}

.stat-count.pending {
  color: #e6a23c;
}

.stat-count.warning {
  color: #f56c6c;
}

.stat-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 32px;
  opacity: 0.2;
}

.stat-icon.success {
  color: #67c23a;
}

.stat-icon.primary {
  color: #409eff;
}

.stat-icon.warning {
  color: #e6a23c;
}

.stat-icon.info {
  color: #909399;
}

/* 图表容器样式 */
.charts-container {
  margin-bottom: 20px;
}

.chart-card {
  height: 400px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-wrapper {
  height: calc(100% - 52px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart {
  width: 100%;
  height: 100%;
}

/* SPC指标样式 */
.spc-indicators {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 40px 20px;
}

.spc-indicator {
  text-align: center;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.spc-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.spc-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.cp-excellent {
  color: #67c23a;
}

.cp-good {
  color: #409eff;
}

.cp-fair {
  color: #e6a23c;
}

.cp-poor {
  color: #f56c6c;
}

/* 最近活动样式 */
.recent-activities {
  margin-bottom: 20px;
}

.activity-card {
  height: auto;
}

.activity-content {
  padding: 8px 0;
}

.activity-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.activity-description {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.activity-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-user {
  font-weight: 500;
}

.activity-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}

.status-completed {
  background-color: #f0f9eb;
  color: #67c23a;
}

.status-processing {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.status-pending {
  background-color: #f4f4f5;
  color: #909399;
}

/* 待处理任务样式 */
.pending-tasks {
  margin-bottom: 20px;
}

.task-card {
  height: auto;
}

.task-link {
  color: #409eff;
  text-decoration: none;
}

.task-link:hover {
  text-decoration: underline;
}
</style>