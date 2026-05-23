# Zami AI Studio — Documentación Técnica v4 AION

## REGLA ABSOLUTA — COMANDOS SIEMPRE COMPLETOS

**NUNCA entregues un comando sin el `cd` correcto primero.**
La carpeta del proyecto es `C:\Users\LENOVO\zami-ai-studio-dev`.
Cada vez que des un comando git, bat o node — SIEMPRE incluye el cd al inicio:

```
cd C:\Users\LENOVO\zami-ai-studio-dev
git pull origin main
.\iniciar.bat
```

Si el usuario está en otra carpeta y ejecuta solo `git pull` o `.\iniciar.bat`, falla. Siempre entrega el bloque completo.

---

## INICIO DE SESIÓN — leer primero

Cuando el usuario diga **"vamos a trabajar"**, **"iniciemos"**, **"empecemos"**, **"start"** o cualquier frase de apertura, responde EXACTAMENTE con esto sin preguntar nada:

```
cd C:\Users\LENOVO\zami-ai-studio-dev
git pull origin main
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

**Carpeta local:** `C:\Users\LENOVO\zami-ai-studio-dev`
**Rama activa:** `main`

---

## CÓMO FUNCIONA EL SERVIDOR

`iniciar.bat` mata cualquier proceso Node previo (`taskkill`) y lanza `node server.cjs`.
El browser abre `http://127.0.0.1:3333` — siempre IPv4, nunca `localhost`.
El servidor lee `.env` automáticamente al arrancar. No necesita `npm install`.

### Pipeline AION v4 — Fase 1: Generación de Rostro (Manual)

El usuario configura el nombre, nicho y parámetros de rostro, luego hace clic en **"▶ Generar influencer completa"**. La UI muestra 4 pasos animados:

```
PASO 1 — Generación de rostro con AION
  Browser: POST /api/generate-face {
    photo_type,           ← siempre requerido
    images: {             ← solo si toggle A está ON (9 slots)
      eyes, eyebrows, nose, lips, forehead,
      jawline, hairline, skin, full_face
    },
    params: {             ← solo si toggle B está ON
      43 COMBO params de AION
    },
    prompt: "..."         ← solo si toggle C está ON
  }
  Server:  POST ComfyDeploy /api/run/deployment/queue
           deployment_id: c6e6b7f0-e574-4aa8-9012-54e8507202e2
           inputs: { photo_type, "imagen final": "Nano Banana Pro", ...images, ...params, prompt? }
           ⚠️  "imagen final" es el prefijo del nombre del archivo de salida — siempre "Nano Banana Pro"
  Browser: polling GET /api/status/:runId cada 8s
  Result:  URL de imagen de rostro → se muestra en pantalla

PASO 2 — Prompt de cuerpo con Claude
  Browser: POST /api/generate-body-prompt { nombre, nicho, face_description }
           face_description = texto construido desde los inputs manuales del usuario
  Server:  POST Anthropic /v1/messages — Claude genera prompt de cuerpo
  Result:  prompt de texto para ComfyDeploy

PASO 3 — Generación de cuerpo
  Browser: POST /api/generate-body { prompt, input_image: <url_rostro> }
  Server:  POST ComfyDeploy /api/run/deployment/queue
           deployment_id: cabf22a3-a697-485c-a6df-b6c09ee4f2f1
  Browser: polling GET /api/status/:runId cada 8s
  Result:  URL de imagen de cuerpo → se muestra en pantalla

PASO 4 — Perfil AI Persona
  Browser: POST /api/generate-persona { nombre, nicho, face_url, body_url }
  Server:  POST Anthropic /v1/messages — Claude recibe ambas imágenes + template en español
  Result:  perfil completo en texto → renderizado como profile card editable
```

### Upload de imágenes de referencia (Toggle A)

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

### Workflow deployment AION
- **Deployment ID:** `c6e6b7f0-e574-4aa8-9012-54e8507202e2`
- **Input `imagen final`:** siempre hardcodeado como `"Nano Banana Pro"` (prefijo del archivo de output SaveImage)
- **Input `photo_type`:** siempre enviado; default `"-- Not selected / System inferred --"`

### Arquitectura del workflow (v4 ExternalImage)
El workflow usa nodos `ExternalImage (ComfyUI Deploy)` conectados directamente al `AionThetaNode`. No hay `LoadImage` hardcodeados ni `Fast Groups Muter` para control de API. AION detecta internamente qué inputs recibió y activa el modo correspondiente.

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

### Toggle B — 43 COMBO params
Grupos: Demographics, Eyes, Eyebrows, Nose, Lips, Structure, Volumes, Hair, Skin, Defects, Expression.
Se incluyen en el payload solo si el toggle B está ON. Si OFF, las keys se omiten (AION usa defaults internos).

### Toggle C — Prompt libre
Texto libre que describe el rostro. Se incluye solo si toggle C está ON y hay texto escrito.

---

## API CALLS — FORMATO EXACTO

### ComfyDeploy — AION Face Generation
```
POST https://api.comfydeploy.com/api/run/deployment/queue
Authorization: Bearer {VITE_COMFYDEPLOY_API_KEY}
Content-Type: application/json

{
  "deployment_id": "c6e6b7f0-e574-4aa8-9012-54e8507202e2",
  "inputs": {
    "photo_type": "...",
    "imagen final": "Nano Banana Pro",
    "prompt": "...",              ← solo si toggle C ON
    "eyes": "https://...",        ← solo si toggle A ON y slot tiene imagen
    "eyebrows": "https://...",
    "nose": "https://...",
    "lips": "https://...",
    "forehead": "https://...",
    "jawline": "https://...",
    "hairline": "https://...",
    "skin": "https://...",
    "full_face": "https://...",
    "sex": "female",              ← solo si toggle B ON
    "ethnicity": "...",
    ... (hasta 43 COMBO params)
  }
}
→ { "run_id": "xxx" }
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

### Anthropic — Body Prompt
```
POST https://api.anthropic.com/v1/messages
{ "model": "claude-sonnet-4-6", "max_tokens": 500,
  "messages": [{ "role": "user", "content": "<instrucción con face_description>" }] }
```

### ComfyDeploy — Cuerpo
```
{ "deployment_id": "cabf22a3-a697-485c-a6df-b6c09ee4f2f1",
  "inputs": { "input_image": "<url_rostro>", "prompt": "...", "filename_prefix": "ComfyUI" } }
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

### ComfyDeploy — Polling
```
GET https://api.comfydeploy.com/api/run/{run_id}
→ { "status": "queued|running|started|uploading|success|failed|cancelled|timeout",
    "outputs": [{ "data": { [nodeKey]: [{ "url": "https://...", "type": "image/png" }] } }] }

Estados terminales: success, failed, cancelled, timeout
Polling cada 8 segundos.
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

---

## ENDPOINTS DEL SERVIDOR LOCAL

| Método | Ruta | Body | Descripción |
|---|---|---|---|
| `GET` | `/` | — | Sirve server-ui.html |
| `POST` | `/api/upload-image` | `{ name, data: base64, type }` | Sube imagen a Supabase Storage → `{ url }` |
| `POST` | `/api/generate-face` | `{ photo_type, images?, params?, prompt? }` | AION face generation |
| `POST` | `/api/generate-body-prompt` | `{ nombre, nicho, face_description }` | Claude genera prompt de cuerpo |
| `POST` | `/api/generate-body` | `{ prompt, input_image }` | Genera cuerpo en ComfyDeploy |
| `POST` | `/api/generate-persona` | `{ nombre, nicho, face_url, body_url }` | Claude genera AI Persona |
| `GET` | `/api/status/:runId` | — | Polling estado ComfyDeploy |
| `GET` | `/api/influencers` | — | Lista influencers guardadas |
| `POST` | `/api/influencers` | `{ nombre, nicho, face_url, body_url, persona }` | Guarda influencer |
| `POST` | `/api/influencers/:id/weeks` | `{ theme, summary, plan }` | Guarda semana |
| `POST` | `/api/generate-content-plan` | `{ persona, nombre, nicho, face_url, body_url, week_history }` | Plan semanal |
| `POST` | `/api/generate-content-day` | `{ face_url, body_url, prompts[4] }` | 1 run → 4 imágenes UGC |

---

## ARCHIVOS DEL PROYECTO

| Archivo | Función |
|---|---|
| `server.cjs` | Servidor local — pipeline completo |
| `server-ui.html` | UI — 3 toggles + upload + 43 params + 4-step pipeline |
| `iniciar.bat` | Lanzador Windows |
| `.env` | Variables de entorno (no commitear) |
| `.env.example` | Template de variables |
| `data/influencers.json` | Persistencia local |
| `CLAUDE.md` | Esta documentación |

---

## VARIABLES DE ENTORNO (`.env`)

```env
# REQUERIDAS
VITE_COMFYDEPLOY_API_KEY=
ANTHROPIC_API_KEY=

# DEPLOYMENT IDs activos
VITE_COMFYDEPLOY_AION_DEPLOYMENT_ID=c6e6b7f0-e574-4aa8-9012-54e8507202e2
VITE_COMFYDEPLOY_BODY_DEPLOYMENT_ID=cabf22a3-a697-485c-a6df-b6c09ee4f2f1
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
| 1 | Generación de Rostro AION | ComfyDeploy `c6e6b7f0` | ✅ Operativo |
| 2 | Prompt de Cuerpo | Anthropic `claude-sonnet-4-6` | ✅ Operativo |
| 3 | Generación de Cuerpo | ComfyDeploy `cabf22a3` | ✅ Operativo |
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

- **Sin AI face prompt** — El rostro es 100% manual vía AION.
- **ExternalImage nodes directos** — el workflow AION v4 conecta `ExternalImage` directo al `AionThetaNode`. Sin `LoadImage` hardcodeados. Input `None` = AION lo ignora.
- **Toggle = omit** — cuando un toggle está OFF, esas keys se omiten del payload completamente.
- **Upload Supabase antes de ComfyDeploy** — imágenes de referencia van a Supabase primero, luego URL pública a ComfyDeploy.
- **`imagen final` hardcodeado** — siempre `"Nano Banana Pro"`.
- **9 image slots** — `eyes, eyebrows, nose, lips, forehead, jawline, hairline, skin, full_face`.
- **`iniciar.bat` hace `taskkill`** — mata proceso Node previo antes de arrancar.
- **Polling cada 8 segundos** — ComfyDeploy tarda 1–5 minutos.
- **Fase 4: 1 run = 4 imágenes** — 5 runs en paralelo = 20 imágenes totales.
- **No necesita npm install** — `server.cjs` usa solo módulos nativos de Node.js.

---

## TROUBLESHOOTING

**Error "Not found" en rutas:** El proceso node viejo sigue corriendo. Correr `.\iniciar.bat` de nuevo.

**La imagen de rostro no aparece tras `success`:** Revisar terminal — buscar `OUTPUTS:`.

**Upload falla 403/404:**
- Verificar `VITE_SUPABASE_ANON_KEY` en `.env`
- Verificar bucket `zami-images` público con policy `FOR ALL TO anon`
- Reiniciar servidor tras cambiar `.env`

**ComfyDeploy error en `/api/generate-face`:** Verificar `VITE_COMFYDEPLOY_AION_DEPLOYMENT_ID` en `.env` y deployment `c6e6b7f0` activo.

**El servidor no lee cambios del `.env`:** Siempre `.\iniciar.bat` después de editar `.env`.

**Regla PowerShell:** Siempre `.\iniciar.bat` con `.\` — sin el punto barra falla.
