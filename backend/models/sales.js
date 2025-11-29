const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = (sequelize) => {
  const SalesTarget = sequelize.define('SalesTarget', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '目标名称'
    },
    type: {
      type: DataTypes.ENUM('revenue', 'orders', 'customers', 'profit'),
      allowNull: false,
      comment: '目标类型：收入、订单、客户、利润'
    },
    period: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'yearly'),
      allowNull: false,
      comment: '目标周期：月度、季度、年度'
    },
    target: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: '目标值'
    },
    current: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      comment: '当前值'
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '年份'
    },
    month: {
      type: DataTypes.INTEGER,
      comment: '月份（月度目标时使用）'
    },
    quarter: {
      type: DataTypes.INTEGER,
      comment: '季度（季度目标时使用）'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '创建用户ID'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '目标描述'
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'cancelled'),
      defaultValue: 'active',
      comment: '目标状态'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'sales_targets',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'period', 'year']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      }
    ]
  })

  const ActivityLog = sequelize.define('ActivityLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM('order', 'quotation', 'customer', 'payment', 'refund', 'shipment'),
      allowNull: false,
      comment: '活动类型'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '活动标题'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '活动描述'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      comment: '相关金额'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '操作用户ID'
    },
    customerId: {
      type: DataTypes.UUID,
      comment: '客户ID'
    },
    orderId: {
      type: DataTypes.UUID,
      comment: '订单ID'
    },
    quotationId: {
      type: DataTypes.UUID,
      comment: '报价单ID'
    },
    metadata: {
      type: DataTypes.JSON,
      comment: '额外元数据'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'activity_logs',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'createdAt']
      },
      {
        fields: ['customerId']
      },
      {
        fields: ['orderId']
      },
      {
        fields: ['quotationId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['createdAt']
      }
    ]
  })

  const SalesMetrics = sequelize.define('SalesMetrics', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '日期'
    },
    period: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
      allowNull: false,
      comment: '统计周期'
    },
    totalRevenue: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      comment: '总收入'
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '总订单数'
    },
    totalCustomers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '总客户数'
    },
    newCustomers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '新客户数'
    },
    quotationCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '报价单数量'
    },
    convertedOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '转化的订单数'
    },
    averageOrderValue: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      comment: '平均订单价值'
    },
    conversionRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      comment: '转化率'
    },
    regionId: {
      type: DataTypes.UUID,
      comment: '区域ID'
    },
    userId: {
      type: DataTypes.UUID,
      comment: '销售人员ID'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'sales_metrics',
    timestamps: true,
    indexes: [
      {
        fields: ['date', 'period']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['regionId']
      }
    ]
  })

  // 关联关系
  SalesTarget.associate = (models) => {
    SalesTarget.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    })
  }

  ActivityLog.associate = (models) => {
    ActivityLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    })
    ActivityLog.belongsTo(models.Customer, {
      foreignKey: 'customerId',
      as: 'customer'
    })
    ActivityLog.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    })
    ActivityLog.belongsTo(models.Quotation, {
      foreignKey: 'quotationId',
      as: 'quotation'
    })
  }

  SalesMetrics.associate = (models) => {
    SalesMetrics.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    })
    SalesMetrics.belongsTo(models.Region, {
      foreignKey: 'regionId',
      as: 'region'
    })
  }

  return {
    SalesTarget,
    ActivityLog,
    SalesMetrics
  }
}