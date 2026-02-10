<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
// Import các Controller
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController; // <-- QUAN TRỌNG: Phải có dòng này
use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// =================================================================
// 1. KHU VỰC CÔNG KHAI (Public Routes - Không cần đăng nhập)
// =================================================================

// Đăng ký & Đăng nhập
Route::post('/register', [AuthController::class, 'register']);
// Thêm ->name('login') để fix lỗi "Route [login] not defined" khi chưa đăng nhập
Route::post('/login', [AuthController::class, 'login'])->name('login');

// Sản phẩm (Để ở đây để Frontend gọi hiển thị trang chủ)
// Lưu ý: Bạn phải chắc chắn đã tạo ProductController và hàm index rồi nhé
Route::get('/products', [ProductController::class, 'index']); 
Route::get('/products/{id}', [ProductController::class, 'show']);



Route::middleware('auth:sanctum')->group(function () {
    
    // Lấy thông tin người dùng hiện tại (để hiển thị Avatar/Tên)
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Giỏ hàng
    Route::get('/cart', [CartController::class, 'getCart']);          // Xem giỏ
    Route::post('/cart/add', [CartController::class, 'addToCart']);   // Thêm vào giỏ
    Route::put('/cart/update', [CartController::class, 'updateCart']); // Sửa số lượng
    Route::delete('/cart/{id}', [CartController::class, 'removeItem']); // Xóa món

    // Thanh toán
    Route::post('/checkout', [OrderController::class, 'checkout']);   // Đặt hàng
});