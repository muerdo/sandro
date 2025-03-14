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
      })).filter(table => 
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
      // Type assertion needed since we allow string for system tables
      const { data, error } = await supabase
        .from(tableName as keyof Database['public']['Tables'])
        .select('*')
        .limit(100);

      if (error) throw error;

      setTableData(data as Record<string, unknown>[] || []);
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
