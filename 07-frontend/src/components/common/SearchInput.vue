<template>
  <div class="search-input-container">
    <el-input
      v-model="searchValue"
      :placeholder="placeholder"
      :size="size"
      :clearable="clearable"
      :disabled="disabled"
      @input="handleInput"
      @clear="handleClear"
      @keyup.enter="handleSearch"
    >
      <template #prefix>
        <i class="fas fa-search" v-if="showPrefixIcon"></i>
      </template>
      <template #append>
        <el-button
          :icon="SearchIcon"
          :loading="loading"
          :size="size"
          @click="handleSearch"
          v-if="showSearchButton"
        >
          搜索
        </el-button>
      </template>
    </el-input>
    
    <!-- 搜索建议下拉框 -->
    <div class="search-suggestions" v-if="showSuggestions && suggestions.length > 0">
      <div
        v-for="(item, index) in suggestions"
        :key="index"
        class="suggestion-item"
        @click="selectSuggestion(item)"
      >
        <i class="fas fa-history" v-if="item.type === 'history'"></i>
        <i class="fas fa-fire" v-else-if="item.type === 'hot'"></i>
        <i class="fas fa-tag" v-else></i>
        {{ item.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search as SearchIcon } from '@element-plus/icons-vue'

interface SearchSuggestion {
  text: string
  type: 'history' | 'hot' | 'normal'
  value?: string
}

interface Props {
  modelValue?: string
  placeholder?: string
  size?: 'large' | 'default' | 'small'
  clearable?: boolean
  disabled?: boolean
  loading?: boolean
  showSearchButton?: boolean
  showPrefixIcon?: boolean
  showSuggestions?: boolean
  suggestions?: SearchSuggestion[]
  debounceTime?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入搜索内容',
  size: 'default',
  clearable: true,
  disabled: false,
  loading: false,
  showSearchButton: true,
  showPrefixIcon: true,
  showSuggestions: false,
  suggestions: () => [],
  debounceTime: 300
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [value: string]
  clear: []
  input: [value: string]
  'select-suggestion': [item: SearchSuggestion]
}>()

const searchValue = ref(props.modelValue)
const debounceTimer = ref<number>()

watch(() => props.modelValue, (newValue) => {
  searchValue.value = newValue
})

const handleInput = (value: string) => {
  emit('update:modelValue', value)
  emit('input', value)
  
  if (props.showSuggestions) {
    clearTimeout(debounceTimer.value)
    debounceTimer.value = setTimeout(() => {
      // 这里可以触发搜索建议的请求
    }, props.debounceTime)
  }
}

const handleClear = () => {
  emit('clear')
  emit('search', '')
}

const handleSearch = () => {
  emit('search', searchValue.value)
}

const selectSuggestion = (item: SearchSuggestion) => {
  searchValue.value = item.value || item.text
  emit('update:modelValue', item.value || item.text)
  emit('select-suggestion', item)
  emit('search', item.value || item.text)
}
</script>

<style scoped>
.search-input-container {
  position: relative;
  width: 100%;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-top: none;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s;
}

.suggestion-item:hover {
  background-color: #f5f7fa;
}

.suggestion-item i {
  color: #909399;
  font-size: 12px;
}

.suggestion-item i.fa-history {
  color: #909399;
}

.suggestion-item i.fa-fire {
  color: #f56c6c;
}

.suggestion-item i.fa-tag {
  color: #409eff;
}

:deep(.el-input__inner) {
  border-radius: 4px;
}

:deep(.el-input-group__append) {
  border-radius: 0 4px 4px 0;
}
</style>