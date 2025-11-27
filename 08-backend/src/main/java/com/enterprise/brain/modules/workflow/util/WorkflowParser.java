/**
 * 工作流解析器类
 * 负责解析工作流定义文件（JSON/XML）
 */
package com.enterprise.brain.modules.workflow.util;

import com.enterprise.brain.modules.workflow.engine.WorkflowEngine;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * 工作流解析器，支持JSON和XML格式的工作流定义解析
 */
public class WorkflowParser {
    private static final WorkflowParser INSTANCE = new WorkflowParser();
    private static final Logger logger = LoggerFactory.getLogger(WorkflowParser.class);
    
    // JSON解析器
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // XML解析器工厂
    private final DocumentBuilderFactory documentBuilderFactory = DocumentBuilderFactory.newInstance();

    private WorkflowParser() {
        // 配置XML解析器
        documentBuilderFactory.setNamespaceAware(true);
        documentBuilderFactory.setValidating(false);
    }

    /**
     * 获取工作流解析器实例
     */
    public static WorkflowParser getInstance() {
        return INSTANCE;
    }

    /**
     * 解析工作流定义
     * @param definition 工作流定义字符串（JSON或XML格式）
     * @return 解析后的工作流定义对象
     */
    public WorkflowEngine.WorkflowDefinition parse(String definition) {
        if (definition == null || definition.trim().isEmpty()) {
            throw new IllegalArgumentException("工作流定义不能为空");
        }

        String trimmedDefinition = definition.trim();
        
        try {
            // 根据内容判断格式
            if (trimmedDefinition.startsWith("{")) {
                // JSON格式
                return parseJsonDefinition(trimmedDefinition);
            } else if (trimmedDefinition.startsWith("<")) {
                // XML格式
                return parseXmlDefinition(trimmedDefinition);
            } else {
                throw new IllegalArgumentException("不支持的工作流定义格式，仅支持JSON和XML");
            }
        } catch (Exception e) {
            logger.error("解析工作流定义失败", e);
            throw new RuntimeException("工作流定义解析失败: " + e.getMessage(), e);
        }
    }

    /**
     * 解析JSON格式的工作流定义
     */
    private WorkflowEngine.WorkflowDefinition parseJsonDefinition(String json) throws Exception {
        JsonNode rootNode = objectMapper.readTree(json);
        WorkflowEngine.WorkflowDefinition definition = new WorkflowEngine.WorkflowDefinition();
        
        // 解析基本信息
        if (rootNode.has("id")) {
            definition.setId(rootNode.get("id").asText());
        }
        if (rootNode.has("name")) {
            definition.setName(rootNode.get("name").asText());
        }
        
        // 确保有默认ID
        if (definition.getId() == null || definition.getId().isEmpty()) {
            definition.setId("workflow-" + UUID.randomUUID());
        }
        
        // 解析任务定义
        if (rootNode.has("tasks")) {
            JsonNode tasksNode = rootNode.get("tasks");
            List<WorkflowEngine.TaskDefinition> taskDefinitions = new ArrayList<>();
            
            if (tasksNode.isArray()) {
                for (JsonNode taskNode : tasksNode) {
                    WorkflowEngine.TaskDefinition taskDef = parseJsonTaskDefinition(taskNode);
                    taskDefinitions.add(taskDef);
                }
            }
            
            definition.setTaskDefinitions(taskDefinitions);
        }
        
        // 验证工作流定义
        validateWorkflowDefinition(definition);
        
        logger.info("成功解析JSON格式工作流定义: {}", definition.getId());
        return definition;
    }

    /**
     * 解析JSON格式的任务定义
     */
    private WorkflowEngine.TaskDefinition parseJsonTaskDefinition(JsonNode taskNode) {
        WorkflowEngine.TaskDefinition taskDef = new WorkflowEngine.TaskDefinition();
        
        if (taskNode.has("id")) {
            taskDef.setId(taskNode.get("id").asText());
        } else {
            taskDef.setId("task-" + UUID.randomUUID());
        }
        
        if (taskNode.has("name")) {
            taskDef.setName(taskNode.get("name").asText());
        } else {
            taskDef.setName("Task " + taskDef.getId());
        }
        
        if (taskNode.has("type")) {
            taskDef.setType(taskNode.get("type").asText());
        } else {
            taskDef.setType("default");
        }
        
        // 解析依赖
        if (taskNode.has("dependencies")) {
            JsonNode depsNode = taskNode.get("dependencies");
            if (depsNode.isArray()) {
                for (JsonNode depNode : depsNode) {
                    taskDef.getDependencies().add(depNode.asText());
                }
            }
        }
        
        // 解析条件
        if (taskNode.has("condition")) {
            taskDef.setCondition(taskNode.get("condition").asText());
        }
        
        return taskDef;
    }

    /**
     * 解析XML格式的工作流定义
     */
    private WorkflowEngine.WorkflowDefinition parseXmlDefinition(String xml) throws Exception {
        InputStream inputStream = new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));
        DocumentBuilder documentBuilder = documentBuilderFactory.newDocumentBuilder();
        org.w3c.dom.Document document = documentBuilder.parse(inputStream);
        document.getDocumentElement().normalize();
        
        WorkflowEngine.WorkflowDefinition definition = new WorkflowEngine.WorkflowDefinition();
        
        // 解析工作流基本信息
        org.w3c.dom.Element workflowElement = document.getDocumentElement();
        if (workflowElement.hasAttribute("id")) {
            definition.setId(workflowElement.getAttribute("id"));
        } else {
            definition.setId("workflow-" + UUID.randomUUID());
        }
        
        if (workflowElement.hasAttribute("name")) {
            definition.setName(workflowElement.getAttribute("name"));
        }
        
        // 解析任务定义
        List<WorkflowEngine.TaskDefinition> taskDefinitions = new ArrayList<>();
        org.w3c.dom.NodeList taskNodes = document.getElementsByTagName("task");
        
        for (int i = 0; i < taskNodes.getLength(); i++) {
            org.w3c.dom.Node taskNode = taskNodes.item(i);
            if (taskNode.getNodeType() == org.w3c.dom.Node.ELEMENT_NODE) {
                WorkflowEngine.TaskDefinition taskDef = parseXmlTaskDefinition((org.w3c.dom.Element) taskNode);
                taskDefinitions.add(taskDef);
            }
        }
        
        definition.setTaskDefinitions(taskDefinitions);
        
        // 验证工作流定义
        validateWorkflowDefinition(definition);
        
        logger.info("成功解析XML格式工作流定义: {}", definition.getId());
        return definition;
    }

    /**
     * 解析XML格式的任务定义
     */
    private WorkflowEngine.TaskDefinition parseXmlTaskDefinition(org.w3c.dom.Element taskElement) {
        WorkflowEngine.TaskDefinition taskDef = new WorkflowEngine.TaskDefinition();
        
        if (taskElement.hasAttribute("id")) {
            taskDef.setId(taskElement.getAttribute("id"));
        } else {
            taskDef.setId("task-" + UUID.randomUUID());
        }
        
        if (taskElement.hasAttribute("name")) {
            taskDef.setName(taskElement.getAttribute("name"));
        } else {
            taskDef.setName("Task " + taskDef.getId());
        }
        
        if (taskElement.hasAttribute("type")) {
            taskDef.setType(taskElement.getAttribute("type"));
        } else {
            taskDef.setType("default");
        }
        
        // 解析依赖
        if (taskElement.hasAttribute("dependencies")) {
            String dependenciesStr = taskElement.getAttribute("dependencies");
            if (!dependenciesStr.isEmpty()) {
                String[] deps = dependenciesStr.split(",");
                for (String dep : deps) {
                    taskDef.getDependencies().add(dep.trim());
                }
            }
        }
        
        // 解析条件
        if (taskElement.hasAttribute("condition")) {
            taskDef.setCondition(taskElement.getAttribute("condition"));
        }
        
        return taskDef;
    }

    /**
     * 验证工作流定义
     */
    private void validateWorkflowDefinition(WorkflowEngine.WorkflowDefinition definition) {
        if (definition.getId() == null || definition.getId().trim().isEmpty()) {
            throw new IllegalArgumentException("工作流定义必须包含ID");
        }
        
        // 验证任务定义
        Map<String, WorkflowEngine.TaskDefinition> taskMap = new HashMap<>();
        for (WorkflowEngine.TaskDefinition taskDef : definition.getTaskDefinitions()) {
            // 检查任务ID唯一性
            if (taskMap.containsKey(taskDef.getId())) {
                throw new IllegalArgumentException("任务ID重复: " + taskDef.getId());
            }
            taskMap.put(taskDef.getId(), taskDef);
        }
        
        // 验证依赖关系
        for (WorkflowEngine.TaskDefinition taskDef : definition.getTaskDefinitions()) {
            for (String depId : taskDef.getDependencies()) {
                if (!taskMap.containsKey(depId)) {
                    throw new IllegalArgumentException("任务[" + taskDef.getId() + "]依赖的任务不存在: " + depId);
                }
            }
        }
        
        // 检查是否存在循环依赖
        checkCyclicDependencies(taskMap);
    }

    /**
     * 检查循环依赖
     */
    private void checkCyclicDependencies(Map<String, WorkflowEngine.TaskDefinition> taskMap) {
        Set<String> visited = new HashSet<>();
        Set<String> recursionStack = new HashSet<>();
        
        for (String taskId : taskMap.keySet()) {
            if (!visited.contains(taskId)) {
                if (hasCycle(taskId, taskMap, visited, recursionStack)) {
                    throw new IllegalArgumentException("工作流定义中存在循环依赖");
                }
            }
        }
    }

    /**
     * 深度优先搜索检查循环依赖
     */
    private boolean hasCycle(String taskId, Map<String, WorkflowEngine.TaskDefinition> taskMap,
                           Set<String> visited, Set<String> recursionStack) {
        visited.add(taskId);
        recursionStack.add(taskId);
        
        WorkflowEngine.TaskDefinition taskDef = taskMap.get(taskId);
        for (String depId : taskDef.getDependencies()) {
            if (!visited.contains(depId)) {
                if (hasCycle(depId, taskMap, visited, recursionStack)) {
                    return true;
                }
            } else if (recursionStack.contains(depId)) {
                return true;
            }
        }
        
        recursionStack.remove(taskId);
        return false;
    }

    /**
     * 将工作流定义序列化为JSON字符串
     */
    public String serializeToJson(WorkflowEngine.WorkflowDefinition definition) throws Exception {
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(toMap(definition));
    }

    /**
     * 将工作流定义转换为Map对象
     */
    private Map<String, Object> toMap(WorkflowEngine.WorkflowDefinition definition) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", definition.getId());
        map.put("name", definition.getName());
        
        List<Map<String, Object>> tasks = new ArrayList<>();
        for (WorkflowEngine.TaskDefinition taskDef : definition.getTaskDefinitions()) {
            Map<String, Object> taskMap = new HashMap<>();
            taskMap.put("id", taskDef.getId());
            taskMap.put("name", taskDef.getName());
            taskMap.put("type", taskDef.getType());
            taskMap.put("dependencies", taskDef.getDependencies());
            if (taskDef.getCondition() != null) {
                taskMap.put("condition", taskDef.getCondition());
            }
            tasks.add(taskMap);
        }
        map.put("tasks", tasks);
        
        return map;
    }

    /**
     * 验证工作流定义字符串是否有效
     */
    public boolean isValidDefinition(String definition) {
        try {
            parse(definition);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}