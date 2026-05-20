# Zami AI Studio — Documentación Técnica Completa

## INICIO DE SESIÓN — leer primero

Cuando el usuario diga **"vamos a trabajar"**, **"iniciemos"**, **"empecemos"**, **"start"** o cualquier frase de apertura, responde EXACTAMENTE con esto sin preguntar nada:

```
cd C:\Users\LENOVO\zami-ai-studio
git pull origin claude/virtual-influencer-face-gen-ZDwju
.\iniciar.bat
```

Luego di: **"Abre http://127.0.0.1:3333 en el browser."**

No pidas confirmación. No preguntes por el .env. No expliques nada más.

---

## QUÉ ES ESTE PROYECTO

Automatización completa para crear influencers virtuales latinas con IA.
El usuario genera un personaje de cero — rostro, cuerpo y perfil de personalidad — todo desde un servidor local sin instalar nada extra.

**Stack operativo:**
- `server.cjs` — servidor Node.js local, cerebro de la automatización
- `server-ui.html` — interfaz visual en el browser (todo en un solo HTML)
- `iniciar.bat` — lanzador Windows
- `.env` — variables de entorno (nunca commitear)

**Rama activa:** `claude/virtual-influencer-face-gen-ZDwju`
Todo el desarrollo va aquí. Nunca pushear a `main` sin permiso explícito.

---

## CÓMO FUNCIONA EL SERVIDOR

`iniciar.bat` mata cualquier proceso Node previo (`taskkill`) y lanza `node server.cjs`.
El browser abre `http://127.0.0.1:3333` — siempre IPv4, nunca `localhost`.
El servidor lee `.env` automáticamente al arrancar. No necesita `npm install`.

### Flujo completo Fase 1 → 2 → 3

```
FASE 1 — Rostro
  Browser: POST /api/generate { prompt, count }
  Server:  POST ComfyDeploy /api/run/deployment/queue
           deployment_id: d3e4cb7d-8f44-405f-9607-99a58cfb1183
           inputs: { Prompt: "...", filename_prefix: "ComfyUI" }
  Browser: polling GET /api/status/:runId cada 8s
  Result:  imagen(es) de rostro — cuadrícula 2x2, 4 vistas del mismo personaje
           Cada imagen tiene botón SELECCIONAR

FASE 2 — Cuerpo
  Usuario: clic SELECCIONAR en una imagen de Fase 1
  Browser: POST /api/generate-body { prompt, input_image: <url_rostro> }
  Server:  POST ComfyDeploy /api/run/deployment/queue
           deployment_id: cabf22a3-a697-485c-a6df-b6c09ee4f2f1
           inputs: { input_image: "...", prompt: "...", filename_prefix: "ComfyUI" }
  Browser: polling GET /api/status/:runId cada 8s
  Result:  imagen de cuerpo completo basada en el rostro seleccionado
           Tiene botón SELECCIONAR

FASE 3 — Perfil AI Persona
  Usuario: clic SELECCIONAR en imagen de cuerpo (Fase 2)
           escribe NOMBRE de la influencer
           escribe NICHO de contenido
  Browser: POST /api/generate-persona { nombre, nicho, face_url, body_url }
  Server:  POST Anthropic API /v1/messages
           model: claude-sonnet-4-6
           Adjunta imagen de rostro + imagen de cuerpo como contexto visual
           Prompt en español con template completo de perfil
  Result:  perfil completo en español, renderizado como profile card:
           - Hero con fotos de rostro y cuerpo lado a lado
           - Nombre, handle, edad, nicho destacados
           - Grid de secciones con todos los campos
           - Cada campo es editable con clic directo
           - Botón "Copiar perfil" extrae el texto editado
```

---

## API CALLS — FORMATO EXACTO

### ComfyDeploy — Queue Run
```
POST https://api.comfydeploy.com/api/run/deployment/queue
Authorization: Bearer {VITE_COMFYDEPLOY_API_KEY}
Content-Type: application/json

# Fase 1
{ "deployment_id": "d3e4cb7d-8f44-405f-9607-99a58cfb1183",
  "inputs": { "Prompt": "...", "filename_prefix": "ComfyUI" } }
  ⚠️  "Prompt" con P MAYÚSCULA — si va en minúscula falla silenciosamente

# Fase 2
{ "deployment_id": "cabf22a3-a697-485c-a6df-b6c09ee4f2f1",
  "inputs": { "input_image": "<url>", "prompt": "...", "filename_prefix": "ComfyUI" } }

→ { "run_id": "xxx" }
```

### ComfyDeploy — Polling de estado
```
GET https://api.comfydeploy.com/api/run/{run_id}
→ { "status": "queued|running|started|uploading|success|failed|cancelled|timeout",
    "outputs": [{ "data": { "images": [{ "url": "https://...", "type": "image/png" }] } }] }

Estados terminales: success, failed, cancelled, timeout
El browser hace polling cada 8 segundos hasta recibir uno de esos estados.
```

### Anthropic API — Fase 3
```
POST https://api.anthropic.com/v1/messages
x-api-key: {ANTHROPIC_API_KEY}
anthropic-version: 2023-06-01
Content-Type: application/json

{
  "model": "claude-sonnet-4-6",
  "max_tokens": 4000,
  "messages": [{
    "role": "user",
    "content": [
      { "type": "image", "source": { "type": "url", "url": "<face_url>" } },
      { "type": "image", "source": { "type": "url", "url": "<body_url>" } },
      { "type": "text", "text": "<prompt en español con template completo>" }
    ]
  }]
}
→ { "content": [{ "text": "<perfil completo en español>" }] }

Claude recibe ambas imágenes para describir con precisión: tono de piel,
color de ojos, cabello y rasgos físicos reales del personaje generado.
```

---

## ENDPOINTS DEL SERVIDOR LOCAL

| Método | Ruta | Body | Descripción |
|---|---|---|---|
| `GET` | `/` | — | Sirve server-ui.html |
| `POST` | `/api/generate` | `{ prompt, count }` | Fase 1 — genera rostro(s) |
| `POST` | `/api/generate-body` | `{ prompt, input_image }` | Fase 2 — genera cuerpo |
| `POST` | `/api/generate-persona` | `{ nombre, nicho, face_url, body_url }` | Fase 3 — genera perfil |
| `GET` | `/api/status/:runId` | — | Polling ComfyDeploy (Fases 1 y 2) |

---

## UI — FLUJO VISUAL (server-ui.html)

```
┌─────────────────────────────────────────┐
│  FASE 1 — Generación de Rostro          │
│  [textarea prompt] [cantidad 1-4]       │
│  [Generar]                              │
│  ┌──────┐ ┌──────┐                      │
│  │img 1 │ │img 2 │  ← botón SELECCIONAR │
│  └──────┘ └──────┘    en cada imagen    │
├─────────────────────────────────────────┤
│  FASE 2 — Generación de Cuerpo          │
│  [thumb rostro ✓]                       │
│  [textarea prompt cuerpo]               │
│  [Generar cuerpo]                       │
│  ┌──────┐                               │
│  │cuerpo│ ← botón SELECCIONAR           │
│  └──────┘                               │
├─────────────────────────────────────────┤
│  FASE 3 — Perfil AI Persona             │
│  [thumb rostro ✓] [thumb cuerpo ✓]      │
│  [NOMBRE] [NICHO]                       │
│  [Generar Perfil]                       │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ [FOTO ROSTRO] [FOTO CUERPO]     │    │
│  │ Nombre grande · @handle         │    │
│  │ Edad · Signo · Nicho tag        │    │
│  ├─────────────────────────────────┤    │
│  │ Alias │ Físico │ Origen         │    │
│  │ Vida  │ Comida │ Música         │    │
│  │ TV    │ Hobbies│ Digital        │    │
│  │ Fans  │ Mods   │ Personalidad   │    │
│  └─────────────────────────────────┘    │
│  [Copiar perfil]                        │
│  (cada campo es editable con clic)      │
└─────────────────────────────────────────┘
```

---

## ARCHIVOS DEL PROYECTO

### Operativos ahora mismo
| Archivo | Función |
|---|---|
| `server.cjs` | Servidor proxy local — Fases 1, 2 y 3 completamente operativas |
| `server-ui.html` | UI completa — Fases 1, 2, 3 integradas y funcionando |
| `iniciar.bat` | Lanzador Windows — mata node previo, arranca server, abre browser |
| `.env` | Variables de entorno (no commitear nunca) |
| `.env.example` | Template de variables para configurar el proyecto |
| `docs/aion-parameters.md` | Referencia de parámetros AION para prompts de Fase 1 |
| `docs/latina-profiles.md` | 3 perfiles étnicos pre-diseñados listos para usar en Fase 1 |

### Futura app React (Fases 1–6 — pendiente de completar .env)
| Archivo | Función |
|---|---|
| `src/phases/Phase1Face.jsx` | UI React Fase 1 |
| `src/phases/Phase2Body.jsx` | UI React Fase 2 |
| `src/phases/Phase3Profile.jsx` | UI React Fase 3 |
| `src/phases/Phase4Content.jsx` | UI React Fase 4 |
| `src/phases/Phase5Publish.jsx` | UI React Fase 5 |
| `src/phases/Phase6KPI.jsx` | UI React Fase 6 |
| `src/api/comfydeploy.js` | Cliente ComfyDeploy para React |
| `src/api/fal.js` | Cliente Fal.IA para React |
| `src/lib/supabase.js` | Cliente Supabase para React |
| `supabase/schema.sql` | Schema de base de datos (ejecutar una vez en Supabase) |

---

## VARIABLES DE ENTORNO (`.env`)

```env
# REQUERIDAS para que funcione la automatización actual
VITE_COMFYDEPLOY_API_KEY=       ← Fases 1 y 2 (generación de imágenes)
ANTHROPIC_API_KEY=              ← Fase 3 (generación de perfil con Claude)

# DEPLOYMENT IDs activos
VITE_COMFYDEPLOY_FACE_DEPLOYMENT_ID=d3e4cb7d-8f44-405f-9607-99a58cfb1183
VITE_COMFYDEPLOY_BODY_DEPLOYMENT_ID=cabf22a3-a697-485c-a6df-b6c09ee4f2f1

# PENDIENTES para fases futuras
VITE_COMFYDEPLOY_NSFW_DEPLOYMENT_ID=
VITE_FAL_API_KEY=               ← Fase 4 contenido SFW
VITE_SUPABASE_URL=https://vtyuylgfjvleywupbdzl.supabase.co
VITE_SUPABASE_ANON_KEY=         ← Fases 5 y 6
```

---

## ESTADO DEL PIPELINE

| Fase | Nombre | Motor | Estado |
|---|---|---|---|
| 1 | Generación de Rostro | ComfyDeploy `d3e4cb7d` — Gemini Image | ✅ Operativo |
| 2 | Generación de Cuerpo | ComfyDeploy `cabf22a3` | ✅ Operativo |
| 3 | Perfil AI Persona | Anthropic `claude-sonnet-4-6` — texto puro en español | ✅ Operativo |
| 4 | Contenido SFW | Fal.IA | ⏳ Falta `VITE_FAL_API_KEY` |
| 4 | Contenido NSFW | ComfyDeploy | ⏳ Falta deployment_id |
| 5 | Publicación | Por definir | ⏳ |
| 6 | KPIs | Supabase | ⏳ Falta configurar Supabase |

**Siguiente paso: Fase 4 — Generación de Contenido**

---

## DECISIONES TÉCNICAS IMPORTANTES

- **Fase 3 envía imágenes a Claude** — rostro y cuerpo se adjuntan al llamado para que Claude describa con precisión tono de piel, ojos, cabello y rasgos físicos reales. El template está limpio (sin contenido explícito) por lo que las imágenes pasan sin bloqueos de política.
- **Prompt de Fase 3 en español** — todo el template y la instrucción están en español para que Claude responda en español.
- **Campos editables** — el profile card usa `contenteditable="true"` en cada valor. El usuario edita directo en pantalla sin formularios.
- **`iniciar.bat` hace `taskkill`** — mata cualquier proceso Node previo antes de arrancar. Esto evita el error clásico de "Not found" por servidor viejo en el puerto 3333.
- **Polling cada 8 segundos** — ComfyDeploy puede tardar 1–5 minutos. El browser sigue preguntando automáticamente hasta recibir `success`, `failed`, `cancelled` o `timeout`.

---

## TROUBLESHOOTING

**Error "Not found" en rutas del servidor:**
El proceso node viejo sigue corriendo. Correr `.\iniciar.bat` de nuevo (el bat hace `taskkill` automático). Si persiste, matar manualmente desde el Administrador de Tareas.

**La imagen no aparece tras `success`:**
Revisar la terminal — buscar `OUTPUTS:` para ver el JSON crudo de la API.

**Fase 3 da error de Anthropic:**
Verificar que `ANTHROPIC_API_KEY` esté en el `.env` y que el servidor se haya reiniciado después de agregarlo.

**El servidor no lee cambios del `.env`:**
Siempre reiniciar con `.\iniciar.bat` después de editar el `.env`.

**Regla PowerShell:** Siempre `.\iniciar.bat` con el `.\` — sin el punto barra falla.
