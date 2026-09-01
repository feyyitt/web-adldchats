import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useThemeStore } from '@/stores/themeStore'
import { MALE_AVATAR_OPTIONS } from '@/constants/avatars'

export interface FriendMarker {
  id: string
  name: string
  username: string
  statusText: string
  active: boolean
  lat: number
  lng: number
  distance: string
  lastUpdated: string
  activityIcon?: string
  avatarUrl: string
}

export default function SocialMapPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const theme = useThemeStore((state) => state.theme)

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Record<string, L.Marker>>({})

  // Friends State & Filter - dynamically loaded from adld_friends
  const [friendsList, setFriendsList] = useState<FriendMarker[]>(() => {
    const saved = localStorage.getItem('adld_friends')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((f: any, idx: number) => ({
            id: f.id || `fr_${idx}`,
            name: f.name || 'Teman ADLD',
            username: f.username || '@user',
            statusText: 'Aktif di ADLD 📍',
            active: f.status === 'Online',
            lat: -6.2088 + (idx % 2 === 0 ? 0.004 * (idx + 1) : -0.004 * (idx + 1)),
            lng: 106.8456 + (idx % 3 === 0 ? 0.005 * (idx + 1) : -0.005 * (idx + 1)),
            distance: `${(idx + 1) * 0.5} km away`,
            lastUpdated: 'Baru saja',
            activityIcon: 'location_on',
            avatarUrl: f.avatarUrl || `/avatars/male_${(idx % 16) + 1}_clean.png`,
          }))
        }
      } catch {}
    }
    return []
  })
  const [mapFilter, setMapFilter] = useState<'all' | 'online' | 'store'>('all')

  // Avatar Selection Modal
  const [editingAvatarFriend, setEditingAvatarFriend] = useState<FriendMarker | null>(null)

  // Privacy & Live Sharing
  const [privacySetting, setPrivacySetting] = useState<'ghost' | 'everyone' | 'selected'>(() => {
    const saved = localStorage.getItem('adld-location-privacy')
    return (saved as any) || 'ghost'
  })
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false)
  const [liveLocationDuration, setLiveLocationDuration] = useState<number | null>(null)
  const [isLiveSharingOpen, setIsLiveSharingOpen] = useState(false)

  // Map Controls & Selection
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMarker, setSelectedMarker] = useState<FriendMarker | null>(null)
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false)

  const filteredMarkers = friendsList.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.username.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    if (mapFilter === 'online') return m.active
    if (mapFilter === 'store') return m.id === '1' || m.statusText.toLowerCase().includes('katalog')
    return true
  })

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [-6.2088, 106.8456],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    })

    const tileUrl =
      theme === 'light'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

    L.tileLayer(tileUrl, {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [theme])

  // Update Markers with Clean 3D Male Characters
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    Object.values(markersRef.current).forEach((m) => m.remove())
    markersRef.current = {}

    filteredMarkers.forEach((friend) => {
      const customIcon = L.divIcon({
        className: 'custom-adldmap-icon',
        html: `
          <div class="relative group cursor-pointer flex flex-col items-center select-none">
            <!-- Dynamic Floating 3D Human Male Character Container -->
            <div class="relative flex flex-col items-center justify-center animate-adldmap-float">
              <img 
                src="${friend.avatarUrl}" 
                alt="${friend.name}"
                class="w-28 h-36 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-110 ${
                  friend.active ? '' : 'grayscale opacity-60'
                }"
              />
              
              <!-- Pedestal Base Ring -->
              <div class="w-14 h-2 rounded-full bg-emerald-500/30 blur-sm -mt-2"></div>
              <div class="w-10 h-1 rounded-full ${friend.active ? 'bg-emerald-500' : 'bg-zinc-500'} -mt-1 shadow-md"></div>

              <!-- Floating Activity Badge -->
              ${
                friend.activityIcon
                  ? `<div class="absolute top-2 -right-1 w-8 h-8 rounded-full bg-zinc-900/90 border border-white/20 flex items-center justify-center shadow-lg text-emerald-400 backdrop-blur-md">
                      <span class="material-symbols-outlined text-[18px]">${friend.activityIcon}</span>
                    </div>`
                  : ''
              }
            </div>

            <!-- ADLD Maps Name Tag Pill -->
            <div class="mt-1 bg-zinc-900/90 backdrop-blur-xl border border-white/15 rounded-full px-3.5 py-1 text-center shadow-xl flex items-center gap-1.5 min-w-max">
              <span class="w-2.5 h-2.5 rounded-full ${friend.active ? 'bg-emerald-500' : 'bg-zinc-500'}"></span>
              <span class="text-[12px] font-bold text-white tracking-tight">${friend.name}</span>
              <span class="text-[10px] text-emerald-400 font-medium">• ${friend.distance}</span>
            </div>
          </div>
        `,
        iconSize: [120, 170],
        iconAnchor: [60, 150],
      })

      const marker = L.marker([friend.lat, friend.lng], { icon: customIcon }).addTo(map)

      marker.on('click', () => {
        setSelectedMarker(friend)
        map.flyTo([friend.lat, friend.lng], 15, { duration: 1 })
      })

      markersRef.current[friend.id] = marker
    })
  }, [filteredMarkers])

  const handleSelectNewAvatar = (newAvatarUrl: string) => {
    if (!editingAvatarFriend) return
    setFriendsList((prev) =>
      prev.map((f) => (f.id === editingAvatarFriend.id ? { ...f, avatarUrl: newAvatarUrl } : f))
    )
    if (selectedMarker?.id === editingAvatarFriend.id) {
      setSelectedMarker((prev) => (prev ? { ...prev, avatarUrl: newAvatarUrl } : null))
    }
    setEditingAvatarFriend(null)
  }

  const handlePrivacyChange = (mode: 'ghost' | 'everyone' | 'selected') => {
    setPrivacySetting(mode)
    localStorage.setItem('adld-location-privacy', mode)
    setIsPrivacyModalOpen(false)
  }

  const handleStartLiveLocation = (mins: number) => {
    setLiveLocationDuration(mins)
    setIsLiveSharingOpen(false)
  }

  const handleStopLiveLocation = () => {
    setLiveLocationDuration(null)
  }

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn()
  }

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut()
  }

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([-6.2088, 106.8456], 14, { duration: 1 })
    }
  }

  return (
    <div className="relative h-[calc(100vh-72px)] md:h-screen w-full bg-[#09090b] overflow-hidden select-none">
      {/* Real Interactive Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* Live Sharing Active Banner */}
      {liveLocationDuration !== null && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-6 py-2 rounded-full font-semibold text-xs shadow-xl backdrop-blur-md flex items-center gap-3"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          Live Location Sharing Active ({liveLocationDuration}m)
          <button onClick={handleStopLiveLocation} className="ml-2 underline hover:text-white transition-colors">
            Stop
          </button>
        </motion.div>
      )}

      {/* Map Header Overlay Controls - Top Left */}
      <div className="absolute top-6 left-6 z-30 flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsPrivacyModalOpen(true)}
          className="glass-panel px-4 py-2.5 rounded-full border border-white/10 shadow-lg flex items-center gap-2.5 hover:bg-white/10 transition-all text-on-surface"
        >
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">
            {privacySetting === 'ghost' ? 'visibility_off' : privacySetting === 'everyone' ? 'public' : 'group'}
          </span>
          <span className="font-body text-label-md capitalize">
            {privacySetting === 'ghost'
              ? 'Ghost Mode (OFF)'
              : privacySetting === 'everyone'
              ? 'Everyone'
              : 'Selected Friends'}
          </span>
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
            expand_more
          </span>
        </motion.button>
      </div>

      {/* Map Search & Zoom Controls Overlay - Top Right */}
      <div className="absolute top-6 right-6 z-30 flex flex-col gap-2.5 max-w-[260px] w-full">
        {/* Search */}
        <div className="glass-panel rounded-full border border-white/10 p-1.5 flex items-center shadow-lg">
          <span className="material-symbols-outlined text-on-surface-variant ml-2 text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('map.searchLocation')}
            className="bg-transparent border-none text-on-surface font-body text-body-md focus:outline-none w-full placeholder:text-on-surface-variant/50 ml-2"
          />
        </div>

        {/* Snap Map Radar Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 hide-scrollbar">
          <button
            onClick={() => setMapFilter('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
              mapFilter === 'all'
                ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md'
                : 'glass-panel text-on-surface-variant hover:text-white border-white/10'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setMapFilter('online')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border flex items-center gap-1 ${
              mapFilter === 'online'
                ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md'
                : 'glass-panel text-on-surface-variant hover:text-white border-white/10'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online</span>
          </button>
          <button
            onClick={() => setMapFilter('store')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border flex items-center gap-1 ${
              mapFilter === 'store'
                ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md'
                : 'glass-panel text-on-surface-variant hover:text-white border-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">storefront</span>
            <span>Seller</span>
          </button>
        </div>

        {/* Live Location Action Trigger */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsLiveSharingOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-display text-label-sm py-2.5 px-4 rounded-full border border-white/10 shadow-lg flex items-center justify-center gap-2 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">my_location</span>
          Share Live Location
        </motion.button>

        {/* Zoom Controls */}
        <div className="flex flex-col gap-2 items-end">
          <div className="glass-panel rounded-xl border border-white/10 flex flex-col shadow-lg overflow-hidden w-11">
            <button
              onClick={handleZoomIn}
              className="p-2.5 text-on-surface hover:bg-white/10 transition-colors border-b border-white/10 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2.5 text-on-surface hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">remove</span>
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRecenter}
            className="glass-panel rounded-full p-3 border border-white/10 shadow-lg hover:bg-white/10 transition-colors text-emerald-400"
            title="Recenter Map"
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              near_me
            </span>
          </motion.button>
        </div>
      </div>

      {/* Selected Marker Detail Card */}
      <AnimatePresence>
        {selectedMarker && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-28 left-1/2 transform -translate-x-1/2 z-40 w-[90vw] max-w-sm min-w-[280px] flex-shrink-0 px-2"
          >
            <div className="glass-panel modal-card rounded-3xl p-5 border border-white/15 shadow-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative group flex-shrink-0">
                    <img
                      src={selectedMarker.avatarUrl}
                      alt={selectedMarker.name}
                      className="w-12 h-14 object-contain rounded-xl bg-zinc-800/80 border border-white/10 p-1"
                    />
                    <button
                      onClick={() => setEditingAvatarFriend(selectedMarker)}
                      className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 text-white rounded-full text-[12px] shadow-lg hover:scale-110 transition-transform"
                      title="Change 3D Male Avatar"
                    >
                      <span className="material-symbols-outlined text-[14px]">style</span>
                    </button>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-body text-label-md text-on-surface truncate font-bold">{selectedMarker.name}</h3>
                    <p className="font-body text-label-sm text-emerald-400 truncate">
                      {selectedMarker.statusText}
                    </p>
                    <p className="font-body text-[11px] text-on-surface-variant truncate">
                      {selectedMarker.distance} · {selectedMarker.lastUpdated}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMarker(null)}
                  className="text-on-surface-variant hover:text-on-surface p-1"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/chat')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-display text-label-sm py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  Message
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setEditingAvatarFriend(selectedMarker)}
                  className="flex-1 glass-panel text-on-surface font-display text-label-sm py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">style</span>
                  Choose Avatar
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nearby Friends Bottom Sheet */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 glass-panel border-t border-white/10 rounded-t-3xl shadow-2xl transition-all duration-300 flex flex-col ${
          isBottomSheetExpanded ? 'h-[60vh]' : 'h-24'
        }`}
      >
        <div
          onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
          className="w-full py-3 flex flex-col items-center justify-center cursor-pointer group"
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full group-hover:bg-emerald-500/60 transition-colors mb-1" />
          <div className="flex items-center gap-2 text-on-surface-variant font-body text-label-sm">
            <span>{isBottomSheetExpanded ? 'Collapse Nearby Friends' : 'Expand Nearby Friends'}</span>
            <span className="material-symbols-outlined text-[18px]">
              {isBottomSheetExpanded ? 'expand_more' : 'expand_less'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-20 space-y-3">
          <h3 className="font-display text-headline-sm text-on-surface border-b border-white/10 pb-2 font-bold">
            Nearby Friends ({friendsList.length})
          </h3>
          {friendsList.map((friend) => (
            <motion.div
              key={friend.id}
              whileHover={{ x: 3 }}
              onClick={() => {
                setSelectedMarker(friend)
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo([friend.lat, friend.lng], 15, { duration: 1 })
                }
                setIsBottomSheetExpanded(false)
              }}
              className="flex items-center justify-between p-3 rounded-2xl glass-panel hover:bg-white/10 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <img
                  src={friend.avatarUrl}
                  alt={friend.name}
                  className="w-10 h-12 object-contain rounded-lg bg-zinc-800 border border-white/10 p-0.5"
                />
                <div>
                  <h4 className="font-body text-label-md text-on-surface font-bold">{friend.name}</h4>
                  <p className="font-body text-label-sm text-emerald-400">{friend.statusText}</p>
                  <p className="font-body text-[11px] text-on-surface-variant">
                    {friend.distance} · {friend.lastUpdated}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingAvatarFriend(friend)
                  }}
                  className="p-2 rounded-full glass-panel hover:bg-white/10 text-on-surface-variant hover:text-emerald-400 transition-colors"
                  title="Change Avatar"
                >
                  <span className="material-symbols-outlined text-[18px]">style</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate('/chat')
                  }}
                  className="p-2 rounded-full glass-panel hover:bg-emerald-600 hover:text-white text-emerald-400 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 16 3D Male Avatar Selector Modal */}
      <AnimatePresence>
        {editingAvatarFriend && (
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
                  <h3 className="font-display text-headline-md text-on-surface font-bold">Select 3D Male Avatar</h3>
                  <p className="font-body text-xs text-on-surface-variant">Choose from 16 3D male avatar styles for {editingAvatarFriend.name}</p>
                </div>
                <button onClick={() => setEditingAvatarFriend(null)} className="text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-3 p-1">
                {MALE_AVATAR_OPTIONS.map((avatar) => (
                  <motion.div
                    key={avatar.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectNewAvatar(avatar.url)}
                    className={`aspect-[3/4] rounded-2xl p-2 border flex flex-col items-center justify-center cursor-pointer transition-all ${
                      editingAvatarFriend.avatarUrl === avatar.url
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-zinc-800/60 border-white/10 hover:border-white/30 text-on-surface'
                    }`}
                  >
                    <img src={avatar.url} alt={avatar.name} className="w-full h-20 object-contain drop-shadow-md" />
                    <span className="font-body text-[10px] mt-1 font-semibold">{avatar.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Privacy Modal */}
      <AnimatePresence>
        {isPrivacyModalOpen && (
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
                <h3 className="font-display text-headline-md text-on-surface font-bold">Location Visibility</h3>
                <button onClick={() => setIsPrivacyModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handlePrivacyChange('ghost')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-all ${
                    privacySetting === 'ghost'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'glass-panel border-white/10 text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px] mt-0.5">visibility_off</span>
                  <div>
                    <p className="font-body text-label-md font-bold">Ghost Mode (OFF)</p>
                    <p className="font-body text-label-sm text-on-surface-variant/80 mt-0.5">
                      Your location is completely private. No one can see where you are.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrivacyChange('everyone')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-all ${
                    privacySetting === 'everyone'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'glass-panel border-white/10 text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px] mt-0.5">public</span>
                  <div>
                    <p className="font-body text-label-md font-bold">Everyone (All Friends)</p>
                    <p className="font-body text-label-sm text-on-surface-variant/80 mt-0.5">
                      All accepted friends can see your live position on the Friends Map.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrivacyChange('selected')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-all ${
                    privacySetting === 'selected'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'glass-panel border-white/10 text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px] mt-0.5">group</span>
                  <div>
                    <p className="font-body text-label-md font-bold">Selected Friends Only</p>
                    <p className="font-body text-label-sm text-on-surface-variant/80 mt-0.5">
                      Only specific friends you choose can see your location.
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Location Share Modal */}
      <AnimatePresence>
        {isLiveSharingOpen && (
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
                <h3 className="font-display text-headline-md text-on-surface font-bold">Share Live Location</h3>
                <button onClick={() => setIsLiveSharingOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <p className="font-body text-body-md text-on-surface-variant">
                Select how long you want to share your live location with your friends:
              </p>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleStartLiveLocation(15)}
                  className="p-4 rounded-2xl bg-zinc-800 hover:bg-emerald-600 hover:text-white text-on-surface font-bold text-center transition-all"
                >
                  15 Mins
                </button>
                <button
                  onClick={() => handleStartLiveLocation(60)}
                  className="p-4 rounded-2xl bg-zinc-800 hover:bg-emerald-600 hover:text-white text-on-surface font-bold text-center transition-all"
                >
                  1 Hour
                </button>
                <button
                  onClick={() => handleStartLiveLocation(480)}
                  className="p-4 rounded-2xl bg-zinc-800 hover:bg-emerald-600 hover:text-white text-on-surface font-bold text-center transition-all"
                >
                  8 Hours
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
