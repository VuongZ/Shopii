// src/api/cartApi.js
import axiosClient from "./axiosClient";

const cartApi = {
  // Lấy danh sách giỏ hàng
  getCart() {
    return axiosClient.get("/cart");
  },
  update(data) {
    return axiosClient.put("/cart/update", data);
  },
  // Thêm vào giỏ (Dùng cho nút Mua hàng hoặc dấu +)
  addToCart(data) {
    return axiosClient.post("/cart/add", data);
  },
  createPaymentUrl(data) {
    // data gửi lên gồm: { orderId, amount, bankCode (nếu có) }
    return axiosClient.post("/payment/vnpay", data);
  },
  vnpayReturn(params) {
      return axiosClient.get(`/payment/vnpay-callback${params}`);
  },
  // Xóa sản phẩm khỏi giỏ
  remove(id) {
    return axiosClient.delete(`/cart/${id}`);
  },

  // Thanh toán
  checkout(data) {
    return axiosClient.post("/checkout", data);
  },
  getAddresses() {
      return axiosClient.get('/user/addresses'); 
  },
};

export default cartApi;
