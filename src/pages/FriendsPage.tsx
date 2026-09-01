import { useState } from 'react'
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

const INITIAL_FRIENDS: FriendItem[] = [
  { id: '1', name: 'Kael Mercer', username: '@kael_m', status: 'Online', streak: 12, avatarUrl: '/avatars/male_1_clean.png' },
  { id: '2', name: 'Marcus Vance', username: '@marcust', status: 'Online', streak: 24, avatarUrl: '/avatars/male_2_clean.png' },
  { id: '3', name: 'Alex Ravel', username: '@alex_r', status: 'Online', streak: 8, avatarUrl: '/avatars/male_3_clean.png' },
  { id: '4', name: 'David Kim', username: '@davidk', status: 'Offline', streak: 5, avatarUrl: '/avatars/male_4_clean.png' },
]

const INITIAL_PENDING = [
  { id: 'p1', name: 'Nico Ryan', username: '@nico_r' },
  { id: 'p2', name: 'Daniel Park', username: '@dpark' },
]

export default function FriendsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'add'>('all')
  const [friends, setFriends] = useState<FriendItem[]>(INITIAL_FRIENDS)
  const [pendingRequests, setPendingRequests] = useState(INITIAL_PENDING)
  const [searchQuery, setSearchQuery] = useState('')
  const [addUsername, setAddUsername] = useState('')
  const [addSuccess, setAddSuccess] = useState(false)

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAccept = (id: string, name: string, username: string) => {
    setPendingRequests((prev) => prev.filter((p) => p.id !== id))
    setFriends((prev) => [
      ...prev,
      { id, name, username, status: 'Online', streak: 1 },
    ])
  }

  const handleReject = (id: string) => {
    setPendingRequests((prev) => prev.filter((p) => p.id !== id))
  }

  const handleAddFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!addUsername.trim()) return
    setAddSuccess(true)
    setTimeout(() => {
      setAddSuccess(false)
      setAddUsername('')
    }, 2000)
  }

  return (
    <div className="px-[20px] md:px-[40px] py-6 md:py-8 max-w-[1200px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-display-lg-mobile md:text-display-lg text-on-surface tracking-tight">
            {t('nav.friends')}
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant mt-1">
            Connect and sync with your close circle
          </p>
        </div>

        <button
          onClick={() => setActiveTab('add')}
          className="bg-primary-container text-on-primary-container font-display text-label-md px-6 py-3 rounded-lg neon-glow-primary hover:brightness-110 transition-all flex items-center justify-center gap-2 self-start md:self-auto active:scale-95"
        >
          <span className="material-symbols-outlined">person_add</span>
          Add Friend
        </button>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Tab Buttons */}
        <div className="flex gap-2 bg-surface-container-highest p-1 rounded-xl border border-white/5 w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2 rounded-lg font-body text-label-sm transition-all ${
              activeTab === 'all'
                ? 'bg-surface-container-lowest text-primary-fixed border border-white/10 shadow-md'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-5 py-2 rounded-lg font-body text-label-sm transition-all relative ${
              activeTab === 'pending'
                ? 'bg-surface-container-lowest text-primary-fixed border border-white/10 shadow-md'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Pending ({pendingRequests.length})
            {pendingRequests.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-5 py-2 rounded-lg font-body text-label-sm transition-all ${
              activeTab === 'add'
                ? 'bg-surface-container-lowest text-primary-fixed border border-white/10 shadow-md'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Add New
          </button>
        </div>

        {/* Search */}
        {activeTab === 'all' && (
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="w-full bg-surface-container-highest border border-white/10 text-on-surface font-body text-body-md rounded-full pl-10 pr-4 py-2 focus:outline-none input-glow transition-all placeholder:text-on-surface-variant/50"
            />
          </div>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="glass-panel rounded-2xl p-5 flex items-center gap-4 hover:bg-surface-container-high/40 transition-all group"
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
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-primary-container rounded-full border-2 border-surface-container-lowest neon-glow-primary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-body text-label-md text-on-surface truncate">
                    {friend.name}
                  </h3>
                  <p className="font-body text-label-sm text-on-surface-variant truncate">
                    {friend.username}
                  </p>
                  {friend.streak > 0 && (
                    <span className="inline-flex items-center gap-1 text-secondary-container text-xs mt-1">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        local_fire_department
                      </span>
                      <span className="font-bold">{friend.streak} Day Streak</span>
                    </span>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate('/chat')}
                    className="p-2.5 rounded-full bg-primary-container text-on-primary-container hover:brightness-110 transition-all active:scale-95 neon-glow-primary"
                    title="Send Message"
                  >
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-2">
                group_off
              </span>
              <p className="font-body text-body-lg text-on-surface-variant">
                No friends found matching "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((req) => (
              <div
                key={req.id}
                className="glass-panel rounded-2xl p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center border border-white/10">
                    <span className="material-symbols-outlined text-[24px] text-on-surface-variant">
                      person
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-body text-label-md text-on-surface truncate">
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
                    className="p-2 rounded-lg bg-primary-container text-on-primary-container font-body text-label-sm neon-glow-primary hover:brightness-110 transition-all flex items-center gap-1 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="p-2 rounded-lg glass-panel text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-2">
                mark_email_read
              </span>
              <p className="font-body text-body-lg text-on-surface-variant">
                No pending friend requests
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'add' && (
        <div className="w-full max-w-md glass-panel modal-card rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="font-display text-headline-md text-on-surface">
            Send Friend Request
          </h2>
          <p className="font-body text-body-md text-on-surface-variant">
            Type your friend's username to connect and start sharing memories.
          </p>

          <form onSubmit={handleAddFriendSubmit} className="space-y-4">
            <div>
              <label className="block font-body text-label-md text-on-surface mb-2">
                Username
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  alternate_email
                </span>
                <input
                  type="text"
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  placeholder="e.g. alex_mercer"
                  className="w-full bg-surface-container-highest border border-white/10 text-on-surface font-body text-body-md rounded-xl pl-10 pr-4 py-3 focus:outline-none input-glow transition-all"
                  required
                />
              </div>
            </div>

            {addSuccess && (
              <div className="p-3 rounded-xl bg-primary-container/20 border border-primary-container/50 text-primary-fixed text-body-md text-center flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">check_circle</span>
                Friend request sent to @{addUsername}!
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary-container text-on-primary-container font-display text-label-md py-3 rounded-lg neon-glow-primary hover:brightness-110 transition-all uppercase tracking-wider active:scale-95"
            >
              Send Request
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
