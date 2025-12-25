'use strict';

const os = require('os');
const monitoringConfig = require('../config/monitoring');
const { logger } = require('../config/logger');

/**
 * 监控服务
 * 负责收集监控指标、检查告警规则并发送告警通知
 */
class MonitoringService {
  constructor() {
    this.metrics = {
      logs: {
        errorCount: 0,
        criticalCount: 0,
        lastResetTime: Date.now(),
      },
      performance: {
        responseTimes: [],
        slowRequestCount: 0,
        lastResetTime: Date.now(),
      },
      system: {
        cpuUsage: 0,
        memoryUsage: 0,
        lastCheckTime: Date.now(),
      },
    };
    
    this.lastAlertTimes = {}; // 记录每种告警的最后发送时间
    this.isRunning = false;
    this.intervals = [];
  }

  /**
   * 启动监控服务
   */
  start() {
    if (this.isRunning) {
      logger.info('监控服务已在运行中');
      return;
    }

    logger.info('启动监控服务...');
    this.isRunning = true;

    // 启动各种监控指标采集
    this.startLogMonitoring();
    this.startPerformanceMonitoring();
    this.startSystemMonitoring();
    this.startDatabaseMonitoring();
    this.startWebSocketMonitoring();

    logger.info('监控服务已启动');
  }

  /**
   * 停止监控服务
   */
  stop() {
    if (!this.isRunning) {
      logger.info('监控服务未在运行中');
      return;
    }

    logger.info('停止监控服务...');
    this.isRunning = false;

    // 清除所有定时器
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    logger.info('监控服务已停止');
  }

  /**
   * 启动日志监控
   */
  startLogMonitoring() {
    const interval = setInterval(() => {
      this.checkLogAlerts();
    }, monitoringConfig.collectionInterval.logs);
    this.intervals.push(interval);
  }

  /**
   * 启动性能监控
   */
  startPerformanceMonitoring() {
    const interval = setInterval(() => {
      this.checkPerformanceAlerts();
    }, monitoringConfig.collectionInterval.performance);
    this.intervals.push(interval);
  }

  /**
   * 启动系统监控
   */
  startSystemMonitoring() {
    const interval = setInterval(() => {
      this.collectSystemMetrics();
      this.checkSystemAlerts();
    }, monitoringConfig.collectionInterval.system);
    this.intervals.push(interval);
  }

  /**
   * 启动数据库监控
   */
  startDatabaseMonitoring() {
    const interval = setInterval(() => {
      this.checkDatabaseAlerts();
    }, monitoringConfig.collectionInterval.database);
    this.intervals.push(interval);
  }

  /**
   * 启动WebSocket监控
   */
  startWebSocketMonitoring() {
    const interval = setInterval(() => {
      this.checkWebSocketAlerts();
    }, monitoringConfig.collectionInterval.performance);
    this.intervals.push(interval);
  }

  /**
   * 收集系统指标
   */
  collectSystemMetrics() {
    // 收集CPU使用率
    const cpus = os.cpus();
    const avgCpuUsage = cpus.reduce((sum, cpu) => {
      const total = Object.values(cpu.times).reduce((t, v) => t + v, 0);
      const idle = cpu.times.idle;
      return sum + (1 - idle / total);
    }, 0) / cpus.length * 100;

    // 收集内存使用率
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

    this.metrics.system = {
      cpuUsage: avgCpuUsage,
      memoryUsage: memoryUsage,
      lastCheckTime: Date.now(),
    };

    logger.debug('系统指标已收集', {
      cpuUsage: avgCpuUsage.toFixed(2),
      memoryUsage: memoryUsage.toFixed(2),
    });
  }

  /**
   * 检查日志告警
   */
  checkLogAlerts() {
    const now = Date.now();
    const timeWindow = monitoringConfig.logMonitoring.errorLogs.timeWindow;

    // 检查错误日志告警
    if (monitoringConfig.logMonitoring.errorLogs.enabled) {
      const { threshold, severity, notifyChannels } = monitoringConfig.logMonitoring.errorLogs;
      if (this.metrics.logs.errorCount > threshold) {
        this.triggerAlert(
          'ERROR_LOGS_THRESHOLD_EXCEEDED',
          `错误日志数量超过阈值: ${this.metrics.logs.errorCount}/${threshold}`,
          {
            errorCount: this.metrics.logs.errorCount,
            threshold,
            timeWindow: timeWindow / 1000,
          },
          severity,
          notifyChannels
        );
      }
    }

    // 检查严重错误日志告警
    if (monitoringConfig.logMonitoring.criticalLogs.enabled) {
      const { threshold, severity, notifyChannels } = monitoringConfig.logMonitoring.criticalLogs;
      if (this.metrics.logs.criticalCount > threshold) {
        this.triggerAlert(
          'CRITICAL_LOGS_THRESHOLD_EXCEEDED',
          `严重错误日志数量超过阈值: ${this.metrics.logs.criticalCount}/${threshold}`,
          {
            criticalCount: this.metrics.logs.criticalCount,
            threshold,
            timeWindow: timeWindow / 1000,
          },
          severity,
          notifyChannels
        );
      }
    }

    // 重置日志计数
    this.metrics.logs = {
      errorCount: 0,
      criticalCount: 0,
      lastResetTime: now,
    };
  }

  /**
   * 检查性能告警
   */
  checkPerformanceAlerts() {
    // 检查平均响应时间
    if (monitoringConfig.performanceMonitoring.responseTime.enabled) {
      const { threshold, severity, notifyChannels } = monitoringConfig.performanceMonitoring.responseTime;
      if (this.metrics.performance.responseTimes.length > 0) {
        const avgResponseTime = this.metrics.performance.responseTimes.reduce((sum, time) => sum + time, 0) / this.metrics.performance.responseTimes.length;
        if (avgResponseTime > threshold) {
          this.triggerAlert(
            'RESPONSE_TIME_EXCEEDED',
            `平均响应时间超过阈值: ${avgResponseTime.toFixed(0)}ms/${threshold}ms`,
            {
              avgResponseTime: avgResponseTime.toFixed(0),
              threshold,
              sampleSize: this.metrics.performance.responseTimes.length,
            },
            severity,
            notifyChannels
          );
        }
      }
    }

    // 检查慢请求数量
    if (monitoringConfig.performanceMonitoring.slowRequests.enabled) {
      const { threshold, severity, notifyChannels } = monitoringConfig.performanceMonitoring.slowRequests;
      if (this.metrics.performance.slowRequestCount > 0) {
        this.triggerAlert(
          'SLOW_REQUESTS_DETECTED',
          `检测到慢请求: ${this.metrics.performance.slowRequestCount}个请求超过${threshold}ms`,
          {
            slowRequestCount: this.metrics.performance.slowRequestCount,
            threshold,
          },
          severity,
          notifyChannels
        );
      }
    }

    // 重置性能指标
    this.metrics.performance = {
      responseTimes: [],
      slowRequestCount: 0,
      lastResetTime: Date.now(),
    };
  }

  /**
   * 检查系统告警
   */
  checkSystemAlerts() {
    // 检查CPU使用率
    if (monitoringConfig.performanceMonitoring.highCpuUsage.enabled) {
      const { threshold, severity, notifyChannels } = monitoringConfig.performanceMonitoring.highCpuUsage;
      if (this.metrics.system.cpuUsage > threshold) {
        this.triggerAlert(
          'HIGH_CPU_USAGE',
          `CPU使用率过高: ${this.metrics.system.cpuUsage.toFixed(2)}%/${threshold}%`,
          {
            cpuUsage: this.metrics.system.cpuUsage.toFixed(2),
            threshold,
          },
          severity,
          notifyChannels
        );
      }
    }

    // 检查内存使用率
    if (monitoringConfig.performanceMonitoring.highMemoryUsage.enabled) {
      const { threshold, severity, notifyChannels } = monitoringConfig.performanceMonitoring.highMemoryUsage;
      if (this.metrics.system.memoryUsage > threshold) {
        this.triggerAlert(
          'HIGH_MEMORY_USAGE',
          `内存使用率过高: ${this.metrics.system.memoryUsage.toFixed(2)}%/${threshold}%`,
          {
            memoryUsage: this.metrics.system.memoryUsage.toFixed(2),
            threshold,
          },
          severity,
          notifyChannels
        );
      }
    }
  }

  /**
   * 检查数据库告警
   */
  checkDatabaseAlerts() {
    // TODO: 实现数据库监控逻辑
    // 这里可以添加数据库连接池使用率、慢查询等监控
  }

  /**
   * 检查WebSocket告警
   */
  checkWebSocketAlerts() {
    // TODO: 实现WebSocket监控逻辑
    // 这里可以添加WebSocket连接数、断开率等监控
  }

  /**
   * 触发告警
   */
  triggerAlert(alertType, message, details, severity, notifyChannels) {
    // 检查是否在冷却期内
    const now = Date.now();
    const lastAlertTime = this.lastAlertTimes[alertType] || 0;
    const cooldownPeriod = monitoringConfig.alertSuppression.cooldownPeriod;

    if (now - lastAlertTime < cooldownPeriod) {
      logger.debug(`告警已被抑制: ${alertType} (冷却期内)`, { cooldownPeriod: cooldownPeriod / 1000 });
      return;
    }

    // 检查是否被手动抑制
    if (monitoringConfig.alertSuppression.suppressedAlerts.includes(alertType)) {
      logger.debug(`告警已被抑制: ${alertType} (手动抑制)`, { alertType });
      return;
    }

    // 记录告警时间
    this.lastAlertTimes[alertType] = now;

    // 记录告警日志
    logger.warn(`告警触发: ${message}`, {
      alertType,
      severity,
      details,
      timestamp: new Date().toISOString(),
    });

    // 发送告警通知
    this.sendNotifications(alertType, message, details, severity, notifyChannels);
  }

  /**
   * 发送告警通知
   */
  sendNotifications(alertType, message, details, severity, notifyChannels) {
    // 根据配置的通知渠道发送告警
    notifyChannels.forEach(channel => {
      const channelConfig = monitoringConfig.notification[channel];
      if (!channelConfig.enabled) {
        logger.debug(`通知渠道已禁用: ${channel}`);
        return;
      }

      try {
        switch (channel) {
          case 'email':
            this.sendEmailNotification(alertType, message, details, severity);
            break;
          case 'slack':
            this.sendSlackNotification(alertType, message, details, severity);
            break;
          case 'sms':
            this.sendSmsNotification(alertType, message, details, severity);
            break;
          default:
            logger.error(`未知的通知渠道: ${channel}`);
        }
      } catch (error) {
        logger.error(`发送${channel}通知失败`, { error: error.message, alertType, message });
      }
    });
  }

  /**
   * 发送邮件通知
   */
  sendEmailNotification(alertType, message, details, severity) {
    // 这里实现邮件发送逻辑
    logger.debug(`发送邮件通知: ${message}`, { alertType, severity, details });
    // TODO: 集成实际的邮件发送服务
  }

  /**
   * 发送Slack通知
   */
  sendSlackNotification(alertType, message, details, severity) {
    // 这里实现Slack通知发送逻辑
    logger.debug(`发送Slack通知: ${message}`, { alertType, severity, details });
    // TODO: 集成实际的Slack Webhook服务
  }

  /**
   * 发送SMS通知
   */
  sendSmsNotification(alertType, message, details, severity) {
    // 这里实现SMS通知发送逻辑
    logger.debug(`发送SMS通知: ${message}`, { alertType, severity, details });
    // TODO: 集成实际的SMS服务
  }

  /**
   * 记录请求响应时间
   */
  recordResponseTime(responseTime) {
    this.metrics.performance.responseTimes.push(responseTime);
    
    // 检查是否为慢请求
    const slowThreshold = monitoringConfig.performanceMonitoring.slowRequests.threshold;
    if (responseTime > slowThreshold) {
      this.metrics.performance.slowRequestCount++;
    }
  }

  /**
   * 记录日志计数
   */
  recordLogCount(level) {
    if (level === 'error') {
      this.metrics.logs.errorCount++;
    } else if (level === 'critical') {
      this.metrics.logs.criticalCount++;
    }
  }

  /**
   * 获取当前监控指标
   */
  getCurrentMetrics() {
    return JSON.parse(JSON.stringify(this.metrics));
  }
}

// 导出单例实例
module.exports = new MonitoringService();
