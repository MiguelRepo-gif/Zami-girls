# Zami AI Studio — Documentación Técnica v12 — 2-Week Auto-Generation + Skeleton UI

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
    body_params: {        ← solo si toggle B está ON y se seleccionaron body params (7 params directos)
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

**BODY_EXPERT_SYSTEM_PROMPT** — **ELIMINADO en v10.** Ya no se necesita: los 7 body params van directo al workflow como enums, y el texto libre del usuario se pasa sin procesar.
- Antes recibía los 15 body params + nicho + nombre
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

### Fase 4 — Contenido UGC Semanal (ComfyDeploy)

**Motor:** ComfyDeploy deployment `f9822b81-9ebc-48e2-b39c-0e8034e90554` — 14 slots (8 activos, 6 con prompts reciclados).
**Separación de motores:** ComfyDeploy `c6e6b7f0` solo genera rostro+cuerpo. ComfyDeploy `f9822b81` genera el contenido UGC.

```
FASE 4 — Contenido Semanal (se repite cada semana por cada influencer)
  Usuario: selecciona influencer del panel → clic "Generar Plan Semanal"

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
    Usuario: edita prompts si quiere → clic "Generar 8 Imágenes"
    Browser: POST /api/generate-content-day { face_url, body_url, prompts[8] }
    Server:  startComfyDeployContentRun(faceUrl, bodyUrl, prompts8)
             1. Construye inputs con 14 slots:
                - Slots 1-8: face_url, body_url, prompts reales de Claude, filename_prefix ZCS1-ZCS8
                - Slots 9-14: face_url, body_url, prompts reciclados (prompts8[0..5]), filename_prefix skip9-skip14
             2. POST api.comfydeploy.com/api/run/deployment/queue
                deployment_id: f9822b81-9ebc-48e2-b39c-0e8034e90554
                inputs: { "rostro 1": faceUrl, "cuerpo 1": bodyUrl, "prompt contenido 1": prompt, "contenido final 1": "ZCS1", ... }
             3. Devuelve runId = "cdc:" + run_id
    Browser: pollContentRun(runId) — GET /api/status/cdc:{id} cada 8s
    Server:  GET api.comfydeploy.com/api/run/{id} → status: queued|running|started|uploading|success|failed
             Cuando success: extractImages(outputs) → filtrar por filename que empieza con ZCS → ordenar numéricamente → 8 URLs
    Browser: muestra 8 imágenes en slots slot-content-1 a slot-content-8

  Paso C — Guardar semana:
    Browser: POST /api/influencers/:id/weeks { theme, summary, plan }
    Server:  Agrega semana al historial en data/influencers.json
```

---

## AION — PARÁMETROS Y MODOS

### Workflow deployment AION + Gemini Body (run unificado)
- **Deployment ID:** `e833a575-893b-49f2-8687-4aa5291d31cc`
- **Input `imagen rostro`:** siempre `"Nano Banana Pro"` (prefijo del archivo de output SaveImage nodo 14)
- **Input `photo_type`:** siempre enviado; UI default desde v7: `"Studio 2x2 portrait multi-view grid"`
- **Input `prompt_body`:** texto para el nodo `GeminiImage2Node` (nodo 650 external input) — opcional, si se omite Gemini usa defaults internos

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

### Toggle D — 7 params de cuerpo + descripción libre + 3 calidad (NUEVO en v11)

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

Opciones default: `"auto"` — desde la auditoría de body params, el servidor envía `"auto"` explícito para cualquier body param no seleccionado.
Textarea `body-description` → pasa directo como `prompt_body` al workflow.

**Regla de payload:** los 7 body params siempre se envían al deployment. Si el usuario no eligió un valor, el servidor manda `"auto"` explícito. Si el usuario o Claude elige un valor, se valida contra las opciones exactas del workflow antes de gastar un run. Si el texto pide cuerpo curvy/extremo, el servidor fuerza enums altos/extremos antes del queue.

**Version probada y aprobada — auditoria body params:** la fuente de verdad es el log local `[AION PAYLOAD AUDIT]` justo antes de llamar a ComfyDeploy. En la prueba aprobada, el payload final llego armado con `deployment_id: e833a575-893b-49f2-8687-4aa5291d31cc`, `model: gemini-3.1-pro-preview`, `image_model: Nano Banana Pro (gemini-3-pro-image-preview)`, `resolution: 512px`, `prompt_body` no vacio y estos 7 body params explicitos:
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
Esto confirma que la app/servidor ya no depende solo de texto libre para el cuerpo: manda los enums manuales del workflow y usa `prompt_body` como refuerzo. Si ComfyDeploy genera un cuerpo moderado con este audit correcto, el siguiente diagnostico ya no esta en `server.cjs`, sino en como `AionBodyReferenceNode` interpreta/suaviza esos enums y su prompt interno.

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
    "model": "gemini-3.1-pro-preview",    ← modelo AionBodyReferenceNode
    "image_model": "Nano Banana Pro (gemini-3-pro-image-preview)",
    "resolution": "512px",
    "prompt_body": "...",          ← body_description del usuario (Modo Manual) o prompt_body de Claude (Modo Claude)
    "prompt": "...",               ← solo si toggle C ON (Modo Manual)
    "eyes": "https://...",         ← solo si toggle A ON y slot tiene imagen
    "eyebrows": "https://...",
    "nose": "https://...",
    "lips": "https://...",
    "forehead": "https://...",
    "jawline": "https://...",
    "hairline": "https://...",
    "skin": "https://...",
    "full_face": "https://...",
    "sex": "female",               ← solo si toggle B ON (face params)
    "ethnicity": "...",
    ... (hasta 43 COMBO face params)
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
  images = extractImages(data.outputs)   ← extrae todas las URLs de imagen
  body_url = images.find(u => u.includes('ComfyUI'))     ← prefijo nodo 228 (save_image="ComfyUI")
  face_url = images.find(u => !u.includes('ComfyUI'))    ← prefijo nodo 14 (imagen rostro="Nano Banana Pro")
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
→ JSON puro con 51 campos: 43 face params + 7 body params + "prompt_body"
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

### ComfyDeploy — Fase 4 UGC Content (deployment f9822b81, 14 slots)
```
POST https://api.comfydeploy.com/api/run/deployment/queue
Authorization: Bearer {VITE_COMFYDEPLOY_API_KEY}
Content-Type: application/json
{
  "deployment_id": "f9822b81-9ebc-48e2-b39c-0e8034e90554",
  "inputs": {
    "rostro 1": "<face_url>",
    "cuerpo 1": "<body_url>",
    "prompt contenido 1": "<claude_prompt>",
    "contenido final 1": "ZCS1",
    "rostro 2": "<face_url>",
    "cuerpo 2": "<body_url>",
    "prompt contenido 2": "<claude_prompt>",
    "contenido final 2": "ZCS2",
    ...
    "rostro 8": "<face_url>",
    "cuerpo 8": "<body_url>",
    "prompt contenido 8": "<claude_prompt>",
    "contenido final 8": "ZCS8",
    "rostro 9": "<face_url>",
    "cuerpo 9": "<body_url>",
    "prompt contenido 9": "<recycled_prompt>",
    "contenido final 9": "skip9",
    ...
    "rostro 14": "<face_url>",
    "cuerpo 14": "<body_url>",
    "prompt contenido 14": "<recycled_prompt>",
    "contenido final 14": "skip14"
  }
}
→ { "run_id": "xxx" }

Polling: GET https://api.comfydeploy.com/api/run/{run_id} → { status, outputs }
Cuando success: extractImages(outputs) → filtrar URLs con filename ZCS\d+ → sort numérico → 8 URLs
RunId prefix: "cdc:" + run_id
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
| `GET` | `/api/status/:runId` | — | Routing automático: prefijo `cdc:` → ComfyDeploy Content, sin prefijo → ComfyDeploy AION → `{ status, ... }` |
| `GET` | `/api/influencers` | — | Lista influencers guardadas |
| `POST` | `/api/influencers` | `{ nombre, nicho, face_url, body_url, persona }` | Guarda influencer |
| `POST` | `/api/influencers/:id/weeks` | `{ theme, summary, plan }` | Guarda semana |
| `POST` | `/api/generate-content-plan` | `{ persona, nombre, nicho, face_url, body_url, week_history }` | Plan semanal → 8 piezas |
| `POST` | `/api/generate-content-day` | `{ face_url, body_url, prompts[8] }` | 1 run ComfyDeploy f9822b81 → 8 imágenes UGC → `{ runId: "cdc:uuid" }` |

### Routing de `/api/status/:runId`
```js
if (runId.startsWith('cdc:')) {
  // → ComfyDeploy Content (f9822b81): GET /api/run/{id}
  // → { status: 'running' | 'success' | 'error', contentImages: [...8 urls] }
} else {
  // → ComfyDeploy AION (c6e6b7f0): GET /api/run/{runId}
  // → { status, images, face_url, body_url }
}
```

---

## ARCHIVOS DEL PROYECTO

| Archivo | Función |
|---|---|
| `server.cjs` | Servidor local — pipeline completo + ruta `/hero-photo.png` |
| `server-ui.html` | UI completa — hero, studio, 4 toggles (Imágenes · Rostro · Cuerpo · Prompt), 43 face params + 7 body params + 3 calidad, Fase 4 (8 slots) |
| `iniciar.bat` | Lanzador Windows (taskkill + node server.cjs) |
| `.env` | Variables de entorno (NO commitear) |
| `.env.example` | Template de variables |
| `data/influencers.json` | Persistencia local de influencers y semanas (NO commitear — datos reales) |
| `data/workflow-content.json` | Workflow ComfyUI para ComfyCloud — LEGACY, ya no se usa. Fase 4 usa ComfyDeploy f9822b81 |
| `Foto inicio/Nano Banana Pro_00001_.png` | Foto fija del hero landing (modelo principal) |
| `CLAUDE.md` | Esta documentación |

---

## VARIABLES DE ENTORNO (`.env`)

```env
# REQUERIDAS
VITE_COMFYDEPLOY_API_KEY=           # ComfyDeploy — Fases 1-3 (rostro + cuerpo)
ANTHROPIC_API_KEY=                  # Claude — prompts, persona, plan semanal
ANTHROPIC_MODEL=claude-sonnet-4-6

# ComfyCloud — YA NO SE USA para Fase 4 (migrado a ComfyDeploy f9822b81)
# COMFYCLOUD_API_KEY=   ← legacy, no requerido

# DEPLOYMENT IDs ComfyDeploy
VITE_COMFYDEPLOY_AION_DEPLOYMENT_ID=e833a575-893b-49f2-8687-4aa5291d31cc   # AION rostro + AionBodyReferenceNode cuerpo (run unificado) — ACTIVO
VITE_COMFYDEPLOY_BODY_DEPLOYMENT_ID=cabf22a3-a697-485c-a6df-b6c09ee4f2f1   # legacy, no usado
VITE_COMFYDEPLOY_CONTENT_DEPLOYMENT_ID=f9822b81-9ebc-48e2-b39c-0e8034e90554  # Fase 4 UGC — 14 slots

# Supabase Storage (imágenes de referencia Toggle A)
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
| 1a | Generación Rostro + Cuerpo — Modo Manual | ComfyDeploy `e833a575` (AION nodo 66 + AionBodyRef nodo 227) | ✅ Operativo |
| 1b | Generación Rostro + Cuerpo — Modo Claude | Anthropic `claude-sonnet-4-6` (51 params) + ComfyDeploy `e833a575` | ✅ Operativo |
| 2 | Body params directos (Modo Manual) | 7 enums directo al workflow, body_description como brief_text | ✅ Operativo |
| 3 | Generación de Cuerpo | Integrado en `e833a575` (AionBodyReferenceNode nodo 227) | ✅ Operativo |
| 4 | Perfil AI Persona | Anthropic `claude-sonnet-4-6` | ✅ Operativo |
| Fase 4 | Contenido UGC — 2 semanas × 8 imágenes | Claude plan ×2 + ComfyDeploy `f9822b81` ×2 (14 slots, 8 usados) | ✅ Operativo (requiere créditos ComfyDeploy) |
| Fase 4B | Contenido Sexy (flujo viejo) — eliminado de UI | ComfyDeploy `5eb42961` — roto, reemplazado por Fase 4C | 🗑 Eliminado del UI |
| Fase 4C | Botón "✦ Más Sexy" por foto — 10 imágenes | ComfyUI Cloud `cloud.comfy.org` + `data/workflow-sexy-contexto.json` (versión 7-6) | ✅ Operativo |
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

## SYSTEM PROMPT DE GEMINIIMAGE2NODE — Fase 4 (workflow-content.json)

El system_prompt hardcodeado en cada `GeminiImage2Node` del `workflow-content.json`:

```
You are an expert image-generation engine. You must ALWAYS produce an image.
Interpret all user input—regardless of format, intent, or abstraction—as literal visual directives for image composition.
If a prompt is conversational or lacks specific visual details, you must creatively invent a concrete visual scenario that depicts the concept.
Prioritize generating the visual representation above any text, formatting, or conversational requests.
```

El `prompt` de cada nodo Gemini es el texto creativo generado por Claude (80-120 palabras, en inglés), inyectado en `startComfyDeployContentRun()` desde el array `prompts8[i]`.

---

## DECISIONES TÉCNICAS IMPORTANTES

- **Run unificado rostro + cuerpo** — deployment `e833a575` incluye AION (nodo 66) + AionBodyReferenceNode (nodo 227) en el mismo run. La salida de AION se conecta internamente como `face_reference`. No hay segundo deployment.
- **URL detection por prefijo** — `"ComfyUI"` (nodo 651, cuerpo) no tiene espacios, nunca se URL-encoda. `"Nano Banana Pro"` (nodo 14, rostro) se encoda como `Nano%20Banana%20Pro`. La detección usa `includes('ComfyUI')` — nunca regex sobre el prefijo del rostro.
- **4 toggles en Modo Manual (v11)** — A: Imágenes de referencia · B: Parámetros de Rostro (43) · D: Parámetros de Cuerpo (7 + calidad) · C: Prompt libre. Toggle B y Toggle D son independientes: `sectionState.params` vs `sectionState.body`.
- **7 body params directos** — se recolectan de `bodyparam-{name}` selects en Toggle D (body_type, bust, waist, glutes, hips, legs, shoulders). Siempre van en el payload; si no hay selección, el servidor manda `"auto"` explícito. Van directo al `AionBodyReferenceNode` sin pasar por Claude.
- **`body_description` pasa directo como `prompt_body`** — textarea en Toggle D, va sin procesamiento al campo `brief_text` del nodo 227. `BODY_EXPERT_SYSTEM_PROMPT` eliminado.
- **AION_EXPERT_SYSTEM_PROMPT devuelve 51 campos** — 43 face params + 7 body params + `prompt_body` (max_tokens: 2000). Incluye INTENSITY MAPPING: palabras como "súper, enorme, ultra" → enums máximos (ej. `massive oversized bust ultra-exaggerated`); "grande, curvy" → enums altos; lenguaje extremo también refuerza el `prompt_body`.
- **Body param overrides determinísticos** — además de confiar en Claude, `server.cjs` analiza el texto del usuario y fuerza los 7 enums del cuerpo cuando detecta lenguaje corporal: `curvy`, `busto/pechos/tetona/busty`, `trasero/culo/culona/nalgona/booty`, `caderas`, `cintura/hourglass`, `piernas/muslos`. En Modo Claude estos overrides reemplazan cualquier selección tímida; en Modo Manual completan parámetros faltantes desde `body_description`/prompt sin pisar selects manuales ya elegidos.
- **AION PAYLOAD AUDIT** — antes de enviar el run a ComfyDeploy, el servidor imprime `deployment_id`, `photo_type`, `model`, `image_model`, `resolution`, `prompt_body` y los 7 body params finales. Esta es la fuente de verdad para comparar contra los logs de ComfyDeploy.
- **Dos modos de Fase 1** — Manual (4 toggles) y Claude-guided (descripción natural + imágenes para Claude).
- **Modo Claude: images solo para Anthropic** — Las imágenes de referencia del modo Claude van en base64 directo a la API de Anthropic, NO a Supabase ni a AION.
- **ExternalImage nodes directos** — el workflow AION v4 conecta `ExternalImage` directo al `AionThetaNode`. Sin `LoadImage` hardcodeados. Input `None` = AION lo ignora.
- **Toggle = omit con excepcion de cuerpo** — cuando Toggle A/B/C esta OFF, esas keys se omiten del payload. Los 7 body params son la excepcion: siempre se envian al deployment, con `"auto"` explicito si no hay seleccion o override.
- **Upload Supabase antes de ComfyDeploy** — imágenes de referencia van a Supabase primero, luego URL pública a ComfyDeploy.
- **`imagen rostro` hardcodeado** — siempre `"Nano Banana Pro"` (era `"imagen final"` en v9, renombrado en v10).
- **9 image slots** — `eyes, eyebrows, nose, lips, forehead, jawline, hairline, skin, full_face`.
- **`iniciar.bat` hace `taskkill`** — mata proceso Node previo antes de arrancar.
- **Polling cada 8 segundos, timeout 10 min** — `pollForBoth()` en la UI.
- **Fase 4: 1 run ComfyDeploy f9822b81 = 8 imágenes** — 14 slots en el deployment, 8 activos con prompts reales de Claude (ZCS1-ZCS8), 6 con prompts reciclados (skip9-skip14). Las URLs de rostro/cuerpo se pasan directamente como inputs ExternalImage/ExternalText — no hay upload previo.
- **No necesita npm install** — `server.cjs` usa solo módulos nativos de Node.js.
- **Hero photo local** — `/hero-photo.png` se sirve desde `Foto inicio/Nano Banana Pro_00001_.png`. Si la carpeta o el archivo no existe, el endpoint devuelve 404 y el hero muestra el placeholder.
- **Lime sobre negro** — todos los botones con fondo `#C8FF00` deben tener `color: #000` explícito. Nunca `color: #fff` sobre lime.
- **CSS cascade limpia** — cada selector tiene UNA sola regla definitiva. No duplicar `.mode-tab`, `.btn-nueva`, `label` etc.
- **`/api/generate-body` y `/api/generate-body-prompt` son legacy** — siguen en el servidor como fallback pero no se llaman desde el flujo principal.
- **Fase 4 migrada a ComfyDeploy** — deployment `f9822b81` con 14 slots (8 activos, 6 con prompts reciclados). Las URLs se pasan directamente como inputs ExternalImage/ExternalText — no hay upload previo. `workflow-content.json` es legacy y ya no se usa.
- **RunID con prefijo `cdc:`** — los runs de content generation de ComfyDeploy usan prefijo `cdc:` para diferenciarlos del AION (sin prefijo). El handler `/api/status/:runId` detecta el prefijo y rutea al branch ComfyDeploy Content.
- **ZCS1-ZCS8 como filename_prefix** — se pasan en el input `"contenido final N"` de cada slot activo. Al extraer outputs, se filtran URLs cuyo filename empieza con `ZCS` y se ordenan numéricamente → orden determinístico.
- **`data/influencers.json` no se commitea** — contiene datos reales del usuario. Está en `.gitignore`.

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

**ComfyDeploy error en `/api/generate-face`:** Verificar `VITE_COMFYDEPLOY_AION_DEPLOYMENT_ID` en `.env` y deployment `e833a575` activo.

**El servidor no lee cambios del `.env`:** Siempre `.\iniciar.bat` después de editar `.env`.

**Regla PowerShell:** Siempre `.\iniciar.bat` con `.\` — sin el punto barra falla.

**Botones con texto blanco sobre lime:** Si algún botón nuevo tiene fondo `#C8FF00` y texto blanco, agregar `color: #000` explícito al selector CSS.

**Fase 4: error "Field 'prompt' cannot be shorter than 1 characters":** El GeminiImage2Node recibió un prompt vacío. Verificar que prompts8 tiene al menos 1 elemento no vacío.

**Fase 4: 0 imágenes en slots aunque status=success:** El filtro de extractImages no encontró URLs con prefijo ZCS. Buscar en terminal "CDC OUTPUTS:" para ver la estructura real de outputs.

**Fase 4: run falla en GeminiImage2Node:** Revisar en dashboard de ComfyDeploy el run específico. Puede ser content policy de Gemini — revisar los prompts generados por Claude.
---

## FASE 4B - CONTENIDO UGC SEXY (COMFYDEPLOY SEEDREAM)

Estado: ⚠️ Deployment `5eb42961-a9dd-47c1-9c94-ad927f951943` falla en 0ms en ComfyDeploy ("Machine AION's Machine"). El run se crea pero falla antes de ejecutar ningún nodo. Causa probable: la máquina del deployment no tiene instalados los custom nodes (ByteDanceSeedreamNodeV2, ClaudeNode, RegexReplace, etc.). Ver Fase 4C para el nuevo flujo de reemplazo.
Workflow fuente: C:\Users\LENOVO\Desktop\Downloads\Contenido sexy API.json
Motor: ComfyDeploy deployment con ByteDanceSeedreamNodeV2, 2 imagenes externas y 10 outputs numerados (ZSEXY1-ZSEXY10).
Separacion de motores: contenido normal usa VITE_COMFYDEPLOY_CONTENT_DEPLOYMENT_ID; contenido sexy usa VITE_COMFYDEPLOY_SEXY_CONTENT_DEPLOYMENT_ID.

### Deployment activo

El ID `5eb42961-a9dd-47c1-9c94-ad927f951943` está hardcodeado como default en `server.cjs` y en `.env.example`. No requiere variable de entorno para funcionar.

Si quieres forzarlo explícitamente vía `.env`:

```env
VITE_COMFYDEPLOY_SEXY_CONTENT_DEPLOYMENT_ID=5eb42961-a9dd-47c1-9c94-ad927f951943
```

Luego reiniciar:

```powershell
cd C:\Users\LENOVO\zami-ai-studio-dev
.\iniciar.bat
```

### Flujo en la app

1. Generar o seleccionar influencer con face_url, body_url y AI Persona.
2. Generar primero el Plan Semanal normal para fijar tema y continuidad.
3. Clic en Generar Plan Sexy.
4. La app llama:
   - POST /api/generate-sexy-content-plan
   - POST /api/generate-sexy-content-day
   - GET /api/status/cdsx:{run_id}

### Payload hacia ComfyDeploy sexy

El servidor construye este payload para el deployment sexy:

```json
{
  "rostro": "<face_url>",
  "cuerpo": "<body_url>",
  "ZSEXY1": "ZSEXY1",
  "ZSEXY2": "ZSEXY2",
  "ZSEXY3": "ZSEXY3",
  "ZSEXY4": "ZSEXY4",
  "ZSEXY5": "ZSEXY5",
  "ZSEXY6": "ZSEXY6",
  "ZSEXY7": "ZSEXY7",
  "ZSEXY8": "ZSEXY8",
  "ZSEXY9": "ZSEXY9",
  "ZSEXY10": "ZSEXY10"
}
```

### Arquitectura del workflow (confirmada con Contenido sexy API.json)

**Inputs externos (ComfyUIDeployExternalImage/Text):**
- `rostro` (nodo 719) — face_url
- `cuerpo` (nodo 720) — body_url
- `ZSEXY1`–`ZSEXY10` (nodos 727-736) — SaveImage prefixes, default values iguales al input_id

**Pipeline interno:**
1. **Nodo 649** (ClaudeNode "Unified Image Analysis") — analiza rostro+cuerpo y genera FACE_IDENTITY, BODY_REFERENCE, CHARACTER_LOCK, SEXY_INSTAGRAM_STYLE
2. **Nodo 608** (ByteDanceSeedreamNodeV2) — genera imagen base usando rostro+cuerpo+prompt del análisis. Se guarda como `ZSEXY_base` (nodo 667)
3. **Nodo 676** (ClaudeNode "Anthropic Claude") — recibe la imagen base + análisis, genera 10 prompts separados por `*`
4. **Nodo 678** (StringSplitList) — divide los 10 prompts del string
5. **Nodos 679–688** (ListGetItem index 0–9) — extrae cada prompt
6. **Nodos 689, 692, 694, 700, 703, 706, 708, 712, 715, 718** (ByteDanceSeedreamNodeV2 × 10) — genera cada imagen final usando imagen base + su prompt
7. **Nodos 695–716** (SaveImage × 10) — guarda con prefijo ZSEXY1–ZSEXY10

**Filtro correcto en server.cjs:** `/^ZSEXY\d+/.test(filename)` — excluye `ZSEXY_base`, solo pasa `ZSEXY1`–`ZSEXY10`.

La app filtra outputs por filename `/^ZSEXY\d+/`, ordena numericamente y renderiza 10 imagenes.

### Reglas de prompting sexy

El plan sexy usa prompts Instagram sexy, no desnudos y no explicitos.

Prohibido en prompts:

- nude
- naked
- topless
- explicit
- pornographic
- nipples
- genitalia
- sex act

Permitido/esperado:

- Shot on iPhone 15 Pro
- sexy Instagram influencer UGC
- body-conscious outfit
- high-cut bikini
- micro crop top
- body-hugging mini dress
- mirror selfie
- from behind looking over shoulder
- natural phone grain
- candid social media realism

### Validacion del workflow antes de subir

- links debe ser array de arrays, no objetos.
- No deben quedar links huerfanos.
- No deben quedar prompts activos con Analyze all 5 images, PANTS, TOP, SHOES, ENVIRONMENT.
- No deben quedar dependencias activas de model/jeans/top/shoes/enviroment.
- El workflow debe recibir rostro y cuerpo como external inputs.
- Los outputs deben salir por SaveImage, no por external output nodes.

### Troubleshooting sexy

Si /api/generate-sexy-content-day dice que falta deployment: pegar VITE_COMFYDEPLOY_SEXY_CONTENT_DEPLOYMENT_ID en .env y reiniciar con .\iniciar.bat.

Si status success pero no aparecen imagenes sexy: revisar terminal y buscar CD-SEXY OUTPUTS. El workflow genera tambien `ZSEXY_base` — el filtro `/^ZSEXY\d+/` lo excluye correctamente. Si aparecen 11 imagenes en vez de 10, el filtro no funciona.

Si ComfyDeploy rechaza el workflow por schema: revisar que el JSON tenga links como arrays:

```json
[848, 721, 0, 689, 0, "STRING"]
```

No debe tener objetos tipo:

```json
{ "value": [848, 721, 0, 689, 0, "STRING"], "Count": 6 }
```

---

## FASE 4C — BOTÓN "✦ MÁS SEXY" (COMFYUI CLOUD API)

Estado: ✅ Operativo. Workflow versión 7-6 activo. UI con panel de resultados estático + steps de progreso animados.

**Concepto:** Cada foto generada en el contenido UGC normal tiene un botón "✦ Más Sexy". Al hacer clic, esa foto se usa como `contexto` (IMAGE_3) del workflow, junto con `rostro` y `cuerpo` del influencer activo. El workflow genera 10 imágenes de la influencer en el MISMO lugar que la foto seleccionada, con poses progresivamente más sexys.

### Motor: ComfyUI Cloud API (cloud.comfy.org)

No usa ComfyDeploy. Llama directamente a la API de cloud.comfy.org con el workflow JSON modificado dinámicamente.

**API Key:** `COMFYCLOUD_API_KEY` en `.env` — formato `comfyui-...`. Generar en https://platform.comfy.org/profile/api-keys

**Workflow activo:** `data/workflow-sexy-contexto.json` — versión `ZAMI_SEXY_ROSTRO_CUERPO_NO BORRAR-API_ULTIMA VERSION 7-6.json`
Nodos clave: 785 (ClaudeNode análisis 3 imágenes) → 789 (RegexReplace) → 676 (ClaudeNode 10 prompts) → 10×ByteDanceSeedreamNodeV2 → SaveImage ZSEXY1-ZSEXY10

### Arquitectura del workflow (API format — ComfyUI prompt)

Es un JSON plano con node IDs como claves (formato `/api/prompt` de ComfyUI):

- **Node 727** (LoadImage): rostro — se parchea dinámicamente antes de enviar
- **Node 728** (LoadImage): cuerpo — se parchea dinámicamente
- **Node 729** (LoadImage): contexto (ubicación) — se parchea dinámicamente
- **Node 649** (ClaudeNode "Unified Image Analysis"): recibe los 3 images → genera FACE_IDENTITY + BODY_REFERENCE + CHARACTER_LOCK + CONTEXT_LOCK + SEXY_INSTAGRAM_STYLE + [POSE_PROMPT]
- **Node 658** (RegexReplace): reemplaza `[POSE_PROMPT]` en la salida de 649 con el texto del nodo 661
- **Node 661** (PrimitiveStringMultiline "Prompt 1"): texto estático del pose base para la imagen establecedora
- **Node 660** (PrimitiveStringMultiline "Prompt Template"): pasa la salida de 649 al RegexReplace
- **Node 608** (ByteDanceSeedreamNodeV2): genera imagen base (ZSEXY_base) con los 3 inputs de imagen + prompt procesado
- **Node 676** (ClaudeNode): recibe imagen base + análisis → genera 10 prompts separados por `*`, TODOS en el mismo contexto/ubicación
- **Node 678** (StringSplitList): divide los 10 prompts
- **Nodes 679-688** (ListGetItem 0-9): extrae cada prompt
- **Nodes 689, 692, 694, 700, 703, 706, 708, 712, 715, 718** (ByteDanceSeedreamNodeV2 × 10): genera ZSEXY1-ZSEXY10
- **Nodes 695-716** (SaveImage × 10): guarda con prefijos ZSEXY1-ZSEXY10

### Prompts reescritos en esta sesión (nodos 649, 661, 676)

**Node 649** — Analiza 3 imágenes y genera 6 secciones: FACE_IDENTITY, BODY_REFERENCE, CHARACTER_LOCK, CONTEXT_LOCK (nuevo — analiza IMAGE_3 como la ubicación física donde se tomarán TODAS las fotos), SEXY_INSTAGRAM_STYLE, POSE PROMPT IMAGE con placeholder `[POSE_PROMPT]`.

**Node 661** — Prompt del pose base: instruye a Seedream a colocar a la influencer en el MISMO lugar que IMAGE_3 para la foto establecedora.

**Node 676** — Genera 10 prompts TODOS en la MISMA ubicación (CONTEXT_LOCK). Estructura: Prompt 1 = 3/4 facing, P2 = from behind, P3 = selfie, P4 = low angle, P5 = from behind (diferente interacción), P6 = 3/4 forward, P7 = candid action, P8 = from behind máximo, P9 = crop cintura-muslo, P10 = sentada/reclinada. Outfit: 1 familia para las 10 fotos. Progresión de provocación 1→10.

### Flujo server.cjs (nuevas funciones)

```
Botón "✦ Más Sexy" (en cada foto de contenido normal):
  Browser: click → generateSexyFromContent(imgUrl)
           POST /api/generate-sexy-from-content {
             face_url: generatedFaceUrl,
             body_url: generatedBodyUrl,
             contexto_url: imgUrl (la foto seleccionada)
           }
  Server:  startComfyCloudSexyRun(faceUrl, bodyUrl, contextoUrl)
           1. uploadToComfyCloud(faceUrl) → rostroName
           2. uploadToComfyCloud(bodyUrl) → cuerpoName
           3. uploadToComfyCloud(contextoUrl) → contextoName
              (descarga imagen de su URL → sube a cloud.comfy.org multipart → devuelve filename)
           4. Deep clone WORKFLOW_SEXY_CONTEXTO
           5. workflow['727']['inputs']['image'] = rostroName
              workflow['728']['inputs']['image'] = cuerpoName
              workflow['729']['inputs']['image'] = contextoName
           6. POST https://cloud.comfy.org/api/prompt
              { prompt: workflow, extra_data: { api_key_comfy_org: COMFYCLOUD_API_KEY } }
              Header: X-API-Key: COMFYCLOUD_API_KEY
           7. Devuelve { runId: 'ccsx:' + prompt_id }
  Browser: polling GET /api/status/ccsx:{prompt_id} cada 8s
  Server:  GET https://cloud.comfy.org/api/job/{id}/status → { status }
           Cuando completed:
             GET https://cloud.comfy.org/api/jobs/{id} → { outputs: { nodeId: { images: [...] } } }
             Filtrar outputs con filename /^ZSEXY\d+/ → ordenar numéricamente
             Para cada filename: GET /api/view?filename=...&type=output (redirect: manual)
               → Location header = URL pública firmada temporal (S3)
             Devuelve { status: 'success', sexyImages: [10 URLs] }
  Browser: renderSexyImages(sexyImages) — reutiliza función existente
```

### Variables de entorno nuevas

```env
COMFYCLOUD_API_KEY=comfyui-<key-activa>   # Generar en https://platform.comfy.org/profile/api-keys
```

### Archivos modificados en esta sesión

| Archivo | Cambio |
|---|---|
| `data/workflow-sexy-contexto.json` | Nuevo — copia del workflow API para ComfyUI Cloud |
| `server.cjs` | `COMFYCLOUD_API_KEY`, `WORKFLOW_SEXY_CONTEXTO` (carga JSON), `uploadToComfyCloud()`, `startComfyCloudSexyRun()`, endpoint `/api/generate-sexy-from-content`, branch `ccsx:` en `/api/status/:runId` |
| `server-ui.html` | CSS `.btn-mas-sexy`, botón "✦ Más Sexy" en `renderContentImages()`, función `generateSexyFromContent()` |
| `.env.example` | Documentada nueva variable `COMFYCLOUD_API_KEY` |
| `ZAMI_SEXY_ROSTRO_CUERPO_NO BORRAR.json` (Desktop) | Reescritos nodos 649 (system_prompt con CONTEXT_LOCK), 661 (pose base con IMAGE_3), 676 (10 prompts mismo contexto) |

### Troubleshooting Fase 4C

**`[CC-SEXY ERROR] Agrega COMFYCLOUD_API_KEY en tu .env`:** La variable no está en `.env`. Agregar `COMFYCLOUD_API_KEY=comfyui-...` y reiniciar con `.\iniciar.bat`.

**`[CC-SEXY ERROR] No se encontró data/workflow-sexy-contexto.json`:** El archivo no se copió al proyecto. Copiar `ZAMI_SEXY_ROSTRO_CUERPO_NO BORRAR (1).json` desde Desktop/Workflow a `data/workflow-sexy-contexto.json`.

**`ComfyCloud upload 401`:** API key inválida o expirada. Regenerar en https://platform.comfy.org/profile/api-keys.

**`ComfyCloud prompt 402`:** Sin créditos en cloud.comfy.org. Recargar créditos.

**`[CC-SEXY-STATUS] ... -> completed` pero 0 sexyImages:** Los outputs no tienen filenames con prefijo `ZSEXY\d+`. Revisar en terminal `CC-SEXY OUTPUTS:` para ver la estructura real. Puede ser que el workflow en cloud.comfy.org cambió los prefijos.

**Contenido UGC (Fase 4) da 404 "Workflow not found":** El `VITE_COMFYDEPLOY_CONTENT_DEPLOYMENT_ID` en `.env` apunta a un deployment eliminado. Cambiarlo a `f9822b81-9ebc-48e2-b39c-0e8034e90554` y reiniciar.

### ESTADO AL CIERRE DE SESIÓN (2026-06-07) — v12

**Hecho en sesión anterior (v11 → UI cleanup + Fase 4C fix):**
- ✅ Workflow sexy actualizado a versión 7-6 (`data/workflow-sexy-contexto.json`)
- ✅ Flujo `ccsx:` operativo (ComfyUI Cloud genera ZSEXY1-ZSEXY10)
- ✅ Eliminada sección "CONTENIDO SEXY INSTAGRAM" (era redundante)
- ✅ Panel `#sexy-result-section` estático con 10 slots + steps animados + timer + thumbnail

**Hecho en esta sesión (v12 — 2-Week Auto-Generation + Skeleton UI):**
- ✅ Fix ComfyUI error "Field 'prompt' cannot be empty" en node 700: nodo 678 ahora lee directo de 676 (bypassea Text Multiline fallido)
- ✅ Instrucción anti-asterisk agregada al system_prompt del nodo 676 (evita que Claude use `*` dentro del texto de un prompt)
- ✅ Nuevo endpoint `/api/generate-content-2weeks` en `server.cjs` (secuencial server-side, no usado actualmente por UI pero disponible)
- ✅ Reemplazado botón "Generar Plan Semanal" + "Generar 8 Imágenes" por botón único **"✦ Generar 2 Semanas de Contenido"**
- ✅ Auto-generación: al crear el plan, el run de ComfyDeploy se lanza automáticamente (sin segundo clic)
- ✅ 2 semanas simultáneas: Week 1 plan → Week 1 run → Week 2 plan → Week 2 run → poll ambos concurrentes
- ✅ Skeleton shimmer en 16 slots (8 por semana) aparecen inmediatamente
- ✅ Badges de estado por semana: Pendiente → Planificando → Generando → Listo (con animación pulse)
- ✅ Timer de elapsed time por semana
- ✅ Toast notifications en completion/error
- ✅ Hover overlay con caption preview sobre cada imagen
- ✅ Animación `img-appear` al cargar cada imagen
- ✅ Grid 4 columnas fijo (era auto-fill minmax 280px)
- ✅ Botón "Guardar Semana 1" / "Guardar Semana 2" independientes
- ✅ Toast container en DOM (`#toast-container`)
- ✅ Commit `03a8a3f` pusheado a GitHub main

**Prueba realizada:**
- El payload de contenido llegó correcto al servidor (face_url, body_url, 8 prompts con formato correcto)
- ComfyDeploy retornó 403 "Insufficient deployment owner's GPU credits" — NO es bug de código, es créditos agotados en la cuenta ComfyDeploy
- **Pendiente:** recargar créditos en app.comfydeploy.com/settings/billing y repetir prueba completa

**IDs de slots en la nueva UI:**
- Semana 1: `slot-w1-1` … `slot-w1-8`, `caption-w1-1` … `caption-w1-8`, `prompt-w1-1` … `prompt-w1-8`
- Semana 2: `slot-w2-1` … `slot-w2-8`, `caption-w2-1` … `caption-w2-8`, `prompt-w2-1` … `prompt-w2-8`
- Week sections: `#week-section-1`, `#week-section-2`
- Status badges: `#week-status-1`, `#week-status-2` (clases: `wsb-pending/planning/generating/done/error`)
- Elapsed timers: `#week-elapsed-1`, `#week-elapsed-2`
- Save buttons: `#btn-save-week-1`, `#btn-save-week-2`

**Flujo Fase 4 (nuevo):**
```
1 clic "✦ Generar 2 Semanas" →
  Skeleton aparece para ambas semanas
  → POST /api/generate-content-plan (semana 1, ~45s)
  → POST /api/generate-content-day (semana 1) → lastContentRunId1
  → POST /api/generate-content-plan (semana 2, historia incluye semana 1)
  → POST /api/generate-content-day (semana 2) → lastContentRunId2
  → Promise.allSettled([pollWeekContentRun(1), pollWeekContentRun(2)])
  → renderWeekImages(imgs, weekNum) al completar cada run
  → toast "Semana N lista" + badge "Listo" + botón "Guardar"
```

**Flujo Fase 4C (sin cambios):**
Clic "✦ Más Sexy" sobre cualquier foto → panel `#sexy-result-section` → 3 uploads ComfyUI Cloud → 10 fotos ZSEXY1-ZSEXY10 → grid 5×2

### ESTADO AL CIERRE DE SESION (2026-06-08) - v13

**Objetivo de esta sesion:** dejar la automatizacion Fase 4C "Mas Sexy" documentada, actualizada en `main`, y lista para que otro chat continue sin perder contexto.

**Estado operativo confirmado:**
- La automatizacion local esta funcionando hasta donde se puede probar sin creditos de ComfyUI Cloud.
- La prueba real de generacion de imagenes queda bloqueada por creditos agotados en ComfyUI Cloud. No diagnosticar esto como bug de codigo hasta recargar creditos y repetir la prueba.
- No se debe tocar el prompt fisico del nodo de ComfyUI si el usuario indica que ya lo ajusto manualmente y genera bien.

**Cambios tecnicos aplicados:**
- `server.cjs` ahora monitorea runs `ccsx:` de ComfyUI Cloud cada 3 segundos con estado interno en memoria.
- El branch `/api/status/:runId` para `ccsx:` ya no depende de un polling directo simple: crea/usa un watcher, consulta `/api/prompt`, `/api/job/{job_id}/status` y `/api/jobs/{job_id}`.
- Estados terminales validos para exito: `completed` y `success`. La API documenta `completed`, pero en pruebas reales tambien aparecio `success`.
- Al terminar un job, el servidor extrae imagenes desde `outputs[*].images`.
- Para ordenar/filtrar las 10 imagenes se usa `display_name` con patron `ZSEXY\d+`, porque ComfyUI Cloud guarda el hash real en `filename`.
- Para mostrar imagenes en UI se usa `filename` real contra `/api/view`, aceptando `302 Location` firmado.
- El servidor solo devuelve `status: "success"` cuando tiene 10 URLs ZSEXY resueltas; si llegan menos, sigue esperando y luego devuelve error claro.
- La UI `server-ui.html` mantiene polling Fase 4C cada 3 segundos y soporta `retrying` si el servidor cambia a un run nuevo.
- Los payloads hacia Anthropic usan `safeJsonStringify()` para limpiar surrogates invalidos y evitar el error `Anthropic 400: no low surrogate in string`.

**Workflow Fase 4C actual (`data/workflow-sexy-contexto.json`):**
- Nodo 676: genera exactamente 10 prompts.
- Nodo 676: `model.temperature` queda en `0.7`.
- Separador mecanico vigente: `*`.
- Nodo 678: `inputs.sep` queda en `*`.
- No usar `|||ZAMI_PROMPT_SEPARATOR|||` en este workflow actual.
- El error ComfyUI `Field 'prompt' cannot be empty` se produce cuando alguno de los 10 prompts queda vacio despues del split. La causa observada fue respuesta vacia o formato invalido desde el nodo Claude, no falta de imagen en la UI.

**Limitacion de observabilidad ComfyUI Cloud:**
- La API permite ver status, cola, job details, outputs, `execution_error`, `traceback`, `current_inputs`, `current_outputs`, `outputs_count`, workflow y metadata.
- En el fallo observado con `ByteDanceSeedreamNodeV2` node 718 y `Field 'prompt' cannot be empty`, la API devolvio el error del nodo y `outputs_count: 0`.
- La preview interna del nodo Claude en ComfyUI mostraba `Empty response from Claude model`, pero esa preview completa no aparecio como texto recuperable en la respuesta API del job fallido. Para ese dato se dependio de la captura/UI de ComfyUI.

**Credito agotado - importante para el proximo chat:**
- Actualmente no hay creditos suficientes en ComfyUI Cloud para lanzar una prueba end-to-end de imagenes Fase 4C.
- Antes de probar "Mas Sexy" de punta a punta, recargar creditos en ComfyUI Cloud.
- Despues de recargar, probar desde `http://127.0.0.1:3333`, boton `Mas Sexy`, y confirmar:
  - el panel pasa por Subiendo / Analizando / Generando / Listo,
  - el servidor loguea estados `CC-SEXY-MONITOR`,
  - aparecen 10 URLs resueltas,
  - la UI muestra las 10 imagenes,
  - el polling se detiene,
  - la descarga funciona.

**Prompt para copiar y pegar en otro chat:**

```text
Estamos trabajando en C:\Users\LENOVO\zami-ai-studio-dev, proyecto Zami AI Studio. Lee primero CLAUDE.md y respeta la regla absoluta: cualquier comando que me entregues debe empezar con `cd C:\Users\LENOVO\zami-ai-studio-dev`.

Estado actual al 2026-06-08:
- La automatizacion Fase 4C "Mas Sexy" usa ComfyUI Cloud directo con `data/workflow-sexy-contexto.json`.
- El workflow actual separa los 10 prompts con `*`, no con `|||ZAMI_PROMPT_SEPARATOR|||`.
- Nodo 676: genera exactamente 10 prompts, `model.temperature = 0.7`.
- Nodo 678: `inputs.sep = "*"`.
- No tocar el prompt fisico del nodo ni el workflow si no es estrictamente necesario.
- `server.cjs` ya tiene monitor para runs `ccsx:` cada 3 segundos usando API oficial ComfyUI Cloud:
  - `/api/prompt`
  - `/api/job/{job_id}/status`
  - `/api/jobs/{job_id}`
  - `/api/view`
- La extraccion de imagenes ZSEXY usa `display_name` para filtrar/ordenar y `filename` hash para resolver la URL firmada por `/api/view`.
- La UI `server-ui.html` ya hace polling cada 3 segundos y soporta status `retrying`.
- `server.cjs` tiene `safeJsonStringify()` para evitar errores Anthropic 400 por surrogates invalidos.

Importante:
- En este momento se acabaron los creditos de ComfyUI Cloud, asi que no se puede completar una prueba real de generacion de imagenes hasta recargar creditos.
- No confundas el bloqueo por creditos con bug de codigo.
- Cuando haya creditos, prueba desde `http://127.0.0.1:3333` con el boton "Mas Sexy".
- Si falla `Field 'prompt' cannot be empty`, revisar primero si el nodo Claude devolvio respuesta vacia o menos de 10 prompts no vacios separados por `*`.

Objetivo siguiente:
Probar la automatizacion end-to-end tras recargar creditos, verificar que se muestran las 10 imagenes en la UI, que el polling no queda infinito, y que los logs del monitor expliquen claramente el estado del workflow.
```
