import { useState } from 'react'
import { BarChart2, TrendingUp, Upload, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase.js'

export default function Phase6KPI({ model }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [notes, setNotes]       = useState('')

  async function handleSave() {
    setLoading(true)
    await supabase.from('kpi_reports').insert({
      model_id: model.id,
      report_date: new Date().toISOString().split('T')[0],
      analysis: { notes, timestamp: new Date().toISOString() },
    })
    setAnalysis({ notes, saved: true })
    setLoading(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Fase 6 — Análisis de KPIs</h2>
        <p className="text-gray-500 text-sm">Registra los resultados del contenido publicado para optimizar la siguiente iteración.</p>
      </div>

      <div className="space-y-4">
        <div className="card">
          <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
            <BarChart2 size={14} />
            Métricas del contenido
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Likes', placeholder: '0' },
              { label: 'Comentarios', placeholder: '0' },
              { label: 'Compartidos', placeholder: '0' },
              { label: 'Alcance', placeholder: '0' },
              { label: 'Nuevos subs/fans', placeholder: '0' },
              { label: 'Ingresos ($)', placeholder: '0.00' },
            ].map(({ label, placeholder }) => (
              <div key={label}>
                <label className="label">{label}</label>
                <input className="input text-sm" type="number" placeholder={placeholder} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
            <TrendingUp size={14} />
            Observaciones y mejoras
          </h3>
          <textarea
            className="input text-sm resize-none"
            rows={5}
            placeholder="¿Qué funcionó? ¿Qué cambiar en el próximo contenido? ¿Qué hora tuvo más engagement?..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {analysis?.saved && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <p className="text-green-400 text-sm font-medium">KPIs guardados. Vuelve a Fase 4 para generar el siguiente contenido.</p>
          </div>
        )}

        <button className="btn-primary" onClick={handleSave} disabled={loading || !notes.trim()}>
          {loading ? <><Loader2 size={14} className="animate-spin" />Guardando...</> : <><Upload size={14} />Guardar análisis</>}
        </button>
      </div>
    </div>
  )
}
