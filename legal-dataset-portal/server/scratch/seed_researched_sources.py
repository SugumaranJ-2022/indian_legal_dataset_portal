import sys
import os

# Add server directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.models import Source

def seed_sources():
    db = SessionLocal()
    try:
        # Define the 8 researched datasets as sources
        researched_sources = [
            {
                "website_name": "Indian Supreme Court Judgments (AWS Open Data)",
                "authority": "Supreme Court of India",
                "organization": "Dattam Labs / AWS Open Data Sponsorship Program",
                "category": "Judgments",
                "source_type": "AWS Registry of Open Data",
                "legal_information_type": "Court Judgments & Metadata",
                "languages": "English,Hindi,Regional",
                "download_available": True,
                "website_url": "https://registry.opendata.aws/indian-supreme-court-judgments/",
                "reliability_level": "Authoritative",
                "verification_status": "Verified",
                "description": "Bulk, machine-readable dataset of all judgments delivered by the Supreme Court of India from 1950 to 2025. Partitioned by year with Parquet metadata.",
                "notes": "Direct S3 download access: s3://indian-supreme-court-judgments. Highly recommended as primary SC judgment source."
            },
            {
                "website_name": "Indian High Court Judgments (AWS Open Data)",
                "authority": "25 High Courts of India",
                "organization": "Dattam Labs / AWS Open Data Sponsorship Program",
                "category": "Judgments",
                "source_type": "AWS Registry of Open Data",
                "legal_information_type": "Court Judgments & Metadata",
                "languages": "English,Hindi,Regional",
                "download_available": True,
                "website_url": "https://registry.opendata.aws/indian-high-court-judgments/",
                "reliability_level": "Authoritative",
                "verification_status": "Verified",
                "description": "Bulk, machine-readable dataset of all judgments delivered by the 25 High Courts of India from 1950 to 2025. Approximately 16 million records.",
                "notes": "Direct S3 access: s3://indian-high-court-judgments. Total size ~1.25 TiB."
            },
            {
                "website_name": "Indian Legal Documents Corpus (ILDC)",
                "authority": "Supreme Court of India",
                "organization": "IIT Kharagpur & IIT Kanpur",
                "category": "Judgments",
                "source_type": "Academic Repository",
                "legal_information_type": "Legal NLP / CJPE",
                "languages": "English",
                "download_available": True,
                "website_url": "https://github.com/Exploration-Lab/CJPE",
                "reliability_level": "Recognized",
                "verification_status": "Partially Verified",
                "description": "A corpus of 35,000 Supreme Court judgments annotated with decision outcomes and gold explanations, designed for CJPE research.",
                "notes": "Academic use only (CC BY-NC-SA 4.0 license). Omit from commercial database integrations but useful for NLP benchmarks."
            },
            {
                "website_name": "InLegalNER Dataset",
                "authority": "Supreme Court & High Courts",
                "organization": "OpenNyAI Mission / EkStep Foundation",
                "category": "Court Metadata",
                "source_type": "Hugging Face / Open Source",
                "legal_information_type": "Legal NLP / Named Entity Recognition",
                "languages": "English",
                "download_available": True,
                "website_url": "https://huggingface.co/datasets/opennyaiorg/InLegalNER",
                "reliability_level": "Recognized",
                "verification_status": "Partially Verified",
                "description": "Benchmark dataset of court judgments annotated for legal named entities (e.g. JUDGE, RESPONDENT, LAWYER, STATUTE).",
                "notes": "MIT License. Extremely useful for training custom NER parsing pipelines."
            },
            {
                "website_name": "LegalEval (SemEval 2023 Task 6)",
                "authority": "Supreme Court of India",
                "organization": "OpenNyAI Mission / EkStep Foundation",
                "category": "Court Metadata",
                "source_type": "GitHub / Open Source",
                "legal_information_type": "Legal NLP / Rhetorical Roles Prediction",
                "languages": "English",
                "download_available": True,
                "website_url": "https://github.com/Legal-NLP-EkStep/rhetorical-role-baseline",
                "reliability_level": "Recognized",
                "verification_status": "Partially Verified",
                "description": "Dataset of judgments segmented and annotated for rhetorical roles (Facts, Arguments, Ratio, Ruling).",
                "notes": "MIT License. Essential for training structural document segmentation algorithms."
            },
            {
                "website_name": "DDL Judicial e-Courts Dataset (SHRUG)",
                "authority": "District & Subordinate Courts",
                "organization": "Development Data Lab (DDL)",
                "category": "Court Metadata",
                "source_type": "Academic Data Portal",
                "legal_information_type": "Court Telemetry / Tabular Case Data",
                "languages": "English",
                "download_available": True,
                "website_url": "https://www.devdatalab.org/judiciary",
                "reliability_level": "Recognized",
                "verification_status": "Verified",
                "description": "Relational database covering ~80 million case files from district judiciary (2010-2018). Linked to geographic/demographic indicators.",
                "notes": "CC BY-NC-SA 4.0. Contains telemetry/metadata only. No judgment text or PDFs."
            },
            {
                "website_name": "Indian Legal Data v3 (HF)",
                "authority": "Central Statutes / Codes",
                "organization": "Community Contributor (Harsh Kaushik)",
                "category": "Acts",
                "source_type": "Hugging Face / Open Source",
                "legal_information_type": "Legal SFT / LLM Instruction Tuning",
                "languages": "English",
                "download_available": True,
                "website_url": "https://huggingface.co/datasets/kaushik-harsh-99/Indian-legal-data-v3",
                "reliability_level": "Needs Review",
                "verification_status": "Unclear",
                "description": "Large-scale instruction-tuning dataset containing 193,641 QA pairs based on central Acts (IPC, CrPC, Constitution).",
                "notes": "MIT License. Risk of synthetic hallucinations. Use with caution."
            },
            {
                "website_name": "Indian Legal Records (LH2)",
                "authority": "Supreme, High, and District Courts",
                "organization": "LH2 Data Labs (Private Enterprise)",
                "category": "Judgments",
                "source_type": "Hugging Face / Commercial",
                "legal_information_type": "Enriched Judgments & Summaries",
                "languages": "English,Regional",
                "download_available": False,
                "website_url": "https://huggingface.co/datasets/LH2-data-labs/indian-legal-records",
                "reliability_level": "Recognized",
                "verification_status": "Partially Verified",
                "description": "Commercial proprietary corpus containing 267 million case records and 21 million enriched court orders.",
                "notes": "LH2 Commercial License. Preview/evaluation only. Production/training use requires signed commercial agreement."
            }
        ]

        inserted_count = 0
        for src_data in researched_sources:
            # Check if source already exists by website_url or website_name
            existing = db.query(Source).filter(
                (Source.website_name == src_data["website_name"]) |
                (Source.website_url == src_data["website_url"])
            ).first()

            if not existing:
                src = Source(**src_data)
                db.add(src)
                inserted_count += 1
                print(f"Added source: {src_data['website_name']}")
            else:
                print(f"Source already exists: {src_data['website_name']}")

        db.commit()
        print(f"Successfully seeded {inserted_count} new researched sources into the database.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding sources: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_sources()
