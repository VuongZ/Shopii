import axiosClient from "./axiosClient";

const paymentApi = {
  createPaymentUrl(data) {
    return axiosClient.post("/vnpay/create-payment", data);
  },

  vnpayReturn(queryString) {
    return axiosClient.get(`/vnpay/return${queryString}`);
  },
};

export default paymentApi;
