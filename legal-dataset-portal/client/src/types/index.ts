export interface User {
  id: number;
  name: string;
  email: string;
  role: 'researcher' | 'admin' | 'reviewer';
  created_at: string;
}

export interface Source {
  id: number;
  website_name: string;
  authority: string;
  organization?: string;
  category: string;
  source_type: string;
  legal_information_type?: string;
  languages: string[];
  download_available: boolean;
  website_url: string;
  reliability_level: string;
  verification_status: string;
  description?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CourtMetadata {
  id: number;
  document_id: number;
  cnr_number?: string;
  case_number?: string;
  case_type?: string;
  court?: string;
  state?: string;
  district?: string;
  petitioner?: string;
  respondent?: string;
  filing_date?: string;
  registration_date?: string;
  hearing_date?: string;
  disposal_date?: string;
  judgment_order_date?: string;
  judge?: string;
  case_status?: string;
  source?: string;
  source_url?: string;
  language?: string;
  verification_status?: string;
  notes?: string;
}

export interface QualityCheck {
  id: number;
  document_id: number;
  official_source: boolean;
  correct_title: boolean;
  correct_authority: boolean;
  correct_year: boolean;
  correct_language: boolean;
  complete_content: boolean;
  no_missing_pages: boolean;
  readable: boolean;
  pdf_opens_correctly: boolean;
  no_obvious_corruption: boolean;
  not_duplicate: boolean;
  metadata_complete: boolean;
  exact_source_url_recorded: boolean;
  duplicate_checked: boolean;
  version_verified: boolean;
  verification_status: string;
}

export interface Document {
  id: number;
  document_code: string;
  title: string;
  year: number;
  category: string;
  subcategory?: string;
  authority: string;
  ministry_department?: string;
  language: string;
  source_id?: number;
  source_url: string;
  filename: string;
  file_type: string;
  file_size?: number;
  file_hash?: string;
  page_count?: number;
  document_date?: string;
  act_number?: string;
  case_number?: string;
  cnr_number?: string;
  court_name?: string;
  judges?: string;
  download_date?: string;
  version: string;
  status: string;
  quality_status: string;
  duplicate_status: string;
  missing_pages_status: string;
  readability_status: string;
  corruption_status: string;
  notes?: string;
  file_path?: string;
  created_by?: string;
  uploaded_at: string;
  updated_at: string;
  text_content?: string;
  ai_summary?: string;
  snippet?: string;
  quality_check?: QualityCheck;
  court_metadata?: CourtMetadata;
}

export interface Duplicate {
  id: number;
  document_id: number;
  duplicate_document_id: number;
  reason: string;
  action: 'Keep' | 'Mark Duplicate' | 'Needs Review';
  status: 'Pending' | 'Resolved';
  document_title?: string;
  document_code?: string;
  duplicate_document_title?: string;
  duplicate_document_code?: string;
}

export interface DashboardStats {
  total_sources: number;
  total_documents: number;
  verified_documents: number;
  needs_review: number;
  duplicates_count: number;
  category_counts: Record<string, number>;
  status_counts: Record<string, number>;
  upload_trends: Array<{ month: string; count: number }>;
}

export interface AuditLog {
  id: number;
  user_email: string;
  action: string;
  entity: string;
  entity_id?: number;
  timestamp: string;
  previous_value?: string;
  new_value?: string;
}

export interface ReportTelemetry {
  objective: string;
  total_sources: number;
  total_documents: number;
  verified_documents: number;
  pending_documents: number;
  needs_review: number;
  duplicates_count: number;
  incomplete_count: number;
  corrupt_count: number;
  category_counts: Record<string, number>;
  sources: Array<{ name: string; url: string; type: string; reliability: string }>;
  findings: string[];
  recommendations: string[];
}
