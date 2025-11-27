package com.enterprise.brain.common.cache;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.function.Supplier;

/**
 * 本地缓存服务实现类
 * 基于内存的本地缓存，提供线程安全的缓存操作
 */
@Slf4j
@Service
public class LocalCacheService {

    // 缓存数据存储
    private final Map<String, CacheValue> cacheMap = new ConcurrentHashMap<>();
    
    // 读写锁，保证线程安全
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    /**
     * 缓存值对象，包含值和过期时间
     */
    private static class CacheValue {
        private final Object value;
        private final long expireTime;

        public CacheValue(Object value, long expireTime) {
            this.value = value;
            this.expireTime = expireTime;
        }

        public Object getValue() {
            return value;
        }

        public boolean isExpired() {
            // 0表示永不过期
            return expireTime > 0 && System.currentTimeMillis() > expireTime;
        }
    }

    /**
     * 设置缓存
     * @param key 键
     * @param value 值
     */
    public void set(String key, Object value) {
        try {
            lock.writeLock().lock();
            cacheMap.put(key, new CacheValue(value, 0));
            log.debug("Local cache set success, key: {}", key);
        } finally {
            lock.writeLock().unlock();
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
            lock.writeLock().lock();
            long expireTime = timeout > 0 ? System.currentTimeMillis() + timeUnit.toMillis(timeout) : 0;
            cacheMap.put(key, new CacheValue(value, expireTime));
            log.debug("Local cache set success with timeout, key: {}, timeout: {}", key, timeout);
        } finally {
            lock.writeLock().unlock();
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
            lock.readLock().lock();
            CacheValue cacheValue = cacheMap.get(key);
            if (cacheValue == null) {
                log.debug("Local cache miss, key: {}", key);
                return null;
            }
            
            // 检查是否过期
            if (cacheValue.isExpired()) {
                // 读锁升级为写锁来删除过期数据
                lock.readLock().unlock();
                try {
                    lock.writeLock().lock();
                    // 双重检查，防止其他线程已经删除
                    cacheValue = cacheMap.get(key);
                    if (cacheValue != null && cacheValue.isExpired()) {
                        cacheMap.remove(key);
                        log.debug("Local cache expired and removed, key: {}", key);
                    }
                } finally {
                    // 降级为读锁
                    lock.readLock().lock();
                    lock.writeLock().unlock();
                }
                // 重新获取最新的缓存值
                cacheValue = cacheMap.get(key);
                if (cacheValue == null) {
                    log.debug("Local cache miss after expiration check, key: {}", key);
                    return null;
                }
            }
            
            log.debug("Local cache hit, key: {}", key);
            return (T) cacheValue.getValue();
        } finally {
            lock.readLock().unlock();
        }
    }

    /**
     * 获取缓存，如果不存在则通过supplier创建并缓存
     * @param key 键
     * @param supplier 缓存创建函数
     * @param timeout 过期时间
     * @param timeUnit 时间单位
     * @return 值
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key, Supplier<T> supplier, long timeout, TimeUnit timeUnit) {
        T value = get(key);
        if (value == null) {
            try {
                lock.writeLock().lock();
                // 双重检查
                value = get(key);
                if (value == null) {
                    value = supplier.get();
                    if (value != null) {
                        set(key, value, timeout, timeUnit);
                    }
                }
            } finally {
                lock.writeLock().unlock();
            }
        }
        return value;
    }

    /**
     * 删除缓存
     * @param key 键
     * @return 是否删除成功
     */
    public boolean delete(String key) {
        try {
            lock.writeLock().lock();
            CacheValue removed = cacheMap.remove(key);
            boolean result = removed != null;
            if (result) {
                log.debug("Local cache delete success, key: {}", key);
            }
            return result;
        } finally {
            lock.writeLock().unlock();
        }
    }

    /**
     * 批量删除缓存
     * @param keys 键集合
     * @return 删除成功的数量
     */
    public int delete(Collection<String> keys) {
        if (keys == null || keys.isEmpty()) {
            return 0;
        }
        
        int count = 0;
        try {
            lock.writeLock().lock();
            for (String key : keys) {
                if (cacheMap.remove(key) != null) {
                    count++;
                }
            }
            log.debug("Local cache batch delete success, deleted count: {}", count);
        } finally {
            lock.writeLock().unlock();
        }
        return count;
    }

    /**
     * 清空缓存
     */
    public void clear() {
        try {
            lock.writeLock().lock();
            cacheMap.clear();
            log.debug("Local cache cleared");
        } finally {
            lock.writeLock().unlock();
        }
    }

    /**
     * 判断key是否存在且未过期
     * @param key 键
     * @return 是否存在
     */
    public boolean containsKey(String key) {
        return get(key) != null;
    }

    /**
     * 获取缓存大小
     * @return 缓存项数量
     */
    public int size() {
        try {
            lock.readLock().lock();
            // 清理过期项并返回当前大小
            cleanExpired();
            return cacheMap.size();
        } finally {
            lock.readLock().unlock();
        }
    }

    /**
     * 获取所有缓存键
     * @return 键集合
     */
    public Set<String> keys() {
        try {
            lock.readLock().lock();
            cleanExpired();
            return new HashSet<>(cacheMap.keySet());
        } finally {
            lock.readLock().unlock();
        }
    }

    /**
     * 清理过期的缓存项
     */
    public void cleanExpired() {
        try {
            lock.writeLock().lock();
            long now = System.currentTimeMillis();
            List<String> expiredKeys = new ArrayList<>();
            
            cacheMap.forEach((key, value) -> {
                if (value.expireTime > 0 && now > value.expireTime) {
                    expiredKeys.add(key);
                }
            });
            
            for (String key : expiredKeys) {
                cacheMap.remove(key);
            }
            
            if (!expiredKeys.isEmpty()) {
                log.debug("Local cache expired items cleaned, count: {}", expiredKeys.size());
            }
        } finally {
            lock.writeLock().unlock();
        }
    }

    /**
     * 原子递增
     * @param key 键
     * @return 递增后的值
     */
    public long increment(String key) {
        return increment(key, 1);
    }

    /**
     * 原子递增指定步长
     * @param key 键
     * @param delta 步长
     * @return 递增后的值
     */
    public long increment(String key, long delta) {
        try {
            lock.writeLock().lock();
            Long current = get(key);
            if (current == null) {
                current = 0L;
            }
            long newValue = current + delta;
            set(key, newValue);
            log.debug("Local cache increment success, key: {}, newValue: {}", key, newValue);
            return newValue;
        } finally {
            lock.writeLock().unlock();
        }
    }

    /**
     * 原子递减
     * @param key 键
     * @return 递减后的值
     */
    public long decrement(String key) {
        return increment(key, -1);
    }

    /**
     * 原子递减指定步长
     * @param key 键
     * @param delta 步长
     * @return 递减后的值
     */
    public long decrement(String key, long delta) {
        return increment(key, -delta);
    }

    /**
     * 批量设置缓存
     * @param values 键值对映射
     * @param timeout 过期时间
     * @param timeUnit 时间单位
     */
    public void multiSet(Map<String, Object> values, long timeout, TimeUnit timeUnit) {
        if (values == null || values.isEmpty()) {
            return;
        }
        
        try {
            lock.writeLock().lock();
            long expireTime = timeout > 0 ? System.currentTimeMillis() + timeUnit.toMillis(timeout) : 0;
            
            values.forEach((key, value) -> {
                cacheMap.put(key, new CacheValue(value, expireTime));
            });
            
            log.debug("Local cache multi set success, count: {}", values.size());
        } finally {
            lock.writeLock().unlock();
        }
    }

    /**
     * 批量获取缓存
     * @param keys 键集合
     * @return 键值对映射
     */
    @SuppressWarnings("unchecked")
    public <T> Map<String, T> multiGet(Collection<String> keys) {
        if (keys == null || keys.isEmpty()) {
            return new HashMap<>();
        }
        
        Map<String, T> result = new HashMap<>();
        try {
            lock.readLock().lock();
            for (String key : keys) {
                T value = get(key);
                if (value != null) {
                    result.put(key, value);
                }
            }
            log.debug("Local cache multi get success, requested: {}, found: {}", keys.size(), result.size());
        } finally {
            lock.readLock().unlock();
        }
        return result;
    }

    /**
     * 根据前缀获取所有键
     * @param prefix 键前缀
     * @return 符合条件的键集合
     */
    public Set<String> keysWithPrefix(String prefix) {
        Set<String> result = new HashSet<>();
        try {
            lock.readLock().lock();
            cacheMap.keySet().forEach(key -> {
                if (key.startsWith(prefix)) {
                    // 检查是否过期
                    CacheValue value = cacheMap.get(key);
                    if (!value.isExpired()) {
                        result.add(key);
                    }
                }
            });
            log.debug("Local cache keys with prefix found, prefix: {}, count: {}", prefix, result.size());
        } finally {
            lock.readLock().unlock();
        }
        return result;
    }

    /**
     * 清理指定前缀的缓存
     * @param prefix 键前缀
     * @return 删除的数量
     */
    public int clearByPrefix(String prefix) {
        Set<String> keysToRemove = keysWithPrefix(prefix);
        return delete(keysToRemove);
    }

    /**
     * 获取缓存统计信息
     * @return 统计信息
     */
    public Map<String, Object> getStatistics() {
        try {
            lock.readLock().lock();
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalSize", cacheMap.size());
            
            // 计算过期项数量
            long now = System.currentTimeMillis();
            long expiredCount = cacheMap.values().stream()
                .filter(value -> value.isExpired())
                .count();
            stats.put("expiredCount", expiredCount);
            stats.put("validCount", cacheMap.size() - expiredCount);
            
            log.debug("Local cache statistics retrieved");
            return stats;
        } finally {
            lock.readLock().unlock();
        }
    }
}