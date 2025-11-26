package com.enterprise.brain.modules.smarttable.entity;

import javax.persistence.*;
import lombok.Data;
import java.util.Date;

@Entity
@Table(name = "table_calculation")
@Data
public class TableCalculation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long tableId;
    private Long rowId;
    private Long columnId;
    private String formulaExpression;
    private String calculationResult;
    private Boolean isSuccessful = true;
    private String errorMessage;
    private Date calculationTime;
    
    @ManyToOne
    @JoinColumn(name = "tableId", insertable = false, updatable = false)
    private SmartTable smartTable;
    
    @PrePersist
    protected void onCreate() {
        calculationTime = new Date();
    }
}