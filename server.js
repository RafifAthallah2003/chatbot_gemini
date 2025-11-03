const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;


const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

if (!API_KEY) {
  console.warn('⚠️ WARNING: GEMINI_API_KEY not set. Please set it in .env');
}


app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));


app.post('/api/chat', async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

 
  const body = {
    contents: [
      {
        parts: [{ text: message }]
      }
    ]
  };

  try {

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY
      },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('❌ Gemini error', r.status, text);
      return res.status(500).json({ error: 'gemini_error', details: text });
    }

    const json = await r.json();

   
    let reply = 'Maaf, tidak ada balasan dari server.';
    try {
      if (json.candidates?.length) {
        const c = json.candidates[0];
        if (c.content?.parts?.length) {
          reply = c.content.parts.map(p => p.text || '').join('\n');
        } else if (Array.isArray(c.content)) {
          reply = c.content.map(p => p.text || '').join('\n');
        }
      } else if (json.output?.content?.parts?.length) {
        reply = json.output.content.parts.map(p => p.text || '').join('\n');
      } else if (json.outputs?.[0]?.content?.[0]?.parts?.length) {
        reply = json.outputs[0].content[0].parts.map(p => p.text || '').join('\n');
      } else if (json.text) {
        reply = json.text;
      } else {
        reply = JSON.stringify(json).slice(0, 500);
      }
    } catch (err) {
      console.error('⚠️ Parsing error:', err);
    }

    return res.json({ reply });
  } catch (err) {
    console.error('💥 Server error:', err);
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
