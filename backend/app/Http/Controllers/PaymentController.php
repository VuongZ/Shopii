<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Order; // Nhớ import model Order

class PaymentController extends Controller
{
    public function createMoMoPayment(Request $request)
{
    $endpoint = env('MOMO_ENDPOINT');
    $partnerCode = env('MOMO_PARTNER_CODE');
    $accessKey = env('MOMO_ACCESS_KEY');
    $secretKey = env('MOMO_SECRET_KEY');
    $redirectUrl = env('MOMO_REDIRECT_URL');
    $ipnUrl = env('MOMO_IPN_URL');
    
    $orderInfo = "Thanh toan don hang " . $request->orderId;
    $amount = (string)$request->amount; // MoMo yêu cầu amount là string
    $orderId = $request->orderId . "_" . time(); // Tránh trùng mã đơn test
    $requestId = time() . "";
    $requestType = "captureWallet";
    $extraData = ""; 

    // Tạo chữ ký (Signature)
    $rawHash = "accessKey=" . $accessKey .
        "&amount=" . $amount .
        "&extraData=" . $extraData .
        "&ipnUrl=" . $ipnUrl .
        "&orderId=" . $orderId .
        "&orderInfo=" . $orderInfo .
        "&partnerCode=" . $partnerCode .
        "&redirectUrl=" . $redirectUrl .
        "&requestId=" . $requestId .
        "&requestType=" . $requestType;
        
    $signature = hash_hmac("sha256", $rawHash, $secretKey);

    $data = array(
        'partnerCode' => $partnerCode,
        'partnerName' => "Test",
        "storeId" => "MomoTestStore",
        'requestId' => $requestId,
        'amount' => $amount,
        'orderId' => $orderId,
        'orderInfo' => $orderInfo,
        'redirectUrl' => $redirectUrl,
        'ipnUrl' => $ipnUrl,
        'lang' => 'vi',
        'extraData' => $extraData,
        'requestType' => $requestType,
        'signature' => $signature
    );

    // Dùng cURL để gọi API của MoMo
    $ch = curl_init($endpoint);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json',
        'Content-Length: ' . strlen(json_encode($data))
    ));
    
    $result = curl_exec($ch);
    curl_close($ch);

    $jsonResult = json_decode($result, true);

    if (isset($jsonResult['payUrl'])) {
        return response()->json(['paymentUrl' => $jsonResult['payUrl']]);
    }
    
    return response()->json(['message' => 'Lỗi tạo thanh toán MoMo', 'error' => $jsonResult], 400);
}

public function momoCallback(Request $request)
{
    $secretKey = env('MOMO_SECRET_KEY');
    $accessKey = env('MOMO_ACCESS_KEY');
    
    // Check chữ ký MoMo trả về để bảo mật
    $rawHash = "accessKey=" . $accessKey .
        "&amount=" . $request->amount .
        "&extraData=" . $request->extraData .
        "&message=" . $request->message .
        "&orderId=" . $request->orderId .
        "&orderInfo=" . $request->orderInfo .
        "&orderType=" . $request->orderType .
        "&partnerCode=" . $request->partnerCode .
        "&payType=" . $request->payType .
        "&requestId=" . $request->requestId .
        "&responseTime=" . $request->responseTime .
        "&resultCode=" . $request->resultCode .
        "&transId=" . $request->transId;

    $signature = hash_hmac("sha256", $rawHash, $secretKey);

    if ($signature == $request->signature) {
        if ($request->resultCode == '0') {
            // resultCode = 0 là thanh toán thành công
            // Tách mã đơn hàng gốc (vì lúc gửi đi mình có gắn thêm time())
            $originalOrderId = explode('_', $request->orderId)[0];
            
            // XỬ LÝ UPDATE DATABASE GIỐNG VNPAY Ở ĐÂY
            $order = \App\Models\Order::find($originalOrderId);
            if ($order && $order->payment_status != 'paid') {
                $order->payment_status = 'paid';
                $order->status = 'confirmed';
                $order->save();
                
                foreach ($order->items as $item) {
                    $product = $item->product;
                    if ($product) {
                        $product->stock = max(0, $product->stock - $item->quantity);
                        $product->save();
                    }
                }
                return response()->json(['message' => 'Thanh toán thành công']);
            }
        }
        return response()->json(['message' => 'Giao dịch không thành công'], 400);
    }
    return response()->json(['message' => 'Chữ ký không hợp lệ'], 400);
}
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
               $orderIds = explode('-', $request->vnp_TxnRef);

$updated = false;

foreach ($orderIds as $id) {
    $order = Order::find($id);

    if ($order && $order->payment_status != 'paid') {
        $order->payment_status = 'paid';
        $order->status = 'confirmed';
        $order->save();
        $updated = true;

        foreach ($order->items as $item) {
            $product = $item->product;
            if ($product) {
                $product->stock = max(0, $product->stock - $item->quantity);
                $product->save();
            }
        }
    }
}

if ($updated) {
    return response()->json([
        'message' => 'Thanh toán thành công'
    ]);
}

return response()->json([
    'message' => 'Không tìm thấy đơn hàng'
], 404);
            }
            return response()->json(['message' => 'Giao dịch không thành công'], 400);
        } else {
            return response()->json(['message' => 'Chữ ký không hợp lệ'], 400);
        }
    }
}
