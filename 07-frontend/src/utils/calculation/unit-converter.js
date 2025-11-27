/**
 * 单位转换工具
 * 支持长度、重量、体积、面积、温度等常用单位转换
 */
class UnitConverter {
  constructor() {
    // 转换率定义（基于国际标准单位）
    this.conversionRates = {
      // 长度单位（基于米）
      length: {
        m: 1,            // 米
        km: 1000,        // 千米
        cm: 0.01,        // 厘米
        mm: 0.001,       // 毫米
        inch: 0.0254,    // 英寸
        ft: 0.3048,      // 英尺
        yd: 0.9144,      // 码
        mile: 1609.344   // 英里
      },
      
      // 重量单位（基于千克）
      weight: {
        kg: 1,           // 千克
        g: 0.001,        // 克
        mg: 0.000001,    // 毫克
        ton: 1000,       // 吨
        lb: 0.45359237,  // 磅
        oz: 0.028349523  // 盎司
      },
      
      // 体积单位（基于立方米）
      volume: {
        m3: 1,              // 立方米
        cm3: 0.000001,      // 立方厘米
        mm3: 0.000000001,   // 立方毫米
        liter: 0.001,       // 升
        ml: 0.000001,       // 毫升
        gallon: 0.00378541, // 加仑(美)
        quart: 0.000946353  // 夸脱(美)
      },
      
      // 面积单位（基于平方米）
      area: {
        m2: 1,              // 平方米
        km2: 1000000,       // 平方千米
        cm2: 0.0001,        // 平方厘米
        mm2: 0.000001,      // 平方毫米
        inch2: 0.00064516,  // 平方英寸
        ft2: 0.09290304,    // 平方英尺
        yd2: 0.83612736,    // 平方码
        acre: 4046.8564224, // 英亩
        ha: 10000           // 公顷
      },
      
      // 温度单位（特殊处理）
      temperature: {
        celsius: 'celsius',    // 摄氏度
        fahrenheit: 'fahrenheit', // 华氏度
        kelvin: 'kelvin'       // 开尔文
      }
    };
  }

  /**
   * 转换单位
   * @param {number} value - 要转换的值
   * @param {string} fromUnit - 源单位
   * @param {string} toUnit - 目标单位
   * @param {string} unitType - 单位类型 (length, weight, volume, area, temperature)
   * @returns {number} 转换后的值
   */
  convert(value, fromUnit, toUnit, unitType) {
    // 参数验证
    if (typeof value !== 'number') {
      throw new Error('值必须是数字');
    }
    
    if (!unitType || !this.conversionRates[unitType]) {
      throw new Error(`不支持的单位类型: ${unitType}`);
    }
    
    // 温度单位特殊处理
    if (unitType === 'temperature') {
      return this._convertTemperature(value, fromUnit, toUnit);
    }
    
    // 检查单位是否有效
    const rates = this.conversionRates[unitType];
    if (!rates[fromUnit]) {
      throw new Error(`不支持的源单位: ${fromUnit}`);
    }
    if (!rates[toUnit]) {
      throw new Error(`不支持的目标单位: ${toUnit}`);
    }
    
    // 如果是相同单位，直接返回原值
    if (fromUnit === toUnit) {
      return value;
    }
    
    // 转换步骤：1. 转换为标准单位 2. 从标准单位转换为目标单位
    const valueInStandardUnit = value * rates[fromUnit];
    const convertedValue = valueInStandardUnit / rates[toUnit];
    
    return convertedValue;
  }

  /**
   * 温度单位转换（特殊处理）
   * @private
   */
  _convertTemperature(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) {
      return value;
    }
    
    // 先转换为摄氏度作为中间单位
    let celsiusValue;
    switch (fromUnit.toLowerCase()) {
      case 'celsius':
      case 'c':
        celsiusValue = value;
        break;
      case 'fahrenheit':
      case 'f':
        celsiusValue = (value - 32) * 5 / 9;
        break;
      case 'kelvin':
      case 'k':
        celsiusValue = value - 273.15;
        break;
      default:
        throw new Error(`不支持的温度单位: ${fromUnit}`);
    }
    
    // 从摄氏度转换为目标单位
    switch (toUnit.toLowerCase()) {
      case 'celsius':
      case 'c':
        return celsiusValue;
      case 'fahrenheit':
      case 'f':
        return celsiusValue * 9 / 5 + 32;
      case 'kelvin':
      case 'k':
        return celsiusValue + 273.15;
      default:
        throw new Error(`不支持的温度单位: ${toUnit}`);
    }
  }

  /**
   * 格式化转换结果
   * @param {number} value - 转换后的值
   * @param {number} decimals - 小数位数
   * @returns {string} 格式化后的字符串
   */
  formatResult(value, decimals = 2) {
    if (isNaN(value)) {
      return '无效值';
    }
    
    // 处理非常小的数值
    if (Math.abs(value) < 0.000001 && value !== 0) {
      return value.toExponential(decimals);
    }
    
    return value.toFixed(decimals);
  }

  /**
   * 获取指定类型的所有可用单位
   * @param {string} unitType - 单位类型
   * @returns {Array} 单位列表
   */
  getAvailableUnits(unitType) {
    if (!unitType || !this.conversionRates[unitType]) {
      return [];
    }
    
    return Object.keys(this.conversionRates[unitType]);
  }

  /**
   * 获取所有支持的单位类型
   * @returns {Array} 单位类型列表
   */
  getUnitTypes() {
    return Object.keys(this.conversionRates);
  }

  /**
   * 批量转换单位
   * @param {Array} conversions - 转换任务数组 [{value, fromUnit, toUnit, unitType}]
   * @returns {Array} 转换结果数组
   */
  batchConvert(conversions) {
    return conversions.map(item => {
      try {
        const result = this.convert(
          item.value,
          item.fromUnit,
          item.toUnit,
          item.unitType
        );
        return {
          original: item,
          result: result,
          formatted: this.formatResult(result, item.decimals || 2),
          success: true
        };
      } catch (error) {
        return {
          original: item,
          error: error.message,
          success: false
        };
      }
    });
  }

  /**
   * 注册自定义单位
   * @param {string} unitType - 单位类型
   * @param {string} unitName - 单位名称
   * @param {number} conversionRate - 转换率（相对于标准单位）
   */
  registerUnit(unitType, unitName, conversionRate) {
    if (!this.conversionRates[unitType]) {
      this.conversionRates[unitType] = {};
    }
    
    if (unitType === 'temperature') {
      throw new Error('温度单位不支持自定义注册');
    }
    
    this.conversionRates[unitType][unitName] = conversionRate;
  }

  /**
   * 智能检测单位类型（根据单位名称）
   * @param {string} unit - 单位名称
   * @returns {string|null} 单位类型
   */
  detectUnitType(unit) {
    for (const [type, units] of Object.entries(this.conversionRates)) {
      if (type === 'temperature') continue;
      if (units[unit]) {
        return type;
      }
    }
    
    // 温度单位特殊处理
    const tempUnits = ['celsius', 'c', 'fahrenheit', 'f', 'kelvin', 'k'];
    if (tempUnits.includes(unit.toLowerCase())) {
      return 'temperature';
    }
    
    return null;
  }

  /**
   * 尝试自动转换（无需指定单位类型）
   * @param {number} value - 要转换的值
   * @param {string} fromUnit - 源单位
   * @param {string} toUnit - 目标单位
   * @returns {number} 转换后的值
   */
  autoConvert(value, fromUnit, toUnit) {
    const unitType = this.detectUnitType(fromUnit);
    
    if (!unitType) {
      throw new Error(`无法识别单位类型: ${fromUnit}`);
    }
    
    // 确认两个单位属于同一类型
    if (this.detectUnitType(toUnit) !== unitType) {
      throw new Error(`单位类型不匹配: ${fromUnit} 和 ${toUnit}`);
    }
    
    return this.convert(value, fromUnit, toUnit, unitType);
  }
}

// 导出单例实例
const unitConverter = new UnitConverter();
export default unitConverter;
export { UnitConverter };