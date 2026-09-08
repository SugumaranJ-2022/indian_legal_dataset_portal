import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and render total page count
    along with running header and footer.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#1e293b"))
            self.drawString(40, 808, "INDIAN LEGAL DATASET & AUDIT NETWORK PORTAL")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawRightString(555, 808, "Client Presentation & System Architecture Guide")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.75)
            self.line(40, 800, 555, 800)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.75)
        self.line(40, 45, 555, 45)

        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#0284c7"))
        self.drawString(40, 32, "ENTERPRISE LEGAL AI")
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(145, 32, "|  Confidential & Proprietary  |  Prepared for Client & Stakeholder Briefings")

        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(555, 32, page_str)
        self.restoreState()


def build_pdf(filename="Indian_Legal_Dataset_Portal_Client_Guide.pdf"):
    # Page setup: A4 (595.27 x 841.89 pt). Margins: 40pt left/right, 50pt top/bottom.
    # Usable width = 595.27 - 80 = 515.27 pt.
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=48,
        bottomMargin=52
    )

    content_width = 515.27

    # Palettes
    PRIMARY = colors.HexColor("#0f172a")     # Slate 900
    SECONDARY = colors.HexColor("#1e40af")   # Blue 800
    ACCENT = colors.HexColor("#0284c7")      # Sky 600
    DARK_TEXT = colors.HexColor("#0f172a")
    BODY_TEXT = colors.HexColor("#334155")   # Slate 700
    MUTED_TEXT = colors.HexColor("#64748b")  # Slate 500
    LIGHT_BG = colors.HexColor("#f8fafc")    # Slate 50
    CARD_BG = colors.HexColor("#f1f5f9")     # Slate 100
    BORDER_COLOR = colors.HexColor("#cbd5e1")# Slate 300
    SUCCESS_COLOR = colors.HexColor("#15803d") # Green 700
    WARN_COLOR = colors.HexColor("#b45309")    # Amber 700

    styles = getSampleStyleSheet()

    # Custom styles - tuned for clean 4-page layout
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.white
    )

    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#93c5fd")
    )

    h1_style = ParagraphStyle(
        "SectionH1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=PRIMARY,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        "SectionH2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=SECONDARY,
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        "StandardBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=BODY_TEXT,
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        "BulletItem",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=BODY_TEXT,
        leftIndent=10,
        firstLineIndent=-7,
        spaceAfter=2.5
    )

    callout_style = ParagraphStyle(
        "CalloutText",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11.5,
        textColor=PRIMARY
    )

    table_header = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=10,
        textColor=colors.white
    )

    table_cell = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.2,
        leading=9.5,
        textColor=BODY_TEXT
    )

    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.2,
        leading=9.5,
        textColor=PRIMARY
    )

    story = []

    # ==========================================
    # PAGE 1: COVER, EXECUTIVE SUMMARY, CRISES
    # ==========================================
    header_table_data = [
        [
            Paragraph("🏛️ INDIAN LEGAL DATASET & AUDIT NETWORK PORTAL", title_style)
        ],
        [
            Spacer(1, 2)
        ],
        [
            Paragraph("Enterprise System Architecture, Business Rationale & Complete Client Presentation Guide", subtitle_style)
        ]
    ]

    header_table = Table(header_table_data, colWidths=[content_width])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PRIMARY),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 6))

    # Meta banner table
    meta_data = [
        [
            Paragraph("<b>Target Audience:</b> Enterprise Clients, Legal Tech Partners, CTOs & Law Teams", table_cell),
            Paragraph("<b>Status:</b> Live & Operational (React + FastAPI)", table_cell),
            Paragraph("<b>Author:</b> AI & Legal Engineering", table_cell),
            Paragraph("<b>Date:</b> September 2026", table_cell)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[content_width * 0.40, content_width * 0.26, content_width * 0.20, content_width * 0.14])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("1. Executive Summary", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.2, color=SECONDARY, spaceAfter=5, spaceBefore=1))
    
    exec_text = (
        "The <b>Indian Legal Dataset & Audit Network Portal</b> is an enterprise-grade ingestion, audit, and "
        "discovery platform built to transform India's fragmented legal data into verified, structured, and "
        "AI-ready datasets. India is home to over <b>16 million High Court</b> and <b>60,000 Supreme Court "
        "judgments</b>, alongside 80+ million subordinate court records. However, virtually all of this data is "
        "trapped in unstructured, scanned PDFs plagued by severe OCR corruption, missing metadata, and duplicate filings. "
        "This platform acts as an authoritative <i>Quality Gate</i> and collaborative workspace—extracting statutory citations, "
        "enforcing a 6-point verification checklist, and delivering sub-second full-text search with 150-character context snippets."
    )
    story.append(Paragraph(exec_text, body_style))
    story.append(Spacer(1, 3))

    # Value Proposition Cards Grid
    prop_data = [
        [
            Paragraph("<b>⚡ 70%+ Research Time Saved</b><br/>Instant 150-character search snippets and regex citation extraction eliminate manual 50-page PDF scans.", table_cell),
            Paragraph("<b>🛡️ Zero AI Hallucination Risk</b><br/>Strict human-in-the-loop audit gate guarantees verified ground truth before training LLMs or RAG pipelines.", table_cell),
            Paragraph("<b>🔄 Real-Time Collaboration</b><br/>WebSocket invalidation broadcasts notes, annotations, and verifications to all connected team members instantly.", table_cell)
        ]
    ]
    prop_table = Table(prop_data, colWidths=[content_width/3, content_width/3, content_width/3])
    prop_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(prop_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("2. The Core Problem: Why This Project is Needed", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.2, color=SECONDARY, spaceAfter=5, spaceBefore=1))

    p2_intro = (
        "Enterprise clients and legal tech teams cannot deploy reliable Legal AI without clean, verified data. "
        "Our comprehensive legal research revealed <b>four critical industry crises</b> that make this platform essential:"
    )
    story.append(Paragraph(p2_intro, body_style))

    crises = [
        ("1. The 'Garbage In, Garbage Out' Hallucination Crisis:", 
         "Feeding raw, unverified court PDFs into Large Language Models (LLMs) or retrieval-augmented generation (RAG) "
         "systems causes subtle but disastrous hallucinations—inventing non-existent case precedents or confusing central statutes. "
         "In legal practice, citing an invalid precedent leads to severe court sanctions. Our platform enforces human-in-the-loop "
         "verification before data is marked AI-ready."),

        ("2. The Scanned PDF & OCR Degradation Crisis:", 
         "Judgments from the 1950s through 1990s are stored as scanned, faded raster images. Standard OCR consistently "
         "scrambles legal sections (e.g., misreading 'Section 302' as 'Sectlon 3O2' or 'Article 21' as 'Artlcle 2l'). "
         "Our system isolates OCR-degraded judgments, categorizing them for modernized OCR refinement before they corrupt indexing."),

        ("3. Massive Fragmentation & Missing Case Identifiers:", 
         "Indian judgments are distributed across 25 distinct High Courts, the Supreme Court, and over 600 District Courts. "
         "Crucial metadata such as Case Number Records (CNR), judge names, filing dates, and outcome classifications are missing or "
         "recorded under inconsistent naming schemes (e.g., 'SC', 'SCI', 'Hon'ble Supreme Court'). Our pipeline standardizes all records."),

        ("4. The Commercial Paywall vs. Shady Scrapes Dilemma:", 
         "Clean proprietary databases (like SCC Online or Manupatra) cost thousands of dollars per seat and legally prohibit "
         "AI model training. Conversely, free community dumps on Kaggle or Hugging Face lack proven provenance, omit original PDFs, "
         "or include synthetic hallucinations. This platform bridges that gap by establishing an open, legally auditable pipeline directly "
         "traceable to official government repositories.")
    ]

    for title, desc in crises:
        story.append(Paragraph(f"<b>• {title}</b> {desc}", bullet_style))

    # Page 1 ends cleanly here
    story.append(PageBreak())

    # ==========================================
    # PAGE 2: ARCHITECTURE & PRESENTATION OVERVIEW
    # ==========================================
    story.append(Paragraph("3. Platform Architecture & The Three Functional Pillars", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.2, color=SECONDARY, spaceAfter=6, spaceBefore=1))

    pillars_table_data = [
        [
            Paragraph("<b>PILLAR 1: INGESTION & AI PARSING</b>", table_header),
            Paragraph("<b>PILLAR 2: AUDIT & VERIFICATION GATE</b>", table_header),
            Paragraph("<b>PILLAR 3: DISCOVERY & WORKSPACE</b>", table_header)
        ],
        [
            Paragraph(
                "• <b>PyPDF2 Binary Extraction</b>: Fast Unicode stream parsing.<br/>"
                "• <b>Regex Statute Parser</b>: Identifies statutory citations (e.g., Article 21, Section 482 CrPC).<br/>"
                "• <b>Judicial Outcome Matcher</b>: Detects ruling classifications ('petition allowed', 'appeal dismissed').",
                table_cell
            ),
            Paragraph(
                "• <b>6-Point Audit Checklist</b>: Verifies Source, OCR, Content, Metadata, Version, & Duplicates.<br/>"
                "• <b>Role-Based Safety Lock</b>: Prevents researchers from bypassing reviewer gates.<br/>"
                "• <b>De-Duplication Engine</b>: Side-by-side comparison with Keep/Merge/Delete.",
                table_cell
            ),
            Paragraph(
                "• <b>Full-Text Search (FTS)</b>: Sub-second database queries with 150-char context window previews.<br/>"
                "• <b>WebSocket Live Notes</b>: Real-time sticky notes synced across team members.<br/>"
                "• <b>State Heatmaps</b>: Visual telemetry on nationwide judicial coverage.",
                table_cell
            )
        ]
    ]

    pillars_table = Table(pillars_table_data, colWidths=[content_width/3, content_width/3, content_width/3])
    pillars_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('BACKGROUND', (0, 1), (-1, 1), LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(pillars_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("4. Step-by-Step Client Presentation Playbook", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.2, color=SECONDARY, spaceAfter=6, spaceBefore=1))

    story.append(Paragraph(
        "Use this battle-tested meeting structure and script when demonstrating the platform to enterprise clients, "
        "partners, or senior stakeholders. Total estimated demo duration: <b>10 to 12 minutes</b>.", body_style
    ))
    story.append(Spacer(1, 3))

    # Timeline table
    time_data = [
        [
            Paragraph("<b>Stage & Timeline</b>", table_header),
            Paragraph("<b>Core Focus & Screen</b>", table_header),
            Paragraph("<b>Key Takeaway for Client</b>", table_header)
        ],
        [
            Paragraph("<b>Stage 1: 0:00 - 1:00</b>", table_cell_bold),
            Paragraph("The 60-Second Elevator Pitch", table_cell),
            Paragraph("Establishes the commercial problem: unverified data breaks AI.", table_cell)
        ],
        [
            Paragraph("<b>Stage 2: 1:00 - 3:00</b>", table_cell_bold),
            Paragraph("Market Context & Pain Points", table_cell),
            Paragraph("Explains the 16M case backlog and why off-the-shelf LLMs fail.", table_cell)
        ],
        [
            Paragraph("<b>Stage 3: 3:00 - 8:00</b>", table_cell_bold),
            Paragraph("Live Interactive Walkthrough (4 Screens)", table_cell),
            Paragraph("Proves functional depth: FTS snippets, AI summaries, 6-point audit.", table_cell)
        ],
        [
            Paragraph("<b>Stage 4: 8:00 - 10:00</b>", table_cell_bold),
            Paragraph("Technical Architecture & Security", table_cell),
            Paragraph("Demonstrates enterprise readiness (FastAPI, React, WebSockets, RBAC).", table_cell)
        ],
        [
            Paragraph("<b>Stage 5: 10:00 - 12:00</b>", table_cell_bold),
            Paragraph("Client Q&A & Commercial Closing", table_cell),
            Paragraph("Resolves objections and agrees on deployment/pilot milestones.", table_cell)
        ]
    ]

    time_table = Table(time_data, colWidths=[content_width * 0.22, content_width * 0.38, content_width * 0.40])
    time_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), SECONDARY),
        ('BACKGROUND', (0, 1), (-1, 1), LIGHT_BG),
        ('BACKGROUND', (0, 3), (-1, 3), LIGHT_BG),
        ('BACKGROUND', (0, 5), (-1, 5), LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(time_table)
    story.append(Spacer(1, 8))

    # Word-for-Word Elevator Pitch
    story.append(Paragraph("A. The 60-Second Elevator Pitch (What to Say)", h2_style))
    
    pitch_box_data = [[
        Paragraph(
            "<i>\"Hello [Client Name], today I am demonstrating the <b>Indian Legal Dataset & Audit Network Portal</b>. "
            "Every enterprise in the legal space is attempting to deploy Legal AI—whether for instant case search, contract "
            "review, or automated litigation drafting. However, India's 16 million court judgments are trapped in unstructured, "
            "scanned PDFs filled with bad OCR and missing citations.<br/><br/>"
            "If you feed dirty data to an AI model, it hallucinates fake case precedents. Our platform provides the end-to-end "
            "infrastructure to solve this: <b>it automatically ingests raw judgments, parses statutory citations, enforces a strict "
            "6-point quality audit, and enables real-time collaboration between researchers and auditors.</b> "
            "Let me walk you through the live system.\"</i>",
            callout_style
        )
    ]]
    pitch_box = Table(pitch_box_data, colWidths=[content_width])
    pitch_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#eff6ff")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#93c5fd")),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(pitch_box)

    # Page 2 ends cleanly here
    story.append(PageBreak())

    # ==========================================
    # PAGE 3: LIVE DEMO SCRIPT (SCREENS 1 TO 4)
    # ==========================================
    story.append(Paragraph("B. Live Demo Step-by-Step Script (Screen by Screen)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.2, color=SECONDARY, spaceAfter=8, spaceBefore=1))

    demo_steps = [
        ("Screen 1: Executive Dashboard (URL: /)",
         "Navigate to the dashboard and point out the State-by-State Heatmap and Ingestion Metrics.",
         "\"This is the executive command center. It gives research leaders instant telemetry on judicial coverage across High Courts and tribunals nationwide. You can immediately see how many cases are verified, under review, or flagged as duplicates, pinpointing geographical data gaps at a glance.\""),

        ("Screen 2: Document Collection & Full-Text Search (URL: /documents)",
         "Type 'Article 21' or 'Bail' into the Search Bar. Show the 150-char contextual preview snippet. Open the details drawer to show the 'AI Summary' tab and the 'Sticky Notes' tab.",
         "\"Normally, legal researchers waste hours downloading and skimming 50-page PDFs. Our platform changes this in two ways: first, our full-text search engine displays an instant 150-character contextual snippet under each result without downloading the PDF. Second, our built-in regex engine parses statutory provisions and court rulings automatically. Furthermore, team members can collaborate live using WebSocket-powered sticky notes.\""),

        ("Screen 3: The Quality Verification Gate (URL: /quality)",
         "Display the 6-point checklist. Use the User Role Switcher in the sidebar to switch to 'Researcher'—show the locked inputs and warning banner. Switch back to 'Reviewer' and verify a record.",
         "\"This is our critical defense against bad data. We enforce a 6-point checklist: Source Mapped, Readable PDF, Complete Content, Metadata Correct, Version Control, and Duplicate Audited. Using Role-Based Access Control, researchers are prevented from approving records—only certified Reviewers can promote a case to 'Verified' status.\""),

        ("Screen 4: De-Duplication & Telemetry Center (URL: /duplicates & /reports)",
         "Show side-by-side case comparisons with Keep, Merge, and Delete actions. Navigate to Reports and demonstrate JSON/Parquet dataset compilation.",
         "\"Because identical petitions are frequently refiled or amended across courts, duplicate data is rampant. Our automated de-duplication engine highlights conflicting records side-by-side, allowing administrators to resolve them before exporting clean, structured datasets ready for AI vector databases.\"")
    ]

    for title, action, speech in demo_steps:
        story.append(Paragraph(f"<b>{title}</b>", h2_style))
        story.append(Paragraph(f"• <b>Action on Screen:</b> {action}", body_style))
        story.append(Paragraph(f"• <b>What to Say to Client:</b> <i>{speech}</i>", body_style))
        story.append(Spacer(1, 4))

    # Page 3 ends cleanly here
    story.append(PageBreak())

    # ==========================================
    # PAGE 4: SPECS, FAQ, ROADMAP & CLOSE
    # ==========================================
    story.append(Paragraph("5. Technical Architecture & System Specifications", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.2, color=SECONDARY, spaceAfter=5, spaceBefore=1))

    tech_data = [
        [
            Paragraph("<b>Component Layer</b>", table_header),
            Paragraph("<b>Technology Stack</b>", table_header),
            Paragraph("<b>Architectural Role & Performance Benefit</b>", table_header)
        ],
        [
            Paragraph("<b>Frontend Client</b>", table_cell_bold),
            Paragraph("React 18 + TypeScript + Vite + Tailwind CSS", table_cell),
            Paragraph("Blazing fast SPA, reactive UI, enterprise dark/light layouts, Lucide icons.", table_cell)
        ],
        [
            Paragraph("<b>State Management</b>", table_cell_bold),
            Paragraph("TanStack React Query", table_cell),
            Paragraph("Automatic background caching, optimistic UI updates, and server sync.", table_cell)
        ],
        [
            Paragraph("<b>Backend Server</b>", table_cell_bold),
            Paragraph("FastAPI (Python 3.9+) + Uvicorn", table_cell),
            Paragraph("Asynchronous ASGI architecture, sub-millisecond REST, automatic OpenAPI/Swagger.", table_cell)
        ],
        [
            Paragraph("<b>Real-Time Pipeline</b>", table_cell_bold),
            Paragraph("WebSockets (/api/ws)", table_cell),
            Paragraph("Full-duplex broadcasting for instant multi-user sticky note and annotation sync.", table_cell)
        ],
        [
            Paragraph("<b>Database & ORM</b>", table_cell_bold),
            Paragraph("SQLite + SQLAlchemy ORM", table_cell),
            Paragraph("Relational persistence with full-text search indexing; migration-ready for PostgreSQL.", table_cell)
        ],
        [
            Paragraph("<b>Ingestion & NLP</b>", table_cell_bold),
            Paragraph("PyPDF2 + Regex Boundary Engine", table_cell),
            Paragraph("Binary PDF stream extraction; extracts Article 21, Section 302 IPC, and rulings.", table_cell)
        ],
        [
            Paragraph("<b>Access Control</b>", table_cell_bold),
            Paragraph("Dynamic RBAC Headers + RoleGuard", table_cell),
            Paragraph("Decoupled role evaluation: client route guards + backend header interceptors.", table_cell)
        ]
    ]

    tech_table = Table(tech_data, colWidths=[content_width * 0.22, content_width * 0.38, content_width * 0.40])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('BACKGROUND', (0, 1), (-1, 1), LIGHT_BG),
        ('BACKGROUND', (0, 3), (-1, 3), LIGHT_BG),
        ('BACKGROUND', (0, 5), (-1, 5), LIGHT_BG),
        ('BACKGROUND', (0, 7), (-1, 7), LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 7))

    story.append(Paragraph("6. Client Objection Defense & FAQ", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.2, color=SECONDARY, spaceAfter=5, spaceBefore=1))

    faqs = [
        ("Q1: 'Why can't we just point ChatGPT or an off-the-shelf LLM directly at Indian court websites?'",
         "Commercial LLMs cannot ingest 50-page scanned raster PDFs in real time—it would cost hundreds of dollars per case "
         "in token fees and result in severe hallucinations. Our portal pre-processes, structures, verifies, and indexes the text, "
         "allowing downstream LLMs to receive 100% verified, hallucination-free legal context at minimal compute cost."),

        ("Q2: 'How does the portal handle degraded OCR on 1960s–1980s judgments?'",
         "Our ingestion engine separates PDF text extraction from validation. When older scanned judgments exhibit high character corruption, "
         "the Reviewer flags them in the 6-point checklist as 'Needs OCR Refinement'. This isolates degraded files from the clean training pool "
         "and routes them into cloud-based specialized OCR correction pipelines."),

        ("Q3: 'Can this platform scale to millions of cases across all 25 High Courts?'",
         "Yes. The architecture decouples heavy binary storage (hosted on AWS S3 or MinIO) from metadata querying. "
         "The FastAPI backend is fully asynchronous, and the database schema is indexed for sub-millisecond retrieval even across "
         "millions of rows. The system seamlessly supports PostgreSQL or partitioned Parquet storage."),

        ("Q4: 'Can we export verified datasets into our existing Vector Databases or RAG pipelines?'",
         "Absolutely. Through the Reports Compiler and RESTful export endpoints, verified records can be exported in standard JSONL, "
         "CSV, or Apache Parquet formats. This allows instant plug-and-play ingestion into ChromaDB, Pinecone, Milvus, or LangChain pipelines.")
    ]

    for q, a in faqs:
        story.append(Paragraph(f"<b>{q}</b>", h2_style))
        story.append(Paragraph(f"<b>Answer:</b> {a}", body_style))

    story.append(Spacer(1, 5))

    # Roadmap and sign-off
    story.append(Paragraph("7. Strategic Roadmap & Implementation Milestones", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.2, color=SECONDARY, spaceAfter=4, spaceBefore=1))

    roadmap_data = [
        [
            Paragraph("<b>Phase</b>", table_header),
            Paragraph("<b>Strategic Objective</b>", table_header),
            Paragraph("<b>Deliverables & Technical Output</b>", table_header)
        ],
        [
            Paragraph("<b>Phase 1</b>", table_cell_bold),
            Paragraph("Core Judicial Ingestion", table_cell),
            Paragraph("Ingest bulk Supreme Court and Top-5 High Court datasets via AWS Open Data S3 archives.", table_cell)
        ],
        [
            Paragraph("<b>Phase 2</b>", table_cell_bold),
            Paragraph("India Code Legislative Graph", table_cell),
            Paragraph("Build crawlers for indiacode.nic.in to link Central/State statutory sections to case precedents.", table_cell)
        ],
        [
            Paragraph("<b>Phase 3</b>", table_cell_bold),
            Paragraph("Vector & RAG Deployment", table_cell),
            Paragraph("Generate dense embeddings from verified judgments for enterprise semantic search and legal AI assistants.", table_cell)
        ]
    ]

    roadmap_table = Table(roadmap_data, colWidths=[content_width * 0.15, content_width * 0.35, content_width * 0.50])
    roadmap_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('BACKGROUND', (0, 1), (-1, 1), LIGHT_BG),
        ('BACKGROUND', (0, 3), (-1, 3), LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(roadmap_table)
    story.append(Spacer(1, 6))

    # Sign-off banner
    signoff_data = [[
        Paragraph(
            "<b>Ready for Enterprise Deployment:</b> The Indian Legal Dataset & Audit Network Portal is currently running and fully operational. "
            "To schedule a live customized walkthrough or begin pilot deployment, contact the AI & Legal Engineering Team.",
            ParagraphStyle("Signoff", parent=body_style, textColor=PRIMARY, alignment=1)
        )
    ]]
    signoff_box = Table(signoff_data, colWidths=[content_width])
    signoff_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(signoff_box)


    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {filename}")


if __name__ == "__main__":
    out_file = "Indian_Legal_Dataset_Portal_Client_Guide.pdf"
    if len(sys.argv) > 1:
        out_file = sys.argv[1]
    build_pdf(out_file)
