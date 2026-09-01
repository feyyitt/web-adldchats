import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import OrderInvoiceModal from '@/components/catalog/OrderInvoiceModal'
import type { InvoiceData } from '@/components/catalog/OrderInvoiceModal'
import { soundService } from '@/services/soundService'

interface ChatMessage {
  id: string
  sender: 'self' | 'other'
  text: string
  time: string
  type?: 'text' | 'image' | 'voice' | 'location' | 'file' | 'invoice'
  mediaUrl?: string
  reactions?: string[]
  isViewOnce?: boolean
  viewed?: boolean
  replyToText?: string
  invoice?: InvoiceData
  fileName?: string
}

interface Conversation {
  id: string
  name: string
  lastMessage: string
  time: string
  online: boolean
  streak: number
  unread: number
  isGroup?: boolean
  orderStatus?: 'BARU' | 'DIPROSES' | 'SELESAI'
}

const REACTION_OPTIONS = ['🔥', '❤️', '😂', '👍', '😮', '🚀']

export default function ChatPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('adld_conversations')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return []
  })

  const [selectedChat, setSelectedChat] = useState<string | null>(() => {
    const saved = localStorage.getItem('adld_conversations')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id
      } catch {}
    }
    return null
  })

  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem('adld_messages')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return {}
  })

  const [inputMessage, setInputMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null)
  const [replyingToMsg, setReplyingToMsg] = useState<ChatMessage | null>(null)
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false)
  const [isViewOnceMode, setIsViewOnceMode] = useState(false)
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false)
  const [newChatTargetName, setNewChatTargetName] = useState('')

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('adld_conversations', JSON.stringify(conversations))
  }, [conversations])

  useEffect(() => {
    localStorage.setItem('adld_messages', JSON.stringify(messages))
  }, [messages])

  // Invoice & Rich Media States
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [activeOrderLead, setActiveOrderLead] = useState<{ title: string; price: string; tag: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const location = useLocation()
  const orderLeadHandled = useRef(false)

  // Handle incoming order lead from Catalog
  useEffect(() => {
    if (location.state?.orderLead && !orderLeadHandled.current) {
      orderLeadHandled.current = true
      const lead = location.state.orderLead

      const targetConvoId = '1' // Faith / Seller Official
      setSelectedChat(targetConvoId)
      setActiveOrderLead({ title: lead.title, price: lead.price, tag: lead.guestTag })
      soundService.playMessageReceive()

      const orderMsgText = `🛍️ [ORDER KATALOG ADLD]\nHalo @${lead.sellerUsername}! Saya ${lead.guestTag} berminat mengorder:\n📦 ${lead.title} (${lead.price})\nKategori: ${lead.category}\n\nBisakah kita berdiskusi lebih lanjut?`

      const newMsg: ChatMessage = {
        id: `msg_order_${Date.now()}`,
        sender: 'self',
        text: orderMsgText,
        time: 'Now',
      }

      setMessages((prev) => ({
        ...prev,
        [targetConvoId]: [...(prev[targetConvoId] || []), newMsg],
      }))

      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvoId
            ? { ...c, lastMessage: `[Order Lead] ${lead.title}`, time: 'Now' }
            : c
        )
      )
    }
  }, [location.state])

  // In-Chat Camera Modal State
  const [isInChatCameraOpen, setIsInChatCameraOpen] = useState(false)
  const [inChatCameraTarget, setInChatCameraTarget] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [hasWebcam, setHasWebcam] = useState(false)
  const [capturedSnapUrl, setCapturedSnapUrl] = useState<string | null>(null)
  const [snapCaption, setSnapCaption] = useState('')

  // View once modal
  const [activeViewOnceMsg, setActiveViewOnceMsg] = useState<ChatMessage | null>(null)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)

  const selectedConvo = conversations.find((c) => c.id === selectedChat)
  const currentMessages = selectedChat ? messages[selectedChat] || [] : []

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Init Webcam when in-chat camera opens
  useEffect(() => {
    let stream: MediaStream | null = null

    async function initWebcam() {
      if (!isInChatCameraOpen) return
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            setHasWebcam(true)
          }
        }
      } catch (err) {
        console.log('Webcam not available for in-chat camera', err)
        setHasWebcam(false)
      }
    }

    initWebcam()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isInChatCameraOpen])

  const handleSendMessage = (
    customText?: string,
    msgType: 'text' | 'image' | 'voice' | 'location' | 'file' | 'invoice' = 'text',
    targetChatId?: string,
    overrideViewOnce?: boolean
  ) => {
    const chatToUse = targetChatId || selectedChat
    if (!chatToUse) return

    const messageContent = customText !== undefined ? customText : inputMessage.trim()
    if (!messageContent && msgType === 'text') return

    soundService.playMessageSend()

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'self',
      text: messageContent || (msgType === 'voice' ? 'Voice note (0:08)' : 'Location shared'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: msgType,
      isViewOnce: overrideViewOnce !== undefined ? overrideViewOnce : isViewOnceMode,
      viewed: false,
      replyToText: replyingToMsg ? replyingToMsg.text : undefined,
    }

    setMessages((prev) => ({
      ...prev,
      [chatToUse]: [...(prev[chatToUse] || []), newMsg],
    }))

    setConversations((prev) =>
      prev.map((c) =>
        c.id === chatToUse
          ? { ...c, lastMessage: newMsg.text, time: 'Now' }
          : c
      )
    )

    setInputMessage('')
    setReplyingToMsg(null)
    setIsAttachmentOpen(false)
    setIsViewOnceMode(false)
  }

  const handleSendInvoiceInChat = (invoiceData: InvoiceData) => {
    if (!selectedChat) return
    soundService.playStatusSuccess()
    const invoiceMsg: ChatMessage = {
      id: `msg_inv_${Date.now()}`,
      sender: 'self',
      text: '🧾 STRUK / NOTA DIGITAL RESMI ADLD',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'invoice',
      invoice: invoiceData,
    }
    setMessages((prev) => ({
      ...prev,
      [selectedChat]: [...(prev[selectedChat] || []), invoiceMsg],
    }))
  }

  const handleFileUploadInChat = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedChat) return

    soundService.playMessageSend()
    const isImg = file.type.startsWith('image/')
    const newMsg: ChatMessage = {
      id: `msg_file_${Date.now()}`,
      sender: 'self',
      text: isImg ? `🖼️ Mengirim foto: ${file.name}` : `📄 Mengirim dokumen: ${file.name}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: isImg ? 'image' : 'file',
      mediaUrl: URL.createObjectURL(file),
      fileName: file.name,
    }

    setMessages((prev) => ({
      ...prev,
      [selectedChat]: [...(prev[selectedChat] || []), newMsg],
    }))
  }

  const handleOpenQuickCamera = (convoId: string, convoName: string) => {
    setSelectedChat(convoId)
    setInChatCameraTarget(convoName)
    setCapturedSnapUrl(null)
    setSnapCaption('')
    setIsInChatCameraOpen(true)
  }

  const handleCaptureInChatSnap = () => {
    if (hasWebcam && videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth || 720
      canvas.height = videoRef.current.videoHeight || 1280
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        setCapturedSnapUrl(canvas.toDataURL('image/png'))
        return
      }
    }
    setCapturedSnapUrl('simulation')
  }

  const handleSendInChatSnap = () => {
    if (!selectedChat) return
    const captionText = snapCaption.trim() ? `📸 Foto ADLD: ${snapCaption.trim()}` : '📸 Foto Kamera ADLD'
    handleSendMessage(captionText, 'image', selectedChat, isViewOnceMode)

    setIsInChatCameraOpen(false)
    setCapturedSnapUrl(null)
    setSnapCaption('')
  }

  const handleOpenViewOnce = (msg: ChatMessage) => {
    if (msg.viewed) return
    setActiveViewOnceMsg(msg)

    if (selectedChat) {
      setMessages((prev) => ({
        ...prev,
        [selectedChat]: (prev[selectedChat] || []).map((m) =>
          m.id === msg.id ? { ...m, viewed: true } : m
        ),
      }))
    }
  }

  const handleAddReaction = (msgId: string, emoji: string) => {
    if (!selectedChat) return

    setMessages((prev) => ({
      ...prev,
      [selectedChat]: (prev[selectedChat] || []).map((m) => {
        if (m.id === msgId) {
          const existing = m.reactions || []
          const updated = existing.includes(emoji)
            ? existing.filter((e) => e !== emoji)
            : [...existing, emoji]
          return { ...m, reactions: updated }
        }
        return m
      }),
    }))

    setActiveReactionMsgId(null)
  }

  return (
    <div className="flex h-[calc(100vh-128px)] md:h-screen bg-background select-none overflow-hidden mt-14 md:mt-0">
      {/* Sidebar Chat List */}
      <div
        className={`${
          selectedChat ? 'hidden md:flex' : 'flex'
        } flex-col w-full md:w-80 lg:w-96 border-r border-white/10 bg-surface-container-lowest/50 flex-shrink-0`}
      >
        {/* Search & New Chat Button */}
        <div className="p-3.5 border-b border-white/5 flex items-center gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('chat.searchChats')}
              className="w-full bg-surface-container-highest border border-white/10 text-on-surface font-body text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-on-surface-variant/50"
            />
          </div>
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-95 flex items-center justify-center flex-shrink-0"
            title="Mulai Obrolan Baru"
          >
            <span className="material-symbols-outlined text-[18px]">edit_square</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((convo) => (
              <div
                key={convo.id}
                onClick={() => {
                  setSelectedChat(convo.id)
                  setConversations((prev) =>
                    prev.map((c) => (c.id === convo.id ? { ...c, unread: 0 } : c))
                  )
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-white/5 transition-all cursor-pointer group ${
                  selectedChat === convo.id
                    ? 'bg-emerald-500/10 border-l-4 border-l-emerald-500'
                    : 'hover:bg-surface-container-high/40'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center border border-white/10">
                    <span className="material-symbols-outlined text-on-surface-variant">
                      {convo.isGroup ? 'group' : 'person'}
                    </span>
                  </div>
                  {convo.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950 shadow-sm" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-body text-label-md text-on-surface truncate group-hover:text-emerald-400 transition-colors font-bold">
                      {convo.name}
                    </span>
                    <span className="font-body text-[11px] text-on-surface-variant flex-shrink-0">
                      {convo.time}
                    </span>
                  </div>
                  <p className="font-body text-xs text-on-surface-variant truncate">
                    {convo.lastMessage}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {convo.streak > 0 && (
                    <span className="flex items-center gap-0.5 text-amber-400">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        local_fire_department
                      </span>
                      <span className="text-[11px] font-bold">{convo.streak}</span>
                    </span>
                  )}
                  {convo.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-extrabold flex items-center justify-center shadow-md">
                      {convo.unread}
                    </span>
                  )}

                  {/* In-Chat Quick Snap Camera Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenQuickCamera(convo.id, convo.name)
                    }}
                    className="p-1.5 rounded-full hover:bg-emerald-500/20 text-on-surface-variant hover:text-emerald-400 transition-colors"
                    title="Foto Kamera ADLD"
                  >
                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 text-on-surface-variant/40 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[24px]">forum</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-white text-xs">Belum Ada Obrolan</h4>
                <p className="font-body text-[11px] text-on-surface-variant">
                  Mulai percakapan baru untuk berkirim pesan & media.
                </p>
              </div>
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add_comment</span>
                <span>Mulai Obrolan</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Conversation View */}
      <div
        className={`${
          selectedChat ? 'flex' : 'hidden md:flex'
        } flex-col flex-1 bg-surface relative min-w-0`}
      >
        {selectedConvo ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b border-white/10 bg-surface-container-lowest/80 backdrop-blur-md z-20">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-white/10">
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                      {selectedConvo.isGroup ? 'group' : 'person'}
                    </span>
                  </div>
                  {selectedConvo.online && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary-container rounded-full border-2 border-surface-container-lowest neon-glow-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-body text-label-md text-on-surface truncate">{selectedConvo.name}</h3>
                  <p className="font-body text-label-sm text-primary-fixed-dim truncate">
                    {selectedConvo.online ? t('chat.online') : t('chat.lastSeen', { time: selectedConvo.time })}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => handleOpenQuickCamera(selectedConvo.id, selectedConvo.name)}
                  className="p-2.5 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-primary-fixed"
                  title="In-Chat Camera Snap"
                >
                  <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                </button>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              <div className="flex justify-center">
                <span className="font-body text-label-sm text-on-surface-variant bg-surface-container-high/40 border border-white/5 px-4 py-1 rounded-full">
                  {t('chat.today')}
                </span>
              </div>

              {currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'self' ? 'items-end' : 'items-start'} relative group`}
                >
                  {/* Reply Reference Preview */}
                  {msg.replyToText && (
                    <div className="mb-1 text-xs px-3 py-1 rounded-lg bg-surface-container-high/60 text-on-surface-variant border-l-2 border-primary-fixed max-w-[70%] truncate">
                      Replying to: {msg.replyToText}
                    </div>
                  )}

                  <div className="relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%]">
                    {/* Message Content Bubble */}
                    <div
                      onClick={() => {
                        if (msg.isViewOnce) handleOpenViewOnce(msg)
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id)
                      }}
                      className={`px-4 py-3 cursor-pointer transition-all ${
                        msg.sender === 'self'
                          ? 'bg-primary-container text-on-primary-container rounded-2xl rounded-br-sm shadow-md'
                          : 'glass-panel text-on-surface rounded-2xl rounded-bl-sm'
                      }`}
                    >
                      {msg.isViewOnce ? (
                        <div className={`flex items-center gap-2 font-bold ${msg.viewed ? 'opacity-50 line-through' : 'text-secondary-container animate-pulse'}`}>
                          <span className="material-symbols-outlined text-[20px]">
                            {msg.viewed ? 'visibility_off' : 'visibility'}
                          </span>
                          <span>{msg.viewed ? 'Media 1x Lihat (Sudah Dibuka)' : 'Ketuk untuk Melihat Foto 1x (👁️ 1x)'}</span>
                        </div>
                      ) : msg.type === 'location' ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-primary-fixed font-bold">
                            <span className="material-symbols-outlined text-[20px]">location_on</span>
                            <span>Shared Location</span>
                          </div>
                          <p className="text-sm">{msg.text}</p>
                          <button
                            onClick={() => navigate('/map')}
                            className="w-full text-xs font-bold py-1.5 rounded-lg bg-primary-container text-on-primary-container neon-glow-primary"
                          >
                            View on Map
                          </button>
                        </div>
                      ) : msg.type === 'voice' ? (
                        <div className="flex items-center gap-3 min-w-[160px]">
                          <span className="material-symbols-outlined text-primary-fixed text-[24px]">play_circle</span>
                          <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div className="w-1/3 h-full bg-primary-fixed" />
                          </div>
                          <span className="text-xs font-mono">0:08</span>
                        </div>
                      ) : (
                        <p className="font-body text-body-md whitespace-pre-wrap break-words">{msg.text}</p>
                      )}

                      <div className="flex items-center justify-end gap-2 mt-1">
                        <span
                          className={`font-body text-[10px] ${
                            msg.sender === 'self' ? 'text-on-primary-container/70' : 'text-on-surface-variant'
                          }`}
                        >
                          {msg.time}
                        </span>
                      </div>
                    </div>

                    {/* Reactions Display */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="absolute -bottom-2 right-2 bg-surface-container-lowest border border-white/10 rounded-full px-2 py-0.5 text-xs shadow-lg flex gap-1 z-10">
                        {msg.reactions.map((r, i) => (
                          <span key={i}>{r}</span>
                        ))}
                      </div>
                    )}

                    {/* Reaction Popup Menu */}
                    {activeReactionMsgId === msg.id && (
                      <div className="absolute -top-12 left-0 z-30 bg-surface-container-lowest border border-white/10 backdrop-blur-xl rounded-full px-3 py-1.5 flex gap-2 shadow-2xl animate-fade-up-in">
                        {REACTION_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleAddReaction(msg.id, emoji)}
                            className="hover:scale-125 transition-transform text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            setReplyingToMsg(msg)
                            setActiveReactionMsgId(null)
                          }}
                          className="text-on-surface-variant hover:text-primary-fixed ml-1 border-l border-white/10 pl-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">reply</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Preview Bar */}
            {replyingToMsg && (
              <div className="px-4 py-2 bg-surface-container-high/60 border-t border-white/10 flex items-center justify-between text-xs text-on-surface-variant">
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-primary-fixed text-[16px]">reply</span>
                  <span className="truncate">Replying to: <b>{replyingToMsg.text}</b></span>
                </div>
                <button onClick={() => setReplyingToMsg(null)} className="hover:text-on-surface">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* View Once Mode Indicator */}
            {isViewOnceMode && (
              <div className="px-4 py-1.5 bg-secondary-container/20 border-t border-secondary-container/40 flex items-center justify-between text-xs text-secondary-container">
                <span className="flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  View Once Mode Active (👁️ 1x)
                </span>
                <button onClick={() => setIsViewOnceMode(false)}>
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* Attachment Drawer Modal */}
            {isAttachmentOpen && (
              <div className="p-3 bg-surface-container-lowest border-t border-white/10 flex gap-3 overflow-x-auto">
                <button
                  onClick={() => {
                    setIsViewOnceMode(!isViewOnceMode)
                    setIsAttachmentOpen(false)
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isViewOnceMode
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-surface-container-high text-secondary-container hover:bg-surface-container-highest'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  View Once Mode
                </button>
                <button
                  onClick={() => {
                    handleSendMessage('📍 Shared my real-time position', 'location')
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary-fixed text-xs font-bold transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                  Share Location
                </button>
                <button
                  onClick={() => handleOpenQuickCamera(selectedConvo.id, selectedConvo.name)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary-fixed text-xs font-bold transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  Take Snap Photo
                </button>
              </div>
            )}

            {/* Message Composer Bar */}
            <div className="px-4 md:px-6 py-3 border-t border-white/10 bg-surface-container-lowest/80 backdrop-blur-md">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex items-center gap-2.5"
              >
                <button
                  type="button"
                  onClick={() => setIsAttachmentOpen(!isAttachmentOpen)}
                  className={`transition-colors ${
                    isAttachmentOpen ? 'text-primary-fixed' : 'text-on-surface-variant hover:text-primary-fixed'
                  }`}
                >
                  <span className="material-symbols-outlined">add_circle</span>
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={t('chat.messagePlaceholder')}
                    className="w-full bg-surface-container-highest border border-white/10 text-on-surface font-body text-body-md rounded-full px-4 py-2.5 focus:outline-none input-glow transition-all placeholder:text-on-surface-variant/50"
                  />
                </div>

                {inputMessage.trim() ? (
                  <button
                    type="submit"
                    className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:brightness-110 transition-all active:scale-95 neon-glow-primary flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      send
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenQuickCamera(selectedConvo.id, selectedConvo.name)}
                      className="w-10 h-10 rounded-full glass-panel text-on-surface hover:text-primary-fixed flex items-center justify-center transition-all"
                      title="Take Photo Snap"
                    >
                      <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isRecordingAudio) {
                          setIsRecordingAudio(false)
                          handleSendMessage('🎤 Voice note (0:08)', 'voice')
                        } else {
                          setIsRecordingAudio(true)
                        }
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isRecordingAudio
                          ? 'bg-secondary-container text-on-secondary-container animate-ping'
                          : 'glass-panel text-on-surface hover:text-primary-fixed'
                      }`}
                      title="Record Voice Note"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isRecordingAudio ? 'graphic_eq' : 'mic'}
                      </span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-6">
              <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30 mb-4">
                chat
              </span>
              <p className="font-body text-body-lg text-on-surface-variant">
                Select a conversation to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* In-Chat Camera Snap Modal */}
      {isInChatCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 select-none">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-white/15 shadow-2xl flex flex-col space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                <span>Kirim Foto Snap ke {inChatCameraTarget}</span>
              </div>
              <button
                onClick={() => setIsInChatCameraOpen(false)}
                className="w-8 h-8 rounded-full glass-panel flex items-center justify-center text-on-surface-variant hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Camera Viewport or Preview */}
            <div className="w-full h-80 rounded-2xl bg-zinc-900 border border-white/10 relative overflow-hidden flex flex-col items-center justify-center text-center p-4">
              {capturedSnapUrl ? (
                capturedSnapUrl === 'simulation' ? (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 via-zinc-900 to-amber-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2 border border-emerald-500/30">
                    <span className="material-symbols-outlined text-[64px] text-emerald-400">
                      auto_awesome
                    </span>
                    <h4 className="font-display font-bold text-white text-base">Foto Snap Siap Dikirim! ✨</h4>
                    {snapCaption && (
                      <div className="px-3 py-1.5 bg-black/70 backdrop-blur-md rounded-xl text-emerald-400 font-bold text-xs">
                        "{snapCaption}"
                      </div>
                    )}
                  </div>
                ) : (
                  <img
                    src={capturedSnapUrl}
                    alt="Captured Snap"
                    className="w-full h-full object-cover rounded-xl"
                  />
                )
              ) : hasWebcam ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-xl scale-x-[-1]"
                />
              ) : (
                <div className="space-y-2">
                  <span className="material-symbols-outlined text-[60px] text-emerald-400/60">
                    photo_camera
                  </span>
                  <p className="font-body text-xs font-semibold text-on-surface-variant">
                    Kamera Siap Mengambil Foto Snap 📸
                  </p>
                </div>
              )}
            </div>

            {/* Caption Input (when captured) */}
            {capturedSnapUrl && (
              <input
                type="text"
                value={snapCaption}
                onChange={(e) => setSnapCaption(e.target.value)}
                placeholder="Tambah pesan keterangan (caption)..."
                className="w-full bg-zinc-900 border border-white/10 text-white text-xs rounded-xl px-4 py-2.5 text-center focus:outline-none focus:border-emerald-500"
              />
            )}

            {/* Action Buttons */}
            <div className="pt-2">
              {!capturedSnapUrl ? (
                <button
                  onClick={handleCaptureInChatSnap}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs font-bold flex items-center justify-center gap-2 shadow-lg btn-shimmer active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  <span>Ambil Foto Snap</span>
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setCapturedSnapUrl(null)}
                    className="flex-1 py-3 rounded-2xl glass-panel text-on-surface-variant hover:text-white font-body text-xs font-semibold"
                  >
                    Ambil Ulang
                  </button>
                  <button
                    onClick={handleSendInChatSnap}
                    className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs font-bold flex items-center justify-center gap-2 shadow-lg btn-shimmer active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Kirim Snap</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Once Fullscreen Preview Modal */}
      {activeViewOnceMsg && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 select-none">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-amber-500/30 shadow-2xl flex flex-col items-center space-y-4 text-center">
            <div className="flex justify-between items-center w-full border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                <span>Media 1x Lihat (Opened)</span>
              </div>
              <button
                onClick={() => setActiveViewOnceMsg(null)}
                className="w-8 h-8 rounded-full glass-panel flex items-center justify-center text-on-surface-variant hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="w-full h-80 rounded-2xl bg-gradient-to-br from-amber-500/20 via-zinc-900 to-emerald-500/20 border border-amber-500/30 p-6 flex flex-col items-center justify-center space-y-3">
              <span className="material-symbols-outlined text-[64px] text-amber-400">
                auto_awesome
              </span>
              <h3 className="font-display text-headline-sm text-white font-bold">
                Foto Snap Rahasia 👁️ 1x
              </h3>
              <p className="font-body text-xs text-on-surface-variant">
                "Pesan foto rahasia dari {selectedConvo?.name}"
              </p>
              <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-semibold">
                Foto ini akan otomatis terhapus saat ditutup.
              </div>
            </div>

            <button
              onClick={() => setActiveViewOnceMsg(null)}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs font-bold shadow-lg transition-all"
            >
              Selesai Dilihat
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUploadInChat}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.zip"
      />

      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">edit_square</span>
                Mulai Obrolan Baru
              </h3>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="w-8 h-8 rounded-full glass-panel flex items-center justify-center text-on-surface-variant hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!newChatTargetName.trim()) return
                const cleanName = newChatTargetName.trim()
                const newId = `convo_${Date.now()}`
                const newConvo: Conversation = {
                  id: newId,
                  name: cleanName,
                  lastMessage: 'Obrolan dimulai',
                  time: 'Now',
                  online: true,
                  streak: 1,
                  unread: 0,
                }
                setConversations((prev) => [newConvo, ...prev])
                setSelectedChat(newId)
                setIsNewChatModalOpen(false)
                setNewChatTargetName('')
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                  Nama Kontak atau Username
                </label>
                <input
                  type="text"
                  value={newChatTargetName}
                  onChange={(e) => setNewChatTargetName(e.target.value)}
                  placeholder="e.g. Budi Santoso atau @budi"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Mulai Obrolan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Digital Invoice Generator Modal */}
      <OrderInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSendInvoice={handleSendInvoiceInChat}
        defaultItemTitle={activeOrderLead?.title || 'Joki Koding & Pembuatan Website'}
        defaultAmount={activeOrderLead?.price || 'Rp 350.000'}
        defaultCustomerTag={activeOrderLead?.tag || 'Pelanggan'}
      />
    </div>
  )
}
