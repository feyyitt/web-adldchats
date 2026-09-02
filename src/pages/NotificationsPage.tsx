import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface NotificationItem {
  id: string
  title: string
  body: string
  time: string
  icon: string
  unread: boolean
}

export default function NotificationsPage() {
  const { t } = useTranslation()

  const [notifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('adld_notifications')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return []
  })

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1200px] mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="font-display text-display-lg-mobile md:text-display-lg text-on-surface tracking-tight font-bold">
          {t('nav.notifications')}
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant mt-1">
          Dapatkan info pembaruan obrolan, pesanan katalog, dan aktivitas akun
        </p>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`glass-panel rounded-2xl p-4 flex items-start gap-4 transition-all border border-white/10 ${
                notif.unread ? 'border-l-4 border-l-emerald-500 bg-emerald-500/5' : ''
              }`}
            >
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">{notif.icon}</span>
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-body text-label-md text-on-surface font-bold">{notif.title}</h3>
                  <span className="font-body text-label-sm text-on-surface-variant">{notif.time}</span>
                </div>
                <p className="font-body text-body-md text-on-surface-variant mt-0.5 text-xs">{notif.body}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full flex items-center justify-center py-8">
          <div className="glass-panel empty-card-panel rounded-3xl p-8 sm:p-10 text-center border border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 text-on-surface-variant/40 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[36px]">notifications_off</span>
          </div>
            <div className="space-y-1">
              <h3 className="font-display text-headline-sm text-white font-bold">
                Belum Ada Notifikasi
              </h3>
              <p className="font-body text-xs text-on-surface-variant">
                Semua pemberitahuan baru terkait aktivitas obrolan atau pesanan akan muncul di sini.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
