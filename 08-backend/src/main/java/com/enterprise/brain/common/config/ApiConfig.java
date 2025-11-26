package com.enterprise.brain.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * API配置类
 * 配置OpenAPI文档生成的基本信息
 * 
 * @author Enterprise Brain Team
 * @version 1.0.0
 * @since 2024-01-01
 */
@Configuration
public class ApiConfig {
    
    /**
     * 应用名称
     */
    @Value("${spring.application.name:Enterprise Brain}")
    private String applicationName;
    
    /**
     * 应用版本
     */
    @Value("${application.version:1.0.0}")
    private String applicationVersion;
    
    /**
     * 应用描述
     */
    @Value("${application.description:企业级智能管理系统}")
    private String applicationDescription;
    
    /**
     * 服务器URL
     */
    @Value("${server.url:http://localhost:8080}")
    private String serverUrl;
    
    /**
     * 配置OpenAPI文档信息
     * 
     * @return OpenAPI配置对象
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(apiInfo())
                .servers(List.of(apiServer()));
    }
    
    /**
     * API基本信息配置
     * 
     * @return API信息对象
     */
    private Info apiInfo() {
        return new Info()
                .title(applicationName + " API")
                .description(applicationDescription)
                .version(applicationVersion)
                .contact(apiContact())
                .license(apiLicense());
    }
    
    /**
     * API联系信息
     * 
     * @return 联系人信息
     */
    private Contact apiContact() {
        return new Contact()
                .name("Enterprise Brain Team")
                .email("support@enterprise-brain.com")
                .url("https://www.enterprise-brain.com");
    }
    
    /**
     * API许可证信息
     * 
     * @return 许可证信息
     */
    private License apiLicense() {
        return new License()
                .name("MIT License")
                .url("https://opensource.org/licenses/MIT");
    }
    
    /**
     * API服务器信息
     * 
     * @return 服务器信息
     */
    private Server apiServer() {
        return new Server()
                .url(serverUrl)
                .description("Production Server");
    }
}