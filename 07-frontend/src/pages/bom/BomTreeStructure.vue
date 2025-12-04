<template>
  <div class="bom-tree-page">
    <!-- 头部工具栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2>BOM树结构</h2>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="loadBomData">
          <el-icon><FolderOpened /></el-icon>
          加载BOM数据
        </el-button>
        <el-button type="success" @click="saveBomTree">
          <el-icon><DocumentCopy /></el-icon>
          保存树结构
        </el-button>
        <el-button @click="resetView">
          <el-icon><Refresh /></el-icon>
          重置视图
        </el-button>
        <el-button @click="exportImage">
          <el-icon><Download /></el-icon>
          导出图片
        </el-button>
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="panel-item">
        <label>显示空节点：</label>
        <el-switch v-model="showEmptyNodes" @change="updateVisibility" />
      </div>
      <div class="panel-item">
        <label>显示连接线：</label>
        <el-switch v-model="showConnections" @change="drawConnections" />
      </div>
      <div class="panel-item">
        <label>垂直间距：</label>
        <el-slider v-model="verticalSpacing" :min="20" :max="100" @change="updateLayout" style="width: 150px;" />
        <span class="spacing-value">{{ verticalSpacing }}px</span>
      </div>
      <div class="panel-item">
        <label>水平间距：</label>
        <el-slider v-model="horizontalSpacing" :min="150" :max="400" @change="updateLayout" style="width: 150px;" />
        <span class="spacing-value">{{ horizontalSpacing }}px</span>
      </div>
      <div class="panel-item">
        <span class="info-text">已配置: {{ configuredNodeCount }} / 总计: {{ totalNodeCount }}</span>
      </div>
      <div class="panel-item">
        <span class="info-text warning">末道无采购级数量: {{ endNodeWithoutPurchaseCount }}</span>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-panel">
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索编号、名称或工序" 
        clearable
        @input="handleSearch"
        style="width: 300px;"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button v-if="searchKeyword" type="primary" size="small" @click="locateNode" style="margin-left: 10px;">
        定位
      </el-button>
      <el-button v-if="searchKeyword" size="small" @click="clearSearch">
        清除
      </el-button>
    </div>

    <!-- BOM树容器 -->
    <div class="bom-tree-container" ref="bomTreeContainer">
      <!-- SVG连接线层 -->
      <svg class="connection-layer" ref="connectionLayer"></svg>

      <!-- 节点层 -->
      <div class="nodes-layer" :style="{ paddingRight: '50px' }">
        <!-- L0层（最右侧） -->
        <div class="level-column level-0" :style="getLevelStyle(0)">
          <div 
            class="bom-cell"
            :class="{ 'cell-hidden': !nodes.L0 || !nodes.L0.productCode, 'cell-active': nodes.L0?.productCode }"
            :data-address="'L0'"
          >
            <div class="cell-header">
              <span class="cell-address">L0</span>
              <span class="cell-badge">产品</span>
            </div>
            <div class="cell-body">
              <div class="cell-field">
                <span class="field-label">编号：</span>
                <el-input 
                  v-model="nodes.L0.productCode" 
                  size="small" 
                  placeholder="XXX"
                  @input="onNodeChange('L0')"
                />
              </div>
              <div class="cell-field">
                <span class="field-label">名称：</span>
                <el-input v-model="nodes.L0.productName" size="small" placeholder="XXX" />
              </div>
              <div class="cell-field">
                <span class="field-label">工序：</span>
                <el-input v-model="nodes.L0.process" size="small" placeholder="XXX" />
              </div>
              <div class="cell-field">
                <span class="field-label">用量：</span>
                <el-input-number v-model="nodes.L0.quantity" size="small" :min="1" placeholder="XXX" />
              </div>
            </div>
          </div>
        </div>

        <!-- L1-L20层 -->
        <div 
          v-for="level in 20" 
          :key="level"
          class="level-column"
          :class="'level-' + level"
          :style="getLevelStyle(level)"
        >
          <div 
            v-for="index in 30"
            :key="`L${level}-${index}`"
            class="bom-cell"
            :class="{ 
              'cell-hidden': !shouldShowCell(level, index), 
              'cell-active': getNodeData(level, index).productCode,
              'cell-warning': isEndNodeWithoutPurchase(level, index)
            }"
            :data-address="`L${level}-${index}`"
            :data-level="level"
            :data-index="index"
          >
            <div class="cell-header">
              <span class="cell-address">{{ calculateLevelPath(level, index) }}</span>
              <span class="cell-badge">{{ getChildCount(level, index) }}</span>
            </div>
            <div class="cell-body">
              <div class="cell-field">
                <span class="field-label">编号：</span>
                <el-input 
                  v-model="getNodeData(level, index).productCode" 
                  size="small" 
                  placeholder="XXX"
                  @input="onNodeChange(`L${level}-${index}`)"
                />
              </div>
              <div class="cell-field">
                <span class="field-label">名称：</span>
                <el-input v-model="getNodeData(level, index).productName" size="small" placeholder="XXX" />
              </div>
              <div class="cell-field">
                <span class="field-label">工序：</span>
                <el-input v-model="getNodeData(level, index).process" size="small" placeholder="XXX" />
              </div>
              <div class="cell-field">
                <span class="field-label">用量：</span>
                <el-input-number v-model="getNodeData(level, index).quantity" size="small" :min="1" placeholder="XXX" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载BOM对话框 -->
    <el-dialog v-model="loadDialogVisible" title="加载BOM数据" width="600px">
      <el-form>
        <el-form-item label="选择BOM">
          <el-select v-model="selectedBomCode" placeholder="请选择要加载的BOM" style="width: 100%;">
            <el-option 
              v-for="bom in bomList" 
              :key="bom.bomCode" 
              :label="`${bom.bomCode} - ${bom.productName}`"
              :value="bom.bomCode"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="loadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmLoadBom">确定加载</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FolderOpened, DocumentCopy, Refresh, Download, Search } from '@element-plus/icons-vue'
import bomTreeStructureApi from '@/api/bomTreeStructure'
import bomApiService from '@/services/api/bomApiService'

// ============ 数据定义 ============
const bomTreeContainer = ref(null)
const connectionLayer = ref(null)

// 控制参数
const showEmptyNodes = ref(false)
const showConnections = ref(true)
const verticalSpacing = ref(50)
const horizontalSpacing = ref(250)

// 节点数据（L0 + L1-L20）
const nodes = ref({
  L0: {
    productCode: '',
    productName: '',
    process: '',
    quantity: 1
  }
})

// 初始化所有层级节点
const initializeNodes = () => {
  // L1-L20，每层30个节点
  for (let level = 1; level <= 20; level++) {
    for (let index = 1; index <= 30; index++) {
      const address = `L${level}-${index}`
      nodes.value[address] = {
        productCode: '',
        productName: '',
        process: '',
        quantity: 1
      }
    }
  }
}

// BOM列表和加载对话框
const bomList = ref([])
const loadDialogVisible = ref(false)
const selectedBomCode = ref('')

// 搜索相关
const searchKeyword = ref('')

// ============ 计算属性 ============
const totalNodeCount = computed(() => {
  // L0(1个) + L1-L20(每层30个)
  return 1 + 20 * 30
})

const configuredNodeCount = computed(() => {
  let count = 0
  if (nodes.value.L0?.productCode) count++
  
  for (let level = 1; level <= 20; level++) {
    for (let index = 1; index <= 30; index++) {
      const address = `L${level}-${index}`
      if (nodes.value[address]?.productCode) count++
    }
  }
  return count
})

// 末道无采购级数量（工序≠“采购”且无下级）
const endNodeWithoutPurchaseCount = computed(() => {
  let count = 0
  for (let level = 1; level <= 20; level++) {
    for (let index = 1; index <= 30; index++) {
      if (isEndNodeWithoutPurchase(level, index)) {
        count++
      }
    }
  }
  return count
})

// ============ 方法定义 ============

// 计算层阶地址（与生产BOM一致）
const calculateLevelPath = (level, index) => {
  if (level === 1) {
    // 层阶1：直接返回序号 1, 2, 3, ...
    return String(index)
  } else {
    // 层阶2及以上：计算父节点地址 + . + 当前在父节点下的序号
    // 每个父节点有30个子节点
    // 计算父节点索引：parentIndex = Math.ceil(index / 30)
    const parentIndex = Math.ceil(index / 30)
    // 计算在父节点下的序号：childSeq = ((index - 1) % 30) + 1
    const childSeq = ((index - 1) % 30) + 1
    
    // 递归计算父节点地址
    const parentPath = calculateLevelPath(level - 1, parentIndex)
    
    return `${parentPath}.${childSeq}`
  }
}

// 获取节点数据
const getNodeData = (level, index) => {
  const address = `L${level}-${index}`
  if (!nodes.value[address]) {
    nodes.value[address] = {
      productCode: '',
      productName: '',
      process: '',
      quantity: 1
    }
  }
  return nodes.value[address]
}

// 判断是否显示单元格
const shouldShowCell = (level, index) => {
  if (showEmptyNodes.value) return true
  const nodeData = getNodeData(level, index)
  return !!nodeData.productCode
}

// 检查是否有子节点
const checkHasChildren = (level, index) => {
  if (level === 20) return false // 最后一层没有子节点
  
  const startIndex = (index - 1) * 30 + 1
  const endIndex = index * 30
  
  for (let i = startIndex; i <= endIndex; i++) {
    const childData = getNodeData(level + 1, i)
    if (childData.productCode) return true
  }
  
  return false
}

// 判断是否为末道无采购节点（工序≠“采购”且无下级）
const isEndNodeWithoutPurchase = (level, index) => {
  const nodeData = getNodeData(level, index)
  if (!nodeData.productCode) return false // 无数据
  if (nodeData.process === '采购') return false // 工序为采购
  return !checkHasChildren(level, index) // 无下级
}

// 获取子件数量
const getChildCount = (level, index) => {
  if (level === 20) return 0 // 最后一层没有子件
  
  let count = 0
  const startIndex = (index - 1) * 30 + 1
  const endIndex = index * 30
  
  for (let i = startIndex; i <= endIndex; i++) {
    const childData = getNodeData(level + 1, i)
    if (childData.productCode) count++
  }
  
  return count
}

// 获取层级样式
const getLevelStyle = (level) => {
  return {
    right: `${level * horizontalSpacing.value}px`,
    gap: `${verticalSpacing.value}px`
  }
}

// 节点数据变化
const onNodeChange = (address) => {
  console.log(`节点 ${address} 数据变化:`, nodes.value[address])
  updateVisibility()
  nextTick(() => {
    drawConnections()
  })
}

// 更新可见性
const updateVisibility = () => {
  nextTick(() => {
    drawConnections()
  })
}

// 更新布局
const updateLayout = () => {
  nextTick(() => {
    drawConnections()
  })
}

// 绘制连接线
const drawConnections = () => {
  if (!showConnections.value) {
    if (connectionLayer.value) {
      connectionLayer.value.innerHTML = ''
    }
    return
  }

  nextTick(() => {
    const svg = connectionLayer.value
    if (!svg) return

    // 清空现有连接线
    svg.innerHTML = ''

    // 设置SVG尺寸
    const container = bomTreeContainer.value
    if (container) {
      svg.setAttribute('width', container.scrollWidth)
      svg.setAttribute('height', container.scrollHeight)
    }

    // 绘制L0到L1的连接线
    drawLevelConnections(0, 1)

    // 绘制L1到L2...L19到L20的连接线
    for (let level = 1; level < 20; level++) {
      drawLevelConnections(level, level + 1)
    }
  })
}

// 绘制指定两层之间的连接线
const drawLevelConnections = (parentLevel, childLevel) => {
  const svg = connectionLayer.value
  if (!svg) return

  // 获取父节点
  if (parentLevel === 0) {
    // L0节点
    const parentEl = document.querySelector('[data-address="L0"]')
    if (!parentEl || !nodes.value.L0?.productCode) return

    const parentRect = parentEl.getBoundingClientRect()
    const containerRect = bomTreeContainer.value.getBoundingClientRect()

    // 连接到30个L1节点
    for (let i = 1; i <= 30; i++) {
      const childAddress = `L${childLevel}-${i}`
      const childEl = document.querySelector(`[data-address="${childAddress}"]`)
      const childData = nodes.value[childAddress]

      if (childEl && childData?.productCode) {
        const childRect = childEl.getBoundingClientRect()
        drawArrow(
          svg,
          parentRect.left - containerRect.left,
          parentRect.top - containerRect.top + parentRect.height / 2,
          childRect.right - containerRect.left,
          childRect.top - containerRect.top + childRect.height / 2
        )
      }
    }
  } else {
    // L1-L19节点
    for (let i = 1; i <= 30; i++) {
      const parentAddress = `L${parentLevel}-${i}`
      const parentEl = document.querySelector(`[data-address="${parentAddress}"]`)
      const parentData = nodes.value[parentAddress]

      if (!parentEl || !parentData?.productCode) continue

      const parentRect = parentEl.getBoundingClientRect()
      const containerRect = bomTreeContainer.value.getBoundingClientRect()

      // 每个父节点连接30个子节点
      const startIndex = (i - 1) * 30 + 1
      const endIndex = i * 30

      for (let j = startIndex; j <= endIndex; j++) {
        const childAddress = `L${childLevel}-${j}`
        const childEl = document.querySelector(`[data-address="${childAddress}"]`)
        const childData = nodes.value[childAddress]

        if (childEl && childData?.productCode) {
          const childRect = childEl.getBoundingClientRect()
          drawArrow(
            svg,
            parentRect.left - containerRect.left,
            parentRect.top - containerRect.top + parentRect.height / 2,
            childRect.right - containerRect.left,
            childRect.top - containerRect.top + childRect.height / 2
          )
        }
      }
    }
  }
}

// 绘制箭头
const drawArrow = (svg, x1, y1, x2, y2) => {
  // 创建连接线
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  line.setAttribute('x1', x1)
  line.setAttribute('y1', y1)
  line.setAttribute('x2', x2)
  line.setAttribute('y2', y2)
  line.setAttribute('stroke', '#409EFF')
  line.setAttribute('stroke-width', '1.5')
  line.setAttribute('opacity', '0.6')
  svg.appendChild(line)

  // 创建箭头头部
  const arrowSize = 6
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
  const points = `${x2},${y2} ${x2 + arrowSize},${y2 - arrowSize} ${x2 + arrowSize},${y2 + arrowSize}`
  polygon.setAttribute('points', points)
  polygon.setAttribute('fill', '#409EFF')
  polygon.setAttribute('opacity', '0.6')
  svg.appendChild(polygon)
}

// 加载BOM数据
const loadBomData = async () => {
  try {
    const response = await bomApiService.getBomList()
    bomList.value = response.data || []
    loadDialogVisible.value = true
  } catch (error) {
    console.error('加载BOM列表失败:', error)
    ElMessage.error('加载BOM列表失败')
  }
}

// 确认加载BOM
const confirmLoadBom = async () => {
  if (!selectedBomCode.value) {
    ElMessage.warning('请选择要加载的BOM')
    return
  }

  try {
    // 从API获取BOM树结构数据
    const response = await bomTreeStructureApi.getTreeStructure(selectedBomCode.value)
    
    if (response.data.success && response.data.data.treeData) {
      // 填充树结构数据
      const treeData = response.data.data.treeData
      
      // 填充L0数据
      if (treeData.levels.L0 && treeData.levels.L0[0]) {
        nodes.value.L0 = {
          productCode: treeData.levels.L0[0].code || '',
          productName: treeData.levels.L0[0].name || '',
          process: treeData.levels.L0[0].processName || '',
          quantity: treeData.levels.L0[0].quantity || 1
        }
      }

      // 填充L1-L20数据
      for (let level = 1; level <= 20; level++) {
        const levelKey = `L${level}`
        if (treeData.levels[levelKey]) {
          treeData.levels[levelKey].forEach((item, index) => {
            const address = `L${level}-${index + 1}`
            nodes.value[address] = {
              productCode: item.code || '',
              productName: item.name || '',
              process: item.processName || '',
              quantity: item.quantity || 1
            }
          })
        }
      }

      loadDialogVisible.value = false
      ElMessage.success('BOM数据加载成功')
      
      nextTick(() => {
        updateVisibility()
      })
    } else {
      ElMessage.warning('该BOM尚未生成树结构')
    }
  } catch (error) {
    console.error('加载BOM数据失败:', error)
    if (error.response?.status === 404) {
      ElMessage.warning('该BOM尚未生成树结构')
    } else {
      ElMessage.error('加载BOM数据失败')
    }
  }
}

// 保存BOM树
const saveBomTree = async () => {
  try {
    // 这里可以保存到数据库
    ElMessage.success('BOM树结构已保存')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

// 重置视图
const resetView = () => {
  ElMessageBox.confirm('确定要重置视图吗？所有数据将被清空。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    initializeNodes()
    nodes.value.L0 = {
      productCode: '',
      productName: '',
      process: '',
      quantity: 1
    }
    ElMessage.success('视图已重置')
    nextTick(() => {
      drawConnections()
    })
  }).catch(() => {})
}

// 导出图片
const exportImage = () => {
  ElMessage.info('导出图片功能开发中...')
}

// 搜索功能
const handleSearch = () => {
  if (!searchKeyword.value) return
  // 搜索逻辑已集成在locateNode中
}

const locateNode = () => {
  if (!searchKeyword.value) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  let found = false
  
  // 遍历所有节点
  for (let level = 1; level <= 20; level++) {
    for (let index = 1; index <= 30; index++) {
      const nodeData = getNodeData(level, index)
      if (!nodeData.productCode) continue
      
      // 匹配编号、名称或工序
      const matchCode = nodeData.productCode?.toLowerCase().includes(keyword)
      const matchName = nodeData.productName?.toLowerCase().includes(keyword)
      const matchProcess = nodeData.process?.toLowerCase().includes(keyword)
      
      if (matchCode || matchName || matchProcess) {
        // 找到匹配节点，滚动到该节点
        const address = `L${level}-${index}`
        const element = document.querySelector(`[data-address="${address}"]`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
          // 高亮显示
          element.style.transition = 'all 0.3s'
          element.style.transform = 'scale(1.1)'
          setTimeout(() => {
            element.style.transform = 'scale(1)'
          }, 1000)
          found = true
          ElMessage.success(`已定位到: ${calculateLevelPath(level, index)}`)
          return
        }
      }
    }
  }
  
  if (!found) {
    ElMessage.warning('未找到匹配节点')
  }
}

const clearSearch = () => {
  searchKeyword.value = ''
}

// 加载数据流水线（从sessionStorage）
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
      process: pipelineData.parent.outputProcess, // 产出工序
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

// 根据层阶地址计算level和index
const getLevelIndexFromPath = (levelPath) => {
  // levelPath 格式: "1", "1.1", "1.2.3", "10.10.5" 等
  const parts = levelPath.split('.')
  const level = parts.length // 层级 = 部分数量
  
  if (level === 1) {
    // 层陈1: index 就是地址本身
    return { level: 1, index: parseInt(parts[0]) }
  } else {
    // 层陈2+: 需要根据父节点和子序号计算index
    // 父节点地址 = parts.slice(0, -1).join('.')
    // 子序号 = parts[parts.length - 1]
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

// ============ 生命周期 ============
onMounted(() => {
  initializeNodes()
  // 加载数据流水线
  loadPipelineData()
  nextTick(() => {
    drawConnections()
  })
  
  // 监听窗口resize和scroll事件
  window.addEventListener('resize', handleResize)
  if (bomTreeContainer.value) {
    bomTreeContainer.value.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (bomTreeContainer.value) {
    bomTreeContainer.value.removeEventListener('scroll', handleScroll)
  }
})

// 窗口resize处理
const handleResize = () => {
  nextTick(() => {
    drawConnections()
  })
}

// 滚动处理
const handleScroll = () => {
  nextTick(() => {
    drawConnections()
  })
}
</script>

<style scoped lang="scss">
.bom-tree-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  
  h2 {
    margin: 0;
    font-size: 20px;
    color: #303133;
  }
  
  .header-right {
    display: flex;
    gap: 12px;
  }
}

.control-panel {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  
  .panel-item {
    display: flex;
    align-items: center;
    gap: 8px;
    
    label {
      font-size: 14px;
      color: #606266;
      white-space: nowrap;
    }
    
    .spacing-value {
      margin-left: 8px;
      font-size: 12px;
      color: #909399;
      min-width: 40px;
    }
    
    .info-text {
      font-size: 14px;
      color: #409EFF;
      font-weight: 500;
      
      &.warning {
        color: #f56c6c;
      }
    }
  }
}

.search-panel {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  gap: 10px;
}

.bom-tree-container {
  flex: 1;
  position: relative;
  overflow: auto;
  background: #fafafa;
}

.connection-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.nodes-layer {
  position: relative;
  display: flex;
  flex-direction: row-reverse;
  min-height: 100%;
  padding: 40px 20px;
  z-index: 2;
}

.level-column {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  &.level-0 {
    justify-content: center;
  }
}

.bom-cell {
  width: 220px;
  background: white;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.3s;
  
  &.cell-hidden {
    display: none;
  }
  
  &.cell-active {
    border-color: #409EFF;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  }
  
  &.cell-warning {
    border-color: #f56c6c !important;
    background: #fef0f0;
    box-shadow: 0 0 8px rgba(245, 108, 108, 0.4);
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  }
}

.cell-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
  
  .cell-address {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }
  
  .cell-badge {
    font-size: 11px;
    padding: 2px 8px;
    background: #ecf5ff;
    color: #409EFF;
    border-radius: 10px;
  }
}

.cell-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cell-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  .field-label {
    font-size: 12px;
    color: #606266;
  }
  
  :deep(.el-input__inner) {
    font-size: 12px;
  }
  
  :deep(.el-input-number) {
    width: 100%;
  }
}
</style>
