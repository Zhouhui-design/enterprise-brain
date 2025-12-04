/**
 * 业务变量设置服务
 * 管理系统业务变量的初始设置和配置
 */

import { ref, reactive } from 'vue'

// 默认业务设置
const DEFAULT_SETTINGS = {
  // 模拟排程设置
  scheduling: {
    simulationExpireDays: 1, // 模拟排程失效天数
    simulationExpireDescription: '模拟排程期间，当新增订单的承诺交期减去设置天数小于等于本订单的预计完成日期，则本订单的模拟排程结果失效，需要重新模拟排程。',
    considerSimulatedOrders: false, // 是否考虑其他模拟排程订单
    workingHoursStart: 8, // 工作时间开始
    workingHoursEnd: 20, // 工作时间结束
    workingDays: [1, 2, 3, 4, 5, 6], // 工作日 (1-7: 周一到周日)
    defaultPriority: 5, // 默认优先级 (1-10)
    autoScheduling: false // 是否自动排程
  },

  // 订单设置
  order: {
    orderNoPrefix: 'SO', // 订单编号前缀
    orderNoFormat: 'SO{YYYY}{MM}{DD}{####}', // 订单编号格式
    defaultCurrency: 'CNY', // 默认币种
    defaultExchangeRate: 1.0, // 默认汇率
    defaultTaxRate: 13, // 默认税率 (%)
    defaultPaymentMethod: '预付+尾款', // 默认付款方式
    defaultDeliveryMethod: '快递', // 默认送货方式
    autoGenerateOrderNo: true, // 是否自动生成订单编号
    requireCustomerPO: false // 是否必须填写客户订单编号
  },

  // 生产设置
  production: {
    defaultSetupTime: 30, // 默认换型时间 (分钟)
    defaultEfficiency: 1.0, // 默认效率系数
    defaultQualityLevel: 'normal', // 默认质量等级
    safetyStockRatio: 0.1, // 安全库存比例
    leadTimeBuffer: 1.0, // 提前期缓冲系数
    autoCreateDispatch: false, // 排程完成后自动创建派工单
    autoCheckMaterial: true // 是否自动检查物料充足
  },

  // 库存设置
  inventory: {
    lowStockThreshold: 100, // 低库存阈值
    autoReplenishment: false, // 是否自动补货
    replenishmentPoint: 50, // 补货点
    maxInventory: 10000, // 最大库存
    inventoryWarningEnabled: true // 是否启用库存预警
  },

  // 质量设置
  quality: {
    inspectionRequired: true, // 是否需要检验
    defaultInspectionRatio: 100, // 默认抽检比例 (%)
    qualityStandard: 'GB/T', // 质量标准
    defectRateThreshold: 1.0 // 不良率阈值 (%)
  },

  // 人员设置
  worker: {
    maxTasksPerDay: 8, // 每人每天最大任务数
    overtimeAllowed: false, // 是否允许加班
    skillLevelRequired: 3, // 最低技能等级要求
    trainingRequired: false // 是否需要培训
  },

  // 设备设置
  equipment: {
    maintenanceCycle: 30, // 维护周期 (天)
    maintenanceDuration: 4, // 维护时长 (小时)
    utilizationThreshold: 85, // 利用率阈值 (%)
    oeeTarget: 75, // OEE目标 (%)
    autoMaintenance: false // 是否自动生成维护计划
  },

  // 通知设置
  notification: {
    orderDelayWarning: true, // 订单延期预警
    materialShortageWarning: true, // 物料短缺预警
    equipmentMaintenanceWarning: true, // 设备维护提醒
    qualityIssueWarning: true, // 质量问题预警
    warningDaysBefore: 3 // 提前预警天数
  }
}

// 当前设置（响应式）
const currentSettings = reactive(loadSettings())

/**
 * 从localStorage加载设置
 * @returns {Object} 设置对象
 */
function loadSettings() {
  try {
    const stored = localStorage.getItem('businessSettings')
    if (stored) {
      const parsed = JSON.parse(stored)
      // 合并默认设置和保存的设置
      return mergeSettings(DEFAULT_SETTINGS, parsed)
    }
  } catch (error) {
    console.error('加载业务设置失败:', error)
  }
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
}

/**
 * 合并设置对象
 * @param {Object} defaults - 默认设置
 * @param {Object} saved - 保存的设置
 * @returns {Object} 合并后的设置
 */
function mergeSettings(defaults, saved) {
  const result = {}
  for (const key in defaults) {
    if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
      result[key] = {
        ...defaults[key],
        ...(saved[key] || {})
      }
    } else {
      result[key] = saved[key] !== undefined ? saved[key] : defaults[key]
    }
  }
  return result
}

/**
 * 保存设置到localStorage
 * @param {Object} settings - 设置对象
 * @returns {boolean} 是否保存成功
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem('businessSettings', JSON.stringify(settings))
    
    // 更新当前设置
    Object.assign(currentSettings, settings)
    
    console.log('✅ 业务设置已保存')
    return true
  } catch (error) {
    console.error('❌ 保存业务设置失败:', error)
    return false
  }
}

/**
 * 获取当前设置
 * @returns {Object} 当前设置
 */
export function getSettings() {
  return currentSettings
}

/**
 * 获取特定模块的设置
 * @param {string} module - 模块名称
 * @returns {Object} 模块设置
 */
export function getModuleSettings(module) {
  return currentSettings[module] || {}
}

/**
 * 更新特定模块的设置
 * @param {string} module - 模块名称
 * @param {Object} settings - 模块设置
 * @returns {boolean} 是否更新成功
 */
export function updateModuleSettings(module, settings) {
  if (!currentSettings[module]) {
    console.error(`模块 ${module} 不存在`)
    return false
  }

  currentSettings[module] = {
    ...currentSettings[module],
    ...settings
  }

  return saveSettings(currentSettings)
}

/**
 * 重置为默认设置
 * @param {string} module - 模块名称（可选，如不传则重置全部）
 * @returns {boolean} 是否重置成功
 */
export function resetToDefaults(module = null) {
  if (module) {
    if (DEFAULT_SETTINGS[module]) {
      currentSettings[module] = JSON.parse(JSON.stringify(DEFAULT_SETTINGS[module]))
      return saveSettings(currentSettings)
    } else {
      console.error(`模块 ${module} 不存在`)
      return false
    }
  } else {
    Object.assign(currentSettings, JSON.parse(JSON.stringify(DEFAULT_SETTINGS)))
    return saveSettings(currentSettings)
  }
}

/**
 * 导出设置为JSON
 * @returns {string} JSON字符串
 */
export function exportSettings() {
  return JSON.stringify(currentSettings, null, 2)
}

/**
 * 导入设置
 * @param {string} jsonString - JSON字符串
 * @returns {boolean} 是否导入成功
 */
export function importSettings(jsonString) {
  try {
    const imported = JSON.parse(jsonString)
    const merged = mergeSettings(DEFAULT_SETTINGS, imported)
    return saveSettings(merged)
  } catch (error) {
    console.error('导入设置失败:', error)
    return false
  }
}

/**
 * 检查模拟排程是否失效
 * @param {Object} order - 订单对象
 * @param {string} newOrderDueDate - 新订单的承诺交期
 * @returns {boolean} 是否失效
 */
export function isSimulationExpired(order, newOrderDueDate) {
  const settings = getModuleSettings('scheduling')
  const expireDays = settings.simulationExpireDays || 1

  if (!order.estimatedCompletionDate || !newOrderDueDate) {
    return false
  }

  const newDue = new Date(newOrderDueDate)
  const expireDate = new Date(newDue)
  expireDate.setDate(expireDate.getDate() - expireDays)

  const estimatedCompletion = new Date(order.estimatedCompletionDate)

  return expireDate <= estimatedCompletion
}

/**
 * 获取所有模拟排程失效的订单
 * @param {Array} simulatedOrders - 已模拟排程的订单列表
 * @param {string} newOrderDueDate - 新订单的承诺交期
 * @returns {Array} 失效的订单列表
 */
export function getExpiredSimulations(simulatedOrders, newOrderDueDate) {
  return simulatedOrders.filter(order => isSimulationExpired(order, newOrderDueDate))
}

export default {
  saveSettings,
  getSettings,
  getModuleSettings,
  updateModuleSettings,
  resetToDefaults,
  exportSettings,
  importSettings,
  isSimulationExpired,
  getExpiredSimulations,
  DEFAULT_SETTINGS
}
