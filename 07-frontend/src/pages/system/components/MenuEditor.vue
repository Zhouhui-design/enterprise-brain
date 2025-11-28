<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑菜单' : '新增菜单'"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="menuFormRef"
      :model="menuForm"
      :rules="menuRules"
      label-width="120px"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="菜单名称" prop="menuName">
            <el-input 
              v-model="menuForm.menuName" 
              placeholder="请输入菜单名称"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="菜单图标" prop="menuIcon">
            <el-input 
              v-model="menuForm.menuIcon" 
              placeholder="请输入图标类名"
              clearable
            >
              <template #append>
                <el-button @click="showIconPicker = true">选择图标</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="菜单类型" prop="menuType">
            <el-select 
              v-model="menuForm.menuType" 
              placeholder="请选择菜单类型"
              @change="handleMenuTypeChange"
            >
              <el-option label="目录" value="directory" />
              <el-option label="菜单" value="menu" />
              <el-option label="按钮" value="button" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="父级菜单" prop="parentId">
            <el-tree-select
              v-model="menuForm.parentId"
              :data="parentMenuOptions"
              placeholder="请选择父级菜单"
              clearable
              check-strictly
              :props="{ value: 'id', label: 'menuName', children: 'children' }"
              :render-after-expand="false"
            />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="路由路径" prop="menuPath" v-if="menuForm.menuType !== 'button'">
            <el-input 
              v-model="menuForm.menuPath" 
              placeholder="请输入路由路径，如：/system/menu"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="组件路径" prop="component" v-if="menuForm.menuType === 'menu'">
            <el-input 
              v-model="menuForm.component" 
              placeholder="请输入组件路径，如：system/menu/index"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="权限标识" prop="permissionCode">
            <el-input 
              v-model="menuForm.permissionCode" 
              placeholder="请输入权限标识，如：SYSTEM:MENU:VIEW"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序号" prop="sortOrder">
            <el-input-number 
              v-model="menuForm.sortOrder" 
              :min="0"
              :max="9999"
              placeholder="排序号"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="是否显示" prop="isVisible">
            <el-switch 
              v-model="menuForm.isVisible"
              active-text="显示"
              inactive-text="隐藏"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否启用" prop="isEnabled">
            <el-switch 
              v-model="menuForm.isEnabled"
              active-text="启用"
              inactive-text="禁用"
            />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-form-item label="备注" prop="remark">
        <el-input 
          v-model="menuForm.remark" 
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息"
          clearable
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button 
        type="primary" 
        @click="handleSave"
        :loading="saving"
      >
        保存
      </el-button>
    </template>
  </el-dialog>
  
  <!-- 图标选择器 -->
  <el-dialog
    v-model="showIconPicker"
    title="选择图标"
    width="800px"
  >
    <div class="icon-picker">
      <el-input
        v-model="iconSearchQuery"
        placeholder="搜索图标..."
        clearable
        style="margin-bottom: 16px"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <div class="icon-grid">
        <div 
          v-for="icon in filteredIcons" 
          :key="icon"
          class="icon-item"
          :class="{ active: menuForm.menuIcon === icon }"
          @click="selectIcon(icon)"
        >
          <el-icon :class="icon"></el-icon>
          <span class="icon-name">{{ icon }}</span>
        </div>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="showIconPicker = false">取消</el-button>
      <el-button type="primary" @click="showIconPicker = false">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { systemApi } from '@/services'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  menuData: {
    type: Object,
    default: () => ({})
  },
  parentMenu: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['update:visible', 'saved'])

// 响应式数据
const menuFormRef = ref(null)
const parentMenuOptions = ref([])
const saving = ref(false)
const showIconPicker = ref(false)
const iconSearchQuery = ref('')

// 常用图标列表
const commonIcons = [
  'House', 'Menu', 'Setting', 'User', 'Lock', 'Unlock', 'View', 'Hide',
  'Edit', 'Delete', 'Plus', 'Minus', 'Search', 'Refresh', 'Download', 'Upload',
  'Folder', 'FolderOpened', 'Document', 'Files', 'DataAnalysis', 'Monitor',
  'Bell', 'Message', 'ChatDotRound', 'Phone', 'Location', 'MapLocation',
  'Calendar', 'Clock', 'Timer', 'Warning', 'SuccessFilled', 'InfoFilled',
  'CircleCheck', 'CircleClose', 'QuestionFilled', 'Star', 'StarFilled',
  'Heart', 'HeartFilled', 'Share', 'Connection', 'Link', 'CopyDocument',
  'Scissor', 'Money', 'CreditCard', 'Wallet', 'ShoppingCart', 'Goods',
  'Truck', 'Ship', 'Airplane', 'Train', 'Car', 'Bicycle', 'Camera',
  'VideoCamera', 'Microphone', 'Headset', 'Picture', 'PictureRounded',
  'VideoPlay', 'VideoPause', 'VideoCameraFilled', 'MicrophoneFilled'
]

// 表单数据
const menuForm = reactive({
  menuName: '',
  menuIcon: '',
  menuType: 'menu',
  parentId: null,
  menuPath: '',
  component: '',
  permissionCode: '',
  sortOrder: 0,
  isVisible: true,
  isEnabled: true,
  remark: ''
})

// 表单验证规则
const menuRules = {
  menuName: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  menuType: [
    { required: true, message: '请选择菜单类型', trigger: 'change' }
  ],
  parentId: [
    { required: false, message: '请选择父级菜单', trigger: 'change' }
  ],
  menuPath: [
    { required: false, message: '请输入路由路径', trigger: 'blur' }
  ],
  component: [
    { required: false, message: '请输入组件路径', trigger: 'blur' }
  ],
  permissionCode: [
    { required: false, message: '请输入权限标识', trigger: 'blur' },
    { pattern: /^[A-Z_]+:[A-Z_]+:[A-Z_]+$/, message: '权限标识格式不正确，如：SYSTEM:MENU:VIEW', trigger: 'blur' }
  ],
  sortOrder: [
    { required: true, message: '请输入排序号', trigger: 'blur' },
    { type: 'number', min: 0, max: 9999, message: '排序号范围 0-9999', trigger: 'blur' }
  ]
}

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const isEdit = computed(() => {
  return props.menuData && props.menuData.id
})

const filteredIcons = computed(() => {
  if (!iconSearchQuery.value) {
    return commonIcons
  }
  return commonIcons.filter(icon => 
    icon.toLowerCase().includes(iconSearchQuery.value.toLowerCase())
  )
})

// 监听menuData变化
watch(() => props.menuData, (newData) => {
  if (newData) {
    Object.keys(menuForm).forEach(key => {
      menuForm[key] = newData[key] !== undefined ? newData[key] : menuForm[key]
    })
  }
}, { immediate: true, deep: true })

// 监听parentMenu变化
watch(() => props.parentMenu, (newParent) => {
  if (newParent) {
    menuForm.parentId = newParent.id
  }
}, { immediate: true })

// 处理菜单类型变化
const handleMenuTypeChange = (type) => {
  // 根据菜单类型调整必填字段
  if (type === 'directory') {
    menuForm.menuPath = ''
    menuForm.component = ''
  } else if (type === 'button') {
    menuForm.menuPath = ''
    menuForm.component = ''
  }
}

// 选择图标
const selectIcon = (icon) => {
  menuForm.menuIcon = icon
}

// 加载父级菜单选项
const loadParentMenuOptions = async () => {
  try {
    const response = await systemApi.menu.getTree()
    parentMenuOptions.value = response.data || []
  } catch (error) {
    console.error('加载父级菜单失败:', error)
  }
}

// 保存菜单
const handleSave = async () => {
  try {
    await menuFormRef.value.validate()
    
    saving.value = true
    
    const menuData = { ...menuForm }
    
    if (isEdit.value) {
      await systemApi.menu.update(props.menuData.id, menuData)
      ElMessage.success('菜单更新成功')
    } else {
      await systemApi.menu.create(menuData)
      ElMessage.success('菜单创建成功')
    }
    
    emit('saved')
    handleClose()
  } catch (error) {
    if (error.message) {
      ElMessage.error('保存失败: ' + error.message)
    }
  } finally {
    saving.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
  // 重置表单
  menuFormRef.value?.resetFields()
  Object.assign(menuForm, {
    menuName: '',
    menuIcon: '',
    menuType: 'menu',
    parentId: null,
    menuPath: '',
    component: '',
    permissionCode: '',
    sortOrder: 0,
    isVisible: true,
    isEnabled: true,
    remark: ''
  })
}

onMounted(() => {
  loadParentMenuOptions()
})
</script>

<style scoped>
.icon-picker {
  max-height: 500px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 16px 0;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.icon-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.icon-item.active {
  border-color: #409eff;
  background-color: #e6f7ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.icon-item .el-icon {
  font-size: 24px;
  color: #606266;
  margin-bottom: 8px;
}

.icon-item:hover .el-icon,
.icon-item.active .el-icon {
  color: #409eff;
}

.icon-name {
  font-size: 12px;
  color: #606266;
  text-align: center;
  word-break: break-all;
}

/* 滚动条样式 */
.icon-grid::-webkit-scrollbar {
  width: 6px;
}

.icon-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.icon-grid::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.icon-grid::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>