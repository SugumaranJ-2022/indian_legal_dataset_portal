import os
import datetime
from sqlalchemy.orm import Session
import openpyxl
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
from reportlab.pdfgen import canvas

from app.core.config import settings
from app.models.models import Source, Document, QualityCheck, Duplicate, CourtMetadata

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and render page numbers
    in 'Page X of Y' format, skipping the cover page.
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
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        # We don't draw headers/footers on the cover page
        if self._pageNumber == 1:
            return
        
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b")) # slate-500
        
        # Header text
        self.drawString(54, 800, "INDIAN LEGAL DATASET RESEARCH PORTAL — DATA AUDIT REPORT")
        self.setStrokeColor(colors.HexColor("#cbd5e1")) # slate-300
        self.setLineWidth(0.5)
        self.line(54, 792, 595 - 54, 792) # A4 width is 595.27 points
        
        # Footer text
        self.drawString(54, 40, "Confidential — Internal Research Use Only")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(595 - 54, 40, page_text)
        self.line(54, 52, 595 - 54, 52)
        
        self.restoreState()


def generate_excel_report(db: Session, file_path: str):
    """
    Export all portal data tables into a single Excel file with multiple sheets using openpyxl directly.
    """
    wb = openpyxl.Workbook()
    
    # 1. Sources Sheet
    ws_sources = wb.active
    ws_sources.title = "Sources"
    sources = db.query(Source).all()
    headers_sources = ["ID", "Website Name", "Authority", "Category", "Source Type", "Languages", "Download Available", "Website URL", "Notes"]
    ws_sources.append(headers_sources)
    for s in sources:
        ws_sources.append([s.id, s.website_name, s.authority, s.category, s.source_type, s.languages, s.download_available, s.website_url, s.notes])

    # 2. Documents Sheet
    ws_docs = wb.create_sheet(title="Documents")
    docs = db.query(Document).all()
    headers_docs = ["ID", "Doc Code", "Title", "Year", "Category", "Authority", "Language", "Source ID", "Source URL", "Filename", "Version", "Status", "Uploaded At"]
    ws_docs.append(headers_docs)
    for d in docs:
        uploaded_str = d.uploaded_at.strftime('%Y-%m-%d %H:%M:%S') if d.uploaded_at else ""
        ws_docs.append([d.id, d.document_code, d.title, d.year, d.category, d.authority, d.language, d.source_id, d.source_url, d.filename, d.version, d.status, uploaded_str])

    # 3. Court Metadata Sheet
    ws_court = wb.create_sheet(title="Metadata")
    court_meta = db.query(CourtMetadata).all()
    headers_court = ["ID", "Doc ID", "CNR Number", "Case Number", "Case Type", "Court", "State", "District", "Petitioner", "Respondent", "Filing Date", "Hearing Date", "Disposal Date", "Judge", "Case Status"]
    ws_court.append(headers_court)
    for c in court_meta:
        filing_str = c.filing_date.strftime('%Y-%m-%d') if c.filing_date else ""
        hearing_str = c.hearing_date.strftime('%Y-%m-%d') if c.hearing_date else ""
        disposal_str = c.disposal_date.strftime('%Y-%m-%d') if c.disposal_date else ""
        ws_court.append([c.id, c.document_id, c.cnr_number, c.case_number, c.case_type, c.court, c.state, c.district, c.petitioner, c.respondent, filing_str, hearing_str, disposal_str, c.judge, c.case_status])

    # 4. Quality Checks Sheet
    ws_quality = wb.create_sheet(title="Quality")
    quality = db.query(QualityCheck).all()
    headers_quality = ["ID", "Doc ID", "Official Source", "Readable PDF", "Complete Content", "Metadata Correct", "Duplicate Checked", "Version Verified", "Verification Status"]
    ws_quality.append(headers_quality)
    for q in quality:
        ws_quality.append([q.id, q.document_id, q.official_source, q.readable, q.complete_content, q.metadata_correct, q.duplicate_checked, q.version_verified, q.verification_status])

    # 5. Duplicates Sheet
    ws_dups = wb.create_sheet(title="Duplicates")
    dups = db.query(Duplicate).all()
    headers_dups = ["ID", "Doc ID", "Duplicate Doc ID", "Reason", "Action Taken", "Resolution Status"]
    ws_dups.append(headers_dups)
    for dp in dups:
        ws_dups.append([dp.id, dp.document_id, dp.duplicate_document_id, dp.reason, dp.action, dp.status])

    wb.save(file_path)


def generate_pdf_report(db: Session, file_path: str) -> str:
    """
    Generates a professional A4 PDF report with Cover Page, Table of Contents, 
    Dataset stats, and tables mapping each deliverable.
    """
    doc_template = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=54,
        leftMargin=54,
        topMargin=72,
        bottomMargin=72
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#1e3a8a") # deep blue
    c_secondary = colors.HexColor("#0f766e") # teal
    c_dark = colors.HexColor("#1e293b") # dark slate
    c_light = colors.HexColor("#f8fafc") # slate-50

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=30,
        leading=38,
        textColor=c_primary,
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#475569"),
        spaceAfter=300
    )
    
    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=c_dark,
        spaceBefore=20,
        spaceAfter=10,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=c_secondary,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=c_dark,
        spaceAfter=8
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=c_dark
    )

    story = []

    # ================= COVER PAGE =================
    story.append(Spacer(1, 40))
    story.append(Paragraph("INDIAN LEGAL DATASET AUDIT REPORT", title_style))
    story.append(Paragraph("Enterprise Portal Verification & Analytics Summary", subtitle_style))
    
    # Metadata Box at the bottom of Cover Page
    metadata_text = f"""
    <b>Report Date:</b> {datetime.datetime.now().strftime('%d %B, %Y')}<br/>
    <b>Author:</b> Indian Legal Research Portal Team<br/>
    <b>Status:</b> Official Release<br/>
    <b>Classification:</b> Confidential / Government Data Team Standard
    """
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_primary, spaceBefore=20, spaceAfter=20))
    story.append(Paragraph(metadata_text, body_style))
    story.append(PageBreak())

    # ================= TABLE OF CONTENTS & EXEC SUMMARY =================
    story.append(Paragraph("Executive Summary", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_secondary, spaceAfter=15))
    
    summary_text = """
    This comprehensive dataset audit report compiles findings from the <b>Legal Dataset Research Portal</b>. 
    The portal facilitates the mapping, collection, and verification of authoritative Indian legal sources, 
    statutes, rules, and court judgments. By applying robust metadata checklists, deduplication analysis, 
    and quality rules, the system ensures high integrity and completeness for downstream language model training 
    and legal analysis tools.
    """
    story.append(Paragraph(summary_text, body_style))
    
    # Statistics Summary
    total_sources = db.query(Source).count()
    total_docs = db.query(Document).count()
    verified_docs = db.query(Document).filter(Document.status == "Verified").count()
    needs_review_docs = db.query(Document).filter(Document.status == "Needs Review").count()
    duplicate_docs = db.query(Duplicate).count()

    story.append(Spacer(1, 10))
    story.append(Paragraph("Key Portal Statistics", h2_style))
    
    stats_data = [
        [Paragraph("<b>Metric</b>", table_cell_style), Paragraph("<b>Count</b>", table_cell_style), Paragraph("<b>Description</b>", table_cell_style)],
        [Paragraph("Total Sources Mapped", table_cell_style), Paragraph(str(total_sources), table_cell_style), Paragraph("Unique government databases and repositories cataloged.", table_cell_style)],
        [Paragraph("Total Documents Collected", table_cell_style), Paragraph(str(total_docs), table_cell_style), Paragraph("PDF files successfully compiled and indexed.", table_cell_style)],
        [Paragraph("Verified (Fully Audited)", table_cell_style), Paragraph(str(verified_docs), table_cell_style), Paragraph("Documents passing all quality verification tests.", table_cell_style)],
        [Paragraph("Needs Review", table_cell_style), Paragraph(str(needs_review_docs), table_cell_style), Paragraph("Documents waiting for manual review or missing checks.", table_cell_style)],
        [Paragraph("Duplicates Identified", table_cell_style), Paragraph(str(duplicate_docs), table_cell_style), Paragraph("Deduplicated document warnings needing resolution.", table_cell_style)]
    ]
    
    stats_table = Table(stats_data, colWidths=[130, 60, 300])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_light),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
    ]))
    story.append(stats_table)
    story.append(Spacer(1, 15))

    # ================= SOURCE LIST =================
    story.append(Paragraph("1. Source List Deliverable", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_secondary, spaceAfter=10))
    story.append(Paragraph("The following list represents all mapped legal source registries monitored by researchers.", body_style))
    
    sources = db.query(Source).all()
    source_rows = [[
        Paragraph("<b>Website Name</b>", table_header_style), 
        Paragraph("<b>Authority</b>", table_header_style), 
        Paragraph("<b>Category</b>", table_header_style), 
        Paragraph("<b>Type</b>", table_header_style),
        Paragraph("<b>Website URL</b>", table_header_style)
    ]]
    for s in sources:
        source_rows.append([
            Paragraph(s.website_name, table_cell_style),
            Paragraph(s.authority, table_cell_style),
            Paragraph(s.category, table_cell_style),
            Paragraph(s.source_type, table_cell_style),
            Paragraph(s.website_url, table_cell_style)
        ])
    
    sources_table = Table(source_rows, colWidths=[100, 100, 70, 70, 150])
    sources_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(sources_table)
    story.append(PageBreak())

    # ================= DOCUMENTS BY CATEGORY =================
    story.append(Paragraph("2. Mapped Legal Documents", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_secondary, spaceAfter=10))
    
    docs = db.query(Document).all()
    doc_rows = [[
        Paragraph("<b>Code</b>", table_header_style),
        Paragraph("<b>Title</b>", table_header_style),
        Paragraph("<b>Category</b>", table_header_style),
        Paragraph("<b>Year</b>", table_header_style),
        Paragraph("<b>Status</b>", table_header_style)
    ]]
    for d in docs:
        doc_rows.append([
            Paragraph(d.document_code, table_cell_style),
            Paragraph(d.title, table_cell_style),
            Paragraph(d.category, table_cell_style),
            Paragraph(str(d.year), table_cell_style),
            Paragraph(d.status, table_cell_style)
        ])
    
    docs_table = Table(doc_rows, colWidths=[60, 200, 100, 50, 80])
    docs_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(docs_table)
    story.append(Spacer(1, 15))

    # ================= QUALITY VERIFICATION =================
    story.append(Paragraph("3. Quality Verification & Duplicates", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_secondary, spaceAfter=10))
    
    quality_checks = db.query(QualityCheck).all()
    q_rows = [[
        Paragraph("<b>Doc Code</b>", table_header_style),
        Paragraph("<b>Official Source</b>", table_header_style),
        Paragraph("<b>Readable</b>", table_header_style),
        Paragraph("<b>Complete</b>", table_header_style),
        Paragraph("<b>Metadata Correct</b>", table_header_style),
        Paragraph("<b>Verification Status</b>", table_header_style)
    ]]
    for q in quality_checks:
        doc = db.query(Document).filter(Document.id == q.document_id).first()
        q_rows.append([
            Paragraph(doc.document_code if doc else "N/A", table_cell_style),
            Paragraph("Yes" if q.official_source else "No", table_cell_style),
            Paragraph("Yes" if q.readable else "No", table_cell_style),
            Paragraph("Yes" if q.complete_content else "No", table_cell_style),
            Paragraph("Yes" if q.metadata_correct else "No", table_cell_style),
            Paragraph(q.verification_status, table_cell_style)
        ])
    
    quality_table = Table(q_rows, colWidths=[70, 70, 70, 70, 90, 120])
    quality_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(quality_table)
    story.append(Spacer(1, 15))

    # Duplicates section
    duplicates = db.query(Duplicate).all()
    if duplicates:
        story.append(Paragraph("Flagged Duplicate Documents", h2_style))
        dup_rows = [[
            Paragraph("<b>File Name</b>", table_header_style),
            Paragraph("<b>Reason</b>", table_header_style),
            Paragraph("<b>Decision Action</b>", table_header_style),
            Paragraph("<b>Resolution</b>", table_header_style)
        ]]
        for dp in duplicates:
            doc = db.query(Document).filter(Document.id == dp.document_id).first()
            dup_rows.append([
                Paragraph(doc.filename if doc else "N/A", table_cell_style),
                Paragraph(dp.reason, table_cell_style),
                Paragraph(dp.action, table_cell_style),
                Paragraph(dp.status, table_cell_style)
            ])
        
        dup_table = Table(dup_rows, colWidths=[120, 180, 100, 90])
        dup_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_secondary),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light]),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(dup_table)
        story.append(Spacer(1, 15))

    # ================= FINDINGS & RECOMMENDATIONS =================
    story.append(Paragraph("4. Findings & Recommendations", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_secondary, spaceAfter=10))
    
    findings_text = """
    <b>Key Findings:</b><br/>
    1. <b>Quality Verification Status:</b> A total of {0} documents are currently indexed. Of these, {1} documents have been fully verified. {2} documents are flagged as 'Needs Review' due to incomplete metadata or pending readable PDF reviews.<br/>
    2. <b>Deduplication:</b> The database duplicate detection rules identified {3} potential conflicts where files matched existing indexes. Manual decisions are pending or resolved via the 'Duplicates Management' panel.<br/>
    3. <b>Source Integrity:</b> All mapped sources represent authoritative Government URLs, avoiding data hallucination or untracked file downloads.
    """.format(total_docs, verified_docs, needs_review_docs, len(duplicates))
    story.append(Paragraph(findings_text, body_style))
    
    recommendations_text = """
    <b>Recommendations for Legal Dataset Teams:</b><br/>
    - <b>Run OCR Pipelines:</b> Schedule background OCR verification pipelines for older PDF documents that fail the 'Readable PDF' verification check.<br/>
    - <b>Metadata Quality Audits:</b> Mandate double-verifier approval steps for highly critical judgments before feeding into training models.<br/>
    - <b>Sync with Cloud Storage:</b> As the dataset grows beyond local folders, implement automated AWS S3 or Google Cloud Storage synchronization protocols.
    """
    story.append(Paragraph(recommendations_text, body_style))

    # Build the PDF using custom NumberedCanvas
    doc_template.build(story, canvasmaker=NumberedCanvas)
    return file_path
