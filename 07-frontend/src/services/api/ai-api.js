import request from '@/utils/request'

// AI智能服务API
export const aiApi = {
  // AI数据分析
  analysis: {
    // 数据分析
    analyze: (data) => {
      return request.post('/ai/analysis/data', data)
    },
    
    // 趋势预测
    predict: (data) => {
      return request.post('/ai/analysis/predict', data)
    },
    
    // 异常检测
    detectAnomalies: (data) => {
      return request.post('/ai/analysis/anomaly-detection', data)
    },
    
    // 关联分析
    correlation: (data) => {
      return request.post('/ai/analysis/correlation', data)
    },
    
    // 聚类分析
    clustering: (data) => {
      return request.post('/ai/analysis/clustering', data)
    }
  },

  // AI推荐引擎
  recommendation: {
    // 获取个性化推荐
    getPersonalized: (params) => {
      return request.get('/ai/recommendation/personalized', params)
    },
    
    // 获取相似推荐
    getSimilar: (id, type) => {
      return request.get(`/ai/recommendation/similar/${type}/${id}`)
    },
    
    // 获取热门推荐
    getPopular: (params) => {
      return request.get('/ai/recommendation/popular', params)
    },
    
    // 训练推荐模型
    trainModel: (data) => {
      return request.post('/ai/recommendation/train', data)
    },
    
    // 反馈推荐结果
    feedback: (data) => {
      return request.post('/ai/recommendation/feedback', data)
    }
  },

  // AI聊天机器人
  chatbot: {
    // 发送消息
    sendMessage: (data) => {
      return request.post('/ai/chatbot/message', data)
    },
    
    // 获取聊天历史
    getHistory: (params) => {
      return request.get('/ai/chatbot/history', params)
    },
    
    // 清空聊天历史
    clearHistory: () => {
      return request.delete('/ai/chatbot/history')
    },
    
    // 获取快捷回复
    getQuickReplies: (context) => {
      return request.get('/ai/chatbot/quick-replies', { context })
    },
    
    // 评价回复
    rateReply: (data) => {
      return request.post('/ai/chatbot/rate', data)
    }
  },

  // AI图像识别
  imageRecognition: {
    // 图像分类
    classify: (image) => {
      return request.upload('/ai/image/classify', image)
    },
    
    // 物体检测
    detectObjects: (image) => {
      return request.upload('/ai/image/detect-objects', image)
    },
    
    // 人脸识别
    recognizeFace: (image) => {
      return request.upload('/ai/image/recognize-face', image)
    },
    
    // 文字识别(OCR)
    recognizeText: (image) => {
      return request.upload('/ai/image/ocr', image)
    },
    
    // 图像搜索
    searchSimilar: (image) => {
      return request.upload('/ai/image/search', image)
    }
  },

  // AI语音服务
  voiceService: {
    // 语音转文字
    speechToText: (audio) => {
      return request.upload('/ai/voice/stt', audio)
    },
    
    // 文字转语音
    textToSpeech: (data) => {
      return request.post('/ai/voice/tts', data)
    },
    
    // 语音情感分析
    analyzeEmotion: (audio) => {
      return request.upload('/ai/voice/emotion', audio)
    },
    
    // 声纹识别
    recognizeVoice: (audio) => {
      return request.upload('/ai/voice/recognize', audio)
    }
  },

  // AI自然语言处理
  nlp: {
    // 文本分析
    analyzeText: (data) => {
      return request.post('/ai/nlp/analyze', data)
    },
    
    // 情感分析
    sentimentAnalysis: (text) => {
      return request.post('/ai/nlp/sentiment', { text })
    },
    
    // 关键词提取
    extractKeywords: (text) => {
      return request.post('/ai/nlp/keywords', { text })
    },
    
    // 文本摘要
    summarize: (text) => {
      return request.post('/ai/nlp/summarize', { text })
    },
    
    // 语言检测
    detectLanguage: (text) => {
      return request.post('/ai/nlp/detect-language', { text })
    },
    
    // 文本翻译
    translate: (data) => {
      return request.post('/ai/nlp/translate', data)
    }
  },

  // AI模型管理
  model: {
    // 获取模型列表
    getList: (params) => {
      return request.get('/ai/models', params)
    },
    
    // 获取模型详情
    getDetail: (id) => {
      return request.get(`/ai/models/${id}`)
    },
    
    // 上传模型
    upload: (data) => {
      return request.upload('/ai/models/upload', data)
    },
    
    // 训练模型
    train: (data) => {
      return request.post('/ai/models/train', data)
    },
    
    // 部署模型
    deploy: (id, data) => {
      return request.put(`/ai/models/${id}/deploy`, data)
    },
    
    // 删除模型
    delete: (id) => {
      return request.delete(`/ai/models/${id}`)
    },
    
    // 获取训练日志
    getTrainingLogs: (id) => {
      return request.get(`/ai/models/${id}/logs`)
    }
  },

  // AI数据管理
  data: {
    // 获取数据集列表
    getDatasets: (params) => {
      return request.get('/ai/datasets', params)
    },
    
    // 上传数据集
    uploadDataset: (data) => {
      return request.upload('/ai/datasets/upload', data)
    },
    
    // 数据预处理
    preprocess: (data) => {
      return request.post('/ai/datasets/preprocess', data)
    },
    
    // 数据增强
    augment: (data) => {
      return request.post('/ai/datasets/augment', data)
    },
    
    // 数据标注
    annotate: (data) => {
      return request.post('/ai/datasets/annotate', data)
    }
  },

  // AI监控与日志
  monitoring: {
    // 获取API使用统计
    getUsageStats: (params) => {
      return request.get('/ai/monitoring/usage', params)
    },
    
    // 获取模型性能指标
    getModelMetrics: (modelId) => {
      return request.get(`/ai/monitoring/models/${modelId}/metrics`)
    },
    
    // 获取错误日志
    getErrorLogs: (params) => {
      return request.get('/ai/monitoring/errors', params)
    },
    
    // 获取系统健康状态
    getHealthStatus: () => {
      return request.get('/ai/monitoring/health')
    }
  },

  // AI配置管理
  config: {
    // 获取配置
    getConfig: () => {
      return request.get('/ai/config')
    },
    
    // 更新配置
    updateConfig: (data) => {
      return request.put('/ai/config', data)
    },
    
    // 获取API密钥
    getApiKeys: () => {
      return request.get('/ai/config/api-keys')
    },
    
    // 生成API密钥
    generateApiKey: (data) => {
      return request.post('/ai/config/api-keys', data)
    }
  }
}