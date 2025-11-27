package com.enterprise.brain.common.security;

import com.enterprise.brain.common.annotation.PermissionAnnotation;
import com.enterprise.brain.common.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * 权限验证器
 * 基于注解的权限验证，支持角色和权限码验证
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Slf4j
@Aspect
@Component
public class PermissionValidator {

    /**
     * 权限验证切面
     */
    @Around("@annotation(com.enterprise.brain.common.annotation.PermissionAnnotation)")
    public Object validatePermission(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        
        // 获取权限注解
        PermissionAnnotation permissionAnnotation = method.getAnnotation(PermissionAnnotation.class);
        if (permissionAnnotation == null) {
            return joinPoint.proceed();
        }
        
        // 获取当前用户信息
        Long userId = getCurrentUserId();
        String username = getCurrentUsername();
        
        log.debug("权限验证 - 用户: {} | 方法: {}", username, method.getName());
        
        // 验证权限
        boolean hasPermission = false;
        
        // 1. 验证角色
        String[] requiredRoles = permissionAnnotation.roles();
        if (requiredRoles.length > 0) {
            hasPermission = validateRoles(userId, requiredRoles, permissionAnnotation.logical());
        }
        
        // 2. 验证权限码
        String[] requiredPermissions = permissionAnnotation.permissions();
        if (requiredPermissions.length == 0) {
            requiredPermissions = permissionAnnotation.value();
        }
        
        if (requiredPermissions.length > 0) {
            boolean permissionValid = validatePermissions(userId, requiredPermissions, permissionAnnotation.logical());
            hasPermission = hasPermission || permissionValid;
        }
        
        // 如果没有配置任何权限要求，则允许访问
        if (requiredRoles.length == 0 && requiredPermissions.length == 0) {
            hasPermission = true;
        }
        
        // 权限验证失败
        if (!hasPermission) {
            log.warn("权限验证失败 - 用户: {} | 方法: {} | 要求角色: {} | 要求权限: {}",
                    username, method.getName(),
                    Arrays.toString(requiredRoles),
                    Arrays.toString(requiredPermissions));
            
            throw new BusinessException("ACCESS_DENIED", "权限不足，无法访问该资源");
        }
        
        log.debug("权限验证成功 - 用户: {}", username);
        return joinPoint.proceed();
    }

    /**
     * 验证角色
     *
     * @param userId        用户ID
     * @param requiredRoles 需要的角色
     * @param logical       逻辑类型
     * @return 是否有权限
     */
    private boolean validateRoles(Long userId, String[] requiredRoles, PermissionAnnotation.LogicalType logical) {
        Set<String> userRoles = getUserRoles(userId);
        
        if (logical == PermissionAnnotation.LogicalType.AND) {
            // AND逻辑：需要拥有所有角色
            return userRoles.containsAll(Arrays.asList(requiredRoles));
        } else {
            // OR逻辑：拥有任意一个角色即可
            for (String role : requiredRoles) {
                if (userRoles.contains(role)) {
                    return true;
                }
            }
            return false;
        }
    }

    /**
     * 验证权限码
     *
     * @param userId              用户ID
     * @param requiredPermissions 需要的权限码
     * @param logical             逻辑类型
     * @return 是否有权限
     */
    private boolean validatePermissions(Long userId, String[] requiredPermissions, PermissionAnnotation.LogicalType logical) {
        Set<String> userPermissions = getUserPermissions(userId);
        
        if (logical == PermissionAnnotation.LogicalType.AND) {
            // AND逻辑：需要拥有所有权限
            return userPermissions.containsAll(Arrays.asList(requiredPermissions));
        } else {
            // OR逻辑：拥有任意一个权限即可
            for (String permission : requiredPermissions) {
                if (userPermissions.contains(permission)) {
                    return true;
                }
            }
            return false;
        }
    }

    /**
     * 检查用户是否有指定角色
     *
     * @param userId 用户ID
     * @param role   角色
     * @return 是否拥有角色
     */
    public boolean hasRole(Long userId, String role) {
        Set<String> userRoles = getUserRoles(userId);
        return userRoles.contains(role);
    }

    /**
     * 检查用户是否有任意一个角色
     *
     * @param userId 用户ID
     * @param roles  角色数组
     * @return 是否拥有任意角色
     */
    public boolean hasAnyRole(Long userId, String... roles) {
        Set<String> userRoles = getUserRoles(userId);
        for (String role : roles) {
            if (userRoles.contains(role)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 检查用户是否有所有角色
     *
     * @param userId 用户ID
     * @param roles  角色数组
     * @return 是否拥有所有角色
     */
    public boolean hasAllRoles(Long userId, String... roles) {
        Set<String> userRoles = getUserRoles(userId);
        return userRoles.containsAll(Arrays.asList(roles));
    }

    /**
     * 检查用户是否有指定权限
     *
     * @param userId     用户ID
     * @param permission 权限码
     * @return 是否拥有权限
     */
    public boolean hasPermission(Long userId, String permission) {
        Set<String> userPermissions = getUserPermissions(userId);
        return userPermissions.contains(permission);
    }

    /**
     * 检查用户是否有任意一个权限
     *
     * @param userId      用户ID
     * @param permissions 权限码数组
     * @return 是否拥有任意权限
     */
    public boolean hasAnyPermission(Long userId, String... permissions) {
        Set<String> userPermissions = getUserPermissions(userId);
        for (String permission : permissions) {
            if (userPermissions.contains(permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 检查用户是否有所有权限
     *
     * @param userId      用户ID
     * @param permissions 权限码数组
     * @return 是否拥有所有权限
     */
    public boolean hasAllPermissions(Long userId, String... permissions) {
        Set<String> userPermissions = getUserPermissions(userId);
        return userPermissions.containsAll(Arrays.asList(permissions));
    }

    /**
     * 检查当前用户是否为管理员
     *
     * @return 是否为管理员
     */
    public boolean isAdmin() {
        return hasRole(getCurrentUserId(), "ADMIN");
    }

    /**
     * 获取用户角色列表
     *
     * @param userId 用户ID
     * @return 角色集合
     */
    private Set<String> getUserRoles(Long userId) {
        // TODO: 从数据库或缓存中获取用户角色
        // 示例数据
        Set<String> roles = new HashSet<>();
        if (userId == 1L) {
            roles.add("ADMIN");
            roles.add("USER");
        } else {
            roles.add("USER");
        }
        return roles;
    }

    /**
     * 获取用户权限列表
     *
     * @param userId 用户ID
     * @return 权限集合
     */
    private Set<String> getUserPermissions(Long userId) {
        // TODO: 从数据库或缓存中获取用户权限
        // 示例数据
        Set<String> permissions = new HashSet<>();
        if (userId == 1L) {
            permissions.add("system:user:view");
            permissions.add("system:user:add");
            permissions.add("system:user:edit");
            permissions.add("system:user:delete");
            permissions.add("system:role:view");
            permissions.add("system:role:edit");
        } else {
            permissions.add("system:user:view");
        }
        return permissions;
    }

    /**
     * 获取当前用户ID
     */
    private Long getCurrentUserId() {
        // TODO: 从Security Context获取当前用户ID
        return 1L;
    }

    /**
     * 获取当前用户名
     */
    private String getCurrentUsername() {
        // TODO: 从Security Context获取当前用户名
        return "admin";
    }

    /**
     * 验证数据权限
     *
     * @param userId   用户ID
     * @param dataType 数据类型
     * @param dataId   数据ID
     * @return 是否有权限访问该数据
     */
    public boolean validateDataPermission(Long userId, String dataType, Long dataId) {
        // TODO: 实现数据权限验证逻辑
        // 例如：验证用户是否可以访问某个部门的数据、某个项目的数据等
        log.debug("验证数据权限 - 用户: {} | 数据类型: {} | 数据ID: {}", userId, dataType, dataId);
        return true;
    }

    /**
     * 获取用户数据权限范围
     *
     * @param userId   用户ID
     * @param dataType 数据类型
     * @return 数据权限范围（如部门ID列表、组织ID列表等）
     */
    public Set<Long> getDataPermissionScope(Long userId, String dataType) {
        // TODO: 实现获取数据权限范围的逻辑
        Set<Long> scope = new HashSet<>();
        scope.add(1L);
        return scope;
    }
}
