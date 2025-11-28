import request from '@/utils/request'

// 系统管理API服务
export const systemApi = {
  // 用户管理
  user: {
    // 获取用户列表
    getList: (params) => {
      return request.get('/system/users', params)
    },
    
    // 获取用户详情
    getDetail: (id) => {
      return request.get(`/system/users/${id}`)
    },
    
    // 创建用户
    create: (data) => {
      return request.post('/system/users', data)
    },
    
    // 更新用户
    update: (id, data) => {
      return request.put(`/system/users/${id}`, data)
    },
    
    // 删除用户
    delete: (id) => {
      return request.delete(`/system/users/${id}`)
    },
    
    // 重置密码
    resetPassword: (id, data) => {
      return request.put(`/system/users/${id}/password`, data)
    },
    
    // 启用/禁用用户
    updateStatus: (id, status) => {
      return request.put(`/system/users/${id}/status`, { status })
    }
  },

  // 角色管理
  role: {
    // 获取角色列表
    getList: (params) => {
      return request.get('/system/roles', params)
    },
    
    // 获取角色详情
    getDetail: (id) => {
      return request.get(`/system/roles/${id}`)
    },
    
    // 创建角色
    create: (data) => {
      return request.post('/system/roles', data)
    },
    
    // 更新角色
    update: (id, data) => {
      return request.put(`/system/roles/${id}`, data)
    },
    
    // 删除角色
    delete: (id) => {
      return request.delete(`/system/roles/${id}`)
    },
    
    // 分配权限
    assignPermissions: (id, permissions) => {
      return request.put(`/system/roles/${id}/permissions`, { permissions })
    }
  },

  // 权限管理
  permission: {
    // 获取权限树
    getTree: () => {
      return request.get('/system/permissions/tree')
    },
    
    // 获取权限列表
    getList: (params) => {
      return request.get('/system/permissions', params)
    },
    
    // 创建权限
    create: (data) => {
      return request.post('/system/permissions', data)
    },
    
    // 更新权限
    update: (id, data) => {
      return request.put(`/system/permissions/${id}`, data)
    },
    
    // 删除权限
    delete: (id) => {
      return request.delete(`/system/permissions/${id}`)
    }
  },

  // 部门管理
  department: {
    // 获取部门树
    getTree: () => {
      return request.get('/system/departments/tree')
    },
    
    // 获取部门列表
    getList: (params) => {
      return request.get('/system/departments', params)
    },
    
    // 获取部门详情
    getDetail: (id) => {
      return request.get(`/system/departments/${id}`)
    },
    
    // 创建部门
    create: (data) => {
      return request.post('/system/departments', data)
    },
    
    // 更新部门
    update: (id, data) => {
      return request.put(`/system/departments/${id}`, data)
    },
    
    // 删除部门
    delete: (id) => {
      return request.delete(`/system/departments/${id}`)
    }
  },

  // 字典管理
  dictionary: {
    // 获取字典类型列表
    getTypeList: (params) => {
      return request.get('/system/dictionaries/types', params)
    },
    
    // 获取字典数据列表
    getDataList: (typeCode, params) => {
      return request.get(`/system/dictionaries/data/${typeCode}`, params)
    },
    
    // 创建字典类型
    createType: (data) => {
      return request.post('/system/dictionaries/types', data)
    },
    
    // 更新字典类型
    updateType: (id, data) => {
      return request.put(`/system/dictionaries/types/${id}`, data)
    },
    
    // 删除字典类型
    deleteType: (id) => {
      return request.delete(`/system/dictionaries/types/${id}`)
    },
    
    // 创建字典数据
    createData: (data) => {
      return request.post('/system/dictionaries/data', data)
    },
    
    // 更新字典数据
    updateData: (id, data) => {
      return request.put(`/system/dictionaries/data/${id}`, data)
    },
    
    // 删除字典数据
    deleteData: (id) => {
      return request.delete(`/system/dictionaries/data/${id}`)
    }
  },

  // 系统配置
  config: {
    // 获取配置列表
    getList: (params) => {
      return request.get('/system/configs', params)
    },
    
    // 获取配置详情
    getDetail: (key) => {
      return request.get(`/system/configs/${key}`)
    },
    
    // 更新配置
    update: (key, data) => {
      return request.put(`/system/configs/${key}`, data)
    },
    
    // 批量更新配置
    batchUpdate: (configs) => {
      return request.put('/system/configs/batch', { configs })
    }
  },

  // 系统监控
  monitor: {
    // 获取系统信息
    getSystemInfo: () => {
      return request.get('/system/monitor/system-info')
    },
    
    // 获取服务状态
    getServiceStatus: () => {
      return request.get('/system/monitor/service-status')
    },
    
    // 获取性能指标
    getPerformanceMetrics: () => {
      return request.get('/system/monitor/performance')
    },
    
    // 获取错误日志
    getErrorLogs: (params) => {
      return request.get('/system/monitor/error-logs', params)
    },
    
    // 清理系统缓存
    clearCache: () => {
      return request.post('/system/monitor/clear-cache')
    }
  },

  // 操作日志
  log: {
    // 获取操作日志列表
    getList: (params) => {
      return request.get('/system/logs', params)
    },
    
    // 获取日志详情
    getDetail: (id) => {
      return request.get(`/system/logs/${id}`)
    },
    
    // 导出日志
    export: (params) => {
      return request.download('/system/logs/export', params, 'operation-logs.xlsx')
    },
    
    // 清理日志
    clean: (params) => {
      return request.delete('/system/logs/clean', params)
    }
  }
}