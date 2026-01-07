# 🎓 NoteFlow — AI-Powered Lecture Transcription & Study Assistant

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://google-lecture-transcriber.vercel.app/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **Democratizing education through intelligent, real-time lecture transcription and AI-powered note generation.**

NoteFlow is an accessible, AI-driven platform that transforms live lectures into structured, searchable study materials—making education truly inclusive for **Deaf and Hard-of-Hearing (HoH) students** and enhancing learning outcomes for everyone.

**🌐 [Try NoteFlow Live](https://google-lecture-transcriber.vercel.app/)**

---

## 🌟 The Problem We're Solving

Traditional lectures create **significant accessibility barriers**:
- 📢 Audio-dependent content excludes Deaf/HoH students
- 👥 Limited interpreter availability in smaller institutions
- 📖 Manual note-taking is incomplete and error-prone
- 🔍 No searchable record of past lectures

**NoteFlow ensures that understanding—not just hearing—is accessible to everyone.**

---

## ✨ Key Features

### 🎙️ **Live Audio Capture**
Record lectures directly from your browser with a single click—no installation required.

### 🧠 **Dual-AI Transcription**
- **Google Speech-to-Text API** — Cloud-based, enterprise-grade transcription[web:79]
- **OpenAI Whisper** — Local fallback for offline reliability
- Automatic punctuation and speaker detection

### 📝 **AI-Powered Note Generation**
**Google Gemini 2.0** transforms raw transcripts into structured study guides:
- Main topic extraction
- Key points with bullet formatting
- Important concepts with definitions
- Concise summaries

### 📂 **Smart Organization**
- Create custom folders for subjects/courses
- Mark notes as favorites for quick access
- Full-text search across all lectures
- Automatic timestamp tracking

### ☁️ **Google Workspace Integration**
- **One-click export to Google Docs** for collaboration
- **OAuth 2.0 authentication** for secure, frictionless login
- Automatic syncing to user's Google Drive

### 📄 **Professional PDF Export**
Generate beautifully formatted PDFs with custom styling for offline study or printing.

---

## 🏗️ Architecture

┌─────────────────────────────────────────────────────────┐
│ Frontend (React) │
│ - Audio Recording - Dashboard - Note Editor │
└────────────────────┬────────────────────────────────────┘
│ REST API
┌────────────────────▼────────────────────────────────────┐
│ Backend (Flask) │
│ - Authentication - Audio Processing - AI Orchestration│
└─┬──────────┬──────────┬──────────────┬─────────────────┘
│ │ │ │
▼ ▼ ▼ ▼
┌──────┐ ┌──────┐ ┌─────────┐ ┌──────────────┐
│MongoDB│ │Whisper│ │ Gemini │ │ Google APIs │
│ DB │ │ STT │ │ AI │ │ (Docs/OAuth) │
└──────┘ └──────┘ └─────────┘ └──────────────┘


---

## 🛠️ Tech Stack

### **Frontend**
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)

- **React 18** with TypeScript for type safety
- **Tailwind CSS** for responsive, modern UI
- **Radix UI** for accessible component primitives
- **Vite** for blazing-fast development

### **Backend**
![Python](https://img.shields.io/badge/Python-3.10-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?logo=flask&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)

- **Flask** for RESTful API architecture
- **MongoDB** for flexible document storage
- **PyMongo** for database operations
- **faster-whisper** for optimized local transcription

### **AI & Cloud Services**
![Google Cloud](https://img.shields.io/badge/Google%20Cloud-4285F4?logo=googlecloud&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white)

1. **Google Speech-to-Text API** — Primary transcription engine[web:79]
2. **Google Gemini 2.0** — AI summarization & structuring[web:104]
3. **Google OAuth 2.0** — Secure authentication
4. **Google Docs API** — Note export & persistence
5. **OpenAI Whisper** — Fallback transcription (offline-capable)

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB account (free tier: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- Google Cloud project with enabled APIs

### 1️⃣ Clone & Install

```bash
# Clone repository
git clone https://github.com/yourusername/noteflow.git
cd noteflow

# Backend setup
cd backend
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install
```
NoteFlow uses a modern **microservices architecture** with clear separation of concerns:

