const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const ProcurementPlan = sequelize.define('ProcurementPlan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    planNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '采购计划编号'
    },
    materialId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '物料ID'
    },
    materialCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '物料编号'
    },
    materialName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '物料名称'
    },
    quantity: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      comment: '采购数量'
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '单位'
    },
    estimatedPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: '预估单价'
    },
    estimatedAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: '预估金额'
    },
    planDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '计划采购日期'
    },
    priority: {
      type: DataTypes.ENUM('high', 'medium', 'low'),
      defaultValue: 'medium',
      comment: '优先级'
    },
    status: {
      type: DataTypes.ENUM('draft', 'approved', 'executing', 'completed', 'cancelled'),
      defaultValue: 'draft',
      comment: '状态'
    },
    remark: {
      type: DataTypes.TEXT,
      comment: '备注'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '创建人ID'
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '更新人ID'
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
    tableName: 'procurement_plans',
    timestamps: true,
    indexes: [
      {
        fields: ['planNumber']
      },
      {
        fields: ['materialId']
      },
      {
        fields: ['materialCode']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdBy']
      },
      {
        fields: ['planDate']
      }
    ]
  })

  // 关联关系
  ProcurementPlan.associate = (models) => {
    ProcurementPlan.belongsTo(models.Material, {
      foreignKey: 'materialId',
      as: 'material'
    })
    ProcurementPlan.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    })
    ProcurementPlan.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater'
    })
  }

  return {
    ProcurementPlan
  }
}