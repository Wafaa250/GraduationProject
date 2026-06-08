namespace GraduationProject.API.Data.Seeding
{
    internal static class ExpansionCatalog
    {
        public const int TargetStudents = 250;
        public const int TargetDoctors = 40;
        public const int TargetCompanies = 30;
        public const int TargetAssociations = 20;
        public const int TargetGraduationProjects = 80;
        public const int TargetCourses = 20;
        public const int TargetStudentPosts = 320;
        public const int TargetDoctorPosts = 120;
        public const int TargetConversations = 220;
        public const int TargetMessages = 2400;

        public static readonly (string Name, string Email, string Domain, string Industry, string Location, string Description, string[] Interests)[] AdditionalCompanies =
        {
            ("Jawwal Pay", "careers@jawwalpay.ps", "jawwalpay.ps", "FinTech & Digital Payments", "Ramallah, Palestine",
             "Jawwal Pay builds mobile wallet infrastructure, merchant onboarding, and bill payment services across Palestine.",
             ["FinTech", "Mobile Development", "Security", "API Design"]),
            ("PalTel ICT Solutions", "talent@paltel-ict.ps", "paltel-ict.ps", "Telecommunications & Enterprise IT", "Ramallah, Palestine",
             "PalTel ICT delivers network operations tooling, enterprise billing integrations, and field technician platforms.",
             ["Telecom", "Enterprise Software", "DevOps", "Data Engineering"]),
            ("Siniora Software House", "jobs@siniorasoftware.ps", "siniorasoftware.ps", "Custom Software Development", "Ramallah, Palestine",
             "Siniora Software House partners with banks and retailers on bilingual commerce and loyalty platforms.",
             ["ASP.NET Core", "React", "E-commerce", "Payment Gateways"]),
            ("Optimiza Technology", "hr@optimiza.ps", "optimiza.ps", "Digital Marketing & Martech", "Ramallah, Palestine",
             "Optimiza builds campaign automation, analytics dashboards, and CRM connectors for regional brands.",
             ["Marketing Automation", "React", "Analytics", "CRM Integrations"]),
            ("Ebtikar Innovation", "join@ebtikar.ps", "ebtikar.ps", "HealthTech & InsurTech", "Nablus, Palestine",
             "Ebtikar develops clinic scheduling, insurance claim workflows, and patient engagement mobile apps.",
             ["HealthTech", "Flutter", "PostgreSQL", "HIPAA-style Privacy"]),
            ("Ramallah Tech Hub — Orbit Labs", "team@orbitlabs.ps", "orbitlabs.ps", "Startup Studio", "Ramallah, Palestine",
             "Orbit Labs incubates early-stage founders and ships MVPs in logistics, edtech, and civic tech.",
             ["Product Management", "React", "Node.js", "Startup Mentorship"]),
            ("Hebron Digital Works", "careers@hebrondigital.ps", "hebrondigital.ps", "ERP & Business Software", "Hebron, Palestine",
             "Hebron Digital Works implements inventory, payroll, and accounting modules for SMEs in the southern West Bank.",
             ["ERP", "SQL Server", "Business Analysis", "Accounting Systems"]),
            ("Nablus Innovation Factory", "hello@nif.ps", "nif.ps", "Hardware & Software Prototyping", "Nablus, Palestine",
             "NIF supports makerspaces, PCB design, and firmware development for An-Najah student spin-offs.",
             ["Embedded Systems", "PCB Design", "IoT", "Prototyping"]),
            ("Jenin AgriTech Cooperative", "jobs@jeninagritech.ps", "jeninagritech.ps", "Agricultural Technology", "Jenin, Palestine",
             "Jenin AgriTech builds crop monitoring, cooperative marketplaces, and cold-chain traceability tools.",
             ["IoT", "GIS", "Mobile Apps", "Supply Chain"]),
            ("Quds Analytics", "data@qudsanalytics.ps", "qudsanalytics.ps", "Data Consultancy", "Jerusalem, Palestine",
             "Quds Analytics helps NGOs and municipalities with impact measurement, dashboards, and survey tooling.",
             ["Power BI", "Python", "Survey Design", "Impact Reporting"]),
            ("Tulkarm Software Collective", "careers@tsc.ps", "tsc.ps", "Cooperative Software House", "Tulkarm, Palestine",
             "A worker-owned collective delivering websites, mobile apps, and accessibility audits for public institutions.",
             ["WordPress", "React Native", "Accessibility", "Public Sector"]),
            ("Gaza Sky Labs", "talent@gazaskylabs.ps", "gazaskylabs.ps", "Remote-First Product Studio", "Gaza, Palestine",
             "Gaza Sky Labs builds remote collaboration tools, e-learning platforms, and donation management systems.",
             ["Remote Collaboration", "React", "Firebase", "EdTech"]),
            ("Bethlehem XR Studio", "immersive@bethlehemxr.ps", "bethlehemxr.ps", "Immersive Media", "Bethlehem, Palestine",
             "Bethlehem XR Studio creates virtual tours, AR heritage experiences, and training simulations.",
             ["Unity", "3D Modeling", "AR/VR", "Cultural Heritage"]),
            ("Palestine Open Data Initiative", "open@podi.ps", "podi.ps", "Civic Technology", "Ramallah, Palestine",
             "PODI publishes open datasets, transparency dashboards, and API gateways for civic accountability projects.",
             ["Open Data", "API Design", "GIS", "Civic Tech"]),
            ("West Bank Cyber Range", "training@wbcyber.ps", "wbcyber.ps", "Cybersecurity Training", "Ramallah, Palestine",
             "West Bank Cyber Range runs red-team exercises, SOC simulations, and An-Najah security bootcamps.",
             ["Cybersecurity", "SOC", "Penetration Testing", "Security Training"]),
        };

        public static readonly (string Name, string Specialization, string Department, string[] Research, string[] Technical)[] AdditionalDoctors =
        {
            ("Dr. Issa Zawahreh", "Cloud Computing", "Computer Science", ["Serverless", "Multi-Cloud", "Cost Optimization"], ["AWS", "Kubernetes", "Go"]),
            ("Dr. Muna Shtayeh", "Software Architecture", "Software Engineering", ["Microservices", "Event-Driven Systems", "Domain-Driven Design"], ["Architecture Patterns", "Kafka", "C#"]),
            ("Dr. Basel Awartani", "Cybersecurity", "Information Technology", ["Distributed Ledgers", "Smart Contracts", "FinTech Security"], ["Solidity", "Cryptography", "Penetration Testing"]),
            ("Dr. Shireen Odeh", "Data Science", "Computer Science", ["Genomic Pipelines", "Medical Data", "Computational Biology"], ["Python", "R", "Bioinformatics"]),
            ("Dr. Kamal Srouji", "Robotics", "Computer Engineering", ["Autonomous Navigation", "SLAM", "Control Systems"], ["ROS", "C++", "Computer Vision"]),
            ("Dr. Lina Jaradat", "Software Engineering", "Information Technology", ["Learning Analytics", "Adaptive Learning", "Educational Platforms"], ["LMS", "Learning Analytics", "UX Research"]),
            ("Dr. Yazan Natsheh", "Computer Architecture", "Computer Science", ["GPU Computing", "HPC", "Scientific Simulation"], ["CUDA", "MPI", "C++"]),
            ("Dr. Hiba Qutob", "Cybersecurity", "Computer Engineering", ["Malware Analysis", "Digital Forensics", "Threat Intelligence"], ["Forensics", "SIEM", "Linux"]),
            ("Dr. Murad Hanania", "Computer Networks", "Computer Engineering", ["5G NR", "Massive MIMO", "Signal Processing"], ["MATLAB", "Wireless Protocols", "RF"]),
            ("Dr. Salma Khatib", "Artificial Intelligence", "Artificial Intelligence", ["Arabic NLP", "Speech Recognition", "Information Retrieval"], ["Python", "Transformers", "NLP"]),
            ("Dr. Anas Mitri", "Software Engineering", "Computer Science", ["Serious Games", "Graphics Programming", "Game AI"], ["Unity", "C#", "Shader Programming"]),
            ("Dr. Rula Canavati", "Data Science", "Information Technology", ["Optimization", "Scheduling", "Simulation"], ["Python", "Operations Research", "Simulation"]),
            ("Dr. Tamer Abu Ghosh", "Digital Systems", "Computer Science", ["Rendering", "Visualization", "GPU Shaders"], ["OpenGL", "C++", "Visualization"]),
            ("Dr. Nadia Saca", "Information Systems", "Information Technology", ["EHR Systems", "Clinical Decision Support", "Medical Standards"], ["HL7", "SQL", "Healthcare IT"]),
            ("Dr. Fares Hanania", "Artificial Intelligence", "Computer Science", ["Quantum Algorithms", "Quantum Simulation", "Linear Algebra"], ["Qiskit", "Python", "Linear Algebra"]),
            ("Dr. Dalia Sabbagh", "Software Engineering", "Software Engineering", ["CI/CD", "Infrastructure as Code", "Observability"], ["Terraform", "Docker", "Prometheus"]),
            ("Dr. Ziad Rishmawi", "Network Engineering", "Computer Engineering", ["Spatial Analysis", "Remote Sensing", "Urban Planning"], ["ArcGIS", "QGIS", "Python"]),
            ("Dr. Amira Darwish", "Artificial Intelligence", "Artificial Intelligence", ["Collaborative Filtering", "Context-Aware Recommendations", "Evaluation"], ["Python", "Machine Learning", "A/B Testing"]),
            ("Dr. Nabil Yasin", "Computer Architecture", "Computer Science", ["Model Checking", "Theorem Proving", "Program Verification"], ["TLA+", "Coq", "Logic"]),
            ("Dr. Hala Mitri", "Embedded Systems", "Computer Engineering", ["Smart Cities", "Sensor Networks", "Edge Analytics"], ["MQTT", "LoRaWAN", "Embedded Systems"]),
            ("Dr. George Sbeih", "Digital Systems", "Computer Science", ["Language Design", "Static Analysis", "LLVM"], ["C++", "Compilers", "LLVM"]),
            ("Dr. Reem Awad", "Software Engineering", "Information Technology", ["Online Communities", "Trust & Safety", "Human Computation"], ["Social Network Analysis", "Python", "HCI"]),
            ("Dr. Waleed Farah", "Data Science", "Computer Science", ["Indexing", "Distributed Databases", "NewSQL"], ["PostgreSQL", "Distributed Systems", "SQL"]),
            ("Dr. Dina Masri", "Embedded Systems", "Computer Engineering", ["Immersive Learning", "Spatial Computing", "3D Interaction"], ["Unity", "OpenXR", "3D Interaction"]),
            ("Dr. Sami Qasem", "Software Engineering", "Software Engineering", ["Fault Tolerance", "Chaos Engineering", "SRE"], ["SRE", "Chaos Engineering", "Monitoring"]),
        };

        public static readonly (string Name, string Username, string Category, string Faculty, string Description)[] AdditionalAssociations =
        {
            ("ACM An-Najah Student Chapter", "acm-anajah", "Technical", NajahSeedConstants.UniversityFaculty,
             "ACM An-Najah hosts competitive programming training, industry seminars, and coding interview workshops."),
            ("Linux User Group — An-Najah", "lug-anajah", "Technical", NajahSeedConstants.UniversityFaculty,
             "Linux User Group at An-Najah promotes open-source adoption, server administration workshops, and campus infrastructure projects."),
            ("Design Thinking Society — An-Najah", "design-anajah", "Cultural", NajahSeedConstants.UniversityFaculty,
             "Design Thinking Society at An-Najah runs ideation sprints, prototyping nights, and social innovation challenges."),
            ("FinTech Student Network — An-Najah", "fintech-anajah", "Technical", "School of Business",
             "FinTech Network at An-Najah connects students with payment startups, hackathons, and compliance workshops."),
            ("IEEE Women in Engineering — An-Najah", "wie-anajah", "Volunteer", NajahSeedConstants.UniversityFaculty,
             "IEEE WIE An-Najah mentors women engineers through technical talks, shadowing, and leadership programs."),
            ("Palestine Makerspace Alliance — An-Najah", "makers-anajah", "Technical", NajahSeedConstants.UniversityFaculty,
             "Makerspace Alliance at An-Najah operates 3D printers, electronics benches, and hardware mentorship hours."),
            ("Student Consultancy Group — An-Najah", "consult-anajah", "Cultural", "School of Business",
             "Student Consultancy at An-Najah delivers pro-bono digital strategy projects for local NGOs."),
            ("Cloud Native Club — An-Najah", "cloudnative-anajah", "Technical", NajahSeedConstants.UniversityFaculty,
             "Cloud Native Club at An-Najah studies Kubernetes, observability stacks, and platform engineering career paths."),
            ("Media & Design Society — An-Najah", "media-anajah", "Media", NajahSeedConstants.UniversityFaculty,
             "Media Society at An-Najah produces campus documentaries, motion graphics tutorials, and live event coverage."),
        };

        public static readonly (string Name, string Abstract, string[] Skills, int Partners, string Type)[] AdditionalProjects =
        {
            ("Digital Twin for Campus Buildings", "Energy and occupancy digital twin integrating BACnet sensors with a facilities dashboard.", ["IoT", "React", "Time-Series Databases", "GIS"], 4, "GP"),
            ("Palestinian Dialect Speech Assistant", "Voice assistant tuned for Palestinian Arabic commands in university service kiosks.", ["NLP", "Python", "Speech Recognition", "Embedded Systems"], 3, "GP"),
            ("Microgrid Load Balancer", "Scheduler optimizing solar-battery usage across faculty buildings during peak lecture hours.", ["Python", "Optimization", "IoT", "React"], 3, "GP1"),
            ("Clinical Trial Matching Portal", "Platform matching eligible patients with university hospital research studies.", ["ASP.NET Core", "PostgreSQL", "Privacy Engineering", "React"], 4, "GP"),
            ("Heritage Site AR Guide", "Augmented reality walking tour for historic Nablus neighborhoods with offline map packs.", ["Unity", "AR/VR", "Mobile Development", "GIS"], 4, "GP2"),
            ("Open Budget Tracker", "Municipal budget visualization with citizen feedback loops and downloadable datasets.", ["React", "Open Data", "PostgreSQL", "Accessibility"], 3, "GP"),
            ("Fleet Maintenance Scheduler", "Route-aware maintenance planning for university shuttle and service vehicles.", ["Algorithms", "React", "PostgreSQL", "Maps"], 3, "GP"),
            ("Peer Code Review Platform", "Git-integrated review assignments for software engineering courses and capstones.", ["React", "Node.js", "Git", "OAuth"], 3, "GP"),
            ("Smart Locker System", "RFID locker allocation for labs with overdue alerts and usage analytics.", ["Arduino", "React", "PostgreSQL", "IoT"], 3, "GP1"),
            ("Disaster Response Coordination", "Volunteer dispatch and supply tracking for civil defense training scenarios.", ["Flutter", "Firebase", "GIS", "Logistics"], 4, "GP"),
            ("Legal Aid Case Intake", "Structured intake workflow for law clinic students serving community clients.", ["ASP.NET Core", "React", "PostgreSQL", "Accessibility"], 3, "GP"),
            ("Music Practice Room Booking", "Queue-free booking with occupancy sensors and fair-use policies.", ["React", "PostgreSQL", "IoT", "Real-Time Updates"], 3, "GP"),
            ("Campus Carbon Footprint Dashboard", "Aggregates transport, electricity, and waste metrics with reduction recommendations.", ["Python", "Power BI", "Data Engineering", "Sustainability"], 3, "GP2"),
            ("Sign Language Video Dictionary", "Searchable Palestinian sign dictionary with slow-motion instructional clips.", ["React", "Computer Vision", "Accessibility", "Video Processing"], 4, "GP"),
            ("Lab Equipment Sharing", "Checkout system for oscilloscopes, 3D printers, and fabrication tools with damage reporting.", ["React Native", "PostgreSQL", "QR Codes", "Inventory Management"], 3, "GP"),
            ("Student Housing Marketplace", "Verified sublet listings with roommate matching and safety checklist flows.", ["React", "Node.js", "PostgreSQL", "Trust & Safety"], 3, "GP"),
            ("Exam Integrity Monitor", "Privacy-preserving proctoring signals for computer-based testing labs.", ["Python", "Computer Vision", "Privacy Engineering", "React"], 3, "GP1"),
            ("Community Garden Planner", "Crop rotation planner with weather forecasts and volunteer shift scheduling.", ["React", "GIS", "Python", "Mobile Development"], 3, "GP"),
            ("University Podcast Network", "Publishing workflow for faculty and student shows with transcript search.", ["Node.js", "React", "NLP", "PostgreSQL"], 3, "GP"),
            ("Scholarship Eligibility Engine", "Rule-based eligibility checker across internal and external funding programs.", ["ASP.NET Core", "PostgreSQL", "Business Rules", "React"], 3, "GP"),
        };

        public static readonly (string Code, string Name, string Semester)[] AdditionalCourses =
        {
            ("CS309", "Operating Systems", "Fall 2024"),
            ("CS310", "Compiler Design", "Spring 2025"),
            ("CS311", "Computer Graphics", "Fall 2024"),
            ("CS312", "Distributed Systems", "Spring 2025"),
            ("CS313", "Information Security", "Fall 2025"),
            ("CS314", "Human-Computer Interaction", "Spring 2025"),
            ("CS315", "Cloud Computing", "Fall 2025"),
            ("CS316", "Internet of Things", "Spring 2026"),
            ("CS317", "Natural Language Processing", "Fall 2025"),
            ("CS318", "Software Testing", "Spring 2026"),
            ("CS319", "Parallel Programming", "Fall 2024"),
            ("CS320", "Game Development", "Spring 2026"),
        };

        public static readonly string[] ExtraStudentPostTemplates =
        {
            "Wrapped up our midterm demo for the embedded systems lab — motor control calibration took longer than expected but the results are solid.",
            "Looking for a teammate with PostgreSQL and ASP.NET Core experience for a civic tech capstone starting in September.",
            "Our IEEE branch hosted a soldering workshop yesterday — great turnout from first-year engineering students.",
            "Published a case study on optimizing React rendering for our internship portfolio review.",
            "Attending the An-Najah career fair next week — happy to share recruiter contacts for software roles.",
            "Finally got our CI pipeline green after fixing flaky integration tests in the backend service.",
            "Seeking a UX partner for an accessibility-focused graduation project on campus navigation.",
            "Completed the cybersecurity club CTF — learned a lot about log correlation and threat hunting.",
        };

        public static readonly string[] ExtraDoctorPostTemplates =
        {
            "Reminder: capstone proposal defenses are scheduled for the week of March 17 in Engineering Building Hall B.",
            "Our research group is recruiting two students for a summer Arabic speech corpus annotation project.",
            "Guest lecture on secure API gateways — Thursday 11:00 AM, Room 302.",
            "Updated reading list for Advanced Machine Learning now available on the course portal.",
            "Congratulations to the team that placed second in the regional robotics competition.",
            "Office hours extended during finals week — see the updated timetable on the faculty page.",
        };

        public static readonly string[] ExtraMessageTemplates =
        {
            "Could you review the API contract draft before our meeting with the company mentor?",
            "I pushed the latest changes to the feature branch — the enrollment module is ready for testing.",
            "Thanks for confirming your availability for the supervision meeting next Tuesday.",
            "We still need one more backend developer to balance the team before submission.",
            "The registration form looks good — I will share it with our events committee tonight.",
            "Are you open to pairing on the database migration scripts this weekend?",
            "I saw your profile on SkillSwap and think your React Native experience fits our field app idea.",
            "Following up on the internship opportunity you posted last week.",
        };
    }
}
