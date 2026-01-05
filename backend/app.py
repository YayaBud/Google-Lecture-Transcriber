from flask import Flask, request, jsonify, redirect, session
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from bson.objectid import ObjectId
from functools import wraps
import os

# Force CPU usage to avoid CUDA crashes
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

import torch
# Monkeypatch torch.cuda.is_available to avoid the crash
torch.cuda.is_available = lambda: False

import whisper
from typing import Optional, Tuple
from urllib.parse import quote_plus
import time
import tempfile
from dotenv import load_dotenv
import subprocess
import json
import shutil
import wave
import struct
import numpy as np
import io
import requests
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

# allow HTTP for local OAuth redirects
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'super_secret_dev_key_123')  # Fixed key for dev to prevent session loss on reload
# Update CORS to allow credentials and specific origin if needed
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

bcrypt = Bcrypt(app)

# MongoDB Setup
username = quote_plus(os.getenv('MONGODB_USER_ID'))
password = quote_plus(os.getenv('MONGODB_PASSWORD'))
MONGO_URI = os.getenv('MONGODB_URL').replace('<db_username>', username).replace('<db_password>', password)

# Ensure authSource is set (usually admin for Atlas)
if 'authSource' not in MONGO_URI:
    if '?' in MONGO_URI:
        MONGO_URI += "&authSource=admin"
    else:
        MONGO_URI += "?authSource=admin"

# Debug: Print URI (masking password) to verify construction
masked_uri = MONGO_URI.replace(password, '********')
print(f"Connecting to MongoDB with URI: {masked_uri}")

try:
    mongo_client = MongoClient(
        MONGO_URI, 
        serverSelectionTimeoutMS=5000,
        tls=True,
        tlsAllowInvalidCertificates=True  
    )
    db = mongo_client.get_database('note_flow_db')
    users_collection = db.users
    notes_collection = db.notes
    # Test connection
    mongo_client.server_info()
    print("Connected to MongoDB!")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    # Don't crash immediately, let the app run so we can see the error, 
    # but API calls requiring DB will fail.

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

# Load Whisper model
WHISPER_MODEL = os.getenv('WHISPER_MODEL', 'base')
print(f"Loading Whisper model: {WHISPER_MODEL}...")
try:
    # Force CPU to avoid CUDA access violation crashes
    model = whisper.load_model(WHISPER_MODEL, device="cpu")
    print("Whisper model loaded!")
except Exception as e:
    print(f"Error loading Whisper model: {e}")
    import traceback
    traceback.print_exc()
    # We might want to exit or continue with a warning, but for now let's see the error
    # sys.exit(1) 


# Check for ffmpeg (required by Whisper)
ffmpeg_path = shutil.which('ffmpeg')
if not ffmpeg_path:
    print("WARNING: 'ffmpeg' not found in PATH. Whisper transcription will fail until ffmpeg is installed and accessible.")
else:
    print(f"ffmpeg found at: {ffmpeg_path}")

# Use local Ollama 'gemma' model (CLI first, HTTP fallback)
# Default to gemma3:4b as requested
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'gemma2:2b')

# Try to find ollama executable
OLLAMA_CLI = 'ollama'
# Check standard Windows install path first
user_ollama = os.path.expanduser(r"~\AppData\Local\Programs\Ollama\ollama.exe")
if os.path.exists(user_ollama):
    OLLAMA_CLI = user_ollama
elif shutil.which('ollama.exe'): # Check for .exe specifically
    OLLAMA_CLI = shutil.which('ollama.exe')
elif shutil.which('ollama'):
    OLLAMA_CLI = shutil.which('ollama')
elif os.path.exists(r"C:\Windows\System32\ollama.exe"):
    OLLAMA_CLI = r"C:\Windows\System32\ollama.exe"

print(f"Using Ollama CLI: {OLLAMA_CLI}")
print(f"Using Ollama local model: {OLLAMA_MODEL}")

def ensure_ollama_model():
    """Check if model exists, if not try to pull it."""
    global OLLAMA_MODEL
    try:
        # Check list
        print(f"Checking for Ollama model: {OLLAMA_MODEL}...")
        proc = subprocess.run([OLLAMA_CLI, 'list'], capture_output=True, text=True)
        if proc.returncode == 0:
            if OLLAMA_MODEL not in proc.stdout:
                print(f"Model {OLLAMA_MODEL} not found in 'ollama list'.")
                # Try to pull
                print(f"Attempting to pull {OLLAMA_MODEL}...")
                subprocess.run([OLLAMA_CLI, 'pull', OLLAMA_MODEL], check=True)
                print(f"Successfully pulled {OLLAMA_MODEL}")
            else:
                print(f"Model {OLLAMA_MODEL} found.")
        else:
            print("Could not list ollama models. Assuming server might be down or CLI issues.")
    except Exception as e:
        print(f"Error checking/pulling Ollama model: {e}")

# Try to ensure model exists on startup
ensure_ollama_model()

def generate_with_ollama(prompt: str, timeout: int = 120) -> str:
    """Generate text using local Ollama model.

    Tries the `ollama` CLI first; if that fails, falls back to the local HTTP API.
    """
    # Try CLI
    try:
        proc = subprocess.run([OLLAMA_CLI, 'generate', OLLAMA_MODEL, prompt], capture_output=True, text=True, check=True, timeout=timeout)
        output = proc.stdout.strip()
        if output:
            return output
    except Exception as e:
        print(f"Ollama CLI generate failed: {e}")

    # Fallback to local HTTP API
    try:
        ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
        # IMPORTANT: Set stream=False to get a single JSON response
        payload = {"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
        resp = requests.post(f"{ollama_url}/api/generate", json=payload, timeout=timeout)
        resp.raise_for_status()
        # Try to parse common response shapes
        try:
            j = resp.json()
            if isinstance(j, dict):
                # Ollama uses 'response' field
                return j.get('response') or j.get('text') or str(j)
        except Exception:
            pass
        return resp.text
    except Exception as e:
        raise Exception(f"Ollama generation failed (CLI+HTTP): {e}")


# --- Audio processing helpers---
def reduce_noise_np(audio: np.ndarray, reduction_factor: float = 0.01) -> np.ndarray:
    """Simple noise reduction .

    - Flattens multi-channel audio
    - Applies volume gating for very quiet samples
    - Applies a lightweight high-pass like filter
    """
    if audio.ndim > 1:
        audio = audio.flatten()
    # volume gating: reduce amplitude for samples below reduction_factor
    audio = np.where(np.abs(audio) < reduction_factor,
                     audio * 0.1,
                     audio)
    # lightweight high-pass-ish filtering
    if audio.size > 1:
        filtered = np.diff(audio, prepend=audio[0])
        return filtered * 0.8 + audio * 0.2
    return audio


def rms(x: np.ndarray) -> float:
    return float(np.sqrt(np.mean(x.astype(np.float64) ** 2))) if x.size > 0 else 0.0


def trim_silence(audio: np.ndarray, sample_rate: int, thresh_db: float = -40.0, chunk_ms: int = 30):
    # threshold in linear
    thresh = 10 ** (thresh_db / 20.0)
    chunk_size = int(sample_rate * (chunk_ms / 1000.0))
    if chunk_size <= 0:
        return audio
    # compute RMS per chunk
    num_chunks = max(1, int(np.ceil(len(audio) / chunk_size)))
    rms_vals = []
    for i in range(num_chunks):
        start = i * chunk_size
        end = min(len(audio), (i + 1) * chunk_size)
        rms_vals.append(rms(audio[start:end]))
    rms_vals = np.array(rms_vals)
    # find first and last chunk above threshold
    above = np.where(rms_vals >= thresh)[0]
    if above.size == 0:
        return np.array([], dtype=audio.dtype)
    start_chunk = max(0, above[0])
    end_chunk = min(num_chunks - 1, above[-1])
    start_sample = start_chunk * chunk_size
    end_sample = min(len(audio), (end_chunk + 1) * chunk_size)
    return audio[start_sample:end_sample]


def normalize_audio(audio: np.ndarray) -> np.ndarray:
    """Normalize audio to -1.0..1.0 range safely."""
    if audio is None or audio.size == 0:
        return audio
    peak = np.max(np.abs(audio))
    if peak <= 0:
        return audio
    return audio / float(peak)


def prepare_audio_for_whisper(arr: np.ndarray, sr: int) -> Optional[str]:
    """Given a numpy array and sample rate, apply denoise/trim/normalize and
    write to a temp WAV file appropriate for Whisper (16k PCM mono).
    Returns path or None on failure.
    """
    try:
        if arr is None or arr.size == 0:
            return None

        # Apply noise reduction if feature flag enabled
        try:
            if os.getenv('ENABLE_NOISE_REDUCTION', '1') == '1':
                arr = reduce_noise_np(arr, reduction_factor=0.01)
        except Exception:
            pass

        # Trim silence
        try:
            arr = trim_silence(arr, sample_rate, thresh_db=-40.0, chunk_ms=30)
        except Exception:
            pass

        if arr is None or arr.size == 0:
            return None

        # Normalize
        arr = normalize_audio(arr)

        # Ensure sample rate is 16000 for Whisper expectation in this app
        fd, out_path = tempfile.mkstemp(suffix='.wav')
        os.close(fd)
        write_wav_mono(out_path, arr, 16000)
        return out_path
    except Exception as e:
        print(f"prepare_audio_for_whisper failed: {e}")
        return None


def read_wav_mono(path: str):
    with wave.open(path, 'rb') as wf:
        channels = wf.getnchannels()
        sr = wf.getframerate()
        sampwidth = wf.getsampwidth()
        nframes = wf.getnframes()
        data = wf.readframes(nframes)
    # only support 16-bit PCM for now
    if sampwidth == 2:
        arr = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
    else:
        # fallback: try struct
        fmt = '<' + 'h' * (len(data) // 2)
        arr = np.array(struct.unpack(fmt, data), dtype=np.float32) / 32768.0
    if channels > 1:
        arr = arr.reshape(-1, channels).mean(axis=1)
    return arr, sr


def write_wav_mono(path: str, audio: np.ndarray, sr: int):
    # clip and convert to int16
    audio_clipped = np.clip(audio, -1.0, 1.0)
    int_data = (audio_clipped * 32767.0).astype(np.int16)
    with wave.open(path, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(int_data.tobytes())


def decode_audio_to_np(path: str, target_sr: int = 16000) -> Tuple[Optional[np.ndarray], Optional[int]]:
    """Use ffmpeg to decode arbitrary audio file to raw PCM and return numpy float32 array.

    Returns (arr, sr) or (None, None) on failure.
    """
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
            print("ffmpeg stdout empty")
            return None, None
        arr = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        
        # Check for silence
        rms = np.sqrt(np.mean(arr**2))
        if rms < 0.001:
            print(f"WARNING: Decoded audio is silent (RMS: {rms:.6f}). ffmpeg stderr:\n{proc.stderr.decode('utf-8', errors='ignore')}")
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

@app.route('/auth/google/login')
def google_login():
    # Create a flow instance to manage the OAuth 2.0 Authorization Grant Flow steps.
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRET_FILE,
        scopes=LOGIN_SCOPES,
        redirect_uri='http://localhost:5000/auth/google/login/callback'
    )
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    
    session['state'] = state
    # Redirect directly instead of returning JSON to ensure session cookie is set on the navigation request
    return redirect(authorization_url)

@app.route('/auth/google/login/callback')
def google_login_callback():
    if 'state' not in session:
        return jsonify({'error': 'State missing from session. Please try logging in again.'}), 400
    state = session['state']
    
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRET_FILE,
        scopes=LOGIN_SCOPES,
        state=state,
        redirect_uri='http://localhost:5000/auth/google/login/callback'
    )
    
    # Use the authorization server's response to fetch the OAuth 2.0 tokens.
    flow.fetch_token(authorization_response=request.url)
    
    credentials = flow.credentials
    
    # Save credentials for later use in push-to-docs
    creds_data = {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }
    
    # Get user info
    service = build('oauth2', 'v2', credentials=credentials)
    user_info = service.userinfo().get().execute()
    
    email = user_info.get('email')
    first_name = user_info.get('given_name', '')
    last_name = user_info.get('family_name', '')
    
    if not email:
        return jsonify({'error': 'Could not retrieve email from Google'}), 400
        
    # Check if user exists
    user = users_collection.find_one({'email': email})
    
    if user:
        # User exists, update credentials
        user_id = user['_id']
        users_collection.update_one(
            {'_id': user_id},
            {'$set': {'google_credentials': creds_data}}
        )
    else:
        # Register new user with credentials
        user_id = users_collection.insert_one({
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'created_at': time.time(),
            'auth_provider': 'google',
            'google_credentials': creds_data
        }).inserted_id
        
    session['user_id'] = str(user_id)
    
    # Redirect to frontend dashboard
    return redirect("http://localhost:5173/dashboard")

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
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']
        ts = int(time.time())

        # Save uploaded file to a temp path
        orig_ext = os.path.splitext(getattr(audio_file, 'filename', '') or '')[1] or ''
        if not orig_ext:
            ctype = (request.content_type or '')
            if 'webm' in ctype:
                orig_ext = '.webm'
            elif 'ogg' in ctype:
                orig_ext = '.ogg'
            elif 'mp4' in ctype or 'mpeg' in ctype:
                orig_ext = '.mp4'
            else:
                orig_ext = '.bin'

        with tempfile.NamedTemporaryFile(delete=False, suffix=orig_ext) as tf:
            audio_file.save(tf.name)
            temp_path = tf.name

        file_size = os.path.getsize(temp_path)
        print(f"Saved upload to: {temp_path} (Size: {file_size} bytes)")
        
        if file_size < 1000:
            print("WARNING: Uploaded file is extremely small. Likely empty or corrupt.")

        # Save debug original
        debug_orig_path = os.path.join(DEBUG_DIR, f"{ts}_original{orig_ext}")
        shutil.copy(temp_path, debug_orig_path)
        print(f"Saved debug original to: {debug_orig_path}")

        print(f"Saved upload to: {temp_path}")
        diagnostics = {}
        converted_path = None

        # transcription options
        # Auto-detect language and translate to English
        print("Transcribing with auto-detection and translation to English...")

        transcribe_opts = dict(
            task='translate', 
            temperature=0.0, 
            fp16=False, 
            condition_on_previous_text=False, 
            best_of=5,
            compression_ratio_threshold=2.4,
            logprob_threshold=-1.0,
            no_speech_threshold=0.6
        )
        beam = int(os.getenv('WHISPER_BEAM_SIZE', '5'))
        if beam > 1:
            transcribe_opts['beam_size'] = beam

        # 1) Try in-memory decode -> preprocess -> transcribe
        decoded_arr, decoded_sr = decode_audio_to_np(temp_path, target_sr=16000)
        result = None
        transcript = ''
        if decoded_arr is not None and decoded_arr.size > 0:
            diagnostics['decoded_in_memory'] = True
            
            # Calculate and log initial RMS
            initial_rms = np.sqrt(np.mean(decoded_arr**2))
            print(f"Decoded Audio RMS: {initial_rms:.6f}")
            diagnostics['initial_rms'] = float(initial_rms)

            # Save debug decoded
            debug_decoded_path = os.path.join(DEBUG_DIR, f"{ts}_decoded.wav")
            write_wav_mono(debug_decoded_path, decoded_arr, decoded_sr)
            print(f"Saved debug decoded to: {debug_decoded_path}")

            try:
                arr = decoded_arr
                sr = decoded_sr
                diagnostics['preproc_before_len'] = int(len(arr))
                
                # SKIP NOISE REDUCTION AND TRIM FOR DEBUGGING
                # arr = reduce_noise_np(arr, reduction_factor=0.0005)
                # trimmed_arr = trim_silence(arr, sr, thresh_db=-60.0, chunk_ms=30)
                
                # Just normalize
                peak = float(np.max(np.abs(arr))) if arr.size > 0 else 0.0
                if peak > 0:
                    arr = arr / peak
                
                diagnostics['preproc_final_peak'] = float(np.max(np.abs(arr))) if arr.size > 0 else 0.0
                
                # Save debug preprocessed
                debug_preproc_path = os.path.join(DEBUG_DIR, f"{ts}_preprocessed.wav")
                write_wav_mono(debug_preproc_path, arr, sr)
                print(f"Saved debug preprocessed to: {debug_preproc_path}")

                try:
                    print("Starting in-memory transcription...")
                    result = model.transcribe(arr, **transcribe_opts)
                    print("In-memory transcription completed.")
                except Exception as e:
                    print(f"In-memory transcription failed: {e}")
                    result = None
            except Exception as e:
                print(f"In-memory preprocess/transcribe error: {e}")
                result = None

        # 2) Fallback: convert with ffmpeg to stable WAV and transcribe from file
        if result is None:
            print("Falling back to file-based conversion...")
            try:
                converted_fd, converted_path = tempfile.mkstemp(suffix='.wav')
                os.close(converted_fd)
                
                # Try to repair/convert with more robust flags
                ffmpeg_cmd = [
                    'ffmpeg', '-y', 
                    '-err_detect', 'ignore_err', # Ignore decoding errors
                    '-i', temp_path, 
                    '-map', '0:a', 
                    '-ac', '1', 
                    '-ar', '16000', 
                    '-c:a', 'pcm_s16le', 
                    '-vn', 
                    converted_path
                ]
                proc = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, check=True)
                diagnostics['ffmpeg_stdout'] = proc.stdout
                diagnostics['ffmpeg_stderr'] = proc.stderr
                
                # Check if converted file has audio
                arr, sr = read_wav_mono(converted_path)
                if arr is not None and arr.size > 0:
                    rms = np.sqrt(np.mean(arr**2))
                    print(f"Fallback Converted Audio RMS: {rms:.6f}")
                    if rms < 0.001:
                        print("WARNING: Fallback conversion also resulted in silence.")
                        return jsonify({'transcript': '', 'error': 'No audio detected. Please check your microphone settings.'}), 200
                
                # numpy preprocess on converted file
                try:
                    arr, sr = read_wav_mono(converted_path)
                    if arr is not None and arr.size > 0:
                        diagnostics['preproc_before_len'] = int(len(arr))
                        
                        # 1. Normalize first to ensure consistent levels
                        peak = float(np.max(np.abs(arr)))
                        if peak > 0:
                            arr = arr / peak
                        
                        # 2. Gentle Noise Reduction
                        arr = reduce_noise_np(arr, reduction_factor=0.001)
                        
                        # 3. Trim Silence (now that levels are normalized)
                        trimmed_arr = trim_silence(arr, sr, thresh_db=-40.0, chunk_ms=30)
                        
                        if trimmed_arr is not None and trimmed_arr.size > 0:
                            arr = trimmed_arr
                            diagnostics['preproc_after_trim_len'] = int(len(arr))
                        else:
                            print("WARNING: Fallback trim removed all audio. Reverting.")
                            diagnostics['preproc_trim_reverted'] = True

                        # Write back to file for Whisper
                        write_wav_mono(converted_path, arr, sr)
                        diagnostics['preproc_final_peak'] = float(np.max(np.abs(arr)))
                except Exception as e:
                    print(f"Converted-file preprocessing failed: {e}")

                # transcribe from file
                try:
                    result = model.transcribe(converted_path, **transcribe_opts)
                except Exception:
                    result = model.transcribe(converted_path, task='translate', fp16=False)

            except FileNotFoundError as fe:
                msg = "ffmpeg executable not found. Install ffmpeg and ensure it's on your PATH."
                print(f"ERROR: {msg} | exception: {fe}")
                if converted_path and os.path.exists(converted_path):
                    os.unlink(converted_path)
                os.unlink(temp_path)
                return jsonify({'error': msg}), 500
            except Exception as e:
                print(f"ERROR during file-based transcription: {e}")
                if converted_path and os.path.exists(converted_path):
                    os.unlink(converted_path)
                os.unlink(temp_path)
                return jsonify({'error': str(e)}), 500

        # post-process result
        if result is None:
            transcript = ''
        else:
            transcript = (result.get('text', '') or '').replace(' um ', ' ').replace(' uh ', ' ').strip()
            try:
                if 'segments' in result:
                    no_speech = [seg.get('no_speech_prob') for seg in result['segments'] if seg.get('no_speech_prob') is not None]
                    if no_speech:
                        diagnostics['avg_no_speech_prob'] = float(np.mean(no_speech))
            except Exception:
                pass

        # small-model fallback if very short
        try:
            if len(transcript.strip()) < 20 and WHISPER_MODEL != 'small' and converted_path:
                fallback = whisper.load_model('small')
                fres = fallback.transcribe(converted_path, **transcribe_opts)
                ftext = fres.get('text', '') or ''
                if len(ftext.strip()) > len(transcript.strip()):
                    transcript = ftext
                    result = fres
        except Exception:
            pass

        # cleanup
        try:
            if converted_path and os.path.exists(converted_path):
                os.unlink(converted_path)
        except Exception:
            pass
        try:
            os.unlink(temp_path)
        except Exception:
            pass

        print(f"Transcription complete! Transcript length: {len(transcript)}")
        return jsonify({'transcript': transcript, 'success': True, 'length': len(transcript), 'debug': diagnostics})

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
        
        # Improved prompt for Gemma/LLMs
        prompt = f"""<start_of_turn>user
You are an expert note-taker. Analyze the following lecture transcript and create structured, easy-to-read notes.

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
<end_of_turn>
<start_of_turn>model
"""
        
        print(f"Generating notes for transcript of length {len(transcript)}")
        notes = generate_with_ollama(prompt)
        print(f"Notes generated successfully! Length: {len(notes) if notes else 0}")
        
        # Save to MongoDB
        note_id = notes_collection.insert_one({
            'user_id': session['user_id'],
            'transcript': transcript, # Optional: store transcript
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
        return jsonify({'error': 'Email and password are required'}), 400

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
    if 'user_id' not in session:
        return redirect("http://localhost:5173/login")

    state = session['state']
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRET_FILE,
        scopes=SCOPES,
        state=state,
        redirect_uri='http://localhost:5000/oauth2callback'
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
    
    # Update user in DB
    users_collection.update_one(
        {'_id': ObjectId(session['user_id'])},
        {'$set': {'google_credentials': creds_data}}
    )
    
    return redirect("http://localhost:5173/dashboard/record")

@app.route('/notes', methods=['GET'])
@login_required
def get_notes():
    try:
        user_id = session['user_id']
        # Fetch notes for the user, sorted by created_at desc
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
        print(f"Error toggling favorite: {e}")
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

@app.route('/folders', methods=['POST'])
@login_required
def create_folder():
    try:
        user_id = session['user_id']
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
    """Update folder name or notes"""
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
        
        return jsonify({'success': True, 'message': 'Folder updated'})
    except Exception as e:
        print(f"Error updating folder: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/folders/<folder_id>', methods=['DELETE'])
@login_required
def delete_folder(folder_id):
    """Delete a folder"""
    try:
        user_id = session['user_id']
        
        result = db.folders.delete_one({'_id': ObjectId(folder_id), 'user_id': user_id})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Folder not found'}), 404
        
        return jsonify({'success': True, 'message': 'Folder deleted'})
    except Exception as e:
        print(f"Error deleting folder: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/notes', methods=['POST'])
@login_required
def create_note_metadata():
    try:
        data = request.json
        user_id = session['user_id']
        title = data.get('title', 'Untitled Note')
        preview = data.get('preview', '') # Short snippet or summary
        
        note_doc = {
            'user_id': user_id,
            'title': title,
            'preview': preview,
            'created_at': time.time(),
            'updated_at': time.time(),
            # We might not have the doc URL yet if this is just saving the draft/metadata
            'google_doc_url': None,
            'google_doc_id': None
        }
        
        result = notes_collection.insert_one(note_doc)
        
        return jsonify({
            'success': True, 
            'note_id': str(result.inserted_id),
            'message': 'Note metadata saved'
        })
    except Exception as e:
        print(f"Error creating note: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/notes/<note_id>', methods=['PUT'])
@login_required
def update_note(note_id):
    """Update note title or content"""
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
        
        return jsonify({'success': True, 'message': 'Note updated'})
    except Exception as e:
        print(f"Error updating note: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/notes/<note_id>', methods=['DELETE'])
@login_required
def delete_note(note_id):
    """Delete a note"""
    try:
        user_id = session['user_id']
        
        result = notes_collection.delete_one({'_id': ObjectId(note_id), 'user_id': user_id})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Note not found'}), 404
        
        return jsonify({'success': True, 'message': 'Note deleted'})
    except Exception as e:
        print(f"Error deleting note: {e}")
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
        note_id = data.get('note_id') # Optional: if updating an existing metadata record
        
        if not notes:
            return jsonify({'error': 'No notes provided'}), 400
        
        # Create new Google Doc
        docs_service = build('docs', 'v1', credentials=credentials)
        # drive_service = build('drive', 'v3', credentials=credentials) # Unused for now
        
        # Create document
        doc = docs_service.documents().create(body={'title': title}).execute()
        doc_id = doc.get('documentId')
        
        # Insert notes content
        requests_body = [
            {
                'insertText': {
                    'location': {'index': 1},
                    'text': notes
                }
            }
        ]
        
        docs_service.documents().batchUpdate(
            documentId=doc_id,
            body={'requests': requests_body}
        ).execute()
        
        doc_url = f"https://docs.google.com/document/d/{doc_id}/edit"
        
        print(f"Document created successfully: {doc_url}")
        
        # Save or Update Metadata in MongoDB
        if note_id:
            # Update existing
            notes_collection.update_one(
                {'_id': ObjectId(note_id), 'user_id': session['user_id']},
                {'$set': {
                    'google_doc_id': doc_id,
                    'google_doc_url': doc_url,
                    'updated_at': time.time()
                }}
            )
        else:
            # Create new metadata record
            # Create a preview (first 100 chars)
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
    app.run(debug=True, port=5000)
