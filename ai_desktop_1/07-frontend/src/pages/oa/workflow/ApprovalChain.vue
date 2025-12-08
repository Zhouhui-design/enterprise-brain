<template>
  <div class="approval-chain">
    <!-- 工业风格头部区域 -->
    <header class="chain-header">
      <div class="header-left">
        <div class="title-section">
          <h1 class="page-title">审批链配置</h1>
          <div class="breadcrumb">
            <span class="breadcrumb-item">OA系统</span>
            <i class="fas fa-chevron-right breadcrumb-separator"></i>
            <span class="breadcrumb-item">工作流</span>
            <i class="fas fa-chevron-right breadcrumb-separator"></i>
            <span class="breadcrumb-item active">审批链配置</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <button class="action-btn secondary" @click="handleTemplate">
          <i class="fas fa-file-alt"></i>
          <span>使用模板</span>
        </button>
        <button class="action-btn primary" @click="handleSaveChain">
          <i class="fas fa-save"></i>
          <span>保存配置</span>
        </button>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="chain-main">
      <!-- 审批链编辑器 -->
      <section class="chain-editor-section">
        <div class="editor-container">
          <div class="editor-header">
            <h2 class="editor-title">审批链设计器</h2>
            <div class="editor-actions">
              <button class="editor-btn" @click="addNode">
                <i class="fas fa-plus"></i>
                <span>添加节点</span>
              </button>
              <button class="editor-btn secondary" @click="clearChain">
                <i class="fas fa-trash"></i>
                <span>清空</span>
              </button>
            </div>
          </div>

          <!-- 审批链名称配置 -->
          <div class="chain-config">
            <div class="config-group">
              <label class="config-label">
                <i class="fas fa-tag"></i>
                审批链名称
              </label>
              <input 
                v-model="chainConfig.name" 
                type="text" 
                class="config-input"
                placeholder="请输入审批链名称"
                required
              />
            </div>
            <div class="config-group">
              <label class="config-label">
                <i class="fas fa-align-left"></i>
                审批链描述
              </label>
              <textarea 
                v-model="chainConfig.description" 
                class="config-textarea"
                placeholder="请输入审批链描述..."
                rows="3"
              ></textarea>
            </div>
            <div class="config-group">
              <label class="config-label">
                <i class="fas fa-cogs"></i>
                审批模式
              </label>
              <select v-model="chainConfig.mode" class="config-select">
                <option value="sequential">串行审批</option>
                <option value="parallel">并行审批</option>
                <option value="mixed">混合审批</option>
              </select>
            </div>
          </div>

          <!-- 审批链节点 -->
          <div class="chain-nodes">
            <div class="nodes-header">
              <h3 class="nodes-title">审批节点</h3>
              <div class="nodes-info">
                <span>共 {{ approvalChain.length }} 个节点</span>
              </div>
            </div>

            <div v-if="approvalChain.length === 0" class="empty-chain">
              <div class="empty-icon">
                <i class="fas fa-sitemap"></i>
              </div>
              <h4>暂无审批节点</h4>
              <p>点击"添加节点"开始配置审批链</p>
              <button class="action-btn primary" @click="addNode">
                <i class="fas fa-plus"></i>
                <span>添加第一个节点</span>
              </button>
            </div>

            <div v-else class="chain-list">
              <draggable 
                v-model="approvalChain" 
                group="nodes"
                item-key="id"
                @end="handleNodeReorder"
                class="draggable-container"
              >
                <template #item="{ element: node, index }">
                  <div class="chain-node" :class="`node-${node.type}`">
                    <div class="node-drag-handle">
                      <i class="fas fa-grip-vertical"></i>
                    </div>
                    
                    <div class="node-order">
                      <span class="order-number">{{ index + 1 }}</span>
                    </div>

                    <div class="node-content">
                      <div class="node-header">
                        <div class="node-info">
                          <h4 class="node-name">{{ node.name }}</h4>
                          <div class="node-badges">
                            <span class="type-badge" :class="`type-${node.type}`">
                              {{ getNodeTypeLabel(node.type) }}
                            </span>
                            <span class="mode-badge" :class="`mode-${node.approvalMode}`">
                              {{ getApprovalModeLabel(node.approvalMode) }}
                            </span>
                          </div>
                        </div>
                        <div class="node-actions">
                          <button class="action-btn small info" @click="editNode(node, index)">
                            <i class="fas fa-edit"></i>
                          </button>
                          <button class="action-btn small danger" @click="deleteNode(index)">
                            <i class="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>

                      <div class="node-details">
                        <div class="detail-row">
                          <span class="detail-label">
                            <i class="fas fa-users"></i>
                            审批人
                          </span>
                          <div class="approvers-list">
                            <span v-for="user in node.users" :key="user.id" class="approver-tag">
                              {{ user.name }}
                              <span class="role-info">({{ user.role }})</span>
                            </span>
                          </div>
                        </div>

                        <div class="detail-row" v-if="node.timeout">
                          <span class="detail-label">
                            <i class="fas fa-clock"></i>
                            超时时间
                          </span>
                          <span class="detail-value">{{ node.timeout }}小时</span>
                        </div>

                        <div class="detail-row" v-if="node.condition">
                          <span class="detail-label">
                            <i class="fas fa-code-branch"></i>
                            触发条件
                          </span>
                          <span class="detail-value">{{ node.condition }}</span>
                        </div>

                        <div class="detail-row" v-if="node.description">
                          <span class="detail-label">
                            <i class="fas fa-comment-alt"></i>
                            节点说明
                          </span>
                          <span class="detail-value">{{ node.description }}</span>
                        </div>
                      </div>
                    </div>

                    <div v-if="index < approvalChain.length - 1" class="node-connector">
                      <i class="fas fa-arrow-down"></i>
                    </div>
                  </div>
                </template>
              </draggable>
            </div>
          </div>
        </div>
      </section>

      <!-- 预览区域 -->
      <section class="preview-section">
        <div class="preview-container">
          <div class="preview-header">
            <h3 class="preview-title">审批链预览</h3>
            <button class="preview-btn" @click="refreshPreview">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
          
          <div class="preview-content">
            <div class="preview-chain">
              <div class="chain-overview">
                <div class="overview-item">
                  <span class="overview-label">审批链名称:</span>
                  <span class="overview-value">{{ chainConfig.name || '未命名' }}</span>
                </div>
                <div class="overview-item">
                  <span class="overview-label">审批模式:</span>
                  <span class="overview-value">{{ getChainModeLabel(chainConfig.mode) }}</span>
                </div>
                <div class="overview-item">
                  <span class="overview-label">节点数量:</span>
                  <span class="overview-value">{{ approvalChain.length }} 个</span>
                </div>
              </div>

              <div class="preview-timeline">
                <div 
                  v-for="(node, index) in approvalChain" 
                  :key="index"
                  class="timeline-node"
                  :class="`node-${node.type}`"
                >
                  <div class="timeline-marker">
                    <i :class="getNodeIcon(node.type)"></i>
                  </div>
                  <div class="timeline-content">
                    <div class="timeline-title">{{ node.name }}</div>
                    <div class="timeline-subtitle">{{ getNodeTypeLabel(node.type) }}</div>
                    <div class="timeline-users">
                      <i class="fas fa-users"></i>
                      <span>{{ node.users.map(u => u.name).join('、') }}</span>
                    </div>
                    <div class="timeline-mode" v-if="node.approvalMode !== 'any'">
                      <i class="fas fa-cogs"></i>
                      <span>{{ getApprovalModeLabel(node.approvalMode) }}</span>
                    </div>
                  </div>
                  <div v-if="index < approvalChain.length - 1" class="timeline-connector">
                    <i class="fas fa-chevron-down"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 节点编辑弹窗 -->
    <div v-if="showNodeModal" class="modal-overlay" @click="closeNodeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ editingNodeIndex === -1 ? '添加节点' : '编辑节点' }}</h3>
          <button class="modal-close" @click="closeNodeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveNode" class="node-form">
            <!-- 节点基本信息 -->
            <div class="form-section">
              <h4 class="section-title">基本信息</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">节点名称 *</label>
                  <input 
                    v-model="nodeForm.name" 
                    type="text" 
                    class="form-input"
                    placeholder="请输入节点名称"
                    required
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">节点类型 *</label>
                  <select v-model="nodeForm.type" class="form-select" required>
                    <option value="">请选择节点类型</option>
                    <option value="approval">审批节点</option>
                    <option value="review">审核节点</option>
                    <option value="notification">通知节点</option>
                    <option value="condition">条件节点</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 审批模式 -->
            <div class="form-section">
              <h4 class="section-title">审批模式</h4>
              <div class="form-group">
                <label class="form-label">审批方式 *</label>
                <select v-model="nodeForm.approvalMode" class="form-select" required>
                  <option value="any">任意一人审批</option>
                  <option value="all">所有人审批</option>
                  <option value="majority">多数人审批</option>
                  <option value="hierarchy">按层级审批</option>
                </select>
              </div>
            </div>

            <!-- 审批人配置 -->
            <div class="form-section">
              <h4 class="section-title">审批人配置</h4>
              <div class="approvers-config">
                <div v-for="(user, index) in nodeForm.users" :key="index" class="approver-item">
                  <div class="approver-fields">
                    <select v-model="user.type" class="form-select small">
                      <option value="user">指定用户</option>
                      <option value="role">指定角色</option>
                      <option value="department">指定部门</option>
                    </select>
                    <input 
                      v-model="user.value" 
                      type="text" 
                      class="form-input small"
                      :placeholder="getUserPlaceholder(user.type)"
                    />
                    <input 
                      v-model="user.role" 
                      type="text" 
                      class="form-input small"
                      placeholder="角色描述"
                    />
                  </div>
                  <button type="button" class="remove-btn" @click="removeApprover(index)">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <button type="button" class="add-btn" @click="addApprover">
                  <i class="fas fa-plus"></i>
                  添加审批人
                </button>
              </div>
            </div>

            <!-- 高级配置 -->
            <div class="form-section">
              <h4 class="section-title">高级配置</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">超时时间（小时）</label>
                  <input 
                    v-model="nodeForm.timeout" 
                    type="number" 
                    class="form-input"
                    placeholder="24"
                    min="1"
                    max="720"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">触发条件</label>
                  <input 
                    v-model="nodeForm.condition" 
                    type="text" 
                    class="form-input"
                    placeholder="金额 > 1000"
                  />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">节点说明</label>
                <textarea 
                  v-model="nodeForm.description" 
                  class="form-textarea"
                  placeholder="请输入节点说明..."
                  rows="3"
                ></textarea>
              </div>
            </div>

            <!-- 表单操作 -->
            <div class="form-actions">
              <button type="button" class="action-btn secondary" @click="closeNodeModal">
                取消
              </button>
              <button type="submit" class="action-btn primary">
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { VueDraggable as draggable } from 'vue-draggable-plus'

// 响应式数据
const approvalChain = ref([])
const chainConfig = reactive({
  name: '',
  description: '',
  mode: 'sequential'
})

const showNodeModal = ref(false)
const editingNodeIndex = ref(-1)

const nodeForm = reactive({
  name: '',
  type: '',
  approvalMode: 'any',
  users: [],
  timeout: '',
  condition: '',
  description: ''
})

// 工具函数
const getNodeTypeLabel = (type) => {
  const labels = {
    approval: '审批',
    review: '审核',
    notification: '通知',
    condition: '条件'
  }
  return labels[type] || '未知'
}

const getApprovalModeLabel = (mode) => {
  const labels = {
    any: '任意审批',
    all: '全部审批',
    majority: '多数审批',
    hierarchy: '层级审批'
  }
  return labels[mode] || '未知'
}

const getChainModeLabel = (mode) => {
  const labels = {
    sequential: '串行审批',
    parallel: '并行审批',
    mixed: '混合审批'
  }
  return labels[mode] || '未知'
}

const getNodeIcon = (type) => {
  const icons = {
    approval: 'fas fa-user-check',
    review: 'fas fa-file-search',
    notification: 'fas fa-bell',
    condition: 'fas fa-code-branch'
  }
  return icons[type] || 'fas fa-circle'
}

const getUserPlaceholder = (type) => {
  const placeholders = {
    user: '用户名',
    role: '角色名称',
    department: '部门名称'
  }
  return placeholders[type] || '请输入'
}

// 事件处理
const addNode = () => {
  resetNodeForm()
  editingNodeIndex.value = -1
  showNodeModal.value = true
}

const editNode = (node, index) => {
  editingNodeIndex.value = index
  Object.assign(nodeForm, JSON.parse(JSON.stringify(node)))
  showNodeModal.value = true
}

const deleteNode = (index) => {
  if (confirm('确定要删除这个节点吗？')) {
    approvalChain.value.splice(index, 1)
  }
}

const saveNode = () => {
  if (!nodeForm.name || !nodeForm.type) {
    alert('请填写必填项')
    return
  }

  const nodeData = JSON.parse(JSON.stringify(nodeForm))

  if (editingNodeIndex.value === -1) {
    approvalChain.value.push(nodeData)
  } else {
    approvalChain.value[editingNodeIndex.value] = nodeData
  }

  closeNodeModal()
}

const closeNodeModal = () => {
  showNodeModal.value = false
  resetNodeForm()
}

const resetNodeForm = () => {
  Object.assign(nodeForm, {
    name: '',
    type: '',
    approvalMode: 'any',
    users: [],
    timeout: '',
    condition: '',
    description: ''
  })
}

const addApprover = () => {
  nodeForm.users.push({
    type: 'user',
    value: '',
    role: ''
  })
}

const removeApprover = (index) => {
  nodeForm.users.splice(index, 1)
}

const handleNodeReorder = () => {
  console.log('节点重新排序')
}

const clearChain = () => {
  if (confirm('确定要清空所有节点吗？')) {
    approvalChain.value = []
  }
}

const handleSaveChain = () => {
  if (!chainConfig.name) {
    alert('请输入审批链名称')
    return
  }

  if (approvalChain.value.length === 0) {
    alert('请至少添加一个审批节点')
    return
  }

  const chainData = {
    ...chainConfig,
    nodes: approvalChain.value,
    createTime: new Date().toISOString()
  }

  console.log('保存审批链:', chainData)
  alert('审批链配置已保存！')
}

const handleTemplate = () => {
  console.log('使用模板')
  // 这里可以显示模板选择弹窗
}

const refreshPreview = () => {
  console.log('刷新预览')
}

// 初始化示例数据
const initSampleData = () => {
  approvalChain.value = [
    {
      id: 1,
      name: '部门主管审批',
      type: 'approval',
      approvalMode: 'any',
      users: [
        { id: 'user1', type: 'role', value: '部门经理', role: '部门主管', name: '张三' },
        { id: 'user2', type: 'role', value: '副经理', role: '副主管', name: '李四' }
      ],
      timeout: 24,
      condition: '金额 <= 5000',
      description: '部门主管进行初步审批'
    },
    {
      id: 2,
      name: '财务审核',
      type: 'review',
      approvalMode: 'any',
      users: [
        { id: 'user3', type: 'role', value: '财务主管', role: '财务审核', name: '王五' }
      ],
      timeout: 48,
      condition: '',
      description: '财务部门审核票据和金额'
    },
    {
      id: 3,
      name: '总经理审批',
      type: 'approval',
      approvalMode: 'any',
      users: [
        { id: 'user4', type: 'user', value: '总经理', role: '总经理', name: '赵六' }
      ],
      timeout: 72,
      condition: '金额 > 10000',
      description: '大额项目需要总经理审批'
    }
  ]

  chainConfig.name = '采购审批流程'
  chainConfig.description = '标准采购审批流程，适用于各类采购申请'
  chainConfig.mode = 'sequential'
}

// 初始化
initSampleData()
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;600&display=swap');

/* CSS变量定义 */
:root {
  --primary-color: #2C3E50;
  --secondary-color: #34495E;
  --accent-color: #E67E22;
  --background-color: #ECF0F1;
  --text-color: #2C3E50;
  --border-color: #BDC3C7;
  --success-color: #27AE60;
  --warning-color: #F39C12;
  --danger-color: #E74C3C;
}

/* 基础样式 */
* {
  box-sizing: border-box;
}

.approval-chain {
  font-family: 'Source Sans Pro', sans-serif;
  background: var(--background-color);
  min-height: 100vh;
  color: var(--text-color);
}

/* 头部样式 */
.chain-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
}

.chain-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent-color);
}

.page-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.breadcrumb {
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  opacity: 0.9;
}

.breadcrumb-item {
  color: rgba(255, 255, 255, 0.8);
}

.breadcrumb-item.active {
  color: white;
  font-weight: 600;
}

.breadcrumb-separator {
  margin: 0 0.5rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-btn.primary {
  background: var(--accent-color);
  color: white;
}

.action-btn.primary:hover {
  background: #D35400;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.4);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

.action-btn.small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.action-btn.info {
  background: #3498DB;
  color: white;
}

.action-btn.danger {
  background: var(--danger-color);
  color: white;
}

/* 主内容区域 */
.chain-main {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

/* 审批链编辑器 */
.chain-editor-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.editor-container {
  padding: 2rem;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border-color);
}

.editor-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
}

.editor-actions {
  display: flex;
  gap: 1rem;
}

.editor-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: 2px solid var(--border-color);
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--secondary-color);
}

.editor-btn:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.editor-btn.secondary {
  border-color: var(--danger-color);
  color: var(--danger-color);
}

.editor-btn.secondary:hover {
  background: var(--danger-color);
  color: white;
}

/* 审批链配置 */
.chain-config {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid var(--accent-color);
}

.config-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.config-label {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.config-input,
.config-select,
.config-textarea {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.3s ease;
  background: white;
}

.config-input:focus,
.config-select:focus,
.config-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
}

.config-textarea {
  resize: vertical;
  min-height: 80px;
}

/* 审批链节点 */
.chain-nodes {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.nodes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.nodes-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
}

.nodes-info {
  font-size: 0.875rem;
  color: #7F8C8D;
  font-weight: 600;
}

.empty-chain {
  text-align: center;
  padding: 4rem 2rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed var(--border-color);
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--border-color);
  margin: 0 auto 1rem;
}

.empty-chain h4 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
}

.empty-chain p {
  color: #7F8C8D;
  margin: 0 0 2rem 0;
  font-size: 0.875rem;
}

.chain-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.draggable-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chain-node {
  border: 2px solid var(--border-color);
  border-radius: 12px;
  background: white;
  transition: all 0.3s ease;
  position: relative;
}

.chain-node:hover {
  border-color: var(--accent-color);
  box-shadow: 0 4px 15px rgba(230, 126, 34, 0.15);
}

.chain-node.node-approval {
  border-left: 6px solid #3498DB;
}

.chain-node.node-review {
  border-left: 6px solid var(--warning-color);
}

.chain-node.node-notification {
  border-left: 6px solid var(--success-color);
}

.chain-node.node-condition {
  border-left: 6px solid #9B59B6;
}

.node-drag-handle {
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #BDC3C7;
  cursor: move;
  padding: 0.5rem;
}

.node-order {
  position: absolute;
  left: -1.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 2rem;
  height: 2rem;
  background: var(--accent-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.875rem;
  box-shadow: 0 2px 8px rgba(230, 126, 34, 0.4);
}

.node-content {
  padding: 1.5rem 1.5rem 1.5rem 2.5rem;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.node-info h4 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
}

.node-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.type-badge,
.mode-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-badge.type-approval {
  background: rgba(52, 152, 219, 0.1);
  color: #3498DB;
}

.type-badge.type-review {
  background: rgba(243, 156, 18, 0.1);
  color: var(--warning-color);
}

.type-badge.type-notification {
  background: rgba(39, 174, 96, 0.1);
  color: var(--success-color);
}

.type-badge.type-condition {
  background: rgba(155, 89, 182, 0.1);
  color: #9B59B6;
}

.mode-badge.mode-all {
  background: rgba(231, 76, 60, 0.1);
  color: var(--danger-color);
}

.mode-badge.mode-majority {
  background: rgba(142, 68, 173, 0.1);
  color: #8E44AD;
}

.node-actions {
  display: flex;
  gap: 0.5rem;
}

.node-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #7F8C8D;
  font-weight: 600;
  min-width: 100px;
}

.detail-value {
  color: var(--text-color);
  font-weight: 500;
  flex: 1;
}

.approvers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex: 1;
}

.approver-tag {
  background: #f8f9fa;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--secondary-color);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.role-info {
  color: #7F8C8D;
  font-size: 0.625rem;
}

.node-connector {
  position: absolute;
  left: 50%;
  bottom: -2rem;
  transform: translateX(-50%);
  width: 2rem;
  height: 2rem;
  background: var(--accent-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  box-shadow: 0 2px 8px rgba(230, 126, 34, 0.4);
}

/* 预览区域 */
.preview-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  height: fit-content;
  position: sticky;
  top: 2rem;
}

.preview-container {
  padding: 1.5rem;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border-color);
}

.preview-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
}

.preview-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: var(--secondary-color);
}

.preview-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.chain-overview {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.overview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.overview-label {
  color: #7F8C8D;
  font-weight: 600;
}

.overview-value {
  color: var(--text-color);
  font-weight: 500;
}

.preview-timeline {
  position: relative;
  padding-left: 2rem;
}

.preview-timeline::before {
  content: '';
  position: absolute;
  left: 1rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--border-color);
}

.timeline-node {
  position: relative;
  margin-bottom: 2rem;
}

.timeline-marker {
  position: absolute;
  left: -2rem;
  top: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 2px solid var(--accent-color);
  color: var(--accent-color);
  font-size: 0.875rem;
}

.timeline-node.node-approval .timeline-marker {
  border-color: #3498DB;
  color: #3498DB;
}

.timeline-node.node-review .timeline-marker {
  border-color: var(--warning-color);
  color: var(--warning-color);
}

.timeline-node.node-notification .timeline-marker {
  border-color: var(--success-color);
  color: var(--success-color);
}

.timeline-node.node-condition .timeline-marker {
  border-color: #9B59B6;
  color: #9B59B6;
}

.timeline-content {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 3px solid var(--accent-color);
}

.timeline-node.node-approval .timeline-content {
  border-left-color: #3498DB;
}

.timeline-node.node-review .timeline-content {
  border-left-color: var(--warning-color);
}

.timeline-node.node-notification .timeline-content {
  border-left-color: var(--success-color);
}

.timeline-node.node-condition .timeline-content {
  border-left-color: #9B59B6;
}

.timeline-title {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.timeline-subtitle {
  font-size: 0.875rem;
  color: #7F8C8D;
  margin-bottom: 0.5rem;
}

.timeline-users,
.timeline-mode {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--secondary-color);
  margin-bottom: 0.25rem;
}

.timeline-connector {
  position: absolute;
  left: 50%;
  bottom: -2rem;
  transform: translateX(-50%);
  color: var(--border-color);
  font-size: 1rem;
}

/* 节点编辑弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 2px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: none;
  background: #f8f9fa;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--danger-color);
  color: white;
}

.modal-body {
  padding: 1.5rem;
}

.node-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--accent-color);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--secondary-color);
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.3s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
}

.form-input.small,
.form-select.small {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.approvers-config {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.approver-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.approver-fields {
  display: flex;
  gap: 0.5rem;
  flex: 1;
}

.approver-fields > * {
  flex: 1;
}

.remove-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--danger-color);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: #C0392B;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 2px dashed var(--accent-color);
  background: rgba(230, 126, 34, 0.05);
  color: var(--accent-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.add-btn:hover {
  background: rgba(230, 126, 34, 0.1);
  border-style: solid;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 2px solid var(--border-color);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .chain-main {
    grid-template-columns: 1fr;
  }
  
  .preview-section {
    position: static;
  }
}

@media (max-width: 768px) {
  .chain-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .chain-main {
    padding: 1rem;
  }
  
  .editor-container {
    padding: 1.5rem;
  }
  
  .chain-config {
    grid-template-columns: 1fr;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .approver-fields {
    flex-direction: column;
  }
  
  .approver-fields > * {
    width: 100%;
  }
}
</style>