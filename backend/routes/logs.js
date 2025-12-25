/**
 * 日志管理路由
 * 
 * 提供日志记录、查询和管理功能
 */

const express = require('express');
const router = express.Router();
const logger = require('../config/logger').logger;

/**
 * @swagger
 * /api/logs/batch:  
 *   post:
 *     summary: 批量上报日志
 *     description: 接收前端批量上报的日志数据
 *     tags: [Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               logs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     timestamp: 
 *                       type: string
 *                       format: date-time
 *                       description: 日志时间戳
 *                     level:
 *                       type: string
 *                       description: 日志级别
 *                     message:
 *                       type: string
 *                       description: 日志消息
 *                     meta:
 *                       type: object
 *                       description: 日志元数据
 *                     userAgent:
 *                       type: string
 *                       description: 用户代理
 *                     url:
 *                       type: string
 *                       description: 页面URL
 *                     sessionId:
 *                       type: string
 *                       description: 会话ID
 *                     userId:
 *                       type: string
 *                       description: 用户ID
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: 上报时间
 *               sessionId:
 *                 type: string
 *                 description: 会话ID
 *               userId:
 *                 type: string
 *                 description: 用户ID
 *     responses:
 *       200:
 *         description: 日志上报成功
 *       400:
 *         description: 无效的日志数据
 */
router.post('/batch', async (req, res) => {
  try {
    const { logs, timestamp, sessionId, userId } = req.body;

    if (!Array.isArray(logs)) {
      return res.status(400).json({
        code: 400,
        message: '无效的日志数据格式'
      });
    }

    // 记录日志
    logs.forEach(log => {
      const level = log.level || 'INFO';
      
      // 根据日志级别记录
      switch (level.toUpperCase()) {
        case 'DEBUG':
          logger.debug(log.message, {
            ...log.meta,
            userAgent: log.userAgent,
            url: log.url,
            sessionId: log.sessionId || sessionId,
            userId: log.userId || userId,
            originalTimestamp: log.timestamp
          });
          break;
        case 'INFO':
          logger.info(log.message, {
            ...log.meta,
            userAgent: log.userAgent,
            url: log.url,
            sessionId: log.sessionId || sessionId,
            userId: log.userId || userId,
            originalTimestamp: log.timestamp
          });
          break;
        case 'WARN':
          logger.warn(log.message, {
            ...log.meta,
            userAgent: log.userAgent,
            url: log.url,
            sessionId: log.sessionId || sessionId,
            userId: log.userId || userId,
            originalTimestamp: log.timestamp
          });
          break;
        case 'ERROR':
          logger.error(log.message, {
            ...log.meta,
            userAgent: log.userAgent,
            url: log.url,
            sessionId: log.sessionId || sessionId,
            userId: log.userId || userId,
            originalTimestamp: log.timestamp
          });
          break;
        case 'CRITICAL':
          logger.error(log.message, {
            ...log.meta,
            userAgent: log.userAgent,
            url: log.url,
            sessionId: log.sessionId || sessionId,
            userId: log.userId || userId,
            originalTimestamp: log.timestamp,
            severity: 'critical'
          });
          break;
        default:
          logger.info(log.message, {
            ...log.meta,
            userAgent: log.userAgent,
            url: log.url,
            sessionId: log.sessionId || sessionId,
            userId: log.userId || userId,
            originalTimestamp: log.timestamp
          });
      }
    });

    res.status(200).json({
      code: 200,
      message: '日志上报成功',
      count: logs.length
    });
  } catch (error) {
    logger.error('日志上报处理错误', error);
    res.status(500).json({
      code: 500,
      message: '日志上报失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/logs/error:  
 *   post:
 *     summary: 上报错误日志
 *     description: 接收前端上报的错误日志
 *     tags: [Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: 错误代码
 *               message:
 *                 type: string
 *                 description: 错误消息
 *               stack:
 *                 type: string
 *                 description: 错误堆栈
 *               url:
 *                 type: string
 *                 description: 页面URL
 *               userAgent:
 *                 type: string
 *                 description: 用户代理
 *               sessionId:
 *                 type: string
 *                 description: 会话ID
 *               userId:
 *                 type: string
 *                 description: 用户ID
 *     responses:
 *       200:
 *         description: 错误日志上报成功
 *       400:
 *         description: 无效的错误数据
 */
router.post('/error', async (req, res) => {
  try {
    const { code, message, stack, url, userAgent, sessionId, userId } = req.body;

    if (!message) {
      return res.status(400).json({
        code: 400,
        message: '错误消息不能为空'
      });
    }

    logger.error('前端错误', {
      errorCode: code,
      errorMessage: message,
      stack,
      url,
      userAgent,
      sessionId,
      userId
    });

    res.status(200).json({
      code: 200,
      message: '错误日志上报成功'
    });
  } catch (error) {
    logger.error('错误日志上报处理错误', error);
    res.status(500).json({
      code: 500,
      message: '错误日志上报失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/logs/performance:  
 *   post:
 *     summary: 上报性能数据
 *     description: 接收前端上报的性能数据
 *     tags: [Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               performance:
 *                 type: object
 *                 description: 性能数据
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: 上报时间
 *               sessionId:
 *                 type: string
 *                 description: 会话ID
 *               userId:
 *                 type: string
 *                 description: 用户ID
 *     responses:
 *       200:
 *         description: 性能数据上报成功
 *       400:
 *         description: 无效的性能数据
 */
router.post('/performance', async (req, res) => {
  try {
    const { performance, timestamp, sessionId, userId } = req.body;

    if (!performance) {
      return res.status(400).json({
        code: 400,
        message: '性能数据不能为空'
      });
    }

    // 记录性能日志
    logger.info('前端性能数据', {
      performance,
      timestamp,
      sessionId,
      userId
    });

    res.status(200).json({
      code: 200,
      message: '性能数据上报成功'
    });
  } catch (error) {
    logger.error('性能数据上报处理错误', error);
    res.status(500).json({
      code: 500,
      message: '性能数据上报失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/logs/stats:  
 *   get:
 *     summary: 获取日志统计
 *     description: 获取日志统计信息
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *         description: 日志级别过滤
 *       - in: query  
 *         name: startTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 开始时间
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 结束时间
 *     responses:
 *       200:
 *         description: 日志统计信息
 *       500:
 *         description: 获取统计失败
 */
router.get('/stats', async (req, res) => {
  try {
    // 目前返回简单的统计信息，后续可以扩展为从日志文件或数据库中获取
    res.status(200).json({
      code: 200,
      data: {
        levels: {
          DEBUG: 0,
          INFO: 0,
          WARN: 0,
          ERROR: 0,
          CRITICAL: 0
        },
        total: 0,
        period: '24h'
      }
    });
  } catch (error) {
    logger.error('获取日志统计错误', error);
    res.status(500).json({
      code: 500,
      message: '获取日志统计失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/logs:  
 *   get:
 *     summary: 获取日志列表
 *     description: 根据条件查询日志列表，支持分页、过滤和搜索
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页条数
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *         description: 日志级别过滤
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 关键词搜索
 *       - in: query  
 *         name: startTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 开始时间
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 结束时间
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: timestamp
 *         description: 排序字段
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: desc
 *           enum: [asc, desc]
 *         description: 排序顺序
 *     responses:
 *       200:
 *         description: 日志列表
 *       500:
 *         description: 获取日志失败
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      level,
      keyword,
      startTime,
      endTime,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    // 解析分页参数
    const parsedPage = parseInt(page, 10);
    const parsedPageSize = parseInt(pageSize, 10);
    const skip = (parsedPage - 1) * parsedPageSize;

    // 目前返回模拟数据，后续可以扩展为从日志文件或数据库中获取
    const logs = [];
    const total = 0;

    res.status(200).json({
      code: 200,
      data: {
        logs,
        pagination: {
          page: parsedPage,
          pageSize: parsedPageSize,
          total,
          totalPages: Math.ceil(total / parsedPageSize)
        }
      }
    });
  } catch (error) {
    logger.error('获取日志列表错误', error);
    res.status(500).json({
      code: 500,
      message: '获取日志列表失败',
      error: error.message
    });
  }
});

module.exports = router;
