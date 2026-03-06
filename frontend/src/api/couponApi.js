import axiosClient from "./axiosClient";

const couponApi = {
  getCoupons() {
    return axiosClient.get("/coupons");
  },

  applyCoupon(data) {
    return axiosClient.post("/apply-coupon", data);
  },
};

export default couponApi;