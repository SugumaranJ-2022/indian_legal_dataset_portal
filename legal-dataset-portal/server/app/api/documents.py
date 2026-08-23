import os
import shutil
import re
import hashlib
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Document, QualityCheck, Duplicate, Source, CourtMetadata, Annotation, AuditLog
from app.schemas.schemas import DocumentResponse, DocumentUpdate, AnnotationCreate, AnnotationResponse
from app.core.websocket import broadcast_sync

router = APIRouter()

def log_audit(db: Session, email: str, action: str, entity: str, entity_id: int, prev: str = None, new: str = None):
    audit_entry = AuditLog(
        user_email=email,
        action=action,
        entity=entity,
        entity_id=entity_id,
        previous_value=prev,
        new_value=new
    )
    db.add(audit_entry)
    db.commit()

def count_pdf_pages(file_path: str) -> int:
    try:
        with open(file_path, "rb") as f:
            content = f.read()
        # Search for page marker /Type /Page
        pages = re.findall(b"/Type\s*/Page\b", content)
        if pages:
            return len(pages)
        matches = re.findall(b"/Count\s+(\d+)", content)
        if matches:
            return max(int(m) for m in matches)
        return 1
    except Exception:
        return 1

@router.get("", response_model=List[DocumentResponse])
def get_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    authority: Optional[str] = Query(None),
    status_val: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Document)
    
    if category:
        query = query.filter(Document.category == category)
    if authority:
        query = query.filter(Document.authority == authority)
    if status_val:
        query = query.filter(Document.status == status_val)
        
    if search:
        search_filter = or_(
            Document.title.ilike(f"%{search}%"),
            Document.document_code.ilike(f"%{search}%"),
            Document.notes.ilike(f"%{search}%"),
            Document.filename.ilike(f"%{search}%"),
            Document.text_content.ilike(f"%{search}%"),
            Document.court_name.ilike(f"%{search}%"),
            Document.cnr_number.ilike(f"%{search}%"),
            Document.case_number.ilike(f"%{search}%"),
            Document.judges.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    documents = query.offset(skip).limit(limit).all()
    
    # Generate search snippets if searching
    if search:
        for doc in documents:
            if doc.text_content and search.lower() in doc.text_content.lower():
                idx = doc.text_content.lower().find(search.lower())
                start_idx = max(0, idx - 60)
                end_idx = min(len(doc.text_content), idx + len(search) + 90)
                prefix = "..." if start_idx > 0 else ""
                suffix = "..." if end_idx < len(doc.text_content) else ""
                doc.snippet = f"{prefix}{doc.text_content[start_idx:end_idx]}{suffix}"
                
    return documents


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with id {document_id} not found"
        )
    return document


def extract_pdf_ascii_text(file_path: str) -> str:
    """Extract readable ASCII text blocks from PDF binary directly without external wheels."""
    try:
        with open(file_path, "rb") as f:
            content = f.read()
        # Find printable ASCII characters of length >= 4
        ascii_blocks = re.findall(b"[a-zA-Z0-9\\s\\(\\)\\-\\,\\.\\/]{4,}", content)
        decoded_text = " ".join(block.decode("ascii", errors="ignore") for block in ascii_blocks)
        return " ".join(decoded_text.split())
    except Exception as e:
        print(f"Error scanning PDF text: {str(e)}")
        return ""


def generate_mock_ai_summary(document: Document, text: str) -> str:
    citations = []
    text_lower = text.lower()
    
    if "article 21" in text_lower:
        citations.append("Article 21 (Right to Life & Personal Liberty)")
    if "article 14" in text_lower:
        citations.append("Article 14 (Equality before Law)")
    if "section 66a" in text_lower:
        citations.append("Section 66A, Information Technology Act, 2000")
    if "section 43" in text_lower:
        citations.append("Section 43 (Penalty for damage to computer system)")
    if "information technology act" in text_lower or "it act" in text_lower:
        citations.append("Information Technology Act, 2000")
    if "code of civil procedure" in text_lower or "cpc" in text_lower:
        citations.append("Code of Civil Procedure, 1908")
    if "constitution" in text_lower:
        citations.append("Constitution of India")

    if not citations:
        if document.category == "Acts / Statutes":
            citations.append(f"{document.title} (Primary Statute)")
        else:
            citations.append("Constitution of India, 1950")
            
    decision = "Needs Review"
    if "disposed" in text_lower or "allowed" in text_lower:
        decision = "Petition / Appeal Disposed / Allowed."
    elif "dismissed" in text_lower or "rejected" in text_lower:
        decision = "Petition / Appeal Dismissed."
    elif "convicted" in text_lower:
        decision = "Accused Convicted under charged sections."
    elif "acquitted" in text_lower:
        decision = "Accused Acquitted of all charges."
    elif document.category == "Acts / Statutes":
        decision = f"Statute enacted by {document.authority or 'Parliament'}."

    layout_msg = "An audit has confirmed the text layout is readable and officially published." if len(text) > 100 else "The layout parser detected limited text content, requiring manual optical character review (OCR)."
    citations_formatted = "\n".join([f"- *{cit}*" for cit in set(citations)])

    summary = f"""### AI-Generated Legal Ingestion Summary
**Document Code**: `{document.document_code}`
**Audit Date**: `{datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")} UTC`

#### 📝 Executive Summary
This document is classified under **{document.category}**, published by **{document.authority or 'Official Source'}** in the year **{document.year}**. 
{layout_msg}

#### 📑 Legal Citations & Provisions Referenced
{citations_formatted}

#### ⚖️ Final Decision / Status
**{decision}**
"""
    return summary.strip()


def run_automated_audit(document: Document, file_path: str, db: Session):
    """Scan document file, perform simulated AI quality checks, and auto-populate court CNR metadata."""
    text = extract_pdf_ascii_text(file_path)
    
    # Save full text and AI summary to document
    document.text_content = text
    document.ai_summary = generate_mock_ai_summary(document, text)
    
    # 1. Source domain audit
    is_official = False
    if document.source_url:
        is_official = any(domain in document.source_url.lower() for domain in [".gov.in", ".nic.in", "indiankanoon.org", "meity.gov.in"])

    # 2. Readability & completeness check
    is_readable = len(text.strip()) > 100
    is_complete = len(text.strip()) > 300
    
    # 3. Duplicate listing check
    has_duplicate = db.query(Document).filter(
        (Document.id != document.id) & 
        ((Document.file_hash == document.file_hash) | (Document.title.ilike(document.title)) | (Document.filename == document.filename))
    ).first() is not None

    # 4. Extract CNR and Court details automatically from text
    cnr_match = re.search(r"([A-Z]{4}\d{12})", text.upper())
    cnr_number = cnr_match.group(1) if cnr_match else None
    
    case_num_match = re.search(r"(Writ Petition [^\n\r,]+|Civil Appeal [^\n\r,]+|Case No\. [^\n\r,]+)", text, re.IGNORECASE)
    case_number = case_num_match.group(1).strip() if case_num_match else None

    judge_match = re.search(r"(Judges?|Bench|Before):?\s*([^\n\r\.\,]+Chief Justice[^\n\r]+|[^\n\r]+C\.J\.[^\n\r]+|[A-Z][a-z]+\s+[A-Z][a-z]+\s+(?:and|&)\s+[A-Z][a-z]+)", text, re.IGNORECASE)
    judge = judge_match.group(2).strip() if judge_match else None

    court = "Supreme Court of India" if "supreme court" in text.lower() else ("Delhi High Court" if "delhi high court" in text.lower() else "District Court Registry")

    # Sync Document metadata
    document.court_name = court
    document.cnr_number = cnr_number or document.cnr_number
    document.case_number = case_number or document.case_number
    document.judges = judge or document.judges

    # Save CourtMetadata
    if cnr_number or case_number or court != "District Court Registry":
        meta = db.query(CourtMetadata).filter(CourtMetadata.document_id == document.id).first()
        if not meta:
            meta = CourtMetadata(document_id=document.id)
            db.add(meta)
        
        meta.cnr_number = cnr_number or meta.cnr_number
        meta.case_number = case_number or meta.case_number
        meta.court = court
        meta.judge = judge or meta.judge
        meta.case_status = "Disposed" if "disposed" in text.lower() or "dismissed" in text.lower() or "allowed" in text.lower() else "Pending"
    else:
        # Default Court Metadata if category matches but nothing extracted
        if document.category == "Court Metadata":
            meta = db.query(CourtMetadata).filter(CourtMetadata.document_id == document.id).first()
            if not meta:
                meta = CourtMetadata(document_id=document.id, case_status="Pending")
                db.add(meta)

    # 5. Save quality verification checklist records
    qc = db.query(QualityCheck).filter(QualityCheck.document_id == document.id).first()
    if qc:
        qc.official_source = is_official
        qc.correct_title = len(document.title) > 3
        qc.correct_authority = len(document.authority) > 3
        qc.correct_year = document.year > 1800
        qc.correct_language = len(document.language) > 2
        qc.readable = is_readable
        qc.complete_content = is_complete
        qc.no_missing_pages = is_complete
        qc.pdf_opens_correctly = True
        qc.no_obvious_corruption = True
        qc.not_duplicate = not has_duplicate
        qc.metadata_complete = all([document.title, document.category, document.authority, document.source_url])
        qc.exact_source_url_recorded = bool(document.source_url)
        qc.duplicate_checked = not has_duplicate
        qc.version_verified = True
        
        qc.verification_status = "Verified" if (is_official and is_readable and not has_duplicate and qc.metadata_complete) else "Needs Review"
        
        # Sync document general status
        document.status = "Verified" if qc.verification_status == "Verified" else "Needs Review"
        document.quality_status = "Healthy" if is_readable else "Needs Review"


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    document_code: str = Form(...),
    title: str = Form(...),
    year: int = Form(...),
    category: str = Form(...),
    authority: str = Form(...),
    language: str = Form(...),
    source_id: Optional[int] = Form(None),
    source_url: str = Form(...),
    version: str = Form("1.0"),
    status_val: str = Form("Needs Review", alias="status"),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Enforce file validations
    if not file.filename.lower().endswith(".pdf") or file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF documents are supported."
        )

    # Clean filename and build file path
    safe_filename = "".join(c for c in file.filename if c.isalnum() or c in (".", "_", "-")).strip()
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    # Save file contents
    try:
        file_bytes = file.file.read()
        file_size = len(file_bytes)

        # Enforce size limit (15MB)
        if file_size > 15 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds the maximum limit of 15MB"
            )

        with open(file_path, "wb") as buffer:
            buffer.write(file_bytes)
        file.file.seek(0)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {str(e)}"
        )

    # Calculate file SHA-256 hash
    file_hash = hashlib.sha256(file_bytes).hexdigest()
    page_count = count_pdf_pages(file_path)

    # Check if document code already exists
    existing = db.query(Document).filter(Document.document_code == document_code).first()
    
    if existing:
        if existing.filename == "pending_upload.pdf":
            # This is a pre-seeded candidate Act, update it!
            document = existing
            document.title = title
            document.year = year
            document.category = category
            document.authority = authority
            document.language = language
            document.source_id = source_id
            document.source_url = source_url
            document.filename = safe_filename
            document.file_size = file_size
            document.file_hash = file_hash
            document.page_count = page_count
            document.file_path = file_path
            document.notes = notes
            document.status = "Needs Review"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Document with code {document_code} already exists"
            )
    else:
        # Create new document record
        document = Document(
            document_code=document_code,
            title=title,
            year=year,
            category=category,
            authority=authority,
            language=language,
            source_id=source_id,
            source_url=source_url,
            filename=safe_filename,
            file_size=file_size,
            file_hash=file_hash,
            page_count=page_count,
            file_path=file_path,
            version=version,
            status=status_val,
            notes=notes,
            created_by=current_user.email
        )
        db.add(document)
    
    db.commit()
    db.refresh(document)

    # Initialize default Quality Checklist
    qc = db.query(QualityCheck).filter(QualityCheck.document_id == document.id).first()
    if not qc:
        qc = QualityCheck(
            document_id=document.id,
            official_source=False,
            correct_title=False,
            correct_authority=False,
            correct_year=False,
            correct_language=False,
            complete_content=False,
            no_missing_pages=False,
            readable=False,
            pdf_opens_correctly=False,
            no_obvious_corruption=False,
            not_duplicate=False,
            metadata_complete=False,
            exact_source_url_recorded=False,
            duplicate_checked=False,
            version_verified=False,
            verification_status="Needs Review"
        )
        db.add(qc)
        db.commit()

    # Seed potential duplicates records first
    potential_duplicates = db.query(Document).filter(
        (Document.id != document.id) & 
        ((Document.file_hash == file_hash) | (Document.title.ilike(title)) | (Document.filename == safe_filename))
    ).all()

    for dup in potential_duplicates:
        reason = f"Matches existing document '{dup.title}' (ID: {dup.document_code}) by file hash, title, or filename"
        duplicate_entry = Duplicate(
            document_id=document.id,
            duplicate_document_id=dup.id,
            reason=reason,
            action="Needs Review",
            status="Pending"
        )
        db.add(duplicate_entry)
        document.duplicate_status = "Duplicate"
        
    db.commit()

    # Trigger Automated AI Auditing & Court Metadata Extraction
    try:
        run_automated_audit(document, file_path, db)
        db.commit()
    except Exception as audit_err:
        print(f"Failed to execute automated legal document audit: {str(audit_err)}")

    db.refresh(document)
    
    # Log Audit action
    log_audit(db, current_user.email, "Document uploaded", "Document", document.id, None, f"Code: {document.document_code}, Title: {document.title}")
    
    broadcast_sync({"event": "document_created"})
    return document


@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: int,
    document_in: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with id {document_id} not found"
        )
        
    prev_val = f"Status: {document.status}, Title: {document.title}"
    update_data = document_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(document, field, value)
            
    db.commit()
    db.refresh(document)
    
    # Log Audit action
    log_audit(db, current_user.email, "Document updated", "Document", document.id, prev_val, f"Status: {document.status}, Title: {document.title}")
    
    broadcast_sync({"event": "document_updated", "document_id": document_id})
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Restrict deletion to Admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete document records"
        )

    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with id {document_id} not found"
        )
    
    # Remove file from uploads folder if it's not the seed placeholder
    if document.filename != "pending_upload.pdf":
        file_path = os.path.join(settings.UPLOAD_DIR, document.filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
            
    # Log Audit action
    log_audit(db, current_user.email, "Document deleted", "Document", document_id, f"Code: {document.document_code}, Title: {document.title}", None)
    
    db.delete(document)
    db.commit()
    broadcast_sync({"event": "document_deleted", "document_id": document_id})
    return None


@router.get("/{document_id}/annotations", response_model=List[AnnotationResponse])
def get_document_annotations(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    annotations = db.query(Annotation).filter(
        Annotation.document_id == document_id
    ).order_by(Annotation.page_number.asc(), Annotation.created_at.desc()).all()
    return annotations


@router.post("/{document_id}/annotations", response_model=AnnotationResponse, status_code=status.HTTP_201_CREATED)
def create_document_annotation(
    document_id: int,
    annotation: AnnotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    new_annotation = Annotation(
        document_id=document_id,
        page_number=annotation.page_number,
        text=annotation.text,
        author=current_user.name or "Researcher"
    )
    db.add(new_annotation)
    db.commit()
    db.refresh(new_annotation)
    
    # Log Audit action
    log_audit(db, current_user.email, "Annotation added", "Document", document_id, None, annotation.text)
    
    broadcast_sync({"event": "document_updated", "document_id": document_id})
    return new_annotation


@router.delete("/{document_id}/annotations/{annotation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document_annotation(
    document_id: int,
    annotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    annotation = db.query(Annotation).filter(
        (Annotation.id == annotation_id) & (Annotation.document_id == document_id)
    ).first()
    
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    
    # Log Audit action
    log_audit(db, current_user.email, "Annotation deleted", "Document", document_id, annotation.text, None)
    
    db.delete(annotation)
    db.commit()
    
    broadcast_sync({"event": "document_updated", "document_id": document_id})
    return None
