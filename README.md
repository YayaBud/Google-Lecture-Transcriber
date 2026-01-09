# 🎓 NoteFlow — AI-Powered Lecture Transcription & Study Assistant

<div align="center">

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_App-brightgreen?style=for-the-badge)](https://google-lecture-transcriber.vercel.app/)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Backend](https://img.shields.io/badge/Backend-Railway-0B0D0E?style=for-the-badge&logo=railway)](https://railway.app)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

**Democratizing education through intelligent, real-time lecture transcription and AI-powered note generation.**

[Features](#-key-features) • [Demo](#-live-demo) • [Tech Stack](#-tech-stack) • [Setup](#-quick-start) • [Architecture](#-architecture)

</div>

---

## 🌟 The Problem We're Solving

Traditional lectures create **significant accessibility barriers**:

- 📢 **Audio-dependent content** excludes Deaf and Hard-of-Hearing (HoH) students
- 👥 **Limited interpreter availability** in smaller institutions  
- 📖 **Manual note-taking** is incomplete, error-prone, and distracts from learning
- 🔍 **No searchable record** of past lectures for review

**NoteFlow ensures that understanding—not just hearing—is accessible to everyone.**

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🎙️ Live Audio Capture
Record lectures directly in your browser—no installation required. One-click recording with automatic pause/resume.

### 🧠 Dual-AI Transcription
- **Google Speech-to-Text API** for cloud-based accuracy
- **OpenAI Whisper** as local fallback for offline reliability
- Automatic punctuation and speaker detection

### 📝 AI-Powered Note Generation
**Google Gemini 2.0 Flash** transforms raw transcripts into structured study guides:
- 📌 Main topic extraction
- 🔑 Key points with bullet formatting
- 💡 Important concepts with definitions
- 📊 Concise summaries

</td>
<td width="50%">

### 📂 Smart Organization
- 📁 Create custom folders for subjects/courses
- ⭐ Mark notes as favorites for quick access
- 🔍 Full-text search across all lectures
- ⏰ Automatic timestamp tracking

### ☁️ Google Workspace Integration
- **One-click export to Google Docs** for collaboration
- **OAuth 2.0 authentication** for secure login
- Automatic syncing to your Google Drive

### 📄 Professional PDF Export
Generate beautifully formatted PDFs with custom styling for offline study or printing.

</td>
</tr>
</table>

---

## 🚀 Live Demo

**Experience NoteFlow in action:** [https://google-lecture-transcriber.vercel.app/](https://google-lecture-transcriber.vercel.app/)

<div align="center">
  <img src="https://img.shields.io/badge/Status-Live-success?style=flat-square" alt="Status"/>
  <img src="https://img.shields.io/badge/Uptime-99.9%25-blue?style=flat-square" alt="Uptime"/>
</div>

### 🎯 Quick Start Guide

1. **Sign in** with your Google account
2. **Click "New Note"** to start recording a lecture
3. **Speak or play audio** — transcription happens in real-time
4. **Stop recording** and let AI generate structured notes automatically
5. **Export to Google Docs** or download as PDF

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Frontend["🖥️ Frontend (Vercel)"]
        UI[Dashboard & Note Editor]
        Record[Audio Recording Module]
    end
    
    subgraph Backend["⚙️ Backend (Railway)"]
        Auth[JWT Authentication]
        Audio[Audio Processing Engine]
        API[REST API Endpoints]
    end
    
    subgraph AI["🤖 AI Services"]
        GoogleSTT[Google Speech-to-Text<br/>Real-time Transcription]
        Whisper[OpenAI Whisper<br/>Fallback STT]
        Gemini[Google Gemini 2.0 Flash<br/>Note Structuring]
    end
    
    subgraph Data["💾 Data Layer"]
        MongoDB[(MongoDB Atlas<br/>Users & Notes Database)]
    end
    
    subgraph Google["☁️ Google Cloud Platform"]
        OAuth[OAuth 2.0<br/>User Authentication]
        Docs[Google Docs API<br/>Export & Collaboration]
        Drive[Google Drive<br/>Cloud Storage]
    end
    
    UI --> API
    Record --> API
    API --> Auth
    API --> Audio
    Audio --> GoogleSTT
    Audio --> Whisper
    API --> Gemini
    Auth --> OAuth
    API --> MongoDB
    API --> Docs
    Docs --> Drive
    
    style Frontend fill:#61DAFB20,stroke:#61DAFB,stroke-width:2px
    style Backend fill:#00000020,stroke:#000000,stroke-width:2px
    style AI fill:#FF6B6B20,stroke:#FF6B6B,stroke-width:2px
    style Data fill:#47A24820,stroke:#47A248,stroke-width:2px
    style Google fill:#4285F420,stroke:#4285F4,stroke-width:2px
```

**Deployment Infrastructure:**
- 🎨 **Frontend:** Deployed on Vercel with automatic CI/CD from GitHub
- ⚡ **Backend:** Hosted on Railway with containerized Python Flask app
- 🗄️ **Database:** MongoDB Atlas (cloud-hosted, globally distributed)

---

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="33%">

### Frontend
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white&style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white&style=flat-square)

- React 18 with TypeScript
- Tailwind CSS + Radix UI
- Framer Motion animations
- React Router for navigation
- Vite for build tooling

</td>
<td valign="top" width="33%">

### Backend
![Python](https://img.shields.io/badge/Python-3.10-3776AB?logo=python&logoColor=white&style=flat-square)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?logo=flask&logoColor=white&style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white&style=flat-square)

- Flask RESTful API
- MongoDB with PyMongo
- JWT authentication
- faster-whisper (optimized)
- CORS enabled for Vercel

</td>
<td valign="top" width="33%">

### AI & Cloud
![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?logo=googlecloud&logoColor=white&style=flat-square)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white&style=flat-square)

- Google Speech-to-Text API
- Google Gemini 2.0 Flash
- Google OAuth 2.0
- Google Docs API
- OpenAI Whisper (fallback)

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.10+
- MongoDB Atlas account
- Google Cloud Platform account with APIs enabled:
  - Speech-to-Text API
  - Gemini API
  - Google Docs API
  - OAuth 2.0

### Frontend Setup (Vercel)

```bash
# Clone the repository
git clone https://github.com/yourusername/noteflow.git
cd noteflow/frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_API_URL=your_railway_backend_url
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
EOF

# Run development server
npm run dev

# Build for production
npm run build
```

**Deploy to Vercel:**
```bash
npm install -g vercel
vercel --prod
```

### Backend Setup (Railway)

```bash
cd noteflow/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGODB_URI=your_mongodb_connection_string
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_oauth_client_id
GOOGLE_CLIENT_SECRET=your_oauth_client_secret
JWT_SECRET_KEY=your_random_secret_key
FRONTEND_URL=https://google-lecture-transcriber.vercel.app
EOF

# Run development server
python app.py
```

**Deploy to Railway:**
1. Push code to GitHub
2. Connect repository to Railway
3. Add environment variables in Railway dashboard
4. Deploy automatically on push

---

## 📁 Project Structure

```
noteflow/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities & helpers
│   ├── public/
│   └── package.json
│
├── backend/                 # Flask Python backend
│   ├── app.py              # Main application entry
│   ├── routes/             # API route handlers
│   ├── models/             # MongoDB models
│   ├── services/           # AI & business logic
│   │   ├── transcription.py
│   │   ├── summarization.py
│   │   └── google_docs.py
│   └── requirements.txt
│
└── README.md
```

---

## 🔐 Environment Variables

### Frontend (.env)
```bash
VITE_API_URL=https://your-railway-backend.railway.app
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### Backend (.env)
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/noteflow
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_oauth_client_id
GOOGLE_CLIENT_SECRET=your_oauth_client_secret
JWT_SECRET_KEY=your_random_secret_key_min_32_chars
FRONTEND_URL=https://google-lecture-transcriber.vercel.app
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Cloud Platform** for Speech-to-Text and Gemini APIs
- **OpenAI** for Whisper transcription model
- **Vercel** for seamless frontend hosting
- **Railway** for reliable backend deployment
- **MongoDB Atlas** for cloud database services

---

## 📧 Contact & Support

- **Live App:** [https://google-lecture-transcriber.vercel.app/](https://google-lecture-transcriber.vercel.app/)
- **Email:** chaudharyayush4121@gmail.com

---

<div align="center">

**Made with ❤️ for accessible education**

⭐ Star this repo if you find it helpful!

</div>
