/**
 * ========================================
 * 后端日期格式化工具模块 - 全局统一标准
 * ========================================
 * 
 * 🎯 核心原则:
 * 1. 数据库存储、后端查询、API传递全程使用中国本地时区
 * 2. 统一使用 YYYY-MM-DD 格式（保留前导零）
 * 3. 禁止使用 UTC 时间或 ISO 字符串
 * 4. 禁止使用单数字月/日格式（如 2026/1/3）
 * 
 * 📌 使用场景:
 * - 格式化数据库返回的日期
 * - 格式化API接收的日期参数
 * - 日期比较计算
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
 * 将任意日期输入格式化为标准格式 YYYY-MM-DD (本地时区)
 * 
 * @param {string|Date|number|null|undefined} input - 日期输入
 * @returns {string|null} 格式化后的日期字符串 "YYYY-MM-DD"，无效输入返回 null
 * 
 * @example
 * formatLocalDate('2026-01-03')         // "2026-01-03"
 * formatLocalDate('2026/1/3')           // "2026-01-03"
 * formatLocalDate(new Date())           // "2025-12-14"
 * formatLocalDate(null)                 // null
 */
function formatLocalDate(input) {
  if (!input) return null;
  
  let date;
  
  // 处理不同类型的输入
  if (input instanceof Date) {
    date = input;
  } else if (typeof input === 'string') {
    // 如果已经是 YYYY-MM-DD 格式，直接返回
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
    // 替换 "/" 为 "-" 统一格式
    const normalized = input.replace(/\//g, '-').split('T')[0].split(' ')[0];
    date = new Date(normalized);
  } else if (typeof input === 'number') {
    // 处理时间戳
    date = new Date(input);
  } else {
    console.warn(`[dateFormatter] 无法识别的日期格式:`, input);
    return null;
  }
  
  // 验证日期有效性
  if (isNaN(date.getTime())) {
    console.warn(`[dateFormatter] 无效的日期:`, input);
    return null;
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
 */
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  
  const formatted = formatLocalDate(dateStr);
  if (!formatted) return null;
  
  return new Date(formatted);
}

/**
 * 日期加减天数
 * 
 * @param {string|Date} date - 原始日期
 * @param {number} days - 增加的天数（负数表示减少）
 * @returns {string|null} 新日期字符串 "YYYY-MM-DD"
 * 
 * @example
 * addDays('2026-01-03', 7)   // "2026-01-10"
 * addDays('2026-01-10', -7)  // "2026-01-03"
 */
function addDays(date, days) {
  const formatted = formatLocalDate(date);
  if (!formatted) return null;
  
  const dateObj = new Date(formatted);
  dateObj.setDate(dateObj.getDate() + days);
  
  return formatLocalDate(dateObj);
}

/**
 * 获取当前日期（本地时区）
 * 
 * @returns {string} 今日日期字符串 "YYYY-MM-DD"
 */
function getToday() {
  return formatLocalDate(new Date());
}

/**
 * 判断是否为有效日期
 * 
 * @param {string|Date} date - 待验证的日期
 * @returns {boolean} true=有效, false=无效
 */
function isValidDate(date) {
  return formatLocalDate(date) !== null;
}

/**
 * 比较两个日期（忽略时间部分）
 * 
 * @param {string|Date} date1 - 第一个日期
 * @param {string|Date} date2 - 第二个日期
 * @returns {number} -1(date1<date2), 0(相等), 1(date1>date2), null(无效)
 */
function compareDates(date1, date2) {
  const str1 = formatLocalDate(date1);
  const str2 = formatLocalDate(date2);
  
  if (!str1 || !str2) {
    console.warn(`[dateFormatter] 无效的日期比较:`, date1, date2);
    return null;
  }
  
  if (str1 < str2) return -1;
  if (str1 > str2) return 1;
  return 0;
}

module.exports = {
  formatLocalDate,
  parseLocalDate,
  addDays,
  getToday,
  isValidDate,
  compareDates
};
