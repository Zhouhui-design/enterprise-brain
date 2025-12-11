<template>
  <el-dialog
    v-model="visible"
    title="BOM详情"
    width="90%"
    top="5vh"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="bom-detail-container">
      <!-- 产品信息 -->
      <el-descriptions :column="4" border style="margin-bottom: 20px;">
        <el-descriptions-item label="生产产品编号">{{ productCode }}</el-descriptions-item>
        <el-descriptions-item label="生产产品名称">{{ productName }}</el-descriptions-item>
        <el-descriptions-item label="层阶地址">{{ hierarchyAddress }}</el-descriptions-item>
        <el-descriptions-item label="计划排程数量">
          <span style="color: #409EFF; font-weight: bold;">{{ scheduleQuantity }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 子件列表 -->
      <EnhancedTable
        :data="tableData"
        :columns="columns"
        :loading="loading"
        :show-selection="false"
        :show-index="true"
        :show-filter="true"
        :show-pagination="true"
        :total="tableData.length"
        :height="500"
        stripe
        border
      />
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" @click="handleExport">导出</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import EnhancedTable from '@/components/common/EnhancedTable.vue'
import listStyleBomApi from '@/api/listStyleProductionBom'
import * as XLSX from 'xlsx'

const visible = ref(false)
const loading = ref(false)
const tableData = ref([])
const productCode = ref('')
const productName = ref('')
const hierarchyAddress = ref('')
const scheduleQuantity = ref(0)  // ✅ 存储工序计划的计划排程数量

// ✅ 子件表格列配置
const columns = ref([
  { prop: 'child_sequence', label: '子件序号', width: 100, sortable: true, filterable: true },
  { prop: 'child_code', label: '子件编号', width: 140, sortable: true, filterable: true },
  { prop: 'child_name', label: '子件名称', width: 180, sortable: true, filterable: true },
  { prop: 'output_process', label: '产出工序', width: 120, sortable: true, filterable: true },
  { prop: 'component_source', label: '子件来源', width: 120, sortable: true, filterable: true },
  { prop: 'standard_usage', label: '标准用量', width: 120, align: 'right', sortable: true },
  { prop: 'required_quantity', label: '需领用数量', width: 120, align: 'right', sortable: true }  // ✅ 新增：需领用数量
])

// ✅ 打开弹窗 - 从后端API加载BOM子件
const open = async (processPlan) => {
  visible.value = true
  loading.value = true
  
  // 尝试多种可能的字段名获取产品编号
  productCode.value = processPlan.productCode || processPlan.生产产品编号 || processPlan.parent_code || ''
  productName.value = processPlan.productName || processPlan.生产产品名称 || processPlan.parent_name || ''
  hierarchyAddress.value = processPlan.hierarchyAddress || processPlan.层阶地址 || '0'
  
  // ✅ 获取工序计划的计划排程数量
  scheduleQuantity.value = parseFloat(processPlan.scheduleQuantity || processPlan.计划排程数量 || 0)
  
  console.log(`🔍 打开BOM详情弹窗，工序计划数据:`, processPlan)
  console.log(`🔍 提取的产品编号: ${productCode.value}`)
  console.log(`🔍 计划排程数量: ${scheduleQuantity.value}`)
  
  if (!productCode.value) {
    ElMessage.error('无法获取产品编号，请检查工序计划数据')
    tableData.value = []
    loading.value = false
    return
  }
  
  try {
    // ✅ 从后端API查询BOM子件数据 - 根据产品编号查找对应的BOM子件
    console.log(`🔍 查询参数 - 父件编号: ${productCode.value}`)
    const response = await listStyleBomApi.getChildrenByParentCode(productCode.value)
    console.log('📊 API响应:', response)
    
    let children = []
    if (response && response.code === 200) {
      children = response.data || []
    } else if (Array.isArray(response)) {
      children = response
    }
    
    if (!children || children.length === 0) {
      ElMessage.warning(`未找到父件编号为 "${productCode.value}" 的BOM子件数据`)
      console.log(`⚠️ 未找到产品编号 ${productCode.value} 对应的BOM子件`)
      tableData.value = []
      return
    }
    
    console.log(`✅ 找到 ${children.length} 个BOM子件:`, children)
    
    // ✅ 计算需领用数量：需领用数量 = 计划排程数量 × 标准用量
    tableData.value = children.map(child => ({
      ...child,
      required_quantity: (scheduleQuantity.value * parseFloat(child.standard_usage || 0)).toFixed(4)
    }))
    
    console.log(`✅ 已计算需领用数量，计划排程数量: ${scheduleQuantity.value}`)
    
  } catch (error) {
    console.error('加载BOM详情失败:', error)
    console.error('错误详情:', error.response?.data || error.message)
    
    // 如果是400错误，说明参数有问题
    if (error.response?.status === 400) {
      ElMessage.error(`参数错误: ${error.response.data.message || '请检查产品编号'}`)
    } else {
      ElMessage.error('加载BOM详情失败: ' + (error.message || '网络错误'))
    }
    
    tableData.value = []
  } finally {
    loading.value = false
  }
}

// 导出
const handleExport = () => {
  const exportData = tableData.value.map((row, index) => ({
    '序号': index + 1,
    '子件序号': row.child_sequence,
    '子件编号': row.child_code,
    '子件名称': row.child_name,
    '产出工序': row.output_process,
    '子件来源': row.component_source,
    '标准用量': row.standard_usage,
    '需领用数量': row.required_quantity  // ✅ 导出时包含需领用数量
  }))
  
  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'BOM详情')
  XLSX.writeFile(workbook, `BOM详情_${productCode.value}_${new Date().getTime()}.xlsx`)
  
  ElMessage.success('导出成功')
}

defineExpose({
  open
})
</script>

<style scoped lang="scss">
.bom-detail-container {
  padding: 10px;
}
</style>
