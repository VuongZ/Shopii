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

  // Xóa sản phẩm khỏi giỏ
  remove(id) {
    return axiosClient.delete(`/cart/${id}`);
  },

  // Thanh toán
  checkout(data) {
    return axiosClient.post("/checkout", data);
  },
};

export default cartApi;
