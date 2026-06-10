# Railway Preview - Zami AI Studio

Objetivo: desplegar una preview para el equipo sin poner en riesgo la repo base.

## Rama segura

Usar una rama separada para Railway:

```powershell
cd C:\Users\LENOVO\zami-ai-studio-dev
git switch codex/railway-preview
```

No conectar Railway directamente a `main` hasta que el equipo valide la preview.

## Persistencia temporal

La app sigue usando `data/influencers.json` en local. En Railway puede usar un volumen temporal configurando:

```env
PERSISTENCE_DIR=/data
```

En Railway:

1. Crear un Volume.
2. Montarlo en `/data`.
3. Configurar la variable `PERSISTENCE_DIR=/data`.
4. Reiniciar el deploy.

Con eso `influencers.json` queda en el volumen y no se pierde en cada redeploy normal. Esto es temporal: para produccion real conviene migrar a Supabase/Postgres.

## Variables necesarias en Railway

Configurar en Railway, nunca commitear secrets:

```env
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-sonnet-4-6
VITE_COMFYDEPLOY_API_KEY=...
VITE_COMFYDEPLOY_AION_DEPLOYMENT_ID=e833a575-893b-49f2-8687-4aa5291d31cc
VITE_COMFYDEPLOY_CONTENT_DEPLOYMENT_ID=f9822b81-9ebc-48e2-b39c-0e8034e90554
COMFYCLOUD_API_KEY=...
VITE_SUPABASE_URL=https://vtyuylgfjvleywupbdzl.supabase.co
VITE_SUPABASE_ANON_KEY=...
SUPABASE_BUCKET=zami-images
PERSISTENCE_DIR=/data
```

Railway define `PORT` automaticamente. La app detecta Railway y escucha en `0.0.0.0`.

## Healthcheck

Railway usa:

```text
/api/health
```

Ese endpoint confirma:

- servidor vivo
- si hay APIs configuradas, sin mostrar keys
- si existe el archivo de influencers
- si la persistencia esta en `local-file` o `external-file`

## Prueba local antes de push

```powershell
cd C:\Users\LENOVO\zami-ai-studio-dev
npm run check
npm test
```

Prueba simulando Railway localmente:

```powershell
cd C:\Users\LENOVO\zami-ai-studio-dev
$env:PORT="3334"; $env:HOST="127.0.0.1"; $env:PERSISTENCE_DIR=".railway-data"; npm start
```

Abrir:

```text
http://127.0.0.1:3334/api/health
```

## Despliegue recomendado

1. Push de `codex/railway-preview` a GitHub.
2. Crear proyecto Railway desde GitHub.
3. Seleccionar la rama `codex/railway-preview`.
4. Agregar variables.
5. Crear volumen en `/data`.
6. Verificar `/api/health`.
7. Compartir la URL con el equipo.

## Limitacion conocida

Esta persistencia es temporal y de archivo. Sirve para preview de equipo, pero no es una base multiusuario robusta. Si dos instancias escriben al mismo tiempo o Railway escala replicas, hay riesgo de conflicto. Para produccion estable, migrar influencers/semanas a Supabase o Postgres.
