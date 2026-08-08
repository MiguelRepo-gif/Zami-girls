# Zami AI Studio — ZAMMY GIRLS

**Plataforma de automatización para crear y operar influencers virtuales con IA.**

> 🟢 **Esto es un despliegue real en producción, funcionando ahora mismo:**
> ### 👉 https://zami-girls-production.up.railway.app
>
> No es un prototipo ni una demo local. Es una aplicación web viva, con URL pública,
> que funciona 24/7 desde cualquier navegador y en cualquier computador, sin necesidad
> de instalar nada y sin depender de que ningún equipo esté encendido.

---

## Hola Miguel 👋

Este documento es tu punto de partida. Explica **qué hace la aplicación, cómo funciona por
dentro, qué se construyó, dónde está desplegada y qué sigue.** Está pensado para que puedas
retomar el desarrollo desde donde quedó, sin depender de nadie más.

Índice rápido:

1. [Qué hace esta automatización](#1-qué-hace-esta-automatización)
2. [Cómo funciona — el pipeline completo](#2-cómo-funciona--el-pipeline-completo)
3. [La aplicación en producción](#3-la-aplicación-en-producción)
4. [Qué es Railway y por qué se eligió](#4-qué-es-railway-y-por-qué-se-eligió)
5. [Dónde se guardan los datos y las imágenes](#5-dónde-se-guardan-los-datos-y-las-imágenes)
6. [Falta comprar el dominio](#6-falta-comprar-el-dominio)
7. [Arquitectura técnica](#7-arquitectura-técnica)
8. [Cómo trabajar en el proyecto](#8-cómo-trabajar-en-el-proyecto)
9. [Costos que debes conocer](#9-costos-que-debes-conocer)
10. [Estado actual y qué sigue](#10-estado-actual-y-qué-sigue)

---

## 1. Qué hace esta automatización

La aplicación crea **influencers virtuales completas** —cualquier etnia, cualquier nicho— y
les genera contenido de redes sociales de forma automática. En la práctica:

| Paso | Qué hace la app | Trabajo manual que reemplaza |
|---|---|---|
| **Crear la influencer** | Describes en español "mujer española, 25 años, pelo rizado, nicho fitness" y la IA genera su **rostro** y su **cuerpo** coherentes entre sí | Sesión de fotos, casting, modelo real |
| **Perfil de personalidad** | La IA analiza las fotos y escribe una **AI Persona** completa: historia, tono de voz, intereses, forma de hablar | Trabajo de un estratega de marca |
| **2 semanas de contenido** | Con un clic genera **16 fotos** listas para publicar, cada una con su caption, hashtags y formato correcto (9:16, 1:1, 4:5, 3:4) | Semanas de producción de contenido |
| **Versión "Más Sexy"** | Cualquier foto puede regenerarse en **10 variantes** más atrevidas, manteniendo la misma cara, el mismo cuerpo y el mismo lugar | Otra sesión completa |

Lo importante: **la influencer es siempre la misma persona.** El rostro no cambia entre
fotos, el cuerpo no cambia, y la personalidad se mantiene coherente semana a semana. Ese es
el problema difícil que esta automatización resuelve.

---

## 2. Cómo funciona — el pipeline completo

```
   TÚ ESCRIBES                    LA IA HACE                      RESULTADO
   ───────────                    ──────────                      ─────────

   "mujer española,      ┌──►  Claude elige 51 parámetros    ┌──►  ROSTRO
    pelo rizado,   ──────┤     técnicos del rostro y cuerpo  ┤
    nicho fitness"       └──►  ComfyDeploy genera la imagen  └──►  CUERPO

                              Claude mira las 2 fotos
   (automático)     ─────────► y escribe la personalidad  ────────►  AI PERSONA

                              Claude diseña el plan de la
   1 clic           ─────────► semana + ComfyDeploy genera ────────►  16 FOTOS
                              8 fotos por semana × 2              + captions
                                                                   + hashtags

   Clic "Más Sexy"  ─────────► ComfyUI Cloud regenera      ────────►  10 FOTOS
   sobre una foto              la escena en 10 variantes             de esa escena
```

### Los cuatro motores que usa

| Motor | Para qué se usa | Por qué |
|---|---|---|
| **Claude (Anthropic)** | Elegir parámetros del rostro, escribir la personalidad, diseñar el plan semanal y los prompts | Es el "cerebro" que toma decisiones creativas coherentes |
| **ComfyDeploy** | Generar el rostro, el cuerpo y las 16 fotos de contenido | Workflows de generación de imagen ya afinados |
| **ComfyUI Cloud** | Generar las 10 fotos "Más Sexy" | Permite un workflow más complejo con control fino |
| **Supabase** | Guardar las imágenes de forma permanente | Almacenamiento en la nube, URLs que no expiran |

### Las fases del pipeline

| Fase | Qué hace | Estado |
|---|---|---|
| 1 | Generación de rostro + cuerpo (modo manual y modo Claude) | ✅ Operativa |
| 2 | Parámetros de cuerpo (7 controles directos) | ✅ Operativa |
| 3 | Cuerpo integrado en el mismo run que el rostro | ✅ Operativa |
| 4 | Perfil AI Persona | ✅ Operativa |
| 4B | Contenido UGC — 2 semanas × 8 imágenes con un clic | ✅ Operativa |
| 4C | Botón "✦ Más Sexy" — 10 imágenes por foto | ✅ Operativa |
| **5** | **Publicación automática en redes** | ⏳ **Por construir** |
| **6** | **KPIs y analítica** | ⏳ **Por construir** |

---

## 3. La aplicación en producción

### Es una web app real, no un experimento

| Característica | Estado |
|---|---|
| URL pública en internet | ✅ https://zami-girls-production.up.railway.app |
| Funciona desde cualquier navegador | ✅ Chrome, Edge, Safari, móvil |
| Funciona sin encender ningún computador | ✅ corre 24/7 en la nube |
| Se puede compartir el link con quien sea | ✅ |
| Los datos sobreviven a reinicios y actualizaciones | ✅ volumen persistente |
| Monitoreo de salud automático | ✅ `/api/health` |

### Cómo comprobar que está viva

Abre esta dirección en el navegador:

```
https://zami-girls-production.up.railway.app/api/health
```

Verás algo así:

```json
{
  "ok": true,
  "service": "zami-ai-studio",
  "version": "v13",
  "uptime_seconds": 2564,
  "influencers": 2,
  "storage": { "persistence_mode": "external-file", "persistence_dir": "/data" },
  "apis": { "comfydeploy": true, "anthropic": true, "supabase_url": true,
            "supabase_key": true, "comfy_cloud": true }
}
```

Qué mirar:

- **`"ok": true`** → el servidor está vivo.
- **`persistence_mode: "external-file"`** → los datos se guardan en disco permanente. Si algún día
  dice `"local-file"`, significa que el volumen se desconectó y **los influencers se borrarían
  en la siguiente actualización**. Es la alarma más importante de todas.
- **`apis`** → todas deben estar en `true`. Si una está en `false`, falta configurar su clave.
- Esta página **nunca muestra las claves**, solo si están presentes. Es seguro compartirla.

---

## 4. Qué es Railway y por qué se eligió

### Qué es

**Railway** (https://railway.com) es un servicio de hosting en la nube. Le entregas tu código
desde GitHub y él lo mantiene ejecutándose permanentemente en un servidor con una dirección
pública de internet. Sustituye a tener un servidor propio o dejar un computador encendido.

Su funcionamiento clave: **despliegue continuo.** Cada vez que subes código nuevo a GitHub,
Railway lo detecta, lo construye y lo pone en línea automáticamente. No hay un botón de
"publicar" separado ni hay que subir archivos por FTP.

### Por qué se eligió Railway y no otra opción

Se evaluó **Netlify** primero, y quedó **descartado por una razón técnica concreta**:

> Esta aplicación es un **servidor Node.js persistente**. Mantiene estado en memoria
> (vigila los trabajos de generación de imágenes con un proceso que consulta cada 3 segundos
> durante varios minutos) y escribe en disco.
>
> Netlify solo ejecuta **funciones serverless**: procesos que arrancan, responden en menos de
> 60 segundos y mueren, sin memoria compartida ni disco propio. **Netlify no puede correr esta
> aplicación sin reescribirla por completo.**

Railway, en cambio, ejecuta el proceso Node tal cual, igual que en un computador local. Por eso:

| Ventaja | Qué significa para ti |
|---|---|
| **Cero reescritura** | El código que funcionaba en local funciona idéntico en producción |
| **Proceso siempre vivo** | Las generaciones de imágenes que tardan 2–5 minutos no se cortan |
| **Volumen persistente** | Los influencers guardados sobreviven a cada actualización |
| **Deploy automático** | Subes a GitHub y en minutos está en línea |
| **Healthcheck integrado** | Railway vigila `/api/health` y reinicia si algo falla |
| **Variables seguras** | Las claves de API viven en Railway, nunca en el código |

### Cómo se despliega una actualización

```
Editas el código  →  git push  →  Railway lo detecta  →  construye  →  en línea
                                                          (~2 min)
```

⚠️ **Importante:** Railway está conectado a **este repositorio** (`MiguelRepo-gif/Zami-girls`),
rama **`codex/railway-preview`**. Un `push` a esa rama **despliega directo a producción**.

⚠️ **Ojo con el botón "Redeploy"**: vuelve a desplegar el *mismo* commit anterior, **no** el
último de GitHub. Para publicar código nuevo hay que hacer `push`, o forzar un deploy del
commit más reciente desde el panel de Railway.

---

## 5. Dónde se guardan los datos y las imágenes

Hay **dos almacenamientos distintos** y conviene entender la diferencia:

### A. Los influencers → volumen de Railway

El archivo `data/influencers.json` guarda el registro de cada influencer: nombre, nicho,
personalidad, y el historial de semanas con sus captions y prompts.

Vive en un **Volume de Railway montado en `/data`**, un disco que sobrevive a reinicios y
actualizaciones. Configurado mediante la variable `PERSISTENCE_DIR=/data`.

### B. Las imágenes → Supabase Storage

Las fotos generadas **no** se guardan en Railway, sino en **Supabase Storage**, bucket
`zami-images` (proyecto `qbffzmwedjekufsgutff`).

**Por qué esto es importante:** ComfyDeploy y ComfyUI Cloud entregan las imágenes en URLs
temporales de Amazon S3 que **expiran**. Si se guardaran así, las fotos aparecerían rotas
al cabo de un tiempo.

Por eso la aplicación **copia automáticamente cada imagen generada a Supabase** en el momento
de guardarla, y almacena la URL permanente. Esto aplica a:

- El rostro y el cuerpo base de cada influencer
- Las 8 fotos de cada semana, al pulsar **"Guardar Semana"**

Y al seleccionar una influencer guardada, **sus semanas se repintan solas con sus fotos**,
captions y prompts.

> 🛡️ **Diseño a prueba de fallos:** si Supabase estuviera caído en ese momento, la semana se
> guarda igual conservando la URL original. **Nunca se pierde el trabajo por un fallo de
> almacenamiento.**

### Nota sobre las influencers ya existentes

Las influencers **Valentina** y **Martina** se crearon *antes* de que existiera la copia
automática a Supabase. Sus semanas están guardadas (temas, captions, prompts) pero **sin
fotos persistidas** — al abrirlas verás "Sin foto guardada". No es un error: es contenido
anterior a la mejora. Todo lo que generes de ahora en adelante sí queda guardado.

---

## 6. Falta comprar el dominio

Hoy la aplicación vive en la dirección que Railway asigna por defecto:

```
https://zami-girls-production.up.railway.app
```

Funciona perfectamente y es 100% pública, pero es una dirección técnica. **Para un producto
de marca conviene un dominio propio**, por ejemplo:

```
https://app.zammygirls.com
```

### Qué tienes que hacer

1. **Comprar el dominio** en cualquier registrador (Namecheap, GoDaddy, Google Domains,
   Cloudflare...). Cuesta entre 10 y 15 USD al año.
2. En Railway: abre el servicio → **Settings** → **Networking** → **Custom Domain**.
3. Railway te dará un registro **CNAME** para copiar.
4. Pega ese CNAME en el panel DNS de tu registrador.
5. Espera la propagación (de minutos a unas horas). Railway emite el **certificado HTTPS
   automáticamente** — no hay que comprar ni configurar nada de seguridad.

**No hay que tocar una sola línea de código para esto.** Es únicamente configuración, y la
dirección actual seguirá funcionando en paralelo.

---

## 7. Arquitectura técnica

### Los archivos que importan

| Archivo | Qué es |
|---|---|
| `server.cjs` | **El backend completo.** Servidor Node.js, todos los endpoints, la lógica de todas las fases |
| `server-ui.html` | **La interfaz completa.** Todo el frontend en un solo archivo: HTML, CSS y JavaScript |
| `iniciar.bat` | Lanzador para desarrollo en Windows |
| `data/workflow-sexy-contexto.json` | Workflow de ComfyUI Cloud para la Fase 4C |
| `Foto inicio/` | Foto del landing |
| `.env.example` | Plantilla de las variables de entorno necesarias |
| `CLAUDE.md` | **Documentación técnica profunda** — parámetros, formatos exactos de API, decisiones de diseño |
| `docs/RAILWAY_PREVIEW.md` | Guía de despliegue en Railway |
| `test/` | Tests automáticos |

### Decisión de diseño clave: cero dependencias

`server.cjs` usa **únicamente módulos nativos de Node.js**. No hay `node_modules`, no hay que
ejecutar `npm install`, no hay framework. Ventajas: arranca al instante, no se rompe por
actualizaciones de librerías de terceros, y no tiene vulnerabilidades heredadas.

La contrapartida: todo está en dos archivos grandes. Si el proyecto crece, en
`docs/GUIA_EJECUCION_REFACTOR_F0_F5.md` hay un plan por fases para modularizarlo sin romper nada.

### Principales endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/` | Sirve la interfaz |
| `GET` | `/api/health` | Estado del sistema (seguro, sin claves) |
| `POST` | `/api/claude-guided-face` | Claude elige los parámetros y lanza la generación |
| `POST` | `/api/generate-face` | Generación en modo manual |
| `POST` | `/api/generate-persona` | Genera la AI Persona |
| `POST` | `/api/generate-content-plan` | Claude diseña el plan de la semana |
| `POST` | `/api/generate-content-day` | Genera las 8 imágenes de la semana |
| `POST` | `/api/generate-sexy-from-content` | Genera las 10 imágenes "Más Sexy" |
| `GET` | `/api/status/:runId` | Consulta el progreso de una generación |
| `GET` | `/api/influencers` | Lista las influencers guardadas |
| `POST` | `/api/influencers` | Guarda una influencer |
| `POST` | `/api/influencers/:id/weeks` | Guarda una semana **y persiste sus fotos** |

---

## 8. Cómo trabajar en el proyecto

### Ejecutarlo en tu computador

```bash
git clone https://github.com/MiguelRepo-gif/Zami-girls.git
cd Zami-girls
```

Crea un archivo `.env` copiando `.env.example` y rellena las claves (las mismas que están en
Railway → Variables). Después:

```bash
npm start
```

Y abre `http://127.0.0.1:3333`. En Windows también sirve hacer doble clic en `iniciar.bat`.

### Comprobar que no rompiste nada

```bash
npm run check
npm test
```

Además, cada `push` a GitHub ejecuta estos mismos tests automáticamente (GitHub Actions).

### 🔐 Seguridad — lo más importante de esta sección

> **El archivo `.env` NUNCA debe subirse a GitHub.** Contiene las claves reales de Anthropic,
> ComfyDeploy, ComfyUI Cloud y Supabase. Está protegido en `.gitignore`, no lo quites de ahí.
>
> Si una clave se filtra en un repositorio, hay que **rotarla inmediatamente** en el panel del
> proveedor. En producción las claves viven en **Railway → Variables**, que es el lugar correcto.

**Cuidado al configurar variables en Railway:** en el campo *valor* va **solo el valor**, no
`NOMBRE=valor`. Y la URL de Supabase debe ser el dominio pelado
(`https://qbffzmwedjekufsgutff.supabase.co`), **sin** `/rest/v1/` al final. Ambos errores ya
ocurrieron y tumbaron las subidas de imágenes.

---

## 9. Costos que debes conocer

Esta aplicación consume servicios de pago. Conviene tenerlo claro desde el principio:

| Servicio | Para qué | Cómo cobra |
|---|---|---|
| **Railway** | Mantener la app en línea | Por uso, unos pocos USD al mes para una app de este tamaño |
| **Anthropic (Claude)** | El "cerebro" creativo | Por uso, según tokens |
| **ComfyDeploy** | Generar rostro, cuerpo y contenido | Créditos de GPU |
| **ComfyUI Cloud** | Fase 4C "Más Sexy" | Créditos |
| **Supabase** | Guardar imágenes | Plan gratuito suficiente al inicio |
| **Dominio** | Dirección propia | ~10–15 USD al año |

⚠️ Si **ComfyDeploy** se queda sin créditos, la generación falla con un error de
"Insufficient GPU credits". No es un fallo del código: hay que recargar en su panel.

---

## 10. Estado actual y qué sigue

### ✅ Lo que está listo y probado

- Pipeline completo funcionando de punta a punta
- Desplegado en producción con URL pública
- Persistencia de influencers en volumen de Railway
- Persistencia de imágenes en Supabase, verificada en producción
- Tests automáticos (13/13 pasando) y CI en cada push
- Endpoint de salud para monitoreo
- Documentación técnica en `CLAUDE.md`

### ⏳ Lo que sigue — el terreno para tu desarrollo

| Prioridad | Tarea |
|---|---|
| Alta | **Comprar y conectar el dominio propio** |
| Alta | **Fase 5: publicación automática** en Instagram / TikTok |
| Media | **Fase 6: KPIs y analítica** de rendimiento del contenido |
| Media | **Autenticación de usuarios** — hoy cualquiera con el link puede usar la app |
| Media | Migrar `influencers.json` a base de datos real (Supabase Postgres) si crece el volumen |
| Baja | Modularizar `server.cjs` y `server-ui.html` (plan en `docs/`) |

### 🔓 Nota honesta sobre seguridad

La aplicación **no tiene autenticación**: cualquiera con el link puede entrar y generar
contenido, lo que **consume tus créditos de pago**. Es adecuado para uso interno y pruebas
con el equipo, pero **antes de difundir el link públicamente** conviene añadir al menos una
contraseña o un token de acceso. Igualmente, `CORS` está abierto a cualquier origen.

---

## Resumen en una línea

**Tienes una aplicación web real, desplegada en producción, con almacenamiento permanente y
un pipeline de IA completo funcionando — lista para que sigas construyendo sobre ella.**

Para el detalle técnico fino (los 43 parámetros de rostro, los formatos exactos de cada API,
los IDs de los nodos de los workflows y las decisiones de diseño), la referencia completa
está en **[`CLAUDE.md`](CLAUDE.md)**.
