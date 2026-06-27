# HealthSync AI – AI-Driven Health Center & Supply Chain Management

HealthSync AI is a highly sophisticated, full-stack, AI-powered healthcare management and supply chain platform engineered for **Primary Health Centers (PHCs)** and **Community Health Centers (CHCs)** in Karnataka, India. 

Designed and optimized for the **Google "Build with AI" Hackathon**, the platform addresses systemic, structural challenges in rural and semi-urban health centers by substituting manual, reactive workflows with real-time, proactive, AI-driven coordination.

---

## 🚀 The Core Problem Solved

Primary healthcare institutions often function as isolated nodes, suffering from:
1. **Manual Inventory Deficiencies**: Prone to stock tracking errors, leading to severe shortages of life-saving formulations.
2. **Expirations & Waste**: Poor batch tracking results in vital drugs expiring on shelves while neighboring clinics experience acute shortages.
3. **No Real-time Bed Auditing**: Inability to view patient occupancy across ICU and General wards prevents optimal patient triage.
4. **Physician Duty Friction**: Lack of structured, auditable attendance tracking decreases clinic operational trust.
5. **Erratic Outpatient Footfall**: Unpredictable patient arrival patterns lead to severe staffing bottlenecks or idle clinical hours.
6. **Isolated Data Silos**: Absence of cross-center resource allocation channels leaves neighboring clinics unable to coordinate surplus transfers.

HealthSync AI solves these challenges by combining a **sleek, high-contrast healthcare dashboard** with **Google Gemini (`gemini-3.5-flash`)**. It connects independent clinics into a unified, predictive ecosystem.

---

## 🛠️ Advanced Tech Stack & Architecture

- **Frontend Core**: React 19, TypeScript, and Vite.
- **Micro-Animations**: Framer Motion (`motion/react`) for smooth, cinematic spatial transitions.
- **Utility Styling**: Tailwind CSS, utilizing custom theme mappings (Inter, Space Grotesk, JetBrains Mono).
- **Central Express Server**: Express.js with a real-time, file-based JSON persistence engine pre-seeded with rich clinical datasets.
- **Analytics Visualization**: Recharts for responsive, interactive medical statistics.
- **AI Core Intelligence**: The official **Google GenAI SDK (`@google/genai`)** driving real-time structured audits, predictive forecasting, and conversational co-piloting.
- **Production Schema**: Native, production-ready Mongoose MongoDB Schema models located in `/src/db/mongoose-schemas.ts` for instant cloud scaling.

---

## ✨ Features & Functional Scope

### 1. Unified Authentication Gate
- Visual landing page supporting customized credential entry.
- Dynamic clinic selection mapping to different local centers (e.g., *Indiranagar PHC*, *Jayanagar CHC*, *Whitefield PHC*).
- Role-based access levels (Clinic Administrator, Chief Medical Officer, Supply Chain Manager).

### 2. Multi-Language Adaptability (i18n)
- Seamless, real-time localized translation toggles supporting English, Kannada (ಕನ್ನಡ), and Hindi (हिन्दी) across all labels, alerts, and operational categories.

### 3. Core Operational Views
- **Medicine Inventory**: Comprehensive pharmaceutical ledger with manual batch insertion, low-stock trigger points, automatic expiration warnings, and usage rate depletions.
- **Bed Management**: Interactive graphical ward map with ICU and General admission panels. Supports instant patient admission workflows and discharge actions.
- **Staff Roster**: Active physician log showing shifts (Morning, Evening, Night) and daily clinical attendance registries.
- **Patient Registry**: Interactive EMR indexing profiles, recording appointment bookings with active doctors, and housing complete clinical logs for treatments.

### 4. AI-Powered Command Hub
- **Predictive Medicine Audits**: Executes live data synthesis via Gemini to detect medications at risk of stockout within 30 days.
- **7-Day Outpatient Footfall Projection**: Plots daily patient inflow expectations with automated trend classifiers (Surge, Stable, Drop) and causal justifications (e.g., monsoon fever cycles).
- **Inter-PHC Supply Transfer Optimizer**: Identifies pharmaceutical surplus in neighboring centers and recommends transfer shipments. Features an **interactive "Execute Transfer" action** that deducts stock from the source center and inserts it into the active center in real-time.
- **AI Clinical Co-Pilot Chat**: Conversational clinical chat powered by Gemini. Features instant quick-query suggestion chips and real-time contextual auditing.

---

## 📊 Database Schema Blueprint (MongoDB)

All schemas are declared with TypeScript and Mongoose interfaces in `/src/db/mongoose-schemas.ts`. Key collections include:

1. **PHCCenter**: Stores center name, geo-region, and operational classification.
2. **Medicine**: Tracks brand formulation, category, batch stamp, exact stock level, daily consumption rates, expiration dates, and clinic affiliation.
3. **Bed**: Manages admission coordinates, ward classifications (ICU/General), active status, and occupying patient profiles.
4. **Doctor**: Houses physician registry details, shift schedules, and historical attendance logs.
5. **Patient**: Stores electronic medical records, demographics, blood classifications, scheduled clinical appointments, and treatment logs.

---

## 📦 Set Up & Local Execution

### 1. Environment Configuration
Create a `.env` file in the root directory (based on `.env.example`):
```env
GEMINI_API_KEY="your_google_gemini_api_key"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Launch Development Server
Runs both the Express backend and Vite frontend concurrently on port `3000`:
```bash
npm run dev
```

### 4. Production Compilation & Build
Bundles the React client files and compiles the backend TypeScript file into a single, optimized CommonJS file inside `dist/server.cjs`:
```bash
npm run build
```

### 5. Launch Compiled Production Build
```bash
npm start
```
