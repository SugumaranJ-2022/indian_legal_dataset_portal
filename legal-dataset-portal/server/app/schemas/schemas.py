from pydantic import BaseModel, EmailStr, HttpUrl, Field
from typing import Optional, List
from datetime import datetime, date

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str
    email: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Source Schemas
class SourceBase(BaseModel):
    website_name: str
    authority: str
    organization: Optional[str] = None
    category: str  # Acts, Rules, Judgments, Court Metadata
    source_type: str  # e.g., Government, Supreme Court, Regulator, Open Dataset
    legal_information_type: Optional[str] = None
    languages: List[str]  # e.g., ["English", "Hindi"]
    download_available: bool
    website_url: str
    reliability_level: str = "Needs Review"  # Authoritative, Recognized, Secondary, Needs Review
    verification_status: str = "Pending"  # Pending, Verified, Needs Review, Rejected
    description: Optional[str] = None
    notes: Optional[str] = None

class SourceCreate(SourceBase):
    pass

class SourceUpdate(BaseModel):
    website_name: Optional[str] = None
    authority: Optional[str] = None
    organization: Optional[str] = None
    category: Optional[str] = None
    source_type: Optional[str] = None
    legal_information_type: Optional[str] = None
    languages: Optional[List[str]] = None
    download_available: Optional[bool] = None
    website_url: Optional[str] = None
    reliability_level: Optional[str] = None
    verification_status: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None

class SourceResponse(SourceBase):
    id: int

    class Config:
        from_attributes = True

# Court Metadata Schemas
class CourtMetadataBase(BaseModel):
    cnr_number: Optional[str] = None
    case_number: Optional[str] = None
    case_type: Optional[str] = None
    court: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    petitioner: Optional[str] = None
    respondent: Optional[str] = None
    filing_date: Optional[date] = None
    registration_date: Optional[date] = None
    hearing_date: Optional[date] = None
    disposal_date: Optional[date] = None
    judgment_order_date: Optional[date] = None
    judge: Optional[str] = None
    case_status: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    language: Optional[str] = None
    verification_status: str = "Pending"
    notes: Optional[str] = None

class CourtMetadataCreate(CourtMetadataBase):
    pass

class CourtMetadataResponse(CourtMetadataBase):
    id: int
    document_id: int

    class Config:
        from_attributes = True

# Quality Check Schemas
class QualityCheckBase(BaseModel):
    official_source: bool = False
    correct_title: bool = False
    correct_authority: bool = False
    correct_year: bool = False
    correct_language: bool = False
    complete_content: bool = False
    no_missing_pages: bool = False
    readable: bool = False
    pdf_opens_correctly: bool = False
    no_obvious_corruption: bool = False
    not_duplicate: bool = False
    metadata_complete: bool = False
    exact_source_url_recorded: bool = False
    duplicate_checked: bool = False
    version_verified: bool = False
    verification_status: str = "Needs Review"

class QualityCheckCreate(QualityCheckBase):
    pass

class QualityCheckUpdate(BaseModel):
    official_source: Optional[bool] = None
    correct_title: Optional[bool] = None
    correct_authority: Optional[bool] = None
    correct_year: Optional[bool] = None
    correct_language: Optional[bool] = None
    complete_content: Optional[bool] = None
    no_missing_pages: Optional[bool] = None
    readable: Optional[bool] = None
    pdf_opens_correctly: Optional[bool] = None
    no_obvious_corruption: Optional[bool] = None
    not_duplicate: Optional[bool] = None
    metadata_complete: Optional[bool] = None
    exact_source_url_recorded: Optional[bool] = None
    duplicate_checked: Optional[bool] = None
    version_verified: Optional[bool] = None
    verification_status: Optional[str] = None

class QualityCheckResponse(QualityCheckBase):
    id: int
    document_id: int

    class Config:
        from_attributes = True

# Document Schemas
class DocumentBase(BaseModel):
    document_code: str
    title: str
    year: int
    category: str
    subcategory: Optional[str] = None
    authority: str
    ministry_department: Optional[str] = None
    language: str
    source_id: Optional[int] = None
    source_url: str
    file_type: str = "PDF"
    file_size: Optional[int] = None
    file_hash: Optional[str] = None
    page_count: Optional[int] = None
    document_date: Optional[date] = None
    act_number: Optional[str] = None
    case_number: Optional[str] = None
    cnr_number: Optional[str] = None
    court_name: Optional[str] = None
    judges: Optional[str] = None
    download_date: Optional[date] = None
    version: str = "1.0"
    status: str = "Needs Review"
    quality_status: str = "Pending"
    duplicate_status: str = "Not Duplicate"
    missing_pages_status: str = "No Issues"
    readability_status: str = "Readable"
    corruption_status: str = "Healthy"
    notes: Optional[str] = None
    file_path: Optional[str] = None
    created_by: str = "System"

class DocumentCreate(DocumentBase):
    filename: str

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    year: Optional[int] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    authority: Optional[str] = None
    ministry_department: Optional[str] = None
    language: Optional[str] = None
    source_id: Optional[int] = None
    source_url: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    file_hash: Optional[str] = None
    page_count: Optional[int] = None
    document_date: Optional[date] = None
    act_number: Optional[str] = None
    case_number: Optional[str] = None
    cnr_number: Optional[str] = None
    court_name: Optional[str] = None
    judges: Optional[str] = None
    download_date: Optional[date] = None
    version: Optional[str] = None
    status: Optional[str] = None
    quality_status: Optional[str] = None
    duplicate_status: Optional[str] = None
    missing_pages_status: Optional[str] = None
    readability_status: Optional[str] = None
    corruption_status: Optional[str] = None
    notes: Optional[str] = None
    file_path: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: int
    filename: str
    uploaded_at: datetime
    updated_at: datetime
    text_content: Optional[str] = None
    ai_summary: Optional[str] = None
    snippet: Optional[str] = None
    quality_check: Optional[QualityCheckResponse] = None
    court_metadata: Optional[CourtMetadataResponse] = None

    class Config:
        from_attributes = True

# Duplicate Schemas
class DuplicateBase(BaseModel):
    document_id: int
    duplicate_document_id: int
    reason: str
    action: str = "Needs Review"
    status: str = "Pending"

class DuplicateCreate(DuplicateBase):
    pass

class DuplicateUpdate(BaseModel):
    action: Optional[str] = None
    status: Optional[str] = None

class DuplicateResponse(DuplicateBase):
    id: int
    document_title: Optional[str] = None
    document_code: Optional[str] = None
    duplicate_document_title: Optional[str] = None
    duplicate_document_code: Optional[str] = None

    class Config:
        from_attributes = True

# Dashboard Stats Schema
class DashboardStats(BaseModel):
    total_sources: int
    total_documents: int
    verified_documents: int
    needs_review: int
    duplicates_count: int
    category_counts: dict
    status_counts: dict
    upload_trends: List[dict]
    research_stats: Optional[dict] = None

# Annotation Schemas
class AnnotationBase(BaseModel):
    page_number: Optional[int] = None
    text: str
    author: str = "Researcher"

class AnnotationCreate(AnnotationBase):
    pass

class AnnotationResponse(AnnotationBase):
    id: int
    document_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Audit Log Schemas
class AuditLogBase(BaseModel):
    user_email: str
    action: str
    entity: str
    entity_id: Optional[int] = None
    timestamp: datetime
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    evidence_source: Optional[str] = None
    notes: Optional[str] = None

class AuditLogResponse(AuditLogBase):
    id: int

    class Config:
        from_attributes = True


# Dataset Evidence Schemas
class DatasetEvidenceBase(BaseModel):
    source_type: str
    source_title: str
    source_url: Optional[str] = None
    source_description: Optional[str] = None
    evidence_text: Optional[str] = None
    evidence_date: Optional[date] = None
    verified: bool = False
    reviewer: Optional[str] = None
    verified_at: Optional[datetime] = None
    notes: Optional[str] = None

class DatasetEvidenceCreate(DatasetEvidenceBase):
    pass

class DatasetEvidenceUpdate(BaseModel):
    source_type: Optional[str] = None
    source_title: Optional[str] = None
    source_url: Optional[str] = None
    source_description: Optional[str] = None
    evidence_text: Optional[str] = None
    evidence_date: Optional[date] = None
    verified: Optional[bool] = None
    reviewer: Optional[str] = None
    verified_at: Optional[datetime] = None
    notes: Optional[str] = None

class DatasetEvidenceResponse(DatasetEvidenceBase):
    id: int
    dataset_id: int

    class Config:
        from_attributes = True


# Dataset Schemas
class DatasetBase(BaseModel):
    dataset_name: str
    short_name: str
    description: str
    platform: str
    dataset_url: str
    creator: Optional[str] = None
    organization: Optional[str] = None
    publication_date: Optional[date] = None
    last_updated_date: Optional[date] = None
    category: str
    subcategory: Optional[str] = None
    legal_domain: Optional[str] = None
    dataset_type: Optional[str] = None
    record_count: Optional[int] = None
    record_count_source: Optional[str] = None
    time_period_start: Optional[str] = None
    time_period_end: Optional[str] = None
    coverage_description: Optional[str] = None
    courts: Optional[str] = None
    jurisdictions: Optional[str] = None
    states: Optional[str] = None
    languages: Optional[str] = None
    format: Optional[str] = None
    file_types: Optional[str] = None
    data_structure: Optional[str] = None
    text_available: bool = False
    metadata_available: bool = False
    metadata_fields: Optional[str] = None
    original_documents_available: bool = False
    original_pdf_available: bool = False
    ocr_available: bool = False
    structured_data_available: bool = False
    original_source: Optional[str] = None
    original_source_url: Optional[str] = None
    collection_method: Optional[str] = None
    collection_description: Optional[str] = None
    collection_date: Optional[date] = None
    provenance_status: str = "Not Verified"
    provenance_strength: Optional[str] = "Medium"
    provenance_evidence: Optional[str] = None
    provenance_notes: Optional[str] = None
    license_name: Optional[str] = None
    license_url: Optional[str] = None
    license_status: str = "No License Found"
    source_url_status: Optional[str] = "NOT_CHECKED"
    dataset_url_status: Optional[str] = "NOT_CHECKED"
    license_url_status: Optional[str] = "NOT_CHECKED"
    record_count_note: Optional[str] = None
    commercial_use: bool = False
    redistribution_allowed: bool = False
    attribution_required: bool = False
    derivative_use: bool = False
    usage_restrictions: Optional[str] = None
    license_notes: Optional[str] = None
    freshness_status: str = "Unknown"
    documentation_quality: Optional[str] = None
    metadata_quality: Optional[str] = None
    completeness_assessment: Optional[str] = None
    data_quality_assessment: Optional[str] = None
    known_duplicates: Optional[str] = None
    known_errors: Optional[str] = None
    limitations: Optional[str] = None
    contents: Optional[str] = None
    quality_notes: Optional[str] = None
    reuse_classification: str = "Further Verification Required"
    reuse_recommendation: Optional[str] = "STUDY ONLY"
    reuse_priority: Optional[str] = "MEDIUM"
    reuse_reason: Optional[str] = None
    research_relevance_score: int = 0
    recommendation: Optional[str] = None
    why_selected: Optional[str] = None
    research_notes: Optional[str] = None
    verification_notes: Optional[str] = None
    reviewer: Optional[str] = None
    verified_at: Optional[datetime] = None
    shortlisted: bool = False
    shortlist_reason: Optional[str] = None
    shortlist_rank: Optional[int] = None
    status: str = "Discovered"

class DatasetCreate(DatasetBase):
    pass

class DatasetUpdate(BaseModel):
    dataset_name: Optional[str] = None
    short_name: Optional[str] = None
    description: Optional[str] = None
    platform: Optional[str] = None
    dataset_url: Optional[str] = None
    creator: Optional[str] = None
    organization: Optional[str] = None
    publication_date: Optional[date] = None
    last_updated_date: Optional[date] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    legal_domain: Optional[str] = None
    dataset_type: Optional[str] = None
    record_count: Optional[int] = None
    record_count_source: Optional[str] = None
    record_count_note: Optional[str] = None
    time_period_start: Optional[str] = None
    time_period_end: Optional[str] = None
    coverage_description: Optional[str] = None
    courts: Optional[str] = None
    jurisdictions: Optional[str] = None
    states: Optional[str] = None
    languages: Optional[str] = None
    format: Optional[str] = None
    file_types: Optional[str] = None
    data_structure: Optional[str] = None
    text_available: Optional[bool] = None
    metadata_available: Optional[bool] = None
    metadata_fields: Optional[str] = None
    original_documents_available: Optional[bool] = None
    original_pdf_available: Optional[bool] = None
    ocr_available: Optional[bool] = None
    structured_data_available: Optional[bool] = None
    original_source: Optional[str] = None
    original_source_url: Optional[str] = None
    source_url_status: Optional[str] = None
    dataset_url_status: Optional[str] = None
    license_url_status: Optional[str] = None
    collection_method: Optional[str] = None
    collection_description: Optional[str] = None
    collection_date: Optional[date] = None
    provenance_status: Optional[str] = None
    provenance_strength: Optional[str] = None
    provenance_evidence: Optional[str] = None
    provenance_notes: Optional[str] = None
    license_name: Optional[str] = None
    license_url: Optional[str] = None
    license_status: Optional[str] = None
    commercial_use: Optional[bool] = None
    redistribution_allowed: Optional[bool] = None
    attribution_required: Optional[bool] = None
    derivative_use: Optional[bool] = None
    usage_restrictions: Optional[str] = None
    license_notes: Optional[str] = None
    freshness_status: Optional[str] = None
    documentation_quality: Optional[str] = None
    metadata_quality: Optional[str] = None
    completeness_assessment: Optional[str] = None
    data_quality_assessment: Optional[str] = None
    known_duplicates: Optional[str] = None
    known_errors: Optional[str] = None
    limitations: Optional[str] = None
    contents: Optional[str] = None
    quality_notes: Optional[str] = None
    reuse_classification: Optional[str] = None
    reuse_recommendation: Optional[str] = None
    reuse_priority: Optional[str] = None
    reuse_reason: Optional[str] = None
    research_relevance_score: Optional[int] = None
    recommendation: Optional[str] = None
    why_selected: Optional[str] = None
    research_notes: Optional[str] = None
    verification_notes: Optional[str] = None
    reviewer: Optional[str] = None
    verified_at: Optional[datetime] = None
    shortlisted: Optional[bool] = None
    shortlist_reason: Optional[str] = None
    shortlist_rank: Optional[int] = None
    status: Optional[str] = None

class DatasetResponse(DatasetBase):
    id: int
    created_at: datetime
    updated_at: datetime
    evidence: List[DatasetEvidenceResponse] = []

    class Config:
        from_attributes = True


# Gap Analysis Schemas
class GapAnalysisBase(BaseModel):
    category: str
    availability: str
    quality: Optional[str] = None
    coverage: Optional[str] = None
    current_state: Optional[str] = None
    gap: Optional[str] = None
    evidence: Optional[str] = None
    priority: str = "Low"
    recommendation: Optional[str] = None

class GapAnalysisCreate(GapAnalysisBase):
    pass

class GapAnalysisUpdate(BaseModel):
    availability: Optional[str] = None
    quality: Optional[str] = None
    coverage: Optional[str] = None
    current_state: Optional[str] = None
    gap: Optional[str] = None
    evidence: Optional[str] = None
    priority: Optional[str] = None
    recommendation: Optional[str] = None

class GapAnalysisResponse(GapAnalysisBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Research Search Log Schemas
class ResearchSearchLogBase(BaseModel):
    platform: str
    search_query: str
    search_date: date
    researcher: Optional[str] = None
    results_found: int = 0
    relevant_results: int = 0
    notes: Optional[str] = None

class ResearchSearchLogCreate(ResearchSearchLogBase):
    pass

class ResearchSearchLogResponse(ResearchSearchLogBase):
    id: int

    class Config:
        from_attributes = True


# Research Methodology Schemas
class ResearchMethodologyBase(BaseModel):
    platform_searched: Optional[str] = None
    search_date: Optional[date] = None
    search_terms: Optional[str] = None
    categories_investigated: Optional[str] = None
    selection_criteria: Optional[str] = None
    exclusion_criteria: Optional[str] = None
    verification_process: Optional[str] = None

class ResearchMethodologyCreate(ResearchMethodologyBase):
    pass

class ResearchMethodologyResponse(ResearchMethodologyBase):
    id: int

    class Config:
        from_attributes = True
