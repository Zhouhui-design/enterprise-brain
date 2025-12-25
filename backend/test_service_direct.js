const procurementPlanService = require('./services/procurementPlanService');

(async () => {
  try {
    console.log('Testing service directly...');
    const result = await procurementPlanService.getList({
      page: 1,
      pageSize: 20,
    });
    console.log('Service result:', result);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
