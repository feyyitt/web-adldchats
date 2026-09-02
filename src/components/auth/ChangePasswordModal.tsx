import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { authService } from '@/services/authService'
import { useToastStore } from '@/stores/toastStore'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const showToast = useToastStore((state) => state.showToast)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showOldPass, setShowOldPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (newPassword.length < 6) {
      setErrorMsg('Password baru minimal harus 6 karakter.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok dengan password baru.')
      return
    }

    setIsLoading(true)

    try {
      await authService.changePassword(newPassword)
      showToast('Kata sandi berhasil diperbarui!', 'success')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui password.'
      setErrorMsg(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="glass-panel modal-card rounded-3xl p-6 sm:p-8 space-y-5 border border-white/10 shadow-2xl w-full max-w-md relative"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="material-symbols-outlined text-[24px]">lock_reset</span>
                </div>
                <div>
                  <h3 className="font-display text-headline-sm text-on-surface font-bold">
                    Ganti Kata Sandi
                  </h3>
                  <p className="font-body text-xs text-on-surface-variant mt-0.5">
                    Perbarui kata sandi akun Anda untuk keamanan ekstra
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Old Password */}
              <div>
                <label className="block font-body text-xs font-bold text-on-surface mb-1.5">
                  Password Lama / Saat Ini
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Ketik password lama Anda"
                    className="w-full bg-zinc-800/80 border border-white/10 text-on-surface font-body text-sm rounded-xl px-4 py-3 pr-11 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showOldPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block font-body text-xs font-bold text-on-surface mb-1.5">
                  Password Baru (Minimal 6 Karakter)
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ketik password baru"
                    className="w-full bg-zinc-800/80 border border-white/10 text-on-surface font-body text-sm rounded-xl px-4 py-3 pr-11 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-500"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showNewPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block font-body text-xs font-bold text-on-surface mb-1.5">
                  Ulangi Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password baru"
                    className="w-full bg-zinc-800/80 border border-white/10 text-on-surface font-body text-sm rounded-xl px-4 py-3 pr-11 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-500"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirmPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl glass-panel text-on-surface-variant hover:text-on-surface font-bold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-display text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">key</span>
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
