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
            >
              保存权限
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 权限配置表单 -->
      <div class="permission-content">
        <el-tree
          ref="permissionTree"
          :data="menuTreeData"
          :props="defaultProps"
          :expand-on-click-node="false"
          @check-change="handleCheckChange"
          class="permission-tree"
          show-checkbox
          node-key="id"
          default-expand-all
        >
          <template #default="{ node, data }">
            <div class="permission-node-content">
              <span class="menu-icon" v-if="data.menuIcon">
                <i :class="data.menuIcon"></i>
              </span>
              <span class="menu-name">{{ data.menuName }}</span>
              <span class="permission-code" v-if="data.permissionCode">
                {{ data.permissionCode }}
              </span>
            </div>
          </template>
        </el-tree>
        
        <!-- 角色选择器 -->
        <div class="role-selector">
          <el-form-item label="选择角色：">
            <el-select 
              v-model="selectedRoleId" 
              placeholder="请选择角色"
              @change="handleRoleChange"
              filterable
              clearable
            >
              <el-option
                v-for="role in roles"
                :key="role.id"
                :label="role.roleName"
                :value="role.id"
              >
                <div class="role-option">
                  <span>{{ role.roleName }}</span>
                  <span class="role-code">{{ role.roleCode }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </div>
        
        <!-- 权限列表预览 -->
        <div class="permission-list-preview">
          <h4>已选权限</h4>
          <div class="permission-tags">
            <el-tag 
              v-for="permission in selectedPermissions" 
              :key="permission"
              closable
              @close="removePermission(permission)"
              class="permission-tag"
            >
              {{ permission }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

export default {
  name: 'MenuPermission',
  setup() {
    const permissionTree = ref(null)
    const menuTreeData = ref([])
    const roles = ref([])
    const selectedRoleId = ref(null)
    const selectedPermissions = ref([])
    const saving = ref(false)
    
    // 菜单树配置
    const defaultProps = {
      children: 'children',
      label: 'menuName'
    }
    
    // 加载菜单数据
    const loadMenuData = async () => {
      try {
        const response = await axios.get('/api/system/menu/tree/full')
        menuTreeData.value = response.data
      } catch (error) {
        ElMessage.error('加载菜单失败')
      }
    }
    
    // 加载角色列表
    const loadRoles = async () => {
      try {
        // 假设这里调用获取角色的接口
        // const response = await axios.get('/api/system/role/list')
        // roles.value = response.data
        
        // 模拟数据
        roles.value = [
          { id: 1, roleName: '超级管理员', roleCode: 'SUPER_ADMIN' },
          { id: 2, roleName: '系统管理员', roleCode: 'SYSTEM_ADMIN' },
          { id: 3, roleName: '普通用户', roleCode: 'NORMAL_USER' }
        ]
      } catch (error) {
        ElMessage.error('加载角色失败')
      }
    }
    
    // 加载角色权限
    const loadRolePermissions = async (roleId) => {
      if (!roleId) {
        selectedPermissions.value = []
        if (permissionTree.value) {
          permissionTree.value.setCheckedKeys([])
        }
        return
      }
      
      try {
        // 假设这里调用获取角色权限的接口
        // const response = await axios.get(`/api/system/role/${roleId}/permissions`)
        // selectedPermissions.value = response.data
        
        // 模拟数据
        if (roleId === 1) {
          selectedPermissions.value = ['SYSTEM:MENU:VIEW', 'SYSTEM:MENU:CREATE', 'SYSTEM:MENU:UPDATE', 'SYSTEM:MENU:DELETE']
        } else if (roleId === 2) {
          selectedPermissions.value = ['SYSTEM:MENU:VIEW', 'SYSTEM:MENU:UPDATE']
        } else {
          selectedPermissions.value = ['SYSTEM:MENU:VIEW']
        }
        
        // 更新树的选中状态
        updateTreeCheckStatus()
      } catch (error) {
        ElMessage.error('加载角色权限失败')
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
    }
    
    // 处理角色切换
    const handleRoleChange = (roleId) => {
      loadRolePermissions(roleId)
    }
    
    // 移除权限
    const removePermission = (permission) => {
      const index = selectedPermissions.value.indexOf(permission)
      if (index > -1) {
        selectedPermissions.value.splice(index, 1)
        updateTreeCheckStatus()
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
        // 假设这里调用保存角色权限的接口
        // await axios.post(`/api/system/role/${selectedRoleId.value}/permissions`, {
        //   permissions: selectedPermissions.value
        // })
        
        // 模拟保存成功
        setTimeout(() => {
          ElMessage.success('权限保存成功')
          saving.value = false
        }, 500)
      } catch (error) {
        ElMessage.error('权限保存失败')
        saving.value = false
      }
    }
    
    onMounted(() => {
      loadMenuData()
      loadRoles()
    })
    
    return {
      permissionTree,
      menuTreeData,
      roles,
      selectedRoleId,
      selectedPermissions,
      defaultProps,
      saving,
      handleCheckChange,
      handleRoleChange,
      removePermission,
      savePermissions
    }
  }
}
</script>

<style scoped>
.menu-permission-container {
  padding: 20px;
  min-height: calc(100vh - 60px);
  background-color: #f5f7fa;
}

.menu-permission-card {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
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

.permission-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.permission-tree {
  background-color: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 20px;
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

.permission-code {
  margin: 0 12px;
  padding: 2px 8px;
  background-color: #f0f9eb;
  color: #67c23a;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  border-radius: 4px;
  white-space: nowrap;
}

.role-selector {
  background-color: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 20px;
}

.role-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.role-code {
  font-size: 12px;
  color: #909399;
  font-family: 'Monaco', 'Menlo', monospace;
}

.permission-list-preview {
  background-color: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 20px;
}

.permission-list-preview h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.permission-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.permission-tag {
  font-family: 'Monaco', 'Menlo', monospace;
}
</style>