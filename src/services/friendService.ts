import { supabase } from '@/lib/supabase'

export interface FriendInfo {
  id: string
  friendship_id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  is_online: boolean
  last_seen: string | null
  streak: number
  status: 'pending' | 'accepted' | 'rejected' | 'blocked'
}

export const friendService = {
  /**
   * Fetch all accepted friends for a user
   */
  async getFriends(userId: string): Promise<FriendInfo[]> {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        status,
        requester_id,
        receiver_id,
        requester:profiles!friendships_requester_id_fkey(*),
        receiver:profiles!friendships_receiver_id_fkey(*)
      `)
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted')

    if (error) {
      console.warn('[ADLD Friends] Error fetching friends:', error.message)
      return []
    }

    return (data || []).map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const friendProfile: any = item.requester_id === userId ? item.receiver : item.requester
      return {
        id: friendProfile.id,
        friendship_id: item.id,
        username: friendProfile.username,
        display_name: friendProfile.display_name,
        avatar_url: friendProfile.avatar_url,
        bio: friendProfile.bio,
        is_online: friendProfile.is_online,
        last_seen: friendProfile.last_seen,
        streak: 0,
        status: item.status as 'accepted',
      }
    })
  },

  /**
   * Send a friend request
   */
  async sendFriendRequest(requesterId: string, receiverId: string) {
    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: requesterId,
        receiver_id: receiverId,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Accept or reject a friend request
   */
  async updateFriendshipStatus(friendshipId: string, status: 'accepted' | 'rejected' | 'blocked') {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', friendshipId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Search users by username or display name
   */
  async searchUsers(query: string) {
    if (!query.trim()) return []

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10)

    if (error) {
      console.warn('[ADLD Friends] Error searching users:', error.message)
      return []
    }

    return data
  },
}
