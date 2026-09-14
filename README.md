# 🔐 AI-Powered Secure Code Reviewer

An AI-powered code review assistant that analyzes source code, detects potential security vulnerabilities, identifies coding issues, and provides actionable recommendations for writing safer and better-quality code.

The project combines **Generative AI, static code analysis, and secure coding principles** to provide developers with an intelligent security-focused code review experience.

## 🖥️ Project GUI

<img width="1024" height="559" alt="AI-Powered Secure Code Reviewer GUI" src="https://github.com/user-attachments/assets/7588f693-4325-4f86-a7a6-2ae1a1566140" />


## 🚀 Features

* 🔍 **AI-Powered Code Review**

  * Analyze source code using an AI model.
  * Identify bugs, code-quality issues, and potential security problems.

* 🔒 **Security Vulnerability Detection**

  * Detect common security vulnerabilities such as:

    * SQL Injection
    * Cross-Site Scripting (XSS)
    * Hardcoded Secrets
    * Command Injection
    * Insecure Input Handling
    * Weak Security Practices

* 🧠 **AI-Based Suggestions**

  * Provides explanations for detected problems.
  * Suggests safer coding practices and possible fixes.

* 🤖 **Local AI Support**

  * Supports local LLMs through **Ollama**.
  * Can be used without sending source code to an external AI service when configured with a local model.

* 🌐 **Web Interface**

  * Simple interface for submitting source code and viewing review results.

* 🗄️ **Review History**

  * Uses SQLite to store relevant review information.

* ⚡ **FastAPI/Flask-Style Backend Architecture**

  * Backend handles code analysis and AI processing.


## 🏗️ Project Architecture

```text
                    ┌─────────────────────┐
                    │      User           │
                    │  Source Code Input  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Frontend / UI     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Flask Backend    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Code Processing   │
                    │    & Validation     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ LangChain / Prompt  │
                    │      Pipeline       │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
        ┌─────────────────┐         ┌─────────────────┐
        │     Ollama      │         │   OpenRouter    │
        │   Local LLM     │         │   Cloud LLM     │
        └────────┬────────┘         └────────┬────────┘
                 │                           │
                 └─────────────┬─────────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Security Analysis   │
                    │ & Recommendations   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Review Results    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      SQLite DB      │
                    └─────────────────────┘
```



## 🛠️ Tech Stack

| Technology              | Purpose                                 |
| ----------------------- | --------------------------------------- |
| **Python**              | Core programming language               |
| **Flask**               | Backend web framework                   |
| **HTML/CSS/JavaScript** | Frontend interface                      |
| **LangChain**           | LLM application and prompt management   |
| **Ollama**              | Local LLM execution                     |
| **OpenRouter**          | Access to supported cloud LLMs          |
| **Pydantic**            | Data validation                         |
| **SQLite3**             | Database for storing review information |
| **Subprocess**          | Running code-analysis processes         |


## 📁 Project Structure

```text
Ai-Power-Secure-Code-Reviewer/
│
├── Backend/
│   ├── ...
│   └── ...
│
├── Frontend/
│   ├── ...
│   └── ...
│
├── main.py
├── requirements.txt
├── .env
├── .gitignore
└── README.md
```

> The exact files inside `Backend` and `Frontend` may change as the project develops.


## ⚙️ How It Works

### 1. Enter Source Code

The developer provides source code through the web interface.

### 2. Code Processing

The backend receives and validates the submitted code.

### 3. AI Analysis

The code is passed through the AI processing pipeline using LangChain and the configured LLM.

### 4. Security Review

The AI analyzes the code for potential:

* Security vulnerabilities
* Bugs
* Bad coding practices
* Unsafe input handling
* Hardcoded credentials
* Other potential risks

### 5. Generate Report

The system returns:

* Detected issue
* Severity
* Explanation
* Vulnerable code area
* Recommended solution

### 6. Store Review

Review information can be stored in SQLite for future reference.


## 🔒 Security Checks

The reviewer is designed to help identify common security problems, including:

### SQL Injection

```python
query = "SELECT * FROM users WHERE id=" + user_id
```

The reviewer can identify unsafe query construction and recommend parameterized queries.

### Hardcoded Secrets

```python
API_KEY = "my-secret-api-key"
```

The reviewer can flag credentials that should not be stored directly in source code.

### Command Injection

```python
os.system(user_input)
```

The reviewer can identify potentially unsafe execution of user-controlled input.

### Cross-Site Scripting (XSS)

The system can identify potentially unsafe handling of user-controlled content in web applications.


## 🧠 AI Model Support

The project can work with **local or cloud-based LLM configurations**.

### Local LLM

Using Ollama allows the project to run an LLM locally.

Example:

```bash
ollama run llama3.2
```

```bash
ollama run qwen2.5-coder
```

```bash
ollama run qwen3-embedding:0.6b
```

You can replace the model with another Ollama-supported model according to your system resources.

### Cloud LLM

The project can also be configured with an OpenRouter-compatible model through an API key.


## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/vashihemang/Ai-Power-Secure-Code-Reviewer.git
```

### 2. Move Into the Project

```bash
cd Ai-Power-Secure-Code-Reviewer
```

### 3. Create a Virtual Environment

```bash
python -m venv venv
```

### 4. Activate the Virtual Environment

#### Windows

```bash
venv\Scripts\activate
```

#### Linux/macOS

```bash
source venv/bin/activate
```

### 5. Install Dependencies

```bash
pip install -r requirements.txt
```


## 🔑 Environment Variables

Create a `.env` file in the project root if your selected configuration requires API credentials.

Example:

```env
OPENROUTER_API_KEY=your_api_key_here
```

> Never commit real API keys or passwords to GitHub.


## ▶️ Run the Application

Start the Flask application:

```bash
python main.py
```

Then open the local URL shown by Flask in your browser.


## 🖥️ Example Workflow

```text
Write / Paste Code
        ↓
Submit Code
        ↓
Backend Processing
        ↓
AI Security Analysis
        ↓
Detect Vulnerabilities
        ↓
Generate Explanation
        ↓
Suggest Secure Fix
        ↓
Display Review
```

---

## 📊 Example Review Output

```text
Security Issue: SQL Injection

Severity: HIGH

Problem:
User input is directly included in the SQL query.

Risk:
An attacker may manipulate the SQL query and access
or modify unauthorized database information.

Recommendation:
Use parameterized SQL queries instead of directly
concatenating user input.
```


## 🎯 Use Cases

This project can be useful for:

* 👨‍💻 Developers
* 🎓 Students learning cybersecurity
* 🔐 Secure software development
* 🧑‍💻 Code review automation
* 🏫 Academic projects
* 🛡️ DevSecOps learning
* 🤖 Generative AI security projects


## 🌟 Why This Project?

Traditional code review depends heavily on manual inspection. An AI-powered reviewer can provide an additional automated layer that helps developers identify potential problems earlier.

The goal of this project is **not to replace professional security testing or human code review**, but to provide an intelligent first-level security review.


## 🔮 Future Improvements

* [ ] Support more programming languages
* [ ] OWASP Top 10 vulnerability mapping
* [ ] Code severity scoring
* [ ] Automatic secure-code suggestions
* [ ] AI-generated code fixes
* [ ] GitHub Pull Request integration
* [ ] VS Code extension
* [ ] Static analysis integration with tools such as Semgrep
* [ ] PDF/HTML security reports
* [ ] Review history dashboard
* [ ] Docker deployment
* [ ] Authentication and user accounts


## ⚠️ Disclaimer

This project is an **AI-assisted security review tool**.

AI-generated security findings may contain false positives or false negatives. The results should not be considered a complete security audit.

Always perform proper testing, static analysis, dependency scanning, and manual security review before deploying production software.


## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.

Contributions, suggestions, and improvements are welcome!
