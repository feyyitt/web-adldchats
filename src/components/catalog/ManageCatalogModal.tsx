import { useState } from 'react'
import { motion } from 'framer-motion'
import { useCatalogStore } from '@/stores/catalogStore'
import type { CatalogItem } from '@/stores/catalogStore'
import { useCatalogAccessStore } from '@/stores/catalogAccessStore'
import { useToastStore } from '@/stores/toastStore'

interface ManageCatalogModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ManageCatalogModal({ isOpen, onClose }: ManageCatalogModalProps) {
  const { items, addItem, updateItem, deleteItem, toggleItemActive } = useCatalogStore()
  const { pendingRequests, approvedUserIds, approveAccess, revokeAccess } = useCatalogAccessStore()
  const { showToast } = useToastStore()

  const [activeTab, setActiveTab] = useState<'items' | 'permissions'>('items')

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Joki Tugas')
  const [customCategory, setCustomCategory] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [sellerUsername, setSellerUsername] = useState('faith')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !price.trim()) return

    const finalCategory = category === 'Custom' ? customCategory.trim() || 'Umum' : category
    const finalImage = imageUrl.trim() || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80'

    if (editingItemId) {
      updateItem(editingItemId, {
        title: title.trim(),
        category: finalCategory,
        price: price.trim(),
        description: description.trim(),
        imageUrl: finalImage,
        sellerUsername: sellerUsername.trim(),
      })
      setEditingItemId(null)
      showToast('Listing barang berhasil diperbarui!', 'success')
    } else {
      addItem({
        title: title.trim(),
        category: finalCategory,
        price: price.trim(),
        description: description.trim(),
        imageUrl: finalImage,
        sellerUsername: sellerUsername.trim(),
        active: true,
      })
      showToast('Barang baru berhasil ditambahkan ke katalog!', 'success')
    }

    // Reset Form
    setTitle('')
    setPrice('')
    setDescription('')
    setImageUrl('')
  }

  const handleEditClick = (item: CatalogItem) => {
    setEditingItemId(item.id)
    setTitle(item.title)
    setCategory(['Joki Tugas', 'Pembuatan Web', 'Desain & Grafis', 'Produk Digital'].includes(item.category) ? item.category : 'Custom')
    if (!['Joki Tugas', 'Pembuatan Web', 'Desain & Grafis', 'Produk Digital'].includes(item.category)) {
      setCustomCategory(item.category)
    }
    setPrice(item.price)
    setDescription(item.description)
    setImageUrl(item.imageUrl)
    setSellerUsername(item.sellerUsername)
  }

  const handleApprove = (userId: string, name: string) => {
    approveAccess(userId)
    showToast(`Izin melihat katalog diberikan ke ${name}!`, 'success')
  }

  const handleRevoke = (userId: string, name: string) => {
    revokeAccess(userId)
    showToast(`Izin melihat katalog untuk ${name} dicabut!`, 'warning')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="glass-panel modal-card rounded-3xl p-6 space-y-5 border border-white/15 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <div>
            <h3 className="font-display text-headline-sm text-on-surface font-bold">
              Panel Utama Admin (@faith)
            </h3>
            <p className="font-body text-xs text-emerald-400 font-semibold">
              Kelola Barang Katalog & Kontrol Izin Akses Pengguna
            </p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('items')}
            className={`flex-1 py-2 rounded-lg font-body text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'items'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">inventory_2</span>
            <span>Kelola Barang ({items.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex-1 py-2 rounded-lg font-body text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative ${
              activeTab === 'permissions'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">key</span>
            <span>Izin Akses</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-extrabold text-[10px]">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'items' ? (
          <>
            {/* Add / Edit Form */}
            <form onSubmit={handleSaveItem} className="p-4 bg-zinc-900/90 rounded-2xl border border-white/10 space-y-3">
              <h4 className="font-body text-label-md text-white font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">
                  {editingItemId ? 'edit' : 'add_box'}
                </span>
                {editingItemId ? 'Edit Listing Katalog' : 'Tambah Listing Baru'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Judul Jualan / Jasa</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Joki Tugas Python, Web App..."
                    className="w-full bg-zinc-800 border border-white/10 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Harga String</label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. Rp 50.000 / Diskusi"
                    className="w-full bg-zinc-800 border border-white/10 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-800 border border-white/10 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Joki Tugas">Joki Tugas</option>
                    <option value="Pembuatan Web">Pembuatan Web</option>
                    <option value="Desain & Grafis">Desain & Grafis</option>
                    <option value="Produk Digital">Produk Digital</option>
                    <option value="Custom">Custom / Ketik Bebas</option>
                  </select>
                </div>

                {category === 'Custom' && (
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Nama Kategori Custom</label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g. Akun Game, Video Editing..."
                      className="w-full bg-zinc-800 border border-white/10 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Penjual Penanggung Jawab</label>
                  <input
                    type="text"
                    value={sellerUsername}
                    onChange={(e) => setSellerUsername(e.target.value)}
                    placeholder="Username penjual (default: faith)"
                    className="w-full bg-zinc-800 border border-white/10 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Image URL (Opsional)</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... atau path gambar"
                  className="w-full bg-zinc-800 border border-white/10 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Deskripsi & Detail Spesifikasi</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Jelaskan detail garansi, waktu pengerjaan, dan spesifikasi..."
                  className="w-full bg-zinc-800 border border-white/10 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                {editingItemId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItemId(null)
                      setTitle('')
                      setPrice('')
                      setDescription('')
                    }}
                    className="px-3 py-1.5 rounded-lg glass-panel text-xs text-on-surface-variant"
                  >
                    Batal Edit
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  {editingItemId ? 'Simpan Perubahan' : 'Tambah ke Katalog'}
                </button>
              </div>
            </form>

            {/* Existing Items Table / List */}
            <div className="space-y-2 flex-1 overflow-y-auto">
              <h4 className="font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Daftar Listing Aktif ({items.length})
              </h4>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl glass-panel border border-white/10 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={item.imageUrl} alt={item.title} className="w-12 h-12 object-cover rounded-xl border border-white/10" />
                    <div className="min-w-0">
                      <p className="font-body text-xs font-bold text-white truncate">{item.title}</p>
                      <p className="font-body text-[11px] text-emerald-400 font-semibold">{item.price} · {item.category}</p>
                      <p className="font-body text-[10px] text-on-surface-variant">Penjual: @{item.sellerUsername}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleItemActive(item.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                        item.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {item.active ? 'Aktif' : 'Sembunyi'}
                    </button>
                    <button
                      onClick={() => handleEditClick(item)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-white"
                      title="Edit Listing"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                      title="Hapus Listing"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4 flex-1 overflow-y-auto">
            {/* Pending Requests Section */}
            <div className="space-y-2">
              <h4 className="font-body text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
                Permintaan Akses Menunggu Persetujuan ({pendingRequests.length})
              </h4>

              {pendingRequests.length === 0 ? (
                <div className="p-4 rounded-2xl glass-panel text-center text-xs text-on-surface-variant">
                  Tidak ada permintaan izin baru yang menggantung.
                </div>
              ) : (
                pendingRequests.map((req) => (
                  <div
                    key={req.userId}
                    className="p-3.5 rounded-2xl glass-panel border border-amber-500/30 flex items-center justify-between gap-3 bg-amber-500/5"
                  >
                    <div>
                      <p className="font-body text-xs font-bold text-white">{req.displayName}</p>
                      <p className="font-body text-[11px] text-amber-400">@{req.username} · {req.requestedAt}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(req.userId, req.displayName)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md"
                      >
                        <span className="material-symbols-outlined text-[14px]">check</span>
                        Izinkan
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Approved Users Section */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              {(() => {
                const cleanApproved = approvedUserIds.filter(
                  (id) => id !== 'admin' && !id.startsWith('00000000')
                )
                return (
                  <>
                    <h4 className="font-body text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">verified_user</span>
                      Pengguna Yang Memiliki Izin Akses ({cleanApproved.length})
                    </h4>

                    <div className="space-y-2">
                      {cleanApproved.map((id) => (
                        <div
                          key={id}
                          className="p-3 rounded-2xl glass-panel border border-white/10 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
                            <span className="font-body text-xs font-bold text-white">
                              {id.toLowerCase() === 'faith' ? 'Faith (Admin Utama 👑)' : id}
                            </span>
                          </div>

                          {id.toLowerCase() !== 'faith' && (
                            <button
                              onClick={() => handleRevoke(id, id)}
                              className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white font-semibold text-[11px] transition-colors"
                            >
                              Cabut Izin
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
