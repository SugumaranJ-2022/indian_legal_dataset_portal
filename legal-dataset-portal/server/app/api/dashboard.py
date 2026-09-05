from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Source, Document, Duplicate, Dataset, GapAnalysis
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
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    recent_docs = db.query(Document.uploaded_at).filter(
        Document.uploaded_at >= six_months_ago
    ).all()

    # Accumulate by Month
    months_map = {}
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

    # Calculate Research Stats Dynamically for Requirement 33
    datasets = db.query(Dataset).all()
    datasets_discovered = len(datasets)
    total_datasets_investigated = len(datasets)
    datasets_shortlisted = sum(1 for d in datasets if d.shortlisted)
    platforms_investigated = len(set(d.platform for d in datasets if d.platform))
    verified_datasets = sum(1 for d in datasets if d.provenance_status in ["Verified", "VERIFIED"])
    partially_verified_datasets = sum(1 for d in datasets if d.provenance_status in ["Partially Verified", "PARTIALLY_VERIFIED"])
    unverified_datasets = sum(1 for d in datasets if d.provenance_status in ["Unclear", "UNVERIFIED", "Not Verified"])
    
    provenance_verified = verified_datasets
    license_verified = sum(1 for d in datasets if d.license_status in ["Clear", "LICENSE_VERIFIED"])
    license_unclear = sum(1 for d in datasets if d.license_status in ["License Unclear", "LICENSE_UNCLEAR", "No License Found"])
    requires_review = sum(1 for d in datasets if d.status == "Under Review" or d.reuse_recommendation == "VERIFY FIRST")
    
    total_reported_records = sum(d.record_count or 0 for d in datasets)
    court_judgment_datasets_count = sum(1 for d in datasets if "Judgment" in (d.category or "") or "Court" in (d.category or ""))
    acts_rules_datasets_count = sum(1 for d in datasets if "Acts" in (d.category or "") or "Rules" in (d.category or "") or "Integrated" in (d.category or ""))
    nlp_datasets_count = sum(1 for d in datasets if "NLP" in (d.category or "") or "QA" in (d.category or "") or "Summarization" in (d.category or ""))
    multilingual_datasets_count = sum(1 for d in datasets if "Multilingual" in (d.category or "") or (d.languages and ("Hindi" in d.languages or "Regional" in d.languages or "Indic" in d.languages)))
    
    high_priority_gaps = db.query(GapAnalysis).filter(GapAnalysis.priority.in_(["Critical", "High", "Very High"])).count()
    recommended_new_collection_areas = [
        "District & Subordinate Court Certified Judgment PDFs",
        "Subordinate Rules, Gazette Notifications & Circulars",
        "Supreme Court Regional Language Translation Records",
        "Standardized Act -> Section -> Judgment Citation Graph",
        "CNR Identification & Document Hash Verification Chain"
    ]

    # Group by aggregations for research charts
    by_platform = {}
    by_category = {}
    by_provenance = {}
    by_license = {}
    by_freshness = {}
    by_availability = {
        "Full Original Documents": 0,
        "Extracted Text": 0,
        "Metadata Only": 0,
        "Mixed": 0,
        "Unknown": 0
    }

    for d in datasets:
        by_platform[d.platform] = by_platform.get(d.platform, 0) + 1
        by_category[d.category] = by_category.get(d.category, 0) + 1
        by_provenance[d.provenance_status] = by_provenance.get(d.provenance_status, 0) + 1
        by_license[d.license_status] = by_license.get(d.license_status, 0) + 1
        by_freshness[d.freshness_status] = by_freshness.get(d.freshness_status, 0) + 1
        
        # Availability classification logic
        if d.original_pdf_available or d.original_documents_available:
            by_availability["Full Original Documents"] += 1
        elif d.text_available and d.metadata_available:
            by_availability["Mixed"] += 1
        elif d.text_available:
            by_availability["Extracted Text"] += 1
        elif d.metadata_available:
            by_availability["Metadata Only"] += 1
        else:
            by_availability["Unknown"] += 1

    gap_priorities = {}
    gaps = db.query(GapAnalysis.priority).all()
    for g in gaps:
        gap_priorities[g.priority] = gap_priorities.get(g.priority, 0) + 1

    research_stats = {
        "datasets_discovered": datasets_discovered,
        "total_datasets_investigated": total_datasets_investigated,
        "datasets_shortlisted": datasets_shortlisted,
        "platforms_investigated": platforms_investigated,
        "verified_datasets": verified_datasets,
        "partially_verified_datasets": partially_verified_datasets,
        "unverified_datasets": unverified_datasets,
        "provenance_verified": provenance_verified,
        "license_verified": license_verified,
        "license_unclear": license_unclear,
        "requires_review": requires_review,
        "total_reported_records": total_reported_records,
        "total_reported_records_str": "135M+ reported records across investigated datasets",
        "records_qualification_note": "Reported records across investigated datasets (datasets may overlap; not unique legal documents)",
        "court_judgment_datasets_count": court_judgment_datasets_count,
        "acts_rules_datasets_count": acts_rules_datasets_count,
        "nlp_datasets_count": nlp_datasets_count,
        "multilingual_datasets_count": multilingual_datasets_count,
        "high_priority_gaps": high_priority_gaps,
        "recommended_new_collection_areas": recommended_new_collection_areas,
        "by_platform": by_platform,
        "by_category": by_category,
        "by_provenance": by_provenance,
        "by_license": by_license,
        "by_freshness": by_freshness,
        "by_availability": by_availability,
        "gap_priorities": gap_priorities,
        "final_decision_quote": "Existing datasets are sufficient to avoid immediately rebuilding large Supreme Court and High Court judgment archives. Existing sources should first be evaluated for reuse under their applicable licenses and terms. New collection should focus on areas where coverage, provenance, freshness, metadata quality, multilingual support, or document availability remains insufficient."
    }

    return DashboardStats(
        total_sources=total_sources,
        total_documents=total_documents,
        verified_documents=verified_documents,
        needs_review=needs_review,
        duplicates_count=duplicates_count,
        category_counts=category_counts,
        status_counts=status_counts,
        upload_trends=upload_trends,
        research_stats=research_stats
    )
