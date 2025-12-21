from flask import Flask, request, jsonify, redirect, session
from flask_cors import CORS
import whisper
import os
import tempfile
from dotenv import load_dotenv
from google import genai
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

# allow HTTP for local OAuth redirects
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management
CORS(app, supports_credentials=True)

# Load Whisper model
print("Loading Whisper model...")
model = whisper.load_model("base")
print("Whisper model loaded!")

# Configure Gemini
client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
print("Gemini configured!")

# Google OAuth setup
SCOPES = ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive.file']
CLIENT_SECRET_FILE = 'credentials_oauth.json'

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        # Save audio file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            audio_file.save(temp_audio.name)
            temp_path = temp_audio.name
        
        # Get file size for debugging
        file_size = os.path.getsize(temp_path)
        print(f"Audio file size: {file_size} bytes")
        
        # Transcribe with Whisper
        print("Starting Whisper transcription...")
        result = model.transcribe(temp_path)
        transcript = result["text"]
        
        print(f"Transcription complete!")
        print(f"Transcript length: {len(transcript)} characters")
        print(f"Transcript: '{transcript}'")
        
        # Clean up temp file
        os.unlink(temp_path)
        
        # Return transcript even if empty (for debugging)
        return jsonify({
            'transcript': transcript,
            'success': True,
            'length': len(transcript)
        })
    
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/generate-notes', methods=['POST'])
def generate_notes():
    try:
        data = request.json
        transcript = data.get('transcript', '')
        
        if not transcript:
            return jsonify({'error': 'No transcript provided'}), 400
        
        prompt = f"""Convert this lecture transcript into structured notes:

{transcript}

Format the output as:
## Main Topic

### Key Points
- Point 1
- Point 2
- Point 3

### Important Concepts
- Concept 1
- Concept 2

### Summary
Brief summary of the lecture.
"""
        
        print(f"Generating notes for transcript of length {len(transcript)}")
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt
        )
        notes = response.text
        print(f"Notes generated successfully! Length: {len(notes)}")
        
        return jsonify({
            'notes': notes,
            'success': True
        })
    
    except Exception as e:
        print(f"ERROR generating notes: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/auth/google')
def google_auth():
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRET_FILE,
        scopes=SCOPES,
        redirect_uri='http://localhost:5000/oauth2callback'
    )
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    session['state'] = state
    return jsonify({'auth_url': authorization_url})

@app.route('/oauth2callback')
def oauth2callback():
    state = session['state']
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRET_FILE,
        scopes=SCOPES,
        state=state,
        redirect_uri='http://localhost:5000/oauth2callback'
    )
    flow.fetch_token(authorization_response=request.url)
    
    credentials = flow.credentials
    session['credentials'] = {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }
    
    return redirect("http://localhost:5173/dashboard")

@app.route('/push-to-docs', methods=['POST'])
def push_to_docs():
    try:
        if 'credentials' not in session:
            return jsonify({'error': 'Not authenticated', 'needs_auth': True}), 401
        
        data = request.json
        notes = data.get('notes', '')
        title = data.get('title', 'Lecture Notes')
        
        if not notes:
            return jsonify({'error': 'No notes provided'}), 400
        
        credentials = Credentials(**session['credentials'])
        
        # Create new Google Doc
        docs_service = build('docs', 'v1', credentials=credentials)
        drive_service = build('drive', 'v3', credentials=credentials)
        
        # Create document
        doc = docs_service.documents().create(body={'title': title}).execute()
        doc_id = doc.get('documentId')
        
        # Insert notes content
        requests = [
            {
                'insertText': {
                    'location': {'index': 1},
                    'text': notes
                }
            }
        ]
        
        docs_service.documents().batchUpdate(
            documentId=doc_id,
            body={'requests': requests}
        ).execute()
        
        doc_url = f"https://docs.google.com/document/d/{doc_id}/edit"
        
        print(f"Document created successfully: {doc_url}")
        
        return jsonify({
            'success': True,
            'doc_url': doc_url,
            'doc_id': doc_id
        })
    
    except Exception as e:
        print(f"ERROR pushing to docs: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'running'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
