import { useEffect, useState } from 'react'
import { Wand2, Check, RefreshCw, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { runDeployment, pollRun, extractBase64Images } from '../api/comfydeploy.js'

const BODY_DEPLOYMENT_ID = import.meta.env.VITE_COMFYDEPLOY_BODY_DEPLOYMENT_ID

const BODY_TYPES = ['Curvy', 'Athletic', 'Slim', 'Thick']
const OUTFITS    = ['Bikini', 'Lingerie', 'Casual', 'Sportwear', 'Elegant dress', 'Custom...']
const SETTINGS   = ['Beach', 'Studio white', 'Urban rooftop', 'Bedroom', 'Pool', 'Gym']

export default function Phase2Body({ model, onAdvance, onRefresh }) {
  const [bodies, setBodies]         = useState([])
  const [selected, setSelected]     = useState(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError]           = useState(null)
  const [params, setParams]         = useState({
    body_type: 'Curvy',
    outfit: 'Bikini',
    setting: 'Beach',
    custom_prompt: '',
  })

  useEffect(() => { loadBodies() }, [model.id])

  async function loadBodies() {
    const { data } = await supabase
      .from('phase_images')
      .select('*')
      .eq('model_id', model.id)
      .eq('phase', 2)
      .order('created_at', { ascending: true })

    if (data?.length) {
      setBodies(data.map(r => ({ id: r.id, url: r.image_url, seed: r.seed, status: 'done', selected: r.is_selected })))
      const sel = data.find(r => r.is_selected)
      if (sel) setSelected(sel.id)
    }
  }

  function set(key, val) { setParams(p => ({ ...p, [key]: val })) }

  async function handleGenerate() {
    if (!model.face_image_url) {
      setError('Necesitas seleccionar un rostro en Fase 1 primero.')
      return
    }
    setGenerating(true)
    setError(null)
    setBodies([])
    setSelected(null)

    await supabase.from('phase_images').delete().eq('model_id', model.id).eq('phase', 2)

    try {
      const jobs = await Promise.all(
        BODY_TYPES.map(async (bodyType, i) => {
          const seed = Math.floor(Math.random() * 999_999_999_999_999)
          const inputs = {
            face_image_url: model.face_image_url,
            body_type: bodyType,
            outfit: params.outfit,
            setting: params.setting,
            custom_prompt: params.custom_prompt,
            seed: String(seed),
            job_name: `body_${bodyType.toLowerCase()}`,
          }
          const runId = await runDeployment(BODY_DEPLOYMENT_ID, inputs)
          return { runId, seed, bodyType }
        })
      )

      setBodies(jobs.map(j => ({ id: j.runId, runId: j.runId, seed: j.seed, bodyType: j.bodyType, status: 'pending', url: null })))

      await Promise.all(jobs.map(async (job) => {
        try {
          const result = await pollRun(job.runId, (status) => {
            setBodies(prev => prev.map(b =>
              b.runId === job.runId ? { ...b, status: status === 'RUNNING' ? 'generating' : 'pending' } : b
            ))
          })

          const urls = extractBase64Images(result)
          const imageUrl = urls[0]

          if (imageUrl) {
            const { data: saved } = await supabase
              .from('phase_images')
              .insert({ model_id: model.id, phase: 2, image_url: imageUrl, seed: job.seed, is_selected: false })
              .select()
              .single()

            setBodies(prev => prev.map(b =>
              b.runId === job.runId ? { ...b, id: saved?.id || job.runId, url: imageUrl, status: 'done' } : b
            ))
          }
        } catch (err) {
          setBodies(prev => prev.map(b =>
            b.runId === job.runId ? { ...b, status: 'error' } : b
          ))
        }
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleSelect(body) {
    if (body.status !== 'done') return
    setSelected(body.id)
    await supabase.from('phase_images').update({ is_selected: false }).eq('model_id', model.id).eq('phase', 2)
    await supabase.from('phase_images').update({ is_selected: true }).eq('id', body.id)
    await supabase.from('models').update({ body_image_url: body.url }).eq('id', model.id)
    await onRefresh()
  }

  const allDone = bodies.length === 4 && bodies.every(b => b.status === 'done' || b.status === 'error')

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Fase 2 — Generación de Cuerpo</h2>
        <p className="text-gray-500 text-sm">Genera 4 tipos de cuerpo usando el rostro seleccionado como referencia.</p>
      </div>

      {model.face_image_url && (
        <div className="flex items-center gap-3 mb-6 p-3 bg-brand-surface border border-brand-border rounded-xl">
          <img src={model.face_image_url} alt="Rostro" className="w-12 h-12 rounded-lg object-cover" />
          <div>
            <p className="text-white text-sm font-medium">{model.name}</p>
            <p className="text-gray-500 text-xs">Rostro seleccionado en Fase 1</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <div className="card space-y-4 self-start">
          <h3 className="font-semibold text-white text-sm">Parámetros</h3>

          <div>
            <label className="label">Outfit</label>
            <select className="select text-sm" value={params.outfit} onChange={e => set('outfit', e.target.value)}>
              {OUTFITS.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Escenario</label>
            <select className="select text-sm" value={params.setting} onChange={e => set('setting', e.target.value)}>
              {SETTINGS.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Descripción adicional (opcional)</label>
            <textarea className="input text-sm resize-none" rows={2} placeholder="Detalles extra del cuerpo o escena..." value={params.custom_prompt} onChange={e => set('custom_prompt', e.target.value)} />
          </div>

          <p className="text-gray-600 text-xs">Se generarán 4 variantes: {BODY_TYPES.join(', ')}</p>

          <button className="btn-primary w-full justify-center text-sm" onClick={handleGenerate} disabled={generating}>
            {generating ? <><Loader2 size={15} className="animate-spin" />Generando...</> : <><Wand2 size={15} />Generar 4 cuerpos</>}
          </button>

          {allDone && bodies.some(b => b.status === 'done') && (
            <button className="btn-secondary w-full justify-center text-sm" onClick={handleGenerate} disabled={generating}>
              <RefreshCw size={14} />Regenerar
            </button>
          )}
        </div>

        <div>
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-sm text-red-400">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {bodies.length === 0 && !generating && (
            <div className="grid grid-cols-2 gap-3">
              {BODY_TYPES.map(t => (
                <div key={t} className="aspect-[3/4] rounded-xl bg-brand-surface border border-brand-border border-dashed flex items-center justify-center text-gray-700 text-xs">
                  {t}
                </div>
              ))}
            </div>
          )}

          {bodies.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {bodies.map((body, i) => (
                  <BodyCard key={body.id || i} body={body} isSelected={selected === body.id} onSelect={() => handleSelect(body)} />
                ))}
              </div>

              {selected && (
                <div className="mt-5 flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <Check size={16} />
                    Cuerpo seleccionado. Lista para Fase 3.
                  </div>
                  <button className="btn-primary text-sm py-2 px-4" onClick={onAdvance}>
                    Fase 3 — Perfil <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function BodyCard({ body, isSelected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      disabled={body.status !== 'done'}
      className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all group ${
        isSelected ? 'border-brand-pink shadow-lg shadow-brand-pink/20'
          : body.status === 'done' ? 'border-brand-border hover:border-brand-pink/50 cursor-pointer'
          : 'border-brand-border cursor-not-allowed'
      }`}
    >
      {body.url && <img src={body.url} alt={body.bodyType} className="w-full h-full object-cover" />}

      {(body.status === 'pending' || body.status === 'generating') && (
        <div className="absolute inset-0 bg-brand-surface flex flex-col items-center justify-center gap-2">
          <Loader2 size={24} className="animate-spin text-brand-pink" />
          <span className="text-gray-500 text-xs">{body.bodyType}</span>
          <span className="text-gray-600 text-xs">{body.status === 'pending' ? 'En cola...' : 'Generando...'}</span>
        </div>
      )}

      {body.status === 'error' && (
        <div className="absolute inset-0 bg-brand-surface flex flex-col items-center justify-center gap-2">
          <AlertCircle size={24} className="text-red-400" />
          <span className="text-red-400/70 text-xs">Error</span>
        </div>
      )}

      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-pink flex items-center justify-center">
          <Check size={12} className="text-white" />
        </div>
      )}

      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">{body.bodyType}</div>
    </button>
  )
}
