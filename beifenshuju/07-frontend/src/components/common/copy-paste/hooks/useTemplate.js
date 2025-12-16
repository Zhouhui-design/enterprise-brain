// src/components/common/copy-paste/hooks/useTemplate.js
/**
 * 模板管理相关钩子
 * 封装模板的增删改查逻辑
 */
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

export function useTemplate() {
  // 模板列表
  const templates = ref([]);
  // 加载状态
  const isLoading = ref(false);

  /**
   * 获取模板列表
   * @param {string} [type] - 模板类型，为空则获取所有
   */
  const getTemplates = async (type) => {
    try {
      isLoading.value = true;
      const params = type ? { type } : {};
      const response = await axios.get('/api/common/copy-paste/templates', { params });
      templates.value = response.data.data || [];
    } catch (error) {
      console.error('获取模板列表失败:', error);
      ElMessage.error('获取模板失败，请重试');
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 删除模板
   * @param {number} id - 模板ID
   */
  const deleteTemplate = async (id) => {
    try {
      await axios.delete(`/api/common/copy-paste/templates/${id}`);
      ElMessage.success('模板删除成功');
      // 重新获取列表
      getTemplates();
    } catch (error) {
      console.error('删除模板失败:', error);
      ElMessage.error('删除模板失败，请重试');
    }
  };

  // 组件挂载时获取模板列表
  onMounted(() => {
    getTemplates();
  });

  return {
    templates,
    isLoading,
    getTemplates,
    deleteTemplate
  };
}
