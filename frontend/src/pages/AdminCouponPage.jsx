import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'

function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [tiers, setTiers] = useState([])
  const [formData, setFormData] = useState({
    code: '',
    membership_tier_id: '',
    discount_type: 'fixed',
    discount_value: '',
    min_order_value: 0,
    usage_limit: '',
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    fetchCoupons()
    fetchTiers()
  }, [])

  const fetchCoupons = () =>
    axiosClient.get('/admin/coupons').then((res) => setCoupons(res.data))
  const fetchTiers = () =>
    axiosClient.get('/admin/membership-tiers').then((res) => setTiers(res.data))

  const handleSubmit = (e) => {
    e.preventDefault()
    axiosClient
      .post('/admin/coupons', formData)
      .then(() => {
        alert('Tạo mã thành công!')
        fetchCoupons()
        setFormData({
          code: '',
          membership_tier_id: '',
          discount_type: 'fixed',
          discount_value: '',
          min_order_value: 0,
          usage_limit: '',
          start_date: '',
          end_date: '',
        })
      })
      .catch((err) => alert(err.response?.data?.message || 'Lỗi tạo mã'))
  }

  const deleteCoupon = (id) => {
    if (window.confirm('Xóa mã này?'))
      axiosClient.delete(`/admin/coupons/${id}`).then(() => fetchCoupons())
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Quản lý Coupon Toàn Sàn</h2>

      {/* Form Tạo Mã */}
      <div
        style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          marginBottom: '30px',
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '15px',
          }}
        >
          <input
            type="text"
            placeholder="Mã (VD: VIP2026)"
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toUpperCase() })
            }
            required
          />

          <select
            value={formData.membership_tier_id}
            onChange={(e) =>
              setFormData({ ...formData, membership_tier_id: e.target.value })
            }
          >
            <option value="">Tất cả thành viên</option>
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>
                Chỉ dành cho {t.name} +
              </option>
            ))}
          </select>

          <select
            value={formData.discount_type}
            onChange={(e) =>
              setFormData({ ...formData, discount_type: e.target.value })
            }
          >
            <option value="fixed">Giảm số tiền cố định</option>
            <option value="percent">Giảm theo %</option>
          </select>

          <input
            type="number"
            placeholder="Giá trị giảm"
            value={formData.discount_value}
            onChange={(e) =>
              setFormData({ ...formData, discount_value: e.target.value })
            }
            required
          />
          <input
            type="number"
            placeholder="Số lượt dùng"
            value={formData.usage_limit}
            onChange={(e) =>
              setFormData({ ...formData, usage_limit: e.target.value })
            }
            required
          />
          <input
            type="datetime-local"
            value={formData.start_date}
            onChange={(e) =>
              setFormData({ ...formData, start_date: e.target.value })
            }
            required
          />
          <input
            type="datetime-local"
            value={formData.end_date}
            onChange={(e) =>
              setFormData({ ...formData, end_date: e.target.value })
            }
            required
          />

          <button
            type="submit"
            style={{
              gridColumn: 'span 3',
              padding: '12px',
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Xác nhận phát hành mã toàn sàn
          </button>
        </form>
      </div>

      {/* Bảng Danh Sách */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: '#fff',
        }}
      >
        <thead>
          <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '12px' }}>Mã</th>
            <th>Yêu cầu Hạng</th>
            <th>Loại ưu đãi</th>
            <th>Giá trị</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>{c.code}</td>
              <td>{c.tier?.name || 'Mọi người'}</td>
              <td>{c.discount_type === 'fixed' ? 'Cố định' : 'Phần trăm'}</td>
              <td>
                {c.discount_type === 'fixed'
                  ? Number(c.discount_value).toLocaleString() + 'đ'
                  : c.discount_value + '%'}
              </td>
              <td>
                <button
                  onClick={() => deleteCoupon(c.id)}
                  style={{
                    color: 'red',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AdminCouponsPage
