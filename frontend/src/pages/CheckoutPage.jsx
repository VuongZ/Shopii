import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import cartApi from '../api/cartApi';

const CheckoutPage = () => {
  const { state } = useLocation(); // Nhận dữ liệu từ CartPage
  const navigate = useNavigate();
  const selectedItems = state?.selectedItems || [];

  // Giả lập ID địa chỉ và thanh toán (Thực tế bạn phải gọi API lấy list địa chỉ)
  const [addressId] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState(1); 
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      await cartApi.checkout({
        cart_item_ids: selectedItems,
        address_id: addressId,
        payment_method_id: paymentMethod,
        shipping_method_id: 1 // Giả lập
      });
      alert("🎉 Đặt hàng thành công!");
      navigate('/orders'); // Chuyển hướng về trang lịch sử đơn
    } catch (error) {
      alert("Lỗi đặt hàng: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] pt-6 pb-20">
      <div className="max-w-5xl mx-auto">
        
        {/* Địa chỉ nhận hàng */}
        <div className="bg-white p-6 shadow-sm mb-4 rounded-sm border-t-4 border-[#ee4d2d]">
          <h2 className="text-[#ee4d2d] flex items-center gap-2 text-lg font-bold mb-3">
             📍 Địa Chỉ Nhận Hàng
          </h2>
          <div className="flex items-center gap-4">
             <span className="font-bold">Nguyễn Văn A (+84 987654321)</span>
             <span className="text-gray-600">Số 123, Đường ABC, Quận 1, TP.HCM</span>
             <span className="border border-[#ee4d2d] text-[#ee4d2d] text-xs px-1">Mặc định</span>
             <button className="ml-auto text-blue-500 text-sm">Thay đổi</button>
          </div>
        </div>

        {/* Phương thức thanh toán */}
        <div className="bg-white p-6 shadow-sm mb-4">
           <h3 className="font-medium mb-4">Phương thức thanh toán</h3>
           <div className="flex gap-4">
              <button 
                onClick={() => setPaymentMethod(1)}
                className={`px-4 py-2 border rounded-sm ${paymentMethod === 1 ? 'border-[#ee4d2d] text-[#ee4d2d]' : 'border-gray-300'}`}
              >
                Thanh toán khi nhận hàng (COD)
              </button>
              <button disabled className="px-4 py-2 border border-gray-200 text-gray-300 cursor-not-allowed">
                Ví ShopeePay (Bảo trì)
              </button>
           </div>
        </div>

        {/* Nút đặt hàng */}
        <div className="bg-white p-6 shadow-sm flex items-center justify-end border-t gap-4">
           <div className="text-sm text-gray-500">
              Nhấn "Đặt hàng" đồng nghĩa với việc bạn đồng ý tuân theo Điều khoản Shopii
           </div>
           <button 
             onClick={handlePlaceOrder}
             disabled={loading}
             className="bg-[#ee4d2d] text-white px-12 py-3 rounded-sm text-lg font-medium hover:bg-[#d73211] shadow-lg disabled:opacity-70"
           >
             {loading ? 'Đang xử lý...' : 'Đặt Hàng'}
           </button>
        </div>

      </div>
    </div>
  );
};

export default CheckoutPage;