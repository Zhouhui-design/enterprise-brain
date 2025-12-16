import request from '@/utils/request';

export const auditLogApi = {
  // 获取审计日志列表
  getAuditLogs: (params) => request({
    url: '/api/audit/logs',
    method: 'get',
    params
  }),
  // 获取审计日志详情
  getAuditLogById: (id) => request({
    url: `/api/audit/logs/${id}`,
    method: 'get'
  })
};

export const dataChangeApi = {
  // 获取数据变更记录
  getDataChanges: (params) => request({
    url: '/api/audit/changes',
    method: 'get',
    params
  })
};

export const operationTraceApi = {
  // 获取操作轨迹
  getOperationTraces: (params) => request({
    url: '/api/audit/traces',
    method: 'get',
    params
  })
};
