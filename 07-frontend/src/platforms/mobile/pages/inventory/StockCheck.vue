<template>
  <div class="stock-check mobile-page">
    <div class="mobile-header">
      <van-nav-bar
        title="库存盘点"
        left-text="返回"
        left-arrow
        @click-left="$router.back()"
      >
        <template #right>
          <van-icon name="records" @click="showCheckList = true" />
        </template>
      </van-nav-bar>
    </div>

    <div class="mobile-content">
      <!-- 盘点任务信息 -->
      <div class="task-info" v-if="checkTask">
        <van-cell-group>
          <van-cell title="盘点单号" :value="checkTask.taskNo" />
          <van-cell title="盘点区域" :value="checkTask.area" />
          <van-cell title="开始时间" :value="checkTask.startTime" />
          <van-cell title="截止时间" :value="checkTask.endTime" />
          <van-cell title="进度" :value="`${checkTask.completed}/${checkTask.total}`">
            <template #right-icon>
              <van-progress
                :percentage="(checkTask.completed / checkTask.total) * 100"
                stroke-width="6"
              />
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- 任务选择 -->
      <div class="task-selector" v-else>
        <van-search
          v-model="taskSearch"
          placeholder="搜索盘点任务"
          @search="searchTask"
        />
        <van-button
          type="primary"
          block
          icon="add-o"
          @click="createNewTask"
        >
          创建盘点任务
        </van-button>
      </div>

      <!-- 扫码盘点区域 -->
      <div class="scan-section" v-if="checkTask">
        <div class="scan-box" :class="{ scanning: isScanning }" @click="startScan">
          <div class="scan-border">
            <div class="scan-line" v-if="isScanning"></div>
            <div class="scan-tips" v-if="!isScanning">
              <van-icon name="scan" size="48" color="#ff976a" />
              <p>扫码盘点</p>
            </div>
          </div>
        </div>

        <van-field
          v-model="scanCode"
          placeholder="请输入或扫描条码"
          clearable
        >
          <template #button>
            <van-button size="small" type="warning" @click="manualInput">
              手动输入
            </van-button>
          </template>
        </van-field>
      </div>

      <!-- 当前盘点商品 -->
      <div class="current-item" v-if="currentItem">
        <van-divider>当前盘点</van-divider>
        <van-cell-group>
          <van-cell title="商品名称" :value="currentItem.name" />
          <van-cell title="SKU编码" :value="currentItem.sku" />
          <van-cell title="规格型号" :value="currentItem.specification" />
          <van-cell title="库位" :value="currentItem.location" />
          <van-cell title="系统库存" :value="`${currentItem.systemQuantity}${currentItem.unit}`" />
          <van-cell title="盘点状态">
            <template #value>
              <van-tag :type="currentItem.status === '已完成' ? 'success' : 'warning'">
                {{ currentItem.status }}
              </van-tag>
            </template>
          </van-cell>
        </van-cell-group>

        <van-field
          v-model="checkForm.actualQuantity"
          label="实际数量"
          type="number"
          placeholder="请输入实际盘点数量"
          right-icon="calculator"
          @click-right-icon="showCalculator = true"
        />
        
        <van-field
          v-model="checkForm.differenceReason"
          label="差异原因"
          type="textarea"
          placeholder="如与系统库存不符，请说明原因"
          rows="3"
        />

        <van-button
          type="primary"
          block
          @click="confirmCheck"
          :loading="confirming"
        >
          确认盘点
        </van-button>
      </div>

      <!-- 盘点记录列表 -->
      <div class="check-records" v-if="checkRecords.length > 0">
        <van-divider>盘点记录</van-divider>
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="loadRecords"
        >
          <van-swipe-cell v-for="record in checkRecords" :key="record.id">
            <van-cell
              :title="record.productName"
              :label="`库位: ${record.location} | SKU: ${record.sku}`"
              :value="`${record.actualQuantity}${record.unit}`"
              is-link
              @click="viewRecord(record)"
            >
              <template #icon>
                <van-icon 
                  :name="record.hasDifference ? 'warning-o' : 'success'"
                  :color="record.hasDifference ? '#ff976a' : '#07c160'"
                />
              </template>
              <template #right-icon>
                <div class="record-diff">
                  <van-tag v-if="record.hasDifference" type="danger" size="mini">
                    差异: {{ record.difference }}
                  </van-tag>
                  <van-tag v-else type="success" size="mini">
                    正常
                  </van-tag>
                </div>
              </template>
            </van-cell>
            <template #right>
              <van-button
                square
                type="primary"
                text
                @click="recheckItem(record)"
              >
                重盘
              </van-button>
            </template>
          </van-swipe-cell>
        </van-list>
      </div>

      <!-- 盘点统计 -->
      <div class="check-stats" v-if="checkTask">
        <van-divider>盘点统计</van-divider>
        <van-grid :column-num="2" :gutter="12">
          <van-grid-item>
            <div class="stat-item">
              <div class="stat-value normal">{{ stats.normalCount }}</div>
              <div class="stat-label">正常项</div>
            </div>
          </van-grid-item>
          <van-grid-item>
            <div class="stat-item">
              <div class="stat-value difference">{{ stats.differenceCount }}</div>
              <div class="stat-label">差异项</div>
            </div>
          </van-grid-item>
          <van-grid-item>
            <div class="stat-item">
              <div class="stat-value">{{ stats.totalQuantity }}</div>
              <div class="stat-label">盘点总数</div>
            </div>
          </van-grid-item>
          <van-grid-item>
            <div class="stat-item">
              <div class="stat-value">{{ stats.progress }}%</div>
              <div class="stat-label">完成进度</div>
            </div>
          </van-grid-item>
        </van-grid>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="mobile-footer" v-if="checkTask">
      <van-button 
        type="success" 
        block 
        round 
        @click="submitCheck"
        :loading="submitting"
      >
        完成盘点
      </van-button>
    </div>

    <!-- 数字键盘 -->
    <van-number-keyboard
      v-model="calculatorValue"
      :show="showCalculator"
      theme="custom"
      extra-key="."
      close-button-text="完成"
      @blur="showCalculator = false"
      @input="onCalculatorInput"
      @delete="onCalculatorDelete"
    />

    <!-- 盘点任务列表 -->
    <van-popup v-model:show="showCheckList" position="bottom" :style="{ height: '80%' }">
      <van-nav-bar
        title="盘点任务"
        left-text="取消"
        @click-left="showCheckList = false"
      />
      <van-list
        v-model:loading="taskListLoading"
        :finished="taskListFinished"
        finished-text="没有更多了"
        @load="loadTaskList"
      >
        <van-cell
          v-for="task in taskList"
          :key="task.id"
          :title="task.taskNo"
          :label="`区域: ${task.area} | 进度: ${task.completed}/${task.total}`"
          is-link
          @click="selectTask(task)"
        />
      </van-list>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'

// 响应式数据
const isScanning = ref(false)
const scanCode = ref('')
const taskSearch = ref('')
const showCalculator = ref(false)
const calculatorValue = ref('')
const showCheckList = ref(false)
const confirming = ref(false)
const submitting = ref(false)

const checkTask = ref(null)
const currentItem = ref(null)
const checkRecords = ref([])
const loading = ref(false)
const finished = ref(false)
const taskList = ref([])
const taskListLoading = ref(false)
const taskListFinished = ref(false)

const checkForm = reactive({
  actualQuantity: '',
  differenceReason: ''
})

const stats = reactive({
  normalCount: 0,
  differenceCount: 0,
  totalQuantity: 0,
  progress: 0
})

// 方法
const searchTask = () => {
  if (!taskSearch.value) {
    showToast('请输入盘点任务信息')
    return
  }
  
  // 模拟查询任务
  checkTask.value = {
    id: 1,
    taskNo: 'PD20231127001',
    area: 'A区 - 发动机零部件',
    startTime: '2023-11-27 08:00',
    endTime: '2023-11-27 18:00',
    completed: 15,
    total: 50
  }
  
  loadCheckRecords()
  updateStats()
  showSuccessToast('任务加载成功')
}

const createNewTask = () => {
  // 模拟创建新任务
  checkTask.value = {
    id: Date.now(),
    taskNo: `PD${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    area: 'B区 - 变速箱零部件',
    startTime: new Date().toLocaleString(),
    endTime: new Date(Date.now() + 10 * 60 * 60 * 1000).toLocaleString(),
    completed: 0,
    total: 30
  }
  
  showSuccessToast('盘点任务创建成功')
  loadCheckRecords()
  updateStats()
}

const startScan = () => {
  isScanning.value = true
  
  // 模拟扫码
  setTimeout(() => {
    isScanning.value = false
    scanCode.value = 'EA888-001234'
    handleScanResult(scanCode.value)
  }, 2000)
}

const handleScanResult = (code: string) => {
  // 模拟查询商品信息
  currentItem.value = {
    id: 1,
    name: '发动机总成 EA888',
    sku: 'EA888-001',
    specification: '2.0T 涡轮增压',
    location: 'A-01-02',
    systemQuantity: 25,
    unit: '台',
    status: '待盘点',
    code: code
  }
  
  checkForm.actualQuantity = ''
  checkForm.differenceReason = ''
  
  showSuccessToast('商品识别成功')
}

const manualInput = () => {
  if (!scanCode.value) {
    showToast('请输入商品条码')
    return
  }
  handleScanResult(scanCode.value)
}

const onCalculatorInput = (value: string) => {
  calculatorValue.value += value
}

const onCalculatorDelete = () => {
  calculatorValue.value = calculatorValue.value.slice(0, -1)
}

const confirmCheck = async () => {
  if (!checkForm.actualQuantity) {
    showToast('请输入实际数量')
    return
  }

  confirming.value = true

  try {
    // 模拟保存盘点记录
    await new Promise(resolve => setTimeout(resolve, 1000))

    const actualQuantity = parseInt(checkForm.actualQuantity)
    const difference = actualQuantity - currentItem.value.systemQuantity
    const hasDifference = difference !== 0

    const record = {
      id: Date.now(),
      productName: currentItem.value.name,
      sku: currentItem.value.sku,
      location: currentItem.value.location,
      systemQuantity: currentItem.value.systemQuantity,
      actualQuantity: actualQuantity,
      unit: currentItem.value.unit,
      difference: `${difference > 0 ? '+' : ''}${difference}`,
      hasDifference: hasDifference,
      differenceReason: checkForm.differenceReason,
      time: new Date().toLocaleTimeString()
    }

    checkRecords.value.unshift(record)
    currentItem.value.status = '已完成'
    
    // 更新任务进度
    checkTask.value.completed += 1
    
    // 重置当前商品
    currentItem.value = null
    scanCode.value = ''
    
    updateStats()
    showSuccessToast('盘点记录已保存')
  } catch (error) {
    showToast('保存失败，请重试')
  } finally {
    confirming.value = false
  }
}

const viewRecord = (record: any) => {
  showToast(`查看记录: ${record.productName}`)
}

const recheckItem = (record: any) => {
  currentItem.value = {
    id: record.id,
    name: record.productName,
    sku: record.sku,
    specification: '',
    location: record.location,
    systemQuantity: record.systemQuantity,
    unit: record.unit,
    status: '重新盘点',
    code: record.sku
  }
  
  checkForm.actualQuantity = record.actualQuantity.toString()
  checkForm.differenceReason = record.differenceReason || ''
}

const submitCheck = async () => {
  showConfirmDialog({
    title: '确认完成盘点',
    message: '确定要完成本次盘点任务吗？完成后将生成盘点报告。',
  }).then(async () => {
    submitting.value = true
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      showSuccessToast('盘点任务已完成')
      resetForm()
    } catch (error) {
      showToast('提交失败，请重试')
    } finally {
      submitting.value = false
    }
  })
}

const resetForm = () => {
  checkTask.value = null
  currentItem.value = null
  checkRecords.value = []
  scanCode.value = ''
  Object.assign(checkForm, {
    actualQuantity: '',
    differenceReason: ''
  })
}

const loadCheckRecords = async () => {
  loading.value = true
  
  // 模拟加载盘点记录
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  if (checkRecords.value.length === 0) {
    const mockRecords = [
      {
        id: 1,
        productName: '变速箱总成 DQ380',
        sku: 'DQ380-001',
        location: 'A-01-03',
        systemQuantity: 15,
        actualQuantity: 15,
        unit: '台',
        difference: '0',
        hasDifference: false,
        time: '10:30:15'
      },
      {
        id: 2,
        productName: '发动机缸体',
        sku: 'EA888-002',
        location: 'A-01-04',
        systemQuantity: 30,
        actualQuantity: 28,
        unit: '个',
        difference: '-2',
        hasDifference: true,
        differenceReason: '可能存在漏检',
        time: '11:45:22'
      }
    ]
    
    checkRecords.value = mockRecords
  }
  
  loading.value = false
  finished.value = true
}

const loadRecords = async () => {
  await loadCheckRecords()
}

const updateStats = () => {
  if (!checkRecords.value.length) return
  
  stats.normalCount = checkRecords.value.filter(r => !r.hasDifference).length
  stats.differenceCount = checkRecords.value.filter(r => r.hasDifference).length
  stats.totalQuantity = checkRecords.value.reduce((sum, r) => sum + r.actualQuantity, 0)
  stats.progress = Math.round((checkTask.value.completed / checkTask.value.total) * 100)
}

const selectTask = (task: any) => {
  checkTask.value = task
  showCheckList.value = false
  loadCheckRecords()
  updateStats()
}

const loadTaskList = async () => {
  taskListLoading.value = true
  
  // 模拟加载任务列表
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const newTasks = [
    {
      id: Date.now() + 1,
      taskNo: 'PD20231127002',
      area: 'C区 - 底盘零部件',
      completed: 8,
      total: 25
    },
    {
      id: Date.now() + 2,
      taskNo: 'PD20231127003',
      area: 'D区 - 电子元器件',
      completed: 20,
      total: 40
    }
  ]
  
  taskList.value.push(...newTasks)
  taskListLoading.value = false
  taskListFinished.value = true
}

onMounted(() => {
  // 页面初始化
})
</script>

<style scoped>
.stock-check {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px;
}

.mobile-content {
  padding: 16px;
}

.task-info,
.task-selector,
.scan-section,
.current-item,
.check-records,
.check-stats {
  margin-bottom: 16px;
}

.scan-box {
  width: 100%;
  height: 180px;
  background: #000;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  margin-bottom: 12px;
  cursor: pointer;
}

.scan-border {
  width: 100%;
  height: 100%;
  border: 2px solid #ff976a;
  border-radius: 8px;
  position: relative;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff976a, transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}

.scan-tips {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #ff976a;
}

.scan-tips p {
  margin-top: 8px;
  font-size: 14px;
}

.scan-box.scanning {
  background: radial-gradient(circle, rgba(255, 151, 106, 0.1) 0%, transparent 70%);
}

.record-diff {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-value.normal {
  color: #07c160;
}

.stat-value.difference {
  color: #ff976a;
}

.stat-label {
  font-size: 12px;
  color: #969799;
}

.mobile-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: white;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .mobile-content {
    padding: 12px;
  }
  
  .scan-box {
    height: 140px;
  }
}
</style>