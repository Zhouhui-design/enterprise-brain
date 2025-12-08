<template>
  <div class="template-library-container">
    <div class="page-header">
      <h2 class="page-title">模板库</h2>
      <el-button type="primary" @click="handleCreateTemplate">创建模板</el-button>
    </div>
    
    <div class="template-list">
      <el-card 
        v-for="template in templates" 
        :key="template.id"
        class="template-card"
        :shadow="'hover'"
      >
        <template #header>
          <div class="template-card-header">
            <h3 class="template-title">{{ template.name }}</h3>
            <el-tag :type="template.type === 'system' ? 'primary' : 'success'">
              {{ template.type === 'system' ? '系统模板' : '自定义模板' }}
            </el-tag>
          </div>
        </template>
        
        <div class="template-content">
          <p class="template-description">{{ template.description }}</p>
          <div class="template-meta">
            <span class="meta-item">
              <el-icon><Document /></el-icon>
              {{ template.fileType }}
            </span>
            <span class="meta-item">
              <el-icon><Calendar /></el-icon>
              {{ template.createdAt }}
            </span>
            <span class="meta-item">
              <el-icon><User /></el-icon>
              {{ template.createdBy }}
            </span>
          </div>
        </div>
        
        <div class="template-actions">
          <el-button type="primary" size="small" @click="handleUse(template.id)">
            <el-icon><Plus /></el-icon>
            使用模板
          </el-button>
          <el-button size="small" @click="handlePreview(template.id)">
            <el-icon><View /></el-icon>
            预览
          </el-button>
          <el-button size="small" type="danger" @click="handleDelete(template.id)" v-if="template.type !== 'system'">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </el-card>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>
    
    <!-- 空状态 -->
    <div v-if="!loading && templates.length === 0" class="empty-container">
      <el-empty description="暂无模板" />
      <el-button type="primary" style="margin-top: 20px;" @click="handleCreateTemplate">创建第一个模板</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Calendar, User, Plus, View, Delete } from '@element-plus/icons-vue'
import { documentAPI } from '@/api'

const loading = ref(false)
const templates = ref([])

// 加载模板列表
const loadTemplates = async () => {
  loading.value = true
  try {
    const response = await documentAPI.getTemplates()
    templates.value = response.data || []
  } catch (error) {
    console.error('加载模板列表失败:', error)
    ElMessage.error('加载模板列表失败，请稍后重试')
    // 使用本地模拟数据作为fallback
    templates.value = [
      {
        id: 'template-1',
        name: '项目计划模板',
        description: '标准的项目计划文档模板，包含项目目标、时间线、资源分配等内容',
        type: 'system',
        fileType: 'doc',
        createdAt: '2023-01-15',
        createdBy: '系统管理员'
      },
      {
        id: 'template-2',
        name: '会议纪要模板',
        description: '会议纪要文档模板，记录会议讨论内容、决议和行动项',
        type: 'system',
        fileType: 'doc',
        createdAt: '2023-01-20',
        createdBy: '系统管理员'
      },
      {
        id: 'template-3',
        name: '周报模板',
        description: '每周工作报告模板，总结本周工作内容和下周计划',
        type: 'custom',
        fileType: 'doc',
        createdAt: '2023-02-05',
        createdBy: '张三'
      }
    ]
  } finally {
    loading.value = false
  }
}

// 使用模板创建文档
const handleUse = async (templateId) => {
  try {
    const response = await documentAPI.createFromTemplate(templateId)
    ElMessage.success('文档创建成功')
    console.log('新创建的文档:', response.data)
    // 跳转到文档编辑页面
    // router.push(`/document/edit/${response.data.id}`)
  } catch (error) {
    console.error('使用模板创建文档失败:', error)
    ElMessage.error('使用模板创建文档失败，请稍后重试')
  }
}

// 预览模板
const handlePreview = (templateId) => {
  console.log('预览模板:', templateId)
  ElMessage.info('预览功能开发中')
}

// 删除模板
const handleDelete = (templateId) => {
  console.log('删除模板:', templateId)
  ElMessage.info('删除功能开发中')
}

// 创建模板
const handleCreateTemplate = () => {
  console.log('创建模板')
  ElMessage.info('创建模板功能开发中')
}

// 页面加载时获取模板列表
onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.template-library-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  color: #333;
}

.template-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.template-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
}

.template-card:hover {
  transform: translateY(-5px);
}

.template-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.template-description {
  margin-bottom: 15px;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.template-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #909399;
}

.template-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.loading-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.empty-container {
  text-align: center;
  padding: 60px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
</style>