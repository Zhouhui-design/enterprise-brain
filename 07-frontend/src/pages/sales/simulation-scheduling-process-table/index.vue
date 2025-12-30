<template>
  <div class="simulation-scheduling-process-table">
    <!-- 页面标题和操作区 -->
    <div class="page-header">
      <div class="page-title">
        <h2>模拟排程工序表</h2>
        <p class="description">被动接收模拟物料需求明细数据，进行复杂的工序排程计算和自动化处理</p>
      </div>
      <div class="page-actions">
        <el-button @click="refreshData" type="primary" :loading="loading">
          <el-icon><refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button @click="exportData" type="success">
          <el-icon><download /></el-icon>
          导出数据
        </el-button>
        <el-button @click="toggleFilter" type="info">
          <el-icon><filter /></el-icon>
          {{ showFilter ? '隐藏筛选' : '显示筛选' }}
        </el-button>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div v-if="showFilter" class="filter-section">
      <el-form :model="filterForm" inline class="filter-form">
        <el-form-item label="内部销售订单编号">
          <el-input v-model="filterForm.internal_sales_order_no" placeholder="请输入内部销售订单编号" clearable />
        </el-form-item>
        <el-form-item label="产品编号">
          <el-input v-model="filterForm.product_code" placeholder="请输入产品编号" clearable />
        </el-form-item>
        <el-form-item label="当前工序">
          <el-input v-model="filterForm.current_process" placeholder="请输入当前工序" clearable />
        </el-form-item>
        <el-form-item label="有效排程日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleDateRangeChange"
          />
        </el-form-item>
        <el-form-item label="是否继续排程">
          <el-select v-model="filterForm.continue_scheduling" placeholder="请选择" clearable>
            <el-option label="是" :value="1" />
            <el-option label="否" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilter">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ stats.total_count }}</div>
              <div class="stat-label">总记录数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ stats.continuing_count }}</div>
              <div class="stat-label">继续排程</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ stats.completed_count }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ stats.pending_count }}</div>
              <div class="stat-label">待处理</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 无数据状态提示 -->
    <div v-if="tableData.length === 0 && !loading" class="empty-data-tip">
      <el-alert
        title="模拟排程工序表暂无数据"
        type="info"
        description="此页面为被动接收数据页面，请在销售订单页面点击"模拟排程"按钮来触发数据推送流程。数据流程：销售订单 → 模拟排程列表 → 模拟物料需求明细 → 模拟排程工序表"
        show-icon
        :closable="false"
      />
    </div>

    <!-- 数据表格 -->
    <div class="table-section" v-if="tableData.length > 0">
      <el-table
        ref="tableRef"
        :data="tableData"
        :loading="loading"
        style="width: 100%"
        height="600"
        border
        stripe
        :default-sort="{ prop: 'sequence_number', order: 'ascending' }"
        @sort-change="handleSortChange"
        @selection-change="handleSelectionChange"
      >
        <!-- 选择列 -->
        <el-table-column type="selection" width="55" fixed="left" />
        
        <!-- 序号 -->
        <el-table-column prop="sequence_number" label="序号" width="80" fixed="left" sortable />
        
        <!-- 订单状态 -->
        <el-table-column prop="order_status" label="订单状态" width="120" sortable>
          <template #default="scope">
            <el-tag :type="getOrderStatusType(scope.row.order_status)">
              {{ scope.row.order_status || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <!-- 内部销售订单编号 -->
        <el-table-column prop="internal_sales_order_no" label="内部销售订单编号" width="150" sortable show-overflow-tooltip />
        
        <!-- 客户交期 -->
        <el-table-column prop="customer_delivery_date" label="客户交期" width="120" sortable>
          <template #default="scope">
            {{ formatDate(scope.row.customer_delivery_date) }}
          </template>
        </el-table-column>
        
        <!-- 产品编号 -->
        <el-table-column prop="product_code" label="产品编号" width="120" sortable show-overflow-tooltip />
        
        <!-- 产品名称 -->
        <el-table-column prop="product_name" label="产品名称" width="150" show-overflow-tooltip />
        
        <!-- 建议补货数量 -->
        <el-table-column prop="suggested_replenishment_qty" label="建议补货数量" width="130" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.suggested_replenishment_qty) }}
          </template>
        </el-table-column>
        
        <!-- 层阶地址 -->
        <el-table-column prop="level_address" label="层阶地址" width="120" show-overflow-tooltip />
        
        <!-- 当前工序 -->
        <el-table-column prop="current_process" label="当前工序" width="120" sortable show-overflow-tooltip />
        
        <!-- 当前物料编号 -->
        <el-table-column prop="current_material_code" label="当前物料编号" width="130" show-overflow-tooltip />
        
        <!-- 当前物料名称 -->
        <el-table-column prop="current_material_name" label="当前物料名称" width="150" show-overflow-tooltip />
        
        <!-- 当前需求数量 -->
        <el-table-column prop="current_required_qty" label="当前需求数量" width="130" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.current_required_qty) }}
          </template>
        </el-table-column>
        
        <!-- 可用库存 -->
        <el-table-column prop="available_inventory" label="可用库存" width="100" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.available_inventory) }}
          </template>
        </el-table-column>
        
        <!-- 还需数量 -->
        <el-table-column prop="still_needed_qty" label="还需数量" width="100" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.still_needed_qty) }}
          </template>
        </el-table-column>
        
        <!-- 需求天数 -->
        <el-table-column prop="requirement_days" label="需求天数" width="100" sortable align="right" />
        
        <!-- 后道工序名称 -->
        <el-table-column prop="downstream_process_name" label="后道工序名称" width="120" show-overflow-tooltip />
        
        <!-- 后道工序产品编号 -->
        <el-table-column prop="downstream_product_code" label="后道工序产品编号" width="140" show-overflow-tooltip />
        
        <!-- 后道工序产品名称 -->
        <el-table-column prop="downstream_product_name" label="后道工序产品名称" width="150" show-overflow-tooltip />
        
        <!-- 按顺序总需 -->
        <el-table-column prop="total_required_by_order" label="按顺序总需" width="120" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.total_required_by_order) }}
          </template>
        </el-table-column>
        
        <!-- 提交时间 -->
        <el-table-column prop="submit_time" label="提交时间" width="150" sortable>
          <template #default="scope">
            {{ formatDateTime(scope.row.submit_time) }}
          </template>
        </el-table-column>
        
        <!-- 是否继续排程 -->
        <el-table-column prop="continue_scheduling" label="是否继续排程" width="120" sortable>
          <template #default="scope">
            <el-tag :type="scope.row.continue_scheduling === 1 ? 'success' : 'info'">
              {{ scope.row.continue_scheduling === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <!-- 当前层阶地址 -->
        <el-table-column prop="current_level_address" label="当前层阶地址" width="130" show-overflow-tooltip />
        
        <!-- 后道产品层阶地址 -->
        <el-table-column prop="downstream_level_address" label="后道产品层阶地址" width="140" show-overflow-tooltip />
        
        <!-- 0阶BOM编号 -->
        <el-table-column prop="level0_bom_code" label="0阶BOM编号" width="120" show-overflow-tooltip />
        
        <!-- 0阶BOM编号数量 -->
        <el-table-column prop="level0_bom_quantity" label="0阶BOM编号数量" width="130" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.level0_bom_quantity) }}
          </template>
        </el-table-column>
        
        <!-- 层阶-0阶标准用量 -->
        <el-table-column prop="level_standard_qty" label="层阶-0阶标准用量" width="140" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.level_standard_qty, 4) }}
          </template>
        </el-table-column>
        
        <!-- 当前0阶标准用量 -->
        <el-table-column prop="current_level0_standard_qty" label="当前0阶标准用量" width="140" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.current_level0_standard_qty, 4) }}
          </template>
        </el-table-column>
        
        <!-- 后道0阶标准用量 -->
        <el-table-column prop="downstream_level0_standard_qty" label="后道0阶标准用量" width="140" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.downstream_level0_standard_qty, 4) }}
          </template>
        </el-table-column>
        
        <!-- 后道需求数量 -->
        <el-table-column prop="downstream_required_qty" label="后道需求数量" width="130" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.downstream_required_qty) }}
          </template>
        </el-table-column>
        
        <!-- 后道可用库存 -->
        <el-table-column prop="downstream_available_inventory" label="后道可用库存" width="130" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.downstream_available_inventory) }}
          </template>
        </el-table-column>
        
        <!-- 需求总工时 -->
        <el-table-column prop="required_total_hours" label="需求总工时" width="120" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.required_total_hours, 2) }}
          </template>
        </el-table-column>
        
        <!-- 定时工额 -->
        <el-table-column prop="hourly_quota" label="定时工额" width="100" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.hourly_quota, 2) }}
          </template>
        </el-table-column>
        
        <!-- 计划排程日期 -->
        <el-table-column prop="planned_schedule_date" label="计划排程日期" width="130" sortable>
          <template #default="scope">
            {{ formatDate(scope.row.planned_schedule_date) }}
          </template>
        </el-table-column>
        
        <!-- 有效计划排程日期 -->
        <el-table-column prop="effective_planned_date" label="有效计划排程日期" width="140" sortable>
          <template #default="scope">
            {{ formatDate(scope.row.effective_planned_date) }}
          </template>
        </el-table-column>
        
        <!-- 当天剩余工时 -->
        <el-table-column prop="daily_remaining_hours" label="当天剩余工时" width="120" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.daily_remaining_hours, 2) }}
          </template>
        </el-table-column>
        
        <!-- 当天模拟累计工时 -->
        <el-table-column prop="daily_cumulative_hours" label="当天模拟累计工时" width="140" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.daily_cumulative_hours, 2) }}
          </template>
        </el-table-column>
        
        <!-- 当前计划排程工时 -->
        <el-table-column prop="current_planned_hours" label="当前计划排程工时" width="140" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.current_planned_hours, 2) }}
          </template>
        </el-table-column>
        
        <!-- 当前可用排程工时 -->
        <el-table-column prop="current_available_hours" label="当前可用排程工时" width="140" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.current_available_hours, 2) }}
          </template>
        </el-table-column>
        
        <!-- 当前计划排程数量 -->
        <el-table-column prop="current_planned_quantity" label="当前计划排程数量" width="140" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.current_planned_quantity) }}
          </template>
        </el-table-column>
        
        <!-- 剩余未排数量 -->
        <el-table-column prop="remaining_unscheduled_qty" label="剩余未排数量" width="130" sortable align="right">
          <template #default="scope">
            <span :class="getRemainingClass(scope.row.remaining_unscheduled_qty)">
              {{ formatNumber(scope.row.remaining_unscheduled_qty) }}
            </span>
          </template>
        </el-table-column>
        
        <!-- 当前累计排程数量 -->
        <el-table-column prop="current_cumulative_quantity" label="当前累计排程数量" width="140" sortable align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.current_cumulative_quantity) }}
          </template>
        </el-table-column>
        
        <!-- 后道产品来源 -->
        <el-table-column prop="downstream_product_source" label="后道产品来源" width="120" show-overflow-tooltip />
        
        <!-- 模拟排程工序编号 -->
        <el-table-column prop="simulation_process_no" label="模拟排程工序编号" width="150" show-overflow-tooltip />
        
        <!-- 来源编号 -->
        <el-table-column prop="source_no" label="来源编号" width="120" show-overflow-tooltip />
        
        <!-- 来源表单 -->
        <el-table-column prop="source_form" label="来源表单" width="120" show-overflow-tooltip />
        
        <!-- 操作列 -->
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="viewDetail(scope.row)">
              <el-icon><view /></el-icon>
              详情
            </el-button>
            <el-button link type="warning" @click="recalculate(scope.row)">
              <el-icon><refresh /></el-icon>
              重算
            </el-button>
            <el-button link type="success" @click="triggerAutoIncrement(scope.row)">
              <el-icon><plus /></el-icon>
              自增
            </el-button>
            <el-button link type="danger" @click="deleteRecord(scope.row)">
              <el-icon><delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-section">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[20, 50, 100, 200]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="模拟排程工序详情"
      width="90%"
      :close-on-click-modal="false"
    >
      <div v-if="currentRecord" class="detail-content">
        <el-descriptions :column="3" border>
          <!-- 基础信息 -->
          <el-descriptions-item label="序号">{{ currentRecord.sequence_number }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getOrderStatusType(currentRecord.order_status)">
              {{ currentRecord.order_status || '-' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="内部销售订单编号">{{ currentRecord.internal_sales_order_no }}</el-descriptions-item>
          <el-descriptions-item label="客户交期">{{ formatDate(currentRecord.customer_delivery_date) }}</el-descriptions-item>
          <el-descriptions-item label="产品编号">{{ currentRecord.product_code }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ currentRecord.product_name }}</el-descriptions-item>
          <el-descriptions-item label="建议补货数量">{{ formatNumber(currentRecord.suggested_replenishment_qty) }}</el-descriptions-item>
          <el-descriptions-item label="层阶地址">{{ currentRecord.level_address }}</el-descriptions-item>
          <el-descriptions-item label="当前工序">{{ currentRecord.current_process }}</el-descriptions-item>
          <el-descriptions-item label="当前物料编号">{{ currentRecord.current_material_code }}</el-descriptions-item>
          <el-descriptions-item label="当前物料名称">{{ currentRecord.current_material_name }}</el-descriptions-item>
          <el-descriptions-item label="当前需求数量">{{ formatNumber(currentRecord.current_required_qty) }}</el-descriptions-item>
          <el-descriptions-item label="可用库存">{{ formatNumber(currentRecord.available_inventory) }}</el-descriptions-item>
          <el-descriptions-item label="还需数量">{{ formatNumber(currentRecord.still_needed_qty) }}</el-descriptions-item>
          <el-descriptions-item label="需求天数">{{ currentRecord.requirement_days }}</el-descriptions-item>
          <el-descriptions-item label="后道工序名称">{{ currentRecord.downstream_process_name }}</el-descriptions-item>
          <el-descriptions-item label="后道工序产品编号">{{ currentRecord.downstream_product_code }}</el-descriptions-item>
          <el-descriptions-item label="后道工序产品名称">{{ currentRecord.downstream_product_name }}</el-descriptions-item>
          <el-descriptions-item label="按顺序总需">{{ formatNumber(currentRecord.total_required_by_order) }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatDateTime(currentRecord.submit_time) }}</el-descriptions-item>
          <el-descriptions-item label="是否继续排程">
            <el-tag :type="currentRecord.continue_scheduling === 1 ? 'success' : 'info'">
              {{ currentRecord.continue_scheduling === 1 ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前层阶地址">{{ currentRecord.current_level_address }}</el-descriptions-item>
          <el-descriptions-item label="后道产品层阶地址">{{ currentRecord.downstream_level_address }}</el-descriptions-item>
          <el-descriptions-item label="0阶BOM编号">{{ currentRecord.level0_bom_code }}</el-descriptions-item>
          <el-descriptions-item label="0阶BOM编号数量">{{ formatNumber(currentRecord.level0_bom_quantity) }}</el-descriptions-item>
          <el-descriptions-item label="层阶-0阶标准用量">{{ formatNumber(currentRecord.level_standard_qty, 4) }}</el-descriptions-item>
          <el-descriptions-item label="当前0阶标准用量">{{ formatNumber(currentRecord.current_level0_standard_qty, 4) }}</el-descriptions-item>
          <el-descriptions-item label="后道0阶标准用量">{{ formatNumber(currentRecord.downstream_level0_standard_qty, 4) }}</el-descriptions-item>
          <el-descriptions-item label="后道需求数量">{{ formatNumber(currentRecord.downstream_required_qty) }}</el-descriptions-item>
          <el-descriptions-item label="后道可用库存">{{ formatNumber(currentRecord.downstream_available_inventory) }}</el-descriptions-item>
          <el-descriptions-item label="需求总工时">{{ formatNumber(currentRecord.required_total_hours, 2) }}</el-descriptions-item>
          <el-descriptions-item label="定时工额">{{ formatNumber(currentRecord.hourly_quota, 2) }}</el-descriptions-item>
          <el-descriptions-item label="计划排程日期">{{ formatDate(currentRecord.planned_schedule_date) }}</el-descriptions-item>
          <el-descriptions-item label="有效计划排程日期">{{ formatDate(currentRecord.effective_planned_date) }}</el-descriptions-item>
          <el-descriptions-item label="当天剩余工时">{{ formatNumber(currentRecord.daily_remaining_hours, 2) }}</el-descriptions-item>
          <el-descriptions-item label="当天模拟累计工时">{{ formatNumber(currentRecord.daily_cumulative_hours, 2) }}</el-descriptions-item>
          <el-descriptions-item label="当前计划排程工时">{{ formatNumber(currentRecord.current_planned_hours, 2) }}</el-descriptions-item>
          <el-descriptions-item label="当前可用排程工时">{{ formatNumber(currentRecord.current_available_hours, 2) }}</el-descriptions-item>
          <el-descriptions-item label="当前计划排程数量">{{ formatNumber(currentRecord.current_planned_quantity) }}</el-descriptions-item>
          <el-descriptions-item label="剩余未排数量">
            <span :class="getRemainingClass(currentRecord.remaining_unscheduled_qty)">
              {{ formatNumber(currentRecord.remaining_unscheduled_qty) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="当前累计排程数量">{{ formatNumber(currentRecord.current_cumulative_quantity) }}</el-descriptions-item>
          <el-descriptions-item label="后道产品来源">{{ currentRecord.downstream_product_source }}</el-descriptions-item>
          <el-descriptions-item label="模拟排程工序编号">{{ currentRecord.simulation_process_no }}</el-descriptions-item>
          <el-descriptions-item label="来源编号">{{ currentRecord.source_no }}</el-descriptions-item>
          <el-descriptions-item label="来源表单">{{ currentRecord.source_form }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(currentRecord.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDateTime(currentRecord.updated_at) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Download, Filter, View, Delete, Plus } from '@element-plus/icons-vue'
import axios from 'axios'

export default {
  name: 'SimulationSchedulingProcessTable',
  components: {
    Refresh,
    Download,
    Filter,
    View,
    Delete,
    Plus
  },
  setup() {
    // 响应式数据
    const loading = ref(false)
    const showFilter = ref(false)
    const tableData = ref([])
    const selectedRows = ref([])
    const detailDialogVisible = ref(false)
    const currentRecord = ref(null)
    const dateRange = ref([])
    
    // 筛选表单
    const filterForm = reactive({
      internal_sales_order_no: '',
      product_code: '',
      current_process: '',
      effective_planned_date_start: '',
      effective_planned_date_end: '',
      continue_scheduling: undefined
    })
    
    // 分页
    const pagination = reactive({
      page: 1,
      pageSize: 50,
      total: 0
    })
    
    // 统计信息
    const stats = reactive({
      total_count: 0,
      continuing_count: 0,
      completed_count: 0,
      pending_count: 0,
      total_planned_quantity: 0,
      total_remaining_quantity: 0,
      min_planned_date: null,
      max_planned_date: null
    })
    
    let pollTimer = null

    // 方法
    const fetchData = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.page,
          pageSize: pagination.pageSize,
          ...filterForm
        }
        
        const response = await axios.get('/api/simulation-scheduling-process/list', { params })
        
        if (response.data.success) {
          tableData.value = response.data.data || []
          pagination.total = response.data.pagination?.total || 0
          
          // 不再将空数据视为错误，而是正常状态
          if (tableData.value.length === 0) {
            console.log('模拟排程工序表暂无数据，等待其他页面推送数据')
          }
        } else {
          ElMessage.error(response.data.message || '获取数据失败')
        }
      } catch (error) {
        console.error('获取数据失败:', error)
        // 只在真正网络错误时显示错误提示
        if (error.response && error.response.status !== 404) {
          ElMessage.error('获取数据失败: ' + error.message)
        }
      } finally {
        loading.value = false
      }
    }
    
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/simulation-scheduling-process/stats')
        
        if (response.data.success) {
          Object.assign(stats, response.data.data || {})
        }
      } catch (error) {
        console.error('获取统计信息失败:', error)
        // 不显示错误提示，因为这是被动接收页面
      }
    }
    
    const refreshData = () => {
      // 用户主动刷新时才获取数据
      console.log('用户主动刷新数据')
      fetchData()
      fetchStats()
    }
    
    const applyFilter = () => {
      pagination.page = 1
      fetchData()
    }
    
    const resetFilter = () => {
      Object.assign(filterForm, {
        internal_sales_order_no: '',
        product_code: '',
        current_process: '',
        effective_planned_date_start: '',
        effective_planned_date_end: '',
        continue_scheduling: undefined
      })
      dateRange.value = []
      pagination.page = 1
      fetchData()
    }
    
    const handleDateRangeChange = (dates) => {
      if (dates && dates.length === 2) {
        filterForm.effective_planned_date_start = dates[0]
        filterForm.effective_planned_date_end = dates[1]
      } else {
        filterForm.effective_planned_date_start = ''
        filterForm.effective_planned_date_end = ''
      }
    }
    
    const toggleFilter = () => {
      showFilter.value = !showFilter.value
    }
    
    const handleSelectionChange = (selection) => {
      selectedRows.value = selection
    }
    
    const handleSortChange = (sortInfo) => {
      // 这里可以实现排序逻辑
      console.log('排序变化:', sortInfo)
    }
    
    const handleSizeChange = (newSize) => {
      pagination.pageSize = newSize
      pagination.page = 1
      fetchData()
    }
    
    const handleCurrentChange = (newPage) => {
      pagination.page = newPage
      fetchData()
    }
    
    const viewDetail = (row) => {
      currentRecord.value = row
      detailDialogVisible.value = true
    }
    
    const recalculate = async (row) => {
      try {
        await ElMessageBox.confirm('确定要重新计算这条记录吗？', '确认操作', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        loading.value = true
        const response = await axios.post(`/api/simulation-scheduling-process/${row.id}/recalculate`)
        
        if (response.data.success) {
          ElMessage.success('重新计算完成')
          refreshData()
        } else {
          ElMessage.error(response.data.message || '重新计算失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('重新计算失败:', error)
          ElMessage.error('重新计算失败: ' + error.message)
        }
      } finally {
        loading.value = false
      }
    }
    
    const triggerAutoIncrement = async (row) => {
      try {
        await ElMessageBox.confirm('确定要触发自增行规则吗？', '确认操作', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        loading.value = true
        const response = await axios.post(`/api/simulation-scheduling-process/${row.id}/auto-increment`)
        
        if (response.data.success) {
          ElMessage.success('自增行规则执行成功')
          refreshData()
        } else {
          ElMessage.error(response.data.message || '自增行规则执行失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('自增行规则执行失败:', error)
          ElMessage.error('自增行规则执行失败: ' + error.message)
        }
      } finally {
        loading.value = false
      }
    }
    
    const deleteRecord = async (row) => {
      try {
        await ElMessageBox.confirm('确定要删除这条记录吗？此操作不可恢复！', '确认删除', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'danger'
        })
        
        loading.value = true
        const response = await axios.delete(`/api/simulation-scheduling-process/${row.id}`)
        
        if (response.data.success) {
          ElMessage.success('删除成功')
          refreshData()
        } else {
          ElMessage.error(response.data.message || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
          ElMessage.error('删除失败: ' + error.message)
        }
      } finally {
        loading.value = false
      }
    }
    
    const exportData = async () => {
      try {
        loading.value = true
        const params = { ...filterForm }
        const response = await axios.get('/api/simulation-scheduling-process/export', { 
          params,
          responseType: 'blob'
        })
        
        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `模拟排程工序表_${new Date().toISOString().slice(0, 10)}.xlsx`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        ElMessage.success('导出成功')
      } catch (error) {
        console.error('导出失败:', error)
        ElMessage.error('导出失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }
    
    // 格式化函数
    const formatDate = (date) => {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('zh-CN')
    }
    
    const formatDateTime = (datetime) => {
      if (!datetime) return '-'
      return new Date(datetime).toLocaleString('zh-CN')
    }
    
    const formatNumber = (number, decimals = 2) => {
      if (number === null || number === undefined) return '-'
      return Number(number).toLocaleString('zh-CN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })
    }
    
    const getOrderStatusType = (status) => {
      const statusMap = {
        '待处理': 'warning',
        '处理中': 'primary',
        '已完成': 'success',
        '已取消': 'danger'
      }
      return statusMap[status] || 'info'
    }
    
    const getRemainingClass = (value) => {
      if (value > 0) return 'text-danger'
      if (value === 0) return 'text-success'
      return ''
    }
    
    // 启动轮询
    const startPolling = () => {
      pollTimer = setInterval(() => {
        fetchData()
        fetchStats()
      }, 30000) // 30秒轮询一次
    }
    
    // 停止轮询
    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    }
    
    // 生命周期
    onMounted(() => {
      // 不立即获取数据，而是等待被动接收或用户主动刷新
      console.log('模拟排程工序表已加载，等待被动接收数据')
      startPolling() // 保持轮询以监听数据更新
    })
    
    onUnmounted(() => {
      stopPolling()
    })
    
    return {
      loading,
      showFilter,
      tableData,
      selectedRows,
      detailDialogVisible,
      currentRecord,
      dateRange,
      filterForm,
      pagination,
      stats,
      fetchData,
      refreshData,
      applyFilter,
      resetFilter,
      handleDateRangeChange,
      toggleFilter,
      handleSelectionChange,
      handleSortChange,
      handleSizeChange,
      handleCurrentChange,
      viewDetail,
      recalculate,
      triggerAutoIncrement,
      deleteRecord,
      exportData,
      formatDate,
      formatDateTime,
      formatNumber,
      getOrderStatusType,
      getRemainingClass
    }
  }
}
</script>

<style scoped>
.simulation-scheduling-process-table {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-title h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.page-title .description {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.page-actions {
  display: flex;
  gap: 12px;
}

.filter-section {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-form {
  margin: 0;
}

.filter-form .el-form-item {
  margin-bottom: 16px;
}

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-item {
  padding: 20px 0;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.table-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pagination-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: right;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-data-tip {
  margin-bottom: 20px;
}

.empty-data-tip .el-alert {
  border-radius: 8px;
}

.text-danger {
  color: #F56C6C;
  font-weight: bold;
}

.text-success {
  color: #67C23A;
  font-weight: bold;
}

.detail-content {
  max-height: 600px;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .page-actions {
    margin-top: 16px;
    justify-content: center;
  }
  
  .filter-form .el-form-item {
    display: block;
    margin-bottom: 12px;
  }
  
  .stats-section .el-col {
    margin-bottom: 12px;
  }
}

/* Element Plus 表格优化 */
:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

:deep(.el-table .cell) {
  padding: 8px 0;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #fafafa;
}

:deep(.el-pagination) {
  justify-content: center;
}
</style>
