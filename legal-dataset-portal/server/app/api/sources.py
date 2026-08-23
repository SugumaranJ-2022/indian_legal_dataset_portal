from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.api.deps import get_current_user, RoleChecker
from app.models.models import User, Source, AuditLog
from app.schemas.schemas import SourceCreate, SourceUpdate, SourceResponse
from app.core.websocket import broadcast_sync

router = APIRouter()

# Allow both researchers and reviewers/admins to read sources
read_checker = Depends(get_current_user)
# Allow only reviewers/admins to modify sources (RBAC ready)
write_checker = Depends(RoleChecker(allowed_roles=["admin", "reviewer", "researcher"]))

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

@router.get("", response_model=List[SourceResponse])
def get_sources(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    source_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = read_checker
):
    query = db.query(Source)
    
    if category:
        query = query.filter(Source.category == category)
    if source_type:
        query = query.filter(Source.source_type == source_type)
        
    if search:
        search_filter = or_(
            Source.website_name.ilike(f"%{search}%"),
            Source.authority.ilike(f"%{search}%"),
            Source.organization.ilike(f"%{search}%"),
            Source.notes.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    sources = query.offset(skip).limit(limit).all()
    
    # Map database string representation of languages back to list of strings
    response_sources = []
    for source in sources:
        langs = source.languages.split(",") if source.languages else []
        response_sources.append(
            SourceResponse(
                id=source.id,
                website_name=source.website_name,
                authority=source.authority,
                organization=source.organization,
                category=source.category,
                source_type=source.source_type,
                legal_information_type=source.legal_information_type,
                languages=langs,
                download_available=source.download_available,
                website_url=source.website_url,
                reliability_level=source.reliability_level,
                verification_status=source.verification_status,
                description=source.description,
                notes=source.notes
            )
        )
    return response_sources

@router.post("", response_model=SourceResponse, status_code=status.HTTP_201_CREATED)
def create_source(
    source_in: SourceCreate,
    db: Session = Depends(get_db),
    current_user: User = write_checker
):
    source = Source(
        website_name=source_in.website_name,
        authority=source_in.authority,
        organization=source_in.organization,
        category=source_in.category,
        source_type=source_in.source_type,
        legal_information_type=source_in.legal_information_type,
        languages=",".join(source_in.languages),
        download_available=source_in.download_available,
        website_url=source_in.website_url,
        reliability_level=source_in.reliability_level,
        verification_status=source_in.verification_status,
        description=source_in.description,
        notes=source_in.notes
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    
    # Log Audit action
    log_audit(db, current_user.email, "Source added", "Source", source.id, None, source.website_name)
    
    broadcast_sync({"event": "source_created"})
    
    return SourceResponse(
        id=source.id,
        website_name=source.website_name,
        authority=source.authority,
        organization=source.organization,
        category=source.category,
        source_type=source.source_type,
        legal_information_type=source.legal_information_type,
        languages=source.languages.split(",") if source.languages else [],
        download_available=source.download_available,
        website_url=source.website_url,
        reliability_level=source.reliability_level,
        verification_status=source.verification_status,
        description=source.description,
        notes=source.notes
    )

@router.put("/{source_id}", response_model=SourceResponse)
def update_source(
    source_id: int,
    source_in: SourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = write_checker
):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source with id {source_id} not found"
        )
        
    prev_val = f"Name: {source.website_name}, Reliability: {source.reliability_level}"
    
    update_data = source_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "languages":
            setattr(source, "languages", ",".join(value))
        else:
            setattr(source, field, value)
            
    db.commit()
    db.refresh(source)
    
    # Log Audit action
    log_audit(db, current_user.email, "Source updated", "Source", source.id, prev_val, f"Name: {source.website_name}, Reliability: {source.reliability_level}")
    
    broadcast_sync({"event": "source_updated", "source_id": source_id})
    
    return SourceResponse(
        id=source.id,
        website_name=source.website_name,
        authority=source.authority,
        organization=source.organization,
        category=source.category,
        source_type=source.source_type,
        legal_information_type=source.legal_information_type,
        languages=source.languages.split(",") if source.languages else [],
        download_available=source.download_available,
        website_url=source.website_url,
        reliability_level=source.reliability_level,
        verification_status=source.verification_status,
        description=source.description,
        notes=source.notes
    )

@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_source(
    source_id: int,
    db: Session = Depends(get_db),
    current_user: User = write_checker
):
    # Restrict deletion to Admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete source records"
        )

    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source with id {source_id} not found"
        )
        
    # Log Audit action
    log_audit(db, current_user.email, "Source deleted", "Source", source_id, source.website_name, None)
    
    db.delete(source)
    db.commit()
    broadcast_sync({"event": "source_deleted", "source_id": source_id})
    return None
