const fs = require('fs');
const path = require('path');
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) { console.error("No OPENROUTER_API_KEY found"); process.exit(1); }
const delay = ms => new Promise(res => setTimeout(res, ms));

async function generateLesson(topic) {
  const prompt = `Actúa como el mejor profesor de programación del mundo, especializado en Java con Spring Boot para el mundo profesional de hoy.

Genera el contenido JSON COMPLETO para esta lección interactiva:
- Título: "${topic.title}"
- Descripción: "${topic.description}"
- Nivel: ${topic.level}

ESTRUCTURA JSON EXACTA (responde SOLO el JSON, nada más):
{
  "id": "${topic.id}",
  "title": "${topic.title}",
  "description": "${topic.description}",
  "language": "java",
  "level": "${topic.level}",
  "estimatedMinutes": ${topic.minutes},
  "nextLessonId": "${topic.nextId || ''}",
  "previousLessonId": "${topic.prevId || ''}",
  "contentBlocks": [
    {
      "type": "markdown",
      "content": "EXPLICACIÓN DETALLADA AQUÍ"
    },
    {
      "type": "code-editor",
      "config": {
        "language": "java",
        "theme": "vs-dark",
        "readOnly": false,
        "hints": ["pista 1", "pista 2", "pista 3"],
        "initialCode": "CÓDIGO INICIAL CON COMENTARIOS GUÍA",
        "solutionCode": "SOLUCIÓN COMPLETA"
      }
    }
  ]
}

REGLAS CRÍTICAS PARA EL MARKDOWN (campo content):
1. Explica QUÉ ES el concepto y POR QUÉ se usa en la industria real hoy en día.
2. Muestra la diferencia entre el enfoque antiguo (JDBC puro) y el moderno (Spring Boot).
3. Explica cada anotación (@RestController, @Entity, @Service, @Repository, @GetMapping, etc.) con analogías claras.
4. Incluye ejemplos de código dentro de la explicación.
5. Al final, da instrucciones claras: "Ahora escribe en el editor..." y recuérdales presionar **"▶ Ejecutar Código"**.
6. Usa subtítulos ### para organizar.

REGLAS PARA EL CÓDIGO (initialCode y solutionCode):
- Como no podemos ejecutar Spring Boot real en el navegador, el código debe ser una clase Java PURA que SIMULE el comportamiento de Spring Boot.
- Usa comentarios que expliquen: // @Entity - En Spring Boot esta clase sería una tabla de BD
- Simula con listas en memoria los repositorios que en Spring Boot serían JPA.
- El código debe ser ejecutable como Java puro para que el estudiante vea la salida en la terminal.
- La solutionCode debe ser completa y funcional.`;

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
        temperature: 0.4,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Groq error');
    return JSON.parse(data.choices[0].message.content.trim());
  } catch (e) {
    console.error(`Error generando ${topic.title}:`, e.message);
    return null;
  }
}

const springBootLessons = [
  {
    id: 'java-bd-07-springboot-intro',
    title: 'Introducción a Spring Boot',
    description: 'Descubre el framework más usado en la industria Java: qué es Spring Boot, por qué reemplazó al JDBC puro y cómo funciona su "magia" con anotaciones.',
    level: 'basededatos',
    minutes: 20,
    prevId: 'java-bd-06-proyecto-final',
    nextId: 'java-bd-08-springboot-entity'
  },
  {
    id: 'java-bd-08-springboot-entity',
    title: 'Entidades y @Entity en Spring Boot',
    description: 'Aprende a mapear clases Java a tablas de base de datos usando @Entity, @Id, @GeneratedValue y @Column de JPA/Hibernate.',
    level: 'basededatos',
    minutes: 25,
    prevId: 'java-bd-07-springboot-intro',
    nextId: 'java-bd-09-springboot-repository'
  },
  {
    id: 'java-bd-09-springboot-repository',
    title: '@Repository y Spring Data JPA',
    description: 'Usa JpaRepository para obtener un CRUD completo con CERO líneas de SQL. El estándar profesional moderno para acceso a datos en Java.',
    level: 'basededatos',
    minutes: 25,
    prevId: 'java-bd-08-springboot-entity',
    nextId: 'java-bd-10-springboot-rest'
  },
  {
    id: 'java-bd-10-springboot-rest',
    title: 'API REST con @RestController y @Service',
    description: 'Construye una API REST profesional con Spring Boot: @RestController, @GetMapping, @PostMapping, @PutMapping, @DeleteMapping y la capa @Service.',
    level: 'basededatos',
    minutes: 35,
    prevId: 'java-bd-09-springboot-repository',
    nextId: ''
  }
];

async function main() {
  const javaDir = path.join(__dirname, '../public/content/java/basededatos');
  fs.mkdirSync(javaDir, { recursive: true });

  for (const topic of springBootLessons) {
    const filePath = path.join(javaDir, `${topic.id}.json`);
    if (fs.existsSync(filePath)) {
      console.log(`Skipping ${topic.id} - ya existe.`);
      continue;
    }
    console.log(`Generando: ${topic.title}...`);
    const lesson = await generateLesson(topic);
    if (lesson) {
      fs.writeFileSync(filePath, JSON.stringify(lesson, null, 2), 'utf8');
      console.log(`✅ Creado: ${topic.id}.json`);
    } else {
      console.log(`❌ Falló: ${topic.id}`);
    }
    await delay(5000);
  }
  console.log('¡Lecciones de Spring Boot generadas!');
}

main();
