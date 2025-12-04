/**
 * 资源数据服务 - 统一管理人机料法环模夹数据（连接真实数据库）
 * Resource Data Service for Complete Manufacturing Resources
 * 
 * 功能:
 * - 设备资源管理
 * - 人员资源管理  
 * - 物料资源管理
 * - 模具资源管理
 * - 夹具资源管理
 * - 统一数据接口
 */

import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Resource, 
  WorkerResource, 
  MaterialResource, 
  MoldResource, 
  FixtureResource 
} from '@/utils/schedulingEngine.js'
import { 
  equipmentAPI,
  workerAPI,
  materialAPI,
  moldAPI,
  fixtureAPI,
  toolingAPI
} from '@/api/resourcesAPI.js'
import dataSyncService from './dataSyncService.js'

class ResourceDataService {
  constructor() {
    // 设备资源
    this.equipmentList = ref([])
    // 人员资源  
    this.workerList = ref([])
    // 物料资源
    this.materialList = ref([])
    // 模具资源
    this.moldList = ref([])
    // 夹具资源
    this.fixtureList = ref([])
    // 刀具资源
    this.toolList = ref([])
    
    // 加载标志
    this.loading = ref(false)
    
    // 初始化 - 从数据库加载
    this._initFromDatabase()
  }
  
  // ==================== 数据加载 ====================
  
  /**
   * 从数据库初始化所有资源
   */
  async _initFromDatabase() {
    this.loading.value = true
    try {
      await Promise.all([
        this.loadEquipmentFromDB(),
        this.loadWorkersFromDB(),
        this.loadMaterialsFromDB(),
        this.loadMoldsFromDB(),
        this.loadFixturesFromDB(),
        this.loadToolingFromDB()
      ])
      console.log('资源数据加载完成')
    } catch (error) {
      console.error('加载资源数据失败:', error)
      ElMessage.error('加载资源数据失败')
      // 如果数据库加载失败，使用模拟数据
      this._initMockData()
    } finally {
      this.loading.value = false
    }
  }
  
  /**
   * 从数据库加载设备
   */
  async loadEquipmentFromDB() {
    try {
      const data = await equipmentAPI.getList()
      this.equipmentList.value = (data.list || []).map(item => new Resource({
        id: item.id,
        code: item.code,
        name: item.name,
        type: item.type,
        capacity: item.capacity || 1,
        efficiency: item.efficiency || 1.0,
        status: item.status || 'available',
        currentLoad: item.current_load || 0,
        nextMaintenanceDate: item.next_maintenance_date,
        maintenanceDuration: item.maintenance_duration || 0,
        lastMaintenanceDate: item.last_maintenance_date,
        moldChangeTime: item.mold_change_time || 0,
        currentMold: item.current_mold,
        supportedFixtures: item.supported_fixtures ? JSON.parse(item.supported_fixtures) : [],
        requiredWorkers: item.required_workers || 1
      }))
      return this.equipmentList.value
    } catch (error) {
      console.error('加载设备数据失败:', error)
      throw error
    }
  }
  
  /**
   * 从数据库加载人员
   */
  async loadWorkersFromDB() {
    try {
      const data = await workerAPI.getList()
      this.workerList.value = (data.list || []).map(item => new WorkerResource({
        id: item.id,
        code: item.code,
        name: item.name,
        skills: item.skills ? JSON.parse(item.skills) : [],
        skillLevels: item.skill_levels ? JSON.parse(item.skill_levels) : {},
        efficiency: item.efficiency || 1.0,
        shift: item.shift || 'day',
        status: item.status || 'available',
        maxTasksPerDay: item.max_tasks_per_day || 8
      }))
      return this.workerList.value
    } catch (error) {
      console.error('加载人员数据失败:', error)
      throw error
    }
  }
  
  /**
   * 从数据库加载物料
   */
  async loadMaterialsFromDB() {
    try {
      const data = await materialAPI.getList()
      this.materialList.value = (data.list || []).map(item => new MaterialResource({
        id: item.id,
        code: item.code,
        name: item.name,
        type: item.type,
        currentStock: item.current_stock || 0,
        safetyStock: item.safety_stock || 0,
        incomingStock: item.incoming_stock || 0,
        leadTime: item.lead_time || 0,
        unitCost: item.unit_cost || 0,
        supplier: item.supplier
      }))
      return this.materialList.value
    } catch (error) {
      console.error('加载物料数据失败:', error)
      throw error
    }
  }
  
  /**
   * 从数据库加载模具
   */
  async loadMoldsFromDB() {
    try {
      const data = await moldAPI.getList()
      this.moldList.value = (data.list || []).map(item => new MoldResource({
        id: item.id,
        code: item.code,
        name: item.name,
        type: item.type,
        status: item.status || 'available',
        currentMachine: item.current_machine,
        lifecycle: item.lifecycle || 0,
        maxLifecycle: item.max_lifecycle || 10000,
        maintenanceCycle: item.maintenance_cycle || 1000,
        lastMaintenanceCount: item.last_maintenance_count || 0,
        cavities: item.cavities || 1,
        cycleTime: item.cycle_time || 30
      }))
      return this.moldList.value
    } catch (error) {
      console.error('加载模具数据失败:', error)
      throw error
    }
  }
  
  /**
   * 从数据库加载夹具
   */
  async loadFixturesFromDB() {
    try {
      const data = await fixtureAPI.getList()
      this.fixtureList.value = (data.list || []).map(item => new FixtureResource({
        id: item.id,
        code: item.code,
        name: item.name,
        type: item.type,
        quantity: item.quantity || 1,
        available: item.available || 1,
        inUse: item.in_use || 0,
        status: item.status || 'available',
        suitableProducts: item.suitable_products ? JSON.parse(item.suitable_products) : [],
        suitableMachines: item.suitable_machines ? JSON.parse(item.suitable_machines) : []
      }))
      return this.fixtureList.value
    } catch (error) {
      console.error('加载夹具数据失败:', error)
      throw error
    }
  }
  
  /**
   * 从数据库加载刀具
   */
  async loadToolingFromDB() {
    try {
      const data = await toolingAPI.getList()
      this.toolList.value = data.list || []
      return this.toolList.value
    } catch (error) {
      console.error('加载刀具数据失败:', error)
      throw error
    }
  }
  
  /**
   * 获取所有设备
   */
  getAllEquipment() {
    return this.equipmentList.value
  }
  
  /**
   * 获取可用设备
   */
  getAvailableEquipment() {
    return this.equipmentList.value.filter(eq => eq.status === 'available')
  }
  
  /**
   * 根据类型获取设备
   */
  getEquipmentByType(type) {
    return this.equipmentList.value.filter(eq => eq.type === type)
  }
  
  /**
   * 根据ID获取设备
   */
  getEquipmentById(id) {
    return this.equipmentList.value.find(eq => eq.id === id)
  }
  
  /**
   * 添加设备
   */
  async addEquipment(equipmentData) {
    try {
      const result = await equipmentAPI.create(equipmentData)
      const equipment = new Resource(result)
      this.equipmentList.value.push(equipment)
      
      // 添加到同步队列
      dataSyncService.addToPendingQueue({
        module: 'equipment',
        action: 'create',
        id: result.id
      })
      
      return equipment
    } catch (error) {
      console.error('添加设备失败:', error)
      throw error
    }
  }
  
  /**
   * 更新设备状态
   */
  async updateEquipmentStatus(id, status) {
    try {
      await equipmentAPI.updateStatus(id, status)
      const equipment = this.getEquipmentById(id)
      if (equipment) {
        equipment.status = status
        
        // 添加到同步队列
        dataSyncService.addToPendingQueue({
          module: 'equipment',
          action: 'update',
          id: id
        })
        
        return true
      }
      return false
    } catch (error) {
      console.error('更新设备状态失败:', error)
      throw error
    }
  }
  
  // ==================== 人员资源管理 ====================
  
  /**
   * 获取所有人员
   */
  getAllWorkers() {
    return this.workerList.value
  }
  
  /**
   * 获取可用人员
   */
  getAvailableWorkers() {
    return this.workerList.value.filter(w => w.status === 'available')
  }
  
  /**
   * 根据技能获取人员
   */
  getWorkersBySkill(skill) {
    return this.workerList.value.filter(w => w.skills.includes(skill))
  }
  
  /**
   * 根据班次获取人员
   */
  getWorkersByShift(shift) {
    return this.workerList.value.filter(w => w.shift === shift)
  }
  
  /**
   * 添加人员
   */
  addWorker(workerData) {
    const worker = new WorkerResource(workerData)
    this.workerList.value.push(worker)
    return worker
  }
  
  // ==================== 物料资源管理 ====================
  
  /**
   * 获取所有物料
   */
  getAllMaterials() {
    return this.materialList.value
  }
  
  /**
   * 根据ID获取物料
   */
  getMaterialById(id) {
    return this.materialList.value.find(m => m.id === id)
  }
  
  /**
   * 检查物料库存
   */
  checkMaterialStock(materialId, requiredQuantity) {
    const material = this.getMaterialById(materialId)
    if (!material) return false
    return material.checkAvailability(requiredQuantity)
  }
  
  /**
   * 获取库存不足的物料
   */
  getLowStockMaterials() {
    return this.materialList.value.filter(m => m.needsProcurement())
  }
  
  /**
   * 添加物料
   */
  addMaterial(materialData) {
    const material = new MaterialResource(materialData)
    this.materialList.value.push(material)
    return material
  }
  
  /**
   * 消耗物料
   */
  consumeMaterial(materialId, quantity) {
    const material = this.getMaterialById(materialId)
    if (!material) {
      ElMessage.error('物料不存在')
      return false
    }
    const success = material.consume(quantity)
    if (!success) {
      ElMessage.warning(`物料${material.name}库存不足`)
    }
    return success
  }
  
  // ==================== 模具资源管理 ====================
  
  /**
   * 获取所有模具
   */
  getAllMolds() {
    return this.moldList.value
  }
  
  /**
   * 获取可用模具
   */
  getAvailableMolds() {
    return this.moldList.value.filter(m => m.isAvailable())
  }
  
  /**
   * 根据类型获取模具
   */
  getMoldsByType(type) {
    return this.moldList.value.filter(m => m.type === type)
  }
  
  /**
   * 根据ID获取模具
   */
  getMoldById(id) {
    return this.moldList.value.find(m => m.id === id)
  }
  
  /**
   * 检查模具是否需要维护
   */
  checkMoldMaintenance(moldId) {
    const mold = this.getMoldById(moldId)
    return mold ? mold.needsMaintenance() : false
  }
  
  /**
   * 添加模具
   */
  addMold(moldData) {
    const mold = new MoldResource(moldData)
    this.moldList.value.push(mold)
    return mold
  }
  
  // ==================== 夹具资源管理 ====================
  
  /**
   * 获取所有夹具
   */
  getAllFixtures() {
    return this.fixtureList.value
  }
  
  /**
   * 获取可用夹具
   */
  getAvailableFixtures() {
    return this.fixtureList.value.filter(f => f.status === 'available' && f.available > 0)
  }
  
  /**
   * 根据类型获取夹具
   */
  getFixturesByType(type) {
    return this.fixtureList.value.filter(f => f.type === type)
  }
  
  /**
   * 检查夹具可用性
   */
  checkFixtureAvailability(fixtureId, requiredQuantity) {
    const fixture = this.fixtureList.value.find(f => f.id === fixtureId)
    if (!fixture) return false
    return fixture.checkAvailability(requiredQuantity)
  }
  
  /**
   * 占用夹具
   */
  occupyFixture(fixtureId, quantity) {
    const fixture = this.fixtureList.value.find(f => f.id === fixtureId)
    if (!fixture) {
      ElMessage.error('夹具不存在')
      return false
    }
    const success = fixture.occupy(quantity)
    if (!success) {
      ElMessage.warning(`夹具${fixture.name}数量不足`)
    }
    return success
  }
  
  /**
   * 释放夹具
   */
  releaseFixture(fixtureId, quantity) {
    const fixture = this.fixtureList.value.find(f => f.id === fixtureId)
    if (fixture) {
      fixture.release(quantity)
      return true
    }
    return false
  }
  
  /**
   * 添加夹具
   */
  addFixture(fixtureData) {
    const fixture = new FixtureResource(fixtureData)
    this.fixtureList.value.push(fixture)
    return fixture
  }
  
  // ==================== 综合查询 ====================
  
  /**
   * 获取所有资源概览
   */
  getResourceSummary() {
    return {
      equipment: {
        total: this.equipmentList.value.length,
        available: this.getAvailableEquipment().length,
        busy: this.equipmentList.value.filter(e => e.status === 'busy').length,
        maintenance: this.equipmentList.value.filter(e => e.status === 'maintenance').length
      },
      workers: {
        total: this.workerList.value.length,
        available: this.getAvailableWorkers().length,
        busy: this.workerList.value.filter(w => w.status === 'busy').length
      },
      materials: {
        total: this.materialList.value.length,
        lowStock: this.getLowStockMaterials().length
      },
      molds: {
        total: this.moldList.value.length,
        available: this.getAvailableMolds().length,
        needMaintenance: this.moldList.value.filter(m => m.needsMaintenance()).length
      },
      fixtures: {
        total: this.fixtureList.value.length,
        available: this.getAvailableFixtures().length,
        totalQuantity: this.fixtureList.value.reduce((sum, f) => sum + f.quantity, 0),
        availableQuantity: this.fixtureList.value.reduce((sum, f) => sum + f.available, 0)
      }
    }
  }
  
  /**
   * 检查排程所需资源是否充足
   */
  checkSchedulingResources(requirements) {
    const issues = []
    
    // 检查设备
    if (requirements.equipment) {
      requirements.equipment.forEach(req => {
        const equipment = this.getEquipmentById(req.id)
        if (!equipment) {
          issues.push(`设备${req.id}不存在`)
        } else if (equipment.status !== 'available') {
          issues.push(`设备${equipment.name}当前不可用`)
        }
      })
    }
    
    // 检查人员
    if (requirements.workers) {
      requirements.workers.forEach(req => {
        const workers = this.getWorkersBySkill(req.skill)
        const availableWorkers = workers.filter(w => w.status === 'available')
        if (availableWorkers.length < req.count) {
          issues.push(`技能${req.skill}的可用人员不足，需要${req.count}人，实际${availableWorkers.length}人`)
        }
      })
    }
    
    // 检查物料
    if (requirements.materials) {
      requirements.materials.forEach(req => {
        const material = this.getMaterialById(req.id)
        if (!material) {
          issues.push(`物料${req.id}不存在`)
        } else if (!material.checkAvailability(req.quantity)) {
          issues.push(`物料${material.name}库存不足，需要${req.quantity}，可用${material.currentStock + material.incomingStock}`)
        }
      })
    }
    
    // 检查模具
    if (requirements.molds) {
      requirements.molds.forEach(req => {
        const mold = this.getMoldById(req.id)
        if (!mold) {
          issues.push(`模具${req.id}不存在`)
        } else if (!mold.isAvailable()) {
          issues.push(`模具${mold.name}当前不可用或需要维护`)
        }
      })
    }
    
    // 检查夹具
    if (requirements.fixtures) {
      requirements.fixtures.forEach(req => {
        const available = this.checkFixtureAvailability(req.id, req.quantity)
        if (!available) {
          const fixture = this.fixtureList.value.find(f => f.id === req.id)
          if (!fixture) {
            issues.push(`夹具${req.id}不存在`)
          } else {
            issues.push(`夹具${fixture.name}数量不足，需要${req.quantity}，可用${fixture.available}`)
          }
        }
      })
    }
    
    return {
      success: issues.length === 0,
      issues
    }
  }
  
  // ==================== 私有方法 - 初始化模拟数据 ====================
  
  _initMockData() {
    // 初始化设备数据
    this.equipmentList.value = [
      new Resource({
        id: 'EQ001',
        code: 'EQ001',
        name: '注塑机-1号',
        type: '注塑机',
        capacity: 2000,
        efficiency: 0.95,
        status: 'available',
        nextMaintenanceDate: '2024-02-01',
        maintenanceDuration: 4,
        moldChangeTime: 30,
        supportedFixtures: ['F001', 'F002'],
        requiredWorkers: 1
      }),
      new Resource({
        id: 'EQ002',
        code: 'EQ002',
        name: 'CNC机床-1号',
        type: 'CNC机床',
        capacity: 1,
        efficiency: 0.92,
        status: 'available',
        nextMaintenanceDate: '2024-01-25',
        maintenanceDuration: 6,
        supportedFixtures: ['F003', 'F004'],
        requiredWorkers: 1
      }),
      new Resource({
        id: 'EQ003',
        code: 'EQ003',
        name: '装配机器人-1号',
        type: '机器人',
        capacity: 1,
        efficiency: 0.98,
        status: 'available',
        requiredWorkers: 0
      }),
      new Resource({
        id: 'EQ004',
        code: 'EQ004',
        name: '激光切割机',
        type: '切割设备',
        capacity: 1,
        efficiency: 0.90,
        status: 'available',
        requiredWorkers: 1
      }),
      new Resource({
        id: 'EQ005',
        code: 'EQ005',
        name: '三坐标测量机',
        type: '测量设备',
        capacity: 1,
        efficiency: 1.0,
        status: 'available',
        requiredWorkers: 1
      })
    ]
    
    // 初始化人员数据
    this.workerList.value = [
      new WorkerResource({
        id: 'W001',
        code: 'W001',
        name: '张三',
        skills: ['注塑', '设备维护'],
        skillLevels: { '注塑': 5, '设备维护': 4 },
        efficiency: 1.2,
        shift: 'day',
        status: 'available'
      }),
      new WorkerResource({
        id: 'W002',
        code: 'W002',
        name: '李四',
        skills: ['CNC加工', '编程'],
        skillLevels: { 'CNC加工': 5, '编程': 5 },
        efficiency: 1.15,
        shift: 'day',
        status: 'available'
      }),
      new WorkerResource({
        id: 'W003',
        code: 'W003',
        name: '王五',
        skills: ['装配', '质检'],
        skillLevels: { '装配': 4, '质检': 5 },
        efficiency: 1.0,
        shift: 'day',
        status: 'available'
      }),
      new WorkerResource({
        id: 'W004',
        code: 'W004',
        name: '赵六',
        skills: ['切割', '焊接'],
        skillLevels: { '切割': 5, '焊接': 4 },
        efficiency: 1.1,
        shift: 'night',
        status: 'available'
      }),
      new WorkerResource({
        id: 'W005',
        code: 'W005',
        name: '钱七',
        skills: ['质检', '测量'],
        skillLevels: { '质检': 5, '测量': 5 },
        efficiency: 1.0,
        shift: 'day',
        status: 'available'
      })
    ]
    
    // 初始化物料数据
    this.materialList.value = [
      new MaterialResource({
        id: 'M001',
        code: 'M001',
        name: 'ABS塑料粒子',
        type: '原材料',
        currentStock: 5000,
        safetyStock: 500,
        incomingStock: 1000,
        leadTime: 3,
        unitCost: 15.5,
        supplier: '供应商A'
      }),
      new MaterialResource({
        id: 'M002',
        code: 'M002',
        name: '铝合金板材',
        type: '原材料',
        currentStock: 200,
        safetyStock: 50,
        incomingStock: 0,
        leadTime: 7,
        unitCost: 125.0,
        supplier: '供应商B'
      }),
      new MaterialResource({
        id: 'M003',
        code: 'M003',
        name: '不锈钢螺丝M4',
        type: '辅料',
        currentStock: 10000,
        safetyStock: 2000,
        incomingStock: 5000,
        leadTime: 2,
        unitCost: 0.5,
        supplier: '供应商C'
      }),
      new MaterialResource({
        id: 'M004',
        code: 'M004',
        name: '包装盒',
        type: '辅料',
        currentStock: 3000,
        safetyStock: 500,
        incomingStock: 0,
        leadTime: 5,
        unitCost: 2.5,
        supplier: '供应商D'
      })
    ]
    
    // 初始化模具数据
    this.moldList.value = [
      new MoldResource({
        id: 'MD001',
        code: 'MD001',
        name: '注塑模具A',
        type: '注塑模',
        status: 'available',
        lifecycle: 1500,
        maxLifecycle: 10000,
        maintenanceCycle: 1000,
        lastMaintenanceCount: 500,
        cavities: 4,
        cycleTime: 45
      }),
      new MoldResource({
        id: 'MD002',
        code: 'MD002',
        name: '注塑模具B',
        type: '注塑模',
        status: 'available',
        lifecycle: 3200,
        maxLifecycle: 10000,
        maintenanceCycle: 1000,
        lastMaintenanceCount: 3000,
        cavities: 2,
        cycleTime: 60
      }),
      new MoldResource({
        id: 'MD003',
        code: 'MD003',
        name: '冲压模具C',
        type: '冲压模',
        status: 'available',
        lifecycle: 5000,
        maxLifecycle: 15000,
        maintenanceCycle: 2000,
        lastMaintenanceCount: 4000,
        cavities: 1,
        cycleTime: 3
      })
    ]
    
    // 初始化夹具数据
    this.fixtureList.value = [
      new FixtureResource({
        id: 'F001',
        code: 'F001',
        name: '注塑夹具A',
        type: '注塑夹具',
        quantity: 10,
        available: 8,
        inUse: 2,
        status: 'available',
        suitableProducts: ['PROD-A', 'PROD-B'],
        suitableMachines: ['EQ001']
      }),
      new FixtureResource({
        id: 'F002',
        code: 'F002',
        name: '注塑夹具B',
        type: '注塑夹具',
        quantity: 8,
        available: 8,
        inUse: 0,
        status: 'available',
        suitableProducts: ['PROD-C'],
        suitableMachines: ['EQ001']
      }),
      new FixtureResource({
        id: 'F003',
        code: 'F003',
        name: 'CNC夹具A',
        type: 'CNC夹具',
        quantity: 15,
        available: 12,
        inUse: 3,
        status: 'available',
        suitableProducts: [],
        suitableMachines: ['EQ002']
      }),
      new FixtureResource({
        id: 'F004',
        code: 'F004',
        name: '通用夹具',
        type: '通用夹具',
        quantity: 20,
        available: 18,
        inUse: 2,
        status: 'available',
        suitableProducts: [],
        suitableMachines: []
      })
    ]
  }
}

// 创建单例
const resourceDataService = new ResourceDataService()

export default resourceDataService
