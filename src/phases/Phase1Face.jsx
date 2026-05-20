import { useEffect, useState } from 'react'
import { Wand2, Check, RefreshCw, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { runDeployment, pollRun, extractBase64Images } from '../api/comfydeploy.js'

const FACE_DEPLOYMENT_ID = import.meta.env.VITE_COMFYDEPLOY_FACE_DEPLOYMENT_ID

const ETHNICITIES  = ['Hispanic', 'Latin American', 'Mestizo', 'Caribbean', 'Afro-Caribbean', 'South American', 'Caucasian', 'Mixed']
const SKIN_TONES   = ['light', 'medium', 'medium-tan', 'olive', 'tan', 'deep tan']
const EYE_COLORS   = ['dark brown', 'brown', 'amber', 'hazel', 'green', 'light brown']
const HAIR_COLORS  = ['dark brown', 'jet black', 'medium brown', 'dark auburn', 'golden brown', 'black']
const HAIR_LENGTHS = ['long', 'very long', 'shoulder length', 'mid-back length', 'short']
const EXPRESSIONS  = ['soft smile', 'happiness', 'neutral', 'confident', 'Duchenne smile', 'warm smile']
const PHOTO_TYPES  = ['Studio white background', 'Studio black background', 'Natural light portrait', 'Fashion editorial']

export default function Phase1Face({ model, onAdvance, onRefresh }) {
  const [faces, setFaces]           = useState([])
  const [selected, setSelected]     = useState(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError]           = useState(null)
  const [params, setParams]         = useState({
    photo_type:  'Studio white background',
    ethnicity:   'Hispanic',
    skin_tone:   'medium',
    eye_color:   'dark brown',
    hair_color:  'dark brown',
    hair_length: 'long',
    expression:  'soft smile',
    brief_text:  '',
  })

  useEffect(() => { loadFaces() }, [model.id])

  async function loadFaces() {
    const { data } = await supabase
      .from('phase_images')
      .select('*')
      .eq('model_id', model.id)
      .eq('phase', 1)
      .order('created_at', { ascending: true })

    if (data?.length) {
      setFaces(data.map(r => ({ id: r.id, url: r.image_url, seed: r.seed, status: 'done', selected: r.is_selected })))
      const sel = data.find(r => r.is_selected)
      if (sel) setSelected(sel.id)
    }
  }

  function set(key, val) { setParams(p => ({ ...p, [key]: val })) }

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    setFaces([])
    setSelected(null)

    await supabase.from('phase_images').delete().eq('model_id', model.id).eq('phase', 1)

    try {
      const jobs = await Promise.all(
        Array.from({ length: 4 }, async (_, i) => {
          const seed = Math.floor(Math.random() * 999_999_999_999_999)
          const inputs = {
            ...params,
            seed: String(seed),
            job_name: `face_${i + 1}`,
          }
          const runId = await runDeployment(FACE_DEPLOYMENT_ID, inputs)
          return { runId, seed, index: i }
        })
      )

      setFaces(jobs.map(j => ({ id: j.runId, runId: j.runId, seed: j.seed, status: 'pending', url: null })))

      await Promise.all(jobs.map(async (job) => {
        try {
          const result = await pollRun(job.runId, (status) => {
            setFaces(prev => prev.map(f =>
              f.runId === job.runId ? { ...f, status: status === 'RUNNING' ? 'generating' : 'pending' } : f
            ))
          })

          const urls = extractBase64Images(result)
          const imageUrl = urls[0]

          if (imageUrl) {
            const { data: saved } = await supabase
              .from('phase_images')
              .insert({ model_id: model.id, phase: 1, image_url: imageUrl, seed: job.seed, is_selected: false })
              .select()
              .single()

            setFaces(prev => prev.map(f =>
              f.runId === job.runId ? { ...f, id: saved?.id || job.runId, url: imageUrl, status: 'done' } : f
            ))
          }
        } catch (err) {
          setFaces(prev => prev.map(f =>
            f.runId === job.runId ? { ...f, status: 'error' } : f
          ))
        }
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleSelect(face) {
    if (face.status !== 'done') return
    setSelected(face.id)
    await supabase.from('phase_images').update({ is_selected: false }).eq('model_id', model.id).eq('phase', 1)
    await supabase.from('phase_images').update({ is_selected: true }).eq('id', face.id)
    await supabase.from('models').update({ face_image_url: face.url }).eq('id', model.id)
    await onRefresh()
  }

  const allDone = faces.length === 4 && faces.every(f => f.status === 'done' || f.status === 'error')

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Fase 1 — Generación de Rostro</h2>
        <p className="text-gray-500 text-sm">Configura las características faciales y genera 4 variaciones para elegir.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="card space-y-4 self-start">
          <h3 className="font-semibold text-white text-sm">Características</h3>

          <FormField label="Tipo de foto">
            <select className="select text-sm" value={params.photo_type} onChange={e => set('photo_type', e.target.value)}>
              {PHOTO_TYPES.map(v => <option key={v}>{v}</option>)}
            </select>
          </FormField>

          <FormField label="Descripción libre (opcional)">
            <textarea className="input text-sm resize-none" rows={2} placeholder="Ej: latina sensual, ojos expresivos..." value={params.brief_text} onChange={e => set('brief_text', e.target.value)} />
          </FormField>

          <FormField label="Etnia">
            <select className="select text-sm" value={params.ethnicity} onChange={e => set('ethnicity', e.target.value)}>
              {ETHNICITIES.map(v => <option key={v}>{v}</option>)}
            </select>
          </FormField>

          <FormField label="Tono de piel">
            <select className="select text-sm" value={params.skin_tone} onChange={e => set('skin_tone', e.target.value)}>
              {SKIN_TONES.map(v => <option key={v}>{v}</option>)}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Color ojos">
              <select className="select text-sm" value={params.eye_color} onChange={e => set('eye_color', e.target.value)}>
                {EYE_COLORS.map(v => <option key={v}>{v}</option>)}
              </select>
            </FormField>
            <FormField label="Color cabello">
              <select className="select text-sm" value={params.hair_color} onChange={e => set('hair_color', e.target.value)}>
                {HAIR_COLORS.map(v => <option key={v}>{v}</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="Largo del cabello">
            <select className="select text-sm" value={params.hair_length} onChange={e => set('hair_length', e.target.value)}>
              {HAIR_LENGTHS.map(v => <option key={v}>{v}</option>)}
            </select>
          </FormField>

          <FormField label="Expresión">
            <select className="select text-sm" value={params.expression} onChange={e => set('expression', e.target.value)}>
              {EXPRESSIONS.map(v => <option key={v}>{v}</option>)}
            </select>
          </FormField>

          <button className="btn-primary w-full justify-center text-sm" onClick={handleGenerate} disabled={generating}>
            {generating ? <><Loader2 size={15} className="animate-spin" />Generando...</> : <><Wand2 size={15} />Generar 4 rostros</>}
          </button>

          {allDone && faces.some(f => f.status === 'done') && (
            <button className="btn-secondary w-full justify-center text-sm" onClick={handleGenerate} disabled={generating}>
              <RefreshCw size={14} />Regenerar
            </button>
          )}
        </div>

        <div>
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-sm text-red-400">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-0.5">Error de generación</p>
                <p className="text-red-400/70">{error}</p>
              </div>
            </div>
          )}

          {faces.length === 0 && !generating && (
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="aspect-square rounded-xl bg-brand-surface border border-brand-border border-dashed flex items-center justify-center text-gray-700 text-xs">
                  Rostro {i}
                </div>
              ))}
            </div>
          )}

          {faces.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {faces.map((face, i) => (
                  <FaceCard key={face.id || i} face={face} index={i} isSelected={selected === face.id} onSelect={() => handleSelect(face)} />
                ))}
              </div>

              {selected && (
                <div className="mt-5 flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <Check size={16} />
                    Rostro seleccionado. Lista para Fase 2.
                  </div>
                  <button className="btn-primary text-sm py-2 px-4" onClick={onAdvance}>
                    Fase 2 — Cuerpo <ChevronRight size={14} />
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

function FaceCard({ face, index, isSelected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      disabled={face.status !== 'done'}
      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group ${
        isSelected ? 'border-brand-pink shadow-lg shadow-brand-pink/20'
          : face.status === 'done' ? 'border-brand-border hover:border-brand-pink/50 cursor-pointer'
          : 'border-brand-border cursor-not-allowed'
      }`}
    >
      {face.url && <img src={face.url} alt={`Rostro ${index + 1}`} className="w-full h-full object-cover" />}

      {(face.status === 'pending' || face.status === 'generating') && (
        <div className="absolute inset-0 bg-brand-surface flex flex-col items-center justify-center gap-2">
          <Loader2 size={24} className="animate-spin text-brand-pink" />
          <span className="text-gray-500 text-xs">{face.status === 'pending' ? 'En cola...' : 'Generando...'}</span>
        </div>
      )}

      {face.status === 'error' && (
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

      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">{index + 1}</div>

      {face.status === 'done' && !isSelected && (
        <div className="absolute inset-0 bg-brand-pink/0 group-hover:bg-brand-pink/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="bg-brand-pink text-white text-xs font-semibold px-3 py-1.5 rounded-full">Seleccionar</span>
        </div>
      )}
    </button>
  )
}

function FormField({ label, children }) {
  return <div><label className="label">{label}</label>{children}</div>
}
