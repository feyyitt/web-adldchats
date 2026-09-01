import { Outlet, Navigate } from 'react-router-dom'
import DesktopSidebar from '@/components/navigation/DesktopSidebar'
import MobileTopHeader from '@/components/navigation/MobileTopHeader'
import MobileBottomNav from '@/components/navigation/MobileBottomNav'
import LogoutModal from '@/components/common/LogoutModal'
import ToastNotification from '@/components/common/ToastNotification'
import { useAuthStore } from '@/stores/authStore'

export default function MainLayout() {
  const isGuest = useAuthStore((state) => state.isGuest)

  // Strict Security Protection: Guests cannot access internal private app routes
  if (isGuest) {
    return <Navigate to="/catalog" replace />
  }

  return (
    <div className="min-h-screen bg-background text-on-background font-body flex">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Mobile Header */}
      <MobileTopHeader />

      {/* Main Content */}
      <main className="flex-1 w-full md:ml-64 pt-[72px] md:pt-0 pb-20 md:pb-0 min-h-screen">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />

      {/* Logout Confirmation & Transition Animation Overlay */}
      <LogoutModal />

      {/* Floating Toast Notification Banners */}
      <ToastNotification />
    </div>
  )
}
