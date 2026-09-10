# SkillConnect - Academia-Industry Partnership Portal
### National Multi-Sector Skills Mapping, Internships & Placements Platform

Developed for bridging the gap between academic institutions and leading industry enterprises across **all major sectors** including technology, healthcare, manufacturing, finance, AYUSH, creative industries, and more.

## 🌟 Key Features

### 1. Multi-Industry Support
Supporting diverse sectors:
- **AYUSH**: Ayurveda, Yoga & Naturopathy, Unani, Siddha, Homeopathy
- **Technology**: Software, AI/ML, Web Development, Cloud
- **Healthcare**: Clinical, Nursing, Pharmacy, Lab Sciences
- **Manufacturing**: Engineering, Operations, Quality Assurance
- **Finance & Business**: Accounting, Analytics, Management
- **Creative Industries**: Design, Media, Entertainment
- **And More!**

### 2. Core Functionality

#### 👨‍⚕️ Student Portal:
* Comprehensive profile setup with industry/sector specialization
* Interactive standardized **Skill Assessments** with instant credential badges
* Real-time **Internship Application Tracker** with status pipelines
* AI-powered skill gap recommendations

#### 🏭 Industry Partner Portal:
* Partner registration with credential verification
* **Internship & Fellowship Posting Engine** with required skill tag mappings
* **Candidate Shortlisting** with AI match scores
* One-click **Video Interview Scheduler**

#### 🛡️ Admin Dashboard:
* Partner regulatory verification queue
* Compliance review workflow for internship postings
* Exportable compliance & placement reports
* Industry analytics and skill-demand dashboards

### 3. Phase 2 - Smart Automation
* **🧠 AI Skill Mapping Engine**: Semantic matching between student competencies and recruiter needs
* **📊 Analytics Dashboard**: Interactive charts showing sector distribution, demand vs supply

### 4. Phase 3 - Value-Add Capabilities
* **📹 Live Video Interview Rooms**
* **📜 Document Verification**
* **🔔 Notification Center**

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18 or higher
* **npm**: v10 or higher
* **MongoDB**: (Optional) For cloud database integration

### Environment Setup

1. **Create `.env` file in `server/` directory:**
```
PORT=5000
JWT_SECRET=skillconnect-secure-key-2026
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillconnect
NODE_ENV=development
```

2. **Start Backend Server**
```bash
cd server
npm install
npm run dev
# Server will run on http://localhost:5000
```

3. **Start Frontend Client**
```bash
cd client
npm install
npm run dev
# Client will run on http://localhost:5173
```

---

## ⚡ Demo Logins

| Role | Email | Password | Purpose |
|---|---|---|---|
| **Student** | `student@skillconnect.in` | `skill123` | Portfolio & Applications |
| **Industry Partner** | `recruiter@company.com` | `skill123` | Post Opportunities & Hire |
| **Admin** | `admin@skillconnect.in` | `admin123` | Verification & Analytics |

---

## 🛠️ Tech Stack

```
skillconnect-portal/
├── client/                     # Vite + React 19 Frontend
│   ├── src/
│   │   ├── components/         # Navbar, Footer, ProtectedRoute
│   │   ├── context/            # AuthContext
│   │   ├── pages/              # Student, Industry, Admin dashboards
│   │   └── services/           # Axios REST API client
│   └── package.json
└── server/                     # Express.js + MongoDB Backend
    ├── models/                 # MongoDB Schemas (User, Opportunity, Application)
    ├── services/               # Skill Matcher & AI Engine
    ├── server.js               # REST endpoints & JWT auth
    ├── db.js                   # MongoDB connection & initialization
    └── package.json
```

---

## 📦 Supported Industries

The platform supports skill matching and internship opportunities across:
1. **AYUSH** - Traditional Medicine & Wellness
2. **Technology** - Software, AI/ML, Web Development
3. **Healthcare** - Clinical, Nursing, Pharmacy
4. **Engineering** - Mechanical, Civil, Electronics
5. **Finance** - Accounting, Banking, Analytics
6. **Business** - Management, HR, Operations
7. **Creative** - Design, Media, Entertainment
8. **Education** - Teaching, Research, Content
9. **Hospitality** - Tourism, Events, Services
10. **Manufacturing** - Production, Quality, Supply Chain

---

## 🗄️ Database

The platform uses **MongoDB Atlas** for cloud data storage with automatic fallback to local JSON file.

### Collections:
- `users` - Students, Industry Partners, Admins
- `opportunities` - Internship/Fellowship postings
- `applications` - Student applications tracking
- `assessments` - Standardized skill tests
- `notifications` - Real-time alerts

---

## 📝 License

This project is developed as an open Academia-Industry collaborative initiative.
