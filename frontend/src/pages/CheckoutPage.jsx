import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import cartApi from "../api/cartApi";
import logoVnPay from "../assets/logoVnPay.jpg";
const CheckoutPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const selectedItems = state?.selectedItems || [];

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  // --- State cho Coupon ---
  const [coupons, setCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cartRes, addrRes, couponRes] = await Promise.all([
          cartApi.getCart(),
          cartApi.getAddresses().catch(() => ({ data: [] })),
          cartApi.getCoupons().catch(() => ({ data: [] })),
        ]);

        const data = cartRes.data || {};
        const allItems = Object.values(data).flat();
        const filtered = allItems.filter((item) =>
          selectedItems.some((id) => String(id) === String(item.id)),
        );
        setCartItems(filtered);

        const addrList = addrRes.data || [];
        setAddresses(addrList);
        if (addrList.length > 0) {
          const defaultAddr = addrList.find((a) => a.is_default) || addrList[0];
          setSelectedAddress(defaultAddr);
        }

        setCoupons(couponRes.data || []);
      } catch (err) {
        console.error("Lỗi tải trang Checkout:", err);
      }
    };

    if (selectedItems.length > 0) {
      fetchData();
    }
  }, [selectedItems]);

  const totalProductPrice = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );
  const shippingFee = 30000;
  const finalTotal = totalProductPrice + shippingFee - discountAmount;

  const handleManualApply = () => {
    if (!manualCode.trim()) return alert("Vui lòng nhập mã giảm giá!");
    handleApplyCoupon(manualCode.trim().toUpperCase());
  };

  const handleApplyCoupon = async (code) => {
    try {
      const res = await cartApi.applyCoupon({
        coupon_code: code,
        order_total: totalProductPrice,
      });

      setAppliedCoupon(res.data);
      setDiscountAmount(res.data.discount_amount);
      setShowCouponModal(false);
      alert(
        `🎉 Áp dụng thành công! Giảm ${res.data.discount_amount.toLocaleString()}đ`,
      );
    } catch (err) {
      alert(
        err.response?.data?.message || "Mã không hợp lệ hoặc chưa đủ điều kiện",
      );
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return alert("Vui lòng thêm địa chỉ nhận hàng!");
    setLoading(true);
    try {
      const orderResponse = await cartApi.checkout({
        cart_item_ids: selectedItems,
        address_id: selectedAddress.id,
        payment_method_id: paymentMethod,
        shipping_method_id: 1,
        coupon_code: appliedCoupon?.code,
        discount_amount: discountAmount,
      });

      const { order_ids, total_amount, message } = orderResponse.data;

      if (paymentMethod === 2) {
        const vnpayResponse = await cartApi.createPaymentUrl({
          orderId: order_ids[0],
          amount: total_amount,
        });
        if (vnpayResponse.data.paymentUrl) {
          window.location.href = vnpayResponse.data.paymentUrl;
        }
      } else {
        alert(`🎉 ${message}`);
        navigate("/orders");
      }
    } catch (error) {
      alert("Lỗi: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAddress = () => {
    if (addresses.length === 0) return alert("Bạn chưa có địa chỉ nào!");
    const currentIndex = addresses.findIndex(
      (a) => a.id === selectedAddress.id,
    );
    const nextIndex = (currentIndex + 1) % addresses.length;
    setSelectedAddress(addresses[nextIndex]);
  };

  return (
    <div
      style={{
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        paddingBottom: "50px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px 0",
          borderBottom: "1px solid #ddd",
          marginBottom: "15px",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            padding: "0 15px",
            color: "#ee4d2d",
            fontSize: "24px",
            borderLeft: "4px solid #ee4d2d",
            paddingLeft: "15px",
          }}
        >
          Thanh Toán
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 15px" }}>
        {/* ĐỊA CHỈ */}
        <div
          style={{
            backgroundColor: "white",
            padding: "25px",
            borderRadius: "3px",
            marginBottom: "15px",
          }}
        >
          <div
            style={{
              color: "#ee4d2d",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            📍 Địa Chỉ Nhận Hàng
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {selectedAddress ? (
              <div>
                <span style={{ fontWeight: "bold", marginRight: "10px" }}>
                  {selectedAddress.recipient_name} (+84){" "}
                  {selectedAddress.recipient_phone}
                </span>
                <span style={{ color: "#555" }}>
                  {selectedAddress.address_detail}, {selectedAddress.ward},{" "}
                  {selectedAddress.district}, {selectedAddress.city}
                </span>
              </div>
            ) : (
              <div style={{ fontStyle: "italic", color: "#888" }}>
                (Chưa có địa chỉ)
              </div>
            )}
            <button
              onClick={handleChangeAddress}
              style={{
                color: "#4080ff",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              {addresses.length > 0 ? "Thay đổi" : "Thiết lập"}
            </button>
          </div>
        </div>

        {/* SẢN PHẨM */}
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "3px",
            marginBottom: "15px",
          }}
        >
          {cartItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "15px 0",
                borderBottom: "1px dashed #eee",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "15px" }}
              >
                <img
                  src={item.image || "https://via.placeholder.com/50"}
                  alt=""
                  style={{
                    width: "50px",
                    height: "50px",
                    border: "1px solid #eee",
                  }}
                />
                <span>
                  {item.product_name} x{item.quantity}
                </span>
              </div>
              <div style={{ fontWeight: "bold" }}>
                ₫{(item.price * item.quantity).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* PHƯƠNG THỨC THANH TOÁN */}
        <div
          style={{
            backgroundColor: "white",
            padding: "25px",
            borderRadius: "3px",
            marginBottom: "15px",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              borderBottom: "1px solid #eee",
              paddingBottom: "15px",
            }}
          >
            Phương thức thanh toán
          </h3>
          <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
            <button
              onClick={() => setPaymentMethod(1)}
              style={{
                padding: "15px 20px",
                border:
                  paymentMethod === 1 ? "1px solid #ee4d2d" : "1px solid #ddd",
                color: paymentMethod === 1 ? "#ee4d2d" : "#333",
                backgroundColor: paymentMethod === 1 ? "#fffcfb" : "white",
                cursor: "pointer",
              }}
            >
              Thanh toán khi nhận hàng
            </button>
            <button
              onClick={() => setPaymentMethod(2)}
              style={{
                padding: "15px 20px",
                border:
                  paymentMethod === 2 ? "1px solid #ee4d2d" : "1px solid #ddd",
                color: paymentMethod === 2 ? "#ee4d2d" : "#333",
                backgroundColor: paymentMethod === 2 ? "#fffcfb" : "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <img src={logoVnPay} style={{ height: "20px" }} /> Ví VNPay
            </button>
          </div>
        </div>

        {/* TỔNG TIỀN */}
        <div
          style={{
            backgroundColor: "#fffefb",
            padding: "25px",
            borderTop: "1px solid #ddd",
          }}
        >
          <div
            style={{
              marginBottom: "20px",
              paddingBottom: "20px",
              borderBottom: "1px dashed #eee",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "#ee4d2d",
                }}
              >
                <span>🎟️ Shopii Voucher</span>
                {appliedCoupon && (
                  <span
                    style={{
                      border: "1px solid #ee4d2d",
                      padding: "2px 5px",
                      fontSize: "12px",
                      background: "#fff5f5",
                    }}
                  >
                    Đã dùng: {appliedCoupon.code}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowCouponModal(true)}
                style={{
                  color: "#05a",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Chọn Voucher có sẵn
              </button>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder="Nhập mã giảm giá"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "2px",
                  outline: "none",
                }}
              />
              <button
                onClick={handleManualApply}
                style={{
                  backgroundColor: "#333",
                  color: "white",
                  border: "none",
                  padding: "0 20px",
                  cursor: "pointer",
                  borderRadius: "2px",
                }}
              >
                Áp dụng
              </button>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ marginBottom: "10px" }}>
              Tổng tiền hàng: ₫{totalProductPrice.toLocaleString()}
            </div>
            <div style={{ marginBottom: "10px" }}>
              Phí vận chuyển: ₫{shippingFee.toLocaleString()}
            </div>
            {discountAmount > 0 && (
              <div style={{ marginBottom: "10px", color: "#ee4d2d" }}>
                Voucher giảm giá: -₫{discountAmount.toLocaleString()}
              </div>
            )}
            <div
              style={{
                fontSize: "24px",
                color: "#ee4d2d",
                fontWeight: "bold",
                marginBottom: "20px",
                marginTop: "20px",
              }}
            >
              Tổng thanh toán: ₫{finalTotal.toLocaleString()}
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              style={{
                backgroundColor: "#ee4d2d",
                color: "white",
                border: "none",
                padding: "15px 60px",
                fontSize: "16px",
                borderRadius: "2px",
                cursor: "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Đang xử lý..." : "Đặt Hàng"}
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL DANH SÁCH COUPON (UPDATED) --- */}
      {showCouponModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              width: "450px",
              borderRadius: "5px",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#ee4d2d" }}>
              Chọn Shopii Voucher
            </h3>

            {coupons.length === 0 ? (
              <p>Hiện không có mã giảm giá nào.</p>
            ) : (
              coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  style={{
                    border: "1px solid #eee",
                    padding: "15px",
                    marginBottom: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#fcfcfc",
                    opacity: coupon.usage_limit > 0 ? 1 : 0.6, // Mờ đi nếu hết lượt
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: "bold",
                        color: "#333",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      {coupon.code}
                      {/* Hiển thị số lượt còn lại */}
                      {coupon.usage_limit > 0 ? (
                        <span
                          style={{
                            fontSize: "10px",
                            backgroundColor: "#e8f5e9",
                            color: "green",
                            padding: "2px 6px",
                            borderRadius: "10px",
                          }}
                        >
                          Còn {coupon.usage_limit} lượt
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "10px",
                            backgroundColor: "#ffebee",
                            color: "red",
                            padding: "2px 6px",
                            borderRadius: "10px",
                          }}
                        >
                          Hết lượt
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#555",
                        marginTop: "5px",
                      }}
                    >
                      Giảm{" "}
                      {coupon.discount_type === "percent"
                        ? `${coupon.discount_value}%`
                        : `${Number(coupon.discount_value).toLocaleString()}đ`}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888" }}>
                      Đơn tối thiểu:{" "}
                      {Number(coupon.min_order_value).toLocaleString()}đ
                    </div>
                  </div>
                  <button
                    onClick={() => handleApplyCoupon(coupon.code)}
                    disabled={coupon.usage_limit <= 0} // Vô hiệu hóa nếu hết lượt
                    style={{
                      backgroundColor:
                        coupon.usage_limit > 0 ? "#ee4d2d" : "#ccc",
                      color: "white",
                      border: "none",
                      padding: "8px 15px",
                      cursor:
                        coupon.usage_limit > 0 ? "pointer" : "not-allowed",
                      borderRadius: "2px",
                    }}
                  >
                    {coupon.usage_limit > 0 ? "Dùng ngay" : "Hết mã"}
                  </button>
                </div>
              ))
            )}

            <button
              onClick={() => setShowCouponModal(false)}
              style={{
                marginTop: "15px",
                width: "100%",
                padding: "10px",
                color: "#333",
                border: "1px solid #ddd",
                background: "white",
                cursor: "pointer",
              }}
            >
              Đóng lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
