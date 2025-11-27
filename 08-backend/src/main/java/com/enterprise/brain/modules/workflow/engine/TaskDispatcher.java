/**
 * 任务分发器类
 * 负责将工作流任务分发到相应的执行器执行
 */
package com.enterprise.brain.modules.workflow.engine;

import java.util.*;
import java.util.concurrent.*;

/**
 * 任务分发器，管理任务的执行和线程池
 */
public class TaskDispatcher {
    private static final TaskDispatcher INSTANCE = new TaskDispatcher();
    
    // 任务执行器注册表
    private final Map<String, TaskExecutor> taskExecutors = new HashMap<>();
    
    // 线程池用于异步执行任务
    private final ExecutorService executorService;
    
    // 任务执行回调注册表
    private final Map<String, TaskCallback> taskCallbacks = new ConcurrentHashMap<>();

    private TaskDispatcher() {
        // 创建线程池，核心线程数为CPU核心数，最大线程数为核心数的2倍
        int corePoolSize = Runtime.getRuntime().availableProcessors();
        int maxPoolSize = corePoolSize * 2;
        long keepAliveTime = 60L;
        executorService = new ThreadPoolExecutor(
            corePoolSize,
            maxPoolSize,
            keepAliveTime,
            TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(1000),
            new ThreadPoolExecutor.CallerRunsPolicy()
        );
    }

    /**
     * 获取任务分发器实例
     */
    public static TaskDispatcher getInstance() {
        return INSTANCE;
    }

    /**
     * 注册任务执行器
     * @param taskType 任务类型
     * @param executor 任务执行器
     */
    public void registerExecutor(String taskType, TaskExecutor executor) {
        taskExecutors.put(taskType, executor);
    }

    /**
     * 取消注册任务执行器
     * @param taskType 任务类型
     */
    public void unregisterExecutor(String taskType) {
        taskExecutors.remove(taskType);
    }

    /**
     * 分发任务到相应的执行器
     * @param task 待执行的任务
     * @param variables 任务执行所需的变量
     */
    public void dispatchTask(WorkflowEngine.Task task, Map<String, Object> variables) {
        if (task == null || task.getState() != WorkflowEngine.Task.State.RUNNING) {
            throw new IllegalArgumentException("无效的任务状态");
        }

        String taskType = task.getType();
        TaskExecutor executor = taskExecutors.get(taskType);
        
        if (executor == null) {
            // 如果没有找到特定类型的执行器，使用默认执行器
            executor = getDefaultExecutor();
        }

        // 准备任务输入
        Map<String, Object> inputs = prepareTaskInputs(task, variables);
        task.setInputs(inputs);

        // 生成任务执行ID
        String executionId = UUID.randomUUID().toString();
        
        // 异步执行任务
        executorService.submit(() -> {
            try {
                // 执行任务
                Map<String, Object> outputs = executor.execute(task, inputs);
                
                // 更新任务状态和输出
                task.setState(WorkflowEngine.Task.State.COMPLETED);
                task.setOutputs(outputs);
                
                // 触发成功回调
                notifyTaskCompleted(executionId, task, outputs);
            } catch (Exception e) {
                // 任务执行失败
                task.setState(WorkflowEngine.Task.State.FAILED);
                
                // 触发失败回调
                notifyTaskFailed(executionId, task, e);
            }
        });
    }

    /**
     * 提交任务并返回Future对象
     * @param task 待执行的任务
     * @param variables 任务执行所需的变量
     * @return 任务执行的Future对象
     */
    public CompletableFuture<Map<String, Object>> submitTask(WorkflowEngine.Task task, Map<String, Object> variables) {
        CompletableFuture<Map<String, Object>> future = new CompletableFuture<>();
        String executionId = UUID.randomUUID().toString();
        
        // 注册回调
        registerTaskCallback(executionId, new TaskCallback() {
            @Override
            public void onSuccess(WorkflowEngine.Task completedTask, Map<String, Object> outputs) {
                future.complete(outputs);
            }

            @Override
            public void onFailure(WorkflowEngine.Task failedTask, Exception exception) {
                future.completeExceptionally(exception);
            }
        });

        // 分发任务
        dispatchTask(task, variables);
        
        return future;
    }

    /**
     * 注册任务执行回调
     * @param executionId 任务执行ID
     * @param callback 回调接口
     */
    public void registerTaskCallback(String executionId, TaskCallback callback) {
        taskCallbacks.put(executionId, callback);
    }

    /**
     * 取消注册任务执行回调
     * @param executionId 任务执行ID
     */
    public void unregisterTaskCallback(String executionId) {
        taskCallbacks.remove(executionId);
    }

    /**
     * 准备任务输入参数
     */
    private Map<String, Object> prepareTaskInputs(WorkflowEngine.Task task, Map<String, Object> variables) {
        Map<String, Object> inputs = new HashMap<>();
        
        // 添加任务ID和名称
        inputs.put("taskId", task.getId());
        inputs.put("taskName", task.getName());
        
        // 添加任务所需的变量
        if (variables != null) {
            inputs.putAll(variables);
        }
        
        return inputs;
    }

    /**
     * 获取默认任务执行器
     */
    private TaskExecutor getDefaultExecutor() {
        return new DefaultTaskExecutor();
    }

    /**
     * 通知任务完成
     */
    private void notifyTaskCompleted(String executionId, WorkflowEngine.Task task, Map<String, Object> outputs) {
        TaskCallback callback = taskCallbacks.remove(executionId);
        if (callback != null) {
            try {
                callback.onSuccess(task, outputs);
            } catch (Exception e) {
                // 记录回调执行异常
                System.err.println("任务完成回调执行失败: " + e.getMessage());
            }
        }
    }

    /**
     * 通知任务失败
     */
    private void notifyTaskFailed(String executionId, WorkflowEngine.Task task, Exception exception) {
        TaskCallback callback = taskCallbacks.remove(executionId);
        if (callback != null) {
            try {
                callback.onFailure(task, exception);
            } catch (Exception e) {
                // 记录回调执行异常
                System.err.println("任务失败回调执行失败: " + e.getMessage());
            }
        }
    }

    /**
     * 关闭任务分发器，释放资源
     */
    public void shutdown() {
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(60, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    /**
     * 获取活跃任务数量
     */
    public int getActiveTaskCount() {
        if (executorService instanceof ThreadPoolExecutor) {
            return ((ThreadPoolExecutor) executorService).getActiveCount();
        }
        return 0;
    }

    /**
     * 获取线程池状态信息
     */
    public Map<String, Object> getThreadPoolStatus() {
        Map<String, Object> status = new HashMap<>();
        
        if (executorService instanceof ThreadPoolExecutor) {
            ThreadPoolExecutor pool = (ThreadPoolExecutor) executorService;
            status.put("corePoolSize", pool.getCorePoolSize());
            status.put("maximumPoolSize", pool.getMaximumPoolSize());
            status.put("activeCount", pool.getActiveCount());
            status.put("poolSize", pool.getPoolSize());
            status.put("queueSize", pool.getQueue().size());
            status.put("completedTaskCount", pool.getCompletedTaskCount());
            status.put("taskCount", pool.getTaskCount());
        }
        
        return status;
    }

    // 任务执行器接口
    public interface TaskExecutor {
        /**
         * 执行任务
         * @param task 待执行的任务
         * @param inputs 任务输入参数
         * @return 任务执行结果
         */
        Map<String, Object> execute(WorkflowEngine.Task task, Map<String, Object> inputs) throws Exception;
    }

    // 任务回调接口
    public interface TaskCallback {
        /**
         * 任务成功完成时调用
         * @param task 完成的任务
         * @param outputs 任务输出
         */
        void onSuccess(WorkflowEngine.Task task, Map<String, Object> outputs);
        
        /**
         * 任务执行失败时调用
         * @param task 失败的任务
         * @param exception 异常信息
         */
        void onFailure(WorkflowEngine.Task task, Exception exception);
    }

    // 默认任务执行器实现
    private static class DefaultTaskExecutor implements TaskExecutor {
        @Override
        public Map<String, Object> execute(WorkflowEngine.Task task, Map<String, Object> inputs) throws Exception {
            // 默认实现，仅返回输入参数作为输出
            // 实际应用中应该根据任务类型进行相应的处理
            Map<String, Object> outputs = new HashMap<>(inputs);
            outputs.put("executedAt", new Date());
            outputs.put("executionResult", "default_execution_completed");
            
            // 模拟任务执行延迟
            Thread.sleep(100);
            
            return outputs;
        }
    }
}