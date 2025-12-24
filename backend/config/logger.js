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
  maxSize: '20m',
  maxFiles: '30d', // 统一保留30天的日志
  utc: false,
  auditFile: path.join(logsDir, 'log-rotate-audit.json')
};

// 配置Winston日志记录器
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'enterprise-brain-backend' },
  transports: [
    // 错误日志 - 每天轮换
    new DailyRotateFile({
      ...commonRotateConfig,
      filename: path.join(errorLogsDir, 'enterprise-brain-error-%DATE%.log'),
      level: 'error'
    }),
    // 所有日志 - 每天轮换
    new DailyRotateFile({
      ...commonRotateConfig,
      filename: path.join(combinedLogsDir, 'enterprise-brain-combined-%DATE%.log')
    }),
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// 创建访问日志记录器
const accessLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.json()
  ),
  defaultMeta: { service: 'enterprise-brain-access' },
  transports: [
    // 访问日志 - 每天轮换
    new DailyRotateFile({
      ...commonRotateConfig,
      filename: path.join(accessLogsDir, 'enterprise-brain-access-%DATE%.log')
    }),
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// 导出日志记录器
module.exports = {
  logger,
  accessLogger
};