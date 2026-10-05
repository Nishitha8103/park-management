import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

OUTPUT_DIR = r"d:\park_monitoring_system08\park-management\exact_pdf_docx_chapters"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def create_base_doc():
    doc = docx.Document()
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1.25)
        section.right_margin = Inches(1)
        
        # Header - matching PDF exactly
        header = section.header
        hp = header.paragraphs[0]
        hp.text = " Park Monitoring System"
        hp.alignment = WD_ALIGN_PARAGRAPH.LEFT
        hp.style.font.name = 'Times New Roman'
        hp.style.font.size = Pt(11)
        hp.style.font.bold = True
        pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="double" w:sz="12" w:space="4" w:color="000000"/></w:pBdr>')
        hp._element.get_or_add_pPr().append(pBdr)
        
        # Footer - matching PDF exactly
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.text = "Department of MCA\t\tPIM, Udupi"
        fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
        fp.style.font.name = 'Times New Roman'
        fp.style.font.size = Pt(11)
        fp.style.font.bold = True
        pBdrF = parse_xml(f'<w:pBdr {nsdecls("w")}><w:top w:val="double" w:sz="12" w:space="4" w:color="000000"/></w:pBdr>')
        fp._element.get_or_add_pPr().append(pBdrF)

    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(12)
    normal_style.font.color.rgb = RGBColor(0, 0, 0)
    normal_style.paragraph_format.line_spacing = 1.5
    normal_style.paragraph_format.space_after = Pt(6)
    return doc

def add_h1(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(12)
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(15)
    run.font.bold = True
    return p

def add_h2(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(13)
    run.font.bold = True
    return p

def add_h3(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    run.font.bold = True
    return p

def add_p(doc, text, bold_prefix=None):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(6)
    if bold_prefix:
        rb = p.add_run(bold_prefix)
        rb.font.bold = True
        rb.font.name = 'Times New Roman'
        rb.font.size = Pt(12)
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    return p

def add_bullet_text(doc, text, bold_title=None):
    p = doc.add_paragraph(style='List Bullet')
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(4)
    if bold_title:
        rb = p.add_run(bold_title + "\n" if not bold_title.endswith(":") else bold_title + " ")
        rb.font.bold = True
        rb.font.name = 'Times New Roman'
        rb.font.size = Pt(12)
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    return p

# ==============================================================================
# 00. PRELIMINARY PAGES (Pages 1 to 11 of PDF)
# ==============================================================================
def generate_preliminary():
    doc = create_base_doc()
    
    # Page 1: Title Page
    add_h1(doc, "MANGALORE UNIVERSITY")
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Project Report on\n“PARK MONITORING SYSTEM”\n\nCarried out and submitted by\n")
    r.font.bold = True
    r.font.size = Pt(14)
    r2 = p.add_run("NISHITHA\nReg. No.: P05PP23S126010\nIV Semester MCA Student\nPoornaprajna Institute of Management, Udupi\n\n")
    r2.font.bold = True
    r2.font.size = Pt(13)
    r3 = p.add_run("Under the guidance of\nProf. Venugopala Rao A. S.\nHOD\nDept.of MCA, PIM, Udupi.\n\nIn the partial fulfilment of the requirement for the award of degree in Master of Computer Applications during the academic year 2024-25\n\nPoornaprajna Institute of Management,\nUdupi\n2024-2025\n")
    r3.font.size = Pt(12)

    # Page 2: Certificate
    doc.add_page_break()
    add_h1(doc, "CERTIFICATE")
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_inst = p_inst.add_run("MANGALORE UNIVERSITY\nPoornaprajna Institute of Management, Udupi\nDepartment of MCA\n")
    r_inst.font.bold = True
    r_inst.font.size = Pt(13)
    
    add_p(doc, "This is to certify that the project entitled “Park Monitoring System” has been carried out by Nishitha (Reg.No.: P05PP23S126010), student of fourth semester MCA (Masters of Computer Applications) under the supervision of Prof. Venugopala Rao A.S., MCA Department, Poornaprajna Institute of Management, Udupi. The project is submitted in partial fulfilment of the requirement for the award of Master of Computer Applications by Mangalore University during the Academic year 2024-2025.\n\n\n")
    p_sig = doc.add_paragraph()
    p_sig.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_sig.add_run("Internal Guide\t\t\t\t\tHead of the Department\n\n\n\nInternal Examiner\t\t\t\t\tExternal Examiner\n\nSubmitted for the viva-voice examination held on: ..................")

    # Page 4: Declaration
    doc.add_page_break()
    add_h1(doc, "DECLARATION")
    add_p(doc, "This project work entitled “PARK MONITORING SYSTEM” has been successfully carried out by me under the supervision and guidance of Prof. Venugopala Rao A.S., Head of the MCA Department, Poornaprajna Institute of Management, Udupi. This project is submitted in partial fulfilment for the award of Masters of Computer Application degree by Mangalore University during the academic year 2024–25.\n\nThis work or any part of this work has not been submitted to any other university or Institute/School for the award of any other Degree or Diploma.\n\n\nDate:\t\t\t\t\t\tName: NISHITHA\nPlace: Udupi\t\t\t\t\tReg. No.: P05PP23S126010")

    # Page 5: Acknowledgement
    doc.add_page_break()
    add_h1(doc, "ACKNOWLEDGEMENT")
    add_p(doc, "I take this opportunity to express my sincere thanks to my guide Prof. Venugopala Rao A. S, Head of the MCA Department, Poornaprajna Institute of Management, for him all-round guidance, timely help at every stage of this project and for the valuable suggestions and unlimited support.")
    add_p(doc, "I would like to express my gratitude to Dr. P. S. Aithal, Director, Poornaprajna Institute of Management, for granting the necessary permissions and providing all kinds of infrastructure facilities in the department to carry out this project successfully.")
    add_p(doc, "All faculty members and non-teaching staffs of the MCA department.")
    add_p(doc, "I would like to express my heartfelt gratitude to my parents, friends and well-wishers who have always inspired and blessed me, including those whom I may have inadvertently failed to mention. Above all, with all my heart, I thank you God for empowering me with the dedication, focus and patience to carry out this project successfully.\n\n\nNISHITHA\nP05PP23S126010")

    # Page 7: Abstract (Exactly 4 paragraphs matching Page 7 of PDF)
    doc.add_page_break()
    add_h1(doc, "ABSTRACT")
    add_p(doc, "Urban green space and public park management is one of the critical challenges faced by rapidly growing cities like Bangalore. The increasing wear and tear of park amenities, damaged play equipment, broken benches, lighting failures, and neglected green zones have become a major concern for the Bruhat Bengaluru Mahanagara Palike (BBMP). These neglected park issues not only affect the city’s cleanliness and natural beauty but also pose safety risks to visiting citizens and children. To address these issues, there is a pressing need for a digital platform that enables timely reporting, monitoring, and resolution of such problems through citizen participation and administrative coordination. This project presents the development of a Progressive Web Application (PWA) aimed at supporting BBMP’s park monitoring and maintenance initiative. The system provides a real-time, transparent, and user-friendly platform for reporting, tracking, and resolving park maintenance complaints across Bengaluru. It bridges the communication gap between Citizens, Field Officials, Maintenance Contractors, and Administrators by ensuring smooth information flow and coordinated action.")
    add_p(doc, "The system comprises four major modules: Citizens, Admin, Government Officials, and Maintenance Contractors. The Citizens module enables citizens to register, log in, update profiles, view park directories, book stall slots with payments, register for events, and raise complaints by capturing live photos through their camera, location details, and descriptions of damaged park facilities. Citizens can also check the live status of their complaints. Additionally, the system sends email notifications to citizens upon successful complaint submission, status updates, and resolution, ensuring transparency and keeping citizens informed throughout the process.")
    add_p(doc, "The Admin module acts as the central control panel, managing all activities such as complaint assignments, user and official management, contractor monitoring, park asset records, stall bookings, and report generation. It includes sub modules for managing users, officials, contractors, districts, corporations, zones, and wards, allowing the administrator to maintain proper geographic and operational control. When a complaint is assigned or resolved, automated email alerts are triggered to both the assigned field staff and the concerned citizen, improving communication efficiency.")
    add_p(doc, "The Field Officials and Contractors module empowers on-ground staff to log in, view assigned complaints, verify reported defects, log daily work progress, upload proof of resolution, request materials, and maintain their work history for performance tracking. By integrating these modules with real-time email notification support, the application ensures seamless communication, efficient complaint resolution, and improved park management workflows.")
    add_p(doc, "Keywords: Park Monitoring, PWA, Proactive, Transparency, Complaints", "")

    # Table of Contents, Figures, Tables (Matching Pages 8 to 11 of PDF)
    doc.add_page_break()
    add_h1(doc, "Table of Contents")
    toc_table = doc.add_table(rows=1, cols=3)
    toc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    toc_table.rows[0].cells[0].text = "Chapter No."
    toc_table.rows[0].cells[1].text = "Chapter Name"
    toc_table.rows[0].cells[2].text = "Page No."
    for c in toc_table.rows[0].cells:
        c.paragraphs[0].runs[0].font.bold = True
        set_cell_background(c, "E2E8F0")

    toc_data = [
        ("1.", "Introduction\n1.1 Introduction\n1.2 Overview of the project\n1.3 Problem Statement\n1.4 Motivation\n1.5 Significance of the Study\n1.6 Objectives\n1.7 Scope of the Project\n1.8 Features", "1-11"),
        ("2.", "Literature Review\n2.1 Introduction\n2.2 Result analysis\n2.3 Identified gaps in the Literature\n2.4 Existing System\n2.5 Proposed System", "12-16"),
        ("3.", "System Analysis\n3.1 Introduction\n3.2 Overall Descriptions\n3.3 Specific Requirements\n3.4 Functional Requirements\n3.5 Performance Requirements\n3.6 Design Constraints\n3.7 Other Requirements\n3.8 Safety Requirements\n3.9 Security Requirements", "17-23"),
        ("4.", "Design And Methodology\n4.1 System Design\n4.2 Detailed Design\n4.3 Database Design", "24-36"),
        ("5.", "Implementation Details\n5.1 Introduction\n5.2 Hardware And Software tools used\n5.3 Source Code", "37-46"),
        ("6.", "Result and Evaluation\n6.1 Introduction\n6.2 Test Scenario\n6.3 Test Cases", "47-51"),
        ("7.", "Conclusion and Future Work\n7.1 Conclusion\n7.2 Future Work", "52-53"),
        ("", "Appendices", "54-64"),
        ("", "References", "65")
    ]
    for row in toc_data:
        r = toc_table.add_row().cells
        r[0].text = row[0]
        r[1].text = row[1]
        r[2].text = row[2]

    # List of Figures (Matching Page 10 of PDF)
    doc.add_page_break()
    add_h1(doc, "List of Figures")
    fig_table = doc.add_table(rows=1, cols=3)
    fig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    fig_table.rows[0].cells[0].text = "Figure No."
    fig_table.rows[0].cells[1].text = "Figure Name"
    fig_table.rows[0].cells[2].text = "Figure Page No."
    for c in fig_table.rows[0].cells:
        c.paragraphs[0].runs[0].font.bold = True
        set_cell_background(c, "E2E8F0")

    fig_data = [
        ("4.1.2.1.1", "Use Case Diagram for Citizens", "26"),
        ("4.1.2.1.2", "Use Case Diagram for Admin", "26"),
        ("4.1.2.1.3", "Use Case Diagram for Field Officials", "27"),
        ("4.1.2.2", "Context Flow Diagram", "27"),
        ("4.2.1.1", "Data Flow Diagram for Citizens", "29"),
        ("4.2.1.2", "Structure Chart for Admin", "31"),
        ("4.2.1.3", "UML Diagram for Field Officials", "33"),
        ("Fig.1 to Fig.30", "Fig:1 Index Page, Fig:2 Register\nFig:3 Login, Fig:4 Forgot Password\nFig:5 OTP Page, Fig:6 Reset ,Fig:7 Citizen Dashboard,Fig:8 Profile, Fig:9 Edit Profile,Fig:10 Add Complaints,\nFig:11 Check Status,Fig:12 Complaint List, Fig:13 Closed Complaint List,\nFig:14 Admin Login,Fig:15 Admin Dashboard,Fig:16Report,Fig:17Compalint\nFig:18 Add Zone, Fig:19 Division,Fig:20 Wards,Fig:21 Add Official,Fig:22 Official Dashboard, Fig:23 Assign Compalints,Fig:24 History, Fig:25 Update\nFig:26 Complaint Model,Fig:27 Officials Model,Fig:28 Ward Table,Fig: 29 Division Table,Fig: 30 Complaint assignment.", "54-64")
    ]
    for row in fig_data:
        r = fig_table.add_row().cells
        r[0].text = row[0]
        r[1].text = row[1]
        r[2].text = row[2]

    # List of Tables (Matching Page 11 of PDF)
    doc.add_page_break()
    add_h1(doc, "List of Tables")
    tbl_table = doc.add_table(rows=1, cols=3)
    tbl_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_table.rows[0].cells[0].text = "Table No."
    tbl_table.rows[0].cells[1].text = "Table Name"
    tbl_table.rows[0].cells[2].text = "Page No."
    for c in tbl_table.rows[0].cells:
        c.paragraphs[0].runs[0].font.bold = True
        set_cell_background(c, "E2E8F0")

    tbl_data = [
        ("4.3.1.1", "Users", "34"),
        ("4.3.1.2", "Admin", "34"),
        ("4.3.1.3", "Complaints", "35"),
        ("4.3.1.4", "Complaint_Officials", "35"),
        ("4.3.1.5", "Zones", "35"),
        ("4.3.1.6", "Divisions", "36"),
        ("4.3.1.7", "Wards", "36"),
        ("4.3.1.8", "Officials", "36"),
        ("6.3.1", "Registration Form", "48"),
        ("6.3.2", "Login", "49"),
        ("6.3.3", "Forgot Password", "49"),
        ("6.3.4", "Raise Complaints", "49"),
        ("6.3.5", "Check status", "49"),
        ("6.3.6", "Report", "50"),
        ("6.3.7", "Add zones", "50"),
        ("6.3.8", "Add Divisions", "50"),
        ("6.3.9", "Add wards", "51"),
        ("6.3.10", "Add Officials", "51")
    ]
    for row in tbl_data:
        r = tbl_table.add_row().cells
        r[0].text = row[0]
        r[1].text = row[1]
        r[2].text = row[2]

    doc.save(os.path.join(OUTPUT_DIR, "00_Preliminary_Pages.docx"))
    print("Generated: 00_Preliminary_Pages.docx")

# ==============================================================================
# 01. CHAPTER 1: INTRODUCTION (Exact paragraphs & points matching Pages 12-22)
# ==============================================================================
def generate_chapter_1():
    doc = create_base_doc()
    add_h1(doc, "1. INTRODUCTION")
    
    # 1.1 Introduction (Exactly 4 paragraphs matching Page 12 of PDF)
    add_h2(doc, "1.1 Introduction")
    add_p(doc, "Urbanization has brought about significant development and modernization across cities, but it has also introduced complex challenges in maintaining a clean, sustainable, and livable environment. Among these challenges, urban public park and green space management has emerged as one of the most critical issues faced by metropolitan areas such as Bengaluru, a city that continues to expand rapidly in population and infrastructure. The intensive daily utilization of parks, combined with weather wear and delayed maintenance practices, has led to the rise of numerous damaged amenities, broken play equipment, non-functional lighting, and neglected garden areas, commonly referred to as park defects. These neglected park spots are not only an eyesore that diminishes the aesthetic appeal of the city but also serve as potential hazards for injuries, foul odor, and environmental deterioration, posing serious health and ecological risks to urban communities.")
    add_p(doc, "The Bruhat Bengaluru Mahanagara Palike (BBMP), responsible for the city’s civic and infrastructural management, has made several efforts to control and prevent park infrastructure deterioration. However, the traditional methods of monitoring and managing park facilities are often inefficient due to delays in complaint handling, lack of real-time coordination, and insufficient citizen engagement. Many citizens find it difficult to report park defects or track the progress of their complaints, leading to reduced accountability and transparency. These limitations highlight the urgent need for a technological solution that bridges the gap between citizens, field officials, and administrators, ensuring timely communication and effective park asset management.")
    add_p(doc, "In this context, the proposed project, “Park Monitoring System,” introduces a Progressive Web Application (PWA) designed to transform the way park-related complaints and recreational facilities are reported, managed, and resolved within the BBMP framework. The system leverages the power of digital connectivity, live camera verification, geolocation tracking, and automated communication to create a real-time, interactive, and transparent platform for citizens and authorities alike. The main objective of the system is to empower citizens to actively participate in maintaining urban greenery by easily reporting park defects through live photos, location details, and descriptions, while enabling administrators, field officials, and contractors to handle these complaints efficiently through an integrated backend system.")
    add_p(doc, "The application is built with four major modules Citizens, Admin, Government Officials, and Maintenance Contractors, each serving a distinct purpose to ensure smooth workflow and accountability.")

    # 1.2 Overview of the project (Exactly matching Pages 13-14 of PDF)
    add_h2(doc, "1.2 Overview of the project")
    add_p(doc, "Maintaining urban cleanliness and green park infrastructure is a vital aspect of sustainable city development. With the rapid expansion of Bengaluru, efficient park management has become a major priority for the Bruhat Bengaluru Mahanagara Palike (BBMP). However, the emergence of damaged park equipment and neglected areas continues to disrupt the city’s cleanliness and environmental balance. To overcome these issues, modern technology can play a transformative role by enabling digital participation, quick response, and transparent monitoring.")
    add_p(doc, "This project introduces a Progressive Web Application (PWA) for Park Monitoring System, designed to support BBMP’s vision of a clean, green, and smart Bengaluru. The platform provides a single digital interface that connects citizens, field officials, contractors, and administrators, ensuring smooth communication and efficient resolution of complaints. It allows users to report park defects instantly by uploading live images, providing geolocation details, and adding brief descriptions. Each complaint is recorded in real time and tracked throughout its lifecycle, promoting transparency and accountability.")
    add_p(doc, "The proposed system is structured into four core modules: Citizens, Admin, Government Officials, and Maintenance Contractors. The Citizens module enables citizens to register, log in, and raise complaints by uploading live photos of damaged park equipment along with location coordinates. Citizens can also monitor the live status of their complaints, receive email notifications for updates, and view the final resolution proof once the issue is addressed.")
    add_p(doc, "The Admin module acts as the control center, managing user data, official assignments, contractor tasks, stall bookings, and complaint tracking. It provides advanced functionalities like zones, divisions and wards management, complaint allocation, and performance monitoring of field officials and contractors. The admin also receives instant updates and can generate analytical reports to evaluate the overall progress and efficiency of the park management process.")
    add_p(doc, "The Field Officials module allows authorized staff to log in, access assigned complaints, verify reported issues on-site, upload resolution photos, and update complaint statuses directly from the field. This not only enhances operational efficiency but also helps maintain accountability among on-ground workers.")
    add_p(doc, "A key feature of the system is its real-time email notification mechanism, which automatically sends alerts to users and officials upon complaint submission, assignment, and resolution. This ensures transparency and builds trust between citizens and authorities. The inclusion of live camera capture and geolocation-based tracking further enhances the accuracy and reliability of the system by helping officials locate and verify the exact defect location, minimizing delays in response time.")
    add_p(doc, "The proposed solution aligns with the broader vision of Smart City and E-Governance initiatives undertaken by the Government of India. By integrating technology into municipal park management, the system promotes citizen engagement, data-driven decision-making, and efficient resource utilization. It empowers citizens to become active stakeholders in maintaining city greenery while supporting BBMP’s mission to create a cleaner and greener Bengaluru.")
    add_p(doc, "Moreover, this system addresses several challenges inherent in traditional park management approaches, such as manual record-keeping, miscommunication between departments, and lack of accountability. Through digital automation, it provides a scalable, secure, and easily accessible platform that can be expanded to other cities facing similar challenges. The PWA nature of the application ensures cross-device compatibility, allowing users to access the platform seamlessly from both mobile devices and desktops without the need for installation.")
    add_p(doc, "The Park Monitoring System represents a practical and innovative step towards sustainable urban governance. It not only simplifies the process of complaint reporting and monitoring but also fosters collaboration between citizens and civic bodies. By leveraging digital technologies such as real-time notifications, geolocation tracking, and user-friendly interfaces, the system aims to reduce response time, increase accountability, and improves the overall cleanliness and maintenance of the city. Ultimately, the project envisions a smart, healthy, and environmentally responsible Bengaluru, where technology and public participation work hand in hand to build a more sustainable urban future.")

    # 1.3 Problem Statement (Matching Pages 14-15 of PDF)
    add_h2(doc, "1.3 Problem Statement")
    add_p(doc, "The growing population and rapid urbanization of Bengaluru have led to significant challenges in maintaining cleanliness and effective public park management. Among these challenges, the rise of unattended park defects—such as broken play equipment, damaged benches, non-functional lighting, overflowing waste bins, and neglected green zones—has become a serious concern for both the citizens and the Bruhat Bengaluru Mahanagara Palike (BBMP). These park defects not only damage the city’s image and aesthetics but also create unhygienic and unsafe conditions, leading to health hazards, safety risks for children, and environmental pollution. Despite ongoing manual efforts by civic authorities, the lack of a proper monitoring and reporting system often results in delayed responses, inefficient coordination, and poor accountability.")
    add_p(doc, "Currently, citizens have limited means to report such park defects or track the progress of their complaints. Many reports go unnoticed due to the absence of a unified digital platform that connects citizens directly with municipal authorities. Moreover, communication gaps between citizens, administrators, and field officials often cause duplication of efforts or unresolved issues. Traditional methods of complaint handling, which rely on manual paperwork and physical inspections, are time-consuming, prone to human error, and fail to ensure real-time updates.")
    add_p(doc, "There is a clear need for an integrated digital solution that enables timely reporting, transparent tracking, and efficient resolution of park-related complaints. A system that allows citizens to easily capture and submit evidence of park defects through live camera capture, while empowering BBMP officials and contractors to manage, assign, and verify complaints in real time, can significantly improve the city’s park maintenance and operational efficiency.")
    add_p(doc, "To address these gaps, the proposed Application for Park Monitoring system aims to create a centralized, interactive, and technology-driven platform. It will facilitate seamless communication among citizens, field officials, contractors, and administrators by providing features such as online complaint registration, live photos and location capture, email notifications, stall slot bookings, event management, and status tracking. By automating the complaint management process and enhancing public participation, this project intends to promote accountability, reduce response times, and support BBMP’s mission toward a cleaner, smarter, and greener Bengaluru.")

    # 1.4 Motivation (Matching Pages 15-16 of PDF - exactly 4 bullet points)
    add_h2(doc, "1.4 Motivation:")
    add_p(doc, "The rapid urbanization and population growth in Bangalore have led to a significant increase in the utilization of public parks. Unfortunately, this has resulted in the emergence of numerous damaged amenities, broken facilities, and unaddressed maintenance issues across city parks. These park defects not only cause safety concerns and inconvenience, but also affect the aesthetic appeal of neighborhoods and lower the overall quality of urban life. Despite various initiatives by local municipal bodies, the timely identification and resolution of park defects remain a major challenge due to the following reasons:")
    add_bullet_text(doc, "Lack of Real-time Reporting Mechanisms")
    add_bullet_text(doc, "Limited Transparency and Tracking")
    add_bullet_text(doc, "Inefficient Communication between Stakeholders")
    add_bullet_text(doc, "Lack of Public Engagement")
    add_p(doc, "These challenges motivated the development of a technology-driven solution that not only bridges the communication gap but also empowers citizens, streamlines field operations, and supports administrators with real-time data and actionable insights.")

    # 1.5 Significance of the Study (Matching Pages 16-17 of PDF)
    add_h2(doc, "1.5 Significance of the Study")
    add_p(doc, "The proposed Park Monitoring System plays a crucial role in addressing one of the most pressing urban challenges faced by metropolitan cities like Bengaluru: the upkeep and maintenance of public parks and recreational green spaces. With the rapid pace of urbanization, increasing population density, and expanding infrastructure, park asset management has become a major concern for the Bruhat Bengaluru Mahanagara Palike (BBMP). This study highlights the significance of leveraging modern digital technologies to enhance the efficiency, transparency, and accountability of urban park management systems while empowering citizens to participate actively in maintaining a cleaner city environment.")
    add_p(doc, "The study holds great societal significance as it fosters active citizen engagement in civic problem-solving. Traditionally, park maintenance in large cities has been viewed solely as a governmental responsibility, leading to communication gaps between citizens and municipal authorities. The introduction of this system transforms this dynamic by enabling citizens to take direct responsibility for their surroundings. Through an intuitive PWA, citizens can easily capture live photos of park defects, upload them with precise geolocation data, and submit detailed descriptions. This participatory model promotes civic awareness and a sense of ownership among residents, ensuring that local park issues are promptly reported and resolved. By bridging the gap between citizens and local authorities, the system builds trust and encourages collective responsibility towards environmental cleanliness.")
    add_p(doc, "From an administrative standpoint, this study provides an innovative solution for optimizing BBMP’s operational workflow. The system replaces traditional manual reporting and record-keeping processes with a fully automated digital platform. Administrators can now efficiently manage user data, track complaints in real time, and assign tasks to contractors and field officials based on location and workload. The inclusion of automated notifications through email ensures continuous communication between citizens, field officers, and administrators, thereby minimizing delays and improving response times. The structured data collected from various complaints also supports data-driven decision-making, allowing BBMP to analyze trends, identify recurring problem areas, and develop long-term strategic park management policies. Additionally, the system enables performance monitoring of field officials and contractors, ensuring accountability and improving overall service quality.")
    add_p(doc, "Technologically, this study demonstrates the potential of web-based applications in enhancing smart governance and urban sustainability. The Park Monitoring System integrates multiple modern technologies including geolocation services, cloud-based databases, and real-time synchronization to create a responsive and scalable digital infrastructure. The use of Progressive Web App (PWA) technology ensures that the platform is accessible across all devices, even in areas with limited network connectivity, making it inclusive and reliable. The adoption of automated email alerts, live photo uploads, and real-time status tracking reflects the adaptability of emerging technologies to real-world civic problems. This project, therefore, stands as a model example of how digital transformation can redefine public service delivery and foster greater transparency in municipal operations.")
    add_p(doc, "Environmentally, the system contributes significantly to promoting sustainability and public health. Unattended park degradation not only diminishes the city’s aesthetic appeal but also poses safety hazards, loss of greenery, and reduced urban livability. By ensuring quick identification and resolution of such issues, the system supports the city’s broader environmental goals of preserving green cover and improving overall urban health.")
    add_p(doc, "Overall, the significance of this study lies in its ability to combine technology, governance, and citizen participation to achieve sustainable urban development. The Park Monitoring System not only contributes to improving park management efficiency but also aligns with the broader vision of Smart Bengaluru, promoting cleaner surroundings, public awareness, and a culture of shared responsibility in city maintenance.")

    # 1.6 Objectives (Matching Page 18 of PDF)
    add_h2(doc, "1.6 Objectives")
    add_p(doc, "The primary objective of the Park Monitoring System is to design and develop a Progressive Web Application (PWA) that provides an effective digital platform for reporting, monitoring, and resolving park maintenance issues and amenity defects within Bengaluru city. This project aims to assist the Bruhat Bengaluru Mahanagara Palike (BBMP) in achieving a cleaner and healthier environment by integrating technology with citizen participation and administrative efficiency. The system seeks to empower citizens by offering a simple and user-friendly interface through which they can register, log in, explore park amenities, book stall slots, register for events, and report park defects by capturing live photos, location details, and brief descriptions. It also enables real-time tracking of complaints so that users can monitor the progress and resolution status of their submissions, ensuring transparency and accountability. The inclusion of automated email notifications keeps citizens, field officials, contractors, and administrators informed about every stage of complaint handling, from registration to resolution.")
    add_p(doc, "For administrators, the project provides a centralized control panel to manage citizen’s accounts, officials, contractors, zones, divisions, and wards. It allows them to assign complaints efficiently. The field officials and contractors, on the other hand, can use their dedicated modules to access assigned complaints, verify reported park defects, log daily progress, update status, upload proof of resolution, and maintain a digital record of their work.")
    add_p(doc, "Furthermore, the system aims to improve communication and coordination between all stakeholders—citizens, administrators, contractors, and field officials—by providing a unified digital platform. It supports data-driven decision-making through the storage of complaint histories and performance reports, which can be used for policy formulation and future planning. Overall, this project contributes to BBMP’s vision of smart Bengaluru by leveraging modern web technologies to promote transparency, public involvement, and sustainable park management practices, ultimately working towards cleaner, safer, and more organized public parks.")

    # 1.7 Scope of the Project (Matching Pages 18-21 of PDF)
    add_h2(doc, "1.7 Scope of the Project")
    add_p(doc, "The Park Monitoring System is designed to provide a comprehensive and technology-driven solution for addressing one of Bengaluru’s most persistent urban challenges: the maintenance and upkeep of public parks and green spaces. With the rapid growth of the city’s population and urban expansion, maintaining cleanliness and ensuring proper park asset maintenance have become major concerns for both citizens and civic authorities. The project aims to bridge the gap between the BBMP and the citizens by introducing a digital platform that promotes transparency, accountability, and timely resolution of complaints related to park infrastructure.")
    add_p(doc, "This project proposes the development of a Progressive Web Application that functions as an interactive, user-friendly, and real-time complaint management system. It will enable users to report park defects directly from their mobile phones or computers, while allowing field officials and administrators to monitor and act upon complaints efficiently. The system is envisioned as a scalable, secure, and reliable digital platform that supports BBMP’s broader goal of transforming Bengaluru into a cleaner, healthier, and more sustainable city.")

    add_h3(doc, "1.7.1 Functional Scope")
    add_p(doc, "The functional scope of the project is centered on four key modules: Citizens Module, Admin Module, Government Officials Module, and Maintenance Contractors Module, each playing an essential role in ensuring seamless communication and complaint resolution.")
    add_p(doc, "The Citizens Module focuses on empowering citizens by providing them access to an easy-to-use interface where they can register, log in, explore park directories, book commercial stall slots with digital payment records, register for community events, and report park defects by submitting live camera photographs, descriptions, and exact geolocation coordinates. Once a complaint is registered, users receive instant email notifications confirming submission and subsequent updates about the complaint’s progress. They can also log in to their accounts at any time to check the live status of their complaints. This direct involvement of citizens ensures transparency, encourages civic responsibility, and builds trust between the public and the municipal authority.")
    add_p(doc, "The Admin Module serves as the core control unit of the system. Administrators can manage registered users, officials, and contractors, create and maintain records of zones, divisions, and wards, and assign complaints to appropriate field staff based on their jurisdiction. They can track each complaint’s progress against SLA timelines, update its status, and ensure timely resolution. The system also enables administrators to generate analytical reports for performance review, trend analysis, and policy planning. Automated email alerts are sent to both users and officials whenever a complaint is assigned or resolved, ensuring that every stakeholder stays informed in real time.")
    add_p(doc, "The Field Official and Contractor Modules are designed to support the operational side of park maintenance. Through these modules, field staff can view the list of complaints assigned to them, visit the reported park locations, verify the authenticity of the complaints, log work progress, and take appropriate actions to resolve them. They can upload images of the resolved areas as proof of completion and update the status of each task. This digital workflow minimizes paperwork, speeds up communication, and improves accountability by maintaining a record of all activities performed by field staff.")
    add_p(doc, "Together, these modules ensure that the system functions as a complete end-to-end solution for park defect reporting and management. The integrated design allows continuous communication among all stakeholders, thereby ensuring that no complaint goes unnoticed or unresolved.")

    add_h3(doc, "1.7.2 Technical and Operational Scope")
    add_p(doc, "The technical and operational scope of the Park Monitoring System extends across multiple dimensions, combining the power of modern web technologies with practical field operations. From a technical perspective, the system is developed as a PWA to ensure seamless performance across various platforms, including smartphones, tablets, and desktops, without the need for separate installations. The frontend of the application is built using React, Vite, HTML5, CSS3, JavaScript, and Bootstrap to provide an interactive, responsive, and visually appealing user interface. The backend is powered by Node.js and Express.js and integrated with a MongoDB database, which securely stores user data, park records, complaints, stall bookings, status updates, and administrative records.")
    add_p(doc, "The application also incorporates advanced functionalities such as real-time geolocation tracking and mandatory live camera capture, which automatically captures the latitude and longitude of reported park defects to help officials accurately identify the location. Additionally, email notification services are integrated to automate communication between citizens, administrators, and field staff, ensuring that everyone stays informed about complaint updates. Security features such as password encryption using bcrypt and input validation are fully incorporated. The technical design of the system ensures scalability, maintainability, and reliability, allowing it to be easily extended or customized for future park management initiatives under smart city programs.")
    add_p(doc, "From an operational standpoint, the system is designed to be implemented citywide under the supervision of the BBMP. It will be actively used by four main stakeholders: citizens, field officials, contractors, and administrators, each having a defined role in the workflow. Citizens will use the platform to submit complaints from anywhere using their internet-enabled devices, eliminating the need to visit BBMP offices physically. This makes the complaint reporting process faster, simpler, and more transparent. Field staff will access their dashboards to view assigned complaints, verify the issues on-site, and upload real-time updates and photographic evidence after resolving the defects. This digital process not only saves time but also enhances accountability in field operations. Administrators will utilize the system to monitor overall complaint trends, analyze performance reports, manage resources efficiently, and ensure timely follow-up on unresolved issues.")
    add_p(doc, "The system’s operational scope also includes periodic maintenance, software updates, and data backups to ensure continuous availability and security. Moreover, the centralized digital approach reduces paperwork, eliminates communication delays, and improves workflow efficiency across departments. In the long run, this system can serve as a model for other municipalities and urban local bodies seeking to adopt digital solutions for public park maintenance and urban cleanliness.")

    # 1.8 Features (Exactly matching Pages 21-22 of PDF - 11 bullet points with bold titles)
    add_h2(doc, "1.8 Features")
    add_p(doc, "This application is designed as a comprehensive and technology-driven Application that enhances the efficiency of park management under the BBMP. The system integrates modern web technologies, location intelligence, and automation to create a seamless communication link between citizens, administrators, and field officials. It offers a range of innovative features that ensure real-time complaint tracking, transparency, and improved service delivery.")
    add_bullet_text(doc, "The system is developed as a PWA, ensuring that users can access it directly from any device mobile, tablet, or desktop without the need for installation. It provides an app-like experience with offline accessibility and responsive performance.", "Progressive Web Application (PWA):")
    add_bullet_text(doc, "A secure registration and login mechanism is provided for all users. Each account is password-protected to ensure data privacy and system security. Role-based access control ensures that users, administrators, and field officials can access only relevant functionalities.", "User Authentication and Secure Access:")
    add_bullet_text(doc, "Users can report park defects conveniently by capturing live photographs through device camera, providing a short description, and automatically capturing their current GPS location. This ensures that the exact location of the reported park defect is recorded accurately for quick response and action.", "Smart Complaint Reporting:")
    add_bullet_text(doc, "The system uses geolocation services to fetch and record the latitude and longitude of reported complaints, ensuring precision in identifying damaged facilities and helping field officials reach the location easily.", "Real-Time Location Integration:")
    add_bullet_text(doc, "The system automatically sends real-time email notifications to users, administrators, and field officials during key stages of the complaint cycle—such as submission, assignment, progress updates, and resolution. This promotes transparency and keeps all stakeholders informed.", "Automated Email Notifications:")
    add_bullet_text(doc, "Every registered complaint can be tracked in real time. Users can check whether their issue is pending, assigned, in progress, or resolved, promoting accountability and transparency in the park management process.", "Complaint Tracking and Status Updates:")
    add_bullet_text(doc, "Both citizens and field officials can upload images before and after maintenance activities. This visual documentation enhances the authenticity of reports and ensures that each complaint is supported with verifiable evidence.", "Photo Evidence and Documentation:")
    add_bullet_text(doc, "The system uses a structured database to manage all data related to users, complaints, zones, divisions, and officials. This centralized data storage ensures consistency, reliability, and efficient retrieval of records for analysis and reporting.", "Centralized Data Management:")
    add_bullet_text(doc, "The dashboard provides a real-time overview of system activities, including the number of complaints submitted, resolved, and pending. It supports search and filter options to help manage data efficiently and provides statistical summaries for decision-making.", "Interactive and Responsive Dashboard:")
    add_bullet_text(doc, "The system can generate analytical reports to help administrators evaluate complaint trends, response times, and official performance.", "Report Generation:")
    add_bullet_text(doc, "Complaints can be automatically or manually assigned to field officials and contractors based on location and workload. The assigned officials receive instant notifications, ensuring timely action and efficient task distribution.", "Automated Complaint Assignment:")

    doc.save(os.path.join(OUTPUT_DIR, "01_Chapter_1_Introduction.docx"))
    print("Generated: 01_Chapter_1_Introduction.docx")

# ==============================================================================
# 02. CHAPTER 2: LITERATURE REVIEW (Matching Pages 23-27 of PDF)
# ==============================================================================
def generate_chapter_2():
    doc = create_base_doc()
    add_h1(doc, "2. LITERATURE REVIEW")
    
    # 2.1 Introduction
    add_h2(doc, "2.1 Introduction:")
    add_p(doc, "A literature review is a critical summary and analysis of existing research, studies, and publications related to a particular topic. It helps to understand what has already been explored, identify gaps in knowledge, and provide a foundation for designing and justifying our own project. By reviewing previous work, a literature review highlights effective methodologies, challenges faced, and solutions proposed by other researchers. It also demonstrates how our project contributes to the existing body of knowledge and addresses unmet needs.")

    # 2.2 Result Analysis (Exactly 6 paragraphs matching Pages 23-26 of PDF)
    add_h2(doc, "2.2 Result Analysis:")
    add_p(doc, "As urban populations expand rapidly, cities are struggling with effective park maintenance and public infrastructure upkeep, prompting research into intelligent systems for monitoring and streamlining municipal maintenance. Several recent studies have explored IoT- and sensor-based architectures for smart municipal asset management, demonstrating the effectiveness of continuous telemetry and automated operational decision-making. Sheng et al. [1] presented a LoRa-enabled IoT system integrated with TensorFlow deep learning models to monitor municipal assets across urban zones. This system automatically detects facility breakdown and optimizes maintenance routes based on real-time data, significantly reducing operational delays and resource wastage. Similarly, Henaien et al. [8] proposed a scalable IoT-based architecture for sustainable municipal asset management, integrating cloud-based dashboards with smart sensors to automate monitoring and predictive maintenance. These systems provide continuous surveillance and can proactively prevent infrastructure failure in high-risk areas. Compared to these IoT-heavy approaches, your PWA-based Park Monitoring System relies primarily on citizen-initiated reporting, which is low-cost, scalable, and requires minimal infrastructure. While it does not automatically detect every facility defect, it leverages the city’s residents as distributed sensors, ensuring that real-time reporting can occur from any location, including areas where IoT deployment may be challenging. The literature suggests that combining selective IoT deployments at high-priority locations with your PWA’s citizen reports could create a hybrid system that maximizes coverage while maintaining cost efficiency.")
    add_p(doc, "Another area of research focuses on image-based and machine learning approaches for defect detection and classification. Majchrowska et al. [2] developed deep learning models capable of detecting and categorizing infrastructure defects in both urban and natural environments, achieving high accuracy using convolutional neural networks. Ren et al. [3] proposed an MRS-YOLO model, a variant of YOLO optimized for high-precision detection of multiple defect types in real-time. Jin et al. [12] similarly explored deep learning for urban infrastructure classification, demonstrating that automated systems could support operational decision-making and reduce manual verification workload. Your PWA already collects live camera images of park defects, providing a valuable dataset for future machine learning integration. By gradually introducing an automated image triage system, the administration could reduce false reports, speed up complaint assignment, and provide quantitative assessments of each complaint’s severity. The literature emphasizes that image-based verification, when combined with a human-in-the-loop workflow, provides a practical balance between automation and reliability, a model your PWA could adopt in subsequent phases.")
    add_p(doc, "Remote sensing, UAV-based surveillance, and GIS analysis have also emerged as powerful tools for urban green space management. Youme et al. [4] demonstrated the use of UAV imagery and deep learning for detecting damaged infrastructure in urban areas, while Dabholkar and Muthiyan [5] proposed automated mapping of civic issues using aerial orthophotos. Du et al. [11] applied GIS-based spatial modeling to assess and predict infrastructure failure risks, producing risk maps that allow municipal authorities to prioritize cleanup and repair operations. These approaches excel in macro-level surveillance, enabling rapid identification of large-scale park issues and strategic planning. However, they require technical expertise, high-resolution imagery, and periodic monitoring. In contrast, your PWA provides precise ground-level evidence, including user-uploaded live photos, descriptions, and GPS coordinates, ensuring that every reported park defect is verified and traceable. Integrating PWA data with GIS layers or periodic UAV imagery could enhance hotspot prioritization and resource allocation, providing a city-wide operational perspective that complements citizen-level reporting.")
    add_p(doc, "Crowdsourced reporting and citizen engagement form another critical component of effective urban park management. Studies such as the 2025 crowdsourced monitoring project [10] and Kannan [7] highlight the benefits of engaging residents as distributed sensors to detect and report public facility problems in real time. These works emphasize transparency, timely feedback, and clear workflows to ensure trust and sustained participation. Your PWA implements these principles through structured complaint forms, live captured images, admin-module complaint assignments, field-official verification, and automated email notifications. By closing the feedback loop between citizens, field officials, and administrators, the system enhances accountability and encourages active citizen involvement. The literature also underscores potential challenges, including false reporting, administrative overload, and privacy concerns. Solutions suggested in prior work include introducing reporter reputation systems, automated triage mechanisms, and clear data governance policies approaches that can be adapted to your PWA to strengthen its operational integrity.")
    add_p(doc, "The synthesis of these research strands highlights the complementary strengths and potential improvements for your PWA. Strengths include its low-cost deployment, wide scalability via citizen participation, transparency through real-time updates and notifications, and the capacity to generate actionable datasets for further analytics. Gaps identified in the literature include limited automation for image verification, lack of continuous proactive monitoring, the need for optimized complaint assignment workflows, and attention to data privacy. Integrating machine learning models for image verification (drawing on approaches from [2], [3], and [12]) could reduce administrative workload while maintaining accuracy. Similarly, selective IoT deployments or UAV monitoring in identified hotspot zones (as suggested by [1], [4], and [11]) could complement citizen reporting and enable proactive park management. Introducing predictive analytics based on historical PWA reports can assist administrators in forecasting areas at risk of recurring amenity damage, further improving operational efficiency.")
    add_p(doc, "Moreover, the literature recommends measuring quantitative performance metrics to evaluate system effectiveness, including reporting rate, assignment latency, resolution latency, verification accuracy, user satisfaction, and reduction of recurring hotspots. Implementing dashboards that capture these metrics aligns your PWA with smart city governance best practices and provides empirical evidence for policy-making and operational decisions. This approach also enables continuous improvement of the system, allowing administrators to refine workflows, optimize resource allocation, and identify locations that require preventive interventions.")
    add_p(doc, "Finally, integrating lessons from the literature supports a phased, research-informed evolution of your system. The initial PWA deployment focuses on citizen-driven reporting and verification, while future stages could introduce automated image triage, IoT sensor integration, GIS-based hotspot mapping, and predictive analytics. By combining these technological and procedural enhancements, your PWA can transform into a comprehensive, scalable, and efficient urban park management platform. This trajectory aligns with global trends in smart city governance, demonstrating a citizen-centric, technology-driven approach to tackling public park issues and enhancing public health and environmental quality.")
    add_p(doc, "The surveyed literature confirms that your PWA-based Park Monitoring System is well-aligned with contemporary research on smart municipal asset management. While IoT, ML, and remote sensing approaches offer automation and large-scale surveillance, they often require high costs, specialized expertise, and infrastructure. Our system’s focus on low-cost, citizen-driven reporting, real-time tracking, structured verification, and transparent feedback provides a practical and immediately deployable solution. By leveraging insights from prior work, your system can be extended with machine learning, GIS analysis, and selective IoT deployments, thereby enhancing efficiency, predictive capability, and strategic operational planning. Collectively, this research-informed approach ensures that your PWA contributes meaningfully to cleaner, healthier, and more sustainable urban park environments.")

    # 2.3 Identified gaps in the Literature (Exactly 9 bullet points matching Page 26 of PDF)
    add_h2(doc, "2.3 Identified gaps in the Literature")
    add_bullet_text(doc, "Most existing park management systems are too costly because they depend on IoT sensors, smart hardware, or drones. These technologies are not affordable or practical for all municipal park areas.")
    add_bullet_text(doc, "There are very few citizen-based systems that allow people to easily report park defects using their mobile phones. Most studies focus only on automatic detection and ignore public participation.")
    add_bullet_text(doc, "Current systems do not connect citizens and authorities effectively. Many research works focus on data collection but not on the process of verifying, updating, and resolving complaints.")
    add_bullet_text(doc, "Many smart municipal systems work separately without integration. For example, IoT-based detection and citizen reports are not combined to give a full picture of the problem.")
    add_bullet_text(doc, "There is a lack of image verification in most reporting systems. Citizens may upload old gallery images, and there are no live camera constraints to confirm the complaints quickly.")
    add_bullet_text(doc, "Predictive analysis and hotspot mapping are rarely used. Most systems only report current problems and do not analyze data to find future risk areas.")
    add_bullet_text(doc, "There is little focus on data privacy and user trust. Many studies do not explain how users’ personal data and location details will be protected.")
    add_bullet_text(doc, "Existing systems lack a proper evaluation method. They measure technical performance but not real results like how fast complaints are resolved or how satisfied users are.")
    add_bullet_text(doc, "Offline accessibility is often missing. Many applications need continuous internet access, which can be a problem in low-connectivity areas.")

    # 2.4 Existing System (Matching Page 27 of PDF)
    add_h2(doc, "2.4 Existing System")
    add_p(doc, "In the Existing scenario, park maintenance in cities like Bengaluru still depends on manual reporting and paper-based processes. Citizens usually inform BBMP about damaged park equipment or unhygienic facilities through phone calls, in-person ward visits, or social media, which often go unnoticed or delayed. There is no proper digital platform to track complaints, verify cleanups, or analyze recurring defect zones.")
    add_p(doc, "Research studies show that many cities are experimenting with IoT-based systems, smart hardware, or sensor technologies to detect municipal issues automatically. However, these systems require high costs and complex setups, making them difficult to implement everywhere. Also, existing systems lack citizen involvement and real-time feedback mechanisms, which are crucial for quick and effective action.")
    add_p(doc, "Thus, the current system faces challenges like delayed response, poor coordination, limited automation, and no centralized data for analysis and decision-making.")

    # 2.5 Proposed System (Matching Page 27 of PDF)
    add_h2(doc, "2.5 Proposed System")
    add_p(doc, "The proposed Park Monitoring System aims to overcome these limitations by introducing a Progressive Web Application (PWA) that combines citizen participation with smart digital monitoring. Unlike expensive IoT-based models mentioned in studies, this system focuses on low-cost, scalable citizen-driven reporting.")
    add_p(doc, "Citizens can easily report park defects by capturing live camera photos, GPS locations, and short descriptions. The system automatically sends email alerts, assigns complaints to officials and contractors, and allows status tracking through a centralized dashboard. This PWA also creates a structured database that can be later used for machine learning and GIS integration, as suggested in recent literature. By doing so, it bridges the gap between manual systems and advanced automated models.")
    add_p(doc, "Overall, the proposed system provides an affordable, transparent, and participatory solution for urban park management, aligning with global smart city and sustainable development goals. It enhances efficiency, accountability, and collaboration between citizens, field officials, contractors, and administrators.")

    doc.save(os.path.join(OUTPUT_DIR, "02_Chapter_2_Literature_Review.docx"))
    print("Generated: 02_Chapter_2_Literature_Review.docx")

# ==============================================================================
# 03. CHAPTER 3: SYSTEM ANALYSIS (Matching Pages 28-34 of PDF)
# ==============================================================================
def generate_chapter_3():
    doc = create_base_doc()
    add_h1(doc, "3. SYSTEM ANALYSIS")
    
    # 3.1 Introduction (Matching Page 28 of PDF)
    add_h2(doc, "3.1 Introduction:")
    add_p(doc, "Urban park degradation and unauthorized damage to public facilities have emerged as major civic challenges in metropolitan cities like Bengaluru. Despite regular maintenance mechanisms, numerous park defects continue to appear due to unreported breakdowns, inefficient monitoring, and lack of timely coordination between citizens, field staff, and administrative authorities. The manual process of complaint handling often leads to delays, data loss, and poor accountability. Moreover, citizens have limited visibility into the progress or resolution of their complaints, resulting in reduced trust in civic systems. Therefore, there is a strong need for a smart, digital, and transparent solution that allows real-time reporting, tracking, and resolution of park defect issues while enhancing communication between all stakeholders involved.")

    add_h3(doc, "3.1.1 Purpose:")
    add_p(doc, "The main purpose of this project is to design and develop a Progressive Web Application (PWA) that enables effective park monitoring and management under BBMP. The system aims to empower citizens to actively participate in keeping their city parks clean and functional by allowing them to report park defect locations with live photos and descriptions. At the same time, it provides administrators and field officials with an efficient digital platform to manage, assign, and resolve complaints in real time. The integration of automated notifications, complaint tracking, and digital records ensures transparency, accountability, and improved operational efficiency. Ultimately, the project supports the vision of smart governance and sustainable park management through technology and citizen collaboration.")

    add_h3(doc, "3.1.2 Scope:")
    add_p(doc, "The scope of this project encompasses the development of a Progressive Web Application (PWA) designed to streamline the process of reporting, monitoring, and resolving urban park defects within Bengaluru city under the jurisdiction of BBMP. The system provides a unified digital platform connecting citizens, field officials, and administrators to ensure efficient communication and real-time action. Citizens can easily register, log in, explore park amenities, book stall slots, and report park defects by capturing live camera images, entering descriptions, and sharing GPS-based location details, while also tracking the live status of their complaints. Administrators can manage citizens, officials, complaints, zones, and wards, as well as assign and monitor complaint resolutions through a centralized dashboard. Field officials, on the other hand, can view assigned complaints, verify locations, update statuses, and upload proof of resolution for administrative review. Additionally, the system integrates automated email notifications to keep users and officials informed about complaint updates and resolutions, ensuring transparency and accountability. This project is designed to be scalable, allowing future enhancements such as integration with SMS alerts, IoT-based environmental sensors, GIS mapping, and analytical dashboards for better decision-making and urban park management.")

    # 3.2 Overall Description (Matching Pages 29-30 of PDF)
    add_h2(doc, "3.2 Overall Description:")
    add_p(doc, "The Park Monitoring System is a Progressive Web Application (PWA) developed to support the Bruhat Bengaluru Mahanagara Palike (BBMP) in managing urban parks more effectively. The system provides a centralized digital platform for citizens, field officials, and administrators to report, verify, and resolve public park defects. The application bridges the gap between the public and BBMP staff by ensuring real-time reporting, transparency, and accountability. Citizens can capture live images, record location details, explore amenities, and submit complaints through an intuitive mobile-friendly interface. Field officials can verify the complaints, upload action reports, and update status in real-time, while administrators can monitor performance, assign tasks, and analyze city-wide trends.")

    add_h3(doc, "3.2.1 Product Perspective:")
    add_p(doc, "The proposed application contains easy graphical interfaces to all types of users. It contains simple databases which eliminates the complications of users. This is a responsive web page i.e. it can adjust in any platform. The product is a new, self-contained product. The product provides authenticated access to the data which makes the system to secure.")
    add_p(doc, "It also provides:")
    add_bullet_text(doc, "Good and easy user interfaces which makes the system user friendly.")
    add_bullet_text(doc, "Active workspaces for the users with many functions.")

    add_h3(doc, "3.2.2 Product Features:")
    add_bullet_text(doc, "Secure authentication system for Citizens, Field officials, and Admin.")
    add_bullet_text(doc, "Allows users to report park defects with live camera image uploads, location coordinates, and short descriptions.")
    add_bullet_text(doc, "Automatically captures latitude and longitude of complaint sites.")
    add_bullet_text(doc, "Centralized control panel to manage complaints, users, stall bookings, events, and reports.")
    add_bullet_text(doc, "Enables field staff to verify complaints, upload proof, and close cases.")
    add_bullet_text(doc, "Automatic email alerts for complaint registration, status updates, and resolution.")
    add_bullet_text(doc, "Hierarchical classification for structured complaint handling.")

    add_h3(doc, "3.2.3 User Characteristics")
    add_bullet_text(doc, "General public who report park defects using mobile or desktop browser.")
    add_bullet_text(doc, "Basic smartphone or internet usage knowledge.")
    add_bullet_text(doc, "BBMP Field Officials responsible for inspecting, verifying, and resolving complaints.")
    add_bullet_text(doc, "Admin who monitors, assigns tasks, and analyzes reports.")
    add_bullet_text(doc, "Intermediate to advanced technical skills and data interpretation ability.")

    add_h3(doc, "3.2.4 General Constraints:")
    add_bullet_text(doc, "The main constraint here would be the checking the genuineness of the user, which is not always possible. There can be security risks involved.")
    add_bullet_text(doc, "The developed system should run under any platform (UNIX, Linux, Mac, Windows etc.) that contains a web browser which supports modern JavaScript frameworks.")

    add_h3(doc, "3.2.5 Assumptions and Dependencies:")
    add_p(doc, "The system assumes that all users have access to internet-enabled devices equipped with GPS and camera functionality, and that they provide valid contact details for communication and notifications. Its effective operation depends on stable internet connectivity, accurate GPS data, reliable email service integration, and the active participation of both citizens and officials to ensure timely reporting, verification, and resolution of complaints.")

    # 3.3 Specific Requirements (Matching Pages 30-31 of PDF)
    add_h2(doc, "3.3 Specific Requirements:")
    add_h3(doc, "3.3.1 External Interface Requirements:")
    add_p(doc, "All the interactions of the software with different users, hardware and other software are specified here. The “Park Monitoring System” should be simple and easy to understand as well as to use.")
    add_h3(doc, "3.3.1.1 User Interface:")
    add_bullet_text(doc, "The system provides a user friendly GUI to the users.")
    add_bullet_text(doc, "Appropriate error messages are generated when a user performs an operation which is invalid.")

    add_h3(doc, "3.3.1.2 Hardware Interface:")
    add_bullet_text(doc, "Processor: 133-MHz Intel Pentium-class processor or higher")
    add_bullet_text(doc, "RAM : 4GB and above")
    add_bullet_text(doc, "Hard Disk :80GB and above")

    add_h3(doc, "3.3.1.2 Software Interface:")
    add_bullet_text(doc, "Front-End: React, Vite, HTML5, CSS3, JavaScript, Bootstrap5.")
    add_bullet_text(doc, "Back-End: Node.js (Express), MongoDB.")

    add_h3(doc, "3.3.1.4 Communication Interface:")
    add_p(doc, "This is a Progressive Web Application and communication is done through internet and internet protocols.")

    # 3.4 Functional Requirements (Matching Pages 31-33 of PDF)
    add_h2(doc, "3.4 Functional Requirements:")
    add_h3(doc, "3.4.1 Citizens Module:")
    add_p(doc, "This module is designed for citizens who raise park defect complaints, book stall slots, register for events, and track their resolution status. It enables active participation in improving the cleanliness and safety of their surroundings.")
    add_p(doc, "3.4.1.1 Registration:\nThis Module Allows new users to create an account by providing basic details such as name, mobile number, address, email, and password. This ensures user authentication and secure access to the system.")
    add_p(doc, "3.4.1.2 Login:\nThis Provides secure access to registered users by verifying their credentials. Once logged in, users can access all complaint-related features.")
    add_p(doc, "3.4.1.3 Profile:\nThis Module allows Displays user information such as name, contact details, address. Citizens can update their profile whenever necessary.")
    add_p(doc, "3.4.1.4 Raise Complaints:\nEnables citizens to raise park defect related complains by capturing live photos through camera, adding a short description, and fetching location details (latitude and longitude). This complaint is submitted to the concerned officials.")
    add_p(doc, "3.4.1.5 Check Status:\nThis Module allows users to monitor the progress of their submitted complaints. The complaint status is updated in real time by field officials or administrators.")
    add_p(doc, "3.4.1.6 Complaint Details:\nProvides detailed information about each complaint, including submission date, status updates, and resolution details.")

    add_h3(doc, "3.4.2 Admin Module:")
    add_p(doc, "The admin module serves as the central control panel for managing users, field officials, complaints, and master data such as zones, divisions, and wards. It ensures smooth coordination among all system stakeholders.")
    add_p(doc, "3.4.2.1 Login:\nThis module provides secure authentication for administrators to access the backend dashboard and management tools.")
    add_p(doc, "3.4.2.2 Reports:\nThis allows administrators to generate various analytical and performance reports based on complaint trends, ward-wise data, and official activity. These reports help in tracking efficiency and improving park management strategies.")
    add_p(doc, "3.4.2.3 Complaint Management:\nEnables the admin to view, assign, or reassign complaints to field officials and contractors. It also helps in assigning officials to specific wards and monitoring their performance based on complaint resolution.")
    add_p(doc, "3.4.2.4 App User Module:\nManages all registered users and field officials in the system. It includes options to view user profiles, manage access, and monitor participation.")
    add_p(doc, "3.4.2.4.1 Users:\nThis Module displays a list of all registered citizens and their complaint activities.")
    add_p(doc, "3.4.2.4.2 Officials:\nThis shows details of all field officials, their assigned wards, and complaint handling records.")
    add_p(doc, "3.4.2.5 Masters Module:\nThis Module handles the basic setup and structure of the system’s geographic data.")
    add_p(doc, "3.4.2.5.1 Zones:\nAdmin can add or manage city zones for proper area classification.")
    add_p(doc, "3.4.2.5.2 Divisions:\nThis Module allows management of multiple divisions under each zone.")
    add_p(doc, "3.4.2.5.3 Wards:\nThis Module enables the addition and management of wards under divisions, ensuring accurate complaint mapping.")
    add_p(doc, "3.4.2.6 Officials Management:\nAllows the admin to add, edit, or remove field officials.")

    add_h3(doc, "3.4.3 Field Officials:")
    add_p(doc, "This module is designed for field officials and contractors responsible for verifying and resolving reported park complaints.")
    add_p(doc, "3.4.3.1 Login:\nProvides secure login access for field officials to view and manage complaints assigned to them.")
    add_p(doc, "3.4.3.2 Profile:\nThis Module displays the official’s personal details, contact information, and address. Officials can update their details if necessary.")
    add_p(doc, "3.4.3.3 Complaints:\nLists all complaints assigned to the official within their ward. Officials can update the complaint details by uploading resolved image details and status.")
    add_p(doc, "3.4.3.4 Check_Complaints:\nAllows officials to verify and inspect complaints reported by citizens. They can update the status after physical verification.")
    add_p(doc, "3.4.3.5 Complaint_Details:\nProvides detailed information about each complaint, including submission date, status updates, and resolution details.")
    add_p(doc, "3.4.3.6 History:\nMaintains a record of all previously handled complaints, allowing officials to review their work history and completed tasks for future reference.")

    # 3.5 to 3.9 Requirements (Matching Pages 33-34 of PDF)
    add_h2(doc, "3.5 Performance Requirements:")
    add_bullet_text(doc, "The application requires internet connection.")
    add_bullet_text(doc, "Should have a good memory space.")
    add_bullet_text(doc, "Should be error-free.")

    add_h2(doc, "3.6 Design Constraints:")
    add_bullet_text(doc, "All the inputs should be checked for validation and messages should be given for the improper data. The invalid data are to be ignored and error messages should be given.")
    add_bullet_text(doc, "Details provided by the End-User during his registration should be stored in database.")
    add_bullet_text(doc, "While adding the details to the system, mandatory fields must be checked for validation whether the user has filled appropriate data in these mandatory fields. If not, proper error message should be displayed.")

    add_h2(doc, "3.7 Other Requirements:")
    add_p(doc, "The attribute of the application is maintained in such a way so that it can be very user friendly to all the users of the website.")
    add_bullet_text(doc, "Good validation of user inputs will be done to avoid entering incorrect username and password.", "Reliability:")
    add_bullet_text(doc, "This system can be run in any operating system and browser.", "Portability:")
    add_bullet_text(doc, "This system keeps on updating the data according to the changes that takes place.", "Compatibility:")
    add_bullet_text(doc, "The system carries out all the operations with consumptions of very less time.", "Timeliness:")
    add_bullet_text(doc, "Each time there is a security violation; system restricts the user from accessing that function.", "Security:")

    add_h2(doc, "3.8 Safety Requirements:")
    add_bullet_text(doc, "In case the user forgets or loses Password, the repair functionality helps by choosing “Forgot Password” option in the main login window.")
    add_bullet_text(doc, "Checking for the entity and provide features for them.", "Authorization:")

    add_h2(doc, "3.9 Security Requirements:")
    add_p(doc, "The proposed application is a secured Progressive Web Application. The users must register and then login to the system. Unauthorized user can’t access the application.")

    doc.save(os.path.join(OUTPUT_DIR, "03_Chapter_3_System_Analysis.docx"))
    print("Generated: 03_Chapter_3_System_Analysis.docx")

# ==============================================================================
# 04. CHAPTER 4: DESIGN AND METHODOLOGY (Matching Pages 35-47 of PDF)
# ==============================================================================
def generate_chapter_4():
    doc = create_base_doc()
    add_h1(doc, "4. DESIGN AND METHODOLOGY")
    
    # 4.1 System Design (Matching Page 35 of PDF)
    add_h2(doc, "4.1 System Design:")
    add_p(doc, "System design is a primary phase of the software development. System design aims to identify the modules that should be in the system. Design is the first step in the development phase of any system product or system. It may be defined as “the process of applying various techniques and principles for the purpose of defining a device, process or a system in sufficient detail to permit its physical realization”. The specification of these modules and how they interact with each other are the desired results. The goal of the design process is to produce a module or representation of the system which can be used later to build that system. It is the plan for the solution of the system. Design includes requirement specification and final solution for satisfying the requirements. The system design attention is given to what components can be implemented in the software is considered.")

    # 4.1.1 Functional Decompositions (Matching Pages 35-36 of PDF)
    add_h3(doc, "4.1.1 Functional Decompositions:")
    add_p(doc, "The Citizens Module is designed to empower citizens to actively participate in maintaining urban park cleanliness by allowing them to raise and track park defect complaints. Through this module, citizens can register by providing essential details such as name, mobile number, address, email, and password to ensure secure access and authentication. Once registered, users can log in to their accounts to access various features, including viewing and updating their profiles, exploring park directories, booking stall slots, and registering for events. The system enables citizens to raise complaints by uploading live photos, adding descriptions, and automatically capturing location details like latitude and longitude, which are then directed to the concerned officials for resolution. Additionally, users can check the real-time status of their complaints, view detailed complaint information, and track updates until the issue is resolved, ensuring transparency and engagement in the park management process.")
    add_p(doc, "The Admin Module serves as the central management system, overseeing users, field officials, complaints, and geographic data such as zones, divisions, and wards. It provides secure login access for administrators to manage backend operations efficiently. Admins can generate analytical reports to monitor complaint trends, official performance, and ward-wise activities, aiding in data-driven decision-making. The complaint management feature allows viewing, assigning, or reassigning complaints to officials while tracking their progress. The app user module helps manage registered citizens and field officials, including access control and performance monitoring. Furthermore, the Masters Module organizes geographic data by managing zones, divisions, and wards, ensuring precise complaint mapping.")
    add_p(doc, "The Field Officials Module supports officials and contractors responsible for verifying and resolving complaints. After secure login, officials can access their profiles, view assigned complaints, upload resolved photos, and update statuses. They can also verify citizen-reported complaints, maintain a record of resolved cases in the history section, and ensure accountability in complaint handling, thus promoting efficient and transparent park management operations.")

    # 4.1.2 Description of programs (Matching Page 36 of PDF)
    add_h3(doc, "4.1.2 Description of programs:")
    add_h3(doc, "4.1.2.1 Use Case Diagram")
    add_p(doc, "A Use Case Diagram is a type of behavioral diagram in the Unified Modeling Language (UML) that visually represents the interactions between users (called actors) and the system. It helps to capture the functional requirements of a system and provides a clear understanding of what the system is supposed to do from the user's perspective.")

    # Table 4.1.2.1 (Matching Page 36 of PDF)
    add_p(doc, "Table 4.1.2.1 Notations used in the Use Case Diagram", "")
    t_uc = doc.add_table(rows=1, cols=3)
    t_uc.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Symbol", "Name", "Description"]):
        t_uc.rows[0].cells[i].text = h
        t_uc.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t_uc.rows[0].cells[i], "E2E8F0")

    uc_rows = [
        ("Actor", "Actor", "A person, system or external entity that interacts with the system"),
        ("Ellipse", "Use Case", "It represents a function or action performed by the system"),
        ("Rectangle", "System Boundary", "A box that defines the scope of the system and contains all related use cases."),
        ("Solid Line", "Association", "Straight line connects actors to use cases, indicating interaction."),
        ("<<include>>", "Include Relationship", "Shows that a use case always uses another use case."),
        ("<<extend>>", "Extend Relationship", "Shows optional or conditional behavior that extends a base use case.")
    ]
    for row in uc_rows:
        r = t_uc.add_row().cells
        for idx, val in enumerate(row):
            r[idx].text = val

    add_p(doc, "\nFig. 4.1.2.1.1 Citizen Module: Illustrates Registration, Login, Profile, Raise Complaints, Check Status, and Complaint Details use cases connected to Citizen actor.")
    add_p(doc, "Fig. 4.1.2.1.2 Admin Module: Illustrates Login, Reports, Complaint Management (Assign, Reassign), App Users (Citizens, Officials), Masters (Zones, Divisions, Wards), and Officials Management use cases connected to Admin actor.")
    add_p(doc, "Fig. 4.1.2.1.3 Field Officials: Illustrates Login, Profile, Complaints Management, Check Complaints, Complaint Details, History, Update Complaints, and Get Direction use cases connected to Field Officials actor.")

    # 4.1.2.2 Context Flow Diagram (Matching Page 38 of PDF)
    add_h3(doc, "4.1.2.2 Context Flow Diagram (CFD)")
    add_p(doc, "In CFD entire system is considered as a single process. Context Flow Diagram shows input and output of the system. It shows all the external entities that interact with the system and how the data flow between the external entities and system.")
    add_p(doc, "Fig. 4.1.2.2 Context Flow Diagram: Shows Citizens sending Raise Complaints data to the central Park Monitoring System and receiving status updates; Field Officials sending Update Complaints data and receiving assigned tasks; and Admin performing Complaint Management operations.")

    # 4.2 Detailed Design (Matching Page 39 of PDF)
    add_h2(doc, "4.2 Detailed Design:")
    add_p(doc, "Detailed design is the second level of the design process. During detailed design, we specify how the module in the system interacts with each other and the internal logic of each of the modules specified during system design is decided, hence it is also called as logic design.")
    add_p(doc, "Detailed design essentially expands the system design and database design to contain a more detailed description of the processing logic and data structures so that the design is sufficiently complete for coding.")

    # 4.2.1 Data Flow Diagram (DFD) (Matching Page 39 of PDF)
    add_h3(doc, "4.2.1 Data Flow Diagram (DFD)")
    add_p(doc, "Data Flow Diagram shows the flow of data through system. Data Flow Diagram are also called as Data Flow Graphs. It views a system as a function that transforms the inputs into desired outputs. It aims to capture the transformation that taken place within a system to the input data so that eventually the output data is produced.")

    # Table 4.2.1 Notations used in the Data Flow Diagram
    add_p(doc, "Table 4.2.1 Notations used in the Data Flow Diagram", "")
    t_dfd = doc.add_table(rows=1, cols=3)
    t_dfd.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Symbols", "Name", "Description"]):
        t_dfd.rows[0].cells[i].text = h
        t_dfd.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t_dfd.rows[0].cells[i], "E2E8F0")

    dfd_rows = [
        ("Circle / Oval", "Processor", "It performs transformation of data from one state to another."),
        ("Rectangle", "Source / Sink", "It represents the external entity that may be either source or sink."),
        ("Directed Line", "Flow of data", "It represents the flow of data from source to destination."),
        ("Parallel Lines", "Data Source / Data storage", "It is the place where data is stored.")
    ]
    for row in dfd_rows:
        r = t_dfd.add_row().cells
        for idx, val in enumerate(row):
            r[idx].text = val

    add_p(doc, "\n4.2.1.1 Citizens Module:\nEnables citizens to register, log in, and actively participate in urban park cleanliness by raising park defect complaints with live photos and location details. Users can track complaint status in real time and stay informed until resolution.")
    add_p(doc, "4.2.1.1.1 Identification of Modules:\n• Registration\n• Login\n• Profile\n• Raise Complaints\n• Check Status\n• All Complaints")
    add_p(doc, "Fig. 4.2.1.1 Data Flow Diagram: Demonstrates Citizens data flowing to Registration (writing to Users Table), Profile (reading/updating Users Table), Raise Complaint (writing to Complaints Table), Check Status (reading Complaints Table by ID), and All Complaints (reading all entries from Complaints Table).")

    # 4.2.2 Structure chart (Matching Page 41 of PDF)
    add_h3(doc, "4.2.2 Structure chart:")
    add_p(doc, "Structure chart is a top-down modular design, consist of squares representing different models in a system and lines. Structure chart shows how program has been partitioned into manageable modules hierarchy and organization of those modules and communicational interface.")

    # Table 4.2.2 Notations used in the Structure Chart
    add_p(doc, "Table 4.2.2 Notations used in the Structure Chart", "")
    t_sc = doc.add_table(rows=1, cols=3)
    t_sc.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Symbol", "Name", "Process"]):
        t_sc.rows[0].cells[i].text = h
        t_sc.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t_sc.rows[0].cells[i], "E2E8F0")

    sc_rows = [
        ("Arrow with open circle", "Data flow", "Shows the direction flow of data."),
        ("Arrow with solid circle", "Control flow", "Shows the direction of control flow."),
        ("Rectangle", "Processing", "Shows manipulation, calculation and processing."),
        ("Solid Arrow", "Module Invocation", "It represents subordinate module being invoked by superior ordinate module."),
        ("Diamond box with branches", "Condition Invocation", "It indicates that the invocation of subordinates Module depends on the evaluation of a condition."),
        ("Circular arrow", "Iteration", "It represents the iteration.")
    ]
    for row in sc_rows:
        r = t_sc.add_row().cells
        for idx, val in enumerate(row):
            r[idx].text = val

    add_p(doc, "\n4.2.1.2 Admin Module:\nThis module allows administrators to manage citizens, officials, complaints, and geographic data efficiently. It supports complaint assignment, report generation, and app user managements.")
    add_p(doc, "4.2.1.2.1 Identification of Modules:\n• Login\n• Reports\n• Complaint Management\n• App Users\n• Masters\n• Officials Management")
    add_p(doc, "Fig 4.2.1.2 Structure Chart: Details the hierarchical breakdown of the Admin module into Reports (Wards, Dates, Status, Field Officials), Complaint Management (Assign, Reassign), App Users (Officials, Citizens), Masters (Zones, Divisions, Wards with Add/Edit/Delete actions), and Officials Management (Add/Edit/Delete actions).")

    # 4.2.3 UML Diagram (Matching Page 43 of PDF)
    add_h3(doc, "4.2.3 UML Diagram:")
    add_p(doc, "A UML Class Diagram is a structural diagram that represents the classes of a system, their attributes, methods, and the relationships between them. It helps visualize how different components interact with each other in an object-oriented design. This diagram is widely used for planning, analyzing, and documenting software systems")

    # Table 4.2.3 Notations used in the UML Diagram
    add_p(doc, "Table 4.2.3 Notations used in the UML Diagram", "")
    t_uml = doc.add_table(rows=1, cols=3)
    t_uml.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Symbol", "Name", "Process"]):
        t_uml.rows[0].cells[i].text = h
        t_uml.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t_uml.rows[0].cells[i], "E2E8F0")

    uml_rows = [
        ("+", "Public", "Attributes or method accessible by all classes."),
        ("-", "Private", "Attribute or method accessible only within the class."),
        ("#", "Protected", "Accessible within class and Subclass."),
        ("ClassBox (3 Compartments)", "Class", "Shows class name, attributes, and methods."),
        ("Class A —— Class B", "Association", "Relationship between two classes."),
        (":", "Attribute Type Separator", "Used to define datatype."),
        ("()", "Method Parantheses", "Used to show an operation or method."),
        ("1 —— *", "One-to-Many", "One object relates to many objects."),
        ("* —— *", "Many-to-Many", "Many objects relate to many objects."),
        ("Class A <>—— Class B", "Aggregation", "Whole-part relation where part can exist independently."),
        ("Class A <filled>—— Class B", "Composition", "Strong Whole-part relation, part cannot exists without whole.")
    ]
    for row in uml_rows:
        r = t_uml.add_row().cells
        for idx, val in enumerate(row):
            r[idx].text = val

    add_p(doc, "\n4.2.1.3 Field Officials Module:\nEmpowers officials to view, verify, and resolve assigned complaints. They can upload resolved photos, update statuses, and maintain complaint history to ensure accountability and timely action.")
    add_p(doc, "Fig 4.2.1.3 UML Diagram: Illustrates the Field Officials class (with attributes id, name, phone, zone, division, ward, email, password, and methods login, profile, viewAssignedComplaints, updateComplaints, checkComplaints, viewHistory) having a 1-to-many relationship with Complaints, Complaints Details, and History classes.")

    # 4.3 Database Design (Matching Pages 45-47 of PDF - All 8 Tables)
    add_h2(doc, "4.3 Database Design:")
    add_p(doc, "Database design is the process of producing a detailed data model of database. The data model contains all the needed logical and physical design choices and physical storage parameters needed to generate a design in a data definition language which can then be used to create a database. A fully attributed data model contains detailed attributes for each entity.")
    add_p(doc, "The term database design can be used to describe many different parts of the design of an overall database system principally and most correctly. It can be thought of as the logical design of the data base structures used to store the data. In the relational model, these are the tables and views. In an object database, the entities and relationships map directly to object classes and named relationships. However, the term database design could also be used to apply to the overall process of designing, not just the data base structures, but also the forms and queries used as a part of the overall database application within the Data Base Management System (DBMS).")

    add_h3(doc, "4.3.1 Table Description:")

    # 4.3.1.1 Users Table
    add_p(doc, "4.3.1.1 Users Table", "")
    t1 = doc.add_table(rows=1, cols=4)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Column", "Data type", "Constraints", "Descriptions"]):
        t1.rows[0].cells[i].text = h
        t1.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t1.rows[0].cells[i], "E2E8F0")
    for r_data in [
        ("id", "bigint(20)", "Primary key", "Id of the user"),
        ("name", "varchar(255)", "Not null", "Name of the user"),
        ("phone", "bigint (20)", "Not null", "Phone number of the user"),
        ("email", "varchar(255)", "Not null", "Email address of the user"),
        ("address", "varchar(255)", "Null", "Address of the user"),
        ("password", "varchar(255)", "Not null", "Password of the user")
    ]:
        row = t1.add_row().cells
        for idx, val in enumerate(r_data):
            row[idx].text = val

    # 4.3.1.2 Admin Table
    add_p(doc, "\n4.3.1.2 Admin Table", "")
    t2 = doc.add_table(rows=1, cols=4)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Column", "Data type", "Constraints", "Descriptions"]):
        t2.rows[0].cells[i].text = h
        t2.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t2.rows[0].cells[i], "E2E8F0")
    for r_data in [
        ("id", "bigint(20)", "Primary key", "Id of the Admin"),
        ("email", "varchar(255)", "Not null", "Email address of the Admin"),
        ("password", "varchar(255)", "Not null", "Password of the Admin")
    ]:
        row = t2.add_row().cells
        for idx, val in enumerate(r_data):
            row[idx].text = val

    # 4.3.1.3 Complaints Table
    add_p(doc, "\n4.3.1.3 Complaints Table", "")
    t3 = doc.add_table(rows=1, cols=4)
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Column", "Data type", "Constraints", "Descriptions"]):
        t3.rows[0].cells[i].text = h
        t3.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t3.rows[0].cells[i], "E2E8F0")
    for r_data in [
        ("id", "bigint(20)", "Primary key", "Id of the complaint"),
        ("latitude", "decimal(10,7)", "Not null", "Latitude of the location"),
        ("longitude", "decimal(10,7)", "Not null", "Longitude of the location"),
        ("image", "varchar(255)", "Not null", "Photos of park defect"),
        ("remarks", "text", "Null", "Description about park defect"),
        ("raised_by", "bigint(20)", "Not null", "Id of the user"),
        ("complaint_status", "varchar(255)", "Not null", "Status of the complaints"),
        ("ward", "varchar(255)", "Not null", "Name of the ward"),
        ("updated_image", "varchar(255)", "Not null", "Resolved Photos"),
        ("officials_remarks", "text", "Null", "Description about resolution")
    ]:
        row = t3.add_row().cells
        for idx, val in enumerate(r_data):
            row[idx].text = val

    # 4.3.1.4 Complaint_Official Table
    add_p(doc, "\n4.3.1.4 Complaint_Official Table", "")
    t4 = doc.add_table(rows=1, cols=4)
    t4.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Column", "Data type", "Constraints", "Descriptions"]):
        t4.rows[0].cells[i].text = h
        t4.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t4.rows[0].cells[i], "E2E8F0")
    for r_data in [
        ("id", "bigint(20)", "Primary key", "Assigned complaint id"),
        ("complaint_id", "bigint(20)", "Not null", "Id of the complaint"),
        ("official_id", "bigint(20)", "Not null", "Id of Field Officials")
    ]:
        row = t4.add_row().cells
        for idx, val in enumerate(r_data):
            row[idx].text = val

    # 4.3.1.5 Zones Table
    add_p(doc, "\n4.3.1.5 Zones Table", "")
    t5 = doc.add_table(rows=1, cols=4)
    t5.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Column", "Data type", "Constraints", "Descriptions"]):
        t5.rows[0].cells[i].text = h
        t5.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t5.rows[0].cells[i], "E2E8F0")
    for r_data in [
        ("id", "bigint(20)", "Primary key", "Zone id"),
        ("zone_name", "varchar(255)", "Not null", "Zone name"),
        ("latitude", "decimal(10,7)", "Not null", "Latitude value of zone"),
        ("longitude", "decimal(10,7)", "Not null", "Longitude value of zone")
    ]:
        row = t5.add_row().cells
        for idx, val in enumerate(r_data):
            row[idx].text = val

    # 4.3.1.6 Divisions Table
    add_p(doc, "\n4.3.1.6 Divisions Table", "")
    t6 = doc.add_table(rows=1, cols=4)
    t6.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Column", "Data type", "Constraints", "Descriptions"]):
        t6.rows[0].cells[i].text = h
        t6.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t6.rows[0].cells[i], "E2E8F0")
    for r_data in [
        ("id", "bigint(20)", "Primary key", "Division id"),
        ("zone_name", "varchar(255)", "Not null", "Zone name"),
        ("div_name", "varchar(255)", "Not null", "Division name"),
        ("latitude", "decimal(10,7)", "Not null", "Latitude value of division"),
        ("longitude", "decimal(10,7)", "Not null", "Longitude value of division")
    ]:
        row = t6.add_row().cells
        for idx, val in enumerate(r_data):
            row[idx].text = val

    # 4.3.1.7 Wards Table
    add_p(doc, "\n4.3.1.7 Wards Table", "")
    t7 = doc.add_table(rows=1, cols=4)
    t7.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Column", "Data type", "Constraints", "Descriptions"]):
        t7.rows[0].cells[i].text = h
        t7.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t7.rows[0].cells[i], "E2E8F0")
    for r_data in [
        ("id", "bigint(20)", "Primary key", "Ward id"),
        ("division_name", "varchar(255)", "Not null", "Name of the Zone"),
        ("ward_name", "varchar(255)", "Not null", "Name of the Ward"),
        ("ward_no", "varchar(255)", "Not null", "It represents Ward Number")
    ]:
        row = t7.add_row().cells
        for idx, val in enumerate(r_data):
            row[idx].text = val

    # 4.3.1.8 Officials Table
    add_p(doc, "\n4.3.1.8 Officials Table", "")
    t8 = doc.add_table(rows=1, cols=4)
    t8.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Column", "Data type", "Constraints", "Descriptions"]):
        t8.rows[0].cells[i].text = h
        t8.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t8.rows[0].cells[i], "E2E8F0")
    for r_data in [
        ("id", "bigint(20)", "Primary key", "Id of the Field official"),
        ("name", "varchar(255)", "Not null", "Name of the Field Official"),
        ("phone", "bigint(20)", "Not null", "Phone number of the Official"),
        ("zone", "varchar(255)", "Not null", "Name of the Zone"),
        ("division", "varchar(255)", "Not null", "Name of the Division"),
        ("ward", "varchar(255)", "Not null", "It represents Ward Number"),
        ("email", "varchar(255)", "Not null", "Email address of the Official"),
        ("password", "varchar(255)", "Not null", "Password of the Officials")
    ]:
        row = t8.add_row().cells
        for idx, val in enumerate(r_data):
            row[idx].text = val

    doc.save(os.path.join(OUTPUT_DIR, "04_Chapter_4_Design_and_Methodology.docx"))
    print("Generated: 04_Chapter_4_Design_and_Methodology.docx")

# ==============================================================================
# 05. CHAPTER 5: IMPLEMENTATION DETAILS (Matching Pages 48-57 of PDF)
# ==============================================================================
def generate_chapter_5():
    doc = create_base_doc()
    add_h1(doc, "5. IMPLEMENTATION DETAILS")
    
    # 5.1 Introduction (Matching Page 48 of PDF)
    add_h2(doc, "5.1 Introduction:")
    add_p(doc, "The goal of coding or implementation phase is to translate the system design, produced during the designing phase, into code in a given programming language which can be executed by a computer and that performs the computation specified by the design. During the implementation, it should be kept in mind that the programs should not be constructed so that they are easy to write, but that they are easy to read and understand.")

    # 5.2 Hardware and software tools used (Matching Pages 48-49 of PDF)
    add_h2(doc, "5.2 Hardware and software tools used")
    add_p(doc, "A set of reliable hardware and software tools is used for developing and operating the Park Monitoring System. These tools ensure smooth reporting, tracking, and management of park defect complaints with real-time accuracy. The selected technologies provide scalability, security, and easy maintenance for efficient system performance.")

    add_h3(doc, "5.2.1 Software Requirements")
    add_h3(doc, "5.2.1.1 Frontend Technologies")
    add_bullet_text(doc, "HTML5 is used to create the structure of the web pages, while CSS3 adds style, color, and layout to make the design attractive and responsive. Together, they help build a clean and user-friendly interface that works well on all devices.", "HTML5 and CSS3")
    add_bullet_text(doc, "JavaScript makes the web pages interactive and dynamic. It helps in real-time validation, menu toggling, and smooth communication between the frontend and backend without reloading the page.", "JavaScript")
    add_bullet_text(doc, "Bootstrap 5 is used to design responsive and mobile-friendly web pages. It provides ready-made components like buttons, forms, and cards, ensuring a consistent and neat layout across all screen sizes.", "Bootstrap 5")

    add_h3(doc, "5.2.1.2 Backend Technologies")
    add_bullet_text(doc, "Laravel (PHP Framework) / Node.js Express is used as the main backend framework for developing the application. It helps manage routes, handle authentication, process requests, and connect with the database efficiently. Its MVC architecture ensures better organization and scalability of the project.", "Backend Framework")
    add_bullet_text(doc, "MySQL / MongoDB serves as the database for storing user details, complaints, locations, and admin records. It provides fast, secure, and reliable data management for the system.", "Database")
    add_bullet_text(doc, "XAMPP / Node Environment is used as the local server environment to run the application backend and database. It simplifies backend development and testing by providing an easy setup for hosting the application locally.", "Server Environment")

    add_h3(doc, "5.2.1.3 Development Tools")
    add_bullet_text(doc, "Visual Studio Code is a lightweight, open-source code editor developed by Microsoft that supports numerous programming languages and extensions. It provides features like intelligent code completion, debugging, Git integration, and a customizable interface, making it ideal for web development.", "Visual Studio Code")

    add_h3(doc, "5.2.2 Hardware Requirements")
    add_bullet_text(doc, "Intel core processor with 64Bitsupport, Recommended: 2.8GHz or faster processor", "Processor:")
    add_bullet_text(doc, "Minimum 4 GB (8 GB recommended)", "RAM:")
    add_bullet_text(doc, "10 GB free space.", "Hard Disk:")

    # 5.3 Source Code (Matching Pages 49-57 of PDF)
    add_h2(doc, "5.3. Source Code:")
    
    add_p(doc, "Registration:", "")
    add_p(doc, "<form method=\"POST\" action=\"{{route('register')}}\" enctype='multipart/form-data'>\n"
               " @csrf\n"
               " @if($errors->has('phone'))\n"
               " <div class=\"alert alert-danger\">\n"
               " {{ $errors->first('phone') }}\n"
               " </div>\n"
               "@endif\n"
               "@if(session('success'))\n"
               "<div class=\"alert alert-success\" style=\"background-color: #e6ffed; color: 2e7d32; padding: 10px; border: 1px solid #a5d6a7; border-radius: 5px;\">\n"
               " <strong>Success!</strong> {{ session('success') }}\n"
               " </div>\n"
               " @endif\n"
               " <div class=\"text-center my-3\">\n"
               " <img src=\"{{ asset('images/logo.png') }}\" width=\"75\" height=\"75\" class=\"rounded-xl \">\n"
               " </div>\n"
               " <div class=\"input-style input-style-always-active has-borders no-icon validate-field mb-4\">\n"
               "<label for=\"name\" class=\"color-green-dark\">Name<span1 class=\"text-danger\">*</span1></label>\n"
               "<input type=\"text\" class=\"form-control validate-name\" id=\"name\" name=\"name\" required pattern=\"[A-Za-z\\s]{3,20}\" title=\"Please enter your name\" placeholder=\"Enter name\">\n"
               " <i class=\"fa fa-times disabled invalid color-red-dark\"></i>\n"
               " <i class=\"fa fa-check disabled valid color-green-dark\"></i>\n"
               " <em>(Required)</em>\n"
               " <small id=\"nameError\" class=\"text-danger\"></small>\n"
               " </div>\n"
               " </form>")

    add_p(doc, "Login:", "")
    add_p(doc, "public function login(Request $request)\n"
               "{\n"
               " $request->validate([\n"
               " 'phone' => 'required|digits:10',\n"
               " 'password' => 'required',\n"
               " ]);\n"
               "$user = User::where('phone', $request->phone)->first();\n"
               "if (!$user || !Hash::check($request->password, $user->password))\n"
               "{\n"
               " return back()->with('error', 'Invalid phone number or password.');\n"
               " }\n"
               "Auth::login($user);\n"
               "return redirect()->route('dashboard')->with('success', 'Login successful!');\n"
               "}")

    add_p(doc, "Raise Complaints:", "")
    add_p(doc, "public function store(Request $request)\n"
               "{\n"
               "$wards = Ward::all();\n"
               "if ($request->isMethod('post'))\n"
               "{\n"
               " $request->validate([\n"
               " 'latitude' => 'required',\n"
               " 'longitude' => 'required',\n"
               " 'ward' => 'required|exists:wards,ward_no',\n"
               " 'image' => 'required|image|mimes:jpeg,png,jpg|max:2048',\n"
               " 'remarks' => 'nullable|string'\n"
               " ]);\n"
               "// Save image\n"
               " $imageName = null;\n"
               " if ($request->hasFile('image'))\n"
               "{\n"
               " $imageName = time() . '.' . $request->image->extension();\n"
               " $request->image->move(public_path('complaint_images'), $imageName);\n"
               " }\n"
               "// Create complaint\n"
               " $complaint = Complaint::create([\n"
               " 'user_id' => Auth::id(),\n"
               " 'latitude' => $request->latitude,\n"
               " 'longitude' => $request->longitude,\n"
               " 'ward' => $request->ward,\n"
               " 'remarks' => $request->remarks,\n"
               " 'image' => $imageName,\n"
               " ]);\n"
               "// Get Complaint ID\n"
               " $complaintId = $complaint->id;\n"
               " // Send Email to user\n"
               " $user = Auth::user();\n"
               " if ($user && $user->email) {\n"
               "Mail::raw(\"Your complaint has been registered successfully.\\nComplaint ID: {$complaintId}\", function ($message) use ($user) {\n"
               " $message->to($user->email)->subject('Complaint Registered - Reference ID');\n"
               " });\n"
               " }\n"
               " // Return success message with complaint ID\n"
               "return redirect()->back()->with('success', \"Complaint submitted successfully. Your Complaint ID is: {$complaintId}\");\n"
               " } return view('add_complaints', compact('wards'));\n"
               "}")

    add_p(doc, "Assign Complaints:", "")
    add_p(doc, "public function assignOfficials(Request $request)\n"
               "{\n"
               "$request->validate([\n"
               "'complaint_id' => 'required|exists:complaints,id',\n"
               "'official_id' => 'required|exists:officials,id',\n"
               " ]);\n"
               " $official = Officials::findOrFail($request->official_id);\n"
               " $complaint = Complaint::findOrFail($request->complaint_id);\n"
               " // Attach official to complaint\n"
               " $official->complaints()->syncWithoutDetaching([$complaint->id]);\n"
               " // Update complaint status & deadline tracking\n"
               " $complaint->complaint_status = 'In progress';\n"
               " $complaint->assigned_at = now(); // store assigned time\n"
               " $complaint->save();\n"
               " // Send email notification\n"
               " Mail::to($official->email)->send(new NewComplaintAssigned($complaint));\n"
               "return redirect()->back()->with('success', 'Complaint assigned successfully and email sent.');\n"
               "}")

    add_p(doc, "Reports:", "")
    add_p(doc, "<form action=\"{{ route('reports') }}\" method=\"GET\" class=\"mb-4\">\n"
               "<!-- Filter fields as before -->\n"
               "<div class=\"row g-3 align-items-end\">\n"
               "<div class=\"col-md-2\">\n"
               "<label>From Date</label>\n"
               "<input type=\"date\" name=\"from_date\" class=\"form-control\" value=\"{{ request('from_date') }}\">\n"
               "</div>\n"
               "<div class=\"col-md-2\">\n"
               "<label>To Date</label>\n"
               "<input type=\"date\" name=\"to_date\" class=\"form-control\" value=\"{{ request('to_date') }}\">\n"
               "</div>\n"
               "<div class=\"col-md-2\">\n"
               "<label>Ward</label>\n"
               "<input type=\"text\" name=\"ward\" class=\"form-control\" value=\"{{ request('ward') }}\">\n"
               "</div>\n"
               "<div class=\"col-md-2 d-flex justify-content-center align-items-end gap-2\">\n"
               "<button type=\"submit\" class=\"btn btn-primary d-flex align-items-center gap-1\">\n"
               " <i class=\"bi bi-funnel-fill\"></i>\n"
               " </button>\n"
               "<button type=\"button\" id=\"downloadPdf\" class=\"btn btn-danger d-flex align-items-center gap-1\">\n"
               " <i class=\"bi bi-file-earmark-pdf-fill\"></i>\n"
               " </button>\n"
               " </div>\n"
               "</form>")

    add_p(doc, "Add Zones:", "")
    add_p(doc, "public function create()\n"
               "{\n"
               "$zoneNames = [\n"
               "'Yelahanka',\n"
               "'Dasarahalli',\n"
               "'Rajarajeshwarinagar',\n"
               "'Mahadevapura',\n"
               "'Bommanahalli',\n"
               "'Bangalore East',\n"
               "'Bangalore West',\n"
               "'Bangalore South'\n"
               "];\n"
               "return view('add_zone', compact('zoneNames'));\n"
               "}\n"
               "// Store new zone\n"
               "public function store(Request $request)\n"
               "{\n"
               "$request->validate([\n"
               "'zone_name' => 'required|unique:zones,zone_name',\n"
               "'latitude' => 'required|numeric',\n"
               "'longitude' => 'required|numeric',\n"
               "]);\n"
               "Zone::create($request->all());\n"
               "return redirect()->route('zones.index')->with('success', 'Zone added successfully.');\n"
               "}")

    add_p(doc, "Edit Division:", "")
    add_p(doc, "public function update(Request $request, $id)\n"
               "{\n"
               "$request->validate([\n"
               "'div_name' => 'required|string|max:255',\n"
               " 'zone_name' => 'required|string|max:255',\n"
               " 'latitude' => 'required|numeric',\n"
               "'longitude' => 'required|numeric',\n"
               "]);\n"
               "$division = Division::findOrFail($id);\n"
               "// Update with new values\n"
               "$division->div_name = $request->div_name;\n"
               "$division->zone_name = $request->zone_name;\n"
               "$division->latitude = $request->latitude;\n"
               "$division->longitude = $request->longitude;\n"
               "$division->save();\n"
               "Return redirect()->route('divisions.index')->with('success','Divisionupdated successfully!');\n"
               "}")

    add_p(doc, "App User:", "")
    add_p(doc, "@foreach($users as $user)\n"
               "<tr>\n"
               "<td>{{ $loop->iteration }}</td>\n"
               " <td>{{ $user->id }}</td>\n"
               " <td>{{ $user->name }}</td>\n"
               " <td>{{ $user->phone }}</td>\n"
               " <td>{{ $user->email }}</td>\n"
               " <td>{{ $user->address }}</td>\n"
               " <td>\n"
               "<button class=\"btn btn-sm btn-info show-complaints-btn\" data-user=\"{{ $user->name }}\" data-complaints='@json($user->complaints)'>\n"
               "{{ $user->complaints->count() }}\n"
               "</button>\n"
               " </td>\n"
               " <td>\n"
               " @if($user->is_blocked >= 3)\n"
               " <span class=\"badge bg-danger\">Blocked</span>\n"
               " @else\n"
               " <span class=\"badge bg-success\">Active</span>\n"
               " @endif\n"
               " </td>\n"
               " </tr>\n"
               "@endforeach")

    add_p(doc, "History:", "")
    add_p(doc, "<form method=\"GET\" action=\"/history\" enctype='multipart/form-data'>\n"
               "@csrf\n"
               "@forelse($complaints as $complaint)\n"
               " <div class=\"card mb-3\">\n"
               " <div class=\"card-body\">\n"
               " <strong>Complaint ID:</strong> {{ $complaint->id }} <br>\n"
               " <strong>Description:</strong> {{ $complaint->remarks }} <br>\n"
               " <div class=\"d-flex align-items-center justify-content-between\">\n"
               "<p class=\"mb-0\"><strong>Status:</strong>{{ucfirst($complaint->complaint_status)}}</p>\n"
               "<a href=\"{{ url('history_view/'.$complaint->id) }}\" class=\"btn btn-success btn-sm\">View</a>\n"
               " </div>\n"
               " </div>\n"
               " </div>\n"
               " @empty\n"
               " <p class=\"text-center text-muted\">No resolved complaints yet.</p>\n"
               " @endforelse\n"
               "</form>")

    add_p(doc, "Otp:", "")
    add_p(doc, "public function sendOtp(Request $request)\n"
               "{\n"
               "$request->validate([\n"
               " 'email' => 'required|email'\n"
               " ]);\n"
               " $user = User::where('email', $request->email)->first();\n"
               " if (!$user)\n"
               "{\n"
               " return back()->with('error', 'Email does not exist.');\n"
               " }\n"
               " $otp = rand(100000, 999999);\n"
               " session([\n"
               " 'otp' => $otp,\n"
               " 'email_for_reset' => $user->email\n"
               " ]);\n"
               " Mail::send('emails.send_otp', ['otp' => $otp], function ($message) use ($user) {\n"
               " $message->to($user->email);\n"
               " $message->subject('Your OTP for Password Reset');\n"
               " });\n"
               " return view('otp', ['email' => $user->email]);\n"
               "}")

    add_p(doc, "Model Code:", "")
    add_p(doc, "class Ward extends Model\n"
               "{\n"
               "use HasFactory;\n"
               "protected $fillable = [\n"
               "'division_name',\n"
               "'ward_name',\n"
               "'ward_no',\n"
               " ];\n"
               "}")

    doc.save(os.path.join(OUTPUT_DIR, "05_Chapter_5_Implementation_Details.docx"))
    print("Generated: 05_Chapter_5_Implementation_Details.docx")

# ==============================================================================
# 06. CHAPTER 6: RESULT AND EVALUATION (Matching Pages 58-62 of PDF - All 10 Tables)
# ==============================================================================
def generate_chapter_6():
    doc = create_base_doc()
    add_h1(doc, "6. RESULT AND EVALUATION")
    
    # 6.1 Introduction (Matching Page 58 of PDF)
    add_h2(doc, "6.1 Introduction:")
    add_p(doc, "Result and Evaluation is an investigation conducted to provide stake holders with information about the quality of the product or service under test. It has been defined as the process of analyzing a software item to detect the differences between existing and required conditions and to evaluate the features of the software item.")
    add_p(doc, "It involves operation of a system or application under controlled conditions and evaluating the results. The controlled conditions should include both normal and abnormal conditions. The objective of this is to intentionally introduce faults into the system to verify whether the functions perform correctly under specific conditions. It is essentially a detection-oriented process.")

    # 6.2 Test Scenario (Matching Page 58 of PDF)
    add_h2(doc, "6.2 Test Scenario:")
    add_p(doc, "A test scenario is a high-level description of a functionality or feature that needs to be tested within a software application. It represents a real-world situation that a user might encounter while using the system. The purpose of creating test scenarios is to ensure that every aspect of the application is covered during testing and that the system behaves as expected under different conditions. Test scenarios help testers understand what to test without focusing on the exact steps, providing a broad view of the system’s behavior and business flow.")

    # 6.3 Test Cases (Matching Page 58 of PDF)
    add_h2(doc, "6.3 Test Cases:")
    add_p(doc, "A test case is a software testing document, which consists of event, action, input, output, expected result and actual result. Clinically defined a test case is an input and an expected result. This can be pragmatic as ‘for condition x your derived result is y’, whereas other test cases described in more detail the input scenario and what results might be expected. It can occasionally be a series of steps but one with expected results or expected outcome. A test case should also contain a place for the actual result. White box testing is applicable at the unit, integration and system levels of the software testing process.")

    # Helper function for test case tables
    def create_tc_table(title, headers, rows):
        add_h3(doc, title)
        t = doc.add_table(rows=1, cols=len(headers))
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        for i, h in enumerate(headers):
            t.rows[0].cells[i].text = h
            t.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
            set_cell_background(t.rows[0].cells[i], "E2E8F0")
        for r_data in rows:
            r = t.add_row().cells
            for idx, val in enumerate(r_data):
                r[idx].text = val
        doc.add_paragraph()

    # 6.3.1 Registration Form (12 Rows matching Page 59 of PDF)
    create_tc_table("6.3.1 Registration Form", ["SI. No.", "Test Condition", "Expected Result", "Result"], [
        ("1.", "If user clicks on register button without entering name.", "Enter your username.", "Successful"),
        ("2.", "If user clicks on register button without entering phone number.", "Enter your phone number.", "Successful"),
        ("3.", "If user clicks on register button without entering email id.", "Enter your email id.", "Successful"),
        ("4.", "If user clicks on register button without entering password.", "Enter your password.", "Successful"),
        ("5.", "If user clicks on register button without entering confirm password.", "Enter your confirm password.", "Successful"),
        ("6.", "If password and confirm password mismatched", "Password do not matched", "Successful"),
        ("7.", "If the name field is filled in digits and clicks on “register” button.", "Name must contains only letters", "Successful"),
        ("8.", "If the user enters phone number field less than or greater than 10 digits length.", "Phone number must be exactly 10 digits", "Successful"),
        ("9.", "If the user enter invalid format of email id.", "Invalid email format", "Successful"),
        ("10.", "If the user wants to register again with same phone number.", "This phone number is already registered.", "Successful"),
        ("11.", "If the user enter invalid format of password.", "Invalid password format", "Successful"),
        ("12.", "If the valid register details are entered.", "System displays Login page.", "Successful")
    ])

    # 6.3.2 Login Form (3 Rows matching Page 60 of PDF)
    create_tc_table("6.3.2 Login Form", ["SI. No.", "Test Condition", "Expected Result", "Result"], [
        ("1.", "If the user enter invalid phone number", "Invalid phone no. or password", "Successful"),
        ("2.", "If the user enter invalid password", "Invalid phone no or password", "Successful"),
        ("3.", "If both phone number and password valid", "Displays dashboard page", "Successful")
    ])

    # 6.3.3 Forgot password Form (4 Rows matching Page 60 of PDF)
    create_tc_table("6.3.3 Forgot password Form", ["Sl. No.", "Test Condition", "Expected Result", "Result"], [
        ("1.", "If not internet connection", "Error sending email", "Successful"),
        ("2.", "If user enter invalid OTP", "Invalid OTP", "Successful"),
        ("3.", "If the user enter invalid format of password for rest password.", "Invalid password format", "Successful"),
        ("4.", "If password and new password mismatched", "Password do not matched", "Successful")
    ])

    # 6.3.4 Raise Complaints Form (2 Rows matching Page 60 of PDF)
    create_tc_table("6.3.4 Raise Complaints Form", ["Sl. No.", "Test Condition", "Expected Result", "Result"], [
        ("1.", "If not internet connection while fetching latitude and longitude details", "Error", "Successful"),
        ("2.", "If user clicks on submit button without selecting ward.", "Please fill out this field", "Successful")
    ])

    # 6.3.5 Check_status Form (2 Rows matching Page 60 of PDF)
    create_tc_table("6.3.5 Check_status Form", ["Sl. No.", "Test Condition", "Expected Result", "Result"], [
        ("1.", "If user enter invalid complaint id", "Complaint ID not found. Please enter a valid Complaint ID.", "Successful"),
        ("2.", "If user enter valid complaint id", "It shows complaint details", "Successful")
    ])

    # 6.3.6 Report Form (2 Rows matching Page 61 of PDF)
    create_tc_table("6.3.6 Report Form", ["Sl. No.", "Test Condition", "Expected Result", "Result"], [
        ("1.", "If admin enter invalid ward number", "No complaints found", "Successful"),
        ("2.", "If admin select invalid date range", "No complaints found", "Successful")
    ])

    # 6.3.7 Add Zone Form (4 Rows matching Page 61 of PDF)
    create_tc_table("6.3.7 Add Zone Form", ["Sl. No.", "Test Condition", "Expected Result", "Result"], [
        ("1.", "If admin clicks on submit button without entering zone name.", "The Zone name is required", "Successful"),
        ("2.", "If admin clicks on submit button without entering latitude.", "The latitude field is required", "Successful"),
        ("3.", "If admin clicks on submit button without entering longitude.", "The longitude field is required", "Successful"),
        ("4.", "If all details are entered.", "Zone added successfully", "Successful")
    ])

    # 6.3.8 Add Division Form (5 Rows matching Page 61 of PDF)
    create_tc_table("6.3.8 Add Division Form", ["Sl. No.", "Test Condition", "Expected Result", "Result"], [
        ("1.", "If admin clicks on submit button without entering zone name.", "The Zone name is required", "Successful"),
        ("2.", "If admin clicks on submit button without entering division name.", "The Division name is required", "Successful"),
        ("3.", "If admin clicks on submit button without entering latitude.", "The latitude field is required", "Successful"),
        ("4.", "If admin clicks on submit button without entering longitude.", "The longitude field is required", "Successful"),
        ("5.", "If all details are entered.", "Division added successfully", "Successful")
    ])

    # 6.3.9 Add Ward Form (4 Rows matching Page 62 of PDF)
    create_tc_table("6.3.9 Add Ward Form", ["Sl. No.", "Test Condition", "Expected Result", "Result"], [
        ("1.", "If admin clicks on submit button without entering division name.", "The Division name is required", "Successful"),
        ("2.", "If admin clicks on submit button without entering ward name.", "The ward name is required", "Successful"),
        ("3.", "If admin clicks on submit button without entering ward number.", "The ward number field is required", "Successful"),
        ("4.", "If all details are entered.", "Ward added successfully", "Successful")
    ])

    # 6.3.10 Add Officials Form (8 Rows matching Page 62 of PDF)
    create_tc_table("6.3.10 Add Officials Form", ["Sl. No.", "Test Condition", "Expected Result", "Result"], [
        ("1.", "If admin clicks on submit button without entering name.", "Enter your username.", "Successful"),
        ("2.", "If admin clicks on submit button without entering phone number.", "Enter your phone number.", "Successful"),
        ("3.", "If admin clicks on submit button without entering email id.", "Enter your email id.", "Successful"),
        ("4.", "If admin clicks on submit button without selecting zone.", "Select your zone.", "Successful"),
        ("5.", "If admin clicks on submit button without selecting division.", "Select your division.", "Successful"),
        ("6.", "If admin clicks on submit button without selecting ward.", "Select your ward.", "Successful"),
        ("7.", "If admin clicks on submit button without entering password.", "Enter password", "Successful"),
        ("8.", "If all details are correct.", "Official added successfully", "Successful")
    ])

    doc.save(os.path.join(OUTPUT_DIR, "06_Chapter_6_Result_and_Evaluation.docx"))
    print("Generated: 06_Chapter_6_Result_and_Evaluation.docx")

# ==============================================================================
# 07. CHAPTER 7: CONCLUSION AND FUTURE WORK (Matching Pages 63-64 of PDF)
# ==============================================================================
def generate_chapter_7():
    doc = create_base_doc()
    add_h1(doc, "7. CONCLUSION AND FUTURE WORK")
    
    # 7.1 Conclusion (Matching Page 63 of PDF)
    add_h2(doc, "7.1 Conclusion")
    add_p(doc, "The Park Monitoring System is an innovative progressive web application designed to address one of the major challenges faced by urban areas: improper park maintenance and the rise of unaddressed facility defects. The system provides a digital platform that bridges the gap between citizens and municipal authorities, enabling efficient reporting, monitoring, and management of park-related complaints. Through features such as image-based reporting, real-time tracking, automated notifications, and data visualization, the system ensures transparency, accountability, and timely resolution of complaints.")
    add_p(doc, "This project encourages active citizen participation by allowing users to easily report park defects through an interactive interface. The system automatically captures the location of the complaint, helping municipal authorities identify and act on problem areas promptly. Administrators can monitor complaints, and generate analytical reports that help in making decisions. By using technologies like React, Node.js, and Bootstrap, the system ensures a secure, scalable, and user-friendly experience for all users.")
    add_p(doc, "Moreover, the Park Monitoring System contributes significantly to promoting environmental cleanliness and sustainable urban management. It supports the concept of a smart city by integrating technology into everyday governance, ensuring cleaner surroundings and a healthier living environment for citizens. By digitalizing the park defect complaint process, it reduces manual effort, saves time, and minimizes delays in issue resolution. Overall, the system plays a crucial role in fostering public awareness, civic responsibility, and effective municipal asset management practices, thereby moving one step closer to a cleaner and greener city.")

    # 7.2 Future Work (Matching Pages 63-64 of PDF)
    add_h2(doc, "7.2 Future Work")
    add_p(doc, "The Park Monitoring System has significant potential for future enhancements that can further strengthen its effectiveness, citizen engagement, and administrative efficiency. One of the major improvements that can be introduced is a Reward and Awareness Module. This module can motivate citizens to actively participate in maintaining park cleanliness by offering digital badges, appreciation certificates, and leaderboard rankings based on their reporting frequency and contribution to maintaining public green spaces. Additionally, the system can support awareness campaigns, such as cleanliness drives, environmental workshops, and community tree-planting events.")
    add_p(doc, "Another important enhancement is the integration of multi-department coordination features. Currently, complaint management may involve separate teams such as sanitation, health, and environmental units. By enabling a unified platform where these departments can collaborate, the system can ensure faster, more organized, and transparent complaint resolution. Shared dashboards, inter-department communication channels, and automated task routing can help streamline the entire workflow and avoid delays caused by manual coordination.")
    add_p(doc, "Furthermore, incorporating a comprehensive user feedback mechanism will allow citizens to rate the quality of service, provide suggestions, and share their satisfaction levels after issue resolution. This will help authorities identify gaps, improve service delivery, and build trust with the community.")
    add_p(doc, "A major technological advancement for future implementation is the use of GIS-based hotspot mapping. With this feature, authorities can visually monitor areas with frequent complaints by plotting latitude and longitude coordinates on an interactive map. Over time, the system can highlight recurring park defect zones, identify patterns, predict potential problem areas, and assist in strategic planning. This can be extremely useful for resource allocation, route optimization for maintenance crews, and policy-making related to urban cleanliness.")
    add_p(doc, "By implementing these advanced features, the Park Monitoring System can evolve into a highly interactive, responsive, and intelligent platform. These enhancements will not only boost citizen participation but also enhance transparency, accelerate decision-making, and support the larger goal of urban cleanliness, environmental sustainability, and smart city development.")

    doc.save(os.path.join(OUTPUT_DIR, "07_Chapter_7_Conclusion_and_Future_Work.docx"))
    print("Generated: 07_Chapter_7_Conclusion_and_Future_Work.docx")

# ==============================================================================
# 08. REFERENCES & APPENDICES (Matching Pages 65-76 of PDF)
# ==============================================================================
def generate_references_and_appendices():
    doc = create_base_doc()
    
    # References (Matching Page 65 of PDF - Exactly 12 references)
    add_h1(doc, "REFERENCES")
    refs = [
        "[1] T. J. Sheng, M. S. Islam, N. Misran, M. H. Baharuddin, H. Rmili, and M. T. Islam, “An Internet of Things Based Smart Waste Management System Using LoRa and TensorFlow Deep Learning Model,” IEEE Access, vol. 8, pp. 18245–18257, 2020.",
        "[2] S. Majchrowska, P. Borkowski, and M. Majchrowski, “Deep learning-based waste detection in natural and urban environments,” Journal of Cleaner Production, vol. 360, 132243, 2022.",
        "[3] Y. Ren, J. Li, and X. Wang, “An MRS-YOLO Model for High-Precision Waste Detection,” Sensors, vol. 24, no. 2, pp. 512, 2024.",
        "[4] O. Youme, A. Kumar, and S. Patel, “Detection of clandestine waste dumps using UAV images,” Procedia Computer Science, vol. 192, pp. 1234–1242, 2021.",
        "[5] S. Dabholkar and S. Muthiyan, “Smart Illegal Dumping Detection,” EPICS IEEE Student Project, 2021.",
        "[6] G. White, C. Cabrera, A. Palade, F. Li, and S. Clarke, “WasteNet: Waste Classification at the Edge for Smart Bins,” arXiv preprint arXiv:2008.03457, 2020.",
        "[7] D. Kannan, “Smart waste management 4.0: The transition from traditional to intelligent waste systems,” Science of The Total Environment, vol. 856, 159029, 2024.",
        "[8] A. Henaien, H. Trabelsi, and F. Kamoun, “A sustainable smart IoT-based solid waste management system (SCSWMS),” Future Generation Computer Systems, vol. 147, pp. 296–310, 2024.",
        "[9] M. Aazam, M. St-Hillarie, C.-H. Lung, and I. Lambadaris, “Cloud-based smart waste management for smart cities,” IEEE Communications Magazine, vol. 56, no. 6, pp. 60–66, 2018.",
        "[10] “Crowdsourced Waste Monitoring and Reporting System for Urban Sustainability,” Student Research Paper, 2025.",
        "[11] L. Du, Y. Zhang, and X. Li, “Assessing and predicting illegal dumping risks in urban areas,” Waste Management, vol. 146, pp. 35–47, 2023.",
        "[12] S. Jin, W. Liu, and H. Zhang, “Garbage detection and classification using a new deep learning model,” Journal of Cleaner Production, vol. 385, 135776, 2023."
    ]
    for ref in refs:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.3
        p.paragraph_format.space_after = Pt(4)
        p.add_run(ref)

    # Appendices (Matching Pages 54-64 of PDF)
    doc.add_page_break()
    add_h1(doc, "APPENDICES")
    add_h2(doc, "Citizens Module:")
    add_p(doc, "Fig1: Index Page\nFig 2: Registration\nFig 3: Login\nFig 4: Forgot Password\nFig 5: OTP Page\nFig 6: Reset Password Page\nFig 7: Citizen Dashboard\nFig 8: Profile\nFig 9: Edit Profile\nFig 10: Add Complaints\nFig 11: Check Status\nFig 12: Complaint List\nFig 13: Closed Complaint List")
    
    add_h2(doc, "Admin Module:")
    add_p(doc, "Fig 14: Admin Login\nFig 15: Admin Dashboard\nFig 16: Report Page\nFig 17: Complaint Management\nFig 18: Add Zone\nFig 19: Edit Division\nFig 20: View Wards\nFig 21: Add Officials")
    
    add_h2(doc, "Field Officials Module:")
    add_p(doc, "Fig 22: Officials Dashboard\nFig 23: Assigned Complaints List\nFig 24: History\nFig 25: Update Complaints\nFig 26: Complaint Model Code\nFig 27: Officials Model Code\nFig 28: Wards Table Code\nFig 29: Divisions Table Code\nFig 30: Complaint assignment Mail Code")

    doc.save(os.path.join(OUTPUT_DIR, "08_References_and_Appendices.docx"))
    print("Generated: 08_References_and_Appendices.docx")

if __name__ == "__main__":
    generate_preliminary()
    generate_chapter_1()
    generate_chapter_2()
    generate_chapter_3()
    generate_chapter_4()
    generate_chapter_5()
    generate_chapter_6()
    generate_chapter_7()
    generate_references_and_appendices()
    print("\nALL EXACT MATCH DOCX FILES GENERATED SUCCESSFULLY IN:", OUTPUT_DIR)
