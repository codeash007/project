# HostelIQ: AI-Powered Predictive Hostel Management & Student Experience Platform

> **Tagline:** *From complaints to intelligent action.*  
> **MCA AI/ML Major Project** based on industry-grade Product Requirements Document (PRD v1.0).

---

## 📌 Project Overview
HostelIQ converts unstructured student complaints and hostel maintenance operations into structured, explainable, and trackable workflows. It enriches tickets using real-time machine learning (NLP classification, priority scoring, duplicate detection, and resolution SLA prediction) while supporting interactive real-time voice interactions powered by **Gemini 3.8 Live**.

---

## 🚀 Key Features

### 1. Student Portal
- **Fast Reporting:** Report room and hostel issues with pre-filled student hostel, block, and room details.
- **Real-Time AI Auto-Triage:** Live category prediction, SLA prediction, and duplicate warning as you type.
- **Voice Concierge & Dictation:** Real-time audio voice conversations via **Gemini 3.8 Live** (`gemini-3.8-live`) over WebSockets (`/live`) with 1-click form auto-fill, plus hands-free speech dictation for title and description.
- **Lifecycle Tracking:** Real-time visibility into complaint status (`OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REOPENED`).
- **Student Review & Reopen:** 1–5 Star rating with feedback, plus instant ticket reopening if an issue remains unresolved.

### 2. Admin Operations Console
- **High-Priority Critical Backlog:** Automated safety risk detection (e.g., exposed wires, short circuits, water leaks).
- **Duplicate & Incident Clustering:** Vector cosine similarity inspection ($\ge 65\%$) allowing admins to cluster related reports into Master Incidents without silent data loss.
- **Technician Dispatch:** Assign maintenance staff across departments with live workload tracking.
- **Outage Management:** Declare and broadcast building-wide master incidents.

### 3. Technician / Field Worker Portal
- **Assigned Work Orders:** Mobile-friendly view of rooms requiring repairs.
- **AI Technician Kit:** AI-recommended tools and spare parts (multimeters, capacitors, drain augers, etc.).
- **On-Site Status Updates:** One-click "Start Work" and "Submit Resolution" with work notes and proof photo.
- **Voice Dictate Notes:** Workers can dictate repair notes hands-free.

### 4. Predictive Analytics & Hotspots (PRD Section 13)
- Real-time SLA tracking (average resolution hours).
- Reopen rate metrics.
- Infrastructure failure category distribution.
- Block hotspot density analysis.
- Predictive recurring issue detection with preventative recommendations.

### 5. Academic & ML Evaluation Defense Workbench (PRD Section 17 & 22)
- **Model Specification Card:** Version 1.2.4 model card with evaluation metrics.
- **Comparative Baseline Analysis:** Benchmark proposed models against keyword/heuristic baselines (Classification F1: **91.8% vs 69.0%**, MAE: **14.8m vs 32.5m**, Duplicate Precision@3: **89.0%**).
- **Confusion Matrix:** Interactive heatmap over held-out test records.
- **Live Inference Sandbox:** Test arbitrary complaint text in real-time.
- **Dataset Explorer:** View training dataset samples with 1-click CSV download.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **Backend API:** Node.js, Express, WebSockets (`ws`).
- **AI & ML Engine:**
  - TF-IDF Vectorization + Multinomial Classifier for category detection.
  - Vector Cosine Similarity + Spatial Proximity for duplicate detection.
  - Explainable heuristic + regression SLA estimator.
  - **Gemini 3.8 Live (`gemini-3.8-live`)**: Full-duplex 16kHz PCM audio streaming for voice conversations.
  - **Gemini 3.8 Flash (`gemini-3.8-flash`)**: Deep root-cause analysis and technician dispatch kit suggestions.

---

## 💻 Local Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` or `yarn` or `pnpm`

### Steps
1. **Extract the ZIP file:**
   ```bash
   unzip hosteliq-source-code.zip
   cd hosteliq
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional for Gemini):**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your `GEMINI_API_KEY` in `.env` if you want to use the Gemini Live API and deep reasoning features:
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   PORT=3000
   ```
   *(Note: HostelIQ includes a complete built-in local ML engine, so it runs seamlessly even without an API key!)*

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

---

## 👥 Demo Personas

For rapid testing and defense evaluation, switch personas in the top right navbar:
- **Student:** Ashish Dubey (`ashish@hostel.edu`, Block B, Room 304)
- **Admin:** Dr. V. Sharma (Chief Operations Warden)
- **Technician:** Rajesh Kumar / Manoj Singh (Field Maintenance)

---

## 📄 License
Educational MCA AI/ML Major Project.
