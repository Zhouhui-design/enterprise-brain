package com.enterprise.brain.common.constants;

/**
 * 系统常量
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
public class SystemConstants {

    /**
     * 系统名称
     */
    public static final String SYSTEM_NAME = "Enterprise Brain";

    /**
     * 系统版本
     */
    public static final String SYSTEM_VERSION = "1.0.0";

    /**
     * 系统编码
     */
    public static final String SYSTEM_ENCODING = "UTF-8";

    /**
     * 默认页码
     */
    public static final int DEFAULT_PAGE_NUM = 1;

    /**
     * 默认每页大小
     */
    public static final int DEFAULT_PAGE_SIZE = 10;

    /**
     * 最大每页大小
     */
    public static final int MAX_PAGE_SIZE = 1000;

    /**
     * 默认日期格式
     */
    public static final String DEFAULT_DATE_FORMAT = "yyyy-MM-dd";

    /**
     * 默认时间格式
     */
    public static final String DEFAULT_DATETIME_FORMAT = "yyyy-MM-dd HH:mm:ss";

    /**
     * 默认时间戳格式
     */
    public static final String DEFAULT_TIMESTAMP_FORMAT = "yyyy-MM-dd HH:mm:ss.SSS";

    /**
     * Token前缀
     */
    public static final String TOKEN_PREFIX = "Bearer ";

    /**
     * Token请求头
     */
    public static final String TOKEN_HEADER = "Authorization";

    /**
     * 用户ID请求头
     */
    public static final String USER_ID_HEADER = "X-User-Id";

    /**
     * 用户名请求头
     */
    public static final String USERNAME_HEADER = "X-Username";

    /**
     * 请求追踪ID
     */
    public static final String TRACE_ID_HEADER = "X-Trace-Id";

    /**
     * 逻辑删除 - 正常
     */
    public static final Integer DELETED_NO = 0;

    /**
     * 逻辑删除 - 已删除
     */
    public static final Integer DELETED_YES = 1;

    /**
     * 状态 - 启用
     */
    public static final Integer STATUS_ENABLED = 1;

    /**
     * 状态 - 禁用
     */
    public static final Integer STATUS_DISABLED = 0;

    /**
     * 是 - 1
     */
    public static final Integer YES = 1;

    /**
     * 否 - 0
     */
    public static final Integer NO = 0;

    /**
     * 超级管理员ID
     */
    public static final Long SUPER_ADMIN_ID = 1L;

    /**
     * 默认密码
     */
    public static final String DEFAULT_PASSWORD = "123456";

    /**
     * 验证码有效期（分钟）
     */
    public static final Integer CAPTCHA_EXPIRATION = 5;

    /**
     * Token有效期（小时）
     */
    public static final Integer TOKEN_EXPIRATION = 24;

    /**
     * 刷新Token有效期（天）
     */
    public static final Integer REFRESH_TOKEN_EXPIRATION = 7;

    /**
     * 缓存键前缀
     */
    public static final String CACHE_PREFIX = "eb:";

    /**
     * 用户缓存前缀
     */
    public static final String USER_CACHE_PREFIX = CACHE_PREFIX + "user:";

    /**
     * 权限缓存前缀
     */
    public static final String PERMISSION_CACHE_PREFIX = CACHE_PREFIX + "permission:";

    /**
     * 验证码缓存前缀
     */
    public static final String CAPTCHA_CACHE_PREFIX = CACHE_PREFIX + "captcha:";

    /**
     * Token缓存前缀
     */
    public static final String TOKEN_CACHE_PREFIX = CACHE_PREFIX + "token:";

    /**
     * 缓存有效期（秒）
     */
    public static final Long CACHE_EXPIRATION = 3600L;

    /**
     * 文件上传路径
     */
    public static final String UPLOAD_PATH = "/uploads/";

    /**
     * 临时文件路径
     */
    public static final String TEMP_PATH = "/temp/";

    /**
     * 最大文件上传大小（MB）
     */
    public static final Integer MAX_FILE_SIZE = 100;

    /**
     * 允许的图片格式
     */
    public static final String[] IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"};

    /**
     * 允许的文档格式
     */
    public static final String[] DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt"};

    /**
     * 允许的压缩包格式
     */
    public static final String[] ARCHIVE_EXTENSIONS = {".zip", ".rar", ".7z", ".tar", ".gz"};

    private SystemConstants() {
        throw new IllegalStateException("Utility class");
    }
}
