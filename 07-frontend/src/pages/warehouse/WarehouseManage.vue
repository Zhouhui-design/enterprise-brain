<template>
  <div class="warehouse-manage">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>仓库管理</h2>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增
        </el-button>
        <el-button 
          size="small" 
          @click="handleBatchDelete" 
          :disabled="!hasSelection"
        >
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-button size="small" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button size="small" @click="showSettings = true">
          <el-icon><Setting /></el-icon>
          页面设置
        </el-button>
      </div>
    </div>

    <!-- 筛选提示（表头筛选模式）-->
    <el-alert 
      type="info" 
      :closable="false" 
      style="margin: 0 20px 15px"
    >
      表头筛选模式：每列标题下方有搜索框，支持模糊查询，筛选作用于所有{{ pagination.total }}条数据
    </el-alert>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="filteredTableData"
        border
        stripe
        @selection-change="handleSelectionChange"
        height="calc(100vh - 280px)"
      >
        <el-table-column type="selection" width="55" fixed="left" />
        
        <template v-for="col in visibleColumns" :key="col.prop">
          <el-table-column
            v-if="col && col.prop"
            :prop="col.prop"
            :width="col.width"
            :fixed="col.prop === 'code' ? 'left' : false"
            :align="col.prop.includes('Quantity') || col.prop === 'capacity' || col.prop === 'locations' ? 'right' : 'left'"
          >
            <template #header>
              <div class="table-header-cell">
                <div class="header-label">{{ col.label }}</div>
                <el-input
                  v-if="col.filterable"
                  v-model="columnSearchValues[col.prop]"
                  size="small"
                  placeholder="模糊搜索"
                  clearable
                  @input="handleColumnSearch"
                  class="header-search"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>
            </template>
            <template #default="{ row, column, $index }">
              <span>{{ getFormattedValue(row, col.prop) }}</span>
            </template>
          </el-table-column>
        </template>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button 
              link 
              :type="row.status === 'enabled' ? 'danger' : 'success'"
              size="small" 
              @click="handleStatusChange(row)"
            >
              {{ row.status === 'enabled' ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 页面设置对话框 -->
    <PageSettingsDialog
      v-model="showSettings"
      :business-variables="businessVariables"
      :workflow-configs="workflowConfigs"
      :code-rules="codeRules"
      :column-configs="columnConfigs"
      @add-var="addBusinessVariable"
      @remove-var="removeBusinessVariable"
      @save-vars="saveBusinessVariables"
      @add-workflow="addWorkflowConfig"
      @remove-workflow="removeWorkflowConfig"
      @save-workflows="saveWorkflowConfigs"
      @add-code-rule="addCodeRule"
      @remove-code-rule="removeCodeRule"
      @save-code-rules="saveCodeRules"
      @update-code-example="updateCodeExample"
      @reorder-columns="reorderColumns"
      @save-columns="saveColumnConfigs"
    />

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑仓库' : '新增仓库'"
      width="60%"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        size="small"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="仓库编码" prop="code">
              <el-input v-model="formData.code" placeholder="请输入仓库编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仓库名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入仓库名称" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="仓库类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择仓库类型" style="width: 100%">
                <el-option label="原材料仓" value="raw_material" />
                <el-option label="半成品仓" value="semi_finished" />
                <el-option label="成品仓" value="finished_product" />
                <el-option label="废料仓" value="waste" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属区域" prop="region">
              <el-select v-model="formData.region" placeholder="请选择所属区域" style="width: 100%">
                <el-option label="华东区" value="east" />
                <el-option label="华南区" value="south" />
                <el-option label="华北区" value="north" />
                <el-option label="华中区" value="central" />
                <el-option label="西南区" value="southwest" />
                <el-option label="西北区" value="northwest" />
                <el-option label="东北区" value="northeast" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="仓库容量(㎡)" prop="capacity">
              <el-input-number 
                v-model="formData.capacity" 
                :min="0" 
                :step="100" 
                placeholder="请输入仓库容量"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="储位数量" prop="locations">
              <el-input-number 
                v-model="formData.locations" 
                :min="0" 
                :step="10" 
                placeholder="请输入储位数量"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="负责人" prop="manager">
              <el-input v-model="formData.manager" placeholder="请输入负责人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="详细地址" prop="address">
              <el-input v-model="formData.address" placeholder="请输入详细地址" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="仓库描述" prop="description">
              <el-input 
                v-model="formData.description" 
                type="textarea" 
                placeholder="请输入仓库描述"
                rows="3"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="启用状态">
              <el-switch v-model="formData.status" :active-value="'enabled'" :inactive-value="'disabled'" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="handleCloseDialog(formRef)">取消</el-button>
        <el-button type="primary" @click="handleSave(formRef)" :loading="processing">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 仓库详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="仓库详情"
      width="60%"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="2" border v-if="selectedWarehouse.id">
        <el-descriptions-item label="仓库编码">{{ selectedWarehouse.code }}</el-descriptions-item>
        <el-descriptions-item label="仓库名称">{{ selectedWarehouse.name }}</el-descriptions-item>
        <el-descriptions-item label="仓库类型">
          <el-tag :type="getTypeTagType(selectedWarehouse.type)">{{ getTypeText(selectedWarehouse.type) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="selectedWarehouse.status === 'enabled' ? 'success' : 'danger'">
            {{ selectedWarehouse.status === 'enabled' ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="仓库容量">{{ selectedWarehouse.capacity }} 平方米</el-descriptions-item>
        <el-descriptions-item label="储位数量">{{ selectedWarehouse.locations }}</el-descriptions-item>
        <el-descriptions-item label="所属区域">{{ getRegionText(selectedWarehouse.region) }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ selectedWarehouse.manager }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ selectedWarehouse.contactPhone }}</el-descriptions-item>
        <el-descriptions-item label="详细地址">{{ selectedWarehouse.address }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ selectedWarehouse.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ selectedWarehouse.updatedAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注信息" :span="2">{{ selectedWarehouse.description || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Plus, Delete, Refresh, Setting, Search } from '@element-plus/icons-vue'
// 使用新架构的Composables
import { 
  useWarehouseList,
  useWarehouseActions 
} from '@/features/warehouse'
import { usePageSettings } from '@/features/warehouse/composables/usePageSettings'
import PageSettingsDialog from '@/features/warehouse/components/PageSettingsDialog.vue'

// ========== 列表逻辑（独立） ==========
const {
  loading,
  tableData,
  selectedRows,
  pagination,
  searchForm,
  hasSelection,
  loadData,
  handleSearch,
  handleResetSearch,
  handleRefresh,
  handlePageChange,
  handlePageSizeChange,
  handleSelectionChange
} = useWarehouseList()

// ========== 操作逻辑（独立） ==========
const {
  processing,
  dialogVisible,
  detailVisible,
  isEdit,
  formData,
  selectedWarehouse,
  formRules,
  handleAdd,
  handleEdit,
  handleView,
  handleSave,
  handleStatusChange,
  handleCloseDialog,
  handleCloseDetail
} = useWarehouseActions(loadData)

// ========== 页面设置 ==========
const showSettings = ref(false)

// 默认列配置（按改造前页面的完整字段）
const defaultColumns = [
  { prop: 'code', label: '仓库编码', width: 120, filterable: true, visible: true },
  { prop: 'name', label: '仓库名称', width: 180, filterable: true, visible: true },
  { prop: 'type', label: '仓库类型', width: 120, filterable: true, visible: true },
  { prop: 'status', label: '状态', width: 100, filterable: true, visible: true },
  { prop: 'capacity', label: '容量(㎡)', width: 100, filterable: false, visible: true },
  { prop: 'locations', label: '储位数量', width: 120, filterable: false, visible: true },
  { prop: 'region', label: '所属区域', width: 120, filterable: true, visible: true },
  { prop: 'manager', label: '负责人', width: 120, filterable: true, visible: true },
  { prop: 'contactPhone', label: '联系电话', width: 120, filterable: true, visible: true },
  { prop: 'address', label: '详细地址', width: 200, filterable: true, visible: true },
  { prop: 'createdAt', label: '创建时间', width: 160, filterable: true, visible: true },
  { prop: 'updatedAt', label: '更新时间', width: 160, filterable: true, visible: false }
]

const {
  businessVariables,
  addBusinessVariable,
  removeBusinessVariable,
  saveBusinessVariables,
  workflowConfigs,
  addWorkflowConfig,
  removeWorkflowConfig,
  saveWorkflowConfigs,
  codeRules,
  addCodeRule,
  removeCodeRule,
  saveCodeRules,
  updateCodeExample,
  columnConfigs,
  reorderColumns,
  saveColumnConfigs,
  initSettings
} = usePageSettings('warehouse')

// 可见列（按顺序排列） - 增强错误处理
const visibleColumns = computed(() => {
  try {
    // 如果columnConfigs还没有初始化，先使用defaultColumns
    if (!columnConfigs.value || columnConfigs.value.length === 0) {
      console.log('🔧 使用默认列配置:', defaultColumns.length, '个列')
      return defaultColumns
    }
    
    const visible = [...columnConfigs.value]
      .sort((a, b) => (a?.order || 0) - (b?.order || 0))
      .filter(col => col && col.visible)  // 添加null检查和过滤条件
    
    console.log('🔧 使用保存的列配置:', {
      总数: columnConfigs.value.length,
      可见: visible.length,
      隐藏: columnConfigs.value.length - visible.length
    })
    
    return visible
  } catch (error) {
    console.error('❌ visibleColumns计算属性出错:', error)
    return defaultColumns
  }
})

// 表头模糊搜索
const columnSearchValues = ref({})

const handleColumnSearch = () => {
  // 触发筛选，使用computed自动更新
}

// 筛选后的表格数据（模糊搜索） - 严格数据过滤
const filteredTableData = computed(() => {
  try {
    if (!tableData.value || !Array.isArray(tableData.value)) {
      console.log('🔧 tableData不是有效数组:', tableData.value)
      return []
    }
    
    // 严格过滤：只保留有效的对象
    let data = tableData.value.filter(row => {
      return row && typeof row === 'object' && !Array.isArray(row) && row.code !== undefined
    })
    
    console.log('🔧 过滤后的有效数据:', data.length, '条 (原始:', tableData.value.length, '条)')
    
    // 对每个有搜索值的列进行筛选
    if (columnSearchValues.value) {
      Object.keys(columnSearchValues.value).forEach(prop => {
        const searchValue = columnSearchValues.value[prop]
        if (searchValue && searchValue.trim()) {
          data = data.filter(row => {
            if (!row) return false
            
            const cellValue = row[prop]
            if (cellValue === null || cellValue === undefined) return false
            
            // 转为字符串进行模糊匹配（不区分大小写）
            return String(cellValue)
              .toLowerCase()
              .includes(searchValue.toLowerCase().trim())
          })
        }
      })
    }
    
    return data
  } catch (error) {
    console.error('❌ filteredTableData计算属性出错:', error)
    return []
  }
})

// ========== 事件处理（只负责UI交互） ==========
const handleDelete = async (row) => {
  await useWarehouseActions(loadData).deleteOne(row)
}

const handleBatchDelete = async () => {
  await useWarehouseActions(loadData).batchDelete(selectedRows.value)
}

// ========== 工具函数 ==========
const getTypeText = (type) => {
  const typeMap = {
    'raw_material': '原材料仓',
    'semi_finished': '半成品仓',
    'finished_product': '成品仓',
    'waste': '废料仓'
  }
  return typeMap[type] || type
}

const getTypeTagType = (type) => {
  const typeMap = {
    'raw_material': 'primary',
    'semi_finished': 'success',
    'finished_product': 'warning',
    'waste': 'info'
  }
  return typeMap[type] || 'default'
}

const getRegionText = (region) => {
  const regionMap = {
    'east': '华东区',
    'south': '华南区',
    'north': '华北区',
    'central': '华中区',
    'southwest': '西南区',
    'northwest': '西北区',
    'northeast': '东北区'
  }
  return regionMap[region] || region
}

// 获取格式化值 - 直接返回格式化后的值
const getFormattedValue = (row, prop) => {
  try {
    if (!row || typeof row !== 'object') {
      console.warn('⚠️ getFormattedValue: row is not an object', { row, prop })
      return '-'
    }

    const cellValue = row[prop]
    
    // 日期字段
    if (['createdAt', 'updatedAt'].includes(prop)) {
      if (!cellValue) return '-'
      try {
        const date = new Date(cellValue)
        if (isNaN(date.getTime())) return '-'
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}`
      } catch {
        return '-'
      }
    }
    
    // 状态字段
    if (prop === 'status') {
      return cellValue === 'enabled' ? '启用' : '禁用'
    }
    
    // 类型字段
    if (prop === 'type') {
      return getTypeText(cellValue)
    }
    
    // 区域字段
    if (prop === 'region') {
      return getRegionText(cellValue)
    }
    
    // 数值字段（保留整数）
    if (['capacity', 'locations'].includes(prop)) {
      if (cellValue === null || cellValue === undefined) return '0'
      const value = parseFloat(cellValue)
      return isNaN(value) ? '0' : value.toString()
    }
    
    // 默认处理
    if (cellValue === null || cellValue === undefined) return '-'
    return String(cellValue)
    
  } catch (error) {
    console.error('❌ getFormattedValue错误:', error, { prop, row })
    return '-'
  }
}

// 保留原有的 getFormatter 函数以防其他地方使用
const getFormatter = (prop) => {
  return ({ row, column, cellValue }) => getFormattedValue(row, prop)
}

// ========== 初始化 ==========
onMounted(async () => {
  try {
    console.log('🔧 仓库管理页面开始初始化')
    
    // 先初始化页面设置
    initSettings(defaultColumns)
    
    // 等待下一个tick确保响应式更新完成
    await nextTick()
    
    // 然后加载数据
    loadData()
    
    console.log('✅ 仓库管理页面初始化完成')
  } catch (error) {
    console.error('❌ 仓库管理页面初始化失败:', error)
  }
})

// ========== 组件清理 ==========
onUnmounted(() => {
  console.log('🧹 仓库管理页面开始清理')
  
  try {
    // 清理搜索值，防止内存泄漏
    columnSearchValues.value = {}
    
    // 清理选中行
    selectedRows.value = []
    
    // 清理表格数据引用
    tableData.value = []
    
    console.log('✅ 仓库管理页面清理完成')
  } catch (error) {
    console.error('❌ 页面清理时出错:', error)
  }
})

// 获取模拟仓库数据
const getMockWarehouses = () => {
  const now = new Date()
  const formatDate = (date) => date.toISOString().slice(0, 16).replace('T', ' ')
  
  return [
    {
      id: '1',
      code: 'WH001',
      name: '原材料主仓',
      type: 'raw_material',
      status: 'enabled',
      capacity: 5000,
      locations: 500,
      region: 'east',
      manager: '张三',
      contactPhone: '13800138001',
      address: '上海市浦东新区张江高科技园区科苑路88号',
      description: '主要存储生产所需的各类原材料，是公司最大的原材料仓库',
      createdAt: formatDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)),
      updatedAt: formatDate(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000))
    },
    {
      id: '2',
      code: 'WH002',
      name: '成品仓A',
      type: 'finished_product',
      status: 'enabled',
      capacity: 3000,
      locations: 300,
      region: 'east',
      manager: '李四',
      contactPhone: '13900139002',
      address: '上海市浦东新区川沙路5000号',
      description: '主要存储A系列产品的成品',
      createdAt: formatDate(new Date(now.getTime() - 80 * 24 * 60 * 60 * 1000)),
      updatedAt: formatDate(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000))
    },
    {
      id: '3',
      code: 'WH003',
      name: '半成品仓',
      type: 'semi_finished',
      status: 'enabled',
      capacity: 2000,
      locations: 200,
      region: 'east',
      manager: '王五',
      contactPhone: '13700137003',
      address: '上海市浦东新区金桥路1000号',
      description: '存储生产过程中的半成品',
      createdAt: formatDate(new Date(now.getTime() - 70 * 24 * 60 * 60 * 1000))
    },
    {
      id: '4',
      code: 'WH004',
      name: '废料处理仓',
      type: 'waste',
      status: 'enabled',
      capacity: 1000,
      locations: 100,
      region: 'east',
      manager: '赵六',
      contactPhone: '13600136004',
      address: '上海市浦东新区老港工业区1号',
      description: '存储生产过程中产生的废料，等待处理',
      createdAt: formatDate(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000))
    },
    {
      id: '5',
      code: 'WH005',
      name: '华南原材料仓',
      type: 'raw_material',
      status: 'enabled',
      capacity: 4000,
      locations: 400,
      region: 'south',
      manager: '陈七',
      contactPhone: '13500135005',
      address: '广东省深圳市南山区科技园南区T3栋',
      description: '华南地区原材料仓库',
      createdAt: formatDate(new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000))
    },
    {
      id: '6',
      code: 'WH006',
      name: '华北成品仓',
      type: 'finished_product',
      status: 'enabled',
      capacity: 3500,
      locations: 350,
      region: 'north',
      manager: '刘八',
      contactPhone: '13400134006',
      address: '北京市大兴区亦庄经济技术开发区荣华南路',
      description: '华北地区成品仓库',
      createdAt: formatDate(new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000))
    },
    {
      id: '7',
      code: 'WH007',
      name: '华中成品仓',
      type: 'finished_product',
      status: 'disabled',
      capacity: 2500,
      locations: 250,
      region: 'central',
      manager: '周九',
      contactPhone: '13300133007',
      address: '湖北省武汉市东湖新技术开发区光谷大道',
      description: '华中区成品仓库，目前暂时关闭',
      createdAt: formatDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
    },
    {
      id: '8',
      code: 'WH008',
      name: '原材料辅仓',
      type: 'raw_material',
      status: 'enabled',
      capacity: 1500,
      locations: 150,
      region: 'east',
      manager: '吴十',
      contactPhone: '13200132008',
      address: '上海市嘉定区安亭镇新源路',
      description: '辅助原材料仓库，主要存储一些特殊材料',
      createdAt: formatDate(new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000))
    }
  ]
}


</script>

<style scoped>
.warehouse-manage {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* 搜索卡片 */
.search-card {
  margin-bottom: 20px;
}

.search-actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  height: 100%;
}

.stat-item {
  text-align: center;
  padding: 10px 0;
}

.stat-value {
  font-size: 36px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

/* 数据卡片 */
.data-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 10px;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 仓库名称 */
.warehouse-name {
  cursor: help;
  color: #409eff;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .warehouse-manage {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .search-actions {
    justify-content: stretch;
  }
  
  .search-actions .el-button {
    flex: 1;
  }
}
</style>