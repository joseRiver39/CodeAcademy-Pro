const fs = require('fs');
const path = require('path');

const javaIndex = require('../public/content/java/index.json');
const csharpIndex = require('../public/content/csharp/index.json');

const CONTENT_DIR = path.join(__dirname, '../public/content');

function createLessonFiles(courseId, courseIndex) {
  courseIndex.modules.forEach((mod) => {
    const moduleDir = path.join(CONTENT_DIR, courseId, mod.id);
    
    if (!fs.existsSync(moduleDir)) {
      fs.mkdirSync(moduleDir, { recursive: true });
    }

    mod.lessons.forEach((lesson, index) => {
      const lessonPath = path.join(CONTENT_DIR, '..', lesson.path);
      
      if (!fs.existsSync(lessonPath)) {
        const nextLesson = mod.lessons[index + 1];
        const prevLesson = mod.lessons[index - 1];

        const template = {
          id: lesson.id,
          title: lesson.title,
          description: `Aprende sobre ${lesson.title.toLowerCase()} en ${courseId === 'java' ? 'Java' : 'C#'}.`,
          language: courseId,
          level: mod.id,
          estimatedMinutes: 15,
          nextLessonId: nextLesson ? nextLesson.id : null,
          previousLessonId: prevLesson ? prevLesson.id : null,
          contentBlocks: [
            {
              type: "markdown",
              content: `### ${lesson.title}\n\nContenido en construcción.`
            },
            {
              type: "code-editor",
              config: {
                language: courseId,
                theme: "vs-dark",
                readOnly: false,
                hints: [
                  "Pista 1: En construcción",
                  "Pista 2: En construcción"
                ],
                initialCode: courseId === 'java' 
                  ? "public class Main {\n    public static void main(String[] args) {\n        // Escribe tu código aquí\n    }\n}" 
                  : "using System;\n\nclass Program {\n    static void Main() {\n        // Escribe tu código aquí\n    }\n}",
                solutionCode: courseId === 'java'
                  ? "public class Main {\n    public static void main(String[] args) {\n        // Solución aquí\n    }\n}"
                  : "using System;\n\nclass Program {\n    static void Main() {\n        // Solución aquí\n    }\n}"
              }
            }
          ]
        };

        fs.writeFileSync(lessonPath, JSON.stringify(template, null, 2));
        console.log(`Created: ${lessonPath}`);
      }
    });
  });
}

createLessonFiles('java', javaIndex);
createLessonFiles('csharp', csharpIndex);
console.log('All missing lessons generated successfully.');
