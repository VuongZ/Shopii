import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Menu, X, Bell, MessageCircle } from 'lucide-react'

import userApi from './api/userApi'
import chatApi from './api/chatApi'
import UsersPage from './pages/UsersPage'
import Home from './pages/HomePage'
import Login from './pages/Login'
import Register from './pages/Register'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import PaymentResult from './pages/PaymentResult'
import OrderHistoryPageV2 from './pages/OrderHistoryPageV2'
import ProductDetailPage from './pages/ProductDetailPage'
import SellerCouponManagementPage from './pages/SellerCouponManagementPage'
import SellerProductDetail from './pages/SellerProductDetail'
import ResetPassword from './pages/ResetPassword'
import ForgotPassword from './pages/ForgotPassword'
import VerifyOTP from './pages/VerifyOTP'

import ProtectedRoute from './components/ProtectRoute'
import SellerRegister from './pages/SellerRegister'
import ProfilePage from './pages/ProfilePage'

import CategoriesPage from './pages/CategoriesPage'
import Reviews from './pages/Review'
import AdminShopsPage from './pages/AdminShopsPage'

import ShopPage from './pages/ShopPage'
import SellerOrderManagementPage from './pages/SellerOrderManagementPage'
import ChatPage from './pages/ChatPage'
import AdminMembershipTiersPage from './pages/AdminMembershipTiersPage'
import AdminCouponsPage from './pages/AdminCouponsPage'
import AdminLayout from './components/AdminLayout'
import './App.css'

function App() {
  const navigate = useNavigate()
  const [cartCount, setCartCount] = useState(0)
  const [cartItems, setCartItems] = useState([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // State từ cả 2 version
  const [notifications, setNotifications] = useState([])
  const [unreadChatCount, setUnreadChatCount] = useState(0)

  const [user, setUser] = useState(() => {
    const info = localStorage.getItem('USER_INFO')
    return info ? JSON.parse(info) : null
  })

  const isAdmin = user && (user.role === 'admin' || user.role === 1)

  // Giả lập dữ liệu thông báo theo Role
  useEffect(() => {
    if (user) {
      if (user.role === 'seller' || user.role === 2) {
        setNotifications([
          { id: 1, text: "📦 Bạn có đơn hàng mới cần xác nhận", time: "Vừa xong", unread: true },
          { id: 2, text: "⭐ Một khách hàng vừa đánh giá sản phẩm của bạn", time: "2 giờ trước", unread: false }
        ])
      } else if (user.role === 'user' || user.role === 'customer' || !user.role) {
        setNotifications([
          { id: 1, text: "🚚 Đơn hàng #SHP123 đang được giao đến bạn", time: "10 phút trước", unread: true },
          { id: 2, text: "🎁 Bạn nhận được mã giảm giá 10% cho đơn sau", time: "1 ngày trước", unread: false }
        ])
      }
    }
  }, [user])

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('CART')) || []
    setCartItems(cart)
    const total = cart.reduce((sum, item) => sum + item.quantity, 0)
    setCartCount(total)
  }

  const loadUnreadChat = async (currentUser) => {
    if (!currentUser || isAdmin) return
    try {
      const res = await chatApi.listConversations()
      const convs = Array.isArray(res.data) ? res.data : []
      const total = convs.reduce((sum, c) => sum + (c.unread_count || 0), 0)
      setUnreadChatCount(total)
    } catch {
      // Bỏ qua lỗi
    }
  }

  useEffect(() => {
    loadCart()
    const handleCartUpdate = () => loadCart()
    const handleUserUpdate = () => {
      const info = localStorage.getItem('USER_INFO')
      const updatedUser = info ? JSON.parse(info) : null
      setUser(updatedUser)
      loadUnreadChat(updatedUser)
    }

    const handleChatRead = () => setUnreadChatCount(0)

    window.addEventListener('storage', handleCartUpdate)
    window.addEventListener('cartUpdated', handleCartUpdate)
    window.addEventListener('userUpdated', handleUserUpdate)
    window.addEventListener('chatRead', handleChatRead)

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate)
      window.removeEventListener('storage', handleCartUpdate)
      window.removeEventListener('cartUpdated', handleCartUpdate)
      window.removeEventListener('chatRead', handleChatRead)
    }
  }, [])

  useEffect(() => {
    loadUnreadChat(user)
    if (!user || isAdmin) return
    const interval = setInterval(() => loadUnreadChat(user), 30000)
    return () => clearInterval(interval)
  }, [user])

  const handleLogout = async () => {
    try {
      await userApi.logout()
    } catch (err) {
      console.log('Logout error:', err)
    }
    localStorage.removeItem('ACCESS_TOKEN')
    localStorage.removeItem('USER_INFO')
    setUser(null)
    setUnreadChatCount(0)
    setIsMobileMenuOpen(false)
    navigate('/')
  }

  const closeMenu = () => setIsMobileMenuOpen(false)

  const handleChatClick = () => {
    setUnreadChatCount(0)
    closeMenu()
  }

  return (
    <div className="app-container">
      <header className="shopee-header">
        <div className="header-content">
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>

          <Link to="/" className="logo" onClick={closeMenu}>Shopii</Link>

          <nav className={`nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
            {!isAdmin && <Link to="/" className="nav-link" onClick={closeMenu}>Trang chủ</Link>}
            
            {isAdmin && (
              <Link to="/admin/shops" className="nav-link" style={{ color: '#3b82f6', fontWeight: 'bold' }} onClick={closeMenu}>
                Quản lý hệ thống
              </Link>
            )}

            {user && (user.role === 'seller' || user.role === 2) ? (
              <Link to="/shop" className="nav-link" style={{ color: '#ee4d2d', fontWeight: 'bold' }} onClick={closeMenu}>
                Kênh Người Bán
              </Link>
            ) : (
              user && !isAdmin && (
                <Link to="/seller/register" className="nav-link" onClick={closeMenu}>Bắt đầu bán hàng</Link>
              )
            )}

            {!user && (
              <>
                <Link to="/login" className="nav-link" onClick={closeMenu}>Đăng nhập</Link>
                <Link to="/register" className="nav-link" onClick={closeMenu}>Đăng ký</Link>
              </>
            )}
          </nav>

          <div className="header-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: 'auto' }}>
            
            {/* THÔNG BÁO */}
            {user && !isAdmin && (
              <div className="notification-wrapper">
                <div className="nav-link notification-icon-btn">
                  <Bell size={24} />
                  {notifications.filter(n => n.unread).length > 0 && (
                    <span className="cart-badge" style={{ backgroundColor: '#ee4d2d' }}>
                      {notifications.filter(n => n.unread).length}
                    </span>
                  )}
                </div>
                <div className="notification-dropdown">
                  <div className="noti-header">Thông báo mới nhận</div>
                  <div className="noti-content">
                    {notifications.length === 0 ? (
                      <p className="empty-noti">Không có thông báo nào</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`noti-item ${n.unread ? 'unread' : ''}`}>
                          <p className="noti-text">{n.text}</p>
                          <span className="noti-time">{n.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <Link to={user.role === 'seller' ? "/seller-orders" : "/orders"} className="view-all-noti" onClick={closeMenu}>
                    Xem tất cả
                  </Link>
                </div>
              </div>
            )}

            {/* CHAT */}
            {user && !isAdmin && (
              <Link to="/chat" className="nav-link chat-icon" onClick={handleChatClick} style={{ position: 'relative' }}>
                <MessageCircle size={24} />
                {unreadChatCount > 0 && (
                  <span className="cart-badge">
                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                  </span>
                )}
              </Link>
            )}

            {/* GIỎ HÀNG */}
            {!isAdmin && (
              <div className="cart-wrapper">
                <Link to="/cart" className="nav-link cart-icon" onClick={closeMenu}>
                  <ShoppingCart size={24} />
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </Link>
                <div className="cart-dropdown">
                  {cartItems.length === 0 ? (
                    <p className="empty-cart-mini">Chưa có sản phẩm</p>
                  ) : (
                    <>
                      {cartItems.slice(0, 5).map((item) => (
                        <div key={item.id} className="mini-item">
                          <img src={item.image || 'https://placehold.co/50x50'} alt={item.name} />
                          <div>
                            <p className="mini-name">{item.name}</p>
                            <span className="mini-price">{Number(item.price).toLocaleString()}đ</span>
                          </div>
                        </div>
                      ))}
                      <Link to="/cart" className="view-cart-btn" onClick={closeMenu}>Xem Giỏ Hàng</Link>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* AVATAR USER */}
            {user && (
              <div className="user-menu">
                <div className="user-trigger">
                  <div className="avatar">{user.name?.charAt(0).toUpperCase()}</div>
                  <span className="user-name-text">{user.name}</span>
                </div>
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item" onClick={closeMenu}>Tài khoản của tôi</Link>
                  {!isAdmin && <Link to="/orders" className="dropdown-item" onClick={closeMenu}>Đơn mua</Link>}
                  <div className="dropdown-item logout" onClick={handleLogout}>Đăng xuất</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/chat" element={<ChatPage />} />
          {/* Role User */}
          <Route element={<ProtectedRoute allowedRoles={['user', 'customer']} />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/payment-result" element={<PaymentResult />} />
            <Route path="/orders" element={<OrderHistoryPageV2 />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/reviews" element={<Reviews />} />
            
            <Route path="/seller/register" element={<SellerRegister />} />
          </Route>

          {/* Role Seller */}
          <Route element={<ProtectedRoute allowedRoles={['seller', 2]} />}>
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/seller" element={<ShopPage />} />
            <Route path="/seller-orders" element={<SellerOrderManagementPage />} />
            <Route path="/seller-coupons" element={<SellerCouponManagementPage />} />
            <Route path="/seller/products/:id" element={<SellerProductDetail />} />
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 1]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="shops" element={<AdminShopsPage />} />
              <Route path="membership-tiers" element={<AdminMembershipTiersPage />} />
              <Route path="coupons" element={<AdminCouponsPage />} />
            </Route>
            <Route path="/admin/shops" element={<AdminShopsPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Routes>
      </main>
    </div>
  )
}

export default App