import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import cartApi from "../api/cartApi";
import CartShopGroup from "../components/Cart/CartShopGroup";
import CartFooter from "../components/Cart/CartFooter";

const CartPage = () => {
  const [cartGroups, setCartGroups] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartData();
  }, []);

  const fetchCartData = async () => {
    try {
      setLoading(true);
      const response = await cartApi.getCart();

      // FIX LỖI: Lấy đúng phần .data từ Axios
      const data = response.data || {};
      setCartGroups(data);

      console.log("Dữ liệu giỏ hàng nhận được:", data);
    } catch (error) {
      console.error("Lỗi tải giỏ hàng:", error);
      // Nếu hết hạn token (401), đá về trang login
      if (error.response?.status === 401) {
        localStorage.removeItem("ACCESS_TOKEN");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    // Cập nhật giao diện tạm thời (Optimistic UI)
    setCartGroups((prevGroups) => {
      const newGroups = { ...prevGroups };
      Object.keys(newGroups).forEach((shop) => {
        newGroups[shop] = newGroups[shop].map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item,
        );
      });
      return newGroups;
    });

    try {
      await cartApi.addToCart({ product_id: itemId, quantity: newQuantity });
    } catch (error) {
      console.error(error);
      fetchCartData();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa?")) return;
    try {
      await cartApi.remove(id);
      fetchCartData();
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
    } catch (error) {
      alert("Xóa thất bại!");
    }
  };

  // Tính tổng tiền an toàn hơn
  const totalAmount = Object.values(cartGroups)
    .flat()
    .reduce((sum, item) => {
      if (item && selectedItems.includes(item.id)) {
        return sum + Number(item.price || 0) * (item.quantity || 0);
      }
      return sum;
    }, 0);

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: 50 }}>
        Đang tải giỏ hàng...
      </div>
    );

  return (
    <div className="cart-page-container">
      <div className="cart-content-wrapper">
        <div className="cart-header-row">
          <div className="col-product">Sản Phẩm</div>
          <div className="col-price">Đơn Giá</div>
          <div className="col-qty">Số Lượng</div>
          <div className="col-total">Số Tiền</div>
          <div className="col-action">Thao Tác</div>
        </div>

        {/* FIX LỖI .map: Kiểm tra object có key không */}
        {!cartGroups || Object.keys(cartGroups).length === 0 ? (
          <div
            className="empty-cart"
            style={{ textAlign: "center", padding: 50, background: "white" }}
          >
            Giỏ hàng trống trơn 😢
          </div>
        ) : (
          Object.entries(cartGroups).map(
            ([shopName, items]) =>
              // Chỉ render nếu items thực sự là một mảng
              Array.isArray(items) && (
                <CartShopGroup
                  key={shopName}
                  shopName={shopName}
                  items={items}
                  selectedItems={selectedItems}
                  onCheck={handleCheck}
                  onUpdateQty={handleUpdateQuantity}
                  onDelete={handleDelete}
                />
              ),
          )
        )}
      </div>

      <CartFooter
        totalItems={
          Object.values(cartGroups)
            .flat()
            .filter((i) => i).length
        }
        totalPrice={totalAmount}
        onBuy={() => navigate("/checkout", { state: { selectedItems } })}
      />
    </div>
  );
};

export default CartPage;
