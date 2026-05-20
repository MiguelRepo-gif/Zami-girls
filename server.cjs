'use strict'

const http  = require('http')
const https = require('https')
const fs    = require('fs')
const path  = require('path')
const url   = require('url')

// ── load .env manually (no external deps) ───────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '.env')
  if (!fs.existsSync(envPath)) return
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/)
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  })
}
loadEnv()

const API_KEY            = process.env.VITE_COMFYDEPLOY_API_KEY || ''
const ANTHROPIC_KEY      = process.env.ANTHROPIC_API_KEY || ''
const DEPLOYMENT_ID      = 'd3e4cb7d-8f44-405f-9607-99a58cfb1183'
const DEPLOYMENT_ID_BODY = 'cabf22a3-a697-485c-a6df-b6c09ee4f2f1'
const PORT               = 3333
const HOST               = '127.0.0.1'
const CD_BASE            = 'api.comfydeploy.com'

// ── ComfyDeploy helpers ──────────────────────────────────────────────────────
function cdRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const opts = {
      hostname: CD_BASE,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type':  'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }
    const req = https.request(opts, res => {
      let raw = ''
      res.on('data', d => raw += d)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }) }
        catch { resolve({ status: res.statusCode, body: raw }) }
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function startRun(prompt) {
  const res = await cdRequest('POST', `/api/run/deployment/queue`, {
    deployment_id: DEPLOYMENT_ID,
    inputs: { Prompt: String(prompt), filename_prefix: 'ComfyUI' },
  })
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`ComfyDeploy ${res.status}: ${JSON.stringify(res.body)}`)
  }
  return res.body.run_id
}

async function startBodyRun(prompt, inputImage) {
  const res = await cdRequest('POST', `/api/run/deployment/queue`, {
    deployment_id: DEPLOYMENT_ID_BODY,
    inputs: {
      input_image:     String(inputImage),
      filename_prefix: 'ComfyUI',
      prompt:          String(prompt),
    },
  })
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`ComfyDeploy ${res.status}: ${JSON.stringify(res.body)}`)
  }
  return res.body.run_id
}

// ── Generador de AI Persona — Claude API ─────────────────────────────────────

async function generatePersona(nombre, nicho, faceUrl, bodyUrl) {
  const content = []
  if (faceUrl) content.push({ type: 'image', source: { type: 'url', url: faceUrl } })
  if (bodyUrl) content.push({ type: 'image', source: { type: 'url', url: bodyUrl } })
  content.push({ type: 'text', text: `Eres un experto en crear perfiles de influencers virtuales para redes sociales y contenido digital.

Datos del personaje:
- Nombre artístico: ${nombre}
- Nicho de contenido: ${nicho}

${faceUrl ? 'Te adjunto la imagen del ROSTRO — úsala para describir con precisión: color de ojos, tono de piel, color y estilo de cabello, rasgos distintivos (lunares, pecas, etc.).' : ''}
${bodyUrl ? 'Te adjunto la imagen del CUERPO — úsala para describir: altura estimada, constitución física y cualquier rasgo visible.' : ''}

Llena CADA campo de forma creativa, específica y coherente con el nicho y las imágenes. Hazla carismática, única y atractiva. Responde TODO en español. Escribe SOLO el template llenado, sin comentarios adicionales.

💎 AI PERSONA TEMPLATE 💋

📛 Alias
Stage Name: ${nombre}
Nombre Real: ___
Usuario/Handle: @___
Apodos: ___
Edad: ___
Cumpleaños: ___
Signo Zodiacal: ___

📏 Físico & Apariencia
Altura: ___
Talla de zapatos: ___
Color/Estilo de cabello: ___
Color de ojos: ___
Tono de piel: ___
Rasgos Distintivos (lunares, pecas, etc.): ___

🌍 Origen & Ubicación
Etnicidad: ___
Ciudad natal (lo que creen los fans): ___
Ubicación actual (lo que asumen los fans): ___
Cómo la conocieron los fans (momentos virales, rumores): ___

🐾 Estilo de Vida
Mascotas (nombre + tipo): ___
Trabajo (si aplica): ___
Familia (público o privado): ___

🍣 Favoritos & Antojos
Comida favorita: ___
Restaurante favorito: ___
Trago/Bebida favorita: ___
Comida trampa: ___

🎵 Vibe Musical
Géneros musicales: ___
Artistas favoritos: ___
Canción de cabecera: ___

🎬 Entretenimiento
Géneros favoritos de películas/series: ___
Series o películas top: ___
Lo que ve para relajarse: ___

💫 Hobbies & Hábitos
(lista 3–5): ___
Talento secreto: ___

📲 Huella Digital
Emojis más usados: ___
Frases típicas en mensajes:
 - "___"
 - "___"
 - "___"
Estilo al escribir (argot, coqueta, formal, reina de los audios, etc.): ___

🔥 Persona de Contenido
Nicho: ${nicho}
Estilo de representación (glam, chica de al lado, dominante, etc.): ___
Temas recurrentes: ___
Lo que más les gusta a sus fans: ___

🖋️ Modificaciones Corporales
Tatuajes: ___
Piercings: ___
Cicatrices/Marcas de nacimiento: ___

🧠 Personalidad
3 Palabras que la describen: ___ ___ ___
Nivel de coqueteo: 😇 Bajo / 😏 Medio / 😈 Alto
Arquetipo (ej. femme fatale, chica de al lado, CEO baddie): ___
Fantasía principal que encarna para sus fans: ___` })

  const payload = JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content }],
  })

  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key':         ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
        'content-length':    Buffer.byteLength(payload),
      },
    }
    const req = https.request(opts, res => {
      let raw = ''
      res.on('data', d => raw += d)
      res.on('end', () => {
        try {
          const data = JSON.parse(raw)
          if (res.statusCode !== 200) throw new Error(`Anthropic ${res.statusCode}: ${JSON.stringify(data)}`)
          resolve(data.content[0].text)
        } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

async function getRun(runId) {
  const res = await cdRequest('GET', `/api/run/${runId}`)
  if (res.status !== 200) throw new Error(`Poll ${res.status}`)
  return res.body
}

// ── extract images from ComfyDeploy outputs ──────────────────────────────────
// Real API format: outputs is an array of { data: { [nodeKey]: [{url, type, filename}] } }
function extractImages(outputs) {
  const results = []
  if (!outputs) return results

  if (Array.isArray(outputs)) {
    for (const out of outputs) {
      const data = out?.data
      if (!data || typeof data !== 'object') continue
      for (const key of Object.keys(data)) {
        const items = data[key]
        if (!Array.isArray(items)) continue
        for (const item of items) {
          if (typeof item === 'string' && item.startsWith('http')) results.push(item)
          else if (item?.url) results.push(item.url)
        }
      }
    }
    if (results.length) return results
  }

  // fallback: legacy flat object format
  if (typeof outputs === 'object' && Array.isArray(outputs.images)) {
    outputs.images.forEach(i => { if (i?.url) results.push(i.url); else if (typeof i === 'string') results.push(i) })
  }
  return results
}

// ── HTTP server ──────────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', d => raw += d)
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')) } catch { resolve({}) } })
    req.on('error', reject)
  })
}

function json(res, code, data) {
  const body = JSON.stringify(data)
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(body)
}

const server = http.createServer(async (req, res) => {
  const parsed  = url.parse(req.url, true)
  const pathname = parsed.pathname

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' })
    res.end()
    return
  }

  // Serve UI
  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    const html = fs.readFileSync(path.join(__dirname, 'server-ui.html'))
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
    return
  }

  // POST /api/generate
  if (req.method === 'POST' && pathname === '/api/generate') {
    try {
      const body  = await readBody(req)
      const count = Math.min(Math.max(parseInt(body.count) || 1, 1), 4)
      const prompt = (body.prompt || '').trim()
      if (!prompt) { json(res, 400, { error: 'prompt requerido' }); return }

      console.log(`\n[GENERATE] prompt="${prompt}" count=${count}`)

      const runIds = []
      for (let i = 0; i < count; i++) {
        const runId = await startRun(prompt, count)
        runIds.push(runId)
        console.log(`  run ${i + 1}/${count}: ${runId}`)
      }

      json(res, 200, { runIds })
    } catch (err) {
      console.error('[GENERATE ERROR]', err.message)
      json(res, 500, { error: err.message })
    }
    return
  }

  // POST /api/generate-body
  if (req.method === 'POST' && pathname === '/api/generate-body') {
    try {
      const body       = await readBody(req)
      const prompt     = (body.prompt || '').trim()
      const inputImage = (body.input_image || '').trim()
      if (!prompt)     { json(res, 400, { error: 'prompt requerido' }); return }
      if (!inputImage) { json(res, 400, { error: 'input_image requerido' }); return }

      console.log(`\n[GENERATE-BODY] prompt="${prompt}" input_image="${inputImage.slice(0, 60)}..."`)

      const runId = await startBodyRun(prompt, inputImage)
      console.log(`  run: ${runId}`)

      json(res, 200, { runIds: [runId] })
    } catch (err) {
      console.error('[GENERATE-BODY ERROR]', err.message)
      json(res, 500, { error: err.message })
    }
    return
  }

  // POST /api/generate-persona
  if (req.method === 'POST' && pathname === '/api/generate-persona') {
    try {
      const body   = await readBody(req)
      const nombre = (body.nombre || '').trim()
      const nicho  = (body.nicho  || '').trim()

      const faceUrl = (body.face_url || '').trim()
      const bodyUrl = (body.body_url || '').trim()

      if (!nombre) { json(res, 400, { error: 'nombre requerido' }); return }
      if (!nicho)  { json(res, 400, { error: 'nicho requerido' }); return }
      if (!ANTHROPIC_KEY) { json(res, 500, { error: 'Agrega ANTHROPIC_API_KEY en tu .env' }); return }

      console.log(`\n[GENERATE-PERSONA] nombre="${nombre}" nicho="${nicho}" face=${!!faceUrl} body=${!!bodyUrl}`)

      const persona = await generatePersona(nombre, nicho, faceUrl, bodyUrl)
      console.log(`  persona generada (${persona.length} chars)`)

      json(res, 200, { persona })
    } catch (err) {
      console.error('[GENERATE-PERSONA ERROR]', err.message)
      json(res, 500, { error: err.message })
    }
    return
  }

  // GET /api/status/:runId
  const statusMatch = pathname.match(/^\/api\/status\/([^/]+)$/)
  if (req.method === 'GET' && statusMatch) {
    try {
      const runId = statusMatch[1]
      const data  = await getRun(runId)

      const st = data.status || ''

      if (st === 'success') {
        console.log(`\n[STATUS] ${runId} → success`)
        console.log('OUTPUTS:', JSON.stringify(data.outputs, null, 2))
        const images = extractImages(data.outputs)
        console.log(`  images extracted: ${images.length}`)
        json(res, 200, { status: 'success', images })
      } else if (['failed', 'cancelled', 'timeout'].includes(st)) {
        console.log(`[STATUS] ${runId} → ${st}`)
        json(res, 200, { status: 'error', message: st })
      } else {
        json(res, 200, { status: 'running' })
      }
    } catch (err) {
      console.error('[STATUS ERROR]', err.message)
      json(res, 500, { error: err.message })
    }
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

server.listen(PORT, HOST, () => {
  console.log(`\n🚀 Zami AI Studio — Fase 1: Generación de Rostro`)
  console.log(`   http://${HOST}:${PORT}`)
  console.log(`   Deployment: ${DEPLOYMENT_ID}`)
  console.log(`   API key: ${API_KEY ? API_KEY.slice(0, 8) + '...' : '⚠️  NO CONFIGURADA'}`)
  console.log()
})
