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
