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
  category: 'Acts' | 'Rules' | 'Judgments' | 'Court Metadata';
  source_type: 'Official' | 'Repository';
  languages: string[];
  download_available: boolean;
  website_url: string;
  notes?: string;
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
  hearing_date?: string;
  disposal_date?: string;
  judge?: string;
  case_status?: string;
}

export interface QualityCheck {
  id: number;
  document_id: number;
  official_source: boolean;
  readable: boolean;
  complete_content: boolean;
  metadata_correct: boolean;
  duplicate_checked: boolean;
  version_verified: boolean;
  verification_status: 'Verified' | 'Verified (Content-Level)' | 'Needs Review' | 'Questionable' | 'Duplicate' | 'Incomplete';
}

export interface Document {
  id: number;
  document_code: string;
  title: string;
  year: number;
  category: 'Acts / Statutes' | 'Rules & Regulations' | 'Court Judgments' | 'Court Metadata';
  authority: string;
  language: string;
  source_id?: number;
  source_url: string;
  filename: string;
  version: string;
  status: 'Verified' | 'Verified (Content-Level)' | 'Needs Review' | 'Questionable' | 'Duplicate' | 'Incomplete';
  notes?: string;
  uploaded_at: string;
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
  document_title: string;
  document_code: string;
  duplicate_document_title: string;
  duplicate_document_code: string;
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
