# Google Lecture Transcriber (NoteFlow)

**NoteFlow** is an AI-powered lecture transcription and note-taking assistant. It records live audio, transcribes it using OpenAI Whisper, generates structured summaries using Google Gemini, and organizes everything in a modern web dashboard.

## Project Architecture

The project is divided into two main parts:

1.  **Frontend (`/frontend`)**: A React + TypeScript application built with Vite. It handles the user interface, recording controls, and note visualization.
2.  **Backend (`/backend`)**: A Flask (Python) server that manages authentication, processes audio, interfaces with AI models (Whisper, Gemini), and stores data in MongoDB.

## Key Features

- 🎙️ **Live Recording**: Capture lectures directly from the browser.
- 📝 **AI Transcription & Summarization**: Converts speech to text and generates concise, structured notes.
- 📂 **Organization**: Group notes into Folders and mark Favorites.
- ☁️ **Google Docs Sync**: Push your generated notes to Google Docs with a single click.
- 🔐 **Secure Auth**: User accounts with Google OAuth support.

## Quick Start Guide

### 1. Backend Setup

Navigate to the `backend` folder and follow the [Backend README](backend/README.md) to set up the Python environment, MongoDB connection, and API keys.

```bash
cd backend
# ... (follow backend/README.md instructions)
python app.py
```

### 2. Frontend Setup

Navigate to the `frontend` folder and follow the [Frontend README](frontend/README.md) to install dependencies and start the UI.

```bash
cd frontend
npm install
npm run dev
```

### 3. Usage

1.  Open your browser to `http://localhost:5173`.
2.  Sign up or Login.
3.  Go to the **Record** page and start a session.
4.  Once finished, view your generated notes in the **Dashboard**.

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS, Radix UI, Vite.
- **Backend**: Flask, Python, MongoDB, PyMongo.
- **AI/ML**: OpenAI Whisper (Transcription), Google Gemini (Summarization).
- **Integrations**: Google Drive/Docs API, Google OAuth.

## License

[MIT](LICENSE)
