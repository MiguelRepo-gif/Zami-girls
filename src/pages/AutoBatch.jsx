import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Check, Loader2, AlertCircle, User, ChevronRight, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { runDeployment, pollRun, extractBase64Images } from '../api/comfydeploy.js'
import { generateModelProfile } from '../api/claude.js'

const FACE_ID = 'd3e4cb7d-8f44-405f-9607-99a58cfb1183'
const BODY_ID = 'cabf22a3-a697-485c-a6df-b6c09ee4f2f1'

const DIVERSITY_SETS = [
  { ethnicity: 'European Italian', skin_tone: 'light',      hair_color: 'dark brown', eye_color: 'hazel',      hair_length: 'long' },
  { ethnicity: 'Latin American',   skin_tone: 'medium-tan', hair_color: 'jet black',  eye_color: 'dark brown', hair_length: 'very long' },
  { ethnicity: 'East Asian',       skin_tone: 'light',      hair_color: 'jet black',  eye_color: 'dark brown', hair_length: 'long' },
  { ethnicity: 'Middle Eastern',   skin_tone: 'olive',      hair_color: 'dark brown', eye_color: 'brown',      hair_length: 'long' },
]

const BODY_TYPES   = ['Curvy', 'Athletic', 'Slim', 'Thick']
const SFW_OUTFITS  = ['Casual', 'Sportwear', 'Elegant dress', 'Swimwear']
const SFW_SETTINGS = ['Studio white', 'Urban rooftop', 'Beach', 'Studio white']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const INITIAL_INPUTS = [
  { name: '', niche: '' },
  { name: '', niche: '' },
  { name: '', niche: '' },
  { name: '', niche: '' },
]

const INITIAL_PROGRESS = Array.from({ length: 4 }, () => ({
  face:    'pending',
  body:    'pending',
  profile: 'pending',
  faceUrl: null,
  bodyUrl: null,
  bio:     null,
  error:   null,
}))

export default function AutoBatch() {
  const navigate = useNavigate()
  const [step, setStep]           = useState('input')
  const [inputs, setInputs]       = useState(INITIAL_INPUTS)
  const [progress, setProgress]   = useState(INITIAL_PROGRESS)
  const [generated, setGenerated] = useState([null, null, null, null])
  const [selecting, setSelecting] = useState(null)
  const [selectError, setSelectError] = useState(null)

  const allFilled = inputs.every(r => r.name.trim() && r.niche.trim())

  function setInput(idx, field, val) {
    setInputs(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r))
  }

  function updateProgress(idx, updates) {
    setProgress(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p))
  }

  async function handleStart() {
    setStep('generating')
    setProgress(INITIAL_PROGRESS)
    setGenerated([null, null, null, null])
    setSelectError(null)

    const diversitySets = shuffle(DIVERSITY_SETS)
    const results = [null, null, null, null]

    await Promise.all(inputs.map(async (input, idx) => {
      try {
        // Phase 1 — Face
        updateProgress(idx, { face: 'generating' })
        const traits = diversitySets[idx]
        const faceRunId = await runDeployment(FACE_ID, {
          Prompt: `beautiful ${traits.ethnicity} woman, ${traits.skin_tone} skin tone, ${traits.eye_color} eyes, ${traits.hair_color} ${traits.hair_length} hair, soft smile, ${input.niche} influencer, natural beauty, photorealistic portrait`,
          filename_prefix: 'ComfyUI',
        })
        const faceResult = await pollRun(faceRunId)
        const faceUrl = extractBase64Images(faceResult)[0]
        if (!faceUrl) throw new Error('No se generó imagen de rostro')
        updateProgress(idx, { face: 'done', faceUrl })

        // Phase 2 — Body (face image passed as input_image)
        updateProgress(idx, { body: 'generating' })
        const bodyRunId = await runDeployment(BODY_ID, {
          input_image:     faceUrl,
          filename_prefix: 'ComfyUI',
          prompt:          `${BODY_TYPES[idx]} body type, ${SFW_OUTFITS[idx]} outfit, ${SFW_SETTINGS[idx]} background, ${input.niche} influencer, tasteful and elegant, full body shot`,
        })
        const bodyResult = await pollRun(bodyRunId)
        const bodyUrl = extractBase64Images(bodyResult)[0]
        if (!bodyUrl) throw new Error('No se generó imagen de cuerpo')
        updateProgress(idx, { body: 'done', bodyUrl })

        // Phase 3 — AI Profile
        updateProgress(idx, { profile: 'generating' })
        const profile = await generateModelProfile(input.name, input.niche, traits)
        updateProgress(idx, { profile: 'done', bio: profile.bio })

        results[idx] = { faceUrl, bodyUrl, traits, profile }
      } catch (err) {
        updateProgress(idx, { error: err.message })
      }
    }))

    setGenerated(results)
    if (results.some(r => r !== null)) setStep('selection')
  }

  async function handleSelect(selectedIdx) {
    setSelecting(selectedIdx)
    setSelectError(null)
    try {
      const input = inputs[selectedIdx]
      const gen   = generated[selectedIdx]

      const { data: model, error } = await supabase
        .from('models')
        .insert({ name: input.name.trim(), niche: input.niche.trim(), mode: 'SFW', current_phase: 1 })
        .select()
        .single()
      if (error) throw new Error(`Supabase: ${error.message}`)

      await Promise.all([
        supabase.from('phase_images').insert({ model_id: model.id, phase: 1, image_url: gen.faceUrl, seed: 0, is_selected: true }),
        supabase.from('phase_images').insert({ model_id: model.id, phase: 2, image_url: gen.bodyUrl, seed: 0, is_selected: true }),
      ])
      await supabase.from('models').update({ face_image_url: gen.faceUrl, body_image_url: gen.bodyUrl }).eq('id', model.id)
      await supabase.from('model_profiles').upsert({ model_id: model.id, content: gen.profile }, { onConflict: 'model_id' })
      await supabase.from('models').update({ current_phase: 4 }).eq('id', model.id)

      navigate(`/model/${model.id}`)
    } catch (err) {
      setSelectError(err.message)
      setSelecting(null)
    }
  }

  if (step === 'input') return <InputStep inputs={inputs} onInput={setInput} allFilled={allFilled} onStart={handleStart} />
  if (step === 'generating') return <GeneratingStep progress={progress} inputs={inputs} />
  if (step === 'selection') return (
    <SelectionStep
      progress={progress}
      inputs={inputs}
      generated={generated}
      onSelect={handleSelect}
      selecting={selecting}
      selectError={selectError}
    />
  )
  return null
}

function InputStep({ inputs, onInput, allFilled, onStart }) {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-brand-pink/10 border border-brand-pink/30 flex items-center justify-center">
            <Sparkles size={18} className="text-brand-pink" />
          </div>
          <h1 className="text-2xl font-black text-white">Nuevo Batch</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Ingresa los nombres y nichos. El sistema generará rostro, cuerpo y perfil de forma automática para las 4 modelos.
        </p>
      </div>

      <div className="card space-y-4 mb-6">
        <div className="grid grid-cols-[1fr_1fr] gap-3 mb-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nicho</span>
        </div>
        {inputs.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr] gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm w-4 text-right">{i + 1}</span>
              <input
                className="input text-sm flex-1"
                placeholder="Ej: Valentina Cruz"
                value={row.name}
                onChange={e => onInput(i, 'name', e.target.value)}
              />
            </div>
            <input
              className="input text-sm"
              placeholder="Ej: fitness & lifestyle"
              value={row.niche}
              onChange={e => onInput(i, 'niche', e.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="btn-primary text-sm" onClick={onStart} disabled={!allFilled}>
        <Play size={15} />
        Iniciar Automatización
      </button>
    </div>
  )
}

function GeneratingStep({ progress, inputs }) {
  const totalDone = progress.filter(p => p.profile === 'done' || p.error).length
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">Generando modelos...</h1>
        <p className="text-gray-500 text-sm">{totalDone} de 4 modelos completadas</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
        {progress.map((p, i) => (
          <GeneratingCard key={i} p={p} input={inputs[i]} />
        ))}
      </div>
    </div>
  )
}

function GeneratingCard({ p, input }) {
  const steps = [
    { key: 'face',    label: 'Rostro' },
    { key: 'body',    label: 'Cuerpo' },
    { key: 'profile', label: 'Perfil IA' },
  ]
  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand-dark border border-brand-border flex-shrink-0">
          {p.faceUrl
            ? <img src={p.faceUrl} alt={input.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><User size={16} className="text-gray-600" /></div>
          }
        </div>
        <div>
          <p className="text-white text-sm font-semibold">{input.name}</p>
          <p className="text-gray-500 text-xs">{input.niche}</p>
        </div>
      </div>
      {p.error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
          <AlertCircle size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
          <span className="text-red-400 text-xs break-all">{p.error}</span>
        </div>
      )}
      <div className="space-y-2">
        {steps.map(s => <StepRow key={s.key} label={s.label} status={p[s.key]} />)}
      </div>
    </div>
  )
}

function StepRow({ label, status }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
        status === 'done'         ? 'bg-green-500'
        : status === 'generating' ? 'bg-brand-pink/20'
        : 'bg-brand-dark border border-brand-border'
      }`}>
        {status === 'done'        && <Check size={10} className="text-white" />}
        {status === 'generating'  && <Loader2 size={10} className="animate-spin text-brand-pink" />}
      </div>
      <span className={`text-xs ${
        status === 'done'         ? 'text-gray-300'
        : status === 'generating' ? 'text-brand-pink font-medium'
        : 'text-gray-600'
      }`}>{label}</span>
    </div>
  )
}

function SelectionStep({ progress, inputs, generated, onSelect, selecting, selectError }) {
  const doneCount = progress.filter(p => p.profile === 'done').length
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">Elige tu modelo</h1>
        <p className="text-gray-500 text-sm">
          {doneCount} de 4 modelos generadas. Selecciona una para continuar a Fase 4.
        </p>
        {selectError && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-3">
            <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            <span className="text-red-400 text-sm break-all">{selectError}</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
        {progress.map((p, i) => (
          <SelectionCard
            key={i}
            p={p}
            input={inputs[i]}
            profile={generated[i]?.profile}
            onSelect={() => onSelect(i)}
            isSelecting={selecting === i}
            disabled={selecting !== null}
          />
        ))}
      </div>
    </div>
  )
}

function SelectionCard({ p, input, profile, onSelect, isSelecting, disabled }) {
  const canSelect = p.profile === 'done' && !p.error
  return (
    <div className={`card flex flex-col gap-4 ${p.error ? 'opacity-50' : ''}`}>
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-brand-dark border border-brand-border">
        {p.faceUrl
          ? <img src={p.faceUrl} alt={input.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><User size={32} className="text-gray-600" /></div>
        }
        {p.bodyUrl && (
          <div className="absolute bottom-2 right-2 w-12 h-16 rounded-lg overflow-hidden border-2 border-brand-pink shadow-lg">
            <img src={p.bodyUrl} alt="cuerpo" className="w-full h-full object-cover" />
          </div>
        )}
        {p.error && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-400" />
          </div>
        )}
      </div>
      <div>
        <p className="text-white font-bold text-sm">{input.name}</p>
        <span className="text-xs text-brand-pink bg-brand-pink/10 px-2 py-0.5 rounded-full">{input.niche}</span>
      </div>
      {profile?.bio && (
        <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">{profile.bio}</p>
      )}
      <button
        className="btn-primary w-full justify-center text-sm mt-auto"
        onClick={onSelect}
        disabled={!canSelect || disabled}
      >
        {isSelecting
          ? <><Loader2 size={14} className="animate-spin" />Guardando...</>
          : <>Seleccionar <ChevronRight size={14} /></>
        }
      </button>
    </div>
  )
}
