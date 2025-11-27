package com.enterprise.brain.common.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * 数据加密工具类
 * 提供AES加密、MD5、SHA256等加密方法
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Slf4j
@Component
public class DataEncryptor {

    /**
     * 默认加密算法
     */
    private static final String DEFAULT_ALGORITHM = "AES";

    /**
     * 默认密钥（生产环境应从配置中心读取）
     */
    private static final String DEFAULT_SECRET_KEY = "EnterpriseBrain2024SecretKey";

    /**
     * AES加密
     *
     * @param content 待加密内容
     * @return 加密后的Base64字符串
     */
    public String encryptAES(String content) {
        return encryptAES(content, DEFAULT_SECRET_KEY);
    }

    /**
     * AES加密
     *
     * @param content   待加密内容
     * @param secretKey 密钥
     * @return 加密后的Base64字符串
     */
    public String encryptAES(String content, String secretKey) {
        try {
            SecretKeySpec key = new SecretKeySpec(getAESKey(secretKey), DEFAULT_ALGORITHM);
            Cipher cipher = Cipher.getInstance(DEFAULT_ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key);
            byte[] encrypted = cipher.doFinal(content.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            log.error("AES加密失败: {}", e.getMessage(), e);
            throw new RuntimeException("AES加密失败", e);
        }
    }

    /**
     * AES解密
     *
     * @param encryptedContent 加密后的Base64字符串
     * @return 解密后的原文
     */
    public String decryptAES(String encryptedContent) {
        return decryptAES(encryptedContent, DEFAULT_SECRET_KEY);
    }

    /**
     * AES解密
     *
     * @param encryptedContent 加密后的Base64字符串
     * @param secretKey        密钥
     * @return 解密后的原文
     */
    public String decryptAES(String encryptedContent, String secretKey) {
        try {
            SecretKeySpec key = new SecretKeySpec(getAESKey(secretKey), DEFAULT_ALGORITHM);
            Cipher cipher = Cipher.getInstance(DEFAULT_ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key);
            byte[] decoded = Base64.getDecoder().decode(encryptedContent);
            byte[] decrypted = cipher.doFinal(decoded);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("AES解密失败: {}", e.getMessage(), e);
            throw new RuntimeException("AES解密失败", e);
        }
    }

    /**
     * 生成AES密钥
     *
     * @param seed 种子
     * @return 密钥字节数组
     */
    private byte[] getAESKey(String seed) throws Exception {
        KeyGenerator keyGenerator = KeyGenerator.getInstance(DEFAULT_ALGORITHM);
        SecureRandom secureRandom = SecureRandom.getInstance("SHA1PRNG");
        secureRandom.setSeed(seed.getBytes(StandardCharsets.UTF_8));
        keyGenerator.init(128, secureRandom);
        SecretKey secretKey = keyGenerator.generateKey();
        return secretKey.getEncoded();
    }

    /**
     * MD5加密
     *
     * @param content 待加密内容
     * @return MD5加密后的16进制字符串
     */
    public String encryptMD5(String content) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(content.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(digest);
        } catch (Exception e) {
            log.error("MD5加密失败: {}", e.getMessage(), e);
            throw new RuntimeException("MD5加密失败", e);
        }
    }

    /**
     * SHA256加密
     *
     * @param content 待加密内容
     * @return SHA256加密后的16进制字符串
     */
    public String encryptSHA256(String content) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(content.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(digest);
        } catch (Exception e) {
            log.error("SHA256加密失败: {}", e.getMessage(), e);
            throw new RuntimeException("SHA256加密失败", e);
        }
    }

    /**
     * Base64编码
     *
     * @param content 待编码内容
     * @return Base64编码后的字符串
     */
    public String encodeBase64(String content) {
        return Base64.getEncoder().encodeToString(content.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Base64解码
     *
     * @param encodedContent Base64编码的字符串
     * @return 解码后的原文
     */
    public String decodeBase64(String encodedContent) {
        byte[] decoded = Base64.getDecoder().decode(encodedContent);
        return new String(decoded, StandardCharsets.UTF_8);
    }

    /**
     * 敏感数据加密（手机号、身份证等）
     *
     * @param sensitiveData 敏感数据
     * @return 加密后的数据
     */
    public String encryptSensitiveData(String sensitiveData) {
        if (sensitiveData == null || sensitiveData.isEmpty()) {
            return sensitiveData;
        }
        return encryptAES(sensitiveData);
    }

    /**
     * 敏感数据解密
     *
     * @param encryptedData 加密后的敏感数据
     * @return 解密后的原始数据
     */
    public String decryptSensitiveData(String encryptedData) {
        if (encryptedData == null || encryptedData.isEmpty()) {
            return encryptedData;
        }
        return decryptAES(encryptedData);
    }

    /**
     * 密码加密（使用SHA256 + 盐值）
     *
     * @param password 原始密码
     * @param salt     盐值
     * @return 加密后的密码
     */
    public String encryptPassword(String password, String salt) {
        String saltedPassword = password + salt;
        return encryptSHA256(saltedPassword);
    }

    /**
     * 验证密码
     *
     * @param inputPassword     用户输入的密码
     * @param encryptedPassword 数据库中加密的密码
     * @param salt              盐值
     * @return 是否匹配
     */
    public boolean verifyPassword(String inputPassword, String encryptedPassword, String salt) {
        String encrypted = encryptPassword(inputPassword, salt);
        return encrypted.equals(encryptedPassword);
    }

    /**
     * 生成随机盐值
     *
     * @return 随机盐值
     */
    public String generateSalt() {
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[16];
        random.nextBytes(salt);
        return bytesToHex(salt);
    }

    /**
     * 字节数组转16进制字符串
     *
     * @param bytes 字节数组
     * @return 16进制字符串
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    /**
     * 16进制字符串转字节数组
     *
     * @param hex 16进制字符串
     * @return 字节数组
     */
    private byte[] hexToBytes(String hex) {
        int len = hex.length();
        byte[] bytes = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            bytes[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                    + Character.digit(hex.charAt(i + 1), 16));
        }
        return bytes;
    }
}
