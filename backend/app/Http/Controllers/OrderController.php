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
        // Validate dữ liệu bắt buộc phải có
        $request->validate([
            'cart_item_ids' => 'required|array', // Mảng các ID trong giỏ hàng muốn mua
            'address_id' => 'required|exists:user_addresses,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
        ]);

        DB::beginTransaction(); // Bắt đầu transaction
        try {
            $user = Auth::user();
            
            // Lấy các item user tick chọn mua (Dùng whereIn)
            $items = CartItem::with('sku.product')
                        ->whereIn('id', $request->cart_item_ids)
                        ->get();

            if ($items->isEmpty()) {
                return response()->json(['message' => 'Vui lòng chọn sản phẩm để thanh toán'], 400);
            }

            // Gom nhóm theo Shop ID (Logic tách đơn)
            $itemsByShop = $items->groupBy(function($item) {
                return $item->sku->product->shop_id;
            });

            foreach ($itemsByShop as $shopId => $shopItems) {
                $total = 0;
                foreach ($shopItems as $item) {
                    $total += $item->sku->price * $item->quantity;
                    
                    // Kiểm tra tồn kho ở đây nếu cần
                    if ($item->sku->stock < $item->quantity) {
                         throw new \Exception("Sản phẩm " . $item->sku->product->name . " không đủ hàng.");
                    }
                }

                // Tạo đơn hàng cho từng Shop
                $order = Order::create([
                    'user_id' => $user->id,
                    'shop_id' => $shopId,
                    'total_product_price' => $total,
                    'final_total' => $total + 30000, // Cộng phí ship cứng (demo)
                    'user_address_id' => $request->address_id,
                    'payment_method_id' => $request->payment_method_id,
                    'status' => 'pending'
                ]);

                // Lưu chi tiết đơn hàng (Order Items)
                foreach ($shopItems as $item) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_sku_id' => $item->product_sku_id,
                        'quantity' => $item->quantity,
                        'price' => $item->sku->price // Lưu giá tại thời điểm mua (quan trọng)
                    ]);
                    
                    // Trừ tồn kho
                    $item->sku->decrement('stock', $item->quantity);
                    
                    // Xóa khỏi giỏ hàng sau khi mua xong
                    $item->delete(); 
                }
            }
            
            DB::commit(); // Lưu vào DB
            return response()->json(['message' => 'Đặt hàng thành công!']);
            
        } catch (\Exception $e) {
            DB::rollBack(); // Hoàn tác nếu có lỗi
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}