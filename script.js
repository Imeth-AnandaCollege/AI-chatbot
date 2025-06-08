const API_KEY = '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'; // Replace with your actual API key
const MODEL = 'mistralai/mistral-7b-instruct';
const messages = JSON.parse(localStorage.getItem('chatHistory')) || [];

document.getElementById('chat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('user-input');
  const userMessage = input.value.trim();
  if (!userMessage) return;

  const userEl = addMessage('user', userMessage);
  messages.push({ role: 'user', content: userMessage });
  input.value = '';

  const botEl = addMessage('assistant', '');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5500',
      'X-Title': 'GradientChat'
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullReply = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.trim().startsWith('data: '));
    for (const line of lines) {
      const json = line.slice(6);
      if (json === '[DONE]') return;
      try {
        const parsed = JSON.parse(json);
        const token = parsed.choices?.[0]?.delta?.content || '';
        fullReply += token;
        updateBotMessage(botEl, fullReply);
        speak(token);
      } catch (e) {
        console.error('Parse error:', e);
      }
    }
  }

  messages.push({ role: 'assistant', content: fullReply });
  localStorage.setItem('chatHistory', JSON.stringify(messages));
});

function addMessage(role, content) {
  const chatLog = document.getElementById('chat-log');
  const msg = document.createElement('div');
  msg.className = `msg ${role}`;
  msg.innerHTML = `<div class="bubble">${content}</div>`;
  chatLog.appendChild(msg);
  chatLog.scrollTop = chatLog.scrollHeight;
  return msg;
}

function updateBotMessage(el, content) {
  el.querySelector('.bubble').textContent = content;
}

document.getElementById('toggle-dark').addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

document.getElementById('theme-select').addEventListener('change', (e) => {
  document.body.className = e.target.value + (document.body.classList.contains('dark') ? ' dark' : '');
});

const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
});

const particles = Array.from({ length: 80 }, () => ({
  x: Math.random() * w,
  y: Math.random() * h,
  r: Math.random() * 3 + 1,
  dx: (Math.random() - 0.5) * 0.7,
  dy: (Math.random() - 0.5) * 0.7,
  o: Math.random() * 0.4 + 0.1,
  color: `hsla(${Math.random() * 360}, 70%, 80%,`
}));

function drawParticles() {
  ctx.clearRect(0, 0, w, h);
  for (let p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `${p.color}${p.o})`;
    ctx.fill();
    p.x += p.dx;
    p.y += p.dy;
    if (p.x < 0 || p.x > w) p.dx *= -1;
    if (p.y < 0 || p.y > h) p.dy *= -1;
  }
  requestAnimationFrame(drawParticles);
}
drawParticles();

function speak(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  }
}
