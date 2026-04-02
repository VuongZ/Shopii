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

  // --- QUẢN LÝ THÔNG TIN NGƯỜI DÙNG & ĐỊA CHỈ ---
  const [user, setUser] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)

  // --- QUẢN LÝ SẢN PHẨM ---
  const [cartItems, setCartItems] = useState([])

  // --- VẬN CHUYỂN & THANH TOÁN ---
  const [shippingMethods, setShippingMethods] = useState([])
  const [selectedShippingId, setSelectedShippingId] = useState(null)
  const [shippingFee, setShippingFee] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState(1) // 1: COD, 2: MoMo, 3: VNPay
  const [loading, setLoading] = useState(false)

  // --- VOUCHER ---
  const [coupons, setCoupons] = useState([])
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [couponApplying, setCouponApplying] = useState(false)

  const shopSubtotalMap = cartItems.reduce((acc, item) => {
    const sId = String(item.shop_id)
    acc[sId] = (acc[sId] ?? 0) + Number(item.price) * item.quantity
    return acc
  }, {})

  useEffect(() => {
    if (selectedItems.length === 0) {
      navigate('/cart')
      return
    }

    const fetchData = async () => {
      try {
        const [userRes, cartRes, addrRes, shipRes] = await Promise.all([
          axiosClient.get('/user'),
          cartApi.getCart(),
          cartApi.getAddresses().catch(() => ({ data: [] })),
          axiosClient.get('/shipping-methods').catch(() => ({ data: [] })),
        ])

        setUser(userRes.data)
        const allItems = Object.values(cartRes.data || {}).flat()
        // Lọc sản phẩm đã chọn
        const filtered = allItems.filter((item) =>
          selectedItems.map(String).includes(String(item.id))
        )
        setCartItems(filtered)
        if (filtered.length === 0) {
          console.warn('Không tìm thấy sản phẩm đã chọn trong giỏ hàng!')
        }
        // Địa chỉ
        const addrList = addrRes.data || []
        setAddresses(addrList)
        if (addrList.length > 0) {
          setSelectedAddress(addrList.find((a) => a.is_default) || addrList[0])
        }

        // Vận chuyển
        const shipList = shipRes.data || []
        setShippingMethods(shipList)
        if (shipList.length > 0) {
          setSelectedShippingId(shipList[0].id)
          setShippingFee(Number(shipList[0].base_fee))
        }

        // Lấy Voucher (Gộp cả Admin và các Shop có trong giỏ)
        const shopIds = Array.from(
          new Set(filtered.map((i) => i.shop_id))
        ).filter(Boolean)
        const couponRes = await axiosClient.get('/vouchers/checkout', {
          params: { shop_ids: shopIds.join(',') },
        })
        console.log('Voucher từ Backend trả về:', couponRes.data) // Thêm dòng này để debug
        setCoupons(couponRes.data || [])
      } catch (err) {
        console.error('Load checkout error:', err)
      }
    }
    fetchData()
  }, [selectedItems, navigate])

  const totalProductPrice = cartItems.reduce(
    (sum, i) => sum + Number(i.price) * i.quantity,
    0
  )
  const finalTotal = Math.max(
    0,
    totalProductPrice + shippingFee - discountAmount
  )

  // Hàm "Xịn": Thay đổi địa chỉ (Xoay vòng danh sách)
  const handleChangeAddress = () => {
    if (addresses.length <= 1)
      return alert('Bạn không có địa chỉ khác để thay đổi')
    const currentIndex = addresses.findIndex((a) => a.id === selectedAddress.id)
    const nextIndex = (currentIndex + 1) % addresses.length
    setSelectedAddress(addresses[nextIndex])
  }

  const handleApplyCoupon = async (code) => {
    if (couponApplying) return
    try {
      setCouponApplying(true)
      const res = await couponApi.applyCoupon({
        coupon_code: code,
        cart_item_ids: selectedItems,
      })
      setAppliedCoupon(res.data)
      setDiscountAmount(Number(res.data.discount_amount) || 0)
      setShowCouponModal(false)
      alert('Áp dụng mã thành công!')
    } catch (err) {
      alert(err.response?.data?.message || 'Mã không hợp lệ')
    } finally {
      setCouponApplying(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return alert('Vui lòng chọn địa chỉ')
    setLoading(true)
    try {
      const orderRes = await cartApi.checkout({
        cart_item_ids: selectedItems,
        address_id: selectedAddress.id,
        payment_method_id: paymentMethod,
        shipping_method_id: selectedShippingId,
        coupon_code: appliedCoupon?.code,
      })

      const { order_ids, total_amount } = orderRes.data

      if (paymentMethod === 2) {
        // MOMO
        const res = await paymentApi.createMoMoUrl({
          orderId: order_ids[0],
          amount: total_amount,
        })
        if (res.data.paymentUrl) window.location.href = res.data.paymentUrl
      } else if (paymentMethod === 3) {
        // VNPAY
        const res = await paymentApi.createVNPayUrl({
          orderId: order_ids[0],
          amount: total_amount,
        })
        if (res.data.paymentUrl) window.location.href = res.data.paymentUrl
      } else {
        alert('Đặt hàng thành công!')
        navigate('/orders')
      }
    } catch (err) {
      alert('Lỗi đặt hàng: ' + (err.response?.data?.message || 'Thử lại sau'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px 0' }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ color: '#ee4d2d', marginBottom: '20px' }}>Thanh toán</h2>

        {/* 1. ĐỊA CHỈ NHẬN HÀNG - XỊN */}
        <div
          style={{
            background: '#fff',
            padding: '25px',
            marginBottom: '15px',
            borderTop: '4px solid #ee4d2d',
            borderRadius: '4px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#ee4d2d',
              marginBottom: '15px',
            }}
          >
            <span style={{ fontSize: '20px' }}>📍</span>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Địa chỉ nhận hàng</h3>
          </div>
          {selectedAddress ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <strong style={{ fontSize: '16px' }}>
                  {selectedAddress.recipient_name} (
                  {selectedAddress.recipient_phone})
                </strong>
                <p style={{ margin: '5px 0', color: '#555' }}>
                  {selectedAddress.address_detail}, {selectedAddress.ward},{' '}
                  {selectedAddress.district}, {selectedAddress.city}
                </p>
                {selectedAddress.is_default && (
                  <span
                    style={{
                      color: '#ee4d2d',
                      fontSize: '12px',
                      border: '1px solid #ee4d2d',
                      padding: '0 5px',
                    }}
                  >
                    Mặc định
                  </span>
                )}
              </div>
              <button
                onClick={handleChangeAddress}
                style={{
                  color: '#4080ff',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                THAY ĐỔI
              </button>
            </div>
          ) : (
            <p>Chưa có địa chỉ nào.</p>
          )}
        </div>

        {/* 2. DANH SÁCH SẢN PHẨM */}
        <div
          style={{ background: '#fff', padding: '20px', marginBottom: '15px' }}
        >
          <div
            style={{
              display: 'flex',
              paddingBottom: '15px',
              borderBottom: '1px solid #eee',
              color: '#888',
              fontSize: '14px',
            }}
          >
            <div style={{ flex: 6 }}>Sản phẩm</div>
            <div style={{ flex: 2, textAlign: 'center' }}>Đơn giá</div>
            <div style={{ flex: 1, textAlign: 'center' }}>Số lượng</div>
            <div style={{ flex: 2, textAlign: 'right' }}>Thành tiền</div>
          </div>
          {cartItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '15px 0',
                borderBottom: '1px solid #f9f9f9',
              }}
            >
              <div style={{ flex: 6, display: 'flex', gap: '15px' }}>
                <img
                  src={item.image}
                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                  alt=""
                />
                <div>
                  <div style={{ fontSize: '14px' }}>{item.product_name}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    Loại: {item.sku_code}
                  </div>
                </div>
              </div>
              <div style={{ flex: 2, textAlign: 'center' }}>
                {Number(item.price).toLocaleString()}đ
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                x{item.quantity}
              </div>
              <div style={{ flex: 2, textAlign: 'right', fontWeight: '500' }}>
                {(item.price * item.quantity).toLocaleString()}đ
              </div>
            </div>
          ))}
        </div>

        {/* 3. VẬN CHUYỂN & THANH TOÁN */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            marginBottom: '15px',
          }}
        >
          <div style={{ background: '#fff', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>
              Đơn vị vận chuyển
            </h3>
            {shippingMethods.map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  setSelectedShippingId(m.id)
                  setShippingFee(Number(m.base_fee))
                }}
                style={{
                  padding: '12px',
                  border:
                    selectedShippingId === m.id
                      ? '1px solid #ee4d2d'
                      : '1px solid #eee',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{m.name}</span>
                <span style={{ fontWeight: '500' }}>
                  {Number(m.base_fee).toLocaleString()}đ
                </span>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>
              Phương thức thanh toán
            </h3>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <button
                onClick={() => setPaymentMethod(1)}
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  border:
                    paymentMethod === 1
                      ? '1px solid #ee4d2d'
                      : '1px solid #eee',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                💵 Thanh toán khi nhận hàng (COD)
              </button>
              <button
                onClick={() => setPaymentMethod(2)}
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  border:
                    paymentMethod === 2
                      ? '1px solid #ee4d2d'
                      : '1px solid #eee',
                  background: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
                  width="20"
                  alt=""
                />{' '}
                Ví MoMo
              </button>
              <button
                onClick={() => setPaymentMethod(3)}
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  border:
                    paymentMethod === 3
                      ? '1px solid #ee4d2d'
                      : '1px solid #eee',
                  background: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <img src={logoVnPay} width="20" alt="" /> Cổng VNPay
              </button>
            </div>
          </div>
        </div>

        {/* 4. VOUCHER & TỔNG KẾT */}
        <div
          style={{ background: '#fff', padding: '20px', borderRadius: '4px' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '20px',
              borderBottom: '1px dashed #eee',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#ee4d2d', fontSize: '20px' }}>🎟️</span>
              <strong>Shopii Voucher</strong>
              {appliedCoupon && (
                <span
                  style={{
                    background: '#ee4d2d',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '2px',
                  }}
                >
                  {appliedCoupon.code}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowCouponModal(true)}
              style={{
                color: '#05a',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
              }}
            >
              Chọn hoặc nhập mã
            </button>
          </div>

          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <p style={{ color: '#888' }}>
              Tổng tiền hàng: {totalProductPrice.toLocaleString()}đ
            </p>
            <p style={{ color: '#888' }}>
              Phí vận chuyển: {shippingFee.toLocaleString()}đ
            </p>
            {discountAmount > 0 && (
              <p style={{ color: '#ee4d2d' }}>
                Giảm giá Voucher: -{discountAmount.toLocaleString()}đ
              </p>
            )}
            <div style={{ margin: '20px 0' }}>
              <span style={{ fontSize: '16px' }}>Tổng thanh toán: </span>
              <span
                style={{
                  fontSize: '28px',
                  color: '#ee4d2d',
                  fontWeight: 'bold',
                }}
              >
                {finalTotal.toLocaleString()}đ
              </span>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              style={{
                padding: '12px 60px',
                background: '#ee4d2d',
                color: '#fff',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: '18px',
              }}
            >
              {loading ? 'ĐANG XỬ LÝ...' : 'ĐẶT HÀNG'}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL CHỌN VOUCHER - XỊN (CÓ CHECK HẠNG) */}
      {showCouponModal && (
        <div
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
              padding: '25px',
              width: '500px',
              borderRadius: '8px',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Chọn Shopee Voucher</h3>
            {coupons.map((cp) => {
              const isSystem = cp.shop_id === null
              const minOrder = Number(cp.min_order_value || 0)

              // Lấy tổng tiền shop tương ứng (Ép kiểu về String để lấy đúng key trong Map)
              const subtotal = isSystem
                ? totalProductPrice
                : shopSubtotalMap[String(cp.shop_id)] || 0

              const isExpired = new Date(cp.end_date) < new Date()
              const isOutOfStock = cp.usage_limit <= 0
              const isNotEligible = subtotal < minOrder
              const isTierLocked =
                cp.membership_tier_id &&
                Number(user?.membership?.tier?.min_spent || 0) <
                  Number(cp.tier?.min_spent || 0)
              const isError =
                isExpired || isOutOfStock || isTierLocked || isNotEligible

              return (
                <div
                  key={cp.id}
                  style={{
                    display: 'flex',
                    border: '1px solid #eee',
                    marginBottom: '10px',
                    opacity: isError ? 0.6 : 1,
                    background: isError ? '#f9f9f9' : '#fff',
                  }}
                >
                  <div
                    style={{
                      width: '100px',
                      background: isSystem ? '#ee4d2d' : '#26aa99',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '5px',
                    }}
                  >
                    {isSystem ? 'SHOPEE VOUCHER' : 'SELLER VOUCHER'}
                  </div>
                  <div style={{ flex: 1, padding: '10px' }}>
                    <div style={{ fontWeight: 'bold' }}>{cp.code}</div>
                    <div style={{ fontSize: '13px' }}>
                      Giảm{' '}
                      {cp.discount_type === 'percent'
                        ? `${cp.discount_value}%`
                        : `${cp.discount_value.toLocaleString()}đ`}
                    </div>

                    {/* HIỂN THỊ TRẠNG THÁI LỖI */}
                    {isExpired && (
                      <div style={{ color: 'red', fontSize: '11px' }}>
                        ❌ Mã đã hết hạn
                      </div>
                    )}
                    {!isExpired && isOutOfStock && (
                      <div style={{ color: 'red', fontSize: '11px' }}>
                        ❌ Hết lượt sử dụng
                      </div>
                    )}
                    {isTierLocked && (
                      <div style={{ color: '#8b5cf6', fontSize: '11px' }}>
                        🔒 Hạng {cp.tier?.name} mới dùng được
                      </div>
                    )}
                    {!isExpired && !isOutOfStock && isNotEligible && (
                      <div style={{ color: '#ee4d2d', fontSize: '11px' }}>
                        Mua thêm {(minOrder - subtotal).toLocaleString()}đ
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
                      disabled={isError}
                      onClick={() => handleApplyCoupon(cp.code)}
                      style={{
                        padding: '5px 15px',
                        background: isError ? '#ccc' : '#ee4d2d',
                        color: '#fff',
                        border: 'none',
                        cursor: isError ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Dùng
                    </button>
                  </div>
                </div>
              )
            })}
            <button
              onClick={() => setShowCouponModal(false)}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '10px',
                border: '1px solid #ddd',
                background: '#fff',
                cursor: 'pointer',
              }}
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
