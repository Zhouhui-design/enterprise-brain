# 创建 VersionHistory.vue
cat > oa/document/VersionHistory.vue <<'EOF'
<template>
  <div class="version-history">
    <h2>版本历史</h2>
    <el-table :data="versions">
      <el-table-column prop="version" label="版本" />
      <el-table-column prop="creator" label="创建人" />
      <el-table-column prop="time" label="时间" />
      <el-table-column prop="changes" label="变更说明" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button link type="primary" @click="handleView(scope.row)">查看</el-button>
          <el-button link type="primary" @click="handleRevert(scope.row)">恢复</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
const versions = [
  { version: 'v1.2', creator: '用户A', time: '2024-01-15 10:00', changes: '更新项目需求' },
  { version: 'v1.1', creator: '用户B', time: '2024-01-14 16:00', changes: '修复格式问题' },
  { version: 'v1.0', creator: '用户A', time: '2024-01-13 09:00', changes: '初始版本' }
]

const handleView = (version) => {
  console.log('查看版本:', version)
}

const handleRevert = (version) => {
  console.log('恢复版本:', version)
}
</script>
EOF

# 创建 DocumentShare.vue
cat > oa/document/DocumentShare.vue <<'EOF'
<template>
  <div class="document-share">
    <h2>文档分享</h2>
    <el-form :model="shareForm" label-width="100px">
      <el-form-item label="分享链接">
        <el-input v-model="shareForm.link" readonly>
          <template #append>
            <el-button @click="handleCopy">复制</el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="有效期">
        <el-select v-model="shareForm.expire">
          <el-option label="1天" value="1d" />
          <el-option label="7天" value="7d" />
          <el-option label="30天" value="30d" />
        </el-select>
      </el-form-item>
      <el-form-item label="访问密码">
        <el-input v-model="shareForm.password" placeholder="可选" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const shareForm = ref({
  link: 'https://example.com/share/abc123',
  expire: '7d',
  password: ''
})

const handleCopy = () => {
  console.log('复制分享链接')
}
</script>
EOF

# 创建 TemplateLibrary.vue
cat > oa/document/TemplateLibrary.vue <<'EOF'
<template>
  <div class="template-library">
    <h2>模板库</h2>
    <div class="template-grid">
      <div v-for="template in templates" :key="template.id" class="template-card">
        <h3>{{ template.name }}</h3>
        <p>{{ template.description }}</p>
        <el-button @click="handleUse(template)">使用模板</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
const templates = [
  { id: 1, name: '会议纪要模板', description: '标准会议记录格式' },
  { id: 2, name: '项目计划模板', description: '项目规划文档模板' },
  { id: 3, name: '工作报告模板', description: '周报月报格式' }
]

const handleUse = (template) => {
  console.log('使用模板:', template)
}
</script>

<style scoped>
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.template-card {
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 4px;
  text-align: center;
}
</style>
EOF