const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// 模拟工序能力负荷表数据 - 使用内存数组，不依赖文件系统
let capacityLoadData = [];

// 模拟初始数据
capacityLoadData = [
  {
    id: 1,
    processName: '切割',
    date: '2025-12-31',
    remainingHours: 8,
    maxCapacity: 16,
    currentLoad: 50,
    status: '正常'
  },
  {
    id: 2,
    processName: '焊接',
    date: '2025-12-30',
    remainingHours: 6,
    maxCapacity: 12,
    currentLoad: 75,
    status: '繁忙'
  },
  {
    id: 3,
    processName: '组装',
    date: '2025-12-29',
    remainingHours: 4,
    maxCapacity: 8,
    currentLoad: 90,
    status: '饱和'
  }
];

// 读取工序能力负荷表数据
const readCapacityLoadData = () => {
  try {
    // 直接返回内存中的数据
    return capacityLoadData;
  } catch (error) {
    console.error('读取工序能力负荷表数据失败:', error);
    return [];
  }
};

// 写入工序能力负荷表数据
const writeCapacityLoadData = (data) => {
  try {
    // 更新内存中的数据
    capacityLoadData = data;
    return true;
  } catch (error) {
    console.error('写入工序能力负荷表数据失败:', error);
    return false;
  }
};

// 接口：查询下一个计划排程日期1
router.post('/query-next-schedule-date', (req, res) => {
  try {
    const { processName, scheduleDate, minRemainingHours } = req.body;
    
    console.log('🔍 查询下一个计划排程日期1:', { processName, scheduleDate, minRemainingHours });
    
    // 验证参数
    if (!processName || !scheduleDate) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：工序名称或计划排程日期'
      });
    }
    
    // 读取工序能力负荷表数据
    const capacityData = readCapacityLoadData();
    
    // 筛选符合条件的数据
    const filteredData = capacityData.filter(item => {
      // 工序名称匹配
      const processMatch = item.processName === processName;
      // 日期 >= 当前计划排程日期
      const dateMatch = new Date(item.date) >= new Date(scheduleDate);
      // 剩余工时 >= minRemainingHours
      const hoursMatch = item.remainingHours >= minRemainingHours;
      
      return processMatch && dateMatch && hoursMatch;
    });
    
    // 按日期升序排序
    filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 取最早的日期
    const nextScheduleDate = filteredData.length > 0 ? filteredData[0].date : null;
    
    console.log(`✅ 查询结果: ${nextScheduleDate}`);
    
    res.json({
      success: true,
      data: {
        nextScheduleDate
      },
      message: nextScheduleDate ? '查询成功' : '未找到符合条件的日期'
    });
  } catch (error) {
    console.error('查询下一个计划排程日期1失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 接口：获取所有工序能力负荷数据
router.get('/', (req, res) => {
  try {
    const data = readCapacityLoadData();
    res.json({
      success: true,
      data,
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取工序能力负荷数据失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 接口：添加工序能力负荷数据
router.post('/', (req, res) => {
  try {
    const newData = req.body;
    const data = readCapacityLoadData();
    data.push(newData);
    
    if (writeCapacityLoadData(data)) {
      res.json({
        success: true,
        data: newData,
        message: '添加成功'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '保存失败'
      });
    }
  } catch (error) {
    console.error('添加工序能力负荷数据失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 接口：更新工序能力负荷数据
router.put('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const updateData = req.body;
    const data = readCapacityLoadData();
    
    const index = data.findIndex(item => item.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '数据不存在'
      });
    }
    
    data[index] = { ...data[index], ...updateData };
    
    if (writeCapacityLoadData(data)) {
      res.json({
        success: true,
        data: data[index],
        message: '更新成功'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '保存失败'
      });
    }
  } catch (error) {
    console.error('更新工序能力负荷数据失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 接口：删除工序能力负荷数据
router.delete('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const data = readCapacityLoadData();
    
    const newData = data.filter(item => item.id !== id);
    
    if (writeCapacityLoadData(newData)) {
      res.json({
        success: true,
        message: '删除成功'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '保存失败'
      });
    }
  } catch (error) {
    console.error('删除工序能力负荷数据失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;