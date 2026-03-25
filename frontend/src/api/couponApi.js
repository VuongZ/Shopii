import axiosClient from "./axiosClient";

const couponApi = {
  getCoupons(shopId) {
    const params = shopId ? { shop_id: shopId } : undefined;
    return axiosClient.get("/coupons", { params });
  },

  applyCoupon(data) {
    return axiosClient.post("/coupons/apply", data);
  },
};

export default couponApi;
