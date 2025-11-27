<template>
  <div class="defect-report mobile-page">
    <div class="mobile-header">
      <van-nav-bar
        title="缺陷报工"
        left-text="返回"
        left-arrow
        @click-left="$router.back()"
      />
    </div>

    <div class="mobile-content">
      <!-- 产品信息 -->
      <div class="product-section">
        <van-search
          v-model="productSearch"
          placeholder="搜索产品或扫码"
          @search="searchProduct"
        />
        
        <van-cell-group v-if="productInfo">
          <van-cell title="产品名称" :value="productInfo.name" />
          <van-cell title="产品编号" :value="productInfo.code" />
          <van-cell title="工序" :value="productInfo.process" />
        </van-cell-group>
      </div>

      <!-- 缺陷表单 -->
      <div class="defect-form" v-if="productInfo">
        <van-divider>缺陷信息</van-divider>
        
        <van-field name="defectType" label="缺陷类型">
          <template #input>
            <van-radio-group v-model="defectForm.defectType" direction="horizontal">
              <van-radio name="外观缺陷">外观缺陷</van-radio>
              <van-radio name="功能缺陷">功能缺陷</van-radio>
              <van-radio name="尺寸缺陷">尺寸缺陷</van-radio>
            </van-radio-group>
          </template>
        </van-field>
        
        <van-field
          v-model="defectForm.defectDescription"
          label="缺陷描述"
          type="textarea"
          placeholder="请详细描述缺陷情况"
          rows="3"
        />
        
        <van-field
          v-model="defectForm.defectLevel"
          label="缺陷等级"
          placeholder="选择缺陷等级"
          readonly
          is-link
          @click="showDefectLevelPicker = true"
        />
        
        <van-field
          v-model="defectForm.quantity"
          label="缺陷数量"
          type="number"
          placeholder="请输入缺陷数量"
        />
        
        <van-field name="hasImage" label="现场照片">
          <template #input>
            <van-uploader
              v-model="defectForm.images"
              multiple
              :max-count="3"
              preview-size="60"
            />
          </template>
        </van-field>
        
        <van-field
          v-model="defectForm.responsibility"
          label="责任部门"
          placeholder="选择责任部门"
          readonly
          is-link
          @click="showDepartmentPicker = true"
        />
        
        <van-field
          v-model="defectForm.improvementMeasure"
          label="改进措施"
          type="textarea"
          placeholder="请输入改进措施建议"
          rows="2"
        />
      </div>

      <!-- 快速操作 -->
      <div class="quick-actions">
        <van-grid :column-num="3" :gutter="12">
          <van-grid-item @click="photoReport">
            <van-icon name="photograph" size="24" color="#1989fa" />
            <span>拍照报工</span>
          </van-grid-item>
          <van-grid-item @click="voiceReport">
            <van-icon name="voice" size="24" color="#07c160" />
            <span>语音报工</span>
          </van-grid-item>
          <van-grid-item @click="emergencyReport">
            <van-icon name="warning-o" size="24" color="#ee0a24" />
            <span>紧急上报</span>
          </van-grid-item>
        </van-grid>
      </div>

      <!-- 历史记录 -->
      <div class="history-records">
        <van-divider>今日缺陷记录</van-divider>
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="loadRecords"
        >
          <van-cell
            v-for="record in records"
            :key="record.id"
            :title="record.productName"
            :label="`${record.time} | 类型: ${record.defectType}`"
            is-link
            @click="viewRecord(record)"
          >
            <template #icon>
              <van-icon name="warning-o" :color="getDefectColor(record.defectLevel)" />
            </template>
            <template #value>
              <van-tag :type="getDefectTagType(record.defectLevel)" size="mini">
                {{ record.defectLevel }}
              </van-tag>
            </template>
          </van-cell>
        </van-list>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="mobile-footer" v-if="productInfo">
      <van-button 
        type="danger" 
        block 
        round 
        @click="submitReport"
        :loading="submitting"
      >
        提交缺陷报告
      </van-button>
    </div>

    <!-- 缺陷等级选择器 -->
    <van-popup v-model:show="showDefectLevelPicker" position="bottom">
      <van-picker
        :columns="defectLevelColumns"
        @confirm="onDefectLevelConfirm"
        @cancel="showDefectLevelPicker = false"
      />
    </van-popup>

    <!-- 责任部门选择器 -->
    <van-popup v-model:show="showDepartmentPicker" position="bottom">
      <van-picker
        :columns="departmentColumns"
        @confirm="onDepartmentConfirm"
        @cancel="showDepartmentPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'

const productSearch = ref('')
const showDefectLevelPicker = ref(false)
const showDepartmentPicker = ref(false)
const submitting = ref(false)
const loading = ref(false)
const finished = ref(false)

const productInfo = ref(null)
const records = ref([])

const defectForm = reactive({
  defectType: '外观缺陷',
  defectDescription: '',
  defectLevel: '',
  quantity: '',
  images: [],
  responsibility: '',
  improvementMeasure: ''
})

const defectLevelColumns = [
  { text: '轻微缺陷', value: '轻微缺陷' },
  { text: '一般缺陷', value: '一般缺陷' },
  { text: '严重缺陷', value: '严重缺陷' },
  { text: '致命缺陷', value: '致命缺陷' }
]

const departmentColumns = [
  { text: '生产部', value: '生产部' },
  { text: '质量部', value: '质量部' },
  { text: '设备部', value: '设备部' },
  { text: '技术部', value: '技术部' },
  { text: '供应商', value: '供应商' }
]

const searchProduct = () => {
  if (!productSearch.value) {
    showToast('请输入产品信息')
    return
  }

  productInfo.value = {
    name: '发动机缸体',
    code: 'EA888-001',
    process: '机加工序'
  }

  showSuccessToast('产品识别成功')
}

const photoReport = () => {
  showToast('打开相机拍照')
}

const voiceReport = () => {
  showToast('开始录音')
}

const emergencyReport = () => {
  defectForm.defectLevel = '严重缺陷'
  showToast('已设置为紧急上报')
}

const getDefectColor = (level: string) => {
  switch (level) {
    case '致命缺陷': return '#ee0a24'
    case '严重缺陷': return '#ff6034'
    case '一般缺陷': return '#ff976a'
    case '轻微缺陷': return '#ffd21e'
    default: return '#1989fa'
  }
}

const getDefectTagType = (level: string) => {
  switch (level) {
    case '致命缺陷': return 'danger'
    case '严重缺陷': return 'warning'
    case '一般缺陷': return 'primary'
    case '轻微缺陷': return 'success'
    default: return ''
  }
}

const onDefectLevelConfirm = ({ selectedOptions }: any) => {
  defectForm.defectLevel = selectedOptions[0].text
  showDefectLevelPicker.value = false
}

const onDepartmentConfirm = ({ selectedOptions }: any) => {
  defectForm.responsibility = selectedOptions[0].text
  showDepartmentPicker.value = false
}

const submitReport = async () => {
  if (!defectForm.defectDescription) {
    showToast('请输入缺陷描述')
    return
  }

  if (!defectForm.defectLevel) {
    showToast('请选择缺陷等级')
    return
  }

  submitting.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 1500))

    const record = {
      id: Date.now(),
      productName: productInfo.value.name,
      defectType: defectForm.defectType,
      defectLevel: defectForm.defectLevel,
      time: new Date().toLocaleTimeString()
    }

    records.value.unshift(record)

    Object.assign(defectForm, {
      defectDescription: '',
      defectLevel: '',
      quantity: '',
      images: [],
      responsibility: '',
      improvementMeasure: ''
    })

    showSuccessToast('缺陷报告提交成功')
  } catch (error) {
    showToast('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

const viewRecord = (record: any) => {
  showToast(`查看记录: ${record.productName}`)
}

const loadRecords = async () => {
  loading.value = true

  await new Promise(resolve => setTimeout(resolve, 1000))

  if (records.value.length === 0) {
    const mockRecords = [
      {
        id: 1,
        productName: '变速箱壳体',
        defectType: '外观缺陷',
        defectLevel: '一般缺陷',
        time: '15:30:15'
      },
      {
        id: 2,
        productName: '发动机活塞',
        defectType: '尺寸缺陷',
        defectLevel: '轻微缺陷',
        time: '10:20:45'
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
.defect-report {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px;
}

.mobile-content {
  padding: 16px;
}

.product-section,
.defect-form,
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