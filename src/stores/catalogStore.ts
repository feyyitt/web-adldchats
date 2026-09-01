import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CatalogReview {
  id: string
  reviewerTag: string
  rating: number // 1 to 5
  comment: string
  date: string
}

export interface CatalogItem {
  id: string
  title: string
  category: string
  price: string
  description: string
  imageUrl: string
  sellerUsername: string
  active: boolean
  createdAt: string
  reviews?: CatalogReview[]
}

interface CatalogState {
  items: CatalogItem[]
  guestCounter: number
  getNextGuestTag: (name: string) => { guestId: string; guestTag: string }
  addItem: (item: Omit<CatalogItem, 'id' | 'createdAt'>) => void
  updateItem: (id: string, updated: Partial<CatalogItem>) => void
  deleteItem: (id: string) => void
  toggleItemActive: (id: string) => void
  addReview: (itemId: string, review: Omit<CatalogReview, 'id' | 'date'>) => void
}

const DEFAULT_CATALOG_ITEMS: CatalogItem[] = [
  {
    id: 'cat_1',
    title: 'Joki Koding & Tugas Kampus',
    category: 'Joki Tugas',
    price: 'Rp 50.000',
    description: 'Pengerjaan cepat & rapi untuk tugas koding (Python, Web, Java, C++), makalah, dan laporan praktikum.',
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    sellerUsername: 'faith',
    active: true,
    createdAt: new Date().toISOString(),
    reviews: [
      {
        id: 'rev_1',
        reviewerTag: 'Budi #1',
        rating: 5,
        comment: 'Pengerjaan cepat banget, langsung dapet A! Makasih mas Faith!',
        date: '2 hari lalu',
      },
      {
        id: 'rev_2',
        reviewerTag: 'Siti #2',
        rating: 5,
        comment: 'Kodingannya rapi banget dan beres sebelum deadline.',
        date: '1 hari lalu',
      },
    ],
  },
  {
    id: 'cat_2',
    title: 'Pembuatan Website Custom & UMKM',
    category: 'Pembuatan Web',
    price: 'Rp 350.000',
    description: 'Jasa buat website profesional modern (Landing Page, Portfolio, Web Toko Online) super cepat & full responsif.',
    imageUrl: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=600&auto=format&fit=crop&q=80',
    sellerUsername: 'faith',
    active: true,
    createdAt: new Date().toISOString(),
    reviews: [
      {
        id: 'rev_3',
        reviewerTag: 'Andi #3',
        rating: 5,
        comment: 'Desain websitenya mewah dan animasi sangat smooth. Sangat recommended!',
        date: '3 hari lalu',
      },
    ],
  },
  {
    id: 'cat_3',
    title: 'Desain Logo & Branding Kit',
    category: 'Desain & Grafis',
    price: 'Rp 150.000',
    description: 'Desain logo vektor elegan, banner sosmed, dan identitas merek dengan revisi tanpa batas.',
    imageUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop&q=80',
    sellerUsername: 'faith',
    active: true,
    createdAt: new Date().toISOString(),
    reviews: [],
  },
  {
    id: 'cat_4',
    title: 'Pack Avatar 3D Clean Format',
    category: 'Produk Digital',
    price: 'Rp 99.000',
    description: 'Koleksi 16 file karakter 3D berkualitas tinggi transparan siap pakai untuk proyek game dan web app.',
    imageUrl: '/avatars/male_1_clean.png',
    sellerUsername: 'faith',
    active: true,
    createdAt: new Date().toISOString(),
    reviews: [],
  },
]

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set, get) => ({
      items: DEFAULT_CATALOG_ITEMS,
      guestCounter: 0,

      getNextGuestTag: (name: string) => {
        const cleanName = name.trim() || 'Tamu'
        const nextNum = get().guestCounter + 1
        set({ guestCounter: nextNum })
        const guestTag = `${cleanName} #${nextNum}`
        const guestId = `guest_${nextNum}_${Date.now()}`
        return { guestId, guestTag }
      },

      addItem: (newItemData) => {
        const newItem: CatalogItem = {
          ...newItemData,
          id: `cat_${Date.now()}`,
          createdAt: new Date().toISOString(),
          reviews: [],
        }
        set((state) => ({ items: [newItem, ...state.items] }))
      },

      updateItem: (id, updated) => {
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...updated } : item)),
        }))
      },

      deleteItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }))
      },

      toggleItemActive: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, active: !item.active } : item
          ),
        }))
      },

      addReview: (itemId, reviewData) => {
        const newReview: CatalogReview = {
          ...reviewData,
          id: `rev_${Date.now()}`,
          date: 'Baru saja',
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? { ...item, reviews: [newReview, ...(item.reviews || [])] }
              : item
          ),
        }))
      },
    }),
    {
      name: 'adld-catalog-storage',
    }
  )
)
