from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Duplicate, Document
from app.schemas.schemas import DuplicateResponse, DuplicateUpdate
from app.core.websocket import broadcast_sync

router = APIRouter()

@router.get("", response_model=List[DuplicateResponse])
def get_duplicates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    duplicates = db.query(Duplicate).all()
    
    response_list = []
    for dup in duplicates:
        # Fetch matching documents to include titles/codes in response
        doc = db.query(Document).filter(Document.id == dup.document_id).first()
        dup_doc = db.query(Document).filter(Document.id == dup.duplicate_document_id).first()
        
        response_list.append(
            DuplicateResponse(
                id=dup.id,
                document_id=dup.document_id,
                duplicate_document_id=dup.duplicate_document_id,
                reason=dup.reason,
                action=dup.action,
                status=dup.status,
                document_title=doc.title if doc else "Unknown",
                document_code=doc.document_code if doc else "Unknown",
                duplicate_document_title=dup_doc.title if dup_doc else "Unknown",
                duplicate_document_code=dup_doc.document_code if dup_doc else "Unknown"
            )
        )
    return response_list

@router.put("/{duplicate_id}", response_model=DuplicateResponse)
def update_duplicate_action(
    duplicate_id: int,
    dup_in: DuplicateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dup = db.query(Duplicate).filter(Duplicate.id == duplicate_id).first()
    if not dup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Duplicate record with id {duplicate_id} not found"
        )
        
    if dup_in.action:
        dup.action = dup_in.action
        # Automatically mark resolved once user decides
        dup.status = "Resolved"
        
        # If user decides to mark as duplicate, set the document status to "Duplicate"
        doc = db.query(Document).filter(Document.id == dup.document_id).first()
        if doc:
            if dup_in.action == "Mark Duplicate":
                doc.status = "Duplicate"
            elif dup_in.action == "Keep":
                # Revert to Needs Review or similar if marked Keep
                doc.status = "Needs Review"

    db.commit()
    db.refresh(dup)
    broadcast_sync({"event": "duplicate_updated", "duplicate_id": duplicate_id})
    
    doc = db.query(Document).filter(Document.id == dup.document_id).first()
    dup_doc = db.query(Document).filter(Document.id == dup.duplicate_document_id).first()
    
    return DuplicateResponse(
        id=dup.id,
        document_id=dup.document_id,
        duplicate_document_id=dup.duplicate_document_id,
        reason=dup.reason,
        action=dup.action,
        status=dup.status,
        document_title=doc.title if doc else "Unknown",
        document_code=doc.document_code if doc else "Unknown",
        duplicate_document_title=dup_doc.title if dup_doc else "Unknown",
        duplicate_document_code=dup_doc.document_code if dup_doc else "Unknown"
    )
