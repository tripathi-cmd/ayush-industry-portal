# Skill Connect — Academia–Industry Collaboration Portal
### Unified Platform for Skill Assessment, Internships, Mentorship & Placements

Skill Connect bridges the gap between academic institutions, industry recruiters, mentors, and students through standardized skill profiling, explainable compatibility matching, and structured career development.

---

## 🌟 Four Core Portals

1. **Student Portal** (`/student`)
   - Edit academic background, technical skills, and soft competencies.
   - Take standardized skill assessments with real completion history and question rationales.
   - View explainable skill compatibility scores (matching vs. missing skills).
   - Search and apply for approved internships and entry-level positions.
   - Receive guidance and track learning goals assigned by mentors.

2. **Recruiter Portal** (`/recruiter`, redirects from `/industry`)
   - Company profile with approval verification state.
   - Submit internship and job openings with required skill tags for administrative review.
   - Manage postings and review applicants with transparent skill compatibility scores.
   - Shortlist, reject, make offers, and schedule interviews with recruiter-supplied meeting URLs.

3. **Academic & Industry Mentor Portal** (`/mentor`)
   - Mentor profile with domain expertise and approval verification state.
   - View only assigned students paired by administrators.
   - Review submitted student skills and assessment attempt history.
   - Post actionable feedback and assign practical learning goals with progress tracking.

4. **Administrator Console** (`/admin`)
   - Real database metrics for students, recruiters, mentors, opportunities, and applications.
   - Review and approve/reject pending recruiters and mentors.
   - Review and approve/reject submitted opportunities before publication.
   - Pair verified mentors with students.

---

## 🔒 Security & Architecture Highlights

- **HttpOnly Cookie Authentication**: Database-backed sessions using `sc_session` HttpOnly cookies with revocation upon logout (no tokens in `localStorage`).
- **Role-Based Access Control (RBAC)**: Strict role and ownership enforcement on every protected API endpoint (`student`, `recruiter`, `mentor`, `admin`).
- **Fail-Closed Routing**: Unauthorized route access immediately redirects to the user's canonical dashboard.
- **Explainable Skill Matching**: Exact token matching with deduplication, preventing false substring matches (e.g. Java does not match JavaScript).
- **PostgreSQL Persistence**: Powered by `pg.Pool` with parameterized queries, relational constraints, foreign keys, and indexes.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18 or higher
- **PostgreSQL Database** (e.g., Neon serverless PostgreSQL)

### 1. Environment Configuration
Create a `.env` file in `server/` (or at the root):

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=your-secure-jwt-secret-key-at-least-32-chars
PORT=5000
ADMIN_EMAIL=admin@skillconnect.org
ADMIN_PASSWORD=AdminSecurePassword123!
