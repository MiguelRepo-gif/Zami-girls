import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase.js'

const NICHES = [
  'Fitness & Wellness', 'Fashion & Style', 'Travel & Lifestyle', 'Beauty & Makeup',
  'Foodie & Nutrition', 'Tech & Gaming', 'Music & Entertainment', 'Business & Mindset',
  'Relationships & Dating', 'Luxury & Glamour',
]

export default function NewModel() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', niche: '', mode: 'SFW', custom_niche: '' })

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.niche) return
    setSaving(true)
    const niche = form.niche === '__custom__' ? form.custom_niche : form.niche
    const { data, error } = await supabase
      .from('models')
      .insert({ name: form.name.trim(), niche, mode: form.mode, current_phase: 1 })
      .select()
      .single()
    setSaving(false)
    if (!error && data) navigate(`/model/${data.id}`)
  }

  const valid = form.name.trim() && form.niche && (form.niche !== '__custom__' || form.custom_niche.trim())

  return (
    <div className="p-8 max-w-lg">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft size={14} />
        Volver
      </Link>

      <h1 className="text-2xl font-black text-white mb-1">Nueva Modelo</h1>
      <p className="text-gray-500 text-sm mb-8">Define el nombre y nicho para comenzar la generación.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="label">Nombre artístico *</label>
          <input className="input" placeholder="Ej: Valentina Cruz" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>

        <div>
          <label className="label">Nicho *</label>
          <select className="select" value={form.niche} onChange={e => set('niche', e.target.value)} required>
            <option value="">Selecciona un nicho</option>
            {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
            <option value="__custom__">Personalizado...</option>
          </select>
        </div>

        {form.niche === '__custom__' && (
          <div>
            <label className="label">Nicho personalizado *</label>
            <input className="input" placeholder="Describe el nicho..." value={form.custom_niche} onChange={e => set('custom_niche', e.target.value)} required />
          </div>
        )}

        <div>
          <label className="label">Tipo de contenido</label>
          <div className="flex gap-3">
            {['SFW', 'NSFW'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => set('mode', m)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  form.mode === m
                    ? m === 'NSFW'
                      ? 'bg-red-500/10 border-red-500 text-red-400'
                      : 'bg-brand-pink/10 border-brand-pink text-brand-pink'
                    : 'bg-brand-dark border-brand-border text-gray-500 hover:border-brand-muted'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary w-full justify-center" disabled={!valid || saving}>
          <Sparkles size={16} />
          {saving ? 'Creando...' : 'Crear modelo y comenzar Fase 1'}
        </button>
      </form>
    </div>
  )
}
