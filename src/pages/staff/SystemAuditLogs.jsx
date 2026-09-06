import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';

export default function SystemAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await storageService.getAuditLogs();
      const data = res.data?.content || res.data || [];
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg('Failed to load system audit logs from audit-storage-service.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => {
    const actor = l.actor || l.actorId || '';
    const details = l.details || '';
    const action = l.action || '';
    
    const matchesSearch = actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          action.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesCategory = true;
    if (categoryFilter === 'ERRORS') {
      matchesCategory = action.includes('ERROR') || action.includes('CRASH') || action.includes('FAIL') || details.toLowerCase().includes('error');
    } else if (categoryFilter === 'AUTH') {
      matchesCategory = action.includes('LOGIN') || action.includes('AUTH') || action.includes('TOKEN') || action.includes('OTP');
    } else if (categoryFilter === 'SECURITY') {
      matchesCategory = action.includes('SECURITY') || action.includes('SYSTEM_ADMIN') || action.includes('USER_STATUS');
    }

    return matchesSearch && matchesCategory;
  });

  const columns = [
    { 
      key: 'timestamp', 
      header: 'Timestamp', 
      render: (row) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {new Date(row.timestamp || Date.now()).toLocaleString()}
        </span>
      )
    },
    { 
      key: 'action', 
      header: 'System Action Event', 
      render: (row) => {
        let variant = 'neutral';
        const act = row.action || 'SYSTEM_EVENT';
        if (act.includes('ERROR') || act.includes('CRASH') || act.includes('FAIL')) variant = 'danger';
        else if (act.includes('WARN')) variant = 'warning';
        else if (act.includes('LOGIN') || act.includes('AUTH')) variant = 'info';
        else if (act.includes('APPROVED') || act.includes('SUCCESS')) variant = 'success';
        return <Badge variant={variant} className="font-mono text-[11px]">{act}</Badge>;
      } 
    },
    { 
      key: 'actor', 
      header: 'Actor / Service Identifier', 
      cellClassName: 'font-semibold text-slate-900 dark:text-white text-xs font-mono' 
    },
    { 
      key: 'ip', 
      header: 'Host / IP Address', 
      render: (row) => <span className="text-slate-500 font-mono text-xs">{row.ip || row.ipAddress || '127.0.0.1 (internal)'}</span>
    },
    { 
      key: 'details', 
      header: 'Event & Exception Details', 
      cellClassName: 'text-slate-700 dark:text-slate-300 text-xs' 
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          System Infrastructure & Security Audit Logs
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Immutable audit record of system health events, service exceptions, authentication transactions, and administrative changes.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Security & Infrastructure Audit Trail ({filteredLogs.length})</CardTitle>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <Input 
              placeholder="Search by actor, service or details..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64" 
            />
            <div className="w-48">
              <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="ALL">All System Logs</option>
                <option value="ERRORS">System Errors & Crashes</option>
                <option value="AUTH">Authentication & 2FA</option>
                <option value="SECURITY">Administrative & Security</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={filteredLogs} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
