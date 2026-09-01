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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest/95 backdrop-blur-2xl border-t border-white/10 safe-area-bottom select-none">
      <div className="grid grid-cols-5 items-center h-16 px-1 w-full max-w-md mx-auto text-center">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all w-full ${
                isActive
                  ? 'text-emerald-400 bg-emerald-500/15 font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {item.icon}
                </span>
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-tighter truncate w-full block text-center leading-none mt-0.5">
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
