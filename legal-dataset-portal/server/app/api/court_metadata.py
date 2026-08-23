from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, CourtMetadata, Document
from app.schemas.schemas import CourtMetadataResponse, CourtMetadataCreate

router = APIRouter()

@router.get("", response_model=List[CourtMetadataResponse])
def get_court_metadata_records(
    state: Optional[str] = Query(None),
    court: Optional[str] = Query(None),
    status_val: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(CourtMetadata)
    
    if state:
        query = query.filter(CourtMetadata.state.ilike(f"%{state}%"))
    if court:
        query = query.filter(CourtMetadata.court.ilike(f"%{court}%"))
    if status_val:
        query = query.filter(CourtMetadata.case_status.ilike(f"%{status_val}%"))
        
    return query.all()

@router.get("/{document_id}", response_model=CourtMetadataResponse)
def get_court_metadata_by_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meta = db.query(CourtMetadata).filter(CourtMetadata.document_id == document_id).first()
    if not meta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Court metadata for document {document_id} not found"
        )
    return meta

@router.put("/{document_id}", response_model=CourtMetadataResponse)
def update_court_metadata(
    document_id: int,
    meta_in: CourtMetadataCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meta = db.query(CourtMetadata).filter(CourtMetadata.document_id == document_id).first()
    if not meta:
        # Create a new record if it doesn't exist
        meta = CourtMetadata(document_id=document_id)
        db.add(meta)
        
    update_data = meta_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(meta, field, value)
        
    db.commit()
    db.refresh(meta)
    return meta
