from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.models import User, Source, Document, QualityCheck, Duplicate, CourtMetadata, Dataset, DatasetEvidence, GapAnalysis, ResearchSearchLog, ResearchMethodology, Annotation
from app.api import auth, sources, documents, quality, duplicates, court_metadata, reports, dashboard, audit, exports, datasets, gaps, research
from app.core.websocket import manager

# Create all database tables
Base.metadata.create_all(bind=engine)

# Dynamic Migration for existing DB
from sqlalchemy import text, or_

migrations = {
    "sources": [
        ("organization", "VARCHAR"),
        ("legal_information_type", "VARCHAR"),
        ("reliability_level", "VARCHAR DEFAULT 'Needs Review'"),
        ("verification_status", "VARCHAR DEFAULT 'Pending'"),
        ("description", "TEXT"),
        ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    ],
    "documents": [
        ("subcategory", "VARCHAR"),
        ("ministry_department", "VARCHAR"),
        ("file_type", "VARCHAR DEFAULT 'PDF'"),
        ("file_size", "INTEGER"),
        ("file_hash", "VARCHAR"),
        ("page_count", "INTEGER"),
        ("document_date", "DATE"),
        ("act_number", "VARCHAR"),
        ("case_number", "VARCHAR"),
        ("cnr_number", "VARCHAR"),
        ("court_name", "VARCHAR"),
        ("judges", "VARCHAR"),
        ("download_date", "DATE"),
        ("quality_status", "VARCHAR DEFAULT 'Pending'"),
        ("duplicate_status", "VARCHAR DEFAULT 'Not Duplicate'"),
        ("missing_pages_status", "VARCHAR DEFAULT 'No Issues'"),
        ("readability_status", "VARCHAR DEFAULT 'Readable'"),
        ("corruption_status", "VARCHAR DEFAULT 'Healthy'"),
        ("file_path", "VARCHAR"),
        ("created_by", "VARCHAR DEFAULT 'System'"),
        ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    ],
    "quality_checks": [
        ("correct_title", "BOOLEAN DEFAULT 0"),
        ("correct_authority", "BOOLEAN DEFAULT 0"),
        ("correct_year", "BOOLEAN DEFAULT 0"),
        ("correct_language", "BOOLEAN DEFAULT 0"),
        ("no_missing_pages", "BOOLEAN DEFAULT 0"),
        ("pdf_opens_correctly", "BOOLEAN DEFAULT 0"),
        ("no_obvious_corruption", "BOOLEAN DEFAULT 0"),
        ("not_duplicate", "BOOLEAN DEFAULT 0"),
        ("metadata_complete", "BOOLEAN DEFAULT 0"),
        ("exact_source_url_recorded", "BOOLEAN DEFAULT 0")
    ],
    "court_metadata": [
        ("registration_date", "DATE"),
        ("judgment_order_date", "DATE"),
        ("source", "VARCHAR"),
        ("source_url", "VARCHAR"),
        ("language", "VARCHAR"),
        ("verification_status", "VARCHAR DEFAULT 'Pending'"),
        ("notes", "TEXT")
    ],
    "audit_logs": [
        ("evidence_source", "VARCHAR"),
        ("notes", "TEXT")
    ],
    "datasets": [
        ("provenance_strength", "VARCHAR DEFAULT 'Medium'"),
        ("record_count_note", "VARCHAR"),
        ("reuse_recommendation", "VARCHAR DEFAULT 'STUDY ONLY'"),
        ("reuse_priority", "VARCHAR DEFAULT 'MEDIUM'"),
        ("source_url_status", "VARCHAR DEFAULT 'NOT_CHECKED'"),
        ("dataset_url_status", "VARCHAR DEFAULT 'NOT_CHECKED'"),
        ("license_url_status", "VARCHAR DEFAULT 'NOT_CHECKED'"),
        ("quality_notes", "TEXT"),
        ("contents", "TEXT")
    ]
}

with engine.connect() as conn:
    for table_name, cols in migrations.items():
        for col_name, col_type in cols:
            try:
                conn.execute(text(f"SELECT {col_name} FROM {table_name} LIMIT 1"))
            except Exception:
                try:
                    conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                    print(f"Migration: Added {col_name} to {table_name} table")
                except Exception as e:
                    print(f"Migration error for {table_name}.{col_name}: {e}")

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
    sample_files = ["sample_it_act_2000.pdf", "sample_court_judgment.pdf"]
    for filename in sample_files:
        src_path = None
        locs = [
            os.path.join(os.path.dirname(settings.BASE_DIR), filename),
            os.path.join(settings.BASE_DIR, filename),
            os.path.join(os.getcwd(), filename),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", filename),
        ]
        for loc in locs:
            if os.path.exists(loc):
                src_path = loc
                break
        
        if src_path:
            shutil.copy(src_path, os.path.join(settings.UPLOAD_DIR, filename))
            print(f"Seeded document: {filename} from {src_path}")
        else:
            print(f"Warning: Seed source file {filename} not found.")

    # Check if we already have sources seeded
    if db.query(Source).count() == 0:
        # 2. Seed Sources
        sources_list = [
            Source(
                website_name="India Code Portal",
                authority="Legislative Department, Ministry of Law & Justice",
                organization="Ministry of Law & Justice",
                category="Acts",
                source_type="Government",
                legal_information_type="Acts, Statutes",
                languages="English,Hindi",
                download_available=True,
                website_url="https://www.indiacode.nic.in",
                reliability_level="Authoritative",
                verification_status="Verified",
                description="Central repository of all Indian Central Acts and Statutes."
            ),
            Source(
                website_name="Gazette of India",
                authority="Department of Publication, Ministry of Housing & Urban Affairs",
                organization="Ministry of Housing & Urban Affairs",
                category="Rules",
                source_type="Government",
                legal_information_type="Rules, Regulations",
                languages="English,Hindi",
                download_available=True,
                website_url="https://egazette.gov.in",
                reliability_level="Authoritative",
                verification_status="Verified",
                description="Official gazette publication for notifications, rules, and regulations."
            ),
            Source(
                website_name="Supreme Court e-Courts Portal",
                authority="Supreme Court of India",
                organization="Supreme Court of India",
                category="Judgments",
                source_type="Supreme Court",
                legal_information_type="Judgments, Orders",
                languages="English",
                download_available=True,
                website_url="https://main.sci.gov.in",
                reliability_level="Authoritative",
                verification_status="Verified",
                description="Official judgment reporting engine for Supreme Court decisions."
            ),
            Source(
                website_name="Delhi High Court Registry",
                authority="Delhi High Court",
                organization="Delhi High Court",
                category="Metadata",
                source_type="High Court",
                legal_information_type="Metadata",
                languages="English",
                download_available=True,
                website_url="https://delhihighcourt.nic.in",
                reliability_level="Authoritative",
                verification_status="Verified",
                description="Delhi High Court case filing registry statistics."
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
            QualityCheck(document_id=doc_const.id, official_source=True, correct_title=True, correct_authority=True, correct_year=True, correct_language=True, complete_content=True, no_missing_pages=True, readable=True, pdf_opens_correctly=True, no_obvious_corruption=True, not_duplicate=True, metadata_complete=True, exact_source_url_recorded=True, duplicate_checked=True, version_verified=True, verification_status="Verified"),
            QualityCheck(document_id=doc_it.id, official_source=True, correct_title=True, correct_authority=True, correct_year=True, correct_language=True, complete_content=True, no_missing_pages=True, readable=True, pdf_opens_correctly=True, no_obvious_corruption=True, not_duplicate=True, metadata_complete=True, exact_source_url_recorded=True, duplicate_checked=True, version_verified=True, verification_status="Verified"),
            QualityCheck(document_id=doc_rules.id, official_source=True, correct_title=True, correct_authority=True, correct_year=True, correct_language=True, complete_content=False, no_missing_pages=True, readable=True, pdf_opens_correctly=True, no_obvious_corruption=True, not_duplicate=True, metadata_complete=False, exact_source_url_recorded=True, duplicate_checked=False, version_verified=False, verification_status="Needs Review"),
            QualityCheck(document_id=doc_kb.id, official_source=True, correct_title=True, correct_authority=True, correct_year=True, correct_language=True, complete_content=True, no_missing_pages=True, readable=True, pdf_opens_correctly=True, no_obvious_corruption=True, not_duplicate=True, metadata_complete=True, exact_source_url_recorded=True, duplicate_checked=True, version_verified=True, verification_status="Verified"),
            QualityCheck(document_id=doc_akg.id, official_source=True, correct_title=True, correct_authority=True, correct_year=True, correct_language=True, complete_content=True, no_missing_pages=True, readable=True, pdf_opens_correctly=True, no_obvious_corruption=True, not_duplicate=True, metadata_complete=True, exact_source_url_recorded=True, duplicate_checked=True, version_verified=True, verification_status="Verified"),
            QualityCheck(document_id=doc_dup.id, official_source=True, correct_title=True, correct_authority=True, correct_year=True, correct_language=True, complete_content=True, no_missing_pages=True, readable=True, pdf_opens_correctly=True, no_obvious_corruption=True, not_duplicate=False, metadata_complete=True, exact_source_url_recorded=True, duplicate_checked=True, version_verified=True, verification_status="Duplicate")
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

    # 7. Seed candidate Acts
    candidate_acts = [
        ("Bharatiya Nyaya Sanhita, 2023", "BNS-2023-SEED", 2023, "https://www.indiacode.nic.in/handle/123456789/20062"),
        ("Bharatiya Nagarik Suraksha Sanhita, 2023", "BNSS-2023-SEED", 2023, "https://www.indiacode.nic.in/handle/123456789/20063"),
        ("Bharatiya Sakshya Adhiniyam, 2023", "BSA-2023-SEED", 2023, "https://www.indiacode.nic.in/handle/123456789/20064"),
        ("Consumer Protection Act, 2019", "CPA-2019-SEED", 2019, "https://www.indiacode.nic.in/handle/123456789/15256"),
        ("Digital Personal Data Protection Act, 2023", "DPDPA-2023-SEED", 2023, "https://www.indiacode.nic.in/handle/123456789/20065"),
        ("Right to Information Act, 2005", "RTI-2005-SEED", 2005, "https://www.indiacode.nic.in/handle/123456789/1944"),
        ("Arbitration and Conciliation Act, 1996", "ACA-1996-SEED", 1996, "https://www.indiacode.nic.in/handle/123456789/1978"),
        ("Insolvency and Bankruptcy Code, 2016", "IBC-2016-SEED", 2016, "https://www.indiacode.nic.in/handle/123456789/2155"),
        ("Sexual Harassment of Women at Workplace Act, 2013", "POSH-2013-SEED", 2013, "https://www.indiacode.nic.in/handle/123456789/2104"),
        ("Real Estate (Regulation and Development) Act, 2016", "RERA-2016-SEED", 2016, "https://www.indiacode.nic.in/handle/123456789/2158")
    ]
    src_ic = db.query(Source).filter(Source.website_name == "India Code Portal").first()
    for title, code, year, url in candidate_acts:
        existing = db.query(Document).filter(
            or_(Document.document_code == code, Document.title == title)
        ).first()
        if not existing:
            new_doc = Document(
                document_code=code,
                title=title,
                year=year,
                category="Acts / Statutes",
                authority="Parliament of India",
                language="English",
                source_id=src_ic.id if src_ic else None,
                source_url=url,
                filename="pending_upload.pdf",
                status="Pending",
                quality_status="Pending",
                duplicate_status="Not Duplicate",
                notes="Automated candidate seed record (Pending Verification)."
            )
            db.add(new_doc)
            db.commit()
            db.refresh(new_doc)
            
            qc = QualityCheck(
                document_id=new_doc.id,
                official_source=False,
                correct_title=False,
                correct_authority=False,
                correct_year=False,
                correct_language=False,
                complete_content=False,
                no_missing_pages=False,
                readable=False,
                pdf_opens_correctly=False,
                no_obvious_corruption=False,
                not_duplicate=False,
                metadata_complete=False,
                exact_source_url_recorded=False,
                duplicate_checked=False,
                version_verified=False,
                verification_status="Pending"
            )
            db.add(qc)
            db.commit()

    # 7b. Seed Additional Sources, Verified Primary Documents & Questionable Audit Records
    extra_sources = [
        ("National Green Tribunal Registry", "National Green Tribunal", "Ministry of Environment, Forest and Climate Change", "Tribunals", "Tribunal", "Judgments, Orders", "English", "https://greentribunal.gov.in", "Authoritative", "Verified", "Official judicial decisions and orders of the National Green Tribunal benches."),
        ("Lok Sabha Secretariat Parliamentary Archive", "Parliament of India", "Lok Sabha Secretariat", "Parliamentary Debates", "Government", "Debates, Proceedings", "English,Hindi", "https://loksabha.nic.in", "Authoritative", "Verified", "Official digitized debates of the Constituent Assembly and Parliament of India.")
    ]
    for s_name, s_auth, s_org, s_cat, s_type, s_info, s_lang, s_url, s_rel, s_stat, s_desc in extra_sources:
        if not db.query(Source).filter(Source.website_name == s_name).first():
            db.add(Source(
                website_name=s_name, authority=s_auth, organization=s_org, category=s_cat,
                source_type=s_type, legal_information_type=s_info, languages=s_lang,
                download_available=True, website_url=s_url, reliability_level=s_rel,
                verification_status=s_stat, description=s_desc
            ))
    db.commit()

    src_ngt = db.query(Source).filter(Source.website_name == "National Green Tribunal Registry").first()
    src_gaz = db.query(Source).filter(Source.website_name == "Gazette of India").first()
    src_sc = db.query(Source).filter(Source.website_name == "Supreme Court e-Courts Portal").first()

    # Additional Primary Verified Documents
    extra_verified_docs = [
        {
            "document_code": "DOC-ACT-003",
            "title": "The Digital Personal Data Protection Act, 2023",
            "year": 2023,
            "category": "Acts / Statutes",
            "authority": "Parliament of India",
            "language": "English",
            "source_id": src_ic.id if src_ic else None,
            "source_url": "https://www.indiacode.nic.in/handle/123456789/20065",
            "filename": "sample_it_act_2000.pdf",
            "status": "Verified",
            "quality_status": "Verified",
            "duplicate_status": "Not Duplicate",
            "missing_pages_status": "No Issues",
            "readability_status": "Readable",
            "corruption_status": "Healthy",
            "notes": "India's comprehensive statutory framework for processing digital personal data, rights of data principals, and obligations of data fiduciaries."
        },
        {
            "document_code": "DOC-ACT-004",
            "title": "The Right to Information Act, 2005",
            "year": 2005,
            "category": "Acts / Statutes",
            "authority": "Parliament of India",
            "language": "English",
            "source_id": src_ic.id if src_ic else None,
            "source_url": "https://www.indiacode.nic.in/handle/123456789/1944",
            "filename": "sample_it_act_2000.pdf",
            "status": "Verified",
            "quality_status": "Verified",
            "duplicate_status": "Not Duplicate",
            "missing_pages_status": "No Issues",
            "readability_status": "Readable",
            "corruption_status": "Healthy",
            "notes": "Fundamental transparency statute empowering citizen oversight of public authorities and government decisions."
        },
        {
            "document_code": "DOC-REG-002",
            "title": "IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021",
            "year": 2021,
            "category": "Rules & Regulations",
            "authority": "Ministry of Electronics and IT",
            "language": "English",
            "source_id": src_gaz.id if src_gaz else None,
            "source_url": "https://www.meity.gov.in/content/information-technology-rules-2021",
            "filename": "sample_it_act_2000.pdf",
            "status": "Verified",
            "quality_status": "Verified",
            "duplicate_status": "Not Duplicate",
            "missing_pages_status": "No Issues",
            "readability_status": "Readable",
            "corruption_status": "Healthy",
            "notes": "Subordinate legislation regulating social media intermediaries, digital news publishers, and OTT streaming platforms."
        },
        {
            "document_code": "DOC-JUD-003",
            "title": "Maneka Gandhi v. Union of India",
            "year": 1978,
            "category": "Court Judgments",
            "authority": "Supreme Court of India",
            "language": "English",
            "source_id": src_sc.id if src_sc else None,
            "source_url": "https://indiankanoon.org/doc/1766147/",
            "filename": "sample_court_judgment.pdf",
            "status": "Verified",
            "quality_status": "Verified",
            "duplicate_status": "Not Duplicate",
            "missing_pages_status": "No Issues",
            "readability_status": "Readable",
            "corruption_status": "Healthy",
            "notes": "Landmark constitutional 7-judge bench ruling transforming Article 21 to mandate just, fair, and reasonable procedure."
        },
        {
            "document_code": "DOC-TRIB-001",
            "title": "Forward Foundation v. State of Karnataka (Bellandur Lake Matter)",
            "year": 2015,
            "category": "Tribunal Orders",
            "authority": "National Green Tribunal (Principal Bench)",
            "language": "English",
            "source_id": src_ngt.id if src_ngt else None,
            "source_url": "https://greentribunal.gov.in/judgment/forward-foundation-2015",
            "filename": "sample_court_judgment.pdf",
            "status": "Verified",
            "quality_status": "Verified",
            "duplicate_status": "Not Duplicate",
            "missing_pages_status": "No Issues",
            "readability_status": "Readable",
            "corruption_status": "Healthy",
            "notes": "Pivotal environmental jurisprudence creating mandatory buffer zones around wetland and lake ecosystems in Bangalore."
        }
    ]

    for d_data in extra_verified_docs:
        if not db.query(Document).filter(Document.document_code == d_data["document_code"]).first():
            doc = Document(**d_data)
            db.add(doc)
            db.commit()
            db.refresh(doc)
            qc = QualityCheck(
                document_id=doc.id,
                official_source=True,
                correct_title=True,
                correct_authority=True,
                correct_year=True,
                correct_language=True,
                complete_content=True,
                no_missing_pages=True,
                readable=True,
                pdf_opens_correctly=True,
                no_obvious_corruption=True,
                not_duplicate=True,
                metadata_complete=True,
                exact_source_url_recorded=True,
                duplicate_checked=True,
                version_verified=True,
                verification_status="Verified"
            )
            db.add(qc)
            db.commit()

    # Additional Audited Questionable Documents (Covering all 12 issue filter reasons)
    extra_questionable_docs = [
        {
            "document_code": "DOC-QUES-001",
            "title": "State of Bombay v. F.N. Balsara (Historical Scan)",
            "year": 1951,
            "category": "Court Judgments",
            "authority": "Supreme Court of India",
            "language": "English",
            "source_id": src_sc.id if src_sc else None,
            "source_url": "https://indiankanoon.org/doc/1824982/",
            "filename": "sample_court_judgment.pdf",
            "status": "Needs Review",
            "quality_status": "Needs Review",
            "duplicate_status": "Not Duplicate",
            "missing_pages_status": "No Issues",
            "readability_status": "Needs Review",
            "corruption_status": "Healthy",
            "notes": "OCR extraction failure: Historical 1951 scanned pages 12-18 contain severe pixel degradation and unreadable typography."
        },
        {
            "document_code": "DOC-QUES-002",
            "title": "National Tariff Policy Draft Revision Rules (2020)",
            "year": 2020,
            "category": "Rules & Regulations",
            "authority": "Ministry of Power",
            "language": "English",
            "source_id": src_gaz.id if src_gaz else None,
            "source_url": "https://egazette.gov.in/mirror/corrupt_download",
            "filename": "sample_it_act_2000.pdf",
            "status": "Needs Review",
            "quality_status": "Needs Review",
            "duplicate_status": "Not Duplicate",
            "missing_pages_status": "No Issues",
            "readability_status": "Readable",
            "corruption_status": "Corrupted",
            "notes": "Broken file: Corrupted PDF stream caused by truncated HTTP connection from ministry download mirror."
        },
        {
            "document_code": "DOC-QUES-003",
            "title": "Solid Waste Management Guidelines & Gazette Annexures",
            "year": 2016,
            "category": "Rules & Regulations",
            "authority": "Ministry of Environment, Forest and Climate Change",
            "language": "English",
            "source_id": src_gaz.id if src_gaz else None,
            "source_url": "https://egazette.gov.in/gazette/swm_2016",
            "filename": "sample_it_act_2000.pdf",
            "status": "Needs Review",
            "quality_status": "Needs Review",
            "duplicate_status": "Not Duplicate",
            "missing_pages_status": "Missing Pages",
            "readability_status": "Readable",
            "corruption_status": "Healthy",
            "notes": "Missing pages: Official notification schedules III and IV are absent from scanned gazette upload."
        },
        {
            "document_code": "DOC-QUES-004",
            "title": "Unverified Commercial Digest of High Court Decisions (1982)",
            "year": 1982,
            "category": "Court Judgments",
            "authority": "Unknown Aggregator",
            "language": "English",
            "source_id": None,
            "source_url": "",
            "filename": "sample_court_judgment.pdf",
            "status": "Needs Review",
            "quality_status": "Needs Review",
            "duplicate_status": "Not Duplicate",
            "missing_pages_status": "No Issues",
            "readability_status": "Readable",
            "corruption_status": "Healthy",
            "notes": "Unknown source origin: Uploaded from third-party commercial aggregator with stripped provenance and unclear license rights."
        }
    ]

    for q_data in extra_questionable_docs:
        if not db.query(Document).filter(Document.document_code == q_data["document_code"]).first():
            doc = Document(**q_data)
            db.add(doc)
            db.commit()
            db.refresh(doc)
            qc = QualityCheck(
                document_id=doc.id,
                official_source=q_data["source_url"] != "",
                correct_title=True,
                correct_authority=q_data["authority"] != "Unknown Aggregator",
                correct_year=True,
                correct_language=True,
                complete_content=q_data["missing_pages_status"] == "No Issues",
                no_missing_pages=q_data["missing_pages_status"] == "No Issues",
                readable=q_data["readability_status"] == "Readable",
                pdf_opens_correctly=q_data["corruption_status"] != "Corrupted",
                no_obvious_corruption=q_data["corruption_status"] != "Corrupted",
                not_duplicate=True,
                metadata_complete=False,
                exact_source_url_recorded=bool(q_data["source_url"]),
                duplicate_checked=True,
                version_verified=False,
                verification_status="Needs Review"
            )
            db.add(qc)
            db.commit()

    # Court Metadata for DOC-JUD-003 and DOC-TRIB-001
    doc_mg = db.query(Document).filter(Document.document_code == "DOC-JUD-003").first()
    if doc_mg and not db.query(CourtMetadata).filter(CourtMetadata.document_id == doc_mg.id).first():
        db.add(CourtMetadata(
            document_id=doc_mg.id,
            cnr_number="DLHC010000211978",
            case_number="Writ Petition (Civil) No. 231 of 1977",
            court="Supreme Court of India",
            state="Delhi",
            district="New Delhi",
            judge="M.H. Beg, C.J., Y.V. Chandrachud, P.N. Bhagwati, V.R. Krishna Iyer, N.L. Untwalia, S. Murtaza Fazal Ali, P.S. Kailasam",
            case_status="Disposed",
            notes="Landmark judgment establishing substantive due process under Article 21."
        ))
        db.commit()

    doc_trib = db.query(Document).filter(Document.document_code == "DOC-TRIB-001").first()
    if doc_trib and not db.query(CourtMetadata).filter(CourtMetadata.document_id == doc_trib.id).first():
        db.add(CourtMetadata(
            document_id=doc_trib.id,
            cnr_number="NGT0010000892015",
            case_number="Original Application No. 222 of 2014",
            court="National Green Tribunal (Principal Bench)",
            state="Karnataka",
            district="Bangalore Urban",
            judge="Justice Swatanter Kumar (Chairperson)",
            case_status="Disposed",
            notes="Directions issued regarding buffer zones of lakes and rajakaluves."
        ))
        db.commit()

    # Annotations on DOC-JUD-003 and DOC-ACT-003
    if doc_mg and db.query(Annotation).filter(Annotation.document_id == doc_mg.id).count() == 0:
        db.add(Annotation(
            document_id=doc_mg.id,
            page_number=1,
            text="Key holding: Article 21 requires that any procedure depriving personal liberty must be just, fair, and reasonable, satisfying Articles 14 and 19.",
            author="Senior Legal Researcher",
            created_at=datetime.utcnow()
        ))
        db.commit()

    doc_dpdp = db.query(Document).filter(Document.document_code == "DOC-ACT-003").first()
    if doc_dpdp and db.query(Annotation).filter(Annotation.document_id == doc_dpdp.id).count() == 0:
        db.add(Annotation(
            document_id=doc_dpdp.id,
            page_number=4,
            text="Section 6 establishes strict requirements for verifiable parental consent prior to processing personal data of children.",
            author="Regulatory Compliance Specialist",
            created_at=datetime.utcnow()
        ))
        db.commit()

    # 8. Seed/Upsert Researched Datasets
    from app.core.seed_data import researched_datasets, gap_categories

    for ds_data in researched_datasets:
        existing = db.query(Dataset).filter(
            or_(Dataset.short_name == ds_data["short_name"], Dataset.dataset_name == ds_data["dataset_name"])
        ).first()
        if existing:
            for k, v in ds_data.items():
                setattr(existing, k, v)
        else:
            db.add(Dataset(**ds_data))
    db.commit()

    # Seed Evidence for datasets if missing
    evidence_seeds = [
        ("SC-AWS-OpenData", "Official Source", "AWS Open Data Registry Listing", "https://registry.opendata.aws/indian-supreme-court-judgments/", "AWS Open Data Registry metadata page detailing hosting parameters.", "Direct S3 access details: s3://indian-supreme-court-judgments. Hosted by Dattam Labs.", "Verified AWS bucket accessibility."),
        ("IndiaCode-CentralActs", "Official Government Portal", "India Code Legislative Repository", "https://www.indiacode.nic.in", "Official central acts database maintained by Legislative Department.", "Authenticated under the National Informatics Centre digital signature framework.", "Verified official ministry portal."),
        ("LegalEval-2023", "Academic Benchmark", "SemEval-2023 Task 6 Proceedings", "https://huggingface.co/datasets/law-ai/legal-eval-2023", "ACL Anthology publication documenting multi-annotator legal NER and rhetorical roles.", "Inter-annotator Cohen kappa agreement of 0.82 across 1,480 decisions.", "Verified gold standard NLP benchmark."),
        ("OpenNYAI-LegalNER", "Open-Source Repository", "OpenNYAI Hugging Face Checkpoint", "https://huggingface.co/datasets/opennyai/ner", "Comprehensive entity span extraction dataset covering 45,000+ annotations.", "Verified spaCy-compatible annotations with CC BY 4.0 license.", "Verified open license and entity spans."),
        ("CAD-India-Debates", "Institutional Archive", "CADIndia CLPR Digital Collection", "https://www.constitutionofindia.net", "Digitized debates of the Constituent Assembly of India (1946-1950).", "12 volumes cross-referenced against Lok Sabha Secretariat official records.", "Verified historical primary source.")
    ]
    for ds_sname, s_type, s_title, s_url, s_desc, s_text, s_notes in evidence_seeds:
        ds_obj = db.query(Dataset).filter(Dataset.short_name == ds_sname).first()
        if ds_obj and db.query(DatasetEvidence).filter(DatasetEvidence.dataset_id == ds_obj.id).count() == 0:
            db.add(DatasetEvidence(
                dataset_id=ds_obj.id,
                source_type=s_type,
                source_title=s_title,
                source_url=s_url,
                source_description=s_desc,
                evidence_text=s_text,
                verified=True,
                reviewer="Senior Researcher",
                verified_at=datetime.utcnow(),
                notes=s_notes
            ))
    db.commit()

    # 9. Seed/Upsert Gap Analysis Categories & Comparison Matrix
    for cat_item in gap_categories:
        category, availability, quality, coverage, current_state, gap, priority, recommendation, evidence = cat_item
        existing_gap = db.query(GapAnalysis).filter(GapAnalysis.category == category).first()
        if existing_gap:
            existing_gap.availability = availability
            existing_gap.quality = quality
            existing_gap.coverage = coverage
            existing_gap.current_state = current_state
            existing_gap.gap = gap
            existing_gap.priority = priority
            existing_gap.recommendation = recommendation
            existing_gap.evidence = evidence
        else:
            db.add(GapAnalysis(
                category=category,
                availability=availability,
                quality=quality,
                coverage=coverage,
                current_state=current_state,
                gap=gap,
                priority=priority,
                recommendation=recommendation,
                evidence=evidence
            ))
    db.commit()

    # 10. Seed default methodology
    if db.query(ResearchMethodology).count() == 0:
        db.add(
            ResearchMethodology(
                platform_searched="AWS Open Data, Hugging Face, GitHub, Zenodo, Dev Data Lab",
                search_date=datetime.utcnow().date(),
                search_terms="Indian legal judgments, central acts, e-courts, legal NLP, InLegalNER",
                categories_investigated="Acts, Rules, Supreme Court judgments, High Court judgments, District Court case files, legal annotations",
                selection_criteria="Credible public datasets containing metadata, annotations, or texts representing Indian legal data.",
                exclusion_criteria="Unofficial blogs, paid portals without open documentation, synthetic datasets with unverified accuracy.",
                verification_process="Manual inspection of repository URLs, verification of license terms, and matching sample records with official courts."
            )
        )
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
app.include_router(audit.router, prefix=f"{settings.API_V1_STR}/audit-logs", tags=["Audit Logs"])
app.include_router(exports.router, prefix=f"{settings.API_V1_STR}/exports", tags=["Exports"])
app.include_router(datasets.router, prefix=f"{settings.API_V1_STR}/datasets", tags=["Dataset Research"])
app.include_router(gaps.router, prefix=f"{settings.API_V1_STR}/gaps", tags=["Gap Analysis"])
app.include_router(research.router, prefix=f"{settings.API_V1_STR}/research", tags=["Research Audit Log"])

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

# Serve static frontend build if it exists
client_dist = os.path.join(settings.BASE_DIR, "client", "dist")
if os.path.exists(client_dist):
    app.mount("/", StaticFiles(directory=client_dist, html=True), name="frontend")
else:
    @app.get("/")
    def read_root():
        return {"message": "Welcome to the Indian Legal Dataset Research Portal API"}
