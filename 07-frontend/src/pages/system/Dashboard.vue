<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>欢迎使用企业大脑系统</h1>
      <p>今天是 {{ currentDate }}, 祝您工作愉快！</p>
    </div>
    
    <div class="dashboard-stats">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ 156 }}</div>
                <div class="stat-label">待处理任务</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon primary">
                <el-icon><Box /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ 42 }}</div>
                <div class="stat-label">今日入库</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon success">
                <el-icon><Upload /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ 38 }}</div>
                <div class="stat-label">今日出库</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon warning">
                <el-icon><Grid /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ 256 }}</div>
                <div class="stat-label">可用库位</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <div class="dashboard-content">
      <el-row :gutter="20">
        <el-col :xs="24" :md="12">
          <el-card class="content-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>最近活动</span>
              </div>
            </template>
            <div class="activity-list">
              <div v-for="(activity, index) in recentActivities" :key="index" class="activity-item">
                <div class="activity-time">{{ activity.time }}</div>
                <div class="activity-content">{{ activity.content }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :md="12">
          <el-card class="content-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>快速访问</span>
              </div>
            </template>
            <div class="quick-access">
              <el-row :gutter="15">
                <el-col :xs="6" :sm="4" :md="4" :lg="3" v-for="(item, index) in quickAccessItems" :key="index">
                  <div class="quick-item" @click="navigateTo(item.path)">
                    <div class="quick-icon" :class="item.iconClass">
                      <el-icon><component :is="item.icon" /></el-icon>
                    </div>
                    <div class="quick-label">{{ item.label }}</div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import { Document, Box, Upload, Grid, Download, SwitchButton, Postcard, Check, Edit } from '@element-plus/icons-vue'

export default {
  name: 'Dashboard',
  components: {
    Document,
    Box,
    Upload,
    Grid,
    Download,
    SwitchButton,
    Postcard,
    Check,
    Edit
  },
  data() {
    return {
      recentActivities: [
        { time: '10:23', content: '采购订单PO20240523已创建' },
        { time: '09:45', content: '生产工单WO2024052301已完成' },
        { time: '09:12', content: '入库单IN20240523001已审核' },
        { time: '08:58', content: '质量检验报告QIR20240523001已生成' },
        { time: '08:30', content: '库存盘点计划ICP20240523已发布' }
      ],
      quickAccessItems: [
        { label: '入库管理', path: '/warehouse/in', icon: 'Download', iconClass: 'primary' },
        { label: '出库管理', path: '/warehouse/out', icon: 'Upload', iconClass: 'success' },
        { label: '库存转移', path: '/warehouse/stock-transfer', icon: 'SwitchButton', iconClass: 'warning' },
        { label: '库存盘点', path: '/warehouse/inventory-count', icon: 'Postcard', iconClass: 'info' },
        { label: '库位管理', path: '/warehouse/location-management', icon: 'Grid', iconClass: 'danger' },
        { label: '回厂管理', path: '/receipt/list', icon: 'Box', iconClass: 'primary' },
        { label: '质量检验', path: '/receipt/quality-check', icon: 'Check', iconClass: 'success' },
        { label: '检验表单', path: '/receipt/inspection-form', icon: 'Edit', iconClass: 'info' }
      ]
    }
  },
  computed: {
    currentDate() {
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekday = weekdays[date.getDay()];
      return `${year}年${month}月${day}日 ${weekday}`;
    }
  },
  methods: {
    navigateTo(path) {
      this.$router.push(path);
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-header {
  margin-bottom: 30px;
}

.dashboard-header h1 {
  font-size: 28px;
  color: #303133;
  margin-bottom: 10px;
}

.dashboard-header p {
  font-size: 16px;
  color: #606266;
}

.dashboard-stats {
  margin-bottom: 30px;
}

.stat-card {
  height: 100%;
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 20px 0;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #f0f9ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #409eff;
  margin-right: 20px;
}

.stat-icon.primary {
  background-color: #e6f7ff;
  color: #1890ff;
}

.stat-icon.success {
  background-color: #f6ffed;
  color: #52c41a;
}

.stat-icon.warning {
  background-color: #fff7e6;
  color: #fa8c16;
}

.stat-icon.info {
  background-color: #e6f4ff;
  color: #1890ff;
}

.stat-icon.danger {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.stat-info .stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-info .stat-label {
  font-size: 14px;
  color: #606266;
  margin-top: 8px;
}

.dashboard-content {
  margin-bottom: 30px;
}

.content-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.activity-list {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: flex-start;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-time {
  width: 60px;
  color: #909399;
  font-size: 12px;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  color: #303133;
  line-height: 1.5;
}

.quick-access {
  padding: 10px 0;
}

.quick-item {
  text-align: center;
  cursor: pointer;
  padding: 15px 0;
  transition: all 0.3s;
  border-radius: 4px;
}

.quick-item:hover {
  background-color: #f5f7fa;
  transform: translateY(-2px);
}

.quick-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  font-size: 24px;
  color: #fff;
  background-color: #409eff;
}

.quick-icon.primary {
  background-color: #409eff;
}

.quick-icon.success {
  background-color: #67c23a;
}

.quick-icon.warning {
  background-color: #e6a23c;
}

.quick-icon.info {
  background-color: #909399;
}

.quick-icon.danger {
  background-color: #f56c6c;
}

.quick-label {
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 10px;
  }
  
  .dashboard-header h1 {
    font-size: 24px;
  }
  
  .stat-content {
    flex-direction: column;
    text-align: center;
  }
  
  .stat-icon {
    margin-right: 0;
    margin-bottom: 15px;
  }
  
  .activity-list {
    max-height: 250px;
  }
}
</style>