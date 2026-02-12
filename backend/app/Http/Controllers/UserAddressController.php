<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\UserAddress;

class UserAddressController extends Controller
{
    // Lấy danh sách địa chỉ của user đang đăng nhập
    public function index()
    {
        $user = Auth::user();
        
        // Lấy tất cả địa chỉ, sắp xếp cái mặc định lên đầu
        $addresses = UserAddress::where('user_id', $user->id)
            ->orderBy('is_default', 'desc') 
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($addresses);
    }

    //Thêm địa chỉ
    public function store(Request $request)
    {
        $request->validate([
            'recipient_name' => 'required|string',
            'recipient_phone' => 'required|string',
            'address_detail' => 'required|string',
            'city' => 'required|string',
            'district' => 'required|string',
            'ward' => 'required|string',
        ]);

        $user = Auth::user();

        // Nếu đây là địa chỉ đầu tiên, set nó là mặc định
        $isFirst = UserAddress::where('user_id', $user->id)->doesntExist();

        $address = UserAddress::create([
            'user_id' => $user->id,
            'recipient_name' => $request->recipient_name,
            'recipient_phone' => $request->recipient_phone,
            'address_detail' => $request->address_detail,
            'city' => $request->city,
            'district' => $request->district,
            'ward' => $request->ward,
            'is_default' => $isFirst ? 1 : 0
        ]);

        return response()->json(['message' => 'Thêm địa chỉ thành công', 'data' => $address]);
    }
}