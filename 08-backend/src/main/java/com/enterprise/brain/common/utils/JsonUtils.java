package com.enterprise.brain.common.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * JSON工具类
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Slf4j
public class JsonUtils {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    static {
        // 配置ObjectMapper
        // 忽略未知属性
        OBJECT_MAPPER.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        // 忽略空Bean转json错误
        OBJECT_MAPPER.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        // 日期格式化
        OBJECT_MAPPER.registerModule(new JavaTimeModule());
        OBJECT_MAPPER.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /**
     * 对象转JSON字符串
     */
    public static String toJson(Object obj) {
        if (obj == null) {
            return null;
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.error("对象转JSON失败: {}", e.getMessage(), e);
            throw new RuntimeException("对象转JSON失败", e);
        }
    }

    /**
     * 对象转格式化的JSON字符串
     */
    public static String toJsonPretty(Object obj) {
        if (obj == null) {
            return null;
        }
        try {
            return OBJECT_MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.error("对象转JSON失败: {}", e.getMessage(), e);
            throw new RuntimeException("对象转JSON失败", e);
        }
    }

    /**
     * JSON字符串转对象
     */
    public static <T> T fromJson(String json, Class<T> clazz) {
        if (StringUtils.isEmpty(json) || clazz == null) {
            return null;
        }
        try {
            return OBJECT_MAPPER.readValue(json, clazz);
        } catch (JsonProcessingException e) {
            log.error("JSON转对象失败: {}", e.getMessage(), e);
            throw new RuntimeException("JSON转对象失败", e);
        }
    }

    /**
     * JSON字符串转对象（使用TypeReference）
     */
    public static <T> T fromJson(String json, TypeReference<T> typeReference) {
        if (StringUtils.isEmpty(json) || typeReference == null) {
            return null;
        }
        try {
            return OBJECT_MAPPER.readValue(json, typeReference);
        } catch (JsonProcessingException e) {
            log.error("JSON转对象失败: {}", e.getMessage(), e);
            throw new RuntimeException("JSON转对象失败", e);
        }
    }

    /**
     * JSON字符串转List
     */
    public static <T> List<T> fromJsonToList(String json, Class<T> clazz) {
        if (StringUtils.isEmpty(json) || clazz == null) {
            return null;
        }
        try {
            return OBJECT_MAPPER.readValue(json, 
                OBJECT_MAPPER.getTypeFactory().constructCollectionType(List.class, clazz));
        } catch (JsonProcessingException e) {
            log.error("JSON转List失败: {}", e.getMessage(), e);
            throw new RuntimeException("JSON转List失败", e);
        }
    }

    /**
     * JSON字符串转Map
     */
    public static Map<String, Object> fromJsonToMap(String json) {
        if (StringUtils.isEmpty(json)) {
            return null;
        }
        try {
            return OBJECT_MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            log.error("JSON转Map失败: {}", e.getMessage(), e);
            throw new RuntimeException("JSON转Map失败", e);
        }
    }

    /**
     * 对象转Map
     */
    public static Map<String, Object> objectToMap(Object obj) {
        if (obj == null) {
            return null;
        }
        return OBJECT_MAPPER.convertValue(obj, new TypeReference<Map<String, Object>>() {});
    }

    /**
     * Map转对象
     */
    public static <T> T mapToObject(Map<String, Object> map, Class<T> clazz) {
        if (map == null || clazz == null) {
            return null;
        }
        return OBJECT_MAPPER.convertValue(map, clazz);
    }

    /**
     * 对象深拷贝
     */
    public static <T> T deepCopy(T obj, Class<T> clazz) {
        if (obj == null || clazz == null) {
            return null;
        }
        try {
            String json = toJson(obj);
            return fromJson(json, clazz);
        } catch (Exception e) {
            log.error("对象深拷贝失败: {}", e.getMessage(), e);
            throw new RuntimeException("对象深拷贝失败", e);
        }
    }

    /**
     * 判断字符串是否为有效JSON
     */
    public static boolean isValidJson(String json) {
        if (StringUtils.isEmpty(json)) {
            return false;
        }
        try {
            OBJECT_MAPPER.readTree(json);
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    /**
     * 获取ObjectMapper实例
     */
    public static ObjectMapper getObjectMapper() {
        return OBJECT_MAPPER;
    }

    private JsonUtils() {
        throw new IllegalStateException("Utility class");
    }
}
