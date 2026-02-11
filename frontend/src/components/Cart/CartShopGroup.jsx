import React from "react";
import CartItem from "./CartItem"; // Import component con

const CartShopGroup = ({
  shopName,
  items,
  selectedItems,
  onCheckShop,
  onCheckItem,
  onUpdateQty,
  onDelete,
}) => {
  return (
    <div className="shop-group-card">
      {/* Header của Shop */}
      <div className="shop-header">
        <input
          type="checkbox"
          checked={items.every((i) => selectedItems.includes(i.id))}
          onChange={onCheckShop}
        />
        <span className="shop-name">🏠 {shopName}</span>
      </div>

      {/* Danh sách sản phẩm trong Shop này */}
      {items.map((item) => (
        <CartItem
          key={item.id}
          item={item}
          isSelected={selectedItems.includes(item.id)}
          onCheck={() => onCheckItem(item.id)}
          onUpdateQty={onUpdateQty}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default CartShopGroup;
