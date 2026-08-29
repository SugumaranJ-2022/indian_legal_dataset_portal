import os
import sys
import unittest
from fastapi.testclient import TestClient

# Add server directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.database import SessionLocal
from app.models.models import User, Dataset, GapAnalysis, Source, Document
from app.core.security import get_password_hash

client = TestClient(app)

class TestDatasetLandscapeModule(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Clean up test dataset if it exists from previous runs to ensure repeatability
        db = SessionLocal()
        try:
            test_ds = db.query(Dataset).filter(Dataset.short_name == "Kaggle-ILJ-26").first()
            if test_ds:
                db.delete(test_ds)
                db.commit()
        except Exception:
            pass
        finally:
            db.close()

        # The database is already seeded on startup. Let's login the researcher.
        login_res = client.post("/api/auth/login", json={"email": "researcher@legalportal.in", "password": "Password123"})
        assert login_res.status_code == 200, f"Setup login failed: {login_res.text}"
        cls.token = login_res.json()["access_token"]
        cls.headers = {"Authorization": f"Bearer {cls.token}"}
        
    def test_01_get_datasets(self):
        # Retrieve datasets
        res = client.get("/api/datasets", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        datasets = res.json()
        self.assertGreaterEqual(len(datasets), 8)
        self.assertEqual(datasets[0]["short_name"], "SC-AWS-OpenData")

    def test_02_filter_and_search_datasets(self):
        # Filter by platform
        res = client.get("/api/datasets?platform=AWS Open Data", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        datasets = res.json()
        self.assertGreaterEqual(len(datasets), 2)
        
        # Search by query
        res = client.get("/api/datasets?search=SHRUG", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        datasets = res.json()
        self.assertEqual(len(datasets), 1)
        self.assertEqual(datasets[0]["short_name"], "DDL-eCourts")

    def test_03_create_dataset_validation(self):
        # Check URL validation
        bad_dataset = {
            "dataset_name": "Test Bad URL Dataset",
            "short_name": "BadURL",
            "description": "Invalid URL test case",
            "platform": "Kaggle",
            "dataset_url": "not_a_valid_url",
            "category": "Court Judgments"
        }
        res = client.post("/api/datasets", json=bad_dataset, headers=self.headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("URL must be a valid", res.json()["detail"])

        # Check duplicate dataset validation
        duplicate_dataset = {
            "dataset_name": "Indian Supreme Court Judgments (AWS Open Data)", # duplicate name
            "short_name": "SC-AWS-OpenData-Dup",
            "description": "Duplicate name and platform test",
            "platform": "AWS Open Data",
            "dataset_url": "https://registry.opendata.aws/indian-supreme-court-judgments-mirror/",
            "category": "Court Judgments"
        }
        res = client.post("/api/datasets", json=duplicate_dataset, headers=self.headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Duplicate dataset detected", res.json()["detail"])

    def test_04_create_and_update_dataset(self):
        # Create valid dataset
        new_dataset = {
            "dataset_name": "Kaggle Indian Legal Judgments 2026",
            "short_name": "Kaggle-ILJ-26",
            "description": "Cleaned subset of high court judgments uploaded on Kaggle.",
            "platform": "Kaggle",
            "dataset_url": "https://www.kaggle.com/datasets/testuser/indian-legal-judgments-2026",
            "category": "Court Judgments",
            "provenance_status": "Not Verified",
            "license_status": "License Unclear",
            "freshness_status": "Fresh",
            "text_available": True,
            "metadata_available": True,
            "metadata_fields": "case_id,judgment_text,year"
        }
        res = client.post("/api/datasets", json=new_dataset, headers=self.headers)
        self.assertEqual(res.status_code, 201)
        ds_id = res.json()["id"]
        
        # Verify calculated relevance score:
        # Provenance: Not Verified (0)
        # Coverage: None (0)
        # Metadata: Available=True (10) + Fields=3 (0)
        # Document Availability: TextAvailable=True (10)
        # Freshness: Fresh (10)
        # License: Unclear (0)
        # Documentation: None (0)
        # Total score: 10 + 10 + 10 = 30
        self.assertEqual(res.json()["research_relevance_score"], 30)

        # Update dataset details (Shortlist)
        update_data = {
            "shortlisted": True,
            "shortlist_reason": "Good evaluation subset.",
            "shortlist_rank": 10
        }
        res = client.put(f"/api/datasets/{ds_id}", json=update_data, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["shortlisted"])
        self.assertEqual(res.json()["shortlist_rank"], 10)

    def test_05_role_based_access_limits(self):
        # Researcher role is mapped to our token.
        # Ensure Researcher cannot edit restricted verification status fields
        restricted_update = {
            "provenance_status": "Verified"
        }
        # Researcher token should fail with 403 Forbidden
        res = client.put("/api/datasets/1", json=restricted_update, headers=self.headers)
        self.assertEqual(res.status_code, 403)

        # Reviewer override headers
        reviewer_headers = {**self.headers, "x-override-role": "reviewer"}
        res = client.put("/api/datasets/1", json=restricted_update, headers=reviewer_headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["provenance_status"], "Verified")

    def test_06_evidence_crud(self):
        # Create evidence
        evidence_data = {
            "source_type": "Official Source",
            "source_title": "Dattam Labs AWS Open Data Manifest",
            "source_url": "https://github.com/dattam-labs/manifest",
            "source_description": "Verification manifest file link",
            "evidence_text": "AWS bucket confirmed as s3://indian-supreme-court-judgments",
            "verified": False
        }
        res = client.post("/api/datasets/1/evidence", json=evidence_data, headers=self.headers)
        self.assertEqual(res.status_code, 201)
        ev_id = res.json()["id"]

        # Ensure researcher cannot verify
        res = client.put("/api/datasets/1/evidence/{0}".format(ev_id), json={"verified": True}, headers=self.headers)
        self.assertEqual(res.status_code, 403)

        # Reviewer can verify
        reviewer_headers = {**self.headers, "x-override-role": "reviewer"}
        res = client.put("/api/datasets/1/evidence/{0}".format(ev_id), json={"verified": True}, headers=reviewer_headers)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["verified"])

    def test_07_gap_analysis(self):
        # List gaps
        res = client.get("/api/gaps", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 23)

        # Update gap analysis
        res = client.put("/api/gaps/1", json={"priority": "Critical", "gap": "High level state statutes are missing."}, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["priority"], "Critical")

    def test_08_dashboard_telemetry(self):
        res = client.get("/api/dashboard/stats", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        stats = res.json()
        self.assertIn("research_stats", stats)
        self.assertGreater(stats["research_stats"]["datasets_discovered"], 0)

    def test_09_export_landscape_pdf(self):
        res = client.get("/api/reports/pdf?report_type=landscape", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("content-type"), "application/pdf")

    def test_10_export_landscape_excel(self):
        res = client.get("/api/reports/excel?report_type=landscape", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("content-type"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

if __name__ == "__main__":
    unittest.main()
