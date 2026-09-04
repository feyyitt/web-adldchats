import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAuthStore } from '@/stores/authStore'
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
  activityLabel?: string
  avatarUrl: string
}

export type MapStyleType = 'dark' | 'satellite' | 'streets'

// Haversine formula for exact real-world distance (km)
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Number((R * c).toFixed(1))
}

export default function SocialMapPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const tileLayersRef = useRef<L.Layer[]>([])
  const markersRef = useRef<Record<string, L.Marker>>({})
  const userMarkerRef = useRef<L.Marker | null>(null)
  const routeLineRef = useRef<L.Polyline | null>(null)

  // Map Basemap Style
  const [mapStyle, setMapStyle] = useState<MapStyleType>(() => {
    return (localStorage.getItem('adld-map-style') as MapStyleType) || 'dark'
  })
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false)

  // User Live Coordinates
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: -6.2088,
    lng: 106.8456,
  })
  const [isLocating, setIsLocating] = useState(false)

  // Friends State & Filter
  const [friendsList, setFriendsList] = useState<FriendMarker[]>(() => {
    const saved = localStorage.getItem('adld_friends')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const activities = [
            { icon: 'headphones', label: 'Mendengarkan Musik' },
            { icon: 'local_cafe', label: 'Ngopi di Cafe' },
            { icon: 'storefront', label: 'Buka Katalog' },
            { icon: 'fitness_center', label: 'Gym & Fitness' },
            { icon: 'directions_car', label: 'Di Perjalanan' },
          ]
          return parsed.map((f: any, idx: number) => {
            const act = activities[idx % activities.length]
            return {
              id: f.id || `fr_${idx}`,
              name: f.name || 'Teman ADLD',
              username: f.username || '@user',
              statusText: f.statusText || 'Aktif di ADLD 📍',
              active: f.status === 'Online',
              lat: -6.2088 + (idx % 2 === 0 ? 0.005 * (idx + 1) : -0.005 * (idx + 1)),
              lng: 106.8456 + (idx % 3 === 0 ? 0.006 * (idx + 1) : -0.006 * (idx + 1)),
              distance: `${(idx + 1) * 0.6} km`,
              lastUpdated: 'Baru saja',
              activityIcon: act.icon,
              activityLabel: act.label,
              avatarUrl: f.avatarUrl || `/avatars/male_${(idx % 16) + 1}_clean.png`,
            }
          })
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

  // Map Selection & Sheet
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMarker, setSelectedMarker] = useState<FriendMarker | null>(null)
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false)

  // Filtered Friends
  const filteredMarkers = friendsList.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.username.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    if (mapFilter === 'online') return m.active
    if (mapFilter === 'store') return m.id === '1' || m.statusText.toLowerCase().includes('katalog')
    return true
  })

  // 1. Initialize Leaflet Map (Once on mount)
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    })

    mapInstanceRef.current = map

    // Attempt to silently request GPS location on start
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setUserLocation({ lat, lng })
          map.setView([lat, lng], 14)
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // 2. Basemap Style Switcher (Swaps tiles seamlessly without resetting map)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Remove existing tile layers
    tileLayersRef.current.forEach((layer) => {
      if (map.hasLayer(layer)) map.removeLayer(layer)
    })
    tileLayersRef.current = []

    const newLayers: L.Layer[] = []

    if (mapStyle === 'satellite') {
      // High-res Esri Satellite Imagery + Boundaries & Places
      const satBase = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, maxNativeZoom: 18 }
      )
      const satRef = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, maxNativeZoom: 18 }
      )
      satBase.addTo(map)
      satRef.addTo(map)
      newLayers.push(satBase, satRef)
    } else if (mapStyle === 'streets') {
      // Detailed OpenStreetMap
      const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        subdomains: 'abc',
        maxZoom: 19,
      })
      osm.addTo(map)
      newLayers.push(osm)
    } else {
      // Default: Dark Luxury Esri Canvas (Base + Reference)
      const darkBase = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, maxNativeZoom: 16 }
      )
      const darkRef = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, maxNativeZoom: 16 }
      )
      darkBase.addTo(map)
      darkRef.addTo(map)
      newLayers.push(darkBase, darkRef)
    }

    tileLayersRef.current = newLayers
    localStorage.setItem('adld-map-style', mapStyle)
  }, [mapStyle])

  // 3. Render Current User Marker (with Sonar Radar Pulse Wave)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
    }

    const userName = profile?.display_name || user?.user_metadata?.name || 'Saya'
    const userAvatar = profile?.avatar_url || '/avatars/male_1_clean.png'

    const userIcon = L.divIcon({
      className: 'custom-adldmap-user-icon',
      html: `
        <div class="relative flex flex-col items-center select-none cursor-pointer">
          <!-- Sonar Radar Pulse Concentric Rings -->
          <div class="absolute -top-1 w-24 h-24 rounded-full bg-emerald-500/25 animate-radar-pulse pointer-events-none"></div>
          <div class="absolute top-2 w-16 h-16 rounded-full bg-emerald-400/20 animate-pulse pointer-events-none"></div>

          <!-- 3D Avatar Container -->
          <div class="relative flex flex-col items-center justify-center animate-adldmap-float z-10">
            <img 
              src="${userAvatar}" 
              alt="${userName}"
              class="w-24 h-32 object-contain drop-shadow-[0_12px_24px_rgba(16,185,129,0.45)]"
            />
            
            <!-- Hologram Pedestal Light Base -->
            <div class="w-14 h-2.5 rounded-full bg-emerald-400/60 blur-sm -mt-2"></div>
            <div class="w-10 h-1.5 rounded-full bg-emerald-400 -mt-1 shadow-lg shadow-emerald-500/60 border border-emerald-300"></div>

            <!-- Crown / My Location Badge -->
            <div class="absolute top-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-zinc-950 font-bold flex items-center justify-center shadow-lg border border-white/40">
              <span class="material-symbols-outlined text-[16px]">my_location</span>
            </div>
          </div>

          <!-- Current User Pill Tag -->
          <div class="z-20 mt-1.5 bg-emerald-950/95 border border-emerald-400/50 rounded-full px-3 py-0.5 text-center shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span class="text-[11px] font-black text-emerald-300 tracking-wide">${userName} (Lokasi Anda)</span>
          </div>
        </div>
      `,
      iconSize: [120, 160],
      iconAnchor: [60, 140],
    })

    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 1000,
    }).addTo(map)

    userMarker.on('click', () => {
      map.flyTo([userLocation.lat, userLocation.lng], 16, { duration: 1 })
    })

    userMarkerRef.current = userMarker
  }, [userLocation, profile, user])

  // 4. Update Markers with Clean 3D Characters & Hologram Pedestals
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    Object.values(markersRef.current).forEach((m) => m.remove())
    markersRef.current = {}

    filteredMarkers.forEach((friend) => {
      const realDist = calculateHaversineKm(userLocation.lat, userLocation.lng, friend.lat, friend.lng)

      const customIcon = L.divIcon({
        className: 'custom-adldmap-icon',
        html: `
          <div class="relative group cursor-pointer flex flex-col items-center select-none">
            <!-- Dynamic Floating 3D Human Male Character -->
            <div class="relative flex flex-col items-center justify-center animate-adldmap-float">
              <img 
                src="${friend.avatarUrl}" 
                alt="${friend.name}"
                class="w-28 h-36 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)] transition-transform duration-300 group-hover:scale-110 ${
                  friend.active ? '' : 'grayscale opacity-60'
                }"
              />
              
              <!-- Pedestal Base Ring Hologram -->
              <div class="w-14 h-2 rounded-full ${friend.active ? 'bg-emerald-500/40' : 'bg-zinc-600/30'} blur-sm -mt-2"></div>
              <div class="w-10 h-1 rounded-full ${friend.active ? 'bg-emerald-400 shadow-emerald-500/40' : 'bg-zinc-500'} -mt-1 shadow-md"></div>

              <!-- Floating Activity Badge -->
              ${
                friend.activityIcon
                  ? `<div class="absolute top-2 -right-1 w-8 h-8 rounded-full bg-zinc-900/95 border border-white/20 flex items-center justify-center shadow-lg text-emerald-400 backdrop-blur-md group-hover:scale-110 transition-transform">
                      <span class="material-symbols-outlined text-[17px]">${friend.activityIcon}</span>
                    </div>`
                  : ''
              }
            </div>

            <!-- ADLD Maps Name Tag Pill -->
            <div class="mt-1 bg-zinc-900/90 backdrop-blur-xl border border-white/15 rounded-full px-3 py-1 text-center shadow-xl flex items-center gap-1.5 min-w-max group-hover:border-emerald-500/50 transition-colors">
              <span class="w-2.5 h-2.5 rounded-full ${friend.active ? 'bg-emerald-500' : 'bg-zinc-500'}"></span>
              <span class="text-[12px] font-bold text-white tracking-tight">${friend.name}</span>
              <span class="text-[10px] text-emerald-400 font-medium">• ${realDist} km</span>
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
  }, [filteredMarkers, userLocation])

  // 5. Draw Glowing Neon Route Polyline when a friend is selected
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (routeLineRef.current) {
      routeLineRef.current.remove()
      routeLineRef.current = null
    }

    if (selectedMarker) {
      const polyline = L.polyline(
        [
          [userLocation.lat, userLocation.lng],
          [selectedMarker.lat, selectedMarker.lng],
        ],
        {
          color: '#10b981',
          weight: 4,
          opacity: 0.9,
          className: 'leaflet-route-glow',
        }
      ).addTo(map)

      routeLineRef.current = polyline
    }

    return () => {
      if (routeLineRef.current) {
        routeLineRef.current.remove()
        routeLineRef.current = null
      }
    }
  }, [selectedMarker, userLocation])

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

  // Accurate GPS locate user
  const handleRecenter = () => {
    if (!navigator.geolocation) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1 })
      }
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(newCoords)
        setIsLocating(false)
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([newCoords.lat, newCoords.lng], 16, { duration: 1.2 })
        }
      },
      () => {
        setIsLocating(false)
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1 })
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleOpenGoogleMapsDirections = (friend: FriendMarker) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${friend.lat},${friend.lng}&travelmode=driving`
    window.open(url, '_blank')
  }

  const selectedDistKm = selectedMarker
    ? calculateHaversineKm(userLocation.lat, userLocation.lng, selectedMarker.lat, selectedMarker.lng)
    : 0
  const selectedEstMins = Math.max(1, Math.round((selectedDistKm / 25) * 60))

  return (
    <div className="relative h-[calc(100vh-120px)] md:h-screen w-full bg-[#09090b] overflow-hidden select-none">
      {/* Real Interactive Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* Live Sharing Active Banner */}
      {liveLocationDuration !== null && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-5 py-2 rounded-full font-semibold text-xs shadow-xl backdrop-blur-md flex items-center gap-3"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          Live Location Sharing Aktif ({liveLocationDuration}m)
          <button onClick={handleStopLiveLocation} className="ml-2 underline hover:text-white transition-colors">
            Hentikan
          </button>
        </motion.div>
      )}

      {/* TOP FLOATING CONTROLS BAR (Mobile & Desktop Responsive) */}
      <div className="absolute top-4 left-3 right-3 sm:top-6 sm:left-6 sm:right-6 z-30 flex flex-wrap items-start justify-between gap-2.5 pointer-events-none">
        {/* Left Controls: Privacy & Basemap Switcher */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Privacy Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsPrivacyModalOpen(true)}
            className="glass-panel px-3.5 py-2 rounded-full border border-white/15 shadow-xl flex items-center gap-2 hover:bg-white/10 transition-all text-on-surface text-xs font-semibold backdrop-blur-xl"
            title="Pengaturan Privasi Lokasi"
          >
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">
              {privacySetting === 'ghost' ? 'visibility_off' : privacySetting === 'everyone' ? 'public' : 'group'}
            </span>
            <span className="hidden sm:inline font-body capitalize">
              {privacySetting === 'ghost'
                ? 'Ghost Mode'
                : privacySetting === 'everyone'
                ? 'Everyone'
                : 'Selected'}
            </span>
          </motion.button>

          {/* Basemap Style Switcher Pill */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
              className="glass-panel px-3.5 py-2 rounded-full border border-white/15 shadow-xl flex items-center gap-2 hover:bg-white/10 transition-all text-on-surface text-xs font-semibold backdrop-blur-xl"
              title="Ganti Mode Peta"
            >
              <span className="material-symbols-outlined text-emerald-400 text-[18px]">
                {mapStyle === 'satellite' ? 'satellite_alt' : mapStyle === 'streets' ? 'map' : 'dark_mode'}
              </span>
              <span className="capitalize font-body">
                {mapStyle === 'satellite' ? 'Satelit' : mapStyle === 'streets' ? 'Jalan' : 'Dark 3D'}
              </span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
            </motion.button>

            {/* Basemap Dropdown Menu */}
            <AnimatePresence>
              {isStyleMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute left-0 mt-2 w-48 rounded-2xl glass-panel modal-card border border-white/15 p-2 shadow-2xl space-y-1 z-50 backdrop-blur-2xl"
                >
                  <button
                    onClick={() => {
                      setMapStyle('dark')
                      setIsStyleMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      mapStyle === 'dark'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'text-on-surface hover:bg-white/10'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">dark_mode</span>
                    <span>Dark Luxury (3D)</span>
                  </button>

                  <button
                    onClick={() => {
                      setMapStyle('satellite')
                      setIsStyleMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      mapStyle === 'satellite'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'text-on-surface hover:bg-white/10'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">satellite_alt</span>
                    <span>Satelit Bumi Asli</span>
                  </button>

                  <button
                    onClick={() => {
                      setMapStyle('streets')
                      setIsStyleMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      mapStyle === 'streets'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'text-on-surface hover:bg-white/10'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">map</span>
                    <span>Jalan Detail (OSM)</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Controls: Search & Filters & Action */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto max-w-[280px] w-full sm:w-auto">
          {/* Search Input */}
          <div className="glass-panel rounded-full border border-white/15 px-3 py-1.5 flex items-center shadow-xl w-full sm:w-64 backdrop-blur-xl">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('map.searchLocation') || 'Cari teman di peta...'}
              className="bg-transparent border-none text-on-surface font-body text-xs focus:outline-none w-full placeholder:text-on-surface-variant/50 ml-2"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-on-surface-variant hover:text-white">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 hide-scrollbar">
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
              <span className="material-symbols-outlined text-[13px]">storefront</span>
              <span>Seller</span>
            </button>
          </div>

          {/* Live Location Action Trigger */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsLiveSharingOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-display text-[11px] font-bold py-2 px-3.5 rounded-full border border-emerald-400/30 shadow-xl flex items-center justify-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">sensors</span>
            Bagikan Lokasi Live
          </motion.button>
        </div>
      </div>

      {/* RIGHT FLOATING ZOOM & GPS CONTROLS */}
      <div className="absolute right-4 bottom-32 sm:bottom-36 z-30 flex flex-col gap-2.5 items-end">
        {/* Zoom Controls */}
        <div className="glass-panel rounded-2xl border border-white/15 flex flex-col shadow-2xl overflow-hidden w-11 backdrop-blur-xl">
          <button
            onClick={handleZoomIn}
            className="p-2.5 text-on-surface hover:bg-white/10 transition-colors border-b border-white/10 flex items-center justify-center"
            title="Zoom In"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2.5 text-on-surface hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Zoom Out"
          >
            <span className="material-symbols-outlined text-[20px]">remove</span>
          </button>
        </div>

        {/* GPS Lokasi Saya (Recenter) */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleRecenter}
          disabled={isLocating}
          className={`glass-panel rounded-full p-3 border border-white/15 shadow-2xl hover:bg-white/10 transition-all text-emerald-400 backdrop-blur-xl ${
            isLocating ? 'animate-spin' : ''
          }`}
          title="Pusatkan ke Lokasi Saya (GPS)"
        >
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {isLocating ? 'sync' : 'near_me'}
          </span>
        </motion.button>
      </div>

      {/* SELECTED FRIEND DETAIL CARD (With Neon Route & Navigation) */}
      <AnimatePresence>
        {selectedMarker && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-28 left-1/2 transform -translate-x-1/2 z-40 w-[92vw] max-w-sm min-w-[280px] flex-shrink-0 px-1"
          >
            <div className="glass-panel modal-card rounded-3xl p-5 border border-emerald-500/30 shadow-2xl space-y-3.5 backdrop-blur-2xl">
              {/* Header Friend Info */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative group flex-shrink-0">
                    <img
                      src={selectedMarker.avatarUrl}
                      alt={selectedMarker.name}
                      className="w-14 h-16 object-contain rounded-2xl bg-zinc-900/90 border border-emerald-500/30 p-1 drop-shadow-md"
                    />
                    <button
                      onClick={() => setEditingAvatarFriend(selectedMarker)}
                      className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 text-white rounded-full text-[12px] shadow-lg hover:scale-110 transition-transform"
                      title="Ubah Karakter 3D"
                    >
                      <span className="material-symbols-outlined text-[13px]">style</span>
                    </button>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-body text-sm text-on-surface truncate font-extrabold">{selectedMarker.name}</h3>
                      <span className="text-[11px] text-zinc-400 truncate">{selectedMarker.username}</span>
                    </div>
                    <p className="font-body text-xs text-emerald-400 font-semibold truncate flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        {selectedMarker.activityIcon || 'near_me'}
                      </span>
                      <span>{selectedMarker.activityLabel || selectedMarker.statusText}</span>
                    </p>
                    {/* Glowing Route Distance Pill */}
                    <div className="inline-flex items-center gap-1.5 mt-1 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] text-emerald-300 font-bold">
                      <span className="material-symbols-outlined text-[13px]">route</span>
                      <span>{selectedDistKm} km</span>
                      <span className="text-zinc-400">• ~{selectedEstMins} menit</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMarker(null)}
                  className="text-on-surface-variant hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Action Buttons: Chat, Navigation Directions, Avatar */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/chat/' + selectedMarker.id, { state: { friend: selectedMarker } })}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  Kirim Pesan
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleOpenGoogleMapsDirections(selectedMarker)}
                  className="glass-panel hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-display text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  title="Buka Navigasi Rute"
                >
                  <span className="material-symbols-outlined text-[16px]">directions</span>
                  Petunjuk Arah
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEARBY FRIENDS BOTTOM SHEET */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 glass-panel border-t border-white/15 rounded-t-3xl shadow-2xl transition-all duration-300 flex flex-col backdrop-blur-2xl ${
          isBottomSheetExpanded ? 'h-[60vh]' : 'h-24'
        }`}
      >
        <div
          onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
          className="w-full py-3 flex flex-col items-center justify-center cursor-pointer group"
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full group-hover:bg-emerald-500/60 transition-colors mb-1" />
          <div className="flex items-center gap-2 text-on-surface-variant font-body text-xs font-medium">
            <span>{isBottomSheetExpanded ? 'Tutup Daftar Teman Sekitar' : 'Buka Daftar Teman Sekitar'}</span>
            <span className="material-symbols-outlined text-[18px]">
              {isBottomSheetExpanded ? 'expand_more' : 'expand_less'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-20 space-y-2.5">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="font-display text-sm text-on-surface font-extrabold">
              Teman Terdekat ({friendsList.length})
            </h3>
            <span className="text-[11px] text-emerald-400 font-semibold">Live Radar Active</span>
          </div>

          {friendsList.length > 0 ? (
            friendsList.map((friend) => {
              const liveDist = calculateHaversineKm(userLocation.lat, userLocation.lng, friend.lat, friend.lng)
              return (
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
                  className={`flex items-center justify-between p-3 rounded-2xl glass-panel hover:bg-white/10 cursor-pointer transition-all border ${
                    selectedMarker?.id === friend.id ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={friend.avatarUrl}
                      alt={friend.name}
                      className="w-11 h-13 object-contain rounded-xl bg-zinc-900 border border-white/10 p-0.5 drop-shadow"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-body text-xs text-on-surface font-bold">{friend.name}</h4>
                        <span className="text-[10px] text-zinc-400">{friend.username}</span>
                      </div>
                      <p className="font-body text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">{friend.activityIcon || 'near_me'}</span>
                        <span>{friend.activityLabel || friend.statusText}</span>
                      </p>
                      <p className="font-body text-[10px] text-on-surface-variant">
                        {liveDist} km dari Anda · {friend.lastUpdated}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingAvatarFriend(friend)
                      }}
                      className="p-2 rounded-full glass-panel hover:bg-white/10 text-on-surface-variant hover:text-emerald-400 transition-colors"
                      title="Ganti Karakter 3D"
                    >
                      <span className="material-symbols-outlined text-[18px]">style</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate('/chat/' + friend.id, { state: { friend } })
                      }}
                      className="p-2 rounded-full glass-panel hover:bg-emerald-600 hover:text-white text-emerald-400 transition-all"
                      title="Chat"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                    </button>
                  </div>
                </motion.div>
              )
            })
          ) : (
            <div className="glass-panel empty-card-panel rounded-3xl p-6 sm:p-8 text-center border border-white/10 space-y-4 mx-auto my-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                <span className="material-symbols-outlined text-[30px]">person_add</span>
              </div>
              <div className="space-y-1.5 w-full text-center">
                <h4 className="empty-state-title font-display font-bold text-white text-base">
                  Belum Ada Teman di Sekitar
                </h4>
                <p className="empty-state-desc font-body text-xs sm:text-sm text-on-surface-variant">
                  Belum ada teman di ADLD Maps. Tambahkan teman untuk melihat live location & avatar 3D mereka!
                </p>
              </div>
              <div className="pt-2 flex justify-center w-full">
                <button
                  onClick={() => navigate('/friends')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs font-bold shadow-lg active:scale-95 transition-all inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  <span>Buka Daftar Teman</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 16 3D MALE AVATAR SELECTOR MODAL */}
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
              className="glass-panel modal-card rounded-3xl p-6 space-y-4 border border-white/15 shadow-2xl max-h-[85vh] flex flex-col backdrop-blur-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div>
                  <h3 className="font-display text-base text-on-surface font-extrabold">Pilih Karakter 3D Pria</h3>
                  <p className="font-body text-xs text-on-surface-variant">
                    Pilih 1 dari 16 karakter 3D keren untuk {editingAvatarFriend.name}
                  </p>
                </div>
                <button
                  onClick={() => setEditingAvatarFriend(null)}
                  className="text-on-surface-variant hover:text-on-surface"
                >
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

      {/* LOCATION PRIVACY MODAL */}
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
              className="glass-panel modal-card rounded-3xl p-6 space-y-4 border border-white/15 shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="font-display text-base text-on-surface font-extrabold">Privasi Visibilitas Lokasi</h3>
                <button
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-2.5">
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
                    <p className="font-body text-xs font-bold">Ghost Mode (Senyap)</p>
                    <p className="font-body text-[11px] text-on-surface-variant/80 mt-0.5">
                      Lokasi Anda tersembunyi sepenuhnya. Tidak ada teman yang bisa melihat titik Anda.
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
                    <p className="font-body text-xs font-bold">Semua Teman (Public)</p>
                    <p className="font-body text-[11px] text-on-surface-variant/80 mt-0.5">
                      Semua teman yang terhubung dapat melihat avatar dan lokasi live Anda di peta.
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
                    <p className="font-body text-xs font-bold">Teman Pilihan Saja</p>
                    <p className="font-body text-[11px] text-on-surface-variant/80 mt-0.5">
                      Hanya teman-teman tertentu yang Anda izinkan yang dapat memantau lokasi Anda.
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIVE LOCATION SHARE MODAL */}
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
              className="glass-panel modal-card rounded-3xl p-6 space-y-4 border border-white/15 shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="font-display text-base text-on-surface font-extrabold">Bagikan Lokasi Live</h3>
                <button
                  onClick={() => setIsLiveSharingOpen(false)}
                  className="text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <p className="font-body text-xs text-on-surface-variant">
                Pilih durasi waktu untuk membagikan posisi real-time Anda ke teman:
              </p>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => handleStartLiveLocation(15)}
                  className="p-3.5 rounded-2xl bg-zinc-800 hover:bg-emerald-600 hover:text-white text-on-surface font-bold text-xs text-center transition-all shadow-md"
                >
                  15 Menit
                </button>
                <button
                  onClick={() => handleStartLiveLocation(60)}
                  className="p-3.5 rounded-2xl bg-zinc-800 hover:bg-emerald-600 hover:text-white text-on-surface font-bold text-xs text-center transition-all shadow-md"
                >
                  1 Jam
                </button>
                <button
                  onClick={() => handleStartLiveLocation(480)}
                  className="p-3.5 rounded-2xl bg-zinc-800 hover:bg-emerald-600 hover:text-white text-on-surface font-bold text-xs text-center transition-all shadow-md"
                >
                  8 Jam
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
