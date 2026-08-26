# 🎓 MiTutor — Tu tutor personal en un solo archivo

**MiTutor** es una aplicación web educativa, 100 % en español, que funciona **sin instalar nada** y **casi toda sin internet**: matemáticas resueltas paso a paso, asistente de investigación, buscador enciclopédico, agenda escolar, tarjetas de memoria y un tutor de IA para **cualquier materia** (con soporte de fotos, cámara y PDF).

> Todo el proyecto cabe en **un solo archivo HTML** (`index.html`) — sin dependencias, sin frameworks, sin compilación.

---

## ✨ Funciones

### 🧮 Matemáticas (motor propio, sin internet)
- **Resolutor paso a paso** con explicación del *por qué* de cada paso:
  operaciones con jerarquía, ecuaciones lineales, cuadráticas (fórmula general,
  discriminante, factorización, vértice), sistemas 2×2 por eliminación,
  ejercicio libre (pega el ejercicio tal cual) y **derivadas** (regla de potencias, término a término).
- Fracciones **exactas** (1/3 + 1/6 = 1/2, sin errores de decimales).
- ⌨️ **Teclado matemático** en pantalla (÷ × − √ ² ³ …) pensado para celulares.
- 💯 Porcentajes (descuentos, IVA, variaciones) y 📐 geometría (11 figuras con fórmula, sustitución y resultado).
- 🏆 Práctica gamificada: 8 temas, niveles, estrellas y récords.
- 🖨️ Generador de **evaluaciones imprimibles** con hoja de respuestas.
- 📊 Panel de **progreso**: racha de estudio 🔥, precisión por tema, estadísticas.

### 📖 Aprender e investigar
- Catálogo buscable de temas con **teoría, clases desde cero y ejercicios generados**.
- 🔎 Buscador integrado en **Wikipedia** (sin API key).
- 📋 Generador de planes de trabajo (ensayo, informe, exposición) con estructura, fuentes confiables y calendario.
- ✍️ Generador de citas **APA 7** (web, libro, artículo, video, enciclopedia).

### 🗂️ Vida estudiantil
- 📅 Agenda de tareas y exámenes con avisos (🔥 hoy, ⚠ atrasada).
- 🃏 Tarjetas de memoria con repaso de las falladas.
- ⏱️ Pomodoro y método Feynman.
- 🎨 5 temas de interfaz (incluido modo noche).

### 🤖 Tutor IA (opcional, requiere internet)
- Chat con un tutor profesional para **cualquier materia**.
- **Dos modos**: 🎓 *Aprender* (guía socrática con pistas) y ✅ *Resolver TODO* (solución completa explicada) — con botón para pasar de uno a otro en un toque.
- 📸 Cámara y galería (lee **fotos de ejercicios**), 📕 **PDFs** (vía Gemini), archivos de texto.
- Proveedores: **Google Gemini** (llave `AIza…` o `AQ…`), **Groq** (`gsk_…`), **OpenAI** (`sk-…`), OpenRouter.
- Detección automática del proveedor por el prefijo de la llave, limpieza de caracteres invisibles al pegar, migración automática de modelos retirados, reintentos ante saturación y opción de **llave permanente**.

---

## 🚀 Cómo usarlo

### Opción 1 — abrir y listo
Descarga `index.html` y ábrelo con doble clic en cualquier navegador.
Todo funciona sin internet, excepto el chat de IA y el buscador.

### Opción 2 — con el servidor (opcional)
```bash
node src/server.js
```
Sirve la app en `http://localhost:3000` y actúa como puente para el Tutor IA
(además permite guardar la llave de forma permanente en el servidor).

### Opción 3 — GitHub Pages (URL pública gratis)
1. Crea un repositorio y sube los archivos de este proyecto.
2. **Settings → Pages** → Branch: `main`, carpeta `/ (root)` → **Save**.
3. En un minuto tu app estará en `https://TU_USUARIO.github.io/mitutor/`.

### Configurar el Tutor IA (2 minutos, gratis)
1. Entra a [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → *Crear clave de API* (también sirve [Groq](https://console.groq.com/keys)).
2. En la app: **Tutor IA → API key** → pega la llave → **🔍 Probar llave**.
3. ¡Listo! La llave se guarda solo en tu navegador (o en tu servidor).

---

## 🔒 Privacidad
- Todo corre en tu dispositivo; no hay analítica ni rastreadores.
- Tu llave de IA se guarda únicamente en **tu** navegador (localStorage) o en **tu** servidor — nunca se envía a ningún otro lugar.
- Nunca subas tu llave de IA a GitHub: la llave vive solo en tu navegador.

## 📄 Licencia
[MIT](LICENSE) — úsalo, compártelo y mejóralo libremente.

---

Hecho con 💜 para estudiantes de Ecuador y el mundo.
