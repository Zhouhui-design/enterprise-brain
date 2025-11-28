// 主题系统常量定义

// 预设主题列表
export const THEME_PRESETS = {
  default: {
    name: '默认主题',
    description: '系统默认蓝色主题',
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
    info: '#1890ff',
    type: 'default'
  },
  dark: {
    name: '深色主题',
    description: '适合夜间使用的深色主题',
    primary: '#177ddc',
    success: '#49aa19',
    warning: '#d89614',
    error: '#d32029',
    info: '#177ddc',
    type: 'dark'
  },
  light: {
    name: '浅色主题',
    description: '清新明亮的浅色主题',
    primary: '#2f54eb',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
    info: '#1890ff',
    type: 'light'
  },
  blue: {
    name: '蓝色主题',
    description: '专业的蓝色商务主题',
    primary: '#0050b3',
    success: '#389e0d',
    warning: '#d46b08',
    error: '#cf1322',
    info: '#0050b3',
    type: 'blue'
  },
  green: {
    name: '绿色主题',
    description: '环保健康的绿色主题',
    primary: '#237804',
    success: '#135200',
    warning: '#ad6800',
    error: '#a8071a',
    info: '#237804',
    type: 'green'
  }
}

// 布局配置选项
export const LAYOUT_OPTIONS = {
  SIDEBAR_POSITION: {
    LEFT: 'left',
    RIGHT: 'right',
    TOP: 'top'
  },
  CONTENT_WIDTH: {
    FLUID: 'fluid',
    FIXED: 'fixed',
    COMPACT: 'compact'
  },
  HEADER_STYLE: {
    FIXED: 'fixed',
    STATIC: 'static',
    HIDDEN: 'hidden'
  },
  NAVIGATION_MODE: {
    SIDE: 'side',
    TOP: 'top',
    MIX: 'mix'
  }
}

// 组件尺寸配置
export const COMPONENT_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
}

// 动画配置
export const ANIMATION_CONFIG = {
  DURATION: {
    FAST: 0.1,
    NORMAL: 0.3,
    SLOW: 0.5
  },
  EASING: {
    EASE: 'ease',
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out'
  }
}

// 字体配置
export const FONT_CONFIG = {
  FAMILIES: {
    DEFAULT: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    MONO: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
    SERIF: 'Georgia, "Times New Roman", serif'
  },
  SIZES: {
    XS: '12px',
    SM: '14px',
    BASE: '16px',
    LG: '18px',
    XL: '20px',
    XXL: '24px'
  }
}

// 阴影配置
export const SHADOW_CONFIG = {
  NONE: 'none',
  SMALL: '0 1px 3px rgba(0, 0, 0, 0.12)',
  MEDIUM: '0 4px 6px rgba(0, 0, 0, 0.1)',
  LARGE: '0 10px 25px rgba(0, 0, 0, 0.15)',
  XLARGE: '0 20px 40px rgba(0, 0, 0, 0.2)'
}

// 边框配置
export const BORDER_CONFIG = {
  RADIUS: {
    NONE: '0',
    SMALL: '2px',
    MEDIUM: '6px',
    LARGE: '8px',
    ROUND: '50%'
  },
  WIDTH: {
    NONE: '0',
    THIN: '1px',
    MEDIUM: '2px',
    THICK: '3px'
  }
}

// 间距配置
export const SPACING_CONFIG = {
  XS: '4px',
  SM: '8px',
  MD: '16px',
  LG: '24px',
  XL: '32px',
  XXL: '48px'
}

// 断点配置
export const BREAKPOINTS = {
  XS: '480px',
  SM: '576px',
  MD: '768px',
  LG: '992px',
  XL: '1200px',
  XXL: '1600px'
}

// Z-index层级配置
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  NOTIFICATION: 1080
}

// 默认主题配置
export const DEFAULT_THEME_CONFIG = {
  theme: 'default',
  customColors: {},
  layout: {
    sidebarPosition: LAYOUT_OPTIONS.SIDEBAR_POSITION.LEFT,
    contentWidth: LAYOUT_OPTIONS.CONTENT_WIDTH.FLUID,
    headerStyle: LAYOUT_OPTIONS.HEADER_STYLE.FIXED,
    navigationMode: LAYOUT_OPTIONS.NAVIGATION_MODE.SIDE
  },
  components: {
    size: COMPONENT_SIZES.MEDIUM,
    borderRadius: BORDER_CONFIG.RADIUS.MEDIUM,
    shadow: SHADOW_CONFIG.MEDIUM
  },
  animation: {
    duration: ANIMATION_CONFIG.DURATION.NORMAL,
    easing: ANIMATION_CONFIG.EASING.EASE_IN_OUT
  },
  font: {
    family: FONT_CONFIG.FAMILIES.DEFAULT,
    size: FONT_CONFIG.SIZES.BASE
  }
}

// 主题版本
export const THEME_VERSION = '1.0.0'

// 本地存储键名
export const STORAGE_KEYS = {
  THEME_CONFIG: 'theme-config',
  USER_PREFERENCES: 'user-theme-preferences',
  CUSTOM_THEMES: 'custom-themes'
}