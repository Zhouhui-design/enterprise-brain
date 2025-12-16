<template>
  <div class="company-intro" :lang="currentLocale">
    <!-- SEO Meta Tags -->
    <Head>
      <title>{{ companyName }} - {{ companySlogan }}</title>
      <meta name="description" :content="companyDescription">
      <meta name="keywords" content="智能制造,数字化解决方案,供应链管理,生产管理,Enterprise Brain">
      <meta property="og:title" :content="companyName">
      <meta property="og:description" :content="companySlogan">
      <meta property="og:type" content="website">
      <meta property="og:image" content="/images/company-intro-banner.jpg">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="canonical" href="https://enterprise-brain.com/system/company/CompanyIntro">
    </Head>

    <!-- 顶部横幅 -->
    <header class="intro-banner" :class="{ 'edit-mode-bg': editing }" role="banner">
      <div class="banner-content">
        <h1 
          class="company-name" 
          :class="{ 'edit-mode': editing }" 
          :contenteditable="editing" 
          @blur="updateCompanyName" 
          v-if="editing"
          ref="companyNameRef"
          :aria-label="editing ? '编辑公司名称' : companyName"
        >
          {{ companyName }}
        </h1>
        <h1 class="company-name" v-else>{{ companyName }}</h1>
        
        <p 
          class="company-slogan" 
          :class="{ 'edit-mode': editing }" 
          :contenteditable="editing" 
          @blur="updateCompanySlogan" 
          v-if="editing"
          ref="companySloganRef"
          :aria-label="editing ? '编辑公司口号' : companySlogan"
        >
          {{ companySlogan }}
        </p>
        <p class="company-slogan" v-else>{{ companySlogan }}</p>
        
        <!-- 编辑/保存按钮 -->
        <div class="action-buttons" role="toolbar" :aria-label="editing ? '编辑操作' : '页面操作'">
          <template v-if="editing">
            <el-button 
              type="primary" 
              @click="saveChanges" 
              :loading="saving"
              :disabled="!hasChanges"
              aria-label="保存更改"
            >
              <el-icon><Check /></el-icon> 保存更改
            </el-button>
            <el-button 
              @click="cancelEdit"
              :disabled="saving"
              aria-label="取消编辑"
            >
              <el-icon><Close /></el-icon> 取消
            </el-button>
          </template>
          <el-button 
            v-else
            type="primary" 
            @click="startEdit"
            :aria-label="'编辑简介'"
          >
            <el-icon><Edit /></el-icon> 编辑简介
          </el-button>
        </div>
      </div>
      <!-- 背景图片懒加载 -->
      <div 
        class="banner-background" 
        v-lazy:background-image="bannerImage"
        @error="handleImageError"
        :aria-hidden="true"
      ></div>
    </header>

    <!-- 主要内容 -->
    <main class="intro-content-wrapper" role="main">
      <!-- 公司概况 -->
      <section class="intro-section fade-in" data-aos="fade-up" :aria-labelledby="overview-title">
        <div class="section-header">
          <h2 
            :id="editing ? undefined : 'overview-title'"
            class="section-title" 
            :class="{ 'edit-mode': editing }" 
            :contenteditable="editing" 
            @blur="updateSectionTitle('overviewTitle')" 
            v-if="editing"
            ref="overviewTitleRef"
            :aria-label="editing ? '编辑章节标题' : sectionData.overviewTitle"
          >
            {{ sectionData.overviewTitle }}
          </h2>
          <h2 :id="editing ? 'overview-title' : undefined" class="section-title" v-else>{{ sectionData.overviewTitle }}</h2>
          <div class="section-divider" aria-hidden="true"></div>
        </div>
        <div class="section-content">
          <p 
            class="company-description" 
            :class="{ 'edit-mode': editing }" 
            :contenteditable="editing" 
            @blur="updateCompanyDescription" 
            v-if="editing"
            ref="companyDescriptionRef"
            :aria-label="editing ? '编辑公司描述' : '公司描述'"
          >
            {{ companyDescription }}
          </p>
          <p class="company-description" v-else>{{ companyDescription }}</p>
          
          <!-- 数据亮点 -->
          <div class="stats-container" role="list" :aria-label="'企业统计数据'">
            <article 
              v-for="(stat, index) in statistics" 
              :key="stat.id || `stat-${index}`"
              class="stat-item" 
              :class="{ 'edit-mode': editing }" 
              role="listitem"
              :aria-label="`${stat.label}: ${stat.number}`"
            >
              <div 
                class="stat-number" 
                v-if="editing" 
                @click="editStat(index)"
                :aria-label="'点击编辑' + stat.label"
                tabindex="0"
                @keydown.enter="editStat(index)"
                @keydown.space.prevent="editStat(index)"
              >
                {{ stat.number }}
                <el-icon class="edit-icon" aria-hidden="true"><Edit /></el-icon>
              </div>
              <div class="stat-number" v-else :data-target="stat.number" ref="statNumbers">{{ stat.number }}</div>
              <div 
                class="stat-label" 
                v-if="editing" 
                @click="editStatLabel(index)"
                :aria-label="'点击编辑' + stat.label + '标签'"
                tabindex="0"
                @keydown.enter="editStatLabel(index)"
                @keydown.space.prevent="editStatLabel(index)"
              >
                {{ stat.label }}
                <el-icon class="edit-icon" aria-hidden="true"><Edit /></el-icon>
              </div>
              <div class="stat-label" v-else>{{ stat.label }}</div>
            </article>
          </div>
        </div>
      </section>

      <!-- 企业文化 -->
      <section class="intro-section fade-in alternate-section" data-aos="fade-up" :aria-labelledby="culture-title">
        <div class="section-header">
          <h2 
            :id="editing ? undefined : 'culture-title'"
            class="section-title" 
            :class="{ 'edit-mode': editing }" 
            :contenteditable="editing" 
            @blur="updateSectionTitle('cultureTitle')" 
            v-if="editing"
            ref="cultureTitleRef"
            :aria-label="editing ? '编辑企业文化标题' : sectionData.cultureTitle"
          >
            {{ sectionData.cultureTitle }}
          </h2>
          <h2 :id="editing ? 'culture-title' : undefined" class="section-title" v-else>{{ sectionData.cultureTitle }}</h2>
          <div class="section-divider" aria-hidden="true"></div>
        </div>
        <div class="values-container" role="list" :aria-label="'企业价值观'">
          <article 
            v-for="(value, index) in values" 
            :key="value.id || `value-${index}`"
            class="value-card" 
            :class="{ 'edit-mode': editing }" 
            role="listitem"
            :aria-label="value.title"
          >
            <div 
              class="value-icon" 
              v-if="editing" 
              @click="selectValueIcon(index)"
              :aria-label="'选择' + value.title + '的图标'"
              tabindex="0"
              @keydown.enter="selectValueIcon(index)"
              @keydown.space.prevent="selectValueIcon(index)"
            >
              <component :is="value.icon" />
              <el-icon class="edit-icon" aria-hidden="true"><Edit /></el-icon>
            </div>
            <div class="value-icon" v-else :aria-hidden="true">
              <component :is="value.icon" />
            </div>
            
            <h3 
              class="value-title" 
              v-if="editing" 
              @click="editValueTitle(index)"
              :aria-label="'编辑' + value.title"
              tabindex="0"
              @keydown.enter="editValueTitle(index)"
              @keydown.space.prevent="editValueTitle(index)"
            >
              {{ value.title }}
              <el-icon class="edit-icon" aria-hidden="true"><Edit /></el-icon>
            </h3>
            <h3 class="value-title" v-else>{{ value.title }}</h3>
            
            <p 
              class="value-description" 
              v-if="editing" 
              @click="editValueDescription(index)"
              :aria-label="'编辑' + value.title + '描述'"
              tabindex="0"
              @keydown.enter="editValueDescription(index)"
              @keydown.space.prevent="editValueDescription(index)"
            >
              {{ value.description }}
              <el-icon class="edit-icon" aria-hidden="true"><Edit /></el-icon>
            </p>
            <p class="value-description" v-else>{{ value.description }}</p>
            
            <button 
              v-if="editing && values.length > 1" 
              @click="confirmDeleteValue(index)"
              class="delete-value"
              :aria-label="'删除' + value.title"
              type="button"
            >
              <el-icon aria-hidden="true"><Delete /></el-icon>
            </button>
          </article>
          
          <button 
            class="add-value-card" 
            v-if="editing" 
            @click="addNewValue"
            :aria-label="'添加新的价值观'"
            type="button"
          >
            <div class="add-icon" aria-hidden="true">
              <el-icon><Plus /></el-icon>
            </div>
            <p>添加价值观</p>
          </button>
        </div>
      </section>

      <!-- 发展历程 -->
      <section class="intro-section fade-in" data-aos="fade-up" :aria-labelledby="timeline-title">
        <div class="section-header">
          <h2 
            :id="editing ? undefined : 'timeline-title'"
            class="section-title" 
            :class="{ 'edit-mode': editing }" 
            :contenteditable="editing" 
            @blur="updateSectionTitle('historyTitle')" 
            v-if="editing"
            ref="historyTitleRef"
            :aria-label="editing ? '编辑发展历程标题' : sectionData.historyTitle"
          >
            {{ sectionData.historyTitle }}
          </h2>
          <h2 :id="editing ? 'timeline-title' : undefined" class="section-title" v-else>{{ sectionData.historyTitle }}</h2>
          <div class="section-divider" aria-hidden="true"></div>
        </div>
        <div class="timeline-wrapper">
          <el-timeline 
            :reverse="false" 
            mode="alternate"
            :aria-label="sectionData.historyTitle"
          >
            <el-timeline-item
              v-for="(item, index) in timelineItems"
              :key="item.id || `timeline-${index}`"
              :timestamp="item.year"
              :placement="index % 2 === 0 ? 'top' : 'bottom'"
              :icon="TimeIcon"
              type="primary"
              size="large"
            >
              <div class="timeline-content" :class="{ 'edit-mode': editing }">
                <div v-if="editing" class="timeline-edit">
                  <div 
                    class="timeline-year" 
                    @click="editTimelineYear(index)"
                    :aria-label="'编辑年份：' + item.year"
                    tabindex="0"
                    @keydown.enter="editTimelineYear(index)"
                    @keydown.space.prevent="editTimelineYear(index)"
                  >
                    {{ item.year }}
                    <el-icon class="edit-icon" aria-hidden="true"><Edit /></el-icon>
                  </div>
                  <p 
                    @click="editTimelineDescription(index)"
                    :aria-label="'编辑时间线描述'"
                    tabindex="0"
                    @keydown.enter="editTimelineDescription(index)"
                    @keydown.space.prevent="editTimelineDescription(index)"
                  >
                    {{ item.description }}
                    <el-icon class="edit-icon" aria-hidden="true"><Edit /></el-icon>
                  </p>
                  <button 
                    class="delete-timeline-item" 
                    @click="confirmDeleteTimelineItem(index)"
                    :aria-label="'删除时间线项'"
                    type="button"
                  >
                    <el-icon aria-hidden="true"><Delete /></el-icon>
                  </button>
                </div>
                <div v-else>
                  <div class="timeline-year">{{ item.year }}</div>
                  <p>{{ item.description }}</p>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
          
          <div class="add-timeline-item" v-if="editing">
            <el-button 
              type="primary" 
              plain
              @click="addNewTimelineItem"
              :aria-label="'添加新的时间节点'"
            >
              <el-icon><Plus /></el-icon> 添加时间节点
            </el-button>
          </div>
        </div>
      </section>

      <!-- 企业优势 -->
      <section class="intro-section fade-in alternate-section" data-aos="fade-up" :aria-labelledby="advantages-title">
        <div class="section-header">
          <h2 
            :id="editing ? undefined : 'advantages-title'"
            class="section-title" 
            :class="{ 'edit-mode': editing }" 
            :contenteditable="editing" 
            @blur="updateSectionTitle('advantageTitle')" 
            v-if="editing"
            ref="advantageTitleRef"
            :aria-label="editing ? '编辑企业优势标题' : sectionData.advantageTitle"
          >
            {{ sectionData.advantageTitle }}
          </h2>
          <h2 :id="editing ? 'advantages-title' : undefined" class="section-title" v-else>{{ sectionData.advantageTitle }}</h2>
          <div class="section-divider" aria-hidden="true"></div>
        </div>
        <div class="advantages-container" role="list" :aria-label="'企业优势'">
          <article 
            v-for="(advantage, index) in advantages" 
            :key="advantage.id || `advantage-${index}`"
            class="advantage-item" 
            :class="{ 'edit-mode': editing }" 
            role="listitem"
            :aria-label="advantage.title"
          >
            <div 
              class="advantage-icon" 
              v-if="editing" 
              @click="selectAdvantageIcon(index)"
              :aria-label="'选择' + advantage.title + '的图标'"
              tabindex="0"
              @keydown.enter="selectAdvantageIcon(index)"
              @keydown.space.prevent="selectAdvantageIcon(index)"
            >
              <component :is="advantage.icon" />
              <el-icon class="edit-icon" aria-hidden="true"><Edit /></el-icon>
            </div>
            <div class="advantage-icon" v-else :aria-hidden="true">
              <component :is="advantage.icon" />
            </div>
            
            <h3 
              class="advantage-title" 
              v-if="editing" 
              @click="editAdvantageTitle(index)"
              :aria-label="'编辑' + advantage.title"
              tabindex="0"
              @keydown.enter="editAdvantageTitle(index)"
              @keydown.space.prevent="editAdvantageTitle(index)"
            >
              {{ advantage.title }}
              <el-icon class="edit-icon" aria-hidden="true"><Edit /></el-icon>
            </h3>
            <h3 class="advantage-title" v-else>{{ advantage.title }}</h3>
            
            <p 
              class="advantage-description" 
              v-if="editing" 
              @click="editAdvantageDescription(index)"
              :aria-label="'编辑' + advantage.title + '描述'"
              tabindex="0"
              @keydown.enter="editAdvantageDescription(index)"
              @keydown.space.prevent="editAdvantageDescription(index)"
            >
              {{ advantage.description }}
              <el-icon class="edit-icon" aria-hidden="true"><Edit /></el-icon>
            </p>
            <p class="advantage-description" v-else>{{ advantage.description }}</p>
            
            <button 
              v-if="editing && advantages.length > 1" 
              @click="confirmDeleteAdvantage(index)"
              class="delete-advantage"
              :aria-label="'删除' + advantage.title"
              type="button"
            >
              <el-icon aria-hidden="true"><Delete /></el-icon>
            </button>
          </article>
          
          <button 
            class="add-advantage-item" 
            v-if="editing" 
            @click="addNewAdvantage"
            :aria-label="'添加新的优势'"
            type="button"
          >
            <div class="add-icon" aria-hidden="true">
              <el-icon><Plus /></el-icon>
            </div>
            <p>添加优势</p>
          </button>
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

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="showEditDialog"
      :title="editDialogTitle"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      :aria-label="'编辑对话框'"
    >
      <el-form :model="editForm" @submit.prevent="saveEditDialog">
        <el-form-item :label="getEditDialogLabel()">
          <el-input 
            v-model="editForm.value" 
            :type="editDialogType === 'textarea' ? 'textarea' : 'text'" 
            :rows="editDialogType === 'textarea' ? 4 : 1"
            :placeholder="'请输入' + getEditDialogLabel()"
            ref="editInputRef"
            @keydown.enter.ctrl="saveEditDialog"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false" :disabled="saving">取消</el-button>
        <el-button 
          type="primary" 
          @click="saveEditDialog"
          :loading="saving"
          :disabled="!editForm.value.trim()"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 图标选择对话框 -->
    <el-dialog
      v-model="showIconDialog" 
      title="选择图标" 
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      :aria-label="'图标选择对话框'"
    >
      <div class="icon-selector" role="grid" :aria-label="'可选图标列表'">
        <button
          v-for="(icon, index) in availableIcons" 
          :key="icon.name"
          class="icon-item" 
          @click="selectIcon(icon)"
          :aria-label="'选择' + icon.label + '图标'"
          type="button"
          role="gridcell"
          tabindex="0"
          @keydown.enter="selectIcon(icon)"
          @keydown.space.prevent="selectIcon(icon)"
        >
          <component :is="icon.component" :aria-hidden="true" />
          <span>{{ icon.label }}</span>
        </button>
      </div>
    </el-dialog>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay" role="status" aria-live="polite">
      <el-loading-spinner />
      <p>加载中...</p>
    </div>

    <!-- 错误提示 -->
    <el-dialog
      v-model="showErrorDialog"
      title="错误提示"
      width="400px"
      :close-on-click-modal="true"
      :aria-label="'错误提示对话框'"
    >
      <p>{{ errorMessage }}</p>
      <template #footer>
        <el-button type="primary" @click="showErrorDialog = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, computed, watch } from 'vue';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import { Head } from '@vueuse/head';
import { throttle, debounce } from 'lodash-es';

// 导入所有可能用到的图标
import {
  Goal, Star, Scissors, Time, Cpu, Users, Files, Bell,
  Award, TrendingUp, Layout, Settings, Code, Database,
  Message, Phone, Mail, Map, Calendar, Check, Plus, Delete, Edit, Close
} from '@element-plus/icons-vue';

// ==================== 类型定义 ====================
interface CompanyInfo {
  companyName: string;
  companySlogan: string;
  companyDescription: string;
  sectionData: SectionData;
  statistics: StatItem[];
  values: CultureValue[];
  timelineItems: TimelineItem[];
  advantages: Advantage[];
}

interface SectionData {
  overviewTitle: string;
  cultureTitle: string;
  historyTitle: string;
  advantageTitle: string;
}

interface StatItem {
  id?: string;
  number: string;
  label: string;
  animated?: boolean;
}

interface CultureValue {
  id?: string;
  icon: any;
  title: string;
  description: string;
}

interface TimelineItem {
  id?: string;
  year: string;
  description: string;
}

interface Advantage {
  id?: string;
  icon: any;
  title: string;
  description: string;
}

interface FooterLink {
  path: string;
  label: string;
  active: boolean;
}

interface IconOption {
  name: string;
  component: any;
  label: string;
}

interface EditTarget {
  type: string;
  index: number;
  field?: string;
}

// ==================== 响应式数据 ====================
const editing = ref(false);
const saving = ref(false);
const loading = ref(false);
const hasChanges = ref(false);
const currentLocale = ref('zh-CN');

// 编辑对话框状态
const showEditDialog = ref(false);
const editDialogTitle = ref('');
const editDialogType = ref<'text' | 'textarea'>('text');
const editForm = reactive({ value: '' });
const editTarget = reactive<EditTarget>({ type: '', index: -1 });

// 图标选择对话框状态
const showIconDialog = ref(false);
const iconSelectionTarget = reactive<EditTarget>({ type: '', index: -1 });

// 错误处理状态
const showErrorDialog = ref(false);
const errorMessage = ref('');

// 可编辑内容引用
const companyNameRef = ref<HTMLElement>();
const companySloganRef = ref<HTMLElement>();
const companyDescriptionRef = ref<HTMLElement>();
const overviewTitleRef = ref<HTMLElement>();
const cultureTitleRef = ref<HTMLElement>();
const historyTitleRef = ref<HTMLElement>();
const advantageTitleRef = ref<HTMLElement>();
const statNumbers = ref<HTMLElement[]>([]);
const editInputRef = ref();

// 企业基本信息
const companyName = ref('Enterprise Brain');
const companySlogan = ref('智能制造数字化解决方案领导者');
const companyDescription = ref(
  '本企业是一家专注于智能制造、供应链管理的高新技术企业，致力于为制造型企业提供全方位的数字化解决方案。\n' +
  '公司拥有专业的研发团队和丰富的行业经验，产品涵盖生产管理、库存管理、质量管理、人力资源等多个模块，\n' +
  '帮助企业实现生产流程优化、成本降低、效率提升。'
);

// 章节标题
const sectionData = reactive<SectionData>({
  overviewTitle: '公司概况',
  cultureTitle: '企业文化',
  historyTitle: '发展历程',
  advantageTitle: '企业优势'
});

// 统计数据
const statistics = ref<StatItem[]>([
  { id: 'stat-001', number: '100+', label: '企业客户' },
  { id: 'stat-002', number: '50+', label: '专业研发人员' },
  { id: 'stat-003', number: '5年+', label: '行业经验' },
  { id: 'stat-004', number: '4大', label: '产品系列' }
]);

// 价值观数据
const values = ref<CultureValue[]>([
  { id: 'culture-001', icon: Goal, title: '使命', description: '用数字化技术赋能制造企业转型升级' },
  { id: 'culture-002', icon: Star, title: '愿景', description: '成为智能制造领域的领军企业' },
  { id: 'culture-003', icon: Scissors, title: '价值观', description: '诚信、创新、协作、共赢' }
]);

// 时间线数据
const timelineItems = ref<TimelineItem[]>([
  { id: 'timeline-001', year: '2020年', description: '公司成立，专注智能制造解决方案研发' },
  { id: 'timeline-002', year: '2021年', description: '首款核心产品上线，获得100+企业客户认可' },
  { id: 'timeline-003', year: '2022年', description: '完成A轮融资，扩大研发团队规模' },
  { id: 'timeline-004', year: '2023年', description: '产品矩阵完善，覆盖全产业链数字化需求' },
  { id: 'timeline-005', year: '2024年', description: '启动全国市场布局，设立多个区域服务中心' }
]);

// 企业优势数据
const advantages = ref<Advantage[]>([
  { id: 'adv-001', icon: Cpu, title: '技术领先', description: '持续研发投入，拥有多项核心技术和专利' },
  { id: 'adv-002', icon: Users, title: '专业团队', description: '汇聚行业专家和技术人才，提供专业服务' },
  { id: 'adv-003', icon: Files, title: '完善方案', description: '覆盖全产业链的数字化解决方案' },
  { id: 'adv-004', icon: Bell, title: '优质服务', description: '7×24小时技术支持，确保系统稳定运行' }
]);

// 可选图标列表
const availableIcons = ref<IconOption[]>([
  { name: 'Goal', component: Goal, label: '目标' },
  { name: 'Star', component: Star, label: '星星' },
  { name: 'Scissors', component: Scissors, label: '剪刀' },
  { name: 'Cpu', component: Cpu, label: '处理器' },
  { name: 'Users', component: Users, label: '用户' },
  { name: 'Files', component: Files, label: '文件' },
  { name: 'Bell', component: Bell, label: '铃铛' },
  { name: 'Award', component: Award, label: '奖项' },
  { name: 'TrendingUp', component: TrendingUp, label: '上升趋势' },
  { name: 'Layout', component: Layout, label: '布局' },
  { name: 'Settings', component: Settings, label: '设置' },
  { name: 'Code', component: Code, label: '代码' },
  { name: 'Database', component: Database, label: '数据库' }
]);

// 页脚链接数据
const footerLinks = ref<FooterLink[]>([
  { path: '/system/company/CompanyIntro', label: '企业简介', active: true },
  { path: '/system/company/ContactUs', label: '联系方式', active: false },
  { path: '/system/company/PrivacyPolicy', label: '隐私政策', active: false }
]);

// 静态资源
const bannerImage = ref('https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80');

// 图标组件
const TimeIcon = Time;

// ==================== 计算属性 ====================
const hasUnsavedChanges = computed(() => hasChanges.value);

// ==================== 监听器 ====================
watch([companyName, companySlogan, companyDescription, sectionData, statistics, values, timelineItems, advantages], () => {
  if (editing.value) {
    hasChanges.value = true;
  }
}, { deep: true });

// ==================== 编辑功能 ====================
const startEdit = async () => {
  try {
    editing.value = true;
    hasChanges.value = false;
    ElMessage.info('进入编辑模式，可以直接修改内容');
    
    // 聚焦到第一个可编辑元素
    await nextTick();
    if (companyNameRef.value) {
      companyNameRef.value.focus();
    }
  } catch (error) {
    handleError('进入编辑模式失败', error);
  }
};

const cancelEdit = () => {
  ElMessageBox.confirm('确定要取消编辑吗？未保存的更改将丢失', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      editing.value = false;
      hasChanges.value = false;
      // 重新加载数据
      await loadCompanyInfo();
      ElMessage.success('已取消编辑');
    } catch (error) {
      handleError('取消编辑失败', error);
    }
  }).catch(() => {
    // 用户取消，继续编辑
  });
};

const saveChanges = async () => {
  if (!hasChanges.value) {
    ElMessage.info('没有需要保存的更改');
    return;
  }

  saving.value = true;
  
  try {
    // 验证数据完整性
    if (!validateData()) {
      saving.value = false;
      return;
    }

    // 构建保存数据
    const saveData: CompanyInfo = {
      companyName: companyName.value,
      companySlogan: companySlogan.value,
      companyDescription: companyDescription.value,
      sectionData: { ...sectionData },
      statistics: statistics.value.map(stat => ({
        ...stat,
        id: stat.id || generateId('stat')
      })),
      values: values.value.map(value => ({
        ...value,
        id: value.id || generateId('value'),
        icon: value.icon.name || 'Goal'
      })),
      timelineItems: timelineItems.value.map(item => ({
        ...item,
        id: item.id || generateId('timeline')
      })),
      advantages: advantages.value.map(advantage => ({
        ...advantage,
        id: advantage.id || generateId('advantage'),
        icon: advantage.icon.name || 'Award'
      }))
    };
    
    // 模拟API调用
    await simulateApiCall(() => {
      // 这里应该是实际的API调用
      console.log('保存数据:', saveData);
    }, 1500);
    
    ElMessage.success('保存成功');
    editing.value = false;
    hasChanges.value = false;
    
  } catch (error) {
    handleError('保存失败', error);
  } finally {
    saving.value = false;
  }
};

// ==================== 数据加载 ====================
const loadCompanyInfo = async () => {
  loading.value = true;
  
  try {
    // 模拟API调用
    await simulateApiCall(() => {
      // 这里应该是实际的API调用
      // const response = await axios.get('/api/company/intro');
      // const data = response.data;
      // 更新本地数据
    }, 1000);
    
  } catch (error) {
    handleError('加载企业信息失败', error);
  } finally {
    loading.value = false;
  }
};

// ==================== 内容更新方法 ====================
const updateCompanyName = () => {
  if (companyNameRef.value) {
    const newValue = companyNameRef.value.textContent?.trim();
    if (newValue && newValue !== companyName.value) {
      companyName.value = newValue;
      ElMessage.success('公司名称已更新');
    }
  }
};

const updateCompanySlogan = () => {
  if (companySloganRef.value) {
    const newValue = companySloganRef.value.textContent?.trim();
    if (newValue && newValue !== companySlogan.value) {
      companySlogan.value = newValue;
      ElMessage.success('公司口号已更新');
    }
  }
};

const updateCompanyDescription = () => {
  if (companyDescriptionRef.value) {
    const newValue = companyDescriptionRef.value.textContent?.trim();
    if (newValue && newValue !== companyDescription.value) {
      companyDescription.value = newValue;
      ElMessage.success('公司描述已更新');
    }
  }
};

const updateSectionTitle = (field: keyof SectionData) => {
  const refMap: Record<string, HTMLElement | undefined> = {
    'overviewTitle': overviewTitleRef.value,
    'cultureTitle': cultureTitleRef.value,
    'historyTitle': historyTitleRef.value,
    'advantageTitle': advantageTitleRef.value
  };
  
  if (refMap[field]) {
    const newValue = refMap[field]?.textContent?.trim();
    if (newValue && newValue !== sectionData[field]) {
      sectionData[field] = newValue;
      ElMessage.success('章节标题已更新');
    }
  }
};

// ==================== 编辑对话框方法 ====================
const openEditDialog = (title: string, value: string, type: 'text' | 'textarea', targetType: string, index: number) => {
  editDialogTitle.value = title;
  editForm.value = value;
  editDialogType.value = type;
  editTarget.type = targetType;
  editTarget.index = index;
  showEditDialog.value = true;
  
  // 聚焦输入框
  nextTick(() => {
    if (editInputRef.value) {
      editInputRef.value.focus();
    }
  });
};

const saveEditDialog = () => {
  const value = editForm.value.trim();
  if (!value) {
    ElMessage.warning('内容不能为空');
    return;
  }
  
  try {
    switch (editTarget.type) {
      case 'statNumber':
        statistics.value[editTarget.index].number = value;
        ElMessage.success('统计数字已更新');
        break;
      case 'statLabel':
        statistics.value[editTarget.index].label = value;
        ElMessage.success('统计标签已更新');
        break;
      case 'valueTitle':
        values.value[editTarget.index].title = value;
        ElMessage.success('价值观标题已更新');
        break;
      case 'valueDescription':
        values.value[editTarget.index].description = value;
        ElMessage.success('价值观描述已更新');
        break;
      case 'timelineYear':
        timelineItems.value[editTarget.index].year = value;
        ElMessage.success('年份已更新');
        break;
      case 'timelineDescription':
        timelineItems.value[editTarget.index].description = value;
        ElMessage.success('时间线描述已更新');
        break;
      case 'advantageTitle':
        advantages.value[editTarget.index].title = value;
        ElMessage.success('优势标题已更新');
        break;
      case 'advantageDescription':
        advantages.value[editTarget.index].description = value;
        ElMessage.success('优势描述已更新');
        break;
    }
    
    showEditDialog.value = false;
  } catch (error) {
    handleError('编辑失败', error);
  }
};

const getEditDialogLabel = () => {
  const labelMap: Record<string, string> = {
    'statNumber': '统计数字',
    'statLabel': '统计标签',
    'valueTitle': '价值观标题',
    'valueDescription': '价值观描述',
    'timelineYear': '年份',
    'timelineDescription': '时间线描述',
    'advantageTitle': '优势标题',
    'advantageDescription': '优势描述'
  };
  return labelMap[editTarget.type] || '内容';
};

// ==================== 编辑操作方法 ====================
const editStat = (index: number) => {
  openEditDialog('编辑统计数字', statistics.value[index].number, 'text', 'statNumber', index);
};

const editStatLabel = (index: number) => {
  openEditDialog('编辑统计标签', statistics.value[index].label, 'text', 'statLabel', index);
};

const editValueTitle = (index: number) => {
  openEditDialog('编辑标题', values.value[index].title, 'text', 'valueTitle', index);
};

const editValueDescription = (index: number) => {
  openEditDialog('编辑描述', values.value[index].description, 'text', 'valueDescription', index);
};

const editTimelineYear = (index: number) => {
  openEditDialog('编辑年份', timelineItems.value[index].year, 'text', 'timelineYear', index);
};

const editTimelineDescription = (index: number) => {
  openEditDialog('编辑描述', timelineItems.value[index].description, 'textarea', 'timelineDescription', index);
};

const editAdvantageTitle = (index: number) => {
  openEditDialog('编辑标题', advantages.value[index].title, 'text', 'advantageTitle', index);
};

const editAdvantageDescription = (index: number) => {
  openEditDialog('编辑描述', advantages.value[index].description, 'text', 'advantageDescription', index);
};

// ==================== 图标选择方法 ====================
const selectValueIcon = (index: number) => {
  iconSelectionTarget.type = 'value';
  iconSelectionTarget.index = index;
  showIconDialog.value = true;
};

const selectAdvantageIcon = (index: number) => {
  iconSelectionTarget.type = 'advantage';
  iconSelectionTarget.index = index;
  showIconDialog.value = true;
};

const selectIcon = (iconOption: IconOption) => {
  try {
    if (iconSelectionTarget.type === 'value') {
      values.value[iconSelectionTarget.index].icon = iconOption.component;
    } else if (iconSelectionTarget.type === 'advantage') {
      advantages.value[iconSelectionTarget.index].icon = iconOption.component;
    }
    showIconDialog.value = false;
    ElMessage.success('图标已更新');
  } catch (error) {
    handleError('图标选择失败', error);
  }
};

// ==================== 删除操作方法 ====================
const confirmDeleteValue = (index: number) => {
  const value = values.value[index];
  ElMessageBox.confirm(`确定要删除"${value.title}"吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    values.value.splice(index, 1);
    ElMessage.success('价值观已删除');
  }).catch(() => {
    // 用户取消
  });
};

const confirmDeleteTimelineItem = (index: number) => {
  const item = timelineItems.value[index];
  ElMessageBox.confirm(`确定要删除"${item.year}"的时间节点吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    timelineItems.value.splice(index, 1);
    ElMessage.success('时间节点已删除');
  }).catch(() => {
    // 用户取消
  });
};

const confirmDeleteAdvantage = (index: number) => {
  const advantage = advantages.value[index];
  ElMessageBox.confirm(`确定要删除"${advantage.title}"吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    advantages.value.splice(index, 1);
    ElMessage.success('企业优势已删除');
  }).catch(() => {
    // 用户取消
  });
};

// ==================== 添加操作方法 ====================
const addNewValue = () => {
  const newValue: CultureValue = {
    id: generateId('value'),
    icon: Goal,
    title: '新价值观',
    description: '请编辑价值观描述'
  };
  values.value.push(newValue);
  ElMessage.success('价值观已添加');
};

const addNewTimelineItem = () => {
  const newItem: TimelineItem = {
    id: generateId('timeline'),
    year: '2024年',
    description: '请编辑时间线描述'
  };
  timelineItems.value.push(newItem);
  ElMessage.success('时间节点已添加');
};

const addNewAdvantage = () => {
  const newAdvantage: Advantage = {
    id: generateId('advantage'),
    icon: Award,
    title: '新优势',
    description: '请编辑优势描述'
  };
  advantages.value.push(newAdvantage);
  ElMessage.success('企业优势已添加');
};

// ==================== 辅助方法 ====================
const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const validateData = (): boolean => {
  if (!companyName.value.trim()) {
    ElMessage.error('公司名称不能为空');
    return false;
  }
  
  if (!companySlogan.value.trim()) {
    ElMessage.error('公司口号不能为空');
    return false;
  }
  
  if (!companyDescription.value.trim()) {
    ElMessage.error('公司描述不能为空');
    return false;
  }
  
  return true;
};

const simulateApiCall = (callback: () => void, delay: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      callback();
      resolve();
    }, delay);
  });
};

const handleError = (message: string, error: any) => {
  console.error(message, error);
  errorMessage.value = `${message}: ${error.message || error}`;
  showErrorDialog.value = true;
};

const handleImageError = () => {
  console.warn('Banner image failed to load');
  // 可以设置默认图片或显示错误提示
};

// ==================== 生命周期 ====================
onMounted(async () => {
  await loadCompanyInfo();
});
</script>

<style scoped>
/* ==================== 全局样式 ==================== */
.company-intro {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #333;
  line-height: 1.6;
  min-height: 100vh;
}

/* ==================== 顶部横幅 ==================== */
.intro-banner {
  background: linear-gradient(135deg, #1989fa 0%, #409eff 100%);
  color: white;
  padding: 100px 0;
  text-align: center;
  position: relative;
  overflow: hidden;
  min-height: 400px;
}

.intro-banner.edit-mode-bg {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #333;
}

.banner-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  opacity: 0.1;
}

.banner-content {
  position: relative;
  z-index: 1;
}

.company-name {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 20px;
  letter-spacing: -1px;
  transition: all 0.3s ease;
}

.company-name.edit-mode {
  background: rgba(255, 255, 255, 0.2);
  border: 2px dashed rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 10px;
  cursor: text;
}

.company-slogan {
  font-size: 1.5rem;
  font-weight: 400;
  margin-bottom: 30px;
}

.company-slogan.edit-mode {
  background: rgba(255, 255, 255, 0.2);
  border: 2px dashed rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 10px;
  cursor: text;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 30px;
}

/* ==================== 主要内容区域 ==================== */
.intro-content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* ==================== 章节通用样式 ==================== */
.intro-section {
  padding: 80px 0;
  margin-bottom: 0;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease-out;
}

.intro-section.fade-in.active {
  opacity: 1;
  transform: translateY(0);
}

.intro-section.alternate-section {
  background-color: #f8f9fa;
  margin: 0 -20px;
  padding-left: 20px;
  padding-right: 20px;
}

.section-header {
  text-align: center;
  margin-bottom: 50px;
}

.section-title {
  font-size: 2.2rem;
  font-weight: 600;
  color: #1989fa;
  margin-bottom: 15px;
}

.section-title.edit-mode {
  background: rgba(25, 137, 250, 0.1);
  border: 2px dashed #1989fa;
  border-radius: 8px;
  padding: 10px;
  cursor: text;
}

.section-divider {
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, #1989fa 0%, #409eff 100%);
  margin: 0 auto;
  border-radius: 3px;
}

.section-content {
  max-width: 900px;
  margin: 0 auto;
}

/* ==================== 公司概况 ==================== */
.company-description {
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 50px;
  color: #555;
  text-align: center;
}

.company-description.edit-mode {
  background: rgba(25, 137, 250, 0.05);
  border: 2px dashed #1989fa;
  border-radius: 8px;
  padding: 20px;
  cursor: text;
}

/* ==================== 数据统计 ==================== */
.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 30px;
}

.stat-item {
  background: white;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1989fa;
  margin-bottom: 10px;
}

.stat-number.edit-mode {
  background: rgba(25, 137, 250, 0.1);
  border: 2px dashed #1989fa;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  position: relative;
}

.stat-label {
  font-size: 1rem;
  color: #666;
  margin-bottom: 10px;
}

.stat-label.edit-mode {
  background: rgba(25, 137, 250, 0.1);
  border: 2px dashed #1989fa;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  position: relative;
}

/* ==================== 企业文化 ==================== */
.values-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
}

.value-card {
  background: white;
  border-radius: 12px;
  padding: 40px 30px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
}

.value-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.value-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #1989fa;
  font-size: 2rem;
}

.value-icon.edit-mode {
  cursor: pointer;
  position: relative;
  background: rgba(25, 137, 250, 0.1);
  border: 2px dashed #1989fa;
}

.value-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
}

.value-title.edit-mode {
  background: rgba(25, 137, 250, 0.1);
  border: 2px dashed #1989fa;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  position: relative;
}

.value-description {
  font-size: 1rem;
  color: #666;
  line-height: 1.6;
}

.value-description.edit-mode {
  background: rgba(25, 137, 250, 0.1);
  border: 2px dashed #1989fa;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  position: relative;
}

/* ==================== 时间线 ==================== */
.timeline-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.timeline-content {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-left: 3px solid #1989fa;
}

.timeline-edit {
  position: relative;
}

.timeline-year {
  font-weight: 600;
  color: #1989fa;
  margin-bottom: 10px;
  cursor: pointer;
  padding: 10px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.timeline-year:hover {
  background-color: rgba(25, 137, 250, 0.1);
}

/* ==================== 企业优势 ==================== */
.advantages-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
}

.advantage-item {
  background: white;
  border-radius: 12px;
  padding: 35px 30px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
}

.advantage-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.advantage-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: #1989fa;
  font-size: 1.5rem;
}

.advantage-icon.edit-mode {
  cursor: pointer;
  position: relative;
  background: rgba(25, 137, 250, 0.1);
  border: 2px dashed #1989fa;
}

.advantage-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
}

.advantage-title.edit-mode {
  background: rgba(25, 137, 250, 0.1);
  border: 2px dashed #1989fa;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  position: relative;
}

.advantage-description {
  font-size: 1rem;
  color: #666;
  line-height: 1.6;
}

.advantage-description.edit-mode {
  background: rgba(25, 137, 250, 0.1);
  border: 2px dashed #1989fa;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  position: relative;
}

/* ==================== 页脚导航 ==================== */
.page-footer {
  background: #f8f9fa;
  padding: 30px 0;
  border-top: 1px solid #e9ecef;
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

/* ==================== 编辑模式样式 ==================== */
.edit-icon {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #1989fa;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.edit-mode .edit-icon,
.value-icon.edit-mode .edit-icon,
.value-title.edit-mode .edit-icon,
.value-description.edit-mode .edit-icon,
.advantage-icon.edit-mode .edit-icon,
.advantage-title.edit-mode .edit-icon,
.advantage-description.edit-mode .edit-icon,
.stat-number.edit-mode .edit-icon,
.stat-label.edit-mode .edit-icon {
  opacity: 1;
}

.delete-value,
.delete-timeline-item,
.delete-advantage {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #f56c6c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.delete-value:hover,
.delete-timeline-item:hover,
.delete-advantage:hover {
  background: #ff4d4f;
  transform: scale(1.1);
}

.add-value-card,
.add-advantage-item {
  background: rgba(25, 137, 250, 0.05);
  border: 2px dashed #1989fa;
  border-radius: 12px;
  padding: 40px 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #1989fa;
}

.add-value-card:hover,
.add-advantage-item:hover {
  background: rgba(25, 137, 250, 0.1);
  transform: translateY(-2px);
}

.add-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

/* ==================== 对话框样式 ==================== */
.icon-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  max-height: 300px;
  overflow-y: auto;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.icon-item:hover {
  border-color: #1989fa;
  background: rgba(25, 137, 250, 0.05);
}

.icon-item span {
  margin-top: 5px;
  font-size: 0.8rem;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.add-timeline-item {
  text-align: center;
  margin-top: 30px;
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1200px) {
  .company-name {
    font-size: 3rem;
  }
  
  .stats-container {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .values-container {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .company-name {
    font-size: 2.5rem;
  }
  
  .company-slogan {
    font-size: 1.2rem;
  }
  
  .intro-section {
    padding: 50px 0;
  }
  
  .section-title {
    font-size: 1.8rem;
  }
  
  .stats-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .values-container {
    grid-template-columns: 1fr;
  }
  
  .advantages-container {
    grid-template-columns: 1fr;
  }
  
  .intro-section.alternate-section {
    margin: 0 -20px;
    padding-left: 20px;
    padding-right: 20px;
  }
  
  .footer-links {
    gap: 20px;
    flex-wrap: wrap;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .icon-selector {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .timeline-wrapper {
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .company-name {
    font-size: 2rem;
  }
  
  .intro-banner {
    padding: 80px 0;
    min-height: 300px;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .company-description {
    padding: 20px;
    font-size: 1rem;
  }
  
  .stat-number {
    font-size: 2.2rem;
  }
  
  .value-card,
  .advantage-item {
    padding: 30px 20px;
  }
  
  .value-icon,
  .advantage-icon {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
  
  .icon-selector {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .page-footer {
    padding: 30px 0;
  }
  
  .footer-links {
    gap: 12px;
  }
  
  .footer-link {
    padding: 8px 16px;
    font-size: 0.9rem;
  }
}

/* ==================== 深色模式支持 ==================== */
@media (prefers-color-scheme: dark) {
  .company-intro {
    color: #e0e0e0;
  }
  
  .intro-banner.edit-mode-bg {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  }
  
  .section-divider {
    background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
  }
  
  .company-description {
    color: #b0b0b0;
    background: rgba(0, 0, 0, 0.3);
  }
  
  .value-card,
  .advantage-item,
  .stat-item {
    background: #1a1a1a;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .page-footer {
    background: #1a1a1a;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .footer-link {
    color: #b0b0b0;
  }
}

/* ==================== 打印样式 ==================== */
@media print {
  .action-buttons,
  .edit-icon,
  .delete-value,
  .delete-timeline-item,
  .delete-advantage,
  .add-value-card,
  .add-advantage-item,
  .add-timeline-item {
    display: none !important;
  }
  
  .company-intro {
    color: black;
  }
  
  .intro-section {
    opacity: 1;
    transform: none;
  }
  
  .page-footer {
    background: white;
    border-color: #ccc;
  }
}

/* ==================== 高对比度模式 ==================== */
@media (prefers-contrast: high) {
  .company-name,
  .section-title {
    text-shadow: none;
  }
  
  .stat-item,
  .value-card,
  .advantage-item {
    border: 2px solid #000;
  }
  
  .footer-link:hover,
  .footer-link.active {
    background: #000;
    color: #fff;
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