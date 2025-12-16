<template>
  <div class="privacy-policy-page" lang="zh-CN">
    <!-- SEO Meta Tags -->
    <Head>
      <title>隐私政策 - Enterprise Brain 智能制造解决方案</title>
      <meta name="description" content="Enterprise Brain隐私政策，详细说明我们如何收集、使用、存储和保护您的个人信息。保障用户隐私权益。">
      <meta name="keywords" content="隐私政策,数据保护,个人信息,用户隐私,GDPR,数据安全">
      <meta property="og:title" content="隐私政策 - Enterprise Brain">
      <meta property="og:description" content="Enterprise Brain隐私政策，保障用户隐私权益">
      <meta property="og:type" content="website">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="canonical" href="https://enterprise-brain.com/system/company/PrivacyPolicy">
    </Head>

    <!-- 页面头部 -->
    <header class="policy-header" role="banner">
      <div class="header-content">
        <h1 class="page-title">隐私政策</h1>
        <p class="page-subtitle">我们重视并保护您的隐私权益</p>
        <div class="policy-meta">
          <p class="update-date">最后更新时间：{{ lastUpdateTime }}</p>
          <p class="effective-date">生效日期：{{ effectiveDate }}</p>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="policy-main" role="main">
      <div class="policy-container">
        <!-- 政策说明 -->
        <section class="policy-section" aria-labelledby="policy-intro">
          <h2 id="policy-intro" class="section-title">政策说明</h2>
          <div class="section-content">
            <p class="policy-text">
              感谢您选择使用Enterprise Brain（以下简称"我们"）的产品和服务！我们深知个人信息对您的重要性，
              本隐私政策旨在向您清晰说明我们如何收集、使用、存储和保护您的个人信息。
            </p>
            <p class="policy-text">
              请您在使用我们的产品和服务前仔细阅读本政策。当您使用或继续使用我们的任何产品和服务时，
              即表示您已充分理解并同意本政策的全部内容。
            </p>
            <div class="policy-highlight">
              <el-icon class="highlight-icon"><InfoFilled /></el-icon>
              <div class="highlight-content">
                <h4>重要提示</h4>
                <p>本政策适用于我们通过网站、移动应用、API等方式提供的所有产品和服务。</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 信息收集与使用 -->
        <section class="policy-section" aria-labelledby="info-collection">
          <h2 id="info-collection" class="section-title">一、信息收集与使用</h2>
          <div class="section-content">
            <div class="policy-subsection">
              <h3 class="subsection-title">1.1 个人信息的收集</h3>
              <p class="policy-text">
                我们会在您注册、使用产品和服务的过程中收集以下类型的个人信息：
              </p>
              <div class="info-types">
                <div class="info-type" v-for="infoType in personalInfoTypes" :key="infoType.title">
                  <div class="type-icon">
                    <el-icon><component :is="infoType.icon" /></el-icon>
                  </div>
                  <div class="type-content">
                    <h4 class="type-title">{{ infoType.title }}</h4>
                    <p class="type-description">{{ infoType.description }}</p>
                    <p class="type-purpose"><strong>用途：</strong>{{ infoType.purpose }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="policy-subsection">
              <h3 class="subsection-title">1.2 信息的收集方式</h3>
              <div class="collection-methods">
                <div class="method-item" v-for="method in collectionMethods" :key="method.name">
                  <h4 class="method-title">{{ method.name }}</h4>
                  <p class="method-description">{{ method.description }}</p>
                </div>
              </div>
            </div>

            <div class="policy-subsection">
              <h3 class="subsection-title">1.3 信息的使用目的</h3>
              <div class="usage-purposes">
                <div class="purpose-item" v-for="purpose in usagePurposes" :key="purpose.title">
                  <div class="purpose-icon">
                    <el-icon><component :is="purpose.icon" /></el-icon>
                  </div>
                  <div class="purpose-content">
                    <h4 class="purpose-title">{{ purpose.title }}</h4>
                    <p class="purpose-description">{{ purpose.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 信息存储与保护 -->
        <section class="policy-section" aria-labelledby="info-protection">
          <h2 id="info-protection" class="section-title">二、信息存储与保护</h2>
          <div class="section-content">
            <div class="policy-subsection">
              <h3 class="subsection-title">2.1 数据安全措施</h3>
              <div class="security-measures">
                <div class="measure-item" v-for="measure in securityMeasures" :key="measure.title">
                  <div class="measure-icon">
                    <el-icon><component :is="measure.icon" /></el-icon>
                  </div>
                  <div class="measure-content">
                    <h4 class="measure-title">{{ measure.title }}</h4>
                    <p class="measure-description">{{ measure.description }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="policy-subsection">
              <h3 class="subsection-title">2.2 数据存储期限</h3>
              <p class="policy-text">
                我们会在实现本政策所述目的所需的期限内保留您的个人信息，除非法律要求或允许更长的保存期限。
                超出保留期限后，我们会删除或匿名化处理您的个人信息。
              </p>
              <div class="retention-table">
                <el-table :data="retentionPeriods" stripe border>
                  <el-table-column prop="dataType" label="数据类型" />
                  <el-table-column prop="retentionPeriod" label="保存期限" />
                  <el-table-column prop="description" label="说明" />
                </el-table>
              </div>
            </div>
          </div>
        </section>

        <!-- 信息共享与披露 -->
        <section class="policy-section" aria-labelledby="info-sharing">
          <h2 id="info-sharing" class="section-title">三、信息共享与披露</h2>
          <div class="section-content">
            <div class="policy-subsection">
              <h3 class="subsection-title">3.1 信息共享原则</h3>
              <p class="policy-text">
                我们承诺不会向第三方出售、交易或转让您的个人信息，除非获得您的明确授权或符合以下情况之一：
              </p>
              <ul class="policy-list">
                <li v-for="item in sharingPrinciples" :key="item">
                  {{ item }}
                </li>
              </ul>
            </div>

            <div class="policy-subsection">
              <h3 class="subsection-title">3.2 合作方共享</h3>
              <p class="policy-text">
                为提供产品和服务，我们可能会与以下类型的合作方共享必要的个人信息：
              </p>
              <div class="partner-types">
                <div class="partner-item" v-for="partner in partnerTypes" :key="partner.type">
                  <h4 class="partner-title">{{ partner.type }}</h4>
                  <p class="partner-description">{{ partner.description }}</p>
                  <p class="partner-examples"><strong>例如：</strong>{{ partner.examples }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 用户权利 -->
        <section class="policy-section" aria-labelledby="user-rights">
          <h2 id="user-rights" class="section-title">四、您的权利</h2>
          <div class="section-content">
            <div class="policy-subsection">
              <h3 class="subsection-title">4.1 访问和更正权</h3>
              <p class="policy-text">
                您有权访问、更正、更新您的个人信息。您可以通过以下方式行使您的权利：
              </p>
              <div class="right-methods">
                <div class="method-item" v-for="method in accessMethods" :key="method.title">
                  <div class="method-icon">
                    <el-icon><component :is="method.icon" /></el-icon>
                  </div>
                  <div class="method-content">
                    <h4 class="method-title">{{ method.title }}</h4>
                    <p class="method-description">{{ method.description }}</p>
                    <p class="method-steps" v-if="method.steps">{{ method.steps }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="policy-subsection">
              <h3 class="subsection-title">4.2 删除权</h3>
              <p class="policy-text">
                在特定情况下，您有权要求我们删除您的个人信息：
              </p>
              <ul class="policy-list">
                <li v-for="condition in deletionConditions" :key="condition">
                  {{ condition }}
                </li>
              </ul>
            </div>

            <div class="policy-subsection">
              <h3 class="subsection-title">4.3 撤回同意权</h3>
              <p class="policy-text">
                您有权随时撤回对个人信息处理的同意。撤回同意不会影响撤回前基于您的同意已经进行的个人信息处理活动的合法性。
              </p>
            </div>
          </div>
        </section>

        <!-- 政策更新 -->
        <section class="policy-section" aria-labelledby="policy-updates">
          <h2 id="policy-updates" class="section-title">五、政策更新</h2>
          <div class="section-content">
            <p class="policy-text">
              我们可能会根据法律法规变化、业务发展需要或用户反馈对本隐私政策进行更新。
            </p>
            <div class="update-process">
              <div class="process-step" v-for="(step, index) in updateProcess" :key="index">
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-content">
                  <h4 class="step-title">{{ step.title }}</h4>
                  <p class="step-description">{{ step.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 联系我们 -->
        <section class="policy-section contact-section" aria-labelledby="contact-us">
          <h2 id="contact-us" class="section-title">六、联系我们</h2>
          <div class="section-content">
            <p class="policy-text">
              如您对本隐私政策有任何疑问、意见或建议，或需要行使您的权利，请通过以下方式联系我们：
            </p>
            
            <div class="contact-methods">
              <div class="contact-card" v-for="contact in contactMethods" :key="contact.type">
                <div class="contact-icon">
                  <el-icon><component :is="contact.icon" /></el-icon>
                </div>
                <div class="contact-details">
                  <h4 class="contact-title">{{ contact.type }}</h4>
                  <p class="contact-value">{{ contact.value }}</p>
                  <p class="contact-description">{{ contact.description }}</p>
                </div>
              </div>
            </div>

            <div class="policy-note">
              <el-icon class="note-icon"><WarningFilled /></el-icon>
              <div class="note-content">
                <h4>隐私保护承诺</h4>
                <p>我们承诺在收到您的请求后，按照适用的法律法规要求及时响应并提供必要的协助。</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- 页面操作区域 -->
      <div class="policy-actions">
        <el-button @click="scrollToTop" type="primary" plain>
          <el-icon><Top /></el-icon>
          返回顶部
        </el-button>
        <el-button @click="printPolicy" type="primary">
          <el-icon><Printer /></el-icon>
          打印政策
        </el-button>
        <el-button @click="downloadPolicy" type="primary">
          <el-icon><Download /></el-icon>
          下载政策
        </el-button>
      </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Head } from '@vueuse/head';
import { ElMessage } from 'element-plus';
import {
  InfoFilled, User, Lock, Shield, Database, Connection,
  Bell, Phone, Message, Top, Printer, Download, WarningFilled
} from '@element-plus/icons-vue';

// ==================== 类型定义 ====================
interface FooterLink {
  path: string;
  label: string;
  active: boolean;
}

interface InfoType {
  title: string;
  icon: any;
  description: string;
  purpose: string;
}

interface CollectionMethod {
  name: string;
  description: string;
}

interface UsagePurpose {
  title: string;
  icon: any;
  description: string;
}

interface SecurityMeasure {
  title: string;
  icon: any;
  description: string;
}

interface RetentionPeriod {
  dataType: string;
  retentionPeriod: string;
  description: string;
}

interface AccessMethod {
  title: string;
  icon: any;
  description: string;
  steps?: string;
}

interface ContactMethod {
  type: string;
  icon: any;
  value: string;
  description: string;
}

// ==================== 响应式数据 ====================
const lastUpdateTime = ref('2024年11月25日');
const effectiveDate = ref('2024年11月25日');

// 个人信息类型
const personalInfoTypes = ref<InfoType[]>([
  {
    title: '账户信息',
    icon: User,
    description: '用户名、密码、邮箱地址、手机号等',
    purpose: '用于账号注册、登录验证、身份识别和账号管理'
  },
  {
    title: '使用信息',
    icon: Lock,
    description: '产品使用记录、操作日志、设备信息、IP地址等',
    purpose: '用于提供产品服务、优化用户体验、故障排查和系统维护'
  },
  {
    title: '交易信息',
    icon: Shield,
    description: '订单信息、支付记录、发票信息等',
    purpose: '用于订单处理、支付结算、财务对账和客户服务'
  },
  {
    title: '通信信息',
    icon: Message,
    description: '邮件地址、电话号码、通信记录等',
    purpose: '用于客户沟通、服务通知、营销推广和用户调研'
  }
]);

// 信息收集方式
const collectionMethods = ref<CollectionMethod[]>([
  {
    name: '主动提供',
    description: '您在注册账户、填写表单、联系客服时主动向我们提供的信息。'
  },
  {
    name: '自动收集',
    description: '您使用产品和服务时，系统自动收集的设备信息、使用日志、点击流等数据。'
  },
  {
    name: '第三方获取',
    description: '通过合法的第三方渠道获取的经您授权的信息，如第三方登录授权信息。'
  }
]);

// 信息使用目的
const usagePurposes = ref<UsagePurpose[]>([
  {
    title: '提供服务',
    icon: Bell,
    description: '用于提供、维护和改进我们的产品和服务，确保服务的正常运行。'
  },
  {
    title: '个性化服务',
    icon: User,
    description: '根据您的偏好和使用习惯，提供个性化的产品推荐和内容展示。'
  },
  {
    title: '安全保障',
    icon: Shield,
    description: '用于身份验证、风险防控、欺诈检测和交易安全保护。'
  },
  {
    title: '营销推广',
    icon: Phone,
    description: '用于向您发送产品资讯、优惠活动和营销信息（在获得您同意的前提下）。'
  }
]);

// 安全措施
const securityMeasures = ref<SecurityMeasure[]>([
  {
    title: '加密技术',
    icon: Lock,
    description: '采用SSL/TLS加密传输技术，确保数据在传输过程中的安全性。'
  },
  {
    title: '访问控制',
    icon: Shield,
    description: '建立严格的访问权限管理制度，仅授权人员可访问个人信息。'
  },
  {
    title: '安全存储',
    icon: Database,
    description: '使用安全的存储系统和加密技术，保护数据在存储过程中的安全。'
  },
  {
    title: '定期审计',
    icon: Bell,
    description: '定期进行安全审计和漏洞扫描，及时发现和修复安全问题。'
  }
]);

// 数据保存期限
const retentionPeriods = ref<RetentionPeriod[]>([
  {
    dataType: '账户信息',
    retentionPeriod: '账号有效期内+3个月',
    description: '账号注销后保留3个月用于争议处理'
  },
  {
    dataType: '使用日志',
    retentionPeriod: '6个月',
    description: '用于系统维护和问题排查'
  },
  {
    dataType: '交易记录',
    retentionPeriod: '7年',
    description: '符合财务记录保存要求'
  },
  {
    dataType: '通信记录',
    retentionPeriod: '2年',
    description: '用于服务质量改进和争议处理'
  }
]);

// 信息共享原则
const sharingPrinciples = ref([
  '获得您的明确同意后共享给指定的第三方',
  '为履行法律义务或响应法律程序必须共享',
  '为保护我们的权利、财产或安全必须共享',
  '与我们的关联公司、子公司或合作伙伴共享，且仅限于实现收集目的所需的最小范围'
]);

// 合作方类型
const partnerTypes = ref([
  {
    type: '技术服务商',
    description: '为我们提供技术支持、系统维护、云存储等服务的合作伙伴',
    examples: '云服务提供商、服务器托管商、安全技术公司'
  },
  {
    type: '支付服务商',
    description: '协助我们处理支付结算和金融服务的金融机构',
    examples: '银行、第三方支付平台、金融科技公司'
  },
  {
    type: '物流服务商',
    description: '为我们提供物流配送、仓储管理等服务的企业',
    examples: '快递公司、仓储公司、供应链管理公司'
  }
]);

// 访问和更正方法
const accessMethods = ref<AccessMethod[]>([
  {
    title: '在线自助服务',
    icon: User,
    description: '通过我们的网站或移动应用直接查看和管理您的个人信息',
    steps: '1. 登录账户 → 2. 进入个人中心 → 3. 选择相关设置 → 4. 查看或修改信息'
  },
  {
    title: '客户服务热线',
    icon: Phone,
    description: '拨打我们的客服热线获取帮助',
    steps: '热线电话：400-888-9999（工作日 9:00-18:00）'
  },
  {
    title: '电子邮件联系',
    icon: Message,
    description: '通过邮件联系我们的隐私保护专员',
    steps: '发送邮件至：privacy@enterprise-brain.com'
  }
]);

// 删除条件
const deletionConditions = ref([
  '我们收集、使用您的个人信息的目的已经实现、无法实现或者为实现目的不再必要',
  '您撤回对个人信息处理的同意',
  '我们处理您的个人信息违反法律法规规定',
  '您注销账户并要求删除相关信息'
]);

// 政策更新流程
const updateProcess = ref([
  {
    title: '政策修订',
    description: '我们会根据业务变化和法律要求定期评估和修订隐私政策'
  },
  {
    title: '用户通知',
    description: '通过网站公告、邮件通知、应用内消息等方式提前30天通知用户'
  },
  {
    title: '生效实施',
    description: '更新后的隐私政策在通知期结束后正式生效'
  },
  {
    title: '继续使用',
    description: '用户继续使用产品和服务视为接受更新后的隐私政策'
  }
]);

// 联系方式
const contactMethods = ref<ContactMethod[]>([
  {
    type: '隐私保护专线',
    icon: Phone,
    value: '400-888-9999',
    description: '工作日 9:00-18:00，专门处理隐私相关咨询'
  },
  {
    type: '隐私保护邮箱',
    icon: Message,
    value: 'privacy@enterprise-brain.com',
    description: '我们承诺在收到邮件后24小时内回复'
  },
  {
    type: '地址联系',
    icon: Connection,
    value: '北京市海淀区中关村科技园区88号',
    description: '隐私保护部门收，邮编：100080'
  }
]);

// 页脚链接数据
const footerLinks = ref<FooterLink[]>([
  { path: '/system/company/CompanyIntro', label: '企业简介', active: false },
  { path: '/system/company/ContactUs', label: '联系方式', active: false },
  { path: '/system/company/PrivacyPolicy', label: '隐私政策', active: true }
]);

// ==================== 页面操作方法 ====================
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

const printPolicy = () => {
  window.print();
  ElMessage.info('正在准备打印页面...');
};

const downloadPolicy = async () => {
  try {
    // 创建下载内容
    const content = generatePolicyContent();
    
    // 创建Blob对象
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `隐私政策_${new Date().toISOString().split('T')[0]}.txt`;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 清理URL对象
    URL.revokeObjectURL(url);
    
    ElMessage.success('隐私政策下载成功！');
    
  } catch (error) {
    console.error('下载失败:', error);
    ElMessage.error('下载失败，请稍后重试');
  }
};

const generatePolicyContent = () => {
  let content = `Enterprise Brain 隐私政策\n\n`;
  content += `最后更新时间：${lastUpdateTime.value}\n`;
  content += `生效日期：${effectiveDate.value}\n\n`;
  
  // 添加各个章节内容
  content += `一、政策说明\n`;
  content += `感谢您选择使用Enterprise Brain（以下简称"我们"）的产品和服务！\n\n`;
  
  content += `二、信息收集与使用\n`;
  personalInfoTypes.value.forEach((type, index) => {
    content += `${index + 1}. ${type.title}：${type.description}\n`;
    content += `   用途：${type.purpose}\n\n`;
  });
  
  content += `三、信息存储与保护\n`;
  securityMeasures.value.forEach((measure, index) => {
    content += `${index + 1}. ${measure.title}：${measure.description}\n\n`;
  });
  
  // 继续添加其他章节...
  content += `\n联系方式\n`;
  contactMethods.value.forEach(contact => {
    content += `${contact.type}：${contact.value}\n`;
    content += `${contact.description}\n\n`;
  });
  
  return content;
};

// ==================== 生命周期 ====================
onMounted(() => {
  // 添加平滑滚动效果
  document.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      window.scrollBy({
        top: e.deltaY > 0 ? 50 : -50,
        behavior: 'smooth'
      });
    }
  }, { passive: false });
  
  console.log('隐私政策页面已加载');
});
</script>

<style scoped>
/* ==================== 全局样式 ==================== */
.privacy-policy-page {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #333;
  line-height: 1.8;
  background: #f8f9fa;
  min-height: 100vh;
}

/* ==================== 页面头部 ==================== */
.policy-header {
  background: linear-gradient(135deg, #1989fa 0%, #409eff 100%);
  color: white;
  padding: 80px 0 60px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.policy-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')
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
  margin-bottom: 30px;
}

.policy-meta {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}

.policy-meta p {
  font-size: 0.9rem;
  opacity: 0.8;
  margin: 0;
}

/* ==================== 主要内容区域 ==================== */
.policy-main {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px 80px;
}

.policy-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  padding: 0;
}

/* ==================== 政策章节 ==================== */
.policy-section {
  padding: 40px 50px;
  border-bottom: 1px solid #f0f0f0;
}

.policy-section:last-child {
  border-bottom: none;
}

.policy-section.contact-section {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-bottom: none;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #1989fa;
  margin-bottom: 30px;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -10px;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #1989fa 0%, #409eff 100%);
  border-radius: 2px;
}

.section-content {
  max-width: 100%;
}

/* ==================== 内容通用样式 ==================== */
.policy-text {
  font-size: 1rem;
  line-height: 1.8;
  margin-bottom: 20px;
  color: #555;
}

.policy-highlight {
  display: flex;
  align-items: flex-start;
  background: linear-gradient(135deg, #fff7e6 0%, #fef0e6 100%);
  border: 2px solid #f9a825;
  border-radius: 12px;
  padding: 20px;
  margin: 30px 0;
}

.highlight-icon {
  color: #f9a825;
  font-size: 1.5rem;
  margin-right: 16px;
  margin-top: 2px;
  flex-shrink: 0;
}

.highlight-content h4 {
  font-size: 1.1rem;
  color: #f9a825;
  margin-bottom: 8px;
}

.highlight-content p {
  color: #8b4513;
  margin: 0;
}

.policy-list {
  margin: 20px 0;
  padding-left: 20px;
}

.policy-list li {
  margin-bottom: 12px;
  color: #555;
  position: relative;
  padding-left: 20px;
}

.policy-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #1989fa;
  font-weight: bold;
}

/* ==================== 子章节样式 ==================== */
.policy-subsection {
  margin-bottom: 40px;
}

.policy-subsection:last-child {
  margin-bottom: 0;
}

.subsection-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

/* ==================== 信息类型展示 ==================== */
.info-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin: 30px 0;
}

.info-type {
  display: flex;
  align-items: flex-start;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #1989fa;
  transition: all 0.3s ease;
}

.info-type:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.type-icon {
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

.type-content {
  flex: 1;
}

.type-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.type-description {
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 8px;
}

.type-purpose {
  font-size: 0.9rem;
  color: #1989fa;
  margin: 0;
}

/* ==================== 收集方式样式 ==================== */
.collection-methods,
.usage-purposes,
.security-measures {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.method-item,
.purpose-item,
.measure-item {
  padding: 20px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.method-item:hover,
.purpose-item:hover,
.measure-item:hover {
  border-color: #1989fa;
  box-shadow: 0 4px 16px rgba(25, 137, 250, 0.1);
}

.method-title,
.purpose-title,
.measure-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.method-description,
.purpose-description,
.measure-description {
  font-size: 0.95rem;
  color: #666;
  line-height: 1.6;
}

/* ==================== 表格样式 ==================== */
.retention-table {
  margin: 30px 0;
  border-radius: 8px;
  overflow: hidden;
}

/* ==================== 访问方法样式 ==================== */
.access-methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin: 30px 0;
}

.method-item {
  display: flex;
  align-items: flex-start;
  padding: 24px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.method-item:hover {
  border-color: #1989fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(25, 137, 250, 0.1);
}

.method-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1989fa;
  font-size: 1.2rem;
  margin-right: 16px;
  flex-shrink: 0;
}

.method-content {
  flex: 1;
}

.method-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.method-description {
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 8px;
}

.method-steps {
  font-size: 0.9rem;
  color: #1989fa;
  background: rgba(25, 137, 250, 0.05);
  padding: 8px 12px;
  border-radius: 6px;
  margin: 0;
}

/* ==================== 联系方式样式 ==================== */
.contact-methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin: 30px 0;
}

.contact-card {
  display: flex;
  align-items: flex-start;
  padding: 24px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.contact-card:hover {
  border-color: #1989fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(25, 137, 250, 0.1);
}

.contact-icon {
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

.contact-details {
  flex: 1;
}

.contact-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.contact-value {
  font-size: 1rem;
  color: #1989fa;
  font-weight: 500;
  margin-bottom: 8px;
}

.contact-description {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

/* ==================== 政策说明样式 ==================== */
.update-process {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.process-step {
  display: flex;
  align-items: flex-start;
  padding: 20px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  position: relative;
}

.process-step:hover {
  border-color: #1989fa;
  box-shadow: 0 4px 16px rgba(25, 137, 250, 0.1);
}

.step-number {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #1989fa 0%, #409eff 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  margin-right: 16px;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.step-description {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

/* ==================== 政策备注样式 ==================== */
.policy-note {
  display: flex;
  align-items: flex-start;
  background: linear-gradient(135deg, #fff7e6 0%, #fef0e6 100%);
  border: 2px solid #f9a825;
  border-radius: 12px;
  padding: 20px;
  margin: 30px 0;
}

.note-icon {
  color: #f9a825;
  font-size: 1.5rem;
  margin-right: 16px;
  margin-top: 2px;
  flex-shrink: 0;
}

.note-content h4 {
  font-size: 1.1rem;
  color: #f9a825;
  margin-bottom: 8px;
}

.note-content p {
  color: #8b4513;
  margin: 0;
}

/* ==================== 页面操作区域 ==================== */
.policy-actions {
  position: sticky;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 100;
  margin-top: 40px;
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

/* ==================== 响应式设计 ==================== */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .page-subtitle {
    font-size: 1rem;
  }
  
  .policy-header {
    padding: 60px 0 40px;
  }
  
  .policy-main {
    padding: 30px 15px 60px;
  }
  
  .policy-section {
    padding: 30px 25px;
  }
  
  .info-types,
  .collection-methods,
  .usage-purposes,
  .security-measures,
  .access-methods,
  .contact-methods,
  .update-process {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .policy-actions {
    position: relative;
    transform: none;
    left: auto;
    margin: 30px 0 20px;
    flex-wrap: wrap;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.8rem;
  }
  
  .policy-header {
    padding: 40px 0 30px;
  }
  
  .policy-main {
    padding: 20px 10px 40px;
  }
  
  .policy-section {
    padding: 20px 15px;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .info-type,
  .method-item,
  .contact-card {
    padding: 16px;
  }
  
  .type-icon,
  .method-icon,
  .contact-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}

/* ==================== 深色模式支持 ==================== */
@media (prefers-color-scheme: dark) {
  .privacy-policy-page {
    background: #1a1a1a;
    color: #e0e0e0;
  }
  
  .policy-container {
    background: #2c3e50;
  }
  
  .section-title {
    color: #409eff;
  }
  
  .policy-text {
    color: #b0b0b0;
  }
  
  .info-type,
  .method-item,
  .contact-card {
    background: #34495e;
  }
  
  .type-title,
  .method-title,
  .contact-title {
    color: #e0e0e0;
  }
  
  .type-description,
  .method-description,
  .contact-description {
    color: #b0b0b0;
  }
}

/* ==================== 打印样式 ==================== */
@media print {
  .policy-actions {
    display: none;
  }
  
  .policy-container {
    box-shadow: none;
  }
  
  .policy-section {
    break-inside: avoid;
  }
  
  .footer-links {
    display: none;
  }
}

/* ==================== 高对比度模式 ==================== */
@media (prefers-contrast: high) {
  .policy-section {
    border: 2px solid #000;
  }
  
  .info-type,
  .method-item,
  .contact-card {
    border: 2px solid #000;
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
