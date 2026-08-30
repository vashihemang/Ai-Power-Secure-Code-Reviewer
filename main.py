from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file,stream_with_context,Response
from werkzeug.security import generate_password_hash, check_password_hash
from Backend.LLMs.auto_ollama_server import ensure_ollama_running
from Backend.LLMs.llm import Detecter_llm
from Backend.LLMs.chatllm import Code_ChatBot
import sqlite3
import time
import os

ensure_ollama_running() 
time.sleep(2)

app = Flask(__name__, template_folder="Frontend/Template", static_folder="Frontend/static")
app.secret_key = os.urandom(24) # Required for session management

# --- Database Setup ---
DB_NAME = 'Backend/database/login.db'

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    # Ensure the directory exists to prevent sqlite3 operational errors
    os.makedirs(os.path.dirname(DB_NAME), exist_ok=True)
    with get_db() as conn:
        conn.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL)")
        conn.commit()
        

init_db()

# --- Authentication Routes ---
@app.route('/login_page')
def login_page():
    if 'user' in session:
        return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('reg-username')
    password = data.get('reg-password')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password required.'}), 400

    hashed_password = generate_password_hash(password)
    
    conn = get_db() # Connection open kiya
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_password))
        conn.commit()
        return jsonify({'success': True, 'message': 'Registration successful! You can now log in.'})
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'Username already exists.'}), 409
    except Exception as e:
        print(f"Registration Error: {e}") # Error terminal me print hoga debugging ke liye
        return jsonify({'success': False, 'message': 'An error occurred server-side.'}), 500
    finally:
        conn.close()


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('login-username')
    password = data.get('login-password')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password required.'}), 400

    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
    finally:
        conn.close() # Login ke baad bhi DB close karna zaroori hai

    if user and check_password_hash(user['password'], password):
        session['user'] = user['username'] 
        return jsonify({'success': True, 'message': 'Login successful!'})
    else:
        return jsonify({'success': False, 'message': 'Invalid username or password.'}), 401
@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login_page'))


# --- Core Application Routes ---
@app.route("/")
def index():
    if 'user' not in session:
        return redirect(url_for('login_page'))
    return render_template("index.html", username=session['user'])





@app.route('/detect_code', methods=['POST'])
def detect_code():
    data = request.json
    user_code = data.get('code', '')
    
    if not user_code.strip():
        return jsonify({"status": "error", "message": "Code is empty"}), 400
    
    def generate():
        try:
            # Model ke chunks ko directly frontend par yield karein
            for chunk in Detecter_llm(user_code):
                yield chunk
        except Exception as e:
            yield f"\n[Error: {str(e)}]"

    # text/plain stream ke roop me response bhejein
    return Response(stream_with_context(generate()), mimetype='text/plain')


@app.route("/Chat_with_code", methods=["POST"])
def chat_with_code():
    data = request.get_json() or {}
    user_message = data.get("query", "")
    editor_code = data.get("code", "")  

    if not user_message:
        return jsonify({"reply": "Please ask a question."}), 400

    try:
        bot_response = Code_ChatBot(user_message, editor_code)
        
        if isinstance(bot_response, dict):
            final_reply = bot_response.get("explanation", "No response generated.")
        else:
            final_reply = str(bot_response)

        return jsonify({"reply": final_reply}), 200

    except Exception as e:
        print(f"Chatbot Error: {e}")
        return jsonify({"reply": "An error occurred while processing your request."}),500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)              