package com.enterprise.brain.modules.smarttable.entity;

import javax.persistence.*;
import lombok.Data;
import java.util.Date;

@Entity
@Table(name = "smart_table")
@Data
public class SmartTable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String description;
    private Long createUserId;
    
    @Column(updatable = false)
    private Date createTime;
    
    private Date updateTime;
    private Boolean isDeleted = false;
    
    @PrePersist
    protected void onCreate() {
        createTime = new Date();
        updateTime = new Date();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updateTime = new Date();
    }
}