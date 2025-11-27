package com.enterprise.brain.common.base;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.enterprise.brain.common.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

/**
 * Controller基类
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Slf4j
public abstract class BaseController {

    /**
     * 成功响应
     */
    protected <T> ApiResponse<T> success(T data) {
        return ApiResponse.success(data);
    }

    /**
     * 成功响应（无数据）
     */
    protected <T> ApiResponse<T> success() {
        return ApiResponse.success();
    }

    /**
     * 成功响应（带消息）
     */
    protected <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.success(message, data);
    }

    /**
     * 失败响应
     */
    protected <T> ApiResponse<T> fail(String message) {
        return ApiResponse.fail(message);
    }

    /**
     * 失败响应（带错误码）
     */
    protected <T> ApiResponse<T> fail(String code, String message) {
        return ApiResponse.fail(code, message);
    }

    /**
     * 分页成功响应
     */
    protected <T> ApiResponse<Page<T>> successPage(Page<T> page) {
        return ApiResponse.success(page);
    }

    /**
     * 列表成功响应
     */
    protected <T> ApiResponse<List<T>> successList(List<T> list) {
        return ApiResponse.success(list);
    }

    /**
     * 获取当前登录用户ID
     */
    protected Long getCurrentUserId() {
        // TODO: 从Security Context中获取当前用户ID
        return 1L;
    }

    /**
     * 获取当前登录用户名
     */
    protected String getCurrentUsername() {
        // TODO: 从Security Context中获取当前用户名
        return "admin";
    }

    /**
     * 判断是否为管理员
     */
    protected boolean isAdmin() {
        // TODO: 从Security Context中判断是否为管理员
        return false;
    }
}
