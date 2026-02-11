import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import cartApi from "../api/cartApi";

const CheckoutPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const selectedItems = state?.selectedItems || [];

  const [addressId] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const fetchSelectedData = async () => {
      try {
        const response = await cartApi.getCart();
        const data = response.data || {};

        const allItems = Object.values(data).flat();

        const filtered = allItems.filter((item) => {
          return selectedItems.some(
            (selectedId) => String(selectedId) === String(item.id),
          );
        });
        setCartItems(filtered);
        // Kiểm tra trong Console
        console.log("Dữ liệu gốc từ DB:", data);
        console.log("Mảng ID chọn từ Giỏ hàng:", selectedItems);
        console.log("Kết quả sau khi lọc:", filtered);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu Checkout:", err);
      }
    };
    if (selectedItems && selectedItems.length > 0) {
      fetchSelectedData();
    }
  }, [selectedItems]);

  const totalProductPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shippingFee = 30000;

  const handlePlaceOrder = async () => {
    if (selectedItems.length === 0) return alert("Vui lòng chọn sản phẩm!");
    setLoading(true);
    try {
      await cartApi.checkout({
        cart_item_ids: selectedItems,
        address_id: addressId,
        payment_method_id: paymentMethod,
        shipping_method_id: 1,
      });
      alert("🎉 Đặt hàng thành công!");
      navigate("/orders");
    } catch (error) {
      alert(
        "Lỗi đặt hàng: " + (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Style Objects (Thay thế cho Tailwind) ---
  const styles = {
    container: {
      backgroundColor: "#f5f5f5",
      minHeight: "100vh",
      paddingBottom: "50px",
      fontFamily: "Arial, sans-serif",
    },
    header: {
      backgroundColor: "#white",
      borderBottom: "1px solid #eee",
      padding: "20px 0",
      marginBottom: "20px",
    },
    innerContent: { maxWidth: "1000px", margin: "0 auto", padding: "0 15px" },
    section: {
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "3px",
      boxShadow: "0 1px 1px rgba(0,0,0,0.05)",
      marginBottom: "15px",
    },
    addressBorder: {
      height: "3px",
      width: "100%",
      background:
        "repeating-linear-gradient(45deg, #6fa6d6, #6fa6d6 33px, transparent 0, transparent 66px, #f18d9b 0, #f18d9b 99px, transparent 0, transparent 132px)",
      position: "absolute",
      top: 0,
      left: 0,
    },
    orangeTitle: {
      color: "#ee4d2d",
      fontSize: "18px",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "15px",
    },
    productHeader: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 1fr",
      color: "#888",
      fontSize: "14px",
      paddingBottom: "10px",
      borderBottom: "1px solid #f1f1f1",
    },
    productRow: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 1fr",
      alignItems: "center",
      padding: "15px 0",
      borderBottom: "1px solid #f9f9f9",
    },
    paymentBtn: (active) => ({
      padding: "10px 20px",
      border: active ? "1px solid #ee4d2d" : "1px solid #ddd",
      color: active ? "#ee4d2d" : "#555",
      backgroundColor: active ? "#fffcfb" : "white",
      cursor: "pointer",
      marginRight: "10px",
    }),
    summaryRow: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "50px",
      marginBottom: "10px",
      fontSize: "14px",
      color: "#666",
    },
    totalPrice: { color: "#ee4d2d", fontSize: "28px", fontWeight: "bold" },
    orderBtn: {
      backgroundColor: "#ee4d2d",
      color: "white",
      border: "none",
      padding: "15px 60px",
      fontSize: "18px",
      borderRadius: "2px",
      cursor: "pointer",
      transition: "0.2s",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.innerContent}>
          <h1
            style={{
              color: "#ee4d2d",
              margin: 0,
              fontSize: "24px",
              borderLeft: "3px solid #ee4d2d",
              paddingLeft: "15px",
            }}
          >
            Thanh Toán
          </h1>
        </div>
      </div>

      <div style={styles.innerContent}>
        {/* Địa chỉ */}
        <div style={{ ...styles.section, position: "relative" }}>
          <div style={styles.addressBorder}></div>
          <div style={styles.orangeTitle}>📍 Địa Chỉ Nhận Hàng</div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong style={{ fontSize: "16px" }}>
                Nguyễn Văn A (+84 987654321)
              </strong>
              <span style={{ marginLeft: "20px", color: "#555" }}>
                Số 123, Đường ABC, Quận 1, TP. Hồ Chí Minh
              </span>
              <span
                style={{
                  marginLeft: "10px",
                  border: "1px solid #ee4d2d",
                  color: "#ee4d2d",
                  fontSize: "10px",
                  padding: "1px 4px",
                  textTransform: "uppercase",
                }}
              >
                Mặc định
              </span>
            </div>
            <button
              style={{
                background: "none",
                border: "none",
                color: "#0055aa",
                cursor: "pointer",
              }}
            >
              Thay đổi
            </button>
          </div>
        </div>

        {/* Sản phẩm */}
        <div style={styles.section}>
          <div style={styles.productHeader}>
            <div>Sản phẩm</div>
            <div style={{ textAlign: "center" }}>Đơn giá</div>
            <div style={{ textAlign: "center" }}>Số lượng</div>
            <div style={{ textAlign: "right" }}>Thành tiền</div>
          </div>
          {cartItems.map((item) => (
            <div key={item.id} style={styles.productRow}>
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
                <span style={{ fontSize: "14px" }}>{item.name}</span>
              </div>
              <div style={{ textAlign: "center" }}>
                ₫{Number(item.price).toLocaleString()}
              </div>
              <div style={{ textAlign: "center" }}>{item.quantity}</div>
              <div style={{ textAlign: "right", fontWeight: "bold" }}>
                ₫{(item.price * item.quantity).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Thanh toán */}
        <div style={styles.section}>
          <h3
            style={{
              borderBottom: "1px solid #eee",
              paddingBottom: "15px",
              marginTop: 0,
            }}
          >
            Phương thức thanh toán
          </h3>
          <div style={{ marginTop: "20px" }}>
            <button
              style={styles.paymentBtn(paymentMethod === 1)}
              onClick={() => setPaymentMethod(1)}
            >
              Thanh toán khi nhận hàng (COD)
            </button>
            <button
              style={{
                ...styles.paymentBtn(false),
                opacity: 0.5,
                cursor: "not-allowed",
              }}
              disabled
            >
              Ví ShopeePay (Bảo trì)
            </button>
          </div>
        </div>

        {/* Tổng kết và nút đặt hàng */}
        <div
          style={{
            ...styles.section,
            backgroundColor: "#fffefb",
            borderTop: "1px dashed #ddd",
            textAlign: "right",
          }}
        >
          <div style={styles.summaryRow}>
            <span>Tổng tiền hàng:</span>
            <span>₫{totalProductPrice.toLocaleString()}</span>
          </div>
          <div style={styles.summaryRow}>
            <span>Phí vận chuyển:</span>
            <span>₫{shippingFee.toLocaleString()}</span>
          </div>
          <div
            style={{
              ...styles.summaryRow,
              alignItems: "center",
              marginTop: "15px",
            }}
          >
            <span style={{ fontSize: "16px" }}>Tổng thanh toán:</span>
            <span style={styles.totalPrice}>
              ₫{(totalProductPrice + shippingFee).toLocaleString()}
            </span>
          </div>
          <div
            style={{
              marginTop: "30px",
              borderTop: "1px solid #eee",
              paddingTop: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#888", fontSize: "12px" }}>
              Nhấn "Đặt hàng" đồng nghĩa với việc bạn đồng ý tuân theo Điều
              khoản Shopii
            </span>
            <button
              onClick={handlePlaceOrder}
              disabled={loading || cartItems.length === 0}
              style={{ ...styles.orderBtn, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Đang xử lý..." : "Đặt Hàng"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
