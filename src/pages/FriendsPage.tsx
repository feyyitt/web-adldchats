import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { realtimeSync } from '@/services/realtimeSync'
import { soundService } from '@/services/soundService'

export interface FriendItem {
  id: string
  name: string
  username: string
  status: 'Online' | 'Offline'
  streak: number
  avatarUrl?: string
}

export interface PendingItem {
  id: string
  name: string
  username: string
  avatarUrl?: string
  requesterId: string
}

// Shared storage helpers for cross-account mutual friends
function getSharedFriendRequests(): any[] {
  try {
    const saved = localStorage.getItem('adld_shared_friend_requests')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveSharedFriendRequests(requests: any[]) {
  try {
    localStorage.setItem('adld_shared_friend_requests', JSON.stringify(requests))
  } catch {}
}

function getUserFriends(username: string): FriendItem[] {
  try {
    const cleanUser = username.toLowerCase().replace('@', '')
    const userSpecific = localStorage.getItem(`adld_friends_${cleanUser}`)
    if (userSpecific) return JSON.parse(userSpecific)
    const fallback = localStorage.getItem('adld_friends')
    if (fallback) return JSON.parse(fallback)
  } catch {}
  return []
}

function saveUserFriends(username: string, friends: FriendItem[]) {
  try {
    const cleanUser = username.toLowerCase().replace('@', '')
    localStorage.setItem(`adld_friends_${cleanUser}`, JSON.stringify(friends))
    localStorage.setItem('adld_friends', JSON.stringify(friends))
  } catch {}
}

export default function FriendsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()

  const currentUsername = (profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'faith').toLowerCase()
  const currentDisplayName = profile?.display_name || user?.user_metadata?.display_name || 'Faith'
  const currentAvatar = profile?.avatar_url || '/avatars/male_1_clean.png'

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'add'>('all')
  const [friends, setFriends] = useState<FriendItem[]>(() => getUserFriends(currentUsername))

  // Load pending requests sent specifically to this user
  const [pendingRequests, setPendingRequests] = useState<PendingItem[]>(() => {
    const allRequests = getSharedFriendRequests()
    return allRequests
      .filter((r) => r.receiverUsername?.toLowerCase() === currentUsername)
      .map((r) => ({
        id: r.id,
        name: r.requesterName,
        username: r.requesterUsername.startsWith('@') ? r.requesterUsername : `@${r.requesterUsername}`,
        avatarUrl: r.requesterAvatar,
        requesterId: r.requesterId,
      }))
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [addUsername, setAddUsername] = useState('')
  const [addSuccess, setAddSuccess] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)

  // Real-time synchronization for friends and friend requests
  useEffect(() => {
    const unsubscribe = realtimeSync.onFriendUpdate((action, data) => {
      if (action === 'request') {
        // Someone sent a friend request to current user
        if (data?.receiverUsername?.toLowerCase() === currentUsername) {
          setPendingRequests((prev) => {
            if (prev.some((p) => p.id === data.id)) return prev
            soundService.playMessageReceive()
            return [
              {
                id: data.id,
                name: data.requesterName,
                username: data.requesterUsername.startsWith('@') ? data.requesterUsername : `@${data.requesterUsername}`,
                avatarUrl: data.requesterAvatar,
                requesterId: data.requesterId,
              },
              ...prev,
            ]
          })
        }
      } else if (action === 'accepted') {
        // Friend request accepted mutually
        const uA = data?.userA?.username?.toLowerCase()
        const uB = data?.userB?.username?.toLowerCase()

        if (uA === currentUsername || uB === currentUsername) {
          const reloaded = getUserFriends(currentUsername)
          setFriends(reloaded)
          soundService.playStatusSuccess()
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [currentUsername])

  // Sync friends to local storage
  useEffect(() => {
    saveUserFriends(currentUsername, friends)
  }, [friends, currentUsername])

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Accept incoming friend request (MUTUAL FRIENDSHIP)
  const handleAccept = (reqId: string, requesterName: string, requesterUsernameRaw: string) => {
    const cleanRequester = requesterUsernameRaw.replace('@', '').toLowerCase()
    const targetReq = pendingRequests.find((p) => p.id === reqId)
    const avatarUrl = targetReq?.avatarUrl || '/avatars/male_1_clean.png'

    // 1. Add to Current User's Friends
    const newFriendForMe: FriendItem = {
      id: targetReq?.requesterId || `fr_${Date.now()}`,
      name: requesterName,
      username: `@${cleanRequester}`,
      status: 'Online',
      streak: 1,
      avatarUrl,
    }

    const updatedMyFriends = [...friends.filter((f) => f.username.toLowerCase() !== `@${cleanRequester}`), newFriendForMe]
    setFriends(updatedMyFriends)
    saveUserFriends(currentUsername, updatedMyFriends)

    // 2. Add Current User to Requester's Friends (MUTUAL)
    const newFriendForRequester: FriendItem = {
      id: profile?.id || user?.id || `fr_${Date.now()}_me`,
      name: currentDisplayName,
      username: `@${currentUsername}`,
      status: 'Online',
      streak: 1,
      avatarUrl: currentAvatar,
    }
    const requesterExistingFriends = getUserFriends(cleanRequester)
    const updatedRequesterFriends = [
      ...requesterExistingFriends.filter((f) => f.username.toLowerCase() !== `@${currentUsername}`),
      newFriendForRequester,
    ]
    saveUserFriends(cleanRequester, updatedRequesterFriends)

    // 3. Remove from shared pending requests
    const allReqs = getSharedFriendRequests().filter((r) => r.id !== reqId)
    saveSharedFriendRequests(allReqs)
    setPendingRequests((prev) => prev.filter((p) => p.id !== reqId))

    // 4. Broadcast mutual friendship to other tabs/devices
    soundService.playStatusSuccess()
    realtimeSync.broadcastFriendAccepted(
      { username: currentUsername, displayName: currentDisplayName },
      { username: cleanRequester, displayName: requesterName }
    )
  }

  // Reject incoming friend request
  const handleReject = (reqId: string) => {
    const allReqs = getSharedFriendRequests().filter((r) => r.id !== reqId)
    saveSharedFriendRequests(allReqs)
    setPendingRequests((prev) => prev.filter((p) => p.id !== reqId))
  }

  // Remove a friend
  const handleRemoveFriend = (id: string, name: string) => {
    if (window.confirm(`Hapus ${name} dari daftar teman?`)) {
      setFriends((prev) => prev.filter((f) => f.id !== id))
    }
  }

  // Submit add friend
  const handleAddFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAddError(null)
    setAddSuccess(null)

    if (!addUsername.trim()) return

    const cleanTarget = addUsername.replace('@', '').trim().toLowerCase()

    // 1. Cannot add yourself
    if (cleanTarget === currentUsername) {
      setAddError('Anda tidak dapat menambahkan akun Anda sendiri sebagai teman.')
      return
    }

    // 2. Cannot add already added friend
    if (friends.some((f) => f.username.toLowerCase() === `@${cleanTarget}`)) {
      setAddError(`@${cleanTarget} sudah ada di dalam daftar teman Anda.`)
      return
    }

    // 3. Verify target username exists
    let registeredAccounts: any[] = []
    try {
      registeredAccounts = JSON.parse(localStorage.getItem('adld_registered_accounts') || '[]')
    } catch {}

    const targetAccount =
      cleanTarget === 'faith'
        ? { username: 'faith', displayName: 'Faith', avatarUrl: '/avatars/male_1_clean.png', id: 'usr_faith_001' }
        : registeredAccounts.find((acc) => acc.username.toLowerCase() === cleanTarget)

    if (!targetAccount) {
      setAddError(`Pengguna @${cleanTarget} tidak ditemukan. Pastikan username sudah terdaftar.`)
      return
    }

    // 4. Create and dispatch friend request
    const newReqId = `req_${Date.now()}`
    const reqPayload = {
      id: newReqId,
      requesterId: profile?.id || user?.id || `usr_${currentUsername}`,
      requesterName: currentDisplayName,
      requesterUsername: currentUsername,
      requesterAvatar: currentAvatar,
      receiverUsername: cleanTarget,
      createdAt: new Date().toISOString(),
    }

    // Save to shared pending requests
    const allReqs = getSharedFriendRequests()
    allReqs.push(reqPayload)
    saveSharedFriendRequests(allReqs)

    // Broadcast in real-time
    soundService.playMessageSend()
    realtimeSync.sendFriendRequest(reqPayload)

    setAddSuccess(`Permintaan pertemanan berhasil dikirim ke @${cleanTarget}! Menunggu konfirmasi.`)
    setAddUsername('')

    setTimeout(() => {
      setAddSuccess(null)
    }, 4000)
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1200px] mx-auto min-h-screen select-none">
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
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Tambah Teman
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 mb-6 overflow-x-auto pb-1 hide-scrollbar">
        <button
          onClick={() => setActiveTab('all')}
          className={`font-body text-label-md px-5 py-3 transition-colors relative font-bold text-xs sm:text-sm ${
            activeTab === 'all'
              ? 'text-emerald-400 font-bold border-b-2 border-emerald-400'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Semua Teman ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`font-body text-label-md px-5 py-3 transition-colors relative flex items-center gap-2 font-bold text-xs sm:text-sm ${
            activeTab === 'pending'
              ? 'text-emerald-400 font-bold border-b-2 border-emerald-400'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span>Permintaan Masuk</span>
          {pendingRequests.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 font-extrabold text-[11px] flex items-center justify-center animate-pulse">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`font-body text-label-md px-5 py-3 transition-colors relative font-bold text-xs sm:text-sm ${
            activeTab === 'add'
              ? 'text-emerald-400 font-bold border-b-2 border-emerald-400'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Tambah Teman Baru
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'all' && (
        <>
          {/* Search Bar */}
          <div className="mb-6 max-w-md">
            <div className="glass-panel rounded-2xl p-2 flex items-center border border-white/10">
              <span className="material-symbols-outlined text-on-surface-variant ml-2">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama teman atau @username..."
                className="bg-transparent border-none text-on-surface font-body text-body-md focus:outline-none w-full placeholder:text-on-surface-variant/50 ml-2"
              />
            </div>
          </div>

          {/* Friends Grid */}
          {filteredFriends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="glass-panel rounded-3xl p-5 flex items-center justify-between gap-4 border border-white/10 hover:border-emerald-500/40 transition-all shadow-md group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative flex-shrink-0">
                      <img
                        src={friend.avatarUrl || '/avatars/male_1_clean.png'}
                        alt={friend.name}
                        className="w-13 h-15 object-contain rounded-2xl bg-zinc-900 border border-white/10 p-1 drop-shadow"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-950 ${
                          friend.status === 'Online' ? 'bg-emerald-400' : 'bg-zinc-500'
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-body text-sm font-bold text-on-surface truncate group-hover:text-emerald-300 transition-colors">
                        {friend.name}
                      </h3>
                      <p className="font-body text-xs text-emerald-400 font-semibold truncate">
                        {friend.username}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {friend.status}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-[11px] text-zinc-400">🔥 {friend.streak} Streak</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => navigate('/chat/' + friend.id, { state: { friend } })}
                      className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all shadow-md"
                      title="Buka Chat"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend.id, friend.name)}
                      className="p-2.5 rounded-xl hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
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
              <div className="glass-panel empty-card-panel rounded-3xl p-8 sm:p-10 text-center border border-white/10 space-y-4 max-w-md w-full">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 text-on-surface-variant/40 flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-[36px]">group</span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-base font-bold text-white">Belum Ada Teman Terhubung</h3>
                  <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                    Mulai jalin percakapan dengan menambahkan teman baru melalui username.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('add')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 inline-flex items-center gap-2 mx-auto"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  <span>Tambah Teman Pertama</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pending Requests Tab */}
      {activeTab === 'pending' && (
        <>
          {pendingRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="glass-panel rounded-3xl p-5 flex items-center justify-between gap-4 border border-emerald-500/30 shadow-xl"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={req.avatarUrl || '/avatars/male_1_clean.png'}
                      alt={req.name}
                      className="w-12 h-14 object-contain rounded-2xl bg-zinc-900 border border-white/10 p-1 drop-shadow flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-body text-sm font-bold text-on-surface truncate">{req.name}</h3>
                      <p className="font-body text-xs text-emerald-400 font-semibold truncate">{req.username}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Ingin berteman dengan Anda</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAccept(req.id, req.name, req.username)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-body text-xs font-bold hover:bg-emerald-500 transition-all flex items-center gap-1.5 active:scale-95 shadow-md"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      Terima
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="p-2 rounded-xl glass-panel text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-95"
                      title="Tolak"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full flex items-center justify-center py-8">
              <div className="glass-panel empty-card-panel rounded-3xl p-8 sm:p-10 text-center border border-white/10 space-y-4 max-w-md w-full">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 text-on-surface-variant/50 flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-[36px]">mark_email_read</span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-display font-bold text-white text-base">Tidak Ada Permintaan Pertemanan</h4>
                  <p className="font-body text-xs text-on-surface-variant">
                    Saat ada teman yang mengirimi Anda permintaan pertemanan baru, akan muncul di sini.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Friend Tab */}
      {activeTab === 'add' && (
        <div className="w-full flex items-center justify-center py-6">
          <div className="glass-panel empty-card-panel rounded-3xl p-6 sm:p-8 space-y-5 border border-white/15 shadow-2xl max-w-md w-full">
            <div className="space-y-1.5 text-center sm:text-left">
              <h2 className="font-display text-lg text-on-surface font-extrabold">Tambah Teman Baru</h2>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                Ketik username akun yang sudah terdaftar untuk mengirimkan permintaan pertemanan.
              </p>
            </div>

            {addError && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                {addError}
              </div>
            )}

            {addSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                {addSuccess}
              </div>
            )}

            <form onSubmit={handleAddFriendSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-xs font-semibold text-on-surface mb-2">
                  Username Teman
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 text-[18px]">
                    alternate_email
                  </span>
                  <input
                    type="text"
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value)}
                    placeholder="contoh: faith atau budi_santoso"
                    className="w-full bg-zinc-900 border border-white/10 text-on-surface font-body text-xs rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-600"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs font-bold py-3.5 rounded-2xl shadow-lg transition-all uppercase tracking-wider active:scale-95 btn-shimmer"
              >
                Kirim Permintaan Pertemanan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
