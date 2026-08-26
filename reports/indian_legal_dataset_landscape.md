# Indian Legal Dataset Landscape – Existing Dataset & Resource Investigation

## Objective
The objective of this research study is to conduct a comprehensive analysis of the existing Indian legal datasets and publicly available legal-data resources. Before commencing large-scale collection of our own Indian legal dataset, this investigation assesses what data exists, its content, source provenance, metadata completeness, coverage, licensing conditions, and reliability. This study identifies critical gaps in the existing ecosystem, enabling us to define the precise collection strategy for our project.

> [!IMPORTANT]
> This document focuses entirely on the research, verification, and analysis of the existing Indian legal-data landscape. The portal and supporting tools are treated as secondary components; the primary deliverable is this evidence-based study.

---

## 1. Search Existing Indian Legal Datasets
To maps the landscape thoroughly, we searched across multiple public platforms, academic repositories, and government open-data archives.

### A. Search Platforms Investigated
*   **Hugging Face Datasets:** For NLP-centric corpora, instruction-tuning datasets, and token classification tasks.
*   **Kaggle:** For community-uploaded case law dumps, text summaries, and CSV-formatted judgment datasets.
*   **GitHub:** For open-source scraping pipelines, data-wrangling codebases, and academic release repositories.
*   **AWS Registry of Open Data:** For massive, production-grade bulk databases of raw PDF judgments and structured parquet metadata.
*   **Development Data Lab (DDL) Portal:** For large-scale lower court telemetry and demographic data.
*   **Official Portals:** [India Code](https://www.indiacode.nic.in/), [e-Courts India](https://ecourts.gov.in/), and the [Supreme Court of India](https://main.sci.gov.in/) portals.

### B. Search Queries Executed
*   `Indian legal dataset` OR `India legal dataset`
*   `Indian court judgments dataset` OR `Indian court cases dataset`
*   `Supreme Court India dataset` OR `Supreme Court judgments dataset`
*   `Indian High Court judgments dataset` OR `High Court India dataset`
*   `Indian legal NLP dataset` OR `Indian legal text dataset`
*   `Indian legal documents dataset` OR `Indian Acts dataset`
*   `Indian statutes dataset` OR `Indian Rules and Regulations dataset`
*   `Indian court metadata dataset` OR `Indian case law dataset`
*   `Indian legal language dataset` OR `Indian legal AI dataset`
*   `Indian legal corpus` OR `Indian judgment corpus` OR `Indian case law NLP`

---

## 2. Legal Data Categories to Investigate
The investigation targeted six primary categories of legal data to evaluate availability and quality:

*   **A. Acts & Statutes:** Central Acts, State Acts, historical colonial-era legislations, and active amendments.
*   **B. Rules & Regulations:** Subordinate legislation, central rules, state rules, circulars, and official gazette notifications.
*   **C. Court Judgments:** Decisions from the Supreme Court of India, 25 High Courts, District/Subordinate courts, and specialized tribunals (e.g., NCLT, NGT, CAT).
*   **D. Court Metadata:** Structured identifiers such as Case Number Record (CNR), case type, bench, presiding judges, filing date, decision date, parties, advocates, acts/sections cited, and disposal nature.
*   **E. Indian Legal NLP Datasets:** Specialized annotations for Legal Named Entity Recognition (L-NER), Rhetorical Role Prediction (RRP), Court Judgment Prediction & Explanation (CJPE), statute identification, and summarization.
*   **F. Multilingual Indian Legal Data:** Legal texts translated or originally drafted in official Indian scheduled languages (such as Hindi, Tamil, Telugu, Marathi, Gujarati, etc.).

---

## 3. Dataset Selection Criteria
A large pool of datasets was discovered, from which we shortlisted **8 key datasets** based on the following selection rules:

1.  **Relevance to Indian Jurisdictions:** Content must directly originate from Indian legislative or judicial bodies.
2.  **Identifiable Creator/Organization:** The publisher or institution responsible for the data must be clearly documented.
3.  **Traceable Provenance:** The raw data must be traceable to official government portals (e.g., e-Courts, Supreme Court website).
4.  **Actionable Metadata:** The presence of structured metadata fields (e.g., dates, court names, citations) is heavily prioritized.
5.  **Format Quality & Accessibility:** Datasets containing clean, standard formats (CSV, JSON, Parquet, or raw PDFs) were preferred over undocumented, unorganized formats.
6.  **Freshness:** Preference was given to datasets offering recent updates or historical coverage up to 2024/2025.

> [!WARNING]
> **Hosting Platform Caution:** A dataset's hosting on Kaggle, Hugging Face, or GitHub does not automatically establish its data quality, authenticity, provenance, or licensing compliance. Many community uploads are scraped using unstable third-party scripts, contain severe OCR corruption, lack attribution, or violate the terms of service of the original source portals. Rigorous independent verification was conducted for all shortlisted datasets.

---

## 4. Information to Record for Every Dataset
For each of the shortlisted datasets, we recorded and verified 33 distinct fields covering identification, scale, structure, provenance, licensing, limitations, and utility. These fields are integrated into the detailed analysis in [Section 10](#10-detailed-dataset-by-dataset-analysis).

---

## 5. Provenance Verification
Provenance represents the lineage and verifiability of a dataset. We classify provenance into four categories:
*   **Verified:** Sourced directly from official government portals using documented, transparent pipelines with preserved official identifiers (e.g., S3 buckets pulling directly from court websites with raw PDFs and CNR numbers).
*   **Partially Verified:** Sourced from official judgments, but distributed as extracted/segmented text with metadata stripped or rules-based labeling that cannot be cross-referenced back to original URLs.
*   **Unclear:** Synthesized or heavily modified datasets (e.g., LLM-generated QA instruction pairs) where the source texts are legal but the pipeline, validation, and original cases are undocumented.
*   **Not Verified:** Scraped files hosted anonymously with zero documentation of scraping mechanisms, source URLs, or data curation pipelines.

---

## 6. License and Usage Analysis
Public availability does not equate to commercial reusability. We analyze and categorize dataset licenses into:
*   **Clearly Reusable:** Permissive open licenses (e.g., MIT, CC BY 4.0) that permit commercial use, modifications, and redistribution.
*   **Reusable with Conditions:** Licenses allowing reuse but enforcing share-alike, attribution, or specific distribution terms.
*   **Research/Academic Use Only:** Non-commercial licenses (e.g., CC BY-NC-SA 4.0) that strictly prohibit commercial products or monetization.
*   **License Unclear:** Datasets lacking license files, terms of use, or explicit statements of ownership.
*   **No Explicit License Found:** Public repositories published without any license, falling under default copyright restrictions.
*   **Usage Restrictions Require Further Legal Review:** Proprietary commercial evaluation licenses.

---

## 7. Dataset Content Analysis
We distinguish between the structural forms of the content:
*   **Document Available:** The raw original files (typically PDFs or scanned images) are available, preserving layout, signatures, and stamps.
*   **Only Extracted Text Available:** The layout is stripped, and only raw OCR-extracted or parsed Unicode text is provided (often in JSON, CSV, or TXT).
*   **Only Metadata Available:** Case details (CNR, dates, names, disposal nature) are provided in tabular formats, but the full-text judgment or PDF is absent.

---

## 8. Coverage Analysis
We analyze each dataset's coverage across five axes:
1.  **Legal Category:** Acts/Statutes, Rules, Court Judgments, Metadata, or NLP labels.
2.  **Court Level:** Supreme Court, 25 High Courts, District/Subordinate Judiciary, or Tribunals.
3.  **Geographic Scope:** National vs. specific State/Union Territory.
4.  **Time Period:** Earliest and latest records available.
5.  **Language:** English, Hindi, and regional languages.

---

## 9. Compare the Best 5–10 Datasets
The following table compares the 8 shortlisted Indian legal datasets:

| # | Dataset | Platform | Category | Records | Time Period | Courts | Languages | Format | Metadata | Documents | Original Source | Provenance | License | Freshness | Main Limitation | Relevance |
|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Indian SC Judgments** | AWS Open Data | Judgments & Metadata | ~60,000 | 1950–2025 | Supreme Court | English, Regional | PDF, JSON, Parquet | Rich (CNR, dates, judges) | Yes (PDFs) | Supreme Court Site | **Verified** | CC BY 4.0 | Very Fresh (Bi-monthly) | Scanned PDF OCR quality | **Extremely High** (Production archive) |
| 2 | **Indian High Court Judgments** | AWS Open Data | Judgments & Metadata | ~16,000,000 | 1950–2025 | 25 High Courts | English, Hindi, Regional | PDF, JSON, Parquet | Rich (CNR, dates, court) | Yes (PDFs) | e-Courts & HC Sites | **Verified** | CC BY 4.0 | Very Fresh (Bi-monthly) | Massive size (~1.25 TiB) | **Extremely High** (Core training data) |
| 3 | **ILDC (Indian Legal Doc Corpus)** | Hugging Face / GitHub | Legal NLP / CJPE | 34,816 | 1951–2020 | Supreme Court | English | CSV, JSON | Minimal (Text, Binary Label) | No (Text Only) | Court Judgments | **Partially Verified** | CC BY-NC-SA 4.0 | Not Fresh (Static 2020) | Binary label simplification | **Medium-High** (RAG/NLP Benchmark) |
| 4 | **InLegalNER** | Hugging Face | Legal NLP / NER | 10,000+ entities | Up to 2022 | Supreme & High Courts | English | JSON (IOB) | Token-level annotations | No (Text Only) | Court Judgments | **Partially Verified** | MIT License | Moderate (Static 2022) | Specialized (NER only) | **Extremely High** (Citations & entity parsing) |
| 5 | **LegalEval (SemEval RRP)** | GitHub / Hugging Face | Legal NLP / Rhetorical Roles | ~10,000 sentences | 1950–2022 | Supreme & High Courts | English | JSON | Sentence-level roles | No (Text Only) | Court Judgments | **Partially Verified** | MIT License | Moderate (Static 2022) | Small size (~300 docs) | **Extremely High** (Structural parsing) |
| 6 | **DDL e-Courts Dataset** | DDL Portal | Court Telemetry / Metadata | ~80,000,000 | 2010–2018 | District/Lower Courts | English (metadata) | CSV, Parquet, .dta | High (Geographical, cases) | No (Metadata Only) | e-Courts Portal | **Verified** | CC BY-NC-SA 4.0 | Not Fresh (Ends 2018) | Lacks judgment texts/PDFs | **Medium** (Demographics & statistics) |
| 7 | **Indian Legal Data v3** | Hugging Face | Legal NLP / LLM SFT | 193,641 | Up to 2024 | Central Acts / Statutes | English | JSONL, Parquet | QA & SFT Categories | No (Text Only) | Central Acts & QA Sites | **Unclear** | MIT License | Moderate (2024) | High risk of SFT hallucinations | **Medium** (Instruction fine-tuning) |
| 8 | **Indian Legal Records (LH2)** | Hugging Face | Enriched Judgments | ~267,000,000 | Historical to 2024 | SC, High, District Courts | English, Regional | Parquet | Enriched (AI summaries) | No (Text Only) | e-Courts & HC Sites | **Partially Verified** | Proprietary Commercial | Fresh (2024) | Restrictive commercial licensing | **Low-Medium** (Proprietary limitations) |

---

## 10. Detailed Dataset-by-Dataset Analysis

### Dataset 1 – Indian Supreme Court Judgments (AWS Open Data)
*   **1. Dataset name:** Indian Supreme Court Judgments
*   **2. Platform:** AWS Registry of Open Data
*   **3. Direct dataset URL:** [registry.opendata.aws/indian-supreme-court-judgments](https://registry.opendata.aws/indian-supreme-court-judgments/)
*   **4. Creator:** Pradeep Vanga
*   **5. Organization/institution:** Dattam Labs (under the AWS Open Data Sponsorship Program)
*   **6. Publication/release date:** 2022
*   **7. Last update date:** Bi-monthly (active through 2025)
*   **8. Category:** Court Judgments
*   **9. Description:** A complete, machine-readable dataset of judgments delivered by the Supreme Court of India, containing raw PDFs, JSON metadata, and structured Parquet tables.
*   **10. Number of records/documents:** Approximately 60,000 cases
*   **11. Number of judgments/documents:** Approximately 60,000 judgments
*   **12. Time period covered:** 1950–2025
*   **13. Courts covered:** Supreme Court of India
*   **14. Jurisdictions covered:** National / Federal
*   **15. States covered:** All states (National jurisdiction)
*   **16. Languages:** English and various regional Indian languages
*   **17. File format:** PDF (raw documents), JSON (raw metadata), Parquet (structured metadata)
*   **18. Data structure:** Tabular metadata partitioned by year; bulk annual tar archives.
*   **19. Metadata fields:** `court_code`, `title`, `description`, `judge`, `pdf_link`, `cnr`, `date_of_registration`, `decision_date`, `disposal_nature`, `court`, `raw_html`, `pdf_exists`, `size`, `file_type`, `pdf_version`, `pdf_pages`, `pdf_producer`, `pdf_language`.
*   **20. Whether original documents are available:** Yes (Original PDFs are hosted in the S3 bucket).
*   **21. Whether only extracted text is available:** No (Both PDFs and structured metadata are available).
*   **22. Original source:** Supreme Court of India official website
*   **23. Original source URL:** [main.sci.gov.in](https://main.sci.gov.in/)
*   **24. Data collection methodology:** Automated web scrapers crawl the Supreme Court judgment portal, extract raw HTML and PDFs, normalize the metadata, and compile structured Parquet tables.
*   **25. Provenance status:** **Verified** (directly traceable to official Court records with preserved official PDF files and CNR numbers).
*   **26. License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
*   **27. Usage restrictions:** None (permits commercial use, modification, and distribution with attribution).
*   **28. Commercial-use restrictions:** None
*   **29. Redistribution restrictions:** None
*   **30. Known limitations:** OCR quality varies on historical scanned documents (1950s–1980s); parser errors may occasionally map judges or dates incorrectly.
*   **31. Freshness/currentness:** Very Fresh (updated bi-monthly).
*   **32. Potential usefulness:** **Extremely High** (serves as the primary source for authoritative Supreme Court judgments, offering direct PDF access and clean querying schemas).
*   **33. Reliability assessment:** Highly Reliable (academically and industrially validated, open-source crawler repository, sponsored by AWS).

---

### Dataset 2 – Indian High Court Judgments (AWS Open Data)
*   **1. Dataset name:** Indian High Court Judgments
*   **2. Platform:** AWS Registry of Open Data
*   **3. Direct dataset URL:** [registry.opendata.aws/indian-high-court-judgments](https://registry.opendata.aws/indian-high-court-judgments/)
*   **4. Creator:** Pradeep Vanga
*   **5. Organization/institution:** Dattam Labs (under the AWS Open Data Sponsorship Program)
*   **6. Publication/release date:** 2022
*   **7. Last update date:** Bi-monthly (active through 2025)
*   **8. Category:** Court Judgments & Metadata
*   **9. Description:** A massive, machine-readable dataset containing judgments and metadata from all 25 High Courts of India, compiled to facilitate legal tech research and AI modeling.
*   **10. Number of records/documents:** Approximately 16 million records
*   **11. Number of judgments/documents:** Approximately 16 million judgments
*   **12. Time period covered:** 1950–2025
*   **13. Courts covered:** All 25 High Courts of India (e.g., Allahabad, Bombay, Delhi, Madras High Courts, etc.)
*   **14. Jurisdictions covered:** State-level jurisdictions
*   **15. States covered:** All states and Union Territories in India
*   **16. Languages:** English, Hindi, and various regional languages (depending on the state jurisdiction)
*   **17. File format:** PDF, JSON, Parquet
*   **18. Data structure:** Tabular metadata partitioned by year and court code, stored in Amazon S3.
*   **19. Metadata fields:** `court_code`, `title`, `description`, `judge`, `pdf_link`, `cnr`, `date_of_registration`, `decision_date`, `disposal_nature`, `court`, `raw_html`, `pdf_exists`, `size`, `file_type`, `pdf_pages`.
*   **20. Whether original documents are available:** Yes (Original PDFs are hosted in S3).
*   **21. Whether only extracted text is available:** No (Both original PDFs and extracted metadata are available).
*   **22. Original source:** Respective websites of the 25 High Courts / e-Courts portal
*   **23. Original source URL:** Varies by court (e.g., [allahabadhighcourt.in](http://www.allahabadhighcourt.in/))
*   **24. Data collection methodology:** Distributed crawlers scrape individual High Court judgment sites and e-Courts nodes, parse metadata, download PDFs, and synchronize data to S3.
*   **25. Provenance status:** **Verified** (direct lineage to the official High Court e-Courts web services).
*   **26. License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
*   **27. Usage restrictions:** None (permits commercial use, modification, and distribution with attribution).
*   **28. Commercial-use restrictions:** None
*   **29. Redistribution restrictions:** None
*   **30. Known limitations:** Extremely large size (~1.25 TiB) makes local downloading difficult. Schema drift across High Courts causes missing fields, and OCR quality is highly inconsistent on older/state-specific PDFs.
*   **31. Freshness/currentness:** Very Fresh (updated bi-monthly).
*   **32. Potential usefulness:** **Extremely High** (crucial for state-level legal search, training legal LLMs, and performing large-scale citation audits across High Courts).
*   **33. Reliability assessment:** Highly Reliable (official source data, transparent crawler scripts, robust hosting).

---

### Dataset 3 – Indian Legal Documents Corpus (ILDC)
*   **1. Dataset name:** Indian Legal Documents Corpus (ILDC) for CJPE
*   **2. Platform:** Hugging Face / GitHub
*   **3. Direct dataset URL:** [github.com/Exploration-Lab/CJPE](https://github.com/Exploration-Lab/CJPE)
*   **4. Creator:** Vijit Malik, Rishabh Sanjay, Shubham Kumar Nigam, Kripabandhu Ghosh, Shouvik Kumar Guha, Arnab Bhattacharya, Ashutosh Modi
*   **5. Organization/institution:** IIT Kharagpur & IIT Kanpur
*   **6. Publication/release date:** May 2021 (ACL-IJCNLP 2021)
*   **7. Last update date:** May 2021 (Static dataset)
*   **8. Category:** Legal NLP
*   **9. Description:** A curated corpus of 35,000 Supreme Court judgments designed for Court Judgment Prediction and Explanation (CJPE), annotated with binary decision labels.
*   **10. Number of records/documents:** 34,816 cases
*   **11. Number of judgments/documents:** 34,816 judgments
*   **12. Time period covered:** 1951–2020
*   **13. Courts covered:** Supreme Court of India
*   **14. Jurisdictions covered:** National / Federal
*   **15. States covered:** All states (National jurisdiction)
*   **16. Languages:** English
*   **17. File format:** CSV, JSON
*   **18. Data structure:** Train split (32,937), Dev split (999), and Test split (1,517).
*   **19. Metadata fields:** `text` (cleaned judgment text), `label` (0 for petition rejected, 1 for petition accepted).
*   **20. Whether original documents are available:** No (Only preprocessed text content is provided).
*   **21. Whether only extracted text is available:** Yes (Cleaned, lowercased, and normalized text only).
*   **22. Original source:** Scraped Supreme Court judgments
*   **23. Original source URL:** Not specified (scraped from public engines like Indian Kanoon)
*   **24. Data collection methodology:** Scraped raw judgment texts were passed through a rules-based parser targeting judgment endings to extract petition outcomes (accepted vs. rejected). A test subset was manually annotated by legal experts to identify explanatory sentences.
*   **25. Provenance status:** **Partially Verified** (text matches Supreme Court judgments, but case numbers, judge names, and original PDF references are omitted).
*   **26. License:** Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)
*   **27. Usage restrictions:** Non-commercial use only (academic research and evaluation).
*   **28. Commercial-use restrictions:** Yes (commercial re-use is strictly prohibited under the NC clause).
*   **29. Redistribution restrictions:** Yes (redistributed derivatives must use the same license).
*   **30. Known limitations:** Lacks original PDFs and case metadata (CNR, judge names, advocate names). The binary label simplification (0/1) ignores cases with mixed, remanded, or partial outcomes.
*   **31. Freshness/currentness:** Not Fresh (static academic snapshot ending in 2020).
*   **32. Potential usefulness:** **Medium-High** (excellent benchmark for validating judgment prediction and text classification models; not usable in a commercial legal search engine).
*   **33. Reliability assessment:** Highly Reliable for academic research (peer-reviewed and standard benchmark in Legal NLP).

---

### Dataset 4 – InLegalNER (OpenNyAI)
*   **1. Dataset name:** InLegalNER
*   **2. Platform:** Hugging Face
*   **3. Direct dataset URL:** [huggingface.co/datasets/opennyaiorg/InLegalNER](https://huggingface.co/datasets/opennyaiorg/InLegalNER)
*   **4. Creator:** OpenNyAI Team (Kalamkar et al.)
*   **5. Organization/institution:** OpenNyAI Mission (funded by EkStep Foundation & Agami)
*   **6. Publication/release date:** Late 2022
*   **7. Last update date:** 2023 (Static benchmark)
*   **8. Category:** Legal NLP / Named Entity Recognition
*   **9. Description:** A gold-standard annotated dataset of Indian Supreme Court and High Court judgments, labeled at the token level for legal entities.
*   **10. Number of records/documents:** 10,000+ token annotations across curated judgments (includes distinct train/dev splits).
*   **11. Number of judgments/documents:** Curated segments from Supreme Court and High Court judgments.
*   **12. Time period covered:** Up to 2022
*   **13. Courts covered:** Supreme Court of India and various High Courts
*   **14. Jurisdictions covered:** National and State-level
*   **15. States covered:** All states (Supreme Court and selected High Courts)
*   **16. Languages:** English
*   **17. File format:** JSON (IOB/CoNLL annotation format)
*   **18. Data structure:** Nested JSON containing word tokens, character offsets, and corresponding NER entity tags.
*   **19. Metadata fields:** `tokens` (words), `ner_tags` (Labels: COURT, JUDGE, PETITIONER, RESPONDENT, LAWYER, STATUTE, PROVISION, PRECEDENT, DATE, CASE_NUMBER, ORG, GPE, OTHER).
*   **20. Whether original documents are available:** No (Only annotated text spans are provided).
*   **21. Whether only extracted text is available:** Yes (Extracted, tokenized text only).
*   **22. Original source:** Scraped judgments from official court portals
*   **23. Original source URL:** Not specified
*   **24. Data collection methodology:** Raw judgments were segmented into sentences and tokens. A pre-annotation model tagged candidate entities, which were then manually cleaned, corrected, and verified by legal experts to build a high-precision gold standard.
*   **25. Provenance status:** **Partially Verified** (text originates from official court judgments, but the full case context is segmented and tokenized).
*   **26. License:** MIT License
*   **27. Usage restrictions:** None (highly permissive open-source license).
*   **28. Commercial-use restrictions:** None
*   **29. Redistribution restrictions:** None
*   **30. Known limitations:** Highly specialized for NER tasks; cannot be used for full-text legal search or text-to-text QA.
*   **31. Freshness/currentness:** Moderate (up to 2022).
*   **32. Potential usefulness:** **Extremely High** (crucial for training entity extraction pipelines to structure our own raw collected PDF texts and automatically extract acts, citations, case numbers, and parties).
*   **33. Reliability assessment:** Highly Reliable (expert-annotated, open-source under a reputable foundation).

---

### Dataset 5 – LegalEval (SemEval 2023 Task 6 / OpenNyAI)
*   **1. Dataset name:** LegalEval (Rhetorical Roles Prediction Dataset)
*   **2. Platform:** GitHub / Hugging Face
*   **3. Direct dataset URL:** [github.com/Legal-NLP-EkStep/rhetorical-role-baseline](https://github.com/Legal-NLP-EkStep/rhetorical-role-baseline)
*   **4. Creator:** OpenNyAI Team & SemEval 2023 Organizers (Kalamkar et al.)
*   **5. Organization/institution:** OpenNyAI / EkStep Foundation
*   **6. Publication/release date:** January 2023
*   **7. Last update date:** 2023 (Static competition benchmark)
*   **8. Category:** Legal NLP / Rhetorical Roles
*   **9. Description:** A specialized dataset containing sentences from Indian Supreme Court judgments annotated with their rhetorical roles to help segment legal documents.
*   **10. Number of records/documents:** ~10,000 sentences across selected judgments (typically ~300 full judgments split into Train/Dev/Test)
*   **11. Number of judgments/documents:** Approximately 300 judgments
*   **12. Time period covered:** 1950–2022
*   **13. Courts covered:** Supreme Court of India and selected High Courts
*   **14. Jurisdictions covered:** National / Federal
*   **15. States covered:** All states (National jurisdiction)
*   **16. Languages:** English
*   **17. File format:** JSON
*   **18. Data structure:** Sentence-level records containing text and rhetorical role category tags.
*   **19. Metadata fields:** `sentence_text`, `role` (Labels: FACTS, ISSUE, ARGUMENT, ANALYSIS, RATIO, PRECEDENT, RULING, PREAMBLE, NONE).
*   **20. Whether original documents are available:** No (Only sentence-level annotated text).
*   **21. Whether only extracted text is available:** Yes (Annotated extracted text).
*   **22. Original source:** Scraped court judgments from official Indian court portals
*   **23. Original source URL:** Not specified
*   **24. Data collection methodology:** Legal annotators manually reviewed raw judgment texts and labeled sentences with their rhetorical role.
*   **25. Provenance status:** **Partially Verified** (sourced from official judgments, but distributed as parsed segments).
*   **26. License:** MIT License
*   **27. Usage restrictions:** None (permissive open-source license).
*   **28. Commercial-use restrictions:** None
*   **29. Redistribution restrictions:** None
*   **30. Known limitations:** Extremely small sample size (only 300 judgments); focused entirely on sentence-level rhetorical role classification.
*   **31. Freshness/currentness:** Moderate (up to 2022).
*   **32. Potential usefulness:** **Extremely High** (crucial for structural parsing of legal judgments, allowing an automated system to isolate the "Ruling" or "Facts" in an automated summarization system).
*   **33. Reliability assessment:** Highly Reliable (established SemEval benchmark, expert-annotated).

---

### Dataset 6 – DDL Judicial e-Courts Dataset (Development Data Lab)
*   **1. Dataset name:** DDL Judicial e-Courts Dataset (SHRUG Judicial Portal)
*   **2. Platform:** DDL Judicial Data Portal
*   **3. Direct dataset URL:** [devdatalab.org/judiciary](https://www.devdatalab.org/judiciary)
*   **4. Creator:** Sam Asher, Paul Novosad, and the Development Data Lab team
*   **5. Organization/institution:** Development Data Lab (DDL)
*   **6. Publication/release date:** 2020–2021
*   **7. Last update date:** 2021 (covers data up to 2018)
*   **8. Category:** Court Metadata & Telemetry
*   **9. Description:** A massive socioeconomic and judicial telemetry dataset covering approximately 80 million court cases filed in India's district and subordinate judiciary.
*   **10. Number of records/documents:** Approximately 80 million case records
*   **11. Number of judgments/documents:** N/A (contains metadata only, no full-text judgments or PDFs)
*   **12. Time period covered:** 2010–2018
*   **13. Courts covered:** All district and subordinate (taluka) courts in India
*   **14. Jurisdictions covered:** District and Sub-district judiciary
*   **15. States covered:** All states and Union Territories in India
*   **16. Languages:** English (metadata fields)
*   **17. File format:** CSV / Stata (.dta) / Parquet
*   **18. Data structure:** Tabular relational files containing case tables, judge tables, and disposition tables linked by unique identifiers and geographical keys.
*   **19. Metadata fields:** Case ID, case type, court code, district code, state code, year, filing date, registration date, decision date, judge designation, disposition (decision type), and gender predictions (using ML on names of accused, advocates, and judges).
*   **20. Whether original documents are available:** No
*   **21. Whether only extracted text is available:** No (Only structured metadata and tabular telemetry are available, no full judgment texts or PDFs)
*   **22. Original source:** Official e-Courts portal of India
*   **23. Original source URL:** [ecourts.gov.in](https://ecourts.gov.in/)
*   **24. Data collection methodology:** Broad scraping of the e-Courts portal over several years, followed by massive cleaning, deduplication, de-identification (to protect privacy), and geographical linkage to the SHRUG platform.
*   **25. Provenance status:** **Verified** (directly scraped from the official government e-Courts platform)
*   **26. License:** Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)
*   **27. Usage restrictions:** Non-commercial use only (research and academic study)
*   **28. Commercial-use restrictions:** Yes (commercial use prohibited)
*   **29. Redistribution restrictions:** Yes (redistribution requires same license)
*   **30. Known limitations:** Lacks full-text judgments and PDFs, does not cover High Courts or the Supreme Court, and data is current only up to 2018. Some states/districts have missing or incomplete records due to e-Courts digitization gaps.
*   **31. Freshness/currentness:** Not Fresh (ends in 2018)
*   **32. Potential usefulness:** **Medium** (High for geographical statistics, demographic insights, and lower court telemetry analysis, but Low as a resource for actual legal document search/QA since it contains zero text content or PDFs).
*   **33. Reliability assessment:** Highly Reliable (highly regarded academic project with transparent methodology).

---

### Dataset 7 – kaushik-harsh-99/Indian-legal-data-v3 (Hugging Face)
*   **1. Dataset name:** Indian Legal Data v3
*   **2. Platform:** Hugging Face
*   **3. Direct dataset URL:** [huggingface.co/datasets/kaushik-harsh-99/Indian-legal-data-v3](https://huggingface.co/datasets/kaushik-harsh-99/Indian-legal-data-v3)
*   **4. Creator:** Harsh Kaushik
*   **5. Organization/institution:** Independent researcher / community developer
*   **6. Publication/release date:** 2024
*   **7. Last update date:** 2024
*   **8. Category:** Indian Legal NLP / Instruction Tuning & LLM SFT
*   **9. Description:** A large-scale supervised fine-tuning dataset formatted as instruction-response pairs covering the Indian Penal Code (IPC), Constitution, and legal QA scenarios.
*   **10. Number of records/documents:** 193,641 rows
*   **11. Number of judgments/documents:** N/A (synthesized/extracted instruction pairs)
*   **12. Time period covered:** Current up to 2024 (statutes and codes)
*   **13. Courts covered:** Supreme Court and High Court context (but represents statutes rather than specific courts)
*   **14. Jurisdictions covered:** National / Central Laws
*   **15. States covered:** All states
*   **16. Languages:** English
*   **17. File format:** JSONL / Parquet (Hugging Face format)
*   **18. Data structure:** Key-value rows containing `instruction` (the user prompt/legal query) and `response` (detailed, structured legal explanation).
*   **19. Metadata fields:** `instruction`, `response`, `category` (e.g. IPC, constitutional law, procedural law)
*   **20. Whether original documents are available:** No (Only text instruction-response pairs)
*   **21. Whether only extracted text is available:** Yes (Extracted and synthetically formatted text)
*   **22. Original source:** Scraped text of Indian Central Acts (IPC, CrPC, etc.) and court judgment summaries
*   **23. Original source URL:** Not specified in documentation
*   **24. Data collection methodology:** Scraping statutory books and legal QA web portals, followed by prompt template transformation (often using LLMs like GPT-4 or Claude to format raw legal clauses into QA instruction pairs).
*   **25. Provenance status:** **Unclear** (the underlying legal text is official, but the synthesis process, LLM inputs, and validation are not fully documented or peer-reviewed).
*   **26. License:** MIT License
*   **27. Usage restrictions:** None (highly permissive)
*   **28. Commercial-use restrictions:** None
*   **29. Redistribution restrictions:** None
*   **30. Known limitations:** High risk of synthetic hallucinations in responses; may contain OCR artifacts; lacks official verification; should not be used as an authoritative legal source.
*   **31. Freshness/currentness:** Moderate (up to 2024)
*   **32. Potential usefulness:** **Medium-High** for training/fine-tuning conversational legal chat models; Low for legal search engines or citation analysis.
*   **33. Reliability assessment:** Moderately Reliable (community-contributed, synthetic, high potential for errors or omissions).

---

### Dataset 8 – LH2-data-labs/indian-legal-records (Hugging Face)
*   **1. Dataset name:** Indian Legal Records & AI-Enriched Court Orders
*   **2. Platform:** Hugging Face
*   **3. Direct dataset URL:** [huggingface.co/datasets/LH2-data-labs/indian-legal-records](https://huggingface.co/datasets/LH2-data-labs/indian-legal-records)
*   **4. Creator:** LH2 Data Labs
*   **5. Organization/institution:** LH2 Data Labs (Private enterprise)
*   **6. Publication/release date:** 2024
*   **7. Last update date:** 2024
*   **8. Category:** Court Judgments & AI Enrichment
*   **9. Description:** Massive structured corpus of Indian legal records and court orders, spanning Supreme, High, and District courts, with pre-computed AI summaries and metadata.
*   **10. Number of records/documents:** ~267 million case records
*   **11. Number of judgments/documents:** ~21 million court orders / judgments
*   **12. Time period covered:** Historical up to 2024
*   **13. Courts covered:** Supreme Court, 25 High Courts, 600+ District/Subordinate courts, and specialized tribunals (NCLT, CAT, Consumer forums)
*   **14. Jurisdictions covered:** National, State, and District levels
*   **15. States covered:** All states and Union Territories in India
*   **16. Languages:** English and regional languages
*   **17. File format:** Parquet / JSON
*   **18. Data structure:** Partitioned into sub-datasets: `case_records` (relational metadata) and `ai_enriched` (court orders text, summaries, outcomes, and provisions).
*   **19. Metadata fields:** Case number, petitioner, respondent, court, judge, date, summary, outcome classification, relief, citations of central/state provisions.
*   **20. Whether original documents are available:** No (Only extracted text, summaries, and structured metadata are hosted on HF; full PDFs are not public).
*   **21. Whether only extracted text is available:** Yes (Extracted texts, summaries, and tabular metadata)
*   **22. Original source:** Scraped from e-Courts and official court portals of India
*   **23. Original source URL:** Varies (official portals)
*   **24. Data collection methodology:** Extensive scraping and processing of the entire e-Courts database, followed by automated LLM-based post-processing to generate plain-language summaries, outcome labels, and citation mappings.
*   **25. Provenance status:** **Partially Verified** (data is scraped from official courts, but the scraping engine and parsing code are proprietary and not public).
*   **26. License:** Proprietary Commercial License (`lh2-data-labs-commercial`)
*   **27. Usage restrictions:** For preview and evaluation only; any training, commercial reuse, or product redistribution requires a signed commercial agreement.
*   **28. Commercial-use restrictions:** Yes (strict commercial restrictions)
*   **29. Redistribution restrictions:** Yes (redistribution strictly prohibited)
*   **30. Known limitations:** High licensing costs, proprietary and opaque preprocessing, and potential inaccuracies in AI-generated summaries.
*   **31. Freshness/currentness:** Fresh (current up to 2024)
*   **32. Potential usefulness:** **Low for direct reuse** (due to restrictive commercial license and high cost); Medium as a reference model of what fields and features a comprehensive dataset should include.
*   **33. Reliability assessment:** Moderately Reliable (commercial-grade dataset, but AI-enriched summaries are generated programmatically and may contain errors).

---

## 11. Identify Data Quality Risks
During our investigation, we identified the following critical risks in existing public datasets:

1.  **OCR Errors and Extraction Inconsistencies:** Scanned PDF documents, especially from the 1950s–1980s, suffer from poor OCR. This results in misspelled statutes (e.g., "Sectlon" or "Artlcle") and truncated sentences.
2.  **Duplicate Documents:** Datasets scraped from web portals often contain duplicates due to re-filings, minor amendments, or multi-jurisdictional citations of the same case.
3.  **Missing Case Metadata:** Many community-curated datasets omit crucial fields like CNR numbers, judge names, filing dates, and advocate identities.
4.  **Missing Judgment Dates:** Key temporal data is frequently absent, corrupt, or incorrectly parsed (e.g., swapping DD/MM/YYYY to MM/DD/YYYY).
5.  **Inconsistent Abbreviation Schemas:** "Supreme Court of India" is recorded variously as "SC", "SCI", "Supreme Court", or "Hon'ble Supreme Court", complicating simple text-matching pipelines.
6.  **Scraping Artifacts:** Extracted texts often contain HTML headers, website footers, boilerplate copyright notices, and website navigation links.
7.  **Hallucinations in SFT Data:** Datasets synthesized using LLMs (e.g., `Indian-legal-data-v3`) contain subtle factual errors and imaginary case precedents where the LLM filled in gaps.
8.  **Proprietary Commercial Enclosures:** Highly structured and clean databases (like LH2) are gated behind expensive proprietary licenses, presenting severe compliance risks.

---

## 12. Identify Gaps
A gap analysis reveals that while Supreme Court raw texts are abundant, structured and clean legislative datasets, subordinate court texts, and multi-lingual datasets are heavily underrepresented.

| Category | Existing Availability | Quality | Main Gap | Likely Need for Our Collection |
|---|---|---|---|---|
| **Acts / Statutes** | Medium | Low | Scattered PDFs; no unified database matching central/state acts to historical amendments. | **Yes** (Needs structured scraper of India Code) |
| **Rules & Regulations** | Low | Very Low | Subordinate legislation, circulars, and notifications are almost completely unindexed in NLP datasets. | **Yes** (Requires scraping of official gazette nodes) |
| **Supreme Court Judgments** | High | Medium | Bulk PDFs are available (via AWS), but clean, normalized, full-text OCR remains scarce. | **No** (Can reuse AWS open data for raw inputs) |
| **High Court Judgments** | Medium-High | Medium-Low | Massive scale exists, but OCR is highly inconsistent, and state-specific indexing is poor. | **No** (Can reuse AWS open data, but needs clean pipelines) |
| **District/Lower Courts** | Medium (Telemetry) | Minimal (Text) | DDL provides case telemetry, but full-text judgments or PDFs from lower courts are virtually nonexistent. | **Yes** (Selective regional lower court crawling) |
| **Original Legal PDFs** | High | High | Available only for Supreme Court and High Courts. NLP datasets only distribute parsed text. | **No** (Can download directly from S3 repositories) |
| **Multilingual Data** | Low | Low | Judgments translated into regional languages are not organized or labeled in any NLP dataset. | **Yes** (Scrape Supreme Court translated judgments) |
| **Structured Citations** | Low | Low | Mapping between judgment text and the exact Central/State Acts cited is restricted to small NLP datasets. | **Yes** (Build automated parser on top of raw texts) |

---

## 13. Determine What We Can Potentially Reuse
We categorize the researched datasets into three categories:

### A. Potentially Useful (Direct ingestion/parsing of raw data)
*   **Indian Supreme Court Judgments (AWS Open Data):** Excellent source of raw PDFs and JSON metadata. Under CC BY 4.0, we can download and ingest this database to seed our repository.
*   **Indian High Court Judgments (AWS Open Data):** Massive coverage of state-level raw PDFs. Under CC BY 4.0, we can selectively ingest data from key High Courts (e.g., Bombay, Delhi, Allahabad).

### B. Useful for Research / Benchmarking (Training and processing benchmarks)
*   **InLegalNER (OpenNyAI):** MIT licensed. Highly useful for training our token classification pipeline to parse entity spans in raw documents.
*   **LegalEval (OpenNyAI):** MIT licensed. Essential for training our segmentation models to break judgments into Facts, Issue, Ratio, and Ruling blocks.
*   **ILDC (IIT Kharagpur):** Under CC BY-NC-SA 4.0. Cannot be used in commercial products, but serves as a solid benchmark to validate our custom judgment prediction and reasoning architectures.

### C. Not Suitable for Direct Reuse
*   **LH2-data-labs/indian-legal-records:** Restrictive commercial licensing. Direct ingestion presents high legal and commercial risks.
*   **kaushik-harsh-99/Indian-legal-data-v3:** Unclear provenance and reliance on synthetic LLM generation introduce high risk of hallucinated legal rules. Suitable only for offline exploratory testing.
*   **DDL Judicial e-Courts Dataset:** Lacks full text and is licensed under CC BY-NC-SA 4.0.

---

## 14. Recommendations

1.  **Ingest Raw Judgments from AWS Open Data:** Rather than building scrapers for Supreme and High Court portals, download the bulk data directly from the S3 buckets `s3://indian-supreme-court-judgments` and `s3://indian-high-court-judgments`.
2.  **Scrape India Code for Acts/Statutes:** Prioritize building a scraper for [`indiacode.nic.in`](https://www.indiacode.nic.in/) to extract a structured hierarchy of Central and State Acts, linking sections to their corresponding text.
3.  **Mandatory CNR and Case Number Tracking:** Our database schema must capture the Case Number Record (CNR) as the primary unique key to prevent duplicates and enable downstream updates.
4.  **Build a Citation Parser using InLegalNER:** Train a custom Named Entity Recognition (NER) model on InLegalNER to extract statutory citations (e.g., Section 302 of the IPC) from raw text.
5.  **Implement OCR Refinement Pipelines:** For judgments older than 1990, pass the raw PDFs through a modernized OCR pipeline (e.g., Tesseract or a cloud-based OCR engine) to clean up character corruptions.
6.  **Create a Golden Verification Set:** Manually audit a random sample of 500 judgments to check the accuracy of extracted fields (judges, dates, outcomes).

---

## 15. Final Conclusion

*   **How much relevant Indian legal data already exists?**
    A significant volume of raw judicial text exists—over 16 million High Court judgments and 60,000 Supreme Court judgments are accessible in bulk. However, clean, structured, and legally validated NLP datasets are limited to academic scales (~35,000 documents for ILDC, and under 500 documents for LegalEval).
*   **Which existing datasets appear strongest?**
    The Dattam Labs datasets on the **AWS Registry of Open Data** are the strongest source for raw judicial documents. The OpenNyAI datasets (**InLegalNER** and **LegalEval**) are the strongest resources for training structural extraction models.
*   **How trustworthy is the existing ecosystem?**
    The ecosystem is bifurcated. Official bulk repositories (AWS) are highly trustworthy, but community uploads (Kaggle/Hugging Face) suffer from unclear licensing, synthetic hallucinations, OCR corruption, and poor documentation.
*   **What data can potentially be reused?**
    We can reuse the AWS Open Data repositories for raw judgment files and the OpenNyAI benchmarks for model training.
*   **What data remains missing?**
    A structured database mapping Acts/Sections to judgments, subordinate/district court texts, and gazette rules/regulations are missing from the public domain.
*   **Why is our own collection still necessary?**
    Our collection is necessary to build a clean database linking statutes directly to case law, extending coverage to subordinate courts, and capturing multi-lingual records.
*   **Next Phase Strategy:**
    1. Configure an S3 download client to sync raw PDFs and Parquet metadata from the AWS Open Data Registry.
    2. Build a crawler to compile Central and State Acts from India Code.
    3. Train extraction models to link these two resources into a unified legal graph.
