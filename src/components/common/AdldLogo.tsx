interface AdldLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export default function AdldLogo({ size = 'md', showText = true, className = '' }: AdldLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }

  const textSizeClasses = {
    sm: 'text-label-lg font-bold tracking-tight',
    md: 'text-headline-sm font-bold tracking-tight',
    lg: 'text-headline-md font-bold tracking-tight',
    xl: 'text-display-sm font-extrabold tracking-tight',
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className={`relative flex items-center justify-center flex-shrink-0 ${sizeClasses[size]}`}>
        {/* Exported Google Stitch Official Logo Container */}
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg border border-white/10 transition-transform duration-300 hover:scale-105">
          <img
            src="/adld_stitch_logo.png"
            alt="ADLD Chats Official Logo"
            className="w-full h-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src =
                'https://lh3.googleusercontent.com/aida/AP1WRLsut-9xGbO_FjR7lLwHb7tKmxgnO-n5NHZO6TIqDCGnBPhGuMteWENsMcBPhZFOpSPtElAsM3dlHsjq5tUxCkLmdkUSqPVp1d2DOhesD8epeJAfuFaDWC8IMQCUTJMnX35ercgpseuBL8mlQSyacGVbtZiPbJtqlhzqNlFEsQGNoaqMZ9tke9qkCaOpRwpBf073LNEONpuX3wxkDON6MVwKg3E3s4U9M3Ee3NaM15UYeqFJjGw0f_IfvWZP'
            }}
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-display text-on-surface ${textSizeClasses[size]}`}>
            ADLD CHATS WEB
          </span>
          {size !== 'sm' && (
            <span className="font-body text-[10px] text-emerald-400 uppercase tracking-widest font-bold -mt-0.5">
              Official Platform
            </span>
          )}
        </div>
      )}
    </div>
  )
}
