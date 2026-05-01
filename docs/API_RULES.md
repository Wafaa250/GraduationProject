# API RULES (Source of Truth)

## 🔐 Auth
POST /api/auth/login  
POST /api/auth/register/student  
POST /api/auth/register/doctor  

---

## 👤 Profile

### Get current user
GET /api/me  

Returns:
- user
- doctorProfile / studentProfile

---

### Update profile
PUT /api/profile  

Used for:
- doctor profile
- student profile

Payload example:
{
  doctorProfile: {
    faculty,
    department,
    specialization,
    yearsOfExperience,
    skills,
    bio,
    officeHours,
    linkedin
  }
}

⚠️ IMPORTANT:
- DO NOT use /api/me for update
- Only use /api/profile

---

## 📊 Dashboard

GET /api/dashboard/summary  
GET /api/dashboard/profile-strength  

---

## 🎓 Projects

GET /api/graduation-projects  
POST /api/graduation-projects  

GET /api/graduation-projects/my  

---

## 🤖 AI

POST /api/ai/recommend-students  
POST /api/ai/recommend-supervisors  

---

# 🚫 RULES

- Never invent endpoints
- Always follow this file
- If endpoint not here → ask before using