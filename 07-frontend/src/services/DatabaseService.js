/**
 * 数据库服务类
 * 使用 IndexedDB 实现数据持久化存储
 */
class DatabaseService {
  constructor() {
    this.dbName = 'EnterpriseBrainDB';
    this.version = 3; // 增加版本号以添加草稿箱存储
    this.db = null;
  }

  /**
   * 初始化数据库
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = (event) => {
        console.error('数据库初始化失败:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        
        // 确保所有必要的对象存储都存在
        this.ensureObjectStores();
        
        console.log('数据库初始化成功');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        
        // 创建物料库对象存储
        if (!this.db.objectStoreNames.contains('materials')) {
          const materialStore = this.db.createObjectStore('materials', { keyPath: 'id' });
          materialStore.createIndex('materialCode', 'materialCode', { unique: true });
          materialStore.createIndex('materialName', 'materialName', { unique: false });
          materialStore.createIndex('createTime', 'createTime', { unique: false });
        }

        // 创建BOM对象存储
        if (!this.db.objectStoreNames.contains('boms')) {
          const bomStore = this.db.createObjectStore('boms', { keyPath: 'id' });
          bomStore.createIndex('bomCode', 'bomCode', { unique: true });
          bomStore.createIndex('productName', 'productName', { unique: false });
        }

        // 创建生产BOM对象存储
        if (!this.db.objectStoreNames.contains('productionBoms')) {
          const productionBomStore = this.db.createObjectStore('productionBoms', { keyPath: 'id' });
          productionBomStore.createIndex('bomCode', 'bomCode', { unique: true });
        }

        // 创建销售BOM对象存储
        if (!this.db.objectStoreNames.contains('salesBoms')) {
          const salesBomStore = this.db.createObjectStore('salesBoms', { keyPath: 'id' });
          salesBomStore.createIndex('bomCode', 'bomCode', { unique: true });
        }

        // 创建设计BOM对象存储
        if (!this.db.objectStoreNames.contains('designBoms')) {
          const designBomStore = this.db.createObjectStore('designBoms', { keyPath: 'id' });
          designBomStore.createIndex('bomCode', 'bomCode', { unique: true });
        }

        // 创建生产BOM草稿对象存储
        if (!this.db.objectStoreNames.contains('productionBomDrafts')) {
          const productionBomDraftStore = this.db.createObjectStore('productionBomDrafts', { keyPath: 'draftId' });
          productionBomDraftStore.createIndex('bomCode', 'bomCode', { unique: false });
        }

        // 创建销售BOM草稿对象存储
        if (!this.db.objectStoreNames.contains('salesBomDrafts')) {
          const salesBomDraftStore = this.db.createObjectStore('salesBomDrafts', { keyPath: 'draftId' });
          salesBomDraftStore.createIndex('bomCode', 'bomCode', { unique: false });
        }

        // 创建设计BOM草稿对象存储
        if (!this.db.objectStoreNames.contains('designBomDrafts')) {
          const designBomDraftStore = this.db.createObjectStore('designBomDrafts', { keyPath: 'draftId' });
          designBomDraftStore.createIndex('bomCode', 'bomCode', { unique: false });
        }

        console.log('数据库结构初始化完成');
      };
    });
  }

  /**
   * 确保所有必要的对象存储都存在
   */
  ensureObjectStores() {
    if (!this.db) return;

    // 检查并创建物料库对象存储
    if (!this.db.objectStoreNames.contains('materials')) {
      try {
        const materialStore = this.db.createObjectStore('materials', { keyPath: 'id' });
        materialStore.createIndex('materialCode', 'materialCode', { unique: true });
        materialStore.createIndex('materialName', 'materialName', { unique: false });
        materialStore.createIndex('createTime', 'createTime', { unique: false });
        console.log('物料库对象存储创建成功');
      } catch (error) {
        console.warn('物料库对象存储创建失败:', error);
      }
    }

    // 检查并创建BOM对象存储
    if (!this.db.objectStoreNames.contains('boms')) {
      try {
        const bomStore = this.db.createObjectStore('boms', { keyPath: 'id' });
        bomStore.createIndex('bomCode', 'bomCode', { unique: true });
        bomStore.createIndex('productName', 'productName', { unique: false });
        console.log('BOM对象存储创建成功');
      } catch (error) {
        console.warn('BOM对象存储创建失败:', error);
      }
    }

    // 检查并创建生产BOM对象存储
    if (!this.db.objectStoreNames.contains('productionBoms')) {
      try {
        const productionBomStore = this.db.createObjectStore('productionBoms', { keyPath: 'id' });
        productionBomStore.createIndex('bomCode', 'bomCode', { unique: true });
        console.log('生产BOM对象存储创建成功');
      } catch (error) {
        console.warn('生产BOM对象存储创建失败:', error);
      }
    }

    // 检查并创建销售BOM对象存储
    if (!this.db.objectStoreNames.contains('salesBoms')) {
      try {
        const salesBomStore = this.db.createObjectStore('salesBoms', { keyPath: 'id' });
        salesBomStore.createIndex('bomCode', 'bomCode', { unique: true });
        console.log('销售BOM对象存储创建成功');
      } catch (error) {
        console.warn('销售BOM对象存储创建失败:', error);
      }
    }

    // 检查并创建设计BOM对象存储
    if (!this.db.objectStoreNames.contains('designBoms')) {
      try {
        const designBomStore = this.db.createObjectStore('designBoms', { keyPath: 'id' });
        designBomStore.createIndex('bomCode', 'bomCode', { unique: true });
        console.log('设计BOM对象存储创建成功');
      } catch (error) {
        console.warn('设计BOM对象存储创建失败:', error);
      }
    }

    // 检查并创建生产BOM草稿对象存储
    if (!this.db.objectStoreNames.contains('productionBomDrafts')) {
      try {
        const productionBomDraftStore = this.db.createObjectStore('productionBomDrafts', { keyPath: 'draftId' });
        productionBomDraftStore.createIndex('bomCode', 'bomCode', { unique: false });
        console.log('生产BOM草稿对象存储创建成功');
      } catch (error) {
        console.warn('生产BOM草稿对象存储创建失败:', error);
      }
    }

    // 检查并创建销售BOM草稿对象存储
    if (!this.db.objectStoreNames.contains('salesBomDrafts')) {
      try {
        const salesBomDraftStore = this.db.createObjectStore('salesBomDrafts', { keyPath: 'draftId' });
        salesBomDraftStore.createIndex('bomCode', 'bomCode', { unique: false });
        console.log('销售BOM草稿对象存储创建成功');
      } catch (error) {
        console.warn('销售BOM草稿对象存储创建失败:', error);
      }
    }

    // 检查并创建设计BOM草稿对象存储
    if (!this.db.objectStoreNames.contains('designBomDrafts')) {
      try {
        const designBomDraftStore = this.db.createObjectStore('designBomDrafts', { keyPath: 'draftId' });
        designBomDraftStore.createIndex('bomCode', 'bomCode', { unique: false });
        console.log('设计BOM草稿对象存储创建成功');
      } catch (error) {
        console.warn('设计BOM草稿对象存储创建失败:', error);
      }
    }
  }

  /**
   * 获取对象存储
   * @param {string} storeName - 存储名称
   * @param {string} mode - 模式 ('readonly' | 'readwrite')
   * @returns {IDBObjectStore}
   */
  getObjectStore(storeName, mode = 'readonly') {
    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  /**
   * 添加或更新物料
   * @param {Object} material - 物料数据
   * @returns {Promise}
   */
  async saveMaterial(material) {
    return new Promise((resolve, reject) => {
      // 克隆物料数据以避免Proxy对象问题
      const materialToSave = JSON.parse(JSON.stringify(material));
      
      const store = this.getObjectStore('materials', 'readwrite');
      const request = store.put(materialToSave);

      request.onsuccess = () => {
        console.log('物料保存成功:', materialToSave.id);
        resolve(materialToSave);
      };

      request.onerror = (event) => {
        console.error('物料保存失败:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * 批量保存物料
   * @param {Array} materials - 物料数组
   * @returns {Promise}
   */
  async saveMaterials(materials) {
    return new Promise((resolve, reject) => {
      // 克隆物料数据以避免Proxy对象问题
      const materialsToSave = JSON.parse(JSON.stringify(materials));
      
      const store = this.getObjectStore('materials', 'readwrite');
      let successCount = 0;
      let errorCount = 0;

      materialsToSave.forEach((material, index) => {
        const request = store.put(material);
        
        request.onsuccess = () => {
          successCount++;
          if (successCount + errorCount === materialsToSave.length) {
            if (errorCount === 0) {
              console.log(`批量保存物料成功，共${successCount}条`);
              resolve({ successCount, errorCount });
            } else {
              console.warn(`批量保存物料完成，成功${successCount}条，失败${errorCount}条`);
              resolve({ successCount, errorCount });
            }
          }
        };

        request.onerror = (event) => {
          errorCount++;
          console.error(`物料保存失败 (${material.id}):`, event.target.error);
          if (successCount + errorCount === materialsToSave.length) {
            if (errorCount === materialsToSave.length) {
              reject(new Error('所有物料保存失败'));
            } else {
              resolve({ successCount, errorCount });
            }
          }
        };
      });
    });
  }

  /**
   * 获取所有物料
   * @returns {Promise<Array>}
   */
  async getAllMaterials() {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('materials', 'readonly');
      const request = store.getAll();

      request.onsuccess = (event) => {
        const materials = event.target.result || [];
        console.log(`获取到${materials.length}条物料数据`);
        resolve(materials);
      };

      request.onerror = (event) => {
        console.error('获取物料数据失败:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * 根据ID删除物料
   * @param {number|string} id - 物料ID
   * @returns {Promise}
   */
  async deleteMaterial(id) {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('materials', 'readwrite');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('物料删除成功:', id);
        resolve();
      };

      request.onerror = (event) => {
        console.error('物料删除失败:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * 批量删除物料
   * @param {Array} ids - 物料ID数组
   * @returns {Promise}
   */
  async deleteMaterials(ids) {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('materials', 'readwrite');
      let successCount = 0;
      let errorCount = 0;

      ids.forEach((id, index) => {
        const request = store.delete(id);
        
        request.onsuccess = () => {
          successCount++;
          if (successCount + errorCount === ids.length) {
            if (errorCount === 0) {
              console.log(`批量删除物料成功，共${successCount}条`);
              resolve({ successCount, errorCount });
            } else {
              console.warn(`批量删除物料完成，成功${successCount}条，失败${errorCount}条`);
              resolve({ successCount, errorCount });
            }
          }
        };

        request.onerror = (event) => {
          errorCount++;
          console.error(`物料删除失败 (${id}):`, event.target.error);
          if (successCount + errorCount === ids.length) {
            if (errorCount === ids.length) {
              reject(new Error('所有物料删除失败'));
            } else {
              resolve({ successCount, errorCount });
            }
          }
        };
      });
    });
  }

  /**
   * 获取下一个物料ID
   * @returns {Promise<number>}
   */
  async getNextMaterialId() {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('materials', 'readonly');
      const request = store.getAllKeys();

      request.onsuccess = (event) => {
        const keys = event.target.result || [];
        const maxId = keys.length > 0 ? Math.max(...keys) : 0;
        const nextId = maxId + 1;
        console.log('下一个物料ID:', nextId);
        resolve(nextId);
      };

      request.onerror = (event) => {
        console.error('获取下一个物料ID失败:', event.target.error);
        // 如果获取失败，返回默认值
        resolve(1);
      };
    });
  }

  /**
   * 添加或更新BOM
   * @param {Object} bom - BOM数据
   * @returns {Promise}
   */
  async saveBom(bom, bomType = 'boms') {
    return new Promise((resolve, reject) => {
      // 克隆BOM数据以避免Proxy对象问题
      const bomToSave = JSON.parse(JSON.stringify(bom));
      
      const store = this.getObjectStore(bomType, 'readwrite');
      const request = store.put(bomToSave);

      request.onsuccess = () => {
        console.log('BOM保存成功:', bomToSave.id);
        resolve(bomToSave);
      };

      request.onerror = (event) => {
        console.error('BOM保存失败:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * 获取所有BOM
   * @param {string} bomType - BOM类型 ('boms' | 'productionBoms' | 'salesBoms' | 'designBoms')
   * @returns {Promise<Array>}
   */
  async getAllBoms(bomType = 'boms') {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(bomType, 'readonly');
      const request = store.getAll();

      request.onsuccess = (event) => {
        const boms = event.target.result || [];
        console.log(`获取到${boms.length}条${bomType}数据`);
        resolve(boms);
      };

      request.onerror = (event) => {
        console.error(`获取${bomType}数据失败:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * 根据ID删除BOM
   * @param {number|string} id - BOM ID
   * @param {string} bomType - BOM类型
   * @returns {Promise}
   */
  async deleteBom(id, bomType = 'boms') {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(bomType, 'readwrite');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('BOM删除成功:', id);
        resolve();
      };

      request.onerror = (event) => {
        console.error('BOM删除失败:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * 获取下一个BOM ID
   * @param {string} bomType - BOM类型
   * @returns {Promise<number>}
   */
  async getNextBomId(bomType = 'boms') {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(bomType, 'readonly');
      const request = store.getAllKeys();

      request.onsuccess = (event) => {
        const keys = event.target.result || [];
        const maxId = keys.length > 0 ? Math.max(...keys) : 0;
        const nextId = maxId + 1;
        console.log(`下一个${bomType} ID:`, nextId);
        resolve(nextId);
      };

      request.onerror = (event) => {
        console.error(`获取下一个${bomType} ID失败:`, event.target.error);
        // 如果获取失败，返回默认值
        resolve(1);
      };
    });
  }

  /**
   * 清空指定存储
   * @param {string} storeName - 存储名称
   * @returns {Promise}
   */
  async clearStore(storeName) {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(storeName, 'readwrite');
      const request = store.clear();

      request.onsuccess = () => {
        console.log(`存储${storeName}已清空`);
        resolve();
      };

      request.onerror = (event) => {
        console.error(`清空存储${storeName}失败:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * 删除数据库
   * @returns {Promise}
   */
  async deleteDatabase() {
    return new Promise((resolve, reject) => {
      this.db.close();
      const deleteReq = indexedDB.deleteDatabase(this.dbName);
      
      deleteReq.onsuccess = () => {
        console.log('数据库删除成功');
        resolve();
      };
      
      deleteReq.onerror = (event) => {
        console.error('数据库删除失败:', event.target.error);
        reject(event.target.error);
      };
      
      deleteReq.onblocked = () => {
        console.warn('数据库删除被阻止，请关闭其他标签页');
        reject(new Error('数据库删除被阻止'));
      };
    });
  }

  /**
   * 导出所有数据（备份）
   * @returns {Promise<Object>}
   */
  async exportAllData() {
    try {
      const data = {
        materials: await this.getAllMaterials(),
        boms: await this.getAllBoms('boms'),
        productionBoms: await this.getAllBoms('productionBoms'),
        salesBoms: await this.getAllBoms('salesBoms'),
        designBoms: await this.getAllBoms('designBoms'),
        exportTime: new Date().toISOString(),
        version: this.version
      };

      // 尝试加载草稿数据（可能不存在）
      try {
        data.productionBomDrafts = await this.getAllBoms('productionBomDrafts');
        data.salesBomDrafts = await this.getAllBoms('salesBomDrafts');
        data.designBomDrafts = await this.getAllBoms('designBomDrafts');
      } catch (error) {
        console.warn('草稿数据不存在，跳过');
      }
      
      // 保存到localStorage作为备份
      localStorage.setItem('enterpriseBrain_backup', JSON.stringify(data));
      console.log('数据已备份到localStorage');
      
      return data;
    } catch (error) {
      console.error('数据导出失败:', error);
      throw error;
    }
  }

  /**
   * 从备份恢复数据
   * @param {Object} backupData - 备份数据
   * @returns {Promise}
   */
  async restoreFromBackup(backupData) {
    try {
      let restoredCount = 0;
      
      // 恢复物料数据
      if (backupData.materials && backupData.materials.length > 0) {
        const existing = await this.getAllMaterials();
        if (existing.length === 0) {
          await this.saveMaterials(backupData.materials);
          restoredCount += backupData.materials.length;
          console.log(`恢复了${backupData.materials.length}条物料数据`);
        }
      }
      
      // 恢复各类BOM数据
      const bomTypes = ['boms', 'productionBoms', 'salesBoms', 'designBoms', 
                        'productionBomDrafts', 'salesBomDrafts', 'designBomDrafts'];
      
      for (const bomType of bomTypes) {
        if (backupData[bomType] && backupData[bomType].length > 0) {
          try {
            const existing = await this.getAllBoms(bomType);
            if (existing.length === 0) {
              for (const bom of backupData[bomType]) {
                await this.saveBom(bom, bomType);
              }
              restoredCount += backupData[bomType].length;
              console.log(`恢复了${backupData[bomType].length}条${bomType}数据`);
            }
          } catch (error) {
            console.warn(`恢复${bomType}失败:`, error);
          }
        }
      }
      
      console.log(`数据恢复完成，共恢复${restoredCount}条记录`);
      return restoredCount;
    } catch (error) {
      console.error('数据恢复失败:', error);
      throw error;
    }
  }
}

// 创建并导出数据库服务实例
const databaseService = new DatabaseService();
export default databaseService;