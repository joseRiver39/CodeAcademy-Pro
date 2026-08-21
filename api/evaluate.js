// Mapa en memoria para Rate Limiting básico por IP (en Vercel dura lo que dura la instancia de la función)
const ipRateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15000; // 15 segundos

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const lastRequestTime = ipRateLimitMap.get(ip);
  const now = Date.now();

  if (lastRequestTime && now - lastRequestTime < RATE_LIMIT_WINDOW_MS) {
    return res.status(429).json({ error: 'Too Many Requests. Please wait 15 seconds before evaluating again.' });
  }
  
  ipRateLimitMap.set(ip, now);

  const { code, language, context } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured on server' });
  }

    // Usamos el prompt estructurado para forzar salida JSON usando el nuevo esquema de Gemini
    const prompt = `Actúa como un mentor de programación senior. El usuario está aprendiendo ${language || 'un lenguaje de programación'}.
Contexto del ejercicio: ${context || 'Práctica general'}

Código escrito por el usuario:
\`\`\`
${code}
\`\`\`

Revisa este código cualitativamente. No lo ejecutes, solo analiza.
Devuelve tu feedback en formato JSON válido con la siguiente estructura:
{
  "feedback": "Comentario general constructivo",
  "suggestions": ["Sugerencia 1", "Sugerencia 2"],
  "goodPractices": ["Buena práctica identificada 1"]
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
    
    if (!response.ok) {
        throw new Error(data.error?.message || 'Error from OpenRouter API');
    }

    const rawContent = data.choices[0].message.content;
    const parsedFeedback = JSON.parse(rawContent);

    res.status(200).json(parsedFeedback);
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: 'Error generating feedback', details: error.message });
  }
}
