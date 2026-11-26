<div align="center">

<!-- EVALIX Brand Banner -->
<img src="frontend/evalix-logo.jpg" alt="EVALIX Logo" width="90" style="border-radius: 16px;" />

# EVALIX — Skill Track
### *Learn • Practice • Grow | Career Readiness, Upskilling & Placement Intelligence Platform*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20%26%20MySQL-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JavaScript](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20JS-2563EB?style=for-the-badge&logo=javascript&logoColor=white)](#)
[![GitHub](https://img.shields.io/badge/Repository-Babita2109%2FEvalix-F43F5E?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Babita2109/Evalix)

</div>

---

##  Overview

**EVALIX (Skill Track)** is an integrated career readiness, technical upskilling, and hiring intelligence platform built for **job seekers, graduates, career switchers, and working professionals**. It combines structured multi-language learning tracks, live MCQ and interview assessments, real-time practice tracking, visual mastery graphs, and interactive placement drive management in a unified web portal.

---

## Key Features

- ** Complete Authentication & Settings Center:**
  - Dedicated **Sign In**, **Create Account**, **Forgot Password**, and **1-Click Demo Login** flows.
  - **Settings & Privacy Hub** featuring *Account Preferences*, *Sign In & Security*, *Profile Visibility*, *Data Privacy*, *Notifications*, and *Help Center*.
- **⏱ Live Practice Timer & Growth Velocity Graph:**
  - Real-time active study session timer (`Pause` / `Resume` / `Reset`) persisted across sessions.
  - Dynamic **Skill & Language Mastery Bar Chart** and stage progression (`Rising Builder` → `Interview Contender` → `Hiring Ready`) that automatically update upon assessment completion.
- **📚 10 Core & Logic-Building Syllabi:**
  - **Core CS & Architecture:** Data Structures & Algorithms (`TRK-101`), Database Engineering SQL/NoSQL (`TRK-102`), System Design & Cloud (`TRK-103`), OS & Computer Networks (`TRK-104`), Quantitative Aptitude & Reasoning (`TRK-105`), and Executive Communication & Self-Introduction Guide (`TRK-106`).
  - **Language Logic Building & Interview Prep:** Dedicated syllabi, coding patterns, and top interview Q&A for **C (`TRK-201`)**, **C++ & STL (`TRK-202`)**, **Java & Collections (`TRK-203`)**, and **Python (`TRK-204`)**.
- **📝 Interactive Assessments & Auto-Grading:**
  - Timed MCQ and descriptive interview tests with instant score calculation, readiness percentage updates, and MongoDB attempt logging.
- **💼 Hiring & Placement Drives Management:**
  - Browse eligible companies, **post new hiring drives directly from the UI (`+ Add New Drive`)**, apply with one click, and track application statuses in real time.

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Custom Electric Blue & Crimson Theme + Inline SVG), Vanilla JavaScript (ES6+) |
| **Backend** | Python, FastAPI, Uvicorn, Pydantic |
| **Databases** | MongoDB (NoSQL document store for syllabi, assessments, attempts & drives), MySQL (Relational schema & reporting) |
| **Tools** | VS Code, Thunder Client, Git & GitHub |

---

## 📂 Project Structure

```text
Evalix/
├── backend/
│   ├── app.py              # FastAPI application, MongoDB/MySQL connectors & REST APIs
│   ├── requirement.txt     # Python dependencies
│   └── .env                # Environment configuration (DB & MongoDB URIs)
├── database/
│   ├── schema.sql          # Relational database schema
│   ├── sample_data.sql     # Sample SQL records
│   └── reports.sql         # Analytical SQL queries
├── frontend/
│   ├── index.html          # Auth views, Dashboard UI, Growth Bar Graph & Modals
│   ├── style.css           # Responsive layout & component styling
│   ├── app.js              # API integration, timer, chart rendering & state management
│   └── evalix-logo.jpg     # Brand logo asset
├── .gitignore
└── README.md