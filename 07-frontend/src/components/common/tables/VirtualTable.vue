<template>
  <div class="virtual-table-wrapper" ref="wrapperRef">
    <div class="virtual-table-header" v-if="showHeader">
      <div class="header-row" :style="{ width: totalWidth + 'px' }">
        <div
          v-for="column in columns"
          :key="column.prop"
          class="header-cell"
          :style="{
            width: column.width + 'px',
            textAlign: column.align || 'left'
          }"
        >
          {{ column.label }}
        </div>
      </div>
    </div>
    
    <div
      class="virtual-table-body"
      :style="{ height: height + 'px' }"
      @scroll="handleScroll"
      ref="bodyRef"
    >
      <div
        class="virtual-spacer"
        :style="{ height: totalHeight + 'px' }"
      >
        <div
          class="virtual-content"
          :style="{ transform: `translateY(${offset}px)` }"
        >
          <div
            v-for="(row, index) in visibleData"
            :key="getRowKey(row, index)"
            class="table-row"
            :style="{ width: totalWidth + 'px' }"
            @click="handleRowClick(row, index)"
          >
            <div
              v-for="column in columns"
              :key="column.prop"
              class="table-cell"
              :style="{
                width: column.width + 'px',
                textAlign: column.align || 'left'
              }"
            >
              <slot
                v-if="column.slot"
                :name="column.slot"
                :row="row"
                :column="column"
                :index="index + startIndex"
              />
              <template v-else-if="column.formatter">
                {{ column.formatter(row, column, row[column.prop], index + startIndex) }}
              </template>
              <template v-else>
                {{ row[column.prop] }}
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  // 表格数据
  data: {
    type: Array,
    default: () => []
  },
  // 列配置
  columns: {
    type: Array,
    default: () => []
  },
  // 容器高度
  height: {
    type: Number,
    default: 500
  },
  // 行高
  rowHeight: {
    type: Number,
    default: 48
  },
  // 缓冲行数
  buffer: {
    type: Number,
    default: 5
  },
  // 行key
  rowKey: {
    type: [String, Function],
    default: 'id'
  },
  // 是否显示表头
  showHeader: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['row-click', 'scroll'])

const wrapperRef = ref(null)
const bodyRef = ref(null)
const scrollTop = ref(0)

// 总高度
const totalHeight = computed(() => {
  return props.data.length * props.rowHeight
})

// 总宽度
const totalWidth = computed(() => {
  return props.columns.reduce((sum, col) => sum + (col.width || 120), 0)
})

// 可见行数
const visibleCount = computed(() => {
  return Math.ceil(props.height / props.rowHeight)
})

// 开始索引
const startIndex = computed(() => {
  const start = Math.floor(scrollTop.value / props.rowHeight) - props.buffer
  return Math.max(0, start)
})

// 结束索引
const endIndex = computed(() => {
  const end = startIndex.value + visibleCount.value + props.buffer * 2
  return Math.min(props.data.length, end)
})

// 偏移量
const offset = computed(() => {
  return startIndex.value * props.rowHeight
})

// 可见数据
const visibleData = computed(() => {
  return props.data.slice(startIndex.value, endIndex.value)
})

// 滚动处理
const handleScroll = (event) => {
  scrollTop.value = event.target.scrollTop
  emit('scroll', {
    scrollTop: scrollTop.value,
    scrollLeft: event.target.scrollLeft
  })
}

// 行点击
const handleRowClick = (row, index) => {
  emit('row-click', row, index + startIndex.value)
}

// 获取行key
const getRowKey = (row, index) => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }
  return row[props.rowKey] || index
}

// 滚动到指定位置
const scrollTo = (top) => {
  if (bodyRef.value) {
    bodyRef.value.scrollTop = top
  }
}

// 滚动到指定行
const scrollToRow = (index) => {
  const top = index * props.rowHeight
  scrollTo(top)
}

// 暴露方法
defineExpose({
  scrollTo,
  scrollToRow
})
</script>

<style scoped lang="scss">
.virtual-table-wrapper {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;

  .virtual-table-header {
    background-color: #f5f7fa;
    border-bottom: 1px solid #ebeef5;
    overflow: hidden;

    .header-row {
      display: flex;

      .header-cell {
        padding: 12px 0;
        font-weight: 500;
        color: #909399;
        font-size: 14px;
        border-right: 1px solid #ebeef5;
        padding-left: 10px;
        padding-right: 10px;
        box-sizing: border-box;

        &:last-child {
          border-right: none;
        }
      }
    }
  }

  .virtual-table-body {
    overflow-y: auto;
    overflow-x: auto;
    position: relative;

    .virtual-spacer {
      position: relative;

      .virtual-content {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;

        .table-row {
          display: flex;
          border-bottom: 1px solid #ebeef5;
          transition: background-color 0.2s;

          &:hover {
            background-color: #f5f7fa;
          }

          .table-cell {
            padding: 12px 0;
            font-size: 14px;
            color: #606266;
            border-right: 1px solid #ebeef5;
            padding-left: 10px;
            padding-right: 10px;
            box-sizing: border-box;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            &:last-child {
              border-right: none;
            }
          }
        }
      }
    }
  }
}
</style>
