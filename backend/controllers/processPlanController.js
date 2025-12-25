const ProcessPlanService = require('../services/processPlanService');

/**
 * 工序计划控制器
 */
class ProcessPlanController {
  /**
   * 获取所有工序计划(分页)
   */
  async getAll(req, res) {
    try {
      const params = req.query;
      const result = await ProcessPlanService.getAll(params);
      
      res.json({
        success: true,
        data: result,
        message: '获取工序计划列表成功'
      });
    } catch (error) {
      console.error('获取工序计划列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 根据ID获取工序计划
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const processPlan = await ProcessPlanService.getById(id);
      
      if (!processPlan) {
        return res.status(404).json({
          success: false,
          message: '工序计划不存在',
          code: 404
        });
      }
      
      res.json({
        success: true,
        data: processPlan,
        message: '获取工序计划详情成功'
      });
    } catch (error) {
      console.error('获取工序计划详情失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 创建工序计划
   */
  async create(req, res) {
    try {
      const processPlanData = req.body;
      const result = await ProcessPlanService.create(processPlanData);
      
      res.status(201).json({
        success: true,
        data: result,
        message: '创建工序计划成功'
      });
    } catch (error) {
      console.error('创建工序计划失败:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 400
      });
    }
  }

  /**
   * 更新工序计划
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const processPlanData = req.body;
      
      await ProcessPlanService.update(id, processPlanData);
      
      res.json({
        success: true,
        message: '更新工序计划成功'
      });
    } catch (error) {
      console.error('更新工序计划失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 删除工序计划
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      await ProcessPlanService.delete(id);
      
      res.json({
        success: true,
        message: '删除工序计划成功'
      });
    } catch (error) {
      console.error('删除工序计划失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }

  /**
   * 批量删除工序计划
   */
  async batchDelete(req, res) {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的工序计划ID列表',
          code: 400
        });
      }
      
      const result = await ProcessPlanService.batchDelete(ids);
      
      res.json({
        success: true,
        data: result,
        message: '批量删除工序计划成功'
      });
    } catch (error) {
      console.error('批量删除工序计划失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 500
      });
    }
  }
}

module.exports = new ProcessPlanController();
