package com.enterprise.brain;

import lombok.extern.slf4j.Slf4j;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.net.InetAddress;
import java.net.UnknownHostException;

/**
 * Enterprise Brain主应用启动类
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Slf4j
@SpringBootApplication
@EnableScheduling
@MapperScan("com.enterprise.brain.**.mapper")
public class EnterpriseBrainApplication {

    public static void main(String[] args) throws UnknownHostException {
        ConfigurableApplicationContext application = SpringApplication.run(EnterpriseBrainApplication.class, args);
        
        Environment env = application.getEnvironment();
        String protocol = "http";
        if (env.getProperty("server.ssl.key-store") != null) {
            protocol = "https";
        }
        
        String hostAddress = InetAddress.getLocalHost().getHostAddress();
        String port = env.getProperty("server.port", "8080");
        String contextPath = env.getProperty("server.servlet.context-path", "");
        
        log.info("\n----------------------------------------------------------\n\t" +
                "Application '{}' is running! Access URLs:\n\t" +
                "Local: \t\t{}://localhost:{}{}\n\t" +
                "External: \t{}://{}:{}{}\n\t" +
                "Swagger Doc: \t{}://{}:{}{}/swagger-ui.html\n\t" +
                "Profile(s): \t{}\n" +
                "----------------------------------------------------------",
                env.getProperty("spring.application.name", "Enterprise Brain"),
                protocol,
                port,
                contextPath,
                protocol,
                hostAddress,
                port,
                contextPath,
                protocol,
                hostAddress,
                port,
                contextPath,
                env.getActiveProfiles().length == 0 ? "default" : String.join(", ", env.getActiveProfiles())
        );
    }
}
