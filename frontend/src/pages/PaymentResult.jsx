import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import paymentApi from '../api/paymentApi'

const PaymentResult = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [isUpdating, setIsUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const responseCode = searchParams.get('vnp_ResponseCode')
  const orderId = searchParams.get('vnp_TxnRef')

  const queryString = window.location.search

  const isSuccess = responseCode === '00'

  const isCalled = useRef(false)

  useEffect(() => {
    const updateOrder = async () => {
      try {
        setIsUpdating(true)

        const res = await paymentApi.vnpayReturn(queryString)

        console.log('Update order success:', res)

        setUpdateSuccess(true)
        localStorage.removeItem('CART')
        window.dispatchEvent(new Event('storage'))
      } catch (err) {
        console.error('Update order error:', err)
      } finally {
        setIsUpdating(false)
      }
    }

    if (isSuccess && orderId && !isCalled.current) {
      isCalled.current = true
      updateOrder()
    }
  }, [isSuccess, orderId, queryString])

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f6f6f6',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          width: '420px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        }}
      >
        {!responseCode ? (
          <>
            <h2>🚫 Không tìm thấy thông tin giao dịch</h2>
          </>
        ) : isSuccess ? (
          <>
            <div style={{ fontSize: '60px', color: '#22c55e' }}>✅</div>

            <h2 style={{ marginTop: '10px' }}>Thanh toán thành công</h2>

            <p style={{ marginTop: '10px', color: '#666' }}>
              Mã đơn hàng: <b>{orderId}</b>
            </p>

            {isUpdating && (
              <p style={{ color: '#ee4d2d', marginTop: '10px' }}>
                ⏳ Đang cập nhật trạng thái đơn hàng...
              </p>
            )}

            {updateSuccess && (
              <p style={{ color: 'green', marginTop: '10px' }}>
                ✔ Đã ghi nhận thanh toán
              </p>
            )}

            <button
              onClick={() => navigate('/orders')}
              style={{
                marginTop: '25px',
                padding: '12px 25px',
                background: '#ee4d2d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '15px',
              }}
            >
              Xem đơn hàng
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '60px', color: '#ef4444' }}>❌</div>

            <h2 style={{ marginTop: '10px' }}>Thanh toán thất bại</h2>

            <p style={{ marginTop: '10px', color: '#666' }}>
              Mã đơn hàng: <b>{orderId}</b>
            </p>

            <p style={{ marginTop: '5px', color: '#999' }}>
              Giao dịch bị hủy hoặc xảy ra lỗi
            </p>

            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: '25px',
                padding: '12px 25px',
                background: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '15px',
              }}
            >
              Quay về trang chủ
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default PaymentResult
