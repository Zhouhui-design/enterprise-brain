/**
 * 审计日志服务
 * 提供数据版本控制和操作审计功能
 */
class AuditService {
  constructor() {
    this.auditStoreName = 'auditLogs';
    this.maxLogEntries = 1000; // 最大日志条目数
  }

  /**
   * 记录操作日志
   * @param {Object} logEntry - 日志条目
   * @returns {Promise}
   */
  async logAction(logEntry) {
    try {
      const auditLog = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        userId: logEntry.userId || 'anonymous',
        action: logEntry.action, // CREATE, UPDATE, DELETE, IMPORT, EXPORT, SYNC等
        entityType: logEntry.entityType, // materials, productionBoms, designBoms, salesBoms
        entityId: logEntry.entityId,
        entityName: logEntry.entityName,
        oldValue: logEntry.oldValue,
        newValue: logEntry.newValue,
        ipAddress: logEntry.ipAddress || '',
        userAgent: logEntry.userAgent || navigator.userAgent,
        sessionId: logEntry.sessionId || this.getSessionId()
      };

      // 保存到IndexedDB
      await this.saveAuditLog(auditLog);
      
      // 同时保存到localStorage作为备份
      this.saveToLocalStorage(auditLog);
      
      // 检查并清理过期日志
      await this.cleanupOldLogs();
      
      return auditLog;
    } catch (error) {
      console.error('记录审计日志失败:', error);
      // 即使审计日志记录失败，也不影响主业务流程
    }
  }

  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * 获取会话ID
   * @returns {string} 会话ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * 保存审计日志到IndexedDB
   * @param {Object} auditLog - 审计日志
   * @returns {Promise}
   */
  async saveAuditLog(auditLog) {
    try {
      // 确保数据库已初始化
      await databaseService.init();
      
      // 由于DatabaseService可能没有auditLogs存储，我们需要直接使用IndexedDB
      const db = databaseService.db;
      if (!db.objectStoreNames.contains(this.auditStoreName)) {
        // 如果存储不存在，我们需要升级数据库版本
        console.warn(`审计日志存储 ${this.auditStoreName} 不存在，将在下次数据库升级时创建`);
        return;
      }
      
      const transaction = db.transaction([this.auditStoreName], 'readwrite');
      const store = transaction.objectStore(this.auditStoreName);
      await store.add(auditLog);
    } catch (error) {
      console.error('保存审计日志到IndexedDB失败:', error);
      throw error;
    }
  }

  /**
   * 保存到localStorage作为备份
   * @param {Object} auditLog - 审计日志
   */
  saveToLocalStorage(auditLog) {
    try {
      const logs = this.getLogsFromLocalStorage();
      logs.push(auditLog);
      
      // 保持最新的日志条目
      if (logs.length > this.maxLogEntries) {
        logs.splice(0, logs.length - this.maxLogEntries);
      }
      
      localStorage.setItem('auditLogs', JSON.stringify(logs));
    } catch (error) {
      console.error('保存审计日志到localStorage失败:', error);
    }
  }

  /**
   * 从localStorage获取日志
   * @returns {Array} 日志数组
   */
  getLogsFromLocalStorage() {
    try {
      const logsStr = localStorage.getItem('auditLogs');
      return logsStr ? JSON.parse(logsStr) : [];
    } catch (error) {
      console.error('从localStorage获取审计日志失败:', error);
      return [];
    }
  }

  /**
   * 清理过期日志
   * @returns {Promise}
   */
  async cleanupOldLogs() {
    try {
      // 清理localStorage中的过期日志
      const logs = this.getLogsFromLocalStorage();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // 保留30天内的日志
      
      const filteredLogs = logs.filter(log => 
        new Date(log.timestamp) > cutoffDate
      );
      
      if (filteredLogs.length < logs.length) {
        localStorage.setItem('auditLogs', JSON.stringify(filteredLogs));
      }
      
      // TODO: 清理IndexedDB中的过期日志（需要数据库升级后实现）
    } catch (error) {
      console.error('清理过期日志失败:', error);
    }
  }

  /**
   * 获取审计日志
   * @param {Object} filters - 过滤条件
   * @param {number} limit - 限制条数
   * @returns {Promise<Array>} 审计日志数组
   */
  async getAuditLogs(filters = {}, limit = 100) {
    try {
      // 优先从localStorage获取（因为IndexedDB可能还未实现）
      let logs = this.getLogsFromLocalStorage();
      
      // 应用过滤条件
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      
      if (filters.entityType) {
        logs = logs.filter(log => log.entityType === filters.entityType);
      }
      
      if (filters.dateFrom || filters.dateTo) {
        logs = logs.filter(log => {
          const logDate = new Date(log.timestamp);
          return (
            (!filters.dateFrom || logDate >= new Date(filters.dateFrom)) &&
            (!filters.dateTo || logDate <= new Date(filters.dateTo))
          );
        });
      }
      
      // 按时间倒序排列
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // 限制返回条数
      return logs.slice(0, limit);
    } catch (error) {
      console.error('获取审计日志失败:', error);
      return [];
    }
  }

  /**
   * 根据实体ID获取变更历史
   * @param {string} entityType - 实体类型
   * @param {string|number} entityId - 实体ID
   * @returns {Promise<Array>} 变更历史
   */
  async getEntityHistory(entityType, entityId) {
    try {
      const logs = await this.getAuditLogs({
        entityType: entityType,
        entityId: entityId
      }, 1000);
      
      return logs;
    } catch (error) {
      console.error('获取实体变更历史失败:', error);
      return [];
    }
  }

  /**
   * 导出审计日志
   * @param {Object} filters - 过滤条件
   * @returns {Promise<string>} CSV格式的日志数据
   */
  async exportAuditLogs(filters = {}) {
    try {
      const logs = await this.getAuditLogs(filters, 10000);
      
      // 转换为CSV格式
      const headers = ['时间戳', '用户ID', '操作', '实体类型', '实体ID', '实体名称', 'IP地址'];
      const rows = logs.map(log => [
        log.timestamp,
        log.userId,
        log.action,
        log.entityType,
        log.entityId,
        log.entityName,
        log.ipAddress
      ]);
      
      // 添加标题行
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      return csvContent;
    } catch (error) {
      console.error('导出审计日志失败:', error);
      throw new Error(`导出审计日志失败: ${error.message}`);
    }
  }

  /**
   * 清空审计日志
   * @returns {Promise}
   */
  async clearAuditLogs() {
    try {
      // 清空localStorage
      localStorage.removeItem('auditLogs');
      
      // TODO: 清空IndexedDB中的日志（需要数据库升级后实现）
      
      return { success: true, message: '审计日志已清空' };
    } catch (error) {
      console.error('清空审计日志失败:', error);
      throw new Error(`清空审计日志失败: ${error.message}`);
    }
  }

  /**
   * 记录物料创建操作
   * @param {Object} material - 物料数据
   * @param {string} userId - 用户ID
   */
  async logMaterialCreate(material, userId) {
    await this.logAction({
      userId: userId,
      action: 'CREATE',
      entityType: 'materials',
      entityId: material.id,
      entityName: material.materialName,
      newValue: material
    });
  }

  /**
   * 记录物料更新操作
   * @param {Object} oldMaterial - 旧物料数据
   * @param {Object} newMaterial - 新物料数据
   * @param {string} userId - 用户ID
   */
  async logMaterialUpdate(oldMaterial, newMaterial, userId) {
    await this.logAction({
      userId: userId,
      action: 'UPDATE',
      entityType: 'materials',
      entityId: newMaterial.id,
      entityName: newMaterial.materialName,
      oldValue: oldMaterial,
      newValue: newMaterial
    });
  }

  /**
   * 记录物料删除操作
   * @param {Object} material - 物料数据
   * @param {string} userId - 用户ID
   */
  async logMaterialDelete(material, userId) {
    await this.logAction({
      userId: userId,
      action: 'DELETE',
      entityType: 'materials',
      entityId: material.id,
      entityName: material.materialName,
      oldValue: material
    });
  }

  /**
   * 记录BOM创建操作
   * @param {Object} bom - BOM数据
   * @param {string} bomType - BOM类型
   * @param {string} userId - 用户ID
   */
  async logBomCreate(bom, bomType, userId) {
    await this.logAction({
      userId: userId,
      action: 'CREATE',
      entityType: bomType,
      entityId: bom.id,
      entityName: bom.bomName || bom.productName,
      newValue: bom
    });
  }

  /**
   * 记录BOM更新操作
   * @param {Object} oldBom - 旧BOM数据
   * @param {Object} newBom - 新BOM数据
   * @param {string} bomType - BOM类型
   * @param {string} userId - 用户ID
   */
  async logBomUpdate(oldBom, newBom, bomType, userId) {
    await this.logAction({
      userId: userId,
      action: 'UPDATE',
      entityType: bomType,
      entityId: newBom.id,
      entityName: newBom.bomName || newBom.productName,
      oldValue: oldBom,
      newValue: newBom
    });
  }

  /**
   * 记录BOM删除操作
   * @param {Object} bom - BOM数据
   * @param {string} bomType - BOM类型
   * @param {string} userId - 用户ID
   */
  async logBomDelete(bom, bomType, userId) {
    await this.logAction({
      userId: userId,
      action: 'DELETE',
      entityType: bomType,
      entityId: bom.id,
      entityName: bom.bomName || bom.productName,
      oldValue: bom
    });
  }

  /**
   * 记录数据导入操作
   * @param {string} entityType - 实体类型
   * @param {number} count - 导入条数
   * @param {string} userId - 用户ID
   */
  async logDataImport(entityType, count, userId) {
    await this.logAction({
      userId: userId,
      action: 'IMPORT',
      entityType: entityType,
      entityName: `导入${count}条数据`,
      newValue: { count: count }
    });
  }

  /**
   * 记录数据导出操作
   * @param {string} entityType - 实体类型
   * @param {number} count - 导出条数
   * @param {string} userId - 用户ID
   */
  async logDataExport(entityType, count, userId) {
    await this.logAction({
      userId: userId,
      action: 'EXPORT',
      entityType: entityType,
      entityName: `导出${count}条数据`,
      newValue: { count: count }
    });
  }

  /**
   * 记录数据同步操作
   * @param {Object} syncResult - 同步结果
   * @param {string} userId - 用户ID
   */
  async logDataSync(syncResult, userId) {
    await this.logAction({
      userId: userId,
      action: 'SYNC',
      entityType: 'system',
      entityName: '数据同步',
      newValue: syncResult
    });
  }
}

// 创建并导出审计服务实例
const auditService = new AuditService();
export default auditService;