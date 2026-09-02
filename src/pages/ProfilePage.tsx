import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { MALE_AVATAR_OPTIONS } from '@/constants/avatars'
import { useLogoutStore } from '@/stores/logoutStore'

interface ProfileBadge {
  id: string
  icon: string
  label: string
  colorClass: string
}

const DEFAULT_BADGES: ProfileBadge[] = [
  { id: 'b1', icon: 'music_note', label: 'Synthwave', colorClass: 'border-secondary/30 text-secondary' },
  { id: 'b2', icon: 'code', label: 'Developer', colorClass: 'border-emerald-500/30 text-emerald-400' },
  { id: 'b3', icon: 'location_on', label: 'Jakarta', colorClass: 'border-white/20 text-on-surface' },
]

const ICON_PRESETS = [
  { icon: 'music_note', name: 'Music' },
  { icon: 'code', name: 'Code' },
  { icon: 'location_on', name: 'Location' },
  { icon: 'sports_esports', name: 'Gaming' },
  { icon: 'fitness_center', name: 'Fitness' },
  { icon: 'local_cafe', name: 'Coffee' },
  { icon: 'palette', name: 'Art' },
  { icon: 'flight_takeoff', name: 'Travel' },
  { icon: 'rocket_launch', name: 'Tech' },
  { icon: 'movie', name: 'Movies' },
]

import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { authService } from '@/services/authService'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user, profile, setUser, setProfile } = useAuthStore()
  const openLogoutConfirm = useLogoutStore((state) => state.openConfirm)
  const showToast = useToastStore((state) => state.showToast)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [activeTab, setActiveTab] = useState('highlights')
  const [isEditing, setIsEditing] = useState(false)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false)

  // Profile data state
  const defaultDisplayName = profile?.display_name || user?.user_metadata?.display_name || localStorage.getItem('adld-user-name') || 'Faith'
  const rawBio = profile?.bio || localStorage.getItem('adld-user-bio') || 'Halo! Selamat datang di profil ADLD Chats saya. Siap terhubung dan berdiskusi! 🚀'
  const defaultBio = rawBio.includes('Digital explorer |') ? 'Halo! Selamat datang di profil ADLD Chats saya. Siap terhubung dan berdiskusi! 🚀' : rawBio
  const defaultUsername = profile?.username || user?.user_metadata?.username || localStorage.getItem('adld-user-username') || 'faith'

  const [name, setName] = useState(defaultDisplayName)
  const [username, setUsername] = useState(defaultUsername)
  const [editUsername, setEditUsername] = useState(defaultUsername)
  const [bio, setBio] = useState(defaultBio)
  const [userAvatarUrl, setUserAvatarUrl] = useState<string>(() => {
    return localStorage.getItem('adld-user-avatar') || '/avatars/male_1_clean.png'
  })

  // Dynamic Friends & Streak data
  const friendsList = (() => {
    try {
      const saved = localStorage.getItem('adld_friends')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {}
    return []
  })()

  const friendsCount = friendsList.length
  const maxStreak = friendsList.length > 0 ? Math.max(...friendsList.map((f: any) => f.streak || 0), 0) : 0

  const recentConversations = (() => {
    try {
      const saved = localStorage.getItem('adld_conversations')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {}
    return []
  })()

  // Dynamic Badges state
  const [badges, setBadges] = useState<ProfileBadge[]>(() => {
    const saved = localStorage.getItem('adld-user-badges')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return DEFAULT_BADGES
  })

  // New Badge Form
  const [newBadgeLabel, setNewBadgeLabel] = useState('')
  const [newBadgeIcon, setNewBadgeIcon] = useState('music_note')

  const tabs = [
    { id: 'highlights', label: t('profile.highlights') },
    { id: 'recent', label: t('profile.recentActivity') },
    { id: 'media', label: t('profile.media') },
    { id: 'mutuals', label: t('profile.mutuals') },
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (result) {
        setUserAvatarUrl(result)
        localStorage.setItem('adld-user-avatar', result)
        window.dispatchEvent(new Event('adld-avatar-changed'))
        setIsAvatarModalOpen(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleTriggerUpload = () => {
    fileInputRef.current?.click()
  }

  const handleSelectAvatar = (url: string) => {
    setUserAvatarUrl(url)
    localStorage.setItem('adld-user-avatar', url)
    window.dispatchEvent(new Event('adld-avatar-changed'))
    setIsAvatarModalOpen(false)
  }

  const handleAddBadge = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBadgeLabel.trim()) return

    const colorClasses = [
      'border-secondary/30 text-secondary',
      'border-emerald-500/30 text-emerald-400',
      'border-white/20 text-on-surface',
      'border-purple-500/30 text-purple-400',
    ]
    const randomColor = colorClasses[badges.length % colorClasses.length]

    const newBadge: ProfileBadge = {
      id: `badge_${Date.now()}`,
      icon: newBadgeIcon,
      label: newBadgeLabel.trim(),
      colorClass: randomColor,
    }

    const updated = [...badges, newBadge]
    setBadges(updated)
    localStorage.setItem('adld-user-badges', JSON.stringify(updated))

    setNewBadgeLabel('')
  }

  const handleRemoveBadge = (id: string) => {
    const updated = badges.filter((b) => b.id !== id)
    setBadges(updated)
    localStorage.setItem('adld-user-badges', JSON.stringify(updated))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="px-4 md:px-8 py-6 max-w-[1200px] mx-auto min-h-screen select-none"
    >
      {/* Profile Header Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Main Info Card */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 lg:col-span-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
          {/* Real Photo / 3D Avatar Display */}
          <div className="relative group flex-shrink-0 flex flex-col items-center">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsAvatarModalOpen(true)}
              className="w-32 h-32 md:w-36 md:h-36 rounded-3xl border-2 border-emerald-500/40 bg-zinc-900 shadow-2xl flex items-center justify-center relative cursor-pointer overflow-hidden group-hover:border-emerald-400 transition-all"
            >
              <img
                src={userAvatarUrl}
                alt="My Profile Avatar"
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1">
                <span className="material-symbols-outlined text-[24px] text-emerald-400">photo_camera</span>
                <span>Ganti Foto Profil</span>
              </div>
            </motion.div>

            <button
              onClick={handleTriggerUpload}
              className="mt-2.5 text-xs font-bold text-emerald-400 flex items-center gap-1.5 hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">upload_file</span>
              Upload Foto Asli
            </button>
          </div>

          {/* Details */}
          <div className="flex-1 w-full min-w-0 text-center md:text-left space-y-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-white font-bold block">
                {name}
              </h1>
              <p className="font-body text-base text-emerald-400 font-semibold mt-0.5">
                @{username}
              </p>
            </div>

            <p className="font-body text-sm sm:text-base text-on-surface-variant leading-relaxed break-words w-full" style={{ wordBreak: 'normal', whiteSpace: 'normal' }}>
              {bio}
            </p>

            {/* Editable Interest & Status Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
              {badges.map((badge) => (
                <span
                  key={badge.id}
                  onClick={() => setIsBadgeModalOpen(true)}
                  className={`px-3 py-1 rounded-full bg-zinc-800/80 border ${badge.colorClass} font-body text-xs sm:text-label-sm flex items-center gap-1.5 cursor-pointer hover:bg-zinc-700/80 transition-all font-semibold`}
                  title="Click to edit badges"
                >
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {badge.icon}
                  </span>
                  <span>{badge.label}</span>
                </span>
              ))}

              <button
                onClick={() => setIsBadgeModalOpen(true)}
                className="px-3 py-1 rounded-full bg-zinc-800/60 hover:bg-emerald-500/20 border border-dashed border-white/20 hover:border-emerald-500 text-on-surface-variant hover:text-emerald-400 font-body text-xs sm:text-label-sm flex items-center gap-1 transition-all"
                title="Add or Edit Badges"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                Edit Tags
              </button>
            </div>

            {/* Action Buttons in a dedicated row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-3 border-t border-white/10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTriggerUpload}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-body text-xs sm:text-label-md px-4 py-2 rounded-full transition-all flex items-center justify-center gap-1.5 shadow-md font-bold"
              >
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                Upload Foto
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsAvatarModalOpen(true)}
                className="glass-panel text-on-surface font-body text-xs sm:text-label-md px-4 py-2 rounded-full transition-colors flex items-center justify-center gap-1.5 hover:bg-white/10 font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">style</span>
                Pilih Avatar 3D
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEditing(true)}
                className="glass-panel text-on-surface font-body text-xs sm:text-label-md px-4 py-2 rounded-full transition-colors flex items-center justify-center gap-1.5 hover:bg-white/10 font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                {t('profile.editProfile')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openLogoutConfirm}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-body text-xs sm:text-label-md px-4 py-2 rounded-full transition-all flex items-center justify-center gap-1.5 font-semibold"
                title="Logout"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Logout
              </motion.button>
            </div>
          </div>
        </div>

        {/* Stats Side Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-1 lg:col-span-4 gap-4">
          <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <span
              className="material-symbols-outlined text-[40px] text-orange-400 mb-2 group-hover:scale-110 transition-transform"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
            <div className="font-display text-headline-md text-on-surface font-bold">
              {maxStreak > 0 ? `${maxStreak} Hari` : '0 Hari'}
            </div>
            <div className="font-body text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              {t('profile.activeStreak')}
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <span
              className="material-symbols-outlined text-[40px] text-emerald-400 mb-2 group-hover:scale-110 transition-transform"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              group
            </span>
            <div className="font-display text-headline-md text-on-surface font-bold">
              {friendsCount}
            </div>
            <div className="font-body text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              {t('profile.connections')}
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex gap-6 border-b border-white/10 mb-6 overflow-x-auto hide-scrollbar pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`font-body text-label-md pb-3 whitespace-nowrap transition-colors border-b-2 font-semibold ${
              activeTab === tab.id
                ? 'text-emerald-400 border-emerald-500'
                : 'text-on-surface-variant border-transparent hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'highlights' && (
        <div className="w-full flex items-center justify-center py-8">
          <div className="glass-panel rounded-3xl p-8 sm:p-10 text-center border border-white/10 space-y-5 w-full max-w-lg mx-auto" style={{ minWidth: '280px' }}>
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-[36px]">stars</span>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-lg text-white font-bold block w-full text-center" style={{ wordBreak: 'normal', whiteSpace: 'normal' }}>
                Belum Ada Sorotan
              </h3>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed block w-full text-center" style={{ wordBreak: 'normal', whiteSpace: 'normal' }}>
                Sorotan cerita dan pencapaian profil Anda akan tampil di sini.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recent' && (
        <>
          {recentConversations.length > 0 ? (
            <div className="space-y-3 max-w-2xl mx-auto w-full py-4">
              {recentConversations.map((c: any) => (
                <div key={c.id} className="glass-panel rounded-2xl p-4 flex items-center gap-4 border border-white/10">
                  <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                    <span className="material-symbols-outlined">chat</span>
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-body text-label-md text-on-surface font-semibold truncate">
                      Obrolan dengan {c.name}
                    </p>
                    <p className="font-body text-label-sm text-on-surface-variant truncate">
                      {c.lastMessage || 'Obrolan dimulai'} · {c.time || 'Baru saja'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full flex items-center justify-center py-8">
              <div className="glass-panel rounded-3xl p-8 sm:p-10 text-center border border-white/10 space-y-5 w-full max-w-lg mx-auto" style={{ minWidth: '280px' }}>
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 text-on-surface-variant/50 flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-[36px]">history</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-lg text-white font-bold block w-full text-center" style={{ wordBreak: 'normal', whiteSpace: 'normal' }}>
                    Belum Ada Aktivitas Terbaru
                  </h3>
                  <p className="font-body text-sm text-on-surface-variant leading-relaxed block w-full text-center" style={{ wordBreak: 'normal', whiteSpace: 'normal' }}>
                    Aktivitas obrolan dan interaksi Anda akan dicatat di sini.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'media' && (
        <div className="w-full flex items-center justify-center py-8">
          <div className="glass-panel rounded-3xl p-8 sm:p-10 text-center border border-white/10 space-y-5 w-full max-w-lg mx-auto" style={{ minWidth: '280px' }}>
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 text-on-surface-variant/50 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-[36px]">photo_library</span>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-lg text-white font-bold block w-full text-center" style={{ wordBreak: 'normal', whiteSpace: 'normal' }}>
                Belum Ada Media
              </h3>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed block w-full text-center" style={{ wordBreak: 'normal', whiteSpace: 'normal' }}>
                Foto dan file yang Anda bagikan di obrolan akan muncul di sini.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mutuals' && (
        <>
          {friendsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto w-full py-4">
              {friendsList.map((f: any) => (
                <div key={f.id} className="glass-panel rounded-2xl p-4 flex items-center gap-3 border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 overflow-hidden flex-shrink-0">
                    {f.avatarUrl ? (
                      <img src={f.avatarUrl} alt={f.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="material-symbols-outlined text-[20px] text-on-surface-variant">person</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-body text-label-md text-on-surface font-bold truncate">{f.name}</p>
                    <p className="font-body text-xs text-emerald-400 truncate">{f.username || '@teman'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full flex items-center justify-center py-8">
              <div className="glass-panel rounded-3xl p-8 sm:p-10 text-center border border-white/10 space-y-5 w-full max-w-lg mx-auto" style={{ minWidth: '280px' }}>
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 text-on-surface-variant/50 flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-[36px]">group_off</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-lg text-white font-bold block w-full text-center" style={{ wordBreak: 'normal', whiteSpace: 'normal' }}>
                    Belum Ada Teman Terhubung
                  </h3>
                  <p className="font-body text-sm text-on-surface-variant leading-relaxed block w-full text-center" style={{ wordBreak: 'normal', whiteSpace: 'normal' }}>
                    Teman yang Anda tambahkan di ADLD Chats akan tampil di daftar ini.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Hidden File Input for Real Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Avatar & Real Photo Selection Modal */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="glass-panel modal-card rounded-3xl p-6 space-y-4 border border-white/10 shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div>
                  <h3 className="font-display text-headline-sm text-on-surface font-bold">Foto Profil & Avatar</h3>
                  <p className="font-body text-xs text-on-surface-variant">Upload foto asli atau pilih karakter avatar 3D</p>
                </div>
                <button onClick={() => setIsAvatarModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 p-1">
                {/* Option A: Upload Custom Real Photo Card */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTriggerUpload}
                  className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/20 cursor-pointer flex items-center gap-4 transition-all"
                >
                  <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[28px]">photo_camera</span>
                  </div>
                  <div>
                    <h4 className="font-display text-label-md font-bold text-white flex items-center gap-1.5">
                      <span>Upload Foto Profil Asli</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-bold">
                        Rekomendasi
                      </span>
                    </h4>
                    <p className="font-body text-xs text-on-surface-variant mt-0.5">
                      Pilih gambar/foto asli dari HP atau folder komputer Anda
                    </p>
                  </div>
                </motion.div>

                {/* Option B: Preset 3D Avatars */}
                <div>
                  <h4 className="font-body text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                    Atau Pilih Character Avatar 3D (16 Style)
                  </h4>
                  <div className="grid grid-cols-4 gap-3">
                    {MALE_AVATAR_OPTIONS.map((avatar: { id: string; name: string; url: string }) => (
                      <motion.div
                        key={avatar.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelectAvatar(avatar.url)}
                        className={`aspect-[3/4] rounded-2xl p-2 border flex flex-col items-center justify-center cursor-pointer transition-all ${
                          userAvatarUrl === avatar.url
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : 'bg-zinc-800/60 border-white/10 hover:border-white/30 text-on-surface'
                        }`}
                      >
                        <img src={avatar.url} alt={avatar.name} className="w-full h-20 object-contain drop-shadow-md" />
                        <span className="font-body text-[10px] mt-1 font-semibold">{avatar.name}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Badges Editor Modal */}
      <AnimatePresence>
        {isBadgeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="glass-panel modal-card rounded-3xl p-6 space-y-5 border border-white/10 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div>
                  <h3 className="font-display text-headline-md text-on-surface font-bold">Manage Interest Tags</h3>
                  <p className="font-body text-xs text-on-surface-variant">Add or remove badges shown on your profile</p>
                </div>
                <button onClick={() => setIsBadgeModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Existing Badges List */}
              <div className="space-y-2">
                <label className="block font-body text-label-md text-on-surface font-semibold">Current Tags</label>
                <div className="flex flex-wrap gap-2 p-3 bg-zinc-900/80 rounded-2xl border border-white/10 min-h-[60px]">
                  {badges.map((badge) => (
                    <span
                      key={badge.id}
                      className={`px-3 py-1 rounded-full bg-zinc-800 border ${badge.colorClass} font-body text-label-sm flex items-center gap-2`}
                    >
                      <span className="material-symbols-outlined text-[14px]">{badge.icon}</span>
                      <span>{badge.label}</span>
                      <button
                        onClick={() => handleRemoveBadge(badge.id)}
                        className="hover:text-red-400 transition-colors"
                        title="Remove tag"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Add New Badge Form */}
              <form onSubmit={handleAddBadge} className="space-y-4 pt-2 border-t border-white/10">
                <div>
                  <label className="block font-body text-label-md text-on-surface mb-1 font-semibold">Add New Tag</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBadgeLabel}
                      onChange={(e) => setNewBadgeLabel(e.target.value)}
                      placeholder="e.g. Hip-Hop, Gamer, Bali..."
                      className="flex-1 bg-zinc-800 border border-white/10 text-on-surface font-body text-body-md rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-display text-label-sm px-4 rounded-xl flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Add
                    </motion.button>
                  </div>
                </div>

                {/* Icon Presets Selector */}
                <div>
                  <label className="block font-body text-label-sm text-on-surface-variant mb-2 font-semibold">Choose Tag Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_PRESETS.map((preset) => (
                      <button
                        key={preset.icon}
                        type="button"
                        onClick={() => setNewBadgeIcon(preset.icon)}
                        className={`p-2.5 rounded-xl border flex items-center gap-1.5 transition-all text-xs ${
                          newBadgeIcon === preset.icon
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : 'bg-zinc-800 border-white/10 text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{preset.icon}</span>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Dialog */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="glass-panel modal-card rounded-3xl p-6 space-y-4 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div>
                  <h3 className="font-display text-headline-sm text-on-surface font-bold">Edit Profil & Akun</h3>
                  <p className="font-body text-xs text-on-surface-variant">Ubah nama lengkap/panggilan, username, dan bio Anda</p>
                </div>
                <button onClick={() => setIsEditing(false)} className="text-on-surface-variant hover:text-on-surface p-1">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!name.trim() || !editUsername.trim()) return

                  const cleanUsername = editUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '')
                  const cleanDisplayName = name.trim()

                  // 1. Update Auth Store user
                  const updatedUser = user ? {
                    ...user,
                    user_metadata: {
                      ...user.user_metadata,
                      display_name: cleanDisplayName,
                      username: cleanUsername,
                    }
                  } : null

                  if (updatedUser) setUser(updatedUser)

                  // 2. Update Auth Store profile
                  const updatedProfile = {
                    ...(profile || {}),
                    id: user?.id || 'usr_current',
                    display_name: cleanDisplayName,
                    username: cleanUsername,
                    bio: bio.trim(),
                    avatar_url: userAvatarUrl,
                    updated_at: new Date().toISOString(),
                  } as any

                  setProfile(updatedProfile)

                  // 3. Persist to localStorage
                  localStorage.setItem('adld-user-name', cleanDisplayName)
                  localStorage.setItem('adld-user-username', cleanUsername)
                  localStorage.setItem('adld-user-bio', bio.trim())

                  // 4. Update local component state
                  setName(cleanDisplayName)
                  setUsername(cleanUsername)

                  // 5. Update Supabase if authenticated
                  try {
                    if (user?.id) {
                      await authService.updateProfile(user.id, {
                        display_name: cleanDisplayName,
                        username: cleanUsername,
                        bio: bio.trim(),
                      })
                    }
                  } catch {}

                  // 6. Broadcast change
                  window.dispatchEvent(new Event('adld-profile-updated'))
                  
                  // 7. Show success toast and close
                  showToast('Profil dan Username berhasil diperbarui!', 'success')
                  setIsEditing(false)
                }}
                className="space-y-4"
              >
                {/* Display Name / Nama Panggilan */}
                <div>
                  <label className="block font-body text-xs font-bold text-on-surface mb-1.5">
                    Nama Lengkap / Panggilan
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Faith, Jonathan, dll"
                    className="w-full bg-zinc-800 border border-white/10 text-on-surface font-body text-sm rounded-xl p-3 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-500"
                    required
                  />
                  <p className="font-body text-[11px] text-on-surface-variant/70 mt-1">
                    Nama ini akan dilihat oleh teman Anda di daftar obrolan dan pencarian.
                  </p>
                </div>

                {/* Username */}
                <div>
                  <label className="block font-body text-xs font-bold text-on-surface mb-1.5">
                    Username Akun (@username)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="username_anda"
                      className="w-full bg-zinc-800 border border-white/10 text-on-surface font-body text-sm rounded-xl pl-8 pr-3 py-3 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-500 font-medium"
                      required
                    />
                  </div>
                  <p className="font-body text-[11px] text-on-surface-variant/70 mt-1">
                    Gunakan huruf kecil, angka, dan underscore (_). Digunakan teman untuk menambah kontak.
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <label className="block font-body text-xs font-bold text-on-surface mb-1.5">
                    Bio & Status Profil
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tuliskan bio atau deskripsi profil Anda..."
                    rows={3}
                    className="w-full bg-zinc-800 border border-white/10 text-on-surface font-body text-sm rounded-xl p-3 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-500 leading-relaxed"
                  />
                </div>

                {/* Avatar Selector Trigger */}
                <div>
                  <label className="block font-body text-xs font-bold text-on-surface mb-1.5">
                    Foto Profil & Avatar 3D
                  </label>
                  <div
                    onClick={() => {
                      setIsEditing(false)
                      setIsAvatarModalOpen(true)
                    }}
                    className="p-3 rounded-2xl glass-panel border border-white/10 flex items-center justify-between cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img src={userAvatarUrl} alt="Selected Avatar" className="w-10 h-10 object-cover rounded-xl border border-white/10" />
                      <div>
                        <p className="font-body text-xs text-on-surface font-bold">Ganti Foto Profil / Avatar 3D</p>
                        <p className="font-body text-[11px] text-emerald-400 font-medium">16 karakter 3D & Upload Foto Asli</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setName(defaultDisplayName)
                      setEditUsername(defaultUsername)
                      setBio(defaultBio)
                      setIsEditing(false)
                    }}
                    className="px-4 py-2.5 rounded-xl glass-panel text-on-surface-variant hover:text-on-surface font-bold text-xs transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
