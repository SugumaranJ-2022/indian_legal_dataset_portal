from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Source, Document, Duplicate
from app.schemas.schemas import DashboardStats

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch counts, group-by category statistics, group-by verification status, 
    and recent monthly upload trends for analytics dashboards.
    """
    total_sources = db.query(Source).count()
    total_documents = db.query(Document).count()
    verified_documents = db.query(Document).filter(Document.status == "Verified").count()
    needs_review = db.query(Document).filter(Document.status == "Needs Review").count()
    duplicates_count = db.query(Duplicate).count()

    # Category breakdown
    category_results = db.query(
        Document.category, func.count(Document.id)
    ).group_by(Document.category).all()
    category_counts = {cat: count for cat, count in category_results}

    # Status breakdown
    status_results = db.query(
        Document.status, func.count(Document.id)
    ).group_by(Document.status).all()
    status_counts = {stat: count for stat, count in status_results}

    # Upload Trends - Grouped by Year-Month for the last 6 months
    # For SQLite, we can extract month name or formatted string.
    # To keep it database-agnostic, we can query dates and format them in Python!
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    recent_docs = db.query(Document.uploaded_at).filter(
        Document.uploaded_at >= six_months_ago
    ).all()

    # Accumulate by Month
    months_map = {}
    # Prefill last 6 months to guarantee values
    for i in range(5, -1, -1):
        dt = datetime.utcnow() - timedelta(days=i*30)
        month_name = dt.strftime("%b %Y")
        months_map[month_name] = 0

    for doc in recent_docs:
        m_name = doc.uploaded_at.strftime("%b %Y")
        if m_name in months_map:
            months_map[m_name] += 1
        else:
            months_map[m_name] = 1

    upload_trends = [{"month": k, "count": v} for k, v in months_map.items()]

    return DashboardStats(
        total_sources=total_sources,
        total_documents=total_documents,
        verified_documents=verified_documents,
        needs_review=needs_review,
        duplicates_count=duplicates_count,
        category_counts=category_counts,
        status_counts=status_counts,
        upload_trends=upload_trends
    )
