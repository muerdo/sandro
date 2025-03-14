"use client";

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { 
  TableInfo, 
  DatabaseTableHookReturn,
  SchemaTable,
  TableData,
  TableName 
} from '@/types/database';

export function useDatabaseTables(): DatabaseTableHookReturn {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<TableName | null>(null);
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showSystemTables, setShowSystemTables] = useState(false);
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [sorts, setSorts] = useState<TableSort[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [editingCell, setEditingCell] = useState<{row: number; col: string} | null>(null);
  const [showTableSettings, setShowTableSettings] = useState(false);

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_table_info');

      if (error) throw error;

      // Transform the data to match TableInfo type
      const processedTables = (data || []).map(table => ({
        name: table.name as TableName,
        schema: table.schema,
        columns: (table.columns as any[]).map(col => ({
          name: col.name,
          type: col.type,
          is_nullable: col.is_nullable,
          is_identity: col.is_identity
        })),
        row_count: table.row_count
      })).filter(table => {
        const tableName = String(table.name);
        return showSystemTables || (!tableName.startsWith('_') && !tableName.startsWith('pg_'));
      });

      setTables(processedTables);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Failed to load database tables');
    } finally {
      setLoading(false);
    }
  }, [showSystemTables]);

  const fetchTableData = useCallback(async (
    tableName: TableName,
    options?: {
      filters?: TableFilter[];
      sorts?: TableSort[];
      page?: number;
      pageSize?: number;
      searchTerm?: string;
    }
  ) => {
    try {
      let query = supabase
        .from(tableName as string)
        .select('*', { count: 'exact' });

      // Apply search if provided
      if (options?.searchTerm) {
        const columns = await supabase.rpc('get_searchable_columns', { table_name: tableName });
        if (Array.isArray(columns)) {
          const searchConditions = columns.map(column => 
            `${column}::text ILIKE '%${options.searchTerm}%'`
          );
          if (searchConditions.length > 0) {
            query = query.or(searchConditions.join(','));
          }
        }
      }

      // Apply filters
      if (options?.filters) {
        options.filters.forEach(filter => {
          query = query.filter(filter.column, filter.operator, filter.value);
        });
      }

      // Apply sorting
      if (options?.sorts) {
        options.sorts.forEach(sort => {
          query = query.order(sort.column, { ascending: sort.direction === 'asc' });
        });
      }

      // Apply pagination
      if (options?.page && options?.pageSize) {
        const from = (options.page - 1) * options.pageSize;
        query = query
          .range(from, from + options.pageSize - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setTableData(data as Record<string, unknown>[] || []);
      setSelectedTable(tableName);
      if (count !== null) setTotalRows(count);

    } catch (error) {
      console.error(`Error fetching data from ${String(tableName)}:`, error);
      toast.error(`Failed to load data from ${String(tableName)}`);
    }
  }, []);

  const toggleRowExpansion = useCallback((index: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const toggleSystemTables = useCallback(() => {
    setShowSystemTables(prev => !prev);
  }, []);

  return {
    tables,
    loading,
    selectedTable,
    tableData,
    expandedRows,
    showSystemTables,
    fetchTables,
    fetchTableData,
    toggleRowExpansion,
    toggleSystemTables,
    setSelectedTable
  };
}
