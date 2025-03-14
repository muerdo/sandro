import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { TableInfo, TableData, TableState } from '@/types/database';

export function useTableManagement() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<TableState>({
    selectedTable: null,
    tableData: [],
    expandedRows: new Set(),
    showSystemTables: false
  });

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      
      // Execute raw SQL query to get table information
      const { data, error } = await supabase.rpc('execute_sql', {
        query: `
          SELECT 
            table_name as name,
            table_schema as schema,
            array_agg(json_build_object(
              'name', column_name,
              'type', data_type,
              'is_nullable', is_nullable = 'YES',
              'is_identity', is_identity = 'YES'
            )) as columns,
            0 as row_count
          FROM information_schema.columns 
          WHERE table_schema = 'public'
          GROUP BY table_name, table_schema
        `
      });

      if (error) throw error;

      const tables = (data || []).map((table: any) => ({
        name: table.name,
        schema: table.schema,
        columns: table.columns || [],
        row_count: table.row_count
      }));

      setTables(tables.filter(table => 
        state.showSystemTables || (!table.name.startsWith('_') && !table.name.startsWith('pg_'))
      ));
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Failed to load database tables');
    } finally {
      setLoading(false);
    }
  }, [state.showSystemTables]);

  const fetchTableData = useCallback(async (tableName: string) => {
    try {
      // Execute raw SQL query to fetch table data
      const { data, error } = await supabase.rpc('execute_sql', {
        query: `SELECT * FROM "${tableName}" LIMIT 100`
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        selectedTable: tableName,
        tableData: data || []
      }));
    } catch (error) {
      console.error(`Error fetching data from ${tableName}:`, error);
      toast.error(`Failed to load data from ${tableName}`);
    }
  }, []);

  const toggleRowExpansion = useCallback((index: number) => {
    setState(prev => {
      const newExpandedRows = new Set(prev.expandedRows);
      if (newExpandedRows.has(index)) {
        newExpandedRows.delete(index);
      } else {
        newExpandedRows.add(index);
      }
      return {
        ...prev,
        expandedRows: newExpandedRows
      };
    });
  }, []);

  const toggleSystemTables = useCallback(() => {
    setState(prev => ({
      ...prev,
      showSystemTables: !prev.showSystemTables
    }));
  }, []);

  return {
    tables,
    loading,
    state,
    fetchTables,
    fetchTableData,
    toggleRowExpansion,
    toggleSystemTables
  };
}
