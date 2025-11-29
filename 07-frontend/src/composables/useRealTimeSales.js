import { ref, onMounted, onUnmounted } from 'vue'
import SalesApi from '@/api/sales'

export function useRealTimeSales() {
  const isConnected = ref(false)
  const lastUpdated = ref(new Date())
  const error = ref(null)
  const ws = ref(null)
  
  // 实时销售数据
  const realTimeData = ref({
    currentRevenue: 0,
    todayRevenue: 0,
    todayOrders: 0,
    todayCustomers: 0,
    hourlyRevenue: [],
    activeUsers: 0
  })

  // 配置参数
  const config = ref({
    timeRange: 60, // 分钟数
    refreshRate: 30 // 秒数
  })

  let reconnectTimer = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 5

  // WebSocket连接管理
  const connectWebSocket = () => {
    try {
      const wsUrl = `${process.env.VUE_APP_WS_URL || 'ws://localhost:3001'}/sales/realtime`
      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        console.log('WebSocket连接已建立')
        isConnected.value = true
        error.value = null
        reconnectAttempts = 0
        
        // 请求初始数据
        requestInitialData()
        
        // 清除重连定时器
        if (reconnectTimer) {
          clearTimeout(reconnectTimer)
          reconnectTimer = null
        }
      }

      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleRealTimeMessage(data)
        } catch (error) {
          console.error('解析WebSocket消息失败:', error)
        }
      }

      ws.value.onclose = (event) => {
        console.log('WebSocket连接已关闭', event.code, event.reason)
        isConnected.value = false
        
        // 如果不是主动关闭，则尝试重连
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          scheduleReconnect()
        }
      }

      ws.value.onerror = (event) => {
        console.error('WebSocket错误:', event)
        error.value = 'WebSocket连接错误'
        isConnected.value = false
      }

    } catch (error) {
      console.error('创建WebSocket连接失败:', error)
      error.value = '创建WebSocket连接失败'
    }
  }

  // 处理实时消息
  const handleRealTimeMessage = (data) => {
    lastUpdated.value = new Date()
    
    switch (data.type) {
      case 'sales_update':
        realTimeData.value = {
          ...realTimeData.value,
          ...data.data
        }
        break
        
      case 'hourly_update':
        if (data.data.hour) {
          const existingIndex = realTimeData.value.hourlyRevenue.findIndex(
            item => item.hour === data.data.hour
          )
          
          if (existingIndex >= 0) {
            realTimeData.value.hourlyRevenue[existingIndex] = data.data
          } else {
            realTimeData.value.hourlyRevenue.push(data.data)
            // 保持最近24小时的数据
            if (realTimeData.value.hourlyRevenue.length > 24) {
              realTimeData.value.hourlyRevenue.shift()
            }
          }
        }
        break
        
      case 'metrics_update':
        // 更新关键指标
        if (data.metrics) {
          Object.keys(data.metrics).forEach(key => {
            if (realTimeData.value.hasOwnProperty(key)) {
              realTimeData.value[key] = data.metrics[key]
            }
          })
        }
        break
        
      case 'heartbeat':
        // 心跳消息，用于保持连接
        break
        
      default:
        console.log('未处理的消息类型:', data.type)
    }
  }

  // 请求初始数据
  const requestInitialData = () => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({
        type: 'get_initial_data',
        config: config.value
      }))
    }
  }

  // 发送配置更新
  const updateConfig = (newConfig) => {
    Object.assign(config.value, newConfig)
    
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({
        type: 'update_config',
        config: config.value
      }))
    }
  }

  // 安排重连
  const scheduleReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
    }
    
    reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000) // 指数退避，最大30秒
    
    console.log(`${delay}ms后尝试第${reconnectAttempts}次重连`)
    
    reconnectTimer = setTimeout(() => {
      connectWebSocket()
    }, delay)
  }

  // 手动刷新数据
  const refreshData = () => {
    requestInitialData()
  }

  // 获取当前连接状态
  const getConnectionStatus = () => {
    return {
      isConnected: isConnected.value,
      lastUpdated: lastUpdated.value,
      error: error.value,
      reconnectAttempts
    }
  }

  // 订阅特定事件
  const subscribe = (eventTypes) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({
        type: 'subscribe',
        events: Array.isArray(eventTypes) ? eventTypes : [eventTypes]
      }))
    }
  }

  // 取消订阅
  const unsubscribe = (eventTypes) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({
        type: 'unsubscribe',
        events: Array.isArray(eventTypes) ? eventTypes : [eventTypes]
      }))
    }
  }

  // 切换刷新率
  const setRefreshRate = (rate) => {
    updateConfig({ refreshRate: rate })
  }

  // 切换时间范围
  const setTimeRange = (range) => {
    updateConfig({ timeRange: range })
  }

  // 获取当前配置
  const getConfig = () => {
    return { ...config.value }
  }

  // 组件挂载时建立连接
  onMounted(() => {
    connectWebSocket()
    
    // 定期发送心跳
    const heartbeatInterval = setInterval(() => {
      if (ws.value && ws.value.readyState === WebSocket.OPEN) {
        ws.value.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        }))
      }
    }, 30000) // 每30秒发送一次心跳

    // 组件卸载时清理
    onUnmounted(() => {
      clearInterval(heartbeatInterval)
      
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      
      if (ws.value) {
        ws.value.close(1000, '组件卸载')
      }
    })
  })

  // 处理页面可见性变化
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // 页面不可见时降低刷新率
      setRefreshRate(60)
    } else {
      // 页面可见时恢复正常刷新率
      setRefreshRate(config.value.refreshRate)
      
      // 重新连接WebSocket（如果需要）
      if (!isConnected.value) {
        connectWebSocket()
      }
    }
  }

  // 监听页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // 组件卸载时移除事件监听
  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  // 手动发送消息
  const sendMessage = (message) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket未连接，无法发送消息')
    }
  }

  // 关闭连接
  const disconnect = () => {
    if (ws.value) {
      ws.value.close(1000, '手动关闭')
    }
  }

  return {
    // 响应式数据
    isConnected,
    lastUpdated,
    error,
    realTimeData,
    config,
    
    // 方法
    connectWebSocket,
    refreshData,
    getConnectionStatus,
    subscribe,
    unsubscribe,
    setRefreshRate,
    setTimeRange,
    getConfig,
    sendMessage,
    disconnect
  }
}