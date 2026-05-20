import { useState } from 'react'
import { Wand2, ImageIcon, Video, ChevronRight, Loader2, AlertCircle, Download } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { generateSFWImage, generateSFWVideo } from '../api/fal.js'
import { runDeployment, pollRun, extractBase64Images } from '../api/comfydeploy.js'

const NSFW_DEPLOYMENT_ID = import.meta.env.VITE_COMFYDEPLOY_NSFW_DEPLOYMENT_ID

const CONTENT_TYPES  = ['Image', 'Video']
const ASPECT_RATIOS  = ['9:16', '1:1', '4:5', '16:9']
const SFW_STYLES     = ['Lifestyle', 'Fitness', 'Fashion', 'Travel', 'Food', 'Beauty', 'Motivational']
const NSFW_STYLES    = ['Lingerie', 'Bikini', 'Artistic nude', 'Boudoir', 'Fantasy', 'Custom']

export default function Phase4Content({ model, onAdvance, onRefresh }) {
  const isNSFW = model.mode === 'NSFW'

  const [contentType, setContentType] = useState('Image')
  const [generating, setGenerating]   = useState(false)
  const [result, setResult]           = useState(null)
  const [error, setError]             = useState(null)
  const [params, setParams]           = useState({
    style: isNSFW ? 'Lingerie' : 'Lifestyle',
    aspect_ratio: '9:16',
    prompt: '',
    negative_prompt: '',
  })

  function set(key, val) { setParams(p => ({ ...p, [key]: val })) }

  async function handleGenerate() {
    if (!params.prompt.trim()) {
      setError('Escribe un prompt para generar el contenido.')
      return
    }
    setGenerating(true)
    setError(null)
    setResult(null)

    try {
      if (isNSFW) {
        const seed = Math.floor(Math.random() * 999_999_999_999_999)
        const runId = await runDeployment(NSFW_DEPLOYMENT_ID, {
          prompt: params.prompt,
          negative_prompt: params.negative_prompt,
          style: params.style,
          aspect_ratio: params.aspect_ratio,
          face_image_url: model.face_image_url || '',
          body_image_url: model.body_image_url || '',
          seed: String(seed),
          content_type: contentType.toLowerCase(),
        })
        const runResult = await pollRun(runId, () => {})
        const urls = extractBase64Images(runResult)
        setResult({ type: 'image', url: urls[0] })

      } else {
        if (contentType === 'Image') {
          const fullPrompt = `${params.style} photo, ${params.prompt}, professional photography, high quality`
          const urls = await generateSFWImage({ prompt: fullPrompt, aspectRatio: params.aspect_ratio })
          setResult({ type: 'image', url: urls[0] })
        } else {
          const fullPrompt = `${params.style} video content, ${params.prompt}, cinematic, professional`
          const url = await generateSFWVideo({ prompt: fullPrompt, aspectRatio: params.aspect_ratio })
          setResult({ type: 'video', url })
        }
      }

      if (result?.url) {
        await supabase.from('content_posts').insert({
          model_id: model.id,
          caption: params.prompt,
          image_prompt: params.prompt,
          aspect_ratio: params.aspect_ratio,
          image_url: result.url,
          status: 'done',
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Fase 4 — Generación de Contenido</h2>
        <p className="text-gray-500 text-sm">
          {isNSFW ? 'Contenido NSFW via ComfyDeploy.' : 'Contenido SFW via Fal.IA (Flux Pro).'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="card space-y-4 self-start">
          <div>
            <label className="label">Tipo</label>
            <div className="flex gap-2">
              {CONTENT_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setContentType(t)}
                  disabled={isNSFW && t === 'Video'}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                    contentType === t
                      ? 'bg-brand-pink/10 border-brand-pink text-brand-pink'
                      : 'border-brand-border text-gray-500 hover:border-brand-muted disabled:opacity-30'
                  }`}
                >
                  {t === 'Image' ? <ImageIcon size={13} /> : <Video size={13} />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Estilo</label>
            <select className="select text-sm" value={params.style} onChange={e => set('style', e.target.value)}>
              {(isNSFW ? NSFW_STYLES : SFW_STYLES).map(v => <option key={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Aspect ratio</label>
            <div className="flex gap-2 flex-wrap">
              {ASPECT_RATIOS.map(r => (
                <button
                  key={r}
                  onClick={() => set('aspect_ratio', r)}
                  className={`px-3 py-1 rounded-lg border text-xs transition-all ${
                    params.aspect_ratio === r
                      ? 'bg-brand-pink/10 border-brand-pink text-brand-pink'
                      : 'border-brand-border text-gray-500 hover:border-brand-muted'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Prompt *</label>
            <textarea className="input text-sm resize-none" rows={4} placeholder={isNSFW ? 'Describe la escena...' : 'Ej: at the beach, golden hour, laughing, casual style...'} value={params.prompt} onChange={e => set('prompt', e.target.value)} />
          </div>

          {isNSFW && (
            <div>
              <label className="label">Negative prompt</label>
              <textarea className="input text-sm resize-none" rows={2} placeholder="Lo que NO quieres en la imagen..." value={params.negative_prompt} onChange={e => set('negative_prompt', e.target.value)} />
            </div>
          )}

          <button className="btn-primary w-full justify-center text-sm" onClick={handleGenerate} disabled={generating}>
            {generating ? <><Loader2 size={15} className="animate-spin" />Generando...</> : <><Wand2 size={15} />Generar</>}
          </button>
        </div>

        <div>
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {generating && !result && (
            <div className="aspect-[9/16] max-w-xs rounded-xl bg-brand-surface border border-brand-border flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="animate-spin text-brand-pink" />
              <p className="text-gray-500 text-sm">Generando con {isNSFW ? 'ComfyDeploy' : 'Fal.IA'}...</p>
              <p className="text-gray-700 text-xs">Esto puede tomar 20-60 segundos</p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              {result.type === 'image' ? (
                <img src={result.url} alt="Generated content" className="rounded-xl max-h-[600px] object-contain border border-brand-border" />
              ) : (
                <video src={result.url} controls className="rounded-xl max-h-[600px] w-full border border-brand-border" />
              )}
              <div className="flex gap-3">
                <a href={result.url} download="content" className="btn-secondary text-sm">
                  <Download size={14} />Descargar
                </a>
                <button className="btn-primary text-sm" onClick={() => { setResult(null); handleGenerate() }} disabled={generating}>
                  <Wand2 size={14} />Regenerar
                </button>
              </div>

              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center justify-between">
                <p className="text-green-400 text-sm">Contenido listo. Pasa a publicación.</p>
                <button className="btn-primary text-sm py-2 px-4" onClick={onAdvance}>
                  Fase 5 — Publicar <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {!generating && !result && !error && (
            <div className="aspect-[9/16] max-w-xs rounded-xl bg-brand-surface border border-brand-border border-dashed flex items-center justify-center text-gray-700 text-sm">
              El resultado aparecerá aquí
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
