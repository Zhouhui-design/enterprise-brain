/**
 * 错误处理工具类
 * 封装公共的错误处理逻辑，统一错误响应格式
 */
class ErrorUtil {
  // 构造函数
  constructor() {}
}

/**
 * 错误类型枚举
 */
ErrorUtil.ErrorTypes = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR'
};

/**
 * 错误状态码映射
 */
ErrorUtil.ErrorStatusCodes = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  VALIDATION_ERROR: 400,
  DATABASE_ERROR: 500
};

// 添加方法到类原型
/**
 * 发送成功响应
 * @param {Object} res - Express响应对象
 * @param {any} data - 响应数据
 * @param {string} message - 响应消息
 * @param {number} statusCode - 状态码
 */
ErrorUtil.sendSuccessResponse = function(res, data = null, message = '操作成功', statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    data,
    message,
    code: statusCode
  });
};

/**
 * 发送错误响应
 * @param {Object} res - Express响应对象
 * @param {string} type - 错误类型
 * @param {string} message - 错误消息
 * @param {any} data - 错误数据
 */
ErrorUtil.sendErrorResponse = function(res, type, message, data = null) {
  const statusCode = this.ErrorStatusCodes[type] || this.ErrorStatusCodes.INTERNAL_SERVER_ERROR;
  
  res.status(statusCode).json({
    success: false,
    message: message || this.getDefaultErrorMessage(type),
    data,
    code: statusCode,
    errorType: type
  });
};

/**
 * 获取默认错误消息
 * @param {string} type - 错误类型
 * @returns {string} - 默认错误消息
 */
ErrorUtil.getDefaultErrorMessage = function(type) {
  const errorMessages = {
    BAD_REQUEST: '请求参数错误',
    UNAUTHORIZED: '未授权访问',
    FORBIDDEN: '禁止访问',
    NOT_FOUND: '资源不存在',
    INTERNAL_SERVER_ERROR: '服务器内部错误',
    VALIDATION_ERROR: '数据验证失败',
    DATABASE_ERROR: '数据库操作失败'
  };
  
  return errorMessages[type] || errorMessages.INTERNAL_SERVER_ERROR;
};

/**
 * 创建自定义错误
 * @param {string} type - 错误类型
 * @param {string} message - 错误消息
 * @param {any} data - 错误数据
 * @returns {Error} - 自定义错误对象
 */
ErrorUtil.createError = function(type, message, data = null) {
  const error = new Error(message || this.getDefaultErrorMessage(type));
  error.type = type;
  error.data = data;
  return error;
};

/**
 * 中间件：捕获并处理异步错误
 * @param {Function} fn - 异步函数
 * @returns {Function} - 包装后的中间件函数
 */
ErrorUtil.asyncHandler = function(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(error => next(error));
  };
};

/**
 * 中间件：全局错误处理
 * @param {Error} error - 错误对象
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express中间件函数
 */
ErrorUtil.globalErrorHandler = function(error, req, res, next) {
  console.error('全局错误捕获:', error);
  
  // 如果是自定义错误
  if (error.type && this.ErrorTypes[error.type]) {
    return this.sendErrorResponse(res, error.type, error.message, error.data);
  }
  
  // 处理其他错误
  return this.sendErrorResponse(
    res,
    this.ErrorTypes.INTERNAL_SERVER_ERROR,
    error.message || this.getDefaultErrorMessage(this.ErrorTypes.INTERNAL_SERVER_ERROR)
  );
};

/**
 * 验证请求参数
 * @param {Object} params - 请求参数
 * @param {Object} rules - 验证规则
 * @returns {Object} - 验证结果
 */
ErrorUtil.validateParams = function(params, rules) {
  const errors = [];
  
  Object.entries(rules).forEach(([field, rule]) => {
    const value = params[field];
    
    // 必填验证
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field}是必填项`);
      return;
    }
    
    // 类型验证
    if (value !== undefined && value !== null && rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type) {
        errors.push(`${field}类型错误，预期${rule.type}，实际${actualType}`);
      }
    }
    
    // 数组长度验证
    if (Array.isArray(value) && rule.minLength !== undefined) {
      if (value.length < rule.minLength) {
        errors.push(`${field}长度不能小于${rule.minLength}`);
      }
    }
    
    // 字符串长度验证
    if (typeof value === 'string' && rule.minLength !== undefined) {
      if (value.length < rule.minLength) {
        errors.push(`${field}长度不能小于${rule.minLength}`);
      }
    }
    
    // 字符串长度验证
    if (typeof value === 'string' && rule.maxLength !== undefined) {
      if (value.length > rule.maxLength) {
        errors.push(`${field}长度不能大于${rule.maxLength}`);
      }
    }
    
    // 数值范围验证
    if (typeof value === 'number' && rule.min !== undefined) {
      if (value < rule.min) {
        errors.push(`${field}不能小于${rule.min}`);
      }
    }
    
    // 数值范围验证
    if (typeof value === 'number' && rule.max !== undefined) {
      if (value > rule.max) {
        errors.push(`${field}不能大于${rule.max}`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = ErrorUtil;
