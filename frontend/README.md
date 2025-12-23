# NoteFlow Frontend

NoteFlow is the modern React frontend for the Google Lecture Transcriber system. It provides a beautiful, responsive interface for recording lectures, managing notes, and organizing study materials.

## Features

- **Dashboard**: Bento-style overview of your notes and statistics.
- **Recording Interface**: Simple UI to record lectures and view real-time status.
- **Note Management**: 
  - View auto-generated notes with formatting.
  - Organize notes into **Folders**.
  - Mark important notes as **Favorites**.
- **Google Docs Integration**: One-click export of notes to your Google Drive.
- **Dark/Light Mode**: Fully supported theming.

## Tech Stack

- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Shadcn/UI (Radix Primitives)
- **State Management**: React Query & Local State
- **Routing**: React Router DOM

## Installation

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:5173`.

## Project Structure

- `src/pages`: Main route components (Dashboard, Notes, Folders, etc.)
- `src/components`: Reusable UI components (buttons, cards, dialogs).
- `src/lib`: Utilities and API clients (Supabase client, etc.).


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
