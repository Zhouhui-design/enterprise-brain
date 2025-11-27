<template>
  <div class="location-scan mobile-page">
    <div class="mobile-header">
      <van-nav-bar
        title="库位扫描"
        left-text="返回"
        left-arrow
        @click-left="$router.back()"
      />
    </div>

    <div class="mobile-content">
      <!-- 扫码区域 -->
      <div class="scan-section">
        <div class="scan-box" :class="{ scanning: isScanning }" @click="startScan">
          <div class="scan-border">
            <div class="scan-line" v-if="isScanning"></div>
            <div class="scan-tips" v-if="!isScanning">
              <van-icon name="scan" size="48" color="#1989fa" />
              <p>扫描库位二维码</p>
            </div>
          </div>
        </div>

        <van-field
          v-model="locationCode"
          placeholder="请输入或扫描库位编码"
          clearable
        />
      </div>

      <!-- 库位信息 -->
      <div class="location-info" v-if="locationInfo">
        <van-cell-group>
          <van-cell title="库位编码" :value="locationInfo.code" />
          <van-cell title="库位名称" :value="locationInfo.name" />
          <van-cell title="所属区域" :value="locationInfo.area" />
          <van-cell title="库位类型" :value="locationInfo.type" />
          <van-cell title="状态">
            <template #value>
              <van-tag :type="getStatusType(locationInfo.status)">
                {{ locationInfo.status }}
              </van-tag>
            </template>
          </van-cell>
          <van-cell title="容量" :value="`${locationInfo.used}/${locationInfo.capacity}`" />
        </van-cell-group>
      </div>

      <!-- 操作功能 -->
      <div class="operations" v-if="locationInfo">
        <van-grid :column-num="2" :gutter="12">
          <van-grid-item @click="viewInventory">
            <van-icon name="list-switch" size="24" color="#1989fa" />
            <span>查看库存</span>
          </van-grid-item>
          <van-grid-item @click="moveInventory">
            <van-icon name="exchange" size="24" color="#07c160" />
            <span>库存移位</span>
          </van-grid-item>
          <van-grid-item @click="updateLocation">
            <van-icon name="edit" size="24" color="#ff976a" />
            <span>库位维护</span>
          </van-grid-item>
          <van-grid-item @click="printLabel">
            <van-icon name="printer" size="24" color="#7d7e80" />
            <span>打印标签</span>
          </van-grid-item>
        </van-grid>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast, showSuccessToast } from 'vant'

const isScanning = ref(false)
const locationCode = ref('')
const locationInfo = ref(null)

const startScan = () => {
  isScanning.value = true
  
  setTimeout(() => {
    isScanning.value = false
    locationCode.value = 'A-01-01'
    handleLocationScan(locationCode.value)
  }, 2000)
}

const handleLocationScan = (code: string) => {
  locationInfo.value = {
    code: code,
    name: 'A区1排1列',
    area: 'A区 - 发动机零部件',
    type: '普通库位',
    status: '正常',
    used: 25,
    capacity: 50
  }
  
  showSuccessToast('库位识别成功')
}

const getStatusType = (status: string) => {
  switch (status) {
    case '正常': return 'success'
    case '锁定': return 'warning'
    case '禁用': return 'danger'
    default: return ''
  }
}

const viewInventory = () => {
  showToast('查看库存列表')
}

const moveInventory = () => {
  showToast('库存移位')
}

const updateLocation = () => {
  showToast('库位维护')
}

const printLabel = () => {
  showToast('打印库位标签')
}

onMounted(() => {
  // 页面初始化
})
</script>

<style scoped>
.location-scan {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 16px;
}

.scan-section {
  margin-bottom: 20px;
}

.scan-box {
  width: 100%;
  height: 200px;
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
  border: 2px solid #1989fa;
  border-radius: 8px;
  position: relative;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #1989fa, transparent);
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
  color: #1989fa;
}

.scan-tips p {
  margin-top: 8px;
  font-size: 14px;
}

.scan-box.scanning {
  background: radial-gradient(circle, rgba(25, 137, 250, 0.1) 0%, transparent 70%);
}

.location-info,
.operations {
  margin-bottom: 20px;
}

.operations span {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #646566;
}
</style>