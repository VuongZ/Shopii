import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'
import statisticsApi from '../api/statisticsApi'
import './CategoriesPage.css'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    name: '',
    slug: '',
    parent_id: '',
    image: '',
  })
  const [editingId, setEditingId] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [statistics, setStatistics] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get('/categories')
      setCategories(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchStatistics = async () => {
    try {
      setLoadingStats(true)
      const res = await statisticsApi.getAdminDashboard()
      setStatistics(res.data)
    } catch (err) {
      console.error(err)
      alert('Lỗi khi tải dữ liệu thống kê')
    } finally {
      setLoadingStats(false)
    }
  }

  const handleReportClick = () => {
    if (!showReport) {
      fetchStatistics()
    }
    setShowReport(!showReport)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    try {
      const data = {
        name: form.name,
        slug: form.slug || null,
        image: form.image || null,
        parent_id: form.parent_id ? Number(form.parent_id) : null,
      }

      if (editingId) {
        await axiosClient.put(`/categories/${editingId}`, data)
        setEditingId(null)
      } else {
        await axiosClient.post('/categories', data)
      }

      setForm({ name: '', slug: '', parent_id: '', image: '' })
      fetchCategories()
      alert('Thao tác thành công!')
    } catch (error) {
      console.error(error.response?.data || error)
      alert('Có lỗi xảy ra')
    }
  }

  const handleEdit = (cat) => {
    setForm({
      name: cat.name || '',
      slug: cat.slug || '',
      parent_id: cat.parent_id || '',
      image: cat.image || '',
    })
    setEditingId(cat.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa?')) return
    await axiosClient.delete(`/categories/${id}`)
    fetchCategories()
  }

  return (
    <div className="container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}
      >
        <h2 className="title" style={{ margin: 0 }}>
          Quản lý Category
        </h2>
        <button
          onClick={handleReportClick}
          style={{
            padding: '10px 20px',
            background: showReport ? '#10b981' : '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          📊 {showReport ? 'Ẩn Báo Cáo' : 'Xem Báo Cáo Thống Kê'}
        </button>
      </div>

      {/* ===== BÁO CÁO THỐNG KÊ ===== */}
      {showReport && (
        <div
          style={{
            background: '#f9fafb',
            padding: '30px',
            borderRadius: '12px',
            marginBottom: '30px',
            border: '1px solid #e5e7eb',
          }}
        >
          <h3 style={{ marginTop: 0, color: '#1f2937' }}>
            📊 Thống Kê Sàn Thương Mại
          </h3>
          {loadingStats ? (
            <p style={{ textAlign: 'center' }}>Đang tải dữ liệu...</p>
          ) : statistics ? (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  marginBottom: '30px',
                }}
              >
                <div
                  style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <p style={{ color: '#6b7280', margin: '0 0 10px 0' }}>
                    Tổng Doanh Thu
                  </p>
                  <h2 style={{ margin: 0, color: '#059669' }}>
                    {(statistics.total_revenue || 0).toLocaleString()} VNĐ
                  </h2>
                </div>
                <div
                  style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <p style={{ color: '#6b7280', margin: '0 0 10px 0' }}>
                    Tổng Đơn Hàng
                  </p>
                  <h2 style={{ margin: 0, color: '#0891b2' }}>
                    {statistics.total_orders || 0} đơn
                  </h2>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: 'Thống Kê',
                      'Doanh thu (Triệu)':
                        (statistics.total_revenue || 0) / 1000000,
                      'Số đơn hàng': statistics.total_orders || 0,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Doanh thu (Triệu)" fill="#059669" />
                  <Bar dataKey="Số đơn hàng" fill="#0891b2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p>Không có dữ liệu</p>
          )}
        </div>
      )}

      {/* ===== FORM THÊM / SỬA ===== */}
      <div className="form">
        <input
          name="name"
          placeholder="Tên Category"
          value={form.name}
          onChange={handleChange}
        />
        <input
          name="slug"
          placeholder="Slug (Đường dẫn)"
          value={form.slug}
          onChange={handleChange}
        />
        <input
          name="parent_id"
          placeholder="Parent ID (Nếu có)"
          value={form.parent_id}
          onChange={handleChange}
        />
        <input
          name="image"
          placeholder="Link ảnh URL"
          value={form.image}
          onChange={handleChange}
        />
        <button onClick={handleSubmit} className="submit-btn">
          {editingId ? 'Cập Nhật Danh Mục' : 'Thêm Danh Mục Mới'}
        </button>
      </div>

      {/* ===== BẢNG DANH SÁCH ===== */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Slug</th>
              <th>Parent</th>
              <th>Ảnh</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td>{cat.id}</td>
                <td>
                  <strong>{cat.name}</strong>
                </td>
                <td>{cat.slug}</td>
                <td>{cat.parent_id || '-'}</td>
                <td>
                  {cat.image && (
                    <img
                      src={cat.image}
                      width="40"
                      height="40"
                      style={{ borderRadius: '4px' }}
                      alt=""
                    />
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
          <p style={{ textAlign: 'center', padding: '20px' }}>
            Chưa có dữ liệu danh mục
          </p>
        )}
      </div>
    </div>
  )
}
