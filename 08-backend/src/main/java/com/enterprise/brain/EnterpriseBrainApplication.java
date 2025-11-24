package com.enterprise.brain;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class EnterpriseBrainApplication {
    public static void main(String[] args) {
        SpringApplication.run(EnterpriseBrainApplication.class, args);
    }
}
