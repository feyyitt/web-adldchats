import { useState } from 'react'
import { motion } from 'framer-motion'
import { useCatalogStore } from '@/stores/catalogStore'
import type { CatalogItem } from '@/stores/catalogStore'
import { useAuthStore } from '@/stores/authStore'
import { soundService } from '@/services/soundService'
import { useToastStore } from '@/stores/toastStore'

interface ItemDetailModalProps {
  item: CatalogItem | null
  onClose: () => void
  onOrderClick: (item: CatalogItem) => void
}

export default function ItemDetailModal({ item, onClose, onOrderClick }: ItemDetailModalProps) {
  const { addReview } = useCatalogStore()
  const { profile, user } = useAuthStore()

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isAddingReview, setIsAddingReview] = useState(false)

  if (!item) return null

  const reviews = item.reviews || []
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0'

  const userTag = profile?.display_name || user?.user_metadata?.display_name || 'Pelanggan'

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    soundService.playStatusSuccess()
    addReview(item.id, {
      reviewerTag: userTag,
      rating,
      comment: comment.trim(),
    })

    useToastStore.getState().showToast('Terima kasih atas ulasan bintang Anda!', 'success')
    setComment('')
    setIsAddingReview(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="glass-panel modal-card rounded-3xl p-6 space-y-4 border border-white/15 shadow-2xl max-h-[85vh] overflow-y-auto flex flex-col max-w-lg w-full"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold uppercase tracking-wider">
                {item.category}
              </span>
              <div className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <span>★ {avgRating}</span>
                <span className="text-on-surface-variant font-normal">({reviews.length})</span>
              </div>
            </div>
            <h3 className="font-display text-headline-sm text-on-surface font-bold mt-2">
              {item.title}
            </h3>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Thumbnail Image */}
        <div className="w-full h-48 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 relative flex-shrink-0">
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          <div className="absolute top-3 right-3 px-3.5 py-1.5 rounded-full bg-zinc-900/90 backdrop-blur-md border border-emerald-500/40 text-emerald-400 font-display font-bold text-sm shadow-xl">
            {item.price}
          </div>
        </div>

        {/* Description & Seller Info */}
        <div className="space-y-4 flex-1">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 border border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-400 text-[20px]">verified</span>
              <div>
                <p className="font-body text-xs text-on-surface-variant">Penjual Terverifikasi Admin:</p>
                <p className="font-body text-sm font-bold text-white">@{item.sellerUsername}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-bold">
              Official Seller
            </span>
          </div>

          <div>
            <h4 className="font-body text-label-md text-on-surface font-bold mb-1">Deskripsi & Layanan:</h4>
            <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Testimonial & Review Section */}
          <div className="pt-2 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-body text-label-md text-on-surface font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-400 text-[18px]">star</span>
                <span>Ulasan & Testimoni Pelanggan ({reviews.length})</span>
              </h4>
              <button
                onClick={() => setIsAddingReview(!isAddingReview)}
                className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">rate_review</span>
                <span>{isAddingReview ? 'Batal' : '+ Tulis Ulasan'}</span>
              </button>
            </div>

            {/* Form Write Review */}
            {isAddingReview && (
              <form onSubmit={handleSubmitReview} className="p-3 rounded-2xl bg-zinc-900 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface-variant">Bintang:</span>
                  <div className="flex gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="hover:scale-125 transition-transform"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {star <= rating ? 'star' : 'star_outline'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tulis ulasan/testimoni pengalaman Anda..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-white/15 rounded-xl p-2.5 font-body text-xs text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs font-bold shadow-md"
                >
                  Kirim Ulasan
                </button>
              </form>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <p className="font-body text-xs text-on-surface-variant/70 italic">Belum ada ulasan. Jadilah yang pertama memberikan testimoni!</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-body text-xs font-bold text-emerald-400">{rev.reviewerTag}</span>
                      <div className="flex items-center text-amber-400 text-xs">
                        {'★'.repeat(rev.rating)}
                        <span className="text-[10px] text-on-surface-variant ml-2">{rev.date}</span>
                      </div>
                    </div>
                    <p className="font-body text-xs text-on-surface-variant">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl glass-panel text-on-surface-variant hover:text-on-surface font-semibold text-sm"
          >
            Tutup
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onOrderClick(item)}
            className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-display text-label-sm font-bold shadow-lg uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span>Order via Chat</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
