'use strict'

const assert = require('assert/strict')
const { execFileSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const test = require('node:test')

const {
  BODY_PARAM_OPTIONS,
  buildHealthPayload,
  decodeBase64Image,
  extractImages,
  inferBodyParamOverridesFromText,
  looksLikeImage,
  normalizeAionPayload,
  publicCcSexyStatus,
  resolveDataDir,
  safeJsonStringify,
  sanitizeLoneSurrogates,
  server,
} = require('../server.cjs')

test('buildHealthPayload returns monitor-safe status without secrets', () => {
  const health = buildHealthPayload()

  assert.equal(health.ok, true)
  assert.equal(health.service, 'zami-ai-studio')
  assert.equal(health.version, 'v13')
  assert.equal(typeof health.uptime_seconds, 'number')
  assert.equal(typeof health.influencers, 'number')
  assert.equal(typeof health.apis.anthropic, 'boolean')
  assert.equal(typeof health.apis.comfydeploy, 'boolean')
  assert.equal(typeof health.apis.supabase_key, 'boolean')
  assert.ok(!JSON.stringify(health).includes(process.env.ANTHROPIC_API_KEY || '__missing__'))
  assert.ok(!JSON.stringify(health).includes(process.env.VITE_COMFYDEPLOY_API_KEY || '__missing__'))
})

test('GET /api/health responds over HTTP without external APIs', async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  try {
    const address = server.address()
    const res = await fetch(`http://127.0.0.1:${address.port}/api/health`)
    const body = await res.json()

    assert.equal(res.status, 200)
    assert.equal(body.ok, true)
    assert.equal(body.service, 'zami-ai-studio')
    assert.equal(typeof body.apis.comfydeploy, 'boolean')
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()))
  }
})

test('resolveDataDir resolves relative paths from project root', () => {
  assert.equal(resolveDataDir('tmp-persist'), path.resolve(__dirname, '..', 'tmp-persist'))
})

test('PERSISTENCE_DIR switches health to external-file storage', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zami-persist-'))
  const script = "const { buildHealthPayload } = require('./server.cjs'); console.log(JSON.stringify(buildHealthPayload().storage))"
  const raw = execFileSync(process.execPath, ['-e', script], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PERSISTENCE_DIR: tempDir },
    encoding: 'utf8',
  })
  const storage = JSON.parse(raw.trim())

  assert.equal(storage.persistence_dir, tempDir)
  assert.equal(storage.persistence_mode, 'external-file')
})

test('extractImages supports ComfyDeploy output arrays', () => {
  const outputs = [
    {
      data: {
        '14': [{ url: 'https://cdn.example/Nano%20Banana%20Pro_0001.png' }],
        '228': ['https://cdn.example/ComfyUI_0001.png'],
      },
    },
  ]

  assert.deepEqual(extractImages(outputs), [
    'https://cdn.example/Nano%20Banana%20Pro_0001.png',
    'https://cdn.example/ComfyUI_0001.png',
  ])
})

test('extractImages supports object image outputs', () => {
  const outputs = {
    images: [
      { url: 'https://cdn.example/ZCS1_0001.png' },
      'https://cdn.example/ZCS2_0001.png',
    ],
  }

  assert.deepEqual(extractImages(outputs), [
    'https://cdn.example/ZCS1_0001.png',
    'https://cdn.example/ZCS2_0001.png',
  ])
})

test('inferBodyParamOverridesFromText maps super curvy intent to strong enums', () => {
  const overrides = inferBodyParamOverridesFromText('súper curvy, trasero muy grande, cintura definida')

  assert.equal(overrides.body_type, 'curvy fuller figure')
  assert.equal(overrides.waist, 'very narrow waist extreme hourglass')
  assert.equal(overrides.glutes, 'massive oversized glutes ultra-exaggerated')
  assert.equal(overrides.hips, 'very wide hips')
  assert.equal(overrides.legs, 'full thick thighs')
})

test('normalizeAionPayload fills required unified workflow defaults', () => {
  const inputs = normalizeAionPayload({})

  assert.equal(inputs.photo_type, '-- Not selected / System inferred --')
  assert.equal(inputs['imagen rostro'], 'Nano Banana Pro')
  assert.equal(inputs.save_image, 'ComfyUI')
  assert.equal(inputs.model, 'gemini-3.1-pro-preview')
  assert.equal(inputs.image_model, 'Nano Banana Pro (gemini-3-pro-image-preview)')
  assert.equal(inputs.resolution, '512px')
  for (const key of Object.keys(BODY_PARAM_OPTIONS)) assert.equal(inputs[key], 'auto')
})

test('normalizeAionPayload rejects invalid enum values', () => {
  assert.throws(
    () => normalizeAionPayload({ glutes: 'gigantic impossible option' }),
    /body param glutes invalido/,
  )
})

test('decodeBase64Image accepts real image signatures only', () => {
  const png1x1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
    'base64',
  )
  const decoded = decodeBase64Image(png1x1.toString('base64'), 'image/png')

  assert.equal(Buffer.compare(decoded, png1x1), 0)
  assert.equal(looksLikeImage(decoded, 'image/png'), true)
})

test('decodeBase64Image rejects mismatched declared image type', () => {
  const fakeJpeg = Buffer.from('not a jpeg').toString('base64')

  assert.throws(() => decodeBase64Image(fakeJpeg, 'image/jpeg'), /no coincide/)
})

test('safeJsonStringify removes lone surrogate code units', () => {
  const raw = { text: `ok${String.fromCharCode(0xd800)}done` }

  assert.equal(sanitizeLoneSurrogates(raw.text), 'okdone')
  assert.equal(safeJsonStringify(raw), '{"text":"okdone"}')
})

test('publicCcSexyStatus exposes compact client status', () => {
  const status = publicCcSexyStatus({
    id: 'abc123',
    status: 'running',
    message: 'Generando',
    retryCount: 1,
    updatedAt: '2026-06-10T00:00:00.000Z',
    logs: Array.from({ length: 20 }, (_, i) => ({ event: `e${i}` })),
  })

  assert.equal(status.runId, 'ccsx:abc123')
  assert.equal(status.status, 'running')
  assert.equal(status.logs.length, 12)
  assert.equal(status.logs[0].event, 'e8')
})
