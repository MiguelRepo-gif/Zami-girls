# Zami AI Studio

Automatización para crear influencers virtuales con IA — cualquier etnia, cualquier nicho.
Genera rostro → cuerpo → perfil de personalidad completo desde un servidor local.

## Inicio rápido

```powershell
cd C:\Users\LENOVO\zami-ai-studio-dev
git pull origin main
.\iniciar.bat
# Abrir http://127.0.0.1:3333
```

## Configuración

Copia `.env.example` a `.env` y llena las variables:

```
VITE_COMFYDEPLOY_API_KEY=
ANTHROPIC_API_KEY=
VITE_SUPABASE_ANON_KEY=
```

Los Deployment IDs y la URL de Supabase ya están precargados en `.env.example`.

## Stack

- `server.cjs` — servidor Node.js (sin dependencias npm)
- `server-ui.html` — UI completa en un solo archivo
- `iniciar.bat` — lanzador Windows

## Documentación completa

Ver `CLAUDE.md` — arquitectura, endpoints, flujo completo y troubleshooting.
