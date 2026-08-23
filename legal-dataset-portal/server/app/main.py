from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.models import User, Source, Document, QualityCheck, Duplicate, CourtMetadata
from app.api import auth, sources, documents, quality, duplicates, court_metadata, reports, dashboard
from app.core.websocket import manager

# Create all database tables
Base.metadata.create_all(bind=engine)

# Dynamic Migration for existing DB
from sqlalchemy import text
with engine.connect() as conn:
    # Check text_content column
    try:
        conn.execute(text("SELECT text_content FROM documents LIMIT 1"))
    except Exception:
        try:
            conn.execute(text("ALTER TABLE documents ADD COLUMN text_content TEXT"))
            conn.commit()
            print("Migration: Added text_content to documents table")
        except Exception as e:
            print(f"Migration text_content error: {e}")
    
    # Check ai_summary column
    try:
        conn.execute(text("SELECT ai_summary FROM documents LIMIT 1"))
    except Exception:
        try:
            conn.execute(text("ALTER TABLE documents ADD COLUMN ai_summary TEXT"))
            conn.commit()
            print("Migration: Added ai_summary to documents table")
        except Exception as e:
            print(f"Migration ai_summary error: {e}")

def seed_database(db: Session):
    # 1. Seed researcher user
    default_email = "researcher@legalportal.in"
    user = db.query(User).filter(User.email == default_email).first()
    if not user:
        new_user = User(
            name="Senior Researcher",
            email=default_email,
            password_hash=get_password_hash("Password123"),
            role="researcher"
        )
        db.add(new_user)
        db.commit()

    # Ensure uploads folder exists and copy sample files
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    desktop_it_act = "c:/Users/Welcome/Desktop/Ai_Task_1/sample_it_act_2000.pdf"
    desktop_judgment = "c:/Users/Welcome/Desktop/Ai_Task_1/sample_court_judgment.pdf"
    
    if os.path.exists(desktop_it_act):
        shutil.copy(desktop_it_act, os.path.join(settings.UPLOAD_DIR, "sample_it_act_2000.pdf"))
    if os.path.exists(desktop_judgment):
        shutil.copy(desktop_judgment, os.path.join(settings.UPLOAD_DIR, "sample_court_judgment.pdf"))

    # Check if we already have sources seeded
    if db.query(Source).count() == 0:
        # 2. Seed Sources
        sources_list = [
            Source(
                website_name="India Code Portal",
                authority="Legislative Department, Ministry of Law & Justice",
                category="Acts",
                source_type="Official",
                languages="English,Hindi",
                download_available=True,
                website_url="https://www.indiacode.nic.in",
                notes="Central repository of all Indian Central Acts and Statutes."
            ),
            Source(
                website_name="Gazette of India",
                authority="Department of Publication, Ministry of Housing & Urban Affairs",
                category="Rules",
                source_type="Official",
                languages="English,Hindi",
                download_available=True,
                website_url="https://egazette.gov.in",
                notes="Official gazette publication for notifications, rules, and regulations."
            ),
            Source(
                website_name="Supreme Court e-Courts Portal",
                authority="Supreme Court of India",
                category="Judgments",
                source_type="Official",
                languages="English",
                download_available=True,
                website_url="https://main.sci.gov.in",
                notes="Official judgment reporting engine for Supreme Court decisions."
            ),
            Source(
                website_name="Delhi High Court Registry",
                authority="Delhi High Court",
                category="Metadata",
                source_type="Official",
                languages="English",
                download_available=True,
                website_url="https://delhihighcourt.nic.in",
                notes="Delhi High Court case filing registry statistics."
            )
        ]
        for src in sources_list:
            db.add(src)
        db.commit()

        # 3. Seed Documents
        src_ic = db.query(Source).filter(Source.website_name == "India Code Portal").first()
        src_gaz = db.query(Source).filter(Source.website_name == "Gazette of India").first()
        src_sc = db.query(Source).filter(Source.website_name == "Supreme Court e-Courts Portal").first()

        docs_list = [
            Document(
                document_code="DOC-ACT-001",
                title="The Constitution of India, 1950",
                year=1950,
                category="Acts / Statutes",
                authority="Parliament of India",
                language="English",
                source_url="https://legislative.gov.in/constitution-of-india/",
                filename="sample_it_act_2000.pdf",
                source_id=src_ic.id if src_ic else None,
                status="Verified",
                notes="Seeded sample: Fundamental law of India, including rights and directive principles."
            ),
            Document(
                document_code="DOC-ACT-002",
                title="The Information Technology Act, 2000",
                year=2000,
                category="Acts / Statutes",
                authority="Ministry of Electronics and IT",
                language="English",
                source_url="https://www.meity.gov.in/content/information-technology-act-2000",
                filename="sample_it_act_2000.pdf",
                source_id=src_ic.id if src_ic else None,
                status="Verified",
                notes="Primary Indian law dealing with cybercrime and electronic commerce."
            ),
            Document(
                document_code="DOC-REG-001",
                title="IT (Procedure and Safeguards for Interception) Rules, 2009",
                year=2009,
                category="Rules & Regulations",
                authority="Ministry of Electronics and IT",
                language="English",
                source_url="https://www.meity.gov.in/content/information-technology-rules-2009",
                filename="sample_it_act_2000.pdf",
                source_id=src_gaz.id if src_gaz else None,
                status="Needs Review",
                notes="Seeded sample: Rules governing technical interception parameters."
            ),
            Document(
                document_code="DOC-JUD-001",
                title="Kesavananda Bharati v. State of Kerala",
                year=1973,
                category="Court Judgments",
                authority="Supreme Court of India",
                language="English",
                source_url="https://indiankanoon.org/doc/257876/",
                filename="sample_court_judgment.pdf",
                source_id=src_sc.id if src_sc else None,
                status="Verified",
                notes="Landmark judgment outlining the basic structure doctrine of the Constitution."
            ),
            Document(
                document_code="DOC-JUD-002",
                title="A.K. Gopalan v. State of Madras",
                year=1950,
                category="Court Judgments",
                authority="Supreme Court of India",
                language="English",
                source_url="https://indiankanoon.org/doc/1857950/",
                filename="sample_court_judgment.pdf",
                source_id=src_sc.id if src_sc else None,
                status="Verified",
                notes="Seeded sample: Landmark preventive detention writ petition judgment."
            ),
            Document(
                document_code="DOC-DUP-001",
                title="The Information Technology Act, 2000 (Copy)",
                year=2000,
                category="Acts / Statutes",
                authority="Ministry of Electronics and IT",
                language="English",
                source_url="https://www.meity.gov.in/content/information-technology-act-2000",
                filename="sample_it_act_2000.pdf",
                source_id=src_ic.id if src_ic else None,
                status="Duplicate",
                notes="Duplicate file test record matching title and file content parameters."
            )
        ]
        for doc in docs_list:
            db.add(doc)
        db.commit()

        # Fetch doc references
        doc_const = db.query(Document).filter(Document.document_code == "DOC-ACT-001").first()
        doc_it = db.query(Document).filter(Document.document_code == "DOC-ACT-002").first()
        doc_rules = db.query(Document).filter(Document.document_code == "DOC-REG-001").first()
        doc_kb = db.query(Document).filter(Document.document_code == "DOC-JUD-001").first()
        doc_akg = db.query(Document).filter(Document.document_code == "DOC-JUD-002").first()
        doc_dup = db.query(Document).filter(Document.document_code == "DOC-DUP-001").first()

        # 4. Seed Quality Checks
        qc_list = [
            QualityCheck(document_id=doc_const.id, official_source=True, readable=True, complete_content=True, metadata_correct=True, duplicate_checked=True, version_verified=True, verification_status="Verified"),
            QualityCheck(document_id=doc_it.id, official_source=True, readable=True, complete_content=True, metadata_correct=True, duplicate_checked=True, version_verified=True, verification_status="Verified"),
            QualityCheck(document_id=doc_rules.id, official_source=True, readable=True, complete_content=False, metadata_correct=True, duplicate_checked=False, version_verified=False, verification_status="Needs Review"),
            QualityCheck(document_id=doc_kb.id, official_source=True, readable=True, complete_content=True, metadata_correct=True, duplicate_checked=True, version_verified=True, verification_status="Verified"),
            QualityCheck(document_id=doc_akg.id, official_source=True, readable=True, complete_content=True, metadata_correct=True, duplicate_checked=True, version_verified=True, verification_status="Verified"),
            QualityCheck(document_id=doc_dup.id, official_source=True, readable=True, complete_content=True, metadata_correct=True, duplicate_checked=True, version_verified=True, verification_status="Duplicate")
        ]
        for qc in qc_list:
            db.add(qc)

        # 5. Seed Duplicate Record
        dup_record = Duplicate(
            document_id=doc_dup.id,
            duplicate_document_id=doc_it.id,
            reason="Matches existing document 'The Information Technology Act, 2000' (ID: DOC-ACT-002) by title and filename",
            action="Needs Review",
            status="Pending"
        )
        db.add(dup_record)

        # 6. Seed Court Metadata
        cm_list = [
            CourtMetadata(
                document_id=doc_kb.id,
                cnr_number="KLHC010001731973",
                case_number="Writ Petition (Civil) No. 135 of 1970",
                court="Supreme Court of India",
                state="Kerala",
                district="Trivandrum",
                judge="S.M. Sikri, C.J. and J.M. Shelat, K.S. Hegde, A.N. Grover, B. Jaganmohan Reddy, D.G. Palekar, H.R. Khanna, A.K. Mukherjee, Y.V. Chandrachud, A.N. Ray, D.G. Palekar, H.R. Khanna, K.K. Mathew, M.H. Beg, S.N. Dwivedi",
                case_status="Disposed"
            ),
            CourtMetadata(
                document_id=doc_akg.id,
                cnr_number="TNHC010000501950",
                case_number="Writ Petition No. 1 of 1950",
                court="Supreme Court of India",
                state="Tamil Nadu",
                district="Madras",
                judge="Harilal Kania, C.J. and M. Patanjali Sastri, Mehr Chand Mahajan, B.K. Mukherjea, Sudhi Ranjan Das, S. Fazl Ali",
                case_status="Disposed"
            )
        ]
        for cm in cm_list:
            db.add(cm)

        db.commit()

# Seed database on startup
db_session = SessionLocal()
try:
    seed_database(db_session)
finally:
    db_session.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(sources.router, prefix=f"{settings.API_V1_STR}/sources", tags=["Sources"])
app.include_router(documents.router, prefix=f"{settings.API_V1_STR}/documents", tags=["Documents"])
app.include_router(quality.router, prefix=f"{settings.API_V1_STR}/quality", tags=["Quality Verification"])
app.include_router(duplicates.router, prefix=f"{settings.API_V1_STR}/duplicates", tags=["Duplicates Detection"])
app.include_router(court_metadata.router, prefix=f"{settings.API_V1_STR}/court-metadata", tags=["Court Metadata"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])

# Mount uploads static files
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Indian Legal Dataset Research Portal API"}
