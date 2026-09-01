import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import AdldLogo from '@/components/common/AdldLogo'
import { useAuthStore } from '@/stores/authStore'
import { useLogoutStore } from '@/stores/logoutStore'

export default function DesktopSidebar() {
  const { t } = useTranslation()
  const location = useLocation()
  const { user } = useAuthStore()
  const openLogoutConfirm = useLogoutStore((state) => state.openConfirm)

  // Sub-routes under Beranda dropdown
  const subFeatureRoutes = ['/catalog', '/chat', '/friends', '/map', '/notifications']
  const isSubRouteActive = subFeatureRoutes.some((route) => location.pathname.startsWith(route))

  // State to control Home dropdown accordion
  const [isHomeDropdownOpen, setIsHomeDropdownOpen] = useState(true)

  // Auto-expand dropdown when any sub-feature is active
  useEffect(() => {
    if (isSubRouteActive) {
      setIsHomeDropdownOpen(true)
    }
  }, [isSubRouteActive])

  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.username || 'Faith'

  const [userAvatar, setUserAvatar] = useState<string>(() => {
    return localStorage.getItem('adld-user-avatar') || '/avatars/male_1_clean.png'
  })

  useEffect(() => {
    const handleAvatarChange = () => {
      const updated = localStorage.getItem('adld-user-avatar') || '/avatars/male_1_clean.png'
      setUserAvatar(updated)
    }
    window.addEventListener('adld-avatar-changed', handleAvatarChange)
    return () => window.removeEventListener('adld-avatar-changed', handleAvatarChange)
  }, [])

  return (
    <nav className="hidden md:flex flex-col bg-surface-container-lowest/90 backdrop-blur-2xl w-64 h-full border-r border-white/10 fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out p-4 select-none">
      {/* Logo */}
      <div className="mb-6 px-2">
        <AdldLogo size="md" />
        <p className="text-on-surface-variant font-body text-label-sm mt-2">
          {t('app.tagline')}
        </p>
      </div>

      {/* Main Clean Navigation List (3 Root Items: Beranda ▾, Profil, Pengaturan) */}
      <div className="space-y-1.5 flex-1 overflow-y-auto hide-scrollbar">
        
        {/* 1. BERANDA (Home) Accordion Group */}
        <div>
          <div className="flex items-center">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-body text-label-md group ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`material-symbols-outlined text-[22px] ${
                      isActive ? 'text-emerald-400' : ''
                    }`}
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    home
                  </span>
                  <span className="flex-1">Beranda</span>
                </>
              )}
            </NavLink>

            {/* Toggle Dropdown Arrow Button */}
            <button
              onClick={() => setIsHomeDropdownOpen(!isHomeDropdownOpen)}
              className="p-3 text-on-surface-variant hover:text-white transition-transform"
              title={isHomeDropdownOpen ? 'Tutup Fitur' : 'Buka Fitur Lainnya'}
            >
              <span
                className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${
                  isHomeDropdownOpen ? 'rotate-180 text-emerald-400' : ''
                }`}
              >
                expand_more
              </span>
            </button>
          </div>

          {/* Sub-Features Accordion Dropdown */}
          <AnimatePresence initial={false}>
            {isHomeDropdownOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden pl-2 ml-4 mt-1 border-l-2 border-emerald-500/30 space-y-3 py-1"
              >
                {/* Section A: Bisnis & Order */}
                <div className="space-y-1">
                  <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
                    Bisnis & Order
                  </span>
                  
                  <NavLink
                    to="/catalog"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all font-body text-xs font-semibold ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                          : 'text-on-surface-variant hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]">storefront</span>
                    <span>Katalog Bisnis</span>
                  </NavLink>

                  <NavLink
                    to="/chat"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all font-body text-xs font-semibold ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                          : 'text-on-surface-variant hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                    <span>Obrolan</span>
                  </NavLink>
                </div>

                {/* Section B: Sosial & Komunitas */}
                <div className="space-y-1 pt-1 border-t border-white/5">
                  <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60">
                    Sosial & Komunitas
                  </span>

                  <NavLink
                    to="/friends"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all font-body text-xs font-semibold ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                          : 'text-on-surface-variant hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]">group</span>
                    <span>Teman</span>
                  </NavLink>

                  <NavLink
                    to="/map"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all font-body text-xs font-semibold ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                          : 'text-on-surface-variant hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]">map</span>
                    <span>Peta 3D</span>
                  </NavLink>

                  <NavLink
                    to="/notifications"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all font-body text-xs font-semibold ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                          : 'text-on-surface-variant hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]">notifications</span>
                    <span>Notifikasi</span>
                  </NavLink>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. PROFIL (Profile) */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-body text-label-md font-medium group ${
              isActive
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`material-symbols-outlined text-[22px] ${
                  isActive ? 'text-emerald-400' : ''
                }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                person
              </span>
              <span className="flex-1">Profil</span>
            </>
          )}
        </NavLink>

        {/* 3. PENGATURAN (Settings) */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-body text-label-md font-medium group ${
              isActive
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`material-symbols-outlined text-[22px] ${
                  isActive ? 'text-emerald-400' : ''
                }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                settings
              </span>
              <span className="flex-1">Pengaturan</span>
            </>
          )}
        </NavLink>

      </div>

      {/* User Footer & Logout Button */}
      <div className="mt-auto pt-4 border-t border-white/10 space-y-2">
        <NavLink
          to="/profile"
          className="flex items-center gap-3 hover:bg-surface-container-high/40 p-2.5 rounded-2xl transition-colors"
        >
          <img
            src={userAvatar}
            alt="Profile Avatar"
            className="w-10 h-10 object-cover rounded-xl bg-surface-container-high border border-white/10 p-0.5 shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <p className="font-body text-label-md text-on-surface truncate font-bold">{displayName}</p>
            <p className="font-body text-label-sm text-emerald-400 truncate">
              {t('chat.online')}
            </p>
          </div>
        </NavLink>

        <button
          onClick={openLogoutConfirm}
          className="w-full bg-error-container/20 hover:bg-error-container/40 border border-error/30 text-error font-body text-label-md py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 group"
          title="Sign Out"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:translate-x-0.5 transition-transform">
            logout
          </span>
          Logout
        </button>
      </div>
    </nav>
  )
}
