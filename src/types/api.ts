export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiError {
  success: false
  statusCode: number
  timestamp: string
  path: string
  message: string | object
}