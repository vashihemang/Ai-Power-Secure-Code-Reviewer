from flask import Flask, render_template, request, jsonify,stream_with_context,Response
from Backend.llm import Detecter_llm
from Backend.chatllm import Code_ChatBot



app = Flask(__name__, template_folder="Frontend/Template", static_folder="Frontend/static")
@app.route("/")
def home():
    # This will look inside Frontend/Template/index.html
    return render_template("index.html")

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



if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)