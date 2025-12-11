<template>
  <div class="production-order-list">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>生产订单管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateOrder">
          <el-icon><Plus /></el-icon>
          新建订单
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
      <div class="header-left">
        <h2>生产订单管理</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>生产管理</el-breadcrumb-item>
          <el-breadcrumb-item>生产订单</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleCreate" :icon="Plus">
          新建生产订单
        </el-button>
        <el-button type="success" @click="handleImport" :icon="Upload">
          批量导入
        </el-button>
        <el-button type="warning" @click="handleExport" :icon="Download">
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" label-width="100px">
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderCode" placeholder="请输入订单编号" />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.productName" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择订单状态">
            <el-option label="全部" value="" />
            <el-option label="未开始" value="not_started" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已暂停" value="paused" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建日期">
          <el-date-picker
            v-model="searchForm.createDate"
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <el-icon><List /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.total }}</div>
                <div class="stat-label">总订单数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.inProgress }}</div>
                <div class="stat-label">生产中</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.completed }}</div>
                <div class="stat-label">已完成</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.urgent }}</div>
                <div class="stat-label">紧急订单</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <div class="table-header">
        <div class="table-title">
          <span>生产订单列表</span>
          <el-tag type="info">共 {{ pagination.total }} 条记录</el-tag>
        </div>
        <div class="table-actions">
          <el-button-group>
            <el-button 
              :type="viewMode === 'table' ? 'primary' : ''"
              @click="viewMode = 'table'"
              size="small"
            >
              <el-icon><Grid /></el-icon>
            </el-button>
            <el-button 
              :type="viewMode === 'card' ? 'primary' : ''"
              @click="viewMode = 'card'"
              size="small"
            >
              <el-icon><List /></el-icon>
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 表格视图 -->
      <el-table 
        v-if="viewMode === 'table'"
        :data="tableData" 
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" width="60" label="序号" />
        <el-table-column prop="orderNumber" label="生产订单号" width="140" fixed="left">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">
              {{ row.orderNumber }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="产品名称" min-width="180">
          <template #default="{ row }">
            <div class="product-info">
              <el-avatar :size="30" :src="row.productImage">
                {{ row.productName.charAt(0) }}
              </el-avatar>
              <div>
                <div class="product-name">{{ row.productName }}</div>
                <div class="product-code">{{ row.productCode }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="计划数量" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.quantity) }} {{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column prop="completedQuantity" label="完成数量" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.completedQuantity) }} {{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="完成进度" width="150">
          <template #default="{ row }">
            <el-progress
              :percentage="row.progress"
              :color="getProgressColor(row.progress)"
              :show-text="true"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityTagType(row.priority)" size="small">
              {{ getPriorityLabel(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="planStartDate" label="计划开始" width="120">
          <template #default="{ row }">
            {{ formatDate(row.planStartDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="planEndDate" label="计划完成" width="120">
          <template #default="{ row }">
            {{ formatDate(row.planEndDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="workCenter" label="工作中心" width="120" />
        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button 
                type="primary" 
                size="small"
                @click="handleView(row)"
                :icon="View"
              >
                查看
              </el-button>
              <el-button 
                v-if="canEdit(row)"
                type="warning" 
                size="small"
                @click="handleEdit(row)"
                :icon="Edit"
              >
                编辑
              </el-button>
              <el-dropdown @command="(command) => handleDropdownCommand(command, row)">
                <el-button type="info" size="small" :icon="More" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="schedule">
                      <el-icon><Clock /></el-icon>
                      排程
                    </el-dropdown-item>
                    <el-dropdown-item command="progress">
                      <el-icon><TrendCharts /></el-icon>
                      进度
                    </el-dropdown-item>
                    <el-dropdown-item command="bom">
                      <el-icon><Document /></el-icon>
                      BOM
                    </el-dropdown-item>
                    <el-dropdown-item command="material">
                      <el-icon><Box /></el-icon>
                      物料
                    </el-dropdown-item>
                    <el-dropdown-item command="quality" v-if="row.status === 'in_production'">
                      <el-icon><Star /></el-icon>
                      质检
                    </el-dropdown-item>
                    <el-dropdown-item command="approve" v-if="row.status === 'pending'">
                      <el-icon><Check /></el-icon>
                      审核
                    </el-dropdown-item>
                    <el-dropdown-item command="cancel" v-if="canCancel(row)" divided>
                      <el-icon><Close /></el-icon>
                      取消
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" v-if="canDelete(row)">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
      <!-- 卡片视图 -->
      <div v-else class="card-view">
        <el-row :gutter="20">
          <el-col 
            v-for="item in tableData" 
            :key="item.id" 
            :span="8"
            class="order-card-col"
          >
            <el-card class="order-card" shadow="hover" @click="handleView(item)">
              <template #header>
                <div class="card-header">
                  <div class="card-title">
                    <span class="order-number">{{ item.orderNumber }}</span>
                    <el-tag :type="getStatusTagType(item.status)" size="small">
                      {{ getStatusLabel(item.status) }}
                    </el-tag>
                  </div>
                  <el-tag :type="getPriorityTagType(item.priority)" size="small">
                    {{ getPriorityLabel(item.priority) }}
                  </el-tag>
                </div>
              </template>
              
              <div class="card-content">
                <div class="product-info">
                  <el-avatar :size="40" :src="item.productImage">
                    {{ item.productName.charAt(0) }}
                  </el-avatar>
                  <div class="product-details">
                    <div class="product-name">{{ item.productName }}</div>
                    <div class="product-code">{{ item.productCode }}</div>
                  </div>
                </div>
                
                <div class="progress-section">
                  <div class="progress-info">
                    <span>进度: {{ item.completedQuantity }}/{{ item.quantity }}</span>
                    <span>{{ item.progress }}%</span>
                  </div>
                  <el-progress
                    :percentage="item.progress"
                    :color="getProgressColor(item.progress)"
                    :show-text="false"
                    :stroke-width="8"
                  />
                </div>
                
                <div class="order-info">
                  <div class="info-item">
                    <span class="label">工作中心:</span>
                    <span>{{ item.workCenter }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">计划日期:</span>
                    <span>{{ formatDate(item.planStartDate) }} - {{ formatDate(item.planEndDate) }}</span>
                  </div>
                </div>
              </div>
              
              <div class="card-footer">
                <el-button size="small" @click.stop="handleView(item)">查看</el-button>
                <el-button v-if="canEdit(item)" size="small" type="warning" @click.stop="handleEdit(item)">编辑</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <div v-if="currentOrder" class="order-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单编号">{{ currentOrder.orderCode }}</el-descriptions-item>
          <el-descriptions-item label="产品信息">{{ currentOrder.productName }} ({{ currentOrder.productCode }})</el-descriptions-item>
          <el-descriptions-item label="订单数量">{{ currentOrder.quantity }} {{ currentOrder.unit }}</el-descriptions-item>
          <el-descriptions-item label="订单状态"><el-tag :type="getStatusTagType(currentOrder.status)">{{ getStatusText(currentOrder.status) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="计划时间">
            {{ currentOrder.plannedStartDate }} 至 {{ currentOrder.plannedEndDate }}
          </el-descriptions-item>
          <el-descriptions-item label="实际时间" v-if="currentOrder.actualStartDate">
            {{ currentOrder.actualStartDate }} 至 {{ currentOrder.actualEndDate || '未完成' }}
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentOrder.remark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建信息">
            {{ currentOrder.creator }} 于 {{ currentOrder.createTime }} 创建
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
    <!-- 导入对话框 -->
    <el-dialog 
      v-model="importDialogVisible" 
      title="批量导入生产订单" 
      width="600px"
    >
      <div class="import-content">
        <el-alert
          title="请按照模板格式准备Excel文件"
          type="info"
          :closable="false"
        />
        <div class="upload-area">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            @change="handleFileChange"
            drag
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传 xlsx/xls 文件，且不超过 10MB
              </div>
            </template>
          </el-upload>
        </div>
        <div class="template-download">
          <el-link type="primary" @click="downloadTemplate">
            <el-icon><Download /></el-icon>
            下载导入模板
          </el-link>
        </div>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportSubmit" :loading="importing">
          开始导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Refresh, Download, Document, Timer, Check, Warning, Delete } from '@element-plus/icons-vue'
import type { ElTable } from 'element-plus'

// 订单类型定义
interface ProductionOrder {
  id: string
  orderCode: string
  productCode: string
  productName: string
  quantity: number
  unit: string
  status: string
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  remark?: string
  creator: string
  createTime: string
}

// 响应式数据
const loading = ref(false)
const orderList = ref<ProductionOrder[]>([])
const selectedOrderIds = ref<string[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const currentOrder = ref<ProductionOrder | null>(null)

// 搜索表单
const searchForm = reactive({
  orderCode: '',
  productName: '',
  status: '',
  createDate: null as [string, string] | null
})

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
