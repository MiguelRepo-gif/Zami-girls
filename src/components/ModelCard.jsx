import { Link } from 'react-router-dom'
import { User, ChevronRight } from 'lucide-react'

const PHASE_LABELS = ['', 'Rostro', 'Cuerpo', 'Perfil', 'Contenido', 'Comunidad', 'KPIs']
const PHASE_COLORS = ['', 'text-purple-400 bg-purple-400/10', 'text-blue-400 bg-blue-400/10',
  'text-green-400 bg-green-400/10', 'text-yellow-400 bg-yellow-400/10',
  'text-orange-400 bg-orange-400/10', 'text-red-400 bg-red-400/10']

export default function ModelCard({ model }) {
  const phase = model.current_phase || 1

  return (
    <Link
      to={`/model/${model.id}`}
      className="card hover:border-brand-pink/50 transition-all duration-200 group cursor-pointer block"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-brand-muted">
          {model.face_image_url ? (
            <img src={model.face_image_url} alt={model.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={24} className="text-gray-600" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-white text-base truncate group-hover:text-brand-pink transition-colors">
              {model.name}
            </h3>
            <ChevronRight size={16} className="text-gray-600 group-hover:text-brand-pink flex-shrink-0 transition-colors" />
          </div>
          <p className="text-gray-500 text-sm mt-0.5 truncate">{model.niche}</p>

          <div className="flex items-center gap-2 mt-3">
            <span className={`phase-badge ${PHASE_COLORS[phase]}`}>
              Fase {phase} — {PHASE_LABELS[phase]}
            </span>
            {model.mode === 'NSFW' && (
              <span className="phase-badge text-red-400 bg-red-400/10">NSFW</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 h-1.5 bg-brand-dark rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-pink to-brand-purple rounded-full transition-all"
          style={{ width: `${((phase - 1) / 5) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        {[1,2,3,4,5,6].map(p => (
          <div
            key={p}
            className={`w-1.5 h-1.5 rounded-full ${p <= phase ? 'bg-brand-pink' : 'bg-brand-muted'}`}
          />
        ))}
      </div>
    </Link>
  )
}
