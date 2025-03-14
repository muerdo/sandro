export interface TableInfo {
  name: string;
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
  selectedTable: string | null;
  tableData: TableData[];
  expandedRows: Set<number>;
  showSystemTables: boolean;
}
