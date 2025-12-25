const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const Customer = sequelize.define(
    'Customer',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: '客户ID',
      },
      customerCode: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '客户编号',
      },
      customerName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '客户名称',
      },
      customerType: {
        type: DataTypes.ENUM('regular', 'vip', 'potential', 'dormant'),
        defaultValue: 'regular',
        comment: '客户类型：普通、VIP、潜在、休眠',
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'pending', 'blacklist'),
        defaultValue: 'active',
        comment: '客户状态：活跃、不活跃、待审核、黑名单',
      },

      // 联系信息
      contactPerson: {
        type: DataTypes.STRING(100),
        comment: '联系人',
      },
      contactPhone: {
        type: DataTypes.STRING(50),
        comment: '联系电话',
      },
      contactEmail: {
        type: DataTypes.STRING(100),
        comment: '联系邮箱',
      },
      contactAddress: {
        type: DataTypes.STRING(500),
        comment: '联系地址',
      },

      // 公司信息
      company: {
        type: DataTypes.STRING(200),
        comment: '公司名称',
      },
      companyAddress: {
        type: DataTypes.STRING(500),
        comment: '公司地址',
      },
      industry: {
        type: DataTypes.STRING(100),
        comment: '所属行业',
      },
      region: {
        type: DataTypes.STRING(100),
        comment: '所属区域',
      },
      taxNumber: {
        type: DataTypes.STRING(100),
        comment: '纳税人识别号',
      },

      // 财务信息
      creditLevel: {
        type: DataTypes.ENUM('A', 'B', 'C', 'D'),
        comment: '信用等级',
      },
      creditLimit: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        comment: '信用额度',
      },
      totalAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        comment: '累计交易金额',
      },
      orderCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '订单数量',
      },

      // 销售信息
      salesPerson: {
        type: DataTypes.STRING(100),
        comment: '负责销售',
      },
      source: {
        type: DataTypes.STRING(100),
        comment: '客户来源',
      },
      firstOrderDate: {
        type: DataTypes.DATE,
        comment: '首次下单日期',
      },
      lastOrderDate: {
        type: DataTypes.DATE,
        comment: '最后下单日期',
      },

      // 其他信息
      tags: {
        type: DataTypes.JSON,
        comment: '标签列表',
      },
      remark: {
        type: DataTypes.TEXT,
        comment: '备注',
      },

      // 创建信息
      createdBy: {
        type: DataTypes.STRING(100),
        comment: '创建人',
      },
      updatedBy: {
        type: DataTypes.STRING(100),
        comment: '更新人',
      },
    },
    {
      tableName: 'customers',
      timestamps: true,
      indexes: [
        {
          fields: ['customerCode'],
          unique: true,
        },
        {
          fields: ['customerName'],
        },
        {
          fields: ['customerType'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['region'],
        },
        {
          fields: ['salesPerson'],
        },
      ],
    },
  );

  // 关联关系
  Customer.associate = models => {
    // 客户与订单的关系
    if (models.Order) {
      Customer.hasMany(models.Order, {
        foreignKey: 'customerId',
        as: 'orders',
      });
    }

    // 客户与报价单的关系
    if (models.Quotation) {
      Customer.hasMany(models.Quotation, {
        foreignKey: 'customerId',
        as: 'quotations',
      });
    }

    // 客户与活动日志的关系
    if (models.ActivityLog) {
      Customer.hasMany(models.ActivityLog, {
        foreignKey: 'customerId',
        as: 'activityLogs',
      });
    }
  };

  return Customer;
};
