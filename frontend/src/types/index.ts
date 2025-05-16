// Project type
export interface Project {
  id: number;
  label: string;
  description: string;
  tags: string[];
}

// Common monitor fields
export interface BaseMonitor {
  id: number;
  projectId: number;
  label: string;
  periodicity: number;
  type: 'ping' | 'website';
  badgeLabel: string;
  latestStatus?: MonitorStatus;
}

// Ping monitor specific fields
export interface PingMonitor extends BaseMonitor {
  type: 'ping';
  host: string;
  port: number;
}

// Website monitor specific fields
export interface WebsiteMonitor extends BaseMonitor {
  type: 'website';
  url: string;
  checkStatus: boolean;
  keywords: string[];
}

// Union type for all monitor types
export type Monitor = PingMonitor | WebsiteMonitor;

// Monitor status
export interface MonitorStatus {
  id: number;
  monitorId: number;
  startTime: string;
  status: boolean;
  responseTime: number;
}

// Calendar data point
export interface CalendarDataPoint {
  date: string;
  total: number;
  failed: number;
  status: 'success' | 'warning' | 'danger';
}

// Graph data point
export interface GraphDataPoint {
  time: string;
  responseTime: number;
}

// Pagination metadata
export interface PaginationMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

// API response with pagination
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Error response
export interface ErrorResponse {
  error: string;
}
