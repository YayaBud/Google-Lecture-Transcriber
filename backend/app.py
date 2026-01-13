from flask import Flask, request, jsonify, redirect, session, url_for, send_file
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from bson.objectid import ObjectId
from functools import wraps
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from datetime import datetime, timedelta
from typing import Optional, Tuple
from urllib.parse import quote_plus
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
import google.generativeai as genai
from google.cloud import speech
from faster_whisper import WhisperModel
import io
import os
import time
import tempfile
import subprocess
import shutil
import wave
import struct
import numpy as np
import jwt
import re

# Load environment variables
from dotenv import load_dotenv
load_dotenv()


# ===========================
# 1️⃣ SINGLE APP INITIALIZATION
# ===========================
app = Flask(__name__)


# ===========================
# 2️⃣ SINGLE SECRET KEY CONFIG
# ===========================
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'super_secret_dev_key_123')


# ===========================
# 2️⃣.5 JWT CONFIGURATION
# ===========================
JWT_SECRET = os.getenv('JWT_SECRET_KEY', app.config['SECRET_KEY'])
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 168  # 7 days


# ===========================
# 3️⃣ SINGLE SESSION CONFIG
# ===========================
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='None',
    SESSION_COOKIE_DOMAIN=None,
    PERMANENT_SESSION_LIFETIME=604800  # 7 days
)


# ===========================
# 4️⃣ SINGLE CORS CONFIG - UPDATED FOR MOBILE
# ===========================
frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')

# ✅ EXPANDED: Include all possible origins for mobile compatibility
allowed_origins = [
    'https://google-lecture-transcriber.vercel.app',
    frontend_url,
    'http://localhost:5173',
    'http://localhost:5000',
    'http://localhost:3000',
    # Mobile app origins
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'https://localhost',
]

# Remove empty strings from origins
allowed_origins = [origin for origin in allowed_origins if origin]

print(f"✅ CORS enabled for origins: {allowed_origins}")

CORS(app, 
     origins=allowed_origins,
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     expose_headers=['Set-Cookie', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     max_age=3600  # Cache preflight requests for 1 hour
)


# ===========================
# 5️⃣ SINGLE BCRYPT INIT
# ===========================
bcrypt = Bcrypt(app)


# ===========================
# 6️⃣ ENVIRONMENT SETUP
# ===========================
DEVICE = "cpu"
COMPUTE_TYPE = "int8"
BASE_URL = os.getenv('BASE_URL', 'http://localhost:5000')
FRONTEND_REDIRECT = frontend_url
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"


# ===========================
# 7️⃣ GEMINI SETUP
# ===========================
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")  # ✅ Using 1.5-flash for stability
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
print(f"🔑 Using Gemini API Key: {os.getenv('GEMINI_API_KEY')[:20] if os.getenv('GEMINI_API_KEY') else 'NOT SET'}...")


# ===========================
# 8️⃣ GOOGLE SPEECH-TO-TEXT SETUP
# ===========================
speech_creds_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', 'google-speech-credentials.json')
if os.path.exists(speech_creds_path):
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = speech_creds_path
    print(f"✅ Google Speech-to-Text credentials loaded from {speech_creds_path}")
else:
    print(f"⚠️ Warning: Google Speech credentials file not found at {speech_creds_path}")


# ===========================
# 9️⃣ MONGODB SETUP
# ===========================
username = quote_plus(os.getenv('MONGODB_USER_ID', ''))
password = quote_plus(os.getenv('MONGODB_PASSWORD', ''))
MONGO_URI = os.getenv('MONGODB_URL', '').replace('<db_username>', username).replace('<db_password>', password)


if MONGO_URI and 'authSource' not in MONGO_URI:
    MONGO_URI += "&authSource=admin" if '?' in MONGO_URI else "?authSource=admin"


try:
    if not MONGO_URI:
        raise Exception("MONGODB_URL environment variable not set")

    masked_uri = MONGO_URI.replace(password, '********') if password else MONGO_URI
    print(f"Connecting to MongoDB with URI: {masked_uri}")

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


# ===========================
# 🔟 GOOGLE OAUTH SETUP
# ===========================
SCOPES = ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive.file']
LOGIN_SCOPES = [
    'openid', 
    'https://www.googleapis.com/auth/userinfo.email', 
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/drive.file'
]


CLIENT_SECRET_FILE = 'credentials_oauth.json'
if not os.path.exists(CLIENT_SECRET_FILE):
    print(f"⚠️ WARNING: OAuth credentials not found at {CLIENT_SECRET_FILE}")
    print(f"⚠️ Google OAuth routes will be disabled")
    CLIENT_SECRET_FILE = None


# ===========================
# 1️⃣1️⃣ WHISPER MODEL SETUP
# ===========================
DEBUG_DIR = os.path.join(os.path.dirname(__file__), 'debug_audio')
os.makedirs(DEBUG_DIR, exist_ok=True)

# ✅ AUDIO STORAGE DIRECTORY
AUDIO_STORAGE_DIR = os.path.join(os.path.dirname(__file__), 'stored_audio')
os.makedirs(AUDIO_STORAGE_DIR, exist_ok=True)
print(f"✅ Audio storage directory: {AUDIO_STORAGE_DIR}")

WHISPER_MODEL = os.getenv('WHISPER_MODEL', 'tiny')
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


# ===========================
# 🔧 MOBILE COOKIE FIX - UPDATED
# ===========================
@app.after_request
def after_request(response):
    """Add headers for mobile cookie compatibility"""
    origin = request.headers.get('Origin')

    # ✅ EXPANDED: Allow credentials from allowed origins INCLUDING mobile
    allowed_origins_list = [
        'https://google-lecture-transcriber.vercel.app',
        'http://localhost:5173',
        'http://localhost:5000',
        os.getenv('FRONTEND_URL', ''),
        # ✅ ADD MOBILE APP ORIGINS
        'capacitor://localhost',
        'ionic://localhost',
        'http://localhost',
        'https://localhost'
    ]

    # ✅ Allow requests with no origin (mobile apps sometimes send null)
    if origin in allowed_origins_list or origin is None:
        if origin:
            response.headers['Access-Control-Allow-Origin'] = origin
        else:
            # For mobile apps with no origin
            response.headers['Access-Control-Allow-Origin'] = '*'
        
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Expose-Headers'] = 'Set-Cookie'

    # Additional headers for mobile compatibility
    response.headers['Vary'] = 'Origin'

    # Ensure cookies work on mobile
    if 'Set-Cookie' in response.headers:
        cookie = response.headers['Set-Cookie']
        # Make sure SameSite=None and Secure are set
        if 'SameSite=None' not in cookie:
            response.headers['Set-Cookie'] = cookie + '; SameSite=None; Secure'

    return response


# ===========================
# 🛠️ HELPER FUNCTIONS - UPDATED
# ===========================

def create_access_token(user_id: str) -> str:
    """Create JWT token for mobile authentication"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    """Verify JWT token"""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        print("❌ Token expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"❌ Invalid token: {e}")
        return None

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = None
        auth_method = None
        
        # ✅ PRIORITY 1: CHECK TOKEN FIRST (for mobile - more reliable)
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            payload = verify_token(token)
            if payload:
                user_id = payload['user_id']
                auth_method = 'token'
                print(f"✅ Token auth successful for user: {user_id}")
        
        # ✅ PRIORITY 2: CHECK SESSION (for desktop browsers)
        if not user_id and 'user_id' in session:
            user_id = session['user_id']
            auth_method = 'session'
            print(f"✅ Session auth successful for user: {user_id}")
        
        # ✅ If no auth found, return 401
        if not user_id:
            print("❌ No authentication found - returning 401")
            return jsonify({
                'error': 'Authentication required', 
                'needs_login': True,
                'message': 'Please log in to access this resource'
            }), 401
        
        # ✅ Store user_id in request context for use in route handlers
        request.user_id = user_id
        request.auth_method = auth_method
        
        return f(*args, **kwargs)
    return decorated_function

def generate_with_gemini(prompt: str, timeout: int = 120) -> str:
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini API error: {e}")
        raise

def clean_transcript_with_gemini(raw_transcript: str) -> str:
    """Clean transcript errors using Gemini with academic context"""
    try:
        prompt = f"""You are correcting a lecture/educational transcript with potential speech-to-text errors.

CONTEXT: This is from an academic lecture (science, medicine, engineering, etc.)

COMMON ERRORS:
- Scientific terms misheard (e.g., "My Tocondria" → "Mitochondria")
- Technical jargon garbled
- Acronyms misinterpreted

RULES:
1. Fix obvious misheard words using academic context
2. Preserve the speaker's exact meaning
3. Keep conversational tone (it's spoken lecture, not written essay)
4. If a word could be scientific, assume it is
5. Return ONLY the corrected text, no explanations

TRANSCRIPT TO FIX:
{raw_transcript}

CORRECTED VERSION:"""
        
        cleaned = generate_with_gemini(prompt, timeout=30)
        print(f"✅ Transcript cleaned: {len(raw_transcript)} → {len(cleaned)} chars")
        return cleaned
    except Exception as e:
        print(f"❌ Gemini cleaning failed: {e}, using original")
        return raw_transcript

def transcribe_with_google_speech(audio_path: str):
    try:
        client = speech.SpeechClient()

        with open(audio_path, 'rb') as audio_file:
            content = audio_file.read()

        audio = speech.RecognitionAudio(content=content)
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

def chunk_audio_file(input_path, chunk_duration_sec=60):
    """
    Split audio/video file into smaller chunks for transcription.
    Returns list of chunk file paths.
    """
    chunks = []
    try:
        # Get total duration using ffprobe
        probe_cmd = [
            'ffprobe', '-v', 'error', '-show_entries',
            'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1',
            input_path
        ]
        result = subprocess.run(probe_cmd, capture_output=True, text=True)
        total_duration = float(result.stdout.strip())
        
        print(f"Total audio duration: {total_duration:.2f}s")
        
        # Calculate number of chunks needed
        num_chunks = int(np.ceil(total_duration / chunk_duration_sec))
        
        # Create chunks
        for i in range(num_chunks):
            start_time = i * chunk_duration_sec
            chunk_path = os.path.join(
                tempfile.gettempdir(), 
                f"chunk_{i}_{int(time.time())}.wav"
            )
            
            # Extract chunk using ffmpeg
            cmd = [
                'ffmpeg', '-y', '-i', input_path,
                '-ss', str(start_time),
                '-t', str(chunk_duration_sec),
                '-acodec', 'pcm_s16le',
                '-ac', '1',
                '-ar', '16000',
                chunk_path
            ]
            
            proc = subprocess.run(cmd, capture_output=True)
            if proc.returncode == 0 and os.path.exists(chunk_path):
                chunks.append(chunk_path)
                print(f"Created chunk {i+1}/{num_chunks}: {chunk_path}")
            else:
                print(f"Failed to create chunk {i}")
        
        return chunks
    
    except Exception as e:
        print(f"Error chunking audio: {e}")
        # Cleanup any created chunks on error
        for chunk in chunks:
            try:
                os.unlink(chunk)
            except:
                pass
        return []

# ===========================
# 🔐 AUTHENTICATION ROUTES - UPDATED
# ===========================


@app.route('/auth/google/login')
def google_login():
    if not CLIENT_SECRET_FILE:
        return jsonify({'error': 'Google OAuth not configured on server'}), 503

    flow = Flow.from_client_secrets_file(
        CLIENT_SECRET_FILE,
        scopes=LOGIN_SCOPES,
        redirect_uri=f'{BASE_URL}/auth/google/callback'
    )
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'  # ✅ Forces refresh token
    )
    session['state'] = state
    return redirect(authorization_url)



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
        'created_at': time.time(),
        'auth_provider': 'local'
    }).inserted_id

    # ✅ Set session
    session['user_id'] = str(user_id)
    session.permanent = True

    # ✅ Create JWT token for mobile
    token = create_access_token(str(user_id))

    print(f"✅ New user registered: {email}")
    print(f"✅ Generated token for user: {str(user_id)}")

    return jsonify({
        'success': True,
        'token': token,
        'user': {
            'id': str(user_id),
            'email': email,
            'name': f"{first_name} {last_name}"
        }
    })


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    user = users_collection.find_one({'email': email})

    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401

    if user.get('auth_provider') == 'google' and 'password' not in user:
        return jsonify({'error': 'Please sign in with Google'}), 401

    if 'password' in user and bcrypt.check_password_hash(user['password'], password):
        user_id = str(user['_id'])
        
        # ✅ Set session
        session['user_id'] = user_id
        session.permanent = True

        # ✅ Create JWT token for mobile
        token = create_access_token(user_id)

        print(f"✅ User logged in: {email}")
        print(f"✅ Generated token for user: {user_id}")

        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user_id,
                'email': email,
                'name': f"{user.get('first_name', '')} {user.get('last_name', '')}"
            }
        })

    return jsonify({'error': 'Invalid credentials'}), 401


@app.route('/auth/status')
def auth_status():
    """Check authentication status - supports both session and token"""
    user_id = None
    auth_method = None
    
    # ✅ Check JWT token first
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        payload = verify_token(token)
        if payload:
            user_id = payload['user_id']
            auth_method = 'token'
            print(f"✅ Auth status check via token for user: {user_id}")
    
    # ✅ Check session if no token
    if not user_id and 'user_id' in session:
        user_id = session['user_id']
        auth_method = 'session'
        print(f"✅ Auth status check via session for user: {user_id}")
    
    if user_id:
        try:
            user = users_collection.find_one({'_id': ObjectId(user_id)})
            if user:
                return jsonify({
                    'authenticated': True,
                    'auth_method': auth_method,
                    'user': {
                        'id': str(user['_id']),
                        'email': user.get('email'),
                        'first_name': user.get('first_name'),
                        'last_name': user.get('last_name'),
                        'auth_provider': user.get('auth_provider', 'local')
                    }
                })
        except Exception as e:
            print(f"❌ Error fetching user: {e}")
    
    print("❌ Auth status check failed - not authenticated")
    return jsonify({'authenticated': False}), 200


@app.route('/auth/logout', methods=['GET', 'POST'])
def logout():
    """Logout - clear session (token is cleared client-side)"""
    session.clear()
    print("✅ User logged out")
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/auth/verify-token', methods=['POST'])
def verify_token_endpoint():
    """Verify a JWT token and return user info - for handling OAuth redirects"""
    try:
        data = request.json
        token = data.get('token')
        
        if not token:
            return jsonify({'error': 'Token required'}), 400
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        user_id = payload['user_id']
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Also set session as backup
        session['user_id'] = user_id
        session.permanent = True
        
        print(f"✅ Token verified for user: {user_id}")
        
        return jsonify({
            'success': True,
            'authenticated': True,
            'token': token,
            'user': {
                'id': str(user['_id']),
                'email': user.get('email'),
                'first_name': user.get('first_name'),
                'last_name': user.get('last_name'),
                'name': f"{user.get('first_name', '')} {user.get('last_name', '')}",
                'auth_provider': user.get('auth_provider', 'local'),
                'has_google_auth': 'google_credentials' in user
            }
        })
        
    except Exception as e:
        print(f"❌ Error verifying token: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/me', methods=['GET'])
def get_current_user():
    """Get current user info - supports both session and token"""
    user_id = None
    auth_method = None

    # ✅ Check JWT token first
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        payload = verify_token(token)
        if payload:
            user_id = payload['user_id']
            auth_method = 'token'
    
    # ✅ Check session if no token
    if not user_id and 'user_id' in session:
        user_id = session['user_id']
        auth_method = 'session'

    if not user_id:
        return jsonify({
            'authenticated': False,
            'error': 'Not authenticated'
        }), 401

    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({
                'authenticated': False,
                'error': 'User not found'
            }), 401

        return jsonify({
            'authenticated': True,
            'auth_method': auth_method,
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'name': f"{user.get('first_name', '')} {user.get('last_name', '')}",
                'first_name': user.get('first_name'),
                'last_name': user.get('last_name'),
                'has_google_auth': 'google_credentials' in user,
                'auth_provider': user.get('auth_provider', 'local')
            }
        })
    except Exception as e:
        print(f"❌ Error in /me endpoint: {e}")
        return jsonify({
            'authenticated': False,
            'error': str(e)
        }), 500


# ===========================
# 🎙️ TRANSCRIPTION ROUTES
# ===========================


@app.route('/transcribe', methods=['POST'])
@login_required
def transcribe_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

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
        
        # Check if Whisper model is loaded
        if model is None:
            return jsonify({'error': 'Whisper model not loaded'}), 500

        # Get audio duration
        probe_cmd = [
            'ffprobe', '-v', 'error', '-show_entries',
            'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1',
            temp_path
        ]
        duration_result = subprocess.run(probe_cmd, capture_output=True, text=True)
        
        try:
            duration = float(duration_result.stdout.strip())
        except:
            duration = 0
        
        print(f"📊 Audio duration: {duration:.2f}s")

        # ✅ CORRECT CHUNKING LOGIC
        if duration > 60:
            print(f"🎤 Using Whisper with chunking (file > 60s)...")
            chunks = chunk_audio_file(temp_path, chunk_duration_sec=60)
            
            if not chunks:
                return jsonify({'error': 'Failed to chunk audio file'}), 500
            
            chunk_transcripts = []
            for idx, chunk_path in enumerate(chunks):
                print(f"🎤 Transcribing chunk {idx+1}/{len(chunks)}...")
                
                segments, info = model.transcribe(
                    chunk_path,
                    language=None,
                    task='translate',
                    beam_size=5,
                    vad_filter=True,
                    vad_parameters=dict(min_silence_duration_ms=500),
                    temperature=0.0,
                    condition_on_previous_text=False,
                )
                
                chunk_transcript = ' '.join([segment.text.strip() for segment in segments])
                chunk_transcript = chunk_transcript.replace(' um ', ' ').replace(' uh ', ' ').strip()
                chunk_transcripts.append(chunk_transcript)
                language = info.language
                
                # Clean up chunk file
                try:
                    os.unlink(chunk_path)
                except:
                    pass
            
            # ✅ MERGE CHUNKS FIRST, THEN CLEAN ONCE
            transcript = ' '.join(chunk_transcripts)
            print(f"✅ Merged {len(chunk_transcripts)} chunks")
            
            # ✅ NOW clean the merged transcript with Gemini
            print(f"🧹 Cleaning merged transcript with Gemini...")
            transcript = clean_transcript_with_gemini(transcript)
            
        else:
            # Original approach for short files
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
            
            # ✅ Clean short transcripts too
            print(f"🧹 Cleaning transcript with Gemini...")
            transcript = clean_transcript_with_gemini(transcript)

        elapsed_time = time.time() - start_time
        print(f"✅ Transcription completed in {elapsed_time:.2f}s using Whisper")

        # ✅ SAVE AUDIO FILE for playback
        audio_filename = f"{ts}_{request.user_id}.webm"
        saved_audio_path = os.path.join(AUDIO_STORAGE_DIR, audio_filename)
        shutil.copy(temp_path, saved_audio_path)
        print(f"💾 Saved audio to: {saved_audio_path}")

        try:
            os.unlink(temp_path)
        except:
            pass

        return jsonify({
            'transcript': transcript,
            'audio_url': f'/audio/{audio_filename}',  # ← Return audio URL
            'success': True,
            'length': len(transcript),
            'duration': f"{elapsed_time:.2f}s",
            'language': language,
            'method': 'whisper'
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

        # ✨ Extract AI-generated title from Main Topic
        import re
        title = None
        
        # Try to extract the Main Topic section
        title_match = re.search(r'## Main Topic\s*\n+(.+?)(?:\n|$)', notes, re.IGNORECASE)
        
        if title_match:
            title = title_match.group(1).strip()
            # Remove any markdown formatting
            title = re.sub(r'[#*_`]', '', title)
            # Limit to 80 characters for UI
            if len(title) > 80:
                title = title[:77] + '...'
            print(f"📝 Extracted title from Main Topic: {title}")
        
        # Fallback: Use Gemini to generate a title if extraction fails
        if not title or len(title) < 5:
            print("⚠️ Could not extract title, generating with Gemini...")
            title_prompt = f"""Based on these lecture notes, generate a short, descriptive title (max 60 characters). 
Return ONLY the title, nothing else.

NOTES:
{notes[:500]}"""
            
            try:
                title = generate_with_gemini(title_prompt, timeout=10).strip()
                # Remove quotes if Gemini added them
                title = title.strip('"\'')
                if len(title) > 80:
                    title = title[:77] + '...'
                print(f"📝 Generated title with Gemini: {title}")
            except Exception as e:
                print(f"❌ Error generating title: {e}")
                title = None
        
        # Final fallback: Use timestamp
        if not title or len(title) < 5:
            title = f"Lecture Notes {time.strftime('%Y-%m-%d %H:%M')}"
            print(f"📝 Using fallback timestamp title: {title}")

        # Get user_id from request context (set by login_required decorator)
        user_id = getattr(request, 'user_id', session.get('user_id'))

        note_id = notes_collection.insert_one({
            'user_id': user_id,
            'transcript': transcript,
            'content': notes,
            'preview': notes[:150] + '...' if len(notes) > 150 else notes,
            'title': title,
            'created_at': time.time(),
            'updated_at': time.time()
        }).inserted_id

        return jsonify({
            'notes': notes,
            'note_id': str(note_id),
            'title': title,
            'success': True
        })
        
    except Exception as e:
        print(f"ERROR generating notes: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ===========================
# 📄 NOTES MANAGEMENT ROUTES
# ===========================


@app.route('/notes', methods=['GET'])
@login_required
def get_notes():
    try:
        user_id = getattr(request, 'user_id', session.get('user_id'))
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
    
@app.route('/notes', methods=['POST'])
@login_required
def create_note_metadata():
    try:
        data = request.json
        user_id = getattr(request, 'user_id', session.get('user_id'))
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

@app.route('/notes/<note_id>', methods=['GET'])
@login_required
def get_note(note_id):
    """Get a single note by ID"""
    try:
        user_id = getattr(request, 'user_id', session.get('user_id'))
        note = notes_collection.find_one({
            '_id': ObjectId(note_id),
            'user_id': user_id
        })
        
        if not note:
            return jsonify({'error': 'Note not found'}), 404
        
        return jsonify({
            'success': True,
            'id': str(note['_id']),
            'title': note.get('title', 'Untitled Note'),
            'content': note.get('content', note.get('transcript', '')),  # Return full content
            'preview': note.get('preview', ''),
            'created_at': note.get('created_at'),
            'updated_at': note.get('updated_at'),
            'google_doc_url': note.get('google_doc_url'),
            'google_doc_id': note.get('google_doc_id'),
            'is_favorite': note.get('is_favorite', False)
        })
    except Exception as e:
        print(f"Error fetching note: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/notes/<note_id>', methods=['PUT'])
@login_required
def update_note(note_id):
    try:
        data = request.json
        user_id = getattr(request, 'user_id', session.get('user_id'))

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
        user_id = getattr(request, 'user_id', session.get('user_id'))
        result = notes_collection.delete_one({'_id': ObjectId(note_id), 'user_id': user_id})

        if result.deleted_count == 0:
            return jsonify({'error': 'Note not found'}), 404

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/notes/<note_id>/favorite', methods=['POST'])
@login_required
def toggle_favorite(note_id):
    try:
        user_id = getattr(request, 'user_id', session.get('user_id'))
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
    try:
        user_id = getattr(request, 'user_id', session.get('user_id'))
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


# ===========================
# 📁 FOLDERS ROUTES
# ===========================


@app.route('/folders', methods=['GET'])
@login_required
def get_folders():
    try:
        user_id = getattr(request, 'user_id', session.get('user_id'))
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


@app.route('/folders', methods=['POST'])
@login_required
def create_folder():
    try:
        user_id = getattr(request, 'user_id', session.get('user_id'))
        data = request.json
        name = data.get('name')
        note_ids = data.get('note_ids', [])

        if not name:
            return jsonify({'error': 'Folder name is required'}), 400

        folder_doc = {
            'user_id': user_id,
            'name': name,
            'note_ids': note_ids,
            'created_at': time.time()
        }

        result = db.folders.insert_one(folder_doc)
        return jsonify({'success': True, 'folder_id': str(result.inserted_id)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/folders/<folder_id>', methods=['PUT'])
@login_required
def update_folder(folder_id):
    try:
        data = request.json
        user_id = getattr(request, 'user_id', session.get('user_id'))

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
        user_id = getattr(request, 'user_id', session.get('user_id'))
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
        user_id = getattr(request, 'user_id', session.get('user_id'))
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


# ===========================
# 📤 GOOGLE DOCS INTEGRATION
# ===========================


@app.route('/auth/google')
@login_required
def google_auth():
    if not CLIENT_SECRET_FILE:
        return jsonify({'error': 'Google OAuth not configured on server'}), 503

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
    if not CLIENT_SECRET_FILE:
        return redirect(f"{FRONTEND_REDIRECT}/dashboard?error=oauth_not_configured")

    if 'user_id' not in session:
        return redirect(f"{FRONTEND_REDIRECT}/login")

    try:
        state = session['state']
        flow = Flow.from_client_secrets_file(
            CLIENT_SECRET_FILE,
            scopes=SCOPES,
            state=state,
            redirect_uri=f'{BASE_URL}/oauth2callback'
        )
        flow.fetch_token(authorization_response=request.url)

        credentials = flow.credentials

        # ✅ BUILD COMPLETE CREDENTIALS
        creds_data = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes
        }

        # ✅ VALIDATE
        required_fields = ['token', 'refresh_token', 'token_uri', 'client_id', 'client_secret']
        missing_fields = [field for field in required_fields if not creds_data.get(field)]

        if missing_fields:
            print(f"❌ Missing fields in oauth2callback: {missing_fields}")
            return redirect(f"{FRONTEND_REDIRECT}/dashboard?error=incomplete_credentials")

        users_collection.update_one(
            {'_id': ObjectId(session['user_id'])},
            {'$set': {'google_credentials': creds_data}}
        )

        print(f"✅ Google Docs credentials updated for user: {session['user_id']}")

        return redirect(f"{FRONTEND_REDIRECT}/dashboard?google_connected=true")

    except Exception as e:
        print(f"❌ OAuth callback error: {str(e)}")
        import traceback
        traceback.print_exc()
        return redirect(f"{FRONTEND_REDIRECT}/dashboard?error=oauth_failed")



@app.route('/auth/google/status', methods=['GET'])
@login_required
def google_auth_status():
    """Check if user has valid Google credentials"""
    try:
        user_id = getattr(request, 'user_id', session.get('user_id'))
        user = users_collection.find_one({'_id': ObjectId(user_id)})

        if not user or 'google_credentials' not in user:
            return jsonify({
                'connected': False,
                'needs_auth': True
            })

        creds_data = user['google_credentials']

        # Check if all required fields are present
        required_fields = ['token', 'refresh_token', 'token_uri', 'client_id', 'client_secret']
        missing_fields = [field for field in required_fields if not creds_data.get(field)]

        if missing_fields:
            return jsonify({
                'connected': False,
                'needs_auth': True,
                'reason': 'incomplete_credentials'
            })

        return jsonify({
            'connected': True,
            'needs_auth': False
        })

    except Exception as e:
        print(f"Error checking Google auth status: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/auth/google/revoke')
@login_required
def revoke_google_access():
    """Revoke Google access to force refresh token on next login"""
    try:
        user_id = getattr(request, 'user_id', session.get('user_id'))
        user = users_collection.find_one({'_id': ObjectId(user_id)})

        if user and 'google_credentials' in user:
            creds_data = user['google_credentials']
            token = creds_data.get('token')

            if token:
                # Revoke the token
                import requests
                revoke_url = f'https://oauth2.googleapis.com/revoke?token={token}'
                requests.post(revoke_url)
                print(f"✅ Revoked Google access for user {user_id}")

            # Remove credentials from database
            users_collection.update_one(
                {'_id': ObjectId(user_id)},
                {'$unset': {'google_credentials': ''}}
            )

        return jsonify({
            'success': True,
            'message': 'Google access revoked. Please sign in again.'
        })

    except Exception as e:
        print(f"Error revoking access: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/notes/<note_id>/export-google-docs', methods=['POST'])
@login_required
def export_to_google_docs(note_id):
    """Export a note to Google Docs"""
    try:
        user_id = getattr(request, 'user_id', session.get('user_id'))

        # Get the note
        note = notes_collection.find_one({
            '_id': ObjectId(note_id),
            'user_id': user_id
        })

        if not note:
            return jsonify({'error': 'Note not found'}), 404

        # Get user's Google credentials
        user = users_collection.find_one({'_id': ObjectId(user_id)})

        if not user or 'google_credentials' not in user:
            return jsonify({
                'error': 'Not connected to Google',
                'needs_auth': True
            }), 401

        creds_data = user['google_credentials']

        # ✅ VALIDATE credentials have all required fields
        required_fields = ['token', 'refresh_token', 'token_uri', 'client_id', 'client_secret']
        missing_fields = [field for field in required_fields if not creds_data.get(field)]

        if missing_fields:
            print(f"❌ Missing credential fields: {missing_fields}")
            return jsonify({
                'error': 'Incomplete Google credentials. Please reconnect to Google.',
                'needs_auth': True,
                'missing_fields': missing_fields
            }), 401

        # Create credentials object
        credentials = Credentials(
            token=creds_data['token'],
            refresh_token=creds_data['refresh_token'],
            token_uri=creds_data['token_uri'],
            client_id=creds_data['client_id'],
            client_secret=creds_data['client_secret'],
            scopes=creds_data.get('scopes', SCOPES)
        )

        # Check if token is expired and refresh if needed
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())

            # Update stored credentials
            users_collection.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': {
                    'google_credentials.token': credentials.token
                }}
            )

        # Build Google Docs service
        docs_service = build('docs', 'v1', credentials=credentials)
        drive_service = build('drive', 'v3', credentials=credentials)

        # Get note content
        title = note.get('title', 'Untitled Note')
        content_text = note.get('content', '')

        # Create a new Google Doc
        doc = docs_service.documents().create(body={'title': title}).execute()
        doc_id = doc.get('documentId')

        print(f"✅ Created Google Doc: {doc_id}")

        # Prepare content for insertion
        requests_list = []

        # Convert markdown to Google Docs format
        lines = content_text.split('\n')
        text_content = []

        for line in lines:
            if line.strip():
                # Remove markdown formatting for plain text
                clean_line = line.replace('**', '').replace('##', '').replace('###', '').strip()
                if clean_line:
                    text_content.append(clean_line)

        # Insert text into document
        if text_content:
            full_text = '\n\n'.join(text_content)
            requests_list.append({
                'insertText': {
                    'location': {'index': 1},
                    'text': full_text
                }
            })

        # Apply formatting
        if requests_list:
            docs_service.documents().batchUpdate(
                documentId=doc_id,
                body={'requests': requests_list}
            ).execute()

        # Get the Google Doc URL
        doc_url = f"https://docs.google.com/document/d/{doc_id}/edit"

        # Update note with Google Doc info
        notes_collection.update_one(
            {'_id': ObjectId(note_id)},
            {'$set': {
                'google_doc_id': doc_id,
                'google_doc_url': doc_url,
                'updated_at': time.time()
            }}
        )

        print(f"✅ Note exported to Google Docs: {doc_url}")

        return jsonify({
            'success': True,
            'google_doc_url': doc_url,
            'google_doc_id': doc_id
        })

    except Exception as e:
        print(f"❌ Error exporting to Google Docs: {str(e)}")
        import traceback
        traceback.print_exc()

        # Check if it's an authentication error
        error_str = str(e).lower()
        if 'credentials' in error_str or 'auth' in error_str or 'token' in error_str:
            return jsonify({
                'error': 'Google authentication failed. Please reconnect to Google.',
                'needs_auth': True
            }), 401

        return jsonify({'error': str(e)}), 500

@app.route('/auth/google/callback')
def google_login_callback():
    if not CLIENT_SECRET_FILE:
        return redirect(f'{FRONTEND_REDIRECT}/login?error=oauth_not_configured')

    try:
        if 'state' not in session:
            print("❌ State missing from session")
            return redirect(f'{FRONTEND_REDIRECT}/login?error=state_missing')

        state = session['state']
        flow = Flow.from_client_secrets_file(
            CLIENT_SECRET_FILE,
            scopes=LOGIN_SCOPES,
            state=state,
            redirect_uri=f'{BASE_URL}/auth/google/callback'
        )

        flow.fetch_token(authorization_response=request.url)
        credentials = flow.credentials

        # ✅ BUILD COMPLETE CREDENTIALS OBJECT
        creds_data = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes
        }

        # ✅ CHECK IF REFRESH TOKEN IS MISSING
        if not creds_data.get('refresh_token'):
            print("⚠️ No refresh token received - checking if user has existing credentials")

            # Get user info first
            service = build('oauth2', 'v2', credentials=credentials)
            userinfo = service.userinfo().get().execute()
            email = userinfo.get('email')

            if email:
                # Check if user already exists with refresh token
                existing_user = users_collection.find_one({'email': email})

                if existing_user and existing_user.get('google_credentials', {}).get('refresh_token'):
                    # ✅ USE EXISTING REFRESH TOKEN
                    print(f"✅ Using existing refresh token for {email}")
                    creds_data['refresh_token'] = existing_user['google_credentials']['refresh_token']
                else:
                    # ❌ NO REFRESH TOKEN AVAILABLE - NEED TO REVOKE AND RE-AUTH
                    print(f"❌ No refresh token available for {email}")
                    return redirect(f'{FRONTEND_REDIRECT}/login?error=no_refresh_token&action=revoke')

        # ✅ VALIDATE ALL REQUIRED FIELDS ARE PRESENT
        required_fields = ['token', 'refresh_token', 'token_uri', 'client_id', 'client_secret']
        missing_fields = [field for field in required_fields if not creds_data.get(field)]

        if missing_fields:
            print(f"❌ Missing credential fields after OAuth: {missing_fields}")
            return redirect(f'{FRONTEND_REDIRECT}/login?error=incomplete_credentials&missing={",".join(missing_fields)}')

        print("✅ All credential fields present")

        # Get user info
        service = build('oauth2', 'v2', credentials=credentials)
        userinfo = service.userinfo().get().execute()

        email = userinfo.get('email')
        first_name = userinfo.get('given_name', '')
        last_name = userinfo.get('family_name', '')

        if not email:
            return redirect(f'{FRONTEND_REDIRECT}/login?error=no_email')

        # Find or create user
        user = users_collection.find_one({'email': email})

        if user:
            # ✅ UPDATE existing user with complete credentials
            users_collection.update_one(
                {'_id': user['_id']},
                {'$set': {
                    'google_credentials': creds_data,
                    'first_name': first_name,
                    'last_name': last_name
                }}
            )
            user_id = str(user['_id'])
            print(f"✅ Updated existing user {email} with Google credentials")
        else:
            # ✅ CREATE new user with complete credentials
            new_user = {
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                'google_credentials': creds_data,
                'created_at': time.time(),
                'auth_provider': 'google'
            }
            result = users_collection.insert_one(new_user)
            user_id = str(result.inserted_id)
            print(f"✅ Created new user {email} with Google credentials")

        # Create JWT token
        token = create_access_token(user_id)

        # Set session
        session['user_id'] = user_id
        session.permanent = True

        print(f"✅ User {email} logged in successfully!")

        # ✅ REDIRECT WITH TOKEN
        return redirect(f'{FRONTEND_REDIRECT}/dashboard?token={token}')

    except Exception as e:
        print(f"❌ OAuth callback error: {str(e)}")
        import traceback
        traceback.print_exc()
        return redirect(f'{FRONTEND_REDIRECT}/login?error=oauth_failed')


# ===========================
# 🎵 AUDIO PLAYBACK ROUTE
# ===========================

@app.route('/audio/<filename>')
def serve_audio(filename):
    """Serve stored audio files for playback - Auth optional for direct links"""
    try:
        # Try to get user_id from token or session
        user_id = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            payload = verify_token(token)
            if payload:
                user_id = payload['user_id']
        
        if not user_id and 'user_id' in session:
            user_id = session['user_id']
        
        # ✅ SECURITY: Verify file belongs to user (if we have user_id)
        if user_id and f"_{user_id}" not in filename:
            return jsonify({'error': 'Unauthorized'}), 403
        
        file_path = os.path.join(AUDIO_STORAGE_DIR, filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Audio file not found'}), 404
        
        # ✅ Return file with proper headers for audio playback
        return send_file(
            file_path,
            mimetype='audio/webm',
            as_attachment=False,
            conditional=True  # Enable range requests for seeking
        )
    except Exception as e:
        print(f"Error serving audio: {e}")
        return jsonify({'error': str(e)}), 500

# ===========================
# ❤️ HEALTH CHECK
# ===========================


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'running'})


# ===========================
# 🚀 RUN SERVER
# ===========================

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', debug=False, port=port)
