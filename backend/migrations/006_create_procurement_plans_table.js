'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 创建采购计划表
    await queryInterface.createTable('procurement_plans', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      plan_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '采购计划编号',
      },
      material_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: '物料ID',
      },
      material_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '物料编号',
      },
      material_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '物料名称',
      },
      quantity: {
        type: Sequelize.DECIMAL(15, 3),
        allowNull: false,
        comment: '采购数量',
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: '单位',
      },
      estimated_price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: '预估单价',
      },
      estimated_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: '预估金额',
      },
      plan_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: '计划采购日期',
      },
      priority: {
        type: Sequelize.ENUM('high', 'medium', 'low'),
        defaultValue: 'medium',
        comment: '优先级',
      },
      status: {
        type: Sequelize.ENUM('draft', 'approved', 'executing', 'completed', 'cancelled'),
        defaultValue: 'draft',
        comment: '状态',
      },
      remark: {
        type: Sequelize.TEXT,
        comment: '备注',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: '创建人ID',
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: '更新人ID',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // 创建索引
    await queryInterface.addIndex('procurement_plans', ['plan_number']);
    await queryInterface.addIndex('procurement_plans', ['material_id']);
    await queryInterface.addIndex('procurement_plans', ['material_code']);
    await queryInterface.addIndex('procurement_plans', ['status']);
    await queryInterface.addIndex('procurement_plans', ['created_by']);
    await queryInterface.addIndex('procurement_plans', ['plan_date']);
    await queryInterface.addIndex('procurement_plans', ['priority']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('procurement_plans');
  },
};
