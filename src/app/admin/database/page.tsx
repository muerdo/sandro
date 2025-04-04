"use client";

import { useEffect, useState, useMemo } from "react";
import { useDatabaseTables } from "@/hooks/useDatabaseTables";
import type { TableName, TableColumn, TableData, TableFilter, TableSort } from "@/types/database";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Database,
  Table,
  AlertCircle,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  X,
  Edit,
  Check,
  Filter,
  ArrowUpDown,
  Download,
  Upload,
  Search,
  Settings,
  MoreVertical,
  Copy,
  FileJson,
  FileSpreadsheet
} from "lucide-react";

interface TableInfo {
  name: string;
  schema: string;
  columns: Array<{
    name: string;
    type: string;
    is_nullable: boolean;
    is_identity: boolean;
  }>;
  row_count: number;
}

export default function DatabaseManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
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
    toggleSystemTables
  } = useDatabaseTables();

  const checkAdminStatus = async () => {
    if (!user) {
      router.push('/');
      return;
    }

    // Verifica se já verificamos o status de admin nesta sessão
    const adminStatusChecked = sessionStorage.getItem('admin_database_status_checked');
    if (adminStatusChecked === 'true' && isAdmin) {
      return; // Já verificamos e é admin
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      router.push('/');
      return;
    }

    setIsAdmin(true);
    sessionStorage.setItem('admin_database_status_checked', 'true');
  };

  // Efeito para inicializar a página apenas uma vez
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await checkAdminStatus();
        if (isAdmin) {
          // Carrega as tabelas apenas uma vez
          await fetchTables();
        }
      } catch (error) {
        console.error('Error initializing database:', error);
        toast.error('Failed to initialize database management');
      }
    };

    initializeDatabase();
  }, [isAdmin]); // Dependemos apenas do status de admin

  const handleTableSelect = async (tableName: TableName) => {
    try {
      await fetchTableData(tableName);
    } catch (error) {
      console.error(`Error fetching data from ${tableName}:`, error);
      toast.error(`Failed to load data from ${tableName}`);
    }
  };


  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Database Management</h1>
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleSystemTables()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground"
            >
              {showSystemTables ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showSystemTables ? 'Hide System Tables' : 'Show System Tables'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchTables}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Tables List */}
          <div className="col-span-1 bg-card rounded-xl shadow-lg p-6 h-[calc(100vh-12rem)] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Tables</h2>
            <div className="space-y-2">
              {tables.map((table) => (
                <motion.button
                  key={table.name}
                  onClick={() => fetchTableData(table.name)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-3 rounded-lg text-left flex items-center justify-between ${
                    selectedTable === table.name
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 hover:bg-secondary'
                  }`}
                >
                  <span className="font-medium">{table.name}</span>
                  <span className="text-sm opacity-80">{table.row_count} rows</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Table Data */}
          <div className="col-span-3 bg-card rounded-xl shadow-lg p-6 h-[calc(100vh-12rem)] overflow-hidden">
            {selectedTable ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{selectedTable}</h2>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Row
                    </motion.button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  {tableData.length > 0 ? (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-secondary/50">
                          <th className="py-3 px-4 text-left">Actions</th>
                          {Object.keys(tableData[0]).map((column) => (
                            <th key={column} className="py-3 px-4 text-left">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((row, index) => (
                          <>
                            <tr key={index} className="border-t">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-1 text-primary hover:bg-primary/10 rounded"
                                    onClick={() => toggleRowExpansion(index)}
                                  >
                                    {expandedRows.has(index) ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-1 text-destructive hover:bg-destructive/10 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              </td>
                              {Object.entries(row).map(([key, value]) => (
                                <td key={key} className="py-3 px-4">
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                            {expandedRows.has(index) && (
                              <tr>
                                <td colSpan={Object.keys(row).length + 1}>
                                  <div className="p-4 bg-secondary/20">
                                    <h4 className="font-medium mb-2">Edit Row</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      {Object.entries(row).map(([key, value]) => (
                                        <div key={key}>
                                          <label className="block text-sm font-medium mb-1">
                                            {key}
                                          </label>
                                          <input
                                            type="text"
                                            defaultValue={String(value)}
                                            className="w-full p-2 rounded-lg border bg-background"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex justify-end mt-4 gap-2">
                                      <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground"
                                        onClick={() => toggleRowExpansion(index)}
                                      >
                                        Cancel
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground flex items-center gap-2"
                                      >
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                      </motion.button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a table to view its data
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
