package com.enterprise.brain.common.cache;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * 缓存配置类
 * 配置Redis缓存和本地缓存相关的Bean
 */
@Configuration
@EnableCaching
@EnableScheduling
@EnableConfigurationProperties(RedisProperties.class)
public class CacheConfig {

    @Value("${cache.default-ttl:3600}")
    private long defaultTtl;

    @Value("${cache.redis.enabled:true}")
    private boolean redisEnabled;

    @Value("${cache.redis.key-prefix:brain:}")
    private String redisKeyPrefix;

    @Value("${cache.redis.use-prefix:true}")
    private boolean usePrefix;

    /**
     * 配置RedisTemplate
     * @param connectionFactory Redis连接工厂
     * @return RedisTemplate实例
     */
    @Bean
    @ConditionalOnMissingBean(name = "redisTemplate")
    @ConditionalOnClass(RedisOperations.class)
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // 使用Jackson2JsonRedisSerializer来序列化和反序列化redis的value值
        Jackson2JsonRedisSerializer<Object> jackson2JsonRedisSerializer = new Jackson2JsonRedisSerializer<>(Object.class);
        ObjectMapper om = new ObjectMapper();
        om.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        om.enableDefaultTyping(ObjectMapper.DefaultTyping.NON_FINAL);
        jackson2JsonRedisSerializer.setObjectMapper(om);

        // 使用StringRedisSerializer来序列化和反序列化redis的key值
        StringRedisSerializer stringRedisSerializer = new StringRedisSerializer();

        // 设置key的序列化器
        template.setKeySerializer(stringRedisSerializer);
        template.setHashKeySerializer(stringRedisSerializer);
        // 设置value的序列化器
        template.setValueSerializer(jackson2JsonRedisSerializer);
        template.setHashValueSerializer(jackson2JsonRedisSerializer);

        template.afterPropertiesSet();
        return template;
    }

    /**
     * 配置缓存管理器
     * @param redisConnectionFactory Redis连接工厂
     * @return 缓存管理器
     */
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnClass(RedisConnectionFactory.class)
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        // 创建默认缓存配置
        RedisCacheConfiguration defaultCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofSeconds(defaultTtl))
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(
                        new Jackson2JsonRedisSerializer<>(Object.class)));

        if (usePrefix) {
            defaultCacheConfig = defaultCacheConfig.prefixCacheNameWith(redisKeyPrefix);
        }

        // 创建缓存名称和过期时间的映射
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // 可以为不同的缓存名称配置不同的过期时间
        cacheConfigurations.put("userCache", RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))
                .prefixCacheNameWith(redisKeyPrefix));
        
        cacheConfigurations.put("systemCache", RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1))
                .prefixCacheNameWith(redisKeyPrefix));
        
        cacheConfigurations.put("dataCache", RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(24))
                .prefixCacheNameWith(redisKeyPrefix));

        // 创建Redis缓存管理器
        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(defaultCacheConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }

    /**
     * 配置Redis连接工厂的自定义设置
     * 可以根据需要覆盖默认的LettuceConnectionFactory配置
     */
    @Configuration
    @ConditionalOnClass({LettuceConnectionFactory.class})
    static class RedisConnectionFactoryConfig {
        // 这里可以添加自定义的Redis连接工厂配置
        // 例如：配置连接池、SSL、集群等
    }

    /**
     * 缓存常量类
     * 定义常用的缓存键前缀和缓存名称
     */
    public static class CacheConstants {
        // 缓存键前缀
        public static final String USER_CACHE_PREFIX = "user:";  // 用户相关缓存前缀
        public static final String SYSTEM_CACHE_PREFIX = "system:";  // 系统相关缓存前缀
        public static final String DATA_CACHE_PREFIX = "data:";  // 数据相关缓存前缀
        public static final String TEMP_CACHE_PREFIX = "temp:";  // 临时缓存前缀
        
        // 缓存名称
        public static final String USER_CACHE = "userCache";  // 用户缓存
        public static final String SYSTEM_CACHE = "systemCache";  // 系统缓存
        public static final String DATA_CACHE = "dataCache";  // 数据缓存
        
        // 缓存过期时间（秒）
        public static final long USER_CACHE_TTL = 1800;  // 30分钟
        public static final long SYSTEM_CACHE_TTL = 3600;  // 1小时
        public static final long DATA_CACHE_TTL = 86400;  // 24小时
        public static final long TEMP_CACHE_TTL = 300;  // 5分钟
        
        // 防止实例化
        private CacheConstants() {
        }
    }

    /**
     * 生成缓存键的工具方法
     * @param prefix 前缀
     * @param id 标识符
     * @return 缓存键
     */
    public static String generateKey(String prefix, String id) {
        return prefix + id;
    }

    /**
     * 生成用户缓存键
     * @param userId 用户ID
     * @return 用户缓存键
     */
    public static String generateUserKey(String userId) {
        return generateKey(CacheConstants.USER_CACHE_PREFIX, userId);
    }

    /**
     * 生成系统缓存键
     * @param systemKey 系统键
     * @return 系统缓存键
     */
    public static String generateSystemKey(String systemKey) {
        return generateKey(CacheConstants.SYSTEM_CACHE_PREFIX, systemKey);
    }

    /**
     * 生成数据缓存键
     * @param dataKey 数据键
     * @return 数据缓存键
     */
    public static String generateDataKey(String dataKey) {
        return generateKey(CacheConstants.DATA_CACHE_PREFIX, dataKey);
    }

    /**
     * 生成临时缓存键
     * @param tempKey 临时键
     * @return 临时缓存键
     */
    public static String generateTempKey(String tempKey) {
        return generateKey(CacheConstants.TEMP_CACHE_PREFIX, tempKey);
    }
}