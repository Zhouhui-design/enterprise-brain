'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('materials', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      material_code: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: '物料编码'
      },
      bom_number: {
        type: Sequelize.STRING(100),
        comment: 'BOM编号'
      },
      material_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: '物料名称'
      },
      size_spec: {
        type: Sequelize.STRING(100),
        comment: '尺寸规格'
      },
      color: {
        type: Sequelize.STRING(50),
        comment: '颜色'
      },
      material: {
        type: Sequelize.STRING(100),
        comment: '材质'
      },
      major_category: {
        type: Sequelize.STRING(100),
        comment: '大类'
      },
      middle_category: {
        type: Sequelize.STRING(100),
        comment: '中类'
      },
      minor_category: {
        type: Sequelize.STRING(100),
        comment: '小类'
      },
      model: {
        type: Sequelize.STRING(100),
        comment: '型号'
      },
      series: {
        type: Sequelize.STRING(100),
        comment: '系列'
      },
      source: {
        type: Sequelize.STRING(50),
        comment: '来源'
      },
      description: {
        type: Sequelize.TEXT,
        comment: '描述'
      },
      material_image: {
        type: Sequelize.STRING(500),
        comment: '物料图片'
      },
      base_unit: {
        type: Sequelize.STRING(20),
        defaultValue: '个',
        comment: '基本单位'
      },
      sale_unit: {
        type: Sequelize.STRING(20),
        comment: '销售单位'
      },
      sale_conversion_rate: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 1,
        comment: '销售换算率'
      },
      purchase_unit: {
        type: Sequelize.STRING(20),
        comment: '采购单位'
      },
      purchase_conversion_rate: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 1,
        comment: '采购换算率'
      },
      kg_per_pcs: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        comment: '每件公斤数'
      },
      pcs_per_kg: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        comment: '每公斤件数'
      },
      process_name: {
        type: Sequelize.STRING(100),
        comment: '工序名称'
      },
      standard_time: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        comment: '标准工时'
      },
      quota_time: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        comment: '定额工时'
      },
      minimum_packaging_quantity: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 1,
        comment: '最小包装量'
      },
      process_price: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        comment: '加工单价'
      },
      purchase_cycle: {
        type: Sequelize.STRING(50),
        comment: '采购周期'
      },
      purchase_price: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        comment: '采购单价'
      },
      base_price: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        comment: '基础单价'
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'active',
        comment: '状态'
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
        { name: 'idx_material_code', fields: ['material_code'] },
        { name: 'idx_material_name', fields: ['material_name'] },
        { name: 'idx_created_at', fields: ['created_at'] }
      ]
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('materials');
  }
};