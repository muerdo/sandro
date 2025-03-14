"use client";

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { 
  TableInfo, 
  TableName, 
  DatabaseTableHookReturn,
  SchemaTable,
  TableData 
} from '@/types/database';

export function useDatabaseTables(): DatabaseTableHookReturn {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<TableName | null>(null);
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showSystemTables, setShowSystemTables] = useState(false);

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_table_info');

      if (error) throw error;

      const processedTables = (data as TableInfo[] || [])
        .filter(table => 
          showSystemTables || (!table.name.startsWith('_') && !table.name.startsWith('pg_'))
        );

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
