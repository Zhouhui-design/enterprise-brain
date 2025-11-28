// 导出所有图表组件
import BaseChart from './BaseChart.vue'
import LineChart from './LineChart.vue'
import BarChart from './BarChart.vue'
import PieChart from './PieChart.vue'
import Dashboard from './Dashboard.vue'
import DashboardWidget from './DashboardWidget.vue'
import KPIChart from './KPIChart.vue'
import TrendChart from './TrendChart.vue'

// 导出单个组件
export { BaseChart, LineChart, BarChart, PieChart, Dashboard, DashboardWidget, KPIChart, TrendChart }

// 导出默认对象，包含所有组件
export default {
  BaseChart,
  LineChart,
  BarChart,
  PieChart,
  Dashboard,
  DashboardWidget,
  KPIChart,
  TrendChart
}

// 导出类型定义
export * from './BaseChart.vue'
export * from './LineChart.vue'
export * from './BarChart.vue'
export * from './PieChart.vue'
export * from './Dashboard.vue'
export * from './DashboardWidget.vue'
export * from './KPIChart.vue'
export * from './TrendChart.vue'