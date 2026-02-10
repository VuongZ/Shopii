import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import cartApi from '../api/cartApi'; 
import CartShopGroup from '../components/Cart/CartShopGroup'; // Import component Shop
import CartFooter from '../components/Cart/CartFooter';       // Import component Footer

const CartPage = () => {
  const [cartGroups, setCartGroups] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. Gọi API lấy dữ liệu
  useEffect(() => {
    fetchCartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCartData = async () => {
    try {
      setLoading(true);
      const response = await cartApi.getCart();
      setCartGroups(response || {}); 
    } catch (error) {
      console.error("Lỗi tải giỏ hàng:", error);
      if(error.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  // 2. Logic chọn Checkbox
  const handleCheck = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // 3. Logic Update số lượng (Optimistic UI)
  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    // Cập nhật giao diện trước cho mượt
    setCartGroups(prevGroups => {
        const newGroups = { ...prevGroups };
        Object.keys(newGroups).forEach(shop => {
            newGroups[shop] = newGroups[shop].map(item => 
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            );
        });
        return newGroups;
    });

    // Gọi API ngầm
    try {
        await cartApi.update({ cart_item_id: itemId, quantity: newQuantity });
    } catch (error) {
        console.error(error);
        fetchCartData(); // Lỗi thì load lại data gốc
    }
  };

  // 4. Logic Xóa
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa?")) return;
    try {
      await cartApi.remove(id); 
      fetchCartData(); 
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    } catch (error) {
        console.log(error);
      alert("Xóa thất bại!");
    }
  };

  // 5. Tính tổng tiền
  const totalAmount = Object.values(cartGroups).flat().reduce((sum, item) => {
    return selectedItems.includes(item.id) ? sum + (Number(item.price) * item.quantity) : sum;
  }, 0);

  if (loading) return <div style={{textAlign: 'center', marginTop: 50}}>Đang tải giỏ hàng...</div>;

  return (
    <div className="cart-page-container">
      <div className="cart-content-wrapper">
        
        {/* Header tĩnh của bảng */}
        <div className="cart-header-row">
          <div className="col-product">Sản Phẩm</div>
          <div className="col-price">Đơn Giá</div>
          <div className="col-qty">Số Lượng</div>
          <div className="col-total">Số Tiền</div>
          <div className="col-action">Thao Tác</div>
        </div>

        {/* Render danh sách các Shop */}
        {Object.keys(cartGroups).length === 0 ? (
           <div className="empty-cart" style={{textAlign: 'center', padding: 50, background: 'white'}}>
             Giỏ hàng trống trơn 😢
           </div>
        ) : (
          Object.entries(cartGroups).map(([shopName, items]) => (
            <CartShopGroup 
              key={shopName}
              shopName={shopName}
              items={items}
              selectedItems={selectedItems}
              onCheck={handleCheck}
              onUpdateQty={handleUpdateQuantity}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Footer thanh toán */}
      <CartFooter 
        totalItems={Object.values(cartGroups).flat().length}
        totalPrice={totalAmount}
        onBuy={() => navigate('/checkout', { state: { selectedItems } })}
      />
    </div>
  );
};

export default CartPage;