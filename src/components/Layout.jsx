import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Plus, Settings, Play } from 'lucide-react'

export default function Layout() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-brand-surface border-r border-brand-border flex flex-col fixed h-full z-10">
        <div className="px-6 py-5 border-b border-brand-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-pink flex items-center justify-center text-white font-black text-sm">Z</div>
            <div>
              <div className="font-black text-white text-sm tracking-widest">ZAMI AI STUDIO</div>
              <div className="text-gray-600 text-xs">UGC Studio</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItem to="/" icon={<LayoutDashboard size={16} />} label="Modelos" active={pathname === '/'} />
          <NavItem to="/auto" icon={<Play size={16} />} label="Iniciar Batch" active={pathname === '/auto'} />
        </nav>

        <div className="px-3 pb-4 space-y-2">
          <Link to="/auto" className="btn-primary w-full justify-center text-sm">
            <Play size={15} />
            Iniciar
          </Link>
          <Link to="/new" className="btn-secondary w-full justify-center text-sm">
            <Plus size={15} />
            Nueva Modelo
          </Link>
        </div>

        <div className="px-3 pb-5 border-t border-brand-border pt-4">
          <NavItem to="/settings" icon={<Settings size={16} />} label="Configuración" active={pathname === '/settings'} />
        </div>
      </aside>

      <main className="flex-1 ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}

function NavItem({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-brand-pink/10 text-brand-pink font-medium'
          : 'text-gray-400 hover:text-white hover:bg-brand-muted/30'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}
