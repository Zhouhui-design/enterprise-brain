package com.enterprise.brain.modules.smarttable.entity;

import javax.persistence.*;
import lombok.Data;

@Entity
@Table(name = "table_cell")
@Data
public class TableCell {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long tableId;
    private Long rowId;
    private Long columnId;
    private String cellValue;
    private Boolean isCalculated = false;
    private Long calculationId;
    
    @ManyToOne
    @JoinColumn(name = "tableId", insertable = false, updatable = false)
    private SmartTable smartTable;
    
    @ManyToOne
    @JoinColumn(name = "columnId", insertable = false, updatable = false)
    private TableColumn tableColumn;
}