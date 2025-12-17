/**
 * 仓库管理页面设置Composable
 * 管理业务变量、流程、编码、表格列配置
 */
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

export interface BusinessVariable {
  name: string
  value: string
  description: string
}

export interface WorkflowConfig {
  buttonName: string
  approvers: string[]
  description: string
}

export interface CodeRule {
  fieldName: string
  prefix: string
  dateFormat: string
  serialLength: number
  example: string
}

export interface ColumnConfig {
  prop: string
  label: string
  width: number
  visible: boolean
  filterable: boolean
  order: number
}

export function usePageSettings(pageName = 'warehouse') {
  const settingsKey = `page_settings_${pageName}`
  
  // ========== 业务变量 ==========
  const businessVariables = ref<BusinessVariable[]>([])
  
  const loadBusinessVariables = () => {
    const saved = localStorage.getItem(`${settingsKey}_business_vars`)
    if (saved) {
      businessVariables.value = JSON.parse(saved)
    }
  }
  
  const saveBusinessVariables = () => {
    localStorage.setItem(
      `${settingsKey}_business_vars`,
      JSON.stringify(businessVariables.value)
    )
    ElMessage.success('业务变量已保存')
  }
  
  const addBusinessVariable = () => {
    businessVariables.value.push({
      name: '',
      value: '',
      description: ''
    })
  }
  
  const removeBusinessVariable = (index: number) => {
    businessVariables.value.splice(index, 1)
  }
  
  // ========== 流程管理 ==========
  const workflowConfigs = ref<WorkflowConfig[]>([])
  
  const loadWorkflowConfigs = () => {
    const saved = localStorage.getItem(`${settingsKey}_workflows`)
    if (saved) {
      workflowConfigs.value = JSON.parse(saved)
    }
  }
  
  const saveWorkflowConfigs = () => {
    localStorage.setItem(
      `${settingsKey}_workflows`,
      JSON.stringify(workflowConfigs.value)
    )
    ElMessage.success('流程配置已保存')
  }
  
  const addWorkflowConfig = () => {
    workflowConfigs.value.push({
      buttonName: '',
      approvers: [],
      description: ''
    })
  }
  
  const removeWorkflowConfig = (index: number) => {
    workflowConfigs.value.splice(index, 1)
  }
  
  // ========== 编码管理 ==========
  const codeRules = ref<CodeRule[]>([])
  
  const loadCodeRules = () => {
    const saved = localStorage.getItem(`${settingsKey}_code_rules`)
    if (saved) {
      codeRules.value = JSON.parse(saved)
    }
  }
  
  const saveCodeRules = () => {
    localStorage.setItem(
      `${settingsKey}_code_rules`,
      JSON.stringify(codeRules.value)
    )
    ElMessage.success('编码规则已保存')
  }
  
  const addCodeRule = () => {
    codeRules.value.push({
      fieldName: '',
      prefix: '',
      dateFormat: 'YYYYMMDD',
      serialLength: 4,
      example: ''
    })
  }
  
  const removeCodeRule = (index: number) => {
    codeRules.value.splice(index, 1)
  }
  
  const updateCodeExample = (rule: CodeRule) => {
    const now = new Date()
    let dateStr = ''
    
    switch (rule.dateFormat) {
      case 'YYYYMMDD':
        dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
        break
      case 'YYYYMM':
        dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
        break
      case 'YYYY':
        dateStr = `${now.getFullYear()}`
        break
    }
    
    const serial = '1'.padStart(rule.serialLength, '0')
    rule.example = `${rule.prefix}${dateStr}${serial}`
  }
  
  // ========== 表格列管理 ==========
  const columnConfigs = ref<ColumnConfig[]>([])
  
  const loadColumnConfigs = (defaultColumns: ColumnConfig[]) => {
    const saved = localStorage.getItem(`${settingsKey}_columns`)
    if (saved) {
      try {
        const savedColumns: ColumnConfig[] = JSON.parse(saved)
        // ✅ 关键修复：合并localStorage和默认配置，优先使用defaultColumns的visible属性
        const columnsMap = new Map<string, ColumnConfig>(savedColumns.map((col) => [col.prop, col]))
        
        columnConfigs.value = defaultColumns.map((defaultCol, index) => {
          const savedCol = columnsMap.get(defaultCol.prop)
          return {
            ...defaultCol,
            // ✅ 使用defaultColumns的visible，而不是localStorage的
            visible: defaultCol.visible !== undefined ? defaultCol.visible : true,
            // 使用localStorage的order（如果存在）
            order: savedCol?.order !== undefined ? savedCol.order : index,
            // 使用localStorage的width（如果存在）
            width: savedCol?.width || defaultCol.width
          }
        })
        
        console.log('✅ 列配置已加载（使用代码定义的visible属性）:', {
          总数: columnConfigs.value.length,
          可见: columnConfigs.value.filter(c => c.visible).length,
          隐藏: columnConfigs.value.filter(c => !c.visible).length
        })
      } catch (error) {
        console.error('❌ 加载localStorage列配置失败，使用默认配置:', error)
        // 加载失败，使用默认配置
        columnConfigs.value = defaultColumns.map((col, index) => ({
          ...col,
          visible: col.visible !== undefined ? col.visible : true,
          order: index
        }))
      }
    } else {
      columnConfigs.value = defaultColumns.map((col, index) => ({
        ...col,
        visible: col.visible !== undefined ? col.visible : true,
        order: index
      }))
      console.log('✅ 使用默认列配置:', columnConfigs.value.length, '个列')
    }
  }
  
  const saveColumnConfigs = () => {
    localStorage.setItem(
      `${settingsKey}_columns`,
      JSON.stringify(columnConfigs.value)
    )
    ElMessage.success('列配置已保存')
  }
  
  const toggleColumnVisible = (prop: string) => {
    const col = columnConfigs.value.find(c => c.prop === prop)
    if (col) {
      col.visible = !col.visible
    }
  }
  
  const reorderColumns = (newOrder: ColumnConfig[]) => {
    columnConfigs.value = newOrder.map((col, index) => ({
      ...col,
      order: index
    }))
  }
  
  // ========== 初始化 ==========
  const initSettings = (defaultColumns?: ColumnConfig[]) => {
    loadBusinessVariables()
    loadWorkflowConfigs()
    loadCodeRules()
    if (defaultColumns) {
      loadColumnConfigs(defaultColumns)
    }
  }
  
  return {
    // 业务变量
    businessVariables,
    addBusinessVariable,
    removeBusinessVariable,
    saveBusinessVariables,
    
    // 流程管理
    workflowConfigs,
    addWorkflowConfig,
    removeWorkflowConfig,
    saveWorkflowConfigs,
    
    // 编码管理
    codeRules,
    addCodeRule,
    removeCodeRule,
    saveCodeRules,
    updateCodeExample,
    
    // 表格列管理
    columnConfigs,
    toggleColumnVisible,
    reorderColumns,
    saveColumnConfigs,
    
    // 初始化
    initSettings
  }
}