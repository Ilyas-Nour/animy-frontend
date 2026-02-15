import axios from 'axios'

const jikan = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
})

export default jikan
