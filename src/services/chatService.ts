import { supabase } from '@/lib/supabase'

export interface MessageItem {
  id: string
  conversation_id: string
  sender_id: string
  message_type: 'text' | 'image' | 'video' | 'voice' | 'sticker' | 'view_once'
  text: string | null
  media_url: string | null
  reply_to_id: string | null
  is_view_once: boolean
  created_at: string
}

export const chatService = {
  /**
   * Fetch messages for a specific conversation
   */
  async getMessages(conversationId: string): Promise<MessageItem[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.warn('[ADLD Chat] Error fetching messages:', error.message)
      return []
    }

    return data as MessageItem[]
  },

  /**
   * Send a new message
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string,
    messageType: 'text' | 'image' | 'video' | 'voice' | 'sticker' | 'view_once' = 'text',
    mediaUrl?: string
  ): Promise<MessageItem | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        text,
        message_type: messageType,
        media_url: mediaUrl || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[ADLD Chat] Error sending message:', error.message)
      return null
    }

    return data as MessageItem
  },

  /**
   * Subscribe to new realtime messages in a conversation
   */
  subscribeToMessages(
    conversationId: string,
    onNewMessage: (msg: MessageItem) => void
  ) {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onNewMessage(payload.new as MessageItem)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}
