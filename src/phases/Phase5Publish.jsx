import { useState } from 'react'
import { Upload, CheckCircle, ChevronRight, ExternalLink } from 'lucide-react'

const PLATFORMS = ['OnlyFans', 'Fansly', 'Instagram', 'TikTok', 'Twitter/X', 'Fanvue']

export default function Phase5Publish({ model, onAdvance }) {
  const [published, setPublished] = useState([])
  const [notes, setNotes]         = useState('')

  function togglePlatform(p) {
    setPublished(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Fase 5 — Publicación</h2>
        <p className="text-gray-500 text-sm">Esta fase es manual. Publica el contenido en las plataformas y confirma aquí cuando esté listo.</p>
      </div>

      <div className="card space-y-5">
        <div className="p-4 bg-brand-dark rounded-lg border border-brand-border">
          <p className="text-gray-400 text-sm font-medium mb-1">Instrucciones</p>
          <ol className="text-gray-500 text-sm space-y-1 list-decimal list-inside">
            <li>Descarga el contenido generado en Fase 4</li>
            <li>Redacta el caption usando el perfil de Fase 3</li>
            <li>Publica en cada plataforma seleccionada</li>
            <li>Marca las plataformas donde publicaste abajo</li>
            <li>Haz clic en "Confirmar publicación"</li>
          </ol>
        </div>

        <div>
          <label className="label">¿Dónde publicaste?</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {PLATFORMS.map(p => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  published.includes(p)
                    ? 'bg-green-500/10 border-green-500 text-green-400'
                    : 'border-brand-border text-gray-500 hover:border-brand-muted'
                }`}
              >
                {published.includes(p) ? '✓ ' : ''}{p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Notas (opcional)</label>
          <textarea className="input text-sm resize-none" rows={3} placeholder="Ej: publicado a las 8pm, caption optimizado, 3 hashtags..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <button
          className="btn-primary w-full justify-center"
          onClick={onAdvance}
          disabled={published.length === 0}
        >
          <CheckCircle size={16} />
          Confirmar publicación — ir a KPIs
        </button>
      </div>
    </div>
  )
}
