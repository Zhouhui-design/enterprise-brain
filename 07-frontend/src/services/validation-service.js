// 表单验证服务
export const validationService = {
  // 必填验证
  required: (value, message = '此字段为必填项') => {
    if (value === null || value === undefined || value === '') {
      return message
    }
    return true
  },

  // 邮箱验证
  email: (value, message = '请输入正确的邮箱格式') => {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!pattern.test(value)) {
      return message
    }
    return true
  },

  // 手机号验证
  phone: (value, message = '请输入正确的手机号') => {
    const pattern = /^1[3-9]\d{9}$/
    if (!pattern.test(value)) {
      return message
    }
    return true
  },

  // 身份证验证
  idCard: (value, message = '请输入正确的身份证号') => {
    const pattern = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
    if (!pattern.test(value)) {
      return message
    }
    return true
  },

  // 密码强度验证
  password: (value, options = {}) => {
    const {
      minLength = 8,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSpecialChars = true,
      message = '密码格式不正确'
    } = options

    if (value.length < minLength) {
      return `密码长度不能少于${minLength}位`
    }

    if (requireUppercase && !/[A-Z]/.test(value)) {
      return '密码必须包含大写字母'
    }

    if (requireLowercase && !/[a-z]/.test(value)) {
      return '密码必须包含小写字母'
    }

    if (requireNumbers && !/\d/.test(value)) {
      return '密码必须包含数字'
    }

    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      return '密码必须包含特殊字符'
    }

    return true
  },

  // URL验证
  url: (value, message = '请输入正确的URL格式') => {
    const pattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
    if (!pattern.test(value)) {
      return message
    }
    return true
  },

  // 数字验证
  number: (value, options = {}) => {
    const {
      min = null,
      max = null,
      integer = false,
      message = '请输入有效的数字'
    } = options

    const num = Number(value)
    if (isNaN(num)) {
      return message
    }

    if (integer && !Number.isInteger(num)) {
      return '请输入整数'
    }

    if (min !== null && num < min) {
      return `数值不能小于${min}`
    }

    if (max !== null && num > max) {
      return `数值不能大于${max}`
    }

    return true
  },

  // 字符串长度验证
  length: (value, options = {}) => {
    const {
      min = null,
      max = null,
      message = '长度不符合要求'
    } = options

    if (typeof value !== 'string') {
      return '请输入字符串'
    }

    if (min !== null && value.length < min) {
      return `长度不能少于${min}个字符`
    }

    if (max !== null && value.length > max) {
      return `长度不能超过${max}个字符`
    }

    return true
  },

  // 日期验证
  date: (value, options = {}) => {
    const {
      format = 'YYYY-MM-DD',
      minDate = null,
      maxDate = null,
      message = '请输入有效的日期'
    } = options

    const date = new Date(value)
    if (isNaN(date.getTime())) {
      return message
    }

    if (minDate && date < new Date(minDate)) {
      return `日期不能早于${minDate}`
    }

    if (maxDate && date > new Date(maxDate)) {
      return `日期不能晚于${maxDate}`
    }

    return true
  },

  // 文件验证
  file: (file, options = {}) => {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedTypes = [],
      message = '文件格式或大小不符合要求'
    } = options

    if (!file) {
      return '请选择文件'
    }

    if (file.size > maxSize) {
      return `文件大小不能超过${Math.round(maxSize / 1024 / 1024)}MB`
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `只支持${allowedTypes.join(', ')}格式的文件`
    }

    return true
  },

  // 自定义验证
  custom: (value, validator, message = '验证失败') => {
    try {
      const result = validator(value)
      if (typeof result === 'boolean') {
        return result ? true : message
      }
      return result
    } catch (error) {
      return message
    }
  }
}

// 表单验证器类
export class FormValidator {
  constructor(rules = {}) {
    this.rules = rules
    this.errors = {}
  }

  // 添加验证规则
  addRule(field, validators) {
    this.rules[field] = validators
    return this
  }

  // 移除验证规则
  removeRule(field) {
    delete this.rules[field]
    return this
  }

  // 验证单个字段
  validateField(field, value) {
    const validators = this.rules[field]
    if (!validators) {
      return true
    }

    if (Array.isArray(validators)) {
      for (const validator of validators) {
        const result = this.executeValidator(validator, value)
        if (result !== true) {
          this.errors[field] = result
          return result
        }
      }
    } else {
      const result = this.executeValidator(validators, value)
      if (result !== true) {
        this.errors[field] = result
        return result
      }
    }

    delete this.errors[field]
    return true
  }

  // 验证整个表单
  validate(data) {
    this.errors = {}
    let isValid = true

    for (const field in this.rules) {
      const result = this.validateField(field, data[field])
      if (result !== true) {
        isValid = false
      }
    }

    return {
      isValid,
      errors: this.errors
    }
  }

  // 执行验证器
  executeValidator(validator, value) {
    if (typeof validator === 'string') {
      // 内置验证器
      const [name, ...args] = validator.split(':')
      const options = args.length > 0 ? JSON.parse(args.join(':')) : {}
      return validationService[name] ? validationService[name](value, options) : true
    } else if (typeof validator === 'function') {
      // 自定义验证函数
      return validator(value)
    } else if (typeof validator === 'object' && validator.validator) {
      // 验证器对象
      return validator.validator(value, validator.options)
    }

    return true
  }

  // 获取字段错误信息
  getFieldError(field) {
    return this.errors[field] || ''
  }

  // 清除字段错误
  clearFieldError(field) {
    delete this.errors[field]
  }

  // 清除所有错误
  clearErrors() {
    this.errors = {}
  }

  // 获取所有错误
  getErrors() {
    return { ...this.errors }
  }

  // 检查是否有错误
  hasErrors() {
    return Object.keys(this.errors).length > 0
  }
}

// 常用验证规则预设
export const validationPresets = {
  // 用户名规则
  username: [
    validationService.required,
    (value) => validationService.length(value, { min: 3, max: 20 }),
    (value) => {
      const pattern = /^[a-zA-Z0-9_]+$/
      return pattern.test(value) ? true : '用户名只能包含字母、数字和下划线'
    }
  ],

  // 密码规则
  password: [
    validationService.required,
    (value) => validationService.password(value, {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true
    })
  ],

  // 邮箱规则
  email: [
    validationService.required,
    validationService.email
  ],

  // 手机号规则
  phone: [
    validationService.required,
    validationService.phone
  ],

  // 真实姓名规则
  realName: [
    validationService.required,
    (value) => validationService.length(value, { min: 2, max: 10 }),
    (value) => {
      const pattern = /^[\u4e00-\u9fa5a-zA-Z\s]+$/
      return pattern.test(value) ? true : '请输入真实的姓名'
    }
  ],

  // 年龄规则
  age: [
    validationService.required,
    (value) => validationService.number(value, {
      min: 0,
      max: 150,
      integer: true
    })
  ]
}

// 异步验证服务
export const asyncValidationService = {
  // 检查用户名是否已存在
  checkUsernameExists: async (username) => {
    try {
      const response = await fetch(`/api/validation/username-exists/${username}`)
      const result = await response.json()
      return result.exists ? '用户名已存在' : true
    } catch (error) {
      return '验证失败，请稍后重试'
    }
  },

  // 检查邮箱是否已存在
  checkEmailExists: async (email) => {
    try {
      const response = await fetch(`/api/validation/email-exists/${email}`)
      const result = await response.json()
      return result.exists ? '邮箱已存在' : true
    } catch (error) {
      return '验证失败，请稍后重试'
    }
  },

  // 验证验证码
  verifyCode: async (code, type = 'email') => {
    try {
      const response = await fetch('/api/validation/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, type })
      })
      const result = await response.json()
      return result.valid ? true : '验证码错误'
    } catch (error) {
      return '验证失败，请稍后重试'
    }
  }
}