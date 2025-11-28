const TOKEN_KEY = 'admin_token'
const USER_KEY = 'user_info'
const PERMISSIONS_KEY = 'permissions'
const ROLE_KEY = 'roles'

// Token相关操作
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  return localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  return localStorage.removeItem(TOKEN_KEY)
}

// 用户信息操作
export function getUserInfo() {
  const userInfo = localStorage.getItem(USER_KEY)
  return userInfo ? JSON.parse(userInfo) : null
}

export function setUserInfo(userInfo) {
  return localStorage.setItem(USER_KEY, JSON.stringify(userInfo))
}

export function removeUserInfo() {
  return localStorage.removeItem(USER_KEY)
}

// 权限操作
export function getPermissions() {
  const permissions = localStorage.getItem(PERMISSIONS_KEY)
  return permissions ? JSON.parse(permissions) : []
}

export function setPermissions(permissions) {
  return localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions))
}

export function removePermissions() {
  return localStorage.removeItem(PERMISSIONS_KEY)
}

// 角色操作
export function getRoles() {
  const roles = localStorage.getItem(ROLE_KEY)
  return roles ? JSON.parse(roles) : []
}

export function setRoles(roles) {
  return localStorage.setItem(ROLE_KEY, JSON.stringify(roles))
}

export function removeRoles() {
  return localStorage.removeItem(ROLE_KEY)
}

// 清除所有认证信息
export function clearAuth() {
  removeToken()
  removeUserInfo()
  removePermissions()
  removeRoles()
}

// 检查是否有某个权限
export function hasPermission(permission) {
  const permissions = getPermissions()
  return permissions.includes(permission)
}

// 检查是否有某个角色
export function hasRole(role) {
  const roles = getRoles()
  return roles.includes(role)
}

// 检查是否有任意权限
export function hasAnyPermission(permissions) {
  const userPermissions = getPermissions()
  return permissions.some(permission => userPermissions.includes(permission))
}

// 检查是否有所有权限
export function hasAllPermissions(permissions) {
  const userPermissions = getPermissions()
  return permissions.every(permission => userPermissions.includes(permission))
}

// 检查是否为管理员
export function isAdmin() {
  return hasRole('admin') || hasRole('super_admin')
}

// 检查token是否过期（简单实现，实际应该解析JWT）
export function isTokenExpired() {
  const token = getToken()
  if (!token) return true
  
  try {
    // 这里简化处理，实际应该解析JWT的exp字段
    const payload = JSON.parse(atob(token.split('.')[1]))
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}