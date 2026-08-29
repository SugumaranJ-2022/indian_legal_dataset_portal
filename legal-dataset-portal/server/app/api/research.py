from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_user, RoleChecker
from app.models.models import User, ResearchSearchLog, ResearchMethodology, AuditLog
from app.schemas.schemas import (
    ResearchSearchLogCreate, ResearchSearchLogResponse,
    ResearchMethodologyBase, ResearchMethodologyResponse
)

router = APIRouter()

read_checker = Depends(get_current_user)
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

# Search Logs
@router.get("/search-log", response_model=List[ResearchSearchLogResponse])
def get_search_logs(
    db: Session = Depends(get_db),
    current_user: User = read_checker
):
    logs = db.query(ResearchSearchLog).order_by(ResearchSearchLog.search_date.desc()).all()
    return logs

@router.post("/search-log", response_model=ResearchSearchLogResponse, status_code=status.HTTP_201_CREATED)
def create_search_log(
    log_in: ResearchSearchLogCreate,
    db: Session = Depends(get_db),
    current_user: User = write_checker
):
    db_obj = ResearchSearchLog(
        platform=log_in.platform,
        search_query=log_in.search_query,
        search_date=log_in.search_date,
        researcher=current_user.name or current_user.email,
        results_found=log_in.results_found,
        relevant_results=log_in.relevant_results,
        notes=log_in.notes
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    log_audit(db, current_user.email, "Created", "ResearchSearchLog", db_obj.id, None, f"Query: {db_obj.search_query} on {db_obj.platform}")
    return db_obj


# Methodology
@router.get("/methodology", response_model=ResearchMethodologyResponse)
def get_methodology(
    db: Session = Depends(get_db),
    current_user: User = read_checker
):
    meth = db.query(ResearchMethodology).first()
    if not meth:
        # Create a blank default methodology record
        meth = ResearchMethodology(
            platform_searched="Not Specified",
            search_date=datetime.utcnow().date(),
            search_terms="Not Specified",
            categories_investigated="Not Specified",
            selection_criteria="Not Specified",
            exclusion_criteria="Not Specified",
            verification_process="Not Specified"
        )
        db.add(meth)
        db.commit()
        db.refresh(meth)
    return meth

@router.put("/methodology", response_model=ResearchMethodologyResponse)
def update_methodology(
    meth_in: ResearchMethodologyBase,
    db: Session = Depends(get_db),
    current_user: User = write_checker
):
    meth = db.query(ResearchMethodology).first()
    if not meth:
        meth = ResearchMethodology()
        db.add(meth)
        db.commit()
        db.refresh(meth)
        
    prev_val = f"Platforms: {meth.platform_searched}"
    
    update_data = meth_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(meth, field, value)
        
    db.commit()
    db.refresh(meth)
    
    log_audit(db, current_user.email, "Updated", "ResearchMethodology", meth.id, prev_val, f"Platforms: {meth.platform_searched}")
    return meth
