import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register"; // <--- Import thêm cái này

function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: 10, background: "#f0f0f0", marginBottom: 20 }}>
        <Link to="/" style={{ marginRight: 10 }}>
          Trang chủ
        </Link>
        <Link to="/login" style={{ marginRight: 10 }}>
          Đăng nhập
        </Link>
        <Link to="/register">Đăng ký</Link>
      </nav>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />{" "}
        {/* <--- Thêm dòng này */}
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

// Tạo tạm component Home ở đây cho gọn
function Home() {
  const logout = () => {
    localStorage.removeItem("ACCESS_TOKEN");
    window.location.reload();
  };

  // Kiểm tra xem đã đăng nhập chưa
  const isLogin = localStorage.getItem("ACCESS_TOKEN");

  return (
    <div style={{ padding: 20 }}>
      <h1>Trang Chủ Shopii</h1>
      {isLogin ? (
        <div>
          <p style={{ color: "green" }}>Bạn đã đăng nhập thành công!</p>
          <button onClick={logout}>Đăng xuất</button>
        </div>
      ) : (
        <p>Bạn chưa đăng nhập. Vui lòng đăng nhập để mua hàng.</p>
      )}
    </div>
  );
}

export default App;
