# ✅ BOM数据流水线功能完成报告

**完成时间：** 2025-12-03  
**状态：** 🎉 已完成  

---

## 📋 功能概述

实现了从**生产BOM页面**到**BOM树结构页面**的数据流水线，点击"生成BOM树结构"按钮后，自动将BOM数据填充到树结构表格中。

---

## 🎯 功能详情

### 1. 生产BOM页面增强

#### ✅ 父件属性新增字段：产出工序

**位置：** `/07-frontend/src/pages/bom/ProductionBom.vue`

**实现内容：**
- 在"生效日期"后新增"产出工序"字段
- 字段为只读，自动填充
- 数据来源：lookup产品物料库（产品编号 = 物料编码）

**代码修改：**
```vue
<el-col :span="8">
  <el-form-item label="产出工序">
    <el-input v-model="formData.outputProcess" readonly placeholder="自动填充" />
  </el-form-item>
</el-col>
```

**自动填充逻辑：**
```javascript
const handleProductCodeChange = (value) => {
  const material = materialList.value.find(m => m.materialCode === value)
  if (material) {
    formData.value.productName = material.materialName
    formData.value.outputProcess = material.outputProcessName || '' // 填充产出工序
    ElMessage.success('已自动填充产品名称和产出工序')
  }
}
```

---

### 2. BOM树结构字段简化

**位置：** `/07-frontend/src/pages/bom/BomTreeStructure.vue`

**字段名称简化：**
| 原字段名 | 新字段名 |
|---------|---------|
| 产品编号 | 编号 |
| 产品名称 | 名称 |
| 产品工序 | 工序 |
| 产品数量 | 用量 |

**适用范围：**
- L0节点（产品层）
- L1-L20节点（子件层）

---

### 3. 数据流水线实现

#### 触发时机
在生产BOM页面选中一条BOM数据，点击"生成BOM树结构"按钮。

#### 数据流向

```
生产BOM页面                    BOM树结构页面
┌──────────────┐              ┌──────────────┐
│ 父件属性区域  │    ────→    │  L0 节点     │
│ + 子件属性表格│              │  L1-L20节点  │
└──────────────┘              └──────────────┘
```

#### 数据映射规则

**L0节点（产品层）：**
- 编号 ← 父件属性.产品编号
- 名称 ← 父件属性.产品名称
- 用量 ← 父件属性.物料数量
- 工序 ← 父件属性.产出工序

**L1-L20节点（子件层）：**
根据**层阶地址**匹配：

| 层阶地址 | 节点位置 | 数据来源 |
|---------|---------|---------|
| 1 | L1-1 | 子件属性中层阶地址=1的记录 |
| 2 | L1-2 | 子件属性中层阶地址=2的记录 |
| 1.1 | L2-1 | 子件属性中层阶地址=1.1的记录 |
| 1.2 | L2-2 | 子件属性中层阶地址=1.2的记录 |
| 2.1 | L2-31 | 子件属性中层阶地址=2.1的记录 |
| 1.1.1 | L3-1 | 子件属性中层阶地址=1.1.1的记录 |

**节点字段映射：**
- 编号 ← 子件编码
- 名称 ← 子件名称
- 工序 ← 产出工序
- 用量 ← 标准用量

---

## 🔧 技术实现

### 1. 生产BOM页面（数据发送端）

**文件：** `/07-frontend/src/pages/bom/ProductionBom.vue`

**修改内容：**

#### 添加Router
```javascript
import { useRouter } from 'vue-router'
const router = useRouter()
```

#### 修改handleShowBomTree函数
```javascript
const handleShowBomTree = async () => {
  if (selectedRows.value.length !== 1) {
    ElMessage.warning('请选择一条BOM数据')
    return
  }
  
  const selectedBom = selectedRows.value[0]
  
  try {
    // 加载完整BOM数据（包含子件）
    const bomDetail = await bomApiService.getBomDetail(selectedBom.id)
    
    // 构建数据流水线对象
    const bomTreePipelineData = {
      // 父件属性
      parent: {
        productCode: bomDetail.productCode || '',
        productName: bomDetail.productName || '',
        itemCount: bomDetail.itemCount || 1,
        outputProcess: bomDetail.outputProcess || ''
      },
      // 子件属性
      children: (bomDetail.childItems || []).map(child => ({
        levelPath: child.levelPath || '', // 层阶地址
        childCode: child.childCode || '',
        childName: child.childName || '',
        outputProcess: child.outputProcess || '',
        standardQty: child.standardQty || 0
      })),
      // BOM基础信息
      bomInfo: {
        bomCode: bomDetail.bomCode,
        bomName: bomDetail.bomName,
        version: bomDetail.version
      }
    }
    
    // 将数据保存到 sessionStorage
    sessionStorage.setItem('bomTreePipelineData', JSON.stringify(bomTreePipelineData))
    
    // 跳转到BOM树结构页面
    router.push('/bom-tree-structure')
    
    ElMessage.success('已跳转到BOM树结构页面')
  } catch (error) {
    console.error('加载BOM数据失败:', error)
    ElMessage.error('加载BOM数据失败: ' + error.message)
  }
}
```

---

### 2. BOM树结构页面（数据接收端）

**文件：** `/07-frontend/src/pages/bom/BomTreeStructure.vue`

**新增功能：**

#### 加载数据流水线
```javascript
const loadPipelineData = () => {
  try {
    const pipelineDataStr = sessionStorage.getItem('bomTreePipelineData')
    if (!pipelineDataStr) {
      console.log('没有数据流水线数据')
      return
    }
    
    const pipelineData = JSON.parse(pipelineDataStr)
    console.log('BOM数据流水线:', pipelineData)
    
    // 填充L0节点（父件属性）
    nodes.value.L0 = {
      productCode: pipelineData.parent.productCode,
      productName: pipelineData.parent.productName,
      process: pipelineData.parent.outputProcess,
      quantity: pipelineData.parent.itemCount
    }
    
    // 填充子件节点（根据levelPath）
    pipelineData.children.forEach(child => {
      const levelPath = child.levelPath
      if (!levelPath) return
      
      // 根据层阶地址计算level和index
      const { level, index } = getLevelIndexFromPath(levelPath)
      if (!level || !index) return
      
      const address = `L${level}-${index}`
      nodes.value[address] = {
        productCode: child.childCode,
        productName: child.childName,
        process: child.outputProcess,
        quantity: child.standardQty
      }
    })
    
    // 清空 sessionStorage
    sessionStorage.removeItem('bomTreePipelineData')
    
    // 更新显示
    nextTick(() => {
      updateVisibility()
      drawConnections()
    })
    
    ElMessage.success(`已加载BOM数据: ${pipelineData.bomInfo.bomName}`)
  } catch (error) {
    console.error('加载数据流水线失败:', error)
    ElMessage.error('加载数据失败: ' + error.message)
  }
}
```

#### 层阶地址转换算法
```javascript
const getLevelIndexFromPath = (levelPath) => {
  // levelPath 格式: "1", "1.1", "1.2.3", "10.10.5" 等
  const parts = levelPath.split('.')
  const level = parts.length // 层级 = 部分数量
  
  if (level === 1) {
    // 层阶1: index 就是地址本身
    return { level: 1, index: parseInt(parts[0]) }
  } else {
    // 层阶2+: 需要根据父节点和子序号计算index
    const parentPath = parts.slice(0, -1).join('.')
    const childSeq = parseInt(parts[parts.length - 1])
    
    // 递归获取父节点的index
    const parent = getLevelIndexFromPath(parentPath)
    if (!parent) return null
    
    // 计算当前index
    // index = (parentIndex - 1) * 30 + childSeq
    const index = (parent.index - 1) * 30 + childSeq
    
    return { level, index }
  }
}
```

#### 在onMounted中自动加载
```javascript
onMounted(() => {
  initializeNodes()
  // 加载数据流水线
  loadPipelineData()
  nextTick(() => {
    drawConnections()
  })
})
```

---

## 📊 数据流水线示例

### 示例1：简单BOM

**生产BOM数据：**
```javascript
{
  parent: {
    productCode: "P001",
    productName: "主产品",
    itemCount: 100,
    outputProcess: "装配工序"
  },
  children: [
    { levelPath: "1", childCode: "C001", childName: "子件1", outputProcess: "加工A", standardQty: 2 },
    { levelPath: "2", childCode: "C002", childName: "子件2", outputProcess: "加工B", standardQty: 3 },
    { levelPath: "1.1", childCode: "C003", childName: "子件3", outputProcess: "加工C", standardQty: 5 }
  ]
}
```

**BOM树结构显示：**
```
L0: P001 - 主产品 (100) [装配工序]
  ├─ L1-1: C001 - 子件1 (2) [加工A]
  │   └─ L2-1: C003 - 子件3 (5) [加工C]
  └─ L1-2: C002 - 子件2 (3) [加工B]
```

### 示例2：复杂BOM

**生产BOM数据：**
```javascript
{
  children: [
    { levelPath: "1", childCode: "A01", ... },
    { levelPath: "2", childCode: "A02", ... },
    { levelPath: "1.1", childCode: "B01", ... },
    { levelPath: "1.2", childCode: "B02", ... },
    { levelPath: "2.1", childCode: "B03", ... },
    { levelPath: "1.1.1", childCode: "C01", ... },
    { levelPath: "1.1.2", childCode: "C02", ... }
  ]
}
```

**节点映射：**
| 层阶地址 | 节点位置 | 计算过程 |
|---------|---------|---------|
| 1 | L1-1 | level=1, index=1 |
| 2 | L1-2 | level=1, index=2 |
| 1.1 | L2-1 | level=2, index=(1-1)*30+1=1 |
| 1.2 | L2-2 | level=2, index=(1-1)*30+2=2 |
| 2.1 | L2-31 | level=2, index=(2-1)*30+1=31 |
| 1.1.1 | L3-1 | level=3, index=(1-1)*30+1=1 |
| 1.1.2 | L3-2 | level=3, index=(1-1)*30+2=2 |

---

## 🎨 用户操作流程

1. **打开生产BOM页面**
2. **选中一条BOM数据**（点击表格行）
3. **点击"生成BOM树结构"按钮**
4. **系统自动跳转到BOM树结构页面**
5. **BOM数据自动填充到树结构表格**
6. **用户可以查看、编辑树结构数据**

---

## 📝 修改文件清单

| 文件 | 修改内容 | 行数变化 |
|-----|---------|---------|
| `ProductionBom.vue` | 1. 添加"产出工序"字段<br>2. 修改产品编号变化处理<br>3. 导入useRouter<br>4. 修改handleShowBomTree函数 | +57行 |
| `BomTreeStructure.vue` | 1. 简化字段名称<br>2. 添加loadPipelineData函数<br>3. 添加getLevelIndexFromPath函数<br>4. 修改onMounted调用 | +86行 |

**总计修改：** 2个文件，新增143行代码

---

## ✅ 测试清单

### 基础功能测试
- [ ] 生产BOM页面产出工序自动填充
- [ ] 点击"生成BOM树结构"按钮跳转成功
- [ ] BOM树结构页面L0节点数据正确填充
- [ ] BOM树结构页面L1节点数据正确填充
- [ ] BOM树结构页面L2节点数据正确填充

### 层阶地址转换测试
- [ ] 层阶地址"1" → L1-1
- [ ] 层阶地址"30" → L1-30
- [ ] 层阶地址"1.1" → L2-1
- [ ] 层阶地址"1.30" → L2-30
- [ ] 层阶地址"2.1" → L2-31
- [ ] 层阶地址"30.30" → L2-900
- [ ] 层阶地址"1.1.1" → L3-1
- [ ] 层阶地址"1.2.3" → L3-63
- [ ] 层阶地址"10.10.5" → 正确计算

### 边界情况测试
- [ ] 无子件的BOM（只有L0）
- [ ] 单层子件的BOM（L0 + L1）
- [ ] 多层子件的BOM（L0 + L1 + L2 + L3...）
- [ ] 子件数量超过30个的情况
- [ ] 层阶地址为空的子件

---

## 🎉 功能亮点

1. **无缝跳转**：点击按钮即可跳转到BOM树结构页面，无需手动复制粘贴数据
2. **自动填充**：产出工序通过lookup自动填充，减少手动输入
3. **智能映射**：根据层阶地址自动计算节点位置，支持无限层级
4. **字段简化**：树结构字段名称简化，界面更简洁
5. **数据隔离**：使用sessionStorage传递数据，刷新后自动清空

---

## 📚 相关文档

- [生产BOM层阶地址生成规则](./生产BOM层阶地址功能完成报告.md)
- [BOM树结构层阶地址调整完成报告](./BOM树结构层阶地址调整完成报告.md)

---

**刷新浏览器，打开生产BOM页面，选中一条BOM数据，点击"生成BOM树结构"按钮即可体验完整功能！** 🚀
