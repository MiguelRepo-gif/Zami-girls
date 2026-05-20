import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Check, Lock, User } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import Phase1Face from '../phases/Phase1Face.jsx'
import Phase2Body from '../phases/Phase2Body.jsx'
import Phase3Profile from '../phases/Phase3Profile.jsx'
import Phase4Content from '../phases/Phase4Content.jsx'
import Phase5Publish from '../phases/Phase5Publish.jsx'
import Phase6KPI from '../phases/Phase6KPI.jsx'

const PHASES = [
  { n: 1, label: 'Rostro',    desc: 'Generación de rostro' },
  { n: 2, label: 'Cuerpo',    desc: 'Generación de cuerpo' },
  { n: 3, label: 'Perfil',    desc: 'Perfil psicológico' },
  { n: 4, label: 'Contenido', desc: 'Calendario semanal' },
  { n: 5, label: 'Publicar',  desc: 'Publicación manual' },
  { n: 6, label: 'KPIs',      desc: 'Análisis de resultados' },
]

export default function ModelDetail() {
  const { id } = useParams()
  const [model, setModel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePhase, setActivePhase] = useState(null)

  useEffect(() => { fetchModel() }, [id])

  async function fetchModel() {
    const { data } = await supabase.from('models').select('*').eq('id', id).single()
    if (data) { setModel(data); setActivePhase(data.current_phase) }
    setLoading(false)
  }

  async function advancePhase() {
    const next = Math.min((model.current_phase || 1) + 1, 6)
    await supabase.from('models').update({ current_phase: next }).eq('id', id)
    setModel(m => ({ ...m, current_phase: next }))
    setActivePhase(next)
  }

  async function refreshModel() {
    const { data } = await supabase.from('models').select('*').eq('id', id).single()
    if (data) setModel(data)
  }

  if (loading) return <div className="p-8 text-gray-500">Cargando...</div>
  if (!model)  return <div className="p-8 text-gray-500">Modelo no encontrada.</div>

  const currentPhase = model.current_phase || 1

  return (
    <div className="p-8">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={14} />
        Modelos
      </Link>

      <div className="flex items-center gap-5 mb-8">
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand-surface border border-brand-border flex-shrink-0">
          {model.face_image_url ? (
            <img src={model.face_image_url} alt={model.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={28} className="text-gray-600" />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-white">{model.name}</h1>
            {model.mode === 'NSFW' && (
              <span className="phase-badge text-red-400 bg-red-400/10">NSFW</span>
            )}
          </div>
          <p className="text-gray-500 text-sm">{model.niche}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-8 overflow-x-auto pb-1">
        {PHASES.map(p => {
          const done    = p.n < currentPhase
          const current = p.n === currentPhase
          const locked  = p.n > currentPhase

          return (
            <button
              key={p.n}
              onClick={() => !locked && setActivePhase(p.n)}
              disabled={locked}
              className={`flex-1 min-w-[100px] flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all text-xs font-medium ${
                locked
                  ? 'border-brand-border text-gray-700 cursor-not-allowed'
                  : current
                    ? 'border-brand-pink bg-brand-pink/10 text-brand-pink'
                    : activePhase === p.n
                      ? 'border-brand-pink/50 bg-brand-pink/5 text-brand-pink/80'
                      : 'border-brand-border text-gray-400 hover:border-brand-muted hover:text-gray-300'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                done ? 'bg-green-500 text-white' : current ? 'bg-brand-pink text-white' : 'bg-brand-muted text-gray-600'
              }`}>
                {done ? <Check size={12} /> : locked ? <Lock size={10} /> : p.n}
              </div>
              <span>{p.label}</span>
            </button>
          )
        })}
      </div>

      <PhaseContent phase={activePhase} model={model} onAdvance={advancePhase} onRefresh={refreshModel} />
    </div>
  )
}

function PhaseContent({ phase, model, onAdvance, onRefresh }) {
  const props = { model, onAdvance, onRefresh }
  switch (phase) {
    case 1: return <Phase1Face {...props} />
    case 2: return <Phase2Body {...props} />
    case 3: return <Phase3Profile {...props} />
    case 4: return <Phase4Content {...props} />
    case 5: return <Phase5Publish {...props} />
    case 6: return <Phase6KPI {...props} />
    default: return null
  }
}
