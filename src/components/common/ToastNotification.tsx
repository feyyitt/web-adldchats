import { motion, AnimatePresence } from 'framer-motion'
import { useToastStore } from '@/stores/toastStore'

export default function ToastNotification() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 25 }}
            className="pointer-events-auto glass-panel p-3.5 rounded-2xl border border-white/15 shadow-2xl flex items-center justify-between gap-3 bg-zinc-950/90 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  toast.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : toast.type === 'warning'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {toast.type === 'success' ? 'check_circle' : toast.type === 'warning' ? 'warning' : 'info'}
                </span>
              </div>
              <p className="font-body text-xs font-bold text-white truncate">{toast.title}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-on-surface-variant hover:text-white p-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
