'use strict';

const crypto = require('crypto');

/**
 * 分布式追踪中间件
 * 为每个请求生成唯一的traceId和spanId
 */
const traceMiddleware = (req, res, next) => {
  // 从请求头中获取traceId，如果没有则生成一个新的
  const traceId = req.headers['x-trace-id'] || crypto.randomUUID();
  // 生成新的spanId
  const spanId = crypto.randomUUID();
  
  // 将traceId和spanId添加到请求对象中
  req.traceId = traceId;
  req.spanId = spanId;
  
  // 添加到响应头中，以便后续服务使用
  res.setHeader('x-trace-id', traceId);
  res.setHeader('x-span-id', spanId);
  
  // 记录请求开始
  req._startTime = Date.now();
  
  next();
};

/**
 * 日志增强中间件
 * 为日志添加traceId和spanId
 */
const logEnhancerMiddleware = (req, res, next) => {
  // 如果请求中没有traceId，生成一个
  const traceId = req.traceId || crypto.randomUUID();
  const spanId = req.spanId || crypto.randomUUID();
  
  // 保存到请求对象
  req.traceId = traceId;
  req.spanId = spanId;
  
  // 增强日志记录器，添加traceId和spanId到所有日志中
  const originalLog = req.logger || req.app.locals.logger;
  if (originalLog) {
    req.logger = {
      debug: (message, meta = {}) => originalLog.debug(message, { ...meta, traceId, spanId }),
      info: (message, meta = {}) => originalLog.info(message, { ...meta, traceId, spanId }),
      warn: (message, meta = {}) => originalLog.warn(message, { ...meta, traceId, spanId }),
      error: (message, meta = {}) => originalLog.error(message, { ...meta, traceId, spanId }),
      log: (level, message, meta = {}) => originalLog.log(level, message, { ...meta, traceId, spanId })
    };
  }
  
  next();
};

module.exports = {
  traceMiddleware,
  logEnhancerMiddleware
};
