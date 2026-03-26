<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use App\Models\Shop;

class StatisticsController extends Controller
{
    // Admin - Thống kê toàn sàn
    public function adminDashboard()
    {
        $user = auth()->user();

        if ($user->role !== 'admin') {
            return response()->json([
                'message' => 'Không có quyền'
            ], 403);
        }

        // Doanh thu toàn sàn
        $totalRevenue = Order::where('status', 'completed')
            ->sum(DB::raw('total_price'));

        // Số đơn hàng
        $totalOrders = Order::count();

        // Sản phẩm bán chạy (top 5)
        $bestSellers = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->select('products.name', DB::raw('SUM(order_items.quantity) as total_sold'))
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        return response()->json([
            'total_revenue' => $totalRevenue ?? 0,
            'total_orders' => $totalOrders ?? 0,
            'best_sellers' => $bestSellers ?? []
        ]);
    }

    // Seller - Thống kê riêng
    public function sellerDashboard()
    {
        $user = auth()->user();

        // Lấy shop của seller
        $shop = Shop::where('user_id', $user->id)->first();

        if (!$shop) {
            return response()->json([
                'message' => 'Bạn chưa có shop'
            ], 404);
        }

        // Doanh thu của shop
        $revenue = Order::where('shop_id', $shop->id)
            ->where('status', 'completed')
            ->sum(DB::raw('total_price'));

        // Số đơn hàng
        $orders = Order::where('shop_id', $shop->id)->count();

        // Sản phẩm bán chạy
        $bestProducts = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('products.shop_id', $shop->id)
            ->select('products.name', DB::raw('SUM(order_items.quantity) as total_sold'))
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        return response()->json([
            'revenue' => $revenue ?? 0,
            'orders' => $orders ?? 0,
            'best_products' => $bestProducts ?? []
        ]);
    }
}
