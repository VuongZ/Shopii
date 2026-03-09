import axiosClient from "./axiosClient";

const couponApi = {
  getCoupons() {
    return axiosClient.get("/coupons");
  },

  applyCoupon(data) {
    return axiosClient.post("/coupons/apply", data);
  },
};

export default couponApi;
