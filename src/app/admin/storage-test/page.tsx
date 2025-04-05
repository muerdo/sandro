"use client";

import { useState, useEffect } from "react";
import { checkStoragePermissions, testBucketUpload } from "@/lib/storage-utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export default function StorageTestPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [permissionsResult, setPermissionsResult] = useState<any>(null);
  const [testingBucket, setTestingBucket] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    setLoading(true);
    try {
      const result = await checkStoragePermissions();
      setPermissionsResult(result);
    } catch (error) {
      console.error("Error checking permissions:", error);
      toast.error("Failed to check storage permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleTestBucketUpload = async (bucketName: string) => {
    setTestingBucket(bucketName);
    try {
      const result = await testBucketUpload(bucketName);
      setTestResults(prev => ({
        ...prev,
        [bucketName]: result
      }));
      if (result.success) {
        toast.success(`Successfully uploaded test file to bucket '${bucketName}'`);
      } else {
        toast.error(`Failed to upload test file to bucket '${bucketName}'`);
      }
    } catch (error) {
      console.error(`Error testing bucket '${bucketName}':`, error);
      toast.error(`Error testing bucket '${bucketName}'`);
      setTestResults(prev => ({
        ...prev,
        [bucketName]: { success: false, error }
      }));
    } finally {
      setTestingBucket(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Supabase Storage Test</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">User Information</h2>
        <div className="bg-card p-4 rounded-lg">
          {user ? (
            <div>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
            </div>
          ) : (
            <p>Not authenticated</p>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Storage Permissions</h2>
          <button 
            onClick={checkPermissions}
            className="bg-primary text-white px-4 py-2 rounded-lg"
            disabled={loading}
          >
            {loading ? "Checking..." : "Refresh"}
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          </div>
        ) : permissionsResult ? (
          <div className="bg-card p-4 rounded-lg">
            <p><strong>Authentication Status:</strong> {permissionsResult.isAuthenticated ? "Authenticated" : "Not authenticated"}</p>
            <p><strong>Success:</strong> {permissionsResult.success ? "Yes" : "No"}</p>
            {permissionsResult.message && <p><strong>Message:</strong> {permissionsResult.message}</p>}
            
            <h3 className="text-lg font-medium mt-4 mb-2">Buckets</h3>
            {permissionsResult.buckets && permissionsResult.buckets.length > 0 ? (
              <div className="space-y-4">
                {permissionsResult.buckets.map((bucket: any) => (
                  <div key={bucket.name} className="border p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p><strong>Name:</strong> {bucket.name}</p>
                        <p><strong>Accessible:</strong> {bucket.accessible ? "Yes" : "No"}</p>
                        {bucket.error && (
                          <div className="mt-2">
                            <p className="text-destructive"><strong>Error:</strong> {bucket.error.message}</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleTestBucketUpload(bucket.name)}
                        className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg"
                        disabled={testingBucket === bucket.name}
                      >
                        {testingBucket === bucket.name ? "Testing..." : "Test Upload"}
                      </button>
                    </div>
                    
                    {testResults[bucket.name] && (
                      <div className="mt-4 p-3 bg-background rounded-lg">
                        <h4 className="font-medium mb-2">Test Results</h4>
                        <p><strong>Success:</strong> {testResults[bucket.name].success ? "Yes" : "No"}</p>
                        {testResults[bucket.name].message && (
                          <p><strong>Message:</strong> {testResults[bucket.name].message}</p>
                        )}
                        {testResults[bucket.name].error && (
                          <div className="mt-2">
                            <p className="text-destructive"><strong>Error:</strong> {testResults[bucket.name].error.message}</p>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                              {JSON.stringify(testResults[bucket.name].error, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No buckets found</p>
            )}
          </div>
        ) : (
          <p>No permissions data available</p>
        )}
      </div>
    </div>
  );
}
