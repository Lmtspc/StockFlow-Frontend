export interface User {
  id: string;
  email: string;
  display_name: string;
}

export interface Role {
  id?: string;
  code: string;
  name: string;
  description?: string;
}

export interface SystemUser {
  id: string;
  email: string;
  display_name: string;
  is_active: boolean;
  role_codes?: string[];
  roles?: Role[] | string[];
  created_at: string;
}

export interface ActorPermissions {
  'catalog.product.manage'?: boolean;
  'catalog.warehouse.manage'?: boolean;
  'purchase_order.create'?: boolean;
  'purchase_order.approve'?: boolean;
  'goods_receipt.create'?: boolean;
  'sales_order.create'?: boolean;
  'sale.reserve'?: boolean;
  'sales_order.fulfill'?: boolean;
  'sales_order.cancel'?: boolean;
  'stock.transfer.manage'?: boolean;
  'inventory.adjust.submit'?: boolean;
  'inventory.adjust.approve'?: boolean;
  'report.stock.read'?: boolean;
  'report.reorder.read'?: boolean;
  'report.valuation.read'?: boolean;
  'inventory.cost.read'?: boolean;
  [key: string]: boolean | undefined;
}

export interface Actor {
  id: string;
  display_name: string;
  permissions: ActorPermissions;
  warehouse_ids: Record<string, boolean>;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
  actor: Actor;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category_id?: string | null;
  unit_of_measure: string;
  track_batches: boolean;
  track_expiry: boolean;
  reorder_point: number | string;
  reorder_qty: number | string;
  is_active: boolean;
  created_at: string;
}

export interface Location {
  id: string;
  warehouse_id: string;
  code: string;
  name: string;
  type: 'SELLABLE' | 'QUARANTINE' | 'DAMAGED' | 'IN_TRANSIT';
  is_active: boolean;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
  locations?: Location[];
}

export interface POLine {
  id?: string;
  purchase_order_id?: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  ordered_qty: number;
  unit_cost: number;
  received_qty?: number;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplier_id: string;
  supplier_name?: string;
  warehouse_id: string;
  warehouse_name?: string;
  status: 'DRAFT' | 'APPROVED' | 'POSTED' | 'CANCELLED';
  ordered_at?: string;
  lines?: POLine[];
  created_at?: string;
}

export interface GoodsReceiptLine {
  po_line_id?: string;
  product_id: string;
  product_name?: string;
  location_id: string;
  location_code?: string;
  batch_no: string;
  received_qty: number;
  unit_cost: number;
  expiry_date?: string;
}

export interface GoodsReceipt {
  id: string;
  number: string;
  purchase_order_id: string;
  warehouse_id: string;
  lines?: GoodsReceiptLine[];
  created_at?: string;
}

export interface SOLine {
  id?: string;
  sales_order_id?: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  quantity: number;
  fulfilled_qty?: number;
  unit_price: number;
}

export interface SalesOrder {
  id: string;
  number: string;
  customer_name: string;
  warehouse_id: string;
  status: 'DRAFT' | 'RESERVED' | 'FULFILLED' | 'CANCELLED' | 'POSTED';
  lines?: SOLine[];
  created_at?: string;
}

export interface TransferLine {
  product_id: string;
  product_name?: string;
  sku?: string;
  batch_no?: string;
  quantity: number;
}

export interface StockTransfer {
  id: string;
  number: string;
  source_warehouse_id: string;
  source_warehouse_name?: string;
  dest_warehouse_id: string;
  dest_warehouse_name?: string;
  status: 'DRAFT' | 'APPROVED' | 'SHIPPED' | 'RECEIVED';
  lines?: TransferLine[];
  created_at?: string;
}

export interface StockAdjustment {
  id: string;
  number: string;
  warehouse_id?: string;
  warehouse_name?: string;
  location_id?: string;
  location_code?: string;
  product_id?: string;
  product_name?: string;
  sku?: string;
  batch_no?: string;
  adjustment_type: 'IN' | 'OUT' | 'WRITE_OFF';
  quantity: number;
  unit_cost?: number;
  reason?: string;
  status: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';
  created_at?: string;
}

export interface StockOnHandReportItem {
  product_id: string;
  sku: string;
  product_name: string;
  location_id: string;
  location_code: string;
  batch_no: string;
  expiry_date: string;
  on_hand: string | number;
  reserved: string | number;
  available: string | number;
  unit_cost: string | number;
  total_value: string | number;
}

export interface LowStockReportItem {
  product_id: string;
  sku: string;
  product_name: string;
  available: string | number;
  open_po_qty: string | number;
  reorder_point: string | number;
  reorder_qty: string | number;
  suggested_po_qty: string | number;
}

export interface AsOfValuationReportItem {
  product_id: string;
  sku: string;
  product_name: string;
  on_hand_as_of: string | number;
  total_value: string | number;
}
