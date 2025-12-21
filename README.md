# Google Lecture Transcriber

Real-time lecture transcription and AI-powered note generation that integrates with Google services. The project captures live audio, converts it to text, generates structured notes using Gemini, and exports notes (with an audio reference) to Google Docs.

---

## Overview

- Capture live lecture audio (microphone or recorded file) and upload it to Google Docs as an audio reference.
- Transcribe audio → text. The current implementation uses Whisper locally; the architecture supports integrating Google Cloud Speech-to-Text in the future.
- Send transcript chunks to Gemini to produce concise, structured notes and highlights.
- Push notes and audio metadata into Google Docs via the Google Docs API.

---

## Key features

- Live or file-based audio ingestion.
- Local Whisper-based transcription for on-device processing.
- Designed to support Google Cloud Speech-to-Text as a drop-in replacement in the future.
- Gemini-driven summarization, structured notes, and optional Q&A generation.
- Export notes and attach or link the original audio in Google Docs.

---

## Architecture (concise)

1. Audio capture (microphone or uploaded file) → uploaded to Google Docs (audio is attached or linked in the document).
2. Transcription layer: Whisper by default → text output.
   - Future option: replace with Google Cloud Speech-to-Text with minimal changes.
3. Text chunking/streaming → Gemini API → structured notes and highlights.
4. Notes + audio metadata → Google Docs API → create or append a document with session notes and the audio reference.

---

## Quick start

Prerequisites
- Python 3.8+ (or the project's chosen runtime)
- FFmpeg (for audio capture/processing)
- Whisper model available locally (for transcription)
- Gemini API access (API key/credentials)
- Google Cloud project with Google Docs API enabled and credentials JSON (OAuth or service account as required)

Environment variables (examples)
- GEMINI_API_KEY="your_gemini_api_key"
- GOOGLE_APPLICATION_CREDENTIALS="/path/to/google-credentials.json"
- WHISPER_MODEL="small"           # local model choice for Whisper
- OUTPUT_DOC_ID="optional-doc-id" # existing doc id to append to (omit to create a new doc)

Install
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run (placeholders — replace with your repo's entrypoints)
```bash
# Start live capture and transcription (example)
python app.py --source mic

# Or transcribe a file and push notes to Google Docs
python transcribe_file.py --input lecture.mp3 --model $WHISPER_MODEL
```

If you share the actual script names or entrypoints in the repository, these commands can be updated to match.

---

## Usage tips

- Display live transcription on-screen while recording to show progress and correctness.
- Periodically send chunks of the transcript to Gemini to create evolving summaries and highlights (e.g., every 5–10 minutes or on speaker changes).
- Open the resulting Google Doc to demonstrate the final, shareable notes and audio reference.

---

## Privacy & data handling

- Audio and generated notes are stored in Google Docs (and can be stored in associated Google Drive/Cloud Storage if configured).
- When enabling cloud transcription or cloud storage, obtain appropriate consent and follow institutional privacy policies.
- Never commit API keys or credentials to the repository — use environment variables or secrets management.

---

## Extending the project

- Swap Whisper for Google Cloud Speech-to-Text: the transcription layer is designed to be replaceable.
- Add speaker diarization to label speakers in multi-person lectures.
- Improve Gemini prompts and templates to produce slide-like summaries, study guides, or exam-style questions.
- Save audio to Google Drive or Cloud Storage and embed links in the Google Doc.

---

## Troubleshooting & notes

- Choose a Whisper model appropriate for your hardware: smaller models run faster but may be less accurate.
- Monitor API rate limits and costs when enabling cloud services (Gemini and Google Cloud).
- For help wiring Google Docs or Gemini credentials, indicate whether you prefer service account or OAuth flow and the README can be extended with setup steps.

---

## License

MIT — see LICENSE file.

---
