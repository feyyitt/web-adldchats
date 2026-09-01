import { useTranslation } from 'react-i18next'

export default function MobileTopHeader() {
  const { t } = useTranslation()

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-3 bg-zinc-950/90 backdrop-blur-xl border-b border-white/10 shadow-md">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-display text-sm sm:text-base font-bold text-emerald-400 truncate">
          {t('app.name')}
        </span>
      </div>
      <div className="flex items-center gap-1 text-on-surface-variant flex-shrink-0">
        <button className="hover:bg-white/10 transition-colors p-1.5 rounded-full text-emerald-400">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </button>
        <button className="hover:bg-white/10 transition-colors p-1.5 rounded-full">
          <span className="material-symbols-outlined text-[20px]">person_add</span>
        </button>
        <button className="hover:bg-white/10 transition-colors p-1.5 rounded-full">
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>
      </div>
    </header>
  )
}
