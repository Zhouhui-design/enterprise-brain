<template>
  <div class="location-manager-component">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>库位管理</span>
          <el-button type="primary" size="small" :icon="Plus" @click="showAddDialog = true">
            新增库位
          </el-button>
        </div>
      </template>

      <!-- 库位树 -->
      <el-tree
        :data="locationTree"
        :props="treeProps"
        node-key="id"
        default-expand-all
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <div class="node-info">
              <el-icon class="node-icon" :color="getIconColor(data.type)">
                <component :is="getIcon(data.type)" />
              </el-icon>
              <span class="node-label">{{ node.label }}</span>
              <el-tag v-if="data.type === 'location'" size="small" :type="getStatusType(data.status)">
                {{ getStatusText(data.status) }}
              </el-tag>
              <span v-if="data.capacity" class="capacity-info">
                ({{ data.usedCapacity || 0 }}/{{ data.capacity }})
              </span>
            </div>
            <div class="node-actions">
              <el-button 
                v-if="data.type !== 'location'"
                type="primary" 
                size="small" 
                link 
                @click.stop="handleAdd(data)"
              >
                添加
              </el-button>
              <el-button type="success" size="small" link @click.stop="handleEdit(data)">
                编辑
              </el-button>
              <el-button type="danger" size="small" link @click.stop="handleDelete(data)">
                删除
              </el-button>
            </div>
          </div>
        </template>
      </el-tree>
    </el-card>

    <!-- 添加/编辑库位对话框 -->
    <el-dialog 
      v-model="showAddDialog" 
      :title="dialogTitle" 
      width="500px"
    >
      <el-form :model="locationForm" :rules="rules" ref="locationFormRef" label-width="100px">
        <el-form-item label="上级库位">
          <el-cascader
            v-model="locationForm.parentId"
            :options="locationOptions"
            :props="cascaderProps"
            placeholder="请选择上级库位"
            clearable
          />
        </el-form-item>

        <el-form-item label="库位类型" prop="type">
          <el-select v-model="locationForm.type" placeholder="请选择类型">
            <el-option label="仓库" value="warehouse" />
            <el-option label="区域" value="area" />
            <el-option label="货架" value="shelf" />
            <el-option label="库位" value="location" />
          </el-select>
        </el-form-item>

        <el-form-item label="库位编码" prop="code">
          <el-input v-model="locationForm.code" placeholder="请输入库位编码" />
        </el-form-item>

        <el-form-item label="库位名称" prop="name">
          <el-input v-model="locationForm.name" placeholder="请输入库位名称" />
        </el-form-item>

        <el-form-item label="容量" v-if="locationForm.type === 'location'">
          <el-input-number v-model="locationForm.capacity" :min="1" placeholder="请输入容量" />
        </el-form-item>

        <el-form-item label="状态" v-if="locationForm.type === 'location'">
          <el-radio-group v-model="locationForm.status">
            <el-radio label="available">可用</el-radio>
            <el-radio label="occupied">占用</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="备注">
          <el-input 
            v-model="locationForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, OfficeBuilding, Grid, Folder, Location } from '@element-plus/icons-vue'
import { locationApi } from '@/api/inventory'

const emit = defineEmits(['refresh'])

// 响应式数据
const showAddDialog = ref(false)
const locationFormRef = ref(null)
const locationTree = ref([
  {
    id: 1,
    label: '主仓库',
    type: 'warehouse',
    code: 'WH001',
    children: [
      {
        id: 2,
        label: 'A区',
        type: 'area',
        code: 'A',
        children: [
          {
            id: 3,
            label: 'A-1货架',
            type: 'shelf',
            code: 'A-1',
            children: [
              {
                id: 4,
                label: 'A-1-01',
                type: 'location',
                code: 'A-1-01',
                capacity: 100,
                usedCapacity: 75,
                status: 'occupied'
              },
              {
                id: 5,
                label: 'A-1-02',
                type: 'location',
                code: 'A-1-02',
                capacity: 100,
                usedCapacity: 0,
                status: 'available'
              }
            ]
          }
        ]
      }
    ]
  }
])

const locationForm = reactive({
  parentId: null,
  type: 'location',
  code: '',
  name: '',
  capacity: 100,
  status: 'available',
  remark: ''
})

const rules = {
  type: [{ required: true, message: '请选择库位类型', trigger: 'change' }],
  code: [{ required: true, message: '请输入库位编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入库位名称', trigger: 'blur' }]
}

const treeProps = {
  children: 'children',
  label: 'label'
}

const cascaderProps = {
  value: 'id',
  label: 'label',
  children: 'children',
  checkStrictly: true
}

// 计算属性
const dialogTitle = computed(() => {
  return locationForm.id ? '编辑库位' : '新增库位'
})

const locationOptions = computed(() => {
  return locationTree.value
})

// 方法
const getIcon = (type) => {
  const iconMap = {
    warehouse: OfficeBuilding,
    area: Grid,
    shelf: Folder,
    location: Location
  }
  return iconMap[type] || Location
}

const getIconColor = (type) => {
  const colorMap = {
    warehouse: '#409eff',
    area: '#67c23a',
    shelf: '#e6a23c',
    location: '#909399'
  }
  return colorMap[type] || '#909399'
}

const getStatusType = (status) => {
  const typeMap = {
    available: 'success',
    occupied: 'warning',
    disabled: 'info'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    available: '可用',
    occupied: '占用',
    disabled: '禁用'
  }
  return textMap[status] || '未知'
}

const handleAdd = (data) => {
  Object.assign(locationForm, {
    parentId: [data.id],
    type: getNextType(data.type),
    code: '',
    name: '',
    capacity: 100,
    status: 'available',
    remark: ''
  })
  showAddDialog.value = true
}

const handleEdit = (data) => {
  Object.assign(locationForm, {
    id: data.id,
    parentId: data.parentId ? [data.parentId] : null,
    type: data.type,
    code: data.code,
    name: data.label,
    capacity: data.capacity,
    status: data.status,
    remark: data.remark || ''
  })
  showAddDialog.value = true
}

const handleDelete = (data) => {
  ElMessageBox.confirm('确认删除该库位吗？', '删除确认', {
    type: 'warning'
  }).then(async () => {
    try {
      await locationApi.deleteLocation(data.id)
      ElMessage.success('删除成功')
      emit('refresh')
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleSubmit = async () => {
  try {
    await locationFormRef.value.validate()
    
    const submitData = {
      ...locationForm,
      parentId: Array.isArray(locationForm.parentId) 
        ? locationForm.parentId[locationForm.parentId.length - 1] 
        : locationForm.parentId
    }

    if (locationForm.id) {
      await locationApi.updateLocation(submitData)
      ElMessage.success('更新成功')
    } else {
      await locationApi.createLocation(submitData)
      ElMessage.success('创建成功')
    }
    
    showAddDialog.value = false
    emit('refresh')
  } catch (error) {
    if (error !== false) {
      ElMessage.error('操作失败')
    }
  }
}

const getNextType = (currentType) => {
  const typeSequence = ['warehouse', 'area', 'shelf', 'location']
  const currentIndex = typeSequence.indexOf(currentType)
  return typeSequence[currentIndex + 1] || 'location'
}
</script>

<style scoped>
.location-manager-component {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
}

.node-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-icon {
  font-size: 18px;
}

.node-label {
  font-size: 14px;
  font-weight: 500;
}

.capacity-info {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.node-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.tree-node:hover .node-actions {
  opacity: 1;
}
</style>
