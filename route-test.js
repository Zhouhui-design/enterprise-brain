// 模拟Express.js路由匹配逻辑
// 用于分析/clear-all路由被错误匹配到/:id路由的问题

class MockRouter {
  constructor() {
    this.routes = [];
  }

  // 注册路由
  delete(path, handler) {
    this.routes.push({ method: 'DELETE', path, handler });
  }

  // 模拟路由匹配
  match(method, url) {
    console.log(`\n=== 匹配请求: ${method} ${url} ===`);
    
    for (let i = 0; i < this.routes.length; i++) {
      const route = this.routes[i];
      if (route.method !== method) continue;
      
      console.log(`尝试匹配路由 ${i + 1}: ${route.path}`);
      
      // 简单的路由匹配逻辑（仅处理静态路径和/:param形式）
      const routeParts = route.path.split('/').filter(Boolean);
      const urlParts = url.split('/').filter(Boolean);
      
      if (routeParts.length !== urlParts.length) {
        console.log(`  路径段数量不匹配: ${routeParts.length} !== ${urlParts.length}`);
        continue;
      }
      
      let matched = true;
      const params = {};
      
      for (let j = 0; j < routeParts.length; j++) {
        const routePart = routeParts[j];
        const urlPart = urlParts[j];
        
        if (routePart.startsWith(':')) {
          // 匹配参数
          const paramName = routePart.slice(1);
          params[paramName] = urlPart;
          console.log(`  匹配参数 ${paramName}: ${urlPart}`);
        } else if (routePart !== urlPart) {
          // 静态部分不匹配
          console.log(`  静态部分不匹配: ${routePart} !== ${urlPart}`);
          matched = false;
          break;
        } else {
          console.log(`  静态部分匹配: ${routePart}`);
        }
      }
      
      if (matched) {
        console.log(`  ✅ 路由匹配成功！`);
        console.log(`  匹配的路由: ${route.path}`);
        console.log(`  提取的参数:`, params);
        return { route, params };
      }
    }
    
    console.log(`  ❌ 未找到匹配的路由`);
    return null;
  }
}

// 测试场景1: 先定义/:id路由，再定义/clear-all路由（当前可能的问题配置）
console.log("\n\n=== 测试场景1: 先定义/:id路由，再定义/clear-all路由 ===");
const router1 = new MockRouter();

router1.delete('/:id', () => console.log('处理删除单个库存'));
router1.delete('/clear-all', () => console.log('处理清空所有库存'));

// 测试匹配
router1.match('DELETE', '/api/inventory/123');
router1.match('DELETE', '/api/inventory/clear-all');

// 测试场景2: 先定义/clear-all路由，再定义/:id路由（正确的配置顺序）
console.log("\n\n=== 测试场景2: 先定义/clear-all路由，再定义/:id路由 ===");
const router2 = new MockRouter();

router2.delete('/clear-all', () => console.log('处理清空所有库存'));
router2.delete('/:id', () => console.log('处理删除单个库存'));

// 测试匹配
router2.match('DELETE', '/api/inventory/123');
router2.match('DELETE', '/api/inventory/clear-all');

console.log("\n\n=== 总结 ===");
console.log("1. 在Express.js中，路由定义顺序非常重要");
console.log("2. 更具体的路由（如/clear-all）应该先于通用路由（如/:id）定义");
console.log("3. 如果通用路由先定义，它会匹配所有符合格式的路径，包括具体的路由");