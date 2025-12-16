/**
 * Service Worker for 离线支持
 * 
 * 提供完整的离线功能，包括：
 * - 资源缓存
 * - 离线页面服务
 * - 后台同步
 * - 推送通知
 * - 数据缓存管理
 * 
 * @author AI Assistant
 * @since 2024-01-01
 */

const CACHE_VERSION = '1.0.0'
const CACHE_NAME = `product-selector-cache-${CACHE_VERSION}`

// 需要缓存的核心资源
const CORE_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // CSS文件
  '/src/assets/style.css',
  // JavaScript文件
  '/src/main.js',
  '/src/app.js',
  // 图片资源
  '/images/default-product.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-512x512.png'
]

// 需要缓存的API路由
const API_ROUTES = [
  '/api/products',
  '/api/categories',
  '/api/user/preferences'
]

// 离线页面
const OFFLINE_PAGE = '/offline.html'

// 监听安装事件
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching core resources')
        return cache.addAll(CORE_RESOURCES)
      })
      .then(() => {
        // 强制激活
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Failed to cache core resources:', error)
      })
  )
})

// 监听激活事件
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 删除旧版本的缓存
            if (cacheName !== CACHE_NAME && 
                cacheName.startsWith('product-selector-cache-')) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        // 获取客户端控制权
        return self.clients.claim()
      })
      .catch((error) => {
        console.error('Failed to activate service worker:', error)
      })
  )
})

// 监听消息事件
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data)
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'GET_OFFLINE_DATA':
      getOfflineData()
        .then((data) => {
          event.ports[0].postMessage({ 
            type: 'OFFLINE_DATA', 
            data 
          })
        })
        .catch((error) => {
          event.ports[0].postMessage({ 
            type: 'OFFLINE_DATA_ERROR', 
            error: error.message 
          })
        })
      break
      
    case 'CACHE_DATA':
      cacheData(event.data.key, event.data.value)
        .then(() => {
          event.ports[0].postMessage({ 
            type: 'CACHE_SUCCESS', 
            key: event.data.key 
          })
        })
        .catch((error) => {
          event.ports[0].postMessage({ 
            type: 'CACHE_ERROR', 
            key: event.data.key,
            error: error.message 
          })
        })
      break
      
    case 'SYNC_OFFLINE_QUEUE':
      syncOfflineQueue()
        .then((result) => {
          event.ports[0].postMessage({ 
            type: 'SYNC_RESULT', 
            result 
          })
        })
        .catch((error) => {
          event.ports[0].postMessage({ 
            type: 'SYNC_ERROR', 
            error: error.message 
          })
        })
      break
  }
})

// 监听网络请求事件
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // 只处理同源请求
  if (url.origin !== self.location.origin) {
    return
  }
  
  // 处理API请求
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request))
    return
  }
  
  // 处理核心资源请求
  if (isCoreResource(url.pathname)) {
    event.respondWith(handleCoreResourceRequest(request))
    return
  }
  
  // 其他请求使用网络优先策略
  event.respondWith(networkFirst(request))
})

/**
 * 处理API请求
 */
async function handleAPIRequest(request) {
  const url = new URL(request.url)
  const cacheKey = `api:${url.pathname}:${JSON.stringify(Object.fromEntries(url.searchParams))}`
  
  try {
    // 网络优先策略
    const response = await fetch(request)
    
    if (response.ok) {
      // 缓存成功的响应
      const cache = await caches.open(CACHE_NAME)
      cache.put(cacheKey, response.clone())
    }
    
    return response
  } catch (error) {
    console.log('Network failed, trying cache for:', request.url)
    
    // 从缓存获取
    const cachedResponse = await caches.match(cacheKey)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // 返回离线响应
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable', 
        offline: true 
      }), 
      { 
        status: 503, 
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

/**
 * 处理核心资源请求
 */
async function handleCoreResourceRequest(request) {
  try {
    // 缓存优先策略
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // 尝试网络请求
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Failed to load core resource:', request.url)
    
    // 返回离线页面
    if (request.destination === 'document') {
      return caches.match(OFFLINE_PAGE)
    }
    
    // 返回默认资源
    return new Response(
      'Resource not available offline', 
      { status: 404 }
    )
  }
}

/**
 * 网络优先策略
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache for:', request.url)
    
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    return new Response(
      'Resource not available offline', 
      { status: 404 }
    )
  }
}

/**
 * 缓存优先策略
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network failed for:', request.url)
    return new Response(
      'Resource not available', 
      { status: 404 }
    )
  }
}

/**
 * 检查是否为核心资源
 */
function isCoreResource(pathname) {
  return CORE_RESOURCES.some(resource => pathname === resource || pathname.startsWith(resource))
}

/**
 * 获取离线数据
 */
async function getOfflineData() {
  const cache = await caches.open(CACHE_NAME)
  const data = {}
  
  // 获取产品数据
  const productsResponse = await cache.match('/api/products')
  if (productsResponse) {
    data.products = await productsResponse.json()
  }
  
  // 获取分类数据
  const categoriesResponse = await cache.match('/api/categories')
  if (categoriesResponse) {
    data.categories = await categoriesResponse.json()
  }
  
  // 获取用户偏好设置
  const preferencesResponse = await cache.match('/api/user/preferences')
  if (preferencesResponse) {
    data.userPreferences = await preferencesResponse.json()
  }
  
  return data
}

/**
 * 缓存数据
 */
async function cacheData(key, value) {
  const cache = await caches.open(CACHE_NAME)
  const request = new Request(`/cache/${key}`, {
    method: 'PUT'
  })
  
  const response = new Response(JSON.stringify(value), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'max-age=3600' // 1小时
    }
  })
  
  return await cache.put(request, response)
}

/**
 * 同步离线队列
 */
async function syncOfflineQueue() {
  try {
    // 从indexedDB获取离线队列
    const queue = await getOfflineQueue()
    const results = []
    
    for (const operation of queue) {
      try {
        const result = await syncOperation(operation)
        results.push({
          id: operation.id,
          success: true,
          result
        })
        
        // 从队列中移除成功的操作
        await removeFromQueue(operation.id)
      } catch (error) {
        results.push({
          id: operation.id,
          success: false,
          error: error.message
        })
        
        // 增加重试次数
        operation.retries = (operation.retries || 0) + 1
        await updateQueueItem(operation)
      }
    }
    
    return {
      total: queue.length,
      results
    }
  } catch (error) {
    console.error('Sync failed:', error)
    throw error
  }
}

/**
 * 同步单个操作
 */
async function syncOperation(operation) {
  const { type, data } = operation
  
  switch (type) {
    case 'product-create':
      return await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }).then(response => response.json())
      
    case 'product-update':
      return await fetch(`/api/products/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }).then(response => response.json())
      
    case 'product-delete':
      return await fetch(`/api/products/${data.id}`, {
        method: 'DELETE'
      }).then(() => ({ success: true }))
      
    default:
      throw new Error(`Unknown operation type: ${type}`)
  }
}

/**
 * IndexedDB 操作
 */

// 打开数据库
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OfflineQueue', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('queue')) {
        const store = db.createObjectStore('queue', { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

// 获取离线队列
async function getOfflineQueue() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['queue'], 'readonly')
    const store = transaction.objectStore('queue')
    const request = store.getAll()
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// 从队列中移除
async function removeFromQueue(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['queue'], 'readwrite')
    const store = transaction.objectStore('queue')
    const request = store.delete(id)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// 更新队列项
async function updateQueueItem(operation) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['queue'], 'readwrite')
    const store = transaction.objectStore('queue')
    const request = store.put(operation)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * 后台同步
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-queue') {
    event.waitUntil(syncOfflineQueue())
  }
})

/**
 * 推送通知
 */
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.body || '您有新的更新',
    icon: '/images/icons/icon-192x192.png',
    badge: '/images/icons/badge-72x72.png',
    tag: 'product-update',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: '查看'
      },
      {
        action: 'dismiss',
        title: '关闭'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification(event.data?.title || '产品更新', options)
  )
})

/**
 * 通知点击处理
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'view') {
    // 打开应用并导航到相关页面
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === self.location.origin && 'focus' in client) {
            client.focus()
            return
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow('/')
        }
      })
    )
  }
})

/**
 * 缓存清理
 */
self.addEventListener('message', (event) => {
  if (event.data.type === 'CLEANUP_CACHE') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.keys().then((requests) => {
          return Promise.all(
            requests.map((request) => {
              const url = new URL(request.url)
              // 清理过期的缓存项
              if (shouldCleanup(request)) {
                return cache.delete(request)
              }
            })
          )
        })
      })
    )
  }
})

/**
 * 检查是否应该清理缓存
 */
function shouldCleanup(request) {
  const url = new URL(request.url)
  const searchParams = url.searchParams
  
  // 清理超过24小时的API缓存
  if (url.pathname.startsWith('/api/') && searchParams.has('timestamp')) {
    const timestamp = parseInt(searchParams.get('timestamp'))
    const now = Date.now()
    return (now - timestamp) > 24 * 60 * 60 * 1000
  }
  
  return false
}

// 定期清理缓存
setInterval(() => {
  self.postMessage({ type: 'CLEANUP_CACHE' })
}, 60 * 60 * 1000) // 每小时清理一次

console.log('Service Worker loaded successfully')