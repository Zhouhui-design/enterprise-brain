<!-- src/components/common/copy-paste/PasteButton.vue -->
<template>
  <el-button
    type="success"
    icon="ClipboardPaste"
    :loading="isPasting"
    @click="handlePaste"
    :size="size"
    :disabled="disabled"
  >
    粘贴
  </el-button>
</template>

<script setup>
import { defineProps, emit } from 'vue';
import { useCopyPaste } from './hooks/useCopyPaste';

/**
 * 粘贴按钮组件
 * 提供通用的粘贴功能，可集成到各种业务场景
 */

// 组件属性
const props = defineProps({
  /** 粘贴类型（salesOrder, bom, material, quotation） */
  type: {
    type: String,
    required: true
  },
  /** 预定义的粘贴内容（可选，默认从剪贴板获取） */
  content: {
    type: String,
    default: ''
  },
  /** 关联的模板ID（可选） */
  templateId: {
    type: Number,
    default: null
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
const { paste, isPasting } = useCopyPaste();

/**
 * 处理粘贴点击事件
 */
const handlePaste = async () => {
  const params = {
    content: props.content,
    type: props.type,
    templateId: props.templateId
  };

  const result = await paste(params);
  
  // 触发粘贴完成事件，传递业务ID给父组件
  if (result.success && result.businessId) {
    emitEvent('paste-complete', result.businessId);
  }
};
</script>
