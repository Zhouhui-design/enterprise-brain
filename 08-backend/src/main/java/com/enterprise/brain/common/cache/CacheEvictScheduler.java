package com.enterprise.brain.common.cache;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicLong;

/**
 * 缓存清理调度器
 * 定期清理过期缓存，维护缓存健康
 */
@Slf4j
@Component
public class CacheEvictScheduler implements ApplicationRunner {

    @Autowired
    private LocalCacheService localCacheService;

    @Autowired
    private RedisCacheService redisCacheService;

    @Value("${cache.local.evict.cron:0 0/5 * * * ?}")
    private String localCacheEvictCron;

    @Value("${cache.redis.enabled:true}")
    private boolean redisEnabled;

    @Value("${cache.cleanup.statistics.enabled:true}")
    private boolean statisticsEnabled;

    // 统计信息
    private final AtomicLong totalCleanupCount = new AtomicLong(0);
    private final AtomicLong lastCleanupTime = new AtomicLong(0);

    /**
     * 应用启动时执行的初始化方法
     * @param args 应用参数
     */
    @Override
    public void run(ApplicationArguments args) {
        log.info("Cache evict scheduler initialized");
        log.info("Local cache evict cron: {}", localCacheEvictCron);
        log.info("Redis cache enabled: {}", redisEnabled);
        log.info("Statistics enabled: {}", statisticsEnabled);

        // 启动时执行一次清理
        cleanupCache();
    }

    /**
     * 定期清理本地缓存
     * 使用@Scheduled注解进行定时任务调度
     */
    @Scheduled(cron = "${cache.local.evict.cron:0 0/5 * * * ?}")
    public void cleanupLocalCache() {
        log.debug("Starting scheduled local cache cleanup");
        long startTime = System.currentTimeMillis();
        
        try {
            // 清理过期缓存项
            localCacheService.cleanExpired();
            
            // 更新统计信息
            totalCleanupCount.incrementAndGet();
            lastCleanupTime.set(System.currentTimeMillis());
            
            // 记录执行时间
            long executionTime = System.currentTimeMillis() - startTime;
            log.debug("Local cache cleanup completed in {} ms", executionTime);
            
            // 如果启用了统计功能，输出更详细的信息
            if (statisticsEnabled) {
                log.info("Local cache cleanup statistics - Size: {}, Cleanup count: {}", 
                    localCacheService.size(), totalCleanupCount.get());
            }
        } catch (Exception e) {
            log.error("Failed to cleanup local cache", e);
        }
    }

    /**
     * 清理所有缓存
     */
    public void cleanupCache() {
        log.info("Starting full cache cleanup");
        
        try {
            // 清理本地缓存
            cleanupLocalCache();
            
            // 如果启用了Redis，清理Redis中的过期缓存（通常Redis会自动清理，但这里可以添加自定义清理逻辑）
            if (redisEnabled) {
                cleanupRedisCache();
            }
            
            log.info("Cache cleanup completed successfully");
        } catch (Exception e) {
            log.error("Failed to cleanup cache", e);
        }
    }

    /**
     * 清理Redis缓存
     * 注意：Redis通常会自动清理过期键，但这里可以添加自定义的清理逻辑
     */
    private void cleanupRedisCache() {
        log.debug("Performing Redis cache cleanup operations");
        
        try {
            // 这里可以添加针对特定前缀的缓存清理，或者执行其他Redis特定的维护操作
            // 例如：清理特定业务模块的缓存
            
            // 示例：清理临时缓存（如果有使用特定前缀的临时缓存）
            // 注意：在生产环境中，应该谨慎使用keys命令，因为它可能会阻塞Redis服务器
            // 对于大型系统，建议使用SCAN命令替代
            
            log.debug("Redis cache cleanup operations completed");
        } catch (Exception e) {
            log.error("Failed to perform Redis cache cleanup operations", e);
        }
    }

    /**
     * 手动清理指定前缀的本地缓存
     * @param prefix 缓存键前缀
     * @return 清理的缓存数量
     */
    public int evictLocalCacheByPrefix(String prefix) {
        log.info("Manually evicting local cache with prefix: {}", prefix);
        
        try {
            int count = localCacheService.clearByPrefix(prefix);
            log.info("Evicted {} items from local cache with prefix: {}", count, prefix);
            return count;
        } catch (Exception e) {
            log.error("Failed to evict local cache with prefix: {}", prefix, e);
            return 0;
        }
    }

    /**
     * 手动清理指定键的本地缓存
     * @param key 缓存键
     * @return 是否清理成功
     */
    public boolean evictLocalCacheByKey(String key) {
        log.info("Manually evicting local cache key: {}", key);
        
        try {
            boolean result = localCacheService.delete(key);
            log.info("Evicted local cache key: {}, success: {}", key, result);
            return result;
        } catch (Exception e) {
            log.error("Failed to evict local cache key: {}", key, e);
            return false;
        }
    }

    /**
     * 手动清理所有本地缓存
     */
    public void evictAllLocalCache() {
        log.info("Manually clearing all local cache");
        
        try {
            localCacheService.clear();
            log.info("All local cache cleared successfully");
        } catch (Exception e) {
            log.error("Failed to clear all local cache", e);
        }
    }

    /**
     * 获取缓存清理统计信息
     * @return 统计信息映射
     */
    public java.util.Map<String, Object> getCleanupStatistics() {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        
        stats.put("totalCleanupCount", totalCleanupCount.get());
        stats.put("lastCleanupTime", lastCleanupTime.get());
        stats.put("localCacheSize", localCacheService.size());
        stats.put("redisEnabled", redisEnabled);
        stats.put("statisticsEnabled", statisticsEnabled);
        
        // 如果启用了统计功能，获取更详细的本地缓存统计
        if (statisticsEnabled) {
            stats.putAll(localCacheService.getStatistics());
        }
        
        return stats;
    }

    /**
     * 重置统计信息
     */
    public void resetStatistics() {
        totalCleanupCount.set(0);
        lastCleanupTime.set(0);
        log.info("Cache cleanup statistics reset");
    }

    /**
     * 检查缓存健康状态
     * @return 健康状态报告
     */
    public CacheHealthReport checkHealth() {
        log.debug("Checking cache health");
        
        CacheHealthReport report = new CacheHealthReport();
        report.setLocalCacheHealth(true); // 默认为健康
        report.setRedisCacheHealth(true); // 默认为健康
        
        try {
            // 检查本地缓存状态
            int localCacheSize = localCacheService.size();
            report.setLocalCacheSize(localCacheSize);
            
            // 可以添加更多的健康检查逻辑
            // 例如：检查缓存大小是否超过阈值，是否有异常情况等
            
            // 检查Redis连接状态（如果启用了Redis）
            if (redisEnabled) {
                try {
                    // 执行一个简单的Redis命令来检查连接状态
                    boolean redisAvailable = redisCacheService.hasKey("health_check_key");
                    report.setRedisCacheHealth(redisAvailable);
                    log.debug("Redis cache health check: {}", redisAvailable);
                } catch (Exception e) {
                    log.warn("Redis health check failed", e);
                    report.setRedisCacheHealth(false);
                }
            }
            
            // 计算整体健康状态
            report.setOverallHealth(
                report.isLocalCacheHealth() && (!redisEnabled || report.isRedisCacheHealth())
            );
            
        } catch (Exception e) {
            log.error("Cache health check failed", e);
            report.setOverallHealth(false);
        }
        
        return report;
    }

    /**
     * 缓存健康报告类
     */
    public static class CacheHealthReport {
        private boolean overallHealth;
        private boolean localCacheHealth;
        private boolean redisCacheHealth;
        private int localCacheSize;
        private long timestamp = System.currentTimeMillis();

        // Getters and Setters
        public boolean isOverallHealth() {
            return overallHealth;
        }

        public void setOverallHealth(boolean overallHealth) {
            this.overallHealth = overallHealth;
        }

        public boolean isLocalCacheHealth() {
            return localCacheHealth;
        }

        public void setLocalCacheHealth(boolean localCacheHealth) {
            this.localCacheHealth = localCacheHealth;
        }

        public boolean isRedisCacheHealth() {
            return redisCacheHealth;
        }

        public void setRedisCacheHealth(boolean redisCacheHealth) {
            this.redisCacheHealth = redisCacheHealth;
        }

        public int getLocalCacheSize() {
            return localCacheSize;
        }

        public void setLocalCacheSize(int localCacheSize) {
            this.localCacheSize = localCacheSize;
        }

        public long getTimestamp() {
            return timestamp;
        }

        @Override
        public String toString() {
            return "CacheHealthReport{" +
                    "overallHealth=" + overallHealth +
                    ", localCacheHealth=" + localCacheHealth +
                    ", redisCacheHealth=" + redisCacheHealth +
                    ", localCacheSize=" + localCacheSize +
                    ", timestamp=" + timestamp +
                    '}';
        }
    }
}