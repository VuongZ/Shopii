<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Shop;
use Illuminate\Support\Str;

class ShopController extends Controller
{
    // ==============================
    // SELLER TẠO SHOP
    // ==============================
    public function store(Request $request)
    {
        $user = auth()->user();

        if ($user->role !== 'seller') {
            return response()->json([
                'message' => 'Chỉ seller mới được tạo shop'
            ], 403);
        }

        // kiểm tra đã có shop chưa
        $existingShop = Shop::where('user_id', $user->id)->first();

        if ($existingShop) {
            return response()->json([
                'message' => 'Bạn đã có shop rồi'
            ], 400);
        }

        $shop = Shop::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
            'is_verified' => 0
        ]);

        return response()->json([
            'message' => 'Tạo shop thành công, chờ admin duyệt',
            'shop' => $shop
        ]);
    }

    // ==============================
    // ADMIN XEM SHOP CHỜ DUYỆT
    // ==============================
    public function pending()
    {
        $user = auth()->user();

        if ($user->role !== 'admin') {
            return response()->json([
                'message' => 'Không có quyền'
            ], 403);
        }

        return Shop::with('user')
            ->where('is_verified', 0)
            ->get();
    }

    // ==============================
    // ADMIN DUYỆT SHOP
    // ==============================
    public function approve($id)
    {
        $user = auth()->user();

        if ($user->role !== 'admin') {
            return response()->json([
                'message' => 'Không có quyền'
            ], 403);
        }

        $shop = Shop::findOrFail($id);
        $shop->is_verified = 1;
        $shop->save();

        return response()->json([
            'message' => 'Shop đã được duyệt'
        ]);
    }
    public function myShop()
{
    $user = auth()->user();

    $shop = Shop::where('user_id', $user->id)
        ->with([
            'products.product_images',
            'products.skus',
            'products.category'
        ])
        ->first();

    if (!$shop) {
        return response()->json([
            'message' => 'Bạn chưa có shop'
        ], 404);
    }

    return response()->json($shop);
}
}