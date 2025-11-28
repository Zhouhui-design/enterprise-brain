<template>
  <div class="logistics-tracking">
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>首页</el-breadcrumb-item>
        <el-breadcrumb-item>发货管理</el-breadcrumb-item>
        <el-breadcrumb-item>物流跟踪</el-breadcrumb-item>
      </el-breadcrumb>
      <h1>物流跟踪</h1>
    </div>
    
    <el-card shadow="never">
      <div class="search-section">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="发货单号">
            <el-input
              v-model="searchForm.noteNumber"
              placeholder="请输入发货单号"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="执行单号">
            <el-input
              v-model="searchForm.executionNumber"
              placeholder="请输入执行单号"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="订单编号">
            <el-input
              v-model="searchForm.orderNumber"
              placeholder="请输入订单编号"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="客户名称">
            <el-input
              v-model="searchForm.customerName"
              placeholder="请输入客户名称"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="物流单号">
            <el-input
              v-model="searchForm.trackingNumber"
              placeholder="请输入物流单号"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="物流公司">
            <el-input
              v-model="searchForm.logisticsCompany"
              placeholder="请输入物流公司"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="物流状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择物流状态"
              clearable
            >
              <el-option
                v-for="status in trackingStatuses"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="发货日期">
            <el-date-picker
              v-model="searchForm.deliveryDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-form>
        
        <div class="search-actions">
          <el-button @click="handleSearch" type="primary">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button @click="exportData">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>
      </div>
      
      <div class="table-section">
        <div class="table-header" v-if="total > 0">
          <span>共 {{ total }} 条数据</span>
          <div class="batch-actions">
            <el-button @click="batchRefresh">
              <el-icon><Refresh /></el-icon>
              批量刷新
            </el-button>
            <el-button @click="batchExportTracking">
              <el-icon><Document /></el-icon>
              导出跟踪记录
            </el-button>
          </div>
        </div>
        
        <el-table
          v-loading="loading"
          :data="trackingList"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="noteNumber" label="发货单号" width="180" />
          <el-table-column prop="executionNumber" label="执行单号" width="180" />
          <el-table-column prop="orderNumber" label="订单编号" width="180" />
          <el-table-column prop="customerName" label="客户名称" width="180" />
          <el-table-column prop="deliveryDate" label="发货日期" width="150" />
          <el-table-column prop="logisticsCompany" label="物流公司" width="150" />
          <el-table-column prop="trackingNumber" label="物流单号" width="200" />
          <el-table-column prop="consignee" label="收货人" width="120" />
          <el-table-column prop="consigneePhone" label="收货人电话" width="150" />
          <el-table-column prop="status" label="物流状态" width="120">
            <template #default="{ row }">
              <el-tag
                :type="getStatusTagType(row.status)"
                size="small"
              >
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastUpdateTime" label="最后更新" width="180" />
          <el-table-column prop="estimatedArrivalTime" label="预计到达" width="180" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button
                size="small"
                @click="viewTrackingDetail(row)"
              >
                <el-icon><View /></el-icon>
                查看详情
              </el-button>
              <el-button
                size="small"
                @click="refreshTracking(row)"
              >
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
              <el-dropdown trigger="click">
                <el-button size="small">
                  更多
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="viewDeliveryNote(row)">
                      查看发货单
                    </el-dropdown-item>
                    <el-dropdown-item @click="viewMap(row)">
                      地图查看
                    </el-dropdown-item>
                    <el-dropdown-item @click="exportTrackingRecord(row)">
                      导出记录
                    </el-dropdown-item>
                    <el-dropdown-item @click="reportIssue(row)">
                      问题反馈
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-section">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>
    
    <!-- 物流详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="物流详情"
      width="80%"
      :close-on-click-modal="false"
      fullscreen
    >
      <div v-if="selectedTracking" class="tracking-detail">
        <div class="detail-header">
          <div class="header-left">
            <h2>物流单号：{{ selectedTracking.trackingNumber }}</h2>
            <el-tag
              :type="getStatusTagType(selectedTracking.status)"
              size="large"
              style="margin-left: 20px"
            >
              {{ getStatusLabel(selectedTracking.status) }}
            </el-tag>
          </div>
          <div class="header-right">
            <el-button @click="refreshTracking(selectedTracking)">
              <el-icon><Refresh /></el-icon>
              刷新物流
            </el-button>
            <el-button @click="viewDeliveryNote(selectedTracking)">
              <el-icon><Document /></el-icon>
              查看发货单
            </el-button>
            <el-button @click="viewMap(selectedTracking)" type="primary">
              <el-icon><Location /></el-icon>
              地图查看
            </el-button>
          </div>
        </div>
        
        <div class="tracking-info">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>基本信息</span>
                  </div>
                </template>
                <el-descriptions :column="1" :border="false">
                  <el-descriptions-item label="物流公司">{{ selectedTracking.logisticsCompany }}</el-descriptions-item>
                  <el-descriptions-item label="物流单号">{{ selectedTracking.trackingNumber }}</el-descriptions-item>
                  <el-descriptions-item label="发货单号">{{ selectedTracking.noteNumber }}</el-descriptions-item>
                  <el-descriptions-item label="执行单号">{{ selectedTracking.executionNumber }}</el-descriptions-item>
                  <el-descriptions-item label="订单编号">{{ selectedTracking.orderNumber }}</el-descriptions-item>
                  <el-descriptions-item label="发货日期">{{ selectedTracking.deliveryDate }}</el-descriptions-item>
                  <el-descriptions-item label="发货人">{{ selectedTracking.deliverer }}</el-descriptions-item>
                  <el-descriptions-item label="发货仓库">{{ selectedTracking.warehouseName }}</el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>收货信息</span>
                  </div>
                </template>
                <el-descriptions :column="1" :border="false">
                  <el-descriptions-item label="客户名称">{{ selectedTracking.customerName }}</el-descriptions-item>
                  <el-descriptions-item label="收货人">{{ selectedTracking.consignee }}</el-descriptions-item>
                  <el-descriptions-item label="收货人电话">{{ selectedTracking.consigneePhone }}</el-descriptions-item>
                  <el-descriptions-item label="收货地址">{{ selectedTracking.shipToAddress }}</el-descriptions-item>
                  <el-descriptions-item label="预计到达时间">{{ selectedTracking.estimatedArrivalTime || '-' }}</el-descriptions-item>
                  <el-descriptions-item label="实际到达时间">{{ selectedTracking.actualArrivalTime || '-' }}</el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>状态信息</span>
                  </div>
                </template>
                <el-descriptions :column="1" :border="false">
                  <el-descriptions-item label="当前状态">{{ getStatusLabel(selectedTracking.status) }}</el-descriptions-item>
                  <el-descriptions-item label="创建时间">{{ selectedTracking.createdAt }}</el-descriptions-item>
                  <el-descriptions-item label="更新时间">{{ selectedTracking.lastUpdateTime }}</el-descriptions-item>
                  <el-descriptions-item label="运输方式">{{ getTransportTypeLabel(selectedTracking.transportType) }}</el-descriptions-item>
                  <el-descriptions-item label="运输时长">{{ getTransportDuration(selectedTracking) }}</el-descriptions-item>
                  <el-descriptions-item label="是否异常">{{ selectedTracking.isException ? '是' : '否' }}</el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>
          </el-row>
        </div>
        
        <div class="tracking-timeline">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>物流跟踪记录</span>
                <span v-if="trackingLoading" class="loading-text">正在获取最新物流信息...</span>
              </div>
            </template>
            
            <div v-if="selectedTracking.logisticsDetails && selectedTracking.logisticsDetails.length > 0">
              <el-timeline>
                <el-timeline-item
                  v-for="(log, index) in selectedTracking.logisticsDetails"
                  :key="index"
                  :timestamp="formatTime(log.timestamp)"
                  :type="index === 0 ? 'primary' : 'normal'"
                >
                  <div class="log-content">
                    <p class="log-status">{{ log.status }}</p>
                    <p class="log-location">{{ log.location }}</p>
                    <p class="log-description">{{ log.description }}</p>
                    <p class="log-operator" v-if="log.operator">操作人：{{ log.operator }}</p>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
            <div v-else class="no-data">
              <el-empty description="暂无物流跟踪记录" />
            </div>
          </el-card>
        </div>
        
        <div class="tracking-products">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>货物信息</span>
              </div>
            </template>
            
            <el-table
              :data="selectedTracking.items"
              style="width: 100%"
              border
            >
              <el-table-column prop="productCode" label="产品编码" width="150" />
              <el-table-column prop="productName" label="产品名称" min-width="200" />
              <el-table-column prop="productSpec" label="规格型号" width="150" />
              <el-table-column prop="unit" label="单位" width="80" />
              <el-table-column prop="quantity" label="数量" width="100" />
              <el-table-column prop="batchNumber" label="批次号" width="150" />
              <el-table-column prop="remark" label="备注" min-width="180" />
            </el-table>
            
            <div class="total-info">
              <div>总数量：{{ selectedTracking.totalQuantity }}</div>
            </div>
          </el-card>
        </div>
        
        <div v-if="selectedTracking.issues && selectedTracking.issues.length > 0" class="tracking-issues">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>问题记录</span>
              </div>
            </template>
            
            <el-timeline>
              <el-timeline-item
                v-for="(issue, index) in selectedTracking.issues"
                :key="index"
                :timestamp="formatTime(issue.createdAt)"
                type="warning"
              >
                <div class="issue-content">
                  <p class="issue-title">{{ issue.title }}</p>
                  <p class="issue-description">{{ issue.description }}</p>
                  <p class="issue-reporter">上报人：{{ issue.reporter }}</p>
                  <div v-if="issue.solution" class="issue-solution">
                    <p class="solution-title">解决方案：</p>
                    <p>{{ issue.solution }}</p>
                    <p class="solution-handler">处理人：{{ issue.handler }}</p>
                    <p class="solution-time">处理时间：{{ formatTime(issue.handledAt) }}</p>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button @click="exportTrackingRecord(selectedTracking)">导出跟踪记录</el-button>
          <el-button @click="reportIssue(selectedTracking)" type="primary">问题反馈</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 地图查看对话框 -->
    <el-dialog
      v-model="mapVisible"
      title="物流地图查看"
      width="90%"
      :close-on-click-modal="false"
      fullscreen
    >
      <div v-if="selectedTracking" class="map-section">
        <div class="map-info">
          <div class="info-item">
            <span class="label">物流单号：</span>
            <span class="value">{{ selectedTracking.trackingNumber }}</span>
          </div>
          <div class="info-item">
            <span class="label">物流公司：</span>
            <span class="value">{{ selectedTracking.logisticsCompany }}</span>
          </div>
          <div class="info-item">
            <span class="label">当前状态：</span>
            <el-tag
              :type="getStatusTagType(selectedTracking.status)"
              size="small"
            >
              {{ getStatusLabel(selectedTracking.status) }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="label">最后更新：</span>
            <span class="value">{{ selectedTracking.lastUpdateTime }}</span>
          </div>
          <div class="info-item">
            <span class="label">预计到达：</span>
            <span class="value">{{ selectedTracking.estimatedArrivalTime || '-' }}</span>
          </div>
        </div>
        
        <div class="map-container">
          <!-- 这里模拟地图组件 -->
          <div class="map-placeholder">
            <el-empty description="地图加载中..." />
            <div class="map-info">
              <p>出发地：{{ selectedTracking.warehouseName }}</p>
              <p>目的地：{{ selectedTracking.customerName }}</p>
            </div>
            <!-- 在实际项目中，这里应该集成真实的地图组件 -->
            <div class="route-display">
              <div class="route-point start-point">
                <el-icon><CircleClose /></el-icon>
                <span>出发</span>
              </div>
              <div class="route-line">
                <div v-for="(log, index) in selectedTracking.logisticsDetails.slice(1, -1)" :key="index" class="route-mid-point">
                  <el-icon><CircleCheck /></el-icon>
                  <span>{{ log.location }}</span>
                </div>
              </div>
              <div class="route-point end-point" :class="{ active: selectedTracking.status === 'DELIVERED' }">
                <el-icon><CirclePlus /></el-icon>
                <span>到达</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="map-bottom">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>路线关键点</span>
              </div>
            </template>
            
            <div class="route-key-points">
              <div
                v-for="(log, index) in selectedTracking.logisticsDetails"
                :key="index"
                class="key-point"
                :class="{ active: index === 0 }"
                @click="highlightPoint(index)"
              >
                <div class="point-time">{{ formatTime(log.timestamp) }}</div>
                <div class="point-status">{{ log.status }}</div>
                <div class="point-location">{{ log.location }}</div>
                <div class="point-desc">{{ log.description }}</div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="mapVisible = false">关闭</el-button>
          <el-button @click="refreshTracking(selectedTracking)">刷新地图</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 问题反馈对话框 -->
    <el-dialog
      v-model="issueVisible"
      title="物流问题反馈"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="issueForm"
        :model="issueForm"
        :rules="issueRules"
        label-width="100px"
      >
        <el-form-item label="物流单号">
          <el-input v-model="issueForm.trackingNumber" disabled />
        </el-form-item>
        <el-form-item label="问题类型" prop="type">
          <el-select
            v-model="issueForm.type"
            placeholder="请选择问题类型"
          >
            <el-option label="延迟派送" value="DELAY" />
            <el-option label="包裹丢失" value="LOST" />
            <el-option label="包裹损坏" value="DAMAGED" />
            <el-option label="信息不符" value="INFO_MISMATCH" />
            <el-option label="其他问题" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="问题标题" prop="title">
          <el-input
            v-model="issueForm.title"
            placeholder="请输入问题标题"
          />
        </el-form-item>
        <el-form-item label="问题描述" prop="description">
          <el-input
            v-model="issueForm.description"
            type="textarea"
            rows="5"
            placeholder="请详细描述问题情况"
          />
        </el-form-item>
        <el-form-item label="紧急程度" prop="priority">
          <el-radio-group v-model="issueForm.priority">
            <el-radio label="一般">一般</el-radio>
            <el-radio label="紧急">紧急</el-radio>
            <el-radio label="非常紧急">非常紧急</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="issueVisible = false">取消</el-button>
          <el-button type="primary" @click="submitIssue">提交反馈</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search,
  Download,
  Refresh,
  ArrowDown,
  View,
  Document,
  Map,
  Location,
  CirclePlus,
  CircleClose,
  CircleCheck
} from '@element-plus/icons-vue';

export default {
  name: 'LogisticsTracking',
  components: {
    Search,
    Download,
    Refresh,
    ArrowDown,
    View,
    Document,
    Map,
    Location,
    CirclePlus,
    CircleClose,
    CircleCheck
  },
  setup() {
    // 状态管理
    const loading = ref(false);
    const trackingLoading = ref(false);
    const trackingList = ref([]);
    const total = ref(0);
    const selectedRows = ref([]);
    
    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20
    });
    
    // 搜索表单
    const searchForm = reactive({
      noteNumber: '',
      executionNumber: '',
      orderNumber: '',
      customerName: '',
      trackingNumber: '',
      logisticsCompany: '',
      status: '',
      deliveryDateRange: []
    });
    
    // 物流状态选项
    const trackingStatuses = [
      { label: '待发货', value: 'PENDING' },
      { label: '已发货', value: 'SHIPPED' },
      { label: '运输中', value: 'IN_TRANSIT' },
      { label: '派送中', value: 'DELIVERING' },
      { label: '已送达', value: 'DELIVERED' },
      { label: '已签收', value: 'SIGNED' },
      { label: '异常', value: 'EXCEPTION' },
      { label: '已取消', value: 'CANCELLED' }
    ];
    
    // 对话框状态
    const detailVisible = ref(false);
    const mapVisible = ref(false);
    const issueVisible = ref(false);
    const selectedTracking = ref(null);
    
    // 问题反馈表单
    const issueForm = reactive({
      trackingNumber: '',
      type: '',
      title: '',
      description: '',
      priority: '一般'
    });
    
    // 表单验证规则
    const issueRules = {
      type: [
        { required: true, message: '请选择问题类型', trigger: 'blur' }
      ],
      title: [
        { required: true, message: '请输入问题标题', trigger: 'blur' }
      ],
      description: [
        { required: true, message: '请输入问题描述', trigger: 'blur' }
      ]
    };
    
    // 方法
    const getTrackingList = async () => {
      loading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 模拟数据
        const mockData = {
          total: 75,
          data: Array.from({ length: 20 }, (_, index) => {
            const status = ['PENDING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERING', 'DELIVERED', 'SIGNED', 'EXCEPTION'][index % 7];
            const currentDate = new Date();
            const daysAgo = index % 15;
            const shipDate = new Date();
            shipDate.setDate(currentDate.getDate() - daysAgo);
            
            const estimatedArrival = new Date(shipDate);
            estimatedArrival.setDate(shipDate.getDate() + 3 + Math.floor(Math.random() * 5));
            
            const actualArrival = status === 'DELIVERED' || status === 'SIGNED' ? new Date(estimatedArrival) : '';
            if (actualArrival) {
              actualArrival.setDate(estimatedArrival.getDate() + (Math.random() > 0.7 ? -1 : Math.random() > 0.7 ? 1 : 0));
            }
            
            const lastUpdate = new Date();
            lastUpdate.setDate(currentDate.getDate() - (daysAgo > 0 ? Math.floor(Math.random() * daysAgo) : 0));
            lastUpdate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0);
            
            return {
              id: index + 1,
              noteNumber: `DN${2024}${String(index + 1).padStart(5, '0')}`,
              executionNumber: `SE${2024}${String(index + 50).padStart(4, '0')}`,
              orderNumber: `SO${2024}${String(index + 100).padStart(4, '0')}`,
              customerName: `客户${String(index + 1).padStart(3, '0')}`,
              deliveryDate: shipDate.toISOString().split('T')[0],
              deliverer: `发货人${index % 5 + 1}`,
              consignee: `收货人${index % 8 + 1}`,
              consigneePhone: `1390013900${index}`,
              logisticsCompany: `物流公司${index % 4 + 1}`,
              trackingNumber: `LP${index + 1000}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
              transportType: ['ROAD', 'RAILWAY', 'WATER', 'AIR'][index % 4],
              warehouseName: `仓库${index % 3 + 1}`,
              shipToAddress: `上海市浦东新区张江高科技园区${index + 100}号`,
              status: status,
              lastUpdateTime: lastUpdate.toISOString().replace('T', ' ').substring(0, 19),
              estimatedArrivalTime: estimatedArrival.toISOString().replace('T', ' ').substring(0, 19),
              actualArrivalTime: actualArrival ? actualArrival.toISOString().replace('T', ' ').substring(0, 19) : '',
              isException: status === 'EXCEPTION',
              createdAt: shipDate.toISOString().replace('T', ' ').substring(0, 19),
              totalQuantity: Math.floor(Math.random() * 500) + 100,
              items: Array.from({ length: 2 }, (_, itemIndex) => ({
                productCode: `PROD${String(itemIndex + 200).padStart(4, '0')}`,
                productName: `产品${itemIndex + 200}`,
                productSpec: `规格${itemIndex + 1}`,
                unit: ['个', '件', '箱'][itemIndex % 3],
                quantity: Math.floor(Math.random() * 300) + 50,
                batchNumber: `BATCH${index + 1}${itemIndex}`,
                remark: `货物备注${itemIndex + 1}`
              })),
              logisticsDetails: generateLogisticsDetails(status, shipDate, lastUpdate),
              issues: status === 'EXCEPTION' ? generateIssue() : []
            };
          }))
        };
        
        trackingList.value = mockData.data;
        total.value = mockData.total;
      } catch (error) {
        ElMessage.error('获取物流跟踪列表失败');
        console.error('获取物流跟踪列表失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // 生成物流详情
    const generateLogisticsDetails = (status, shipDate, lastUpdate) => {
      const details = [];
      const statusMap = {
        'PENDING': ['待发货'],
        'SHIPPED': ['待发货', '已发货'],
        'IN_TRANSIT': ['待发货', '已发货', '运输中'],
        'DELIVERING': ['待发货', '已发货', '运输中', '派送中'],
        'DELIVERED': ['待发货', '已发货', '运输中', '派送中', '已送达'],
        'SIGNED': ['待发货', '已发货', '运输中', '派送中', '已送达', '已签收'],
        'EXCEPTION': ['待发货', '已发货', '运输中', '异常']
      };
      
      const statuses = statusMap[status] || [];
      
      statuses.forEach((currentStatus, index) => {
        const logDate = new Date(shipDate);
        logDate.setDate(logDate.getDate() + index);
        logDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0);
        
        const locations = ['发货仓库', '分拣中心', '中转中心', '派送站点', '目的地'];
        const descriptions = [
          '订单已创建，等待发货',
          '货物已发出，正在运输中',
          '包裹已到达中转中心，准备继续运输',
          '包裹已到达派送站点，准备派送',
          '包裹已送达指定地点',
          '货物已由客户签收'
        ];
        
        details.push({
          timestamp: logDate.toISOString().replace('T', ' ').substring(0, 19),
          status: currentStatus,
          location: index < locations.length ? locations[index] : locations[locations.length - 1],
          description: index < descriptions.length ? descriptions[index] : descriptions[descriptions.length - 1],
          operator: index === statuses.length - 1 ? '系统' : `操作人员${index + 1}`
        });
      });
      
      return details;
    };
    
    // 生成问题记录
    const generateIssue = () => {
      const issueTypes = ['延迟派送', '包裹丢失', '包裹损坏', '信息不符', '其他问题'];
      const randomType = issueTypes[Math.floor(Math.random() * issueTypes.length)];
      
      return [{
        id: 1,
        title: `物流问题反馈: ${randomType}`,
        description: `货物在运输过程中遇到${randomType}问题，需要及时处理。`,
        type: randomType,
        reporter: `用户${Math.floor(Math.random() * 10) + 1}`,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 3)).toISOString().replace('T', ' ').substring(0, 19),
        handler: Math.random() > 0.5 ? `客服${Math.floor(Math.random() * 5) + 1}` : '',
        solution: Math.random() > 0.5 ? '问题已处理，已安排重新派送' : '',
        handledAt: Math.random() > 0.5 ? new Date().toISOString().replace('T', ' ').substring(0, 19) : ''
      }];
    };
    
    const handleSearch = () => {
      pagination.currentPage = 1;
      getTrackingList();
    };
    
    const resetSearch = () => {
      Object.assign(searchForm, {
        noteNumber: '',
        executionNumber: '',
        orderNumber: '',
        customerName: '',
        trackingNumber: '',
        logisticsCompany: '',
        status: '',
        deliveryDateRange: []
      });
      handleSearch();
    };
    
    const handleSelectionChange = (val) => {
      selectedRows.value = val;
    };
    
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
      getTrackingList();
    };
    
    const handleCurrentChange = (current) => {
      pagination.currentPage = current;
      getTrackingList();
    };
    
    const exportData = () => {
      ElMessage.info('导出功能开发中');
    };
    
    const batchRefresh = () => {
      if (selectedRows.value.length === 0) {
        ElMessage.warning('请先选择要刷新的数据');
        return;
      }
      
      ElMessageBox.confirm(
        `确定要刷新选中的 ${selectedRows.value.length} 条物流信息吗？`,
        '确认刷新',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(async () => {
        loading.value = true;
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 1000));
          ElMessage.success(`已刷新 ${selectedRows.value.length} 条物流信息`);
          getTrackingList();
        } catch (error) {
          ElMessage.error('刷新失败');
        } finally {
          loading.value = false;
        }
      });
    };
    
    const batchExportTracking = () => {
      if (selectedRows.value.length === 0) {
        ElMessage.warning('请先选择要导出的数据');
        return;
      }
      
      ElMessage.info(`即将导出 ${selectedRows.value.length} 条物流跟踪记录`);
    };
    
    const viewTrackingDetail = (row) => {
      selectedTracking.value = JSON.parse(JSON.stringify(row));
      detailVisible.value = true;
    };
    
    const refreshTracking = async (row) => {
      trackingLoading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 模拟更新物流信息
        const refreshedDetails = generateLogisticsDetails(row.status, new Date(row.deliveryDate), new Date());
        
        if (selectedTracking.value && selectedTracking.value.id === row.id) {
          selectedTracking.value.logisticsDetails = refreshedDetails;
          selectedTracking.value.lastUpdateTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
        }
        
        ElMessage.success('物流信息已更新');
      } catch (error) {
        ElMessage.error('刷新物流信息失败');
      } finally {
        trackingLoading.value = false;
      }
    };
    
    const viewDeliveryNote = (row) => {
      ElMessage.info(`正在打开发货单：${row.noteNumber}`);
    };
    
    const viewMap = (row) => {
      selectedTracking.value = JSON.parse(JSON.stringify(row));
      mapVisible.value = true;
    };
    
    const exportTrackingRecord = (row) => {
      ElMessage.info(`正在导出物流跟踪记录：${row.trackingNumber}`);
    };
    
    const reportIssue = (row) => {
      issueForm.trackingNumber = row.trackingNumber;
      issueVisible.value = true;
    };
    
    const submitIssue = async () => {
      // 验证表单
      if (!issueForm.type) {
        ElMessage.warning('请选择问题类型');
        return;
      }
      
      if (!issueForm.title) {
        ElMessage.warning('请输入问题标题');
        return;
      }
      
      if (!issueForm.description) {
        ElMessage.warning('请输入问题描述');
        return;
      }
      
      loading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        
        ElMessage.success('问题反馈已提交');
        issueVisible.value = false;
        
        // 重置表单
        resetIssueForm();
        
        // 刷新列表
        getTrackingList();
      } catch (error) {
        ElMessage.error('提交失败');
      } finally {
        loading.value = false;
      }
    };
    
    const resetIssueForm = () => {
      Object.assign(issueForm, {
        trackingNumber: '',
        type: '',
        title: '',
        description: '',
        priority: '一般'
      });
    };
    
    const highlightPoint = (index) => {
      ElMessage.info(`已高亮 ${index + 1} 号节点`);
    };
    
    const getStatusLabel = (status) => {
      const statusMap = trackingStatuses.reduce((map, item) => {
        map[item.value] = item.label;
        return map;
      }, {});
      return statusMap[status] || status;
    };
    
    const getStatusTagType = (status) => {
      const typeMap = {
        PENDING: 'info',
        SHIPPED: 'primary',
        IN_TRANSIT: 'primary',
        DELIVERING: 'warning',
        DELIVERED: 'success',
        SIGNED: 'success',
        EXCEPTION: 'danger',
        CANCELLED: 'danger'
      };
      return typeMap[status] || 'info';
    };
    
    const getTransportTypeLabel = (type) => {
      const typeMap = {
        ROAD: '公路运输',
        RAILWAY: '铁路运输',
        WATER: '水路运输',
        AIR: '航空运输'
      };
      return typeMap[type] || type;
    };
    
    const formatTime = (timeStr) => {
      if (!timeStr) return '';
      return timeStr;
    };
    
    const getTransportDuration = (tracking) => {
      if (!tracking.actualShipTime) return '-';
      
      const startDate = new Date(tracking.actualShipTime);
      const endDate = tracking.actualArrivalTime ? new Date(tracking.actualArrivalTime) : new Date();
      
      const durationMs = endDate - startDate;
      const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      return `${days}天${hours}小时`;
    };
    
    // 初始化
    onMounted(() => {
      getTrackingList();
    });
    
    return {
      loading,
      trackingLoading,
      trackingList,
      total,
      selectedRows,
      pagination,
      searchForm,
      trackingStatuses,
      detailVisible,
      mapVisible,
      issueVisible,
      selectedTracking,
      issueForm,
      issueRules,
      handleSearch,
      resetSearch,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      exportData,
      batchRefresh,
      batchExportTracking,
      viewTrackingDetail,
      refreshTracking,
      viewDeliveryNote,
      viewMap,
      exportTrackingRecord,
      reportIssue,
      submitIssue,
      highlightPoint,
      getStatusLabel,
      getStatusTagType,
      getTransportTypeLabel,
      formatTime,
      getTransportDuration
    };
  }
};
</script>

<style scoped>
.logistics-tracking {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 10px 0 0;
  font-size: 24px;
  font-weight: 500;
}

.search-section {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 15px;
}

.search-actions {
  display: flex;
  gap: 10px;
}

.table-section {
  margin-top: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.batch-actions {
  display: flex;
  gap: 10px;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 物流详情样式 */
.tracking-detail {
  padding: 10px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-left h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.header-right {
  display: flex;
  gap: 10px;
}

.tracking-info {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.loading-text {
  font-size: 14px;
  color: #909399;
}

.tracking-timeline {
  margin-bottom: 20px;
}

.log-content {
  background-color: #f5f7fa;
  padding: 10px 15px;
  border-radius: 4px;
  min-width: 400px;
}

.log-status {
  font-weight: 600;
  margin-bottom: 5px;
}

.log-location {
  color: #409eff;
  margin-bottom: 5px;
}

.log-description {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 5px;
}

.log-operator {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

.tracking-products {
  margin-bottom: 20px;
}

.total-info {
  margin-top: 15px;
  text-align: right;
  font-size: 16px;
  font-weight: 500;
}

.tracking-issues {
  margin-bottom: 20px;
}

.issue-content {
  background-color: #fef0f0;
  padding: 10px 15px;
  border-radius: 4px;
  min-width: 400px;
}

.issue-title {
  font-weight: 600;
  color: #f56c6c;
  margin-bottom: 5px;
}

.issue-description {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 5px;
}

.issue-reporter {
  font-size: 12px;
  color: #909399;
  margin: 0 0 10px;
}

.issue-solution {
  background-color: #f0f9ff;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

.solution-title {
  font-weight: 600;
  color: #409eff;
  margin: 0 0 5px;
}

.solution-handler,
.solution-time {
  font-size: 12px;
  color: #909399;
  margin: 5px 0 0;
}

/* 地图样式 */
.map-section {
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
}

.map-info {
  display: flex;
  gap: 30px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item .label {
  font-weight: 500;
}

.map-container {
  flex: 1;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 15px;
  position: relative;
}

.map-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.route-display {
  margin-top: 20px;
  width: 80%;
  max-width: 800px;
}

.route-point {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.start-point .el-icon {
  color: #67c23a;
  font-size: 20px;
}

.end-point .el-icon {
  color: #f56c6c;
  font-size: 20px;
}

.end-point.active .el-icon {
  color: #67c23a;
}

.route-line {
  height: 80px;
  border-left: 2px dashed #dcdfe6;
  margin-left: 10px;
  padding-left: 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

.route-mid-point {
  display: flex;
  align-items: center;
  gap: 10px;
}

.route-mid-point .el-icon {
  color: #409eff;
  font-size: 16px;
}

.map-bottom {
  flex: 0 0 200px;
}

.route-key-points {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 10px;
}

.key-point {
  flex: 0 0 200px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.key-point:hover {
  background-color: #ecf5ff;
}

.key-point.active {
  background-color: #ecf5ff;
  border: 1px solid #409eff;
}

.point-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.point-status {
  font-weight: 600;
  margin-bottom: 5px;
}

.point-location {
  color: #409eff;
  margin-bottom: 5px;
}

.point-desc {
  font-size: 12px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 响应式样式 */
@media (max-width: 1200px) {
  .map-info {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-start;
  }
  
  .log-content,
  .issue-content {
    min-width: auto;
  }
}
</style>