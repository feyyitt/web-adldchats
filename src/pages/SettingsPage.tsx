import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useLogoutStore } from '@/stores/logoutStore'
import ChangePasswordModal from '@/components/auth/ChangePasswordModal'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, profile, setProfile, logout } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const openLogoutConfirm = useLogoutStore((state) => state.openConfirm)

  const [ghostMode, setGhostMode] = useState(false)
  const [notifications, setNotifications] = useState(true)

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isChangePassOpen, setIsChangePassOpen] = useState(false)

  // Edit profile form
  const [editName, setEditName] = useState(() => profile?.display_name || user?.user_metadata?.display_name || 'Faith')
  const [editUsername, setEditUsername] = useState(() => profile?.username || user?.user_metadata?.username || 'faith')
  const [editBio, setEditBio] = useState(() => profile?.bio || 'Digital explorer | Neon nights | Always online. 🌌')

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value
    i18n.changeLanguage(lang)
    localStorage.setItem('adld-language', lang)
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (profile) {
      setProfile({
        ...profile,
        display_name: editName,
        username: editUsername,
        bio: editBio,
      })
    }
    setIsEditProfileOpen(false)
  }

  const handleDeleteAccount = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1200px] mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="md:hidden p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="font-display text-display-lg-mobile md:text-display-lg text-on-surface tracking-tight">
            {t('settings.title')}
          </h1>
          <p className="font-body text-body-md text-on-surface-variant mt-1">
            {t('settings.description')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Account, Privacy, Notifications */}
        <div className="lg:col-span-8 space-y-6">
          {/* Account Section */}
          <section className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <span className="material-symbols-outlined text-primary-fixed-dim p-2 bg-primary-container/10 rounded-lg">
                manage_accounts
              </span>
              <h2 className="font-display text-headline-md text-on-surface">
                {t('settings.account')}
              </h2>
            </div>

            <div
              onClick={() => setIsEditProfileOpen(true)}
              className="flex items-center justify-between py-2 group cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div>
                <p className="font-body text-label-md text-on-surface">
                  {t('settings.personalInfo')}
                </p>
                <p className="font-body text-label-sm text-on-surface-variant mt-0.5">
                  {t('settings.personalInfoDesc')}
                </p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-fixed transition-colors">
                chevron_right
              </span>
            </div>

            {/* Change Password Trigger */}
            <div
              onClick={() => setIsChangePassOpen(true)}
              className="flex items-center justify-between py-2 group cursor-pointer hover:opacity-80 transition-opacity border-t border-white/5 pt-3"
            >
              <div>
                <p className="font-body text-label-md text-on-surface flex items-center gap-2">
                  <span>Ganti Kata Sandi</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                    Keamanan
                  </span>
                </p>
                <p className="font-body text-label-sm text-on-surface-variant mt-0.5">
                  Perbarui kata sandi akun ADLD Chats Anda kapan saja
                </p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-emerald-400 transition-colors">
                lock_reset
              </span>
            </div>

            <div className="flex items-center justify-between py-2 group cursor-pointer hover:opacity-80 transition-opacity border-t border-white/5 pt-3">
              <div>
                <p className="font-body text-label-md text-on-surface">
                  {t('settings.linkedAccounts')}
                </p>
                <p className="font-body text-label-sm text-on-surface-variant mt-0.5">
                  {t('settings.linkedAccountsDesc')}
                </p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-fixed transition-colors">
                chevron_right
              </span>
            </div>
          </section>

          {/* Privacy & Security */}
          <section className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <span className="material-symbols-outlined text-secondary-container p-2 bg-secondary-container/10 rounded-lg">
                security
              </span>
              <h2 className="font-display text-headline-md text-on-surface">
                {t('settings.privacy')}
              </h2>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-body text-label-md text-on-surface flex items-center gap-2">
                  {t('settings.ghostMode')}
                  <span className="px-2 py-0.5 rounded-full border border-secondary-container text-secondary-container text-[10px] uppercase tracking-wider font-bold bg-secondary-container/10">
                    {t('settings.beta')}
                  </span>
                </p>
                <p className="font-body text-label-sm text-on-surface-variant mt-0.5">
                  {t('settings.ghostModeDesc')}
                </p>
              </div>
              <button
                onClick={() => setGhostMode(!ghostMode)}
                className={`toggle-switch ${ghostMode ? 'active' : ''}`}
                aria-label="Ghost Mode"
              />
            </div>
            <div className="flex items-center justify-between py-2 group cursor-pointer border-t border-white/5 pt-3">
              <div>
                <p className="font-body text-label-md text-on-surface">
                  {t('settings.blockedContacts')}
                </p>
                <p className="font-body text-label-sm text-on-surface-variant mt-0.5">
                  {t('settings.blockedContactsDesc')}
                </p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-fixed transition-colors">
                chevron_right
              </span>
            </div>
          </section>

          {/* Notifications */}
          <section className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <span className="material-symbols-outlined text-primary-fixed p-2 bg-primary-container/10 rounded-lg">
                notifications_active
              </span>
              <h2 className="font-display text-headline-md text-on-surface">
                {t('settings.notifications')}
              </h2>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-body text-label-md text-on-surface">
                  {t('settings.pushNotifications')}
                </p>
                <p className="font-body text-label-sm text-on-surface-variant mt-0.5">
                  {t('settings.pushNotificationsDesc')}
                </p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`toggle-switch ${notifications ? 'active' : ''}`}
                aria-label="Push Notifications"
              />
            </div>
          </section>
        </div>

        {/* Right Column: Preferences & Danger Zone */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Preferences Card */}
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <h3 className="font-body text-label-md text-on-surface-variant uppercase tracking-widest">
              {t('settings.preferences')}
            </h3>

            {/* Appearance */}
            <div className="space-y-2">
              <label className="font-body text-label-md text-on-surface">
                {t('settings.appearance')}
              </label>
              <div className="grid grid-cols-2 gap-2 bg-surface-container-highest p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setTheme('light')}
                  className={`py-2 rounded-lg font-body text-label-md flex items-center justify-center gap-2 transition-all ${
                    theme === 'light'
                      ? 'bg-surface-container-lowest text-primary-fixed border border-white/10'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">light_mode</span>
                  {t('settings.light')}
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`py-2 rounded-lg font-body text-label-md flex items-center justify-center gap-2 transition-all ${
                    theme === 'dark'
                      ? 'bg-surface-container-lowest text-primary-fixed border border-white/10'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">dark_mode</span>
                  {t('settings.dark')}
                </button>
              </div>
            </div>

            <div className="h-px bg-white/10" />

            {/* Language */}
            <div className="space-y-2">
              <label className="font-body text-label-md text-on-surface">
                {t('settings.language')}
              </label>
              <div className="relative">
                <select
                  value={i18n.language}
                  onChange={handleLanguageChange}
                  className="w-full bg-surface-container-highest border border-white/10 text-on-surface font-body text-body-md rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-primary-fixed transition-colors cursor-pointer"
                >
                  <option value="en" className="bg-surface-container-high text-on-surface">English</option>
                  <option value="id" className="bg-surface-container-high text-on-surface">Bahasa Indonesia</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass-panel border-error/20 bg-error-container/5 rounded-2xl p-6 mt-auto space-y-3">
            <h3 className="font-body text-label-md text-error mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined">warning</span>
              {t('settings.dangerZone')}
            </h3>
            <button
              onClick={openLogoutConfirm}
              className="w-full py-3 rounded-xl bg-error-container/20 border border-error/30 text-error font-body text-label-md hover:bg-error-container/40 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Sign Out / Logout
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full py-3 rounded-xl border border-error/30 text-error font-body text-label-md hover:bg-error/10 transition-colors"
            >
              {t('settings.deleteAccount')}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel modal-card rounded-3xl p-6 space-y-4 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-display text-headline-md text-on-surface">Personal Information</h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block font-body text-label-md text-on-surface mb-1">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-surface-container-highest border border-white/10 text-on-surface font-body text-body-md rounded-xl p-3 focus:outline-none input-glow"
                  required
                />
              </div>

              <div>
                <label className="block font-body text-label-md text-on-surface mb-1">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-surface-container-highest border border-white/10 text-on-surface font-body text-body-md rounded-xl p-3 focus:outline-none input-glow"
                  required
                />
              </div>

              <div>
                <label className="block font-body text-label-md text-on-surface mb-1">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-container-highest border border-white/10 text-on-surface font-body text-body-md rounded-xl p-3 focus:outline-none input-glow"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-lg glass-panel text-on-surface-variant hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-primary-container text-on-primary-container font-display text-label-md neon-glow-primary hover:brightness-110"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel modal-card border-error/30 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-display text-headline-md text-error flex items-center gap-2">
              <span className="material-symbols-outlined">warning</span>
              Delete Account?
            </h3>
            <p className="font-body text-body-md text-on-surface-variant">
              This action is permanent and will wipe all your messages, streaks, and memories.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg glass-panel text-on-surface-variant hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-6 py-2 rounded-lg bg-error text-on-error font-display text-label-md hover:brightness-110"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
      />
    </div>
  )
}
