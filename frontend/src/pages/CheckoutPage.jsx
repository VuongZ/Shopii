import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import cartApi from '../api/cartApi'
import couponApi from '../api/couponApi'
import paymentApi from '../api/paymentApi'
import axiosClient from '../api/axiosClient'

import logoVnPay from '../assets/logoVnPay.jpg'

const CheckoutPage = () => {
  const { state } = useLocation()
  const navigate = useNavigate()

  const selectedItems = state?.selectedItems || []

  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [user, setUser] = useState(null) // Lưu thông tin hạng user

  const [paymentMethod, setPaymentMethod] = useState(1)
  const [loading, setLoading] = useState(false)

  const [shippingMethods, setShippingMethods] = useState([])
  const [selectedShippingId, setSelectedShippingId] = useState(null)
  const [shippingFee, setShippingFee] = useState(0)

  const [coupons, setCoupons] = useState([]) // Danh sách voucher (toàn sàn + shop)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)

  const [showCouponModal, setShowCouponModal] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [couponApplying, setCouponApplying] = useState(false)

  // Gom nhóm tiền theo từng shop để check điều kiện voucher shop
  const shopSubtotalMap = cartItems.reduce((acc, item) => {
    const shopId = item.shop_id
    if (!shopId) return acc
    acc[shopId] = (acc[shopId] ?? 0) + Number(item.price) * item.quantity
    return acc
  }, {})

  useEffect(() => {
    if (selectedItems.length === 0) {
      navigate('/cart')
      return
    }

    const fetchData = async () => {
      try {
        // 1. Lấy thông tin User và Giỏ hàng
        const [userRes, cartRes, addrRes, shipRes] = await Promise.all([
          axiosClient.get('/user'),
          cartApi.getCart(),
          cartApi.getAddresses().catch(() => ({ data: [] })),
          axiosClient.get('/shipping-methods').catch(() => ({ data: [] })),
        ])

        setUser(userRes.data)
        const allItems = Object.values(cartRes.data || {}).flat()
        const filtered = allItems.filter((item) =>
          selectedItems.some((id) => String(id) === String(item.id))
        )
        setCartItems(filtered)

        // 2. Xử lý Địa chỉ & Vận chuyển
        const addrList = addrRes.data || []
        setAddresses(addrList)
        if (addrList.length > 0) {
          setSelectedAddress(addrList.find((a) => a.is_default) || addrList[0])
        }

        const shipList = shipRes.data || []
        setShippingMethods(shipList)
        if (shipList.length > 0) {
          setSelectedShippingId(shipList[0].id)
          setShippingFee(Number(shipList[0].base_fee))
        }

        // 3. LẤY VOUCHER (TOÀN SÀN + CÁC SHOP TRONG GIỎ)
        const distinctShopIds = Array.from(
          new Set(filtered.map((i) => i.shop_id))
        )

        // Gọi API lấy voucher tổng hợp (bạn nên viết API này ở backend như tôi gợi ý trước đó)
        // Nếu chưa có API tổng hợp, ta sẽ fetch voucher toàn sàn (shop_id = null)
        const couponRes = await axiosClient.get('/coupons', {
          params: { shop_ids: distinctShopIds.join(',') },
        })
        setCoupons(couponRes.data || [])
      } catch (error) {
        console.error('Checkout load error:', error)
      }
    }

    fetchData()
  }, [selectedItems, navigate])

  const totalProductPrice = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  )

  const finalTotal = Math.max(
    0,
    totalProductPrice + shippingFee - discountAmount
  )

  const handleApplyCoupon = async (code) => {
    if (couponApplying) return
    try {
      setCouponApplying(true)
      const res = await couponApi.applyCoupon({
        coupon_code: code,
        cart_item_ids: selectedItems, // Backend sẽ tự tính toán dựa trên giỏ hàng
      })

      setAppliedCoupon(res.data)
      setDiscountAmount(Number(res.data.discount_amount) || 0)
      setManualCode('')
      setShowCouponModal(false)
      alert(
        `Áp dụng thành công! Giảm ${res.data.discount_amount.toLocaleString()}đ`
      )
    } catch (err) {
      alert(
        err.response?.data?.message || 'Mã không hợp lệ hoặc không đủ điều kiện'
      )
    } finally {
      setCouponApplying(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress || !selectedShippingId)
      return alert('Vui lòng chọn địa chỉ và vận chuyển')
    setLoading(true)
    try {
      const orderRes = await cartApi.checkout({
        cart_item_ids: selectedItems,
        address_id: selectedAddress.id,
        payment_method_id: paymentMethod,
        shipping_method_id: selectedShippingId,
        coupon_code: appliedCoupon?.code,
      })

      const { order_ids, total_amount, message } = orderRes.data

      if (paymentMethod === 2) {
        // MoMo
        const payRes = await paymentApi.createMoMoUrl({
          orderId: order_ids[0],
          amount: total_amount,
        })
        if (payRes.data.paymentUrl)
          window.location.href = payRes.data.paymentUrl
      } else if (paymentMethod === 3) {
        // VNPay
        const payRes = await paymentApi.createVNPayUrl({
          orderId: order_ids[0],
          amount: total_amount,
        })
        if (payRes.data.paymentUrl)
          window.location.href = payRes.data.paymentUrl
      } else {
        alert(message || 'Đặt hàng thành công')
        navigate('/orders')
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Đặt hàng thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{ background: '#f5f5f5', minHeight: '100vh', paddingBottom: 40 }}
    >
      <div style={{ background: '#fff', padding: 20, marginBottom: 20 }}>
        <h2 style={{ color: '#ee4d2d' }}>Thanh toán</h2>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* ĐỊA CHỈ */}
        <div
          style={{
            background: '#fff',
            padding: 20,
            marginBottom: 15,
            borderRadius: '4px',
          }}
        >
          <h3 style={{ color: '#ee4d2d', fontSize: '18px' }}>
            📍 Địa chỉ nhận hàng
          </h3>
          {selectedAddress ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <strong>
                  {selectedAddress.recipient_name} (
                  {selectedAddress.recipient_phone})
                </strong>
                <p style={{ margin: '5px 0' }}>
                  {selectedAddress.address_detail}, {selectedAddress.ward},{' '}
                  {selectedAddress.district}, {selectedAddress.city}
                </p>
              </div>
              <button
                onClick={() => alert('Chức năng thay đổi đang phát triển')}
                style={{
                  color: '#05a',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                }}
              >
                Thay đổi
              </button>
            </div>
          ) : (
            <p>Chưa có địa chỉ</p>
          )}
        </div>

        {/* SẢN PHẨM */}
        <div style={{ background: '#fff', padding: 20, marginBottom: 15 }}>
          {cartItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid #f5f5f5',
              }}
            >
              <div style={{ display: 'flex', gap: 15 }}>
                <img
                  src={item.image}
                  style={{ width: 60, height: 60, objectFit: 'cover' }}
                  alt=""
                />
                <div>
                  <div>{item.product_name}</div>
                  <small style={{ color: '#888' }}>
                    Loại: {item.sku_code} | x{item.quantity}
                  </small>
                </div>
              </div>
              <div style={{ fontWeight: '500' }}>
                {(item.price * item.quantity).toLocaleString()}đ
              </div>
            </div>
          ))}
        </div>

        {/* VẬN CHUYỂN & THANH TOÁN (Giữ nguyên giao diện của bạn) */}
        {/* ... (Phần UI Shipping & Payment giữ nguyên như code cũ) ... */}

        {/* VOUCHER */}
        <div style={{ background: '#fff', padding: 20, marginBottom: 15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0 }}>🎟️ Shopii Voucher</h3>
            {appliedCoupon && (
              <span
                style={{
                  background: '#ee4d2d',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '2px',
                  fontSize: '12px',
                }}
              >
                {appliedCoupon.code}
              </span>
            )}
            <button
              onClick={() => setShowCouponModal(true)}
              style={{
                marginLeft: 'auto',
                color: '#05a',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
              }}
            >
              Chọn Voucher
            </button>
          </div>
        </div>

        {/* TỔNG KẾT */}
        <div style={{ background: '#fff', padding: 20, textAlign: 'right' }}>
          <p>Tổng tiền hàng: {totalProductPrice.toLocaleString()}đ</p>
          <p>Phí vận chuyển: {shippingFee.toLocaleString()}đ</p>
          {discountAmount > 0 && (
            <p style={{ color: '#ee4d2d' }}>
              Giảm giá Voucher: -{discountAmount.toLocaleString()}đ
            </p>
          )}
          <h2 style={{ color: '#ee4d2d' }}>
            Tổng thanh toán: {finalTotal.toLocaleString()}đ
          </h2>
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            style={{
              padding: '12px 40px',
              background: '#ee4d2d',
              color: '#fff',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            {loading ? 'Đang xử lý...' : 'Đặt hàng'}
          </button>
        </div>
      </div>

      {/* MODAL CHỌN VOUCHER (Cập nhật hiển thị Hạng) */}
      {showCouponModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '20px',
              width: '500px',
              maxHeight: '80vh',
              overflowY: 'auto',
              borderRadius: '8px',
            }}
          >
            <h3
              style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}
            >
              Chọn Voucher
            </h3>

            {coupons.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px' }}>
                Không có mã giảm giá khả dụng
              </p>
            ) : (
              coupons.map((cp) => {
                const isSystem = cp.shop_id === null
                const minOrder = Number(cp.min_order_value || 0)

                // Logic check điều kiện hiển thị
                const subtotalToCheck = isSystem
                  ? totalProductPrice
                  : shopSubtotalMap[cp.shop_id] || 0
                const isNotEligible = subtotalToCheck < minOrder

                // Check hạng thành viên (Nếu là voucher toàn sàn)
                const userTierMinSpent = Number(
                  user?.membership?.tier?.min_spent || 0
                )
                const requiredTierMinSpent = Number(cp.tier?.min_spent || 0)
                const isTierLocked =
                  isSystem &&
                  cp.membership_tier_id &&
                  userTierMinSpent < requiredTierMinSpent

                return (
                  <div
                    key={cp.id}
                    style={{
                      display: 'flex',
                      border: '1px solid #eee',
                      marginBottom: '10px',
                      opacity: isNotEligible || isTierLocked ? 0.6 : 1,
                    }}
                  >
                    <div
                      style={{
                        width: '100px',
                        background: isSystem ? '#ee4d2d' : '#26aa99',
                        color: '#fff',
                        padding: '10px',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {isSystem ? 'Toàn Sàn' : 'Shop'}
                    </div>
                    <div style={{ flex: 1, padding: '10px' }}>
                      <div style={{ fontWeight: 'bold' }}>{cp.code}</div>
                      <div style={{ fontSize: '13px' }}>
                        Giảm{' '}
                        {cp.discount_type === 'percent'
                          ? `${cp.discount_value}%`
                          : `${cp.discount_value.toLocaleString()}đ`}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Đơn tối thiểu: {minOrder.toLocaleString()}đ
                      </div>

                      {/* Cảnh báo Hạng */}
                      {isTierLocked && (
                        <div
                          style={{
                            color: '#ee4d2d',
                            fontSize: '11px',
                            fontWeight: 'bold',
                          }}
                        >
                          🔒 Chỉ dành cho hạng {cp.tier?.name} trở lên
                        </div>
                      )}

                      {isNotEligible && (
                        <div style={{ color: '#ee4d2d', fontSize: '11px' }}>
                          Chưa đủ đơn tối thiểu
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <button
                        disabled={isNotEligible || isTierLocked}
                        onClick={() => handleApplyCoupon(cp.code)}
                        style={{
                          padding: '5px 15px',
                          background:
                            isNotEligible || isTierLocked ? '#ccc' : '#ee4d2d',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Dùng
                      </button>
                    </div>
                  </div>
                )
              })
            )}
            <button
              onClick={() => setShowCouponModal(false)}
              style={{ width: '100%', padding: '10px', marginTop: '10px' }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckoutPage
