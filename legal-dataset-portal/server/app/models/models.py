from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="researcher", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    website_name = Column(String, nullable=False)
    authority = Column(String, nullable=False)
    organization = Column(String, nullable=True)  # Added Organization
    category = Column(String, nullable=False)  # Acts, Rules, Judgments, Court Metadata
    source_type = Column(String, nullable=False)  # Government, Supreme Court, etc.
    legal_information_type = Column(String, nullable=True)  # Acts, Statutes, Rules, Regulations
    languages = Column(String, nullable=False)  # e.g. "English,Hindi"
    download_available = Column(Boolean, default=True, nullable=False)
    website_url = Column(String, nullable=False)
    reliability_level = Column(String, default="Needs Review", nullable=False)  # Authoritative, Recognized, etc.
    verification_status = Column(String, default="Pending", nullable=False)  # Pending, Verified, etc.
    description = Column(Text, nullable=True)  # Added description
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    documents = relationship("Document", back_populates="source", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    document_code = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    category = Column(String, nullable=False)
    subcategory = Column(String, nullable=True)
    authority = Column(String, nullable=False)
    ministry_department = Column(String, nullable=True)
    language = Column(String, nullable=False)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=True)
    source_url = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, default="PDF", nullable=False)
    file_size = Column(Integer, nullable=True)
    file_hash = Column(String, nullable=True, index=True)  # SHA-256 hash for duplicate check
    page_count = Column(Integer, nullable=True)
    document_date = Column(Date, nullable=True)
    act_number = Column(String, nullable=True)
    case_number = Column(String, nullable=True)
    cnr_number = Column(String, nullable=True)
    court_name = Column(String, nullable=True)
    judges = Column(String, nullable=True)
    download_date = Column(Date, default=datetime.utcnow, nullable=True)
    version = Column(String, default="1.0", nullable=False)
    status = Column(String, default="Needs Review", nullable=False)  # General verification status
    quality_status = Column(String, default="Pending", nullable=False)
    duplicate_status = Column(String, default="Not Duplicate", nullable=False)
    missing_pages_status = Column(String, default="No Issues", nullable=False)
    readability_status = Column(String, default="Readable", nullable=False)
    corruption_status = Column(String, default="Healthy", nullable=False)
    notes = Column(Text, nullable=True)
    file_path = Column(String, nullable=True)
    created_by = Column(String, default="System", nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    text_content = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)

    # Relationships
    source = relationship("Source", back_populates="documents")
    quality_check = relationship("QualityCheck", uselist=False, back_populates="document", cascade="all, delete-orphan")
    court_metadata = relationship("CourtMetadata", uselist=False, back_populates="document", cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="document", cascade="all, delete-orphan")


class QualityCheck(Base):
    __tablename__ = "quality_checks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    official_source = Column(Boolean, default=False, nullable=False)
    correct_title = Column(Boolean, default=False, nullable=False)
    correct_authority = Column(Boolean, default=False, nullable=False)
    correct_year = Column(Boolean, default=False, nullable=False)
    correct_language = Column(Boolean, default=False, nullable=False)
    complete_content = Column(Boolean, default=False, nullable=False)
    no_missing_pages = Column(Boolean, default=False, nullable=False)
    readable = Column(Boolean, default=False, nullable=False)
    pdf_opens_correctly = Column(Boolean, default=False, nullable=False)
    no_obvious_corruption = Column(Boolean, default=False, nullable=False)
    not_duplicate = Column(Boolean, default=False, nullable=False)
    metadata_complete = Column(Boolean, default=False, nullable=False)
    exact_source_url_recorded = Column(Boolean, default=False, nullable=False)
    duplicate_checked = Column(Boolean, default=False, nullable=False)
    version_verified = Column(Boolean, default=False, nullable=False)
    verification_status = Column(String, default="Needs Review", nullable=False)

    # Relationships
    document = relationship("Document", back_populates="quality_check")


class Duplicate(Base):
    __tablename__ = "duplicates"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    duplicate_document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String, nullable=False)
    action = Column(String, default="Needs Review", nullable=False)  # Keep, Mark Duplicate, Needs Review
    status = Column(String, default="Pending", nullable=False)  # Pending, Resolved

    # Relationships
    document = relationship("Document", foreign_keys=[document_id])
    duplicate_document = relationship("Document", foreign_keys=[duplicate_document_id])


class CourtMetadata(Base):
    __tablename__ = "court_metadata"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    cnr_number = Column(String, nullable=True)
    case_number = Column(String, nullable=True)
    case_type = Column(String, nullable=True)
    court = Column(String, nullable=True)
    state = Column(String, nullable=True)
    district = Column(String, nullable=True)
    petitioner = Column(String, nullable=True)
    respondent = Column(String, nullable=True)
    filing_date = Column(Date, nullable=True)
    registration_date = Column(Date, nullable=True)
    hearing_date = Column(Date, nullable=True)
    disposal_date = Column(Date, nullable=True)
    judgment_order_date = Column(Date, nullable=True)
    judge = Column(String, nullable=True)
    case_status = Column(String, nullable=True)
    source = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    language = Column(String, nullable=True)
    verification_status = Column(String, default="Pending", nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    document = relationship("Document", back_populates="court_metadata")


class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, nullable=True)
    text = Column(Text, nullable=False)
    author = Column(String, default="Researcher", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    document = relationship("Document", back_populates="annotations")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, nullable=False)
    action = Column(String, nullable=False)
    entity = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    previous_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    evidence_source = Column(String, nullable=True)
    notes = Column(Text, nullable=True)


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    dataset_name = Column(String, nullable=False)
    short_name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    platform = Column(String, nullable=False)
    dataset_url = Column(String, nullable=False)
    creator = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    publication_date = Column(Date, nullable=True)
    last_updated_date = Column(Date, nullable=True)
    category = Column(String, nullable=False)
    subcategory = Column(String, nullable=True)
    legal_domain = Column(String, nullable=True)
    dataset_type = Column(String, nullable=True)
    record_count = Column(Integer, nullable=True)
    record_count_source = Column(String, nullable=True)
    time_period_start = Column(String, nullable=True)
    time_period_end = Column(String, nullable=True)
    coverage_description = Column(Text, nullable=True)
    courts = Column(String, nullable=True)
    jurisdictions = Column(String, nullable=True)
    states = Column(String, nullable=True)
    languages = Column(String, nullable=True)
    format = Column(String, nullable=True)
    file_types = Column(String, nullable=True)
    data_structure = Column(String, nullable=True)
    text_available = Column(Boolean, default=False, nullable=False)
    metadata_available = Column(Boolean, default=False, nullable=False)
    metadata_fields = Column(String, nullable=True)
    original_documents_available = Column(Boolean, default=False, nullable=False)
    original_pdf_available = Column(Boolean, default=False, nullable=False)
    ocr_available = Column(Boolean, default=False, nullable=False)
    structured_data_available = Column(Boolean, default=False, nullable=False)
    original_source = Column(String, nullable=True)
    original_source_url = Column(String, nullable=True)
    collection_method = Column(String, nullable=True)
    collection_description = Column(Text, nullable=True)
    collection_date = Column(Date, nullable=True)
    provenance_status = Column(String, default="Not Verified", nullable=False)
    provenance_evidence = Column(Text, nullable=True)
    provenance_notes = Column(Text, nullable=True)
    license_name = Column(String, nullable=True)
    license_url = Column(String, nullable=True)
    license_status = Column(String, default="No License Found", nullable=False)
    commercial_use = Column(Boolean, default=False, nullable=False)
    redistribution_allowed = Column(Boolean, default=False, nullable=False)
    attribution_required = Column(Boolean, default=False, nullable=False)
    derivative_use = Column(Boolean, default=False, nullable=False)
    usage_restrictions = Column(Text, nullable=True)
    license_notes = Column(Text, nullable=True)
    freshness_status = Column(String, default="Unknown", nullable=False)
    documentation_quality = Column(String, nullable=True)
    metadata_quality = Column(String, nullable=True)
    completeness_assessment = Column(Text, nullable=True)
    data_quality_assessment = Column(Text, nullable=True)
    known_duplicates = Column(Text, nullable=True)
    known_errors = Column(Text, nullable=True)
    limitations = Column(Text, nullable=True)
    reuse_classification = Column(String, default="Further Verification Required", nullable=False)
    reuse_reason = Column(Text, nullable=True)
    research_relevance_score = Column(Integer, default=0, nullable=False)
    recommendation = Column(Text, nullable=True)
    why_selected = Column(Text, nullable=True)
    research_notes = Column(Text, nullable=True)
    verification_notes = Column(Text, nullable=True)
    reviewer = Column(String, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    shortlisted = Column(Boolean, default=False, nullable=False)
    shortlist_reason = Column(Text, nullable=True)
    shortlist_rank = Column(Integer, nullable=True)
    status = Column(String, default="Discovered", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    evidence = relationship("DatasetEvidence", back_populates="dataset", cascade="all, delete-orphan")


class DatasetEvidence(Base):
    __tablename__ = "dataset_evidence"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    source_type = Column(String, nullable=False)
    source_title = Column(String, nullable=False)
    source_url = Column(String, nullable=True)
    source_description = Column(Text, nullable=True)
    evidence_text = Column(Text, nullable=True)
    evidence_date = Column(Date, nullable=True)
    verified = Column(Boolean, default=False, nullable=False)
    reviewer = Column(String, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    dataset = relationship("Dataset", back_populates="evidence")


class GapAnalysis(Base):
    __tablename__ = "gap_analysis"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, unique=True, index=True, nullable=False)
    availability = Column(String, nullable=False)
    quality = Column(String, nullable=True)
    coverage = Column(String, nullable=True)
    current_state = Column(String, nullable=True)
    gap = Column(Text, nullable=True)
    evidence = Column(Text, nullable=True)
    priority = Column(String, default="Low", nullable=False)
    recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ResearchSearchLog(Base):
    __tablename__ = "research_search_logs"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String, nullable=False)
    search_query = Column(String, nullable=False)
    search_date = Column(Date, default=datetime.utcnow, nullable=False)
    researcher = Column(String, nullable=True)
    results_found = Column(Integer, default=0, nullable=False)
    relevant_results = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)


class ResearchMethodology(Base):
    __tablename__ = "research_methodology"

    id = Column(Integer, primary_key=True, index=True)
    platform_searched = Column(String, nullable=True)
    search_date = Column(Date, nullable=True)
    search_terms = Column(Text, nullable=True)
    categories_investigated = Column(Text, nullable=True)
    selection_criteria = Column(Text, nullable=True)
    exclusion_criteria = Column(Text, nullable=True)
    verification_process = Column(Text, nullable=True)
