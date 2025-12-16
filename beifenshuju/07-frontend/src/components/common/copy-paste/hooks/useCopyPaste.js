// src/components/common/copy-paste/hooks/useCopyPaste.js
/**
 * 复制粘贴功能的核心钩子
 * 封装复制、粘贴的API调用和本地存储逻辑
 */
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

export function useCopyPaste() {
  // 复制状态
  const isCopying = ref(false);
  // 粘贴状态
  const isPasting = ref(false);

  /**
   * 执行复制操作
   * @param {Object} params - 复制参数
   * @param {string} params.content - 要复制的内容（JSON字符串）
   * @param {string} params.type - 复制类型（salesOrder, bom, material, quotation）
   * @param {boolean} [params.saveAsTemplate=false] - 是否保存为模板
   * @param {string} [params.templateName] - 模板名称（saveAsTemplate为true时必填）
   * @returns {Promise<Object>} 复制结果
   */
  const copy = async (params) => {
    try {
      isCopying.value = true;
      const response = await axios.post('/api/common/copy-paste/copy', params);
      
      if (response.data.success) {
        ElMessage.success('复制成功');
        // 同时复制到浏览器剪贴板
        await navigator.clipboard.writeText(params.content);
      } else {
        ElMessage.error(response.data.message || '复制失败');
      }
      return response.data;
    } catch (error) {
      console.error('复制操作失败:', error);
      ElMessage.error('复制操作异常，请重试');
      return { success: false };
    } finally {
      isCopying.value = false;
    }
  };

  /**
   * 执行粘贴操作
   * @param {Object} params - 粘贴参数
   * @param {string} [params.content] - 粘贴内容（为空则从剪贴板获取）
   * @param {string} params.type - 粘贴类型
   * @param {number} [params.templateId] - 关联的模板ID
   * @returns {Promise<Object>} 粘贴结果
   */
  const paste = async (params) => {
    try {
      isPasting.value = true;
      // 如果没有提供内容，从剪贴板获取
      let content = params.content;
      if (!content) {
        content = await navigator.clipboard.readText();
      }
      
      const requestParams = { ...params, content };
      const response = await axios.post('/api/common/copy-paste/paste', requestParams);
      
      if (response.data.success) {
        ElMessage.success('粘贴成功');
      } else {
        ElMessage.error(response.data.message || '粘贴失败');
      }
      return response.data;
    } catch (error) {
      console.error('粘贴操作失败:', error);
      ElMessage.error('粘贴操作异常，请重试');
      return { success: false };
    } finally {
      isPasting.value = false;
    }
  };

  return {
    isCopying,
    isPasting,
    copy,
    paste
  };
}
