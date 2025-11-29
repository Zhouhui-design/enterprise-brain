'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 创建销售目标表
    await queryInterface.createTable('sales_targets', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '目标名称'
      },
      type: {
        type: Sequelize.ENUM('revenue', 'orders', 'customers', 'profit'),
        allowNull: false,
        comment: '目标类型'
      },
      period: {
        type: Sequelize.ENUM('monthly', 'quarterly', 'yearly'),
        allowNull: false,
        comment: '目标周期'
      },
      target: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: '目标值'
      },
      current: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
        comment: '当前值'
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '年份'
      },
      month: {
        type: Sequelize.INTEGER,
        comment: '月份'
      },
      quarter: {
        type: Sequelize.INTEGER,
        comment: '季度'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: '创建用户ID'
      },
      description: {
        type: Sequelize.TEXT,
        comment: '目标描述'
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'cancelled'),
        defaultValue: 'active',
        comment: '目标状态'
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    })

    // 创建活动日志表
    await queryInterface.createTable('activity_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      type: {
        type: Sequelize.ENUM('order', 'quotation', 'customer', 'payment', 'refund', 'shipment'),
        allowNull: false,
        comment: '活动类型'
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: '活动标题'
      },
      description: {
        type: Sequelize.TEXT,
        comment: '活动描述'
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        comment: '相关金额'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: '操作用户ID'
      },
      customerId: {
        type: Sequelize.UUID,
        comment: '客户ID'
      },
      orderId: {
        type: Sequelize.UUID,
        comment: '订单ID'
      },
      quotationId: {
        type: Sequelize.UUID,
        comment: '报价单ID'
      },
      metadata: {
        type: Sequelize.JSON,
        comment: '额外元数据'
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    })

    // 创建销售指标表
    await queryInterface.createTable('sales_metrics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: '日期'
      },
      period: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
        allowNull: false,
        comment: '统计周期'
      },
      totalRevenue: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
        comment: '总收入'
      },
      totalOrders: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '总订单数'
      },
      totalCustomers: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '总客户数'
      },
      newCustomers: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '新客户数'
      },
      quotationCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '报价单数量'
      },
      convertedOrders: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '转化的订单数'
      },
      averageOrderValue: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
        comment: '平均订单价值'
      },
      conversionRate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
        comment: '转化率'
      },
      regionId: {
        type: Sequelize.UUID,
        comment: '区域ID'
      },
      userId: {
        type: Sequelize.UUID,
        comment: '销售人员ID'
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    })

    // 创建索引
    await queryInterface.addIndex('sales_targets', ['userId', 'period', 'year'])
    await queryInterface.addIndex('sales_targets', ['type'])
    await queryInterface.addIndex('sales_targets', ['status'])
    
    await queryInterface.addIndex('activity_logs', ['userId', 'createdAt'])
    await queryInterface.addIndex('activity_logs', ['customerId'])
    await queryInterface.addIndex('activity_logs', ['orderId'])
    await queryInterface.addIndex('activity_logs', ['quotationId'])
    await queryInterface.addIndex('activity_logs', ['type'])
    await queryInterface.addIndex('activity_logs', ['createdAt'])
    
    await queryInterface.addIndex('sales_metrics', ['date', 'period'])
    await queryInterface.addIndex('sales_metrics', ['userId'])
    await queryInterface.addIndex('sales_metrics', ['regionId'])

    // 添加外键约束
    await queryInterface.addConstraint('sales_targets', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'fk_sales_targets_userId',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    })

    await queryInterface.addConstraint('activity_logs', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'fk_activity_logs_userId',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    })

    await queryInterface.addConstraint('activity_logs', {
      fields: ['customerId'],
      type: 'foreign key',
      name: 'fk_activity_logs_customerId',
      references: {
        table: 'customers',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    })

    await queryInterface.addConstraint('activity_logs', {
      fields: ['orderId'],
      type: 'foreign key',
      name: 'fk_activity_logs_orderId',
      references: {
        table: 'orders',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    })

    await queryInterface.addConstraint('activity_logs', {
      fields: ['quotationId'],
      type: 'foreign key',
      name: 'fk_activity_logs_quotationId',
      references: {
        table: 'quotations',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sales_metrics')
    await queryInterface.dropTable('activity_logs')
    await queryInterface.dropTable('sales_targets')
  }
}