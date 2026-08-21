// Vercel Serverless Function for Code Execution Simulation
const ipRateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const lastRequestTime = ipRateLimitMap.get(ip);
  const now = Date.now();

  if (lastRequestTime && now - lastRequestTime < RATE_LIMIT_WINDOW_MS) {
    return res.status(429).json({ error: 'Too Many Requests. Espera 15 segundos.' });
  }
  
  ipRateLimitMap.set(ip, now);

  const { code, language } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      output: 'Mock Console Output: Hello World\n(OPENROUTER_API_KEY missing in Vercel Environment Variables)',
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
    console.error('Execution Error:', error);
    res.status(500).json({ error: 'Error ejecutando el código', details: error.message });
  }
}
