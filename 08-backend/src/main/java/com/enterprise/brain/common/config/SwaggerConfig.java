package com.enterprise.brain.common.config;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger配置类
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Enterprise Brain API")
                        .description("企业级智能管理系统API文档")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Enterprise Brain Team")
                                .email("support@enterprise-brain.com")
                                .url("https://www.enterprise-brain.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
                .externalDocs(new ExternalDocumentation()
                        .description("Enterprise Brain Documentation")
                        .url("https://docs.enterprise-brain.com"));
    }
}
