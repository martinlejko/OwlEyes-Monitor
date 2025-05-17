export interface Project {
  id: number;
  label: string;
  description: string;
  tags: string[];
}

export interface BaseMonitor {
  id: number;
  projectId: number;
  label: string;
  periodicity: number;
  type: 'ping' | 'website';
  badgeLabel: string;
  latestStatus?: MonitorStatus;
}

export interface PingMonitor extends BaseMonitor {
  type: 'ping';
  host: string;
  port: number;
}

export interface WebsiteMonitor extends BaseMonitor {
  type: 'website';
  url: string;
  checkStatus: boolean;
  keywords: string[];
}

export type Monitor = PingMonitor | WebsiteMonitor;

export interface MonitorStatus {
  id: number;
  monitorId: number;
  startTime: string;
  status: boolean;
  responseTime: number;
}

export interface CalendarDataPoint {
  date: string;
  total: number;
  failed: number;
  status: 'success' | 'warning' | 'danger';
}

export interface GraphDataPoint {
  time: string;
  responseTime: number;
}

export interface PaginationMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ErrorResponse {
  error: string;
}
