import request from '@/utils/request'; // 假设已有基础请求工具

// 审计日志相关接口
export const auditService = {
  // 获取审计日志列表
  getAuditLogList: (params: any) => {
    return request({
      url: '/api/system/audit/logs',
      method: 'get',
      params
    });
  },

  // 获取审计日志详情
  getAuditLogDetail: (id: string) => {
    return request({
      url: `/api/system/audit/logs/${id}`,
      method: 'get'
    });
  },

  // 获取数据变更记录
  getDataChangeList: (params: any) => {
    return request({
      url: '/api/system/audit/data-changes',
      method: 'get',
      params
    });
  },

  // 获取操作轨迹
  getOperationTrace: (params: any) => {
    return request({
      url: '/api/system/audit/operation-traces',
      method: 'get',
      params
    });
  }
};
