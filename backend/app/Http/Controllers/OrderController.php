<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;

class OrderController extends Controller
{
    public function checkout(Request $request) {
        // 1. Validate dữ liệu
        $request->validate([
            'cart_item_ids' => 'required|array',
            'address_id' => 'required|exists:user_addresses,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'shipping_method_id' => 'required|exists:shipping_methods,id', // Nhớ thêm cái này nếu bảng orders yêu cầu
        ]);

        DB::beginTransaction();
        try {
            $user = Auth::user();
            
            // 2. Lấy sản phẩm từ giỏ
            $items = CartItem::with('sku.product')
                        ->whereIn('id', $request->cart_item_ids)
                        ->whereHas('cart', function($q) use ($user) {
                            $q->where('user_id', $user->id);
                        })
                        ->get();

            if ($items->isEmpty()) {
                return response()->json(['message' => 'Vui lòng chọn sản phẩm hợp lệ'], 400);
            }

            // 3. Gom nhóm theo Shop
            $itemsByShop = $items->groupBy(function($item) {
                return $item->sku->product->shop_id;
            });

            $createdOrderIds = []; // Mảng chứa ID các đơn hàng vừa tạo
            $grandTotal = 0; // Tổng tiền tất cả các đơn (để thanh toán VNPay 1 lần)

            foreach ($itemsByShop as $shopId => $shopItems) {
                $shopTotal = 0;
                
                // Tính tiền hàng và check tồn kho
                foreach ($shopItems as $item) {
                    $shopTotal += $item->sku->price * $item->quantity;
                    
                    if ($item->sku->stock < $item->quantity) {
                         throw new \Exception("Sản phẩm " . $item->sku->product->name . " không đủ hàng.");
                    }
                }

                $shippingFee = 30000; // Phí ship cứng (hoặc tính động tùy bạn)
                $finalTotal = $shopTotal + $shippingFee;
                $grandTotal += $finalTotal; // Cộng dồn vào tổng thanh toán

                // 4. Tạo Order
                $order = Order::create([
                    'user_id' => $user->id,
                    'shop_id' => $shopId,
                    'total_product_price' => $shopTotal,
                    'shipping_fee' => $shippingFee,
                    'final_total' => $finalTotal,
                    'user_address_id' => $request->address_id,
                    'payment_method_id' => $request->payment_method_id,
                    'shipping_method_id' => $request->shipping_method_id ?? 1, // Default nếu ko truyền
                    'status' => 'pending',
                    'payment_status' => 'unpaid' // Mặc định là chưa thanh toán
                ]);

                $createdOrderIds[] = $order->id;

                // 5. Lưu Order Items và Trừ kho
                foreach ($shopItems as $item) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_sku_id' => $item->product_sku_id,
                        'quantity' => $item->quantity,
                        'price' => $item->sku->price
                    ]);
                    
                    $item->sku->decrement('stock', $item->quantity);
                    $item->delete(); // Xóa khỏi giỏ
                }
            }
            
            DB::commit();

            // 6. Xử lý logic trả về cho Frontend
            // Nếu là COD (ID=1) -> Xong luôn
            // Nếu là VNPay (ID=2) -> Trả về thông tin để Frontend gọi tiếp API tạo link
            
            return response()->json([
                'message' => 'Tạo đơn hàng thành công!',
                'order_ids' => $createdOrderIds, // Trả về mảng các ID đơn hàng
                'total_amount' => $grandTotal, // Tổng tiền cần thanh toán VNPay
                'payment_method_id' => $request->payment_method_id
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi: ' . $e->getMessage()], 500);
        }
    }
}