<!-- src/components/common/copy-paste/CopyTemplateManager.vue -->
<template>
  <el-dialog
    title="模板管理"
    v-model="visible"
    :width="width"
    @close="handleClose"
  >
    <el-table
      :data="templates"
      border
      style="width: 100%"
      v-loading="isLoading"
    >
      <el-table-column
        prop="name"
        label="模板名称"
        width="200"
      />
      <el-table-column
        prop="type"
        label="模板类型"
        width="150"
        :formatter="formatType"
      />
      <el-table-column
        prop="createTime"
        label="创建时间"
        width="180"
      />
      <el-table-column
        label="操作"
        width="180"
      >
        <template #default="scope">
          <el-button
            size="small"
            type="text"
            @click="handleUseTemplate(scope.row)"
          >
            使用
          </el-button>
          <el-button
            size="small"
            type="text"
            text-color="#ff4d4f"
            @click="handleDeleteTemplate(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch } from 'vue';
import { useTemplate } from './hooks/useTemplate';

/**
 * 复制模板管理组件
 * 用于展示、使用和删除复制模板
 */

// 组件属性
const props = defineProps({
  /** 是否显示弹窗 */
  visible: {
    type: Boolean,
    default: false
  },
  /** 弹窗宽度 */
  width: {
    type: String,
    default: '600px'
  },
  /** 筛选的模板类型 */
  type: {
    type: String,
    default: ''
  }
});

// 组件事件
const emit = defineEmits(['close', 'use-template']);

// 引入模板逻辑
const { templates, isLoading, getTemplates, deleteTemplate } = useTemplate();

// 监听类型变化，重新获取模板
watch(
  () => props.type,
  (newType) => {
    getTemplates(newType);
  },
  { immediate: true }
);

/**
 * 格式化类型显示文本
 * @param {string} type 类型标识
 * @returns {string} 格式化后的文本
 */
const formatType = (type) => {
  const typeMap = {
    salesOrder: '销售订单',
    bom: 'BOM',
    material: '物料',
    quotation: '报价单'
  };
  return typeMap[type] || type;
};

/**
 * 处理使用模板事件
 * @param {Object} template 模板对象
 */
const handleUseTemplate = (template) => {
  emit('use-template', template);
  emit('close');
};

/**
 * 处理删除模板事件
 * @param {number} id 模板ID
 */
const handleDeleteTemplate = (id) => {
  deleteTemplate(id);
};

/**
 * 处理弹窗关闭事件
 */
const handleClose = () => {
  emit('close');
};
</script>
