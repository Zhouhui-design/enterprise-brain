import materialAPI from '@/api/material'

/**
 * 物料API服务 - 使用后端数据库
 * 这个服务会替代IndexedDB，直接与后端数据库交互
 */
class MaterialAPIService {
  /**
   * 获取所有物料
   * @returns {Promise<Array>}
   */
  async getAllMaterials() {
    try {
      // request.js的响应拦截器已经处理了code，直接返回数据数组
      const data = await materialAPI.getAllMaterials()
      console.log(`从后端获取到${data.length}条物料数据`)
      // 将后端返回的下划线命名转换为驼峰命名
      const materials = data.map(item => this.convertToCamelCase(item))
      return materials
    } catch (error) {
      console.error('获取物料列表失败:', error)
      throw error
    }
  }

  /**
   * 将下划线命名转换为驼峰命名
   * @param {Object} obj - 带有下划线命名的对象
   * @returns {Object} 驼峰命名的对象
   */
  convertToCamelCase(obj) {
    if (!obj) return obj
    
    // 安全解析source字段
    let sourceValue = []
    const sourceField = obj.source
    if (sourceField) {
      if (typeof sourceField === 'string') {
        try {
          // 尝试解析JSON字符串
          const trimmed = sourceField.trim()
          if (trimmed && trimmed !== '[]' && trimmed !== '') {
            sourceValue = JSON.parse(trimmed)
          }
        } catch (error) {
          // JSON解析失败，尝试按逗号分割
          const materialCode = obj.materialCode || obj.material_code || 'unknown'
          console.warn(`物料 ${materialCode} 的source字段JSON解析失败，使用逗号分割: ${sourceField}`)
          sourceValue = sourceField.split(',').map(s => s.trim()).filter(s => s)
        }
      } else if (Array.isArray(sourceField)) {
        sourceValue = sourceField
      }
    }
    
    // ✅ 优先使用camelCase字段，如果不存在则从snake_case转换
    return {
      id: obj.id,
      materialCode: obj.materialCode || obj.material_code,
      bomNumber: obj.bomNumber || obj.bom_number,
      materialName: obj.materialName || obj.material_name,
      sizeSpec: obj.sizeSpec || obj.size_spec,
      color: obj.color,
      material: obj.material,
      majorCategory: obj.majorCategory || obj.major_category,
      middleCategory: obj.middleCategory || obj.middle_category,
      minorCategory: obj.minorCategory || obj.minor_category,
      model: obj.model,
      series: obj.series,
      source: sourceValue,
      description: obj.description,
      materialImage: obj.materialImage || obj.material_image,
      baseUnit: obj.baseUnit || obj.base_unit,
      saleUnit: obj.saleUnit || obj.sale_unit,
      saleConversionRate: obj.saleConversionRate || obj.sale_conversion_rate,
      purchaseUnit: obj.purchaseUnit || obj.purchase_unit,
      purchaseConversionRate: obj.purchaseConversionRate || obj.purchase_conversion_rate,
      kgPerPcs: obj.kgPerPcs || obj.kg_per_pcs,
      pcsPerKg: obj.pcsPerKg || obj.pcs_per_kg,
      processName: obj.processName || obj.process_name,
      outputProcessName: obj.outputProcessName || obj.output_process_name || '', // 产出工序名称
      standardTime: obj.standardTime || obj.standard_time,
      quotaTime: obj.quotaTime || obj.quota_time,
      minimumPackagingQuantity: parseFloat(obj.minimumPackagingQuantity || obj.minimum_packaging_quantity) || 1, // 最小包装量
      processPrice: parseFloat(obj.processPrice || obj.process_price) || 0,
      materialLoss: obj.materialLoss || obj.material_loss,
      purchaseCycle: obj.purchaseCycle || obj.purchase_cycle,
      purchasePrice: parseFloat(obj.purchasePrice || obj.purchase_price) || 0,
      basePrice: parseFloat(obj.basePrice || obj.base_price) || 0,
      status: obj.status,
      createTime: obj.createTime || obj.created_at,
      updateTime: obj.updateTime || obj.updated_at
    }
  }

  /**
   * 添加或更新物料
   * @param {Object} material - 物料数据
   * @returns {Promise}
   */
  async saveMaterial(material) {
    try {
      console.log('=== 开始保存物料 ===')
      console.log('物料数据:', JSON.stringify(material, null, 2))
      console.log('是否有ID:', material.id)
      
      let data
      if (material.id) {
        // 更新物料
        console.log('执行更新操作, ID:', material.id)
        data = await materialAPI.updateMaterial(material.id, material)
      } else {
        // 创建物料
        console.log('执行创建操作')
        data = await materialAPI.createMaterial(material)
      }
      
      console.log('后端返回结果:', data)
      console.log('物料保存成功:', material.material_name || material.materialName)
      return data
    } catch (error) {
      console.error('=== 保存物料异常 ===')
      console.error('错误对象:', error)
      console.error('错误消息:', error.message)
      console.error('错误堆栈:', error.stack)
      if (error.response) {
        console.error('响应状态:', error.response.status)
        console.error('响应数据:', error.response.data)
      }
      throw error
    }
  }

  /**
   * 批量保存物料
   * @param {Array} materials - 物料数组
   * @returns {Promise}
   */
  async saveMaterials(materials) {
    try {
      const data = await materialAPI.batchCreateMaterials(materials)
      console.log(`批量保存物料成功，共${data.successCount}条`)
      return data
    } catch (error) {
      console.error('批量保存物料失败:', error)
      throw error
    }
  }

  /**
   * 批量创建物料（用于导入）
   * @param {Array} materials - 物料数组
   * @returns {Promise}
   */
  async batchCreateMaterials(materials) {
    try {
      const data = await materialAPI.batchCreateMaterials(materials)
      console.log(`批量创建物料成功，共${data.successCount}条`)
      return data
    } catch (error) {
      console.error('批量创建物料失败:', error)
      throw error
    }
  }

  /**
   * 根据ID删除物料
   * @param {number|string} id - 物料ID
   * @returns {Promise}
   */
  async deleteMaterial(id) {
    try {
      const data = await materialAPI.deleteMaterial(id)
      console.log('物料删除成功:', id)
      return data
    } catch (error) {
      console.error('删除物料失败:', error)
      throw error
    }
  }

  /**
   * 批量删除物料
   * @param {Array} ids - 物料ID数组
   * @returns {Promise}
   */
  async deleteMaterials(ids) {
    try {
      const data = await materialAPI.batchDeleteMaterials(ids)
      console.log(`批量删除物料成功，共${data.successCount}条`)
      return data
    } catch (error) {
      console.error('批量删除物料失败:', error)
      throw error
    }
  }

  /**
   * 搜索物料
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array>}
   */
  async searchMaterials(keyword) {
    try {
      const response = await materialAPI.searchMaterials(keyword)
      if (response.code === 200) {
        console.log(`搜索到${response.data.length}条物料数据`)
        return response.data
      } else {
        throw new Error(response.message || '搜索物料失败')
      }
    } catch (error) {
      console.error('搜索物料失败:', error)
      throw error
    }
  }

  /**
   * 根据物料编码获取物料
   * @param {string} materialCode - 物料编码
   * @returns {Promise<Object>}
   */
  async getMaterialByCode(materialCode) {
    try {
      const data = await materialAPI.getMaterialByCode(materialCode)
      console.log(`获取物料 ${materialCode} 成功`)
      // 转换为驼峰命名
      return this.convertToCamelCase(data)
    } catch (error) {
      console.error(`获取物料 ${materialCode} 失败:`, error)
      throw error
    }
  }

  /**
   * 获取下一个物料ID
   * 这个方法从后端自动生成，前端不再需要管理ID
   * @returns {Promise<number>}
   */
  async getNextMaterialId() {
    // 后端数据库会自动生成ID，这里返回一个占位值
    return 1
  }
}

// 创建单例
const materialApiService = new MaterialAPIService()

export default materialApiService
