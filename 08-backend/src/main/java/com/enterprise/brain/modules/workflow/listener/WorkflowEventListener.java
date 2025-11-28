/**
 * 工作流事件监听器接口
 * 用于监听和处理工作流相关的事件
 */
package com.enterprise.brain.modules.workflow.listener;

import com.enterprise.brain.modules.workflow.engine.WorkflowEngine;

/**
 * 工作流事件监听器接口
 */
public interface WorkflowEventListener {
    
    /**
     * 处理工作流事件
     * @param event 工作流事件对象
     */
    void onWorkflowEvent(WorkflowEngine.WorkflowEvent event);
    
    /**
     * 获取监听器优先级
     * 优先级高的监听器会先被调用
     * @return 优先级值，默认为0
     */
    default int getPriority() {
        return 0;
    }
}