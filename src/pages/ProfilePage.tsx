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

export default function ProfilePage() {
  const { t } = useTranslation()
  const openLogoutConfirm = useLogoutStore((state) => state.openConfirm)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [activeTab, setActiveTab] = useState('highlights')
  const [isEditing, setIsEditing] = useState(false)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false)

  // Profile data state
  const [name, setName] = useState('Alex Mercer')
  const [bio, setBio] = useState(
    'Digital explorer | Neon nights | Always online. Living for the late night drops and deep conversations. 🌌'
  )
  const [userAvatarUrl, setUserAvatarUrl] = useState<string>(() => {
    return localStorage.getItem('adld-user-avatar') || '/avatars/male_1_clean.png'
  })

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
      className="px-[20px] md:px-[40px] py-6 md:py-8 max-w-[1200px] mx-auto min-h-screen select-none"
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
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <div>
                <h1 className="font-display text-headline-lg text-on-surface font-bold">
                  {name}
                </h1>
                <p className="font-body text-body-lg text-emerald-400 font-medium">
                  @faith
                </p>
              </div>
              <div className="flex gap-2 self-center md:self-auto flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTriggerUpload}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-body text-label-md px-4 py-2 rounded-full transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  Upload Foto Asli
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="glass-panel text-on-surface font-body text-label-md px-4 py-2 rounded-full transition-colors flex items-center justify-center gap-2 hover:bg-white/10"
                >
                  <span className="material-symbols-outlined text-[18px]">style</span>
                  Pilih Avatar 3D
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsEditing(true)}
                  className="glass-panel text-on-surface font-body text-label-md px-4 py-2 rounded-full transition-colors flex items-center justify-center gap-2 hover:bg-white/10"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  {t('profile.editProfile')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={openLogoutConfirm}
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-body text-label-md px-4 py-2 rounded-full transition-all flex items-center justify-center gap-2"
                  title="Logout"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Logout
                </motion.button>
              </div>
            </div>

            <p className="font-body text-body-md text-on-surface-variant mb-6 max-w-lg">
              {bio}
            </p>

            {/* Editable Interest & Status Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              {badges.map((badge) => (
                <span
                  key={badge.id}
                  onClick={() => setIsBadgeModalOpen(true)}
                  className={`px-3 py-1 rounded-full bg-zinc-800/80 border ${badge.colorClass} font-body text-label-sm flex items-center gap-1.5 cursor-pointer hover:bg-zinc-700/80 transition-all`}
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
                className="px-3 py-1 rounded-full bg-zinc-800/60 hover:bg-emerald-500/20 border border-dashed border-white/20 hover:border-emerald-500 text-on-surface-variant hover:text-emerald-400 font-body text-label-sm flex items-center gap-1 transition-all"
                title="Add or Edit Badges"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                Edit Tags
              </button>
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
            <div className="font-display text-headline-md text-on-surface font-bold">24 Days</div>
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
            <div className="font-display text-headline-md text-on-surface font-bold">1,042</div>
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="font-display text-headline-md text-on-surface mb-4 font-bold">
            Highlights
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <motion.div whileHover={{ y: -4 }} className="aspect-[4/5] rounded-2xl overflow-hidden glass-panel border border-white/10 relative group cursor-pointer">
              <div className="w-full h-full bg-zinc-800/50 flex items-center justify-center">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">image</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <span className="font-body text-label-sm text-emerald-400 font-bold">Night City</span>
                <span className="font-body text-label-sm text-white/70">Oct 24</span>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} className="aspect-[4/5] rounded-2xl overflow-hidden glass-panel border border-white/10 relative group cursor-pointer">
              <div className="w-full h-full bg-zinc-800/50 flex items-center justify-center">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">image</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <span className="font-body text-label-sm text-emerald-400 font-bold">Set 01</span>
                <span className="font-body text-label-sm text-white/70">Oct 12</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {activeTab === 'recent' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 max-w-2xl">
          <div className="glass-panel rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400">
              <span className="material-symbols-outlined">chat</span>
            </div>
            <div>
              <p className="font-body text-label-md text-on-surface font-semibold">Sent a message to Kael Mercer</p>
              <p className="font-body text-label-sm text-on-surface-variant">10 minutes ago</p>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-orange-500/10 text-orange-400">
              <span className="material-symbols-outlined">local_fire_department</span>
            </div>
            <div>
              <p className="font-body text-label-md text-on-surface font-semibold">Extended 24-day streak with Marcus Vance</p>
              <p className="font-body text-label-sm text-on-surface-variant">2 hours ago</p>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'media' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-3 gap-3 max-w-2xl">
          <div className="aspect-square rounded-xl bg-zinc-800/60 border border-white/10 flex items-center justify-center text-on-surface-variant/40">
            <span className="material-symbols-outlined">image</span>
          </div>
          <div className="aspect-square rounded-xl bg-zinc-800/60 border border-white/10 flex items-center justify-center text-on-surface-variant/40">
            <span className="material-symbols-outlined">videocam</span>
          </div>
          <div className="aspect-square rounded-xl bg-zinc-800/60 border border-white/10 flex items-center justify-center text-on-surface-variant/40">
            <span className="material-symbols-outlined">image</span>
          </div>
        </motion.div>
      )}

      {activeTab === 'mutuals' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">person</span>
            </div>
            <div>
              <p className="font-body text-label-md text-on-surface font-semibold">Marcus Vance</p>
              <p className="font-body text-label-sm text-on-surface-variant">12 Mutual Friends</p>
            </div>
          </div>
        </motion.div>
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
              className="glass-panel modal-card rounded-3xl p-6 space-y-4 border border-white/10 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="font-display text-headline-md text-on-surface font-bold">Edit Profile</h3>
                <button onClick={() => setIsEditing(false)} className="text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setIsEditing(false)
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block font-body text-label-md text-on-surface mb-1 font-semibold">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-800 border border-white/10 text-on-surface font-body text-body-md rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-body text-label-md text-on-surface mb-1 font-semibold">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-800 border border-white/10 text-on-surface font-body text-body-md rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Avatar Selector Trigger */}
                <div>
                  <label className="block font-body text-label-md text-on-surface mb-2 font-semibold">3D Character Avatar</label>
                  <div
                    onClick={() => {
                      setIsEditing(false)
                      setIsAvatarModalOpen(true)
                    }}
                    className="p-3 rounded-2xl glass-panel border border-white/10 flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img src={userAvatarUrl} alt="Selected Avatar" className="w-10 h-12 object-contain" />
                      <div>
                        <p className="font-body text-label-md text-on-surface font-semibold">Change 3D Male Avatar</p>
                        <p className="font-body text-xs text-emerald-400">16 styles available</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl glass-panel text-on-surface-variant hover:text-on-surface font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display text-label-md shadow-md"
                  >
                    Save Profile
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
