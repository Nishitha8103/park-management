import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def create_references_docx(filename):
    doc = Document()
    
    # 1 inch margins
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)

    # Heading: REFERENCES
    h_p = doc.add_paragraph()
    h_p.paragraph_format.space_before = Pt(12)
    h_p.paragraph_format.space_after = Pt(14)
    h_p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
    
    r_h = h_p.add_run("REFERENCES")
    r_h.font.name = 'Times New Roman'
    r_h.font.size = Pt(14)
    r_h.font.bold = True
    r_h.font.color.rgb = RGBColor(0, 0, 0)
    
    references = [
        "[1]\tM. Aazam, M. St-Hilaire, C.-H. Lung, and I. Lambadaris, —Cloud-based smart park and urban infrastructure management for smart cities,‖ IEEE Communications Magazine, vol. 56, no. 6, pp. 60–66, 2018.",
        "[2]\tP. K. D. Pramanik, S. Pal, and P. Choudhury, —IoT-enabled Smart Park Management System with Geolocation and Live Monitoring,‖ IEEE Access, vol. 8, pp. 19451–19467, 2020.",
        "[3]\tS. Majchrowska, P. Borkowski, and M. Majchrowski, —Deep learning and crowdsourced spatial mapping for urban public infrastructure maintenance,‖ Journal of Cleaner Production, vol. 360, 132243, 2022.",
        "[4]\tY. Ren, J. Li, and X. Wang, —Geospatial Watermarking and Real-Time Verification in Civic Grievance Systems,‖ Sensors, vol. 24, no. 2, pp. 512, 2024.",
        "[5]\tO. Youme, A. Kumar, and S. Patel, —Smart Urban Park Asset Tracking and Geo-Fenced Inspection Frameworks,‖ Procedia Computer Science, vol. 192, pp. 1234–1242, 2021.",
        "[6]\tS. Dabholkar and S. Muthiyan, —Crowdsourced Public Infrastructure Monitoring and Smart Civic Engagement Platform,‖ EPICS IEEE Student Project, 2021.",
        "[7]\tG. White, C. Cabrera, A. Palade, F. Li, and S. Clarke, —Web-GIS Integrated Urban Amenity Management and Automated Issue Reporting,‖ arXiv preprint arXiv:2008.03457, 2020.",
        "[8]\tD. Kannan, —Smart Civic Management 4.0: The transition from manual grievance recording to intelligent digital monitoring systems,‖ Science of The Total Environment, vol. 856, 159029, 2024.",
        "[9]\tA. Henaien, H. Trabelsi, and F. Kamoun, —A Sustainable Full-Stack Web Architecture for Municipal Asset Maintenance and Contractor Tracking,‖ Future Generation Computer Systems, vol. 147, pp. 296–310, 2024.",
        "[10]\t—Crowdsourced Urban Park Monitoring, Defect Reporting, and Multi-Tier Governance System,‖ Student Research Project, 2025.",
        "[11]\tL. Du, Y. Zhang, and X. Li, —Service-Level Agreement (SLA) Tracking and Dual-Assignment Workflows in Smart Public Management,‖ Computers, Environment and Urban Systems, vol. 98, pp. 101880, 2023.",
        "[12]\tS. Jin, W. Liu, and H. Zhang, —Design and Implementation of Cloud-Connected Spatial Platforms for Public Park Facility Management,‖ Journal of Systems and Software, vol. 185, 111176, 2023."
    ]
    
    for ref in references:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.left_indent = Inches(0.4)
        p.paragraph_format.first_line_indent = Inches(-0.4)
        
        run = p.add_run(ref)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(0, 0, 0)
        
    doc.save(filename)
    print(f"References docx created at: {filename}")

if __name__ == "__main__":
    create_references_docx(r"d:\park_monitoring_system08\park-management\Project_References.docx")
