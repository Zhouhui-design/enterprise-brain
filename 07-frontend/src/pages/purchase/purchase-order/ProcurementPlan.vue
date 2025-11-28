<template>
  <ResponsiveLayout>
    <template #header>
      <HeaderNavigation
        title="采购计划管理"
        :show-search="true"
        :show-notifications="true"
        @toggle-sidebar="() => {}"
      >
        <template #actions>
          <button 
            class="header-action-btn primary"
            @click="handleCreatePlan"
          >
            <i class="fas fa-plus"></i>
            <span>新建计划</span>
          </button>
          <button 
            class="header-action-btn secondary"
            @click="handleRefresh"
            :disabled="loading"
          >
            <i class="fas fa-sync-alt"></i>
            <span>刷新数据</span>
          </button>
          <button 
            class="header-action-btn secondary"
            @click="handleExport"
          >
            <i class="fas fa-download"></i>
            <span>导出计划</span>
          </button>
        </template>
      </HeaderNavigation>
    </template>

    <template #breadcrumb>
      <BreadcrumbNav 
        :items="breadcrumbItems"
        :show-home="true"
      />
    </template>

    <!-- 主要内容区域 -->
    <div class="procurement-plan">
      <!-- 筛选区域 -->
      <div class="filter-section">
        <div class="filter-container">
          <div class="filter-row">
            <div class="filter-item">
              <label class="filter-label">计划名称</label>
              <input 
                v-model="searchForm.planName" 
                placeholder="请输入计划名称"
                class="filter-input"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="filter-item">
              <label class="filter-label">计划编号</label>
              <input 
                v-model="searchForm.planCode" 
                placeholder="请输入计划编号"
                class="filter-input"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="filter-item">
              <label class="filter-label">计划状态</label>
              <select v-model="searchForm.planStatus" class="filter-select">
                <option value="">全部状态</option>
                <option value="DRAFT">草稿</option>
                <option value="PENDING">待审批</option>
                <option value="APPROVED">已审批</option>
                <option value="REJECTED">已拒绝</option>
                <option value="EXECUTING">执行中</option>
                <option value="COMPLETED">已完成</option>
                <option value="CANCELLED">已取消</option>
              </select>
            </div>
            <div class="filter-item">
              <label class="filter-label">计划类型</label>
              <select v-model="searchForm.planType" class="filter-select">
                <option value="">全部类型</option>
                <option value="REGULAR">常规采购</option>
                <option value="EMERGENCY">紧急采购</option>
                <option value="PROJECT">项目采购</option>
                <option value="CONTRACT">合同采购</option>
              </select>
            </div>
          </div>
          
          <div class="filter-row">
            <div class="filter-item">
              <label class="filter-label">计划开始时间</label>
              <div class="date-range-container">
                <input
                  v-model="startDate"
                  type="date"
                  class="filter-input"
                  placeholder="开始日期"
                />
                <span class="date-separator">至</span>
                <input
                  v-model="endDate"
                  type="date"
                  class="filter-input"
                  placeholder="结束日期"
                />
              </div>
            </div>
            <div class="filter-item">
              <label class="filter-label">负责人</label>
              <select v-model="searchForm.responsiblePerson" class="filter-select">
                <option value="">全部负责人</option>
                <option
                  v-for="person in responsiblePersons"
                  :key="person.id"
                  :value="person.id"
                >
                  {{ person.name }}
                </option>
              </select>
            </div>
            <div class="filter-actions">
              <button 
                class="search-btn primary"
                @click="handleSearch"
                :disabled="loading"
              >
                <i class="fas fa-search"></i>
                <span>查询</span>
              </button>
              <button 
                class="search-btn secondary"
                @click="handleReset"
              >
                <i class="fas fa-redo"></i>
                <span>重置</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 统计概览 -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card primary">
            <div class="stat-icon">
              <i class="fas fa-clipboard-list"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(stats.totalPlans) }}</div>
              <div class="stat-label">总计划数</div>
              <div class="stat-change" :class="getChangeClass(stats.plansGrowth)">
                <i :class="getChangeIcon(stats.plansGrowth)"></i>
                <span>{{ formatPercent(stats.plansGrowth) }}</span>
              </div>
            </div>
          </div>

          <div class="stat-card success">
            <div class="stat-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(stats.completedPlans) }}</div>
              <div class="stat-label">已完成计划</div>
              <div class="stat-change" :class="getChangeClass(stats.completedGrowth)">
                <i :class="getChangeIcon(stats.completedGrowth)"></i>
                <span>{{ formatPercent(stats.completedGrowth) }}</span>
              </div>
            </div>
          </div>

          <div class="stat-card warning">
            <div class="stat-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(stats.executingPlans) }}</div>
              <div class="stat-label">执行中计划</div>
              <div class="stat-change" :class="getChangeClass(stats.executingGrowth)">
                <i :class="getChangeIcon(stats.executingGrowth)"></i>
                <span>{{ formatPercent(stats.executingGrowth) }}</span>
              </div>
            </div>
          </div>

          <div class="stat-card info">
            <div class="stat-icon">
              <i class="fas fa-dollar-sign"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatCurrency(stats.totalBudget) }}</div>
              <div class="stat-label">总预算金额</div>
              <div class="stat-change" :class="getChangeClass(stats.budgetGrowth)">
                <i :class="getChangeIcon(stats.budgetGrowth)"></i>
                <span>{{ formatPercent(stats.budgetGrowth) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 计划列表 -->
      <div class="table-section">
        <div class="table-container">
          <div class="table-header">
            <h3 class="table-title">采购计划列表</h3>
            <div class="table-actions">
              <button 
                class="table-action-btn"
                @click="handleBatchApprove"
                :disabled="selectedRows.length === 0"
              >
                <i class="fas fa-check-double"></i>
                <span>批量审批</span>
              </button>
              <button 
                class="table-action-btn"
                @click="handleBatchCancel"
                :disabled="selectedRows.length === 0"
              >
                <i class="fas fa-times-circle"></i>
                <span>批量取消</span>
              </button>
            </div>
          </div>
          
          <div class="table-wrapper" v-loading="loading">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="checkbox-column">
                    <input 
                      type="checkbox" 
                      @change="handleSelectAll"
                      :checked="isAllSelected"
                    />
                  </th>
                  <th class="sortable" @click="handleSort('planCode')">
                    计划编号
                    <i class="fas fa-sort" :class="getSortClass('planCode')"></i>
                  </th>
                  <th class="sortable" @click="handleSort('planName')">
                    计划名称
                    <i class="fas fa-sort" :class="getSortClass('planName')"></i>
                  </th>
                  <th>计划类型</th>
                  <th>负责人</th>
                  <th>计划开始时间</th>
                  <th>计划结束时间</th>
                  <th>预算金额</th>
                  <th>已用金额</th>
                  <th>完成进度</th>
                  <th>计划状态</th>
                  <th class="actions-column">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="item in paginatedData" 
                  :key="item.id"
                  :class="{ 'selected': selectedRows.includes(item.id) }"
                >
                  <td class="checkbox-column">
                    <input 
                      type="checkbox" 
                      :checked="selectedRows.includes(item.id)"
                      @change="handleRowSelect(item.id)"
                    />
                  </td>
                  <td class="plan-code">{{ item.planCode }}</td>
                  <td class="plan-name">{{ item.planName }}</td>
                  <td>
                    <span class="plan-type" :class="getPlanTypeClass(item.planType)">
                      {{ getPlanTypeText(item.planType) }}
                    </span>
                  </td>
                  <td>{{ item.responsiblePersonName }}</td>
                  <td>{{ formatDate(item.startTime) }}</td>
                  <td>{{ formatDate(item.endTime) }}</td>
                  <td class="text-right">{{ formatCurrency(item.totalBudget) }}</td>
                  <td class="text-right">{{ formatCurrency(item.usedBudget) }}</td>
                  <td>
                    <div class="progress-cell">
                      <div class="progress-bar">
                        <div 
                          class="progress-fill" 
                          :style="{ width: `${item.progress}%`, backgroundColor: getProgressColor(item.progress) }"
                        ></div>
                      </div>
                      <span class="progress-text">{{ item.progress }}%</span>
                    </div>
                  </td>
                  <td>
                    <span 
                      class="status-tag"
                      :class="getStatusClass(item.planStatus)"
                    >
                      {{ getStatusText(item.planStatus) }}
                    </span>
                  </td>
                  <td class="actions-column">
                    <button 
                      class="action-btn"
                      @click="handleViewDetails(item)"
                      title="查看详情"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button 
                      v-if="item.planStatus === 'DRAFT'"
                      class="action-btn primary"
                      @click="handleEdit(item)"
                      title="编辑"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button 
                      v-if="item.planStatus === 'DRAFT'"
                      class="action-btn success"
                      @click="handleSubmit(item)"
                      title="提交审批"
                    >
                      <i class="fas fa-paper-plane"></i>
                    </button>
                    <button 
                      v-if="item.planStatus === 'PENDING'"
                      class="action-btn primary"
                      @click="handleApprove(item)"
                      title="审批"
                    >
                      <i class="fas fa-check"></i>
                    </button>
                    <button 
                      v-if="item.planStatus === 'APPROVED'"
                      class="action-btn primary"
                      @click="handleExecute(item)"
                      title="执行"
                    >
                      <i class="fas fa-play"></i>
                    </button>
                    <button 
                      class="action-btn secondary"
                      @click="handleHistory(item)"
                      title="历史记录"
                    >
                      <i class="fas fa-history"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页控件 -->
          <div class="pagination">
            <div class="pagination-info">
              显示 {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, total) }} 条，共 {{ total }} 条
            </div>
            <div class="pagination-controls">
              <button 
                class="pagination-btn"
                @click="currentPage = 1"
                :disabled="currentPage === 1"
              >
                <i class="fas fa-angle-double-left"></i>
              </button>
              <button 
                class="pagination-btn"
                @click="currentPage--"
                :disabled="currentPage === 1"
              >
                <i class="fas fa-angle-left"></i>
              </button>
              
              <div class="pagination-pages">
                <button 
                  v-for="page in visiblePages" 
                  :key="page"
                  class="pagination-page-btn"
                  :class="{ active: currentPage === page }"
                  @click="currentPage = page"
                >
                  {{ page }}
                </button>
              </div>
              
              <button 
                class="pagination-btn"
                @click="currentPage++"
                :disabled="currentPage === totalPages"
              >
                <i class="fas fa-angle-right"></i>
              </button>
              <button 
                class="pagination-btn"
                @click="currentPage = totalPages"
                :disabled="currentPage === totalPages"
              >
                <i class="fas fa-angle-double-right"></i>
              </button>
            </div>
            
            <div class="pagination-size">
              <span>每页显示</span>
              <select v-model="pageSize" @change="handleSizeChange">
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
              <span>条</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 计划详情对话框 -->
      <div v-if="detailDialogVisible" class="modal-overlay" @click="handleCloseDetailDialog">
        <div class="modal-content large" @click.stop>
          <div class="modal-header">
            <h2>采购计划详情</h2>
            <button class="modal-close" @click="handleCloseDetailDialog">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <!-- 基本信息 -->
            <div class="info-section">
              <h3>基本信息</h3>
              <div class="info-grid">
                <div class="info-item">
                  <label>计划编号</label>
                  <span>{{ currentPlan.planCode }}</span>
                </div>
                <div class="info-item">
                  <label>计划名称</label>
                  <span>{{ currentPlan.planName }}</span>
                </div>
                <div class="info-item">
                  <label>计划类型</label>
                  <span class="plan-type" :class="getPlanTypeClass(currentPlan.planType)">
                    {{ getPlanTypeText(currentPlan.planType) }}
                  </span>
                </div>
                <div class="info-item">
                  <label>计划状态</label>
                  <span 
                    class="status-tag"
                    :class="getStatusClass(currentPlan.planStatus)"
                  >
                    {{ getStatusText(currentPlan.planStatus) }}
                  </span>
                </div>
                <div class="info-item">
                  <label>负责人</label>
                  <span>{{ currentPlan.responsiblePersonName }}</span>
                </div>
                <div class="info-item">
                  <label>创建时间</label>
                  <span>{{ formatDate(currentPlan.createTime) }}</span>
                </div>
                <div class="info-item">
                  <label>计划开始时间</label>
                  <span>{{ formatDate(currentPlan.startTime) }}</span>
                </div>
                <div class="info-item">
                  <label>计划结束时间</label>
                  <span>{{ formatDate(currentPlan.endTime) }}</span>
                </div>
                <div class="info-item">
                  <label>预算金额</label>
                  <span>{{ formatCurrency(currentPlan.totalBudget) }}</span>
                </div>
                <div class="info-item">
                  <label>已用金额</label>
                  <span>{{ formatCurrency(currentPlan.usedBudget) }}</span>
                </div>
                <div class="info-item">
                  <label>完成进度</label>
                  <div class="progress-display">
                    <div class="progress-bar large">
                      <div 
                        class="progress-fill" 
                        :style="{ width: `${currentPlan.progress}%`, backgroundColor: getProgressColor(currentPlan.progress) }"
                      ></div>
                    </div>
                    <span class="progress-text">{{ currentPlan.progress }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 计划描述 -->
            <div class="description-section">
              <h3>计划描述</h3>
              <div class="description-content">
                {{ currentPlan.description || '暂无描述' }}
              </div>
            </div>

            <!-- 采购项目 -->
            <div class="items-section">
              <h3>采购项目</h3>
              <div class="items-table">
                <table class="items-data-table">
                  <thead>
                    <tr>
                      <th>项目名称</th>
                      <th>规格型号</th>
                      <th>数量</th>
                      <th>单位</th>
                      <th>预算单价</th>
                      <th>预算总价</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in currentPlan.items" :key="index">
                      <td>{{ item.itemName }}</td>
                      <td>{{ item.specification }}</td>
                      <td>{{ item.quantity }}</td>
                      <td>{{ item.unit }}</td>
                      <td class="text-right">{{ formatCurrency(item.budgetPrice) }}</td>
                      <td class="text-right">{{ formatCurrency(item.budgetTotal) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 审批记录 -->
            <div v-if="currentPlan.approvalHistory" class="approval-section">
              <h3>审批记录</h3>
              <div class="approval-timeline">
                <div 
                  v-for="(record, index) in currentPlan.approvalHistory" 
                  :key="index"
                  class="timeline-item"
                >
                  <div class="timeline-dot" :class="getStatusClass(record.status)"></div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <span class="timeline-title">{{ record.action }}</span>
                      <span class="timeline-time">{{ record.actionTime }}</span>
                    </div>
                    <div class="timeline-description">{{ record.comment || '无备注' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn secondary" @click="handleCloseDetailDialog">关闭</button>
            <button 
              v-if="currentPlan.planStatus === 'DRAFT'"
              class="btn primary" 
              @click="handleEdit(currentPlan)"
            >
              编辑计划
            </button>
            <button 
              v-if="currentPlan.planStatus === 'DRAFT'"
              class="btn success" 
              @click="handleSubmit(currentPlan)"
            >
              提交审批
            </button>
            <button 
              v-if="currentPlan.planStatus === 'PENDING'"
              class="btn primary" 
              @click="handleApprove(currentPlan)"
            >
              审批通过
            </button>
            <button 
              v-if="currentPlan.planStatus === 'PENDING'"
              class="btn secondary" 
              @click="handleReject(currentPlan)"
            >
              审批拒绝
            </button>
          </div>
        </div>
      </div>

      <!-- 编辑计划对话框 -->
      <div v-if="editDialogVisible" class="modal-overlay" @click="handleCloseEditDialog">
        <div class="modal-content large" @click.stop>
          <div class="modal-header">
            <h2>{{ editForm.id ? '编辑采购计划' : '新建采购计划' }}</h2>
            <button class="modal-close" @click="handleCloseEditDialog">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="edit-form">
              <div class="form-section">
                <h3>基本信息</h3>
                <div class="form-grid">
                  <div class="form-item">
                    <label>计划名称 *</label>
                    <input 
                      v-model="editForm.planName"
                      type="text"
                      class="form-input"
                      placeholder="请输入计划名称"
                    />
                  </div>
                  <div class="form-item">
                    <label>计划类型 *</label>
                    <select v-model="editForm.planType" class="form-input">
                      <option value="">请选择计划类型</option>
                      <option value="REGULAR">常规采购</option>
                      <option value="EMERGENCY">紧急采购</option>
                      <option value="PROJECT">项目采购</option>
                      <option value="CONTRACT">合同采购</option>
                    </select>
                  </div>
                  <div class="form-item">
                    <label>负责人 *</label>
                    <select v-model="editForm.responsiblePersonId" class="form-input">
                      <option value="">请选择负责人</option>
                      <option 
                        v-for="person in responsiblePersons" 
                        :key="person.id"
                        :value="person.id"
                      >
                        {{ person.name }}
                      </option>
                    </select>
                  </div>
                  <div class="form-item">
                    <label>预算金额</label>
                    <input 
                      v-model.number="editForm.totalBudget"
                      type="number"
                      min="0"
                      step="0.01"
                      class="form-input"
                      placeholder="请输入预算金额"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-item full-width">
                    <label>计划描述</label>
                    <textarea
                      v-model="editForm.description"
                      class="form-textarea"
                      rows="3"
                      placeholder="请输入计划描述"
                    ></textarea>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-item">
                    <label>计划开始时间</label>
                    <input 
                      v-model="editForm.startTime"
                      type="date"
                      class="form-input"
                    />
                  </div>
                  <div class="form-item">
                    <label>计划结束时间</label>
                    <input 
                      v-model="editForm.endTime"
                      type="date"
                      class="form-input"
                    />
                  </div>
                </div>
              </div>

              <div class="form-section">
                <div class="section-header">
                  <h3>采购项目</h3>
                  <button 
                    class="btn secondary small"
                    @click="addPlanItem"
                  >
                    <i class="fas fa-plus"></i>
                    <span>添加项目</span>
                  </button>
                </div>

                <div class="items-form">
                  <div 
                    v-for="(item, index) in editForm.items" 
                    :key="index"
                    class="item-form-row"
                  >
                    <div class="form-item">
                      <label>项目名称</label>
                      <input 
                        v-model="item.itemName"
                        type="text"
                        class="form-input small"
                        placeholder="项目名称"
                      />
                    </div>
                    <div class="form-item">
                      <label>规格型号</label>
                      <input 
                        v-model="item.specification"
                        type="text"
                        class="form-input small"
                        placeholder="规格型号"
                      />
                    </div>
                    <div class="form-item">
                      <label>数量</label>
                      <input 
                        v-model.number="item.quantity"
                        type="number"
                        min="1"
                        class="form-input small"
                        placeholder="数量"
                      />
                    </div>
                    <div class="form-item">
                      <label>单位</label>
                      <input 
                        v-model="item.unit"
                        type="text"
                        class="form-input small"
                        placeholder="单位"
                      />
                    </div>
                    <div class="form-item">
                      <label>预算单价</label>
                      <input 
                        v-model.number="item.budgetPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        class="form-input small"
                        placeholder="预算单价"
                      />
                    </div>
                    <div class="form-item">
                      <label>预算总价</label>
                      <input 
                        :value="formatCurrency(item.budgetTotal)"
                        type="text"
                        class="form-input small"
                        readonly
                      />
                    </div>
                    <button 
                      class="btn danger small"
                      @click="removePlanItem(index)"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn secondary" @click="handleCloseEditDialog">取消</button>
            <button class="btn primary" @click="handleSavePlan" :disabled="saving">
              <i v-if="saving" class="fas fa-spinner fa-spin"></i>
              <span>{{ saving ? '保存中...' : '保存计划' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </ResponsiveLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import ResponsiveLayout from '@/components/common/layout/ResponsiveLayout.vue'
import HeaderNavigation from '@/components/common/layout/HeaderNavigation.vue'
import BreadcrumbNav from '@/components/common/layout/BreadcrumbNav.vue'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const selectedRows = ref([])
const sortField = ref('')
const sortOrder = ref('')
const planList = ref([])
const responsiblePersons = ref([])

// 搜索表单
const searchForm = reactive({
  planName: '',
  planCode: '',
  planStatus: '',
  planType: '',
  responsiblePerson: ''
})

const startDate = ref('')
const endDate = ref('')

// 统计数据
const stats = reactive({
  totalPlans: 0,
  plansGrowth: 0.15,
  completedPlans: 0,
  completedGrowth: 0.08,
  executingPlans: 0,
  executingGrowth: 0.12,
  totalBudget: 0,
  budgetGrowth: 0.06
})

// 对话框状态
const detailDialogVisible = ref(false)
const editDialogVisible = ref(false)

// 当前选中的数据
const currentPlan = ref({})
const editForm = reactive({
  id: null,
  planName: '',
  planType: '',
  responsiblePersonId: '',
  totalBudget: 0,
  description: '',
  startTime: '',
  endTime: '',
  items: [
    {
      itemName: '',
      specification: '',
      quantity: 1,
      unit: '',
      budgetPrice: 0,
      budgetTotal: 0
    }
  ]
})

// 面包屑导航
const breadcrumbItems = [
  { label: '采购管理', path: '/purchase' },
  { label: '采购计划', path: '/purchase/procurement-plan' }
]

// 计算属性
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const paginatedData = computed(() => {
  let filtered = [...planList.value]  
  // 应用搜索筛选
  if (searchForm.planName) {
    filtered = filtered.filter(item => 
      item.planName.toLowerCase().includes(searchForm.planName.toLowerCase())
    )
  }
  if (searchForm.planCode) {
    filtered = filtered.filter(item => 
      item.planCode.toLowerCase().includes(searchForm.planCode.toLowerCase())
    )
  }
  if (searchForm.planStatus) {
    filtered = filtered.filter(item => item.planStatus === searchForm.planStatus)
  }
  if (searchForm.planType) {
    filtered = filtered.filter(item => item.planType === searchForm.planType)
  }
  if (searchForm.responsiblePerson) {
    filtered = filtered.filter(item => item.responsiblePersonId == searchForm.responsiblePerson)
  }
  if (startDate.value) {
    filtered = filtered.filter(item => new Date(item.startTime) >= new Date(startDate.value))
  }
  if (endDate.value) {
    filtered = filtered.filter(item => new Date(item.endTime) <= new Date(endDate.value))
  }
  
  // 应用排序
  if (sortField.value) {
    filtered.sort((a, b) => {
      const aVal = a[sortField.value]
      const bVal = b[sortField.value]
      const order = sortOrder.value === 'asc' ? 1 : -1
      return aVal > bVal ? order : -order
    })
  }
  
  total.value = filtered.length
  
  // 应用分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

const isAllSelected = computed(() => {
  return paginatedData.value.length > 0 && 
    paginatedData.value.every(item => selectedRows.value.includes(item.id))
})

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// 监听项目变化，计算总价
watch(() => editForm.items, (newItems) => {
  newItems.forEach(item => {
    item.budgetTotal = item.quantity * item.budgetPrice
  })
}, { deep: true })

// 方法
const formatNumber = (value) => {
  return value.toLocaleString()
}

const formatCurrency = (value) => {
  if (!value) return '¥0.00'
  return `¥${Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

const formatPercent = (value) => {
  if (!value) return '0%'
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${(value * 100).toFixed(1)}%`
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const getChangeClass = (value) => {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

const getChangeIcon = (value) => {
  if (value > 0) return 'fas fa-arrow-up'
  if (value < 0) return 'fas fa-arrow-down'
  return 'fas fa-minus'
}

const getPlanTypeClass = (type) => {
  const classMap = {
    REGULAR: 'type-regular',
    EMERGENCY: 'type-emergency',
    PROJECT: 'type-project',
    CONTRACT: 'type-contract'
  }
  return classMap[type] || 'type-regular'
}

const getPlanTypeText = (type) => {
  const textMap = {
    REGULAR: '常规采购',
    EMERGENCY: '紧急采购',
    PROJECT: '项目采购',
    CONTRACT: '合同采购'
  }
  return textMap[type] || type
}

const getStatusClass = (status) => {
  const classMap = {
    DRAFT: 'status-draft',
    PENDING: 'status-pending',
    APPROVED: 'status-approved',
    REJECTED: 'status-rejected',
    EXECUTING: 'status-executing',
    COMPLETED: 'status-completed',
    CANCELLED: 'status-cancelled'
  }
  return classMap[status] || 'status-default'
}

const getStatusText = (status) => {
  const textMap = {
    DRAFT: '草稿',
    PENDING: '待审批',
    APPROVED: '已审批',
    REJECTED: '已拒绝',
    EXECUTING: '执行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  }
  return textMap[status] || status
}

const getProgressColor = (value) => {
  if (value >= 90) return '#48bb78'
  if (value >= 70) return '#ed8936'
  if (value >= 50) return '#4299e1'
  return '#e53e3e'
}

const getSortClass = (field) => {
  if (sortField.value !== field) return ''
  return sortOrder.value === 'asc' ? 'sort-asc' : 'sort-desc'
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleReset = () => {
  Object.assign(searchForm, {
    planName: '',
    planCode: '',
    planStatus: '',
    planType: '',
    responsiblePerson: ''
  })
  startDate.value = ''
  endDate.value = ''
  handleSearch()
}

const handleSort = (field) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
}

const handleSizeChange = () => {
  currentPage.value = 1
}

const handleSelectAll = (event) => {
  if (event.target.checked) {
    selectedRows.value = paginatedData.value.map(item => item.id)
  } else {
    selectedRows.value = []
  }
}

const handleRowSelect = (id) => {
  const index = selectedRows.value.indexOf(id)
  if (index > -1) {
    selectedRows.value.splice(index, 1)
  } else {
    selectedRows.value.push(id)
  }
}

const handleRefresh = () => {
  loadPlanList()
}

const handleExport = () => {
  // 导出逻辑
}

const handleCreatePlan = () => {
  Object.assign(editForm, {
    id: null,
    planName: '',
    planType: '',
    responsiblePersonId: '',
    totalBudget: 0,
    description: '',
    startTime: '',
    endTime: '',
    items: [
      {
        itemName: '',
        specification: '',
        quantity: 1,
        unit: '',
        budgetPrice: 0,
        budgetTotal: 0
      }
    ]
  })
  editDialogVisible.value = true
}

const handleBatchApprove = () => {
  // 批量审批逻辑
}

const handleBatchCancel = () => {
  // 批量取消逻辑
}

const handleViewDetails = (item) => {
  currentPlan.value = { ...item }
  detailDialogVisible.value = true
}

const handleEdit = (item) => {
  Object.assign(editForm, {
    id: item.id,
    planName: item.planName,
    planType: item.planType,
    responsiblePersonId: item.responsiblePersonId,
    totalBudget: item.totalBudget,
    description: item.description,
    startTime: item.startTime,
    endTime: item.endTime,
    items: item.items || []
  })
  detailDialogVisible.value = false
  editDialogVisible.value = true
}

const handleSubmit = (item) => {
  // 提交审批逻辑
  setTimeout(() => {
    alert('计划已提交审批')
    loadPlanList()
  }, 1000)
}

const handleApprove = (item) => {
  // 审批通过逻辑
  setTimeout(() => {
    alert('计划已审批通过')
    loadPlanList()
  }, 1000)
}

const handleReject = (item) => {
  // 审批拒绝逻辑
  setTimeout(() => {
    alert('计划已审批拒绝')
    loadPlanList()
  }, 1000)
}

const handleExecute = (item) => {
  // 执行计划逻辑
  setTimeout(() => {
    alert('计划已开始执行')
    loadPlanList()
  }, 1000)
}

const handleHistory = (item) => {
  // 历史记录逻辑
}

const handleCloseDetailDialog = () => {
  detailDialogVisible.value = false
  currentPlan.value = {}
}

const addPlanItem = () => {
  editForm.items.push({
    itemName: '',
    specification: '',
    quantity: 1,
    unit: '',
    budgetPrice: 0,
    budgetTotal: 0
  })
}

const removePlanItem = (index) => {
  editForm.items.splice(index, 1)
}

const handleSavePlan = () => {
  if (!editForm.planName) {
    alert('请输入计划名称')
    return
  }
  if (!editForm.planType) {
    alert('请选择计划类型')
    return
  }
  if (!editForm.responsiblePersonId) {
    alert('请选择负责人')
    return
  }
  
  saving.value = true
  
  setTimeout(() => {
    alert(editForm.id ? '计划更新成功！' : '计划创建成功！')
    editDialogVisible.value = false
    saving.value = false
    loadPlanList()
  }, 1500)
}

const handleCloseEditDialog = () => {
  editDialogVisible.value = false
  Object.assign(editForm, {
    id: null,
    planName: '',
    planType: '',
    responsiblePersonId: '',
    totalBudget: 0,
    description: '',
    startTime: '',
    endTime: '',
    items: [
      {
        itemName: '',
        specification: '',
        quantity: 1,
        unit: '',
        budgetPrice: 0,
        budgetTotal: 0
      }
    ]
  })
}

const loadPlanList = () => {
  loading.value = true
  
  setTimeout(() => {
    const data = generateMockData()
    planList.value = data
    calculateStats(data)
    loading.value = false
  }, 1000)
}

const generateMockData = () => {
  const statuses = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'EXECUTING', 'COMPLETED', 'CANCELLED']
  const types = ['REGULAR', 'EMERGENCY', 'PROJECT', 'CONTRACT']
  const data = []
  
  for (let i = 1; i <= 100; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const type = types[Math.floor(Math.random() * types.length)]
    const progress = status === 'COMPLETED' ? 100 : 
                   status === 'EXECUTING' ? Math.floor(Math.random() * 90) + 10 :
                   status === 'APPROVED' ? Math.floor(Math.random() * 30) : 0
    
    const usedBudget = progress / 100 * (Math.random() * 500000 + 100000)
    
    data.push({
      id: i,
      planCode: `PLAN${new Date().getFullYear()}${String(i).padStart(4, '0')}`,
      planName: `采购计划${i}`,
      planType: type,
      planStatus: status,
      responsiblePersonId: Math.floor(Math.random() * 5) + 1,
      responsiblePersonName: `负责人${Math.floor(Math.random() * 5) + 1}`,
      startTime: formatDate(new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)),
      endTime: formatDate(new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000)),
      totalBudget: Math.random() * 500000 + 100000,
      usedBudget: usedBudget,
      progress: progress,
      createTime: formatDate(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)),
      description: `这是采购计划${i}的描述信息，包含了采购目标、采购范围和实施计划等内容。`,
      items: generateMockItems(),
      approvalHistory: generateMockHistory()
    })
  }
  return data
}

const generateMockItems = () => {
  const items = []
  const itemCount = Math.floor(Math.random() * 5) + 1
  
  for (let i = 1; i <= itemCount; i++) {
    const quantity = Math.floor(Math.random() * 100) + 1
    const budgetPrice = Math.random() * 10000 + 100
    
    items.push({
      itemName: `采购项目${i}`,
      specification: `规格型号${i}`,
      quantity: quantity,
      unit: ['个', '件', '箱', '套'][Math.floor(Math.random() * 4)],
      budgetPrice: budgetPrice,
      budgetTotal: quantity * budgetPrice
    })
  }
  
  return items
}

const generateMockHistory = () => {
  const history = []
  
  history.push({
    action: '创建计划',
    actionTime: formatDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    comment: '计划创建成功，等待提交审批'
  })
  
  return history
}

const calculateStats = (data) => {
  stats.totalPlans = data.length
  stats.completedPlans = data.filter(item => item.planStatus === 'COMPLETED').length
  stats.executingPlans = data.filter(item => item.planStatus === 'EXECUTING').length
  stats.totalBudget = data.reduce((sum, item) => sum + item.totalBudget, 0)
}

// 生命周期
onMounted(() => {
  responsiblePersons.value = [
    { id: 1, name: '张三' },
    { id: 2, name: '李四' },
    { id: 3, name: '王五' },
    { id: 4, name: '赵六' },
    { id: 5, name: '陈七' }
  ]
  
  loadPlanList()
})
</script>

<style scoped>
.procurement-plan {
  padding: 2rem;
  font-family: 'Space Mono', monospace;
}

/* 筛选区域 */
.filter-section {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(237, 137, 54, 0.1);
}

.filter-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  color: #2d3748;
  font-size: 0.875rem;
}

.filter-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid rgba(203, 213, 224, 0.8);
  border-radius: 8px;
  font-size: 0.875rem;
  background: rgba(247, 250, 252, 0.8);
  transition: all 0.2s;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: rgba(237, 137, 54, 0.5);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 3px rgba(237, 137, 54, 0.1);
}

.date-range-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-separator {
  color: #a0aec0;
  font-size: 0.875rem;
}

.filter-actions {
  display: flex;
  gap: 0.75rem;
}

.search-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Space Mono', monospace;
}

.search-btn.primary {
  background: #ed8936;
  color: white;
}

.search-btn.primary:hover:not(:disabled) {
  background: #dd7724;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(237, 137, 54, 0.3);
}

.search-btn.secondary {
  background: rgba(255, 255, 255, 0.8);
  color: #4a5568;
  border: 1px solid rgba(203, 213, 224, 0.8);
}

.search-btn.secondary:hover {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
  border-color: rgba(237, 137, 54, 0.3);
}

/* 统计区域 */
.stats-section {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid rgba(237, 137, 54, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(45, 55, 72, 0.15);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.stat-card.primary .stat-icon {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.stat-card.success .stat-icon {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
}

.stat-card.warning .stat-icon {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.stat-card.info .stat-icon {
  background: rgba(66, 153, 225, 0.1);
  color: #4299e1;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-family: 'Playfair Display', serif;
  font-size: 1.875rem;
  font-weight: 700;
  color: #2d3748;
  line-height: 1.2;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #718096;
  margin-bottom: 0.5rem;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.stat-change.positive {
  color: #48bb78;
}

.stat-change.negative {
  color: #e53e3e;
}

.stat-change.neutral {
  color: #a0aec0;
}

/* 表格区域 */
.table-section {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(237, 137, 54, 0.1);
}

.table-container {
  width: 100%;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.table-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
}

.table-actions {
  display: flex;
  gap: 0.75rem;
}

.table-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(237, 137, 54, 0.3);
  background: rgba(237, 137, 54, 0.05);
  color: #ed8936;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.table-action-btn:hover:not(:disabled) {
  background: rgba(237, 137, 54, 0.1);
}

.table-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.table-wrapper {
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid rgba(237, 137, 54, 0.1);
}

.data-table th {
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  color: #2d3748;
  background: rgba(247, 250, 252, 0.8);
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.data-table th.sortable:hover {
  background: rgba(237, 137, 54, 0.05);
}

.checkbox-column {
  width: 40px;
}

.plan-code {
  font-family: 'Space Mono', monospace;
  font-weight: 600;
  color: #4a5568;
}

.plan-name {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-type {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.type-regular {
  background: rgba(66, 153, 225, 0.1);
  color: #4299e1;
}

.type-emergency {
  background: rgba(229, 62, 62, 0.1);
  color: #e53e3e;
}

.type-project {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
}

.type-contract {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.text-right {
  text-align: right;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(203, 213, 224, 0.3);
  border-radius: 3px;
  overflow: hidden;
  min-width: 80px;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #4a5568;
  min-width: 40px;
}

.status-tag {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-draft {
  background: rgba(203, 213, 224, 0.3);
  color: #718096;
}

.status-pending {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.status-approved {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
}

.status-rejected {
  background: rgba(229, 62, 62, 0.1);
  color: #e53e3e;
}

.status-executing {
  background: rgba(66, 153, 225, 0.1);
  color: #4299e1;
}

.status-completed {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
}

.status-cancelled {
  background: rgba(203, 213, 224, 0.3);
  color: #718096;
}

.actions-column {
  width: 180px;
}

.action-btn {
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  padding: 0.25rem;
  margin: 0 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-btn:hover {
  color: #ed8936;
  background: rgba(237, 137, 54, 0.1);
}

.action-btn.primary {
  color: #ed8936;
}

.action-btn.success {
  color: #48bb78;
}

.action-btn.primary:hover {
  background: rgba(237, 137, 54, 0.2);
}

.action-btn.success:hover {
  background: rgba(72, 187, 120, 0.2);
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.pagination-info {
  color: #718096;
  font-size: 0.875rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination-btn {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(203, 213, 224, 0.8);
  color: #4a5568;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
  border-color: rgba(237, 137, 54, 0.3);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-pages {
  display: flex;
  gap: 0.25rem;
}

.pagination-page-btn {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(203, 213, 224, 0.8);
  color: #4a5568;
  min-width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.pagination-page-btn:hover {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
  border-color: rgba(237, 137, 54, 0.3);
}

.pagination-page-btn.active {
  background: #ed8936;
  color: white;
  border-color: #ed8936;
}

.pagination-size {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #718096;
  font-size: 0.875rem;
}

.pagination-size select {
  padding: 0.25rem 0.5rem;
  border: 1px solid rgba(203, 213, 224, 0.8);
  border-radius: 4px;
  background: white;
}

/* 对话框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(45, 55, 72, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(45, 55, 72, 0.2);
  border: 1px solid rgba(237, 137, 54, 0.2);
}

.modal-content.large {
  max-width: 1200px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(237, 137, 54, 0.1);
}

.modal-header h2 {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.modal-close:hover {
  color: #e53e3e;
  background: rgba(229, 62, 62, 0.1);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(237, 137, 54, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* 详情对话框内容 */
.info-section,
.description-section,
.items-section,
.approval-section {
  margin-bottom: 2rem;
}

.info-section h3,
.description-section h3,
.items-section h3,
.approval-section h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid rgba(237, 137, 54, 0.2);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-weight: 600;
  color: #4a5568;
  font-size: 0.875rem;
}

.info-item span {
  color: #2d3748;
  font-size: 0.875rem;
}

.progress-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar.large {
  flex: 1;
  height: 12px;
  background: rgba(203, 213, 224, 0.3);
  border-radius: 6px;
  overflow: hidden;
  min-width: 120px;
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4a5568;
  min-width: 50px;
}

.description-content {
  background: rgba(247, 250, 252, 0.8);
  border-radius: 8px;
  padding: 1rem;
  line-height: 1.6;
  color: #2d3748;
  border: 1px solid rgba(237, 137, 54, 0.1);
}

.items-table {
  overflow-x: auto;
  border: 1px solid rgba(237, 137, 54, 0.1);
  border-radius: 8px;
}

.items-data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.items-data-table th,
.items-data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid rgba(237, 137, 54, 0.1);
}

.items-data-table th {
  font-weight: 600;
  color: #2d3748;
  background: rgba(247, 250, 252, 0.8);
}

.approval-timeline {
  position: relative;
  padding-left: 2rem;
}

.timeline-item {
  position: relative;
  padding-bottom: 2rem;
}

.timeline-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: -1.5rem;
  top: 2rem;
  bottom: 0;
  width: 2px;
  background: rgba(203, 213, 224, 0.5);
}

.timeline-dot {
  position: absolute;
  left: -2rem;
  top: 0.5rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.timeline-content {
  background: rgba(247, 250, 252, 0.8);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid rgba(237, 137, 54, 0.1);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.timeline-title {
  font-weight: 600;
  color: #2d3748;
}

.timeline-time {
  color: #a0aec0;
  font-size: 0.75rem;
}

.timeline-description {
  color: #4a5568;
  line-height: 1.4;
}

/* 编辑表单 */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  border: 1px solid rgba(237, 137, 54, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  background: rgba(247, 250, 252, 0.5);
}

.form-section h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-item.full-width {
  flex: 1;
}

.form-item label {
  font-weight: 600;
  color: #2d3748;
  font-size: 0.875rem;
}

.form-input,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid rgba(203, 213, 224, 0.8);
  border-radius: 8px;
  font-size: 0.875rem;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: rgba(237, 137, 54, 0.5);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 3px rgba(237, 137, 54, 0.1);
}

.form-input.small {
  padding: 0.5rem;
  font-size: 0.8125rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.items-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item-form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)) 120px;
  gap: 0.75rem;
  align-items: end;
  padding: 1rem;
  background: rgba(247, 250, 252, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(237, 137, 54, 0.05);
}

/* 按钮样式 */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Space Mono', monospace;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn.primary {
  background: #ed8936;
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: #dd7724;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(237, 137, 54, 0.3);
}

.btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn.secondary {
  background: rgba(255, 255, 255, 0.8);
  color: #4a5568;
  border: 1px solid rgba(203, 213, 224, 0.8);
}

.btn.secondary:hover {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
  border-color: rgba(237, 137, 54, 0.3);
}

.btn.danger {
  background: rgba(229, 62, 62, 0.1);
  color: #e53e3e;
  border: 1px solid rgba(229, 62, 62, 0.3);
}

.btn.danger:hover {
  background: rgba(229, 62, 62, 0.2);
  color: #e53e3e;
}

.btn.small {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
}

/* 头部操作按钮 */
.header-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Space Mono', monospace;
}

.header-action-btn.primary {
  background: #ed8936;
  color: white;
}

.header-action-btn.primary:hover:not(:disabled) {
  background: #dd7724;
}

.header-action-btn.secondary {
  background: rgba(255, 255, 255, 0.8);
  color: #4a5568;
  border: 1px solid rgba(203, 213, 224, 0.8);
}

.header-action-btn.secondary:hover {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
  border-color: rgba(237, 137, 54, 0.3);
}

.header-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .procurement-plan {
    padding: 1rem;
  }
  
  .filter-row {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .filter-row {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .pagination {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .modal-content.large {
    max-width: 95%;
    margin: 1rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    flex-direction: column;
  }
  
  .item-form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .data-table {
    font-size: 0.75rem;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.5rem;
  }
  
  .actions-column {
    width: 120px;
  }
  
  .action-btn {
    padding: 0.125rem;
    font-size: 0.75rem;
  }
  
  .modal-content {
    max-width: 95%;
    margin: 1rem;
  }
}
</style>