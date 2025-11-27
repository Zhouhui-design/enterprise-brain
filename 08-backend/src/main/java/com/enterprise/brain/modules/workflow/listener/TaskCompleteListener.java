/**
 * 任务完成监听器类
 * 专门用于监听任务完成事件并进行处理
 */
package com.enterprise.brain.modules.workflow.listener;

import com.enterprise.brain.modules.workflow.engine.WorkflowEngine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

/**
 * 任务完成监听器实现
 */
public class TaskCompleteListener implements WorkflowEventListener {
    
    private static final Logger logger = LoggerFactory.getLogger(TaskCompleteListener.class);
    
    // 任务完成后的处理逻辑映射
    private final TaskCompletionHandlerRegistry handlerRegistry = new TaskCompletionHandlerRegistry();

    @Override
    public void onWorkflowEvent(WorkflowEngine.WorkflowEvent event) {
        // 只处理任务完成事件
        if (event.getType() == WorkflowEngine.WorkflowEvent.Type.TASK_COMPLETED) {
            handleTaskCompleted(event);
        }
    }

    @Override
    public int getPriority() {
        // 设置优先级，确保先于其他通用监听器执行
        return 100;
    }

    /**
     * 处理任务完成事件
     */
    private void handleTaskCompleted(WorkflowEngine.WorkflowEvent event) {
        WorkflowEngine.WorkflowInstance instance = event.getWorkflowInstance();
        WorkflowEngine.Task task = event.getTask();
        
        if (task == null) {
            logger.warn("任务完成事件中任务对象为空");
            return;
        }

        logger.info("工作流实例[{}]的任务[{}({})]已完成", 
                instance.getId(), task.getName(), task.getId());

        // 记录任务执行结果
        logTaskResult(task);

        // 根据任务类型获取对应的处理器
        TaskCompletionHandler handler = handlerRegistry.getHandler(task.getType());
        if (handler != null) {
            try {
                // 执行自定义处理逻辑
                handler.handleTaskCompletion(instance, task);
                logger.debug("为任务[{}]执行了自定义完成处理器", task.getId());
            } catch (Exception e) {
                logger.error("执行任务[{}]完成处理器时发生异常", task.getId(), e);
            }
        }

        // 检查是否需要触发通知
        checkAndSendNotifications(instance, task);
    }

    /**
     * 记录任务执行结果
     */
    private void logTaskResult(WorkflowEngine.Task task) {
        Map<String, Object> outputs = task.getOutputs();
        if (outputs != null && !outputs.isEmpty()) {
            StringBuilder resultLog = new StringBuilder("任务执行结果: ");
            outputs.forEach((key, value) -> {
                resultLog.append(key).append("=");
                // 对敏感信息进行脱敏
                if (isSensitiveField(key)) {
                    resultLog.append("***");
                } else {
                    resultLog.append(value);
                }
                resultLog.append(", ");
            });
            logger.debug(resultLog.toString());
        }
    }

    /**
     * 检查并发送通知
     */
    private void checkAndSendNotifications(WorkflowEngine.WorkflowInstance instance, WorkflowEngine.Task task) {
        // 这里可以根据工作流配置和任务类型决定是否发送通知
        // 例如，可以从任务输出中检查是否有通知配置
        Map<String, Object> outputs = task.getOutputs();
        if (outputs != null && outputs.containsKey("needNotification")) {
            Boolean needNotification = (Boolean) outputs.get("needNotification");
            if (Boolean.TRUE.equals(needNotification)) {
                String notificationMessage = (String) outputs.getOrDefault("notificationMessage", 
                        "任务[" + task.getName() + "]已完成");
                logger.info("发送任务完成通知: {}", notificationMessage);
                // TODO: 实现实际的通知发送逻辑
            }
        }
    }

    /**
     * 检查是否为敏感字段
     */
    private boolean isSensitiveField(String fieldName) {
        String lowerName = fieldName.toLowerCase();
        return lowerName.contains("password") || 
               lowerName.contains("token") || 
               lowerName.contains("secret") || 
               lowerName.contains("key") && !lowerName.contains("public");
    }

    /**
     * 注册任务完成处理器
     */
    public void registerHandler(String taskType, TaskCompletionHandler handler) {
        handlerRegistry.registerHandler(taskType, handler);
    }

    /**
     * 取消注册任务完成处理器
     */
    public void unregisterHandler(String taskType) {
        handlerRegistry.unregisterHandler(taskType);
    }

    /**
     * 任务完成处理器接口
     */
    public interface TaskCompletionHandler {
        /**
         * 处理任务完成事件
         * @param instance 工作流实例
         * @param task 完成的任务
         */
        void handleTaskCompletion(WorkflowEngine.WorkflowInstance instance, WorkflowEngine.Task task) throws Exception;
    }

    /**
     * 任务完成处理器注册表
     */
    private static class TaskCompletionHandlerRegistry {
        private final java.util.HashMap<String, TaskCompletionHandler> handlers = new java.util.HashMap<>();

        /**
         * 注册处理器
         */
        public void registerHandler(String taskType, TaskCompletionHandler handler) {
            handlers.put(taskType, handler);
        }

        /**
         * 取消注册处理器
         */
        public void unregisterHandler(String taskType) {
            handlers.remove(taskType);
        }

        /**
         * 获取处理器
         */
        public TaskCompletionHandler getHandler(String taskType) {
            return handlers.get(taskType);
        }

        /**
         * 检查是否有注册的处理器
         */
        public boolean hasHandler(String taskType) {
            return handlers.containsKey(taskType);
        }
    }

    /**
     * 日志监听器装饰器
     * 用于为任何监听器添加日志功能
     */
    public static class LoggingDecorator implements WorkflowEventListener {
        private final WorkflowEventListener delegate;
        private final Logger logger = LoggerFactory.getLogger(LoggingDecorator.class);

        public LoggingDecorator(WorkflowEventListener delegate) {
            this.delegate = delegate;
        }

        @Override
        public void onWorkflowEvent(WorkflowEngine.WorkflowEvent event) {
            try {
                logger.debug("开始处理工作流事件: {}", event.getType());
                delegate.onWorkflowEvent(event);
                logger.debug("工作流事件处理完成: {}", event.getType());
            } catch (Exception e) {
                logger.error("处理工作流事件时发生异常: {}", event.getType(), e);
                throw e;
            }
        }

        @Override
        public int getPriority() {
            return delegate.getPriority();
        }
    }
}