"use client";

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { TableInfo, TableName, TableConstraint, TableIndex } from '@/types/database';

interface UseTableStructureReturn {
  tables: TableInfo[];
  loading: boolean;
  showSystemTables: boolean;
  fetchTables: () => Promise<void>;
  toggleSystemTables: () => void;
}

export function useTableStructure(): UseTableStructureReturn {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSystemTables, setShowSystemTables] = useState(false);

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_table_info');

      if (error) throw error;

      // Transform the data to match TableInfo type
      const processedTables = (data || []).map(table => ({
        name: table.name as TableName,
        schema: table.schema as string,
        columns: (typeof table.columns === 'string' ? 
          JSON.parse(table.columns) : table.columns).map((col: Record<string, unknown>) => ({
          name: col.name as string,
          type: col.type as string,
          is_nullable: Boolean(col.is_nullable),
          is_identity: Boolean(col.is_identity),
          is_primary: Boolean(col.is_primary),
          is_foreign: Boolean(col.is_foreign),
          foreign_table: col.foreign_table as string | undefined,
          foreign_column: col.foreign_column as string | undefined,
          default_value: col.default_value as string | undefined,
          max_length: typeof col.max_length === 'number' ? col.max_length : undefined,
          description: col.description as string | undefined
        })),
        constraints: [] as TableConstraint[],
        indexes: [] as TableIndex[],
        row_count: typeof table.row_count === 'number' ? table.row_count : 0,
        size_bytes: 0,
        last_vacuum: null,
        last_analyze: null,
        description: null
      }));

      setTables(processedTables.filter(table => {
        const tableName = String(table.name);
        return showSystemTables || (!tableName.startsWith('_') && !tableName.startsWith('pg_'));
      }));
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Failed to load database tables');
    } finally {
      setLoading(false);
    }
  }, [showSystemTables]);

  const toggleSystemTables = useCallback(() => {
    setShowSystemTables(prev => !prev);
  }, []);

  return {
    tables,
    loading,
    showSystemTables,
    fetchTables,
    toggleSystemTables
  };
}
