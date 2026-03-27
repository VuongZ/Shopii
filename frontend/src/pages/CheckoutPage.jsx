import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import cartApi from '../api/cartApi'
import couponApi from '../api/couponApi'
import paymentApi from '../api/paymentApi'
import axiosClient from '../api/axiosClient' // <--- Đã thêm import này để gọi API Vận chuyển

import logoVnPay from '../assets/logoVnPay.jpg'

const CheckoutPage = () => {
  const { state } = useLocation()
  const navigate = useNavigate()

  const selectedItems = state?.selectedItems || []

  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)

  const [cartItems, setCartItems] = useState([])

  const [paymentMethod, setPaymentMethod] = useState(1)
  const [loading, setLoading] = useState(false)

  // --- STATE VẬN CHUYỂN ---
  const [shippingMethods, setShippingMethods] = useState([])
  const [selectedShippingId, setSelectedShippingId] = useState(null)
  const [shippingFee, setShippingFee] = useState(0) // Phí ship động

  const [coupons, setCoupons] = useState([])
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)

  const [showCouponModal, setShowCouponModal] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [couponApplying, setCouponApplying] = useState(false)

  const shopIdList = Array.from(
    new Set(cartItems.map((item) => item.shop_id).filter(Boolean))
  )

  const shopSubtotalMap = cartItems.reduce((acc, item) => {
    const shopId = item.shop_id
    if (!shopId) return acc
    acc[shopId] = (acc[shopId] ?? 0) + Number(item.price) * item.quantity
    return acc
  }, {})

  const singleShopId = shopIdList.length === 1 ? shopIdList[0] : null

  useEffect(() => {
    if (selectedItems.length === 0) {
      navigate('/cart')
    }
    const fetchData = async () => {
      try {
        const cartRes = await cartApi.getCart()
        const addrRes = await cartApi.getAddresses().catch(() => ({ data: [] }))

        // Gọi API lấy phương thức vận chuyển
        const shipRes = await axiosClient
          .get('/shipping-methods')
          .catch(() => ({ data: [] }))

        const cartData = cartRes.data || {}
        const allItems = Object.values(cartData).flat()

        const filtered = allItems.filter((item) =>
          selectedItems.some((id) => String(id) === String(item.id))
        )

        setCartItems(filtered)
        setAppliedCoupon(null)
        setDiscountAmount(0)
        setShowCouponModal(false)

        // Set danh sách địa chỉ
        const addrList = addrRes.data || []
        setAddresses(addrList)
        if (addrList.length > 0) {
          const defaultAddr = addrList.find((a) => a.is_default) || addrList[0]
          setSelectedAddress(defaultAddr)
        }

        // Set danh sách vận chuyển và chọn mặc định cái đầu tiên
        const shipList = shipRes.data || []
        setShippingMethods(shipList)
        if (shipList.length > 0) {
          setSelectedShippingId(shipList[0].id)
          setShippingFee(Number(shipList[0].base_fee))
        }

        const filteredShopIdList = Array.from(
          new Set(filtered.map((item) => item.shop_id).filter(Boolean))
        )
        const shopIdForCoupons =
          filteredShopIdList.length === 1 ? filteredShopIdList[0] : null

        const couponRes = await couponApi
          .getCoupons(shopIdForCoupons)
          .catch(() => ({ data: [] }))
        setCoupons(couponRes.data || [])
      } catch (error) {
        console.error('Checkout load error:', error)
      }
    }

    if (selectedItems.length > 0) {
      fetchData()
    }
  }, [selectedItems, navigate])

  const totalProductPrice = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  )

  // Tổng tiền sẽ cộng với shippingFee động do khách chọn
  const finalTotal = Math.max(
    0,
    totalProductPrice + shippingFee - discountAmount
  )

  const handleShippingChange = (method) => {
    setSelectedShippingId(method.id)
    setShippingFee(Number(method.base_fee))
  }

  const handleApplyCoupon = async (code) => {
    if (couponApplying) return
    try {
      setCouponApplying(true)

      const payload = {
        coupon_code: code,
        order_total: singleShopId
          ? shopSubtotalMap[singleShopId]
          : totalProductPrice,
      }

      if (singleShopId) {
        payload.shop_id = singleShopId
      }

      const res = await couponApi.applyCoupon(payload)

      setAppliedCoupon(res.data)
      setDiscountAmount(Number(res.data.discount_amount) || 0)
      setManualCode('')
      setShowCouponModal(false)

      alert(
        `Áp dụng thành công. Giảm ${res.data.discount_amount.toLocaleString()}đ`
      )
    } catch (err) {
      alert(
        err.response?.data?.message ||
          'Mã giảm giá không hợp lệ hoặc chưa đủ điều kiện'
      )
    } finally {
      setCouponApplying(false)
    }
  }

  const handleManualApply = () => {
    if (!manualCode.trim()) {
      alert('Nhập mã giảm giá')
      return
    }
    handleApplyCoupon(manualCode.trim().toUpperCase())
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Vui lòng chọn địa chỉ')
      return
    }
    if (!selectedShippingId) {
      alert('Vui lòng chọn phương thức vận chuyển')
      return
    }

    setLoading(true)

    try {
      const orderRes = await cartApi.checkout({
        cart_item_ids: selectedItems,
        address_id: selectedAddress.id,
        payment_method_id: paymentMethod,
        shipping_method_id: selectedShippingId, // <--- Gửi ID vận chuyển
        coupon_code: appliedCoupon?.code,
      })

      const { order_ids, total_amount, message } = orderRes.data

      if (paymentMethod === 2) {
        const payRes = await paymentApi.createPaymentUrl({
          orderId: order_ids[0],
          amount: total_amount,
        })

        const url = payRes.data.paymentUrl || payRes.data.url

        if (url) {
          window.location.href = url
        } else {
          alert('Không lấy được link thanh toán VNPay')
        }
      } else {
        alert(message || 'Đặt hàng thành công')
        navigate('/orders')
        localStorage.removeItem('CART')
        window.dispatchEvent(new Event('storage'))
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Đặt hàng thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeAddress = () => {
    if (addresses.length === 0) {
      alert('Chưa có địa chỉ')
      return
    }

    const currentIndex = addresses.findIndex((a) => a.id === selectedAddress.id)
    const nextIndex = (currentIndex + 1) % addresses.length

    setSelectedAddress(addresses[nextIndex])
  }

  return (
    <div
      style={{ background: '#f5f5f5', minHeight: '100vh', paddingBottom: 40 }}
    >
      <div style={{ background: '#fff', padding: 20, marginBottom: 20 }}>
        <h2 style={{ color: '#ee4d2d' }}>Thanh toán</h2>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* ADDRESS */}

        <div style={{ background: '#fff', padding: 20, marginBottom: 15 }}>
          <h3>Địa chỉ nhận hàng</h3>

          {selectedAddress ? (
            <div>
              <b>
                {selectedAddress.recipient_name} (+84)
                {selectedAddress.recipient_phone}
              </b>

              <div>
                {selectedAddress.address_detail}, {selectedAddress.ward},{' '}
                {selectedAddress.district}, {selectedAddress.city}
              </div>
            </div>
          ) : (
            <p>Chưa có địa chỉ</p>
          )}

          <button onClick={handleChangeAddress}>Thay đổi</button>
        </div>

        {/* PRODUCTS */}

        <div style={{ background: '#fff', padding: 20, marginBottom: 15 }}>
          {cartItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: 10,
              }}
            >
              <div>
                {item.product_name} x{item.quantity}
              </div>

              <div>{(item.price * item.quantity).toLocaleString()} đ</div>
            </div>
          ))}
        </div>

        {/* ========================================================= */}
        {/* SHIPPING */}
        {/* ========================================================= */}
        <div style={{ background: '#fff', padding: 20, marginBottom: 15 }}>
          <h3 style={{ marginBottom: '15px' }}>Phương thức vận chuyển</h3>

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {shippingMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => handleShippingChange(method)}
                style={{
                  padding: '12px 20px',
                  border:
                    selectedShippingId === method.id
                      ? '1px solid #ee4d2d'
                      : '1px solid #e1e1e1',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  position: 'relative',
                  backgroundColor:
                    selectedShippingId === method.id ? '#fffafa' : 'white',
                  minWidth: '200px',
                }}
              >
                <div
                  style={{
                    color:
                      selectedShippingId === method.id ? '#ee4d2d' : '#333',
                    fontWeight: 'bold',
                    marginBottom: '5px',
                  }}
                >
                  {method.name}
                </div>
                <div style={{ color: '#888', fontSize: '14px' }}>
                  {Number(method.base_fee).toLocaleString()} đ
                </div>

                {/* Dấu tích cam khi được chọn */}
                {selectedShippingId === method.id && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      bottom: 0,
                      width: 0,
                      height: 0,
                      borderBottom: '20px solid #ee4d2d',
                      borderLeft: '20px solid transparent',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        right: '2px',
                        bottom: '-18px',
                        color: 'white',
                        fontSize: '10px',
                      }}
                    >
                      ✓
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* PAYMENT */}

        <div style={{ background: '#fff', padding: 20, marginBottom: 15 }}>
          <h3>Phương thức thanh toán</h3>

          <button
            onClick={() => setPaymentMethod(1)}
            style={{
              background: paymentMethod === 1 ? '#ee4d2d' : '#eee',
              color: paymentMethod === 1 ? 'white' : 'black',
              padding: '10px 20px',
              border: 'none',
              borderRadius: 6,
            }}
          >
            Thanh toán khi nhận hàng
          </button>

          <button
            onClick={() => setPaymentMethod(2)}
            style={{
              marginLeft: 10,
              background: paymentMethod === 2 ? '#ee4d2d' : '#eee',
              color: paymentMethod === 2 ? 'white' : 'black',
              padding: '10px 20px',
              border: 'none',
              borderRadius: 6,
            }}
          >
            <img src={logoVnPay} height={20} alt="VNPay" />
            VNPay
          </button>
        </div>

        {/* VOUCHER */}

        <div style={{ background: '#fff', padding: 20 }}>
          <h3>Voucher</h3>
          {!singleShopId && (
            <p style={{ color: 'red', marginTop: 5 }}>
              Chỉ voucher toàn sàn có thể áp dụng khi mua nhiều shop
            </p>
          )}
          {appliedCoupon && <p>Đã áp dụng: {appliedCoupon.code}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Nhập mã giảm giá"
            />

            <button onClick={handleManualApply}>Áp dụng</button>

            <button onClick={() => setShowCouponModal(true)}>
              Chọn Voucher
            </button>
          </div>
        </div>

        {/* TOTAL */}

        <div style={{ background: '#fff', padding: 20, marginTop: 15 }}>
          <div>Tổng tiền hàng: {totalProductPrice.toLocaleString()} đ</div>

          {/* Phí ship hiển thị linh động */}
          <div>Phí ship: {shippingFee.toLocaleString()} đ</div>

          {discountAmount > 0 && (
            <div>- {discountAmount.toLocaleString()} đ</div>
          )}

          <h2 style={{ color: '#ee4d2d' }}>
            Tổng thanh toán: {finalTotal.toLocaleString()} đ
          </h2>

          <button onClick={handlePlaceOrder} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đặt hàng'}
          </button>
        </div>
      </div>

      {/* COUPON MODAL */}

      {showCouponModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: 20,
              width: 420,
              borderRadius: 10,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
          >
            <h3>Chọn voucher</h3>

            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                style={{
                  border: '1px solid #ddd',
                  padding: 10,
                  marginBottom: 10,
                }}
              >
                <b>{coupon.code}</b>

                <div style={{ fontSize: 13, color: '#555' }}>
                  Giảm{' '}
                  {coupon.discount_type === 'percent'
                    ? coupon.discount_value + '%'
                    : coupon.discount_value.toLocaleString() + 'đ'}
                </div>

                <div style={{ fontSize: 12, color: '#888' }}>
                  SL còn: {coupon.quantity ?? '∞'}
                </div>

                <div style={{ fontSize: 12, color: '#888' }}>
                  {coupon.start_date && coupon.end_date
                    ? `Từ ${new Date(coupon.start_date).toLocaleDateString()} - ${new Date(coupon.end_date).toLocaleDateString()}`
                    : 'Không giới hạn thời gian'}
                </div>

                <button
                  onClick={() => handleApplyCoupon(coupon.code)}
                  disabled={couponApplying}
                >
                  Dùng
                </button>
              </div>
            ))}

            <button onClick={() => setShowCouponModal(false)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckoutPage
