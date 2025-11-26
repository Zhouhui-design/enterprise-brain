// 修改前
import { ref } from 'vue';
import { request } from '@/api'; // 假设已有请求工具

// 修改后
import { ref } from 'vue';
import request from '@/utils/request';

export default function useTableData() {
  const tableData = ref([]);
  const columns = ref([]);
  const loading = ref(false);

  const fetchTableData = async (tableId) => {
    loading.value = true;
    try {
      const res = await request.get(`/api/smart-table/${tableId}`);
      tableData.value = res.data.rows;
      columns.value = res.data.columns;
    } catch (err) {
      console.error('Failed to fetch table data', err);
    } finally {
      loading.value = false;
    }
  };

  return {
    tableData,
    columns,
    loading,
    fetchTableData
  };
}