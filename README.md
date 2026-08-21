# CodeAcademy Pro

CodeAcademy Pro es una plataforma interactiva de aprendizaje de programación (Java, C#) con un entorno de ejecución simulado impulsado por IA.

## 🚀 Características
- **UI/UX Moderno**: Dark Mode, Glassmorphism, diseño responsivo (Angular 18).
- **Ejecución Simulada por IA**: Motor que lee, evalúa y "ejecuta" código Java y C# directamente en el navegador, devolviendo los resultados en una terminal interactiva.
- **Currículo Profesional**: Rutas de aprendizaje completas, incluyendo un módulo detallado de **Bases de Datos** (JDBC, JPA, Spring Boot, ADO.NET, Entity Framework) y guías de arquitectura limpia empresariales para Visual Studio y NetBeans.
- **Backend Serverless**: Backend adaptado nativamente para Vercel Serverless Functions.

## 🛠️ Desarrollo Local
1. Clona el repositorio: `git clone <tu-repo>`
2. Instala dependencias: `npm install`
3. Configura las variables de entorno: 
   - Copia `.env.example` a `.env`
   - Agrega tu `OPENROUTER_API_KEY` (puedes obtenerla gratis en [console.OpenRouter.com](https://console.OpenRouter.com/)).
4. Levanta los servidores locales:
   - En una terminal, ejecuta la API local (para simular Serverless): `node api-dev-server.js`
   - En otra terminal, levanta la interfaz de Angular: `npm start` (o `ng serve`)

## 🌐 Despliegue en Vercel (Producción)
Este proyecto está diseñado para funcionar perfectamente en **Vercel** sin servidores dedicados.

### ¿Cómo funcionan los "Agentes de IA" en Vercel?
Al ser Angular una Single Page Application (SPA), Vercel alojará todo el Frontend en su CDN global. 
Sin embargo, para el motor de ejecución de código (el Agente IA) no podemos hacer las peticiones a OpenRouter desde el frontend, porque exponer nuestra `OPENROUTER_API_KEY` al público sería un fallo de seguridad crítico.

Para solucionarlo, el proyecto usa **Vercel Serverless Functions**. Todos los archivos dentro de la carpeta `api/` (`api/evaluate.js` y `api/run.js`) son automáticamente detectados por Vercel y convertidos en endpoints backend. 

**Flujo:**
1. El estudiante presiona "▶ Ejecutar Código" en el frontend.
2. Angular hace un POST a `/api/run`.
3. Vercel despierta la Serverless Function segura.
4. La función llama a la IA (OpenRouter), procesa la respuesta para que parezca una terminal real y se la devuelve a Angular.

### Pasos para Desplegar:
1. Sube este código a tu repositorio en **GitHub**.
2. Ve a [Vercel](https://vercel.com/) e inicia sesión.
3. Haz clic en **Add New > Project** e importa tu repositorio.
4. Vercel detectará automáticamente que es un proyecto **Angular** (deja el *Framework Preset* por defecto).
5. **¡MUY IMPORTANTE! Variables de Entorno**: En la sección *Environment Variables* debes agregar tu API Key para que los agentes funcionen en producción:
   - **Key**: `OPENROUTER_API_KEY`
   - **Value**: `<tu-api-key-de-OpenRouter>`
6. Haz clic en **Deploy**.

¡Eso es todo! En menos de 2 minutos tu plataforma estará en vivo y los agentes de IA funcionarán usando las Serverless Functions de forma segura.
