import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Source, Document, Duplicate, QualityCheck

router = APIRouter()

@router.get("/telemetry")
def get_final_report_telemetry(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Calculate counts dynamically
    total_sources = db.query(Source).count()
    total_documents = db.query(Document).count()
    verified_documents = db.query(Document).filter(Document.status == "Verified").count()
    pending_documents = db.query(Document).filter(Document.status == "Pending").count()
    needs_review = db.query(Document).filter(Document.status == "Needs Review").count()
    duplicates_count = db.query(Duplicate).count()
    
    # Questionable counts
    incomplete_count = db.query(Document).filter(
        (Document.status == "Needs Review") | (Document.quality_status == "Needs Review")
    ).count()
    corrupt_count = db.query(Document).filter(Document.corruption_status == "Corrupted").count()
    
    # Category distribution
    categories = ["Acts / Statutes", "Rules & Regulations", "Court Judgments", "Court Metadata"]
    category_counts = {}
    for cat in categories:
        category_counts[cat] = db.query(Document).filter(Document.category == cat).count()
        
    # Sources list
    sources = db.query(Source).all()
    sources_data = [{
        "name": s.website_name,
        "url": s.website_url,
        "type": s.source_type,
        "reliability": s.reliability_level
    } for s in sources]
    
    # Generate findings and recommendations based on database stats (no fabrication)
    findings = []
    if total_documents == 0:
        findings.append("No documents have been collected in the portal database yet.")
    else:
        findings.append(f"A total of {total_documents} legal documents have been logged in the collection grid.")
        findings.append(f"{verified_documents} documents have successfully passed all quality checklist criteria and are marked Verified.")
        if duplicates_count > 0:
            findings.append(f"{duplicates_count} potential duplicates were detected and flagged by file hash/title rules.")
        if incomplete_count > 0:
            findings.append(f"{incomplete_count} records are flagged as questionable due to incomplete metadata or unreadable layouts.")
            
    recommendations = [
        "Ensure all pending candidate statutes are fully downloaded from authoritative domains (.gov.in / .nic.in).",
        "Implement periodic checksum validations on the persistent volume to guarantee archive integrity.",
        "Restrict metadata updates to certified researchers to preserve audit log consistency.",
        "Address flagged duplicate documents in the de-duplication panel before compiling datasets."
    ]

    return {
        "objective": "Identify reliable Indian legal-data sources and collect a small, high-quality initial sample across acts, rules, judgments, and court metadata.",
        "total_sources": total_sources,
        "total_documents": total_documents,
        "verified_documents": verified_documents,
        "pending_documents": pending_documents,
        "needs_review": needs_review,
        "duplicates_count": duplicates_count,
        "incomplete_count": incomplete_count,
        "corrupt_count": corrupt_count,
        "category_counts": category_counts,
        "sources": sources_data,
        "findings": findings,
        "recommendations": recommendations
    }

@router.get("/pdf")
def export_pdf_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate and export a professional PDF data audit report.
    """
    file_name = "Legal_Dataset_Audit_Report.pdf"
    file_path = os.path.join(settings.REPORTS_DIR, file_name)
    
    # Make sure parent dir exists
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    
    try:
        # Import service dynamically to avoid cyclic imports
        from app.services.report_service import generate_pdf_report
        generate_pdf_report(db, file_path)
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="PDF report file could not be generated"
            )
        return FileResponse(
            file_path, 
            media_type="application/pdf", 
            filename=file_name
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating PDF report: {str(e)}"
        )

@router.get("/excel")
def export_excel_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate and export a multi-sheet Excel data audit report.
    """
    file_name = "Legal_Dataset_Audit_Report.xlsx"
    file_path = os.path.join(settings.REPORTS_DIR, file_name)
    
    # Make sure parent dir exists
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    
    try:
        # Import service dynamically
        from app.services.report_service import generate_excel_report
        generate_excel_report(db, file_path)
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Excel report file could not be generated"
            )
        return FileResponse(
            file_path, 
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
            filename=file_name
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating Excel report: {str(e)}"
        )
