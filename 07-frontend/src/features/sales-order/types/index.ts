// 销售订单类型定义

export interface SalesOrder {
  id: number;
  orderNo: string;
  customerName: string;
  orderStatus: 'draft' | 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  totalAmount: number;
  orderTime: string;
  promisedDelivery: string;
  customerDelivery: string;
  [key: string]: any;
}

export interface SalesOrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  [key: string]: any;
}

export interface OrderFilter {
  searchText: string;
  orderStatus: string;
  priority: string;
  dateRange: [string, string] | [];
}

export interface ColumnConfig {
  prop: string;
  label: string;
  visible: boolean;
  order: number;
}
