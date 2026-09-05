from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.api.deps import get_current_user, RoleChecker
from app.models.models import User, Dataset, DatasetEvidence, AuditLog
from app.schemas.schemas import (
    DatasetCreate, DatasetUpdate, DatasetResponse,
    DatasetEvidenceCreate, DatasetEvidenceUpdate, DatasetEvidenceResponse
)
from app.core.websocket import broadcast_sync

router = APIRouter()

read_checker = Depends(get_current_user)
write_checker = Depends(RoleChecker(allowed_roles=["admin", "reviewer", "researcher"]))
admin_checker = Depends(RoleChecker(allowed_roles=["admin"]))

def log_audit(db: Session, email: str, action: str, entity: str, entity_id: int, prev: str = None, new: str = None, evidence: str = None, notes: str = None):
    audit_entry = AuditLog(
        user_email=email,
        action=action,
        entity=entity,
        entity_id=entity_id,
        previous_value=prev,
        new_value=new,
        evidence_source=evidence,
        notes=notes
    )
    db.add(audit_entry)
    db.commit()

def calculate_relevance_score(ds: Dataset) -> int:
    """
    Standardized Transparent Quality Score (0-100):
    - Provenance: 0–25
    - License clarity: 0–15
    - Coverage: 0–15
    - Metadata quality: 0–15
    - Document availability: 0–10
    - Freshness: 0–10
    - Data quality: 0–10
    Total: 100
    Rating Bands: 90-100: Excellent, 75-89: Strong, 60-74: Moderate, <60: Limited
    """
    score = 0
    
    # 1. Provenance: 0–25 pts
    if ds.provenance_status in ["Verified", "VERIFIED"]:
        score += 25
    elif ds.provenance_status in ["Partially Verified", "PARTIALLY_VERIFIED", "Partial"]:
        score += 15
    elif ds.provenance_status in ["Unclear", "UNVERIFIED", "Not Verified"]:
        score += 5
        
    # 2. License clarity: 0–15 pts
    if ds.license_status in ["Clear", "LICENSE_VERIFIED"]:
        score += 15
    elif ds.license_status in ["Reusable With Conditions", "Academic/Research Use", "LICENSE_PARTIAL"]:
        score += 10
    elif ds.license_status in ["License Unclear", "LICENSE_UNCLEAR", "No License Found"]:
        score += 2
        
    # 3. Coverage: 0–15 pts
    if ds.record_count and ds.record_count >= 1000000:
        score += 15
    elif ds.record_count and ds.record_count >= 50000:
        score += 12
    elif ds.record_count and ds.record_count >= 1000:
        score += 9
    elif ds.record_count:
        score += 6
    else:
        score += 5
        
    # 4. Metadata quality: 0–15 pts
    if ds.metadata_available and ds.metadata_fields and len(ds.metadata_fields.split(",")) >= 4:
        score += 15
    elif ds.metadata_available or ds.metadata_quality == "High":
        score += 11
    elif ds.metadata_quality == "Medium":
        score += 7
    else:
        score += 4
        
    # 5. Document availability: 0–10 pts
    if ds.original_pdf_available or ds.original_documents_available:
        score += 10
    elif ds.text_available:
        score += 7
    elif ds.metadata_available:
        score += 4
    else:
        score += 2
        
    # 6. Freshness: 0–10 pts
    if ds.freshness_status in ["Fresh", "Very Fresh", "Current"]:
        score += 10
    elif ds.freshness_status in ["Moderate", "Aging"]:
        score += 6
    else:
        score += 3
        
    # 7. Data quality & documentation: 0–10 pts
    if ds.documentation_quality == "High" or (ds.data_quality_assessment and "Clean" in ds.data_quality_assessment):
        score += 10
    elif ds.documentation_quality == "Medium":
        score += 7
    else:
        score += 4
        
    return min(score, 100)

@router.get("", response_model=List[DatasetResponse])
def get_datasets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    search: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    provenance_status: Optional[str] = Query(None),
    license_status: Optional[str] = Query(None),
    reuse_classification: Optional[str] = Query(None),
    freshness_status: Optional[str] = Query(None),
    shortlisted: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = read_checker
):
    query = db.query(Dataset)
    
    if platform:
        query = query.filter(Dataset.platform == platform)
    if category:
        query = query.filter(Dataset.category == category)
    if provenance_status:
        query = query.filter(Dataset.provenance_status == provenance_status)
    if license_status:
        query = query.filter(Dataset.license_status == license_status)
    if reuse_classification:
        query = query.filter(Dataset.reuse_classification == reuse_classification)
    if freshness_status:
        query = query.filter(Dataset.freshness_status == freshness_status)
    if shortlisted is not None:
        query = query.filter(Dataset.shortlisted == shortlisted)
        
    if search:
        search_filter = or_(
            Dataset.dataset_name.ilike(f"%{search}%"),
            Dataset.creator.ilike(f"%{search}%"),
            Dataset.organization.ilike(f"%{search}%"),
            Dataset.platform.ilike(f"%{search}%"),
            Dataset.category.ilike(f"%{search}%"),
            Dataset.description.ilike(f"%{search}%"),
            Dataset.original_source.ilike(f"%{search}%"),
            Dataset.research_notes.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
        
    datasets = query.offset(skip).limit(limit).all()
    return datasets

@router.post("", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
def create_dataset(
    dataset_in: DatasetCreate,
    db: Session = Depends(get_db),
    current_user: User = write_checker
):
    # Check duplicate dataset URL or platform/creator pair
    existing = db.query(Dataset).filter(
        or_(
            Dataset.dataset_url == dataset_in.dataset_url,
            (Dataset.dataset_name == dataset_in.dataset_name) & (Dataset.platform == dataset_in.platform)
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Duplicate dataset detected! Dataset matches existing entry '{existing.dataset_name}' hosted on {existing.platform} (Mirror/Duplicate warning)."
        )

    # Perform URL validations
    if not (dataset_in.dataset_url.startswith("http://") or dataset_in.dataset_url.startswith("https://")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dataset URL must be a valid HTTP or HTTPS link."
        )
    if dataset_in.original_source_url and not (dataset_in.original_source_url.startswith("http://") or dataset_in.original_source_url.startswith("https://")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Original Source URL must be a valid HTTP or HTTPS link."
        )

    # Convert create schema to model fields
    db_obj = Dataset(**dataset_in.dict())
    
    # Calculate calculated relevance score
    db_obj.research_relevance_score = calculate_relevance_score(db_obj)
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Log Audit action
    log_audit(db, current_user.email, "Created", "Dataset", db_obj.id, None, db_obj.dataset_name)
    
    broadcast_sync({"event": "dataset_created"})
    return db_obj

@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = read_checker
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with id {dataset_id} not found"
        )
    return dataset

@router.put("/{dataset_id}", response_model=DatasetResponse)
def update_dataset(
    dataset_id: int,
    dataset_in: DatasetUpdate,
    db: Session = Depends(get_db),
    current_user: User = write_checker
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with id {dataset_id} not found"
        )
        
    # Restrict review actions to Reviewer/Admin
    update_data = dataset_in.dict(exclude_unset=True)
    
    # RBAC constraints on verification / status changes
    restricted_fields = ["provenance_status", "license_status", "verified_at", "reviewer", "status"]
    if current_user.role == "researcher":
        for field in restricted_fields:
            if field in update_data:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Researchers are not authorized to edit quality control field '{field}' directly."
                )

    prev_val = f"Name: {dataset.dataset_name}, Provenance: {dataset.provenance_status}"
    
    # Perform update
    for field, value in update_data.items():
        setattr(dataset, field, value)
        
    # Auto fill verified parameters if reviewer is updating status
    if "provenance_status" in update_data and current_user.role != "researcher":
        if update_data["provenance_status"] in ["Verified", "Partially Verified"]:
            dataset.reviewer = current_user.email
            dataset.verified_at = datetime.utcnow()
            
    # Recalculate relevance score
    dataset.research_relevance_score = calculate_relevance_score(dataset)
    dataset.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(dataset)
    
    # Audit trail action determination
    action = "Updated"
    if "provenance_status" in update_data:
        action = "Provenance Checked"
    elif "license_status" in update_data:
        action = "License Checked"
    elif "shortlisted" in update_data:
        action = "Shortlisted" if update_data["shortlisted"] else "Rejected"
        
    log_audit(
        db, 
        current_user.email, 
        action, 
        "Dataset", 
        dataset.id, 
        prev_val, 
        f"Name: {dataset.dataset_name}, Provenance: {dataset.provenance_status}",
        dataset.dataset_url,
        f"Shortlisted: {dataset.shortlisted}. Reuse classification: {dataset.reuse_classification}."
    )
    
    broadcast_sync({"event": "dataset_updated", "dataset_id": dataset_id})
    return dataset

@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = admin_checker
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with id {dataset_id} not found"
        )
        
    log_audit(db, current_user.email, "Archived", "Dataset", dataset_id, dataset.dataset_name, None)
    
    db.delete(dataset)
    db.commit()
    broadcast_sync({"event": "dataset_deleted", "dataset_id": dataset_id})
    return None


# Dataset Evidence Sub-routes
@router.get("/{dataset_id}/evidence", response_model=List[DatasetEvidenceResponse])
def get_dataset_evidence(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = read_checker
):
    evidence = db.query(DatasetEvidence).filter(DatasetEvidence.dataset_id == dataset_id).all()
    return evidence

@router.post("/{dataset_id}/evidence", response_model=DatasetEvidenceResponse, status_code=status.HTTP_201_CREATED)
def create_dataset_evidence(
    dataset_id: int,
    evidence_in: DatasetEvidenceCreate,
    db: Session = Depends(get_db),
    current_user: User = write_checker
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with id {dataset_id} not found"
        )
        
    db_obj = DatasetEvidence(dataset_id=dataset_id, **evidence_in.dict())
    
    # If reviewer creates it, auto-approve
    if current_user.role != "researcher" and db_obj.verified:
        db_obj.reviewer = current_user.email
        db_obj.verified_at = datetime.utcnow()
        
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Log Audit
    log_audit(db, current_user.email, "Source Verified", "DatasetEvidence", db_obj.id, None, db_obj.source_title, db_obj.source_url)
    
    broadcast_sync({"event": "dataset_updated", "dataset_id": dataset_id})
    return db_obj

@router.put("/{dataset_id}/evidence/{evidence_id}", response_model=DatasetEvidenceResponse)
def update_dataset_evidence(
    dataset_id: int,
    evidence_id: int,
    evidence_in: DatasetEvidenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = write_checker
):
    evidence = db.query(DatasetEvidence).filter(
        (DatasetEvidence.id == evidence_id) & (DatasetEvidence.dataset_id == dataset_id)
    ).first()
    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence with id {evidence_id} not found for this dataset"
        )
        
    update_data = evidence_in.dict(exclude_unset=True)
    
    # If researcher tries to verify, raise 403
    if "verified" in update_data and current_user.role == "researcher":
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Researchers are not authorized to verify or approve evidence records."
        )
         
    for field, value in update_data.items():
        setattr(evidence, field, value)
        
    if "verified" in update_data and update_data["verified"]:
        evidence.reviewer = current_user.email
        evidence.verified_at = datetime.utcnow()
        
    db.commit()
    db.refresh(evidence)
    
    # Log Audit
    log_audit(db, current_user.email, "Review Completed", "DatasetEvidence", evidence.id, "Verified: False", f"Verified: {evidence.verified}", evidence.source_url)
    
    broadcast_sync({"event": "dataset_updated", "dataset_id": dataset_id})
    return evidence

@router.delete("/{dataset_id}/evidence/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dataset_evidence(
    dataset_id: int,
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = write_checker
):
    evidence = db.query(DatasetEvidence).filter(
        (DatasetEvidence.id == evidence_id) & (DatasetEvidence.dataset_id == dataset_id)
    ).first()
    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence record not found"
        )
        
    db.delete(evidence)
    db.commit()
    
    broadcast_sync({"event": "dataset_updated", "dataset_id": dataset_id})
    return None
