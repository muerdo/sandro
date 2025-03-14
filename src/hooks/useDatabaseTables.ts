"use client";

import { useState } from 'react';
import { useTableStructure } from './database/useTableStructure';
import { useTableData } from './database/useTableData';
import type { 
  TableName,
  TableData,
  DatabaseTableHookReturn,
  TableFilter,
  TableSort
} from '@/types/database';

export function useDatabaseTables(): DatabaseTableHookReturn {
  // Table structure management
  const {
    tables,
    loading: tablesLoading,
    showSystemTables,
    fetchTables,
    toggleSystemTables
  } = useTableStructure();

  // Table data management
  const {
    tableData,
    loading: dataLoading,
    totalRows,
    fetchData
  } = useTableData();

  // Local state
  const [selectedTable, setSelectedTable] = useState<TableName | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [filters] = useState<TableFilter[]>([]);
  const [sorts] = useState<TableSort[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const toggleRowExpansion = (index: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const fetchTableData = async (
    tableName: TableName,
    options?: {
      filters?: TableFilter[];
      sorts?: TableSort[];
      page?: number;
      pageSize?: number;
      searchTerm?: string;
    }
  ) => {
    await fetchData(tableName, {
      page: options?.page ?? page,
      pageSize: options?.pageSize ?? pageSize,
      searchTerm: options?.searchTerm
    });
    setSelectedTable(tableName);
  };

  const addFilter = useCallback((filter: TableFilter) => {
    setFilters(prev => [...prev, filter]);
  }, []);

  const removeFilter = useCallback((index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addSort = useCallback((sort: TableSort) => {
    setSorts(prev => [...prev, sort]);
  }, []);

  const removeSort = useCallback((index: number) => {
    setSorts(prev => prev.filter((_, i) => i !== index));
  }, []);

  const exportData = useCallback(async (format: 'csv' | 'json') => {
    if (!selectedTable) return;
    // Export implementation
  }, [selectedTable]);

  const importData = useCallback(async (file: File) => {
    if (!selectedTable) return;
    // Import implementation
  }, [selectedTable]);

  return {
    tables,
    loading: tablesLoading || dataLoading,
    selectedTable,
    tableData,
    expandedRows,
    showSystemTables,
    filters,
    sorts,
    page,
    pageSize,
    totalRows,
    fetchTables,
    fetchTableData,
    toggleRowExpansion,
    toggleSystemTables,
    setSelectedTable,
    setPage,
    setPageSize,
    addFilter,
    removeFilter,
    addSort,
    removeSort,
    exportData,
    importData
  };
}
