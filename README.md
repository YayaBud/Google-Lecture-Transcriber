# Google Lecture Transcriber / NoteFlow

Google Lecture Transcriber is an AI-powered system for turning live lectures into structured, high-quality notes. The project currently consists of:

- **NoteFlow** – a modern React frontend for recording sessions, browsing notes, and viewing summaries.
- **Backend architecture (planned/experimental)** – real-time transcription, Gemini-based summarization, and Google Docs integration for persistent, shareable notes.

---

## 1. Project Overview

### NoteFlow (Current Frontend)

NoteFlow is a beautiful, responsive web interface where users can:

- View a landing page with a clean, minimal design.
- Access a dashboard with stats, recent notes, and quick actions.
- Browse all notes in a card-based layout.
- Experience smooth animations, transitions, and a light/dark theme toggle.

### Backend Concept (Planned / To Be Integrated)

The backend is designed to:

- Capture live lecture audio (microphone or recorded files).
- Transcribe audio into text (initially with Whisper; designed to support Google Cloud Speech-to-Text).
- Use Gemini to generate structured notes, highlights, and optionally Q&A.
- Export notes and audio references to Google Docs via the Google Docs API.

---

## 2. Frontend – NoteFlow UI

### Features

- **Modern Dashboard UI**: Bento-style cards for stats and notes.
- **Dark/Light Mode**: Toggle between themes with smooth transitions.
- **Responsive Layout**: Works across desktop and mobile.
- **Animations**: Framer Motion for subtle, polished interactions.
- **Iconography**: Lucide icons for a clean, consistent look.

### Tech Stack

- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Components**: Custom components inspired by shadcn/ui patterns
- **Animations**: Framer Motion
- **Routing**: React Router DOM

### Frontend Setup

Clone the repository
git clone https://github.com/YayaBud/Google-Lecture-Transcriber.git
cd Google-Lecture-Transcriber

Install dependencies
npm install

Start the dev server
npm run dev


Open `http://localhost:5173` in your browser.



---

## 3. Backend – Google Lecture Transcriber (Design)

> This section describes the backend architecture and scripts you can build or integrate later. It is not fully wired to the frontend yet.

### High-Level Flow

1. **Audio capture** (microphone or uploaded file).
2. **Transcription layer**:
   - Default: local Whisper model.
   - Future: drop-in replacement with Google Cloud Speech-to-Text.
3. **AI summarization**:
   - Split transcript into chunks.
   - Send to Gemini to generate concise, structured notes.
4. **Export to Google Docs**:
   - Create or append a document.
   - Insert notes and links to the original audio file.

### Key Features (Backend)

- Live or file-based audio ingestion.
- Local Whisper-based transcription for on-device processing.
- Designed to support Google Cloud Speech-to-Text in the future.
- Gemini-driven summarization, structured notes, and optional Q&A generation.
- Export notes and attach or link the original audio in Google Docs.

### Backend Prerequisites (Example)

- Python 3.8+ (or your chosen backend runtime)
- FFmpeg (audio processing)
- Whisper model available locally
- Gemini API access (API key)
- Google Cloud project with Google Docs API enabled and credentials

Example environment variables:

GEMINI_API_KEY="your_gemini_api_key"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/google-credentials.json"
WHISPER_MODEL="small" # local Whisper model name
OUTPUT_DOC_ID="optional-doc-id" # existing Google Doc ID (optional)


Example backend setup (placeholder, adjust to your actual structure):

python -m venv .venv
source .venv/bin/activate # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

Example commands
python app.py --source mic
python transcribe_file.py --input lecture.mp3 --model $WHISPER_MODEL


---

## 4. How Frontend and Backend Fit Together

Planned integration:

- The NoteFlow frontend will send:
  - Audio uploads or recording sessions.
  - User actions (start/stop recording, generate notes).
- The backend will:
  - Handle audio ingestion and transcription.
  - Call Gemini to transform transcripts into structured notes.
  - Save notes and audio references (e.g., in a database and/or Google Docs).
- The frontend will then:
  - Fetch and display the notes, summaries, and metadata in the dashboard and notes pages.

At the moment, the frontend primarily demonstrates the **UX and UI** for such a system. You can gradually connect actual backend endpoints as they are implemented.

---

## 5. Development Notes

- Do not commit API keys or credentials; use environment variables.
- Add `node_modules`, `.env`, `dist`, and virtualenv folders to `.gitignore`.
- Use separate branches for backend and frontend features if you plan major changes.

---

## 6. License

MIT — see the `LICENSE` file.

---

## 7. Credits

- Frontend design and implementation: NoteFlow UI.
- Backend concept: Google Lecture Transcriber (Whisper + Gemini + Google Docs).
