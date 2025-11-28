<template>
  <ResponsiveLayout>
    <template #header>
      <HeaderNavigation
        title="采购跟踪管理"
        :show-search="true"
        :show-notifications="true"
        @toggle-sidebar="() => {}"
      >
        <template #actions>
          <button 
            class="header-action-btn primary"
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
            <span>导出</span>
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
    <div class="purchase-tracking">
      <!-- 搜索和筛选区域 -->
      <div class="filter-section">
        <div class="filter-container">
          <div class="filter-row">
            <div class="filter-item">
              <label class="filter-label">订单编号</label>
              <input 
                v-model="searchForm.orderNo" 
                placeholder="请输入订单编号"
                class="filter-input"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="filter-item">
              <label class="filter-label">物料编码/名称</label>
              <input 
                v-model="searchForm.itemKeyword" 
                placeholder="请输入物料编码或名称"
                class="filter-input"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="filter-item">
              <label class="filter-label">供应商</label>
              <select v-model="searchForm.supplierId" class="filter-select">
                <option value="">全部供应商</option>
                <option
                  v-for="supplier in suppliers"
                  :key="supplier.id"
                  :value="supplier.id"
                >
                  {{ supplier.name }}
                </option>
              </select>
            </div>
            <div class="filter-item">
              <label class="filter-label">交付状态</label>
              <select v-model="searchForm.deliveryStatus" class="filter-select">
                <option value="">全部状态</option>
                <option value="NOT_DELIVERED">未交付</option>
                <option value="PARTIALLY_DELIVERED">部分交付</option>
                <option value="DELIVERED">已交付</option>
                <option value="DELAYED">延期</option>
              </select>
            </div>
          </div>
          
          <div class="filter-row">
            <div class="filter-item">
              <label class="filter-label">预计交付日期</label>
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
              <i class="fas fa-clipboard-list"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(stats.totalOrders) }}</div>
              <div class="stat-label">跟踪中订单</div>
            </div>
          </div>
          
          <div class="stat-card warning">
            <div class="stat-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(stats.delayedOrders) }}</div>
              <div class="stat-label">延期订单</div>
            </div>
          </div>
          
          <div class="stat-card success">
            <div class="stat-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(stats.completedOrders) }}</div>
              <div class="stat-label">已完成订单</div>
            </div>
          </div>
          
          <div class="stat-card info">
            <div class="stat-icon">
              <i class="fas fa-dollar-sign"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatCurrency(stats.totalAmount) }}</div>
              <div class="stat-label">订单总金额</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-section">
        <div class="table-container">
          <div class="table-header">
            <h3 class="table-title">采购跟踪列表</h3>
            <div class="table-actions">
              <button 
                class="table-action-btn"
                @click="handleBatchTracking"
                :disabled="selectedRows.length === 0"
              >
                <i class="fas fa-plus"></i>
                <span>批量跟踪</span>
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
                  <th class="sortable" @click="handleSort('id')">
                    ID
                    <i class="fas fa-sort" :class="getSortClass('id')"></i>
                  </th>
                  <th class="sortable" @click="handleSort('orderNo')">
                    订单编号
                    <i class="fas fa-sort" :class="getSortClass('orderNo')"></i>
                  </th>
                  <th>供应商</th>
                  <th>物料编码</th>
                  <th>物料名称</th>
                  <th>规格型号</th>
                  <th>单位</th>
                  <th class="sortable" @click="handleSort('orderQuantity')">
                    订购数量
                    <i class="fas fa-sort" :class="getSortClass('orderQuantity')"></i>
                  </th>
                  <th>已收数量</th>
                  <th>待收数量</th>
                  <th>约定交付日期</th>
                  <th>最新交付日期</th>
                  <th>交付状态</th>
                  <th>跟踪记录</th>
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
                  <td>{{ item.id }}</td>
                  <td class="order-no">{{ item.orderNo }}</td>
                  <td>{{ item.supplierName }}</td>
                  <td>{{ item.itemNo }}</td>
                  <td class="item-name">{{ item.itemName }}</td>
                  <td>{{ item.specification }}</td>
                  <td>{{ item.unit }}</td>
                  <td class="text-right">{{ item.orderQuantity }}</td>
                  <td class="text-right">{{ item.receivedQuantity }}</td>
                  <td class="text-right pending-quantity">{{ item.pendingQuantity }}</td>
                  <td>{{ item.deliveryDate }}</td>
                  <td>{{ item.latestDeliveryDate || '-' }}</td>
                  <td>
                    <span 
                      class="status-tag"
                      :class="getDeliveryStatusClass(item.deliveryStatus)"
                    >
                      {{ getDeliveryStatusText(item.deliveryStatus) }}
                    </span>
                  </td>
                  <td>
                    <button 
                      class="link-btn"
                      @click="handleViewNotes(item)"
                      :disabled="!item.trackingNotes"
                    >
                      {{ item.trackingNotes ? '查看' : '-' }}
                    </button>
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
                      class="action-btn primary"
                      @click="handleAddTrackingNote(item)"
                      title="添加跟踪"
                    >
                      <i class="fas fa-plus"></i>
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

      <!-- 详情对话框 -->
      <div v-if="detailDialogVisible" class="modal-overlay" @click="handleCloseDetailDialog">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>采购跟踪详情</h2>
            <button class="modal-close" @click="handleCloseDetailDialog">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <!-- 基本信息 -->
            <div class="info-section">
              <h3>订单物料信息</h3>
              <div class="info-grid">
                <div class="info-item">
                  <label>订单编号</label>
                  <span>{{ currentTracking.orderNo }}</span>
                </div>
                <div class="info-item">
                  <label>供应商</label>
                  <span>{{ currentTracking.supplierName }}</span>
                </div>
                <div class="info-item">
                  <label>物料编码</label>
                  <span>{{ currentTracking.itemNo }}</span>
                </div>
                <div class="info-item">
                  <label>物料名称</label>
                  <span>{{ currentTracking.itemName }}</span>
                </div>
                <div class="info-item">
                  <label>规格型号</label>
                  <span>{{ currentTracking.specification }}</span>
                </div>
                <div class="info-item">
                  <label>单位</label>
                  <span>{{ currentTracking.unit }}</span>
                </div>
                <div class="info-item">
                  <label>订购数量</label>
                  <span>{{ currentTracking.orderQuantity }}</span>
                </div>
                <div class="info-item">
                  <label>已收数量</label>
                  <span>{{ currentTracking.receivedQuantity }}</span>
                </div>
                <div class="info-item">
                  <label>待收数量</label>
                  <span>{{ currentTracking.pendingQuantity }}</span>
                </div>
                <div class="info-item">
                  <label>约定交付日期</label>
                  <span>{{ currentTracking.deliveryDate }}</span>
                </div>
                <div class="info-item">
                  <label>最新交付日期</label>
                  <span>{{ currentTracking.latestDeliveryDate || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>交付状态</label>
                  <span 
                    class="status-tag"
                    :class="getDeliveryStatusClass(currentTracking.deliveryStatus)"
                  >
                    {{ getDeliveryStatusText(currentTracking.deliveryStatus) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 跟踪记录 -->
            <div class="tracking-section">
              <h3>跟踪记录</h3>
              <div v-if="currentTracking.notes && currentTracking.notes.length > 0" class="tracking-list">
                <div
                  v-for="(note, index) in currentTracking.notes"
                  :key="index"
                  class="tracking-note-item"
                >
                  <div class="note-header">
                    <span class="note-operator">{{ note.operator }}</span>
                    <span class="note-time">{{ note.time }}</span>
                  </div>
                  <div class="note-content">{{ note.content }}</div>
                  <div class="note-attachment" v-if="note.attachments && note.attachments.length > 0">
                    <span>附件：</span>
                    <button
                      v-for="(attachment, idx) in note.attachments"
                      :key="idx"
                      class="attachment-btn"
                      @click="handleDownloadAttachment(attachment)"
                    >
                      <i class="fas fa-file"></i>
                      {{ attachment.name }}
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="no-data">暂无跟踪记录</div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn secondary" @click="handleCloseDetailDialog">关闭</button>
          </div>
        </div>
      </div>

      <!-- 添加跟踪记录对话框 -->
      <div v-if="trackingDialogVisible" class="modal-overlay" @click="handleCloseTrackingDialog">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>添加跟踪记录</h2>
            <button class="modal-close" @click="handleCloseTrackingDialog">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label>订单编号</label>
              <input v-model="trackingForm.orderNo" disabled class="form-input" />
            </div>
            <div class="form-group">
              <label>物料信息</label>
              <input v-model="trackingForm.itemInfo" disabled class="form-input" />
            </div>
            <div class="form-group">
              <label>跟踪内容 *</label>
              <textarea
                v-model="trackingForm.content"
                class="form-textarea"
                rows="4"
                placeholder="请输入跟踪内容"
              ></textarea>
            </div>
            <div class="form-group">
              <label>最新交付日期</label>
              <input
                v-model="trackingForm.latestDeliveryDate"
                type="date"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>附件</label>
              <div class="file-upload">
                <input 
                  type="file" 
                  multiple 
                  @change="handleFileChange"
                  ref="fileInput"
                  style="display: none"
                />
                <button class="upload-btn" @click="$refs.fileInput.click()">
                  <i class="fas fa-upload"></i>
                  <span>选择文件</span>
                </button>
                <div class="upload-tip">最多上传3个文件，单个文件不超过10MB</div>
              </div>
              <div v-if="trackingForm.fileList.length > 0" class="file-list">
                <div 
                  v-for="(file, index) in trackingForm.fileList"
                  :key="index"
                  class="file-item"
                >
                  <i class="fas fa-file"></i>
                  <span>{{ file.name }}</span>
                  <button class="file-remove" @click="removeFile(index)">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn secondary" @click="handleCloseTrackingDialog">取消</button>
            <button class="btn primary" @click="handleSubmitTrackingNote">提交</button>
          </div>
        </div>
      </div>

      <!-- 确认对话框 -->
      <div v-if="confirmDialogVisible" class="modal-overlay" @click="confirmDialogVisible = false">
        <div class="modal-content small" @click.stop>
          <div class="modal-header">
            <h2>{{ confirmDialogTitle }}</h2>
          </div>
          
          <div class="modal-body">
            <p>{{ confirmDialogMessage }}</p>
          </div>
          
          <div class="modal-footer">
            <button class="btn secondary" @click="confirmDialogVisible = false">取消</button>
            <button class="btn primary" @click="handleConfirmAction">确定</button>
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
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedRows = ref([])
const sortField = ref('')
const sortOrder = ref('')
const trackingList = ref([])
const suppliers = ref([])

// 搜索表单
const searchForm = reactive({
  orderNo: '',
  itemKeyword: '',
  supplierId: '',
  deliveryStatus: ''
})

const startDate = ref('')
const endDate = ref('')

// 统计数据
const stats = reactive({
  totalOrders: 0,
  delayedOrders: 0,
  completedOrders: 0,
  totalAmount: 0
})

// 对话框状态
const detailDialogVisible = ref(false)
const trackingDialogVisible = ref(false)
const confirmDialogVisible = ref(false)

// 当前选中的数据
const currentTracking = ref({})
const trackingForm = reactive({
  orderId: null,
  itemId: null,
  orderNo: '',
  itemInfo: '',
  content: '',
  latestDeliveryDate: '',
  fileList: []
})

// 确认对话框数据
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmAction = ref(null)

// 面包屑导航
const breadcrumbItems = [
  { label: '采购管理', path: '/purchase' },
  { label: '采购跟踪', path: '/purchase/tracking' }
]

// 计算属性
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const paginatedData = computed(() => {
  let filtered = [...trackingList.value]
  
  // 应用搜索筛选
  if (searchForm.orderNo) {
    filtered = filtered.filter(item => item.orderNo.toLowerCase().includes(searchForm.orderNo.toLowerCase()))
  }
  if (searchForm.itemKeyword) {
    filtered = filtered.filter(item => 
      item.itemNo.toLowerCase().includes(searchForm.itemKeyword.toLowerCase()) ||
      item.itemName.toLowerCase().includes(searchForm.itemKeyword.toLowerCase())
    )
  }
  if (searchForm.supplierId) {
    filtered = filtered.filter(item => item.supplierId == searchForm.supplierId)
  }
  if (searchForm.deliveryStatus) {
    filtered = filtered.filter(item => item.deliveryStatus === searchForm.deliveryStatus)
  }
  if (startDate.value) {
    filtered = filtered.filter(item => new Date(item.deliveryDate) >= new Date(startDate.value))
  }
  if (endDate.value) {
    filtered = filtered.filter(item => new Date(item.deliveryDate) <= new Date(endDate.value))
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
const initData = () => {
  loadSuppliers()
  loadTrackingList()
}

const loadSuppliers = () => {
  suppliers.value = [
    { id: 1, name: '供应商A' },
    { id: 2, name: '供应商B' },
    { id: 3, name: '供应商C' },
    { id: 4, name: '供应商D' }
  ]
}

const loadTrackingList = () => {
  loading.value = true
  
  setTimeout(() => {
    const data = generateMockData()
    trackingList.value = data
    calculateStats(data)
    loading.value = false
  }, 500)
}

const generateMockData = () => {
  const statuses = ['NOT_DELIVERED', 'PARTIALLY_DELIVERED', 'DELIVERED', 'DELAYED']
  const supplierNames = ['供应商A', '供应商B', '供应商C', '供应商D']
  const data = []
  
  for (let i = 1; i <= 50; i++) {
    const orderQuantity = Math.floor(Math.random() * 100) + 1
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const receivedQuantity = status === 'DELIVERED' 
      ? orderQuantity 
      : status === 'PARTIALLY_DELIVERED' 
        ? Math.floor(orderQuantity * 0.5) 
        : 0
    
    data.push({
      id: i,
      orderId: Math.floor(i / 5) + 1,
      orderNo: `PO${new Date().getFullYear()}${String(Math.floor(i / 5) + 1).padStart(4, '0')}`,
      supplierId: Math.floor(Math.random() * 4) + 1,
      supplierName: supplierNames[Math.floor(Math.random() * supplierNames.length)],
      itemId: i,
      itemNo: `ITEM${String(Math.floor(Math.random() * 9000) + 1000)}`,
      itemName: `物料名称${i}`,
      specification: `规格${i}`,
      unit: ['个', '件', '箱', '套'][Math.floor(Math.random() * 4)],
      orderQuantity: orderQuantity,
      receivedQuantity: receivedQuantity,
      pendingQuantity: orderQuantity - receivedQuantity,
      deliveryDate: formatDate(new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)),
      latestDeliveryDate: status === 'DELAYED' ? formatDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)) : null,
      deliveryStatus: status,
      trackingNotes: Math.random() > 0.5 ? '已联系供应商，确认将尽快发货' : '',
      notes: generateMockNotes(),
      unitPrice: Math.floor(Math.random() * 1000) + 100,
      totalPrice: orderQuantity * (Math.floor(Math.random() * 1000) + 100)
    })
  }
  return data
}

const generateMockNotes = () => {
  if (Math.random() > 0.5) {
    return [
      {
        operator: '张三',
        time: formatDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
        content: '联系供应商确认订单，供应商表示会按时交货。',
        attachments: []
      },
      {
        operator: '李四',
        time: formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
        content: '再次跟进，供应商反馈生产顺利，准备发货。',
        attachments: [
          { id: 1, name: '生产进度报告.pdf', url: '#' }
        ]
      }
    ]
  }
  return []
}

const calculateStats = (data) => {
  stats.totalOrders = data.length
  stats.delayedOrders = data.filter(item => item.deliveryStatus === 'DELAYED').length
  stats.completedOrders = data.filter(item => item.deliveryStatus === 'DELIVERED').length
  stats.totalAmount = data.reduce((sum, item) => sum + item.totalPrice, 0)
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatNumber = (value) => {
  return value.toLocaleString()
}

const formatCurrency = (value) => {
  if (!value) return '¥0.00'
  return `¥${Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

const getDeliveryStatusClass = (status) => {
  const classMap = {
    NOT_DELIVERED: 'status-info',
    PARTIALLY_DELIVERED: 'status-warning',
    DELIVERED: 'status-success',
    DELAYED: 'status-danger'
  }
  return classMap[status] || 'status-default'
}

const getDeliveryStatusText = (status) => {
  const textMap = {
    NOT_DELIVERED: '未交付',
    PARTIALLY_DELIVERED: '部分交付',
    DELIVERED: '已交付',
    DELAYED: '延期'
  }
  return textMap[status] || status
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
    orderNo: '',
    itemKeyword: '',
    supplierId: '',
    deliveryStatus: ''
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
  loadTrackingList()
}

const handleExport = () => {
  // 导出逻辑
}

const handleBatchTracking = () => {
  // 批量跟踪逻辑
}

const handleViewDetails = (row) => {
  currentTracking.value = { ...row }
  detailDialogVisible.value = true
}

const handleViewNotes = (row) => {
  if (!row.trackingNotes) return
  handleViewDetails(row)
}

const handleAddTrackingNote = (row) => {
  Object.assign(trackingForm, {
    orderId: row.orderId,
    itemId: row.itemId,
    orderNo: row.orderNo,
    itemInfo: `${row.itemNo} - ${row.itemName}`,
    content: '',
    latestDeliveryDate: '',
    fileList: []
  })
  trackingDialogVisible.value = true
}

const handleFileChange = (event) => {
  const files = Array.from(event.target.files)
  if (files.length > 3) {
    alert('最多只能上传3个文件')
    return
  }
  
  files.forEach(file => {
    if (file.size > 10 * 1024 * 1024) {
      alert(`文件 ${file.name} 超过10MB限制`)
      return
    }
  })
  
  trackingForm.fileList = files.slice(0, 3)
}

const removeFile = (index) => {
  trackingForm.fileList.splice(index, 1)
}

const handleSubmitTrackingNote = () => {
  if (!trackingForm.content) {
    alert('请输入跟踪内容')
    return
  }
  
  setTimeout(() => {
    alert('跟踪记录添加成功')
    trackingDialogVisible.value = false
    loadTrackingList()
  }, 500)
}

const handleDownloadAttachment = (attachment) => {
  alert(`下载附件：${attachment.name}`)
}

const handleCloseDetailDialog = () => {
  detailDialogVisible.value = false
  currentTracking.value = {}
}

const handleCloseTrackingDialog = () => {
  trackingDialogVisible.value = false
  Object.assign(trackingForm, {
    orderId: null,
    itemId: null,
    orderNo: '',
    itemInfo: '',
    content: '',
    latestDeliveryDate: '',
    fileList: []
  })
}

const handleConfirmAction = () => {
  if (confirmAction.value) {
    confirmAction.value()
  }
  confirmDialogVisible.value = false
}

// 生命周期
onMounted(() => {
  initData()
})
</script>

<style scoped>
.purchase-tracking {
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

.search-btn.primary:hover {
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

.stat-card.warning .stat-icon {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.stat-card.success .stat-icon {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
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
}

.stat-label {
  font-size: 0.875rem;
  color: #718096;
  margin-top: 0.25rem;
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

.text-right {
  text-align: right;
}

.order-no {
  font-family: 'Space Mono', monospace;
  font-weight: 600;
  color: #4a5568;
}

.item-name {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pending-quantity {
  color: #e53e3e;
  font-weight: 600;
}

.status-tag {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-info {
  background: rgba(66, 153, 225, 0.1);
  color: #4299e1;
}

.status-warning {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
}

.status-success {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
}

.status-danger {
  background: rgba(229, 62, 62, 0.1);
  color: #e53e3e;
}

.link-btn {
  background: none;
  border: none;
  color: #4299e1;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.875rem;
}

.link-btn:hover {
  color: #3182ce;
}

.link-btn:disabled {
  color: #a0aec0;
  cursor: not-allowed;
  text-decoration: none;
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

/* 对话框 */
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
  max-width: 80%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(45, 55, 72, 0.2);
  border: 1px solid rgba(237, 137, 54, 0.2);
}

.modal-content.small {
  max-width: 400px;
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

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Space Mono', monospace;
}

.btn.primary {
  background: #ed8936;
  color: white;
}

.btn.primary:hover {
  background: #dd7724;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(237, 137, 54, 0.3);
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

/* 详情对话框内容 */
.info-section {
  margin-bottom: 2rem;
}

.info-section h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1rem;
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

.tracking-section h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1rem;
}

.tracking-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tracking-note-item {
  background: rgba(247, 250, 252, 0.8);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid rgba(237, 137, 54, 0.1);
}

.note-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.note-operator {
  font-weight: 600;
  color: #2d3748;
}

.note-time {
  color: #a0aec0;
  font-size: 0.75rem;
}

.note-content {
  color: #4a5568;
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.note-attachment {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.note-attachment > span {
  font-weight: 600;
  color: #4a5568;
  font-size: 0.875rem;
}

.attachment-btn {
  background: rgba(66, 153, 225, 0.1);
  color: #4299e1;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.attachment-btn:hover {
  background: rgba(66, 153, 225, 0.2);
}

.no-data {
  text-align: center;
  color: #a0aec0;
  font-style: italic;
  padding: 2rem;
}

/* 表单 */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(203, 213, 224, 0.8);
  border-radius: 8px;
  font-size: 0.875rem;
  background: rgba(247, 250, 252, 0.8);
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: rgba(237, 137, 54, 0.5);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 3px rgba(237, 137, 54, 0.1);
}

.form-input:disabled {
  background: rgba(203, 213, 224, 0.3);
  color: #718096;
}

.file-upload {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(66, 153, 225, 0.1);
  color: #4299e1;
  border: 1px solid rgba(66, 153, 225, 0.3);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.upload-btn:hover {
  background: rgba(66, 153, 225, 0.2);
}

.upload-tip {
  color: #a0aec0;
  font-size: 0.75rem;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(247, 250, 252, 0.8);
  border-radius: 6px;
  border: 1px solid rgba(203, 213, 224, 0.5);
}

.file-remove {
  background: none;
  border: none;
  color: #e53e3e;
  cursor: pointer;
  padding: 0.25rem;
  margin-left: auto;
  border-radius: 4px;
  transition: all 0.2s;
}

.file-remove:hover {
  background: rgba(229, 62, 62, 0.1);
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

.header-action-btn.primary:hover {
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

/* 响应式设计 */
@media (max-width: 1024px) {
  .purchase-tracking {
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
  
  .modal-content {
    max-width: 95%;
    margin: 1rem;
  }
}

@media (max-width: 640px) {
  .table-wrapper {
    font-size: 0.75rem;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.5rem;
  }
  
  .actions-column {
    width: 80px;
  }
}
</style>