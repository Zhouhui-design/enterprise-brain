/**
 * 供应商评价模块常量
 */

// 默认分页大小
export const DEFAULT_PAGE_SIZE = 20

// 评价等级选项
export const EVALUATION_LEVELS = [
  { label: 'A级 (优秀)', value: 'A' },
  { label: 'B级 (良好)', value: 'B' },
  { label: 'C级 (合格)', value: 'C' },
  { label: 'D级 (不合格)', value: 'D' }
]

// 评价等级标签颜色映射
export const LEVEL_TAG_COLORS: Record<string, string> = {
  A: 'success',
  B: 'primary',
  C: 'warning',
  D: 'danger'
}

// 评价等级计算规则
export const LEVEL_RULES = {
  A: { min: 90, max: 100 },
  B: { min: 80, max: 89 },
  C: { min: 70, max: 79 },
  D: { min: 0, max: 69 }
}

// 评分项权重配置（可调整）
export const SCORE_WEIGHTS = {
  quality: 0.3,    // 质量得分权重 30%
  delivery: 0.3,   // 交期得分权重 30%
  price: 0.2,      // 价格得分权重 20%
  service: 0.2     // 服务得分权重 20%
}
