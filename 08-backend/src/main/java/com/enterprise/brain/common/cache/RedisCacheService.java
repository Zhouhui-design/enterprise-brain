package com.enterprise.brain.common.cache;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Redis缓存服务实现类
 * 提供基于Redis的分布式缓存功能
 */
@Slf4j
@Service
public class RedisCacheService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 设置缓存
     * @param key 键
     * @param value 值
     */
    public void set(String key, Object value) {
        try {
            redisTemplate.opsForValue().set(key, value);
            log.debug("Redis set success, key: {}", key);
        } catch (Exception e) {
            log.error("Redis set error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis set error", e);
        }
    }

    /**
     * 设置缓存并设置过期时间
     * @param key 键
     * @param value 值
     * @param timeout 过期时间
     * @param timeUnit 时间单位
     */
    public void set(String key, Object value, long timeout, TimeUnit timeUnit) {
        try {
            redisTemplate.opsForValue().set(key, value, timeout, timeUnit);
            log.debug("Redis set success with timeout, key: {}, timeout: {}", key, timeout);
        } catch (Exception e) {
            log.error("Redis set error with timeout, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis set error", e);
        }
    }

    /**
     * 获取缓存
     * @param key 键
     * @return 值
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            log.debug("Redis get success, key: {}", key);
            return (T) value;
        } catch (Exception e) {
            log.error("Redis get error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis get error", e);
        }
    }

    /**
     * 删除缓存
     * @param key 键
     * @return 是否删除成功
     */
    public boolean delete(String key) {
        try {
            boolean result = redisTemplate.delete(key);
            log.debug("Redis delete success, key: {}", key);
            return result;
        } catch (Exception e) {
            log.error("Redis delete error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis delete error", e);
        }
    }

    /**
     * 批量删除缓存
     * @param keys 键集合
     * @return 删除成功的数量
     */
    public long delete(Collection<String> keys) {
        if (CollectionUtils.isEmpty(keys)) {
            return 0;
        }
        try {
            long result = redisTemplate.delete(keys);
            log.debug("Redis batch delete success, keys count: {}", keys.size());
            return result;
        } catch (Exception e) {
            log.error("Redis batch delete error, error: {}", e.getMessage(), e);
            throw new RuntimeException("Redis batch delete error", e);
        }
    }

    /**
     * 判断key是否存在
     * @param key 键
     * @return 是否存在
     */
    public boolean hasKey(String key) {
        try {
            Boolean result = redisTemplate.hasKey(key);
            return result != null && result;
        } catch (Exception e) {
            log.error("Redis hasKey error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis hasKey error", e);
        }
    }

    /**
     * 设置过期时间
     * @param key 键
     * @param timeout 过期时间
     * @param timeUnit 时间单位
     * @return 是否设置成功
     */
    public boolean expire(String key, long timeout, TimeUnit timeUnit) {
        try {
            Boolean result = redisTemplate.expire(key, timeout, timeUnit);
            log.debug("Redis expire set success, key: {}, timeout: {}", key, timeout);
            return result != null && result;
        } catch (Exception e) {
            log.error("Redis expire set error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis expire error", e);
        }
    }

    /**
     * 获取过期时间
     * @param key 键
     * @param timeUnit 时间单位
     * @return 过期时间
     */
    public Long getExpire(String key, TimeUnit timeUnit) {
        try {
            Long expire = redisTemplate.getExpire(key, timeUnit);
            return expire != null ? expire : -1;
        } catch (Exception e) {
            log.error("Redis getExpire error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis getExpire error", e);
        }
    }

    /**
     * 原子递增
     * @param key 键
     * @return 递增后的值
     */
    public long increment(String key) {
        try {
            Long result = redisTemplate.opsForValue().increment(key);
            log.debug("Redis increment success, key: {}", key);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("Redis increment error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis increment error", e);
        }
    }

    /**
     * 原子递增指定步长
     * @param key 键
     * @param delta 步长
     * @return 递增后的值
     */
    public long increment(String key, long delta) {
        try {
            Long result = redisTemplate.opsForValue().increment(key, delta);
            log.debug("Redis increment success with delta, key: {}, delta: {}", key, delta);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("Redis increment error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis increment error", e);
        }
    }

    /**
     * 原子递减
     * @param key 键
     * @return 递减后的值
     */
    public long decrement(String key) {
        try {
            Long result = redisTemplate.opsForValue().decrement(key);
            log.debug("Redis decrement success, key: {}", key);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("Redis decrement error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis decrement error", e);
        }
    }

    /**
     * 原子递减指定步长
     * @param key 键
     * @param delta 步长
     * @return 递减后的值
     */
    public long decrement(String key, long delta) {
        try {
            Long result = redisTemplate.opsForValue().decrement(key, delta);
            log.debug("Redis decrement success with delta, key: {}, delta: {}", key, delta);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("Redis decrement error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis decrement error", e);
        }
    }

    /**
     * 设置Hash缓存
     * @param key 键
     * @param hashKey Hash键
     * @param value 值
     */
    public void setHash(String key, String hashKey, Object value) {
        try {
            redisTemplate.opsForHash().put(key, hashKey, value);
            log.debug("Redis hash set success, key: {}, hashKey: {}", key, hashKey);
        } catch (Exception e) {
            log.error("Redis hash set error, key: {}, hashKey: {}, error: {}", key, hashKey, e.getMessage(), e);
            throw new RuntimeException("Redis hash set error", e);
        }
    }

    /**
     * 获取Hash缓存
     * @param key 键
     * @param hashKey Hash键
     * @return 值
     */
    @SuppressWarnings("unchecked")
    public <T> T getHash(String key, String hashKey) {
        try {
            Object value = redisTemplate.opsForHash().get(key, hashKey);
            log.debug("Redis hash get success, key: {}, hashKey: {}", key, hashKey);
            return (T) value;
        } catch (Exception e) {
            log.error("Redis hash get error, key: {}, hashKey: {}, error: {}", key, hashKey, e.getMessage(), e);
            throw new RuntimeException("Redis hash get error", e);
        }
    }

    /**
     * 获取Hash所有键值对
     * @param key 键
     * @return Map对象
     */
    @SuppressWarnings("unchecked")
    public <T> Map<String, T> getHashAll(String key) {
        try {
            Map<Object, Object> entries = redisTemplate.opsForHash().entries(key);
            Map<String, T> result = new HashMap<>();
            if (entries != null) {
                entries.forEach((k, v) -> result.put(k.toString(), (T) v));
            }
            log.debug("Redis hash get all success, key: {}", key);
            return result;
        } catch (Exception e) {
            log.error("Redis hash get all error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis hash get all error", e);
        }
    }

    /**
     * 删除Hash中的指定键
     * @param key 键
     * @param hashKeys Hash键数组
     * @return 删除成功的数量
     */
    public long deleteHash(String key, Object... hashKeys) {
        try {
            Long result = redisTemplate.opsForHash().delete(key, hashKeys);
            log.debug("Redis hash delete success, key: {}, hashKeys count: {}", key, hashKeys.length);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("Redis hash delete error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis hash delete error", e);
        }
    }

    /**
     * 向List左侧添加元素
     * @param key 键
     * @param value 值
     * @return 列表长度
     */
    public long leftPush(String key, Object value) {
        try {
            Long result = redisTemplate.opsForList().leftPush(key, value);
            log.debug("Redis list left push success, key: {}", key);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("Redis list left push error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis list left push error", e);
        }
    }

    /**
     * 从List左侧弹出元素
     * @param key 键
     * @return 弹出的元素
     */
    @SuppressWarnings("unchecked")
    public <T> T leftPop(String key) {
        try {
            Object value = redisTemplate.opsForList().leftPop(key);
            log.debug("Redis list left pop success, key: {}", key);
            return (T) value;
        } catch (Exception e) {
            log.error("Redis list left pop error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis list left pop error", e);
        }
    }

    /**
     * 向List右侧添加元素
     * @param key 键
     * @param value 值
     * @return 列表长度
     */
    public long rightPush(String key, Object value) {
        try {
            Long result = redisTemplate.opsForList().rightPush(key, value);
            log.debug("Redis list right push success, key: {}", key);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("Redis list right push error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis list right push error", e);
        }
    }

    /**
     * 从List右侧弹出元素
     * @param key 键
     * @return 弹出的元素
     */
    @SuppressWarnings("unchecked")
    public <T> T rightPop(String key) {
        try {
            Object value = redisTemplate.opsForList().rightPop(key);
            log.debug("Redis list right pop success, key: {}", key);
            return (T) value;
        } catch (Exception e) {
            log.error("Redis list right pop error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis list right pop error", e);
        }
    }

    /**
     * 获取List指定范围的元素
     * @param key 键
     * @param start 开始索引
     * @param end 结束索引
     * @return 元素列表
     */
    @SuppressWarnings("unchecked")
    public <T> List<T> rangeList(String key, long start, long end) {
        try {
            List<Object> values = redisTemplate.opsForList().range(key, start, end);
            List<T> result = new ArrayList<>();
            if (values != null) {
                values.forEach(v -> result.add((T) v));
            }
            log.debug("Redis list range success, key: {}, start: {}, end: {}", key, start, end);
            return result;
        } catch (Exception e) {
            log.error("Redis list range error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis list range error", e);
        }
    }

    /**
     * 添加Set元素
     * @param key 键
     * @param values 值数组
     * @return 添加成功的数量
     */
    public long addSet(String key, Object... values) {
        try {
            Long result = redisTemplate.opsForSet().add(key, values);
            log.debug("Redis set add success, key: {}, values count: {}", key, values.length);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("Redis set add error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis set add error", e);
        }
    }

    /**
     * 获取Set所有元素
     * @param key 键
     * @return 元素集合
     */
    @SuppressWarnings("unchecked")
    public <T> Set<T> getSet(String key) {
        try {
            Set<Object> values = redisTemplate.opsForSet().members(key);
            Set<T> result = new HashSet<>();
            if (values != null) {
                values.forEach(v -> result.add((T) v));
            }
            log.debug("Redis set get success, key: {}", key);
            return result;
        } catch (Exception e) {
            log.error("Redis set get error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis set get error", e);
        }
    }

    /**
     * 删除Set中的元素
     * @param key 键
     * @param values 值数组
     * @return 删除成功的数量
     */
    public long removeSet(String key, Object... values) {
        try {
            Long result = redisTemplate.opsForSet().remove(key, values);
            log.debug("Redis set remove success, key: {}, values count: {}", key, values.length);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("Redis set remove error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis set remove error", e);
        }
    }

    /**
     * 添加ZSet元素
     * @param key 键
     * @param value 值
     * @param score 分数
     * @return 是否添加成功
     */
    public boolean addZSet(String key, Object value, double score) {
        try {
            Boolean result = redisTemplate.opsForZSet().add(key, value, score);
            log.debug("Redis zset add success, key: {}", key);
            return result != null && result;
        } catch (Exception e) {
            log.error("Redis zset add error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis zset add error", e);
        }
    }

    /**
     * 获取ZSet指定范围的元素（按分数排序）
     * @param key 键
     * @param start 开始索引
     * @param end 结束索引
     * @return 元素集合
     */
    @SuppressWarnings("unchecked")
    public <T> Set<T> rangeZSet(String key, long start, long end) {
        try {
            Set<Object> values = redisTemplate.opsForZSet().range(key, start, end);
            Set<T> result = new HashSet<>();
            if (values != null) {
                values.forEach(v -> result.add((T) v));
            }
            log.debug("Redis zset range success, key: {}, start: {}, end: {}", key, start, end);
            return result;
        } catch (Exception e) {
            log.error("Redis zset range error, key: {}, error: {}", key, e.getMessage(), e);
            throw new RuntimeException("Redis zset range error", e);
        }
    }

    /**
     * 清空所有缓存
     */
    public void clear() {
        try {
            Set<String> keys = redisTemplate.keys("*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.debug("Redis clear success, keys count: {}", keys.size());
            }
        } catch (Exception e) {
            log.error("Redis clear error, error: {}", e.getMessage(), e);
            throw new RuntimeException("Redis clear error", e);
        }
    }
}