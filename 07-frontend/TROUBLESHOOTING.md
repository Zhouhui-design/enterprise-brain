# 前端问题排查指南

## 如何识别当前访问的页面

### 方法1：通过浏览器控制台错误信息
当页面出现错误时，浏览器控制台会显示错误堆栈信息，例如：
```
at <WarehouseIn>
at <Layout>
at <RouterView>
```
这表示当前页面是 `WarehouseIn` 组件。

### 方法2：查看浏览器URL
- URL：`/warehouse/in` → 对应文件：`src/pages/warehouse/WarehouseIn.vue`
- URL：`/finance/accounts-receivable/list` → 对应文件：`src/pages/finance/accounts-receivable/ReceivableList.vue`

### 方法3：使用Vue Devtools
安装Vue Devtools浏览器扩展，可以直接看到当前组件树和组件名称。

### 方法4：查看路由配置
在 `src/router/modules/*.js` 文件中查找路由配置：
```javascript
{
  path: 'in',
  name: 'WarehouseIn',  // 组件名称
  component: () => import('@/pages/warehouse/WarehouseIn.vue'),  // 文件路径
  meta: { title: '入库管理' }
}
```

---

## 常见问题及解决方案

### 1. Icon 组件错误

#### 问题表现
```
[Vue warn]: Failed to resolve component: el-icon-document
[Vue warn]: Failed to resolve component: el-icon-box
```

#### 原因
Element Plus 使用新的 Icon 组件系统，不再支持旧的 `el-icon-xxx` 格式。

#### 解决方案

**❌ 错误写法：**
```vue
<el-icon><el-icon-document /></el-icon>
```

**✅ 正确写法：**
```vue
<template>
  <el-icon><Document /></el-icon>
</template>

<script>
import { Document } from '@element-plus/icons-vue'

export default {
  components: {
    Document
  }
}
</script>
```

#### 常用Icon导入
```javascript
import {
  Document,    // 文档
  Box,        // 盒子
  Upload,     // 上传
  Download,   // 下载
  Grid,       // 网格
  Money,      // 金钱
  Search,     // 搜索
  Refresh,    // 刷新
  Plus,       // 加号
  Delete,     // 删除
  Edit,       // 编辑
  Check,      // 勾选
  Close       // 关闭
} from '@element-plus/icons-vue'
```

---

### 2. Button size 属性错误

#### 问题表现
```
[Vue warn]: Invalid prop: validation failed. Expected one of ["", "default", "small", "large"], got value "mini".
```

#### 原因
Element Plus 不再支持 `size="mini"`，应该使用 `size="small"`。

#### 解决方案

**❌ 错误写法：**
```vue
<el-button size="mini">按钮</el-button>
```

**✅ 正确写法：**
```vue
<el-button size="small">按钮</el-button>
```

#### 可用的 size 值
- `large` - 大按钮
- `default` 或 `""` - 默认大小
- `small` - 小按钮

---

### 3. Table slot-scope 语法错误

#### 问题表现
```
Property "scope" was accessed during render but is not defined on instance.
```

#### 原因
Vue 3 使用新的插槽语法 `#default` 替代 `slot-scope`。

#### 解决方案

**❌ 错误写法：**
```vue
<el-table-column label="金额">
  <template slot-scope="scope">
    ¥{{ scope.row.amount }}
  </template>
</el-table-column>
```

**✅ 正确写法：**
```vue
<el-table-column label="金额">
  <template #default="scope">
    ¥{{ scope.row.amount }}
  </template>
</el-table-column>
```

或者使用完整写法：
```vue
<template v-slot="scope">
  ¥{{ scope.row.amount }}
</template>
```

---

## 快速修复脚本

如果项目中有大量类似问题，可以使用以下命令批量查找：

### 查找使用 mini size 的文件
```bash
grep -r "size=\"mini\"" src/pages/
```

### 查找使用旧 icon 语法的文件
```bash
grep -r "el-icon-" src/pages/
```

### 查找使用 slot-scope 的文件
```bash
grep -r "slot-scope" src/pages/
```

---

## 调试技巧

### 1. 开启详细错误信息
在 `vite.config.js` 中配置：
```javascript
export default defineConfig({
  server: {
    hmr: {
      overlay: true  // 显示错误覆盖层
    }
  }
})
```

### 2. 使用浏览器开发者工具
- 按 F12 打开开发者工具
- 切换到 Console 标签查看错误信息
- 切换到 Network 标签查看网络请求
- 切换到 Sources 标签设置断点调试

### 3. Vue Devtools
- 查看组件树结构
- 查看组件状态和属性
- 查看路由信息
- 性能分析

---

## 代码规范建议

### 1. 统一使用 Vue 3 Composition API
```vue
<script setup>
import { ref, reactive } from 'vue'

const count = ref(0)
const state = reactive({ name: 'test' })
</script>
```

### 2. 统一使用新的插槽语法
```vue
<template #header>头部内容</template>
<template #default="scope">默认内容</template>
<template #footer>底部内容</template>
```

### 3. 统一导入和注册图标
```vue
<script>
import { Document, Edit } from '@element-plus/icons-vue'

export default {
  components: { Document, Edit }
}
</script>
```

---

## 常见警告处理

### 1. Missing required prop
**原因：** 组件缺少必需的属性
**解决：** 检查组件文档，添加必需的属性

### 2. Invalid prop type
**原因：** 属性类型不正确
**解决：** 检查传入的值类型是否匹配

### 3. Component is missing template or render function
**原因：** 组件没有模板或渲染函数
**解决：** 确保组件有 `<template>` 标签

---

## 性能优化建议

1. **按需导入图标**：只导入使用的图标，减少打包体积
2. **懒加载路由**：使用动态 import 延迟加载页面
3. **合理使用 v-if 和 v-show**：根据场景选择合适的条件渲染方式
4. **避免深层嵌套**：保持组件层级扁平化

---

## 参考资源

- [Element Plus 官方文档](https://element-plus.org/)
- [Vue 3 官方文档](https://vuejs.org/)
- [Element Plus Icons](https://element-plus.org/zh-CN/component/icon.html)
