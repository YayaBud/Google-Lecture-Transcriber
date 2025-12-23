# NoteFlow Backend

The backend for NoteFlow is a Flask-based API that handles user authentication, audio transcription (using OpenAI Whisper), note generation (using Google Gemini), and data persistence (MongoDB).

## Features

- **Authentication**: User signup/login with password hashing (Bcrypt) and Google OAuth integration.
- **Transcription**: Local audio transcription using OpenAI's Whisper model.
- **AI Summarization**: Generates structured notes from transcripts using Google Gemini.
- **Database**: MongoDB for storing users, notes, folders, and metadata.
- **Google Docs Integration**: Pushes generated notes directly to user's Google Docs.

## Prerequisites

- Python 3.8+
- MongoDB Atlas account (or local MongoDB)
- Google Cloud Console project (for OAuth and Docs API)
- Google AI Studio API Key (for Gemini)
- FFmpeg (required for Whisper audio processing)

## Installation

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Install FFmpeg:**
    - **Windows**: Download from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/), extract, and add `bin` folder to your system PATH.
    - **Mac**: `brew install ffmpeg`
    - **Linux**: `sudo apt install ffmpeg`

## Configuration

1.  Create a `.env` file in the `backend` directory with the following variables:

    ```env
    SECRET_KEY=your_flask_secret_key
    MONGODB_URL=mongodb+srv://<db_username>:<db_password>@cluster0.example.mongodb.net/?retryWrites=true&w=majority
    MONGODB_USER_ID=your_mongo_username
    MONGODB_PASSWORD=your_mongo_password
    GEMINI_API_KEY=your_gemini_api_key
    ```

2.  **Google OAuth Setup:**
    - Place your `credentials_oauth.json` file (downloaded from Google Cloud Console) in the `backend` directory.

## Running the Server

```bash
python app.py
```

The server will start at `http://localhost:5000`.

## API Endpoints

- **Auth**: `/auth/signup`, `/auth/login`, `/auth/logout`, `/auth/google`
- **Notes**: `/notes` (GET, POST), `/notes/<id>/favorite` (POST)
- **Folders**: `/folders` (GET, POST)
- **Transcription**: `/transcribe` (POST)
