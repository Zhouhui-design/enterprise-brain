/**
 * 剪贴板工具函数
 */
import { ElMessage } from 'element-plus'

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @param {string} fieldName - 字段名称（用于提示消息）
 * @returns {Promise<boolean>} - 是否成功
 */
export async function copyToClipboard(text, fieldName = '内容') {
  if (!text) {
    ElMessage.warning('没有可复制的内容')
    return false
  }
  
  try {
    // 优先使用现代 Clipboard API
    await navigator.clipboard.writeText(String(text))
    ElMessage.success(`${fieldName}已复制到剪贴板`)
    return true
  } catch (err) {
    // 降级方案：使用传统的 execCommand 方法
    const textarea = document.createElement('textarea')
    textarea.value = String(text)
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    
    try {
      const successful = document.execCommand('copy')
      if (successful) {
        ElMessage.success(`${fieldName}已复制到剪贴板`)
        return true
      } else {
        ElMessage.error('复制失败，请手动复制')
        return false
      }
    } catch (error) {
      ElMessage.error('复制失败，请手动复制')
      return false
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

/**
 * Element Plus 表格列双击复制配置
 * 使用方法：
 * <el-table-column label="编码" width="140">
 *   <template #default="{ row }">
 *     <span v-bind="getCopyableColumnProps(row.code, '编码')">
 *       {{ row.code }}
 *     </span>
 *   </template>
 * </el-table-column>
 */
export function getCopyableColumnProps(value, fieldName) {
  return {
    style: 'cursor: pointer;',
    title: `双击复制：${value || ''}`,
    onDblclick: () => copyToClipboard(value, fieldName)
  }
}

/**
 * 批量复制（多行数据）
 * @param {Array} data - 数据数组
 * @param {string} separator - 分隔符
 * @returns {Promise<boolean>}
 */
export async function copyMultipleLines(data, separator = '\n') {
  if (!data || data.length === 0) {
    ElMessage.warning('没有可复制的内容')
    return false
  }
  
  const text = data.join(separator)
  return copyToClipboard(text, `${data.length}条数据`)
}

/**
 * 复制对象为JSON格式
 * @param {Object} obj - 要复制的对象
 * @param {string} fieldName - 字段名称
 * @returns {Promise<boolean>}
 */
export async function copyAsJson(obj, fieldName = 'JSON') {
  if (!obj) {
    ElMessage.warning('没有可复制的内容')
    return false
  }
  
  try {
    const jsonText = JSON.stringify(obj, null, 2)
    return copyToClipboard(jsonText, fieldName)
  } catch (error) {
    ElMessage.error('JSON转换失败')
    return false
  }
}
