import { mount } from '@vue/test-utils';
import AuditLogList from '@/pages/system/audit-management/AuditLogList.vue';
import { ElTable } from 'element-plus';

describe('AuditLogList.vue', () => {
  it('renders table when data is loaded', async () => {
    const wrapper = mount(AuditLogList, {
      global: {
        stubs: { ElTable }
      }
    });
    
    // 模拟数据加载
    await wrapper.vm.fetchAuditLogs();
    expect(wrapper.findComponent(ElTable).exists()).toBe(true);
  });
});
