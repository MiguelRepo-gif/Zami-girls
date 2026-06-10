# Guia de ejecucion F0-F5

Fuente de verdad: `CLAUDE.md`. Si esta guia contradice `CLAUDE.md`, se corrige esta guia.

## Estado real al 2026-06-10

- `main` local y `origin/main` apuntan a `297b68e`.
- F0 fue reconstruida en esta copia local: `/api/health`, tests con `node:test`, scripts `npm run check` / `npm test`, y CI de humo.
- Fase C de persistencia temporal para Railway fue implementada en la rama `codex/railway-preview`: `PERSISTENCE_DIR` / `RAILWAY_VOLUME_MOUNT_PATH`, `railway.json`, `npm start`, healthcheck y guia `docs/RAILWAY_PREVIEW.md`.
- F1 no estaba presente en el arbol real al iniciar esta continuacion: no existian `src/`, `public/` ni commits `3bd82d6`, `74cfd2b`, `f6da205`, `0ed1b7f` en la rama actual.
- Hay archivos locales sin trackear que no forman parte de esta guia: `.claude/`, `server-out.txt`, `server-err.txt`, `Fotos inspiracion...` y la copia anidada `UsersLENOVOzami-ai-studio-dev-infraestructura/`.

## Comandos base

```powershell
cd C:\Users\LENOVO\zami-ai-studio-dev
npm run check
npm test
```

```powershell
cd C:\Users\LENOVO\zami-ai-studio-dev
.\iniciar.bat
```

Abrir `http://127.0.0.1:3333`.

## F0 - Red de seguridad

Criterio de cierre:

- `GET /api/health` responde sin llamar APIs externas y sin exponer secrets.
- `node --check server.cjs` pasa.
- `node --test` pasa.
- GitHub Actions ejecuta `node --check server.cjs` y `node --test`.

## F1 - Modularizacion sin build step

Objetivo: partir el monolito sin cambiar comportamiento ni requerir `npm install`.

Orden recomendado:

1. Extraer utilidades puras ya cubiertas por tests.
2. Extraer configuracion/env.
3. Extraer parametros AION/body y normalizacion.
4. Extraer helpers HTTP/API.
5. Extraer rutas por dominios solo cuando la suite este verde entre pasos.
6. Mover UI a `public/` solo si se mantiene el mismo `GET /` y no cambia `iniciar.bat`.

Criterio de cierre:

- Misma app en `http://127.0.0.1:3333`.
- `npm run check` y `npm test` verdes despues de cada movimiento.
- No tocar payloads AION, ComfyDeploy, ComfyUI Cloud ni Anthropic sin test o justificacion explicita.

## F2 - Jobs + SSE

Objetivo: que el servidor sea el orquestador persistente y la UI observe.

Criterio de cierre:

- Jobs sobreviven a refresh del browser.
- AI Persona se puede reintentar sin regenerar imagenes.
- Dos clientes ven el mismo estado del job.
- Estados y timers salen del servidor, no de simulaciones de UI.

## F3 - UI profesional

Criterio de cierre:

- Vistas separadas para Crear, Influencers y Contenido.
- Sin `alert()`.
- Lightbox y detalle editable de influencer.
- Contraste correcto: todo boton lime `#C8FF00` usa `color: #000`.

## F4 - Equipo + Railway

Criterio de cierre:

- Auth por token de equipo.
- CORS real.
- Rate limit.
- Plan de migracion Supabase con DDL antes de mover persistencia.

## Fase C - Persistencia temporal Railway

Criterio de cierre:

- La app usa `./data` localmente si no hay configuracion extra.
- Railway puede usar un Volume montado en `/data` configurando `PERSISTENCE_DIR=/data`.
- `/api/health` muestra `storage.persistence_mode = "external-file"` cuando se usa volumen.
- `npm start` arranca el servidor para Railway.
- `railway.json` define `startCommand` y `healthcheckPath`.
- Esta persistencia es temporal y de archivo; no sustituye Supabase/Postgres para produccion.

## F5 - Robustez backend

Criterio de cierre:

- Cliente Anthropic unico con retry/backoff y timeouts.
- Errores externos devuelven mensajes accionables.
- Tests cubren reintentos, timeouts y fallos terminales.

## Invariantes que no se rompen

- `iniciar.bat` sigue arrancando la app sin `npm install`.
- `GET /` sigue sirviendo la UI.
- `GET /hero-photo.png` sigue usando `Foto inicio/Nano Banana Pro_00001_.png`.
- `photo_type`, `imagen rostro`, `save_image`, `prompt_body`, `ZCS`, `ZSEXY` y prefijos `cdc:` / `ccsx:` conservan sus contratos actuales.
- Las rutas que gastan creditos no se prueban end-to-end sin aprobacion explicita.
