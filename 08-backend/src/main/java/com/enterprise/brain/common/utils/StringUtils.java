package com.enterprise.brain.common.utils;

import java.util.Collection;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * 字符串工具类
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
public class StringUtils extends org.apache.commons.lang3.StringUtils {

    /**
     * 手机号正则表达式
     */
    private static final Pattern PHONE_PATTERN = Pattern.compile("^1[3-9]\\d{9}$");

    /**
     * 邮箱正则表达式
     */
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[\\w-]+(\\.[\\w-]+)*@[\\w-]+(\\.[\\w-]+)+$");

    /**
     * 身份证正则表达式
     */
    private static final Pattern ID_CARD_PATTERN = Pattern.compile("^[1-9]\\d{5}(18|19|20)\\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]$");

    /**
     * 判断字符串是否为空
     */
    public static boolean isEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }

    /**
     * 判断字符串是否不为空
     */
    public static boolean isNotEmpty(String str) {
        return !isEmpty(str);
    }

    /**
     * 判断字符串是否为空白
     */
    public static boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }

    /**
     * 判断字符串是否不为空白
     */
    public static boolean isNotBlank(String str) {
        return !isBlank(str);
    }

    /**
     * 判断所有字符串是否都为空
     */
    public static boolean isAllEmpty(String... strs) {
        if (strs == null || strs.length == 0) {
            return true;
        }
        for (String str : strs) {
            if (isNotEmpty(str)) {
                return false;
            }
        }
        return true;
    }

    /**
     * 判断所有字符串是否都不为空
     */
    public static boolean isAllNotEmpty(String... strs) {
        if (strs == null || strs.length == 0) {
            return false;
        }
        for (String str : strs) {
            if (isEmpty(str)) {
                return false;
            }
        }
        return true;
    }

    /**
     * 判断是否有任一字符串为空
     */
    public static boolean hasEmpty(String... strs) {
        if (strs == null || strs.length == 0) {
            return true;
        }
        for (String str : strs) {
            if (isEmpty(str)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 去除字符串首尾空白
     */
    public static String trim(String str) {
        return str == null ? null : str.trim();
    }

    /**
     * 去除字符串首尾空白，空白字符串返回null
     */
    public static String trimToNull(String str) {
        String trimmed = trim(str);
        return isEmpty(trimmed) ? null : trimmed;
    }

    /**
     * 去除字符串首尾空白，null返回空字符串
     */
    public static String trimToEmpty(String str) {
        return str == null ? "" : str.trim();
    }

    /**
     * 字符串转驼峰命名
     */
    public static String toCamelCase(String str) {
        if (isEmpty(str)) {
            return str;
        }
        StringBuilder result = new StringBuilder();
        boolean upperCase = false;
        for (int i = 0; i < str.length(); i++) {
            char c = str.charAt(i);
            if (c == '_' || c == '-') {
                upperCase = true;
            } else {
                result.append(upperCase ? Character.toUpperCase(c) : Character.toLowerCase(c));
                upperCase = false;
            }
        }
        return result.toString();
    }

    /**
     * 驼峰转下划线
     */
    public static String toUnderscoreCase(String str) {
        if (isEmpty(str)) {
            return str;
        }
        StringBuilder result = new StringBuilder();
        result.append(Character.toLowerCase(str.charAt(0)));
        for (int i = 1; i < str.length(); i++) {
            char c = str.charAt(i);
            if (Character.isUpperCase(c)) {
                result.append('_').append(Character.toLowerCase(c));
            } else {
                result.append(c);
            }
        }
        return result.toString();
    }

    /**
     * 首字母大写
     */
    public static String capitalize(String str) {
        if (isEmpty(str)) {
            return str;
        }
        return Character.toUpperCase(str.charAt(0)) + str.substring(1);
    }

    /**
     * 首字母小写
     */
    public static String uncapitalize(String str) {
        if (isEmpty(str)) {
            return str;
        }
        return Character.toLowerCase(str.charAt(0)) + str.substring(1);
    }

    /**
     * 生成UUID（去除横杠）
     */
    public static String uuid() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    /**
     * 生成UUID（保留横杠）
     */
    public static String uuidWithDash() {
        return UUID.randomUUID().toString();
    }

    /**
     * 验证手机号
     */
    public static boolean isValidPhone(String phone) {
        return isNotEmpty(phone) && PHONE_PATTERN.matcher(phone).matches();
    }

    /**
     * 验证邮箱
     */
    public static boolean isValidEmail(String email) {
        return isNotEmpty(email) && EMAIL_PATTERN.matcher(email).matches();
    }

    /**
     * 验证身份证号
     */
    public static boolean isValidIdCard(String idCard) {
        return isNotEmpty(idCard) && ID_CARD_PATTERN.matcher(idCard).matches();
    }

    /**
     * 隐藏手机号中间4位
     */
    public static String hiddenPhone(String phone) {
        if (isEmpty(phone) || phone.length() != 11) {
            return phone;
        }
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }

    /**
     * 隐藏邮箱部分字符
     */
    public static String hiddenEmail(String email) {
        if (isEmpty(email) || !email.contains("@")) {
            return email;
        }
        int atIndex = email.indexOf("@");
        if (atIndex <= 3) {
            return email;
        }
        return email.substring(0, 2) + "***" + email.substring(atIndex);
    }

    /**
     * 隐藏身份证号中间部分
     */
    public static String hiddenIdCard(String idCard) {
        if (isEmpty(idCard) || idCard.length() != 18) {
            return idCard;
        }
        return idCard.substring(0, 6) + "********" + idCard.substring(14);
    }

    /**
     * 集合转字符串
     */
    public static String join(Collection<?> collection, String separator) {
        if (collection == null || collection.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (Object item : collection) {
            if (!first) {
                sb.append(separator);
            }
            sb.append(item);
            first = false;
        }
        return sb.toString();
    }

    /**
     * 判断字符串是否为数字
     */
    public static boolean isNumeric(String str) {
        if (isEmpty(str)) {
            return false;
        }
        return str.matches("-?\\d+(\\.\\d+)?");
    }

    /**
     * 判断字符串是否为整数
     */
    public static boolean isInteger(String str) {
        if (isEmpty(str)) {
            return false;
        }
        return str.matches("-?\\d+");
    }

    /**
     * 字符串重复
     */
    public static String repeat(String str, int count) {
        if (str == null || count <= 0) {
            return "";
        }
        return str.repeat(count);
    }

    /**
     * 安全的substring
     */
    public static String safeSubstring(String str, int start, int end) {
        if (isEmpty(str)) {
            return str;
        }
        int len = str.length();
        if (start < 0) start = 0;
        if (end > len) end = len;
        if (start >= end) return "";
        return str.substring(start, end);
    }

    private StringUtils() {
        throw new IllegalStateException("Utility class");
    }
}
