export type TableName = keyof Database['public']['Tables'] | string;

export type DatabaseTableRow<T extends string> = Record<string, unknown>;

export interface TableColumn {
  name: string;
  type: string;
  is_nullable: boolean;
  is_identity: boolean;
}

export interface TableInfo {
  name: TableName;
  schema: string;
  columns: TableColumn[];
  row_count: number;
}

export interface TableData {
  [key: string]: any;
}

export interface DatabaseTableState {
  tables: TableInfo[];
  loading: boolean;
  selectedTable: TableName | null;
  tableData: TableData[];
  expandedRows: Set<number>;
  showSystemTables: boolean;
}

export interface DatabaseTableActions {
  fetchTables: () => Promise<void>;
  fetchTableData: (tableName: TableName) => Promise<void>;
  toggleRowExpansion: (index: number) => void;
  toggleSystemTables: () => void;
  setSelectedTable: (tableName: TableName | null) => void;
}

export interface DatabaseTableHookReturn extends DatabaseTableState, DatabaseTableActions {}

export interface SchemaTable {
  table_name: string;
  table_schema: string;
}
