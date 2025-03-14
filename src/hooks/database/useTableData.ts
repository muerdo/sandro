"use client";

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { TableData, TableName } from '@/types/database';

interface UseTableDataReturn {
  tableData: TableData[];
  loading: boolean;
  totalRows: number;
  fetchData: (tableName: TableName, options?: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
  }) => Promise<void>;
}

export function useTableData(): UseTableDataReturn {
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);

  const fetchData = useCallback(async (
    tableName: TableName,
    options?: {
      page?: number;
      pageSize?: number;
      searchTerm?: string;
    }
  ) => {
    try {
      setLoading(true);
      let query = supabase
        .from(tableName as string)
        .select('*', { count: 'exact' });

      // Apply pagination
      if (options?.page && options?.pageSize) {
        const from = (options.page - 1) * options.pageSize;
        query = query.range(from, from + options.pageSize - 1);
      }

      // Apply search if provided
      if (options?.searchTerm) {
        query = query.textSearch('search', options.searchTerm);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setTableData(data as Record<string, unknown>[] || []);
      if (count !== null) setTotalRows(count);

    } catch (error) {
      console.error(`Error fetching data:`, error);
      toast.error(`Failed to load data`);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tableData,
    loading,
    totalRows,
    fetchData
  };
}
