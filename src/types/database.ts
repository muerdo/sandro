import type { Database } from '@/lib/supabase.types';

export type TableName = string;

export type DatabaseTable = keyof Database['public']['Tables'];

export type ValidTableName = DatabaseTable | string;

export type DatabaseTableRow<T extends string> = Record<string, unknown>;

export interface TableColumn {
  name: string;
  type: string;
  is_nullable: boolean;
  is_identity: boolean;
  is_primary: boolean;
  is_foreign: boolean;
  foreign_table?: string;
  foreign_column?: string;
  default_value?: string;
  max_length?: number;
  description?: string;
}

export interface TableConstraint {
  name: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK';
  columns: string[];
  referenced_table?: string;
  referenced_columns?: string[];
  check_expression?: string;
}

export interface TableIndex {
  name: string;
  columns: string[];
  is_unique: boolean;
  method: string;
}

export interface TableInfo {
  name: TableName;
  schema: string;
  columns: TableColumn[];
  constraints: TableConstraint[];
  indexes: TableIndex[];
  row_count: number;
  size_bytes: number;
  last_vacuum?: string;
  last_analyze?: string;
  description?: string;
}

export interface TableData {
  [key: string]: any;
}

export interface TableFilter {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';
  value: any;
}

export interface TableSort {
  column: string;
  direction: 'asc' | 'desc';
}

export interface DatabaseTableState {
  tables: TableInfo[];
  loading: boolean;
  selectedTable: TableName | null;
  tableData: TableData[];
  expandedRows: Set<number>;
  showSystemTables: boolean;
  filters: TableFilter[];
  sorts: TableSort[];
  page: number;
  pageSize: number;
  totalRows: number;
}

export interface DatabaseTableActions {
  fetchTables: () => Promise<void>;
  fetchTableData: (tableName: TableName, options?: {
    filters?: TableFilter[];
    sorts?: TableSort[];
    page?: number;
    pageSize?: number;
  }) => Promise<void>;
  toggleRowExpansion: (index: number) => void;
  toggleSystemTables: () => void;
  setSelectedTable: (tableName: TableName | null) => void;
  addFilter: (filter: TableFilter) => void;
  removeFilter: (index: number) => void;
  addSort: (sort: TableSort) => void;
  removeSort: (index: number) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  exportData: (format: 'csv' | 'json') => Promise<void>;
  importData: (file: File) => Promise<void>;
}

export interface DatabaseTableHookReturn extends DatabaseTableState, DatabaseTableActions {}

export interface SchemaTable {
  table_name: string;
  table_schema: string;
  table_type: string;
  table_owner: string;
  table_size: number;
  row_estimate: number;
  last_vacuum: string | null;
  last_analyze: string | null;
  description: string | null;
}

export interface TableStats {
  total_size: number;
  table_size: number;
  index_size: number;
  toast_size: number;
  table_rows: number;
  dead_rows: number;
  mod_rows: number;
  last_vacuum: string | null;
  last_analyze: string | null;
}
