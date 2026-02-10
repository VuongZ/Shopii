<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Import các Controller
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController; // <-- QUAN TRỌNG: Để lấy sản phẩm
use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;



// 1. KHU VỰC CÔNG KHAI (Không cần đăng nhập)

// Đăng ký
Route::post('/register', [AuthController::class, 'register']);

// Đăng nhập (Thêm name('login') để tránh lỗi hệ thống khi chưa đăng nhập)
Route::post('/login', [AuthController::class, 'login'])->name('login');

// Lấy danh sách sản phẩm (Để frontend hiển thị trang chủ)
Route::get('/products', [ProductController::class, 'index']); 
Route::get('/products/{id}', [ProductController::class, 'show']);



// 2. KHU VỰC BẢO MẬT (Cần Token đăng nhập)

Route::middleware('auth:sanctum')->group(function () {
    
    // Lấy thông tin user đang đăng nhập
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Giỏ hàng
    Route::get('/cart', [CartController::class, 'getCart']);           // Xem giỏ
    Route::post('/cart/add', [CartController::class, 'addToCart']);    // Thêm món
    Route::put('/cart/update', [CartController::class, 'updateCart']); // Sửa số lượng
    Route::delete('/cart/{id}', [CartController::class, 'removeItem']); // Xóa món

    // Thanh toán
    Route::post('/checkout', [OrderController::class, 'checkout']);    // Đặt hàng
});