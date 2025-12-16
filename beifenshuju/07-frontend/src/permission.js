// 在路由守卫中添加审计页面的权限控制
router.beforeEach(async (to, from, next) => {
  // 假设用户权限存储在store中
  const permissions = store.getters.permissions;
  
  // 审计页面需要"system:audit"权限
  if (to.path.includes('/system/audit') && !permissions.includes('system:audit')) {
    return next({ path: '/403' });
  }
  
  next();
});
