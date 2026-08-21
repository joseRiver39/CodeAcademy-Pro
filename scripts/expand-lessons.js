const fs = require('fs');
const path = require('path');
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error("No OPENROUTER_API_KEY found in .env");
  process.exit(1);
}

// Helper to delay execution
const delay = ms => new Promise(res => setTimeout(res, ms));

async function expandLessonContent(lesson) {
  const title = lesson.title;
  const description = lesson.description;
  const originalMarkdown = lesson.contentBlocks[0].content;
  const initialCode = lesson.contentBlocks[1].config.initialCode;
  
  const prompt = `Actúa como el mejor y más empático profesor de programación del mundo, experto en enseñar a absolutos principiantes (desde cero).
El estudiante está aprendiendo el tema: "${title}".
Descripción general: "${description}"

Tu tarea es REESCRIBIR y EXPANDIR drásticamente la siguiente teoría corta:
"${originalMarkdown}"

REGLAS ESTRICTAS PARA TU RESPUESTA:
1. Explica el concepto de forma súper detallada y amigable (ej. qué es, para qué sirve, qué tipos existen, cómo se define).
2. Usa al menos una analogía del mundo real (ej. "una variable es como una caja mudanza").
3. Muestra ejemplos claros y cortos de código en Markdown para ilustrar la explicación teórica.
4. AL FINAL DE LA TEORÍA, DEBES dar instrucciones exactas de qué debe hacer el estudiante a continuación. Diles: "Ahora es tu turno. En el editor de código que está debajo, escribe lo siguiente..." (dales una pista de lo que deben hacer basado en este código base: \n${initialCode}\n).
5. DEBES recordarles explícitamente que, una vez escriban el código, deben hacer clic en el botón verde **"▶ Ejecutar Código"** para ver el resultado en la Terminal interactiva.
6. Devuelve ÚNICAMENTE el texto Markdown generado. Nada de saludos, nada de etiquetas HTML, solo el Markdown listo para ser inyectado. Asegúrate de usar subtítulos (###) para organizar la lectura.`;

  try {
    const response = await fetch(`${process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openrouter/free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'OpenRouter API error');

    let expanded = data.choices[0].message.content.trim();
    return expanded;
  } catch (error) {
    console.error(`Error procesando ${title}:`, error.message);
    return originalMarkdown; // fallback to original if error
  }
}

async function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.name.endsWith('.json') && entry.name !== 'index.json') {
      console.log(`Procesando: ${entry.name}...`);
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      try {
        const lesson = JSON.parse(fileContent);
        
        // Skip if it doesn't have the expected structure
        if (lesson.contentBlocks && lesson.contentBlocks[0].type === 'markdown' && lesson.contentBlocks[1]?.type === 'code-editor') {
          
          // Skip if already very long (prevent infinite reprocessing)
          if (lesson.contentBlocks[0].content.length > 500) {
            console.log(`Skipping ${entry.name}, ya parece estar expandido.`);
            continue;
          }

          const expandedContent = await expandLessonContent(lesson);
          lesson.contentBlocks[0].content = expandedContent;
          
          fs.writeFileSync(fullPath, JSON.stringify(lesson, null, 2), 'utf8');
          console.log(`✅ Actualizado: ${entry.name}`);
          
          // Wait 3 seconds to avoid rate limits
          await delay(3000);
        }
      } catch(e) {
        console.error(`Error parseando JSON ${entry.name}:`, e.message);
      }
    }
  }
}

const contentDir = path.join(__dirname, '../public/content');
console.log("Iniciando expansión de lecciones...");
processDirectory(contentDir).then(() => {
  console.log("¡Proceso finalizado!");
});
