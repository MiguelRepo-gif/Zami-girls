# Handoff 2026-06-08 - Fase 4C ComfyUI Cloud

Este documento resume donde queda la automatizacion "Mas Sexy" para que otro chat pueda continuar sin rehacer investigacion.

## Estado actual

- Proyecto local: `C:\Users\LENOVO\zami-ai-studio-dev`
- Rama objetivo: `main`
- La automatizacion local esta actualizada hasta el punto actual.
- No se puede completar una prueba real de generacion ahora porque se acabaron los creditos en ComfyUI Cloud.
- Cuando haya creditos, la siguiente prueba debe hacerse desde `http://127.0.0.1:3333` con el boton `Mas Sexy`.

## Cambios aplicados

- `server.cjs` monitorea runs `ccsx:` cada 3 segundos.
- El monitor consulta:
  - `GET https://cloud.comfy.org/api/prompt`
  - `GET https://cloud.comfy.org/api/job/{job_id}/status`
  - `GET https://cloud.comfy.org/api/jobs/{job_id}`
  - `GET https://cloud.comfy.org/api/view`
- Se aceptan `completed` y `success` como estados terminales de exito.
- Las imagenes se extraen desde `outputs[*].images`.
- El filtro/orden usa `display_name` con patron `ZSEXY\d+`.
- La URL publica se resuelve con `filename` real por `/api/view`.
- El servidor solo devuelve `status: "success"` cuando tiene 10 URLs ZSEXY resueltas.
- `server-ui.html` hace polling cada 3 segundos y soporta `retrying`.
- `safeJsonStringify()` limpia surrogates invalidos antes de llamar Anthropic.

## Workflow vigente

- Archivo: `data/workflow-sexy-contexto.json`
- Nodo 676: genera exactamente 10 prompts.
- Nodo 676: `model.temperature = 0.7`
- Nodo 678: `inputs.sep = "*"`
- Separador vigente: `*`
- No usar `|||ZAMI_PROMPT_SEPARATOR|||` en este workflow.

## Error conocido

Error observado en ComfyUI:

```text
Exception: Field 'prompt' cannot be empty.
Node Type: ByteDanceSeedreamNodeV2
```

Causa tecnica: algun item despues del split llega vacio al nodo de imagen. En la prueba fallida vista, ComfyUI mostro en preview del nodo Claude: `Empty response from Claude model`. La API devolvio el error del nodo y `outputs_count: 0`, pero no devolvio esa preview completa como texto recuperable.

## Prueba pendiente cuando haya creditos

```powershell
cd C:\Users\LENOVO\zami-ai-studio-dev
node --check server.cjs
```

```powershell
cd C:\Users\LENOVO\zami-ai-studio-dev
.\iniciar.bat
```

Abrir `http://127.0.0.1:3333`, seleccionar una imagen de contenido y hacer clic en `Mas Sexy`.

Confirmar:

- El panel avanza Subiendo / Analizando / Generando / Listo.
- El servidor imprime logs `CC-SEXY-MONITOR`.
- Se resuelven 10 imagenes ZSEXY.
- La UI muestra las 10 imagenes.
- El polling no queda infinito.
- La descarga funciona.

## Prompt para copiar y pegar en otro chat

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
