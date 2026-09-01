import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AdldLogo from '@/components/common/AdldLogo'
import { soundService } from '@/services/soundService'

export interface InvoiceData {
  invoiceNo: string
  customerTag: string
  itemTitle: string
  amount: string
  status: 'LUNAS' | 'MENUNGGU'
  date: string
}

interface OrderInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSendInvoice: (invoice: InvoiceData) => void
  defaultItemTitle?: string
  defaultAmount?: string
  defaultCustomerTag?: string
}

export default function OrderInvoiceModal({
  isOpen,
  onClose,
  onSendInvoice,
  defaultItemTitle = 'Joki Koding & Pembuatan Website',
  defaultAmount = 'Rp 350.000',
  defaultCustomerTag = 'Budi #1',
}: OrderInvoiceModalProps) {
  const [invoiceNo] = useState(() => `INV-${Math.floor(100000 + Math.random() * 900000)}`)
  const [customerTag, setCustomerTag] = useState(defaultCustomerTag)
  const [itemTitle, setItemTitle] = useState(defaultItemTitle)
  const [amount, setAmount] = useState(defaultAmount)
  const [status, setStatus] = useState<'LUNAS' | 'MENUNGGU'>('LUNAS')

  if (!isOpen) return null

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    soundService.playStatusSuccess()
    onSendInvoice({
      invoiceNo,
      customerTag,
      itemTitle,
      amount,
      status,
      date: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    })
    onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="glass-panel modal-card rounded-3xl p-6 border border-white/15 shadow-2xl max-w-lg w-full space-y-5 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              </div>
              <div>
                <h3 className="font-display text-headline-sm font-bold text-white">Buat Nota Digital ADLD</h3>
                <p className="font-body text-xs text-on-surface-variant">Struk bukti transaksi resmi untuk pelanggan</p>
              </div>
            </div>
            <button onClick={onClose} className="text-on-surface-variant hover:text-white p-1">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            {/* Invoice Digital Preview Card */}
            <div className="rounded-2xl bg-zinc-950/90 border border-emerald-500/30 p-5 space-y-3 relative overflow-hidden shadow-inner">
              <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />

              <div className="flex justify-between items-start border-b border-white/10 pb-3">
                <div>
                  <AdldLogo size="sm" />
                  <p className="font-body text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-1">Official Digital Receipt</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-white block">{invoiceNo}</span>
                  <span className="font-body text-[10px] text-on-surface-variant">
                    {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Form Input Controls */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Pelanggan Tag</label>
                  <input
                    type="text"
                    value={customerTag}
                    onChange={(e) => setCustomerTag(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-1.5 font-body text-xs text-white focus:border-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Status Pembayaran</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'LUNAS' | 'MENUNGGU')}
                    className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-1.5 font-body text-xs text-emerald-400 font-bold focus:border-emerald-500 outline-none"
                  >
                    <option value="LUNAS">✅ LUNAS (PAID)</option>
                    <option value="MENUNGGU">⏳ MENUNGGU (PENDING)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Nama Barang / Jasa</label>
                <input
                  type="text"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-1.5 font-body text-xs text-white focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Total Nominal</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-1.5 font-body text-xs text-emerald-400 font-bold focus:border-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl glass-panel hover:bg-white/10 text-on-surface font-display text-xs font-bold transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Kirim Nota ke Chat</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
