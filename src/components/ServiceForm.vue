<template>
  <view class="service-form">
    <view class="header-container">
      <view class="header-back" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="header-content">
        <text class="page-title">{{ formData.title || '服务申请' }}</text>
      </view>
    </view>

    <view class="form-container">
      <!-- 服务类型显示 -->
      <view class="service-type-card">
        <view class="type-icon">{{ getServiceIcon() }}</view>
        <text class="type-name">{{ getServiceName() }}</text>
        <text class="type-desc">{{ getServiceDescription() }}</text>
      </view>

      <!-- 表单内容 -->
      <form @submit="submitForm">
        <!-- 基础信息 -->
        <view class="form-section">
          <view class="section-header">
            <text class="section-title">基础信息</text>
          </view>
          
          <view class="form-item">
            <text class="form-label">申请标题 <text class="required">*</text></text>
            <input 
              class="form-input"
              type="text"
              v-model="formData.title"
              placeholder="请输入申请标题"
              :maxlength="50"
            />
          </view>

          <view class="form-item">
            <text class="form-label">关联订单</text>
            <picker 
              @change="onOrderChange" 
              :value="orderIndex" 
              :range="orderList" 
              range-key="orderNumber"
              class="form-picker"
            >
              <view class="picker-content">
                <text class="picker-text" :class="{ 'picker-placeholder': !formData.orderId }">
                  {{ formData.orderId ? selectedOrder.orderNumber : '请选择关联订单' }}
                </text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>

          <view class="form-item">
            <text class="form-label">联系电话 <text class="required">*</text></text>
            <input 
              class="form-input"
              type="number"
              v-model="formData.contactPhone"
              placeholder="请输入联系电话"
            />
          </view>
        </view>

        <!-- 产品信息 -->
        <view class="form-section" v-if="showProductInfo()">
          <view class="section-header">
            <text class="section-title">产品信息</text>
          </view>

          <view class="product-info-card" v-if="selectedOrder">
            <image 
              class="product-image" 
              :src="selectedOrder.productImage || '/static/images/product-placeholder.png'"
              mode="aspectFill"
            />
            <view class="product-details">
              <text class="product-name">{{ selectedOrder.productName }}</text>
              <text class="product-spec">{{ selectedOrder.specification }}</text>
              <text class="product-price">¥{{ selectedOrder.price }}</text>
            </view>
          </view>

          <view class="form-item">
            <text class="form-label">产品数量</text>
            <input 
              class="form-input"
              type="number"
              v-model="formData.quantity"
              placeholder="请输入产品数量"
            />
          </view>

          <view class="form-item" v-if="formData.type === 'exchange'">
            <text class="form-label">期望规格</text>
            <input 
              class="form-input"
              type="text"
              v-model="formData.expectedSpec"
              placeholder="请输入期望的产品规格"
            />
          </view>
        </view>

        <!-- 问题描述 -->
        <view class="form-section">
          <view class="section-header">
            <text class="section-title">问题描述 <text class="required">*</text></text>
          </view>

          <view class="form-item">
            <text class="form-label">问题类型</text>
            <picker 
              @change="onIssueTypeChange" 
              :value="issueTypeIndex" 
              :range="issueTypes" 
              range-key="label"
              class="form-picker"
            >
              <view class="picker-content">
                <text class="picker-text" :class="{ 'picker-placeholder': !formData.issueType }">
                  {{ formData.issueType ? getSelectedIssueType().label : '请选择问题类型' }}
                </text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>

          <view class="form-item">
            <text class="form-label">详细描述 <text class="required">*</text></text>
            <textarea 
              class="form-textarea"
              v-model="formData.description"
              placeholder="请详细描述您遇到的问题或需求"
              :maxlength="500"
              :show-confirm-bar="false"
            ></textarea>
            <text class="char-count">{{ formData.description.length }}/500</text>
          </view>
        </view>

        <!-- 图片上传 -->
        <view class="form-section">
          <view class="section-header">
            <text class="section-title">相关图片</text>
            <text class="section-desc">上传相关图片有助于快速处理（最多6张）</text>
          </view>

          <view class="image-upload">
            <view class="image-grid">
              <view 
                v-for="(image, index) in formData.images" 
                :key="index"
                class="image-item"
              >
                <image 
                  class="uploaded-image" 
                  :src="image" 
                  mode="aspectFill"
                  @tap="previewImage(image)"
                />
                <view class="image-delete" @tap="deleteImage(index)">
                  <text class="delete-icon">×</text>
                </view>
              </view>
              
              <view 
                v-if="formData.images.length < 6"
                class="image-add"
                @tap="chooseImage"
              >
                <text class="add-icon">+</text>
                <text class="add-text">添加图片</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 期望解决方案 -->
        <view class="form-section">
          <view class="section-header">
            <text class="section-title">期望解决方案</text>
          </view>
          
          <view class="form-item">
            <text class="form-label">期望结果</text>
            <textarea 
              class="form-textarea"
              v-model="formData.expectedSolution"
              placeholder="请描述您期望的解决方案"
              :maxlength="300"
              :show-confirm-bar="false"
            ></textarea>
            <text class="char-count">{{ formData.expectedSolution.length }}/300</text>
          </view>
        </view>

        <!-- 提交按钮 -->
        <view class="form-actions">
          <button class="btn-cancel" @tap="goBack">取消</button>
          <button class="btn-submit" @tap="submitForm" :disabled="!isFormValid()">
            提交申请
          </button>
        </view>
      </form>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// 页面参数
const type = ref<string>('')
const id = ref<string>('')

// 表单数据
const formData = ref({
  type: '',
  title: '',
  orderId: '',
  contactPhone: '',
  quantity: 1,
  expectedSpec: '',
  issueType: '',
  description: '',
  images: [] as string[],
  expectedSolution: ''
})

// 选择器索引
const orderIndex = ref(0)
const issueTypeIndex = ref(0)

// 订单列表
const orderList = ref<any[]>([])
const selectedOrder = computed(() => {
  return orderList.value.find(order => order.id === formData.value.orderId)
})

// 问题类型列表
const issueTypes = ref([
  { label: '产品质量问题', value: 'quality' },
  { label: '物流配送问题', value: 'logistics' },
  { label: '功能使用问题', value: 'functionality' },
  { label: '外观瑕疵', value: 'appearance' },
  { label: '性能问题', value: 'performance' },
  { label: '其他问题', value: 'other' }
])

// 获取选中的问题类型
const getSelectedIssueType = () => {
  return issueTypes.value.find(type => type.value === formData.value.issueType) || { label: '', value: '' }
}

// 订单选择变化
const onOrderChange = (e: any) => {
  orderIndex.value = e.detail.value
  formData.value.orderId = orderList.value[e.detail.value]?.id || ''
}

// 问题类型选择变化
const onIssueTypeChange = (e: any) => {
  issueTypeIndex.value = e.detail.value
  formData.value.issueType = issueTypes.value[e.detail.value]?.value || ''
}

// 是否显示产品信息
const showProductInfo = () => {
  return ['return', 'exchange', 'warranty'].includes(formData.value.type)
}

// 获取服务图标
const getServiceIcon = () => {
  const iconMap: { [key: string]: string } = {
    'return': '↩️',
    'exchange': '🔄',
    'complaint': '💭',
    'warranty': '🛡️',
    'consultation': '💡',
    'repair': '🔨'
  }
  return iconMap[formData.value.type] || '📋'
}

// 获取服务名称
const getServiceName = () => {
  const nameMap: { [key: string]: string } = {
    'return': '退货申请',
    'exchange': '换货申请',
    'complaint': '投诉申请',
    'warranty': '保修申请',
    'consultation': '技术咨询',
    'repair': '维修申请'
  }
  return nameMap[formData.value.type] || '服务申请'
}

// 获取服务描述
const getServiceDescription = () => {
  const descMap: { [key: string]: string } = {
    'return': '不满意商品，申请退款退货',
    'exchange': '更换不同规格或颜色的商品',
    'complaint': '对服务或产品进行投诉',
    'warranty': '产品质量问题申请保修服务',
    'consultation': '产品使用技术咨询',
    'repair': '产品故障维修申请'
  }
  return descMap[formData.value.type] || '请填写相关申请信息'
}

// 选择图片
const chooseImage = () => {
  uni.chooseImage({
    count: 6 - formData.value.images.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      formData.value.images.push(...res.tempFilePaths)
    }
  })
}

// 预览图片
const previewImage = (url: string) => {
  uni.previewImage({
    current: url,
    urls: formData.value.images
  })
}

// 删除图片
const deleteImage = (index: number) => {
  formData.value.images.splice(index, 1)
}

// 验证表单
const isFormValid = () => {
  return formData.value.title.trim() && 
         formData.value.contactPhone.trim() && 
         formData.value.description.trim()
}

// 提交表单
const submitForm = async () => {
  if (!isFormValid()) {
    uni.showToast({
      title: '请填写必填项',
      icon: 'none'
    })
    return
  }

  uni.showLoading({
    title: '提交中...'
  })

  try {
    const db = uniCloud.database()
    const collection = formData.value.type === 'complaint' ? 'complaints' : 
                    formData.value.type === 'warranty' ? 'warranties' : 
                    ['return', 'exchange'].includes(formData.value.type) ? 'returns_exchanges' : 'service_requests'
    
    const submitData = {
      ...formData.value,
      status: 'submitted',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }

    if (id.value) {
      // 编辑模式
      await db.collection(collection).doc(id.value).update(submitData)
    } else {
      // 新建模式
      await db.collection(collection).add(submitData)
    }

    uni.hideLoading()
    uni.showToast({
      title: '提交成功',
      icon: 'success'
    })

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)

  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '提交失败',
      icon: 'error'
    })
  }
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 获取订单列表
const fetchOrders = async () => {
  try {
    const db = uniCloud.database()
    const res = await db.collection('orders')
      .orderBy('createTime', 'desc')
      .limit(20)
      .get()
    
    if (res.data && res.data.length > 0) {
      orderList.value = res.data
    } else {
      // 使用模拟数据
      orderList.value = [
        {
          id: 'ORD001',
          orderNumber: 'ORD20240115001',
          productName: 'iPhone 15 Pro',
          specification: '256GB 钛金属',
          price: '9999',
          productImage: ''
        },
        {
          id: 'ORD002',
          orderNumber: 'ORD20240112002',
          specification: 'USB-C版',
          price: '1899',
          productImage: ''
        }
      ]
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
  }
}

// 获取申请详情（编辑模式）
const fetchRequestDetail = async () => {
  if (!id.value) return

  try {
    const db = uniCloud.database()
    const collection = formData.value.type === 'complaint' ? 'complaints' : 
                    formData.value.type === 'warranty' ? 'warranties' : 
                    ['return', 'exchange'].includes(formData.value.type) ? 'returns_exchanges' : 'service_requests'
    
    const res = await db.collection(collection).doc(id.value).get()
    
    if (res.data) {
      Object.assign(formData.value, res.data)
      
      // 设置选择器索引
      const orderIdx = orderList.value.findIndex(order => order.id === res.data.orderId)
      if (orderIdx >= 0) {
        orderIndex.value = orderIdx
      }
      
      const issueIdx = issueTypes.value.findIndex(type => type.value === res.data.issueType)
      if (issueIdx >= 0) {
        issueTypeIndex.value = issueIdx
      }
    }
  } catch (error) {
    console.error('获取申请详情失败:', error)
  }
}

onLoad((options: any) => {
  type.value = options.type || ''
  id.value = options.id || ''
  formData.value.type = type.value
  formData.value.title = options.title || ''
  
  fetchOrders().then(() => {
    if (id.value) {
      fetchRequestDetail()
    }
  })
})
</script>

<style scoped>
.service-form {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  font-family: 'Source Han Sans SC', -system-ui, sans-serif;
}

.header-container {
  position: relative;
  height: 200rpx;
  background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
}

.header-back {
  position: absolute;
  top: 60rpx;
  left: 30rpx;
  width: 80rpx;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10rpx);
}

.back-icon {
  font-size: 40rpx;
  color: #ffffff;
  font-weight: 300;
}

.header-content {
  position: absolute;
  bottom: 40rpx;
  left: 60rpx;
  right: 60rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
  display: block;
}

.form-container {
  padding: 30rpx;
  padding-top: -60rpx;
  position: relative;
  z-index: 2;
}

.service-type-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  text-align: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 30rpx;
  transform: translateY(-40rpx);
}

.type-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
  display: block;
}

.type-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12rpx;
  display: block;
}

.type-desc {
  font-size: 26rpx;
  color: #6b7280;
  display: block;
}

.form-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8rpx;
}

.section-desc {
  font-size: 24rpx;
  color: #6b7280;
}

.form-item {
  margin-bottom: 32rpx;
}

.form-label {
  font-size: 26rpx;
  color: #374151;
  font-weight: 500;
  margin-bottom: 16rpx;
  display: block;
}

.required {
  color: #dc2626;
}

.form-input {
  width: 100%;
  height: 88rpx;
  border: 2rpx solid #e5e7eb;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #1f2937;
  background: #ffffff;
  transition: all 0.3s ease;
}

.form-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 6rpx rgba(59, 130, 246, 0.1);
}

.form-picker {
  width: 100%;
}

.picker-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 88rpx;
  border: 2rpx solid #e5e7eb;
  border-radius: 16rpx;
  padding: 0 24rpx;
  background: #ffffff;
}

.picker-text {
  font-size: 28rpx;
  color: #1f2937;
  flex: 1;
}

.picker-placeholder {
  color: #9ca3af;
}

.picker-arrow {
  font-size: 24rpx;
  color: #9ca3af;
}

.form-textarea {
  width: 100%;
  min-height: 160rpx;
  border: 2rpx solid #e5e7eb;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: #1f2937;
  background: #ffffff;
  line-height: 1.6;
  transition: all 0.3s ease;
}

.form-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 6rpx rgba(59, 130, 246, 0.1);
}

.char-count {
  font-size: 22rpx;
  color: #9ca3af;
  text-align: right;
  margin-top: 8rpx;
  display: block;
}

.product-info-card {
  display: flex;
  gap: 24rpx;
  padding: 24rpx;
  background: #f9fafb;
  border-radius: 16rpx;
  margin-bottom: 32rpx;
}

.product-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  background: #e5e7eb;
}

.product-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8rpx;
}

.product-spec {
  font-size: 24rpx;
  color: #6b7280;
  margin-bottom: 8rpx;
}

.product-price {
  font-size: 26rpx;
  font-weight: 600;
  color: #dc2626;
}

.image-upload {
  margin-bottom: 32rpx;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.image-item {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  border-radius: 16rpx;
  overflow: hidden;
}

.uploaded-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 16rpx;
}

.image-delete {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 48rpx;
  height: 48rpx;
  background: #dc2626;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(220, 38, 38, 0.3);
}

.delete-icon {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: 300;
}

.image-add {
  width: 100%;
  padding-bottom: 100%;
  border: 2rpx dashed #d1d5db;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #f9fafb;
}

.add-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -60%);
  font-size: 48rpx;
  color: #9ca3af;
}

.add-text {
  position: absolute;
  top: 65%;
  left: 50%;
  transform: translate(-50%, -40%);
  font-size: 20rpx;
  color: #6b7280;
}

.form-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 40rpx;
}

.btn-cancel,
.btn-submit {
  flex: 1;
  height: 88rpx;
  border-radius: 24rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-submit {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
}

.btn-submit:disabled {
  background: #d1d5db;
  color: #9ca3af;
}

.btn-cancel:active {
  transform: scale(0.98);
  background: #e5e7eb;
}

.btn-submit:active:not(:disabled) {
  transform: scale(0.98);
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}
</style>