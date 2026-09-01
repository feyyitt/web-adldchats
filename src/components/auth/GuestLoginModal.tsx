import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCatalogStore } from '@/stores/catalogStore'
import { useAuthStore } from '@/stores/authStore'
import AdldLogo from '@/components/common/AdldLogo'

interface GuestLoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function GuestLoginModal({ isOpen, onClose }: GuestLoginModalProps) {
  const navigate = useNavigate()
  const [guestNameInput, setGuestNameInput] = useState('')
  const getNextGuestTag = useCatalogStore((state) => state.getNextGuestTag)
  const guestCounter = useCatalogStore((state) => state.guestCounter)
  const loginAsGuest = useAuthStore((state) => state.loginAsGuest)

  if (!isOpen) return null

  const previewNum = guestCounter + 1
  const previewTag = (guestNameInput.trim() || 'Tamu') + ` #${previewNum}`

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const { guestId, guestTag } = getNextGuestTag(guestNameInput)
    loginAsGuest(guestTag, guestId)
    onClose()
    navigate('/catalog')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="glass-panel modal-card rounded-3xl p-6 md:p-8 space-y-5 border border-white/15 shadow-2xl"
      >
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <AdldLogo size="sm" showText={false} />
            <div>
              <h3 className="font-display text-headline-sm text-on-surface font-bold">
                Masuk sebagai Tamu
              </h3>
              <p className="font-body text-xs text-emerald-400 font-semibold">
                Buka Katalog Jasa & Barang ADLD
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-body text-label-md text-on-surface mb-2 font-semibold">
              Nama Anda
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                badge
              </span>
              <input
                type="text"
                value={guestNameInput}
                onChange={(e) => setGuestNameInput(e.target.value)}
                placeholder="misal: Budi, Siti, Alex..."
                className="w-full bg-zinc-900/90 border border-white/10 text-on-surface font-body text-body-md rounded-2xl pl-11 pr-4 py-3 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-on-surface-variant/40"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Live ID Tag Preview */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 text-[18px]">
                confirmation_number
              </span>
              <span className="font-body text-xs text-on-surface-variant font-medium">
                ID Tag Customer Anda:
              </span>
            </div>
            <span className="font-display text-label-md text-emerald-400 font-bold px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/30">
              {previewTag}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl glass-panel text-on-surface-variant hover:text-on-surface font-semibold text-sm"
            >
              Batal
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display text-label-sm font-bold shadow-lg uppercase tracking-wider flex items-center gap-2"
            >
              <span>Buka Katalog</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
