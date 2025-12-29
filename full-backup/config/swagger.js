'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

// Swagger配置选项
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Enterprise Brain Backend API',
      version: '1.0.0',
      description: 'Enterprise Brain Backend API Documentation',
      contact: {
        name: 'Enterprise Brain Team',
        email: 'admin@enterprise-brain.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3005',
        description: 'Development Server',
      },
    ],
    components: {
      schemas: {
        Material: {
          type: 'object',
          required: ['materialCode', 'materialName'],
          properties: {
            id: {
              type: 'integer',
              description: '物料ID',
            },
            materialCode: {
              type: 'string',
              description: '物料编码',
            },
            bomNumber: {
              type: 'string',
              description: 'BOM编号',
            },
            materialName: {
              type: 'string',
              description: '物料名称',
            },
            sizeSpec: {
              type: 'string',
              description: '尺寸规格',
            },
            color: {
              type: 'string',
              description: '颜色',
            },
            material: {
              type: 'string',
              description: '材质',
            },
            majorCategory: {
              type: 'string',
              description: '大类',
            },
            middleCategory: {
              type: 'string',
              description: '中类',
            },
            minorCategory: {
              type: 'string',
              description: '小类',
            },
            model: {
              type: 'string',
              description: '型号',
            },
            series: {
              type: 'string',
              description: '系列',
            },
            source: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: '来源',
            },
            description: {
              type: 'string',
              description: '描述',
            },
            materialImage: {
              type: 'string',
              description: '物料图片',
            },
            baseUnit: {
              type: 'string',
              description: '基本单位',
            },
            saleUnit: {
              type: 'string',
              description: '销售单位',
            },
            saleConversionRate: {
              type: 'number',
              description: '销售换算率',
            },
            purchaseUnit: {
              type: 'string',
              description: '采购单位',
            },
            purchaseConversionRate: {
              type: 'number',
              description: '采购换算率',
            },
            kgPerPcs: {
              type: 'number',
              description: '每件公斤数',
            },
            pcsPerKg: {
              type: 'number',
              description: '每公斤件数',
            },
            processName: {
              type: 'string',
              description: '工序名称',
            },
            standardTime: {
              type: 'number',
              description: '标准工时',
            },
            quotaTime: {
              type: 'number',
              description: '定额工时',
            },
            minimumPackagingQuantity: {
              type: 'number',
              description: '最小包装量',
            },
            processPrice: {
              type: 'number',
              description: '加工单价',
            },
            purchaseCycle: {
              type: 'string',
              description: '采购周期',
            },
            purchasePrice: {
              type: 'number',
              description: '采购单价',
            },
            basePrice: {
              type: 'number',
              description: '基础单价',
            },
            status: {
              type: 'string',
              description: '状态',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '创建时间',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新时间',
            },
          },
        },
      },
      responses: {
        200: {
          description: '成功',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: {
                    type: 'integer',
                    description: '状态码',
                  },
                  data: {
                    type: 'object',
                    description: '返回数据',
                  },
                  message: {
                    type: 'string',
                    description: '返回消息',
                  },
                },
              },
            },
          },
        },
        400: {
          description: '请求错误',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: {
                    type: 'integer',
                    description: '状态码',
                  },
                  message: {
                    type: 'string',
                    description: '错误消息',
                  },
                },
              },
            },
          },
        },
        500: {
          description: '服务器内部错误',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: {
                    type: 'integer',
                    description: '状态码',
                  },
                  message: {
                    type: 'string',
                    description: '错误消息',
                  },
                },
              },
            },
          },
        },
      },
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
        },
      },
    },
  },
  apis: ['./routes/*.js'], // 扫描路由文件以生成API文档
};

// 生成Swagger文档
const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
