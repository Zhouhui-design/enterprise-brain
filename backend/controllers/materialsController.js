const materialService = require('../services/materialService');
const bomService = require('../services/bomService');

class MaterialsController {
  /**
   * 获取物料列表
   */
  async getMaterials(req, res) {
    try {
      const { page, limit, search, sortBy, sortOrder, categoryId, supplierId } = req.query;
      
      const materials = await materialService.getMaterials({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        sortBy,
        sortOrder,
        categoryId,
        supplierId
      });
      
      res.json({
        success: true,
        data: materials,
        message: '获取物料列表成功'
      });
    } catch (error) {
      console.error('获取物料列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
  
  /**
   * 获取物料详情
   */
  async getMaterialById(req, res) {
    try {
      const { id } = req.params;
      
      const material = await materialService.getMaterialById(id);
      if (!material) {
        return res.status(404).json({
          success: false,
          message: '物料不存在',
          code: 404
        });
      }
      
      res.json({
        success: true,
        data: material,
        message: '获取物料详情成功'
      });
    } catch (error) {
      console.error('获取物料详情失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
  
  /**
   * 创建物料
   */
  async createMaterial(req, res) {
    try {
      const materialData = req.body;
      
      const newMaterial = await materialService.createMaterial(materialData);
      
      res.status(201).json({
        success: true,
        data: newMaterial,
        message: '创建物料成功'
      });
    } catch (error) {
      console.error('创建物料失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
  
  /**
   * 更新物料
   */
  async updateMaterial(req, res) {
    try {
      const { id } = req.params;
      const materialData = req.body;
      
      const updatedMaterial = await materialService.updateMaterial(id, materialData);
      if (!updatedMaterial) {
        return res.status(404).json({
          success: false,
          message: '物料不存在',
          code: 404
        });
      }
      
      res.json({
        success: true,
        data: updatedMaterial,
        message: '更新物料成功'
      });
    } catch (error) {
      console.error('更新物料失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
  
  /**
   * 删除物料
   */
  async deleteMaterial(req, res) {
    try {
      const { id } = req.params;
      
      const result = await materialService.deleteMaterial(id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: '物料不存在',
          code: 404
        });
      }
      
      res.json({
        success: true,
        message: '删除物料成功'
      });
    } catch (error) {
      console.error('删除物料失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
  
  /**
   * 获取物料分类
   */
  async getMaterialCategories(req, res) {
    try {
      const categories = await materialService.getMaterialCategories();
      
      res.json({
        success: true,
        data: categories,
        message: '获取物料分类成功'
      });
    } catch (error) {
      console.error('获取物料分类失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
  
  /**
   * 获取物料供应商
   */
  async getMaterialSuppliers(req, res) {
    try {
      const { materialId } = req.query;
      
      const suppliers = await materialService.getMaterialSuppliers(materialId);
      
      res.json({
        success: true,
        data: suppliers,
        message: '获取物料供应商成功'
      });
    } catch (error) {
      console.error('获取物料供应商失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
  
  /**
   * 导入物料数据
   */
  async importMaterials(req, res) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          message: '请上传文件',
          code: 400
        });
      }
      
      const result = await materialService.importMaterials(file.path);
      
      res.json({
        success: true,
        data: result,
        message: '导入物料成功'
      });
    } catch (error) {
      console.error('导入物料失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
  
  /**
   * 导出物料数据
   */
  async exportMaterials(req, res) {
    try {
      const { format, ids } = req.query;
      
      const exportData = await materialService.exportMaterials({
        format: format || 'excel',
        ids: ids ? ids.split(',') : undefined
      });
      
      res.setHeader(
        'Content-Type',
        format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="materials.${format || 'excel'}"`);
      res.send(exportData);
    } catch (error) {
      console.error('导出物料失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
}

module.exports = new MaterialsController();
