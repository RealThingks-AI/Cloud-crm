
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Search, AlertTriangle, Activity, FileText, Filter } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  created_at: string;
}

const AuditLogsSettings = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, actionFilter]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Transform the data to match our AuditLog interface
      const transformedLogs: AuditLog[] = (data || []).map(log => ({
        id: log.id,
        user_id: log.user_id || '',
        action: log.action,
        resource_type: log.resource_type,
        resource_id: log.resource_id || undefined,
        details: log.details || undefined,
        ip_address: log.ip_address ? String(log.ip_address) : undefined,
        created_at: log.created_at
      }));

      setLogs(transformedLogs);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by action type
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => {
        switch (actionFilter) {
          case 'user_management':
            return ['USER_CREATED', 'USER_DELETED', 'USER_ACTIVATED', 'USER_DEACTIVATED', 'ROLE_CHANGE', 'PASSWORD_RESET'].includes(log.action);
          case 'data_access':
            return log.action.includes('DATA_ACCESS') || log.action.includes('SENSITIVE_DATA_ACCESS');
          case 'authentication':
            return log.action.includes('LOGIN') || log.action.includes('LOGOUT') || log.action.includes('AUTH');
          case 'export':
            return log.action.includes('EXPORT');
          default:
            return true;
        }
      });
    }

    setFilteredLogs(filtered);
  };

  const exportAuditTrail = async () => {
    try {
      const csvContent = [
        ['Timestamp', 'User ID', 'Action', 'Resource Type', 'Resource ID', 'IP Address', 'Details'].join(','),
        ...filteredLogs.map(log => [
          format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
          log.user_id || '',
          log.action,
          log.resource_type,
          log.resource_id || '',
          log.ip_address || '',
          JSON.stringify(log.details || {}).replace(/,/g, ';')
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-trail-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Audit trail exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export audit trail",
        variant: "destructive",
      });
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('USER')) return <Activity className="h-4 w-4" />;
    if (action.includes('DATA')) return <FileText className="h-4 w-4" />;
    if (action.includes('EXPORT')) return <Download className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('CREATED') || action.includes('ACTIVATED')) return 'default';
    if (action.includes('DELETED') || action.includes('DEACTIVATED')) return 'destructive';
    if (action.includes('ROLE_CHANGE') || action.includes('PASSWORD_RESET')) return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Security Audit Logs
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track all security-related activities and user management actions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchAuditLogs} variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportAuditTrail} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Trail
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search logs by action, resource, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="user_management">User Management</SelectItem>
                <SelectItem value="data_access">Data Access</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
                <SelectItem value="export">Data Export</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)} className="flex items-center gap-1 w-fit">
                          {getActionIcon(log.action)}
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{log.resource_type}</span>
                        {log.resource_id && (
                          <span className="text-muted-foreground text-sm block">
                            ID: {log.resource_id.substring(0, 8)}...
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.user_id ? log.user_id.substring(0, 8) + '...' : 'System'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ip_address || 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {log.details && (
                          <details className="cursor-pointer">
                            <summary className="text-sm text-muted-foreground hover:text-foreground">
                              View details
                            </summary>
                            <pre className="text-xs mt-2 p-2 bg-muted rounded whitespace-pre-wrap">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredLogs.length === 0 && (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm || actionFilter !== 'all' ? 'No logs match your filters' : 'No audit logs found'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Log Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{logs.length}</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {logs.filter(log => log.action.includes('USER')).length}
              </div>
              <div className="text-sm text-muted-foreground">User Management</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {logs.filter(log => log.action.includes('DATA')).length}
              </div>
              <div className="text-sm text-muted-foreground">Data Access</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {logs.filter(log => log.action.includes('EXPORT')).length}
              </div>
              <div className="text-sm text-muted-foreground">Data Exports</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogsSettings;
