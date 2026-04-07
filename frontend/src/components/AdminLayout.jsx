import { Outlet, Link } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9f8fc' }}>
      {/* ===== SIDEBAR MENU DÙNG CHUNG ===== */}
      <div
        style={{
          width: '250px',
          background: '#1e293b',
          color: 'white',
          padding: '20px',
          height: '100vh',
          position: 'sticky',
          top: 0,
        }}
      >
        <h2 style={{ color: 'white', marginBottom: '30px', fontSize: '22px' }}>
          🏢 Admin Panel
        </h2>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ marginBottom: '10px' }}>
            <Link to="/admin/shops" style={sidebarBtnStyle('#3b82f6')}>
              🏪 Duyệt Gian Hàng
            </Link>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <Link to="/admin/categories" style={sidebarBtnStyle('#6366f1')}>
              📂 Quản Lý Category
            </Link>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <Link
              to="/admin/membership-tiers"
              style={sidebarBtnStyle('#8b5cf6')}
            >
              💎 Quản Lý Hạng
            </Link>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <Link to="/admin/coupons" style={sidebarBtnStyle('#ec4899')}>
              🎟️ Coupon Toàn Sàn
            </Link>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <Link to="/admin/users" style={sidebarBtnStyle('#10b981')}>
              👥 Quản Lý User
            </Link>
          </li>
        </ul>
      </div>

      {/* ===== PHẦN NỘI DUNG THAY ĐỔI (TRANG CON) ===== */}
      <div style={{ flex: 1, padding: '40px' }}>
        <Outlet />
      </div>
    </div>
  )
}

// Style phụ trợ cho nút sidebar
const sidebarBtnStyle = (bg) => ({
  display: 'block',
  padding: '12px 15px',
  background: bg,
  color: 'white',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 'bold',
  textAlign: 'center',
  transition: 'background 0.3s',
  marginBottom: '5px',
})
