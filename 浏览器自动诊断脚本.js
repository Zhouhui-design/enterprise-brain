// ========================================
// 销售订单删除问题 - 自动诊断脚本
// 使用方法：
// 1. 打开 http://localhost:3001/sales/orders/list
// 2. 按 F12 打开控制台
// 3. 复制本脚本全部内容
// 4. 粘贴到控制台并回车
// 5. 复制输出结果发送给开发者
// ========================================

(function() {
  console.log('%c🔍 开始自动诊断...', 'color: #2196F3; font-size: 16px; font-weight: bold;')
  
  const diagnosticResults = {
    timestamp: new Date().toLocaleString(),
    browser: navigator.userAgent,
    url: window.location.href,
    issues: [],
    warnings: [],
    success: []
  }
  
  // ========================================
  // 1. 检查 localStorage
  // ========================================
  console.log('\n%c━━━ 步骤1: 检查 localStorage ━━━', 'color: #4CAF50; font-weight: bold;')
  
  try {
    const salesOrderData = localStorage.getItem('salesOrderData')
    
    if (!salesOrderData) {
      diagnosticResults.success.push('✅ localStorage 中没有订单数据（空数据）')
      console.log('✅ localStorage 中没有订单数据')
    } else {
      const parsed = JSON.parse(salesOrderData)
      const count = Array.isArray(parsed) ? parsed.length : 0
      
      diagnosticResults.warnings.push(`⚠️ localStorage 中有 ${count} 条订单数据`)
      console.log(`⚠️ localStorage 中有 ${count} 条订单数据:`)
      console.log(parsed)
      
      // 检查是否是硬编码数据
      if (count > 0 && parsed[0].orderNumber === 'SO2025112900001') {
        diagnosticResults.issues.push('❌ 发现疑似硬编码的模拟数据: SO2025112900001')
        console.error('❌ 发现疑似硬编码的模拟数据')
      }
    }
  } catch (e) {
    diagnosticResults.issues.push(`❌ localStorage 读取失败: ${e.message}`)
    console.error('❌ localStorage 读取失败:', e)
  }
  
  // ========================================
  // 2. 检查 localStorage 权限
  // ========================================
  console.log('\n%c━━━ 步骤2: 检查 localStorage 权限 ━━━', 'color: #4CAF50; font-weight: bold;')
  
  try {
    const testKey = '__test_storage__'
    localStorage.setItem(testKey, 'test')
    const testValue = localStorage.getItem(testKey)
    localStorage.removeItem(testKey)
    
    if (testValue === 'test') {
      diagnosticResults.success.push('✅ localStorage 读写权限正常')
      console.log('✅ localStorage 读写权限正常')
    } else {
      diagnosticResults.issues.push('❌ localStorage 写入后读取失败')
      console.error('❌ localStorage 写入后读取失败')
    }
  } catch (e) {
    diagnosticResults.issues.push(`❌ localStorage 权限测试失败: ${e.message}`)
    console.error('❌ localStorage 权限测试失败:', e)
  }
  
  // ========================================
  // 3. 监控 localStorage 写入
  // ========================================
  console.log('\n%c━━━ 步骤3: 启动 localStorage 写入监控 ━━━', 'color: #4CAF50; font-weight: bold;')
  
  const originalSetItem = localStorage.setItem
  let writeCount = 0
  
  localStorage.setItem = function(key, value) {
    writeCount++
    
    if (key === 'salesOrderData') {
      console.log(`%c🔴 检测到 localStorage.setItem("salesOrderData") 第 ${writeCount} 次调用`, 'color: #f44336; font-weight: bold;')
      console.log('写入的值:', value)
      console.trace('调用堆栈:')
      
      diagnosticResults.warnings.push({
        time: new Date().toLocaleString(),
        key: key,
        valueLength: value.length,
        stack: new Error().stack
      })
    }
    
    originalSetItem.apply(this, arguments)
  }
  
  diagnosticResults.success.push('✅ localStorage 写入监控已启动')
  console.log('✅ localStorage 写入监控已启动')
  console.log('   现在刷新页面或执行删除操作，所有写入都会被记录')
  
  // ========================================
  // 4. 检查是否有多个窗口
  // ========================================
  console.log('\n%c━━━ 步骤4: 检查多窗口冲突 ━━━', 'color: #4CAF50; font-weight: bold;')
  
  // 创建一个唯一标识
  const windowId = Date.now()
  sessionStorage.setItem('windowId', windowId.toString())
  
  console.log('当前窗口ID:', windowId)
  console.log('⚠️ 如果有多个标签页打开同一页面，可能导致数据冲突')
  
  // ========================================
  // 5. 搜索可能的硬编码数据源
  // ========================================
  console.log('\n%c━━━ 步骤5: 搜索数据来源 ━━━', 'color: #4CAF50; font-weight: bold;')
  
  // 检查全局变量
  if (window.orders || window.salesOrderData) {
    diagnosticResults.warnings.push('⚠️ 发现全局变量 window.orders 或 window.salesOrderData')
    console.warn('⚠️ 发现全局变量:', window.orders || window.salesOrderData)
  } else {
    diagnosticResults.success.push('✅ 未发现可疑的全局变量')
    console.log('✅ 未发现可疑的全局变量')
  }
  
  // ========================================
  // 6. 生成诊断报告
  // ========================================
  console.log('\n%c━━━ 诊断报告 ━━━', 'color: #FF9800; font-size: 18px; font-weight: bold;')
  
  console.log('\n✅ 成功项:')
  diagnosticResults.success.forEach(item => console.log('  ', item))
  
  if (diagnosticResults.warnings.length > 0) {
    console.log('\n⚠️ 警告项:')
    diagnosticResults.warnings.forEach(item => {
      if (typeof item === 'string') {
        console.log('  ', item)
      } else {
        console.log('  ', item.time, '-', item.key)
      }
    })
  }
  
  if (diagnosticResults.issues.length > 0) {
    console.log('\n❌ 问题项:')
    diagnosticResults.issues.forEach(item => console.log('  ', item))
  }
  
  // ========================================
  // 7. 提供快捷操作
  // ========================================
  console.log('\n%c━━━ 快捷操作 ━━━', 'color: #9C27B0; font-weight: bold;')
  
  // 清空订单数据
  window.clearAllOrders = function() {
    localStorage.removeItem('salesOrderData')
    console.log('✅ 已清空所有订单数据')
    location.reload()
  }
  
  // 查看当前订单
  window.showOrders = function() {
    const data = localStorage.getItem('salesOrderData')
    if (data) {
      const orders = JSON.parse(data)
      console.log('当前订单数据:', orders)
      console.log('订单数量:', orders.length)
      return orders
    } else {
      console.log('当前没有订单数据')
      return []
    }
  }
  
  // 停止监控
  window.stopMonitoring = function() {
    localStorage.setItem = originalSetItem
    console.log('✅ 已停止 localStorage 监控')
  }
  
  console.log('可用命令:')
  console.log('  • clearAllOrders()  - 清空所有订单数据并刷新')
  console.log('  • showOrders()      - 查看当前订单数据')
  console.log('  • stopMonitoring()  - 停止 localStorage 监控')
  
  // ========================================
  // 8. 输出完整报告（供复制）
  // ========================================
  console.log('\n%c━━━ 完整报告（请复制发送给开发者）━━━', 'color: #2196F3; font-size: 16px; font-weight: bold;')
  
  const report = `
========================================
销售订单删除问题 - 自动诊断报告
========================================

诊断时间: ${diagnosticResults.timestamp}
浏览器: ${diagnosticResults.browser}
页面URL: ${diagnosticResults.url}

----------------------------------------
✅ 成功项 (${diagnosticResults.success.length}):
----------------------------------------
${diagnosticResults.success.map((item, i) => `${i+1}. ${item}`).join('\n')}

----------------------------------------
⚠️ 警告项 (${diagnosticResults.warnings.length}):
----------------------------------------
${diagnosticResults.warnings.length > 0 ? diagnosticResults.warnings.map((item, i) => {
  if (typeof item === 'string') {
    return `${i+1}. ${item}`
  } else {
    return `${i+1}. localStorage 写入: ${item.key} (${item.valueLength} 字符) at ${item.time}`
  }
}).join('\n') : '无'}

----------------------------------------
❌ 问题项 (${diagnosticResults.issues.length}):
----------------------------------------
${diagnosticResults.issues.length > 0 ? diagnosticResults.issues.map((item, i) => `${i+1}. ${item}`).join('\n') : '无'}

========================================
下一步操作建议:
========================================
1. 如果有订单数据，执行 clearAllOrders() 清空
2. 刷新页面，观察是否还有数据
3. 执行删除操作，观察监控日志
4. 复制本报告发送给开发者

========================================
`
  
  console.log(report)
  
  // 将报告存储到全局变量，方便复制
  window.diagnosticReport = report
  console.log('\n%c💡 提示: 执行 copy(diagnosticReport) 可以快速复制报告', 'color: #FF9800; font-weight: bold;')
  
  console.log('\n%c✅ 诊断完成！监控仍在运行...', 'color: #4CAF50; font-size: 16px; font-weight: bold;')
  
})()
