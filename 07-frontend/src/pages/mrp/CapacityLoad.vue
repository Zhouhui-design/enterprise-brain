<template>
  <div class="capacity-load-container">
    <h2>工序能力负荷表</h2>
    
    <!-- 搜索栏 -->
    <el-card shadow="never" style="margin-bottom: 20px;">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="工序名称">
          <el-input v-model="searchForm.processName" placeholder="请输入工序名称" clearable style="width: 180px;" />
        </el-form-item>
        <el-form-item label="筛选条件">
          <el-select v-model="searchForm.processNameOperator" placeholder="选择条件" style="width: 100px;">
            <el-option label="包含" value="contains" />
            <el-option label="等于" value="equals" />
            <el-option label="不等于" value="notEquals" />
            <el-option label="开头是" value="startsWith" />
            <el-option label="结尾是" value="endsWith" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 工具栏 -->
    <div class="toolbar" style="margin: 20px 0;">
      <el-button type="success" @click="handleResetWorkShift">重置上班时段</el-button>
      <el-button type="warning" @click="handleResetRemainingHours">重置剩余工时</el-button>
      <el-button type="danger" @click="handleResetOccupiedHours">重置占用工时</el-button>
      <el-button type="info" @click="handleExport">导出</el-button>
      <el-button type="primary" @click="settingsVisible = true" class="page-settings-trigger">
        <el-icon><Setting /></el-icon>
        页面设置
      </el-button>
      <el-tag v-if="total > 0" type="info" style="margin-left: 10px;">
        共 {{ total }} 条记录
      </el-tag>
    </div>

    <!-- 主表格 - 使用EnhancedTable -->
    <EnhancedTable
      :data="tableData"
      :columns="visibleColumns"
      :loading="loading"
      :show-selection="false"
      :show-toolbar="false"
      :show-filter="false"
      :show-column-settings="true"
      :height="600"
      @refresh="loadData"
    >
      <!-- 加班时段列自定义 -->
      <template #column-overtimeShift="{ row }">
        <el-input
          v-model="row.overtimeShift"
          placeholder="请输入加班时段"
          size="small"
          @blur="handleUpdateRow(row)"
        />
      </template>
      
      <!-- 操作列 -->
      <template #column-actions="{ row }">
        <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
      </template>
    </EnhancedTable>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[20, 50, 100, 200]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadData"
      @current-change="loadData"
      style="margin-top: 20px; justify-content: center;"
    />

    <!-- 页面设置对话框 -->
    <el-dialog
      v-model="settingsVisible"
      title="页面设置"
      width="500px"
    >
      <el-form :model="settings" label-width="120px">
        <el-form-item label="显示天数">
          <el-input-number
            v-model="settings.displayDays"
            :min="1"
            :max="365"
            :precision="0"
            style="width: 100%;"
          />
          <div style="font-size: 12px; color: #999; margin-top: 5px;">
            设置工序能力负荷表显示未来多少天的数据（1-365天）
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="settingsVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveSettings">保存</el-button>
      </template>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑工序能力"
      width="600px"
    >
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="工序名称">
          <el-input v-model="editForm.processName" disabled />
        </el-form-item>
        <el-form-item label="日期">
          <el-input :value="formatDate(editForm.date)" disabled />
        </el-form-item>
        <el-form-item label="可用工位数量">
          <el-input-number v-model="editForm.availableWorkstations" disabled style="width: 100%;" />
        </el-form-item>
        <el-form-item label="上班时段">
          <el-input v-model="editForm.workShift" disabled />
          <div style="font-size: 12px; color: #999; margin-top: 4px;">✅ 此字段自动从Lookup企业日历获取，不可手动编辑</div>
        </el-form-item>
        <el-form-item label="已占用工时">
          <el-input-number v-model="editForm.occupiedHours" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="剩余工时">
          <el-input-number v-model="editForm.remainingHours" :min="0" :precision="2" style="width: 100%;" disabled />
          <div style="font-size: 12px; color: #999; margin-top: 4px;">自动计算：(上班时段 × 可用工位数量) - 已占用工时</div>
        </el-form-item>
        <el-form-item label="剩余时段">
          <el-input v-model="editForm.remainingShift" disabled />
          <div style="font-size: 12px; color: #999; margin-top: 4px;">自动计算：剩余工时 ÷ 可用工位数量</div>
        </el-form-item>
        <el-form-item label="加班时段">
          <el-input v-model="editForm.overtimeShift" placeholder="例如：18:00-20:00" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'
import EnhancedTable from '@/components/common/EnhancedTable.vue'

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(50)
const total = ref(0)
const loading = ref(false)
const settingsVisible = ref(false)
const editDialogVisible = ref(false)

const searchForm = ref({
  processName: '',
  processNameOperator: 'contains',  // 默认为包含
  dateRange: null
})

const settings = ref({
  displayDays: 120
})

const editForm = ref({
  id: null,
  processName: '',
  date: '',
  availableWorkstations: 0,
  workShift: '',
  occupiedHours: 0,
  remainingShift: '',
  remainingHours: 0,
  overtimeShift: ''
})

// 列定义配置
const columns = ref([
  {
    prop: 'processName',
    label: '工序名称',
    width: 150,
    fixed: 'left',
    sortable: true,
    filterable: true,
    filterType: 'input',
    visible: true
  },
  {
    prop: 'date',
    label: '日期',
    width: 120,
    sortable: true,
    filterable: true,
    filterType: 'date',
    visible: true,
    formatter: (row) => formatDate(row.date)
  },
  {
    prop: 'availableWorkstations',
    label: '可用工位数量',
    width: 130,
    align: 'center',
    sortable: true,
    filterable: true,
    filterType: 'number',
    visible: true
  },
  {
    prop: 'workShift',
    label: '上班时段',
    width: 120,
    align: 'center',
    sortable: true,
    filterable: true,
    filterType: 'input',
    visible: true,
    formatter: (row) => row.workShift || '-'
  },
  {
    prop: 'occupiedHours',
    label: '已占用工时',
    width: 120,
    align: 'center',
    sortable: true,
    filterable: true,
    filterType: 'number',
    visible: true,
    formatter: (row) => row.occupiedHours || '0.00'
  },
  {
    prop: 'remainingShift',
    label: '剩余时段',
    width: 120,
    align: 'center',
    sortable: true,
    filterable: true,
    filterType: 'input',
    visible: true,
    formatter: (row) => row.remainingShift || '-'
  },
  {
    prop: 'remainingHours',
    label: '剩余工时',
    width: 120,
    align: 'center',
    sortable: true,
    filterable: true,
    filterType: 'number',
    visible: true,
    formatter: (row) => row.remainingHours || '0.00'
  },
  {
    prop: 'overtimeShift',
    label: '加班时段',
    width: 200,
    filterable: true,
    filterType: 'input',
    visible: true
  },
  {
    prop: 'actions',
    label: '操作',
    width: 100,
    fixed: 'right',
    visible: true
  }
])

// 计算可见列
const visibleColumns = computed(() => {
  return columns.value.filter(col => col.visible !== false)
})

// 自动计算剩余工时：(上班时段 × 可用工位数量) - 已占用工时
const calculateRemainingHours = () => {
  const workShift = parseFloat(editForm.value.workShift) || 0
  const availableWorkstations = editForm.value.availableWorkstations || 0
  const occupiedHours = editForm.value.occupiedHours || 0
  
  editForm.value.remainingHours = parseFloat(
    (workShift * availableWorkstations - occupiedHours).toFixed(2)
  )
}

// 自动计算剩余时段：剩余工时 ÷ 可用工位数量
const calculateRemainingShift = () => {
  const remainingHours = editForm.value.remainingHours || 0
  const availableWorkstations = editForm.value.availableWorkstations || 0
  
  if (availableWorkstations > 0) {
    editForm.value.remainingShift = parseFloat(
      (remainingHours / availableWorkstations).toFixed(2)
    ).toString()
  } else {
    editForm.value.remainingShift = '0.00'
  }
}

// 监听上班时段、可用工位数量、已占用工时的变化，自动计算剩余工时
watch(
  () => [editForm.value.workShift, editForm.value.availableWorkstations, editForm.value.occupiedHours],
  () => {
    calculateRemainingHours()
  },
  { deep: true }
)

// 监听剩余工时的变化，自动计算剩余时段
watch(
  () => editForm.value.remainingHours,
  () => {
    calculateRemainingShift()
  }
)

// 格式化日期 - 统一格式为 YYYY/MM/D
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}/${month}/${day}`
}

// 加载数据
const loadData = async () => {
  try {
    loading.value = true
    console.log('📊 [CapacityLoad] 开始加载数据...')
    
    // 构建查询参数
    const params = new URLSearchParams({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    
    if (searchForm.value.processName) {
      params.append('processName', searchForm.value.processName)
      params.append('processNameOperator', searchForm.value.processNameOperator)
    }
    
    if (searchForm.value.dateRange && searchForm.value.dateRange.length === 2) {
      params.append('startDate', searchForm.value.dateRange[0])
      params.append('endDate', searchForm.value.dateRange[1])
    }
    
    console.log('📋 [CapacityLoad] 请求参数:', params.toString())
    
    const response = await fetch(
      `http://192.168.2.229:3005/api/capacity-load/list?${params.toString()}`
    )
    const result = await response.json()
    
    console.log('📦 [CapacityLoad] API响应:', result)
    
    if (result.code === 200) {
      console.log('✅ [CapacityLoad] 数据获取成功，总数:', result.data.total, '返回:', result.data.records.length)
      
      // ✅ 步骤1: 转换字段名
      const records = result.data.records.map(item => ({
        id: item.id,
        processName: item.process_name,
        date: item.date,
        availableWorkstations: item.available_workstations,
        workShift: item.work_shift,  // 先保留原值
        occupiedHours: item.occupied_hours,
        remainingShift: item.remaining_shift,
        remainingHours: item.remaining_hours,
        overtimeShift: item.overtime_shift
      }))
      
      console.log('🔄 [CapacityLoad] 字段映射完成，记录数:', records.length)
      console.log('📝 [CapacityLoad] 第一条记录:', records[0])
      
      // ✅ 步骤2: 通过lookup企业日历自动填充上班时段
      await syncWorkShiftFromCalendar(records)
      
      console.log('💾 [CapacityLoad] 设置tableData，长度:', records.length)
      tableData.value = records
      total.value = result.data.total
      
      console.log('✅ [CapacityLoad] 数据加载完成，tableData.value长度:', tableData.value.length)
    } else {
      console.error('❌ [CapacityLoad] API返回错误:', result.message)
      ElMessage.error(result.message || '加载数据失败')
    }
  } catch (error) {
    console.error('❌ [CapacityLoad] 加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
    console.log('🏁 [CapacityLoad] 加载流程结束')
  }
}

// ✅ Lookup规则: 从企业日历同步上班时段
const syncWorkShiftFromCalendar = async (records) => {
  try {
    console.log('📅 开始从企业日历同步上班时段...')
    
    // 收集所有唯一日期
    const uniqueDates = [...new Set(records.map(r => r.date))]
    
    if (uniqueDates.length === 0) return
    
    // 批量查询企业日历
    const calendarResponse = await fetch(
      `http://192.168.2.229:3005/api/company-calendar/batch-query`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates: uniqueDates })
      }
    )
    
    const calendarResult = await calendarResponse.json()
    
    if (calendarResult.code === 200 && calendarResult.data) {
      // ✅ 创建日期到标准上班时长的映射
      // ⚠️ 重要: 企业日历的actual_date(真日期) = calendar_date + 1天
      // 工序能力负荷表的date应该对应actual_date,不是calendar_date
      const dateToHoursMap = {}
      calendarResult.data.forEach(item => {
        // ✅ 使用actual_date(真日期)进行匹配
        let dateKey
        if (item.actual_date) {
          dateKey = item.actual_date instanceof Date ? 
            item.actual_date.toISOString().split('T')[0] : 
            String(item.actual_date).split('T')[0]
        } else {
          // 如果没有actual_date,使用calendar_date+1天
          const calDate = item.calendar_date instanceof Date ? 
            item.calendar_date : new Date(item.calendar_date)
          const actualDate = new Date(calDate)
          actualDate.setDate(actualDate.getDate() + 1)
          dateKey = `${actualDate.getFullYear()}-${String(actualDate.getMonth() + 1).padStart(2, '0')}-${String(actualDate.getDate()).padStart(2, '0')}`
        }
        
        // 只同步上班日的标准上班时长
        if (item.is_workday === 1 && item.standard_work_hours > 0) {
          dateToHoursMap[dateKey] = parseFloat(item.standard_work_hours).toFixed(2)
        }
        
        console.log(`  企业日历: calendar_date=${String(item.calendar_date).split('T')[0]} → actual_date=${dateKey}, is_workday=${item.is_workday}`)
      })
      
      // ✅ Lookup: 为每条记录匹配标准上班时长
      records.forEach(record => {
        // 确保记录的日期格式也是 YYYY-MM-DD
        const recordDate = record.date instanceof Date ? 
          record.date.toISOString().split('T')[0] : 
          String(record.date)
        
        const matchedHours = dateToHoursMap[recordDate]
        record.workShift = matchedHours || null  // 匹配失败则为null
        
        console.log(`  ${recordDate}: ${matchedHours ? matchedHours + '小时' : '休息日/无数据'}`)
      })
      
      console.log(`✅ 同步完成，共处理 ${records.length} 条记录`)
    }
  } catch (error) {
    console.error('从企业日历同步上班时段失败:', error)
    // 不阻塞主流程，继续使用原有数据
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.value = {
    processName: '',
    dateRange: null
  }
  currentPage.value = 1
  loadData()
}

// 加载设置
const loadSettings = async () => {
  try {
    const response = await fetch('http://192.168.2.229:3005/api/capacity-load/settings/capacity-load')
    const result = await response.json()
    
    if (result.code === 200 && result.data.displayDays) {
      settings.value.displayDays = parseInt(result.data.displayDays)
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

// 保存设置
const handleSaveSettings = async () => {
  try {
    const response = await fetch('http://192.168.2.229:3005/api/capacity-load/settings/capacity-load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings.value)
    })
    
    const result = await response.json()
    
    if (result.code === 200) {
      ElMessage.success('保存成功')
      settingsVisible.value = false
    } else {
      ElMessage.error(result.message || '保存失败')
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存失败')
  }
}

// 编辑行
const handleEdit = (row) => {
  editForm.value = { ...row }
  editDialogVisible.value = true
}

// 更新单行（加班时段实时更新）
const handleUpdateRow = async (row) => {
  try {
    const response = await fetch(`http://192.168.2.229:3005/api/capacity-load/update/${row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        overtimeShift: row.overtimeShift
      })
    })
    
    const result = await response.json()
    
    if (result.code === 200) {
      ElMessage.success('更新成功')
    }
  } catch (error) {
    console.error('更新失败:', error)
  }
}

// 保存编辑
const handleSaveEdit = async () => {
  try {
    const response = await fetch(`http://192.168.2.229:3005/api/capacity-load/update/${editForm.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        work_shift: editForm.value.workShift,
        occupied_hours: editForm.value.occupiedHours,
        remaining_shift: editForm.value.remainingShift,
        remaining_hours: editForm.value.remainingHours,
        overtime_shift: editForm.value.overtimeShift
      })
    })
    
    const result = await response.json()
    
    if (result.code === 200) {
      ElMessage.success('保存成功')
      editDialogVisible.value = false
      await loadData()
    } else {
      ElMessage.error(result.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

// 重置上班时段
const handleResetWorkShift = async () => {
  try {
    // 确认对话框
    await ElMessageBox.confirm(
      '将根据企业日历的“标准上班时长”重新计算所有工序的“上班时段”，确定继续吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    
    // 调用后端API
    const response = await fetch('http://192.168.2.229:3005/api/capacity-load/reset-work-shift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    const result = await response.json()
    
    if (result.code === 200) {
      ElMessage.success(result.message || `重置成功，共更新 ${result.data.updatedCount} 条记录`)
      await loadData()  // 刷新表格
    } else {
      ElMessage.error(result.message || '重置失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置上班时段失败:', error)
      ElMessage.error('重置失败')
    }
  } finally {
    loading.value = false
  }
}

// 重置剩余工时
const handleResetRemainingHours = async () => {
  try {
    // 确认对话框
    await ElMessageBox.confirm(
      '将根据公式重新计算所有工序的“剩余工时”和“剩余时段”，确定继续吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    
    // 调用后端API
    const response = await fetch('http://192.168.2.229:3005/api/capacity-load/reset-remaining-hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    const result = await response.json()
    
    if (result.code === 200) {
      ElMessage.success(result.message || `重置成功，共更新 ${result.data.updatedCount} 条记录`)
      await loadData()  // 刷新表格
    } else {
      ElMessage.error(result.message || '重置失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置剩余工时失败:', error)
      ElMessage.error('重置失败')
    }
  } finally {
    loading.value = false
  }
}

// ✅ 重置占用工时（新增）
const handleResetOccupiedHours = async () => {
  try {
    // 确认对话框
    await ElMessageBox.confirm(
      '将根据SUMIF公式重新计算所有工序的“已占用工时”，此操作用于修复数据不一致的问题，确定继续吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    console.log('🔄 [重置占用工时] 开始执行...')
    console.log('📡 [重置占用工时] 调用API: POST /api/capacity-load/reset-all-occupied-hours')
    
    // 调用后端API
    const response = await fetch('http://192.168.2.229:3005/api/capacity-load/reset-all-occupied-hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    console.log('📡 [重置占用工时] API响应状态:', response.status)
    
    const result = await response.json()
    console.log('📡 [重置占用工时] API响应数据:', result)
    
    if (result.code === 200) {
      console.log('✅ [重置占用工时] 成功!', result.data)
      console.log(`   总记录数: ${result.data.totalRecords}`)
      console.log(`   更新记录数: ${result.data.updatedCount}`)
      console.log(`   释放总工时: ${result.data.totalReleasedHours}小时`)
      
      ElMessage.success(result.message || `重置成功！总计${result.data.totalRecords}条记录，更新${result.data.updatedCount}条，释放${result.data.totalReleasedHours}小时`)
      
      console.log('🔄 [重置占用工时] 开始刷新表格数据...')
      await loadData()  // 刷新表格
      console.log('✅ [重置占用工时] 表格数据刷新完成')
    } else {
      console.error('❌ [重置占用工时] 失败:', result.message)
      ElMessage.error(result.message || '重置失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ [重置占用工时] 异常:', error)
      ElMessage.error('重置失败')
    } else {
      console.log('⚠️ [重置占用工时] 用户取消')
    }
  } finally {
    loading.value = false
    console.log('🏁 [重置占用工时] 执行结束')
  }
}

// 导出
const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

onMounted(() => {
  loadData()
  loadSettings()
})
</script>

<style scoped>
.capacity-load-container {
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
  color: #333;
}

.toolbar {
  display: flex;
  gap: 10px;
}
</style>
