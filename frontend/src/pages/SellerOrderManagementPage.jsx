<<<<<<< HEAD
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

=======
import React, { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'

const SellerOrderManagementPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, confirmed, shipping, completed, cancelled

  // State lưu trạng thái Bật/Tắt
  const [autoConfirm, setAutoConfirm] = useState(false)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await axiosClient.get('/seller/orders')
      setOrders(res.data || [])
    } catch (error) {
      console.error('Lỗi lấy đơn hàng:', error)
    } finally {
      setLoading(false)
    }
  }

  // 1. Hàm lấy cấu hình Auto Confirm hiện tại từ Backend
  const fetchSettings = async () => {
    try {
      const res = await axiosClient.get('/seller/settings/auto-confirm')
      setAutoConfirm(res.data.auto_confirm)
    } catch (error) {
      console.error('Lỗi lấy setting:', error)
    }
  }

  // 2. Chạy cả 2 hàm lấy dữ liệu khi mới vào trang
  useEffect(() => {
    fetchOrders()
    fetchSettings()
  }, [])

  // 3. Hàm xử lý khi người dùng gạt nút Toggle
  const handleToggleAutoConfirm = async (e) => {
    const newValue = e.target.checked
    setAutoConfirm(newValue) // Đổi UI liền cho mượt (Optimistic UI)

    try {
      // Gọi API xuống Laravel để lưu vào Cache
      await axiosClient.post('/seller/settings/auto-confirm', {
        auto_confirm: newValue,
      })
      alert(
        newValue ? 'Đã BẬT tự động duyệt đơn mới!' : 'Đã TẮT tự động duyệt đơn.'
      )
    } catch (error) {
      alert('Lỗi khi lưu cấu hình!')
      setAutoConfirm(!newValue) // Nếu gọi API lỗi thì giật cái nút về lại vị trí cũ
    }
  }

  // Hàm cập nhật trạng thái đơn hàng (Duyệt/Hủy/Giao hàng)
  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!window.confirm('Bạn có chắc chắn muốn chuyển trạng thái đơn này?'))
      return
    try {
      await axiosClient.put(`/seller/orders/${orderId}/status`, {
        status: newStatus,
      })
      alert('Cập nhật trạng thái thành công!')
      fetchOrders() // Load lại list
    } catch (error) {
      alert('Cập nhật thất bại!')
      console.error(error)
    }
  }

  const filteredOrders =
    filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  // Helper dịch trạng thái sang Tiếng Việt
  const getStatusText = (status) => {
    const statusMap = {
      pending: { text: 'Chờ xác nhận', color: '#f59e0b' },
      confirmed: { text: 'Chờ lấy hàng', color: '#3b82f6' },
      shipping: { text: 'Đang giao', color: '#8b5cf6' },
      completed: { text: 'Hoàn thành', color: '#10b981' },
      cancelled: { text: 'Đã hủy', color: '#ef4444' },
      refunded: { text: 'Đã hoàn tiền', color: '#64748b' },
    }
    return statusMap[status] || { text: status, color: '#000' }
  }

  if (loading) return <div>Đang tải đơn hàng...</div>

  return (
    <div className="seller-content">
      <div className="shop-header">
        <h2>Quản lý Đơn hàng</h2>

        {/* NÚT BẬT TẮT AUTO DUYỆT ĐƠN ĐÃ GẮN API */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563' }}
          >
            Tự động duyệt đơn mới:
          </span>
          <label className="switch">
            <input
              type="checkbox"
              checked={autoConfirm}
              onChange={handleToggleAutoConfirm}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      {/* CÁC TAB LỌC TRẠNG THÁI */}
      <div className="order-tabs">
        {[
          'all',
          'pending',
          'confirmed',
          'shipping',
          'completed',
          'cancelled',
        ].map((st) => (
          <button
            key={st}
            className={`order-tab-btn ${filter === st ? 'active' : ''}`}
            onClick={() => setFilter(st)}
          >
            {st === 'all' ? 'Tất cả' : getStatusText(st).text}
          </button>
        ))}
      </div>

      {/* DANH SÁCH ĐƠN HÀNG */}
      <div className="order-list">
        {filteredOrders.length === 0 ? (
          <p
            style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}
          >
            Không có đơn hàng nào.
          </p>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-card-header">
                <b>Mã đơn: #{order.id}</b>
                <span
                  style={{
                    color: getStatusText(order.status).color,
                    fontWeight: 'bold',
                  }}
                >
                  {getStatusText(order.status).text}
                </span>
              </div>

              <div className="order-card-body">
                <div className="order-info">
                  <p>
                    <b>Khách hàng:</b> {order.user_name || 'Khách hàng'}
                  </p>
                  <p>
                    <b>Thanh toán:</b>{' '}
                    {order.payment_status === 'paid'
                      ? '✅ Đã thanh toán'
                      : '⏳ Chưa thanh toán'}
                    {/* Hiển thị thêm tên phương thức nếu có */}
                    {order.payment_method && (
                      <span
                        style={{
                          marginLeft: '8px',
                          color: '#6366f1',
                          fontWeight: '500',
                          fontSize: '13px',
                          background: '#e0e7ff',
                          padding: '2px 8px',
                          borderRadius: '12px',
                        }}
                      >
                        {order.payment_method.name}
                      </span>
                    )}
                  </p>
                  <p>
                    <b>Tổng tiền:</b>{' '}
                    <span className="price">
                      {Number(order.final_total).toLocaleString()}đ
                    </span>
                  </p>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>
                    Ngày đặt:{' '}
                    {new Date(order.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>

                <div className="order-actions">
                  {/* Nếu đang chờ xác nhận -> Hiển thị nút Duyệt & Hủy */}
                  {order.status === 'pending' && (
                    <>
                      <button
                        className="btn-confirm"
                        onClick={() =>
                          handleUpdateStatus(order.id, 'confirmed')
                        }
                      >
                        Duyệt đơn
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() =>
                          handleUpdateStatus(order.id, 'cancelled')
                        }
                      >
                        Hủy đơn
                      </button>
                    </>
                  )}

                  {/* Nếu đã xác nhận -> Hiển thị nút Giao cho vận chuyển */}
                  {order.status === 'confirmed' && (
                    <button
                      className="btn-ship"
                      onClick={() => handleUpdateStatus(order.id, 'shipping')}
                    >
                      Giao cho ĐVVC
                    </button>
                  )}

                  {/* Đang giao hàng (Shop không tự bấm hoàn thành được, do khách hoặc ĐVVC bấm) */}
                  {order.status === 'shipping' && (
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      Đang vận chuyển...
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SellerOrderManagementPage
>>>>>>> cbd0a3bf9099cb1d16b1cfcb7fc0ead8091cd1ec
