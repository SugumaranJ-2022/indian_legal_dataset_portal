from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Document, QualityCheck
from app.schemas.schemas import QualityCheckResponse, QualityCheckUpdate
from app.core.websocket import broadcast_sync

router = APIRouter()

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
        
    update_data = qc_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(qc, field, value)
        
    # Also sync the document's main status field
    if qc_in.verification_status:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = qc_in.verification_status
            
    db.commit()
    db.refresh(qc)
    broadcast_sync({"event": "quality_updated", "document_id": document_id})
    return qc
