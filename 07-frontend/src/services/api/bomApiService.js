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
      // request.js的响应拦截器已经处理了code并自动转换为驼峰命名，直接返回数据数组
      const data = await productionBomAPI.getAllBOMs()
      console.log(`✅ 从后端获取到${data.length}条生产BOM数据`)
      console.log('📋 数据字段:', data.length > 0 ? Object.keys(data[0]).join(', ') : '无数据')
      console.log('📄 第一条数据:', data[0])
      
      // ⚠️ request.js已经自动将字段从蛇形转为驼峰，这里不需要再转换
      // 直接返回，字段名已经是: bomCode, bomName, productCode 等
      return data
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
      // request.js的响应拦截器已经处理了code并自动转换为驼峰命名
      const data = await productionBomAPI.getBOMDetail(id)
      console.log('✅ 获取BOM详情成功, ID:', id)
      console.log('📋 数据字段:', Object.keys(data).join(', '))
      
      // ⚠️ request.js已经自动转换，直接返回
      return data
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
      
      let data
      if (bomData.id) {
        // 更新
        console.log('执行更新操作, ID:', bomData.id)
        data = await productionBomAPI.updateBOM(bomData.id, backendData)
      } else {
        // 创建
        console.log('执行创建操作')
        data = await productionBomAPI.createBOM(backendData)
      }
      
      console.log('BOM保存成功')
      return data
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
      await productionBomAPI.deleteBOM(id)
      console.log('BOM删除成功:', id)
      return true
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
      const data = await productionBomAPI.batchDeleteBOMs(ids)
      console.log(`批量删除BOM成功，共${data.successCount}条`)
      return data
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
      totalLabor: bomData.total_labor,
      totalMaterial: bomData.total_material,
      productImage: bomData.product_image,
      isPushedToManual: bomData.is_pushed_to_manual,
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
        standardQty: parseFloat(item.standard_quantity) || 0,
        outputProcess: item.output_process,
        source: item.component_source,
        processWage: parseFloat(item.process_wage) || 0,
        materialLoss: parseFloat(item.material_loss) || 0,
        materialPrice: parseFloat(item.material_price) || 0,
        materialCost: parseFloat(item.material_cost) || 0
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
      totalLabor: bomData.totalLabor,
      totalMaterial: bomData.totalMaterial,
      productImage: bomData.productImage,
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
