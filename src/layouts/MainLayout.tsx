import { Outlet, Navigate } from 'react-router-dom'
import DesktopSidebar from '@/components/navigation/DesktopSidebar'
import MobileTopHeader from '@/components/navigation/MobileTopHeader'
import MobileBottomNav from '@/components/navigation/MobileBottomNav'
import LogoutModal from '@/components/common/LogoutModal'
import ToastNotification from '@/components/common/ToastNotification'
import { useAuthStore } from '@/stores/authStore'

export default function MainLayout() {
  const { user, isGuest } = useAuthStore()

  // Protect private application routes: unauthenticated visitors must log in
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Strict Security Protection: Guests cannot access internal private app routes
  if (isGuest) {
    return <Navigate to="/catalog" replace />
  }

  return (
    <div className="min-h-screen bg-background text-on-background font-body relative">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Mobile Header */}
      <MobileTopHeader />

      {/* Main Content */}
      <main className="w-full md:pl-64 pt-14 md:pt-0 pb-16 md:pb-0 min-h-screen">
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
