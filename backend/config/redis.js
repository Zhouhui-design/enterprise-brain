/**
 * Redis配置文件
 * 支持Docker容器环境
 */

const redis = require('redis');

// Redis连接配置 - 支持环境变量
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  family: 4,
  keyPrefix: 'enterprise:',
};

// 创建Redis客户端
const client = redis.createClient(redisConfig);

// 连接事件监听
client.on('connect', () => {
  console.log('✅ Redis连接成功');
  console.log(`📊 Redis服务器: ${redisConfig.host}:${redisConfig.port}`);
});

client.on('ready', () => {
  console.log('✅ Redis服务就绪');
});

client.on('error', (err) => {
  console.error('❌ Redis连接错误:', err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Redis服务未启动，部分缓存功能将不可用');
  }
});

client.on('close', () => {
  console.log('⚠️ Redis连接已关闭');
});

client.on('reconnecting', () => {
  console.log('🔄 正在重连Redis...');
});

// 连接到Redis
client.connect().catch(err => {
  if (err) {
    console.error('❌ Redis连接失败:', err.message);
    console.log('🔧 系统将在没有Redis缓存的情况下运行');
  }
});

// Redis操作封装
const redisOperations = {
  // 设置键值
  async set(key, value, expireInSeconds = 3600) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (expireInSeconds > 0) {
        await client.setEx(key, expireInSeconds, stringValue);
      } else {
        await client.set(key, stringValue);
      }
      return true;
    } catch (error) {
      console.error('Redis SET错误:', error.message);
      return false;
    }
  },

  // 获取值
  async get(key) {
    try {
      const value = await client.get(key);
      if (!value) return null;
      
      // 尝试解析JSON
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Redis GET错误:', error.message);
      return null;
    }
  },

  // 删除键
  async del(key) {
    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL错误:', error.message);
      return false;
    }
  },

  // 检查键是否存在
  async exists(key) {
    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS错误:', error.message);
      return false;
    }
  },

  // 设置过期时间
  async expire(key, seconds) {
    try {
      await client.expire(key, seconds);
      return true;
    } catch (error) {
      console.error('Redis EXPIRE错误:', error.message);
      return false;
    }
  },

  // 获取剩余过期时间
  async ttl(key) {
    try {
      return await client.ttl(key);
    } catch (error) {
      console.error('Redis TTL错误:', error.message);
      return -1;
    }
  },

  // 哈希操作 - 设置字段
  async hset(key, field, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await client.hSet(key, field, stringValue);
      return true;
    } catch (error) {
      console.error('Redis HSET错误:', error.message);
      return false;
    }
  },

  // 哈希操作 - 获取字段
  async hget(key, field) {
    try {
      const value = await client.hGet(key, field);
      if (!value) return null;
      
      // 尝试解析JSON
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Redis HGET错误:', error.message);
      return null;
    }
  },

  // 哈希操作 - 获取所有字段
  async hgetall(key) {
    try {
      const hash = await client.hGetAll(key);
      const result = {};
      
      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Redis HGETALL错误:', error.message);
      return {};
    }
  },

  // 哈希操作 - 删除字段
  async hdel(key, field) {
    try {
      await client.hDel(key, field);
      return true;
    } catch (error) {
      console.error('Redis HDEL错误:', error.message);
      return false;
    }
  },

  // 列表操作 - 左推入
  async lpush(key, ...values) {
    try {
      const stringValues = values.map(v => typeof v === 'string' ? v : JSON.stringify(v));
      await client.lPush(key, stringValues);
      return true;
    } catch (error) {
      console.error('Redis LPUSH错误:', error.message);
      return false;
    }
  },

  // 列表操作 - 右弹出
  async rpop(key) {
    try {
      const value = await client.rPop(key);
      if (!value) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Redis RPOP错误:', error.message);
      return null;
    }
  },

  // 集合操作 - 添加成员
  async sadd(key, member) {
    try {
      const stringMember = typeof member === 'string' ? member : JSON.stringify(member);
      await client.sAdd(key, stringMember);
      return true;
    } catch (error) {
      console.error('Redis SADD错误:', error.message);
      return false;
    }
  },

  // 集合操作 - 获取所有成员
  async smembers(key) {
    try {
      const members = await client.sMembers(key);
      return members.map(member => {
        try {
          return JSON.parse(member);
        } catch {
          return member;
        }
      });
    } catch (error) {
      console.error('Redis SMEMBERS错误:', error.message);
      return [];
    }
  },

  // 发布消息
  async publish(channel, message) {
    try {
      const stringMessage = typeof message === 'string' ? message : JSON.stringify(message);
      await client.publish(channel, stringMessage);
      return true;
    } catch (error) {
      console.error('Redis PUBLISH错误:', error.message);
      return false;
    }
  },

  // 订阅频道
  subscribe(channel, callback) {
    try {
      const subscriber = client.duplicate();
      subscriber.connect().then(() => {
        subscriber.subscribe(channel, (message) => {
          try {
            const parsedMessage = JSON.parse(message);
            callback(parsedMessage);
          } catch {
            callback(message);
          }
        });
      });
      return subscriber;
    } catch (error) {
      console.error('Redis SUBSCRIBE错误:', error.message);
      return null;
    }
  },

  // 清空数据库
  async flushdb() {
    try {
      await client.flushDb();
      return true;
    } catch (error) {
      console.error('Redis FLUSHDB错误:', error.message);
      return false;
    }
  },

  // 获取数据库信息
  async info() {
    try {
      return await client.info();
    } catch (error) {
      console.error('Redis INFO错误:', error.message);
      return null;
    }
  },

  // 关闭连接
  async quit() {
    try {
      await client.quit();
      console.log('✅ Redis连接已关闭');
      return true;
    } catch (error) {
      console.error('Redis QUIT错误:', error.message);
      return false;
    }
  }
};

// 缓存键前缀定义
const cacheKeys = {
  USER_SESSION: 'user:session:',
  API_CACHE: 'api:cache:',
  PRODUCT_CACHE: 'product:',
  ORDER_CACHE: 'order:',
  SYSTEM_CONFIG: 'system:config:',
  UPLOAD_TOKEN: 'upload:token:',
  EMAIL_VERIFY: 'email:verify:',
  LOGIN_ATTEMPT: 'login:attempt:',
  RATE_LIMIT: 'rate:limit:',
  WEBSOCKET_CLIENT: 'ws:client:',
  TASK_QUEUE: 'task:queue:',
  TEMP_DATA: 'temp:data:'
};

module.exports = {
  client,
  redisConfig,
  redisOperations,
  cacheKeys
};