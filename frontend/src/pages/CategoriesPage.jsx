import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import statisticsApi from "../api/statisticsApi";
import "./CategoriesPage.css";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    parent_id: "",
    image: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axiosClient.get("/categories");
        setCategories(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    loadCategories();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoadingStats(true);
      const res = await statisticsApi.getAdminDashboard();
      setStatistics(res.data);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tải dữ liệu thống kê");
    } finally {
      setLoadingStats(false);
    }
  };

  const handleReportClick = () => {
    if (!showReport) {
      fetchStatistics();
    }
    setShowReport(!showReport);
  };

  const fetchCategories = async () => {
    const res = await axiosClient.get("/categories");
    setCategories(res.data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const data = {
        name: form.name,
        slug: form.slug || null,
        image: form.image || null,
        parent_id: form.parent_id ? Number(form.parent_id) : null,
      };

      if (editingId) {
        await axiosClient.put(`/categories/${editingId}`, data);
        setEditingId(null);
      } else {
        await axiosClient.post("/categories", data);
      }

      setForm({ name: "", slug: "", parent_id: "", image: "" });
      fetchCategories();
    } catch (error) {
      console.error(error.response?.data || error);
    }
  };

  const handleEdit = (cat) => {
    setForm({
      name: cat.name || "",
      slug: cat.slug || "",
      parent_id: cat.parent_id || "",
      image: cat.image || "",
    });
    setEditingId(cat.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa?")) return;
    await axiosClient.delete(`/categories/${id}`);
    fetchCategories();
  };

  return (
   <div className="page">
  <div style={{ display: 'flex', minHeight: '100vh', background: '#f9f8fc' }}>
    
    {/* ===== SIDEBAR MENU (TRÁI) ===== */}
    <div style={{ 
      width: '250px', 
      background: '#1e293b', 
      color: 'white', 
      padding: '20px',
      height: '100vh',              // ✅ FIX CHÍNH
      position: 'sticky',           // ✅ đứng yên khi scroll nhẹ
      top: 0
    }}>
      <h2 style={{ color: 'white', marginBottom: '30px', fontSize: '22px' }}>
        🏢 Admin Panel
      </h2>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <li style={{ marginBottom: '10px' }}>
          <Link 
            to="/categories" 
            style={{ 
              display: 'block',
              padding: '12px 15px', 
              background: '#3b82f6', 
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              textAlign: 'center',
              transition: 'background 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#2563eb'}
            onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
          >
                📁 Quản lý Category
              </Link>
            </li>
        <li style={{ marginBottom: '10px' }}>
          <Link 
            to="/users" 
            style={{ 
              display: 'block',
              padding: '12px 15px', 
              background: '#8b5cf6', 
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              textAlign: 'center',
              transition: 'background 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#7c3aed'}
            onMouseLeave={(e) => e.target.style.background = '#8b5cf6'}
          >
                👥 Quản lý User
              </Link>
            </li>
        <li style={{ marginBottom: '10px' }}>
          <Link 
            to="/admin/shops" 
            style={{ 
              display: 'block',
              padding: '12px 15px', 
              background: '#3b82f6', 
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              textAlign: 'center',
              transition: 'background 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#2563eb'}
            onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
          >
                🏪 Duyệt Gian Hàng
              </Link>
            </li>
            <li>
              <button 
                onClick={handleReportClick}
                style={{ 
                  width: '100%',
                  padding: '12px 15px', 
                  background: showReport ? '#10b981' : '#6b7280', 
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.background = showReport ? '#059669' : '#4b5563'}
                onMouseLeave={(e) => e.target.style.background = showReport ? '#10b981' : '#6b7280'}
              >
                📊 {showReport ? 'Ẩn Báo Cáo' : 'Xem Báo Cáo'}
              </button>
            </li>
          </ul>
        </div>

        {/* ===== MAIN CONTENT (PHẢI) ===== */}
        <div style={{ flex: 1, padding: '40px' }}>
          <h2 className="title" style={{ marginTop: 0, marginBottom: '20px' }}>Quản lý Category</h2>

        {/* ===== BÁNG CÁO ===== */}
        {showReport && (
          <div style={{ background: '#f9fafb', padding: '30px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, color: '#1f2937' }}>📊 Báo Cáo Thống Kê Sàn</h3>
            
            {loadingStats ? (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>Đang tải dữ liệu...</p>
            ) : statistics ? (
              <div>
                {/* ===== 3 KHUNG CHÍNH ===== */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                  
                  {/* ===== KHUNG 1: SELLER CÓ NHIỀU ĐƠN NHẤT ===== */}
                  <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '25px', borderRadius: '12px', textAlign: 'center', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <p style={{ color: '#e0e7ff', margin: '0 0 15px 0', fontSize: '14px', fontWeight: 'bold' }}>👑 SELLER CÓ NHIỀU ĐƠN NHẤT</p>
                    {statistics.top_seller ? (
                      <div>
                        <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: 'bold' }}>
                          {statistics.top_seller.name}
                        </h2>
                        <p style={{ color: '#e0e7ff', margin: '8px 0', fontSize: '13px' }}>
                          📧 {statistics.top_seller.email}
                        </p>
                        <h3 style={{ margin: '15px 0 0 0', color: '#ffd700', fontSize: '32px', fontWeight: 'bold' }}>
                          {statistics.top_seller.total_orders} đơn
                        </h3>
                      </div>
                    ) : (
                      <p style={{ color: '#e0e7ff' }}>Chưa có seller nào</p>
                    )}
                  </div>

                  {/* ===== KHUNG 2: SẢN PHẨM BÁN CHẠY ===== */}
                  <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', padding: '25px', borderRadius: '12px', textAlign: 'center', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <p style={{ color: '#fff0f5', margin: '0 0 15px 0', fontSize: '14px', fontWeight: 'bold' }}>🔥 SẢN PHẨM BÁN CHẠY TOP 1</p>
                    {statistics.best_sellers && statistics.best_sellers.length > 0 ? (
                      <div>
                        <h2 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
                          {statistics.best_sellers[0].name}
                        </h2>
                        <h3 style={{ margin: '15px 0 0 0', color: '#ffe0f0', fontSize: '32px', fontWeight: 'bold' }}>
                          {statistics.best_sellers[0].total_sold} cái
                        </h3>
                      </div>
                    ) : (
                      <p style={{ color: '#fff0f5' }}>Chưa có dữ liệu</p>
                    )}
                  </div>

                  {/* ===== KHUNG 3: TỔNG ĐƠN HÀNG ===== */}
                  <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', padding: '25px', borderRadius: '12px', textAlign: 'center', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <p style={{ color: '#e0f7ff', margin: '0 0 15px 0', fontSize: '14px', fontWeight: 'bold' }}>📦 TỔNG ĐƠN HÀNG</p>
                    <h2 style={{ margin: 0, fontSize: '24px' }}>
                      Tổng Doanh Thu
                    </h2>
                    <h3 style={{ margin: '15px 0 0 0', color: '#fff', fontSize: '32px', fontWeight: 'bold' }}>
                      {(statistics.total_orders || 0)} đơn
                    </h3>
                    <p style={{ color: '#e0f7ff', margin: '10px 0 0 0', fontSize: '13px' }}>
                      💰 {(statistics.total_revenue || 0).toLocaleString()} VNĐ
                    </p>
                  </div>

                </div>

                {/* ===== DANH SÁCH SẢN PHẨM BÁN CHẠY ===== */}
                {statistics.best_sellers && statistics.best_sellers.length > 0 && (
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '20px' }}>
                    <h4 style={{ marginTop: 0, color: '#1f2937' }}>🏆 TOP 5 SẢN PHẨM BÁN CHẠY</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f3f4f6' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Xếp Hạng</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Tên Sản Phẩm</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Số Lượng Bán</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statistics.best_sellers.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', background: idx % 2 === 0 ? '#fafafa' : 'white' }}>
                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: idx === 0 ? '#d97706' : '#6b7280' }}>
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </td>
                            <td style={{ padding: '12px' }}>{item.name}</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                              {item.total_sold} cái
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#ef4444' }}>Không thể tải dữ liệu thống kê</p>
            )}
          </div>
        )}

        <div className="form">
          <input
            name="name"
            placeholder="Tên"
            value={form.name}
            onChange={handleChange}
          />
          <input
            name="slug"
            placeholder="Slug"
            value={form.slug}
            onChange={handleChange}
          />
          <input
            name="parent_id"
            placeholder="Parent ID"
            value={form.parent_id}
            onChange={handleChange}
          />
          <input
            name="image"
            placeholder="Image URL"
            value={form.image}
            onChange={handleChange}
          />

          <button onClick={handleSubmit} className="submit-btn">
            {editingId ? "Cập nhật" : "Thêm"}
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Slug</th>
                <th>Parent</th>
                <th>Image</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td>{cat.name}</td>
                  <td>{cat.slug}</td>
                  <td>{cat.parent_id || "-"}</td>
                  <td>
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt=""
                        width="40"
                        height="40"
                        style={{ objectFit: "cover", borderRadius: "4px" }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>

                  <td>
                    <div className="actions">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="btn-edit"
                      >
                        Sửa
                      </button>

                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="btn-delete"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {categories.length === 0 && (
            <p style={{ padding: "20px", textAlign: "center", color: "#999" }}>
              Không có dữ liệu
            </p>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
