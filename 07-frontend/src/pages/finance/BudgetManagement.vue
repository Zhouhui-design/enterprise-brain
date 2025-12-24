<template>
  <CommonFinanceTemplate
    pageTitle="预算管理"
    :table-data="budgetData"
    :show-search="true"
    :show-table="true"
    :show-pagination="true"
    :show-statistics="true"
    :show-selection="true"
    ref="templateRef"
    @search="handleSearch"
    @reset="handleReset"
    @page-change="handlePageChange"
    @mounted="handleMounted"
  >
    <!-- 表格操作列自定义内容 -->
    <template #operation="{ row }">
      <el-button type="primary" size="small" @click="handleEditBudget(row)" v-if="row.status === 'draft' || row.status === 'rejected'">编辑</el-button>
      <el-button type="info" size="small" @click="handleViewBudget(row)">查看</el-button>
      <el-button type="danger" size="small" @click="handleDeleteBudget(row)" v-if="!row.isLocked">删除</el-button>
      <el-button type="warning" size="small" @click="handleLockBudget(row)" v-if="row.status === 'draft'">锁定</el-button>
      <el-button type="success" size="small" @click="handleSubmitApproval(row)" v-if="row.status === 'locked'">提交审批</el-button>
      <el-button type="primary" size="small" @click="handleApproveBudget(row, 'approve')" v-if="row.status === 'submitted'">审批通过</el-button>
      <el-button type="danger" size="small" @click="handleApproveBudget(row, 'reject')" v-if="row.status === 'submitted'">审批拒绝</el-button>
      <el-button type="success" size="small" @click="handleApplyBudget(row)" v-if="row.status === 'approved'">应用</el-button>
    </template>
    
    <!-- 预算状态标签 -->
    <template #status="{ row }">
      <el-tag :type="getStatusType(row)" size="small">{{ getStatusText(row) }}</el-tag>
    </template>
    
    <!-- 部门名称显示 -->
    <template #department="{ row }">
      {{ getDepartmentName(row.departmentId) }}
    </template>
<!-- 负责人显示 -->
    <template #manager="{ row }">
      {{ getManagerName(row.managerId) }}
    </template>
    
    <!-- 编辑预算对话框 -->
    <template #dialog-edit-budget="{ dialog }">
      <el-form :model="budgetForm" :rules="budgetFormRules" ref="budgetFormRef" label-width="120px">
        <el-form-item label="预算名称" prop="name">
          <el-input v-model="budgetForm.name" placeholder="请输入预算名称" />
        </el-form-item>
        <el-form-item label="预算期间" prop="budgetPeriod">
          <el-select v-model="budgetForm.budgetPeriod" placeholder="请选择预算期间">
            <el-option label="月度" value="monthly" />
            <el-option label="季度" value="quarterly" />
            <el-option label="年度" value="yearly" />
          </el-select>
        </el-form-item>
        <el-form-item label="预算年份" prop="budgetYear">
          <el-input-number v-model="budgetForm.budgetYear" :min="2020" :max="2030" />
        </el-form-item>
        <el-form-item label="预算月份/季度" prop="budgetPeriodIndex">
          <el-select v-model="budgetForm.budgetPeriodIndex" placeholder="请选择">
            <template v-if="budgetForm.budgetPeriod === 'monthly'">
              <el-option v-for="i in 12" :key="i" :label="`${i}月`" :value="i" />
            </template>
            <template v-else-if="budgetForm.budgetPeriod === 'quarterly'">
              <el-option v-for="i in 4" :key="i" :label="`第${i}季度`" :value="i" />
            </template>
          </el-select>
        </el-form-item>
        <el-form-item label="所属部门" prop="departmentId">
          <el-select v-model="budgetForm.departmentId" placeholder="请选择所属部门">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预算负责人" prop="managerId">
          <el-select v-model="budgetForm.managerId" placeholder="请选择预算负责人">
            <el-option
              v-for="user in managers"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预算总额" prop="totalAmount">
          <el-input-number v-model="budgetForm.totalAmount" :min="0" :step="0.01" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="budgetForm.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
    </template>
    
    <!-- 查看预算对话框 -->
    <template #dialog-view-budget="{ dialog }">
      <div class="budget-detail">
        <h3 style="margin-bottom: 20px;">预算基本信息</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="预算名称">{{ currentBudget.name }}</el-descriptions-item>
          <el-descriptions-item label="预算期间">{{ getPeriodText(currentBudget.budgetPeriod) }}</el-descriptions-item>
          <el-descriptions-item label="预算年份">{{ currentBudget.budgetYear }}</el-descriptions-item>
          <el-descriptions-item label="所属部门">{{ getDepartmentName(currentBudget.departmentId) }}</el-descriptions-item>
          <el-descriptions-item label="预算负责人">{{ getManagerName(currentBudget.managerId) }}</el-descriptions-item>
          <el-descriptions-item label="预算总额">{{ formatCurrency(currentBudget.totalAmount) }}</el-descriptions-item>
          <el-descriptions-item label="已执行金额">{{ formatCurrency(currentBudget.executedAmount) }}</el-descriptions-item>
          <el-descriptions-item label="执行进度">{{ (currentBudget.executionRate * 100).toFixed(2) }}%</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusText(currentBudget) }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(currentBudget.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentBudget.remark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审批意见" v-if="currentBudget.approveComment">{{ currentBudget.approveComment }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 预算执行图表 -->
        <h3 style="margin-top: 30px; margin-bottom: 20px;">预算执行分析</h3>
        <div id="budget-execution-chart" style="width: 100%; height: 400px;"></div>
        
        <h3 style="margin-top: 30px; margin-bottom: 20px;">预算明细</h3>
        <el-table :data="currentBudgetDetails" border style="width: 100%;">
          <el-table-column prop="categoryName" label="类别名称" />
          <el-table-column prop="categoryCode" label="类别编码" />
          <el-table-column prop="amount" label="预算金额" :formatter="formatCurrency" />
          <el-table-column prop="executedAmount" label="已执行金额" :formatter="formatCurrency" />
          <el-table-column prop="remainingAmount" label="剩余金额" :formatter="formatCurrency" />
          <el-table-column prop="executionRate" label="执行进度" width="120">
            <template #default="{ row }">
              <div class="progress-bar">
                <el-progress :percentage="row.executionRate * 100" :color="getProgressColor(row.executionRate)" />
                <span class="progress-text">{{ Math.round(row.executionRate * 100) }}%</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>
    
    <!-- 删除确认对话框 -->
    <template #dialog-delete-confirm="{ dialog }">
      <div class="delete-confirm">
        <p>确定要删除预算 <strong>{{ deleteTargetName }}</strong> 吗？</p>
        <p class="delete-tips">此操作不可撤销，删除后将无法恢复。</p>
      </div>
    </template>
  </CommonFinanceTemplate>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import { Plus, Delete } from '@element-plus/icons-vue';
import CommonFinanceTemplate from './template/CommonFinanceTemplate.vue';

export default {
  name: 'BudgetManagement',
  components: {
    CommonFinanceTemplate
  },
  setup() {
    // 模板引用
    const templateRef = ref(null);
    const budgetFormRef = ref(null);
    
    // 状态管理
    const budgetData = ref([]);
    const currentBudget = reactive({});
    const currentBudgetDetails = ref([]);
    const deleteTargetId = ref(null);
    const deleteTargetName = ref('');
    const chartInstance = ref(null);
    const chartContainer = ref(null);
    const activeChartTab = ref('comparison');
    const approveDialogVisible = ref(false);
    const approveAction = ref('approve'); // approve 或 reject
    
    // 审批表单
    const approveForm = reactive({
      comment: ''
    });
    
    // 表单数据
    const budgetForm = reactive({
      id: '',
      name: '',
      budgetPeriod: 'yearly',
      budgetYear: new Date().getFullYear(),
      budgetPeriodIndex: null,
      departmentId: '',
      managerId: '',
      totalAmount: 0,
      remark: '',
      details: [] // 预算明细
    });
    
    // 表单验证规则
    const budgetFormRules = {
      name: [
        { required: true, message: '请输入预算名称', trigger: 'blur' },
        { min: 2, max: 50, message: '预算名称长度在 2 到 50 个字符', trigger: 'blur' }
      ],
      budgetPeriod: [
        { required: true, message: '请选择预算期间', trigger: 'change' }
      ],
      budgetYear: [
        { required: true, message: '请输入预算年份', trigger: 'change' }
      ],
      departmentId: [
        { required: true, message: '请选择所属部门', trigger: 'change' }
      ],
      managerId: [
        { required: true, message: '请选择预算负责人', trigger: 'change' }
      ],
      totalAmount: [
        { required: true, message: '请输入预算总额', trigger: 'change' },
        { type: 'number', min: 0.01, message: '预算总额必须大于0', trigger: 'change' }
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
    
    // 预算类别
    const budgetCategories = [
      { id: 1, code: 'SALARY', name: '薪资福利' },
      { id: 2, code: 'OFFICE', name: '办公费用' },
      { id: 3, code: 'MARKETING', name: '市场推广' },
      { id: 4, code: 'TRAVEL', name: '差旅费' },
      { id: 5, code: 'TRAINING', name: '培训费' },
      { id: 6, code: 'TECHNOLOGY', name: '技术投入' },
      { id: 7, code: 'LOGISTICS', name: '物流仓储' },
      { id: 8, code: 'OTHER', name: '其他费用' }
    ];
    
    // 初始化搜索字段
    const initSearchFields = () => {
      const searchFields = [
        {
          key: 'name',
          type: 'input',
          label: '预算名称',
          placeholder: '请输入预算名称',
          clearable: true
        },
        {
          key: 'budgetPeriod',
          type: 'select',
          label: '预算期间',
          options: [
            { value: 'monthly', label: '月度' },
            { value: 'quarterly', label: '季度' },
            { value: 'yearly', label: '年度' }
          ],
          clearable: true
        },
        {
          key: 'budgetYear',
          type: 'select',
          label: '预算年份',
          options: Array.from({ length: 11 }, (_, i) => ({
            value: 2020 + i,
            label: `${2020 + i}年`
          })),
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
          key: 'status',
          type: 'select',
          label: '预算状态',
          options: [
            { value: 'draft', label: '草稿' },
            { value: 'locked', label: '已锁定' },
            { value: 'applied', label: '已应用' },
            { value: 'expired', label: '已过期' }
          ],
          clearable: true
        }
      ];
      
      templateRef.value?.initSearchForm(searchFields);
    };
    
    // 初始化统计卡片
    const initStatisticsCards = () => {
      const cards = [
        {
          label: '预算总数',
          value: '0',
          type: 'primary',
          description: '所有预算方案数量'
        },
        {
          label: '活跃预算',
          value: '0',
          type: 'success',
          description: '已应用且未过期的预算'
        },
        {
          label: '预算总额',
          value: '0.00 元',
          type: 'info',
          description: '所有预算方案总额'
        },
        {
          label: '执行总额',
          value: '0.00 元',
          type: 'warning',
          description: '已执行的预算金额'
        },
        {
          label: '待审批',
          value: '0',
          type: 'warning',
          description: '等待审批的预算'
        },
        {
          label: '超预算',
          value: '0',
          type: 'danger',
description: '已超支的预算方案'
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
          label: '预算名称',
          minWidth: 180,
          showOverflowTooltip: true
        },
        {
          prop: 'budgetPeriod',
          label: '预算期间',
          width: 120,
          formatter: (row) => getPeriodText(row.budgetPeriod)
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
          prop: 'totalAmount',
          label: '预算总额',
          width: 120,
          formatter: (row) => formatCurrency(row.totalAmount)
        },
        {
          prop: 'executedAmount',
          label: '已执行金额',
          width: 120,
          formatter: (row) => formatCurrency(row.executedAmount)
        },
        {
          prop: 'executionRate',
          label: '执行进度',
          width: 150,
          template: 'executionRate'
        },
        {
          prop: 'status',
          label: '状态',
width: 100,
          template: 'status'
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
          width: 260,
          template: 'operation'
        }
      ];
      
      templateRef.value?.setTableColumns(columns);
    };
    
    // 初始化对话框
    const initDialogs = () => {
      const dialogs = [
        {
          key: 'edit-budget',
          visible: false,
          title: '编辑预算',
          width: '800px',
          onClose: () => {
            budgetFormRef.value?.resetFields();
          },
          buttons: [
            {
              key: 'save',
              text: '保存',
              type: 'primary',
              handler: handleSaveBudget
            }
          ]
        },
        {
          key: 'view-budget',
          visible: false,
          title: '预算详情',
          width: '900px',
          onClose: () => {
            // 清空当前预算数据
            Object.keys(currentBudget).forEach(key => delete currentBudget[key]);
            currentBudgetDetails.value = [];
            if (chartInstance.value) {
              chartInstance.value.dispose();
              chartInstance.value = null;
            }
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
              handler: confirmDeleteBudget
            }
          ]
        },
        {
          key: 'approve-budget',
          visible: false,
          title: '审批预算',
          width: '500px',
          onClose: () => {
            approveForm.comment = '';
          },
          buttons: [
            {
              key: 'cancel',
              text: '取消',
              handler: () => {
                approveDialogVisible.value = false;
              }
            },
            {
              key: 'confirm',
              text: '确认审批',
              type: 'primary',
              handler: confirmApproveBudget
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
          text: '新建预算',
          type: 'primary',
          icon: 'el-icon-plus',
          handler: handleCreateBudget
        },
        {
          key: 'import',
          text: '导入预算',
          type: 'success',
          icon: 'el-icon-upload2',
          handler: handleImportBudget
        },
        {
          key: 'export',
          text: '导出预算',
          type: 'info',
          icon: 'el-icon-download',
          handler: handleExportBudget
        },
        {
          key: 'batch-delete',
          text: '批量删除',
          type: 'danger',
          icon: 'el-icon-delete',
          handler: handleBatchDelete,
          disabled: true
        }
      ];
      
      templateRef.value?.setHeaderActions(actions);
    };
    
    // 加载预算数据
    const loadBudgetData = () => {
      // 模拟数据加载
      const mockData = generateMockBudgetData();
      budgetData.value = mockData;
      
      // 更新统计信息
      updateStatistics(mockData);
      
      // 更新分页信息
      templateRef.value?.updatePagination(mockData.length, 1, 20);
    };
    
    // 生成模拟预算数据
    const generateMockBudgetData = () => {
      const statuses = ['draft', 'submitted', 'approved', 'rejected', 'applied', 'expired'];
      const periods = ['monthly', 'quarterly', 'yearly'];
      const now = new Date();
      const currentYear = now.getFullYear();
      
      return Array.from({ length: 50 }, (_, i) => {
        const id = i + 1;
        const departmentId = Math.floor(Math.random() * departments.length) + 1;
        const managerId = Math.floor(Math.random() * managers.length) + 1;
        const budgetYear = currentYear - Math.floor(Math.random() * 2);
        const totalAmount = Math.floor(Math.random() * 1000000) + 100000;
        const executedAmount = Math.floor(totalAmount * Math.random() * 0.8);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const budgetPeriod = periods[Math.floor(Math.random() * periods.length)];
        
        return {
          id,
          name: `${departments.find(d => d.id === departmentId)?.name || '未知部门'}${budgetYear}年${getPeriodText(budgetPeriod)}预算`,
          budgetPeriod,
          budgetYear,
          budgetPeriodIndex: budgetPeriod === 'monthly' ? Math.floor(Math.random() * 12) + 1 : 
                          budgetPeriod === 'quarterly' ? Math.floor(Math.random() * 4) + 1 : null,
          departmentId,
          managerId,
          totalAmount,
          executedAmount,
          executionRate: totalAmount > 0 ? executedAmount / totalAmount : 0,
          status,
          isLocked: status !== 'draft' && status !== 'rejected',
          isApplied: status === 'applied',
          createdAt: new Date(budgetYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
          remark: id % 5 === 0 ? '这是一个预算方案备注信息' : '',
          // 添加预算明细
          details: generateMockBudgetDetails(totalAmount)
        };
      });
    };
    
    // 更新统计信息
    const updateStatistics = (data) => {
      const totalCount = data.length;
      const activeCount = data.filter(item => item.status === 'applied').length;
      const pendingCount = data.filter(item => item.status === 'submitted').length;
      const overBudgetCount = data.filter(item => 
        item.executedAmount > item.totalAmount && item.status === 'applied'
      ).length;
      const totalAmount = data.reduce((sum, item) => sum + item.totalAmount, 0);
      const executedAmount = data.reduce((sum, item) => sum + item.executedAmount, 0);
      
      const cards = templateRef.value?.statisticsCards || [];
      if (cards.length >= 6) {
        cards[0].value = totalCount.toString();
        cards[1].value = activeCount.toString();
        cards[2].value = formatCurrency(totalAmount);
        cards[3].value = formatCurrency(executedAmount);
        cards[4].value = pendingCount.toString();
        cards[5].value = overBudgetCount.toString();
      }
    };
    
    // 处理搜索
    const handleSearch = (searchParams) => {
      console.log('搜索参数:', searchParams);
      // 这里应该根据搜索参数过滤数据
      // 模拟搜索延迟
      templateRef.value.loading = true;
      setTimeout(() => {
        loadBudgetData(); // 实际应用中应该根据搜索条件获取数据
        templateRef.value.loading = false;
      }, 500);
    };
    
    // 处理重置
    const handleReset = (resetParams) => {
      console.log('重置参数:', resetParams);
      loadBudgetData();
    };
    
    // 处理分页变化
    const handlePageChange = (pageParams) => {
      console.log('分页参数:', pageParams);
      // 这里应该根据分页参数获取数据
    };
    
    // 处理页面挂载
    const handleMounted = () => {
      initSearchFields();
      initStatisticsCards();
      initTableColumns();
      initDialogs();
      initHeaderActions();
      loadBudgetData();
    };
    
    // 新建/编辑预算
    const handleEditBudget = (row) => {
      // 重置表单
      budgetForm.id = '';
      budgetForm.name = '';
      budgetForm.budgetPeriod = 'yearly';
      budgetForm.budgetYear = new Date().getFullYear();
      budgetForm.budgetPeriodIndex = null;
      budgetForm.departmentId = '';
      budgetForm.managerId = '';
      budgetForm.totalAmount = 0;
      budgetForm.remark = '';
      budgetForm.details = [];
      
      // 如果是编辑模式，填充数据
      if (row) {
        Object.assign(budgetForm, JSON.parse(JSON.stringify(row)));
        // 确保明细数据存在
        if (!budgetForm.details || budgetForm.details.length === 0) {
          budgetForm.details = generateMockBudgetDetails(budgetForm.totalAmount);
        }
      }
      
      // 打开对话框
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'edit-budget');
      if (dialog) {
        dialog.visible = true;
      }
    };
    
    // 添加预算明细
    const addBudgetDetail = () => {
      budgetForm.details.push({
        categoryId: '',
        categoryCode: '',
        categoryName: '',
        amount: 0,
        executedAmount: 0,
        remainingAmount: 0,
        executionRate: 0
      });
    };
    
    // 删除预算明细
    const removeBudgetDetail = (index) => {
      budgetForm.details.splice(index, 1);
      updateTotalAmount();
    };
    
    // 更新总金额
    const updateTotalAmount = () => {
      budgetForm.totalAmount = budgetForm.details.reduce((sum, detail) => {
        return sum + (parseFloat(detail.amount) || 0);
      }, 0);
    };
    
    // 类别变更处理
    const onCategoryChange = (index) => {
      const categoryId = budgetForm.details[index].categoryId;
      const category = budgetCategories.find(c => c.id === categoryId);
      if (category) {
        budgetForm.details[index].categoryName = category.name;
        budgetForm.details[index].categoryCode = category.code;
      }
      updateTotalAmount();
    };
    
    // 提交审批
    const handleSubmitApproval = (row) => {
      Object.assign(currentBudget, JSON.parse(JSON.stringify(row)));
      ElMessageBox.confirm(`确认提交「${row.name}」进行审批？`, '提交审批', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟提交审批
        const index = budgetData.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          budgetData.value[index].status = 'submitted';
          budgetData.value[index].isLocked = true;
          updateStatistics(budgetData.value);
          ElMessage.success('提交审批成功');
        }
      }).catch(() => {});
    };
    
    // 打开审批对话框
    const handleApproveBudget = (row, action) => {
      Object.assign(currentBudget, JSON.parse(JSON.stringify(row)));
      approveAction.value = action;
      approveForm.comment = '';
      approveDialogVisible.value = true;
    };
    
    // 执行审批操作
    const confirmApprove = () => {
      // 模拟审批操作
      const index = budgetData.value.findIndex(item => item.id === currentBudget.id);
      if (index !== -1) {
        budgetData.value[index].status = approveAction.value === 'approve' ? 'approved' : 'rejected';
        budgetData.value[index].approveComment = approveForm.comment;
        if (approveAction.value === 'rejected') {
          budgetData.value[index].isLocked = false;
        }
        updateStatistics(budgetData.value);
        ElMessage.success(approveAction.value === 'approve' ? '审批通过' : '审批拒绝');
      }
      approveDialogVisible.value = false;
    };
    
    // 新建预算
    const handleCreateBudget = () => {
      // 重置表单
      budgetFormRef.value?.resetFields();
      Object.assign(budgetForm, {
        id: '',
        name: '',
        budgetPeriod: 'yearly',
        budgetYear: new Date().getFullYear(),
        budgetPeriodIndex: null,
        departmentId: '',
        managerId: '',
        totalAmount: 0,
        remark: ''
      });
      
      // 打开对话框
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'edit-budget');
      if (dialog) {
        dialog.title = '新建预算';
        dialog.visible = true;
      }
    };
    
    // 查看预算
    const handleViewBudget = (row) => {
      // 复制预算数据
      Object.assign(currentBudget, JSON.parse(JSON.stringify(row)));
      
      // 使用现有的明细数据或生成新数据
      currentBudgetDetails.value = row.details || generateMockBudgetDetails(row.totalAmount);
      
      // 打开对话框
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'view-budget');
      if (dialog) {
        dialog.visible = true;
      }
      
      // 等待对话框渲染完成后初始化图表
      nextTick(() => {
        renderBudgetChart();
      });
    };
    
    // 渲染预算执行图表
    const renderBudgetChart = () => {
      const chartDom = document.getElementById('budget-execution-chart');
      if (!chartDom || currentBudgetDetails.value.length === 0) return;
      
      // 销毁旧图表
      if (chartInstance.value) {
        chartInstance.value.dispose();
      }
      
      // 创建新图表
      chartInstance.value = echarts.init(chartDom);
      
      // 准备数据
      const categories = currentBudgetDetails.value.slice(0, 8).map(item => item.categoryName);
      const budgetAmounts = currentBudgetDetails.value.slice(0, 8).map(item => item.amount);
      const executedAmounts = currentBudgetDetails.value.slice(0, 8).map(item => item.executedAmount);
      
      // 设置图表配置
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
type: 'shadow'
          },
          formatter: function(params) {
            let result = params[0].name + '<br/>';
            params.forEach(param => {
              result += `${param.marker}${param.seriesName}: ${formatCurrency(param.value)}<br/>`;
            });
            return result;
          }
        },
        legend: {
          data: ['预算金额', '已执行金额']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: categories,
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: function(value) {
              return (value / 10000) + '万';
            }
          }
        },
        series: [
          {
            name: '预算金额',
            type: 'bar',
            data: budgetAmounts,
            itemStyle: {
              color: '#409eff'
            }
          },
          {
            name: '已执行金额',
            type: 'bar',
            data: executedAmounts,
            itemStyle: {
              color: '#67c23a'
            }
          }
        ]
      };
      
      chartInstance.value.setOption(option);
      
      // 监听窗口大小变化
      window.addEventListener('resize', handleChartResize);
    };
    
    // 处理图表大小变化
    const handleChartResize = () => {
      if (chartInstance.value) {
        chartInstance.value.resize();
      }
    };
    
    // 删除预算
    const handleDeleteBudget = (row) => {
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
        ElMessage.warning('请选择要删除的预算');
        return;
      }
      
      ElMessageBox.confirm(
        `确定要删除选中的 ${selectedRows.length} 个预算吗？此操作不可撤销。`,
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
          budgetData.value = budgetData.value.filter(item => !idsToDelete.includes(item.id));
          updateStatistics(budgetData.value);
          templateRef.value.updatePagination(budgetData.value.length, 1, 20);
          templateRef.value.loading = false;
          ElMessage.success(`成功删除 ${selectedRows.length} 个预算`);
        }, 500);
      }).catch(() => {
        // 取消删除
      });
    };
    
    // 确认删除预算
    const confirmDeleteBudget = () => {
      // 模拟删除操作
      templateRef.value.loading = true;
      setTimeout(() => {
        budgetData.value = budgetData.value.filter(item => item.id !== deleteTargetId.value);
        updateStatistics(budgetData.value);
        templateRef.value.updatePagination(budgetData.value.length, 1, 20);
        
        // 关闭对话框
        const dialog = templateRef.value?.dialogs.find(d => d.key === 'delete-confirm');
        if (dialog) {
          dialog.visible = false;
        }
        
        templateRef.value.loading = false;
        ElMessage.success('预算删除成功');
      }, 500);
    };
    
    // 锁定预算
    const handleLockBudget = (row) => {
      ElMessageBox.confirm(
        `确定要锁定预算「${row.name}」吗？锁定后将不能再编辑。`,
'确认锁定',
        {
          confirmButtonText: '确认锁定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 模拟锁定操作
        const budget = budgetData.value.find(item => item.id === row.id);
        if (budget) {
          budget.status = 'locked';
          budget.isLocked = true;
          ElMessage.success('预算锁定成功');
        }
      }).catch(() => {
        // 取消锁定
      });
    };
    
    // 应用预算
    const handleApplyBudget = (row) => {
      ElMessageBox.confirm(
        `确定要应用预算「${row.name}」吗？应用后将正式生效。`,
        '确认应用',
        {
          confirmButtonText: '确认应用',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        // 模拟应用操作
        const budget = budgetData.value.find(item => item.id === row.id);
        if (budget) {
          budget.status = 'applied';
          budget.isApplied = true;
          ElMessage.success('预算应用成功');
        }
      }).catch(() => {
        // 取消应用
      });
    };
    
    // 保存预算
    const handleSaveBudget = () => {
      budgetFormRef.value?.validate((valid) => {
        if (valid) {
          // 模拟保存操作
          templateRef.value.loading = true;
          setTimeout(() => {
            const isEdit = !!budgetForm.id;
            
            if (isEdit) {
              // 编辑现有预算
              const index = budgetData.value.findIndex(item => item.id === budgetForm.id);
              if (index !== -1) {
                Object.assign(budgetData.value[index], {
                  name: budgetForm.name,
                  budgetPeriod: budgetForm.budgetPeriod,
                  budgetYear: budgetForm.budgetYear,
                  budgetPeriodIndex: budgetForm.budgetPeriodIndex,
                  departmentId: budgetForm.departmentId,
                  managerId: budgetForm.managerId,
                  totalAmount: budgetForm.totalAmount,
                  remark: budgetForm.remark
                });
              }
            } else {
              // 新建预算
              const newBudget = {
                id: Date.now(),
                name: budgetForm.name,
                budgetPeriod: budgetForm.budgetPeriod,
                budgetYear: budgetForm.budgetYear,
                budgetPeriodIndex: budgetForm.budgetPeriodIndex,
                departmentId: budgetForm.departmentId,
                managerId: budgetForm.managerId,
                totalAmount: budgetForm.totalAmount,
                executedAmount: 0,
                executionRate: 0,
                status: 'draft',
                isLocked: false,
                isApplied: false,
                createdAt: new Date(),
                remark: budgetForm.remark
              };
              budgetData.value.unshift(newBudget);
            }
            
            // 更新统计信息
            updateStatistics(budgetData.value);
            templateRef.value.updatePagination(budgetData.value.length, 1, 20);
            
            // 关闭对话框
            const dialog = templateRef.value?.dialogs.find(d => d.key === 'edit-budget');
            if (dialog) {
              dialog.visible = false;
            }
            
            templateRef.value.loading = false;
            ElMessage.success(isEdit ? '预算更新成功' : '预算创建成功');
          }, 800);
        }
      });
    };
    
    // 导入预算
    const handleImportBudget = () => {
      ElMessage.info('导入预算功能待实现');
    };
    
    // 导出预算
    const handleExportBudget = () => {
      ElMessage.info('导出预算功能待实现');
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
    
    const getPeriodText = (period) => {
      const periodMap = {
        monthly: '月度',
        quarterly: '季度',
        yearly: '年度'
      };
      return periodMap[period] || period;
    };
    
    const getStatusType = (row) => {
      const statusMap = {
        draft: 'info',
        submitted: 'primary',
        approved: 'success',
        rejected: 'danger',
        applied: 'success',
        expired: 'danger'
      };
      return statusMap[row.status] || 'default';
    };
    
    const getStatusText = (row) => {
      const statusMap = {
        draft: '草稿',
        submitted: '待审批',
        approved: '已审批',
        rejected: '已拒绝',
        applied: '已应用',
        expired: '已过期'
      };
      return statusMap[row.status] || '未知状态';
    };
    
    // 获取进度条颜色
    const getProgressColor = (rate) => {
      if (rate >= 1) return '#f56c6c';
      if (rate >= 0.8) return '#e6a23c';
      return '#67c23a';
    };
    
    // 生成模拟预算明细数据
    const generateMockBudgetDetails = (totalAmount) => {
      const details = [];
      let remainingAmount = totalAmount;
      
      // 为每个类别生成预算明细
      budgetCategories.forEach((category, index) => {
        // 最后一个类别分配剩余金额
        const isLast = index === budgetCategories.length - 1;
        const amount = isLast ? remainingAmount : 
                      Math.floor(totalAmount * (0.05 + Math.random() * 0.2));
        
        // 确保金额合理
        const actualAmount = Math.min(amount, remainingAmount);
        remainingAmount -= actualAmount;
        
        // 生成已执行金额
        const executedAmount = Math.floor(actualAmount * Math.random() * 0.9);
        
        details.push({
          categoryId: category.id,
          categoryCode: category.code,
          categoryName: category.name,
          amount: actualAmount,
          executedAmount,
          remainingAmount: actualAmount - executedAmount,
          executionRate: actualAmount > 0 ? executedAmount / actualAmount : 0
        });
      });
      
      return details.sort((a, b) => b.amount - a.amount);
    };
    
    return {
      templateRef,
      budgetFormRef,
      budgetData,
      currentBudget,
      currentBudgetDetails,
      deleteTargetName,
      budgetForm,
      budgetFormRules,
      departments,
      managers,
      budgetCategories,
      approveDialogVisible,
      approveForm,
      approveAction,
      
      // 方法
      handleSearch,
      handleReset,
      handlePageChange,
      handleMounted,
      handleCreateBudget,
      handleEditBudget,
      handleViewBudget,
      handleDeleteBudget,
      handleBatchDelete,
      handleLockBudget,
      handleApplyBudget,
      handleSaveBudget,
      handleImportBudget,
      handleExportBudget,
      confirmDeleteBudget,
      addBudgetDetail,
      removeBudgetDetail,
      updateTotalAmount,
      onCategoryChange,
      handleSubmitApproval,
      handleApproveBudget,
      confirmApprove,
      
      // 辅助函数
      formatDate,
      formatDateTime,
      formatCurrency,
      getDepartmentName,
      getManagerName,
      getPeriodText,
      getStatusType,
      getStatusText,
      getProgressColor
    };
  }
};
</script>

<style scoped>
.budget-detail h3 {
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.progress-bar {
  position: relative;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: #606266;
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
</style>