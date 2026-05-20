import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Users } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import ModelCard from '../components/ModelCard.jsx'

export default function Dashboard() {
  const [models, setModels]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => { fetchModels() }, [])

  async function fetchModels() {
    setLoading(true)
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (!error) setModels(data || [])
    setLoading(false)
  }

  const filtered = models.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.niche.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Modelos</h1>
          <p className="text-gray-500 text-sm mt-1">{models.length} modelo{models.length !== 1 ? 's' : ''} activo{models.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/new" className="btn-primary">
          <Plus size={16} />
          Nueva Modelo
        </Link>
      </div>

      {models.length > 0 && (
        <div className="relative mb-6">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            className="input pl-10 max-w-xs"
            placeholder="Buscar por nombre o nicho..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="card animate-pulse h-36" />)}
        </div>
      )}

      {!loading && filtered.length === 0 && <EmptyState hasSearch={search.length > 0} />}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(model => <ModelCard key={model.id} model={model} />)}
        </div>
      )}
    </div>
  )
}

function EmptyState({ hasSearch }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-center mb-4">
        <Users size={28} className="text-gray-600" />
      </div>
      {hasSearch ? (
        <>
          <h3 className="text-white font-semibold mb-1">Sin resultados</h3>
          <p className="text-gray-500 text-sm">Ninguna modelo coincide con tu búsqueda</p>
        </>
      ) : (
        <>
          <h3 className="text-white font-semibold mb-1">Sin modelos aún</h3>
          <p className="text-gray-500 text-sm mb-6">Crea tu primera modelo para empezar</p>
          <Link to="/new" className="btn-primary">
            <Plus size={16} />
            Crear primera modelo
          </Link>
        </>
      )}
    </div>
  )
}
