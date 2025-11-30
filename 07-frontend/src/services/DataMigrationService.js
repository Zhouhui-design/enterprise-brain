/**
 * 数据迁移服务
 * 提供完整的数据导出和导入功能，支持不同版本间的数据迁移
 */
class DataMigrationService {
  constructor() {
    this.exportFormats = ['json', 'csv', 'excel'];
    this.supportedEntities = ['materials', 'productionBoms', 'designBoms', 'salesBoms'];
  }

  /**
   * 导出数据
   * @param {Object} options - 导出选项
   * @returns {Promise<Object>} 导出结果
   */
  async exportData(options = {}) {
    try {
      const {
        format = 'json',
        entities = this.supportedEntities,
        filters = {},
        includeMetadata = true
      } = options;

      // 验证导出格式
      if (!this.exportFormats.includes(format)) {
        throw new Error(`不支持的导出格式: ${format}`);
      }

      // 验证实体类型
      const invalidEntities = entities.filter(entity => !this.supportedEntities.includes(entity));
      if (invalidEntities.length > 0) {
        throw new Error(`不支持的实体类型: ${invalidEntities.join(', ')}`);
      }

      // 获取数据
      const exportData = {
        metadata: includeMetadata ? this.createMetadata() : undefined,
        data: {}
      };

      // 导出指定的实体数据
      for (const entity of entities) {
        exportData.data[entity] = await this.getEntityData(entity, filters);
      }

      // 根据格式转换数据
      let result;
      let fileName;
      
      switch (format) {
        case 'json':
          result = this.convertToJson(exportData);
          fileName = `enterprise_brain_export_${this.formatDate(new Date())}.json`;
          break;
        case 'csv':
          result = this.convertToCsv(exportData);
          fileName = `enterprise_brain_export_${this.formatDate(new Date())}.csv`;
          break;
        case 'excel':
          result = await this.convertToExcel(exportData);
          fileName = `enterprise_brain_export_${this.formatDate(new Date())}.xlsx`;
          break;
        default:
          throw new Error(`不支持的导出格式: ${format}`);
      }

      // 记录导出操作
      await auditService.logDataExport('system', this.countTotalRecords(exportData.data));

      return {
        success: true,
        data: result,
        fileName: fileName,
        format: format,
        recordCount: this.countTotalRecords(exportData.data)
      };
    } catch (error) {
      console.error('数据导出失败:', error);
      throw new Error(`数据导出失败: ${error.message}`);
    }
  }

  /**
   * 创建元数据
   * @returns {Object} 元数据
   */
  createMetadata() {
    return {
      version: '1.0.0',
      exportTime: new Date().toISOString(),
      exporter: userService.getCurrentUser()?.name || 'anonymous',
      platform: navigator.userAgent,
      entities: this.supportedEntities
    };
  }

  /**
   * 获取实体数据
   * @param {string} entity - 实体类型
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} 实体数据
   */
  async getEntityData(entity, filters) {
    try {
      let data;
      
      switch (entity) {
        case 'materials':
          data = await databaseService.getAllMaterials();
          break;
        case 'productionBoms':
          data = await databaseService.getAllBoms('productionBoms');
          break;
        case 'designBoms':
          data = await databaseService.getAllBoms('designBoms');
          break;
        case 'salesBoms':
          data = await databaseService.getAllBoms('salesBoms');
          break;
        default:
          throw new Error(`不支持的实体类型: ${entity}`);
      }

      // 应用过滤条件
      if (filters) {
        data = this.applyFilters(data, filters);
      }

      return data;
    } catch (error) {
      console.error(`获取${entity}数据失败:`, error);
      throw new Error(`获取${entity}数据失败: ${error.message}`);
    }
  }

  /**
   * 应用过滤条件
   * @param {Array} data - 数据数组
   * @param {Object} filters - 过滤条件
   * @returns {Array} 过滤后的数据
   */
  applyFilters(data, filters) {
    return data.filter(item => {
      // 实现过滤逻辑
      for (const [key, value] of Object.entries(filters)) {
        if (item[key] === undefined) continue;
        
        // 字符串包含匹配
        if (typeof item[key] === 'string' && typeof value === 'string') {
          if (!item[key].toLowerCase().includes(value.toLowerCase())) {
            return false;
          }
        }
        // 精确匹配
        else if (item[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * 转换为JSON格式
   * @param {Object} data - 数据
   * @returns {string} JSON字符串
   */
  convertToJson(data) {
    return JSON.stringify(data, null, 2);
  }

  /**
   * 转换为CSV格式
   * @param {Object} exportData - 导出数据
   * @returns {string} CSV字符串
   */
  convertToCsv(exportData) {
    let csvContent = '';
    
    // 添加元数据作为注释
    if (exportData.metadata) {
      csvContent += `# Export Metadata\n`;
      csvContent += `# Version: ${exportData.metadata.version}\n`;
      csvContent += `# Export Time: ${exportData.metadata.exportTime}\n`;
      csvContent += `# Exporter: ${exportData.metadata.exporter}\n\n`;
    }
    
    // 为每个实体类型生成CSV
    for (const [entityType, entityData] of Object.entries(exportData.data)) {
      if (entityData.length === 0) continue;
      
      csvContent += `# ${entityType}\n`;
      
      // 生成表头
      const headers = Object.keys(entityData[0]);
      csvContent += headers.join(',') + '\n';
      
      // 生成数据行
      for (const item of entityData) {
        const row = headers.map(header => {
          const value = item[header];
          // 处理包含逗号或引号的值
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',');
        csvContent += row + '\n';
      }
      
      csvContent += '\n';
    }
    
    return csvContent;
  }

  /**
   * 转换为Excel格式
   * @param {Object} exportData - 导出数据
   * @returns {Promise<Blob>} Excel文件Blob
   */
  async convertToExcel(exportData) {
    try {
      // 动态导入XLSX库
      const XLSX = await import('xlsx');
      
      // 创建工作簿
      const wb = XLSX.utils.book_new();
      
      // 为每个实体类型创建工作表
      for (const [entityType, entityData] of Object.entries(exportData.data)) {
        if (entityData.length === 0) continue;
        
        // 转换数据为工作表格式
        const ws = XLSX.utils.json_to_sheet(entityData);
        XLSX.utils.book_append_sheet(wb, ws, entityType);
      }
      
      // 添加元数据工作表
      if (exportData.metadata) {
        const metadataWs = XLSX.utils.json_to_sheet([exportData.metadata]);
        XLSX.utils.book_append_sheet(wb, metadataWs, 'Metadata');
      }
      
      // 转换为二进制数据
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      return new Blob([wbout], { type: 'application/octet-stream' });
    } catch (error) {
      console.error('转换为Excel格式失败:', error);
      throw new Error(`转换为Excel格式失败: ${error.message}`);
    }
  }

  /**
   * 导入数据
   * @param {File|Object} fileOrData - 文件或数据对象
   * @param {Object} options - 导入选项
   * @returns {Promise<Object>} 导入结果
   */
  async importData(fileOrData, options = {}) {
    try {
      const {
        mergeStrategy = 'upsert', // upsert, insert, update
        validateData = true,
        backupBeforeImport = true
      } = options;

      let importData;

      // 如果是文件，解析文件内容
      if (fileOrData instanceof File) {
        importData = await this.parseImportFile(fileOrData);
      } else {
        importData = fileOrData;
      }

      // 验证数据格式
      if (validateData) {
        this.validateImportData(importData);
      }

      // 导入前备份
      let backupInfo = null;
      if (backupBeforeImport) {
        backupInfo = await backupService.createFullBackup();
      }

      // 执行导入
      const importResult = await this.executeImport(importData, mergeStrategy);

      // 记录导入操作
      await auditService.logDataImport('system', importResult.totalRecords);

      return {
        success: true,
        message: '数据导入成功',
        backupInfo: backupInfo,
        result: importResult
      };
    } catch (error) {
      console.error('数据导入失败:', error);
      throw new Error(`数据导入失败: ${error.message}`);
    }
  }

  /**
   * 解析导入文件
   * @param {File} file - 文件
   * @returns {Promise<Object>} 解析后的数据
   */
  async parseImportFile(file) {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.json')) {
      return this.parseJsonFile(file);
    } else if (fileName.endsWith('.csv')) {
      return this.parseCsvFile(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return this.parseExcelFile(file);
    } else {
      throw new Error('不支持的文件格式');
    }
  }

  /**
   * 解析JSON文件
   * @param {File} file - JSON文件
   * @returns {Promise<Object>} 解析后的数据
   */
  async parseJsonFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error(`解析JSON文件失败: ${error.message}`));
        }
      };
      reader.onerror = () => {
        reject(new Error('读取文件失败'));
      };
      reader.readAsText(file);
    });
  }

  /**
   * 解析CSV文件
   * @param {File} file - CSV文件
   * @returns {Promise<Object>} 解析后的数据
   */
  async parseCsvFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csvContent = event.target.result;
          const parsedData = this.parseCsvContent(csvContent);
          resolve(parsedData);
        } catch (error) {
          reject(new Error(`解析CSV文件失败: ${error.message}`));
        }
      };
      reader.onerror = () => {
        reject(new Error('读取文件失败'));
      };
      reader.readAsText(file);
    });
  }

  /**
   * 解析CSV内容
   * @param {string} csvContent - CSV内容
   * @returns {Object} 解析后的数据
   */
  parseCsvContent(csvContent) {
    const lines = csvContent.split('\n');
    const data = {};
    let currentEntity = null;
    let headers = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 跳过空行和注释行
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      
      // 实体标识行
      if (trimmedLine.startsWith('# ')) {
        currentEntity = trimmedLine.substring(2);
        data[currentEntity] = [];
        headers = null;
        continue;
      }
      
      // 数据行
      if (currentEntity) {
        const values = this.parseCsvRow(trimmedLine);
        
        if (!headers) {
          // 第一行是表头
          headers = values;
        } else {
          // 数据行
          const rowData = {};
          for (let i = 0; i < headers.length; i++) {
            rowData[headers[i]] = values[i];
          }
          data[currentEntity].push(rowData);
        }
      }
    }
    
    return { data: data };
  }

  /**
   * 解析CSV行
   * @param {string} row - CSV行
   * @returns {Array} 解析后的值数组
   */
  parseCsvRow(row) {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        if (insideQuotes && i + 1 < row.length && row[i + 1] === '"') {
          // 双引号转义
          currentValue += '"';
          i++; // 跳过下一个引号
        } else {
          // 切换引号状态
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        // 逗号分隔符
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // 添加最后一个值
    values.push(currentValue);
    
    return values;
  }

  /**
   * 解析Excel文件
   * @param {File} file - Excel文件
   * @returns {Promise<Object>} 解析后的数据
   */
  async parseExcelFile(file) {
    try {
      // 动态导入XLSX库
      const XLSX = await import('xlsx');
      
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      const result = {
        data: {}
      };
      
      // 解析每个工作表
      for (const sheetName of workbook.SheetNames) {
        if (sheetName === 'Metadata') {
          // 跳过元数据工作表
          continue;
        }
        
        const worksheet = workbook.Sheets[sheetName];
        result.data[sheetName] = XLSX.utils.sheet_to_json(worksheet);
      }
      
      return result;
    } catch (error) {
      console.error('解析Excel文件失败:', error);
      throw new Error(`解析Excel文件失败: ${error.message}`);
    }
  }

  /**
   * 验证导入数据
   * @param {Object} data - 导入数据
   */
  validateImportData(data) {
    if (!data || !data.data) {
      throw new Error('无效的数据格式');
    }
    
    // 验证实体类型
    const invalidEntities = Object.keys(data.data).filter(entity => 
      !this.supportedEntities.includes(entity)
    );
    
    if (invalidEntities.length > 0) {
      throw new Error(`不支持的实体类型: ${invalidEntities.join(', ')}`);
    }
  }

  /**
   * 执行导入
   * @param {Object} importData - 导入数据
   * @param {string} mergeStrategy - 合并策略
   * @returns {Promise<Object>} 导入结果
   */
  async executeImport(importData, mergeStrategy) {
    const result = {
      totalRecords: 0,
      importedRecords: 0,
      updatedRecords: 0,
      skippedRecords: 0,
      errors: []
    };
    
    // 导入每个实体类型的数据
    for (const [entityType, entityData] of Object.entries(importData.data)) {
      try {
        const importResult = await this.importEntityData(entityType, entityData, mergeStrategy);
        result.totalRecords += importResult.total;
        result.importedRecords += importResult.imported;
        result.updatedRecords += importResult.updated;
        result.skippedRecords += importResult.skipped;
        result.errors.push(...importResult.errors);
      } catch (error) {
        result.errors.push(`导入${entityType}数据失败: ${error.message}`);
      }
    }
    
    return result;
  }

  /**
   * 导入实体数据
   * @param {string} entityType - 实体类型
   * @param {Array} entityData - 实体数据
   * @param {string} mergeStrategy - 合并策略
   * @returns {Promise<Object>} 导入结果
   */
  async importEntityData(entityType, entityData, mergeStrategy) {
    const result = {
      total: entityData.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };
    
    // 获取现有数据用于比较
    let existingData = [];
    switch (entityType) {
      case 'materials':
        existingData = await databaseService.getAllMaterials();
        break;
      case 'productionBoms':
        existingData = await databaseService.getAllBoms('productionBoms');
        break;
      case 'designBoms':
        existingData = await databaseService.getAllBoms('designBoms');
        break;
      case 'salesBoms':
        existingData = await databaseService.getAllBoms('salesBoms');
        break;
    }
    
    // 创建现有数据映射
    const existingMap = new Map();
    const idField = this.getIdFieldForEntity(entityType);
    existingData.forEach(item => {
      existingMap.set(item[idField], item);
    });
    
    // 处理每条记录
    for (const item of entityData) {
      try {
        const existingItem = existingMap.get(item[idField]);
        
        switch (mergeStrategy) {
          case 'insert':
            // 仅插入新记录
            if (!existingItem) {
              await this.saveEntityItem(entityType, item);
              result.imported++;
            } else {
              result.skipped++;
            }
            break;
            
          case 'update':
            // 仅更新现有记录
            if (existingItem) {
              await this.saveEntityItem(entityType, item);
              result.updated++;
            } else {
              result.skipped++;
            }
            break;
            
          case 'upsert':
          default:
            // 插入或更新
            await this.saveEntityItem(entityType, item);
            if (existingItem) {
              result.updated++;
            } else {
              result.imported++;
            }
            break;
        }
      } catch (error) {
        result.errors.push(`导入记录失败 (${entityType}): ${error.message}`);
      }
    }
    
    return result;
  }

  /**
   * 获取实体的ID字段
   * @param {string} entityType - 实体类型
   * @returns {string} ID字段名
   */
  getIdFieldForEntity(entityType) {
    switch (entityType) {
      case 'materials':
        return 'materialCode';
      case 'productionBoms':
      case 'designBoms':
      case 'salesBoms':
        return 'bomCode';
      default:
        return 'id';
    }
  }

  /**
   * 保存实体项
   * @param {string} entityType - 实体类型
   * @param {Object} item - 实体项
   */
  async saveEntityItem(entityType, item) {
    switch (entityType) {
      case 'materials':
        await databaseService.saveMaterial(item);
        break;
      case 'productionBoms':
        await databaseService.saveBom(item, 'productionBoms');
        break;
      case 'designBoms':
        await databaseService.saveBom(item, 'designBoms');
        break;
      case 'salesBoms':
        await databaseService.saveBom(item, 'salesBoms');
        break;
      default:
        throw new Error(`不支持的实体类型: ${entityType}`);
    }
  }

  /**
   * 计算总记录数
   * @param {Object} data - 数据对象
   * @returns {number} 总记录数
   */
  countTotalRecords(data) {
    return Object.values(data).reduce((total, entityData) => total + (entityData.length || 0), 0);
  }

  /**
   * 格式化日期
   * @param {Date} date - 日期
   * @returns {string} 格式化后的日期字符串
   */
  formatDate(date) {
    return date.toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_');
  }
}

// 创建并导出数据迁移服务实例
const dataMigrationService = new DataMigrationService();
export default dataMigrationService;