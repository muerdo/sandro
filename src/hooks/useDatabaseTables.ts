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
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [sorts, setSorts] = useState<TableSort[]>([]);
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

  const addFilter = (filter: TableFilter) => {
    setFilters((prev: TableFilter[]) => [...prev, filter]);
  };

  const removeFilter = (index: number) => {
    setFilters((prev: TableFilter[]) => prev.filter((_: TableFilter, i: number) => i !== index));
  };

  const addSort = (sort: TableSort) => {
    setSorts((prev: TableSort[]) => [...prev, sort]);
  };

  const removeSort = (index: number) => {
    setSorts((prev: TableSort[]) => prev.filter((_: TableSort, i: number) => i !== index));
  };

  const exportData = async (format: 'csv' | 'json') => {
    if (!selectedTable) return;
    // Export implementation
  };

  const importData = async (file: File) => {
    if (!selectedTable) return;
    // Import implementation
  };

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
