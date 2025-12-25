const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

class SalesWebSocket {
  constructor(server) {
    this.wss = new WebSocket.Server({
      server,
      path: '/ws/sales/realtime',
    });

    this.clients = new Map(); // 存储连接的客户端
    this.salesDataCache = new Map(); // 缓存销售数据
    this.heartbeatInterval = null;

    this.init();
  }

  init() {
    console.log('Sales WebSocket服务启动');

    this.wss.on('connection', (ws, request) => {
      this.handleConnection(ws, request);
    });

    this.wss.on('error', error => {
      console.error('WebSocket服务错误:', error);
    });

    // 启动定时数据推送
    this.startPeriodicUpdates();

    // 启动心跳检测
    this.startHeartbeatCheck();
  }

  async handleConnection(ws, request) {
    try {
      // 验证认证token
      const token = this.extractToken(request);
      const user = token ? await this.verifyToken(token) : null;

      if (!user) {
        ws.close(4001, '未授权的连接');
        return;
      }

      const clientId = this.generateClientId();
      const client = {
        id: clientId,
        ws,
        user,
        subscriptions: new Set(),
        lastPing: Date.now(),
        config: {
          timeRange: 60,
          refreshRate: 30,
        },
        connectedAt: new Date(),
      };

      this.clients.set(clientId, client);
      ws.clientId = clientId;

      console.log(`客户端 ${clientId} 已连接，用户: ${user.name}`);

      // 发送连接成功消息
      this.sendToClient(client, {
        type: 'connected',
        clientId,
        message: '连接成功',
        timestamp: new Date().toISOString(),
      });

      // 发送初始数据
      await this.sendInitialData(client);

      // 设置消息处理
      ws.on('message', message => {
        this.handleMessage(client, message);
      });

      ws.on('close', (code, reason) => {
        this.handleDisconnection(clientId, code, reason);
      });

      ws.on('error', error => {
        console.error(`客户端 ${clientId} 错误:`, error);
      });
    } catch (error) {
      console.error('处理WebSocket连接失败:', error);
      ws.close(4002, '连接处理失败');
    }
  }

  async handleMessage(client, message) {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'get_initial_data':
          await this.sendInitialData(client);
          break;

        case 'update_config':
          this.updateClientConfig(client, data.config);
          break;

        case 'subscribe':
          this.handleSubscription(client, data.events);
          break;

        case 'unsubscribe':
          this.handleUnsubscription(client, data.events);
          break;

        case 'heartbeat':
          client.lastPing = Date.now();
          this.sendToClient(client, {
            type: 'heartbeat_response',
            timestamp: new Date().toISOString(),
          });
          break;

        case 'request_data':
          await this.handleDataRequest(client, data);
          break;

        default:
          console.warn(`未知消息类型: ${data.type}`);
      }
    } catch (error) {
      console.error('处理WebSocket消息失败:', error);
    }
  }

  async sendInitialData(client) {
    try {
      const { timeRange } = client.config;

      // 获取实时销售数据
      const realTimeData = await this.getRealTimeSalesData(client.user.id, timeRange);

      // 获取当前指标
      const currentMetrics = await this.getCurrentMetrics(client.user.id);

      // 获取今日收入趋势
      const hourlyTrend = await this.getHourlyTrend(timeRange);

      this.sendToClient(client, {
        type: 'initial_data',
        data: {
          realTime: realTimeData,
          metrics: currentMetrics,
          hourlyTrend,
          config: client.config,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('发送初始数据失败:', error);
      this.sendToClient(client, {
        type: 'error',
        message: '获取初始数据失败',
      });
    }
  }

  handleSubscription(client, events) {
    if (Array.isArray(events)) {
      events.forEach(event => {
        client.subscriptions.add(event);
      });
    } else {
      client.subscriptions.add(events);
    }

    this.sendToClient(client, {
      type: 'subscription_confirmed',
      events: Array.from(client.subscriptions),
    });
  }

  handleUnsubscription(client, events) {
    if (Array.isArray(events)) {
      events.forEach(event => {
        client.subscriptions.delete(event);
      });
    } else {
      client.subscriptions.delete(events);
    }

    this.sendToClient(client, {
      type: 'unsubscription_confirmed',
      events: Array.from(client.subscriptions),
    });
  }

  updateClientConfig(client, newConfig) {
    Object.assign(client.config, newConfig);

    this.sendToClient(client, {
      type: 'config_updated',
      config: client.config,
    });
  }

  async handleDataRequest(client, data) {
    try {
      let responseData;

      switch (data.request) {
        case 'detailed_metrics':
          responseData = await this.getDetailedMetrics(data.params);
          break;
        case 'product_ranking':
          responseData = await this.getProductRanking(data.params);
          break;
        case 'customer_analysis':
          responseData = await this.getCustomerAnalysis(data.params);
          break;
        default:
          responseData = null;
      }

      this.sendToClient(client, {
        type: 'data_response',
        request: data.request,
        data: responseData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('处理数据请求失败:', error);
    }
  }

  sendToClient(client, data) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }

  broadcast(data, filter = null) {
    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        // 应用过滤器
        if (!filter || this.shouldSendToClient(client, data, filter)) {
          this.sendToClient(client, data);
        }
      }
    });
  }

  shouldSendToClient(client, data, filter) {
    if (!filter) return true;

    // 用户过滤
    if (filter.userId && client.user.id !== filter.userId) {
      return false;
    }

    // 区域过滤
    if (filter.regionId && client.user.regionId !== filter.regionId) {
      return false;
    }

    // 事件类型过滤
    if (filter.eventTypes && !filter.eventTypes.includes(data.type)) {
      return false;
    }

    return true;
  }

  startPeriodicUpdates() {
    // 每30秒推送一次销售更新
    setInterval(async () => {
      try {
        await this.broadcastSalesUpdate();
      } catch (error) {
        console.error('定期推送销售更新失败:', error);
      }
    }, 30000);

    // 每小时推送一次详细趋势
    setInterval(async () => {
      try {
        await this.broadcastHourlyUpdate();
      } catch (error) {
        console.error('定期推送小时更新失败:', error);
      }
    }, 3600000); // 1小时
  }

  async broadcastSalesUpdate() {
    // 获取最新的销售指标
    const salesUpdate = await this.getLatestSalesUpdate();

    this.broadcast({
      type: 'sales_update',
      data: salesUpdate,
      timestamp: new Date().toISOString(),
    });
  }

  async broadcastHourlyUpdate() {
    // 获取小时数据
    const currentHour = new Date().getHours();
    const hourlyData = await this.getHourlySalesData(currentHour);

    this.broadcast({
      type: 'hourly_update',
      data: hourlyData,
      timestamp: new Date().toISOString(),
    });
  }

  startHeartbeatCheck() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();

      this.clients.forEach((client, clientId) => {
        if (now - client.lastPing > 90000) {
          // 90秒无心跳
          console.log(`客户端 ${clientId} 心跳超时，断开连接`);
          client.ws.close(1001, '心跳超时');
        }
      });
    }, 30000); // 每30秒检查一次
  }

  handleDisconnection(clientId, code, reason) {
    console.log(`客户端 ${clientId} 已断开连接: ${code} - ${reason}`);
    this.clients.delete(clientId);
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  extractToken(request) {
    const url = request.url || '';
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const token = urlParams.get('token');

    if (token) return token;

    // 尝试从headers中获取
    return (
      request.headers['authorization']?.replace('Bearer ', '') ||
      request.headers['x-authorization'] ||
      request.headers['sec-websocket-protocol']
    );
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      console.error('Token验证失败:', error);
      return null;
    }
  }

  // 数据获取方法（简化实现，实际项目中应该调用相应的服务）
  async getRealTimeSalesData(userId, timeRange) {
    // 这里应该调用实际的数据库查询
    return {
      currentRevenue: 123456.78,
      todayRevenue: 98765.43,
      todayOrders: 25,
      todayCustomers: 12,
      hourlyRevenue: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        revenue: Math.floor(Math.random() * 10000) + 1000,
        orders: Math.floor(Math.random() * 10) + 1,
      })),
      activeUsers: 8,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getCurrentMetrics(userId) {
    // 获取当前销售指标
    return {
      revenue: 123456.78,
      orders: 156,
      customers: 89,
      conversion: 65.2,
    };
  }

  async getHourlyTrend(timeRange) {
    // 获取小时趋势数据
    const currentHour = new Date().getHours();
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      revenue: i <= currentHour ? Math.floor(Math.random() * 5000) + 1000 : null,
      orders: i <= currentHour ? Math.floor(Math.random() * 5) + 1 : null,
    }));
  }

  async getLatestSalesUpdate() {
    // 获取最新的销售更新数据
    return {
      revenue: {
        value: 234567.89,
        trend: 'up',
        trendPercentage: 12.5,
      },
      orders: {
        value: 189,
        trend: 'up',
        trendPercentage: 8.3,
      },
      customers: {
        value: 102,
        trend: 'up',
        trendPercentage: 15.2,
      },
      conversion: {
        value: 67.8,
        trend: 'down',
        trendPercentage: -2.3,
      },
    };
  }

  async getHourlySalesData(hour) {
    // 获取指定小时的销售数据
    return {
      hour,
      revenue: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 5) + 1,
      customers: Math.floor(Math.random() * 3) + 1,
      timestamp: new Date().toISOString(),
    };
  }

  // 通知业务事件
  async notifySaleEvent(eventType, data) {
    const message = {
      type: 'sale_event',
      eventType,
      data,
      timestamp: new Date().toISOString(),
    };

    // 根据事件类型推送给特定用户
    switch (eventType) {
      case 'new_order':
        this.broadcast(message, { eventTypes: ['order_created'] });
        break;
      case 'quotation_created':
        this.broadcast(message, { eventTypes: ['quotation_created'] });
        break;
      case 'payment_received':
        this.broadcast(message, { eventTypes: ['payment_received'] });
        break;
      default:
        this.broadcast(message);
    }
  }

  // 获取连接统计
  getStats() {
    return {
      totalConnections: this.clients.size,
      activeConnections: Array.from(this.clients.values()).filter(c => c.ws.readyState === WebSocket.OPEN).length,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  close() {
    // 关闭所有连接
    this.clients.forEach((client, clientId) => {
      client.ws.close(1001, '服务器关闭');
    });

    // 清理定时器
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // 关闭WebSocket服务器
    this.wss.close();
  }
}

module.exports = SalesWebSocket;
