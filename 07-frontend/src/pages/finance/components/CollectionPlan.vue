<template>
  <div class="collection-plan">
    <div class="header">
      <h2>回款计划</h2>
      <div class="header-actions">
        <el-button type="primary" @click="createPlan">创建回款计划</el-button>
        <el-button @click="generatePlan">智能生成计划</el-button>
        <el-button @click="refreshData">刷新</el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="计划编号">
        <el-input v-model="searchForm.planNumber" placeholder="请输入计划编号" />
      </el-form-item>
      <el-form-item label="客户名称">
        <el-input v-model="searchForm.customerName" placeholder="请输入客户名称" />
      </el-form-item>
      <el-form-item label="计划状态">
        <el-select v-model="searchForm.status" placeholder="请选择状态">
          <el-option label="全部" value="" />
          <el-option label="制定中" value="draft" />
          <el-option label="已确认" value="confirmed" />
          <el-option label="执行中" value="executing" />
          <el-option label="已完成" value="completed" />
          <el-option label="已终止" value="terminated" />
        </el-select>
      </el-form-item>
      <el-form-item label="负责人">
        <el-select v-model="searchForm.responsiblePerson" placeholder="请选择负责人">
          <el-option label="全部" value="" />
          <el-option label="张三" value="张三" />
          <el-option label="李四" value="李四" />
          <el-option label="王五" value="王五" />
          <el-option label="赵六" value="赵六" />
        </el-select>
      </el-form-item>
      <el-form-item label="计划日期">
        <el-date-picker
          v-model="searchForm.planDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 计划统计 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">本月计划回款</div>
              <div class="stat-value primary">{{ formatCurrency(currentMonthPlanAmount) }}</div>
              <div class="stat-desc">{{ currentMonthPlanCount }} 个计划</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">本月实际回款</div>
              <div class="stat-value success">{{ formatCurrency(currentMonthActualAmount) }}</div>
              <div class="stat-desc">完成率 {{ currentMonthCompletionRate }}%</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">执行中计划</div>
              <div class="stat-value warning">{{ executingPlanCount }}</div>
              <div class="stat-desc">总金额 {{ formatCurrency(executingPlanAmount) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">逾期未完成</div>
              <div class="stat-value danger">{{ overduePlanCount }}</div>
              <div class="stat-desc">总金额 {{ formatCurrency(overduePlanAmount) }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 回款趋势图表 -->
    <el-card class="chart-card">
      <template #header>
        <div class="chart-header">
          <span>回款计划执行趋势</span>
          <el-select v-model="chartTimeRange" @change="updateChartData">
            <el-option label="近6个月" value="6months" />
            <el-option label="近12个月" value="12months" />
            <el-option label="全部" value="all" />
          </el-select>
        </div>
      </template>
      <div ref="chartContainer" class="chart-container"></div>
    </el-card>

    <!-- 回款计划列表 -->
    <el-table
      v-loading="loading"
      :data="planList"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      border
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="planNumber" label="计划编号" width="180">
        <template #default="{ row }">
          <a href="#" @click.stop="viewPlanDetails(row)">{{ row.planNumber }}</a>
        </template>
      </el-table-column>
      <el-table-column prop="planName" label="计划名称" width="200" />
      <el-table-column prop="customerName" label="客户名称" width="180" />
      <el-table-column prop="totalAmount" label="计划金额" width="120" align="right">
        <template #default="{ row }">
          <span class="text-primary">{{ formatCurrency(row.totalAmount) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="actualAmount" label="已回金额" width="120" align="right">
        <template #default="{ row }">
          <span class="text-success">{{ formatCurrency(row.actualAmount) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="completionRate" label="完成率" width="100" align="center">
        <template #default="{ row }">
          <el-progress
            type="circle"
            :percentage="row.completionRate"
            :color="getCompletionRateColor(row.completionRate)"
            :width="60"
            :show-text="false"
          />
          <span class="completion-text">{{ row.completionRate }}%</span>
        </template>
      </el-table-column>
      <el-table-column prop="startDate" label="开始日期" width="130">
        <template #default="{ row }">
          {{ formatDate(row.startDate) }}
        </template>
      </el-table-column>
      <el-table-column prop="endDate" label="结束日期" width="130">
        <template #default="{ row }">
          <span :class="getEndDateClass(row)">{{ formatDate(row.endDate) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="responsiblePerson" label="负责人" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="150" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'draft'"
            type="primary"
            size="small"
            @click="confirmPlan(row)"
          >
            确认计划
          </el-button>
          <el-button
            v-if="row.status === 'confirmed'"
            type="success"
            size="small"
            @click="executePlan(row)"
          >
            开始执行
          </el-button>
          <el-button
            v-if="row.status === 'executing'"
            size="small"
            @click="followUpPlan(row)"
          >
            跟进执行
          </el-button>
          <el-button
            v-if="['draft', 'confirmed'].includes(row.status)"
            size="small"
            @click="editPlan(row)"
          >
            编辑
          </el-button>
          <el-button
            v-if="row.status !== 'completed' && row.status !== 'terminated'"
            type="danger"
            size="small"
            @click="terminatePlan(row)"
          >
            终止
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 创建计划对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      :title="isEdit ? '编辑回款计划' : '创建回款计划'"
      width="800px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="计划编号" prop="planNumber">
          <el-input
            v-model="formData.planNumber"
            :disabled="!isEdit"
            placeholder="系统自动生成"
          />
        </el-form-item>
        <el-form-item label="计划名称" prop="planName">
          <el-input v-model="formData.planName" placeholder="请输入计划名称" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customerId">
              <el-select v-model="formData.customerId" placeholder="请选择客户" filterable @change="onCustomerChange">
                <el-option
                  v-for="customer in customerList"
                  :key="customer.id"
                  :label="customer.name"
                  :value="customer.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人" prop="responsiblePerson">
              <el-select v-model="formData.responsiblePerson" placeholder="请选择负责人">
                <el-option label="张三" value="张三" />
                <el-option label="李四" value="李四" />
                <el-option label="王五" value="王五" />
                <el-option label="赵六" value="赵六" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker
                v-model="formData.startDate"
                type="date"
                placeholder="请选择开始日期"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期" prop="endDate">
              <el-date-picker
                v-model="formData.endDate"
                type="date"
                placeholder="请选择结束日期"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 计划明细 -->
        <el-form-item>
          <template #label>
            <span>计划明细</span>
            <el-button
              type="primary"
              size="small"
              @click="addPlanItem"
              style="margin-left: 20px;"
            >
              添加明细
            </el-button>
          </template>
          <el-table
            v-loading="loading"
            :data="formData.items"
            style="width: 100%"
            border
          >
            <el-table-column prop="orderNumber" label="订单编号" width="180">
              <template #default="{ row, $index }">
                <el-select
                  v-model="row.orderId"
                  placeholder="请选择订单"
                  filterable
                  @change="onOrderChange($index, row)"
                  style="width: 100%;"
                >
                  <el-option
                    v-for="order in availableOrders"
                    :key="order.id"
                    :label="`${order.orderNumber} - 待回款: ${order.remainingAmount.toFixed(2)}元`"
                    :value="order.id"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="orderNumber" label="订单号" width="150" />
            <el-table-column prop="dueDate" label="到期日期" width="130">
              <template #default="{ row }">
                <el-date-picker
                  v-model="row.dueDate"
                  type="date"
                  placeholder="请选择日期"
                  style="width: 100%;"
                />
              </template>
            </el-table-column>
            <el-table-column prop="plannedAmount" label="计划回款金额" width="150" align="right">
              <template #default="{ row }">
                <el-input
                  v-model.number="row.plannedAmount"
                  type="number"
                  placeholder="0.00"
                  style="width: 120px; margin: 0 auto;"
                  @change="updateTotalAmount"
                />
              </template>
            </el-table-column>
            <el-table-column prop="paymentMethod" label="回款方式" width="120">
              <template #default="{ row }">
                <el-select v-model="row.paymentMethod" placeholder="请选择方式" style="width: 100%;">
                  <el-option label="银行转账" value="bankTransfer" />
                  <el-option label="支付宝" value="alipay" />
                  <el-option label="微信支付" value="wechat" />
                  <el-option label="现金" value="cash" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="priority" label="优先级" width="100">
              <template #default="{ row }">
                <el-select v-model="row.priority" placeholder="请选择" style="width: 100%;">
                  <el-option label="高" value="high" />
                  <el-option label="中" value="medium" />
                  <el-option label="低" value="low" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="150">
              <template #default="{ row }">
                <el-input v-model="row.remark" placeholder="请输入备注" style="width: 100%;" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ $index }">
                <el-button
                  type="danger"
                  size="small"
                  @click="removePlanItem($index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
        
        <el-form-item label="计划总金额" prop="totalAmount">
          <el-input v-model="formData.totalAmount" disabled />
        </el-form-item>
        <el-form-item label="回款目标" prop="collectionTarget">
          <el-input
            v-model="formData.collectionTarget"
            type="textarea"
            placeholder="请输入回款目标"
            rows="2"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            placeholder="请输入备注信息"
            rows="2"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="savePlan">保存计划</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 跟进执行对话框 -->
    <el-dialog
      v-model="followUpDialogVisible"
      title="计划跟进执行"
      width="700px"
    >
      <div v-if="currentPlan" class="follow-up-content">
        <div class="plan-info">
          <h3>{{ currentPlan.planName }} - {{ currentPlan.customerName }}</h3>
          <el-descriptions border :column="2">
            <el-descriptions-item label="计划编号">{{ currentPlan.planNumber }}</el-descriptions-item>
            <el-descriptions-item label="负责人">{{ currentPlan.responsiblePerson }}</el-descriptions-item>
            <el-descriptions-item label="计划金额">{{ formatCurrency(currentPlan.totalAmount) }}</el-descriptions-item>
            <el-descriptions-item label="已回金额">{{ formatCurrency(currentPlan.actualAmount) }}</el-descriptions-item>
            <el-descriptions-item label="完成率">{{ currentPlan.completionRate }}%</el-descriptions-item>
            <el-descriptions-item label="当前状态">{{ getStatusText(currentPlan.status) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 计划明细进度 -->
        <div class="plan-items-progress">
          <h4>计划明细执行进度</h4>
          <el-table
            :data="planItemsWithProgress"
            style="width: 100%"
            border
          >
            <el-table-column prop="orderNumber" label="订单编号" width="180" />
            <el-table-column prop="dueDate" label="到期日期" width="130">
              <template #default="{ row }">
                {{ formatDate(row.dueDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="plannedAmount" label="计划金额" width="130" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.plannedAmount) }}
              </template>
            </el-table-column>
            <el-table-column prop="actualAmount" label="实际回款" width="130" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.actualAmount || 0) }}
              </template>
            </el-table-column>
            <el-table-column prop="progress" label="进度" width="150">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.progress || 0"
                  :color="getProgressColor(row.progress || 0)"
                  :status="getProgressStatus(row.progress || 0)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="paymentStatus" label="支付状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getPaymentStatusType(row.paymentStatus)">{{ getPaymentStatusText(row.paymentStatus) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button
                  v-if="row.paymentStatus !== 'paid'"
                  type="primary"
                  size="small"
                  @click="recordPayment(row)"
                >
                  记录回款
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 执行记录 -->
        <div class="execution-records">
          <h4>执行记录</h4>
          <el-table
            :data="executionRecords"
            style="width: 100%"
            border
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="recordDate" label="记录日期" width="130">
              <template #default="{ row }">
                {{ formatDate(row.recordDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="recordType" label="记录类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getRecordTypeColor(row.recordType)">{{ getRecordTypeText(row.recordType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="执行内容" min-width="200" />
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column prop="remark" label="备注" min-width="150" />
          </el-table>
        </div>

        <!-- 添加执行记录 -->
        <div class="add-record">
          <h4>添加执行记录</h4>
          <el-form :model="recordForm" :rules="recordRules" label-width="100px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="记录日期" prop="recordDate">
                  <el-date-picker
                    v-model="recordForm.recordDate"
                    type="date"
                    placeholder="请选择日期"
                    style="width: 100%;"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="记录类型" prop="recordType">
                  <el-select v-model="recordForm.recordType" placeholder="请选择类型" style="width: 100%;">
                    <el-option label="回款" value="collection" />
                    <el-option label="联系客户" value="contact" />
                    <el-option label="状态更新" value="status_update" />
                    <el-option label="其他" value="other" />
                  </el-select>
                </el-form-item>
              </el-row>
            </el-row>
            <el-form-item label="执行内容" prop="content">
              <el-input
                v-model="recordForm.content"
                type="textarea"
                placeholder="请输入执行内容"
                rows="3"
              />
            </el-form-item>
            <el-form-item label="备注">
              <el-input
                v-model="recordForm.remark"
                type="textarea"
                placeholder="请输入备注"
                rows="2"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="addExecutionRecord">添加记录</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-dialog>

    <!-- 记录回款对话框 -->
    <el-dialog
      v-model="recordPaymentDialogVisible"
      title="记录回款"
      width="600px"
    >
      <el-form
        ref="paymentFormRef"
        :model="paymentForm"
        :rules="paymentRules"
        label-width="120px"
      >
        <el-form-item label="订单编号">
          <el-input v-model="paymentForm.orderNumber" disabled />
        </el-form-item>
        <el-form-item label="计划金额">
          <el-input v-model="paymentForm.plannedAmount" disabled />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="回款日期" prop="collectionDate">
              <el-date-picker
                v-model="paymentForm.collectionDate"
                type="date"
                placeholder="请选择日期"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="回款金额" prop="collectionAmount">
              <el-input
                v-model.number="paymentForm.collectionAmount"
                type="number"
                placeholder="请输入金额"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="回款方式" prop="paymentMethod">
          <el-select v-model="paymentForm.paymentMethod" placeholder="请选择方式">
            <el-option label="银行转账" value="bankTransfer" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信支付" value="wechat" />
            <el-option label="现金" value="cash" />
          </el-select>
        </el-form-item>
        <el-form-item label="交易流水号" prop="transactionNumber">
          <el-input v-model="paymentForm.transactionNumber" placeholder="请输入交易流水号" />
        </el-form-item>
        <el-form-item label="回款备注" prop="remark">
          <el-input
            v-model="paymentForm.remark"
            type="textarea"
            placeholder="请输入备注信息"
            rows="2"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="recordPaymentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmRecordPayment">确认记录</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 计划详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="计划详情"
      width="800px"
    >
      <div v-if="currentPlan" class="detail-content">
        <el-descriptions border :column="2" :title="currentPlan.planName + ' - ' + currentPlan.planNumber">
          <el-descriptions-item label="计划名称">{{ currentPlan.planName }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ currentPlan.customerName }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentPlan.responsiblePerson }}</el-descriptions-item>
          <el-descriptions-item label="计划状态">{{ getStatusText(currentPlan.status) }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ formatDate(currentPlan.startDate) }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ formatDate(currentPlan.endDate) }}</el-descriptions-item>
          <el-descriptions-item label="计划金额">{{ formatCurrency(currentPlan.totalAmount) }}</el-descriptions-item>
          <el-descriptions-item label="已回金额">{{ formatCurrency(currentPlan.actualAmount) }}</el-descriptions-item>
          <el-descriptions-item label="完成率">{{ currentPlan.completionRate }}%</el-descriptions-item>
          <el-descriptions-item label="创建日期">{{ formatDate(currentPlan.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="回款目标" :span="2">{{ currentPlan.collectionTarget || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentPlan.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 计划明细 -->
        <div class="detail-plan-items">
          <h4>计划明细</h4>
          <el-table
            :data="currentPlan.items"
            style="width: 100%"
            border
          >
            <el-table-column prop="orderNumber" label="订单编号" width="180" />
            <el-table-column prop="dueDate" label="到期日期" width="130">
              <template #default="{ row }">
                {{ formatDate(row.dueDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="plannedAmount" label="计划金额" width="130" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.plannedAmount) }}
              </template>
            </el-table-column>
            <el-table-column prop="paymentMethod" label="回款方式" width="120">
              <template #default="{ row }">
                {{ getPaymentMethodText(row.paymentMethod) }}
              </template>
            </el-table-column>
            <el-table-column prop="priority" label="优先级" width="100">
              <template #default="{ row }">
                <el-tag :type="getPriorityType(row.priority)">{{ getPriorityText(row.priority) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="200" />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'CollectionPlan',
  setup() {
    // 状态管理
    const loading = ref(false);
    const planList = ref([]);
    const selectedRows = ref([]);
    const createDialogVisible = ref(false);
    const followUpDialogVisible = ref(false);
    const recordPaymentDialogVisible = ref(false);
    const detailDialogVisible = ref(false);
    const currentPlan = ref(null);
    const currentPlanItem = ref(null);
    const isEdit = ref(false);
    const chartContainer = ref(null);
    const chartTimeRange = ref('6months');

    // 表单引用
    const formRef = ref(null);
    const paymentFormRef = ref(null);

    // 搜索表单
    const searchForm = reactive({
      planNumber: '',
      customerName: '',
      status: '',
      responsiblePerson: '',
      planDateRange: null
    });

    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    });

    // 模拟数据
    const customerList = ref([
      { id: '1', name: '北京科技有限公司' },
      { id: '2', name: '上海贸易公司' },
      { id: '3', name: '广州制造有限公司' },
      { id: '4', name: '深圳科技集团' },
      { id: '5', name: '杭州电子有限公司' }
    ]);

    const orderList = ref([
      { id: '1', orderNumber: 'SO20240001', customerId: '1', customerName: '北京科技有限公司', remainingAmount: 50000.00 },
      { id: '2', orderNumber: 'SO20240002', customerId: '2', customerName: '上海贸易公司', remainingAmount: 180000.00 },
      { id: '3', orderNumber: 'SO20240003', customerId: '3', customerName: '广州制造有限公司', remainingAmount: 200000.00 },
      { id: '4', orderNumber: 'SO20240004', customerId: '4', customerName: '深圳科技集团', remainingAmount: 140000.00 },
      { id: '5', orderNumber: 'SO20240005', customerId: '1', customerName: '北京科技有限公司', remainingAmount: 80000.00 },
      { id: '6', orderNumber: 'SO20240006', customerId: '5', customerName: '杭州电子有限公司', remainingAmount: 150000.00 }
    ]);

    // 表单数据
    const formData = reactive({
      id: '',
      planNumber: '',
      planName: '',
      customerId: '',
      customerName: '',
      responsiblePerson: '张三',
      startDate: new Date(),
      endDate: new Date(),
      totalAmount: 0,
      actualAmount: 0,
      completionRate: 0,
      collectionTarget: '',
      remark: '',
      items: []
    });

    // 记录表单
    const recordForm = reactive({
      recordDate: new Date(),
      recordType: 'contact',
      content: '',
      remark: ''
    });

    // 回款记录表单
    const paymentForm = reactive({
      orderNumber: '',
      plannedAmount: 0,
      collectionDate: new Date(),
      collectionAmount: 0,
      paymentMethod: 'bankTransfer',
      transactionNumber: '',
      remark: ''
    });

    // 表单验证规则
    const rules = {
      planNumber: [{ required: true, message: '请输入计划编号', trigger: 'blur' }],
      planName: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
      customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
      responsiblePerson: [{ required: true, message: '请选择负责人', trigger: 'change' }],
      startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
      endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
      totalAmount: [{ required: true, message: '计划总金额不能为空', trigger: 'blur' }]
    };

    const recordRules = {
      recordDate: [{ required: true, message: '请选择记录日期', trigger: 'change' }],
      recordType: [{ required: true, message: '请选择记录类型', trigger: 'change' }],
      content: [{ required: true, message: '请输入执行内容', trigger: 'blur' }]
    };

    const paymentRules = {
      collectionDate: [{ required: true, message: '请选择回款日期', trigger: 'change' }],
      collectionAmount: [
        { required: true, message: '请输入回款金额', trigger: 'blur' },
        { type: 'number', min: 0.01, message: '回款金额必须大于0', trigger: 'blur' }
      ],
      paymentMethod: [{ required: true, message: '请选择回款方式', trigger: 'change' }],
      transactionNumber: [{ required: true, message: '请输入交易流水号', trigger: 'blur' }]
    };

    // 计算属性
    const availableOrders = computed(() => {
      if (!formData.customerId) return [];
      return orderList.value.filter(order => order.customerId === formData.customerId);
    });

    const currentMonthPlanAmount = computed(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      return planList.value
        .filter(item => {
          const startDate = new Date(item.startDate);
          return startDate.getFullYear() === year && startDate.getMonth() === month;
        })
        .reduce((sum, item) => sum + item.totalAmount, 0);
    });

    const currentMonthPlanCount = computed(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      return planList.value.filter(item => {
        const startDate = new Date(item.startDate);
        return startDate.getFullYear() === year && startDate.getMonth() === month;
      }).length;
    });

    const currentMonthActualAmount = computed(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      return planList.value
        .filter(item => {
          const startDate = new Date(item.startDate);
          return startDate.getFullYear() === year && startDate.getMonth() === month;
        })
        .reduce((sum, item) => sum + item.actualAmount, 0);
    });

    const currentMonthCompletionRate = computed(() => {
      if (currentMonthPlanAmount.value === 0) return 0;
      return Math.round((currentMonthActualAmount.value / currentMonthPlanAmount.value) * 100);
    });

    const executingPlanCount = computed(() => {
      return planList.value.filter(item => item.status === 'executing').length;
    });

    const executingPlanAmount = computed(() => {
      return planList.value
        .filter(item => item.status === 'executing')
        .reduce((sum, item) => sum + item.totalAmount, 0);
    });

    const overduePlanCount = computed(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return planList.value.filter(item => {
        const endDate = new Date(item.endDate);
        endDate.setHours(0, 0, 0, 0);
        return endDate < today && item.status !== 'completed' && item.status !== 'terminated';
      }).length;
    });

    const overduePlanAmount = computed(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return planList.value
        .filter(item => {
          const endDate = new Date(item.endDate);
          endDate.setHours(0, 0, 0, 0);
          return endDate < today && item.status !== 'completed' && item.status !== 'terminated';
        })
        .reduce((sum, item) => sum + (item.totalAmount - item.actualAmount), 0);
    });

    const planItemsWithProgress = computed(() => {
      if (!currentPlan.value || !currentPlan.value.items) return [];
      return currentPlan.value.items.map(item => ({
        ...item,
        progress: item.plannedAmount > 0 ? Math.round((item.actualAmount || 0) / item.plannedAmount * 100) : 0,
        paymentStatus: item.plannedAmount > 0 && (item.actualAmount || 0) >= item.plannedAmount ? 'paid' : 'unpaid'
      }));
    });

    const executionRecords = ref([]);

    // 格式化日期
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // 格式化货币
    const formatCurrency = (value) => {
      if (value === null || value === undefined) return '0.00 元';
      return `${value.toFixed(2)} 元`;
    };

    // 获取状态类型
    const getStatusType = (status) => {
      switch (status) {
        case 'draft': return 'info';
        case 'confirmed': return 'warning';
        case 'executing': return 'primary';
        case 'completed': return 'success';
        case 'terminated': return 'danger';
        default: return 'default';
      }
    };

    // 获取状态文本
    const getStatusText = (status) => {
      switch (status) {
        case 'draft': return '制定中';
        case 'confirmed': return '已确认';
        case 'executing': return '执行中';
        case 'completed': return '已完成';
        case 'terminated': return '已终止';
        default: return '未知';
      }
    };

    // 获取完成率颜色
    const getCompletionRateColor = (rate) => {
      if (rate >= 100) return '#67c23a';
      if (rate >= 70) return '#409eff';
      if (rate >= 30) return '#e6a23c';
      return '#f56c6c';
    };

    // 获取进度颜色
    const getProgressColor = (progress) => {
      if (progress >= 100) return '#67c23a';
      if (progress >= 70) return '#409eff';
      if (progress >= 30) return '#e6a23c';
      return '#f56c6c';
    };

    // 获取进度状态
    const getProgressStatus = (progress) => {
      return progress >= 100 ? 'success' : '';
    };

    // 获取支付状态类型
    const getPaymentStatusType = (status) => {
      return status === 'paid' ? 'success' : 'warning';
    };

    // 获取支付状态文本
    const getPaymentStatusText = (status) => {
      return status === 'paid' ? '已支付' : '未支付';
    };

    // 获取记录类型颜色
    const getRecordTypeColor = (type) => {
      switch (type) {
        case 'collection': return 'success';
        case 'contact': return 'primary';
        case 'status_update': return 'warning';
        default: return 'info';
      }
    };

    // 获取记录类型文本
    const getRecordTypeText = (type) => {
      switch (type) {
        case 'collection': return '回款';
        case 'contact': return '联系客户';
        case 'status_update': return '状态更新';
        default: return '其他';
      }
    };

    // 获取回款方式文本
    const getPaymentMethodText = (method) => {
      switch (method) {
        case 'bankTransfer': return '银行转账';
        case 'alipay': return '支付宝';
        case 'wechat': return '微信支付';
        case 'cash': return '现金';
        default: return '其他';
      }
    };

    // 获取优先级类型
    const getPriorityType = (priority) => {
      switch (priority) {
        case 'high': return 'danger';
        case 'medium': return 'warning';
        case 'low': return 'success';
        default: return 'info';
      }
    };

    // 获取优先级文本
    const getPriorityText = (priority) => {
      switch (priority) {
        case 'high': return '高';
        case 'medium': return '中';
        case 'low': return '低';
        default: return '未知';
      }
    };

    // 获取结束日期样式
    const getEndDateClass = (row) => {
      if (row.status === 'completed' || row.status === 'terminated') return '';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(row.endDate);
      endDate.setHours(0, 0, 0, 0);
      
      if (endDate < today) return 'text-danger';
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 3);
      if (endDate <= tomorrow) return 'text-warning';
      return '';
    };

    // 处理选择变化
    const handleSelectionChange = (val) => {
      selectedRows.value = val;
    };

    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
      loadData();
    };

    const handleCurrentChange = (current) => {
      pagination.currentPage = current;
      loadData();
    };

    // 搜索
    const search = () => {
      pagination.currentPage = 1;
      loadData();
    };

    // 重置搜索
    const resetSearch = () => {
      Object.keys(searchForm).forEach(key => {
        if (key === 'planDateRange') {
          searchForm[key] = null;
        } else {
          searchForm[key] = '';
        }
      });
      pagination.currentPage = 1;
      loadData();
    };

    // 重置表单
    const resetForm = () => {
      if (formRef.value) {
        formRef.value.resetFields();
      }
      Object.assign(formData, {
        id: '',
        planNumber: '',
        planName: '',
        customerId: '',
        customerName: '',
        responsiblePerson: '张三',
        startDate: new Date(),
        endDate: new Date(),
        totalAmount: 0,
        actualAmount: 0,
        completionRate: 0,
        collectionTarget: '',
        remark: '',
        items: []
      });
      isEdit.value = false;
    };

    // 生成计划编号
    const generatePlanNumber = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `CP${year}${month}${day}${random}`;
    };

    // 客户选择变化
    const onCustomerChange = () => {
      const customer = customerList.value.find(c => c.id === formData.customerId);
      if (customer) {
        formData.customerName = customer.name;
      }
    };

    // 订单选择变化
    const onOrderChange = (index, row) => {
      const order = orderList.value.find(o => o.id === row.orderId);
      if (order) {
        row.orderNumber = order.orderNumber;
        row.plannedAmount = order.remainingAmount;
        updateTotalAmount();
      }
    };

    // 更新总金额
    const updateTotalAmount = () => {
      formData.totalAmount = formData.items.reduce((sum, item) => sum + (item.plannedAmount || 0), 0);
    };

    // 添加计划明细
    const addPlanItem = () => {
      formData.items.push({
        id: '',
        orderId: '',
        orderNumber: '',
        dueDate: new Date(),
        plannedAmount: 0,
        actualAmount: 0,
        paymentMethod: 'bankTransfer',
        priority: 'medium',
        remark: ''
      });
    };

    // 删除计划明细
    const removePlanItem = (index) => {
      formData.items.splice(index, 1);
      updateTotalAmount();
    };

    // 创建计划
    const createPlan = () => {
      resetForm();
      formData.planNumber = generatePlanNumber();
      createDialogVisible.value = true;
    };

    // 编辑计划
    const editPlan = (row) => {
      currentPlan.value = { ...row };
      formData.id = row.id;
      formData.planNumber = row.planNumber;
      formData.planName = row.planName;
      formData.customerId = customerList.value.find(c => c.name === row.customerName)?.id || '';
      formData.customerName = row.customerName;
      formData.responsiblePerson = row.responsiblePerson;
      formData.startDate = new Date(row.startDate);
      formData.endDate = new Date(row.endDate);
      formData.totalAmount = row.totalAmount;
      formData.actualAmount = row.actualAmount;
      formData.completionRate = row.completionRate;
      formData.collectionTarget = row.collectionTarget || '';
      formData.remark = row.remark || '';
      formData.items = JSON.parse(JSON.stringify(row.items || []));
      isEdit.value = true;
      createDialogVisible.value = true;
    };

    // 保存计划
    const savePlan = () => {
      formRef.value.validate((valid) => {
        if (valid) {
          // 模拟提交
          setTimeout(() => {
            ElMessage.success(isEdit.value ? '计划编辑成功' : '计划创建成功');
            createDialogVisible.value = false;
            loadData();
          }, 500);
        }
      });
    };

    // 智能生成计划
    const generatePlan = () => {
      ElMessageBox.confirm('确定要智能生成回款计划吗？这将根据待回款订单自动创建计划。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        loading.value = true;
        // 模拟智能生成
        setTimeout(() => {
          ElMessage.success('智能生成计划成功');
          loading.value = false;
          loadData();
        }, 1000);
      }).catch(() => {});
    };

    // 确认计划
    const confirmPlan = (row) => {
      ElMessageBox.confirm('确定要确认此回款计划吗？确认后将不可再编辑。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟确认
        setTimeout(() => {
          ElMessage.success('计划已确认');
          loadData();
        }, 500);
      }).catch(() => {});
    };

    // 开始执行
    const executePlan = (row) => {
      ElMessageBox.confirm('确定要开始执行此回款计划吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'success'
      }).then(() => {
        // 模拟执行
        setTimeout(() => {
          ElMessage.success('计划开始执行');
          loadData();
        }, 500);
      }).catch(() => {});
    };

    // 跟进计划
    const followUpPlan = (row) => {
      currentPlan.value = { ...row };
      // 模拟加载执行记录
      executionRecords.value = [
        {
          id: '1',
          recordDate: '2024-01-28',
          recordType: 'contact',
          content: '电话联系客户，确认付款进度',
          operator: '张三',
          remark: '客户表示会在3天内安排付款'
        },
        {
          id: '2',
          recordDate: '2024-01-25',
          recordType: 'collection',
          content: '收到部分回款 50,000.00 元',
          operator: '张三',
          remark: '已确认到账'
        },
        {
          id: '3',
          recordDate: '2024-01-20',
          recordType: 'status_update',
          content: '计划状态变更为执行中',
          operator: '系统',
          remark: '负责人确认开始执行'
        }
      ];
      followUpDialogVisible.value = true;
    };

    // 记录回款
    const recordPayment = (row) => {
      currentPlanItem.value = { ...row };
      paymentForm.orderNumber = row.orderNumber;
      paymentForm.plannedAmount = row.plannedAmount;
      paymentForm.collectionDate = new Date();
      paymentForm.collectionAmount = 0;
      paymentForm.paymentMethod = row.paymentMethod || 'bankTransfer';
      paymentForm.transactionNumber = '';
      paymentForm.remark = '';
      recordPaymentDialogVisible.value = true;
    };

    // 确认记录回款
    const confirmRecordPayment = () => {
      paymentFormRef.value.validate((valid) => {
        if (valid) {
          ElMessageBox.confirm('确定要记录此笔回款吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'success'
          }).then(() => {
            // 模拟记录
            setTimeout(() => {
              ElMessage.success('回款记录成功');
              recordPaymentDialogVisible.value = false;
              // 重新加载执行记录
              followUpPlan(currentPlan.value);
            }, 500);
          }).catch(() => {});
        }
      });
    };

    // 添加执行记录
    const addExecutionRecord = () => {
      // 模拟添加记录
      setTimeout(() => {
        ElMessage.success('执行记录添加成功');
        // 重置记录表单
        Object.assign(recordForm, {
          recordDate: new Date(),
          recordType: 'contact',
          content: '',
          remark: ''
        });
        // 重新加载记录
        followUpPlan(currentPlan.value);
      }, 500);
    };

    // 终止计划
    const terminatePlan = (row) => {
      ElMessageBox.confirm('确定要终止此回款计划吗？此操作不可撤销。', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(() => {
        // 模拟终止
        setTimeout(() => {
          ElMessage.success('计划已终止');
          loadData();
        }, 500);
      }).catch(() => {});
    };

    // 查看计划详情
    const viewPlanDetails = (row) => {
      currentPlan.value = { ...row };
      detailDialogVisible.value = true;
    };

    // 刷新数据
    const refreshData = () => {
      loadData();
      updateChartData();
      ElMessage.success('数据已刷新');
    };

    // 更新图表数据
    const updateChartData = () => {
      // 这里应该使用真实的图表库，如 ECharts
      ElMessage.info('图表数据已更新');
    };

    // 加载数据
    const loadData = () => {
      loading.value = true;
      // 模拟API调用延迟
      setTimeout(() => {
        // 模拟数据
        const mockData = [
          {
            id: '1',
            planNumber: 'CP20240001',
            planName: '北京科技Q1回款计划',
            customerName: '北京科技有限公司',
            responsiblePerson: '张三',
            startDate: '2024-01-01',
            endDate: '2024-03-31',
            totalAmount: 130000.00,
            actualAmount: 50000.00,
            completionRate: 38,
            status: 'executing',
            createdAt: '2024-01-01',
            collectionTarget: '按季度完成Q1所有待回款订单',
            remark: '重点客户，需优先跟进',
            items: [
              {
                id: '1',
                orderNumber: 'SO20240001',
                dueDate: '2024-01-30',
                plannedAmount: 50000.00,
                actualAmount: 50000.00,
                paymentMethod: 'bankTransfer',
                priority: 'high',
                remark: '已全部回款'
              },
              {
                id: '2',
                orderNumber: 'SO20240005',
                dueDate: '2024-03-15',
                plannedAmount: 80000.00,
                actualAmount: 0,
                paymentMethod: 'bankTransfer',
                priority: 'medium',
                remark: '待跟进'
              }
            ]
          },
          {
            id: '2',
            planNumber: 'CP20240002',
            planName: '上海贸易2月回款计划',
            customerName: '上海贸易公司',
            responsiblePerson: '李四',
            startDate: '2024-02-01',
            endDate: '2024-02-29',
            totalAmount: 180000.00,
            actualAmount: 0,
            completionRate: 0,
            status: 'confirmed',
            createdAt: '2024-01-25',
            collectionTarget: '本月内完成全部回款',
            remark: '合同约定2月底前付款',
            items: [
              {
                id: '3',
                orderNumber: 'SO20240002',
                dueDate: '2024-02-28',
                plannedAmount: 180000.00,
                actualAmount: 0,
                paymentMethod: 'bankTransfer',
                priority: 'high',
                remark: '金额较大，需重点跟进'
              }
            ]
          },
          {
            id: '3',
            planNumber: 'CP20240003',
            planName: '广州制造回款计划',
            customerName: '广州制造有限公司',
            responsiblePerson: '王五',
            startDate: '2024-01-15',
            endDate: '2024-04-15',
            totalAmount: 200000.00,
            actualAmount: 0,
            completionRate: 0,
            status: 'draft',
            createdAt: '2024-01-10',
            collectionTarget: '分三次回款，Q2前完成',
            remark: '长期合作客户',
            items: [
              {
                id: '4',
                orderNumber: 'SO20240003',
                dueDate: '2024-04-15',
                plannedAmount: 200000.00,
                actualAmount: 0,
                paymentMethod: 'bankTransfer',
                priority: 'medium',
                remark: '分批次回款'
              }
            ]
          },
          {
            id: '4',
            planNumber: 'CP20240004',
            planName: '深圳科技集团回款计划',
            customerName: '深圳科技集团',
            responsiblePerson: '赵六',
            startDate: '2024-01-20',
            endDate: '2024-02-20',
            totalAmount: 140000.00,
            actualAmount: 140000.00,
            completionRate: 100,
            status: 'completed',
            createdAt: '2024-01-18',
            collectionTarget: '春节前完成回款',
            remark: '客户提前完成回款',
            items: [
              {
                id: '5',
                orderNumber: 'SO20240004',
                dueDate: '2024-02-20',
                plannedAmount: 140000.00,
                actualAmount: 140000.00,
                paymentMethod: 'alipay',
                priority: 'high',
                remark: '已全部回款'
              }
            ]
          },
          {
            id: '5',
            planNumber: 'CP20240005',
            planName: '杭州电子Q1回款计划',
            customerName: '杭州电子有限公司',
            responsiblePerson: '张三',
            startDate: '2024-01-05',
            endDate: '2024-03-31',
            totalAmount: 150000.00,
            actualAmount: 0,
            completionRate: 0,
            status: 'executing',
            createdAt: '2024-01-03',
            collectionTarget: '按合同约定进度回款',
            remark: '新客户，需加强沟通',
            items: [
              {
                id: '6',
                orderNumber: 'SO20240006',
                dueDate: '2024-03-31',
                plannedAmount: 150000.00,
                actualAmount: 0,
                paymentMethod: 'bankTransfer',
                priority: 'medium',
                remark: '需定期跟进'
              }
            ]
          }
        ];

        // 应用搜索过滤
        let filteredData = [...mockData];
        if (searchForm.planNumber) {
          filteredData = filteredData.filter(item => 
            item.planNumber.includes(searchForm.planNumber)
          );
        }
        if (searchForm.customerName) {
          filteredData = filteredData.filter(item => 
            item.customerName.includes(searchForm.customerName)
          );
        }
        if (searchForm.status) {
          filteredData = filteredData.filter(item => 
            item.status === searchForm.status
          );
        }
        if (searchForm.responsiblePerson) {
          filteredData = filteredData.filter(item => 
            item.responsiblePerson === searchForm.responsiblePerson
          );
        }
        if (searchForm.planDateRange && searchForm.planDateRange.length === 2) {
          const startDate = new Date(searchForm.planDateRange[0]);
          const endDate = new Date(searchForm.planDateRange[1]);
          filteredData = filteredData.filter(item => {
            const planStartDate = new Date(item.startDate);
            return planStartDate >= startDate && planStartDate <= endDate;
          });
        }

        // 分页处理
        const start = (pagination.currentPage - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        planList.value = filteredData.slice(start, end);
        pagination.total = filteredData.length;
        
        loading.value = false;
      }, 500);
    };

    // 生命周期
    onMounted(() => {
      loadData();
      // 初始化图表
      nextTick(() => {
        if (chartContainer.value) {
          updateChartData();
        }
      });
    });

    return {
      loading,
      planList,
      selectedRows,
      searchForm,
      pagination,
      createDialogVisible,
      followUpDialogVisible,
      recordPaymentDialogVisible,
      detailDialogVisible,
      currentPlan,
      currentPlanItem,
      isEdit,
      chartContainer,
      chartTimeRange,
      formData,
      formRef,
      recordForm,
      paymentForm,
      paymentFormRef,
      rules,
      recordRules,
      paymentRules,
      customerList,
      availableOrders,
      planItemsWithProgress,
      executionRecords,
      currentMonthPlanAmount,
      currentMonthPlanCount,
      currentMonthActualAmount,
      currentMonthCompletionRate,
      executingPlanCount,
      executingPlanAmount,
      overduePlanCount,
      overduePlanAmount,
      formatDate,
      formatCurrency,
      getStatusType,
      getStatusText,
      getCompletionRateColor,
      getProgressColor,
      getProgressStatus,
      getPaymentStatusType,
      getPaymentStatusText,
      getRecordTypeColor,
      getRecordTypeText,
      getPaymentMethodText,
      getPriorityType,
      getPriorityText,
      getEndDateClass,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      search,
      resetSearch,
      resetForm,
      generatePlanNumber,
      onCustomerChange,
      onOrderChange,
      updateTotalAmount,
      addPlanItem,
      removePlanItem,
      createPlan,
      editPlan,
      savePlan,
      generatePlan,
      confirmPlan,
      executePlan,
      followUpPlan,
      recordPayment,
      confirmRecordPayment,
      addExecutionRecord,
      terminatePlan,
      viewPlanDetails,
      refreshData,
      updateChartData
    };
  }
};
</script>

<style scoped>
.collection-plan {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-form {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stats-container {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 4px;
  overflow: hidden;
}

.stat-content {
  text-align: center;
  padding: 20px 0;
}

.stat-label {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-value.primary {
  color: #409eff;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.warning {
  color: #e6a23c;
}

.stat-value.danger {
  color: #f56c6c;
}

.stat-desc {
  color: #909399;
  font-size: 12px;
}

.chart-card {
  background: white;
  margin-bottom: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
  background: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.el-table {
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.text-primary {
  color: #409eff;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

.completion-text {
  font-size: 12px;
  color: #606266;
  margin-left: 8px;
}

.follow-up-content {
  max-height: 600px;
  overflow-y: auto;
}

.plan-info {
  margin-bottom: 20px;
}

.plan-info h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #303133;
}

.plan-items-progress,
.execution-records,
.add-record {
  margin-bottom: 25px;
}

.plan-items-progress h4,
.execution-records h4,
.add-record h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #303133;
  font-size: 16px;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.detail-plan-items {
  margin-top: 25px;
}

.detail-plan-items h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #303133;
  font-size: 16px;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}
</style>