import axios from 'axios'

const jikan = axios.create({
  baseURL: 'https://api.jikan.moe/v4',
})

export default jikan
