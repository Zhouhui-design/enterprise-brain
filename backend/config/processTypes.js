/**
 * 工序类型配置管理
 * 根据列表式生产BOM中的父件产出工序动态配置所有工序计划
 */

const PROCESS_TYPE_CONFIG = {
  // 打包工序（已有）
  '打包': {
    code: 'PACKING',
    tableName: 'real_process_plans',
    serviceName: 'realProcessPlanService',
    routePath: 'real-process-plans',
    planNoPrefix: 'RPP',
    displayName: '打包工序计划',
    menuPath: '/production-planning/packing-process-plan',
    enabled: true
  },
  
  // 组装工序（已有）
  '组装': {
    code: 'ASSEMBLY',
    tableName: 'assembly_process_plans',
    serviceName: 'assemblyProcessPlanService',
    routePath: 'assembly-process-plans',
    planNoPrefix: 'ASPP',
    displayName: '组装工序计划',
    menuPath: '/production-planning/assembly-process-plan',
    enabled: true
  },
  
  // 喷塑工序
  '喷塑': {
    code: 'SPRAY_PAINTING',
    tableName: 'spray_painting_process_plans',
    serviceName: 'sprayPaintingProcessPlanService',
    routePath: 'spray-painting-process-plans',
    planNoPrefix: 'SPPP',
    displayName: '喷塑工序计划',
    menuPath: '/production-planning/spray-painting-process-plan',
    enabled: true
  },
  
  // 缝纫工序 (已禁用 - 外协工序不需要内部排程)
  '缝纫': {
    code: 'SEWING',
    tableName: 'sewing_process_plans',
    serviceName: 'sewingProcessPlanService',
    routePath: 'sewing-process-plans',
    planNoPrefix: 'SWPP',
    displayName: '缝纫工序计划',
    menuPath: '/production-planning/sewing-process-plan',
    enabled: false  // ✅ 已禁用：外协工序不纳入内部产能排程
  },
  
  // 抛丸工序
  '抛丸': {
    code: 'SHOT_BLASTING',
    tableName: 'shot_blasting_process_plans',
    serviceName: 'shotBlastingProcessPlanService',
    routePath: 'shot-blasting-process-plans',
    planNoPrefix: 'SBPP',
    displayName: '抛丸工序计划',
    menuPath: '/production-planning/shot-blasting-process-plan',
    enabled: true
  },
  
  // 人工焊接工序
  '人工焊接': {
    code: 'MANUAL_WELDING',
    tableName: 'manual_welding_process_plans',
    serviceName: 'manualWeldingProcessPlanService',
    routePath: 'manual-welding-process-plans',
    planNoPrefix: 'MWPP',
    displayName: '人工焊接工序计划',
    menuPath: '/production-planning/manual-welding-process-plan',
    enabled: true
  },
  
  // 弯管工序
  '弯管': {
    code: 'TUBE_BENDING',
    tableName: 'tube_bending_process_plans',
    serviceName: 'tubeBendingProcessPlanService',
    routePath: 'tube-bending-process-plans',
    planNoPrefix: 'TBPP',
    displayName: '弯管工序计划',
    menuPath: '/production-planning/tube-bending-process-plan',
    enabled: true
  },
  
  // 激光切管工序
  '激光切管': {
    code: 'LASER_TUBE_CUTTING',
    tableName: 'laser_tube_cutting_process_plans',
    serviceName: 'laserTubeCuttingProcessPlanService',
    routePath: 'laser-tube-cutting-process-plans',
    planNoPrefix: 'LTPP',
    displayName: '激光切管工序计划',
    menuPath: '/production-planning/laser-tube-cutting-process-plan',
    enabled: true
  },
  
  // 激光下料工序
  '激光下料': {
    code: 'LASER_CUTTING',
    tableName: 'laser_cutting_process_plans',
    serviceName: 'laserCuttingProcessPlanService',
    routePath: 'laser-cutting-process-plans',
    planNoPrefix: 'LCPP',
    displayName: '激光下料工序计划',
    menuPath: '/production-planning/laser-cutting-process-plan',
    enabled: true
  },
  
  // 折弯工序
  '折弯': {
    code: 'BENDING',
    tableName: 'bending_process_plans',
    serviceName: 'bendingProcessPlanService',
    routePath: 'bending-process-plans',
    planNoPrefix: 'BDPP',
    displayName: '折弯工序计划',
    menuPath: '/production-planning/bending-process-plan',
    enabled: true
  },
  
  // 打孔工序
  '打孔': {
    code: 'DRILLING',
    tableName: 'drilling_process_plans',
    serviceName: 'drillingProcessPlanService',
    routePath: 'drilling-process-plans',
    planNoPrefix: 'DRPP',
    displayName: '打孔工序计划',
    menuPath: '/production-planning/drilling-process-plan',
    enabled: true
  },
  
  // 冲床工序
  '冲床': {
    code: 'PUNCHING',
    tableName: 'punching_process_plans',
    serviceName: 'punchingProcessPlanService',
    routePath: 'punching-process-plans',
    planNoPrefix: 'PNPP',
    displayName: '冲床工序计划',
    menuPath: '/production-planning/punching-process-plan',
    enabled: true
  },
  
  // 人工下料工序
  '人工下料': {
    code: 'MANUAL_CUTTING',
    tableName: 'manual_cutting_process_plans',
    serviceName: 'manualCuttingProcessPlanService',
    routePath: 'manual-cutting-process-plans',
    planNoPrefix: 'MCPP',
    displayName: '人工下料工序计划',
    menuPath: '/production-planning/manual-cutting-process-plan',
    enabled: true
  },
  
  // 机器打磨工序
  '机器打磨': {
    code: 'MACHINE_GRINDING',
    tableName: 'machine_grinding_process_plans',
    serviceName: 'machineGrindingProcessPlanService',
    routePath: 'machine-grinding-process-plans',
    planNoPrefix: 'MGPP',
    displayName: '机器打磨工序计划',
    menuPath: '/production-planning/machine-grinding-process-plan',
    enabled: true
  },
  
  // 裁剪工序
  '裁剪': {
    code: 'CUTTING',
    tableName: 'cutting_process_plans',
    serviceName: 'cuttingProcessPlanService',
    routePath: 'cutting-process-plans',
    planNoPrefix: 'CTPP',
    displayName: '裁剪工序计划',
    menuPath: '/production-planning/cutting-process-plan',
    enabled: true
  },
  
  // 复合工序
  '复合': {
    code: 'COMPOSITE',
    tableName: 'composite_process_plans',
    serviceName: 'compositeProcessPlanService',
    routePath: 'composite-process-plans',
    planNoPrefix: 'CMPP',
    displayName: '复合工序计划',
    menuPath: '/production-planning/composite-process-plan',
    enabled: true
  }
};

/**
 * 根据工序名称获取配置
 * @param {string} processName - 工序名称
 * @returns {Object|null} 工序配置对象，如果工序禁用则返回null
 */
function getProcessConfig(processName) {
  const config = PROCESS_TYPE_CONFIG[processName];
  // ✅ 检查工序是否启用
  if (config && config.enabled === false) {
    console.log(`⏭️ 工序"${processName}"已禁用，跳过处理`);
    return null;
  }
  return config || null;
}

/**
 * 获取所有启用的工序类型
 * @returns {Array} 启用的工序配置数组
 */
function getEnabledProcesses() {
  return Object.entries(PROCESS_TYPE_CONFIG)
    .filter(([_, config]) => config.enabled)
    .map(([processName, config]) => ({
      processName,
      ...config
    }));
}

/**
 * 检查工序是否已配置
 * @param {string} processName - 工序名称
 * @returns {boolean}
 */
function isProcessConfigured(processName) {
  return processName in PROCESS_TYPE_CONFIG;
}

/**
 * 根据工序名称获取表名
 * @param {string} processName - 工序名称
 * @returns {string|null}
 */
function getTableName(processName) {
  const config = getProcessConfig(processName);
  return config ? config.tableName : null;
}

/**
 * 根据工序名称获取Service名称
 * @param {string} processName - 工序名称
 * @returns {string|null}
 */
function getServiceName(processName) {
  const config = getProcessConfig(processName);
  return config ? config.serviceName : null;
}

module.exports = {
  PROCESS_TYPE_CONFIG,
  getProcessConfig,
  getEnabledProcesses,
  isProcessConfigured,
  getTableName,
  getServiceName
};
