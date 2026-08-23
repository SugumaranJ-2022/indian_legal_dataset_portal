from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Document, QualityCheck, AuditLog
from app.schemas.schemas import QualityCheckResponse, QualityCheckUpdate
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

@router.get("/{document_id}", response_model=QualityCheckResponse)
def get_quality_status(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    qc = db.query(QualityCheck).filter(QualityCheck.document_id == document_id).first()
    if not qc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quality check for document {document_id} not found"
        )
    return qc

@router.put("/{document_id}", response_model=QualityCheckResponse)
def update_quality_checklist(
    document_id: int,
    qc_in: QualityCheckUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    qc = db.query(QualityCheck).filter(QualityCheck.document_id == document_id).first()
    if not qc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quality check for document {document_id} not found"
        )
        
    prev_val = f"Verification Status: {qc.verification_status}"
    
    # Enforce quality checklist constraints for verification
    target_status = qc_in.verification_status if qc_in.verification_status is not None else qc.verification_status
    if target_status == "Verified":
        reqs = {
            "official_source": qc_in.official_source if qc_in.official_source is not None else qc.official_source,
            "correct_title": qc_in.correct_title if qc_in.correct_title is not None else qc.correct_title,
            "correct_authority": qc_in.correct_authority if qc_in.correct_authority is not None else qc.correct_authority,
            "correct_year": qc_in.correct_year if qc_in.correct_year is not None else qc.correct_year,
            "correct_language": qc_in.correct_language if qc_in.correct_language is not None else qc.correct_language,
            "complete_content": qc_in.complete_content if qc_in.complete_content is not None else qc.complete_content,
            "no_missing_pages": qc_in.no_missing_pages if qc_in.no_missing_pages is not None else qc.no_missing_pages,
            "readable": qc_in.readable if qc_in.readable is not None else qc.readable,
            "pdf_opens_correctly": qc_in.pdf_opens_correctly if qc_in.pdf_opens_correctly is not None else qc.pdf_opens_correctly,
            "no_obvious_corruption": qc_in.no_obvious_corruption if qc_in.no_obvious_corruption is not None else qc.no_obvious_corruption,
            "not_duplicate": qc_in.not_duplicate if qc_in.not_duplicate is not None else qc.not_duplicate,
            "metadata_complete": qc_in.metadata_complete if qc_in.metadata_complete is not None else qc.metadata_complete,
            "exact_source_url_recorded": qc_in.exact_source_url_recorded if qc_in.exact_source_url_recorded is not None else qc.exact_source_url_recorded
        }
        incomplete = [k for k, v in reqs.items() if not v]
        if incomplete:
            missing_checks = ", ".join(incomplete).replace("_", " ").title()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot mark document as Verified. The following checklist items are incomplete: {missing_checks}."
            )
            
    update_data = qc_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(qc, field, value)
        
    # Also sync the document's main status field
    if qc_in.verification_status:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = qc_in.verification_status
            if qc_in.verification_status == "Verified":
                doc.quality_status = "Verified"
            elif qc_in.verification_status == "Rejected":
                doc.quality_status = "Rejected"
            else:
                doc.quality_status = "Pending"
            
    db.commit()
    db.refresh(qc)
    
    # Log Audit action
    log_audit(db, current_user.email, f"Quality check updated for Doc {document_id}", "QualityCheck", qc.id, prev_val, f"Verification Status: {qc.verification_status}")
    
    broadcast_sync({"event": "quality_updated", "document_id": document_id})
    return qc
