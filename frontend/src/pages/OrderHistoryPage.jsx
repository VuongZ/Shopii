import React, { useEffect, useState } from "react";
import cartApi from "../api/cartApi";
import { Link } from "react-router-dom";

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await cartApi.getMyOrders();
        setOrders(res.data);
      } catch (error) {
        console.error("Lỗi tải đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div style={{padding: "20px", textAlign: "center"}}>Đang tải đơn hàng...</div>;

  return (
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh", padding: "20px 0" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 15px" }}>
        <h2 style={{ marginBottom: "20px", color: "#333" }}>Đơn hàng của tôi</h2>

        {orders.length === 0 ? (
          <div style={{ textAlign: "center", backgroundColor: "white", padding: "50px", borderRadius: "3px" }}>
             <p>Bạn chưa có đơn hàng nào.</p>
             <Link to="/" style={{ color: "#ee4d2d", textDecoration: "none" }}>Mua sắm ngay</Link>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} style={{ backgroundColor: "white", marginBottom: "15px", borderRadius: "3px", padding: "20px" }}>
              {/* Header đơn hàng: Tên Shop & Trạng thái */}
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "10px" }}>
                 <div style={{ fontWeight: "bold" }}>{order.shop?.name || "Shopii Mall"}</div>
                 <div style={{ color: getStatusColor(order.status), textTransform: "uppercase", fontSize: "14px" }}>
                    {translateStatus(order.status)} | {translatePaymentStatus(order.payment_status)}
                 </div>
              </div>

              {/* Danh sách sản phẩm trong đơn */}
              {order.items.map((item) => (
                <div key={item.id} style={{ display: "flex", gap: "15px", marginBottom: "10px", borderBottom: "1px dashed #f9f9f9", paddingBottom: "10px" }}>
                   <img 
                      src={item.sku?.product?.image || "https://via.placeholder.com/80"} 
                      alt="" 
                      style={{ width: "80px", height: "80px", border: "1px solid #eee", objectFit: "cover" }}
                   />
                   <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "16px", marginBottom: "5px" }}>{item.sku?.product?.name}</div>
                      <div style={{ color: "#777", fontSize: "14px" }}>Phân loại: {item.sku?.sku || "Mặc định"}</div>
                      <div style={{ marginTop: "5px" }}>x{item.quantity}</div>
                   </div>
                   <div style={{ textAlign: "right" }}>
                      {/* Giá gốc (nếu có) có thể gạch ngang */}
                      <div style={{ color: "#ee4d2d", fontWeight: "bold" }}>₫{Number(item.price).toLocaleString()}</div>
                   </div>
                </div>
              ))}

              {/* Tổng tiền & Nút bấm */}
              <div style={{ textAlign: "right", borderTop: "1px solid #eee", paddingTop: "15px" }}>
                  <div style={{ marginBottom: "10px" }}>
                      Thành tiền: <span style={{ fontSize: "20px", color: "#ee4d2d", fontWeight: "bold" }}>₫{Number(order.final_total).toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                      {order.status === 'pending' && (
                         <button style={{ padding: "8px 20px", border: "1px solid #ddd", background: "white", cursor: "pointer" }}>Hủy đơn hàng</button>
                      )}
                      <button style={{ padding: "8px 20px", backgroundColor: "#ee4d2d", color: "white", border: "none", cursor: "pointer" }}>Mua lại</button>
                  </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Hàm phụ trợ: Dịch trạng thái sang tiếng Việt
const translateStatus = (status) => {
    switch(status) {
        case 'pending': return 'Chờ xác nhận';
        case 'shipping': return 'Đang giao';
        case 'completed': return 'Hoàn thành';
        case 'cancelled': return 'Đã hủy';
        default: return status;
    }
};

const translatePaymentStatus = (status) => {
    return status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán';
};

const getStatusColor = (status) => {
    if (status === 'completed') return '#26aa99'; // Xanh
    if (status === 'cancelled') return '#888'; // Xám
    return '#ee4d2d'; // Cam
};

export default OrderHistoryPage;