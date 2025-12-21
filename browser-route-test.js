// 浏览器控制台测试代码 - 路由匹配逻辑分析
// 请将以下代码完整复制到浏览器控制台中执行

// 模拟Express.js路由匹配逻辑
class MockRouter {
  constructor() {
    this.routes = [];
  }

  delete(path, handler) {
    this.routes.push({ method: 'DELETE', path, handler });
  }

  match(method, url) {
    console.log(`\n=== 匹配请求: ${method} ${url} ===`);
    
    for (let i = 0; i < this.routes.length; i++) {
      const route = this.routes[i];
      if (route.method !== method) continue;
      
      console.log(`尝试匹配路由 ${i + 1}: ${route.path}`);
      
      // 简化的路由匹配逻辑
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

// 测试当前可能的问题配置
console.log("=== 测试1: 先定义/:id路由，再定义/clear-all路由 ===");
const router1 = new MockRouter();
router1.delete('/:id', () => console.log('处理删除单个库存'));
router1.delete('/clear-all', () => console.log('处理清空所有库存'));
router1.match('DELETE', '/api/inventory/123');
router1.match('DELETE', '/api/inventory/clear-all');

// 测试正确的配置顺序
console.log("\n=== 测试2: 先定义/clear-all路由，再定义/:id路由 ===");
const router2 = new MockRouter();
router2.delete('/clear-all', () => console.log('处理清空所有库存'));
router2.delete('/:id', () => console.log('处理删除单个库存'));
router2.match('DELETE', '/api/inventory/123');
router2.match('DELETE', '/api/inventory/clear-all');

// 输出结论
console.log("\n=== 结论 ===");
console.log("路由定义顺序非常重要！");
console.log("更具体的路由(/clear-all)应该先于通用路由(/:id)定义");
console.log("如果通用路由先定义，它会匹配所有符合格式的路径");