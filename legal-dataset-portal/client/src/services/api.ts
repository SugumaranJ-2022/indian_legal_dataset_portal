import axios from 'axios';
import type { 
  Source, 
  Document, 
  QualityCheck, 
  Duplicate, 
  CourtMetadata, 
  DashboardStats,
  Dataset,
  DatasetEvidence,
  GapAnalysis,
  ResearchSearchLog,
  ResearchMethodology
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' && window.location.port === '5173'
    ? 'http://localhost:8000/api'
    : '/api'
);

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
  downloadPdf: async (reportType: string = 'audit') => {
    const response = await api.get(`/reports/pdf?report_type=${reportType}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    const filename = reportType === 'landscape' ? 'Indian_Legal_Dataset_Landscape_Report.pdf' : 'Legal_Dataset_Audit_Report.pdf';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  },
  downloadExcel: async (reportType: string = 'audit') => {
    const response = await api.get(`/reports/excel?report_type=${reportType}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    );
    const link = document.createElement('a');
    link.href = url;
    const filename = reportType === 'landscape' ? 'Indian_Legal_Dataset_Landscape_Report.xlsx' : 'Legal_Dataset_Audit_Report.xlsx';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  },
  getTelemetry: async (): Promise<any> => {
    const response = await api.get('/reports/telemetry');
    return response.data;
  },
};

export const datasetService = {
  getAll: async (search?: string, platform?: string, category?: string, shortlisted?: boolean): Promise<Dataset[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (platform) params.append('platform', platform);
    if (category) params.append('category', category);
    if (shortlisted !== undefined) params.append('shortlisted', String(shortlisted));
    const response = await api.get(`/datasets?${params.toString()}`);
    return response.data;
  },
  getById: async (id: number): Promise<Dataset> => {
    const response = await api.get(`/datasets/${id}`);
    return response.data;
  },
  create: async (data: Partial<Dataset>): Promise<Dataset> => {
    const response = await api.post('/datasets', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Dataset>): Promise<Dataset> => {
    const response = await api.put(`/datasets/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/datasets/${id}`);
  },
  
  // Evidence
  getEvidence: async (datasetId: number): Promise<DatasetEvidence[]> => {
    const response = await api.get(`/datasets/${datasetId}/evidence`);
    return response.data;
  },
  createEvidence: async (datasetId: number, data: Partial<DatasetEvidence>): Promise<DatasetEvidence> => {
    const response = await api.post(`/datasets/${datasetId}/evidence`, data);
    return response.data;
  },
  updateEvidence: async (datasetId: number, evidenceId: number, data: Partial<DatasetEvidence>): Promise<DatasetEvidence> => {
    const response = await api.put(`/datasets/${datasetId}/evidence/${evidenceId}`, data);
    return response.data;
  },
  deleteEvidence: async (datasetId: number, evidenceId: number): Promise<void> => {
    await api.delete(`/datasets/${datasetId}/evidence/${evidenceId}`);
  }
};

export const gapService = {
  getAll: async (): Promise<GapAnalysis[]> => {
    const response = await api.get('/gaps');
    return response.data;
  },
  getById: async (id: number): Promise<GapAnalysis> => {
    const response = await api.get(`/gaps/${id}`);
    return response.data;
  },
  create: async (data: Partial<GapAnalysis>): Promise<GapAnalysis> => {
    const response = await api.post('/gaps', data);
    return response.data;
  },
  update: async (id: number, data: Partial<GapAnalysis>): Promise<GapAnalysis> => {
    const response = await api.put(`/gaps/${id}`, data);
    return response.data;
  }
};

export const researchService = {
  getSearchLogs: async (): Promise<ResearchSearchLog[]> => {
    const response = await api.get('/research/search-log');
    return response.data;
  },
  createSearchLog: async (data: Partial<ResearchSearchLog>): Promise<ResearchSearchLog> => {
    const response = await api.post('/research/search-log', data);
    return response.data;
  },
  getMethodology: async (): Promise<ResearchMethodology> => {
    const response = await api.get('/research/methodology');
    return response.data;
  },
  updateMethodology: async (data: Partial<ResearchMethodology>): Promise<ResearchMethodology> => {
    const response = await api.put('/research/methodology', data);
    return response.data;
  }
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

export const auditService = {
  getAll: async (skip = 0, limit = 100): Promise<any[]> => {
    const response = await api.get(`/audit-logs?skip=${skip}&limit=${limit}`);
    return response.data;
  },
};

export const exportService = {
  download: async (type: string, format: string) => {
    const response = await api.get(`/exports/${type}/${format}`, { responseType: 'blob' });
    const contentTypes: Record<string, string> = {
      csv: 'text/csv',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      json: 'application/json'
    };
    const extension = format === 'excel' ? 'xlsx' : format;
    const url = window.URL.createObjectURL(new Blob([response.data], { type: contentTypes[format] }));
    const link = document.createElement('a');
    link.href = url;
    const filename = `${type}_export.${extension}`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  }
};

export default api;
