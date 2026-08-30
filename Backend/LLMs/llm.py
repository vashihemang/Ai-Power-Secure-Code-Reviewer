import os
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser


# LM SETUP (With Fallbacks)
# 1. Primary LLM
primary_llm = ChatOpenAI(
    model="google/gemma-4-26b-a4b-it:freeze-2024-06-11", 
    api_key=os.getenv("API_KEY"),
    base_url="https://openrouter.ai/api/v1",
    temperature=0.0,
    max_tokens=2500 
)

# 2. Fallback LLM (Local Ollama - Qwen2.5-coder)
# Agar API fail hoti hai toh ye local model automatically chal jayega
fallback_llm = ChatOllama(
    model="qwen2.5-coder:7b", 
    temperature=0.0, 
    num_predict=2500, 
    num_ctx=4096, 
    keep_alive="15m"
)

# 3. Combine both LLMs using LangChain Fallbacks
robust_llm = primary_llm.with_fallbacks([fallback_llm])


# 2. CODE REVIEWER FUNCTION

def Detecter_llm(user_code: str):
    # 1. System Prompt Template Define Karein
    system_instruction = """
    Act as a Senior DevSecOps Engineer and Expert Secure Code Reviewer.

    Your task is to analyze the source code I provide. Please review it thoroughly for:
    1. OWASP Top 10 vulnerabilities (e.g., SQL Injection, XSS, CSRF, Broken Access Control, etc.).
    2. Syntax errors and compilation issues.
    3. Logical errors or bad coding practices.
    4. Performance bottlenecks.

    For every issue found, please generate a detailed, easy-to-read report in the following structured format:

    --> 🛡️ Security & Code Review Report :-

    1. 📊 Executive Summary:-
    [Briefly summarize the overall code quality and the main issues found.]

    2. 🛡️ Issues & Vulnerabilities Found:-
       Issue Name: [e.g., SQL Injection / Missing Semicolon / Memory Leak]
       Category: [OWASP / Syntax / Logic / Performance]
       Severity: [Critical / High / Medium / Low]
       Description: [Explain what the error/vulnerability is, how it works, and its potential impact.]

    3. 🔍 Code Analysis & Fixes:-
    ❌ Original Vulnerable/Buggy Code:-
    
    // Highlight the exact lines causing the issue
    
    ✅ Fixed & Secure Code:-
    
    // Provide the completely fixed code
    
    🛠️ Explanation of Fix:- [Explain exactly what was changed, why it fixes the issue, and any best practices applied.]
    """

    # 2. ChatPromptTemplate create karein (System + Human Input)
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", system_instruction),
        ("human", "Here is the code to review:\n\n{code}")
    ])

    # 3. LangChain Pipeline (Chain) banayein
    # Yahan hum 'robust_llm' use kar rahe hain jisme fallback feature hai
    chain = prompt_template | robust_llm | StrOutputParser()

    # 4. Chain ko invoke karein aur output stream karein
    print("Detecting code... Please wait ⏳")
    for chunk in chain.stream({"code": user_code}):
        yield chunk
    
    print("\nCode Detected ✅")



    