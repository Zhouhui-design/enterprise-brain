/**
 * 帮助内容管理工具
 * 用于管理和组织系统中的帮助文档、提示和教程
 */

import { eventBus } from '../services/event-bus'

class HelpContent {
  constructor() {
    this.content = new Map()
    this.categories = new Map()
    this.searchIndex = new Map()
    this.viewHistory = []
    this.userPreferences = this.loadUserPreferences()
    
    // 初始化默认帮助内容
    this.initializeDefaultContent()
  }

  /**
   * 初始化默认帮助内容
   */
  initializeDefaultContent() {
    // 快速入门指南
    this.addContent('quick-start', {
      title: '快速入门',
      description: '新用户快速入门指南',
      category: 'getting-started',
      type: 'guide',
      priority: 'high',
      tags: ['新手', '入门', '基础'],
      estimatedReadTime: 5,
      content: {
        sections: [
          {
            title: '欢迎来到系统',
            content: '欢迎使用我们的系统！本指南将帮助您快速了解基本功能。',
            type: 'text'
          },
          {
            title: '注册账号',
            content: '点击右上角的"注册"按钮，填写必要信息即可创建账号。',
            type: 'step',
            steps: [
              '点击注册按钮',
              '填写邮箱和密码',
              '验证邮箱',
              '完善个人资料'
            ]
          },
          {
            title: '基本操作',
            content: '了解系统的基本操作界面。',
            type: 'video',
            videoUrl: '/videos/basic-operations.mp4',
            duration: '3:24'
          },
          {
            title: '常见问题',
            content: '新用户常遇到的问题解答。',
            type: 'faq',
            questions: [
              {
                q: '忘记密码怎么办？',
                a: '点击登录页面的"忘记密码"链接，按照提示重置密码。'
              },
              {
                q: '如何修改个人信息？',
                a: '登录后进入"个人设置"页面，可以修改基本信息。'
              }
            ]
          }
        ]
      },
      relatedContent: ['user-profile-guide', 'security-tips'],
      lastUpdated: new Date().toISOString()
    })

    // 用户配置指南
    this.addContent('user-profile-guide', {
      title: '用户配置指南',
      description: '如何配置和管理个人资料',
      category: 'user-management',
      type: 'guide',
      priority: 'medium',
      tags: ['个人资料', '设置', '配置'],
      estimatedReadTime: 8,
      content: {
        sections: [
          {
            title: '基本信息设置',
            content: '设置您的基本个人信息。',
            type: 'form',
            fields: [
              {
                name: 'username',
                label: '用户名',
                description: '您的唯一标识符，将显示给其他用户',
                rules: ['2-20个字符', '不能包含特殊字符']
              },
              {
                name: 'displayName',
                label: '显示名称',
                description: '在系统中显示的名称',
                rules: ['支持中文', '最多30个字符']
              },
              {
                name: 'email',
                label: '邮箱地址',
                description: '用于接收通知和找回密码',
                rules: ['必须是有效邮箱', '可用于登录']
              },
              {
                name: 'phone',
                label: '手机号码',
                description: '可选，用于双重验证',
                rules: ['必须是有效手机号', '支持国内号码']
              }
            ]
          },
          {
            title: '头像设置',
            content: '上传和设置个人头像。',
            type: 'image',
            instructions: [
              '支持JPG、PNG格式',
              '建议尺寸200x200像素',
              '文件大小不超过2MB',
              '内容应符合社区规范'
            ]
          },
          {
            title: '隐私设置',
            content: '控制您的个人信息可见性。',
            type: 'settings',
            options: [
              {
                name: 'profileVisibility',
                label: '资料可见性',
                options: ['公开', '仅好友', '私密']
              },
              {
                name: 'showEmail',
                label: '显示邮箱',
                type: 'checkbox'
              },
              {
                name: 'showPhone',
                label: '显示手机号',
                type: 'checkbox'
              }
            ]
          }
        ]
      },
      relatedContent: ['privacy-guide', 'security-tips'],
      lastUpdated: new Date().toISOString()
    })

    // 数据操作指南
    this.addContent('data-operations-guide', {
      title: '数据操作指南',
      description: '如何进行数据的增删改查操作',
      category: 'data-management',
      type: 'guide',
      priority: 'high',
      tags: ['数据', 'CRUD', '操作'],
      estimatedReadTime: 10,
      content: {
        sections: [
          {
            title: '数据查询',
            content: '学习如何查询和筛选数据。',
            type: 'search',
            features: [
              '关键词搜索',
              '高级筛选',
              '排序功能',
              '分页浏览'
            ],
            tips: [
              '使用引号进行精确匹配',
              '支持通配符 * 和 ?',
              '可以组合多个条件',
              '保存常用查询条件'
            ]
          },
          {
            title: '数据创建',
            content: '添加新数据的步骤和方法。',
            type: 'creation',
            methods: [
              {
                name: '表单创建',
                description: '通过系统表单添加数据',
                steps: ['选择数据类型', '填写表单', '验证信息', '提交保存']
              },
              {
                name: '批量导入',
                description: '通过文件批量导入数据',
                steps: ['准备数据文件', '选择导入类型', '映射字段', '验证并导入']
              }
            ]
          },
          {
            title: '数据编辑',
            content: '修改已有数据的操作。',
            type: 'editing',
            features: [
              '单个编辑',
              '批量修改',
              '版本历史',
              '编辑权限'
            ]
          },
          {
            title: '数据删除',
            content: '删除数据的注意事项。',
            type: 'deletion',
            warnings: [
              '删除操作不可恢复',
              '检查关联数据',
              '确认删除权限',
              '备份重要数据'
            ]
          }
        ]
      },
      relatedContent: ['data-import-guide', 'data-export-guide'],
      lastUpdated: new Date().toISOString()
    })

    // 报表使用指南
    this.addContent('report-guide', {
      title: '报表使用指南',
      description: '创建和使用各种报表',
      category: 'reporting',
      type: 'guide',
      priority: 'medium',
      tags: ['报表', '统计', '分析'],
      estimatedReadTime: 12,
      content: {
        sections: [
          {
            title: '报表类型',
            content: '了解系统提供的报表类型。',
            type: 'overview',
            types: [
              {
                name: '数据报表',
                description: '基础的数据统计报表',
                features: ['表格展示', '简单计算', '筛选排序']
              },
              {
                name: '图表报表',
                description: '可视化数据分析报表',
                features: ['多种图表', '交互式', '钻取分析']
              },
              {
                name: '交叉报表',
                description: '多维度交叉分析报表',
                features: ['行列交叉', '数据透视', '动态计算']
              }
            ]
          },
          {
            title: '创建报表',
            content: '创建自定义报表的步骤。',
            type: 'tutorial',
            steps: [
              '选择数据源',
              '设计报表结构',
              '配置计算字段',
              '设置筛选条件',
              '选择显示格式',
              '保存和分享'
            ]
          },
          {
            title: '高级功能',
            content: '报表的高级功能介绍。',
            type: 'advanced',
            features: [
              '参数化报表',
              '定时生成',
              '邮件推送',
              'API集成',
              '数据钻取'
            ]
          }
        ]
      },
      relatedContent: ['data-analysis-guide', 'visualization-guide'],
      lastUpdated: new Date().toISOString()
    })

    // 常见问题解答
    this.addContent('faq', {
      title: '常见问题解答',
      description: '用户常见问题的解答',
      category: 'support',
      type: 'faq',
      priority: 'medium',
      tags: ['FAQ', '问题', '解答'],
      estimatedReadTime: 6,
      content: {
        categories: [
          {
            name: '账号相关',
            questions: [
              {
                q: '如何重置密码？',
                a: '在登录页面点击"忘记密码"，输入注册邮箱，按邮件提示操作即可重置密码。',
                related: ['security-tips']
              },
              {
                q: '如何修改注册邮箱？',
                a: '进入"个人设置"-"账号安全"，点击"修改邮箱"，验证身份后即可更改。',
                related: ['user-profile-guide']
              },
              {
                q: '如何注销账号？',
                a: '进入"个人设置"-"账号管理"，点击"注销账号"，按照提示完成注销流程。',
                related: ['privacy-guide']
              }
            ]
          },
          {
            name: '数据操作',
            questions: [
              {
                q: '数据导入失败了怎么办？',
                a: '检查文件格式是否正确，数据是否符合要求，或者尝试分批导入。',
                related: ['data-import-guide']
              },
              {
                q: '如何导出大量数据？',
                a: '使用分页导出功能，或者联系管理员获取数据备份。',
                related: ['data-export-guide']
              },
              {
                q: '数据编辑权限被限制？',
                a: '联系您的管理员申请相应权限，或者确认数据的锁定状态。',
                related: ['permissions-guide']
              }
            ]
          },
          {
            name: '功能使用',
            questions: [
              {
                q: '找不到某个功能？',
                a: '使用搜索功能查找，或者查看功能地图确认功能位置。',
                related: ['feature-map']
              },
              {
                q: '报表生成很慢？',
                a: '尝试简化筛选条件，减少数据量，或者使用预生成报表。',
                related: ['performance-tips']
              }
            ]
          },
          {
            name: '技术问题',
            questions: [
              {
                q: '页面加载失败？',
                a: '检查网络连接，清除浏览器缓存，或者尝试其他浏览器。',
                related: ['troubleshooting']
              },
              {
                q: '数据同步异常？',
                a: '检查网络状态，尝试手动同步，或者联系技术支持。',
                related: ['sync-guide']
              }
            ]
          }
        ]
      },
      relatedContent: ['troubleshooting', 'contact-support'],
      lastUpdated: new Date().toISOString()
    })

    // 错误代码说明
    this.addContent('error-codes', {
      title: '错误代码说明',
      description: '系统中各种错误代码的详细说明',
      category: 'technical',
      type: 'reference',
      priority: 'low',
      tags: ['错误', '代码', '说明'],
      estimatedReadTime: 8,
      content: {
        categories: [
          {
            name: '认证错误 (1xxx)',
            codes: [
              {
                code: '1001',
                message: '用户名或密码错误',
                description: '输入的用户名或密码不正确',
                solution: '检查账号密码，重新输入或使用忘记密码功能'
              },
              {
                code: '1002',
                message: '账号已被锁定',
                description: '因多次错误尝试，账号被临时锁定',
                solution: '等待锁定时间结束，或联系管理员解锁'
              },
              {
                code: '1003',
                message: '账号未激活',
                description: '账号注册后未完成邮箱验证',
                solution: '检查邮箱，点击验证链接激活账号'
              }
            ]
          },
          {
            name: '权限错误 (2xxx)',
            codes: [
              {
                code: '2001',
                message: '权限不足',
                description: '当前操作需要更高权限',
                solution: '联系管理员申请相应权限'
              },
              {
                code: '2002',
                message: '资源访问受限',
                description: '没有访问指定资源的权限',
                solution: '确认权限范围，或联系资源所有者授权'
              }
            ]
          },
          {
            name: '数据错误 (3xxx)',
            codes: [
              {
                code: '3001',
                message: '数据格式错误',
                description: '提交的数据格式不符合要求',
                solution: '检查数据格式，按照规范重新提交'
              },
              {
                code: '3002',
                message: '数据重复',
                description: '提交的数据已存在',
                solution: '检查是否已存在相同数据，或使用更新操作'
              }
            ]
          }
        ]
      },
      relatedContent: ['troubleshooting', 'contact-support'],
      lastUpdated: new Date().toISOString()
    })
  }

  /**
   * 添加帮助内容
   */
  addContent(id, content) {
    this.content.set(id, {
      ...content,
      id,
      createdAt: new Date().toISOString()
    })

    // 更新分类
    if (!this.categories.has(content.category)) {
      this.categories.set(content.category, {
        name: content.category,
        count: 0,
        items: []
      })
    }

    const category = this.categories.get(content.category)
    category.count++
    category.items.push(id)

    // 更新搜索索引
    this.updateSearchIndex(id, content)
  }

  /**
   * 获取帮助内容
   */
  getContent(id) {
    return this.content.get(id)
  }

  /**
   * 按分类获取内容
   */
  getContentByCategory(category) {
    const categoryData = this.categories.get(category)
    if (!categoryData) return []

    return categoryData.items.map(id => this.content.get(id))
  }

  /**
   * 搜索帮助内容
   */
  searchContent(query, options = {}) {
    const {
      categories = [],
      types = [],
      tags = [],
      limit = 20
    } = options

    const results = []
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)

    for (const [id, content] of this.content) {
      let score = 0

      // 检查标题匹配
      const titleMatch = this.calculateMatchScore(content.title, searchTerms)
      if (titleMatch > 0) {
        score += titleMatch * 3
      }

      // 检查描述匹配
      const descriptionMatch = this.calculateMatchScore(content.description, searchTerms)
      if (descriptionMatch > 0) {
        score += descriptionMatch * 2
      }

      // 检查标签匹配
      const tagMatch = this.calculateMatchScore(content.tags?.join(' ') || '', searchTerms)
      if (tagMatch > 0) {
        score += tagMatch * 1.5
      }

      // 检查内容匹配
      const contentMatch = this.searchInContent(content.content, searchTerms)
      if (contentMatch > 0) {
        score += contentMatch
      }

      if (score > 0) {
        // 应用过滤条件
        if (categories.length > 0 && !categories.includes(content.category)) {
          continue
        }
        if (types.length > 0 && !types.includes(content.type)) {
          continue
        }
        if (tags.length > 0 && !tags.some(tag => content.tags?.includes(tag))) {
          continue
        }

        results.push({
          id,
          content,
          score,
          highlights: this.generateHighlights(content, searchTerms)
        })
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  /**
   * 计算匹配分数
   */
  calculateMatchScore(text, searchTerms) {
    if (!text) return 0
    
    const lowerText = text.toLowerCase()
    let score = 0

    searchTerms.forEach(term => {
      const termIndex = lowerText.indexOf(term)
      if (termIndex !== -1) {
        // 完全匹配得分更高
        if (lowerText === term) {
          score += 10
        } else if (lowerText.startsWith(term)) {
          score += 8
        } else if (lowerText.includes(term)) {
          score += 5
        }

        // 多次出现得分更高
        const occurrences = (lowerText.match(new RegExp(term, 'g')) || []).length
        score += Math.min(occurrences, 3)
      }
    })

    return score
  }

  /**
   * 在内容中搜索
   */
  searchInContent(content, searchTerms) {
    if (!content) return 0
    
    let score = 0
    const contentText = JSON.stringify(content).toLowerCase()

    searchTerms.forEach(term => {
      if (contentText.includes(term)) {
        score += 1
      }
    })

    return score
  }

  /**
   * 生成高亮
   */
  generateHighlights(content, searchTerms) {
    const highlights = []

    // 高亮标题
    const titleHighlights = this.highlightTerms(content.title, searchTerms)
    if (titleHighlights.length > 0) {
      highlights.push({
        type: 'title',
        text: titleHighlights
      })
    }

    // 高亮描述
    const descHighlights = this.highlightTerms(content.description, searchTerms)
    if (descHighlights.length > 0) {
      highlights.push({
        type: 'description',
        text: descHighlights
      })
    }

    return highlights
  }

  /**
   * 高亮关键词
   */
  highlightTerms(text, searchTerms) {
    if (!text) return ''

    let highlightedText = text
    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi')
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>')
    })

    return highlightedText
  }

  /**
   * 更新搜索索引
   */
  updateSearchIndex(id, content) {
    const keywords = this.extractKeywords(content)
    keywords.forEach(keyword => {
      if (!this.searchIndex.has(keyword)) {
        this.searchIndex.set(keyword, new Set())
      }
      this.searchIndex.get(keyword).add(id)
    })
  }

  /**
   * 提取关键词
   */
  extractKeywords(content) {
    const keywords = new Set()

    // 从标题提取
    if (content.title) {
      content.title.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) keywords.add(word)
      })
    }

    // 从描述提取
    if (content.description) {
      content.description.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) keywords.add(word)
      })
    }

    // 从标签提取
    if (content.tags) {
      content.tags.forEach(tag => keywords.add(tag.toLowerCase()))
    }

    return Array.from(keywords)
  }

  /**
   * 记录内容查看
   */
  recordContentView(id, userId = 'anonymous') {
    const viewRecord = {
      contentId: id,
      userId,
      timestamp: new Date().toISOString(),
      duration: 0
    }

    this.viewHistory.push(viewRecord)
    eventBus.emit('content-viewed', viewRecord)

    // 更新用户偏好
    this.updateUserPreferences(id, userId)
  }

  /**
   * 更新用户偏好
   */
  updateUserPreferences(contentId, userId) {
    const content = this.getContent(contentId)
    if (!content) return

    const preferences = this.loadUserPreferences(userId)
    
    // 更新分类偏好
    if (!preferences.categories[content.category]) {
      preferences.categories[content.category] = 0
    }
    preferences.categories[content.category]++

    // 更新标签偏好
    if (content.tags) {
      content.tags.forEach(tag => {
        if (!preferences.tags[tag]) {
          preferences.tags[tag] = 0
        }
        preferences.tags[tag]++
      })
    }

    // 保存偏好
    this.saveUserPreferences(userId, preferences)
  }

  /**
   * 加载用户偏好
   */
  loadUserPreferences(userId = 'default') {
    try {
      const key = `help-preferences-${userId}`
      return JSON.parse(localStorage.getItem(key) || '{}')
    } catch {
      return {
        categories: {},
        tags: {},
        lastViewed: []
      }
    }
  }

  /**
   * 保存用户偏好
   */
  saveUserPreferences(userId, preferences) {
    try {
      const key = `help-preferences-${userId}`
      localStorage.setItem(key, JSON.stringify(preferences))
    } catch (error) {
      console.warn('Failed to save user preferences:', error)
    }
  }

  /**
   * 获取推荐内容
   */
  getRecommendedContent(userId = 'default', limit = 5) {
    const preferences = this.loadUserPreferences(userId)
    const recommendations = []

    // 基于分类偏好推荐
    for (const [category, count] of Object.entries(preferences.categories)) {
      const categoryContent = this.getContentByCategory(category)
      categoryContent.forEach(content => {
        if (content.id !== preferences.lastViewed?.[0]) {
          recommendations.push({
            content,
            reason: `基于您对 ${category} 的兴趣`,
            score: count
          })
        }
      })
    }

    // 基于标签偏好推荐
    for (const [tag, count] of Object.entries(preferences.tags)) {
      for (const [id, content] of this.content) {
        if (content.tags?.includes(tag) && id !== preferences.lastViewed?.[0]) {
          const existing = recommendations.find(r => r.content.id === id)
          if (existing) {
            existing.score += count
          } else {
            recommendations.push({
              content,
              reason: `基于您对 ${tag} 的兴趣`,
              score: count
            })
          }
        }
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.content)
  }

  /**
   * 获取热门内容
   */
  getPopularContent(limit = 10) {
    const viewCounts = new Map()

    // 统计查看次数
    this.viewHistory.forEach(view => {
      viewCounts.set(view.contentId, (viewCounts.get(view.contentId) || 0) + 1)
    })

    return Array.from(viewCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([contentId, count]) => ({
        content: this.getContent(contentId),
        viewCount: count
      }))
  }

  /**
   * 获取最近更新的内容
   */
  getRecentlyUpdated(limit = 10) {
    return Array.from(this.content.values())
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
      .slice(0, limit)
  }

  /**
   * 获取分类统计
   */
  getCategoryStats() {
    const stats = {}
    for (const [category, data] of this.categories) {
      stats[category] = {
        name: data.name,
        count: data.count,
        recentUpdates: data.items
          .map(id => this.getContent(id))
          .filter(content => content)
          .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
          .slice(0, 3)
      }
    }
    return stats
  }

  /**
   * 清除缓存和历史
   */
  clearCache() {
    this.viewHistory = []
    this.searchIndex.clear()
    eventBus.emit('help-cache-cleared')
  }
}

// 创建单例实例
export const helpContent = new HelpContent()

// 导出类和实用函数
export {
  HelpContent
}

// 便捷函数
export function searchHelp(query, options = {}) {
  return helpContent.searchContent(query, options)
}

export function getHelpContent(id) {
  return helpContent.getContent(id)
}

export function getRecommendedContent(userId, limit = 5) {
  return helpContent.getRecommendedContent(userId, limit)
}

export function getPopularContent(limit = 10) {
  return helpContent.getPopularContent(limit)
}