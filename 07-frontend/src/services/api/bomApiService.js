import productionBomAPI from '@/api/productionBom'

/**
 * 生产BOM API服务 - 使用后端数据库
 */
class BOMAPIService {
  /**
   * 获取所有生产BOM
   */
  async getAllBoms() {
    try {
      const response = await productionBomAPI.getAllBOMs()
      if (response.code === 200) {
        console.log(`从后端获取到${response.data.length}条生产BOM数据`)
        // 转换数据格式
        return response.data.map(item => this.convertFromBackend(item))
      } else {
        throw new Error(response.message || '获取生产BOM列表失败')
      }
    } catch (error) {
      console.error('获取生产BOM列表失败:', error)
      throw error
    }
  }

  /**
   * 获取BOM详情（包含子件）
   */
  async getBomDetail(id) {
    try {
      const response = await productionBomAPI.getBOMDetail(id)
      if (response.code === 200) {
        return this.convertFromBackend(response.data, true)
      } else {
        throw new Error(response.message || '获取BOM详情失败')
      }
    } catch (error) {
      console.error('获取BOM详情失败:', error)
      throw error
    }
  }

  /**
   * 保存BOM（创建或更新）
   */
  async saveBom(bomData) {
    try {
      console.log('=== 开始保存BOM ===')
      console.log('BOM数据:', JSON.stringify(bomData, null, 2))
      
      // 转换为后端格式
      const backendData = this.convertToBackend(bomData)
      
      let response
      if (bomData.id) {
        // 更新
        console.log('执行更新操作, ID:', bomData.id)
        response = await productionBomAPI.updateBOM(bomData.id, backendData)
      } else {
        // 创建
        console.log('执行创建操作')
        response = await productionBomAPI.createBOM(backendData)
      }
      
      if (response.code === 200) {
        console.log('BOM保存成功')
        return response.data
      } else {
        throw new Error(response.message || '保存BOM失败')
      }
    } catch (error) {
      console.error('保存BOM失败:', error)
      throw error
    }
  }

  /**
   * 删除BOM
   */
  async deleteBom(id) {
    try {
      const response = await productionBomAPI.deleteBOM(id)
      if (response.code === 200) {
        console.log('BOM删除成功:', id)
        return true
      } else {
        throw new Error(response.message || '删除BOM失败')
      }
    } catch (error) {
      console.error('删除BOM失败:', error)
      throw error
    }
  }

  /**
   * 批量删除BOM
   */
  async deleteBoms(ids) {
    try {
      const response = await productionBomAPI.batchDeleteBOMs(ids)
      if (response.code === 200) {
        console.log(`批量删除BOM成功，共${response.data.successCount}条`)
        return response.data
      } else {
        throw new Error(response.message || '批量删除BOM失败')
      }
    } catch (error) {
      console.error('批量删除BOM失败:', error)
      throw error
    }
  }

  /**
   * 从后端格式转换为前端格式
   */
  convertFromBackend(bomData, includeChildren = false) {
    const converted = {
      id: bomData.id,
      bomCode: bomData.bom_code,
      bomName: bomData.bom_name,
      productCode: bomData.product_code,
      productName: bomData.product_name,
      version: bomData.version,
      status: bomData.status,
      designer: bomData.designer,
      itemCount: bomData.material_count,
      remark: bomData.remark,
      reviewer: bomData.auditor,
      effectiveDate: bomData.effective_date,
      createTime: bomData.created_at,
      updateTime: bomData.updated_at
    }
    
    // 如果包含子件，转换子件格式
    if (includeChildren && bomData.childItems) {
      converted.childItems = bomData.childItems.map(item => ({
        id: item.id,
        sequence: item.sequence,
        level: item.level,
        childCode: item.component_code,
        childName: item.component_name,
        standardQty: item.standard_quantity,
        outputProcess: item.output_process,
        source: item.component_source,
        processWage: item.process_wage,
        materialLoss: item.material_loss,
        materialPrice: item.material_price,
        materialCost: item.material_cost
      }))
    }
    
    return converted
  }

  /**
   * 从前端格式转换为后端格式
   */
  convertToBackend(bomData) {
    return {
      bomCode: bomData.bomCode,
      bomName: bomData.bomName,
      productCode: bomData.productCode,
      productName: bomData.productName,
      version: bomData.version,
      status: bomData.status,
      designer: bomData.designer,
      itemCount: bomData.itemCount || (bomData.childItems ? bomData.childItems.length : 0),
      remark: bomData.remark,
      reviewer: bomData.reviewer,
      effectiveDate: bomData.effectiveDate,
      childItems: bomData.childItems ? bomData.childItems.map(item => ({
        sequence: item.sequence,
        level: item.level,
        childCode: item.childCode,
        childName: item.childName,
        standardQty: item.standardQty,
        outputProcess: item.outputProcess,
        source: item.source,
        processWage: item.processWage,
        materialLoss: item.materialLoss,
        materialPrice: item.materialPrice,
        materialCost: item.materialCost
      })) : []
    }
  }

  /**
   * 兼容旧的DatabaseService接口 - 删除这些方法，避免递归
   */
  // 注意：不再需要这些兼容方法，因为已经直接修改了ProductionBom.vue
}

// 创建单例
const bomApiService = new BOMAPIService()

export default bomApiService
