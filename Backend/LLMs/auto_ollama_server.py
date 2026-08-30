import subprocess
import time
import urllib.request

OLLAMA_URL = "http://localhost:11434/"

def is_ollama_running():
    """Check karta hai ki Ollama Server chal raha hai ya nahi"""
    try:
        response = urllib.request.urlopen(OLLAMA_URL, timeout=2)
        return response.status == 200
    except Exception:
        return False

def ensure_ollama_running():
    """Agar Ollama nahi chal raha ho to usko background me start karta hai"""
    if is_ollama_running():
        print("✅ Ollama Server already running hai.")
        return

    print("🚀 Ollama Server nahi chal raha... Background me start kar rahe hain...")
    
    try:
        # Popen process ko background me bina block kiye start karta hai
        subprocess.Popen(
            ["ollama", "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW if subprocess.os.name == 'nt' else 0
        )
        
        # Server ke fully boot hone ka wait karein (Max 10 seconds)
        for _ in range(10):
            time.sleep(1)
            if is_ollama_running():
                print("✅ Ollama Server successfully start ho gaya!")
                return
                
        print("⚠️ Warning: Ollama launch command to chali par server response nahi de raha.")
    except Exception as e:
        print(f"❌ Ollama start karne me error aaya: {e}")