/**
 * 数据同步服务
 * 提供与后端服务器的数据同步功能
 */
class SyncService {
  constructor() {
    this.syncEndpoint = '/api/sync';
    this.isSyncing = false;
    this.lastSyncTime = null;
  }

  /**
   * 设置同步端点
   * @param {string} endpoint - 同步API端点
   */
  setSyncEndpoint(endpoint) {
    this.syncEndpoint = endpoint;
  }

  /**
   * 执行完整数据同步
   * @param {Object} options - 同步选项
   * @returns {Promise<Object>} 同步结果
   */
  async syncAllData(options = {}) {
    if (this.isSyncing) {
      throw new Error('同步正在进行中，请稍后再试');
    }

    this.isSyncing = true;
    
    try {
      // 获取本地所有数据
      const localData = await this.getLocalData();
      
      // 发送到服务器
      const serverResponse = await this.sendToServer(localData, options);
      
      // 处理服务器响应
      const syncResult = await this.processServerResponse(serverResponse);
      
      // 更新最后同步时间
      this.lastSyncTime = new Date().toISOString();
      
      return {
        success: true,
        message: '数据同步完成',
        lastSyncTime: this.lastSyncTime,
        ...syncResult
      };
    } catch (error) {
      console.error('数据同步失败:', error);
      throw new Error(`数据同步失败: ${error.message}`);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 获取本地所有数据
   * @returns {Promise<Object>} 本地数据
   */
  async getLocalData() {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        materials: await databaseService.getAllMaterials(),
        productionBoms: await databaseService.getAllBoms('productionBoms'),
        designBoms: await databaseService.getAllBoms('designBoms'),
        salesBoms: await databaseService.getAllBoms('salesBoms')
      };
      
      return data;
    } catch (error) {
      console.error('获取本地数据失败:', error);
      throw new Error(`获取本地数据失败: ${error.message}`);
    }
  }

  /**
   * 发送数据到服务器
   * @param {Object} data - 要发送的数据
   * @param {Object} options - 发送选项
   * @returns {Promise<Object>} 服务器响应
   */
  async sendToServer(data, options = {}) {
    try {
      const response = await fetch(`${this.syncEndpoint}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('发送数据到服务器失败:', error);
      throw new Error(`发送数据到服务器失败: ${error.message}`);
    }
  }

  /**
   * 从服务器获取数据
   * @param {Object} options - 获取选项
   * @returns {Promise<Object>} 服务器数据
   */
  async fetchFromServer(options = {}) {
    try {
      const response = await fetch(`${this.syncEndpoint}/download`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
      
      if (!response.ok) {
        throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('从服务器获取数据失败:', error);
      throw new Error(`从服务器获取数据失败: ${error.message}`);
    }
  }

  /**
   * 处理服务器响应
   * @param {Object} serverResponse - 服务器响应
   * @returns {Promise<Object>} 处理结果
   */
  async processServerResponse(serverResponse) {
    try {
      const result = {
        uploaded: 0,
        downloaded: 0,
        conflicts: 0
      };
      
      // 处理上传确认
      if (serverResponse.uploaded) {
        result.uploaded = serverResponse.uploaded;
      }
      
      // 处理下载数据
      if (serverResponse.data) {
        // 合并服务器数据到本地
        const mergeResult = await this.mergeServerData(serverResponse.data);
        result.downloaded = mergeResult.merged;
        result.conflicts = mergeResult.conflicts;
      }
      
      return result;
    } catch (error) {
      console.error('处理服务器响应失败:', error);
      throw new Error(`处理服务器响应失败: ${error.message}`);
    }
  }

  /**
   * 合并服务器数据到本地
   * @param {Object} serverData - 服务器数据
   * @returns {Promise<Object>} 合并结果
   */
  async mergeServerData(serverData) {
    try {
      const result = {
        merged: 0,
        conflicts: 0
      };
      
      // 合并物料数据
      if (serverData.materials && serverData.materials.length > 0) {
        const mergeResult = await this.mergeMaterials(serverData.materials);
        result.merged += mergeResult.merged;
        result.conflicts += mergeResult.conflicts;
      }
      
      // 合并生产BOM数据
      if (serverData.productionBoms && serverData.productionBoms.length > 0) {
        const mergeResult = await this.mergeBoms(serverData.productionBoms, 'productionBoms');
        result.merged += mergeResult.merged;
        result.conflicts += mergeResult.conflicts;
      }
      
      // 合并设计BOM数据
      if (serverData.designBoms && serverData.designBoms.length > 0) {
        const mergeResult = await this.mergeBoms(serverData.designBoms, 'designBoms');
        result.merged += mergeResult.merged;
        result.conflicts += mergeResult.conflicts;
      }
      
      // 合并销售BOM数据
      if (serverData.salesBoms && serverData.salesBoms.length > 0) {
        const mergeResult = await this.mergeBoms(serverData.salesBoms, 'salesBoms');
        result.merged += mergeResult.merged;
        result.conflicts += mergeResult.conflicts;
      }
      
      return result;
    } catch (error) {
      console.error('合并服务器数据失败:', error);
      throw new Error(`合并服务器数据失败: ${error.message}`);
    }
  }

  /**
   * 合并物料数据
   * @param {Array} serverMaterials - 服务器物料数据
   * @returns {Promise<Object>} 合并结果
   */
  async mergeMaterials(serverMaterials) {
    try {
      const localMaterials = await databaseService.getAllMaterials();
      const result = {
        merged: 0,
        conflicts: 0
      };
      
      // 创建本地物料映射
      const localMap = new Map();
      localMaterials.forEach(material => {
        localMap.set(material.materialCode, material);
      });
      
      // 处理服务器物料数据
      for (const serverMaterial of serverMaterials) {
        const localMaterial = localMap.get(serverMaterial.materialCode);
        
        if (!localMaterial) {
          // 新增物料
          await databaseService.saveMaterial(serverMaterial);
          result.merged++;
        } else {
          // 检查是否有冲突（基于更新时间）
          const serverUpdateTime = new Date(serverMaterial.updateTime || serverMaterial.createTime);
          const localUpdateTime = new Date(localMaterial.updateTime || localMaterial.createTime);
          
          if (serverUpdateTime > localUpdateTime) {
            // 服务器数据更新，使用服务器数据
            await databaseService.saveMaterial(serverMaterial);
            result.merged++;
          } else if (serverUpdateTime < localUpdateTime) {
            // 本地数据更新，保持本地数据
            result.conflicts++;
          }
          // 如果时间相同，保持本地数据不变
        }
      }
      
      return result;
    } catch (error) {
      console.error('合并物料数据失败:', error);
      throw new Error(`合并物料数据失败: ${error.message}`);
    }
  }

  /**
   * 合并BOM数据
   * @param {Array} serverBoms - 服务器BOM数据
   * @param {string} bomType - BOM类型
   * @returns {Promise<Object>} 合并结果
   */
  async mergeBoms(serverBoms, bomType) {
    try {
      const localBoms = await databaseService.getAllBoms(bomType);
      const result = {
        merged: 0,
        conflicts: 0
      };
      
      // 创建本地BOM映射
      const localMap = new Map();
      localBoms.forEach(bom => {
        localMap.set(bom.bomCode, bom);
      });
      
      // 处理服务器BOM数据
      for (const serverBom of serverBoms) {
        const localBom = localMap.get(serverBom.bomCode);
        
        if (!localBom) {
          // 新增BOM
          await databaseService.saveBom(serverBom, bomType);
          result.merged++;
        } else {
          // 检查是否有冲突（基于更新时间）
          const serverUpdateTime = new Date(serverBom.updateTime || serverBom.createTime);
          const localUpdateTime = new Date(localBom.updateTime || localBom.createTime);
          
          if (serverUpdateTime > localUpdateTime) {
            // 服务器数据更新，使用服务器数据
            await databaseService.saveBom(serverBom, bomType);
            result.merged++;
          } else if (serverUpdateTime < localUpdateTime) {
            // 本地数据更新，保持本地数据
            result.conflicts++;
          }
          // 如果时间相同，保持本地数据不变
        }
      }
      
      return result;
    } catch (error) {
      console.error(`合并${bomType}数据失败:`, error);
      throw new Error(`合并${bomType}数据失败: ${error.message}`);
    }
  }

  /**
   * 检查同步状态
   * @returns {Object} 同步状态
   */
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      endpoint: this.syncEndpoint
    };
  }

  /**
   * 设置最后同步时间
   * @param {string} timestamp - 时间戳
   */
  setLastSyncTime(timestamp) {
    this.lastSyncTime = timestamp;
  }
}

// 创建并导出同步服务实例
const syncService = new SyncService();
export default syncService;