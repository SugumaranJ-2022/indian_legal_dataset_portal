from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_user, RoleChecker
from app.models.models import User, GapAnalysis, AuditLog
from app.schemas.schemas import GapAnalysisCreate, GapAnalysisUpdate, GapAnalysisResponse
from app.core.websocket import broadcast_sync

router = APIRouter()

read_checker = Depends(get_current_user)
write_checker = Depends(RoleChecker(allowed_roles=["admin", "reviewer", "researcher"]))

def log_audit(db: Session, email: str, action: str, entity: str, entity_id: int, prev: str = None, new: str = None, notes: str = None):
    audit_entry = AuditLog(
        user_email=email,
        action=action,
        entity=entity,
        entity_id=entity_id,
        previous_value=prev,
        new_value=new,
        notes=notes
    )
    db.add(audit_entry)
    db.commit()

@router.get("", response_model=List[GapAnalysisResponse])
def get_gaps(
    db: Session = Depends(get_db),
    current_user: User = read_checker
):
    gaps = db.query(GapAnalysis).all()
    return gaps

@router.post("", response_model=GapAnalysisResponse, status_code=status.HTTP_201_CREATED)
def create_gap(
    gap_in: GapAnalysisCreate,
    db: Session = Depends(get_db),
    current_user: User = write_checker
):
    # Check if category already exists
    existing = db.query(GapAnalysis).filter(GapAnalysis.category == gap_in.category).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gap analysis category '{gap_in.category}' already exists. Use PUT to modify it."
        )
        
    db_obj = GapAnalysis(**gap_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    log_audit(db, current_user.email, "Gap Identified", "GapAnalysis", db_obj.id, None, db_obj.category, f"Priority: {db_obj.priority}")
    
    broadcast_sync({"event": "gaps_updated"})
    return db_obj

@router.get("/{gap_id}", response_model=GapAnalysisResponse)
def get_gap(
    gap_id: int,
    db: Session = Depends(get_db),
    current_user: User = read_checker
):
    gap = db.query(GapAnalysis).filter(GapAnalysis.id == gap_id).first()
    if not gap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Gap record with id {gap_id} not found"
        )
    return gap

@router.put("/{gap_id}", response_model=GapAnalysisResponse)
def update_gap(
    gap_id: int,
    gap_in: GapAnalysisUpdate,
    db: Session = Depends(get_db),
    current_user: User = write_checker
):
    gap = db.query(GapAnalysis).filter(GapAnalysis.id == gap_id).first()
    if not gap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Gap record with id {gap_id} not found"
        )
        
    prev_val = f"Priority: {gap.priority}, Availability: {gap.availability}"
    
    update_data = gap_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(gap, field, value)
        
    gap.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(gap)
    
    log_audit(
        db, 
        current_user.email, 
        "Updated", 
        "GapAnalysis", 
        gap.id, 
        prev_val, 
        f"Priority: {gap.priority}, Availability: {gap.availability}",
        f"Recommendation: {gap.recommendation}. Evidence: {gap.evidence}"
    )
    
    broadcast_sync({"event": "gaps_updated"})
    return gap
