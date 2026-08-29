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
  research_stats?: {
    datasets_discovered: number;
    datasets_shortlisted: number;
    platforms_investigated: number;
    provenance_verified: number;
    license_verified: number;
    license_unclear: number;
    requires_review: number;
    high_priority_gaps: number;
    by_platform: Record<string, number>;
    by_category: Record<string, number>;
    by_provenance: Record<string, number>;
    by_license: Record<string, number>;
    by_freshness: Record<string, number>;
    by_availability: Record<string, number>;
    gap_priorities: Record<string, number>;
  };
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
  evidence_source?: string;
  notes?: string;
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

export interface DatasetEvidence {
  id: number;
  dataset_id: number;
  source_type: string;
  source_title: string;
  source_url?: string;
  source_description?: string;
  evidence_text?: string;
  evidence_date?: string;
  verified: boolean;
  reviewer?: string;
  verified_at?: string;
  notes?: string;
}

export interface Dataset {
  id: number;
  dataset_name: string;
  short_name: string;
  description: string;
  platform: string;
  dataset_url: string;
  creator?: string;
  organization?: string;
  publication_date?: string;
  last_updated_date?: string;
  category: string;
  subcategory?: string;
  legal_domain?: string;
  dataset_type?: string;
  record_count?: number;
  record_count_source?: string;
  time_period_start?: string;
  time_period_end?: string;
  coverage_description?: string;
  courts?: string;
  jurisdictions?: string;
  states?: string;
  languages?: string;
  format?: string;
  file_types?: string;
  data_structure?: string;
  text_available: boolean;
  metadata_available: boolean;
  metadata_fields?: string;
  original_documents_available: boolean;
  original_pdf_available: boolean;
  ocr_available: boolean;
  structured_data_available: boolean;
  original_source?: string;
  original_source_url?: string;
  collection_method?: string;
  collection_description?: string;
  collection_date?: string;
  provenance_status: string;
  provenance_evidence?: string;
  provenance_notes?: string;
  license_name?: string;
  license_url?: string;
  license_status: string;
  commercial_use: boolean;
  redistribution_allowed: boolean;
  attribution_required: boolean;
  derivative_use: boolean;
  usage_restrictions?: string;
  license_notes?: string;
  freshness_status: string;
  documentation_quality?: string;
  metadata_quality?: string;
  completeness_assessment?: string;
  data_quality_assessment?: string;
  known_duplicates?: string;
  known_errors?: string;
  limitations?: string;
  reuse_classification: string;
  reuse_reason?: string;
  research_relevance_score: number;
  recommendation?: string;
  why_selected?: string;
  research_notes?: string;
  verification_notes?: string;
  reviewer?: string;
  verified_at?: string;
  shortlisted: boolean;
  shortlist_reason?: string;
  shortlist_rank?: number;
  status: string;
  created_at: string;
  updated_at: string;
  evidence?: DatasetEvidence[];
}

export interface GapAnalysis {
  id: number;
  category: string;
  availability: string;
  quality?: string;
  coverage?: string;
  current_state?: string;
  gap?: string;
  evidence?: string;
  priority: string;
  recommendation?: string;
  created_at: string;
  updated_at: string;
}

export interface ResearchSearchLog {
  id: number;
  platform: string;
  search_query: string;
  search_date: string;
  researcher?: string;
  results_found: number;
  relevant_results: number;
  notes?: string;
}

export interface ResearchMethodology {
  id: number;
  platform_searched?: string;
  search_date?: string;
  search_terms?: string;
  categories_investigated?: string;
  selection_criteria?: string;
  exclusion_criteria?: string;
  verification_process?: string;
}
