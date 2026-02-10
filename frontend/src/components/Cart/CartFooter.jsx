import React from 'react';

const CartFooter = ({ totalItems, totalPrice, onBuy }) => {
  return (
    <div className="sticky-footer">
      <div className="footer-content">
        <div className="footer-left">
          <input type="checkbox" />
          <span>Chọn tất cả ({totalItems} sản phẩm)</span>
        </div>
        
        <div className="footer-right">
          <div className="total-info">
            <span>Tổng thanh toán:</span>
            <span className="total-price">₫{totalPrice.toLocaleString()}</span>
          </div>
          <button className="btn-buy" onClick={onBuy}>
            Mua Hàng
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartFooter;