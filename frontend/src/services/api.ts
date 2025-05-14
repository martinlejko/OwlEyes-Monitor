import axios, { AxiosResponse } from 'axios';
import { 
  Project, 
  Monitor, 
  MonitorStatus, 
  PaginatedResponse, 
  CalendarDataPoint, 
  GraphDataPoint 
} from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Project API functions
export const getProjects = async (
  page: number = 1, 
  limit: number = 10, 
  label?: string, 
  tags?: string[],
  sortBy?: string,
  sortOrder?: 'ASC' | 'DESC'
): Promise<PaginatedResponse<Project>> => {
  const params: Record<string, any> = { page, limit };
  
  if (label) params.label = label;
  if (tags && tags.length > 0) params.tags = tags.join(',');
  if (sortBy) params.sortBy = sortBy;
  if (sortOrder) params.sortOrder = sortOrder;
  
  const response: AxiosResponse<PaginatedResponse<Project>> = await api.get('/projects', { params });
  return response.data;
};

export const getProject = async (id: number): Promise<Project> => {
  const response: AxiosResponse<Project> = await api.get(`/projects/${id}`);
  return response.data;
};

export const createProject = async (project: Omit<Project, 'id'>): Promise<Project> => {
  const response: AxiosResponse<Project> = await api.post('/projects', project);
  return response.data;
};

export const updateProject = async (id: number, project: Partial<Project>): Promise<Project> => {
  const response: AxiosResponse<Project> = await api.put(`/projects/${id}`, project);
  return response.data;
};

export const deleteProject = async (id: number): Promise<void> => {
  await api.delete(`/projects/${id}`);
};

// Monitor API functions
export const getMonitors = async (
  page: number = 1, 
  limit: number = 10, 
  projectId?: number,
  label?: string,
  type?: 'ping' | 'website',
  status?: boolean
): Promise<PaginatedResponse<Monitor>> => {
  const params: Record<string, any> = { page, limit };
  
  if (projectId) params.projectId = projectId;
  if (label) params.label = label;
  if (type) params.type = type;
  if (status !== undefined) params.status = status;
  
  const response: AxiosResponse<PaginatedResponse<Monitor>> = await api.get('/monitors', { params });
  return response.data;
};

export const getMonitor = async (id: number): Promise<Monitor> => {
  const response: AxiosResponse<Monitor> = await api.get(`/monitors/${id}`);
  return response.data;
};

export const createMonitor = async (monitor: Omit<Monitor, 'id'>): Promise<Monitor> => {
  const response: AxiosResponse<Monitor> = await api.post('/monitors', monitor);
  return response.data;
};

export const updateMonitor = async (id: number, monitor: Partial<Monitor>): Promise<Monitor> => {
  const response: AxiosResponse<Monitor> = await api.put(`/monitors/${id}`, monitor);
  return response.data;
};

export const deleteMonitor = async (id: number): Promise<void> => {
  await api.delete(`/monitors/${id}`);
};

// Monitor Status API functions
export const getMonitorStatuses = async (
  monitorId: number,
  page: number = 1,
  limit: number = 10,
  from?: Date,
  to?: Date,
  status?: boolean,
  view?: 'list' | 'calendar' | 'graph'
): Promise<PaginatedResponse<MonitorStatus> | { data: CalendarDataPoint[] } | { data: GraphDataPoint[] }> => {
  const params: Record<string, any> = { page, limit, view: view || 'list' };
  
  if (from) params.from = from.toISOString();
  if (to) params.to = to.toISOString();
  if (status !== undefined) params.status = status;
  
  const response = await api.get(`/monitors/${monitorId}/status`, { params });
  return response.data;
};

// Badge URL helper
export const getBadgeUrl = (monitorId: number): string => {
  const baseUrl = API_URL.replace('/api', '');
  return `${baseUrl}/badge/${monitorId}`;
};

export default api; 