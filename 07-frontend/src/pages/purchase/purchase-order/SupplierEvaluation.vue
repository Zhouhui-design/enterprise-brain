<template>
  <ResponsiveLayout>
    <template #header>
      <HeaderNavigation
        title="供应商评估管理"
        :show-search="true"
        :show-notifications="true"
        @toggle-sidebar="() => {}"
      >
        <template #actions>
          <button 
            class="header-action-btn primary"
            @click="handleCreateEvaluation"
          >
            <i class="fas fa-plus"></i>
            <span>新建评估</span>
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
            <span>导出报告</span>
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
    <div class="supplier-evaluation">
      <!-- 搜索和筛选区域 -->
      <div class="filter-section">
        <div class="filter-container">
          <div class="filter-row">
            <div class="filter-item">
              <label class="filter-label">供应商名称</label>
              <input 
                v-model="searchForm.supplierName" 
                placeholder="请输入供应商名称"
                class="filter-input"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="filter-item">
              <label class="filter-label">供应商编码</label>
              <input 
                v-model="searchForm.supplierCode" 
                placeholder="请输入供应商编码"
                class="filter-input"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="filter-item">
              <label class="filter-label">供应商类型</label>
              <select v-model="searchForm.supplierType" class="filter-select">
                <option value="">全部类型</option>
                <option value="MANUFACTURER">制造商</option>
                <option value="DISTRIBUTOR">经销商</option>
                <option value="SERVICE_PROVIDER">服务商</option>
                <option value="MATERIAL">原材料供应商</option>
              </select>
            </div>
            <div class="filter-item">
              <label class="filter-label">评估等级</label>
              <select v-model="searchForm.evaluationGrade" class="filter-select">
                <option value="">全部等级</option>
                <option value="A">A级（优秀）</option>
                <option value="B">B级（良好）</option>
                <option value="C">C级（合格）</option>
                <option value="D">D级（需改进）</option>
                <option value="E">E级（不合格）</option>
              </select>
            </div>
          </div>
          
          <div class="filter-row">
            <div class="filter-item">
              <label class="filter-label">评估时间范围</label>
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

      <!-- 统计卡片 -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card primary">
            <div class="stat-icon">
              <i class="fas fa-building"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(stats.totalSuppliers) }}</div>
              <div class="stat-label">总供应商数</div>
              <div class="stat-change" :class="getChangeClass(stats.supplierGrowth)">
                <i :class="getChangeIcon(stats.supplierGrowth)"></i>
                <span>{{ formatPercent(stats.supplierGrowth) }}</span>
              </div>
            </div>
          </div>
          
          <div class="stat-card success">
            <div class="stat-icon">
              <i class="fas fa-star"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(stats.excellentSuppliers) }}</div>
              <div class="stat-label">A级供应商</div>
              <div class="stat-change" :class="getChangeClass(stats.excellentGrowth)">
                <i :class="getChangeIcon(stats.excellentGrowth)"></i>
                <span>{{ formatPercent(stats.excellentGrowth) }}</span>
              </div>
            </div>
          </div>
          
          <div class="stat-card warning">
            <div class="stat-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(stats.pendingEvaluations) }}</div>
              <div class="stat-label">待评估供应商</div>
              <div class="stat-change" :class="getChangeClass(stats.pendingGrowth)">
                <i :class="getChangeIcon(stats.pendingGrowth)"></i>
                <span>{{ formatPercent(stats.pendingGrowth) }}</span>
              </div>
            </div>
          </div>
          
          <div class="stat-card info">
            <div class="stat-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.avgScore.toFixed(1) }}</div>
              <div class="stat-label">平均评分</div>
              <div class="stat-change" :class="getChangeClass(stats.scoreChange)">
                <i :class="getChangeIcon(stats.scoreChange)"></i>
                <span>{{ formatScoreChange(stats.scoreChange) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 评估列表 -->
      <div class="table-section">
        <div class="table-container">
          <div class="table-header">
            <h3 class="table-title">供应商评估列表</h3>
            <div class="table-actions">
              <button 
                class="table-action-btn"
                @click="handleBatchEvaluation"
                :disabled="selectedRows.length === 0"
              >
                <i class="fas fa-clipboard-check"></i>
                <span>批量评估</span>
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
                  <th class="sortable" @click="handleSort('supplierCode')">
                    供应商编码
                    <i class="fas fa-sort" :class="getSortClass('supplierCode')"></i>
                  </th>
                  <th class="sortable" @click="handleSort('supplierName')">
                    供应商名称
                    <i class="fas fa-sort" :class="getSortClass('supplierName')"></i>
                  </th>
                  <th>供应商类型</th>
                  <th>联系人</th>
                  <th class="sortable" @click="handleSort('totalScore')">
                    综合评分
                    <i class="fas fa-sort" :class="getSortClass('totalScore')"></i>
                  </th>
                  <th class="sortable" @click="handleSort('qualityScore')">
                    质量评分
                    <i class="fas fa-sort" :class="getSortClass('qualityScore')"></i>
                  </th>
                  <th class="sortable" @click="handleSort('deliveryScore')">
                    交付评分
                    <i class="fas fa-sort" :class="getSortClass('deliveryScore')"></i>
                  </th>
                  <th class="sortable" @click="handleSort('serviceScore')">
                    服务评分
                    <i class="fas fa-sort" :class="getSortClass('serviceScore')"></i>
                  </th>
                  <th class="sortable" @click="handleSort('priceScore')">
                    价格评分
                    <i class="fas fa-sort" :class="getSortClass('priceScore')"></i>
                  </th>
                  <th>评估等级</th>
                  <th class="sortable" @click="handleSort('lastEvaluationDate')">
                    最后评估时间
                    <i class="fas fa-sort" :class="getSortClass('lastEvaluationDate')"></i>
                  </th>
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
                  <td class="supplier-code">{{ item.supplierCode }}</td>
                  <td class="supplier-name">
                    <div class="supplier-info">
                      <div class="supplier-name-text">{{ item.supplierName }}</div>
                      <div class="supplier-status" :class="item.status">
                        {{ getStatusText(item.status) }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="supplier-type">{{ getSupplierTypeText(item.supplierType) }}</span>
                  </td>
                  <td>{{ item.contactPerson }}</td>
                  <td class="score-cell">
                    <div class="score-display">
                      <div class="score-circle" :class="getScoreClass(item.totalScore)">
                        {{ item.totalScore.toFixed(1) }}
                      </div>
                      <div class="score-bar">
                        <div 
                          class="score-fill" 
                          :style="{ width: `${item.totalScore}%`, backgroundColor: getScoreColor(item.totalScore) }"
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td class="score-text">{{ item.qualityScore.toFixed(1) }}</td>
                  <td class="score-text">{{ item.deliveryScore.toFixed(1) }}</td>
                  <td class="score-text">{{ item.serviceScore.toFixed(1) }}</td>
                  <td class="score-text">{{ item.priceScore.toFixed(1) }}</td>
                  <td>
                    <span 
                      class="grade-tag"
                      :class="getGradeClass(item.evaluationGrade)"
                    >
                      {{ item.evaluationGrade }}
                    </span>
                  </td>
                  <td>{{ formatDate(item.lastEvaluationDate) }}</td>
                  <td class="actions-column">
                    <button 
                      class="action-btn"
                      @click="handleViewDetails(item)"
                      title="查看详情"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button 
                      class="action-btn primary"
                      @click="handleEvaluate(item)"
                      title="评估"
                    >
                      <i class="fas fa-clipboard-check"></i>
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

      <!-- 评估详情对话框 -->
      <div v-if="detailDialogVisible" class="modal-overlay" @click="handleCloseDetailDialog">
        <div class="modal-content large" @click.stop>
          <div class="modal-header">
            <h2>供应商评估详情</h2>
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
                  <label>供应商编码</label>
                  <span>{{ currentSupplier.supplierCode }}</span>
                </div>
                <div class="info-item">
                  <label>供应商名称</label>
                  <span>{{ currentSupplier.supplierName }}</span>
                </div>
                <div class="info-item">
                  <label>供应商类型</label>
                  <span>{{ getSupplierTypeText(currentSupplier.supplierType) }}</span>
                </div>
                <div class="info-item">
                  <label>联系人</label>
                  <span>{{ currentSupplier.contactPerson }}</span>
                </div>
                <div class="info-item">
                  <label>联系电话</label>
                  <span>{{ currentSupplier.contactPhone }}</span>
                </div>
                <div class="info-item">
                  <label>邮箱地址</label>
                  <span>{{ currentSupplier.contactEmail }}</span>
                </div>
              </div>
            </div>

            <!-- 评估指标 -->
            <div class="evaluation-section">
              <h3>评估指标</h3>
              <div class="score-grid">
                <div class="score-card-item">
                  <div class="score-label">质量评分</div>
                  <div class="score-value" :class="getScoreClass(currentSupplier.qualityScore)">
                    {{ currentSupplier.qualityScore.toFixed(1) }}
                  </div>
                  <div class="score-progress">
                    <div 
                      class="score-progress-fill" 
                      :style="{ width: `${currentSupplier.qualityScore}%`, backgroundColor: getScoreColor(currentSupplier.qualityScore) }"
                    ></div>
                  </div>
                </div>
                
                <div class="score-card-item">
                  <div class="score-label">交付评分</div>
                  <div class="score-value" :class="getScoreClass(currentSupplier.deliveryScore)">
                    {{ currentSupplier.deliveryScore.toFixed(1) }}
                  </div>
                  <div class="score-progress">
                    <div 
                      class="score-progress-fill" 
                      :style="{ width: `${currentSupplier.deliveryScore}%`, backgroundColor: getScoreColor(currentSupplier.deliveryScore) }"
                    ></div>
                  </div>
                </div>
                
                <div class="score-card-item">
                  <div class="score-label">服务评分</div>
                  <div class="score-value" :class="getScoreClass(currentSupplier.serviceScore)">
                    {{ currentSupplier.serviceScore.toFixed(1) }}
                  </div>
                  <div class="score-progress">
                    <div 
                      class="score-progress-fill" 
                      :style="{ width: `${currentSupplier.serviceScore}%`, backgroundColor: getScoreColor(currentSupplier.serviceScore) }"
                    ></div>
                  </div>
                </div>
                
                <div class="score-card-item">
                  <div class="score-label">价格评分</div>
                  <div class="score-value" :class="getScoreClass(currentSupplier.priceScore)">
                    {{ currentSupplier.priceScore.toFixed(1) }}
                  </div>
                  <div class="score-progress">
                    <div 
                      class="score-progress-fill" 
                      :style="{ width: `${currentSupplier.priceScore}%`, backgroundColor: getScoreColor(currentSupplier.priceScore) }"
                    ></div>
                  </div>
                </div>
              </div>
              
              <div class="total-score-section">
                <div class="total-score-label">综合评分</div>
                <div class="total-score-value" :class="getScoreClass(currentSupplier.totalScore)">
                  {{ currentSupplier.totalScore.toFixed(1) }}
                </div>
                <div class="grade-display">
                  <span 
                    class="grade-tag large"
                    :class="getGradeClass(currentSupplier.evaluationGrade)"
                  >
                    {{ currentSupplier.evaluationGrade }}级
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn secondary" @click="handleCloseDetailDialog">关闭</button>
            <button class="btn primary" @click="handleReevaluate">重新评估</button>
          </div>
        </div>
      </div>

      <!-- 评估对话框 -->
      <div v-if="evaluationDialogVisible" class="modal-overlay" @click="handleCloseEvaluationDialog">
        <div class="modal-content large" @click.stop>
          <div class="modal-header">
            <h2>{{ evaluationForm.id ? '编辑评估' : '新建评估' }}</h2>
            <button class="modal-close" @click="handleCloseEvaluationDialog">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="evaluation-form">
              <div class="form-section">
                <h3>评估对象</h3>
                <div class="form-row">
                  <div class="form-item">
                    <label>供应商</label>
                    <select v-model="evaluationForm.supplierId" class="form-input">
                      <option value="">请选择供应商</option>
                      <option 
                        v-for="supplier in supplierList" 
                        :key="supplier.id"
                        :value="supplier.id"
                      >
                        {{ supplier.name }} ({{ supplier.code }})
                      </option>
                    </select>
                  </div>
                  <div class="form-item">
                    <label>评估日期</label>
                    <input 
                      v-model="evaluationForm.evaluationDate"
                      type="date"
                      class="form-input"
                    />
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h3>质量指标评估</h3>
                <div class="evaluation-criteria">
                  <div class="criteria-item">
                    <label>产品质量</label>
                    <div class="score-input-group">
                      <input 
                        v-model.number="evaluationForm.qualityProduct"
                        type="number"
                        min="0"
                        max="100"
                        class="score-input"
                      />
                      <span class="score-unit">分</span>
                    </div>
                  </div>
                  <div class="criteria-item">
                    <label>质量稳定性</label>
                    <div class="score-input-group">
                      <input 
                        v-model.number="evaluationForm.qualityStability"
                        type="number"
                        min="0"
                        max="100"
                        class="score-input"
                      />
                      <span class="score-unit">分</span>
                    </div>
                  </div>
                  <div class="criteria-item">
                    <label>质量改进能力</label>
                    <div class="score-input-group">
                      <input 
                        v-model.number="evaluationForm.qualityImprovement"
                        type="number"
                        min="0"
                        max="100"
                        class="score-input"
                      />
                      <span class="score-unit">分</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h3>交付指标评估</h3>
                <div class="evaluation-criteria">
                  <div class="criteria-item">
                    <label>交付及时性</label>
                    <div class="score-input-group">
                      <input 
                        v-model.number="evaluationForm.deliveryTimeliness"
                        type="number"
                        min="0"
                        max="100"
                        class="score-input"
                      />
                      <span class="score-unit">分</span>
                    </div>
                  </div>
                  <div class="criteria-item">
                    <label>交付数量准确性</label>
                    <div class="score-input-group">
                      <input 
                        v-model.number="evaluationForm.deliveryAccuracy"
                        type="number"
                        min="0"
                        max="100"
                        class="score-input"
                      />
                      <span class="score-unit">分</span>
                    </div>
                  </div>
                  <div class="criteria-item">
                    <label>包装质量</label>
                    <div class="score-input-group">
                      <input 
                        v-model.number="evaluationForm.deliveryPackaging"
                        type="number"
                        min="0"
                        max="100"
                        class="score-input"
                      />
                      <span class="score-unit">分</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h3>服务指标评估</h3>
                <div class="evaluation-criteria">
                  <div class="criteria-item">
                    <label>响应速度</label>
                    <div class="score-input-group">
                      <input 
                        v-model.number="evaluationForm.serviceResponsiveness"
                        type="number"
                        min="0"
                        max="100"
                        class="score-input"
                      />
                      <span class="score-unit">分</span>
                    </div>
                  </div>
                  <div class="criteria-item">
                    <label>服务态度</label>
                    <div class="score-input-group">
                      <input 
                        v-model.number="evaluationForm.serviceAttitude"
                        type="number"
                        min="0"
                        max="100"
                        class="score-input"
                      />
                      <span class="score-unit">分</span>
                    </div>
                  </div>
                  <div class="criteria-item">
                    <label>问题解决能力</label>
                    <div class="score-input-group">
                      <input 
                        v-model.number="evaluationForm.serviceProblemSolving"
                        type="number"
                        min="0"
                        max="100"
                        class="score-input"
                      />
                      <span class="score-unit">分</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h3>价格指标评估</h3>
                <div class="evaluation-criteria">
                  <div class="criteria-item">
                    <label>价格竞争力</label>
                    <div class="score-input-group">
                      <input 
                        v-model.number="evaluationForm.priceCompetitiveness"
                        type="number"
                        min="0"
                        max="100"
                        class="score-input"
                      />
                      <span class="score-unit">分</span>
                    </div>
                  </div>
                  <div class="criteria-item">
                    <label>价格稳定性</label>
                    <div class="score-input-group">
                      <input 
                        v-model.number="evaluationForm.priceStability"
                        type="number"
                        min="0"
                        max="100"
                        class="score-input"
                      />
                      <span class="score-unit">分</span>
                    </div>
                  </div>
                  <div class="criteria-item">
                    <label>付款条件</label>
                    <div class="score-input-group">
                      <input 
                        v-model.number="evaluationForm.pricePaymentTerms"
                        type="number"
                        min="0"
                        max="100"
                        class="score-input"
                      />
                      <span class="score-unit">分</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h3>评估总结</h3>
                <div class="form-item full-width">
                  <label>评估说明</label>
                  <textarea
                    v-model="evaluationForm.evaluationNotes"
                    class="form-textarea"
                    rows="4"
                    placeholder="请输入评估说明和改进建议"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn secondary" @click="handleCloseEvaluationDialog">取消</button>
            <button class="btn primary" @click="handleSubmitEvaluation" :disabled="submitting">
              <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
              <span>{{ submitting ? '提交中...' : '提交评估' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </ResponsiveLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import ResponsiveLayout from '@/components/common/layout/ResponsiveLayout.vue'
import HeaderNavigation from '@/components/common/layout/HeaderNavigation.vue'
import BreadcrumbNav from '@/components/common/layout/BreadcrumbNav.vue'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const selectedRows = ref([])
const sortField = ref('')
const sortOrder = ref('')
const supplierList = ref([])
const evaluationList = ref([])

// 搜索表单
const searchForm = reactive({
  supplierName: '',
  supplierCode: '',
  supplierType: '',
  evaluationGrade: ''
})

const startDate = ref('')
const endDate = ref('')

// 统计数据
const stats = reactive({
  totalSuppliers: 0,
  supplierGrowth: 0.08,
  excellentSuppliers: 0,
  excellentGrowth: 0.12,
  pendingEvaluations: 0,
  pendingGrowth: -0.05,
  avgScore: 0,
  scoreChange: 0.03
})

// 对话框状态
const detailDialogVisible = ref(false)
const evaluationDialogVisible = ref(false)

// 当前选中的数据
const currentSupplier = ref({})
const evaluationForm = reactive({
  id: null,
  supplierId: '',
  evaluationDate: '',
  qualityProduct: 80,
  qualityStability: 80,
  qualityImprovement: 80,
  deliveryTimeliness: 80,
  deliveryAccuracy: 80,
  deliveryPackaging: 80,
  serviceResponsiveness: 80,
  serviceAttitude: 80,
  serviceProblemSolving: 80,
  priceCompetitiveness: 80,
  priceStability: 80,
  pricePaymentTerms: 80,
  evaluationNotes: ''
})

// 面包屑导航
const breadcrumbItems = [
  { label: '采购管理', path: '/purchase' },
  { label: '供应商评估', path: '/purchase/supplier-evaluation' }
]

// 计算属性
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const paginatedData = computed(() => {
  let filtered = [...evaluationList.value]  
  // 应用搜索筛选
  if (searchForm.supplierName) {
    filtered = filtered.filter(item => 
      item.supplierName.toLowerCase().includes(searchForm.supplierName.toLowerCase())
    )
  }
  if (searchForm.supplierCode) {
    filtered = filtered.filter(item => 
      item.supplierCode.toLowerCase().includes(searchForm.supplierCode.toLowerCase())
    )
  }
  if (searchForm.supplierType) {
    filtered = filtered.filter(item => item.supplierType === searchForm.supplierType)
  }
  if (searchForm.evaluationGrade) {
    filtered = filtered.filter(item => item.evaluationGrade === searchForm.evaluationGrade)
  }
  if (startDate.value) {
    filtered = filtered.filter(item => new Date(item.lastEvaluationDate) >= new Date(startDate.value))
  }
  if (endDate.value) {
    filtered = filtered.filter(item => new Date(item.lastEvaluationDate) <= new Date(endDate.value))
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

// 方法
const formatNumber = (value) => {
  return value.toLocaleString()
}

const formatPercent = (value) => {
  if (!value) return '0%'
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${(value * 100).toFixed(1)}%`
}

const formatScoreChange = (value) => {
  if (!value) return '0'
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toFixed(1)}`
}

const formatCurrency = (value) => {
  if (!value) return '¥0.00'
  return `¥${Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
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

const getScoreClass = (score) => {
  if (score >= 90) return 'score-excellent'
  if (score >= 80) return 'score-good'
  if (score >= 70) return 'score-average'
  return 'score-poor'
}

const getScoreColor = (score) => {
  if (score >= 90) return '#48bb78'
  if (score >= 80) return '#ed8936'
  if (score >= 70) return '#4299e1'
  return '#e53e3e'
}

const getGradeClass = (grade) => {
  const classMap = {
    'A': 'grade-a',
    'B': 'grade-b',
    'C': 'grade-c',
    'D': 'grade-d',
    'E': 'grade-e'
  }
  return classMap[grade] || 'grade-default'
}

const getStatusText = (status) => {
  const textMap = {
    'ACTIVE': '活跃',
    'INACTIVE': '非活跃',
    'SUSPENDED': '暂停合作'
  }
  return textMap[status] || status
}

const getSupplierTypeText = (type) => {
  const textMap = {
    'MANUFACTURER': '制造商',
    'DISTRIBUTOR': '经销商',
    'SERVICE_PROVIDER': '服务商',
    'MATERIAL': '原材料供应商'
  }
  return textMap[type] || type
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
    supplierName: '',
    supplierCode: '',
    supplierType: '',
    evaluationGrade: ''
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
  loadEvaluationList()
}

const handleExport = () => {
  // 导出逻辑
}

const handleCreateEvaluation = () => {
  evaluationForm.id = null
  evaluationForm.supplierId = ''
  evaluationForm.evaluationDate = new Date().toISOString().split('T')[0]
  evaluationForm.evaluationNotes = ''
  evaluationDialogVisible.value = true
}

const handleBatchEvaluation = () => {
  // 批量评估逻辑
}

const handleViewDetails = (item) => {
  currentSupplier.value = { ...item }
  detailDialogVisible.value = true
}

const handleEvaluate = (item) => {
  evaluationForm.id = item.id
  evaluationForm.supplierId = item.supplierId
  evaluationForm.evaluationDate = new Date().toISOString().split('T')[0]
  
  // 加载详细评估数据
  loadEvaluationDetail(item.id)
  
  evaluationDialogVisible.value = true
}

const handleHistory = (item) => {
  // 历史记录逻辑
}

const handleReevaluate = () => {
  detailDialogVisible.value = false
  handleEvaluate(currentSupplier.value)
}

const handleLoadSuppliers = () => {
  supplierList.value = [
    { id: 1, name: '供应商A', code: 'SUP001' },
    { id: 2, name: '供应商B', code: 'SUP002' },
    { id: 3, name: '供应商C', code: 'SUP003' },
    { id: 4, name: '供应商D', code: 'SUP004' }
  ]
}

const loadEvaluationList = () => {
  loading.value = true
  
  setTimeout(() => {
    evaluationList.value = generateMockData()
    calculateStats(evaluationList.value)
    loading.value = false
  }, 1000)
}

const loadEvaluationDetail = (id) => {
  // 模拟加载详细评估数据
  evaluationForm.qualityProduct = 85
  evaluationForm.qualityStability = 88
  evaluationForm.qualityImprovement = 82
  evaluationForm.deliveryTimeliness = 90
  evaluationForm.deliveryAccuracy = 92
  evaluationForm.deliveryPackaging = 85
  evaluationForm.serviceResponsiveness = 88
  evaluationForm.serviceAttitude = 90
  evaluationForm.serviceProblemSolving = 86
  evaluationForm.priceCompetitiveness = 83
  evaluationForm.priceStability = 85
  evaluationForm.pricePaymentTerms = 87
  evaluationForm.evaluationNotes = '整体表现良好，建议在质量改进方面继续加强。'
}

const generateMockData = () => {
  const grades = ['A', 'B', 'C', 'D', 'E']
  const types = ['MANUFACTURER', 'DISTRIBUTOR', 'SERVICE_PROVIDER', 'MATERIAL']
  const statuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED']
  const data = []
  
  for (let i = 1; i <= 100; i++) {
    const qualityScore = 70 + Math.random() * 30
    const deliveryScore = 70 + Math.random() * 30
    const serviceScore = 70 + Math.random() * 30
    const priceScore = 70 + Math.random() * 30
    const totalScore = (qualityScore + deliveryScore + serviceScore + priceScore) / 4
    
    data.push({
      id: i,
      supplierCode: `SUP${String(i).padStart(4, '0')}`,
      supplierName: `供应商${i}`,
      supplierType: types[Math.floor(Math.random() * types.length)],
      contactPerson: `联系人${i}`,
      contactPhone: `138${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      contactEmail: `supplier${i}@example.com`,
      qualityScore: qualityScore,
      deliveryScore: deliveryScore,
      serviceScore: serviceScore,
      priceScore: priceScore,
      totalScore: totalScore,
      evaluationGrade: grades[Math.floor(Math.random() * grades.length)],
      lastEvaluationDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      status: statuses[Math.floor(Math.random() * statuses.length)]
    })
  }
  return data
}

const calculateStats = (data) => {
  stats.totalSuppliers = data.length
  stats.excellentSuppliers = data.filter(item => item.evaluationGrade === 'A').length
  stats.pendingEvaluations = data.filter(item => {
    const daysSinceEval = (Date.now() - new Date(item.lastEvaluationDate).getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceEval > 60
  }).length
  stats.avgScore = data.reduce((sum, item) => sum + item.totalScore, 0) / data.length
}

const calculateFormScores = () => {
  const qualityScore = (evaluationForm.qualityProduct + evaluationForm.qualityStability + evaluationForm.qualityImprovement) / 3
  const deliveryScore = (evaluationForm.deliveryTimeliness + evaluationForm.deliveryAccuracy + evaluationForm.deliveryPackaging) / 3
  const serviceScore = (evaluationForm.serviceResponsiveness + evaluationForm.serviceAttitude + evaluationForm.serviceProblemSolving) / 3
  const priceScore = (evaluationForm.priceCompetitiveness + evaluationForm.priceStability + evaluationForm.pricePaymentTerms) / 3
  
  return { qualityScore, deliveryScore, serviceScore, priceScore }
}

const getEvaluationGrade = (totalScore) => {
  if (totalScore >= 90) return 'A'
  if (totalScore >= 80) return 'B'
  if (totalScore >= 70) return 'C'
  if (totalScore >= 60) return 'D'
  return 'E'
}

const handleSubmitEvaluation = () => {
  if (!evaluationForm.supplierId) {
    alert('请选择供应商')
    return
  }
  
  submitting.value = true
  
  setTimeout(() => {
    const scores = calculateFormScores()
    const totalScore = (scores.qualityScore + scores.deliveryScore + scores.serviceScore + scores.priceScore) / 4
    const grade = getEvaluationGrade(totalScore)
    
    alert(`评估提交成功！综合评分：${totalScore.toFixed(1)}，等级：${grade}`)
    
    evaluationDialogVisible.value = false
    submitting.value = false
    loadEvaluationList()
  }, 1500)
}

const handleCloseDetailDialog = () => {
  detailDialogVisible.value = false
  currentSupplier.value = {}
}

const handleCloseEvaluationDialog = () => {
  evaluationDialogVisible.value = false
  // 重置表单
  Object.assign(evaluationForm, {
    id: null,
    supplierId: '',
    evaluationDate: '',
    qualityProduct: 80,
    qualityStability: 80,
    qualityImprovement: 80,
    deliveryTimeliness: 80,
    deliveryAccuracy: 80,
    deliveryPackaging: 80,
    serviceResponsiveness: 80,
    serviceAttitude: 80,
    serviceProblemSolving: 80,
    priceCompetitiveness: 80,
    priceStability: 80,
    pricePaymentTerms: 80,
    evaluationNotes: ''
  })
}

// 生命周期
onMounted(() => {
  handleLoadSuppliers()
  loadEvaluationList()
})
</script>

<style scoped>
.supplier-evaluation {
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

/* 统计卡片 */
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
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--card-color-start), var(--card-color-end));
  opacity: 0.8;
}

.stat-card.primary {
  --card-color-start: #ed8936;
  --card-color-end: #dd7724;
}

.stat-card.success {
  --card-color-start: #48bb78;
  --card-color-end: #38a169;
}

.stat-card.warning {
  --card-color-start: #ed8936;
  --card-color-end: #dd7724;
}

.stat-card.info {
  --card-color-start: #4299e1;
  --card-color-end: #3182ce;
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

.supplier-code {
  font-family: 'Space Mono', monospace;
  font-weight: 600;
  color: #4a5568;
}

.supplier-name {
  max-width: 200px;
}

.supplier-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.supplier-name-text {
  font-weight: 600;
  color: #2d3748;
}

.supplier-status {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.supplier-status.ACTIVE {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
}

.supplier-status.INACTIVE {
  background: rgba(203, 213, 224, 0.3);
  color: #718096;
}

.supplier-status.SUSPENDED {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.supplier-type {
  background: rgba(66, 153, 225, 0.1);
  color: #4299e1;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.score-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.score-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.score-excellent {
  background: #48bb78;
}

.score-good {
  background: #ed8936;
}

.score-average {
  background: #4299e1;
}

.score-poor {
  background: #e53e3e;
}

.score-bar {
  flex: 1;
  height: 6px;
  background: rgba(203, 213, 224, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.score-text {
  font-weight: 600;
  font-size: 0.875rem;
  color: #2d3748;
}

.grade-tag {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.grade-tag.large {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.grade-a {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
  border: 1px solid rgba(72, 187, 120, 0.3);
}

.grade-b {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
  border: 1px solid rgba(237, 137, 54, 0.3);
}

.grade-c {
  background: rgba(66, 153, 225, 0.1);
  color: #4299e1;
  border: 1px solid rgba(66, 153, 225, 0.3);
}

.grade-d {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
  border: 1px solid rgba(237, 137, 54, 0.3);
}

.grade-e {
  background: rgba(229, 62, 62, 0.1);
  color: #e53e3e;
  border: 1px solid rgba(229, 62, 62, 0.3);
}

.actions-column {
  width: 120px;
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

.action-btn.primary:hover {
  background: rgba(237, 137, 54, 0.2);
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
  width: 95%;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(237, 137, 54, 0.1);
  background: rgba(247, 250, 252, 0.8);
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
  background: rgba(247, 250, 252, 0.8);
}

/* 详情对话框内容 */
.info-section,
.evaluation-section {
  margin-bottom: 2rem;
}

.info-section h3,
.evaluation-section h3 {
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

.score-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.score-card-item {
  background: rgba(247, 250, 252, 0.8);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(237, 137, 54, 0.1);
  text-align: center;
}

.score-label {
  font-family: 'Playfair Display', serif;
  font-size: 1rem;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 1rem;
}

.score-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: white;
}

.score-progress {
  width: 100%;
  height: 8px;
  background: rgba(203, 213, 224, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.score-progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.total-score-section {
  background: linear-gradient(135deg, rgba(237, 137, 54, 0.1) 0%, rgba(56, 178, 172, 0.1) 100%);
  border-radius: 16px;
  padding: 2rem;
  border: 2px solid rgba(237, 137, 54, 0.2);
  text-align: center;
}

.total-score-label {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 1rem;
}

.total-score-value {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  border-radius: 50%;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: white;
}

/* 评估表单 */
.evaluation-form {
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

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-item.full-width {
  grid-column: 1 / -1;
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

.evaluation-criteria {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.criteria-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.criteria-item label {
  font-weight: 600;
  color: #4a5568;
  font-size: 0.875rem;
}

.score-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.score-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid rgba(203, 213, 224, 0.8);
  border-radius: 8px;
  font-size: 0.875rem;
  text-align: center;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.2s;
}

.score-input:focus {
  outline: none;
  border-color: rgba(237, 137, 54, 0.5);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 3px rgba(237, 137, 54, 0.1);
}

.score-unit {
  font-weight: 600;
  color: #4a5568;
  font-size: 0.875rem;
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

.header-action-btn.secondary:hover:not(:disabled) {
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
  .supplier-evaluation {
    padding: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .score-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
  
  .evaluation-criteria {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
  
  .data-table {
    font-size: 0.75rem;
  }
  
  .score-grid {
    grid-template-columns: 1fr;
  }
  
  .evaluation-criteria {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-content.large {
    max-width: 95%;
    margin: 1rem;
  }
}

@media (max-width: 640px) {
  .data-table th,
  .data-table td {
    padding: 0.5rem;
    font-size: 0.7rem;
  }
  
  .actions-column {
    width: 80px;
  }
  
  .action-btn {
    padding: 0.125rem;
    font-size: 0.8rem;
  }
}
</style>