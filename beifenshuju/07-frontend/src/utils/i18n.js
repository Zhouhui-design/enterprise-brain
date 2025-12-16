/**
 * 国际化配置和工具
 * 
 * 提供完整的多语言支持，包括：
 * - 动态语言切换
 * - 命名空间支持
 * - 语言回退机制
 * - 数字、日期、货币格式化
 * - 复数形式处理
 * - RTL语言支持
 * 
 * @author AI Assistant
 * @since 2024-01-01
 */

import { ref, reactive, computed, watch } from 'vue'

// 导入语言包
import zhCN from '../locales/zh-CN.json'
import enUS from '../locales/en-US.json'

// 语言包映射
const locales = {
  'zh-CN': {
    name: '简体中文',
    nativeName: '简体中文',
    code: 'zh-CN',
    rtl: false,
    locale: zhCN,
    momentLocale: 'zh-cn'
  },
  'en-US': {
    name: 'English',
    nativeName: 'English', 
    code: 'en-US',
    rtl: false,
    locale: enUS,
    momentLocale: 'en-us'
  }
}

/**
 * 国际化管理类
 */
export class I18nManager {
  constructor() {
    // 当前语言
    this.currentLocale = ref('zh-CN')
    
    // 可用语言列表
    this.availableLocales = Object.keys(locales)
    
    // 默认语言
    this.defaultLocale = 'zh-CN'
    
    // 语言回退链
    this.fallbackChain = ['zh-CN', 'en-US']
    
    // 命名空间缓存
    this.namespaceCache = new Map()
    
    // 格式化器
    this.formatters = new Map()
    
    // 初始化
    this.initialize()
  }

  /**
   * 初始化国际化
   */
  initialize() {
    // 从localStorage读取用户语言偏好
    const savedLocale = this.getSavedLocale()
    const browserLocale = this.getBrowserLocale()
    
    // 设置当前语言
    this.setLocale(savedLocale || browserLocale || this.defaultLocale)
    
    // 初始化格式化器
    this.initializeFormatters()
  }

  /**
   * 设置语言
   */
  setLocale(localeCode) {
    if (!locales[localeCode]) {
      console.warn(`Unsupported locale: ${localeCode}`)
      localeCode = this.defaultLocale
    }

    this.currentLocale.value = localeCode
    
    // 保存到localStorage
    this.saveLocale(localeCode)
    
    // 更新HTML lang属性
    document.documentElement.lang = localeCode
    
    // 更新RTL属性
    document.documentElement.dir = locales[localeCode].rtl ? 'rtl' : 'ltr'
    
    // 清理缓存
    this.namespaceCache.clear()
    this.formatters.clear()
    
    // 初始化新的格式化器
    this.initializeFormatters()
  }

  /**
   * 获取当前语言
   */
  getCurrentLocale() {
    return this.currentLocale.value
  }

  /**
   * 获取当前语言信息
   */
  getCurrentLocaleInfo() {
    return locales[this.currentLocale.value]
  }

  /**
   * 翻译文本
   */
  t(key, params = {}, namespace = null) {
    // 如果指定了命名空间，构建完整键名
    const fullKey = namespace ? `${namespace}.${key}` : key
    
    // 尝试从当前语言获取翻译
    let translation = this.getTranslation(fullKey, this.currentLocale.value)
    
    // 如果找不到，尝试回退语言
    if (!translation && this.fallbackChain.length > 1) {
      for (const fallbackLocale of this.fallbackChain) {
        if (fallbackLocale !== this.currentLocale.value) {
          translation = this.getTranslation(fullKey, fallbackLocale)
          if (translation) break
        }
      }
    }
    
    // 如果仍然找不到，返回键名
    if (!translation) {
      console.warn(`Translation not found: ${fullKey}`)
      return fullKey
    }
    
    // 参数替换
    return this.interpolate(translation, params)
  }

  /**
   * 获取翻译文本（不使用参数插值）
   */
  te(key, namespace = null) {
    const fullKey = namespace ? `${namespace}.${key}` : key
    
    // 尝试从当前语言获取翻译
    let translation = this.getTranslation(fullKey, this.currentLocale.value)
    
    // 回退逻辑
    if (!translation && this.fallbackChain.length > 1) {
      for (const fallbackLocale of this.fallbackChain) {
        if (fallbackLocale !== this.currentLocale.value) {
          translation = this.getTranslation(fullKey, fallbackLocale)
          if (translation) break
        }
      }
    }
    
    return translation || fullKey
  }

  /**
   * 从语言包获取翻译
   */
  getTranslation(key, locale) {
    const localeData = locales[locale]?.locale
    if (!localeData) {
      return null
    }
    
    return this.getNestedValue(localeData, key)
  }

  /**
   * 获取嵌套对象的值
   */
  getNestedValue(obj, path) {
    // 检查缓存
    const cacheKey = `${path}_${JSON.stringify(obj)}`
    if (this.namespaceCache.has(cacheKey)) {
      return this.namespaceCache.get(cacheKey)
    }
    
    const keys = path.split('.')
    let value = obj
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        value = undefined
        break
      }
    }
    
    // 缓存结果
    if (value !== undefined) {
      this.namespaceCache.set(cacheKey, value)
    }
    
    return value
  }

  /**
   * 参数插值
   */
  interpolate(template, params) {
    if (!params || typeof params !== 'object') {
      return template
    }
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match
    })
  }

  /**
   * 数字格式化
   */
  n(number, options = {}) {
    const {
      style = 'decimal',
      minimumFractionDigits = 0,
      maximumFractionDigits = 2,
      currency = 'CNY'
    } = options

    const formatter = this.getFormatter('number', style)
    
    return formatter.format(number, {
      minimumFractionDigits,
      maximumFractionDigits,
      currency
    })
  }

  /**
   * 日期格式化
   */
  d(date, options = {}) {
    const {
      style = 'long',
      format = null
    } = options

    const formatter = this.getFormatter('date', style)
    
    if (format) {
      return formatter.formatWithPattern(date, format)
    }
    
    return formatter.format(date)
  }

  /**
   * 货币格式化
   */
  currency(amount, currency = 'CNY') {
    const formatter = this.getFormatter('currency', currency)
    return formatter.format(amount)
  }

  /**
   * 复数形式处理
   */
  plural(count, singular, plural, params = {}) {
    const rule = this.getPluralRule(count)
    const key = rule === 1 ? singular : plural
    
    return this.t(key, { count, ...params })
  }

  /**
   * 获取复数规则
   */
  getPluralRule(count) {
    const localeInfo = this.getCurrentLocaleInfo()
    
    // 简化的复数规则（可以扩展支持更复杂的规则）
    switch (localeInfo.code) {
      case 'zh-CN':
      case 'zh-TW':
        return 0 // 中文没有复数形式
      case 'en-US':
      case 'en-GB':
        return count === 1 ? 1 : 2
      default:
        return count === 1 ? 1 : 2
    }
  }

  /**
   * 获取格式化器
   */
  getFormatter(type, style) {
    const cacheKey = `${type}_${style}`
    
    if (this.formatters.has(cacheKey)) {
      return this.formatters.get(cacheKey)
    }

    const formatter = this.createFormatter(type, style)
    this.formatters.set(cacheKey, formatter)
    
    return formatter
  }

  /**
   * 创建格式化器
   */
  createFormatter(type, style) {
    const localeInfo = this.getCurrentLocaleInfo()
    
    switch (type) {
      case 'number':
        return new NumberFormatter(localeInfo.code, style)
      case 'date':
        return new DateFormatter(localeInfo.code, localeInfo.momentLocale, style)
      case 'currency':
        return new CurrencyFormatter(localeInfo.code, style)
      default:
        return new BasicFormatter(localeInfo.code)
    }
  }

  /**
   * 初始化格式化器
   */
  initializeFormatters() {
    // 预创建常用格式化器
    this.getFormatter('number', 'decimal')
    this.getFormatter('date', 'long')
    this.getFormatter('currency', 'CNY')
  }

  /**
   * 获取保存的语言偏好
   */
  getSavedLocale() {
    try {
      return localStorage.getItem('user-locale') || localStorage.getItem('locale')
    } catch (error) {
      console.warn('Failed to get saved locale:', error)
      return null
    }
  }

  /**
   * 保存语言偏好
   */
  saveLocale(locale) {
    try {
      localStorage.setItem('user-locale', locale)
    } catch (error) {
      console.warn('Failed to save locale:', error)
    }
  }

  /**
   * 获取浏览器语言
   */
  getBrowserLocale() {
    // 从navigator.language获取
    const browserLang = navigator.language || navigator.userLanguage
    
    // 尝试匹配支持的语言
    for (const supportedLocale of this.availableLocales) {
      if (browserLang.startsWith(supportedLocale)) {
        return supportedLocale
      }
    }
    
    // 尝试匹配主要语言代码
    const primaryLang = browserLang.split('-')[0]
    for (const supportedLocale of this.availableLocales) {
      if (supportedLocale.startsWith(primaryLang)) {
        return supportedLocale
      }
    }
    
    return this.defaultLocale
  }

  /**
   * 获取可用语言列表
   */
  getAvailableLocales() {
    return this.availableLocales.map(code => locales[code])
  }

  /**
   * 检查是否为RTL语言
   */
  isRTL() {
    const localeInfo = this.getCurrentLocaleInfo()
    return localeInfo.rtl
  }

  /**
   * 切换到下一个语言
   */
  nextLocale() {
    const currentIndex = this.availableLocales.indexOf(this.currentLocale.value)
    const nextIndex = (currentIndex + 1) % this.availableLocales.length
    this.setLocale(this.availableLocales[nextIndex])
  }

  /**
   * 切换到上一个语言
   */
  previousLocale() {
    const currentIndex = this.availableLocales.indexOf(this.currentLocale.value)
    const prevIndex = currentIndex === 0 ? 
      this.availableLocales.length - 1 : currentIndex - 1
    this.setLocale(this.availableLocales[prevIndex])
  }

  /**
   * 添加语言包
   */
  addLocale(localeCode, localeData) {
    locales[localeCode] = localeData
    this.availableLocales.push(localeCode)
    
    // 清理缓存
    this.namespaceCache.clear()
    this.formatters.clear()
  }

  /**
   * 移除语言包
   */
  removeLocale(localeCode) {
    if (locales[localeCode]) {
      delete locales[localeCode]
      const index = this.availableLocales.indexOf(localeCode)
      if (index !== -1) {
        this.availableLocales.splice(index, 1)
      }
      
      // 如果当前语言被移除，切换到默认语言
      if (this.currentLocale.value === localeCode) {
        this.setLocale(this.defaultLocale)
      }
      
      // 清理缓存
      this.namespaceCache.clear()
      this.formatters.clear()
    }
  }

  /**
   * 批量翻译
   */
  tBatch(keys, params = {}, namespace = null) {
    const result = {}
    
    for (const key of keys) {
      result[key] = this.t(key, params, namespace)
    }
    
    return result
  }

  /**
   * 创建翻译函数
   */
  createTranslator(namespace) {
    return (key, params = {}) => {
      return this.t(key, params, namespace)
    }
  }

  /**
   * 监听语言变化
   */
  watchLocale(callback) {
    const unwatch = watch(this.currentLocale, (newLocale) => {
      callback(newLocale, this.getCurrentLocaleInfo())
    })
    
    return unwatch
  }
}

// 格式化器基类
class BasicFormatter {
  constructor(locale) {
    this.locale = locale
  }

  format(value) {
    return value
  }
}

// 数字格式化器
class NumberFormatter extends BasicFormatter {
  constructor(locale, style = 'decimal') {
    super(locale)
    this.style = style
  }

  format(number, options = {}) {
    if (typeof number !== 'number') {
      return number
    }

    const {
      minimumFractionDigits = 0,
      maximumFractionDigits = 2,
      currency = 'CNY'
    } = options

    try {
      return new Intl.NumberFormat(this.locale, {
        style: this.style,
        minimumFractionDigits,
        maximumFractionDigits,
        currency: this.style === 'currency' ? currency : undefined
      }).format(number)
    } catch (error) {
      console.warn('Number formatting error:', error)
      return number.toString()
    }
  }
}

// 日期格式化器
class DateFormatter extends BasicFormatter {
  constructor(locale, momentLocale, style = 'long') {
    super(locale)
    this.momentLocale = momentLocale
    this.style = style
  }

  format(date, format = null) {
    if (!date) {
      return ''
    }

    try {
      const dateObj = new Date(date)
      
      if (format) {
        return this.formatWithPattern(dateObj, format)
      }

      const options = this.getDateOptions(this.style)
      return new Intl.DateTimeFormat(this.locale, options).format(dateObj)
    } catch (error) {
      console.warn('Date formatting error:', error)
      return date.toString()
    }
  }

  formatWithPattern(date, format) {
    // 简单的日期格式化（项目中可以集成moment.js等库）
    const patterns = {
      'YYYY': date.getFullYear(),
      'MM': String(date.getMonth() + 1).padStart(2, '0'),
      'DD': String(date.getDate()).padStart(2, '0'),
      'HH': String(date.getHours()).padStart(2, '0'),
      'mm': String(date.getMinutes()).padStart(2, '0'),
      'ss': String(date.getSeconds()).padStart(2, '0')
    }

    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => patterns[match])
  }

  getDateOptions(style) {
    const options = {
      short: { year: 'numeric', month: 'short', day: 'numeric' },
      medium: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    }

    return options[style] || options.medium
  }
}

// 货币格式化器
class CurrencyFormatter extends BasicFormatter {
  constructor(locale, currency = 'CNY') {
    super(locale)
    this.currency = currency
  }

  format(amount) {
    if (typeof amount !== 'number') {
      return amount
    }

    try {
      return new Intl.NumberFormat(this.locale, {
        style: 'currency',
        currency: this.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    } catch (error) {
      console.warn('Currency formatting error:', error)
      return `${this.currency} ${amount.toFixed(2)}`
    }
  }
}

// 创建全局实例
const globalI18n = new I18nManager()

/**
 * 获取国际化实例
 */
export function getI18n() {
  return globalI18n
}

/**
 * 翻译函数（全局可用）
 */
export const t = (key, params, namespace) => {
  return globalI18n.t(key, params, namespace)
}

/**
 * 国际化组合式函数
 */
export function useI18n() {
  const currentLocale = computed(() => globalI18n.getCurrentLocale())
  const currentLocaleInfo = computed(() => globalI18n.getCurrentLocaleInfo())
  const isRTL = computed(() => globalI18n.isRTL())
  
  const setLocale = (locale) => {
    globalI18n.setLocale(locale)
  }
  
  const t = (key, params, namespace) => {
    return globalI18n.t(key, params, namespace)
  }
  
  const te = (key, namespace) => {
    return globalI18n.te(key, namespace)
  }
  
  const n = (number, options) => {
    return globalI18n.n(number, options)
  }
  
  const d = (date, options) => {
    return globalI18n.d(date, options)
  }
  
  const currency = (amount, currency) => {
    return globalI18n.currency(amount, currency)
  }
  
  const plural = (count, singular, plural, params) => {
    return globalI18n.plural(count, singular, plural, params)
  }
  
  const nextLocale = () => {
    globalI18n.nextLocale()
  }
  
  const previousLocale = () => {
    globalI18n.previousLocale()
  }
  
  const createTranslator = (namespace) => {
    return globalI18n.createTranslator(namespace)
  }
  
  const availableLocales = computed(() => globalI18n.getAvailableLocales())
  
  return {
    currentLocale,
    currentLocaleInfo,
    isRTL,
    availableLocales,
    t,
    te,
    n,
    d,
    currency,
    plural,
    setLocale,
    nextLocale,
    previousLocale,
    createTranslator
  }
}

export default globalI18n