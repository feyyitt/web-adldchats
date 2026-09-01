export interface StreakInfo {
  currentStreak: number
  longestStreak: number
  lastInteraction: Date
  isExpiringSoon: boolean
}

export const streakService = {
  /**
   * Calculate streak state given last interaction timestamp
   */
  calculateStreak(lastInteractionDate: Date, currentStreak: number): StreakInfo {
    const now = new Date()
    const diffHours = (now.getTime() - lastInteractionDate.getTime()) / (1000 * 60 * 60)

    if (diffHours > 48) {
      // Streak lost
      return {
        currentStreak: 0,
        longestStreak: currentStreak,
        lastInteraction: lastInteractionDate,
        isExpiringSoon: false,
      }
    }

    const isExpiringSoon = diffHours >= 20 && diffHours <= 24

    return {
      currentStreak,
      longestStreak: currentStreak,
      lastInteraction: lastInteractionDate,
      isExpiringSoon,
    }
  },
}
