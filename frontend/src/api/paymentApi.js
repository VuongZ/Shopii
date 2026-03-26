import axiosClient from './axiosClient'

const paymentApi = {
  createPaymentUrl(data) {
    return axiosClient.post('/payment/momo', data)
  },

  momoReturn(query) {
    return axiosClient.get('/payment/momo-callback' + query)
  },
}

export default paymentApi
