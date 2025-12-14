// 清理备料计划页面的localStorage配置
console.log('🧹 开始清理备料计划页面localStorage配置')

const keysToRemove = [
  'material-preparation_columns',
  'material-preparation_business_vars',
  'material-preparation_workflow_configs',
  'material-preparation_code_rules'
]

keysToRemove.forEach(key => {
  try {
    localStorage.removeItem(key)
    console.log(`✅ 已删除: ${key}`)
  } catch (error) {
    console.error(`❌ 删除失败: ${key}`, error)
  }
})

console.log('🎯 清理完成，请刷新页面重试')
console.log('📝 如果问题依然存在，请按F12打开开发者工具查看详细错误信息')