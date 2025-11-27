<template>
  <div class="work-report mobile-page">
    <div class="mobile-header">
      <van-nav-bar
        title="生产报工"
        left-text="返回"
        left-arrow
        @click-left="$router.back()"
      />
    </div>

    <div class="mobile-content">
      <!-- 工单信息 -->
      <div class="order-info">
        <van-search
          v-model="orderSearch"
          placeholder="搜索工单编号"
          @search="searchOrder"
        />
        
        <van-cell-group v-if="workOrder">
          <van-cell title="工单编号" :value="workOrder.orderNo" />
          <van-cell title="产品名称" :value="workOrder.productName" />
          <van-cell title="工序" :value="workOrder.process" />
          <van-cell title="计划数量" :value="`${workOrder.planQuantity}${workOrder.unit}`" />
          <van-cell title="已完成" :value="`${workOrder.completedQuantity}${workOrder.unit}`" />
          <van-cell title="进度">
            <template #value>
              <van-progress
                :percentage="(workOrder.completedQuantity / workOrder.planQuantity) * 100"
                stroke-width="6"
              />
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- 报工表单 -->
      <div class="report-form" v-if="workOrder">
        <van-divider>生产报工</van-divider>
        
        <van-field
          v-model="reportForm.quantity"
          label="报工数量"
          type="number"
          placeholder="请输入本次报工数量"
          right-icon="records"
          @click-right-icon="showCalculator = true"
        />
        
        <van-field
          v-model="reportForm.startTime"
          label="开始时间"
          placeholder="选择开始时间"
          readonly
          is-link
          @click="showStartTimePicker = true"
        />
        
        <van-field
          v-model="reportForm.endTime"
          label="结束时间"
          placeholder="选择结束时间"
          readonly
          is-link
          @click="showEndTimePicker = true"
        />
        
        <van-field
          v-model="reportForm.workerName"
          label="操作员"
          placeholder="请输入操作员姓名"
        />
        
        <van-field
          v-model="reportForm.equipment"
          label="设备编号"
          placeholder="请输入设备编号"
        />
        
        <van-field
          v-model="reportForm.remark"
          label="备注"
          type="textarea"
          placeholder="请输入备注信息"
          rows="3"
        />
      </div>

      <!-- 快速操作 -->
      <div class="quick-actions">
        <van-grid :column-num="3" :gutter="12">
          <van-grid-item @click="quickStart">
            <van-icon name="play-circle-o" size="24" color="#07c160" />
            <span>开始工作</span>
          </van-grid-item>
          <van-grid-item @click="quickEnd">
            <van-icon name="pause-circle-o" size="24" color="#ff976a" />
            <span>结束工作</span>
          </van-grid-item>
          <van-grid-item @click="quickComplete">
            <van-icon name="success" size="24" color="#1989fa" />
            <span>完成工序</span>
          </van-grid-item>
        </van-grid>
      </div>

      <!-- 历史记录 -->
      <div class="history-records">
        <van-divider>今日报工记录</van-divider>
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="loadRecords"
        >
          <van-cell
            v-for="record in records"
            :key="record.id"
            :title="record.orderNo"
            :label="`${record.time} | 操作员: ${record.workerName}`"
            :value="`${record.quantity}${record.unit}`"
            is-link
            @click="viewRecord(record)"
          >
            <template #icon>
              <van-icon name="success" color="#07c160" />
            </template>
          </van-cell>
        </van-list>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="mobile-footer" v-if="workOrder">
      <van-button 
        type="primary" 
        block 
        round 
        @click="submitReport"
        :loading="submitting"
      >
        提交报工
      </van-button>
    </div>

    <!-- 时间选择器 -->
    <van-popup v-model:show="showStartTimePicker" position="bottom">
      <van-datetime-picker
        v-model="startTimeValue"
        type="time"
        title="选择开始时间"
        @confirm="onStartTimeConfirm"
        @cancel="showStartTimePicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showEndTimePicker" position="bottom">
      <van-datetime-picker
        v-model="endTimeValue"
        type="time"
        title="选择结束时间"
        @confirm="onEndTimeConfirm"
        @cancel="showEndTimePicker = false"
      />
    </van-popup>

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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'

const orderSearch = ref('')
const showStartTimePicker = ref(false)
const showEndTimePicker = ref(false)
const showCalculator = ref(false)
const calculatorValue = ref('')
const startTimeValue = ref(new Date())
const endTimeValue = ref(new Date())
const submitting = ref(false)
const loading = ref(false)
const finished = ref(false)

const workOrder = ref(null)
const records = ref([])

const reportForm = reactive({
  quantity: '',
  startTime: '',
  endTime: '',
  workerName: '',
  equipment: '',
  remark: ''
})

const searchOrder = () => {
  if (!orderSearch.value) {
    showToast('请输入工单编号')
    return
  }

  workOrder.value = {
    id: 1,
    orderNo: orderSearch.value,
    productName: '发动机总成',
    process: '总装工序',
    planQuantity: 100,
    completedQuantity: 75,
    unit: '台'
  }

  showSuccessToast('工单加载成功')
}

const quickStart = () => {
  reportForm.startTime = new Date().toLocaleTimeString()
  showToast('开始工作计时')
}

const quickEnd = () => {
  reportForm.endTime = new Date().toLocaleTimeString()
  showToast('结束工作计时')
}

const quickComplete = () => {
  const remaining = workOrder.value.planQuantity - workOrder.value.completedQuantity
  reportForm.quantity = remaining.toString()
  showToast(`设置为完成剩余${remaining}台`)
}

const onStartTimeConfirm = () => {
  reportForm.startTime = startTimeValue.value.toLocaleTimeString()
  showStartTimePicker.value = false
}

const onEndTimeConfirm = () => {
  reportForm.endTime = endTimeValue.value.toLocaleTimeString()
  showEndTimePicker.value = false
}

const onCalculatorInput = (value: string) => {
  calculatorValue.value += value
}

const onCalculatorDelete = () => {
  calculatorValue.value = calculatorValue.value.slice(0, -1)
}

const submitReport = async () => {
  if (!reportForm.quantity) {
    showToast('请输入报工数量')
    return
  }

  submitting.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 1500))

    const record = {
      id: Date.now(),
      orderNo: workOrder.value.orderNo,
      quantity: reportForm.quantity,
      unit: workOrder.value.unit,
      time: new Date().toLocaleTimeString(),
      workerName: reportForm.workerName
    }

    records.value.unshift(record)
    workOrder.value.completedQuantity += parseInt(reportForm.quantity)

    Object.assign(reportForm, {
      quantity: '',
      startTime: '',
      endTime: '',
      equipment: '',
      remark: ''
    })

    showSuccessToast('报工提交成功')
  } catch (error) {
    showToast('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

const viewRecord = (record: any) => {
  showToast(`查看记录: ${record.orderNo}`)
}

const loadRecords = async () => {
  loading.value = true

  await new Promise(resolve => setTimeout(resolve, 1000))

  if (records.value.length === 0) {
    const mockRecords = [
      {
        id: 1,
        orderNo: 'WO20231127001',
        quantity: 25,
        unit: '台',
        time: '14:30:15',
        workerName: '张三'
      },
      {
        id: 2,
        orderNo: 'WO20231127002',
        quantity: 15,
        unit: '台',
        time: '10:20:45',
        workerName: '李四'
      }
    ]
    records.value = mockRecords
  }

  loading.value = false
  finished.value = true
}

onMounted(() => {
  // 页面初始化
})
</script>

<style scoped>
.work-report {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px;
}

.mobile-content {
  padding: 16px;
}

.order-info,
.report-form,
.quick-actions,
.history-records {
  margin-bottom: 20px;
}

.quick-actions span {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #646566;
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
</style>