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
    { to: '/map', icon: 'map', label: 'Maps' },
    { to: '/profile', icon: 'person', label: t('nav.profile') },
  ]

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 50,
      }}
      className="md:hidden bg-zinc-950/95 backdrop-blur-2xl border-t border-white/10 safe-area-bottom select-none shadow-2xl"
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '60px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={{
              flex: '1 1 0%',
              width: '20%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className={({ isActive }) =>
              `py-1 transition-all text-center ${
                isActive
                  ? 'text-emerald-400 bg-emerald-500/15 font-bold'
                  : 'text-zinc-400 hover:text-white'
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
                <span className="text-[10px] font-semibold tracking-tight truncate block text-center leading-tight mt-0.5 w-full">
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

