<template>
  <CommonFinanceTemplate
    pageTitle="成本管理"
    :table-data="costData"
    :show-search="true"
    :show-table="true"
    :show-pagination="true"
    :show-statistics="true"
    :show-chart="true"
    :show-selection="true"
    chartTitle="成本趋势分析"
    ref="templateRef"
    @search="handleSearch"
    @reset="handleReset"
    @page-change="handlePageChange"
    @mounted="handleMounted"
  >
    <!-- 表格操作列自定义内容 -->
    <template #operation="{ row }">
      <el-button type="primary" size="small" @click="handleEditCost(row)">编辑</el-button>
      <el-button type="info" size="small" @click="handleViewCost(row)">查看</el-button>
      <el-button type="danger" size="small" @click="handleDeleteCost(row)">删除</el-button>
    </template>
    
    <!-- 成本类别显示 -->
    <template #category="{ row }">
      <el-tag :type="getCategoryType(row.category)" size="small">{{ getCategoryText(row.category) }}</el-tag>
    </template>
    
    <!-- 部门名称显示 -->
    <template #department="{ row }">
      {{ getDepartmentName(row.departmentId) }}
    </template>
    
    <!-- 负责人显示 -->
    <template #manager="{ row }">
      {{ getManagerName(row.managerId) }}
    </template>
    
    <!-- 编辑成本对话框 -->
    <template #dialog-edit-cost="{ dialog }">
      <el-form :model="costForm" :rules="costFormRules" ref="costFormRef" label-width="120px">
        <el-form-item label="成本名称" prop="name">
          <el-input v-model="costForm.name" placeholder="请输入成本名称" />
        </el-form-item>
        <el-form-item label="成本日期" prop="costDate">
          <el-date-picker v-model="costForm.costDate" type="date" placeholder="请选择成本日期" />
        </el-form-item>
        <el-form-item label="成本类别" prop="category">
          <el-select v-model="costForm.category" placeholder="请选择成本类别">
            <el-option
              v-for="cat in costCategories"
              :key="cat.value"
              :label="cat.label"
              :value="cat.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="成本金额" prop="amount">
          <el-input-number v-model="costForm.amount" :min="0.01" :step="0.01" />
        </el-form-item>
        <el-form-item label="所属部门" prop="departmentId">
          <el-select v-model="costForm.departmentId" placeholder="请选择所属部门">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="managerId">
          <el-select v-model="costForm.managerId" placeholder="请选择负责人">
            <el-option
              v-for="user in managers"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="成本描述" prop="description">
          <el-input v-model="costForm.description" type="textarea" :rows="3" placeholder="请输入成本描述" />
        </el-form-item>
        <el-form-item label="关联项目" prop="projectId">
          <el-select v-model="costForm.projectId" placeholder="请选择关联项目（可选）">
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="是否已付款" prop="isPaid">
          <el-switch v-model="costForm.isPaid" />
        </el-form-item>
      </el-form>
    </template>
    
    <!-- 查看成本对话框 -->
    <template #dialog-view-cost="{ dialog }">
      <div class="cost-detail">
        <h3 style="margin-bottom: 20px;">成本基本信息</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="成本名称">{{ currentCost.name }}</el-descriptions-item>
          <el-descriptions-item label="成本日期">{{ formatDate(currentCost.costDate) }}</el-descriptions-item>
          <el-descriptions-item label="成本类别">{{ getCategoryText(currentCost.category) }}</el-descriptions-item>
          <el-descriptions-item label="成本金额">{{ formatCurrency(currentCost.amount) }}</el-descriptions-item>
          <el-descriptions-item label="所属部门">{{ getDepartmentName(currentCost.departmentId) }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ getManagerName(currentCost.managerId) }}</el-descriptions-item>
          <el-descriptions-item label="关联项目">{{ getProjectName(currentCost.projectId) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="付款状态">{{ currentCost.isPaid ? '已付款' : '未付款' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(currentCost.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="成本描述">{{ currentCost.description || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <h3 style="margin-top: 30px; margin-bottom: 20px;">成本明细</h3>
        <el-table :data="currentCostDetails" border style="width: 100%;">
          <el-table-column prop="itemName" label="明细项目" width="180" />
          <el-table-column prop="quantity" label="数量" width="100" />
          <el-table-column prop="unitPrice" label="单价" width="120" :formatter="formatCurrency" />
          <el-table-column prop="itemAmount" label="金额" width="120" :formatter="formatCurrency" />
          <el-table-column prop="remark" label="备注" minWidth="200" />
        </el-table>
      </div>
    </template>
    
    <!-- 删除确认对话框 -->
    <template #dialog-delete-confirm="{ dialog }">
      <div class="delete-confirm">
        <p>确定要删除成本记录 <strong>{{ deleteTargetName }}</strong> 吗？</p>
        <p class="delete-tips">此操作不可撤销，删除后将无法恢复。</p>
      </div>
    </template>
    
    <!-- 成本分析对话框 -->
    <template #dialog-cost-analysis="{ dialog }">
      <div class="cost-analysis">
        <div class="analysis-tabs">
          <el-tabs v-model="activeAnalysisTab">
            <el-tab-pane label="按类别分析" name="category">
              <div ref="categoryChartRef" class="chart-container" style="height: 400px;"></div>
            </el-tab-pane>
            <el-tab-pane label="按部门分析" name="department">
              <div ref="departmentChartRef" class="chart-container" style="height: 400px;"></div>
            </el-tab-pane>
            <el-tab-pane label="按时间趋势" name="trend">
              <div ref="trendChartRef" class="chart-container" style="height: 400px;"></div>
            </el-tab-pane>
          </el-tabs>
        </div>
        
        <div class="analysis-filters" style="margin-top: 20px;">
          <el-form :inline="true" :model="analysisFilters" label-width="80px">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="analysisFilters.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item label="成本类别">
              <el-select v-model="analysisFilters.category" placeholder="全部类别" multiple collapse-tags>
                <el-option
                  v-for="cat in costCategories"
                  :key="cat.value"
                  :label="cat.label"
                  :value="cat.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="updateAnalysisCharts">更新图表</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </template>
  </CommonFinanceTemplate>
</template>

<script>
import { ref, reactive, onMounted, nextTick, watch } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import CommonFinanceTemplate from './template/CommonFinanceTemplate.vue';

export default {
  name: 'CostManagement',
  components: {
    CommonFinanceTemplate
  },
  setup() {
    // 模板引用
    const templateRef = ref(null);
    const costFormRef = ref(null);
    
    // 图表引用
    const categoryChartRef = ref(null);
    const departmentChartRef = ref(null);
    const trendChartRef = ref(null);
    
    // 状态管理
    const costData = ref([]);
    const currentCost = reactive({});
    const currentCostDetails = ref([]);
    const deleteTargetId = ref(null);
    const deleteTargetName = ref('');
    const activeAnalysisTab = ref('category');
    
    // 分析筛选条件
    const analysisFilters = reactive({
      dateRange: [],
      category: []
    });
    
    // 表单数据
    const costForm = reactive({
      id: '',
      name: '',
      costDate: new Date(),
      category: '',
      amount: 0,
      departmentId: '',
      managerId: '',
      description: '',
      projectId: '',
      isPaid: false
    });
    
    // 表单验证规则
    const costFormRules = {
      name: [
        { required: true, message: '请输入成本名称', trigger: 'blur' },
        { min: 2, max: 100, message: '成本名称长度在 2 到 100 个字符', trigger: 'blur' }
      ],
      costDate: [
        { required: true, message: '请选择成本日期', trigger: 'change' }
      ],
      category: [
        { required: true, message: '请选择成本类别', trigger: 'change' }
      ],
      amount: [
        { required: true, message: '请输入成本金额', trigger: 'change' },
        { type: 'number', min: 0.01, message: '成本金额必须大于0', trigger: 'change' }
      ],
      departmentId: [
        { required: true, message: '请选择所属部门', trigger: 'change' }
      ],
      managerId: [
        { required: true, message: '请选择负责人', trigger: 'change' }
      ]
    };
    
    // 模拟数据
    const departments = [
      { id: 1, name: '财务部' },
      { id: 2, name: '市场部' },
      { id: 3, name: '销售部' },
      { id: 4, name: '人力资源部' },
      { id: 5, name: '技术部' },
      { id: 6, name: '运营部' },
      { id: 7, name: '采购部' },
      { id: 8, name: '生产部' }
    ];
    
    const managers = [
      { id: 1, name: '张三' },
      { id: 2, name: '李四' },
      { id: 3, name: '王五' },
      { id: 4, name: '赵六' },
      { id: 5, name: '钱七' }
    ];
    
    const projects = [
      { id: 1, name: '项目A' },
      { id: 2, name: '项目B' },
      { id: 3, name: '项目C' },
      { id: 4, name: '项目D' },
      { id: 5, name: '项目E' }
    ];
    
    // 成本类别
    const costCategories = [
      { value: 'SALARY', label: '薪资福利', type: 'primary' },
      { value: 'OFFICE', label: '办公费用', type: 'success' },
      { value: 'MARKETING', label: '市场推广', type: 'warning' },
      { value: 'TRAVEL', label: '差旅费', type: 'danger' },
      { value: 'TRAINING', label: '培训费', type: 'info' },
      { value: 'TECHNOLOGY', label: '技术投入', type: 'primary' },
      { value: 'LOGISTICS', label: '物流仓储', type: 'success' },
      { value: 'UTILITIES', label: '水电物业', type: 'warning' },
      { value: 'EQUIPMENT', label: '设备购置', type: 'danger' },
      { value: 'MAINTENANCE', label: '维护费用', type: 'info' },
      { value: 'OTHER', label: '其他费用', type: 'default' }
    ];
    
    // 初始化搜索字段
    const initSearchFields = () => {
      const searchFields = [
        {
          key: 'name',
          type: 'input',
          label: '成本名称',
          placeholder: '请输入成本名称',
          clearable: true
        },
        {
          key: 'costDateRange',
          type: 'date',
          label: '成本日期',
          dateType: 'daterange',
          startPlaceholder: '开始日期',
          endPlaceholder: '结束日期'
        },
        {
          key: 'category',
          type: 'select',
          label: '成本类别',
          options: costCategories.map(cat => ({ value: cat.value, label: cat.label })),
          clearable: true
        },
        {
          key: 'departmentId',
          type: 'select',
          label: '所属部门',
          options: departments.map(dept => ({ value: dept.id, label: dept.name })),
          clearable: true
        },
        {
          key: 'managerId',
          type: 'select',
          label: '负责人',
          options: managers.map(manager => ({ value: manager.id, label: manager.name })),
          clearable: true
        },
        {
          key: 'isPaid',
          type: 'select',
          label: '付款状态',
          options: [
            { value: true, label: '已付款' },
            { value: false, label: '未付款' }
          ],
          clearable: true
        },
        {
          key: 'amountRange',
          type: 'date',
          label: '金额范围',
          dateType: 'daterange',
          startPlaceholder: '最小金额',
          endPlaceholder: '最大金额'
        }
      ];
      
      templateRef.value?.initSearchForm(searchFields);
    };
    
    // 初始化统计卡片
    const initStatisticsCards = () => {
      const cards = [
        {
          label: '成本记录总数',
          value: '0',
          type: 'primary',
          description: '所有成本记录数量'
        },
        {
          label: '本月成本',
          value: '0.00 元',
          type: 'success',
          description: '当前月份发生的成本总额'
        },
        {
          label: '年度累计成本',
          value: '0.00 元',
          type: 'info',
          description: '本年度累计成本总额'
        },
        {
          label: '未付款成本',
          value: '0.00 元',
          type: 'warning',
          description: '尚未支付的成本总额'
        }
      ];
      
      templateRef.value?.setStatisticsCards(cards);
    };
    
    // 初始化表格列
    const initTableColumns = () => {
      const columns = [
        {
          type: 'index',
          label: '序号'
        },
        {
          prop: 'name',
          label: '成本名称',
          minWidth: 200,
          showOverflowTooltip: true
        },
        {
          prop: 'costDate',
          label: '成本日期',
          width: 140,
          formatter: (row) => formatDate(row.costDate)
        },
        {
          prop: 'category',
          label: '成本类别',
          width: 120,
          template: 'category'
        },
        {
          prop: 'amount',
          label: '成本金额',
          width: 120,
          formatter: (row) => formatCurrency(row.amount)
        },
        {
          prop: 'departmentId',
          label: '所属部门',
          width: 120,
          template: 'department'
        },
        {
          prop: 'managerId',
          label: '负责人',
          width: 100,
          template: 'manager'
        },
        {
          prop: 'isPaid',
          label: '付款状态',
          width: 100,
          formatter: (row) => row.isPaid ? '已付款' : '未付款'
        },
        {
          prop: 'createdAt',
          label: '创建时间',
          width: 180,
          formatter: (row) => formatDateTime(row.createdAt)
        },
        {
          type: 'action',
          label: '操作',
          width: 180,
          template: 'operation'
        }
      ];
      
      templateRef.value?.setTableColumns(columns);
    };
    
    // 初始化对话框
    const initDialogs = () => {
      const dialogs = [
        {
          key: 'edit-cost',
          visible: false,
          title: '编辑成本',
          width: '600px',
          onClose: () => {
            costFormRef.value?.resetFields();
          },
          buttons: [
            {
              key: 'save',
              text: '保存',
              type: 'primary',
              handler: handleSaveCost
            }
          ]
        },
        {
          key: 'view-cost',
          visible: false,
          title: '成本详情',
          width: '800px',
          onClose: () => {
            // 清空当前成本数据
            Object.keys(currentCost).forEach(key => delete currentCost[key]);
            currentCostDetails.value = [];
          },
          hideCancel: true,
          buttons: []
        },
        {
          key: 'delete-confirm',
          visible: false,
          title: '确认删除',
          width: '400px',
          onClose: () => {
            deleteTargetId.value = null;
            deleteTargetName.value = '';
          },
          buttons: [
            {
              key: 'confirm',
              text: '确认删除',
              type: 'danger',
              handler: confirmDeleteCost
            }
          ]
        },
        {
          key: 'cost-analysis',
          visible: false,
          title: '成本分析',
          width: '1000px',
          onClose: () => {
            // 重置分析筛选条件
            analysisFilters.dateRange = [];
            analysisFilters.category = [];
          },
          buttons: [
            {
              key: 'export',
              text: '导出分析报表',
              type: 'primary',
              handler: handleExportAnalysis
            }
          ]
        }
      ];
      
      templateRef.value?.setDialogs(dialogs);
    };
    
    // 初始化头部操作按钮
    const initHeaderActions = () => {
      const actions = [
        {
          key: 'create',
          text: '新增成本',
          type: 'primary',
          icon: 'el-icon-plus',
          handler: handleCreateCost
        },
        {
          key: 'import',
          text: '导入成本',
          type: 'success',
          icon: 'el-icon-upload2',
          handler: handleImportCost
        },
        {
          key: 'export',
          text: '导出成本',
          type: 'info',
          icon: 'el-icon-download',
          handler: handleExportCost
        },
        {
          key: 'batch-delete',
          text: '批量删除',
          type: 'danger',
          icon: 'el-icon-delete',
          handler: handleBatchDelete,
          disabled: true
        },
        {
          key: 'cost-analysis',
          text: '成本分析',
          type: 'warning',
          icon: 'el-icon-data-analysis',
          handler: handleCostAnalysis
        }
      ];
      
      templateRef.value?.setHeaderActions(actions);
    };
    
    // 初始化图表操作按钮
    const initChartActions = () => {
      const actions = [
        {
          key: 'refresh-chart',
          text: '刷新图表',
          type: 'default',
          size: 'small',
          handler: initMainChart
        },
        {
          key: 'view-details',
          text: '详细分析',
          type: 'primary',
          size: 'small',
          handler: handleCostAnalysis
        }
      ];
      
      templateRef.value?.setChartActions(actions);
    };
    
    // 加载成本数据
    const loadCostData = () => {
      // 模拟数据加载
      const mockData = generateMockCostData();
      costData.value = mockData;
      
      // 更新统计信息
      updateStatistics(mockData);
      
      // 更新分页信息
      templateRef.value?.updatePagination(mockData.length, 1, 20);
    };
    
    // 生成模拟成本数据
    const generateMockCostData = () => {
      const categoryValues = costCategories.map(cat => cat.value);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      return Array.from({ length: 100 }, (_, i) => {
        const id = i + 1;
        const departmentId = Math.floor(Math.random() * departments.length) + 1;
        const managerId = Math.floor(Math.random() * managers.length) + 1;
        const projectId = Math.random() > 0.5 ? Math.floor(Math.random() * projects.length) + 1 : null;
        const category = categoryValues[Math.floor(Math.random() * categoryValues.length)];
        
        // 随机生成日期，大部分在今年
        const year = Math.random() > 0.2 ? currentYear : currentYear - 1;
        const month = Math.floor(Math.random() * 12);
        const day = Math.floor(Math.random() * 28) + 1;
        const costDate = new Date(year, month, day);
        
        // 根据类别生成不同范围的金额
        let amount = 0;
        switch(category) {
          case 'SALARY':
            amount = Math.floor(Math.random() * 50000) + 30000; // 薪资：3-8万
            break;
          case 'OFFICE':
            amount = Math.floor(Math.random() * 10000) + 2000; // 办公：0.2-1.2万
            break;
          case 'MARKETING':
            amount = Math.floor(Math.random() * 20000) + 5000; // 市场：0.5-2.5万
            break;
          case 'TRAVEL':
            amount = Math.floor(Math.random() * 8000) + 1000; // 差旅：0.1-0.9万
            break;
          case 'TECHNOLOGY':
            amount = Math.floor(Math.random() * 30000) + 10000; // 技术：1-4万
            break;
          default:
            amount = Math.floor(Math.random() * 10000) + 1000; // 其他：0.1-1.1万
        }
        
        const isPaid = Math.random() > 0.3; // 70%的概率已付款
        
        return {
          id,
          name: `${getCategoryText(category)}费用_${departments.find(d => d.id === departmentId)?.name || '未知部门'}_${i + 1}`,
          costDate,
          category,
          amount,
          departmentId,
          managerId,
          projectId,
          description: id % 10 === 0 ? '这是一个成本描述示例' : '',
          isPaid,
          createdAt: new Date(year, month, day, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60)),
          updatedAt: new Date(year, month, day, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))
        };
      }).sort((a, b) => b.costDate - a.costDate);
    };
    
    // 更新统计信息
    const updateStatistics = (data) => {
      const totalCount = data.length;
      
      // 本月成本
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const monthlyCost = data
        .filter(item => new Date(item.costDate).getMonth() === currentMonth && 
                       new Date(item.costDate).getFullYear() === currentYear)
        .reduce((sum, item) => sum + item.amount, 0);
      
      // 年度累计成本
      const yearlyCost = data
        .filter(item => new Date(item.costDate).getFullYear() === currentYear)
        .reduce((sum, item) => sum + item.amount, 0);
      
      // 未付款成本
      const unpaidCost = data
        .filter(item => !item.isPaid)
        .reduce((sum, item) => sum + item.amount, 0);
      
      const cards = templateRef.value?.statisticsCards || [];
      if (cards.length >= 4) {
        cards[0].value = totalCount.toString();
        cards[1].value = formatCurrency(monthlyCost);
        cards[2].value = formatCurrency(yearlyCost);
        cards[3].value = formatCurrency(unpaidCost);
      }
    };
    
    // 初始化主图表
    const initMainChart = () => {
      // 这里应该使用实际的图表库（如ECharts）来初始化图表
      console.log('初始化主图表');
      // 实际应用中应该调用图表库API进行图表渲染
    };
    
    // 更新分析图表
    const updateAnalysisCharts = () => {
      console.log('更新分析图表', analysisFilters);
      // 实际应用中应该根据筛选条件更新图表
    };
    
    // 处理搜索
    const handleSearch = (searchParams) => {
      console.log('搜索参数:', searchParams);
      // 模拟搜索延迟
      templateRef.value.loading = true;
      setTimeout(() => {
        loadCostData(); // 实际应用中应该根据搜索条件获取数据
        templateRef.value.loading = false;
      }, 500);
    };
    
    // 处理重置
    const handleReset = (resetParams) => {
      console.log('重置参数:', resetParams);
      loadCostData();
    };
    
    // 处理分页变化
    const handlePageChange = (pageParams) => {
      console.log('分页参数:', pageParams);
      // 实际应用中应该根据分页参数获取数据
    };
    
    // 处理页面挂载
    const handleMounted = () => {
      initSearchFields();
      initStatisticsCards();
      initTableColumns();
      initDialogs();
      initHeaderActions();
      initChartActions();
      loadCostData();
      
      // 初始化主图表
      nextTick(() => {
        initMainChart();
      });
    };
    
    // 新建成本
    const handleCreateCost = () => {
      // 重置表单
      costFormRef.value?.resetFields();
      Object.assign(costForm, {
        id: '',
        name: '',
        costDate: new Date(),
        category: '',
        amount: 0,
        departmentId: '',
        managerId: '',
        description: '',
        projectId: '',
        isPaid: false
      });
      
      // 打开对话框
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'edit-cost');
      if (dialog) {
        dialog.title = '新增成本';
        dialog.visible = true;
      }
    };
    
    // 编辑成本
    const handleEditCost = (row) => {
      // 填充表单
      Object.assign(costForm, {
        id: row.id,
        name: row.name,
        costDate: new Date(row.costDate),
        category: row.category,
        amount: row.amount,
        departmentId: row.departmentId,
        managerId: row.managerId,
        description: row.description || '',
        projectId: row.projectId || '',
        isPaid: row.isPaid
      });
      
      // 打开对话框
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'edit-cost');
      if (dialog) {
        dialog.title = '编辑成本';
        dialog.visible = true;
      }
    };
    
    // 查看成本
    const handleViewCost = (row) => {
      // 复制成本数据
      Object.assign(currentCost, JSON.parse(JSON.stringify(row)));
      
      // 生成成本明细数据
      currentCostDetails.value = generateMockCostDetails(row.amount);
      
      // 打开对话框
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'view-cost');
      if (dialog) {
        dialog.visible = true;
      }
    };
    
    // 删除成本
    const handleDeleteCost = (row) => {
      deleteTargetId.value = row.id;
      deleteTargetName.value = row.name;
      
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'delete-confirm');
      if (dialog) {
        dialog.visible = true;
      }
    };
    
    // 批量删除
    const handleBatchDelete = () => {
      const selectedRows = templateRef.value?.selectedRows || [];
      if (selectedRows.length === 0) {
        ElMessage.warning('请选择要删除的成本记录');
        return;
      }
      
      ElMessageBox.confirm(
        `确定要删除选中的 ${selectedRows.length} 条成本记录吗？此操作不可撤销。`,
        '确认删除',
        {
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 模拟删除操作
        templateRef.value.loading = true;
        setTimeout(() => {
          const idsToDelete = selectedRows.map(row => row.id);
          costData.value = costData.value.filter(item => !idsToDelete.includes(item.id));
          updateStatistics(costData.value);
          templateRef.value.updatePagination(costData.value.length, 1, 20);
          templateRef.value.loading = false;
          ElMessage.success(`成功删除 ${selectedRows.length} 条成本记录`);
        }, 500);
      }).catch(() => {
        // 取消删除
      });
    };
    
    // 确认删除成本
    const confirmDeleteCost = () => {
      // 模拟删除操作
      templateRef.value.loading = true;
      setTimeout(() => {
        costData.value = costData.value.filter(item => item.id !== deleteTargetId.value);
        updateStatistics(costData.value);
        templateRef.value.updatePagination(costData.value.length, 1, 20);
        
        // 关闭对话框
        const dialog = templateRef.value?.dialogs.find(d => d.key === 'delete-confirm');
        if (dialog) {
          dialog.visible = false;
        }
        
        templateRef.value.loading = false;
        ElMessage.success('成本记录删除成功');
      }, 500);
    };
    
    // 保存成本
    const handleSaveCost = () => {
      costFormRef.value?.validate((valid) => {
        if (valid) {
          // 模拟保存操作
          templateRef.value.loading = true;
          setTimeout(() => {
            const isEdit = !!costForm.id;
            
            if (isEdit) {
              // 编辑现有成本
              const index = costData.value.findIndex(item => item.id === costForm.id);
              if (index !== -1) {
                Object.assign(costData.value[index], {
                  name: costForm.name,
                  costDate: costForm.costDate,
                  category: costForm.category,
                  amount: costForm.amount,
                  departmentId: costForm.departmentId,
                  managerId: costForm.managerId,
                  description: costForm.description,
                  projectId: costForm.projectId,
                  isPaid: costForm.isPaid,
                  updatedAt: new Date()
                });
              }
            } else {
              // 新建成本
              const newCost = {
                id: Date.now(),
                name: costForm.name,
                costDate: costForm.costDate,
                category: costForm.category,
                amount: costForm.amount,
                departmentId: costForm.departmentId,
                managerId: costForm.managerId,
                description: costForm.description,
                projectId: costForm.projectId,
                isPaid: costForm.isPaid,
                createdAt: new Date(),
                updatedAt: new Date()
              };
              costData.value.unshift(newCost);
            }
            
            // 更新统计信息
            updateStatistics(costData.value);
            templateRef.value.updatePagination(costData.value.length, 1, 20);
            
            // 关闭对话框
            const dialog = templateRef.value?.dialogs.find(d => d.key === 'edit-cost');
            if (dialog) {
              dialog.visible = false;
            }
            
            templateRef.value.loading = false;
            ElMessage.success(isEdit ? '成本更新成功' : '成本添加成功');
          }, 800);
        }
      });
    };
    
    // 导入成本
    const handleImportCost = () => {
      ElMessage.info('导入成本功能待实现');
    };
    
    // 导出成本
    const handleExportCost = () => {
      ElMessage.info('导出成本功能待实现');
    };
    
    // 成本分析
    const handleCostAnalysis = () => {
      // 打开成本分析对话框
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'cost-analysis');
      if (dialog) {
        dialog.visible = true;
        
        // 延迟初始化图表
        setTimeout(() => {
          updateAnalysisCharts();
        }, 100);
      }
    };
    
    // 导出分析报表
    const handleExportAnalysis = () => {
      ElMessage.info('导出分析报表功能待实现');
    };
    
    // 辅助函数
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    
    const formatDateTime = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${formatDate(date)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    
    const formatCurrency = (value) => {
      if (value === null || value === undefined) return '0.00 元';
      return `${parseFloat(value).toFixed(2)} 元`;
    };
    
    const getDepartmentName = (id) => {
      const dept = departments.find(item => item.id === id);
      return dept ? dept.name : '未知部门';
    };
    
    const getManagerName = (id) => {
      const manager = managers.find(item => item.id === id);
      return manager ? manager.name : '未知负责人';
    };
    
    const getProjectName = (id) => {
      const project = projects.find(item => item.id === id);
      return project ? project.name : null;
    };
    
    const getCategoryText = (category) => {
      const cat = costCategories.find(item => item.value === category);
      return cat ? cat.label : '未知类别';
    };
    
    const getCategoryType = (category) => {
      const cat = costCategories.find(item => item.value === category);
      return cat ? cat.type : 'default';
    };
    
    // 生成模拟成本明细数据
    const generateMockCostDetails = (totalAmount) => {
      const detailItems = [
        { name: '人工费', unitPrice: 0 },
        { name: '材料费', unitPrice: 0 },
        { name: '服务费', unitPrice: 0 },
        { name: '设备费', unitPrice: 0 },
        { name: '其他费用', unitPrice: 0 }
      ];
      
      // 随机生成明细项数量
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const selectedItems = [];
      
      // 随机选择不同的明细项
      while (selectedItems.length < itemCount) {
        const randomIndex = Math.floor(Math.random() * detailItems.length);
        if (!selectedItems.includes(detailItems[randomIndex])) {
          selectedItems.push(detailItems[randomIndex]);
        }
      }
      
      // 为每个明细项生成金额
      let remainingAmount = totalAmount;
      const details = [];
      
      selectedItems.forEach((item, index) => {
        // 最后一个项目分配剩余金额
        const isLast = index === selectedItems.length - 1;
        const itemAmount = isLast ? remainingAmount : 
                          Math.floor(totalAmount * (0.2 + Math.random() * 0.3));
        
        // 确保金额合理
        const actualAmount = Math.min(itemAmount, remainingAmount);
        remainingAmount -= actualAmount;
        
        // 生成数量和单价
        const quantity = Math.floor(Math.random() * 10) + 1;
        const unitPrice = actualAmount / quantity;
        
        details.push({
          itemName: item.name,
          quantity,
          unitPrice,
          itemAmount: actualAmount,
          remark: index % 3 === 0 ? '详细说明示例' : ''
        });
      });
      
      return details;
    };
    
    // 监听分析标签页变化
    watch(activeAnalysisTab, (newTab) => {
      // 切换标签页时初始化对应图表
      nextTick(() => {
        updateAnalysisCharts();
      });
    });
    
    return {
      templateRef,
      costFormRef,
      categoryChartRef,
      departmentChartRef,
      trendChartRef,
      costData,
      currentCost,
      currentCostDetails,
      deleteTargetName,
      activeAnalysisTab,
      analysisFilters,
      costForm,
      costFormRules,
      departments,
      managers,
      projects,
      costCategories,
      
      // 方法
      handleSearch,
      handleReset,
      handlePageChange,
      handleMounted,
      handleCreateCost,
      handleEditCost,
      handleViewCost,
      handleDeleteCost,
      handleBatchDelete,
      handleSaveCost,
      handleImportCost,
      handleExportCost,
      handleCostAnalysis,
      handleExportAnalysis,
      confirmDeleteCost,
      updateAnalysisCharts,
      
      // 辅助函数
      formatDate,
      formatDateTime,
      formatCurrency,
      getDepartmentName,
      getManagerName,
      getProjectName,
      getCategoryText,
      getCategoryType
    };
  }
};
</script>

<style scoped>
.cost-detail h3 {
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.delete-confirm {
  text-align: center;
  padding: 20px 0;
}

.delete-confirm p {
  margin-bottom: 10px;
}

.delete-tips {
  color: #f56c6c;
  font-size: 14px;
}

.cost-analysis .chart-container {
  width: 100%;
  height: 400px;
}

.analysis-tabs {
  margin-bottom: 20px;
}
</style>