<template>
  <div class="report-builder">
    <el-dialog
      v-model="visible"
      title="报表构建器"
      width="80%"
      :close-on-click-modal="false"
    >
      <el-form :model="reportForm" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报表名称" required>
              <el-input v-model="reportForm.reportName" placeholder="请输入报表名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报表编码" required>
              <el-input v-model="reportForm.reportCode" placeholder="请输入报表编码" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报表类型" required>
              <el-select v-model="reportForm.reportType" placeholder="请选择报表类型">
                <el-option label="表格" value="table" />
                <el-option label="图表" value="chart" />
                <el-option label="仪表板" value="dashboard" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据源">
              <el-select v-model="reportForm.dataSource" placeholder="请选择数据源">
                <el-option label="默认数据源" value="default" />
                <el-option label="销售数据源" value="sales" />
                <el-option label="库存数据源" value="inventory" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="查询SQL">
          <el-input
            v-model="reportForm.querySql"
            type="textarea"
            :rows="6"
            placeholder="请输入SQL查询语句"
          />
        </el-form-item>

        <el-form-item label="图表配置" v-if="reportForm.reportType === 'chart'">
          <el-input
            v-model="reportForm.chartConfig"
            type="textarea"
            :rows="4"
            placeholder='{"type":"line","xAxis":"date","yAxis":"amount"}'
          />
        </el-form-item>

        <el-form-item label="筛选配置">
          <el-input
            v-model="reportForm.filterConfig"
            type="textarea"
            :rows="4"
            placeholder='[{"name":"日期","type":"date"},{"name":"状态","type":"select"}]'
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否公开">
              <el-switch v-model="reportForm.isPublic" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="刷新间隔(分钟)">
              <el-input-number v-model="reportForm.refreshInterval" :min="0" :max="1440" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  reportData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const visible = ref(props.modelValue)

const reportForm = reactive({
  reportName: '',
  reportCode: '',
  reportType: 'table',
  dataSource: 'default',
  querySql: '',
  chartConfig: '',
  filterConfig: '',
  isPublic: false,
  refreshInterval: 0
})

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(() => props.reportData, (val) => {
  if (val) {
    Object.assign(reportForm, val)
  }
}, { immediate: true, deep: true })

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleClose = () => {
  visible.value = false
}

const handleSave = () => {
  if (!reportForm.reportName || !reportForm.reportCode) {
    ElMessage.warning('请填写必填项')
    return
  }

  const formData = {
    ...reportForm,
    isPublic: reportForm.isPublic ? 1 : 0
  }

  emit('save', formData)
  handleClose()
}
</script>

<style scoped lang="scss">
.report-builder {
  :deep(.el-dialog__body) {
    padding: 20px 30px;
  }
}
</style>
