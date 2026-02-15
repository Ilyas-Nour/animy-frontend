export interface Anime {
  id: number
  anilistId?: number
  mal_id: number
  url?: string
  images: {
    jpg: {
      image_url: string
      small_image_url: string
      large_image_url: string
    }
    webp?: {
      image_url: string
      small_image_url: string
      large_image_url: string
    }
  }
  trailer?: {
    youtube_id: string
    url: string
    embed_url?: string
  }
  title: string
  title_english?: string
  title_japanese?: string
  type?: string
  source?: string
  episodes?: number
  status?: string
  airing?: boolean
  aired?: {
    from?: string
    to?: string
    string?: string
  }
  duration?: string
  rating?: string
  score?: number
  scored_by?: number
  rank?: number
  popularity?: number
  members?: number
  favorites?: number
  synopsis?: string
  background?: string
  season?: string
  year?: number
  genres?: Genre[]
  studios?: Studio[]
  streaming?: StreamingLink[]
}

export interface Genre {
  id?: number
  mal_id: number
  type?: string
  name: string
  url?: string
}

export interface Studio {
  id?: number
  mal_id: number
  type?: string
  name: string
  url?: string
}

export interface StreamingLink {
  name: string
  url: string
}

export interface Pagination {
  last_visible_page: number
  has_next_page: boolean
  current_page: number
  items: {
    count: number
    total: number
    per_page: number
  }
}

export interface AnimeSearchResponse {
  data: Anime[]
  pagination: Pagination
}