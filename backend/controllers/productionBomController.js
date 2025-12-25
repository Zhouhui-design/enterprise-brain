const bomService = require('../services/bomService');
const bomSyncService = require('../services/bomSyncService');
const bomDraftService = require('../services/bomDraftService');

class ProductionBomController {
  /**
   * 获取BOM列表
   */
  async getProductionBoms(req, res) {
    try {
      const { page, limit, search, productId, status, sortBy, sortOrder } = req.query;
      
      const boms = await bomService.getProductionBoms({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        productId,
        status,
        sortBy,
        sortOrder
      });
      
      res.json({
        success: true,
        data: boms,
        message: '获取BOM列表成功'
      });
    } catch (error) {
      console.error('获取BOM列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
  
  /**
   * 获取BOM详情
   */
  async getProductionBomById(req, res) {
    try {
      const { id } = req.params;
      
      const bom = await bomService.getProductionBomById(id);
      if (!bom) {
        return res.status(404).json({
          success: false,
          message: 'BOM不存在',
          code: 404
        });
      }
      
      res.json({
        success: true,
        data: bom,
        message: '获取BOM详情成功'
      });
    } catch (error) {
      console.error('获取BOM详情失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
  
  /**
   * 创建BOM
   */
  async createProductionBom(req, res) {
    try {
      const bomData = req.body;
      
      const newBom = await bomService.createProductionBom(bomData);
      
      res.status(201).json({
        success: true,
        data: newBom,
        message: '创建BOM成功'
      });
    } catch (error) {
      console.error('创建BOM失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
  
  /**
   * 更新BOM
   */
  async updateProductionBom(req, res) {
    try {
      const { id } = req.params;
      const bomData = req.body;
      
      const updatedBom = await bomService.updateProductionBom(id, bomData);
      if (!updatedBom) {
        return res.status(404).json({
          success: false,
          message: 'BOM不存在',
          code: 404
        });
      }
      
      res.json({
        success: true,
        data: updatedBom,
        message: '更新BOM成功'
      });
    } catch (error) {
      console.error('更新BOM失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
  
  /**
   * 删除BOM
   */
  async deleteProductionBom(req, res) {
    try {
      const { id } = req.params;
      
      const result = await bomService.deleteProductionBom(id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'BOM不存在',
          code: 404
        });
      }
      
      res.json({
        success: true,
        message: '删除BOM成功'
      });
    } catch (error) {
      console.error('删除BOM失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
  
  /**
   * 获取BOM树结构
   */
  async getBomTreeStructure(req, res) {
    try {
      const { id, level } = req.params;
      
      const tree = await bomService.getBomTreeStructure(id, parseInt(level) || 3);
      
      res.json({
        success: true,
        data: tree,
        message: '获取BOM树结构成功'
      });
    } catch (error) {
      console.error('获取BOM树结构失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
  
  /**
   * 同步BOM数据
   */
  async syncBomData(req, res) {
    try {
      const { sourceBomId, targetBomId } = req.body;
      
      const result = await bomSyncService.syncBomData(sourceBomId, targetBomId);
      
      res.json({
        success: true,
        data: result,
        message: '同步BOM数据成功'
      });
    } catch (error) {
      console.error('同步BOM数据失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
  
  /**
   * 审核BOM
   */
  async approveBom(req, res) {
    try {
      const { id } = req.params;
      const { approved, remark } = req.body;
      
      const result = await bomService.approveBom(id, approved, remark);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'BOM不存在',
          code: 404
        });
      }
      
      res.json({
        success: true,
        data: result,
        message: approved ? '审核通过BOM成功' : '审核拒绝BOM成功'
      });
    } catch (error) {
      console.error('审核BOM失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
  
  /**
   * 发布BOM
   */
  async releaseBom(req, res) {
    try {
      const { id } = req.params;
      
      const result = await bomService.releaseBom(id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'BOM不存在',
          code: 404
        });
      }
      
      res.json({
        success: true,
        data: result,
        message: '发布BOM成功'
      });
    } catch (error) {
      console.error('发布BOM失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
  
  /**
   * 复制BOM
   */
  async copyBom(req, res) {
    try {
      const { id } = req.params;
      const { newProductId, newProductName } = req.body;
      
      const newBom = await bomService.copyBom(id, newProductId, newProductName);
      
      res.status(201).json({
        success: true,
        data: newBom,
        message: '复制BOM成功'
      });
    } catch (error) {
      console.error('复制BOM失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
  
  /**
   * 获取BOM版本历史
   */
  async getBomVersionHistory(req, res) {
    try {
      const { id } = req.params;
      
      const history = await bomService.getBomVersionHistory(id);
      
      res.json({
        success: true,
        data: history,
        message: '获取BOM版本历史成功'
      });
    } catch (error) {
      console.error('获取BOM版本历史失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
}

module.exports = new ProductionBomController();
