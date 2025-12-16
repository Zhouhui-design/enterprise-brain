<template>
  <div class="process-flow">
    <!-- 工具栏 -->
    <div class="flow-toolbar">
      <el-button-group>
        <el-button type="primary" icon="el-icon-plus" @click="addOperation">添加工序</el-button>
        <el-button type="success" icon="el-icon-edit" @click="editSelectedOperation">编辑工序</el-button>
        <el-button type="danger" icon="el-icon-delete" @click="deleteSelectedOperation">删除工序</el-button>
      </el-button-group>
      
      <el-button-group class="ml-4">
        <el-button icon="el-icon-sort" @click="autoLayout">自动布局</el-button>
        <el-button icon="el-icon-refresh" @click="clearSelection">清空选择</el-button>
        <el-button icon="el-icon-download" @click="exportFlow">导出流程图</el-button>
      </el-button-group>
      
      <el-button-group class="ml-4">
        <el-button @click="zoomOut" :disabled="scale <= 0.5">缩小</el-button>
        <el-button @click="zoomIn" :disabled="scale >= 2">放大</el-button>
        <el-button @click="resetZoom">重置</el-button>
      </el-button-group>
      
      <el-dropdown trigger="click" class="ml-4">
        <el-button>视图设置 <i class="el-icon-arrow-down el-icon--right"></i></el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item @click="showGrid = !showGrid">
            <i class="el-icon-check" v-if="showGrid"></i>
            <i class="el-icon-close" v-else></i>
            显示网格
          </el-dropdown-item>
          <el-dropdown-item @click="showConnectionLabels = !showConnectionLabels">
            <i class="el-icon-check" v-if="showConnectionLabels"></i>
            <i class="el-icon-close" v-else></i>
            显示连线标签
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>

    <!-- 操作提示 -->
    <div class="operation-tips">
      <span>提示：点击选择工序节点，拖拽移动位置，选中节点后点击其他节点可建立连线，Ctrl+点击多选</span>
    </div>

    <!-- 流程图区域 -->
    <div class="flow-canvas-container" ref="canvasContainer">
      <div 
        class="flow-canvas" 
        :style="{ 
          transform: `scale(${scale})`, 
          transformOrigin: '0 0' 
        }"
        @click="handleCanvasClick"
      >
        <div class="grid" v-if="showGrid"></div>
        
        <!-- 连接线 -->
        <svg class="connections-layer" width="100%" height="100%" @click.stop>
          <template v-for="connection in connections" :key="connection.id">
            <line
              :x1="getOperationPosition(connection.fromId).x + 100"
              :y1="getOperationPosition(connection.fromId).y + 30"
              :x2="getOperationPosition(connection.toId).x"
              :y2="getOperationPosition(connection.toId).y + 30"
              stroke="#909399"
              stroke-width="2"
              :stroke-dasharray="connection.isOptional ? '5,5' : '0'"
            />
            <polygon
              :points="getArrowPoints(connection.fromId, connection.toId)"
              fill="#909399"
            />
            <text
              v-if="showConnectionLabels"
              :x="(getOperationPosition(connection.fromId).x + getOperationPosition(connection.toId).x + 100) / 2 - 10"
              :y="(getOperationPosition(connection.fromId).y + getOperationPosition(connection.toId).y + 60) / 2 - 10"
              font-size="12"
              fill="#606266"
            >
              {{ connection.type || '顺序' }}
            </text>
          </template>
        </svg>

        <!-- 工序节点 -->
        <div
          v-for="operation in operations"
          :key="operation.id"
          class="operation-node"
          :class="{
            'selected': selectedOperations.includes(operation.id),
            'critical': operation.isCritical,
            'bottleneck': operation.isBottleneck
          }"
          :style="{
            left: operation.x + 'px',
            top: operation.y + 'px'
          }"
          @click.stop="handleOperationClick(operation.id, $event)"
          @mousedown.stop="startDrag($event, operation.id)"
        >
          <div class="node-header">
            <span class="node-code">{{ operation.operationCode }}</span>
            <div class="node-badges">
              <span class="badge critical" v-if="operation.isCritical">关键</span>
              <span class="badge bottleneck" v-if="operation.isBottleneck">瓶颈</span>
            </div>
          </div>
          <div class="node-title">{{ operation.operationName }}</div>
          <div class="node-info">
            <span class="info-item">标准工时: {{ operation.standardTime || 0 }}min</span>
            <span class="info-item">优先级: {{ operation.priority || 5 }}</span>
          </div>
          <div class="node-connections">
            <div class="in-ports">
              <span class="port in-port" @click.stop="startConnect(operation.id, 'in')" title="输入端口"></span>
            </div>
            <div class="out-ports">
              <span class="port out-port" @click.stop="startConnect(operation.id, 'out')" title="输出端口"></span>
            </div>
          </div>
        </div>

        <!-- 连线预览 -->
        <svg class="preview-layer" width="100%" height="100%" v-if="isConnecting" @click.stop>
          <line
            :x1="connectStart.x"
            :y1="connectStart.y"
            :x2="connectEnd.x"
            :y2="connectEnd.y"
            stroke="#409EFF"
            stroke-width="2"
            stroke-dasharray="5,5"
          />
          <polygon
            :points="getArrowPointsByCoords(connectStart.x, connectStart.y, connectEnd.x, connectEnd.y)"
            fill="#409EFF"
          />
        </svg>
      </div>
    </div>

    <!-- 工序编辑对话框 -->
    <el-dialog
      title="工序详情"
      :visible.sync="editDialogVisible"
      width="70%"
      :before-close="handleEditDialogClose"
    >
      <operation-editor
        ref="operationEditor"
        :operation-data="currentOperation"
        :visible="editDialogVisible"
        @save="handleOperationSave"
        @cancel="handleEditDialogClose"
      />
    </el-dialog>

    <!-- 连接类型选择对话框 -->
    <el-dialog
      title="设置连接类型"
      :visible.sync="connectionDialogVisible"
      width="400px"
      :before-close="cancelConnect"
    >
      <el-form ref="connectionForm" :model="newConnection" :rules="connectionRules" label-width="100px">
        <el-form-item label="连接类型" prop="type">
          <el-select v-model="newConnection.type" placeholder="请选择连接类型">
            <el-option label="顺序连接" value="顺序" />
            <el-option label="并行连接" value="并行" />
            <el-option label="条件连接" value="条件" />
            <el-option label="循环连接" value="循环" />
          </el-select>
        </el-form-item>
        <el-form-item label="可选连接">
          <el-switch v-model="newConnection.isOptional" active-color="#13ce66" inactive-color="#ff4949" />
        </el-form-item>
        <el-form-item label="连接描述">
          <el-input v-model="newConnection.description" placeholder="请输入连接描述" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancelConnect">取消</el-button>
        <el-button type="primary" @click="confirmConnect">确定</el-button>
      </div>
    </el-dialog>

    <!-- 流程图统计信息 -->
    <div class="flow-stats">
      <el-descriptions :column="4" border>
        <el-descriptions-item label="工序总数">{{ operations.length }}</el-descriptions-item>
        <el-descriptions-item label="关键工序">{{ operations.filter(op => op.isCritical).length }}</el-descriptions-item>
        <el-descriptions-item label="瓶颈工序">{{ operations.filter(op => op.isBottleneck).length }}</el-descriptions-item>
        <el-descriptions-item label="连接总数">{{ connections.length }}</el-descriptions-item>
        <el-descriptions-item label="总工时">{{ totalStandardTime }}分钟</el-descriptions-item>
        <el-descriptions-item label="最长路径">{{ longestPathLength }}工序</el-descriptions-item>
        <el-descriptions-item label="最长路径工时">{{ longestPathTime }}分钟</el-descriptions-item>
        <el-descriptions-item label="有效工序">{{ validOperationsCount }}工序</el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script>
// 导入OperationEditor组件
import OperationEditor from './OperationEditor.vue'

export default {
  name: 'ProcessFlow',
  components: {
    OperationEditor
  },
  props: {
    initialOperations: {
      type: Array,
      default: () => []
    },
    initialConnections: {
      type: Array,
      default: () => []
    },
    editable: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      // 工序数据
      operations: [],
      // 连接数据
      connections: [],
      // 选中的工序ID列表
      selectedOperations: [],
      // 缩放比例
      scale: 1,
      // 显示网格
      showGrid: true,
      // 显示连线标签
      showConnectionLabels: true,
      // 编辑对话框可见性
      editDialogVisible: false,
      // 当前编辑的工序
      currentOperation: null,
      // 拖拽相关
      isDragging: false,
      dragOperationId: null,
      dragOffset: { x: 0, y: 0 },
      // 连线相关
      isConnecting: false,
      connectStart: { x: 0, y: 0 },
      connectEnd: { x: 0, y: 0 },
      connectFromId: null,
      connectType: null,
      // 连接对话框
      connectionDialogVisible: false,
      newConnection: {
        type: '顺序',
        isOptional: false,
        description: ''
      },
      // 连接表单验证规则
      connectionRules: {
        type: [
          { required: true, message: '请选择连接类型', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    // 计算总标准工时
    totalStandardTime() {
      return this.operations.reduce((sum, op) => sum + (Number(op.standardTime) || 0), 0)
    },
    // 计算有效工序数量
    validOperationsCount() {
      const connectedOps = new Set()
      this.connections.forEach(conn => {
        connectedOps.add(conn.fromId)
        connectedOps.add(conn.toId)
      })
      return connectedOps.size
    },
    // 计算最长路径长度
    longestPathLength() {
      const graph = this.buildGraph()
      const criticalPath = this.findCriticalPath(graph)
      return criticalPath.length
    },
    // 计算最长路径工时
    longestPathTime() {
      const graph = this.buildGraph()
      const criticalPath = this.findCriticalPath(graph)
      return criticalPath.reduce((sum, opId) => {
        const op = this.operations.find(o => o.id === opId)
        return sum + (Number(op?.standardTime) || 0)
      }, 0)
    }
  },
  watch: {
    // 监听初始数据变化
    initialOperations: {
      handler(newVal) {
        if (newVal && newVal.length > 0) {
          this.operations = JSON.parse(JSON.stringify(newVal))
          this.autoLayout()
        }
      },
      immediate: true
    },
    initialConnections: {
      handler(newVal) {
        if (newVal && newVal.length > 0) {
          this.connections = JSON.parse(JSON.stringify(newVal))
        }
      },
      immediate: true
    }
  },
  mounted() {
    // 初始化事件监听
    this.initEventListeners()
    
    // 如果没有初始数据，加载模拟数据
    if (this.operations.length === 0) {
      this.loadMockData()
      this.autoLayout()
    }
  },
  beforeDestroy() {
    // 移除事件监听
    this.removeEventListeners()
  },
  methods: {
    // 加载模拟数据
    loadMockData() {
      this.operations = [
        {
          id: 'op001',
          operationCode: 'OP-001',
          operationName: '原材料准备',
          standardTime: 60,
          priority: 8,
          isCritical: true,
          isBottleneck: false,
          x: 0,
          y: 0
        },
        {
          id: 'op002',
          operationCode: 'OP-002',
          operationName: 'CNC加工',
          standardTime: 120,
          priority: 10,
          isCritical: true,
          isBottleneck: true,
          x: 0,
          y: 0
        },
        {
          id: 'op003',
          operationCode: 'OP-003',
          operationName: '表面处理',
          standardTime: 90,
          priority: 7,
          isCritical: false,
          isBottleneck: false,
          x: 0,
          y: 0
        },
        {
          id: 'op004',
          operationCode: 'OP-004',
          operationName: '质量检验',
          standardTime: 45,
          priority: 9,
          isCritical: true,
          isBottleneck: false,
          x: 0,
          y: 0
        },
        {
          id: 'op005',
          operationCode: 'OP-005',
          operationName: '装配',
          standardTime: 180,
          priority: 8,
          isCritical: false,
          isBottleneck: true,
          x: 0,
          y: 0
        },
        {
          id: 'op006',
          operationCode: 'OP-006',
          operationName: '包装入库',
          standardTime: 30,
          priority: 6,
          isCritical: false,
          isBottleneck: false,
          x: 0,
          y: 0
        }
      ]
      
      this.connections = [
        { id: 'conn001', fromId: 'op001', toId: 'op002', type: '顺序', isOptional: false },
        { id: 'conn002', fromId: 'op002', toId: 'op003', type: '顺序', isOptional: false },
        { id: 'conn003', fromId: 'op003', toId: 'op004', type: '顺序', isOptional: false },
        { id: 'conn004', fromId: 'op004', toId: 'op005', type: '顺序', isOptional: false },
        { id: 'conn005', fromId: 'op005', toId: 'op006', type: '顺序', isOptional: false },
        { id: 'conn006', fromId: 'op004', toId: 'op002', type: '条件', isOptional: true } // 返工连接
      ]
    },
    
    // 初始化事件监听
    initEventListeners() {
      document.addEventListener('mousemove', this.handleMouseMove)
      document.addEventListener('mouseup', this.handleMouseUp)
      document.addEventListener('keydown', this.handleKeyDown)
    },
    
    // 移除事件监听
    removeEventListeners() {
      document.removeEventListener('mousemove', this.handleMouseMove)
      document.removeEventListener('mouseup', this.handleMouseUp)
      document.removeEventListener('keydown', this.handleKeyDown)
    },
    
    // 添加工序
    addOperation() {
      const newOp = {
        id: `op${Date.now()}`,
        operationCode: `OP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        operationName: '新工序',
        standardTime: 0,
        priority: 5,
        isCritical: false,
        isBottleneck: false,
        x: 200,
        y: 200
      }
      
      this.operations.push(newOp)
      this.selectedOperations = [newOp.id]
      this.editOperation(newOp.id)
      
      this.$emit('operation-added', newOp)
    },
    
    // 编辑工序
    editOperation(operationId) {
      const operation = this.operations.find(op => op.id === operationId)
      if (operation) {
        this.currentOperation = { ...operation }
        this.editDialogVisible = true
      }
    },
    
    // 编辑选中的工序
    editSelectedOperation() {
      if (this.selectedOperations.length === 1) {
        this.editOperation(this.selectedOperations[0])
      } else if (this.selectedOperations.length > 1) {
        this.$message.warning('请选择单个工序进行编辑')
      } else {
        this.$message.warning('请先选择要编辑的工序')
      }
    },
    
    // 删除选中的工序
    deleteSelectedOperation() {
      if (this.selectedOperations.length === 0) {
        this.$message.warning('请先选择要删除的工序')
        return
      }
      
      this.$confirm('确定要删除选中的工序吗？删除后相关连接也将被移除。', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 删除相关连接
        this.connections = this.connections.filter(conn => 
          !this.selectedOperations.includes(conn.fromId) && 
          !this.selectedOperations.includes(conn.toId)
        )
        
        // 删除工序
        this.operations = this.operations.filter(op => 
          !this.selectedOperations.includes(op.id)
        )
        
        this.selectedOperations = []
        this.$message.success('删除成功')
        
        this.$emit('operations-deleted', [...this.selectedOperations])
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 保存工序编辑
    handleOperationSave(operationData) {
      const index = this.operations.findIndex(op => op.id === operationData.id)
      if (index !== -1) {
        this.operations[index] = { ...operationData }
        this.$emit('operation-updated', this.operations[index])
      }
      this.editDialogVisible = false
    },
    
    // 关闭编辑对话框
    handleEditDialogClose() {
      this.editDialogVisible = false
      this.currentOperation = null
    },
    
    // 处理工序点击
    handleOperationClick(operationId, event) {
      if (!this.editable) return
      
      if (event.ctrlKey || event.metaKey) {
        // 多选模式
        if (this.selectedOperations.includes(operationId)) {
          this.selectedOperations = this.selectedOperations.filter(id => id !== operationId)
        } else {
          this.selectedOperations.push(operationId)
        }
      } else {
        // 单选模式
        this.selectedOperations = [operationId]
      }
    },
    
    // 处理画布点击
    handleCanvasClick() {
      this.selectedOperations = []
    },
    
    // 开始拖拽
    startDrag(event, operationId) {
      if (!this.editable) return
      
      const operation = this.operations.find(op => op.id === operationId)
      if (!operation) return
      
      this.isDragging = true
      this.dragOperationId = operationId
      
      const rect = event.target.getBoundingClientRect()
      this.dragOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
    },
    
    // 处理鼠标移动
    handleMouseMove(event) {
      // 处理拖拽
      if (this.isDragging && this.dragOperationId) {
        const containerRect = this.$refs.canvasContainer.getBoundingClientRect()
        const operation = this.operations.find(op => op.id === this.dragOperationId)
        
        if (operation) {
          operation.x = (event.clientX - containerRect.left - this.dragOffset.x) / this.scale
          operation.y = (event.clientY - containerRect.top - this.dragOffset.y) / this.scale
          
          // 确保不拖拽出画布边界
          operation.x = Math.max(0, operation.x)
          operation.y = Math.max(0, operation.y)
        }
      }
      
      // 处理连线预览
      if (this.isConnecting) {
        const containerRect = this.$refs.canvasContainer.getBoundingClientRect()
        this.connectEnd = {
          x: (event.clientX - containerRect.left) / this.scale,
          y: (event.clientY - containerRect.top) / this.scale
        }
      }
    },
    
    // 处理鼠标松开
    handleMouseUp() {
      this.isDragging = false
      this.dragOperationId = null
    },
    
    // 开始连线
    startConnect(operationId, portType) {
      if (!this.editable) return
      
      this.isConnecting = true
      this.connectFromId = operationId
      this.connectType = portType
      
      const operation = this.operations.find(op => op.id === operationId)
      if (operation) {
        this.connectStart = portType === 'out' 
          ? { x: operation.x + 200, y: operation.y + 30 }
          : { x: operation.x, y: operation.y + 30 }
        this.connectEnd = { ...this.connectStart }
      }
    },
    
    // 取消连线
    cancelConnect() {
      this.isConnecting = false
      this.connectFromId = null
      this.connectType = null
      this.connectionDialogVisible = false
      this.newConnection = {
        type: '顺序',
        isOptional: false,
        description: ''
      }
    },
    
    // 确认连线
    confirmConnect() {
      this.$refs.connectionForm.validate((valid) => {
        if (valid) {
          // 检查是否已经存在相同连接
          const existingConnection = this.connections.find(conn => 
            conn.fromId === this.newConnection.fromId && conn.toId === this.newConnection.toId
          )
          
          if (existingConnection) {
            this.$message.warning('该连接已存在')
            return
          }
          
          // 检查是否形成循环
          if (this.wouldCreateCycle(this.newConnection.fromId, this.newConnection.toId)) {
            this.$message.warning('不能创建循环连接')
            return
          }
          
          const connection = {
            id: `conn${Date.now()}`,
            fromId: this.newConnection.fromId,
            toId: this.newConnection.toId,
            type: this.newConnection.type,
            isOptional: this.newConnection.isOptional,
            description: this.newConnection.description
          }
          
          this.connections.push(connection)
          this.$emit('connection-added', connection)
          
          this.cancelConnect()
          this.$message.success('连接创建成功')
        }
      })
    },
    
    // 处理按键事件
    handleKeyDown(event) {
      // Delete键删除选中项
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        this.deleteSelectedOperation()
      }
      
      // Ctrl+Z 撤销操作（简化实现）
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault()
        this.$message.info('撤销操作功能待实现')
      }
    },
    
    // 自动布局
    autoLayout() {
      const cols = Math.ceil(Math.sqrt(this.operations.length))
      const rows = Math.ceil(this.operations.length / cols)
      const spacing = 250
      
      this.operations.forEach((op, index) => {
        const row = Math.floor(index / cols)
        const col = index % cols
        op.x = col * spacing + 50
        op.y = row * spacing + 50
      })
    },
    
    // 获取工序位置
    getOperationPosition(operationId) {
      const operation = this.operations.find(op => op.id === operationId)
      return operation ? { x: operation.x, y: operation.y } : { x: 0, y: 0 }
    },
    
    // 获取箭头点
    getArrowPoints(fromId, toId) {
      const fromPos = this.getOperationPosition(fromId)
      const toPos = this.getOperationPosition(toId)
      return this.getArrowPointsByCoords(fromPos.x + 100, fromPos.y + 30, toPos.x, toPos.y + 30)
    },
    
    // 根据坐标获取箭头点
    getArrowPointsByCoords(x1, y1, x2, y2) {
      const angle = Math.atan2(y2 - y1, x2 - x1)
      const arrowLength = 10
      const arrowAngle = Math.PI / 6
      
      const x3 = x2 - arrowLength * Math.cos(angle - arrowAngle)
      const y3 = y2 - arrowLength * Math.sin(angle - arrowAngle)
      const x4 = x2 - arrowLength * Math.cos(angle + arrowAngle)
      const y4 = y2 - arrowLength * Math.sin(angle + arrowAngle)
      
      return `${x2},${y2} ${x3},${y3} ${x4},${y4}`
    },
    
    // 清空选择
    clearSelection() {
      this.selectedOperations = []
    },
    
    // 导出流程图
    exportFlow() {
      this.$message.info('导出流程图功能待实现')
    },
    
    // 放大
    zoomIn() {
      this.scale = Math.min(this.scale + 0.1, 2)
    },
    
    // 缩小
    zoomOut() {
      this.scale = Math.max(this.scale - 0.1, 0.5)
    },
    
    // 重置缩放
    resetZoom() {
      this.scale = 1
    },
    
    // 构建图结构
    buildGraph() {
      const graph = {}
      this.operations.forEach(op => {
        graph[op.id] = { time: Number(op.standardTime) || 0, next: [] }
      })
      this.connections.forEach(conn => {
        if (graph[conn.fromId]) {
          graph[conn.fromId].next.push(conn.toId)
        }
      })
      return graph
    },
    
    // 查找关键路径
    findCriticalPath(graph) {
      // 简化实现：找到最长路径
      let maxLength = 0
      let criticalPath = []
      
      const dfs = (node, path, length) => {
        path.push(node)
        
        if (!graph[node].next.length) {
          if (length > maxLength) {
            maxLength = length
            criticalPath = [...path]
          }
        } else {
          graph[node].next.forEach(nextNode => {
            dfs(nextNode, [...path], length + 1)
          })
        }
      }
      
      // 找到所有入度为0的节点作为起点
      const inDegree = {}
      this.connections.forEach(conn => {
        inDegree[conn.toId] = (inDegree[conn.toId] || 0) + 1
      })
      
      const startNodes = this.operations
        .filter(op => !inDegree[op.id])
        .map(op => op.id)
      
      startNodes.forEach(node => {
        dfs(node, [], 1)
      })
      
      return criticalPath
    },
    
    // 检查是否会形成循环
    wouldCreateCycle(fromId, toId) {
      // 简单实现：检查toId是否可达fromId
      const visited = new Set()
      
      const hasPath = (start, end) => {
        if (start === end) return true
        visited.add(start)
        
        const neighbors = this.connections
          .filter(conn => conn.fromId === start)
          .map(conn => conn.toId)
          .filter(id => !visited.has(id))
        
        return neighbors.some(neighbor => hasPath(neighbor, end))
      }
      
      return hasPath(toId, fromId)
    },
    
    // 获取完整的流程图数据
    getFlowData() {
      return {
        operations: JSON.parse(JSON.stringify(this.operations)),
        connections: JSON.parse(JSON.stringify(this.connections))
      }
    },
    
    // 验证流程图的完整性
    validateFlow() {
      // 检查是否有孤立节点
      const connectedNodes = new Set()
      this.connections.forEach(conn => {
        connectedNodes.add(conn.fromId)
        connectedNodes.add(conn.toId)
      })
      
      const isolatedNodes = this.operations.filter(op => !connectedNodes.has(op.id))
      
      if (isolatedNodes.length > 0) {
        return {
          valid: false,
          message: `存在${isolatedNodes.length}个孤立工序节点，需要建立连接`
        }
      }
      
      // 检查是否有循环依赖
      const hasCycles = this.checkCycles()
      if (hasCycles) {
        return {
          valid: false,
          message: '流程图中存在循环依赖'
        }
      }
      
      return { valid: true, message: '流程图验证通过' }
    },
    
    // 检查循环依赖
    checkCycles() {
      const visited = new Set()
      const recStack = new Set()
      
      const hasCycle = (node) => {
        if (!visited.has(node)) {
          visited.add(node)
          recStack.add(node)
          
          const neighbors = this.connections
            .filter(conn => conn.fromId === node)
            .map(conn => conn.toId)
          
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor) && hasCycle(neighbor)) {
              return true
            } else if (recStack.has(neighbor)) {
              return true
            }
          }
        }
        recStack.delete(node)
        return false
      }
      
      for (const op of this.operations) {
        if (hasCycle(op.id)) {
          return true
        }
      }
      
      return false
    }
  }
}
</script>

<style scoped>
.process-flow {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f5f7fa;
}

/* 工具栏样式 */
.flow-toolbar {
  padding: 10px 20px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

/* 操作提示 */
.operation-tips {
  padding: 8px 20px;
  background-color: #ecf5ff;
  color: #606266;
  font-size: 12px;
  border-bottom: 1px solid #ebeef5;
}

/* 画布容器 */
.flow-canvas-container {
  flex: 1;
  overflow: auto;
  position: relative;
  background-color: #fafafa;
  min-height: 500px;
}

/* 画布 */
.flow-canvas {
  position: relative;
  width: 2000px;
  height: 2000px;
  background-color: #ffffff;
  transition: transform 0.2s ease;
}

/* 网格背景 */
.grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(#e0e0e0 1px, transparent 1px),
                   linear-gradient(90deg, #e0e0e0 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

/* 连线层 */
.connections-layer,
.preview-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

/* 工序节点 */
.operation-node {
  position: absolute;
  width: 200px;
  min-height: 60px;
  background-color: #ffffff;
  border: 2px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  cursor: move;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  z-index: 10;
}

.operation-node:hover {
  border-color: #c0c4cc;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.operation-node.selected {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.operation-node.critical {
  border-left: 4px solid #f56c6c;
}

.operation-node.bottleneck {
  border-right: 4px solid #e6a23c;
}

/* 节点内容 */
.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.node-code {
  font-weight: bold;
  color: #606266;
  font-size: 14px;
}

.node-badges {
  display: flex;
  gap: 4px;
}

.badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  color: white;
}

.badge.critical {
  background-color: #f56c6c;
}

.badge.bottleneck {
  background-color: #e6a23c;
}

.node-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-info {
  font-size: 12px;
  color: #909399;
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

/* 端口样式 */
.node-connections {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.port {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #dcdfe6;
  cursor: pointer;
  transition: all 0.3s ease;
}

.port:hover {
  background-color: #409EFF;
  transform: scale(1.2);
}

.port.in-port:hover {
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
}

.port.out-port:hover {
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
}

/* 统计信息 */
.flow-stats {
  padding: 15px 20px;
  background-color: #fff;
  border-top: 1px solid #e4e7ed;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .flow-toolbar {
    padding: 8px 10px;
  }
  
  .operation-tips {
    padding: 6px 10px;
    font-size: 11px;
  }
  
  .operation-node {
    width: 150px;
    min-height: 50px;
    padding: 8px;
  }
  
  .node-title {
    font-size: 13px;
  }
  
  .node-info {
    font-size: 11px;
  }
  
  .flow-stats {
    padding: 10px;
  }
  
  .el-descriptions {
    font-size: 12px;
  }
}
</style>