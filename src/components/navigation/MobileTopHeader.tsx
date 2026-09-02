import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AdldLogo from '@/components/common/AdldLogo'

export default function MobileTopHeader() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const pendingNotifsCount = 0

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex justify-between items-center px-4 bg-zinc-950/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
      <div className="flex items-center gap-2 min-w-0" onClick={() => navigate('/')} role="button">
        <AdldLogo size="sm" showText={false} />
        <span className="font-display text-sm font-bold text-emerald-400 truncate tracking-tight">
          ADLD CHATS
        </span>
      </div>
      <div className="flex items-center gap-1 text-on-surface-variant flex-shrink-0">
        <button
          onClick={() => navigate('/notifications')}
          className="hover:bg-white/10 transition-colors p-2 rounded-full text-emerald-400 relative active:scale-95"
          title="Notifikasi"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {pendingNotifsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          )}
        </button>
        <button
          onClick={() => navigate('/friends')}
          className="hover:bg-white/10 transition-colors p-2 rounded-full text-on-surface hover:text-white active:scale-95"
          title="Tambah Teman"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="hover:bg-white/10 transition-colors p-2 rounded-full text-on-surface hover:text-white active:scale-95"
          title="Pengaturan"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>
      </div>
    </header>
  )
}
