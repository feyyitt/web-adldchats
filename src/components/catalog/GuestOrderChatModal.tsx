import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { CatalogItem } from '@/stores/catalogStore'
import OrderInvoiceModal from '@/components/catalog/OrderInvoiceModal'
import type { InvoiceData } from '@/components/catalog/OrderInvoiceModal'
import { soundService } from '@/services/soundService'
import { useToastStore } from '@/stores/toastStore'

interface GuestOrderChatModalProps {
  item: CatalogItem | null
  guestTag: string
  onClose: () => void
}

export interface RichChatMsg {
  id: string
  sender: 'guest' | 'seller'
  text: string
  time: string
  reactions?: string[]
  attachment?: {
    type: 'image' | 'file' | 'audio'
    url: string
    name: string
  }
  invoice?: InvoiceData
}

export default function GuestOrderChatModal({ item, guestTag, onClose }: GuestOrderChatModalProps) {
  const [messages, setMessages] = useState<RichChatMsg[]>([])
  const [inputMsg, setInputMsg] = useState('')
  const [orderStatus, setOrderStatus] = useState<'BARU' | 'DIPROSES' | 'SELESAI'>('BARU')
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  const chatBottomRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (item) {
      const initialMsg: RichChatMsg = {
        id: `msg_1_${Date.now()}`,
        sender: 'guest',
        text: `🛍️ [ORDER KATALOG ADLD]\nHalo @${item.sellerUsername}! Saya ${guestTag} berminat mengorder:\n📦 ${item.title} (${item.price})\nKategori: ${item.category}\n\nBisakah kita berdiskusi lebih lanjut?`,
        time: 'Baru saja',
        reactions: ['👍'],
      }

      const sellerAck: RichChatMsg = {
        id: `msg_2_${Date.now()}`,
        sender: 'seller',
        text: `Halo ${guestTag}! 👋\nTerima kasih telah menghubungi kami. Pesanan Anda untuk "${item.title}" (${item.price}) telah kami terima. Ada spesifikasi atau file khusus yang ingin dikirimkan?`,
        time: 'Baru saja',
      }

      setMessages([initialMsg, sellerAck])
    }
  }, [item, guestTag])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!item) return null

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMsg.trim()) return

    soundService.playMessageSend()
    const newMsg: RichChatMsg = {
      id: `msg_${Date.now()}`,
      sender: 'guest',
      text: inputMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, newMsg])
    setInputMsg('')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    soundService.playMessageSend()
    const isImg = file.type.startsWith('image/')
    const newMsg: RichChatMsg = {
      id: `msg_att_${Date.now()}`,
      sender: 'guest',
      text: isImg ? `🖼️ Mengirim foto: ${file.name}` : `📄 Mengirim dokumen: ${file.name}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: {
        type: isImg ? 'image' : 'file',
        url: URL.createObjectURL(file),
        name: file.name,
      },
    }

    setMessages((prev) => [...prev, newMsg])
  }

  const handleVoiceNoteRecording = () => {
    if (!isRecording) {
      setIsRecording(true)
    } else {
      setIsRecording(false)
      soundService.playMessageSend()
      const newMsg: RichChatMsg = {
        id: `msg_audio_${Date.now()}`,
        sender: 'guest',
        text: '🎤 Pesan Suara (Voice Note 0:08)',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachment: {
          type: 'audio',
          url: '',
          name: 'VoiceNote.mp3',
        },
      }
      setMessages((prev) => [...prev, newMsg])
    }
  }

  const handleAddReaction = (msgId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          const currentReactions = m.reactions || []
          const updated = currentReactions.includes(emoji)
            ? currentReactions.filter((r) => r !== emoji)
            : [...currentReactions, emoji]
          return { ...m, reactions: updated }
        }
        return m
      })
    )
  }

  const handleSendInvoice = (invoiceData: InvoiceData) => {
    const invoiceMsg: RichChatMsg = {
      id: `msg_inv_${Date.now()}`,
      sender: 'seller',
      text: '🧾 STRUK / NOTA DIGITAL RESMI ADLD',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      invoice: invoiceData,
    }
    setMessages((prev) => [...prev, invoiceMsg])
    setOrderStatus('SELESAI')
    useToastStore.getState().showToast('Nota Digital berhasil diterbitkan!', 'success')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 md:p-6 select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="glass-panel w-full max-w-2xl h-[88vh] rounded-3xl border border-white/15 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 bg-zinc-950/90 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-10 h-10 object-cover rounded-xl border border-white/10 flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-label-md text-white font-bold truncate">
                  {item.title}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  {item.price}
                </span>
              </div>
              <p className="font-body text-xs text-on-surface-variant flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Seller: @{item.sellerUsername}</span>
                <span>·</span>
                <span className="text-emerald-400 font-semibold">{guestTag}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-full glass-panel hover:bg-white/10 text-on-surface-variant hover:text-white font-body text-xs font-semibold flex items-center gap-1 transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Kembali ke Katalog</span>
          </button>
        </div>

        {/* Order Status Lifecycle Tracking Bar */}
        <div className="bg-zinc-900/90 border-b border-white/10 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface-variant">Status Pesanan:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                orderStatus === 'BARU'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : orderStatus === 'DIPROSES'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {orderStatus === 'BARU' ? '📩 Baru' : orderStatus === 'DIPROSES' ? '⏳ Diproses' : '✅ Selesai'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = orderStatus === 'BARU' ? 'DIPROSES' : orderStatus === 'DIPROSES' ? 'SELESAI' : 'BARU'
                setOrderStatus(next)
                soundService.playStatusSuccess()
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-on-surface font-semibold text-[11px] border border-white/10"
            >
              Ubah Status
            </button>
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-400 font-bold text-[11px] border border-emerald-500/30 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">receipt_long</span>
              <span>Buat Struk Nota</span>
            </button>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-zinc-950/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col group relative ${
                msg.sender === 'guest' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-body text-[11px] text-on-surface-variant/70 font-semibold">
                  {msg.sender === 'guest' ? guestTag : `@${item.sellerUsername}`}
                </span>
                <span className="font-body text-[10px] text-on-surface-variant/40">{msg.time}</span>
              </div>

              {/* Message Bubble Container */}
              <div className="relative">
                {/* Emoji Reaction Floating Bar */}
                <div
                  className={`absolute -top-7 ${
                    msg.sender === 'guest' ? 'right-0' : 'left-0'
                  } opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/90 border border-white/15 rounded-full px-2 py-0.5 flex gap-1 shadow-lg z-10`}
                >
                  {['👍', '❤️', '🔥', '🚀'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleAddReaction(msg.id, emoji)}
                      className="hover:scale-125 transition-transform text-xs"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Digital Invoice Bubble Render */}
                {msg.invoice ? (
                  <div className="p-4 rounded-2xl bg-zinc-900 border-2 border-emerald-500/40 shadow-xl space-y-2 max-w-sm">
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                      <span className="font-display font-bold text-xs text-emerald-400">🧾 NOTA DIGITAL ADLD</span>
                      <span className="font-mono text-[10px] text-white">{msg.invoice.invoiceNo}</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="text-white font-bold">{msg.invoice.itemTitle}</p>
                      <div className="flex justify-between text-on-surface-variant">
                        <span>Total: <b className="text-emerald-400">{msg.invoice.amount}</b></span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          {msg.invoice.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl font-body text-body-md whitespace-pre-wrap leading-relaxed shadow-md ${
                      msg.sender === 'guest'
                        ? 'bg-emerald-600 text-white rounded-br-none font-medium'
                        : 'glass-panel border border-white/10 text-on-surface rounded-bl-none'
                    }`}
                  >
                    {/* Attachment Render */}
                    {msg.attachment && (
                      <div className="mb-2">
                        {msg.attachment.type === 'image' ? (
                          <img
                            src={msg.attachment.url}
                            alt={msg.attachment.name}
                            className="max-h-48 rounded-xl object-cover border border-white/20 shadow-md"
                          />
                        ) : msg.attachment.type === 'file' ? (
                          <div className="p-2.5 rounded-xl bg-black/30 border border-white/15 flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-400 text-[24px]">description</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-white truncate">{msg.attachment.name}</p>
                              <span className="text-[10px] text-emerald-400">Siap diunduh</span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/30 flex items-center gap-3">
                            <span className="material-symbols-outlined text-emerald-400 text-[24px] animate-pulse">
                              play_circle
                            </span>
                            <div className="flex-1 space-y-1">
                              <div className="h-1.5 w-full bg-emerald-500/30 rounded-full overflow-hidden">
                                <div className="h-full w-2/3 bg-emerald-400 rounded-full" />
                              </div>
                              <p className="text-[10px] text-emerald-400 font-mono">0:08 / 0:08 • Voice Note</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <p>{msg.text}</p>
                  </div>
                )}

                {/* Reaction Badges */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {msg.reactions.map((r, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-zinc-900/80 border border-white/10 text-[11px] shadow-sm">
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.zip"
        />

        {/* Chat Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3.5 bg-zinc-950/95 border-t border-white/10 flex items-center gap-2.5">
          {/* File Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-2xl glass-panel hover:bg-white/10 text-on-surface-variant hover:text-emerald-400 transition-colors"
            title="Lampirkan File / Gambar Tugas"
          >
            <span className="material-symbols-outlined text-[20px]">attach_file</span>
          </button>

          {/* Voice Note Button */}
          <button
            type="button"
            onClick={handleVoiceNoteRecording}
            className={`p-2.5 rounded-2xl transition-colors ${
              isRecording
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                : 'glass-panel text-on-surface-variant hover:text-emerald-400'
            }`}
            title={isRecording ? 'Klik untuk Mengirim Voice Note' : 'Rekam Voice Note'}
          >
            <span className="material-symbols-outlined text-[20px]">mic</span>
          </button>

          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder={isRecording ? 'Sedang merekam suara... Klik mic lagi untuk kirim' : 'Tulis pesan pertanyaan / order...'}
            className="flex-1 bg-zinc-900 border border-white/10 text-on-surface font-body text-body-md rounded-2xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-on-surface-variant/40"
          />

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-lg flex items-center justify-center transition-all"
            title="Kirim Pesan"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </motion.button>
        </form>
      </motion.div>

      {/* Digital Invoice Modal */}
      <OrderInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSendInvoice={handleSendInvoice}
        defaultItemTitle={item.title}
        defaultAmount={item.price}
        defaultCustomerTag={guestTag}
      />
    </div>
  )
}
