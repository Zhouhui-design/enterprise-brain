cat > oa/document/CollaborativeEdit.vue <<'EOF'
<template>
  <div class="collaborative-edit">
    <div class="editor-header">
      <h2>协同编辑: {{ documentTitle }}</h2>
      <div class="user-list">
        <span>在线用户:</span>
        <el-tag v-for="user in onlineUsers" :key="user.id" type="info">
          {{ user.name }}
        </el-tag>
      </div>
    </div>
    
    <div class="editor-container">
      <textarea 
        v-model="content" 
        @input="handleContentChange"
        placeholder="开始编辑文档内容..."
        class="editor-textarea"
      ></textarea>
    </div>
    
    <div class="editor-footer">
      <el-button type="primary" @click="handleSave">保存</el-button>
      <el-button @click="handleExit">退出</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const documentTitle = ref('未命名文档')
const content = ref('')
const onlineUsers = ref([])

onMounted(() => {
  // 模拟在线用户
  onlineUsers.value = [
    { id: 1, name: '用户A' },
    { id: 2, name: '用户B' }
  ]
})

onUnmounted(() => {
  // 清理资源
})

const handleContentChange = () => {
  // 实时同步内容到其他用户
  console.log('内容变更:', content.value)
}

const handleSave = () => {
  console.log('保存文档:', content.value)
}

const handleExit = () => {
  console.log('退出编辑')
}
</script>

<style scoped>
.collaborative-edit {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #eee;
}

.user-list {
  display: flex;
  align-items: center;
  gap: 5px;
}

.editor-container {
  flex: 1;
  padding: 20px;
}

.editor-textarea {
  width: 100%;
  height: 100%;
  border: 1px solid #ddd;
  padding: 10px;
  font-size: 14px;
  resize: none;
}

.editor-footer {
  padding: 10px 20px;
  border-top: 1px solid #eee;
  text-align: right;
}
</style>
EOF