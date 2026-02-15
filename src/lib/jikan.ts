import axios from 'axios'

const jikan = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
})

export default jikan
