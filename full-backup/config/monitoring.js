'use strict';

/**
 * 监控告警配置
 * 定义系统监控指标和告警规则
 */
module.exports = {
  // 日志监控配置
  logMonitoring: {
    // 错误日志告警
    errorLogs: {
      enabled: true,
      threshold: 10, // 每分钟错误日志数量阈值
      timeWindow: 60000, // 时间窗口（毫秒）
      severity: 'high',
      notifyChannels: ['email', 'slack'],
    },
    // 严重错误日志告警
    criticalLogs: {
      enabled: true,
      threshold: 1, // 每分钟严重错误数量阈值
      timeWindow: 60000,
      severity: 'critical',
      notifyChannels: ['email', 'slack', 'sms'],
    },
  },

  // 性能监控配置
  performanceMonitoring: {
    // 响应时间告警
    responseTime: {
      enabled: true,
      threshold: 2000, // 平均响应时间阈值（毫秒）
      timeWindow: 300000, // 5分钟窗口
      severity: 'medium',
      notifyChannels: ['email'],
    },
    // 慢请求告警
    slowRequests: {
      enabled: true,
      threshold: 5000, // 单个请求超时阈值（毫秒）
      timeWindow: 60000,
      severity: 'high',
      notifyChannels: ['email', 'slack'],
    },
    // 高CPU使用率告警
    highCpuUsage: {
      enabled: true,
      threshold: 80, // CPU使用率阈值（%）
      timeWindow: 60000,
      severity: 'high',
      notifyChannels: ['email', 'slack'],
    },
    // 高内存使用率告警
    highMemoryUsage: {
      enabled: true,
      threshold: 85, // 内存使用率阈值（%）
      timeWindow: 60000,
      severity: 'high',
      notifyChannels: ['email', 'slack'],
    },
  },

  // 数据库监控配置
  databaseMonitoring: {
    // 数据库连接池使用率告警
    connectionPoolUsage: {
      enabled: true,
      threshold: 90, // 连接池使用率阈值（%）
      timeWindow: 60000,
      severity: 'medium',
      notifyChannels: ['email'],
    },
    // 慢查询告警
    slowQueries: {
      enabled: true,
      threshold: 2000, // 慢查询阈值（毫秒）
      timeWindow: 60000,
      severity: 'medium',
      notifyChannels: ['email'],
    },
  },

  // WebSocket监控配置
  websocketMonitoring: {
    // 连接数告警
    connectionCount: {
      enabled: true,
      threshold: 1000, // 并发连接数阈值
      timeWindow: 60000,
      severity: 'medium',
      notifyChannels: ['email'],
    },
    // 断开连接率告警
    disconnectRate: {
      enabled: true,
      threshold: 10, // 每分钟断开连接率（%）
      timeWindow: 60000,
      severity: 'high',
      notifyChannels: ['email', 'slack'],
    },
  },

  // 告警通知配置
  notification: {
    email: {
      enabled: true,
      from: 'monitoring@enterprise-brain.com',
      to: ['admin@enterprise-brain.com', 'devops@enterprise-brain.com'],
      smtp: {
        host: process.env.SMTP_HOST || 'smtp.example.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'monitoring',
          pass: process.env.SMTP_PASS || 'password',
        },
      },
    },
    slack: {
      enabled: false,
      webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
      channel: '#monitoring-alerts',
    },
    sms: {
      enabled: false,
      apiKey: process.env.SMS_API_KEY || '',
      sender: 'EnterpriseBrain',
      recipients: ['+1234567890'],
    },
  },

  // 告警抑制规则
  alertSuppression: {
    cooldownPeriod: 300000, // 5分钟冷却期，同一类型告警在冷却期内只发送一次
    suppressedAlerts: [], // 手动抑制的告警列表
  },

  // 监控数据采集间隔
  collectionInterval: {
    logs: 60000, // 每分钟采集一次日志指标
    performance: 30000, // 每30秒采集一次性能指标
    database: 60000, // 每分钟采集一次数据库指标
    system: 15000, // 每15秒采集一次系统指标
  },
};
