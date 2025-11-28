<template>
  <div class="warehouse-manage">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">仓库管理</h1>
      <div class="header-actions">
        <el-button type="primary" icon="el-icon-plus" @click="handleCreateWarehouse">新建仓库</el-button>
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="仓库名称">
              <el-input v-model="searchForm.name" placeholder="请输入仓库名称" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="仓库编码">
              <el-input v-model="searchForm.code" placeholder="请输入仓库编码" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="仓库状态">
              <el-select v-model="searchForm.status" placeholder="请选择状态">
                <el-option label="全部" value="" />
                <el-option label="启用" value="enabled" />
                <el-option label="禁用" value="disabled" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="仓库类型">
              <el-select v-model="searchForm.type" placeholder="请选择类型">
                <el-option label="全部" value="" />
                <el-option label="原材料仓" value="raw_material" />
                <el-option label="半成品仓" value="semi_finished" />
                <el-option label="成品仓" value="finished_product" />
                <el-option label="废料仓" value="waste" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="负责人">
              <el-input v-model="searchForm.manager" placeholder="请输入负责人" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="所属区域">
              <el-select v-model="searchForm.region" placeholder="请选择区域">
                <el-option label="全部" value="" />
                <el-option v-for="region in regionOptions" :key="region.value" :label="region.label" :value="region.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" class="search-actions">
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
              <el-button type="info" @click="handleExport">导出</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 数据统计卡片 -->
    <div class="stats-cards">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-item">
          <div class="stat-value">{{ totalWarehouses }}</div>
          <div class="stat-label">仓库总数</div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-item">
          <div class="stat-value">{{ enabledWarehouses }}</div>
          <div class="stat-label">启用仓库</div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-item">
          <div class="stat-value">{{ totalCapacity }}</div>
          <div class="stat-label">总容量(平方米)</div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-item">
          <div class="stat-value">{{ totalLocations }}</div>
          <div class="stat-label">储位总数</div>
        </div>
      </el-card>
    </div>

    <!-- 仓库列表 -->
    <el-card shadow="never" class="data-card">
      <div class="table-header">
        <span class="table-title">仓库列表</span>
        <div class="table-actions">
          <el-button type="info" text @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="paginatedWarehouses"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="仓库编码" min-width="120" />
        <el-table-column prop="name" label="仓库名称" min-width="180">
          <template #default="{ row }">
            <el-tooltip effect="dark" :content="row.description" placement="top">
              <span class="warehouse-name">{{ row.name }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="仓库类型" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'danger'">
              {{ row.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="capacity" label="容量(㎡)" min-width="100" />
        <el-table-column prop="locations" label="储位数量" min-width="100" />
        <el-table-column prop="region" label="所属区域" min-width="120" />
        <el-table-column prop="manager" label="负责人" min-width="120" />
        <el-table-column prop="contactPhone" label="联系电话" min-width="120" />
        <el-table-column prop="address" label="详细地址" min-width="200" />
        <el-table-column prop="createdAt" label="创建时间" min-width="160" />
        <el-table-column label="操作" min-width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="row.status === 'enabled' ? 'danger' : 'success'"
              @click="handleStatusChange(row)"
            >
              {{ row.status === 'enabled' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredWarehouses.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新建/编辑仓库弹窗 -->
    <el-dialog
      v-model="showFormDialog"
      :title="dialogTitle"
      width="60%"
      :before-close="handleCloseDialog"
    >
      <el-form
        ref="warehouseFormRef"
        :model="warehouseForm"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="仓库编码" prop="code">
              <el-input v-model="warehouseForm.code" placeholder="请输入仓库编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仓库名称" prop="name">
              <el-input v-model="warehouseForm.name" placeholder="请输入仓库名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="仓库类型" prop="type">
              <el-select v-model="warehouseForm.type" placeholder="请选择仓库类型">
                <el-option label="原材料仓" value="raw_material" />
                <el-option label="半成品仓" value="semi_finished" />
                <el-option label="成品仓" value="finished_product" />
                <el-option label="废料仓" value="waste" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属区域" prop="region">
              <el-select v-model="warehouseForm.region" placeholder="请选择所属区域">
                <el-option v-for="region in regionOptions" :key="region.value" :label="region.label" :value="region.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="仓库容量(㎡)" prop="capacity">
              <el-input-number 
                v-model="warehouseForm.capacity" 
                :min="0" 
                :step="100" 
                placeholder="请输入仓库容量"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="储位数量" prop="locations">
              <el-input-number 
                v-model="warehouseForm.locations" 
                :min="0" 
                :step="10" 
                placeholder="请输入储位数量"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="负责人" prop="manager">
              <el-input v-model="warehouseForm.manager" placeholder="请输入负责人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="warehouseForm.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="详细地址" prop="address">
              <el-input v-model="warehouseForm.address" placeholder="请输入详细地址" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="仓库描述" prop="description">
              <el-input 
                v-model="warehouseForm.description" 
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
              <el-switch v-model="warehouseForm.status" :active-value="'enabled'" :inactive-value="'disabled'" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 仓库详情弹窗 -->
    <el-dialog
      v-model="showDetailDialog"
      title="仓库详情"
      width="60%"
      :before-close="handleCloseDetail"
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
        <el-descriptions-item label="所属区域">{{ selectedWarehouse.region }}</el-descriptions-item>
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

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

// 定义仓库类型
interface Warehouse {
  id: string
  code: string
  name: string
  type: 'raw_material' | 'semi_finished' | 'finished_product' | 'waste'
  status: 'enabled' | 'disabled'
  capacity: number
  locations: number
  region: string
  manager: string
  contactPhone: string
  address: string
  description?: string
  createdAt: string
  updatedAt?: string
}

// 定义搜索表单类型
interface SearchForm {
  name: string
  code: string
  status: string
  type: string
  manager: string
  region: string
}

// 定义仓库表单类型
interface WarehouseForm extends Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'> {}

// 定义区域选项类型
interface RegionOption {
  label: string
  value: string
}

// 定义分页类型
interface Pagination {
  currentPage: number
  pageSize: number
}

// 响应式数据
const loading = ref(false)
const showFormDialog = ref(false)
const showDetailDialog = ref(false)
const dialogTitle = ref('新建仓库')
const selectedWarehouse = ref<Warehouse>({} as Warehouse)
const selectedWarehouses = ref<Warehouse[]>([])
const warehouseFormRef = ref()
const warehouses = ref<Warehouse[]>([])

// 区域选项
const regionOptions = ref<RegionOption[]>([
  { label: '华东区', value: 'east' },
  { label: '华南区', value: 'south' },
  { label: '华北区', value: 'north' },
  { label: '华中区', value: 'central' },
  { label: '西南区', value: 'southwest' },
  { label: '西北区', value: 'northwest' },
  { label: '东北区', value: 'northeast' }
])

// 搜索表单
const searchForm = reactive<SearchForm>({
  name: '',
  code: '',
  status: '',
  type: '',
  manager: '',
  region: ''
})

// 仓库表单
const warehouseForm = reactive<WarehouseForm>({
  code: '',
  name: '',
  type: 'raw_material',
  status: 'enabled',
  capacity: 0,
  locations: 0,
  region: '',
  manager: '',
  contactPhone: '',
  address: '',
  description: ''
})

// 分页
const pagination = reactive<Pagination>({
  currentPage: 1,
  pageSize: 10
})

// 表单验证规则
const formRules = {
  code: [
    { required: true, message: '请输入仓库编码', trigger: 'blur' },
    { min: 3, max: 20, message: '编码长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入仓库名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择仓库类型', trigger: 'change' }
  ],
  capacity: [
    { required: true, message: '请输入仓库容量', trigger: 'blur' },
    { type: 'number', min: 0, message: '容量必须大于等于0', trigger: 'blur' }
  ],
  locations: [
    { required: true, message: '请输入储位数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '储位数量必须大于等于0', trigger: 'blur' }
  ],
  region: [
    { required: true, message: '请选择所属区域', trigger: 'change' }
  ],
  manager: [
    { required: true, message: '请输入负责人', trigger: 'blur' }
  ],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 5, message: '地址长度不能少于5个字符', trigger: 'blur' }
  ]
}

// 计算属性：筛选后的仓库列表
const filteredWarehouses = computed(() => {
  return warehouses.value.filter(warehouse => {
    let match = true
    
    if (searchForm.name) {
      match = match && warehouse.name.toLowerCase().includes(searchForm.name.toLowerCase())
    }
    if (searchForm.code) {
      match = match && warehouse.code.toLowerCase().includes(searchForm.code.toLowerCase())
    }
    if (searchForm.status) {
      match = match && warehouse.status === searchForm.status
    }
    if (searchForm.type) {
      match = match && warehouse.type === searchForm.type
    }
    if (searchForm.manager) {
      match = match && warehouse.manager.toLowerCase().includes(searchForm.manager.toLowerCase())
    }
    if (searchForm.region) {
      match = match && warehouse.region === searchForm.region
    }
    
    return match
  })
})

// 计算属性：分页后的仓库列表
const paginatedWarehouses = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredWarehouses.value.slice(start, end)
})

// 计算属性：统计数据
const totalWarehouses = computed(() => warehouses.value.length)
const enabledWarehouses = computed(() => warehouses.value.filter(w => w.status === 'enabled').length)
const totalCapacity = computed(() => warehouses.value.reduce((sum, w) => sum + w.capacity, 0))
const totalLocations = computed(() => warehouses.value.reduce((sum, w) => sum + w.locations, 0))

// 组件挂载时加载数据
onMounted(() => {
  loadWarehouses()
})

// 加载仓库数据
const loadWarehouses = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    warehouses.value = getMockWarehouses()
  } catch (error) {
    ElMessage.error('加载仓库数据失败')
    console.error('加载仓库数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取模拟仓库数据
const getMockWarehouses = (): Warehouse[] => {
  const now = new Date()
  const formatDate = (date: Date) => date.toISOString().slice(0, 16).replace('T', ' ')
  
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

// 获取仓库类型文本
const getTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    'raw_material': '原材料仓',
    'semi_finished': '半成品仓',
    'finished_product': '成品仓',
    'waste': '废料仓'
  }
  return typeMap[type] || type
}

// 获取仓库类型标签样式
const getTypeTagType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'raw_material': 'primary',
    'semi_finished': 'success',
    'finished_product': 'warning',
    'waste': 'info'
  }
  return typeMap[type] || 'default'
}

// 处理选择变化
const handleSelectionChange = (selection: Warehouse[]) => {
  selectedWarehouses.value = selection
}

// 处理查询
const handleSearch = () => {
  pagination.currentPage = 1
}

// 处理重置
const handleReset = () => {
  Object.assign(searchForm, {
    name: '',
    code: '',
    status: '',
    type: '',
    manager: '',
    region: ''
  })
  pagination.currentPage = 1
}

// 处理刷新
const handleRefresh = () => {
  loadWarehouses()
}

// 处理导出
const handleExport = () => {
  ElMessage.success('数据导出成功')
}

// 处理创建仓库
const handleCreateWarehouse = () => {
  dialogTitle.value = '新建仓库'
  // 重置表单
  Object.assign(warehouseForm, {
    code: '',
    name: '',
    type: 'raw_material',
    status: 'enabled',
    capacity: 0,
    locations: 0,
    region: '',
    manager: '',
    contactPhone: '',
    address: '',
    description: ''
  })
  showFormDialog.value = true
}

// 处理编辑仓库
const handleEdit = (warehouse: Warehouse) => {
  dialogTitle.value = '编辑仓库'
  // 填充表单
  Object.assign(warehouseForm, {
    code: warehouse.code,
    name: warehouse.name,
    type: warehouse.type,
    status: warehouse.status,
    capacity: warehouse.capacity,
    locations: warehouse.locations,
    region: warehouse.region,
    manager: warehouse.manager,
    contactPhone: warehouse.contactPhone,
    address: warehouse.address,
    description: warehouse.description || ''
  })
  showFormDialog.value = true
}

// 处理查看仓库
const handleView = (warehouse: Warehouse) => {
  selectedWarehouse.value = { ...warehouse }
  showDetailDialog.value = true
}

// 处理状态变更
const handleStatusChange = async (warehouse: Warehouse) => {
  try {
    const statusText = warehouse.status === 'enabled' ? '禁用' : '启用'
    await ElMessageBox.confirm(
      `确定要${statusText}仓库「${warehouse.name}」吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: warehouse.status === 'enabled' ? 'warning' : 'info'
      }
    )
    
    // 更新状态
    const warehouseIndex = warehouses.value.findIndex(w => w.id === warehouse.id)
    if (warehouseIndex !== -1) {
      warehouses.value[warehouseIndex].status = warehouse.status === 'enabled' ? 'disabled' : 'enabled'
      warehouses.value[warehouseIndex].updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
    }
    
    ElMessage.success(`仓库${statusText}成功`)
  } catch (error) {
    // 取消操作
  }
}

// 处理关闭弹窗
const handleCloseDialog = () => {
  showFormDialog.value = false
  // 重置表单验证
  if (warehouseFormRef.value) {
    warehouseFormRef.value.resetFields()
  }
}

// 处理关闭详情弹窗
const handleCloseDetail = () => {
  showDetailDialog.value = false
}

// 处理提交
const handleSubmit = async () => {
  try {
    // 验证表单
    if (warehouseFormRef.value) {
      await warehouseFormRef.value.validate()
    }
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const now = new Date()
    const formatDateTime = (date: Date) => date.toISOString().slice(0, 16).replace('T', ' ')
    
    if (dialogTitle.value === '新建仓库') {
      // 创建新仓库
      const newWarehouse: Warehouse = {
        id: Date.now().toString(),
        ...warehouseForm,
        createdAt: formatDateTime(now)
      }
      warehouses.value.unshift(newWarehouse)
      ElMessage.success('仓库创建成功')
    } else {
      // 更新仓库
      const warehouseIndex = warehouses.value.findIndex(w => w.code === warehouseForm.code)
      if (warehouseIndex !== -1) {
        warehouses.value[warehouseIndex] = {
          ...warehouses.value[warehouseIndex],
          ...warehouseForm,
          updatedAt: formatDateTime(now)
        }
        ElMessage.success('仓库更新成功')
      }
    }
    
    // 关闭弹窗
    showFormDialog.value = false
  } catch (error) {
    // 表单验证失败或其他错误
    if (error !== false) {
      ElMessage.error('操作失败，请重试')
    }
  }
}

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
}

// 处理当前页码变化
const handleCurrentChange = (current: number) => {
  pagination.currentPage = current
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