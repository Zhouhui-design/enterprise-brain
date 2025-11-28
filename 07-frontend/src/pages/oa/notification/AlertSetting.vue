<template>
  <div class="alert-setting">
    <!-- 工业风格头部区域 -->
    <header class="setting-header">
      <div class="header-left">
        <div class="title-section">
          <h1 class="page-title">提醒设置</h1>
          <div class="breadcrumb">
            <span class="breadcrumb-item">OA系统</span>
            <i class="fas fa-chevron-right breadcrumb-separator"></i>
            <span class="breadcrumb-item">通知中心</span>
            <i class="fas fa-chevron-right breadcrumb-separator"></i>
            <span class="breadcrumb-item active">提醒设置</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <button class="action-btn secondary" @click="handleReset">
          <i class="fas fa-undo"></i>
          <span>重置默认</span>
        </button>
        <button class="action-btn primary" @click="handleSave">
          <i class="fas fa-save"></i>
          <span>保存设置</span>
        </button>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="setting-main">
      <!-- 通知方式设置 -->
      <section class="setting-section">
        <div class="section-header">
          <div class="section-icon">
            <i class="fas fa-bell"></i>
          </div>
          <div class="section-info">
            <h2 class="section-title">通知方式</h2>
            <p class="section-description">选择接收系统通知的方式和渠道</p>
          </div>
        </div>

        <div class="setting-grid">
          <div class="setting-card">
            <div class="card-header">
              <div class="card-icon">
                <i class="fas fa-envelope"></i>
              </div>
              <div class="card-info">
                <h3>邮件通知</h3>
                <p>通过邮件接收重要通知</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="settings.email.enabled" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div v-if="settings.email.enabled" class="card-content">
              <div class="setting-item">
                <label>邮箱地址</label>
                <input 
                  v-model="settings.email.address" 
                  type="email" 
                  class="setting-input"
                  placeholder="example@company.com"
                />
              </div>
              <div class="setting-item">
                <label>通知级别</label>
                <select v-model="settings.email.level" class="setting-select">
                  <option value="all">全部通知</option>
                  <option value="important">重要通知</option>
                  <option value="urgent">紧急通知</option>
                </select>
              </div>
            </div>
          </div>

          <div class="setting-card">
            <div class="card-header">
              <div class="card-icon">
                <i class="fas fa-sms"></i>
              </div>
              <div class="card-info">
                <h3>短信通知</h3>
                <p>通过短信接收紧急通知</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="settings.sms.enabled" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div v-if="settings.sms.enabled" class="card-content">
              <div class="setting-item">
                <label>手机号码</label>
                <input 
                  v-model="settings.sms.phone" 
                  type="tel" 
                  class="setting-input"
                  placeholder="138********"
                />
              </div>
              <div class="setting-item">
                <label>通知时间</label>
                <div class="time-range">
                  <input 
                    v-model="settings.sms.startTime" 
                    type="time" 
                    class="setting-input small"
                  />
                  <span>至</span>
                  <input 
                    v-model="settings.sms.endTime" 
                    type="time" 
                    class="setting-input small"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="setting-card">
            <div class="card-header">
              <div class="card-icon">
                <i class="fas fa-desktop"></i>
              </div>
              <div class="card-info">
                <h3>桌面通知</h3>
                <p>在桌面显示系统通知</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="settings.desktop.enabled" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div v-if="settings.desktop.enabled" class="card-content">
              <div class="setting-item">
                <label>通知位置</label>
                <select v-model="settings.desktop.position" class="setting-select">
                  <option value="top-right">右上角</option>
                  <option value="top-left">左上角</option>
                  <option value="bottom-right">右下角</option>
                  <option value="bottom-left">左下角</option>
                </select>
              </div>
              <div class="setting-item">
                <label>显示时长</label>
                <select v-model="settings.desktop.duration" class="setting-select">
                  <option value="5">5秒</option>
                  <option value="10">10秒</option>
                  <option value="30">30秒</option>
                  <option value="60">1分钟</option>
                </select>
              </div>
            </div>
          </div>

          <div class="setting-card">
            <div class="card-header">
              <div class="card-icon">
                <i class="fas fa-mobile-alt"></i>
              </div>
              <div class="card-info">
                <h3>移动端通知</h3>
                <p>在移动设备上接收推送通知</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="settings.mobile.enabled" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div v-if="settings.mobile.enabled" class="card-content">
              <div class="setting-item">
                <label>震动提醒</label>
                <label class="toggle-switch small">
                  <input type="checkbox" v-model="settings.mobile.vibration" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="setting-item">
                <label>声音提醒</label>
                <label class="toggle-switch small">
                  <input type="checkbox" v-model="settings.mobile.sound" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 通知类型设置 -->
      <section class="setting-section">
        <div class="section-header">
          <div class="section-icon">
            <i class="fas fa-cogs"></i>
          </div>
          <div class="section-info">
            <h2 class="section-title">通知类型</h2>
            <p class="section-description">配置不同类型通知的提醒规则</p>
          </div>
        </div>

        <div class="notification-types">
          <div 
            v-for="(type, key) in settings.types" 
            :key="key"
            class="type-item"
          >
            <div class="type-header">
              <div class="type-info">
                <h4>{{ getTypeLabel(key) }}</h4>
                <p>{{ getTypeDescription(key) }}</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="type.enabled" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div v-if="type.enabled" class="type-content">
              <div class="type-options">
                <div class="option-group">
                  <h5>通知方式</h5>
                  <div class="checkbox-group">
                    <label class="checkbox-item">
                      <input type="checkbox" v-model="type.channels.email" />
                      <span class="checkmark"></span>
                      <span>邮件</span>
                    </label>
                    <label class="checkbox-item">
                      <input type="checkbox" v-model="type.channels.sms" />
                      <span class="checkmark"></span>
                      <span>短信</span>
                    </label>
                    <label class="checkbox-item">
                      <input type="checkbox" v-model="type.channels.desktop" />
                      <span class="checkmark"></span>
                      <span>桌面</span>
                    </label>
                    <label class="checkbox-item">
                      <input type="checkbox" v-model="type.channels.mobile" />
                      <span class="checkmark"></span>
                      <span>移动端</span>
                    </label>
                  </div>
                </div>
                
                <div class="option-group">
                  <h5>提醒频率</h5>
                  <select v-model="type.frequency" class="setting-select">
                    <option value="immediate">立即</option>
                    <option value="hourly">每小时汇总</option>
                    <option value="daily">每日汇总</option>
                    <option value="weekly">每周汇总</option>
                  </select>
                </div>
                
                <div v-if="key === 'approval'" class="option-group">
                  <h5>审批提醒</h5>
                  <div class="frequency-config">
                    <div class="config-item">
                      <label>首次提醒</label>
                      <input 
                        v-model="type.reminder.first" 
                        type="number" 
                        class="setting-input small"
                        min="1"
                        max="24"
                      />
                      <span>小时后</span>
                    </div>
                    <div class="config-item">
                      <label>重复提醒</label>
                      <input 
                        v-model="type.reminder.repeat" 
                        type="number" 
                        class="setting-input small"
                        min="1"
                        max="48"
                      />
                      <span>小时间隔</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 高级设置 -->
      <section class="setting-section">
        <div class="section-header">
          <div class="section-icon">
            <i class="fas fa-sliders-h"></i>
          </div>
          <div class="section-info">
            <h2 class="section-title">高级设置</h2>
            <p class="section-description">配置通知的高级选项和限制</p>
          </div>
        </div>

        <div class="advanced-settings">
          <div class="setting-group">
            <h4>免打扰时间</h4>
            <div class="do-not-disturb">
              <div class="time-range-setting">
                <label class="checkbox-item">
                  <input type="checkbox" v-model="settings.advanced.doNotDisturb.enabled" />
                  <span class="checkmark"></span>
                  <span>启用免打扰模式</span>
                </label>
                
                <div v-if="settings.advanced.doNotDisturb.enabled" class="time-range-config">
                  <div class="time-inputs">
                    <div class="time-input-group">
                      <label>开始时间</label>
                      <input 
                        v-model="settings.advanced.doNotDisturb.startTime" 
                        type="time" 
                        class="setting-input"
                      />
                    </div>
                    <div class="time-input-group">
                      <label>结束时间</label>
                      <input 
                        v-model="settings.advanced.doNotDisturb.endTime" 
                        type="time" 
                        class="setting-input"
                      />
                    </div>
                  </div>
                  
                  <div class="weekdays-setting">
                    <label>适用日期</label>
                    <div class="weekday-checkboxes">
                      <label v-for="(day, index) in weekdays" :key="index" class="weekday-item">
                        <input 
                          type="checkbox" 
                          v-model="settings.advanced.doNotDisturb.weekdays"
                          :value="index"
                        />
                        <span>{{ day }}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="setting-group">
            <h4>频率限制</h4>
            <div class="frequency-limits">
              <div class="limit-item">
                <label>每日最多通知数量</label>
                <input 
                  v-model.number="settings.advanced.limits.daily" 
                  type="number" 
                  class="setting-input"
                  min="1"
                  max="1000"
                />
              </div>
              <div class="limit-item">
                <label>每小时最多通知数量</label>
                <input 
                  v-model.number="settings.advanced.limits.hourly" 
                  type="number" 
                  class="setting-input"
                  min="1"
                  max="100"
                />
              </div>
              <div class="limit-item">
                <label>相同通知最小间隔（分钟）</label>
                <input 
                  v-model.number="settings.advanced.limits.interval" 
                  type="number" 
                  class="setting-input"
                  min="1"
                  max="1440"
                />
              </div>
            </div>
          </div>

          <div class="setting-group">
            <h4>优先级设置</h4>
            <div class="priority-settings">
              <div class="priority-item">
                <label>紧急通知穿透免打扰</label>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.advanced.priority.urgent" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="priority-item">
                <label>重要通知声音提醒</label>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.advanced.priority.important" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

// 响应式数据
const settings = reactive({
  email: {
    enabled: true,
    address: 'user@company.com',
    level: 'important'
  },
  sms: {
    enabled: false,
    phone: '138********',
    startTime: '09:00',
    endTime: '18:00'
  },
  desktop: {
    enabled: true,
    position: 'top-right',
    duration: '10'
  },
  mobile: {
    enabled: true,
    vibration: true,
    sound: true
  },
  types: {
    approval: {
      enabled: true,
      channels: {
        email: true,
        sms: false,
        desktop: true,
        mobile: true
      },
      frequency: 'immediate',
      reminder: {
        first: 2,
        repeat: 6
      }
    },
    task: {
      enabled: true,
      channels: {
        email: true,
        sms: false,
        desktop: true,
        mobile: true
      },
      frequency: 'immediate'
    },
    system: {
      enabled: true,
      channels: {
        email: true,
        sms: false,
        desktop: true,
        mobile: false
      },
      frequency: 'immediate'
    },
    document: {
      enabled: true,
      channels: {
        email: true,
        sms: false,
        desktop: true,
        mobile: true
      },
      frequency: 'daily'
    }
  },
  advanced: {
    doNotDisturb: {
      enabled: true,
      startTime: '22:00',
      endTime: '08:00',
      weekdays: [0, 1, 2, 3, 4, 5, 6]
    },
    limits: {
      daily: 100,
      hourly: 20,
      interval: 5
    },
    priority: {
      urgent: true,
      important: true
    }
  }
})

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 工具函数
const getTypeLabel = (key) => {
  const labels = {
    approval: '审批通知',
    task: '任务通知',
    system: '系统通知',
    document: '文档通知'
  }
  return labels[key] || '未知类型'
}

const getTypeDescription = (key) => {
  const descriptions = {
    approval: '工作流审批相关的通知提醒',
    task: '任务分配、更新、截止等通知',
    system: '系统维护、更新、错误等通知',
    document: '文档分享、编辑、版本更新等通知'
  }
  return descriptions[key] || '未知类型的通知'
}

// 事件处理
const handleSave = () => {
  console.log('保存设置:', settings)
  alert('设置已保存！')
}

const handleReset = () => {
  if (confirm('确定要重置为默认设置吗？')) {
    loadDefaultSettings()
    alert('已重置为默认设置')
  }
}

const loadDefaultSettings = () => {
  // 重新加载默认设置
  Object.assign(settings, {
    email: {
      enabled: true,
      address: 'user@company.com',
      level: 'important'
    },
    sms: {
      enabled: false,
      phone: '138********',
      startTime: '09:00',
      endTime: '18:00'
    },
    desktop: {
      enabled: true,
      position: 'top-right',
      duration: '10'
    },
    mobile: {
      enabled: true,
      vibration: true,
      sound: true
    }
  })
}

// 生命周期
onMounted(() => {
  // 这里可以加载用户现有的设置
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;600&display=swap');

/* CSS变量定义 */
:root {
  --primary-color: #2C3E50;
  --secondary-color: #34495E;
  --accent-color: #E67E22;
  --background-color: #ECF0F1;
  --text-color: #2C3E50;
  --border-color: #BDC3C7;
  --success-color: #27AE60;
  --warning-color: #F39C12;
  --danger-color: #E74C3C;
}

/* 基础样式 */
* {
  box-sizing: border-box;
}

.alert-setting {
  font-family: 'Source Sans Pro', sans-serif;
  background: var(--background-color);
  min-height: 100vh;
  color: var(--text-color);
}

/* 头部样式 */
.setting-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
}

.setting-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent-color);
}

.page-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.breadcrumb {
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  opacity: 0.9;
}

.breadcrumb-item {
  color: rgba(255, 255, 255, 0.8);
}

.breadcrumb-item.active {
  color: white;
  font-weight: 600;
}

.breadcrumb-separator {
  margin: 0 0.5rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-btn.primary {
  background: var(--accent-color);
  color: white;
}

.action-btn.primary:hover {
  background: #D35400;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.4);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 主内容区域 */
.setting-main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* 设置区域 */
.setting-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border-color);
}

.section-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--accent-color), #D35400);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.3);
}

.section-info {
  flex: 1;
}

.section-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
}

.section-description {
  color: #7F8C8D;
  margin: 0;
  font-size: 0.875rem;
}

/* 设置网格 */
.setting-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.setting-card {
  border: 2px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.setting-card:hover {
  border-color: var(--accent-color);
  box-shadow: 0 4px 15px rgba(230, 126, 34, 0.15);
}

.card-header {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.card-icon {
  width: 40px;
  height: 40px;
  background: var(--primary-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
}

.card-info {
  flex: 1;
}

.card-info h3 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
}

.card-info p {
  color: #7F8C8D;
  margin: 0;
  font-size: 0.875rem;
}

.card-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-item label {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--secondary-color);
  font-size: 0.875rem;
}

.setting-input,
.setting-select {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.3s ease;
  font-family: 'Source Sans Pro', sans-serif;
}

.setting-input:focus,
.setting-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

.setting-input.small {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.time-range span {
  color: var(--secondary-color);
  font-weight: 600;
}

/* 开关样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 32px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 24px;
  width: 24px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--success-color);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(28px);
}

.toggle-switch.small {
  width: 48px;
  height: 24px;
}

.toggle-switch.small .toggle-slider:before {
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
}

.toggle-switch.small input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

/* 通知类型 */
.notification-types {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.type-item {
  border: 2px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.type-item:hover {
  border-color: var(--accent-color);
  box-shadow: 0 4px 15px rgba(230, 126, 34, 0.15);
}

.type-header {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
}

.type-info h4 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
}

.type-info p {
  color: #7F8C8D;
  margin: 0;
  font-size: 0.875rem;
}

.type-content {
  padding: 1.5rem;
}

.type-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.option-group h5 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--secondary-color);
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-color);
}

.checkbox-item input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.checkbox-item input[type="checkbox"]:checked + .checkmark {
  background: var(--accent-color);
  border-color: var(--accent-color);
}

.checkbox-item input[type="checkbox"]:checked + .checkmark::after {
  content: '\f00c';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  color: white;
  font-size: 0.625rem;
}

.frequency-config {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.config-item label {
  font-size: 0.875rem;
  color: var(--secondary-color);
  min-width: 60px;
}

.config-item span {
  font-size: 0.875rem;
  color: var(--text-color);
}

/* 高级设置 */
.advanced-settings {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.setting-group h4 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--accent-color);
}

.do-not-disturb {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.time-range-setting {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.time-range-config {
  padding-left: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.time-inputs {
  display: flex;
  gap: 2rem;
  align-items: flex-end;
}

.time-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-input-group label {
  font-size: 0.875rem;
  color: var(--secondary-color);
  font-weight: 600;
}

.weekdays-setting {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.weekday-checkboxes {
  display: flex;
  gap: 1rem;
  padding-left: 2rem;
}

.weekday-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.weekday-item input {
  display: none;
}

.weekday-item span {
  width: 24px;
  height: 24px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--text-color);
  transition: all 0.3s ease;
}

.weekday-item input:checked + span {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

.frequency-limits,
.priority-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.limit-item,
.priority-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.limit-item label,
.priority-item label {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--secondary-color);
  font-size: 0.875rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .setting-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .setting-main {
    padding: 1rem;
  }
  
  .setting-section {
    padding: 1.5rem;
  }
  
  .setting-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .card-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .type-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .type-options {
    grid-template-columns: 1fr;
  }
  
  .time-inputs {
    flex-direction: column;
    gap: 1rem;
  }
  
  .weekday-checkboxes {
    flex-wrap: wrap;
    padding-left: 0;
  }
}
</style>