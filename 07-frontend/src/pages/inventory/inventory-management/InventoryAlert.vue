<template>
  <div class="inventory-alert-container">
    <el-card shadow="hover">
      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card danger">
            <el-statistic title="缺货预警" :value="stats.shortageCount" suffix="项" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card warning">
            <el-statistic title="低库存预警" :value="stats.lowStockCount" suffix="项" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="过期预警" :value="stats.expiryCount" suffix="项" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="积压预警" :value="stats.overstockCount" suffix="项" />
          </el-card>
        </el-col>
      </el-row>

      <!-- 筛选 -->
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="预警类型">
          <el-select v-model="searchForm.alertType" placeholder="请选择预警类型" clearable>
            <el-option label="缺货预警" value="shortage" />
            <el-option label="低库存预警" value="lowStock" />
            <el-option label="过期预警" value="expiry" />
            <el-option label="积压预警" value="overstock" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select v-model="searchForm.handleStatus" placeholder="请选择状态" clearable>
            <el-option label="未处理" value="pending" />
            <el-option label="处理中" value="handling" />
            <el-option label="已处理" value="handled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 预警列表 -->
      <el-table :data="alertList" border v-loading="loading">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="productCode" label="产品编码" width="150" />
        <el-table-column prop="productName" label="产品名称" width="200" />
        <el-table-column label="预警类型" width="120">
          <template #default="scope">
            <el-tag :type="getAlertTypeTag(scope.row.alertType)">
              {{ getAlertTypeText(scope.row.alertType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentQuantity" label="当前库存" width="120" />
        <el-table-column prop="safetyStock" label="安全库存" width="120" />
        <el-table-column label="预警等级" width="100">
          <template #default="scope">
            <el-tag :type="getLevelType(scope.row.level)">
              {{ getLevelText(scope.row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处理状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.handleStatus)">
              {{ getStatusText(scope.row.handleStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="alertTime" label="预警时间" width="180" />
        <el-table-column prop="handler" label="处理人" width="100" />
        <el-table-column label="操作" fixed="right" width="180">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="viewDetail(scope.row)">
              详情
            </el-button>
            <el-button 
              v-if="scope.row.handleStatus === 'pending'"
              type="success" 
              size="small" 
              link 
              @click="handleAlert(scope.row)"
            >
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadAlertList"
        @current-change="loadAlertList"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 处理预警对话框 -->
    <el-dialog v-model="showHandleDialog" title="处理预警" width="600px">
      <el-form :model="handleForm" label-width="100px">
        <el-form-item label="预警产品">
          <el-tag>{{ currentAlert?.productName }}</el-tag>
        </el-form-item>
        <el-form-item label="预警类型">
          <el-tag :type="getAlertTypeTag(currentAlert?.alertType)">
            {{ getAlertTypeText(currentAlert?.alertType) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="处理方式">
          <el-radio-group v-model="handleForm.handleType">
            <el-radio label="purchase">采购补货</el-radio>
            <el-radio label="transfer">调拨补货</el-radio>
            <el-radio label="adjust">调整安全库存</el-radio>
            <el-radio label="other">其他</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input 
            v-model="handleForm.handleRemark" 
            type="textarea" 
            :rows="4"
            placeholder="请输入处理说明"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showHandleDialog = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确定</el-button>
      </template>
    </el-dialog>

    <!-- 预警配置 -->
    <el-card shadow="hover" class="config-card">
      <template #header>
        <div class="card-header">
          <span>预警配置</span>
          <el-button type="primary" size="small" @click="showConfigDialog = true">
            配置
          </el-button>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="缺货预警">启用</el-descriptions-item>
        <el-descriptions-item label="低库存预警">启用</el-descriptions-item>
        <el-descriptions-item label="过期预警">提前 30 天</el-descriptions-item>
        <el-descriptions-item label="积压预警">超过 180 天</el-descriptions-item>
        <el-descriptions-item label="通知方式">站内消息、邮件</el-descriptions-item>
        <el-descriptions-item label="通知频率">每天一次</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 配置对话框 -->
    <el-dialog v-model="showConfigDialog" title="预警配置" width="700px">
      <el-form :model="configForm" label-width="140px">
        <el-form-item label="缺货预警">
          <el-switch v-model="configForm.shortageAlert" />
        </el-form-item>
        <el-form-item label="低库存预警">
          <el-switch v-model="configForm.lowStockAlert" />
        </el-form-item>
        <el-form-item label="低库存阈值">
          <el-slider v-model="configForm.lowStockThreshold" :max="100" :min="0" />
          <span>安全库存的 {{ configForm.lowStockThreshold }}%</span>
        </el-form-item>
        <el-form-item label="过期预警">
          <el-switch v-model="configForm.expiryAlert" />
        </el-form-item>
        <el-form-item label="过期提前天数">
          <el-input-number v-model="configForm.expiryDays" :min="1" :max="365" />
          <span style="margin-left: 10px;">天</span>
        </el-form-item>
        <el-form-item label="积压预警">
          <el-switch v-model="configForm.overstockAlert" />
        </el-form-item>
        <el-form-item label="积压天数">
          <el-input-number v-model="configForm.overstockDays" :min="30" :max="365" />
          <span style="margin-left: 10px;">天</span>
        </el-form-item>
        <el-form-item label="通知方式">
          <el-checkbox-group v-model="configForm.notifyMethods">
            <el-checkbox label="message">站内消息</el-checkbox>
            <el-checkbox label="email">邮件</el-checkbox>
            <el-checkbox label="sms">短信</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showConfigDialog = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { inventoryAlertApi } from '@/api/inventory'

// 响应式数据
const loading = ref(false)
const alertList = ref([])
const showHandleDialog = ref(false)
const showConfigDialog = ref(false)
const currentAlert = ref(null)
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

const stats = reactive({
  shortageCount: 12,
  lowStockCount: 35,
  expiryCount: 8,
  overstockCount: 15
})

const searchForm = reactive({
  alertType: '',
  handleStatus: ''
})

const handleForm = reactive({
  handleType: 'purchase',
  handleRemark: ''
})

const configForm = reactive({
  shortageAlert: true,
  lowStockAlert: true,
  lowStockThreshold: 80,
  expiryAlert: true,
  expiryDays: 30,
  overstockAlert: true,
  overstockDays: 180,
  notifyMethods: ['message', 'email']
})

// 方法
const loadAlertList = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
    const res = await inventoryAlertApi.getAlertList(params)
    alertList.value = res.data?.records || mockAlertList()
    total.value = res.data?.total || 50
  } catch (error) {
    console.error('加载预警列表失败:', error)
    alertList.value = mockAlertList()
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  loadAlertList()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    alertType: '',
    handleStatus: ''
  })
  handleSearch()
}

const viewDetail = (row) => {
  ElMessage.info('查看详情功能开发中...')
}

const handleAlert = (row) => {
  currentAlert.value = row
  handleForm.handleType = 'purchase'
  handleForm.handleRemark = ''
  showHandleDialog.value = true
}

const submitHandle = async () => {
  try {
    await inventoryAlertApi.handleAlert({
      alertId: currentAlert.value.id,
      ...handleForm
    })
    ElMessage.success('处理成功')
    showHandleDialog.value = false
    loadAlertList()
  } catch (error) {
    ElMessage.error('处理失败')
  }
}

const saveConfig = async () => {
  try {
    await inventoryAlertApi.updateAlertConfig(configForm)
    ElMessage.success('配置保存成功')
    showConfigDialog.value = false
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const getAlertTypeTag = (type) => {
  const tagMap = {
    shortage: 'danger',
    lowStock: 'warning',
    expiry: 'info',
    overstock: 'primary'
  }
  return tagMap[type] || ''
}

const getAlertTypeText = (type) => {
  const textMap = {
    shortage: '缺货预警',
    lowStock: '低库存预警',
    expiry: '过期预警',
    overstock: '积压预警'
  }
  return textMap[type] || '未知'
}

const getLevelType = (level) => {
  const typeMap = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return typeMap[level] || ''
}

const getLevelText = (level) => {
  const textMap = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return textMap[level] || '未知'
}

const getStatusType = (status) => {
  const typeMap = {
    pending: 'danger',
    handling: 'warning',
    handled: 'success'
  }
  return typeMap[status] || ''
}

const getStatusText = (status) => {
  const textMap = {
    pending: '未处理',
    handling: '处理中',
    handled: '已处理'
  }
  return textMap[status] || '未知'
}

const mockAlertList = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    productCode: `P${String(i + 1001).padStart(6, '0')}`,
    productName: `产品${i + 1}`,
    alertType: ['shortage', 'lowStock', 'expiry', 'overstock'][i % 4],
    currentQuantity: Math.floor(Math.random() * 100),
    safetyStock: 100,
    level: ['high', 'medium', 'low'][i % 3],
    handleStatus: ['pending', 'handling', 'handled'][i % 3],
    alertTime: '2024-01-15 10:00:00',
    handler: i % 3 === 2 ? '张三' : null
  }))
}

onMounted(() => {
  loadAlertList()
})
</script>

<style scoped>
.inventory-alert-container {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-card.danger {
  background: #fef0f0;
}

.stat-card.warning {
  background: #fdf6ec;
}

.search-form {
  margin-bottom: 20px;
}

.config-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
