import React, { useEffect, useState } from "react";
import orderProcessingApi from "../api/orderProcessingApi";
import SellerOrderManagement from "../components/Orders/SellerOrderManagement";

function getRole() {
  try {
    const raw = localStorage.getItem("USER_INFO");
    const user = raw ? JSON.parse(raw) : null;
    return user?.role;
  } catch {
    return null;
  }
}

export default function SellerOrderManagementPage() {
  const [orders, setOrders] = useState([]);
  const [loadingByOrderId, setLoadingByOrderId] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);

  const role = getRole();
  const isSeller = role === "seller" || role === 2 || role === "2";

  const fetchOrders = async () => {
    try {
      setErrorMessage(null);
      const res = await orderProcessingApi.getSellerOrders();
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Không thể tải đơn hàng.");
      setOrders([]);
    }
  };

  useEffect(() => {
    if (isSeller) fetchOrders();
  }, [isSeller]);

  const withLoading = async (orderId, actionFn) => {
    setLoadingByOrderId((prev) => ({ ...prev, [orderId]: true }));
    try {
      await actionFn(orderId);
      await fetchOrders();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Cập nhật trạng thái thất bại.");
    } finally {
      setLoadingByOrderId((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  if (!isSeller) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontWeight: 900, color: "#b91c1c" }}>Bạn không có quyền.</div>
        <div style={{ color: "#64748b", marginTop: 10 }}>Chỉ seller có thể xem trang này.</div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", padding: "20px 0" }}>
      {errorMessage && (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 15px", marginBottom: 15 }}>
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 8 }}>
            {errorMessage}
          </div>
        </div>
      )}

      <SellerOrderManagement
        orders={orders}
        loadingByOrderId={loadingByOrderId}
        onConfirm={(orderId) => withLoading(orderId, orderProcessingApi.confirmOrder)}
        onShipping={(orderId) => withLoading(orderId, orderProcessingApi.shippingOrder)}
        onComplete={(orderId) => withLoading(orderId, orderProcessingApi.completeOrder)}
        onCancel={(orderId) => withLoading(orderId, orderProcessingApi.cancelOrder)}
      />
    </div>
  );
}

