# Zami AI Studio — Documentación Técnica v8 AION + Gemini Body

## REGLA ABSOLUTA — COMANDOS SIEMPRE COMPLETOS

**NUNCA entregues un comando sin el `cd` correcto primero.**
La carpeta del proyecto es `C:\Users\LENOVO\zami-ai-studio-dev`.
Cada vez que des un comando git, bat o node — SIEMPRE incluye el cd al inicio:

```
cd C:\Users\LENOVO\zami-ai-studio-dev
git pull --ff-only
.\iniciar.bat
```

Si el usuario está en otra carpeta y ejecuta solo `git pull` o `.\iniciar.bat`, falla. Siempre entrega el bloque completo.

---

## INICIO DE SESIÓN — leer primero

Cuando el usuario diga **"vamos a trabajar"**, **"iniciemos"**, **"empecemos"**, **"start"** o cualquier frase de apertura, responde EXACTAMENTE con esto sin preguntar nada:

```
cd C:\Users\LENOVO\zami-ai-studio-dev
git pull --ff-only
.\iniciar.bat
```

Luego di: **"Abre http://127.0.0.1:3333 en el browser."**

No pidas confirmación. No preguntes por el .env. No expliques nada más.

---

## QUÉ ES ESTE PROYECTO

Automatización para crear influencers virtuales con IA — cualquier etnia, cualquier nicho.
El usuario configura el rostro manualmente vía AION (imágenes de referencia + parámetros hiperpersonalizados) y la IA genera el cuerpo y el perfil de personalidad.

**Stack operativo:**
- `server.cjs` — servidor Node.js local, cerebro de toda la automatización (usa solo módulos nativos, sin npm install)
- `server-ui.html` — interfaz visual en el browser (todo en un solo HTML)
- `iniciar.bat` — lanzador Windows
- `.env` — variables de entorno (nunca commitear)
- `data/influencers.json` — persistencia local de influencers y su historial de semanas
- `Foto inicio/Nano Banana Pro_00001_.png` — foto fija de la modelo del hero (sirve en `/hero-photo.png`)

**Carpeta local:** `C:\Users\LENOVO\zami-ai-studio-dev`
**Repositorio GitHub:** `https://github.com/Se7en198/zami-ai-studio-dev`
**Rama estable:** `main`

**Sincronizar cambios:**
```
cd C:\Users\LENOVO\zami-ai-studio-dev
git pull --ff-only
```
**Publicar cambios a GitHub:**
```
cd C:\Users\LENOVO\zami-ai-studio-dev
git add -p
git commit -m "descripción del cambio"
git push origin HEAD
```

---

## DISEÑO UI — SISTEMA VISUAL v7

### Identidad visual
- **Color acento:** Acid Lime `#C8FF00` — reemplazó fuchsia `#FF0080` en v7
- **Color hover/dark:** `#a8d900` (lime más oscuro para estados hover)
- **Fondo base:** `#0A0A0A` (casi negro)
- **Superficie cards:** `#161616`
- **Superficie 2:** `#111111`
- **Tipografía display:** `Bebas Neue` (Google Fonts CDN) — headings, tabs, botones CTA
- **Tipografía cuerpo:** system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI'`)

### Design tokens (`:root` en `server-ui.html`)
```css
--c-accent:      #C8FF00
--c-accent-dim:  rgba(200,255,0,0.09)
--c-accent-mid:  rgba(200,255,0,0.22)
--c-accent-glow: rgba(200,255,0,0.14)
--c-bg:          #0A0A0A
--c-surface:     #161616
--c-surface2:    #111111
--c-border:      #2a2a2a
--c-text:        #e8e8e8
--c-muted:       #888888
--c-success:     #4ade80
--c-error:       #f87171
--shadow-card:   0 2px 8px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)
--transition-spring: 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)
```

⚠️ **Regla de contraste:** todos los botones con fondo `#C8FF00` deben tener `color: #000`. Lime sobre blanco falla WCAG. Aplica a: `#btn-main`, `.btn-nueva`, `.btn-seleccionar-inf`, `.btn-generate-week`, `.mode-tab.active`.

### Layout principal
- **Dos columnas:** sidebar 260px fijo (izquierda) + workspace flex:1 scrollable (derecha)
- **Sidebar:** logo ZAMMY GIRLS, grid de influencer cards (3 columnas), botón `+ NUEVA INFLUENCER` lime full-width al fondo
- **Workspace:** heading Bebas Neue, form de creación, progress steps, result section, Fase 4

### Landing Hero
- Pantalla completa fija (`z-index: 1000`) — visible al cargar, se desvanece al hacer clic en "Crear influencer"
- Fondo: `#C8FF00` (Acid Lime)
- Texto de fondo: "ZAMMY" / "GIRLS" en Bebas Neue 34vw negro
- Foto centrada: servida desde `/hero-photo.png` → `Foto inicio/Nano Banana Pro_00001_.png`
- Botón CTA: negro con texto lime, bottom-right
- Constante JS: `const HERO_PHOTO_URL = '/hero-photo.png'`

### Formulario de creación (orden de campos v7)
```
1. TIPO DE FOTO   ← primero, full-width, default: "Studio 2×2 multi-view grid"
2. NOMBRE | NICHO ← two-col
3. Mode tabs      ← Creación Manual | ✦ Crear con Claude
4. Toggles (Manual) o Textarea (Claude)
5. Botón GENERAR
```

---

## CÓMO FUNCIONA EL SERVIDOR

`iniciar.bat` mata cualquier proceso Node previo (`taskkill`) y lanza `node server.cjs`.
El browser abre `http://127.0.0.1:3333` — siempre IPv4, nunca `localhost`.
El servidor lee `.env` automáticamente al arrancar. No necesita `npm install`.

**Smoke test seguro:** la UI y `/hero-photo.png` pueden probarse sin gastar APIs. Las rutas de generación, upload y contenido llaman servicios externos y requieren `.env` real.

### Ruta estática especial
```
GET /hero-photo.png
→ Lee y sirve: Foto inicio/Nano Banana Pro_00001_.png
   Cache-Control: public, max-age=86400
```
Esta ruta fue agregada en v6 para evitar usar URLs externas de S3 como foto del hero.

### Pipeline AION v8 — Fase 1: Generación Unificada Rostro + Cuerpo

Un solo run de ComfyDeploy genera **simultáneamente** el rostro (AION, nodo 66) y el cuerpo (GeminiImage2Node, nodo 655). El output del nodo AION se conecta directamente como input del nodo Gemini body — no hay segundo deployment ni segunda llamada.

**Nodos clave del workflow:**
- **Nodo 66** — `AionThetaNode`: genera el rostro
- **Nodo 655** — `GeminiImage2Node`: genera el cuerpo usando la salida del nodo 66 como imagen de referencia
- **Nodo 14** — `SaveImage` con prefijo `"Nano Banana Pro"`: guarda imagen del rostro
- **Nodo 651** — `SaveImage` con prefijo `"ComfyUI"` (del nodo 652): guarda imagen del cuerpo
- **Nodo 650** — input externo `prompt_body`: texto que controla qué cuerpo genera Gemini

**Detección de face_url vs body_url en `/api/status`:**
El prefijo `"Nano Banana Pro"` se URL-encoda como `Nano%20Banana%20Pro` en la URL S3, haciendo fallar regex. La detección correcta usa `includes('ComfyUI')` — ese prefijo no tiene espacios y nunca se encoda:
```js
const body_url = images.find(u => u.includes('ComfyUI')) || null
const face_url = images.find(u => !u.includes('ComfyUI')) || images[0] || null
```

La UI tiene un tab switcher con **dos modos de creación**. Ambos comparten los campos tipo de foto (primero), nombre y nicho. La UI muestra 4 pasos animados.

**Default de `photo_type` en UI:** `"Studio 2x2 portrait multi-view grid"` (preseleccionado desde v7)

#### Modo A — Creación Manual (tab "Creación Manual")

El usuario configura parámetros directamente y hace clic en **"Generar Rostro AION"**:

```
PASO 1 — Preparando parámetros (Modo Manual)
  Browser: POST /api/generate-face {
    photo_type,           ← siempre requerido
    nombre, nicho,        ← para generar prompt_body
    images: {             ← solo si toggle A está ON (9 slots)
      eyes, eyebrows, nose, lips, forehead,
      jawline, hairline, skin, full_face
    },
    params: {             ← solo si toggle B está ON (43 face params)
    },
    body_params: {        ← solo si toggle B está ON y se seleccionaron body params (15 params)
      body_type, height_build, bust_size, waist_definition, shoulder_width,
      hip_width, glute_shape, waist_hip_ratio,
      thigh_shape, leg_length, leg_shape, calf_shape,
      body_skin_tone_match, body_skin_detail, body_skin_reflection
    },
    body_description: "", ← texto libre opcional para el cuerpo
    prompt: "..."         ← solo si toggle C está ON
  }
  Server:  Si hay body_params o body_description → Claude genera prompt_body (BODY_EXPERT_SYSTEM_PROMPT, max_tokens 300)
           POST ComfyDeploy /api/run/deployment/queue
           deployment_id: c6e6b7f0-e574-4aa8-9012-54e8507202e2
           inputs: { photo_type, "imagen final": "Nano Banana Pro", ...face_params, prompt_body?, ...images, prompt? }
           ⚠️  El mismo run incluye AION (rostro, nodo 66) + Gemini body (nodo 655) — salida directamente conectada
  Browser: polling GET /api/status/:runId cada 8s
  Result:  { face_url, body_url } — ambas identificadas por prefijo de filename

PASO 2 — Generando rostro y cuerpo
  Browser: pollForBoth(runId) — polling hasta success (~2-5 min, timeout 10 min)
  Result:  face_url y body_url mostradas simultáneamente en slots separados (Rostro | Cuerpo)

PASO 3 — Resultado listo (automático al completar paso 2)

PASO 4 — Perfil AI Persona
  Browser: POST /api/generate-persona { nombre, nicho, face_url, body_url }
  Server:  POST Anthropic /v1/messages — Claude recibe ambas imágenes + template en español
  Result:  perfil completo en texto → renderizado como profile card editable
```

#### Modo B — Creación con Claude (tab "✦ Crear con Claude")

El usuario escribe una descripción en lenguaje natural y opcionalmente adjunta imágenes de referencia para Claude (hasta 4). Claude analiza todo, selecciona los 43 parámetros AION + genera el `prompt_body` del cuerpo en un solo JSON, y dispara la generación automáticamente. El botón muestra **"✦ Generar con Claude"**.

```
PASO 1 — Claude elige params de rostro + genera prompt_body
  Browser: POST /api/claude-guided-face {
    description: "mujer francesa, labios carnosos, ojos azules...",
    photo_type:  "Studio 2x2 portrait multi-view grid",
    nombre, nicho,
    reference_images: [           ← opcional, hasta 4 imágenes
      { type: "image/jpeg", data: "<base64>" }
    ]
  }
  Server:  POST Anthropic /v1/messages
           system: AION_EXPERT_SYSTEM_PROMPT (experto en 43 face params + prompt_body)
           content: [ ...imágenes base64..., nicho, descripción ]
           Claude devuelve JSON con 43 face params + "prompt_body" (44 campos total)
           Destructuring: const { prompt_body: promptBody, ...faceParams } = allParams
  Server:  POST ComfyDeploy /api/run/deployment/queue
           deployment_id: c6e6b7f0-e574-4aa8-9012-54e8507202e2
           inputs: { photo_type, "imagen final": "Nano Banana Pro", ...faceParams, prompt_body }
  Server:  devuelve { runId, selected_params: faceParams, prompt_body: promptBody }
  Browser: renderClaudeParamsSummary(selected_params, prompt_body)
           — muestra grid de params + sección "Body prompt:" con texto completo

PASO 2 — Generando rostro y cuerpo (polling run único)
  Browser: pollForBoth(r1.runId, 2) cada 8s
  Result:  face_url + body_url → ambas mostradas al completar

PASO 3 — Resultado listo (automático)

PASO 4 — Perfil AI Persona (igual al Modo Manual)
```

**Diferencia clave de las imágenes de referencia en Modo B:**
- Son para Claude únicamente — Claude las analiza y extrae rasgos para elegir params
- Se envían como base64 directo al API de Anthropic (NO se suben a Supabase)
- NO se pasan a los ExternalImage slots del workflow AION
- Son distintas a las imágenes de referencia del Toggle A (Modo Manual)

**AION_EXPERT_SYSTEM_PROMPT** — hardcodeado en `server.cjs`, contiene:
- Los 43 face params con sus opciones exactas
- Las instrucciones para generar `prompt_body` como **campo 44** del JSON de respuesta
- El nicho se pasa en el mensaje del usuario para que Claude infiera el cuerpo apropiado
- Regla: defects group siempre "none" salvo que el usuario pida lo contrario
- Regla: nunca usar "auto" — siempre elegir el mejor valor disponible
- Output: JSON con 44 campos. Ejemplo: `{"sex":"female","ethnicity":"Latin American",...,"prompt_body":"A photorealistic full-body portrait..."}`

**BODY_EXPERT_SYSTEM_PROMPT** — hardcodeado en `server.cjs`, para Modo Manual:
- Recibe los 15 body params + nicho + nombre
- Genera un prompt en inglés de **120–150 palabras** para el nodo `GeminiImage2Node`
- Fondo blanco puro (#FFFFFF), iluminación high-key sin sombras, plano completo head-to-toe
- Outfit: bodysuit blanco o swimwear nude — solo para revelar proporciones, sin accesorios ni patrones
- NO describe cara, NO escena, NO contexto — solo proporciones corporales anatómicas
- Usado en `/api/generate-face` cuando hay `body_params` o `body_description` en el request
- `max_tokens: 300`
- Output: texto plano sin markdown, sin etiquetas, sin explicación

### Función `generateBodyPromptFromParams(nombre, nicho, bodyParams, bodyDescription)`

```js
// En server.cjs
// Llama a Claude con BODY_EXPERT_SYSTEM_PROMPT
// Retorna: string (el prompt_body en inglés, 120-150 palabras)
// max_tokens: 300
// Modelo: ANTHROPIC_MODEL (claude-sonnet-4-6)
```

### Upload de imágenes de referencia (Toggle A — Modo Manual)

El workflow AION usa `ExternalImage (ComfyUI Deploy)` nodes conectados directamente al `AionThetaNode`. Cuando se manda una URL, AION la usa. Cuando no se manda, el input es `None` y AION lo ignora nativamente.

```
Browser: FileReader → base64
Browser: POST /api/upload-image { name, data: "<base64>", type: "image/jpeg" }
Server:  decodifica base64 → buffer binary → POST Supabase Storage REST API
         /storage/v1/object/zami-images/refs/{timestamp}-{name}.{ext}
         Authorization: Bearer {VITE_SUPABASE_ANON_KEY}
         x-upsert: true
Server:  returns { url: "https://{SUPABASE_URL}/storage/v1/object/public/zami-images/refs/..." }
Browser: guarda url en uploadedImages[slotId]
```

### Fase 4 — Contenido UGC Semanal

```
FASE 4 — Contenido Semanal (se repite cada semana por cada influencer)
  Usuario: selecciona influencer del panel → clic "Generar Plan Semanal"

  Paso A — Plan semanal:
    Browser: POST /api/generate-content-plan { persona, nombre, nicho, face_url, body_url, week_history }
    Server:  POST Anthropic /v1/messages
             Claude recibe AI Persona + historial de semanas previas + imágenes
             Genera autónomamente el tema de la semana y 5 días de contenido
             Cada día: escena, caption, hashtags, 4 variaciones de prompt (inglés, 80-120 palabras c/u)
    Result:  JSON con theme, summary, week[5 días × 4 variaciones]

  Paso B — Imágenes:
    Usuario: edita prompts si quiere → clic "Generar Semana Completa"
    Browser: POST /api/generate-content-day { face_url, body_url, prompts[4] } × 5 días en paralelo
    Server:  POST ComfyDeploy /api/run/deployment/queue × 5 runs simultáneos
             deployment_id: 8d4702cb-c504-4bf2-8284-ee17d6e66633
    Browser: polling cada run hasta success → muestra 4 imágenes por día (20 total)

  Paso C — Guardar semana:
    Browser: POST /api/influencers/:id/weeks { theme, summary, plan }
    Server:  Agrega semana al historial en data/influencers.json
```

---

## AION — PARÁMETROS Y MODOS

### Workflow deployment AION + Gemini Body (run unificado)
- **Deployment ID:** `c6e6b7f0-e574-4aa8-9012-54e8507202e2`
- **Input `imagen final`:** siempre hardcodeado como `"Nano Banana Pro"` (prefijo del archivo de output SaveImage nodo 14)
- **Input `photo_type`:** siempre enviado; UI default desde v7: `"Studio 2x2 portrait multi-view grid"`
- **Input `prompt_body`:** texto para el nodo `GeminiImage2Node` (nodo 650 external input) — opcional, si se omite Gemini usa defaults internos

### Arquitectura del workflow (v4 ExternalImage + Gemini body)
El workflow usa nodos `ExternalImage (ComfyUI Deploy)` conectados directamente al `AionThetaNode` (nodo 66). La **salida del nodo 66** se conecta directamente como input de imagen al `GeminiImage2Node` (nodo 655) — no hay segundo deployment. Los dos `SaveImage` (nodos 14 y 651) guardan el rostro y el cuerpo respectivamente con prefijos distintos.

### Modos del nodo AION
- **auto_detect** — cuando se proveen imágenes de referencia (Toggle A ON)
- **manual_select** — cuando se proveen COMBO params (Toggle B ON)
- **generate_new** — cuando solo se provee prompt de texto (Toggle C ON)

### Toggle A — 9 slots de imágenes de referencia
Los slots se incluyen en el payload solo si tienen URL subida. Keys del objeto `images`:
```
eyes, eyebrows, nose, lips, forehead, jawline, hairline, skin, full_face
```
Cada imagen se sube a Supabase antes de enviarse a ComfyDeploy.

### Toggle B — 43 COMBO params (rostro) + 15 body params (cuerpo)

**Face params (43):** Grupos Demographics, Eyes, Eyebrows, Nose, Lips, Structure, Volumes, Hair, Skin, Defects, Expression.
IDs en UI: `param-{name}` (ej: `param-sex`, `param-ethnicity`).
Se incluyen en el payload solo si el toggle B está ON. Si OFF, las keys se omiten.

**Body params (15) — `BODY_PARAM_OPTIONS` en `server.cjs`:**

| Grupo | Param | IDs en UI |
|---|---|---|
| Figura | `body_type`, `height_build` | `bodyparam-body_type`, `bodyparam-height_build` |
| Busto / Cintura | `bust_size`, `waist_definition`, `shoulder_width` | `bodyparam-bust_size`, etc. |
| Caderas / Glúteos | `hip_width`, `glute_shape`, `waist_hip_ratio` | `bodyparam-hip_width`, etc. |
| Piernas | `thigh_shape`, `leg_length`, `leg_shape`, `calf_shape` | `bodyparam-thigh_shape`, etc. |
| Piel corporal | `body_skin_tone_match`, `body_skin_detail`, `body_skin_reflection` | `bodyparam-body_skin_tone_match`, etc. |

Opciones default: `"auto"` — si el valor es `"auto"`, se excluye del payload (no se envía al servidor).
Seleccionar uno o más body params → el servidor llama `generateBodyPromptFromParams()` → `prompt_body` va al run.

### Toggle C — Prompt libre
Texto libre que describe el rostro. Se incluye solo si toggle C está ON y hay texto escrito.

---

## API CALLS — FORMATO EXACTO

### ComfyDeploy — AION + Gemini Body (run unificado)
```
POST https://api.comfydeploy.com/api/run/deployment/queue
Authorization: Bearer {VITE_COMFYDEPLOY_API_KEY}
Content-Type: application/json

{
  "deployment_id": "c6e6b7f0-e574-4aa8-9012-54e8507202e2",
  "inputs": {
    "photo_type": "Studio 2x2 portrait multi-view grid",
    "imagen final": "Nano Banana Pro",
    "prompt_body": "...",          ← si hay body_params o body_description (Modo Manual)
                                     o si Claude lo generó (Modo Claude)
    "prompt": "...",              ← solo si toggle C ON (Modo Manual)
    "eyes": "https://...",        ← solo si toggle A ON y slot tiene imagen
    "eyebrows": "https://...",
    "nose": "https://...",
    "lips": "https://...",
    "forehead": "https://...",
    "jawline": "https://...",
    "hairline": "https://...",
    "skin": "https://...",
    "full_face": "https://...",
    "sex": "female",              ← solo si toggle B ON (face params)
    "ethnicity": "...",
    ... (hasta 43 COMBO face params)
  }
}
→ { "run_id": "xxx" }
```

### ComfyDeploy — Polling y detección de imágenes
```
GET https://api.comfydeploy.com/api/run/{run_id}
→ { "status": "queued|running|started|uploading|success|failed|cancelled|timeout",
    "outputs": [...] }

Cuando status === "success":
  images = extractImages(data.outputs)   ← extrae todas las URLs de imagen
  body_url = images.find(u => u.includes('ComfyUI'))     ← prefijo nodo 651
  face_url = images.find(u => !u.includes('ComfyUI'))    ← prefijo nodo 14 (Nano Banana)
  Respuesta: { status: 'success', images, face_url, body_url }

⚠️ NO usar regex /nano.banana/i — el prefijo "Nano Banana Pro" se URL-encoda como Nano%20Banana
   Usar includes('ComfyUI') que nunca se encoda.

Estados terminales: success, failed, cancelled, timeout
Polling cada 8 segundos.
```

### Supabase Storage — Upload imagen
```
POST https://vtyuylgfjvleywupbdzl.supabase.co/storage/v1/object/zami-images/refs/{filename}
Authorization: Bearer {VITE_SUPABASE_ANON_KEY}
Content-Type: {image/jpeg|image/png|image/webp}
x-upsert: true
Body: binary buffer

→ { "Key": "zami-images/refs/{filename}" }
Public URL: https://vtyuylgfjvleywupbdzl.supabase.co/storage/v1/object/public/zami-images/refs/{filename}
```

**Bucket:** `zami-images` — público, policy `FOR ALL TO anon`.

### Anthropic — Claude-guided face (selección de params AION + prompt_body)
```
POST https://api.anthropic.com/v1/messages
{ "model": "claude-sonnet-4-6", "max_tokens": 1500,
  "system": "<AION_EXPERT_SYSTEM_PROMPT>",
  "messages": [{ "role": "user", "content": [ ...reference_images_base64..., { "type": "text", "text": description } ] }] }
→ JSON puro con 44 campos: 43 face params + "prompt_body"
```

### Anthropic — Body Prompt (Modo Manual con body_params)
```
POST https://api.anthropic.com/v1/messages
{ "model": "claude-sonnet-4-6", "max_tokens": 300,
  "system": "<BODY_EXPERT_SYSTEM_PROMPT>",
  "messages": [{ "role": "user", "content": "<nombre, nicho, body_params seleccionados>" }] }
→ Texto plano: prompt de 120–150 palabras para GeminiImage2Node
```

### Anthropic — AI Persona
```
POST https://api.anthropic.com/v1/messages
{ "model": "claude-sonnet-4-6", "max_tokens": 4000,
  "messages": [{ "role": "user", "content": [
    { "type": "image", "source": { "type": "url", "url": "<face_url>" } },
    { "type": "image", "source": { "type": "url", "url": "<body_url>" } },
    { "type": "text", "text": "<template en español con 12 secciones>" }
  ]}] }
```

### Anthropic — Plan Semanal
```
POST https://api.anthropic.com/v1/messages
{ "model": "claude-sonnet-4-6", "max_tokens": 8000,
  "messages": [{ "role": "user", "content": [
    { "type": "image", "source": { "type": "url", "url": "<face_url>" } },
    { "type": "image", "source": { "type": "url", "url": "<body_url>" } },
    { "type": "text", "text": "<AI Persona + historial + instrucciones>" }
  ]}] }
→ JSON: { theme, summary, week[5] } — cada día: scene, caption, hashtags, variations[4]
```

### ComfyDeploy — Fase 4 UGC
```
{ "deployment_id": "8d4702cb-c504-4bf2-8284-ee17d6e66633",
  "inputs": {
    "prompt 1": "...", "input_image 1": "<face>", "input_image 2": "<body>", "filename_prefix 1": "ComfyUI",
    "prompt 2": "...", "input_image 3": "<face>", "input_image 4": "<body>", "filename_prefix 2": "ComfyUI",
    "prompt 3": "...", "input_image 5": "<face>", "input_image 6": "<body>", "filename_prefix 3": "ComfyUI",
    "prompt 4": "...", "input_image 7": "<face>", "input_image 8": "<body>", "filename_prefix 4": "ComfyUI"
  } }
```

---

## ENDPOINTS DEL SERVIDOR LOCAL

| Método | Ruta | Body | Descripción |
|---|---|---|---|
| `GET` | `/` | — | Sirve server-ui.html |
| `GET` | `/hero-photo.png` | — | Sirve `Foto inicio/Nano Banana Pro_00001_.png` (hero fija) |
| `POST` | `/api/upload-image` | `{ name, data: base64, type }` | Sube imagen a Supabase Storage → `{ url }` |
| `POST` | `/api/generate-face` | `{ photo_type, nombre, nicho, images?, params?, body_params?, body_description?, prompt? }` | AION + Gemini body — Modo Manual → `{ runId, prompt_body }` |
| `POST` | `/api/claude-guided-face` | `{ description, photo_type, nombre, nicho, reference_images? }` | Claude elige 44 params → AION + Gemini body — Modo Claude → `{ runId, selected_params, prompt_body }` |
| `POST` | `/api/generate-body-prompt` | `{ nombre, nicho, face_description }` | Claude genera prompt de cuerpo (legacy, no usado en flujo principal) |
| `POST` | `/api/generate-body` | `{ prompt, input_image }` | Genera cuerpo en ComfyDeploy (legacy, no usado en flujo principal) |
| `POST` | `/api/generate-persona` | `{ nombre, nicho, face_url, body_url }` | Claude genera AI Persona |
| `GET` | `/api/status/:runId` | — | Polling ComfyDeploy → `{ status, images, face_url, body_url }` |
| `GET` | `/api/influencers` | — | Lista influencers guardadas |
| `POST` | `/api/influencers` | `{ nombre, nicho, face_url, body_url, persona }` | Guarda influencer |
| `POST` | `/api/influencers/:id/weeks` | `{ theme, summary, plan }` | Guarda semana |
| `POST` | `/api/generate-content-plan` | `{ persona, nombre, nicho, face_url, body_url, week_history }` | Plan semanal |
| `POST` | `/api/generate-content-day` | `{ face_url, body_url, prompts[4] }` | 1 run → 4 imágenes UGC |

---

## ARCHIVOS DEL PROYECTO

| Archivo | Función |
|---|---|
| `server.cjs` | Servidor local — pipeline completo + ruta `/hero-photo.png` |
| `server-ui.html` | UI completa — hero, studio, 3 toggles, 43 face params + 15 body params, Fase 4 |
| `iniciar.bat` | Lanzador Windows (taskkill + node server.cjs) |
| `.env` | Variables de entorno (NO commitear) |
| `.env.example` | Template de variables |
| `data/influencers.json` | Persistencia local de influencers y semanas |
| `Foto inicio/Nano Banana Pro_00001_.png` | Foto fija del hero landing (modelo principal) |
| `CLAUDE.md` | Esta documentación |

---

## VARIABLES DE ENTORNO (`.env`)

```env
# REQUERIDAS
VITE_COMFYDEPLOY_API_KEY=
ANTHROPIC_API_KEY=

# DEPLOYMENT IDs activos
VITE_COMFYDEPLOY_AION_DEPLOYMENT_ID=c6e6b7f0-e574-4aa8-9012-54e8507202e2   # AION rostro + Gemini cuerpo (run unificado)
VITE_COMFYDEPLOY_BODY_DEPLOYMENT_ID=cabf22a3-a697-485c-a6df-b6c09ee4f2f1   # legacy, no usado en flujo principal
VITE_COMFYDEPLOY_CONTENT_DEPLOYMENT_ID=8d4702cb-c504-4bf2-8284-ee17d6e66633

# Supabase Storage
VITE_SUPABASE_URL=https://vtyuylgfjvleywupbdzl.supabase.co
VITE_SUPABASE_ANON_KEY=
SUPABASE_BUCKET=zami-images

# PENDIENTES fases futuras
VITE_COMFYDEPLOY_NSFW_DEPLOYMENT_ID=
VITE_FAL_API_KEY=
```

---

## ESTADO DEL PIPELINE

| Fase | Nombre | Motor | Estado |
|---|---|---|---|
| 1a | Generación Rostro + Cuerpo — Modo Manual | ComfyDeploy `c6e6b7f0` (AION nodo 66 + Gemini nodo 655) | ✅ Operativo |
| 1b | Generación Rostro + Cuerpo — Modo Claude | Anthropic `claude-sonnet-4-6` + ComfyDeploy `c6e6b7f0` | ✅ Operativo |
| 2 | Prompt de Cuerpo (Modo Manual) | Anthropic `claude-sonnet-4-6` (`BODY_EXPERT_SYSTEM_PROMPT`) | ✅ Operativo |
| 3 | Generación de Cuerpo | Integrado en `c6e6b7f0` (Gemini body nodo 655) | ✅ Operativo |
| 4 | Perfil AI Persona | Anthropic `claude-sonnet-4-6` | ✅ Operativo |
| Fase 4 | Contenido UGC Semanal | Claude + ComfyDeploy `8d4702cb` | ✅ Operativo |
| Fase 5 | Publicación | Por definir | ⏳ Pendiente |
| Fase 6 | KPIs | Supabase | ⏳ Pendiente |

---

## SUPABASE — SETUP BUCKET

Bucket `zami-images` en `https://supabase.com/dashboard/project/vtyuylgfjvleywupbdzl/storage/buckets`
- Tipo: **Public**
- Policy: `FOR ALL TO anon`

Si hay que recrear:
```sql
DROP POLICY IF EXISTS "anon all zami-images" ON storage.objects;
CREATE POLICY "anon all zami-images" ON storage.objects
FOR ALL TO anon
USING (bucket_id = 'zami-images')
WITH CHECK (bucket_id = 'zami-images');
```

---

## PROMPT DEL NODO COMFYDEPLOY — Fase 4 (deployment `8d4702cb`)

```
You are a professional UGC content photography engine for AI influencer accounts. You ALWAYS generate an image — never text, never explanations.

INPUT:
You receive TWO reference images and ONE creative prompt.
— Reference Image 1: face of the influencer
— Reference Image 2: full-body shot of the influencer
— Creative prompt: describes the exact scene, outfit, pose, location, and shot type for this image

REFERENCE USAGE — READ THIS CAREFULLY:
The reference images are NOT templates to clone. They are biological passports.

From the FACE reference → extract and lock: bone structure, exact skin tone (match hex-level accuracy), eye shape and color, nose bridge and tip shape, lip shape and fullness, jawline, brow shape, hair color and texture, approximate age and ethnicity. This face must appear in the output identically.

From the BODY reference → extract and lock: figure proportions (height-to-width ratio), waist-to-hip ratio, bust size, leg length, skin tone continuity from neck to toe. DO NOT replicate the outfit, background, or any clothing from this image. It exists only to give you body proportions.

OUTFIT PROTOCOL — NON-NEGOTIABLE:
The creative prompt dictates the outfit. NEVER default to the outfit visible in the body reference image.
All outfits must be form-fitting, body-conscious, and sexy — matching the context of the scene.

PHOTOGRAPHY STYLE — UGC PHONE REALISM (MANDATORY):
Device simulation: iPhone 15 Pro or Samsung Galaxy S24 Ultra Portrait mode.
Grain, imperfect focus, motion blur, lens flare, slight overexposure, warm-neutral color grade, off-center composition. These are features, not mistakes.

FINAL OUTPUT:
ONE photograph. Portrait orientation. Instagram-ready. Sexy, real, aspirational.
```

---

## DECISIONES TÉCNICAS IMPORTANTES

- **Run unificado rostro + cuerpo** — deployment `c6e6b7f0` incluye AION (nodo 66) + GeminiImage2Node (nodo 655) en el mismo run. La salida de AION se conecta internamente como referencia de Gemini. No hay segundo deployment.
- **URL detection por prefijo** — `"ComfyUI"` (nodo 651, cuerpo) no tiene espacios, nunca se URL-encoda. `"Nano Banana Pro"` (nodo 14, rostro) se encoda como `Nano%20Banana%20Pro`. La detección usa `includes('ComfyUI')` — nunca regex sobre el prefijo del rostro.
- **15 body params opcionales** — se recolectan de `bodyparam-{name}` selects en Toggle B. Si el valor es `"auto"`, se excluye del payload. Si hay al menos uno seleccionado, el servidor llama `generateBodyPromptFromParams()` para generar `prompt_body`.
- **BODY_EXPERT_SYSTEM_PROMPT** — enfocado en fondo blanco puro, plano completo head-to-toe, solo proporciones anatómicas. 120–150 palabras. El outfit es bodysuit blanco o swimwear nude — solo para revelar el cuerpo.
- **AION_EXPERT_SYSTEM_PROMPT devuelve 44 campos** — 43 face params + `prompt_body` (campo 44). El nicho infiere el tipo de cuerpo apropiado (fitness=atlético, gamer=curvy soft, fashion=hourglass).
- **Dos modos de Fase 1** — Manual (3 toggles) y Claude-guided (descripción natural + imágenes para Claude).
- **Modo Claude: images solo para Anthropic** — Las imágenes de referencia del modo Claude van en base64 directo a la API de Anthropic, NO a Supabase ni a AION.
- **ExternalImage nodes directos** — el workflow AION v4 conecta `ExternalImage` directo al `AionThetaNode`. Sin `LoadImage` hardcodeados. Input `None` = AION lo ignora.
- **Toggle = omit** — cuando un toggle está OFF, esas keys se omiten del payload completamente.
- **Upload Supabase antes de ComfyDeploy** — imágenes de referencia van a Supabase primero, luego URL pública a ComfyDeploy.
- **`imagen final` hardcodeado** — siempre `"Nano Banana Pro"`.
- **9 image slots** — `eyes, eyebrows, nose, lips, forehead, jawline, hairline, skin, full_face`.
- **`iniciar.bat` hace `taskkill`** — mata proceso Node previo antes de arrancar.
- **Polling cada 8 segundos, timeout 10 min** — `pollForBoth()` en la UI.
- **Fase 4: 1 run = 4 imágenes** — 5 runs en paralelo = 20 imágenes totales.
- **No necesita npm install** — `server.cjs` usa solo módulos nativos de Node.js.
- **Hero photo local** — `/hero-photo.png` se sirve desde `Foto inicio/Nano Banana Pro_00001_.png`. Si la carpeta o el archivo no existe, el endpoint devuelve 404 y el hero muestra el placeholder.
- **Lime sobre negro** — todos los botones con fondo `#C8FF00` deben tener `color: #000` explícito. Nunca `color: #fff` sobre lime.
- **CSS cascade limpia** — cada selector tiene UNA sola regla definitiva. No duplicar `.mode-tab`, `.btn-nueva`, `label` etc.
- **`/api/generate-body` y `/api/generate-body-prompt` son legacy** — siguen en el servidor como fallback pero no se llaman desde el flujo principal.

---

## TROUBLESHOOTING

**Error "Not found" en rutas:** El proceso node viejo sigue corriendo. Correr `.\iniciar.bat` de nuevo.

**Ambas imágenes muestran el cuerpo (no rostro y cuerpo):** La detección face/body usa `includes('ComfyUI')`. Verificar que el `SaveImage` del rostro usa prefijo `"Nano Banana Pro"` y el del cuerpo usa `"ComfyUI"`. Si el workflow cambia esos prefijos, actualizar la lógica en `/api/status/:runId`.

**La imagen de rostro no aparece tras `success`:** Revisar terminal — buscar `OUTPUTS:` y `face_url:` en los logs.

**Body url es null aunque el run tuvo éxito:** Puede que el workflow no esté generando la segunda imagen. Verificar que `prompt_body` llegó al run (buscar en logs `prompt_body` antes del `startAionRun`).

**Hero muestra placeholder en lugar de la modelo:**
- Verificar que existe `Foto inicio/Nano Banana Pro_00001_.png`
- La ruta tiene espacio: `path.join(__dirname, 'Foto inicio', 'Nano Banana Pro_00001_.png')`
- Reiniciar servidor con `.\iniciar.bat`

**Upload falla 403/404:**
- Verificar `VITE_SUPABASE_ANON_KEY` en `.env`
- Verificar bucket `zami-images` público con policy `FOR ALL TO anon`
- Reiniciar servidor tras cambiar `.env`

**ComfyDeploy error en `/api/generate-face`:** Verificar `VITE_COMFYDEPLOY_AION_DEPLOYMENT_ID` en `.env` y deployment `c6e6b7f0` activo.

**El servidor no lee cambios del `.env`:** Siempre `.\iniciar.bat` después de editar `.env`.

**Regla PowerShell:** Siempre `.\iniciar.bat` con `.\` — sin el punto barra falla.

**Botones con texto blanco sobre lime:** Si algún botón nuevo tiene fondo `#C8FF00` y texto blanco, agregar `color: #000` explícito al selector CSS.
