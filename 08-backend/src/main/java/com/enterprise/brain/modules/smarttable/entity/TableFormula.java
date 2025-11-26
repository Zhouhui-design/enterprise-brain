package com.enterprise.brain.modules.smarttable.entity;

import javax.persistence.*;
import lombok.Data;

@Entity
@Table(name = "table_formula")
@Data
public class TableFormula {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long tableId;
    private String formulaExpression;
    private String formulaName;
    private String formulaDescription;
    private String formulaType;
    
    @ManyToOne
    @JoinColumn(name = "tableId", insertable = false, updatable = false)
    private SmartTable smartTable;
}