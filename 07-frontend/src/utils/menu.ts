// src/utils/menu.ts
import { 
  HomeFilled, Monitor, OfficeBuilding, Factory, Warehouse, ShoppingCart, Setting, 
  Company, User, Calendar, ShoppingBag, Box, House, Briefcase, Document, 
  DataAnalysis, Ticket, Star, Truck, BarChart, Hammer, Dashboard, 
  FileText, Scale, Database, Cpu
} from '@element-plus/icons-vue';

// 菜单类型定义（可选，TypeScript 类型提示）
interface MenuItem {
  path: string;       // 路由路径（与 router/index.ts 一致）
  name: string;       // 菜单名称
  icon?: any;         // 图标（Element Plus 图标组件）
  children?: MenuItem[]; // 子菜单
}

// 菜单列表（与路由完全对应，侧边栏会循环渲染）
export const menuList: MenuItem[] = [
  {
    path: '/dashboard',
    name: '系统首页',
    icon: HomeFilled
  },
  {
    path: '/oa',
    name: 'OA办公',
    icon: OfficeBuilding,
    children: [
      { path: '/oa/document', name: '文档中心' },
      { path: '/oa/workflow', name: '工作流管理' },
      { path: '/oa/notification', name: '通知中心' }
    ]
  },
  {
    path: '/sales',
    name: '销售管理',
    icon: ShoppingCart
  },
  {
    path: '/purchase',
    name: '采购管理',
    icon: ShoppingBag
  },
  {
    path: '/product',
    name: '产品管理',
    icon: Box
  },
  {
    path: '/inventory',
    name: '库存管理',
    icon: Warehouse
  },
  {
    path: '/warehouse',
    name: '仓库管理',
    icon: House
  },
  {
    path: '/production-resources',
    name: '生产资源',
    icon: Factory,
    children: [
      { path: '/production-resources/equipment', name: '设备管理' },
      { path: '/production-resources/fixture', name: '夹具管理' },
      { path: '/production-resources/mold', name: '模具管理' },
      { path: '/production-resources/tooling', name: '工装管理' }
    ]
  },
  {
    path: '/production-planning',
    name: '生产计划',
    icon: Calendar,
    children: [
      { path: '/production-planning/plan-list', name: '主生产计划' },
      { path: '/production-planning/material-preparation-new', name: '备料计划' },
      { path: '/production-planning/real-process-plan', name: '真工序计划' },
      { path: '/production-planning/packaging-process-plan', name: '包装工序计划' },
      { path: '/production-planning/assembly-process-plan', name: '组装工序计划' }
    ]
  },
  {
    path: '/manufacturing',
    name: '生产制造',
    icon: Factory
  },
  {
    path: '/production-dispatch',
    name: '生产调度',
    icon: Briefcase
  },
  {
    path: '/production-reporting',
    name: '生产报表',
    icon: FileText
  },
  {
    path: '/process-engineering',
    name: '工艺工程',
    icon: Hammer
  },
  {
    path: '/process-planning',
    name: '工艺规划',
    icon: Document
  },
  {
    path: '/bom',
    name: 'BOM管理',
    icon: Box
  },
  {
    path: '/material',
    name: '物料管理',
    icon: ShoppingBag
  },
  {
    path: '/material-management',
    name: '物料业务',
    icon: Database
  },
  {
    path: '/mrp',
    name: 'MRP管理',
    icon: Dashboard
  },
  {
    path: '/cost',
    name: '成本管理',
    icon: Scale
  },
  {
    path: '/finance',
    name: '财务管理',
    icon: BarChart
  },
  {
    path: '/quality-management',
    name: '质量管理',
    icon: Star
  },
  {
    path: '/shipping',
    name: '发货管理',
    icon: Truck
  },
  {
    path: '/after-sales',
    name: '售后管理',
    icon: Ticket
  },
  {
    path: '/analytics',
    name: '数据分析',
    icon: DataAnalysis
  },
  {
    path: '/ai',
    name: 'AI模块',
    icon: Cpu
  },
  {
    path: '/system',
    name: '系统管理',
    icon: Setting,
    children: [
      { path: '/system/audit', name: '审计管理' }
    ]
  },
  {
    path: '/system/audit',
    name: '审计管理',
    icon: Monitor,
    children: [
      { path: '/system/audit/log-list', name: '审计日志列表' },
      { path: '/system/audit/data-change', name: '数据变更记录' },
      { path: '/system/audit/operation-trace', name: '操作轨迹' }
    ]
  },
  {
    path: '/company',
    name: '企业信息',
    icon: Company,
    children: [
      { path: '/company/intro', name: '企业简介' },
      { path: '/company/contact', name: '联系方式' },
      { path: '/company/privacy', name: '隐私政策' }
    ]
  },
  {
    path: '/human-resources',
    name: '人事管理',
    icon: User,
    children: [
      { path: '/human-resources/dashboard', name: '人事概览' },
      { path: '/human-resources/employee-list', name: '员工台账' },
      { path: '/human-resources/user-list', name: '用户列表' },
      { path: '/human-resources/company-calendar', name: '企业日历' }
    ]
  }
];

export default menuList;