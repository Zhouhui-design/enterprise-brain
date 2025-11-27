<template>
  <div class="menu-permission-container">
    <el-card shadow="never" class="menu-permission-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">菜单权限管理</span>
          <div class="header-actions">
            <el-button 
              type="primary" 
              size="small"
              @click="savePermissions"
              :loading="saving"
              :disabled="!selectedRoleId || !hasChanges"
            >
              <el-icon><Check /></el-icon>
              保存权限
            </el-button>
            <el-button 
              type="success" 
              size="small"
              @click="copyPermissions"
              :disabled="!selectedRoleId || selectedPermissions.length === 0"
            >
              <el-icon><CopyDocument /></el-icon>
              复制权限
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 角色选择和权限概览 -->
      <div class="permission-overview">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="选择角色：">
              <el-select 
                v-model="selectedRoleId" 
                placeholder="请选择角色"
                @change="handleRoleChange"
                filterable
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="role in roles"
                  :key="role.id"
                  :label="role.roleName"
                  :value="role.id"
                >
                  <div class="role-option">
                    <span>{{ role.roleName }}</span>
                    <el-tag size="small" type="info">{{ role.roleCode }}</el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="权限统计：">
              <div class="permission-stats">
                <el-tag type="success" size="small">已选: {{ selectedPermissions.length }}</el-tag>
                <el-tag type="info" size="small">总计: {{ totalPermissions }}</el-tag>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="快速操作：">
              <el-button-group size="small">
                <el-button @click="selectAllPermissions">全选</el-button>
                <el-button @click="clearAllPermissions">清空</el-button>
                <el-button @click="expandAllTree">展开</el-button>
                <el-button @click="collapseAllTree">收起</el-button>
              </el-button-group>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
      
      <!-- 权限配置区域 -->
      <div class="permission-content" v-if="selectedRoleId">
        <el-row :gutter="16">
          <!-- 左侧菜单树 -->
          <el-col :span="16">
            <div class="menu-permission-tree">
              <div class="tree-header">
                <span>菜单权限配置</span>
                <div class="tree-search">
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
              
              <el-tree
                ref="permissionTree"
                :data="menuTreeData"
                :props="defaultProps"
                :filter-node-method="filterNode"
                :expand-on-click-node="false"
                @check-change="handleCheckChange"
                class="permission-tree"
                show-checkbox
                node-key="id"
                :default-expand-all="false"
                :check-strictly="false"
              >
                <template #default="{ node, data }">
                  <div class="permission-node-content">
                    <span class="menu-icon" v-if="data.menuIcon">
                      <el-icon :class="data.menuIcon"></el-icon>
                    </span>
                    <span class="menu-name">{{ data.menuName }}</span>
                    <span class="menu-path" v-if="data.menuPath">{{ data.menuPath }}</span>
                    <span class="permission-code" v-if="data.permissionCode">
                      {{ data.permissionCode }}
                    </span>
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
          </el-col>
          
          <!-- 右侧权限详情 -->
          <el-col :span="8">
            <div class="permission-details">
              <div class="details-header">
                <span>已选权限详情</span>
              </div>
              
              <!-- 权限分类展示 -->
              <el-tabs v-model="activePermissionTab" type="border-card">
                <el-tab-pane label="全部" name="all">
                  <div class="permission-list">
                    <div 
                      v-for="permission in selectedPermissions" 
                      :key="permission"
                      class="permission-item"
                    >
                      <span class="permission-name">{{ permission }}</span>
                      <el-button 
                        type="text" 
                        size="small"
                        icon="Close"
                        @click="removePermission(permission)"
                        title="移除"
                      />
                    </div>
                  </div>
                </el-tab-pane>
                
                <el-tab-pane label="菜单权限" name="menu">
                  <div class="permission-list">
                    <div 
                      v-for="permission in menuPermissions" 
                      :key="permission"
                      class="permission-item"
                    >
                      <span class="permission-name">{{ permission }}</span>
                      <el-button 
                        type="text" 
                        size="small"
                        icon="Close"
                        @click="removePermission(permission)"
                        title="移除"
                      />
                    </div>
                  </div>
                </el-tab-pane>
                
                <el-tab-pane label="按钮权限" name="button">
                  <div class="permission-list">
                    <div 
                      v-for="permission in buttonPermissions" 
                      :key="permission"
                      class="permission-item"
                    >
                      <span class="permission-name">{{ permission }}</span>
                      <el-button 
                        type="text" 
                        size="small"
                        icon="Close"
                        @click="removePermission(permission)"
                        title="移除"
                      />
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <el-empty 
          description="请选择角色以配置权限" 
          :image-size="120"
        />
      </div>
    </el-card>
    
    <!-- 权限模板管理 -->
    <el-card shadow="never" class="permission-template-card">
      <template #header>
        <div class="template-header">
          <span>权限模板</span>
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
          v-for="template in permissionTemplates" 
          :key="template.id"
          class="template-item"
          @click="applyTemplate(template)"
        >
          <div class="template-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="template-info">
            <h4>{{ template.name }}</h4>
            <p>{{ template.description }}</p>
            <div class="template-meta">
              <span>{{ template.permissionCount }} 个权限</span>
              <span>{{ template.createTime }}</span>
            </div>
          </div>
          <div class="template-actions">
            <el-button 
              type="text" 
              size="small"
              @click.stop="editTemplate(template)"
            >
              编辑
            </el-button>
            <el-button 
              type="text" 
              size="small"
              @click.stop="deleteTemplate(template.id)"
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
      :title="editingTemplate ? '编辑权限模板' : '创建权限模板'"
      width="600px"
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
        <el-form-item label="包含权限" prop="permissions">
          <el-transfer
            v-model="templateForm.permissions"
            :data="allPermissionsForTransfer"
            :titles="['可选权限', '已选权限']"
            :props="{ key: 'code', label: 'name' }"
            filterable
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showTemplateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTemplate">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 复制权限对话框 -->
    <el-dialog
      v-model="showCopyDialog"
      title="复制权限到其他角色"
      width="400px"
    >
      <el-form>
        <el-form-item label="目标角色">
          <el-select 
            v-model="targetRoleId" 
            placeholder="请选择目标角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.roleName"
              :value="role.id"
              :disabled="role.id === selectedRoleId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="复制选项">
          <el-checkbox-group v-model="copyOptions">
            <el-checkbox label="replace">覆盖现有权限</el-checkbox>
            <el-checkbox label="merge">合并现有权限</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCopyDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmCopy">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { 
  Check, CopyDocument, Search, Close, Plus, Document 
} from '@element-plus/icons-vue'
import { systemApi } from '@/services'

// 响应式数据
const permissionTree = ref(null)
const templateFormRef = ref(null)
const menuTreeData = ref([])
const roles = ref([])
const permissionTemplates = ref([])
const selectedRoleId = ref(null)
const selectedPermissions = ref([])
const originalPermissions = ref([])
const saving = ref(false)
const hasChanges = ref(false)
const menuSearchQuery = ref('')
const activePermissionTab = ref('all')
const showTemplateDialog = ref(false)
const showCopyDialog = ref(false)
const targetRoleId = ref(null)
const copyOptions = ref(['merge'])
const editingTemplate = ref(null)

// 表单数据
const templateForm = reactive({
  name: '',
  description: '',
  permissions: []
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
  permissions: [
    { required: true, message: '请选择权限', trigger: 'change' }
  ]
}

// 菜单树配置
const defaultProps = {
  children: 'children',
  label: 'menuName'
}

// 计算属性
const totalPermissions = computed(() => {
  const countPermissions = (menus) => {
    let count = 0
    menus.forEach(menu => {
      if (menu.permissionCode) {
        count++
      }
      if (menu.children && menu.children.length > 0) {
        count += countPermissions(menu.children)
      }
    })
    return count
  }
  return countPermissions(menuTreeData.value)
})

const menuPermissions = computed(() => {
  return selectedPermissions.value.filter(p => p.includes(':VIEW') || p.includes(':MENU'))
})

const buttonPermissions = computed(() => {
  return selectedPermissions.value.filter(p => !p.includes(':VIEW') && !p.includes(':MENU'))
})

const allPermissionsForTransfer = computed(() => {
  const collectPermissions = (menus, level = 0) => {
    let permissions = []
    menus.forEach(menu => {
      if (menu.permissionCode) {
        permissions.push({
          code: menu.permissionCode,
          name: `${menu.menuName} (${menu.permissionCode})`
        })
      }
      if (menu.children && menu.children.length > 0) {
        permissions = permissions.concat(collectPermissions(menu.children, level + 1))
      }
    })
    return permissions
  }
  return collectPermissions(menuTreeData.value)
})

// 加载菜单数据
const loadMenuData = async () => {
  try {
    const response = await systemApi.menu.getTree()
    menuTreeData.value = response.data || []
  } catch (error) {
    ElMessage.error('加载菜单失败: ' + (error.message || '未知错误'))
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

// 加载权限模板
const loadPermissionTemplates = async () => {
  try {
    // 模拟数据，实际应该调用API
    permissionTemplates.value = [
      {
        id: 1,
        name: '管理员模板',
        description: '包含所有权限的管理员模板',
        permissionCount: 25,
        createTime: '2024-01-01',
        permissions: ['SYSTEM:MENU:VIEW', 'SYSTEM:MENU:CREATE', 'SYSTEM:MENU:UPDATE', 'SYSTEM:MENU:DELETE']
      },
      {
        id: 2,
        name: '普通用户模板',
        description: '普通用户的基本权限模板',
        permissionCount: 10,
        createTime: '2024-01-02',
        permissions: ['SYSTEM:MENU:VIEW']
      }
    ]
  } catch (error) {
    console.error('加载权限模板失败:', error)
  }
}

// 加载角色权限
const loadRolePermissions = async (roleId) => {
  if (!roleId) {
    selectedPermissions.value = []
    originalPermissions.value = []
    if (permissionTree.value) {
      permissionTree.value.setCheckedKeys([])
    }
    return
  }
  
  try {
    const response = await systemApi.role.getPermissions(roleId)
    selectedPermissions.value = response.data || []
    originalPermissions.value = [...selectedPermissions.value]
    updateTreeCheckStatus()
  } catch (error) {
    ElMessage.error('加载角色权限失败: ' + (error.message || '未知错误'))
  }
}

// 更新树的选中状态
const updateTreeCheckStatus = () => {
  if (!permissionTree.value || !menuTreeData.value) return
  
  // 收集所有带权限码的菜单ID
  const permissionIds = []
  const collectPermissionIds = (menus) => {
    menus.forEach(menu => {
      if (menu.permissionCode && selectedPermissions.value.includes(menu.permissionCode)) {
        permissionIds.push(menu.id)
      }
      if (menu.children && menu.children.length > 0) {
        collectPermissionIds(menu.children)
      }
    })
  }
  collectPermissionIds(menuTreeData.value)
  
  // 设置选中状态
  permissionTree.value.setCheckedKeys(permissionIds)
}

// 处理选中状态变化
const handleCheckChange = (data, checked, indeterminate) => {
  if (data.permissionCode) {
    if (checked) {
      if (!selectedPermissions.value.includes(data.permissionCode)) {
        selectedPermissions.value.push(data.permissionCode)
      }
    } else {
      const index = selectedPermissions.value.indexOf(data.permissionCode)
      if (index > -1) {
        selectedPermissions.value.splice(index, 1)
      }
    }
  }
  
  // 检查是否有变化
  hasChanges.value = JSON.stringify(selectedPermissions.value) !== JSON.stringify(originalPermissions.value)
}

// 处理角色切换
const handleRoleChange = (roleId) => {
  loadRolePermissions(roleId)
}

// 节点过滤
const filterNode = (value, data) => {
  if (!value) return true
  return data.menuName.toLowerCase().includes(value.toLowerCase()) ||
         (data.permissionCode && data.permissionCode.toLowerCase().includes(value.toLowerCase()))
}

// 选择所有权限
const selectAllPermissions = () => {
  const allPermissions = []
  const collectAllPermissions = (menus) => {
    menus.forEach(menu => {
      if (menu.permissionCode) {
        allPermissions.push(menu.permissionCode)
      }
      if (menu.children && menu.children.length > 0) {
        collectAllPermissions(menu.children)
      }
    })
  }
  collectAllPermissions(menuTreeData.value)
  
  selectedPermissions.value = [...new Set([...selectedPermissions.value, ...allPermissions])]
  updateTreeCheckStatus()
  hasChanges.value = true
}

// 清空所有权限
const clearAllPermissions = () => {
  selectedPermissions.value = []
  if (permissionTree.value) {
    permissionTree.value.setCheckedKeys([])
  }
  hasChanges.value = true
}

// 展开树
const expandAllTree = () => {
  if (permissionTree.value) {
    const keys = []
    const collectKeys = (menus) => {
      menus.forEach(menu => {
        keys.push(menu.id)
        if (menu.children && menu.children.length > 0) {
          collectKeys(menu.children)
        }
      })
    }
    collectKeys(menuTreeData.value)
    permissionTree.value.store.defaultExpandAll()
  }
}

// 收起树
const collapseAllTree = () => {
  if (permissionTree.value) {
    permissionTree.value.store.defaultCollapseAll()
  }
}

// 移除权限
const removePermission = (permission) => {
  const index = selectedPermissions.value.indexOf(permission)
  if (index > -1) {
    selectedPermissions.value.splice(index, 1)
    updateTreeCheckStatus()
    hasChanges.value = true
  }
}

// 保存权限
const savePermissions = async () => {
  if (!selectedRoleId.value) {
    ElMessage.warning('请选择角色')
    return
  }
  
  saving.value = true
  try {
    await systemApi.role.assignPermissions(selectedRoleId.value, selectedPermissions.value)
    ElMessage.success('权限保存成功')
    originalPermissions.value = [...selectedPermissions.value]
    hasChanges.value = false
  } catch (error) {
    ElMessage.error('权限保存失败: ' + (error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

// 复制权限
const copyPermissions = () => {
  showCopyDialog.value = true
}

// 确认复制
const confirmCopy = async () => {
  if (!targetRoleId.value) {
    ElMessage.warning('请选择目标角色')
    return
  }
  
  try {
    let finalPermissions = [...selectedPermissions.value]
    
    if (copyOptions.value.includes('merge')) {
      const targetPermissions = await systemApi.role.getPermissions(targetRoleId.value)
      finalPermissions = [...new Set([...targetPermissions.data, ...finalPermissions])]
    }
    
    await systemApi.role.assignPermissions(targetRoleId.value, finalPermissions)
    ElMessage.success('权限复制成功')
    showCopyDialog.value = false
    targetRoleId.value = null
    copyOptions.value = ['merge']
  } catch (error) {
    ElMessage.error('权限复制失败: ' + (error.message || '未知错误'))
  }
}

// 应用模板
const applyTemplate = async (template) => {
  try {
    selectedPermissions.value = [...template.permissions]
    updateTreeCheckStatus()
    hasChanges.value = true
    ElMessage.success(`已应用模板"${template.name}"`)
  } catch (error) {
    ElMessage.error('应用模板失败')
  }
}

// 编辑模板
const editTemplate = (template) => {
  editingTemplate.value = template
  templateForm.name = template.name
  templateForm.description = template.description
  templateForm.permissions = [...template.permissions]
  showTemplateDialog.value = true
}

// 删除模板
const deleteTemplate = async (templateId) => {
  try {
    await ElMessageBox.confirm('确定要删除此模板吗？', '确认删除', {
      type: 'warning'
    })
    
    // 这里应该调用删除模板的API
    const index = permissionTemplates.value.findIndex(t => t.id === templateId)
    if (index > -1) {
      permissionTemplates.value.splice(index, 1)
    }
    
    ElMessage.success('模板删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 保存模板
const saveTemplate = async () => {
  try {
    await templateFormRef.value.validate()
    
    if (editingTemplate.value) {
      // 编辑现有模板
      const index = permissionTemplates.value.findIndex(t => t.id === editingTemplate.value.id)
      if (index > -1) {
        permissionTemplates.value[index] = {
          ...permissionTemplates.value[index],
          ...templateForm,
          permissionCount: templateForm.permissions.length
        }
      }
    } else {
      // 创建新模板
      const newTemplate = {
        id: Date.now(),
        ...templateForm,
        permissionCount: templateForm.permissions.length,
        createTime: new Date().toISOString().slice(0, 10)
      }
      permissionTemplates.value.push(newTemplate)
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
    permissions: []
  })
  editingTemplate.value = null
}

// 监听搜索
watch(menuSearchQuery, (value) => {
  if (permissionTree.value) {
    permissionTree.value.filter(value)
  }
})

onMounted(() => {
  loadMenuData()
  loadRoles()
  loadPermissionTemplates()
})
</script>

<style scoped>
.menu-permission-container {
  padding: 20px;
  min-height: calc(100vh - 60px);
  background-color: #f5f7fa;
}

.menu-permission-card,
.permission-template-card {
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

.permission-overview {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 6px;
}

.role-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.permission-stats {
  display: flex;
  gap: 8px;
}

.permission-content {
  min-height: 400px;
}

.menu-permission-tree {
  height: 100%;
  background-color: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
  font-weight: 500;
}

.permission-tree {
  background: transparent;
  max-height: 500px;
  overflow: auto;
  padding: 16px;
}

.permission-node-content {
  display: flex;
  align-items: center;
  padding: 4px 0;
  min-height: 32px;
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

.menu-path {
  margin: 0 8px;
  padding: 2px 6px;
  background-color: #ecf5ff;
  color: #409eff;
  font-size: 11px;
  border-radius: 3px;
  white-space: nowrap;
  font-family: 'Monaco', 'Menlo', monospace;
}

.permission-code {
  margin: 0 8px;
  padding: 2px 6px;
  background-color: #f0f9eb;
  color: #67c23a;
  font-size: 11px;
  border-radius: 3px;
  white-space: nowrap;
  font-family: 'Monaco', 'Menlo', monospace;
}

.permission-details {
  background-color: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
  height: 500px;
  display: flex;
  flex-direction: column;
}

.details-header {
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
  font-weight: 500;
}

.permission-list {
  max-height: 400px;
  overflow: auto;
  padding: 8px;
}

.permission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  background-color: #f8f9fa;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.permission-item:hover {
  background-color: #ecf5ff;
}

.permission-name {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #303133;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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

/* 滚动条样式 */
.permission-tree::-webkit-scrollbar,
.permission-list::-webkit-scrollbar {
  width: 6px;
}

.permission-tree::-webkit-scrollbar-track,
.permission-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.permission-tree::-webkit-scrollbar-thumb,
.permission-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.permission-tree::-webkit-scrollbar-thumb:hover,
.permission-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .menu-permission-container {
    padding: 12px;
  }
  
  .permission-overview .el-row {
    --el-row-gutter: 8px;
  }
  
  .permission-content .el-row {
    flex-direction: column;
  }
  
  .template-grid {
    grid-template-columns: 1fr;
  }
}
</style>