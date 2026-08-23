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
    category = Column(String, nullable=False)  # Acts, Rules, Judgments, Court Metadata
    source_type = Column(String, nullable=False)  # Official / Repository
    languages = Column(String, nullable=False)  # Store as comma-separated values, e.g. "English,Hindi"
    download_available = Column(Boolean, default=True, nullable=False)
    website_url = Column(String, nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    documents = relationship("Document", back_populates="source", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    document_code = Column(String, unique=True, index=True, nullable=False)  # Document ID (e.g. DOC-001)
    title = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    category = Column(String, nullable=False)  # Acts / Statutes, Rules & Regulations, etc.
    authority = Column(String, nullable=False)
    language = Column(String, nullable=False)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=True)
    source_url = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    version = Column(String, default="1.0", nullable=False)
    status = Column(String, default="Needs Review", nullable=False)  # Verified, Needs Review, etc.
    notes = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
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
    readable = Column(Boolean, default=False, nullable=False)
    complete_content = Column(Boolean, default=False, nullable=False)
    metadata_correct = Column(Boolean, default=False, nullable=False)
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
    hearing_date = Column(Date, nullable=True)
    disposal_date = Column(Date, nullable=True)
    judge = Column(String, nullable=True)
    case_status = Column(String, nullable=True)

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

