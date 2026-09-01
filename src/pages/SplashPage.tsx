import { useTranslation } from 'react-i18next'
import AdldLogo from '@/components/common/AdldLogo'

export default function SplashPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      {/* Official ADLD Logo */}
      <div className="relative mb-8 animate-fade-up-in">
        <AdldLogo size="xl" showText={false} />
      </div>

      {/* App Name */}
      <h1 className="font-display text-headline-lg text-on-surface mb-4 animate-fade-up-in" style={{ animationDelay: '0.3s' }}>
        {t('app.name')}
      </h1>

      {/* Connecting Status */}
      <div className="flex items-center gap-2 animate-fade-up-in" style={{ animationDelay: '0.6s' }}>
        <div className="w-2 h-2 rounded-full bg-primary-container neon-glow-primary animate-pulse" />
        <span className="font-body text-label-sm text-on-surface-variant uppercase tracking-[0.2em]">
          {t('auth.connecting')}
        </span>
      </div>
    </div>
  )
}
