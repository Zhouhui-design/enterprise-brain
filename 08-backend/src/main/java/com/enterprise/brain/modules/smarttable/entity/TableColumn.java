package com.enterprise.brain.modules.smarttable.entity;

import javax.persistence.*;
import lombok.Data;

@Entity
@Table(name = "table_column")
@Data
public class TableColumn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long tableId;
    private String columnName;
    private String columnType;
    private Integer columnIndex;
    private Boolean isFormulaColumn = false;
    private String formulaExpression;
    private String columnConfig;
    private Boolean isVisible = true;
    
    @ManyToOne
    @JoinColumn(name = "tableId", insertable = false, updatable = false)
    private SmartTable smartTable;
}