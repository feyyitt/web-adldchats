import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AccessRequest {
  userId: string
  username: string
  displayName: string
  requestedAt: string
}

interface CatalogAccessState {
  approvedUserIds: string[]
  pendingRequests: AccessRequest[]
  requestAccess: (user: { id: string; username: string; displayName: string }) => void
  approveAccess: (userId: string) => void
  revokeAccess: (userId: string) => void
  isApproved: (userIdOrUsername: string) => boolean
  hasPendingRequest: (userIdOrUsername: string) => boolean
}

export const useCatalogAccessStore = create<CatalogAccessState>()(
  persist(
    (set, get) => ({
      // Main admin Faith and admin are pre-approved by default
      approvedUserIds: ['faith', 'admin', '00000000-0000-0000-0000-000000000001'],
      pendingRequests: [],

      requestAccess: (user) => {
        const { pendingRequests, approvedUserIds } = get()
        if (approvedUserIds.includes(user.id) || approvedUserIds.includes(user.username.toLowerCase())) {
          return
        }

        const existing = pendingRequests.find(
          (r) => r.userId === user.id || r.username.toLowerCase() === user.username.toLowerCase()
        )

        if (!existing) {
          const newReq: AccessRequest = {
            userId: user.id,
            username: user.username,
            displayName: user.displayName,
            requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
          set({ pendingRequests: [...pendingRequests, newReq] })
        }
      },

      approveAccess: (userId) => {
        const { approvedUserIds, pendingRequests } = get()
        if (!approvedUserIds.includes(userId)) {
          set({
            approvedUserIds: [...approvedUserIds, userId],
            pendingRequests: pendingRequests.filter((r) => r.userId !== userId && r.username !== userId),
          })
        }
      },

      revokeAccess: (userId) => {
        const { approvedUserIds } = get()
        set({
          approvedUserIds: approvedUserIds.filter((id) => id !== userId && id !== userId.toLowerCase()),
        })
      },

      isApproved: (userIdOrUsername) => {
        if (!userIdOrUsername) return false
        const key = userIdOrUsername.toLowerCase()
        // Faith / Admin is always approved
        if (key === 'faith' || key === 'admin') return true
        return get().approvedUserIds.some((id) => id.toLowerCase() === key)
      },

      hasPendingRequest: (userIdOrUsername) => {
        if (!userIdOrUsername) return false
        const key = userIdOrUsername.toLowerCase()
        return get().pendingRequests.some(
          (r) => r.userId.toLowerCase() === key || r.username.toLowerCase() === key
        )
      },
    }),
    {
      name: 'adld-catalog-permissions',
    }
  )
)
