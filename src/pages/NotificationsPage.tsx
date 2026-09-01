import { useTranslation } from 'react-i18next'

const DEMO_NOTIFICATIONS = [
  { id: '1', title: 'New Message', body: 'Kael Mercer sent you a message.', time: '5m ago', icon: 'chat', unread: true },
  { id: '2', title: 'Streak Flame!', body: 'You hit a 24-day streak with Marcus Vance!', time: '1h ago', icon: 'local_fire_department', unread: true },
  { id: '3', title: 'Friend Request', body: 'David Kim sent you a friend request.', time: '1d ago', icon: 'person_add', unread: false },
]

export default function NotificationsPage() {
  const { t } = useTranslation()

  return (
    <div className="px-[20px] md:px-[40px] py-6 md:py-8 max-w-[1200px] mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="font-display text-display-lg-mobile md:text-display-lg text-on-surface tracking-tight">
          {t('nav.notifications')}
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant mt-1">
          Stay updated on friends and chat activity
        </p>
      </div>

      <div className="space-y-3">
        {DEMO_NOTIFICATIONS.map((notif) => (
          <div
            key={notif.id}
            className={`glass-panel rounded-2xl p-4 flex items-start gap-4 transition-all ${
              notif.unread ? 'border-l-4 border-l-primary-fixed bg-surface-container-high/30' : ''
            }`}
          >
            <div className="p-3 rounded-xl bg-primary-container/10 text-primary-fixed-dim mt-0.5">
              <span className="material-symbols-outlined text-[20px]">{notif.icon}</span>
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h3 className="font-body text-label-md text-on-surface">{notif.title}</h3>
                <span className="font-body text-label-sm text-on-surface-variant">{notif.time}</span>
              </div>
              <p className="font-body text-body-md text-on-surface-variant mt-0.5">{notif.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
