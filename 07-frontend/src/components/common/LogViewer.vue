<template>
  <div class="log-viewer-container">
    <el-card shadow="hover" class="log-viewer-card">
      <template #header>
        <div class="card-header">
          <span>日志管理</span>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="exportLogs">
              <el-icon><Download /></el-icon>
              导出日志
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索和过滤区域 -->
      <el-form :inline="true" class="filter-form">
        <el-form-item label="日志级别">
          <el-select v-model="filters.level" placeholder="选择日志级别">
            <el-option label="全部" value=""></el-option>
            <el-option label="DEBUG" value="DEBUG"></el-option>
            <el-option label="INFO" value="INFO"></el-option>
            <el-option label="WARN" value="WARN"></el-option>
            <el-option label="ERROR" value="ERROR"></el-option>
            <el-option label="CRITICAL" value="CRITICAL"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="搜索关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="输入关键词"
            clearable
            @keyup.enter="searchLogs"
          >
            <template #append>
              <el-button @click="searchLogs"><el-icon><Search /></el-icon></el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filters.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="searchLogs">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 日志统计信息 -->
      <div class="log-stats">
        <el-statistic
          title="总日志数"
          :value="logStats.total"
          class="stat-item"
        ></el-statistic>
        <el-statistic
          title="错误日志"
          :value="logStats.error"
          class="stat-item error"
        ></el-statistic>
        <el-statistic
          title="警告日志"
          :value="logStats.warn"
          class="stat-item warn"
        ></el-statistic>
        <el-statistic
          title="信息日志"
          :value="logStats.info"
          class="stat-item info"
        ></el-statistic>
        <el-statistic
          title="调试日志"
          :value="logStats.debug"
          class="stat-item debug"
        ></el-statistic>
      </div>

      <!-- 日志列表 -->
      <div class="log-list-container">
        <el-table
          v-loading="loading"
          :data="logs"
          stripe
          style="width: 100%"
          @row-click="viewLogDetail"
        >
          <el-table-column prop="timestamp" label="时间" width="180" sortable>
            <template #default="scope">
              <span class="log-time">{{ formatTime(scope.row.timestamp) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="level" label="级别" width="100">
            <template #default="scope">
              <el-tag
                :type="getLevelType(scope.row.level)"
                size="small"
              >
                {{ scope.row.level }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="message" label="消息" min-width="300">
            <template #default="scope">
              <div class="log-message">{{ scope.row.message }}</div>
            </template>
          </el-table-column>

          <el-table-column prop="traceId" label="Trace ID" width="200">
            <template #default="scope">
              <span class="trace-id">{{ scope.row.traceId || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="spanId" label="Span ID" width="180">
            <template #default="scope">
              <span class="span-id">{{ scope.row.spanId || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="url" label="页面" min-width="200">
            <template #default="scope">
              <span class="log-url">{{ scope.row.url || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="sessionId" label="会话ID" width="150">
            <template #default="scope">
              <span class="session-id">{{ scope.row.sessionId || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="80" fixed="right">
            <template #default="scope">
              <el-button
                type="text"
                size="small"
                @click.stop="viewLogDetail(scope.row)"
              >
                详情
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
      </div>

      <!-- 日志详情对话框 -->
      <el-dialog
        v-model="logDetailVisible"
        title="日志详情"
        width="80%"
        destroy-on-close
      >
        <div class="log-detail-content" v-if="selectedLog">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="时间">{{ formatTime(selectedLog.timestamp) }}</el-descriptions-item>
            <el-descriptions-item label="级别">
              <el-tag :type="getLevelType(selectedLog.level)">
                {{ selectedLog.level }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="消息">{{ selectedLog.message }}</el-descriptions-item>
            <el-descriptions-item label="Trace ID">{{ selectedLog.traceId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="Span ID">{{ selectedLog.spanId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="页面">{{ selectedLog.url || '-' }}</el-descriptions-item>
            <el-descriptions-item label="用户代理">{{ selectedLog.userAgent || '-' }}</el-descriptions-item>
            <el-descriptions-item label="会话ID">{{ selectedLog.sessionId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="用户ID">{{ selectedLog.userId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="元数据">
              <div class="meta-data">
                <pre>{{ JSON.stringify(selectedLog.meta, null, 2) }}</pre>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Search, Download } from '@element-plus/icons-vue';
import logger from '../../utils/logger';
import axios from 'axios';

// 日志数据
const logs = ref([]);
const loading = ref(false);
const logDetailVisible = ref(false);
const selectedLog = ref(null);

// 过滤条件
const filters = ref({
  keyword: '',
  level: '',
  timeRange: null
});

// 分页配置
const pagination = ref({
  currentPage: 1,
  pageSize: 20,
  total: 0
});

// 日志统计
const logStats = ref({
  total: 0,
  debug: 0,
  info: 0,
  warn: 0,
  error: 0
});

// 方法
const loadLogs = async () => {
  loading.value = true;
  try {
    // 构建查询参数
    const params = {
      page: pagination.value.currentPage,
      pageSize: pagination.value.pageSize,
      level: filters.value.level || undefined,
      keyword: filters.value.keyword || undefined
    };

    // 添加时间范围参数
    if (filters.value.timeRange && filters.value.timeRange.length === 2) {
      params.startTime = `${filters.value.timeRange[0]} 00:00:00`;
      params.endTime = `${filters.value.timeRange[1]} 23:59:59`;
    }

    // 调用后端API获取日志
    const response = await axios.get('/api/logs', { params });
    if (response.data && response.data.code === 200) {
      logs.value = response.data.data.logs || [];
      pagination.value.total = response.data.data.pagination.total || 0;
      
      // 更新统计信息
      await loadLogStats();
    }
  } catch (error) {
    console.error('获取日志失败:', error);
    // 保留模拟数据作为备份
    logs.value = [
      {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: '用户登录成功',
        traceId: 'test-trace-id-123',
        spanId: 'test-span-id-456',
        meta: { userId: '123', username: 'admin' },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        url: 'http://localhost:3003/auth/login',
        sessionId: 'session_123456',
        userId: '123'
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        level: 'ERROR',
        message: 'API请求失败',
        traceId: 'test-trace-id-789',
        spanId: 'test-span-id-012',
        meta: { url: '/api/users', method: 'GET', status: 500 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        url: 'http://localhost:3003/dashboard',
        sessionId: 'session_123456',
        userId: '123'
      },
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        level: 'WARN',
        message: '内存使用过高',
        traceId: 'test-trace-id-345',
        spanId: 'test-span-id-678',
        meta: { usedMemory: 120, totalMemory: 256 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        url: 'http://localhost:3003/dashboard',
        sessionId: 'session_123456',
        userId: '123'
      }
    ];
    pagination.value.total = logs.value.length;
    updateStatsFromLogs();
  } finally {
    loading.value = false;
  }
};

// 加载日志统计
const loadLogStats = async () => {
  try {
    const params = {};
    if (filters.value.timeRange && filters.value.timeRange.length === 2) {
      params.startTime = `${filters.value.timeRange[0]} 00:00:00`;
      params.endTime = `${filters.value.timeRange[1]} 23:59:59`;
    }
    
    const response = await axios.get('/api/logs/stats', { params });
    if (response.data && response.data.code === 200) {
      const stats = response.data.data;
      logStats.value = {
        total: stats.total || 0,
        debug: stats.levels?.DEBUG || 0,
        info: stats.levels?.INFO || 0,
        warn: stats.levels?.WARN || 0,
        error: (stats.levels?.ERROR || 0) + (stats.levels?.CRITICAL || 0)
      };
    }
  } catch (error) {
    console.error('获取日志统计失败:', error);
    updateStatsFromLogs();
  }
};

// 从日志数据更新统计信息
const updateStatsFromLogs = () => {
  const stats = {
    total: logs.value.length,
    debug: logs.value.filter(log => log.level === 'DEBUG').length,
    info: logs.value.filter(log => log.level === 'INFO').length,
    warn: logs.value.filter(log => log.level === 'WARN').length,
    error: logs.value.filter(log => 
      log.level === 'ERROR' || log.level === 'CRITICAL'
    ).length
  };
  logStats.value = stats;
};

const searchLogs = () => {
  // 重置页码
  pagination.value.currentPage = 1;
  // 重新加载日志
  loadLogs();
};

const resetFilters = () => {
  filters.value = {
    keyword: '',
    level: '',
    timeRange: null
  };
  pagination.value.currentPage = 1;
  loadLogs();
};

const viewLogDetail = (log) => {
  selectedLog.value = log;
  logDetailVisible.value = true;
};

const exportLogs = async () => {
  try {
    // 调用后端API导出日志
    const params = {
      level: filters.value.level || undefined,
      keyword: filters.value.keyword || undefined
    };

    if (filters.value.timeRange && filters.value.timeRange.length === 2) {
      params.startTime = `${filters.value.timeRange[0]} 00:00:00`;
      params.endTime = `${filters.value.timeRange[1]} 23:59:59`;
    }

    const response = await axios.get('/api/logs/export', {
      params,
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('导出日志失败:', error);
    // 降级使用前端日志导出
    const exportData = logger.exportLogs();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const getLevelType = (level) => {
  const levelMap = {
    DEBUG: 'info',
    INFO: 'success',
    WARN: 'warning',
    ERROR: 'danger',
    CRITICAL: 'danger'
  };
  return levelMap[level] || 'info';
};

const handleSizeChange = (size) => {
  pagination.value.pageSize = size;
  loadLogs();
};

const handleCurrentChange = (current) => {
  pagination.value.currentPage = current;
  loadLogs();
};

// 生命周期钩子
onMounted(() => {
  loadLogs();
});
</script>

<style scoped>
.log-viewer-container {
  padding: 16px;
}

.log-viewer-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.filter-form {
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.log-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-item.error .el-statistic__content {
  color: #f56c6c;
}

.stat-item.warn .el-statistic__content {
  color: #e6a23c;
}

.stat-item.info .el-statistic__content {
  color: #409eff;
}

.stat-item.debug .el-statistic__content {
  color: #909399;
}

.log-list-container {
  margin-top: 16px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.log-time {
  font-size: 12px;
  color: #909399;
}

.log-message {
  max-width: 500px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-url {
  font-size: 12px;
  color: #409eff;
}

.session-id {
  font-size: 12px;
  color: #67c23a;
}

.log-detail-content {
  max-height: 500px;
  overflow-y: auto;
}

.meta-data {
  max-height: 300px;
  overflow-y: auto;
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
}

.meta-data pre {
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.5;
}
</style>
