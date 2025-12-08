/**
 * 响应式断点系统 Composable
 * 使用 matchMedia API 监听屏幕尺寸变化
 * 
 * 断点定义：
 * - Mobile: <= 640px
 * - Tablet: 641px - 1024px
 * - Desktop: >= 1025px
 * 
 * @returns {Object} { isMobile, isTablet, isDesktop }
 */
import { ref, onMounted, onUnmounted } from 'vue'

export const useResponsive = () => {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(true)

  const breakpoints = {
    mobile: '(max-width: 640px)',
    tablet: '(min-width: 641px) and (max-width: 1024px)',
    desktop: '(min-width: 1025px)'
  }

  let mobileQuery = null
  let tabletQuery = null
  let desktopQuery = null

  const updateBreakpoints = () => {
    isMobile.value = mobileQuery?.matches || false
    isTablet.value = tabletQuery?.matches || false
    isDesktop.value = desktopQuery?.matches || true
  }

  onMounted(() => {
    // 创建媒体查询对象
    mobileQuery = window.matchMedia(breakpoints.mobile)
    tabletQuery = window.matchMedia(breakpoints.tablet)
    desktopQuery = window.matchMedia(breakpoints.desktop)

    // 初始检查
    updateBreakpoints()

    // 监听变化
    mobileQuery.addEventListener('change', updateBreakpoints)
    tabletQuery.addEventListener('change', updateBreakpoints)
    desktopQuery.addEventListener('change', updateBreakpoints)

    console.log('✅ useResponsive: 响应式断点系统已激活')
  })

  onUnmounted(() => {
    // 清理事件监听器
    mobileQuery?.removeEventListener('change', updateBreakpoints)
    tabletQuery?.removeEventListener('change', updateBreakpoints)
    desktopQuery?.removeEventListener('change', updateBreakpoints)

    console.log('✅ useResponsive: 事件监听器已清理')
  })

  return {
    isMobile,
    isTablet,
    isDesktop
  }
}
