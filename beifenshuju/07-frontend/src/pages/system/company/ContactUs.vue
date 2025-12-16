<template>
  <div class="contact-page" lang="zh-CN">
    <!-- SEO Meta Tags -->
    <Head>
      <title>联系方式 - Enterprise Brain 智能制造解决方案</title>
      <meta name="description" content="联系Enterprise Brain，获取专业的智能制造、供应链管理解决方案。电话：400-888-9999，邮箱：contact@enterprise-brain.com">
      <meta name="keywords" content="联系我们,联系方式,客服电话,企业邮箱,智能制造解决方案">
      <meta property="og:title" content="联系方式 - Enterprise Brain">
      <meta property="og:description" content="联系Enterprise Brain，获取专业的智能制造解决方案">
      <meta property="og:type" content="website">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="canonical" href="https://enterprise-brain.com/system/company/ContactUs">
    </Head>

    <!-- 页面头部 -->
    <header class="contact-header" role="banner">
      <div class="header-content">
        <h1 class="page-title">联系我们</h1>
        <p class="page-subtitle">我们随时为您提供专业的服务和支持</p>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="contact-main" role="main">
      <!-- 联系信息和留言表单容器 -->
      <div class="contact-container">
        <!-- 左侧：联系信息 -->
        <section class="contact-info-section" aria-labelledby="contact-info-title">
          <h2 id="contact-info-title" class="section-title">联系信息</h2>
          <div class="info-cards">
            <!-- 公司地址卡片 -->
            <div class="info-card" role="region" aria-label="公司地址">
              <div class="card-icon">
                <el-icon><MapLocation /></el-icon>
              </div>
              <div class="card-content">
                <h3 class="card-title">公司地址</h3>
                <p class="card-text">北京市海淀区中关村科技园区88号</p>
                <p class="card-detail">邮编：100080</p>
              </div>
            </div>

            <!-- 联系电话卡片 -->
            <div class="info-card" role="region" aria-label="联系电话">
              <div class="card-icon">
                <el-icon><Phone /></el-icon>
              </div>
              <div class="card-content">
                <h3 class="card-title">联系电话</h3>
                <p class="card-text">400-888-9999</p>
                <p class="card-detail">工作日 9:00-18:00</p>
              </div>
            </div>

            <!-- 电子邮箱卡片 -->
            <div class="info-card" role="region" aria-label="电子邮箱">
              <div class="card-icon">
                <el-icon><Message /></el-icon>
              </div>
              <div class="card-content">
                <h3 class="card-title">电子邮箱</h3>
                <p class="card-text">contact@enterprise-brain.com</p>
                <p class="card-detail">商务合作：business@enterprise-brain.com</p>
              </div>
            </div>

            <!-- 工作时间卡片 -->
            <div class="info-card" role="region" aria-label="工作时间">
              <div class="card-icon">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="card-content">
                <h3 class="card-title">工作时间</h3>
                <p class="card-text">周一至周五 9:00-18:00</p>
                <p class="card-detail">节假日除外</p>
              </div>
            </div>

            <!-- 技术支持卡片 -->
            <div class="info-card" role="region" aria-label="技术支持">
              <div class="card-icon">
                <el-icon><Service /></el-icon>
              </div>
              <div class="card-content">
                <h3 class="card-title">技术支持</h3>
                <p class="card-text">7×24小时在线服务</p>
                <p class="card-detail">支持电话：400-888-8888</p>
              </div>
            </div>
          </div>

          <!-- 地图区域 -->
          <div class="map-section" role="region" aria-label="公司位置地图">
            <h3 class="map-title">公司位置</h3>
            <div class="map-container">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="公司位置地图" 
                class="map-image"
                @error="handleMapError"
              />
              <div class="map-overlay" v-if="mapError">
                <el-icon><Location /></el-icon>
                <p>地图加载失败，请联系我们获取详细位置信息</p>
              </div>
            </div>
            <div class="map-info">
              <p><strong>交通指南：</strong>地铁4号线中关村站A出口，步行5分钟</p>
              <p><strong>停车信息：</strong>大厦地下停车场，访客可免费停车2小时</p>
            </div>
          </div>
        </section>

        <!-- 右侧：在线留言表单 -->
        <section class="contact-form-section" aria-labelledby="contact-form-title">
          <h2 id="contact-form-title" class="section-title">在线留言</h2>
          <div class="form-container">
            <el-form 
              ref="contactFormRef"
              :model="messageForm" 
              :rules="formRules"
              label-width="80px" 
              label-position="top"
              @submit.prevent="submitMessage"
              class="contact-form"
            >
              <!-- 姓名输入 -->
              <el-form-item 
                label="姓名" 
                prop="name"
                :error="formErrors.name"
              >
                <el-input 
                  v-model="messageForm.name" 
                  placeholder="请输入您的姓名"
                  clearable
                  :maxlength="50"
                  show-word-limit
                  @blur="validateField('name')"
                >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <!-- 电话输入 -->
              <el-form-item 
                label="电话" 
                prop="phone"
                :error="formErrors.phone"
              >
                <el-input 
                  v-model="messageForm.phone" 
                  placeholder="请输入您的联系电话"
                  clearable
                  :maxlength="20"
                  @blur="validateField('phone')"
                >
                  <template #prefix>
                    <el-icon><Phone /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <!-- 邮箱输入 -->
              <el-form-item 
                label="邮箱" 
                prop="email"
                :error="formErrors.email"
              >
                <el-input 
                  v-model="messageForm.email" 
                  placeholder="请输入您的电子邮箱"
                  clearable
                  :maxlength="100"
                  @blur="validateField('email')"
                >
                  <template #prefix>
                    <el-icon><Message /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <!-- 公司类型选择 -->
              <el-form-item 
                label="公司类型" 
                prop="companyType"
                :error="formErrors.companyType"
              >
                <el-select 
                  v-model="messageForm.companyType" 
                  placeholder="请选择公司类型"
                  clearable
                  class="full-width"
                >
                  <el-option 
                    v-for="type in companyTypes" 
                    :key="type.value"
                    :label="type.label" 
                    :value="type.value"
                  />
                </el-select>
              </el-form-item>

              <!-- 咨询类型选择 -->
              <el-form-item 
                label="咨询类型" 
                prop="inquiryType"
                :error="formErrors.inquiryType"
              >
                <el-select 
                  v-model="messageForm.inquiryType" 
                  placeholder="请选择咨询类型"
                  clearable
                  class="full-width"
                >
                  <el-option 
                    v-for="type in inquiryTypes" 
                    :key="type.value"
                    :label="type.label" 
                    :value="type.value"
                  />
                </el-select>
              </el-form-item>

              <!-- 留言内容 -->
              <el-form-item 
                label="留言内容" 
                prop="content"
                :error="formErrors.content"
              >
                <el-input 
                  v-model="messageForm.content" 
                  type="textarea" 
                  :rows="5"
                  placeholder="请详细描述您的需求或问题，我们将尽快与您联系"
                  :maxlength="500"
                  show-word-limit
                  resize="vertical"
                  @blur="validateField('content')"
                />
              </el-form-item>

              <!-- 附加信息 -->
              <el-form-item label="附加信息">
                <div class="additional-info">
                  <el-checkbox v-model="messageForm.subscribeNewsletter">
                    订阅我们的产品资讯和行业动态
                  </el-checkbox>
                  <el-checkbox v-model="messageForm.urgencyFlag">
                    紧急联系，请尽快回复
                  </el-checkbox>
                </div>
              </el-form-item>

              <!-- 提交按钮 -->
              <el-form-item class="form-actions">
                <el-button 
                  type="primary" 
                  @click="submitMessage"
                  :loading="submitting"
                  :disabled="!isFormValid"
                  class="submit-btn"
                  size="large"
                >
                  <el-icon><Message /></el-icon>
                  {{ submitting ? '提交中...' : '提交留言' }}
                </el-button>
                <el-button 
                  @click="resetForm"
                  :disabled="submitting"
                  class="reset-btn"
                  size="large"
                >
                  <el-icon><Refresh /></el-icon>
                  重置表单
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </section>
      </div>

      <!-- 常见问题区域 -->
      <section class="faq-section" aria-labelledby="faq-title">
        <h2 id="faq-title" class="section-title">常见问题</h2>
        <div class="faq-container">
          <div 
            v-for="(faq, index) in faqs" 
            :key="index"
            class="faq-item"
            @click="toggleFAQ(index)"
            :class="{ 'faq-active': expandedFAQs[index] }"
            role="button"
            :aria-expanded="expandedFAQs[index]"
            :aria-controls="faq-content-${index}"
            tabindex="0"
            @keydown.enter="toggleFAQ(index)"
            @keydown.space.prevent="toggleFAQ(index)"
          >
            <div class="faq-question">
              <el-icon class="faq-icon"><QuestionFilled /></el-icon>
              <span>{{ faq.question }}</span>
              <el-icon class="faq-expand-icon">
                <ArrowRight v-if="!expandedFAQs[index]" />
                <ArrowDown v-else />
              </el-icon>
            </div>
            <div 
              :id="`faq-content-${index}`"
              class="faq-answer"
              v-show="expandedFAQs[index]"
            >
              <p>{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 页脚导航 -->
    <footer class="page-footer" role="contentinfo">
      <nav class="footer-links" :aria-label="'页面导航'">
        <router-link 
          v-for="link in footerLinks" 
          :key="link.path"
          :to="link.path" 
          class="footer-link"
          :class="{ active: link.active }"
          :aria-current="link.active ? 'page' : null"
        >
          {{ link.label }}
        </router-link>
      </nav>
    </footer>

    <!-- 成功提示对话框 -->
    <el-dialog
      v-model="showSuccessDialog"
      title="提交成功"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      :aria-label="'提交成功对话框'"
    >
      <div class="success-content">
        <el-icon class="success-icon"><SuccessFilled /></el-icon>
        <p>您的留言已成功提交！我们将在24小时内与您联系。</p>
        <p class="success-detail">如需紧急联系，请拨打：400-888-9999</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="showSuccessDialog = false">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 错误提示对话框 -->
    <el-dialog
      v-model="showErrorDialog"
      title="提交失败"
      width="400px"
      :close-on-click-modal="true"
      :aria-label="'错误提示对话框'"
    >
      <div class="error-content">
        <el-icon class="error-icon"><CircleCloseFilled /></el-icon>
        <p>{{ errorMessage }}</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="showErrorDialog = false">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElForm } from 'element-plus';
import { Head } from '@vueuse/head';
import { 
  MapLocation, Phone, Message, Clock, Service, User, Refresh,
  QuestionFilled, ArrowRight, ArrowDown, SuccessFilled, CircleCloseFilled
} from '@element-plus/icons-vue';

// ==================== 类型定义 ====================
interface MessageForm {
  name: string;
  phone: string;
  email: string;
  companyType: string;
  inquiryType: string;
  content: string;
  subscribeNewsletter: boolean;
  urgencyFlag: boolean;
}

interface FormRule {
  required?: boolean;
  message?: string;
  trigger?: string | string[];
  pattern?: RegExp;
  min?: number;
  max?: number;
  validator?: (rule: any, value: any, callback: Function) => void;
}

interface FormRules {
  [key: string]: FormRule[];
}

interface FooterLink {
  path: string;
  label: string;
  active: boolean;
}

interface FAQ {
  question: string;
  answer: string;
}

// ==================== 响应式数据 ====================
const submitting = ref(false);
const showSuccessDialog = ref(false);
const showErrorDialog = ref(false);
const errorMessage = ref('');
const mapError = ref(false);
const expandedFAQs = ref<Record<number, boolean>>({});

// 表单引用
const contactFormRef = ref<InstanceType<typeof ElForm>>();

// 表单数据
const messageForm = reactive<MessageForm>({
  name: '',
  phone: '',
  email: '',
  companyType: '',
  inquiryType: '',
  content: '',
  subscribeNewsletter: false,
  urgencyFlag: false
});

// 表单错误信息
const formErrors = reactive<Record<string, string>>({});

// 公司类型选项
const companyTypes = ref([
  { label: '制造业企业', value: 'manufacturing' },
  { label: '服务业企业', value: 'service' },
  { label: '贸易企业', value: 'trade' },
  { label: '科技企业', value: 'technology' },
  { label: '教育机构', value: 'education' },
  { label: '政府机构', value: 'government' },
  { label: '个人用户', value: 'individual' },
  { label: '其他', value: 'other' }
]);

// 咨询类型选项
const inquiryTypes = ref([
  { label: '产品咨询', value: 'product' },
  { label: '技术支持', value: 'technical' },
  { label: '商务合作', value: 'business' },
  { label: '售后服务', value: 'after-sales' },
  { label: '投诉建议', value: 'complaint' },
  { label: '招聘咨询', value: 'recruitment' },
  { label: '其他咨询', value: 'other' }
]);

// 常见问题数据
const faqs = ref<FAQ[]>([
  {
    question: '如何获取产品演示？',
    answer: '您可以通过在线留言或直接拨打400-888-9999联系我们，我们将安排专业顾问为您提供一对一的产品演示服务。'
  },
  {
    question: '产品支持哪些行业？',
    answer: '我们的产品主要支持制造业、物流业、零售业、服务业等多个行业，可以根据您的具体需求提供定制化解决方案。'
  },
  {
    question: '如何获取技术支持？',
    answer: '我们提供7×24小时技术支持服务，您可以通过技术支持热线400-888-8888或发送邮件至support@enterprise-brain.com联系我们。'
  },
  {
    question: '产品价格如何？',
    answer: '我们的产品价格根据企业规模和功能模块的不同而有所差异，请联系我们的商务人员获取详细的报价方案。'
  }
]);

// 页脚链接数据
const footerLinks = ref<FooterLink[]>([
  { path: '/system/company/CompanyIntro', label: '企业简介', active: false },
  { path: '/system/company/ContactUs', label: '联系方式', active: true },
  { path: '/system/company/PrivacyPolicy', label: '隐私政策', active: false }
]);

// ==================== 表单验证规则 ====================
const formRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '姓名长度应在2-50个字符之间', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { 
      pattern: /^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/, 
      message: '请输入有效的手机号码或座机号码', 
      trigger: 'blur' 
    }
  ],
  email: [
    { 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
      message: '请输入有效的电子邮箱地址', 
      trigger: 'blur' 
    }
  ],
  companyType: [
    { required: true, message: '请选择公司类型', trigger: 'change' }
  ],
  inquiryType: [
    { required: true, message: '请选择咨询类型', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入留言内容', trigger: 'blur' },
    { min: 10, max: 500, message: '留言内容长度应在10-500个字符之间', trigger: 'blur' }
  ]
});

// ==================== 计算属性 ====================
const isFormValid = computed(() => {
  return messageForm.name.trim() && 
         messageForm.phone.trim() && 
         messageForm.content.trim() && 
         messageForm.companyType && 
         messageForm.inquiryType &&
         Object.keys(formErrors).every(key => !formErrors[key]);
});

// ==================== 表单验证方法 ====================
const validateField = (field: string) => {
  formErrors[field] = '';
  
  if (!contactFormRef.value) return;
  
  contactFormRef.value.validateField(field, (error) => {
    if (error) {
      formErrors[field] = error;
    }
  });
};

const validateForm = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!contactFormRef.value) {
      resolve(false);
      return;
    }
    
    contactFormRef.value.validate((valid) => {
      resolve(valid);
    });
  });
};

// ==================== 表单操作方法 ====================
const submitMessage = async () => {
  try {
    // 清除之前的错误信息
    Object.keys(formErrors).forEach(key => {
      formErrors[key] = '';
    });
    
    // 验证表单
    const isValid = await validateForm();
    if (!isValid) {
      ElMessage.error('请完善表单信息后提交');
      return;
    }
    
    submitting.value = true;
    
    // 构建提交数据
    const submitData = {
      ...messageForm,
      submitTime: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    // 模拟API调用
    await simulateApiCall(() => {
      console.log('提交留言数据:', submitData);
      
      // 这里应该是实际的API调用
      // const response = await fetch('/api/contact/message', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(submitData)
      // });
      
      // const result = await response.json();
      // if (!result.success) {
      //   throw new Error(result.message);
      // }
    }, 2000);
    
    // 显示成功提示
    showSuccessDialog.value = true;
    
    // 重置表单
    resetForm();
    
    ElMessage.success('留言提交成功！');
    
  } catch (error) {
    console.error('提交留言失败:', error);
    errorMessage.value = error instanceof Error ? error.message : '提交失败，请稍后重试';
    showErrorDialog.value = true;
  } finally {
    submitting.value = false;
  }
};

const resetForm = () => {
  if (contactFormRef.value) {
    contactFormRef.value.resetFields();
  }
  
  // 重置响应式数据
  Object.assign(messageForm, {
    name: '',
    phone: '',
    email: '',
    companyType: '',
    inquiryType: '',
    content: '',
    subscribeNewsletter: false,
    urgencyFlag: false
  });
  
  // 清除错误信息
  Object.keys(formErrors).forEach(key => {
    formErrors[key] = '';
  });
};

// ==================== 辅助方法 ====================
const toggleFAQ = (index: number) => {
  expandedFAQs.value[index] = !expandedFAQs.value[index];
};

const handleMapError = () => {
  mapError.value = true;
  console.warn('地图图片加载失败');
};

const simulateApiCall = (callback: () => void, delay: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      callback();
      resolve();
    }, delay);
  });
};

// ==================== 生命周期 ====================
onMounted(() => {
  // 可以在这里添加页面初始化逻辑
  console.log('联系页面已加载');
});
</script>

<style scoped>
/* ==================== 全局样式 ==================== */
.contact-page {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #333;
  line-height: 1.6;
  min-height: 100vh;
  background: #f8f9fa;
}

/* ==================== 页面头部 ==================== */
.contact-header {
  background: linear-gradient(135deg, #1989fa 0%, #409eff 100%);
  color: white;
  padding: 80px 0;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.contact-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')
    no-repeat center center/cover;
  opacity: 0.1;
}

.header-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 20px;
  letter-spacing: -1px;
}

.page-subtitle {
  font-size: 1.2rem;
  font-weight: 400;
  opacity: 0.9;
  margin: 0;
}

/* ==================== 主要内容区域 ==================== */
.contact-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.contact-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  margin-bottom: 60px;
}

/* ==================== 联系信息区域 ==================== */
.contact-info-section {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #1989fa;
  margin-bottom: 30px;
  text-align: center;
}

.info-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  margin-bottom: 40px;
}

.info-card {
  display: flex;
  align-items: flex-start;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-color: #1989fa;
}

.card-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #1989fa 0%, #409eff 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  margin-right: 16px;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.card-text {
  font-size: 1rem;
  color: #1989fa;
  font-weight: 500;
  margin-bottom: 4px;
}

.card-detail {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

/* 地图区域 */
.map-section {
  margin-top: 30px;
}

.map-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.map-container {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}

.map-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 12px;
}

.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.map-overlay .el-icon {
  font-size: 2rem;
  margin-bottom: 12px;
}

.map-overlay p {
  margin: 0;
  text-align: center;
  font-size: 1rem;
}

.map-info {
  padding: 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border-left: 4px solid #1989fa;
}

.map-info p {
  margin: 8px 0;
  font-size: 0.95rem;
  color: #555;
}

/* ==================== 联系表单区域 ==================== */
.contact-form-section {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.form-container {
  max-width: 100%;
}

.contact-form {
  width: 100%;
}

.contact-form .el-form-item {
  margin-bottom: 24px;
}

.full-width {
  width: 100%;
}

.additional-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-actions {
  text-align: center;
  margin-top: 32px;
}

.submit-btn,
.reset-btn {
  margin: 0 8px;
  min-width: 120px;
}

/* ==================== 常见问题区域 ==================== */
.faq-section {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.faq-container {
  display: grid;
  gap: 16px;
}

.faq-item {
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.faq-item:hover,
.faq-item.faq-active {
  border-color: #1989fa;
  background: #f0f9ff;
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.faq-icon {
  color: #1989fa;
  margin-right: 12px;
  font-size: 1.2rem;
}

.faq-expand-icon {
  transition: transform 0.3s ease;
  color: #1989fa;
}

.faq-answer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
  color: #666;
  line-height: 1.6;
}

/* ==================== 页脚导航 ==================== */
.page-footer {
  background: white;
  border-top: 1px solid #e9ecef;
  padding: 30px 0;
  margin-top: 40px;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}

.footer-link {
  color: #666;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.footer-link:hover,
.footer-link.active {
  color: #1989fa;
  background: rgba(25, 137, 250, 0.1);
}

/* ==================== 对话框样式 ==================== */
.success-content,
.error-content {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  font-size: 3rem;
  color: #67c23a;
  margin-bottom: 16px;
}

.error-icon {
  font-size: 3rem;
  color: #f56c6c;
  margin-bottom: 16px;
}

.success-detail {
  font-size: 0.9rem;
  color: #666;
  margin-top: 8px;
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1024px) {
  .contact-container {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .info-cards {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .page-subtitle {
    font-size: 1rem;
  }
  
  .contact-header {
    padding: 60px 0;
  }
  
  .contact-main {
    padding: 30px 15px;
  }
  
  .contact-info-section,
  .contact-form-section,
  .faq-section {
    padding: 30px 20px;
  }
  
  .info-card {
    flex-direction: column;
    text-align: center;
    padding: 16px;
  }
  
  .card-icon {
    margin-right: 0;
    margin-bottom: 12px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.8rem;
  }
  
  .contact-header {
    padding: 40px 0;
  }
  
  .contact-info-section,
  .contact-form-section,
  .faq-section {
    padding: 20px 15px;
  }
  
  .additional-info {
    gap: 8px;
  }
  
  .form-actions {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  
  .submit-btn,
  .reset-btn {
    width: 100%;
    max-width: 200px;
  }
  
  .footer-links {
    gap: 20px;
    flex-wrap: wrap;
  }
  
  .footer-link {
    font-size: 0.9rem;
    padding: 6px 12px;
  }
}

/* ==================== 深色模式支持 ==================== */
@media (prefers-color-scheme: dark) {
  .contact-page {
    background: #1a1a1a;
    color: #e0e0e0;
  }
  
  .contact-info-section,
  .contact-form-section,
  .faq-section {
    background: #2c3e50;
    color: #e0e0e0;
  }
  
  .info-card {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .card-title {
    color: #e0e0e0;
  }
  
  .card-detail {
    color: #b0b0b0;
  }
  
  .faq-item {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .faq-question {
    color: #e0e0e0;
  }
  
  .page-footer {
    background: #2c3e50;
    border-color: rgba(255, 255, 255, 0.1);
  }
}

/* ==================== 打印样式 ==================== */
@media print {
  .page-footer {
    background: white;
    border-color: #ccc;
  }
  
  .contact-info-section,
  .contact-form-section,
  .faq-section {
    box-shadow: none;
    border: 1px solid #ccc;
  }
}

/* ==================== 减少动画模式 ==================== */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
