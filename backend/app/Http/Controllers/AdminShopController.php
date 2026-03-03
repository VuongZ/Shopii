<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Shop; // THÊM DÒNG NÀY

class AdminShopController extends Controller
{
    // Lấy shop chưa duyệt
    public function index()
    {
        return Shop::where('is_verified', 0)->get();
    }

    // Duyệt shop
    public function approve($id)
    {
        $shop = Shop::findOrFail($id);
        $shop->is_verified = 1;
        $shop->save();

        return response()->json([
            'message' => 'Shop đã được duyệt'
        ]);
    }
}