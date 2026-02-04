import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://127.0.0.1:8000/api", // Đường dẫn đến Backend Laravel của bạn
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Tự động thêm Token vào mỗi request nếu đã đăng nhập
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("ACCESS_TOKEN");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý lỗi chung (Ví dụ: Hết hạn token thì tự đăng xuất)
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    if (response && response.status === 401) {
      localStorage.removeItem("ACCESS_TOKEN");
      // window.location.reload();
    }
    throw error;
  },
);

export default axiosClient;
