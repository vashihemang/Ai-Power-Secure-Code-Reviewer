const menuBtn = document.getElementById('menu-btn');
  const mainLayout = document.getElementById('main-layout');
  menuBtn.addEventListener('click', () => mainLayout.classList.toggle('hide-nav'));

  const terminalOutput = document.getElementById('terminal-output');
  const navTerminalBtn = document.getElementById('nav-terminal-btn');
  const closeTerminalBtn = document.getElementById('close-terminal');

  function toggleTerminal() {
    terminalOutput.classList.toggle('show');
    navTerminalBtn.classList.toggle('active');
  }
  navTerminalBtn.addEventListener('click', toggleTerminal);
  closeTerminalBtn.addEventListener('click', () => {
    terminalOutput.classList.remove('show');
    navTerminalBtn.classList.remove('active');
  });

  // Ctrl + J shortcut — ONLY opens/closes the terminal panel so the user can
  // see whether processing (chat sync / review scan) is currently running.
  // It no longer triggers any API call itself.
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'j') {
        toggleTerminal();
    }
  });

  // ================= EDITOR BASIC LOGIC =================
  const codeEditor = document.getElementById('code-editor');
  const lineNumbers = document.getElementById('line-numbers');

  function updateLineNumbers() {
    const lines = codeEditor.innerText.split('\n').length;
    let numbersHtml = '';
    for(let i=1; i <= (lines === 0 ? 1 : lines); i++) { numbersHtml += `<div>${i}</div>`; }
    lineNumbers.innerHTML = numbersHtml;
  }

  let typingTimer;
  codeEditor.addEventListener('paste', function(e) {
    e.preventDefault();
    const text = (e.originalEvent || e).clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    updateLineNumbers();

    // Pasting code ONLY syncs the chat model (Model 1) — direct spinner
    // shows as soon as this fires. It does NOT trigger the review scan
    // (Model 2 / detect_code) anymore — that only runs on Review click.
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => { syncChatWithCode(); }, 1000);
  });
  codeEditor.addEventListener('input', updateLineNumbers);

  // ================= INTEGRATED HISTORY & FILE LOGIC =================
  let currentTitleElement = null; 
  const historyContainer = document.getElementById('history');
  const fileNameDisplay = document.getElementById('fileName');
  const fileModal = document.getElementById('fileModal');
  const renameModal = document.getElementById('renameModal');
  const fileInput = document.getElementById('fileInput');
  const renameInput = document.getElementById('renameInput');

  // New File Flow
  document.getElementById('newFileBtn').addEventListener('click', () => {
      fileModal.style.display = 'flex';
      fileInput.value = ''; fileInput.focus();
  });
  document.getElementById('cancelFile').addEventListener('click', () => fileModal.style.display = 'none');
  document.getElementById('createFile').addEventListener('click', () => {
      const fileName = fileInput.value.trim();
      if (fileName !== "") { addHistoryItem(fileName); fileModal.style.display = 'none'; } 
      else { alert("Please enter a valid file name."); }
  });
  fileInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') document.getElementById('createFile').click(); });

  // Add Item Function
  function addHistoryItem(fileName) {
      fileNameDisplay.textContent = fileName;
      document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));

      let item = document.createElement('li');
      item.className = 'file-item active';

      let ext = fileName.split('.').pop().toLowerCase();
      let dotClass = ext === 'py' ? 'dot-py' : 'dot-cpp';
      let dotText = ext === 'py' ? 'Py' : 'C+';

      let badgeSpan = document.createElement('span');
      badgeSpan.className = `file-dot ${dotClass}`;
      badgeSpan.innerText = dotText;

      let titleSpan = document.createElement('span');
      titleSpan.className = 'file-name-text';
      titleSpan.innerText = fileName;

      let menuBtn = document.createElement('button');
      menuBtn.className = 'delete-btn';
      menuBtn.innerHTML = '⋮';

      let menu = document.createElement('div');
      menu.className = 'menu';
      menu.innerHTML = `<div class="rename-chat">Rename</div><div class="delete-chat">Delete</div>`;

      menuBtn.onclick = (e) => {
          e.stopPropagation();
          document.querySelectorAll('.menu').forEach(m => m.style.display = 'none');
          menu.style.display = 'block';
      };

      menu.querySelector('.delete-chat').onclick = (e) => {
          e.stopPropagation();
          item.remove();
          if (fileNameDisplay.textContent === titleSpan.innerText) {
              fileNameDisplay.textContent = "Code.py";
          }
      };

      menu.querySelector('.rename-chat').onclick = (e) => {
          e.stopPropagation();
          currentTitleElement = titleSpan;
          renameInput.value = titleSpan.innerText;
          renameModal.style.display = 'flex';
          renameInput.focus();
          menu.style.display = 'none';
      };

      item.onclick = () => {
          document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
          fileNameDisplay.textContent = titleSpan.innerText;
      };

      item.appendChild(badgeSpan);
      item.appendChild(titleSpan);
      item.appendChild(menuBtn);
      item.appendChild(menu);
      historyContainer.prepend(item);
  }

  // Rename Logic
  document.getElementById('saveRename').onclick = () => {
      let newName = renameInput.value.trim();
      if (newName !== "" && currentTitleElement) {
          currentTitleElement.innerText = newName;
          if (currentTitleElement.parentElement.classList.contains('active')) {
              fileNameDisplay.textContent = newName;
          }
      }
      renameModal.style.display = 'none';
  };
  document.getElementById('cancelRename').onclick = () => renameModal.style.display = 'none';
  renameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') document.getElementById('saveRename').click(); });

  window.onclick = (event) => {
      if (!event.target.matches('.delete-btn')) {
          document.querySelectorAll('.menu').forEach(m => m.style.display = 'none');
      }
  };

// ================= INTEGRATED BACKEND / CHAT API LOGIC =================

let isReportReady = false;

// ==========================================
// 1. CHAT SYNC (Model 1) — runs automatically whenever the code changes
//    (paste / debounced input). Shows a DIRECT spinner the moment it starts.
//    Does NOT touch /detect_code at all.
// ==========================================
async function syncChatWithCode() {
    const currentCode = codeEditor.innerText;
    if (!currentCode.trim()) return;

    // Direct spinner in the chat panel, shown immediately
    const loadingId = 'loading-sync-' + Date.now();
    const loadingHtml = `<div class="loader-container"><div class="spinner"></div><span class="dots-loader">Reading code...</span></div>`;
    addHtmlMessage(loadingHtml, 'bot', loadingId);

    try {
        const chatResponse = await fetch('/Chat_with_code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: "I have provided new code. Please acknowledge that you have read it and tell the user they can now ask questions about it.",
                code: currentCode
            })
        });
        const chatData = await chatResponse.json();
        document.getElementById(loadingId)?.remove();
        addChatMessage(chatData.reply, 'bot');
    } catch (err) {
        document.getElementById(loadingId)?.remove();
        addChatMessage("❌ Error: Failed to sync code with AI server.", 'bot');
    }
}

// ==========================================
// 2. REVIEW SCAN (Model 2 / detect_code) — runs ONLY when the user clicks
//    the Review button. Paste alone never triggers this. Shows its own
//    processing spinner in the terminal/output panel while streaming.
// ==========================================
async function runReviewScan() {
    const currentCode = codeEditor.innerText;
    const fileName = document.getElementById("fileName").innerText;
    const outputContent = document.getElementById('output-content');

    if (!currentCode.trim()) {
        alert("Please paste some code first.");
        return;
    }

    // Auto open terminal panel so the processing spinner is visible
    if (!terminalOutput.classList.contains('show')) toggleTerminal();

    isReportReady = false;
    outputContent.innerHTML = `
        <div class="loader-container" id="stream-loader" style="margin-top:20px;">
            <div class="spinner"></div> 
            <span class="dots-loader">Analyzing code... Please wait ⏳</span>
        </div>
        <div id="stream-text" style="white-space: pre-wrap; word-wrap: break-word;"></div>
    `;

    const streamTextBox = document.getElementById('stream-text');

    try {
        const response = await fetch('/detect_code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: currentCode, filename: fileName })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
            const { done, value } = await reader.read();

            // Remove Loader as soon as first chunk arrives or stream ends
            const streamLoader = document.getElementById('stream-loader');
            if(streamLoader) streamLoader.remove();

            if (done) {
                isReportReady = true;
                outputContent.innerHTML += `<div style="color: #4CAF50; margin-top:20px; font-weight: bold;"></div>`;
                break;
            }

            // Decode chunk and append directly
            const chunk = decoder.decode(value, { stream: true });
            streamTextBox.innerText += chunk; 

            // Auto scroll to bottom
            outputContent.scrollTop = outputContent.scrollHeight;
        }

    } catch (error) {
        console.error('Error:', error);
        isReportReady = true;
        const streamLoader = document.getElementById('stream-loader');
        if(streamLoader) streamLoader.remove();
        outputContent.innerHTML += `<div style="color: #ff5555; margin-top:20px; font-weight: bold;">❌ Scan Failed! Server error.</div>`;
    }
}

// Wire the Review button. Make sure your HTML has a button with this id,
// e.g.  <button id="reviewBtn">Review Code</button>
const reviewBtn = document.getElementById('reviewBtn');
if (reviewBtn) {
    reviewBtn.addEventListener('click', runReviewScan);
} else {
    console.warn('runReviewScan is ready, but no #reviewBtn element was found in the DOM to wire it to.');
}


  // ==========================================
  // Chat logic
  // ==========================================
  const chatInput = document.getElementById('chatInput');
  const sendChatBtn = document.getElementById('sendChatBtn');
  const chatContent = document.getElementById('Chat-content');

  function addChatMessage(text, sender) {
      const msgDiv = document.createElement('div');
      msgDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
      const textDiv = document.createElement('div');
      textDiv.classList.add('msg-text');
      textDiv.textContent = text; 
      msgDiv.appendChild(textDiv);
      chatContent.appendChild(msgDiv);
      chatContent.scrollTop = chatContent.scrollHeight;
  }

  function addHtmlMessage(htmlContent, sender, id = null) {
      const msgDiv = document.createElement('div');
      if (id) msgDiv.id = id;
      msgDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
      const textDiv = document.createElement('div');
      textDiv.classList.add('msg-text');
      textDiv.innerHTML = htmlContent; 
      msgDiv.appendChild(textDiv);
      chatContent.appendChild(msgDiv);
      chatContent.scrollTop = chatContent.scrollHeight;
  }

  async function handleChatSend() {
      const message = chatInput.value.trim();
      if (!message) return;

      addChatMessage(message, 'user');
      chatInput.value = '';

      const loadingId = 'loading-' + Date.now();
      const loadingHtml = `<div class="loader-container"><div class="spinner"></div><span class="dots-loader">Thinking...</span></div>`;
      addHtmlMessage(loadingHtml, 'bot', loadingId);

      const currentCode = codeEditor.innerText;

      try {
          const response = await fetch('/Chat_with_code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: message, code: currentCode })
          });
          const data = await response.json();
          document.getElementById(loadingId)?.remove(); 
          addChatMessage(data.reply, 'bot');
      } catch (error) {
          document.getElementById(loadingId)?.remove();
          addChatMessage("❌ Error connecting to AI server.", 'bot');
      }
  }

  sendChatBtn.addEventListener('click', handleChatSend);
  chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleChatSend(); });


  // ==========================================
  // Auth logic
  // ==========================================
  async function submitAuth(action) {
    const messageBox = document.getElementById('message-box');
    const loader = document.getElementById('page-loader');

    const usernameId = action === 'login' ? 'login-username' : 'reg-username';
    const passwordId = action === 'login' ? 'login-password' : 'reg-password';

    const username = document.getElementById(usernameId).value.trim();
    const password = document.getElementById(passwordId).value.trim();

    if (!username || !password) {
        messageBox.style.color = '#ff5555';
        messageBox.innerText = 'Please enter both username and password.';
        return;
    }

    const payload = {};
    payload[usernameId] = username;
    payload[passwordId] = password;

    loader.style.display = 'flex';
    messageBox.innerText = '';

    try {
        const response = await fetch(`/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            if (action === 'login') {
                window.location.href = '/';
            } else if (action === 'register') {
                messageBox.style.color = '#4CAF50';
                messageBox.innerText = data.message;

                document.getElementById('reg-username').value = '';
                document.getElementById('reg-password').value = '';

                toggleForms();

                setTimeout(() => {
                    document.getElementById('message-box').innerText = data.message;
                    document.getElementById('message-box').style.color = '#4CAF50';
                }, 10);
            }
        } else {
            messageBox.style.color = '#ff5555';
            messageBox.innerText = data.message || 'Authentication failed.';
        }
    } catch (error) {
        console.error('Error during authentication:', error);
        messageBox.style.color = '#ff5555';
        messageBox.innerText = 'Connection to the server failed.';
    } finally {
        loader.style.display = 'none';
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const loginPass = document.getElementById('login-password');
    const regPass = document.getElementById('reg-password');

    if (loginPass) {
        loginPass.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') submitAuth('login');
        });
    }

    if (regPass) {
        regPass.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') submitAuth('register');
        });
    }
  });

function toggleForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const messageBox = document.getElementById('message-box');

    if (messageBox) messageBox.innerText = ''; 

    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}