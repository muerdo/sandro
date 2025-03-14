"use client";

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { TableInfo } from '@/types/database';

export function useDatabaseTables() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const { 
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
  } = useDatabaseTables();

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: tablesData, error } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .eq('table_schema', 'public');

      if (error) throw error;

      const processedTables = (tablesData || [])
        .filter(table => 
          showSystemTables || (!table.table_name.startsWith('_') && !table.table_name.startsWith('pg_'))
        )
        .map(table => ({
          name: table.table_name as TableName,
          schema: table.table_schema,
          columns: [],
          row_count: 0
        }));

      setTables(processedTables);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Failed to load database tables');
    } finally {
      setLoading(false);
    }
  }, [showSystemTables]);

  const fetchTableData = useCallback(async (tableName: TableName) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(100);

      if (error) throw error;

      setTableData(data || []);
      setSelectedTable(tableName);
    } catch (error) {
      console.error(`Error fetching data from ${tableName}:`, error);
      toast.error(`Failed to load data from ${tableName}`);
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
