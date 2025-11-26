# Enterprise Brain - 基于 CloudBase 的企业级业务管理系统

## 📋 项目简介

这是一个基于 UniApp 和腾讯云开发（CloudBase）的企业级跨平台应用系统，集成了完整的业务管理功能和云开发能力，目前已适配 **H5** 、 **微信小程序** 、 **支付宝小程序** 、 **抖音小程序** 以及 **App (iOS/Android)**，为开发者提供快速构建企业级全栈跨平台应用的能力。

[![Powered by CloudBase](https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/mcp/powered-by-cloudbase-badge.svg)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)

> 本项目基于 [**CloudBase AI ToolKit**](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit) 开发，通过AI提示词和 MCP 协议+云开发，让开发更智能、更高效，支持AI生成全栈代码、一键部署至腾讯云开发（免服务器）、智能日志修复。

## 🎯 核心功能模块

### 📊 售后服务管理
- **ServiceRequest.vue** - 服务请求管理
- **ComplaintManagement.vue** - 投诉管理  
- **CustomerFeedback.vue** - 客户反馈
- **ReturnProcessing.vue** - 退货处理
- **WarrantyManagement.vue** - 保修管理

### 🔧 工艺工程管理
- **ProcessDesign.vue** - 工艺设计
- **FixtureDesign.vue** - 夹具设计
- **ToolingDesign.vue** - 工装设计
- **ProcessOptimization.vue** - 工艺优化
- **StandardOperation.vue** - 标准作业

### 📄 项目与设计管理
- **ProjectManagement.vue** - 研发项目管理
  - 项目统计看板
  - 项目列表管理
  - 项目甘特图可视化
  - 项目详情跟踪
- **DesignManagement.vue** - 设计管理
  - 设计文件管理
  - 设计版本控制
  - 设计评审流程
  - 设计预览功能
- **DocumentManagement.vue** - 文档管理
- **VersionControl.vue** - 版本控制
- **DesignReview.vue** - 设计评审

### 🧩 核心子组件

#### 📈 ProjectGantt.vue
- 项目甘特图组件
- 支持日/周/月视图
- 任务层级展示
- 进度可视化

#### 👁️ DesignViewer.vue  
- 设计文件查看器
- 支持PDF、图片、CAD、3D模型
- 评审标注功能
- 全屏查看模式

#### 📜 VersionHistory.vue
- 版本历史组件
- 时间线视图
- 版本对比功能
- 变更统计

## 🏗️ 项目架构

### 前端架构

- **框架**：UniApp (基于 Vue 3)
- **构建工具**：Vite
- **多端支持**：H5、微信小程序、支付宝小程序、抖音小程序、App (iOS/Android)（其他平台适配开发中）
- **状态管理**：Vue 3 Reactivity API
- **类型支持**：TypeScript

### 云开发资源

本项目使用了以下腾讯云开发（CloudBase）资源：

- **身份认证**：用于用户登录和身份验证（匿名登录、手机验证码登录、邮箱验证码登录、手机号/用户名/邮箱密码登录、微信小程序 openId 静默登录）
- **云数据库**：用于存储应用数据
- **云函数**：用于实现业务逻辑
- **云托管**：用于实现业务逻辑
- **云存储**：用于存储文件
- **静态网站托管**：用于部署 H5 版本

## 📁 项目结构

```
├── src/
│   ├── components/
│   │   ├── show-captcha.vue       # 登录验证弹窗组件
│   │   ├── SatisfactionSurvey.vue # 满意度调查
│   │   └── ServiceForm.vue        # 服务表单
│   ├── pages/                     # UniApp 页面文件
│   │   ├── index/                 # 首页
│   │   │   ├── index.vue
│   │   │   └── index.json
│   │   ├── demo/                  # 云开发演示页面
│   │   │   ├── demo.vue
│   │   │   └── demo.json
│   │   ├── login/                 # 登录相关页面
│   │   │   ├── index.vue          # 登录主页面
│   │   │   ├── phone-login.vue    # 手机验证码登录页面
│   │   │   ├── email-login.vue    # 邮箱验证码登录页面
│   │   │   └── password-login.vue # 密码登录页面
│   │   ├── profile/               # 用户信息页面
│   │   │   └── profile.vue        # 用户信息查看页面
│   │   ├── after-sales/           # 售后服务管理页面
│   │   │   ├── AfterSalesList.vue
│   │   │   ├── ComplaintManagement.vue
│   │   │   ├── CustomerFeedback.vue
│   │   │   ├── ReturnProcessing.vue
│   │   │   ├── ServiceRequest.vue
│   │   │   └── WarrantyManagement.vue
│   │   └── process-engineering/   # 工艺工程页面
│   │       ├── FixtureDesign.vue
│   │       ├── ProcessDesign.vue
│   │       ├── ProcessOptimization.vue
│   │       ├── StandardOperation.vue
│   │       └── ToolingDesign.vue
│   ├── utils/                     # 工具函数和云开发初始化
│   │   ├── cloudbase.ts           # 云开发配置
│   │   └── index.ts               # 通用工具函数
│   ├── static/                    # 静态资源
│   ├── App.vue                    # 应用入口组件
│   ├── main.ts                    # 应用入口文件
│   ├── pages.json                 # 页面路由配置
│   └── manifest.json              # 应用配置文件
├── 07-frontend/src/pages/after-sales/  # 企业管理详细页面
│   ├── ProjectManagement.vue     # 项目管理
│   ├── DesignManagement.vue       # 设计管理
│   ├── DocumentManagement.vue     # 文档管理
│   ├── VersionControl.vue         # 版本控制
│   ├── DesignReview.vue           # 设计评审
│   └── components/                # 子组件
│       ├── ProjectGantt.vue       # 甘特图
│       ├── DesignViewer.vue       # 设计查看器
│       └── VersionHistory.vue     # 版本历史
├── cloudfunctions/                # 云函数目录
│   └── hello/                     # 示例云函数
│       ├── index.js
│       └── package.json
├── index.html                     # H5 模板
├── vite.config.ts                 # Vite 配置
├── tsconfig.json                  # TypeScript 配置
├── package.json                   # 项目依赖
├── cloudbaserc.json               # CloudBase CLI 配置
└── README.md                      # 项目说明
```

## 🚀 快速开始

### 前提条件

- 安装 Node.js (版本 16 或更高)
- 安装 HBuilderX 或其他支持 UniApp 的开发工具
- 腾讯云开发账号 (可在[腾讯云开发官网](https://tcb.cloud.tencent.com/)注册)

### 安装依赖

```bash
npm install
```

### 配置云开发环境

1. 打开 `src/utils/cloudbase.ts` 文件
2. 将 `ENV_ID` 变量的值修改为您的云开发环境 ID

```typescript
const ENV_ID = 'your-env-id'; // 替换为您的云开发环境ID
```

### 本地开发

```bash
# H5 开发
npm run dev:h5

# 微信小程序开发
npm run dev:mp-weixin

# 抖音小程序开发
npm run dev:mp-toutiao

# 支付宝小程序开发
npm run dev:mp-alipay

# App (iOS/Android) 开发
# 1. 使用 HBuilderX 打开项目
# 2. 在顶部菜单栏选择【运行】->【运行到手机或模拟器】-> 选择您的设备
```

### 构建生产版本

```bash
# 构建 H5 版本
npm run build:h5

# 构建微信小程序
npm run build:mp-weixin

# 构建抖音小程序
npm run build:mp-toutiao

# 构建支付宝小程序
npm run build:mp-alipay
```

## 🔧 云开发使用示例

通过 `src/utils/cloudbase.ts` 访问云开发服务：

```typescript
import { app, ensureLogin } from './utils/cloudbase'

// 数据库操作
await ensureLogin();
const db = app.database();
const result = await db.collection('users').get(); // 查询数据
await db.collection('users').add({ name: 'test' }); // 添加数据

// 调用云函数
const funcResult = await app.callFunction({ name: 'hello' });

// 文件上传
const uploadResult = await app.uploadFile({ cloudPath: 'test.jpg', filePath: file });
```

## 🌐 部署指南

### 部署云函数

```bash
# 使用 CloudBase CLI
tcb functions:deploy hello
```

### 部署到云开发静态网站托管（H5版本）

1. 构建 H5 版本：`npm run build:h5`
2. 登录腾讯云开发控制台
3. 进入您的环境 -> 静态网站托管
4. 上传 `dist/build/h5` 目录中的文件

## 📊 特性亮点

- ✅ **跨平台支持** - 一套代码多端运行 (H5/微信小程序/支付宝小程序/抖音小程序/App)
- ✅ **企业级功能** - 完整的业务管理、设计管理、项目管理功能
- ✅ **云原生架构** - 深度集成腾讯云开发服务
- ✅ **TypeScript支持** - 类型安全的开发体验
- ✅ **模块化设计** - 高度可复用的组件架构
- ✅ **实时数据同步** - 基于云开发实时数据库

## 🔄 Git自动化工具

项目提供了多种自动化Git推送脚本：

### 推荐使用 (PowerShell)
```powershell
./quick_push.ps1
```

### 备选方案
```bash
# 智能批处理
smart_commit.bat

# 简单批处理  
auto_push.bat

# AI工作流
ai_start_work.bat  # AI开发开始
ai_finish_work.bat # AI开发完成并提交
```

## 🌟 平台适配状态

### ✅ 已适配平台
- **H5 端** - 完全支持所有云开发功能
- **微信小程序** - 完全支持所有云开发功能
- **抖音小程序** - 完全支持所有云开发功能
- **支付宝小程序** - 完全支持所有云开发功能
- **App 端 (iOS/Android)** - 完全支持所有云开发功能

### 🚧 开发中平台
- 其他小程序平台适配开发中

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证

## 👥 团队

- **项目负责人**: sardenesy
- **技术栈**: UniApp + Vue 3 + CloudBase
- **仓库地址**: https://gitcode.com/sardenesy/enterprise-brain

## 📚 相关链接

- [UniApp 官方文档](https://uniapp.dcloud.io/)
- [云开发官方文档](https://cloud.tencent.com/document/product/876)
- [CloudBase AI ToolKit](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)

---

*🚀 让我们构建更美好的企业级跨平台应用！*