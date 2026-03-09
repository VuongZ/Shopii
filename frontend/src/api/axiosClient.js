import axios from 'axios'

const axiosClient = axios.create({
  // https://shopii-backend-latest.onrender.com/api backend render
  //  http://localhost:8000/api/
  baseURL: ' http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ACCESS_TOKEN')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  console.log('REQUEST URL:', config.url)

  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error

    if (response && response.status === 401) {
      localStorage.removeItem('ACCESS_TOKEN')
    }

    throw error
  }
)

export default axiosClient
