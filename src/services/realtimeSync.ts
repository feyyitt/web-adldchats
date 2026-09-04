import { supabase } from '@/lib/supabase'

export const CURRENT_TAB_ID =
  typeof window !== 'undefined'
    ? (() => {
        let tabId = sessionStorage.getItem('adld_client_tab_id')
        if (!tabId) {
          tabId = 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now()
          sessionStorage.setItem('adld_client_tab_id', tabId)
        }
        return tabId
      })()
    : 'server_tab'

export interface RealtimeChatMessage {
  id: string
  conversationId: string
  fromUserId: string
  fromUserName: string
  fromUsername?: string
  toUserId: string
  toUserName?: string
  text: string
  time: string
  status?: 'sent' | 'delivered' | 'read'
  senderTabId?: string
  type: 'text' | 'image' | 'voice' | 'location' | 'file' | 'invoice'
  mediaUrl?: string
  audioUrl?: string
  audioDuration?: number
  isViewOnce?: boolean
  invoice?: any
  fileName?: string
}

export interface MessageStatusReceipt {
  messageId?: string
  messageIds?: string[]
  conversationId: string
  fromUserId: string
  toUserId: string
  status: 'delivered' | 'read'
  senderTabId?: string
}

export interface FriendRequestPayload {
  id: string
  requesterId: string
  requesterName: string
  requesterUsername: string
  requesterAvatar: string
  receiverUsername: string
  createdAt: string
}

type MessageCallback = (msg: RealtimeChatMessage) => void
type StatusCallback = (receipt: MessageStatusReceipt) => void
type FriendCallback = (action: 'request' | 'accepted' | 'rejected', data: any) => void

class RealtimeSyncManager {
  private broadcastChannel: BroadcastChannel | null = null
  private supabaseChannel: any = null
  private messageListeners: Set<MessageCallback> = new Set()
  private statusListeners: Set<StatusCallback> = new Set()
  private friendListeners: Set<FriendCallback> = new Set()

  constructor() {
    this.initBroadcastChannel()
    this.initSupabaseChannel()
    this.initStorageListener()
  }

  // 1. Local Browser BroadcastChannel (Instant cross-tab/window 0ms)
  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('adld_realtime_network')
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingEvent(event.data)
        }
      } catch (err) {
        console.warn('[RealtimeSync] BroadcastChannel not supported:', err)
      }
    }
  }

  // 2. Supabase Realtime WebSocket (Online cross-device)
  private initSupabaseChannel() {
    try {
      this.supabaseChannel = supabase.channel('adld_global_room', {
        config: { broadcast: { self: false } },
      })

      this.supabaseChannel
        .on('broadcast', { event: 'chat_message' }, (payload: any) => {
          if (payload?.payload) {
            this.notifyMessageListeners(payload.payload)
          }
        })
        .on('broadcast', { event: 'message_status' }, (payload: any) => {
          if (payload?.payload) {
            this.notifyStatusListeners(payload.payload)
          }
        })
        .on('broadcast', { event: 'friend_update' }, (payload: any) => {
          if (payload?.payload) {
            this.notifyFriendListeners(payload.payload.action, payload.payload.data)
          }
        })
        .subscribe()
    } catch (err) {
      console.warn('[RealtimeSync] Supabase channel error:', err)
    }
  }

  // 3. Storage event fallback
  private initStorageListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'adld_incoming_realtime_event' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue)
            this.handleIncomingEvent(parsed)
          } catch {}
        }
      })
    }
  }

  private handleIncomingEvent(eventData: any) {
    if (!eventData || !eventData.type) return

    if (eventData.type === 'chat_message' && eventData.payload) {
      this.notifyMessageListeners(eventData.payload)
    } else if (eventData.type === 'message_status' && eventData.payload) {
      this.notifyStatusListeners(eventData.payload)
    } else if (eventData.type === 'friend_update' && eventData.payload) {
      this.notifyFriendListeners(eventData.payload.action, eventData.payload.data)
    }
  }

  private notifyMessageListeners(msg: RealtimeChatMessage) {
    this.messageListeners.forEach((listener) => {
      try {
        listener(msg)
      } catch (err) {
        console.error('Error in message listener:', err)
      }
    })
  }

  private notifyStatusListeners(receipt: MessageStatusReceipt) {
    this.statusListeners.forEach((listener) => {
      try {
        listener(receipt)
      } catch (err) {
        console.error('Error in status listener:', err)
      }
    })
  }

  private notifyFriendListeners(action: 'request' | 'accepted' | 'rejected', data: any) {
    this.friendListeners.forEach((listener) => {
      try {
        listener(action, data)
      } catch (err) {
        console.error('Error in friend listener:', err)
      }
    })
  }

  // Subscribe to messages
  public onMessage(callback: MessageCallback) {
    this.messageListeners.add(callback)
    return () => {
      this.messageListeners.delete(callback)
    }
  }

  // Subscribe to message status changes (Delivered, Read)
  public onMessageStatus(callback: StatusCallback) {
    this.statusListeners.add(callback)
    return () => {
      this.statusListeners.delete(callback)
    }
  }

  // Subscribe to friend updates
  public onFriendUpdate(callback: FriendCallback) {
    this.friendListeners.add(callback)
    return () => {
      this.friendListeners.delete(callback)
    }
  }

  // Send a real-time message
  public async sendChatMessage(msg: RealtimeChatMessage) {
    const payloadWithTab: RealtimeChatMessage = {
      ...msg,
      senderTabId: msg.senderTabId || CURRENT_TAB_ID,
      status: msg.status || 'sent',
    }

    // 1. Dispatch via BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'chat_message',
          payload: payloadWithTab,
        })
      } catch {}
    }

    // 2. Dispatch via Storage Event fallback
    try {
      localStorage.setItem(
        'adld_incoming_realtime_event',
        JSON.stringify({ type: 'chat_message', payload: payloadWithTab, _t: Date.now() })
      )
    } catch {}

    // 3. Dispatch via Supabase Realtime WebSocket
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'chat_message',
          payload: payloadWithTab,
        })
      } catch (err) {
        console.warn('Supabase realtime broadcast error:', err)
      }
    }

    // 4. Save into recipient's conversation box in persistent storage
    this.persistMessageForRecipient(payloadWithTab)
  }

  // Send message delivery or read receipt (Centang 2 & Centang 2 Biru)
  public async sendStatusReceipt(receipt: MessageStatusReceipt) {
    const payloadWithTab: MessageStatusReceipt = {
      ...receipt,
      senderTabId: receipt.senderTabId || CURRENT_TAB_ID,
    }

    // 1. BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'message_status',
          payload: payloadWithTab,
        })
      } catch {}
    }

    // 2. Storage event fallback
    try {
      localStorage.setItem(
        'adld_incoming_realtime_event',
        JSON.stringify({ type: 'message_status', payload: payloadWithTab, _t: Date.now() })
      )
    } catch {}

    // 3. Supabase Realtime WebSocket
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'message_status',
          payload: payloadWithTab,
        })
      } catch (err) {
        console.warn('Supabase realtime broadcast status error:', err)
      }
    }
  }

  // Persist into recipient's messages
  private persistMessageForRecipient(msg: RealtimeChatMessage) {
    try {
      // 1. Store in shared messages lookup
      const sharedKey = 'adld_messages'
      const savedMessages = JSON.parse(localStorage.getItem(sharedKey) || '{}')

      // Key under sender id
      const convoKey = msg.fromUserId
      const existingList = savedMessages[convoKey] || []

      const recipientCopy = {
        id: msg.id,
        sender: 'other',
        text: msg.text,
        time: msg.time,
        type: msg.type,
        mediaUrl: msg.mediaUrl,
        audioUrl: msg.audioUrl,
        audioDuration: msg.audioDuration,
        isViewOnce: msg.isViewOnce,
        viewed: false,
        invoice: msg.invoice,
        fileName: msg.fileName,
      }

      // Avoid duplicates
      if (!existingList.some((m: any) => m.id === msg.id)) {
        existingList.push(recipientCopy)
        savedMessages[convoKey] = existingList
        localStorage.setItem(sharedKey, JSON.stringify(savedMessages))
      }

      // 2. Update conversations list for recipient in global storage
      const savedConvos = JSON.parse(localStorage.getItem('adld_conversations') || '[]')
      const targetIdx = savedConvos.findIndex((c: any) => c.id === msg.fromUserId)

      if (targetIdx >= 0) {
        savedConvos[targetIdx].lastMessage = msg.text
        savedConvos[targetIdx].time = msg.time
        savedConvos[targetIdx].unread = (savedConvos[targetIdx].unread || 0) + 1
      } else {
        savedConvos.unshift({
          id: msg.fromUserId,
          name: msg.fromUserName,
          lastMessage: msg.text,
          time: msg.time,
          online: true,
          streak: 1,
          unread: 1,
        })
      }
      localStorage.setItem('adld_conversations', JSON.stringify(savedConvos))

      // 3. User-scoped storage for recipient if toUserId is known
      if (msg.toUserId) {
        const cleanTo = msg.toUserId.replace('@', '').replace('usr_', '').toLowerCase()
        const userMsgKey = `adld_messages_${cleanTo}`
        const userScopedMessages = JSON.parse(localStorage.getItem(userMsgKey) || '{}')
        const userScopedList = userScopedMessages[convoKey] || []
        if (!userScopedList.some((m: any) => m.id === msg.id)) {
          userScopedList.push(recipientCopy)
          userScopedMessages[convoKey] = userScopedList
          localStorage.setItem(userMsgKey, JSON.stringify(userScopedMessages))
        }

        const userConvosKey = `adld_conversations_${cleanTo}`
        const userScopedConvos = JSON.parse(localStorage.getItem(userConvosKey) || '[]')
        const uIdx = userScopedConvos.findIndex((c: any) => c.id === msg.fromUserId)
        if (uIdx >= 0) {
          userScopedConvos[uIdx].lastMessage = msg.text
          userScopedConvos[uIdx].time = msg.time
          userScopedConvos[uIdx].unread = (userScopedConvos[uIdx].unread || 0) + 1
        } else {
          userScopedConvos.unshift({
            id: msg.fromUserId,
            name: msg.fromUserName,
            lastMessage: msg.text,
            time: msg.time,
            online: true,
            streak: 1,
            unread: 1,
          })
        }
        localStorage.setItem(userConvosKey, JSON.stringify(userScopedConvos))
      }
    } catch (err) {
      console.warn('Failed to persist recipient message:', err)
    }
  }

  // Send a real-time friend request
  public async sendFriendRequest(req: FriendRequestPayload) {
    // 1. Dispatch via BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'friend_update',
          payload: { action: 'request', data: req },
        })
      } catch {}
    }

    // 2. Storage event
    try {
      localStorage.setItem(
        'adld_incoming_realtime_event',
        JSON.stringify({ type: 'friend_update', payload: { action: 'request', data: req }, _t: Date.now() })
      )
    } catch {}

    // 3. Supabase realtime
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'friend_update',
          payload: { action: 'request', data: req },
        })
      } catch {}
    }
  }

  // Broadcast friend acceptance
  public async broadcastFriendAccepted(userA: any, userB: any) {
    const payload = { userA, userB }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'friend_update',
          payload: { action: 'accepted', data: payload },
        })
      } catch {}
    }

    try {
      localStorage.setItem(
        'adld_incoming_realtime_event',
        JSON.stringify({ type: 'friend_update', payload: { action: 'accepted', data: payload }, _t: Date.now() })
      )
    } catch {}

    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'friend_update',
          payload: { action: 'accepted', data: payload },
        })
      } catch {}
    }
  }
}

export const realtimeSync = new RealtimeSyncManager()
