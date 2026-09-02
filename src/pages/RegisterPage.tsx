import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'
import AdldLogo from '@/components/common/AdldLogo'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setUser, setProfile } = useAuthStore()

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Welcome Register Animation State
  const [isRegisterAnim, setIsRegisterAnim] = useState(false)
  const [registeredName, setRegisteredName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setErrorMsg('Kata sandi konfirmasi tidak cocok')
      return
    }

    setIsLoading(true)
    setErrorMsg(null)

    try {
      const data = await authService.register(username, displayName, password)
      if (data.user) {
        setUser(data.user)
        const profile = await authService.getProfile(data.user.id)
        if (profile) setProfile(profile)

        setRegisteredName(displayName || username)
        setIsRegisterAnim(true)

        // 1.3s smooth welcome transition
        setTimeout(() => {
          setIsRegisterAnim(false)
          navigate('/')
        }, 1300)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registrasi gagal'
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
              {t('auth.register')}
            </h1>
            <p className="font-body text-body-md text-on-surface-variant mt-1">
              Buat akun baru dan bergabung ke ADLD Chats
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
            {/* Display Name */}
            <div>
              <label className="block font-body text-label-md text-on-surface mb-2 font-semibold">
                Nama Lengkap / Panggilan
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  badge
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Contoh: Alex Mercer"
                  className="w-full bg-zinc-900/80 border border-white/10 text-on-surface font-body text-body-md rounded-2xl pl-11 pr-4 py-3 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-on-surface-variant/40"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block font-body text-label-md text-on-surface mb-2 font-semibold">
                Nama Pengguna (Username)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  alternate_email
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: alex_mercer"
                  className="w-full bg-zinc-900/80 border border-white/10 text-on-surface font-body text-body-md rounded-2xl pl-11 pr-4 py-3 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-on-surface-variant/40"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-body text-label-md text-on-surface mb-2 font-semibold">
                Kata Sandi
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-zinc-900/80 border border-white/10 text-on-surface font-body text-body-md rounded-2xl pl-11 pr-4 py-3 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-on-surface-variant/40"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block font-body text-label-md text-on-surface mb-2 font-semibold">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  lock_reset
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  className="w-full bg-zinc-900/80 border border-white/10 text-on-surface font-body text-body-md rounded-2xl pl-11 pr-4 py-3 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-on-surface-variant/40"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-display text-label-md py-3.5 rounded-2xl transition-all shadow-lg font-bold tracking-wider uppercase active:scale-98 disabled:opacity-50 mt-2"
            >
              {isLoading ? t('common.loading') : 'DAFTAR SEKARANG'}
            </motion.button>
          </form>

          {/* Sign In Link */}
          <p className="text-center font-body text-body-md text-on-surface-variant pt-2 border-t border-white/10">
            {t('auth.haveAccount')}{' '}
            <Link
              to="/login"
              className="text-emerald-400 hover:underline transition-colors font-bold"
            >
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>

      {/* Full-Screen Welcome Register Transition Overlay */}
      <AnimatePresence>
        {isRegisterAnim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#09090b]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none"
          >
            {/* Animated ADLD Logo */}
            <div className="relative mb-8 animate-bounce duration-1000">
              <AdldLogo size="xl" showText={false} />
            </div>

            {/* Welcome Title */}
            <h2 className="font-display text-headline-lg text-on-surface mb-2 font-bold">
              Selamat Datang, <span className="text-emerald-400 font-extrabold">{registeredName}</span>! 🚀
            </h2>
            <p className="font-body text-body-lg text-on-surface-variant mb-8">
              Akun ADLD Chats Anda telah berhasil dibuat!
            </p>

            {/* Progress Bar & Status */}
            <div className="w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden relative shadow-inner mb-3">
              <div className="h-full bg-emerald-500 animate-pulse w-full" />
            </div>

            <span className="font-body text-label-sm text-emerald-400 uppercase tracking-widest font-semibold">
              Initializing Profile & Map...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
