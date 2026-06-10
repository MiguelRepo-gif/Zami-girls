# Zami AI Studio — Documentación Técnica v13 — Pipeline Completo Operativo

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
**Tag estable:** `v1.0-stable`
**Rama activa:** `main`

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

### Pipeline AION v10 — Fase 1: Generación Unificada Rostro + Cuerpo (AionBodyReferenceNode)

Un solo run de ComfyDeploy genera **simultáneamente** el rostro (AION, nodo 66) y el cuerpo (AionBodyReferenceNode, nodo 227). El output del nodo AION se conecta directamente como `face_reference` al nodo de cuerpo — no hay segundo deployment ni segunda llamada.

**Nodos clave del workflow:**
- **Nodo 66** — `AionThetaNode`: genera el rostro
- **Nodo 227** — `AionBodyReferenceNode`: genera el cuerpo usando la salida del nodo 66 como `face_reference`. Acepta 7 enum params directos + `brief_text`
- **Nodo 14** — `SaveImage` con prefijo desde nodo 365 (`"imagen rostro"` = `"Nano Banana Pro"`): guarda imagen del rostro
- **Nodo 228** — `SaveImage` con prefijo desde nodo 353 (`"save_image"` = `"ComfyUI"`): guarda imagen del cuerpo
- **Nodo 354** — input externo `prompt_body`: texto adicional opcional para `brief_text` del AionBodyReferenceNode

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
    nombre, nicho,
    images: {             ← solo si toggle A está ON (9 slots)
      eyes, eyebrows, nose, lips, forehead,
      jawline, hairline, skin, full_face
    },
    params: {             ← solo si toggle B está ON (43 face params)
    },
    body_params: {        ← solo si toggle D está ON y se seleccionaron body params (7 params directos)
      body_type, bust, waist, glutes, hips, legs, shoulders
    },
    body_description: "", ← texto libre opcional → va directo como prompt_body/brief_text
    body_model:       "gemini-3.1-pro-preview",   ← modelo IA del cuerpo
    body_image_model: "Nano Banana Pro (gemini-3-pro-image-preview)",
    body_resolution:  "512px",
    prompt: "..."         ← solo si toggle C está ON
  }
  Server:  body_params → se envían directo como enum inputs al workflow
           body_description → se pasa directo como prompt_body (sin llamada Claude)
           POST ComfyDeploy /api/run/deployment/queue
           deployment_id: e833a575-893b-49f2-8687-4aa5291d31cc
           inputs: { photo_type, "imagen rostro": "Nano Banana Pro", "save_image": "ComfyUI", model, image_model, resolution, ...face_params, ...body_params, prompt_body?, ...images, prompt? }
           ⚠️  El mismo run incluye AION (rostro, nodo 66) + AionBodyReferenceNode (cuerpo, nodo 227)
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
           system: AION_EXPERT_SYSTEM_PROMPT (experto en 43 face params + 7 body params + prompt_body)
           content: [ ...imágenes base64..., nicho, descripción ]
           Claude devuelve JSON con 43 face params + 7 body params + "prompt_body" (51 campos total)
           Destructuring: bodyParamKeys filtra { body_type, bust, waist, glutes, hips, legs, shoulders }
           Server aplica overrides determinísticos desde el texto del usuario:
             curvy/busto grande/trasero grande/caderas/cintura → enums altos o extremos exactos
  Server:  POST ComfyDeploy /api/run/deployment/queue
           deployment_id: e833a575-893b-49f2-8687-4aa5291d31cc
           inputs: { photo_type, "imagen rostro": "Nano Banana Pro", "save_image": "ComfyUI", model, image_model, resolution, ...faceParams, body_type, bust, waist, glutes, hips, legs, shoulders, prompt_body }
           Antes del queue imprime [AION PAYLOAD AUDIT] con deployment_id, photo_type, calidad, prompt_body y los 7 body params exactos.
  Server:  devuelve { runId, selected_params: { ...faceParams, ...bodyParams }, prompt_body: promptBody }
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
- Los 7 body params con sus opciones exactas (body_type, bust, waist, glutes, hips, legs, shoulders)
- Regla: defects group siempre "none" salvo que el usuario pida lo contrario
- Regla: nunca usar "auto" — siempre elegir el mejor valor disponible
- Output: JSON con **51 campos** (43 face + 7 body + `prompt_body`). Ejemplo: `{"sex":"female","ethnicity":"Latin American",...,"body_type":"hourglass figure","bust":"full bust",...,"prompt_body":"Smooth tan skin..."}` (max_tokens: 2000)

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

### Fase 4 — Contenido UGC Semanal (ComfyDeploy)

**Motor:** ComfyDeploy deployment `f9822b81-9ebc-48e2-b39c-0e8034e90554` — 14 slots (8 activos, 6 con prompts reciclados).

```
FASE 4 — 2 semanas automáticas (1 clic)
  Usuario: selecciona influencer del panel → clic "✦ Generar 2 Semanas de Contenido"

  Flujo automático:
    → POST /api/generate-content-plan (semana 1, ~45s)
    → POST /api/generate-content-day (semana 1) → lastContentRunId1
    → POST /api/generate-content-plan (semana 2, historial incluye semana 1)
    → POST /api/generate-content-day (semana 2) → lastContentRunId2
    → Promise.allSettled([pollWeekContentRun(1), pollWeekContentRun(2)])
    → renderWeekImages(imgs, weekNum) al completar cada run
    → toast "Semana N lista" + badge "Listo" + botón "Guardar"

  Paso A — Plan semanal:
    Browser: POST /api/generate-content-plan { persona, nombre, nicho, face_url, body_url, week_history }
    Server:  POST Anthropic /v1/messages
             Claude recibe AI Persona + historial de semanas previas + imágenes
             Genera autónomamente el tema de la semana y 8 piezas de contenido
             Cada pieza: escena, caption, hashtags, prompt (inglés, 80-120 palabras)
             Los prompts respetan los aspect ratios reales de cada slot:
               Slots 1, 2 → 9:16 (Story/Reel vertical)
               Slots 3, 4, 7 → 1:1 (Square)
               Slot 5 → 3:4 (Feed portrait)
               Slots 6, 8 → 4:5 (Feed portrait)
    Result:  JSON con theme, summary, week[8 piezas]

  Paso B — Imágenes (ComfyDeploy):
    Browser: POST /api/generate-content-day { face_url, body_url, prompts[8] }
    Server:  startComfyDeployContentRun(faceUrl, bodyUrl, prompts8)
             1. Construye inputs con 14 slots:
                - Slots 1-8: face_url, body_url, prompts reales de Claude, filename_prefix ZCS1-ZCS8
                - Slots 9-14: face_url, body_url, prompts reciclados (prompts8[0..5]), filename_prefix skip9-skip14
             2. POST api.comfydeploy.com/api/run/deployment/queue
                deployment_id: f9822b81-9ebc-48e2-b39c-0e8034e90554
             3. Devuelve runId = "cdc:" + run_id
    Browser: pollContentRun(runId) — GET /api/status/cdc:{id} cada 8s
    Server:  Cuando success: extractImages(outputs) → filtrar por filename ZCS\d+ → ordenar → 8 URLs
    Browser: muestra 8 imágenes en slots slot-w{N}-1 a slot-w{N}-8

  Paso C — Guardar semana:
    Browser: POST /api/influencers/:id/weeks { theme, summary, plan }
    Server:  Agrega semana al historial en data/influencers.json
```

**IDs de slots en la UI:**
- Semana 1: `slot-w1-1` … `slot-w1-8`, `caption-w1-1` … `caption-w1-8`
- Semana 2: `slot-w2-1` … `slot-w2-8`, `caption-w2-1` … `caption-w2-8`
- Status badges: `#week-status-1`, `#week-status-2` (clases: `wsb-pending/planning/generating/done/error`)
- Save buttons: `#btn-save-week-1`, `#btn-save-week-2`

---

## AION — PARÁMETROS Y MODOS

### Workflow deployment AION + Gemini Body (run unificado)
- **Deployment ID:** `e833a575-893b-49f2-8687-4aa5291d31cc`
- **Input `imagen rostro`:** siempre `"Nano Banana Pro"` (prefijo del archivo de output SaveImage nodo 14)
- **Input `photo_type`:** siempre enviado; UI default: `"Studio 2x2 portrait multi-view grid"`
- **Input `prompt_body`:** texto para el nodo `GeminiImage2Node` — opcional, si se omite Gemini usa defaults internos

### Arquitectura del workflow (v4 ExternalImage + Gemini body)
El workflow usa nodos `ExternalImage (ComfyUI Deploy)` conectados directamente al `AionThetaNode` (nodo 66). La **salida del nodo 66** se conecta directamente como `face_reference` al `AionBodyReferenceNode` (nodo 227) — no hay segundo deployment. Los dos `SaveImage` (nodos 14 y 228) guardan el rostro y el cuerpo respectivamente con prefijos distintos.

### Modos del nodo AION
- **auto_detect** — cuando se proveen imágenes de referencia (Toggle A ON)
- **manual_select** — cuando se proveen COMBO face params (Toggle B ON) o body params (Toggle D ON)
- **generate_new** — cuando solo se provee prompt de texto (Toggle C ON)

### Toggle A — 9 slots de imágenes de referencia
Los slots se incluyen en el payload solo si tienen URL subida. Keys del objeto `images`:
```
eyes, eyebrows, nose, lips, forehead, jawline, hairline, skin, full_face
```
Cada imagen se sube a Supabase antes de enviarse a ComfyDeploy.

### Toggle B — 43 COMBO params (rostro únicamente)

**Face params (43):** Grupos Demographics, Eyes, Eyebrows, Nose, Lips, Structure, Volumes, Hair, Skin, Defects, Expression.
IDs en UI: `param-{name}` (ej: `param-sex`, `param-ethnicity`).
Se incluyen en el payload solo si Toggle B está ON. Si OFF, las keys se omiten.
`sectionState.params` controla este toggle.

### Toggle D — 7 params de cuerpo + descripción libre + 3 calidad

Toggle independiente del Toggle B. IDs en UI: `bodyparam-{name}`.
`sectionState.body` controla este toggle.

**Body params (7 directos):**

| Param | IDs en UI | Grupo |
|---|---|---|
| `body_type` | `bodyparam-body_type` | Cuerpo |
| `bust` | `bodyparam-bust` | Cuerpo |
| `waist` | `bodyparam-waist` | Cuerpo |
| `glutes` | `bodyparam-glutes` | Cuerpo |
| `hips` | `bodyparam-hips` | Cuerpo |
| `legs` | `bodyparam-legs` | Cuerpo |
| `shoulders` | `bodyparam-shoulders` | Cuerpo |

Opciones default: `"auto"` — el servidor envía `"auto"` explícito para cualquier body param no seleccionado.
Textarea `body-description` → pasa directo como `prompt_body` al workflow.

**Regla de payload:** los 7 body params siempre se envían al deployment. Si el usuario no eligió un valor, el servidor manda `"auto"` explícito. Si el texto pide cuerpo curvy/extremo, el servidor fuerza enums altos/extremos antes del queue.

**Payload aprobado en prueba (referencia):**
```json
{
  "body_type": "curvy fuller figure",
  "bust": "massive oversized bust ultra-exaggerated",
  "waist": "very narrow waist extreme hourglass",
  "glutes": "massive oversized glutes ultra-exaggerated",
  "hips": "very wide hips",
  "legs": "full thick thighs",
  "shoulders": "proportionate shoulders"
}
```

**Calidad del motor (3 params):**
| Param | ID en UI | Grupo |
|---|---|---|
| `body_model` | `bodyparam-body_model` | Calidad cuerpo |
| `body_image_model` | `bodyparam-body_image_model` | Calidad cuerpo |
| `body_resolution` | `bodyparam-body_resolution` | Calidad cuerpo |

Estos 3 van a sus propias keys en el payload (`inputs.body_model`, etc.), no a `body_params`.

### Toggle C — Prompt libre
Texto libre que describe el rostro. Se incluye solo si Toggle C está ON y hay texto escrito.

---

## API CALLS — FORMATO EXACTO

### ComfyDeploy — AION + Gemini Body (run unificado)
```
POST https://api.comfydeploy.com/api/run/deployment/queue
Authorization: Bearer {VITE_COMFYDEPLOY_API_KEY}
Content-Type: application/json

{
  "deployment_id": "e833a575-893b-49f2-8687-4aa5291d31cc",
  "inputs": {
    "photo_type": "Studio 2x2 portrait multi-view grid",
    "imagen rostro": "Nano Banana Pro",    ← prefijo SaveImage rostro (nodo 365)
    "save_image": "ComfyUI",              ← prefijo SaveImage cuerpo (nodo 353)
    "model": "gemini-3.1-pro-preview",
    "image_model": "Nano Banana Pro (gemini-3-pro-image-preview)",
    "resolution": "512px",
    "prompt_body": "...",          ← body_description del usuario (Modo Manual) o prompt_body de Claude (Modo Claude)
    "prompt": "...",               ← solo si toggle C ON (Modo Manual)
    "eyes": "https://...",         ← solo si toggle A ON y slot tiene imagen
    ...
    "sex": "female",               ← solo si toggle B ON (face params)
    ...
    "body_type": "hourglass figure",  ← siempre enviado; "auto" si no aplica
    "bust": "full bust",
    "waist": "narrow defined waist",
    "glutes": "full prominent glutes",
    "hips": "wide hips",
    "legs": "long lean legs",
    "shoulders": "proportionate shoulders"
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
  images = extractImages(data.outputs)
  body_url = images.find(u => u.includes('ComfyUI'))
  face_url = images.find(u => !u.includes('ComfyUI')) || images[0] || null

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
→ JSON puro con 51 campos: 43 face params + 7 body params + "prompt_body"
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
→ JSON: { theme, summary, week[8 piezas] }
```

### ComfyDeploy — Fase 4 UGC Content (deployment f9822b81, 14 slots)
```
POST https://api.comfydeploy.com/api/run/deployment/queue
Authorization: Bearer {VITE_COMFYDEPLOY_API_KEY}
{
  "deployment_id": "f9822b81-9ebc-48e2-b39c-0e8034e90554",
  "inputs": {
    "rostro 1": "<face_url>", "cuerpo 1": "<body_url>",
    "prompt contenido 1": "<claude_prompt>", "contenido final 1": "ZCS1",
    ...
    "rostro 8": ..., "cuerpo 8": ..., "prompt contenido 8": ..., "contenido final 8": "ZCS8",
    "rostro 9": ..., "prompt contenido 9": "<recycled>", "contenido final 9": "skip9",
    ... (hasta slot 14)
  }
}
→ { "run_id": "xxx" }

Polling: GET https://api.comfydeploy.com/api/run/{run_id}
Cuando success: extractImages(outputs) → filtrar ZCS\d+ → sort numérico → 8 URLs
RunId prefix: "cdc:" + run_id
```

### ComfyUI Cloud — Fase 4C Sexy (cloud.comfy.org)
```
Upload imágenes:
POST https://cloud.comfy.org/api/upload/image
X-API-Key: {COMFYCLOUD_API_KEY}
Content-Type: multipart/form-data; boundary={boundary}
Body: multipart con image (binary) + type="input"
→ { "name": "upload_xxx.jpg" }

Submit workflow:
POST https://cloud.comfy.org/api/prompt
X-API-Key: {COMFYCLOUD_API_KEY}
{ "prompt": { ...workflow patched... }, "extra_data": { "api_key_comfy_org": COMFYCLOUD_API_KEY } }
→ { "prompt_id": "uuid" }

Polling:
GET https://cloud.comfy.org/api/job/{prompt_id}/status → { "status": "pending|running|completed|failed" }
GET https://cloud.comfy.org/api/jobs/{prompt_id} → { outputs, outputs_count }
GET https://cloud.comfy.org/api/view?filename={hash}&subfolder=&type=output → 302 Location: S3 URL firmada

RunId prefix: "ccsx:" + prompt_id
```

---

## ENDPOINTS DEL SERVIDOR LOCAL

| Método | Ruta | Body | Descripción |
|---|---|---|---|
| `GET` | `/` | — | Sirve server-ui.html |
| `GET` | `/hero-photo.png` | — | Sirve `Foto inicio/Nano Banana Pro_00001_.png` |
| `POST` | `/api/upload-image` | `{ name, data: base64, type }` | Sube imagen a Supabase Storage → `{ url }` |
| `POST` | `/api/generate-face` | `{ photo_type, nombre, nicho, images?, params?, body_params?, body_description?, prompt? }` | AION + Gemini body — Modo Manual → `{ runId, prompt_body }` |
| `POST` | `/api/claude-guided-face` | `{ description, photo_type, nombre, nicho, reference_images? }` | Claude elige 51 params → AION + Gemini body — Modo Claude → `{ runId, selected_params, prompt_body }` |
| `POST` | `/api/generate-persona` | `{ nombre, nicho, face_url, body_url }` | Claude genera AI Persona |
| `GET` | `/api/status/:runId` | — | Routing por prefijo → AION / ComfyDeploy Content / ComfyUI Cloud |
| `GET` | `/api/influencers` | — | Lista influencers guardadas |
| `POST` | `/api/influencers` | `{ nombre, nicho, face_url, body_url, persona }` | Guarda influencer |
| `POST` | `/api/influencers/:id/weeks` | `{ theme, summary, plan }` | Guarda semana |
| `POST` | `/api/generate-content-plan` | `{ persona, nombre, nicho, face_url, body_url, week_history }` | Plan semanal → 8 piezas |
| `POST` | `/api/generate-content-day` | `{ face_url, body_url, prompts[8] }` | 1 run ComfyDeploy f9822b81 → 8 imágenes UGC → `{ runId: "cdc:uuid" }` |
| `POST` | `/api/generate-sexy-from-content` | `{ face_url, body_url, contexto_url }` | ComfyUI Cloud → 10 fotos sexy → `{ runId: "ccsx:uuid" }` |

### Routing de `/api/status/:runId`
```js
if (runId.startsWith('ccsx:')) {
  // → ComfyUI Cloud sexy (cloud.comfy.org): monitor interno + /api/job/{id}/status
  // → { status, sexyImages: [...10 urls], message, ... }
} else if (runId.startsWith('cdc:')) {
  // → ComfyDeploy Content (f9822b81): GET /api/run/{id}
  // → { status: 'running' | 'success' | 'error', contentImages: [...8 urls] }
} else {
  // → ComfyDeploy AION (e833a575): GET /api/run/{runId}
  // → { status, images, face_url, body_url }
}
```

---

## ARCHIVOS DEL PROYECTO

| Archivo | Función |
|---|---|
| `server.cjs` | Servidor local — pipeline completo + ruta `/hero-photo.png` |
| `server-ui.html` | UI completa — hero, studio, 4 toggles (Imágenes · Rostro · Cuerpo · Prompt), 43 face params + 7 body params + 3 calidad, Fase 4 (2 semanas × 8 slots), Fase 4C (10 slots sexy) |
| `iniciar.bat` | Lanzador Windows (taskkill + node server.cjs) |
| `.env` | Variables de entorno (NO commitear) |
| `.env.example` | Template de variables |
| `data/influencers.json` | Persistencia local de influencers y semanas (NO commitear — datos reales) |
| `data/workflow-sexy-contexto.json` | Workflow API format para ComfyUI Cloud — Fase 4C "Más Sexy" |
| `Foto inicio/Nano Banana Pro_00001_.png` | Foto fija del hero landing (modelo principal) |
| `CLAUDE.md` | Esta documentación |

---

## VARIABLES DE ENTORNO (`.env`)

```env
# REQUERIDAS
VITE_COMFYDEPLOY_API_KEY=           # ComfyDeploy — Fases 1 y 4 (rostro + cuerpo + contenido UGC)
ANTHROPIC_API_KEY=                  # Claude — params, persona, plan semanal
ANTHROPIC_MODEL=claude-sonnet-4-6
COMFYCLOUD_API_KEY=                 # ComfyUI Cloud — Fase 4C "Más Sexy" (generar en platform.comfy.org/profile/api-keys)

# DEPLOYMENT IDs ComfyDeploy
VITE_COMFYDEPLOY_AION_DEPLOYMENT_ID=e833a575-893b-49f2-8687-4aa5291d31cc   # AION rostro + AionBodyReferenceNode cuerpo
VITE_COMFYDEPLOY_CONTENT_DEPLOYMENT_ID=f9822b81-9ebc-48e2-b39c-0e8034e90554  # Fase 4 UGC — 14 slots

# Supabase Storage (imágenes de referencia Toggle A)
VITE_SUPABASE_URL=https://vtyuylgfjvleywupbdzl.supabase.co
VITE_SUPABASE_ANON_KEY=
SUPABASE_BUCKET=zami-images
```

---

## ESTADO DEL PIPELINE

| Fase | Nombre | Motor | Estado |
|---|---|---|---|
| 1a | Generación Rostro + Cuerpo — Modo Manual | ComfyDeploy `e833a575` (AION nodo 66 + AionBodyRef nodo 227) | ✅ Operativo |
| 1b | Generación Rostro + Cuerpo — Modo Claude | Anthropic `claude-sonnet-4-6` (51 params) + ComfyDeploy `e833a575` | ✅ Operativo |
| 2 | Body params directos (Modo Manual) | 7 enums directo al workflow, body_description como brief_text | ✅ Operativo |
| 3 | Generación de Cuerpo | Integrado en `e833a575` (AionBodyReferenceNode nodo 227) | ✅ Operativo |
| 4 | Perfil AI Persona | Anthropic `claude-sonnet-4-6` | ✅ Operativo |
| Fase 4 | Contenido UGC — 2 semanas × 8 imágenes (1 clic) | Claude plan ×2 + ComfyDeploy `f9822b81` ×2 (14 slots, 8 usados) | ✅ Operativo |
| Fase 4C | Botón "✦ Más Sexy" por foto — 10 imágenes | ComfyUI Cloud `cloud.comfy.org` + `data/workflow-sexy-contexto.json` | ✅ Operativo |
| Fase 5 | Publicación automática | Por definir | ⏳ Pendiente |
| Fase 6 | KPIs y analytics | Supabase | ⏳ Pendiente |

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

## DECISIONES TÉCNICAS IMPORTANTES

- **Run unificado rostro + cuerpo** — deployment `e833a575` incluye AION (nodo 66) + AionBodyReferenceNode (nodo 227) en el mismo run. La salida de AION se conecta internamente como `face_reference`. No hay segundo deployment.
- **URL detection por prefijo** — `"ComfyUI"` (cuerpo) no tiene espacios, nunca se URL-encoda. `"Nano Banana Pro"` (rostro) se encoda como `Nano%20Banana%20Pro`. La detección usa `includes('ComfyUI')` — nunca regex sobre el prefijo del rostro.
- **4 toggles en Modo Manual** — A: Imágenes de referencia · B: Parámetros de Rostro (43) · D: Parámetros de Cuerpo (7 + calidad) · C: Prompt libre. Toggle B y Toggle D son independientes: `sectionState.params` vs `sectionState.body`.
- **7 body params directos** — siempre van en el payload; si no hay selección, el servidor manda `"auto"` explícito. Van directo al `AionBodyReferenceNode` sin pasar por Claude.
- **`body_description` pasa directo como `prompt_body`** — textarea en Toggle D, va sin procesamiento al campo `brief_text` del nodo 227.
- **AION_EXPERT_SYSTEM_PROMPT devuelve 51 campos** — 43 face params + 7 body params + `prompt_body` (max_tokens: 2000). Incluye INTENSITY MAPPING: palabras como "súper, enorme, ultra" → enums máximos; "grande, curvy" → enums altos.
- **Body param overrides determinísticos** — `server.cjs` analiza el texto del usuario y fuerza los 7 enums del cuerpo cuando detecta: `curvy`, `busto/pechos/tetona/busty`, `trasero/culo/culona/nalgona/booty`, `caderas`, `cintura/hourglass`, `piernas/muslos`.
- **AION PAYLOAD AUDIT** — antes de enviar el run a ComfyDeploy, el servidor imprime `deployment_id`, `photo_type`, `model`, `image_model`, `resolution`, `prompt_body` y los 7 body params finales. Esta es la fuente de verdad.
- **Modo Claude: images solo para Anthropic** — las imágenes de referencia van en base64 directo a la API de Anthropic, NO a Supabase ni a AION.
- **Toggle = omit con excepción de cuerpo** — cuando Toggle A/B/C está OFF, esas keys se omiten del payload. Los 7 body params son la excepción: siempre se envían.
- **Upload Supabase antes de ComfyDeploy** — imágenes de referencia van a Supabase primero, luego URL pública a ComfyDeploy.
- **`imagen rostro` hardcodeado** — siempre `"Nano Banana Pro"`.
- **Polling cada 8 segundos, timeout 10 min** — `pollForBoth()` en la UI para AION; `pollWeekContentRun()` para contenido.
- **Fase 4: 1 run ComfyDeploy f9822b81 = 8 imágenes** — 14 slots, 8 activos (ZCS1-ZCS8), 6 con prompts reciclados (skip9-skip14).
- **Fase 4: 2 semanas automáticas** — 1 clic dispara Week1 plan → Week1 run → Week2 plan → Week2 run → poll concurrente de ambos runs.
- **RunID con prefijos** — `cdc:` para ComfyDeploy Content, `ccsx:` para ComfyUI Cloud sexy. Sin prefijo = AION.
- **ZCS1-ZCS8 como filename_prefix** — al extraer outputs, se filtran URLs cuyo filename empieza con `ZCS` y se ordenan numéricamente.
- **Fase 4C: workflow en API format** — `data/workflow-sexy-contexto.json` es un JSON plano con node IDs como claves. Se parchea dinámicamente antes de enviarlo (nodes 727/728/729).
- **Fase 4C: ByteDanceSeedNode 799 genera los 10 prompts** — usa Seed 2.0 Pro como LLM multimodal de texto. NO usa ClaudeNode para esto. ClaudeNode 785 solo hace el análisis inicial de las 3 imágenes.
- **Fase 4C: imágenes se suben a ComfyUI Cloud** — `uploadToComfyCloud()` descarga la imagen de su URL, la sube a `/api/upload/image` como multipart, devuelve el filename. Luego se parchea en el workflow antes del submit.
- **safeJsonStringify()** — limpia surrogates inválidos en payloads hacia Anthropic para evitar error `400: no low surrogate in string`.
- **No necesita npm install** — `server.cjs` usa solo módulos nativos de Node.js.
- **Hero photo local** — `/hero-photo.png` se sirve desde `Foto inicio/Nano Banana Pro_00001_.png`.
- **Lime sobre negro** — todos los botones con fondo `#C8FF00` deben tener `color: #000` explícito.
- **`data/influencers.json` no se commitea** — contiene datos reales del usuario. Está en `.gitignore`.

---

## TROUBLESHOOTING

**Error "Not found" en rutas:** El proceso node viejo sigue corriendo. Correr `.\iniciar.bat` de nuevo.

**Ambas imágenes muestran el cuerpo:** La detección face/body usa `includes('ComfyUI')`. Verificar que el `SaveImage` del rostro usa prefijo `"Nano Banana Pro"` y el del cuerpo usa `"ComfyUI"`.

**La imagen de rostro no aparece tras `success`:** Revisar terminal — buscar `OUTPUTS:` y `face_url:` en los logs.

**Body url es null aunque el run tuvo éxito:** Verificar que `prompt_body` llegó al run (buscar en logs `prompt_body` antes del `startAionRun`).

**Hero muestra placeholder:**
- Verificar que existe `Foto inicio/Nano Banana Pro_00001_.png`
- La ruta tiene espacio: `path.join(__dirname, 'Foto inicio', 'Nano Banana Pro_00001_.png')`

**Upload falla 403/404:**
- Verificar `VITE_SUPABASE_ANON_KEY` en `.env`
- Verificar bucket `zami-images` público con policy `FOR ALL TO anon`

**ComfyDeploy error en `/api/generate-face`:** Verificar `VITE_COMFYDEPLOY_AION_DEPLOYMENT_ID` en `.env` y deployment `e833a575` activo.

**El servidor no lee cambios del `.env`:** Siempre `.\iniciar.bat` después de editar `.env`.

**Fase 4: error "Field 'prompt' cannot be shorter than 1 characters":** El GeminiImage2Node recibió un prompt vacío. Verificar que prompts8 tiene 8 elementos no vacíos.

**Fase 4: 0 imágenes en slots aunque status=success:** El filtro de extractImages no encontró URLs con prefijo ZCS. Buscar en terminal "CDC OUTPUTS:" para ver la estructura real.

**Fase 4C: `[CC-SEXY ERROR] Agrega COMFYCLOUD_API_KEY en tu .env`:** Agregar `COMFYCLOUD_API_KEY=comfyui-...` y reiniciar.

**Fase 4C: `ComfyCloud upload 401`:** API key inválida o expirada. Regenerar en https://platform.comfy.org/profile/api-keys.

**Fase 4C: `ComfyCloud prompt 402`:** Sin créditos en cloud.comfy.org. Recargar créditos.

**Fase 4C: status `completed` pero 0 sexyImages:** Los outputs no tienen filenames con prefijo `ZSEXY\d+`. Buscar en terminal `CC-SEXY-MONITOR outputs-check` para ver cuántos encontró.

---

## FASE 4C — BOTÓN "✦ MÁS SEXY" (COMFYUI CLOUD API)

Estado: ✅ Operativo. Probado end-to-end.

**Concepto:** Cada foto generada en el contenido UGC normal tiene un botón "✦ Más Sexy". Al hacer clic, esa foto se usa como `contexto` (IMAGE_3) del workflow, junto con `rostro` y `cuerpo` del influencer activo. El workflow genera 10 imágenes de la influencer en el MISMO lugar que la foto seleccionada.

### Motor: ComfyUI Cloud API (cloud.comfy.org)

No usa ComfyDeploy. Llama directamente a la API de cloud.comfy.org con `data/workflow-sexy-contexto.json` modificado dinámicamente.

**Workflow activo:** `data/workflow-sexy-contexto.json` — API format (JSON plano con node IDs como claves).

### Arquitectura del workflow

- **Node 727** (LoadImage): rostro — se parchea dinámicamente
- **Node 728** (LoadImage): cuerpo — se parchea dinámicamente
- **Node 729** (LoadImage): contexto (ubicación) — se parchea dinámicamente
- **Node 785** (ClaudeNode "Unified Image Analysis"): recibe las 3 imágenes → genera FACE_IDENTITY + BODY_REFERENCE + CHARACTER_LOCK + CONTEXT_LOCK + SEXY_INSTAGRAM_STYLE + [POSE_PROMPT]
- **Node 788** (PrimitiveStringMultiline "Prompt 1"): texto estático del pose base
- **Node 789** (RegexReplace): reemplaza `[POSE_PROMPT]` en la salida de 785 con el texto de 788
- **Node 791** (PrimitiveStringMultiline "Prompt Template"): pasa salida de 785 al RegexReplace
- **Node 799** (ByteDanceSeedNode "ByteDance Seed"): recibe el análisis procesado + 3 imágenes → genera **texto** con 10 prompts separados por `*` usando modelo Seed 2.0 Pro
- **Node 673** (PreviewAny): pasa el texto de 799
- **Node 677** (Text Multiline): pasa texto de 673
- **Node 678** (StringSplitList): divide por `*` → LIST de 10 prompts
- **Nodes 679-688** (ListGetItem 0-9): extrae cada prompt
- **Nodes 689, 692, 694, 700, 703, 706, 708, 712, 715, 718** (ByteDanceSeedreamNodeV2 × 10): genera ZSEXY1-ZSEXY10 con las 3 imágenes + cada prompt
- **Nodes 695-716** (SaveImage × 10): guarda con prefijos ZSEXY1-ZSEXY10

⚠️ **Node 799 usa ByteDanceSeedNode (NO ClaudeNode)** — genera texto nativo en ComfyUI Cloud sin necesitar ANTHROPIC_API_KEY en el entorno de ComfyUI. Node 785 sí es ClaudeNode y requiere que la key esté configurada en la cuenta de ComfyUI Cloud.

### Flujo server.cjs

```
Botón "✦ Más Sexy":
  Browser: POST /api/generate-sexy-from-content {
    face_url, body_url, contexto_url
  }
  Server:  startComfyCloudSexyRun(faceUrl, bodyUrl, contextoUrl)
           1. uploadToComfyCloud(faceUrl) → rostroName
           2. uploadToComfyCloud(bodyUrl) → cuerpoName
           3. uploadToComfyCloud(contextoUrl) → contextoName
           4. Deep clone WORKFLOW_SEXY_CONTEXTO
           5. workflow['727']['inputs']['image'] = rostroName
              workflow['728']['inputs']['image'] = cuerpoName
              workflow['729']['inputs']['image'] = contextoName
           6. POST https://cloud.comfy.org/api/prompt
              { prompt: workflow, extra_data: { api_key_comfy_org: COMFYCLOUD_API_KEY } }
           7. Devuelve { runId: 'ccsx:' + prompt_id }
  Browser: polling GET /api/status/ccsx:{prompt_id} cada 3s
  Server:  monitor interno con /api/job/{id}/status cada 3s
           Cuando completed: GET /api/jobs/{id} → filtrar display_name ZSEXY\d+ → resolver /api/view → URLs firmadas S3
           Devuelve { status: 'success', sexyImages: [10 URLs] }
  Browser: renderSexyImages(sexyImages) — grid 5×2
```

### Extracción de imágenes ZSEXY
- Filtrar por `display_name` con patrón `/^ZSEXY\d+/` (no por `filename` que es hash)
- Ordenar numéricamente por el número en el display_name
- Resolver cada filename hash con `GET /api/view?filename={hash}&type=output` → sigue el 302 → URL firmada S3
- El servidor devuelve `status: 'success'` solo cuando tiene exactamente 10 URLs resueltas

---

## ESTADO ACTUAL — PIPELINE COMPLETO OPERATIVO (2026-06-09)

**Probado de punta a punta y funcionando:**

1. ✅ **Creación de influencer con Claude** — descripción en lenguaje natural → Claude elige 51 params → ComfyDeploy genera rostro + cuerpo en run unificado
2. ✅ **Creación manual** — 4 toggles (imágenes de referencia, face params, body params, prompt libre)
3. ✅ **AI Persona** — Claude analiza rostro + cuerpo → perfil completo editable
4. ✅ **2 Semanas de Contenido UGC** — 1 clic → plan semana 1 → run semana 1 → plan semana 2 → run semana 2 → 16 imágenes con skeleton shimmer, badges, timers, toasts
5. ✅ **"✦ Más Sexy"** — cualquier foto de contenido → 3 uploads a ComfyUI Cloud → workflow patched → 10 imágenes ZSEXY1-ZSEXY10

**Tag de referencia:** `v1.0-stable` — checkpoint seguro en `main`, usar como base para cualquier rollback.

**Lo que sigue (mejoras, no infraestructura):**
- Mejoras de prompts y cerebro de Claude API
- Mejoras de UX y componentes
- Fase 5: publicación automática
- Fase 6: KPIs y analytics
