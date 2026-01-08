"""
Download Whisper tiny model during deployment.
Fast and lightweight for production.
"""
from faster_whisper import WhisperModel
import os

model_name = os.getenv('WHISPER_MODEL', 'tiny')

print(f"📥 Downloading Whisper model: {model_name}...")
print(f"📦 Model size: ~39MB (tiny)")
print(f"⏱️ Estimated download time: 30 seconds")

try:
    WhisperModel(
        model_name,
        device="cpu",
        compute_type="int8",
        download_root="./whisper_models",
    )
    print(f"✅ Whisper '{model_name}' model ready!")
    
except Exception as e:
    print(f"⚠️ Warning: {e}")
    print("App will download on first use if needed")
    exit(0)