package com.enterprise.brain.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * 安全配置类
 * 配置Spring Security的安全策略，包括认证、授权、CORS等
 * 
 * @author Enterprise Brain Team
 * @version 2.0.0
 * @since 2024-01-01
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    /**
     * 密码编码器
     * 使用BCrypt算法对密码进行加密
     * 
     * @return 密码编码器实例
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    /**
     * 安全过滤器链配置
     * 配置HTTP安全策略，包括访问控制、CORS、CSRF等
     * 
     * @param http HTTP安全配置对象
     * @return 安全过滤器链
     * @throws Exception 配置异常
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 禁用CSRF保护（API项目通常不需要）
            .csrf(AbstractHttpConfigurer::disable)
            
            // 配置会话管理为无状态
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // 配置授权规则
            .authorizeHttpRequests(auth -> auth
                // 公开访问的端点
                .requestMatchers(
                    "/api/smart-table/health",
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/swagger-resources/**",
                    "/webjars/**",
                    "/actuator/health/**"
                ).permitAll()
                
                // 管理员权限的端点
                .requestMatchers(
                    "/api/smart-table/admin/**",
                    "DELETE /api/smart-table/**"
                ).hasRole("ADMIN")
                
                // 用户权限的端点
                .requestMatchers("/api/smart-table/**").hasRole("USER")
                
                // 其他请求需要认证
                .anyRequest().authenticated()
            )
            
            // 配置CORS
            .cors(cors -> cors.configure(http))
            
            // 添加安全头
            .headers(headers -> headers
                .frameOptions().deny()
                .contentTypeOptions().and()
                .httpStrictTransportSecurity()
            );
        
        return http.build();
    }
}