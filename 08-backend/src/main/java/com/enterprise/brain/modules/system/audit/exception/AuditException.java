package com.enterprise.brain.modules.system.audit.exception;

import lombok.Getter;

@Getter
public class AuditException extends RuntimeException {
    private final Integer code;

    public AuditException(String message) {
        super(message);
        this.code = 500;
    }

    public AuditException(Integer code, String message) {
        super(message);
        this.code = code;
    }
}
