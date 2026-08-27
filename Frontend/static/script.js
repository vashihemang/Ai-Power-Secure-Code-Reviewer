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

  // Ctrl + J shortcut to directly start analyzing (Review button removed)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'j') { 
        e.preventDefault(); 
        syncCodeWithBackend(); // Directly calls the sync and stream function
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

    // Trigger paste code sync & instantly start stream
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => { syncCodeWithBackend(); }, 1000);
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

