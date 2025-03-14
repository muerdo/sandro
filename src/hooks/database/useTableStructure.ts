"use client";

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { TableInfo } from '@/types/database';

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
        name: table.name,
        schema: table.schema,
        columns: table.columns.map((col: any) => ({
          name: col.name,
          type: col.type,
          is_nullable: col.is_nullable,
          is_identity: col.is_identity,
          is_primary: false,
          is_foreign: false
        })),
        constraints: [],
        indexes: [],
        row_count: table.row_count,
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
