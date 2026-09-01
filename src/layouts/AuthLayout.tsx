import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#09090b] text-on-surface flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden select-none">
      {/* Ambient Background Radial Blur Blobs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] rounded-full bg-indigo-500/10 blur-[160px] pointer-events-none" />

      {/* Main Centered Content Container */}
      <div className="w-full max-w-[460px] relative z-10 my-auto">
        <Outlet />
      </div>

      {/* Clean Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-center text-xs text-on-surface-variant font-medium space-y-1.5 z-10"
      >
        <p>© 2026 ADLD Chats Web · All rights reserved.</p>
        <div className="flex justify-center gap-4 text-on-surface-variant/70">
          <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
          <span>·</span>
          <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
          <span>·</span>
          <span className="hover:text-white cursor-pointer transition-colors">Security</span>
        </div>
      </motion.div>
    </div>
  )
}
