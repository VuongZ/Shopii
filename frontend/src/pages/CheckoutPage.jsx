import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import cartApi from "../api/cartApi";

const CheckoutPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const selectedItems = state?.selectedItems || [];

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(1); // 1: COD, 2: VNPay
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Gọi API lấy Giỏ hàng & Địa chỉ song song
        const [cartRes, addrRes] = await Promise.all([
          cartApi.getCart(),
          cartApi.getAddresses().catch((err) => {
             console.log("Chưa có API địa chỉ, dùng mảng rỗng");
             return { data: [] };
          }) 
        ]);

        // 1. Xử lý Giỏ hàng
        const data = cartRes.data || {};
        const allItems = Object.values(data).flat();
        const filtered = allItems.filter((item) =>
          selectedItems.some((id) => String(id) === String(item.id))
        );
        setCartItems(filtered);

        // 2. Xử lý Địa chỉ (Lấy từ SQL)
        const addrList = addrRes.data || [];
        setAddresses(addrList);
        
        // Tự động chọn địa chỉ mặc định
        if (addrList.length > 0) {
           const defaultAddr = addrList.find(a => a.is_default) || addrList[0];
           setSelectedAddress(defaultAddr);
        }

      } catch (err) {
        console.error("Lỗi tải trang Checkout:", err);
      }
    };

    if (selectedItems.length > 0) {
      fetchData();
    }
  }, [selectedItems]);

  const totalProductPrice = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity, 0
  );
  const shippingFee = 30000;

  // --- Xử lý Đặt hàng ---
  const handlePlaceOrder = async () => {
    if (!selectedAddress) return alert("Vui lòng thêm địa chỉ nhận hàng!");
    setLoading(true);
    try {
      const orderResponse = await cartApi.checkout({
        cart_item_ids: selectedItems,
        address_id: selectedAddress.id, // ID thật từ SQL
        payment_method_id: paymentMethod,
        shipping_method_id: 1,
      });

      const { order_ids, total_amount, message } = orderResponse.data;

      if (paymentMethod === 2) {
        // --- VNPay ---
        const vnpayResponse = await cartApi.createPaymentUrl({
          orderId: order_ids[0],
          amount: total_amount,
        });
        if (vnpayResponse.data.paymentUrl) {
          window.location.href = vnpayResponse.data.paymentUrl;
        }
      } else {
        // --- COD ---
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
     if(addresses.length === 0) return alert("Bạn chưa có địa chỉ nào!");
     // Logic đổi vòng tròn đơn giản
     const currentIndex = addresses.findIndex(a => a.id === selectedAddress.id);
     const nextIndex = (currentIndex + 1) % addresses.length;
     setSelectedAddress(addresses[nextIndex]);
  };

  return (
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh", paddingBottom: "50px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ backgroundColor: "white", padding: "20px 0", borderBottom: "1px solid #ddd", marginBottom: "15px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 15px", color: "#ee4d2d", fontSize: "24px", borderLeft: "4px solid #ee4d2d", paddingLeft: "15px" }}>
           Thanh Toán
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 15px" }}>
        
        {/* --- 1. ĐỊA CHỈ (Dữ liệu thật) --- */}
        <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "3px", marginBottom: "15px", boxShadow: "0 1px 1px rgba(0,0,0,0.05)" }}>
           <div style={{ color: "#ee4d2d", fontSize: "18px", display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
              📍 Địa Chỉ Nhận Hàng
           </div>
           
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {selectedAddress ? (
                  <div>
                     <span style={{ fontWeight: "bold", marginRight: "10px" }}>{selectedAddress.recipient_name} (+84) {selectedAddress.recipient_phone}</span>
                     <span style={{ color: "#555" }}>{selectedAddress.address_detail}, {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.city}</span>
                     {selectedAddress.is_default === 1 && <span style={{ marginLeft: "15px", border: "1px solid #ee4d2d", color: "#ee4d2d", fontSize: "12px", padding: "2px 5px" }}>Mặc định</span>}
                  </div>
              ) : (
                  <div style={{fontStyle: "italic", color: "#888"}}>
                      (Không tìm thấy địa chỉ. Vui lòng thêm địa chỉ trong SQL hoặc trang cá nhân)
                  </div>
              )}
              
              <button 
                 onClick={handleChangeAddress}
                 style={{ color: "#4080ff", background: "none", border: "none", cursor: "pointer", textTransform: "uppercase", fontWeight: "bold" }}
              >
                 {addresses.length > 0 ? "Thay đổi" : "Thiết lập"}
              </button>
           </div>
        </div>

        {/* --- 2. SẢN PHẨM --- */}
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "3px", marginBottom: "15px" }}>
           {cartItems.map(item => (
               <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 0", borderBottom: "1px dashed #eee" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                       <img src={item.image || "https://via.placeholder.com/50"} alt="" style={{ width: "50px", height: "50px", border: "1px solid #eee" }}/>
                       <span>{item.product_name}</span>
                   </div>
                   <div style={{color: "#555"}}>Đơn giá: ₫{Number(item.price).toLocaleString()}</div>
                   <div>x{item.quantity}</div>
                   <div style={{fontWeight: "bold"}}>₫{(item.price * item.quantity).toLocaleString()}</div>
               </div>
           ))}
        </div>

        {/* --- 3. PHƯƠNG THỨC THANH TOÁN (Mới) --- */}
        <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "3px", marginBottom: "15px" }}>
           <h3 style={{ marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "15px" }}>Phương thức thanh toán</h3>
           <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
               {/* COD */}
               <button 
                  onClick={() => setPaymentMethod(1)}
                  style={{ 
                      padding: "15px 20px", 
                      border: paymentMethod === 1 ? "1px solid #ee4d2d" : "1px solid #ddd",
                      color: paymentMethod === 1 ? "#ee4d2d" : "#333",
                      backgroundColor: paymentMethod === 1 ? "#fffcfb" : "white",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
                  }}
               >
                   Thanh toán khi nhận hàng
               </button>

               {/* VNPay */}
               <button 
                  onClick={() => setPaymentMethod(2)}
                  style={{ 
                      padding: "15px 20px", 
                      border: paymentMethod === 2 ? "1px solid #ee4d2d" : "1px solid #ddd",
                      color: paymentMethod === 2 ? "#ee4d2d" : "#333",
                      backgroundColor: paymentMethod === 2 ? "#fffcfb" : "white",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
                  }}
               >
                   <img src="https://sandbox.vnpayment.vn/paymentv2/images/logo-vnpay.svg" alt="VNPay" style={{ height: "20px" }}/>
                   Ví VNPay (QR Code / ATM)
               </button>
           </div>
        </div>

        {/* --- 4. TỔNG TIỀN --- */}
        <div style={{ backgroundColor: "#fffefb", padding: "25px", borderTop: "1px solid #ddd", textAlign: "right" }}>
            <div style={{marginBottom: "10px"}}>Tổng tiền hàng: ₫{totalProductPrice.toLocaleString()}</div>
            <div style={{marginBottom: "20px", borderBottom: "1px dashed #eee", paddingBottom: "20px"}}>Phí vận chuyển: ₫{shippingFee.toLocaleString()}</div>
            
            <div style={{ fontSize: "20px", color: "#ee4d2d", fontWeight: "bold", marginBottom: "20px" }}>
                Tổng thanh toán: ₫{(totalProductPrice + shippingFee).toLocaleString()}
            </div>
            
            <button 
                onClick={handlePlaceOrder}
                disabled={loading}
                style={{ 
                    backgroundColor: "#ee4d2d", color: "white", border: "none", 
                    padding: "15px 60px", fontSize: "16px", borderRadius: "2px", cursor: "pointer",
                    opacity: loading ? 0.7 : 1
                }}
            >
                {loading ? "Đang xử lý..." : "Đặt Hàng"}
            </button>
        </div>

      </div>
    </div>
  );
};

export default CheckoutPage;