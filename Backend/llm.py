from pydantic import BaseModel
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage

class ChatResponse(BaseModel):
    explanation: str

# ============================================================
# LLM SETUP (No Embeddings Needed)
# ============================================================
llm = ChatOllama(model="llama3.2:latest", temperature=0.0, num_predict=250, num_ctx=4096, keep_alive="30m")

# ============================================================
# DETAILED SYSTEM PROMPT
# ============================================================
BASE_INSTRUCTIONS = """
You are an AI Code Reviewer and Security Assistant for IT professionals.
[Aapka poora prompt yahan aayega, maine space bachane ke liye chhota kar diya hai...]
OUTPUT:
Plain text only.
"""

def Code_ChatBot_No_RAG(incoming_query, incoming_code):
    if not incoming_code:
        return {"explanation": "Please provide code first."}

    # Poora ka poora code direct context me bhej rahe hain
    system_instruction = (
        f"{BASE_INSTRUCTIONS}\n\n"
        f"USER_CODE_CONTEXT:\n<USER_CODE>\n{incoming_code}\n</USER_CODE>"
    )
    
    messages = [
        SystemMessage(content=system_instruction),
        HumanMessage(content=incoming_query),
    ]

    try:
        print("Analyzing code without RAG...")
        response = llm.invoke(messages)
        text = (response.content or "").strip()
        print("Message Send completed.")
        return ChatResponse(explanation=text).model_dump()
    except Exception as e:
        print(f"Error: {e}")
        return {"explanation": "An error occurred while analyzing the code."}
