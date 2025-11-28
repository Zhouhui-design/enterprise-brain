/**
 * 系统初始化相关API
 */
import request from '@/services/utils/request'

/**
 * 系统初始化API
 */
export const systemInitApi = {
  /**
   * 执行系统初始化
   * @param {Object} params - 初始化参数
   */
  executeInit(params) {
    return request({
      url: '/api/system/init/execute',
      method: 'post',
      data: params
    })
  },

  /**
   * 检查系统初始化状态
   */
  checkInitStatus() {
    return request({
      url: '/api/system/init/status',
      method: 'get'
    })
  },

  /**
   * 获取初始化配置项
   */
  getInitConfig() {
    return request({
      url: '/api/system/init/config',
      method: 'get'
    })
  },

  /**
   * 验证系统环境
   */
  validateEnvironment() {
    return request({
      url: '/api/system/init/validate-env',
      method: 'post'
    })
  }
}

/**
 * 数据重置API
 */
export const dataResetApi = {
  /**
   * 执行数据重置
   * @param {Object} params - 重置参数
   */
  executeReset(params) {
    return request({
      url: '/api/system/reset/execute',
      method: 'post',
      data: params
    })
  },

  /**
   * 获取可重置的数据类型
   */
  getResetTypes() {
    return request({
      url: '/api/system/reset/types',
      method: 'get'
    })
  },

  /**
   * 预览重置影响
   * @param {Object} params - 重置参数
   */
  previewReset(params) {
    return request({
      url: '/api/system/reset/preview',
      method: 'post',
      data: params
    })
  }
}

/**
 * 数据备份API
 */
export const dataBackupApi = {
  /**
   * 创建备份
   * @param {Object} params - 备份参数
   */
  createBackup(params) {
    return request({
      url: '/api/system/backup/create',
      method: 'post',
      data: params
    })
  },

  /**
   * 获取备份列表
   * @param {Object} params - 查询参数
   */
  getBackupList(params) {
    return request({
      url: '/api/system/backup/list',
      method: 'get',
      params
    })
  },

  /**
   * 删除备份
   * @param {String} backupId - 备份ID
   */
  deleteBackup(backupId) {
    return request({
      url: `/api/system/backup/${backupId}`,
      method: 'delete'
    })
  },

  /**
   * 下载备份文件
   * @param {String} backupId - 备份ID
   */
  downloadBackup(backupId) {
    return request({
      url: `/api/system/backup/download/${backupId}`,
      method: 'get',
      responseType: 'blob'
    })
  },

  /**
   * 获取备份详情
   * @param {String} backupId - 备份ID
   */
  getBackupDetail(backupId) {
    return request({
      url: `/api/system/backup/${backupId}`,
      method: 'get'
    })
  }
}

/**
 * 数据恢复API
 */
export const dataRestoreApi = {
  /**
   * 执行数据恢复
   * @param {Object} params - 恢复参数
   */
  executeRestore(params) {
    return request({
      url: '/api/system/restore/execute',
      method: 'post',
      data: params
    })
  },

  /**
   * 上传备份文件
   * @param {FormData} formData - 文件数据
   */
  uploadBackup(formData) {
    return request({
      url: '/api/system/restore/upload',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * 验证备份文件
   * @param {String} backupId - 备份ID
   */
  validateBackup(backupId) {
    return request({
      url: `/api/system/restore/validate/${backupId}`,
      method: 'post'
    })
  },

  /**
   * 获取恢复历史
   * @param {Object} params - 查询参数
   */
  getRestoreHistory(params) {
    return request({
      url: '/api/system/restore/history',
      method: 'get',
      params
    })
  }
}

/**
 * 模块重置API
 */
export const moduleResetApi = {
  /**
   * 获取所有模块
   */
  getAllModules() {
    return request({
      url: '/api/system/module/list',
      method: 'get'
    })
  },

  /**
   * 重置指定模块
   * @param {Object} params - 重置参数
   */
  resetModule(params) {
    return request({
      url: '/api/system/module/reset',
      method: 'post',
      data: params
    })
  },

  /**
   * 批量重置模块
   * @param {Object} params - 批量重置参数
   */
  batchResetModules(params) {
    return request({
      url: '/api/system/module/batch-reset',
      method: 'post',
      data: params
    })
  },

  /**
   * 获取模块重置历史
   * @param {String} moduleCode - 模块编码
   */
  getModuleResetHistory(moduleCode) {
    return request({
      url: `/api/system/module/reset-history/${moduleCode}`,
      method: 'get'
    })
  },

  /**
   * 获取模块依赖关系
   * @param {String} moduleCode - 模块编码
   */
  getModuleDependencies(moduleCode) {
    return request({
      url: `/api/system/module/dependencies/${moduleCode}`,
      method: 'get'
    })
  }
}
