import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

OUTPUT_DIR = r"d:\park_monitoring_system08\park-management\documentation_chapters_v2"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def create_base_doc(header_title="Park Monitoring & Management System"):
    doc = docx.Document()
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1.25)
        section.right_margin = Inches(1)
        
        # Header
        header = section.header
        hp = header.paragraphs[0]
        hp.text = "Park Monitoring & Management System"
        hp.alignment = WD_ALIGN_PARAGRAPH.LEFT
        hp.style.font.name = 'Times New Roman'
        hp.style.font.size = Pt(9)
        hp.style.font.color.rgb = RGBColor(120, 120, 120)
        
        # Footer
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.text = "Department of MCA, PIM, Udupi"
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        fp.style.font.name = 'Times New Roman'
        fp.style.font.size = Pt(9)
        fp.style.font.color.rgb = RGBColor(120, 120, 120)

    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(12)
    normal_style.font.color.rgb = RGBColor(30, 30, 30)
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
    run.font.size = Pt(16)
    run.font.bold = True
    run.font.color.rgb = RGBColor(0, 0, 0)
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
    run.font.color.rgb = RGBColor(0, 0, 0)
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
    run.font.color.rgb = RGBColor(0, 0, 0)
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

# -------------------------------------------------------------
# 00. PRELIMINARY PAGES
# -------------------------------------------------------------
def generate_preliminary():
    doc = create_base_doc("Preliminary Pages")
    add_h1(doc, "MANGALORE UNIVERSITY")
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Project Report on\n“PARK MONITORING SYSTEM”\n\nCarried out and submitted by\n")
    r.font.bold = True
    r.font.size = Pt(14)
    
    r2 = p.add_run("NISHITHA\nReg. No.: P05PP23S126010\nIV Semester MCA Student\nPoornaprajna Institute of Management, Udupi\n\n")
    r2.font.bold = True
    r2.font.size = Pt(13)
    
    r3 = p.add_run("Under the guidance of\nProf. Venugopala Rao A. S.\nHOD\nDept. of MCA, PIM, Udupi.\n\nIn the partial fulfilment of the requirement for the award of degree in Master of Computer Applications during the academic year 2024-25\n\nPoornaprajna Institute of Management,\nUdupi\n2024-2025\n")
    r3.font.size = Pt(12)

    doc.add_page_break()
    add_h1(doc, "CERTIFICATE")
    add_p(doc, "This is to certify that the project entitled “Park Monitoring System” has been carried out by Nishitha (Reg.No.: P05PP23S126010), student of fourth semester MCA (Masters of Computer Applications) under the supervision of Prof. Venugopala Rao A.S., MCA Department, Poornaprajna Institute of Management, Udupi. The project is submitted in partial fulfilment of the requirement for the award of Master of Computer Applications by Mangalore University during the Academic year 2024-2025.\n\n\n\n")
    
    p_sig = doc.add_paragraph()
    p_sig.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_sig.add_run("Internal Guide\t\t\t\t\tHead of the Department\n\n\n\nInternal Examiner\t\t\t\t\tExternal Examiner\n\nSubmitted for the viva-voce examination held on: ..................")
    
    doc.add_page_break()
    add_h1(doc, "DECLARATION")
    add_p(doc, "This project work entitled “PARK MONITORING SYSTEM” has been successfully carried out by me under the supervision and guidance of Prof. Venugopala Rao A.S., Head of the MCA Department, Poornaprajna Institute of Management, Udupi. This project is submitted in partial fulfilment for the award of Masters of Computer Application degree by Mangalore University during the academic year 2024–25. This work or any part of this work has not been submitted to any other university or Institute/School for the award of any other Degree or Diploma.\n\n\nDate: ...................\nPlace: Udupi\t\t\t\t\tName: NISHITHA\n\t\t\t\t\t\tReg. No.: P05PP23S126010")
    
    doc.add_page_break()
    add_h1(doc, "ACKNOWLEDGEMENT")
    add_p(doc, "I take this opportunity to express my sincere thanks to my guide Prof. Venugopala Rao A. S., Head of the MCA Department, Poornaprajna Institute of Management, for his all-round guidance, timely help at every stage of this project and for the valuable suggestions and unlimited support.\n\nI would like to express my gratitude to Dr. P. S. Aithal, Director, Poornaprajna Institute of Management, for granting the necessary permissions and providing all kinds of infrastructure facilities in the department to carry out this project successfully.\n\nAll faculty members and non-teaching staff of the MCA department.\n\nI would like to express my heartfelt gratitude to my parents, friends and well-wishers who have always inspired and blessed me, including those whom I may have inadvertently failed to mention. Above all, with all my heart, I thank you God for empowering me with the dedication, focus and patience to carry out this project successfully.\n\n\nNISHITHA\nReg. No.: P05PP23S126010")

    doc.add_page_break()
    add_h1(doc, "ABSTRACT")
    add_p(doc, "Urban green space management and public park maintenance are critical challenges faced by rapidly growing cities like Bengaluru. The increasing wear and tear of park amenities, damaged play equipment, broken benches, non-functional lighting, overflowing waste receptacles, and neglected garden flora have become a major concern for the Bruhat Bengaluru Mahanagara Palike (BBMP). These neglected park issues not only affect the city's cleanliness and natural beauty but also pose severe safety and environmental risks to visiting citizens and children. To address these issues, there is a pressing need for a comprehensive digital platform that enables timely reporting, monitoring, and resolution of park-related problems through active citizen participation and structured administrative coordination. This project presents the development of a Progressive Web Application (PWA) aimed at supporting BBMP's urban green management initiative. The system provides a real-time, transparent, and user-friendly platform for reporting, tracking, and resolving park maintenance complaints across Bengaluru. It bridges the communication gap between Citizens, Field Officials, Maintenance Contractors, and Administrators by ensuring smooth information flow and coordinated action.")
    add_p(doc, "The system comprises four major integrated modules: Citizens, Admin, Government Officials, and Maintenance Contractors. The Citizens module enables citizens to register, log in, update profiles, explore park directories with amenity details, book commercial stall slots with digital payments, register for community events, and raise maintenance complaints by capturing live photos through their device camera along with automatic GPS location coordinates and problem descriptions. Citizens can also check the live status of their complaints and track the complete resolution lifecycle. Additionally, the system sends automated email notifications to citizens upon successful complaint registration, assignment, and final resolution, ensuring complete transparency throughout the process.")
    add_p(doc, "The Admin module acts as the central control panel, managing all administrative activities such as complaint assignments, contractor oversight, official supervision, stall booking reviews, event registrations, and report generation. It includes sub-modules for managing users, officials, contractors, districts, corporations, zones, and wards, allowing the administrator to maintain proper geographic and operational control across the entire city. When a complaint is assigned or resolved, automated email alerts are triggered to both the assigned field staff and the concerned citizen, improving communication efficiency and accountability.")
    add_p(doc, "The Government Officials and Contractors modules empower on-ground field staff to log in, view assigned tasks, submit daily work progress logs with photographic evidence, request necessary maintenance materials, verify completed repairs on-site, and maintain a complete work history for performance auditing. By integrating these modules with real-time email notification support, interactive map visualization, and PWA capabilities, the application ensures seamless communication, efficient complaint resolution, and improved park management workflows.")
    add_p(doc, "Keywords: Park Monitoring, PWA, Proactive, Transparency, Complaints, Maintenance, BBMP", "")

    doc.save(os.path.join(OUTPUT_DIR, "00_Preliminary_Pages.docx"))
    print("Generated: 00_Preliminary_Pages.docx")

# -------------------------------------------------------------
# 01. CHAPTER 1: INTRODUCTION
# -------------------------------------------------------------
def generate_chapter_1():
    doc = create_base_doc("Chapter 1 - Introduction")
    add_h1(doc, "1. INTRODUCTION")
    
    add_h2(doc, "1.1 Introduction")
    add_p(doc, "Urbanization has brought about significant development and modernization across cities, but it has also introduced complex challenges in maintaining clean, sustainable, and livable recreational environments. Among these challenges, the maintenance of urban public parks and green open spaces has emerged as one of the most critical issues faced by metropolitan areas such as Bengaluru, a city that continues to expand rapidly in population and infrastructure. The intensive daily public utilization of parks, combined with weather degradation and delayed maintenance practices, has led to frequent breakdowns of park facilities such as children's play equipment, fitness apparatus, walking tracks, lighting, restrooms, and horticulture. These damaged park assets not only diminish the aesthetic appeal of the city but also pose safety hazards to walking citizens, seniors, and playing children, leading to environmental deterioration and degraded public health.")
    add_p(doc, "The Bruhat Bengaluru Mahanagara Palike (BBMP), responsible for the city's civic and infrastructural management, has made several efforts to maintain and safeguard public parks. However, traditional methods of monitoring and managing park facilities are often inefficient due to delays in complaint handling, lack of real-time coordination, and insufficient citizen engagement. Many citizens find it difficult to report damaged amenities or track the progress of their complaints, leading to reduced accountability and transparency. These limitations highlight the urgent need for a technological solution that bridges the gap between citizens, field officials, maintenance contractors, and administrators, ensuring timely communication and effective park asset management.")
    add_p(doc, "In this context, the proposed project, “Park Monitoring System,” introduces a Progressive Web Application (PWA) designed to transform the way park-related complaints and municipal recreational facilities are reported, managed, and maintained within the BBMP framework. The system leverages the power of digital connectivity, live camera verification, geolocation tracking, and automated communication to create a real-time, interactive, and transparent platform for citizens and authorities alike. The main objective of the system is to empower citizens to actively participate in maintaining urban green spaces by easily reporting park defects through live photos, location details, and descriptions, while enabling administrators, government officials, and contractors to handle these complaints efficiently through an integrated backend system.")
    add_p(doc, "The application is built with four major modules—Citizens, Admin, Government Officials, and Maintenance Contractors—each serving a distinct purpose to ensure smooth workflow, operational efficiency, and mutual accountability.")

    add_h2(doc, "1.2 Overview of the project")
    add_p(doc, "Maintaining urban green spaces and recreational park infrastructure is a vital aspect of sustainable city development. With the rapid expansion of Bengaluru, efficient park maintenance, civic amenities upkeep, and organized event management have become major priorities for the Bruhat Bengaluru Mahanagara Palike (BBMP). However, the deterioration of park facilities, uncoordinated maintenance, and lack of timely grievance redressal continue to disrupt the city's public parks. To overcome these issues, modern technology can play a transformative role by enabling digital participation, quick response, and transparent monitoring.")
    add_p(doc, "This project introduces a Progressive Web Application (PWA) for Park Monitoring System, designed to support BBMP's vision of a clean, green, and smart Bengaluru. The platform provides a single digital interface that connects citizens, field officials, contractors, and administrators, ensuring smooth communication and efficient resolution of complaints. It allows users to report park defects instantly by taking live photographs, providing automatic GPS geolocation details, and adding brief descriptions. Each complaint is recorded in real time and tracked throughout its lifecycle, promoting transparency and accountability.")
    add_p(doc, "The proposed system is structured into four core modules: Citizens, Admin, Government Officials, and Maintenance Contractors. The Citizens module enables citizens to register, log in, explore park amenities, book commercial stall slots with digital payments, reserve community event passes, and raise complaints by capturing live photos of damaged park equipment along with location coordinates. Citizens can also monitor the live status of their complaints, receive email notifications for updates, and view the final resolution proof once the issue is addressed.")
    add_p(doc, "The Admin module acts as the control center, managing user data, official assignments, contractor allocations, park asset inventory, stall bookings, and complaint tracking. It provides advanced functionalities like geographic hierarchy management (districts, corporations, zones, and wards), automated complaint assignment, and performance monitoring of field officials and contractors. The admin also receives instant updates and can generate analytical reports to evaluate the overall progress and efficiency of park management.")
    add_p(doc, "The Government Officials module allows authorized civic staff to log in, access assigned parks, inspect reported complaints on-site, verify contractor repair proofs, approve work quality, and update complaint statuses directly from the field.")
    add_p(doc, "The Maintenance Contractors module allows assigned maintenance agencies to view task orders, log daily work progress with timestamped photos, raise material requisitions for necessary spare parts, and submit completion reports. This not only enhances operational efficiency but also helps maintain accountability among on-ground workers.")
    add_p(doc, "A key feature of the system is its real-time email notification mechanism, which automatically sends alerts to users, contractors, and officials upon complaint submission, assignment, progress updates, and final resolution. This ensures transparency and builds trust between citizens and civic authorities. The inclusion of live camera capture and geolocation tracking further enhances the accuracy and reliability of the system by preventing fake gallery uploads and helping officials pinpoint the exact location of the defect within the park, minimizing delays in response time.")
    add_p(doc, "The proposed solution aligns with the broader vision of Smart City and E-Governance initiatives undertaken by the Government of India. By integrating technology into municipal park governance, the system promotes citizen engagement, data-driven decision-making, and efficient resource utilization. It empowers citizens to become active stakeholders in maintaining city parks while supporting BBMP's mission to create cleaner, greener, and safer recreational environments.")
    add_p(doc, "Moreover, this system addresses several challenges inherent in traditional municipal management approaches, such as manual record-keeping, miscommunication between departments, and lack of accountability. Through digital automation, it provides a scalable, secure, and easily accessible platform that can be expanded to other municipal corporations. The PWA nature of the application ensures cross-device compatibility, allowing users to access the platform seamlessly from both mobile devices and desktop computers without the need for separate app store installations.")
    add_p(doc, "The Park Monitoring System represents a practical and innovative step towards sustainable urban governance. It not only simplifies the process of complaint reporting and park asset monitoring but also fosters collaboration between citizens and civic bodies. By leveraging digital technologies such as real-time notifications, geolocation tracking, and user-friendly interfaces, the system aims to reduce response time, increase accountability, and improve the overall quality of public parks. Ultimately, the project envisions a smart, healthy, and environmentally responsible Bengaluru, where technology and public participation work hand in hand to build a more sustainable urban future.")

    add_h2(doc, "1.3 Problem Statement")
    add_p(doc, "The growing population and rapid urbanization of Bengaluru have led to significant challenges in maintaining public recreational infrastructure and effective park management. Among these challenges, the frequent breakdown and deterioration of park facilities—such as broken play equipment, damaged benches, non-functioning solar lights, overflowing garbage bins, untrimmed vegetation, and unhygienic restrooms—have become a serious concern for both citizens and the Bruhat Bengaluru Mahanagara Palike (BBMP). These damaged park assets not only diminish the city's aesthetics but also create unsafe and unhygienic conditions, leading to potential injuries for children and senior citizens.")
    add_p(doc, "Currently, citizens have limited means to report park defects or track the progress of their complaints. Many complaints go unnoticed due to the absence of a unified digital platform that connects citizens directly with municipal authorities and maintenance agencies. Moreover, communication gaps between citizens, administrators, government officials, and contractors often cause duplication of efforts or unresolved issues. Traditional methods of complaint handling, which rely on manual paperwork, physical registers, and uncoordinated inspections, are time-consuming, prone to human error, and fail to ensure real-time updates.")
    add_p(doc, "There is a clear need for an integrated digital solution that enables timely reporting, transparent tracking, and efficient resolution of park-related complaints. A system that allows citizens to easily capture and submit live photographic evidence of park defects, while empowering BBMP officials and contractors to manage, assign, repair, and verify complaints in real time, can significantly improve park maintenance and operational efficiency.")
    add_p(doc, "To address these gaps, the proposed Park Monitoring System aims to create a centralized, interactive, and technology-driven platform. It will facilitate seamless communication among citizens, field officials, contractors, and administrators by providing features such as online complaint registration, live camera photo capture, GPS location mapping, automated email notifications, stall slot bookings, event management, and status tracking. By automating the complaint management process and enhancing public participation, this project intends to promote accountability, reduce response times, and support BBMP's mission toward cleaner, greener, and better-managed urban parks.")

    add_h2(doc, "1.4 Motivation")
    add_p(doc, "The rapid urbanization and population growth in Bangalore have led to a significant increase in the daily utilization of public parks. Unfortunately, this heavy usage has resulted in frequent maintenance issues, damaged amenities, and slow repair cycles across city parks. These unaddressed defects not only cause inconvenience and safety risks but also diminish the aesthetic appeal of neighborhoods and lower the overall quality of urban life. Despite various initiatives by local municipal bodies, the timely identification and resolution of park defects remain a major challenge due to the lack of real-time reporting mechanisms, limited transparency and tracking, inefficient communication between stakeholders, and lack of public engagement.")
    add_p(doc, "These challenges motivated the development of a technology-driven solution that not only bridges the communication gap but also empowers citizens, streamlines field operations, and supports administrators with real-time data and actionable insights.")

    add_h2(doc, "1.5 Significance of the Study")
    add_p(doc, "The proposed Park Monitoring System plays a crucial role in addressing one of the most pressing urban challenges faced by metropolitan cities like Bengaluru: the upkeep and effective maintenance of public parks and green spaces. With the rapid pace of urbanization, increasing population density, and expanding infrastructure, park asset management has become a major concern for the Bruhat Bengaluru Mahanagara Palike (BBMP). This study highlights the significance of leveraging modern digital technologies to enhance the efficiency, transparency, and accountability of municipal park management systems while empowering citizens to participate actively in maintaining a cleaner and safer park environment.")
    add_p(doc, "The study holds great societal significance as it fosters active citizen engagement in civic problem-solving. Traditionally, park maintenance in large cities has been viewed solely as a governmental responsibility, leading to communication gaps between citizens and municipal authorities. The introduction of this system transforms this dynamic by enabling citizens to take direct responsibility for their local parks. Through an intuitive PWA, citizens can easily capture live photos of damaged amenities, upload them with precise geolocation data, and submit detailed descriptions. This participatory model promotes civic awareness and a sense of ownership among residents, ensuring that local park issues are promptly reported and resolved. By bridging the gap between citizens and local authorities, the system builds trust and encourages collective responsibility towards environmental cleanliness.")
    add_p(doc, "From an administrative standpoint, this study provides an innovative solution for optimizing BBMP's operational workflow. The system replaces traditional manual reporting and record-keeping processes with a fully automated digital platform. Administrators can now efficiently manage user data, track complaints in real time, and assign tasks to maintenance contractors and field officials based on location and workload. The inclusion of automated notifications through email ensures continuous communication between citizens, field officers, contractors, and administrators, thereby minimizing delays and improving response times. The structured data collected from various complaints also supports data-driven decision-making, allowing BBMP to analyze trends, identify recurring problem areas, and develop long-term strategic park maintenance policies. Additionally, the system enables performance monitoring of contractors and field officials, ensuring accountability and improving overall service quality.")
    add_p(doc, "Technologically, this study demonstrates the potential of web-based applications in enhancing smart governance and urban sustainability. The Park Monitoring System integrates multiple modern technologies including live camera hardware capture, geolocation services, cloud-based databases, and real-time synchronization to create a responsive and scalable digital infrastructure. The use of Progressive Web App (PWA) technology ensures that the platform is accessible across all devices, even in areas with limited network connectivity, making it inclusive and reliable. The adoption of automated email alerts, photo uploads, and real-time status tracking reflects the adaptability of emerging technologies to real-world civic problems. This project, therefore, stands as a model example of how digital transformation can redefine public service delivery and foster greater transparency in municipal operations.")
    add_p(doc, "Environmentally, the system contributes significantly to promoting sustainability, biodiversity, and public health. Unattended park degradation not only diminishes the city's aesthetic appeal but also harms urban flora and fauna, creates safety hazards, and lowers overall urban livability. By ensuring quick identification and resolution of park defects, the system supports the city's broader environmental goals of preserving green cover and promoting healthy recreational spaces.")
    add_p(doc, "Overall, the significance of this study lies in its ability to combine technology, governance, and citizen participation to achieve sustainable urban development. The Park Monitoring System not only contributes to improving park management efficiency but also aligns with the broader vision of Smart Bengaluru, promoting cleaner surroundings, public awareness, and a culture of shared responsibility in city maintenance.")

    add_h2(doc, "1.6 Objectives")
    add_p(doc, "The primary objective of the Park Monitoring System is to design and develop a Progressive Web Application (PWA) that provides an effective digital platform for reporting, monitoring, and resolving park maintenance issues and facility defects within Bengaluru city. This project aims to assist the Bruhat Bengaluru Mahanagara Palike (BBMP) in achieving a cleaner, safer, and healthier park environment by integrating modern web technology with citizen participation and administrative efficiency. The system seeks to empower citizens by offering a simple and user-friendly interface through which they can register, log in, view park amenities, book stall slots, register for events, and report park complaints by capturing live photos, location details, and brief descriptions. It also enables real-time tracking of complaints so that users can monitor the progress and resolution status of their submissions, ensuring transparency and accountability. The inclusion of automated email notifications keeps citizens, field officials, contractors, and administrators informed about every stage of complaint handling, from registration to resolution.")
    add_p(doc, "For administrators, the project provides a centralized control panel to manage citizen accounts, officials, contractors, districts, corporations, zones, and wards. It allows them to assign complaints efficiently to contractors, monitor SLA deadlines, manage park assets, and oversee stall bookings and event registrations. The field officials and contractors, on the other hand, can use their dedicated modules to access assigned complaints, verify reported defects on-site, upload daily progress logs, submit material requests, upload proof of resolution, and maintain a digital record of their work.")
    add_p(doc, "Furthermore, the system aims to improve communication and coordination between all stakeholders—citizens, administrators, government officials, and contractors—by providing a unified digital platform. It supports data-driven decision-making through the storage of complaint histories and performance reports, which can be used for policy formulation and future planning. Overall, this project contributes to BBMP's vision of smart Bengaluru by leveraging modern web technologies to promote transparency, public involvement, and sustainable park management practices, ultimately working towards cleaner and better-maintained urban parks.")

    add_h2(doc, "1.7 Scope of the Project")
    add_p(doc, "The Park Monitoring System is designed to provide a comprehensive and technology-driven solution for addressing one of Bengaluru's most persistent urban challenges: the maintenance and upkeep of public parks and green spaces. With the rapid growth of the city's population and urban expansion, maintaining park amenities and ensuring proper maintenance workflows have become major concerns for both citizens and civic authorities. The project aims to bridge the gap between the BBMP and the citizens by introducing a digital platform that promotes transparency, accountability, and timely resolution of complaints related to park infrastructure.")
    add_p(doc, "This project proposes the development of a Progressive Web Application that functions as an interactive, user-friendly, and real-time park management system. It will enable users to report park defects directly from their mobile phones or computers, while allowing field officials, contractors, and administrators to monitor and act upon complaints efficiently. The system is envisioned as a scalable, secure, and reliable digital platform that supports BBMP's broader goal of transforming Bengaluru into a cleaner, greener, and more sustainable city.")

    add_h3(doc, "1.7.1 Functional Scope")
    add_p(doc, "The functional scope of the project is centered on four key modules: Citizens Module, Admin Module, Government Officials Module, and Maintenance Contractors Module, each playing an essential role in ensuring seamless communication and complaint resolution.")
    add_p(doc, "The Citizens Module focuses on empowering citizens by providing them access to an easy-to-use interface where they can register, log in, explore park directories with facility filters, book commercial stall slots with digital payments, register for community events, and report park complaints by capturing live photos, descriptions, and exact geolocation coordinates. Once a complaint is registered, users receive instant email notifications confirming submission and subsequent updates about the complaint's progress. They can also log in to their accounts at any time to check the live status of their complaints. This direct involvement of citizens ensures transparency, encourages civic responsibility, and builds trust between the public and the municipal authority.")
    add_p(doc, "The Admin Module serves as the core control unit of the system. Administrators can manage registered users, officials, and contractors, create and maintain records of districts, corporations, zones, and wards, manage park asset records, approve stall bookings, and assign complaints to appropriate contractors based on category and jurisdiction. They can track each complaint's progress against SLA timelines, update its status, and ensure timely resolution. The system also enables administrators to generate analytical reports for performance review, trend analysis, and policy planning. Automated email alerts are sent to both users and field staff whenever a complaint is assigned or resolved, ensuring that every stakeholder stays informed in real time.")
    add_p(doc, "The Government Officials and Contractors Modules are designed to support the operational and field execution side of park management. Through these modules, contractors can view assigned complaints, visit the reported park locations, log daily work progress with photos, request necessary raw materials, and upload resolved photos as proof of completion. Government officials can inspect the completed repairs, verify work authenticity, approve resolutions, or request rework if necessary. This digital workflow minimizes paperwork, speeds up communication, and improves accountability by maintaining a digital record of all activities performed by on-ground staff.")
    add_p(doc, "Together, these four modules ensure that the system functions as a complete end-to-end solution for park monitoring and facility management. The integrated design allows continuous communication among all stakeholders, thereby ensuring that no complaint goes unnoticed or unresolved.")

    add_h3(doc, "1.7.2 Technical and Operational Scope")
    add_p(doc, "The technical and operational scope of the Park Monitoring System extends across multiple dimensions, combining the power of modern web technologies with practical field operations. From a technical perspective, the system is developed as a Progressive Web Application (PWA) to ensure seamless performance across various platforms, including smartphones, tablets, and desktop computers, without the need for separate installations. The frontend of the application is built using React, Vite, HTML5, CSS3, JavaScript, and Bootstrap to provide an interactive, responsive, and visually appealing user interface. The backend is powered by Node.js and Express.js and integrated with a MongoDB database, which securely stores user data, park assets, complaints, stall bookings, event records, status updates, and administrative logs.")
    add_p(doc, "The application also incorporates advanced functionalities such as live camera capture and real-time geolocation tracking, which automatically captures the latitude and longitude of reported park complaints to help field staff accurately identify the location. Additionally, email notification services are integrated to automate communication between citizens, administrators, and field staff, ensuring that everyone stays informed about complaint updates. Security features such as password hashing with bcrypt, input validation, and role-based access control are incorporated into the system. The technical design ensures scalability, maintainability, and reliability, allowing it to be easily extended or customized for future smart city initiatives.")
    add_p(doc, "From an operational standpoint, the system is designed to be implemented citywide under the supervision of the BBMP. It will be actively used by four main stakeholders: citizens, government officials, contractors, and administrators, each having a defined role in the workflow. Citizens will use the platform to explore parks and submit complaints from anywhere using their internet-enabled devices, eliminating the need to visit BBMP ward offices physically. This makes the complaint reporting process faster, simpler, and more transparent. Field officials and contractors will access their mobile-responsive dashboards to view assigned tasks, verify issues on-site, and upload real-time updates and photographic evidence after resolving complaints. This digital process not only saves time but also enhances accountability in field operations. Administrators will utilize the system to monitor overall complaint trends, analyze performance reports, manage park resources efficiently, and ensure timely follow-up on unresolved issues.")
    add_p(doc, "The system's operational scope also includes periodic maintenance, software updates, and database backups to ensure continuous availability and security. Moreover, the centralized digital approach reduces paperwork, eliminates communication delays, and improves workflow efficiency across departments. In the long run, this system can serve as a model for other municipalities and urban local bodies seeking to adopt digital solutions for public park monitoring and recreational asset management.")

    add_h2(doc, "1.8 Features")
    add_p(doc, "This application is designed as a comprehensive and technology-driven application that enhances the efficiency of park management under the BBMP. The system integrates modern web technologies, location intelligence, live camera capture, and automation to create a seamless communication link between citizens, administrators, field officials, and maintenance contractors. It offers a range of innovative features that ensure real-time complaint tracking, transparency, and improved service delivery.")
    add_p(doc, "The system is developed as a Progressive Web Application (PWA), ensuring that users can access it directly from any device—mobile, tablet, or desktop—without the need for separate installation. It provides an app-like experience with offline accessibility, home-screen installation, and responsive performance across all screen resolutions.")
    add_p(doc, "A secure registration and login mechanism is provided for all users. Each account is password-protected using bcrypt encryption to ensure data privacy and system security. Role-based access control ensures that citizens, administrators, government officials, and contractors can access only their relevant functionalities and modules.")
    add_p(doc, "Citizens can report park defects conveniently by capturing live photographs through their device camera, providing a short description, and automatically capturing their current GPS coordinates. The live camera capture constraint ensures that the exact, authentic evidence of the damaged park amenity is recorded accurately for quick response and action, eliminating fake gallery uploads.")
    add_p(doc, "The system uses geolocation services to fetch and record the latitude and longitude of reported complaints, ensuring precision in identifying damaged facilities inside sprawling parks and helping field staff reach the exact spot easily.")
    add_p(doc, "The system automatically sends real-time email notifications to users, administrators, and field staff during key stages of the complaint cycle—such as submission, assignment, progress updates, and final resolution. This promotes transparency and keeps all stakeholders informed throughout the redressal process.")
    add_p(doc, "Every registered complaint can be tracked in real time. Users can check whether their issue is pending, assigned, in progress, under inspection, or resolved, promoting accountability and transparency in park maintenance.")
    add_p(doc, "Both citizens and contractors can upload images before and after maintenance activities. This visual documentation enhances the authenticity of reports and ensures that each complaint resolution is supported with verifiable evidence.")
    add_p(doc, "The system features a structured MongoDB database to manage all data related to users, parks, complaints, districts, corporations, zones, wards, stall bookings, and events. This centralized data storage ensures consistency, reliability, and efficient retrieval of records for analysis and reporting.")
    add_p(doc, "The dashboard provides a real-time overview of system activities, including the number of complaints submitted, resolved, and pending. It supports search and filter options to help manage data efficiently and provides statistical summaries for administrative decision-making.")
    add_p(doc, "The system generates analytical reports to help administrators evaluate complaint trends, response times, official performance, and contractor efficiency.")
    add_p(doc, "Complaints can be assigned to contractors and officials based on park location, category, and workload. The assigned staff receive instant notifications, ensuring timely action, SLA compliance, and efficient task distribution.")
    add_p(doc, "Citizens and local vendors can view available park stall slots, choose specific dates, fill applicant details, and book commercial stall spaces with integrated payment tracking. Additionally, users can register for community and environmental events organized in parks.")

    doc.save(os.path.join(OUTPUT_DIR, "01_Chapter_1_Introduction.docx"))
    print("Generated: 01_Chapter_1_Introduction.docx")

# -------------------------------------------------------------
# 02. CHAPTER 2: LITERATURE REVIEW
# -------------------------------------------------------------
def generate_chapter_2():
    doc = create_base_doc("Chapter 2 - Literature Review")
    add_h1(doc, "2. LITERATURE REVIEW")
    
    add_h2(doc, "2.1 Introduction:")
    add_p(doc, "A literature review is a critical summary and analysis of existing research, studies, and publications related to a particular topic. It helps to understand what has already been explored, identify gaps in knowledge, and provide a foundation for designing and justifying our own project. By reviewing previous work, a literature review highlights effective methodologies, challenges faced, and solutions proposed by other researchers. It also demonstrates how our project contributes to the existing body of knowledge and addresses unmet needs.")

    add_h2(doc, "2.2 Result Analysis:")
    add_p(doc, "As urban populations expand rapidly, cities are struggling with effective public infrastructure maintenance and green space upkeep, prompting research into intelligent systems for monitoring and streamlining municipal services. Several recent studies have explored IoT- and sensor-based architectures for smart municipal asset management, demonstrating the effectiveness of continuous telemetry and automated operational decision-making. Sheng et al. [1] presented a LoRa-enabled IoT system integrated with deep learning models to monitor municipal infrastructure across urban zones. This system automatically detects infrastructure damage and optimizes maintenance routes based on real-time data, significantly reducing operational delays and resource wastage. Similarly, Henaien et al. [8] proposed a scalable IoT-based architecture for sustainable public asset management, integrating cloud-based dashboards with smart sensors to automate monitoring and predictive maintenance. These systems provide continuous surveillance and can proactively detect facility breakdown in high-traffic public parks. Compared to these IoT-heavy approaches, your PWA-based Park Monitoring System relies primarily on citizen-initiated reporting, which is low-cost, scalable, and requires minimal physical sensor infrastructure. While it does not automatically detect every facility defect, it leverages the city's residents as distributed sensors, ensuring that real-time reporting can occur from any park location, including areas where physical sensor deployment may be challenging or cost-prohibitive. The literature suggests that combining selective sensor deployments at high-priority parks with your PWA's citizen reports could create a hybrid system that maximizes coverage while maintaining cost efficiency.")
    add_p(doc, "Another area of research focuses on image-based and machine learning approaches for defect detection and asset categorization. Majchrowska et al. [2] developed deep learning models capable of detecting and categorizing infrastructure defects in both urban and natural environments, achieving high accuracy using convolutional neural networks. Ren et al. [3] proposed an MRS-YOLO model, a variant of YOLO optimized for high-precision detection of municipal facility damage in real-time. Jin et al. [12] similarly explored deep learning for urban infrastructure classification, demonstrating that automated systems could support operational decision-making and reduce manual verification workload. Your PWA already collects live camera images of park complaints, providing a valuable dataset for future machine learning integration. By gradually introducing an automated image verification system, the administration could reduce false reports, speed up complaint assignment, and provide quantitative assessments of each complaint's severity. The literature emphasizes that image-based verification, when combined with a human-in-the-loop workflow, provides a practical balance between automation and reliability, a model your PWA could adopt in subsequent phases.")
    add_p(doc, "Remote sensing, UAV-based surveillance, and GIS analysis have also emerged as powerful tools for urban park and green space management. Youme et al. [4] demonstrated the use of UAV imagery and deep learning for detecting damaged infrastructure in urban areas, while Dabholkar and Muthiyan [5] proposed automated mapping of civic defects using aerial orthophotos. Du et al. [11] applied GIS-based spatial modeling to assess and predict infrastructure breakdown risks, producing risk maps that allow municipal authorities to prioritize repair operations. These approaches excel in macro-level surveillance, enabling rapid identification of large-scale park degradation and strategic planning. However, they require technical expertise, high-resolution imagery, and periodic aerial flights. In contrast, your PWA provides precise ground-level evidence, including user-uploaded live photos, descriptions, and GPS coordinates, ensuring that every reported park defect is verified and traceable. Integrating PWA data with GIS mapping layers enhances hotspot prioritization and resource allocation, providing a city-wide operational perspective that complements citizen-level reporting.")
    add_p(doc, "Crowdsourced reporting and citizen engagement form another critical component of effective urban green governance. Studies such as the 2025 crowdsourced monitoring project [10] and Kannan [7] highlight the benefits of engaging residents as distributed sensors to detect and report public facility problems in real time. These works emphasize transparency, timely feedback, and clear workflows to ensure trust and sustained participation. Your PWA implements these principles through structured complaint forms, live captured images, admin-module complaint assignments, contractor progress logging, field-official verification, and automated email notifications. By closing the feedback loop between citizens, field officials, contractors, and administrators, the system enhances accountability and encourages active citizen involvement. The literature also underscores potential challenges, including false reporting, administrative overload, and data privacy concerns. Solutions suggested in prior work include introducing automated verification mechanisms, mandatory live camera capture, and clear data governance policies—approaches that are directly adapted in your PWA to strengthen its operational integrity.")
    add_p(doc, "The synthesis of these research strands highlights the complementary strengths and potential improvements for your PWA. Strengths include its low-cost deployment, wide scalability via citizen participation, transparency through real-time updates and notifications, and the capacity to generate actionable datasets for further analytics. Gaps identified in the literature include limited automation for image verification, lack of continuous proactive monitoring, the need for optimized complaint assignment workflows, and attention to data privacy. Integrating machine learning models for image verification (drawing on approaches from [2], [3], and [12]) could reduce administrative workload while maintaining accuracy. Similarly, selective IoT deployments or GIS monitoring in identified high-density park zones (as suggested by [1], [4], and [11]) could complement citizen reporting and enable proactive park maintenance. Introducing predictive analytics based on historical PWA reports can assist administrators in forecasting parks at risk of recurring equipment failure, further improving operational efficiency.")
    add_p(doc, "Moreover, the literature recommends measuring quantitative performance metrics to evaluate system effectiveness, including reporting rate, assignment latency, resolution latency, verification accuracy, user satisfaction, and reduction of recurring park defects. Implementing dashboards that capture these metrics aligns your PWA with smart city governance best practices and provides empirical evidence for policy-making and operational decisions. This approach also enables continuous improvement of the system, allowing administrators to refine workflows, optimize contractor resource allocation, and identify park assets that require preventive interventions.")
    add_p(doc, "Finally, integrating lessons from the literature supports a phased, research-informed evolution of your system. The initial PWA deployment focuses on citizen-driven reporting, live camera capture, contractor repair tracking, and official verification, while future stages could introduce automated image triage, IoT sensor integration, GIS-based hotspot mapping, and predictive analytics. By combining these technological and procedural enhancements, your PWA can transform into a comprehensive, scalable, and efficient urban park management platform. This trajectory aligns with global trends in smart city governance, demonstrating a citizen-centric, technology-driven approach to maintaining public green spaces and enhancing public health and environmental quality.")
    add_p(doc, "The surveyed literature confirms that your PWA-based Park Monitoring System is well-aligned with contemporary research on smart municipal governance. While IoT, ML, and remote sensing approaches offer automation and large-scale surveillance, they often require high costs, specialized expertise, and physical infrastructure. Our system's focus on low-cost, citizen-driven reporting, live photo enforcement, real-time tracking, structured contractor workflows, and transparent feedback provides a practical and immediately deployable solution. By leveraging insights from prior work, your system can be extended with machine learning, GIS analysis, and selective sensor deployments, thereby enhancing efficiency, predictive capability, and strategic operational planning. Collectively, this research-informed approach ensures that your PWA contributes meaningfully to cleaner, safer, and more sustainable park environments.")

    add_h2(doc, "2.3 Identified gaps in the Literature")
    add_p(doc, "Most existing public infrastructure management systems are too costly because they depend heavily on dedicated IoT sensors, smart hardware, or drone surveillance. These technologies are not affordable or practical for deployment across all municipal community parks in developing cities.")
    add_p(doc, "There are very few citizen-based systems that allow people to easily report park amenity defects using their mobile browsers. Most existing studies focus only on automated sensor detection and ignore public civic participation.")
    add_p(doc, "Current systems do not connect citizens, contractors, and authorities effectively. Many research works focus only on initial data collection but neglect the operational process of dispatching tasks, updating progress, verifying repairs on-site, and closing complaints.")
    add_p(doc, "Many smart city systems work in silos without integration. For example, asset inventory records, public stall bookings, event registrations, and maintenance complaints are managed on separate disconnected systems rather than in a unified platform.")
    add_p(doc, "There is a lack of live photo verification in most civic reporting systems. Many applications permit uploading pre-saved images from the phone gallery, leading to fraudulent, duplicate, or outdated complaints.")
    add_p(doc, "Predictive analysis and spatial mapping are rarely utilized in municipal park administration. Most systems only log current issues and do not analyze historical ticket trends to optimize maintenance schedules or contractor performance.")
    add_p(doc, "There is limited focus on multi-stakeholder operational transparency. Existing municipal platforms do not provide dedicated mobile-friendly interfaces for maintenance contractors and field inspectors to log daily progress.")
    add_p(doc, "Existing systems often lack proper evaluation methods. They measure technical server uptime but fail to capture real operational metrics such as complaint resolution speed, SLA compliance rates, or citizen satisfaction.")
    add_p(doc, "Offline accessibility and PWA support are frequently missing. Many municipal web applications require continuous high-speed internet access and break on poor mobile connectivity, creating barriers for field workers.")

    add_h2(doc, "2.4 Existing System")
    add_p(doc, "In the existing scenario, park maintenance and grievance redressal in cities like Bengaluru still depend heavily on manual reporting, paper registers, and informal communication. Citizens usually inform the BBMP about broken park facilities, play equipment damage, or sanitation issues through phone calls, in-person visits to ward offices, or generic social media posts, which often go unnoticed, lost, or delayed. There is no centralized digital platform to track park complaints, monitor repair timelines, verify contractor cleanups with photographic proof, or manage park asset inventories across wards.")
    add_p(doc, "Research studies show that while some municipal bodies are experimenting with IoT-based systems or dedicated sensor technologies to monitor public assets automatically, these systems require high capital costs, complex physical installations, and continuous battery maintenance, making them difficult to implement across all neighborhood parks. Furthermore, existing systems lack structured citizen involvement, live camera verification, and real-time email feedback mechanisms, which are crucial for quick and accountable action.")
    add_p(doc, "Thus, the current system faces severe challenges such as delayed response times, poor inter-departmental coordination, lack of photographic proof, no SLA tracking, and no centralized database for analytical decision-making.")

    add_h2(doc, "2.5 Proposed System")
    add_p(doc, "The proposed Park Monitoring System aims to overcome these limitations by introducing a Progressive Web Application (PWA) that combines citizen participation with smart digital monitoring and multi-stakeholder workflow coordination. Unlike expensive IoT-only models, this system focuses on low-cost, scalable citizen-driven reporting paired with structured contractor and official management.")
    add_p(doc, "Citizens can easily report damaged park amenities by capturing live photos through their device camera, fetching GPS location coordinates, and providing short descriptions. The system automatically sends email alerts, assigns complaints to contractors and officials based on park jurisdiction, and allows real-time status tracking through centralized dashboards. Contractors log progress and upload completion proofs, while government officials verify the repairs on-site. This PWA also creates a structured database of parks, complaints, stall bookings, and events that can be utilized for analytical reporting and administrative planning. By doing so, it bridges the gap between manual legacy systems and modern smart city governance.")
    add_p(doc, "Overall, the proposed system provides an affordable, transparent, and participatory solution for urban park management, aligning with global smart city and sustainable development goals. It enhances operational efficiency, accountability, and collaboration between citizens, field officials, contractors, and municipal administrators.")

    doc.save(os.path.join(OUTPUT_DIR, "02_Chapter_2_Literature_Review.docx"))
    print("Generated: 02_Chapter_2_Literature_Review.docx")

# -------------------------------------------------------------
# 03. CHAPTER 3: SYSTEM ANALYSIS
# -------------------------------------------------------------
def generate_chapter_3():
    doc = create_base_doc("Chapter 3 - System Analysis")
    add_h1(doc, "3. SYSTEM ANALYSIS")
    
    add_h2(doc, "3.1 Introduction:")
    add_p(doc, "Urban green space maintenance and municipal park infrastructure upkeep have emerged as major civic challenges in metropolitan cities like Bengaluru. Despite regular budgetary allocations, numerous park facilities continue to deteriorate due to unreported equipment damage, delayed contractor repairs, inefficient on-ground monitoring, and a lack of timely coordination between citizens, field staff, and administrative authorities. The manual process of complaint handling through paper ledgers often leads to delays, data loss, and poor accountability. Moreover, citizens have limited visibility into the progress or resolution of their complaints, resulting in reduced trust in civic governance. Therefore, there is a strong need for a smart, digital, and transparent solution that allows real-time reporting, tracking, and resolution of park-related issues while enhancing communication between all stakeholders involved.")

    add_h3(doc, "3.1.1 Purpose:")
    add_p(doc, "The main purpose of this project is to design and develop a Progressive Web Application (PWA) that enables effective park monitoring and management under the BBMP. The system aims to empower citizens to actively participate in keeping their neighborhood parks clean, functional, and safe by allowing them to report park defects with live camera photos, location coordinates, and descriptions. At the same time, it provides administrators, government officials, and contractors with an efficient digital platform to manage park assets, assign complaints, track repairs against SLA timelines, review before/after proof, and verify resolutions in real time. The integration of automated email notifications, complaint tracking, stall slot bookings, event management, and digital records ensures transparency, accountability, and improved operational efficiency. Ultimately, the project supports the vision of smart governance and sustainable urban green management through technology and citizen collaboration.")

    add_h3(doc, "3.1.2 Scope:")
    add_p(doc, "The scope of this project encompasses the development of a Progressive Web Application (PWA) designed to streamline the process of reporting, monitoring, and maintaining urban public parks within Bengaluru city under the jurisdiction of the BBMP. The system provides a unified digital platform connecting citizens, field officials, maintenance contractors, and administrators to ensure efficient communication and real-time action. Citizens can easily register, log in, explore park amenities, book stall spaces, register for events, and report park defects by capturing live camera images and sharing GPS location details, while also tracking the live status of their complaints. Administrators can manage citizens, officials, contractors, complaints, districts, corporations, zones, and wards, as well as assign and monitor complaint resolutions through a centralized dashboard. Field officials and contractors, on the other hand, can view assigned tasks, verify locations, log daily progress, upload proof of resolution, and submit material requests for administrative review. Additionally, the system integrates automated email notifications to keep users and field staff informed about complaint updates and resolutions, ensuring transparency and accountability. This project is designed to be scalable, allowing future enhancements such as IoT-based irrigation sensors, AI-driven visual defect classification, and predictive maintenance analytics for better decision-making and urban park management.")

    add_h2(doc, "3.2 Overall Description:")
    add_p(doc, "The Park Monitoring System is a Progressive Web Application (PWA) developed to support the Bruhat Bengaluru Mahanagara Palike (BBMP) in managing urban parks and green recreational spaces more effectively. The system provides a centralized digital platform for citizens, field officials, contractors, and administrators to report, repair, verify, and resolve damaged park infrastructure. The application bridges the gap between the public and BBMP staff by ensuring real-time reporting, transparency, and accountability. Citizens can capture live images, record location details, explore amenities, book stall slots, and submit complaints through an intuitive mobile-friendly interface. Contractors can view work orders, submit progress updates, and upload completion proofs. Field officials can verify the repairs on-site and approve work quality, while administrators can monitor performance, assign tasks, track SLA compliance, and analyze city-wide trends.")

    add_h3(doc, "3.2.1 Product Perspective:")
    add_p(doc, "The proposed application contains easy graphical interfaces tailored for all types of users. It contains structured MongoDB databases which eliminate data duplication and simplify record retrieval. This is a responsive web application that adjusts seamlessly across any platform—smartphones, tablets, and desktop computers. The product is a self-contained, enterprise-grade web application that provides authenticated role-based access to ensure security, data integrity, and privacy.")
    add_p(doc, "It also provides clean and intuitive user interfaces that make the system user-friendly, as well as active, dedicated workspaces for each user role with comprehensive management functions.")

    add_h3(doc, "3.2.2 Product Features:")
    add_p(doc, "The system incorporates a secure authentication system with role-based access for Citizens, Field Officials, Contractors, and Admin. It allows users to report park defects with mandatory live camera capture, automatic GPS location coordinates, and descriptions. It provides an interactive park directory with facility filters, stall booking management with digital payment tracking, community event registrations, and citizen feedback submission. For administrators, it delivers a centralized control panel to manage complaints, master geographic hierarchies, park inventories, contractor allocations, and analytical reports. It enables contractors and field officials to view assigned tasks, log progress, upload proof of completion, submit material requests, and close verified complaints with automated email alerts for every milestone.")

    add_h3(doc, "3.2.3 User Characteristics")
    add_p(doc, "The system is designed for four primary user groups. Citizens represent the general public who visit parks and report damaged amenities using mobile or desktop browsers, requiring basic smartphone usage skills. Government Officials are municipal ward engineers and inspectors responsible for inspecting, verifying, and approving completed repairs on-site. Contractors are authorized maintenance agencies who accept work orders, log daily repair progress, and upload completion proofs. Administrators are municipal supervisors who monitor city-wide operations, assign tasks, track SLA metrics, and analyze performance reports, requiring intermediate to advanced administrative and technical skills.")

    add_h3(doc, "3.2.4 General Constraints:")
    add_p(doc, "The primary constraints include verifying the authenticity of reported complaints on-site, which is addressed through mandatory live camera capture and automatic GPS coordinate fetching. The developed system runs across all modern operating systems (Windows, Linux, macOS, Android, iOS) that contain standard web browsers supporting modern JavaScript and Progressive Web App standards.")

    add_h3(doc, "3.2.5 Assumptions and Dependencies:")
    add_p(doc, "The system assumes that users have access to internet-enabled devices equipped with GPS and camera functionality, and that they provide valid contact details for communication and notifications. Its effective operation depends on stable internet connectivity, accurate GPS signals, reliable email SMTP service integration, and the active participation of both citizens and civic staff to ensure timely reporting, repair, and verification of park complaints.")

    add_h2(doc, "3.3 Specific Requirements:")
    add_h3(doc, "3.3.1 External Interface Requirements:")
    add_p(doc, "All interactions of the software with different users, hardware, and other software systems are specified here. The Park Monitoring System is designed to be simple, intuitive, and responsive.")
    add_p(doc, "User Interface: The system provides a clean, user-friendly graphical interface tailored for each role—vibrant public portal for citizens, olive sage green theme for officials, and professional dark theme for administrators. Appropriate error and success messages are generated using responsive SweetAlert2 dialogs whenever users perform valid or invalid operations.")

    add_h3(doc, "3.3.1.2 Hardware Interface:")
    add_p(doc, "Client-side requirements include any device with a modern multi-core processor, 2 GB RAM or higher, integrated camera, GPS sensor, and 100 MB free storage. Server-side requirements include a 64-bit cloud processor (2.4 GHz or higher), minimum 4 GB RAM (8 GB recommended), and 20 GB SSD storage.")

    add_h3(doc, "3.3.1.3 Software Interface:")
    add_p(doc, "The Frontend is built using React 19, Vite, HTML5, CSS3, JavaScript ES6+, Bootstrap 5, Leaflet.js, and Recharts. The Backend is built using Node.js, Express.js, and Mongoose ODM. The Database is powered by MongoDB Atlas / Server.")

    add_h3(doc, "3.3.1.4 Communication Interface:")
    add_p(doc, "This is a Progressive Web Application and communication is conducted over secure HTTP/HTTPS and WebSocket protocols over the internet.")

    add_h2(doc, "3.4 Functional Requirements:")
    add_h3(doc, "3.4.1 Citizens Module:")
    add_p(doc, "This module is designed for citizens who explore parks, book stall slots, register for events, raise park complaints, and track their resolution status. It enables active community participation in improving park cleanliness and functionality.")
    add_p(doc, "Registration: Allows new citizens to create an account by providing basic details such as name, mobile number, address, email, and password, ensuring secure access and authentication.")
    add_p(doc, "Login: Provides secure access to registered users by verifying their credentials and issuing JWT session tokens.")
    add_p(doc, "Profile: Displays and allows editing of user information including name, phone number, email address, and profile photo.")
    add_p(doc, "Park Directory: Allows users to search and browse parks across zones and wards, view facility matrices, and inspect park photos.")
    add_p(doc, "Raise Complaints: Enables citizens to report park defects by taking live photos through their camera, adding descriptions, selecting categories, and automatically capturing GPS latitude and longitude coordinates.")
    add_p(doc, "Check Status: Allows users to monitor the live progress of their submitted complaints from submission through contractor repair and official verification.")
    add_p(doc, "Stall Bookings: Enables vendors and citizens to view available stall slots in parks, select dates, fill applicant details, and track booking approvals.")
    add_p(doc, "Events: Allows citizens to browse upcoming eco-events and register attendee tickets.")

    add_h3(doc, "3.4.2 Admin Module:")
    add_p(doc, "The admin module serves as the central control panel for managing users, officials, contractors, complaints, master geographic data, stall bookings, and event registrations. It ensures smooth coordination among all system stakeholders.")
    add_p(doc, "Admin Login: Provides secure authentication for administrators to access the backend dashboard and management tools.")
    add_p(doc, "Dashboard & Reports: Displays real-time statistical summaries and allows administrators to generate analytical and performance reports based on complaint trends, ward-wise data, and contractor activity.")
    add_p(doc, "Complaint Management: Enables admin to view, assign, or reassign complaints to contractors and officials, monitor SLA deadlines, and track resolution timelines.")
    add_p(doc, "User & Official Management: Manages registered citizens, field officials, and contractors, including account approvals and access control.")
    add_p(doc, "Masters Module: Manages the system's geographic hierarchy including Districts, Corporations, Zones, and Wards.")
    add_p(doc, "Park Management: Allows adding, editing, bulk uploading (CSV), and exporting park asset records with complete amenity configurations.")
    add_p(doc, "Stall & Event Management: Manages stall slot matrices, approves booking applications, and monitors event registrations.")

    add_h3(doc, "3.4.3 Government Officials Module:")
    add_p(doc, "This module is designed for civic ward engineers and inspectors responsible for inspecting parks and verifying completed repairs.")
    add_p(doc, "Official Login: Provides secure login access for field officials to view and manage tasks assigned within their jurisdiction.")
    add_p(doc, "Inspection Schedule: Displays daily scheduled park rounds and active complaints on interactive maps.")
    add_p(doc, "Verify Work: Allows officials to inspect contractor before/after photographic proof, verify repairs on-site, approve resolutions, or request rework.")
    add_p(doc, "Complaint History: Maintains a record of all previously inspected and verified complaints for administrative auditing.")

    add_h3(doc, "3.4.4 Maintenance Contractors Module:")
    add_p(doc, "This module is designed for maintenance agencies responsible for executing physical repairs on park amenities.")
    add_p(doc, "Contractor Login: Provides secure authentication for contractors to access their task boards.")
    add_p(doc, "Task Board: Lists all active repair orders assigned to the contractor with SLA countdown timers and location details.")
    add_p(doc, "Progress Logging: Allows contractors to log milestone updates, upload timestamped progress photos, and submit work completion proofs.")
    add_p(doc, "Material Requests: Enables contractors to submit requisitions for spare parts, seeds, and equipment for admin approval.")

    add_h2(doc, "3.5 Performance Requirements:")
    add_p(doc, "The application requires an active internet connection, operates efficiently with minimal device memory, ensures fast API response times under 200ms, and provides robust error handling to remain error-free during continuous operation.")

    add_h2(doc, "3.6 Design Constraints:")
    add_p(doc, "All form inputs are validated on both client and server sides with informative error messages. Details provided during registration and booking are securely stored in the database. Mandatory fields such as live camera photos, category, and GPS coordinates must be filled before submission, preventing incomplete submissions.")

    add_h2(doc, "3.7 Other Requirements:")
    add_p(doc, "Reliability is maintained through strict input validation to avoid erroneous submissions. Portability allows the application to run smoothly across any modern operating system and web browser. Compatibility ensures real-time synchronization of complaint data as updates occur. Timeliness guarantees fast execution of workflows with minimal latency. Security restricts unauthorized users from accessing protected administrative or contractor functions.")

    add_h2(doc, "3.8 Safety Requirements:")
    add_p(doc, "In case a user forgets their password, a secure password recovery mechanism is provided via email OTP verification. Role-based authorization strictly verifies user entities before granting access to sensitive management features.")

    add_h2(doc, "3.9 Security Requirements:")
    add_p(doc, "The proposed application is a secure Progressive Web Application. Users must authenticate to access protected features. Passwords are encrypted using bcrypt, session tokens are signed with JWT, and API routes are secured against unauthorized access.")

    doc.save(os.path.join(OUTPUT_DIR, "03_Chapter_3_System_Analysis.docx"))
    print("Generated: 03_Chapter_3_System_Analysis.docx")

# -------------------------------------------------------------
# 04. CHAPTER 4: DESIGN AND METHODOLOGY
# -------------------------------------------------------------
def generate_chapter_4():
    doc = create_base_doc("Chapter 4 - Design and Methodology")
    add_h1(doc, "4. DESIGN AND METHODOLOGY")
    
    add_h2(doc, "4.1 System Design:")
    add_p(doc, "System design is a primary phase of software development that aims to identify and structure the modules that should constitute the system. Design is the first step in translating requirements into a functional software product. It may be defined as “the process of applying various techniques and principles for the purpose of defining a device, process, or system in sufficient detail to permit its physical realization.” The specification of these modules and how they interact with each other represents the desired result. The goal of the design process is to produce a technical blueprint of the system that can be used to construct the software. It represents the plan for the solution, incorporating requirement specifications and architectural solutions. In system design, careful attention is given to determining which components are implemented in the software.")

    add_h3(doc, "4.1.1 Functional Decompositions:")
    add_p(doc, "The Citizens Module is designed to empower citizens to actively participate in maintaining urban park infrastructure by allowing them to report and track facility complaints. Through this module, citizens can register by providing essential details such as name, mobile number, address, email, and password to ensure secure access and authentication. Once registered, users can log in to view their profile, explore parks and amenities, book commercial stall slots with digital payment tracking, and register for community events. The system enables citizens to raise complaints by capturing live photos through their device camera, adding descriptions, and automatically recording location details like latitude and longitude, which are then directed to administrators and contractors for resolution. Additionally, users can check the real-time status of their complaints, view detailed complaint information, and track updates until the issue is resolved, ensuring transparency and engagement in park upkeep.")
    add_p(doc, "The Admin Module serves as the central management system, overseeing users, field officials, contractors, complaints, park asset records, stall bookings, and geographic data such as districts, corporations, zones, and wards. It provides secure login access for administrators to manage backend operations efficiently. Admins can generate analytical reports to monitor complaint trends, contractor performance, and ward-wise activities, aiding in data-driven decision-making. The complaint management feature allows viewing, assigning, or reassigning complaints to contractors while tracking SLA progress. The user management module helps manage registered citizens, contractors, and officials, including access control and status monitoring. Furthermore, the Masters Module organizes geographic data by managing districts, corporations, zones, and wards, ensuring precise spatial mapping.")
    add_p(doc, "The Government Officials Module supports civic staff responsible for inspecting parks and verifying resolved complaints. After secure login, officials can access their profiles, view assigned inspection schedules, review contractor repair proofs, and update complaint statuses. They can also verify citizen-reported defects on-site, approve resolutions, or request rework, maintaining a complete record of verified cases in the history section to ensure accountability.")
    add_p(doc, "The Maintenance Contractors Module empowers authorized maintenance agencies to execute repair tasks efficiently. Contractors can log in, view assigned repair tickets, submit daily work progress logs with photos, request necessary raw materials, and upload completion proofs to ensure timely action and transparent service delivery.")

    add_h3(doc, "4.1.2 Description of programs:")
    add_h3(doc, "4.1.2.1 Use Case Diagram")
    add_p(doc, "A Use Case Diagram is a type of behavioral diagram in the Unified Modeling Language (UML) that visually represents the interactions between users (called actors) and the system. It helps to capture the functional requirements of a system and provides a clear understanding of what the system is supposed to do from the user's perspective.")

    # Table of Use Case Notations
    table_uc = doc.add_table(rows=1, cols=3)
    table_uc.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table_uc.rows[0].cells
    hdr[0].text = "Symbol / Name"
    hdr[1].text = "Element Name"
    hdr[2].text = "Description"
    for c in hdr:
        c.paragraphs[0].runs[0].font.bold = True
        set_cell_background(c, "E2E8F0")

    uc_notations = [
        ("Actor", "Actor", "A person, system, or external entity that interacts with the system (Citizen, Admin, Official, Contractor)."),
        ("Ellipse", "Use Case", "Represents a distinct function or action performed by the system."),
        ("Rectangle", "System Boundary", "Defines the scope of the system and contains all internal use cases."),
        ("Solid Line", "Association", "Connects actors to use cases, indicating an active interaction."),
        ("<<include>>", "Include Relationship", "Indicates that the execution of a base use case unconditionally includes another use case."),
        ("<<extend>>", "Extend Relationship", "Shows optional or conditional behavior that extends a base use case under specific triggers.")
    ]
    for n in uc_notations:
        r = table_uc.add_row().cells
        r[0].text = n[0]
        r[1].text = n[1]
        r[2].text = n[2]

    add_p(doc, "\nTable 4.1.2.1: Notations used in the Use Case Diagram\n")
    add_p(doc, "In the Citizen Module Use Case (Fig. 4.1.2.1.1), the Citizen actor interacts with Registration, Login, Profile, Park Directory, Raise Complaint, Check Status, Stall Bookings, and Event Registrations. In the Admin Module Use Case (Fig. 4.1.2.1.2), the Admin actor interacts with Login, Reports, Complaint Management (Assign, Reassign, SLA Tracking), Masters (Districts, Corporations, Zones, Wards), Park Asset Setup, User Management, Stall Management, and Broadcast Announcements. In the Field Staff Use Case (Fig. 4.1.2.1.3), the Official and Contractor actors interact with Login, Task Board, Progress Update, Material Requests, On-site Inspection, and Work Verification.")

    add_h3(doc, "4.1.2.2 Context Flow Diagram (CFD)")
    add_p(doc, "In the Context Flow Diagram (Level-0 DFD), the entire system is considered as a single central process: “Park Monitoring System”. The CFD illustrates the high-level inputs and outputs flowing between the system and its external entities.")
    add_p(doc, "Citizens provide user registration data, live complaint photos with GPS coordinates, stall booking requests, and event registrations, while receiving ticket status updates, booking receipts, and email notifications. Administrators supply master geographic setups, park configurations, task allocations, and announcements, while receiving real-time complaint analytics, SLA alerts, and contractor performance logs. Government Officials provide inspection reports, verification decisions, and rework requests, while receiving assigned park complaint queues. Contractors submit daily progress updates, completion proofs, and material requisitions, while receiving assigned repair work orders.")

    add_h2(doc, "4.2 Detailed Design:")
    add_p(doc, "Detailed design is the second level of the design process. During detailed design, we specify how the modules in the system interact with each other and the internal logic of each module is decided, which is why it is also referred to as logic design. Detailed design expands the system architecture and database design to contain a comprehensive description of the processing logic, data structures, and algorithms so that the design is sufficiently complete for coding.")

    add_h3(doc, "4.2.1 Data Flow Diagram (DFD)")
    add_p(doc, "A Data Flow Diagram shows the flow of data through the system. Data Flow Diagrams are also called Data Flow Graphs. It views a system as a function that transforms inputs into desired outputs, capturing the internal transformations that take place as data flows from sources to destinations and data stores.")

    # Table of DFD Notations
    table_dfd = doc.add_table(rows=1, cols=3)
    table_dfd.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table_dfd.rows[0].cells
    hdr[0].text = "Symbol"
    hdr[1].text = "Name"
    hdr[2].text = "Description"
    for c in hdr:
        c.paragraphs[0].runs[0].font.bold = True
        set_cell_background(c, "E2E8F0")

    dfd_notations = [
        ("Circle / Oval", "Process", "Performs transformation of data from one state to another."),
        ("Rectangle", "External Entity (Source/Sink)", "Represents external entities that input data or receive system outputs."),
        ("Directed Arrow", "Data Flow", "Represents the directional movement of data packets between processes, entities, and stores."),
        ("Open Rectangle / Parallel Lines", "Data Store", "Represents database collections or storage files where data is held persistently.")
    ]
    for d_item in dfd_notations:
        r = table_dfd.add_row().cells
        r[0].text = d_item[0]
        r[1].text = d_item[1]
        r[2].text = d_item[2]

    add_p(doc, "\nTable 4.2.1: Notations used in the Data Flow Diagram\n")
    add_p(doc, "In the Citizens Module DFD (Fig. 4.2.1.1), citizen inputs flow into the Registration process (storing records in the Users Collection), Profile Management, Raise Complaint process (capturing live photos and GPS coordinates into the Complaints Collection), Check Status process (reading complaint state), Stall Booking process (writing to StallBookings Collection), and Events process (accessing Events Collection).")

    add_h3(doc, "4.2.2 Structure Chart:")
    add_p(doc, "A Structure Chart is a top-down hierarchical diagram consisting of rectangles representing different software modules and lines showing control and data connections. It illustrates how the system is partitioned into manageable module hierarchies, organization structures, and communicational interfaces.")
    add_p(doc, "In the Admin Module Structure Chart (Fig. 4.2.1.2), the root Admin Controller branches into Dashboard & Reports, Complaint Management (Assign, Reassign, SLA Monitor), Master Data (Districts, Corporations, Zones, Wards), Park Inventory Management, User & Staff Management, and Stall & Event Operations.")

    add_h3(doc, "4.2.3 UML Diagram:")
    add_p(doc, "A UML Class Diagram is a structural diagram that represents the classes of a system, their attributes, methods, and the relationships between them. It helps visualize how different components interact with each other in an object-oriented design. This diagram is widely used for planning, analyzing, and documenting software systems.")

    # Table of UML Notations
    table_uml = doc.add_table(rows=1, cols=3)
    table_uml.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table_uml.rows[0].cells
    hdr[0].text = "Notation / Symbol"
    hdr[1].text = "Name"
    hdr[2].text = "Description"
    for c in hdr:
        c.paragraphs[0].runs[0].font.bold = True
        set_cell_background(c, "E2E8F0")

    uml_notations = [
        ("+", "Public Visibility", "Attributes or methods accessible by all classes."),
        ("-", "Private Visibility", "Attributes or methods accessible only within the declaring class."),
        ("#", "Protected Visibility", "Attributes or methods accessible within the class and its subclasses."),
        ("3-Compartment Box", "Class Box", "Displays the Class Name, Attributes, and Operations/Methods."),
        ("Solid Line", "Association", "Represents structural relationships between two classes."),
        ("1 .. *", "Multiplicity (One-to-Many)", "Specifies that one instance of a class relates to many instances of another."),
        ("Diamond Outline", "Aggregation", "Represents a whole-part relationship where the part can exist independently."),
        ("Solid Diamond", "Composition", "Represents a strong whole-part relationship where the part cannot exist without the whole.")
    ]
    for u in uml_notations:
        r = table_uml.add_row().cells
        r[0].text = u[0]
        r[1].text = u[1]
        r[2].text = u[2]

    add_p(doc, "\nTable 4.2.3: Notations used in the UML Diagram\n")
    add_p(doc, "In the System UML Class Diagram (Fig. 4.2.1.3), the User class associates with Complaints (1 to many), StallBookings (1 to many), and LeaveRequests (1 to many). The Park class associates with Complaints, StallSlots, and Events. The Complaint class references User (Citizen), Park, assigned Contractor, and assigned Government Official, encapsulating methods such as createComplaint(), assignTask(), updateProgress(), submitInspection(), and closeComplaint().")

    add_h2(doc, "4.3 Database Design:")
    add_p(doc, "Database design is the process of producing a detailed data model of the database. The data model contains all the needed logical and physical design choices and storage parameters needed to generate a design in a data definition language which can then be used to create the database collections. A fully attributed data model contains detailed attributes for each entity.")
    add_p(doc, "The term database design describes the logical design of the data base structures used to store information. In the document-oriented model used in MongoDB, these are collections and documents with structured BSON schemas. The schemas map directly to Mongoose models, supporting data validation, indexing, and relational references across entities.")

    add_h3(doc, "4.3.1 Table / Collection Descriptions:")

    # 1. Users Table
    add_p(doc, "4.3.1.1 Users Table (Collection: users)", "")
    t_users = doc.add_table(rows=1, cols=4)
    t_users.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Column Name", "Data Type", "Constraints", "Description"]):
        t_users.rows[0].cells[i].text = h
        t_users.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t_users.rows[0].cells[i], "E2E8F0")
    
    users_rows = [
        ("_id", "ObjectId", "Primary Key", "Unique identifier for the user account"),
        ("name", "String", "Not null", "Full name of the user"),
        ("email", "String", "Unique, Not null", "Email address used for authentication and alerts"),
        ("phone", "String", "Not null", "10-digit mobile contact number"),
        ("password", "String", "Not null (Hashed)", "Bcrypt encrypted password hash"),
        ("role", "String", "Enum, Not null", "Role: Public, Government Official, Contractor, Admin"),
        ("address", "String", "Optional", "Residential or office address"),
        ("district", "ObjectId", "Ref: District", "Associated district reference"),
        ("zone", "ObjectId", "Ref: Zone", "Associated administrative zone reference"),
        ("ward", "ObjectId", "Ref: Ward", "Associated municipal ward reference")
    ]
    for row in users_rows:
        r = t_users.add_row().cells
        for idx, val in enumerate(row):
            r[idx].text = val

    # 2. Parks Table
    add_p(doc, "\n4.3.1.2 Parks Table (Collection: parks)", "")
    t_parks = doc.add_table(rows=1, cols=4)
    t_parks.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Column Name", "Data Type", "Constraints", "Description"]):
        t_parks.rows[0].cells[i].text = h
        t_parks.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t_parks.rows[0].cells[i], "E2E8F0")
    
    parks_rows = [
        ("_id", "ObjectId", "Primary Key", "Unique identifier for the park asset"),
        ("name", "String", "Not null", "Official name of the park"),
        ("parkCode", "String", "Unique, Not null", "Unique municipal code (e.g. P-111-02)"),
        ("district", "ObjectId", "Ref: District", "District jurisdiction identifier"),
        ("corporation", "ObjectId", "Ref: Corporation", "Corporation jurisdiction (e.g. BBMP)"),
        ("zone", "ObjectId", "Ref: Zone", "Zone jurisdiction identifier"),
        ("ward", "ObjectId", "Ref: Ward", "Ward jurisdiction identifier"),
        ("latitude", "String", "Not null", "GPS latitude coordinate of park centroid"),
        ("longitude", "String", "Not null", "GPS longitude coordinate of park centroid"),
        ("area", "String", "Optional", "Total land area (e.g. 25 Acres)"),
        ("parkType", "String", "Optional", "Classification (e.g. Botanical, Neighborhood, Lake Park)"),
        ("numberOfTrees", "Number", "Default: 0", "Total tree count inventory"),
        ("numberOfBenches", "Number", "Default: 0", "Total seating benches inventory"),
        ("numberOfLights", "Number", "Default: 0", "Total illumination fixtures inventory"),
        ("numberOfDustbins", "Number", "Default: 0", "Total waste receptacles inventory"),
        ("childrenPlayArea", "Boolean", "Default: false", "Presence of children playground equipment"),
        ("walkingTrack", "Boolean", "Default: false", "Presence of paved walking / jogging track"),
        ("openGym", "Boolean", "Default: false", "Presence of outdoor fitness equipment"),
        ("totalStallSlots", "Number", "Default: 0", "Total commercial stall spaces available"),
        ("status", "String", "Enum ('Active'|'Closed')", "Current operational status of park")
    ]
    for row in parks_rows:
        r = t_parks.add_row().cells
        for idx, val in enumerate(row):
            r[idx].text = val

    # 3. Complaints Table
    add_p(doc, "\n4.3.1.3 Complaints Table (Collection: complaints)", "")
    t_cmp = doc.add_table(rows=1, cols=4)
    t_cmp.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Column Name", "Data Type", "Constraints", "Description"]):
        t_cmp.rows[0].cells[i].text = h
        t_cmp.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t_cmp.rows[0].cells[i], "E2E8F0")
    
    cmp_rows = [
        ("_id", "ObjectId", "Primary Key", "Unique identifier for the complaint record"),
        ("complaintNumber", "String", "Unique, Not null", "Generated reference ID (e.g. CMP-2026-0042)"),
        ("user", "ObjectId", "Ref: User", "Reference to the citizen who filed the report"),
        ("park", "ObjectId", "Ref: Park", "Reference to the affected park asset"),
        ("category", "String", "Not null", "Category (Play Area, Benches, Lighting, Cleanliness)"),
        ("priority", "String", "Enum", "Priority level: Low, Medium, High, Urgent"),
        ("description", "String", "Not null", "Detailed description of the defect"),
        ("images", "Array of Strings", "Not null", "Paths to live camera captured defect photographs"),
        ("latitude", "Number", "Not null", "Exact GPS latitude where complaint was captured"),
        ("longitude", "Number", "Not null", "Exact GPS longitude where complaint was captured"),
        ("status", "String", "Enum, Default: 'New'", "Status: New, Assigned, In Progress, Inspection Pending, Closed"),
        ("assignedContractor", "ObjectId", "Ref: Contractor", "Assigned maintenance contractor agency"),
        ("assignedOfficial", "ObjectId", "Ref: User", "Assigned government inspection official"),
        ("slaDeadline", "Date", "Calculated", "Target resolution timestamp under SLA rules"),
        ("slaStatus", "String", "Enum", "SLA tracking: On Time, Due Soon, Overdue, Resolved"),
        ("beforeImages", "Array of Strings", "Optional", "Photographs taken before repair work begins"),
        ("afterImages", "Array of Strings", "Optional", "Photographs taken after repair work is completed"),
        ("contractorRemarks", "String", "Optional", "Work completion notes submitted by contractor"),
        ("inspectionRemarks", "String", "Optional", "Verification feedback submitted by official")
    ]
    for row in cmp_rows:
        r = t_cmp.add_row().cells
        for idx, val in enumerate(row):
            r[idx].text = val

    # 4. Stall Bookings Table
    add_p(doc, "\n4.3.1.4 Stall Bookings Table (Collection: stallbookings)", "")
    t_stall = doc.add_table(rows=1, cols=4)
    t_stall.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Column Name", "Data Type", "Constraints", "Description"]):
        t_stall.rows[0].cells[i].text = h
        t_stall.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t_stall.rows[0].cells[i], "E2E8F0")
    
    stall_rows = [
        ("_id", "ObjectId", "Primary Key", "Unique identifier for the stall booking"),
        ("park", "ObjectId", "Ref: Park, Not null", "Target park where stall is requested"),
        ("slot", "ObjectId", "Ref: StallSlot", "Specific stall slot identifier"),
        ("user", "ObjectId", "Ref: User, Not null", "Citizen / Vendor user reference"),
        ("stallName", "String", "Not null", "Commercial trading name of the stall"),
        ("productsType", "String", "Not null", "Type of merchandise (Snacks, Crafts, Organic, etc.)"),
        ("applicantName", "String", "Not null", "Full name of the stall applicant"),
        ("applicantPhone", "String", "Not null", "Contact phone number"),
        ("amountPaid", "Number", "Not null", "Booking fee amount paid in INR"),
        ("photoUrl", "String", "Optional", "Path to applicant passport photo"),
        ("status", "String", "Enum", "Status: Pending Approval, Confirmed, Rejected")
    ]
    for row in stall_rows:
        r = t_stall.add_row().cells
        for idx, val in enumerate(row):
            r[idx].text = val

    # 5. Events Table
    add_p(doc, "\n4.3.1.5 Events Table (Collection: events)", "")
    t_events = doc.add_table(rows=1, cols=4)
    t_events.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Column Name", "Data Type", "Constraints", "Description"]):
        t_events.rows[0].cells[i].text = h
        t_events.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t_events.rows[0].cells[i], "E2E8F0")
    
    event_rows = [
        ("_id", "ObjectId", "Primary Key", "Unique identifier for the event"),
        ("title", "String", "Not null", "Title of the park event (e.g. Flower Show, Yoga Camp)"),
        ("description", "String", "Not null", "Detailed description and event guidelines"),
        ("parkId", "ObjectId", "Ref: Park", "Park location reference where event is hosted"),
        ("eventDate", "Date", "Not null", "Date when event takes place"),
        ("startTime", "String", "Not null", "Event starting time"),
        ("endTime", "String", "Not null", "Event concluding time"),
        ("price", "Number", "Default: 0", "Entry registration fee (0 for free public events)"),
        ("capacity", "Number", "Not null", "Maximum allowable attendee capacity"),
        ("isActive", "Boolean", "Default: true", "Flag indicating whether registration is open")
    ]
    for row in event_rows:
        r = t_events.add_row().cells
        for idx, val in enumerate(row):
            r[idx].text = val

    # 6. Master Geographic Tables (Districts, Corporations, Zones, Wards)
    add_p(doc, "\n4.3.1.6 Master Geographic Tables (Districts, Corporations, Zones, Wards)", "")
    t_geo = doc.add_table(rows=1, cols=4)
    t_geo.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Table / Entity", "Primary Key", "Key Attributes", "Description"]):
        t_geo.rows[0].cells[i].text = h
        t_geo.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t_geo.rows[0].cells[i], "E2E8F0")
    
    geo_rows = [
        ("districts", "_id (ObjectId)", "name (String, e.g. Bangalore Urban)", "Top-level district administrative division"),
        ("corporations", "_id (ObjectId)", "district (Ref), name (String, e.g. BBMP)", "Municipal corporation entity"),
        ("zones", "_id (ObjectId)", "corporation (Ref), name (String, e.g. South Zone)", "City administrative zone under corporation"),
        ("wards", "_id (ObjectId)", "zone (Ref), wardNumber (String), name (String)", "Municipal ward level spatial division")
    ]
    for row in geo_rows:
        r = t_geo.add_row().cells
        for idx, val in enumerate(row):
            r[idx].text = val

    doc.save(os.path.join(OUTPUT_DIR, "04_Chapter_4_Design_and_Methodology.docx"))
    print("Generated: 04_Chapter_4_Design_and_Methodology.docx")

# -------------------------------------------------------------
# 05. CHAPTER 5: IMPLEMENTATION DETAILS
# -------------------------------------------------------------
def generate_chapter_5():
    doc = create_base_doc("Chapter 5 - Implementation Details")
    add_h1(doc, "5. IMPLEMENTATION DETAILS")
    
    add_h2(doc, "5.1 Introduction:")
    add_p(doc, "The goal of the coding or implementation phase is to translate the system design, produced during the designing phase, into code in a given programming language which can be executed by a computer and that performs the computation specified by the design. During the implementation, it should be kept in mind that the programs should not be constructed so that they are easy to write, but that they are easy to read, maintain, and understand.")

    add_h2(doc, "5.2 Hardware and software tools used")
    add_p(doc, "A set of reliable hardware and software tools is used for developing and operating the Park Monitoring System. These tools ensure smooth reporting, tracking, and management of park complaints and recreational assets with real-time accuracy. The selected technologies provide scalability, security, and easy maintenance for efficient system performance.")

    add_h3(doc, "5.2.1 Software Requirements")
    add_h3(doc, "5.2.1.1 Frontend Technologies")
    add_p(doc, "React.js 19 and HTML5 are used to create the component-based structure of the web application. CSS3 and Vanilla CSS styling add color, glassmorphic effects, gradients, and layouts to make the design attractive and responsive across all device viewports. Together, they help build a clean, premium, and user-friendly interface that works seamlessly on all devices.")
    add_p(doc, "JavaScript ES6+ makes the web pages interactive and dynamic. It handles real-time form validation, live camera hardware capture, geolocation coordinate fetching, and smooth asynchronous communication between the frontend and backend without page reloads.")
    add_p(doc, "Bootstrap 5 and Lucide React icons are used to design responsive, mobile-friendly components like buttons, input fields, cards, and modal popups, ensuring a consistent and neat layout across smartphone and desktop screens.")
    add_p(doc, "Vite 8.1 is used as the ultra-fast modern build tool, and Vite PWA Plugin enables service worker caching, offline asset storage, and Progressive Web App installability.")

    add_h3(doc, "5.2.1.2 Backend Technologies")
    add_p(doc, "Node.js and Express.js are used as the core backend runtime and RESTful API framework. Express helps manage routes, handle authentication, process HTTP requests, and connect with the database efficiently. Its modular MVC architecture ensures clean organization and scalability of the project.")
    add_p(doc, "MongoDB serves as the NoSQL database for storing user details, park inventories, complaints, stall bookings, events, and administrative records. It provides fast, flexible, and reliable document management for the system.")
    add_p(doc, "Nodemailer is integrated for dispatching real-time automated transactional email notifications to citizens, officials, and contractors.")

    add_h3(doc, "5.2.1.3 Development Tools")
    add_p(doc, "Visual Studio Code is used as the primary open-source code editor. It provides features like intelligent code completion, debugging, Git integration, and terminal execution, making it ideal for full-stack JavaScript web development.")

    add_h3(doc, "5.2.2 Hardware Requirements")
    add_p(doc, "The recommended hardware specifications include a 64-bit multi-core processor (Intel Core i5 or AMD Ryzen at 2.4 GHz or faster), minimum 4 GB RAM (8 GB recommended), and 10 GB free hard disk storage space.")

    add_h2(doc, "5.3. Source Code:")
    add_p(doc, "Below are representative core source code implementations from both the frontend and backend modules of the project.")

    add_h3(doc, "Citizen Registration (Backend Controller):")
    add_p(doc, "// backend/controllers/authController.js\n"
               "exports.register = async (req, res) => {\n"
               "  try {\n"
               "    const { name, email, phone, password, address } = req.body;\n"
               "    if (!name || !email || !phone || !password) {\n"
               "      return res.status(400).json({ message: 'All required fields must be provided.' });\n"
               "    }\n"
               "    const existingUser = await User.findOne({ email });\n"
               "    if (existingUser) {\n"
               "      return res.status(400).json({ message: 'Email is already registered.' });\n"
               "    }\n"
               "    const user = new User({\n"
               "      name,\n"
               "      email,\n"
               "      phone,\n"
               "      password,\n"
               "      address: address || '',\n"
               "      role: 'Public'\n"
               "    });\n"
               "    await user.save();\n"
               "    res.status(201).json({ success: true, message: 'Registration successful!' });\n"
               "  } catch (error) {\n"
               "    res.status(500).json({ error: error.message });\n"
               "  }\n"
               "};")

    add_h3(doc, "User Authentication & Login (Backend Controller):")
    add_p(doc, "// backend/controllers/authController.js\n"
               "exports.login = async (req, res) => {\n"
               "  try {\n"
               "    const { email, password } = req.body;\n"
               "    const user = await User.findOne({ email });\n"
               "    if (!user || !(await user.matchPassword(password))) {\n"
               "      return res.status(401).json({ message: 'Invalid email or password.' });\n"
               "    }\n"
               "    const token = jwt.sign(\n"
               "      { id: user._id, role: user.role },\n"
               "      process.env.JWT_SECRET || 'secretkey',\n"
               "      { expiresIn: '7d' }\n"
               "    );\n"
               "    res.json({\n"
               "      success: true,\n"
               "      token,\n"
               "      user: { id: user._id, name: user.name, email: user.email, role: user.role }\n"
               "    });\n"
               "  } catch (error) {\n"
               "    res.status(500).json({ error: error.message });\n"
               "  }\n"
               "};")

    add_h3(doc, "Live Complaint Filing with Mandatory Camera & GPS (Backend Controller):")
    add_p(doc, "// backend/controllers/complaintController.js\n"
               "exports.createComplaint = async (req, res) => {\n"
               "  try {\n"
               "    const { parkName, category, description, priority, latitude, longitude, fullName, mobileNumber } = req.body;\n"
               "    if (!req.file) {\n"
               "      return res.status(400).json({ message: 'Live camera photograph is mandatory.' });\n"
               "    }\n"
               "    const count = await Complaint.countDocuments();\n"
               "    const complaintNumber = `CMP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;\n"
               "    const park = await Park.findOne({ name: parkName });\n"
               "    const complaint = new Complaint({\n"
               "      complaintNumber,\n"
               "      user: req.user ? req.user._id : null,\n"
               "      userName: fullName,\n"
               "      userPhone: mobileNumber,\n"
               "      park: park ? park._id : null,\n"
               "      parkName,\n"
               "      category,\n"
               "      description,\n"
               "      priority: priority || 'Medium',\n"
               "      latitude: parseFloat(latitude) || null,\n"
               "      longitude: parseFloat(longitude) || null,\n"
               "      images: [`/uploads/complaints/${req.file.filename}`],\n"
               "      status: 'New',\n"
               "      slaStatus: 'On Time',\n"
               "      slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000)\n"
               "    });\n"
               "    await complaint.save();\n"
               "    res.status(201).json({ success: true, complaintNumber, complaint });\n"
               "  } catch (error) {\n"
               "    res.status(500).json({ error: error.message });\n"
               "  }\n"
               "};")

    add_h3(doc, "Contractor Complaint Assignment (Backend Controller):")
    add_p(doc, "// backend/controllers/adminController.js\n"
               "exports.assignComplaint = async (req, res) => {\n"
               "  try {\n"
               "    const { complaintId, contractorId, officialId } = req.body;\n"
               "    const complaint = await Complaint.findById(complaintId);\n"
               "    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });\n"
               "    complaint.assignedContractor = contractorId;\n"
               "    if (officialId) complaint.assignedOfficial = officialId;\n"
               "    complaint.status = 'Assigned';\n"
               "    complaint.assignedAt = new Date();\n"
               "    await complaint.save();\n"
               "    res.json({ success: true, message: 'Complaint assigned successfully.' });\n"
               "  } catch (error) {\n"
               "    res.status(500).json({ error: error.message });\n"
               "  }\n"
               "};")

    add_h3(doc, "Contractor Task Progress Update (Backend Controller):")
    add_p(doc, "// backend/controllers/contractorController.js\n"
               "exports.updateTaskProgress = async (req, res) => {\n"
               "  try {\n"
               "    const { id } = req.params;\n"
               "    const { status, remarks } = req.body;\n"
               "    const complaint = await Complaint.findById(id);\n"
               "    if (!complaint) return res.status(404).json({ message: 'Task not found.' });\n"
               "    complaint.status = status || 'In Progress';\n"
               "    complaint.contractorRemarks = remarks;\n"
               "    if (req.file) {\n"
               "      complaint.afterImages = [`/uploads/progress/${req.file.filename}`];\n"
               "    }\n"
               "    await complaint.save();\n"
               "    res.json({ success: true, message: 'Task progress logged successfully.', complaint });\n"
               "  } catch (error) {\n"
               "    res.status(500).json({ error: error.message });\n"
               "  }\n"
               "};")

    add_h3(doc, "Official Work Verification (Backend Controller):")
    add_p(doc, "// backend/controllers/govController.js\n"
               "exports.verifyComplaintWork = async (req, res) => {\n"
               "  try {\n"
               "    const { id } = req.params;\n"
               "    const { verificationStatus, inspectionRemarks } = req.body;\n"
               "    const complaint = await Complaint.findById(id);\n"
               "    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });\n"
               "    complaint.status = verificationStatus === 'Approved' ? 'Closed' : 'Rework Required';\n"
               "    complaint.inspectionRemarks = inspectionRemarks;\n"
               "    complaint.inspectionDate = new Date();\n"
               "    if (verificationStatus === 'Approved') {\n"
               "      complaint.resolvedAt = new Date();\n"
               "      complaint.slaStatus = complaint.resolvedAt <= complaint.slaDeadline ? 'Resolved Within SLA' : 'Resolved After SLA';\n"
               "    }\n"
               "    await complaint.save();\n"
               "    res.json({ success: true, message: `Work ${verificationStatus} successfully.`, complaint });\n"
               "  } catch (error) {\n"
               "    res.status(500).json({ error: error.message });\n"
               "  }\n"
               "};")

    doc.save(os.path.join(OUTPUT_DIR, "05_Chapter_5_Implementation_Details.docx"))
    print("Generated: 05_Chapter_5_Implementation_Details.docx")

# -------------------------------------------------------------
# 06. CHAPTER 6: RESULT AND EVALUATION
# -------------------------------------------------------------
def generate_chapter_6():
    doc = create_base_doc("Chapter 6 - Result and Evaluation")
    add_h1(doc, "6. RESULT AND EVALUATION")
    
    add_h2(doc, "6.1 Introduction:")
    add_p(doc, "Result and Evaluation is an investigation conducted to provide stakeholders with information about the quality of the product or service under test. It has been defined as the process of analyzing a software item to detect the differences between existing and required conditions and to evaluate the features of the software item.")
    add_p(doc, "It involves the operation of a system or application under controlled conditions and evaluating the results. The controlled conditions should include both normal and abnormal conditions. The objective of this is to intentionally introduce faults into the system to verify whether the functions perform correctly under specific conditions. It is essentially a detection-oriented quality assurance process.")

    add_h2(doc, "6.2 Test Scenario:")
    add_p(doc, "A test scenario is a high-level description of a functionality or feature that needs to be tested within a software application. It represents a real-world situation that a user might encounter while using the system. The purpose of creating test scenarios is to ensure that every aspect of the application is covered during testing and that the system behaves as expected under different conditions. Test scenarios help testers understand what to test without focusing on the exact steps, providing a broad view of the system's behavior and business flow.")

    add_h2(doc, "6.3 Test Cases:")
    add_p(doc, "A test case is a software testing document which consists of event, action, input, output, expected result, and actual result. Clinically defined, a test case is an input and an expected result. This can be pragmatic as 'for condition x your derived result is y', whereas other test cases describe in more detail the input scenario and what results might be expected. It can occasionally be a series of steps but one with expected results or expected outcomes. A test case should also contain a place for the actual result. White box testing is applicable at the unit, integration, and system levels of the software testing process.")

    # 6.3.1 Registration Form Test Cases
    add_p(doc, "6.3.1 Registration Form Test Cases", "")
    t1 = doc.add_table(rows=1, cols=4)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Sl. No.", "Test Condition", "Expected Result", "Result"]):
        t1.rows[0].cells[i].text = h
        t1.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t1.rows[0].cells[i], "E2E8F0")

    reg_tests = [
        ("1.", "If user clicks on register button without entering name.", "Enter your username.", "Successful"),
        ("2.", "If user clicks on register button without entering phone number.", "Enter your phone number.", "Successful"),
        ("3.", "If user clicks on register button without entering email id.", "Enter your email id.", "Successful"),
        ("4.", "If user clicks on register button without entering password.", "Enter your password.", "Successful"),
        ("5.", "If user enters phone number less than or greater than 10 digits.", "Phone number must be exactly 10 digits.", "Successful"),
        ("6.", "If user enters invalid format of email id.", "Invalid email format.", "Successful"),
        ("7.", "If user tries to register with an already registered email.", "This email is already registered.", "Successful"),
        ("8.", "If valid registration details are entered.", "System displays Login page with success alert.", "Successful")
    ]
    for row in reg_tests:
        r = t1.add_row().cells
        for idx, val in enumerate(row):
            r[idx].text = val

    # 6.3.2 Login Form Test Cases
    add_p(doc, "\n6.3.2 Login Form Test Cases", "")
    t2 = doc.add_table(rows=1, cols=4)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Sl. No.", "Test Condition", "Expected Result", "Result"]):
        t2.rows[0].cells[i].text = h
        t2.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t2.rows[0].cells[i], "E2E8F0")

    login_tests = [
        ("1.", "If user enters unregistered email.", "Invalid email or password.", "Successful"),
        ("2.", "If user enters incorrect password.", "Invalid email or password.", "Successful"),
        ("3.", "If both email and password are valid.", "Displays appropriate dashboard page based on role.", "Successful")
    ]
    for row in login_tests:
        r = t2.add_row().cells
        for idx, val in enumerate(row):
            r[idx].text = val

    # 6.3.3 Raise Complaints Form Test Cases
    add_p(doc, "\n6.3.3 Raise Complaints Form Test Cases", "")
    t3 = doc.add_table(rows=1, cols=4)
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Sl. No.", "Test Condition", "Expected Result", "Result"]):
        t3.rows[0].cells[i].text = h
        t3.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t3.rows[0].cells[i], "E2E8F0")

    cmp_tests = [
        ("1.", "If user attempts submission without capturing live camera photo.", "Live camera photograph is mandatory.", "Successful"),
        ("2.", "If user clicks submit without selecting park name or category.", "Please select required fields.", "Successful"),
        ("3.", "If GPS location is disabled during live capture.", "System prompts to enable location access.", "Successful"),
        ("4.", "If all valid complaint details and live camera photo are captured.", "Complaint registered with unique ID & email confirmation.", "Successful")
    ]
    for row in cmp_tests:
        r = t3.add_row().cells
        for idx, val in enumerate(row):
            r[idx].text = val

    # 6.3.4 Check Status Form Test Cases
    add_p(doc, "\n6.3.4 Check Status Form Test Cases", "")
    t4 = doc.add_table(rows=1, cols=4)
    t4.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Sl. No.", "Test Condition", "Expected Result", "Result"]):
        t4.rows[0].cells[i].text = h
        t4.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t4.rows[0].cells[i], "E2E8F0")

    status_tests = [
        ("1.", "If user enters non-existent complaint number.", "Complaint ID not found. Please enter a valid ID.", "Successful"),
        ("2.", "If user enters valid complaint number.", "Displays real-time timeline, status, and contractor details.", "Successful")
    ]
    for row in status_tests:
        r = t4.add_row().cells
        for idx, val in enumerate(row):
            r[idx].text = val

    # 6.3.5 Add Park Form Test Cases
    add_p(doc, "\n6.3.5 Add Park Form Test Cases", "")
    t5 = doc.add_table(rows=1, cols=4)
    t5.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Sl. No.", "Test Condition", "Expected Result", "Result"]):
        t5.rows[0].cells[i].text = h
        t5.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t5.rows[0].cells[i], "E2E8F0")

    park_tests = [
        ("1.", "If admin submits without entering park name or park code.", "Park name and unique park code are required.", "Successful"),
        ("2.", "If admin submits without selecting District, Corporation, Zone, or Ward.", "Please complete location hierarchy selection.", "Successful"),
        ("3.", "If all valid park details and facility checkboxes are submitted.", "Park added successfully to catalog and live GIS map.", "Successful")
    ]
    for row in park_tests:
        r = t5.add_row().cells
        for idx, val in enumerate(row):
            r[idx].text = val

    # 6.3.6 Stall Booking Form Test Cases
    add_p(doc, "\n6.3.6 Stall Booking Form Test Cases", "")
    t6 = doc.add_table(rows=1, cols=4)
    t6.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Sl. No.", "Test Condition", "Expected Result", "Result"]):
        t6.rows[0].cells[i].text = h
        t6.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t6.rows[0].cells[i], "E2E8F0")

    stall_tests = [
        ("1.", "If applicant submits booking without stall name or products type.", "Please enter stall name and product description.", "Successful"),
        ("2.", "If slot is already booked for the selected park on that date.", "Slot is fully booked. Please select another date.", "Successful"),
        ("3.", "If valid booking details and payment are completed.", "Booking confirmed with receipt generator.", "Successful")
    ]
    for row in stall_tests:
        r = t6.add_row().cells
        for idx, val in enumerate(row):
            r[idx].text = val

    # 6.3.7 Contractor Progress Logging Test Cases
    add_p(doc, "\n6.3.7 Contractor Progress Logging Test Cases", "")
    t7 = doc.add_table(rows=1, cols=4)
    t7.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Sl. No.", "Test Condition", "Expected Result", "Result"]):
        t7.rows[0].cells[i].text = h
        t7.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t7.rows[0].cells[i], "E2E8F0")

    prog_tests = [
        ("1.", "If contractor updates progress without status selection.", "Please select current task progress status.", "Successful"),
        ("2.", "If contractor marks task completed with after-repair photograph.", "Task status updated to 'Inspection Pending'; official alerted.", "Successful")
    ]
    for row in prog_tests:
        r = t7.add_row().cells
        for idx, val in enumerate(row):
            r[idx].text = val

    # 6.3.8 Official Work Verification Test Cases
    add_p(doc, "\n6.3.8 Official Work Verification Test Cases", "")
    t8 = doc.add_table(rows=1, cols=4)
    t8.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Sl. No.", "Test Condition", "Expected Result", "Result"]):
        t8.rows[0].cells[i].text = h
        t8.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
        set_cell_background(t8.rows[0].cells[i], "E2E8F0")

    ver_tests = [
        ("1.", "If official verifies repaired work and clicks 'Approved'.", "Complaint marked 'Closed'; SLA resolved timestamp recorded.", "Successful"),
        ("2.", "If official marks 'Rework Required' with inspection remarks.", "Complaint returned to contractor queue for re-repair.", "Successful")
    ]
    for row in ver_tests:
        r = t8.add_row().cells
        for idx, val in enumerate(row):
            r[idx].text = val

    doc.save(os.path.join(OUTPUT_DIR, "06_Chapter_6_Result_and_Evaluation.docx"))
    print("Generated: 06_Chapter_6_Result_and_Evaluation.docx")

# -------------------------------------------------------------
# 07. CHAPTER 7: CONCLUSION AND FUTURE WORK
# -------------------------------------------------------------
def generate_chapter_7():
    doc = create_base_doc("Chapter 7 - Conclusion and Future Work")
    add_h1(doc, "7. CONCLUSION AND FUTURE WORK")
    
    add_h2(doc, "7.1 Conclusion")
    add_p(doc, "The Park Monitoring System is an innovative progressive web application designed to address one of the major challenges faced by urban areas: the maintenance, upkeep, and effective management of public parks and recreational green spaces. The system provides a digital platform that bridges the gap between citizens, contractors, field officials, and municipal authorities, enabling efficient reporting, monitoring, and resolution of park-related complaints. Through features such as live camera-based reporting, real-time geolocation tracking, automated email notifications, stall slot booking, event registration, and interactive dashboard visualization, the system ensures complete transparency, accountability, and timely resolution of complaints.")
    add_p(doc, "This project encourages active citizen participation by allowing users to easily report park defects through an interactive mobile interface. The system automatically captures the live photo and exact GPS coordinates of the complaint, helping municipal contractors and field officials identify and act on problem areas promptly without confusion. Administrators can monitor complaints, track contractor performance against SLA deadlines, and generate analytical reports that help in data-driven civic decision-making. By utilizing modern technologies like React, Node.js, Express.js, MongoDB, and Bootstrap, the system ensures a secure, scalable, and user-friendly experience for all stakeholders.")
    add_p(doc, "Moreover, the Park Monitoring System contributes significantly to promoting environmental cleanliness and sustainable urban management. It supports the concept of a smart city by integrating technology into everyday civic governance, ensuring cleaner surroundings and a healthier living environment for citizens. By digitalizing the park complaint and asset management process, it reduces manual effort, saves time, eliminates paperwork, and minimizes delays in issue resolution. Overall, the system plays a crucial role in fostering public awareness, civic responsibility, and effective municipal maintenance practices, thereby moving one step closer to a cleaner, greener, and smarter city.")

    add_h2(doc, "7.2 Future Work")
    add_p(doc, "The Park Monitoring System has significant potential for future enhancements that can further strengthen its effectiveness, citizen engagement, and administrative efficiency. One of the major improvements that can be introduced is a Reward and Civic Awareness Module. This module can motivate citizens to actively participate in maintaining park cleanliness by offering digital badges, appreciation certificates, and leaderboard rankings based on their reporting frequency and contribution to maintaining local parks. Additionally, the system can support environmental awareness campaigns, such as tree-planting drives, cleanliness workshops, and community green events.")
    add_p(doc, "Another important enhancement is the integration of multi-department coordination features. Currently, park management may involve separate teams such as horticulture, electrical maintenance, civil works, and sanitation. By enabling a unified platform where these departments can collaborate, the system can ensure faster, more organized, and transparent complaint resolution. Shared dashboards, inter-department communication channels, and automated task routing can help streamline the entire workflow and avoid delays caused by manual coordination.")
    add_p(doc, "Furthermore, incorporating a comprehensive user feedback and park rating mechanism will allow citizens to rate the quality of park amenities, provide suggestions, and share their satisfaction levels after issue resolution. This will help authorities identify infrastructure gaps, improve service delivery, and build trust with the community.")
    add_p(doc, "A major technological advancement for future implementation is the use of GIS-based hotspot mapping and IoT sensor integration. With GIS mapping, authorities can visually monitor parks with frequent complaints by plotting latitude and longitude coordinates on interactive heatmaps. Over time, the system can highlight recurring equipment breakdown zones, identify patterns, predict potential problem areas, and assist in strategic maintenance planning. Additionally, integrating soil moisture sensors and smart water management can automate park irrigation. This can be extremely useful for resource allocation, water conservation, and long-term policy-making related to urban green cover.")
    add_p(doc, "By implementing these advanced features, the Park Monitoring System can evolve into a highly interactive, responsive, and intelligent urban governance platform. These enhancements will not only boost citizen participation but also enhance transparency, accelerate decision-making, and support the larger goal of urban cleanliness, environmental sustainability, and smart city development.")

    doc.save(os.path.join(OUTPUT_DIR, "07_Chapter_7_Conclusion_and_Future_Work.docx"))
    print("Generated: 07_Chapter_7_Conclusion_and_Future_Work.docx")

# -------------------------------------------------------------
# 08. REFERENCES & APPENDICES
# -------------------------------------------------------------
def generate_references_and_appendices():
    doc = create_base_doc("References and Appendices")
    add_h1(doc, "REFERENCES")
    
    references = [
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

    for ref in references:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.3
        p.paragraph_format.space_after = Pt(4)
        p.add_run(ref)

    doc.add_page_break()
    add_h1(doc, "APPENDICES")
    add_p(doc, "The appendices section contains the list of system interface navigation figures and database schema models representing the Park Monitoring System across Citizens, Government Officials, Maintenance Contractors, and Admin modules.")
    
    add_h2(doc, "List of Application Figures:")
    app_figs = [
        ("Fig. 1", "Index / Landing Page"),
        ("Fig. 2", "Citizen Registration Page"),
        ("Fig. 3", "Citizen Login Page"),
        ("Fig. 4", "Forgot Password Page"),
        ("Fig. 5", "OTP Verification Page"),
        ("Fig. 6", "Reset Password Page"),
        ("Fig. 7", "Citizen Dashboard"),
        ("Fig. 8", "Citizen Profile Page"),
        ("Fig. 9", "Edit Profile Page"),
        ("Fig. 10", "Add Complaints Page (Live Camera & GPS Coordinate Capture)"),
        ("Fig. 11", "Check Status Page"),
        ("Fig. 12", "Active Complaints List"),
        ("Fig. 13", "Closed Complaints List"),
        ("Fig. 14", "Admin Login Page"),
        ("Fig. 15", "Admin Dashboard (Real-time Analytics & SLA Metrics)"),
        ("Fig. 16", "Admin Reports Page"),
        ("Fig. 17", "Admin Complaint Management Page (Assign/Reassign)"),
        ("Fig. 18", "Add Zone Page"),
        ("Fig. 19", "Edit Division / Corporation Page"),
        ("Fig. 20", "View & Manage Wards Page"),
        ("Fig. 21", "Add Officials / Contractors Page"),
        ("Fig. 22", "Government Officials Dashboard"),
        ("Fig. 23", "Assigned Complaints Inspection List"),
        ("Fig. 24", "Inspection History & Verification Logs"),
        ("Fig. 25", "Contractor Task Progress & Update Complaints Page"),
        ("Fig. 26", "Complaint Schema Model Code"),
        ("Fig. 27", "Officials & Contractor Schema Model Code"),
        ("Fig. 28", "Wards Schema Table Code"),
        ("Fig. 29", "Divisions / Zones Schema Table Code"),
        ("Fig. 30", "Automated Complaint Assignment Email Code")
    ]
    for fig in app_figs:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_after = Pt(2)
        r_b = p.add_run(fig[0] + ": ")
        r_b.font.bold = True
        r_b.font.name = 'Times New Roman'
        p.add_run(fig[1])

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
    print("\nALL 9 CHAPTER DOCX FILES REGENERATED CLEANLY IN:", OUTPUT_DIR)
