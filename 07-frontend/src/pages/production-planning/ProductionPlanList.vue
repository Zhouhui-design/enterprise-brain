<template>
  <div class="production-plan-list" :class="{
    'is-mobile': isMobile,
    'is-tablet': isTablet,
    'is-desktop': isDesktop
  }">
    <!-- ✅ 面包屑导航 -->
    <BreadcrumbNav
      v-if="breadcrumbItems.length > 0"
      :items="breadcrumbItems"
      variant="minimal"
      :show-home="true"
      class="page-breadcrumb"
    />

    <div class="header">
      <el-page-header :title="'生产计划管理'" :content="'生产计划列表'" />
      <div class="header-actions">
        <el-button type="primary" @click="handleCreatePlan">创建生产计划</el-button>
        <el-button @click.stop="settingsVisible = true" circle class="page-settings-trigger">
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
    </div>

    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="主生产计划编号">
          <el-input 
            ref="searchInputRef"
            v-model="searchForm.planCode" 
            placeholder="请输入主生产计划编号" 
            clearable 
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="产品编号">
          <el-input v-model="searchForm.productCode" placeholder="请输入产品编号" clearable />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.productName" placeholder="请输入产品名称" clearable />
        </el-form-item>
        <el-form-item label="进度状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="未开始" value="0" />
            <el-option label="进行中" value="1" />
            <el-option label="已完成" value="2" />
            <el-option label="已暂停" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="data-card">
      <div class="table-header">
        <span>生产计划列表</span>
        <div class="batch-actions">
          <el-button type="success" :disabled="selectedPlans.length !== 1" @click="handleExecuteSchedule">
            <el-icon><Operation /></el-icon>
            执行排程
          </el-button>
        </div>
      </div>
      <!-- 使用EnhancedTable通用表格组件 -->
      <EnhancedTable
        :data="planListData"
        :columns="tableColumns"
        :loading="loading"
        :show-selection="true"
        :show-filter="true"
        :show-pagination="true"
        :show-toolbar="true"
        :show-batch-delete="true"
        :show-export="true"
        :total="total"
        :current-page="currentPage"
        :page-size="pageSize"
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
        @batch-delete="handleBatchDelete"
        @export="handleBatchExport"
      >
        <!-- 产品图片列 -->
        <template #productImage="{ row }">
          <el-image
            v-if="row.productImage"
            :src="row.productImage"
            :preview-src-list="[row.productImage]"
            fit="cover"
            style="width: 50px; height: 50px; border-radius: 4px;"
          />
          <span v-else style="color: #999;">无图片</span>
        </template>
        
        <!-- 进度状态列 -->
        <template #status="{ row }">
          <el-tag :type="statusType[row.status]">
            {{ statusText[row.status] || '未知' }}
          </el-tag>
        </template>
        
        <!-- 操作列 -->
        <template #operation="{ row }">
          <el-button size="small" @click="handleViewDetail(row)">查看详情</el-button>
          <el-button size="small" type="primary" @click="handleEditPlan(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDeletePlan(row)">删除</el-button>
        </template>
      </EnhancedTable>
    </el-card>

    <!-- 页面设置组件（通用） -->
    <PageSettings
      v-model="settingsVisible"
      settings-key="productionPlanSettings"
      :available-fields="tableColumns"
      :show-workflow="true"
      :show-menu="false"
      :show-color="false"
      :show-encoding="true"
      :show-fields="true"
      :show-print="true"
      :show-export="true"
      :show-business-vars="true"
      :default-settings="defaultSettings"
      @save="handleSettingsSave"
    />
  </div>
</template>

<script>
import EnhancedTable from '@/components/common/EnhancedTable.vue';
import PageSettings from '@/components/common/PageSettings.vue';
import BreadcrumbNav from '@/components/common/layout/BreadcrumbNav.vue';
import { Setting, Operation } from '@element-plus/icons-vue';
import api from '@/api/masterProductionPlan';

export default {
  name: 'ProductionPlanList',
  components: {
    EnhancedTable,
    PageSettings,
    BreadcrumbNav,
    Setting,
    Operation
  },
  data() {
    return {
      loading: false,
      searchForm: {
        planCode: '',
        productCode: '',
        productName: '',
        status: '',
      },
      dateRange: [],
      planListData: [],
      selectedPlans: [],
      currentPage: 1,
      pageSize: 10,
      total: 0,
      settingsVisible: false,
      defaultSettings: {
        advanceStorageDays: 3,  // 默认提前3天入库
        exportFilePrefix: '主生产计划',
        codePrefix: 'MPS'
      },
      statusText: {
        0: '未开始',
        1: '进行中',
        2: '已完成',
        3: '已暂停'
      },
      statusType: {
        0: 'info',
        1: 'primary',
        2: 'success',
        3: 'warning'
      },
      // ✅ 响应式断点
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      // ✅ 面包屑导航
      breadcrumbItems: [
        { label: '生产管理', path: '/production' },
        { label: '计划管理', path: '/production/planning' },
        { label: '主生产计划' }
      ],
      // 表格列配置
      tableColumns: [
        {
          prop: 'planCode',
          label: '主生产计划编号',
          width: 180,
          fixed: 'left',
          sortable: true,
          filterable: true
        },
        {
          prop: 'productCode',
          label: '产品编号',
          width: 150,
          sortable: true,
          filterable: true
        },
        {
          prop: 'productName',
          label: '产品名称',
          width: 180,
          sortable: true,
          filterable: true
        },
        {
          prop: 'orderQuantity',
          label: '订单数量',
          width: 120,
          align: 'right',
          sortable: true,
          formatter: (row) => row.orderQuantity?.toLocaleString() || 0
        },
        {
          prop: 'salesperson',
          label: '销售员',
          width: 120,
          filterable: true
        },
        {
          prop: 'salesUnit',
          label: '销售单位',
          width: 100,
          filterable: true
        },
        {
          prop: 'availableStock',
          label: '可用库存',
          width: 120,
          align: 'right',
          sortable: true,
          formatter: (row) => row.availableStock?.toLocaleString() || 0
        },
        {
          prop: 'currentStock',
          label: '实时库存',
          width: 120,
          align: 'right',
          sortable: true,
          formatter: (row) => row.currentStock?.toLocaleString() || 0
        },
        {
          prop: 'planQuantity',
          label: '计划数量',
          width: 120,
          align: 'right',
          sortable: true,
          formatter: (row) => row.planQuantity?.toLocaleString() || 0
        },
        {
          prop: 'productImage',
          label: '产品图片',
          width: 100,
          slot: 'productImage'
        },
        {
          prop: 'outputProcess',
          label: '产出工序',
          width: 120,
          filterable: true,
          showOverflowTooltip: true
        },
        {
          prop: 'promisedDeliveryDate',
          label: '订单承诺交期',
          width: 120,
          sortable: true,
          formatter: (row) => this.formatDateYMD(row.promisedDeliveryDate)
        },
        {
          prop: 'realPromisedDeliveryDate',
          label: '真承诺交期',
          width: 120,
          sortable: true,
          formatter: (row) => this.calculateRealPromisedDate(row.promisedDeliveryDate)
        },
        {
          prop: 'status',
          label: '进度状态',
          width: 120,
          filterable: true,
          slot: 'status'
        },
        {
          prop: 'advanceStorageDays',
          label: '提前入库期',
          width: 120,
          align: 'center',
          formatter: (row) => this.getAdvanceStorageDays()
        },
        {
          prop: 'plannedStorageDate',
          label: '计划入库日期',
          width: 120,
          sortable: true,
          formatter: (row) => this.calculatePlannedStorageDate(row.promisedDeliveryDate)
        },
        {
          prop: 'productSource',
          label: '产品来源',
          width: 120,
          filterable: true
        },
        {
          prop: 'internalOrderNo',
          label: '内部销售订单编号',
          width: 180,
          filterable: true
        },
        {
          prop: 'customerOrderNo',
          label: '客户订单编号',
          width: 180,
          filterable: true
        },
        {
          prop: 'customerName',
          label: '客户名称',
          width: 150,
          filterable: true
        },
        {
          prop: 'submitter',
          label: '提交人',
          width: 100,
          filterable: true
        },
        {
          prop: 'submitTime',
          label: '提交时间',
          width: 160,
          sortable: true,
          formatter: (row) => this.formatDateTime(row.submitTime)
        },
        {
          prop: 'actions',
          label: '操作',
          width: 280,
          fixed: 'right',
          slot: 'actions'
        }
      ]
    };
  },
  mounted() {
    // 加载真实数据
    this.fetchPlanList();
    // ✅ 初始化响应式断点
    this.initResponsive();
    // ✅ 初始化键盘导航
    this.initKeyboardNav();
  },
  beforeUnmount() {
    // ✅ 清理事件监听器
    this.cleanupResponsive();
    this.cleanupKeyboardNav();
  },
  methods: {
    // ✅ 格式化日期为年-月-日（不补零，处理UTC时区）
    formatDateYMD(dateStr) {
      if (!dateStr) return '-';
      try {
        let year, month, day;
        
        // 如果字符串包含T，提取日期部分以避免时区转换问题
        if (dateStr.includes('T')) {
          const datePart = dateStr.split('T')[0]; // YYYY-MM-DD
          [year, month, day] = datePart.split('-').map(Number);
        } else {
          // 对于其他格式，使用常规日期处理
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return '-';
          year = date.getFullYear();
          month = date.getMonth() + 1;
          day = date.getDate();
        }
        
        // 返回不补零格式：2026-1-9
        return `${year}-${month}-${day}`;
      } catch (e) {
        return '-';
      }
    },
    
    // ✅ 计算真承诺交期 = 订单承诺交期 + 1天
    calculateRealPromisedDate(dateStr) {
      if (!dateStr) return '-';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '-';
        
        // 加一天
        date.setDate(date.getDate() + 1);
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1;  // 不补零
        const day = date.getDate();         // 不补零
        
        return `${year}-${month}-${day}`;
      } catch (e) {
        return '-';
      }
    },
    
    // ✅ 获取提前入库期（从页面设置中获取）
    getAdvanceStorageDays() {
      const settingsKey = 'productionPlanSettings'; // 与 PageSettings 的 settings-key 保持一致
      const savedSettings = localStorage.getItem(settingsKey);
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          return settings.advanceStorageDays !== undefined ? `${settings.advanceStorageDays}天` : '3天';
        } catch (e) {
          return '3天';
        }
      }
      return '3天'; // 默认值
    },
    
    // ✅ 计算计划入库日期 = 真承诺交期 - 提前入库期
    calculatePlannedStorageDate(promisedDeliveryDate) {
      if (!promisedDeliveryDate) return '-';
      
      try {
        // 首先计算真承诺交期（订单承诺交期 + 1天）
        const date = new Date(promisedDeliveryDate);
        if (isNaN(date.getTime())) return '-';
        date.setDate(date.getDate() + 1); // 加1天得到真承诺交期
        
        // 获取提前入库期
        const settingsKey = 'productionPlanSettings'; // 与 PageSettings 的 settings-key 保持一致
        const savedSettings = localStorage.getItem(settingsKey);
        let advanceDays = 3; // 默认值
        if (savedSettings) {
          try {
            const settings = JSON.parse(savedSettings);
            advanceDays = settings.advanceStorageDays !== undefined ? parseInt(settings.advanceStorageDays) : 3;
          } catch (e) {
            advanceDays = 3;
          }
        }
        
        // 计划入库日期 = 真承诺交期 - 提前入库期
        date.setDate(date.getDate() - advanceDays);
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1;  // 不补零
        const day = date.getDate();         // 不补零
        
        return `${year}-${month}-${day}`;
      } catch (e) {
        return '-';
      }
    },
    
    // ✅ 格式化日期时间（年月日小时分钟秒）
    formatDateTime(dateStr) {
      if (!dateStr) return '-';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '-';
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        const minute = date.getMinutes();
        const second = date.getSeconds();
        
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
      } catch (e) {
        return '-';
      }
    },
    
    async fetchPlanList() {
      this.loading = true;
      try {
        const params = {
          page: this.currentPage,
          pageSize: this.pageSize,
          ...(this.searchForm.planCode && { planCode: this.searchForm.planCode }),
          ...(this.searchForm.productCode && { productCode: this.searchForm.productCode }),
          ...(this.searchForm.productName && { productName: this.searchForm.productName }),
          ...(this.searchForm.status && { status: this.searchForm.status })
        };
        
        const result = await api.getList(params);
        
        this.planListData = result.list || [];
        this.total = result.total || 0;
        console.log('✅ 加载主生产计划:', this.planListData.length, '条');
      } catch (error) {
        console.error('❌ 加载主生产计划失败:', error);
        this.$message.error('加载数据失败: ' + (error.message || '未知错误'));
      } finally {
        this.loading = false;
      }
    },
    
    // 已移除模拟数据生成函数
    
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    
    
    handleSearch() {
      this.currentPage = 1;
      this.fetchPlanList();
    },
    
    handleReset() {
      this.searchForm = {
        planCode: '',
        productCode: '',
        productName: '',
        status: '',
      };
      this.dateRange = [];
      this.currentPage = 1;
      this.fetchPlanList();
    },
    
    handleSelectionChange(val) {
      this.selectedPlans = val;
    },
    
    handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
      this.fetchPlanList();
    },
    
    handlePageChange(page) {
      this.currentPage = page;
      this.fetchPlanList();
    },
    
    handleCurrentChange(current) {
      this.currentPage = current;
      this.fetchPlanList();
    },
    
    handleCreatePlan() {
      this.$router.push('/production-planning/create');
    },
    
    handleViewDetail(plan) {
      this.$router.push(`/production-planning/detail/${plan.id}`);
    },
    
    handleEditPlan(plan) {
      this.$router.push(`/production-planning/create?id=${plan.id}`);
    },
    
    async handleDeletePlan(plan) {
      this.$confirm(`确定要删除生产计划"${plan.planCode}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await api.deleteById(plan.id);
          this.$message.success('删除成功');
          this.fetchPlanList();
        } catch (error) {
          console.error('❌ 删除失败:', error);
          this.$message.error('删除失败: ' + (error.message || '未知错误'));
        }
      }).catch(() => {
        // 用户取消操作
      });
    },
    
    async handleBatchDelete() {
      this.$confirm(`确定要删除选中的${this.selectedPlans.length}个生产计划吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const ids = this.selectedPlans.map(plan => plan.id);
          await api.batchDelete(ids);
          this.$message.success(`成功删除${this.selectedPlans.length}条记录`);
          this.selectedPlans = [];
          this.fetchPlanList();
        } catch (error) {
          console.error('❌ 批量删除失败:', error);
          this.$message.error('批量删除失败: ' + (error.message || '未知错误'));
        }
      }).catch(() => {
        // 用户取消操作
      });
    },
    
    handleBatchExport() {
      // 模拟导出操作
      this.$message({
        type: 'info',
        message: '导出成功'
      });
    },
    
    // 执行排程
    async handleExecuteSchedule() {
      const selectedPlan = this.selectedPlans[0];
      if (!selectedPlan) {
        this.$message.warning('请选择一条主生产计划');
        return;
      }
      
      try {
        await this.$confirm(
          `确定要执行排程吗？

计划编号: ${selectedPlan.planCode}
产品名称: ${selectedPlan.productName}
计划数量: ${selectedPlan.planQuantity}

系统将自动：
1. 将主计划数据推送到备料计划
2. 根据产出工序自动生成工序计划`,
          '执行排程确认',
          {
            confirmButtonText: '确定执行',
            cancelButtonText: '取消',
            type: 'warning',
            dangerouslyUseHTMLString: false
          }
        );
        
        this.loading = true;
        
        const result = await api.executeSchedule(selectedPlan.id);
        
        this.$message.success(
          `排程执行成功！\n` +
          `生成备料计划: ${result.materialPlanCount || 0} 条\n` +
          `生成工序计划: ${result.processPlanCount || 0} 条`
        );
        // 刷新列表
        this.fetchPlanList();
      } catch (error) {
        if (error !== 'cancel') {
          console.error('❗ 执行排程失败:', error);
          this.$message.error(error.message || '执行排程失败');
        }
      } finally {
        this.loading = false;
      }
    },
    
    handleColumnsUpdate(newColumns) {
      this.tableColumns = newColumns;
    },
    
    handleSettingsSave(settings) {
      console.log('=== 页面设置保存调试信息 ===')
      console.log('settings 对象:', settings)
      console.log('settings.fields:', settings.fields)
      console.log('当前 tableColumns 数量:', this.tableColumns.length)
      
      // ✅ 支持列拖拽：处理 fields 字段（顺序 + 可见性）
      if (settings.fields && Array.isArray(settings.fields)) {
        console.log('✅ 收到字段设置，数量:', settings.fields.length)
        
        const fieldMap = new Map(settings.fields.map(f => [f.prop, f]))
        
        // 重新排序 tableColumns
        const newColumns = []
        settings.fields.forEach(field => {
          const col = this.tableColumns.find(c => c.prop === field.prop)
          if (col) {
            // ✅ 保持所有原有属性，只更新可见性
            const newCol = {
              ...col,  // 保留 fixed、width 等所有属性
              visible: field.visible !== false
            }
            newColumns.push(newCol)
            console.log(`✅ 添加列: ${field.label}, visible: ${field.visible}, fixed: ${col.fixed || 'none'}`)
          }
        })
        
        // 添加未在 settings.fields 中的列
        this.tableColumns.forEach(col => {
          if (!fieldMap.has(col.prop)) {
            newColumns.push({ ...col })  // ✅ 深拷贝
          }
        })
        
        // ✅ 关键：替换整个数组引用
        this.tableColumns = newColumns
        
        console.log('✅ 列顺序已更新:')
        console.log('新顺序:', newColumns.map(c => c.label).join(', '))
        console.log('可见列:', newColumns.filter(c => c.visible).map(c => c.label).join(', '))
        
        // ✅ 添加延迟，确保渲染完成
        setTimeout(() => {
          console.log('✅ 列更新完成')
        }, 100)
      } else if (settings.visibleFields) {
        // ✅ 兼容旧版本：仅更新可见性
        this.tableColumns.forEach(col => {
          col.visible = settings.visibleFields.includes(col.prop)
        })
      }
      
      // 应用业务变量
      if (settings.advanceStorageDays !== undefined) {
        console.log('📅 提前入库期设置为:', settings.advanceStorageDays, '天')
        // 这里可以在创建主生产计划时使用这个值
      }
      
      this.$message.success('设置已应用')
    },

    // ✅ 初始化响应式断点系统
    initResponsive() {
      const breakpoints = {
        mobile: '(max-width: 640px)',
        tablet: '(min-width: 641px) and (max-width: 1024px)',
        desktop: '(min-width: 1025px)'
      };

      this.mobileQuery = window.matchMedia(breakpoints.mobile);
      this.tabletQuery = window.matchMedia(breakpoints.tablet);
      this.desktopQuery = window.matchMedia(breakpoints.desktop);

      this.updateBreakpoints = () => {
        this.isMobile = this.mobileQuery?.matches || false;
        this.isTablet = this.tabletQuery?.matches || false;
        this.isDesktop = this.desktopQuery?.matches || true;
      };

      this.updateBreakpoints();

      this.mobileQuery.addEventListener('change', this.updateBreakpoints);
      this.tabletQuery.addEventListener('change', this.updateBreakpoints);
      this.desktopQuery.addEventListener('change', this.updateBreakpoints);

      console.log('✅ 响应式断点系统已激活');
    },

    // ✅ 清理响应式断点
    cleanupResponsive() {
      if (this.mobileQuery) this.mobileQuery.removeEventListener('change', this.updateBreakpoints);
      if (this.tabletQuery) this.tabletQuery.removeEventListener('change', this.updateBreakpoints);
      if (this.desktopQuery) this.desktopQuery.removeEventListener('change', this.updateBreakpoints);
      console.log('✅ 响应式断点系统已清理');
    },

    // ✅ 初始化键盘导航
    initKeyboardNav() {
      this.handleKeyDown = (event) => {
        // ESC 关闭设置弹窗
        if (event.key === 'Escape' && this.settingsVisible) {
          this.settingsVisible = false;
          console.log('✅ ESC 关闭设置弹窗');
        }
        
        // Ctrl+F 聚焦搜索
        if (event.ctrlKey && event.key === 'f') {
          event.preventDefault();
          this.$refs.searchInputRef?.focus();
          console.log('✅ Ctrl+F 聚焦搜索');
        }
        
        // Ctrl+N 新增
        if (event.ctrlKey && event.key === 'n') {
          event.preventDefault();
          this.handleCreatePlan();
          console.log('✅ Ctrl+N 创建计划');
        }
      };

      this.handleClickOutside = (event) => {
        // 如果弹窗不可见，直接返回
        if (!this.settingsVisible) return
        
        const target = event.target
        
        // ✅ 重要：排除页面设置按钮本身和弹窗内容
        const isSettingsButton = target.closest('.header-actions') || 
                               target.closest('.page-settings-trigger') ||
                               target.closest('button')?.querySelector('.el-icon') ||
                               target.tagName === 'svg' || 
                               target.tagName === 'path'
        
        const isSettingsDialog = target.closest('.el-dialog') || 
                                target.closest('.el-dialog__wrapper') ||
                                target.closest('.page-settings')
        
        // 如果点击的是设置按钮或弹窗内部，不关闭
        if (isSettingsButton || isSettingsDialog) {
          return
        }
        
        // 否则关闭弹窗
        this.settingsVisible = false
        console.log('✅ 点击外部关闭设置弹窗')
      };

      document.addEventListener('keydown', this.handleKeyDown);
      document.addEventListener('click', this.handleClickOutside);
      console.log('✅ 键盘导航已激活');
    },

    // ✅ 清理键盘导航
    cleanupKeyboardNav() {
      if (this.handleKeyDown) document.removeEventListener('keydown', this.handleKeyDown);
      if (this.handleClickOutside) document.removeEventListener('click', this.handleClickOutside);
      console.log('✅ 键盘导航已清理');
    }
  }
};
</script>

<style scoped>
.production-plan-list {
  padding: 20px;
}

/* ✅ 面包屑导航样式 */
.page-breadcrumb {
  margin-bottom: 16px;
}

.is-mobile .page-breadcrumb {
  margin-bottom: 12px;
}

/* ✅ 响应式样式调整 */
.is-mobile .production-plan-list {
  padding: 12px;
}

.is-mobile .search-card :deep(.el-card__body) {
  padding: 12px;
}

.is-mobile .header {
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.is-tablet .production-plan-list {
  padding: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin-top: 10px;
}

.data-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: bold;
}

.batch-actions {
  display: flex;
  gap: 10px;
}
</style>