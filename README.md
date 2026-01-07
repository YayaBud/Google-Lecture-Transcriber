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
- **Google Speech-to-Text API** — Cloud-based, enterprise-grade transcription
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

```mermaid
graph TB
    subgraph Frontend["🖥️ Frontend (React + TypeScript)"]
        UI[Dashboard & Note Editor]
        Record[Audio Recording]
    end
    
    subgraph Backend["⚙️ Backend (Flask)"]
        Auth[Authentication]
        Audio[Audio Processing]
        API[REST API]
    end
    
    subgraph AI["🤖 AI Services"]
        Whisper[OpenAI Whisper<br/>Speech-to-Text]
        GoogleSTT[Google Speech-to-Text<br/>Cloud Transcription]
        Gemini[Google Gemini 2.0<br/>Note Generation]
    end
    
    subgraph Data["💾 Data Layer"]
        MongoDB[(MongoDB Atlas<br/>User & Notes)]
    end
    
    subgraph Google["☁️ Google Cloud"]
        OAuth[OAuth 2.0<br/>Authentication]
        Docs[Google Docs API<br/>Export]
        Drive[Google Drive<br/>Storage]
    end
    
    UI --> API
    Record --> API
    API --> Auth
    API --> Audio
    Audio --> Whisper
    Audio --> GoogleSTT
    API --> Gemini
    Auth --> OAuth
    API --> MongoDB
    API --> Docs
    Docs --> Drive
    
    style Frontend fill:#61DAFB20,stroke:#61DAFB
    style Backend fill:#00000020,stroke:#000000
    style AI fill:#FF6B6B20,stroke:#FF6B6B
    style Data fill:#47A24820,stroke:#47A248
    style Google fill:#4285F420,stroke:#4285F4
System Components
Layer	Technology	Purpose
Frontend	React + TypeScript	User interface, audio recording
Backend	Flask (Python)	API server, business logic
Database	MongoDB Atlas	User data, notes, folders
Transcription	Whisper + Google Speech	Audio → Text conversion
AI Processing	Google Gemini 2.0	Smart note generation
Cloud Services	Google APIs	OAuth, Docs, Drive integration
🛠️ Tech Stack
Frontend
React
TypeScript
Tailwind
Vite

React 18 with TypeScript for type safety

Tailwind CSS for responsive, modern UI

Radix UI for accessible component primitives

Vite for blazing-fast development

Backend
Python
Flask
MongoDB

Flask for RESTful API architecture

MongoDB for flexible document storage

PyMongo for database operations

faster-whisper for optimized local transcription

AI & Cloud Services
Google Cloud
OpenAI

Google Speech-to-Text API — Primary transcription engine

Google Gemini 2.0 — AI summarization & structuring

Google OAuth 2.0 — Secure authentication

Google Docs API — Note export & persistence

OpenAI Whisper — Fallback transcription (offline-capable)

🚀 Quick Start
Prerequisites
Python 3.10+

Node.js 18+

MongoDB account (free tier: MongoDB Atlas)

Google Cloud project with enabled APIs

1️⃣ Clone & Install
bash
# Clone repository
git clone https://github.com/yourusername/noteflow.git
cd noteflow

# Backend setup
cd backend
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install
2️⃣ Environment Configuration
Backend Configuration
Create backend/.env:

text
# MongoDB Configuration
MONGODB_URL=mongodb+srv://<db_username>:<db_password>@cluster0.xxxxx.mongodb.net/
MONGODB_USER_ID=your_mongodb_username
MONGODB_PASSWORD=your_mongodb_password

# Google AI APIs
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash

# Google Cloud Speech-to-Text
GOOGLE_APPLICATION_CREDENTIALS=google-speech-credentials.json

# Whisper Configuration
WHISPER_MODEL=small

# Flask Configuration
SECRET_KEY=your-secret-key-generate-random-string
FLASK_ENV=development
Google Cloud Setup
1. Create Google Cloud Project

Go to: https://console.cloud.google.com/

Click "New Project" → Name it noteflow or google-transcriber

Note your Project ID

2. Enable Required APIs

Navigate to: https://console.cloud.google.com/apis/library

Enable these APIs:

✅ Cloud Speech-to-Text API

✅ Google Docs API

✅ Google Drive API

✅ Google OAuth 2.0 API (enabled by default)

3. Get Gemini API Key

Go to: https://aistudio.google.com/app/apikey

Click "Create API Key"

Copy the key → Add to backend/.env as GEMINI_API_KEY

4. Create OAuth 2.0 Credentials

Go to: https://console.cloud.google.com/apis/credentials

Click "Create Credentials" → "OAuth 2.0 Client ID"

Application type: Web application

Name: NoteFlow Web Client

Authorized redirect URIs:

http://localhost:5000/auth/google/callback

http://localhost:5000/oauth2callback

Click "Create"

Download JSON → Rename to credentials_oauth.json

Place in backend/ folder

5. Create Service Account for Speech-to-Text

Go to: https://console.cloud.google.com/iam-admin/serviceaccounts

Click "Create Service Account"

Name: speech-transcriber

Description: "Service account for Speech-to-Text API"

Click "Create and Continue"

Grant role: Cloud Speech Client

Click "Continue" → "Done"

Click on the service account you just created

Go to Keys tab → "Add Key" → "Create new key" → JSON

Download JSON → Rename to google-speech-credentials.json

Place in backend/ folder

6. Enable Billing (Required for Speech-to-Text)

Go to: https://console.cloud.google.com/billing

Link a billing account (you get $300 free credits for new accounts)

Set budget alerts at $5, $10, $20 for safety

Frontend Configuration
Create frontend/.env:

text
VITE_API_URL=http://localhost:5000
For production deployment:

text
VITE_API_URL=https://your-backend-url.com
3️⃣ Install Dependencies
Backend Dependencies
bash
cd backend
pip install -r requirements.txt
Key packages installed:

flask — Web framework

flask-cors — CORS handling

pymongo — MongoDB driver

faster-whisper — Optimized Whisper transcription

google-cloud-speech — Speech-to-Text API client

google — Gemini AI SDK

google-auth-oauthlib — OAuth 2.0 flow

reportlab — PDF generation

Frontend Dependencies
bash
cd frontend
npm install
Key packages installed:

react — UI framework

react-router-dom — Client-side routing

axios — HTTP requests

tailwindcss — Utility-first CSS

@radix-ui/* — Accessible UI components

lucide-react — Icon library

4️⃣ Verify Installation
Check if everything is set up correctly:

bash
# Backend verification
cd backend
python -c "import flask; import pymongo; import google.generativeai; print('✅ All imports successful')"

# Check if ffmpeg is installed (required for audio processing)
ffmpeg -version

# Frontend verification
cd frontend
npm run build
5️⃣ Run the Application
Start Backend Server
bash
cd backend
python app.py
Expected console output:

text
🔑 Using Gemini API Key: AIzaSy...
✅ Google Speech-to-Text credentials loaded
Connecting to MongoDB with URI: mongodb+srv://...
Connected to MongoDB!
Loading Whisper model: small on cpu...
✅ Whisper model loaded successfully on cpu!
ffmpeg found at: /usr/bin/ffmpeg
 * Running on http://127.0.0.1:5000
Start Frontend Development Server
In a new terminal:

bash
cd frontend
npm run dev
Expected output:

text
VITE v5.0.0  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
Access the Application
Open your browser and go to: http://localhost:5173

6️⃣ First Time Setup
Click "Login with Google"

Authorize the app with your Google account

Grant permissions for:

View email address

Access Google Docs

Access Google Drive

You'll be redirected to the dashboard

🎉 You're ready to start transcribing lectures!

📖 Usage Guide
Recording a Lecture
Navigate to the "Record" page from the sidebar

Click the red "Record" button

Allow microphone access when prompted

Speak or play audio (lecture, video, etc.)

Click "Stop" when finished

Audio is saved automatically

Transcribing Audio
After recording, click "Transcribe"

Wait 5-10 seconds for processing

Review the transcript in the text area

Edit if needed (typo corrections)

Generating AI Notes
With transcript ready, click "Generate Notes"

Gemini AI analyzes and structures the content

Preview the formatted notes

Notes include:

📌 Main topic

🔑 Key points (bullet list)

📚 Important concepts with definitions

📝 Summary paragraph

Organizing Notes
Create Folders
Click "New Folder" in the dashboard

Name it (e.g., "CS 101", "Physics", "History")

Drag notes into folders or use "Add to Folder" button

Mark Favorites
Click the ⭐ star icon on any note

Access favorites quickly from the sidebar filter

Search
Use the search bar to find notes by keyword

Searches across titles and content

Exporting Notes
To Google Docs
Open a note

Click "Push to Google Docs"

Note opens automatically in Google Docs

Saved to your Google Drive

To PDF
Open a note

Click "Export as PDF"

Professional formatted PDF downloads

Ready for printing or sharing

🎯 Tips for Best Results
Audio Recording
🎤 Use headset mic for clearer audio

🔇 Minimize background noise

🗣️ Speak clearly and at moderate pace

📏 Keep recordings under 10 minutes for faster processing

Transcription
🌐 Use Google Speech for best accuracy (requires billing)

💻 Use Whisper for offline/free usage

🔄 Review transcripts before generating notes

✏️ Fix technical terms that might be misheard

Note Organization
📁 Create folders per course or topic

🏷️ Use descriptive titles (e.g., "Lecture 5: Neural Networks")

⭐ Star important lectures for exam prep

🔍 Tag keywords in notes for easy searching

🔧 Advanced Configuration
Using Google Speech-to-Text (Instead of Whisper)
By default, the app uses Whisper (free) for transcription. To use Google Speech-to-Text for better accuracy:

In backend/app.py line 459, change:

python
method = request.form.get('method', 'google')  # Use Google Speech
Or keep it as:

python
method = request.form.get('method', 'whisper')  # Free local transcription
Choosing Whisper Model Size
Larger models = better accuracy but slower.

In backend/.env:

text
WHISPER_MODEL=tiny    # Fastest (39M params)
WHISPER_MODEL=base    # Fast (74M params)
WHISPER_MODEL=small   # Balanced (244M params) ✅ Recommended
WHISPER_MODEL=medium  # Accurate (769M params)
WHISPER_MODEL=large   # Best (1550M params) - Requires GPU
Custom Gemini Prompts
In backend/app.py around line 510, modify the prompt for different note styles:

python
prompt = f"""You are an expert note-taker...
[Customize instructions here]
"""
🐛 Troubleshooting
"Whisper model not loaded"
bash
pip install faster-whisper --upgrade
"MongoDB connection failed"
Check if MongoDB Atlas IP whitelist includes your IP

Verify credentials in .env

"Google Speech API error"
Ensure billing is enabled on Google Cloud project

Check service account has "Cloud Speech Client" role

"ffmpeg not found"
Windows: Download from https://ffmpeg.org/ and add to PATH
Mac: brew install ffmpeg
Linux: sudo apt install ffmpeg

🌐 Deployment Guide
Frontend (Vercel)
bash
cd frontend
npm run build
vercel --prod
Backend (Railway/Render)
bash
cd backend
# Add Procfile:
# web: gunicorn app:app

# Install production server
pip install gunicorn

# Deploy to Railway
railway up
Environment Variables (Production)
Set these in your hosting platform:

MONGODB_URL

GEMINI_API_KEY

GOOGLE_APPLICATION_CREDENTIALS (as base64 encoded string)

SECRET_KEY

🎯 Use Cases
For Students
📚 Accessibility — Deaf/HoH students can follow lectures visually

🔄 Review — Revisit lectures anytime with searchable transcripts

📝 Study Guides — AI-generated summaries for exam prep

For Educators
🌍 Reach — Expand accessibility to diverse learner needs

📊 Analytics — Track which concepts students reference most

🔗 Distribution — Share structured notes via Google Docs

For Institutions
♿ Compliance — Meet accessibility standards (ADA, WCAG)

💰 Cost Savings — Reduce dependency on live interpreters

📈 Scalability — Support unlimited concurrent lectures

🔒 Security & Privacy
Feature	Implementation
Authentication	OAuth 2.0 (no password storage)
Database	Encrypted connections (TLS/SSL)
Audio Files	Deleted immediately after transcription
User Data	Isolated per account with strict access control
API Keys	Environment variables (never committed to Git)
🤝 Contributing
We welcome contributions! See CONTRIBUTING.md for guidelines.

Development Workflow
Fork the repository

Create feature branch: git checkout -b feature/AmazingFeature

Commit changes: git commit -m 'Add AmazingFeature'

Push to branch: git push origin feature/AmazingFeature

Open Pull Request

📄 License
This project is licensed under the MIT License - see LICENSE file.

🙏 Acknowledgments
OpenAI for Whisper open-source model

Google Cloud for AI/ML infrastructure

MongoDB for student developer program

Vercel for frontend hosting

📬 Contact & Support
Live Demo: google-lecture-transcriber.vercel.app
Email: chaudharyayush4121@gmail.com
Issues: GitHub Issues

<div align="center">
⭐ Star this repo if you find it helpful!
Made with ❤️ for accessible education
Empowering every student to learn without barriers

</div> ```
