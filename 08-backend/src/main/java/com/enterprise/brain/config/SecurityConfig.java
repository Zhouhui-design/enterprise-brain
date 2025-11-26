package com.enterprise.brain.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable() // 开发环境可以禁用CSRF，生产环境应该启用
            .authorizeRequests()
                // 允许匿名访问的接口
                .antMatchers("/api/auth/**").permitAll()
                // 菜单相关接口的权限控制通过@PreAuthorize注解实现
                .antMatchers("/api/system/menu/**").authenticated()
                // 其他所有请求都需要认证
                .anyRequest().authenticated()
            .and()
            // 配置您的认证方式，例如JWT、Session等
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS); // 无状态会话
        
        // 添加您的自定义过滤器，如JWT过滤器等
        // http.addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}