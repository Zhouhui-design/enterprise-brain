package com.enterprise.brain.common.async;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/**
 * 事件发布器
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EventPublisher {

    private final ApplicationEventPublisher applicationEventPublisher;

    /**
     * 发布事件
     *
     * @param event 事件对象
     */
    public void publishEvent(Object event) {
        try {
            log.debug("发布事件: {}", event.getClass().getSimpleName());
            applicationEventPublisher.publishEvent(event);
        } catch (Exception e) {
            log.error("发布事件失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 发布业务事件
     *
     * @param eventType 事件类型
     * @param data      事件数据
     */
    public void publishBusinessEvent(String eventType, Object data) {
        BusinessEvent event = new BusinessEvent(this, eventType, data);
        publishEvent(event);
    }

    /**
     * 业务事件类
     */
    public static class BusinessEvent extends org.springframework.context.ApplicationEvent {
        private final String eventType;
        private final Object data;

        public BusinessEvent(Object source, String eventType, Object data) {
            super(source);
            this.eventType = eventType;
            this.data = data;
        }

        public String getEventType() {
            return eventType;
        }

        public Object getData() {
            return data;
        }
    }
}
