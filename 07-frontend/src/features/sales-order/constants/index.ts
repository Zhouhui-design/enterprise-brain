// 订单状态类型映射
export const STATUS_TYPE_MAP = {
  draft: 'info',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  processing: 'primary',
  completed: 'success',
  cancelled: 'danger'
}

// 订单优先级映射
export const PRIORITY_TYPE_MAP = {
  low: 'info',
  medium: 'warning',
  high: 'danger',
  urgent: 'danger'
}

// 订单状态文本映射
export const STATUS_TEXT_MAP = {
  draft: '草稿',
  pending: '待审批',
  approved: '已审批',
  rejected: '已拒绝',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消'
}

// 订单优先级文本映射
export const PRIORITY_TEXT_MAP = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急'
}
