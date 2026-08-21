// Local dev server - CommonJS format (compatible with Angular CLI in same project)
// Mirrors the Vercel serverless function at /api/evaluate.js
// Angular proxy (proxy.conf.json) forwards /api/* from port 4200 → this server on port 3000

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Rate limiting (mirrors production logic)
const ipRateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15000;

app.post('/api/evaluate', async (req, res) => {
  const ip = req.ip || 'unknown';
  const lastRequestTime = ipRateLimitMap.get(ip);
  const now = Date.now();

  if (lastRequestTime && now - lastRequestTime < RATE_LIMIT_WINDOW_MS) {
    return res.status(429).json({ error: 'Too Many Requests. Espera 15 segundos.' });
  }
  ipRateLimitMap.set(ip, now);

  const { code, language, context } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn('[DEV] OPENROUTER_API_KEY no definida. Devolviendo feedback simulado.');
    return res.status(200).json({
      feedback: 'Sin API Key configurada. Agrega OPENROUTER_API_KEY en tu archivo .env (gratis en openrouter.ai).',
      suggestions: ['Declara la variable con el tipo correcto (ej. int, String)', 'Recuerda el punto y coma al final de cada instrucción'],
      goodPractices: ['Usaste un nombre de variable descriptivo']
    });
  }

  try {
    const prompt = `Actúa como un mentor de programación senior. El usuario está aprendiendo ${language || 'programación'}.
Contexto del ejercicio: ${context || 'Práctica general'}

Código escrito por el usuario:
\`\`\`
${code}
\`\`\`

Revisa este código cualitativamente. No lo ejecutes. Responde SOLO con un objeto JSON válido con esta estructura exacta:
{
  "feedback": "Comentario general constructivo en español",
  "suggestions": ["Sugerencia 1", "Sugerencia 2"],
  "goodPractices": ["Buena práctica identificada"]
}`;

    const response = await fetch(`${process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openrouter/free',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 500,
        temperature: 0.3
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'OpenRouter API error');

    const raw = data.choices[0].message.content;
    console.log('[DEV] Groq respondió OK');
    res.status(200).json(JSON.parse(raw));
  } catch (error) {
    console.error('[DEV] Error llamando a OpenRouter:', error.message);
    res.status(500).json({ error: 'Error generando feedback', details: error.message });
  }
});

app.post('/api/run', async (req, res) => {
  const ip = req.ip || 'unknown';
  const lastRequestTime = ipRateLimitMap.get(ip + '_run');
  const now = Date.now();

  if (lastRequestTime && now - lastRequestTime < RATE_LIMIT_WINDOW_MS) {
    return res.status(429).json({ error: 'Too Many Requests. Espera 15 segundos.' });
  }
  ipRateLimitMap.set(ip + '_run', now);

  const { code, language } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      output: 'Mock Console Output: Hello World\n(OPENROUTER_API_KEY missing in .env)',
      isError: false
    });
  }

  try {
    const prompt = `Actúa EXCLUSIVAMENTE como el entorno de ejecución (compilador/intérprete) del lenguaje ${language || 'programación'}.
El usuario intentará ejecutar el siguiente código:
\`\`\`
${code}
\`\`\`

REGLAS ESTRICTAS:
1. Ejecuta mentalmente el código paso a paso.
2. Tu respuesta debe ser ÚNICAMENTE el texto exacto que aparecería en la consola (stdout).
3. NO añadas explicaciones, saludos, formato Markdown, ni bloques de código (\`\`\`).
4. Si el código tiene un error de sintaxis o runtime, tu respuesta debe ser ÚNICAMENTE el mensaje de error (simulando stderr). Comienza el error con la palabra "Error:".
5. Si el programa no imprime nada, responde con "SUCCESS_NO_OUTPUT".`;

    const response = await fetch(`${process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openrouter/free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.1
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'OpenRouter API error');

    let raw = data.choices[0].message.content.trim();
    
    // Remove markdown backticks if AI accidentally included them
    raw = raw.replace(/^```[\w]*\n/, '').replace(/```$/, '').trim();

    let isError = raw.toLowerCase().startsWith('error:');
    if (raw === 'SUCCESS_NO_OUTPUT') {
      raw = '';
    }

    res.status(200).json({ output: raw, isError });
  } catch (error) {
    console.error('[DEV] Error en ejecución simulada:', error.message);
    res.status(500).json({ error: 'Error ejecutando el código', details: error.message });
  }
});

app.listen(3000, () => {
  console.log('✅ API dev server en http://localhost:3000');
  console.log('   OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '✅ configurada' : '❌ no encontrada (usará mock)');
});
