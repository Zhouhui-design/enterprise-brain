cat > oa/workflow/WorkflowDesigner.vue <<'EOF'
<template>
  <div class="workflow-designer">
    <div class="designer-header">
      <h2>工作流设计器</h2>
      <div class="actions">
        <el-button @click="handleSave">保存</el-button>
        <el-button type="primary" @click="handleDeploy">部署</el-button>
      </div>
    </div>

    <div class="designer-container">
      <div class="toolbox">
        <div class="node-type" draggable="true" @dragstart="handleDragStart('start')">
          开始节点
        </div>
        <div class="node-type" draggable="true" @dragstart="handleDragStart('task')">
          任务节点
        </div>
        <div class="node-type" draggable="true" @dragstart="handleDragStart('approval')">
          审批节点
        </div>
        <div class="node-type" draggable="true" @dragstart="handleDragStart('end')">
          结束节点
        </div>
      </div>

      <div class="canvas" @drop="handleDrop" @dragover="handleDragOver">
        <div 
          v-for="node in nodes" 
          :key="node.id"
          class="workflow-node"
          :class="`node-${node.type}`"
          :style="{ left: node.x + 'px', top: node.y + 'px' }"
        >
          {{ node.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const nodes = ref([])
let dragNodeType = ''

const handleDragStart = (type) => {
  dragNodeType = type
}

const handleDragOver = (e) => {
  e.preventDefault()
}

const handleDrop = (e) => {
  e.preventDefault()
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const newNode = {
    id: Date.now(),
    type: dragNodeType,
    name: getNodeName(dragNodeType),
    x: x - 50,
    y: y - 25
  }

  nodes.value.push(newNode)
}

const getNodeName = (type) => {
  const names = {
    start: '开始',
    task: '任务',
    approval: '审批',
    end: '结束'
  }
  return names[type] || '节点'
}

const handleSave = () => {
  console.log('保存工作流:', nodes.value)
}

const handleDeploy = () => {
  console.log('部署工作流')
}
</script>

<style scoped>
.workflow-designer {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.designer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #eee;
}

.designer-container {
  display: flex;
  flex: 1;
}

.toolbox {
  width: 200px;
  padding: 20px;
  border-right: 1px solid #eee;
}

.node-type {
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: move;
  text-align: center;
}

.canvas {
  flex: 1;
  position: relative;
  background: #f8f9fa;
}

.workflow-node {
  position: absolute;
  width: 100px;
  height: 50px;
  border: 2px solid #409eff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  cursor: pointer;
}

.node-start { border-color: #67c23a; }
.node-task { border-color: #409eff; }
.node-approval { border-color: #e6a23c; }
.node-end { border-color: #f56c6c; }
</style>
EOF