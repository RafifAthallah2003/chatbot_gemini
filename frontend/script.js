const form = document.getElementById('chatForm');
const input = document.getElementById('inputMsg');
const messages = document.getElementById('messages');
let history = []; // simple local conversation history (not persisted on server)

function appendMessage(text, cls='bot') {
  const el = document.createElement('div');
  el.className = 'msg ' + cls;
  el.textContent = text;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}

async function sendMessage(userText) {
  appendMessage(userText, 'user');
  input.value = '';
  appendMessage('...typing', 'bot');
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText, history })
    });
    const data = await res.json();
    // remove last '...typing' placeholder
    const last = messages.lastElementChild;
    if (last && last.textContent === '...typing') last.remove();
    if (data && data.reply) {
      appendMessage(data.reply, 'bot');
      history.push({ role: 'user', content: userText });
      history.push({ role: 'assistant', content: data.reply });
    } else {
      appendMessage('Maaf, tidak ada balasan dari server.', 'bot');
    }
  } catch (err) {
    const last = messages.lastElementChild;
    if (last && last.textContent === '...typing') last.remove();
    appendMessage('Gagal terhubung ke server: ' + (err.message||err), 'bot');
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const txt = input.value.trim();
  if (!txt) return;
  sendMessage(txt);
});
