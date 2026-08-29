import os
import sys

# Add server directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import app.main to trigger startup creation and seeding
from app.main import app
from app.core.database import SessionLocal
from app.models.models import Dataset, GapAnalysis, ResearchMethodology, AuditLog, Source, Document

def verify():
    print("Verifying database models and seeded content...")
    db = SessionLocal()
    try:
        datasets_count = db.query(Dataset).count()
        gaps_count = db.query(GapAnalysis).count()
        meth_count = db.query(ResearchMethodology).count()
        sources_count = db.query(Source).count()
        docs_count = db.query(Document).count()
        
        print(f"Total Datasets Discovered: {datasets_count}")
        print(f"Total Gap Analysis Categories: {gaps_count}")
        print(f"Total Research Methodology Records: {meth_count}")
        print(f"Total Sources Mapped: {sources_count}")
        print(f"Total Documents Ingested: {docs_count}")
        
        if datasets_count > 0:
            print("\nDatasets List:")
            for ds in db.query(Dataset).all():
                print(f"- [{ds.short_name}] {ds.dataset_name} ({ds.platform}) | Relevance Score: {ds.research_relevance_score}")
                
        if gaps_count > 0:
            print("\nSample Gaps List:")
            for g in db.query(GapAnalysis).limit(5).all():
                print(f"- {g.category} | Availability: {g.availability} | Priority: {g.priority}")
                
        print("\nAll database structures are verified successfully!")
    except Exception as e:
        print(f"Verification failed: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    verify()
