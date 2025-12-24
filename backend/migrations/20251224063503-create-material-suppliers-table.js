'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('material_suppliers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      material_code: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '物料编码',
        references: {
          model: 'materials',
          key: 'material_code'
        },
        onDelete: 'CASCADE'
      },
      supplier_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: '供应商名称'
      },
      minimum_order_quantity: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        comment: '最小起订量'
      },
      tier_range: {
        type: Sequelize.STRING(50),
        comment: '阶梯范围'
      },
      tier_unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        comment: '阶梯单价'
      },
      tax_rate: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 13,
        comment: '税率'
      },
      standard_packaging_quantity: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        comment: '标准包装数量'
      },
      ordering_rule: {
        type: Sequelize.STRING(20),
        defaultValue: '默认',
        comment: '下单规则'
      },
      sequence: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '排序'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
        comment: '创建时间'
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
        onUpdate: Sequelize.fn('now'),
        comment: '更新时间'
      }
    }, {
      indexes: [
        { name: 'idx_material_code', fields: ['material_code'] }
      ]
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('material_suppliers');
  }
};