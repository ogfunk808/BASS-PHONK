# 🔊 BASS PHONK — Complete Phonk Ecosystem

A premium, production-ready Phonk music ecosystem consisting of a **React SPA frontend** (AMOLED black, neon effects, glassmorphic UI, audio visualizers, and Web Audio API controls) and a **FastAPI Python backend** integrated with **Supabase Database & Storage**.

---

## 🚀 Quick Start

### Prerequisites
1. **Python 3.11+** (for the backend server)
2. **Node.js 18+** (for the frontend SPA client)
3. A **Supabase** account and project

---

## 🗄️ Database Setup (Supabase)

1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Copy and execute the contents of [`supabase/schema.sql`](file:///d:/BASS%20PHONK/supabase/schema.sql) to set up tables, indexes, triggers, custom functions, and initial seed data.
3. Execute [`supabase/storage_setup.sql`](file:///d:/BASS%20PHONK/supabase/storage_setup.sql) to initialize the required public buckets (`tracks`, `artwork`, `avatars`, `wallpapers`) and set up access control policies.

---

## 🐍 Backend API Setup (Python FastAPI)

The backend provides secure REST endpoints, user authentication verification, rate limiting, and interface with the Supabase client.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Verify that `.env` is updated with your real Supabase credentials (this was automatically done for you by Antigravity).
5. Start the FastAPI development server:
   ```bash
   python run.py
   ```
   The API will start running at `http://localhost:8000`. You can access interactive Swagger docs at `http://localhost:8000/docs`.

---

## ⚛️ Frontend Client Setup (React + Vite)

The frontend client serves the web player, audio effects processing, and visually reactive visualizations.

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Verify that `.env` is updated with your real Supabase credentials (done automatically).
4. Run the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser to experience the dashboard!

---

## 🔒 Security & Compliance

The codebase has been designed with strict privacy and security rules:
- **FastAPI Middleware**: Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Content-Type-Options, X-Frame-Options, X-XSS-Protection.
- **Supabase Row Level Security (RLS)**: Policies are defined on all tables to prevent unauthorized data reads/writes.
- **Documents**: GDPR/CCPA-compliant [Privacy Policy](file:///d:/BASS%20PHONK/docs/privacy-policy.md), [Terms of Service](file:///d:/BASS%20PHONK/docs/terms-of-service.md), and [Community Guidelines](file:///d:/BASS%20PHONK/docs/community-guidelines.md) are included in the `/docs` directory.

---

## 🎵 Features Included
- **AMOLED Dark Aesthetic**: Custom styled with neon red, purple glow, and frosted glass overlays.
- **Web Audio Engine**: Controls for 32-bit bass boost, 10-band equalizer, 8D audio, reverb presets, speed/pitch control.
- **Visualizer**: High-performance Canvas visualizers reactive to the frequency domain (spectrum and waveforms).
- **Speedometer Car Mode**: Dashboard layout designed with larger target buttons and custom BPM-reactive gauges.
