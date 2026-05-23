# SkillSwap — How the Platform Works (Product Story)

SkillSwap is an academic matching platform. It helps students form graduation project teams, find supervisors, join course projects, connect with companies for talent opportunities, and engage with student organizations. Matching is driven by skills, profiles, and intelligent recommendations—not by personal connections alone. The platform is not a full learning management system: it does not handle attendance, grades, or assignments.

---

## Platform Overview

At its core, SkillSwap answers: *Who should work with whom, on what, and under whose guidance?*

Five kinds of accounts exist:

- **Students** — the main users; they build profiles, run graduation projects, join course teams, follow organizations, and receive opportunities from companies.
- **Doctors (faculty supervisors)** — they supervise graduation projects, teach courses, assign course projects, and can auto-generate or manage student teams.
- **Companies** — they search for students whose skills fit internships, collaborations, or hiring needs.
- **Student associations / organizations** — they publish events, run recruitment campaigns, and grow membership.
- **Admins** — supported at login level; not a major product surface in the current backend.

Everyone signs in with email and password, or students can use Google sign-in. After login, each person sees their own profile and role-specific tools.

---

## Student Journey

### Joining the platform

A new student registers with name, email, password, university ID, university, faculty, major, academic year, optional GPA, profile photo, and initial skills grouped as **roles** (e.g. team role), **technical skills**, and **tools**. The system creates the account and a student profile in one step. Skills can be new names—the platform adds unknown skill names so they can be reused later.

The student can log in immediately and see their profile. They can later enrich it: bio, availability, what they are looking for, GitHub, LinkedIn, portfolio, languages, and more skills. Profile completeness is scored (photo, roles, technical skills, bio, GPA) and shown as “profile strength” on the dashboard.

### Before a graduation project

If Ahmad has **no** graduation project yet, his dashboard shows:

- How complete his profile is  
- Suggested teammates (other students ranked by skill overlap and complementary skills)  
- How many open graduation projects might fit his skills  
- How many pending team invitations he has (graduation + course)  
- That he has no current project affiliation  

He can browse all students with filters (skill, university, major, search, “available only” — meaning not already tied to any graduation project). Each listing includes a match score against his skills.

He can also use global search for students and doctors by name, email, major, faculty, skills, etc.

### Creating a graduation project

When Ahmad is ready to lead, he creates a graduation project with:

- Title and abstract  
- Required skills (as a list of skill names)  
- How many partners he wants (**team size includes him as leader**)  
- Project type: for Engineering & IT faculty only — GP1, GP2, or full GP; for other faculties — GP only  

**Rules the platform enforces:**

- A student may **own only one** graduation project.  
- A student may be **owner or member of only one** graduation project at a time.  
- When created, Ahmad is automatically the first team member with the **leader** role.  

He gets a confirmation notification that the project was created.

### Finding teammates (without AI)

As project owner, Ahmad can:

- See students in the **same major** ranked by overlap with **his** skills (available-students list).  
- See students ranked by overlap with the **project’s required skills** (recommended-students list).  
- See who is already on the team, who has a pending invite, who already owns another project, and whether the team is full.  

He **cannot** invite students who already own a graduation project.

He sends invitations. Each invitee gets a notification. Ahmad can see sent invitations and cancel pending ones.

### Finding teammates (with AI)

The project owner or team **leader** can request **AI teammate recommendations**. The system:

1. Finds eligible students (same major, not on the team, not project owners).  
2. Prefilters by required skills when listed.  
3. Sends project title, abstract, and skills to AI ranking.  
4. Returns match scores and short reasons.  

If AI is unavailable, skill-overlap scoring is used instead. Very low scores are filtered out.

### Receiving and responding to invitations

Another student can invite Ahmad, or he can receive invites as project owner.

- **Accept** — he joins as a **member**; other pending invites **to him** expire; teammates are notified.  
- **Reject** — the sender is notified.  
- **Cancel** (sender only) — the receiver is notified.  

### Joining without an invitation

Ahmad can browse all graduation projects and **join directly** if the team is not full, he is not the owner, and he is not already in another project. The team is notified when someone joins.

### Team life inside the project

The team has a **leader** (starts as owner; leadership can be transferred). The leader can:

- Remove members (not themselves)  
- Transfer leadership to another member  
- Update project details (name, abstract, skills, team size, type where allowed)  
- Delete the project (owner only)  

Members can **leave** unless they are the leader (leaders must delete the project instead). Join, leave, removal, and leadership changes all trigger notifications to affected people.

### Supervisor flow

When the team needs a faculty supervisor, the **leader** can:

- Browse **recommended supervisors** — doctors whose department aligns with the student’s major, ranked by how well their specialization matches required skills.  
- Request **AI supervisor recommendations** — broader matching (e.g. Computer Engineering students may also see Electrical Engineering faculty); AI ranks by fit and returns reasons.  
- Send a **supervision request** to a chosen doctor (only if the project has no supervisor yet).  

The doctor sees the request with project details, skills, and current team. The doctor can **accept** (becomes supervisor; other pending requests for that project are auto-rejected and those doctors are notified) or **reject** (leader is notified).

The leader can request **cancellation of supervision**; the doctor accepts (supervisor removed) or rejects.

The doctor may also **resign** from supervision directly; the project loses its supervisor and the team is notified.

### Discovery and “my project”

Students can list all graduation projects, filter by owner or supervising doctor, open one project’s details, and see “my project” as owner or member—or nothing if unaffiliated.

There is **no** built-in graduation-project progress tracker (milestones, percent complete, etc.). Progress in practice means team composition, supervisor status, and project metadata updates.

### Course-related student experience (when enrolled)

Doctors add students to course **sections**. Enrolled students see their courses, section chat, course projects, and teams.

For course projects in **student** mode, students build teams themselves: browse classmates, get AI teammate suggestions, send team invitations (stored as notifications), accept/reject. Cross-section teams may be blocked depending on project settings.

For **doctor** mode, the instructor generates teams automatically (see Doctor Journey); students are assigned and notified.

Course team members can chat in a **team channel**. They can also use **private messaging** with any user (start conversation, send, edit, unsend, mark read).

### Organizations and recruitment (student side)

Students can:

- Discover public organization profiles  
- Follow / unfollow organizations  
- See upcoming events on organization pages  
- View event details and registration **form definitions** (organizations build forms; student **submission** of event registrations is not implemented in the backend—only form structure is exposed)  
- Browse **published** recruitment campaigns before the deadline  
- Apply to a position with custom questions (text, choices, files, etc.)  
- Track application status; on acceptance they may become organization members and get notifications  

Students see organizations they follow and memberships they hold (including roles joined via recruitment).

### Company talent (student as passive participant)

Companies search students; students are **not** sent company “invitations” in the backend. They appear in search results when their profile matches a company’s talent need. There is no student-facing accept/decline flow for company outreach in the current implementation.

### Messaging and notifications (student)

**Private messages:** one-to-one conversations between any users; notifications for new messages, edits, deletes, and new conversations.

**Graduation project notifications** include: project created/updated/deleted; member joined/left/removed; leader changed; invitations received/rejected/cancelled/expired; supervision requested/accepted/rejected/auto-rejected; supervisor cancellation requested/accepted/rejected; doctor resigned supervision.

**Course notifications** include: added to section; course project created/updated/deleted; teams generated; team member added/removed; course teammate invitations.

**Organization notifications** include: new event for followers; recruitment application accepted/rejected.

Notifications can be listed, filtered by category, marked read individually or in bulk, and pushed in real time where configured. Chat-related notifications can be cleared by “scope” (e.g. a section or team).

---

## Doctor Journey

### Registration and profile

A doctor registers with name, email, password, university, faculty, department, specialization, bio, and photo. They can later update department, faculty, specialization, experience, LinkedIn, office hours, bio, photo, technical skills, and research skills.

Their dashboard summary is lighter than a student’s (no teammate suggestions or graduation project counts).

### Supervising graduation projects

From the doctor home:

- **Pending supervision requests** — full project context, team, skills, requesting student; accept or reject.  
- **Supervised projects** — all projects where they are the current supervisor.  
- **Pending cancellation requests** from student leaders.  
- **Dashboard counts** — pending requests, active supervised projects, pending cancellations.  

They can **resign** from any project they supervise.

### Courses and sections

A doctor creates **courses** (name, code, semester). For each course they create **sections** with name, meeting days, time window, and capacity.

They **add students** to sections by student identifiers. Added students are notified.

They view enrolled students per section.

### Course projects and AI modes

For each course, the doctor creates **course projects** with:

- Title, description, team size  
- Whether it applies to all sections or selected sections  
- Whether teams can mix students from different sections  
- **AI mode:**  
  - **Doctor mode** — the instructor runs **automatic team generation**.  
  - **Student mode** — students form teams manually (invitations + optional AI suggestions).  

Creating, updating, or deleting a course project notifies affected enrolled students.

### Automatic team generation (doctor mode only)

When AI mode is “doctor,” the doctor triggers **generate teams** for a project. The platform:

1. Collects all students enrolled in the relevant section(s).  
2. Uses AI to **score** each student’s fit to the project (skills, major, bio).  
3. Builds **complementary teams** deterministically from those scores (balanced skill mix, fixed team size).  
4. Saves teams and notifies every assigned student.  

The doctor can review teams, add a member to a team (by university ID), or remove a member—with notifications to the team and moved student if applicable.

Doctors can open a **group conversation** with a course team (doctor + all team members) for guidance.

### Communication

- **Section chat** — doctors are not in section chat in the same way students are; students chat per section.  
- **Team conversations** — doctor-initiated group chat with a course team.  
- **Private messaging** — same as other roles.  

### Graduation vs course

Doctor graduation supervision is separate from course teaching. A doctor can supervise a student’s **graduation project** while also teaching them in a **course** with different teams.

---

## Company Journey

### Registration

Before or during signup, a company can run **AI company analysis** from website and/or LinkedIn URLs (and optional description). AI infers industry, description, and related metadata to pre-fill registration.

The company registers with contact name, email, password, company name, industry, description, location, website, and LinkedIn. At least a website, LinkedIn, or a sufficiently long description is required.

### Profile

The company sees its profile: name, industry, description, location, web links, email.

### Talent search (core company workflow)

The company defines a **talent need**:

- Title and description of the opportunity  
- Required skills  
- Optional preferred major  
- Engagement type and duration (e.g. internship, part-time)  
- Option to **save** the search as a remembered request  

The platform finds students (optionally filtered by major), scores skill overlap, then runs **AI ranking** tailored to the company need. Results include match score, explanation, and highlights. If AI fails, rule-based matching still returns candidates above a minimum score.

The company can list its **saved talent requests** (recent searches) for reference.

### What companies cannot do (in current backend)

- There are **no** company-to-student invitations or in-app collaboration contracts.  
- Students do not receive company-specific notification types for outreach.  
- Discovery is **search-driven** from the company side only.

---

## Organization / Association Journey

### Registration and profile

A student association registers with association name, unique username, email, password, faculty, category (from allowed types), description, logo, and social links. They manage their public identity: name, description, faculty, category, logo, Instagram, Facebook, LinkedIn, verification flag.

### Public presence

Anyone authenticated can browse organizations. Students see follower counts and whether they follow. Organization pages show upcoming events, leadership team on display, and general members (from accepted recruitment).

### Events

Organizations create events with title, description, type, category, date, location or online flag, registration deadline, max participants, cover image.

When a new event is created, **followers** get notifications.

Organizations can build **registration forms** (custom fields: text, choice, file placeholders, links, etc.). Students can **view** form structure on public event pages; **submitting** registrations is not implemented in the backend.

### Recruitment campaigns

Organizations create campaigns with title, description, deadline, cover, published/draft flag, **positions** (role title, how many needed, description, requirements, skills), and **application questions** (global or per position).

Students see only **published** campaigns before the deadline. They apply once per position, answering required questions (including file uploads). Organizations review applications, run **AI applicant ranking** per position (considering profile, answers, prior engagement with the org, followers, etc.), accept or reject.

**Acceptance** automatically syncs **organization membership** (and may add leadership showcase entries for certain roles). Students get acceptance/rejection notifications and can see membership on their profile.

Organizations can **regenerate** AI rankings with preferences (exclude certain students, exclude rejected applicants, etc.).

### Team display and membership

Organizations maintain a **leadership team** list (names, roles, photos, LinkedIn—can link to student accounts or stand-alone entries).

**Members** accepted via recruitment appear in the public member list with role titles. The org can list all members filtered by membership kind (e.g. general member vs leadership).

There is no separate “invite member without recruitment” flow in the reviewed controllers—membership ties heavily to recruitment acceptance and leadership records.

### Following

Students follow organizations to stay informed (e.g. new events). Organizations cannot follow themselves.

---

## Legacy Graduation Projects

The product documentation mentions reusing old graduation projects with reviewer feedback. **This is not implemented in the backend.** There is no storage, browsing, review, or AI reuse flow for legacy projects in the current codebase. All graduation project behavior refers to **live student-owned projects** only.

---

## AI Features (Conceptual)

| Feature | What AI tries to do |
|--------|----------------------|
| **Student / teammate recommendations (graduation)** | Rank classmates who would strengthen the project given title, abstract, and required skills—not just keyword overlap. |
| **Supervisor recommendations** | Rank faculty whose specialization and background fit the project, including nuanced fit beyond exact skill string matches. |
| **Course manual team recommendations** | Same idea for course projects when students pick teammates; blends skill overlap with AI ordering. |
| **Automatic course team generation** | Score each enrolled student’s relevance, then build complementary teams so each group covers diverse skills at the target size. |
| **Company talent search** | Match students to a described role/engagement with reasons and highlights for recruiters. |
| **Organization applicant ranking** | Rank applicants for a position using campaign context, role requirements, answers, and engagement history; suggest who fills open seats. |
| **Company profile analysis (signup)** | Infer company profile fields from public web presence to reduce manual data entry. |

When AI is unavailable (missing configuration or errors), the platform falls back to **skill overlap and rule-based scores** so flows still work, usually with less nuanced explanations.

---

## Notifications & Communication

### Channels

1. **In-app notification inbox** — categorized (graduation project, course, chat, organization event, organization recruitment).  
2. **Real-time push** — via notification hub where enabled.  
3. **Private messaging** — persistent conversations.  
4. **Section chat** — all students in a section.  
5. **Course team chat** — members of one course team.  
6. **Doctor–team group conversation** — optional for course teams.  

### Typical notification moments

| Area | Student / user experience |
|------|---------------------------|
| Graduation invitations | “Someone invited you to join a project” |
| Invitation outcomes | Accepted, rejected, cancelled, or expired because you joined elsewhere |
| Team changes | Someone joined, left, was removed, or became leader |
| Project updates | Created, edited, or deleted |
| Supervision | Request sent to doctor; accepted/rejected; other doctors auto-rejected; cancellation flow; doctor resigned |
| Course | Enrolled in section; new course project; teams assigned; teammate invite accept/reject |
| Messaging | New message, conversation started, message edited/deleted |
| Section / team chat | New message in channel (with read marking) |
| Organization | New event for followers; recruitment accepted/rejected |

Users mark notifications read one-by-one or all in a category. Chat unread state can clear per section or team scope.

---

## Final Platform Story: Ahmad’s First Semester on SkillSwap

Ahmad registers as a Computer Engineering student, lists skills like React, Python, and “Backend Developer,” and lands on a dashboard that nudges him to complete his bio and photo. He has no graduation project yet, but he already sees six students with high skill compatibility and a count of open projects that match his stack.

He creates a graduation project: an AI-powered campus marketplace, needing three partners and skills in web development and databases. He becomes team leader automatically. The platform suggests teammates; AI recommends Sara and Omar with short reasons. He invites Sara; she accepts. Omar joins another team, so Ahmad invites Layla instead. His team fills.

The leader requests AI supervisor recommendations. Dr. Nasser scores highly. Ahmad sends a supervision request. Dr. Nasser accepts; other pending requests to other doctors close automatically. Everyone gets the right notifications.

Meanwhile Ahmad is enrolled by Dr. Nasser in “Software Engineering Lab.” In that course, a **student-mode** project lets teams self-form. Ahmad uses AI suggestions, sends a course teammate request to a classmate, and gets accepted—forming a second, course-only team with its own team chat.

For his graduation team, Ahmad messages Sara privately and updates the project abstract when the idea evolves. Teammates see “project updated” notifications. He cannot join another graduation project while on this one.

He follows the Robotics Club organization. They publish a hackathon event; he gets notified. He applies to their “Event Coordinator” recruitment campaign, answers custom questions, and waits. The club runs AI ranking on applicants, accepts Ahmad, and he becomes a member—with a welcome-style notification and membership on his profile.

A local startup uses SkillSwap talent search for “React intern, 3 months.” Ahmad’s profile surfaces with a strong match score and an AI-written reason. The company saves the search; Ahmad is unaware unless he hears from them outside the app—there is no in-platform company invitation.

By semester’s end, Ahmad has: one graduation team with a confirmed supervisor, a course team with section and team chats, organization membership from recruitment, a trail of notifications documenting every invite and decision, and a profile that grew richer as skills and links were added. The platform never graded his homework—it connected people, skills, projects, and opportunities in one continuous story.

---

**Note on scope:** This narrative reflects **only behavior present in the backend today**. Features described in early product docs but absent from code—especially **legacy graduation projects**, **company invitations**, **event registration submissions**, and **graduation-project progress tracking**—are omitted or called out explicitly as not implemented.
