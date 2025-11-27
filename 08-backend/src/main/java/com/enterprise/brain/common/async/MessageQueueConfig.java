package com.enterprise.brain.common.async;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * 消息队列和异步配置
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Configuration
@EnableAsync
public class MessageQueueConfig {

    /**
     * 异步任务线程池
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // 核心线程数
        executor.setCorePoolSize(10);
        
        // 最大线程数
        executor.setMaxPoolSize(20);
        
        // 队列容量
        executor.setQueueCapacity(200);
        
        // 线程空闲时间（秒）
        executor.setKeepAliveSeconds(60);
        
        // 线程名称前缀
        executor.setThreadNamePrefix("async-task-");
        
        // 拒绝策略：由调用线程处理
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        
        // 等待所有任务完成后再关闭线程池
        executor.setWaitForTasksToCompleteOnShutdown(true);
        
        // 等待时间（秒）
        executor.setAwaitTerminationSeconds(60);
        
        executor.initialize();
        return executor;
    }

    /**
     * 定时任务线程池
     */
    @Bean(name = "scheduledExecutor")
    public Executor scheduledExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(50);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("scheduled-task-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        
        executor.initialize();
        return executor;
    }

    /**
     * 邮件发送线程池
     */
    @Bean(name = "emailExecutor")
    public Executor emailExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        executor.setCorePoolSize(3);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("email-task-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        
        executor.initialize();
        return executor;
    }
}
