import io
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd
import json

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Source, Document, Duplicate, QualityCheck, CourtMetadata

router = APIRouter()

@router.get("/{export_type}/{export_format}")
def export_dataset(
    export_type: str,
    export_format: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can export datasets"
        )

    if export_type == "sources":
        items = db.query(Source).all()
        data = [{
            "Source ID": s.id,
            "Source Name": s.website_name,
            "Authority": s.authority,
            "Organization": s.organization,
            "Source Type": s.source_type,
            "Legal Information Type": s.legal_information_type,
            "Languages": s.languages,
            "Download Available": s.download_available,
            "Website URL": s.website_url,
            "Reliability": s.reliability_level,
            "Verification": s.verification_status,
            "Description": s.description,
            "Notes": s.notes
        } for s in items]
    elif export_type == "documents":
        items = db.query(Document).all()
        data = [{
            "Document ID": d.id,
            "Document Code": d.document_code,
            "Title": d.title,
            "Year": d.year,
            "Category": d.category,
            "Subcategory": d.subcategory,
            "Authority": d.authority,
            "Ministry/Department": d.ministry_department,
            "Language": d.language,
            "Source URL": d.source_url,
            "File Name": d.filename,
            "File Size (Bytes)": d.file_size,
            "SHA-256 Hash": d.file_hash,
            "Page Count": d.page_count,
            "Verification Status": d.status,
            "Quality Status": d.quality_status,
            "Notes": d.notes
        } for d in items]
    elif export_type == "questionable":
        items = db.query(Document).filter(
            (Document.status == "Needs Review") | 
            (Document.status == "Rejected") | 
            (Document.duplicate_status == "Duplicate") |
            (Document.quality_status == "Needs Review")
        ).all()
        data = [{
            "Document ID": d.id,
            "Document Code": d.document_code,
            "Title": d.title,
            "Year": d.year,
            "Category": d.category,
            "Authority": d.authority,
            "Language": d.language,
            "Source URL": d.source_url,
            "File Name": d.filename,
            "Verification Status": d.status,
            "Quality Status": d.quality_status,
            "Duplicate Status": d.duplicate_status,
            "Notes": d.notes
        } for d in items]
    elif export_type == "duplicates":
        items = db.query(Duplicate).all()
        data = [{
            "Duplicate ID": d.id,
            "Primary Document ID": d.document_id,
            "Primary Code": d.document.document_code if d.document else "N/A",
            "Primary Title": d.document.title if d.document else "N/A",
            "Duplicate Document ID": d.duplicate_document_id,
            "Duplicate Code": d.duplicate_document.document_code if d.duplicate_document else "N/A",
            "Duplicate Title": d.duplicate_document.title if d.duplicate_document else "N/A",
            "Reason": d.reason,
            "Resolution Action": d.action,
            "Resolution Status": d.status
        } for d in items]
    elif export_type == "complete":
        docs = db.query(Document).all()
        data = []
        for d in docs:
            qc = d.quality_check
            cm = d.court_metadata
            data.append({
                "Document ID": d.id,
                "Document Code": d.document_code,
                "Title": d.title,
                "Year": d.year,
                "Category": d.category,
                "Authority": d.authority,
                "Language": d.language,
                "Source URL": d.source_url,
                "File Name": d.filename,
                "File Size": d.file_size,
                "SHA-256 Hash": d.file_hash,
                "Page Count": d.page_count,
                "Verification Status": d.status,
                "Quality Status": d.quality_status,
                "Duplicate Status": d.duplicate_status,
                "CNR Number": cm.cnr_number if cm else None,
                "Case Number": cm.case_number if cm else None,
                "Court": cm.court if cm else None,
                "Judge": cm.judge if cm else None,
                "Official Source Check": qc.official_source if qc else False,
                "Readable Check": qc.readable if qc else False,
                "Complete Check": qc.complete_content if qc else False,
                "Metadata Correct Check": qc.metadata_correct if qc else False,
                "Notes": d.notes
            })
    else:
        raise HTTPException(status_code=400, detail="Invalid export type")

    df = pd.DataFrame(data)

    if export_format == "csv":
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        response = StreamingResponse(
            io.BytesIO(stream.getvalue().encode("utf-8")),
            media_type="text/csv"
        )
        response.headers["Content-Disposition"] = f"attachment; filename={export_type}_export.csv"
        return response
    elif export_format == "excel":
        stream = io.BytesIO()
        with pd.ExcelWriter(stream, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name=export_type.title())
        response = StreamingResponse(
            io.BytesIO(stream.getvalue()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response.headers["Content-Disposition"] = f"attachment; filename={export_type}_export.xlsx"
        return response
    elif export_format == "json":
        stream = io.BytesIO()
        df_json = df.to_json(orient="records", indent=2)
        stream.write(df_json.encode("utf-8"))
        stream.seek(0)
        response = StreamingResponse(
            stream,
            media_type="application/json"
        )
        response.headers["Content-Disposition"] = f"attachment; filename={export_type}_export.json"
        return response
    else:
        raise HTTPException(status_code=400, detail="Invalid export format")
