const inventoryService = require('../services/inventoryService');

/**
 * 库存管理控制器
 */
class InventoryController {
  /**
   * 获取库存列表
   */
  async getInventoryList(req, res) {
    try {
      const params = req.query;
      const result = await inventoryService.getInventoryList(params);
      
      res.json({
        success: true,
        data: result,
        message: '获取库存列表成功'
      });
    } catch (error) {
      console.error('获取库存列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 获取库存详情
   */
  async getInventoryById(req, res) {
    try {
      const { id } = req.params;
      const inventory = await inventoryService.getInventoryById(id);
      
      if (!inventory) {
        return res.status(404).json({
          success: false,
          message: '库存不存在',
          code: 404
        });
      }
      
      res.json({
        success: true,
        data: inventory,
        message: '获取库存详情成功'
      });
    } catch (error) {
      console.error('获取库存详情失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 根据物料编号获取库存
   */
  async getInventoryByMaterialCode(req, res) {
    try {
      const { materialCode, warehouseCode, batchNo } = req.query;
      
      if (!materialCode) {
        return res.status(400).json({
          success: false,
          message: '物料编号不能为空',
          code: 400
        });
      }
      
      const inventory = await inventoryService.getInventoryByMaterialCode(materialCode, warehouseCode, batchNo);
      
      res.json({
        success: true,
        data: inventory,
        message: '根据物料编号获取库存成功'
      });
    } catch (error) {
      console.error('根据物料编号获取库存失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 创建库存记录
   */
  async createInventory(req, res) {
    try {
      const inventoryData = req.body;
      const inventoryId = await inventoryService.createInventory(inventoryData);
      
      res.status(201).json({
        success: true,
        data: { id: inventoryId },
        message: '创建库存成功'
      });
    } catch (error) {
      console.error('创建库存失败:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 400
      });
    }
  }

  /**
   * 更新库存
   */
  async updateInventory(req, res) {
    try {
      const { id } = req.params;
      const inventoryData = req.body;
      
      await inventoryService.updateInventory(id, inventoryData);
      
      res.json({
        success: true,
        message: '更新库存成功'
      });
    } catch (error) {
      console.error('更新库存失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 删除库存记录
   */
  async deleteInventory(req, res) {
    try {
      const { id } = req.params;
      
      await inventoryService.deleteInventory(id);
      
      res.json({
        success: true,
        message: '删除库存成功'
      });
    } catch (error) {
      console.error('删除库存失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 批量删除
   */
  async batchDelete(req, res) {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的库存ID列表',
          code: 400
        });
      }
      
      await inventoryService.batchDelete(ids);
      
      res.json({
        success: true,
        message: '批量删除成功'
      });
    } catch (error) {
      console.error('批量删除失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 获取库存明细
   */
  async getInventoryDetails(req, res) {
    try {
      const params = req.query;
      const result = await inventoryService.getInventoryDetails(params);
      
      res.json({
        success: true,
        data: result,
        message: '获取库存明细成功'
      });
    } catch (error) {
      console.error('获取库存明细失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 创建库存明细记录
   */
  async createInventoryDetail(req, res) {
    try {
      const detailData = req.body;
      const detailId = await inventoryService.createInventoryDetail(detailData);
      
      res.status(201).json({
        success: true,
        data: { id: detailId },
        message: '创建库存明细成功'
      });
    } catch (error) {
      console.error('创建库存明细失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 获取库存报表统计
   */
  async getInventoryReport(req, res) {
    try {
      const params = req.query;
      const report = await inventoryService.getInventoryReport(params);
      
      res.json({
        success: true,
        data: report,
        message: '获取库存报表成功'
      });
    } catch (error) {
      console.error('获取库存报表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 库存入库
   */
  async inventoryIn(req, res) {
    try {
      const data = req.body;
      const result = await inventoryService.inventoryIn(data);
      
      res.json({
        success: true,
        data: result,
        message: '库存入库成功'
      });
    } catch (error) {
      console.error('库存入库失败:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 400
      });
    }
  }

  /**
   * 库存出库
   */
  async inventoryOut(req, res) {
    try {
      const data = req.body;
      const result = await inventoryService.inventoryOut(data);
      
      res.json({
        success: true,
        data: result,
        message: '库存出库成功'
      });
    } catch (error) {
      console.error('库存出库失败:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 400
      });
    }
  }

  /**
   * 导出库存数据
   */
  async exportInventory(req, res) {
    try {
      const params = req.query;
      const data = await inventoryService.exportInventory(params);
      
      res.json({
        success: true,
        data: data,
        message: '导出库存数据成功'
      });
    } catch (error) {
      console.error('导出库存数据失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 导入库存数据
   */
  async importInventory(req, res) {
    try {
      const data = req.body;
      const result = await inventoryService.importInventory(data);
      
      res.json({
        success: true,
        data: result,
        message: '导入库存数据成功'
      });
    } catch (error) {
      console.error('导入库存数据失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 清空库存列表
   */
  async clearInventory(req, res) {
    try {
      const { warehouseCode } = req.query;
      await inventoryService.clearInventory(warehouseCode);
      
      res.json({
        success: true,
        message: '清空库存成功'
      });
    } catch (error) {
      console.error('清空库存失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
}

module.exports = new InventoryController();
