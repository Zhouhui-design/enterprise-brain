<template>
  <div class="company-calendar-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2 class="page-title">企业日历</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleInitData">初始化日历数据</el-button>
        <el-button @click.stop="settingsVisible = true" circle class="page-settings-trigger">
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 搜索表单 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <EnhancedTable
        :data="tableData"
        :columns="visibleColumns"
        :loading="loading"
        :show-selection="false"
        :show-filter="false"
        :show-pagination="true"
        :total="total"
        :current-page="currentPage"
        :page-size="pageSize"
        @page-change="handlePageChange"
      >
        <!-- 操作列 -->
        <template #operation="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
        </template>
      </EnhancedTable>
    </el-card>

    <!-- 页面设置对话框 -->
    <PageSettings
      v-model="settingsVisible"
      settings-key="company-calendar"
      :available-fields="columns"
      :show-workflow="true"
      :show-encoding="true"
      :show-fields="true"
      :show-print="true"
      :show-export="true"
      :show-business-vars="true"
      @save="handleSettingsSave"
    >
      <!-- 企业日历专属的业务变量 -->
      <template #business-vars="{ settings }">
        <el-form label-width="160px">
          <!-- 显示日期范围 -->
          <el-form-item label="显示日期">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="white-space: nowrap;">系统当天日期前</span>
              <el-input-number
                v-model="businessVars.daysBeforeToday"
                :min="0"
                :max="365"
                style="width: 120px;"
              />
              <span>天，系统当天日期后</span>
              <el-input-number
                v-model="businessVars.daysAfterToday"
                :min="1"
                :max="730"
                style="width: 120px;"
              />
              <span>天</span>
            </div>
          </el-form-item>
          <el-alert
            title="显示日期：主表格显示系统当天+未来N天的日期，历史日期支持查询筛选"
            type="info"
            :closable="false"
            style="margin: 10px 0;"
          />

          <el-divider />

          <!-- 单休/双休 -->
          <el-form-item label="休息模式">
            <el-radio-group v-model="businessVars.weekendMode">
              <el-radio label="single">单休（周日）</el-radio>
              <el-radio label="double">双休（周六、周日）</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-alert
            title="休息模式：单休=每周日休息，双休=每周六和周日休息"
            type="info"
            :closable="false"
            style="margin: 10px 0;"
          />

          <el-divider />

          <!-- 标准上班时长 -->
          <el-form-item label="标准上班时长">
            <el-input-number
              v-model="businessVars.standardWorkHours"
              :min="1"
              :max="24"
              :precision="1"
              style="width: 200px;"
            />
            <span style="margin-left: 10px;">小时</span>
          </el-form-item>
          <el-alert
            title="标准上班时长：用于产能计算、排程等业务场景"
            type="info"
            :closable="false"
            style="margin: 10px 0;"
          />

          <el-divider />

          <!-- 自定义节日 -->
          <el-form-item label="自定义节日">
            <el-button type="primary" size="small" @click="showHolidayDialog = true">
              管理节日
            </el-button>
            <span style="margin-left: 10px; color: #909399;">
              已配置 {{ customHolidays.length }} 个节日
            </span>
          </el-form-item>
          <el-alert
            title="自定义节日：设置企业成立纪念日、团建日等特殊日子"
            type="info"
            :closable="false"
            style="margin: 10px 0;"
          />
        </el-form>
      </template>
    </PageSettings>

    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑日历" width="600px">
      <el-form :model="editForm" label-width="140px">
        <el-form-item label="日期">
          <el-input :model-value="editForm.calendarDate" disabled />
        </el-form-item>
        <el-form-item label="星期">
          <el-input :model-value="editForm.weekday" disabled />
        </el-form-item>
        <el-form-item label="休息/上班">
          <el-tag :type="editForm.isWorkday ? 'success' : 'info'">
            {{ editForm.isWorkday ? '上班' : '休息' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="标准上班时长">
          <span>{{ editForm.standardWorkHours }}小时</span>
        </el-form-item>
        <el-form-item label="是否调整工时">
          <el-switch v-model="editForm.isAdjusted" />
        </el-form-item>
        <el-form-item label="调整后工时" v-if="editForm.isAdjusted">
          <el-input-number
            v-model="editForm.adjustedWorkHours"
            :min="0"
            :max="24"
            :precision="1"
            style="width: 200px;"
          />
          <span style="margin-left: 10px;">小时</span>
        </el-form-item>
        <el-form-item label="节假日">
          <el-input :model-value="editForm.holidayName || '-'" disabled />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="editForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 自定义节日管理对话框 -->
    <el-dialog v-model="showHolidayDialog" title="自定义节日管理" width="700px">
      <div style="margin-bottom: 15px;">
        <el-button type="primary" size="small" @click="handleAddHoliday">添加节日</el-button>
      </div>
      
      <el-table :data="customHolidays" border style="width: 100%;">
        <el-table-column label="节日名称" prop="name" width="150" />
        <el-table-column label="日历类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.dateType === 'solar' ? 'success' : 'warning'" size="small">
              {{ row.dateType === 'solar' ? '阳历' : '阴历' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="日期" width="120">
          <template #default="{ row }">
            {{ row.month }}月{{ row.day }}日
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" show-overflow-tooltip />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row, $index }">
            <el-button link type="primary" size="small" @click="handleEditHoliday(row, $index)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDeleteHoliday($index)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="showHolidayDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 节日编辑对话框 -->
    <el-dialog v-model="showHolidayEditDialog" :title="holidayEditMode === 'add' ? '添加节日' : '编辑节日'" width="500px">
      <el-form :model="holidayForm" label-width="100px">
        <el-form-item label="节日名称">
          <el-input v-model="holidayForm.name" placeholder="如：公司成立纪念日" />
        </el-form-item>
        <el-form-item label="日历类型">
          <el-radio-group v-model="holidayForm.dateType">
            <el-radio label="solar">阳历</el-radio>
            <el-radio label="lunar">阴历</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="月份">
          <el-input-number v-model="holidayForm.month" :min="1" :max="12" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="日期">
          <el-input-number v-model="holidayForm.day" :min="1" :max="31" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="holidayForm.remark" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showHolidayEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveHoliday">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'
import EnhancedTable from '@/components/common/EnhancedTable.vue'
import PageSettings from '@/components/common/PageSettings.vue'
import request from '@/utils/request'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)
const editDialogVisible = ref(false)
const settingsVisible = ref(false)

const searchForm = ref({
  dateRange: null
})

const editForm = ref({
  id: null,
  calendarDate: '',
  weekday: '',
  isWorkday: 1,
  standardWorkHours: 8,
  adjustedWorkHours: null,
  isAdjusted: false,
  holidayName: '',
  remark: ''
})

// 业务变量
const businessVars = ref({
  daysBeforeToday: 90,      // 系统当天日期前显示天数（用于查询）
  daysAfterToday: 365,       // 系统当天日期后显示天数
  weekendMode: 'double',     // 休息模式：single=单休, double=双休
  standardWorkHours: 8       // 标准上班时长（小时）
})

// 自定义节日
const customHolidays = ref([])
const showHolidayDialog = ref(false)
const showHolidayEditDialog = ref(false)
const holidayEditMode = ref('add')  // 'add' or 'edit'
const holidayEditIndex = ref(-1)

const holidayForm = ref({
  name: '',
  dateType: 'solar',  // 'solar'=阳历, 'lunar'=阴历
  month: 1,
  day: 1,
  remark: ''
})

// 列定义
const columns = ref([
  {
    prop: 'calendarDate',
    label: '日期',
    width: 120,
    sortable: true,
    filterable: true,
    fixed: 'left',
    visible: true,
    formatter: (row) => {
      // 修复日期格式，只显示日期部分
      if (!row.calendarDate) return '-'
      const date = new Date(row.calendarDate)
      return date.toISOString().split('T')[0]
    }
  },
  {
    prop: 'actualDate',
    label: '真日期',
    width: 120,
    sortable: true,
    filterable: true,
    visible: true,
    formatter: (row) => {
      if (!row.actualDate) return '-'
      const date = new Date(row.actualDate)
      return date.toISOString().split('T')[0]
    }
  },
  {
    prop: 'weekday',
    label: '星期',
    width: 100,
    align: 'center',
    filterable: true,
    visible: true
  },
  {
    prop: 'isWorkday',
    label: '休息/上班',
    width: 100,
    align: 'center',
    visible: true,
    formatter: (row) => {
      return row.isWorkday ? '上班' : '休息'
    }
  },
  {
    prop: 'standardWorkHours',
    label: '标准上班时长',
    width: 130,
    align: 'center',
    visible: true,
    formatter: (row) => {
      return row.standardWorkHours ? `${row.standardWorkHours}小时` : '-'
    }
  },
  {
    prop: 'isAdjusted',
    label: '是否调整工时',
    width: 120,
    align: 'center',
    visible: true,
    formatter: (row) => {
      return row.isAdjusted ? '是' : '否'
    }
  },
  {
    prop: 'adjustedWorkHours',
    label: '调整后工时',
    width: 120,
    align: 'center',
    visible: true,
    formatter: (row) => {
      return row.adjustedWorkHours ? `${row.adjustedWorkHours}小时` : '-'
    }
  },
  {
    prop: 'holidayName',
    label: '节假日',
    width: 150,
    visible: true,
    formatter: (row) => {
      return row.holidayName || '-'
    }
  },
  {
    prop: 'remark',
    label: '备注',
    minWidth: 200,
    visible: true,
    showOverflowTooltip: true
  }
])

// ✅ 计算可见列（根据设置顺序和可见性）
const visibleColumns = computed(() => {
  // 首先过滤出可见的字段
  const visible = columns.value.filter(col => col.visible !== false)
  // 如果有字段顺序设置（从localStorage中的fields字段），则按顺序排列
  try {
    const settings = localStorage.getItem('company-calendar')
    if (settings) {
      const parsed = JSON.parse(settings)
      if (parsed.fields && Array.isArray(parsed.fields)) {
        // 按照保存的顺序重新排列
        const orderedCols = []
        parsed.fields.forEach(savedField => {
          const col = visible.find(c => c.prop === savedField.prop)
          if (col) {
            orderedCols.push(col)
          }
        })
        // 添加不在保存顺序中但可见的字段
        visible.forEach(col => {
          if (!orderedCols.find(c => c.prop === col.prop)) {
            orderedCols.push(col)
          }
        })
        return orderedCols
      }
    }
  } catch (error) {
    console.error('加载字段顺序失败:', error)
  }
  return visible
})

// 加载数据
const loadData = async () => {
  try {
    loading.value = true
    
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    if (searchForm.value.dateRange && searchForm.value.dateRange.length === 2) {
      params.startDate = searchForm.value.dateRange[0]
      params.endDate = searchForm.value.dateRange[1]
    }
    
    const result = await request.get('/company-calendar/list', params)
    
    tableData.value = result.records
    total.value = result.total
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 分页变化
const handlePageChange = ({ page, pageSize: size }) => {
  currentPage.value = page
  pageSize.value = size
  loadData()
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.value = {
    dateRange: null
  }
  currentPage.value = 1
  loadData()
}

// 初始化日历数据
const handleInitData = async (skipConfirm = false) => {
  try {
    // 如果不跳过确认，则显示确认对话框
    if (!skipConfirm) {
      await ElMessageBox.confirm(
        '将初始化企业日历数据，根据页面设置生成日期数据，是否继续？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    }
    
    loading.value = true
    
    // 直接调用后端API初始化
    await request.post('/company-calendar/init')
    
    ElMessage.success('初始化成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('初始化失败:', error)
      ElMessage.error('初始化失败')
    }
  } finally {
    loading.value = false
  }
}



// 编辑
const handleEdit = (row) => {
  editForm.value = {
    id: row.id,
    calendarDate: row.calendarDate,
    weekday: row.weekday,
    isWorkday: row.isWorkday,
    standardWorkHours: row.standardWorkHours,
    adjustedWorkHours: row.adjustedWorkHours,
    isAdjusted: row.isAdjusted,
    holidayName: row.holidayName,
    remark: row.remark
  }
  editDialogVisible.value = true
}

// 保存编辑
const handleSaveEdit = async () => {
  try {
    await request.put(`/company-calendar/update/${editForm.value.id}`, {
      adjustedWorkHours: editForm.value.adjustedWorkHours,
      isAdjusted: editForm.value.isAdjusted,
      remark: editForm.value.remark
    })
    
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

// 添加节日
const handleAddHoliday = () => {
  holidayEditMode.value = 'add'
  holidayForm.value = {
    name: '',
    dateType: 'solar',
    month: 1,
    day: 1,
    remark: ''
  }
  showHolidayEditDialog.value = true
}

// 编辑节日
const handleEditHoliday = (row, index) => {
  holidayEditMode.value = 'edit'
  holidayEditIndex.value = index
  holidayForm.value = { ...row }
  showHolidayEditDialog.value = true
}

// 保存节日
const handleSaveHoliday = () => {
  if (!holidayForm.value.name) {
    ElMessage.warning('请输入节日名称')
    return
  }
  
  if (holidayEditMode.value === 'add') {
    customHolidays.value.push({ ...holidayForm.value })
    ElMessage.success('添加成功')
  } else {
    customHolidays.value[holidayEditIndex.value] = { ...holidayForm.value }
    ElMessage.success('修改成功')
  }
  
  showHolidayEditDialog.value = false
  
  // 自动保存到后端
  saveCustomHolidays()
}

// 删除节日
const handleDeleteHoliday = async (index) => {
  try {
    await ElMessageBox.confirm('确定要删除这个节日吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    customHolidays.value.splice(index, 1)
    ElMessage.success('删除成功')
    
    // 自动保存到后端
    saveCustomHolidays()
  } catch (error) {
    // 用户取消
  }
}

// 保存自定义节日到后端
const saveCustomHolidays = async () => {
  try {
    await request.post('/company-calendar/custom-holidays', {
      holidays: customHolidays.value
    })
  } catch (error) {
    console.error('保存节日失败:', error)
  }
}

// 加载自定义节日
const loadCustomHolidays = async () => {
  try {
    const result = await request.get('/company-calendar/custom-holidays')
    customHolidays.value = result.data?.holidays || result.holidays || []
  } catch (error) {
    console.error('加载节日失败:', error)
  }
}

// 加载业务变量
const loadBusinessVars = async () => {
  try {
    const result = await request.get('/company-calendar/settings/company-calendar')
    businessVars.value = {
      daysBeforeToday: parseInt(result.daysBeforeToday) || 90,
      daysAfterToday: parseInt(result.daysAfterToday) || 365,
      standardWorkHours: parseFloat(result.standardWorkHours) || 8,
      weekendMode: result.weekendMode || 'double'
    }
  } catch (error) {
    console.error('加载业务设置失败:', error)
  }
}

// ✅ 保存页面设置（字段顺序 + 业务变量）
const handleSettingsSave = async (settings) => {
  try {
    console.log('✅ 收到设置:', settings)
    
    // ✅ 更新字段顺序和可见性
    if (settings.fields && settings.fields.length > 0) {
      console.log('✅ 更新字段顺序:', settings.fields.map(f => f.label).join(', '))
      
      // 创建字段映射
      const fieldMap = new Map()
      columns.value.forEach(col => {
        fieldMap.set(col.prop, col)
      })
      
      // 按新顺序重排
      const newColumns = []
      settings.fields.forEach(field => {
        const column = fieldMap.get(field.prop)
        if (column) {
          newColumns.push({
            ...column,
            visible: field.visible !== false  // 更新可见性
          })
        }
      })
      
      // 添加不在settings中的字段（防止丢失）
      columns.value.forEach(col => {
        if (!newColumns.find(nc => nc.prop === col.prop)) {
          newColumns.push(col)
        }
      })
      
      columns.value = newColumns  // ✅ 重新赋值触发响应式
      console.log('✅ 字段顺序已更新:', columns.value.map(c => c.label).join(', '))
      
      // ✅ 强制重新加载数据以确保表格重新渲染
      await loadData()
    }
    
    // ✅ 保存业务变量到后端
    await request.post('/company-calendar/settings/company-calendar', businessVars.value)
    
    // ✅ 提示用户是否重新初始化日历数据
    try {
      await ElMessageBox.confirm(
        '业务变量已保存成功！是否立即重新初始化日历数据以应用新设置？',
        '提示',
        {
          confirmButtonText: '立即初始化',
          cancelButtonText: '稍后手动初始化',
          type: 'info',
          distinguishCancelAndClose: true
        }
      )
      
      // 用户选择立即初始化，跳过二次确认
      await handleInitData(true)
      // ✅ 初始化后重新加载数据
      setTimeout(() => {
        loadData()
      }, 500)  // 给后端一点处理时间
    } catch (action) {
      // 用户选择稍后手动初始化
      ElMessage.success('设置保存成功，请点击"初始化日历数据"按钮应用新设置')
      loadData()
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败')
  }
}

onMounted(() => {
  loadBusinessVars()
  loadCustomHolidays()
  loadData()
})
</script>

<style scoped>
.company-calendar-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 4px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.page-settings-trigger {
  width: 40px;
  height: 40px;
  font-size: 18px;
  border: 1px solid #dcdfe6;
  background: #fff;
  transition: all 0.3s;
}

.page-settings-trigger:hover {
  color: #409eff;
  border-color: #409eff;
  background: #ecf5ff;
}

.search-card {
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.table-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>
