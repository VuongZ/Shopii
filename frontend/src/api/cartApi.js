import axiosClient from "./axiosClient";

const cartApi = {
  getCart() {
    return axiosClient.get("/cart");
  },

  update(data) {
    return axiosClient.put("/cart/update", data);
  },

  remove(id) {
    return axiosClient.delete(`/cart/${id}`);
  },

  getAddresses() {
    return axiosClient.get("/addresses");
  },

  checkout(data) {
    return axiosClient.post("/checkout", data);
  },
};

export default cartApi;