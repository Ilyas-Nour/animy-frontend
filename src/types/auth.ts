export interface User {
  id: string
  email: string
  username?: string
  firstName?: string
  lastName?: string
  bio?: string
  avatar?: string
  bannerUrl?: string
  xp: number
  level: number
  rank?: string
  levelProgress?: number
  nextLevelXp?: number
  lastCheckIn?: string | null
  role?: 'USER' | 'ADMIN'
  interests?: string[]

  // Social Links
  instagram?: string
  github?: string
  linkedin?: string
  tiktok?: string
  whatsapp?: string
  facebook?: string
  snapchat?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}