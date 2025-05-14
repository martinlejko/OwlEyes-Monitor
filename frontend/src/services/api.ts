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

export const updateMonitor = async (id: number, data: Partial<Monitor>): Promise<Monitor> => {
  console.log(`Making PUT request to ${API_URL}/monitors/${id} with data:`, data);
  
  // Prepare the payload to handle the backend's requirements
  // Use Record<string, any> for payload to avoid TypeScript errors with dynamic properties
  const payload: Record<string, any> = { ...data };
  
  // Replace empty strings or undefined values with null for specific fields
  if (payload.type === 'ping') {
    if (!payload.port) payload.port = null;
    // Make sure website fields are null for ping monitors
    payload.url = null;
    payload.checkStatus = false;
    payload.keywords = [];
  } else if (payload.type === 'website') {
    if (!payload.expectedStatusCode) payload.expectedStatusCode = 200; // Default status code
    payload.checkStatus = payload.checkStatus === undefined ? false : Boolean(payload.checkStatus);
    // Make sure ping fields are null for website monitors
    payload.host = null;
    payload.port = null;
  }
  
  console.log('Prepared payload:', payload);
  
  try {
    const response: AxiosResponse<Monitor> = await api.put(`/monitors/${id}`, payload);
    console.log('Response from server:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in updateMonitor:', error);
    throw error;
  }
};

export const deleteMonitor = async (id: number): Promise<void> => {
  console.log(`Making DELETE request to ${API_URL}/monitors/${id}`);
  
  try {
    // Add cache-busting parameter and required cache control headers
    const timestamp = new Date().getTime();
    const config = {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      params: {
        _: timestamp  // Cache-busting query parameter
      }
    };
    
    console.log('Delete request config:', config);
    
    const response = await api.delete(`/monitors/${id}`, config);
    console.log('Delete response status:', response.status);
    
    // If we got a successful response, force refresh the data
    if (response.status === 204) {
      console.log('Delete successful - clearing cache');
      
      // Add a small delay to ensure database operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return;
  } catch (error) {
    console.error('Error in deleteMonitor:', error);
    throw error;
  }
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