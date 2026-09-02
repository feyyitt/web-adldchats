import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'

interface ChatItem {
  id: string
  name: string
  message: string
  time: string
  streak: number
  unread: number
  online: boolean
  isGroup?: boolean
}

export default function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.user_metadata?.username || 'Faith'

  const [activeChats] = useState<ChatItem[]>(() => {
    const saved = localStorage.getItem('adld_conversations')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return Array.isArray(parsed) ? parsed.map((c: any) => ({
          id: c.id,
          name: c.name,
          message: c.lastMessage || 'Obrolan dimulai',
          time: c.time || 'Baru saja',
          streak: c.streak || 0,
          unread: c.unread || 0,
          online: !!c.online,
          isGroup: !!c.isGroup,
        })) : []
      } catch {}
    }
    return []
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="px-4 sm:px-6 md:px-8 py-6 max-w-[1200px] mx-auto min-h-screen select-none space-y-5 sm:space-y-6"
    >
      {/* Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-headline-md md:text-display-lg text-on-surface tracking-tight font-bold leading-tight">
            Selamat Datang, {displayName}! 👋
          </h1>
          <p className="font-body text-xs sm:text-body-md text-on-surface-variant mt-1">
            Siap untuk berdiskusi, mengelola katalog bisnis, atau melihat teman online?
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate('/catalog')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-display text-label-md px-5 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg btn-shimmer"
          >
            <span className="material-symbols-outlined text-[20px]">storefront</span>
            Katalog Bisnis
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="glass-panel text-on-surface font-display text-label-md px-5 py-3 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 active:scale-95 border border-white/15 shadow-md"
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
            Buka Obrolan
          </button>
        </div>
      </div>

      {/* Quick Business Catalog Highlight Banner */}
      <div
        onClick={() => navigate('/catalog')}
        className="glass-panel glass-spotlight rounded-3xl p-6 cursor-pointer border border-emerald-500/30 hover:border-emerald-400 transition-all group flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
            <span className="material-symbols-outlined text-[32px]">storefront</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-headline-sm text-white font-bold">Katalog Bisnis & Jasa ADLD</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-zinc-950 font-bold text-[10px]">
                4 Produk Ready
              </span>
            </div>
            <p className="font-body text-xs text-on-surface-variant mt-1">
              Jasa joki tugas kampus/makalah, pembuatan website custom & UMKM, desain logo, dan avatar 3D.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-emerald-400 font-display text-xs font-bold bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-all flex-shrink-0">
          <span>Lihat Katalog</span>
          <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Chats & Engagement */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Chats Section */}
          <section className="glass-panel rounded-3xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-headline-md text-on-surface font-bold">
                {t('home.activeChats')}
              </h2>
              <button
                onClick={() => navigate('/chat')}
                className="font-body text-label-sm text-emerald-400 hover:underline transition-colors font-semibold"
              >
                {t('home.seeAll')}
              </button>
            </div>

            {activeChats.length > 0 ? (
              <div className="space-y-3">
                {activeChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => navigate('/chat')}
                    className="w-full glass-panel glass-spotlight rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all group border border-white/5"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10">
                        <span className="material-symbols-outlined text-on-surface-variant">
                          {chat.isGroup ? 'group' : 'person'}
                        </span>
                      </div>
                      {chat.online && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-zinc-950 animate-pulse" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-body text-label-md text-on-surface truncate group-hover:text-emerald-400 transition-colors font-bold">
                          {chat.name}
                        </h3>
                        <span className="font-body text-label-sm text-emerald-400 font-semibold flex-shrink-0 ml-2">
                          {chat.time}
                        </span>
                      </div>
                      <p className="font-body text-body-md text-on-surface-variant truncate text-xs">
                        {chat.message}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {chat.streak > 0 && (
                        <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            local_fire_department
                          </span>
                          <span className="font-body text-label-sm font-bold">{chat.streak}</span>
                        </span>
                      )}
                      {chat.unread > 0 && (
                        <span className="w-6 h-6 rounded-full bg-emerald-500 text-zinc-950 text-[11px] font-extrabold flex items-center justify-center shadow-md">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 px-4 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-[30px]">chat_bubble_outline</span>
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h4 className="font-display font-bold text-white text-base">Belum Ada Obrolan Aktif</h4>
                  <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    Mulai percakapan baru dengan teman Anda atau berdiskusi dengan penjual katalog bisnis.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/chat')}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs font-bold transition-all shadow-md active:scale-95 inline-flex items-center gap-2 mx-auto"
                >
                  <span className="material-symbols-outlined text-[18px]">add_comment</span>
                  <span>Mulai Obrolan Baru</span>
                </button>
              </div>
            )}
          </section>

          {/* Quick Friend Engagement */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => navigate('/map')}
              className="glass-panel glass-spotlight rounded-3xl p-6 cursor-pointer border border-white/10 hover:border-emerald-500/40 transition-all group flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="material-symbols-outlined text-[28px]">map</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-emerald-400 group-hover:translate-x-1 transition-all">
                  arrow_forward
                </span>
              </div>
              <div>
                <h3 className="font-display text-headline-sm text-on-surface mb-1 font-bold">ADLD Maps 3D</h3>
                <p className="font-body text-body-md text-on-surface-variant text-xs">
                  Jelajahi peta interaktif 3D & bagikan lokasi Anda secara real-time
                </p>
              </div>
            </div>

            <div
              onClick={() => navigate('/friends')}
              className="glass-panel glass-spotlight rounded-3xl p-6 cursor-pointer border border-white/10 hover:border-amber-500/40 transition-all group flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <span className="material-symbols-outlined text-[28px]">group</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-amber-400 group-hover:translate-x-1 transition-all">
                  arrow_forward
                </span>
              </div>
              <div>
                <h3 className="font-display text-headline-sm text-on-surface mb-1 font-bold">Lingkaran Teman</h3>
                <p className="font-body text-body-md text-on-surface-variant text-xs">
                  Kelola daftar koneksi dan jalin relasi pertemanan Anda
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Streaks Widget & Profile Quick Overview */}
        <div className="lg:col-span-4 space-y-6">
          {/* ADLD Streak Widget */}
          <div className="glass-panel glass-spotlight rounded-3xl p-6 relative overflow-hidden group border border-amber-500/30 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
            <div className="flex items-center gap-3 mb-4">
              <span
                className="material-symbols-outlined text-[36px] text-amber-400 group-hover:scale-110 transition-transform"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_fire_department
              </span>
              <div>
                <h3 className="font-display text-headline-sm text-on-surface font-bold">ADLD Streak 🔥</h3>
                <p className="font-body text-label-sm text-amber-400 font-semibold">Momentum Obrolan Harian</p>
              </div>
            </div>
            <p className="font-body text-xs text-on-surface-variant mb-4 leading-relaxed">
              Pertahankan momentum obrolan Anda secara rutin setiap hari untuk meningkatkan angka streak api Anda.
            </p>
            <button
              onClick={() => navigate('/chat')}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-all btn-shimmer"
            >
              Mulai Obrolan Baru
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
