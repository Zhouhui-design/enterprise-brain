/**
 * 日期时间工具类
 * 提供日期格式化、计算、解析等功能
 */
class DateUtils {
  constructor() {
    this.weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    this.months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    this.shortMonths = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  }

  /**
   * 格式化日期时间
   * @param {Date|string|number} date - 日期对象、时间戳或日期字符串
   * @param {string} format - 格式化模板
   * @returns {string} 格式化后的日期字符串
   */
  format(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = this.parse(date);
    if (!d || isNaN(d.getTime())) {
      return '';
    }

    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const seconds = d.getSeconds();
    const weekday = d.getDay();

    return format
      .replace('YYYY', year)
      .replace('YY', String(year).slice(-2))
      .replace('MMMM', this.months[month - 1])
      .replace('MMM', this.shortMonths[month - 1])
      .replace('MM', String(month).padStart(2, '0'))
      .replace('M', month)
      .replace('DD', String(day).padStart(2, '0'))
      .replace('D', day)
      .replace('HH', String(hours).padStart(2, '0'))
      .replace('H', hours)
      .replace('hh', String(hours % 12 || 12).padStart(2, '0'))
      .replace('h', hours % 12 || 12)
      .replace('mm', String(minutes).padStart(2, '0'))
      .replace('m', minutes)
      .replace('ss', String(seconds).padStart(2, '0'))
      .replace('s', seconds)
      .replace('A', hours >= 12 ? 'PM' : 'AM')
      .replace('a', hours >= 12 ? 'pm' : 'am')
      .replace('WW', this.weekdays[weekday])
      .replace('W', this.weekdays[weekday].slice(2));
  }

  /**
   * 解析日期
   * @param {string|number|Date} value - 日期值
   * @returns {Date|null} 日期对象
   */
  parse(value) {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'number') {
      return new Date(value);
    }

    if (typeof value === 'string') {
      // 处理常见的日期字符串格式
      const normalized = value.trim();
      if (!normalized) {
        return null;
      }

      // 尝试解析各种格式
      const date = new Date(normalized);
      if (!isNaN(date.getTime())) {
        return date;
      }

      // 尝试解析 YYYY-MM-DD 格式
      const ymdMatch = normalized.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
      if (ymdMatch) {
        const [, year, month, day] = ymdMatch;
        return new Date(year, month - 1, day);
      }

      // 尝试解析 YYYY-MM-DD HH:mm:ss 格式
      const datetimeMatch = normalized.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
      if (datetimeMatch) {
        const [, year, month, day, hour, minute, second = 0] = datetimeMatch;
        return new Date(year, month - 1, day, hour, minute, second);
      }
    }

    return null;
  }

  /**
   * 获取当前日期时间
   * @returns {Date} 当前日期对象
   */
  now() {
    return new Date();
  }

  /**
   * 获取当前时间戳
   * @returns {number} 时间戳（毫秒）
   */
  timestamp() {
    return Date.now();
  }

  /**
   * 计算两个日期之间的差值
   * @param {Date|string|number} date1 - 第一个日期
   * @param {Date|string|number} date2 - 第二个日期
   * @param {string} unit - 单位：'days', 'hours', 'minutes', 'seconds', 'milliseconds'
   * @returns {number} 差值
   */
  diff(date1, date2, unit = 'days') {
    const d1 = this.parse(date1);
    const d2 = this.parse(date2);

    if (!d1 || !d2 || isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return 0;
    }

    const diffMs = Math.abs(d2.getTime() - d1.getTime());

    switch (unit) {
      case 'milliseconds':
        return diffMs;
      case 'seconds':
        return Math.floor(diffMs / 1000);
      case 'minutes':
        return Math.floor(diffMs / (1000 * 60));
      case 'hours':
        return Math.floor(diffMs / (1000 * 60 * 60));
      case 'days':
      default:
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
  }

  /**
   * 给日期增加时间
   * @param {Date|string|number} date - 基础日期
   * @param {number} value - 增加的值
   * @param {string} unit - 单位：'days', 'hours', 'minutes', 'seconds', 'months', 'years'
   * @returns {Date} 新日期对象
   */
  add(date, value, unit = 'days') {
    const d = this.parse(date);
    if (!d || isNaN(d.getTime())) {
      return null;
    }

    const result = new Date(d);

    switch (unit) {
      case 'years':
        result.setFullYear(result.getFullYear() + value);
        break;
      case 'months':
        result.setMonth(result.getMonth() + value);
        break;
      case 'days':
        result.setDate(result.getDate() + value);
        break;
      case 'hours':
        result.setHours(result.getHours() + value);
        break;
      case 'minutes':
        result.setMinutes(result.getMinutes() + value);
        break;
      case 'seconds':
        result.setSeconds(result.getSeconds() + value);
        break;
      default:
        break;
    }

    return result;
  }

  /**
   * 给日期减少时间
   * @param {Date|string|number} date - 基础日期
   * @param {number} value - 减少的值
   * @param {string} unit - 单位：'days', 'hours', 'minutes', 'seconds', 'months', 'years'
   * @returns {Date} 新日期对象
   */
  subtract(date, value, unit = 'days') {
    return this.add(date, -value, unit);
  }

  /**
   * 获取指定日期所在月份的第一天
   * @param {Date|string|number} date - 日期
   * @returns {Date} 第一天日期
   */
  getMonthStart(date) {
    const d = this.parse(date);
    if (!d || isNaN(d.getTime())) {
      return null;
    }
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  /**
   * 获取指定日期所在月份的最后一天
   * @param {Date|string|number} date - 日期
   * @returns {Date} 最后一天日期
   */
  getMonthEnd(date) {
    const d = this.parse(date);
    if (!d || isNaN(d.getTime())) {
      return null;
    }
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  }

  /**
   * 获取指定日期所在周的第一天（默认周一）
   * @param {Date|string|number} date - 日期
   * @param {number} firstDayOfWeek - 一周的第一天（0=周日，1=周一）
   * @returns {Date} 第一天日期
   */
  getWeekStart(date, firstDayOfWeek = 1) {
    const d = this.parse(date);
    if (!d || isNaN(d.getTime())) {
      return null;
    }

    const result = new Date(d);
    const day = result.getDay();
    const diff = (day < firstDayOfWeek ? day + 7 : day) - firstDayOfWeek;
    
    result.setDate(result.getDate() - diff);
    result.setHours(0, 0, 0, 0);
    
    return result;
  }

  /**
   * 获取指定日期所在周的最后一天（默认周日）
   * @param {Date|string|number} date - 日期
   * @param {number} firstDayOfWeek - 一周的第一天（0=周日，1=周一）
   * @returns {Date} 最后一天日期
   */
  getWeekEnd(date, firstDayOfWeek = 1) {
    const start = this.getWeekStart(date, firstDayOfWeek);
    if (!start) {
      return null;
    }
    
    const result = new Date(start);
    result.setDate(result.getDate() + 6);
    result.setHours(23, 59, 59, 999);
    
    return result;
  }

  /**
   * 判断是否是闰年
   * @param {Date|string|number} date - 日期
   * @returns {boolean} 是否是闰年
   */
  isLeapYear(date) {
    const d = this.parse(date);
    if (!d || isNaN(d.getTime())) {
      return false;
    }

    const year = d.getFullYear();
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  /**
   * 获取月份天数
   * @param {Date|string|number} date - 日期
   * @returns {number} 天数
   */
  getDaysInMonth(date) {
    const d = this.parse(date);
    if (!d || isNaN(d.getTime())) {
      return 0;
    }
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  }

  /**
   * 判断两个日期是否是同一天
   * @param {Date|string|number} date1 - 第一个日期
   * @param {Date|string|number} date2 - 第二个日期
   * @returns {boolean} 是否是同一天
   */
  isSameDay(date1, date2) {
    const d1 = this.parse(date1);
    const d2 = this.parse(date2);

    if (!d1 || !d2 || isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return false;
    }

    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  /**
   * 判断日期是否在指定范围内
   * @param {Date|string|number} date - 要检查的日期
   * @param {Date|string|number} startDate - 开始日期
   * @param {Date|string|number} endDate - 结束日期
   * @returns {boolean} 是否在范围内
   */
  isInRange(date, startDate, endDate) {
    const d = this.parse(date);
    const start = this.parse(startDate);
    const end = this.parse(endDate);

    if (!d || !start || !end || isNaN(d.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }

    return d >= start && d <= end;
  }

  /**
   * 获取相对时间描述
   * @param {Date|string|number} date - 日期
   * @returns {string} 相对时间描述
   */
  getRelativeTime(date) {
    const d = this.parse(date);
    if (!d || isNaN(d.getTime())) {
      return '';
    }

    const now = new Date();
    const diffMs = now - d;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return '刚刚';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}周前`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months}个月前`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years}年前`;
    }
  }

  /**
   * 获取友好的日期时间描述
   * @param {Date|string|number} date - 日期
   * @returns {string} 友好描述
   */
  getFriendlyDate(date) {
    const d = this.parse(date);
    if (!d || isNaN(d.getTime())) {
      return '';
    }

    const now = new Date();
    const isToday = this.isSameDay(d, now);
    const isYesterday = this.isSameDay(d, this.subtract(now, 1, 'days'));
    const isTomorrow = this.isSameDay(d, this.add(now, 1, 'days'));

    if (isToday) {
      return `今天 ${this.format(d, 'HH:mm')}`;
    } else if (isYesterday) {
      return `昨天 ${this.format(d, 'HH:mm')}`;
    } else if (isTomorrow) {
      return `明天 ${this.format(d, 'HH:mm')}`;
    } else if (d.getFullYear() === now.getFullYear()) {
      return this.format(d, 'MM月DD日 HH:mm');
    } else {
      return this.format(d, 'YYYY年MM月DD日 HH:mm');
    }
  }

  /**
   * 生成日期范围数组
   * @param {Date|string|number} startDate - 开始日期
   * @param {Date|string|number} endDate - 结束日期
   * @param {string} interval - 间隔：'day', 'week', 'month'
   * @returns {Array} 日期数组
   */
  generateDateRange(startDate, endDate, interval = 'day') {
    const start = this.parse(startDate);
    const end = this.parse(endDate);
    const result = [];

    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return result;
    }

    const current = new Date(start);

    while (current <= end) {
      result.push(new Date(current));
      
      switch (interval) {
        case 'week':
          this.add(current, 7, 'days');
          break;
        case 'month':
          this.add(current, 1, 'months');
          break;
        case 'day':
        default:
          this.add(current, 1, 'days');
          break;
      }
    }

    return result;
  }

  /**
   * 检查日期是否有效
   * @param {*} date - 要检查的值
   * @returns {boolean} 是否有效
   */
  isValid(date) {
    const d = this.parse(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  /**
   * 获取时区偏移（分钟）
   * @param {Date|string|number} date - 日期
   * @returns {number} 时区偏移
   */
  getTimezoneOffset(date) {
    const d = this.parse(date) || new Date();
    return d.getTimezoneOffset();
  }

  /**
   * 获取Unix时间戳（秒）
   * @param {Date|string|number} date - 日期
   * @returns {number} Unix时间戳
   */
  getUnixTimestamp(date) {
    const d = this.parse(date) || new Date();
    return Math.floor(d.getTime() / 1000);
  }
}

// 导出单例实例
const dateUtils = new DateUtils();
export default dateUtils;
export { DateUtils };