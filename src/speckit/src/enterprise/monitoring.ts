import { z } from 'zod';
import * as fs from 'fs-extra';
import * as path from 'path';
import { EventEmitter } from 'events';

// Monitoring interfaces
export interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
  value: number;
  timestamp: string;
  labels: Record<string, string>;
  unit?: string;
}

export interface Alert {
  id: string;
  name: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  condition: AlertCondition;
  actions: AlertAction[];
  enabled: boolean;
  created: string;
  lastTriggered?: string;
  status: 'active' | 'resolved' | 'suppressed';
}

export interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  window: string; // e.g., "5m", "1h"
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
}

export interface AlertAction {
  type: 'email' | 'slack' | 'webhook' | 'pagerduty';
  configuration: Record<string, any>;
  enabled: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  service: string;
  environment: string;
  metadata: Record<string, any>;
  correlationId?: string;
  userId?: string;
  requestId?: string;
}

export interface PerformanceMetrics {
  timestamp: string;
  service: string;
  endpoint?: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpu: number;
  memory: number;
  diskIO: number;
  networkIO: number;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  permissions: string[];
  created: string;
  updated: string;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'table' | 'stat' | 'gauge' | 'heatmap';
  title: string;
  query: MetricQuery;
  visualization: VisualizationConfig;
  position: WidgetPosition;
}

export interface MetricQuery {
  metrics: string[];
  filters: Record<string, string>;
  groupBy: string[];
  aggregation: string;
  timeRange: string;
}

export interface VisualizationConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  colors?: string[];
  thresholds?: number[];
  units?: string;
}

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gridSize: number;
}

export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  type: 'performance' | 'security' | 'compliance' | 'usage' | 'custom';
  schedule: ReportSchedule;
  recipients: string[];
  template: string;
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string; // HH:MM format
  timezone: string;
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
}

export interface GeneratedReport {
  id: string;
  configId: string;
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
  data: ReportData;
  format: 'json' | 'pdf' | 'html' | 'csv';
  size: number;
  path: string;
}

export interface ReportData {
  summary: Record<string, any>;
  metrics: Metric[];
  charts: ChartData[];
  tables: TableData[];
  insights: string[];
  recommendations: string[];
}

export interface ChartData {
  title: string;
  type: string;
  data: Record<string, any>;
}

export interface TableData {
  title: string;
  headers: string[];
  rows: any[][];
}

export class EnterpriseMonitoringManager extends EventEmitter {
  private metricsPath: string;
  private alertsPath: string;
  private logsPath: string;
  private dashboardsPath: string;
  private reportsPath: string;
  private activeAlerts: Map<string, Alert>;
  private metricBuffer: Metric[];
  private logBuffer: LogEntry[];
  private flushInterval: NodeJS.Timeout;

  constructor(basePath: string) {
    super();
    
    this.metricsPath = path.join(basePath, 'monitoring', 'metrics');
    this.alertsPath = path.join(basePath, 'monitoring', 'alerts');
    this.logsPath = path.join(basePath, 'monitoring', 'logs');
    this.dashboardsPath = path.join(basePath, 'monitoring', 'dashboards');
    this.reportsPath = path.join(basePath, 'monitoring', 'reports');
    
    this.activeAlerts = new Map();
    this.metricBuffer = [];
    this.logBuffer = [];

    // Ensure directories exist
    fs.ensureDirSync(this.metricsPath);
    fs.ensureDirSync(this.alertsPath);
    fs.ensureDirSync(this.logsPath);
    fs.ensureDirSync(this.dashboardsPath);
    fs.ensureDirSync(this.reportsPath);

    // Set up periodic flushing
    this.flushInterval = setInterval(() => {
      this.flushBuffers();
    }, 30000); // Flush every 30 seconds
  }

  // Metrics Management
  async recordMetric(metric: Omit<Metric, 'timestamp'>): Promise<void> {
    const fullMetric: Metric = {
      ...metric,
      timestamp: new Date().toISOString()
    };

    this.metricBuffer.push(fullMetric);
    
    // Check alerts
    await this.checkAlerts(fullMetric);
    
    // Emit metric event
    this.emit('metric', fullMetric);
  }

  async recordPerformanceMetrics(metrics: Omit<PerformanceMetrics, 'timestamp'>): Promise<void> {
    const timestamp = new Date().toISOString();
    const performanceMetrics: PerformanceMetrics = {
      ...metrics,
      timestamp
    };

    // Convert to individual metrics
    const individualMetrics: Metric[] = [
      {
        name: 'response_time_ms',
        type: 'histogram',
        value: metrics.responseTime,
        timestamp,
        labels: { service: metrics.service, endpoint: metrics.endpoint || 'unknown' },
        unit: 'ms'
      },
      {
        name: 'throughput_rps',
        type: 'gauge',
        value: metrics.throughput,
        timestamp,
        labels: { service: metrics.service },
        unit: 'rps'
      },
      {
        name: 'error_rate_percent',
        type: 'gauge',
        value: metrics.errorRate,
        timestamp,
        labels: { service: metrics.service },
        unit: '%'
      },
      {
        name: 'cpu_usage_percent',
        type: 'gauge',
        value: metrics.cpu,
        timestamp,
        labels: { service: metrics.service },
        unit: '%'
      },
      {
        name: 'memory_usage_percent',
        type: 'gauge',
        value: metrics.memory,
        timestamp,
        labels: { service: metrics.service },
        unit: '%'
      }
    ];

    for (const metric of individualMetrics) {
      await this.recordMetric(metric);
    }
  }

  async getMetrics(
    metricName?: string, 
    startTime?: string, 
    endTime?: string,
    labels?: Record<string, string>
  ): Promise<Metric[]> {
    const end = endTime || new Date().toISOString();
    const start = startTime || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24h ago
    
    const metrics: Metric[] = [];
    
    // Read from current buffer
    metrics.push(...this.metricBuffer.filter(m => {
      const timeMatch = m.timestamp >= start && m.timestamp <= end;
      const nameMatch = !metricName || m.name === metricName;
      const labelsMatch = !labels || this.matchesLabels(m.labels, labels);
      return timeMatch && nameMatch && labelsMatch;
    }));

    // Read from stored files (simplified - would implement time-based file organization)
    const files = await fs.readdir(this.metricsPath);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const storedMetrics: Metric[] = await fs.readJson(path.join(this.metricsPath, file));
        metrics.push(...storedMetrics.filter(m => {
          const timeMatch = m.timestamp >= start && m.timestamp <= end;
          const nameMatch = !metricName || m.name === metricName;
          const labelsMatch = !labels || this.matchesLabels(m.labels, labels);
          return timeMatch && nameMatch && labelsMatch;
        }));
      }
    }

    return metrics.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  private matchesLabels(metricLabels: Record<string, string>, filterLabels: Record<string, string>): boolean {
    return Object.entries(filterLabels).every(([key, value]) => metricLabels[key] === value);
  }

  // Alerting
  async createAlert(alert: Omit<Alert, 'created' | 'status'>): Promise<Alert> {
    const fullAlert: Alert = {
      ...alert,
      created: new Date().toISOString(),
      status: 'active'
    };

    this.activeAlerts.set(alert.id, fullAlert);
    
    const filePath = path.join(this.alertsPath, `${alert.id}.json`);
    await fs.writeJson(filePath, fullAlert, { spaces: 2 });
    
    return fullAlert;
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | null> {
    const alert = this.activeAlerts.get(id);
    if (!alert) return null;

    const updatedAlert = { ...alert, ...updates };
    this.activeAlerts.set(id, updatedAlert);
    
    const filePath = path.join(this.alertsPath, `${id}.json`);
    await fs.writeJson(filePath, updatedAlert, { spaces: 2 });
    
    return updatedAlert;
  }

  async listAlerts(status?: Alert['status']): Promise<Alert[]> {
    const alerts = Array.from(this.activeAlerts.values());
    return status ? alerts.filter(a => a.status === status) : alerts;
  }

  private async checkAlerts(metric: Metric): Promise<void> {
    for (const alert of this.activeAlerts.values()) {
      if (!alert.enabled || alert.condition.metric !== metric.name) continue;
      
      const triggered = this.evaluateAlertCondition(alert.condition, metric);
      
      if (triggered && alert.status !== 'active') {
        alert.status = 'active';
        alert.lastTriggered = new Date().toISOString();
        await this.triggerAlert(alert, metric);
      } else if (!triggered && alert.status === 'active') {
        alert.status = 'resolved';
        await this.resolveAlert(alert);
      }
    }
  }

  private evaluateAlertCondition(condition: AlertCondition, metric: Metric): boolean {
    const { operator, threshold } = condition;
    
    switch (operator) {
      case '>': return metric.value > threshold;
      case '<': return metric.value < threshold;
      case '>=': return metric.value >= threshold;
      case '<=': return metric.value <= threshold;
      case '==': return metric.value === threshold;
      case '!=': return metric.value !== threshold;
      default: return false;
    }
  }

  private async triggerAlert(alert: Alert, metric: Metric): Promise<void> {
    this.emit('alert', { alert, metric });
    
    // Execute alert actions
    for (const action of alert.actions) {
      if (action.enabled) {
        await this.executeAlertAction(action, alert, metric);
      }
    }
  }

  private async resolveAlert(alert: Alert): Promise<void> {
    this.emit('alertResolved', alert);
  }

  private async executeAlertAction(action: AlertAction, alert: Alert, metric: Metric): Promise<void> {
    // Simplified alert action execution
    switch (action.type) {
      case 'email':
        console.log(`Email alert: ${alert.name} - ${metric.value}`);
        break;
      case 'slack':
        console.log(`Slack alert: ${alert.name} - ${metric.value}`);
        break;
      case 'webhook':
        console.log(`Webhook alert: ${alert.name} - ${metric.value}`);
        break;
    }
  }

  // Logging
  async log(entry: Omit<LogEntry, 'timestamp'>): Promise<void> {
    const fullEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    this.logBuffer.push(fullEntry);
    this.emit('log', fullEntry);
  }

  async getLogs(
    level?: LogEntry['level'],
    service?: string,
    startTime?: string,
    endTime?: string
  ): Promise<LogEntry[]> {
    const end = endTime || new Date().toISOString();
    const start = startTime || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const logs: LogEntry[] = [];
    
    // Read from buffer
    logs.push(...this.logBuffer.filter(l => {
      const timeMatch = l.timestamp >= start && l.timestamp <= end;
      const levelMatch = !level || l.level === level;
      const serviceMatch = !service || l.service === service;
      return timeMatch && levelMatch && serviceMatch;
    }));

    // Read from stored files
    const date = new Date(start).toISOString().split('T')[0];
    const logFile = path.join(this.logsPath, `${date}.json`);
    
    if (await fs.pathExists(logFile)) {
      const storedLogs: LogEntry[] = await fs.readJson(logFile);
      logs.push(...storedLogs.filter(l => {
        const timeMatch = l.timestamp >= start && l.timestamp <= end;
        const levelMatch = !level || l.level === level;
        const serviceMatch = !service || l.service === service;
        return timeMatch && levelMatch && serviceMatch;
      }));
    }

    return logs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  // Dashboard Management
  async createDashboard(dashboard: Omit<Dashboard, 'created' | 'updated'>): Promise<Dashboard> {
    const timestamp = new Date().toISOString();
    const fullDashboard: Dashboard = {
      ...dashboard,
      created: timestamp,
      updated: timestamp
    };

    const filePath = path.join(this.dashboardsPath, `${dashboard.id}.json`);
    await fs.writeJson(filePath, fullDashboard, { spaces: 2 });
    
    return fullDashboard;
  }

  async getDashboard(id: string): Promise<Dashboard | null> {
    const filePath = path.join(this.dashboardsPath, `${id}.json`);
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    return null;
  }

  async listDashboards(): Promise<Dashboard[]> {
    const files = await fs.readdir(this.dashboardsPath);
    const dashboards: Dashboard[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const dashboard = await fs.readJson(path.join(this.dashboardsPath, file));
        dashboards.push(dashboard);
      }
    }
    
    return dashboards;
  }

  // Reporting
  async createReportConfig(config: ReportConfig): Promise<void> {
    const filePath = path.join(this.reportsPath, 'configs', `${config.id}.json`);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, config, { spaces: 2 });
  }

  async generateReport(configId: string, period?: { start: string; end: string }): Promise<GeneratedReport> {
    const config = await this.getReportConfig(configId);
    if (!config) {
      throw new Error(`Report config ${configId} not found`);
    }

    const reportPeriod = period || this.calculateReportPeriod(config.schedule);
    const reportId = `report-${Date.now()}`;
    
    const data = await this.collectReportData(config, reportPeriod);
    
    const report: GeneratedReport = {
      id: reportId,
      configId,
      generatedAt: new Date().toISOString(),
      period: reportPeriod,
      data,
      format: 'json',
      size: JSON.stringify(data).length,
      path: `/reports/${reportId}.json`
    };

    const filePath = path.join(this.reportsPath, 'generated', `${reportId}.json`);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, report, { spaces: 2 });
    
    return report;
  }

  private async getReportConfig(id: string): Promise<ReportConfig | null> {
    const filePath = path.join(this.reportsPath, 'configs', `${id}.json`);
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    return null;
  }

  private calculateReportPeriod(schedule: ReportSchedule): { start: string; end: string } {
    const now = new Date();
    let start: Date;
    
    switch (schedule.frequency) {
      case 'daily':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarterly':
        start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      default:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    return {
      start: start.toISOString(),
      end: now.toISOString()
    };
  }

  private async collectReportData(config: ReportConfig, period: { start: string; end: string }): Promise<ReportData> {
    // Simplified report data collection
    const metrics = await this.getMetrics(undefined, period.start, period.end);
    const logs = await this.getLogs(undefined, undefined, period.start, period.end);
    
    const summary = {
      totalMetrics: metrics.length,
      totalLogs: logs.length,
      errorCount: logs.filter(l => l.level === 'error').length,
      period
    };

    const charts: ChartData[] = [
      {
        title: 'Metrics Over Time',
        type: 'line',
        data: metrics.reduce((acc, m) => {
          acc[m.name] = (acc[m.name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    ];

    const tables: TableData[] = [
      {
        title: 'Top Metrics',
        headers: ['Metric', 'Count'],
        rows: Object.entries(charts[0].data).slice(0, 10)
      }
    ];

    return {
      summary,
      metrics: metrics.slice(0, 100), // Limit for size
      charts,
      tables,
      insights: ['System performance is stable', 'No critical alerts triggered'],
      recommendations: ['Consider optimizing high-frequency metrics', 'Review log retention policies']
    };
  }

  // Buffer management
  private async flushBuffers(): Promise<void> {
    if (this.metricBuffer.length > 0) {
      await this.flushMetrics();
    }
    
    if (this.logBuffer.length > 0) {
      await this.flushLogs();
    }
  }

  private async flushMetrics(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(this.metricsPath, `metrics-${timestamp}.json`);
    
    await fs.writeJson(filePath, this.metricBuffer, { spaces: 2 });
    this.metricBuffer = [];
  }

  private async flushLogs(): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(this.logsPath, `${date}.json`);
    
    let existingLogs: LogEntry[] = [];
    if (await fs.pathExists(filePath)) {
      existingLogs = await fs.readJson(filePath);
    }
    
    const allLogs = [...existingLogs, ...this.logBuffer];
    await fs.writeJson(filePath, allLogs, { spaces: 2 });
    this.logBuffer = [];
  }

  // Cleanup
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.removeAllListeners();
  }
}