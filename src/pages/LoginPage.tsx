import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'
import AdldLogo from '@/components/common/AdldLogo'
import GuestLoginModal from '@/components/auth/GuestLoginModal'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setUser, setProfile } = useAuthStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [forgotUsername, setForgotUsername] = useState('')
  const [forgotStatus, setForgotStatus] = useState<string | null>(null)

  // Welcome Login Animation State
  const [isLoggingInAnim, setIsLoggingInAnim] = useState(false)
  const [welcomeName, setWelcomeName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const data = await authService.login(username, password)
      if (data.user) {
        setUser(data.user)
        const profile = await authService.getProfile(data.user.id)
        if (profile) setProfile(profile)

        const name = profile?.display_name || data.user.user_metadata?.display_name || username
        setWelcomeName(name)
        setIsLoggingInAnim(true)

        // 1.3s smooth welcome transition
        setTimeout(() => {
          setIsLoggingInAnim(false)
          navigate('/')
        }, 1300)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setErrorMsg(message)
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="w-full">
        <div className="w-full glass-panel rounded-3xl p-7 md:p-8 border border-white/15 shadow-2xl space-y-6">
          {/* Official ADLD Logo */}
          <div className="flex justify-center mb-2">
            <AdldLogo size="lg" showText={false} />
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="font-display text-headline-md text-on-surface font-bold">
              {t('auth.welcomeBack')}
            </h1>
            <p className="font-body text-body-md text-on-surface-variant mt-1">
              Masuk untuk melanjutkan ke ADLD Chats
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-body-md text-center font-medium"
            >
              {errorMsg}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block font-body text-label-md text-on-surface mb-2 font-semibold">
                Nama Pengguna
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  person
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan nama pengguna"
                  className="w-full bg-zinc-900/80 border border-white/10 text-on-surface font-body text-body-md rounded-2xl pl-11 pr-4 py-3 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-on-surface-variant/40"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-body text-label-md text-on-surface font-semibold">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordOpen(true)
                    setForgotStatus(null)
                  }}
                  className="font-body text-label-sm text-emerald-400 hover:underline transition-colors cursor-pointer"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full bg-zinc-900/80 border border-white/10 text-on-surface font-body text-body-md rounded-2xl pl-11 pr-11 py-3 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-on-surface-variant/40"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-display text-label-md py-3.5 rounded-2xl transition-all shadow-lg font-bold tracking-wider uppercase active:scale-98 disabled:opacity-50 mt-2"
            >
              {isLoading ? t('common.loading') : 'MASUK'}
            </motion.button>
          </form>

          {/* Guest Catalog Quick Entry Button */}
          <div>
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-3 text-[11px] text-on-surface-variant/60 font-semibold uppercase">Atau</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => setIsGuestModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-zinc-800/90 hover:bg-zinc-700/90 border border-white/15 text-emerald-400 font-display text-label-md font-bold flex items-center justify-center gap-2 transition-all shadow-md mt-2"
            >
              <span className="material-symbols-outlined text-[20px]">storefront</span>
              <span>Masuk sebagai Tamu (Lihat Katalog)</span>
            </motion.button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center font-body text-body-md text-on-surface-variant pt-2 border-t border-white/10">
            Belum punya akun?{' '}
            <Link
              to="/register"
              className="text-emerald-400 hover:underline transition-colors font-bold"
            >
              Buat akun
            </Link>
          </p>
        </div>
      </div>

      {/* Guest Login Modal */}
      <GuestLoginModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
      />

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {isForgotPasswordOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="glass-panel modal-card rounded-3xl p-6 sm:p-7 space-y-4 border border-white/15 shadow-2xl max-w-md w-full"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">lock_reset</span>
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-white">Lupa Kata Sandi?</h3>
                    <p className="font-body text-xs text-zinc-400">Pemulihan akses akun ADLD Chats</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {forgotStatus ? (
                <div className="space-y-4 py-2">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs leading-relaxed">
                    {forgotStatus}
                  </div>
                  <button
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs font-bold rounded-2xl transition-all shadow-lg active:scale-95"
                  >
                    Kembali ke Login
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!forgotUsername.trim()) return
                    setForgotStatus(
                      `Permintaan reset kata sandi untuk akun "@${forgotUsername.trim()}" telah dicatat. Silakan hubungi Administrator (@faith) atau admin server untuk verifikasi instan.`
                    )
                  }}
                  className="space-y-4 py-1"
                >
                  <p className="font-body text-xs text-zinc-300 leading-relaxed">
                    Masukkan nama pengguna (username) Anda yang terdaftar untuk mengajukan reset kata sandi:
                  </p>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">Nama Pengguna</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-[18px]">
                        person
                      </span>
                      <input
                        type="text"
                        value={forgotUsername}
                        onChange={(e) => setForgotUsername(e.target.value)}
                        placeholder="Contoh: faith atau user_anda"
                        className="w-full bg-zinc-900/90 border border-white/10 text-white text-xs rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(false)}
                      className="flex-1 py-3 glass-panel text-zinc-400 hover:text-white font-display text-xs font-bold rounded-2xl transition-all hover:bg-white/10"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs font-bold rounded-2xl transition-all shadow-lg active:scale-95"
                    >
                      Kirim Permintaan
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Welcome Login Transition Overlay */}
      <AnimatePresence>
        {isLoggingInAnim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#09090b]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none"
          >
            {/* Animated Google Stitch Logo */}
            <div className="relative mb-8 animate-bounce duration-1000">
              <AdldLogo size="xl" showText={false} />
            </div>

            {/* Welcome Title */}
            <h2 className="font-display text-headline-lg text-on-surface mb-2 font-bold">
              Selamat Datang Kembali, <span className="text-emerald-400 font-extrabold">{welcomeName}</span>! 🔥
            </h2>
            <p className="font-body text-body-lg text-on-surface-variant mb-8">
              Menyiapkan obrolan, peta 3D avatar & streak Anda...
            </p>

            {/* Progress Bar & Status */}
            <div className="w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden relative shadow-inner mb-3">
              <div className="h-full bg-emerald-500 animate-pulse w-full" />
            </div>

            <span className="font-body text-label-sm text-emerald-400 uppercase tracking-widest font-semibold">
              Connecting to ADLD Network...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
