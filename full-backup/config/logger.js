'use strict';

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// 创建日志目录
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 创建日志子目录
const errorLogsDir = path.join(logsDir, 'error');
const combinedLogsDir = path.join(logsDir, 'combined');
const accessLogsDir = path.join(logsDir, 'access');

[errorLogsDir, combinedLogsDir, accessLogsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 通用的DailyRotateFile配置
const commonRotateConfig = {
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '10m', // 调整为10MB每个文件
  maxFiles: '15d', // 调整为保留15天的日志
  utc: false,
  auditFile: path.join(logsDir, 'log-rotate-audit.json'),
};

// 业务日志配置 - 保留更长时间
const businessLogConfig = {
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '50m', // 业务日志每个文件50MB
  maxFiles: '90d', // 业务日志保留90天
  utc: false,
  auditFile: path.join(logsDir, 'business-log-rotate-audit.json'),
};

// 自定义格式：添加分布式追踪字段
const traceFormat = winston.format((info, opts) => {
  // 从请求上下文中获取traceId和spanId（默认值为空字符串）
  info.traceId = info.traceId || '';
  info.spanId = info.spanId || '';
  info.serviceName = info.serviceName || 'enterprise-brain-backend';
  info.environment = process.env.NODE_ENV || 'development';
  return info;
});

// 控制台输出格式 - 增强可读性
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.printf((info) => {
    const { timestamp, level, message, traceId, spanId, serviceName, ...meta } = info;
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${serviceName}] [${traceId || 'N/A'}] [${spanId || 'N/A'}] ${level}: ${message} ${metaStr}`;
  })
);

// 配置Winston日志记录器
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    traceFormat(),
    winston.format.json(),
  ),
  defaultMeta: { service: 'enterprise-brain-backend' },
  transports: [
    // 错误日志 - 每天轮换
    new DailyRotateFile({
      ...commonRotateConfig,
      filename: path.join(errorLogsDir, 'enterprise-brain-error-%DATE%.log'),
      level: 'error',
    }),
    // 所有日志 - 每天轮换
    new DailyRotateFile({
      ...commonRotateConfig,
      filename: path.join(combinedLogsDir, 'enterprise-brain-combined-%DATE%.log'),
    }),
    // 控制台输出
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// 创建访问日志记录器
const accessLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    traceFormat(),
    winston.format.json(),
  ),
  defaultMeta: { service: 'enterprise-brain-access' },
  transports: [
    // 访问日志 - 每天轮换
    new DailyRotateFile({
      ...commonRotateConfig,
      filename: path.join(accessLogsDir, 'enterprise-brain-access-%DATE%.log'),
    }),
    // 控制台输出
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// 导出日志记录器
module.exports = {
  logger,
  accessLogger,
};
