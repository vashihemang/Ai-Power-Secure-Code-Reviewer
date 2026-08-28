from flask import Flask, request, jsonify,render_template
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





if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)