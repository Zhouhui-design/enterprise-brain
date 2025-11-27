<template>
  <div class="clock-in mobile-page">
    <div class="mobile-header">
      <van-nav-bar
        title="打卡考勤"
        left-text="返回"
        left-arrow
        @click-left="$router.back()"
      />
    </div>

    <div class="mobile-content">
      <!-- 当前时间显示 -->
      <div class="time-display">
        <div class="current-time">{{ currentTime }}</div>
        <div class="current-date">{{ currentDate }}</div>
        <div class="location-info">
          <van-icon name="location-o" />
          <span>{{ currentLocation }}</span>
        </div>
      </div>

      <!-- 打卡区域 -->
      <div class="clock-section">
        <div class="clock-button" @click="handleClockIn" :class="{ 'clocked-in': isClockedIn }">
          <van-icon name="success" size="60" v-if="isClockedIn" />
          <van-icon name="success" size="60" v-else />
          <div class="clock-text">{{ isClockedIn ? '打卡下班' : '打卡上班' }}</div>
        </div>
        
        <div class="clock-status">
          <van-tag :type="isClockedIn ? 'success' : 'primary'" size="large">
            {{ clockStatus }}
          </van-tag>
        </div>
      </div>

      <!-- 今日考勤 -->
      <div class="attendance-info">
        <van-divider>今日考勤</van-divider>
        <van-cell-group>
          <van-cell title="上班时间" :value="todayClockIn || '--:--'" />
          <van-cell title="下班时间" :value="todayClockOut || '--:--'" />
          <van-cell title="工作时长" :value="workHours || '-- 小时'" />
          <van-cell title="考勤状态">
            <template #value>
              <van-tag :type="attendanceStatus.type">
                {{ attendanceStatus.text }}
              </van-tag>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- 本周统计 -->
      <div class="week-stats">
        <van-divider>本周统计</van-divider>
        <van-grid :column-num="2" :gutter="12">
          <van-grid-item>
            <div class="stat-item">
              <div class="stat-value">{{ weekStats.workDays }}</div>
              <div class="stat-label">工作天数</div>
            </div>
          </van-grid-item>
          <van-grid-item>
            <div class="stat-item">
              <div class="stat-value">{{ weekStats.totalHours }}</div>
              <div class="stat-label">总工时</div>
            </div>
          </van-grid-item>
          <van-grid-item>
            <div class="stat-item">
              <div class="stat-value">{{ weekStats.lateCount }}</div>
              <div class="stat-label">迟到次数</div>
            </div>
          </van-grid-item>
          <van-grid-item>
            <div class="stat-item">
              <div class="stat-value">{{ weekStats.leaveEarlyCount }}</div>
              <div class="stat-label">早退次数</div>
            </div>
          </van-grid-item>
        </van-grid>
      </div>

      <!-- 快速功能 -->
      <div class="quick-functions">
        <van-grid :column-num="3" :gutter="12">
          <van-grid-item @click="applyLeave">
            <van-icon name="calendar-o" size="24" color="#1989fa" />
            <span>请假申请</span>
          </van-grid-item>
          <van-grid-item @click="applyOvertime">
            <van-icon name="clock-o" size="24" color="#07c160" />
            <span>加班申请</span>
          </van-grid-item>
          <van-grid-item @click="viewRecords">
            <van-icon name="records" size="24" color="#ff976a" />
            <span>考勤记录</span>
          </van-grid-item>
        </van-grid>
      </div>
    </div>

    <!-- 打卡成功弹窗 -->
    <van-popup v-model:show="showClockSuccess" position="center" round>
      <div class="clock-success">
        <van-icon name="success" size="60" color="#07c160" />
        <h3>{{ clockSuccessTitle }}</h3>
        <p>{{ clockSuccessTime }}</p>
        <p>{{ currentLocation }}</p>
        <van-button type="primary" block @click="showClockSuccess = false">
          确定
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { showToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'

const router = useRouter()

const currentTime = ref('')
const currentDate = ref('')
const currentLocation = ref('获取位置中...')
const isClockedIn = ref(false)
const showClockSuccess = ref(false)
let timeInterval = null

const todayClockIn = ref('')
const todayClockOut = ref('')
const workHours = ref('')

const weekStats = reactive({
  workDays: 4,
  totalHours: '32.5',
  lateCount: 1,
  leaveEarlyCount: 0
})

const clockStatus = computed(() => {
  return isClockedIn.value ? '已打卡上班' : '未打卡'
})

const attendanceStatus = computed(() => {
  if (!todayClockIn.value) {
    return { type: 'warning', text: '未打卡' }
  }
  if (!todayClockOut.value) {
    return { type: 'success', text: '正常' }
  }
  return { type: 'success', text: '已完成' }
})

const clockSuccessTitle = computed(() => {
  return isClockedIn.value ? '打卡上班成功' : '打卡下班成功'
})

const clockSuccessTime = computed(() => {
  return `打卡时间：${currentTime.value}`
})

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString()
  currentDate.value = now.toLocaleDateString()
}

const getLocation = () => {
  // 模拟获取位置
  setTimeout(() => {
    currentLocation.value = '北京市朝阳区建国路88号'
  }, 1000)
}

const handleClockIn = async () => {
  try {
    // 模拟打卡API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (!isClockedIn.value) {
      // 上班打卡
      todayClockIn.value = currentTime.value
      isClockedIn.value = true
    } else {
      // 下班打卡
      todayClockOut.value = currentTime.value
      calculateWorkHours()
      isClockedIn.value = false
    }

    showClockSuccess.value = true
    showSuccessToast('打卡成功')
    
    // 震动反馈
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }
  } catch (error) {
    showToast('打卡失败，请重试')
  }
}

const calculateWorkHours = () => {
  if (todayClockIn.value && todayClockOut.value) {
    // 简单计算工作时长
    const inTime = new Date(`2023-11-27 ${todayClockIn.value}`)
    const outTime = new Date(`2023-11-27 ${todayClockOut.value}`)
    const diff = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)
    workHours.value = diff.toFixed(1)
  }
}

const applyLeave = () => {
  router.push('/mobile/attendance/LeaveApply')
}

const applyOvertime = () => {
  router.push('/mobile/attendance/OvertimeApply')
}

const viewRecords = () => {
  router.push('/mobile/attendance/AttendanceRecord')
}

onMounted(() => {
  updateTime()
  getLocation()
  timeInterval = setInterval(updateTime, 1000)
  
  // 模拟今日打卡记录
  todayClockIn.value = '08:45:30'
  isClockedIn.value = true
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.clock-in {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.mobile-content {
  padding: 20px;
}

.time-display {
  text-align: center;
  margin-bottom: 30px;
}

.current-time {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 8px;
}

.current-date {
  font-size: 18px;
  margin-bottom: 12px;
  opacity: 0.9;
}

.location-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  opacity: 0.8;
}

.clock-section {
  text-align: center;
  margin-bottom: 30px;
}

.clock-button {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  cursor: pointer;
  transition: all 0.3s;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.clock-button:active {
  transform: scale(0.95);
}

.clock-button.clocked-in {
  background: rgba(7, 193, 96, 0.3);
  border-color: rgba(7, 193, 96, 0.5);
}

.clock-text {
  margin-top: 8px;
  font-size: 16px;
  font-weight: bold;
}

.clock-status {
  margin-bottom: 10px;
}

.attendance-info,
.week-stats,
.quick-functions {
  margin-bottom: 25px;
}

.stat-item {
  text-align: center;
  color: white;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.quick-functions span {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: white;
}

.clock-success {
  padding: 30px 20px;
  text-align: center;
  color: #333;
}

.clock-success h3 {
  margin: 15px 0 10px;
}

.clock-success p {
  margin: 5px 0;
  color: #666;
  font-size: 14px;
}
</style>