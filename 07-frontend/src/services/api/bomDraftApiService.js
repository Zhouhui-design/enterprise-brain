import productionBomDraftAPI from '@/api/productionBomDraft'

/**
 * 生产BOM草稿API服务
 * 封装草稿箱API调用并处理数据格式转换
 */
class BOMDraftAPIService {
  /**
   * 获取所有草稿
   */
  async getAllDrafts() {
    try {
      const response = await productionBomDraftAPI.getAllDrafts()
      if (response.code === 200) {
        console.log('草稿列表加载成功:', response.data.length)
        return response.data.map(item => this.convertFromBackend(item))
      } else {
        throw new Error(response.message || '获取草稿列表失败')
      }
    } catch (error) {
      console.error('获取草稿列表失败:', error)
      throw error
    }
  }

  /**
   * 获取草稿详情
   */
  async getDraftDetail(id) {
    try {
      const response = await productionBomDraftAPI.getDraftDetail(id)
      if (response.code === 200) {
        return this.convertFromBackend(response.data, true)
      } else {
        throw new Error(response.message || '获取草稿详情失败')
      }
    } catch (error) {
      console.error('获取草稿详情失败:', error)
      throw error
    }
  }

  /**
   * 保存草稿（创建或更新）
   */
  async saveDraft(draftData) {
    try {
      const backendData = this.convertToBackend(draftData)
      let response
      
      if (draftData.id) {
        // 更新
        response = await productionBomDraftAPI.updateDraft(draftData.id, backendData)
      } else {
        // 创建
        response = await productionBomDraftAPI.createDraft(backendData)
      }
      
      if (response.code === 200) {
        console.log('草稿保存成功')
        return response.data
      } else {
        throw new Error(response.message || '保存草稿失败')
      }
    } catch (error) {
      console.error('保存草稿失败:', error)
      throw error
    }
  }

  /**
   * 删除草稿
   */
  async deleteDraft(id) {
    try {
      const response = await productionBomDraftAPI.deleteDraft(id)
      if (response.code === 200) {
        console.log('草稿删除成功:', id)
        return true
      } else {
        throw new Error(response.message || '删除草稿失败')
      }
    } catch (error) {
      console.error('删除草稿失败:', error)
      throw error
    }
  }

  /**
   * 批量删除草稿
   */
  async deleteDrafts(ids) {
    try {
      const response = await productionBomDraftAPI.batchDeleteDrafts(ids)
      if (response.code === 200) {
        console.log(`批量删除草稿成功，共${response.data.successCount}条`)
        return response.data
      } else {
        throw new Error(response.message || '批量删除草稿失败')
      }
    } catch (error) {
      console.error('批量删除草稿失败:', error)
      throw error
    }
  }

  /**
   * 从后端格式转换为前端格式
   */
  convertFromBackend(draftData, includeChildren = false) {
    const converted = {
      id: draftData.id,
      draftId: draftData.id, // 兼容旧代码
      bomCode: draftData.bom_code,
      bomName: draftData.bom_name,
      productCode: draftData.product_code,
      productName: draftData.product_name,
      version: draftData.version,
      status: draftData.status,
      designer: draftData.designer,
      itemCount: draftData.material_count,
      remark: draftData.remark,
      reviewer: draftData.auditor,
      effectiveDate: draftData.effective_date,
      createTime: draftData.created_at,
      updateTime: draftData.updated_at
    }
    
    // 如果包含子件，转换子件格式
    if (includeChildren && draftData.childItems) {
      converted.childItems = draftData.childItems.map(item => ({
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
  convertToBackend(draftData) {
    return {
      bomCode: draftData.bomCode,
      bomName: draftData.bomName,
      productCode: draftData.productCode,
      productName: draftData.productName,
      version: draftData.version,
      status: draftData.status,
      designer: draftData.designer,
      itemCount: draftData.itemCount || (draftData.childItems ? draftData.childItems.length : 0),
      remark: draftData.remark,
      reviewer: draftData.reviewer,
      effectiveDate: draftData.effectiveDate,
      childItems: draftData.childItems ? draftData.childItems.map(item => ({
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
}

// 创建单例
const bomDraftApiService = new BOMDraftAPIService()

export default bomDraftApiService
