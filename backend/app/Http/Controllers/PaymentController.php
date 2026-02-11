<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Order; // Nhớ import model Order

class PaymentController extends Controller
{
    // --- HÀM 1: TẠO URL THANH TOÁN ---
    public function createPayment(Request $request)
    {
        $vnp_TmnCode = env('VNP_TMN_CODE');
        $vnp_HashSecret = env('VNP_HASH_SECRET');
        $vnp_Url = env('VNP_URL');
        $vnp_Returnurl = env('VNP_RETURN_URL');

        $vnp_TxnRef = $request->orderId; 
        $vnp_Amount = $request->amount * 100;
        $vnp_Locale = 'vn';
        $vnp_IpAddr = $request->ip();

        $inputData = array(
            "vnp_Version" => "2.1.0",
            "vnp_TmnCode" => $vnp_TmnCode,
            "vnp_Amount" => $vnp_Amount,
            "vnp_Command" => "pay",
            "vnp_CreateDate" => date('YmdHis'),
            "vnp_CurrCode" => "VND",
            "vnp_IpAddr" => $vnp_IpAddr,
            "vnp_Locale" => $vnp_Locale,
            "vnp_OrderInfo" => "Thanh toan don hang " . $vnp_TxnRef,
            "vnp_OrderType" => "billpayment",
            "vnp_ReturnUrl" => $vnp_Returnurl,
            "vnp_TxnRef" => $vnp_TxnRef,
        );

        if ($request->bankCode) {
            $inputData['vnp_BankCode'] = $request->bankCode;
        }

        ksort($inputData);
        $query = "";
        $i = 0;
        $hashdata = "";

        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashdata .= '&' . urlencode($key) . "=" . urlencode($value);
            } else {
                $hashdata .= urlencode($key) . "=" . urlencode($value);
                $i = 1;
            }
            $query .= urlencode($key) . "=" . urlencode($value) . '&';
        }

        $vnp_Url = $vnp_Url . "?" . $query;
        if (isset($vnp_HashSecret)) {
            $vnpSecureHash = hash_hmac('sha512', $hashdata, $vnp_HashSecret);
            $vnp_Url .= '&vnp_SecureHash=' . $vnpSecureHash;
        }

        return response()->json([
            'paymentUrl' => $vnp_Url
        ]);
    }

    // --- HÀM 2: XỬ LÝ KẾT QUẢ TRẢ VỀ (CALLBACK) ---
    public function vnpayCallback(Request $request)
    {
        $vnp_HashSecret = env('VNP_HASH_SECRET');
        $inputData = array();
        
        // Lấy tất cả tham số vnp_ từ URL
        foreach ($request->all() as $key => $value) {
            if (substr($key, 0, 4) == "vnp_") {
                $inputData[$key] = $value;
            }
        }
        
        // Lấy chữ ký secure hash từ URL ra
        $vnp_SecureHash = $inputData['vnp_SecureHash'] ?? '';
        unset($inputData['vnp_SecureHash']); // Loại bỏ nó khỏi mảng dữ liệu để tính toán lại
        
        ksort($inputData);
        $i = 0;
        $hashData = "";
        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashData = $hashData . '&' . urlencode($key) . "=" . urlencode($value);
            } else {
                $hashData = $hashData . urlencode($key) . "=" . urlencode($value);
                $i = 1;
            }
        }
        
        // Tính toán lại chữ ký
        $secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

        // So sánh chữ ký
        if ($secureHash == $vnp_SecureHash) {
            if ($request->vnp_ResponseCode == '00') {
                // Giao dịch thành công -> Cập nhật DB
                $orderId = $request->vnp_TxnRef;
                
                $order = Order::find($orderId);
                if ($order) {
                    // Kiểm tra xem đơn hàng đã được cập nhật chưa để tránh update 2 lần
                    if($order->payment_status != 'paid'){
                         $order->payment_status = 'paid';
                         $order->status = 'confirmed'; // Chuyển trạng thái đơn hàng
                         $order->save();
                    }
                    
                    return response()->json(['message' => 'Giao dịch thành công', 'data' => $order]);
                }
                return response()->json(['message' => 'Không tìm thấy đơn hàng'], 404);
            }
            return response()->json(['message' => 'Giao dịch không thành công'], 400);
        } else {
            return response()->json(['message' => 'Chữ ký không hợp lệ'], 400);
        }
    }
}