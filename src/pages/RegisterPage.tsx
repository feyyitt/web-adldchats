import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
      setErrorMsg('Passwords do not match')
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
      const message = err instanceof Error ? err.message : 'Registration failed'
      setErrorMsg(message)
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="w-full max-w-md">
        <div className="glass-panel modal-card rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl">
          {/* Official ADLD Logo */}
          <div className="flex justify-center mb-6">
            <AdldLogo size="xl" showText={false} />
          </div>

          {/* Title */}
          <h1 className="font-display text-headline-md text-on-surface text-center mb-1">
            {t('auth.register')}
          </h1>
          <p className="font-body text-body-md text-on-surface-variant text-center mb-8">
            {t('auth.signInContinue')}
          </p>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-6 p-3 rounded-xl bg-error-container/20 border border-error/30 text-error text-body-md text-center">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Name */}
            <div>
              <label className="block font-body text-label-md text-on-surface mb-2">
                {t('auth.displayName')}
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  badge
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('auth.displayNamePlaceholder')}
                  className="w-full bg-surface-container-highest border border-white/10 text-on-surface font-body text-body-md rounded-xl pl-10 pr-4 py-3 focus:outline-none input-glow transition-all placeholder:text-on-surface-variant/50"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block font-body text-label-md text-on-surface mb-2">
                {t('auth.username')}
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  alternate_email
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('auth.usernamePlaceholder')}
                  className="w-full bg-surface-container-highest border border-white/10 text-on-surface font-body text-body-md rounded-xl pl-10 pr-4 py-3 focus:outline-none input-glow transition-all placeholder:text-on-surface-variant/50"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-body text-label-md text-on-surface mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full bg-surface-container-highest border border-white/10 text-on-surface font-body text-body-md rounded-xl pl-10 pr-4 py-3 focus:outline-none input-glow transition-all placeholder:text-on-surface-variant/50"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block font-body text-label-md text-on-surface mb-2">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  lock
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  className="w-full bg-surface-container-highest border border-white/10 text-on-surface font-body text-body-md rounded-xl pl-10 pr-4 py-3 focus:outline-none input-glow transition-all placeholder:text-on-surface-variant/50"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-container text-on-primary-container font-display text-label-md py-3 rounded-lg neon-glow-primary hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {isLoading ? t('common.loading') : t('auth.register')}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center font-body text-body-md text-on-surface-variant mt-6">
            {t('auth.haveAccount')}{' '}
            <Link
              to="/login"
              className="text-secondary-container hover:text-secondary transition-colors font-semibold"
            >
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>

      {/* Full-Screen Welcome Register Transition Overlay */}
      {isRegisterAnim && (
        <div className="fixed inset-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none animate-fade-up-in">
          {/* Animated Google Stitch Logo */}
          <div className="relative mb-8 animate-bounce duration-1000">
            <AdldLogo size="xl" showText={false} />
            <div className="absolute inset-0 rounded-full bg-primary-container/25 blur-3xl animate-ping" />
          </div>

          {/* Welcome Title */}
          <h2 className="font-display text-headline-lg text-on-surface mb-2">
            Selamat Datang, <span className="text-primary-fixed font-bold">{registeredName}</span>! 🚀
          </h2>
          <p className="font-body text-body-lg text-on-surface-variant mb-8">
            Akun ADLD Chats Anda telah berhasil dibuat!
          </p>

          {/* Progress Bar & Status */}
          <div className="w-64 h-1.5 bg-surface-container-high rounded-full overflow-hidden relative shadow-inner mb-3">
            <div className="h-full bg-gradient-to-r from-primary-fixed via-secondary-container to-tertiary-fixed animate-pulse w-full" />
          </div>

          <span className="font-body text-label-sm text-primary-fixed-dim uppercase tracking-widest font-semibold">
            Initializing Profile & Map...
          </span>
        </div>
      )}
    </>
  )
}
