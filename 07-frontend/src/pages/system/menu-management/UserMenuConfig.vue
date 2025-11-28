<template>
  <div class="user-menu-config-container">
    <el-card shadow="never" class="user-config-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">用户菜单配置</span>
          <div class="header-actions">
            <el-button 
              type="primary" 
              size="small"
              @click="saveUserMenuConfig"
              :loading="saving"
              :disabled="!selectedUserId || !hasChanges"
            >
              <el-icon><Check /></el-icon>
              保存配置
            </el-button>
            <el-button 
              type="success" 
              size="small"
              @click="resetToDefault"
              :disabled="!selectedUserId"
            >
              <el-icon><RefreshLeft /></el-icon>
              重置默认
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 用户选择区域 -->
      <div class="user-selection">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="选择用户：">
              <el-select 
                v-model="selectedUserId" 
                placeholder="请选择用户"
                @change="handleUserChange"
                filterable
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="user in users"
                  :key="user.id"
                  :label="user.realName || user.username"
                  :value="user.id"
                >
                  <div class="user-option">
                    <div class="user-info">
                      <span class="user-name">{{ user.realName || user.username }}</span>
                      <span class="user-username">@{{ user.username }}</span>
                    </div>
                    <div class="user-role">
                      <el-tag size="small" type="info">{{ user.roleName }}</el-tag>
                    </div>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="所属部门：">
              <el-input 
                v-model="selectedUserDept" 
                readonly
                placeholder="请先选择用户"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="用户状态：">
              <el-tag 
                :type="selectedUserStatus === 'enabled' ? 'success' : 'danger'"
                v-if="selectedUserId"
              >
                {{ selectedUserStatus === 'enabled' ? '正常' : '禁用' }}
              </el-tag>
              <span v-else class="placeholder-text">请先选择用户</span>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
      
      <!-- 用户菜单配置区域 -->
      <div class="menu-config-content" v-if="selectedUserId">
        <el-row :gutter="16">
          <!-- 左侧可用菜单 -->
          <el-col :span="12">
            <div class="available-menus">
              <div class="panel-header">
                <span>可用菜单</span>
                <div class="panel-actions">
                  <el-input
                    v-model="menuSearchQuery"
                    placeholder="搜索菜单..."
                    clearable
                    size="small"
                    style="width: 200px"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                </div>
              </div>
              
              <div class="menu-list">
                <el-tree
                  ref="availableTree"
                  :data="availableMenus"
                  :props="defaultProps"
                  :filter-node-method="filterNode"
                  :expand-on-click-node="false"
                  @check-change="handleAvailableCheckChange"
                  show-checkbox
                  node-key="id"
                  :default-expand-all="false"
                >
                  <template #default="{ node, data }">
                    <div class="menu-tree-node">
                      <span class="menu-icon" v-if="data.menuIcon">
                        <el-icon :class="data.menuIcon"></el-icon>
                      </span>
                      <span class="menu-name">{{ data.menuName }}</span>
                      <el-tag 
                        v-if="data.isMenu" 
                        type="primary" 
                        size="small"
                      >
                        菜单
                      </el-tag>
                      <el-tag 
                        v-else-if="data.isButton" 
                        type="warning" 
                        size="small"
                      >
                        按钮
                      </el-tag>
                    </div>
                  </template>
                </el-tree>
              </div>
            </div>
          </el-col>
          
          <!-- 右侧已选菜单 -->
          <el-col :span="12">
            <div class="selected-menus">
              <div class="panel-header">
                <span>已选菜单</span>
                <div class="panel-actions">
                  <el-button-group size="small">
                    <el-button @click="moveAllToAvailable">全部移回</el-button>
                    <el-button @click="expandAllSelected">展开</el-button>
                    <el-button @click="collapseAllSelected">收起</el-button>
                  </el-button-group>
                </div>
              </div>
              
              <div class="selected-menu-list">
                <el-tree
                  ref="selectedTree"
                  :data="selectedMenus"
                  :props="defaultProps"
                  :expand-on-click-node="false"
                  node-key="id"
                  :default-expand-all="false"
                  draggable
                  @node-drag-start="handleDragStart"
                  @node-drag-end="handleDragEnd"
                >
                  <template #default="{ node, data }">
                    <div class="selected-tree-node">
                      <el-icon class="drag-handle"><Rank /></el-icon>
                      <span class="menu-icon" v-if="data.menuIcon">
                        <el-icon :class="data.menuIcon"></el-icon>
                      </span>
                      <span class="menu-name">{{ data.menuName }}</span>
                      <span class="sort-order">#{{ node.data.sortOrder || 0 }}</span>
                      <el-button 
                        type="text" 
                        size="small"
                        icon="Close"
                        @click="removeSelectedMenu(data)"
                        title="移除"
                      />
                    </div>
                  </template>
                </el-tree>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <el-empty 
          description="请选择用户以配置菜单" 
          :image-size="120"
        />
      </div>
    </el-card>
    
    <!-- 菜单配置模板 -->
    <el-card shadow="never" class="menu-template-card">
      <template #header>
        <div class="template-header">
          <span>菜单配置模板</span>
          <el-button 
            type="primary" 
            size="small"
            @click="showTemplateDialog = true"
          >
            <el-icon><Plus /></el-icon>
            创建模板
          </el-button>
        </div>
      </template>
      
      <div class="template-grid">
        <div 
          v-for="template in menuTemplates" 
          :key="template.id"
          class="template-item"
          @click="applyMenuTemplate(template)"
        >
          <div class="template-icon">
            <el-icon><Collection /></el-icon>
          </div>
          <div class="template-info">
            <h4>{{ template.name }}</h4>
            <p>{{ template.description }}</p>
            <div class="template-meta">
              <span>{{ template.menuCount }} 个菜单</span>
              <span>{{ template.createTime }}</span>
            </div>
          </div>
          <div class="template-actions">
            <el-button 
              type="text" 
              size="small"
              @click.stop="editMenuTemplate(template)"
            >
              编辑
            </el-button>
            <el-button 
              type="text" 
              size="small"
              @click.stop="deleteMenuTemplate(template.id)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 创建/编辑模板对话框 -->
    <el-dialog
      v-model="showTemplateDialog"
      :title="editingTemplate ? '编辑菜单模板' : '创建菜单模板'"
      width="700px"
    >
      <el-form :model="templateForm" :rules="templateRules" ref="templateFormRef">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板描述" prop="description">
          <el-input 
            v-model="templateForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入模板描述"
          />
        </el-form-item>
        <el-form-item label="适用角色" prop="roles">
          <el-select 
            v-model="templateForm.roles" 
            multiple
            placeholder="请选择适用角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.roleName"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="包含菜单" prop="menus">
          <div class="menu-transfer">
            <el-transfer
              v-model="templateForm.menus"
              :data="allMenusForTransfer"
              :titles="['可选菜单', '已选菜单']"
              :props="{ key: 'id', label: 'menuName' }"
              filterable
              :render-content="renderTransferContent"
            />
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showTemplateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMenuTemplate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { 
  Check, RefreshLeft, Search, Close, Plus, 
  Collection, Rank 
} from '@element-plus/icons-vue'
import { systemApi, commonApi } from '@/services'

// 响应式数据
const availableTree = ref(null)
const selectedTree = ref(null)
const templateFormRef = ref(null)
const users = ref([])
const roles = ref([])
const availableMenus = ref([])
const selectedMenus = ref([])
const originalSelectedMenus = ref([])
const menuTemplates = ref([])
const selectedUserId = ref(null)
const selectedUserDept = ref('')
const selectedUserStatus = ref('')
const menuSearchQuery = ref('')
const showTemplateDialog = ref(false)
const editingTemplate = ref(null)
const saving = ref(false)
const hasChanges = ref(false)
const isDragging = ref(false)

// 表单数据
const templateForm = reactive({
  name: '',
  description: '',
  roles: [],
  menus: []
})

// 表单验证规则
const templateRules = {
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入模板描述', trigger: 'blur' }
  ],
  roles: [
    { required: true, message: '请选择适用角色', trigger: 'change' }
  ],
  menus: [
    { required: true, message: '请选择菜单', trigger: 'change' }
  ]
}

// 菜单树配置
const defaultProps = {
  children: 'children',
  label: 'menuName'
}

// 计算属性
const allMenusForTransfer = computed(() => {
  const collectMenus = (menus, level = 0) => {
    let menuList = []
    menus.forEach(menu => {
      if (menu.isMenu) { // 只包含菜单，不包含按钮
        menuList.push({
          id: menu.id,
          menuName: `${'  '.repeat(level)}${menu.menuName}`,
          originalName: menu.menuName,
          level
        })
      }
      if (menu.children && menu.children.length > 0) {
        menuList = menuList.concat(collectMenus(menu.children, level + 1))
      }
    })
    return menuList
  }
  return collectMenus(availableMenus.value)
})

// 加载用户列表
const loadUsers = async () => {
  try {
    const response = await systemApi.user.getList({ page: 1, size: 1000 })
    users.value = response.data?.list || []
  } catch (error) {
    ElMessage.error('加载用户失败: ' + (error.message || '未知错误'))
  }
}

// 加载角色列表
const loadRoles = async () => {
  try {
    const response = await systemApi.role.getList()
    roles.value = response.data || []
  } catch (error) {
    ElMessage.error('加载角色失败: ' + (error.message || '未知错误'))
  }
}

// 加载可用菜单
const loadAvailableMenus = async () => {
  try {
    const response = await systemApi.menu.getTree()
    availableMenus.value = response.data || []
  } catch (error) {
    ElMessage.error('加载菜单失败: ' + (error.message || '未知错误'))
  }
}

// 加载用户菜单配置
const loadUserMenuConfig = async (userId) => {
  if (!userId) {
    selectedMenus.value = []
    originalSelectedMenus.value = []
    return
  }
  
  try {
    const response = await systemApi.user.getMenuConfig(userId)
    selectedMenus.value = response.data?.menus || []
    originalSelectedMenus.value = JSON.parse(JSON.stringify(selectedMenus.value))
    
    // 更新可用菜单的选中状态
    updateAvailableMenuCheck()
  } catch (error) {
    ElMessage.error('加载用户菜单配置失败: ' + (error.message || '未知错误'))
  }
}

// 更新用户信息
const updateUserInfo = (userId) => {
  const user = users.value.find(u => u.id === userId)
  if (user) {
    selectedUserDept.value = user.departmentName || '未分配'
    selectedUserStatus.value = user.isEnabled ? 'enabled' : 'disabled'
  }
}

// 处理用户切换
const handleUserChange = (userId) => {
  updateUserInfo(userId)
  loadUserMenuConfig(userId)
}

// 更新可用菜单选中状态
const updateAvailableMenuCheck = () => {
  if (!availableTree.value) return
  
  const selectedIds = getMenuIds(selectedMenus.value)
  availableTree.value.setCheckedKeys(selectedIds)
}

// 获取菜单ID列表
const getMenuIds = (menus) => {
  const ids = []
  const collectIds = (menuList) => {
    menuList.forEach(menu => {
      ids.push(menu.id)
      if (menu.children && menu.children.length > 0) {
        collectIds(menu.children)
      }
    })
  }
  collectIds(menus)
  return ids
}

// 处理可用菜单选中变化
const handleAvailableCheckChange = (data, checked) => {
  if (checked) {
    addMenuToSelected(data)
  } else {
    removeMenuFromSelected(data.id)
  }
  hasChanges.value = true
}

// 添加菜单到已选
const addMenuToSelected = (menu) => {
  const addToSelected = (targetMenu, parentMenu = null) => {
    const newMenu = { ...targetMenu, children: [] }
    
    if (parentMenu) {
      // 添加到父菜单下
      const existingParent = findMenuInSelected(parentMenu.id)
      if (existingParent) {
        if (!existingParent.children) {
          existingParent.children = []
        }
        existingParent.children.push(newMenu)
      }
    } else {
      // 添加到根级
      selectedMenus.value.push(newMenu)
    }
    
    // 递归添加子菜单
    if (targetMenu.children && targetMenu.children.length > 0) {
      targetMenu.children.forEach(child => {
        addToSelected(child, newMenu)
      })
    }
  }
  
  // 检查是否已经存在
  const existing = findMenuInSelected(menu.id)
  if (!existing) {
    addToSelected(menu)
  }
}

// 从已选菜单中移除
const removeMenuFromSelected = (menuId) => {
  const removeFromParent = (menus, targetId) => {
    for (let i = 0; i < menus.length; i++) {
      if (menus[i].id === targetId) {
        menus.splice(i, 1)
        return true
      }
      if (menus[i].children && removeFromParent(menus[i].children, targetId)) {
        return true
      }
    }
    return false
  }
  
  removeFromParent(selectedMenus.value, menuId)
}

// 查找菜单
const findMenuInSelected = (menuId) => {
  const findInList = (menus) => {
    for (const menu of menus) {
      if (menu.id === menuId) {
        return menu
      }
      if (menu.children) {
        const found = findInList(menu.children)
        if (found) return found
      }
    }
    return null
  }
  return findInList(selectedMenus.value)
}

// 移除已选菜单
const removeSelectedMenu = (menu) => {
  removeMenuFromSelected(menu.id)
  updateAvailableMenuCheck()
  hasChanges.value = true
}

// 移动全部到可用
const moveAllToAvailable = () => {
  selectedMenus.value = []
  updateAvailableMenuCheck()
  hasChanges.value = true
}

// 展开全部已选
const expandAllSelected = () => {
  if (selectedTree.value) {
    selectedTree.value.store.defaultExpandAll()
  }
}

// 收起全部已选
const collapseAllSelected = () => {
  if (selectedTree.value) {
    selectedTree.value.store.defaultCollapseAll()
  }
}

// 拖拽开始
const handleDragStart = () => {
  isDragging.value = true
}

// 拖拽结束
const handleDragEnd = () => {
  isDragging.value = false
  hasChanges.value = true
}

// 节点过滤
const filterNode = (value, data) => {
  if (!value) return true
  return data.menuName.toLowerCase().includes(value.toLowerCase())
}

// 保存用户菜单配置
const saveUserMenuConfig = async () => {
  if (!selectedUserId.value) {
    ElMessage.warning('请选择用户')
    return
  }
  
  saving.value = true
  try {
    const menuConfig = {
      userId: selectedUserId.value,
      menus: selectedMenus.value
    }
    
    await systemApi.user.updateMenuConfig(selectedUserId.value, menuConfig)
    ElMessage.success('菜单配置保存成功')
    
    originalSelectedMenus.value = JSON.parse(JSON.stringify(selectedMenus.value))
    hasChanges.value = false
  } catch (error) {
    ElMessage.error('保存失败: ' + (error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

// 重置为默认
const resetToDefault = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置为默认菜单配置吗？',
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 获取用户角色的默认菜单
    const user = users.value.find(u => u.id === selectedUserId.value)
    if (user && user.roleId) {
      const roleMenus = await systemApi.role.getMenuConfig(user.roleId)
      selectedMenus.value = roleMenus.data?.menus || []
      updateAvailableMenuCheck()
      hasChanges.value = true
      
      ElMessage.success('已重置为默认菜单配置')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重置失败')
    }
  }
}

// 加载菜单模板
const loadMenuTemplates = async () => {
  try {
    // 模拟数据，实际应该调用API
    menuTemplates.value = [
      {
        id: 1,
        name: '管理员配置',
        description: '包含所有管理功能的完整菜单配置',
        menuCount: 15,
        createTime: '2024-01-01',
        roles: [1],
        menus: [1, 2, 3, 4, 5]
      },
      {
        id: 2,
        name: '普通员工配置',
        description: '普通员工的基本菜单配置',
        menuCount: 8,
        createTime: '2024-01-02',
        roles: [2, 3],
        menus: [1, 2, 3]
      }
    ]
  } catch (error) {
    console.error('加载菜单模板失败:', error)
  }
}

// 应用菜单模板
const applyMenuTemplate = async (template) => {
  try {
    // 根据模板菜单ID获取完整菜单数据
    const templateMenus = []
    const collectMenus = (menus) => {
      menus.forEach(menu => {
        if (template.menus.includes(menu.id)) {
          templateMenus.push(menu)
        }
        if (menu.children) {
          collectMenus(menu.children)
        }
      })
    }
    collectMenus(availableMenus.value)
    
    selectedMenus.value = buildMenuTree(templateMenus, template.menus)
    updateAvailableMenuCheck()
    hasChanges.value = true
    
    ElMessage.success(`已应用模板"${template.name}"`)
  } catch (error) {
    ElMessage.error('应用模板失败')
  }
}

// 构建菜单树
const buildMenuTree = (menus, menuIds) => {
  const menuMap = new Map()
  menus.forEach(menu => {
    menuMap.set(menu.id, { ...menu, children: [] })
  })
  
  const rootMenus = []
  menuIds.forEach(id => {
    const menu = menuMap.get(id)
    if (menu) {
      if (!menu.parentId) {
        rootMenus.push(menu)
      } else {
        const parent = menuMap.get(menu.parentId)
        if (parent) {
          parent.children.push(menu)
        }
      }
    }
  })
  
  return rootMenus
}

// 编辑菜单模板
const editMenuTemplate = (template) => {
  editingTemplate.value = template
  templateForm.name = template.name
  templateForm.description = template.description
  templateForm.roles = [...template.roles]
  templateForm.menus = [...template.menus]
  showTemplateDialog.value = true
}

// 删除菜单模板
const deleteMenuTemplate = async (templateId) => {
  try {
    await ElMessageBox.confirm('确定要删除此模板吗？', '确认删除', {
      type: 'warning'
    })
    
    const index = menuTemplates.value.findIndex(t => t.id === templateId)
    if (index > -1) {
      menuTemplates.value.splice(index, 1)
    }
    
    ElMessage.success('模板删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 保存菜单模板
const saveMenuTemplate = async () => {
  try {
    await templateFormRef.value.validate()
    
    if (editingTemplate.value) {
      const index = menuTemplates.value.findIndex(t => t.id === editingTemplate.value.id)
      if (index > -1) {
        menuTemplates.value[index] = {
          ...menuTemplates.value[index],
          ...templateForm,
          menuCount: templateForm.menus.length
        }
      }
    } else {
      const newTemplate = {
        id: Date.now(),
        ...templateForm,
        menuCount: templateForm.menus.length,
        createTime: new Date().toISOString().slice(0, 10)
      }
      menuTemplates.value.push(newTemplate)
    }
    
    ElMessage.success(editingTemplate.value ? '模板更新成功' : '模板创建成功')
    showTemplateDialog.value = false
    resetTemplateForm()
  } catch (error) {
    console.error('保存模板失败:', error)
  }
}

// 重置模板表单
const resetTemplateForm = () => {
  Object.assign(templateForm, {
    name: '',
    description: '',
    roles: [],
    menus: []
  })
  editingTemplate.value = null
}

// 渲染穿梭框内容
const renderTransferContent = (h, option) => {
  return h('span', {
    style: {
      marginLeft: `${option.level * 20}px`
    }
  }, option.originalName)
}

// 监听搜索
watch(menuSearchQuery, (value) => {
  if (availableTree.value) {
    availableTree.value.filter(value)
  }
})

onMounted(() => {
  loadUsers()
  loadRoles()
  loadAvailableMenus()
  loadMenuTemplates()
})
</script>

<style scoped>
.user-menu-config-container {
  padding: 20px;
  min-height: calc(vh - 60px);
  background-color: #f5f7fa;
}

.user-config-card,
.menu-template-card {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.card-header,
.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.user-selection {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 6px;
}

.user-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #303133;
}

.user-username {
  font-size: 12px;
  color: #909399;
}

.user-role {
  margin-left: 8px;
}

.placeholder-text {
  color: #c0c4cc;
  font-style: italic;
}

.menu-config-content {
  min-height: 500px;
}

.available-menus,
.selected-menus {
  height: 500px;
  background-color: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
  font-weight: 500;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-list {
  height: calc(100% - 50px);
  overflow: auto;
  padding: 16px;
}

.selected-menu-list {
  height: calc(100% - 50px);
  overflow: auto;
  padding: 16px;
}

.menu-tree-node,
.selected-tree-node {
  display: flex;
  align-items: center;
  padding: 4px 0;
  min-height: 32px;
}

.selected-tree-node {
  cursor: move;
}

.drag-handle {
  margin-right: 8px;
  color: #c0c4cc;
  font-size: 16px;
}

.selected-tree-node:hover .drag-handle {
  color: #409eff;
}

.menu-icon {
  margin-right: 8px;
  color: #606266;
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.menu-name {
  flex: 1;
  font-weight: 500;
  color: #303133;
}

.sort-order {
  margin: 0 8px;
  padding: 2px 6px;
  background-color: #e6f7ff;
  color: #1890ff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 3px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.template-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.template-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.template-icon {
  margin-right: 12px;
  color: #409eff;
  font-size: 24px;
}

.template-info {
  flex: 1;
}

.template-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #303133;
}

.template-info p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
}

.template-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #909399;
}

.template-actions {
  display: none;
  flex-direction: column;
  gap: 4px;
}

.template-item:hover .template-actions {
  display: flex;
}

.menu-transfer {
  width: 100%;
  max-height: 300px;
}

/* 滚动条样式 */
.menu-list::-webkit-scrollbar,
.selected-menu-list::-webkit-scrollbar {
  width: 6px;
}

.menu-list::-webkit-scrollbar-track,
.selected-menu-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.menu-list::-webkit-scrollbar-thumb,
.selected-menu-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.menu-list::-webkit-scrollbar-thumb:hover,
.selected-menu-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-menu-config-container {
    padding: 12px;
  }
  
  .user-selection .el-row {
    --el-row-gutter: 8px;
  }
  
  .menu-config-content .el-row {
    flex-direction: column;
  }
  
  .available-menus,
  .selected-menus {
    height: 400px;
    margin-bottom: 16px;
  }
  
  .template-grid {
    grid-template-columns: 1fr;
  }
}
</style>