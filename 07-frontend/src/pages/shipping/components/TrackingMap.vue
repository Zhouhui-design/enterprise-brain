<template>
  <div class="tracking-map">
    <!-- 地图工具栏 -->
    <div class="map-toolbar">
      <el-row :gutter="15">
        <el-col :span="8">
          <el-input
            v-model="searchOrderNo"
            placeholder="搜索订单号/运单号"
            prefix-icon="el-icon-search"
            clearable
            @keyup.enter="searchTracking"
          />
        </el-col>
        <el-col :span="6">
          <el-select
            v-model="mapType"
            placeholder="选择地图类型"
            clearable
          >
            <el-option label="标准地图" value="standard" />
            <el-option label="卫星地图" value="satellite" />
            <el-option label="交通地图" value="traffic" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select
            v-model="trackingStatusFilter"
            placeholder="筛选状态"
            clearable
          >
            <el-option label="运输中" value="IN_TRANSIT" />
            <el-option label="已发货" value="SHIPPED" />
            <el-option label="已签收" value="DELIVERED" />
            <el-option label="异常" value="EXCEPTION" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button
            type="primary"
            @click="searchTracking"
          >
            <el-icon><Search /></el-icon>
            查询
          </el-button>
        </el-col>
      </el-row>
    </div>
    
    <!-- 地图区域 -->
    <div class="map-container">
      <div v-if="loading" class="map-loading">
        <el-loading-spinner size="large" />
        <p>加载地图中...</p>
      </div>
      
      <div v-else class="map-content">
        <!-- 模拟地图容器 -->
        <div class="map-mock" ref="mapMock">
          <!-- 地图控制按钮 -->
          <div class="map-controls">
            <el-button
              circle
              size="small"
              @click="zoomIn"
              class="control-btn"
              title="放大"
            >
              <el-icon><ZoomIn /></el-icon>
            </el-button>
            <el-button
              circle
              size="small"
              @click="zoomOut"
              class="control-btn"
              title="缩小"
            >
              <el-icon><ZoomOut /></el-icon>
            </el-button>
            <el-button
              circle
              size="small"
              @click="resetMapView"
              class="control-btn"
              title="重置视图"
            >
              <el-icon><Refresh /></el-icon>
            </el-button>
            <el-button
              circle
              size="small"
              @click="toggleFullscreen"
              class="control-btn"
              :title="isFullscreen ? '退出全屏' : '全屏查看'"
            >
              <el-icon>{{ isFullscreen ? <ZoomOutMap /> : <ZoomInMap /> }}</el-icon>
            </el-button>
          </div>
          
          <!-- 地图图例 -->
          <div class="map-legend">
            <h4>图例</h4>
            <div class="legend-item">
              <div class="legend-icon start-point"></div>
              <span>起点</span>
            </div>
            <div class="legend-item">
              <div class="legend-icon end-point"></div>
              <span>终点</span>
            </div>
            <div class="legend-item">
              <div class="legend-icon current-location"></div>
              <span>当前位置</span>
            </div>
            <div class="legend-item">
              <div class="legend-icon in-transit"></div>
              <span>运输中</span>
            </div>
            <div class="legend-item">
              <div class="legend-icon delivered"></div>
              <span>已送达</span>
            </div>
            <div class="legend-icon">
              <div class="legend-line normal"></div>
              <span>正常路线</span>
            </div>
            <div class="legend-item">
              <div class="legend-line exception"></div>
              <span>异常路线</span>
            </div>
          </div>
          
          <!-- 模拟地图内容 -->
          <div class="map-content-inner" :class="mapTypeClass">
            <!-- 地图背景 -->
            <div class="map-grid"></div>
            
            <!-- 起点 -->
            <div
              class="map-marker start-point"
              :style="{ left: '20%', top: '30%' }"
              @click="showMarkerInfo('origin')"
            >
              <div class="marker-icon">
                <el-icon><LocationFilled /></el-icon>
              </div>
              <div class="marker-label">发货地</div>
            </div>
            
            <!-- 终点 -->
            <div
              class="map-marker end-point"
              :style="{ left: '75%', top: '65%' }"
              @click="showMarkerInfo('destination')"
            >
              <div class="marker-icon">
                <el-icon><Flag /></el-icon>
              </div>
              <div class="marker-label">收货地</div>
            </div>
            
            <!-- 当前位置 -->
            <div
              v-if="currentTracking"
              class="map-marker current-location"
              :style="{ left: currentPosition.x + '%', top: currentPosition.y + '%' }"
              @click="showMarkerInfo('current')"
            >
              <div class="marker-icon">
                <el-icon><Guide /></el-icon>
              </div>
              <div class="marker-label">当前位置</div>
              <div class="location-pulse"></div>
            </div>
            
            <!-- 途经点 -->
            <div
              v-for="(point, index) in transitPoints"
              :key="index"
              class="map-marker transit-point"
              :style="{ left: point.x + '%', top: point.y + '%' }"
              :class="{ 'delivered': point.delivered }"
              @click="showMarkerInfo('transit', point, index)"
            >
              <div class="marker-icon">
                <el-icon><Position /></el-icon>
              </div>
              <div class="marker-label">{{ point.name }}</div>
            </div>
            
            <!-- 路线绘制 -->
            <svg class="route-svg" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <!-- 完整路线 -->
              <path
                class="route-line normal"
                :d="routePath"
                fill="none"
                :stroke-dasharray="showProgress ? progressDasharray : 'none'"
              />
              
              <!-- 异常路线段 -->
              <path
                v-if="hasException"
                class="route-line exception"
                d="M 35,40 L 45,50 L 55,45"
                fill="none"
              />
            </svg>
            
            <!-- 物流信息卡片 -->
            <div v-if="selectedMarkerInfo" class="info-card" :style="infoCardStyle">
              <div class="info-card-header">
                <h4>{{ selectedMarkerInfo.title }}</h4>
                <el-button
                  circle
                  size="small"
                  @click="selectedMarkerInfo = null"
                  class="close-btn"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
              <div class="info-card-content">
                <el-descriptions :column="1" :size="'small'">
                  <el-descriptions-item label="位置">{{ selectedMarkerInfo.location }}</el-descriptions-item>
                  <el-descriptions-item label="时间">{{ selectedMarkerInfo.time }}</el-descriptions-item>
                  <el-descriptions-item v-if="selectedMarkerInfo.status" label="状态">{{ selectedMarkerInfo.status }}</el-descriptions-item>
                  <el-descriptions-item v-if="selectedMarkerInfo.description" label="说明">{{ selectedMarkerInfo.description }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 物流信息侧边栏 -->
    <div class="tracking-sidebar">
      <div class="sidebar-header">
        <el-icon><DataAnalysis /></el-icon>
        <span>物流信息</span>
        <el-button
          circle
          size="small"
          @click="toggleSidebar"
          class="toggle-btn"
          :title="sidebarVisible ? '隐藏侧边栏' : '显示侧边栏'"
        >
          <el-icon>{{ sidebarVisible ? <ArrowLeft /> : <ArrowRight /> }}</el-icon>
        </el-button>
      </div>
      
      <div v-if="sidebarVisible" class="sidebar-content">
        <!-- 运单信息 -->
        <el-card shadow="never" class="tracking-card">
          <template #header>
            <div class="card-header-title">
              <el-icon><Document /></el-icon>
              <span>运单信息</span>
            </div>
          </template>
          
          <el-descriptions :column="1" :size="'small'" border>
            <el-descriptions-item label="订单号">{{ currentTracking?.orderNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="运单号">{{ currentTracking?.trackingNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="物流公司">{{ currentTracking?.logisticsCompany || '-' }}</el-descriptions-item>
            <el-descriptions-item label="发货时间">{{ formatDate(currentTracking?.shipTime) || '-' }}</el-descriptions-item>
            <el-descriptions-item label="预计到达">{{ formatDate(currentTracking?.estimatedArrivalTime) || '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="getStatusTagType(currentTracking?.status)">
                {{ getStatusText(currentTracking?.status) }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
        
        <!-- 行程进度 -->
        <el-card shadow="never" class="tracking-card">
          <template #header>
            <div class="card-header-title">
              <el-icon><Timer /></el-icon>
              <span>行程进度</span>
            </div>
          </template>
          
          <div class="progress-info">
            <div class="progress-stats">
              <div class="stat-item">
                <div class="stat-value">{{ Math.round(progressPercentage) }}%</div>
                <div class="stat-label">完成进度</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <div class="stat-value">{{ currentTracking?.distance || 0 }}km</div>
                <div class="stat-label">总距离</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <div class="stat-value">{{ remainingTime }}</div>
                <div class="stat-label">预计剩余</div>
              </div>
            </div>
            
            <el-progress
              :percentage="progressPercentage"
              :status="getProgressStatus()"
              :color="getProgressColor()"
              :stroke-width="10"
              :text-inside="true"
              class="progress-bar"
            />
          </div>
        </el-card>
        
        <!-- 物流轨迹 -->
        <el-card shadow="never" class="tracking-card">
          <template #header>
            <div class="card-header-title">
              <el-icon><TrendCharts /></el-icon>
              <span>物流轨迹</span>
              <el-badge :value="trackingTraces.length" :max="99" class="badge-count" />
            </div>
          </template>
          
          <div class="tracking-timeline">
            <el-timeline :reverse="false">
              <el-timeline-item
                v-for="(trace, index) in trackingTraces"
                :key="index"
                :timestamp="formatDateTime(trace.timestamp)"
                :type="getTraceType(trace, index)"
                :icon="getTraceIcon(trace, index)"
              >
                <div class="timeline-content">
                  <h5>{{ trace.location }}</h5>
                  <p>{{ trace.description }}</p>
                  <el-tag
                    v-if="trace.status"
                    :type="getStatusTagType(trace.status)"
                    size="small"
                    class="status-tag"
                  >
                    {{ getStatusText(trace.status) }}
                  </el-tag>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
        
        <!-- 异常提醒 -->
        <el-card
          v-if="hasException"
          shadow="never"
          class="tracking-card exception-card"
        >
          <template #header>
            <div class="card-header-title exception-header">
              <el-icon><WarningFilled /></el-icon>
              <span>异常提醒</span>
            </div>
          </template>
          
          <div class="exception-content">
            <el-alert
              :title="exceptionInfo.title"
              :description="exceptionInfo.description"
              type="error"
              :closable="false"
              show-icon
            />
            <div class="exception-actions">
              <el-button
                type="primary"
                size="small"
                @click="handleException"
              >
                <el-icon><Tools /></el-icon>
                处理异常
              </el-button>
              <el-button
                size="small"
                @click="ignoreException"
              >
                <el-icon><View /></el-icon>
                忽略
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>
    
    <!-- 操作面板 -->
    <div class="operation-panel">
      <el-button-group>
        <el-button
          type="primary"
          @click="showFullTrackingDetails"
          :disabled="!currentTracking"
        >
          <el-icon><DocumentChecked /></el-icon>
          查看详情
        </el-button>
        <el-button
          @click="refreshTrackingData"
          :loading="refreshing"
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button
          @click="shareTracking"
          :disabled="!currentTracking"
        >
          <el-icon><Share /></el-icon>
          分享
        </el-button>
      </el-button-group>
      
      <div class="real-time-status">
        <span class="status-label">实时状态：</span>
        <el-tag :type="getStatusTagType(currentTracking?.status)">
          {{ getStatusText(currentTracking?.status) || '未开始' }}
        </el-tag>
      </div>
    </div>
    
    <!-- 全屏遮罩 -->
    <div
      v-if="isFullscreen"
      class="fullscreen-mask"
      @click.self="toggleFullscreen"
    >
      <div class="fullscreen-map" ref="fullscreenMapRef">
        <!-- 这里会复制地图内容 -->
      </div>
    </div>
    
    <!-- 异常处理对话框 -->
    <el-dialog
      v-model="showExceptionDialog"
      title="处理物流异常"
      width="500px"
      :before-close="handleExceptionDialogClose"
    >
      <el-form
        ref="exceptionFormRef"
        :model="exceptionForm"
        label-width="100px"
      >
        <el-form-item label="异常类型">
          <el-select v-model="exceptionForm.type" placeholder="选择异常类型">
            <el-option label="运输延迟" value="DELAY" />
            <el-option label="包裹破损" value="DAMAGED" />
            <el-option label="地址错误" value="WRONG_ADDRESS" />
            <el-option label="其他异常" value="OTHER" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="异常描述">
          <el-input
            v-model="exceptionForm.description"
            type="textarea"
            placeholder="请详细描述异常情况"
            :rows="4"
          />
        </el-form-item>
        
        <el-form-item label="处理方案">
          <el-radio-group v-model="exceptionForm.solution">
            <el-radio label="联系物流公司">联系物流公司</el-radio>
            <el-radio label="重新发货">重新发货</el-radio>
            <el-radio label="退款处理">退款处理</el-radio>
            <el-radio label="其他方案">其他方案</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input
            v-model="exceptionForm.remark"
            type="textarea"
            placeholder="请输入处理备注"
            :rows="2"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="handleExceptionDialogClose">取消</el-button>
        <el-button type="primary" @click="submitException">提交处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search,
  ZoomIn,
  ZoomOut,
  Refresh,
  ZoomInMap,
  ZoomOutMap,
  LocationFilled,
  Flag,
  Guide,
  Position,
  Close,
  DataAnalysis,
  ArrowLeft,
  ArrowRight,
  Document,
  Timer,
  TrendCharts,
  WarningFilled,
  Tools,
  View,
  DocumentChecked,
  Share
} from '@element-plus/icons-vue';

export default {
  name: 'TrackingMap',
  components: {
    Search,
    ZoomIn,
    ZoomOut,
    Refresh,
    ZoomInMap,
    ZoomOutMap,
    LocationFilled,
    Flag,
    Guide,
    Position,
    Close,
    DataAnalysis,
    ArrowLeft,
    ArrowRight,
    Document,
    Timer,
    TrendCharts,
    WarningFilled,
    Tools,
    View,
    DocumentChecked,
    Share
  },
  props: {
    orderNo: {
      type: String,
      default: ''
    },
    trackingNo: {
      type: String,
      default: ''
    }
  },
  emits: ['tracking-updated', 'exception-handled', 'details-shown'],
  setup(props, { emit }) {
    // 状态管理
    const loading = ref(false);
    const refreshing = ref(false);
    const mapZoom = ref(100); // 地图缩放级别 100% 为默认
    const mapType = ref('standard'); // 地图类型
    const searchOrderNo = ref('');
    const trackingStatusFilter = ref('');
    const isFullscreen = ref(false);
    const sidebarVisible = ref(true);
    const selectedMarkerInfo = ref(null);
    const showExceptionDialog = ref(false);
    
    // 地图元素引用
    const mapMock = ref(null);
    const fullscreenMapRef = ref(null);
    
    // 当前位置（模拟动态更新）
    const currentPosition = ref({ x: 50, y: 45 });
    
    // 途经点
    const transitPoints = ref([
      { id: 1, name: '转运中心A', x: 35, y: 40, delivered: true, location: '北京市朝阳区', time: '2023-07-15 08:30:00', status: '已发出' },
      { id: 2, name: '配送站B', x: 45, y: 50, delivered: true, location: '河北省石家庄市', time: '2023-07-15 14:20:00', status: '已签收' },
      { id: 3, name: '中转站C', x: 55, y: 45, delivered: false, location: '河南省郑州市', time: '2023-07-15 20:10:00', status: '运输中' }
    ]);
    
    // 当前物流信息（模拟数据）
    const currentTracking = ref({
      orderNo: 'ORD20230715001',
      trackingNo: 'SF1234567890',
      logisticsCompany: '顺丰速运',
      shipTime: '2023-07-15 08:00:00',
      estimatedArrivalTime: '2023-07-17 18:00:00',
      status: 'IN_TRANSIT',
      origin: {
        name: '北京仓库',
        address: '北京市朝阳区物流园区A区1栋',
        contact: '张经理',
        phone: '13800138001'
      },
      destination: {
        name: '上海客户',
        address: '上海市浦东新区张江高科技园区',
        contact: '李总',
        phone: '13900139001'
      },
      distance: 1300,
      currentLocation: '河南省郑州市',
      currentTime: '2023-07-16 10:30:00',
      driverInfo: {
        name: '王师傅',
        phone: '13700137001',
        vehicleNo: '豫A12345'
      }
    });
    
    // 物流轨迹（模拟数据）
    const trackingTraces = ref([
      {
        timestamp: '2023-07-16 10:30:00',
        location: '河南省郑州市中转中心',
        description: '快件正在转运中，下一站：上海市',
        status: 'IN_TRANSIT'
      },
      {
        timestamp: '2023-07-15 20:10:00',
        location: '河南省郑州市',
        description: '快件已到达郑州中转中心',
        status: 'ARRIVED'
      },
      {
        timestamp: '2023-07-15 14:20:00',
        location: '河北省石家庄市',
        description: '快件已到达石家庄配送站',
        status: 'ARRIVED'
      },
      {
        timestamp: '2023-07-15 08:30:00',
        location: '北京市朝阳区',
        description: '快件已从北京发出',
        status: 'SHIPPED'
      },
      {
        timestamp: '2023-07-15 08:00:00',
        location: '北京市朝阳区物流园区',
        description: '快件已揽收',
        status: 'COLLECTED'
      },
      {
        timestamp: '2023-07-14 18:30:00',
        location: '北京市',
        description: '订单已下单，等待揽收',
        status: 'ORDERED'
      }
    ]);
    
    // 异常信息（模拟数据）
    const hasException = ref(false);
    const exceptionInfo = reactive({
      id: 'EXC001',
      type: 'DELAY',
      title: '运输延迟通知',
      description: '由于河南境内大雨天气影响，快件可能会延迟1-2天送达，请耐心等待。',
      reportedTime: '2023-07-16 09:45:00',
      status: 'UNHANDLED'
    });
    
    // 异常处理表单
    const exceptionForm = reactive({
      type: 'DELAY',
      description: '',
      solution: '联系物流公司',
      remark: ''
    });
    
    // 计算属性
    const mapTypeClass = computed(() => `map-${mapType.value}`);
    
    const progressPercentage = computed(() => {
      // 根据当前位置计算进度百分比
      const totalPoints = transitPoints.value.length + 2; // 起点、途经点、终点
      const deliveredPoints = transitPoints.value.filter(p => p.delivered).length + 1; // 包括起点
      return Math.round((deliveredPoints / totalPoints) * 100);
    });
    
    const remainingTime = computed(() => {
      if (!currentTracking.value || !currentTracking.value.estimatedArrivalTime) return '--';
      
      const now = new Date();
      const estimated = new Date(currentTracking.value.estimatedArrivalTime);
      const diffMs = estimated - now;
      
      if (diffMs <= 0) return '已到达';
      
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        return `${diffDays}天${diffHours % 24}小时`;
      }
      return `${diffHours}小时`;
    });
    
    const routePath = computed(() => {
      // 生成SVG路径
      const path = [
        'M 20,30', // 起点
        'L 35,40', // 途经点1
        'L 45,50', // 途经点2
        'L 55,45', // 途经点3
        'L 75,65'  // 终点
      ];
      return path.join(' ');
    });
    
    const showProgress = computed(() => {
      return currentTracking.value?.status === 'IN_TRANSIT';
    });
    
    const progressDasharray = computed(() => {
      // 根据进度计算虚线
      const totalLength = 180; // 估算的总路径长度
      const progressLength = (progressPercentage.value / 100) * totalLength;
      return `${progressLength} ${totalLength - progressLength}`;
    });
    
    const infoCardStyle = computed(() => {
      if (!selectedMarkerInfo.value) return {};
      
      // 动态计算信息卡片位置
      const position = selectedMarkerInfo.value.position;
      return {
        left: `${position.x + 30}%`,
        top: `${position.y - 20}%`
      };
    });
    
    // 方法
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('zh-CN');
    };
    
    const formatDateTime = (dateStr) => {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleString('zh-CN');
    };
    
    const getStatusText = (status) => {
      const statusMap = {
        'ORDERED': '已下单',
        'COLLECTED': '已揽收',
        'SHIPPED': '已发货',
        'IN_TRANSIT': '运输中',
        'ARRIVED': '已到达',
        'DELIVERED': '已签收',
        'EXCEPTION': '异常',
        'RETURNED': '已退回'
      };
      return statusMap[status] || status;
    };
    
    const getStatusTagType = (status) => {
      const typeMap = {
        'ORDERED': 'info',
        'COLLECTED': 'primary',
        'SHIPPED': 'primary',
        'IN_TRANSIT': 'warning',
        'ARRIVED': 'success',
        'DELIVERED': 'success',
        'EXCEPTION': 'danger',
        'RETURNED': 'info'
      };
      return typeMap[status] || 'default';
    };
    
    const getTraceType = (trace, index) => {
      if (index === 0) return 'primary';
      return getStatusTagType(trace.status);
    };
    
    const getTraceIcon = (trace, index) => {
      if (index === 0) return 'el-icon-circle-check';
      return 'el-icon-tickets';
    };
    
    const getProgressStatus = () => {
      if (currentTracking.value?.status === 'DELIVERED') return 'success';
      if (currentTracking.value?.status === 'EXCEPTION') return 'exception';
      return '';
    };
    
    const getProgressColor = () => {
      if (currentTracking.value?.status === 'EXCEPTION') return '#f56c6c';
      return '#67c23a';
    };
    
    const showMarkerInfo = (type, point = null, index = -1) => {
      let info = null;
      
      switch (type) {
        case 'origin':
          info = {
            title: '发货地址',
            location: currentTracking.value?.origin.address || '',
            time: formatDateTime(currentTracking.value?.shipTime),
            status: '已发货',
            position: { x: 20, y: 30 }
          };
          break;
        case 'destination':
          info = {
            title: '收货地址',
            location: currentTracking.value?.destination.address || '',
            time: currentTracking.value?.status === 'DELIVERED' ? formatDateTime(currentTracking.value?.estimatedArrivalTime) : '预计 ' + formatDateTime(currentTracking.value?.estimatedArrivalTime),
            status: currentTracking.value?.status === 'DELIVERED' ? '已签收' : '待送达',
            position: { x: 75, y: 65 }
          };
          break;
        case 'current':
          info = {
            title: '当前位置',
            location: currentTracking.value?.currentLocation || '',
            time: formatDateTime(currentTracking.value?.currentTime),
            status: getStatusText(currentTracking.value?.status),
            description: `运输车辆: ${currentTracking.value?.driverInfo.vehicleNo || '-'}\n司机: ${currentTracking.value?.driverInfo.name || '-'}`,
            position: { ...currentPosition.value }
          };
          break;
        case 'transit':
          if (point) {
            info = {
              title: point.name,
              location: point.location,
              time: formatDateTime(point.time),
              status: point.status,
              position: { x: point.x, y: point.y }
            };
          }
          break;
      }
      
      selectedMarkerInfo.value = info;
    };
    
    const zoomIn = () => {
      if (mapZoom.value < 200) {
        mapZoom.value += 20;
        updateMapZoom();
      }
    };
    
    const zoomOut = () => {
      if (mapZoom.value > 60) {
        mapZoom.value -= 20;
        updateMapZoom();
      }
    };
    
    const updateMapZoom = () => {
      if (mapMock.value) {
        mapMock.value.style.transform = `scale(${mapZoom.value / 100})`;
        mapMock.value.style.transformOrigin = 'center center';
      }
    };
    
    const resetMapView = () => {
      mapZoom.value = 100;
      updateMapZoom();
      selectedMarkerInfo.value = null;
    };
    
    const toggleFullscreen = async () => {
      isFullscreen.value = !isFullscreen.value;
      
      if (isFullscreen.value) {
        // 进入全屏模式
        await nextTick();
        if (mapMock.value && fullscreenMapRef.value) {
          // 复制地图内容到全屏容器
          fullscreenMapRef.value.innerHTML = mapMock.value.innerHTML;
        }
      }
    };
    
    const toggleSidebar = () => {
      sidebarVisible.value = !sidebarVisible.value;
    };
    
    const searchTracking = async () => {
      if (!searchOrderNo.value && !props.orderNo && !props.trackingNo) {
        ElMessage.warning('请输入订单号或运单号');
        return;
      }
      
      try {
        loading.value = true;
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 这里可以根据搜索条件更新物流信息
        ElMessage.success('查询成功');
        
        // 触发事件
        emit('tracking-updated', currentTracking.value);
      } catch (error) {
        ElMessage.error('查询失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    };
    
    const refreshTrackingData = async () => {
      try {
        refreshing.value = true;
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 模拟动态更新位置
        if (currentPosition.value.x < 70) {
          currentPosition.value.x += 1;
          currentPosition.value.y += 0.5;
        }
        
        // 更新当前时间
        if (currentTracking.value) {
          currentTracking.value.currentTime = new Date().toLocaleString('zh-CN');
        }
        
        ElMessage.success('刷新成功');
        emit('tracking-updated', currentTracking.value);
      } catch (error) {
        ElMessage.error('刷新失败');
      } finally {
        refreshing.value = false;
      }
    };
    
    const showFullTrackingDetails = () => {
      // 显示详细的物流信息
      emit('details-shown', currentTracking.value);
      ElMessage.info('跳转到物流详情页面');
    };
    
    const shareTracking = async () => {
      try {
        // 模拟复制到剪贴板
        await navigator.clipboard.writeText(`物流单号: ${currentTracking.value?.trackingNo}\n物流公司: ${currentTracking.value?.logisticsCompany}`);
        ElMessage.success('物流信息已复制到剪贴板');
      } catch (error) {
        ElMessage.error('复制失败');
      }
    };
    
    const handleException = () => {
      showExceptionDialog.value = true;
    };
    
    const ignoreException = () => {
      ElMessageBox.confirm(
        '确定要忽略此异常吗？',
        '确认忽略',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        hasException.value = false;
        ElMessage.success('异常已忽略');
      }).catch(() => {
        // 用户取消
      });
    };
    
    const handleExceptionDialogClose = () => {
      showExceptionDialog.value = false;
    };
    
    const submitException = async () => {
      try {
        // 模拟提交处理
        await new Promise(resolve => setTimeout(resolve, 800));
        
        ElMessage.success('异常处理方案已提交');
        hasException.value = false;
        showExceptionDialog.value = false;
        
        // 触发事件
        emit('exception-handled', {
          ...exceptionInfo,
          ...exceptionForm,
          handledTime: new Date().toLocaleString('zh-CN'),
          status: 'HANDLED'
        });
      } catch (error) {
        ElMessage.error('提交失败');
      }
    };
    
    // 模拟动态更新物流位置
    const simulateLocationUpdate = () => {
      // 每10秒更新一次位置（仅在运输中状态）
      if (currentTracking.value?.status === 'IN_TRANSIT') {
        if (currentPosition.value.x < 70) {
          setTimeout(() => {
            currentPosition.value.x += 0.5;
            currentPosition.value.y += 0.25;
            simulateLocationUpdate();
          }, 10000);
        }
      }
    };
    
    // 初始化
    onMounted(() => {
      // 如果传入了订单号或运单号，自动查询
      if (props.orderNo || props.trackingNo) {
        searchOrderNo.value = props.orderNo || props.trackingNo;
        searchTracking();
      }
      
      // 开始模拟位置更新
      simulateLocationUpdate();
    });
    
    return {
      loading,
      refreshing,
      mapZoom,
      mapType,
      searchOrderNo,
      trackingStatusFilter,
      isFullscreen,
      sidebarVisible,
      selectedMarkerInfo,
      showExceptionDialog,
      mapMock,
      fullscreenMapRef,
      currentPosition,
      transitPoints,
      currentTracking,
      trackingTraces,
      hasException,
      exceptionInfo,
      exceptionForm,
      mapTypeClass,
      progressPercentage,
      remainingTime,
      routePath,
      showProgress,
      progressDasharray,
      infoCardStyle,
      formatDate,
      formatDateTime,
      getStatusText,
      getStatusTagType,
      getTraceType,
      getTraceIcon,
      getProgressStatus,
      getProgressColor,
      showMarkerInfo,
      zoomIn,
      zoomOut,
      resetMapView,
      toggleFullscreen,
      toggleSidebar,
      searchTracking,
      refreshTrackingData,
      showFullTrackingDetails,
      shareTracking,
      handleException,
      ignoreException,
      handleExceptionDialogClose,
      submitException
    };
  }
};
</script>

<style scoped>
.tracking-map {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 地图工具栏 */
.map-toolbar {
  padding: 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  z-index: 10;
}

/* 地图容器 */
.map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 500px;
}

.map-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #606266;
}

.map-content {
  height: 100%;
  position: relative;
}

.map-mock {
  width: 100%;
  height: 100%;
  position: relative;
  transition: transform 0.3s ease;
  overflow: hidden;
}

/* 地图样式 */
.map-standard {
  background-color: #e6f7ff;
  background-image: linear-gradient(#b3d9ff 1px, transparent 1px),
                    linear-gradient(90deg, #b3d9ff 1px, transparent 1px);
  background-size: 20px 20px;
}

.map-satellite {
  background-color: #f0f0f0;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23e6e6e6"/><path d="M0,50 Q25,30 50,50 T100,50" stroke="%23d9d9d9" fill="none"/><path d="M50,0 Q70,25 50,50 T50,100" stroke="%23d9d9d9" fill="none"/></svg>');
  background-size: 100px 100px;
}

.map-traffic {
  background-color: #f5f5f5;
  background-image: linear-gradient(#d9d9d9 1px, transparent 1px),
                    linear-gradient(90deg, #d9d9d9 1px, transparent 1px),
                    linear-gradient(45deg, #ffcccc 2px, transparent 2px);
  background-size: 20px 20px, 20px 20px, 100px 100px;
}

.map-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: linear-gradient(#bfbfbf 1px, transparent 1px),
                    linear-gradient(90deg, #bfbfbf 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.3;
  pointer-events: none;
}

/* 地图控制按钮 */
.map-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.control-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 地图图例 */
.map-legend {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 100;
  background-color: white;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  font-size: 12px;
}

.map-legend h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 500;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.legend-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  position: relative;
}

.legend-icon.start-point {
  background-color: #67c23a;
}

.legend-icon.end-point {
  background-color: #f56c6c;
}

.legend-icon.current-location {
  background-color: #409eff;
}

.legend-icon.in-transit {
  background-color: #e6a23c;
}

.legend-icon.delivered {
  background-color: #67c23a;
}

.legend-line {
  height: 3px;
  width: 20px;
  margin-right: 5px;
}

.legend-line.normal {
  background-color: #409eff;
}

.legend-line.exception {
  background-color: #f56c6c;
  position: relative;
}

.legend-line.exception::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: repeating-linear-gradient(
    90deg,
    #f56c6c,
    #f56c6c 5px,
    transparent 5px,
    transparent 8px
  );
}

/* 地图标记 */
.map-marker {
  position: absolute;
  cursor: pointer;
  transform: translate(-50%, -50%);
  z-index: 50;
  transition: transform 0.2s;
}

.map-marker:hover {
  transform: translate(-50%, -50%) scale(1.1);
}

.marker-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
  position: relative;
}

.marker-label {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  margin-top: 5px;
}

.marker-label::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-bottom-color: rgba(0, 0, 0, 0.7);
}

/* 不同类型标记样式 */
.map-marker.start-point .marker-icon {
  background-color: #67c23a;
}

.map-marker.end-point .marker-icon {
  background-color: #f56c6c;
}

.map-marker.current-location {
  animation: pulse 2s infinite;
}

.map-marker.current-location .marker-icon {
  background-color: #409eff;
}

.location-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #409eff;
  opacity: 0.3;
  animation: pulse-ring 2s infinite;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.05);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes pulse-ring {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

.map-marker.transit-point .marker-icon {
  background-color: #e6a23c;
}

.map-marker.transit-point.delivered .marker-icon {
  background-color: #67c23a;
}

/* 路线 */
.route-svg {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 20;
  pointer-events: none;
}

.route-line {
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.route-line.normal {
  stroke: #409eff;
}

.route-line.exception {
  stroke: #f56c6c;
  stroke-dasharray: 5, 5;
}

/* 信息卡片 */
.info-card {
  position: absolute;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.15);
  z-index: 200;
  min-width: 250px;
  max-width: 350px;
}

.info-card-header {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  border-radius: 4px 4px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-card-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.close-btn {
  padding: 0;
  width: 20px;
  height: 20px;
}

.info-card-content {
  padding: 12px 16px;
}

/* 侧边栏 */
.tracking-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  background-color: #f5f7fa;
  border-left: 1px solid #ebeef5;
  z-index: 100;
  transition: width 0.3s ease;
  overflow: hidden;
}

.tracking-sidebar:not(.sidebar-collapsed) {
  width: 380px;
}

.tracking-sidebar.sidebar-collapsed {
  width: 50px;
}

.sidebar-header {
  padding: 15px;
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.toggle-btn {
  position: absolute;
  left: -20px;
  top: 50%;
  transform: translateY(-50%);
  background-color: white;
  border-radius: 4px 0 0 4px;
  box-shadow: -2px 0 6px rgba(0, 0, 0, 0.1);
}

.sidebar-content {
  height: calc(100% - 50px);
  overflow-y: auto;
  padding: 15px;
}

.tracking-card {
  margin-bottom: 15px;
  border-radius: 4px;
  overflow: hidden;
}

.card-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  font-size: 14px;
}

.badge-count {
  margin-left: 5px;
}

/* 进度信息 */
.progress-info {
  padding: 10px 0;
}

.progress-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: #606266;
}

.stat-divider {
  width: 1px;
  background-color: #ebeef5;
  margin: 0 10px;
}

.progress-bar {
  margin-top: 10px;
}

/* 物流轨迹 */
.tracking-timeline {
  max-height: 300px;
  overflow-y: auto;
}

.timeline-content h5 {
  margin: 0 0 5px 0;
  font-size: 14px;
  font-weight: 500;
}

.timeline-content p {
  margin: 0 0 5px 0;
  font-size: 13px;
  color: #606266;
}

.status-tag {
  margin-top: 5px;
}

/* 异常卡片 */
.exception-card {
  border-left: 4px solid #f56c6c;
}

.exception-header {
  color: #f56c6c;
}

.exception-content {
  padding: 10px 0;
}

.exception-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* 操作面板 */
.operation-panel {
  padding: 15px;
  background-color: white;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.real-time-status {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #606266;
}

/* 全屏模式 */
.fullscreen-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fullscreen-map {
  width: 90%;
  height: 90%;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .tracking-sidebar:not(.sidebar-collapsed) {
    width: 320px;
  }
  
  .map-toolbar .el-col {
    margin-bottom: 10px;
  }
}

@media (max-width: 768px) {
  .tracking-sidebar {
    width: 100% !important;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }
  
  .tracking-sidebar.sidebar-visible {
    transform: translateX(0);
  }
  
  .map-toolbar {
    padding: 10px;
  }
  
  .map-toolbar .el-row {
    min-width: 0;
  }
  
  .operation-panel {
    flex-direction: column;
    align-items: stretch;
  }
  
  .operation-panel .el-button-group {
    width: 100%;
    display: flex;
  }
  
  .operation-panel .el-button-group .el-button {
    flex: 1;
  }
  
  .real-time-status {
    justify-content: center;
  }
  
  .map-legend {
    display: none;
  }
  
  .fullscreen-map {
    width: 95%;
    height: 95%;
  }
}
</style>