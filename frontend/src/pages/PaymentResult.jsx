import React, { useEffect, useRef, useState } from "react"; 
import { useSearchParams, useNavigate } from "react-router-dom";
import cartApi from "../api/cartApi"; // Đảm bảo import đúng đường dẫn

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false); // Thêm state loading khi gọi API

  const responseCode = searchParams.get("vnp_ResponseCode");
  const orderId = searchParams.get("vnp_TxnRef"); 
  const secureHash = searchParams.get("vnp_SecureHash");
  console.log(secureHash);
  
  // Lấy toàn bộ chuỗi query param để gửi xuống backend verify (nếu cần)
  const queryString = window.location.search; 

  const isSuccess = responseCode === "00";
  const isCalled = useRef(false);

  useEffect(() => {
    // Chỉ gọi API khi thành công + có mã đơn + chưa gọi lần nào
    if (isSuccess && orderId && !isCalled.current) {
      isCalled.current = true; 
      setIsUpdating(true);

      console.log("Đang gọi API cập nhật trạng thái cho đơn: " + orderId);

      // GỌI API VERIFY VÀ UPDATE DB TẠI ĐÂY
      // Backend sẽ check lại secureHash rồi mới update 'paid'
      // Lưu ý: Bạn cần viết thêm hàm vnpayReturn trong cartApi nhé (xem hướng dẫn bên dưới)
      
      cartApi.vnpayReturn(queryString) 
        .then((res) => {
            console.log("Cập nhật DB thành công:", res);
            setIsUpdating(false);
        })
        .catch((err) => {
            console.error("Lỗi cập nhật DB:", err);
            setIsUpdating(false);
            // Có thể hiện thông báo lỗi nếu cần, nhưng user đã thấy "Thành công" rồi thì thôi
        });
    }
  }, [isSuccess, orderId, queryString]);

  return (
    <div
      style={{
        textAlign: "center",
        paddingTop: "100px",
        minHeight: "60vh",
        backgroundColor: "#f9f9f9",
      }}
    >
      {!responseCode ? (
        <h2>🚫 Không tìm thấy thông tin giao dịch</h2>
      ) : (
        <>
          {isSuccess ? (
            <div style={{ color: "green" }}>
              <h1 style={{ fontSize: "50px", marginBottom: "20px" }}>✅</h1>
              <h2>Thanh toán thành công!</h2>
              
              {/* Hiển thị trạng thái cập nhật DB */}
              {isUpdating ? (
                 <p style={{color: "#ee4d2d"}}>⏳ Đang cập nhật trạng thái đơn hàng...</p>
              ) : (
                 <p style={{color: "green"}}>Đã ghi nhận thanh toán.</p>
              )}

              <p style={{ fontSize: "16px", color: "#555" }}>
                Mã đơn hàng: <b>{orderId}</b>
              </p>
              <p>Cảm ơn bạn đã mua hàng.</p>
              <button
                onClick={() => navigate("/orders")}
                style={{
                  padding: "10px 20px",
                  marginTop: "20px",
                  background: "#ee4d2d",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Xem đơn hàng của tôi
              </button>
            </div>
          ) : (
            <div style={{ color: "red" }}>
              <h1 style={{ fontSize: "50px", marginBottom: "20px" }}>❌</h1>
              <h2>Thanh toán thất bại</h2>
              <p style={{ fontSize: "16px", color: "#555" }}>
                Mã giao dịch: <b>{orderId}</b>
              </p>
              <p>Có lỗi xảy ra hoặc bạn đã hủy giao dịch.</p>
              <button
                onClick={() => navigate("/")}
                style={{
                  padding: "10px 20px",
                  marginTop: "20px",
                  background: "#333",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Quay về trang chủ
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentResult;