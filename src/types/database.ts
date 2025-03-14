export type TableName = 
  | "categories"
  | "contacts" 
  | "data"
  | "messages"
  | "orders"
  | "profiles"
  | "payment_settings"
  | "products"
  | "shipping_addresses";

export interface TableInfo {
  name: TableName;
  schema: string;
  columns: Array<{
    name: string;
    type: string;
    is_nullable: boolean;
    is_identity: boolean;
  }>;
  row_count: number;
}

export interface TableData {
  [key: string]: any;
}

export interface TableState {
  selectedTable: TableName | null;
  tableData: TableData[];
  expandedRows: Set<number>;
  showSystemTables: boolean;
}

export interface TableInfoResponse {
  name: TableName;
  schema: string;
  columns: Array<{
    name: string;
    type: string;
    is_nullable: boolean;
    is_identity: boolean;
  }>;
  row_count: number;
}
