/**
 * 数据转换工具
 * 提供各类数据格式转换、结构变换和数据处理功能
 */
class DataTransformer {
  /**
   * 深拷贝对象
   * @param {any} obj - 要拷贝的对象
   * @returns {any} 拷贝后的新对象
   */
  deepClone(obj) {
    // 处理基本类型和null
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // 处理日期对象
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    // 处理正则表达式
    if (obj instanceof RegExp) {
      return new RegExp(obj.source, obj.flags);
    }

    // 处理数组
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item));
    }

    // 处理普通对象
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }

  /**
   * 将数组转换为对象（键值映射）
   * @param {Array} array - 源数组
   * @param {string} keyField - 作为键的字段名
   * @param {string} valueField - 作为值的字段名（可选，不提供则使用整个对象）
   * @returns {Object} 转换后的对象
   */
  arrayToObject(array, keyField, valueField = null) {
    if (!Array.isArray(array)) {
      throw new Error('源数据必须是数组');
    }

    const result = {};
    array.forEach(item => {
      if (item && typeof item === 'object') {
        const key = item[keyField];
        if (key !== undefined && key !== null) {
          result[key] = valueField ? item[valueField] : this.deepClone(item);
        }
      }
    });
    return result;
  }

  /**
   * 将对象转换为数组
   * @param {Object} obj - 源对象
   * @param {boolean} includeKeys - 是否在结果中包含键名
   * @returns {Array} 转换后的数组
   */
  objectToArray(obj, includeKeys = false) {
    if (typeof obj !== 'object' || obj === null) {
      throw new Error('源数据必须是对象');
    }

    if (includeKeys) {
      return Object.entries(obj).map(([key, value]) => ({
        key,
        value: this.deepClone(value)
      }));
    }
    
    return Object.values(obj).map(value => this.deepClone(value));
  }

  /**
   * 转换对象键名
   * @param {Object} obj - 源对象
   * @param {Object} keyMap - 键名映射 {oldKey: newKey}
   * @param {boolean} keepOriginal - 是否保留原始键（未映射的）
   * @returns {Object} 转换后的对象
   */
  renameKeys(obj, keyMap, keepOriginal = true) {
    if (typeof obj !== 'object' || obj === null) {
      throw new Error('源数据必须是对象');
    }

    const result = {};
    
    // 处理映射的键
    Object.entries(keyMap).forEach(([oldKey, newKey]) => {
      if (oldKey in obj) {
        result[newKey] = this.deepClone(obj[oldKey]);
      }
    });

    // 处理未映射的键
    if (keepOriginal) {
      Object.keys(obj).forEach(key => {
        if (!(key in keyMap)) {
          result[key] = this.deepClone(obj[key]);
        }
      });
    }

    return result;
  }

  /**
   * 数组扁平化
   * @param {Array} array - 嵌套数组
   * @param {number} depth - 扁平化深度，默认全部
   * @returns {Array} 扁平化后的数组
   */
  flattenArray(array, depth = Infinity) {
    if (!Array.isArray(array)) {
      throw new Error('源数据必须是数组');
    }

    // 使用原生flat方法（如果支持）
    if (Array.prototype.flat) {
      return array.flat(depth);
    }

    // 降级实现
    const result = [];
    const flatten = (arr, currentDepth) => {
      arr.forEach(item => {
        if (Array.isArray(item) && currentDepth < depth) {
          flatten(item, currentDepth + 1);
        } else {
          result.push(item);
        }
      });
    };

    flatten(array, 0);
    return result;
  }

  /**
   * 数据透视（按指定字段分组并聚合）
   * @param {Array} data - 源数据数组
   * @param {string} groupBy - 分组字段
   * @param {string} aggregateField - 聚合字段
   * @param {string} aggregateType - 聚合类型: sum, avg, count, max, min
   * @returns {Object} 透视结果
   */
  pivotData(data, groupBy, aggregateField, aggregateType = 'sum') {
    if (!Array.isArray(data)) {
      throw new Error('源数据必须是数组');
    }

    const result = {};

    data.forEach(item => {
      if (item && typeof item === 'object') {
        const groupKey = item[groupBy];
        const value = item[aggregateField];

        if (groupKey !== undefined && groupKey !== null && typeof value === 'number') {
          if (!result[groupKey]) {
            result[groupKey] = {
              sum: 0,
              count: 0,
              avg: 0,
              max: -Infinity,
              min: Infinity
            };
          }

          // 累积计算
          result[groupKey].sum += value;
          result[groupKey].count += 1;
          result[groupKey].max = Math.max(result[groupKey].max, value);
          result[groupKey].min = Math.min(result[groupKey].min, value);
          result[groupKey].avg = result[groupKey].sum / result[groupKey].count;
        }
      }
    });

    // 返回指定类型的结果
    const finalResult = {};
    Object.entries(result).forEach(([key, stats]) => {
      finalResult[key] = stats[aggregateType] || 0;
    });

    return finalResult;
  }

  /**
   * 过滤数组中的唯一值
   * @param {Array} array - 源数组
   * @param {string} keyField - 用于判断唯一性的字段（可选）
   * @returns {Array} 去重后的数组
   */
  unique(array, keyField = null) {
    if (!Array.isArray(array)) {
      throw new Error('源数据必须是数组');
    }

    if (!keyField) {
      // 简单类型去重
      if (Array.from && Set) {
        return Array.from(new Set(array));
      }
      // 降级实现
      const result = [];
      array.forEach(item => {
        if (result.indexOf(item) === -1) {
          result.push(item);
        }
      });
      return result;
    }

    // 对象数组去重
    const seen = new Set();
    return array.filter(item => {
      if (item && typeof item === 'object') {
        const key = item[keyField];
        if (key !== undefined && key !== null && !seen.has(key)) {
          seen.add(key);
          return true;
        }
      }
      return false;
    });
  }

  /**
   * 合并多个对象
   * @param {Array} objects - 对象数组
   * @param {Object} options - 合并选项
   * @param {boolean} options.deep - 是否深度合并
   * @returns {Object} 合并后的对象
   */
  mergeObjects(objects, options = { deep: true }) {
    if (!Array.isArray(objects)) {
      throw new Error('参数必须是对象数组');
    }

    const result = {};

    objects.forEach(obj => {
      if (typeof obj === 'object' && obj !== null) {
        if (options.deep) {
          this._deepMerge(result, obj);
        } else {
          Object.assign(result, obj);
        }
      }
    });

    return result;
  }

  /**
   * 深度合并两个对象（内部方法）
   * @private
   */
  _deepMerge(target, source) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
          this._deepMerge(target[key], source[key]);
        } else {
          target[key] = this.deepClone(source[key]);
        }
      }
    }
  }

  /**
   * 提取对象的部分属性
   * @param {Object} obj - 源对象
   * @param {Array} fields - 要提取的字段数组
   * @returns {Object} 包含指定字段的新对象
   */
  pick(obj, fields) {
    if (typeof obj !== 'object' || obj === null) {
      throw new Error('源数据必须是对象');
    }

    if (!Array.isArray(fields)) {
      throw new Error('fields参数必须是数组');
    }

    const result = {};
    fields.forEach(field => {
      if (field in obj) {
        result[field] = this.deepClone(obj[field]);
      }
    });
    return result;
  }

  /**
   * 排除对象的部分属性
   * @param {Object} obj - 源对象
   * @param {Array} fields - 要排除的字段数组
   * @returns {Object} 排除指定字段后的新对象
   */
  omit(obj, fields) {
    if (typeof obj !== 'object' || obj === null) {
      throw new Error('源数据必须是对象');
    }

    if (!Array.isArray(fields)) {
      throw new Error('fields参数必须是数组');
    }

    const fieldSet = new Set(fields);
    const result = {};

    Object.keys(obj).forEach(key => {
      if (!fieldSet.has(key)) {
        result[key] = this.deepClone(obj[key]);
      }
    });

    return result;
  }

  /**
   * 将CSV格式字符串转换为对象数组
   * @param {string} csvString - CSV字符串
   * @param {Object} options - 解析选项
   * @returns {Array} 对象数组
   */
  csvToJson(csvString, options = {}) {
    const {
      delimiter = ',',
      hasHeaders = true
    } = options;

    const lines = csvString.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];

    let headers, startIndex;
    
    if (hasHeaders) {
      headers = lines[0].split(delimiter).map(header => header.trim());
      startIndex = 1;
    } else {
      // 没有标题行，生成数字索引
      headers = Array.from({ length: lines[0].split(delimiter).length }, (_, i) => `field${i}`);
      startIndex = 0;
    }

    return lines.slice(startIndex).map(line => {
      const values = line.split(delimiter);
      const obj = {};
      
      headers.forEach((header, index) => {
        obj[header] = values[index] !== undefined ? values[index].trim() : '';
      });
      
      return obj;
    });
  }

  /**
   * 将对象数组转换为CSV格式字符串
   * @param {Array} data - 对象数组
   * @param {Object} options - 格式化选项
   * @returns {string} CSV字符串
   */
  jsonToCsv(data, options = {}) {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const {
      delimiter = ',',
      includeHeaders = true,
      fields = null
    } = options;

    // 获取所有字段名（如果未指定）
    const headers = fields || Object.keys(data[0]);
    let csv = '';

    // 添加标题行
    if (includeHeaders) {
      csv += headers.join(delimiter) + '\n';
    }

    // 添加数据行
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] === null || row[header] === undefined ? '' : String(row[header]);
        // 如果值包含分隔符或换行符，需要用引号包围
        if (value.includes(delimiter) || value.includes('\n') || value.includes('"')) {
          return '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
      });
      csv += values.join(delimiter) + '\n';
    });

    return csv.trim();
  }

  /**
   * 转换嵌套数组为树形结构
   * @param {Array} data - 源数据数组
   * @param {Object} options - 配置选项
   * @returns {Array} 树形结构数组
   */
  arrayToTree(data, options = {}) {
    const {
      idKey = 'id',
      parentIdKey = 'parentId',
      childrenKey = 'children',
      rootParentId = null
    } = options;

    const tree = [];
    const idMap = {};

    // 构建ID映射
    data.forEach(item => {
      idMap[item[idKey]] = { ...item, [childrenKey]: [] };
    });

    // 构建树结构
    data.forEach(item => {
      const parentId = item[parentIdKey];
      if (parentId === rootParentId) {
        // 根节点
        tree.push(idMap[item[idKey]]);
      } else if (idMap[parentId]) {
        // 子节点
        idMap[parentId][childrenKey].push(idMap[item[idKey]]);
      }
    });

    return tree;
  }

  /**
   * 将树形结构展平为数组
   * @param {Array} tree - 树形结构数组
   * @param {Object} options - 配置选项
   * @returns {Array} 展平后的数组
   */
  treeToArray(tree, options = {}) {
    const {
      childrenKey = 'children',
      includeDepth = false
    } = options;

    const result = [];

    const flattenNode = (node, depth = 0) => {
      const cloned = this.deepClone(node);
      delete cloned[childrenKey];
      
      if (includeDepth) {
        cloned.depth = depth;
      }
      
      result.push(cloned);
      
      if (node[childrenKey] && Array.isArray(node[childrenKey])) {
        node[childrenKey].forEach(child => {
          flattenNode(child, depth + 1);
        });
      }
    };

    tree.forEach(rootNode => {
      flattenNode(rootNode);
    });

    return result;
  }

  /**
   * 批量转换数据
   * @param {Array} items - 要转换的数据项
   * @param {Function} transformFn - 转换函数
   * @returns {Array} 转换后的数组
   */
  batchTransform(items, transformFn) {
    if (!Array.isArray(items)) {
      throw new Error('items参数必须是数组');
    }

    if (typeof transformFn !== 'function') {
      throw new Error('transformFn参数必须是函数');
    }

    return items.map(item => transformFn(item));
  }
}

// 导出单例实例
const dataTransformer = new DataTransformer();
export default dataTransformer;
export { DataTransformer };