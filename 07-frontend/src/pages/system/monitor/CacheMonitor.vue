<template>
  <div class="cache-monitor">
    <h2>缓存监控</h2>
    
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">Redis缓存</div>
            <div class="stat-value">{{ redisStats.usage }}%</div>
            <el-progress :percentage="redisStats.usage" :stroke-width="10" :status="redisStats.status" />
            <div class="stat-info">
              已使用: {{ redisStats.used }} / {{ redisStats.total }}
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">内存缓存</div>
            <div class="stat-value">{{ memoryStats.usage }}%</div>
            <el-progress :percentage="memoryStats.usage" :stroke-width="10" :status="memoryStats.status" />
            <div class="stat-info">
              已使用: {{ memoryStats.used }} / {{ memoryStats.total }}
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">文件缓存</div>
            <div class="stat-value">{{ fileStats.usage }}%</div>
            <el-progress :percentage="fileStats.usage" :stroke-width="10" :status="fileStats.status" />
            <div class="stat-info">
              已使用: {{ fileStats.used }} / {{ fileStats.total }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card shadow="hover" style="margin-top: 20px;">
      <div slot="header">
        <span>缓存详情</span>
        <div style="float: right;">
          <el-button type="primary" @click="refreshCache">刷新</el-button>
          <el-button type="danger" @click="clearCache">清空缓存</el-button>
        </div>
      </div>
      
      <el-table :data="cacheDetails" border stripe>
        <el-table-column prop="key" label="缓存键" width="200" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="size" label="大小" width="120" align="right" />
        <el-table-column prop="ttl" label="过期时间" width="150" />
        <el-table-column prop="hitRate" label="命中率" width="100" align="right">
          <template #default="{ row }">{{ row.hitRate }}%</template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="danger" size="small" @click="deleteCacheKey(row.key)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const redisStats = ref({
  usage: 65,
  used: '1.2GB',
  total: '2GB',
  status: 'success'
})

const memoryStats = ref({
  usage: 45,
  used: '900MB',
  total: '2GB',
  status: 'warning'
})

const fileStats = ref({
  usage: 30,
  used: '150MB',
  total: '500MB',
  status: 'success'
})

const cacheDetails = ref([
  {
    key: 'user_session:12345',
    type: 'Redis',
    size: '2.5KB',
    ttl: '2小时',
    hitRate: 95
  },
  {
    key: 'product_list',
    type: '内存',
    size: '15.2KB',
    ttl: '1小时',
    hitRate: 88
  },
  {
    key: 'report_data_2025',
    type: '文件',
    size: '2.1MB',
    ttl: '24小时',
    hitRate: 75
  },
  {
    key: 'config_settings',
    type: 'Redis',
    size: '1.8KB',
    ttl: '永不过期',
    hitRate: 99
  }
])

const refreshCache = () => {
  ElMessage.info('正在刷新缓存数据...')
  // 模拟刷新操作
  setTimeout(() => {
    ElMessage.success('缓存数据刷新成功')
  }, 1000)
}

const clearCache = () => {
  ElMessageBox.confirm('确定要清空所有缓存吗？此操作不可恢复。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('缓存清空成功')
  }).catch(() => {
    // 用户取消操作
  })
}

const deleteCacheKey = (key) => {
  ElMessageBox.confirm(`确定要删除缓存键 "${key}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 从列表中移除该项
    const index = cacheDetails.value.findIndex(item => item.key === key)
    if (index !== -1) {
      cacheDetails.value.splice(index, 1)
      ElMessage.success('缓存键删除成功')
    }
  }).catch(() => {
    // 用户取消操作
  })
}
</script>

<style scoped>
.cache-monitor {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 15px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.stat-info {
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
}
</style>