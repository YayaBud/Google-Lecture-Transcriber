from flask import Flask, request, jsonify, redirect, session, url_for
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from bson.objectid import ObjectId
from functools import wraps
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from datetime import datetime
from flask import send_file
import io
import os


# Load environment before other imports
from dotenv import load_dotenv
load_dotenv()


DEVICE = "cpu"
COMPUTE_TYPE = "int8"


# Import faster-whisper instead of openai-whisper   
from faster_whisper import WhisperModel
from typing import Optional, Tuple
from urllib.parse import quote_plus
import time
import tempfile
import subprocess
import json
import shutil
import wave
import struct
import numpy as np
import requests
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
import google.generativeai as genai
from google.genai import types
from google.cloud import speech


# ✅ Gemini setup (FIXED)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
print(f"🔑 Using Gemini API Key: {os.getenv('GEMINI_API_KEY')[:20] if os.getenv('GEMINI_API_KEY') else 'NOT SET'}...")


# ✅ Google Speech-to-Text setup
speech_creds_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', 'google-speech-credentials.json')
if os.path.exists(speech_creds_path):
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = speech_creds_path
    print(f"✅ Google Speech-to-Text credentials loaded from {speech_creds_path}")
else:
    print(f"⚠️ Warning: Google Speech credentials file not found at {speech_creds_path}")


# allow HTTP for local OAuth redirects
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"


app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'super_secret_dev_key_123')

# CORS configuration - update for Railway deployment
frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
CORS(app, supports_credentials=True, origins=[frontend_url, "http://localhost:5173"])


bcrypt = Bcrypt(app)


# MongoDB Setup
username = quote_plus(os.getenv('MONGODB_USER_ID', ''))
password = quote_plus(os.getenv('MONGODB_PASSWORD', ''))
MONGO_URI = os.getenv('MONGODB_URL', '').replace('<db_username>', username).replace('<db_password>', password)


if MONGO_URI and 'authSource' not in MONGO_URI:
    if '?' in MONGO_URI:
        MONGO_URI += "&authSource=admin"
    else:
        MONGO_URI += "?authSource=admin"


if MONGO_URI:
    masked_uri = MONGO_URI.replace(password, '********') if password else MONGO_URI
    print(f"Connecting to MongoDB with URI: {masked_uri}")


try:
    if not MONGO_URI:
        raise Exception("MONGODB_URL environment variable not set")
    
    mongo_client = MongoClient(
        MONGO_URI, 
        serverSelectionTimeoutMS=10000,
        tls=True,
        tlsAllowInvalidCertificates=True  
    )
    db = mongo_client.get_database('note_flow_db')
    users_collection = db.users
    notes_collection = db.notes
    mongo_client.server_info()
    print("✅ Connected to MongoDB!")
except Exception as e:
    print(f"❌ Error connecting to MongoDB: {e}")
    db = None
    users_collection = None
    notes_collection = None


# Auth Decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required', 'needs_login': True}), 401
        return f(*args, **kwargs)
    return decorated_function


# Debug setup
DEBUG_DIR = os.path.join(os.path.dirname(__file__), 'debug_audio')
os.makedirs(DEBUG_DIR, exist_ok=True)


# Load Whisper model with faster-whisper
WHISPER_MODEL = os.getenv('WHISPER_MODEL', 'tiny')  # Change from 'small' to 'tiny'
print(f"Loading Whisper model: {WHISPER_MODEL} on {DEVICE}...")


try:
    model = WhisperModel(
        WHISPER_MODEL,
        device=DEVICE,
        compute_type=COMPUTE_TYPE,
        download_root="./whisper_models",
        num_workers=4
    )
    print(f"✅ Whisper model loaded successfully on {DEVICE}!")
except Exception as e:
    print(f"❌ Error loading Whisper model: {e}")
    model = None


# Check for ffmpeg
ffmpeg_path = shutil.which('ffmpeg')
if not ffmpeg_path:
    print("⚠️ WARNING: 'ffmpeg' not found in PATH.")
else:
    print(f"✅ ffmpeg found at: {ffmpeg_path}")


# ✅ Gemini generation function (FIXED for google-genai SDK)
def generate_with_gemini(prompt: str, timeout: int = 120) -> str:
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini API error: {e}")
        raise


# ✅ Google Speech-to-Text function
def transcribe_with_google_speech(audio_path: str):
    """Transcribe audio using Google Speech-to-Text API"""
    try:
        client = speech.SpeechClient()
        
        # Read audio file
        with open(audio_path, 'rb') as audio_file:
            content = audio_file.read()
        
        audio = speech.RecognitionAudio(content=content)
        
        # Detect format from extension
        ext = os.path.splitext(audio_path)[1].lower()
        
        if ext in ['.webm', '.opus']:
            encoding = speech.RecognitionConfig.AudioEncoding.WEBM_OPUS
            sample_rate = 48000
        elif ext in ['.mp3']:
            encoding = speech.RecognitionConfig.AudioEncoding.MP3
            sample_rate = 48000
        elif ext in ['.wav']:
            encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16
            sample_rate = 16000
        else:
            encoding = speech.RecognitionConfig.AudioEncoding.WEBM_OPUS
            sample_rate = 48000
        
        config = speech.RecognitionConfig(
            encoding=encoding,
            sample_rate_hertz=sample_rate,
            language_code='en-US',
            enable_automatic_punctuation=True,
            model='latest_long',
            use_enhanced=True,
        )
        
        print(f"🎤 Transcribing with Google Speech-to-Text...")
        response = client.recognize(config=config, audio=audio)
        
        transcript = ' '.join([
            result.alternatives[0].transcript 
            for result in response.results
        ])
        
        if response.results and response.results[0].alternatives:
            confidence = response.results[0].alternatives[0].confidence
            print(f"✅ Google Speech confidence: {confidence:.2%}")
        
        return transcript, 'en-US'
        
    except Exception as e:
        print(f"❌ Google Speech error: {e}")
        return None, None


# Audio processing helpers
def reduce_noise_np(audio: np.ndarray, reduction_factor: float = 0.01) -> np.ndarray:
    if audio.ndim > 1:
        audio = audio.flatten()
    audio = np.where(np.abs(audio) < reduction_factor, audio * 0.1, audio)
    if audio.size > 1:
        filtered = np.diff(audio, prepend=audio[0])
        return filtered * 0.8 + audio * 0.2
    return audio


def rms(x: np.ndarray) -> float:
    return float(np.sqrt(np.mean(x.astype(np.float64) ** 2))) if x.size > 0 else 0.0


def trim_silence(audio: np.ndarray, sample_rate: int, thresh_db: float = -40.0, chunk_ms: int = 30):
    thresh = 10 ** (thresh_db / 20.0)
    chunk_size = int(sample_rate * (chunk_ms / 1000.0))
    if chunk_size <= 0:
        return audio
    num_chunks = max(1, int(np.ceil(len(audio) / chunk_size)))
    rms_vals = []
    for i in range(num_chunks):
        start = i * chunk_size
        end = min(len(audio), (i + 1) * chunk_size)
        rms_vals.append(rms(audio[start:end]))
    rms_vals = np.array(rms_vals)
    above = np.where(rms_vals >= thresh)[0]
    if above.size == 0:
        return np.array([], dtype=audio.dtype)
    start_chunk = max(0, above[0])
    end_chunk = min(num_chunks - 1, above[-1])
    start_sample = start_chunk * chunk_size
    end_sample = min(len(audio), (end_chunk + 1) * chunk_size)
    return audio[start_sample:end_sample]


def normalize_audio(audio: np.ndarray) -> np.ndarray:
    if audio is None or audio.size == 0:
        return audio
    peak = np.max(np.abs(audio))
    if peak <= 0:
        return audio
    return audio / float(peak)


def write_wav_mono(path: str, audio: np.ndarray, sr: int):
    audio_clipped = np.clip(audio, -1.0, 1.0)
    int_data = (audio_clipped * 32767.0).astype(np.int16)
    with wave.open(path, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(int_data.tobytes())


def read_wav_mono(path: str):
    with wave.open(path, 'rb') as wf:
        channels = wf.getnchannels()
        sr = wf.getframerate()
        sampwidth = wf.getsampwidth()
        nframes = wf.getnframes()
        data = wf.readframes(nframes)
    if sampwidth == 2:
        arr = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
    else:
        fmt = '<' + 'h' * (len(data) // 2)
        arr = np.array(struct.unpack(fmt, data), dtype=np.float32) / 32768.0
    if channels > 1:
        arr = arr.reshape(-1, channels).mean(axis=1)
    return arr, sr


def decode_audio_to_np(path: str, target_sr: int = 16000) -> Tuple[Optional[np.ndarray], Optional[int]]:
    if not shutil.which('ffmpeg'):
        return None, None
    try:
        cmd = [
            'ffmpeg', '-y', '-i', path,
            '-f', 's16le',
            '-acodec', 'pcm_s16le',
            '-ac', '1',
            '-ar', str(target_sr),
            '-'
        ]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if proc.returncode != 0:
            print(f"ffmpeg decode failed: {proc.stderr.decode('utf-8', errors='ignore')}")
            return None, None
        raw = proc.stdout
        if not raw:
            return None, None
        arr = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        rms_val = np.sqrt(np.mean(arr**2))
        if rms_val < 0.001:
            print(f"WARNING: Audio is silent (RMS: {rms_val:.6f})")
            return None, None
        return arr, target_sr
    except Exception as e:
        print(f"decode_audio_to_np failed: {e}")
        return None, None


# Google OAuth setup
SCOPES = ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive.file']
LOGIN_SCOPES = [
    'openid', 
    'https://www.googleapis.com/auth/userinfo.email', 
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/drive.file'
]
CLIENT_SECRET_FILE = 'credentials_oauth.json'

# Dynamic redirect URIs for Railway
BASE_URL = os.getenv('BASE_URL', 'http://localhost:5000')
FRONTEND_REDIRECT = os.getenv('FRONTEND_URL', 'http://localhost:5173')


@app.route('/auth/google/login')
def google_login():
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRET_FILE,
        scopes=LOGIN_SCOPES,
        redirect_uri=f'{BASE_URL}/auth/google/callback'
    )
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    session['state'] = state
    return redirect(authorization_url)


@app.route('/auth/google/callback')
def google_login_callback():
    try:
        if 'state' not in session:
            return jsonify({'error': 'State missing from session'}), 400
        
        state = session['state']
        
        flow = Flow.from_client_secrets_file(
            CLIENT_SECRET_FILE,
            scopes=LOGIN_SCOPES,
            state=state,
            redirect_uri=f'{BASE_URL}/auth/google/callback'
        )
        flow.fetch_token(authorization_response=request.url)
        credentials = flow.credentials
        
        creds_data = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes
        }
        
        service = build('oauth2', 'v2', credentials=credentials)
        user_info = service.userinfo().get().execute()
        
        email = user_info.get('email')
        first_name = user_info.get('given_name', '')
        last_name = user_info.get('family_name', '')
        
        if not email:
            return jsonify({'error': 'Could not retrieve email'}), 400
            
        user = users_collection.find_one({'email': email})
        
        if user:
            user_id = user['_id']
            users_collection.update_one(
                {'_id': user_id},
                {'$set': {'google_credentials': creds_data}}
            )
        else:
            user_id = users_collection.insert_one({
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                'created_at': time.time(),
                'auth_provider': 'google',
                'google_credentials': creds_data
            }).inserted_id
            
        session['user_id'] = str(user_id)
        print(f"✅ User {email} logged in successfully!")
        return redirect(f"{FRONTEND_REDIRECT}/dashboard")
        
    except Exception as e:
        print(f"❌ OAuth callback error: {str(e)}")
        return redirect(f"{FRONTEND_REDIRECT}/login?error=auth_failed")


@app.route('/auth/status')
def auth_status():
    if 'user_id' in session:
        user = users_collection.find_one({'_id': ObjectId(session['user_id'])})
        if user:
            return jsonify({
                'authenticated': True,
                'user': {
                    'email': user.get('email'),
                    'first_name': user.get('first_name'),
                    'last_name': user.get('last_name'),
                    'auth_provider': user.get('auth_provider', 'local')
                }
            })
    return jsonify({'authenticated': False}), 200


@app.route('/auth/logout')
def logout():
    session.clear()
    return jsonify({'success': True})


@app.route('/transcribe', methods=['POST'])
@login_required
def transcribe_audio():
    """Transcribe audio using Google Speech-to-Text or Whisper"""
    
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400


        # Get method from request (default: whisper for free usage)
        method = request.form.get('method', 'whisper')
        
        audio_file = request.files['audio']
        ts = int(time.time())
        
        orig_ext = os.path.splitext(getattr(audio_file, 'filename', '') or '')[1] or ''
        if not orig_ext:
            ctype = (request.content_type or '')
            if 'webm' in ctype:
                orig_ext = '.webm'
            elif 'ogg' in ctype:
                orig_ext = '.ogg'
            else:
                orig_ext = '.mp4'


        with tempfile.NamedTemporaryFile(delete=False, suffix=orig_ext) as tf:
            audio_file.save(tf.name)
            temp_path = tf.name


        print(f"Saved upload to: {temp_path} (Size: {os.path.getsize(temp_path)} bytes)")
        
        debug_orig_path = os.path.join(DEBUG_DIR, f"{ts}_original{orig_ext}")
        shutil.copy(temp_path, debug_orig_path)
        
        start_time = time.time()
        transcript = None
        language = 'en'
        
        # Try Google Speech if requested
        if method == 'google':
            print(f"🎤 Using Google Speech-to-Text...")
            transcript, language = transcribe_with_google_speech(temp_path)
            
            if not transcript:
                print("⚠️ Google Speech failed, falling back to Whisper...")
                method = 'whisper'
        
        # Use Whisper as fallback or default
        if method == 'whisper' or not transcript:
            if model is None:
                return jsonify({'error': 'Whisper model not loaded'}), 500
                
            print(f"🎤 Using Whisper (local)...")
            segments, info = model.transcribe(
                temp_path,
                language=None,
                task='translate',
                beam_size=5,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=500),
                temperature=0.0,
                condition_on_previous_text=False,
            )
            transcript = ' '.join([segment.text.strip() for segment in segments])
            transcript = transcript.replace(' um ', ' ').replace(' uh ', ' ').strip()
            language = info.language
            method = 'whisper'
        
        elapsed_time = time.time() - start_time
        print(f"✅ Transcription completed in {elapsed_time:.2f}s using {method}")


        try:
            os.unlink(temp_path)
        except:
            pass


        return jsonify({
            'transcript': transcript,
            'success': True,
            'length': len(transcript),
            'duration': f"{elapsed_time:.2f}s",
            'language': language,
            'method': method
        })


    except Exception as e:
        print(f"ERROR: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/generate-notes', methods=['POST'])
@login_required
def generate_notes():
    try:
        data = request.json
        transcript = data.get('transcript', '')
        
        if not transcript:
            return jsonify({'error': 'No transcript provided'}), 400
        
        prompt = f"""You are an expert note-taker. Analyze the following lecture transcript and create structured, easy-to-read notes.


TRANSCRIPT:
{transcript}


INSTRUCTIONS:
1. Identify the Main Topic.
2. List Key Points with bullet points.
3. Extract Important Concepts and define them briefly.
4. Provide a concise Summary.


OUTPUT FORMAT:
## Main Topic


### Key Points
- [Point 1]
- [Point 2]


### Important Concepts
- **[Concept]**: [Definition]


### Summary
[Summary text]
"""
        
        print(f"Generating notes for transcript of length {len(transcript)}")
        notes = generate_with_gemini(prompt)
        print(f"Notes generated successfully!")
        
        note_id = notes_collection.insert_one({
            'user_id': session['user_id'],
            'transcript': transcript,
            'content': notes,
            'preview': notes[:150] + '...' if len(notes) > 150 else notes,
            'title': f"Lecture Notes {time.strftime('%Y-%m-%d %H:%M')}",
            'created_at': time.time(),
            'updated_at': time.time()
        }).inserted_id


        return jsonify({
            'notes': notes,
            'note_id': str(note_id),
            'success': True
        })
    except Exception as e:
        print(f"ERROR generating notes: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('firstName')
    last_name = data.get('lastName')


    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400


    if users_collection.find_one({'email': email}):
        return jsonify({'error': 'User already exists'}), 400


    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    user_id = users_collection.insert_one({
        'email': email,
        'password': hashed_password,
        'first_name': first_name,
        'last_name': last_name,
        'created_at': time.time()
    }).inserted_id


    session['user_id'] = str(user_id)
    return jsonify({'success': True, 'user': {'email': email, 'name': f"{first_name} {last_name}"}})


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')


    user = users_collection.find_one({'email': email})
    if user and bcrypt.check_password_hash(user['password'], password):
        session['user_id'] = str(user['_id'])
        return jsonify({'success': True, 'user': {'email': email, 'name': f"{user.get('first_name', '')} {user.get('last_name', '')}"}})
    
    return jsonify({'error': 'Invalid credentials'}), 401


@app.route('/me', methods=['GET'])
def get_current_user():
    if 'user_id' not in session:
        return jsonify({'authenticated': False}), 401
    
    user = users_collection.find_one({'_id': ObjectId(session['user_id'])})
    if not user:
        return jsonify({'authenticated': False}), 401
        
    return jsonify({
        'authenticated': True,
        'user': {
            'email': user['email'],
            'name': f"{user.get('first_name', '')} {user.get('last_name', '')}",
            'has_google_auth': 'google_credentials' in user
        }
    })


@app.route('/auth/google')
@login_required
def google_auth():
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRET_FILE,
        scopes=SCOPES,
        redirect_uri=f'{BASE_URL}/oauth2callback'
    )
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    session['state'] = state
    return jsonify({'auth_url': authorization_url})


@app.route('/oauth2callback')
def oauth2callback():
    if 'user_id' not in session:
        return redirect(f"{FRONTEND_REDIRECT}/login")


    state = session['state']
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRET_FILE,
        scopes=SCOPES,
        state=state,
        redirect_uri=f'{BASE_URL}/oauth2callback'
    )
    flow.fetch_token(authorization_response=request.url)
    
    credentials = flow.credentials
    creds_data = {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }
    
    users_collection.update_one(
        {'_id': ObjectId(session['user_id'])},
        {'$set': {'google_credentials': creds_data}}
    )
    
    return redirect(f"{FRONTEND_REDIRECT}/dashboard/record")


@app.route('/notes', methods=['GET'])
@login_required
def get_notes():
    try:
        user_id = session['user_id']
        notes_cursor = notes_collection.find({'user_id': user_id}).sort('created_at', -1)
        
        notes = []
        for note in notes_cursor:
            notes.append({
                'id': str(note['_id']),
                'title': note.get('title', 'Untitled Note'),
                'created_at': note.get('created_at'),
                'updated_at': note.get('updated_at'),
                'google_doc_url': note.get('google_doc_url'),
                'google_doc_id': note.get('google_doc_id'),
                'preview': note.get('preview', ''),
                'is_favorite': note.get('is_favorite', False)
            })
            
        return jsonify({'success': True, 'notes': notes})
    except Exception as e:
        print(f"Error fetching notes: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/notes/<note_id>/favorite', methods=['POST'])
@login_required
def toggle_favorite(note_id):
    try:
        user_id = session['user_id']
        note = notes_collection.find_one({'_id': ObjectId(note_id), 'user_id': user_id})
        
        if not note:
            return jsonify({'error': 'Note not found'}), 404
            
        new_status = not note.get('is_favorite', False)
        notes_collection.update_one(
            {'_id': ObjectId(note_id)},
            {'$set': {'is_favorite': new_status}}
        )
        
        return jsonify({'success': True, 'is_favorite': new_status})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/notes/<note_id>/export-pdf', methods=['GET'])
@login_required
def export_pdf(note_id):
    """Export a note to PDF format"""
    try:
        user_id = session['user_id']
        note = notes_collection.find_one({'_id': ObjectId(note_id), 'user_id': user_id})
        
        if not note:
            return jsonify({'error': 'Note not found'}), 404
        
        title = note.get('title', 'Untitled Note')
        content = note.get('content', '')
        created_at = note.get('created_at', time.time())
        
        date_str = datetime.fromtimestamp(created_at).strftime('%B %d, %Y at %H:%M')
        
        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter,
                              rightMargin=0.75*inch,
                              leftMargin=0.75*inch,
                              topMargin=0.75*inch,
                              bottomMargin=0.75*inch)
        
        elements = []
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor='#1f2120',
            spaceAfter=6,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        subtitle_style = ParagraphStyle(
            'Subtitle',
            parent=styles['Normal'],
            fontSize=11,
            textColor='#626C7C',
            alignment=TA_CENTER,
            spaceAfter=12
        )
        
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontSize=11,
            leading=16,
            textColor='#1f2120',
            alignment=TA_LEFT,
            spaceAfter=8
        )
        
        elements.append(Paragraph(title, title_style))
        elements.append(Paragraph(date_str, subtitle_style))
        elements.append(Spacer(1, 0.2*inch))
        
        lines = content.split('\n')
        for line in lines:
            if not line.strip():
                elements.append(Spacer(1, 0.1*inch))
            elif line.startswith('## '):
                heading_style = ParagraphStyle(
                    'Heading2',
                    parent=styles['Heading2'],
                    fontSize=14,
                    textColor='#1f2120',
                    spaceAfter=8,
                    spaceBefore=8,
                    fontName='Helvetica-Bold'
                )
                elements.append(Paragraph(line[3:], heading_style))
            elif line.startswith('### '):
                heading_style = ParagraphStyle(
                    'Heading3',
                    parent=styles['Heading3'],
                    fontSize=12,
                    textColor='#2d6a82',
                    spaceAfter=6,
                    spaceBefore=6,
                    fontName='Helvetica-Bold'
                )
                elements.append(Paragraph(line[4:], heading_style))
            elif line.startswith('- '):
                bullet_style = ParagraphStyle(
                    'BulletPoint',
                    parent=styles['Normal'],
                    fontSize=11,
                    textColor='#1f2120',
                    leftIndent=0.3*inch,
                    spaceAfter=4,
                    leading=14
                )
                elements.append(Paragraph('• ' + line[2:], bullet_style))
            else:
                elements.append(Paragraph(line, body_style))
        
        elements.append(Spacer(1, 0.3*inch))
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=9,
            textColor='#A7A9A9',
            alignment=TA_CENTER
        )
        elements.append(Paragraph('Generated with NoteFlow', footer_style))
        
        doc.build(elements)
        pdf_buffer.seek(0)
        
        filename = f"{title.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
    
    except Exception as e:
        print(f"Error exporting PDF: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/folders', methods=['GET'])
@login_required
def get_folders():
    try:
        user_id = session['user_id']
        folders_cursor = db.folders.find({'user_id': user_id}).sort('created_at', -1)
        
        folders = []
        for folder in folders_cursor:
            folders.append({
                'id': str(folder['_id']),
                'name': folder.get('name'),
                'note_ids': folder.get('note_ids', []),
                'created_at': folder.get('created_at')
            })
        return jsonify({'success': True, 'folders': folders})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/folders/<folder_id>', methods=['PUT'])
@login_required
def update_folder(folder_id):
    try:
        data = request.json
        user_id = session['user_id']
        
        folder = db.folders.find_one({'_id': ObjectId(folder_id), 'user_id': user_id})
        if not folder:
            return jsonify({'error': 'Folder not found'}), 404
        
        update_fields = {}
        if 'name' in data:
            update_fields['name'] = data['name']
        if 'note_ids' in data:
            update_fields['note_ids'] = data['note_ids']
        
        db.folders.update_one(
            {'_id': ObjectId(folder_id)},
            {'$set': update_fields}
        )
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/folders/<folder_id>', methods=['DELETE'])
@login_required
def delete_folder(folder_id):
    try:
        user_id = session['user_id']
        result = db.folders.delete_one({'_id': ObjectId(folder_id), 'user_id': user_id})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Folder not found'}), 404
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/folders/<folder_id>/notes', methods=['POST'])
@login_required
def add_notes_to_folder(folder_id):
    try:
        user_id = session['user_id']
        data = request.json
        note_ids = data.get('note_ids', [])
        
        if not note_ids:
            return jsonify({"error": "No notes provided"}), 400
        
        folder = db.folders.find_one({"_id": ObjectId(folder_id), "user_id": user_id})
        if not folder:
            return jsonify({"error": "Folder not found"}), 404
        
        current_note_ids = folder.get('note_ids', [])
        updated_note_ids = list(set(current_note_ids + note_ids))
        
        db.folders.update_one(
            {"_id": ObjectId(folder_id)},
            {"$set": {"note_ids": updated_note_ids}}
        )
        
        return jsonify({
            "success": True, 
            "message": f"{len(note_ids)} note(s) added to folder"
        })
        
    except Exception as e:
        print(f"Error adding notes to folder: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/folders', methods=['POST'])
@login_required
def create_folder():
    try:
        userid = session['user_id']
        data = request.json
        name = data.get('name')
        note_ids = data.get('note_ids', [])
        
        if not name:
            return jsonify({'error': 'Folder name is required'}), 400
        
        folder_doc = {
            'user_id': userid,
            'name': name,
            'note_ids': note_ids,
            'created_at': time.time()
        }
        
        result = db.folders.insert_one(folder_doc)
        return jsonify({'success': True, 'folder_id': str(result.inserted_id)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/notes', methods=['POST'])
@login_required
def create_note_metadata():
    try:
        data = request.json
        user_id = session['user_id']
        title = data.get('title', 'Untitled Note')
        preview = data.get('preview', '')
        
        note_doc = {
            'user_id': user_id,
            'title': title,
            'preview': preview,
            'created_at': time.time(),
            'updated_at': time.time(),
            'google_doc_url': None,
            'google_doc_id': None
        }
        
        result = notes_collection.insert_one(note_doc)
        
        return jsonify({
            'success': True, 
            'note_id': str(result.inserted_id)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/notes/<note_id>', methods=['PUT'])
@login_required
def update_note(note_id):
    try:
        data = request.json
        user_id = session['user_id']
        
        note = notes_collection.find_one({'_id': ObjectId(note_id), 'user_id': user_id})
        if not note:
            return jsonify({'error': 'Note not found'}), 404
        
        update_fields = {'updated_at': time.time()}
        
        if 'title' in data:
            update_fields['title'] = data['title']
        if 'content' in data:
            update_fields['content'] = data['content']
        
        notes_collection.update_one(
            {'_id': ObjectId(note_id)},
            {'$set': update_fields}
        )
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/notes/<note_id>', methods=['DELETE'])
@login_required
def delete_note(note_id):
    try:
        user_id = session['user_id']
        result = notes_collection.delete_one({'_id': ObjectId(note_id), 'user_id': user_id})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Note not found'}), 404
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/push-to-docs', methods=['POST'])
@login_required
def push_to_docs():
    try:
        user = users_collection.find_one({'_id': ObjectId(session['user_id'])})
        if not user or 'google_credentials' not in user:
             return jsonify({'error': 'Google account not connected', 'needs_auth': True}), 401


        creds_data = user['google_credentials']
        credentials = Credentials(**creds_data)
        
        data = request.json
        notes = data.get('notes', '')
        title = data.get('title', 'Lecture Notes')
        note_id = data.get('note_id')
        
        if not notes:
            return jsonify({'error': 'No notes provided'}), 400
        
        docs_service = build('docs', 'v1', credentials=credentials)
        doc = docs_service.documents().create(body={'title': title}).execute()
        doc_id = doc.get('documentId')
        
        requests_body = [{
            'insertText': {
                'location': {'index': 1},
                'text': notes
            }
        }]
        
        docs_service.documents().batchUpdate(
            documentId=doc_id,
            body={'requests': requests_body}
        ).execute()
        
        doc_url = f"https://docs.google.com/document/d/{doc_id}/edit"
        print(f"Document created: {doc_url}")
        
        if note_id:
            notes_collection.update_one(
                {'_id': ObjectId(note_id), 'user_id': session['user_id']},
                {'$set': {
                    'google_doc_id': doc_id,
                    'google_doc_url': doc_url,
                    'updated_at': time.time()
                }}
            )
        else:
            preview = notes[:100] + "..." if len(notes) > 100 else notes
            new_note = {
                'user_id': session['user_id'],
                'title': title,
                'preview': preview,
                'created_at': time.time(),
                'updated_at': time.time(),
                'google_doc_id': doc_id,
                'google_doc_url': doc_url
            }
            result = notes_collection.insert_one(new_note)
            note_id = str(result.inserted_id)
        
        return jsonify({
            'success': True,
            'doc_url': doc_url,
            'doc_id': doc_id,
            'note_id': note_id
        })
    except Exception as e:
        print(f"ERROR pushing to docs: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'running'})


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', debug=False, port=port)
