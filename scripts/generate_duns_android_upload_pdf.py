from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem, Table, TableStyle
from datetime import datetime
import os

out_dir = r"D:\work\wanzami\docs"
os.makedirs(out_dir, exist_ok=True)
out_file = os.path.join(out_dir, "Wanzami_DUNS_Android_Upload_Company_Guide.pdf")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="Body", parent=styles["Normal"], fontSize=10.5, leading=15))
styles.add(ParagraphStyle(name="SectionTitle", parent=styles["Heading2"], spaceBefore=10, spaceAfter=6))
styles.add(ParagraphStyle(name="Small", parent=styles["Normal"], fontSize=9, leading=12, textColor=colors.grey))

story = []
story.append(Paragraph("Wanzami Android Upload Guide: D-U-N-S Requirement", styles["Title"]))
story.append(Paragraph("Why Wanzami needs a D-U-N-S number for Google Play organization upload", styles["Heading3"]))
story.append(Spacer(1, 0.35 * cm))

meta = Table([
    ["Prepared by", "Olukayode Soliu"],
    ["Date", datetime.now().strftime("%d %B %Y")],
    ["Project", "Wanzami Android App Upload"],
], colWidths=[4.2 * cm, 11.3 * cm])
meta.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F3F4F6")),
    ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#D1D5DB")),
    ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E5E7EB")),
    ("FONTSIZE", (0, 0), (-1, -1), 10),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story.append(meta)
story.append(Spacer(1, 0.45 * cm))

story.append(Paragraph("1) What is a D-U-N-S number?", styles["SectionTitle"]))
story.append(Paragraph(
    "A D-U-N-S number is a unique 9-digit business identifier issued by Dun & Bradstreet (D&B). "
    "It is used globally to identify and verify legal business entities. For Google Play organization accounts, "
    "it helps prove that the publisher is a real company, not just an individual profile.",
    styles["Body"]
))

story.append(Paragraph("2) Why Wanzami needs D-U-N-S for Android/Play Store upload", styles["SectionTitle"]))
why_items = [
    "Google Play organization verification requires stronger company identity checks.",
    "D-U-N-S is used by Google to verify Wanzami's legal business identity for an organization account.",
    "It helps align organization details across Google Play Console and Google Payments profile.",
    "It improves transparency and trust for users seeing the publisher information on Play Store.",
]
story.append(ListFlowable([ListItem(Paragraph(x, styles["Body"])) for x in why_items], bulletType="bullet", leftIndent=18))

story.append(Paragraph("3) Why you cannot rely only on a personal developer account", styles["SectionTitle"]))
story.append(Paragraph(
    "A personal developer account is tied to an individual identity. For Wanzami as a company, this creates legal, "
    "ownership, and continuity risks. If the business intends to publish under company identity and scale operations, "
    "Google's organization onboarding path expects organization verification signals such as D-U-N-S.",
    styles["Body"]
))
limitations = [
    "Publisher ownership stays with one person, not the company legal entity.",
    "Harder governance for teams, auditors, investors, and long-term business continuity.",
    "Higher mismatch risk between legal business records, billing records, and store identity.",
    "Potential account compliance friction if organization evidence is requested later.",
]
story.append(ListFlowable([ListItem(Paragraph(x, styles["Body"])) for x in limitations], bulletType="bullet", leftIndent=18))

story.append(Paragraph("4) D-U-N-S requirements for a company like Wanzami", styles["SectionTitle"]))
req_items = [
    "Exact legal company name (must match registration records)",
    "Official registered business address",
    "Official business phone number and email",
    "Business registration/incorporation details",
    "Organization website/domain",
    "Authorized company representative details",
]
story.append(ListFlowable([ListItem(Paragraph(x, styles["Body"])) for x in req_items], bulletType="bullet", leftIndent=18))

story.append(Paragraph("Typical supporting documents", styles["Body"]))
docs = [
    "Certificate of Incorporation (or local equivalent)",
    "Tax registration document (if applicable)",
    "Address evidence (utility/bank/official statement, if requested)",
    "Authorization letter (if application is submitted by an agent)",
]
story.append(ListFlowable([ListItem(Paragraph(x, styles["Body"])) for x in docs], bulletType="bullet", leftIndent=18))

story.append(Paragraph("5) Recommended process for Wanzami", styles["SectionTitle"]))
steps = [
    "Check if Wanzami already has an existing D-U-N-S record.",
    "If not available, apply via Dun & Bradstreet.",
    "Ensure legal name/address in D&B exactly match Google Payments profile.",
    "Complete Google Play organization verification using matching company data.",
    "Validate public developer profile details before app release.",
]
story.append(ListFlowable([ListItem(Paragraph(x, styles["Body"])) for x in steps], bulletType="1", leftIndent=18))

story.append(Paragraph("6) Timeline and planning", styles["SectionTitle"]))
story.append(Paragraph(
    "D-U-N-S processing may take days to weeks depending on country and validation completeness. "
    "To avoid launch delays, Wanzami should complete D-U-N-S and verification prep before final Android submission window.",
    styles["Body"]
))

story.append(Spacer(1, 0.3 * cm))
story.append(Paragraph(
    "Reference basis: Google Play Console organization account requirements and developer verification guidance; "
    "Dun & Bradstreet D-U-N-S enrollment guidance.",
    styles["Small"]
))

doc = SimpleDocTemplate(out_file, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=1.8*cm, bottomMargin=1.8*cm)
doc.build(story)
print(out_file)
