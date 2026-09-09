# Ministry of Ayush - Industry Partnership Portal
### National Academia-Industry Collaborative Platform for Skill Mapping, Internships & Placements

Developed for the **Smart India Hackathon (SIH)**, this platform bridges the gap between academic institutions (BAMS, BHMS, BNYS, BUMS, BSMS colleges) and leading industry enterprises across all AYUSH streams:
* **A**yurveda
* **Y**oga & **N**aturopathy
* **U**nani
* **S**iddha
* **H**omeopathy

---

## 🌟 Key Features

### 1. Phase 1 - Core User Roles
* **👨‍⚕️ Student Portal**:
  * Comprehensive Ayush profile setup with stream specialization (Ayurveda, Yoga, Naturopathy, Unani, Siddha, Homeopathy).
  * Interactive standardized **Skill Assessments** with instant clinical badge credentials.
  * Real-time **Internship Application Tracker** with status pipelines (Applied &rarr; Under Review &rarr; Shortlisted &rarr; Interview Scheduled &rarr; Offered).
* **🏭 Industry Partner Portal**:
  * Partner registration with **AYUSH Drug License & GMP Certification** verification.
  * **Internship & Fellowship Posting Engine** with required skill tag mappings.
  * **Candidate Shortlisting Drawer** displaying students' degrees, AI match scores, and verified competency matrices.
  * One-click **Video Interview Scheduler** with auto-generated secure meeting links (Jitsi Meet).
* **🛡️ Ministry Admin Dashboard**:
  * Regulatory verification queue to accredit industry partners.
  * Compliance review workflow to approve internship postings and stipend norms.
  * Exportable compliance & placement reports.

### 2. Phase 2 - Smart Automation
* **🧠 AI Skill Mapping Engine**:
  * Semantic keyword & NLP matching between student verified competencies and recruiter prerequisites.
  * Transparent match score calculation (0–100%) with matching skill badges and gap advisories.
* **📊 Placement & Demand Analytics**:
  * Interactive visual charts (built with **Recharts**) showing discipline distribution, industry demand vs certified supply, and placement growth trajectories.

### 3. Phase 3 - Value-Add Capabilities
* **📹 Live Video Interview Rooms**:
  * Direct one-click entry into encrypted video rooms for student-recruiter interactions.
* **📜 Document Verification**:
  * Degree certificates and state council registrations verified by Ministry protocols.
* **🔔 Notification Center**:
  * Real-time alert bell showing application status updates, interview schedules, and new matching internships.

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18 or higher (v24 tested)
* **npm**: v10 or higher

### 1. Start Backend Server
```bash
cd server
npm install
npm run dev
# Server will run on http://localhost:5000
```

### 2. Start Frontend Client
```bash
cd client
npm install
npm run dev
# Client will run on http://localhost:5173
```

---

## ⚡ 1-Click Fast Demo Logins

For live evaluation, the login page features quick demo buttons to switch between accounts instantly:

| Role | Demo Email | Demo Password | Purpose |
|---|---|---|---|
| **Student** | `student@ayush.gov.in` | `ayush123` | BAMS Final Year Candidate (Dr. Ananya Sharma) |
| **Industry Partner** | `recruiter@dabur.com` | `ayush123` | Lead Recruiter at Dabur R&D Centre |
| **Ministry Admin** | `admin@ayush.gov.in` | `admin123` | Verification Directorate, Ministry of Ayush |

---

## 🛠️ Architecture & Tech Stack

```
academia-industry-portal/
├── client/                     # Vite + React 19 Frontend
│   ├── src/
│   │   ├── components/         # Navbar, Footer, ProtectedRoute
│   │   ├── context/            # AuthContext (state & demo role switcher)
│   │   ├── pages/              # 9 dedicated pages for Student, Industry & Admin
│   │   └── services/           # Axios REST API client
│   └── package.json
└── server/                     # Express.js REST API Backend
    ├── services/               # Ayush Skill Matcher & Semantic Scoring Engine
    ├── db.js                   # Persistent zero-config data store with Ayush seed dataset
    ├── server.js               # REST endpoints & JWT authentication
    └── package.json
```
