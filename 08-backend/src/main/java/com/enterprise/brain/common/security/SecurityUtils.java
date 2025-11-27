package com.enterprise.brain.common.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 安全工具类
 * 提供密码加密、Token生成等安全相关工具方法
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Slf4j
public class SecurityUtils {

    private static final PasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();

    /**
     * 密码加密
     *
     * @param rawPassword 原始密码
     * @return 加密后的密码
     */
    public static String encryptPassword(String rawPassword) {
        return PASSWORD_ENCODER.encode(rawPassword);
    }

    /**
     * 密码匹配验证
     *
     * @param rawPassword     原始密码
     * @param encodedPassword 加密后的密码
     * @return 是否匹配
     */
    public static boolean matchesPassword(String rawPassword, String encodedPassword) {
        return PASSWORD_ENCODER.matches(rawPassword, encodedPassword);
    }

    /**
     * 获取当前登录用户ID
     *
     * @return 用户ID
     */
    public static Long getCurrentUserId() {
        // TODO: 从Security Context获取
        return 1L;
    }

    /**
     * 获取当前登录用户名
     *
     * @return 用户名
     */
    public static String getCurrentUsername() {
        // TODO: 从Security Context获取
        return "admin";
    }

    /**
     * 判断当前用户是否为管理员
     *
     * @return 是否为管理员
     */
    public static boolean isAdmin() {
        // TODO: 从Security Context判断
        return false;
    }

    private SecurityUtils() {
        throw new IllegalStateException("Utility class");
    }
}
