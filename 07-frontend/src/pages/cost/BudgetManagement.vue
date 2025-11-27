<template>
  <div class="budget-management-container">
    <div class="header">
      <h2>预算管理</h2>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="header-left">
          <el-select
            v-model="selectedYear"
            placeholder="选择年度"
            class="year-select"
          >
            <el-option v-for="year in availableYears" :key="year" :label="year + '年'" :value="year" />
          </el-select>
          <el-select
            v-model="selectedBudgetType"
            placeholder="预算类型"
            class="type-select"
          >
            <el-option label="全面预算" value="comprehensive" />
            <el-option label="部门预算" value="departmental" />
            <el-option label="项目预算" value="project" />
          </el-select>
          <el-button type="primary" @click="addBudget" icon="el-icon-plus">新增预算</el-button>
          <el-button type="success" @click="approveBudget" icon="el-icon-check" :disabled="!hasSelected">审批预算</el-button>
          <el-button type="danger" @click="deleteSelectedBudgets" icon="el-icon-delete" :disabled="!hasSelected">删除选中</el-button>
        </div>
        <div class="header-right">
          <el-input
            v-model="searchQuery"
            placeholder="搜索预算名称/编号"
            prefix-icon="el-icon-search"
            class="search-input"
          />
          <el-select
            v-model="budgetStatus"
            placeholder="预算状态"
            class="status-select"
          >
            <el-option label="全部" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="已提交" value="submitted" />
            <el-option label="已审批" value="approved" />
            <el-option label="已执行" value="executed" />
            <el-option label="已调整" value="adjusted" />
          </el-select>
        </div>
      </div>
      
      <div class="card-body">
        <!-- 预算概览 -->
        <div class="overview-section">
          <div class="overview-cards">
            <div class="overview-card total-budget">
              <div class="card-icon">
                <i class="el-icon-finished"></i>
              </div>
              <div class="card-content">
                <div class="card-title">总预算金额</div>
                <div class="card-value">¥{{ totalBudgetAmount.toLocaleString() }}</div>
              </div>
            </div>
            <div class="overview-card used-budget">
              <div class="card-icon">
                <i class="el-icon-s-order"></i>
              </div>
              <div class="card-content">
                <div class="card-title">已使用金额</div>
                <div class="card-value">¥{{ usedBudgetAmount.toLocaleString() }}</div>
              </div>
            </div>
            <div class="overview-card remaining-budget">
              <div class="card-icon">
                <i class="el-icon-s-operation"></i>
              </div>
              <div class="card-content">
                <div class="card-title">剩余金额</div>
                <div class="card-value">¥{{ remainingBudgetAmount.toLocaleString() }}</div>
              </div>
            </div>
            <div class="overview-card execution-rate">
              <div class="card-icon">
                <i class="el-icon-data-line"></i>
              </div>
              <div class="card-content">
                <div class="card-title">执行率</div>
                <div class="card-value">{{ executionRate.toFixed(2) }}%</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 预算执行趋势 -->
        <div class="execution-trend-section">
          <div class="chart-card">
            <div class="chart-header">
              <h3>预算执行趋势</h3>
            </div>
            <div class="chart-content">
              <div id="budgetExecutionChart" ref="budgetExecutionChart" class="chart"></div>
            </div>
          </div>
        </div>
        
        <!-- 预算列表 -->
        <div class="budget-list-section">
          <el-table
            :data="filteredBudgets"
            style="width: 100%"
            border
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="code" label="预算编号" width="120" />
            <el-table-column prop="name" label="预算名称" width="200" />
            <el-table-column prop="year" label="预算年度" width="100" />
            <el-table-column prop="type" label="预算类型" width="120">
              <template v-slot="scope">
                <el-tag :type="getBudgetTypeTag(scope.row.type)">
                  {{ getBudgetTypeName(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="预算金额" width="120">
              <template v-slot="scope">
                ¥{{ scope.row.amount.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="usedAmount" label="已使用金额" width="120">
              <template v-slot="scope">
                ¥{{ scope.row.usedAmount.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="balance" label="余额" width="120">
              <template v-slot="scope">
                ¥{{ scope.row.balance.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="executionRate" label="执行率" width="100">
              <template v-slot="scope">
                <el-progress :percentage="scope.row.executionRate" :stroke-width="10" :show-text="true" />
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template v-slot="scope">
                <el-tag :type="getBudgetStatusTag(scope.row.status)">
                  {{ getBudgetStatusName(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdBy" label="编制人" width="100" />
            <el-table-column prop="createdDate" label="创建日期" width="150" />
            <el-table-column label="操作" width="180" fixed="right">
              <template v-slot="scope">
                <el-button size="mini" type="primary" @click="viewBudgetDetails(scope.row)" icon="el-icon-view">查看</el-button>
                <el-button size="mini" type="success" @click="editBudget(scope.row)" icon="el-icon-edit" v-if="scope.row.status === 'draft' || scope.row.status === 'submitted'">编辑</el-button>
                <el-button size="mini" type="warning" @click="adjustBudget(scope.row)" icon="el-icon-refresh" v-if="scope.row.status === 'approved'">调整</el-button>
                <el-button size="mini" type="danger" @click="deleteBudget(scope.row.id)" icon="el-icon-delete" v-if="scope.row.status === 'draft'">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              background
              layout="prev, pager, next, jumper, sizes, total"
              :total="filteredBudgets.length"
              :page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 预算详情对话框 -->
    <el-dialog
      :title="budgetDialog.title"
      :visible.sync="budgetDialog.visible"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-if="budgetDialog.type === 'view'" class="budget-detail-content">
        <div class="detail-header">
          <div class="detail-basic-info">
            <h3>{{ currentBudget.name }}</h3>
            <div class="detail-meta">
              <span class="meta-item"><strong>预算编号:</strong> {{ currentBudget.code }}</span>
              <span class="meta-item"><strong>预算年度:</strong> {{ currentBudget.year }}年</span>
              <span class="meta-item"><strong>预算类型:</strong> {{ getBudgetTypeName(currentBudget.type) }}</span>
              <span class="meta-item"><strong>状态:</strong> <el-tag :type="getBudgetStatusTag(currentBudget.status)">{{ getBudgetStatusName(currentBudget.status) }}</el-tag></span>
            </div>
          </div>
          <div class="detail-summary">
            <div class="summary-item">
              <div class="summary-label">预算总额</div>
              <div class="summary-value">¥{{ currentBudget.amount.toLocaleString() }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">已使用</div>
              <div class="summary-value">¥{{ currentBudget.usedAmount.toLocaleString() }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">剩余预算</div>
              <div class="summary-value">¥{{ currentBudget.balance.toLocaleString() }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">执行率</div>
              <div class="summary-value">{{ currentBudget.executionRate.toFixed(2) }}%</div>
            </div>
          </div>
        </div>
        
        <!-- 预算明细 -->
        <div class="detail-section">
          <h4>预算明细</h4>
          <el-table
            :data="budgetDetails"
            style="width: 100%"
            border
          >
            <el-table-column prop="itemName" label="预算项目" width="180" />
            <el-table-column prop="departmentName" label="部门" width="120" />
            <el-table-column prop="quarter1" label="Q1" width="100">
              <template v-slot="scope">¥{{ scope.row.quarter1.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="quarter2" label="Q2" width="100">
              <template v-slot="scope">¥{{ scope.row.quarter2.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="quarter3" label="Q3" width="100">
              <template v-slot="scope">¥{{ scope.row.quarter3.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="quarter4" label="Q4" width="100">
              <template v-slot="scope">¥{{ scope.row.quarter4.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="total" label="年度总额" width="120">
              <template v-slot="scope">¥{{ scope.row.total.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="usedAmount" label="已使用" width="100">
              <template v-slot="scope">¥{{ scope.row.usedAmount.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="balance" label="余额" width="100">
              <template v-slot="scope">¥{{ scope.row.balance.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="executionRate" label="执行率" width="100">
              <template v-slot="scope">
                <el-progress :percentage="scope.row.executionRate" :stroke-width="8" :show-text="true" />
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 预算调整记录 -->
        <div v-if="budgetAdjustments.length > 0" class="detail-section">
          <h4>调整记录</h4>
          <el-table
            :data="budgetAdjustments"
            style="width: 100%"
            border
          >
            <el-table-column prop="adjustmentNo" label="调整编号" width="120" />
            <el-table-column prop="adjustmentDate" label="调整日期" width="150" />
            <el-table-column prop="adjustmentReason" label="调整原因" width="200" />
            <el-table-column prop="originalAmount" label="调整前金额" width="120">
              <template v-slot="scope">¥{{ scope.row.originalAmount.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="adjustedAmount" label="调整后金额" width="120">
              <template v-slot="scope">¥{{ scope.row.adjustedAmount.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="adjustmentAmount" label="调整金额" width="120">
              <template v-slot="scope">
                <span :class="{ 'positive': scope.row.adjustmentAmount > 0, 'negative': scope.row.adjustmentAmount < 0 }">
                  {{ scope.row.adjustmentAmount > 0 ? '+' : '' }}¥{{ scope.row.adjustmentAmount.toLocaleString() }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="adjustedBy" label="调整人" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template v-slot="scope">
                <el-tag :type="getAdjustmentStatusTag(scope.row.status)">{{ scope.row.status === 'approved' ? '已审批' : '待审批' }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <div v-else class="budget-form-content">
        <!-- 预算表单内容 -->
        <el-form ref="budgetForm" :model="budgetForm" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="预算名称" prop="name" :rules="[{ required: true, message: '请输入预算名称', trigger: 'blur' }]">
                <el-input v-model="budgetForm.name" placeholder="请输入预算名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预算编号" prop="code" :rules="[{ required: true, message: '请输入预算编号', trigger: 'blur' }]">
                <el-input v-model="budgetForm.code" placeholder="请输入预算编号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预算年度" prop="year" :rules="[{ required: true, message: '请选择预算年度', trigger: 'change' }]">
                <el-select v-model="budgetForm.year" placeholder="请选择预算年度">
                  <el-option v-for="year in availableYears" :key="year" :label="year + '年'" :value="year" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预算类型" prop="type" :rules="[{ required: true, message: '请选择预算类型', trigger: 'change' }]">
                <el-select v-model="budgetForm.type" placeholder="请选择预算类型">
                  <el-option label="全面预算" value="comprehensive" />
                  <el-option label="部门预算" value="departmental" />
                  <el-option label="项目预算" value="project" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="预算说明" prop="description">
                <el-input v-model="budgetForm.description" type="textarea" rows="3" placeholder="请输入预算说明" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        
        <!-- 预算明细表格 -->
        <div class="budget-items-section">
          <h4>预算明细</h4>
          <el-table
            :data="budgetFormItems"
            style="width: 100%"
            border
            @cell-click="handleCellClick"
          >
            <el-table-column prop="itemName" label="预算项目" width="180">
              <template v-slot="scope">
                <el-input v-if="isEditingBudgetItem(scope.row)" v-model="scope.row.itemName" placeholder="请输入预算项目" />
                <span v-else>{{ scope.row.itemName }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="departmentName" label="部门" width="120">
              <template v-slot="scope">
                <el-select v-if="isEditingBudgetItem(scope.row)" v-model="scope.row.departmentName" placeholder="选择部门">
                  <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.name" />
                </el-select>
                <span v-else>{{ scope.row.departmentName }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="quarter1" label="Q1" width="100">
              <template v-slot="scope">
                <el-input-number
                  v-if="isEditingBudgetItem(scope.row)"
                  v-model.number="scope.row.quarter1"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                />
                <span v-else>¥{{ scope.row.quarter1.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="quarter2" label="Q2" width="100">
              <template v-slot="scope">
                <el-input-number
                  v-if="isEditingBudgetItem(scope.row)"
                  v-model.number="scope.row.quarter2"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                />
                <span v-else>¥{{ scope.row.quarter2.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="quarter3" label="Q3" width="100">
              <template v-slot="scope">
                <el-input-number
                  v-if="isEditingBudgetItem(scope.row)"
                  v-model.number="scope.row.quarter3"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                />
                <span v-else>¥{{ scope.row.quarter3.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="quarter4" label="Q4" width="100">
              <template v-slot="scope">
                <el-input-number
                  v-if="isEditingBudgetItem(scope.row)"
                  v-model.number="scope.row.quarter4"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                />
                <span v-else>¥{{ scope.row.quarter4.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="total" label="年度总额" width="120">
              <template v-slot="scope">
                <span>¥{{ (scope.row.quarter1 + scope.row.quarter2 + scope.row.quarter3 + scope.row.quarter4).toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template v-slot="scope">
                <el-button
                  v-if="!isEditingBudgetItem(scope.row)"
                  size="mini"
                  type="primary"
                  @click="editBudgetItem(scope.row)"
                  icon="el-icon-edit"
                />
                <el-button
                  v-if="isEditingBudgetItem(scope.row)"
                  size="mini"
                  type="success"
                  @click="saveBudgetItem(scope.row)"
                  icon="el-icon-check"
                />
                <el-button
                  size="mini"
                  type="danger"
                  @click="removeBudgetItem(scope.row)"
                  icon="el-icon-delete"
                />
              </template>
            </el-table-column>
          </el-table>
          <div class="budget-items-footer">
            <el-button type="primary" @click="addBudgetItem" icon="el-icon-plus">添加预算项</el-button>
          </div>
        </div>
      </div>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="budgetDialog.visible = false">取消</el-button>
        <el-button v-if="budgetDialog.type !== 'view'" type="primary" @click="saveBudget">保存</el-button>
        <el-button v-if="budgetDialog.type === 'edit' && currentBudget.status === 'draft'" type="success" @click="submitBudget">提交审批</el-button>
      </div>
    </el-dialog>
    
    <!-- 预算调整对话框 -->
    <el-dialog
      title="预算调整"
      :visible.sync="adjustDialog.visible"
      width="60%"
      :close-on-click-modal="false"
    >
      <el-form ref="adjustForm" :model="adjustForm" label-width="120px">
        <el-form-item label="预算名称" prop="budgetName">
          <el-input v-model="adjustForm.budgetName" disabled />
        </el-form-item>
        <el-form-item label="原预算金额" prop="originalAmount">
          <el-input v-model="adjustForm.originalAmount" disabled />
        </el-form-item>
        <el-form-item label="调整后金额" prop="adjustedAmount" :rules="[{ required: true, message: '请输入调整后金额', trigger: 'blur' }]">
          <el-input-number v-model.number="adjustForm.adjustedAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="调整原因" prop="adjustmentReason" :rules="[{ required: true, message: '请输入调整原因', trigger: 'blur' }]">
          <el-input v-model="adjustForm.adjustmentReason" type="textarea" rows="4" placeholder="请输入调整原因" />
        </el-form-item>
        <el-form-item label="调整说明" prop="adjustmentNote">
          <el-input v-model="adjustForm.adjustmentNote" type="textarea" rows="2" placeholder="请输入调整说明" />
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="adjustDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveAdjustment">提交调整</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'BudgetManagement',
  data() {
    return {
      selectedYear: new Date().getFullYear(),
      availableYears: [new Date().getFullYear() - 2, new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1],
      selectedBudgetType: 'comprehensive',
      searchQuery: '',
      budgetStatus: '',
      pageSize: 10,
      currentPage: 1,
      selectedRows: [],
      // 模拟预算数据
      budgets: [
        {
          id: 1,
          code: 'BUD2023001',
          name: '2023年度全面预算',
          year: 2023,
          type: 'comprehensive',
          amount: 10000000,
          usedAmount: 6500000,
          balance: 3500000,
          executionRate: 65,
          status: 'approved',
          createdBy: '张三',
          createdDate: '2022-12-15',
          description: '2023年度整体预算计划'
        },
        {
          id: 2,
          code: 'BUD2023002',
          name: '2023年研发部门预算',
          year: 2023,
          type: 'departmental',
          amount: 3000000,
          usedAmount: 2100000,
          balance: 900000,
          executionRate: 70,
          status: 'approved',
          createdBy: '李四',
          createdDate: '2022-12-20',
          description: '研发部门年度预算'
        },
        {
          id: 3,
          code: 'BUD2023003',
          name: '2023年新产品开发项目预算',
          year: 2023,
          type: 'project',
          amount: 1500000,
          usedAmount: 800000,
          balance: 700000,
          executionRate: 53.33,
          status: 'executed',
          createdBy: '王五',
          createdDate: '2023-01-10',
          description: '新产品开发项目专项预算'
        },
        {
          id: 4,
          code: 'BUD2023004',
          name: '2023年销售部门预算',
          year: 2023,
          type: 'departmental',
          amount: 2000000,
          usedAmount: 1200000,
          balance: 800000,
          executionRate: 60,
          status: 'approved',
          createdBy: '赵六',
          createdDate: '2022-12-25',
          description: '销售部门年度预算'
        },
        {
          id: 5,
          code: 'BUD2024001',
          name: '2024年度预算草案',
          year: 2024,
          type: 'comprehensive',
          amount: 11000000,
          usedAmount: 0,
          balance: 11000000,
          executionRate: 0,
          status: 'draft',
          createdBy: '张三',
          createdDate: '2023-10-01',
          description: '2024年度预算草案'
        }
      ],
      departments: [
        { id: 1, name: '财务部' },
        { id: 2, name: '研发部' },
        { id: 3, name: '销售部' },
        { id: 4, name: '生产部' },
        { id: 5, name: '行政部' }
      ],
      // 概览数据
      totalBudgetAmount: 17500000,
      usedBudgetAmount: 10600000,
      remainingBudgetAmount: 6900000,
      executionRate: 60.57,
      // 对话框状态
      budgetDialog: {
        visible: false,
        title: '',
        type: 'view' // view, edit, add
      },
      currentBudget: {},
      budgetDetails: [],
      budgetAdjustments: [],
      // 编辑表单数据
      budgetForm: {
        name: '',
        code: '',
        year: new Date().getFullYear(),
        type: 'comprehensive',
        description: ''
      },
      budgetFormItems: [],
      editingItems: [],
      // 调整对话框
      adjustDialog: {
        visible: false
      },
      adjustForm: {
        budgetId: '',
        budgetName: '',
        originalAmount: 0,
        adjustedAmount: 0,
        adjustmentReason: '',
        adjustmentNote: ''
      },
      chart: null
    }
  },
  computed: {
    filteredBudgets() {
      return this.budgets.filter(budget => {
        const matchesYear = !this.selectedYear || budget.year === this.selectedYear
        const matchesType = !this.selectedBudgetType || budget.type === this.selectedBudgetType
        const matchesStatus = !this.budgetStatus || budget.status === this.budgetStatus
        const matchesQuery = !this.searchQuery || 
          budget.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          budget.code.toLowerCase().includes(this.searchQuery.toLowerCase())
        return matchesYear && matchesType && matchesStatus && matchesQuery
      })
    },
    hasSelected() {
      return this.selectedRows.length > 0
    },
    paginatedBudgets() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredBudgets.slice(start, end)
    }
  },
  mounted() {
    this.initExecutionChart()
    this.$nextTick(() => {
      window.addEventListener('resize', this.handleResize)
    })
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    if (this.chart) {
      this.chart.dispose()
    }
  },
  methods: {
    initExecutionChart() {
      const chartDom = this.$refs.budgetExecutionChart
      if (!chartDom) return
      
      this.chart = echarts.init(chartDom)
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            let result = params[0].name + '<br/>'
            params.forEach(param => {
              if (param.seriesName === '执行率') {
                result += `${param.marker}${param.seriesName}: ${param.value}%<br/>`
              } else {
                result += `${param.marker}${param.seriesName}: ¥${param.value.toLocaleString()}<br/>`
              }
            })
            return result
          }
        },
        legend: {
          data: ['预算金额', '已执行金额', '执行率']
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
            name: '金额',
            axisLabel: {
              formatter: function(value) {
                return (value / 10000) + '万'
              }
            }
          },
          {
            type: 'value',
            name: '执行率',
            axisLabel: {
              formatter: '{value}%'
            }
          }
        ],
        series: [
          {
            name: '预算金额',
            type: 'bar',
            data: [700000, 700000, 700000, 700000, 700000, 700000, 700000, 700000, 700000, 700000, 700000, 700000]
          },
          {
            name: '已执行金额',
            type: 'bar',
            data: [450000, 480000, 520000, 580000, 620000, 680000, 710000, 750000, 790000, 820000, 850000, 880000]
          },
          {
            name: '执行率',
            type: 'line',
            yAxisIndex: 1,
            data: [15, 30, 45, 60, 70, 75, 78, 80, 82, 85, 88, 90]
          }
        ]
      }
      this.chart.setOption(option)
    },
    
    handleResize() {
      if (this.chart) {
        this.chart.resize()
      }
    },
    
    handleSelectionChange(val) {
      this.selectedRows = val
    },
    
    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
    },
    
    handleCurrentChange(current) {
      this.currentPage = current
    },
    
    getBudgetTypeName(type) {
      const typeMap = {
        'comprehensive': '全面预算',
        'departmental': '部门预算',
        'project': '项目预算'
      }
      return typeMap[type] || type
    },
    
    getBudgetTypeTag(type) {
      const typeMap = {
        'comprehensive': 'primary',
        'departmental': 'success',
        'project': 'warning'
      }
      return typeMap[type] || 'info'
    },
    
    getBudgetStatusName(status) {
      const statusMap = {
        'draft': '草稿',
        'submitted': '已提交',
        'approved': '已审批',
        'executed': '已执行',
        'adjusted': '已调整'
      }
      return statusMap[status] || status
    },
    
    getBudgetStatusTag(status) {
      const statusMap = {
        'draft': 'info',
        'submitted': 'warning',
        'approved': 'success',
        'executed': 'primary',
        'adjusted': 'danger'
      }
      return statusMap[status] || 'info'
    },
    
    getAdjustmentStatusTag(status) {
      return status === 'approved' ? 'success' : 'warning'
    },
    
    // 预算操作方法
    viewBudgetDetails(budget) {
      this.currentBudget = { ...budget }
      this.loadBudgetDetails(budget.id)
      this.loadBudgetAdjustments(budget.id)
      this.budgetDialog = {
        visible: true,
        title: `预算详情 - ${budget.name}`,
        type: 'view'
      }
    },
    
    addBudget() {
      this.budgetForm = {
        name: '',
        code: `BUD${this.selectedYear}${String(this.budgets.length + 1).padStart(3, '0')}`,
        year: this.selectedYear,
        type: this.selectedBudgetType,
        description: ''
      }
      this.budgetFormItems = []
      this.addBudgetItem()
      this.budgetDialog = {
        visible: true,
        title: '新增预算',
        type: 'add'
      }
    },
    
    editBudget(budget) {
      this.currentBudget = { ...budget }
      this.budgetForm = {
        name: budget.name,
        code: budget.code,
        year: budget.year,
        type: budget.type,
        description: budget.description || ''
      }
      // 模拟加载预算明细
      this.budgetFormItems = [
        {
          id: 1,
          itemName: '人力成本',
          departmentName: '研发部',
          quarter1: 200000,
          quarter2: 200000,
          quarter3: 200000,
          quarter4: 200000,
          total: 800000
        },
        {
          id: 2,
          itemName: '设备采购',
          departmentName: '研发部',
          quarter1: 100000,
          quarter2: 50000,
          quarter3: 150000,
          quarter4: 100000,
          total: 400000
        }
      ]
      this.budgetDialog = {
        visible: true,
        title: `编辑预算 - ${budget.name}`,
        type: 'edit'
      }
    },
    
    adjustBudget(budget) {
      this.adjustForm = {
        budgetId: budget.id,
        budgetName: budget.name,
        originalAmount: budget.amount,
        adjustedAmount: budget.amount,
        adjustmentReason: '',
        adjustmentNote: ''
      }
      this.adjustDialog.visible = true
    },
    
    deleteBudget(id) {
      this.$confirm('确定要删除该预算吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除操作
        this.budgets = this.budgets.filter(budget => budget.id !== id)
        this.$message.success('删除成功')
      }).catch(() => {
        // 取消删除
      })
    },
    
    deleteSelectedBudgets() {
      this.$confirm(`确定要删除选中的${this.selectedRows.length}个预算吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const ids = this.selectedRows.map(row => row.id)
        this.budgets = this.budgets.filter(budget => !ids.includes(budget.id))
        this.selectedRows = []
        this.$message.success('删除成功')
      }).catch(() => {
        // 取消删除
      })
    },
    
    approveBudget() {
      this.$confirm(`确定要审批选中的${this.selectedRows.length}个预算吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        this.selectedRows.forEach(row => {
          const budget = this.budgets.find(b => b.id === row.id)
          if (budget) {
            budget.status = 'approved'
          }
        })
        this.selectedRows = []
        this.$message.success('审批成功')
      }).catch(() => {
        // 取消审批
      })
    },
    
    submitBudget() {
      this.$confirm('确定要提交该预算进行审批吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        // 保存表单数据
        this.saveBudget().then(() => {
          // 更新状态
          const budget = this.budgets.find(b => b.id === this.currentBudget.id)
          if (budget) {
            budget.status = 'submitted'
          }
          this.budgetDialog.visible = false
          this.$message.success('预算已提交审批')
        })
      }).catch(() => {
        // 取消提交
      })
    },
    
    // 预算明细操作
    addBudgetItem() {
      this.budgetFormItems.push({
        id: Date.now(),
        itemName: '',
        departmentName: '',
        quarter1: 0,
        quarter2: 0,
        quarter3: 0,
        quarter4: 0
      })
      // 自动进入编辑状态
      setTimeout(() => {
        const newItem = this.budgetFormItems[this.budgetFormItems.length - 1]
        this.editBudgetItem(newItem)
      }, 0)
    },
    
    editBudgetItem(item) {
      this.editingItems.push(item.id)
    },
    
    saveBudgetItem(item) {
      // 计算总额
      item.total = item.quarter1 + item.quarter2 + item.quarter3 + item.quarter4
      this.editingItems = this.editingItems.filter(id => id !== item.id)
    },
    
    removeBudgetItem(item) {
      const index = this.budgetFormItems.findIndex(i => i.id === item.id)
      if (index > -1) {
        this.budgetFormItems.splice(index, 1)
        this.editingItems = this.editingItems.filter(id => id !== item.id)
      }
    },
    
    isEditingBudgetItem(item) {
      return this.editingItems.includes(item.id)
    },
    
    handleCellClick(row, column) {
      if (!this.isEditingBudgetItem(row) && column.property !== 'total' && column.property !== 'operation') {
        this.editBudgetItem(row)
      }
    },
    
    // 保存和加载方法
    saveBudget() {
      return new Promise((resolve) => {
        // 模拟保存操作
        setTimeout(() => {
          // 计算总预算金额
          const totalAmount = this.budgetFormItems.reduce((sum, item) => {
            return sum + (item.quarter1 + item.quarter2 + item.quarter3 + item.quarter4)
          }, 0)
          
          if (this.budgetDialog.type === 'add') {
            // 添加新预算
            const newBudget = {
              id: Date.now(),
              ...this.budgetForm,
              amount: totalAmount,
              usedAmount: 0,
              balance: totalAmount,
              executionRate: 0,
              status: 'draft',
              createdBy: '当前用户',
              createdDate: new Date().toISOString().split('T')[0]
            }
            this.budgets.push(newBudget)
          } else if (this.budgetDialog.type === 'edit') {
            // 更新现有预算
            const budgetIndex = this.budgets.findIndex(b => b.id === this.currentBudget.id)
            if (budgetIndex > -1) {
              this.budgets[budgetIndex] = {
                ...this.budgets[budgetIndex],
                ...this.budgetForm,
                amount: totalAmount,
                balance: totalAmount - this.budgets[budgetIndex].usedAmount
              }
            }
          }
          
          this.budgetDialog.visible = false
          this.$message.success('保存成功')
          resolve()
        }, 500)
      })
    },
    
    saveAdjustment() {
      // 模拟保存调整
      const adjustmentAmount = this.adjustForm.adjustedAmount - this.adjustForm.originalAmount
      
      // 更新预算金额
      const budget = this.budgets.find(b => b.id === this.adjustForm.budgetId)
      if (budget) {
        const oldAmount = budget.amount
        budget.amount = this.adjustForm.adjustedAmount
        budget.balance = budget.amount - budget.usedAmount
        
        // 添加调整记录
        const newAdjustment = {
          id: Date.now(),
          adjustmentNo: `ADJ${new Date().getFullYear()}${String(Date.now()).slice(-6)}`,
          adjustmentDate: new Date().toISOString().split('T')[0],
          adjustmentReason: this.adjustForm.adjustmentReason,
          originalAmount: oldAmount,
          adjustedAmount: this.adjustForm.adjustedAmount,
          adjustmentAmount: adjustmentAmount,
          adjustedBy: '当前用户',
          status: 'approved'
        }
        
        if (!this.budgetAdjustments) {
          this.budgetAdjustments = []
        }
        this.budgetAdjustments.push(newAdjustment)
        
        // 更新预算状态
        budget.status = 'adjusted'
      }
      
      this.adjustDialog.visible = false
      this.$message.success('预算调整成功')
    },
    
    loadBudgetDetails(budgetId) {
      // 模拟加载预算明细
      this.budgetDetails = [
        {
          id: 1,
          itemName: '人力成本',
          departmentName: '研发部',
          quarter1: 500000,
          quarter2: 500000,
          quarter3: 500000,
          quarter4: 500000,
          total: 2000000,
          usedAmount: 1400000,
          balance: 600000,
          executionRate: 70
        },
        {
          id: 2,
          itemName: '设备采购',
          departmentName: '生产部',
          quarter1: 1000000,
          quarter2: 500000,
          quarter3: 0,
          quarter4: 0,
          total: 1500000,
          usedAmount: 1500000,
          balance: 0,
          executionRate: 100
        },
        {
          id: 3,
          itemName: '市场推广',
          departmentName: '销售部',
          quarter1: 300000,
          quarter2: 300000,
          quarter3: 400000,
          quarter4: 500000,
          total: 1500000,
          usedAmount: 1000000,
          balance: 500000,
          executionRate: 66.67
        },
        {
          id: 4,
          itemName: '办公费用',
          departmentName: '行政部',
          quarter1: 100000,
          quarter2: 100000,
          quarter3: 100000,
          quarter4: 100000,
          total: 400000,
          usedAmount: 300000,
          balance: 100000,
          executionRate: 75
        }
      ]
    },
    
    loadBudgetAdjustments(budgetId) {
      // 模拟加载预算调整记录
      this.budgetAdjustments = [
        {
          id: 1,
          adjustmentNo: 'ADJ2023001',
          adjustmentDate: '2023-06-15',
          adjustmentReason: '业务扩展需求',
          originalAmount: 9000000,
          adjustedAmount: 10000000,
          adjustmentAmount: 1000000,
          adjustedBy: '张三',
          status: 'approved'
        },
        {
          id: 2,
          adjustmentNo: 'ADJ2023002',
          adjustmentDate: '2023-09-20',
          adjustmentReason: '研发项目增加',
          originalAmount: 2500000,
          adjustedAmount: 3000000,
          adjustmentAmount: 500000,
          adjustedBy: '李四',
          status: 'approved'
        }
      ]
    }
  }
}
</script>

<style scoped>
.budget-management-container {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.card {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.year-select,
.type-select,
.status-select {
  width: 150px;
}

.search-input {
  width: 250px;
}

.card-body {
  padding: 20px;
}

/* 概览卡片样式 */
.overview-section {
  margin-bottom: 30px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.overview-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.overview-card:hover {
  transform: translateY(-2px);
}

.overview-card.total-budget {
  border-left: 4px solid #409eff;
}

.overview-card.used-budget {
  border-left: 4px solid #67c23a;
}

.overview-card.remaining-budget {
  border-left: 4px solid #e6a23c;
}

.overview-card.execution-rate {
  border-left: 4px solid #f56c6c;
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: #fff;
}

.total-budget .card-icon {
  background: #409eff;
}

.used-budget .card-icon {
  background: #67c23a;
}

.remaining-budget .card-icon {
  background: #e6a23c;
}

.execution-rate .card-icon {
  background: #f56c6c;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

/* 执行趋势图表 */
.execution-trend-section {
  margin-bottom: 30px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-header {
  margin-bottom: 15px;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.chart-content {
  height: 300px;
}

.chart {
  width: 100%;
  height: 100%;
}

/* 分页样式 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 对话框样式 */
.budget-detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.detail-header {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
}

.detail-basic-info h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.meta-item {
  font-size: 14px;
  color: #606266;
}

.detail-summary {
  display: flex;
  gap: 30px;
}

.summary-item {
  text-align: center;
}

.summary-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.summary-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.budget-form-content {
  max-height: 600px;
  overflow-y: auto;
}

.budget-items-section {
  margin-top: 30px;
}

.budget-items-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.budget-items-footer {
  margin-top: 15px;
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-left,
  .header-right {
    flex-direction: column;
    align-items: stretch;
  }
  
  .year-select,
  .type-select,
  .status-select,
  .search-input {
    width: 100%;
  }
  
  .overview-cards {
    grid-template-columns: 1fr;
  }
  
  .detail-header {
    flex-direction: column;
  }
  
  .detail-summary {
    flex-direction: column;
    gap: 15px;
  }
}
</style>