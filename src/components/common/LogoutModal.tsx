import { useNavigate } from 'react-router-dom'
import { useLogoutStore } from '@/stores/logoutStore'
import { useAuthStore } from '@/stores/authStore'
import AdldLogo from '@/components/common/AdldLogo'

export default function LogoutModal() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isConfirmOpen, isLoggingOut, closeConfirm, confirmLogout } = useLogoutStore()

  if (!isConfirmOpen && !isLoggingOut) return null

  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.username || 'Faith'

  return (
    <>
      {/* 1. Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-up-in select-none">
          <div className="glass-panel modal-card rounded-3xl p-6 sm:p-8 space-y-6 border border-white/10 shadow-2xl max-w-md w-full text-center">
            {/* Header Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-error-container/20 border border-error/30 flex items-center justify-center text-error shadow-lg">
              <span className="material-symbols-outlined text-[32px]">logout</span>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className="font-display text-headline-md text-on-surface">Konfirmasi Keluar</h3>
              <p className="font-body text-body-md text-on-surface-variant">
                Apakah Anda yakin ingin keluar dari akun <strong className="text-on-surface">{displayName}</strong>?
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={closeConfirm}
                className="flex-1 py-3 rounded-xl glass-panel text-on-surface-variant hover:text-on-surface font-body text-label-md transition-colors active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={() => confirmLogout(navigate)}
                className="flex-1 py-3 rounded-xl bg-error text-white font-display text-label-md hover:brightness-110 shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Full-Screen Smooth Logout Transition Animation Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none animate-fade-up-in">
          {/* Pulsing Animated Google Stitch Logo */}
          <div className="relative mb-8 animate-bounce duration-1000">
            <AdldLogo size="xl" showText={false} />
            <div className="absolute inset-0 rounded-full bg-primary-container/20 blur-2xl animate-ping" />
          </div>

          {/* Title & Animated Status */}
          <h2 className="font-display text-headline-lg text-on-surface mb-2">
            Keluar Dari Aplikasi...
          </h2>
          <p className="font-body text-body-lg text-primary-fixed-dim mb-8">
            Sampai jumpa kembali, <span className="text-white font-bold">{displayName}</span>! 👋
          </p>

          {/* Neon Loading Spinner */}
          <div className="flex items-center gap-3 bg-surface-container-high/60 border border-white/10 px-6 py-3 rounded-full shadow-2xl">
            <div className="w-4 h-4 border-2 border-primary-fixed border-t-transparent rounded-full animate-spin" />
            <span className="font-body text-label-sm text-on-surface tracking-wider uppercase font-semibold">
              Clearing Session...
            </span>
          </div>
        </div>
      )}
    </>
  )
}
