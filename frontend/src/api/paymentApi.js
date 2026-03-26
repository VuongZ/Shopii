import axiosClient from './axiosClient'

const paymentApi = {
  createPaymentUrl(data) {
    return axiosClient.post('/payment/vnpay', data)
  },

  vnpayReturn(query) {
    return axiosClient.get('/payment/vnpay-callback' + query)
  },
}

export default paymentApi
