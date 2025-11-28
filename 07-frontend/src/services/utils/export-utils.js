/**
 * 导出工具类
 * 提供多种格式的数据导出功能
 */
class ExportUtils {
  constructor() {
    this.supportedFormats = ['csv', 'json', 'xlsx', 'pdf', 'txt', 'xml'];
  }

  /**
   * 导出数据到CSV文件
   * @param {Array} data - 要导出的数据数组
   * @param {string} filename - 文件名（不含扩展名）
   * @param {Object} options - 导出选项
   * @returns {Promise<string>} 导出结果
   */
  exportToCSV(data, filename = 'export', options = {}) {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('数据必须是非空数组');
      }

      const headers = Object.keys(data[0]);
      const csvContent = [];

      // 添加表头
      csvContent.push(headers.map(header => this._escapeCSV(header)).join(','));

      // 添加数据行
      data.forEach(row => {
        csvContent.push(headers.map(header => this._escapeCSV(row[header])).join(','));
      });

      const csvString = csvContent.join('\n');
      this._downloadFile(csvString, `${filename}.csv`, 'text/csv;charset=utf-8;');
      
      return Promise.resolve(`${filename}.csv 导出成功`);
    } catch (error) {
      return Promise.reject(`CSV导出失败: ${error.message}`);
    }
  }

  /**
   * 导出数据到JSON文件
   * @param {*} data - 要导出的数据
   * @param {string} filename - 文件名（不含扩展名）
   * @param {Object} options - 导出选项
   * @returns {Promise<string>} 导出结果
   */
  exportToJSON(data, filename = 'export', options = {}) {
    try {
      const jsonString = JSON.stringify(data, null, options.pretty ? 2 : 0);
      this._downloadFile(jsonString, `${filename}.json`, 'application/json');
      
      return Promise.resolve(`${filename}.json 导出成功`);
    } catch (error) {
      return Promise.reject(`JSON导出失败: ${error.message}`);
    }
  }

  /**
   * 导出数据到文本文件
   * @param {string|Array} data - 要导出的文本或文本数组
   * @param {string} filename - 文件名（不含扩展名）
   * @returns {Promise<string>} 导出结果
   */
  exportToText(data, filename = 'export') {
    try {
      let textContent = '';
      
      if (Array.isArray(data)) {
        textContent = data.join('\n');
      } else {
        textContent = String(data);
      }
      
      this._downloadFile(textContent, `${filename}.txt`, 'text/plain');
      
      return Promise.resolve(`${filename}.txt 导出成功`);
    } catch (error) {
      return Promise.reject(`文本导出失败: ${error.message}`);
    }
  }

  /**
   * 导出HTML到PDF（需要浏览器支持或额外库）
   * @param {string|HTMLElement} content - HTML内容或元素
   * @param {string} filename - 文件名（不含扩展名）
   * @param {Object} options - 导出选项
   * @returns {Promise<string>} 导出结果
   */
  exportToPDF(content, filename = 'export', options = {}) {
    // 注意：完整的PDF导出通常需要额外的库支持，如jsPDF
    return new Promise((resolve, reject) => {
      try {
        // 简单实现：将HTML内容转换为数据URL并下载
        let htmlContent = '';
        
        if (typeof content === 'string') {
          htmlContent = content;
        } else if (content instanceof HTMLElement) {
          htmlContent = content.outerHTML;
        } else {
          throw new Error('无效的HTML内容');
        }

        // 创建一个临时的iframe来处理PDF转换
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        iframe.contentDocument.write(`
          <html>
            <head>
              <title>${filename}</title>
              <style>
                ${options.styles || ''}
              </style>
            </head>
            <body>
              ${htmlContent}
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(() => {
                    window.parent.document.body.removeChild(window.frameElement);
                  }, 1000);
                };
              </script>
            </body>
          </html>
        `);
        
        iframe.contentDocument.close();
        resolve(`请在打印对话框中选择"保存为PDF"`);
      } catch (error) {
        reject(`PDF导出失败: ${error.message}`);
      }
    });
  }

  /**
   * 导出表格数据
   * @param {HTMLElement} tableElement - 表格元素
   * @param {string} filename - 文件名
   * @param {string} format - 导出格式 ('csv', 'json')
   * @returns {Promise<string>} 导出结果
   */
  exportTable(tableElement, filename = 'table', format = 'csv') {
    return new Promise((resolve, reject) => {
      try {
        if (!(tableElement instanceof HTMLElement) || tableElement.tagName !== 'TABLE') {
          throw new Error('必须提供有效的表格元素');
        }

        const data = [];
        const headers = [];
        
        // 获取表头
        const headerCells = tableElement.querySelectorAll('thead th');
        headerCells.forEach(cell => headers.push(cell.textContent.trim()));

        // 获取数据行
        const rows = tableElement.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const rowData = {};
          const cells = row.querySelectorAll('td');
          
          cells.forEach((cell, index) => {
            rowData[headers[index] || `列${index + 1}`] = cell.textContent.trim();
          });
          
          data.push(rowData);
        });

        // 根据格式导出
        if (format === 'csv') {
          this.exportToCSV(data, filename).then(resolve).catch(reject);
        } else if (format === 'json') {
          this.exportToJSON(data, filename).then(resolve).catch(reject);
        } else {
          reject(`不支持的导出格式: ${format}`);
        }
      } catch (error) {
        reject(`表格导出失败: ${error.message}`);
      }
    });
  }

  /**
   * 创建导出链接
   * @param {string} content - 文件内容
   * @param {string} filename - 文件名
   * @param {string} mimeType - MIME类型
   * @returns {string} 下载链接
   */
  createDownloadLink(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    return link;
  }

  /**
   * 批量导出多个数据集
   * @param {Array} exports - 导出配置数组
   * @returns {Promise<Array>} 导出结果数组
   */
  batchExport(exports) {
    const promises = exports.map(({ data, filename, format, options }) => {
      switch (format) {
        case 'csv':
          return this.exportToCSV(data, filename, options);
        case 'json':
          return this.exportToJSON(data, filename, options);
        case 'txt':
          return this.exportToText(data, filename);
        case 'pdf':
          return this.exportToPDF(data, filename, options);
        default:
          return Promise.reject(`不支持的格式: ${format}`);
      }
    });

    return Promise.all(promises);
  }

  /**
   * 检查导出格式是否支持
   * @param {string} format - 导出格式
   * @returns {boolean} 是否支持
   */
  isFormatSupported(format) {
    return this.supportedFormats.includes(format.toLowerCase());
  }

  /**
   * 导出为Excel格式（简单实现）
   * @param {Array} data - 要导出的数据
   * @param {string} filename - 文件名
   * @returns {Promise<string>} 导出结果
   */
  exportToExcel(data, filename = 'export') {
    // 注意：完整的Excel导出通常需要额外的库支持，如xlsx
    try {
      // 简单实现：CSV格式的数据，但是以.xls扩展名保存
      const result = this.exportToCSV(data, filename, {});
      
      // 重命名下载的文件扩展名
      setTimeout(() => {
        const links = document.querySelectorAll('a[download$=".csv"]');
        if (links.length > 0) {
          links[links.length - 1].download = `${filename}.xls`;
        }
      }, 0);
      
      return Promise.resolve(`${filename}.xls 导出成功`);
    } catch (error) {
      return Promise.reject(`Excel导出失败: ${error.message}`);
    }
  }

  /**
   * 私有方法：转义CSV内容
   * @private
   * @param {*} value - 要转义的值
   * @returns {string} 转义后的值
   */
  _escapeCSV(value) {
    if (value === null || value === undefined) return '';
    
    const str = String(value);
    // 如果包含逗号、引号或换行符，需要用引号包裹并转义内部的引号
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
  }

  /**
   * 私有方法：下载文件
   * @private
   * @param {string} content - 文件内容
   * @param {string} filename - 文件名
   * @param {string} mimeType - MIME类型
   */
  _downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }
}

// 导出单例实例
const exportUtils = new ExportUtils();
export default exportUtils;
export { ExportUtils };