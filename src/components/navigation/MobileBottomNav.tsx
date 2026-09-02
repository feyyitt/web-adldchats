import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface MobileNavItem {
  to: string
  icon: string
  label: string
}

export default function MobileBottomNav() {
  const { t } = useTranslation()

  const navItems: MobileNavItem[] = [
    { to: '/', icon: 'home', label: 'Beranda' },
    { to: '/chat', icon: 'chat', label: t('nav.chat') },
    { to: '/catalog', icon: 'storefront', label: 'Katalog' },
    { to: '/map', icon: 'map', label: 'ADLD Maps' },
    { to: '/profile', icon: 'person', label: t('nav.profile') },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-2xl border-t border-white/10 safe-area-bottom select-none shadow-2xl">
      <div className="flex items-center justify-around h-16 px-2 w-full max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all flex-1 text-center ${
                isActive
                  ? 'text-emerald-400 bg-emerald-500/15 font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {item.icon}
                </span>
                <span className="text-[10px] font-semibold tracking-tight truncate block text-center leading-tight mt-0.5">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
