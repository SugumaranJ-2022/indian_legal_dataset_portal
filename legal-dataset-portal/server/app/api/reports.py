import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.services.report_service import generate_pdf_report, generate_excel_report

router = APIRouter()

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
    
    try:
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
    
    try:
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
