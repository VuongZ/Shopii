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

// Tự động thêm Token vào mỗi request nếu đã đăng nhập
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ACCESS_TOKEN')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Xử lý lỗi chung (Ví dụ: Hết hạn token thì tự đăng xuất)
axiosClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const { response } = error
    if (response && response.status === 401) {
      localStorage.removeItem('ACCESS_TOKEN')
      // window.location.reload();
    }

    throw error
  }
)
axiosClient.interceptors.request.use((config) => {
  console.log('REQUEST URL:', config.url)
  return config
})
export default axiosClient
