import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

interface FriendItem {
  id: string
  name: string
  username: string
  status: 'Online' | 'Offline'
  streak: number
  avatarUrl?: string
}

interface PendingItem {
  id: string
  name: string
  username: string
}

export default function FriendsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'add'>('all')
  const [friends, setFriends] = useState<FriendItem[]>(() => {
    const saved = localStorage.getItem('adld_friends')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return []
  })

  const [pendingRequests, setPendingRequests] = useState<PendingItem[]>(() => {
    const saved = localStorage.getItem('adld_pending_friends')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return []
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [addUsername, setAddUsername] = useState('')
  const [addSuccess, setAddSuccess] = useState(false)

  useEffect(() => {
    localStorage.setItem('adld_friends', JSON.stringify(friends))
  }, [friends])

  useEffect(() => {
    localStorage.setItem('adld_pending_friends', JSON.stringify(pendingRequests))
  }, [pendingRequests])

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAccept = (id: string, name: string, username: string) => {
    setPendingRequests((prev) => prev.filter((p) => p.id !== id))
    setFriends((prev) => [
      ...prev,
      { id, name, username, status: 'Online', streak: 1, avatarUrl: '/avatars/male_1_clean.png' },
    ])
  }

  const handleReject = (id: string) => {
    setPendingRequests((prev) => prev.filter((p) => p.id !== id))
  }

  const handleRemoveFriend = (id: string, name: string) => {
    if (window.confirm(`Hapus ${name} dari daftar teman?`)) {
      setFriends((prev) => prev.filter((f) => f.id !== id))
    }
  }

  const handleAddFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!addUsername.trim()) return

    const cleanUser = addUsername.replace('@', '').trim()
    const capName = cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1)
    const newFriend: FriendItem = {
      id: `fr_${Date.now()}`,
      name: capName,
      username: `@${cleanUser.toLowerCase()}`,
      status: 'Online',
      streak: 1,
      avatarUrl: `/avatars/male_${(friends.length % 16) + 1}_clean.png`,
    }

    setFriends((prev) => [...prev, newFriend])
    setAddSuccess(true)
    setTimeout(() => {
      setAddSuccess(false)
      setAddUsername('')
      setActiveTab('all')
    }, 1000)
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1200px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-display-lg-mobile md:text-display-lg text-on-surface tracking-tight font-bold">
            {t('nav.friends')}
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant mt-1">
            Terhubung dan kelola daftar teman Anda di ADLD Chats Web
          </p>
        </div>

        <button
          onClick={() => setActiveTab('add')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-display text-label-md px-6 py-3 rounded-2xl shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 self-start md:self-auto active:scale-95 btn-shimmer"
        >
          <span className="material-symbols-outlined">person_add</span>
          Tambah Teman
        </button>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Tab Buttons */}
        <div className="flex gap-1 bg-surface-container-highest p-1 rounded-2xl border border-white/5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2 rounded-xl font-body text-label-sm transition-all ${
              activeTab === 'all'
                ? 'bg-surface-container-lowest text-emerald-400 border border-white/10 shadow-md font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Semua Teman ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-5 py-2 rounded-xl font-body text-label-sm transition-all relative ${
              activeTab === 'pending'
                ? 'bg-surface-container-lowest text-emerald-400 border border-white/10 shadow-md font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Permintaan ({pendingRequests.length})
            {pendingRequests.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-5 py-2 rounded-xl font-body text-label-sm transition-all ${
              activeTab === 'add'
                ? 'bg-surface-container-lowest text-emerald-400 border border-white/10 shadow-md font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Tambah Baru
          </button>
        </div>

        {/* Search */}
        {activeTab === 'all' && friends.length > 0 && (
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari teman..."
              className="w-full bg-surface-container-highest border border-white/10 text-on-surface font-body text-body-md rounded-full pl-10 pr-4 py-2 focus:outline-none input-glow transition-all placeholder:text-on-surface-variant/50"
            />
          </div>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'all' && (
        <>
          {filteredFriends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="glass-panel rounded-2xl p-5 flex items-center gap-4 hover:bg-surface-container-high/40 transition-all group border border-white/10"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center border border-white/10 overflow-hidden p-1">
                      {friend.avatarUrl ? (
                        <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="material-symbols-outlined text-[28px] text-on-surface-variant">
                          person
                        </span>
                      )}
                    </div>
                    {friend.status === 'Online' && (
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-zinc-950 shadow-md" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-body text-label-md text-on-surface truncate font-bold">
                      {friend.name}
                    </h3>
                    <p className="font-body text-label-sm text-on-surface-variant truncate">
                      {friend.username}
                    </p>
                    {friend.streak > 0 && (
                      <span className="inline-flex items-center gap-1 text-amber-400 text-xs mt-1">
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          local_fire_department
                        </span>
                        <span className="font-bold">{friend.streak} Hari Streak</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => navigate('/chat/' + friend.id, { state: { friend } })}
                      className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all active:scale-95 shadow-md flex items-center justify-center"
                      title="Kirim Pesan"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend.id, friend.name)}
                      className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-red-500/20 text-on-surface-variant hover:text-red-400 border border-white/5 transition-all active:scale-95 flex items-center justify-center"
                      title="Hapus Teman"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full flex items-center justify-center py-8">
              <div className="glass-panel empty-card-panel rounded-3xl p-8 sm:p-10 text-center border border-white/10 space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-[36px]">group</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-lg text-white font-bold">
                    Belum Ada Teman Terhubung
                  </h3>
                  <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                    Mulai jalin percakapan dengan menambahkan teman baru melalui username.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('add')}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md active:scale-95 inline-flex items-center gap-2 mx-auto"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  <span>Tambah Teman Pertama</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'pending' && (
        <>
          {pendingRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="glass-panel rounded-2xl p-5 flex items-center justify-between gap-4 border border-white/10"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center border border-white/10">
                      <span className="material-symbols-outlined text-[24px] text-on-surface-variant">
                        person
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-body text-label-md text-on-surface truncate font-bold">
                        {req.name}
                      </h3>
                      <p className="font-body text-label-sm text-on-surface-variant truncate">
                        {req.username}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAccept(req.id, req.name, req.username)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-body text-xs font-bold hover:bg-emerald-500 transition-all flex items-center gap-1 active:scale-95 shadow-md"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      Terima
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="p-1.5 rounded-lg glass-panel text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full flex items-center justify-center py-8">
              <div className="glass-panel empty-card-panel rounded-3xl p-8 sm:p-10 text-center border border-white/10 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 text-on-surface-variant/50 flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-[36px]">mark_email_read</span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-display font-bold text-white text-base">Tidak Ada Permintaan Pertemanan</h4>
                  <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    Saat ada teman yang mengirimi Anda permintaan pertemanan baru, akan muncul di sini.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'add' && (
        <div className="w-full flex items-center justify-center py-6">
          <div className="glass-panel empty-card-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-white/10 shadow-2xl">
            <div className="space-y-1.5 text-center sm:text-left">
              <h2 className="font-display text-headline-sm text-on-surface font-bold">
                Tambah Teman Baru
              </h2>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Ketik username teman untuk langsung terhubung dan mulai berinteraksi.
              </p>
            </div>

            <form onSubmit={handleAddFriendSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-xs font-semibold text-on-surface mb-2">
                  Username Teman
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                    alternate_email
                  </span>
                  <input
                    type="text"
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value)}
                    placeholder="contoh: budi_santoso"
                    className="w-full bg-zinc-900 border border-white/10 text-on-surface font-body text-sm rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>

              {addSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Teman @{addUsername} berhasil ditambahkan!
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs font-bold py-3.5 rounded-xl shadow-lg transition-all uppercase tracking-wider active:scale-95 btn-shimmer"
              >
                Kirim & Tambahkan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
