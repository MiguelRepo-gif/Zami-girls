import { useEffect, useState } from 'react'
import { User, Save, ChevronRight, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase.js'

const PERSONALITY_TRAITS = ['Playful', 'Mysterious', 'Confident', 'Sweet', 'Adventurous', 'Sophisticated', 'Bubbly', 'Intense']
const CONTENT_TONES      = ['Flirty', 'Empowering', 'Relatable', 'Aspirational', 'Humorous', 'Sensual', 'Educational']
const POSTING_FREQUENCY  = ['1 post/day', '2 posts/day', '3 posts/day', '5 posts/week']

const DEFAULT_PROFILE = {
  bio: '',
  personality: [],
  content_tone: [],
  backstory: '',
  values: '',
  posting_frequency: '2 posts/day',
  target_audience: '',
  unique_selling_point: '',
  hashtag_style: '',
  languages: 'Spanish, English',
}

export default function Phase3Profile({ model, onAdvance, onRefresh }) {
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  useEffect(() => { loadProfile() }, [model.id])

  async function loadProfile() {
    const { data } = await supabase.from('model_profiles').select('*').eq('model_id', model.id).single()
    if (data?.content) setProfile({ ...DEFAULT_PROFILE, ...data.content })
  }

  function set(key, val) { setProfile(p => ({ ...p, [key]: val })) }

  function toggleArray(key, val) {
    setProfile(p => ({
      ...p,
      [key]: p[key].includes(val) ? p[key].filter(x => x !== val) : [...p[key], val],
    }))
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('model_profiles').upsert({ model_id: model.id, content: profile }, { onConflict: 'model_id' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    await onRefresh()
  }

  const isComplete = profile.bio && profile.personality.length > 0 && profile.backstory && profile.target_audience

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Fase 3 — Perfil de Persona</h2>
        <p className="text-gray-500 text-sm">Define la identidad y psicología de {model.name}.</p>
      </div>

      <div className="space-y-5">
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2"><User size={14} />Identidad</h3>

          <div>
            <label className="label">Bio (para redes sociales, máx 150 chars)</label>
            <textarea className="input text-sm resize-none" rows={3} maxLength={150} placeholder="Ej: Latina vibes 🔥 | Fitness & lifestyle | DM for collabs" value={profile.bio} onChange={e => set('bio', e.target.value)} />
            <p className="text-gray-600 text-xs mt-1">{profile.bio.length}/150</p>
          </div>

          <div>
            <label className="label">Historia de fondo (backstory)</label>
            <textarea className="input text-sm resize-none" rows={4} placeholder="De dónde es, qué le apasiona, por qué empezó en redes..." value={profile.backstory} onChange={e => set('backstory', e.target.value)} />
          </div>

          <div>
            <label className="label">Audiencia objetivo</label>
            <input className="input text-sm" placeholder="Ej: Hombres 25-45, latam + USA, interesados en fitness y lifestyle..." value={profile.target_audience} onChange={e => set('target_audience', e.target.value)} />
          </div>

          <div>
            <label className="label">Propuesta única (qué la hace diferente)</label>
            <input className="input text-sm" placeholder="Ej: Auténtica latina que mezcla fitness con cultura caribeña..." value={profile.unique_selling_point} onChange={e => set('unique_selling_point', e.target.value)} />
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm">Personalidad</h3>

          <div>
            <label className="label">Rasgos (selecciona los que aplican)</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {PERSONALITY_TRAITS.map(t => (
                <button
                  key={t}
                  onClick={() => toggleArray('personality', t)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    profile.personality.includes(t)
                      ? 'bg-brand-pink/10 border-brand-pink text-brand-pink'
                      : 'border-brand-border text-gray-500 hover:border-brand-muted'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Tono del contenido</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {CONTENT_TONES.map(t => (
                <button
                  key={t}
                  onClick={() => toggleArray('content_tone', t)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    profile.content_tone.includes(t)
                      ? 'bg-brand-purple/10 border-brand-purple text-brand-purple'
                      : 'border-brand-border text-gray-500 hover:border-brand-muted'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Idiomas</label>
            <input className="input text-sm" value={profile.languages} onChange={e => set('languages', e.target.value)} />
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm">Estrategia de Contenido</h3>

          <div>
            <label className="label">Frecuencia de publicación</label>
            <select className="select text-sm" value={profile.posting_frequency} onChange={e => set('posting_frequency', e.target.value)}>
              {POSTING_FREQUENCY.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Estilo de hashtags</label>
            <input className="input text-sm" placeholder="Ej: #latina #fitness #lifestyle #colombiana" value={profile.hashtag_style} onChange={e => set('hashtag_style', e.target.value)} />
          </div>

          <div>
            <label className="label">Valores de marca</label>
            <input className="input text-sm" placeholder="Ej: autenticidad, cuerpo positivo, cultura latina..." value={profile.values} onChange={e => set('values', e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button className="btn-secondary" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 size={14} className="animate-spin" />Guardando...</> : saved ? '✓ Guardado' : <><Save size={14} />Guardar perfil</>}
          </button>

          {isComplete && (
            <button className="btn-primary" onClick={onAdvance}>
              Fase 4 — Contenido <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
