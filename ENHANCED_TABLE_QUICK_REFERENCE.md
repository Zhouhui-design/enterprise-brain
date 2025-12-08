# ⚡ EnhancedTable 快速参考卡片

> **5秒钟快速检查**，避免5000个页面重复错误！

---

## 🔴 三大必查项

### 1️⃣ 分页：二选一

```vue
<!-- 选项A：内置分页（推荐） -->
<EnhancedTable :show-pagination="true" />  <!-- 默认，可省略 -->

<!-- 选项B：外部分页 -->
<EnhancedTable :show-pagination="false" />  <!-- 🔴 必须禁用！ -->
<el-pagination ... />
```

**❌ 严重错误**: 既不禁用内置分页，又添加外部分页 → **重复分页**

---

### 2️⃣ 操作列：必须用 `#operation`

```vue
<EnhancedTable>
  <template #operation="{ row }">  <!-- ✅ 正确：operation -->
    <el-button @click="handleEdit(row)">编辑</el-button>
  </template>
</EnhancedTable>
```

**❌ 严重错误**: 使用 `#action` → **按钮无法点击**

---

### 3️⃣ 筛选：组件+列都要配置

```vue
<EnhancedTable :show-filter="true" />  <!-- 🔴 组件必须启用 -->
```

```javascript
{ prop: 'name', label: '名称', filterable: true }  // 🔴 列必须设置
```

**❌ 常见错误**: 只配置列，忘记组件属性 → **筛选失效**

---

## 📋 10秒自检清单

使用 EnhancedTable 前，快速回答：

- [ ] **分页**: 内置 or 外部？外部必须 `:show-pagination="false"`
- [ ] **操作列**: 用 `#operation` 而不是 `#action`
- [ ] **筛选**: 需要？`:show-filter="true"`

全部 ✅ → 可以开始写代码！

---

## 🚨 常见错误速查

| 错误症状 | 原因 | 解决方案 |
|---------|------|---------|
| 2个分页组件 | 未禁用内置分页 | 添加 `:show-pagination="false"` |
| 按钮不能点击 | 用了 `#action` | 改为 `#operation` |
| 筛选图标无效 | 未启用筛选 | 添加 `:show-filter="true"` |

---

## 📖 详细文档

完整使用指南：`07-frontend/src/components/common/ENHANCED_TABLE_USAGE_GUIDE.md`

AI开发规范：`07-frontend/src/components/common/AI_DEVELOPMENT_CHECKLIST.md`

---

**记住**: 5000个页面，一次正确，永久正确！💪
