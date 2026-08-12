const fs = require('fs');
const path = require('path');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) { console.error("No GROQ_API_KEY found"); process.exit(1); }

const delay = ms => new Promise(res => setTimeout(res, ms));

async function generateLesson(topic) {
  const prompt = `Actúa como el mejor profesor de programación del mundo, experto en ${topic.language} y bases de datos.

Genera el contenido JSON COMPLETO para una lección interactiva sobre: "${topic.title}"
Lenguaje: ${topic.language}
Nivel: ${topic.level}

El JSON debe tener esta estructura EXACTA:
{
  "id": "${topic.id}",
  "title": "${topic.title}",
  "description": "${topic.description}",
  "language": "${topic.language.toLowerCase()}",
  "level": "${topic.level}",
  "estimatedMinutes": ${topic.minutes},
  "nextLessonId": "${topic.nextId || ''}",
  "previousLessonId": "${topic.prevId || ''}",
  "contentBlocks": [
    {
      "type": "markdown",
      "content": "AQUÍ VA UNA EXPLICACIÓN MUY DETALLADA Y PEDAGÓGICA"
    },
    {
      "type": "code-editor",
      "config": {
        "language": "${topic.language.toLowerCase()}",
        "theme": "vs-dark",
        "readOnly": false,
        "hints": ["pista 1", "pista 2", "pista 3"],
        "initialCode": "AQUÍ EL CÓDIGO INICIAL CON COMENTARIOS GUÍA",
        "solutionCode": "AQUÍ LA SOLUCIÓN COMPLETA"
      }
    }
  ]
}

REGLAS PARA EL MARKDOWN:
1. Explica QUÉ ES el concepto, PARA QUÉ SIRVE, y todos los tipos/variantes.
2. Usa analogías del mundo real.
3. Muestra ejemplos de código con explicación línea por línea.
4. Al final, indica al estudiante qué debe hacer en el editor y que presione "▶ Ejecutar Código".
5. Usa subtítulos (###) para organizar.

REGLAS PARA EL CÓDIGO:
- El initialCode debe tener comentarios que guíen al estudiante paso a paso.
- La solutionCode debe ser funcional y completa.
- Para temas de JDBC/ADO.NET, usa código de ejemplo realista (con try-catch, conexión, etc.)
- Simula la BD con comentarios tipo: // Simula una BD con lista en memoria para poder ejecutar

Responde ÚNICAMENTE con el JSON válido, sin texto adicional.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Groq error');
    const raw = data.choices[0].message.content.trim();
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error generando ${topic.title}:`, e.message);
    return null;
  }
}

const javaLessons = [
  {
    id: 'java-bd-01-sql-basico',
    title: 'SQL Básico para Desarrolladores Java',
    description: 'Aprende los comandos SQL fundamentales: SELECT, INSERT, UPDATE, DELETE.',
    language: 'java',
    level: 'basededatos',
    minutes: 20,
    prevId: '',
    nextId: 'java-bd-02-jdbc-conexion'
  },
  {
    id: 'java-bd-02-jdbc-conexion',
    title: 'Conexión a Base de Datos con JDBC',
    description: 'Conecta tu programa Java a una base de datos MySQL usando JDBC.',
    language: 'java',
    level: 'basededatos',
    minutes: 25,
    prevId: 'java-bd-01-sql-basico',
    nextId: 'java-bd-03-jdbc-crud'
  },
  {
    id: 'java-bd-03-jdbc-crud',
    title: 'CRUD Completo con JDBC',
    description: 'Implementa Crear, Leer, Actualizar y Eliminar registros con JDBC puro.',
    language: 'java',
    level: 'basededatos',
    minutes: 30,
    prevId: 'java-bd-02-jdbc-conexion',
    nextId: 'java-bd-04-jpa-orm'
  },
  {
    id: 'java-bd-04-jpa-orm',
    title: 'ORM con JPA e Hibernate',
    description: 'Mapea objetos Java a tablas de BD con JPA e Hibernate (el estándar empresarial).',
    language: 'java',
    level: 'basededatos',
    minutes: 30,
    prevId: 'java-bd-03-jdbc-crud',
    nextId: 'java-bd-05-repository'
  },
  {
    id: 'java-bd-05-repository',
    title: 'Patrón Repository en Java',
    description: 'Separa la lógica de acceso a datos del negocio usando el patrón Repository.',
    language: 'java',
    level: 'basededatos',
    minutes: 25,
    prevId: 'java-bd-04-jpa-orm',
    nextId: 'java-bd-06-proyecto-final'
  },
  {
    id: 'java-bd-06-proyecto-final',
    title: 'Proyecto Final: Sistema de Gestión de Estudiantes',
    description: 'Construye un CRUD completo para gestionar estudiantes con todos los conceptos aprendidos.',
    language: 'java',
    level: 'basededatos',
    minutes: 40,
    prevId: 'java-bd-05-repository',
    nextId: ''
  }
];

const csharpLessons = [
  {
    id: 'csharp-bd-01-sql-basico',
    title: 'SQL Básico para Desarrolladores C#',
    description: 'Aprende los comandos SQL fundamentales: SELECT, INSERT, UPDATE, DELETE.',
    language: 'csharp',
    level: 'basededatos',
    minutes: 20,
    prevId: '',
    nextId: 'csharp-bd-02-adonet-conexion'
  },
  {
    id: 'csharp-bd-02-adonet-conexion',
    title: 'Conexión a Base de Datos con ADO.NET',
    description: 'Conecta tu aplicación C# a SQL Server usando ADO.NET.',
    language: 'csharp',
    level: 'basededatos',
    minutes: 25,
    prevId: 'csharp-bd-01-sql-basico',
    nextId: 'csharp-bd-03-crud'
  },
  {
    id: 'csharp-bd-03-crud',
    title: 'CRUD Completo con ADO.NET',
    description: 'Implementa Crear, Leer, Actualizar y Eliminar registros con ADO.NET.',
    language: 'csharp',
    level: 'basededatos',
    minutes: 30,
    prevId: 'csharp-bd-02-adonet-conexion',
    nextId: 'csharp-bd-04-ef-core'
  },
  {
    id: 'csharp-bd-04-ef-core',
    title: 'ORM con Entity Framework Core',
    description: 'Usa Entity Framework Core para mapear clases C# a tablas de base de datos.',
    language: 'csharp',
    level: 'basededatos',
    minutes: 30,
    prevId: 'csharp-bd-03-crud',
    nextId: 'csharp-bd-05-repository'
  },
  {
    id: 'csharp-bd-05-repository',
    title: 'Patrón Repository en C#',
    description: 'Separa la lógica de acceso a datos usando el patrón Repository con interfaces.',
    language: 'csharp',
    level: 'basededatos',
    minutes: 25,
    prevId: 'csharp-bd-04-ef-core',
    nextId: 'csharp-bd-06-proyecto-final'
  },
  {
    id: 'csharp-bd-06-proyecto-final',
    title: 'Proyecto Final: Sistema de Gestión de Estudiantes',
    description: 'Construye un CRUD completo para gestionar estudiantes con todos los conceptos aprendidos.',
    language: 'csharp',
    level: 'basededatos',
    minutes: 40,
    prevId: 'csharp-bd-05-repository',
    nextId: ''
  }
];

async function main() {
  // Create directories
  const javaDir = path.join(__dirname, '../public/content/java/basededatos');
  const csharpDir = path.join(__dirname, '../public/content/csharp/basededatos');
  fs.mkdirSync(javaDir, { recursive: true });
  fs.mkdirSync(csharpDir, { recursive: true });

  const allLessons = [...javaLessons, ...csharpLessons];
  for (const topic of allLessons) {
    const dir = topic.language === 'java' ? javaDir : csharpDir;
    const filePath = path.join(dir, `${topic.id}.json`);
    
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
    await delay(4000);
  }

  console.log('¡Generación de módulo de BD completada!');
}

main();
