import axios from 'axios';
import type { Source, Document, QualityCheck, Duplicate, CourtMetadata, DashboardStats } from '../types';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach authorization tokens & override roles
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const overrideRole = localStorage.getItem('override_role');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (overrideRole && config.headers) {
      config.headers['X-Override-Role'] = overrideRole;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration (401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify({
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
      }));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('override_role');
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const sourceService = {
  getAll: async (search?: string, category?: string, sourceType?: string): Promise<Source[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (sourceType) params.append('source_type', sourceType);
    const response = await api.get(`/sources?${params.toString()}`);
    return response.data;
  },
  create: async (source: Omit<Source, 'id'>): Promise<Source> => {
    const response = await api.post('/sources', source);
    return response.data;
  },
  update: async (id: number, source: Partial<Source>): Promise<Source> => {
    const response = await api.put(`/sources/${id}`, source);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/sources/${id}`);
  },
};

export const documentService = {
  getAll: async (search?: string, category?: string, authority?: string, status?: string): Promise<Document[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (authority) params.append('authority', authority);
    if (status) params.append('status', status);
    const response = await api.get(`/documents?${params.toString()}`);
    return response.data;
  },
  getById: async (id: number): Promise<Document> => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },
  upload: async (formData: FormData): Promise<Document> => {
    const response = await api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  update: async (id: number, data: Partial<Document>): Promise<Document> => {
    const response = await api.put(`/documents/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },
};

export const qualityService = {
  getStatus: async (docId: number): Promise<QualityCheck> => {
    const response = await api.get(`/quality/${docId}`);
    return response.data;
  },
  update: async (docId: number, data: Partial<QualityCheck>): Promise<QualityCheck> => {
    const response = await api.put(`/quality/${docId}`, data);
    return response.data;
  },
};

export const duplicateService = {
  getAll: async (): Promise<Duplicate[]> => {
    const response = await api.get('/duplicates');
    return response.data;
  },
  updateAction: async (id: number, action: 'Keep' | 'Mark Duplicate' | 'Needs Review'): Promise<Duplicate> => {
    const response = await api.put(`/duplicates/${id}`, { action });
    return response.data;
  },
};

export const courtMetadataService = {
  getAll: async (state?: string, court?: string, status?: string): Promise<CourtMetadata[]> => {
    const params = new URLSearchParams();
    if (state) params.append('state', state);
    if (court) params.append('court', court);
    if (status) params.append('status', status);
    const response = await api.get(`/court-metadata?${params.toString()}`);
    return response.data;
  },
  getByDocId: async (docId: number): Promise<CourtMetadata> => {
    const response = await api.get(`/court-metadata/${docId}`);
    return response.data;
  },
  update: async (docId: number, data: Partial<CourtMetadata>): Promise<CourtMetadata> => {
    const response = await api.put(`/court-metadata/${docId}`, data);
    return response.data;
  },
};

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

export const reportService = {
  downloadPdf: async () => {
    const response = await api.get('/reports/pdf', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Legal_Dataset_Audit_Report.pdf');
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  },
  downloadExcel: async () => {
    const response = await api.get('/reports/excel', { responseType: 'blob' });
    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Legal_Dataset_Audit_Report.xlsx');
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  },
};

export const annotationService = {
  getByDocumentId: async (documentId: number): Promise<any[]> => {
    const response = await api.get(`/documents/${documentId}/annotations`);
    return response.data;
  },
  create: async (documentId: number, data: { page_number?: number | null; text: string }): Promise<any> => {
    const response = await api.post(`/documents/${documentId}/annotations`, data);
    return response.data;
  },
  delete: async (documentId: number, annotationId: number): Promise<void> => {
    await api.delete(`/documents/${documentId}/annotations/${annotationId}`);
  },
};

export default api;
