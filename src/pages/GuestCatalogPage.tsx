import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCatalogStore } from '@/stores/catalogStore'
import type { CatalogItem } from '@/stores/catalogStore'
import { useAuthStore } from '@/stores/authStore'
import { useCatalogAccessStore } from '@/stores/catalogAccessStore'
import { useToastStore } from '@/stores/toastStore'
import AdldLogo from '@/components/common/AdldLogo'
import ItemDetailModal from '@/components/catalog/ItemDetailModal'
import ManageCatalogModal from '@/components/catalog/ManageCatalogModal'
import GuestOrderChatModal from '@/components/catalog/GuestOrderChatModal'
import ToastNotification from '@/components/common/ToastNotification'

export default function GuestCatalogPage() {
  const navigate = useNavigate()
  const { items } = useCatalogStore()
  const { user, profile, isGuest } = useAuthStore()
  const { isApproved, hasPendingRequest, requestAccess, pendingRequests } = useCatalogAccessStore()
  const { showToast } = useToastStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua')
  const [selectedItemDetail, setSelectedItemDetail] = useState<CatalogItem | null>(null)
  const [activeGuestChatItem, setActiveGuestChatItem] = useState<CatalogItem | null>(null)
  const [isAdminManageOpen, setIsAdminManageOpen] = useState(false)

  const currentUsername =
    profile?.username ||
    user?.user_metadata?.username ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'faith'

  const currentUserId = user?.id || currentUsername
  const guestTag = profile?.display_name || user?.user_metadata?.display_name || 'Tamu #1'

  // Admin Check (Faith is the Super Admin)
  const isFaithUser =
    !user ||
    isGuest ||
    user.user_metadata?.username?.toLowerCase() === 'faith' ||
    user.email?.toLowerCase().includes('faith') ||
    profile?.username?.toLowerCase() === 'faith' ||
    currentUsername.toLowerCase() === 'faith' ||
    user.id === 'usr_faith_001'

  const isAdmin = isFaithUser
  const isAccessAllowed = isGuest || !user || isAdmin || isApproved(currentUserId) || isApproved(currentUsername)
  const isRequestPending = hasPendingRequest(currentUserId) || hasPendingRequest(currentUsername)

  const handleRequestAccessClick = () => {
    requestAccess({
      id: currentUserId,
      username: currentUsername || 'user_' + Date.now().toString().slice(-4),
      displayName: guestTag,
    })
    showToast('Permintaan izin melihat katalog berhasil dikirim ke Admin (@faith)!', 'success')
  }

  // Extract unique categories
  const categories = ['Semua', ...Array.from(new Set(items.map((i) => i.category)))]

  // Filter items
  const filteredItems = items.filter((item) => {
    if (!item.active) return false
    const matchesCat = selectedCategory === 'Semua' || item.category === selectedCategory
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  const handleOrderViaChat = (item: CatalogItem) => {
    setSelectedItemDetail(null)

    if (isGuest) {
      // Guests get an isolated order chat modal without accessing internal app routes
      setActiveGuestChatItem(item)
    } else {
      // Logged in users navigate to full internal chat page
      navigate('/chat', {
        state: {
          orderLead: {
            title: item.title,
            price: item.price,
            tag: guestTag,
          },
        },
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="min-h-screen bg-background text-on-background font-body pb-20 select-none"
    >
      {/* Top Bar Navigation */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-2xl border-b border-white/10 px-4 md:px-8 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <AdldLogo size="sm" showText={false} />
          <div className="min-w-0">
            <h1 className="font-display font-bold text-sm sm:text-headline-sm text-white flex items-center gap-1.5 leading-tight truncate">
              <span className="truncate">Katalog Bisnis & Jasa</span>
              {isAdmin && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9px] sm:text-[10px] font-extrabold uppercase flex-shrink-0">
                  Admin 👑
                </span>
              )}
            </h1>
            <p className="font-body text-[10px] sm:text-[11px] text-on-surface-variant truncate hidden xs:block">
              Platform Pemesanan Jasa & Produk Terpercaya ADLD
            </p>
          </div>
        </div>

        {/* Right Navigation & Admin Controls */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setIsAdminManageOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all relative"
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span className="hidden sm:inline">Panel Admin (@faith)</span>
              {pendingRequests.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-extrabold flex items-center justify-center -top-1 -right-1 absolute shadow-md">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          )}

          {isGuest ? (
            <button
              onClick={() => navigate('/login')}
              className="px-3.5 py-2 rounded-xl glass-panel text-on-surface-variant hover:text-white font-display text-xs font-bold flex items-center gap-1.5 hover:border-emerald-500/30 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>Login Penjual</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="px-3.5 py-2 rounded-xl glass-panel text-emerald-400 font-display text-xs font-bold hover:bg-emerald-500/10 transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span className="hidden sm:inline">Ke Beranda</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-6">
        {/* Banner Hero */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10 space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-body text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              <span>Layanan Resmi Joki & Jasa Koding ADLD</span>
            </div>
            <h2 className="font-display text-headline-lg md:text-display-sm text-white font-extrabold tracking-tight">
              Solusi Tugas, Website & Desain Digital Cepat & Bergaransi 🚀
            </h2>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">
              Pesan jasa joki tugas, pembuatan web custom, desain grafis, hingga produk digital secara mudah. Diskusi langsung dengan penjual melalui obrolan real-time!
            </p>
          </div>
        </div>

        {isAccessAllowed ? (
          <>
            {/* Search & Category Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-2xl font-body text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 scale-105'
                        : 'glass-panel text-on-surface-variant hover:text-white hover:border-white/20'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[260px]">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari jasa atau produk..."
                  className="w-full bg-zinc-900 border border-white/10 text-white text-xs rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Staggered Products Grid */}
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.08 } },
              }}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                  }}
                  whileHover={{ y: -5 }}
                  className="glass-panel glass-spotlight rounded-3xl overflow-hidden border border-white/10 flex flex-col justify-between group transition-all shadow-xl"
                >
                  <div>
                    {/* Image Box */}
                    <div className="w-full h-44 bg-zinc-900 relative overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-zinc-900/90 backdrop-blur-md border border-white/10 text-emerald-400 font-body text-[10px] font-bold uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>
                      {/* Star Rating Badge */}
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-zinc-900/90 backdrop-blur-md border border-amber-500/30 text-amber-400 font-body text-[10px] font-bold flex items-center gap-1">
                        <span>★ {item.reviews && item.reviews.length > 0 ? (item.reviews.reduce((acc, r) => acc + r.rating, 0) / item.reviews.length).toFixed(1) : '5.0'}</span>
                      </div>
                      <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-emerald-500 text-zinc-950 font-display font-extrabold text-xs shadow-lg">
                        {item.price}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-2">
                      <h3 className="font-display text-headline-sm text-white font-bold leading-snug group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="font-body text-xs text-on-surface-variant line-clamp-2">
                        {item.description}
                      </p>
                      <div className="pt-1 flex items-center justify-between text-[11px] text-on-surface-variant/80 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-emerald-400">person</span>
                          <span>Penjual: @{item.sellerUsername}</span>
                        </div>
                        <span className="text-amber-400 font-bold text-[10px]">
                          {item.reviews ? item.reviews.length : 0} Ulasan
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 pt-0 flex gap-2">
                    <button
                      onClick={() => setSelectedItemDetail(item)}
                      className="px-3 py-2 rounded-xl glass-panel text-on-surface-variant hover:text-white font-body text-xs font-semibold"
                    >
                      Detail
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleOrderViaChat(item)}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs font-bold flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wider btn-shimmer"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      <span>Order via Chat</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {filteredItems.length === 0 && (
              <div className="py-16 text-center text-on-surface-variant space-y-2">
                <span className="material-symbols-outlined text-[48px] opacity-40">inventory_2</span>
                <p className="font-body text-body-md">Tidak ada barang / jasa yang cocok dengan pencarian.</p>
              </div>
            )}
          </>
        ) : (
          /* Locked Exclusive Access Screen for Unapproved Logged-in Users */
          <div className="my-12 px-6 py-8 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full glass-panel rounded-3xl border border-amber-500/30 shadow-2xl space-y-5">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl">
              <span className="material-symbols-outlined text-[40px]">lock</span>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-headline-sm text-white font-bold">
                Katalog Bisnis Terkunci & Eksklusif 🔒
              </h2>
              <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
                Halo <span className="text-emerald-400 font-bold">@{currentUsername || 'Pengguna'}</span>! Akses melihat katalog bisnis ini memerlukan izin resmi dari Admin Utama (<span className="text-white font-bold">@faith</span>).
              </p>
            </div>

            <div className="pt-2 w-full">
              {isRequestPending ? (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-body text-xs font-bold flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                  <span>Permintaan Terkirim - Menunggu Persetujuan Admin (@faith)</span>
                </div>
              ) : (
                <button
                  onClick={handleRequestAccessClick}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs font-bold flex items-center justify-center gap-2 shadow-lg uppercase tracking-wider btn-shimmer active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">key</span>
                  <span>Ajukan Izin Akses Katalog</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItemDetail && (
          <ItemDetailModal
            item={selectedItemDetail}
            onClose={() => setSelectedItemDetail(null)}
            onOrderClick={handleOrderViaChat}
          />
        )}
      </AnimatePresence>

      {/* Manage Catalog Admin Modal */}
      <AnimatePresence>
        {isAdminManageOpen && (
          <ManageCatalogModal
            isOpen={isAdminManageOpen}
            onClose={() => setIsAdminManageOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Isolated Guest Order Chat Modal */}
      <AnimatePresence>
        {activeGuestChatItem && (
          <GuestOrderChatModal
            item={activeGuestChatItem}
            guestTag={guestTag}
            onClose={() => setActiveGuestChatItem(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification Banners */}
      <ToastNotification />
    </motion.div>
  )
}
