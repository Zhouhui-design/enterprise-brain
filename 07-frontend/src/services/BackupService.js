/**
 * 数据备份和恢复服务
 * 提供完整的数据备份和恢复功能
 */
class BackupService {
  constructor() {
    this.backupPrefix = 'enterprise_brain_backup_';
  }

  /**
   * 创建完整数据备份
   * @returns {Promise<Object>} 备份信息
   */
  async createFullBackup() {
    try {
      // 获取所有数据
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {}
      };

      // 备份物料数据
      const materials = await databaseService.getAllMaterials();
      backupData.data.materials = materials;

      // 备份各种BOM数据
      const productionBoms = await databaseService.getAllBoms('productionBoms');
      backupData.data.productionBoms = productionBoms;

      const designBoms = await databaseService.getAllBoms('designBoms');
      backupData.data.designBoms = designBoms;

      const salesBoms = await databaseService.getAllBoms('salesBoms');
      backupData.data.salesBoms = salesBoms;

      // 创建备份文件
      const backupFileName = `${this.backupPrefix}${new Date().getTime()}.json`;
      const backupBlob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });

      // 保存到本地存储作为额外保护
      localStorage.setItem(backupFileName, JSON.stringify(backupData));

      return {
        success: true,
        fileName: backupFileName,
        timestamp: backupData.timestamp,
        dataCounts: {
          materials: materials.length,
          productionBoms: productionBoms.length,
          designBoms: designBoms.length,
          salesBoms: salesBoms.length
        }
      };
    } catch (error) {
      console.error('创建备份失败:', error);
      throw new Error(`备份创建失败: ${error.message}`);
    }
  }

  /**
   * 恢复数据备份
   * @param {Object} backupData - 备份数据
   * @returns {Promise<Object>} 恢复结果
   */
  async restoreBackup(backupData) {
    try {
      // 验证备份数据
      if (!backupData || !backupData.data) {
        throw new Error('无效的备份数据格式');
      }

      // 清空现有数据
      await databaseService.clearStore('materials');
      await databaseService.clearStore('productionBoms');
      await databaseService.clearStore('designBoms');
      await databaseService.clearStore('salesBoms');

      // 恢复物料数据
      if (backupData.data.materials && backupData.data.materials.length > 0) {
        await databaseService.saveMaterials(backupData.data.materials);
      }

      // 恢复BOM数据
      if (backupData.data.productionBoms && backupData.data.productionBoms.length > 0) {
        for (const bom of backupData.data.productionBoms) {
          await databaseService.saveBom(bom, 'productionBoms');
        }
      }

      if (backupData.data.designBoms && backupData.data.designBoms.length > 0) {
        for (const bom of backupData.data.designBoms) {
          await databaseService.saveBom(bom, 'designBoms');
        }
      }

      if (backupData.data.salesBoms && backupData.data.salesBoms.length > 0) {
        for (const bom of backupData.data.salesBoms) {
          await databaseService.saveBom(bom, 'salesBoms');
        }
      }

      return {
        success: true,
        message: '数据恢复成功',
        dataCounts: {
          materials: backupData.data.materials ? backupData.data.materials.length : 0,
          productionBoms: backupData.data.productionBoms ? backupData.data.productionBoms.length : 0,
          designBoms: backupData.data.designBoms ? backupData.data.designBoms.length : 0,
          salesBoms: backupData.data.salesBoms ? backupData.data.salesBoms.length : 0
        }
      };
    } catch (error) {
      console.error('恢复备份失败:', error);
      throw new Error(`数据恢复失败: ${error.message}`);
    }
  }

  /**
   * 下载备份文件
   * @param {string} fileName - 文件名
   * @param {Object} backupData - 备份数据
   */
  downloadBackupFile(fileName, backupData) {
    try {
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = fileName;
      link.click();
      
      // 清理URL对象
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('下载备份文件失败:', error);
      throw new Error(`下载备份文件失败: ${error.message}`);
    }
  }

  /**
   * 从文件恢复备份
   * @param {File} file - 备份文件
   * @returns {Promise<Object>} 恢复结果
   */
  async restoreFromFile(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const backupData = JSON.parse(event.target.result);
            const result = await this.restoreBackup(backupData);
            resolve(result);
          } catch (error) {
            reject(new Error(`解析备份文件失败: ${error.message}`));
          }
        };
        reader.onerror = () => {
          reject(new Error('读取备份文件失败'));
        };
        reader.readAsText(file);
      } catch (error) {
        reject(new Error(`处理备份文件失败: ${error.message}`));
      }
    });
  }

  /**
   * 获取备份列表
   * @returns {Promise<Array>} 备份列表
   */
  async getBackupList() {
    try {
      const backups = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.backupPrefix)) {
          const backupData = JSON.parse(localStorage.getItem(key));
          backups.push({
            fileName: key,
            timestamp: backupData.timestamp,
            dataCounts: backupData.dataCounts
          });
        }
      }
      
      // 按时间排序，最新的在前面
      backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return backups;
    } catch (error) {
      console.error('获取备份列表失败:', error);
      return [];
    }
  }

  /**
   * 删除备份
   * @param {string} fileName - 备份文件名
   */
  async deleteBackup(fileName) {
    try {
      localStorage.removeItem(fileName);
      return { success: true, message: '备份删除成功' };
    } catch (error) {
      console.error('删除备份失败:', error);
      throw new Error(`删除备份失败: ${error.message}`);
    }
  }
}

// 创建并导出备份服务实例
const backupService = new BackupService();
export default backupService;