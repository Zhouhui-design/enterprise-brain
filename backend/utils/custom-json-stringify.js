/**
 * 自定义JSON.stringify函数
 * 解决Node.js v24.12.0中JSON.stringify缺少逗号的bug
 */

function customJsonStringify(value) {
  // 处理基本类型
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    // 转义字符串中的特殊字符
    return (
      '"' +
      value.replace(/[\\"\b\f\n\r\t]/g, function (c) {
        switch (c) {
          case '\\':
            return '\\\\';
          case '"':
            return '\\"';
          case '\b':
            return '\\b';
          case '\f':
            return '\\f';
          case '\n':
            return '\\n';
          case '\r':
            return '\\r';
          case '\t':
            return '\\t';
          default:
            return c;
        }
      }) +
      '"'
    );
  }

  if (typeof value === 'number') {
    // 处理NaN和Infinity
    return isNaN(value) || !isFinite(value) ? 'null' : value.toString();
  }

  if (typeof value === 'boolean') {
    return value.toString();
  }

  if (value instanceof Date) {
    return customJsonStringify(value.toISOString());
  }

  // 处理数组
  if (Array.isArray(value)) {
    const elements = value.map(item => customJsonStringify(item));
    return '[' + elements.join(',') + ']';
  }

  // 处理对象
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    const properties = keys.map(key => {
      return customJsonStringify(key) + ':' + customJsonStringify(value[key]);
    });
    return '{' + properties.join(',') + '}';
  }

  // 处理其他类型（如函数、undefined等）
  return 'null';
}

module.exports = customJsonStringify;
