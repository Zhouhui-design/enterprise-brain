/**
 * ========================================
 * 日期格式化工具模块 - 全局统一标准
 * ========================================
 * 
 * 🎯 核心原则:
 * 1. 数据库存储、后端查询、前端显示全程使用中国本地时区
 * 2. 统一使用 YYYY-MM-DD 格式（保留前导零）
 * 3. 禁止使用 UTC 时间或 ISO 字符串
 * 4. 禁止使用单数字月/日格式（如 2026/1/3）
 * 
 * 📌 使用场景:
 * - 前端显示日期
 * - 前端传递日期参数给后端
 * - 日期比较计算
 * - 企业日历查询
 * - 工序能力负荷表日期匹配
 * 
 * ⚠️ 禁止事项:
 * - 禁止使用 date.toISOString().split('T')[0] (会减8小时)
 * - 禁止使用 YYYY/M/D 格式（无前导零）
 * - 禁止混用不同日期格式
 * 
 * Created: 2025-12-14
 * Author: AI Assistant
 */

/**
 * 将任意日期输入格式化为标准格式 YYYY-MM-DD
 * 
 * @param {string|Date|number|null|undefined} input - 日期输入（字符串、Date对象、时间戳）
 * @returns {string} 格式化后的日期字符串 "YYYY-MM-DD"，无效输入返回空字符串
 * 
 * @example
 * formatDate('2026-01-03')         // "2026-01-03"
 * formatDate('2026/1/3')           // "2026-01-03" (修正无前导零)
 * formatDate(new Date())           // "2025-12-14"
 * formatDate(1702512000000)        // "2023-12-14"
 * formatDate(null)                 // ""
 */
export function formatDate(input) {
  if (!input) return '';
  
  let date;
  
  // 处理不同类型的输入
  if (input instanceof Date) {
    date = input;
  } else if (typeof input === 'string') {
    // ✅ 处理字符串输入
    // 替换 "/" 为 "-" 统一格式
    const normalized = input.replace(/\//g, '-');
    date = new Date(normalized);
  } else if (typeof input === 'number') {
    // 处理时间戳
    date = new Date(input);
  } else {
    console.warn(`[dateFormatter] 无法识别的日期格式:`, input);
    return '';
  }
  
  // 验证日期有效性
  if (isNaN(date.getTime())) {
    console.warn(`[dateFormatter] 无效的日期:`, input);
    return '';
  }
  
  // ✅ 使用本地时区格式化（保留前导零）
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 将日期字符串转换为 Date 对象（本地时区）
 * 
 * @param {string} dateStr - 日期字符串 "YYYY-MM-DD" 或 "YYYY/MM/DD"
 * @returns {Date|null} Date 对象，无效输入返回 null
 * 
 * @example
 * parseDate('2026-01-03')  // Date对象
 * parseDate('2026/1/3')    // Date对象
 * parseDate(null)          // null
 */
export function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // 替换 "/" 为 "-" 统一格式
  const normalized = dateStr.replace(/\//g, '-');
  const date = new Date(normalized);
  
  if (isNaN(date.getTime())) {
    console.warn(`[dateFormatter] 无法解析日期:`, dateStr);
    return null;
  }
  
  return date;
}

/**
 * 比较两个日期（忽略时间部分）
 * 
 * @param {string|Date} date1 - 第一个日期
 * @param {string|Date} date2 - 第二个日期
 * @returns {number} -1(date1<date2), 0(相等), 1(date1>date2)
 * 
 * @example
 * compareDates('2026-01-03', '2026-01-04')  // -1
 * compareDates('2026-01-03', '2026-01-03')  // 0
 * compareDates('2026-01-04', '2026-01-03')  // 1
 */
export function compareDates(date1, date2) {
  const str1 = formatDate(date1);
  const str2 = formatDate(date2);
  
  if (!str1 || !str2) {
    console.warn(`[dateFormatter] 无效的日期比较:`, date1, date2);
    return 0;
  }
  
  if (str1 < str2) return -1;
  if (str1 > str2) return 1;
  return 0;
}

/**
 * 计算日期差（天数）
 * 
 * @param {string|Date} startDate - 开始日期
 * @param {string|Date} endDate - 结束日期
 * @returns {number} 天数差（endDate - startDate）
 * 
 * @example
 * dateDiff('2026-01-03', '2026-01-10')  // 7
 * dateDiff('2026-01-10', '2026-01-03')  // -7
 */
export function dateDiff(startDate, endDate) {
  const start = parseDate(formatDate(startDate));
  const end = parseDate(formatDate(endDate));
  
  if (!start || !end) {
    console.warn(`[dateFormatter] 无法计算日期差:`, startDate, endDate);
    return 0;
  }
  
  const diffTime = end.getTime() - start.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 日期加减天数
 * 
 * @param {string|Date} date - 原始日期
 * @param {number} days - 增加的天数（负数表示减少）
 * @returns {string} 新日期字符串 "YYYY-MM-DD"
 * 
 * @example
 * addDays('2026-01-03', 7)   // "2026-01-10"
 * addDays('2026-01-10', -7)  // "2026-01-03"
 */
export function addDays(date, days) {
  const dateObj = parseDate(formatDate(date));
  
  if (!dateObj) {
    console.warn(`[dateFormatter] 无法计算日期:`, date);
    return '';
  }
  
  dateObj.setDate(dateObj.getDate() + days);
  return formatDate(dateObj);
}

/**
 * 获取当前日期（本地时区）
 * 
 * @returns {string} 今日日期字符串 "YYYY-MM-DD"
 * 
 * @example
 * getToday()  // "2025-12-14"
 */
export function getToday() {
  return formatDate(new Date());
}

/**
 * 判断是否为有效日期
 * 
 * @param {string|Date} date - 待验证的日期
 * @returns {boolean} true=有效, false=无效
 * 
 * @example
 * isValidDate('2026-01-03')   // true
 * isValidDate('2026/1/3')     // true
 * isValidDate('invalid')      // false
 * isValidDate(null)           // false
 */
export function isValidDate(date) {
  return formatDate(date) !== '';
}

/**
 * 验证日期字符串格式是否标准
 * 
 * @param {string} dateStr - 日期字符串
 * @returns {boolean} true=符合YYYY-MM-DD格式, false=不符合
 * 
 * @example
 * isStandardFormat('2026-01-03')  // true
 * isStandardFormat('2026/1/3')    // false (不符合标准)
 * isStandardFormat('2026-1-3')    // false (缺少前导零)
 */
export function isStandardFormat(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  
  // 严格匹配 YYYY-MM-DD 格式
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(dateStr);
}

/**
 * 修正非标准日期格式
 * 
 * @param {string} dateStr - 可能非标准的日期字符串
 * @returns {string} 标准格式日期字符串 "YYYY-MM-DD"
 * 
 * @example
 * normalizeDate('2026/1/3')     // "2026-01-03"
 * normalizeDate('2026-1-3')     // "2026-01-03"
 * normalizeDate('2026-01-03')   // "2026-01-03"
 */
export function normalizeDate(dateStr) {
  return formatDate(dateStr);
}

/**
 * 批量格式化日期数组
 * 
 * @param {Array<string|Date>} dates - 日期数组
 * @returns {Array<string>} 格式化后的日期字符串数组
 * 
 * @example
 * batchFormatDates(['2026/1/3', '2026-01-04'])  // ["2026-01-03", "2026-01-04"]
 */
export function batchFormatDates(dates) {
  if (!Array.isArray(dates)) {
    console.warn(`[dateFormatter] batchFormatDates 需要数组输入`);
    return [];
  }
  
  return dates.map(date => formatDate(date)).filter(d => d !== '');
}

/**
 * 从Date对象获取本地日期字符串（避免时区问题）
 * 
 * @param {Date} date - Date对象
 * @returns {string} 本地日期字符串 "YYYY-MM-DD"
 * 
 * @example
 * const now = new Date();
 * getLocalDateString(now)  // "2025-12-14"
 */
export function getLocalDateString(date) {
  if (!(date instanceof Date)) {
    console.warn(`[dateFormatter] getLocalDateString 需要Date对象`);
    return '';
  }
  
  return formatDate(date);
}

/**
 * 导出所有函数作为默认对象
 */
export default {
  formatDate,
  parseDate,
  compareDates,
  dateDiff,
  addDays,
  getToday,
  isValidDate,
  isStandardFormat,
  normalizeDate,
  batchFormatDates,
  getLocalDateString
};
