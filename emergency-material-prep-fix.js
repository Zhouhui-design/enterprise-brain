// 紧急修复脚本 - 清理所有可能的配置问题
console.log('🚨 紧急修复开始...')

// 1. 清理所有localStorage配置
const keysToRemove = [
  'material-preparation_columns',
  'material-preparation_business_vars', 
  'material-preparation_workflow_configs',
  'material-preparation_code_rules'
]

console.log('🧹 清理localStorage配置...')
keysToRemove.forEach(key => {
  try {
    localStorage.removeItem(key)
    console.log(`✅ 已删除: ${key}`)
  } catch (error) {
    console.error(`❌ 删除失败: ${key}`, error)
  }
})

// 2. 清理可能的缓存问题
console.log('🧹 清理缓存...')
if (typeof caches !== 'undefined') {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name)
      console.log(`✅ 已删除缓存: ${name}`)
    })
  })
}

// 3. 重定向到修复页面
console.log('🔄 3秒后自动刷新页面...')
setTimeout(() => {
  console.log('🔄 正在刷新...')
  location.reload()
}, 3000)

console.log('🎯 紧急修复完成！')