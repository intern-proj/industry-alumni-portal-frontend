import api from '../lib/api';

export const serviceRegistry = [
  { id: 'auth-service', name: 'Auth & Identity (2FA / JWT)', port: 8081, probePath: '/telemetry/auth/health' },
  { id: 'user-service', name: 'User Profile & Academic Config', port: 8082, probePath: '/telemetry/user/health' },
  { id: 'vacancy-service', name: 'Placement & Vacancies', port: 8083, probePath: '/telemetry/vacancy/health' },
  { id: 'application-service', name: 'Candidate Application Pipeline', port: 8084, probePath: '/telemetry/application/health' },
  { id: 'event-management-service', name: 'Events, Venues & Speakers', port: 8085, probePath: '/telemetry/event-management/health' },
  { id: 'event-participation-service', name: 'Event Registration & Attendance', port: 8090, probePath: '/telemetry/event-participation/health' },
  { id: 'certificate-service', name: 'Digital Badges & Certificate Registry', port: 8087, probePath: '/telemetry/certificate/health' },
  { id: 'platform-management-service', name: 'Institutional Approvals & Verifications', port: 8086, probePath: '/telemetry/platform-management/health' },
  { id: 'audit-storage-service', name: 'Immutable Audit & Security Storage', port: 8089, probePath: '/telemetry/audit-storage/health' },
  { id: 'notification-service', name: 'Template & Notification Engine', port: 8088, probePath: '/telemetry/notification/health' },
  { id: 'ai-service', name: 'AI Resume Parsing & Matching', port: 8091, probePath: '/telemetry/ai/health' },
];

export const metricsService = {
  // Probe single microservice health & latency via API Gateway
  async probeService(service) {
    const start = performance.now();
    try {
      // Query the API Gateway which now routes to the microservice's actuator endpoint
      const res = await api.get(service.probePath, { timeout: 4000 });
      const actuatorHealth = res.data;
      
      const elapsed = Math.max(1, Math.round(performance.now() - start));
      
      return {
        id: service.id,
        name: service.name,
        port: service.port,
        status: actuatorHealth?.status || 'UP',
        latency: `${elapsed}ms`,
        latencyMs: elapsed,
        httpStatus: res.status,
        actuator: actuatorHealth,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      const elapsed = Math.max(1, Math.round(performance.now() - start));
      const status = err.response?.status;
      
      // Actuator might return 503 if a dependency (like DB) is down,
      // but it still returns a valid JSON payload with details.
      const actuatorHealth = err.response?.data;
      
      if (status && status < 500 && status !== 404) {
        return {
          id: service.id,
          name: service.name,
          port: service.port,
          status: actuatorHealth?.status || 'UP',
          latency: `${elapsed}ms`,
          latencyMs: elapsed,
          httpStatus: status,
          actuator: actuatorHealth || null,
          timestamp: new Date().toISOString(),
        };
      }
      
      return {
        id: service.id,
        name: service.name,
        port: service.port,
        status: actuatorHealth?.status || 'DOWN',
        latency: `${elapsed}ms`,
        latencyMs: elapsed,
        httpStatus: status || 503,
        error: err.message || 'Service unreachable',
        actuator: actuatorHealth || null,
        timestamp: new Date().toISOString(),
      };
    }
  },

  // Probe all services in parallel
  async fetchAllServicesHealth() {
    const results = await Promise.allSettled(
      serviceRegistry.map((svc) => this.probeService(svc))
    );
    return results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : {
            id: serviceRegistry[i].id,
            name: serviceRegistry[i].name,
            port: serviceRegistry[i].port,
            status: 'DOWN',
            latency: 'timeout',
            latencyMs: 4000,
            httpStatus: 504,
            actuator: null,
            timestamp: new Date().toISOString(),
          }
    );
  },

  // Fetch real aggregated telemetry
  async fetchSystemTelemetry() {
    const services = await this.fetchAllServicesHealth();
    const upCount = services.filter((s) => s.status === 'UP').length;
    const downCount = services.length - upCount;
    const avgLatency =
      services.length > 0
        ? Math.round(
            services.reduce((acc, s) => acc + (s.latencyMs || 0), 0) /
              services.length
          )
        : 0;

    // Fetch real audit logs to count recent error events
    let recentErrors = 0;
    try {
      const auditRes = await api.get('/audit/logs', {
        params: { size: 50, sort: 'timestamp,desc' },
        timeout: 3500,
      });
      const logs = auditRes.data?.content || auditRes.data || [];
      if (Array.isArray(logs)) {
        recentErrors = logs.filter(
          (l) => l.action?.includes('FAIL') || l.action?.includes('ERROR') || l.status === 'FAILURE'
        ).length;
      }
    } catch {
      recentErrors = 0;
    }

    return {
      status: downCount === 0 ? 'UP' : 'DEGRADED',
      totalServices: services.length,
      upServices: upCount,
      downServices: downCount,
      avgLatencyMs: avgLatency,
      recentErrors,
      services,
      timestamp: new Date().toISOString(),
    };
  },
};
