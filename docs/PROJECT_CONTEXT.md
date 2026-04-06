You are working on a graduation project called SkillSwap.

Project Overview:
SkillSwap is an AI-based academic and collaboration matching platform. Its goal is to connect students, supervisors, companies, and associations based on skills, needs, and intelligent analysis — not personal relationships.

This is NOT a course management system (not like Zajel). It does NOT include attendance, grades, or assignments.

Core Idea:
The system takes:
- People (students, doctors)
- Needs (projects, company requests, association requests)
- Data (skills, profiles, past projects)

Then uses AI to:
- Match students to teams
- Suggest supervisors for projects
- Recommend candidates for companies
- Suggest teams for associations
- Reuse and improve old graduation projects

Main Users:
- Student (main user)
- Doctor (supervisor)
- Company
- Association
- Legacy Projects (old projects with reviewer feedback)

Main Modules:
1. Profile System (skills, interests, major, etc.)
2. Graduation Projects
3. AI Matching Engine (core of the system)
4. Company Requests
5. Association Requests
6. Legacy Projects (reuse & improvement)
7. Notifications

Main User Flows:
1. Student → Create Project → AI suggests team + supervisor
2. Student → Browse → AI suggests projects/teams → Join
3. Company → Create Request → AI suggests candidates
4. Association → Create Request → AI suggests teams
5. Legacy Projects → AI suggests reuse/improvement

Important Rules:
- AI is the core of the system (not a secondary feature)
- Do not implement LMS features (no attendance, no grading)
- Focus on matching, recommendations, and intelligent suggestions
- Use existing project structure (ASP.NET Core backend + React frontend)
- Do not create mock data unless explicitly requested
