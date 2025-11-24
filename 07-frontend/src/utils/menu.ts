// src/utils/menu.ts
import { HomeFilled, Monitor, OfficeBuilding, Factory, Warehouse, ShoppingCart, Setting, Company } from '@element-plus/icons-vue';

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
    path: '/inventory',
    name: '库存管理',
    icon: Warehouse
  },
  {
    path: '/sales',
    name: '销售管理',
    icon: ShoppingCart
  },
  {
    path: '/company/intro',
    name: '企业信息',
    icon: Company,
    children: [
      { path: '/company/intro', name: '企业简介' },
      { path: '/company/contact', name: '联系方式' },
      { path: '/company/privacy', name: '隐私政策' }
    ]
  }
];

export default menuList;
