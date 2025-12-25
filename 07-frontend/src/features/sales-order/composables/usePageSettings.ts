import { ref } from 'vue';

export const usePageSettings = (key: string) => {
  const columnConfigs = ref([]);
  const businessVariables = ref([]);
  const workflowConfigs = ref([]);
  const codeRules = ref([]);

  // 下划线转驼峰函数
  const snakeToCamel = (str) => {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  };

  const initSettings = (defaultColumns) => {
    const savedSettings = localStorage.getItem(`pageSettings_${key}`);
    if (savedSettings) {
      try {
        const loadedColumns = JSON.parse(savedSettings);
        // 确保所有列的prop属性都是驼峰命名
        columnConfigs.value = loadedColumns.map(col => ({
          ...col,
          prop: snakeToCamel(col.prop)
        }));
      } catch (error) {
        console.error('解析页面设置失败:', error);
        columnConfigs.value = defaultColumns.map((col, index) => ({
          ...col,
          visible: true,
          order: index
        }));
      }
    } else {
      columnConfigs.value = defaultColumns.map((col, index) => ({
        ...col,
        visible: true,
        order: index
      }));
    }
  };

  const addBusinessVariable = () => {
    businessVariables.value.push({
      id: Date.now(),
      name: '',
      type: 'string',
      defaultValue: ''
    });
  };

  const removeBusinessVariable = (index) => {
    businessVariables.value.splice(index, 1);
  };

  const saveBusinessVariables = () => {
    localStorage.setItem(`businessVariables_${key}`, JSON.stringify(businessVariables.value));
  };

  const addWorkflowConfig = () => {
    workflowConfigs.value.push({
      id: Date.now(),
      name: '',
      type: '',
      conditions: []
    });
  };

  const removeWorkflowConfig = (index) => {
    workflowConfigs.value.splice(index, 1);
  };

  const saveWorkflowConfigs = () => {
    localStorage.setItem(`workflowConfigs_${key}`, JSON.stringify(workflowConfigs.value));
  };

  const addCodeRule = () => {
    codeRules.value.push({
      id: Date.now(),
      name: '',
      pattern: '',
      description: ''
    });
  };

  const removeCodeRule = (index) => {
    codeRules.value.splice(index, 1);
  };

  const saveCodeRules = () => {
    localStorage.setItem(`codeRules_${key}`, JSON.stringify(codeRules.value));
  };

  const updateCodeExample = () => {
    console.log('更新代码示例');
  };

  const reorderColumns = (columns) => {
    columnConfigs.value = columns;
    saveColumnConfigs();
  };

  const saveColumnConfigs = () => {
    localStorage.setItem(`pageSettings_${key}`, JSON.stringify(columnConfigs.value));
  };

  return {
    businessVariables,
    addBusinessVariable,
    removeBusinessVariable,
    saveBusinessVariables,
    workflowConfigs,
    addWorkflowConfig,
    removeWorkflowConfig,
    saveWorkflowConfigs,
    codeRules,
    addCodeRule,
    removeCodeRule,
    saveCodeRules,
    updateCodeExample,
    columnConfigs,
    reorderColumns,
    saveColumnConfigs,
    initSettings
  };
};
