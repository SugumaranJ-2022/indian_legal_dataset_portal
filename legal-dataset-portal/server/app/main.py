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
from app.models.models import User, Source, Document, QualityCheck, Duplicate, CourtMetadata, Dataset, DatasetEvidence, GapAnalysis, ResearchSearchLog, ResearchMethodology
from app.api import auth, sources, documents, quality, duplicates, court_metadata, reports, dashboard, audit, exports, datasets, gaps, research
from app.core.websocket import manager

# Create all database tables
Base.metadata.create_all(bind=engine)

# Dynamic Migration for existing DB
from sqlalchemy import text

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
        ("Consumer Protection Act, 2019", "CPA-2019-SEED", 2019, "https://www.indiacode.nic.in/handle/123456789/15256")
    ]
    src_ic = db.query(Source).filter(Source.website_name == "India Code Portal").first()
    for title, code, year, url in candidate_acts:
        existing = db.query(Document).filter(
            (Document.document_code == code) | (Document.title == title)
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

    # 8. Seed Datasets
    if db.query(Dataset).count() == 0:
        datasets_list = [
            # Dataset 1
            Dataset(
                dataset_name="Indian Supreme Court Judgments (AWS Open Data)",
                short_name="SC-AWS-OpenData",
                description="Bulk, machine-readable dataset of all judgments delivered by the Supreme Court of India from 1950 to 2025. Partitioned by year with Parquet metadata.",
                platform="AWS Open Data",
                dataset_url="https://registry.opendata.aws/indian-supreme-court-judgments/",
                creator="Dattam Labs",
                organization="AWS Open Data Sponsorship Program",
                category="Court Judgments",
                subcategory="Supreme Court",
                legal_domain="Supreme Court",
                dataset_type="Community Dataset",
                record_count=75000,
                record_count_source="AWS Open Data Registry Metadata",
                time_period_start="1950",
                time_period_end="2025",
                coverage_description="Judgments delivered by the Supreme Court of India.",
                courts="Supreme Court of India",
                jurisdictions="Federal / National",
                states="All States",
                languages="English",
                format="Parquet / JSON",
                file_types="Parquet",
                data_structure="Tabular Parquet partitioned by year",
                text_available=True,
                metadata_available=True,
                metadata_fields="case_number,judgment_date,court_name,judges,judgment_text",
                original_documents_available=False,
                original_pdf_available=False,
                ocr_available=False,
                structured_data_available=True,
                original_source="Supreme Court of India e-Courts Portal",
                original_source_url="https://main.sci.gov.in",
                collection_method="Automated scraping of e-Courts",
                collection_description="Daily synchronization script fetching judgments from main.sci.gov.in.",
                provenance_status="Verified",
                provenance_notes="Sourced directly from the official Supreme Court website by Dattam Labs.",
                license_name="CDLA-Sharing 1.0",
                license_url="https://cdla.dev/sharing-1-0/",
                license_status="Clear",
                commercial_use=True,
                redistribution_allowed=True,
                attribution_required=True,
                derivative_use=True,
                license_notes="Community Data License Agreement - Sharing. Highly suitable for LLM tuning.",
                freshness_status="Fresh",
                documentation_quality="Medium",
                metadata_quality="High",
                completeness_assessment="High coverage of published judgments.",
                data_quality_assessment="Clean text parsing, minor issues with case number normalization.",
                limitations="Does not contain case files, pleadings, or original PDFs, only text.",
                reuse_classification="Potentially Reusable",
                reuse_reason="Authoritative provenance, clear open data license, large scale.",
                research_relevance_score=92,
                recommendation="Use as the primary source for training Supreme Court models.",
                why_selected="Largest free open-source database of Supreme Court rulings.",
                status="Verified",
                shortlisted=True,
                shortlist_reason="Primary open database for Supreme Court judgments.",
                shortlist_rank=1
            ),
            # Dataset 2
            Dataset(
                dataset_name="Indian High Court Judgments (AWS Open Data)",
                short_name="HC-AWS-OpenData",
                description="Bulk, machine-readable dataset of all judgments delivered by the 25 High Courts of India from 1950 to 2025. Approximately 16 million records.",
                platform="AWS Open Data",
                dataset_url="https://registry.opendata.aws/indian-high-court-judgments/",
                creator="Dattam Labs",
                organization="AWS Open Data Sponsorship Program",
                category="Court Judgments",
                subcategory="High Courts",
                legal_domain="High Courts",
                dataset_type="Community Dataset",
                record_count=16000000,
                record_count_source="AWS Registry Description",
                time_period_start="1950",
                time_period_end="2025",
                coverage_description="All 25 High Courts of India.",
                courts="25 High Courts",
                jurisdictions="State / High Court",
                states="All States",
                languages="English,Hindi,Regional",
                format="Parquet / JSON",
                file_types="Parquet",
                data_structure="Tabular Parquet partitioned by court",
                text_available=True,
                metadata_available=True,
                metadata_fields="case_number,judgment_date,court_name,judges,judgment_text",
                original_documents_available=False,
                original_pdf_available=False,
                ocr_available=False,
                structured_data_available=True,
                original_source="e-Courts High Court Portal",
                original_source_url="https://hcservices.ecourts.gov.in",
                collection_method="Automated scraping of e-Courts High Court services",
                provenance_status="Verified",
                provenance_notes="Sourced directly from e-Courts platform.",
                license_name="CDLA-Sharing 1.0",
                license_url="https://cdla.dev/sharing-1-0/",
                license_status="Clear",
                commercial_use=True,
                redistribution_allowed=True,
                attribution_required=True,
                derivative_use=True,
                freshness_status="Fresh",
                documentation_quality="Medium",
                metadata_quality="Medium",
                completeness_assessment="Covers most High Courts, though some state registries have missing periods.",
                limitations="Large storage requirements (~1.25 TiB). Missing case details.",
                reuse_classification="Potentially Reusable",
                reuse_reason="Massive scale, clear licensing, authoritative source.",
                research_relevance_score=95,
                recommendation="Primary corpus for general Indian legal NLP research.",
                why_selected="Largest High Court case corpus in existence.",
                status="Verified",
                shortlisted=True,
                shortlist_reason="Primary corpus for general High Court case law.",
                shortlist_rank=2
            ),
            # Dataset 3
            Dataset(
                dataset_name="Indian Legal Documents Corpus (ILDC)",
                short_name="ILDC-Academic",
                description="A corpus of 35,000 Supreme Court judgments annotated with decision outcomes and gold explanations, designed for CJPE research.",
                platform="GitHub",
                dataset_url="https://github.com/Exploration-Lab/CJPE",
                creator="IIT Kharagpur & IIT Kanpur",
                organization="Indian Institute of Technology",
                category="Court Judgments",
                subcategory="Supreme Court",
                legal_domain="Supreme Court",
                dataset_type="Research Dataset",
                record_count=35000,
                record_count_source="ILDC Research Paper",
                time_period_start="1951",
                time_period_end="2020",
                coverage_description="Curated Supreme Court judgments with decision outcome annotations.",
                courts="Supreme Court of India",
                jurisdictions="Federal / National",
                languages="English",
                format="JSON / CSV",
                file_types="JSON",
                data_structure="Nested JSON records with text and annotations",
                text_available=True,
                metadata_available=True,
                metadata_fields="judgment_text,outcome,explanation",
                original_documents_available=False,
                original_pdf_available=False,
                ocr_available=False,
                structured_data_available=True,
                original_source="Supreme Court of India",
                original_source_url="https://main.sci.gov.in",
                collection_method="Manually curated and annotated subset",
                provenance_status="Partially Verified",
                license_name="CC BY-NC-SA 4.0",
                license_url="https://creativecommons.org/licenses/by-nc-sa/4.0/",
                license_status="Academic/Research Use",
                commercial_use=False,
                redistribution_allowed=True,
                attribution_required=True,
                derivative_use=True,
                license_notes="Non-commercial restriction prohibits usage in proprietary commercial services.",
                freshness_status="Aging",
                documentation_quality="High",
                metadata_quality="High",
                completeness_assessment="Excellent label accuracy but limited document count and year range.",
                limitations="Academic CC license limits commercial distribution.",
                reuse_classification="Research / Benchmarking",
                reuse_reason="Curated outcomes and explanations are valuable for model evaluation/benchmarking.",
                research_relevance_score=75,
                recommendation="Use for legal NLP benchmark testing and evaluation.",
                why_selected="Contains high-quality gold standards for judgment outcome classification.",
                status="Verified",
                shortlisted=True,
                shortlist_reason="Gold standard annotations for decision outcomes.",
                shortlist_rank=3
            ),
            # Dataset 4
            Dataset(
                dataset_name="InLegalNER Dataset",
                short_name="InLegalNER",
                description="Benchmark dataset of court judgments annotated for legal named entities (e.g. JUDGE, RESPONDENT, LAWYER, STATUTE).",
                platform="Hugging Face",
                dataset_url="https://huggingface.co/datasets/opennyaiorg/InLegalNER",
                creator="OpenNyAI Mission",
                organization="EkStep Foundation",
                category="Court Metadata",
                subcategory="Legal NLP",
                legal_domain="NLP Annotations",
                dataset_type="Benchmark Dataset",
                record_count=10000,
                record_count_source="OpenNyAI Documentation",
                time_period_start="Unknown",
                time_period_end="Unknown",
                coverage_description="Curated sentences from Supreme Court and High Court judgments.",
                courts="Supreme Court, High Courts",
                jurisdictions="National",
                languages="English",
                format="JSON",
                file_types="JSON",
                data_structure="Tokenized sentences with NER tags",
                text_available=True,
                metadata_available=True,
                metadata_fields="tokens,ner_tags",
                original_documents_available=False,
                original_pdf_available=False,
                ocr_available=False,
                structured_data_available=True,
                original_source="Supreme Court & High Court Judgments",
                provenance_status="Partially Verified",
                license_name="MIT License",
                license_url="https://opensource.org/licenses/MIT",
                license_status="Clear",
                commercial_use=True,
                redistribution_allowed=True,
                attribution_required=True,
                derivative_use=True,
                freshness_status="Fresh",
                documentation_quality="High",
                metadata_quality="High",
                completeness_assessment="Excellent Named Entity annotation coverage.",
                limitations="Relatively small scale, limited only to NER tasks.",
                reuse_classification="Research / Benchmarking",
                reuse_reason="Permissive MIT license, highly accurate manual annotations.",
                research_relevance_score=85,
                recommendation="Train custom named-entity extractors to parse judgment texts.",
                why_selected="Standard benchmark for legal NER in the Indian context.",
                status="Verified",
                shortlisted=True,
                shortlist_reason="Permissive license, high quality named entity annotations.",
                shortlist_rank=4
            ),
            # Dataset 5
            Dataset(
                dataset_name="LegalEval (SemEval 2023 Task 6)",
                short_name="LegalEval",
                description="Dataset of judgments segmented and annotated for rhetorical roles (Facts, Arguments, Ratio, Ruling).",
                platform="GitHub",
                dataset_url="https://github.com/Legal-NLP-EkStep/rhetorical-role-baseline",
                creator="OpenNyAI Mission",
                organization="EkStep Foundation",
                category="Court Metadata",
                subcategory="Legal NLP",
                legal_domain="Rhetorical Roles",
                dataset_type="Benchmark Dataset",
                record_count=500,
                record_count_source="SemEval Paper",
                time_period_start="Unknown",
                time_period_end="Unknown",
                coverage_description="Supreme Court judgments annotated for rhetorical roles.",
                courts="Supreme Court of India",
                jurisdictions="Federal",
                languages="English",
                format="JSON / TXT",
                file_types="JSON",
                data_structure="Segmented sentences with role labels",
                text_available=True,
                metadata_available=True,
                metadata_fields="rhetorical_role,text",
                original_documents_available=False,
                original_pdf_available=False,
                ocr_available=False,
                structured_data_available=True,
                original_source="Supreme Court Judgments",
                provenance_status="Partially Verified",
                license_name="MIT License",
                license_url="https://opensource.org/licenses/MIT",
                license_status="Clear",
                commercial_use=True,
                redistribution_allowed=True,
                attribution_required=True,
                derivative_use=True,
                freshness_status="Aging",
                documentation_quality="High",
                metadata_quality="High",
                completeness_assessment="High accuracy tags for structural segments.",
                limitations="Small corpus size (~500 documents).",
                reuse_classification="Research / Benchmarking",
                reuse_reason="MIT license allows training summarizers and segmenters.",
                research_relevance_score=80,
                recommendation="Train segmenters to extract ratio and ruling from raw texts.",
                why_selected="Official SemEval benchmark for structural legal parsing.",
                status="Verified",
                shortlisted=True,
                shortlist_reason="Rhetorical role benchmarks for document structure parsing.",
                shortlist_rank=5
            ),
            # Dataset 6
            Dataset(
                dataset_name="DDL Judicial e-Courts Dataset (SHRUG)",
                short_name="DDL-eCourts",
                description="Relational database covering ~80 million case files from district judiciary (2010-2018). Linked to geographic/demographic indicators.",
                platform="Academic Data Portal",
                dataset_url="https://www.devdatalab.org/judiciary",
                creator="Development Data Lab (DDL)",
                organization="Development Data Lab",
                category="Court Metadata",
                subcategory="District Courts",
                legal_domain="District Court Metadata",
                dataset_type="Research Dataset",
                record_count=80000000,
                record_count_source="DDL SHRUG Paper",
                time_period_start="2010",
                time_period_end="2018",
                coverage_description="Tabular case history metrics across Indian district judiciary.",
                courts="District & Subordinate Courts",
                jurisdictions="District / Subordinate",
                states="All States",
                languages="English",
                format="CSV / SQL",
                file_types="CSV",
                data_structure="Relational tables mapping case filings, judges, and decisions",
                text_available=False,
                metadata_available=True,
                metadata_fields="case_id,court_code,filing_date,decision_date,gender,disposal_type",
                original_documents_available=False,
                original_pdf_available=False,
                ocr_available=False,
                structured_data_available=True,
                original_source="e-Courts District Portal",
                original_source_url="https://districts.ecourts.gov.in",
                collection_method="Programmatic API scraping of e-Courts registries",
                provenance_status="Verified",
                provenance_notes="Sourced directly from districts.ecourts.gov.in.",
                license_name="CC BY-NC-SA 4.0",
                license_url="https://creativecommons.org/licenses/by-nc-sa/4.0/",
                license_status="Academic/Research Use",
                commercial_use=False,
                redistribution_allowed=True,
                attribution_required=True,
                derivative_use=True,
                freshness_status="Old",
                documentation_quality="High",
                metadata_quality="High",
                completeness_assessment="Excellent relational mapping of district courts, but lacks judgment text.",
                limitations="Does not contain judgment PDFs or case summaries, only metadata.",
                reuse_classification="Reference Only",
                reuse_reason="Non-commercial restrictions and lack of judgment text limits usage to demographic analysis.",
                research_relevance_score=70,
                recommendation="Use as an analytical index to understand case delays and statistics.",
                why_selected="Largest tabular dataset of Indian district court records.",
                status="Verified",
                shortlisted=False,
                shortlist_reason="Relational case metadata only, no text content.",
                shortlist_rank=6
            ),
            # Dataset 7
            Dataset(
                dataset_name="Indian Legal Data v3 (HF)",
                short_name="ILD-v3-HF",
                description="Large-scale instruction-tuning dataset containing 193,641 QA pairs based on central Acts (IPC, CrPC, Constitution).",
                platform="Hugging Face",
                dataset_url="https://huggingface.co/datasets/kaushik-harsh-99/Indian-legal-data-v3",
                creator="Community Contributor (Harsh Kaushik)",
                category="Acts / Statutes",
                subcategory="Legal QA",
                legal_domain="Acts & QA",
                dataset_type="Community Dataset",
                record_count=193641,
                record_count_source="Hugging Face Card Info",
                time_period_start="Unknown",
                time_period_end="Unknown",
                coverage_description="Central Acts and Statutes parsed into QA pairs.",
                courts="Not Applicable",
                jurisdictions="Central",
                languages="English",
                format="JSON",
                file_types="JSON",
                data_structure="Instruction tuning QA pairs",
                text_available=True,
                metadata_available=True,
                metadata_fields="prompt,completion,act_name",
                original_documents_available=False,
                original_pdf_available=False,
                ocr_available=False,
                structured_data_available=True,
                original_source="Central Acts",
                provenance_status="Unclear",
                provenance_notes="Sourced from online public summaries, method of generation is unclear.",
                license_name="MIT License",
                license_url="https://opensource.org/licenses/MIT",
                license_status="Clear",
                commercial_use=True,
                redistribution_allowed=True,
                attribution_required=True,
                derivative_use=True,
                freshness_status="Fresh",
                documentation_quality="Low",
                metadata_quality="Low",
                completeness_assessment="Large volume, but high risk of synthetically generated hallucinations.",
                limitations="Generative QA pairs may contain errors and hallucinations.",
                reuse_classification="Further Verification Required",
                reuse_reason="Requires manual review of answers before feeding to training models.",
                research_relevance_score=55,
                recommendation="Review answer accuracy with legal scholars before model ingestion.",
                why_selected="Large-scale instruction dataset for legal SFT.",
                status="Under Review",
                shortlisted=False,
                shortlist_reason="Instruct dataset of unknown accuracy.",
                shortlist_rank=7
            ),
            # Dataset 8
            Dataset(
                dataset_name="Indian Legal Records (LH2)",
                short_name="ILR-LH2",
                description="Commercial proprietary corpus containing 267 million case records and 21 million enriched court orders.",
                platform="Hugging Face",
                dataset_url="https://huggingface.co/datasets/LH2-data-labs/indian-legal-records",
                creator="LH2 Data Labs (Private Enterprise)",
                category="Court Judgments",
                subcategory="Supreme Court",
                legal_domain="Court Judgments",
                dataset_type="Third-Party Dataset",
                record_count=267000000,
                record_count_source="Publisher Page",
                time_period_start="1950",
                time_period_end="2025",
                coverage_description="Enriched judgments, orders, and summaries across all court tiers.",
                courts="Supreme Court, High Courts, District Courts",
                jurisdictions="All Jurisdictions",
                states="All States",
                languages="English,Regional",
                format="JSON / API",
                file_types="JSON",
                data_structure="Enriched JSON with text and case summaries",
                text_available=True,
                metadata_available=True,
                metadata_fields="judgment_text,summary,judges,citations,court_name",
                original_documents_available=True,
                original_pdf_available=False,
                ocr_available=True,
                structured_data_available=True,
                original_source="Supreme, High, and District Courts",
                provenance_status="Partially Verified",
                provenance_notes="Sourced by commercial crawlers of official e-courts.",
                license_name="LH2 Commercial License",
                license_status="Restricted",
                commercial_use=False,
                redistribution_allowed=False,
                attribution_required=True,
                derivative_use=False,
                license_notes="Commercial proprietary license. Requires paid contract to reuse.",
                freshness_status="Fresh",
                documentation_quality="Medium",
                metadata_quality="Medium",
                completeness_assessment="Extremely large scope, but highly restricted reuse parameters.",
                limitations="Proprietary commercial license. No free reuse.",
                reuse_classification="Not Recommended",
                reuse_reason="Commercial license restricts reuse to evaluation only.",
                research_relevance_score=40,
                recommendation="Avoid integrating due to proprietary licensing terms.",
                why_selected="Private vendor dataset offering enrichment summaries.",
                status="Under Review",
                shortlisted=False,
                shortlist_reason="Restricted proprietary license.",
                shortlist_rank=8
            )
        ]
        for ds in datasets_list:
            db.add(ds)
        db.commit()

        # Seed Evidence for Dataset 1
        ds_sc = db.query(Dataset).filter(Dataset.short_name == "SC-AWS-OpenData").first()
        if ds_sc:
            ev_1 = DatasetEvidence(
                dataset_id=ds_sc.id,
                source_type="Official Source",
                source_title="AWS Open Data Registry Listing",
                source_url="https://registry.opendata.aws/indian-supreme-court-judgments/",
                source_description="AWS Open Data Registry metadata page detailing hosting parameters.",
                evidence_text="Direct S3 access details: s3://indian-supreme-court-judgments. Hosted by Dattam Labs.",
                verified=True,
                reviewer="Senior Researcher",
                verified_at=datetime.utcnow(),
                notes="Verified AWS bucket accessibility."
            )
            db.add(ev_1)
            db.commit()

    # 9. Seed Gap Analysis categories if empty
    if db.query(GapAnalysis).count() == 0:
        gap_categories = [
            ("Acts / Statutes", "High", "High", "High", "Central acts available on India Code portal; regional act digitization is partial.", "Missing local state-level acts.", "Medium", "Expand scanning of regional state codes.", "India Code Website"),
            ("Rules / Regulations", "Medium", "Medium", "Medium", "Rules and regulations notifications are scattered across state gazettes.", "Lack of structured gazette indexes.", "High", "Compile central rules and connect to parental acts.", "Gazette e-portal"),
            ("Supreme Court Judgments", "High", "High", "High", "Supreme Court texts are fully available on AWS Open Data registry.", "Lacks original certified PDFs and source URLs.", "High", "Map case records to official judgment URLs.", "AWS Open Data SC Registry"),
            ("High Court Judgments", "Medium", "Medium", "Medium", "AWS Open Data covers ~16 million cases, but lacks structural segmentation.", "Lacks judge metadata and sections cited.", "High", "Train parser to extract judge panels and citation links.", "AWS Open Data HC Registry"),
            ("District Court Data", "Low", "Medium", "Low", "DDL SHRUG dataset contains case history metadata only; no judgment text.", "Zero availability of judgment text or orders.", "Critical", "Conduct scraping of district courts for key litigation types.", "DDL SHRUG Portal"),
            ("Court Metadata", "Medium", "High", "Medium", "e-Courts registry contains basic metadata parameters.", "CNR and case status are not always updated.", "Medium", "Implement auto-sync metadata checker.", "e-Courts official registry"),
            ("Original PDFs", "Low", "Low", "Low", "Scraped datasets consist of raw text chunks; original PDFs are omitted.", "Missing official court stamps and formatting.", "High", "Download and index original PDF files to verify text accuracy.", "Research Datasets Audit"),
            ("Extracted Text", "High", "Medium", "Medium", "Text content is widely available but contains formatting/OCR noise.", "Paragraph breaks and table parsing issues.", "Medium", "Standardize clean-text parsers.", "InLegalNER Documentation"),
            ("OCR", "Low", "Low", "Low", "OCR text quality is poor for historical judgments (pre-1990).", "Garbled symbols and missing sentences.", "High", "Apply advanced OCR models (Tesseract/PaddleOCR) on historical cases.", "Report findings"),
            ("Legal Citations", "Medium", "Medium", "Medium", "Citations are sometimes parsed as strings but lack active database links.", "No citation network graph or parent relationships.", "High", "Create a structured citation graph database.", "LegalEval Rhetorical Baseline"),
            ("Case Metadata", "Medium", "Medium", "Medium", "Basic case numbers are stored, but normalized formats are missing.", "Inconsistent case number string representation.", "Medium", "Standardize case code normalization.", "e-Courts registries"),
            ("Judge Metadata", "Low", "Low", "Low", "Judge names are stored as raw strings (often with varying spelling).", "No unique identifiers for judges.", "Medium", "Entity resolve judge names and create biographical metadata.", "Audit logs"),
            ("Legal Sections", "Low", "Low", "Low", "Very few datasets label which sections (e.g. IPC Section 302) apply.", "Requires manual extraction from judgment text.", "High", "Implement regex and LLM classifiers to extract sections.", "InLegalNER tags"),
            ("Multilingual Data", "Low", "Low", "Low", "90%+ of datasets are in English; regional language judgment text is rare.", "Lack of regional translations (Tamil, Hindi, etc.).", "High", "Build a scraping pipeline for official regional translations.", "Supreme Court Suvas translate portal"),
            ("Regional Languages", "Low", "Low", "Low", "Available regional documents are stored as scanned images.", "No editable text or OCR translations.", "High", "OCR translation pipeline for Hindi, Tamil, and Marathi.", "e-Courts regional portals"),
            ("Historical Data", "Low", "Low", "Low", "Judgments before 1970 have extremely low digitization coverage.", "Pre-independence judgments are missing completely.", "Medium", "Ingest and digitize historical archives.", "Supreme Court Library"),
            ("Current/Fresh Data", "Medium", "Medium", "Medium", "Most public datasets are static dumps with latest updates in 2021-2023.", "Lacks real-time or weekly data freshness.", "High", "Implement weekly cron updates on the server portal.", "AWS Open Data latest dumps"),
            ("Legal NLP datasets", "Medium", "High", "High", "Academic benchmarks exist (ILDC, NER) but are small in scale.", "Tiny token count compared to general English NLP.", "Medium", "Release large-scale verified legal pre-training corpus.", "OpenNyAI HF space"),
            ("Legal QA datasets", "Low", "Low", "Low", "Indian SFT QA datasets are community-built with high noise.", "High rate of synthetic hallucinations.", "Critical", "Direct legal scholars to curate 10,000 golden QA pairs.", "Indian Legal Data v3 HF card"),
            ("Legal Classification datasets", "Medium", "High", "High", "ILDC provides case outcome classification labels.", "Lacks case domain or law topic classification labels.", "Medium", "Annotate cases with primary domain (Criminal, Civil, Tax).", "ILDC Paper"),
            ("Citation Networks", "None", "None", "None", "No open-source Indian legal citation network exists.", "Complete lack of network telemetry.", "High", "Develop node-edge networks mapping precedents.", "Research Recommendations"),
            ("Source URLs", "Low", "Low", "Low", "Public datasets omit the official URL the case was downloaded from.", "Impossible to trace original record without manual search.", "Critical", "Enforce saving exact source URL for every document.", "Data quality validation audit"),
            ("Document-level provenance", "Low", "Low", "Low", "No document-level certificate or verification audit exists.", "Lacks verification tracking history.", "Critical", "Map document verification checks to researchers.", "Audit log metrics")
        ]
        for category, availability, quality, coverage, current_state, gap, priority, recommendation, evidence in gap_categories:
            db.add(
                GapAnalysis(
                    category=category,
                    availability=availability,
                    quality=quality,
                    coverage=coverage,
                    current_state=current_state,
                    gap=gap,
                    priority=priority,
                    recommendation=recommendation,
                    evidence=evidence
                )
            )
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
