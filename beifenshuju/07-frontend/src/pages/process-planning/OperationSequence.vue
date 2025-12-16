<template>
  <div class="operation-sequence-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>工序顺序管理</h1>
      <div class="header-actions">
        <el-button type="primary" icon="el-icon-plus" @click="createNewSequence">新建顺序</el-button>
        <el-button icon="el-icon-save" @click="saveSequence">保存</el-button>
        <el-button icon="el-icon-upload" @click="importSequence">导入</el-button>
        <el-button icon="el-icon-download" @click="exportSequence">导出</el-button>
      </div>
    </div>

    <!-- 基本信息区域 -->
    <div class="basic-info-section">
      <el-card>
        <div class="info-form">
          <el-form :model="sequenceInfo" label-width="120px" inline>
            <el-form-item label="顺序编号">
              <el-input v-model="sequenceInfo.code" placeholder="请输入顺序编号" readonly />
            </el-form-item>
            <el-form-item label="关联路线">
              <el-select v-model="sequenceInfo.routeId" placeholder="请选择工序路线" @change="onRouteChange">
                <el-option v-for="route in routeOptions" :key="route.id" :label="route.name" :value="route.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="版本">
              <el-input v-model="sequenceInfo.version" placeholder="版本号" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="sequenceInfo.status" placeholder="请选择状态">
                <el-option label="草稿" value="draft" />
                <el-option label="已发布" value="published" />
                <el-option label="已停用" value="disabled" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </el-card>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar-section">
      <el-card>
        <div class="toolbar-actions">
          <el-button-group>
            <el-button type="primary" icon="el-icon-circle-plus-outline" @click="addOperation">添加工序</el-button>
            <el-button icon="el-icon-delete" @click="deleteSelectedOperation">删除工序</el-button>
            <el-button icon="el-icon-sort" @click="sortOperations">排序工序</el-button>
            <el-button icon="el-icon-refresh" @click="resetLayout">重置布局</el-button>
          </el-button-group>
          <el-button-group>
            <el-button icon="el-icon-zoom-in" @click="zoomIn">放大</el-button>
            <el-button icon="el-icon-zoom-out" @click="zoomOut">缩小</el-button>
            <el-button icon="el-icon-full-screen" @click="fitToScreen">适应屏幕</el-button>
          </el-button-group>
          <el-select v-model="viewMode" placeholder="视图模式" style="width: 120px; margin-left: 10px;">
            <el-option label="流程图" value="flowchart" />
            <el-option label="甘特图" value="gantt" />
            <el-option label="列表" value="list" />
          </el-select>
        </div>
      </el-card>
    </div>

    <!-- 工序顺序编辑区域 -->
    <div class="sequence-editor-section">
      <el-card>
        <!-- 流程图视图 -->
        <div v-if="viewMode === 'flowchart'" class="flowchart-container" ref="flowchartContainer">
          <!-- 工序节点 -->
          <div
            v-for="operation in operations"
            :key="operation.id"
            :class="['operation-node', { 'selected': selectedOperationId === operation.id }]"
            :style="getOperationNodeStyle(operation)"
            @click="selectOperation(operation.id)"
            @mousedown="startDrag($event, operation)"
          >
            <div class="node-header">
              <span class="node-id">{{ operation.code }}</span>
              <span class="node-status" :class="`status-${operation.status}`">{{ getStatusText(operation.status) }}</span>
            </div>
            <div class="node-title">{{ operation.name }}</div>
            <div class="node-info">
              <div>标准工时: {{ operation.standardTime }}min</div>
              <div>前置工序: {{ getPredecessorNames(operation.id).join(', ') || '无' }}</div>
            </div>
            <div class="node-ports">
              <div
                v-for="port in ['in', 'out']"
                :key="port"
                :class="['port', port]"
                @click.stop="startConnect($event, operation.id, port)"
              ></div>
            </div>
          </div>
          
          <!-- 连接线 -->
          <svg class="connection-layer" ref="connectionLayer">
            <g>
              <path
                v-for="connection in connections"
                :key="`${connection.from}-${connection.to}`"
                class="connection-path"
                :d="getConnectionPath(connection)"
                :stroke="connection.selected ? '#409EFF' : '#909399'"
                :stroke-width="connection.selected ? 2 : 1"
                fill="none"
                @click="selectConnection(connection)"
              ></path>
              <polygon
                v-for="connection in connections"
                :key="`arrow-${connection.from}-${connection.to}`"
                class="connection-arrow"
                :points="getArrowPoints(connection)"
                fill="#909399"
              ></polygon>
            </g>
          </svg>
        </div>

        <!-- 甘特图视图 -->
        <div v-if="viewMode === 'gantt'" class="gantt-container">
          <el-table :data="operations" style="width: 100%;" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" />
            <el-table-column prop="code" label="工序编码" width="120" />
            <el-table-column prop="name" label="工序名称" width="180" />
            <el-table-column label="工序甘特图" width="800">
              <template slot-scope="scope">
                <div class="gantt-bar-container">
                  <div 
                    class="gantt-bar" 
                    :style="{
                      left: `${scope.row.startTime * 10}px`,
                      width: `${scope.row.standardTime * 10}px`,
                      backgroundColor: getOperationColor(scope.row.status)
                    }"
                  >
                    <span>{{ scope.row.name }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="standardTime" label="标准工时(min)" width="120" />
            <el-table-column label="操作" width="150" fixed="right">
              <template slot-scope="scope">
                <el-button size="mini" @click="editOperation(scope.row)">编辑</el-button>
                <el-button size="mini" type="danger" @click="deleteOperation(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 列表视图 -->
        <div v-if="viewMode === 'list'" class="list-container">
          <el-table :data="operations" style="width: 100%;" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" />
            <el-table-column prop="sequence" label="序号" width="80" />
            <el-table-column prop="code" label="工序编码" width="120" />
            <el-table-column prop="name" label="工序名称" width="180" />
            <el-table-column prop="description" label="工序描述" />
            <el-table-column prop="standardTime" label="标准工时(min)" width="120">
              <template slot-scope="scope">
                <el-input-number 
                  v-model="scope.row.standardTime" 
                  :min="0.1" 
                  :step="0.1" 
                  size="small"
                  @change="updateOperation(scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="predecessors" label="前置工序" width="150">
              <template slot-scope="scope">
                <el-tag 
                  v-for="predecessor in scope.row.predecessors" 
                  :key="predecessor" 
                  size="small" 
                  type="info"
                >
                  {{ getOperationCodeById(predecessor) }}
                </el-tag>
                <el-button 
                  v-if="scope.row.predecessors.length < operations.length - 1" 
                  size="mini" 
                  icon="el-icon-plus"
                  @click="addPredecessor(scope.row)"
                ></el-button>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template slot-scope="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template slot-scope="scope">
                <el-button size="mini" @click="editOperation(scope.row)">编辑</el-button>
                <el-button size="mini" type="danger" @click="deleteOperation(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>

    <!-- 工序属性编辑抽屉 -->
    <el-drawer
      :visible.sync="operationDrawerVisible"
      title="工序属性编辑"
      size="500px"
      direction="rtl"
    >
      <el-form :model="currentOperation" :rules="operationRules" ref="operationForm" label-width="100px">
        <el-form-item label="工序编码" prop="code">
          <el-input v-model="currentOperation.code" placeholder="请输入工序编码" />
        </el-form-item>
        <el-form-item label="工序名称" prop="name">
          <el-input v-model="currentOperation.name" placeholder="请输入工序名称" />
        </el-form-item>
        <el-form-item label="工序描述">
          <el-input type="textarea" v-model="currentOperation.description" placeholder="请输入工序描述" :rows="3" />
        </el-form-item>
        <el-form-item label="标准工时(min)" prop="standardTime">
          <el-input-number v-model="currentOperation.standardTime" :min="0.1" :step="0.1" />
        </el-form-item>
        <el-form-item label="前置工序">
          <el-select
            v-model="currentOperation.predecessors"
            multiple
            placeholder="请选择前置工序"
            style="width: 100%;"
          >
            <el-option
              v-for="op in getAvailablePredecessors(currentOperation.id)"
              :key="op.id"
              :label="op.name"
              :value="op.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="工序状态" prop="status">
          <el-select v-model="currentOperation.status" placeholder="请选择工序状态">
            <el-option label="待执行" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源需求">
          <el-table :data="currentOperation.resources" style="width: 100%;">
            <el-table-column prop="type" label="资源类型" width="100">
              <template slot-scope="scope">
                <el-select v-model="scope.row.type" placeholder="资源类型">
                  <el-option label="人员" value="personnel" />
                  <el-option label="设备" value="equipment" />
                  <el-option label="工具" value="tool" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="资源名称">
              <template slot-scope="scope">
                <el-input v-model="scope.row.name" placeholder="资源名称" />
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量">
              <template slot-scope="scope">
                <el-input-number v-model="scope.row.quantity" :min="1" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template slot-scope="scope">
                <el-button size="mini" type="danger" @click="removeResource(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="text" @click="addResource">添加资源</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveOperation">保存</el-button>
          <el-button @click="cancelEdit">取消</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>

    <!-- 添加前置工序对话框 -->
    <el-dialog
      :visible.sync="predecessorDialogVisible"
      title="添加前置工序"
      width="500px"
    >
      <el-form :model="predecessorForm" ref="predecessorForm">
        <el-form-item label="可选工序">
          <el-select
            v-model="predecessorForm.selectedPredecessors"
            multiple
            placeholder="请选择前置工序"
            style="width: 100%;"
          >
            <el-option
              v-for="op in getAvailablePredecessors(editingOperationId)"
              :key="op.id"
              :label="op.name"
              :value="op.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="predecessorDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddPredecessor">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import { Message, Notification } from 'element-ui'

export default {
  name: 'OperationSequence',
  data() {
    return {
      // 基本信息
      sequenceInfo: {
        id: '',
        code: '',
        routeId: '',
        version: '1.0.0',
        status: 'draft',
        createdTime: new Date(),
        updatedTime: new Date()
      },
      
      // 视图模式
      viewMode: 'flowchart',
      
      // 工序数据
      operations: [],
      
      // 连接关系
      connections: [],
      
      // 选中的工序ID
      selectedOperationId: null,
      
      // 选中的工序列表
      selectedOperations: [],
      
      // 编辑相关
      operationDrawerVisible: false,
      currentOperation: {
        id: '',
        code: '',
        name: '',
        description: '',
        standardTime: 0,
        predecessors: [],
        status: 'pending',
        resources: [],
        sequence: 0,
        startTime: 0,
        x: 0,
        y: 0
      },
      
      // 前置工序对话框
      predecessorDialogVisible: false,
      predecessorForm: {
        selectedPredecessors: []
      },
      editingOperationId: null,
      
      // 拖拽相关
      isDragging: false,
      dragOperation: null,
      dragOffset: { x: 0, y: 0 },
      
      // 连接线相关
      isConnecting: false,
      connectStart: null,
      tempConnection: null,
      
      // 缩放相关
      zoom: 1,
      
      // 选项数据
      routeOptions: [],
      
      // 表单验证规则
      operationRules: {
        code: [{ required: true, message: '请输入工序编码', trigger: 'blur' }],
        name: [{ required: true, message: '请输入工序名称', trigger: 'blur' }],
        standardTime: [{ required: true, message: '请输入标准工时', trigger: 'blur' }]
      }
    }
  },
  
  mounted() {
    this.initData()
    this.initEventListeners()
  },
  
  methods: {
    // 初始化数据
    async initData() {
      // 模拟获取路线选项
      this.routeOptions = this.getMockRouteOptions()
      
      // 模拟初始工序数据
      this.operations = this.getMockOperations()
      
      // 生成连接关系
      this.generateConnections()
    },
    
    // 初始化事件监听器
    initEventListeners() {
      document.addEventListener('mousemove', this.handleMouseMove)
      document.addEventListener('mouseup', this.handleMouseUp)
      window.addEventListener('resize', this.handleResize)
    },
    
    // 创建新的顺序
    createNewSequence() {
      this.sequenceInfo = {
        id: '',
        code: this.generateSequenceCode(),
        routeId: '',
        version: '1.0.0',
        status: 'draft',
        createdTime: new Date(),
        updatedTime: new Date()
      }
      this.operations = []
      this.connections = []
      this.selectedOperationId = null
      this.selectedOperations = []
      Message.success('已创建新的工序顺序')
    },
    
    // 生成顺序编号
    generateSequenceCode() {
      const timestamp = Date.now().toString().slice(-6)
      return `SEQ-${timestamp}`
    },
    
    // 保存顺序
    async saveSequence() {
      if (!this.sequenceInfo.code) {
        Message.error('请先创建顺序')
        return
      }
      
      try {
        // 模拟保存操作
        setTimeout(() => {
          this.sequenceInfo.updatedTime = new Date()
          Message.success('保存成功')
        }, 500)
      } catch (error) {
        Message.error('保存失败: ' + error.message)
      }
    },
    
    // 导入顺序
    importSequence() {
      Message.info('导入功能待实现')
    },
    
    // 导出顺序
    exportSequence() {
      if (!this.operations.length) {
        Message.error('没有数据可导出')
        return
      }
      
      // 模拟导出操作
      Message.success('导出成功')
    },
    
    // 路线变更处理
    onRouteChange(routeId) {
      const selectedRoute = this.routeOptions.find(r => r.id === routeId)
      if (selectedRoute && selectedRoute.operations) {
        // 清空现有工序
        this.operations = []
        
        // 添加路线关联的工序
        selectedRoute.operations.forEach((op, index) => {
          this.operations.push({
            id: op.id || `op-${Date.now()}-${index}`,
            code: op.code,
            name: op.name,
            description: op.description || '',
            standardTime: op.standardTime || 60,
            predecessors: op.predecessors || [],
            status: 'pending',
            resources: [],
            sequence: index + 1,
            startTime: 0,
            x: 100 + index * 200,
            y: 100 + (index % 2) * 150
          })
        })
        
        // 生成连接关系
        this.generateConnections()
        Message.success('已加载路线关联的工序')
      }
    },
    
    // 添加工序
    addOperation() {
      const newId = `op-${Date.now()}`
      const newOperation = {
        id: newId,
        code: `OP-${this.operations.length + 1}`,
        name: `新工序 ${this.operations.length + 1}`,
        description: '',
        standardTime: 60,
        predecessors: [],
        status: 'pending',
        resources: [],
        sequence: this.operations.length + 1,
        startTime: 0,
        x: 100 + this.operations.length * 150,
        y: 100
      }
      
      this.operations.push(newOperation)
      this.editOperation(newOperation)
    },
    
    // 选择工序
    selectOperation(operationId) {
      this.selectedOperationId = operationId
      this.selectedOperations = [this.operations.find(op => op.id === operationId)]
    },
    
    // 处理选择变更
    handleSelectionChange(selection) {
      this.selectedOperations = selection
      if (selection.length === 1) {
        this.selectedOperationId = selection[0].id
      } else {
        this.selectedOperationId = null
      }
    },
    
    // 编辑工序
    editOperation(operation) {
      this.currentOperation = JSON.parse(JSON.stringify(operation))
      this.operationDrawerVisible = true
    },
    
    // 保存工序
    saveOperation() {
      this.$refs.operationForm.validate((valid) => {
        if (valid) {
          const index = this.operations.findIndex(op => op.id === this.currentOperation.id)
          if (index !== -1) {
            // 更新现有工序
            this.operations[index] = JSON.parse(JSON.stringify(this.currentOperation))
          } else {
            // 添加新工序
            this.operations.push(JSON.parse(JSON.stringify(this.currentOperation)))
          }
          
          // 重新生成连接关系
          this.generateConnections()
          
          // 关闭抽屉
          this.operationDrawerVisible = false
          Message.success('保存成功')
        }
      })
    },
    
    // 取消编辑
    cancelEdit() {
      this.operationDrawerVisible = false
      this.$refs.operationForm.resetFields()
    },
    
    // 更新工序
    updateOperation(operation) {
      // 直接更新，因为是在表格中直接编辑
      this.generateConnections()
    },
    
    // 删除工序
    deleteOperation(operationId) {
      this.$confirm('确定要删除该工序吗？相关的连接关系也会被删除。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 从工序列表中删除
        this.operations = this.operations.filter(op => op.id !== operationId)
        
        // 删除相关连接
        this.connections = this.connections.filter(conn => 
          conn.from !== operationId && conn.to !== operationId
        )
        
        // 更新其他工序的前置工序引用
        this.operations.forEach(op => {
          op.predecessors = op.predecessors.filter(p => p !== operationId)
        })
        
        // 清除选中状态
        if (this.selectedOperationId === operationId) {
          this.selectedOperationId = null
        }
        
        Message.success('删除成功')
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 删除选中的工序
    deleteSelectedOperation() {
      if (!this.selectedOperations.length) {
        Message.warning('请先选择要删除的工序')
        return
      }
      
      this.$confirm(`确定要删除选中的${this.selectedOperations.length}个工序吗？相关的连接关系也会被删除。`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const idsToDelete = this.selectedOperations.map(op => op.id)
        
        // 从工序列表中删除
        this.operations = this.operations.filter(op => !idsToDelete.includes(op.id))
        
        // 删除相关连接
        this.connections = this.connections.filter(conn => 
          !idsToDelete.includes(conn.from) && !idsToDelete.includes(conn.to)
        )
        
        // 更新其他工序的前置工序引用
        this.operations.forEach(op => {
          op.predecessors = op.predecessors.filter(p => !idsToDelete.includes(p))
        })
        
        // 清除选中状态
        this.selectedOperationId = null
        this.selectedOperations = []
        
        Message.success('删除成功')
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 开始拖拽工序
    startDrag(event, operation) {
      this.isDragging = true
      this.dragOperation = operation
      const rect = event.currentTarget.getBoundingClientRect()
      this.dragOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
      event.preventDefault()
    },
    
    // 处理鼠标移动
    handleMouseMove(event) {
      if (this.isDragging && this.dragOperation) {
        const container = this.$refs.flowchartContainer
        const rect = container.getBoundingClientRect()
        
        this.dragOperation.x = (event.clientX - rect.left - this.dragOffset.x) / this.zoom
        this.dragOperation.y = (event.clientY - rect.top - this.dragOffset.y) / this.zoom
      }
    },
    
    // 处理鼠标释放
    handleMouseUp() {
      this.isDragging = false
      this.dragOperation = null
    },
    
    // 开始创建连接
    startConnect(event, operationId, portType) {
      this.isConnecting = true
      this.connectStart = { operationId, portType }
      event.stopPropagation()
    },
    
    // 获取工序节点样式
    getOperationNodeStyle(operation) {
      return {
        left: `${operation.x}px`,
        top: `${operation.y}px`,
        transform: `scale(${this.zoom})`,
        transformOrigin: 'top left'
      }
    },
    
    // 生成连接关系
    generateConnections() {
      this.connections = []
      
      this.operations.forEach(operation => {
        operation.predecessors.forEach(predecessorId => {
          this.connections.push({
            from: predecessorId,
            to: operation.id,
            selected: false
          })
        })
      })
    },
    
    // 获取连接路径
    getConnectionPath(connection) {
      const fromOp = this.operations.find(op => op.id === connection.from)
      const toOp = this.operations.find(op => op.id === connection.to)
      
      if (!fromOp || !toOp) return ''
      
      // 计算起始和结束点
      const fromX = fromOp.x + 150 // 节点宽度的一半
      const fromY = fromOp.y + 80 // 节点高度的一半
      const toX = toOp.x
      const toY = toOp.y + 80
      
      // 贝塞尔曲线控制点
      const cpX = (fromX + toX) / 2
      const cpY = (fromY + toY) / 2 - 30
      
      return `M ${fromX} ${fromY} Q ${cpX} ${cpY}, ${toX} ${toY}`
    },
    
    // 获取箭头点
    getArrowPoints(connection) {
      const toOp = this.operations.find(op => op.id === connection.to)
      if (!toOp) return ''
      
      const x = toOp.x
      const y = toOp.y + 80
      
      // 箭头多边形点
      return `${x},${y} ${x - 10},${y - 5} ${x - 10},${y + 5}`
    },
    
    // 选择连接
    selectConnection(connection) {
      this.connections.forEach(conn => {
        conn.selected = false
      })
      connection.selected = true
    },
    
    // 获取可用的前置工序
    getAvailablePredecessors(operationId) {
      // 不包括自己和会导致循环依赖的工序
      const currentOp = this.operations.find(op => op.id === operationId)
      const dependentOps = this.getDependentOperations(operationId)
      
      return this.operations.filter(op => 
        op.id !== operationId && !dependentOps.includes(op.id)
      )
    },
    
    // 获取依赖于指定工序的所有工序
    getDependentOperations(operationId) {
      const dependentOps = []
      
      function findDependents(id) {
        const dependents = []
        
        // 查找直接依赖
        dependents.push(...operations.filter(op => 
          op.predecessors.includes(id)
        ).map(op => op.id))
        
        // 递归查找间接依赖
        dependents.forEach(depId => {
          const indirectDependents = findDependents(depId)
          indirectDependents.forEach(indirectId => {
            if (!dependents.includes(indirectId)) {
              dependents.push(indirectId)
            }
          })
        })
        
        return dependents
      }
      
      const operations = [...this.operations] // 创建副本避免闭包问题
      dependentOps.push(...findDependents(operationId))
      
      return dependentOps
    },
    
    // 添加前置工序
    addPredecessor(operation) {
      this.editingOperationId = operation.id
      this.predecessorForm.selectedPredecessors = [...operation.predecessors]
      this.predecessorDialogVisible = true
    },
    
    // 确认添加前置工序
    confirmAddPredecessor() {
      const operation = this.operations.find(op => op.id === this.editingOperationId)
      if (operation) {
        operation.predecessors = [...this.predecessorForm.selectedPredecessors]
        this.generateConnections()
        this.predecessorDialogVisible = false
        Message.success('前置工序设置成功')
      }
    },
    
    // 获取前置工序名称
    getPredecessorNames(operationId) {
      const operation = this.operations.find(op => op.id === operationId)
      if (!operation) return []
      
      return operation.predecessors.map(id => {
        const pred = this.operations.find(op => op.id === id)
        return pred ? pred.name : ''
      }).filter(name => name)
    },
    
    // 获取工序编码
    getOperationCodeById(operationId) {
      const operation = this.operations.find(op => op.id === operationId)
      return operation ? operation.code : ''
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        pending: '待执行',
        in_progress: '进行中',
        completed: '已完成',
        draft: '草稿',
        published: '已发布',
        disabled: '已停用'
      }
      return statusMap[status] || status
    },
    
    // 获取状态类型
    getStatusType(status) {
      const typeMap = {
        pending: 'primary',
        in_progress: 'warning',
        completed: 'success',
        draft: 'info',
        published: 'success',
        disabled: 'danger'
      }
      return typeMap[status] || 'info'
    },
    
    // 获取工序颜色
    getOperationColor(status) {
      const colorMap = {
        pending: '#409EFF',
        in_progress: '#E6A23C',
        completed: '#67C23A',
        draft: '#909399',
        published: '#67C23A',
        disabled: '#F56C6C'
      }
      return colorMap[status] || '#909399'
    },
    
    // 添加资源
    addResource() {
      this.currentOperation.resources.push({
        id: `resource-${Date.now()}`,
        type: 'personnel',
        name: '',
        quantity: 1
      })
    },
    
    // 移除资源
    removeResource(index) {
      this.currentOperation.resources.splice(index, 1)
    },
    
    // 排序工序
    sortOperations() {
      // 基于前置工序关系进行拓扑排序
      const sortedOperations = []
      const visited = new Set()
      const tempVisited = new Set()
      let hasCycle = false
      
      function dfs(operationId) {
        if (tempVisited.has(operationId)) {
          hasCycle = true
          return
        }
        
        if (visited.has(operationId) || hasCycle) {
          return
        }
        
        tempVisited.add(operationId)
        
        const operation = operations.find(op => op.id === operationId)
        const predecessors = operation.predecessors || []
        
        predecessors.forEach(predId => dfs(predId))
        
        tempVisited.delete(operationId)
        visited.add(operationId)
        sortedOperations.push(operation)
      }
      
      const operations = [...this.operations] // 创建副本
      
      // 从没有前置工序的节点开始
      operations.forEach(operation => {
        if (!operation.predecessors || operation.predecessors.length === 0) {
          dfs(operation.id)
        }
      })
      
      // 处理剩余的节点
      operations.forEach(operation => {
        if (!visited.has(operation.id)) {
          dfs(operation.id)
        }
      })
      
      if (hasCycle) {
        Message.warning('工序依赖关系中存在循环依赖，无法排序')
        return
      }
      
      // 更新顺序和位置
      sortedOperations.forEach((op, index) => {
        const originalOp = this.operations.find(o => o.id === op.id)
        if (originalOp) {
          originalOp.sequence = index + 1
          // 更新X坐标使工序按顺序排列
          originalOp.x = 100 + index * 200
        }
      })
      
      Message.success('工序排序完成')
    },
    
    // 重置布局
    resetLayout() {
      this.zoom = 1
      
      // 基于顺序重新排列节点
      this.operations.forEach((operation, index) => {
        operation.x = 100 + (index % 4) * 200
        operation.y = 100 + Math.floor(index / 4) * 150
      })
    },
    
    // 放大
    zoomIn() {
      this.zoom = Math.min(this.zoom + 0.1, 2)
    },
    
    // 缩小
    zoomOut() {
      this.zoom = Math.max(this.zoom - 0.1, 0.5)
    },
    
    // 适应屏幕
    fitToScreen() {
      if (!this.operations.length) return
      
      // 计算所有节点的边界
      let minX = Infinity, minY = Infinity
      let maxX = -Infinity, maxY = -Infinity
      
      this.operations.forEach(operation => {
        minX = Math.min(minX, operation.x)
        minY = Math.min(minY, operation.y)
        maxX = Math.max(maxX, operation.x + 150) // 假设节点宽度为150
        maxY = Math.max(maxY, operation.y + 160) // 假设节点高度为160
      })
      
      // 获取容器尺寸
      const container = this.$refs.flowchartContainer
      const containerWidth = container.clientWidth - 100 // 留出边距
      const containerHeight = container.clientHeight - 100
      
      // 计算缩放比例
      const widthRatio = containerWidth / (maxX - minX || 1)
      const heightRatio = containerHeight / (maxY - minY || 1)
      this.zoom = Math.min(widthRatio, heightRatio, 1.5)
      
      // 居中所有节点
      const centerX = (containerWidth - (maxX - minX) * this.zoom) / 2 / this.zoom
      const centerY = (containerHeight - (maxY - minY) * this.zoom) / 2 / this.zoom
      
      const offsetX = centerX - minX
      const offsetY = centerY - minY
      
      this.operations.forEach(operation => {
        operation.x += offsetX
        operation.y += offsetY
      })
    },
    
    // 处理窗口大小变化
    handleResize() {
      if (this.viewMode === 'flowchart') {
        this.$nextTick(() => {
          this.fitToScreen()
        })
      }
    },
    
    // 模拟数据 - 路线选项
    getMockRouteOptions() {
      return [
        {
          id: 'route-001',
          name: '产品A加工路线',
          operations: [
            { code: 'OP-001', name: '备料', standardTime: 30 },
            { code: 'OP-002', name: '粗加工', standardTime: 60 },
            { code: 'OP-003', name: '热处理', standardTime: 120 },
            { code: 'OP-004', name: '精加工', standardTime: 90 },
            { code: 'OP-005', name: '检验', standardTime: 45 }
          ]
        },
        {
          id: 'route-002',
          name: '产品B加工路线',
          operations: [
            { code: 'OP-101', name: '备料', standardTime: 40 },
            { code: 'OP-102', name: '冲压', standardTime: 50 },
            { code: 'OP-103', name: '焊接', standardTime: 80 },
            { code: 'OP-104', name: '表面处理', standardTime: 100 },
            { code: 'OP-105', name: '组装', standardTime: 70 }
          ]
        }
      ]
    },
    
    // 模拟数据 - 工序列表
    getMockOperations() {
      return [
        {
          id: 'op-001',
          code: 'OP-001',
          name: '备料',
          description: '准备加工所需的原材料',
          standardTime: 30,
          predecessors: [],
          status: 'pending',
          resources: [
            { id: 'res-001', type: 'personnel', name: '物料员', quantity: 1 },
            { id: 'res-002', type: 'equipment', name: '切割机', quantity: 1 }
          ],
          sequence: 1,
          startTime: 0,
          x: 100,
          y: 100
        },
        {
          id: 'op-002',
          code: 'OP-002',
          name: '粗加工',
          description: '对原材料进行初步加工',
          standardTime: 60,
          predecessors: ['op-001'],
          status: 'pending',
          resources: [
            { id: 'res-003', type: 'personnel', name: '操作员', quantity: 1 },
            { id: 'res-004', type: 'equipment', name: '车床', quantity: 1 }
          ],
          sequence: 2,
          startTime: 30,
          x: 300,
          y: 100
        },
        {
          id: 'op-003',
          code: 'OP-003',
          name: '热处理',
          description: '对半成品进行热处理',
          standardTime: 120,
          predecessors: ['op-002'],
          status: 'pending',
          resources: [
            { id: 'res-005', type: 'personnel', name: '热处理工', quantity: 1 },
            { id: 'res-006', type: 'equipment', name: '热处理炉', quantity: 1 }
          ],
          sequence: 3,
          startTime: 90,
          x: 500,
          y: 100
        },
        {
          id: 'op-004',
          code: 'OP-004',
          name: '精加工',
          description: '对热处理后的零件进行精密加工',
          standardTime: 90,
          predecessors: ['op-003'],
          status: 'pending',
          resources: [
            { id: 'res-007', type: 'personnel', name: '高级操作员', quantity: 1 },
            { id: 'res-008', type: 'equipment', name: '加工中心', quantity: 1 }
          ],
          sequence: 4,
          startTime: 210,
          x: 700,
          y: 100
        },
        {
          id: 'op-005',
          code: 'OP-005',
          name: '检验',
          description: '对成品进行质量检验',
          standardTime: 45,
          predecessors: ['op-004'],
          status: 'pending',
          resources: [
            { id: 'res-009', type: 'personnel', name: '质检员', quantity: 1 },
            { id: 'res-010', type: 'equipment', name: '检测仪器', quantity: 1 }
          ],
          sequence: 5,
          startTime: 300,
          x: 900,
          y: 100
        }
      ]
    }
  },
  
  beforeDestroy() {
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>

<style scoped>
.operation-sequence-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.basic-info-section,
.toolbar-section {
  margin-bottom: 20px;
}

.info-form {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.toolbar-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-actions .el-button-group {
  margin-right: 10px;
}

.sequence-editor-section {
  margin-bottom: 20px;
}

/* 流程图样式 */
.flowchart-container {
  position: relative;
  width: 100%;
  height: 600px;
  background-color: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: auto;
  cursor: move;
}

.connection-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: all;
  z-index: 1;
}

.operation-node {
  position: absolute;
  width: 150px;
  padding: 15px;
  background-color: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s;
}

.operation-node:hover {
  border-color: #c0c4cc;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.operation-node.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.node-id {
  font-weight: bold;
  color: #409eff;
}

.node-status {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
}

.node-status.status-pending {
  background-color: #ecf5ff;
  color: #409eff;
}

.node-status.status-in_progress {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.node-status.status-completed {
  background-color: #f0f9eb;
  color: #67c23a;
}

.node-title {
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-info {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}

.node-ports {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.port.in {
  left: -10px;
}

.port.out {
  right: -10px;
}

.port {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #909399;
  cursor: crosshair;
  transition: all 0.2s;
}

.port:hover {
  background-color: #409eff;
  transform: scale(1.5);
}

.connection-path {
  cursor: pointer;
  transition: all 0.2s;
}

.connection-path:hover {
  stroke: #409eff !important;
  stroke-width: 2px !important;
}

/* 甘特图样式 */
.gantt-container {
  overflow-x: auto;
}

.gantt-bar-container {
  position: relative;
  width: 100%;
  height: 30px;
  background-color: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

.gantt-bar {
  position: absolute;
  height: 24px;
  margin-top: 3px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  box-sizing: border-box;
  transition: all 0.3s;
}

.gantt-bar:hover {
  opacity: 0.8;
  transform: scaleY(1.1);
}

.gantt-bar span {
  color: white;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 列表样式 */
.list-container {
  overflow-x: auto;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .toolbar-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar-actions .el-button-group {
    margin-right: 0;
    margin-bottom: 10px;
  }
}

@media (max-width: 768px) {
  .operation-sequence-container {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .header-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .flowchart-container {
    height: 400px;
  }
  
  .operation-node {
    width: 120px;
    padding: 10px;
    font-size: 12px;
  }
  
  .node-info {
    font-size: 10px;
  }
}
</style>