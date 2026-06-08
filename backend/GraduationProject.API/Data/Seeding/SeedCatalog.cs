namespace GraduationProject.API.Data.Seeding
{
    internal static class SeedCatalog
    {
        public static readonly string[] AcademicYears =
            { "First Year", "Second Year", "Third Year", "Fourth Year", "Fifth Year" };

        public static readonly (string Major, int Count, string[] Roles, string[] Tech, string[] Tools)[] MajorDistribution =
        {
            ("Computer Engineering", 10, ["Embedded Developer", "IoT Engineer"], ["C", "Embedded Systems", "Arduino", "RTOS"], ["Keil", "STM32", "MATLAB"]),
            ("Computer Science", 10, ["Backend Developer", "Full-Stack Developer"], ["Java", "Algorithms", "Data Structures", "PostgreSQL"], ["IntelliJ", "Git", "Docker"]),
            ("Information Technology", 10, ["Systems Administrator", "Network Engineer"], ["Linux", "Network Security", "Windows Server", "Cloud Computing"], ["Wireshark", "VMware", "Active Directory"]),
            ("Software Engineering", 10, ["Full-Stack Developer", "QA Engineer"], ["ASP.NET Core", "React", "TypeScript", "Agile"], ["Jira", "Postman", "Selenium"]),
            ("Data Science", 10, ["Data Analyst", "ML Engineer"], ["Python", "SQL", "Statistical Analysis", "Power BI"], ["Pandas", "Scikit-learn", "Jupyter"]),
            ("Artificial Intelligence", 10, ["ML Engineer", "AI Researcher"], ["Python", "TensorFlow", "PyTorch", "Deep Learning"], ["CUDA", "OpenCV", "Hugging Face"]),
            ("Network Engineering", 10, ["Network Engineer", "Security Analyst"], ["Cisco", "Network Security", "Routing", "Firewalls"], ["Wireshark", "GNS3", "pfSense"]),
            ("Electrical Engineering", 10, ["Hardware Engineer", "Embedded Developer"], ["Digital Systems", "FPGA", "Signal Processing", "MATLAB"], ["VHDL", "Altium", "Oscilloscope"]),
        };

        public static readonly string[] FirstNames =
        {
            "Mohammad", "Ahmad", "Omar", "Yousef", "Khaled", "Tariq", "Mahmoud", "Hassan", "Ibrahim", "Nabil",
            "Layla", "Sara", "Nour", "Rania", "Dina", "Hala", "Maya", "Lina", "Yasmin", "Amal",
            "Fadi", "George", "Sami", "Rami", "Bashar", "Ziad", "Waleed", "Anas", "Bilal", "Murad",
            "Hanan", "Salma", "Reem", "Mariam", "Aya", "Jana", "Tala", "Rula", "Suhad", "Nadia",
        };

        public static readonly string[] LastNames =
        {
            "Hammad", "Khalil", "Nasser", "Barakat", "Sabbah", "Qasem", "Awad", "Zayed", "Masri", "Hijazi",
            "Tamimi", "Shalabi", "Jaber", "Salem", "Farah", "Khoury", "Sabbagh", "Haddad", "Mansour", "Darwish",
            "Abu Ghosh", "Najjar", "Yasin", "Rishmawi", "Sbeih", "Hanania", "Canawati", "Mitri", "Saca", "Asfour",
        };

        public static readonly (string Name, string Email, string Domain, string Industry, string Location, string Description, string[] Interests)[] CompanyDefs =
        {
            ("ASAL Technologies", "careers@asaltech.com", "asaltech.com", "Software Engineering & Outsourcing",
             "Ramallah, Palestine",
             "ASAL Technologies is a leading Palestinian software company delivering enterprise solutions, R&D partnerships, and graduate hiring programs across fintech, telecom, and healthcare.",
             ["ASP.NET Core", "React", "Azure", "Mobile Development", "Quality Assurance"]),
            ("EXALT", "talent@exalt.ps", "exalt.ps", "Digital Transformation & Consulting",
             "Ramallah, Palestine",
             "EXALT partners with An-Najah National University to deliver custom software, cloud migration, and UX-led product engineering for regional enterprises.",
             ["Cloud Architecture", "UX Design", "DevOps", "Product Management"]),
            ("Foothill Technology Solutions", "hr@foothill.ps", "foothill.ps", "Enterprise Software",
             "Nablus, Palestine",
             "Foothill Technology Solutions builds ERP extensions, mobile workforce apps, and analytics dashboards for manufacturing clients.",
             ["Java", "Spring Boot", "Flutter", "Business Intelligence"]),
            ("Dimensions", "join@dimensions.ps", "dimensions.ps", "Creative Technology Studio",
             "Ramallah, Palestine",
             "Dimensions blends design and engineering to ship brand platforms, e-commerce experiences, and marketing automation tools.",
             ["React", "Node.js", "Brand Design", "E-commerce"]),
            ("Unit One", "careers@unitone.ps", "unitone.ps", "IT Services & Systems Integration",
             "Ramallah, Palestine",
             "Unit One provides infrastructure modernization, cybersecurity assessments, and managed services for banks and NGOs.",
             ["Cybersecurity", "Network Engineering", "Linux", "Compliance"]),
            ("iConnect", "people@iconnect.ps", "iconnect.ps", "Telecommunications Software",
             "Ramallah, Palestine",
             "iConnect develops OSS/BSS tooling, provisioning workflows, and customer self-service portals for telecom operators.",
             ["Microservices", "Kubernetes", "PostgreSQL", "API Design"]),
            ("Bisan Systems", "jobs@bisan.ps", "bisan.ps", "GovTech & Civic Platforms",
             "Nablus, Palestine",
             "Bisan Systems digitizes municipal services, licensing workflows, and citizen engagement portals for Palestinian municipalities.",
             ["ASP.NET Core", "GIS", "Accessibility", "Arabic Localization"]),
            ("ProGineer Technologies", "hello@progineer.ps", "progineer.ps", "Industrial IoT",
             "Hebron, Palestine",
             "ProGineer connects shop-floor sensors to cloud analytics for predictive maintenance in plastics and food processing plants.",
             ["IoT", "Edge Computing", "Python", "Time-Series Databases"]),
            ("MobiTech Palestine", "recruit@mobitech.ps", "mobitech.ps", "Mobile Product Studio",
             "Ramallah, Palestine",
             "MobiTech ships consumer and B2B mobile apps with React Native, offline-first sync, and payment integrations.",
             ["React Native", "Expo", "Firebase", "Payment Gateways"]),
            ("DataBridge Analytics", "team@databridge.ps", "databridge.ps", "Data & AI Consultancy",
             "Bethlehem, Palestine",
             "DataBridge helps retailers and NGOs build data warehouses, executive dashboards, and forecasting models.",
             ["Python", "dbt", "Power BI", "Machine Learning"]),
            ("SecurePath Cyber", "security@securepath.ps", "securepath.ps", "Cybersecurity Services",
             "Ramallah, Palestine",
             "SecurePath delivers penetration testing, SOC monitoring, and security training for An-Najah students and Palestinian startups.",
             ["Penetration Testing", "SIEM", "Network Security", "Incident Response"]),
            ("CloudNine Palestine", "talent@cloudnine.ps", "cloudnine.ps", "Cloud & DevOps",
             "Ramallah, Palestine",
             "CloudNine migrates legacy workloads to Azure and AWS while building CI/CD pipelines for product teams.",
             ["Azure", "AWS", "Terraform", "Docker"]),
            ("GreenCode Labs", "labs@greencode.ps", "greencode.ps", "Sustainability Tech",
             "Jenin, Palestine",
             "GreenCode builds smart agriculture dashboards, water monitoring systems, and environmental reporting tools.",
             ["IoT", "GIS", "React", "Environmental Sensors"]),
            ("PITA Partner — CodeCraft", "careers@codecraft.ps", "codecraft.ps", "PITA Member — Software House",
             "Ramallah, Palestine",
             "CodeCraft is a PITA member company focused on outsourcing, graduate internships, and An-Najah capstone sponsorships.",
             ["Full-Stack Development", "QA Automation", "Internship Programs", "Capstone Sponsorship"]),
            ("PITA Partner — Nablus Digital", "join@nablusdigital.ps", "nablusdigital.ps", "PITA Member — Digital Agency",
             "Nablus, Palestine",
             "Nablus Digital delivers web platforms, accessibility audits, and bilingual content systems for public-sector clients.",
             ["WordPress", "Accessibility", "SEO", "Arabic Typography"]),
        };

        public static readonly (string Name, string Username, string Category, string Faculty, string Description)[] AssociationDefs =
        {
            ("IEEE An-Najah Student Branch", "ieee-anajah", "Technical", NajahSeedConstants.UniversityFaculty,
             "IEEE An-Najah organizes technical workshops, industry talks, and hardware hackathons for engineering students."),
            ("Google Developer Student Club An-Najah", "gdsc-anajah", "Technical", NajahSeedConstants.UniversityFaculty,
             "GDSC An-Najah hosts study jams, Android clinics, and cloud certification prep sessions for students."),
            ("Cyber Security Club — An-Najah", "cyber-anajah", "Technical", NajahSeedConstants.UniversityFaculty,
             "Cyber Security Club at An-Najah runs CTF practice, ethical hacking workshops, and awareness campaigns on campus."),
            ("Robotics Club — An-Najah", "robotics-anajah", "Technical", NajahSeedConstants.UniversityFaculty,
             "Robotics Club at An-Najah builds autonomous line-followers, drone prototypes, and participates in regional competitions."),
            ("AI Club — An-Najah", "ai-anajah", "Technical", NajahSeedConstants.UniversityFaculty,
             "AI Club at An-Najah explores machine learning projects, model deployment workshops, and research reading groups."),
            ("Entrepreneurship Club — An-Najah", "entrepreneurship-anajah", "Cultural", "School of Business",
             "Entrepreneurship Club at An-Najah mentors founders, hosts pitch nights, and connects students with local incubators."),
            ("Programming Club — An-Najah", "programming-anajah", "Technical", NajahSeedConstants.UniversityFaculty,
             "Programming Club at An-Najah runs algorithms practice, competitive programming training, and portfolio review sessions."),
            ("Women in Tech — An-Najah", "wit-anajah", "Volunteer", NajahSeedConstants.UniversityFaculty,
             "Women in Tech at An-Najah supports mentorship circles, interview prep, and inclusive hackathon teams."),
            ("Open Source Collective — An-Najah", "oss-anajah", "Technical", NajahSeedConstants.UniversityFaculty,
             "Open Source Collective at An-Najah contributes to Arabic localization, documentation sprints, and GitHub workshops."),
            ("Data Science Society — An-Najah", "data-anajah", "Technical", NajahSeedConstants.UniversityFaculty,
             "Data Science Society at An-Najah hosts Kaggle study groups, visualization challenges, and analytics career panels."),
            ("Volunteer Tech Corps — An-Najah", "volunteer-anajah", "Volunteer", NajahSeedConstants.UniversityFaculty,
             "Volunteer Tech Corps at An-Najah refurbishes laptops for schools and teaches digital literacy in Nablus communities."),
        };

        public static readonly (string Name, string Specialization, string Department, string[] Research, string[] Technical)[] DoctorDefs =
        {
            ("Dr. Sami Barakat", "Artificial Intelligence", "Computer Science",
             ["Deep Learning", "Natural Language Processing", "Arabic NLP"], ["Python", "TensorFlow", "Research Methods"]),
            ("Dr. Rania Khalil", "Software Engineering", "Software Engineering",
             ["Agile Methods", "Requirements Engineering", "Software Architecture"], ["UML", "Microservices", "Design Patterns"]),
            ("Dr. Omar Masri", "Cybersecurity", "Computer Engineering",
             ["Network Security", "Cryptography", "Incident Response"], ["Penetration Testing", "Wireshark", "Linux Security"]),
            ("Dr. Layla Tamimi", "Computer Networks", "Computer Engineering",
             ["SDN", "Wireless Networks", "IoT Protocols"], ["Cisco", "Network Simulation", "5G"]),
            ("Dr. Hassan Qasem", "Data Science", "Information Technology",
             ["Predictive Analytics", "Business Intelligence", "Time Series"], ["Python", "SQL", "Power BI"]),
            ("Dr. Nour Sabbah", "Embedded Systems", "Computer Engineering",
             ["RTOS", "FPGA", "Automotive Electronics"], ["C", "VHDL", "ARM"]),
            ("Dr. Fadi Hijazi", "Digital Systems", "Computer Engineering",
             ["Logic Design", "FPGA", "Hardware Verification"], ["VHDL", "Verilog", "Digital Logic"]),
            ("Dr. Mahmoud Darwish", "Distributed Systems", "Computer Science",
             ["Cloud Computing", "Container Orchestration", "Fault Tolerance"], ["Kubernetes", "Go", "Distributed Databases"]),
            ("Dr. Hala Mansour", "Computer Vision", "Artificial Intelligence",
             ["Medical Imaging", "Object Detection", "Edge AI"], ["PyTorch", "OpenCV", "CUDA"]),
            ("Dr. Tariq Nasser", "Database Systems", "Information Technology",
             ["Query Optimization", "NoSQL", "Data Modeling"], ["PostgreSQL", "MongoDB", "ER Modeling"]),
            ("Dr. Amal Khoury", "Software Testing", "Software Engineering",
             ["Test Automation", "Quality Assurance", "Continuous Integration"], ["Selenium", "JUnit", "CI/CD"]),
            ("Dr. George Mitri", "Computer Architecture", "Computer Engineering",
             ["Processor Design", "Memory Systems", "Parallel Architectures"], ["C", "Assembly", "Computer Architecture"]),
            ("Dr. Reem Asfour", "Machine Learning", "Artificial Intelligence",
             ["Recommender Systems", "Reinforcement Learning", "MLOps"], ["Scikit-learn", "MLflow", "Python"]),
            ("Dr. Waleed Sbeih", "Web Technologies", "Information Technology",
             ["Progressive Web Apps", "Web Performance", "API Security"], ["React", "Node.js", "OAuth"]),
            ("Dr. Dina Canawati", "Information Systems", "Information Technology",
             ["Enterprise Systems", "Healthcare Informatics", "Process Modeling"], ["ERP", "BPMN", "Systems Analysis"]),
        };

        public static readonly (string Name, string Abstract, string[] Skills, int Partners, string Type)[] ProjectDefs =
        {
            ("AI Academic Advisor", "An intelligent advising platform that recommends courses, tracks degree progress, and flags at-risk students using historical enrollment data.", ["Python", "React", "PostgreSQL", "Machine Learning"], 3, "GP"),
            ("Smart Healthcare Assistant", "A bilingual triage chatbot and appointment assistant for campus clinics with doctor handoff workflows.", ["React", "Node.js", "NLP", "PostgreSQL"], 4, "GP"),
            ("Smart Irrigation System", "IoT soil-moisture monitoring with automated valve control and farmer dashboards for West Bank agricultural cooperatives.", ["Arduino", "MQTT", "React", "Embedded Systems"], 3, "GP1"),
            ("Campus Navigation Platform", "Indoor navigation for large campuses using BLE beacons, accessible routes, and real-time event overlays.", ["React Native", "Maps", "Bluetooth", "Node.js"], 4, "GP"),
            ("Cyber Threat Detection System", "SIEM-lite dashboard correlating firewall logs, honeypot alerts, and anomaly scores for university networks.", ["Python", "Elasticsearch", "Network Security", "React"], 3, "GP2"),
            ("SkillSwap Platform", "University talent marketplace connecting students, doctors, companies, and associations for projects and opportunities.", ["ASP.NET Core", "React", "PostgreSQL", "SignalR"], 4, "GP"),
            ("Palestinian Heritage Archive", "Digitization workflow for oral histories with metadata tagging, search, and public exhibition kiosks.", ["React", "PostgreSQL", "Digital Preservation", "UX Design"], 3, "GP"),
            ("Microfinance Risk Scorer", "Credit risk models for community lenders using transaction history and alternative data signals.", ["Python", "SQL", "Power BI", "Statistical Analysis"], 3, "GP"),
            ("Emergency Response Dispatcher", "Real-time incident reporting and responder routing for civil defense training simulations.", ["Flutter", "Firebase", "GIS", "Maps"], 4, "GP1"),
            ("Solar Panel Monitoring", "Dashboard tracking inverter output, maintenance tickets, and weather-adjusted efficiency for campus solar arrays.", ["IoT", "React", "Time-Series Databases", "Python"], 3, "GP2"),
            ("Sign Language Learning App", "Gamified Arabic sign language lessons with video challenges and progress tracking for accessibility education.", ["React Native", "Computer Vision", "UX Design", "Firebase"], 4, "GP"),
            ("Queue Management for Clinics", "QR-based queue tokens, SMS notifications, and doctor schedule integration for outpatient departments.", ["React", "ASP.NET Core", "PostgreSQL", "SMS APIs"], 3, "GP"),
            ("Waste Sorting Vision System", "Edge camera classifying recyclable materials on conveyor belts with operator feedback loops.", ["PyTorch", "OpenCV", "Edge Computing", "Python"], 3, "GP1"),
            ("Peer Tutoring Marketplace", "Matching engine pairing tutors and students by course, availability, and rating history.", ["React", "Node.js", "PostgreSQL", "Matching Algorithms"], 3, "GP"),
            ("Mental Health Check-In Portal", "Anonymous mood check-ins, counselor booking, and resource library for student wellness centers.", ["React", "PostgreSQL", "Privacy Engineering", "Accessibility"], 4, "GP2"),
            ("Library Seat Booking", "Live occupancy maps, reservation windows, and quiet-zone enforcement for central libraries.", ["React", "ASP.NET Core", "PostgreSQL", "Real-Time Updates"], 3, "GP"),
            ("EV Charging Station Manager", "Session billing, load balancing, and maintenance alerts for campus electric vehicle chargers.", ["IoT", "React", "Payment Gateways", "Embedded Systems"], 3, "GP1"),
            ("Arabic Plagiarism Detector", "Corpus-aware similarity detection tuned for Arabic academic writing and citation patterns.", ["NLP", "Python", "Machine Learning", "PostgreSQL"], 3, "GP"),
            ("Food Donation Redistribution", "Connecting restaurants, NGOs, and volunteers to route surplus meals with cold-chain tracking.", ["Flutter", "Firebase", "GIS", "Logistics"], 4, "GP"),
            ("Campus Event Discovery", "Personalized event feed with RSVP, calendar export, and association cross-promotion.", ["React", "Node.js", "PostgreSQL", "Recommendation Systems"], 3, "GP"),
            ("Robotics Competition Control", "Mission scheduler, scoring, and live telemetry for annual An-Najah robotics contests.", ["C", "ROS", "React", "Embedded Systems"], 4, "GP2"),
            ("Freelance Invoice Compliance", "Tool helping Palestinian freelancers generate tax-ready invoices and payment reminders.", ["React", "ASP.NET Core", "PostgreSQL", "FinTech"], 3, "GP"),
            ("Water Quality Monitoring", "Sensor network reporting pH, turbidity, and contamination alerts for village water tanks.", ["IoT", "Python", "GIS", "React"], 3, "GP1"),
            ("Graduation Project Repository", "Searchable archive of past theses with skill tags, supervisor notes, and download analytics.", ["React", "PostgreSQL", "Full-Text Search", "ASP.NET Core"], 3, "GP"),
            ("Accessibility Audit Toolkit", "Automated WCAG scans with remediation suggestions for university web properties.", ["JavaScript", "Accessibility", "React", "Lighthouse"], 3, "GP2"),
        };

        public static readonly (string Code, string Name, string Semester)[] CourseDefs =
        {
            ("CS301", "Software Engineering", "Fall 2025"),
            ("CS302", "Database Systems", "Fall 2025"),
            ("CS303", "Computer Networks", "Spring 2026"),
            ("CS304", "Artificial Intelligence", "Spring 2026"),
            ("CS305", "Web Application Development", "Fall 2025"),
            ("CS306", "Mobile Application Development", "Spring 2026"),
            ("CS307", "Cybersecurity Fundamentals", "Fall 2025"),
            ("CS308", "Data Structures & Algorithms", "Spring 2026"),
        };

        public static readonly string[] AllSkillNames =
        {
            "React", "TypeScript", "Tailwind CSS", "Angular", "Vue.js",
            "ASP.NET Core", "Node.js", "PostgreSQL", "MongoDB", "Docker",
            "Python", "TensorFlow", "PyTorch", "Machine Learning", "Deep Learning",
            "React Native", "Expo", "Flutter", "Swift", "Kotlin",
            "Network Security", "Penetration Testing", "Linux", "Wireshark", "Cryptography",
            "Java", "C#", "C", "Go", "Rust",
            "Azure", "AWS", "Kubernetes", "Terraform", "CI/CD",
            "Figma", "UX Design", "User Research", "Accessibility", "Prototyping",
            "Power BI", "SQL", "Statistical Analysis", "Pandas", "Scikit-learn",
            "Embedded Systems", "Arduino", "IoT", "MQTT", "RTOS",
            "NLP", "Computer Vision", "OpenCV", "GIS", "Firebase",
            "SignalR", "GraphQL", "REST APIs", "Microservices", "Agile",
            "Selenium", "QA Automation", "Jira", "Git", "Redis",
            "Spring Boot", "Hibernate", "Entity Framework", "Blazor", "Next.js",
            "OAuth", "JWT", "Payment Gateways", "Elasticsearch",
            "Full-Stack Developer", "Backend Developer", "Frontend Developer", "Mobile Developer", "Data Analyst",
            "ML Engineer", "DevOps Engineer", "QA Engineer", "UX Designer", "IoT Engineer",
            "Web Development", "Cloud Computing", "Data Structures", "Algorithms", "Software Architecture",
        };

        public static readonly string[] StudentPostTemplates =
        {
            "Just deployed our graduation project MVP to staging — feedback from classmates has been incredibly helpful.",
            "Looking for a backend teammate comfortable with ASP.NET Core and PostgreSQL for our campus navigation project.",
            "Completed the Google Cloud Associate certification after our GDSC study group sessions. Happy to share notes.",
            "Our team presented the smart irrigation prototype at the engineering fair — proud of the sensor calibration work.",
            "Open to collaborating on accessibility-focused web projects this semester. DM me if you are building in React.",
            "Finished integrating SignalR into our real-time dashboard. Learned a lot about connection lifecycle management.",
            "Seeking a computer vision partner familiar with OpenCV for a waste sorting capstone idea.",
            "Published a write-up on securing JWT refresh flows for our cybersecurity club blog.",
        };

        public static readonly string[] DoctorPostTemplates =
        {
            "Office hours this week moved to Wednesday 2–4 PM. Bring your project status sheets.",
            "Calling for research assistants interested in Arabic NLP datasets — stipend available for two students.",
            "Reminder: Software Engineering midterm project proposals are due next Sunday at midnight.",
            "Our lab published a paper on edge inference for medical imaging — congratulations to the student co-authors.",
            "Guest lecture next Thursday on secure API design by an industry engineer from Ramallah.",
            "Supervision slots for Fall 2026 graduation projects are now open — submit your one-page abstract first.",
        };

        public static readonly string[] MessageTemplates =
        {
            "Hi! I saw your profile and think your React experience would be a great fit for our team.",
            "Thanks for the feedback on the database schema — we updated the ERD accordingly.",
            "Are you available for a quick call tomorrow to discuss the API contract?",
            "I reviewed your application and would like to schedule an interview for the frontend role.",
            "The event registration is confirmed. Please arrive 15 minutes early for check-in.",
            "Could you share the latest wireframes before our sprint planning session?",
            "Great progress on the prototype demo — the client was impressed with the dashboard.",
            "I accepted your supervision request. Let's meet next week to finalize the timeline.",
        };
    }
}
