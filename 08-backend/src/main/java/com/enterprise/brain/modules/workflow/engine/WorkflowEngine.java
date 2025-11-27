/**
 * 工作流引擎核心类
 * 负责工作流的创建、启动、暂停、恢复和执行管理
 */
package com.enterprise.brain.modules.workflow.engine;

import com.enterprise.brain.modules.workflow.listener.WorkflowEventListener;
import com.enterprise.brain.modules.workflow.util.WorkflowParser;

import java.util.*;

/**
 * 工作流引擎类，提供工作流实例的生命周期管理
 */
public class WorkflowEngine {
    private static final WorkflowEngine INSTANCE = new WorkflowEngine();
    private final Map<String, WorkflowInstance> workflowInstances = new HashMap<>();
    private final List<WorkflowEventListener> eventListeners = new ArrayList<>();
    private final TaskDispatcher taskDispatcher = TaskDispatcher.getInstance();
    private final ConditionEvaluator conditionEvaluator = ConditionEvaluator.getInstance();
    private final WorkflowParser workflowParser = WorkflowParser.getInstance();

    private WorkflowEngine() {
        // 私有构造函数，实现单例模式
    }

    /**
     * 获取工作流引擎实例
     */
    public static WorkflowEngine getInstance() {
        return INSTANCE;
    }

    /**
     * 注册工作流事件监听器
     */
    public void registerListener(WorkflowEventListener listener) {
        if (!eventListeners.contains(listener)) {
            eventListeners.add(listener);
        }
    }

    /**
     * 取消注册工作流事件监听器
     */
    public void unregisterListener(WorkflowEventListener listener) {
        eventListeners.remove(listener);
    }

    /**
     * 创建工作流实例
     */
    public WorkflowInstance createWorkflow(String workflowDefinition, Map<String, Object> variables) {
        WorkflowDefinition definition = workflowParser.parse(workflowDefinition);
        String instanceId = UUID.randomUUID().toString();
        WorkflowInstance instance = new WorkflowInstance(instanceId, definition, variables);
        workflowInstances.put(instanceId, instance);
        
        // 触发创建事件
        fireWorkflowEvent(WorkflowEvent.Type.CREATED, instance);
        return instance;
    }

    /**
     * 启动工作流实例
     */
    public void startWorkflow(String instanceId) {
        WorkflowInstance instance = getWorkflowInstance(instanceId);
        if (instance == null) {
            throw new IllegalArgumentException("工作流实例不存在: " + instanceId);
        }

        instance.setState(WorkflowInstance.State.RUNNING);
        fireWorkflowEvent(WorkflowEvent.Type.STARTED, instance);

        // 执行初始任务
        executeTasks(instance);
    }

    /**
     * 暂停工作流实例
     */
    public void pauseWorkflow(String instanceId) {
        WorkflowInstance instance = getWorkflowInstance(instanceId);
        if (instance == null) {
            throw new IllegalArgumentException("工作流实例不存在: " + instanceId);
        }

        instance.setState(WorkflowInstance.State.PAUSED);
        fireWorkflowEvent(WorkflowEvent.Type.PAUSED, instance);
    }

    /**
     * 恢复工作流实例
     */
    public void resumeWorkflow(String instanceId) {
        WorkflowInstance instance = getWorkflowInstance(instanceId);
        if (instance == null) {
            throw new IllegalArgumentException("工作流实例不存在: " + instanceId);
        }

        instance.setState(WorkflowInstance.State.RUNNING);
        fireWorkflowEvent(WorkflowEvent.Type.RESUMED, instance);
        executeTasks(instance);
    }

    /**
     * 终止工作流实例
     */
    public void terminateWorkflow(String instanceId) {
        WorkflowInstance instance = getWorkflowInstance(instanceId);
        if (instance == null) {
            throw new IllegalArgumentException("工作流实例不存在: " + instanceId);
        }

        instance.setState(WorkflowInstance.State.TERMINATED);
        fireWorkflowEvent(WorkflowEvent.Type.TERMINATED, instance);
    }

    /**
     * 获取工作流实例
     */
    public WorkflowInstance getWorkflowInstance(String instanceId) {
        return workflowInstances.get(instanceId);
    }

    /**
     * 完成任务
     */
    public void completeTask(String instanceId, String taskId, Map<String, Object> outputs) {
        WorkflowInstance instance = getWorkflowInstance(instanceId);
        if (instance == null) {
            throw new IllegalArgumentException("工作流实例不存在: " + instanceId);
        }

        Task task = instance.getTask(taskId);
        if (task == null) {
            throw new IllegalArgumentException("任务不存在: " + taskId);
        }

        // 完成任务
        task.setOutputs(outputs);
        task.setState(Task.State.COMPLETED);
        fireWorkflowEvent(WorkflowEvent.Type.TASK_COMPLETED, instance, task);

        // 更新工作流变量
        instance.getVariables().putAll(outputs);

        // 继续执行下一批任务
        executeTasks(instance);
    }

    /**
     * 执行当前可执行的任务
     */
    private void executeTasks(WorkflowInstance instance) {
        if (instance.getState() != WorkflowInstance.State.RUNNING) {
            return;
        }

        List<Task> executableTasks = findExecutableTasks(instance);
        for (Task task : executableTasks) {
            task.setState(Task.State.RUNNING);
            fireWorkflowEvent(WorkflowEvent.Type.TASK_STARTED, instance, task);
            taskDispatcher.dispatchTask(task, instance.getVariables());
        }

        // 检查工作流是否完成
        if (isWorkflowCompleted(instance)) {
            instance.setState(WorkflowInstance.State.COMPLETED);
            fireWorkflowEvent(WorkflowEvent.Type.COMPLETED, instance);
            workflowInstances.remove(instance.getId());
        }
    }

    /**
     * 查找可执行的任务
     */
    private List<Task> findExecutableTasks(WorkflowInstance instance) {
        List<Task> executableTasks = new ArrayList<>();
        
        for (Task task : instance.getTasks()) {
            if (task.getState() == Task.State.PENDING && 
                areTaskDependenciesMet(instance, task)) {
                executableTasks.add(task);
            }
        }
        
        return executableTasks;
    }

    /**
     * 检查任务依赖是否满足
     */
    private boolean areTaskDependenciesMet(WorkflowInstance instance, Task task) {
        for (String dependencyId : task.getDependencies()) {
            Task dependency = instance.getTask(dependencyId);
            if (dependency == null || dependency.getState() != Task.State.COMPLETED) {
                return false;
            }
        }

        // 评估条件
        if (task.getCondition() != null) {
            return conditionEvaluator.evaluate(task.getCondition(), instance.getVariables());
        }

        return true;
    }

    /**
     * 检查工作流是否完成
     */
    private boolean isWorkflowCompleted(WorkflowInstance instance) {
        for (Task task : instance.getTasks()) {
            if (task.getState() != Task.State.COMPLETED) {
                return false;
            }
        }
        return true;
    }

    /**
     * 触发工作流事件
     */
    private void fireWorkflowEvent(WorkflowEvent.Type eventType, WorkflowInstance instance) {
        WorkflowEvent event = new WorkflowEvent(eventType, instance);
        for (WorkflowEventListener listener : eventListeners) {
            listener.onWorkflowEvent(event);
        }
    }

    /**
     * 触发工作流任务事件
     */
    private void fireWorkflowEvent(WorkflowEvent.Type eventType, WorkflowInstance instance, Task task) {
        WorkflowEvent event = new WorkflowEvent(eventType, instance, task);
        for (WorkflowEventListener listener : eventListeners) {
            listener.onWorkflowEvent(event);
        }
    }

    // 工作流定义类
    public static class WorkflowDefinition {
        private String id;
        private String name;
        private List<TaskDefinition> taskDefinitions = new ArrayList<>();

        // getters and setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public List<TaskDefinition> getTaskDefinitions() { return taskDefinitions; }
        public void setTaskDefinitions(List<TaskDefinition> taskDefinitions) { this.taskDefinitions = taskDefinitions; }
    }

    // 任务定义类
    public static class TaskDefinition {
        private String id;
        private String name;
        private String type;
        private List<String> dependencies = new ArrayList<>();
        private String condition;

        // getters and setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public List<String> getDependencies() { return dependencies; }
        public void setDependencies(List<String> dependencies) { this.dependencies = dependencies; }
        public String getCondition() { return condition; }
        public void setCondition(String condition) { this.condition = condition; }
    }

    // 工作流实例类
    public static class WorkflowInstance {
        private String id;
        private WorkflowDefinition definition;
        private Map<String, Object> variables = new HashMap<>();
        private List<Task> tasks = new ArrayList<>();
        private State state = State.CREATED;

        public enum State {
            CREATED, RUNNING, PAUSED, COMPLETED, TERMINATED
        }

        public WorkflowInstance(String id, WorkflowDefinition definition, Map<String, Object> variables) {
            this.id = id;
            this.definition = definition;
            if (variables != null) {
                this.variables.putAll(variables);
            }

            // 创建任务实例
            for (TaskDefinition taskDef : definition.getTaskDefinitions()) {
                tasks.add(new Task(taskDef));
            }
        }

        // getters and setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public WorkflowDefinition getDefinition() { return definition; }
        public void setDefinition(WorkflowDefinition definition) { this.definition = definition; }
        public Map<String, Object> getVariables() { return variables; }
        public void setVariables(Map<String, Object> variables) { this.variables = variables; }
        public List<Task> getTasks() { return tasks; }
        public void setTasks(List<Task> tasks) { this.tasks = tasks; }
        public State getState() { return state; }
        public void setState(State state) { this.state = state; }

        public Task getTask(String taskId) {
            for (Task task : tasks) {
                if (task.getId().equals(taskId)) {
                    return task;
                }
            }
            return null;
        }
    }

    // 任务类
    public static class Task {
        private String id;
        private String name;
        private String type;
        private List<String> dependencies = new ArrayList<>();
        private String condition;
        private Map<String, Object> inputs = new HashMap<>();
        private Map<String, Object> outputs = new HashMap<>();
        private State state = State.PENDING;

        public enum State {
            PENDING, RUNNING, COMPLETED, FAILED
        }

        public Task(TaskDefinition definition) {
            this.id = definition.getId();
            this.name = definition.getName();
            this.type = definition.getType();
            this.dependencies.addAll(definition.getDependencies());
            this.condition = definition.getCondition();
        }

        // getters and setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public List<String> getDependencies() { return dependencies; }
        public void setDependencies(List<String> dependencies) { this.dependencies = dependencies; }
        public String getCondition() { return condition; }
        public void setCondition(String condition) { this.condition = condition; }
        public Map<String, Object> getInputs() { return inputs; }
        public void setInputs(Map<String, Object> inputs) { this.inputs = inputs; }
        public Map<String, Object> getOutputs() { return outputs; }
        public void setOutputs(Map<String, Object> outputs) { this.outputs = outputs; }
        public State getState() { return state; }
        public void setState(State state) { this.state = state; }
    }

    // 工作流事件类
    public static class WorkflowEvent {
        private Type type;
        private WorkflowInstance workflowInstance;
        private Task task;

        public enum Type {
            CREATED, STARTED, PAUSED, RESUMED, COMPLETED, TERMINATED,
            TASK_STARTED, TASK_COMPLETED, TASK_FAILED
        }

        public WorkflowEvent(Type type, WorkflowInstance workflowInstance) {
            this.type = type;
            this.workflowInstance = workflowInstance;
        }

        public WorkflowEvent(Type type, WorkflowInstance workflowInstance, Task task) {
            this.type = type;
            this.workflowInstance = workflowInstance;
            this.task = task;
        }

        // getters
        public Type getType() { return type; }
        public WorkflowInstance getWorkflowInstance() { return workflowInstance; }
        public Task getTask() { return task; }
    }
}