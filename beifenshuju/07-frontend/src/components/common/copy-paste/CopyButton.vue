<!-- src/components/common/copy-paste/CopyButton.vue -->
<template>
  <el-button
    type="primary"
    icon="Copy"
    :loading="isCopying"
    @click="handleCopy"
    :size="size"
    :disabled="disabled"
  >
    复制
  </el-button>
</template>

<script setup>
import { defineProps, emit } from 'vue';
import { useCopyPaste } from './hooks/useCopyPaste';

/**
 * 复制按钮组件
 * 提供通用的复制功能，可集成到各种业务场景
 */

// 组件属性
const props = defineProps({
  /** 要复制的内容（JSON字符串） */
  content: {
    type: String,
    required: true
  },
  /** 复制类型（salesOrder, bom, material, quotation） */
  type: {
    type: String,
    required: true
  },
  /** 是否显示保存为模板选项 */
  showSaveTemplate: {
    type: Boolean,
    default: false
  },
  /** 按钮尺寸 */
  size: {
    type: String,
    default: 'default'
  },
  /** 是否禁用 */
  disabled: {
    type: Boolean,
    default: false
  }
});

// 组件事件
const emitEvent = emit();

// 引入复制粘贴逻辑
const { copy, isCopying } = useCopyPaste();

/**
 * 处理复制点击事件
 */
const handleCopy = async () => {
  // 如果需要保存为模板，可在这里弹出输入框获取模板名称
  const params = {
    content: props.content,
    type: props.type,
    saveAsTemplate: props.showSaveTemplate,
    templateName: props.showSaveTemplate ? `模板_${new Date().getTime()}` : ''
  };

  // 实际项目中如果showSaveTemplate为true，应该弹出输入框让用户输入模板名称
  const result = await copy(params);
  
  // 触发复制完成事件
  emitEvent('copy-complete', result);
};
</script>
