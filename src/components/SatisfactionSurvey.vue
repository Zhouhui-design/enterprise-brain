<template>
  <view class="satisfaction-survey">
    <view class="header-container">
      <view class="header-back" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="header-content">
        <text class="page-title">满意度调查</text>
        <text class="page-subtitle">您的反馈对我们很重要</text>
      </view>
    </view>

    <view class="survey-container">
      <!-- 调查说明 -->
      <view class="survey-intro">
        <view class="intro-icon">📋</view>
        <text class="intro-title">服务满意度调查</text>
        <text class="intro-desc">请花几分钟时间分享您的服务体验，帮助我们提供更好的服务</text>
        <view class="progress-info">
          <text class="progress-text">完成进度</text>
          <text class="progress-percent">{{ Math.round((completedQuestions / totalQuestions) * 100) }}%</text>
        </view>
        <view class="progress-bar">
          <view 
            class="progress-fill" 
            :style="{ width: (completedQuestions / totalQuestions) * 100 + '%' }"
          ></view>
        </view>
      </view>

      <!-- 调查表单 -->
      <form @submit="submitSurvey">
        <!-- 服务类型 -->
        <view class="survey-section" v-if="!surveyData.serviceId">
          <view class="section-header">
            <text class="section-number">1</text>
            <text class="section-title">服务类型</text>
          </view>
          
          <view class="service-options">
            <view 
              v-for="(service, index) in serviceTypes" 
              :key="index"
              class="service-option"
              :class="{ 'option-selected': surveyData.serviceType === service.value }"
              @tap="selectServiceType(service)"
            >
              <view class="service-icon">{{ service.icon }}</view>
              <text class="service-name">{{ service.name }}</text>
              <text class="service-desc">{{ service.description }}</text>
            </view>
          </view>
        </view>

        <!-- 总体满意度 -->
        <view class="survey-section">
          <view class="section-header">
            <text class="section-number">{{ getServiceType() ? 2 : 1 }}</text>
            <text class="section-title">总体满意度</text>
            <text class="section-desc">您对我们的服务总体满意度如何？</text>
          </view>
          
          <view class="rating-container">
            <text class="rating-label">请选择星级评分</text>
            <view class="rating-stars">
              <view 
                v-for="i in 5" 
                :key="i"
                class="star-item"
                :class="{ 'star-selected': i <= surveyData.overallRating }"
                @tap="setOverallRating(i)"
              >
                <text class="star-icon">{{ getStarIcon(i) }}</text>
              </view>
            </view>
            <text class="rating-text">{{ getRatingText(surveyData.overallRating) }}</text>
          </view>
        </view>

        <!-- 具体评分项目 -->
        <view class="survey-section">
          <view class="section-header">
            <text class="section-number">{{ getServiceType() ? 3 : 2 }}</text>
            <text class="section-title">具体评价</text>
            <text class="section-desc">请对以下方面进行评价</text>
          </view>

          <view 
            v-for="(item, index) in ratingItems" 
            :key="index"
            class="rating-item"
          >
            <text class="rating-label">{{ item.label }}</text>
            <view class="rating-stars-small">
              <view 
                v-for="i in 5" 
                :key="i"
                class="star-small"
                :class="{ 'star-selected': surveyData.detailedRatings[index] === i }"
                @tap="setDetailedRating(index, i)"
              >
                <text class="star-icon-small">⭐</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 改进建议 -->
        <view class="survey-section">
          <view class="section-header">
            <text class="section-number">{{ getServiceType() ? 4 : 3 }}</text>
            <text class="section-title">改进建议</text>
            <text class="section-desc">您认为我们有哪些需要改进的地方？</text>
          </view>

          <view class="suggestion-options">
            <view 
              v-for="(suggestion, index) in improvementSuggestions" 
              :key="index"
              class="suggestion-item"
              :class="{ 'item-selected': surveyData.improvements.includes(suggestion.value) }"
              @tap="toggleImprovement(suggestion.value)"
            >
              <view class="checkbox">
                <text class="check-icon" v-if="surveyData.improvements.includes(suggestion.value)">✓</text>
              </view>
              <text class="suggestion-text">{{ suggestion.label }}</text>
            </view>
          </view>

          <view class="other-suggestion">
            <text class="other-label">其他建议：</text>
            <textarea 
              class="other-textarea"
              v-model="surveyData.otherSuggestions"
              placeholder="请输入您的其他建议..."
              :maxlength="500"
              :show-confirm-bar="false"
            ></textarea>
            <text class="char-count">{{ surveyData.otherSuggestions.length }}/500</text>
          </view>
        </view>

        <!-- 联系信息 -->
        <view class="survey-section">
          <view class="section-header">
            <text class="section-number">{{ getServiceType() ? 5 : 4 }}</text>
            <text class="section-title">联系信息</text>
            <text class="section-desc">是否愿意接受后续回访？（选填）</text>
          </view>

          <view class="contact-item">
            <view class="switch-item" @tap="toggleContactWilling">
              <text class="switch-label">愿意接受回访</text>
              <view class="switch-button" :class="{ 'switch-on': surveyData.contactWilling }">
                <view class="switch-dot"></view>
              </view>
            </view>

            <view v-if="surveyData.contactWilling" class="contact-form">
              <view class="form-row">
                <text class="form-label">姓名</text>
                <input 
                  class="form-input"
                  type="text"
                  v-model="surveyData.contactName"
                  placeholder="请输入姓名"
                />
              </view>
              <view class="form-row">
                <text class="form-label">电话</text>
                <input 
                  class="form-input"
                  type="number"
                  v-model="surveyData.contactPhone"
                  placeholder="请输入联系电话"
                />
              </view>
            </view>
          </view>
        </view>

        <!-- 提交按钮 -->
        <view class="survey-actions">
          <button class="btn-save" @tap="saveDraft">保存草稿</button>
          <button class="btn-submit" @tap="submitSurvey" :disabled="!isFormValid()">
            提交调查
          </button>
        </view>
      </form>
    </view>

    <!-- 感谢页面 -->
    <view v-if="showThankYou" class="thank-you-container">
      <view class="thank-you-card">
        <view class="thank-you-icon">🎉</view>
        <text class="thank-you-title">感谢您的反馈！</text>
        <text class="thank-you-desc">您的意见对我们非常重要，我们将认真听取并不断改进服务。</text>
        
        <view class="reward-info" v-if="hasReward">
          <text class="reward-title">感谢奖励</text>
          <text class="reward-desc">{{ rewardInfo }}</text>
        </view>

        <button class="btn-back" @tap="goBack">返回</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// 页面参数
const serviceId = ref<string>('')
const serviceType = ref<string>('')

// 页面状态
const showThankYou = ref(false)
const hasReward = ref(true)

// 调查数据
const surveyData = ref({
  serviceId: '',
  serviceType: '',
  overallRating: 0,
  detailedRatings: [0, 0, 0, 0],
  improvements: [] as string[],
  otherSuggestions: '',
  contactWilling: false,
  contactName: '',
  contactPhone: ''
})

// 服务类型列表
const serviceTypes = ref([
  { 
    name: '维修服务', 
    icon: '🔧',
    description: '产品维修相关问题',
    value: 'repair'
  },
  { 
    name: '退换货', 
    icon: '↩️',
    description: '退货换货服务体验',
    value: 'return'
  },
  { 
    name: '投诉处理', 
    icon: '💭',
    description: '投诉相关问题处理',
    value: 'complaint'
  },
  { 
    name: '保修服务', 
    icon: '🛡️',
    description: '产品保修相关服务',
    value: 'warranty'
  },
  { 
    name: '客户服务', 
    icon: '💬',
    description: '客服咨询等服务',
    value: 'customer_service'
  },
  { 
    name: '其他服务', 
    icon: '📋',
    description: '其他售后服务',
    value: 'other'
  }
])

// 评分项目
const ratingItems = ref([
  { label: '响应速度', key: 'response_speed' },
  { label: '服务态度', key: 'service_attitude' },
  { label: '专业水平', key: 'professional_level' },
  { label: '解决效果', key: 'solution_effect' }
])

// 改进建议
const improvementSuggestions = ref([
  { label: '响应速度需要提升', value: 'response_speed' },
  { label: '服务态度需要改善', value: 'service_attitude' },
  { label: '专业水平需要提高', value: 'professional_level' },
  { label: '服务流程需要优化', value: 'service_process' },
  { label: '沟通方式需要改进', value: 'communication' },
  { label: '系统功能需要完善', value: 'system_function' }
])

// 奖励信息
const rewardInfo = ref('感谢您的参与，您将获得100积分奖励')

// 总问题数
const totalQuestions = computed(() => {
  return surveyData.value.serviceType ? 5 : 4
})

// 已完成问题数
const completedQuestions = computed(() => {
  let count = 0
  
  if (surveyData.value.serviceType) count++
  if (surveyData.value.overallRating > 0) count++
  if (surveyData.value.detailedRatings.some(r => r > 0)) count++
  if (surveyData.value.improvements.length > 0 || surveyData.value.otherSuggestions) count++
  
  return count
})

// 获取服务类型
const getServiceType = () => {
  return surveyData.value.serviceType
}

// 选择服务类型
const selectServiceType = (service: any) => {
  surveyData.value.serviceType = service.value
}

// 设置总体评分
const setOverallRating = (rating: number) => {
  surveyData.value.overallRating = rating
}

// 设置详细评分
const setDetailedRating = (index: number, rating: number) => {
  surveyData.value.detailedRatings[index] = rating
}

// 切换改进建议
const toggleImprovement = (value: string) => {
  const index = surveyData.value.improvements.indexOf(value)
  if (index >= 0) {
    surveyData.value.improvements.splice(index, 1)
  } else {
    surveyData.value.improvements.push(value)
  }
}

// 切换联系意愿
const toggleContactWilling = () => {
  surveyData.value.contactWilling = !surveyData.value.contactWilling
}

// 获取星星图标
const getStarIcon = (rating: number) => {
  if (rating <= surveyData.value.overallRating) {
    return '⭐'
  }
  return '☆'
}

// 获取评分文本
const getRatingText = (rating: number) => {
  const textMap: { [key: number]: string } = {
    1: '非常不满意',
    2: '不满意',
    3: '一般',
    4: '满意',
    5: '非常满意'
  }
  return textMap[rating] || ''
}

// 验证表单
const isFormValid = () => {
  return surveyData.value.overallRating > 0
}

// 保存草稿
const saveDraft = () => {
  try {
    uni.setStorageSync('satisfaction_survey_draft', surveyData.value)
    uni.showToast({
      title: '草稿已保存',
      icon: 'success'
    })
  } catch (error) {
    uni.showToast({
      title: '保存失败',
      icon: 'error'
    })
  }
}

// 加载草稿
const loadDraft = () => {
  try {
    const draft = uni.getStorageSync('satisfaction_survey_draft')
    if (draft) {
      Object.assign(surveyData.value, draft)
    }
  } catch (error) {
    console.error('加载草稿失败:', error)
  }
}

// 提交调查
const submitSurvey = async () => {
  if (!isFormValid()) {
    uni.showToast({
      title: '请完成必填项',
      icon: 'none'
    })
    return
  }

  uni.showLoading({
    title: '提交中...'
  })

  try {
    const db = uniCloud.database()
    const submitData = {
      ...surveyData.value,
      createTime: new Date().toISOString(),
      source: serviceId.value ? 'service_feedback' : 'general_survey'
    }

    await db.collection('satisfaction_surveys').add(submitData)

    // 清除草稿
    uni.removeStorageSync('satisfaction_survey_draft')

    uni.hideLoading()
    showThankYou.value = true

    // 如果有奖励，显示奖励信息
    if (hasReward.value) {
      // 可以在这里添加奖励发放逻辑
    }

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
  if (showThankYou.value) {
    uni.navigateBack({ delta: 2 })
  } else {
    uni.navigateBack()
  }
}

onLoad((options: any) => {
  serviceId.value = options.serviceId || ''
  serviceType.value = options.serviceType || ''
  surveyData.value.serviceId = serviceId.value
  surveyData.value.serviceType = serviceType.value
  
  loadDraft()
})
</script>

<style scoped>
.satisfaction-survey {
  min-height: 100vh;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  font-family: 'Source Han Sans SC', -system-ui, sans-serif;
}

.header-container {
  position: relative;
  height: 200rpx;
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
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

.page-subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  display: block;
  margin-top: 8rpx;
}

.survey-container {
  padding: 30rpx;
  padding-top: -60rpx;
  position: relative;
  z-index: 2;
}

.survey-intro {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  text-align: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 30rpx;
  transform: translateY(-40rpx);
}

.intro-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
  display: block;
}

.intro-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16rpx;
  display: block;
}

.intro-desc {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 32rpx;
  display: block;
}

.progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.progress-text {
  font-size: 24rpx;
  color: #6b7280;
}

.progress-percent {
  font-size: 28rpx;
  font-weight: 600;
  color: #f59e0b;
}

.progress-bar {
  height: 8rpx;
  background: #e5e7eb;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b 0%, #f97316 100%);
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

.survey-section {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.section-number {
  width: 60rpx;
  height: 60rpx;
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  border-radius: 50%;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
}

.section-desc {
  font-size: 24rpx;
  color: #6b7280;
  margin-top: 8rpx;
  display: block;
}

.service-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.service-option {
  background: #f9fafb;
  border: 2rpx solid #e5e7eb;
  border-radius: 20rpx;
  padding: 30rpx 20rpx;
  text-align: center;
  transition: all 0.3s ease;
}

.option-selected {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-color: #f59e0b;
  transform: translateY(-4rpx);
  box-shadow: 0 8rpx 24rpx rgba(245, 158, 11, 0.15);
}

.service-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
  display: block;
}

.service-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8rpx;
  display: block;
}

.service-desc {
  font-size: 22rpx;
  color: #6b7280;
  display: block;
}

.rating-container {
  text-align: center;
}

.rating-label {
  font-size: 28rpx;
  color: #1f2937;
  margin-bottom: 24rpx;
  display: block;
}

.rating-stars {
  display: flex;
  justify-content: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.star-item {
  transition: all 0.3s ease;
}

.star-selected {
  transform: scale(1.1);
}

.star-icon {
  font-size: 60rpx;
  color: #e5e7eb;
  transition: all 0.3s ease;
}

.star-selected .star-icon {
  color: #f59e0b;
}

.rating-text {
  font-size: 26rpx;
  color: #f59e0b;
  font-weight: 500;
}

.rating-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f3f4f6;
}

.rating-item:last-child {
  border-bottom: none;
}

.rating-stars-small {
  display: flex;
  gap: 12rpx;
}

.star-small {
  transition: all 0.3s ease;
}

.star-selected {
  transform: scale(1.1);
}

.star-icon-small {
  font-size: 36rpx;
  color: #e5e7eb;
  transition: all 0.3s ease;
}

.star-selected .star-icon-small {
  color: #f59e0b;
}

.suggestion-options {
  margin-bottom: 32rpx;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f3f4f6;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #e5e7eb;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.item-selected .checkbox {
  background: #f59e0b;
  border-color: #f59e0b;
}

.check-icon {
  font-size: 24rpx;
  color: #ffffff;
  font-weight: 600;
}

.suggestion-text {
  font-size: 26rpx;
  color: #1f2937;
  flex: 1;
}

.other-suggestion {
  margin-top: 24rpx;
}

.other-label {
  font-size: 26rpx;
  color: #1f2937;
  margin-bottom: 16rpx;
  display: block;
}

.other-textarea {
  width: 100%;
  min-height: 120rpx;
  border: 2rpx solid #e5e7eb;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 26rpx;
  color: #1f2937;
  background: #ffffff;
  line-height: 1.6;
  transition: all 0.3s ease;
}

.other-textarea:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 0 6rpx rgba(245, 158, 11, 0.1);
}

.char-count {
  font-size: 20rpx;
  color: #9ca3af;
  text-align: right;
  margin-top: 8rpx;
  display: block;
}

.contact-item {
  margin-top: 24rpx;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
}

.switch-label {
  font-size: 28rpx;
  color: #1f2937;
}

.switch-button {
  width: 100rpx;
  height: 56rpx;
  background: #e5e7eb;
  border-radius: 28rpx;
  position: relative;
  transition: all 0.3s ease;
}

.switch-on {
  background: #f59e0b;
}

.switch-dot {
  width: 48rpx;
  height: 48rpx;
  background: #ffffff;
  border-radius: 50%;
  position: absolute;
  top: 4rpx;
  left: 4rpx;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.switch-on .switch-dot {
  left: 48rpx;
}

.contact-form {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #f3f4f6;
}

.form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 24rpx;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 26rpx;
  color: #1f2937;
  margin-bottom: 12rpx;
  display: block;
}

.form-input {
  height: 80rpx;
  border: 2rpx solid #e5e7eb;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 26rpx;
  color: #1f2937;
  background: #ffffff;
  transition: all 0.3s ease;
}

.form-input:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 0 6rpx rgba(245, 158, 11, 0.1);
}

.survey-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 40rpx;
}

.btn-save,
.btn-submit {
  flex: 1;
  height: 88rpx;
  border-radius: 24rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  transition: all 0.3s ease;
}

.btn-save {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-submit {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  color: #ffffff;
}

.btn-submit:disabled {
  background: #d1d5db;
  color: #9ca3af;
}

.btn-save:active {
  transform: scale(0.98);
  background: #e5e7eb;
}

.btn-submit:active:not(:disabled) {
  transform: scale(0.98);
  background: linear-gradient(135deg, #d97706 0%, #ea580c 100%);
}

.thank-you-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
}

.thank-you-card {
  background: #ffffff;
  border-radius: 32rpx;
  padding: 60rpx 40rpx;
  text-align: center;
  box-shadow: 0 12rpx 48rpx rgba(0, 0, 0, 0.15);
  max-width: 600rpx;
}

.thank-you-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
  display: block;
}

.thank-you-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 20rpx;
  display: block;
}

.thank-you-desc {
  font-size: 28rpx;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 40rpx;
  display: block;
}

.reward-info {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 40rpx;
}

.reward-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #f59e0b;
  margin-bottom: 12rpx;
  display: block;
}

.reward-desc {
  font-size: 26rpx;
  color: #1f2937;
  display: block;
}

.btn-back {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  color: #ffffff;
  border: none;
  border-radius: 24rpx;
  padding: 20rpx 60rpx;
  font-size: 28rpx;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-back:active {
  transform: scale(0.98);
  background: linear-gradient(135deg, #d97706 0%, #ea580c 100%);
}
</style>