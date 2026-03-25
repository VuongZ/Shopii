import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "../api/axiosClient";
import couponApi from "../api/couponApi";

const SellerCouponManagementPage = () => {
  const [shop, setShop] = useState(null);
  const [coupons, setCoupons] = useState([]);

  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("fixed");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");

  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const canCreate = useMemo(() => {
    return (
      shop &&
      code.trim().length > 0 &&
      discountValue !== "" &&
      minOrderValue !== ""
    );
  }, [shop, code, discountValue, minOrderValue]);

  const loadData = async () => {
    setLoading(true);
    setGlobalError("");
    try {
      const shopRes = await axiosClient.get("/my-shop");
      setShop(shopRes.data);

      const shopId = shopRes.data?.id;
      const couponsRes = await couponApi.getCoupons(shopId);
      setCoupons(couponsRes.data || []);
    } catch (err) {
      const message = err.response?.data?.message || "Không tải được dữ liệu";
      setGlobalError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!shop) return;

    const normalizedCode = code.trim().toUpperCase();
    const discountValueNum = Number(discountValue);
    const minOrderValueNum = Number(minOrderValue);

    if (!normalizedCode) {
      setGlobalError("Vui lòng nhập mã coupon");
      return;
    }
    if (Number.isNaN(discountValueNum) || discountValueNum < 0) {
      setGlobalError("discount_value không hợp lệ");
      return;
    }
    if (Number.isNaN(minOrderValueNum) || minOrderValueNum < 0) {
      setGlobalError("min_order_value không hợp lệ");
      return;
    }

    setCreating(true);
    setGlobalError("");
    try {
      await axiosClient.post("/coupons", {
        shop_id: shop.id,
        code: normalizedCode,
        discount_type: discountType,
        discount_value: discountValueNum,
        min_order_value: minOrderValueNum,
      });

      setCode("");
      setDiscountValue("");
      setMinOrderValue("");
      setDiscountType("fixed");

      await loadData();
    } catch (err) {
      const message =
        err.response?.data?.message || "Không thể tạo coupon lúc này";
      setGlobalError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (couponId) => {
    if (!couponId) return;
    if (!window.confirm("Xóa coupon này?")) return;

    setDeletingId(couponId);
    setGlobalError("");
    try {
      await axiosClient.delete(`/coupons/${couponId}`);
      await loadData();
    } catch (err) {
      const message =
        err.response?.data?.message || "Không thể xóa coupon lúc này";
      setGlobalError(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h2 style={{ marginBottom: 16 }}>Seller Coupon Management</h2>

      {loading && <p>Đang tải...</p>}
      {globalError && (
        <div style={{ color: "#b42318", marginBottom: 16 }}>{globalError}</div>
      )}

      {!loading && shop && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: "#333" }}>
            Shop: <b>{shop.name}</b>
          </div>
        </div>
      )}

      <div style={{ background: "#fff", padding: 16, borderRadius: 8 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Tạo coupon mới</h3>

        <form onSubmit={handleCreate} style={{ display: "grid", gap: 12 }}>
          <div>
            <label>Mã coupon</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VD: SALE10"
              style={{ width: "100%", padding: 8 }}
              disabled={creating}
            />
          </div>

          <div>
            <label>discount_type</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              style={{ width: "100%", padding: 8 }}
              disabled={creating}
            >
              <option value="fixed">fixed (giảm cố định)</option>
              <option value="percent">percent (giảm %)</option>
            </select>
          </div>

          <div>
            <label>discount_value</label>
            <input
              type="number"
              step="0.01"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              style={{ width: "100%", padding: 8 }}
              disabled={creating}
            />
          </div>

          <div>
            <label>min_order_value</label>
            <input
              type="number"
              step="0.01"
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(e.target.value)}
              style={{ width: "100%", padding: 8 }}
              disabled={creating}
            />
          </div>

          <button
            type="submit"
            disabled={!canCreate || creating}
            style={{
              padding: "10px 14px",
              borderRadius: 6,
              border: "1px solid #ddd",
              background: "#ee4d2d",
              color: "#fff",
              cursor: !canCreate || creating ? "not-allowed" : "pointer",
            }}
          >
            {creating ? "Đang tạo..." : "Tạo coupon"}
          </button>
        </form>
      </div>

      <div style={{ height: 18 }} />

      <div style={{ background: "#fff", padding: 16, borderRadius: 8 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Danh sách coupon</h3>

        {coupons.length === 0 && <p>Chưa có coupon.</p>}

        {coupons.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ borderBottom: "1px solid #eee", padding: 10 }}>
                    Code
                  </th>
                  <th style={{ borderBottom: "1px solid #eee", padding: 10 }}>
                    Loại giảm
                  </th>
                  <th style={{ borderBottom: "1px solid #eee", padding: 10 }}>
                    Giá trị
                  </th>
                  <th style={{ borderBottom: "1px solid #eee", padding: 10 }}>
                    Min order
                  </th>
                  <th style={{ borderBottom: "1px solid #eee", padding: 10 }}>
                    Hành động
                  </th>
                </tr>
              </thead>

              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td style={{ padding: 10, borderBottom: "1px solid #f5f5f5" }}>
                      <b>{c.code}</b>
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f5f5f5" }}>
                      {c.discount_type}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f5f5f5" }}>
                      {c.discount_type === "percent"
                        ? `${c.discount_value}%`
                        : `${c.discount_value}`}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f5f5f5" }}>
                      {c.min_order_value}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f5f5f5" }}>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid #ddd",
                          background: "#fff",
                          cursor: deletingId === c.id ? "not-allowed" : "pointer",
                        }}
                      >
                        {deletingId === c.id ? "Đang xóa..." : "Xóa"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerCouponManagementPage;

