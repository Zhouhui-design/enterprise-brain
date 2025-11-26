package com.enterprise.brain.modules.system.menu.entity;

import lombok.Data;
import javax.persistence.*;
import java.util.Date;
import java.util.List;

@Data
@Entity
@Table(name = "system_dynamic_menu")
public class DynamicMenu {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String menuName;
    private String menuKey;
    private String menuIcon;
    private String menuPath;
    private String componentPath;
    private Integer menuLevel;
    private Integer sortOrder;
    private Boolean isEnabled;
    private Boolean isShow;
    private String permissionCode;
    
    @ManyToOne
    @JoinColumn(name = "parent_id")
    private DynamicMenu parent;
    
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    private List<DynamicMenu> children;
    
    private Long createUserId;
    private Long updateUserId;
    private Date createTime;
    private Date updateTime;
}