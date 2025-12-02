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
      const response = await materialAPI.getAllMaterials()
      if (response.code === 200) {
        console.log(`从后端获取到${response.data.length}条物料数据`)
        // 将后端返回的下划线命名转换为驼峰命名
        const materials = response.data.map(item => this.convertToCamelCase(item))
        return materials
      } else {
        throw new Error(response.message || '获取物料列表失败')
      }
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
    
    return {
      id: obj.id,
      materialCode: obj.material_code,
      bomNumber: obj.bom_number,
      materialName: obj.material_name,
      sizeSpec: obj.size_spec,
      color: obj.color,
      material: obj.material,
      majorCategory: obj.major_category,
      middleCategory: obj.middle_category,
      minorCategory: obj.minor_category,
      model: obj.model,
      series: obj.series,
      source: obj.source ? (typeof obj.source === 'string' ? JSON.parse(obj.source) : obj.source) : [],
      description: obj.description,
      materialImage: obj.material_image,
      baseUnit: obj.base_unit,
      saleUnit: obj.sale_unit,
      saleConversionRate: obj.sale_conversion_rate,
      purchaseUnit: obj.purchase_unit,
      purchaseConversionRate: obj.purchase_conversion_rate,
      kgPerPcs: obj.kg_per_pcs,
      pcsPerKg: obj.pcs_per_kg,
      processName: obj.process_name,
      standardTime: obj.standard_time,
      quotaTime: obj.quota_time,
      processPrice: obj.process_price,
      purchaseCycle: obj.purchase_cycle,
      purchasePrice: obj.purchase_price,
      status: obj.status,
      createTime: obj.created_at,
      updateTime: obj.updated_at
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
      
      let response
      if (material.id) {
        // 更新物料
        console.log('执行更新操作, ID:', material.id)
        response = await materialAPI.updateMaterial(material.id, material)
      } else {
        // 创建物料
        console.log('执行创建操作')
        response = await materialAPI.createMaterial(material)
      }
      
      console.log('后端返回结果:', response)
      
      if (response.code === 200) {
        console.log('物料保存成功:', material.material_name || material.materialName)
        return response.data
      } else {
        console.error('后端返回错误:', response)
        throw new Error(response.message || '保存物料失败')
      }
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
      const response = await materialAPI.batchCreateMaterials(materials)
      if (response.code === 200) {
        console.log(`批量保存物料成功，共${response.data.successCount}条`)
        return response.data
      } else {
        throw new Error(response.message || '批量保存物料失败')
      }
    } catch (error) {
      console.error('批量保存物料失败:', error)
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
      const response = await materialAPI.deleteMaterial(id)
      if (response.code === 200) {
        console.log('物料删除成功:', id)
        return response.data
      } else {
        throw new Error(response.message || '删除物料失败')
      }
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
      const response = await materialAPI.batchDeleteMaterials(ids)
      if (response.code === 200) {
        console.log(`批量删除物料成功，共${response.data.successCount}条`)
        return response.data
      } else {
        throw new Error(response.message || '批量删除物料失败')
      }
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
