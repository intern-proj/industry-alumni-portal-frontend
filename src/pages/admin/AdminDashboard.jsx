import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { metricsService } from '../../services/metricsService';
import { storageService } from '../../services/storageService';

export default function AdminDashboard() {
  const [servicesData, setServicesData] = useState([]);
  const [telemetrySummary, setTelemetrySummary] = useState({
    status: 'UP',
    totalServices: 0,
    upServices: 0,
    downServices: 0,
    avgLatencyMs: 0,
    recentErrors: 0,
  });
  const [systemLogs, setSystemLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const loadLiveTelemetry = useCallback(async () => {
    setLoading(true);
    try {
      const [telemetryRes, logsRes] = await Promise.allSettled([
        metricsService.fetchSystemTelemetry(),
        storageService.getAuditLogs({ size: 10, sort: 'timestamp,desc' }),
      ]);

      if (telemetryRes.status === 'fulfilled' && telemetryRes.value) {
        const t = telemetryRes.value;
        if (Array.isArray(t.services)) {
          setServicesData(t.services);
        }
        setTelemetrySummary({
          status: t.status || 'UP',
          totalServices: t.totalServices || (t.services ? t.services.length : 0),
          upServices: t.upServices || 0,
          downServices: t.downServices || 0,
          avgLatencyMs: t.avgLatencyMs || 0,
          recentErrors: t.recentErrors || 0,
        });
      }

      if (logsRes.status === 'fulfilled') {
        const raw = logsRes.value?.data?.content || logsRes.value?.data || [];
        setSystemLogs(Array.isArray(raw) ? raw : []);
      }
      setLastRefreshed(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLiveTelemetry();
    // Auto refresh telemetry every 15 seconds
    const interval = setInterval(loadLiveTelemetry, 15000);
    return () => clearInterval(interval);
  }, [loadLiveTelemetry]);

  const upCount = servicesData.filter((s) => s.status === 'UP').length;
  const downCount = servicesData.filter((s) => s.status === 'DOWN').length;
  const totalCount = servicesData.length;
  const avgLatency =
    servicesData.length > 0
      ? Math.round(
          servicesData.reduce((sum, s) => sum + (s.latencyMs || 0), 0) /
            servicesData.length
        )
      : telemetrySummary.avgLatencyMs || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              System Infrastructure & Metrics
            </h1>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                downCount === 0
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50'
                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  downCount === 0 ? 'bg-emerald-500' : 'bg-amber-500'
                } animate-pulse`}
              ></span>
              {downCount === 0
                ? 'ALL MICROSERVICES ONLINE'
                : `${downCount} SERVICE(S) OFFLINE`}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time inter-service health, network roundtrip latency, and immutable audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            Updated: {lastRefreshed.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            icon="refresh"
            loading={loading}
            onClick={loadLiveTelemetry}
          >
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Real-Time Platform Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Microservice Mesh
            </p>
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">
              hub
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {totalCount > 0 ? `${upCount}/${totalCount}` : 'Probing...'}
          </p>
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="material-symbols-outlined text-[14px]">
              check_circle
            </span>
            <span>
              {downCount === 0
                ? 'All services responsive via Gateway'
                : `${downCount} service(s) require attention`}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Avg Inter-Service Latency
            </p>
            <span className="material-symbols-outlined text-sky-600 dark:text-sky-400 text-[20px]">
              speed
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {avgLatency > 0 ? `${avgLatency} ms` : '< 1 ms'}
          </p>
          <div className="flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400">
            <span className="material-symbols-outlined text-[14px]">
              network_ping
            </span>
            <span>Live HTTP roundtrip response time</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Service Mesh Health
            </p>
            <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-[20px]">
              health_and_safety
            </span>
          </div>
          <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {totalCount > 0 ? `${Math.round((upCount / totalCount) * 100)}%` : '100%'}
          </p>
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-[14px]">
              verified
            </span>
            <span>Spring Cloud Gateway routing</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Logged System Incidents
            </p>
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">
              shield
            </span>
          </div>
          <p
            className={`text-3xl font-extrabold ${
              telemetrySummary.recentErrors > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {telemetrySummary.recentErrors}
          </p>
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="material-symbols-outlined text-[14px]">
              check_circle
            </span>
            <span>
              {telemetrySummary.recentErrors === 0
                ? 'Clean audit stream, 0 faults'
                : `${telemetrySummary.recentErrors} unhandled audit fault(s)`}
            </span>
          </div>
        </div>
      </div>

      {/* Live Microservices Health Matrix */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Live Microservice Telemetry Mesh</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dynamic health status and live response times queried via API Gateway routes.
              </p>
            </div>
            <Badge variant={downCount === 0 ? 'success' : 'warning'}>
              {downCount === 0 ? '100% OPERATIONAL' : `${downCount} DEGRADED`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <th className="py-3.5 px-4">Microservice Name</th>
                <th className="py-3.5 px-4">Port</th>
                <th className="py-3.5 px-4">Functional Role</th>
                <th className="py-3.5 px-4">Health Status</th>
                <th className="py-3.5 px-4">Actuator / Details</th>
                <th className="py-3.5 px-4">Live Ping Latency</th>
                <th className="py-3.5 px-4 text-right">HTTP Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {servicesData.map((svc) => (
                <tr
                  key={svc.id}
                  className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-sans flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        svc.status === 'UP' ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'
                      }`}
                    ></span>
                    {svc.id}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-bold">
                    {svc.port}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-sans">
                    {svc.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        svc.status === 'UP'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[12px]">
                        {svc.status === 'UP' ? 'check' : 'close'}
                      </span>
                      {svc.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[10px] text-slate-500 max-w-[120px] truncate">
                    {svc.actuator ? (
                      <div className="flex flex-col gap-0.5" title={JSON.stringify(svc.actuator, null, 2)}>
                        {svc.actuator.components?.db && <span className="text-emerald-600 dark:text-emerald-400">DB: UP</span>}
                        {svc.actuator.components?.rabbit && <span className="text-emerald-600 dark:text-emerald-400">MQ: UP</span>}
                        {svc.actuator.components?.diskSpace && <span>Disk: UP</span>}
                        {(!svc.actuator.components?.db && !svc.actuator.components?.rabbit) && <span>Actuator UP</span>}
                      </div>
                    ) : (
                      <span className="text-slate-400 opacity-60">Fallback Probe</span>
                    )}
                  </td>
                  <td
                    className={`py-3.5 px-4 font-bold ${
                      svc.status === 'UP'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {svc.latency}
                  </td>
                  <td className="py-3.5 px-4 text-right font-sans">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                      {svc.httpStatus ? `HTTP ${svc.httpStatus}` : 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* System Error & Audit Log Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>System & Security Event Stream</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Immutable audit records captured by audit-storage-service.
                </p>
              </div>
              <Link to="/admin/audit-logs">
                <Button variant="ghost" size="sm" icon="arrow_forward">
                  View Full Logs
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {systemLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-mono">
                No critical error logs detected. System is running cleanly.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {systemLogs.map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className="p-4 flex items-start justify-between gap-4 text-xs font-mono"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {log.action || log.eventType || 'SYSTEM_EVENT'}
                        </span>
                        <span className="text-slate-500 font-sans">
                          {log.userId || log.principal || 'system'}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-sans text-xs">
                        {log.details ||
                          log.description ||
                          log.message ||
                          'Audit trail recorded'}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(
                        log.timestamp || Date.now()
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Administrative Quick Shortcuts */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Administration Controls</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Direct access to system administration modules.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/users" className="block">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">
                    manage_accounts
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      User Management
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Directly create administrators
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">
                  chevron_right
                </span>
              </div>
            </Link>

            <Link to="/admin/invite-staff" className="block">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sky-600 text-[20px]">
                    person_add
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Staff Invitations
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Invite faculty & coordinators
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">
                  chevron_right
                </span>
              </div>
            </Link>

            <Link to="/admin/banners" className="block">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-600 text-[20px]">
                    campaign
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      System Banners
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Broadcast maintenance & alerts
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">
                  chevron_right
                </span>
              </div>
            </Link>

            <Link to="/admin/templates" className="block">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-indigo-600 text-[20px]">
                    mail
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Email & OTP Templates
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Manage notification templates
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">
                  chevron_right
                </span>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
