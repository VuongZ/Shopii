import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import cartApi from "../api/cartApi";
import couponApi from "../api/couponApi";
import paymentApi from "../api/paymentApi";

import logoVnPay from "../assets/logoVnPay.jpg";

const CheckoutPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const selectedItems = state?.selectedItems || [];

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const [cartItems, setCartItems] = useState([]);

  const [paymentMethod, setPaymentMethod] = useState(1);
  const [loading, setLoading] = useState(false);

  const [coupons, setCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [showCouponModal, setShowCouponModal] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const shippingFee = 30000;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cartRes = await cartApi.getCart();
        const addrRes = await cartApi
          .getAddresses()
          .catch(() => ({ data: [] }));
        const couponRes = await couponApi
          .getCoupons()
          .catch(() => ({ data: [] }));

        const cartData = cartRes.data || {};
        const allItems = Object.values(cartData).flat();

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
      } catch (error) {
        console.error("Checkout load error:", error);
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

  const finalTotal = totalProductPrice + shippingFee - discountAmount;

  const handleApplyCoupon = async (code) => {
    try {
      const res = await couponApi.applyCoupon({
        coupon_code: code,
        order_total: totalProductPrice,
      });

      setAppliedCoupon(res.data);
      setDiscountAmount(res.data.discount_amount);

      setShowCouponModal(false);

      alert(
        `Áp dụng thành công. Giảm ${res.data.discount_amount.toLocaleString()}đ`,
      );
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Mã giảm giá không hợp lệ hoặc chưa đủ điều kiện",
      );
    }
  };

  const handleManualApply = () => {
    if (!manualCode.trim()) {
      alert("Nhập mã giảm giá");
      return;
    }

    handleApplyCoupon(manualCode.trim().toUpperCase());
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert("Vui lòng chọn địa chỉ");
      return;
    }

    setLoading(true);

    try {
      const orderRes = await cartApi.checkout({
        cart_item_ids: selectedItems,
        address_id: selectedAddress.id,
        payment_method_id: paymentMethod,
        shipping_method_id: 1,
        coupon_code: appliedCoupon?.code,
        discount_amount: discountAmount,
      });

      const { order_ids, total_amount, message } = orderRes.data;

      if (paymentMethod === 2) {
        const payRes = await paymentApi.createPaymentUrl({
          orderId: order_ids[0],
          amount: total_amount,
        });

        if (payRes.data.paymentUrl) {
          window.location.href = payRes.data.paymentUrl;
        }
      } else {
        alert(message || "Đặt hàng thành công");
        navigate("/orders");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Đặt hàng thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAddress = () => {
    if (addresses.length === 0) {
      alert("Chưa có địa chỉ");
      return;
    }

    const currentIndex = addresses.findIndex(
      (a) => a.id === selectedAddress.id,
    );

    const nextIndex = (currentIndex + 1) % addresses.length;

    setSelectedAddress(addresses[nextIndex]);
  };

  return (
    <div
      style={{ background: "#f5f5f5", minHeight: "100vh", paddingBottom: 40 }}
    >
      <div style={{ background: "#fff", padding: 20, marginBottom: 20 }}>
        <h2 style={{ color: "#ee4d2d" }}>Thanh toán</h2>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* ADDRESS */}

        <div style={{ background: "#fff", padding: 20, marginBottom: 15 }}>
          <h3>Địa chỉ nhận hàng</h3>

          {selectedAddress ? (
            <div>
              <b>
                {selectedAddress.recipient_name} (+84)
                {selectedAddress.recipient_phone}
              </b>

              <div>
                {selectedAddress.address_detail}, {selectedAddress.ward},{" "}
                {selectedAddress.district}, {selectedAddress.city}
              </div>
            </div>
          ) : (
            <p>Chưa có địa chỉ</p>
          )}

          <button onClick={handleChangeAddress}>Thay đổi</button>
        </div>

        {/* PRODUCTS */}

        <div style={{ background: "#fff", padding: 20, marginBottom: 15 }}>
          {cartItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
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

        {/* PAYMENT */}

        <div style={{ background: "#fff", padding: 20, marginBottom: 15 }}>
          <h3>Phương thức thanh toán</h3>

          <button onClick={() => setPaymentMethod(1)}>
            Thanh toán khi nhận hàng
          </button>

          <button
            onClick={() => setPaymentMethod(2)}
            style={{ marginLeft: 10 }}
          >
            <img src={logoVnPay} alt="" height={20} />
            VNPay
          </button>
        </div>

        {/* VOUCHER */}

        <div style={{ background: "#fff", padding: 20 }}>
          <h3>Voucher</h3>

          {appliedCoupon && <p>Đã áp dụng: {appliedCoupon.code}</p>}

          <div style={{ display: "flex", gap: 10 }}>
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

        <div style={{ background: "#fff", padding: 20, marginTop: 15 }}>
          <div>Tổng tiền hàng: {totalProductPrice.toLocaleString()} đ</div>

          <div>Phí ship: {shippingFee.toLocaleString()} đ</div>

          {discountAmount > 0 && (
            <div>- {discountAmount.toLocaleString()} đ</div>
          )}

          <h2 style={{ color: "#ee4d2d" }}>
            Tổng thanh toán: {finalTotal.toLocaleString()} đ
          </h2>

          <button onClick={handlePlaceOrder} disabled={loading}>
            {loading ? "Đang xử lý..." : "Đặt hàng"}
          </button>
        </div>
      </div>

      {/* COUPON MODAL */}

      {showCouponModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ background: "#fff", padding: 20, width: 400 }}>
            <h3>Chọn voucher</h3>

            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                style={{
                  border: "1px solid #ddd",
                  padding: 10,
                  marginBottom: 10,
                }}
              >
                <b>{coupon.code}</b>

                <div>
                  Giảm{" "}
                  {coupon.discount_type === "percent"
                    ? coupon.discount_value + "%"
                    : coupon.discount_value + "đ"}
                </div>

                <button onClick={() => handleApplyCoupon(coupon.code)}>
                  Dùng
                </button>
              </div>
            ))}

            <button onClick={() => setShowCouponModal(false)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
