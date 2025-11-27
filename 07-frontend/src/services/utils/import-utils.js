/**
 * 导入工具类
 * 提供多种格式的数据导入和解析功能
 */
class ImportUtils {
  constructor() {
    this.supportedFormats = ['csv', 'json', 'text', 'xml', 'excel'];
    this.fileSizeLimit = 10 * 1024 * 1024; // 默认10MB
  }

  /**
   * 设置文件大小限制
   * @param {number} limit - 文件大小限制（字节）
   */
  setFileSizeLimit(limit) {
    this.fileSizeLimit = limit;
  }

  /**
   * 创建文件选择器
   * @param {Object} options - 选项
   * @returns {HTMLInputElement} 文件输入元素
   */
  createFileInput(options = {}) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = options.accept || '.csv,.json,.txt,.xml,.xls,.xlsx';
    input.multiple = !!options.multiple;
    
    if (options.style) {
      Object.assign(input.style, options.style);
    }
    
    return input;
  }

  /**
   * 导入CSV文件
   * @param {File} file - CSV文件对象
   * @param {Object} options - 解析选项
   * @returns {Promise<Array>} 解析后的数据数组
   */
  importCSV(file, options = {}) {
    return new Promise((resolve, reject) => {
      this._validateFile(file, ['text/csv', '.csv'])
        .then(() => this._readFileAsText(file))
        .then(content => {
          const data = this._parseCSV(content, options);
          resolve(data);
        })
        .catch(reject);
    });
  }

  /**
   * 导入JSON文件
   * @param {File} file - JSON文件对象
   * @param {Object} options - 解析选项
   * @returns {Promise<any>} 解析后的数据
   */
  importJSON(file, options = {}) {
    return new Promise((resolve, reject) => {
      this._validateFile(file, ['application/json', '.json'])
        .then(() => this._readFileAsText(file))
        .then(content => {
          try {
            const data = JSON.parse(content);
            resolve(data);
          } catch (error) {
            reject(new Error('JSON解析失败: ' + error.message));
          }
        })
        .catch(reject);
    });
  }

  /**
   * 导入文本文件
   * @param {File} file - 文本文件对象
   * @returns {Promise<string>} 文本内容
   */
  importText(file) {
    return new Promise((resolve, reject) => {
      this._validateFile(file, ['text/plain', '.txt'])
        .then(() => this._readFileAsText(file))
        .then(content => resolve(content))
        .catch(reject);
    });
  }

  /**
   * 导入XML文件
   * @param {File} file - XML文件对象
   * @returns {Promise<Object>} 解析后的XML对象
   */
  importXML(file) {
    return new Promise((resolve, reject) => {
      this._validateFile(file, ['text/xml', 'application/xml', '.xml'])
        .then(() => this._readFileAsText(file))
        .then(content => {
          try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(content, 'text/xml');
            
            // 检查解析错误
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
              throw new Error('XML解析错误: ' + parserError.textContent);
            }
            
            resolve(xmlDoc);
          } catch (error) {
            reject(new Error('XML解析失败: ' + error.message));
          }
        })
        .catch(reject);
    });
  }

  /**
   * 批量导入文件
   * @param {FileList} fileList - 文件列表
   * @returns {Promise<Array>} 导入结果数组
   */
  batchImport(fileList) {
    const promises = Array.from(fileList).map(file => this.importFile(file));
    return Promise.all(promises);
  }

  /**
   * 根据文件类型自动导入
   * @param {File} file - 文件对象
   * @returns {Promise<any>} 导入结果
   */
  importFile(file) {
    const extension = this._getFileExtension(file.name).toLowerCase();
    
    switch (extension) {
      case 'csv':
        return this.importCSV(file);
      case 'json':
        return this.importJSON(file);
      case 'txt':
        return this.importText(file);
      case 'xml':
        return this.importXML(file);
      case 'xls':
      case 'xlsx':
        return this.importExcel(file);
      default:
        return Promise.reject(new Error(`不支持的文件类型: ${extension}`));
    }
  }

  /**
   * 导入Excel文件（简化版，实际使用可能需要专门的库）
   * @param {File} file - Excel文件对象
   * @returns {Promise<Array>} 解析后的数据
   */
  importExcel(file) {
    return new Promise((resolve, reject) => {
      this._validateFile(file, ['.xls', '.xlsx'])
        .then(() => {
          // 注意：完整的Excel解析需要专门的库如xlsx
          // 这里提供一个简化的实现，仅适用于简单情况
          reject(new Error('Excel导入需要专门的库支持，请引入xlsx等库'));
          
          // 如果有xlsx库，可以取消下面的注释
          /*
          if (typeof XLSX === 'undefined') {
            throw new Error('未找到xlsx库，请先引入');
          }
          
          const reader = new FileReader();
          reader.onload = function(e) {
            try {
              const data = new Uint8Array(e.target.result);
              const workbook = XLSX.read(data, { type: 'array' });
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet);
              resolve(jsonData);
            } catch (error) {
              reject(new Error('Excel解析失败: ' + error.message));
            }
          };
          reader.onerror = () => reject(new Error('文件读取失败'));
          reader.readAsArrayBuffer(file);
          */
        })
        .catch(reject);
    });
  }

  /**
   * 预览CSV文件内容
   * @param {File} file - CSV文件
   * @param {number} maxRows - 最大预览行数
   * @returns {Promise<Array>} 预览数据
   */
  previewCSV(file, maxRows = 10) {
    return this.importCSV(file)
      .then(data => data.slice(0, maxRows));
  }

  /**
   * 验证导入数据
   * @param {Array} data - 导入的数据
   * @param {Object} schema - 验证模式
   * @returns {Promise<Object>} 验证结果
   */
  validateImport(data, schema) {
    return new Promise((resolve) => {
      const errors = [];
      const validData = [];
      
      data.forEach((row, index) => {
        const rowErrors = [];
        
        Object.keys(schema).forEach(field => {
          const rules = schema[field];
          const value = row[field];
          
          // 必填验证
          if (rules.required && (value === null || value === undefined || value === '')) {
            rowErrors.push(`${field} 是必填项`);
          }
          
          // 类型验证
          if (rules.type && value !== null && value !== undefined) {
            const isValidType = this._validateType(value, rules.type);
            if (!isValidType) {
              rowErrors.push(`${field} 类型错误，应为 ${rules.type}`);
            }
          }
          
          // 长度验证
          if (rules.maxLength && String(value).length > rules.maxLength) {
            rowErrors.push(`${field} 长度不能超过 ${rules.maxLength}`);
          }
          
          if (rules.minLength && String(value).length < rules.minLength) {
            rowErrors.push(`${field} 长度不能少于 ${rules.minLength}`);
          }
          
          // 正则验证
          if (rules.pattern && !rules.pattern.test(String(value))) {
            rowErrors.push(`${field} 格式不正确`);
          }
        });
        
        if (rowErrors.length > 0) {
          errors.push({
            row: index + 1,
            errors: rowErrors,
            data: row
          });
        } else {
          validData.push(row);
        }
      });
      
      resolve({
        valid: errors.length === 0,
        errors,
        validData,
        invalidCount: errors.length,
        totalCount: data.length
      });
    });
  }

  /**
   * 私有方法：验证文件
   * @private
   * @param {File} file - 文件对象
   * @param {Array} allowedTypes - 允许的类型
   * @returns {Promise<File>} 验证通过的文件
   */
  _validateFile(file, allowedTypes) {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error('文件未提供'));
      }

      if (file.size > this.fileSizeLimit) {
        return reject(new Error(`文件大小超过限制 ${(this.fileSizeLimit / 1024 / 1024).toFixed(1)}MB`));
      }

      const fileExtension = this._getFileExtension(file.name).toLowerCase();
      const mimeType = file.type;
      
      const isAllowed = allowedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.slice(1);
        }
        return mimeType === type;
      });
      
      if (!isAllowed) {
        return reject(new Error('不支持的文件类型'));
      }

      resolve(file);
    });
  }

  /**
   * 私有方法：读取文件为文本
   * @private
   * @param {File} file - 文件对象
   * @returns {Promise<string>} 文件内容
   */
  _readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * 私有方法：解析CSV内容
   * @private
   * @param {string} content - CSV内容
   * @param {Object} options - 解析选项
   * @returns {Array} 解析后的数据
   */
  _parseCSV(content, options = {}) {
    const delimiter = options.delimiter || ',';
    const hasHeaders = options.hasHeaders !== false;
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length === 0) {
      return [];
    }

    let headers = [];
    let dataLines = lines;
    
    if (hasHeaders) {
      headers = this._parseCSVLine(lines[0], delimiter);
      dataLines = lines.slice(1);
    } else {
      // 自动生成表头
      const firstLine = this._parseCSVLine(lines[0], delimiter);
      headers = firstLine.map((_, index) => `列${index + 1}`);
    }

    return dataLines.map(line => {
      const values = this._parseCSVLine(line, delimiter);
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      return row;
    });
  }

  /**
   * 私有方法：解析CSV行
   * @private
   * @param {string} line - CSV行
   * @param {string} delimiter - 分隔符
   * @returns {Array} 解析后的值数组
   */
  _parseCSVLine(line, delimiter) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // 处理双引号转义
          current += '"';
          i++; // 跳过下一个引号
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * 私有方法：获取文件扩展名
   * @private
   * @param {string} filename - 文件名
   * @returns {string} 扩展名
   */
  _getFileExtension(filename) {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex === -1 ? '' : filename.slice(lastDotIndex + 1);
  }

  /**
   * 私有方法：验证类型
   * @private
   * @param {*} value - 值
   * @param {string} type - 类型
   * @returns {boolean} 是否有效
   */
  _validateType(value, type) {
    switch (type.toLowerCase()) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return !isNaN(Number(value));
      case 'integer':
        return Number.isInteger(Number(value));
      case 'boolean':
        return ['true', 'false', true, false, 1, 0].includes(value);
      case 'date':
        return !isNaN(new Date(value).getTime());
      default:
        return true;
    }
  }
}

// 导出单例实例
const importUtils = new ImportUtils();
export default importUtils;
export { ImportUtils };